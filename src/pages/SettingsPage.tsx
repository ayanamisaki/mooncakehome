import React, { useRef, useState, useMemo } from 'react';
import { Settings, Download, Upload, FileSpreadsheet, Cat, Info, Plus, Trash2, Heart } from 'lucide-react';
import { clsx } from 'clsx';
import { Card } from '../components/UI';
import { AppState, CatFoodTransitionDay } from '../types';
import * as XLSX from 'xlsx';
import { format, parseISO, addDays, differenceInDays, isValid } from 'date-fns';

interface PageProps {
  state: AppState;
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  importData: (json: string) => boolean;
}

const SettingsPage: React.FC<PageProps> = ({ state, updateSettings, importData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      catFoodMode: 'transition',
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
  };

  const terminateTransition = () => {
    if (state.settings.catFoodTransition) {
      updateSettings({
        catFoodMode: 'daily',
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
      oldPercent: 75,
      newPercent: 25,
      totalGrams: 100
    };
    updateSettings({
      catFoodTransition: {
        ...state.settings.catFoodTransition!,
        plan: [...currentPlan, newDay]
      }
    });
  };

  const updateTransitionDay = (day: number, field: keyof CatFoodTransitionDay, value: number) => {
    const currentPlan = state.settings.catFoodTransition?.plan || [];
    const updatedPlan = currentPlan.map(p => {
      if (p.day === day) {
        const updated = { ...p, [field]: value };
        if (field === 'oldPercent') updated.newPercent = 100 - value;
        if (field === 'newPercent') updated.oldPercent = 100 - value;
        return updated;
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
    return format(addDays(start, (state.settings.catFoodTransition.plan.length || 1) - 1), 'yyyy-MM-dd');
  }, [state.settings.catFoodTransition]);

  return (
    <div className="space-y-4">
      {/* Cat Food Settings */}
      <Card title="猫粮系统设置" icon={<Cat className="text-amber-600" size={20} />}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-400 mb-2">当前模式</label>
            <div className="flex gap-2">
              <div className={clsx(
                "flex-1 py-2 rounded-xl text-xs font-bold text-center transition-all",
                state.settings.catFoodMode === 'daily' ? "bg-amber-600 text-white" : "bg-stone-100 text-stone-400"
              )}>
                日常模式
              </div>
              <div className={clsx(
                "flex-1 py-2 rounded-xl text-xs font-bold text-center transition-all",
                state.settings.catFoodMode === 'transition' ? "bg-amber-600 text-white" : "bg-stone-100 text-stone-400"
              )}>
                换粮模式
              </div>
            </div>
          </div>

          {state.settings.catFoodMode === 'transition' && state.settings.catFoodTransition?.isActive ? (
            <div className="space-y-4 bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-800">正在进行的换粮计划</h4>
                <button 
                  onClick={terminateTransition}
                  className="text-[10px] text-red-500 font-bold border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50"
                >
                  终止计划
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-amber-700 mb-1">旧粮名称</label>
                  <input 
                    type="text" 
                    value={state.settings.catFoodTransition?.oldFood || ''}
                    onChange={(e) => updateSettings({ catFoodTransition: { ...state.settings.catFoodTransition!, oldFood: e.target.value } })}
                    className="w-full bg-white rounded-lg p-2 text-xs outline-none border border-amber-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-700 mb-1">新粮名称</label>
                  <input 
                    type="text" 
                    value={state.settings.catFoodTransition?.newFood || ''}
                    onChange={(e) => updateSettings({ catFoodTransition: { ...state.settings.catFoodTransition!, newFood: e.target.value } })}
                    className="w-full bg-white rounded-lg p-2 text-xs outline-none border border-amber-200"
                  />
                </div>
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
              <div>
                <label className="block text-[10px] font-bold text-amber-700 mb-1">换粮理由</label>
                <textarea 
                  value={state.settings.catFoodTransition?.reason || ''}
                  onChange={(e) => updateSettings({ catFoodTransition: { ...state.settings.catFoodTransition!, reason: e.target.value } })}
                  className="w-full bg-white rounded-lg p-2 text-xs outline-none border border-amber-200 h-16"
                  placeholder="为什么要换粮？"
                />
              </div>

              <div className="pt-2 border-t border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">换粮计划 ({state.settings.catFoodTransition.plan.length} 天)</label>
                  <button 
                    onClick={addTransitionDay}
                    className="p-1 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(state.settings.catFoodTransition?.plan || []).sort((a,b) => a.day - b.day).map((p) => (
                    <div key={p.day} className="bg-white/50 p-2 rounded-xl border border-amber-100 flex items-center gap-2">
                      <div className="w-8 text-center font-bold text-amber-800 text-[10px]">D{p.day}</div>
                      <div className="flex-1 grid grid-cols-3 gap-1">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-amber-600 text-center">旧%</span>
                          <input 
                            type="number" 
                            value={p.oldPercent}
                            onChange={(e) => updateTransitionDay(p.day, 'oldPercent', parseInt(e.target.value) || 0)}
                            className="w-full bg-white rounded p-1 text-[10px] text-center outline-none border border-amber-100"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] text-amber-600 text-center">新%</span>
                          <input 
                            type="number" 
                            value={p.newPercent}
                            onChange={(e) => updateTransitionDay(p.day, 'newPercent', parseInt(e.target.value) || 0)}
                            className="w-full bg-white rounded p-1 text-[10px] text-center outline-none border border-amber-100"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] text-amber-600 text-center">总量g</span>
                          <input 
                            type="number" 
                            value={p.totalGrams}
                            onChange={(e) => updateTransitionDay(p.day, 'totalGrams', parseInt(e.target.value) || 0)}
                            className="w-full bg-white rounded p-1 text-[10px] text-center outline-none border border-amber-100"
                          />
                        </div>
                      </div>
                      <div className="w-12 text-center text-[8px] text-amber-700 leading-tight">
                        <div>旧:{(p.totalGrams * p.oldPercent / 100).toFixed(1)}g</div>
                        <div>新:{(p.totalGrams * p.newPercent / 100).toFixed(1)}g</div>
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
          ) : (
            <div className="space-y-4">
              <button 
                onClick={startNewTransition}
                className="w-full py-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-200 text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-100 transition-all"
              >
                <Plus size={16} /> 新增1次换粮计划
              </button>

              <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                <h4 className="text-[10px] font-bold text-stone-500 uppercase">日常模式设置</h4>
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
                    <label className="block text-[10px] font-bold text-stone-500 mb-1">开启日期</label>
                    <input 
                      type="date" 
                      value={state.settings.catFoodDaily?.startDate || format(new Date(), 'yyyy-MM-dd')}
                      onChange={(e) => updateSettings({ catFoodDaily: { ...state.settings.catFoodDaily!, startDate: e.target.value } })}
                      className="w-full bg-white rounded-lg p-2 text-xs outline-none border border-stone-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
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
