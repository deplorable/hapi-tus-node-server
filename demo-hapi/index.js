const http = require('http');
const url = require('url');
const Hapi = require('@hapi/hapi')
const tus = require('../index');
const FileStore = require('../index').FileStore;
const GCSDataStore = require('../index').GCSDataStore;
const S3Store = require('../index').S3Store;
const EVENTS = require('../index').EVENTS;
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const dotenv = require('dotenv').config();
const env = dotenv.parsed || {};
console.log(env);

const MAX_REQUEST_SIZE_IN_MEGABYTES = 30;
const MAX_REQUEST_SIZE_IN_BYTES = Math.round(MAX_REQUEST_SIZE_IN_MEGABYTES * 1024 * 1024);

const port = 1080;
const host = '0.0.0.0';

const tusServer = new tus.Server();
const data_store = process.env.DATA_STORE || 'FileStore';

switch (data_store) {
    case 'GCSDataStore':
        tusServer.datastore = new GCSDataStore({
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

        tusServer.datastore = new S3Store({
            path: '/files',
            bucket: process.env.AWS_BUCKET,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION,
            partSize: 8 * 1024 * 1024, // each uploaded part will have ~8MB,
        });
        break;

    default:
        tusServer.datastore = new FileStore({
            path: '/files',
        });
}




/**
 * Basic GET handler to serve the demo html/js
 *
 * @param  {object} req http.incomingMessage
 * @param  {object} res http.ServerResponse
 */
const writeFile = (request, h) => {
    // Determine file to serve
    let filename = request.path;
console.log(filename);
    if (filename == '/') {
        filename = '/index.html';
    }
    if (!filename.startsWith('/dist/')) {
        filename = '/demos/browser' + filename;
    }
    filename = path.join(process.cwd(), '/node_modules/tus-js-client', filename);
    try {
      let file = fs.readFileSync(filename, { encoding:  'binary' });
      // Update demo URL to point to our local server
      file = file.replace(env.LOCAL_SERVER+'/files/', `http://${host}:${port}/files/`)
      return h.response(file).code(200);
    } catch (err) {
      return h.response(err).type('text/plain').code(500);
    }
};


const initServer = async () => {

  const server = Hapi.server({
    port: port,
    host: host
  });

  server.decorate("server", "fileServer", tusServer);
  server.decorate("request", "tus", tusServer);

  server.route({
    method: 'GET',
    path: '/',
    handler: async (request, h) =>{
      return writeFile(request, h)
    }
  });

  server.route({
    method: 'GET',
    path: '/index.html',
    handler: async (request, h) =>{
      return writeFile(request,h)
    }
  });

  server.route({
    method: 'GET',
    path: '/demo.js',
    handler: async (request, h) =>{
      return writeFile(request,h)
    }
  });

  server.route({
    method: 'GET',
    path: '/demo.css',
    handler: async (request, h) =>{
      return writeFile(request,h)
    }
  });

  server.route({
    method: 'GET',
    path: '/video.html',
    handler: async (request, h) =>{
      return writeFile(request,h)
    }
  });

  server.route({
    method: 'GET',
    path: '/video.js',
    handler: async (request, h) =>{
      return writeFile(request,h)
    }
  });

  server.route({
    method: 'GET',
    path: '/dist/tus.js',
    handler: async (request, h) =>{
      return writeFile(request,h)
    }
  });

  server.route({
    method: 'GET',
    path: '/dist/tus.js.map',
    handler: async (request, h) =>{
      return writeFile(request,h)
    }
  });

  server.route({
    method: 'GET',
    path: '/dist/tus.min.js',
    handler: async (request, h) =>{
      return writeFile(request,h)
    }
  });

  server.route({
    method: 'GET',
    path: '/dist/tus.min.js.map',
    handler: async (request, h) =>{
      return writeFile(request,h)
    }
  });

  server.route({
    method: 'POST',
    path: '/files/{file_id}',
    handler: async (request, h) =>{
      console.log("POST /files/:file_id");
      return await tusServer.handle(request.raw.req, request.raw.res)
    }
  });

  server.route({
    method: 'POST',
    path: '/files/',
    handler: async (request, h) =>{
      console.log("POST /files/");
      await tusServer.handle(request.raw.req, request.raw.res)
      return h.close
    }
  });

  server.route({
    method: 'PATCH',
    path: '/files/{file_id}',
    options: {
      payload: {
        output: 'stream',
        parse: false,
        maxBytes: MAX_REQUEST_SIZE_IN_BYTES
      }
    },
    handler: async (request, h) =>{
      console.log("PATCH /files/:file_id");
      await tusServer.handle(request.raw.req, request.raw.res)
      return h.close
    }
  });

  server.route({
    method: 'OPTIONS',
    path: '/files/:file_id',
    handler: async (request, h) =>{
      console.log("OPTIONS /files/:file_id");
      await tusServer.handle(request.raw.req, request.raw.res)
      return h.close
    }
  });

  server.route({
    method: 'GET',
    path: '/files/{file_id}',
    handler: async (request, h)=>{
      console.log("GET /files/:file_id");
      console.log(request.method);
      if (request.method.toLowerCase() === "head") {
        await request.tus.handle(request.raw.req, request.raw.res);
        return h.close;
      } else {
        return await tusServer.handle(request.raw.req, request.raw.res)
        //return h.close;
      }
    }
  });

  await server.start();
  console.log(`[${new Date().toLocaleTimeString()}] tus server listening at %s using ${data_store}`, server.info.uri);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

initServer();








