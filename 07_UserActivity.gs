/**
 * User, device, and activity audit trail.
 * Raw device IDs and Google ID tokens are never written to Sheets.
 */

var AUTH_USERS_SHEET_ = 'Users';
var AUTH_DEVICES_SHEET_ = 'Devices';
var AUTH_ACTIVITY_SHEET_ = 'User_Activity';

var AUTH_USERS_HEADERS_ = [
  'User ID', 'Name', 'Email', 'First Login', 'Last Login',
  'Login Count', 'Last Device Key', 'Status'
];

var AUTH_DEVICES_HEADERS_ = [
  'Device Key', 'User ID', 'Name', 'Email', 'Device Type', 'Platform',
  'Browser', 'Language', 'Time Zone', 'Screen', 'App Version',
  'First Seen', 'Last Seen', 'Request Count'
];

var AUTH_ACTIVITY_HEADERS_ = [
  'Timestamp', 'Date', 'Time', 'User ID', 'Name', 'Email', 'Device Key',
  'Action', 'Mantra', 'Increment', 'Today Count', 'Lifetime Count', 'Details'
];

function authRegisterAuthenticatedRequest_(user, device, action) {
  var deviceKey = authHashDeviceId_(device && device.deviceId);
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    authEnsureAuditSheets_();
    var userRecord = authUpsertUser_(user, deviceKey, action === 'authenticate');
    if (String(userRecord.status || 'ACTIVE').toUpperCase() === 'BLOCKED') {
      throw authError_('AUTH_FORBIDDEN', 'This account has been blocked by the administrator.');
    }
    authUpsertDevice_(user, deviceKey, device || {});
  } finally {
    lock.releaseLock();
  }

  return {
    user: user,
    deviceKey: deviceKey
  };
}

function authGetSpreadsheet_() {
  var spreadsheetId = String(
    PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || ''
  ).trim();

  if (spreadsheetId) {
    return SpreadsheetApp.openById(spreadsheetId);
  }

  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    throw authError_('SERVER_CONFIG', 'Set SPREADSHEET_ID in Script Properties.');
  }
  return active;
}

function authEnsureAuditSheets_() {
  var ss = authGetSpreadsheet_();
  authEnsureSheet_(ss, AUTH_USERS_SHEET_, AUTH_USERS_HEADERS_);
  authEnsureSheet_(ss, AUTH_DEVICES_SHEET_, AUTH_DEVICES_HEADERS_);
  authEnsureSheet_(ss, AUTH_ACTIVITY_SHEET_, AUTH_ACTIVITY_HEADERS_);
}

function authEnsureSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#fff0e3');
  }
  return sheet;
}

function authUpsertUser_(user, deviceKey, isLogin) {
  var sheet = authGetSpreadsheet_().getSheetByName(AUTH_USERS_SHEET_);
  var values = sheet.getDataRange().getValues();
  var now = new Date();
  var rowIndex = -1;

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(user.id)) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    sheet.appendRow([
      authSheetSafeText_(user.id),
      authSheetSafeText_(user.name),
      authSheetSafeText_(user.email),
      now,
      now,
      isLogin ? 1 : 0,
      authSheetSafeText_(deviceKey),
      'ACTIVE'
    ]);
    return { status: 'ACTIVE' };
  }

  var current = sheet.getRange(rowIndex, 1, 1, AUTH_USERS_HEADERS_.length).getValues()[0];
  var status = String(current[7] || 'ACTIVE').toUpperCase();
  sheet.getRange(rowIndex, 2, 1, 6).setValues([[
    authSheetSafeText_(user.name),
    authSheetSafeText_(user.email),
    current[3] || now,
    isLogin ? now : (current[4] || now),
    Number(current[5] || 0) + (isLogin ? 1 : 0),
    authSheetSafeText_(deviceKey)
  ]]);
  return { status: status };
}

