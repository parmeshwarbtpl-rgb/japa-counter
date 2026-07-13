/**
 * One-time setup helper.
 * 1. Paste your Web OAuth Client ID below.
 * 2. Run setupSecureAuthentication() once from the Apps Script editor.
 * 3. Approve permissions.
 * 4. Deploy a NEW Web App version.
 */
function setupSecureAuthentication() {
  var googleClientId = '984438160673-ru9ed5qrbh4hrrl63lpliaakn6da6i87.apps.googleusercontent.com';

  if (googleClientId.indexOf('PASTE_YOUR') !== -1) {
    throw new Error('Paste the Google Web Client ID into 99_Auth_Setup.gs first.');
  }

  PropertiesService.getScriptProperties().setProperty(
    'GOOGLE_CLIENT_ID',
    googleClientId
  );

  authEnsureAuditSheets_();
  authEnsureOfflineSyncSheet_();
  Logger.log('Secure authentication is configured. Deploy a new Web App version.');
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
