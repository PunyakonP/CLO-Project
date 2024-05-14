const apiKeyAuth = require('api-key-auth');

function getSecret(keyId, done) {
    if (!apiKeys.has(keyId)) {
      return done(new Error('Unknown api key'));
    }
    const clientApp = apiKeys.get(keyId);
    done(null, clientApp.secret, {
      id: clientApp.id,
      name: clientApp.name
    });
  }