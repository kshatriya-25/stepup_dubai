/**
 * Tier-2 Rising — registration capture.
 *
 * Runs INSIDE your Google Sheet (Extensions -> Apps Script).
 * Receives POSTs from the website's registration form and appends one row per
 * submission. Deploy as a Web App (see REGISTRATION-SETUP.md).
 *
 * The Sheet is your read-only record: only this script (running as you, the
 * owner) writes to it. Share as "Viewer" with anyone who should only read.
 */

// Two forms post here, distinguished by a `type` parameter, so one deployment and one
// /exec URL serve both. Each writes to its own tab.
//
// ADD NEW COLUMNS AT THE END, never in the middle. Rows are written positionally, so
// inserting a column part-way through would silently shift every existing row's data
// one place out of step with the headers. 'Register As' sits after 'Sector' in the
// registration form but last here, and that is deliberate.
var FORMS = {
  registration: {
    sheet: 'Registrations',
    columns: [
      ['Timestamp',   null],       // filled with the server time
      ['Name',        'name'],
      ['Sector',      'sector'],
      ['Email',       'email'],
      ['Phone',       'phone'],
      ['City',        'city'],
      ['Register As', 'registerAs'],
      // Payment columns. Empty for waitlist rows (payment disabled) and filled once a
      // Razorpay payment is captured — see src/lib/payments/fulfil.ts. Payment ID is
      // the one to quote to Razorpay support or a bank in a dispute.
      //
      // 'Ticket' is the pass NAME as sold ("Delegate Pass"); 'Access' is what that pass
      // admitted to on the day it was bought ("Day 2"). Both are stored, rather than
      // deriving one from the other at read time, because a pass's access can change:
      // the Delegate Pass moved from "Day 1 + Day 2" to "Day 2", and a row written
      // before that must keep saying what its buyer was actually sold.
      ['Payment Status', 'paymentStatus'],
      ['Ticket',         'ticket'],
      ['Access',         'access'],
      ['Amount',         'amount'],
      ['Payment ID',     'paymentId'],
      ['Order ID',       'orderId'],
      // IST, as 'YYYY-MM-DD HH:mm:ss' — see sheetStamp() in src/lib/payments/fulfil.ts
      // for why it is not a UTC ISO string. The header names the zone so nobody has to
      // guess whether a late-night row belongs to that day or the next.
      ['Paid At (IST)',  'paidAt'],
    ],
  },
  partner: {
    sheet: 'Partners',
    columns: [
      ['Timestamp',     null],
      ['Business Name', 'businessName'],
      ['Contact Name',  'name'],
      ['Email',         'email'],
      ['Phone',         'phone'],
    ],
  },
};

// Anything without a `type` is a registration — the attendee form predates this split
// and older cached bundles may still post without one.
var DEFAULT_FORM = 'registration';

