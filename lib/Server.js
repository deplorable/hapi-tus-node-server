'use strict';

/**
 * @fileOverview
 * TUS Protocol Server Implementation.
 *
 * @author Ben Stahl <bhstahl@gmail.com>
 */
const http = require('http');
const EventEmitter = require('events');

const DataStore = require('./stores/DataStore');
const GetHandler = require('./handlers/GetHandler');
const HeadHandler = require('./handlers/HeadHandler');
const OptionsHandler = require('./handlers/OptionsHandler');
const PatchHandler = require('./handlers/PatchHandler');
const PostHandler = require('./handlers/PostHandler');
const DeleteHandler = require('./handlers/DeleteHandler');
const RequestValidator = require('./validators/RequestValidator');
const EXPOSED_HEADERS = require('./constants').EXPOSED_HEADERS;
const REQUEST_METHODS = require('./constants').REQUEST_METHODS;
const TUS_RESUMABLE = require('./constants').TUS_RESUMABLE;
const debug = require('debug');
const log = debug('tus-node-server');
class TusServer extends EventEmitter {

    constructor() {
        super();

        // Any handlers assigned to this object with the method as the key
        // will be used to repond to those requests. They get set/re-set
        // when a datastore is assigned to the server.
        this.handlers = {};

        // Remove any event listeners from each handler as they are removed
        // from the server. This must come before adding a 'newListener' listener,
        // to not add a 'removeListener' event listener to all request handlers.
        this.on('removeListener', (event, listener) => {
            this.datastore.removeListener(event, listener);
            REQUEST_METHODS.forEach((method) => {
                this.handlers[method].removeListener(event, listener);
            });
        });

        // As event listeners are added to the server, make sure they are
        // bubbled up from request handlers to fire on the server level.
        this.on('newListener', (event, listener) => {
            this.datastore.on(event, listener);
            REQUEST_METHODS.forEach((method) => {
                this.handlers[method].on(event, listener);
            });
        });
    }

    /**
     * Return the data store
     * @return {DataStore}
     */
    get datastore() {
        return this._datastore;
    }

    /**
     * Assign a datastore to this server, and re-set the handlers to use that
     * data store when doing file operations.
     *
     * @param  {DataStore} store Store for uploaded files
     */
    set datastore(store) {
        if (!(store instanceof DataStore)) {
            throw new Error(`${store} is not a DataStore`);
        }

        this._datastore = store;

        this.handlers = {
            // GET handlers should be written in the implementations
            // eg.
            //      const server = new tus.Server();
            //      server.get('/', (req, res) => { ... });
            GET: new GetHandler(store),

            // These methods are handled under the tus protocol
            HEAD: new HeadHandler(store),
            OPTIONS: new OptionsHandler(store),
            PATCH: new PatchHandler(store),
            POST: new PostHandler(store),
            DELETE: new DeleteHandler(store),
        };
    }


    /**
     * Allow the implementation to handle GET requests, in an
     * express.js style manor.
     *
     * @param  {String}   path     Path for the GET request
     * @param  {Function} callback Request listener
     */
    get(path, callback) {

        // Add this handler callback to the GET method handler list.
        this.handlers.GET.registerPath(path, callback);
    }

    /**
     * Main server requestListener, invoked on every 'request' event.
     *
     * @param  {object} request
     * @param  {object} h
     * @return {ServerResponse}
     */
    handle(request, h) {
        console.log(`[TusServer] handle: ${request.method.toUpperCase()} ${request.url}`);
        const headersInResponse = {};

        // Allow overriding the HTTP method. The reason for this is
        // that some libraries/environments to not support PATCH and
        // DELETE requests, e.g. Flash in a browser and parts of Java
        if (request.headers['x-http-method-override']) {
            request.method = request.headers['x-http-method-override'].toUpperCase();
        }


        if (request.method.toUpperCase() === 'GET') {
            return this.handlers.GET.send(request, h, headersInResponse);
        }

        // The Tus-Resumable header MUST be included in every request and
        // response except for OPTIONS requests. The value MUST be the version
        // of the protocol used by the Client or the Server.
        headersInResponse['Tus-Resumable'] = TUS_RESUMABLE; // was res.setHeader('Tus-Resumable', TUS_RESUMABLE);
        if (request.method.toUpperCase() !== 'OPTIONS' && request.headers['tus-resumable'] === undefined) {
            return h.response('Tus-Resumable Required\n').code(412).message('Precondition Failed');
            // res.writeHead(412, {}, 'Precondition Failed');
            // return res.end('Tus-Resumable Required\n');
        }

        // Validate all required headers to adhere to the tus protocol
        const invalid_headers = [];
        for (const header_name in request.headers) {
            if (request.method.toUpperCase() === 'OPTIONS') {
                continue;
            }

            // Content type is only checked for PATCH requests. For all other
            // request methods it will be ignored and treated as no content type
            // was set because some HTTP clients may enforce a default value for
            // this header.
            // See https://github.com/tus/tus-node-server/pull/116
            if (header_name.toLowerCase() === 'content-type' && request.method.toUpperCase() !== 'PATCH') {
                continue;
            }
            if (RequestValidator.isInvalidHeader(header_name, request.headers[header_name])) {
                log(`Invalid ${header_name} header: ${request.headers[header_name]}`);
                invalid_headers.push(header_name);
            }
        }

        if (invalid_headers.length > 0) {
            // The request was not configured to the tus protocol
            return h.response(`Invalid ${invalid_headers.join(' ')}\n`).code(412).message('Precondition Failed');
            // res.writeHead(412, {}, 'Precondition Failed');
            // return res.end(`Invalid ${invalid_headers.join(' ')}\n`);
        }

        // Enable CORS
        headersInResponse['Access-Control-Expose-Headers'] = EXPOSED_HEADERS; // was res.setHeader('Tus-Resumable', TUS_RESUMABLE);
        // res.setHeader('Access-Control-Expose-Headers', EXPOSED_HEADERS);
        if (request.headers.origin) {
            console.log(`Origin: ${request.headers.origin}`);
            headersInResponse['Access-Control-Allow-Origin'] = request.headers.origin;
            // res.setHeader('Access-Control-Allow-Origin', request.headers.origin);
        }
        else {
            console.log('Origin: NONE');
        }

        // Invoke the handler for the method requested
        if (this.handlers[request.method.toUpperCase()]) {
            return this.handlers[request.method.toUpperCase()].send(request, h, headersInResponse);
        }

        // 404 Anything else
        return h.response('Not found\n').code(404);
        /* res.writeHead(404, {});
        res.write('Not found\n');
        return res.end();*/
    }

    listen() {
        const server = http.createServer(this.handle.bind(this));
        return server.listen.apply(server, arguments);
    }
}

module.exports = TusServer;
