import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { format, subDays, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, parseISO, addDays, differenceInDays, isValid, differenceInMinutes } from 'date-fns';
import { BarChart3, TrendingUp, AlertCircle, Calendar, Heart, Smile, Moon } from 'lucide-react';
import { Card } from '../components/UI';
import { AppState } from '../types';
import { clsx } from 'clsx';

interface PageProps {
  state: AppState;
}

const StatsPage: React.FC<PageProps> = ({ state }) => {
  const [weightTarget, setWeightTarget] = useState<'mooncake' | 'tianbao' | 'bird' | 'self'>('self');
  const [contributionTask, setContributionTask] = useState('housework');

  // Menstrual Stats
  const menstrualStats = useMemo(() => {
    const settings = state.settings.menstrualSettings;
    if (!settings?.lastStartDate) return null;

    const lastDate = parseISO(settings.lastStartDate);
    if (!isValid(lastDate)) return null;
    const expectedNext = addDays(lastDate, settings.avgCycleDays);
    if (!isValid(expectedNext)) return null;
    const today = new Date();
    const diff = differenceInDays(today, expectedNext);

    return {
      lastDate: format(lastDate, 'yyyy-MM-dd'),
      expectedNext: format(expectedNext, 'yyyy-MM-dd'),
      cycleLength: settings.avgCycleDays,
      periodLength: settings.avgPeriodDays,
      status: diff === 0 ? '今天到期' : diff > 0 ? `推迟 ${diff} 天` : `还有 ${Math.abs(diff)} 天`
    };
  }, [state.settings.menstrualSettings]);

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
    const categoryMap: Record<string, string> = {
      'CS': 'CS',
      'Single': '单机',
      'Anime': '动漫',
      'Series': '剧集',
      'Movie': '电影',
      'Outing': '外出'
    };
    Object.values(state.dailyData).forEach(record => {
      (record.entertainment || []).forEach(log => {
        const label = categoryMap[log.category] || log.category;
        totals[label] = (totals[label] || 0) + log.duration;
      });
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [state.dailyData]);

  // Prepare Health Alerts
  const healthAlerts = useMemo(() => {
    const alerts: { date: string; type: string; note: string }[] = [];
    const last90Days = eachDayOfInterval({
      start: subDays(new Date(), 89),
      end: new Date(),
    });

    const symptomMap: Record<string, string> = {
      'Digestive': '肠胃不适',
      'Cold': '感冒',
      'Injury': '受伤',
      'Fever': '发烧',
      'Headache': '头痛',
      'Skin': '皮肤问题',
      'Other': '其他'
    };

    const birdAnomalyMap: Record<string, string> = {
      'watery-poop': '水软便',
      'lethargy': '精神不振',
      'injury': '受伤',
      'egg-laying': '下蛋',
      'other': '其他'
    };

    last90Days.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const record = state.dailyData[dateStr];
      if (record) {
        // Cats
        if (record.cats?.mooncake?.isSoftPoop) alerts.push({ date: dateStr, type: '小月饼软便', note: record.cats.mooncake.healthNote || '' });
        if (record.cats?.mooncake?.vomit && record.cats.mooncake.vomit !== 'none') alerts.push({ date: dateStr, type: '小月饼呕吐', note: record.cats.mooncake.healthNote || '' });
        if (record.cats?.tianbao?.isSoftPoop) alerts.push({ date: dateStr, type: '甜宝软便', note: record.cats.tianbao.healthNote || '' });
        if (record.cats?.tianbao?.vomit && record.cats.tianbao.vomit !== 'none') alerts.push({ date: dateStr, type: '甜宝呕吐', note: record.cats.tianbao.healthNote || '' });
        
        // Water Filter
        if (record.waterFilterMold && record.waterFilterMold !== 'none') {
          const moldMap = { pink: '粉色霉菌', black: '黑色霉菌', green: '绿色霉菌' };
          alerts.push({ date: dateStr, type: '饮水机异常', note: moldMap[record.waterFilterMold as keyof typeof moldMap] || record.waterFilterMold });
        }

        // Bird
        if (record.bird?.anomalies?.length) {
          const notes = record.bird.anomalies.map(a => birdAnomalyMap[a] || a).join(', ');
          alerts.push({ date: dateStr, type: '小觅异常', note: `${notes}${record.bird.customAnomaly ? ` (${record.bird.customAnomaly})` : ''}` });
        }

        // Personal
        if (record.personal?.health?.symptoms?.length) {
          const symptoms = record.personal.health.symptoms.map(s => symptomMap[s] || s).join(', ');
          alerts.push({ date: dateStr, type: '本人异常', note: symptoms });
        }
      }
    });
    return alerts.reverse();
  }, [state.dailyData]);

  // Prepare Mood Data
  const moodData = useMemo(() => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });
    const moodMap: Record<string, { icon: string, value: number }> = {
      happy: { icon: '😊', value: 4 },
      calm: { icon: '😐', value: 3 },
      angry: { icon: '😡', value: 2 },
      low: { icon: '😔', value: 1 }
    };
    return last30Days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const record = state.dailyData[dateStr];
      const mood = record?.personal?.mood?.score;
      return {
        date: format(date, 'MM-dd'),
        mood: mood ? moodMap[mood].value : null,
        icon: mood ? moodMap[mood].icon : null
      };
    }).filter(d => d.mood !== null);
  }, [state.dailyData]);

  // Prepare Sleep Data
  const sleepData = useMemo(() => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });
    return last30Days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const record = state.dailyData[dateStr];
      const sleep = record?.personal?.sleep;
      let duration = null;
      if (sleep?.bedTime && sleep?.wakeTime) {
        const bed = parseISO(`2000-01-01T${sleep.bedTime}`);
        let wake = parseISO(`2000-01-01T${sleep.wakeTime}`);
        if (isValid(bed) && isValid(wake)) {
          if (wake < bed) wake = addDays(wake, 1);
          duration = differenceInMinutes(wake, bed) / 60;
        }
      }
      return {
        date: format(date, 'MM-dd'),
        duration: duration !== null ? parseFloat(duration.toFixed(1)) : null,
      };
    }).filter(d => d.duration !== null);
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
        } else if (contributionTask === 'pet') {
          count = (record.tasks.cat?.filter(t => t.done).length || 0) + 
                  (record.tasks.bird?.filter(t => t.done).length || 0) +
                  (record.tasks.fish?.filter(t => t.done).length || 0);
        }
      }
      return { date, count };
    });
  }, [state.dailyData, contributionTask]);

  return (
    <div className="space-y-4">
      {/* Menstrual Stats */}
      {menstrualStats && (
        <Card title="经期统计" icon={<Heart className="text-rose-500" size={20} />}>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
              <div className="text-[10px] text-rose-400 uppercase font-bold mb-1">上次经期</div>
              <div className="text-sm font-black text-rose-600">{menstrualStats.lastDate}</div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
              <div className="text-[10px] text-indigo-400 uppercase font-bold mb-1">预计下次</div>
              <div className="text-sm font-black text-indigo-600">{menstrualStats.expectedNext}</div>
            </div>
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
              <div className="text-[10px] text-stone-400 uppercase font-bold mb-1">周期长度</div>
              <div className="text-sm font-black text-stone-800">{menstrualStats.cycleLength} 天</div>
            </div>
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
              <div className="text-[10px] text-stone-400 uppercase font-bold mb-1">当前状态</div>
              <div className="text-sm font-black text-stone-800">{menstrualStats.status}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Mood Curve */}
      <Card title="心情波动" icon={<Smile className="text-yellow-500" size={20} />}>
        <div className="h-48 w-full">
          {moodData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide domain={[0, 5]} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 rounded-xl shadow-lg border border-stone-100 text-xs">
                          <p className="font-bold text-stone-400 mb-1">{payload[0].payload.date}</p>
                          <p className="text-lg">{payload[0].payload.icon}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="#eab308" 
                  strokeWidth={2} 
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    return (
                      <text x={cx} y={cy} dy={4} textAnchor="middle" fontSize={16}>
                        {payload.icon}
                      </text>
                    );
                  }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-stone-400 text-xs italic">
              暂无心情数据
            </div>
          )}
        </div>
      </Card>

      {/* Sleep Curve */}
      <Card title="睡眠时长" icon={<Moon className="text-indigo-600" size={20} />}>
        <div className="h-48 w-full">
          {sleepData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sleepData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  formatter={(value: number) => [`${value} 小时`, '时长']}
                />
                <Line 
                  type="monotone" 
                  dataKey="duration" 
                  stroke="#4f46e5" 
                  strokeWidth={3} 
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const hours = payload.duration;
                    const color = hours < 7 ? '#ef4444' : hours <= 9 ? '#22c55e' : '#f97316';
                    return (
                      <circle cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={2} />
                    );
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-stone-400 text-xs italic">
              暂无睡眠数据
            </div>
          )}
        </div>
      </Card>

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
                  formatter={(value: number) => [`${value} 分钟`, '时长']}
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
          {(['housework', 'personal', 'entertainment', 'pet'] as const).map(t => (
            <button
              key={t}
              onClick={() => setContributionTask(t)}
              className={clsx(
                "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all",
                contributionTask === t ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-400"
              )}
            >
              {t === 'housework' ? '家务' : t === 'personal' ? '个人' : t === 'entertainment' ? '娱乐' : '宠物'}
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
