'use strict';

const tus = require('./tus');

exports.plugin = {
  name: 'hapi-tus-node-server',
  version: '1.0.0',
  register: async function (server, options) {

    //console.log("HapiTusNodeServer Options:")
    //console.log(options);

    let localPath = options.localPath || '/files';
    let MAX_REQUEST_SIZE_IN_MEGABYTES = options.limits.MAX_REQUEST_SIZE_IN_MEGABYTES || 2;
    let MAX_REQUEST_SIZE_IN_BYTES = Math.round(MAX_REQUEST_SIZE_IN_MEGABYTES * 1024 * 1024);

    const tusServer = new tus.Server();
    if (options.datastore) tusServer.datastore = options.datastore;
    server.decorate("server", "tus", tusServer);
    server.decorate("request", "tus", tusServer);

    server.route({
      method: 'POST',
      path: localPath + '/{file_id}',
      handler: async (request, h) =>{
        console.log(`POST ${localPath}/:file_id`);
        return await request.tus.handle(request, h)
      }
    });

    server.route({
      method: 'POST',
      path: localPath + '/',
      handler: async (request, h) =>{
        console.log(`POST ${localPath}/`);
        return await request.tus.handle(request, h)
        //return h.close
      }
    });

    server.route({
      method: 'PATCH',
      path: localPath + '/{file_id}',
      options: {
        payload: {
          output: 'stream',
          parse: false,
          maxBytes: MAX_REQUEST_SIZE_IN_BYTES
        }
      },
      handler: async (request, h) =>{
        console.log(`PATCH ${localPath}/:file_id`);
        return await request.tus.handle(request,h)
        //return h.close
      }
    });

    server.route({
      method: 'OPTIONS',
      path: localPath + '/:file_id',
      handler: async (request, h) =>{
        console.log(`OPTIONS ${localPath}/:file_id`);
        return await request.tus.handle(request, h)
        //return h.close
      }
    });

    server.route({
      method: 'GET',
      path: localPath + '/{file_id}',
      handler: async (request, h)=>{
        console.log(`GET ${localPath}/:file_id`);
        console.log(request.method);
        if (request.method.toLowerCase() === "head") {
          await request.tus.handle(request, h);
          return h.close;
        } else {
          return await request.tus.handle(request, h)
          return h.close;
        }
      }
    });

    server.route({
      method: 'DELETE',
      path: localPath + '/{file_id}',
      options: {
        cors: {
          headers: [
            // These are the default Access-Control-Allow-Headers
            'Accept', 'Authorization', 'Content-Type', 'If-None-Match',
            // These are the ones specific to Tus
            'tus-resumable', 'upload-length', 'upload-metadata'
          ]
        }
      },
      handler: async (request, h)=>{
        console.log(`DELETE ${localPath}/:file_id`);
        return await request.tus.handle(request, h);
      }
    });

    // etc ...
    //await someAsyncMethods();
  }
};

exports.Server = tus.Server;
exports.DataStore = tus.DataStore;
exports.FileStore = tus.FileStore;
exports.GCSDataStore = tus.GCSDataStore;
exports.S3Store = tus.S3Store;
exports.Metadata = tus.Metadata;
exports.ERRORS = tus.ERRORS;
exports.EVENTS = tus.EVENTS;
