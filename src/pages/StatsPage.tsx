import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { format, subDays, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, parseISO, addDays, differenceInDays, isValid, differenceInMinutes, startOfWeek, endOfWeek, eachWeekOfInterval, subWeeks, addWeeks } from 'date-fns';
import { BarChart3, TrendingUp, AlertCircle, Calendar, Heart, Smile, Moon, ChevronLeft, ChevronRight, Cat, Info, Gamepad2, Utensils } from 'lucide-react';
import { Card, Modal } from '../components/UI';
import { AppState, CatFoodTransition, CatFoodDaily } from '../types';
import { clsx } from 'clsx';

interface PageProps {
  state: AppState;
  updateSettings: (settings: Partial<AppState['settings']>) => void;
}

const StatsPage: React.FC<PageProps> = ({ state, updateSettings }) => {
  const [weightTarget, setWeightTarget] = useState<'mooncake' | 'tianbao' | 'bird' | 'self'>('self');
  const [contributionTask, setContributionTask] = useState('housework');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));
  const [entChartType, setEntChartType] = useState<'bar' | 'pie'>('bar');
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<any>(null);

  const weekInterval = useMemo(() => ({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
  }), [currentWeekStart]);

  const weekDays = useMemo(() => eachDayOfInterval(weekInterval), [weekInterval]);

  // Prepare Weight Data
  const weightData = useMemo(() => {
    return weekDays.map(date => {
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
    });
  }, [state.dailyData, weightTarget, weekDays]);

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
    weekDays.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const record = state.dailyData[dateStr];
      if (record) {
        (record.entertainment || []).forEach(log => {
          const label = categoryMap[log.category] || log.category;
          totals[label] = (totals[label] || 0) + log.duration;
        });
      }
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [state.dailyData, weekDays]);

  // Prepare Health Alerts
  const healthAlerts = useMemo(() => {
    const alerts: { date: string; type: string; note: string }[] = [];
    
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

    weekDays.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const record = state.dailyData[dateStr];
      
      // Water Filter Alert (Only if >= 90 days)
      const filterLastChange = parseISO(state.settings.waterFilterLastChange || format(new Date(), 'yyyy-MM-dd'));
      if (isValid(filterLastChange)) {
        const filterDays = differenceInDays(date, filterLastChange);
        if (filterDays >= 90 && isSameDay(date, new Date())) {
          alerts.push({ date: dateStr, type: '饮水机滤芯到期', note: `已使用 ${filterDays} 天，请及时更换` });
        }
      }

      if (record) {
        // Cats
        if (record.cats?.mooncake?.isSoftPoop) alerts.push({ date: dateStr, type: '小月饼软便', note: record.cats.mooncake.healthNote || '' });
        if (record.cats?.mooncake?.vomit && record.cats.mooncake.vomit !== 'none') alerts.push({ date: dateStr, type: '小月饼呕吐', note: record.cats.mooncake.healthNote || '' });
        if (record.cats?.tianbao?.isSoftPoop) alerts.push({ date: dateStr, type: '甜宝软便', note: record.cats.tianbao.healthNote || '' });
        if (record.cats?.tianbao?.vomit && record.cats.tianbao.vomit !== 'none') alerts.push({ date: dateStr, type: '甜宝呕吐', note: record.cats.tianbao.healthNote || '' });
        
        // Water Filter Mold
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
  }, [state.dailyData, weekDays, state.settings.waterFilterLastChange]);

  // Prepare Mood Data
  const moodData = useMemo(() => {
    const moodMap: Record<string, { icon: string, value: number }> = {
      happy: { icon: '😊', value: 4 },
      calm: { icon: '😐', value: 3 },
      angry: { icon: '😡', value: 2 },
      low: { icon: '😔', value: 1 }
    };
    return weekDays.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const record = state.dailyData[dateStr];
      const mood = record?.personal?.mood?.score;
      return {
        date: format(date, 'MM-dd'),
        mood: mood ? moodMap[mood].value : null,
        icon: mood ? moodMap[mood].icon : null
      };
    });
  }, [state.dailyData, weekDays]);

  // Prepare Sleep Data
  const sleepData = useMemo(() => {
    return weekDays.map(date => {
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
    });
  }, [state.dailyData, weekDays]);

  // Cat Food Calendar Logic
  const catFoodCalendar = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const { catFoodTransition, catFoodTransitionHistory, catFoodDaily } = state.settings;
      const record = state.dailyData[dateStr];
      
      let type: 'transition' | 'daily' | 'none' = 'none';
      let brand = '';
      let amount = '';
      let details: any = { treats: record?.catTreats || [], plays: record?.catPlays || [] };
      
      // Check current transition and history
      const allTransitions = [
        ...(catFoodTransition ? [catFoodTransition] : []),
        ...(catFoodTransitionHistory || [])
      ];

      for (const trans of allTransitions) {
        const transStart = parseISO(trans.startDate);
        if (isValid(transStart)) {
          const diff = differenceInDays(date, transStart);
          const dayNumber = diff + 1;
          
          // If the plan is not active, check if the date is within the plan's duration and before its end date
          const plan = trans.plan.find(p => p.day === dayNumber);
          if (plan) {
            // If it's not active, it must be before or on the endDate
            if (!trans.isActive && trans.endDate && dateStr > trans.endDate) {
              continue;
            }
            
            type = 'transition';
            brand = `${trans.oldFood} & ${trans.newFood}`;
            amount = `旧: ${(plan.totalGrams * plan.oldPercent / 100).toFixed(1)}g, 新: ${(plan.totalGrams * plan.newPercent / 100).toFixed(1)}g (共${plan.totalGrams}g)`;
            details.food = [
              { name: trans.oldFood, amount: (plan.totalGrams * plan.oldPercent / 100).toFixed(1) + 'g' },
              { name: trans.newFood, amount: (plan.totalGrams * plan.newPercent / 100).toFixed(1) + 'g' }
            ];
            break; // Found a matching transition
          }
        }
      }
      
      if (type === 'none') {
        const activeRecord = (state.settings.catFoodRecords || []).find(r => !r.isFinished && parseISO(r.startDate) <= date && (!r.endDate || parseISO(r.endDate) >= date));
        if (activeRecord) {
          type = 'daily';
          brand = activeRecord.brand;
          amount = `${activeRecord.dailyGrams || 100}g`;
          details.food = [{ name: brand, amount: `${activeRecord.dailyGrams || 100}g` }];
        } else if (catFoodDaily) {
          type = 'daily';
          brand = catFoodDaily.brand;
          amount = `${catFoodDaily.dailyGrams || 100}g`;
          details.food = [{ name: brand, amount: `${catFoodDaily.dailyGrams || 100}g` }];
        }
      }
      
      return { date, type, brand, amount, details };
    });
  }, [selectedMonth, state.settings, state.dailyData]);

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

  const handlePrevWeek = () => setCurrentWeekStart(prev => subWeeks(prev, 1));
  const handleNextWeek = () => setCurrentWeekStart(prev => addWeeks(prev, 1));
  const handleResetWeek = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  return (
    <div className="space-y-4 pb-10">
      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-stone-100 shadow-sm sticky top-0 z-10">
        <button onClick={handlePrevWeek} className="p-2 hover:bg-stone-50 rounded-full transition-colors">
          <ChevronLeft size={20} className="text-stone-400" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xs font-black text-stone-800">
            {format(weekInterval.start, 'yyyy年MM月dd日')} - {format(weekInterval.end, 'MM月dd日')}
          </span>
          <button onClick={handleResetWeek} className="text-[10px] text-blue-500 font-bold mt-0.5">回到本周</button>
        </div>
        <button onClick={handleNextWeek} className="p-2 hover:bg-stone-50 rounded-full transition-colors">
          <ChevronRight size={20} className="text-stone-400" />
        </button>
      </div>

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
              本周暂无心情数据
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
              本周暂无睡眠数据
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
              本周暂无体重数据
            </div>
          )}
        </div>
      </Card>

      {/* Cat Food Bag Statistics */}
      <Card title="猫粮消耗统计 (按包)" icon={<Cat className="text-amber-600" size={20} />}>
        <div className="space-y-4">
          {(!state.settings.catFoodRecords || state.settings.catFoodRecords.length === 0) ? (
            <p className="text-center py-4 text-stone-400 text-xs italic">暂无猫粮记录数据</p>
          ) : (
            <div className="space-y-3">
              {[...state.settings.catFoodRecords].sort((a,b) => b.startDate.localeCompare(a.startDate)).map(record => {
                const start = parseISO(record.startDate);
                const end = record.endDate ? parseISO(record.endDate) : new Date();
                const days = isValid(start) && isValid(end) ? differenceInDays(end, start) + 1 : 0;
                const costPerDay = days > 0 ? (record.price / days).toFixed(2) : '0.00';
                
                return (
                  <div key={record.id} className="bg-stone-50 p-3 rounded-2xl border border-stone-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-xs font-bold text-stone-800">{record.brand}</h4>
                        <p className="text-[10px] text-stone-400">{record.startDate} 至 {record.endDate || '至今'}</p>
                      </div>
                      <div className={clsx(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold",
                        record.isFinished ? "bg-stone-200 text-stone-500" : "bg-emerald-100 text-emerald-600"
                      )}>
                        {record.isFinished ? '已吃完' : '进行中'}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2 rounded-xl border border-stone-50">
                        <p className="text-[8px] text-stone-400 mb-0.5">天数</p>
                        <p className="text-xs font-bold text-stone-700">{days} 天</p>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-stone-50">
                        <p className="text-[8px] text-stone-400 mb-0.5">总价</p>
                        <p className="text-xs font-bold text-stone-700">¥{record.price}</p>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-stone-50">
                        <p className="text-[8px] text-stone-400 mb-0.5">日均成本</p>
                        <p className="text-xs font-bold text-amber-600">¥{costPerDay}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Cat Food Calendar */}
      <Card title="猫粮方案图" icon={<Cat className="text-amber-500" size={20} />}>
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setSelectedMonth(prev => subDays(startOfMonth(prev), 1))} className="p-1 hover:bg-stone-50 rounded-full">
              <ChevronLeft size={16} className="text-stone-400" />
            </button>
            <span className="text-xs font-bold text-stone-700">{format(selectedMonth, 'yyyy年MM月')}</span>
            <button onClick={() => setSelectedMonth(prev => addDays(endOfMonth(prev), 1))} className="p-1 hover:bg-stone-50 rounded-full">
              <ChevronRight size={16} className="text-stone-400" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['一', '二', '三', '四', '五', '六', '日'].map(d => (
              <div key={d} className="text-center text-[8px] font-bold text-stone-400 py-1">{d}</div>
            ))}
            {Array.from({ length: (startOfMonth(selectedMonth).getDay() + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {catFoodCalendar.map((day, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedCalendarDay(day)}
                className={clsx(
                  "aspect-square rounded-sm flex items-center justify-center text-[8px] transition-all cursor-pointer",
                  day.type === 'transition' ? "bg-amber-400 text-white font-bold" : 
                  day.type === 'daily' ? "bg-stone-200 text-stone-600" : "bg-stone-50 text-stone-300"
                )}
              >
                {format(day.date, 'd')}
              </div>
            ))}
          </div>
          <div className="flex gap-4 justify-center text-[8px] text-stone-400">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-amber-400 rounded-sm" /> 换粮模式
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-stone-200 rounded-sm" /> 日常模式
            </div>
          </div>
        </div>
      </Card>

      {/* Entertainment Stats */}
      <Card 
        title="娱乐时长统计" 
        icon={<BarChart3 className="text-purple-500" size={20} />}
        onAdd={() => setEntChartType(prev => prev === 'bar' ? 'pie' : 'bar')}
      >
        <div className="flex justify-end mb-2">
          <button 
            onClick={() => setEntChartType(prev => prev === 'bar' ? 'pie' : 'bar')}
            className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100"
          >
            切换为{entChartType === 'bar' ? '饼图' : '柱状图'}
          </button>
        </div>
        <div className="h-48 w-full">
          {entertainmentStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {entChartType === 'bar' ? (
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
              ) : (
                <PieChart>
                  <Pie
                    data={entertainmentStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {entertainmentStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#9333ea', '#a855f7', '#c084fc', '#d8b4fe'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} 分钟`, '时长']} />
                </PieChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-stone-400 text-xs italic">
              本周暂无娱乐数据
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
      <Card title="异常告警 (本周)" icon={<AlertCircle className="text-red-500" size={20} />}>
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
              本周一切正常，继续保持哦~
            </div>
          )}
        </div>
      </Card>

      {/* Cat Food Detail Modal */}
      <Modal
        isOpen={!!selectedCalendarDay}
        onClose={() => setSelectedCalendarDay(null)}
        title={`${selectedCalendarDay ? format(selectedCalendarDay.date, 'yyyy-MM-dd') : ''} 详情`}
      >
        {selectedCalendarDay && (
          <div className="space-y-4">
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-xs mb-3">
                <Cat size={16} />
                <span>猫粮方案</span>
              </div>
              <div className="space-y-2">
                {selectedCalendarDay.details?.food?.map((f: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-white p-2 rounded-xl border border-stone-100">
                    <span className="text-xs text-stone-600">{f.name}</span>
                    <span className="text-xs font-bold text-stone-800">{f.amount}</span>
                  </div>
                ))}
                {(!selectedCalendarDay.details?.food || selectedCalendarDay.details.food.length === 0) && (
                  <p className="text-[10px] text-stone-400 italic">当天无猫粮记录</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs mb-2">
                  <Info size={14} />
                  <span>零食</span>
                </div>
                <div className="space-y-1">
                  {selectedCalendarDay.details?.treats?.map((t: any, i: number) => (
                    <div key={i} className="text-[10px] text-stone-600">• {t.brand} ({t.type}) x{t.count}</div>
                  ))}
                  {(!selectedCalendarDay.details?.treats || selectedCalendarDay.details.treats.length === 0) && (
                    <p className="text-[10px] text-stone-400 italic">无</p>
                  )}
                </div>
              </div>
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs mb-2">
                  <Gamepad2 size={14} />
                  <span>玩耍</span>
                </div>
                <div className="space-y-1">
                  {selectedCalendarDay.details?.plays?.map((p: any, i: number) => (
                    <div key={i} className="text-[10px] text-stone-600">• {p.type} ({p.duration}min)</div>
                  ))}
                  {(!selectedCalendarDay.details?.plays || selectedCalendarDay.details.plays.length === 0) && (
                    <p className="text-[10px] text-stone-400 italic">无</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StatsPage;
