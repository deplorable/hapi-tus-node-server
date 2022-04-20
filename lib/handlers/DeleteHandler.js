'use strict';

const BaseHandler = require('./BaseHandler');
const ERRORS = require('../constants').ERRORS;

class DeleteHandler extends BaseHandler {
    /**
     * Removes a file in the DataStore.
     *
     * @param  {object} req http.incomingMessage
     * @param  {object} res http.ServerResponse
     * @return {function}
     */
    send(request, h) {
        const file_id = request.params.file_id; //this.getFileIdFromRequest(request);
        console.log("file_id: " + file_id);
        if (!file_id) {
            console.warn('[DeleteHandler]: not a valid path');
            return Promise.resolve(super.send(h, 404, {}, 'Invalid path name\n'));
        }
        //req.file_id = file_id;
        console.log("Removing File Id: " + file_id);
        return this.store.removeFileId(file_id)
            .then(() => {
              //console.log("Removed File Id: " + file_id);
                return super.send(h, 204, {});
            })
            .catch((error) => {
              console.log("Problem Removing File Id: " + file_id);
              console.log(error);
                const status_code = error.status_code || ERRORS.UNKNOWN_ERROR.status_code;
                const body = error.body || `${ERRORS.UNKNOWN_ERROR.body}${error.message || ''}\n`;
                console.log(body);
                return super.send(h, status_code, {}, body);
            });
    }
}

module.exports = DeleteHandler;
