"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HealthRecordsModule", {
    enumerable: true,
    get: function() {
        return HealthRecordsModule;
    }
});
const _common = require("@nestjs/common");
const _healthrecordscontroller = require("./health-records.controller");
const _healthrecordsservice = require("./health-records.service");
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
let HealthRecordsModule = class HealthRecordsModule {
};
HealthRecordsModule = _ts_decorate([
    (0, _common.Module)({
        controllers: [
            _healthrecordscontroller.HealthRecordsController
        ],
        providers: [
            _healthrecordsservice.HealthRecordsService
        ]
    })
], HealthRecordsModule);
