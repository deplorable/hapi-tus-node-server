# hapi-tus-node-server

HAPI-compatible fork of [tus-node-server](https://github.com/tus/tus-node-server).

tus is a new open protocol for resumable uploads built on HTTP. This is the [tus protocol 1.0.0](http://tus.io/protocols/resumable-upload.html) node.js server implementation.

## Installation

```bash
$ npm install hapi-tus-node-server
```

## Flexible Data Stores

- **Local File Storage**
    ```js
    server.datastore = new tus.FileStore({
        path: '/files'
    });
    ```

- **Google Cloud Storage**
    ```js

    server.datastore = new tus.GCSDataStore({
        path: '/files',
        projectId: 'project-id',
        keyFilename: 'path/to/your/keyfile.json',
        bucket: 'bucket-name',
    });
    ```

- **Amazon S3**
    ```js

    server.datastore = new tus.S3Store({
        path: '/files',
        bucket: 'bucket-name',
        accessKeyId: 'access-key-id',
        secretAccessKey: 'secret-access-key',
        region: 'eu-west-1',
        partSize: 8 * 1024 * 1024, // each uploaded part will have ~8MB,
        tmpDirPrefix: 'tus-s3-store',
    });
    ```

## Quick Start

#### Use tus-node-server with [Hapi](https://github.com/hapijs/hapi)

```js
const http = require('http');
const url = require('url');
const Koa = require('koa')
const tus = require('tus-node-server');
const tusServer = new tus.Server();

const app = new Koa();
const appCallback = app.callback();
const port = 1080;

tusServer.datastore = new tus.FileStore({
    path: '/files',
});

const server = http.createServer((req, res) => {
    const urlPath = url.parse(req.url).pathname;

    // handle any requests with the `/files/*` pattern
    if (/^\/files\/.+/.test(urlPath.toLowerCase())) {
        return tusServer.handle(req, res);
    }

    appCallback(req, res);
});

server.listen(port)
```

## Development

Start the demo server using Local File Storage
```bash
$ npm run demo
```

Or start up the demo server using Google Cloud Storage
```bash
$ npm run gcs_demo
```

Then navigate to the demo ([localhost:1080](http://localhost:1080)) which uses [`tus-js-client`](https://github.com/tus/tus-js-client)
