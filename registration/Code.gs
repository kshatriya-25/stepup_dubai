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
var COLUMNS = [
  ['Timestamp', null],       // filled with the server time
  ['Name',      'name'],
  ['Sector',    'sector'],
  ['Email',     'email'],
  ['Phone',     'phone'],
  ['City',      'city'],
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
    sheet.appendRow(row);
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
