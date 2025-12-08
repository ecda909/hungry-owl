"use client";

import { OnboardingData } from "@/app/(protected)/onboarding/page";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Props {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const skillLevels = [
  {
    value: "beginner",
    title: "Beginner",
    emoji: "🌱",
    description: "I'm new to cooking or prefer simple recipes",
    features: ["Simple techniques", "Few ingredients", "Clear instructions", "Basic equipment"],
  },
  {
    value: "intermediate",
    title: "Intermediate",
    emoji: "🍳",
    description: "I'm comfortable in the kitchen and enjoy trying new things",
    features: ["Multi-step recipes", "Various techniques", "Some complex ingredients", "More variety"],
  },
  {
    value: "advanced",
    title: "Advanced",
    emoji: "👨‍🍳",
    description: "I love a challenge and want to expand my culinary skills",
    features: ["Complex techniques", "Specialty ingredients", "Restaurant-quality", "Creative freedom"],
  },
];

export function SkillStep({ data, updateData }: Props) {
  return (
    <div>
      <Label className="text-lg font-semibold mb-2 block">Your Cooking Skill Level</Label>
      <p className="text-gray-600 mb-6">
        This helps us match you with appropriate recipes
      </p>

      <div className="space-y-4">
        {skillLevels.map((level) => (
          <button
            key={level.value}
            onClick={() => updateData({ skillLevel: level.value })}
            className={cn(
              "w-full p-4 rounded-xl border-2 text-left transition-all",
              data.skillLevel === level.value
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/50"
            )}
          >
            <div className="flex items-start gap-4">
              <span className="text-4xl">{level.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{level.title}</h3>
                  {data.skillLevel === level.value && (
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-gray-600 text-sm mt-1">{level.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {level.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

