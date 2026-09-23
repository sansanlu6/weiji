"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HealthRemindersService", {
    enumerable: true,
    get: function() {
        return HealthRemindersService;
    }
});
const _common = require("@nestjs/common");
const _fullstacknestjscore = require("@lark-apaas/fullstack-nestjs-core");
const _drizzleorm = require("drizzle-orm");
const _schema = require("../../database/schema");
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
const VALID_REMINDER_TYPES = [
    'water',
    'medication',
    'activity'
];
const VALID_REPEAT_TYPES = [
    'daily',
    'weekly',
    'interval'
];
const DEFAULT_WATER_REMINDER = {
    reminderType: 'water',
    title: '喝水提醒',
    timePoints: [
        '08:00',
        '10:00',
        '12:30',
        '15:00',
        '17:00',
        '19:00'
    ],
    repeatType: 'daily',
    repeatDays: [],
    repeatInterval: 1,
    isEnabled: true
};
let HealthRemindersService = class HealthRemindersService {
    mapReminder(row) {
        return {
            id: row.id,
            reminderType: row.reminderType,
            title: row.title,
            timePoints: row.timePoints ?? [],
            repeatType: row.repeatType,
            repeatDays: row.repeatDays ?? [],
            repeatInterval: row.repeatInterval ?? 1,
            endDate: row.endDate ?? undefined,
            isEnabled: row.isEnabled
        };
    }
    validateCreateBody(body) {
        if (!VALID_REMINDER_TYPES.includes(body.reminderType)) {
            throw new _common.BadRequestException(`无效的提醒类型: ${body.reminderType}`);
        }
        if (!body.title) {
            throw new _common.BadRequestException('title 必填');
        }
        if (!VALID_REPEAT_TYPES.includes(body.repeatType)) {
            throw new _common.BadRequestException(`无效的重复类型: ${body.repeatType}`);
        }
    }
    async getReminders(userId) {
        const rows = await this.db.select().from(_schema.healthReminders).where((0, _drizzleorm.and)((0, _drizzleorm.eq)(_schema.healthReminders.userId, userId), (0, _drizzleorm.eq)(_schema.healthReminders.isDeleted, false))).orderBy((0, _drizzleorm.desc)(_schema.healthReminders.createdAt));
        // Check if user has any water reminder
        const hasWater = rows.some((r)=>r.reminderType === 'water');
        if (!hasWater) {
            // Create default water reminder
            const now = new Date();
            const inserted = await this.db.insert(_schema.healthReminders).values({
                userId,
                ...DEFAULT_WATER_REMINDER,
                createdAt: now,
                updatedAt: now
            }).returning();
            return [
                this.mapReminder(inserted[0]),
                ...rows.map((r)=>this.mapReminder(r))
            ];
        }
        return rows.map((r)=>this.mapReminder(r));
    }
    async createReminder(userId, body) {
        this.validateCreateBody(body);
        const now = new Date();
        const inserted = await this.db.insert(_schema.healthReminders).values({
            userId,
            reminderType: body.reminderType,
            title: body.title,
            timePoints: body.timePoints ?? [],
            repeatType: body.repeatType,
            repeatDays: body.repeatDays ?? [],
            repeatInterval: body.repeatInterval ?? 1,
            endDate: body.endDate ?? null,
            isEnabled: body.isEnabled !== undefined ? body.isEnabled : true,
            createdAt: now,
            updatedAt: now
        }).returning();
        return this.mapReminder(inserted[0]);
    }
    async updateReminder(userId, id, body) {
        const patch = {};
        if (body.title !== undefined) patch.title = body.title;
        if (body.timePoints !== undefined) patch.timePoints = body.timePoints;
        if (body.repeatType !== undefined) {
            if (!VALID_REPEAT_TYPES.includes(body.repeatType)) {
                throw new _common.BadRequestException(`无效的重复类型: ${body.repeatType}`);
            }
            patch.repeatType = body.repeatType;
        }
        if (body.repeatDays !== undefined) patch.repeatDays = body.repeatDays;
        if (body.repeatInterval !== undefined) patch.repeatInterval = body.repeatInterval;
        if (body.endDate !== undefined) patch.endDate = body.endDate || null;
        if (body.isEnabled !== undefined) patch.isEnabled = body.isEnabled;
        if (Object.keys(patch).length === 0) {
            throw new _common.BadRequestException('未提供可更新字段');
        }
        patch.updatedAt = new Date();
        const updated = await this.db.update(_schema.healthReminders).set(patch).where((0, _drizzleorm.and)((0, _drizzleorm.eq)(_schema.healthReminders.id, id), (0, _drizzleorm.eq)(_schema.healthReminders.userId, userId), (0, _drizzleorm.eq)(_schema.healthReminders.isDeleted, false))).returning();
        if (updated.length === 0) {
            throw new _common.NotFoundException('提醒不存在');
        }
        return this.mapReminder(updated[0]);
    }
    async deleteReminder(userId, id) {
        const updated = await this.db.update(_schema.healthReminders).set({
            isDeleted: true,
            updatedAt: new Date()
        }).where((0, _drizzleorm.and)((0, _drizzleorm.eq)(_schema.healthReminders.id, id), (0, _drizzleorm.eq)(_schema.healthReminders.userId, userId), (0, _drizzleorm.eq)(_schema.healthReminders.isDeleted, false))).returning({
            id: _schema.healthReminders.id
        });
        if (updated.length === 0) {
            throw new _common.NotFoundException('提醒不存在');
        }
        return {
            success: true
        };
    }
    async toggleReminder(userId, id) {
        const existing = await this.db.select().from(_schema.healthReminders).where((0, _drizzleorm.and)((0, _drizzleorm.eq)(_schema.healthReminders.id, id), (0, _drizzleorm.eq)(_schema.healthReminders.userId, userId), (0, _drizzleorm.eq)(_schema.healthReminders.isDeleted, false)));
        if (existing.length === 0) {
            throw new _common.NotFoundException('提醒不存在');
        }
        const now = new Date();
        const newEnabled = !existing[0].isEnabled;
        const updated = await this.db.update(_schema.healthReminders).set({
            isEnabled: newEnabled,
            updatedAt: now
        }).where((0, _drizzleorm.eq)(_schema.healthReminders.id, id)).returning();
        return this.mapReminder(updated[0]);
    }
    constructor(db){
        this.db = db;
        this.logger = new _common.Logger(HealthRemindersService.name);
    }
};
HealthRemindersService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_fullstacknestjscore.DRIZZLE_DATABASE)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof PostgresJsDatabase === "undefined" ? Object : PostgresJsDatabase
    ])
], HealthRemindersService);
