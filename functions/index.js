require('zone.js/dist/zone-node');
const functions = require('firebase-functions');
const admin = require("firebase-admin");
const serviceAccount = require("./knochenbruchgilde-firebase-adminsdk-zka5l-592844fa16.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://knochenbruchgilde.firebaseio.com",
  storageBucket: 'knochenbruchgilde.appspot.com'
});
const express = require('express');
const os = require("os");
const path = require("path");
const spawn = require("child-process-promise").spawn;
const cors = require("cors");
const Busboy = require("busboy");
const fs = require("fs");

const {
  enableProdMode
} = require('@angular/core');
const {
  renderModuleFactory
} = require('@angular/platform-server');

const {
  AppServerModuleNgFactory
} = require('./dist/server/main');

enableProdMode();

const index = require('fs')
  .readFileSync(path.resolve(__dirname, './dist/browser/index.html'), 'utf8')
  .toString();

let app = express();

app.use(cors({ origin: true }));

app.get('**', function(req, res) {
  renderModuleFactory(AppServerModuleNgFactory, {
    url: req.path,
    document: index
  }).then(html => res.status(200).send(html));
});

app.post('/', (req, res) => {
  const busboy = new Busboy({ headers: req.headers });
  let uploadData = null;

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    console.log(file);
    const filepath = path.join(os.tmpdir(), filename);
    const IMAGES_SUBFOLDER = 'uploads/';
    const DEST = IMAGES_SUBFOLDER + filename;
    uploadData = { file: filepath, type: mimetype, destination: DEST };
    console.log(uploadData);
    file.pipe(fs.createWriteStream(filepath));
  });

  busboy.on("finish", () => {
    const bucket = admin.storage().bucket();
    bucket.upload(uploadData.file, {
      destination: uploadData.destination,
      uploadType: "media",
      metadata: {
        metadata: {
          contentType: uploadData.type
        }
      }
    })
    .then((response) => {
      console.log(response);
      res.status(200).json({
        message: "It worked!",
        response: response
      });
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
  });
  busboy.end(req.rawBody);
});




exports.ssr = functions.https.onRequest(app);
exports.uploadImage = functions.https.onRequest(app);

