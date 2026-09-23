"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HealthDataController", {
    enumerable: true,
    get: function() {
        return HealthDataController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../auth/jwt-auth.guard");
const _healthdataservice = require("./health-data.service");
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
const VALID_TYPES = [
    'sleep',
    'mood',
    'pain',
    'diet',
    'exercise',
    'water',
    'medication',
    'poop'
];
function validateType(type) {
    if (type && type !== 'all' && !VALID_TYPES.includes(type)) {
        throw new _common.BadRequestException(`无效的记录类型: ${type}`);
    }
}
let HealthDataController = class HealthDataController {
    // ========== 搜索记录 ==========
    async searchRecords(req, keyword, type, startDate, endDate, page, pageSize) {
        const { userId } = req.user;
        validateType(type);
        return this.service.searchRecords(userId, {
            keyword: keyword?.trim(),
            type: type && type !== 'all' ? type : undefined,
            startDate,
            endDate,
            page: page ? parseInt(page, 10) : 1,
            pageSize: pageSize ? parseInt(pageSize, 10) : 20
        });
    }
    // ========== 回收站 ==========
    async getRecycleBin(req, keyword, type, page, pageSize) {
        const { userId } = req.user;
        validateType(type);
        return this.service.getRecycleBin(userId, {
            keyword: keyword?.trim(),
            type: type && type !== 'all' ? type : undefined,
            page: page ? parseInt(page, 10) : 1,
            pageSize: pageSize ? parseInt(pageSize, 10) : 20
        });
    }
    async restoreRecord(req, type, id) {
        const { userId } = req.user;
        validateType(type);
        return this.service.restoreRecord(userId, type, id);
    }
    async permanentDelete(req, type, id) {
        const { userId } = req.user;
        validateType(type);
        return this.service.permanentDelete(userId, type, id);
    }
    // ========== 回收站批量操作 ==========
    async batchRestore(req, body) {
        const { userId } = req.user;
        const { type, ids } = body;
        validateType(type);
        if (!type || type === 'all') {
            throw new _common.BadRequestException('批量恢复必须指定具体记录类型');
        }
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new _common.BadRequestException('请提供要恢复的记录ID');
        }
        if (ids.length > 500) {
            throw new _common.BadRequestException('单次批量恢复最多 500 条');
        }
        return this.service.batchRestore(userId, type, ids);
    }
    async batchPermanentDelete(req, body) {
        const { userId } = req.user;
        const { type, ids } = body;
        validateType(type);
        if (!type || type === 'all') {
            throw new _common.BadRequestException('批量彻底删除必须指定具体记录类型');
        }
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new _common.BadRequestException('请提供要彻底删除的记录ID');
        }
        if (ids.length > 500) {
            throw new _common.BadRequestException('单次批量彻底删除最多 500 条');
        }
        return this.service.batchPermanentDelete(userId, type, ids);
    }
    // ========== 批量导出 ==========
    async exportRecords(req, res, type, startDate, endDate, format) {
        const { userId } = req.user;
        validateType(type);
        const fmt = format && format.toLowerCase() === 'csv' ? 'csv' : 'json';
        if (fmt === 'csv') {
            const csvContent = await this.service.exportCsv(userId, {
                type: type && type !== 'all' ? type : undefined,
                startDate,
                endDate
            });
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="health-records-${Date.now()}.csv"`);
            res.send('\uFEFF' + csvContent);
        } else {
            const result = await this.service.exportJson(userId, {
                type: type && type !== 'all' ? type : undefined,
                startDate,
                endDate
            });
            res.json(result);
        }
    }
    // ========== 批量删除 ==========
    async batchDelete(req, body) {
        const { userId } = req.user;
        const { type, ids } = body;
        validateType(type);
        if (!type || type === 'all') {
            throw new _common.BadRequestException('批量删除必须指定具体记录类型');
        }
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new _common.BadRequestException('请提供要删除的记录ID');
        }
        if (ids.length > 500) {
            throw new _common.BadRequestException('单次批量删除最多 500 条');
        }
        return this.service.batchDelete(userId, type, ids);
    }
    // ========== 图片去重查询 ==========
    async queryImageDedup(fileHash) {
        if (!fileHash) {
            throw new _common.BadRequestException('fileHash 不能为空');
        }
        return this.service.queryImageByHash(fileHash);
    }
    // ========== 图片去重登记 ==========
    async registerImageDedup(body) {
        const { fileHash, fileName, downloadUrl, fileSize } = body;
        if (!fileHash || !fileName || !downloadUrl) {
            throw new _common.BadRequestException('fileHash、fileName、downloadUrl 不能为空');
        }
        return this.service.registerImage(fileHash, fileName, downloadUrl, fileSize ?? 0);
    }
    constructor(service){
        this.service = service;
    }
};
_ts_decorate([
    (0, _common.Get)('search'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('keyword')),
    _ts_param(2, (0, _common.Query)('type')),
    _ts_param(3, (0, _common.Query)('startDate')),
    _ts_param(4, (0, _common.Query)('endDate')),
    _ts_param(5, (0, _common.Query)('page')),
    _ts_param(6, (0, _common.Query)('pageSize')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthDataController.prototype, "searchRecords", null);
_ts_decorate([
    (0, _common.Get)('recycle-bin'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('keyword')),
    _ts_param(2, (0, _common.Query)('type')),
    _ts_param(3, (0, _common.Query)('page')),
    _ts_param(4, (0, _common.Query)('pageSize')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthDataController.prototype, "getRecycleBin", null);
_ts_decorate([
    (0, _common.Post)('recycle-bin/:type/:id/restore'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('type')),
    _ts_param(2, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthDataController.prototype, "restoreRecord", null);
_ts_decorate([
    (0, _common.Delete)('recycle-bin/:type/:id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('type')),
    _ts_param(2, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthDataController.prototype, "permanentDelete", null);
_ts_decorate([
    (0, _common.Post)('recycle-bin/batch-restore'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthDataController.prototype, "batchRestore", null);
_ts_decorate([
    (0, _common.Post)('recycle-bin/batch-delete'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthDataController.prototype, "batchPermanentDelete", null);
_ts_decorate([
    (0, _common.Get)('export'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Res)()),
    _ts_param(2, (0, _common.Query)('type')),
    _ts_param(3, (0, _common.Query)('startDate')),
    _ts_param(4, (0, _common.Query)('endDate')),
    _ts_param(5, (0, _common.Query)('format')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        typeof Response === "undefined" ? Object : Response,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthDataController.prototype, "exportRecords", null);
_ts_decorate([
    (0, _common.Post)('batch-delete'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthDataController.prototype, "batchDelete", null);
_ts_decorate([
    (0, _common.Get)('image-dedup/query'),
    _ts_param(0, (0, _common.Query)('fileHash')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthDataController.prototype, "queryImageDedup", null);
_ts_decorate([
    (0, _common.Post)('image-dedup/register'),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthDataController.prototype, "registerImageDedup", null);
HealthDataController = _ts_decorate([
    (0, _common.Controller)('api/health/data'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _healthdataservice.HealthDataService === "undefined" ? Object : _healthdataservice.HealthDataService
    ])
], HealthDataController);
