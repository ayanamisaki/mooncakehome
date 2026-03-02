import { useState, useEffect } from 'react';
import { AppState, DailyRecord, DEFAULT_DAILY_RECORD } from './types';
import { format, subDays } from 'date-fns';

const STORAGE_KEY = 'mooncake_home_data';

const INITIAL_STATE: AppState = {
  dailyData: {},
  restaurants: [],
  foodHistory: [],
  settings: {
    waterFilterLastChange: format(new Date(), 'yyyy-MM-dd'),
    catFoodMode: 'daily',
    catFoodDaily: {
      brand: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
    },
    catFoodTransition: {
      oldFood: '',
      newFood: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      reason: '',
      plan: [],
    }
  },
};

export function useStore() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure foodHistory exists for older versions
        if (!parsed.foodHistory) parsed.foodHistory = [];
        // Ensure settings exist
        if (!parsed.settings) parsed.settings = INITIAL_STATE.settings;
        return parsed;
      } catch (e) {
        console.error('Failed to parse storage', e);
      }
    }
    return INITIAL_STATE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const getDailyRecord = (dateStr: string): DailyRecord => {
    const base = DEFAULT_DAILY_RECORD();
    if (state.dailyData[dateStr]) {
      return {
        ...base,
        ...state.dailyData[dateStr],
        tasks: {
          ...base.tasks,
          ...state.dailyData[dateStr].tasks
        },
        cats: {
          ...base.cats,
          ...state.dailyData[dateStr].cats
        },
        personal: {
          ...base.personal,
          ...state.dailyData[dateStr].personal
        },
        dining: state.dailyData[dateStr].dining || [],
        entertainment: state.dailyData[dateStr].entertainment || []
      };
    }
    
    // For fish, try to inherit from previous day
    const prevDateStr = format(subDays(new Date(dateStr), 1), 'yyyy-MM-dd');
    const prevRecord = state.dailyData[prevDateStr];
    
    if (prevRecord) {
      base.fish = { ...prevRecord.fish };
    }
    
    return base;
  };

  const updateDailyRecord = (dateStr: string, record: Partial<DailyRecord>) => {
    setState(prev => ({
      ...prev,
      dailyData: {
        ...prev.dailyData,
        [dateStr]: {
          ...getDailyRecord(dateStr),
          ...record,
        },
      },
    }));
  };

  const updateSettings = (settings: Partial<AppState['settings']>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  };

  const addRestaurant = (res: Omit<AppState['restaurants'][0], 'id'>) => {
    setState(prev => ({
      ...prev,
      restaurants: [...prev.restaurants, { ...res, id: crypto.randomUUID() }],
    }));
  };

  const updateRestaurant = (res: AppState['restaurants'][0]) => {
    setState(prev => ({
      ...prev,
      restaurants: prev.restaurants.map(r => r.id === res.id ? res : r),
    }));
  };

  const deleteRestaurant = (id: string) => {
    setState(prev => ({
      ...prev,
      restaurants: prev.restaurants.filter(r => r.id !== id),
    }));
  };

  const importData = (json: string) => {
    try {
      const data = JSON.parse(json);
      setState(data);
      return true;
    } catch (e) {
      return false;
    }
  };

  return {
    state,
    getDailyRecord,
    updateDailyRecord,
    updateSettings,
    addRestaurant,
    updateRestaurant,
    deleteRestaurant,
    importData,
  };
}
