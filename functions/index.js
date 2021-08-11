const functions = require("firebase-functions");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.onFileChange = functions.storage.object().onFinalize(evt => {
  console.log(evt);
  return;
});

exports.onFileDelete= functions.storage.object().onDelete(evt => {
    console.log(evt);
    return
})