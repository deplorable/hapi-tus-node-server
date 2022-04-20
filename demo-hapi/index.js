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



/*
app.use(ctx => {
  ctx.body = 'Hello Koa';
});
*/


/*
router.get('/', ctx=>{
  ctx.respond = false; 
  return writeFile(ctx.req, ctx.res)
});

router.get('/index.html', ctx=>{
  ctx.respond = false;
  return writeFile(ctx.req, ctx.res)
});

router.get('/demo.js', ctx=>{
  ctx.respond = false;
  return writeFile(ctx.req, ctx.res)
});

router.get('/demo.css', ctx=>{
  ctx.respond = false;
  return writeFile(ctx.req, ctx.res)
});

router.get('/video.html', ctx=>{
  ctx.respond = false;
  return writeFile(ctx.req, ctx.res)
});

router.get('/video.js', ctx=>{
  ctx.respond = false;
  return writeFile(ctx.req, ctx.res)
});

router.get('/dist/tus.js', ctx=>{
  ctx.respond = false;
  return writeFile(ctx.req, ctx.res)
});

router.get('/dist/tus.js.map', ctx=>{
  ctx.respond = false;
  return writeFile(ctx.req, ctx.res)
});

router.get('/dist/tus.min.js', ctx=>{
  ctx.respond = false;
  return writeFile(ctx.req, ctx.res)
});

router.get('/dist/tus.min.js.map', ctx=>{
  ctx.respond = false;
  return writeFile(ctx.req, ctx.res)
});
*/





/*
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
*/


/*
router.post('/files/:file_id', (ctx,next)=>{
  console.log("poster");
  ctx.respond = false;
  return tusServer.handle(ctx.req, ctx.res)
});

router.post('/files/', async (ctx,next)=>{
  //ctx.respond = false;
  return tusServer.handle(ctx.req, ctx.res)
});

router.patch('/files/:file_id', async (ctx,next)=>{
  console.log("patch");
  return tusServer.handle(ctx.req, ctx.res)
});

router.get('/files/:file_id', async (ctx,next)=>{
  console.log("get");
  return tusServer.handle(ctx.req, ctx.res)
});



app.use(router.routes());
*/

const init = async () => {

    const server = Hapi.server({
        port: port,
        host: host
    });

    await server.start();
    console.log(`[${new Date().toLocaleTimeString()}] tus server listening at %s using ${data_store}`, server.info.uri);

};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();








