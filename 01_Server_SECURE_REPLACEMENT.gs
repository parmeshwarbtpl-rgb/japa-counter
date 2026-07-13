/**
 * Naam Jaap Counter v2.3 - Secure authenticated API router.
 *
 * IMPORTANT:
 * Replace the old doGet router in 01_Server.gs with this file's contents.
 * The old public GET action router must not remain active, otherwise users can
 * bypass Google authentication by calling the legacy GET endpoints directly.
 */

function doGet() {
  return authJsonResponse_({
    success: true,
    service: 'Naam Jaap Counter Secure API',
    version: '2.3.0-auth-safe',
    authRequired: true,
    message: 'Use authenticated POST requests.'
  });
}

function doPost(e) {
  try {
    var request = authParsePostRequest_(e);
    var action = String(request.action || '').trim();
    var params = request.params && typeof request.params === 'object'
      ? request.params
      : {};

    if (!action) {
      throw authError_('BAD_REQUEST', 'API action is required.');
    }

    var user = authVerifyGoogleIdToken_(request.idToken);
    var session = authRegisterAuthenticatedRequest_(user, request.device || {}, action);
    var data = authDispatchAction_(action, params, session);

    return authJsonResponse_({
      success: true,
      data: data,
      user: authPublicUser_(user),
      deviceKey: session.deviceKey
    });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return authJsonResponse_({
      success: false,
      code: error && error.code ? error.code : 'SERVER_ERROR',
      message: authSafeErrorMessage_(error)
    });
  }
}

function authParsePostRequest_(e) {
  var contents = e && e.postData && e.postData.contents
    ? String(e.postData.contents)
    : '';

  if (!contents) {
    throw authError_('BAD_REQUEST', 'Request body is empty.');
  }

  try {
    var parsed = JSON.parse(contents);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid object');
    }
    return parsed;
  } catch (error) {
    throw authError_('BAD_REQUEST', 'Request body must contain valid JSON.');
  }
}

function authDispatchAction_(action, params, session) {
  switch (action) {
    case 'authenticate':
      authLogActivity_(session, 'LOGIN', '', 0, null, 'Verified Google login');
      return {
        user: authPublicUser_(session.user),
        deviceKey: session.deviceKey
      };

    case 'getDashboard':
      return authNormalizeLegacyResult_(getDashboard());

    case 'addCount': {
      var increment = Math.max(1, Math.min(1000, Number(params.num || 1)));
      var addResult = authNormalizeLegacyResult_(addCount(increment));
      var addDashboard = authGetDashboardSnapshot_(addResult);
      authLogActivity_(
        session,
        'ADD_COUNT',
        addDashboard.mantra || '',
        increment,
        addDashboard,
        ''
      );
      return addResult;
    }

    case 'saveMantra': {
      var mantra = authSanitizeMantra_(
        params.mantra || params.selectedMantra || params.value || ''
      );
      if (!mantra) {
        throw authError_('BAD_REQUEST', 'A valid mantra is required.');
      }

      var mantraResult = authNormalizeLegacyResult_(saveMantra(mantra));
      var mantraDashboard = authGetDashboardSnapshot_(mantraResult);
      mantraDashboard.mantra = mantra;
      authLogActivity_(
        session,
        'MANTRA_CHANGE',
        mantra,
        0,
        mantraDashboard,
        'Selected mantra changed'
      );
      return mantraResult;
    }

    case 'resetToday': {
      var todayResult = authNormalizeLegacyResult_(resetToday());
      var todayDashboard = authGetDashboardSnapshot_(todayResult);
      authLogActivity_(
        session,
        'RESET_TODAY',
        todayDashboard.mantra || '',
        0,
        todayDashboard,
        'Today counter reset'
      );
      return todayResult;
    }

    case 'resetAll': {
      var allResult = authNormalizeLegacyResult_(resetAll());
      var allDashboard = authGetDashboardSnapshot_(allResult);
      authLogActivity_(
        session,
        'RESET_ALL',
        allDashboard.mantra || '',
        0,
        allDashboard,
        'Lifetime counter reset'
      );
      return allResult;
    }

    case 'getHistory': {
      var limit = Math.max(1, Math.min(500, Number(params.limit || 100)));
      return authGetUserActivity_(session.user.id, limit);
    }

    default:
      throw authError_('BAD_REQUEST', 'Unsupported API action.');
  }
}

function authGetDashboardSnapshot_(candidate) {
  var snapshot = authExtractDashboard_(candidate);
  if (snapshot.today !== null && snapshot.lifetime !== null) {
    return snapshot;
  }

  try {
    return authExtractDashboard_(authNormalizeLegacyResult_(getDashboard()));
  } catch (error) {
    return snapshot;
  }
}

function authExtractDashboard_(payload) {
  var data = payload;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    data = data.data || data.dashboard || data.result || data;
  }
  data = data && typeof data === 'object' ? data : {};

  return {
    today: authFiniteNumberOrNull_(
      data.today !== undefined ? data.today
        : data.todayCount !== undefined ? data.todayCount
          : data.daily !== undefined ? data.daily
            : data.count
    ),
    lifetime: authFiniteNumberOrNull_(
      data.lifetime !== undefined ? data.lifetime
        : data.life !== undefined ? data.life
          : data.lifetimeCount !== undefined ? data.lifetimeCount
            : data.total
    ),
    mantra: String(data.mantra || data.selectedMantra || '').trim()
  };
}

function authNormalizeLegacyResult_(value) {
  if (value && typeof value.getContent === 'function') {
    var content = value.getContent();
    try {
      return JSON.parse(content);
    } catch (error) {
      return { message: content };
    }
  }
  return value === undefined ? {} : value;
}

function authFiniteNumberOrNull_(value) {
  var number = Number(value);
  return isFinite(number) ? number : null;
}

function authSanitizeMantra_(value) {
  var text = String(value || '').trim();
  if (!text || text.length > 200) return '';
  return text;
}

function authJsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function authError_(code, message) {
  var error = new Error(message);
  error.code = code;
  return error;
}

function authSafeErrorMessage_(error) {
  if (!error) return 'Unexpected server error.';
  if (error.code) return String(error.message || 'Request failed.');
  return 'The server could not complete the request.';
}
