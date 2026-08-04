/**
 * Tier-2 Rising — registration capture.
 *
 * This runs INSIDE a Google Sheet (Extensions → Apps Script).
 * It receives POSTs from the website's registration form and appends
 * one row per submission. Deploy it as a Web App (see REGISTRATION-SETUP.md).
 *
 * The Sheet is your read-only record: only THIS script (running as you, the
 * owner) writes to it. Share the Sheet as "Viewer" with anyone who should
 * only read the entries.
 */

var SHEET_NAME = 'Registrations';
var HEADERS = ['Timestamp', 'Full name', 'Mobile', 'City', 'Email', 'Role'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000); // avoid two submissions writing the same row

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    // Write the header row once.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    var p = (e && e.parameter) || {};
    sheet.appendRow([
      new Date(),
      p.name || '',
      p.mobile || '',
      p.city || '',
      p.email || '',
      p.role || '',
    ]);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// A GET just confirms the endpoint is live (open the /exec URL in a browser).
function doGet() {
  return json({ ok: true, service: 'tier2-rising-registrations' });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
