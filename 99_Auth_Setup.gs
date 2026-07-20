/**
 * One-time setup helper.
 * 1. Paste your Web OAuth Client ID below.
 * 2. Run setupSecureAuthentication() once from the Apps Script editor.
 * 3. Approve permissions.
 * 4. Deploy a NEW Web App version.
 */
function setupSecureAuthentication() {
  var googleClientId =
    '205720505540-ncjatpfsvr91pcebl9mkd5obum3cjf62.apps.googleusercontent.com';

  googleClientId = String(googleClientId || '').trim();

  if (
    !googleClientId ||
    googleClientId.indexOf('PASTE_YOUR') !== -1 ||
    !googleClientId.endsWith('.apps.googleusercontent.com')
  ) {
    throw new Error(
      '205720505540-ncjatpfsvr91pcebl9mkd5obum3cjf62.apps.googleusercontent.com'
    );
  }

  PropertiesService
    .getScriptProperties()
    .setProperty('GOOGLE_CLIENT_ID', googleClientId);

  authEnsureAuditSheets_();
  authEnsureOfflineSyncSheet_();

  Logger.log(
    'Secure authentication configured with Client ID: ' +
    googleClientId
  );
}
/** Optional: restrict login to one Google Workspace domain. */
function setAllowedEmailDomain() {
  var domain = ''; // Example: example.com. Leave empty to allow any Google account.
  PropertiesService.getScriptProperties().setProperty(
    'ALLOWED_EMAIL_DOMAIN',
    String(domain || '').trim().toLowerCase()
  );
}

/** Optional for a standalone Apps Script project not bound to the Sheet. */
function setAuthSpreadsheetId() {
  var spreadsheetId = ''; // Paste the Google Sheet ID between the quotes.
  if (!spreadsheetId) {
    throw new Error('Paste the Google Sheet ID first.');
  }
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', spreadsheetId);
}
