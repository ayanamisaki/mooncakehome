import { useState, useEffect } from 'react';
import { AppState, DailyRecord, DEFAULT_DAILY_RECORD } from './types';
import { format, subDays, addDays, differenceInDays, parseISO, isSameDay, isValid } from 'date-fns';

const STORAGE_KEY = 'mooncake_home_data';

const INITIAL_STATE: AppState = {
  dailyData: {},
  restaurants: [],
  foodHistory: [],
  gameReviews: [],
  menstrualRecords: [],
  settings: {
    waterFilterLastChange: format(new Date(), 'yyyy-MM-dd'),
    catFoodDaily: {
      brand: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      dailyGrams: 100,
    },
    catFoodTransition: undefined,
    catFoodRecords: [],
    menstrualSettings: {
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
        if (!parsed.gameReviews) parsed.gameReviews = [];
        if (!parsed.menstrualRecords) parsed.menstrualRecords = [];
        if (parsed.settings?.catFoodDaily && parsed.settings.catFoodDaily.dailyGrams === undefined) {
          parsed.settings.catFoodDaily.dailyGrams = 100;
        }
        if (!parsed.settings.catFoodRecords) parsed.settings.catFoodRecords = [];
        // Remove deprecated catFoodMode
        if (parsed.settings && 'catFoodMode' in parsed.settings) {
          delete parsed.settings.catFoodMode;
        }
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

    // Menstrual Auto-tracking Logic
    const lastStartStr = [...state.menstrualRecords].sort().reverse()[0];
    if (lastStartStr) {
      const lastStart = parseISO(lastStartStr);
      const today = parseISO(dateStr);
      if (isValid(lastStart) && isValid(today)) {
        const diff = differenceInDays(today, lastStart);
        const cycleDays = state.settings.menstrualSettings?.avgCycleDays || 28;
        const periodDays = state.settings.menstrualSettings?.avgPeriodDays || 7;
        
        const daysIntoCycle = diff % cycleDays;
        
        if (daysIntoCycle >= 0 && daysIntoCycle < periodDays) {
          base.personal.health.isPeriod = true;
        }
      }
    }

    // Cat Food Auto-switch
    const isTransitionDay = state.settings.catFoodTransition?.isActive && (() => {
      const startDate = parseISO(state.settings.catFoodTransition.startDate);
      const today = parseISO(dateStr);
      if (isValid(startDate) && isValid(today)) {
        const diff = differenceInDays(today, startDate);
        return diff >= 0 && diff < state.settings.catFoodTransition.plan.length;
      }
      return false;
    })();

    if (isTransitionDay) {
      // Logic for transition day if needed
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

  const addMenstrualRecord = (dateStr: string) => {
    setState(prev => ({
      ...prev,
      menstrualRecords: [...new Set([...prev.menstrualRecords, dateStr])]
    }));
  };

  const deleteMenstrualRecord = (dateStr: string) => {
    setState(prev => ({
      ...prev,
      menstrualRecords: prev.menstrualRecords.filter(d => d !== dateStr)
    }));
  };

  const addGameReview = (review: Omit<AppState['gameReviews'][0], 'id' | 'playRecords'>) => {
    setState(prev => ({
      ...prev,
      gameReviews: [...prev.gameReviews, { ...review, id: crypto.randomUUID(), playRecords: [] }]
    }));
  };

  const updateGameReview = (review: AppState['gameReviews'][0]) => {
    setState(prev => ({
      ...prev,
      gameReviews: prev.gameReviews.map(r => r.id === review.id ? review : r)
    }));
  };

  const deleteGameReview = (id: string) => {
    setState(prev => ({
      ...prev,
      gameReviews: prev.gameReviews.filter(r => r.id !== id)
    }));
  };

  const addGamePlayRecord = (reviewId: string, play: Omit<AppState['gameReviews'][0]['playRecords'][0], 'id'>) => {
    setState(prev => ({
      ...prev,
      gameReviews: prev.gameReviews.map(r => {
        if (r.id === reviewId) {
          return {
            ...r,
            playRecords: [...r.playRecords, { ...play, id: crypto.randomUUID() }]
          };
        }
        return r;
      })
    }));
  };

  const updateGamePlayRecord = (reviewId: string, play: AppState['gameReviews'][0]['playRecords'][0]) => {
    setState(prev => ({
      ...prev,
      gameReviews: prev.gameReviews.map(r => {
        if (r.id === reviewId) {
          return {
            ...r,
            playRecords: r.playRecords.map(p => p.id === play.id ? play : p)
          };
        }
        return r;
      })
    }));
  };

  const deleteGamePlayRecord = (reviewId: string, playId: string) => {
    setState(prev => ({
      ...prev,
      gameReviews: prev.gameReviews.map(r => {
        if (r.id === reviewId) {
          return {
            ...r,
            playRecords: r.playRecords.filter(p => p.id !== playId)
          };
        }
        return r;
      })
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
    addMenstrualRecord,
    deleteMenstrualRecord,
    addGameReview,
    updateGameReview,
    deleteGameReview,
    addGamePlayRecord,
    updateGamePlayRecord,
    deleteGamePlayRecord,
  };
}
