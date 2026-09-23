"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HealthGoalsService", {
    enumerable: true,
    get: function() {
        return HealthGoalsService;
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
const VALID_GOAL_TYPES = [
    'water',
    'sleep',
    'exercise'
];
const DEFAULT_GOALS = {
    water: {
        targetValue: 8,
        period: 'daily'
    },
    sleep: {
        targetValue: 8,
        period: 'daily'
    },
    exercise: {
        targetValue: 3,
        period: 'weekly'
    }
};
let HealthGoalsService = class HealthGoalsService {
    mapGoal(row) {
        return {
            id: row.id,
            goalType: row.goalType,
            targetValue: Number(row.targetValue),
            period: row.period
        };
    }
    async getGoals(userId) {
        const rows = await this.db.select().from(_schema.healthGoals).where((0, _drizzleorm.and)((0, _drizzleorm.eq)(_schema.healthGoals.userId, userId), (0, _drizzleorm.eq)(_schema.healthGoals.isDeleted, false)));
        const existing = new Map(rows.map((r)=>[
                r.goalType,
                r
            ]));
        const result = VALID_GOAL_TYPES.map((type)=>{
            const row = existing.get(type);
            if (row) return this.mapGoal(row);
            return {
                id: '',
                goalType: type,
                targetValue: DEFAULT_GOALS[type].targetValue,
                period: DEFAULT_GOALS[type].period
            };
        });
        return result;
    }
    async upsertGoal(userId, goalType, body) {
        if (!VALID_GOAL_TYPES.includes(goalType)) {
            throw new _common.BadRequestException(`无效的目标类型: ${goalType}`);
        }
        const { targetValue, period } = body;
        if (targetValue === undefined || targetValue === null) {
            throw new _common.BadRequestException('targetValue 必填');
        }
        const now = new Date();
        // Try update first
        const updated = await this.db.update(_schema.healthGoals).set({
            targetValue: String(targetValue),
            period: period || 'daily',
            isDeleted: false,
            updatedAt: now
        }).where((0, _drizzleorm.and)((0, _drizzleorm.eq)(_schema.healthGoals.userId, userId), (0, _drizzleorm.eq)(_schema.healthGoals.goalType, goalType))).returning();
        if (updated.length > 0) {
            return this.mapGoal(updated[0]);
        }
        // Insert if not exists
        const inserted = await this.db.insert(_schema.healthGoals).values({
            userId,
            goalType,
            targetValue: String(targetValue),
            period: period || 'daily',
            createdAt: now,
            updatedAt: now
        }).returning();
        return this.mapGoal(inserted[0]);
    }
    constructor(db){
        this.db = db;
        this.logger = new _common.Logger(HealthGoalsService.name);
    }
};
HealthGoalsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_fullstacknestjscore.DRIZZLE_DATABASE)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof PostgresJsDatabase === "undefined" ? Object : PostgresJsDatabase
    ])
], HealthGoalsService);
