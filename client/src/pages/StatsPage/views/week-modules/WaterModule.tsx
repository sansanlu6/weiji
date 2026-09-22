import { Droplets } from 'lucide-react';
import CompactBarChart from '../../charts/CompactBarChart';
import type { WeeklyDetailStats } from '@shared/api.interface';

interface WaterModuleProps {
  data: WeeklyDetailStats['water'];
}

const WaterModule: React.FC<WaterModuleProps> = ({ data }) => {
  const days = ['一', '二', '三', '四', '五', '六', '日'];
  const cupsByDay: number[] = days.map((_, i) => {
    const day = data.dailyCups[i];
    return day ? day.cups : 0;
  });

  return (
    <div className="paper-card p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-module-water-bg flex items-center justify-center">
          <Droplets className="w-3.5 h-3.5 text-module-water" strokeWidth={2} />
        </div>
        <div className="text-base font-semibold font-sans-hei">喝水统计</div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-module-water-bg/60 rounded-xl py-2">
          <div className="text-lg font-semibold tabular-nums text-foreground">
            {data.totalCups}
          </div>
           <div className="text-sm text-muted-foreground mt-0.5">总杯数</div>
        </div>
        <div className="bg-module-water-bg/60 rounded-xl py-2">
          <div className="text-lg font-semibold tabular-nums text-foreground">
            {data.avgCups}
          </div>
           <div className="text-sm text-muted-foreground mt-0.5">日均杯数</div>
        </div>
        <div className="bg-module-water-bg/60 rounded-xl py-2">
          <div className="text-lg font-semibold tabular-nums text-foreground">
            {data.maxCups}
          </div>
           <div className="text-sm text-muted-foreground mt-0.5">单日最高</div>
        </div>
      </div>

      <div className="h-[160px] -mx-1">
        <CompactBarChart
          xData={days}
          yData={cupsByDay}
          color="#7cc0df"
          unit="杯"
          barMaxWidth={18}
        />
      </div>
    </div>
  );
};

export default WaterModule;
