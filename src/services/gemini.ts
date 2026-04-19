import { GoogleGenAI, Type } from "@google/genai";
import { Ingredient, UserPreferences, Recipe } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

export async function generateRecipeRecommendation(
  inventory: Ingredient[],
  preferences: UserPreferences,
  selectedCuisine: string,
  todayRequirement?: string,
  lang: 'zh' | 'en' = 'zh'
): Promise<Recipe & { imageSeed: string }> {
  const inventoryStr = inventory.map(i => `${i.name} (${i.quantity}, ${lang === 'zh' ? '类别' : 'Category'}: ${i.category})`).join(", ");
  const usualDishesStr = preferences.usualDishes.join(", ");

  const prompt = `
    You are a world-class chef. Recommend a recipe based on the following info:
    
    Inventory: ${inventoryStr}
    User Preferences (Usual dishes): ${usualDishesStr}
    Selected Cuisine: ${selectedCuisine}
    Cooking Time Preference: ${preferences.cookingTimePreference}
    Difficulty Preference: ${preferences.difficultyPreference}
    Today's Requirement: ${todayRequirement || "None"}
    
    CRITICAL REQUIREMENTS:
    1. Respond ENTIRELY in ${lang === 'zh' ? 'Chinese (Simplified)' : 'English'}. All fields except imageSeed must be in ${lang === 'zh' ? 'Chinese' : 'English'}.
    2. Try to use existing ingredients.
    3. List missing items in recommendedShoppingList.
    4. Difficulty and time must match preferences/requirements.
    5. **prePreparation field**: Provide defrosting or marinating steps if needed.
    6. **imageSeed**: VERY IMPORTANT - This MUST remain a short, descriptive ENGLISH phrase for image generation.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          cuisine: { type: Type.STRING },
          ingredients: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          instructions: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          cookingTime: { type: Type.INTEGER },
          difficulty: { 
            type: Type.STRING,
            enum: ["easy", "medium", "hard"]
          },
          source: { type: Type.STRING },
          recommendedShoppingList: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          prePreparation: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Steps needed before actual cooking, like defrosting or marinating."
          },
          imageSeed: {
            type: Type.STRING,
            description: "English dish name, for image generation."
          }
        },
        required: ["title", "cuisine", "ingredients", "instructions", "cookingTime", "difficulty", "source", "recommendedShoppingList", "prePreparation", "imageSeed"]
      }
    }
  });

  const recipe = JSON.parse(response.text || "{}");
  
  // Generate real image using Gemini Flash Image model
  let imageUrl = undefined;
  try {
    const imageResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: `A high-quality, professional food photography shot of ${recipe.imageSeed || recipe.title}. Delicious, appetizing, well-lit, on a plate.`,
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const candidate of imageResponse.candidates || []) {
      for (const part of candidate.content.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
      if (imageUrl) break;
    }
  } catch (error) {
    console.error("Image generation failed:", error);
  }

  return {
    ...recipe,
    id: Math.random().toString(36).substr(2, 9),
    imageUrl
  };
}

export function getRandomCuisines(count: number = 3, lang: 'zh' | 'en' = 'zh'): string[] {
  const categories = CUISINE_CATEGORIES[lang] || CUISINE_CATEGORIES.zh;
  const shuffled = [...categories].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export async function getInventoryReminders(inventory: Ingredient[], lang: 'zh' | 'en' = 'zh'): Promise<string[]> {
  if (inventory.length === 0) return [];
  
  const now = Date.now();
  const inventoryStr = inventory.map(i => `${i.name} (${lang === 'zh' ? '存入于' : 'added at'}: ${new Date(i.addedAt).toLocaleDateString()})`).join(", ");
  
  const prompt = `
    Analyze the following ingredient inventory and identify ingredients that might have been stored for too long and should be consumed soon. Provide warm, helpful reminders.
    Inventory: ${inventoryStr}
    Current Time: ${new Date(now).toLocaleDateString()}
    
    CRITICAL: Respond ENTIRELY in ${lang === 'zh' ? 'Chinese (Simplified)' : 'English'}.
    Return a JSON string array of reminders.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  return JSON.parse(response.text || "[]");
}
