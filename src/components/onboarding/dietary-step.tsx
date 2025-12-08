"use client";

import { OnboardingData } from "@/app/(protected)/onboarding/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, AlertTriangle, Ban, ThumbsDown, Check, Settings2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const commonAllergies = ["Peanuts", "Tree Nuts", "Dairy", "Eggs", "Wheat", "Gluten", "Soy", "Shellfish", "Fish", "Sesame"];

const restrictionDetails: Record<string, { description: string; avoidableFoods: string[] }> = {
  "Vegetarian": { description: "No meat or fish", avoidableFoods: ["Gelatin", "Rennet", "Fish Sauce", "Bone Broth"] },
  "Vegan": { description: "No animal products", avoidableFoods: ["Honey", "Gelatin", "Casein", "Whey", "Eggs"] },
  "Pescatarian": { description: "Fish but no meat", avoidableFoods: ["Poultry", "Red Meat", "Pork"] },
  "Kosher": { description: "Following Jewish dietary laws", avoidableFoods: ["Shellfish", "Pork", "Mixing Meat & Dairy"] },
  "Halal": { description: "Following Islamic dietary laws", avoidableFoods: ["Pork", "Alcohol", "Non-Halal Meat"] },
  "Keto": { description: "Very low carb, high fat", avoidableFoods: ["Sugar", "Grains", "Most Fruits", "Starchy Vegetables"] },
  "Paleo": { description: "Whole foods, no processed", avoidableFoods: ["Grains", "Legumes", "Dairy", "Refined Sugar", "Processed Foods"] },
  "Low-Carb": { description: "Reduced carbohydrate intake", avoidableFoods: ["Bread", "Pasta", "Rice", "Potatoes", "Sugar"] },
  "Low-Sodium": { description: "Reduced salt intake", avoidableFoods: ["Canned Soups", "Processed Meats", "Soy Sauce", "Chips"] },
  "Dairy-Free": { description: "No dairy products", avoidableFoods: ["Milk", "Cheese", "Butter", "Cream", "Yogurt"] },
};

const commonDislikes = ["Cilantro", "Mushrooms", "Olives", "Anchovies", "Brussels Sprouts", "Liver", "Blue Cheese", "Spicy Food", "Raw Onion", "Coconut"];

