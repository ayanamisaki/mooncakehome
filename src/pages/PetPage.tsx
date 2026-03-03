import React, { useState, useMemo, useEffect } from 'react';
import { differenceInDays, parseISO, format, isValid } from 'date-fns';
import { Droplets, Cat, Bird, Fish, Info, Scale, AlertCircle, CheckCircle2, Circle, Cookie, Gamepad2, Plus, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Card, TaskItem, Modal } from '../components/UI';
import { DailyRecord, AppState, getBirdWaterTask, Task } from '../types';

interface PageProps {
  dateStr: string;
  selectedDate: Date;
  dailyRecord: DailyRecord;
  updateDailyRecord: (record: Partial<DailyRecord>) => void;
  state: AppState;
  updateSettings: (settings: Partial<AppState['settings']>) => void;
}

const PetPage: React.FC<PageProps> = ({ 
  dateStr, 
  selectedDate, 
  dailyRecord, 
  updateDailyRecord, 
  state, 
  updateSettings 
}) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingCat, setEditingCat] = useState<'mooncake' | 'tianbao' | null>(null);
  const [newTreat, setNewTreat] = useState<{ catName: 'mooncake' | 'tianbao', type: '冻干' | '猫条' | '罐头', brand: string, quantity: number }>({
    catName: 'mooncake',
    type: '冻干',
    brand: '',
    quantity: 1
  });
  const [newPlay, setNewPlay] = useState<{ catName: 'mooncake' | 'tianbao', type: '绳子' | '柳条' | '藏东西' | '捉迷藏', duration: number }>({
    catName: 'mooncake',
    type: '绳子',
    duration: 10
  });

  // Cat Food Auto-switch Logic
  useEffect(() => {
    if (state.settings.catFoodMode === 'transition' && state.settings.catFoodTransition?.isActive) {
      const startDate = parseISO(state.settings.catFoodTransition.startDate);
      if (isValid(startDate)) {
        const planDays = state.settings.catFoodTransition.plan.length;
        if (differenceInDays(selectedDate, startDate) >= planDays) {
          updateSettings({ catFoodMode: 'daily', catFoodTransition: { ...state.settings.catFoodTransition, isActive: false } });
        }
      }
    }
  }, [selectedDate, state.settings.catFoodMode, state.settings.catFoodTransition, updateSettings]);

  // Water Filter Logic
  const filterLastChange = parseISO(state.settings.waterFilterLastChange || format(new Date(), 'yyyy-MM-dd'));
  const filterDays = isValid(filterLastChange) ? differenceInDays(selectedDate, filterLastChange) : 0;
  const filterStatus = filterDays < 30 ? 'text-green-500' : 'text-red-500';

  const catTasks = useMemo(() => {
    let tasks = [...(dailyRecord.tasks.cat || [])];
    const { catFoodMode } = state.settings;

    // Add dynamic tasks
    if (catFoodMode === 'daily') {
      if (!tasks.find(t => t.id === 'cat-food-check')) {
        tasks.push({ id: 'cat-food-check', name: '检查饭桶余量是否充足', done: false, isFixed: true });
      }
    } else {
      tasks = tasks.filter(t => t.id !== 'cat-food-check');
    }

    return tasks;
  }, [dailyRecord.tasks.cat, state.settings.catFoodMode]);

  const handleToggleTask = (taskId: string, subTaskId?: string) => {
    const category = 'cat';
    const tasks = catTasks;
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        if (subTaskId) {
          const updatedSubTasks = t.subTasks?.map(st => 
            st.id === subTaskId ? { ...st, done: !st.done } : st
          );
          const allDone = updatedSubTasks?.every(st => st.done);
          return { ...t, subTasks: updatedSubTasks, done: !!allDone };
        }
        return { ...t, done: !t.done };
      }
      return t;
    });
    updateDailyRecord({ tasks: { ...dailyRecord.tasks, [category]: updatedTasks } });
  };

  const handleCatLogUpdate = (cat: 'mooncake' | 'tianbao', field: string, value: any) => {
    updateDailyRecord({
      cats: {
        ...dailyRecord.cats,
        [cat]: {
          ...dailyRecord.cats[cat],
          [field]: value
        }
      }
    });
  };

  const handleAddTreat = () => {
    const treat = { ...newTreat, id: crypto.randomUUID() };
    updateDailyRecord({ catTreats: [...(dailyRecord.catTreats || []), treat] });
    setNewTreat({ ...newTreat, brand: '', quantity: 1 });
  };

  const handleRemoveTreat = (id: string) => {
    updateDailyRecord({ catTreats: dailyRecord.catTreats.filter(t => t.id !== id) });
  };

  const handleAddPlay = () => {
    const play = { ...newPlay, id: crypto.randomUUID() };
    updateDailyRecord({ catPlays: [...(dailyRecord.catPlays || []), play] });
    setNewPlay({ ...newPlay, duration: 10 });
  };

  const handleRemovePlay = (id: string) => {
    updateDailyRecord({ catPlays: dailyRecord.catPlays.filter(p => p.id !== id) });
  };

  const renderCatFoodStatus = () => {
    const { catFoodMode, catFoodTransition, catFoodDaily } = state.settings;
    
    if (catFoodMode === 'transition' && catFoodTransition) {
      const startDate = catFoodTransition.startDate || format(new Date(), 'yyyy-MM-dd');
      const daysSinceStart = differenceInDays(selectedDate, parseISO(startDate)) + 1;
      const plan = catFoodTransition.plan || [];
      const dayPlan = plan.find(p => p.day === daysSinceStart);
      
      return (
        <div className="bg-amber-50 p-3 rounded-xl mb-3 text-xs border border-amber-100">
          <div className="flex justify-between font-bold mb-2 text-amber-800 border-b border-amber-200 pb-1">
            <span>换粮模式: 第 {daysSinceStart} 天</span>
            <span>共 {plan.length} 天计划</span>
          </div>
          {dayPlan ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-stone-600 font-medium">配粮方案:</span>
                <span className="bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-bold">总量 {dayPlan.totalGrams}g</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/60 p-2 rounded-lg border border-amber-100">
                  <p className="text-[10px] text-amber-600 mb-1">旧粮: {catFoodTransition.oldFood}</p>
                  <p className="text-sm font-bold text-amber-900">{(dayPlan.totalGrams * dayPlan.oldPercent / 100).toFixed(1)}g <span className="text-[10px] font-normal opacity-60">({dayPlan.oldPercent}%)</span></p>
                </div>
                <div className="bg-white/60 p-2 rounded-lg border border-amber-100">
                  <p className="text-[10px] text-amber-600 mb-1">新粮: {catFoodTransition.newFood}</p>
                  <p className="text-sm font-bold text-amber-900">{(dayPlan.totalGrams * dayPlan.newPercent / 100).toFixed(1)}g <span className="text-[10px] font-normal opacity-60">({dayPlan.newPercent}%)</span></p>
                </div>
              </div>
              <p className="text-[10px] text-stone-400 mt-1 italic">理由: {catFoodTransition.reason}</p>
            </div>
          ) : (
            <p className="text-stone-400 italic">超出计划天数</p>
          )}
        </div>
      );
    } else if (catFoodDaily) {
      const startDate = catFoodDaily.startDate || format(new Date(), 'yyyy-MM-dd');
      const daysSinceStart = differenceInDays(selectedDate, parseISO(startDate));
      return (
        <div className="bg-stone-50 p-3 rounded-xl mb-3 text-xs border border-stone-100">
          <div className="flex justify-between items-center mb-1">
            <p className="font-bold text-stone-800">日常模式: {catFoodDaily.brand}</p>
            <span className="text-[10px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded">第 {daysSinceStart} 天</span>
          </div>
          <p className="text-stone-500 text-[10px]">本包猫粮于 {startDate} 启封</p>
          {catFoodDaily.price && <p className="text-stone-400 text-[10px]">价格: ¥{catFoodDaily.price}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Cat Section */}
      <Card title="小猫宝宝 (小月饼 & 甜宝)" icon={<Cat className="text-amber-500" size={20} />}>
        {renderCatFoodStatus()}
        
        <div className="space-y-4 mb-6">
          {catTasks.map(task => (
            <div key={task.id} className="border-b border-stone-50 pb-2 last:border-0">
              <TaskItem 
                name={task.name}
                done={task.done}
                onToggle={() => handleToggleTask(task.id)}
                onClick={() => setEditingTask(task)}
                note={task.note}
              />
              {task.subTasks && (
                <div className="ml-8 mt-1 space-y-1">
                  {task.subTasks.map(st => (
                    <div key={st.id} className="flex items-center gap-2 py-1">
                      <button 
                        onClick={() => handleToggleTask(task.id, st.id)}
                        className={clsx("transition-colors", st.done ? "text-stone-400" : "text-stone-300")}
                      >
                        {st.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      </button>
                      <span className={clsx("text-xs", st.done ? "text-stone-400 line-through" : "text-stone-600")}>
                        {st.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {task.id === 'cat-water' && (
                <div className="ml-8 mt-2 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px]">
                      滤芯已用 <span className={filterStatus + " font-bold"}>{(filterDays || 0).toString()}</span> 天
                    </div>
                    <button 
                      onClick={() => updateSettings({ waterFilterLastChange: format(selectedDate, 'yyyy-MM-dd') })}
                      className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold"
                    >
                      设为换芯日
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400">霉菌检查:</span>
                    {(['none', 'pink', 'black', 'green'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => updateDailyRecord({ waterFilterMold: m })}
                        className={clsx(
                          "px-2 py-0.5 rounded text-[10px] border transition-all",
                          dailyRecord.waterFilterMold === m ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-400 border-stone-200"
                        )}
                      >
                        {m === 'none' ? '无' : m === 'pink' ? '粉' : m === 'black' ? '黑' : '绿'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {(['mooncake', 'tianbao'] as const).map(cat => (
            <div key={cat} className="bg-stone-50 p-3 rounded-2xl border border-stone-100">
              <div className="flex items-center justify-between mb-2 text-stone-700">
                <h4 className="font-bold text-sm">{cat === 'mooncake' ? '小月饼' : '甜宝'}</h4>
                <button 
                  onClick={() => setEditingCat(cat)}
                  className="text-[10px] text-stone-400 flex items-center gap-1"
                >
                  <Info size={12} /> 详情
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-500">粪便</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleCatLogUpdate(cat, 'poopCount', Math.max(0, dailyRecord.cats[cat].poopCount - 1))} className="w-5 h-5 bg-white rounded border border-stone-200 text-xs">-</button>
                      <span className="text-xs font-bold w-4 text-center">{(dailyRecord.cats[cat].poopCount || 0).toString()}</span>
                      <button onClick={() => handleCatLogUpdate(cat, 'poopCount', dailyRecord.cats[cat].poopCount + 1)} className="w-5 h-5 bg-white rounded border border-stone-200 text-xs">+</button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-500">尿团</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleCatLogUpdate(cat, 'peeCount', Math.max(0, dailyRecord.cats[cat].peeCount - 1))} className="w-5 h-5 bg-white rounded border border-stone-200 text-xs">-</button>
                      <span className="text-xs font-bold w-4 text-center">{(dailyRecord.cats[cat].peeCount || 0).toString()}</span>
                      <button onClick={() => handleCatLogUpdate(cat, 'peeCount', dailyRecord.cats[cat].peeCount + 1)} className="w-5 h-5 bg-white rounded border border-stone-200 text-xs">+</button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] text-stone-500 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={dailyRecord.cats[cat].isSoftPoop}
                      onChange={(e) => handleCatLogUpdate(cat, 'isSoftPoop', e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    软便
                  </label>
                  <div className="flex items-center gap-1 text-[10px] text-stone-500">
                    <Scale size={12} />
                    <input 
                      type="number" 
                      placeholder="体重 kg"
                      value={dailyRecord.cats[cat].weight ?? ''}
                      onChange={(e) => handleCatLogUpdate(cat, 'weight', parseFloat(e.target.value))}
                      className="w-12 bg-transparent border-b border-stone-200 focus:border-amber-500 outline-none text-center"
                    />
                    kg
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Treats Module */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 text-stone-700 font-bold text-sm border-b border-stone-100 pb-2">
            <Cookie size={18} className="text-orange-400" />
            <span>零食奖励</span>
          </div>
          <div className="bg-orange-50/50 p-3 rounded-2xl border border-orange-100 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select 
                value={newTreat.catName}
                onChange={(e) => setNewTreat({ ...newTreat, catName: e.target.value as any })}
                className="bg-white rounded-lg p-2 text-xs outline-none border border-orange-200"
              >
                <option value="mooncake">小月饼</option>
                <option value="tianbao">甜宝</option>
              </select>
              <select 
                value={newTreat.type}
                onChange={(e) => setNewTreat({ ...newTreat, type: e.target.value as any })}
                className="bg-white rounded-lg p-2 text-xs outline-none border border-orange-200"
              >
                <option value="冻干">冻干</option>
                <option value="猫条">猫条</option>
                <option value="罐头">罐头</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input 
                type="text" 
                placeholder="品牌"
                value={newTreat.brand}
                onChange={(e) => setNewTreat({ ...newTreat, brand: e.target.value })}
                className="col-span-2 bg-white rounded-lg p-2 text-xs outline-none border border-orange-200"
              />
              <input 
                type="number" 
                placeholder="数量"
                value={newTreat.quantity}
                onChange={(e) => setNewTreat({ ...newTreat, quantity: parseInt(e.target.value) || 0 })}
                className="bg-white rounded-lg p-2 text-xs outline-none border border-orange-200 text-center"
              />
            </div>
            <button 
              onClick={handleAddTreat}
              className="w-full py-2 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={14} /> 添加零食记录
            </button>
          </div>
          <div className="space-y-2">
            {dailyRecord.catTreats?.map(treat => (
              <div key={treat.id} className="flex items-center justify-between bg-white p-2 rounded-xl border border-stone-100 text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-700">{treat.catName === 'mooncake' ? '小月饼' : '甜宝'}</span>
                  <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">{treat.type}</span>
                  <span className="text-stone-500">{treat.brand}</span>
                  <span className="font-bold text-stone-800">x{treat.quantity}</span>
                </div>
                <button onClick={() => handleRemoveTreat(treat.id)} className="text-stone-300 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Play Module */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 text-stone-700 font-bold text-sm border-b border-stone-100 pb-2">
            <Gamepad2 size={18} className="text-indigo-400" />
            <span>互动玩耍</span>
          </div>
          <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select 
                value={newPlay.catName}
                onChange={(e) => setNewPlay({ ...newPlay, catName: e.target.value as any })}
                className="bg-white rounded-lg p-2 text-xs outline-none border border-indigo-200"
              >
                <option value="mooncake">小月饼</option>
                <option value="tianbao">甜宝</option>
              </select>
              <select 
                value={newPlay.type}
                onChange={(e) => setNewPlay({ ...newPlay, type: e.target.value as any })}
                className="bg-white rounded-lg p-2 text-xs outline-none border border-indigo-200"
              >
                <option value="绳子">绳子</option>
                <option value="柳条">柳条</option>
                <option value="藏东西">藏东西</option>
                <option value="捉迷藏">捉迷藏</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500">时长:</span>
              <input 
                type="number" 
                value={newPlay.duration}
                onChange={(e) => setNewPlay({ ...newPlay, duration: parseInt(e.target.value) || 0 })}
                className="flex-1 bg-white rounded-lg p-2 text-xs outline-none border border-indigo-200 text-center"
              />
              <span className="text-xs text-stone-500">分钟</span>
            </div>
            <button 
              onClick={handleAddPlay}
              className="w-full py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={14} /> 添加玩耍记录
            </button>
          </div>
          <div className="space-y-2">
            {dailyRecord.catPlays?.map(play => (
              <div key={play.id} className="flex items-center justify-between bg-white p-2 rounded-xl border border-stone-100 text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-700">{play.catName === 'mooncake' ? '小月饼' : '甜宝'}</span>
                  <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">{play.type}</span>
                  <span className="font-bold text-stone-800">{play.duration} 分钟</span>
                </div>
                <button onClick={() => handleRemovePlay(play.id)} className="text-stone-300 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Bird Section */}
      <Card title="小鸟宝宝 (小觅)" icon={<Bird className="text-emerald-500" size={20} />}>
        <div className="bg-emerald-50 p-3 rounded-xl mb-3 text-xs border border-emerald-100 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-emerald-600" />
            <span className="font-bold text-emerald-800">今日水：{getBirdWaterTask(selectedDate)}</span>
          </div>
        </div>
        <div className="space-y-2">
          {dailyRecord.tasks.bird?.map(task => (
            <TaskItem 
              key={task.id}
              name={task.name}
              done={task.done}
              onToggle={() => {
                const updated = dailyRecord.tasks.bird?.map(t => t.id === task.id ? { ...t, done: !t.done } : t);
                updateDailyRecord({ tasks: { ...dailyRecord.tasks, bird: updated } });
              }}
            />
          ))}
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(['watery-poop', 'lethargy', 'injury', 'egg-laying', 'other'] as const).map(a => {
              const labels = { 'watery-poop': '水软便', 'lethargy': '精神不振', 'injury': '受伤', 'egg-laying': '下蛋', 'other': '其他' };
              const isSelected = dailyRecord.bird.anomalies?.includes(a);
              return (
                <button
                  key={a}
                  onClick={() => {
                    const current = dailyRecord.bird.anomalies || [];
                    const updated = isSelected ? current.filter(x => x !== a) : [...current, a];
                    updateDailyRecord({ bird: { ...dailyRecord.bird, anomalies: updated } });
                  }}
                  className={clsx(
                    "px-2 py-1 rounded-lg text-[10px] border transition-all",
                    isSelected ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-stone-400 border-stone-200"
                  )}
                >
                  {labels[a]}
                </button>
              );
            })}
          </div>
          {dailyRecord.bird.anomalies?.includes('other') && (
            <input 
              type="text" 
              placeholder="其他异常详情..."
              value={dailyRecord.bird.customAnomaly || ''}
              onChange={(e) => updateDailyRecord({ bird: { ...dailyRecord.bird, customAnomaly: e.target.value } })}
              className="w-full text-xs bg-transparent border-b border-stone-200 focus:border-emerald-500 outline-none py-1"
            />
          )}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-xs text-stone-500">
              <Scale size={14} />
              <input 
                type="number" 
                placeholder="体重 g"
                value={dailyRecord.bird.weight ?? ''}
                onChange={(e) => updateDailyRecord({ bird: { ...dailyRecord.bird, weight: parseFloat(e.target.value) } })}
                className="w-12 bg-transparent border-b border-stone-200 focus:border-emerald-500 outline-none text-center"
              />
              g
            </div>
            <input 
              type="text" 
              placeholder="健康异常记录..."
              value={dailyRecord.bird.healthNote ?? ''}
              onChange={(e) => updateDailyRecord({ bird: { ...dailyRecord.bird, healthNote: e.target.value } })}
              className="flex-1 text-xs bg-transparent border-b border-stone-200 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>
      </Card>

      {/* Fish Section */}
      <Card title="鱼缸" icon={<Fish className="text-cyan-500" size={20} />}>
        <div className="space-y-2 mb-4">
          {dailyRecord.tasks.fish?.map(task => (
            <TaskItem 
              key={task.id}
              name={task.name}
              done={task.done}
              onToggle={() => {
                const updated = dailyRecord.tasks.fish?.map(t => t.id === task.id ? { ...t, done: !t.done } : t);
                updateDailyRecord({ tasks: { ...dailyRecord.tasks, fish: updated } });
              }}
            />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {(['motherMale', 'motherFemale', 'medium', 'small'] as const).map(type => (
            <div key={type} className="flex flex-col items-center">
              <span className="text-[10px] text-stone-400 mb-1">
                {type === 'motherMale' ? '成公' : type === 'motherFemale' ? '成母' : type === 'medium' ? '中' : '小'}
              </span>
              <input 
                type="number" 
                value={dailyRecord.fish[type] ?? 0}
                onChange={(e) => updateDailyRecord({ fish: { ...dailyRecord.fish, [type]: parseInt(e.target.value) || 0 } })}
                className="w-full text-center text-sm font-bold bg-stone-50 rounded-lg py-1 border border-stone-100 focus:border-cyan-500 outline-none"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Cat Detail Modal */}
      <Modal 
        isOpen={!!editingCat} 
        onClose={() => setEditingCat(null)} 
        title={editingCat === 'mooncake' ? '小月饼详情' : '甜宝详情'}
      >
        {editingCat && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-400 mb-2">呕吐记录</label>
              <div className="flex gap-2">
                {(['hairball', 'no-hairball', 'none'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => handleCatLogUpdate(editingCat, 'vomit', type)}
                    className={clsx(
                      "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
                      dailyRecord.cats[editingCat].vomit === type 
                        ? "bg-amber-600 text-white" 
                        : "bg-stone-100 text-stone-400"
                    )}
                  >
                    {type === 'hairball' ? '有毛球' : type === 'no-hairball' ? '无毛球' : '无'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-400 mb-2">健康异常记录</label>
              <textarea 
                value={dailyRecord.cats[editingCat].healthNote ?? ''}
                onChange={(e) => handleCatLogUpdate(editingCat, 'healthNote', e.target.value)}
                className="w-full h-32 bg-stone-50 rounded-2xl p-4 text-sm outline-none border border-stone-100 focus:border-amber-500 transition-all"
                placeholder="记录任何异常情况..."
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PetPage;
