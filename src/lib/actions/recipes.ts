"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";
import { getCached, setCache } from "@/lib/redis";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface GeneratedRecipe {
  name: string;
  description: string;
  heroEmoji: string;
  ingredients: { name: string; quantity: number; unit: string; optional?: boolean }[];
  steps: { stepNumber: number; instruction: string; duration?: number; tips?: string }[];
  totalTime: number;
  activeTime: number;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  cuisineType: string;
  mealType: string;
  isOnePot: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  equipment: string[];
  nutrition: { calories?: number; protein?: number; carbs?: number; fat?: number };
  servings: number;
  matchPercentage?: number;
  missingIngredients?: string[];
}

interface GenerateOptions {
  maxTime: number;
  prioritizeExpiring?: boolean;
  onePotOnly?: boolean;
  willingToShop?: boolean;
  mealType?: string;
  cuisineType?: string;
}

export async function generateRecipes(options: GenerateOptions): Promise<GeneratedRecipe[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      profile: true,
      inventory: { include: { ingredient: true } },
      pantryStaples: { include: { ingredient: true }, where: { inStock: true } },
      recipeHistory: { take: 10, orderBy: { cookedAt: "desc" }, include: { recipe: true } },
    },
  });

  if (!user) throw new Error("User not found");

  // Build context for AI
  const inventoryList = user.inventory.map((i) => `${i.ingredient.name} (${i.quantity} ${i.unit})`).join(", ");
  const expiringItems = user.inventory
    .filter((i) => i.status === "EXPIRING" || i.status === "USE_SOON")
    .map((i) => i.ingredient.name);
  const pantryItems = user.pantryStaples.map((p) => p.ingredient.name).join(", ");
  const recentRecipes = user.recipeHistory.map((h) => h.recipe.name).join(", ");
  
  const profile = user.profile;
  const allergies = profile?.allergies?.join(", ") || "none";
  const restrictions = profile?.restrictions?.join(", ") || "none";
  const dislikes = profile?.dislikes?.join(", ") || "none";
  const cookware = profile?.cookware?.join(", ") || "standard pots and pans";
  const appliances = profile?.appliances?.join(", ") || "oven, stovetop";
  const skillLevel = profile?.skillLevel || "beginner";

  // Check cache
  const cacheKey = `recipes:${user.id}:${options.maxTime}:${options.onePotOnly}:${options.willingToShop}:${inventoryList.slice(0, 100)}`;
  const cached = await getCached<GeneratedRecipe[]>(cacheKey);
  if (cached) return cached;

  const shoppingContext = options.willingToShop
    ? `\nSHOPPING MODE: User is willing to buy 1-3 additional common ingredients. You may suggest recipes that need a few extra items beyond what's available. Mark any ingredients they'd need to buy.`
    : `\nIMPORTANT: Only suggest recipes that can be made with the available ingredients. Avoid suggesting recipes that require significant shopping.`;

  const prompt = `Generate 5 recipe suggestions based on the following context:

AVAILABLE INGREDIENTS: ${inventoryList || "Not much, please suggest simple recipes with common ingredients"}
PANTRY STAPLES: ${pantryItems || "basic salt, pepper, oil"}
${options.prioritizeExpiring && expiringItems.length > 0 ? `MUST USE (EXPIRING SOON): ${expiringItems.join(", ")}` : ""}
${shoppingContext}

CONSTRAINTS:
- Maximum cooking time: ${options.maxTime} minutes
- Skill level: ${skillLevel}
- Allergies (NEVER include): ${allergies}
- Dietary restrictions: ${restrictions}
- Dislikes (avoid): ${dislikes}
- Available cookware: ${cookware}
- Available appliances: ${appliances}
${options.onePotOnly ? "- ONE POT MEALS ONLY" : ""}
${options.mealType ? `- Meal type: ${options.mealType}` : ""}
${options.cuisineType ? `- Cuisine: ${options.cuisineType}` : ""}

AVOID REPEATING: ${recentRecipes || "none"}

INSTRUCTION REQUIREMENTS:
- Each step should be DETAILED with specific techniques (e.g., "dice into 1/4 inch cubes", "sauté until golden brown, about 3-4 minutes")
- Include sensory cues (what to look for, smell, texture changes)
- Mention specific temperatures and timing
- Add helpful tips for each step when relevant
- Explain WHY certain techniques matter for beginners

Return ONLY valid JSON array with exactly 5 recipes. Each recipe must follow this schema:
{
  "name": "string",
  "description": "string (1-2 sentences)",
  "heroEmoji": "string (single food emoji)",
  "ingredients": [{"name": "string", "quantity": number, "unit": "string", "optional": boolean}],
  "steps": [{"stepNumber": number, "instruction": "string (DETAILED - 2-4 sentences with specific techniques, timing, and sensory cues)", "duration": number, "tips": "string (helpful tip or common mistake to avoid)"}],
  "totalTime": number,
  "activeTime": number,
  "difficulty": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
  "cuisineType": "string",
  "mealType": "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "DESSERT",
  "isOnePot": boolean,
  "isVegetarian": boolean,
  "isVegan": boolean,
  "equipment": ["string"],
  "nutrition": {"calories": number, "protein": number, "carbs": number, "fat": number},
  "servings": number
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    // Parse JSON from response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found in response");

    const recipes: GeneratedRecipe[] = JSON.parse(jsonMatch[0]);

    // Calculate match percentage for each recipe
    const inventoryNames = user.inventory.map((i) => i.ingredient.name.toLowerCase());
    const pantryNames = user.pantryStaples.map((p) => p.ingredient.name.toLowerCase());
    const allAvailable = [...inventoryNames, ...pantryNames];

    for (const recipe of recipes) {
      const recipeIngredients = recipe.ingredients.filter((i) => !i.optional).map((i) => i.name.toLowerCase());
      const matched = recipeIngredients.filter((i) => allAvailable.some((a) => a.includes(i) || i.includes(a)));
      recipe.matchPercentage = Math.round((matched.length / recipeIngredients.length) * 100);
      recipe.missingIngredients = recipeIngredients.filter((i) => !allAvailable.some((a) => a.includes(i) || i.includes(a)));
    }

    // Sort by match percentage
    recipes.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));

    // Cache for 30 minutes
    await setCache(cacheKey, recipes, 1800);

    return recipes;
  } catch (error) {
    console.error("Recipe generation error:", error);
    throw new Error("Failed to generate recipes");
  }
}

export async function saveRecipe(recipe: GeneratedRecipe) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  const saved = await prisma.recipe.create({
    data: {
      userId: user.id,
      name: recipe.name,
      description: recipe.description,
      heroEmoji: recipe.heroEmoji,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      totalTime: recipe.totalTime,
      activeTime: recipe.activeTime,
      difficulty: recipe.difficulty,
      cuisineType: recipe.cuisineType,
      mealType: recipe.mealType as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "DESSERT",
      isOnePot: recipe.isOnePot,
      isVegetarian: recipe.isVegetarian,
      isVegan: recipe.isVegan,
      equipment: recipe.equipment,
      nutrition: recipe.nutrition,
      servings: recipe.servings,
    },
  });

  // Also save to user's saved recipes
  await prisma.savedRecipe.create({
    data: { userId: user.id, recipeId: saved.id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/saved");
  return saved;
}

