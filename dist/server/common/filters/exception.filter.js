"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "GlobalExceptionFilter", {
    enumerable: true,
    get: function() {
        return GlobalExceptionFilter;
    }
});
const _common = require("@nestjs/common");
const _exceptioninterface = require("../interfaces/exception.interface");
const _api_response_code = require("../constants/api_response_code");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") {
        r = Reflect.decorate(decorators, target, key, desc);
    } else {
        for(var i = decorators.length - 1; i >= 0; i--){
            if (d = decorators[i]) {
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
            }
        }
    }
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let GlobalExceptionFilter = class GlobalExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        // 如果响应头已发送，则不处理
        if (response.headersSent) {
            return;
        }
        let errorResponse;
        let httpStatus;
        if (exception instanceof _exceptioninterface.BusinessException) {
            // 业务异常
            httpStatus = exception.httpStatus;
            errorResponse = {
                error: {
                    code: exception.code,
                    message: exception.message,
                    details: exception.details,
                    fieldErrors: exception.fieldErrors,
                    timestamp: Date.now()
                }
            };
        } else if (exception instanceof _common.HttpException) {
            // HTTP异常
            httpStatus = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            errorResponse = {
                error: {
                    code: _api_response_code.HTTP_STATUS_TO_RESPONSE_CODE_MAP[httpStatus],
                    message: typeof exceptionResponse === 'string' ? exceptionResponse : exception.message,
                    details: typeof exceptionResponse === 'object' ? JSON.stringify(exceptionResponse) : undefined,
                    timestamp: Date.now()
                }
            };
        } else if (typeof exception === 'object' && exception !== null && exception.code === '22P02') {
            // Postgres invalid_text_representation：路径/查询参数与列类型不匹配（最常见是非法 UUID）
            // 与「合法 UUID 但记录不存在」走同一条 not-found 语义，避免 500 噪声
            httpStatus = _common.HttpStatus.NOT_FOUND;
            errorResponse = {
                error: {
                    code: _api_response_code.ResponseCode.NOT_FOUND,
                    message: '资源不存在',
                    timestamp: Date.now()
                }
            };
        } else {
            // 未知异常
            httpStatus = _common.HttpStatus.INTERNAL_SERVER_ERROR;
            errorResponse = {
                error: {
                    code: _api_response_code.ResponseCode.INTERNAL_ERROR,
                    message: '服务器内部错误',
                    stack: exception.stack,
                    cause: exception.cause,
                    timestamp: Date.now()
                }
            };
        }
        response.status(httpStatus).json(errorResponse);
    }
};
GlobalExceptionFilter = _ts_decorate([
    (0, _common.Catch)()
], GlobalExceptionFilter);
