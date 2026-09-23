"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HealthRecordsService", {
    enumerable: true,
    get: function() {
        return HealthRecordsService;
    }
});
const _common = require("@nestjs/common");
const _fullstacknestjscore = require("@lark-apaas/fullstack-nestjs-core");
const _drizzleorm = require("drizzle-orm");
const _schema = require("../../database/schema");
const _healthrecordsutils = require("./health-records.utils");
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
let HealthRecordsService = class HealthRecordsService {
    // ==================== Shared Helpers ====================
    baseFilter(table, userId) {
        return (0, _drizzleorm.and)((0, _drizzleorm.eq)(table.userId, userId), (0, _drizzleorm.eq)(table.isDeleted, false));
    }
    async paginatedQuery(table, timeCol, userId, query, mapper) {
        const { page, pageSize, startDate, endDate } = query;
        const conds = [];
        if (startDate) conds.push((0, _drizzleorm.gte)(timeCol, new Date(startDate)));
        if (endDate) conds.push((0, _drizzleorm.lt)(timeCol, new Date(endDate)));
        const where = conds.length > 0 ? (0, _drizzleorm.and)(this.baseFilter(table, userId), ...conds) : this.baseFilter(table, userId);
        const [countRes, rows] = await Promise.all([
            this.db.select({
                count: (0, _drizzleorm.count)()
            }).from(table).where(where),
            this.db.select().from(table).where(where).orderBy((0, _drizzleorm.desc)(timeCol)).limit(pageSize).offset((page - 1) * pageSize)
        ]);
        const total = Number(countRes[0]?.count ?? 0);
        return {
            items: rows.map(mapper),
            total,
            page,
            pageSize
        };
    }
    async findOne(table, userId, id) {
        const rows = await this.db.select().from(table).where((0, _drizzleorm.and)(this.baseFilter(table, userId), (0, _drizzleorm.eq)(table.id, id))).limit(1);
        if (rows.length === 0) throw new _common.NotFoundException('记录不存在');
        return rows[0];
    }
    async softDelete(table, userId, id) {
        const updated = await this.db.update(table).set({
            isDeleted: true
        }).where((0, _drizzleorm.and)(this.baseFilter(table, userId), (0, _drizzleorm.eq)(table.id, id))).returning({
            id: table.id
        });
        if (updated.length === 0) throw new _common.NotFoundException('记录不存在');
        return {
            success: true
        };
    }
    /** Recompute duration when start/end times change during an update */ recomputeDuration(patch, current, startKey, endKey, nullableEnd = false) {
        const hasStart = patch[startKey] !== undefined;
        const hasEnd = patch[endKey] !== undefined;
        if (!hasStart && !hasEnd) return;
        const s = hasStart ? patch[startKey] : current[startKey];
        const e = hasEnd ? patch[endKey] : current[endKey];
        if (nullableEnd && !e) {
            patch.durationMinutes = 0;
        } else {
            patch.durationMinutes = (0, _healthrecordsutils.calcDurationMinutes)(s, e);
        }
    }
    // ==================== Sleep ====================
    async listSleep(userId, query) {
        return this.paginatedQuery(_schema.healthSleep, _schema.healthSleep.sleepTime, userId, query, _healthrecordsutils.mapSleep);
    }
    async createSleep(userId, dto) {
        const sleepTime = new Date(dto.sleepTime);
        const wakeTime = new Date(dto.wakeTime);
        const durationMinutes = (0, _healthrecordsutils.calcDurationMinutes)(sleepTime, wakeTime);
        const rows = await this.db.insert(_schema.healthSleep).values({
            userId,
            sleepTime,
            wakeTime,
            durationMinutes,
            note: dto.note ?? null
        }).returning();
        return (0, _healthrecordsutils.mapSleep)(rows[0]);
    }
    async getSleep(userId, id) {
        return (0, _healthrecordsutils.mapSleep)(await this.findOne(_schema.healthSleep, userId, id));
    }
    async updateSleep(userId, id, dto) {
        const patch = {};
        if (dto.sleepTime !== undefined) patch.sleepTime = new Date(dto.sleepTime);
        if (dto.wakeTime !== undefined) patch.wakeTime = new Date(dto.wakeTime);
        if (dto.note !== undefined) patch.note = dto.note ?? null;
        if (Object.keys(patch).length === 0) {
            throw new _common.BadRequestException('未提供可更新字段');
        }
        if (patch.sleepTime || patch.wakeTime) {
            const current = await this.findOne(_schema.healthSleep, userId, id);
            this.recomputeDuration(patch, current, 'sleepTime', 'wakeTime');
        }
        const updated = await this.db.update(_schema.healthSleep).set(patch).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthSleep, userId), (0, _drizzleorm.eq)(_schema.healthSleep.id, id))).returning();
        if (updated.length === 0) throw new _common.NotFoundException('记录不存在');
        return (0, _healthrecordsutils.mapSleep)(updated[0]);
    }
    async deleteSleep(userId, id) {
        return this.softDelete(_schema.healthSleep, userId, id);
    }
    // ==================== Mood ====================
    async listMood(userId, query) {
        return this.paginatedQuery(_schema.healthMood, _schema.healthMood.recordTime, userId, query, _healthrecordsutils.mapMood);
    }
    async createMood(userId, dto) {
        const rows = await this.db.insert(_schema.healthMood).values({
            userId,
            moods: dto.moods ?? [],
            recordTime: new Date(dto.recordTime),
            imageUrl: dto.imageUrl ?? null,
            note: dto.note ?? null
        }).returning();
        return (0, _healthrecordsutils.mapMood)(rows[0]);
    }
    async getMood(userId, id) {
        return (0, _healthrecordsutils.mapMood)(await this.findOne(_schema.healthMood, userId, id));
    }
    async updateMood(userId, id, dto) {
        const patch = {};
        if (dto.moods !== undefined) patch.moods = dto.moods;
        if (dto.recordTime !== undefined) patch.recordTime = new Date(dto.recordTime);
        if (dto.imageUrl !== undefined) patch.imageUrl = dto.imageUrl ?? null;
        if (dto.note !== undefined) patch.note = dto.note ?? null;
        if (Object.keys(patch).length === 0) {
            throw new _common.BadRequestException('未提供可更新字段');
        }
        const updated = await this.db.update(_schema.healthMood).set(patch).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthMood, userId), (0, _drizzleorm.eq)(_schema.healthMood.id, id))).returning();
        if (updated.length === 0) throw new _common.NotFoundException('记录不存在');
        return (0, _healthrecordsutils.mapMood)(updated[0]);
    }
    async deleteMood(userId, id) {
        return this.softDelete(_schema.healthMood, userId, id);
    }
    // ==================== Pain ====================
    async listPain(userId, query) {
        return this.paginatedQuery(_schema.healthPain, _schema.healthPain.startTime, userId, query, _healthrecordsutils.mapPain);
    }
    async createPain(userId, dto) {
        const startTime = new Date(dto.startTime);
        const endTime = dto.endTime ? new Date(dto.endTime) : null;
        const durationMinutes = endTime ? (0, _healthrecordsutils.calcDurationMinutes)(startTime, endTime) : 0;
        const rows = await this.db.insert(_schema.healthPain).values({
            userId,
            symptoms: dto.symptoms ?? [],
            painLevel: dto.painLevel ?? 'mild',
            startTime,
            endTime,
            durationMinutes,
            description: dto.description ?? null,
            note: dto.note ?? null,
            medicationIds: dto.medicationIds ?? [],
            painMarkers: dto.painMarkers ?? []
        }).returning();
        return (0, _healthrecordsutils.mapPain)(rows[0]);
    }
    async getPain(userId, id) {
        return (0, _healthrecordsutils.mapPain)(await this.findOne(_schema.healthPain, userId, id));
    }
    async updatePain(userId, id, dto) {
        const patch = {};
        if (dto.symptoms !== undefined) patch.symptoms = dto.symptoms;
        if (dto.painLevel !== undefined) patch.painLevel = dto.painLevel;
        if (dto.startTime !== undefined) patch.startTime = new Date(dto.startTime);
        if (dto.endTime !== undefined) {
            patch.endTime = dto.endTime ? new Date(dto.endTime) : null;
        }
        if (dto.description !== undefined) patch.description = dto.description ?? null;
        if (dto.note !== undefined) patch.note = dto.note ?? null;
        if (dto.medicationIds !== undefined) patch.medicationIds = dto.medicationIds;
        if (dto.painMarkers !== undefined) patch.painMarkers = dto.painMarkers;
        if (Object.keys(patch).length === 0) {
            throw new _common.BadRequestException('未提供可更新字段');
        }
        if (patch.startTime !== undefined || patch.endTime !== undefined) {
            const current = await this.findOne(_schema.healthPain, userId, id);
            this.recomputeDuration(patch, current, 'startTime', 'endTime', true);
        }
        const updated = await this.db.update(_schema.healthPain).set(patch).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthPain, userId), (0, _drizzleorm.eq)(_schema.healthPain.id, id))).returning();
        if (updated.length === 0) throw new _common.NotFoundException('记录不存在');
        return (0, _healthrecordsutils.mapPain)(updated[0]);
    }
    async deletePain(userId, id) {
        return this.softDelete(_schema.healthPain, userId, id);
    }
    // ==================== Diet ====================
    async listDiet(userId, query) {
        const { page, pageSize, startDate, endDate } = query;
        const conds = [
            (0, _drizzleorm.eq)(_schema.healthDiet.userId, userId),
            (0, _drizzleorm.eq)(_schema.healthDiet.isDeleted, false)
        ];
        const sortCol = (0, _drizzleorm.sql)`COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt})`;
        if (startDate) conds.push((0, _drizzleorm.gte)(sortCol, new Date(startDate)));
        if (endDate) conds.push((0, _drizzleorm.lt)(sortCol, new Date(endDate)));
        const where = (0, _drizzleorm.and)(...conds);
        const [countRes, rows] = await Promise.all([
            this.db.select({
                count: (0, _drizzleorm.count)()
            }).from(_schema.healthDiet).where(where),
            this.db.select().from(_schema.healthDiet).where(where).orderBy((0, _drizzleorm.desc)(sortCol)).limit(pageSize).offset((page - 1) * pageSize)
        ]);
        const total = Number(countRes[0]?.count ?? 0);
        return {
            items: rows.map(_healthrecordsutils.mapDiet),
            total,
            page,
            pageSize
        };
    }
    async createDiet(userId, dto) {
        const rows = await this.db.insert(_schema.healthDiet).values({
            userId,
            mealType: dto.mealType ?? 'lunch',
            foodDescription: dto.foodDescription ?? null,
            foodImageUrl: dto.foodImageUrl ?? null,
            eatTime: dto.eatTime ? new Date(dto.eatTime) : new Date(),
            tags: dto.tags ?? [],
            note: dto.note ?? null
        }).returning();
        return (0, _healthrecordsutils.mapDiet)(rows[0]);
    }
    async getDiet(userId, id) {
        return (0, _healthrecordsutils.mapDiet)(await this.findOne(_schema.healthDiet, userId, id));
    }
    async updateDiet(userId, id, dto) {
        const patch = {};
        if (dto.mealType !== undefined) patch.mealType = dto.mealType;
        if (dto.foodDescription !== undefined) patch.foodDescription = dto.foodDescription ?? null;
        if (dto.foodImageUrl !== undefined) patch.foodImageUrl = dto.foodImageUrl ?? null;
        if (dto.eatTime !== undefined) patch.eatTime = new Date(dto.eatTime);
        if (dto.tags !== undefined) patch.tags = dto.tags;
        if (dto.note !== undefined) patch.note = dto.note ?? null;
        if (Object.keys(patch).length === 0) {
            throw new _common.BadRequestException('未提供可更新字段');
        }
        const updated = await this.db.update(_schema.healthDiet).set(patch).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthDiet, userId), (0, _drizzleorm.eq)(_schema.healthDiet.id, id))).returning();
        if (updated.length === 0) throw new _common.NotFoundException('记录不存在');
        return (0, _healthrecordsutils.mapDiet)(updated[0]);
    }
    async deleteDiet(userId, id) {
        return this.softDelete(_schema.healthDiet, userId, id);
    }
    // ==================== Exercise ====================
    async listExercise(userId, query) {
        return this.paginatedQuery(_schema.healthExercise, _schema.healthExercise.startTime, userId, query, _healthrecordsutils.mapExercise);
    }
    async createExercise(userId, dto) {
        const startTime = new Date(dto.startTime);
        const endTime = new Date(dto.endTime);
        const durationMinutes = (0, _healthrecordsutils.calcDurationMinutes)(startTime, endTime);
        const rows = await this.db.insert(_schema.healthExercise).values({
            userId,
            exerciseType: dto.exerciseType ?? 'walking',
            startTime,
            endTime,
            durationMinutes,
            imageUrl: dto.imageUrl ?? null,
            note: dto.note ?? null
        }).returning();
        return (0, _healthrecordsutils.mapExercise)(rows[0]);
    }
    async getExercise(userId, id) {
        return (0, _healthrecordsutils.mapExercise)(await this.findOne(_schema.healthExercise, userId, id));
    }
    async updateExercise(userId, id, dto) {
        const patch = {};
        if (dto.exerciseType !== undefined) patch.exerciseType = dto.exerciseType;
        if (dto.startTime !== undefined) patch.startTime = new Date(dto.startTime);
        if (dto.endTime !== undefined) patch.endTime = new Date(dto.endTime);
        if (dto.imageUrl !== undefined) patch.imageUrl = dto.imageUrl ?? null;
        if (dto.note !== undefined) patch.note = dto.note ?? null;
        if (Object.keys(patch).length === 0) {
            throw new _common.BadRequestException('未提供可更新字段');
        }
        if (patch.startTime || patch.endTime) {
            const current = await this.findOne(_schema.healthExercise, userId, id);
            this.recomputeDuration(patch, current, 'startTime', 'endTime');
        }
        const updated = await this.db.update(_schema.healthExercise).set(patch).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthExercise, userId), (0, _drizzleorm.eq)(_schema.healthExercise.id, id))).returning();
        if (updated.length === 0) throw new _common.NotFoundException('记录不存在');
        return (0, _healthrecordsutils.mapExercise)(updated[0]);
    }
    async deleteExercise(userId, id) {
        return this.softDelete(_schema.healthExercise, userId, id);
    }
    // ==================== Water ====================
    async listWater(userId, query) {
        return this.paginatedQuery(_schema.healthWater, _schema.healthWater.drinkTime, userId, query, _healthrecordsutils.mapWater);
    }
    async createWater(userId, dto) {
        const rows = await this.db.insert(_schema.healthWater).values({
            userId,
            drinkTime: new Date(dto.drinkTime),
            amountMl: dto.amountMl ?? 250
        }).returning();
        return (0, _healthrecordsutils.mapWater)(rows[0]);
    }
    async getWater(userId, id) {
        return (0, _healthrecordsutils.mapWater)(await this.findOne(_schema.healthWater, userId, id));
    }
    async updateWater(userId, id, dto) {
        const patch = {};
        if (dto.drinkTime !== undefined) patch.drinkTime = new Date(dto.drinkTime);
        if (dto.amountMl !== undefined) patch.amountMl = dto.amountMl;
        if (Object.keys(patch).length === 0) {
            throw new _common.BadRequestException('未提供可更新字段');
        }
        const updated = await this.db.update(_schema.healthWater).set(patch).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthWater, userId), (0, _drizzleorm.eq)(_schema.healthWater.id, id))).returning();
        if (updated.length === 0) throw new _common.NotFoundException('记录不存在');
        return (0, _healthrecordsutils.mapWater)(updated[0]);
    }
    async deleteWater(userId, id) {
        return this.softDelete(_schema.healthWater, userId, id);
    }
    // ==================== Medication ====================
    async listMedication(userId, query) {
        return this.paginatedQuery(_schema.healthMedication, _schema.healthMedication.takeTime, userId, query, _healthrecordsutils.mapMedication);
    }
    async createMedication(userId, dto) {
        const rows = await this.db.insert(_schema.healthMedication).values({
            userId,
            medicineName: dto.medicineName,
            dosage: dto.dosage ?? null,
            takeTime: new Date(dto.takeTime),
            relatedSymptom: dto.relatedSymptom ?? null,
            painRecordId: dto.painRecordId ?? null,
            imageUrl: dto.imageUrl ?? null,
            note: dto.note ?? null
        }).returning();
        return (0, _healthrecordsutils.mapMedication)(rows[0]);
    }
    async getMedication(userId, id) {
        return (0, _healthrecordsutils.mapMedication)(await this.findOne(_schema.healthMedication, userId, id));
    }
    async updateMedication(userId, id, dto) {
        const patch = {};
        if (dto.medicineName !== undefined) patch.medicineName = dto.medicineName;
        if (dto.dosage !== undefined) patch.dosage = dto.dosage ?? null;
        if (dto.takeTime !== undefined) patch.takeTime = new Date(dto.takeTime);
        if (dto.relatedSymptom !== undefined) patch.relatedSymptom = dto.relatedSymptom ?? null;
        if (dto.painRecordId !== undefined) patch.painRecordId = dto.painRecordId ?? null;
        if (dto.imageUrl !== undefined) patch.imageUrl = dto.imageUrl ?? null;
        if (dto.note !== undefined) patch.note = dto.note ?? null;
        if (Object.keys(patch).length === 0) {
            throw new _common.BadRequestException('未提供可更新字段');
        }
        const updated = await this.db.update(_schema.healthMedication).set(patch).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthMedication, userId), (0, _drizzleorm.eq)(_schema.healthMedication.id, id))).returning();
        if (updated.length === 0) throw new _common.NotFoundException('记录不存在');
        return (0, _healthrecordsutils.mapMedication)(updated[0]);
    }
    async deleteMedication(userId, id) {
        return this.softDelete(_schema.healthMedication, userId, id);
    }
    // ==================== Poop ====================
    async listPoop(userId, query) {
        return this.paginatedQuery(_schema.healthPoop, _schema.healthPoop.poopTime, userId, query, _healthrecordsutils.mapPoop);
    }
    async createPoop(userId, dto) {
        const rows = await this.db.insert(_schema.healthPoop).values({
            userId,
            poopTime: new Date(dto.poopTime),
            stoolType: dto.stoolType ?? 'normal',
            note: dto.note ?? null
        }).returning();
        return (0, _healthrecordsutils.mapPoop)(rows[0]);
    }
    async getPoop(userId, id) {
        return (0, _healthrecordsutils.mapPoop)(await this.findOne(_schema.healthPoop, userId, id));
    }
    async updatePoop(userId, id, dto) {
        const patch = {};
        if (dto.poopTime !== undefined) patch.poopTime = new Date(dto.poopTime);
        if (dto.stoolType !== undefined) patch.stoolType = dto.stoolType;
        if (dto.note !== undefined) patch.note = dto.note ?? null;
        if (Object.keys(patch).length === 0) {
            throw new _common.BadRequestException('未提供可更新字段');
        }
        const updated = await this.db.update(_schema.healthPoop).set(patch).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthPoop, userId), (0, _drizzleorm.eq)(_schema.healthPoop.id, id))).returning();
        if (updated.length === 0) throw new _common.NotFoundException('记录不存在');
        return (0, _healthrecordsutils.mapPoop)(updated[0]);
    }
    async deletePoop(userId, id) {
        return this.softDelete(_schema.healthPoop, userId, id);
    }
    // ==================== Today Overview ====================
    async getTodayOverview(userId) {
        const { start, end } = (0, _healthrecordsutils.getTodayRange)();
        const [waterCount, sleepRows, exerciseRows, medicationCount, moodCount, painCount, dietCount, poopCount, goalRows] = await Promise.all([
            this.countToday(_schema.healthWater, _schema.healthWater.drinkTime, userId, start, end),
            this.db.select().from(_schema.healthSleep).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthSleep, userId), (0, _drizzleorm.gte)(_schema.healthSleep.wakeTime, start), (0, _drizzleorm.lt)(_schema.healthSleep.wakeTime, end))).orderBy((0, _drizzleorm.desc)(_schema.healthSleep.wakeTime)),
            this.db.select().from(_schema.healthExercise).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthExercise, userId), (0, _drizzleorm.gte)(_schema.healthExercise.startTime, start), (0, _drizzleorm.lt)(_schema.healthExercise.startTime, end))),
            this.countToday(_schema.healthMedication, _schema.healthMedication.takeTime, userId, start, end),
            this.countToday(_schema.healthMood, _schema.healthMood.recordTime, userId, start, end),
            this.countToday(_schema.healthPain, _schema.healthPain.startTime, userId, start, end),
            this.countToday(_schema.healthDiet, _schema.healthDiet.eatTime, userId, start, end),
            this.countToday(_schema.healthPoop, _schema.healthPoop.poopTime, userId, start, end),
            this.db.select().from(_schema.healthGoals).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthGoals, userId), (0, _drizzleorm.sql)`${_schema.healthGoals.goalType} IN ('water_daily', 'sleep_daily')`))
        ]);
        const waterCups = waterCount;
        const medicationTaken = medicationCount;
        const recordCount = waterCups + medicationTaken + moodCount + painCount + dietCount + poopCount + exerciseRows.length + (sleepRows.length > 0 ? 1 : 0);
        const exerciseMinutes = exerciseRows.reduce((sum, r)=>sum + (r.durationMinutes ?? 0), 0);
        const sleepMinutes = sleepRows.reduce((sum, r)=>sum + (r.durationMinutes ?? 0), 0);
        let waterTarget = 8;
        let sleepTarget = 480;
        for (const g of goalRows){
            if (g.goalType === 'water_daily') waterTarget = Number(g.targetValue);
            else if (g.goalType === 'sleep_daily') sleepTarget = Number(g.targetValue) * 60;
        }
        const [streakDays, weekWaterGoalRate, totalExerciseMinutes, exerciseTotalCount] = await Promise.all([
            this.computeStreakDays(userId),
            this.computeWeekWaterGoalRate(userId, waterTarget),
            this.computeTotalExerciseMinutes(userId),
            this.countAll(userId, _schema.healthExercise)
        ]);
        return {
            waterCups,
            waterTarget,
            recordCount,
            exerciseMinutes,
            medicationTaken,
            medicationTotal: 0,
            sleepMinutes,
            sleepTarget,
            streakDays,
            weekWaterGoalRate,
            totalExerciseMinutes,
            exerciseCount: exerciseTotalCount
        };
    }
    async computeStreakDays(userId) {
        const dateStrs = (0, _healthrecordsutils.getLastNDateStrings)(30);
        const { start: rangeStart } = (0, _healthrecordsutils.getDayRange)(dateStrs[dateStrs.length - 1]);
        const { end: rangeEnd } = (0, _healthrecordsutils.getDayRange)(dateStrs[0]);
        const rangeStartIso = rangeStart.toISOString();
        const rangeEndIso = rangeEnd.toISOString();
        const tables = [
            {
                table: _schema.healthWater,
                timeCol: _schema.healthWater.drinkTime
            },
            {
                table: _schema.healthSleep,
                timeCol: _schema.healthSleep.wakeTime
            },
            {
                table: _schema.healthMood,
                timeCol: _schema.healthMood.recordTime
            },
            {
                table: _schema.healthPain,
                timeCol: _schema.healthPain.startTime
            },
            {
                table: _schema.healthExercise,
                timeCol: _schema.healthExercise.startTime
            },
            {
                table: _schema.healthMedication,
                timeCol: _schema.healthMedication.takeTime
            },
            {
                table: _schema.healthPoop,
                timeCol: _schema.healthPoop.poopTime
            }
        ];
        const dateCounts = new Map();
        await Promise.all([
            ...tables.map(async ({ table, timeCol })=>{
                const rows = await this.db.select({
                    dateStr: (0, _drizzleorm.sql)`DATE(${timeCol} AT TIME ZONE 'Asia/Shanghai')`,
                    cnt: (0, _drizzleorm.count)()
                }).from(table).where((0, _drizzleorm.and)(this.baseFilter(table, userId), (0, _drizzleorm.gte)(timeCol, rangeStartIso), (0, _drizzleorm.lt)(timeCol, rangeEndIso))).groupBy((0, _drizzleorm.sql)`DATE(${timeCol} AT TIME ZONE 'Asia/Shanghai')`);
                for (const row of rows){
                    const key = String(row.dateStr);
                    dateCounts.set(key, (dateCounts.get(key) ?? 0) + Number(row.cnt));
                }
            }),
            (async ()=>{
                const dietTime = (0, _drizzleorm.sql)`COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt})`;
                const rows = await this.db.select({
                    dateStr: (0, _drizzleorm.sql)`DATE(${dietTime} AT TIME ZONE 'Asia/Shanghai')`,
                    cnt: (0, _drizzleorm.count)()
                }).from(_schema.healthDiet).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthDiet, userId), (0, _drizzleorm.sql)`${dietTime} >= ${rangeStartIso}::timestamptz`, (0, _drizzleorm.sql)`${dietTime} < ${rangeEndIso}::timestamptz`)).groupBy((0, _drizzleorm.sql)`DATE(${dietTime} AT TIME ZONE 'Asia/Shanghai')`);
                for (const row of rows){
                    const key = String(row.dateStr);
                    dateCounts.set(key, (dateCounts.get(key) ?? 0) + Number(row.cnt));
                }
            })()
        ]);
        let streak = 0;
        for (const dateStr of dateStrs){
            const count = dateCounts.get(dateStr) ?? 0;
            if (count > 0) {
                streak += 1;
            } else if (streak > 0) {
                break;
            }
        }
        return streak;
    }
    async computeWeekWaterGoalRate(userId, waterTarget) {
        const dateStrs = (0, _healthrecordsutils.getLastNDateStrings)(7);
        const { start: weekStart, end: weekEnd } = (0, _healthrecordsutils.getDayRange)(dateStrs[6]);
        const weekStartIso = weekStart.toISOString();
        const weekEndIso = weekEnd.toISOString();
        const rows = await this.db.select({
            dateStr: (0, _drizzleorm.sql)`DATE(${_schema.healthWater.drinkTime} AT TIME ZONE 'Asia/Shanghai')`,
            cnt: (0, _drizzleorm.count)()
        }).from(_schema.healthWater).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthWater, userId), (0, _drizzleorm.gte)(_schema.healthWater.drinkTime, weekStartIso), (0, _drizzleorm.lt)(_schema.healthWater.drinkTime, weekEndIso))).groupBy((0, _drizzleorm.sql)`DATE(${_schema.healthWater.drinkTime} AT TIME ZONE 'Asia/Shanghai')`);
        const countMap = new Map();
        for (const row of rows){
            countMap.set(String(row.dateStr), Number(row.cnt));
        }
        const achievedDays = dateStrs.filter((d)=>(countMap.get(d) ?? 0) >= waterTarget).length;
        return Math.round(achievedDays / 7 * 100);
    }
    async computeTotalExerciseMinutes(userId) {
        const rows = await this.db.select({
            durationMinutes: _schema.healthExercise.durationMinutes
        }).from(_schema.healthExercise).where(this.baseFilter(_schema.healthExercise, userId));
        return rows.reduce((sum, r)=>sum + (r.durationMinutes ?? 0), 0);
    }
    async computeEarlySleepDays(userId) {
        const rows = await this.db.select({
            sleepTime: _schema.healthSleep.sleepTime,
            wakeTime: _schema.healthSleep.wakeTime,
            dateStr: (0, _drizzleorm.sql)`DATE(${_schema.healthSleep.wakeTime} AT TIME ZONE 'Asia/Shanghai')`,
            sleepHour: (0, _drizzleorm.sql)`EXTRACT(HOUR FROM ${_schema.healthSleep.sleepTime} AT TIME ZONE 'Asia/Shanghai')`,
            sleepMinute: (0, _drizzleorm.sql)`EXTRACT(MINUTE FROM ${_schema.healthSleep.sleepTime} AT TIME ZONE 'Asia/Shanghai')`,
            wakeHour: (0, _drizzleorm.sql)`EXTRACT(HOUR FROM ${_schema.healthSleep.wakeTime} AT TIME ZONE 'Asia/Shanghai')`,
            wakeMinute: (0, _drizzleorm.sql)`EXTRACT(MINUTE FROM ${_schema.healthSleep.wakeTime} AT TIME ZONE 'Asia/Shanghai')`
        }).from(_schema.healthSleep).where(this.baseFilter(_schema.healthSleep, userId));
        const validDays = new Set();
        for (const row of rows){
            const sleepH = Number(row.sleepHour);
            const sleepM = Number(row.sleepMinute);
            const wakeH = Number(row.wakeHour);
            const wakeM = Number(row.wakeMinute);
            const sleepMinutes = sleepH * 60 + sleepM;
            const wakeMinutes = wakeH * 60 + wakeM;
            const isEarlySleep = sleepMinutes >= 12 * 60 && sleepMinutes <= 23 * 60 + 30;
            const isEarlyWake = wakeMinutes <= 9 * 60;
            if (isEarlySleep && isEarlyWake) {
                validDays.add(String(row.dateStr));
            }
        }
        return validDays.size;
    }
    async countToday(table, timeCol, userId, start, end) {
        const res = await this.db.select({
            count: (0, _drizzleorm.count)()
        }).from(table).where((0, _drizzleorm.and)(this.baseFilter(table, userId), (0, _drizzleorm.gte)(timeCol, start), (0, _drizzleorm.lt)(timeCol, end)));
        return Number(res[0]?.count ?? 0);
    }
    countAll(userId, table) {
        return this.db.select({
            count: (0, _drizzleorm.count)()
        }).from(table).where(this.baseFilter(table, userId)).then((rows)=>Number(rows[0]?.count ?? 0));
    }
    async earliestRecord(userId, table, timeCol) {
        const rows = await this.db.select().from(table).where(this.baseFilter(table, userId)).orderBy((0, _drizzleorm.asc)(timeCol)).limit(1);
        return rows[0]?.[timeCol] ?? null;
    }
    async earliestDietRecord(userId) {
        const dietTime = (0, _drizzleorm.sql)`COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt})`;
        const rows = await this.db.select({
            t: dietTime.as('t')
        }).from(_schema.healthDiet).where(this.baseFilter(_schema.healthDiet, userId)).orderBy((0, _drizzleorm.sql)`${dietTime} ASC`).limit(1);
        return rows[0]?.t ? new Date(rows[0].t) : null;
    }
    async getProfileSummary(userId) {
        const [sleepCount, moodCount, painCount, dietCount, exerciseCount, waterCount, medicationCount, poopCount, streakDays, firstSleep, firstMood, firstPain, firstDiet, firstExercise, firstWater, firstMedication, firstPoop] = await Promise.all([
            this.countAll(userId, _schema.healthSleep),
            this.countAll(userId, _schema.healthMood),
            this.countAll(userId, _schema.healthPain),
            this.countAll(userId, _schema.healthDiet),
            this.countAll(userId, _schema.healthExercise),
            this.countAll(userId, _schema.healthWater),
            this.countAll(userId, _schema.healthMedication),
            this.countAll(userId, _schema.healthPoop),
            this.computeStreakDays(userId),
            this.earliestRecord(userId, _schema.healthSleep, _schema.healthSleep.wakeTime),
            this.earliestRecord(userId, _schema.healthMood, _schema.healthMood.recordTime),
            this.earliestRecord(userId, _schema.healthPain, _schema.healthPain.startTime),
            this.earliestDietRecord(userId),
            this.earliestRecord(userId, _schema.healthExercise, _schema.healthExercise.startTime),
            this.earliestRecord(userId, _schema.healthWater, _schema.healthWater.drinkTime),
            this.earliestRecord(userId, _schema.healthMedication, _schema.healthMedication.takeTime),
            this.earliestRecord(userId, _schema.healthPoop, _schema.healthPoop.poopTime)
        ]);
        const totalRecords = sleepCount + moodCount + painCount + dietCount + exerciseCount + waterCount + medicationCount + poopCount;
        const allFirstDates = [
            firstSleep,
            firstMood,
            firstPain,
            firstDiet,
            firstExercise,
            firstWater,
            firstMedication,
            firstPoop
        ].filter((d)=>d !== null);
        const firstDate = allFirstDates.length > 0 ? new Date(Math.min(...allFirstDates.map((d)=>d.getTime()))) : null;
        const companionDays = firstDate ? Math.max(1, Math.floor((Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 1;
        return {
            streakDays,
            totalRecords,
            companionDays
        };
    }
    async getProfile(userId) {
        const rows = await this.db.select({
            id: _schema.healthAppUsers.id,
            username: _schema.healthAppUsers.username,
            signature: _schema.healthAppUsers.signature,
            avatarUrl: _schema.healthAppUsers.avatarUrl,
            createdAt: _schema.healthAppUsers.createdAt
        }).from(_schema.healthAppUsers).where((0, _drizzleorm.eq)(_schema.healthAppUsers.id, userId)).limit(1);
        if (rows.length === 0) {
            throw new _common.NotFoundException('用户不存在');
        }
        const row = rows[0];
        return {
            id: row.id,
            username: row.username,
            signature: row.signature ?? '',
            avatarUrl: row.avatarUrl ?? '',
            createdAt: row.createdAt.toISOString()
        };
    }
    async updateProfile(userId, dto) {
        const patch = {};
        if (dto.username !== undefined) {
            const trimmed = dto.username.trim();
            if (!trimmed) {
                throw new _common.BadRequestException('昵称不能为空');
            }
            if (trimmed.length > 64) {
                throw new _common.BadRequestException('昵称不能超过64个字符');
            }
            const existing = await this.db.select({
                id: _schema.healthAppUsers.id
            }).from(_schema.healthAppUsers).where((0, _drizzleorm.eq)(_schema.healthAppUsers.username, trimmed)).limit(1);
            if (existing.length > 0 && existing[0].id !== userId) {
                throw new _common.ConflictException('昵称已被使用');
            }
            patch.username = trimmed;
        }
        if (dto.signature !== undefined) {
            if (dto.signature.length > 200) {
                throw new _common.BadRequestException('签名不能超过200个字符');
            }
            patch.signature = dto.signature;
        }
        if (dto.avatarUrl !== undefined) {
            if (dto.avatarUrl.length > 2048) {
                throw new _common.BadRequestException('头像地址过长');
            }
            patch.avatarUrl = dto.avatarUrl;
        }
        if (Object.keys(patch).length === 0) {
            throw new _common.BadRequestException('未提供可更新字段');
        }
        let updated;
        try {
            updated = await this.db.update(_schema.healthAppUsers).set(patch).where((0, _drizzleorm.eq)(_schema.healthAppUsers.id, userId)).returning({
                id: _schema.healthAppUsers.id,
                username: _schema.healthAppUsers.username,
                signature: _schema.healthAppUsers.signature,
                avatarUrl: _schema.healthAppUsers.avatarUrl,
                createdAt: _schema.healthAppUsers.createdAt
            });
        } catch (err) {
            this.logger.error(`updateProfile db error: ${JSON.stringify(err)}`);
            throw err;
        }
        if (updated.length === 0) {
            throw new _common.NotFoundException('用户不存在');
        }
        const row = updated[0];
        return {
            id: row.id,
            username: row.username,
            signature: row.signature ?? '',
            avatarUrl: row.avatarUrl ?? '',
            createdAt: row.createdAt.toISOString()
        };
    }
    async getAchievements(userId) {
        const maxRetries = 2;
        for(let attempt = 0; attempt <= maxRetries; attempt += 1){
            try {
                return await this.computeAchievements(userId);
            } catch (err) {
                const code = this.extractPgErrorCode(err);
                const isTransient = code === '57P01' || code === '08006' || code === '08001' || code === '57P02' || code === 'XX000' || typeof err.message === 'string' && /draining|connection|terminat|retry/i.test(err.message);
                if (!isTransient || attempt >= maxRetries) {
                    if (!isTransient) throw err;
                    this.logger.warn(`achievements DB error after ${maxRetries + 1} attempts, returning empty fallback`);
                    return {
                        items: [
                            {
                                id: 'first-record',
                                name: '初次相遇',
                                description: '完成第一条健康记录',
                                criterion: '完成任意一条记录',
                                icon: 'sparkles',
                                category: 'milestone',
                                isAchieved: false,
                                progress: 0,
                                target: 1,
                                unit: '条'
                            },
                            {
                                id: 'streak-3',
                                name: '三日坚持',
                                description: '连续 3 天都有健康记录',
                                criterion: '连续记录 3 天',
                                icon: 'flame',
                                category: 'streak',
                                isAchieved: false,
                                progress: 0,
                                target: 3,
                                unit: '天'
                            },
                            {
                                id: 'streak-7',
                                name: '一周坚持',
                                description: '连续 7 天都有健康记录',
                                criterion: '连续记录 7 天',
                                icon: 'flame',
                                category: 'streak',
                                isAchieved: false,
                                progress: 0,
                                target: 7,
                                unit: '天'
                            },
                            {
                                id: 'streak-30',
                                name: '月度习惯',
                                description: '连续 30 天坚持记录健康',
                                criterion: '连续记录 30 天',
                                icon: 'trophy',
                                category: 'streak',
                                isAchieved: false,
                                progress: 0,
                                target: 30,
                                unit: '天'
                            },
                            {
                                id: 'water-daily',
                                name: '喝水达人',
                                description: '本周喝水达标的天数',
                                criterion: '本周 7 天中 ≥ 5 天达成喝水目标',
                                icon: 'droplets',
                                category: 'water',
                                isAchieved: false,
                                progress: 0,
                                target: 5,
                                unit: '天'
                            },
                            {
                                id: 'exercise-5',
                                name: '运动达人',
                                description: '累计完成 5 次运动记录',
                                criterion: '累计运动 5 次',
                                icon: 'activity',
                                category: 'exercise',
                                isAchieved: false,
                                progress: 0,
                                target: 5,
                                unit: '次'
                            },
                            {
                                id: 'exercise-100min',
                                name: '活力满满',
                                description: '累计运动超过 100 分钟',
                                criterion: '累计运动 100 分钟',
                                icon: 'zap',
                                category: 'exercise',
                                isAchieved: false,
                                progress: 0,
                                target: 100,
                                unit: '分钟'
                            },
                            {
                                id: 'mood-10',
                                name: '心情记录家',
                                description: '累计记录 10 次情绪',
                                criterion: '累计情绪记录 10 条',
                                icon: 'smile',
                                category: 'mood',
                                isAchieved: false,
                                progress: 0,
                                target: 10,
                                unit: '条'
                            },
                            {
                                id: 'sleep-7',
                                name: '早睡早起',
                                description: '在 23:30 前入睡且 9:00 前起床',
                                criterion: '累计 7 天在 23:30 前入睡且 9:00 前起床',
                                icon: 'moon',
                                category: 'sleep',
                                isAchieved: false,
                                progress: 0,
                                target: 7,
                                unit: '天'
                            },
                            {
                                id: 'medication-adhere',
                                name: '按时服药',
                                description: '累计记录 10 次用药',
                                criterion: '累计用药记录 10 条',
                                icon: 'pill',
                                category: 'medication',
                                isAchieved: false,
                                progress: 0,
                                target: 10,
                                unit: '次'
                            }
                        ],
                        total: 10,
                        achievedCount: 0
                    };
                }
                await new Promise((r)=>setTimeout(r, 300 * (attempt + 1)));
            }
        }
        return {
            items: [],
            total: 0,
            achievedCount: 0
        };
    }
    extractPgErrorCode(err) {
        let current = err;
        for(let depth = 0; depth < 4 && current && typeof current === 'object'; depth += 1){
            const { code, cause } = current;
            if (typeof code === 'string') return code;
            current = cause;
        }
        return undefined;
    }
    async computeAchievements(userId) {
        const [sleepCount, moodCount, painCount, dietCount, exerciseCount, waterCount, medicationCount, poopCount, totalExerciseMinutes, streakDays, earlySleepDays, firstSleep, firstMood, firstPain, firstDiet, firstExercise, firstWater, firstMedication, firstPoop] = await Promise.all([
            this.countAll(userId, _schema.healthSleep),
            this.countAll(userId, _schema.healthMood),
            this.countAll(userId, _schema.healthPain),
            this.countAll(userId, _schema.healthDiet),
            this.countAll(userId, _schema.healthExercise),
            this.countAll(userId, _schema.healthWater),
            this.countAll(userId, _schema.healthMedication),
            this.countAll(userId, _schema.healthPoop),
            this.computeTotalExerciseMinutes(userId),
            this.computeStreakDays(userId),
            this.computeEarlySleepDays(userId),
            this.earliestRecord(userId, _schema.healthSleep, _schema.healthSleep.wakeTime),
            this.earliestRecord(userId, _schema.healthMood, _schema.healthMood.recordTime),
            this.earliestRecord(userId, _schema.healthPain, _schema.healthPain.startTime),
            this.earliestDietRecord(userId),
            this.earliestRecord(userId, _schema.healthExercise, _schema.healthExercise.startTime),
            this.earliestRecord(userId, _schema.healthWater, _schema.healthWater.drinkTime),
            this.earliestRecord(userId, _schema.healthMedication, _schema.healthMedication.takeTime),
            this.earliestRecord(userId, _schema.healthPoop, _schema.healthPoop.poopTime)
        ]);
        const totalRecords = sleepCount + moodCount + painCount + dietCount + exerciseCount + waterCount + medicationCount + poopCount;
        const allFirstDates = [
            firstSleep,
            firstMood,
            firstPain,
            firstDiet,
            firstExercise,
            firstWater,
            firstMedication,
            firstPoop
        ].filter((d)=>d !== null);
        const firstDate = allFirstDates.length > 0 ? new Date(Math.min(...allFirstDates.map((d)=>d.getTime()))) : null;
        const weekWaterRate = await this.computeWeekWaterGoalRate(userId, 8);
        const items = [
            {
                id: 'first-record',
                name: '初次相遇',
                description: '完成第一条健康记录',
                criterion: '完成任意一条记录',
                icon: 'sparkles',
                category: 'milestone',
                isAchieved: totalRecords >= 1,
                progress: Math.min(1, totalRecords),
                target: 1,
                unit: '条',
                achievedAt: firstDate?.toISOString()
            },
            {
                id: 'streak-3',
                name: '三日坚持',
                description: '连续 3 天都有健康记录',
                criterion: '连续记录 3 天',
                icon: 'flame',
                category: 'streak',
                isAchieved: streakDays >= 3,
                progress: Math.min(3, streakDays),
                target: 3,
                unit: '天'
            },
            {
                id: 'streak-7',
                name: '一周坚持',
                description: '连续 7 天都有健康记录',
                criterion: '连续记录 7 天',
                icon: 'flame',
                category: 'streak',
                isAchieved: streakDays >= 7,
                progress: Math.min(7, streakDays),
                target: 7,
                unit: '天'
            },
            {
                id: 'streak-30',
                name: '月度习惯',
                description: '连续 30 天坚持记录健康',
                criterion: '连续记录 30 天',
                icon: 'trophy',
                category: 'streak',
                isAchieved: streakDays >= 30,
                progress: Math.min(30, streakDays),
                target: 30,
                unit: '天'
            },
            {
                id: 'water-daily',
                name: '喝水达人',
                description: '本周喝水达标的天数',
                criterion: '本周 7 天中 ≥ 5 天达成喝水目标',
                icon: 'droplets',
                category: 'water',
                isAchieved: weekWaterRate >= 71,
                progress: Math.round(weekWaterRate / 100 * 7),
                target: 5,
                unit: '天'
            },
            {
                id: 'exercise-5',
                name: '运动达人',
                description: '累计完成 5 次运动记录',
                criterion: '累计运动 5 次',
                icon: 'activity',
                category: 'exercise',
                isAchieved: exerciseCount >= 5,
                progress: Math.min(5, exerciseCount),
                target: 5,
                unit: '次'
            },
            {
                id: 'exercise-100min',
                name: '活力满满',
                description: '累计运动超过 100 分钟',
                criterion: '累计运动 100 分钟',
                icon: 'zap',
                category: 'exercise',
                isAchieved: totalExerciseMinutes >= 100,
                progress: Math.min(100, totalExerciseMinutes),
                target: 100,
                unit: '分钟'
            },
            {
                id: 'mood-10',
                name: '心情记录家',
                description: '累计记录 10 次情绪',
                criterion: '累计情绪记录 10 条',
                icon: 'smile',
                category: 'mood',
                isAchieved: moodCount >= 10,
                progress: Math.min(10, moodCount),
                target: 10,
                unit: '条'
            },
            {
                id: 'sleep-7',
                name: '早睡早起',
                description: '在 23:30 前入睡且 9:00 前起床',
                criterion: '累计 7 天在 23:30 前入睡且 9:00 前起床',
                icon: 'moon',
                category: 'sleep',
                isAchieved: earlySleepDays >= 7,
                progress: Math.min(7, earlySleepDays),
                target: 7,
                unit: '天'
            },
            {
                id: 'medication-adhere',
                name: '按时服药',
                description: '累计记录 10 次用药',
                criterion: '累计用药记录 10 条',
                icon: 'pill',
                category: 'medication',
                isAchieved: medicationCount >= 10,
                progress: Math.min(10, medicationCount),
                target: 10,
                unit: '次'
            }
        ];
        return {
            items,
            total: items.length,
            achievedCount: items.filter((i)=>i.isAchieved).length
        };
    }
    // ==================== Recent Records ====================
    async getRecentRecords(userId, limit) {
        const { start, end } = (0, _healthrecordsutils.getTodayRange)();
        const fetchToday = (table, timeCol)=>this.db.select().from(table).where((0, _drizzleorm.and)(this.baseFilter(table, userId), (0, _drizzleorm.gte)(timeCol, start), (0, _drizzleorm.lt)(timeCol, end))).orderBy((0, _drizzleorm.desc)(timeCol)).limit(limit);
        const [sleepRows, moodRows, painRows, dietRows, exerciseRows, waterRows, medicationRows, poopRows] = await Promise.all([
            fetchToday(_schema.healthSleep, _schema.healthSleep.wakeTime),
            fetchToday(_schema.healthMood, _schema.healthMood.recordTime),
            fetchToday(_schema.healthPain, _schema.healthPain.startTime),
            (async ()=>{
                const dietTime = (0, _drizzleorm.sql)`COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt})`;
                return this.db.select({
                    id: _schema.healthDiet.id,
                    mealType: _schema.healthDiet.mealType,
                    foodDescription: _schema.healthDiet.foodDescription,
                    foodImageUrl: _schema.healthDiet.foodImageUrl,
                    tags: _schema.healthDiet.tags,
                    note: _schema.healthDiet.note,
                    eatTime: dietTime.as('eat_time'),
                    createdAt: _schema.healthDiet.createdAt
                }).from(_schema.healthDiet).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthDiet, userId), (0, _drizzleorm.sql)`${dietTime} >= ${start.toISOString()}::timestamptz`, (0, _drizzleorm.sql)`${dietTime} < ${end.toISOString()}::timestamptz`)).orderBy((0, _drizzleorm.sql)`${dietTime} DESC`).limit(limit);
            })(),
            fetchToday(_schema.healthExercise, _schema.healthExercise.startTime),
            fetchToday(_schema.healthWater, _schema.healthWater.drinkTime),
            fetchToday(_schema.healthMedication, _schema.healthMedication.takeTime),
            fetchToday(_schema.healthPoop, _schema.healthPoop.poopTime)
        ]);
        const all = [];
        const toIso = (v)=>{
            if (v instanceof Date) return v.toISOString();
            if (typeof v === 'string') return new Date(v).toISOString();
            return new Date(String(v)).toISOString();
        };
        const push = (rows, type, timeKey, summarizer)=>{
            for (const r of rows){
                all.push({
                    id: r.id,
                    type,
                    typeLabel: _healthrecordsutils.TYPE_LABELS[type],
                    time: toIso(r[timeKey]),
                    summary: summarizer(r)
                });
            }
        };
        push(sleepRows, 'sleep', 'wakeTime', _healthrecordsutils.summarizeSleep);
        push(moodRows, 'mood', 'recordTime', _healthrecordsutils.summarizeMood);
        push(painRows, 'pain', 'startTime', _healthrecordsutils.summarizePain);
        push(dietRows, 'diet', 'eatTime', _healthrecordsutils.summarizeDiet);
        push(exerciseRows, 'exercise', 'startTime', _healthrecordsutils.summarizeExercise);
        push(waterRows, 'water', 'drinkTime', _healthrecordsutils.summarizeWater);
        push(medicationRows, 'medication', 'takeTime', _healthrecordsutils.summarizeMedication);
        push(poopRows, 'poop', 'poopTime', _healthrecordsutils.summarizePoop);
        all.sort((a, b)=>new Date(b.time).getTime() - new Date(a.time).getTime());
        return all.slice(0, limit);
    }
    constructor(db){
        this.db = db;
        this.logger = new _common.Logger(HealthRecordsService.name);
    }
};
HealthRecordsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_fullstacknestjscore.DRIZZLE_DATABASE)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof PostgresJsDatabase === "undefined" ? Object : PostgresJsDatabase
    ])
], HealthRecordsService);
