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

exports.api= functions.https.onRequest((req, res)=> {
  switch (req.method) {
    case "GET":
      res.json({
        succes: true,
        type: 'get',
        msg: "It was a get request"
      });
      break;
  
    case "POST":
      const body= req.body;
      
      res.json({
        success: true,
        type: 'post',
        msg: "It was a post request",
        body
      });
      break;

    case "DELETE":
      res.json({
        success: true,
        type: 'delete',
        msg: "It was a delete request"
      });
      break;
    
    default:
      res.json({
        success: true,
        type: 'default',
        msg: "It was a default request"
      });
      break;
  }
});

exports.scheduledFunction = functions.pubsub.schedule('0 22 * * *').onRun( async(context) => {
  const doc= db.collection('schedule').doc('19950120');

  await doc.update({
    update: admin.firestore.FieldValue.increment(1),
    time: admin.firestore.Timestamp.now()
  });
});
