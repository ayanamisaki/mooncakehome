/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { 
  PawPrint, 
  Home, 
  User, 
  Gamepad2, 
  Utensils, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { useStore } from './store';
import PetPage from './pages/PetPage';
import HouseworkPage from './pages/HouseworkPage';
import PersonalPage from './pages/PersonalPage';
import EntertainmentPage from './pages/EntertainmentPage';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'pet' | 'housework' | 'personal' | 'entertainment' | 'gourmet' | 'stats' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('pet');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
  const { 
    state, 
    getDailyRecord, 
    updateDailyRecord, 
    updateSettings,
    addRestaurant,
    updateRestaurant,
    deleteRestaurant,
    importData
  } = useStore();

  const dailyRecord = useMemo(() => getDailyRecord(dateStr), [dateStr, state.dailyData]);

  const tabs = [
    { id: 'pet', icon: PawPrint, label: '宠物' },
    { id: 'housework', icon: Home, label: '家务' },
    { id: 'personal', icon: User, label: '个人' },
    { id: 'entertainment', icon: Gamepad2, label: '娱乐' },
    { id: 'stats', icon: BarChart3, label: '统计' },
    { id: 'settings', icon: Settings, label: '设置' },
  ];

  const renderPage = () => {
    const props = {
      dateStr,
      selectedDate,
      dailyRecord,
      updateDailyRecord: (record: any) => updateDailyRecord(dateStr, record),
      state,
      updateSettings,
      addRestaurant,
      updateRestaurant,
      deleteRestaurant,
      importData
    };

    switch (activeTab) {
      case 'pet': return <PetPage {...props} />;
      case 'housework': return <HouseworkPage {...props} />;
      case 'personal': return <PersonalPage {...props} />;
      case 'entertainment': return <EntertainmentPage {...props} />;
      case 'stats': return <StatsPage {...props} />;
      case 'settings': return <SettingsPage {...props} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-stone-50 text-stone-900 font-sans overflow-hidden">
      {/* Header with Date Picker */}
      <header className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <h1 className="text-lg font-bold text-stone-800 flex items-center gap-2">
          <span className="text-2xl">🥮</span> 小月饼之家
        </h1>
        <div className="flex items-center gap-2 bg-stone-100 rounded-full px-3 py-1">
          <button 
            onClick={() => setSelectedDate(prev => subDays(prev, 1))}
            className="p-1 hover:bg-stone-200 rounded-full transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-1 text-sm font-medium min-w-[100px] justify-center">
            <CalendarIcon size={14} className="text-stone-500" />
            {dateStr === format(new Date(), 'yyyy-MM-dd') ? '今天' : format(selectedDate, 'MM-dd')}
          </div>
          <button 
            onClick={() => setSelectedDate(prev => addDays(prev, 1))}
            className="p-1 hover:bg-stone-200 rounded-full transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4 scroll-smooth">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + dateStr}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-md mx-auto"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-2 py-1 flex justify-around items-center z-20 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 min-w-[56px] transition-all duration-200 relative",
                isActive ? "text-amber-600" : "text-stone-400"
              )}
            >
              <Icon size={20} className={cn("mb-1", isActive && "scale-110")} />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -top-1 w-8 h-1 bg-amber-600 rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
