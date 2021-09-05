const functions = require("firebase-functions");
const admin= require('firebase-admin');
const axios= require('axios');


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

exports.api= functions.https.onRequest( async (req, res)=> {
  switch (req.method) {
    case "GET":
      const response= await axios.get('http://jsonplaceholder.typicode.com/users/1');
      
      res.json({
        succes: true,
        type: 'get',
        msg: "It was a get request",
        data: response.data,
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


//Eventos de autenticacion
exports.userAdedd= functions.auth.user().onCreate((user)=> {
  console.log(`New user ${user.displayName} is created, email: ${user.email}, uid: ${user.uid}`);

  return Promise.resolve();
});

exports.userDeleted= functions.auth.user().onDelete((user)=> {
  console.log(`user deleted ${user.displayName} is created, email: ${user.email}, uid: ${user.uid}`);

  return Promise.resolve();
});


//Eventos de firestore
exports.fruitAdedd= functions.firestore.document('/fruit/{documentId}').onCreate((snapshot, context)=> {
  console.log(snapshot.data(), 'added');

  return Promise.resolve();
});

exports.fruitDeleted= functions.firestore.document('/fruit/{documentId}').onDelete((snapshot, context)=> {
  console.log(snapshot.data(), 'deleted');

  return Promise.resolve();
});

exports.fruitUpdated= functions.firestore.document('/fruit/{documentId}').onUpdate((snapshot, context)=> {
  console.log(`Before ${snapshot.before.data().name}`);
  console.log(`After ${snapshot.after.data().name}`);

  return Promise.resolve();
})
