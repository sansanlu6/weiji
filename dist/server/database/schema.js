/* eslint-disable */ /** auto generated, do not edit */ "use strict";
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
    get customTimestamptz () {
        return customTimestamptz;
    },
    get escapeLiteral () {
        return escapeLiteral;
    },
    get fileAttachment () {
        return fileAttachment;
    },
    get fileAttachmentArray () {
        return fileAttachmentArray;
    },
    get healthAlertConfig () {
        return healthAlertConfig;
    },
    get healthAlertConfigTable () {
        return healthAlertConfigTable;
    },
    get healthAppUsers () {
        return healthAppUsers;
    },
    get healthAppUsersTable () {
        return healthAppUsersTable;
    },
    get healthDiet () {
        return healthDiet;
    },
    get healthDietTable () {
        return healthDietTable;
    },
    get healthExercise () {
        return healthExercise;
    },
    get healthExerciseTable () {
        return healthExerciseTable;
    },
    get healthGoals () {
        return healthGoals;
    },
    get healthGoalsTable () {
        return healthGoalsTable;
    },
    get healthMedication () {
        return healthMedication;
    },
    get healthMedicationTable () {
        return healthMedicationTable;
    },
    get healthMood () {
        return healthMood;
    },
    get healthMoodTable () {
        return healthMoodTable;
    },
    get healthPain () {
        return healthPain;
    },
    get healthPainTable () {
        return healthPainTable;
    },
    get healthPoop () {
        return healthPoop;
    },
    get healthPoopTable () {
        return healthPoopTable;
    },
    get healthReminders () {
        return healthReminders;
    },
    get healthRemindersTable () {
        return healthRemindersTable;
    },
    get healthSleep () {
        return healthSleep;
    },
    get healthSleepTable () {
        return healthSleepTable;
    },
    get healthWater () {
        return healthWater;
    },
    get healthWaterTable () {
        return healthWaterTable;
    },
    get imageDedup () {
        return imageDedup;
    },
    get imageDedupTable () {
        return imageDedupTable;
    },
    get userProfile () {
        return userProfile;
    },
    get userProfileArray () {
        return userProfileArray;
    }
});
const _drizzleorm = require("drizzle-orm");
const _pgcore = require("drizzle-orm/pg-core");
const customTimestamptz = (0, _pgcore.customType)({
    dataType (config) {
        const precision = typeof config?.precision !== 'undefined' ? ` (${config.precision})` : '';
        return `timestamptz${precision}`;
    },
    toDriver (value) {
        if (value == null) return value;
        if (typeof value === 'number') return new Date(value).toISOString();
        if (typeof value === 'string') return value;
        if (value instanceof Date) return value.toISOString();
        throw new Error('Invalid timestamp value');
    },
    fromDriver (value) {
        if (value instanceof Date) return value;
        return new Date(value);
    }
});
const userProfile = (0, _pgcore.customType)({
    dataType () {
        return 'user_profile';
    },
    toDriver (value) {
        return (0, _drizzleorm.sql)`ROW(${value})::user_profile`;
    },
    fromDriver (value) {
        const [userId] = value.slice(1, -1).split(',');
        return userId.trim();
    }
});
const fileAttachment = (0, _pgcore.customType)({
    dataType () {
        return 'file_attachment';
    },
    toDriver (value) {
        return (0, _drizzleorm.sql)`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
    },
    fromDriver (value) {
        const [bucketId, filePath] = value.slice(1, -1).split(',');
        return {
            bucket_id: bucketId.trim(),
            file_path: filePath.trim()
        };
    }
});
function escapeLiteral(str) {
    return "'" + str.replace(/'/g, "''") + "'";
}
const userProfileArray = (0, _pgcore.customType)({
    dataType () {
        return 'user_profile[]';
    },
    toDriver (value) {
        if (!value || value.length === 0) {
            return (0, _drizzleorm.sql)`'{}'::user_profile[]`;
        }
        const elements = value.map((id)=>`ROW(${escapeLiteral(id)})::user_profile`).join(',');
        return _drizzleorm.sql.raw(`ARRAY[${elements}]::user_profile[]`);
    },
    fromDriver (value) {
        if (!value || value === '{}') return [];
        const inner = value.slice(1, -1);
        const matches = inner.match(/\([^)]*\)/g) || [];
        return matches.map((m)=>m.slice(1, -1).split(',')[0].trim());
    }
});
const fileAttachmentArray = (0, _pgcore.customType)({
    dataType () {
        return 'file_attachment[]';
    },
    toDriver (value) {
        if (!value || value.length === 0) {
            return (0, _drizzleorm.sql)`'{}'::file_attachment[]`;
        }
        const elements = value.map((f)=>`ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`).join(',');
        return _drizzleorm.sql.raw(`ARRAY[${elements}]::file_attachment[]`);
    },
    fromDriver (value) {
        if (!value || value === '{}') return [];
        const inner = value.slice(1, -1);
        const matches = inner.match(/\([^)]*\)/g) || [];
        return matches.map((m)=>{
            const [bucketId, filePath] = m.slice(1, -1).split(',');
            return {
                bucket_id: bucketId.trim(),
                file_path: filePath.trim()
            };
        });
    }
});
const imageDedup = (0, _pgcore.pgTable)("image_dedup", {
    id: (0, _pgcore.uuid)("id").primaryKey().defaultRandom(),
    fileHash: (0, _pgcore.varchar)("file_hash", {
        length: 64
    }).notNull().unique(),
    fileName: (0, _pgcore.text)("file_name").notNull(),
    downloadUrl: (0, _pgcore.text)("download_url").notNull(),
    fileSize: (0, _pgcore.bigint)("file_size", {
        mode: 'number'
    }).notNull().default(0),
    refCount: (0, _pgcore.integer)("ref_count").notNull().default(1),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: customTimestamptz("_created_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Creator (auto-filled, do not modify)
    createdBy: userProfile("_created_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: customTimestamptz("_updated_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Updater (auto-filled, do not modify)
    updatedBy: userProfile("_updated_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`)
}, (table)=>[
        (0, _pgcore.uniqueIndex)("image_dedup_file_hash_key").on(table.fileHash),
        (0, _pgcore.uniqueIndex)("idx_image_dedup_file_hash").on(table.fileHash)
    ]);
