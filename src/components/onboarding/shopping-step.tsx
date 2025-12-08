"use client";

import { OnboardingData } from "@/app/(protected)/onboarding/page";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Props {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const stores = [
  { name: "Whole Foods", emoji: "🥬" },
  { name: "Trader Joe's", emoji: "🌻" },
  { name: "Costco", emoji: "📦" },
  { name: "Kroger", emoji: "🛒" },
  { name: "Safeway", emoji: "🏪" },
  { name: "Walmart", emoji: "🏬" },
  { name: "Target", emoji: "🎯" },
  { name: "Aldi", emoji: "💰" },
  { name: "Publix", emoji: "🌴" },
  { name: "Sprouts", emoji: "🌱" },
  { name: "Local Market", emoji: "🏘️" },
  { name: "Other", emoji: "🛍️" },
];

const frequencies = [
  { value: "daily", label: "Daily", description: "I shop almost every day" },
  { value: "weekly", label: "Weekly", description: "Once or twice a week" },
  { value: "biweekly", label: "Bi-weekly", description: "Every two weeks" },
  { value: "monthly", label: "Monthly", description: "Big monthly hauls" },
];

const budgets = [
  { value: "budget", label: "Budget-Friendly", emoji: "💰", description: "Focus on affordable ingredients" },
  { value: "moderate", label: "Moderate", emoji: "⚖️", description: "Balance of value and quality" },
  { value: "premium", label: "Premium", emoji: "✨", description: "Best ingredients, no budget limits" },
];

export function ShoppingStep({ data, updateData }: Props) {
  const toggleStore = (store: string) => {
    const current = data.preferredStores;
    if (current.includes(store)) {
      updateData({ preferredStores: current.filter((s) => s !== store) });
    } else {
      updateData({ preferredStores: [...current, store] });
    }
  };

  return (
    <div className="space-y-8">
      {/* Preferred Stores */}
      <div>
        <Label className="text-lg font-semibold mb-2 block">Preferred Stores</Label>
        <p className="text-gray-600 text-sm mb-4">Where do you usually shop? (Select all that apply)</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {stores.map((store) => (
            <Button
              key={store.name}
              variant={data.preferredStores.includes(store.name) ? "default" : "outline"}
              className="h-auto py-3 justify-start gap-2"
              onClick={() => toggleStore(store.name)}
            >
              <span>{store.emoji}</span>
              <span className="text-sm">{store.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Shopping Frequency */}
      <div>
        <Label className="text-lg font-semibold mb-2 block">Shopping Frequency</Label>
        <p className="text-gray-600 text-sm mb-4">How often do you typically grocery shop?</p>
        <div className="grid grid-cols-2 gap-2">
          {frequencies.map((freq) => (
            <button
              key={freq.value}
              onClick={() => updateData({ shoppingFrequency: freq.value })}
              className={cn(
                "p-3 rounded-lg border-2 text-left transition-all",
                data.shoppingFrequency === freq.value
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-orange-200"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{freq.label}</span>
                {data.shoppingFrequency === freq.value && (
                  <Check className="w-4 h-4 text-orange-500" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{freq.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Budget Preference */}
      <div>
        <Label className="text-lg font-semibold mb-2 block">Budget Preference</Label>
        <p className="text-gray-600 text-sm mb-4">What&apos;s your approach to grocery spending?</p>
        <div className="space-y-2">
          {budgets.map((budget) => (
            <button
              key={budget.value}
              onClick={() => updateData({ budgetPreference: budget.value })}
              className={cn(
                "w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-4",
                data.budgetPreference === budget.value
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-orange-200"
              )}
            >
              <span className="text-2xl">{budget.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{budget.label}</span>
                  {data.budgetPreference === budget.value && (
                    <Check className="w-4 h-4 text-orange-500" />
                  )}
                </div>
                <p className="text-xs text-gray-500">{budget.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

