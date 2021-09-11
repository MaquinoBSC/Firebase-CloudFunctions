const functions = require("firebase-functions");
const {Storage}= require('@google-cloud/storage');
const admin= require('firebase-admin');
const axios= require('axios');
const Printer = require('pdfmake');
const fonts = require('pdfmake/build/vfs_fonts.js');
const PdfKit= require('pdfkit');
const { v4: uuidv4 } = require('uuid');

const serviceAccount = require('../credentials.json');


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
});


// exports.testOnCall= functions.https.onCall( async (data, context)=> {
//   console.log("Estamos desde onCall functions");

//   return {
//     status: "Jalando",
//     msg: "Todo bien perron",
//   }
// });


exports.testSchedule= functions.pubsub.schedule('0 20 25 * *').onRun( async(context)=> {
  const doc= db.collection('schedule').doc('25122013');

  await doc.update({
    update: admin.firestore.FieldValue.increment(1),
    time: admin.firestore.Timestamp.now()
  });
});



const fontDescriptors = {
  Roboto: {
    normal: Buffer.from(fonts.pdfMake.vfs['Roboto-Regular.ttf'], 'base64'),
    bold: Buffer.from(fonts.pdfMake.vfs['Roboto-Medium.ttf'], 'base64'),
    italics: Buffer.from(fonts.pdfMake.vfs['Roboto-Italic.ttf'], 'base64'),
    bolditalics: Buffer.from(fonts.pdfMake.vfs['Roboto-Italic.ttf'], 'base64'),
  }
};

//Funcion para generar archivo pdf
exports.generatePDF= functions.https.onRequest( (request, response)=> {
  if (request.method !== "GET") {
    response.send(405, 'HTTP Method ' + request.method + ' not allowed');
    return null;
  }

  //Configurar el storage
  const storage = new Storage();
  const bucket = storage.bucket('cloudfunctions-583e9.appspot.com');


  //Comenzar a estructurar el contenido del documento 
  const printer = new Printer(fontDescriptors);
  const chunks = [];

  const docDefinition = {
    content: [
      // if you don't need styles, you can use a simple string to define a paragraph
      'Aqui se esta rifando el maquino',
      // using a { text: '...' } object lets you set styling properties
      {
        text: 'El buen maquino',
        fontSize: 15
      },
      // if you set the value of text to an array instead of a string, you'll be able
      // to style any part individually
      {
        text: [
          'Esto es es el maquino pero en un array ',
          {
            text: 'COMO MAQUINAS PERROS',
            fontSize: 15
          },
          'Adios -:).'
        ]
      }
    ]
  };

  //Crear el documento y asignar el contenido
  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  pdfDoc.on('data', (chunk) => {
    chunks.push(chunk);
  });


  pdfDoc.on('end', async() => {
    const documentId= uuidv4();
    const result = Buffer.concat(chunks);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-disposition', `attachment; filename=${documentId}.pdf`);


    // Sending generated file as a response
    response.send(result);

    //Guardar el documento en storage
    try {
      const fileRef = bucket.file(
        `documents/${documentId}.pdf`,
        { metadata: { contentType: 'application/pdf' } }
      );

      await fileRef.save(result);

    } catch (error) {
      console.log(error);
    }
    
  });

  //Reportar algun error ocurrido
  pdfDoc.on('error', (err) => {
    response.status(501).send(err);
    return
  });

  //Terminar el documento
  pdfDoc.end();
});



exports.createPDF= functions.https.onRequest( async (request, response)=>{
  const doc = new PdfKit();
  let receiptId = uuidv4();

  //Configurar el storage
  const storage = new Storage({
    keyFilename: '../credentials.json',
    projectId: 'cloudfunctions-583e9'
  });

  const bucket = storage.bucket('cloudfunctions-583e9.appspot.com');

  const file= bucket.file(`reports/${receiptId}.pdf`);

  await new Promise((resolve, reject) => {
    const writeStream = file.createWriteStream({
      resumable: false,
      contentType: "application/pdf",
    });
    writeStream.on("finish", () => resolve());
    writeStream.on("error", (e) => reject(e));
    
    doc.pipe(writeStream);
    
    doc
      .fontSize(24)
      .text("Receipt")
      .fontSize(16)
      .moveDown(2)
      .text("This is your receipt!");

    doc.moveTo(0, 20)                               // set the current point
      .lineTo(100, 160)                            // draw a line
      .quadraticCurveTo(130, 200, 150, 120)        // draw a quadratic curve
      .bezierCurveTo(190, -40, 200, 200, 300, 150) // draw a bezier curve
      .lineTo(400, 90)                             // draw another line
      .stroke();
      
    doc.lineJoin('bevel')
      .rect(250, 100, 50, 50)
      .stroke();

    // Create a linear gradient
    let grad = doc.linearGradient(50, 0, 150, 100);
    grad.stop(0, 'green')
        .stop(1, 'red');

    doc.rect(50, 0, 100, 100);
    doc.fill(grad);

    // Create a radial gradient
    grad = doc.radialGradient(300, 50, 0, 300, 50, 50);
    grad.stop(0, 'orange', 0)
        .stop(1, 'orange', 1);

    doc.circle(300, 50, 50);
    doc.fill(grad);

    // Create a clipping path
    doc.circle(100, 100, 100)
    .clip();

    // Draw a checkerboard pattern
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const color = (col % 2) - (row % 2) ? '#eee' : '#4183C4';
        doc.rect(row * 20, col * 20, 20, 20)
          .fill(color);
      }
    }
    doc.end();
  });

  
  const url = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 24 * 60 * 60 * 1000,
  });
    
  response.send(url);
});
