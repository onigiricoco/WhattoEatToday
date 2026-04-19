import { generateRecipeRecommendation } from "../src/services/gemini.server";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { inventory, preferences, selectedCuisine, todayRequirement, lang } = req.body;
    const result = await generateRecipeRecommendation(
      inventory,
      preferences,
      selectedCuisine,
      todayRequirement,
      lang
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Recommendation API error:", error);
    res.status(500).json({ error: "Failed to generate recommendation" });
  }
}
