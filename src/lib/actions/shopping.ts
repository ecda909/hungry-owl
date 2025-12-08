"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
  recipeId?: string;
  ingredientId?: string; // Link to ingredient if from database
  emoji?: string;
}

export async function getShoppingLists() {
  const { userId } = await auth();
  if (!userId) return [];

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return [];

  return prisma.shoppingList.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getActiveShoppingList() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return null;

  const list = await prisma.shoppingList.findFirst({
    where: { userId: user.id, isActive: true },
  });

  return list;
}

export async function createShoppingList(name: string = "Shopping List") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  // Deactivate existing active lists
  await prisma.shoppingList.updateMany({
    where: { userId: user.id, isActive: true },
    data: { isActive: false },
  });

  const list = await prisma.shoppingList.create({
    data: {
      userId: user.id,
      name,
      items: [],
      isActive: true,
    },
  });

  revalidatePath("/dashboard/shopping");
  return list;
}

export async function addItemToList(listId: string, item: Omit<ShoppingItem, "id" | "checked">) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  const list = await prisma.shoppingList.findUnique({
    where: { id: listId, userId: user.id },
  });

  if (!list) throw new Error("List not found");

  const items = (list.items as unknown as ShoppingItem[]) || [];
  const newItem: ShoppingItem = {
    ...item,
    id: crypto.randomUUID(),
    checked: false,
  };

  await prisma.shoppingList.update({
    where: { id: listId },
    data: { items: [...items, newItem] as unknown as Prisma.InputJsonValue },
  });

  revalidatePath("/dashboard/shopping");
}

export async function toggleItemChecked(listId: string, itemId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  const list = await prisma.shoppingList.findUnique({
    where: { id: listId, userId: user.id },
  });

  if (!list) throw new Error("List not found");

  const items = (list.items as unknown as ShoppingItem[]) || [];
  const updatedItems = items.map((item) =>
    item.id === itemId ? { ...item, checked: !item.checked } : item
  );

  await prisma.shoppingList.update({
    where: { id: listId },
    data: { items: updatedItems as unknown as Prisma.InputJsonValue },
  });

  revalidatePath("/dashboard/shopping");
}

export async function removeItemFromList(listId: string, itemId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  const list = await prisma.shoppingList.findUnique({
    where: { id: listId, userId: user.id },
  });

  if (!list) throw new Error("List not found");

  const items = (list.items as unknown as ShoppingItem[]) || [];
  const updatedItems = items.filter((item) => item.id !== itemId);

  await prisma.shoppingList.update({
    where: { id: listId },
    data: { items: updatedItems as unknown as Prisma.InputJsonValue },
  });

  revalidatePath("/dashboard/shopping");
}

export async function clearCheckedItems(listId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  const list = await prisma.shoppingList.findUnique({
    where: { id: listId, userId: user.id },
  });

  if (!list) throw new Error("List not found");

  const items = (list.items as unknown as ShoppingItem[]) || [];
  const updatedItems = items.filter((item) => !item.checked);

  await prisma.shoppingList.update({
    where: { id: listId },
    data: { items: updatedItems as unknown as Prisma.InputJsonValue },
  });

  revalidatePath("/dashboard/shopping");
}

/**
 * Mark an item as purchased and add it to the user's inventory
 */
export async function markItemPurchased(listId: string, itemId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("User not found");

  const list = await prisma.shoppingList.findUnique({
    where: { id: listId, userId: user.id },
  });

  if (!list) throw new Error("List not found");

  const items = (list.items as unknown as ShoppingItem[]) || [];
  const item = items.find((i) => i.id === itemId);

  if (!item) throw new Error("Item not found");

  // Find or create the ingredient
  let ingredientId = item.ingredientId;

  if (!ingredientId) {
    // Try to find by name
    const existingIngredient = await prisma.ingredient.findFirst({
      where: { name: { equals: item.name, mode: 'insensitive' } },
    });

    if (existingIngredient) {
      ingredientId = existingIngredient.id;
    } else {
      // Create a new custom ingredient
      const newIngredient = await prisma.ingredient.create({
        data: {
          name: item.name,
          category: (item.category as "PRODUCE" | "PROTEIN" | "DAIRY" | "PANTRY" | "FROZEN" | "BEVERAGES" | "SPICES" | "GRAINS" | "OTHER") || "OTHER",
          emoji: item.emoji || "🍽️",
          commonUnits: [item.unit, "piece", "oz", "cup"],
          aliases: [],
          substitutes: "[]",
        },
      });
      ingredientId = newIngredient.id;
    }
  }

  // Add to inventory
  const existing = await prisma.userInventory.findFirst({
    where: {
      userId: user.id,
      ingredientId,
      storageLocation: "FRIDGE", // Default location
    },
  });

  if (existing) {
    await prisma.userInventory.update({
      where: { id: existing.id },
      data: {
        quantity: existing.quantity + item.quantity,
      },
    });
  } else {
    await prisma.userInventory.create({
      data: {
        userId: user.id,
        ingredientId,
        quantity: item.quantity,
        unit: item.unit,
        storageLocation: "FRIDGE",
        status: "FRESH",
      },
    });
  }

  revalidatePath("/dashboard/shopping");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard");
}
