import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { format, subDays, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { BarChart3, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import { Card } from '../components/UI';
import { AppState } from '../types';
import { clsx } from 'clsx';

interface PageProps {
  state: AppState;
}

const StatsPage: React.FC<PageProps> = ({ state }) => {
  const [weightTarget, setWeightTarget] = useState<'mooncake' | 'tianbao' | 'bird' | 'self'>('self');
  const [contributionTask, setContributionTask] = useState('housework');

  // Prepare Weight Data
  const weightData = useMemo(() => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    return last30Days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const record = state.dailyData[dateStr];
      let weight = null;
      
      if (record) {
        if (weightTarget === 'mooncake') weight = record.cats.mooncake.weight;
        else if (weightTarget === 'tianbao') weight = record.cats.tianbao.weight;
        else if (weightTarget === 'bird') weight = record.bird.weight;
        else if (weightTarget === 'self') weight = record.personal?.weight;
      }

      return {
        date: format(date, 'MM-dd'),
        weight: (weight !== null && weight !== undefined && !isNaN(weight)) ? String(weight) : null,
      };
    }).filter(d => d.weight !== null);
  }, [state.dailyData, weightTarget]);

  // Prepare Entertainment Data
  const entertainmentStats = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.values(state.dailyData).forEach(record => {
      (record.entertainment || []).forEach(log => {
        totals[log.category] = (totals[log.category] || 0) + log.duration;
      });
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [state.dailyData]);

  // Prepare Health Alerts
  const healthAlerts = useMemo(() => {
    const alerts: { date: string; type: string; note: string }[] = [];
    const last14Days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date(),
    });

    last14Days.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const record = state.dailyData[dateStr];
      if (record) {
        if (record.cats.mooncake.isSoftPoop) alerts.push({ date: dateStr, type: '小月饼软便', note: record.cats.mooncake.healthNote || '' });
        if (record.cats.mooncake.vomit && record.cats.mooncake.vomit !== 'none') alerts.push({ date: dateStr, type: '小月饼呕吐', note: record.cats.mooncake.healthNote || '' });
        if (record.cats.tianbao.isSoftPoop) alerts.push({ date: dateStr, type: '甜宝软便', note: record.cats.tianbao.healthNote || '' });
        if (record.cats.tianbao.vomit && record.cats.tianbao.vomit !== 'none') alerts.push({ date: dateStr, type: '甜宝呕吐', note: record.cats.tianbao.healthNote || '' });
        if (record.personal?.health?.symptoms?.length) alerts.push({ date: dateStr, type: '本人异常', note: record.personal.health.symptoms.join(', ') });
      }
    });
    return alerts.reverse();
  }, [state.dailyData]);

  // Contribution Graph Logic
  const contributionData = useMemo(() => {
    const start = startOfMonth(subDays(new Date(), 120));
    const end = new Date();
    const days = eachDayOfInterval({ start, end });
    
    return days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const record = state.dailyData[dateStr];
      let count = 0;
      if (record) {
        if (contributionTask === 'housework') {
          count = record.tasks.housework?.filter(t => t.done).length || 0;
        } else if (contributionTask === 'personal') {
          count = record.tasks.personal?.filter(t => t.done).length || 0;
        } else if (contributionTask === 'entertainment') {
          count = (record.entertainment || []).length;
        }
      }
      return { date, count };
    });
  }, [state.dailyData, contributionTask]);

  return (
    <div className="space-y-4">
      {/* Weight Curve */}
      <Card title="体重曲线" icon={<TrendingUp className="text-blue-500" size={20} />}>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {(['self', 'mooncake', 'tianbao', 'bird'] as const).map(t => (
            <button
              key={t}
              onClick={() => setWeightTarget(t)}
              className={clsx(
                "px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all",
                weightTarget === t ? "bg-blue-600 text-white" : "bg-stone-100 text-stone-400"
              )}
            >
              {t === 'self' ? '本人' : t === 'mooncake' ? '小月饼' : t === 'tianbao' ? '甜宝' : '小觅'}
            </button>
          ))}
        </div>
        <div className="h-48 w-full">
          {weightData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#2563eb" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-stone-400 text-xs italic">
              暂无体重数据
            </div>
          )}
        </div>
      </Card>

      {/* Entertainment Stats */}
      <Card title="娱乐时长统计" icon={<BarChart3 className="text-purple-500" size={20} />}>
        <div className="h-48 w-full">
          {entertainmentStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={entertainmentStats} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={10} width={40} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#9333ea" radius={[0, 4, 4, 0]}>
                  {entertainmentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#9333ea', '#a855f7', '#c084fc', '#d8b4fe'][index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-stone-400 text-xs italic">
              暂无娱乐数据
            </div>
          )}
        </div>
      </Card>

      {/* Contribution Graph */}
      <Card title="贡献图" icon={<Calendar className="text-emerald-500" size={20} />}>
        <div className="flex gap-2 mb-4">
          {(['housework', 'personal', 'entertainment'] as const).map(t => (
            <button
              key={t}
              onClick={() => setContributionTask(t)}
              className={clsx(
                "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all",
                contributionTask === t ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-400"
              )}
            >
              {t === 'housework' ? '家务' : t === 'personal' ? '个人' : '娱乐'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 justify-center">
          {contributionData.map((day, i) => {
            const level = day.count === 0 ? 0 : day.count < 3 ? 1 : day.count < 6 ? 2 : 3;
            return (
              <div 
                key={i}
                title={`${format(day.date, 'yyyy-MM-dd')}: ${day.count}`}
                className={clsx(
                  "w-3 h-3 rounded-sm transition-colors",
                  level === 0 ? "bg-stone-100" : 
                  level === 1 ? "bg-emerald-200" : 
                  level === 2 ? "bg-emerald-400" : "bg-emerald-600"
                )}
              />
            );
          })}
        </div>
        <div className="mt-2 flex justify-end gap-2 text-[8px] text-stone-400 items-center">
          Less <div className="w-2 h-2 bg-stone-100 rounded-sm" />
          <div className="w-2 h-2 bg-emerald-200 rounded-sm" />
          <div className="w-2 h-2 bg-emerald-400 rounded-sm" />
          <div className="w-2 h-2 bg-emerald-600 rounded-sm" /> More
        </div>
      </Card>

      {/* Health Alerts */}
      <Card title="异常告警 (近期)" icon={<AlertCircle className="text-red-500" size={20} />}>
        <div className="space-y-2">
          {healthAlerts.length > 0 ? (
            healthAlerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="text-[10px] font-bold text-red-400 mt-0.5">{alert.date.slice(5)}</div>
                <div>
                  <div className="text-xs font-bold text-red-700">{alert.type}</div>
                  {alert.note && <div className="text-[10px] text-red-500 mt-0.5">{alert.note}</div>}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-stone-400 text-sm italic">
              近期一切正常，继续保持哦~
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StatsPage;
