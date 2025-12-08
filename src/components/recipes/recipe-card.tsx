"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Clock, ChefHat, Users, Bookmark, ChevronRight, Check, X } from "lucide-react";
import type { GeneratedRecipe } from "@/lib/actions/recipes";
import type { UserInventory, Ingredient } from "@/generated/prisma";
import { saveRecipe } from "@/lib/actions/recipes";

type InventoryWithIngredient = UserInventory & { ingredient: Ingredient };

interface Props {
  recipe: GeneratedRecipe;
  inventory: InventoryWithIngredient[];
}

const difficultyColors = {
  BEGINNER: "bg-green-100 text-green-800",
  INTERMEDIATE: "bg-yellow-100 text-yellow-800",
  ADVANCED: "bg-red-100 text-red-800",
};

export function RecipeCard({ recipe, inventory }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const inventoryNames = inventory.map((i) => i.ingredient.name.toLowerCase());

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveRecipe(recipe);
      toast.success("Recipe saved!");
    } catch {
      toast.error("Failed to save recipe");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setIsOpen(true)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <span className="text-4xl shrink-0">{recipe.heroEmoji}</span>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 leading-tight">{recipe.name}</h3>
                <p className="text-sm text-gray-500">{recipe.cuisineType}</p>
              </div>
            </div>
            <Badge className={`${difficultyColors[recipe.difficulty]} shrink-0`}>
              {recipe.difficulty}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1">
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">{recipe.description}</p>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{recipe.totalTime} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{recipe.servings} servings</span>
            </div>
          </div>

          {/* Match percentage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Ingredient match</span>
              <span className="font-medium text-orange-600">{recipe.matchPercentage}%</span>
            </div>
            <Progress value={recipe.matchPercentage} className="h-2" />
          </div>

          {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Missing: {recipe.missingIngredients.slice(0, 3).join(", ")}
              {recipe.missingIngredients.length > 3 && ` +${recipe.missingIngredients.length - 3} more`}
            </p>
          )}
        </CardContent>

        <CardFooter className="pt-0 gap-2">
          <Button className="flex-1" onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}>
            <ChefHat className="w-4 h-4 mr-2" />Cook This
          </Button>
          <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); handleSave(); }} disabled={isSaving}>
            <Bookmark className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Recipe Detail Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-4xl">{recipe.heroEmoji}</span>
              <div>
                <h2 className="text-xl font-bold">{recipe.name}</h2>
                <p className="text-sm text-gray-500 font-normal">{recipe.cuisineType} • {recipe.mealType}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Quick Info */}
            <div className="flex flex-wrap gap-4">
              <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />{recipe.totalTime} min total</Badge>
              <Badge variant="outline"><ChefHat className="w-3 h-3 mr-1" />{recipe.activeTime} min active</Badge>
              <Badge variant="outline"><Users className="w-3 h-3 mr-1" />{recipe.servings} servings</Badge>
              <Badge className={difficultyColors[recipe.difficulty]}>{recipe.difficulty}</Badge>
              {recipe.isOnePot && <Badge variant="secondary">One Pot</Badge>}
              {recipe.isVegetarian && <Badge variant="secondary">Vegetarian</Badge>}
            </div>

            {/* Ingredients */}
            <div>
              <h3 className="font-semibold mb-3">Ingredients</h3>
              <div className="grid gap-2">
                {recipe.ingredients.map((ing, idx) => {
                  const hasIngredient = inventoryNames.some((n) => n.includes(ing.name.toLowerCase()) || ing.name.toLowerCase().includes(n));
                  return (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {hasIngredient ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <span className={hasIngredient ? "" : "text-gray-500"}>
                        {ing.quantity} {ing.unit} {ing.name}
                        {ing.optional && <span className="text-gray-400"> (optional)</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Steps */}
            <div>
              <h3 className="font-semibold mb-3">Instructions</h3>
              <div className="space-y-4">
                {recipe.steps.map((step) => (
                  <motion.div
                    key={step.stepNumber}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: step.stepNumber * 0.05 }}
                    className="flex gap-4"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-semibold text-sm">
                      {step.stepNumber}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700">{step.instruction}</p>
                      {step.tips && <p className="text-sm text-gray-500 mt-1 italic">💡 {step.tips}</p>}
                      {step.duration && <p className="text-xs text-gray-400 mt-1">{step.duration} min</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Nutrition */}
            {recipe.nutrition && (
              <div>
                <h3 className="font-semibold mb-3">Nutrition (per serving)</h3>
                <div className="flex gap-4 text-sm">
                  <div className="text-center"><p className="font-medium">{recipe.nutrition.calories}</p><p className="text-gray-500">kcal</p></div>
                  <div className="text-center"><p className="font-medium">{recipe.nutrition.protein}g</p><p className="text-gray-500">protein</p></div>
                  <div className="text-center"><p className="font-medium">{recipe.nutrition.carbs}g</p><p className="text-gray-500">carbs</p></div>
                  <div className="text-center"><p className="font-medium">{recipe.nutrition.fat}g</p><p className="text-gray-500">fat</p></div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                <Bookmark className="w-4 h-4 mr-2" />Save Recipe
              </Button>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

