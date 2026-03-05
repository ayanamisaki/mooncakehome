import React, { useRef, useState, useMemo } from 'react';
import { Settings, Download, Upload, FileSpreadsheet, Cat, Info, Plus, Trash2, Heart, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Card } from '../components/UI';
import { AppState, CatFoodTransitionDay, CatFoodRecord } from '../types';
import * as XLSX from 'xlsx';
import { format, parseISO, addDays, differenceInDays, isValid } from 'date-fns';

interface PageProps {
  state: AppState;
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  importData: (json: string) => boolean;
}

const SettingsPage: React.FC<PageProps> = ({ state, updateSettings, importData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingTransition, setIsEditingTransition] = useState(false);
  const [isEditingDaily, setIsEditingDaily] = useState(false);

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mooncake_home_backup_${format(new Date(), 'yyyyMMdd')}.json`;
    link.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importData(content)) {
        alert('导入成功！');
      } else {
        alert('导入失败，请检查文件格式。');
      }
    };
    reader.readAsText(file);
  };

  const handleExportExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // 1. Daily Records
      const dailyRows = Object.entries(state.dailyData).map(([date, record]) => ({
        日期: date,
        小月饼体重: record.cats?.mooncake?.weight || '',
        小月饼便便: record.cats?.mooncake?.poopCount || '',
        小月饼软便: record.cats?.mooncake?.isSoftPoop ? '是' : '否',
        小月饼呕吐: record.cats?.mooncake?.vomit || '',
        甜宝体重: record.cats?.tianbao?.weight || '',
        甜宝便便: record.cats?.tianbao?.poopCount || '',
        甜宝软便: record.cats?.tianbao?.isSoftPoop ? '是' : '否',
        甜宝呕吐: record.cats?.tianbao?.vomit || '',
        小觅体重: record.bird?.weight || '',
        本人体重: record.personal?.weight || '',
        本人症状: record.personal?.health?.symptoms?.join(', ') || '',
        经期: record.personal?.health?.isPeriod ? '是' : '否',
      }));
      if (dailyRows.length > 0) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(dailyRows), "每日记录");

      // 2. Tasks
      const taskRows: any[] = [];
      Object.entries(state.dailyData).forEach(([date, record]) => {
        if (record.tasks) {
          Object.entries(record.tasks).forEach(([category, tasks]) => {
            tasks.forEach(task => {
              taskRows.push({
                日期: date,
                分类: category,
                任务: task.name,
                状态: task.done ? '完成' : '待办',
                备注: task.note || ''
              });
              task.subTasks?.forEach(st => {
                taskRows.push({
                  日期: date,
                  分类: category,
                  任务: `  - ${st.name}`,
                  状态: st.done ? '完成' : '待办',
                  备注: ''
                });
              });
            });
          });
        }
      });
      if (taskRows.length > 0) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(taskRows), "任务清单");

      // 3. Fitness
      const fitnessRows: any[] = [];
      Object.entries(state.dailyData).forEach(([date, record]) => {
        record.personal?.fitness?.forEach(f => {
          fitnessRows.push({ 日期: date, 类型: f.type, 时长: f.duration, 项目: f.exercises?.join(', '), 详情: f.details || '', 感受: f.feeling });
        });
      });
      if (fitnessRows.length > 0) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(fitnessRows), "健身记录");

      // 4. Sleep
      const sleepRows: any[] = [];
      Object.entries(state.dailyData).forEach(([date, record]) => {
        if (record.personal?.sleep) {
          sleepRows.push({ 日期: date, 入睡: record.personal.sleep.bedTime || '', 起床: record.personal.sleep.wakeTime || '', 质量: record.personal.sleep.quality || '' });
        }
      });
      if (sleepRows.length > 0) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sleepRows), "睡眠记录");

      // 5. Mood
      const moodRows: any[] = [];
      Object.entries(state.dailyData).forEach(([date, record]) => {
        if (record.personal?.mood) {
          moodRows.push({ 日期: date, 心情: record.personal.mood.score, 日记: record.personal.mood.diary || '' });
        }
      });
      if (moodRows.length > 0) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(moodRows), "情绪记录");

      // 6. Entertainment
      const entRows: any[] = [];
      Object.entries(state.dailyData).forEach(([date, record]) => {
        record.entertainment?.forEach(e => {
          entRows.push({ 日期: date, 分类: e.category, 名称: e.name || '', 时长: e.duration, 评分: e.rating, 感受: e.feeling });
        });
      });
      if (entRows.length > 0) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(entRows), "娱乐记录");

      // 7. Dining
      const diningRows: any[] = [];
      Object.entries(state.dailyData).forEach(([date, record]) => {
        record.dining?.forEach(d => {
          const res = state.restaurants.find(r => r.id === d.restaurantId);
          diningRows.push({ 日期: date, 餐厅: res?.name || '', 消费: d.cost, 人数: d.peopleCount, 评分: d.rating, 菜品: d.dishes?.join(', ') });
        });
      });
      if (diningRows.length > 0) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(diningRows), "餐饮记录");

      // 8. Restaurants
      const resRows = state.restaurants.map(r => ({ 名称: r.name, 地址: r.address, 分类: r.category, 评分: r.rating, 招牌菜: r.dishes?.map(d => d.name).join(', ') }));
      if (resRows.length > 0) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(resRows), "餐厅库");

      XLSX.writeFile(workbook, `mooncake_home_full_data_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    } catch (error) {
      console.error('Excel Export Error:', error);
      alert('导出失败，请检查控制台错误。');
    }
  };

  const startNewTransition = () => {
    updateSettings({
      catFoodTransition: {
        id: crypto.randomUUID(),
        oldFood: '',
        newFood: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        reason: '',
        plan: [],
        isActive: true
      }
    });
    setIsEditingTransition(true);
  };

  const terminateTransition = () => {
    if (state.settings.catFoodTransition) {
      updateSettings({
        catFoodTransition: {
          ...state.settings.catFoodTransition,
          isActive: false
        }
      });
    }
  };

  const addTransitionDay = () => {
    const currentPlan = state.settings.catFoodTransition?.plan || [];
    const nextDay = currentPlan.length > 0 ? Math.max(...currentPlan.map(p => p.day)) + 1 : 1;
    const newDay: CatFoodTransitionDay = {
      day: nextDay,
      oldPercent: 50,
      newPercent: 50,
      totalGrams: 100,
      ratio: '5:5'
    };
    updateSettings({
      catFoodTransition: {
        ...state.settings.catFoodTransition!,
        plan: [...currentPlan, newDay]
      }
    });
  };

  const updateTransitionDay = (day: number, field: keyof CatFoodTransitionDay, value: any) => {
    const currentPlan = state.settings.catFoodTransition?.plan || [];
    const updatedPlan = currentPlan.map(p => {
      if (p.day === day) {
        if (field === 'ratio') {
          const [old, next] = (value as string).split(':').map(Number);
          const oldPercent = old * 10;
          const newPercent = next * 10;
          return { ...p, ratio: value as string, oldPercent, newPercent };
        }
        return { ...p, [field]: value };
      }
      return p;
    });
    updateSettings({
      catFoodTransition: {
        ...state.settings.catFoodTransition!,
        plan: updatedPlan
      }
    });
  };

  const removeTransitionDay = (day: number) => {
    const currentPlan = state.settings.catFoodTransition?.plan || [];
    updateSettings({
      catFoodTransition: {
        ...state.settings.catFoodTransition!,
        plan: currentPlan.filter(p => p.day !== day)
      }
    });
  };

  const transitionEndDate = useMemo(() => {
    if (!state.settings.catFoodTransition?.isActive || !state.settings.catFoodTransition?.startDate) return null;
    const start = parseISO(state.settings.catFoodTransition.startDate);
    if (!isValid(start)) return null;
    const planLength = state.settings.catFoodTransition.plan.length;
    if (planLength === 0) return format(start, 'yyyy-MM-dd');
    return format(addDays(start, planLength - 1), 'yyyy-MM-dd');
  }, [state.settings.catFoodTransition]);

  const catFoodMode = useMemo(() => {
    if (state.settings.catFoodTransition?.isActive) {
      const start = parseISO(state.settings.catFoodTransition.startDate);
      if (isValid(start)) {
        const diff = differenceInDays(new Date(), start);
        if (diff >= 0 && diff < state.settings.catFoodTransition.plan.length) {
          return 'transition';
        }
      }
    }
    return 'daily';
  }, [state.settings.catFoodTransition]);

  const ratios = ['1:9', '2:8', '3:7', '4:6', '5:5', '6:4', '7:3', '8:2', '9:1'];

  const addCatFoodRecord = () => {
    const newRecord: CatFoodRecord = {
      id: crypto.randomUUID(),
      brand: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      price: 0,
      dailyGrams: 100,
      isFinished: false
    };
    updateSettings({
      catFoodRecords: [...(state.settings.catFoodRecords || []), newRecord]
    });
  };

  const updateCatFoodRecord = (id: string, updates: Partial<CatFoodRecord>) => {
    updateSettings({
      catFoodRecords: state.settings.catFoodRecords.map(r => r.id === id ? { ...r, ...updates } : r)
    });
  };

  const deleteCatFoodRecord = (id: string) => {
    updateSettings({
      catFoodRecords: state.settings.catFoodRecords.filter(r => r.id !== id)
    });
  };

  const finishCatFoodRecord = (id: string) => {
    updateCatFoodRecord(id, { isFinished: true, endDate: format(new Date(), 'yyyy-MM-dd') });
  };

  return (
    <div className="space-y-4">
      {/* Cat Food Settings */}
      <Card title="猫粮系统设置" icon={<Cat className="text-amber-600" size={20} />}>
        <div className="space-y-6">
          {/* Transition Mode Section */}
          <div className="space-y-4 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <div className={clsx(
                  "w-2 h-2 rounded-full",
                  catFoodMode === 'transition' ? "bg-amber-500 animate-pulse" : "bg-stone-300"
                )} />
                <h4 className="text-sm font-bold text-amber-800">换粮模式设置</h4>
              </div>
              {state.settings.catFoodTransition?.isActive ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsEditingTransition(!isEditingTransition)}
                    className="text-[10px] text-amber-600 font-bold border border-amber-200 px-2 py-1 rounded-lg hover:bg-amber-100"
                  >
                    {isEditingTransition ? '保存' : '编辑'}
                  </button>
                  <button 
                    onClick={terminateTransition}
                    className="text-[10px] text-red-500 font-bold border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50"
                  >
                    终止
                  </button>
                </div>
              ) : (
                <button 
                  onClick={startNewTransition}
                  className="text-[10px] text-amber-600 font-bold border border-amber-200 px-2 py-1 rounded-lg hover:bg-amber-100"
                >
                  开启新计划
                </button>
              )}
            </div>

            {state.settings.catFoodTransition?.isActive ? (
              <div className="space-y-4">
                {!isEditingTransition ? (
                  <div className="grid grid-cols-2 gap-4 text-[10px] text-amber-700">
                    <div className="space-y-1">
                      <p><span className="opacity-60">旧粮：</span>{state.settings.catFoodTransition.oldFood || '--'}</p>
                      <p><span className="opacity-60">新粮：</span>{state.settings.catFoodTransition.newFood || '--'}</p>
                    </div>
                    <div className="space-y-1">
                      <p><span className="opacity-60">开始：</span>{state.settings.catFoodTransition.startDate}</p>
                      <p><span className="opacity-60">结束：</span>{transitionEndDate || '--'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-amber-700 mb-1">旧粮名称</label>
                        <select 
                          value={state.settings.catFoodTransition?.oldFood || ''}
                          onChange={(e) => updateSettings({ catFoodTransition: { ...state.settings.catFoodTransition!, oldFood: e.target.value } })}
                          className="w-full bg-white rounded-lg p-2 text-xs outline-none border border-amber-200"
                        >
                          <option value="">选择旧粮</option>
                          {(state.settings.catFoodRecords || []).map(r => (
                            <option key={r.id} value={r.brand}>{r.brand} ({r.startDate})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-700 mb-1">新粮名称</label>
                        <select 
                          value={state.settings.catFoodTransition?.newFood || ''}
                          onChange={(e) => updateSettings({ catFoodTransition: { ...state.settings.catFoodTransition!, newFood: e.target.value } })}
                          className="w-full bg-white rounded-lg p-2 text-xs outline-none border border-amber-200"
                        >
                          <option value="">选择新粮</option>
                          {(state.settings.catFoodRecords || []).map(r => (
                            <option key={r.id} value={r.brand}>{r.brand} ({r.startDate})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-700 mb-1">换粮理由</label>
                      <input 
                        type="text" 
                        value={state.settings.catFoodTransition?.reason || ''}
                        onChange={(e) => updateSettings({ catFoodTransition: { ...state.settings.catFoodTransition!, reason: e.target.value } })}
                        placeholder="例如：软便、泪痕、想换口味"
                        className="w-full bg-white rounded-lg p-2 text-xs outline-none border border-amber-200"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-amber-700 mb-1">开始日期</label>
                        <input 
                          type="date" 
                          value={state.settings.catFoodTransition?.startDate || format(new Date(), 'yyyy-MM-dd')}
                          onChange={(e) => updateSettings({ catFoodTransition: { ...state.settings.catFoodTransition!, startDate: e.target.value } })}
                          className="w-full bg-white rounded-lg p-2 text-xs outline-none border border-amber-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-700 mb-1">预计结束</label>
                        <div className="w-full bg-stone-100 rounded-lg p-2 text-xs text-stone-500 border border-stone-200">
                          {transitionEndDate || '-'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-amber-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">换粮计划 ({state.settings.catFoodTransition?.plan?.length || 0} 天)</label>
                        <button 
                          onClick={addTransitionDay}
                          className="p-1 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {(state.settings.catFoodTransition?.plan || []).sort((a,b) => a.day - b.day).map((p, idx) => (
                          <div key={idx} className="bg-white/50 p-2 rounded-xl border border-amber-100 flex items-center gap-2">
                            <div className="w-8 text-center font-bold text-amber-800 text-[10px]">D{p.day}</div>
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[8px] text-amber-600">总量 (g)</span>
                                <input 
                                  type="number" 
                                  value={p.totalGrams}
                                  onChange={(e) => updateTransitionDay(p.day, 'totalGrams', parseInt(e.target.value) || 0)}
                                  className="w-full bg-white rounded p-1 text-[10px] outline-none border border-amber-100"
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] text-amber-600">比例 (旧:新)</span>
                                <select 
                                  value={p.ratio || `${p.oldPercent/10}:${p.newPercent/10}`}
                                  onChange={(e) => updateTransitionDay(p.day, 'ratio', e.target.value)}
                                  className="w-full bg-white rounded p-1 text-[10px] outline-none border border-amber-100"
                                >
                                  {ratios.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                              </div>
                            </div>
                            <div className="w-16 text-center text-[8px] text-amber-700 leading-tight">
                              <div>旧: {(p.totalGrams * p.oldPercent / 100).toFixed(1)}g</div>
                              <div>新: {(p.totalGrams * p.newPercent / 100).toFixed(1)}g</div>
                            </div>
                            <button 
                              onClick={() => removeTransitionDay(p.day)}
                              className="p-1 text-amber-300 hover:text-red-500"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-stone-400 italic text-center py-2">当前无活跃的换粮计划</p>
            )}
          </div>

          {/* Cat Food Records Section */}
          <div className="space-y-4 bg-stone-50 p-4 rounded-2xl border border-stone-100">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <Cat className="text-stone-500" size={16} />
                <h4 className="text-sm font-bold text-stone-800">猫粮记录</h4>
              </div>
              <button 
                onClick={addCatFoodRecord}
                className="text-[10px] text-stone-600 font-bold flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-stone-200 shadow-sm"
              >
                <Plus size={12} /> 添加记录
              </button>
            </div>
            
            <div className="space-y-3">
              {state.settings.catFoodRecords.length === 0 ? (
                <p className="text-[10px] text-stone-400 italic text-center py-2">暂无猫粮记录</p>
              ) : (
                state.settings.catFoodRecords.sort((a,b) => b.startDate.localeCompare(a.startDate)).map(record => (
                  <div key={record.id} className={clsx(
                    "p-3 rounded-xl border transition-all",
                    record.isFinished ? "bg-stone-100 border-stone-200 opacity-60" : "bg-white border-stone-100 shadow-sm"
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <input 
                        type="text" 
                        value={record.brand}
                        onChange={(e) => updateCatFoodRecord(record.id, { brand: e.target.value })}
                        placeholder="品牌名称"
                        className="bg-transparent font-bold text-xs outline-none border-b border-transparent focus:border-stone-300 flex-1 mr-2"
                      />
                      <div className="flex items-center gap-2">
                        {!record.isFinished ? (
                          <button 
                            onClick={() => finishCatFoodRecord(record.id)}
                            className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 hover:bg-emerald-50 px-2 py-1 rounded-lg"
                          >
                            <CheckCircle2 size={12} /> 吃完啦
                          </button>
                        ) : (
                          <span className="text-[10px] text-stone-400 font-bold">已吃完 ({record.endDate})</span>
                        )}
                        <button 
                          onClick={() => deleteCatFoodRecord(record.id)}
                          className="text-stone-300 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-stone-400">启封日期</span>
                        <input 
                          type="date" 
                          value={record.startDate}
                          onChange={(e) => updateCatFoodRecord(record.id, { startDate: e.target.value })}
                          className="bg-transparent text-[10px] outline-none"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] text-stone-400">价格 (元)</span>
                        <input 
                          type="number" 
                          value={record.price}
                          onChange={(e) => updateCatFoodRecord(record.id, { price: parseFloat(e.target.value) || 0 })}
                          className="bg-transparent text-[10px] outline-none"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] text-stone-400">日常量 (g)</span>
                        <input 
                          type="number" 
                          value={record.dailyGrams}
                          onChange={(e) => updateCatFoodRecord(record.id, { dailyGrams: parseInt(e.target.value) || 0 })}
                          className="bg-transparent text-[10px] outline-none"
                        />
                      </div>
                      {record.isFinished && (
                        <div className="flex flex-col">
                          <span className="text-[8px] text-stone-400">吃完日期</span>
                          <span className="text-[10px]">{record.endDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Daily Mode Section */}
          <div className="space-y-4 bg-stone-50 p-4 rounded-2xl border border-stone-100">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <div className={clsx(
                  "w-2 h-2 rounded-full",
                  catFoodMode === 'daily' ? "bg-emerald-500 animate-pulse" : "bg-stone-300"
                )} />
                <h4 className="text-sm font-bold text-stone-800">日常模式设置</h4>
              </div>
              <button 
                onClick={() => setIsEditingDaily(!isEditingDaily)}
                className="text-[10px] text-stone-400 font-bold hover:text-stone-600"
              >
                {isEditingDaily ? '完成' : '修改'}
              </button>
            </div>
            
            {!isEditingDaily ? (
              <div className="grid grid-cols-2 gap-4 text-[10px] text-stone-600">
                <div className="space-y-1">
                  <p><span className="opacity-60">品牌：</span>{state.settings.catFoodDaily?.brand || '--'}</p>
                  <p><span className="opacity-60">价格：</span>{state.settings.catFoodDaily?.price || 0} 元</p>
                </div>
                <div className="space-y-1">
                  <p><span className="opacity-60">启封：</span>{state.settings.catFoodDaily?.startDate || '--'}</p>
                  <p><span className="opacity-60">日常量：</span>{state.settings.catFoodDaily?.dailyGrams || 100}g</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">猫粮品牌</label>
                  <input 
                    type="text" 
                    value={state.settings.catFoodDaily?.brand || ''}
                    onChange={(e) => updateSettings({ catFoodDaily: { ...state.settings.catFoodDaily!, brand: e.target.value } })}
                    className="w-full bg-white rounded-lg p-2 text-xs outline-none border border-stone-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-1">价格</label>
                    <input 
                      type="number" 
                      value={state.settings.catFoodDaily?.price || ''}
                      onChange={(e) => updateSettings({ catFoodDaily: { ...state.settings.catFoodDaily!, price: parseFloat(e.target.value) || 0 } })}
                      className="w-full bg-white rounded-lg p-2 text-xs outline-none border border-stone-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-1">日常量 (g)</label>
                    <input 
                      type="number" 
                      value={state.settings.catFoodDaily?.dailyGrams || 100}
                      onChange={(e) => updateSettings({ catFoodDaily: { ...state.settings.catFoodDaily!, dailyGrams: parseInt(e.target.value) || 0 } })}
                      className="w-full bg-white rounded-lg p-2 text-xs outline-none border border-stone-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">启封日期</label>
                  <input 
                    type="date" 
                    value={state.settings.catFoodDaily?.startDate || format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => updateSettings({ catFoodDaily: { ...state.settings.catFoodDaily!, startDate: e.target.value } })}
                    className="w-full bg-white rounded-lg p-2 text-xs outline-none border border-stone-200"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Data Management */}
      <Card title="数据管理" icon={<Settings className="text-stone-500" size={20} />}>
        <div className="space-y-3">
          <button 
            onClick={handleExportJSON}
            className="w-full flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 hover:bg-stone-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Download size={20} className="text-blue-500" />
              <div className="text-left">
                <div className="text-sm font-bold text-stone-800">备份数据 (JSON)</div>
                <div className="text-[10px] text-stone-400">下载当前所有记录的备份文件</div>
              </div>
            </div>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 hover:bg-stone-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Upload size={20} className="text-emerald-500" />
              <div className="text-left">
                <div className="text-sm font-bold text-stone-800">恢复数据 (JSON)</div>
                <div className="text-[10px] text-stone-400">从备份文件恢复所有记录</div>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportJSON} 
              className="hidden" 
              accept=".json"
            />
          </button>

          <button 
            onClick={handleExportExcel}
            className="w-full flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 hover:bg-stone-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={20} className="text-green-600" />
              <div className="text-left">
                <div className="text-sm font-bold text-stone-800">导出表格 (Excel)</div>
                <div className="text-[10px] text-stone-400">导出为 .xlsx 格式方便查看</div>
              </div>
            </div>
          </button>
        </div>
      </Card>

      <div className="text-center py-4">
        <p className="text-[10px] text-stone-400 flex items-center justify-center gap-1">
          <Info size={12} /> 所有数据均保存在本地浏览器 LocalStorage
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
