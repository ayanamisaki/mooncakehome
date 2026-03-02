import React, { useRef, useState } from 'react';
import { Settings, Download, Upload, FileSpreadsheet, Cat, Info, Plus, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Card } from '../components/UI';
import { AppState, CatFoodTransitionDay } from '../types';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

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
    const workbook = XLSX.utils.book_new();
    
    // Flatten daily data for export
    const dailyRows = Object.entries(state.dailyData).map(([date, record]) => ({
      日期: date,
      小月饼体重: record.cats.mooncake.weight || '',
      小月饼便便: record.cats.mooncake.poopCount,
      小月饼软便: record.cats.mooncake.isSoftPoop ? '是' : '否',
      小月饼呕吐: record.cats.mooncake.vomit || '',
      甜宝体重: record.cats.tianbao.weight || '',
      甜宝便便: record.cats.tianbao.poopCount,
      甜宝软便: record.cats.tianbao.isSoftPoop ? '是' : '否',
      甜宝呕吐: record.cats.tianbao.vomit || '',
      小觅体重: record.bird.weight || '',
      本人体重: record.personal.weight || '',
      本人症状: record.personal.health?.symptoms?.join(', ') || '',
      运动记录: record.personal.fitness?.map(f => `${f.type}(${f.duration}min)`).join('; ') || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dailyRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "每日记录");
    XLSX.writeFile(workbook, `mooncake_home_data_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const addTransitionDay = () => {
    const currentPlan = state.settings.catFoodTransition?.plan || [];
    const nextDay = currentPlan.length > 0 ? Math.max(...currentPlan.map(p => p.day)) + 1 : 1;
    const newDay: CatFoodTransitionDay = {
      day: nextDay,
      oldPercent: 75,
      newPercent: 25,
      totalGrams: 50
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

  return (
    <div className="space-y-4">
      {/* Cat Food Settings */}
      <Card title="猫粮系统设置" icon={<Cat className="text-amber-600" size={20} />}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-400 mb-2">当前模式</label>
            <div className="flex gap-2">
              {(['daily', 'transition'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => updateSettings({ catFoodMode: mode })}
                  className={clsx(
                    "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
                    state.settings.catFoodMode === mode 
                      ? "bg-amber-600 text-white" 
                      : "bg-stone-100 text-stone-400"
                  )}
                >
                  {mode === 'daily' ? '日常模式' : '换粮模式'}
                </button>
              ))}
            </div>
          </div>

          {state.settings.catFoodMode === 'transition' ? (
            <div className="space-y-4 bg-amber-50 p-4 rounded-2xl border border-amber-100">
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
                  <label className="block text-[10px] font-bold text-amber-700 mb-1">旧粮价格</label>
                  <input 
                    type="number" 
                    value={state.settings.catFoodTransition?.oldPrice || ''}
                    onChange={(e) => updateSettings({ catFoodTransition: { ...state.settings.catFoodTransition!, oldPrice: parseFloat(e.target.value) || 0 } })}
                    className="w-full bg-white rounded-lg p-2 text-xs outline-none border border-amber-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-700 mb-1">新粮价格</label>
                  <input 
                    type="number" 
                    value={state.settings.catFoodTransition?.newPrice || ''}
                    onChange={(e) => updateSettings({ catFoodTransition: { ...state.settings.catFoodTransition!, newPrice: parseFloat(e.target.value) || 0 } })}
                    className="w-full bg-white rounded-lg p-2 text-xs outline-none border border-amber-200"
                  />
                </div>
              </div>
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
                  <label className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">换粮计划</label>
                  <button 
                    onClick={addTransitionDay}
                    className="p-1 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="space-y-2">
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
                  {(!state.settings.catFoodTransition?.plan || state.settings.catFoodTransition.plan.length === 0) && (
                    <p className="text-center text-[10px] text-amber-400 italic py-2">点击 + 添加计划</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-100">
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
