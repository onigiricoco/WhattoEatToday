import { GoogleGenAI, Type } from "@google/genai";
import { Ingredient, UserPreferences, Recipe } from "../types";
import firebaseConfig from "../../firebase-applet-config.json";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    let apiKey = process.env.GEMINI_API_KEY;
    
    // Fallback: Check if user set GEMINI_API_KEY without prefix (some platforms inject it)
    // or use the Firebase API key as a last resort
    if (!apiKey || apiKey === "YOUR_API_KEY" || apiKey.includes("MY_GEMINI_API_KEY")) {
      console.warn("GEMINI_API_KEY not found in process.env, falling back to Firebase API key");
      apiKey = firebaseConfig.apiKey;
    }

    if (!apiKey) {
      throw new Error("API key not found. Please set GEMINI_API_KEY in your environment.");
    }
    
    aiInstance = new GoogleGenAI({ apiKey: apiKey.trim().replace(/['"]/g, "") });
  }
  return aiInstance;
}

const CUISINE_CATEGORIES = {
  zh: [
    "意大利菜", "中国东北菜", "中国西北菜", "中国云南菜", "快手小炒", "粉面", "家常菜", "粤菜", "快餐",
    "日本料理", "韩国料理", "泰餐", "墨西哥菜", "法餐", "四川菜", "湘菜", "江浙菜", "东南亚菜", "中东菜", 
    "印度菜", "地中海菜", "美式料理"
  ],
  en: [
    "Italian", "NE Chinese", "NW Chinese", "Yunnanese", "Stir-fry", "Noodles", "Home Style", "Cantonese", "Fast Food",
    "Japanese", "Korean", "Thai", "Mexican", "French", "Szechuan", "Hunan", "Jiangzhe", "SE Asian", "Middle Eastern",
    "Indian", "Mediterranean", "American"
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

  let recipe: any;
  try {
    const ai = getAI();
    const modelResponse = await ai.models.generateContent({
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
              items: { type: Type.STRING }
            },
            imageSeed: {
              type: Type.STRING
            }
          },
          required: ["title", "cuisine", "ingredients", "instructions", "cookingTime", "difficulty", "source", "recommendedShoppingList", "prePreparation", "imageSeed"]
        }
      }
    });

    recipe = JSON.parse(modelResponse.text || "{}");
  } catch (error: any) {
    console.error("AI Recommendation failed:", error);
    // Demo Fallback
    recipe = {
      title: lang === 'zh' ? "家常番茄炒蛋" : "Home-style Tomato Egg Stir-fry",
      cuisine: selectedCuisine || (lang === 'zh' ? "中式家常菜" : "Chinese Home Style"),
      ingredients: lang === 'zh' ? ["鸡蛋 3个", "番茄 2个", "小葱 适量", "盐 适量"] : ["Eggs 3", "Tomatoes 2", "Scallions", "Salt"],
      instructions: lang === 'zh' ? 
        ["番茄洗净切块", "鸡蛋打散并加少许盐", "热锅凉油，炒蛋至八分熟盛出", "底油炒番茄至出汁", "倒回鸡蛋，加盐调味，撒葱花出锅"] : 
        ["Wash and slice tomatoes", "Beat eggs with a pinch of salt", "Scramble eggs until nearly set, then remove", "Sauté tomatoes until juicy", "Mix eggs back, season, and top with scallions"],
      cookingTime: 10,
      difficulty: "easy",
      source: "AI Kitchen Demo",
      recommendedShoppingList: [],
      prePreparation: [],
      imageSeed: "tomato scrambled eggs high quality food photography"
    };
  }

  recipe.id = Math.random().toString(36).substring(2, 9);
  
  // Real image generation (Gemini 2.5 Flash Image)
  try {
    const ai = getAI();
    const imageResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A high-quality, professional food photography shot of ${recipe.imageSeed || recipe.title}. Delicious, appetizing, well-lit, on a plate.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        },
      },
    });

    if (imageResponse.candidates?.[0]?.content?.parts) {
      for (const part of imageResponse.candidates[0].content.parts) {
        if (part.inlineData) {
          recipe.imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }
  } catch (error) {
    console.error("AI Image Generation failed, using Picsum fallback:", error);
    recipe.imageUrl = `https://picsum.photos/seed/${encodeURIComponent(recipe.imageSeed || recipe.title)}/800/600`;
  }

  if (!recipe.imageUrl) {
    recipe.imageUrl = `https://picsum.photos/seed/${encodeURIComponent(recipe.imageSeed || recipe.title)}/800/600`;
  }

  return recipe;
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

  try {
    const ai = getAI();
    const result = await ai.models.generateContent({
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

    return JSON.parse(result.text || "[]");
  } catch (error: any) {
    console.error("AI Reminders failed:", error);
    if (lang === 'zh') {
      return ["请记得检查冰箱里的新鲜食材。", "保持食材先进先出的原则。"];
    }
    return ["Please remember to check the fresh ingredients in your fridge.", "Keep the FIFO principle for your ingredients."];
  }
}