function authUpsertDevice_(user, deviceKey, device) {
  var sheet = authGetSpreadsheet_().getSheetByName(AUTH_DEVICES_SHEET_);
  var values = sheet.getDataRange().getValues();
  var now = new Date();
  var rowIndex = -1;

  for (var i = 1; i < values.length; i++) {
    if (
      String(values[i][0]) === deviceKey
      && String(values[i][1]) === String(user.id)
    ) {
      rowIndex = i + 1;
      break;
    }
  }

  var row = [
    authSheetSafeText_(deviceKey),
    authSheetSafeText_(user.id),
    authSheetSafeText_(user.name),
    authSheetSafeText_(user.email),
    authLimitedText_(device.deviceType, 40),
    authLimitedText_(device.platform, 80),
    authLimitedText_(device.browser, 80),
    authLimitedText_(device.language, 30),
    authLimitedText_(device.timezone, 80),
    authLimitedText_(device.screen, 30),
    authLimitedText_(device.appVersion, 40),
    now,
    now,
    1
  ];

  if (rowIndex === -1) {
    sheet.appendRow(row);
    return;
  }

  var current = sheet.getRange(rowIndex, 1, 1, AUTH_DEVICES_HEADERS_.length).getValues()[0];
  row[11] = current[11] || now;
  row[13] = Number(current[13] || 0) + 1;
  sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
}

function authLogActivity_(session, action, mantra, increment, dashboard, details) {
  var sheet = authGetSpreadsheet_().getSheetByName(AUTH_ACTIVITY_SHEET_);
  if (!sheet) {
    authEnsureAuditSheets_();
    sheet = authGetSpreadsheet_().getSheetByName(AUTH_ACTIVITY_SHEET_);
  }

  var now = new Date();
  var timezone = Session.getScriptTimeZone() || 'Asia/Kolkata';
  var today = dashboard && dashboard.today !== null ? dashboard.today : '';
  var lifetime = dashboard && dashboard.lifetime !== null ? dashboard.lifetime : '';

  sheet.appendRow([
    now,
    Utilities.formatDate(now, timezone, 'dd/MM/yyyy'),
    Utilities.formatDate(now, timezone, 'hh:mm:ss a'),
    authSheetSafeText_(session.user.id),
    authSheetSafeText_(session.user.name),
    authSheetSafeText_(session.user.email),
    authSheetSafeText_(session.deviceKey),
    authSheetSafeText_(action),
    authLimitedText_(mantra, 200),
    Number(increment || 0),
    today,
    lifetime,
    authLimitedText_(details, 300)
  ]);
}

function authGetUserActivity_(userId, limit) {
  var sheet = authGetSpreadsheet_().getSheetByName(AUTH_ACTIVITY_SHEET_);
  if (!sheet || sheet.getLastRow() < 2) return [];

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, AUTH_ACTIVITY_HEADERS_.length).getValues();
  var result = [];

  for (var i = values.length - 1; i >= 0 && result.length < limit; i--) {
    var row = values[i];
    if (String(row[3]) !== String(userId)) continue;
    if (String(row[7]) === 'LOGIN') continue;

    result.push({
      date: String(row[1] || ''),
      time: String(row[2] || ''),
      mantra: String(row[8] || 'Mantra Jaap'),
      count: Number(row[10] || 0),
      increment: Number(row[9] || 0),
      action: String(row[7] || 'ADD_COUNT'),
      deviceKey: String(row[6] || '')
    });
  }

  return result;
}

function authHashDeviceId_(deviceId) {
  var raw = String(deviceId || '').trim();
  if (!raw || raw.length > 200) {
    throw authError_('BAD_REQUEST', 'A valid device identifier is required.');
  }

  var properties = PropertiesService.getScriptProperties();
  var pepper = properties.getProperty('DEVICE_HASH_PEPPER');
  if (!pepper) {
    pepper = Utilities.getUuid() + Utilities.getUuid();
    properties.setProperty('DEVICE_HASH_PEPPER', pepper);
  }

  return authSha256Hex_(pepper + ':' + raw).slice(0, 24);
}

function authSheetSafeText_(value) {
  var text = String(value === undefined || value === null ? '' : value);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}

function authLimitedText_(value, maxLength) {
  return authSheetSafeText_(String(value || '').trim().slice(0, maxLength));
}
