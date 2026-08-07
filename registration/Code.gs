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

var SHEET_NAME = 'Registrations';

// Column order in the sheet -> the form field name that fills it.
//
// ADD NEW COLUMNS AT THE END, never in the middle. Rows are written positionally, so
// inserting a column part-way through would silently shift every existing row's data
// one place out of step with the headers. 'Register As' sits after 'Sector' in the
// form but last here, and that is deliberate.
var COLUMNS = [
  ['Timestamp',   null],       // filled with the server time
  ['Name',        'name'],
  ['Sector',      'sector'],
  ['Email',       'email'],
  ['Phone',       'phone'],
  ['City',        'city'],
  ['Register As', 'registerAs'],
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);
  try {
    var sheet = getSheet_();
    var p = (e && e.parameter) || {};
    var row = COLUMNS.map(function (c) {
      return c[1] === null ? new Date() : (p[c[1]] || '');
    });
    writeRow_(sheet, row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, service: 'tier2-rising-registrations' });
}

/** Run this ONCE from the editor to (re)create the header row on a fresh sheet. */
function setupHeaders() {
  var sheet = getSheet_();
  var headers = COLUMNS.map(function (c) { return c[0]; });
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sheet.setFrozenRows(1);
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
function writeRow_(sheet, row) {
  var range = sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length);
  range.setNumberFormats([
    COLUMNS.map(function (c) {
      return c[1] === null ? 'yyyy-mm-dd hh:mm:ss' : '@';
    }),
  ]);
  range.setValues([row]);
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    var headers = COLUMNS.map(function (c) { return c[0]; });
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
