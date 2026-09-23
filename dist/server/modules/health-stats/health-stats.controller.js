"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HealthStatsController", {
    enumerable: true,
    get: function() {
        return HealthStatsController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../auth/jwt-auth.guard");
const _healthstatsservice = require("./health-stats.service");
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
let HealthStatsController = class HealthStatsController {
    async getSleepStats(req, period = 'month', range = '30') {
        const { userId } = req.user;
        const rangeNum = parseInt(range, 10);
        if (isNaN(rangeNum) || rangeNum <= 0) {
            throw new _common.BadRequestException('range 必须为正整数');
        }
        return this.statsService.getSleepStats(userId, period, rangeNum);
    }
    async getWaterStats(req, period = 'month', range = '30') {
        const { userId } = req.user;
        const rangeNum = parseInt(range, 10);
        if (isNaN(rangeNum) || rangeNum <= 0) {
            throw new _common.BadRequestException('range 必须为正整数');
        }
        return this.statsService.getWaterStats(userId, period, rangeNum);
    }
    async getExerciseStats(req, period = 'month', range = '30') {
        const { userId } = req.user;
        const rangeNum = parseInt(range, 10);
        if (isNaN(rangeNum) || rangeNum <= 0) {
            throw new _common.BadRequestException('range 必须为正整数');
        }
        return this.statsService.getExerciseStats(userId, period, rangeNum);
    }
    async getDietMealStats(req, startDate, endDate) {
        const { userId } = req.user;
        return this.statsService.getDietMealStats(userId, startDate, endDate);
    }
    async getMoodDistribution(req, startDate, endDate) {
        const { userId } = req.user;
        return this.statsService.getMoodDistribution(userId, startDate, endDate);
    }
    async getPainFrequency(req, startDate, endDate) {
        const { userId } = req.user;
        return this.statsService.getPainFrequency(userId, startDate, endDate);
    }
    async getSleepMoodCorrelation(req, range = '30') {
        const { userId } = req.user;
        const rangeNum = parseInt(range, 10);
        if (isNaN(rangeNum) || rangeNum <= 0) {
            throw new _common.BadRequestException('range 必须为正整数');
        }
        return this.statsService.getSleepMoodCorrelation(userId, rangeNum);
    }
    async getExerciseSleepCorrelation(req, range = '30') {
        const { userId } = req.user;
        const rangeNum = parseInt(range, 10);
        if (isNaN(rangeNum) || rangeNum <= 0) {
            throw new _common.BadRequestException('range 必须为正整数');
        }
        return this.statsService.getExerciseSleepCorrelation(userId, rangeNum);
    }
    async getAlerts(req, startDate, endDate) {
        const { userId } = req.user;
        return this.statsService.getAlerts(userId, startDate, endDate);
    }
    async getAlertConfig(req) {
        const { userId } = req.user;
        return this.statsService.getAlertConfig(userId);
    }
    async updateAlertConfig(req, type, body) {
        const { userId } = req.user;
        if (body.threshold === undefined && body.isEnabled === undefined) {
            throw new _common.BadRequestException('未提供可更新字段');
        }
        return this.statsService.updateAlertConfig(userId, type, body);
    }
    async getWeeklyDetailStats(req, startDate, endDate) {
        const { userId } = req.user;
        if (!startDate || !endDate) {
            throw new _common.BadRequestException('startDate 和 endDate 为必填');
        }
        return this.statsService.getWeeklyDetailStats(userId, startDate, endDate);
    }
    async getMonthlyDetailStats(req, startDate, endDate) {
        const { userId } = req.user;
        if (!startDate || !endDate) {
            throw new _common.BadRequestException('startDate 和 endDate 为必填');
        }
        return this.statsService.getMonthlyDetailStats(userId, startDate, endDate);
    }
    async getHalfYearDetailStats(req, endMonth) {
        const { userId } = req.user;
        if (endMonth && !/^\d{4}-\d{2}$/.test(endMonth)) {
            throw new _common.BadRequestException('endMonth 格式应为 YYYY-MM');
        }
        return this.statsService.getHalfYearDetailStats(userId, endMonth);
    }
    async getYearDetailStats(req, year) {
        const { userId } = req.user;
        const yearNum = parseInt(year, 10);
        if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
            throw new _common.BadRequestException('year 必须为有效的年份');
        }
        return this.statsService.getYearDetailStats(yearNum, userId);
    }
    constructor(statsService){
        this.statsService = statsService;
    }
};
_ts_decorate([
    (0, _common.Get)('sleep'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('period')),
    _ts_param(2, (0, _common.Query)('range')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthStatsController.prototype, "getSleepStats", null);
_ts_decorate([
    (0, _common.Get)('water'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('period')),
    _ts_param(2, (0, _common.Query)('range')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthStatsController.prototype, "getWaterStats", null);
_ts_decorate([
    (0, _common.Get)('exercise'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('period')),
    _ts_param(2, (0, _common.Query)('range')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthStatsController.prototype, "getExerciseStats", null);
_ts_decorate([
    (0, _common.Get)('diet/meals'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('startDate')),
    _ts_param(2, (0, _common.Query)('endDate')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthStatsController.prototype, "getDietMealStats", null);
_ts_decorate([
    (0, _common.Get)('mood/distribution'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('startDate')),
    _ts_param(2, (0, _common.Query)('endDate')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthStatsController.prototype, "getMoodDistribution", null);
_ts_decorate([
    (0, _common.Get)('pain/frequency'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('startDate')),
    _ts_param(2, (0, _common.Query)('endDate')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthStatsController.prototype, "getPainFrequency", null);
_ts_decorate([
    (0, _common.Get)('correlation/sleep-mood'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('range')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthStatsController.prototype, "getSleepMoodCorrelation", null);
_ts_decorate([
    (0, _common.Get)('correlation/exercise-sleep'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('range')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthStatsController.prototype, "getExerciseSleepCorrelation", null);
_ts_decorate([
    (0, _common.Get)('alerts'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('startDate')),
    _ts_param(2, (0, _common.Query)('endDate')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthStatsController.prototype, "getAlerts", null);
_ts_decorate([
    (0, _common.Get)('alert-config'),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthStatsController.prototype, "getAlertConfig", null);
_ts_decorate([
    (0, _common.Patch)('alert-config/:type'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('type')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthStatsController.prototype, "updateAlertConfig", null);
_ts_decorate([
    (0, _common.Get)('weekly-detail'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('startDate')),
    _ts_param(2, (0, _common.Query)('endDate')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthStatsController.prototype, "getWeeklyDetailStats", null);
_ts_decorate([
    (0, _common.Get)('monthly-detail'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('startDate')),
    _ts_param(2, (0, _common.Query)('endDate')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthStatsController.prototype, "getMonthlyDetailStats", null);
_ts_decorate([
    (0, _common.Get)('halfyear-detail'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('endMonth')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthStatsController.prototype, "getHalfYearDetailStats", null);
_ts_decorate([
    (0, _common.Get)('year-detail'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('year')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthStatsController.prototype, "getYearDetailStats", null);
HealthStatsController = _ts_decorate([
    (0, _common.Controller)('api/health/stats'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _healthstatsservice.HealthStatsService === "undefined" ? Object : _healthstatsservice.HealthStatsService
    ])
], HealthStatsController);
