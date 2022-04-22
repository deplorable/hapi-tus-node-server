'use strict';

const BaseHandler = require('./BaseHandler');
const ALLOWED_METHODS = require('../constants').ALLOWED_METHODS;
const ALLOWED_HEADERS = require('../constants').ALLOWED_HEADERS;
const MAX_AGE = require('../constants').MAX_AGE;

// A successful response indicated by the 204 No Content status MUST contain
// the Tus-Version header. It MAY include the Tus-Extension and Tus-Max-Size headers.

class OptionsHandler extends BaseHandler {
    /**
     *
     *
     * @param  {object} request
     * @param  {object} h
     * @param  {object} headersInResponse
     * @return {function}
     */
    send(request, h, headersInResponse = {}) {

        // Preflight request
        headersInResponse['Access-Control-Allow-Methods'] = ALLOWED_METHODS;
        // res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
        headersInResponse['Access-Control-Allow-Headers'] = ALLOWED_HEADERS;
        // res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
        headersInResponse['Access-Control-Max-Age'] = MAX_AGE;
        // res.setHeader('Access-Control-Max-Age', MAX_AGE);

        if (this.store.extensions) {
            // res.setHeader('Tus-Extension', this.store.extensions);
            headersInResponse['Tus-Extension'] = this.store.extensions;
        }

        return super.send(h, 204, headersInResponse);
    }
}

module.exports = OptionsHandler;
