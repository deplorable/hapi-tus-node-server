const Hapi = require('@hapi/hapi');
const HapiTus = require('../lib/index');
const FileStore = HapiTus.FileStore;
const GCSDataStore = HapiTus.GCSDataStore;
const S3Store = HapiTus.S3Store;
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const dotenv = require('dotenv').config();
const env = dotenv.parsed || {};

console.log('\nHAPI TUS NODE SERVER DEMO');
console.log('--------------------------');

const validEnvironmentVariables = [
    'TUS_PUBLIC_SITE',
    'TUS_PUBLIC_PATH',
    'TUS_LOCAL_PATH',
];

console.log('\nValid Environment Variable names:');
validEnvironmentVariables.forEach((validEnvironmentVariable) => console.log(`- ${validEnvironmentVariable}`));

console.log('\nEnvironment Variables from .env file:');
console.log(env);

const port = 1080;
const host = '127.0.0.1';
const publicSite = process.env.TUS_PUBLIC_SITE || `http://${host}:${port}`;
let publicPath = process.env.TUS_PUBLIC_PATH || '/files/'; // must have trailing slash
if (publicPath.lastIndexOf('/') !== (publicPath.length - 1)) {
    publicPath = `${publicPath}/`;
}
const publicUrl = `${publicSite}${publicPath}`;
const localPath = process.env.TUS_LOCAL_PATH || '/files';

console.log('\nConfiguration:');
console.log({
    publicSite,
    publicPath,
    publicUrl,
    localPath,
});

/**
 * Basic GET handler to serve the demo html/js
 *
 * @param  {object} request
 * @param  {object} h
 * @return {ServerResponse}
 */
const writeFile = (request, h) => {
    // Determine file to serve
    let filename = request.path;
    if (filename === '/') {
        filename = '/index.html';
    }
    if (!filename.startsWith('/dist/')) {
        filename = `/demos/browser${filename}`;
    }
    filename = path.join(process.cwd(), '/node_modules/tus-js-client', filename);
    try {
        let file = fs.readFileSync(filename, { encoding: 'binary' });
        // Update demo URL to point to our local server
        file = file.replace('https://tusd.tusdemo.net/files/', publicUrl);
        file = file.replace('../../dist/tus.js', './dist/tus.js');
        const theResponse = h.response(file).code(200);
        if (filename.indexOf('.css') !== -1) {
            theResponse.type('text/css');
        }
        else if (filename.indexOf('.js.map') !== -1) {
            theResponse.type('application/json');
        }
        else if (filename.indexOf('.js') !== -1) {
            theResponse.type('application/javascript');
        }
        else if (filename.indexOf('.html') !== -1) {
            theResponse.type('text/html');
        }
        return theResponse;
    }
    catch (err) {
        return h.response(err).type('text/plain').code(500);
    }
};

const initServer = async() => {

    const server = Hapi.server({
        port,
        host,
        routes: {
            payload: {
                allow: ['application/json', 'application/x-www-form-urlencoded', 'application/offset+octet-stream', 'multipart/form-data'],
            },
        },
    });

    const tusOptions = {
        limits: {
            maxRequestSizeInMegabytes: 60,
        },
        datastore: {},
    };

    const data_store = process.env.DATA_STORE || 'FileStore';

    switch (data_store) {
        case 'GCSDataStore':
            tusOptions.datastore = new GCSDataStore({
                path: localPath, // e.g. '/files'
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

            tusOptions.datastore = new S3Store({
                path: localPath, // e.g. '/files'
                bucket: process.env.AWS_BUCKET,
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                region: process.env.AWS_REGION,
                partSize: 8 * 1024 * 1024, // each uploaded part will have ~8MB,
            });
            break;

        default:
            tusOptions.datastore = new FileStore({
                path: localPath, // e.g. '/files'
                absoluteLocation: publicSite, // e.g. 'http://192.168.20.40:1080'
            });
    }

    await server.register({ plugin: HapiTus, options: tusOptions });

    server.route({
        method: 'GET',
        path: '/',
        handler: async(request, h) => {
            return writeFile(request, h);
        },
    });

    server.route({
        method: 'GET',
        path: '/index.html',
        handler: async(request, h) => {
            return writeFile(request, h);
        },
    });

    server.route({
        method: 'GET',
        path: '/demo.js',
        handler: async(request, h) => {
            return writeFile(request, h);
        },
    });

    server.route({
        method: 'GET',
        path: '/demo.css',
        handler: async(request, h) => {
            return writeFile(request, h);
        },
    });

    server.route({
        method: 'GET',
        path: '/video.html',
        handler: async(request, h) => {
            return writeFile(request, h);
        },
    });

    server.route({
        method: 'GET',
        path: '/video.js',
        handler: async(request, h) => {
            return writeFile(request, h);
        },
    });

    server.route({
        method: 'GET',
        path: '/dist/tus.js',
        handler: async(request, h) => {
            return writeFile(request, h);
        },
    });

    server.route({
        method: 'GET',
        path: '/dist/tus.js.map',
        handler: async(request, h) => {
            return writeFile(request, h);
        },
    });

    server.route({
        method: 'GET',
        path: '/dist/tus.min.js',
        handler: async(request, h) => {
            return writeFile(request, h);
        },
    });

    server.route({
        method: 'GET',
        path: '/dist/tus.min.js.map',
        handler: async(request, h) => {
            return writeFile(request, h);
        },
    });

    await server.start();
    console.log(`[${new Date().toLocaleTimeString()}] tus server listening at %s using ${data_store}`, server.info.uri);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

initServer();

