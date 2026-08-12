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
      ['Payment Status', 'paymentStatus'],
      ['Ticket',         'ticket'],
      ['Amount',         'amount'],
      ['Payment ID',     'paymentId'],
      ['Order ID',       'orderId'],
      ['Paid At',        'paidAt'],
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
  lock.tryLock(30000);
  try {
    var form = FORMS[p.type] || FORMS[DEFAULT_FORM];
    var sheet = getSheet_(form);
    var row = form.columns.map(function (c) {
      return c[1] === null ? new Date() : (p[c[1]] || '');
    });
    writeRow_(sheet, form, row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, service: 'tier2-rising-registrations', forms: Object.keys(FORMS) });
}

/**
 * Run this ONCE from the editor after changing COLUMNS. It rewrites row 1 on BOTH
 * tabs, creating the Partners tab if it doesn't exist yet. Existing data rows are
 * untouched — only the header is rewritten.
 */
function setupHeaders() {
  Object.keys(FORMS).forEach(function (key) {
    var form = FORMS[key];
    var sheet = getSheet_(form);
    var headers = form.columns.map(function (c) { return c[0]; });
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    // Shows up in the editor's Execution log, so you can see it actually ran.
    Logger.log('Tab "%s" ready with %s columns: %s', form.sheet, headers.length, headers.join(' | '));
  });
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
