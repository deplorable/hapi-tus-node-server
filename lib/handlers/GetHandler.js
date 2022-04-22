'use strict';

const BaseHandler = require('./BaseHandler');
const ERRORS = require('../constants').ERRORS;
const debug = require('debug');
const log = debug('tus-node-server:handlers:get');

class GetHandler extends BaseHandler {
    constructor(store) {
        super(store);

        this.paths = new Map();
    }

    registerPath(path, handler) {
        this.paths.set(path, handler);
    }

    /**
     * Read data from the DataStore and send the stream.
     *
     * @param  {object} request
     * @param  {object} h
     * @param  {object} headersInResponse
     * @return {function}
     */
    send(request, h, headersInResponse = {}) {
        // Check if this url has been added to allow GET requests, with an
        // appropriate callback to handle the request
        if (this.paths.has(request.path)) { // was req.url
            // invoke the callback
            // return this.paths.get(req.url)(req, res);
            return this.paths.get(request.path)(request, h);
        }

        return Promise.resolve()
            .then(() => {
                if (!('read' in this.store)) {
                    return Promise.reject(ERRORS.FILE_NOT_FOUND);
                }

                const file_id = request.params.file_id; // this.getFileIdFromRequest(request);
                if (file_id === false) {
                    return Promise.reject(ERRORS.FILE_NOT_FOUND);
                }

                return this.store.getOffset(file_id)
                    .then((stats) => {
                        const upload_length = parseInt(stats.upload_length, 10);
                        if (stats.size !== upload_length) {
                            log(`[GetHandler] send: File is not yet fully uploaded (${stats.size}/${upload_length})`);
                            return Promise.reject(ERRORS.FILE_NOT_FOUND);
                        }

                        const file_stream = this.store.read(file_id);
                        headersInResponse['Content-Length'] = stats.size;

                        const responseObject = h.response(file_stream).code(200);
                        const headerKeys = Object.keys(headersInResponse);
                        headerKeys.forEach((headerKey) => {
                            responseObject.header(headerKey, headersInResponse[headerKey]);
                        });

                        return responseObject;
                    });
            })
            .catch((error) => {
                console.log('[GetHandler]');
                console.log(error);
                const status_code = error.status_code || ERRORS.UNKNOWN_ERROR.status_code;
                const body = error.body || `${ERRORS.UNKNOWN_ERROR.body}${error.message || ''}\n`;
                return super.send(h, status_code, headersInResponse, body);
            });
    }
}

module.exports = GetHandler;