const healthAppUsers = (0, _pgcore.pgTable)("health_app_users", {
    id: (0, _pgcore.uuid)("id").primaryKey().defaultRandom(),
    username: (0, _pgcore.varchar)("username", {
        length: 64
    }).notNull().unique(),
    passwordHash: (0, _pgcore.varchar)("password_hash", {
        length: 255
    }).notNull(),
    signature: (0, _pgcore.varchar)("signature", {
        length: 200
    }),
    avatarUrl: (0, _pgcore.text)("avatar_url"),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: customTimestamptz("_created_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Creator (auto-filled, do not modify)
    createdBy: userProfile("_created_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: customTimestamptz("_updated_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Updater (auto-filled, do not modify)
    updatedBy: userProfile("_updated_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`)
}, (table)=>[
        (0, _pgcore.uniqueIndex)("health_app_users_username_key").on(table.username),
        (0, _pgcore.uniqueIndex)("idx_health_app_users_username").on(table.username)
    ]);
const healthAlertConfig = (0, _pgcore.pgTable)("health_alert_config", {
    id: (0, _pgcore.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, _pgcore.varchar)("user_id", {
        length: 64
    }).notNull(),
    alertType: (0, _pgcore.varchar)("alert_type", {
        length: 30
    }).notNull(),
    threshold: (0, _pgcore.numeric)("threshold").notNull(),
    isEnabled: (0, _pgcore.boolean)("is_enabled").notNull().default(true),
    isDeleted: (0, _pgcore.boolean)("is_deleted").notNull().default(false),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: customTimestamptz("_created_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Creator (auto-filled, do not modify)
    createdBy: userProfile("_created_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: customTimestamptz("_updated_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Updater (auto-filled, do not modify)
    updatedBy: userProfile("_updated_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`)
}, (table)=>[
        (0, _pgcore.uniqueIndex)("health_alert_config_user_id_alert_type_key").on(table.userId, table.alertType)
    ]);
const healthReminders = (0, _pgcore.pgTable)("health_reminders", {
    id: (0, _pgcore.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, _pgcore.varchar)("user_id", {
        length: 64
    }).notNull(),
    reminderType: (0, _pgcore.varchar)("reminder_type", {
        length: 30
    }).notNull(),
    title: (0, _pgcore.varchar)("title", {
        length: 100
    }).notNull(),
    timePoints: (0, _pgcore.text)("time_points").array().notNull().default([]),
    repeatType: (0, _pgcore.varchar)("repeat_type", {
        length: 20
    }).notNull().default('daily'),
    repeatDays: (0, _pgcore.text)("repeat_days").array().notNull().default([]),
    repeatInterval: (0, _pgcore.integer)("repeat_interval").default(1),
    endDate: (0, _pgcore.date)("end_date"),
    isEnabled: (0, _pgcore.boolean)("is_enabled").notNull().default(true),
    isDeleted: (0, _pgcore.boolean)("is_deleted").notNull().default(false),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: customTimestamptz("_created_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Creator (auto-filled, do not modify)
    createdBy: userProfile("_created_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: customTimestamptz("_updated_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Updater (auto-filled, do not modify)
    updatedBy: userProfile("_updated_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`)
}, (table)=>[
        (0, _pgcore.index)("idx_health_reminders_user_id").on(table.userId)
    ]);
const healthGoals = (0, _pgcore.pgTable)("health_goals", {
    id: (0, _pgcore.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, _pgcore.varchar)("user_id", {
        length: 64
    }).notNull(),
    goalType: (0, _pgcore.varchar)("goal_type", {
        length: 30
    }).notNull(),
    targetValue: (0, _pgcore.numeric)("target_value").notNull(),
    period: (0, _pgcore.varchar)("period", {
        length: 20
    }).notNull().default('daily'),
    isDeleted: (0, _pgcore.boolean)("is_deleted").notNull().default(false),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: customTimestamptz("_created_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Creator (auto-filled, do not modify)
    createdBy: userProfile("_created_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: customTimestamptz("_updated_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Updater (auto-filled, do not modify)
    updatedBy: userProfile("_updated_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`)
}, (table)=>[
        (0, _pgcore.uniqueIndex)("health_goals_user_id_goal_type_key").on(table.userId, table.goalType)
    ]);
const healthPoop = (0, _pgcore.pgTable)("health_poop", {
    id: (0, _pgcore.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, _pgcore.varchar)("user_id", {
        length: 64
    }).notNull(),
    poopTime: customTimestamptz("poop_time", {
        precision: 6
    }).notNull(),
    stoolType: (0, _pgcore.varchar)("stool_type", {
        length: 20
    }).notNull().default('normal'),
    note: (0, _pgcore.text)("note"),
    isDeleted: (0, _pgcore.boolean)("is_deleted").notNull().default(false),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: customTimestamptz("_created_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Creator (auto-filled, do not modify)
    createdBy: userProfile("_created_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: customTimestamptz("_updated_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Updater (auto-filled, do not modify)
    updatedBy: userProfile("_updated_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`)
}, (table)=>[
        (0, _pgcore.index)("idx_health_poop_user_id").on(table.userId),
        (0, _pgcore.index)("idx_health_poop_poop_time").on(table.poopTime)
    ]);
const healthMedication = (0, _pgcore.pgTable)("health_medication", {
    id: (0, _pgcore.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, _pgcore.varchar)("user_id", {
        length: 64
    }).notNull(),
    medicineName: (0, _pgcore.varchar)("medicine_name", {
        length: 100
    }).notNull(),
    dosage: (0, _pgcore.varchar)("dosage", {
        length: 100
    }),
    takeTime: customTimestamptz("take_time", {
        precision: 6
    }).notNull(),
    relatedSymptom: (0, _pgcore.text)("related_symptom"),
    painRecordId: (0, _pgcore.uuid)("pain_record_id"),
    note: (0, _pgcore.text)("note"),
    isDeleted: (0, _pgcore.boolean)("is_deleted").notNull().default(false),
    imageUrl: (0, _pgcore.text)("image_url"),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: customTimestamptz("_created_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Creator (auto-filled, do not modify)
    createdBy: userProfile("_created_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: customTimestamptz("_updated_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Updater (auto-filled, do not modify)
    updatedBy: userProfile("_updated_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`)
}, (table)=>[
        (0, _pgcore.index)("idx_health_medication_user_id").on(table.userId),
        (0, _pgcore.index)("idx_health_medication_take_time").on(table.takeTime)
    ]);
const healthWater = (0, _pgcore.pgTable)("health_water", {
    id: (0, _pgcore.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, _pgcore.varchar)("user_id", {
        length: 64
    }).notNull(),
    drinkTime: customTimestamptz("drink_time", {
        precision: 6
    }).notNull(),
    amountMl: (0, _pgcore.integer)("amount_ml").notNull().default(250),
    isDeleted: (0, _pgcore.boolean)("is_deleted").notNull().default(false),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: customTimestamptz("_created_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Creator (auto-filled, do not modify)
    createdBy: userProfile("_created_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: customTimestamptz("_updated_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Updater (auto-filled, do not modify)
    updatedBy: userProfile("_updated_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`)
}, (table)=>[
        (0, _pgcore.index)("idx_health_water_user_id").on(table.userId),
        (0, _pgcore.index)("idx_health_water_drink_time").on(table.drinkTime)
    ]);
const healthExercise = (0, _pgcore.pgTable)("health_exercise", {
    id: (0, _pgcore.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, _pgcore.varchar)("user_id", {
        length: 64
    }).notNull(),
    exerciseType: (0, _pgcore.varchar)("exercise_type", {
        length: 30
    }).notNull().default('walking'),
    startTime: customTimestamptz("start_time", {
        precision: 6
    }).notNull(),
    endTime: customTimestamptz("end_time", {
        precision: 6
    }).notNull(),
    durationMinutes: (0, _pgcore.integer)("duration_minutes").notNull().default(0),
    note: (0, _pgcore.text)("note"),
    isDeleted: (0, _pgcore.boolean)("is_deleted").notNull().default(false),
    imageUrl: (0, _pgcore.text)("image_url"),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: customTimestamptz("_created_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Creator (auto-filled, do not modify)
    createdBy: userProfile("_created_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: customTimestamptz("_updated_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Updater (auto-filled, do not modify)
    updatedBy: userProfile("_updated_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`)
}, (table)=>[
        (0, _pgcore.index)("idx_health_exercise_user_id").on(table.userId),
        (0, _pgcore.index)("idx_health_exercise_start_time").on(table.startTime)
    ]);
const healthDiet = (0, _pgcore.pgTable)("health_diet", {
    id: (0, _pgcore.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, _pgcore.varchar)("user_id", {
        length: 64
    }).notNull(),
    mealType: (0, _pgcore.varchar)("meal_type", {
        length: 20
    }).notNull().default('lunch'),
    foodDescription: (0, _pgcore.text)("food_description"),
    foodImageUrl: (0, _pgcore.text)("food_image_url"),
    tags: (0, _pgcore.text)("tags").array().notNull().default([]),
    note: (0, _pgcore.text)("note"),
    isDeleted: (0, _pgcore.boolean)("is_deleted").notNull().default(false),
    eatTime: customTimestamptz("eat_time", {
        precision: 6
    }),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: customTimestamptz("_created_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Creator (auto-filled, do not modify)
    createdBy: userProfile("_created_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: customTimestamptz("_updated_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Updater (auto-filled, do not modify)
    updatedBy: userProfile("_updated_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`)
}, (table)=>[
        (0, _pgcore.index)("idx_health_diet_user_id").on(table.userId),
        (0, _pgcore.index)("idx_health_diet_created_at").on(table.createdAt),
        (0, _pgcore.index)("idx_health_diet_eat_time").on(table.eatTime)
    ]);
const healthPain = (0, _pgcore.pgTable)("health_pain", {
    id: (0, _pgcore.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, _pgcore.varchar)("user_id", {
        length: 64
    }).notNull(),
    symptoms: (0, _pgcore.text)("symptoms").array().notNull().default([]),
    painLevel: (0, _pgcore.varchar)("pain_level", {
        length: 20
    }).notNull().default('mild'),
    startTime: customTimestamptz("start_time", {
        precision: 6
    }).notNull(),
    endTime: customTimestamptz("end_time", {
        precision: 6
    }),
    durationMinutes: (0, _pgcore.integer)("duration_minutes").notNull().default(0),
    description: (0, _pgcore.text)("description"),
    note: (0, _pgcore.text)("note"),
    medicationIds: (0, _pgcore.uuid)("medication_ids").array().notNull().default([]),
    isDeleted: (0, _pgcore.boolean)("is_deleted").notNull().default(false),
    /**
   * @type { x: number, y: number, size: number, side: "front" | "back" }[]
   */ painMarkers: (0, _pgcore.jsonb)("pain_markers").notNull().default('[]'),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: customTimestamptz("_created_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Creator (auto-filled, do not modify)
    createdBy: userProfile("_created_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: customTimestamptz("_updated_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Updater (auto-filled, do not modify)
    updatedBy: userProfile("_updated_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`)
}, (table)=>[
        (0, _pgcore.index)("idx_health_pain_user_id").on(table.userId),
        (0, _pgcore.index)("idx_health_pain_start_time").on(table.startTime)
    ]);
const healthMood = (0, _pgcore.pgTable)("health_mood", {
    id: (0, _pgcore.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, _pgcore.varchar)("user_id", {
        length: 64
    }).notNull(),
    moods: (0, _pgcore.text)("moods").array().notNull().default([]),
    recordTime: customTimestamptz("record_time", {
        precision: 6
    }).notNull(),
    note: (0, _pgcore.text)("note"),
    isDeleted: (0, _pgcore.boolean)("is_deleted").notNull().default(false),
    imageUrl: (0, _pgcore.text)("image_url"),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: customTimestamptz("_created_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Creator (auto-filled, do not modify)
    createdBy: userProfile("_created_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: customTimestamptz("_updated_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Updater (auto-filled, do not modify)
    updatedBy: userProfile("_updated_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`)
}, (table)=>[
        (0, _pgcore.index)("idx_health_mood_user_id").on(table.userId),
        (0, _pgcore.index)("idx_health_mood_record_time").on(table.recordTime)
    ]);
const healthSleep = (0, _pgcore.pgTable)("health_sleep", {
    id: (0, _pgcore.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, _pgcore.varchar)("user_id", {
        length: 64
    }).notNull(),
    sleepTime: customTimestamptz("sleep_time", {
        precision: 6
    }).notNull(),
    wakeTime: customTimestamptz("wake_time", {
        precision: 6
    }).notNull(),
    durationMinutes: (0, _pgcore.integer)("duration_minutes").notNull().default(0),
    note: (0, _pgcore.text)("note"),
    isDeleted: (0, _pgcore.boolean)("is_deleted").notNull().default(false),
    // System field: Creation time (auto-filled, do not modify)
    createdAt: customTimestamptz("_created_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Creator (auto-filled, do not modify)
    createdBy: userProfile("_created_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
    // System field: Update time (auto-filled, do not modify)
    updatedAt: customTimestamptz("_updated_at", {
        precision: 3
    }).notNull().default((0, _drizzleorm.sql)`CURRENT_TIMESTAMP`),
    // System field: Updater (auto-filled, do not modify)
    updatedBy: userProfile("_updated_by").default((0, _drizzleorm.sql)`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`)
}, (table)=>[
        (0, _pgcore.index)("idx_health_sleep_user_id").on(table.userId),
        (0, _pgcore.index)("idx_health_sleep_sleep_time").on(table.sleepTime)
    ]);
const healthAlertConfigTable = healthAlertConfig;
const healthAppUsersTable = healthAppUsers;
const healthDietTable = healthDiet;
const healthExerciseTable = healthExercise;
const healthGoalsTable = healthGoals;
const healthMedicationTable = healthMedication;
const healthMoodTable = healthMood;
const healthPainTable = healthPain;
const healthPoopTable = healthPoop;
const healthRemindersTable = healthReminders;
const healthSleepTable = healthSleep;
const healthWaterTable = healthWater;
const imageDedupTable = imageDedup;
