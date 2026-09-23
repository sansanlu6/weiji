"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HealthDataService", {
    enumerable: true,
    get: function() {
        return HealthDataService;
    }
});
const _common = require("@nestjs/common");
const _fullstacknestjscore = require("@lark-apaas/fullstack-nestjs-core");
const _drizzleorm = require("drizzle-orm");
const _schema = require("../../database/schema");
const _healthrecordsutils = require("../health-records/health-records.utils");
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
const ALL_TYPES = [
    'sleep',
    'mood',
    'pain',
    'diet',
    'exercise',
    'water',
    'medication',
    'poop'
];
function getTableMeta(type) {
    switch(type){
        case 'sleep':
            return {
                table: _schema.healthSleep,
                timeCol: _schema.healthSleep.sleepTime,
                mapper: _healthrecordsutils.mapSleep,
                summarizer: _healthrecordsutils.summarizeSleep,
                keywordCols: [
                    _schema.healthSleep.note,
                    (0, _drizzleorm.sql)`'睡眠'`,
                    (0, _drizzleorm.sql)`'睡了'`
                ]
            };
        case 'mood':
            return {
                table: _schema.healthMood,
                timeCol: _schema.healthMood.recordTime,
                mapper: _healthrecordsutils.mapMood,
                summarizer: _healthrecordsutils.summarizeMood,
                keywordCols: [
                    _schema.healthMood.note,
                    (0, _drizzleorm.sql)`array_to_string(${_schema.healthMood.moods}, ',')`,
                    (0, _drizzleorm.sql)`'心情'`,
                    (0, _drizzleorm.sql)`'情绪'`
                ]
            };
        case 'pain':
            return {
                table: _schema.healthPain,
                timeCol: _schema.healthPain.startTime,
                mapper: _healthrecordsutils.mapPain,
                summarizer: _healthrecordsutils.summarizePain,
                keywordCols: [
                    _schema.healthPain.description,
                    _schema.healthPain.note,
                    (0, _drizzleorm.sql)`array_to_string(${_schema.healthPain.symptoms}, ',')`,
                    (0, _drizzleorm.sql)`'病痛'`
                ]
            };
        case 'diet':
            return {
                table: _schema.healthDiet,
                timeCol: (0, _drizzleorm.sql)`COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt})`,
                mapper: _healthrecordsutils.mapDiet,
                summarizer: _healthrecordsutils.summarizeDiet,
                keywordCols: [
                    _schema.healthDiet.foodDescription,
                    _schema.healthDiet.note,
                    (0, _drizzleorm.sql)`array_to_string(${_schema.healthDiet.tags}, ',')`,
                    (0, _drizzleorm.sql)`'饮食'`,
                    (0, _drizzleorm.sql)`CASE ${_schema.healthDiet.mealType}
            WHEN 'breakfast' THEN '早餐'
            WHEN 'lunch' THEN '午餐'
            WHEN 'dinner' THEN '晚餐'
            WHEN 'supper' THEN '宵夜'
            WHEN 'snack' THEN '加餐'
            ELSE ${_schema.healthDiet.mealType}
          END`
                ]
            };
        case 'exercise':
            return {
                table: _schema.healthExercise,
                timeCol: _schema.healthExercise.startTime,
                mapper: _healthrecordsutils.mapExercise,
                summarizer: _healthrecordsutils.summarizeExercise,
                keywordCols: [
                    _schema.healthExercise.note,
                    (0, _drizzleorm.sql)`CASE ${_schema.healthExercise.exerciseType}
            WHEN 'walking' THEN '步行健走走路'
            WHEN 'running' THEN '跑步'
            WHEN 'cycling' THEN '骑行'
            WHEN 'swimming' THEN '游泳'
            WHEN 'yoga' THEN '瑜伽'
            WHEN 'strength' THEN '力量训练'
            ELSE ${_schema.healthExercise.exerciseType}
          END`,
                    (0, _drizzleorm.sql)`'运动'`,
                    (0, _drizzleorm.sql)`'分钟'`
                ]
            };
        case 'water':
            return {
                table: _schema.healthWater,
                timeCol: _schema.healthWater.drinkTime,
                mapper: _healthrecordsutils.mapWater,
                summarizer: _healthrecordsutils.summarizeWater,
                keywordCols: [
                    (0, _drizzleorm.sql)`'喝水'`,
                    (0, _drizzleorm.sql)`'ml'`,
                    (0, _drizzleorm.sql)`${_schema.healthWater.amountMl}::text`
                ]
            };
        case 'medication':
            return {
                table: _schema.healthMedication,
                timeCol: _schema.healthMedication.takeTime,
                mapper: _healthrecordsutils.mapMedication,
                summarizer: _healthrecordsutils.summarizeMedication,
                keywordCols: [
                    _schema.healthMedication.medicineName,
                    _schema.healthMedication.relatedSymptom,
                    _schema.healthMedication.dosage,
                    _schema.healthMedication.note,
                    (0, _drizzleorm.sql)`'用药'`
                ]
            };
        case 'poop':
            return {
                table: _schema.healthPoop,
                timeCol: _schema.healthPoop.poopTime,
                mapper: _healthrecordsutils.mapPoop,
                summarizer: _healthrecordsutils.summarizePoop,
                keywordCols: [
                    _schema.healthPoop.note,
                    (0, _drizzleorm.sql)`CASE ${_schema.healthPoop.stoolType}
            WHEN 'normal' THEN '正常'
            WHEN 'hard' THEN '偏硬'
            WHEN 'soft' THEN '偏软'
            WHEN 'loose' THEN '稀便'
            WHEN 'constipated' THEN '便秘'
            WHEN 'diarrhea' THEN '腹泻'
            ELSE ${_schema.healthPoop.stoolType}
          END`,
                    (0, _drizzleorm.sql)`'排便'`
                ]
            };
    }
}
let HealthDataService = class HealthDataService {
    // ==================== 搜索记录 ====================
    async searchRecords(userId, query) {
        const { page, pageSize } = query;
        const types = query.type ? [
            query.type
        ] : ALL_TYPES;
        // 并行查询各表，每页最多 pageSize 条各取 pageSize，合并后再切分
        const results = await Promise.all(types.map((t)=>this.searchOneType(userId, t, query)));
        const allItems = [];
        let total = 0;
        for (const r of results){
            allItems.push(...r.items);
            total += r.total;
        }
        // 按时间倒序排序
        allItems.sort((a, b)=>new Date(b.time).getTime() - new Date(a.time).getTime());
        // 分页截取
        const start = (page - 1) * pageSize;
        const pagedItems = allItems.slice(start, start + pageSize);
        return {
            items: pagedItems,
            total,
            page,
            pageSize
        };
    }
    async searchOneType(userId, type, query) {
        const { table, timeCol, mapper, summarizer, keywordCols } = getTableMeta(type);
        const { keyword, startDate, endDate, pageSize } = query;
        const conds = [
            (0, _drizzleorm.eq)(table.userId, userId),
            (0, _drizzleorm.eq)(table.isDeleted, false)
        ];
        if (startDate) conds.push((0, _drizzleorm.gte)(timeCol, new Date(startDate).toISOString()));
        if (endDate) conds.push((0, _drizzleorm.lt)(timeCol, new Date(endDate).toISOString()));
        if (keyword && keywordCols.length > 0) {
            const likePattern = `%${keyword}%`;
            const keywordConds = keywordCols.map((col)=>(0, _drizzleorm.ilike)(col, likePattern));
            conds.push((0, _drizzleorm.or)(...keywordConds));
        }
        // 如果有 keyword 但该表无文本列，返回空
        if (keyword && keywordCols.length === 0) {
            return {
                items: [],
                total: 0
            };
        }
        const where = (0, _drizzleorm.and)(...conds);
        const [countRes, rows] = await Promise.all([
            this.db.select({
                count: (0, _drizzleorm.sql)`count(*)`
            }).from(table).where(where),
            this.db.select().from(table).where(where).orderBy((0, _drizzleorm.desc)(timeCol)).limit(pageSize)
        ]);
        const total = Number(countRes[0]?.count ?? 0);
        const items = rows.map((row)=>{
            const detail = mapper(row);
            return {
                id: row.id,
                type,
                typeLabel: _healthrecordsutils.TYPE_LABELS[type],
                time: detail[Object.keys(detail).find((k)=>k.toLowerCase().includes('time') && k !== 'createdAt') || 'createdAt'],
                summary: summarizer(row),
                detail
            };
        });
        return {
            items,
            total
        };
    }
    // ==================== 回收站 ====================
    async getRecycleBin(userId, query) {
        const { page, pageSize } = query;
        const types = query.type ? [
            query.type
        ] : ALL_TYPES;
        const results = await Promise.all(types.map((t)=>this.getRecycleOneType(userId, t, query)));
        const allItems = [];
        let total = 0;
        for (const r of results){
            allItems.push(...r.items);
            total += r.total;
        }
        allItems.sort((a, b)=>new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
        const start = (page - 1) * pageSize;
        const pagedItems = allItems.slice(start, start + pageSize);
        return {
            items: pagedItems,
            total,
            page,
            pageSize
        };
    }
    async getRecycleOneType(userId, type, query) {
        const { table, timeCol, mapper, summarizer, keywordCols } = getTableMeta(type);
        const { keyword, pageSize } = query;
        const conds = [
            (0, _drizzleorm.eq)(table.userId, userId),
            (0, _drizzleorm.eq)(table.isDeleted, true)
        ];
        if (keyword && keywordCols.length > 0) {
            const likePattern = `%${keyword}%`;
            const keywordConds = keywordCols.map((col)=>(0, _drizzleorm.ilike)(col, likePattern));
            conds.push((0, _drizzleorm.or)(...keywordConds));
        }
        if (keyword && keywordCols.length === 0) {
            return {
                items: [],
                total: 0
            };
        }
        const where = (0, _drizzleorm.and)(...conds);
        const [countRes, rows] = await Promise.all([
            this.db.select({
                count: (0, _drizzleorm.sql)`count(*)`
            }).from(table).where(where),
            this.db.select().from(table).where(where).orderBy((0, _drizzleorm.desc)(table.updatedAt)).limit(pageSize)
        ]);
        const total = Number(countRes[0]?.count ?? 0);
        const items = rows.map((row)=>{
            const detail = mapper(row);
            const timeKey = Object.keys(detail).find((k)=>k.toLowerCase().includes('time') && k !== 'createdAt') || 'createdAt';
            return {
                id: row.id,
                type,
                typeLabel: _healthrecordsutils.TYPE_LABELS[type],
                time: detail[timeKey],
                summary: summarizer(row),
                detail,
                deletedAt: row.updatedAt.toISOString()
            };
        });
        return {
            items,
            total
        };
    }
    async restoreRecord(userId, type, id) {
        const { table } = getTableMeta(type);
        const updated = await this.db.update(table).set({
            isDeleted: false
        }).where((0, _drizzleorm.and)((0, _drizzleorm.eq)(table.userId, userId), (0, _drizzleorm.eq)(table.id, id), (0, _drizzleorm.eq)(table.isDeleted, true))).returning({
            id: table.id
        });
        if (updated.length === 0) throw new _common.NotFoundException('记录不存在或未在回收站中');
        return {
            success: true
        };
    }
    async permanentDelete(userId, type, id) {
        const { table } = getTableMeta(type);
        const deleted = await this.db.delete(table).where((0, _drizzleorm.and)((0, _drizzleorm.eq)(table.userId, userId), (0, _drizzleorm.eq)(table.id, id), (0, _drizzleorm.eq)(table.isDeleted, true))).returning({
            id: table.id
        });
        if (deleted.length === 0) throw new _common.NotFoundException('记录不存在或未在回收站中');
        return {
            success: true
        };
    }
    async batchRestore(userId, type, ids) {
        const { table } = getTableMeta(type);
        const updated = await this.db.update(table).set({
            isDeleted: false
        }).where((0, _drizzleorm.and)((0, _drizzleorm.eq)(table.userId, userId), (0, _drizzleorm.inArray)(table.id, ids), (0, _drizzleorm.eq)(table.isDeleted, true))).returning({
            id: table.id
        });
        return {
            success: true,
            restoredCount: updated.length
        };
    }
    async batchPermanentDelete(userId, type, ids) {
        const { table } = getTableMeta(type);
        const deleted = await this.db.delete(table).where((0, _drizzleorm.and)((0, _drizzleorm.eq)(table.userId, userId), (0, _drizzleorm.inArray)(table.id, ids), (0, _drizzleorm.eq)(table.isDeleted, true))).returning({
            id: table.id
        });
        return {
            success: true,
            deletedCount: deleted.length
        };
    }
    // ==================== 批量导出 ====================
    async exportJson(userId, query) {
        const types = query.type ? [
            query.type
        ] : ALL_TYPES;
        const results = await Promise.all(types.map((t)=>this.exportOneType(userId, t, query)));
        const allItems = [];
        for (const r of results){
            allItems.push(...r);
        }
        allItems.sort((a, b)=>new Date(b.time).getTime() - new Date(a.time).getTime());
        return {
            records: allItems,
            exportTime: new Date().toISOString(),
            total: allItems.length
        };
    }
    async exportOneType(userId, type, query) {
        const { table, timeCol, mapper, summarizer } = getTableMeta(type);
        const { startDate, endDate } = query;
        const conds = [
            (0, _drizzleorm.eq)(table.userId, userId),
            (0, _drizzleorm.eq)(table.isDeleted, false)
        ];
        if (startDate) conds.push((0, _drizzleorm.gte)(timeCol, new Date(startDate).toISOString()));
        if (endDate) conds.push((0, _drizzleorm.lt)(timeCol, new Date(endDate).toISOString()));
        const rows = await this.db.select().from(table).where((0, _drizzleorm.and)(...conds)).orderBy((0, _drizzleorm.desc)(timeCol));
        return rows.map((row)=>{
            const detail = mapper(row);
            const timeKey = Object.keys(detail).find((k)=>k.toLowerCase().includes('time') && k !== 'createdAt') || 'createdAt';
            return {
                id: row.id,
                type,
                typeLabel: _healthrecordsutils.TYPE_LABELS[type],
                time: detail[timeKey],
                summary: summarizer(row),
                detail
            };
        });
    }
    async exportCsv(userId, query) {
        const { records } = await this.exportJson(userId, query);
        if (records.length === 0) {
            return 'id,type,typeLabel,time,summary\n';
        }
        const headers = [
            'id',
            'type',
            'typeLabel',
            'time',
            'summary'
        ];
        const lines = [
            headers.join(',')
        ];
        for (const r of records){
            const row = [
                r.id,
                r.type,
                r.typeLabel,
                r.time,
                this.escapeCsv(r.summary)
            ];
            lines.push(row.join(','));
        }
        return lines.join('\n');
    }
    escapeCsv(value) {
        if (value == null) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }
    // ==================== 批量删除 ====================
    async batchDelete(userId, type, ids) {
        const { table } = getTableMeta(type);
        const updated = await this.db.update(table).set({
            isDeleted: true
        }).where((0, _drizzleorm.and)((0, _drizzleorm.eq)(table.userId, userId), (0, _drizzleorm.inArray)(table.id, ids), (0, _drizzleorm.eq)(table.isDeleted, false))).returning({
            id: table.id
        });
        return {
            success: true,
            deletedCount: updated.length
        };
    }
    async queryImageByHash(fileHash) {
        const rows = await this.db.select({
            downloadUrl: _schema.imageDedup.downloadUrl,
            fileName: _schema.imageDedup.fileName,
            fileSize: _schema.imageDedup.fileSize
        }).from(_schema.imageDedup).where((0, _drizzleorm.eq)(_schema.imageDedup.fileHash, fileHash)).limit(1);
        if (rows.length === 0) {
            return {
                exists: false
            };
        }
        const row = rows[0];
        return {
            exists: true,
            downloadUrl: row.downloadUrl,
            fileName: row.fileName,
            fileSize: row.fileSize ?? 0
        };
    }
    async registerImage(fileHash, fileName, downloadUrl, fileSize) {
        const existing = await this.db.select({
            downloadUrl: _schema.imageDedup.downloadUrl
        }).from(_schema.imageDedup).where((0, _drizzleorm.eq)(_schema.imageDedup.fileHash, fileHash)).limit(1);
        if (existing.length > 0) {
            await this.db.update(_schema.imageDedup).set({
                refCount: (0, _drizzleorm.sql)`${_schema.imageDedup.refCount} + 1`
            }).where((0, _drizzleorm.eq)(_schema.imageDedup.fileHash, fileHash));
            return {
                success: true,
                downloadUrl: existing[0].downloadUrl
            };
        }
        await this.db.insert(_schema.imageDedup).values({
            fileHash,
            fileName,
            downloadUrl,
            fileSize
        });
        return {
            success: true,
            downloadUrl
        };
    }
    constructor(db){
        this.db = db;
        this.logger = new _common.Logger(HealthDataService.name);
    }
};
HealthDataService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_fullstacknestjscore.DRIZZLE_DATABASE)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof PostgresJsDatabase === "undefined" ? Object : PostgresJsDatabase
    ])
], HealthDataService);
