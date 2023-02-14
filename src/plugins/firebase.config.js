var admin = require("firebase-admin");
var serviceAccount = require("../../firebaseservice.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ssup-meals-default-rtdb.asia-southeast1.firebasedatabase.app"
});
var db = admin.database();
module.exports={db}