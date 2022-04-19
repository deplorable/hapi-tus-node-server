const dotenv = require('dotenv').config();
const env = dotenv.parsed || {};
console.log(env);

const tus = require('../index');
const FileStore = require('../index').FileStore;
const GCSDataStore = require('../index').GCSDataStore;
const S3Store = require('../index').S3Store;
const EVENTS = require('../index').EVENTS;


const server = new tus.Server();
server.datastore = new tus.FileStore({
    path: '../files'
});

const path = require('path');
const fs = require('fs');
const assert = require('assert');


const express = require('express');
const app = express();
const uploadApp = express();
uploadApp.all('*', server.handle.bind(server));
app.use('/files', uploadApp);



const data_store = process.env.DATA_STORE || 'FileStore';

switch (data_store) {
    case 'GCSDataStore':
        server.datastore = new GCSDataStore({
            path: '/files',
            projectId: 'vimeo-open-source',
            keyFilename: path.resolve(__dirname, '../keyfile.json'),
            bucket: 'tus-node-server',
        });
        break;

    case 'S3Store':
        assert.ok(process.env.AWS_ACCESS_KEY_ID, 'environment variable `AWS_ACCESS_KEY_ID` must be set');
        assert.ok(process.env.AWS_SECRET_ACCESS_KEY, 'environment variable `AWS_SECRET_ACCESS_KEY` must be set');
        assert.ok(process.env.AWS_BUCKET, 'environment variable `AWS_BUCKET` must be set');
        assert.ok(process.env.AWS_REGION, 'environment variable `AWS_REGION` must be set');

        server.datastore = new S3Store({
            path: '/files',
            bucket: process.env.AWS_BUCKET,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION,
            partSize: 8 * 1024 * 1024, // each uploaded part will have ~8MB,
        });
        break;

    default:
        server.datastore = new FileStore({
            path: '/files',
        });
}




/**
 * Basic GET handler to serve the demo html/js
 *
 * @param  {object} req http.incomingMessage
 * @param  {object} res http.ServerResponse
 */
const writeFile = (req, res) => {
    // Determine file to serve
    let filename = req.url;
console.log(filename);
    if (filename == '/') {
        filename = '/index.html';
    }
    if (!filename.startsWith('/dist/')) {
        filename = '/demos/browser' + filename;
    }
    filename = path.join(process.cwd(), '/node_modules/tus-js-client', filename);
    fs.readFile(filename, 'binary', (err, file) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.write(err);
            res.end();
            return;
        }

        // Update demo URL to point to our local server
        file = file.replace(env.LOCAL_SERVER+'/files/', `http://${host}:${port}/files/`)

        res.writeHead(200);
        res.write(file);
        res.end();
    });
};


app.get('/', writeFile);
app.get('/index.html', writeFile);
app.get('/demo.js', writeFile);
app.get('/demo.css', writeFile);
app.get('/video.html', writeFile);
app.get('/video.js', writeFile);
app.get('/dist/tus.js', writeFile);
app.get('/dist/tus.js.map', writeFile);
app.get('/dist/tus.min.js', writeFile);
app.get('/dist/tus.min.js.map', writeFile);


const host = '0.0.0.0';
const port = 1080;
app.listen(port, host);
    console.log(`[${new Date().toLocaleTimeString()}] tus server listening at http://${host}:${port} using ${data_store}`);

