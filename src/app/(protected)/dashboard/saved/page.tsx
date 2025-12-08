import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ChefHat, BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function getSavedRecipes() {
  const { userId } = await auth();
  if (!userId) return [];

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return [];

  const savedRecipes = await prisma.savedRecipe.findMany({
    where: { userId: user.id },
    include: { recipe: true },
    orderBy: { createdAt: "desc" },
  });

  return savedRecipes.map((sr) => sr.recipe);
}

const difficultyColors = {
  BEGINNER: "bg-green-100 text-green-800",
  INTERMEDIATE: "bg-yellow-100 text-yellow-800",
  ADVANCED: "bg-red-100 text-red-800",
};

export default async function SavedRecipesPage() {
  const recipes = await getSavedRecipes();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Saved Recipes</h1>
        <p className="text-gray-600">Your collection of favorite recipes</p>
      </div>

      {recipes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No saved recipes yet</h2>
            <p className="text-gray-500 mb-6">
              Save recipes from your dashboard to build your collection
            </p>
            <Link href="/dashboard">
              <Button>
                <ChefHat className="w-4 h-4 mr-2" />
                Find Recipes
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{recipe.heroEmoji}</span>
                    <div>
                      <CardTitle className="text-lg">{recipe.name}</CardTitle>
                      <p className="text-sm text-gray-500">{recipe.cuisineType}</p>
                    </div>
                  </div>
                  <Badge className={difficultyColors[recipe.difficulty]}>
                    {recipe.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {recipe.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{recipe.totalTime} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{recipe.servings} servings</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {recipe.isOnePot && <Badge variant="secondary">One Pot</Badge>}
                  {recipe.isVegetarian && <Badge variant="secondary">Vegetarian</Badge>}
                  {recipe.isVegan && <Badge variant="secondary">Vegan</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

