const functions = require("firebase-functions");
const admin= require('firebase-admin');

admin.initializeApp();

const db= admin.firestore();

// exports.onFileChange = functions.storage.object().onFinaize(evt => {
//   console.log(evt);
//   return;
// });

// exports.onFileDelete= functions.storage.object().onDelete(evt => {
//     console.log(evt);
//     return
// });

exports.scheduledFunction = functions.pubsub.schedule('0 22 * * *').onRun( async(context) => {
  const doc= db.collection('schedule').doc('19950120');

  await doc.update({
    update: admin.firestore.FieldValue.increment(1),
    time: admin.firestore.Timestamp.now()
  });
});
