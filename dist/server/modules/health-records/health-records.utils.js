"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get TYPE_LABELS () {
        return TYPE_LABELS;
    },
    get calcDurationMinutes () {
        return calcDurationMinutes;
    },
    get getDayRange () {
        return getDayRange;
    },
    get getLastNDateStrings () {
        return getLastNDateStrings;
    },
    get getTodayRange () {
        return getTodayRange;
    },
    get mapDiet () {
        return mapDiet;
    },
    get mapExercise () {
        return mapExercise;
    },
    get mapMedication () {
        return mapMedication;
    },
    get mapMood () {
        return mapMood;
    },
    get mapPain () {
        return mapPain;
    },
    get mapPoop () {
        return mapPoop;
    },
    get mapSleep () {
        return mapSleep;
    },
    get mapWater () {
        return mapWater;
    },
    get summarizeDiet () {
        return summarizeDiet;
    },
    get summarizeExercise () {
        return summarizeExercise;
    },
    get summarizeMedication () {
        return summarizeMedication;
    },
    get summarizeMood () {
        return summarizeMood;
    },
    get summarizePain () {
        return summarizePain;
    },
    get summarizePoop () {
        return summarizePoop;
    },
    get summarizeSleep () {
        return summarizeSleep;
    },
    get summarizeWater () {
        return summarizeWater;
    }
});
const TYPE_LABELS = {
    sleep: '睡眠',
    mood: '情绪',
    pain: '病痛',
    diet: '饮食',
    exercise: '运动',
    water: '喝水',
    medication: '用药',
    poop: '排便'
};
function getTodayRange() {
    const now = new Date();
    const cnOffsetMs = 8 * 60 * 60 * 1000;
    const cnNow = new Date(now.getTime() + cnOffsetMs);
    const cnDateStr = cnNow.toISOString().slice(0, 10);
    const start = new Date(`${cnDateStr}T00:00:00+08:00`);
    const end = new Date(`${cnDateStr}T23:59:59.999+08:00`);
    return {
        start,
        end
    };
}
function getDayRange(dateStr) {
    const start = new Date(`${dateStr}T00:00:00+08:00`);
    const end = new Date(`${dateStr}T23:59:59.999+08:00`);
    return {
        start,
        end
    };
}
function getLastNDateStrings(n) {
    const result = [];
    const cnOffsetMs = 8 * 60 * 60 * 1000;
    const now = new Date();
    for(let i = 0; i < n; i += 1){
        const d = new Date(now.getTime() + cnOffsetMs - i * 86400000);
        result.push(d.toISOString().slice(0, 10));
    }
    return result;
}
function calcDurationMinutes(start, end) {
    return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}
function mapSleep(row) {
    return {
        id: row.id,
        sleepTime: row.sleepTime.toISOString(),
        wakeTime: row.wakeTime.toISOString(),
        durationMinutes: row.durationMinutes,
        note: row.note ?? '',
        createdAt: row.createdAt.toISOString()
    };
}
function mapMood(row) {
    return {
        id: row.id,
        moods: row.moods ?? [],
        recordTime: row.recordTime.toISOString(),
        imageUrl: row.imageUrl ?? '',
        note: row.note ?? '',
        createdAt: row.createdAt.toISOString()
    };
}
function mapPain(row) {
    return {
        id: row.id,
        symptoms: row.symptoms ?? [],
        painLevel: row.painLevel,
        startTime: row.startTime.toISOString(),
        endTime: row.endTime ? row.endTime.toISOString() : undefined,
        durationMinutes: row.durationMinutes,
        description: row.description ?? '',
        note: row.note ?? '',
        medicationIds: row.medicationIds ?? [],
        painMarkers: row.painMarkers ?? [],
        createdAt: row.createdAt.toISOString()
    };
}
function mapDiet(row) {
    return {
        id: row.id,
        mealType: row.mealType,
        foodDescription: row.foodDescription ?? '',
        foodImageUrl: row.foodImageUrl ?? '',
        eatTime: row.eatTime ? row.eatTime instanceof Date ? row.eatTime.toISOString() : String(row.eatTime) : row.createdAt.toISOString(),
        tags: row.tags ?? [],
        note: row.note ?? '',
        createdAt: row.createdAt.toISOString()
    };
}
function mapExercise(row) {
    return {
        id: row.id,
        exerciseType: row.exerciseType,
        startTime: row.startTime.toISOString(),
        endTime: row.endTime.toISOString(),
        durationMinutes: row.durationMinutes,
        imageUrl: row.imageUrl ?? '',
        note: row.note ?? '',
        createdAt: row.createdAt.toISOString()
    };
}
function mapWater(row) {
    return {
        id: row.id,
        drinkTime: row.drinkTime.toISOString(),
        amountMl: row.amountMl,
        createdAt: row.createdAt.toISOString()
    };
}
function mapMedication(row) {
    return {
        id: row.id,
        medicineName: row.medicineName,
        dosage: row.dosage ?? '',
        takeTime: row.takeTime.toISOString(),
        relatedSymptom: row.relatedSymptom ?? '',
        painRecordId: row.painRecordId ?? undefined,
        imageUrl: row.imageUrl ?? '',
        note: row.note ?? '',
        createdAt: row.createdAt.toISOString()
    };
}
function mapPoop(row) {
    return {
        id: row.id,
        poopTime: row.poopTime.toISOString(),
        stoolType: row.stoolType,
        note: row.note ?? '',
        createdAt: row.createdAt.toISOString()
    };
}
function summarizeSleep(r) {
    const hrs = Math.floor(r.durationMinutes / 60);
    const mins = r.durationMinutes % 60;
    return hrs > 0 ? `${hrs} 小时${mins > 0 ? ` ${mins} 分钟` : ''}` : `${mins} 分钟`;
}
function summarizeMood(r) {
    const moodStr = (r.moods ?? []).join('、') || '未记录';
    return `心情：${moodStr}`;
}
function summarizePain(r) {
    const symptomStr = (r.symptoms ?? []).join('、') || '未指定';
    const levelMap = {
        mild: '轻微',
        moderate: '中等',
        severe: '严重'
    };
    return `${levelMap[r.painLevel] ?? r.painLevel} - ${symptomStr}`;
}
function summarizeDiet(r) {
    const mealMap = {
        breakfast: '早餐',
        lunch: '午餐',
        dinner: '晚餐',
        supper: '宵夜',
        snack: '加餐'
    };
    return `${mealMap[r.mealType] ?? r.mealType}：${r.foodDescription || '未记录'}`;
}
function summarizeExercise(r) {
    const typeMap = {
        walking: '步行',
        running: '跑步',
        cycling: '骑行',
        swimming: '游泳',
        yoga: '瑜伽',
        strength: '力量训练'
    };
    const typeLabel = typeMap[r.exerciseType] ?? r.exerciseType;
    return `${typeLabel} ${r.durationMinutes} 分钟`;
}
function summarizeWater(r) {
    return `喝水 ${r.amountMl}ml`;
}
function summarizeMedication(r) {
    return `${r.medicineName} ${r.dosage ?? ''}`.trim();
}
function summarizePoop(r) {
    const typeMap = {
        normal: '正常',
        hard: '偏硬',
        soft: '偏软',
        loose: '稀便',
        constipated: '便秘',
        diarrhea: '腹泻'
    };
    return typeMap[r.stoolType] ?? r.stoolType;
}