export function DietaryStep({ data, updateData }: Props) {
  const [customAllergy, setCustomAllergy] = useState("");
  const [customDislike, setCustomDislike] = useState("");
  const [expandedRestriction, setExpandedRestriction] = useState<string | null>(null);

  const toggleItem = (field: "allergies" | "restrictions" | "dislikes", item: string) => {
    const current = data[field];
    if (current.includes(item)) {
      updateData({ [field]: current.filter((i: string) => i !== item) });
      // Also remove from restrictionDetails if it's a restriction
      if (field === "restrictions" && data.restrictionDetails?.[item]) {
        const newDetails = { ...data.restrictionDetails };
        delete newDetails[item];
        updateData({ restrictionDetails: newDetails });
      }
    } else {
      updateData({ [field]: [...current, item] });
      // Show the strict/flexible options when selecting a restriction
      if (field === "restrictions") {
        setExpandedRestriction(item);
      }
    }
  };

  const setRestrictionStrict = (restriction: string, strict: boolean, avoidFoods?: string[]) => {
    const newDetails = {
      ...data.restrictionDetails,
      [restriction]: { strict, avoidFoods: avoidFoods || [] },
    };
    updateData({ restrictionDetails: newDetails });
  };

  const toggleAvoidFood = (restriction: string, food: string) => {
    const current = data.restrictionDetails?.[restriction]?.avoidFoods || [];
    const newFoods = current.includes(food)
      ? current.filter((f) => f !== food)
      : [...current, food];
    setRestrictionStrict(restriction, data.restrictionDetails?.[restriction]?.strict || false, newFoods);
  };

  const addCustomItem = (field: "allergies" | "dislikes", value: string, setValue: React.Dispatch<React.SetStateAction<string>>) => {
    const trimmedValue = value.trim();
    if (trimmedValue && !data[field].includes(trimmedValue)) {
      updateData({ [field]: [...data[field], trimmedValue] });
      setValue("");
    }
  };

  const handleAddAllergy = () => {
    addCustomItem("allergies", customAllergy, setCustomAllergy);
  };

  const handleAddDislike = () => {
    addCustomItem("dislikes", customDislike, setCustomDislike);
  };

  return (
    <div className="space-y-8">
      {/* Allergies */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <Label className="text-lg font-semibold">Allergies</Label>
        </div>
        <p className="text-gray-600 text-sm mb-3">We&apos;ll never suggest recipes with these ingredients</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {commonAllergies.map((allergy) => (
            <Button
              key={allergy}
              variant={data.allergies.includes(allergy) ? "destructive" : "outline"}
              size="sm"
              onClick={() => toggleItem("allergies", allergy)}
              className="rounded-full"
            >
              {allergy}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add custom allergy..."
            value={customAllergy}
            onChange={(e) => setCustomAllergy(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddAllergy();
              }
            }}
          />
          <Button variant="outline" onClick={handleAddAllergy}>Add</Button>
        </div>
        {data.allergies.filter(a => !commonAllergies.includes(a)).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {data.allergies.filter(a => !commonAllergies.includes(a)).map((allergy) => (
              <Badge key={allergy} variant="destructive" className="gap-1">
                {allergy}
                <X className="w-3 h-3 cursor-pointer" onClick={() => toggleItem("allergies", allergy)} />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Dietary Restrictions */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Ban className="w-5 h-5 text-orange-500" />
          <Label className="text-lg font-semibold">Dietary Restrictions</Label>
        </div>
        <p className="text-gray-600 text-sm mb-3">Select any diets you follow (click to configure)</p>
        <div className="space-y-2">
          {Object.entries(restrictionDetails).map(([restriction, details]) => {
            const isSelected = data.restrictions.includes(restriction);
            const isExpanded = expandedRestriction === restriction && isSelected;
            const restrictionData = data.restrictionDetails?.[restriction];
            const isStrict = restrictionData?.strict ?? true;

            return (
              <div key={restriction} className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setExpandedRestriction(isExpanded ? null : restriction);
                    } else {
                      toggleItem("restrictions", restriction);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-3 text-left transition-colors",
                    isSelected ? "bg-orange-50" : "hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      isSelected ? "border-orange-500 bg-orange-500" : "border-gray-300"
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <span className="font-medium">{restriction}</span>
                      <span className="text-gray-500 text-sm ml-2">{details.description}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-2">
                      <Badge variant={isStrict ? "default" : "secondary"} className="text-xs">
                        {isStrict ? "Strict" : "Flexible"}
                      </Badge>
                      <Settings2 className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </button>

                {isExpanded && (
                  <div className="p-4 bg-gray-50 border-t space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Following strictly?</Label>
                        <p className="text-sm text-gray-500">
                          {isStrict
                            ? "We'll completely exclude all restricted foods"
                            : "Select which foods you still want to avoid"}
                        </p>
                      </div>
                      <Switch
                        checked={isStrict}
                        onCheckedChange={(checked) => setRestrictionStrict(restriction, checked, restrictionData?.avoidFoods)}
                      />
                    </div>

                    {!isStrict && (
                      <div>
                        <Label className="text-sm mb-2 block">Which foods do you want to avoid?</Label>
                        <div className="flex flex-wrap gap-2">
                          {details.avoidableFoods.map((food) => (
                            <Button
                              key={food}
                              variant={restrictionData?.avoidFoods?.includes(food) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleAvoidFood(restriction, food)}
                              className="rounded-full text-xs"
                            >
                              {food}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => toggleItem("restrictions", restriction)}
                    >
                      <X className="w-3 h-3 mr-1" /> Remove {restriction}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dislikes */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ThumbsDown className="w-5 h-5 text-gray-500" />
          <Label className="text-lg font-semibold">Dislikes</Label>
        </div>
        <p className="text-gray-600 text-sm mb-3">Foods you prefer to avoid (we&apos;ll try to skip these)</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {commonDislikes.map((dislike) => (
            <Button
              key={dislike}
              variant={data.dislikes.includes(dislike) ? "secondary" : "outline"}
              size="sm"
              onClick={() => toggleItem("dislikes", dislike)}
              className="rounded-full"
            >
              {dislike}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add another dislike..."
            value={customDislike}
            onChange={(e) => setCustomDislike(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddDislike();
              }
            }}
          />
          <Button variant="outline" onClick={handleAddDislike}>Add</Button>
        </div>
        {data.dislikes.filter(d => !commonDislikes.includes(d)).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {data.dislikes.filter(d => !commonDislikes.includes(d)).map((dislike) => (
              <Badge key={dislike} variant="secondary" className="gap-1">
                {dislike}
                <X className="w-3 h-3 cursor-pointer" onClick={() => toggleItem("dislikes", dislike)} />
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

