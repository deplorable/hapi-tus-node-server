'use strict';

const BaseHandler = require('./BaseHandler');
const RequestValidator = require('../validators/RequestValidator');
const ERRORS = require('../constants').ERRORS;
const EVENT_ENDPOINT_CREATED = require('../constants').EVENT_ENDPOINT_CREATED;
// const debug = require('debug');
// const log = debug('tus-node-server:handlers:post');
class PostHandler extends BaseHandler {
    /**
     * Create a file in the DataStore.
     *
     * @param  {object} request
     * @param  {object} h
     * @param  {object} headersInResponse
     * @return {function}
     */
    send(request, h, headersInResponse = {}) {
        return this.store.create(request)
            .then(async(File) => {
                // const url = this.store.relativeLocation ? `${req.baseUrl || ''}${this.store.path}/${File.id}` : `//${request.headers.host}${req.baseUrl || ''}${this.store.path}/${File.id}`;
                let url = this.store.relativeLocation ? `${request.baseUrl || ''}${this.store.path}/${File.id}` : `//${request.headers.host}${request.baseUrl || ''}${this.store.path}/${File.id}`;
                if (this.store.absoluteLocation !== false) {
                    url = `${this.store.absoluteLocation}${this.store.path}/${File.id}`;
                }
                console.log(`File URL: ${url}`);

                this.emit(EVENT_ENDPOINT_CREATED, { url });

                const optional_headers = headersInResponse || {};

                // The request MIGHT include a Content-Type header when using creation-with-upload extension
                if (!RequestValidator.isInvalidHeader('content-type', request.headers['content-type'])) {
                    const new_offset = await this.store.write(request, File.id, 0); // was req, File.id, 0
                    optional_headers['Upload-Offset'] = new_offset;
                }

                return super.send(h, 201, { Location: url, ...optional_headers });
            })
            .catch((error) => {
                console.log('[PostHandler]', error);
                const status_code = error.status_code || ERRORS.UNKNOWN_ERROR.status_code;
                const body = error.body || `${ERRORS.UNKNOWN_ERROR.body}${error.message || ''}\n`;
                return super.send(h, status_code, headersInResponse, body);
            });
    }
}

module.exports = PostHandler;
