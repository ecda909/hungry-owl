"use client";

import { OnboardingData } from "@/app/(protected)/onboarding/page";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Props {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const cookwareItems = [
  { name: "Frying Pan", emoji: "🍳" },
  { name: "Wok", emoji: "🥘" },
  { name: "Dutch Oven", emoji: "🫕" },
  { name: "Cast Iron Skillet", emoji: "🍳" },
  { name: "Baking Sheet", emoji: "📋" },
  { name: "Casserole Dish", emoji: "🥧" },
  { name: "Stock Pot", emoji: "🍲" },
  { name: "Sauce Pan", emoji: "🫕" },
  { name: "Grill Pan", emoji: "🥩" },
  { name: "Roasting Pan", emoji: "🍗" },
  { name: "Pizza Stone", emoji: "🍕" },
  { name: "Steamer", emoji: "🥟" },
];

const applianceItems = [
  { name: "Slow Cooker", emoji: "⏰" },
  { name: "Instant Pot", emoji: "🫕" },
  { name: "Air Fryer", emoji: "🍟" },
  { name: "Stand Mixer", emoji: "🎂" },
  { name: "Food Processor", emoji: "🥗" },
  { name: "Blender", emoji: "🥤" },
  { name: "Rice Cooker", emoji: "🍚" },
  { name: "Toaster Oven", emoji: "🍞" },
  { name: "Sous Vide", emoji: "🌡️" },
  { name: "Bread Machine", emoji: "🍞" },
  { name: "Waffle Maker", emoji: "🧇" },
  { name: "Grill", emoji: "🔥" },
];

export function KitchenStep({ data, updateData }: Props) {
  const toggleItem = (field: "cookware" | "appliances", item: string) => {
    const current = data[field];
    if (current.includes(item)) {
      updateData({ [field]: current.filter((i: string) => i !== item) });
    } else {
      updateData({ [field]: [...current, item] });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <Label className="text-lg font-semibold mb-2 block">Cookware You Have</Label>
        <p className="text-gray-600 text-sm mb-4">
          Select the pots, pans, and dishes in your kitchen
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {cookwareItems.map((item) => (
            <Button
              key={item.name}
              variant={data.cookware.includes(item.name) ? "default" : "outline"}
              className="h-auto py-3 justify-start gap-2"
              onClick={() => toggleItem("cookware", item.name)}
            >
              <span className="text-lg">{item.emoji}</span>
              <span className="text-sm">{item.name}</span>
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-lg font-semibold mb-2 block">Appliances You Have</Label>
        <p className="text-gray-600 text-sm mb-4">
          Select the appliances available in your kitchen
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {applianceItems.map((item) => (
            <Button
              key={item.name}
              variant={data.appliances.includes(item.name) ? "default" : "outline"}
              className="h-auto py-3 justify-start gap-2"
              onClick={() => toggleItem("appliances", item.name)}
            >
              <span className="text-lg">{item.emoji}</span>
              <span className="text-sm">{item.name}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

