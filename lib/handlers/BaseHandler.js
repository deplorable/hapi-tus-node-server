'use strict';

const DataStore = require('../stores/DataStore');
const EventEmitter = require('events');

class BaseHandler extends EventEmitter {
    constructor(store) {
        super();
        if (!(store instanceof DataStore)) {
            throw new Error(`${store} is not a DataStore`);
        }
        this.store = store;
    }

    /**
     * Wrapper on http.ServerResponse.
     *
     * @param  {object} h
     * @param  {integer} status
     * @param  {object} headers
     * @param  {string} body
     * @return {ServerResponse}
     */
    send(h, status, headers, body) {
        headers = headers ? headers : {};
        body = body ? body : '';
        headers = Object.assign(headers, {
            'Content-Length': body.length,
        });

        const responseObject = h.response(body).code(status);
        const headerKeys = Object.keys(headers);
        headerKeys.forEach((headerKey) => {
            responseObject.header(headerKey, headers[headerKey]);
        });
        // res.writeHead(status, headers);
        // res.write(body);
        // return res.end();
        return responseObject;
    }

    /**
     * Extract the file id from the request
     *
     * @param  {object} request
     * @return {bool|string}
     */
    getFileIdFromRequest(request) {
        let theUrl = (request.originalUrl || request.url);
        if ((typeof theUrl === 'object') && (theUrl.href)) {
            theUrl = theUrl.href;
        }
        console.log(theUrl);
        const urlLength = theUrl.length;
        console.log(`BaseHandler.getFileIdFromRequest() theUrl: ${theUrl}`);
        let lastSlashPosition = theUrl.lastIndexOf('/');
        let fileId = '';

        if (lastSlashPosition === (urlLength - 1)) {
            lastSlashPosition = theUrl.lastIndexOf('/', lastSlashPosition);
            // console.log(lastSlashPosition);
        }
        const substringStartAt = (lastSlashPosition + 1);
        fileId = theUrl.substr(substringStartAt);
        if (fileId.length > 32) {
            fileId = fileId.substr(0, 32);
        }
        console.log(`BaseHandler.getFileIdFromRequest() fileId: ${fileId}`);
        if (fileId.length < 32) {
            return false;
        }
        const file_id = fileId;
        return file_id;
    }

}

module.exports = BaseHandler;