function doPost(e) {
  var p = (e && e.parameter) || {};

  // Running doPost from the Apps Script editor calls it with no event object, which
  // used to append a row containing nothing but a timestamp. Refuse instead, and say
  // what the person almost certainly meant to run.
  if (!e || !e.parameter || Object.keys(p).length === 0) {
    return json_({
      ok: false,
      error:
        'No form data received. If you ran this from the Apps Script editor, pick ' +
        '"setupHeaders" in the function dropdown instead — doPost only works when a ' +
        'real form POSTs to the /exec URL.',
    });
  }

  var lock = LockService.getScriptLock();
  // Check the RESULT. tryLock() returns false on timeout, and the old code ignored
  // that and carried on unlocked — so two overlapping requests could both pass the
  // duplicate check below and both append. Refusing is correct: the caller retries,
  // and a retry is now free (see findDuplicateRow_).
  if (!lock.tryLock(30000)) {
    return json_({ ok: false, error: 'Busy — another write is in progress. Retry.' });
  }

  try {
    var form = FORMS[p.type] || FORMS[DEFAULT_FORM];
    var sheet = getSheet_(form);
    var row = form.columns.map(function (c) {
      return c[1] === null ? new Date() : (p[c[1]] || '');
    });

    /*
     * IDEMPOTENCY. Do not remove.
     *
     * The caller retries a sheet write it believes failed, and "believes failed"
     * includes "timed out waiting for the response". Apps Script is slow — a /exec
     * round trip is 6-10s on a good day, because every call 302-redirects to
     * googleusercontent.com and cold starts are slower still — so a client timeout
     * lands squarely in the window where the row HAS been written and the caller has
     * simply not heard back yet. It then retries, and writes the row again.
     *
     * That is exactly what happened on the first staging purchase: three attempts,
     * three identical paid rows, and a "paid but NOT recorded" alert for a
     * registration that was recorded three times.
     *
     * The order id is unique per purchase and already in the payload, so a repeat is
     * recognisable. Returning ok:true for one makes the retry a no-op instead of a
     * duplicate — and the caller cannot tell the difference, which is the point.
     */
    var duplicate = findDuplicateRow_(sheet, form, row);
    if (duplicate) {
      return json_({ ok: true, duplicate: true, row: duplicate });
    }

    writeRow_(sheet, form, row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Row number of an existing row with this payload's Order ID, or 0 for none.
 *
 * Only applies to forms that HAVE an orderId column and to payloads that carry one:
 * a partner enquiry has no order, and neither does a free registration, so those are
 * never deduplicated and two genuine submissions from one person both land.
 *
 * Called while the script lock is held, so a concurrent retry cannot slip between the
 * check and the write.
 */
function findDuplicateRow_(sheet, form, row) {
  var idx = -1;
  for (var i = 0; i < form.columns.length; i++) {
    if (form.columns[i][1] === 'orderId') { idx = i; break; }
  }
  if (idx < 0) return 0;

  var orderId = String(row[idx] || '').trim();
  if (!orderId) return 0;

  var last = sheet.getLastRow();
  if (last < 2) return 0; // headers only

  var values = sheet.getRange(2, idx + 1, last - 1, 1).getValues();
  for (var r = 0; r < values.length; r++) {
    if (String(values[r][0]).trim() === orderId) return r + 2;
  }
  return 0;
}

function doGet() {
  return json_({ ok: true, service: 'tier2-rising-registrations', forms: Object.keys(FORMS) });
}

/**
 * Run this from the editor after changing COLUMNS. It writes row 1 ONLY — the range is
 * getRange(1, 1, 1, n), so no data row can be reached by it. Adding columns to the end
 * therefore leaves every existing row exactly where it is, with the new cells blank.
 *
 * SAFE BY DEFAULT. It refuses to run if the change would do anything other than append:
 *
 *   - renaming or reordering an existing column, which leaves the data underneath it
 *     unmoved and now filed under the wrong heading. That is silent corruption — the
 *     sheet still looks fine, and every row is subtly wrong.
 *   - shortening the list, which strands populated columns under a stale header.
 *
 * In either case it logs the exact before/after and stops without writing. If the change
 * really is intended, move the data yourself first, then run setupHeadersForce().
 */
function setupHeaders() {
  applyHeaders_(false);
}

/**
 * setupHeaders() with the guard disabled — for a deliberate rename or reorder, AFTER you
 * have moved the existing data to match. Take File -> Make a copy first. There is no
 * undo for a script write beyond Sheets' own version history.
 */
function setupHeadersForce() {
  applyHeaders_(true);
}

function applyHeaders_(force) {
  Object.keys(FORMS).forEach(function (key) {
    var form = FORMS[key];
    var sheet = getSheet_(form);
    var headers = form.columns.map(function (c) { return c[0]; });

    // What is on the sheet right now. Read the full width, not headers.length, so a
    // column being REMOVED is visible to the check rather than falling outside it.
    var width = Math.max(sheet.getLastColumn(), headers.length);
    var existing = sheet.getRange(1, 1, 1, width).getValues()[0].map(function (v) {
      return String(v == null ? '' : v).trim();
    });

    var conflicts = [];
    for (var i = 0; i < width; i++) {
      var was = existing[i] || '';
      var now = headers[i] || '';
      // An empty existing cell is a genuinely new column: appending is always safe.
      if (was && was !== now) {
        conflicts.push('  col ' + columnLetter_(i + 1) + ': "' + was + '" -> "' + (now || '(removed)') + '"');
      }
    }

    if (conflicts.length && !force) {
      Logger.log(
        'Tab "%s": REFUSING to rewrite headers — %s existing column(s) would change ' +
          'meaning, and the data underneath them would NOT move:\n%s\n' +
          'Rows on this tab: %s. Nothing has been written. If this is intended, move the ' +
          'data to match first, then run setupHeadersForce().',
        form.sheet,
        conflicts.length,
        conflicts.join('\n'),
        Math.max(sheet.getLastRow() - 1, 0),
      );
      return;
    }

    var added = [];
    for (var j = 0; j < headers.length; j++) {
      if (!existing[j]) added.push(headers[j]);
    }

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    // Shows up in the editor's Execution log, so you can see it actually ran.
    Logger.log(
      'Tab "%s" ready with %s columns: %s\n  data rows untouched: %s\n  columns added: %s',
      form.sheet,
      headers.length,
      headers.join(' | '),
      Math.max(sheet.getLastRow() - 1, 0),
      added.length ? added.join(', ') : 'none',
    );
  });
}

/** 1 -> A, 27 -> AA. Only used to make the conflict log point at a real column. */
function columnLetter_(n) {
  var s = '';
  while (n > 0) {
    var r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/**
 * Append one row, forcing every non-timestamp cell to be plain TEXT.
 *
 * Do NOT go back to sheet.appendRow(). It parses values the same way typing into the
 * grid does, so a phone number like "+91 98765 43210" is read as a formula and the
 * cell renders "#ERROR! Formula parse error". Setting the number format to '@' before
 * writing tells Sheets to store the value verbatim.
 *
 * This protects every text column, not just Phone — a name or sector beginning with
 * '=', '+', '-' or '@' would hit exactly the same problem.
 */
function writeRow_(sheet, form, row) {
  var range = sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length);
  range.setNumberFormats([
    form.columns.map(function (c) {
      return c[1] === null ? 'yyyy-mm-dd hh:mm:ss' : '@';
    }),
  ]);
  range.setValues([row]);
}

function getSheet_(form) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(form.sheet) || ss.insertSheet(form.sheet);
  if (sheet.getLastRow() === 0) {
    var headers = form.columns.map(function (c) { return c[0]; });
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
