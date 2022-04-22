'use strict';

const tus = require('./tus');

exports.plugin = {
    // name: 'hapi-tus-node-server',
    // version: '1.0.0',
    pkg: require('../package.json'),
    multiple: false, // only allow one copy of this plugin per server
    async register(server, options) {

        // console.log("[HapiTusNodeServer] Options:")
        // console.log(options);

        const localPath = options.localPath || '/files';
        console.log(`[HapiTusNodeServer] localPath set to: ${localPath}`);
        const MAX_REQUEST_SIZE_IN_MEGABYTES = options.limits.maxRequestSizeInMegabytes || 2;
        console.log(`[HapiTusNodeServer] limits.maxRequestSizeInMegabytes set to: ${MAX_REQUEST_SIZE_IN_MEGABYTES}`);
        const MAX_REQUEST_SIZE_IN_BYTES = Math.round(MAX_REQUEST_SIZE_IN_MEGABYTES * 1024 * 1024);


        const tusServer = new tus.Server();
        if (options.datastore) {
            let datastoreClassName = '';
            // console.log(options.datastore);
            if (typeof options.datastore.constructor !== 'undefined') {
                datastoreClassName = options.datastore.constructor.name;
                console.log(`[HapiTusNodeServer] datastore provided of type: ${datastoreClassName}`);
            }
            tusServer.datastore = options.datastore;
        }
        server.decorate('server', 'tus', tusServer);
        server.decorate('request', 'tus', tusServer);

        server.route({
            method: 'POST',
            path: `${localPath}/{file_id}`,
            options: {
                cors: {
                    headers: [
                        // These are the default Access-Control-Allow-Headers
                        'Accept', 'Authorization', 'Content-Type', 'If-None-Match',
                        // These are the ones specific to Tus
                        'tus-resumable', 'upload-length', 'upload-metadata',
                    ],
                },
            },
            handler: async(request, h) => {
                console.log(`\n${request.method.toUpperCase()} ${localPath}/:file_id`);
                return await request.tus.handle(request, h);
            },
        });

        server.route({
            method: 'POST',
            path: `${localPath}/`,
            options: {
                cors: {
                    headers: [
                        // These are the default Access-Control-Allow-Headers
                        'Accept', 'Authorization', 'Content-Type', 'If-None-Match',
                        // These are the ones specific to Tus
                        'tus-resumable', 'upload-length', 'upload-metadata',
                    ],
                    additionalExposedHeaders: [
                        'location',
                    ],
                },
            },
            handler: async(request, h) => {
                console.log(`\n${request.method.toUpperCase()} ${localPath}/`);
                return await request.tus.handle(request, h);
            },
        });

        server.route({
            method: 'PATCH',
            path: `${localPath}/{file_id}`,
            options: {
                cors: {
                    headers: [
                        // These are the default Access-Control-Allow-Headers
                        'Accept', 'Authorization', 'Content-Type', 'If-None-Match',
                        // These are the ones specific to Tus
                        'tus-resumable', 'upload-length', 'upload-metadata',
                    ],
                },
                payload: {
                    output: 'stream',
                    parse: false,
                    maxBytes: MAX_REQUEST_SIZE_IN_BYTES,
                },
            },
            handler: async(request, h) => {
                console.log(`\nPATCH ${localPath}/:file_id`);
                return await request.tus.handle(request, h);
            },
        });

        server.route({
            method: 'OPTIONS',
            path: `${localPath}/{file_id}`,
            options: {
                cors: {
                    headers: [
                        // These are the default Access-Control-Allow-Headers
                        'Accept', 'Authorization', 'Content-Type', 'If-None-Match',
                        // These are the ones specific to Tus
                        'tus-resumable', 'upload-length', 'upload-metadata',
                    ],
                },
            },
            handler: async(request, h) => {
                console.log(`\nOPTIONS ${localPath}/:file_id`);
                return await request.tus.handle(request, h);
            },
        });

        server.route({
            method: 'GET',
            path: `${localPath}/{file_id}`,
            options: {
                cors: {
                    headers: [
                        // These are the default Access-Control-Allow-Headers
                        'Accept', 'Authorization', 'Content-Type', 'If-None-Match',
                        // These are the ones specific to Tus
                        'tus-resumable', 'upload-length', 'upload-metadata',
                    ],
                },
            },
            handler: async(request, h) => {
                console.log(`\n${request.method.toUpperCase()} ${localPath}/:file_id`);
                if (request.method.toLowerCase() === 'head') {
                    return await request.tus.handle(request, h);
                }
                return await request.tus.handle(request, h);
                // return h.close;
            },
        });

        server.route({
            method: 'DELETE',
            path: `${localPath}/{file_id}`,
            options: {
                cors: {
                    headers: [
                        // These are the default Access-Control-Allow-Headers
                        'Accept', 'Authorization', 'Content-Type', 'If-None-Match',
                        // These are the ones specific to Tus
                        'tus-resumable', 'upload-length', 'upload-metadata',
                    ],
                },
            },
            handler: async(request, h) => {
                console.log(`\nDELETE ${localPath}/:file_id`);
                return await request.tus.handle(request, h);
            },
        });

    },
};

exports.Server = tus.Server;
exports.DataStore = tus.DataStore;
exports.FileStore = tus.FileStore;
exports.GCSDataStore = tus.GCSDataStore;
exports.S3Store = tus.S3Store;
exports.Metadata = tus.Metadata;
exports.ERRORS = tus.ERRORS;
exports.EVENTS = tus.EVENTS;
