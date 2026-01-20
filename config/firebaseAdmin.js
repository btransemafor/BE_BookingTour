const admin = require("firebase-admin");

const serviceAccount = require("../omgnicetv-be2f0-firebase-adminsdk-fbsvc-c4847fabcf.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
