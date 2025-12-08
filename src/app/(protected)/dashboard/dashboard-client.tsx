"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Clock, ChefHat, Sparkles, AlertTriangle, 
  Refrigerator, ShoppingCart, ArrowRight, Loader2
} from "lucide-react";
import type { UserInventory, Ingredient, UserProfile } from "@/generated/prisma";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { generateRecipes, type GeneratedRecipe } from "@/lib/actions/recipes";
import { toast } from "sonner";

type InventoryWithIngredient = UserInventory & { ingredient: Ingredient };

interface Props {
  inventory: InventoryWithIngredient[];
  expiringItems: InventoryWithIngredient[];
  userProfile: UserProfile | null | undefined;
}

const timePresets = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "60+ min", value: 60 },
  { label: "All day", value: 180 },
];

export function DashboardClient({ inventory, expiringItems, userProfile }: Props) {
  const [selectedTime, setSelectedTime] = useState(30);
  const [useExpiring, setUseExpiring] = useState(false);
  const [isOnePot, setIsOnePot] = useState(false);
  const [willingToShop, setWillingToShop] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipes, setRecipes] = useState<GeneratedRecipe[]>([]);

  const handleGenerateRecipes = async () => {
    setIsGenerating(true);
    try {
      const result = await generateRecipes({
        maxTime: selectedTime,
        prioritizeExpiring: useExpiring,
        onePotOnly: isOnePot,
        willingToShop,
      });
      setRecipes(result);
      if (result.length === 0) {
        toast.info("No recipes found with your current inventory. Try adding more ingredients!");
      } else {
        toast.success(`Found ${result.length} recipes for you!`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate recipes. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Refrigerator className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inventory.length}</p>
                <p className="text-sm text-gray-500">Items in stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{expiringItems.length}</p>
                <p className="text-sm text-gray-500">Expiring soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ChefHat className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userProfile?.skillLevel || "Beginner"}</p>
                <p className="text-sm text-gray-500">Skill level</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <Link href="/dashboard/shopping" className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">→</p>
                <p className="text-sm text-gray-500">Shopping list</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recipe Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            Get Recipe Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Time Selection */}
          <div>
            <Label className="mb-3 block">How much time do you have?</Label>
            <div className="flex flex-wrap gap-2 mb-4">
              {timePresets.map((preset) => (
                <Button
                  key={preset.value}
                  variant={selectedTime === preset.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTime(preset.value)}
                >
                  <Clock className="w-4 h-4 mr-1" />
                  {preset.label}
                </Button>
              ))}
            </div>
            <Slider value={[selectedTime]} onValueChange={(v) => setSelectedTime(v[0])} max={180} min={10} step={5} className="w-full max-w-md" />
            <p className="text-sm text-gray-500 mt-2">Selected: {selectedTime} minutes</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-6">
            {expiringItems.length > 0 && (
              <div className="flex items-center gap-2">
                <Switch id="expiring" checked={useExpiring} onCheckedChange={setUseExpiring} />
                <Label htmlFor="expiring">Use expiring items first</Label>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch id="onepot" checked={isOnePot} onCheckedChange={setIsOnePot} />
              <Label htmlFor="onepot">One-pot meals only</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="shopping" checked={willingToShop} onCheckedChange={setWillingToShop} />
              <Label htmlFor="shopping" className="flex items-center gap-1">
                <ShoppingCart className="w-4 h-4 text-purple-500" />
                I&apos;m willing to shop for a few items
              </Label>
            </div>
          </div>

          {willingToShop && (
            <div className="p-3 bg-purple-50 rounded-lg text-sm text-purple-700 border border-purple-200">
              <strong>Shopping mode:</strong> We&apos;ll suggest recipes that might need 1-3 additional ingredients, giving you more variety!
            </div>
          )}

          {/* Generate Button */}
          <Button size="lg" onClick={handleGenerateRecipes} disabled={isGenerating || inventory.length === 0} className="w-full sm:w-auto">
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Finding recipes...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Generate Recipes</>
            )}
          </Button>

          {inventory.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Add items to your inventory to get recipe suggestions</p>
              <Link href="/dashboard/inventory">
                <Button variant="outline">
                  <Refrigerator className="w-4 h-4 mr-2" />
                  Go to Inventory
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recipe Results */}
      {recipes.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recommended Recipes</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe, index) => (
              <motion.div key={recipe.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <RecipeCard recipe={recipe} inventory={inventory} />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

