import { format } from 'date-fns';

export type Task = {
  id: string;
  name: string;
  done: boolean;
  note?: string;
  subTasks?: Task[];
  isFixed?: boolean;
};

export type CatFoodTransitionDay = {
  day: number;
  oldPercent: number;
  newPercent: number;
  totalGrams: number;
  ratio?: string;
};

export type CatFoodTransition = {
  id: string;
  oldFood: string;
  newFood: string;
  oldPrice?: number;
  newPrice?: number;
  startDate: string;
  reason: string;
  plan: CatFoodTransitionDay[];
  isActive: boolean;
};

export type CatFoodDaily = {
  brand: string;
  price?: number;
  startDate: string;
  estimatedDays?: number;
  dailyGrams?: number;
};

export type CatFoodHistory = {
  id: string;
  brand: string;
  startDate: string;
  endDate?: string;
  reason?: string;
  type: 'daily' | 'transition';
};

export type CatHealthLog = {
  poopCount: number | null;
  peeCount: number | null;
  isSoftPoop: boolean;
  weight?: number | null;
  vomit?: 'hairball' | 'no-hairball' | 'none';
  healthNote?: string;
};

export type CatTreatType = '冻干' | '猫条' | '罐头';
export type CatTreat = {
  id: string;
  catName: 'mooncake' | 'tianbao';
  type: CatTreatType;
  brand?: string;
  quantity?: number;
};

export type CatPlayType = '绳子' | '柳条' | '藏东西' | '捉迷藏';
export type CatPlay = {
  id: string;
  catName: 'mooncake' | 'tianbao';
  type: CatPlayType;
  duration: number;
};

export type BirdAnomaly = 'watery-poop' | 'lethargy' | 'injury' | 'egg-laying' | 'other';

export type BirdLog = {
  weight?: number | null;
  healthNote?: string;
  anomalies?: BirdAnomaly[];
  customAnomaly?: string;
};

export type FishCount = {
  motherMale: number | null;
  motherFemale: number | null;
  medium: number | null;
  small: number | null;
};

export type FitnessLog = {
  id: string;
  duration: number;
  type: 'Strength' | 'Cardio' | 'Yoga';
  exercises: string[];
  details?: string;
  feeling: string;
};

export type HealthLog = {
  symptoms: string[];
  note?: string;
  isPeriod?: boolean;
};

export type SleepNap = {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  note?: string;
};

export type SleepLog = {
  bedTime?: string; // Previous night
  wakeTime?: string;
  quality?: 'good' | 'fair' | 'poor';
  naps: SleepNap[];
};

export type MoodLog = {
  score: 'happy' | 'calm' | 'angry' | 'low';
  diary?: string;
  suggestions?: string[];
  tasks?: string[];
};

export type EntertainmentLog = {
  category: 'CS' | 'Single' | 'Anime' | 'Series' | 'Movie' | 'Outing';
  name?: string;
  duration: number;
  rating: number;
  note?: string;
  feeling: string;
};

export type Dish = {
  id: string;
  name: string;
};

export type Restaurant = {
  id: string;
  name: string;
  address: string;
  category: '夯' | '人上人' | 'NPC' | '拉完了';
  rating: number;
  dishes: Dish[];
};

export type DishRating = {
  dishId: string;
  rating: number;
};

export type DiningLog = {
  id: string;
  restaurantId: string;
  date: string;
  cost: number;
  peopleCount: number;
  rating: number;
  dishes: string[];
  dishRatings: DishRating[];
};

export type DailyRecord = {
  tasks: Record<string, Task[]>;
  cats: {
    mooncake: CatHealthLog;
    tianbao: CatHealthLog;
  };
  bird: BirdLog;
  fish: FishCount;
  personal: {
    journal?: string;
    planning?: string;
    weight?: number;
    fitness: FitnessLog[];
    health: HealthLog;
    sleep?: SleepLog;
    mood?: MoodLog;
  };
  entertainment: EntertainmentLog[];
  dining: DiningLog[];
  catTreats: CatTreat[];
  catPlays: CatPlay[];
  waterFilterMold?: 'pink' | 'black' | 'green' | 'none';
};

export type GamePlayRecord = {
  id: string;
  date: string;
  feeling: string;
  rating: number;
};

export type GameReview = {
  id: string;
  name: string;
  description: string;
  avgDuration: number;
  rating: number;
  playRecords: GamePlayRecord[];
};

export type CatFoodRecord = {
  id: string;
  brand: string;
  startDate: string;
  endDate?: string;
  price: number;
  dailyGrams: number;
  isFinished: boolean;
};

export type AppState = {
  dailyData: Record<string, DailyRecord>;
  restaurants: Restaurant[];
  foodHistory: CatFoodHistory[];
  gameReviews: GameReview[];
  menstrualRecords: string[]; // List of start dates
  settings: {
    waterFilterLastChange: string;
    catFoodTransition?: CatFoodTransition;
    catFoodDaily?: CatFoodDaily;
    catFoodRecords: CatFoodRecord[];
    menstrualSettings?: {
      avgCycleDays: number;
      avgPeriodDays: number;
    };
  };
};

