const admin = require('firebase-admin');

let app;
if (!admin.apps || admin.apps.length === 0) {
  const serviceAccount = require('./serviceAccount.json');
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  app = admin.apps[0];
}

module.exports = admin;