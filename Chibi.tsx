export type ElementType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
export type Nature = 'Debit' | 'Credit';
export type Statement = 'Financial Performance' | 'Financial Position';

export interface Account {
  name: string;
  element: ElementType;
  nature: Nature;
  statement: Statement;
}

export interface Transaction {
  description: string;
  isTransaction: boolean;
  involvedAccounts?: string[];
  amount?: number;
}

export interface UserProgress {
  points: number;
  unlockedAccessories: string[];
  equippedAccessories: string[];
  currentPhase: number;
  completedQuestions: string[];
  character: 'male' | 'female';
  happinessLevel: number;
  questionsAnswered: number;
  pointMultiplier: number;
  equippedTitle: string;
}

export type ShopCategory = 'Food' | 'Books' | 'Apparel';

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  icon: string;
  category: ShopCategory;
  effectValue?: number;
  effectDesc: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'milo', name: 'SGD2.00 Iced Milo', price: 20, icon: '🥤', category: 'Food', effectValue: 10, effectDesc: '+10% Happiness' },
  { id: 'laksa', name: 'SGD4.50 Laksa', price: 45, icon: '🍜', category: 'Food', effectValue: 20, effectDesc: '+20% Happiness' },
  { id: 'currypuff', name: 'SGD1.00 Curry Puff', price: 10, icon: '🥟', category: 'Food', effectValue: 5, effectDesc: '+5% Happiness' },
  { id: 'poaguide', name: 'Advanced POA Guide', price: 200, icon: '📘', category: 'Books', effectValue: 2, effectDesc: '+2 Points/Answer' },
  { id: 'goldcalc', name: 'Golden Calculator', price: 500, icon: '🧮', category: 'Books', effectValue: 5, effectDesc: '+5 Points/Answer' },
  { id: 'hoodie', name: "'Master Mapper' Hoodie", price: 300, icon: '🧥', category: 'Apparel', effectDesc: 'Unlocks Header Title' },
  { id: 'blazer', name: 'School Blazer', price: 400, icon: '👔', category: 'Apparel', effectDesc: 'Unlocks Header Title' },
];