export const FIXED_TASKS = {
  cat: [
    {
      id: 'cat-water',
      name: '换水',
      done: false,
      isFixed: true,
      subTasks: [
        { id: 'cat-water-1', name: '清洗饮水机（擦干触针）', done: false },
        { id: 'cat-water-2', name: '倒入凉白开', done: false },
        { id: 'cat-water-3', name: '检查是否正常出水', done: false },
        { id: 'cat-water-4', name: '准备凉白开', done: false },
      ]
    },
    { id: 'cat-food', name: '喂饭', done: false, isFixed: true },
    {
      id: 'cat-poop',
      name: '铲屎',
      done: false,
      isFixed: true,
      subTasks: [
        { id: 'cat-poop-1', name: '铲屎', done: false },
        { id: 'cat-poop-2', name: '检查是否需要加猫砂', done: false },
        { id: 'cat-poop-3', name: '加猫砂', done: false },
      ]
    },
    {
      id: 'cat-brush',
      name: '刷牙',
      done: false,
      isFixed: true,
      subTasks: [
        { id: 'cat-brush-1', name: '小月饼刷牙', done: false },
        { id: 'cat-brush-2', name: '甜宝刷牙', done: false },
        { id: 'cat-brush-3', name: '小月饼扣牙结石', done: false },
      ]
    }
  ],
  bird: [
    { id: 'bird-food', name: '饭：加一勺鸟粮', done: false, isFixed: true },
    { id: 'bird-water', name: '水', done: false, isFixed: true },
    { id: 'bird-fly', name: '放飞', done: false, isFixed: true },
  ],
  fish: [
    { id: 'fish-guppy', name: '孔雀鱼：2个鱼缸各1勺鱼粮', done: false, isFixed: true },
    { id: 'fish-kitchen', name: '厨房鱼：0.25勺鱼粮', done: false, isFixed: true },
  ],
  housework: [
    { id: 'hw-1', name: '加湿器加满水', done: false, isFixed: true },
    { id: 'hw-2', name: '扫地', done: false, isFixed: true },
    { id: 'hw-3', name: '拖地', done: false, isFixed: true },
    { id: 'hw-4', name: '洗锅洗碗', done: false, isFixed: true },
    { id: 'hw-5', name: '擦桌子：书桌x2、矮桌、卡比桌、电视架', done: false, isFixed: true },
    { id: 'hw-6', name: '刷马桶', done: false, isFixed: true },
    { id: 'hw-7', name: '擦水池、洗衣机', done: false, isFixed: true },
    { id: 'hw-8', name: '清点家居用品，补货采购', done: false, isFixed: true },
  ],
  personal: [
    { id: 'pers-1', name: '手账与思考', done: false, isFixed: true },
    { id: 'pers-2', name: '每日规划', done: false, isFixed: true },
    { id: 'pers-3', name: '称自己的体重', done: false, isFixed: true },
    { id: 'pers-4', name: '健身记录', done: false, isFixed: true },
    { id: 'pers-5', name: '健康状况记录', done: false, isFixed: true },
    { id: 'pers-6', name: '睡眠记录', done: false, isFixed: true },
    { id: 'pers-7', name: '情绪记录', done: false, isFixed: true },
  ],
  entertainment: [
    { id: 'ent-1', name: 'CS', done: false, isFixed: true },
    { id: 'ent-2', name: '单机游戏', done: false, isFixed: true },
    { id: 'ent-3', name: '动漫', done: false, isFixed: true },
    { id: 'ent-4', name: '电视剧', done: false, isFixed: true },
    { id: 'ent-5', name: '电影', done: false, isFixed: true },
    { id: 'ent-6', name: '外出', done: false, isFixed: true },
    { id: 'ent-7', name: '美食', done: false, isFixed: true },
  ]
};

export const DEFAULT_DAILY_RECORD = (): DailyRecord => ({
  tasks: {
    cat: JSON.parse(JSON.stringify(FIXED_TASKS.cat)),
    bird: JSON.parse(JSON.stringify(FIXED_TASKS.bird)),
    fish: JSON.parse(JSON.stringify(FIXED_TASKS.fish)),
    housework: JSON.parse(JSON.stringify(FIXED_TASKS.housework)),
    personal: JSON.parse(JSON.stringify(FIXED_TASKS.personal)),
    entertainment: JSON.parse(JSON.stringify(FIXED_TASKS.entertainment)),
  },
  cats: {
    mooncake: { poopCount: null, peeCount: null, isSoftPoop: false, weight: null },
    tianbao: { poopCount: null, peeCount: null, isSoftPoop: false, weight: null },
  },
  bird: { weight: null, anomalies: [] },
  fish: { motherMale: null, motherFemale: null, medium: null, small: null },
  personal: {
    fitness: [],
    health: { symptoms: [], isPeriod: false },
    sleep: { naps: [] },
    mood: { score: 'calm' },
    weight: undefined,
  },
  entertainment: [],
  dining: [],
  catTreats: [],
  catPlays: [],
  waterFilterMold: 'none',
});

export const getBirdWaterTask = (date: Date) => {
  const day = date.getDay();
  switch (day) {
    case 1: case 3: case 5: return '美羽维生素 (0.1:30)';
    case 2: case 0: return '纯净水';
    case 4: return '液体钙 (1:50) 或粉末钙 (3.2勺0.8g:50ml)';
    case 6: return '电解质 (4勺1g:50)';
    default: return '纯净水';
  }
};
