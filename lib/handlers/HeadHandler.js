'use strict';

const BaseHandler = require('./BaseHandler');
const ERRORS = require('../constants').ERRORS;
const debug = require('debug');
const log = debug('tus-node-server:handlers:head');
class HeadHandler extends BaseHandler {
    /**
     * Send the bytes received for a given file.
     *
     * @param  {object} request
     * @param  {object} h
     * @param  {object} headersInResponse
     * @return {function}
     */
    send(request, h, headersInResponse = {}) {
        // const file_id = this.getFileIdFromRequest(request);
        const file_id = request.params.file_id;
        if (file_id === false) {
            return super.send(h, ERRORS.FILE_NOT_FOUND.status_code, headersInResponse, ERRORS.FILE_NOT_FOUND.body);
        }

        return this.store.getOffset(file_id)
            .then((file) => {
                // The Server MUST prevent the client and/or proxies from
                // caching the response by adding the Cache-Control: no-store
                // header to the response.
                headersInResponse['Cache-Control'] = 'no-store';

                // The Server MUST always include the Upload-Offset header in
                // the response for a HEAD request, even if the offset is 0
                headersInResponse['Upload-Offset'] = file.size;

                if (file.upload_length !== undefined) {
                    // If the size of the upload is known, the Server MUST include
                    // the Upload-Length header in the response.
                    headersInResponse['Upload-Length'] = file.upload_length;
                }

                if (!('upload_length' in file) && file.upload_defer_length !== undefined) {
                    //  As long as the length of the upload is not known, the Server
                    //  MUST set Upload-Defer-Length: 1 in all responses to HEAD requests.
                    headersInResponse['Upload-Defer-Length'] = file.upload_defer_length;
                }

                if (file.upload_metadata !== undefined) {
                    // If the size of the upload is known, the Server MUST include
                    // the Upload-Length header in the response.
                    headersInResponse['Upload-Metadata'] = file.upload_metadata;
                }

                const responseObject = h.response().code(200);
                const headerKeys = Object.keys(headersInResponse);
                headerKeys.forEach((headerKey) => {
                    responseObject.header(headerKey, headersInResponse[headerKey]);
                });
                return responseObject;

                // return res.end();
            })
            .catch((error) => {
                log('[HeadHandler]', error);
                const status_code = error.status_code || ERRORS.UNKNOWN_ERROR.status_code;
                const body = error.body || `${ERRORS.UNKNOWN_ERROR.body}${error.message || ''}\n`;
                return super.send(h, status_code, headersInResponse, body);
            });
    }
}

module.exports = HeadHandler;
