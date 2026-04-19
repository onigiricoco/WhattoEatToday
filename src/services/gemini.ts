import { Ingredient, UserPreferences, Recipe } from "../types";

export async function generateRecipeRecommendation(
  inventory: Ingredient[],
  preferences: UserPreferences,
  selectedCuisine: string,
  todayRequirement?: string,
  lang: 'zh' | 'en' = 'zh'
): Promise<Recipe & { imageSeed: string }> {
  const response = await fetch("/api/recommendation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      inventory,
      preferences,
      selectedCuisine,
      todayRequirement,
      lang
    })
  });
  if (!response.ok) {
    throw new Error("Failed to generate recommendation");
  }
  return response.json();
}

export async function getInventoryReminders(
  inventory: Ingredient[],
  lang: 'zh' | 'en' = 'zh'
): Promise<string[]> {
  const response = await fetch("/api/reminders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inventory, lang })
  });
  if (!response.ok) {
    throw new Error("Failed to generate reminders");
  }
  return response.json();
}

const CUISINE_CATEGORIES = {
  zh: [
    "意大利菜", "中国东北菜", "中国西北菜", "中国云南菜", "快手小炒", "粉面", "家常菜", "粤菜", "快餐",
    "日本料理", "韩国料理", "泰餐", "墨西哥菜", "法餐"
  ],
  en: [
    "Italian", "NE Chinese", "NW Chinese", "Yunnanese", "Stir-fry", "Noodles", "Home Style", "Cantonese", "Fast Food",
    "Japanese", "Korean", "Thai", "Mexican", "French"
  ]
};

export function getRandomCuisines(count: number = 3, lang: 'zh' | 'en' = 'zh'): string[] {
  const categories = CUISINE_CATEGORIES[lang] || CUISINE_CATEGORIES.zh;
  const shuffled = [...categories].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
