import { useState, useEffect } from 'react';
import { AppState, DailyRecord, DEFAULT_DAILY_RECORD } from './types';
import { format, subDays, addDays, differenceInDays, parseISO, isSameDay, isValid } from 'date-fns';

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
    catFoodTransition: undefined,
    menstrualSettings: {
      lastStartDate: '',
      avgCycleDays: 28,
      avgPeriodDays: 7,
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
        entertainment: state.dailyData[dateStr].entertainment || [],
        catTreats: state.dailyData[dateStr].catTreats || [],
        catPlays: state.dailyData[dateStr].catPlays || [],
      };
    }
    
    // For fish, try to inherit from previous day
    const prevDateStr = format(subDays(new Date(dateStr), 1), 'yyyy-MM-dd');
    const prevRecord = state.dailyData[prevDateStr];
    
    if (prevRecord) {
      base.fish = { ...prevRecord.fish };
    }

    // Menstrual Auto-tracking
    if (state.settings.menstrualSettings?.lastStartDate) {
      const lastStart = parseISO(state.settings.menstrualSettings.lastStartDate);
      const today = parseISO(dateStr);
      if (isValid(lastStart) && isValid(today)) {
        const diff = differenceInDays(today, lastStart);
        if (diff >= 0 && diff < (state.settings.menstrualSettings.avgPeriodDays || 7)) {
          base.personal.health.isPeriod = true;
        }
      }
    }

    // Cat Food Auto-switch
    if (state.settings.catFoodMode === 'transition' && state.settings.catFoodTransition?.isActive) {
      const startDate = parseISO(state.settings.catFoodTransition.startDate);
      const today = parseISO(dateStr);
      if (isValid(startDate) && isValid(today)) {
        const planDays = state.settings.catFoodTransition.plan.length;
        if (differenceInDays(today, startDate) >= planDays) {
          // This is a bit tricky since we are in a getter. 
          // We should probably handle the actual state switch in a side effect or when updating.
        }
      }
    }
    
    return base;
  };

  const updateDailyRecord = (dateStr: string, record: Partial<DailyRecord>) => {
    // Check if period is being started
    if (record.personal?.health?.isPeriod === true) {
      const currentRecord = getDailyRecord(dateStr);
      if (!currentRecord.personal.health.isPeriod) {
        // Period just started today
        updateSettings({
          menstrualSettings: {
            lastStartDate: dateStr,
            avgCycleDays: state.settings.menstrualSettings?.avgCycleDays || 30,
            avgPeriodDays: state.settings.menstrualSettings?.avgPeriodDays || 7
          }
        });
      }
    }

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
