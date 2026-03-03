import React, { useState, useMemo } from 'react';
import { Plus, Scale, Activity, Heart, Brain, PenTool, Trash2, Moon, Sun, Smile, Coffee, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { Card, TaskItem, Modal } from '../components/UI';
import { DailyRecord, Task, FitnessLog, AppState } from '../types';
import { format, parseISO, differenceInMinutes, differenceInDays, addDays, isValid } from 'date-fns';

interface PageProps {
  dailyRecord: DailyRecord;
  updateDailyRecord: (record: Partial<DailyRecord>) => void;
  state: AppState;
}

const PersonalPage: React.FC<PageProps> = ({ dailyRecord, updateDailyRecord, state }) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingFitness, setEditingFitness] = useState<FitnessLog | null>(null);
  const [newTaskName, setNewTaskName] = useState('');

  const tasks = dailyRecord.tasks?.personal || [];
  const personal = dailyRecord.personal || { fitness: [], health: { symptoms: [] } };

  // Sleep Duration Calculation
  const sleepDuration = useMemo(() => {
    if (!personal.sleep?.bedTime || !personal.sleep?.wakeTime) return null;
    try {
      const bed = parseISO(`2000-01-01T${personal.sleep.bedTime}`);
      let wake = parseISO(`2000-01-01T${personal.sleep.wakeTime}`);
      if (!isValid(bed) || !isValid(wake)) return null;
      if (wake < bed) wake = addDays(wake, 1);
      const diff = differenceInMinutes(wake, bed);
      return (diff / 60).toFixed(1);
    } catch (e) { return null; }
  }, [personal.sleep?.bedTime, personal.sleep?.wakeTime]);

  const sleepColor = useMemo(() => {
    if (!sleepDuration) return 'text-stone-400';
    const hours = parseFloat(sleepDuration);
    if (isNaN(hours)) return 'text-stone-400';
    if (hours < 7) return 'text-red-500';
    if (hours <= 9) return 'text-green-500';
    return 'text-orange-500';
  }, [sleepDuration]);

  // Menstrual Phase Calculation
  const menstrualInfo = useMemo(() => {
    const settings = state.settings.menstrualSettings || {
      lastStartDate: '',
      avgCycleDays: 30,
      avgPeriodDays: 7
    };
    
    if (!settings.lastStartDate) return null;

    const lastDate = parseISO(settings.lastStartDate);
    if (!isValid(lastDate)) return null;
    const today = new Date();
    const daysSince = differenceInDays(today, lastDate);
    
    const cycleDay = (daysSince % (settings.avgCycleDays || 30)) + 1;
    const isPeriod = personal.health?.isPeriod;

    let phase = '';
    let tips = '';
    if (cycleDay <= (settings.avgPeriodDays || 7)) {
      phase = '经期';
      tips = '注意保暖，避免生冷，多休息。';
    } else if (cycleDay <= 14) {
      phase = '卵泡期';
      tips = '精力充沛，适合高强度运动和学习。';
    } else if (cycleDay <= 16) {
      phase = '排卵期';
      tips = '可能感到腹胀，注意皮肤清洁。';
    } else {
      phase = '黄体期';
      tips = '可能出现PMS，保持心情舒畅，清淡饮食。';
    }

    return { cycleDay, phase, tips, isPeriod };
  }, [state.settings.menstrualSettings, personal.health?.isPeriod]);

  const handleToggle = (id: string) => {
    updateDailyRecord({
      tasks: {
        ...dailyRecord.tasks,
        personal: tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
      }
    });
  };

  const handleAddTask = () => {
    if (!newTaskName.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      name: newTaskName,
      done: false,
      isFixed: false
    };
    updateDailyRecord({
      tasks: {
        ...dailyRecord.tasks,
        personal: [...tasks, newTask]
      }
    });
    setNewTaskName('');
  };

  const updatePersonal = (field: string, value: any) => {
    updateDailyRecord({
      personal: { ...personal, [field]: value }
    });
  };

  // Mood Log Logic
  const moodTasks = useMemo(() => {
    const score = personal.mood?.score;
    if (!score) return [];
    
    const recommendations: Record<string, string[]> = {
      happy: [
        '分享快乐给朋友', '奖励自己一个小甜点', '记录下这件开心的事', 
        '去户外走走', '听一首欢快的歌', '拍一张今天的照片'
      ],
      calm: [
        '冥想 10 分钟', '阅读 20 分钟', '整理一下桌面', 
        '练习深呼吸', '写一段随笔', '泡一壶好茶'
      ],
      angry: [
        '听舒缓的音乐', '梳理课题分离', '深呼吸 5 次', 
        '写下生气的原因并撕掉', '快走 15 分钟', '喝一杯温水'
      ],
      low: [
        '抱抱自己', '听首轻快的歌', '早点休息', 
        '看一部治愈系电影', '洗个热水澡', '给绿植浇水'
      ]
    };

    const list = recommendations[score] || [];
    // Randomly pick 3
    return [...list].sort(() => 0.5 - Math.random()).slice(0, 3);
  }, [personal.mood?.score]);

  const handleAddMoodTask = (taskName: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      name: taskName,
      done: false,
      isFixed: false
    };
    updateDailyRecord({
      tasks: {
        ...dailyRecord.tasks,
        personal: [...tasks, newTask]
      }
    });
  };

  const symptomMap: Record<string, string> = {
    'Digestive': '肠胃',
    'Cold': '感冒',
    'Injury': '受伤',
    'Fever': '发烧',
    'Headache': '头痛',
    'Skin': '皮肤',
    'Other': '其他'
  };

  const addFitness = () => {
    const newFitness: FitnessLog = {
      id: crypto.randomUUID(),
      type: 'Strength',
      duration: 30,
      exercises: [],
      feeling: 'Good'
    };
    setEditingFitness(newFitness);
  };

  const saveFitness = () => {
    if (!editingFitness) return;
    const existing = personal.fitness || [];
    const updated = editingFitness.id 
      ? existing.some(f => f.id === editingFitness.id)
        ? existing.map(f => f.id === editingFitness.id ? editingFitness : f)
        : [...existing, editingFitness]
      : [...existing, { ...editingFitness, id: crypto.randomUUID() }];
    
    updatePersonal('fitness', updated);
    setEditingFitness(null);
  };

  const deleteFitness = (id: string) => {
    const updated = (personal.fitness || []).filter(f => f.id !== id);
    updatePersonal('fitness', updated);
  };

  const fitnessPresets = [
    '爬坡', '动感单车', '爬楼', '椭圆机', '跑步', 
    '舞蹈', '拳击', '篮球', '臀腿训练', '上肢训练', '腹部训练'
  ];

  return (
    <div className="space-y-4">
      {/* Personal Tasks - Now at the top */}
      <Card title="个人待办" icon={<Brain className="text-amber-500" size={20} />}>
        <div className="space-y-1">
          {tasks.map(task => (
            <TaskItem 
              key={task.id}
              name={task.name}
              done={task.done}
              onToggle={() => handleToggle(task.id)}
              onDelete={task.isFixed ? undefined : () => updateDailyRecord({ tasks: { ...dailyRecord.tasks, personal: tasks.filter(t => t.id !== task.id) } })}
              onClick={() => setEditingTask(task)}
              note={task.note}
            />
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <input 
            type="text" 
            placeholder="新增待办..."
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            className="flex-1 bg-stone-50 border border-stone-100 rounded-xl px-4 py-2 text-sm outline-none focus:border-amber-500 transition-all"
          />
          <button 
            onClick={handleAddTask}
            className="p-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors shadow-md shadow-amber-600/20"
          >
            <Plus size={20} />
          </button>
        </div>
      </Card>

      {/* Daily Planning & Journal */}
      <Card title="今日规划 & 复盘" icon={<PenTool className="text-indigo-500" size={20} />}>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-stone-400 mb-1 uppercase tracking-wider">今日规划</label>
            <textarea 
            value={personal.planning ?? ''}
              onChange={(e) => updatePersonal('planning', e.target.value)}
              className="w-full h-24 bg-stone-50 rounded-xl p-3 text-xs outline-none border border-stone-100 focus:border-indigo-500 transition-all"
              placeholder="写下今天的计划..."
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-400 mb-1 uppercase tracking-wider">今日复盘</label>
            <textarea 
            value={personal.journal ?? ''}
              onChange={(e) => updatePersonal('journal', e.target.value)}
              className="w-full h-24 bg-stone-50 rounded-xl p-3 text-xs outline-none border border-stone-100 focus:border-indigo-500 transition-all"
              placeholder="记录今天的想法 and 感悟..."
            />
          </div>
        </div>
      </Card>

      {/* Fitness & Weight */}
      <Card 
        title="健身记录" 
        icon={<Activity className="text-rose-500" size={20} />}
        onAdd={addFitness}
      >
        <div className="flex items-center gap-4 mb-4 bg-rose-50 p-3 rounded-2xl border border-rose-100">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-700">
            <Scale size={16} />
            <span>体重</span>
          </div>
          <input 
            type="number" 
            value={personal.weight ?? ''}
            onChange={(e) => updatePersonal('weight', parseFloat(e.target.value))}
            className="w-20 bg-white rounded-lg px-2 py-1 text-sm font-bold border border-rose-200 focus:border-rose-500 outline-none text-center"
            placeholder="kg"
          />
          <span className="text-xs text-rose-400">kg</span>
        </div>

        <div className="space-y-3">
          {personal.fitness?.map(f => (
            <div 
              key={f.id} 
              className="bg-stone-50 p-4 rounded-2xl border border-stone-100 relative group"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); deleteFitness(f.id); }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-stone-300 hover:text-red-500 transition-all"
              >
                <Trash2 size={16} />
              </button>
              <div 
                className="cursor-pointer"
                onClick={() => setEditingFitness(f)}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded-md text-[10px] font-bold">
                    {f.type === 'Strength' ? '力量' : f.type === 'Cardio' ? '有氧' : '瑜伽'}
                  </span>
                  <span className="text-xs font-bold text-stone-400">{f.duration} min</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {(f.exercises || []).map((ex, i) => (
                    <span key={i} className="px-2 py-0.5 bg-stone-200 text-stone-600 rounded text-[10px]">{ex}</span>
                  ))}
                </div>
                {f.details && (
                  <p className="text-[11px] text-stone-500 mb-1 line-clamp-2">{f.details}</p>
                )}
                <p className="text-[11px] text-stone-400 italic">感受: {f.feeling}</p>
              </div>
            </div>
          ))}
          {(!personal.fitness || personal.fitness.length === 0) && (
            <p className="text-center text-[10px] text-stone-400 py-4 italic">今日暂无运动记录</p>
          )}
        </div>
      </Card>

      {/* Sleep Log */}
      <Card title="睡眠记录" icon={<Moon className="text-indigo-600" size={20} />}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-stone-400 mb-1 uppercase">入睡时间</label>
              <input 
                type="time" 
                value={personal.sleep?.bedTime || ''}
                onChange={(e) => updatePersonal('sleep', { ...personal.sleep, bedTime: e.target.value })}
                className="w-full bg-stone-50 rounded-xl p-2 text-sm outline-none border border-stone-100 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-400 mb-1 uppercase">起床时间</label>
              <input 
                type="time" 
                value={personal.sleep?.wakeTime || ''}
                onChange={(e) => updatePersonal('sleep', { ...personal.sleep, wakeTime: e.target.value })}
                className="w-full bg-stone-50 rounded-xl p-2 text-sm outline-none border border-stone-100 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-stone-50 p-3 rounded-2xl border border-stone-100">
            <span className="text-xs font-bold text-stone-500">昨晚睡眠时长</span>
            <span className={clsx("text-lg font-black", sleepColor)}>
              {sleepDuration ? `${sleepDuration} 小时` : '--'}
            </span>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-400 mb-2 uppercase">睡眠质量</label>
            <div className="flex gap-2">
              {(['poor', 'fair', 'good', 'excellent'] as const).map(q => (
                <button
                  key={q}
                  onClick={() => updatePersonal('sleep', { ...personal.sleep, quality: q })}
                  className={clsx(
                    "flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all",
                    personal.sleep?.quality === q 
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20" 
                      : "bg-white text-stone-400 border-stone-100"
                  )}
                >
                  {q === 'poor' ? '差' : q === 'fair' ? '一般' : q === 'good' ? '好' : '极好'}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase">小憩记录</label>
              <button 
                onClick={() => {
                  const naps = personal.sleep?.naps || [];
                  updatePersonal('sleep', { ...personal.sleep, naps: [...naps, { id: crypto.randomUUID(), startTime: '13:00', endTime: '13:30', duration: 30, note: '' }] });
                }}
                className="p-1 bg-stone-100 text-stone-500 rounded-full hover:bg-stone-200"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {(personal.sleep?.naps || []).map(nap => (
                <div key={nap.id} className="bg-stone-50 p-3 rounded-xl border border-stone-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <Coffee size={14} className="text-stone-400" />
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input 
                        type="time" 
                        value={nap.startTime || ''}
                        onChange={(e) => {
                          const updated = personal.sleep?.naps.map(n => {
                            if (n.id === nap.id) {
                              const startTime = e.target.value;
                              const start = parseISO(`2000-01-01T${startTime}`);
                              let end = parseISO(`2000-01-01T${n.endTime}`);
                              if (isValid(start) && isValid(end)) {
                                if (end < start) end = addDays(end, 1);
                                const duration = differenceInMinutes(end, start);
                                return { ...n, startTime, duration };
                              }
                              return { ...n, startTime };
                            }
                            return n;
                          });
                          updatePersonal('sleep', { ...personal.sleep, naps: updated });
                        }}
                        className="bg-white rounded p-1 text-[10px] outline-none border border-stone-100"
                      />
                      <input 
                        type="time" 
                        value={nap.endTime || ''}
                        onChange={(e) => {
                          const updated = personal.sleep?.naps.map(n => {
                            if (n.id === nap.id) {
                              const endTime = e.target.value;
                              const start = parseISO(`2000-01-01T${n.startTime}`);
                              let end = parseISO(`2000-01-01T${endTime}`);
                              if (isValid(start) && isValid(end)) {
                                if (end < start) end = addDays(end, 1);
                                const duration = differenceInMinutes(end, start);
                                return { ...n, endTime, duration };
                              }
                              return { ...n, endTime };
                            }
                            return n;
                          });
                          updatePersonal('sleep', { ...personal.sleep, naps: updated });
                        }}
                        className="bg-white rounded p-1 text-[10px] outline-none border border-stone-100"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const updated = personal.sleep?.naps.filter(n => n.id !== nap.id);
                        updatePersonal('sleep', { ...personal.sleep, naps: updated });
                      }}
                      className="p-1 text-stone-300 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-stone-500 bg-stone-200 px-2 py-0.5 rounded-md">{nap.duration} min</span>
                    <input 
                      type="text" 
                      placeholder="情况记录..."
                      value={nap.note}
                      onChange={(e) => {
                        const updated = personal.sleep?.naps.map(n => n.id === nap.id ? { ...n, note: e.target.value } : n);
                        updatePersonal('sleep', { ...personal.sleep, naps: updated });
                      }}
                      className="flex-1 bg-transparent text-[10px] outline-none border-b border-transparent focus:border-stone-200"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Mood Log */}
      <Card title="心情日志" icon={<Smile className="text-yellow-500" size={20} />}>
        <div className="space-y-4">
          <div className="flex justify-around py-2">
            {(['happy', 'calm', 'angry', 'low'] as const).map(m => (
              <button
                key={m}
                onClick={() => updatePersonal('mood', { ...personal.mood, score: m })}
                className={clsx(
                  "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all",
                  personal.mood?.score === m ? "bg-yellow-100 scale-110" : "opacity-40 grayscale"
                )}
              >
                <span className="text-2xl">
                  {m === 'happy' ? '😊' : m === 'calm' ? '😐' : m === 'angry' ? '😡' : '😔'}
                </span>
                <span className="text-[10px] font-bold text-yellow-700">
                  {m === 'happy' ? '开心' : m === 'calm' ? '平静' : m === 'angry' ? '生气' : '低落'}
                </span>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-400 mb-1 uppercase">心情日记</label>
            <textarea 
              value={personal.mood?.diary || ''}
              onChange={(e) => updatePersonal('mood', { ...personal.mood, diary: e.target.value })}
              className="w-full h-24 bg-stone-50 rounded-xl p-3 text-xs outline-none border border-stone-100 focus:border-yellow-500"
              placeholder="此刻在想什么？"
            />
          </div>

          {personal.mood?.score && (
            <div className="space-y-3">
              <div className="bg-yellow-50 p-3 rounded-2xl border border-yellow-100">
                <div className="flex items-center gap-2 text-yellow-700 font-bold text-xs mb-1">
                  <Brain size={14} />
                  <span>心情建议</span>
                </div>
                <p className="text-[10px] text-yellow-600 leading-relaxed">
                  {personal.mood.score === 'happy' ? '太棒了！去分享你的快乐吧，或者奖励自己一个小甜品。' :
                   personal.mood.score === 'calm' ? '平静是最好的状态，适合冥想或阅读。' :
                   personal.mood.score === 'angry' ? '深呼吸，试着写下让你生气的原因，然后撕掉它。' :
                   '抱抱你，听首轻快的歌，或者早点休息，明天会更好。'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-stone-400 uppercase">推荐待办</label>
                <div className="flex flex-wrap gap-2">
                  {moodTasks.map((task, i) => (
                    <button
                      key={i}
                      onClick={() => handleAddMoodTask(task)}
                      className="px-3 py-1.5 bg-white border border-yellow-200 text-yellow-700 rounded-full text-[10px] font-bold hover:bg-yellow-50 transition-colors flex items-center gap-1"
                    >
                      <Plus size={12} /> {task}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Menstrual Tracking */}
      <Card title="经期管理" icon={<Heart className="text-rose-500" size={20} />}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100 text-center">
              <div className="text-[10px] text-rose-400 uppercase font-bold mb-1">当前阶段</div>
              <div className="text-lg font-black text-rose-600">{menstrualInfo?.phase || '--'}</div>
            </div>
            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 text-center">
              <div className="text-[10px] text-stone-400 uppercase font-bold mb-1">周期第几天</div>
              <div className="text-lg font-black text-stone-800">
                {menstrualInfo?.isPeriod ? `${menstrualInfo.cycleDay} 天` : '--'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-100">
            <label className="flex items-center gap-2 text-xs font-bold text-stone-600 cursor-pointer">
              <input 
                type="checkbox" 
                checked={personal.health?.isPeriod}
                onChange={(e) => updatePersonal('health', { ...personal.health, isPeriod: e.target.checked })}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              今日经期
            </label>
            {personal.health?.isPeriod && menstrualInfo && (
              <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold">
                第 {menstrualInfo.cycleDay} 天
              </span>
            )}
          </div>

          {menstrualInfo && (
            <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs mb-1">
                <AlertCircle size={14} />
                <span>健康小贴士</span>
              </div>
              <p className="text-[10px] text-rose-600 leading-relaxed">
                {menstrualInfo.tips}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Health Log */}
      <Card title="健康异常记录" icon={<Activity className="text-emerald-500" size={20} />}>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(['Digestive', 'Cold', 'Injury', 'Fever', 'Headache', 'Skin', 'Other'] as const).map(s => (
              <button
                key={s}
                onClick={() => {
                  const current = personal.health?.symptoms || [];
                  const updated = current.includes(s) 
                    ? current.filter(i => i !== s) 
                    : [...current, s];
                  updatePersonal('health', { ...personal.health, symptoms: updated });
                }}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all",
                  personal.health?.symptoms?.includes(s)
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                    : "bg-white text-stone-400 border-stone-200"
                )}
              >
                {symptomMap[s]}
              </button>
            ))}
          </div>
          <textarea 
            value={personal.health?.note ?? ''}
            onChange={(e) => updatePersonal('health', { ...personal.health, note: e.target.value })}
            className="w-full h-24 bg-stone-50 rounded-xl p-3 text-xs outline-none border border-stone-100 focus:border-emerald-500 transition-all"
            placeholder="详细记录身体不适..."
          />
        </div>
      </Card>

      {/* Fitness Modal */}
      <Modal 
        isOpen={!!editingFitness} 
        onClose={() => setEditingFitness(null)} 
        title="健身记录"
        onSave={saveFitness}
      >
        {editingFitness && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-400 mb-2">类型</label>
              <div className="flex gap-2">
                {(['Strength', 'Cardio', 'Yoga'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setEditingFitness({ ...editingFitness, type })}
                    className={clsx(
                      "flex-1 py-2 rounded-xl text-xs font-bold border transition-all",
                      editingFitness.type === type 
                        ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20" 
                        : "bg-stone-50 text-stone-400 border-stone-100"
                    )}
                  >
                    {type === 'Strength' ? '力量' : type === 'Cardio' ? '有氧' : '瑜伽'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold text-stone-400">时长 (min)</label>
              <input 
                type="number" 
                value={editingFitness.duration ?? 0}
                onChange={(e) => setEditingFitness({ ...editingFitness, duration: parseInt(e.target.value) || 0 })}
                className="flex-1 bg-stone-50 rounded-xl p-2 text-sm outline-none border border-stone-100 focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 mb-2">具体项目</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {fitnessPresets.map(p => (
                  <button
                    key={p}
                    onClick={() => {
                      const current = editingFitness.exercises || [];
                      const updated = current.includes(p) 
                        ? current.filter(i => i !== p) 
                        : [...current, p];
                      setEditingFitness({ ...editingFitness, exercises: updated });
                    }}
                    className={clsx(
                      "px-2 py-1 rounded-lg text-[10px] font-bold border transition-all",
                      editingFitness.exercises?.includes(p)
                        ? "bg-rose-100 text-rose-600 border-rose-200"
                        : "bg-white text-stone-400 border-stone-100"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <input 
                type="text" 
                value={(editingFitness.exercises || []).filter(ex => !fitnessPresets.includes(ex)).join(', ')}
                onChange={(e) => {
                  const customVals = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  const presets = (editingFitness.exercises || []).filter(ex => fitnessPresets.includes(ex));
                  setEditingFitness({ ...editingFitness, exercises: [...presets, ...customVals] });
                }}
                className="w-full bg-stone-50 rounded-xl p-3 text-sm outline-none border border-stone-100 focus:border-rose-500"
                placeholder="其他自填 (逗号分隔)..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 mb-2">训练详情</label>
              <textarea 
                value={editingFitness.details ?? ''}
                onChange={(e) => setEditingFitness({ ...editingFitness, details: e.target.value })}
                className="w-full h-20 bg-stone-50 rounded-xl p-3 text-sm outline-none border border-stone-100 focus:border-rose-500"
                placeholder="记录具体的动作、组数、重量等..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 mb-2">感受</label>
              <textarea 
                value={editingFitness.feeling ?? ''}
                onChange={(e) => setEditingFitness({ ...editingFitness, feeling: e.target.value })}
                className="w-full h-20 bg-stone-50 rounded-xl p-3 text-sm outline-none border border-stone-100 focus:border-rose-500"
                placeholder="今天状态如何？"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PersonalPage;
