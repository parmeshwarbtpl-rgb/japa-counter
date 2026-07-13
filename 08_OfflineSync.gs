/**
 * Idempotent operation register for durable offline synchronization.
 *
 * Each client operation has a unique ID. A completed ID is never applied twice.
 * Raw device IDs and Google tokens are not stored here.
 */

var AUTH_SYNC_SHEET_ = 'Sync_Operations';
var AUTH_SYNC_HEADERS_ = [
  'Operation ID', 'User ID', 'Device Key', 'Type', 'Value',
  'Client Created At', 'Local Date', 'Status', 'Started At',
  'Completed At', 'Result JSON', 'Error'
];

function authEnsureOfflineSyncSheet_() {
  var ss = authGetSpreadsheet_();
  return authEnsureSheet_(ss, AUTH_SYNC_SHEET_, AUTH_SYNC_HEADERS_);
}

function authOperationId_(params) {
  var id = String(
    (params && (params.operationId || params.batchId)) || ''
  ).trim();

  if (!id) return '';
  if (!/^[A-Za-z0-9:_-]{10,160}$/.test(id)) {
    throw authError_('BAD_REQUEST', 'Invalid sync operation ID.');
  }
  return id;
}

function authFindSyncRow_(sheet, operationId, userId) {
  if (!sheet || sheet.getLastRow() < 2) return null;
  var range = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1);
  var match = range.createTextFinder(operationId).matchEntireCell(true).findNext();
  if (!match) return null;

  var row = match.getRow();
  var values = sheet.getRange(row, 1, 1, AUTH_SYNC_HEADERS_.length).getValues()[0];
  if (String(values[1]) !== String(userId)) {
    throw authError_('AUTH_FORBIDDEN', 'Sync operation belongs to another user.');
  }
  return { row: row, values: values };
}

function authParseStoredResult_(value) {
  var text = String(value || '').trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

function authBeginSyncOperation_(sheet, session, operationId, type, value, params) {
  var existing = authFindSyncRow_(sheet, operationId, session.user.id);
  if (existing) {
    var status = String(existing.values[7] || '').toUpperCase();
    if (status === 'DONE') {
      return {
        duplicate: true,
        result: authParseStoredResult_(existing.values[10]) || authNormalizeLegacyResult_(getDashboard())
      };
    }
    if (status === 'PROCESSING') {
      throw authError_('SYNC_PENDING', 'This saved operation is still being processed. Please retry shortly.');
    }
    // ERROR rows are retried with the same ID. The row is reused.
    sheet.getRange(existing.row, 4, 1, 9).setValues([[
      type,
      authSheetSafeText_(value),
      authSheetSafeText_(params.clientCreatedAt || ''),
      authSheetSafeText_(params.localDate || ''),
      'PROCESSING',
      new Date(),
      '',
      '',
      ''
    ]]);
    return { duplicate: false, row: existing.row };
  }

  sheet.appendRow([
    authSheetSafeText_(operationId),
    authSheetSafeText_(session.user.id),
    authSheetSafeText_(session.deviceKey),
    authSheetSafeText_(type),
    authSheetSafeText_(value),
    authSheetSafeText_(params.clientCreatedAt || ''),
    authSheetSafeText_(params.localDate || ''),
    'PROCESSING',
    new Date(),
    '',
    '',
    ''
  ]);

  return { duplicate: false, row: sheet.getLastRow() };
}

function authFinishSyncOperation_(sheet, row, result) {
  sheet.getRange(row, 8, 1, 4).setValues([[
    'DONE',
    sheet.getRange(row, 9).getValue() || new Date(),
    new Date(),
    JSON.stringify(result === undefined ? {} : result)
  ]]);
  sheet.getRange(row, 12).setValue('');
}

function authFailSyncOperation_(sheet, row, error) {
  if (!row) return;
  sheet.getRange(row, 8).setValue('ERROR');
  sheet.getRange(row, 12).setValue(
    authLimitedText_(error && error.message ? error.message : error, 300)
  );
}

function authProcessCountOperation_(session, params) {
  var operationId = authOperationId_(params);
  var increment = Math.max(1, Math.min(100000, Number(params.num || 1)));

  // Legacy clients without an operation ID remain supported.
  if (!operationId) {
    var legacyResult = authNormalizeLegacyResult_(addCount(increment));
    var legacyDashboard = authGetDashboardSnapshot_(legacyResult);
    authLogActivity_(session, 'ADD_COUNT', legacyDashboard.mantra || '', increment, legacyDashboard, '');
    return legacyResult;
  }

  var lock = LockService.getUserLock();
  lock.waitLock(30000);
  var sheet;
  var registration;

  try {
    sheet = authEnsureOfflineSyncSheet_();
    registration = authBeginSyncOperation_(
      sheet,
      session,
      operationId,
      'COUNT',
      increment,
      params || {}
    );

    if (registration.duplicate) return registration.result;

    var result = authNormalizeLegacyResult_(addCount(increment));
    authFinishSyncOperation_(sheet, registration.row, result);

    var dashboard = authGetDashboardSnapshot_(result);
    authLogActivity_(
      session,
      'ADD_COUNT',
      String(params.mantra || dashboard.mantra || ''),
      increment,
      dashboard,
      'Synced operation ' + operationId + (params.localDate ? ' | client date ' + params.localDate : '')
    );
    return result;
  } catch (error) {
    authFailSyncOperation_(sheet, registration && registration.row, error);
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function authProcessMantraOperation_(session, params, mantra) {
  var operationId = authOperationId_(params);

  if (!operationId) {
    var legacyResult = authNormalizeLegacyResult_(saveMantra(mantra));
    var legacyDashboard = authGetDashboardSnapshot_(legacyResult);
    legacyDashboard.mantra = mantra;
    authLogActivity_(session, 'MANTRA_CHANGE', mantra, 0, legacyDashboard, 'Selected mantra changed');
    return legacyResult;
  }

  var lock = LockService.getUserLock();
  lock.waitLock(30000);
  var sheet;
  var registration;

  try {
    sheet = authEnsureOfflineSyncSheet_();
    registration = authBeginSyncOperation_(
      sheet,
      session,
      operationId,
      'MANTRA',
      mantra,
      params || {}
    );

    if (registration.duplicate) return registration.result;

    var result = authNormalizeLegacyResult_(saveMantra(mantra));
    authFinishSyncOperation_(sheet, registration.row, result);

    var dashboard = authGetDashboardSnapshot_(result);
    dashboard.mantra = mantra;
    authLogActivity_(
      session,
      'MANTRA_CHANGE',
      mantra,
      0,
      dashboard,
      'Synced operation ' + operationId + (params.localDate ? ' | client date ' + params.localDate : '')
    );
    return result;
  } catch (error) {
    authFailSyncOperation_(sheet, registration && registration.row, error);
    throw error;
  } finally {
    lock.releaseLock();
  }
}
