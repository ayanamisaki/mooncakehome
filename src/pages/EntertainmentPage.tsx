import React, { useState } from 'react';
import { Gamepad2, Plus, Star, Trash2, Clock, Utensils, MapPin, History } from 'lucide-react';
import { Card, Modal } from '../components/UI';
import { DailyRecord, EntertainmentLog, Restaurant, DiningLog, AppState } from '../types';
import { clsx } from 'clsx';

interface PageProps {
  dailyRecord: DailyRecord;
  updateDailyRecord: (record: Partial<DailyRecord>) => void;
  state: AppState;
  addRestaurant: (res: Omit<Restaurant, 'id'>) => void;
  updateRestaurant: (res: Restaurant) => void;
  deleteRestaurant: (id: string) => void;
}

const EntertainmentPage: React.FC<PageProps> = ({ 
  dailyRecord, 
  updateDailyRecord,
  state,
  addRestaurant,
  updateRestaurant,
  deleteRestaurant
}) => {
  const [isAddingEnt, setIsAddingEnt] = useState(false);
  const [isAddingRestaurant, setIsAddingRestaurant] = useState(false);
  const [isAddingDining, setIsAddingDining] = useState(false);
  
  const [newLog, setNewLog] = useState<Partial<EntertainmentLog>>({
    category: 'CS',
    rating: 5,
    duration: 60
  });
  const [newRes, setNewRes] = useState<Partial<Restaurant>>({ category: 'NPC', rating: 5 });
  const [newDining, setNewDining] = useState<Partial<DiningLog>>({ rating: 5, cost: 0, peopleCount: 1 });

  const entLogs = dailyRecord.entertainment || [];
  const diningLogs = dailyRecord.dining || [];
  const restaurants = state.restaurants || [];

  const handleAddEntLog = () => {
    if (!newLog.name || !newLog.category) return;
    updateDailyRecord({
      entertainment: [...entLogs, newLog as EntertainmentLog]
    });
    setIsAddingEnt(false);
    setNewLog({ category: 'CS', rating: 5, duration: 60 });
  };

  const handleDeleteEntLog = (index: number) => {
    updateDailyRecord({
      entertainment: entLogs.filter((_, i) => i !== index)
    });
  };

  const handleAddRestaurant = () => {
    if (!newRes.name || !newRes.category) return;
    addRestaurant(newRes as Omit<Restaurant, 'id'>);
    setIsAddingRestaurant(false);
    setNewRes({ category: 'NPC', rating: 5 });
  };

  const handleAddDining = () => {
    if (!newDining.restaurantId) return;
    updateDailyRecord({
      dining: [...diningLogs, { dishes: [], ...newDining, id: crypto.randomUUID(), date: new Date().toISOString() } as DiningLog]
    });
    setIsAddingDining(false);
    setNewDining({ rating: 5, cost: 0, peopleCount: 1 });
  };

  const handleDeleteDining = (id: string) => {
    updateDailyRecord({
      dining: diningLogs.filter(d => d.id !== id)
    });
  };

  const entCategories = [
    { id: 'CS', label: 'CS' },
    { id: 'Single', label: '单机' },
    { id: 'Anime', label: '动漫' },
    { id: 'Series', label: '剧集' },
    { id: 'Movie', label: '电影' },
    { id: 'Outing', label: '外出' },
  ];

  const resCategories = [
    { id: '夯', label: '夯' },
    { id: '人上人', label: '人上人' },
    { id: 'NPC', label: 'NPC' },
    { id: '拉完了', label: '拉完了' },
  ];

  return (
    <div className="space-y-4">
      {/* Entertainment Logs */}
      <Card 
        title="娱乐记录" 
        icon={<Gamepad2 className="text-purple-500" size={20} />}
        onAdd={() => setIsAddingEnt(true)}
      >
        {entLogs.length === 0 ? (
          <div className="text-center py-8 text-stone-400 text-sm italic">
            今天还没有娱乐记录哦~
          </div>
        ) : (
          <div className="space-y-3">
            {entLogs.map((log, index) => (
              <div key={index} className="bg-stone-50 rounded-2xl p-4 border border-stone-100 relative group">
                <button 
                  onClick={() => handleDeleteEntLog(index)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-stone-300 hover:text-red-500 transition-all"
                >
                  <Trash2 size={16} />
                </button>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded-md text-[10px] font-bold">
                    {entCategories.find(c => c.id === log.category)?.label}
                  </span>
                  <h4 className="font-bold text-stone-800 text-sm">{log.name}</h4>
                </div>
                <div className="flex items-center gap-4 text-xs text-stone-500">
                  <div className="flex items-center gap-1">
                    <Clock size={12} /> {log.duration} 分钟
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={12} 
                        className={i < log.rating ? "fill-amber-400 text-amber-400" : "text-stone-300"} 
                      />
                    ))}
                  </div>
                </div>
                {log.note && (
                  <p className="mt-2 text-xs text-stone-600 italic">"{log.note}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Restaurant Database */}
      <Card 
        title="饭店库" 
        icon={<Utensils className="text-orange-500" size={20} />}
        onAdd={() => setIsAddingRestaurant(true)}
      >
        <div className="grid grid-cols-2 gap-2">
          {resCategories.map(cat => (
            <div key={cat.id} className="space-y-2">
              <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-1">{cat.label}</h4>
              <div className="space-y-1.5">
                {restaurants.filter(r => r.category === cat.id).map(res => (
                  <div key={res.id} className="bg-stone-50 rounded-xl p-2 border border-stone-100 group relative">
                    <button 
                      onClick={() => deleteRestaurant(res.id)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 text-stone-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="font-bold text-xs text-stone-800 truncate">{res.name}</div>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={8} 
                          className={i < res.rating ? "fill-orange-400 text-orange-400" : "text-stone-300"} 
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Dining Logs */}
      <Card 
        title="用餐流水" 
        icon={<History className="text-amber-600" size={20} />}
        onAdd={() => setIsAddingDining(true)}
      >
        {diningLogs.length === 0 ? (
          <div className="text-center py-8 text-stone-400 text-sm italic">
            今天还没有用餐记录哦~
          </div>
        ) : (
          <div className="space-y-3">
            {diningLogs.map((log) => {
              const res = restaurants.find(r => r.id === log.restaurantId);
              return (
                <div key={log.id} className="bg-stone-50 rounded-2xl p-4 border border-stone-100 relative group">
                  <button 
                    onClick={() => handleDeleteDining(log.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-stone-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-stone-800 text-sm">{res?.name || '未知饭店'}</h4>
                    <span className="text-xs font-bold text-orange-600">¥{log.cost} / {log.peopleCount}人</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(log.dishes || []).map((dish, i) => (
                      <span key={i} className="px-2 py-0.5 bg-stone-200 text-stone-600 rounded text-[10px]">{dish}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={12} 
                        className={i < log.rating ? "fill-orange-400 text-orange-400" : "text-stone-300"} 
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modals */}
      <Modal 
        isOpen={isAddingEnt} 
        onClose={() => setIsAddingEnt(false)} 
        title="新增娱乐记录"
        onSave={handleAddEntLog}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-400 mb-2">分类</label>
            <div className="grid grid-cols-3 gap-2">
              {entCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setNewLog({ ...newLog, category: cat.id as any })}
                  className={clsx(
                    "py-2 rounded-xl text-xs font-bold transition-all",
                    newLog.category === cat.id 
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/20" 
                      : "bg-stone-100 text-stone-400"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-400 mb-2">名称</label>
            <input 
              type="text" 
              value={newLog.name || ''}
              onChange={(e) => setNewLog({ ...newLog, name: e.target.value })}
              className="w-full bg-stone-50 rounded-xl p-3 text-sm outline-none border border-stone-100 focus:border-purple-500 transition-all"
              placeholder="游戏、动漫或电影名称..."
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-stone-400 mb-2">时长 (分钟)</label>
              <input 
                type="number" 
                value={newLog.duration || ''}
                onChange={(e) => setNewLog({ ...newLog, duration: parseInt(e.target.value) || 0 })}
                className="w-full bg-stone-50 rounded-xl p-3 text-sm outline-none border border-stone-100 focus:border-purple-500 transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-stone-400 mb-2">评分</label>
              <div className="flex items-center gap-1 h-[46px]">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setNewLog({ ...newLog, rating: star })}
                    className="p-1"
                  >
                    <Star 
                      size={24} 
                      className={star <= (newLog.rating || 0) ? "fill-amber-400 text-amber-400" : "text-stone-300"} 
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-400 mb-2">评价 / 感受</label>
            <textarea 
              value={newLog.note || ''}
              onChange={(e) => setNewLog({ ...newLog, note: e.target.value })}
              className="w-full h-24 bg-stone-50 rounded-xl p-3 text-sm outline-none border border-stone-100 focus:border-purple-500 transition-all"
              placeholder="记录你的评价或感受..."
            />
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isAddingRestaurant} 
        onClose={() => setIsAddingRestaurant(false)} 
        title="新增饭店"
        onSave={handleAddRestaurant}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-400 mb-2">分类</label>
            <div className="grid grid-cols-4 gap-2">
              {resCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setNewRes({ ...newRes, category: cat.id as any })}
                  className={clsx(
                    "py-2 rounded-xl text-xs font-bold transition-all",
                    newRes.category === cat.id 
                      ? "bg-orange-600 text-white shadow-md shadow-orange-600/20" 
                      : "bg-stone-100 text-stone-400"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-400 mb-2">饭店名称</label>
            <input 
              type="text" 
              value={newRes.name || ''}
              onChange={(e) => setNewRes({ ...newRes, name: e.target.value })}
              className="w-full bg-stone-50 rounded-xl p-3 text-sm outline-none border border-stone-100 focus:border-orange-500 transition-all"
              placeholder="输入饭店名称..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-400 mb-2">地址</label>
            <div className="flex items-center gap-2 bg-stone-50 rounded-xl px-3 border border-stone-100 focus-within:border-orange-500 transition-all">
              <MapPin size={16} className="text-stone-400" />
              <input 
                type="text" 
                value={newRes.address || ''}
                onChange={(e) => setNewRes({ ...newRes, address: e.target.value })}
                className="flex-1 py-3 text-sm outline-none bg-transparent"
                placeholder="饭店地址..."
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-400 mb-2">总评</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setNewRes({ ...newRes, rating: star })}
                  className="p-1"
                >
                  <Star 
                    size={24} 
                    className={star <= (newRes.rating || 0) ? "fill-orange-400 text-orange-400" : "text-stone-300"} 
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isAddingDining} 
        onClose={() => setIsAddingDining(false)} 
        title="新增用餐流水"
        onSave={handleAddDining}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-400 mb-2">选择饭店</label>
            <select 
              value={newDining.restaurantId || ''}
              onChange={(e) => setNewDining({ ...newDining, restaurantId: e.target.value })}
              className="w-full bg-stone-50 rounded-xl p-3 text-sm outline-none border border-stone-100 focus:border-orange-500 transition-all appearance-none"
            >
              <option value="">请选择饭店...</option>
              {restaurants.map(res => (
                <option key={res.id} value={res.id}>{res.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-400 mb-2">菜品 (逗号分隔)</label>
            <input 
              type="text" 
              placeholder="招牌菜1, 招牌菜2..."
              value={(newDining.dishes || []).join(', ')}
              onChange={(e) => {
                const val = e.target.value || '';
                setNewDining({ ...newDining, dishes: val.split(',').map(s => s.trim()).filter(Boolean) });
              }}
              className="w-full bg-stone-50 rounded-xl p-3 text-sm outline-none border border-stone-100 focus:border-orange-500 transition-all"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-stone-400 mb-2">消费金额</label>
              <input 
                type="number" 
                value={newDining.cost || ''}
                onChange={(e) => setNewDining({ ...newDining, cost: parseFloat(e.target.value) || 0 })}
                className="w-full bg-stone-50 rounded-xl p-3 text-sm outline-none border border-stone-100 focus:border-orange-500 transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-stone-400 mb-2">人数</label>
              <input 
                type="number" 
                value={newDining.peopleCount || ''}
                onChange={(e) => setNewDining({ ...newDining, peopleCount: parseInt(e.target.value) || 1 })}
                className="w-full bg-stone-50 rounded-xl p-3 text-sm outline-none border border-stone-100 focus:border-orange-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-400 mb-2">菜品星级</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setNewDining({ ...newDining, rating: star })}
                  className="p-1"
                >
                  <Star 
                    size={24} 
                    className={star <= (newDining.rating || 0) ? "fill-orange-400 text-orange-400" : "text-stone-300"} 
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EntertainmentPage;
