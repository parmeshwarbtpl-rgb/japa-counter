/**
 * Google ID token verification for Apps Script.
 * The token is verified server-side against Google's tokeninfo endpoint,
 * then cached briefly to reduce network calls and quota usage.
 */

var AUTH_GOOGLE_TOKENINFO_URL_ = 'https://oauth2.googleapis.com/tokeninfo?id_token=';
var AUTH_TOKEN_CACHE_SECONDS_ = 3000;

function authVerifyGoogleIdToken_(idToken) {
  var token = String(idToken || '').trim();
  if (!token) {
    throw authError_('AUTH_REQUIRED', 'Please sign in with Google.');
  }
  if (token.length > 10000) {
    throw authError_('AUTH_INVALID', 'Google credential is invalid.');
  }

  var clientId = String(
    PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID') || ''
  ).trim();

  if (!clientId) {
    throw authError_('SERVER_CONFIG', 'GOOGLE_CLIENT_ID is not configured in Script Properties.');
  }

  var cache = CacheService.getScriptCache();
  var cacheKey = 'gid:' + authSha256Hex_(token).slice(0, 40);
  var cached = cache.get(cacheKey);
  var claims;

  if (cached) {
    claims = JSON.parse(cached);
  } else {
    var response = UrlFetchApp.fetch(
      AUTH_GOOGLE_TOKENINFO_URL_ + encodeURIComponent(token),
      {
        method: 'get',
        muteHttpExceptions: true,
        followRedirects: true
      }
    );

    if (response.getResponseCode() !== 200) {
      throw authError_('AUTH_INVALID', 'Google sign-in could not be verified.');
    }

    try {
      claims = JSON.parse(response.getContentText());
    } catch (error) {
      throw authError_('AUTH_INVALID', 'Google returned an invalid verification response.');
    }

    authValidateGoogleClaims_(claims, clientId);

    var secondsLeft = Math.max(
      60,
      Math.min(
        AUTH_TOKEN_CACHE_SECONDS_,
        Number(claims.exp || 0) - Math.floor(Date.now() / 1000) - 30
      )
    );
    cache.put(cacheKey, JSON.stringify(claims), secondsLeft);
  }

  authValidateGoogleClaims_(claims, clientId);

  return {
    id: String(claims.sub),
    name: String(claims.name || claims.email || 'Google User'),
    email: String(claims.email || '').toLowerCase(),
    issuer: String(claims.iss || '')
  };
}

function authValidateGoogleClaims_(claims, clientId) {
  if (!claims || typeof claims !== 'object') {
    throw authError_('AUTH_INVALID', 'Google credential is invalid.');
  }

  if (String(claims.aud || '') !== clientId) {
    throw authError_('AUTH_INVALID', 'Google credential was issued for a different app.');
  }

  var issuer = String(claims.iss || '');
  if (issuer !== 'accounts.google.com' && issuer !== 'https://accounts.google.com') {
    throw authError_('AUTH_INVALID', 'Google credential issuer is invalid.');
  }

  var expiresAt = Number(claims.exp || 0);
  if (!expiresAt || expiresAt <= Math.floor(Date.now() / 1000) - 30) {
    throw authError_('AUTH_EXPIRED', 'Your Google session expired. Please sign in again.');
  }

  var emailVerified = claims.email_verified === true
    || String(claims.email_verified).toLowerCase() === 'true';
  if (!emailVerified || !claims.email || !claims.sub) {
    throw authError_('AUTH_INVALID', 'A verified Google account is required.');
  }

  var allowedDomain = String(
    PropertiesService.getScriptProperties().getProperty('ALLOWED_EMAIL_DOMAIN') || ''
  ).trim().toLowerCase();

  if (allowedDomain) {
    var email = String(claims.email).toLowerCase();
    if (!email.endsWith('@' + allowedDomain)) {
      throw authError_('AUTH_FORBIDDEN', 'This Google account is not allowed to use the app.');
    }
  }
}

function authPublicUser_(user) {
  return {
    id: String(user.id || ''),
    name: String(user.name || 'Google User'),
    email: String(user.email || '')
  };
}

function authSha256Hex_(value) {
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value),
    Utilities.Charset.UTF_8
  );

  return digest.map(function(byte) {
    var normalized = byte < 0 ? byte + 256 : byte;
    return ('0' + normalized.toString(16)).slice(-2);
  }).join('');
}
