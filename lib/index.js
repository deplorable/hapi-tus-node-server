'use strict';

const tus = require('./tus');

exports.plugin = {
  name: 'hapi-tus-node-server',
  version: '1.0.0',
  register: async function (server, options) {

    //console.log("HapiTusNodeServer Options:")
    //console.log(options);

    let MAX_REQUEST_SIZE_IN_MEGABYTES = options.limits.MAX_REQUEST_SIZE_IN_MEGABYTES || 2;
    let MAX_REQUEST_SIZE_IN_BYTES = Math.round(MAX_REQUEST_SIZE_IN_MEGABYTES * 1024 * 1024);

    const tusServer = new tus.Server();
    if (options.datastore) tusServer.datastore = options.datastore;
    server.decorate("server", "tus", tusServer);
    server.decorate("request", "tus", tusServer);

    server.route({
      method: 'POST',
      path: '/files/{file_id}',
      handler: async (request, h) =>{
        console.log("POST /files/:file_id");
        return await request.tus.handle(request, h)
      }
    });

    server.route({
      method: 'POST',
      path: '/files/',
      handler: async (request, h) =>{
        console.log("POST /files/");
        return await request.tus.handle(request, h)
        //return h.close
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
        return await request.tus.handle(request,h)
        //return h.close
      }
    });

    server.route({
      method: 'OPTIONS',
      path: '/files/:file_id',
      handler: async (request, h) =>{
        console.log("OPTIONS /files/:file_id");
        return await request.tus.handle(request, h)
        //return h.close
      }
    });

    server.route({
      method: 'GET',
      path: '/files/{file_id}',
      handler: async (request, h)=>{
        console.log("GET /files/:file_id");
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
      path: '/files/{file_id}',
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
        console.log("DELETE /files/:file_id");
        return await request.tus.handle(request, h);
      }
    });

    // etc ...
    //await someAsyncMethods();
  }
};