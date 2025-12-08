"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { profile: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      },
      include: { profile: true },
    });
  }

  return user;
}

export async function getUserProfile() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { profile: true },
  });

  return user;
}

export async function updateUserProfile(data: {
  householdSize?: number;
  householdAges?: string[];
  allergies?: string[];
  restrictions?: string[];
  restrictionDetails?: Record<string, { strict: boolean; avoidFoods?: string[] }>;
  dislikes?: string[];
  cuisinePreferences?: Record<string, string>;
  cookware?: string[];
  appliances?: string[];
  skillLevel?: string;
  preferredStores?: string[];
  shoppingFrequency?: string;
  budgetPreference?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Ensure user exists first (create if needed)
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    // Create the user if they don't exist yet
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Cannot get current user from Clerk");

    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      },
    });
  }

  // Prepare data with proper JSON serialization
  const { cuisinePreferences, restrictionDetails, ...restData } = data;

  const profile = await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {
      ...restData,
      cuisinePreferences: cuisinePreferences
        ? JSON.stringify(cuisinePreferences)
        : undefined,
      restrictionDetails: restrictionDetails
        ? JSON.stringify(restrictionDetails)
        : undefined,
    },
    create: {
      userId: user.id,
      ...restData,
      cuisinePreferences: cuisinePreferences
        ? JSON.stringify(cuisinePreferences)
        : "{}",
      restrictionDetails: restrictionDetails
        ? JSON.stringify(restrictionDetails)
        : "{}",
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  revalidatePath("/settings");

  return profile;
}

export async function completeOnboarding() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // First check if user exists, create if not
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Cannot get current user from Clerk");

    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        onboardingComplete: true,
      },
    });
  } else {
    user = await prisma.user.update({
      where: { clerkId: userId },
      data: { onboardingComplete: true },
    });
  }

  revalidatePath("/dashboard");
  return user;
}

export async function isOnboardingComplete() {
  const { userId } = await auth();
  if (!userId) return false;

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  return user?.onboardingComplete ?? false;
}

