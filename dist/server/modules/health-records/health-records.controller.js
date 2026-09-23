"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HealthRecordsController", {
    enumerable: true,
    get: function() {
        return HealthRecordsController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../auth/jwt-auth.guard");
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
let HealthRecordsController = class HealthRecordsController {
    // ========== Overview ==========
    async getTodayOverview(req) {
        const { userId } = req.user;
        return this.service.getTodayOverview(userId);
    }
    async getRecentRecords(req, limit) {
        const { userId } = req.user;
        const limitNum = limit ? parseInt(limit, 10) : 20;
        return this.service.getRecentRecords(userId, limitNum);
    }
    async getAchievements(req) {
        const { userId } = req.user;
        return this.service.getAchievements(userId);
    }
    async getProfileSummary(req) {
        const { userId } = req.user;
        return this.service.getProfileSummary(userId);
    }
    async getProfile(req) {
        const { userId } = req.user;
        return this.service.getProfile(userId);
    }
    async updateProfile(req, body) {
        const { userId } = req.user;
        try {
            return await this.service.updateProfile(userId, body);
        } catch (err) {
            if (err instanceof _common.HttpException) throw err;
            this.logger.error(`updateProfile failed: ${JSON.stringify(err)}`);
            throw err;
        }
    }
    // ========== Sleep ==========
    async listSleep(req, page, pageSize, startDate, endDate) {
        const { userId } = req.user;
        return this.service.listSleep(userId, {
            page: page ? parseInt(page, 10) : 1,
            pageSize: pageSize ? parseInt(pageSize, 10) : 20,
            startDate,
            endDate
        });
    }
    async createSleep(req, body) {
        const { userId } = req.user;
        return this.service.createSleep(userId, body);
    }
    async getSleep(req, id) {
        const { userId } = req.user;
        return this.service.getSleep(userId, id);
    }
    async updateSleep(req, id, body) {
        const { userId } = req.user;
        return this.service.updateSleep(userId, id, body);
    }
    async deleteSleep(req, id) {
        const { userId } = req.user;
        return this.service.deleteSleep(userId, id);
    }
    // ========== Mood ==========
    async listMood(req, page, pageSize, startDate, endDate) {
        const { userId } = req.user;
        return this.service.listMood(userId, {
            page: page ? parseInt(page, 10) : 1,
            pageSize: pageSize ? parseInt(pageSize, 10) : 20,
            startDate,
            endDate
        });
    }
    async createMood(req, body) {
        const { userId } = req.user;
        return this.service.createMood(userId, body);
    }
    async getMood(req, id) {
        const { userId } = req.user;
        return this.service.getMood(userId, id);
    }
    async updateMood(req, id, body) {
        const { userId } = req.user;
        return this.service.updateMood(userId, id, body);
    }
    async deleteMood(req, id) {
        const { userId } = req.user;
        return this.service.deleteMood(userId, id);
    }
    // ========== Pain ==========
    async listPain(req, page, pageSize, startDate, endDate) {
        const { userId } = req.user;
        return this.service.listPain(userId, {
            page: page ? parseInt(page, 10) : 1,
            pageSize: pageSize ? parseInt(pageSize, 10) : 20,
            startDate,
            endDate
        });
    }
    async createPain(req, body) {
        const { userId } = req.user;
        return this.service.createPain(userId, body);
    }
    async getPain(req, id) {
        const { userId } = req.user;
        return this.service.getPain(userId, id);
    }
    async updatePain(req, id, body) {
        const { userId } = req.user;
        return this.service.updatePain(userId, id, body);
    }
    async deletePain(req, id) {
        const { userId } = req.user;
        return this.service.deletePain(userId, id);
    }
    // ========== Diet ==========
    async listDiet(req, page, pageSize, startDate, endDate) {
        const { userId } = req.user;
        return this.service.listDiet(userId, {
            page: page ? parseInt(page, 10) : 1,
            pageSize: pageSize ? parseInt(pageSize, 10) : 20,
            startDate,
            endDate
        });
    }
    async createDiet(req, body) {
        const { userId } = req.user;
        return this.service.createDiet(userId, body);
    }
    async getDiet(req, id) {
        const { userId } = req.user;
        return this.service.getDiet(userId, id);
    }
    async updateDiet(req, id, body) {
        const { userId } = req.user;
        return this.service.updateDiet(userId, id, body);
    }
    async deleteDiet(req, id) {
        const { userId } = req.user;
        return this.service.deleteDiet(userId, id);
    }
    // ========== Exercise ==========
    async listExercise(req, page, pageSize, startDate, endDate) {
        const { userId } = req.user;
        return this.service.listExercise(userId, {
            page: page ? parseInt(page, 10) : 1,
            pageSize: pageSize ? parseInt(pageSize, 10) : 20,
            startDate,
            endDate
        });
    }
    async createExercise(req, body) {
        const { userId } = req.user;
        return this.service.createExercise(userId, body);
    }
    async getExercise(req, id) {
        const { userId } = req.user;
        return this.service.getExercise(userId, id);
    }
    async updateExercise(req, id, body) {
        const { userId } = req.user;
        return this.service.updateExercise(userId, id, body);
    }
    async deleteExercise(req, id) {
        const { userId } = req.user;
        return this.service.deleteExercise(userId, id);
    }
    // ========== Water ==========
    async listWater(req, page, pageSize, startDate, endDate) {
        const { userId } = req.user;
        return this.service.listWater(userId, {
            page: page ? parseInt(page, 10) : 1,
            pageSize: pageSize ? parseInt(pageSize, 10) : 20,
            startDate,
            endDate
        });
    }
    async createWater(req, body) {
        const { userId } = req.user;
        return this.service.createWater(userId, body);
    }
    async getWater(req, id) {
        const { userId } = req.user;
        return this.service.getWater(userId, id);
    }
    async updateWater(req, id, body) {
        const { userId } = req.user;
        return this.service.updateWater(userId, id, body);
    }
    async deleteWater(req, id) {
        const { userId } = req.user;
        return this.service.deleteWater(userId, id);
    }
    // ========== Medication ==========
    async listMedication(req, page, pageSize, startDate, endDate) {
        const { userId } = req.user;
        return this.service.listMedication(userId, {
            page: page ? parseInt(page, 10) : 1,
            pageSize: pageSize ? parseInt(pageSize, 10) : 20,
            startDate,
            endDate
        });
    }
    async createMedication(req, body) {
        const { userId } = req.user;
        return this.service.createMedication(userId, body);
    }
    async getMedication(req, id) {
        const { userId } = req.user;
        return this.service.getMedication(userId, id);
    }
    async updateMedication(req, id, body) {
        const { userId } = req.user;
        return this.service.updateMedication(userId, id, body);
    }
    async deleteMedication(req, id) {
        const { userId } = req.user;
        return this.service.deleteMedication(userId, id);
    }
    // ========== Poop ==========
    async listPoop(req, page, pageSize, startDate, endDate) {
        const { userId } = req.user;
        return this.service.listPoop(userId, {
            page: page ? parseInt(page, 10) : 1,
            pageSize: pageSize ? parseInt(pageSize, 10) : 20,
            startDate,
            endDate
        });
    }
    async createPoop(req, body) {
        const { userId } = req.user;
        return this.service.createPoop(userId, body);
    }
    async getPoop(req, id) {
        const { userId } = req.user;
        return this.service.getPoop(userId, id);
    }
    async updatePoop(req, id, body) {
        const { userId } = req.user;
        return this.service.updatePoop(userId, id, body);
    }
    async deletePoop(req, id) {
        const { userId } = req.user;
        return this.service.deletePoop(userId, id);
    }
    constructor(service){
        this.service = service;
        this.logger = new _common.Logger(HealthRecordsController.name);
    }
};
_ts_decorate([
    (0, _common.Get)('overview/today'),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "getTodayOverview", null);
_ts_decorate([
    (0, _common.Get)('overview/recent'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('limit')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "getRecentRecords", null);
_ts_decorate([
    (0, _common.Get)('achievements'),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "getAchievements", null);
_ts_decorate([
    (0, _common.Get)('profile-summary'),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "getProfileSummary", null);
_ts_decorate([
    (0, _common.Get)('profile'),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "getProfile", null);
_ts_decorate([
    (0, _common.Put)('profile'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        typeof UpdateProfileRequest === "undefined" ? Object : UpdateProfileRequest
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "updateProfile", null);
_ts_decorate([
    (0, _common.Get)('sleep'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('page')),
    _ts_param(2, (0, _common.Query)('pageSize')),
    _ts_param(3, (0, _common.Query)('startDate')),
    _ts_param(4, (0, _common.Query)('endDate')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "listSleep", null);
_ts_decorate([
    (0, _common.Post)('sleep'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "createSleep", null);
_ts_decorate([
    (0, _common.Get)('sleep/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "getSleep", null);
_ts_decorate([
    (0, _common.Patch)('sleep/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "updateSleep", null);
_ts_decorate([
    (0, _common.Delete)('sleep/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "deleteSleep", null);
_ts_decorate([
    (0, _common.Get)('mood'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('page')),
    _ts_param(2, (0, _common.Query)('pageSize')),
    _ts_param(3, (0, _common.Query)('startDate')),
    _ts_param(4, (0, _common.Query)('endDate')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "listMood", null);
_ts_decorate([
    (0, _common.Post)('mood'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "createMood", null);
_ts_decorate([
    (0, _common.Get)('mood/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "getMood", null);
_ts_decorate([
    (0, _common.Patch)('mood/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "updateMood", null);
_ts_decorate([
    (0, _common.Delete)('mood/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "deleteMood", null);
_ts_decorate([
    (0, _common.Get)('pain'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('page')),
    _ts_param(2, (0, _common.Query)('pageSize')),
    _ts_param(3, (0, _common.Query)('startDate')),
    _ts_param(4, (0, _common.Query)('endDate')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "listPain", null);
_ts_decorate([
    (0, _common.Post)('pain'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "createPain", null);
_ts_decorate([
    (0, _common.Get)('pain/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "getPain", null);
_ts_decorate([
    (0, _common.Patch)('pain/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "updatePain", null);
_ts_decorate([
    (0, _common.Delete)('pain/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "deletePain", null);
_ts_decorate([
    (0, _common.Get)('diet'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('page')),
    _ts_param(2, (0, _common.Query)('pageSize')),
    _ts_param(3, (0, _common.Query)('startDate')),
    _ts_param(4, (0, _common.Query)('endDate')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "listDiet", null);
_ts_decorate([
    (0, _common.Post)('diet'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "createDiet", null);
_ts_decorate([
    (0, _common.Get)('diet/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "getDiet", null);
_ts_decorate([
    (0, _common.Patch)('diet/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "updateDiet", null);
_ts_decorate([
    (0, _common.Delete)('diet/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "deleteDiet", null);
_ts_decorate([
    (0, _common.Get)('exercise'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('page')),
    _ts_param(2, (0, _common.Query)('pageSize')),
    _ts_param(3, (0, _common.Query)('startDate')),
    _ts_param(4, (0, _common.Query)('endDate')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "listExercise", null);
_ts_decorate([
    (0, _common.Post)('exercise'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "createExercise", null);
_ts_decorate([
    (0, _common.Get)('exercise/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "getExercise", null);
_ts_decorate([
    (0, _common.Patch)('exercise/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "updateExercise", null);
_ts_decorate([
    (0, _common.Delete)('exercise/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "deleteExercise", null);
_ts_decorate([
    (0, _common.Get)('water'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('page')),
    _ts_param(2, (0, _common.Query)('pageSize')),
    _ts_param(3, (0, _common.Query)('startDate')),
    _ts_param(4, (0, _common.Query)('endDate')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "listWater", null);
_ts_decorate([
    (0, _common.Post)('water'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "createWater", null);
_ts_decorate([
    (0, _common.Get)('water/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "getWater", null);
_ts_decorate([
    (0, _common.Patch)('water/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "updateWater", null);
_ts_decorate([
    (0, _common.Delete)('water/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "deleteWater", null);
_ts_decorate([
    (0, _common.Get)('medication'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('page')),
    _ts_param(2, (0, _common.Query)('pageSize')),
    _ts_param(3, (0, _common.Query)('startDate')),
    _ts_param(4, (0, _common.Query)('endDate')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "listMedication", null);
_ts_decorate([
    (0, _common.Post)('medication'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "createMedication", null);
_ts_decorate([
    (0, _common.Get)('medication/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "getMedication", null);
_ts_decorate([
    (0, _common.Patch)('medication/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "updateMedication", null);
_ts_decorate([
    (0, _common.Delete)('medication/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "deleteMedication", null);
_ts_decorate([
    (0, _common.Get)('poop'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('page')),
    _ts_param(2, (0, _common.Query)('pageSize')),
    _ts_param(3, (0, _common.Query)('startDate')),
    _ts_param(4, (0, _common.Query)('endDate')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "listPoop", null);
_ts_decorate([
    (0, _common.Post)('poop'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "createPoop", null);
_ts_decorate([
    (0, _common.Get)('poop/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "getPoop", null);
_ts_decorate([
    (0, _common.Patch)('poop/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "updatePoop", null);
_ts_decorate([
    (0, _common.Delete)('poop/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthRecordsController.prototype, "deletePoop", null);
HealthRecordsController = _ts_decorate([
    (0, _common.Controller)('api/health'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _healthrecordsservice.HealthRecordsService === "undefined" ? Object : _healthrecordsservice.HealthRecordsService
    ])
], HealthRecordsController);
