"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { IngredientCategory, InventoryStatus, StorageLocation } from "@/generated/prisma";

export async function getUserInventory() {
  const { userId } = await auth();
  if (!userId) return [];

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) return [];

  const inventory = await prisma.userInventory.findMany({
    where: { userId: user.id },
    include: { ingredient: true },
    orderBy: [
      { expirationDate: "asc" },
      { ingredient: { name: "asc" } },
    ],
  });

  return inventory;
}

export async function getIngredients(search?: string) {
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { aliases: { has: search.toLowerCase() } },
        ],
      }
    : {};

  return prisma.ingredient.findMany({
    where,
    orderBy: { name: "asc" },
    take: 50,
  });
}

export async function addToInventory(data: {
  ingredientId: string;
  quantity: number;
  unit: string;
  expirationDate?: Date;
  storageLocation?: StorageLocation;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  // Get ingredient to check shelf life
  const ingredient = await prisma.ingredient.findUnique({
    where: { id: data.ingredientId },
  });

  // Calculate expiration date from shelf life if not provided
  let expirationDate = data.expirationDate;
  if (!expirationDate && ingredient?.shelfLife) {
    expirationDate = new Date(Date.now() + ingredient.shelfLife * 24 * 60 * 60 * 1000);
  }

  // Try to find existing item with same ingredient and storage location
  const existing = await prisma.userInventory.findFirst({
    where: {
      userId: user.id,
      ingredientId: data.ingredientId,
      storageLocation: data.storageLocation || "FRIDGE",
    },
  });

  if (existing) {
    // Update quantity and recalculate status
    const newExpiration = expirationDate || existing.expirationDate;
    await prisma.userInventory.update({
      where: { id: existing.id },
      data: {
        quantity: existing.quantity + data.quantity,
        expirationDate: newExpiration,
        status: getStatusFromDate(newExpiration ?? undefined),
      },
    });
  } else {
    await prisma.userInventory.create({
      data: {
        userId: user.id,
        ingredientId: data.ingredientId,
        quantity: data.quantity,
        unit: data.unit,
        expirationDate,
        storageLocation: data.storageLocation || "FRIDGE",
        status: getStatusFromDate(expirationDate),
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory");
}

export async function updateInventoryItem(
  id: string,
  data: {
    quantity?: number;
    unit?: string;
    expirationDate?: Date | null;
    storageLocation?: StorageLocation;
    status?: InventoryStatus;
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  await prisma.userInventory.update({
    where: { id, userId: user.id },
    data: {
      ...data,
      status: data.expirationDate !== undefined 
        ? getStatusFromDate(data.expirationDate ?? undefined) 
        : undefined,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory");
}

export async function removeFromInventory(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  await prisma.userInventory.delete({
    where: { id, userId: user.id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory");
}

function getStatusFromDate(date?: Date): InventoryStatus {
  if (!date) return "FRESH";
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return "EXPIRED";
  if (days <= 2) return "EXPIRING";
  if (days <= 5) return "USE_SOON";
  return "FRESH";
}

export async function getPantryStaples() {
  const { userId } = await auth();
  if (!userId) return [];

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return [];

  return prisma.pantryStaple.findMany({
    where: { userId: user.id },
    include: { ingredient: true },
  });
}

export async function togglePantryStaple(ingredientId: string, inStock: boolean) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  await prisma.pantryStaple.upsert({
    where: { userId_ingredientId: { userId: user.id, ingredientId } },
    update: { inStock },
    create: { userId: user.id, ingredientId, inStock },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory");
}

/**
 * Create an ingredient from USDA data (when user selects a USDA result)
 * This allows us to add USDA ingredients to our local database
 */
export async function createIngredientFromUSDA(data: {
  name: string;
  category: IngredientCategory;
  commonUnits: string[];
  emoji: string;
  fdcId?: number;
}) {
  // First check if this ingredient already exists (by name or fdcId)
  const existing = await prisma.ingredient.findFirst({
    where: {
      OR: [
        { name: { equals: data.name, mode: 'insensitive' } },
        ...(data.fdcId ? [{ usdaFdcId: data.fdcId }] : []),
      ],
    },
  });

  if (existing) {
    return existing;
  }

  // Create new ingredient
  const ingredient = await prisma.ingredient.create({
    data: {
      name: data.name,
      category: data.category,
      commonUnits: data.commonUnits,
      emoji: data.emoji,
      usdaFdcId: data.fdcId,
      aliases: [],
      substitutes: '[]',
    },
  });

  return ingredient;
}

/**
 * Create a custom ingredient from user input
 * For items not found in the database or USDA
 */
export async function createCustomIngredient(data: {
  name: string;
  description?: string;
  category: IngredientCategory;
  emoji: string;
}) {
  // Check if ingredient already exists
  const existing = await prisma.ingredient.findFirst({
    where: {
      name: { equals: data.name, mode: 'insensitive' },
    },
  });

  if (existing) {
    return existing;
  }

  // Create new custom ingredient
  const ingredient = await prisma.ingredient.create({
    data: {
      name: data.name,
      category: data.category,
      emoji: data.emoji,
      commonUnits: ['piece', 'oz', 'cup', 'lb'],
      aliases: [],
      substitutes: data.description ? JSON.stringify({ description: data.description }) : '[]',
    },
  });

  revalidatePath("/dashboard/inventory");
  return ingredient;
}

/**
 * Get recommended ingredients based on user's current inventory
 * Suggests items that would complement their pantry and enable more recipes
 */
export async function getRecommendedIngredients() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      inventory: { include: { ingredient: true } },
      profile: true,
    },
  });

  if (!user) throw new Error("User not found");

  const inventoryItems = user.inventory.map(i => i.ingredient.name.toLowerCase());
  const skillLevel = user.profile?.skillLevel || "BEGINNER";

  // Core staples every kitchen should have, based on skill level
  const coreStaples = [
    { name: "Olive Oil", category: "PANTRY", reason: "Essential for cooking almost anything", emoji: "🫒" },
    { name: "Salt", category: "PANTRY", reason: "Basic seasoning for all dishes", emoji: "🧂" },
    { name: "Black Pepper", category: "SPICES", reason: "Universal seasoning", emoji: "🌶️" },
    { name: "Garlic", category: "PRODUCE", reason: "Adds depth to savory dishes", emoji: "🧄" },
    { name: "Onion", category: "PRODUCE", reason: "Base for countless recipes", emoji: "🧅" },
    { name: "Butter", category: "DAIRY", reason: "Essential for cooking and baking", emoji: "🧈" },
    { name: "Egg", category: "PROTEIN", reason: "Versatile protein for any meal", emoji: "🥚" },
    { name: "Chicken Breast", category: "PROTEIN", reason: "Lean protein that's easy to cook", emoji: "🍗" },
    { name: "Rice", category: "GRAINS", reason: "Affordable base for many meals", emoji: "🍚" },
    { name: "Pasta", category: "GRAINS", reason: "Quick and easy meal foundation", emoji: "🍝" },
  ];

  // Additional recommendations for intermediate+ cooks
  const intermediateStaples = [
    { name: "Lemon", category: "PRODUCE", reason: "Brightens flavors in dishes", emoji: "🍋" },
    { name: "Ginger", category: "PRODUCE", reason: "Essential for Asian cuisine", emoji: "🫚" },
    { name: "Soy Sauce", category: "PANTRY", reason: "Key umami flavor enhancer", emoji: "🥢" },
    { name: "Cumin", category: "SPICES", reason: "Essential for Mexican & Indian dishes", emoji: "🌿" },
    { name: "Chicken Broth", category: "PANTRY", reason: "Base for soups and sauces", emoji: "🥣" },
  ];

  let recommendations = coreStaples;
  if (skillLevel !== "BEGINNER") {
    recommendations = [...coreStaples, ...intermediateStaples];
  }

  // Filter out items already in inventory
  const missingItems = recommendations.filter(
    item => !inventoryItems.some(inv => inv.includes(item.name.toLowerCase()))
  );

  // If they have most staples, they're set!
  if (missingItems.length <= 2) {
    return { recommendations: [], isWellStocked: true, message: "Great job! Your pantry is well-stocked for your skill level." };
  }

  // Return top 5 recommendations
  return {
    recommendations: missingItems.slice(0, 5),
    isWellStocked: false,
    message: `Adding these items would help you make more recipes.`
  };
}
