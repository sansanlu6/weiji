"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ViewController", {
    enumerable: true,
    get: function() {
        return ViewController;
    }
});
const _common = require("@nestjs/common");
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
function _ts_metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
        return Reflect.metadata(metadataKey, metadataValue);
    }
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let ViewController = class ViewController {
    async render(req) {
        // you can add custom render params here
        const platformData = req.__platform_data__ ?? {};
        return {
            // don't delete this line, it's used by client to get platform info
            __platform__: JSON.stringify(platformData)
        };
    }
};
_ts_decorate([
    (0, _common.Get)([
        '/',
        '*'
    ]),
    (0, _common.Render)('index'),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request
    ]),
    _ts_metadata("design:returntype", Promise)
], ViewController.prototype, "render", null);
ViewController = _ts_decorate([
    (0, _common.Controller)()
], ViewController);
