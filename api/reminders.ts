import { getInventoryReminders } from "../src/services/gemini.server";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { inventory, lang } = req.body;
    const result = await getInventoryReminders(inventory, lang);
    res.status(200).json(result);
  } catch (error) {
    console.error("Reminders API error:", error);
    res.status(500).json({ error: "Failed to generate reminders" });
  }
}
