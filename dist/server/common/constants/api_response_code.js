"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get HTTP_STATUS_TO_RESPONSE_CODE_MAP () {
        return HTTP_STATUS_TO_RESPONSE_CODE_MAP;
    },
    get RESPONSE_CODE_TO_HTTP_STATUS_MAP () {
        return RESPONSE_CODE_TO_HTTP_STATUS_MAP;
    },
    get ResponseCode () {
        return ResponseCode;
    }
});
const _common = require("@nestjs/common");
var ResponseCode = /*#__PURE__*/ function(ResponseCode) {
    // 成功状态
    ResponseCode["SUCCESS"] = "SUCCESS";
    ResponseCode["CREATED"] = "CREATED";
    ResponseCode["ACCEPTED"] = "ACCEPTED";
    ResponseCode["NO_CONTENT"] = "NO_CONTENT";
    // 客户端错误
    ResponseCode["BAD_REQUEST"] = "BAD_REQUEST";
    ResponseCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ResponseCode["FORBIDDEN"] = "FORBIDDEN";
    ResponseCode["NOT_FOUND"] = "NOT_FOUND";
    ResponseCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ResponseCode["CONFLICT"] = "CONFLICT";
    ResponseCode["TOO_MANY_REQUESTS"] = "TOO_MANY_REQUESTS";
    // 服务端错误
    ResponseCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ResponseCode["BAD_GATEWAY"] = "BAD_GATEWAY";
    ResponseCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    // 业务错误
    ResponseCode["BUSINESS_ERROR"] = "BUSINESS_ERROR";
    return ResponseCode;
}({});
const RESPONSE_CODE_TO_HTTP_STATUS_MAP = {
    ["SUCCESS"]: _common.HttpStatus.OK,
    ["CREATED"]: _common.HttpStatus.CREATED,
    ["ACCEPTED"]: _common.HttpStatus.ACCEPTED,
    ["NO_CONTENT"]: _common.HttpStatus.NO_CONTENT,
    ["BAD_REQUEST"]: _common.HttpStatus.BAD_REQUEST,
    ["UNAUTHORIZED"]: _common.HttpStatus.UNAUTHORIZED,
    ["FORBIDDEN"]: _common.HttpStatus.FORBIDDEN,
    ["NOT_FOUND"]: _common.HttpStatus.NOT_FOUND,
    ["VALIDATION_ERROR"]: _common.HttpStatus.UNPROCESSABLE_ENTITY,
    ["CONFLICT"]: _common.HttpStatus.CONFLICT,
    ["TOO_MANY_REQUESTS"]: _common.HttpStatus.TOO_MANY_REQUESTS,
    ["INTERNAL_ERROR"]: _common.HttpStatus.INTERNAL_SERVER_ERROR,
    ["BAD_GATEWAY"]: _common.HttpStatus.BAD_GATEWAY,
    ["SERVICE_UNAVAILABLE"]: _common.HttpStatus.SERVICE_UNAVAILABLE,
    ["BUSINESS_ERROR"]: _common.HttpStatus.UNPROCESSABLE_ENTITY
};
const HTTP_STATUS_TO_RESPONSE_CODE_MAP = Object.fromEntries(Object.entries(RESPONSE_CODE_TO_HTTP_STATUS_MAP).map(([code, status])=>[
        status,
        code
    ]));
