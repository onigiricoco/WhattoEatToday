export type IngredientCategory = '冷藏' | '冷冻' | '储藏';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  quantity: string;
  addedAt: number; // timestamp
  expiryDate?: number; // timestamp
  uid: string;
}

export interface UserPreferences {
  usualDishes: string[];
  cookingTimePreference: 'quick' | 'medium' | 'elaborate';
  difficultyPreference: 'easy' | 'medium' | 'hard';
  favoriteCuisines: string[];
  uid: string;
}

export interface Recipe {
  id: string;
  title: string;
  cuisine: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  source: string;
  recommendedShoppingList: string[];
  prePreparation?: string[];
  imageUrl?: string;
}

export interface HistoryEntry {
  id: string;
  recipeId: string;
  recipeTitle: string;
  timestamp: number;
  selectedCuisine: string;
  uid: string;
}

export interface DailyStats {
  callCount: number;
  lastUpdated?: number;
}
