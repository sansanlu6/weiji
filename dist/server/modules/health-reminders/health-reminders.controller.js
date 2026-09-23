"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HealthRemindersController", {
    enumerable: true,
    get: function() {
        return HealthRemindersController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../auth/jwt-auth.guard");
const _healthremindersservice = require("./health-reminders.service");
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
let HealthRemindersController = class HealthRemindersController {
    async getReminders(req) {
        const { userId } = req.user;
        return this.service.getReminders(userId);
    }
    async createReminder(req, body) {
        const { userId } = req.user;
        return this.service.createReminder(userId, body);
    }
    async updateReminder(req, id, body) {
        const { userId } = req.user;
        return this.service.updateReminder(userId, id, body);
    }
    async deleteReminder(req, id) {
        const { userId } = req.user;
        return this.service.deleteReminder(userId, id);
    }
    async toggleReminder(req, id) {
        const { userId } = req.user;
        return this.service.toggleReminder(userId, id);
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
], HealthRemindersController.prototype, "getReminders", null);
_ts_decorate([
    (0, _common.Post)(),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        typeof CreateReminderBody === "undefined" ? Object : CreateReminderBody
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRemindersController.prototype, "createReminder", null);
_ts_decorate([
    (0, _common.Patch)(':id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        typeof UpdateReminderBody === "undefined" ? Object : UpdateReminderBody
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRemindersController.prototype, "updateReminder", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRemindersController.prototype, "deleteReminder", null);
_ts_decorate([
    (0, _common.Patch)(':id/toggle'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRemindersController.prototype, "toggleReminder", null);
HealthRemindersController = _ts_decorate([
    (0, _common.Controller)('api/health/reminders'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _healthremindersservice.HealthRemindersService === "undefined" ? Object : _healthremindersservice.HealthRemindersService
    ])
], HealthRemindersController);
