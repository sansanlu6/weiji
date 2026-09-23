// 业务异常类
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BusinessException", {
    enumerable: true,
    get: function() {
        return BusinessException;
    }
});
const _common = require("@nestjs/common");
const _api_response_code = require("../constants/api_response_code");
let BusinessException = class BusinessException extends Error {
    getHttpStatus() {
        return _api_response_code.RESPONSE_CODE_TO_HTTP_STATUS_MAP[this.code];
    }
    constructor(code, message, httpStatus = _common.HttpStatus.BAD_REQUEST, details, fieldErrors){
        super(message), this.code = code, this.message = message, this.httpStatus = httpStatus, this.details = details, this.fieldErrors = fieldErrors;
        this.name = 'BusinessException';
    }
};
