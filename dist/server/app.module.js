"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppModule", {
    enumerable: true,
    get: function() {
        return AppModule;
    }
});
const _core = require("@nestjs/core");
const _common = require("@nestjs/common");
const _fullstacknestjscore = require("@lark-apaas/fullstack-nestjs-core");
const _exceptionfilter = require("./common/filters/exception.filter");
const _viewmodule = require("./modules/view/view.module");
const _healthrecordsmodule = require("./modules/health-records/health-records.module");
const _healthstatsmodule = require("./modules/health-stats/health-stats.module");
const _healthgoalsmodule = require("./modules/health-goals/health-goals.module");
const _healthremindersmodule = require("./modules/health-reminders/health-reminders.module");
const _healthdatamodule = require("./modules/health-data/health-data.module");
const _authmodule = require("./modules/auth/auth.module");
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
let AppModule = class AppModule {
};
AppModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            // 平台 Module，提供平台能力
            _fullstacknestjscore.PlatformModule.forRoot(),
            // ====== @route-section: business-modules START ======
            // Place all business modules here.Do NOT add fallback modules here.
            _healthrecordsmodule.HealthRecordsModule,
            _healthstatsmodule.HealthStatsModule,
            _healthgoalsmodule.HealthGoalsModule,
            _healthremindersmodule.HealthRemindersModule,
            _healthdatamodule.HealthDataModule,
            _authmodule.AuthModule,
            // ====== @route-section: business-modules END ======
            // ⚠️ @route-order: last
            // ViewModule is the fallback route module, must be registered last.
            _viewmodule.ViewModule
        ],
        providers: [
            {
                provide: _core.APP_FILTER,
                useClass: _exceptionfilter.GlobalExceptionFilter
            }
        ]
    })
], AppModule);
