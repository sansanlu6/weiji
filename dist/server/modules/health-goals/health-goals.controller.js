"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HealthGoalsController", {
    enumerable: true,
    get: function() {
        return HealthGoalsController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../auth/jwt-auth.guard");
const _healthgoalsservice = require("./health-goals.service");
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
let HealthGoalsController = class HealthGoalsController {
    async getGoals(req) {
        const { userId } = req.user;
        return this.service.getGoals(userId);
    }
    async upsertGoal(req, goalType, body) {
        const { userId } = req.user;
        return this.service.upsertGoal(userId, goalType, body);
    }
    constructor(service){
        this.service = service;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthGoalsController.prototype, "getGoals", null);
_ts_decorate([
    (0, _common.Put)(':goalType'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('goalType')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        typeof UpsertGoalBody === "undefined" ? Object : UpsertGoalBody
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthGoalsController.prototype, "upsertGoal", null);
HealthGoalsController = _ts_decorate([
    (0, _common.Controller)('api/health/goals'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _healthgoalsservice.HealthGoalsService === "undefined" ? Object : _healthgoalsservice.HealthGoalsService
    ])
], HealthGoalsController);
