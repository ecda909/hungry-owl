"use client";

import { OnboardingData } from "@/app/(protected)/onboarding/page";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Props {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const cuisines = [
  { name: "Italian", emoji: "🍝" },
  { name: "Mexican", emoji: "🌮" },
  { name: "Chinese", emoji: "🥡" },
  { name: "Japanese", emoji: "🍣" },
  { name: "Indian", emoji: "🍛" },
  { name: "Thai", emoji: "🍜" },
  { name: "Mediterranean", emoji: "🫒" },
  { name: "American", emoji: "🍔" },
  { name: "French", emoji: "🥐" },
  { name: "Korean", emoji: "🥘" },
  { name: "Vietnamese", emoji: "🍲" },
  { name: "Greek", emoji: "🥙" },
  { name: "Middle Eastern", emoji: "🧆" },
  { name: "Spanish", emoji: "🥘" },
  { name: "Caribbean", emoji: "🥥" },
  { name: "African", emoji: "🍖" },
];

const ratings = [
  { value: "love", label: "Love it!", color: "bg-green-500 text-white" },
  { value: "like", label: "Like", color: "bg-green-100 text-green-700" },
  { value: "neutral", label: "Okay", color: "bg-gray-100 text-gray-700" },
  { value: "dislike", label: "Not for me", color: "bg-red-100 text-red-700" },
];

export function CuisineStep({ data, updateData }: Props) {
  const setRating = (cuisine: string, rating: string) => {
    updateData({
      cuisinePreferences: {
        ...data.cuisinePreferences,
        [cuisine]: rating,
      },
    });
  };

  const getRating = (cuisine: string) => data.cuisinePreferences[cuisine] || "neutral";

  return (
    <div>
      <Label className="text-lg font-semibold mb-2 block">Rate Your Cuisine Preferences</Label>
      <p className="text-gray-600 mb-6">
        Tell us which cuisines you enjoy so we can tailor recipe suggestions
      </p>

      <div className="space-y-3">
        {cuisines.map((cuisine) => (
          <div
            key={cuisine.name}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{cuisine.emoji}</span>
              <span className="font-medium text-gray-900">{cuisine.name}</span>
            </div>
            <div className="flex gap-1">
              {ratings.map((rating) => (
                <button
                  key={rating.value}
                  onClick={() => setRating(cuisine.name, rating.value)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-all",
                    getRating(cuisine.name) === rating.value
                      ? rating.color
                      : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
                  )}
                >
                  {rating.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

