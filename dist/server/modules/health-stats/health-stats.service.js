"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HealthStatsService", {
    enumerable: true,
    get: function() {
        return HealthStatsService;
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
const POSITIVE_MOODS = [
    '开心',
    '平静',
    '幸福',
    '充实',
    '感动',
    '期待',
    '惊讶'
];
const NEGATIVE_MOODS = [
    '焦虑',
    '低落',
    '烦躁',
    '疲惫',
    '失落',
    '惊恐',
    '愤怒',
    '无聊',
    '紧张',
    '尴尬',
    '裂开',
    '难过',
    '破防',
    '麻了',
    '无语'
];
const DEFAULT_ALERT_THRESHOLDS = {
    sleep: 360,
    water: 6,
    pain_weekly: 3
};
const ALERT_LABELS = {
    sleep: '睡眠不足',
    water: '喝水不足',
    pain_weekly: '疼痛频发'
};
const ALERT_UNITS = {
    sleep: '分钟',
    water: '杯',
    pain_weekly: '次'
};
let HealthStatsService = class HealthStatsService {
    // ==================== Helpers ====================
    baseFilter(table, userId) {
        return (0, _drizzleorm.and)((0, _drizzleorm.eq)(table.userId, userId), (0, _drizzleorm.eq)(table.isDeleted, false));
    }
    /**
   * 计算亚洲上海时区的日期范围。
   * rangeDays: 从今天往前数的天数（含今天）。
   */ getDateRange(rangeDays) {
        const cnOffsetMs = 8 * 60 * 60 * 1000;
        const now = new Date();
        const cnNow = new Date(now.getTime() + cnOffsetMs);
        const cnTodayStr = cnNow.toISOString().slice(0, 10);
        const end = new Date(`${cnTodayStr}T23:59:59.999+08:00`);
        const start = new Date(`${cnTodayStr}T00:00:00+08:00`);
        start.setDate(start.getDate() - (rangeDays - 1));
        return {
            start,
            end
        };
    }
    parseDateToIso(dateStr) {
        if (!dateStr) return undefined;
        return new Date(dateStr).toISOString();
    }
    parseDate(dateStr) {
        if (!dateStr) return undefined;
        return new Date(dateStr);
    }
    /**
   * 解析 YYYY-MM-DD 日期字符串为上海时区的整天范围（左闭右开）。
   * 用于 startDate / endDate 类型的查询，避免 UTC 偏移导致记录漏算。
   */ parseFullDayRange(startDate, endDate) {
        let start;
        let end;
        if (startDate) {
            start = new Date(`${startDate}T00:00:00+08:00`);
        }
        if (endDate) {
            end = new Date(`${endDate}T23:59:59.999+08:00`);
            end = new Date(end.getTime() + 1); // 转成次日零点用于 lt 比较
        }
        return {
            start,
            end
        };
    }
    /** 将 timestamptz 列按 Asia/Shanghai 日期转成 YYYY-MM-DD 字符串的 SQL 表达式。 */ dateDay(dateExpr) {
        return (0, _drizzleorm.sql)`to_char(${dateExpr} AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD')`;
    }
    formatTimeFromIso(isoStr) {
        if (!isoStr) return '';
        const d = new Date(isoStr);
        const cnOffsetMs = 8 * 60 * 60 * 1000;
        const cnDate = new Date(d.getTime() + cnOffsetMs);
        const hh = String(cnDate.getUTCHours()).padStart(2, '0');
        const mm = String(cnDate.getUTCMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
    }
    // ==================== Sleep Stats ====================
    async getSleepStats(userId, _period, rangeDays) {
        const { start, end } = this.getDateRange(rangeDays);
        const dayKey = this.dateDay(_schema.healthSleep.wakeTime);
        const rows = await this.db.select({
            date: dayKey.as('date'),
            durationMinutes: (0, _drizzleorm.sql)`COALESCE(SUM(${_schema.healthSleep.durationMinutes}), 0)`.as('duration_minutes'),
            earliestSleep: (0, _drizzleorm.sql)`MIN(${_schema.healthSleep.sleepTime})`.as('earliest_sleep'),
            latestWake: (0, _drizzleorm.sql)`MAX(${_schema.healthSleep.wakeTime})`.as('latest_wake')
        }).from(_schema.healthSleep).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthSleep, userId), (0, _drizzleorm.gte)(_schema.healthSleep.wakeTime, start), (0, _drizzleorm.lt)(_schema.healthSleep.wakeTime, end))).groupBy((0, _drizzleorm.sql)`date`).orderBy((0, _drizzleorm.sql)`date ASC`);
        return rows.map((row)=>({
                date: row.date,
                value: Number(row.durationMinutes) || 0,
                durationMinutes: Number(row.durationMinutes) || 0,
                sleepTime: this.formatTimeFromIso(row.earliestSleep),
                wakeTime: this.formatTimeFromIso(row.latestWake)
            }));
    }
    // ==================== Water Stats ====================
    async getWaterStats(userId, _period, rangeDays) {
        const { start, end } = this.getDateRange(rangeDays);
        const dayKey = this.dateDay(_schema.healthWater.drinkTime);
        const rows = await this.db.select({
            date: dayKey.as('date'),
            cups: (0, _drizzleorm.sql)`COALESCE(ROUND(SUM(${_schema.healthWater.amountMl})::numeric / 250), 0)`.as('cups'),
            totalMl: (0, _drizzleorm.sql)`COALESCE(SUM(${_schema.healthWater.amountMl}), 0)`.as('total_ml')
        }).from(_schema.healthWater).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthWater, userId), (0, _drizzleorm.gte)(_schema.healthWater.drinkTime, start), (0, _drizzleorm.lt)(_schema.healthWater.drinkTime, end))).groupBy((0, _drizzleorm.sql)`date`).orderBy((0, _drizzleorm.sql)`date ASC`);
        return rows.map((row)=>({
                date: row.date,
                value: Number(row.totalMl) || 0,
                cups: Number(row.cups) || 0,
                totalMl: Number(row.totalMl) || 0
            }));
    }
    // ==================== Exercise Stats ====================
    async getExerciseStats(userId, _period, rangeDays) {
        const { start, end } = this.getDateRange(rangeDays);
        const dayKey = this.dateDay(_schema.healthExercise.startTime);
        const rows = await this.db.select({
            date: dayKey.as('date'),
            durationMinutes: (0, _drizzleorm.sql)`COALESCE(SUM(${_schema.healthExercise.durationMinutes}), 0)`.as('duration_minutes'),
            count: (0, _drizzleorm.sql)`COUNT(*)`.as('count')
        }).from(_schema.healthExercise).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthExercise, userId), (0, _drizzleorm.gte)(_schema.healthExercise.startTime, start), (0, _drizzleorm.lt)(_schema.healthExercise.startTime, end))).groupBy((0, _drizzleorm.sql)`date`).orderBy((0, _drizzleorm.sql)`date ASC`);
        return rows.map((row)=>({
                date: row.date,
                value: Number(row.durationMinutes) || 0,
                durationMinutes: Number(row.durationMinutes) || 0,
                count: Number(row.count) || 0
            }));
    }
    // ==================== Diet Meal Stats ====================
    async getDietMealStats(userId, startDate, endDate) {
        const { start, end } = this.parseFullDayRange(startDate, endDate);
        const whereConds = [
            this.baseFilter(_schema.healthDiet, userId)
        ];
        if (start) whereConds.push((0, _drizzleorm.sql)`COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt}) >= ${start.toISOString()}::timestamptz`);
        if (end) whereConds.push((0, _drizzleorm.sql)`COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt}) < ${end.toISOString()}::timestamptz`);
        const dayKey = (0, _drizzleorm.sql)`to_char(COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt}) AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD')`;
        const rows = await this.db.select({
            date: dayKey.as('date'),
            mealType: _schema.healthDiet.mealType,
            count: (0, _drizzleorm.sql)`COUNT(*)`.as('count')
        }).from(_schema.healthDiet).where((0, _drizzleorm.and)(...whereConds)).groupBy((0, _drizzleorm.sql)`date`, _schema.healthDiet.mealType).orderBy((0, _drizzleorm.sql)`date ASC`);
        return rows.map((row)=>({
                date: row.date,
                mealType: row.mealType,
                count: Number(row.count) || 0
            }));
    }
    // ==================== Mood Distribution ====================
    async getMoodDistribution(userId, startDate, endDate) {
        const { start, end } = this.parseFullDayRange(startDate, endDate);
        const whereConds = [
            this.baseFilter(_schema.healthMood, userId)
        ];
        if (start) whereConds.push((0, _drizzleorm.gte)(_schema.healthMood.recordTime, start));
        if (end) whereConds.push((0, _drizzleorm.lt)(_schema.healthMood.recordTime, end));
        const rows = await this.db.execute((0, _drizzleorm.sql)`
      SELECT
        unnest(${_schema.healthMood.moods}) AS mood,
        COUNT(*)::int AS count
      FROM ${_schema.healthMood}
      WHERE ${(0, _drizzleorm.and)(...whereConds)}
      GROUP BY mood
      ORDER BY count DESC
    `);
        return rows.map((row)=>({
                mood: row.mood,
                count: Number(row.count) || 0
            }));
    }
    // ==================== Pain Frequency ====================
    async getPainFrequency(userId, startDate, endDate) {
        const { start, end } = this.parseFullDayRange(startDate, endDate);
        const whereConds = [
            this.baseFilter(_schema.healthPain, userId)
        ];
        if (start) whereConds.push((0, _drizzleorm.gte)(_schema.healthPain.startTime, start));
        if (end) whereConds.push((0, _drizzleorm.lt)(_schema.healthPain.startTime, end));
        const rows = await this.db.execute((0, _drizzleorm.sql)`
      SELECT
        unnest(${_schema.healthPain.symptoms}) AS symptom,
        COUNT(*)::int AS count
      FROM ${_schema.healthPain}
      WHERE ${(0, _drizzleorm.and)(...whereConds)}
      GROUP BY symptom
      ORDER BY count DESC
    `);
        return rows.map((row)=>({
                symptom: row.symptom,
                count: Number(row.count) || 0
            }));
    }
    // ==================== Correlation: Sleep ↔ Mood ====================
    async getSleepMoodCorrelation(userId, rangeDays) {
        const { start, end } = this.getDateRange(rangeDays);
        // 按天统计睡眠时长（按起床时间归类到当天）
        const sleepRows = await this.db.select({
            date: this.dateDay(_schema.healthSleep.wakeTime).as('date'),
            durationMinutes: (0, _drizzleorm.sql)`COALESCE(SUM(${_schema.healthSleep.durationMinutes}), 0)`.as('duration_minutes')
        }).from(_schema.healthSleep).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthSleep, userId), (0, _drizzleorm.gte)(_schema.healthSleep.wakeTime, start), (0, _drizzleorm.lt)(_schema.healthSleep.wakeTime, end))).groupBy((0, _drizzleorm.sql)`date`);
        // 按天统计情绪得分：积极 +1 / 消极 -1
        const positiveArr = `ARRAY[${POSITIVE_MOODS.map((m)=>`'${m}'`).join(',')}]::text[]`;
        const negativeArr = `ARRAY[${NEGATIVE_MOODS.map((m)=>`'${m}'`).join(',')}]::text[]`;
        const moodRows = await this.db.execute((0, _drizzleorm.sql)`
      SELECT
        to_char(${_schema.healthMood.recordTime} AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD') AS date,
        SUM(CASE
          WHEN m.mood = ANY(${_drizzleorm.sql.raw(positiveArr)}) THEN 1
          WHEN m.mood = ANY(${_drizzleorm.sql.raw(negativeArr)}) THEN -1
          ELSE 0
        END)::int AS mood_score
      FROM ${_schema.healthMood}, unnest(${_schema.healthMood.moods}) AS m(mood)
      WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthMood, userId), (0, _drizzleorm.gte)(_schema.healthMood.recordTime, start), (0, _drizzleorm.lt)(_schema.healthMood.recordTime, end))}
      GROUP BY date
      ORDER BY date
    `);
        const sleepMap = new Map();
        for (const row of sleepRows){
            sleepMap.set(row.date, Number(row.durationMinutes) || 0);
        }
        const moodMap = new Map();
        for (const row of moodRows){
            moodMap.set(row.date, Number(row.mood_score) || 0);
        }
        const allDates = new Set([
            ...sleepMap.keys(),
            ...moodMap.keys()
        ]);
        const sortedDates = [
            ...allDates
        ].sort();
        const chartData = sortedDates.map((d)=>({
                date: d,
                primary: sleepMap.get(d) ?? 0,
                secondary: moodMap.get(d) ?? 0
            }));
        const correlation = this.pearson(chartData.map((d)=>d.primary), chartData.map((d)=>d.secondary));
        const description = this.generateSleepMoodDescription(rangeDays, sleepMap, moodMap, correlation);
        return {
            description,
            correlation,
            chartData
        };
    }
    generateSleepMoodDescription(rangeDays, sleepMap, moodMap, correlation) {
        const allDates = new Set([
            ...sleepMap.keys(),
            ...moodMap.keys()
        ]);
        if (allDates.size === 0) {
            return `近${rangeDays}天暂无睡眠和情绪记录，无法分析二者关系。`;
        }
        let goodSleepDays = 0;
        let goodSleepPositive = 0;
        let badSleepDays = 0;
        let badSleepPositive = 0;
        for (const date of allDates){
            const sleep = sleepMap.get(date) ?? 0;
            const moodScore = moodMap.get(date) ?? 0;
            if (sleep >= 420) {
                goodSleepDays += 1;
                if (moodScore > 0) goodSleepPositive += 1;
            } else if (sleep < 360 && sleep > 0) {
                badSleepDays += 1;
                if (moodScore > 0) badSleepPositive += 1;
            }
        }
        const goodRate = goodSleepDays > 0 ? Math.round(goodSleepPositive / goodSleepDays * 100) : 0;
        const badRate = badSleepDays > 0 ? Math.round(badSleepPositive / badSleepDays * 100) : 0;
        let relation = '呈正相关';
        if (correlation < -0.2) relation = '呈负相关';
        else if (Math.abs(correlation) < 0.2) relation = '相关性不明显';
        if (goodSleepDays === 0 && badSleepDays === 0) {
            return `近${rangeDays}天数据不足，暂无法判断睡眠时长与情绪的关系。`;
        }
        return `近${rangeDays}天数据显示，` + (goodSleepDays > 0 ? `睡眠时长超过7小时的日子，积极情绪占比为${goodRate}%；` : '') + (badSleepDays > 0 ? `睡眠不足6小时的日子，积极情绪占比为${badRate}%。` : '') + `充足的睡眠与更好的情绪状态${relation}。`;
    }
    // ==================== Correlation: Exercise ↔ Sleep ====================
    async getExerciseSleepCorrelation(userId, rangeDays) {
        const { start, end } = this.getDateRange(rangeDays);
        const exerciseRows = await this.db.select({
            date: this.dateDay(_schema.healthExercise.startTime).as('date'),
            durationMinutes: (0, _drizzleorm.sql)`COALESCE(SUM(${_schema.healthExercise.durationMinutes}), 0)`.as('duration_minutes')
        }).from(_schema.healthExercise).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthExercise, userId), (0, _drizzleorm.gte)(_schema.healthExercise.startTime, start), (0, _drizzleorm.lt)(_schema.healthExercise.startTime, end))).groupBy((0, _drizzleorm.sql)`date`);
        // 睡眠按起床日期归类
        const sleepRows = await this.db.select({
            date: this.dateDay(_schema.healthSleep.wakeTime).as('date'),
            durationMinutes: (0, _drizzleorm.sql)`COALESCE(SUM(${_schema.healthSleep.durationMinutes}), 0)`.as('duration_minutes')
        }).from(_schema.healthSleep).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthSleep, userId), (0, _drizzleorm.gte)(_schema.healthSleep.wakeTime, start), (0, _drizzleorm.lt)(_schema.healthSleep.wakeTime, end))).groupBy((0, _drizzleorm.sql)`date`);
        const exerciseMap = new Map();
        for (const row of exerciseRows){
            exerciseMap.set(row.date, Number(row.durationMinutes) || 0);
        }
        const sleepMap = new Map();
        for (const row of sleepRows){
            sleepMap.set(row.date, Number(row.durationMinutes) || 0);
        }
        const allDates = new Set([
            ...exerciseMap.keys(),
            ...sleepMap.keys()
        ]);
        const sortedDates = [
            ...allDates
        ].sort();
        const chartData = sortedDates.map((d)=>({
                date: d,
                primary: exerciseMap.get(d) ?? 0,
                secondary: sleepMap.get(d) ?? 0
            }));
        const correlation = this.pearson(chartData.map((d)=>d.primary), chartData.map((d)=>d.secondary));
        const description = this.generateExerciseSleepDescription(rangeDays, exerciseMap, sleepMap, correlation);
        return {
            description,
            correlation,
            chartData
        };
    }
    generateExerciseSleepDescription(rangeDays, exerciseMap, sleepMap, correlation) {
        const allDates = new Set([
            ...exerciseMap.keys(),
            ...sleepMap.keys()
        ]);
        if (allDates.size === 0) {
            return `近${rangeDays}天暂无运动和睡眠记录，无法分析二者关系。`;
        }
        let exerciseDays = 0;
        let exerciseAvgSleep = 0;
        let noExerciseDays = 0;
        let noExerciseAvgSleep = 0;
        for (const date of allDates){
            const ex = exerciseMap.get(date) ?? 0;
            const sl = sleepMap.get(date) ?? 0;
            if (ex > 0) {
                exerciseDays += 1;
                exerciseAvgSleep += sl;
            } else if (sl > 0) {
                noExerciseDays += 1;
                noExerciseAvgSleep += sl;
            }
        }
        const exAvg = exerciseDays > 0 ? Math.round(exerciseAvgSleep / exerciseDays) : 0;
        const noExAvg = noExerciseDays > 0 ? Math.round(noExerciseAvgSleep / noExerciseDays) : 0;
        let relation = '呈正相关';
        if (correlation < -0.2) relation = '呈负相关';
        else if (Math.abs(correlation) < 0.2) relation = '相关性不明显';
        if (exerciseDays === 0) {
            return `近${rangeDays}天暂无运动记录，无法分析运动与睡眠的关系。`;
        }
        return `近${rangeDays}天数据显示，` + `有运动的日子平均睡眠时长为${exAvg}分钟` + (noExerciseDays > 0 ? `，无运动的日子平均睡眠时长为${noExAvg}分钟` : '') + `。运动频率与睡眠质量${relation}。`;
    }
    /** 简单 Pearson 相关系数近似 */ pearson(x, y) {
        const n = x.length;
        if (n < 2) return 0;
        const sumX = x.reduce((a, b)=>a + b, 0);
        const sumY = y.reduce((a, b)=>a + b, 0);
        const meanX = sumX / n;
        const meanY = sumY / n;
        let num = 0;
        let denX = 0;
        let denY = 0;
        for(let i = 0; i < n; i++){
            const dx = x[i] - meanX;
            const dy = y[i] - meanY;
            num += dx * dy;
            denX += dx * dx;
            denY += dy * dy;
        }
        const den = Math.sqrt(denX * denY);
        if (den === 0) return 0;
        return Math.round(num / den * 100) / 100;
    }
    // ==================== Alerts ====================
    async getAlerts(userId, startDate, endDate) {
        const { start, end } = this.parseFullDayRange(startDate, endDate);
        const safeStart = start ?? this.getDateRange(30).start;
        const safeEnd = end ?? new Date();
        const configs = await this.getUserAlertConfigMap(userId);
        const alerts = [];
        // ----- 睡眠不足预警 -----
        const sleepEnabled = configs.get('sleep')?.isEnabled ?? true;
        const sleepThreshold = configs.get('sleep')?.threshold ?? DEFAULT_ALERT_THRESHOLDS.sleep;
        if (sleepEnabled) {
            const sleepRows = await this.db.select({
                date: this.dateDay(_schema.healthSleep.wakeTime).as('date'),
                totalMinutes: (0, _drizzleorm.sql)`COALESCE(SUM(${_schema.healthSleep.durationMinutes}), 0)`.as('total_minutes')
            }).from(_schema.healthSleep).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthSleep, userId), (0, _drizzleorm.gte)(_schema.healthSleep.wakeTime, safeStart), (0, _drizzleorm.lt)(_schema.healthSleep.wakeTime, safeEnd))).groupBy((0, _drizzleorm.sql)`date`);
            for (const row of sleepRows){
                const minutes = Number(row.totalMinutes) || 0;
                if (minutes < sleepThreshold) {
                    alerts.push({
                        id: `sleep-${row.date}`,
                        alertType: 'sleep',
                        alertTypeLabel: ALERT_LABELS.sleep,
                        date: row.date,
                        value: minutes,
                        threshold: sleepThreshold,
                        unit: ALERT_UNITS.sleep
                    });
                }
            }
        }
        // ----- 喝水不足预警 -----
        const waterEnabled = configs.get('water')?.isEnabled ?? true;
        const waterThreshold = configs.get('water')?.threshold ?? DEFAULT_ALERT_THRESHOLDS.water;
        if (waterEnabled) {
            const waterRows = await this.db.select({
                date: this.dateDay(_schema.healthWater.drinkTime).as('date'),
                cups: (0, _drizzleorm.sql)`COALESCE(ROUND(SUM(${_schema.healthWater.amountMl})::numeric / 250), 0)`.as('cups')
            }).from(_schema.healthWater).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthWater, userId), (0, _drizzleorm.gte)(_schema.healthWater.drinkTime, safeStart), (0, _drizzleorm.lt)(_schema.healthWater.drinkTime, safeEnd))).groupBy((0, _drizzleorm.sql)`date`);
            for (const row of waterRows){
                const cups = Number(row.cups) || 0;
                if (cups < waterThreshold) {
                    alerts.push({
                        id: `water-${row.date}`,
                        alertType: 'water',
                        alertTypeLabel: ALERT_LABELS.water,
                        date: row.date,
                        value: cups,
                        threshold: waterThreshold,
                        unit: ALERT_UNITS.water
                    });
                }
            }
        }
        // ----- 疼痛周频次预警（一周 >= 阈值） -----
        const painEnabled = configs.get('pain_weekly')?.isEnabled ?? true;
        const painThreshold = configs.get('pain_weekly')?.threshold ?? DEFAULT_ALERT_THRESHOLDS.pain_weekly;
        if (painEnabled) {
            const painRows = await this.db.execute((0, _drizzleorm.sql)`
        SELECT
          to_char(
            date_trunc('week', ${_schema.healthPain.startTime} AT TIME ZONE 'Asia/Shanghai'),
            'YYYY-MM-DD'
          ) AS week_start,
          COUNT(*)::int AS count
        FROM ${_schema.healthPain}
        WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthPain, userId), (0, _drizzleorm.gte)(_schema.healthPain.startTime, safeStart), (0, _drizzleorm.lt)(_schema.healthPain.startTime, safeEnd))}
        GROUP BY week_start
        ORDER BY week_start
      `);
            for (const row of painRows){
                const c = Number(row.count) || 0;
                if (c >= painThreshold) {
                    alerts.push({
                        id: `pain-weekly-${row.week_start}`,
                        alertType: 'pain_weekly',
                        alertTypeLabel: ALERT_LABELS.pain_weekly,
                        date: row.week_start,
                        value: c,
                        threshold: painThreshold,
                        unit: ALERT_UNITS.pain_weekly
                    });
                }
            }
        }
        // 按日期倒序
        alerts.sort((a, b)=>a.date < b.date ? 1 : -1);
        return alerts;
    }
    // ==================== Alert Config ====================
    async getAlertConfig(userId) {
        const userConfigs = await this.db.select().from(_schema.healthAlertConfig).where((0, _drizzleorm.and)((0, _drizzleorm.eq)(_schema.healthAlertConfig.userId, userId), (0, _drizzleorm.eq)(_schema.healthAlertConfig.isDeleted, false)));
        const configMap = new Map();
        for (const row of userConfigs){
            configMap.set(row.alertType, {
                id: row.id,
                alertType: row.alertType,
                threshold: Number(row.threshold) || 0,
                isEnabled: row.isEnabled
            });
        }
        // 合并默认值，确保三类预警都返回
        const allTypes = [
            'sleep',
            'water',
            'pain_weekly'
        ];
        return allTypes.map((type)=>{
            if (configMap.has(type)) return configMap.get(type);
            return {
                id: `default-${type}`,
                alertType: type,
                threshold: DEFAULT_ALERT_THRESHOLDS[type],
                isEnabled: true
            };
        });
    }
    async updateAlertConfig(userId, alertType, body) {
        // 先查是否已有用户自定义配置
        const existing = await this.db.select().from(_schema.healthAlertConfig).where((0, _drizzleorm.and)((0, _drizzleorm.eq)(_schema.healthAlertConfig.userId, userId), (0, _drizzleorm.eq)(_schema.healthAlertConfig.alertType, alertType), (0, _drizzleorm.eq)(_schema.healthAlertConfig.isDeleted, false))).limit(1);
        const patch = {};
        if (body.threshold !== undefined) patch.threshold = String(body.threshold);
        if (body.isEnabled !== undefined) patch.isEnabled = body.isEnabled;
        if (existing.length > 0) {
            const updated = await this.db.update(_schema.healthAlertConfig).set(patch).where((0, _drizzleorm.eq)(_schema.healthAlertConfig.id, existing[0].id)).returning();
            return {
                id: updated[0].id,
                alertType: updated[0].alertType,
                threshold: Number(updated[0].threshold) || 0,
                isEnabled: updated[0].isEnabled
            };
        }
        // 没有则插入一条
        const defaultThreshold = DEFAULT_ALERT_THRESHOLDS[alertType] ?? 0;
        const threshold = body.threshold !== undefined ? String(body.threshold) : String(defaultThreshold);
        const isEnabled = body.isEnabled !== undefined ? body.isEnabled : true;
        const inserted = await this.db.insert(_schema.healthAlertConfig).values({
            userId,
            alertType,
            threshold,
            isEnabled
        }).returning();
        return {
            id: inserted[0].id,
            alertType: inserted[0].alertType,
            threshold: Number(inserted[0].threshold) || 0,
            isEnabled: inserted[0].isEnabled
        };
    }
    async getUserAlertConfigMap(userId) {
        const rows = await this.db.select().from(_schema.healthAlertConfig).where((0, _drizzleorm.and)((0, _drizzleorm.eq)(_schema.healthAlertConfig.userId, userId), (0, _drizzleorm.eq)(_schema.healthAlertConfig.isDeleted, false)));
        const map = new Map();
        for (const row of rows){
            map.set(row.alertType, {
                threshold: Number(row.threshold) || 0,
                isEnabled: row.isEnabled
            });
        }
        return map;
    }
    // ==================== Weekly Detail Stats ====================
    async getWeeklyDetailStats(userId, startDate, endDate) {
        const { start, end } = this.parseFullDayRange(startDate, endDate);
        const safeStart = start;
        const safeEnd = end;
        const [diet, sleep, water, exercise, mood, pain, medication, poop] = await Promise.all([
            this.getWeeklyDiet(userId, safeStart, safeEnd),
            this.getWeeklySleep(userId, safeStart, safeEnd),
            this.getWeeklyWater(userId, safeStart, safeEnd),
            this.getWeeklyExercise(userId, safeStart, safeEnd),
            this.getWeeklyMood(userId, safeStart, safeEnd),
            this.getWeeklyPain(userId, safeStart, safeEnd),
            this.getWeeklyMedication(userId, safeStart, safeEnd),
            this.getWeeklyPoop(userId, safeStart, safeEnd)
        ]);
        return {
            diet,
            sleep,
            water,
            exercise,
            mood,
            pain,
            medication,
            poop
        };
    }
    // ==================== Monthly Detail Stats ====================
    /**
   * 基于月第一天（上海时区）所在周的周一为基准，计算某一周起始日期属于第几周。
   */ getWeekLabel(weekStartIso, monthStartDate) {
        // 月第一天
        const monthStart = new Date(`${monthStartDate}T00:00:00+08:00`);
        // 找到月第一天所在周的周一（date_trunc('week') 以周一开始）
        const dayOfWeek = monthStart.getUTCDay(); // 0=Sun, 1=Mon, ... 6=Sat
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const baseWeek = new Date(monthStart);
        baseWeek.setUTCDate(monthStart.getUTCDate() + diffToMonday);
        baseWeek.setUTCHours(0, 0, 0, 0);
        const weekStart = new Date(`${weekStartIso}T00:00:00+08:00`);
        const diffDays = Math.round((weekStart.getTime() - baseWeek.getTime()) / 86400000);
        const weekNum = Math.floor(diffDays / 7) + 1;
        return `第${weekNum}周`;
    }
    async getMonthlyDetailStats(userId, startDate, endDate) {
        const { start, end } = this.parseFullDayRange(startDate, endDate);
        const safeStart = start;
        const safeEnd = end;
        const startIso = safeStart.toISOString();
        const endIso = safeEnd.toISOString();
        const [diet, sleep, water, exercise, mood, pain, medication, poop, sleepWeeklyRows, exerciseWeeklyRows, waterGoalRow] = await Promise.all([
            this.getWeeklyDiet(userId, safeStart, safeEnd),
            this.getWeeklySleep(userId, safeStart, safeEnd),
            this.getWeeklyWater(userId, safeStart, safeEnd),
            this.getWeeklyExercise(userId, safeStart, safeEnd),
            this.getWeeklyMood(userId, safeStart, safeEnd),
            this.getWeeklyPain(userId, safeStart, safeEnd),
            this.getWeeklyMedication(userId, safeStart, safeEnd),
            this.getWeeklyPoop(userId, safeStart, safeEnd),
            // 睡眠按周质量分布
            this.db.execute((0, _drizzleorm.sql)`
        SELECT
          to_char(
            date_trunc('week', daily_sleep.wake_time AT TIME ZONE 'Asia/Shanghai'),
            'YYYY-MM-DD'
          ) AS week_start,
          COUNT(*)::int AS total_days,
          SUM(CASE WHEN daily_sleep.duration_minutes >= 450 THEN 1 ELSE 0 END)::int AS good,
          SUM(CASE WHEN daily_sleep.duration_minutes >= 360 AND daily_sleep.duration_minutes < 450 THEN 1 ELSE 0 END)::int AS medium,
          SUM(CASE WHEN daily_sleep.duration_minutes < 360 THEN 1 ELSE 0 END)::int AS poor
        FROM (
          SELECT
            ${_schema.healthSleep.wakeTime},
            SUM(${_schema.healthSleep.durationMinutes}) AS duration_minutes
          FROM ${_schema.healthSleep}
          WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthSleep, userId), (0, _drizzleorm.gte)(_schema.healthSleep.wakeTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthSleep.wakeTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
          GROUP BY date_trunc('day', ${_schema.healthSleep.wakeTime} AT TIME ZONE 'Asia/Shanghai'), ${_schema.healthSleep.wakeTime}
        ) AS daily_sleep
        GROUP BY week_start
        ORDER BY week_start
      `),
            // 运动按周趋势
            this.db.execute((0, _drizzleorm.sql)`
        SELECT
          to_char(
            date_trunc('week', ${_schema.healthExercise.startTime} AT TIME ZONE 'Asia/Shanghai'),
            'YYYY-MM-DD'
          ) AS week_start,
          COALESCE(SUM(${_schema.healthExercise.durationMinutes}), 0)::int AS minutes
        FROM ${_schema.healthExercise}
        WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthExercise, userId), (0, _drizzleorm.gte)(_schema.healthExercise.startTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthExercise.startTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
        GROUP BY week_start
        ORDER BY week_start
      `),
            // 喝水目标
            this.db.select({
                targetValue: _schema.healthGoals.targetValue
            }).from(_schema.healthGoals).where((0, _drizzleorm.and)((0, _drizzleorm.eq)(_schema.healthGoals.userId, userId), (0, _drizzleorm.eq)(_schema.healthGoals.goalType, 'water'), (0, _drizzleorm.eq)(_schema.healthGoals.isDeleted, false))).limit(1)
        ]);
        // ----- 睡眠按周质量 -----
        const weeklyQuality = [];
        let worstWeekLabel = '';
        let worstScore = -1; // 好+中越少、差越多则越差；用 poor - good 作为分数
        for (const row of sleepWeeklyRows){
            const weekStartStr = row.week_start;
            const weekLabel = this.getWeekLabel(weekStartStr, startDate);
            const good = Number(row.good) || 0;
            const medium = Number(row.medium) || 0;
            const poor = Number(row.poor) || 0;
            weeklyQuality.push({
                weekLabel,
                good,
                medium,
                poor
            });
            // 最差一周：poor 最多、或 good+medium 最少
            const score = poor - good;
            if (worstWeekLabel === '' || score > worstScore) {
                worstScore = score;
                worstWeekLabel = weekLabel;
            }
        }
        // ----- 情绪积极占比 & 每日情绪 -----
        let totalMoodCount = 0;
        let positiveMoodCount = 0;
        for (const item of mood.distribution){
            totalMoodCount += item.count;
            if (POSITIVE_MOODS.includes(item.mood)) {
                positiveMoodCount += item.count;
            }
        }
        const positiveRate = totalMoodCount > 0 ? Math.round(positiveMoodCount / totalMoodCount * 100) : 0;
        const dailyMoods = mood.dailyTrend.map((d)=>({
                date: d.date,
                mood: d.mood,
                isPositive: POSITIVE_MOODS.includes(d.mood)
            }));
        // ----- 病痛 top5 -----
        const top5Symptoms = pain.topSymptoms.slice(0, 5);
        // ----- 运动按周趋势 -----
        const weeklyTrend = [];
        for (const row of exerciseWeeklyRows){
            const weekStartStr = row.week_start;
            const weekLabel = this.getWeekLabel(weekStartStr, startDate);
            weeklyTrend.push({
                weekLabel,
                minutes: Number(row.minutes) || 0
            });
        }
        // ----- 喝水目标 & 达标天数 -----
        const targetCups = waterGoalRow.length > 0 ? Math.round(Number(waterGoalRow[0].targetValue) || 0) : 8;
        const meetTargetDays = water.dailyCups.filter((d)=>d.cups >= targetCups).length;
        // ----- 排便日均 -----
        const totalDays = Math.max(1, Math.round((safeEnd.getTime() - safeStart.getTime()) / 86400000));
        const avgDaily = Math.round(poop.totalCount / totalDays * 10) / 10;
        // ----- topKpis -----
        const topKpis = {
            avgSleepHours: sleep.avgHours,
            positiveMoodRate: positiveRate,
            topMoodLabel: mood.topMood,
            exerciseTotalMinutes: exercise.totalMinutes,
            avgWaterCups: water.avgCups,
            waterMeetTargetDays: meetTargetDays
        };
        return {
            topKpis,
            diet,
            sleep: {
                ...sleep,
                weeklyQuality,
                worstWeekLabel
            },
            mood: {
                ...mood,
                positiveRate,
                dailyMoods
            },
            pain: {
                ...pain,
                top5Symptoms
            },
            exercise: {
                ...exercise,
                weeklyTrend
            },
            water: {
                ...water,
                targetCups,
                meetTargetDays
            },
            medication,
            poop: {
                ...poop,
                avgDaily
            }
        };
    }
    async getWeeklyDiet(userId, start, end) {
        const dayKey = (0, _drizzleorm.sql)`to_char(COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt}) AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD')`;
        const rows = await this.db.select({
            date: dayKey.as('date'),
            mealType: _schema.healthDiet.mealType,
            count: (0, _drizzleorm.sql)`COUNT(*)`.as('count'),
            tags: (0, _drizzleorm.sql)`COALESCE(json_agg(${_schema.healthDiet.tags})::text, '[]')`.as('tags')
        }).from(_schema.healthDiet).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthDiet, userId), (0, _drizzleorm.sql)`COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt}) >= ${start.toISOString()}::timestamptz`, (0, _drizzleorm.sql)`COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt}) < ${end.toISOString()}::timestamptz`)).groupBy((0, _drizzleorm.sql)`date`, _schema.healthDiet.mealType);
        const allMeals = rows.filter((r)=>r.mealType !== 'snack' && r.mealType !== 'supper');
        const mealDays = new Set();
        const fullMealDays = new Set();
        const mealByDate = new Map();
        for (const row of allMeals){
            mealDays.add(row.date);
            const set = mealByDate.get(row.date) ?? new Set();
            set.add(row.mealType);
            mealByDate.set(row.date, set);
        }
        for (const [date, meals] of mealByDate){
            if (meals.has('breakfast') && meals.has('lunch') && meals.has('dinner')) {
                fullMealDays.add(date);
            }
        }
        const allRows = rows;
        const allTagsList = [];
        for (const row of allRows){
            try {
                const parsed = JSON.parse(row.tags);
                for (const arr of parsed){
                    for (const t of arr)allTagsList.push(t);
                }
            } catch  {
            // ignore
            }
        }
        const takeoutCount = allTagsList.filter((t)=>t === '外卖').length;
        const totalMeals = allRows.reduce((s, r)=>s + Number(r.count || 0), 0);
        const takeoutRate = totalMeals > 0 ? Math.round(takeoutCount / totalMeals * 100) : 0;
        const takeoutByMealMap = new Map();
        const mealTypeMap = new Map();
        for (const row of allRows){
            const cnt = Number(row.count || 0);
            const meal = row.mealType;
            let rowTakeout = 0;
            try {
                const parsed = JSON.parse(row.tags);
                for (const arr of parsed){
                    if (arr.includes('外卖')) rowTakeout += 1;
                    if (arr.includes('外食') || arr.includes('餐厅')) {
                        mealTypeMap.set('外食', (mealTypeMap.get('外食') ?? 0) + 1);
                    } else if (arr.includes('外卖')) {
                        mealTypeMap.set('外卖', (mealTypeMap.get('外卖') ?? 0) + 1);
                    } else {
                        mealTypeMap.set('家常', (mealTypeMap.get('家常') ?? 0) + 1);
                    }
                }
            } catch  {
                mealTypeMap.set('家常', (mealTypeMap.get('家常') ?? 0) + cnt);
            }
            if (rowTakeout > 0) {
                takeoutByMealMap.set(meal, (takeoutByMealMap.get(meal) ?? 0) + rowTakeout);
            }
        }
        const takeoutByMeal = [
            'lunch',
            'dinner',
            'weekend'
        ].map((m)=>({
                meal: m,
                count: takeoutByMealMap.get(m) ?? 0
            })).filter((x)=>x.count > 0);
        const mealTypeComposition = [
            '家常',
            '外卖',
            '外食'
        ].map((t)=>({
                type: t,
                count: mealTypeMap.get(t) ?? 0
            })).filter((x)=>x.count > 0);
        const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
        const mealMissMap = new Map();
        for(let i = 0; i < totalDays; i += 1){
            const d = new Date(start.getTime() + i * 86400000);
            const ds = d.toISOString().slice(0, 10);
            const meals = mealByDate.get(ds) ?? new Set();
            for (const m of [
                'breakfast',
                'lunch',
                'dinner'
            ]){
                if (!meals.has(m)) {
                    mealMissMap.set(m, (mealMissMap.get(m) ?? 0) + 1);
                }
            }
        }
        let mostMissedMeal = '早餐';
        let missedCount = totalDays;
        const mealNames = {
            breakfast: '早餐',
            lunch: '午餐',
            dinner: '晚餐'
        };
        for (const [m, c] of mealMissMap){
            if (c > missedCount) {
                missedCount = c;
                mostMissedMeal = mealNames[m] ?? m;
            }
        }
        return {
            fullMealDays: fullMealDays.size,
            takeoutCount,
            takeoutRate,
            takeoutByMeal,
            mealTypeComposition,
            mostMissedMeal,
            missedCount
        };
    }
    async getWeeklySleep(userId, start, end) {
        const dayKey = this.dateDay(_schema.healthSleep.wakeTime);
        const rows = await this.db.select({
            date: dayKey.as('date'),
            durationMinutes: (0, _drizzleorm.sql)`COALESCE(SUM(${_schema.healthSleep.durationMinutes}), 0)`.as('duration_minutes')
        }).from(_schema.healthSleep).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthSleep, userId), (0, _drizzleorm.gte)(_schema.healthSleep.wakeTime, start), (0, _drizzleorm.lt)(_schema.healthSleep.wakeTime, end))).groupBy((0, _drizzleorm.sql)`date`).orderBy((0, _drizzleorm.sql)`date ASC`);
        const dailyHours = rows.map((row)=>({
                date: row.date,
                hours: Math.round(Number(row.durationMinutes) / 60 * 10) / 10
            }));
        let bestDay = null;
        let worstDay = null;
        let totalHours = 0;
        let meetTargetDays = 0;
        const targetHours = 7;
        const goodCount = {
            good: 0,
            medium: 0,
            poor: 0
        };
        for (const d of dailyHours){
            if (d.hours > 0) {
                totalHours += d.hours;
                if (d.hours >= targetHours) meetTargetDays += 1;
                if (!bestDay || d.hours > bestDay.hours) bestDay = d;
                if (!worstDay || d.hours < worstDay.hours) worstDay = d;
                if (d.hours >= 7.5) goodCount.good += 1;
                else if (d.hours >= 6) goodCount.medium += 1;
                else goodCount.poor += 1;
            }
        }
        const qualityDistribution = [
            {
                quality: '好',
                count: goodCount.good
            },
            {
                quality: '中',
                count: goodCount.medium
            },
            {
                quality: '差',
                count: goodCount.poor
            }
        ].filter((x)=>x.count > 0);
        const avgHours = dailyHours.filter((d)=>d.hours > 0).length > 0 ? Math.round(totalHours / dailyHours.filter((d)=>d.hours > 0).length * 10) / 10 : 0;
        return {
            dailyHours,
            qualityDistribution,
            bestDay,
            worstDay,
            avgHours,
            targetHours,
            meetTargetDays
        };
    }
    async getWeeklyWater(userId, start, end) {
        const dayKey = this.dateDay(_schema.healthWater.drinkTime);
        const rows = await this.db.select({
            date: dayKey.as('date'),
            cups: (0, _drizzleorm.sql)`COALESCE(ROUND(SUM(${_schema.healthWater.amountMl})::numeric / 250), 0)`.as('cups'),
            totalMl: (0, _drizzleorm.sql)`COALESCE(SUM(${_schema.healthWater.amountMl}), 0)`.as('total_ml')
        }).from(_schema.healthWater).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthWater, userId), (0, _drizzleorm.gte)(_schema.healthWater.drinkTime, start), (0, _drizzleorm.lt)(_schema.healthWater.drinkTime, end))).groupBy((0, _drizzleorm.sql)`date`).orderBy((0, _drizzleorm.sql)`date ASC`);
        const dailyCups = rows.map((row)=>({
                date: row.date,
                cups: Number(row.cups) || 0
            }));
        let totalCups = 0;
        let maxCups = 0;
        for (const d of dailyCups){
            totalCups += d.cups;
            if (d.cups > maxCups) maxCups = d.cups;
        }
        const daysWithData = dailyCups.filter((d)=>d.cups > 0).length;
        const avgCups = daysWithData > 0 ? Math.round(totalCups / daysWithData * 10) / 10 : 0;
        return {
            dailyCups,
            avgCups,
            maxCups,
            totalCups
        };
    }
    async getWeeklyExercise(userId, start, end) {
        const rows = await this.db.select({
            exerciseType: _schema.healthExercise.exerciseType,
            totalMinutes: (0, _drizzleorm.sql)`COALESCE(SUM(${_schema.healthExercise.durationMinutes}), 0)`.as('total_minutes'),
            count: (0, _drizzleorm.sql)`COUNT(*)`.as('count')
        }).from(_schema.healthExercise).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthExercise, userId), (0, _drizzleorm.gte)(_schema.healthExercise.startTime, start), (0, _drizzleorm.lt)(_schema.healthExercise.startTime, end))).groupBy(_schema.healthExercise.exerciseType);
        const typeComposition = rows.map((row)=>({
                type: row.exerciseType,
                minutes: Number(row.totalMinutes) || 0
            })).sort((a, b)=>b.minutes - a.minutes);
        let totalMinutes = 0;
        let sessionCount = 0;
        for (const row of rows){
            totalMinutes += Number(row.totalMinutes) || 0;
            sessionCount += Number(row.count) || 0;
        }
        const avgMinutes = sessionCount > 0 ? Math.round(totalMinutes / sessionCount) : 0;
        const lightTypes = [
            'walking',
            'stretching',
            'yoga',
            '散步',
            '健走',
            '拉伸',
            '瑜伽'
        ];
        const moderateTypes = [
            'cycling',
            'swimming',
            'jogging',
            '骑行',
            '游泳',
            '慢跑',
            '跑步'
        ];
        const heavyTypes = [
            'strength',
            'hiit',
            'boxing',
            '力量',
            'hiit',
            '拳击'
        ];
        let lightMin = 0;
        let moderateMin = 0;
        let heavyMin = 0;
        for (const row of rows){
            const t = row.exerciseType.toLowerCase();
            const m = Number(row.totalMinutes) || 0;
            if (heavyTypes.some((ht)=>t.includes(ht))) heavyMin += m;
            else if (moderateTypes.some((mt)=>t.includes(mt))) moderateMin += m;
            else if (lightTypes.some((lt)=>t.includes(lt))) lightMin += m;
            else lightMin += m;
        }
        const intensityDistribution = [
            {
                level: '轻度',
                minutes: lightMin
            },
            {
                level: '中度',
                minutes: moderateMin
            },
            {
                level: '高强度',
                minutes: heavyMin
            }
        ].filter((x)=>x.minutes > 0);
        return {
            typeComposition,
            totalMinutes,
            avgMinutes,
            sessionCount,
            intensityDistribution
        };
    }
    async getWeeklyMood(userId, start, end) {
        const rows = await this.db.execute((0, _drizzleorm.sql)`
      SELECT
        unnest(${_schema.healthMood.moods}) AS mood,
        COUNT(*)::int AS count
      FROM ${_schema.healthMood}
      WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthMood, userId), (0, _drizzleorm.gte)(_schema.healthMood.recordTime, start), (0, _drizzleorm.lt)(_schema.healthMood.recordTime, end))}
      GROUP BY mood
      ORDER BY count DESC
    `);
        const distribution = rows.map((row)=>({
                mood: row.mood,
                count: Number(row.count) || 0
            }));
        const topMood = distribution[0]?.mood ?? '';
        const topMoodDays = distribution[0]?.count ?? 0;
        const dayKey = this.dateDay(_schema.healthMood.recordTime);
        const dayRows = await this.db.select({
            date: dayKey.as('date'),
            moods: _schema.healthMood.moods
        }).from(_schema.healthMood).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthMood, userId), (0, _drizzleorm.gte)(_schema.healthMood.recordTime, start), (0, _drizzleorm.lt)(_schema.healthMood.recordTime, end))).orderBy((0, _drizzleorm.sql)`date ASC`);
        const dailyMap = new Map();
        for (const row of dayRows){
            if (!dailyMap.has(row.date) && row.moods && row.moods.length > 0) {
                dailyMap.set(row.date, row.moods[0]);
            }
        }
        const dailyTrend = [
            ...dailyMap.entries()
        ].map(([date, mood])=>({
                date,
                mood
            }));
        return {
            distribution,
            topMood,
            topMoodDays,
            dailyTrend
        };
    }
    async getWeeklyPain(userId, start, end) {
        const symptomRows = await this.db.execute((0, _drizzleorm.sql)`
      SELECT
        unnest(${_schema.healthPain.symptoms}) AS symptom,
        COUNT(*)::int AS count
      FROM ${_schema.healthPain}
      WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthPain, userId), (0, _drizzleorm.gte)(_schema.healthPain.startTime, start), (0, _drizzleorm.lt)(_schema.healthPain.startTime, end))}
      GROUP BY symptom
      ORDER BY count DESC
    `);
        const topSymptoms = symptomRows.map((row)=>({
                symptom: row.symptom,
                count: Number(row.count) || 0
            }));
        const levelRows = await this.db.select({
            painLevel: _schema.healthPain.painLevel,
            count: (0, _drizzleorm.sql)`COUNT(*)`.as('count')
        }).from(_schema.healthPain).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthPain, userId), (0, _drizzleorm.gte)(_schema.healthPain.startTime, start), (0, _drizzleorm.lt)(_schema.healthPain.startTime, end))).groupBy(_schema.healthPain.painLevel);
        const levelMap = {
            mild: 0,
            moderate: 0,
            severe: 0
        };
        for (const row of levelRows){
            levelMap[row.painLevel] = Number(row.count) || 0;
        }
        const levelDistribution = [
            {
                level: '轻度',
                count: levelMap.mild
            },
            {
                level: '中度',
                count: levelMap.moderate
            },
            {
                level: '重度',
                count: levelMap.severe
            }
        ].filter((x)=>x.count > 0);
        const dayKey = this.dateDay(_schema.healthPain.startTime);
        const dayRows = await this.db.select({
            date: dayKey.as('date')
        }).from(_schema.healthPain).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthPain, userId), (0, _drizzleorm.gte)(_schema.healthPain.startTime, start), (0, _drizzleorm.lt)(_schema.healthPain.startTime, end))).groupBy((0, _drizzleorm.sql)`date`);
        return {
            topSymptoms,
            levelDistribution,
            daysWithPain: dayRows.length
        };
    }
    async getWeeklyMedication(userId, start, end) {
        const rows = await this.db.select({
            medicineName: _schema.healthMedication.medicineName,
            count: (0, _drizzleorm.sql)`COUNT(*)`.as('count')
        }).from(_schema.healthMedication).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthMedication, userId), (0, _drizzleorm.gte)(_schema.healthMedication.takeTime, start), (0, _drizzleorm.lt)(_schema.healthMedication.takeTime, end))).groupBy(_schema.healthMedication.medicineName).orderBy((0, _drizzleorm.sql)`count DESC`);
        let totalDoses = 0;
        const medicines = [];
        for (const row of rows){
            const c = Number(row.count) || 0;
            totalDoses += c;
            medicines.push({
                name: row.medicineName,
                count: c
            });
        }
        return {
            totalDoses,
            onTimeRate: 100,
            medicines
        };
    }
    async getWeeklyPoop(userId, start, end) {
        const rows = await this.db.select({
            stoolType: _schema.healthPoop.stoolType,
            count: (0, _drizzleorm.sql)`COUNT(*)`.as('count')
        }).from(_schema.healthPoop).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthPoop, userId), (0, _drizzleorm.gte)(_schema.healthPoop.poopTime, start), (0, _drizzleorm.lt)(_schema.healthPoop.poopTime, end))).groupBy(_schema.healthPoop.stoolType);
        let totalCount = 0;
        const typeDistribution = [];
        for (const row of rows){
            const c = Number(row.count) || 0;
            totalCount += c;
            typeDistribution.push({
                type: row.stoolType,
                count: c
            });
        }
        return {
            totalCount,
            typeDistribution
        };
    }
    // ==================== Half-Year Monthly Stats ====================
    /**
   * 获取近6个月（含当前月）的月度统计，按月聚合8个健康维度。
   */ async getHalfYearDetailStats(userId, endMonthParam) {
        const cnOffsetMs = 8 * 60 * 60 * 1000;
        const now = new Date();
        const cnNow = new Date(now.getTime() + cnOffsetMs);
        let endYear;
        let endMonthIdx;
        if (endMonthParam) {
            const [y, m] = endMonthParam.split('-').map(Number);
            endYear = y;
            endMonthIdx = m - 1;
        } else {
            endYear = cnNow.getUTCFullYear();
            endMonthIdx = cnNow.getUTCMonth();
        }
        // 构建6个月份的信息（从最早月到最近月）
        const monthInfos = [];
        for(let i = 5; i >= 0; i -= 1){
            const d = new Date(Date.UTC(endYear, endMonthIdx - i, 1));
            const y = d.getUTCFullYear();
            const m = d.getUTCMonth();
            // 当月天数
            const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
            monthInfos.push({
                year: y,
                month: m,
                label: `${m + 1}月`,
                days: daysInMonth
            });
        }
        const months = monthInfos.map((m)=>m.label);
        // 范围起点：最早月的1号 00:00:00 +08:00
        const startMonth = monthInfos[0];
        const rangeStart = new Date(Date.UTC(startMonth.year, startMonth.month, 1) - cnOffsetMs);
        // 范围终点：当前月月末 23:59:59.999 +08:00 的下一刻（左闭右开）
        const endMonth = monthInfos[monthInfos.length - 1];
        const rangeEnd = new Date(Date.UTC(endMonth.year, endMonth.month + 1, 1) - cnOffsetMs);
        const startIso = rangeStart.toISOString();
        const endIso = rangeEnd.toISOString();
        // 8个维度并行查询
        const [sleepRows, moodRows, dietRows, medicationRows, poopRows, exerciseRows, painRows, waterRows, waterGoalRow] = await Promise.all([
            // ----- 睡眠：按月聚合每天的睡眠记录（按 wake_time 日期算）-----
            this.db.execute((0, _drizzleorm.sql)`
        SELECT
          to_char(
            date_trunc('month', ${_schema.healthSleep.wakeTime} AT TIME ZONE 'Asia/Shanghai'),
            'YYYY-MM'
          ) AS month_key,
          SUM(${_schema.healthSleep.durationMinutes})::int AS total_minutes,
          COUNT(DISTINCT date_trunc('day', ${_schema.healthSleep.wakeTime} AT TIME ZONE 'Asia/Shanghai'))::int AS record_days,
          SUM(CASE WHEN ${_schema.healthSleep.durationMinutes} >= 450 THEN 1 ELSE 0 END)::int AS good,
          SUM(CASE WHEN ${_schema.healthSleep.durationMinutes} >= 360 AND ${_schema.healthSleep.durationMinutes} < 450 THEN 1 ELSE 0 END)::int AS medium,
          SUM(CASE WHEN ${_schema.healthSleep.durationMinutes} < 360 THEN 1 ELSE 0 END)::int AS poor,
          SUM(CASE WHEN ${_schema.healthSleep.durationMinutes} >= 420 THEN 1 ELSE 0 END)::int AS meet_days
        FROM ${_schema.healthSleep}
        WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthSleep, userId), (0, _drizzleorm.gte)(_schema.healthSleep.wakeTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthSleep.wakeTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
        GROUP BY month_key
        ORDER BY month_key
      `),
            // ----- 情绪：按月计算分数与积极占比 -----
            this.db.execute((0, _drizzleorm.sql)`
        SELECT
          to_char(
            date_trunc('month', ${_schema.healthMood.recordTime} AT TIME ZONE 'Asia/Shanghai'),
            'YYYY-MM'
          ) AS month_key,
          COUNT(*)::int AS total_count,
          SUM(
            CASE
              WHEN moods && ARRAY[${_drizzleorm.sql.join(POSITIVE_MOODS.map((m)=>(0, _drizzleorm.sql)`${m}`), (0, _drizzleorm.sql)`, `)}]::text[] THEN 2
              WHEN moods && ARRAY[${_drizzleorm.sql.join(NEGATIVE_MOODS.map((m)=>(0, _drizzleorm.sql)`${m}`), (0, _drizzleorm.sql)`, `)}]::text[] THEN 0
              ELSE 1
            END
          )::numeric AS total_score,
          SUM(CASE WHEN moods && ARRAY[${_drizzleorm.sql.join(POSITIVE_MOODS.map((m)=>(0, _drizzleorm.sql)`${m}`), (0, _drizzleorm.sql)`, `)}]::text[] THEN 1 ELSE 0 END)::int AS positive_count
        FROM ${_schema.healthMood}
        WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthMood, userId), (0, _drizzleorm.gte)(_schema.healthMood.recordTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthMood.recordTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
        GROUP BY month_key
        ORDER BY month_key
      `),
            // ----- 饮食：按月统计外卖次数与总餐次 -----
            this.db.execute((0, _drizzleorm.sql)`
        SELECT
          to_char(
            date_trunc('month', COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt}) AT TIME ZONE 'Asia/Shanghai'),
            'YYYY-MM'
          ) AS month_key,
          COUNT(*)::int AS total_meals,
          SUM(CASE WHEN ${_schema.healthDiet.tags} @> ARRAY['外卖']::text[] THEN 1 ELSE 0 END)::int AS takeout_count
        FROM ${_schema.healthDiet}
        WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthDiet, userId), (0, _drizzleorm.sql)`COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt}) >= ${(0, _drizzleorm.sql)`${startIso}::timestamptz`}`, (0, _drizzleorm.sql)`COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt}) < ${(0, _drizzleorm.sql)`${endIso}::timestamptz`}`)}
        GROUP BY month_key
        ORDER BY month_key
      `),
            // ----- 用药：半年内所有药物名称+次数 -----
            this.db.select({
                medicineName: _schema.healthMedication.medicineName,
                count: (0, _drizzleorm.sql)`COUNT(*)`.as('count')
            }).from(_schema.healthMedication).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthMedication, userId), (0, _drizzleorm.gte)(_schema.healthMedication.takeTime, rangeStart), (0, _drizzleorm.lt)(_schema.healthMedication.takeTime, rangeEnd))).groupBy(_schema.healthMedication.medicineName).orderBy((0, _drizzleorm.sql)`count DESC`).limit(8),
            // ----- 排便：按月总次数、异常次数 -----
            this.db.execute((0, _drizzleorm.sql)`
        SELECT
          to_char(
            date_trunc('month', ${_schema.healthPoop.poopTime} AT TIME ZONE 'Asia/Shanghai'),
            'YYYY-MM'
          ) AS month_key,
          COUNT(*)::int AS total_count,
          SUM(CASE WHEN ${_schema.healthPoop.stoolType} NOT IN ('正常', 'normal') THEN 1 ELSE 0 END)::int AS abnormal_count
        FROM ${_schema.healthPoop}
        WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthPoop, userId), (0, _drizzleorm.gte)(_schema.healthPoop.poopTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthPoop.poopTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
        GROUP BY month_key
        ORDER BY month_key
      `),
            // ----- 运动：按月次数和总分钟 -----
            this.db.execute((0, _drizzleorm.sql)`
        SELECT
          to_char(
            date_trunc('month', ${_schema.healthExercise.startTime} AT TIME ZONE 'Asia/Shanghai'),
            'YYYY-MM'
          ) AS month_key,
          COUNT(*)::int AS session_count,
          COALESCE(SUM(${_schema.healthExercise.durationMinutes}), 0)::int AS total_minutes
        FROM ${_schema.healthExercise}
        WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthExercise, userId), (0, _drizzleorm.gte)(_schema.healthExercise.startTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthExercise.startTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
        GROUP BY month_key
        ORDER BY month_key
      `),
            // ----- 病痛：按月疼痛天数+重度天数+半年Top症状 -----
            Promise.all([
                this.db.execute((0, _drizzleorm.sql)`
          SELECT
            to_char(
              date_trunc('month', ${_schema.healthPain.startTime} AT TIME ZONE 'Asia/Shanghai'),
              'YYYY-MM'
            ) AS month_key,
            COUNT(DISTINCT date_trunc('day', ${_schema.healthPain.startTime} AT TIME ZONE 'Asia/Shanghai'))::int AS episode_days,
            COUNT(DISTINCT CASE WHEN ${_schema.healthPain.painLevel} = 'severe' THEN date_trunc('day', ${_schema.healthPain.startTime} AT TIME ZONE 'Asia/Shanghai') END)::int AS severe_days
          FROM ${_schema.healthPain}
          WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthPain, userId), (0, _drizzleorm.gte)(_schema.healthPain.startTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthPain.startTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
          GROUP BY month_key
          ORDER BY month_key
        `),
                this.db.execute((0, _drizzleorm.sql)`
          SELECT
            unnest(${_schema.healthPain.symptoms}) AS symptom,
            COUNT(*)::int AS count
          FROM ${_schema.healthPain}
          WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthPain, userId), (0, _drizzleorm.gte)(_schema.healthPain.startTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthPain.startTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
          GROUP BY symptom
          ORDER BY count DESC
          LIMIT 5
        `)
            ]),
            // ----- 喝水：按月总杯数和达标天数（按日汇总）-----
            this.db.execute((0, _drizzleorm.sql)`
        SELECT
          to_char(
            date_trunc('month', daily_water.drink_day),
            'YYYY-MM'
          ) AS month_key,
          SUM(daily_water.cups)::int AS total_cups,
          COUNT(*)::int AS record_days
        FROM (
          SELECT
            date_trunc('day', ${_schema.healthWater.drinkTime} AT TIME ZONE 'Asia/Shanghai') AS drink_day,
            COALESCE(ROUND(SUM(${_schema.healthWater.amountMl})::numeric / 250), 0) AS cups
          FROM ${_schema.healthWater}
          WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthWater, userId), (0, _drizzleorm.gte)(_schema.healthWater.drinkTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthWater.drinkTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
          GROUP BY drink_day
        ) AS daily_water
        GROUP BY month_key
        ORDER BY month_key
      `),
            // 喝水目标
            this.db.select({
                targetValue: _schema.healthGoals.targetValue
            }).from(_schema.healthGoals).where((0, _drizzleorm.and)((0, _drizzleorm.eq)(_schema.healthGoals.userId, userId), (0, _drizzleorm.eq)(_schema.healthGoals.goalType, 'water'), (0, _drizzleorm.eq)(_schema.healthGoals.isDeleted, false))).limit(1)
        ]);
        // 构造 month_key -> 索引 的映射
        const monthKeyToIdx = new Map();
        for(let i = 0; i < monthInfos.length; i += 1){
            const m = monthInfos[i];
            const key = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
            monthKeyToIdx.set(key, i);
        }
        // ----- 睡眠 ----- 
        const sleepAvgHours = new Array(6).fill(0);
        const sleepGood = new Array(6).fill(0);
        const sleepMedium = new Array(6).fill(0);
        const sleepPoor = new Array(6).fill(0);
        const sleepMeetRate = new Array(6).fill(0);
        for (const row of sleepRows){
            const idx = monthKeyToIdx.get(row.month_key);
            if (idx === undefined) continue;
            const totalMin = Number(row.total_minutes) || 0;
            const recordDays = Number(row.record_days) || 0;
            const good = Number(row.good) || 0;
            const medium = Number(row.medium) || 0;
            const poor = Number(row.poor) || 0;
            const meetDays = Number(row.meet_days) || 0;
            sleepAvgHours[idx] = recordDays > 0 ? Math.round(totalMin / recordDays / 60 * 10) / 10 : 0;
            sleepGood[idx] = good;
            sleepMedium[idx] = medium;
            sleepPoor[idx] = poor;
            sleepMeetRate[idx] = recordDays > 0 ? Math.round(meetDays / recordDays * 100) : 0;
        }
        let bestMonthIdx = 0;
        let bestHours = 0;
        for(let i = 0; i < 6; i += 1){
            if (sleepAvgHours[i] > bestHours) {
                bestHours = sleepAvgHours[i];
                bestMonthIdx = i;
            }
        }
        // ----- 情绪 -----
        const moodScore = new Array(6).fill(0);
        const moodPositiveRate = new Array(6).fill(0);
        for (const row of moodRows){
            const idx = monthKeyToIdx.get(row.month_key);
            if (idx === undefined) continue;
            const totalCount = Number(row.total_count) || 0;
            const totalScore = Number(row.total_score) || 0;
            const positiveCount = Number(row.positive_count) || 0;
            moodScore[idx] = totalCount > 0 ? Math.round(totalScore / totalCount * 100) / 100 : 0;
            moodPositiveRate[idx] = totalCount > 0 ? Math.round(positiveCount / totalCount * 100) : 0;
        }
        let peakMonthIdx = 0;
        let valleyMonthIdx = 0;
        let peakScore = moodScore[0];
        let valleyScore = moodScore[0];
        for(let i = 1; i < 6; i += 1){
            if (moodScore[i] > peakScore) {
                peakScore = moodScore[i];
                peakMonthIdx = i;
            }
            if (moodScore[i] < valleyScore) {
                valleyScore = moodScore[i];
                valleyMonthIdx = i;
            }
        }
        // ----- 饮食 -----
        const dietTakeoutCount = new Array(6).fill(0);
        const dietTotalMeals = new Array(6).fill(0);
        const dietTakeoutTrend = new Array(6).fill(0);
        for (const row of dietRows){
            const idx = monthKeyToIdx.get(row.month_key);
            if (idx === undefined) continue;
            const takeout = Number(row.takeout_count) || 0;
            const total = Number(row.total_meals) || 0;
            dietTakeoutCount[idx] = takeout;
            dietTotalMeals[idx] = total;
            dietTakeoutTrend[idx] = total > 0 ? Math.round(takeout / total * 100) : 0;
        }
        let dietPeakMonthIdx = 0;
        let dietPeakCount = dietTakeoutCount[0];
        for(let i = 1; i < 6; i += 1){
            if (dietTakeoutCount[i] > dietPeakCount) {
                dietPeakCount = dietTakeoutCount[i];
                dietPeakMonthIdx = i;
            }
        }
        // ----- 用药 -----
        let totalDoses = 0;
        const medicines = [];
        for (const row of medicationRows){
            const c = Number(row.count) || 0;
            totalDoses += c;
            medicines.push({
                name: row.medicineName,
                count: c
            });
        }
        // ----- 排便 -----
        const poopTotalCount = new Array(6).fill(0);
        const poopAbnormalCount = new Array(6).fill(0);
        const poopAvgDaily = new Array(6).fill(0);
        for (const row of poopRows){
            const idx = monthKeyToIdx.get(row.month_key);
            if (idx === undefined) continue;
            const total = Number(row.total_count) || 0;
            const abnormal = Number(row.abnormal_count) || 0;
            const days = monthInfos[idx].days;
            poopTotalCount[idx] = total;
            poopAbnormalCount[idx] = abnormal;
            poopAvgDaily[idx] = Math.round(total / days * 10) / 10;
        }
        let poopMaxMonthIdx = 0;
        let poopMaxCount = poopTotalCount[0];
        for(let i = 1; i < 6; i += 1){
            if (poopTotalCount[i] > poopMaxCount) {
                poopMaxCount = poopTotalCount[i];
                poopMaxMonthIdx = i;
            }
        }
        // ----- 运动 -----
        const exerciseSessionCount = new Array(6).fill(0);
        const exerciseTotalMinutes = new Array(6).fill(0);
        for (const row of exerciseRows){
            const idx = monthKeyToIdx.get(row.month_key);
            if (idx === undefined) continue;
            exerciseSessionCount[idx] = Number(row.session_count) || 0;
            exerciseTotalMinutes[idx] = Number(row.total_minutes) || 0;
        }
        let exercisePeakMonthIdx = 0;
        let exercisePeakCount = exerciseSessionCount[0];
        for(let i = 1; i < 6; i += 1){
            if (exerciseSessionCount[i] > exercisePeakCount) {
                exercisePeakCount = exerciseSessionCount[i];
                exercisePeakMonthIdx = i;
            }
        }
        // ----- 病痛 -----
        const [painMonthlyRows, painSymptomRows] = painRows;
        const painEpisodeDays = new Array(6).fill(0);
        const painSevereDays = new Array(6).fill(0);
        for (const row of painMonthlyRows){
            const idx = monthKeyToIdx.get(row.month_key);
            if (idx === undefined) continue;
            painEpisodeDays[idx] = Number(row.episode_days) || 0;
            painSevereDays[idx] = Number(row.severe_days) || 0;
        }
        let painPeakMonthIdx = 0;
        let painPeakDays = painEpisodeDays[0];
        for(let i = 1; i < 6; i += 1){
            if (painEpisodeDays[i] > painPeakDays) {
                painPeakDays = painEpisodeDays[i];
                painPeakMonthIdx = i;
            }
        }
        const topSymptoms = painSymptomRows.map((row)=>({
                symptom: row.symptom,
                count: Number(row.count) || 0
            }));
        // ----- 喝水 -----
        const targetCups = waterGoalRow.length > 0 ? Math.round(Number(waterGoalRow[0].targetValue) || 0) : 8;
        const waterTotalCups = new Array(6).fill(0);
        const waterAvgCups = new Array(6).fill(0);
        const waterMeetDays = new Array(6).fill(0);
        for (const row of waterRows){
            const idx = monthKeyToIdx.get(row.month_key);
            if (idx === undefined) continue;
            const total = Number(row.total_cups) || 0;
            const recordDays = Number(row.record_days) || 0;
            waterTotalCups[idx] = total;
            waterAvgCups[idx] = recordDays > 0 ? Math.round(total / recordDays * 10) / 10 : 0;
        // meetDays: 日均 >= 目标的天数（这里 record_days 是有记录的天数，按日汇总后达标天数需要再SQL层统计
        // 简化：record_days 里日均>=target 视为全月都达标，实际需要每日判断
        // 我们用 recordDays 作为基数，如果该月平均 >= target 就算 recordDays 天都达标是不准确的
        // 正确做法：需要在SQL子查询里按日判断后按月计数
        // 但当前SQL已经是按月汇总总杯数和记录天数，我们再做一个查询获取达标天数
        }
        // 补充查询：喝水按月达标天数（每日总杯数 >= targetCups 的天数）
        const waterMeetRows = await this.db.execute((0, _drizzleorm.sql)`
      SELECT
        to_char(
          date_trunc('month', daily_water.drink_day),
          'YYYY-MM'
        ) AS month_key,
        COUNT(*)::int AS meet_days
      FROM (
        SELECT
          date_trunc('day', ${_schema.healthWater.drinkTime} AT TIME ZONE 'Asia/Shanghai') AS drink_day,
          COALESCE(ROUND(SUM(${_schema.healthWater.amountMl})::numeric / 250), 0) AS cups
        FROM ${_schema.healthWater}
        WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthWater, userId), (0, _drizzleorm.gte)(_schema.healthWater.drinkTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthWater.drinkTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
        GROUP BY drink_day
        HAVING COALESCE(ROUND(SUM(${_schema.healthWater.amountMl})::numeric / 250), 0) >= ${targetCups}
      ) AS daily_water
      GROUP BY month_key
      ORDER BY month_key
    `);
        for (const row of waterMeetRows){
            const idx = monthKeyToIdx.get(row.month_key);
            if (idx === undefined) continue;
            waterMeetDays[idx] = Number(row.meet_days) || 0;
        }
        let waterBestMonthIdx = 0;
        let waterBestAvg = waterAvgCups[0];
        for(let i = 1; i < 6; i += 1){
            if (waterAvgCups[i] > waterBestAvg) {
                waterBestAvg = waterAvgCups[i];
                waterBestMonthIdx = i;
            }
        }
        this.logger.log(`Half-year monthly stats computed for user ${userId}`);
        return {
            months,
            sleep: {
                avgHours: sleepAvgHours,
                good: sleepGood,
                medium: sleepMedium,
                poor: sleepPoor,
                bestMonthIdx,
                bestHours,
                targetHours: 7,
                meetRate: sleepMeetRate
            },
            mood: {
                score: moodScore,
                positiveRate: moodPositiveRate,
                peakMonthIdx,
                valleyMonthIdx,
                peakScore,
                valleyScore
            },
            diet: {
                takeoutCount: dietTakeoutCount,
                takeoutTrend: dietTakeoutTrend,
                peakMonthIdx: dietPeakMonthIdx,
                peakCount: dietPeakCount,
                totalMeals: dietTotalMeals
            },
            medication: {
                medicines,
                totalDoses,
                onTimeRate: 100
            },
            poop: {
                totalCount: poopTotalCount,
                abnormalCount: poopAbnormalCount,
                avgDaily: poopAvgDaily,
                maxMonthIdx: poopMaxMonthIdx,
                maxCount: poopMaxCount
            },
            exercise: {
                sessionCount: exerciseSessionCount,
                totalMinutes: exerciseTotalMinutes,
                peakMonthIdx: exercisePeakMonthIdx,
                peakCount: exercisePeakCount
            },
            pain: {
                episodeDays: painEpisodeDays,
                severeDays: painSevereDays,
                peakMonthIdx: painPeakMonthIdx,
                peakDays: painPeakDays,
                topSymptoms
            },
            water: {
                totalCups: waterTotalCups,
                avgCups: waterAvgCups,
                targetCups,
                meetDays: waterMeetDays,
                bestMonthIdx: waterBestMonthIdx,
                bestAvg: waterBestAvg
            }
        };
    }
    // ==================== Yearly Detail Stats ====================
    /**
   * 获取指定自然年（12个月）的月度统计，按月聚合健康数据。
   */ async getYearDetailStats(year, userId) {
        const months = Array.from({
            length: 12
        }, (_, i)=>`${i + 1}月`);
        const emptyResult = {
            months,
            totalRecords: 0,
            recordDays: 0,
            dimensionCount: 0,
            sleep: {
                avgHours: new Array(12).fill(0),
                bestMonthIdx: 0,
                bestHours: 0,
                worstMonthIdx: 0,
                worstHours: 0
            },
            mood: {
                score: new Array(12).fill(0),
                positiveRate: new Array(12).fill(0),
                peakMonthIdx: 0,
                valleyMonthIdx: 0,
                topMood: '',
                topMoodCount: 0,
                negativePeakMonthIdx: 0,
                negativePeakCount: 0
            },
            diet: {
                takeoutCount: new Array(12).fill(0),
                totalMeals: new Array(12).fill(0),
                takeoutPeakMonthIdx: 0,
                takeoutPeakCount: 0,
                yearTotalMeals: 0,
                yearTakeoutCount: 0,
                mostCommonMealType: '',
                mostCommonMealTypeCount: 0
            },
            exercise: {
                sessionCount: new Array(12).fill(0),
                totalMinutes: new Array(12).fill(0),
                peakMonthIdx: 0,
                peakCount: 0,
                yearTotalMinutes: 0
            },
            pain: {
                episodeCount: new Array(12).fill(0),
                peakMonthIdx: 0,
                peakCount: 0,
                topSymptoms: []
            },
            water: {
                avgMl: new Array(12).fill(0),
                avgCups: new Array(12).fill(0),
                yearTotalMl: 0,
                bestMonthIdx: 0,
                bestAvgMl: 0
            },
            keywords: []
        };
        try {
            const cnOffsetMs = 8 * 60 * 60 * 1000;
            // 构建12个月份的信息
            const monthInfos = [];
            for(let m = 0; m < 12; m += 1){
                const d = new Date(Date.UTC(year, m, 1));
                const y = d.getUTCFullYear();
                const mo = d.getUTCMonth();
                const daysInMonth = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
                monthInfos.push({
                    year: y,
                    month: mo,
                    label: `${mo + 1}月`,
                    days: daysInMonth
                });
            }
            const months = monthInfos.map((m)=>m.label);
            // 范围：1月1日 00:00:00 +08:00 到 次年1月1日 00:00:00 +08:00（左闭右开）
            const rangeStart = new Date(Date.UTC(year, 0, 1) - cnOffsetMs);
            const rangeEnd = new Date(Date.UTC(year + 1, 0, 1) - cnOffsetMs);
            const startIso = rangeStart.toISOString();
            const endIso = rangeEnd.toISOString();
            const monthKeyToIdx = new Map();
            for(let i = 0; i < monthInfos.length; i += 1){
                const m = monthInfos[i];
                const key = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
                monthKeyToIdx.set(key, i);
            }
            // 各维度并行查询
            const [sleepRows, moodRows, moodTopRows, moodNegativeRows, dietRows, exerciseRows, painRows, painSymptomRows, waterRows, moodCountRow, dietCountRow, medicationCountRow, poopCountRow, sleepCountRow, waterCountRow, painCountRow, exerciseCountRow, recordDaysRow, // keywords
            kwMoodRows, kwDietRows, kwPainRows, kwExerciseRows, kwMedicationRows] = await Promise.all([
                // ----- 睡眠：按月聚合 ----- 
                this.db.execute((0, _drizzleorm.sql)`
        SELECT
          to_char(
            date_trunc('month', ${_schema.healthSleep.wakeTime} AT TIME ZONE 'Asia/Shanghai'),
            'YYYY-MM'
          ) AS month_key,
          SUM(${_schema.healthSleep.durationMinutes})::int AS total_minutes,
          COUNT(DISTINCT date_trunc('day', ${_schema.healthSleep.wakeTime} AT TIME ZONE 'Asia/Shanghai'))::int AS record_days
        FROM ${_schema.healthSleep}
        WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthSleep, userId), (0, _drizzleorm.gte)(_schema.healthSleep.wakeTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthSleep.wakeTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
        GROUP BY month_key
        ORDER BY month_key
      `),
                // ----- 情绪：按月分数与积极占比 -----
                this.db.execute((0, _drizzleorm.sql)`
        SELECT
          to_char(
            date_trunc('month', ${_schema.healthMood.recordTime} AT TIME ZONE 'Asia/Shanghai'),
            'YYYY-MM'
          ) AS month_key,
          COUNT(*)::int AS total_count,
          SUM(
            CASE
              WHEN moods && ARRAY[${_drizzleorm.sql.join(POSITIVE_MOODS.map((m)=>(0, _drizzleorm.sql)`${m}`), (0, _drizzleorm.sql)`, `)}]::text[] THEN 2
              WHEN moods && ARRAY[${_drizzleorm.sql.join(NEGATIVE_MOODS.map((m)=>(0, _drizzleorm.sql)`${m}`), (0, _drizzleorm.sql)`, `)}]::text[] THEN 0
              ELSE 1
            END
          )::numeric AS total_score,
          SUM(CASE WHEN moods && ARRAY[${_drizzleorm.sql.join(POSITIVE_MOODS.map((m)=>(0, _drizzleorm.sql)`${m}`), (0, _drizzleorm.sql)`, `)}]::text[] THEN 1 ELSE 0 END)::int AS positive_count
        FROM ${_schema.healthMood}
        WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthMood, userId), (0, _drizzleorm.gte)(_schema.healthMood.recordTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthMood.recordTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
        GROUP BY month_key
        ORDER BY month_key
      `),
                // 情绪：全年出现最多的情绪
                this.db.execute((0, _drizzleorm.sql)`
        SELECT
          unnest(${_schema.healthMood.moods}) AS mood,
          COUNT(*)::int AS count
        FROM ${_schema.healthMood}
        WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthMood, userId), (0, _drizzleorm.gte)(_schema.healthMood.recordTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthMood.recordTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
        GROUP BY mood
        ORDER BY count DESC
        LIMIT 1
      `),
                // 情绪：按月负面情绪次数
                this.db.execute((0, _drizzleorm.sql)`
        SELECT
          to_char(
            date_trunc('month', ${_schema.healthMood.recordTime} AT TIME ZONE 'Asia/Shanghai'),
            'YYYY-MM'
          ) AS month_key,
          COUNT(*)::int AS negative_count
        FROM ${_schema.healthMood}
        WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthMood, userId), (0, _drizzleorm.gte)(_schema.healthMood.recordTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthMood.recordTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`), (0, _drizzleorm.sql)`moods && ARRAY[${_drizzleorm.sql.join(NEGATIVE_MOODS.map((m)=>(0, _drizzleorm.sql)`${m}`), (0, _drizzleorm.sql)`, `)}]::text[]`)}
        GROUP BY month_key
        ORDER BY month_key
      `),
                // ----- 饮食：按月外卖与总餐次 -----
                this.db.execute((0, _drizzleorm.sql)`
        SELECT
          to_char(
            date_trunc('month', COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt}) AT TIME ZONE 'Asia/Shanghai'),
            'YYYY-MM'
          ) AS month_key,
          COUNT(*)::int AS total_meals,
          SUM(CASE WHEN ${_schema.healthDiet.tags} @> ARRAY['外卖']::text[] THEN 1 ELSE 0 END)::int AS takeout_count
        FROM ${_schema.healthDiet}
        WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthDiet, userId), (0, _drizzleorm.sql)`COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt}) >= ${(0, _drizzleorm.sql)`${startIso}::timestamptz`}`, (0, _drizzleorm.sql)`COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt}) < ${(0, _drizzleorm.sql)`${endIso}::timestamptz`}`)}
        GROUP BY month_key
        ORDER BY month_key
      `),
                // ----- 运动：按月次数和总分钟 -----
                this.db.execute((0, _drizzleorm.sql)`
        SELECT
          to_char(
            date_trunc('month', ${_schema.healthExercise.startTime} AT TIME ZONE 'Asia/Shanghai'),
            'YYYY-MM'
          ) AS month_key,
          COUNT(*)::int AS session_count,
          COALESCE(SUM(${_schema.healthExercise.durationMinutes}), 0)::int AS total_minutes
        FROM ${_schema.healthExercise}
        WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthExercise, userId), (0, _drizzleorm.gte)(_schema.healthExercise.startTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthExercise.startTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
        GROUP BY month_key
        ORDER BY month_key
      `),
                // ----- 病痛：按月发作次数 -----
                this.db.execute((0, _drizzleorm.sql)`
        SELECT
          to_char(
            date_trunc('month', ${_schema.healthPain.startTime} AT TIME ZONE 'Asia/Shanghai'),
            'YYYY-MM'
          ) AS month_key,
          COUNT(*)::int AS episode_count
        FROM ${_schema.healthPain}
        WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthPain, userId), (0, _drizzleorm.gte)(_schema.healthPain.startTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthPain.startTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
        GROUP BY month_key
        ORDER BY month_key
      `),
                // 病痛：全年Top症状
                this.db.execute((0, _drizzleorm.sql)`
        SELECT
          unnest(${_schema.healthPain.symptoms}) AS symptom,
          COUNT(*)::int AS count
        FROM ${_schema.healthPain}
        WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthPain, userId), (0, _drizzleorm.gte)(_schema.healthPain.startTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthPain.startTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
        GROUP BY symptom
        ORDER BY count DESC
        LIMIT 10
      `),
                // ----- 喝水：按月日均ml和杯数 -----
                this.db.execute((0, _drizzleorm.sql)`
        SELECT
          to_char(
            date_trunc('month', daily_water.drink_day),
            'YYYY-MM'
          ) AS month_key,
          SUM(daily_water.total_ml)::int AS total_ml,
          SUM(daily_water.cups)::int AS total_cups,
          COUNT(*)::int AS record_days
        FROM (
          SELECT
            date_trunc('day', ${_schema.healthWater.drinkTime} AT TIME ZONE 'Asia/Shanghai') AS drink_day,
            COALESCE(SUM(${_schema.healthWater.amountMl}), 0) AS total_ml,
            COALESCE(ROUND(SUM(${_schema.healthWater.amountMl})::numeric / 250), 0) AS cups
          FROM ${_schema.healthWater}
          WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthWater, userId), (0, _drizzleorm.gte)(_schema.healthWater.drinkTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthWater.drinkTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
          GROUP BY drink_day
        ) AS daily_water
        GROUP BY month_key
        ORDER BY month_key
      `),
                // 各维度总记录数（用于 totalRecords 和 dimensionCount）
                this.db.select({
                    count: (0, _drizzleorm.sql)`COUNT(*)`.as('count')
                }).from(_schema.healthMood).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthMood, userId), (0, _drizzleorm.gte)(_schema.healthMood.recordTime, rangeStart), (0, _drizzleorm.lt)(_schema.healthMood.recordTime, rangeEnd))),
                this.db.select({
                    count: (0, _drizzleorm.sql)`COUNT(*)`.as('count')
                }).from(_schema.healthDiet).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthDiet, userId), (0, _drizzleorm.sql)`COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt}) >= ${rangeStart.toISOString()}::timestamptz`, (0, _drizzleorm.sql)`COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt}) < ${rangeEnd.toISOString()}::timestamptz`)),
                this.db.select({
                    count: (0, _drizzleorm.sql)`COUNT(*)`.as('count')
                }).from(_schema.healthMedication).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthMedication, userId), (0, _drizzleorm.gte)(_schema.healthMedication.takeTime, rangeStart), (0, _drizzleorm.lt)(_schema.healthMedication.takeTime, rangeEnd))),
                this.db.select({
                    count: (0, _drizzleorm.sql)`COUNT(*)`.as('count')
                }).from(_schema.healthPoop).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthPoop, userId), (0, _drizzleorm.gte)(_schema.healthPoop.poopTime, rangeStart), (0, _drizzleorm.lt)(_schema.healthPoop.poopTime, rangeEnd))),
                this.db.select({
                    count: (0, _drizzleorm.sql)`COUNT(*)`.as('count')
                }).from(_schema.healthSleep).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthSleep, userId), (0, _drizzleorm.gte)(_schema.healthSleep.wakeTime, rangeStart), (0, _drizzleorm.lt)(_schema.healthSleep.wakeTime, rangeEnd))),
                this.db.select({
                    count: (0, _drizzleorm.sql)`COUNT(*)`.as('count')
                }).from(_schema.healthWater).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthWater, userId), (0, _drizzleorm.gte)(_schema.healthWater.drinkTime, rangeStart), (0, _drizzleorm.lt)(_schema.healthWater.drinkTime, rangeEnd))),
                this.db.select({
                    count: (0, _drizzleorm.sql)`COUNT(*)`.as('count')
                }).from(_schema.healthPain).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthPain, userId), (0, _drizzleorm.gte)(_schema.healthPain.startTime, rangeStart), (0, _drizzleorm.lt)(_schema.healthPain.startTime, rangeEnd))),
                this.db.select({
                    count: (0, _drizzleorm.sql)`COUNT(*)`.as('count')
                }).from(_schema.healthExercise).where((0, _drizzleorm.and)(this.baseFilter(_schema.healthExercise, userId), (0, _drizzleorm.gte)(_schema.healthExercise.startTime, rangeStart), (0, _drizzleorm.lt)(_schema.healthExercise.startTime, rangeEnd))),
                // recordDays: 所有维度日期去重后的天数
                this.db.execute((0, _drizzleorm.sql)`
        SELECT COUNT(DISTINCT d)::int AS record_days
        FROM (
          SELECT date_trunc('day', ${_schema.healthSleep.wakeTime} AT TIME ZONE 'Asia/Shanghai') AS d
          FROM ${_schema.healthSleep}
          WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthSleep, userId), (0, _drizzleorm.gte)(_schema.healthSleep.wakeTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthSleep.wakeTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
          UNION
          SELECT date_trunc('day', ${_schema.healthMood.recordTime} AT TIME ZONE 'Asia/Shanghai') AS d
          FROM ${_schema.healthMood}
          WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthMood, userId), (0, _drizzleorm.gte)(_schema.healthMood.recordTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthMood.recordTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
          UNION
          SELECT date_trunc('day', COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt}) AT TIME ZONE 'Asia/Shanghai') AS d
          FROM ${_schema.healthDiet}
          WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthDiet, userId), (0, _drizzleorm.sql)`COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt}) >= ${(0, _drizzleorm.sql)`${startIso}::timestamptz`}`, (0, _drizzleorm.sql)`COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt}) < ${(0, _drizzleorm.sql)`${endIso}::timestamptz`}`)}
          UNION
          SELECT date_trunc('day', ${_schema.healthExercise.startTime} AT TIME ZONE 'Asia/Shanghai') AS d
          FROM ${_schema.healthExercise}
          WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthExercise, userId), (0, _drizzleorm.gte)(_schema.healthExercise.startTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthExercise.startTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
          UNION
          SELECT date_trunc('day', ${_schema.healthPain.startTime} AT TIME ZONE 'Asia/Shanghai') AS d
          FROM ${_schema.healthPain}
          WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthPain, userId), (0, _drizzleorm.gte)(_schema.healthPain.startTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthPain.startTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
          UNION
          SELECT date_trunc('day', ${_schema.healthWater.drinkTime} AT TIME ZONE 'Asia/Shanghai') AS d
          FROM ${_schema.healthWater}
          WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthWater, userId), (0, _drizzleorm.gte)(_schema.healthWater.drinkTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthWater.drinkTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
          UNION
          SELECT date_trunc('day', ${_schema.healthMedication.takeTime} AT TIME ZONE 'Asia/Shanghai') AS d
          FROM ${_schema.healthMedication}
          WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthMedication, userId), (0, _drizzleorm.gte)(_schema.healthMedication.takeTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthMedication.takeTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
          UNION
          SELECT date_trunc('day', ${_schema.healthPoop.poopTime} AT TIME ZONE 'Asia/Shanghai') AS d
          FROM ${_schema.healthPoop}
          WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthPoop, userId), (0, _drizzleorm.gte)(_schema.healthPoop.poopTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthPoop.poopTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
        ) AS all_dates
      `),
                // keywords: 情绪
                this.db.execute((0, _drizzleorm.sql)`
        SELECT unnest(${_schema.healthMood.moods}) AS word, COUNT(*)::int AS count
        FROM ${_schema.healthMood}
        WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthMood, userId), (0, _drizzleorm.gte)(_schema.healthMood.recordTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthMood.recordTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
        GROUP BY word
        ORDER BY count DESC
        LIMIT 8
      `),
                // keywords: 饮食
                this.db.execute((0, _drizzleorm.sql)`
        SELECT unnest(${_schema.healthDiet.tags}) AS word, COUNT(*)::int AS count
        FROM ${_schema.healthDiet}
        WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthDiet, userId), (0, _drizzleorm.sql)`COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt}) >= ${(0, _drizzleorm.sql)`${startIso}::timestamptz`}`, (0, _drizzleorm.sql)`COALESCE(${_schema.healthDiet.eatTime}, ${_schema.healthDiet.createdAt}) < ${(0, _drizzleorm.sql)`${endIso}::timestamptz`}`)}
        GROUP BY word
        ORDER BY count DESC
        LIMIT 8
      `),
                // keywords: 疼痛
                this.db.execute((0, _drizzleorm.sql)`
        SELECT unnest(${_schema.healthPain.symptoms}) AS word, COUNT(*)::int AS count
        FROM ${_schema.healthPain}
        WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthPain, userId), (0, _drizzleorm.gte)(_schema.healthPain.startTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthPain.startTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
        GROUP BY word
        ORDER BY count DESC
        LIMIT 8
      `),
                // keywords: 运动
                this.db.execute((0, _drizzleorm.sql)`
        SELECT ${_schema.healthExercise.exerciseType} AS word, COUNT(*)::int AS count
        FROM ${_schema.healthExercise}
        WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthExercise, userId), (0, _drizzleorm.gte)(_schema.healthExercise.startTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthExercise.startTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
        GROUP BY word
        ORDER BY count DESC
        LIMIT 8
      `),
                // keywords: 用药
                this.db.execute((0, _drizzleorm.sql)`
        SELECT ${_schema.healthMedication.medicineName} AS word, COUNT(*)::int AS count
        FROM ${_schema.healthMedication}
        WHERE ${(0, _drizzleorm.and)(this.baseFilter(_schema.healthMedication, userId), (0, _drizzleorm.gte)(_schema.healthMedication.takeTime, (0, _drizzleorm.sql)`${startIso}::timestamptz`), (0, _drizzleorm.lt)(_schema.healthMedication.takeTime, (0, _drizzleorm.sql)`${endIso}::timestamptz`))}
        GROUP BY word
        ORDER BY count DESC
        LIMIT 8
      `)
            ]);
            // ----- 睡眠 -----
            const sleepAvgHours = new Array(12).fill(0);
            for (const row of sleepRows){
                const idx = monthKeyToIdx.get(row.month_key);
                if (idx === undefined) continue;
                const totalMin = Number(row.total_minutes) || 0;
                const recordDays = Number(row.record_days) || 0;
                sleepAvgHours[idx] = recordDays > 0 ? Math.round(totalMin / recordDays / 60 * 10) / 10 : 0;
            }
            let sleepBestMonthIdx = 0;
            let sleepBestHours = sleepAvgHours[0];
            let sleepWorstMonthIdx = 0;
            let sleepWorstHours = sleepAvgHours[0];
            for(let i = 1; i < 12; i += 1){
                if (sleepAvgHours[i] > sleepBestHours) {
                    sleepBestHours = sleepAvgHours[i];
                    sleepBestMonthIdx = i;
                }
                if (sleepAvgHours[i] < sleepWorstHours) {
                    sleepWorstHours = sleepAvgHours[i];
                    sleepWorstMonthIdx = i;
                }
            }
            // ----- 情绪 -----
            const moodScore = new Array(12).fill(0);
            const moodPositiveRate = new Array(12).fill(0);
            for (const row of moodRows){
                const idx = monthKeyToIdx.get(row.month_key);
                if (idx === undefined) continue;
                const totalCount = Number(row.total_count) || 0;
                const totalScore = Number(row.total_score) || 0;
                const positiveCount = Number(row.positive_count) || 0;
                moodScore[idx] = totalCount > 0 ? Math.round(totalScore / totalCount * 100) / 100 : 0;
                moodPositiveRate[idx] = totalCount > 0 ? Math.round(positiveCount / totalCount * 100) : 0;
            }
            let moodPeakMonthIdx = 0;
            let moodValleyMonthIdx = 0;
            let peakScore = moodScore[0];
            let valleyScore = moodScore[0];
            for(let i = 1; i < 12; i += 1){
                if (moodScore[i] > peakScore) {
                    peakScore = moodScore[i];
                    moodPeakMonthIdx = i;
                }
                if (moodScore[i] < valleyScore) {
                    valleyScore = moodScore[i];
                    moodValleyMonthIdx = i;
                }
            }
            // 全年出现最多的情绪
            const topMood = moodTopRows && moodTopRows.length > 0 ? moodTopRows[0].mood || '' : '';
            const topMoodCount = moodTopRows && moodTopRows.length > 0 ? Number(moodTopRows[0].count) || 0 : 0;
            // 负面情绪峰值月
            const moodNegativeCount = new Array(12).fill(0);
            for (const row of moodNegativeRows){
                const idx = monthKeyToIdx.get(row.month_key);
                if (idx === undefined) continue;
                moodNegativeCount[idx] = Number(row.negative_count) || 0;
            }
            let negativePeakMonthIdx = 0;
            let negativePeakCount = moodNegativeCount[0];
            for(let i = 1; i < 12; i += 1){
                if (moodNegativeCount[i] > negativePeakCount) {
                    negativePeakCount = moodNegativeCount[i];
                    negativePeakMonthIdx = i;
                }
            }
            // ----- 饮食 -----
            const dietTakeoutCount = new Array(12).fill(0);
            const dietTotalMeals = new Array(12).fill(0);
            for (const row of dietRows){
                const idx = monthKeyToIdx.get(row.month_key);
                if (idx === undefined) continue;
                dietTakeoutCount[idx] = Number(row.takeout_count) || 0;
                dietTotalMeals[idx] = Number(row.total_meals) || 0;
            }
            let takeoutPeakMonthIdx = 0;
            let takeoutPeakCount = dietTakeoutCount[0];
            for(let i = 1; i < 12; i += 1){
                if (dietTakeoutCount[i] > takeoutPeakCount) {
                    takeoutPeakCount = dietTakeoutCount[i];
                    takeoutPeakMonthIdx = i;
                }
            }
            const yearTotalMeals = dietTotalMeals.reduce((s, v)=>s + v, 0);
            const yearTakeoutCount = dietTakeoutCount.reduce((s, v)=>s + v, 0);
            let mostCommonMealType = '';
            let mostCommonMealTypeCount = 0;
            for (const row of kwDietRows){
                const word = String(row.word || '');
                const count = Number(row.count) || 0;
                if (!word) continue;
                if (count > mostCommonMealTypeCount) {
                    mostCommonMealType = word;
                    mostCommonMealTypeCount = count;
                }
            }
            // ----- 运动 -----
            const exerciseSessionCount = new Array(12).fill(0);
            const exerciseTotalMinutes = new Array(12).fill(0);
            let yearTotalMinutes = 0;
            for (const row of exerciseRows){
                const idx = monthKeyToIdx.get(row.month_key);
                if (idx === undefined) continue;
                const sc = Number(row.session_count) || 0;
                const tm = Number(row.total_minutes) || 0;
                exerciseSessionCount[idx] = sc;
                exerciseTotalMinutes[idx] = tm;
                yearTotalMinutes += tm;
            }
            let exercisePeakMonthIdx = 0;
            let exercisePeakCount = exerciseSessionCount[0];
            for(let i = 1; i < 12; i += 1){
                if (exerciseSessionCount[i] > exercisePeakCount) {
                    exercisePeakCount = exerciseSessionCount[i];
                    exercisePeakMonthIdx = i;
                }
            }
            // ----- 病痛 -----
            const painEpisodeCount = new Array(12).fill(0);
            for (const row of painRows){
                const idx = monthKeyToIdx.get(row.month_key);
                if (idx === undefined) continue;
                painEpisodeCount[idx] = Number(row.episode_count) || 0;
            }
            let painPeakMonthIdx = 0;
            let painPeakCount = painEpisodeCount[0];
            for(let i = 1; i < 12; i += 1){
                if (painEpisodeCount[i] > painPeakCount) {
                    painPeakCount = painEpisodeCount[i];
                    painPeakMonthIdx = i;
                }
            }
            const topSymptoms = painSymptomRows.map((row)=>({
                    symptom: row.symptom,
                    count: Number(row.count) || 0
                }));
            // ----- 喝水 -----
            const waterAvgMl = new Array(12).fill(0);
            const waterAvgCups = new Array(12).fill(0);
            let yearTotalMl = 0;
            for (const row of waterRows){
                const idx = monthKeyToIdx.get(row.month_key);
                if (idx === undefined) continue;
                const totalMl = Number(row.total_ml) || 0;
                const totalCups = Number(row.total_cups) || 0;
                const recordDays = Number(row.record_days) || 0;
                yearTotalMl += totalMl;
                waterAvgMl[idx] = recordDays > 0 ? Math.round(totalMl / recordDays) : 0;
                waterAvgCups[idx] = recordDays > 0 ? Math.round(totalCups / recordDays * 10) / 10 : 0;
            }
            let waterBestMonthIdx = 0;
            let waterBestAvgMl = waterAvgMl[0];
            for(let i = 1; i < 12; i += 1){
                if (waterAvgMl[i] > waterBestAvgMl) {
                    waterBestAvgMl = waterAvgMl[i];
                    waterBestMonthIdx = i;
                }
            }
            // ----- totalRecords & dimensionCount -----
            const dimCounts = [
                Number(sleepCountRow[0]?.count) || 0,
                Number(moodCountRow[0]?.count) || 0,
                Number(painCountRow[0]?.count) || 0,
                Number(dietCountRow[0]?.count) || 0,
                Number(exerciseCountRow[0]?.count) || 0,
                Number(waterCountRow[0]?.count) || 0,
                Number(medicationCountRow[0]?.count) || 0,
                Number(poopCountRow[0]?.count) || 0
            ];
            const totalRecords = dimCounts.reduce((sum, c)=>sum + c, 0);
            const dimensionCount = dimCounts.filter((c)=>c > 0).length;
            // ----- recordDays -----
            const recordDays = Number(recordDaysRow[0]?.record_days) || 0;
            // ----- keywords -----
            const keywordMap = new Map();
            const addKeywords = (rows, category)=>{
                for (const row of rows){
                    const word = row.word;
                    if (!word) continue;
                    const count = Number(row.count) || 0;
                    const existing = keywordMap.get(word);
                    if (existing) {
                        if (count > existing.count) {
                            existing.count = count;
                            existing.category = category;
                        }
                    } else {
                        keywordMap.set(word, {
                            word,
                            count,
                            category
                        });
                    }
                }
            };
            addKeywords(kwMoodRows, 'mood');
            addKeywords(kwDietRows, 'diet');
            addKeywords(kwPainRows, 'pain');
            addKeywords(kwExerciseRows, 'exercise');
            addKeywords(kwMedicationRows, 'medication');
            const keywords = Array.from(keywordMap.values()).sort((a, b)=>b.count - a.count).slice(0, 15);
            this.logger.log(`Yearly detail stats computed for user ${userId}, year ${year}`);
            return {
                months,
                totalRecords,
                recordDays,
                dimensionCount,
                sleep: {
                    avgHours: sleepAvgHours,
                    bestMonthIdx: sleepBestMonthIdx,
                    bestHours: sleepBestHours,
                    worstMonthIdx: sleepWorstMonthIdx,
                    worstHours: sleepWorstHours
                },
                mood: {
                    score: moodScore,
                    positiveRate: moodPositiveRate,
                    peakMonthIdx: moodPeakMonthIdx,
                    valleyMonthIdx: moodValleyMonthIdx,
                    topMood,
                    topMoodCount,
                    negativePeakMonthIdx,
                    negativePeakCount
                },
                diet: {
                    takeoutCount: dietTakeoutCount,
                    totalMeals: dietTotalMeals,
                    takeoutPeakMonthIdx,
                    takeoutPeakCount,
                    yearTotalMeals,
                    yearTakeoutCount,
                    mostCommonMealType,
                    mostCommonMealTypeCount
                },
                exercise: {
                    sessionCount: exerciseSessionCount,
                    totalMinutes: exerciseTotalMinutes,
                    peakMonthIdx: exercisePeakMonthIdx,
                    peakCount: exercisePeakCount,
                    yearTotalMinutes
                },
                pain: {
                    episodeCount: painEpisodeCount,
                    peakMonthIdx: painPeakMonthIdx,
                    peakCount: painPeakCount,
                    topSymptoms
                },
                water: {
                    avgMl: waterAvgMl,
                    avgCups: waterAvgCups,
                    yearTotalMl,
                    bestMonthIdx: waterBestMonthIdx,
                    bestAvgMl: waterBestAvgMl
                },
                keywords
            };
        } catch (err) {
            this.logger.error(`[stats-year] getYearDetailStats failed: ${err instanceof Error ? err.message : String(err)}`);
            return emptyResult;
        }
    }
    constructor(db){
        this.db = db;
        this.logger = new _common.Logger(HealthStatsService.name);
    }
};
HealthStatsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_fullstacknestjscore.DRIZZLE_DATABASE)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof PostgresJsDatabase === "undefined" ? Object : PostgresJsDatabase
    ])
], HealthStatsService);
