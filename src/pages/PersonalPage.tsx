import React, { useState } from 'react';
import { Plus, Scale, Activity, Heart, Brain, PenTool, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Card, TaskItem, Modal } from '../components/UI';
import { DailyRecord, Task, FitnessLog, HealthLog } from '../types';

interface PageProps {
  dailyRecord: DailyRecord;
  updateDailyRecord: (record: Partial<DailyRecord>) => void;
}

const PersonalPage: React.FC<PageProps> = ({ dailyRecord, updateDailyRecord }) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingFitness, setEditingFitness] = useState<FitnessLog | null>(null);
  const [newTaskName, setNewTaskName] = useState('');

  const tasks = dailyRecord.tasks?.personal || [];
  const personal = dailyRecord.personal || { fitness: [], health: { symptoms: [] } };

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

      {/* Health Log */}
      <Card title="健康记录" icon={<Heart className="text-emerald-500" size={20} />}>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(['Menstrual', 'Digestive', 'Cold', 'Injury', 'Fever'] as const).map(s => (
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
                {s === 'Menstrual' ? '经期' : s === 'Digestive' ? '肠胃' : s === 'Cold' ? '感冒' : s === 'Injury' ? '受伤' : '发烧'}
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
