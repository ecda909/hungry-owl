"use client";

import { OnboardingData } from "@/app/(protected)/onboarding/page";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Users } from "lucide-react";

interface Props {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const ageRanges = [
  "Under 5",
  "5-12",
  "13-17",
  "18-30",
  "31-50",
  "51-65",
  "65+",
];

export function HouseholdStep({ data, updateData }: Props) {
  const toggleAgeRange = (age: string) => {
    const current = data.householdAges;
    if (current.includes(age)) {
      updateData({ householdAges: current.filter((a) => a !== age) });
    } else {
      updateData({ householdAges: [...current, age] });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-orange-500" />
          <Label className="text-lg font-semibold">Household Size</Label>
        </div>
        <p className="text-gray-600 mb-4">
          How many people do you usually cook for?
        </p>
        <div className="flex items-center justify-center gap-6 py-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              updateData({ householdSize: Math.max(1, data.householdSize - 1) })
            }
            disabled={data.householdSize <= 1}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <div className="text-center">
            <span className="text-5xl font-bold text-orange-500">
              {data.householdSize}
            </span>
            <p className="text-gray-500 text-sm mt-1">
              {data.householdSize === 1 ? "person" : "people"}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              updateData({ householdSize: Math.min(12, data.householdSize + 1) })
            }
            disabled={data.householdSize >= 12}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div>
        <Label className="text-lg font-semibold mb-2 block">Age Ranges</Label>
        <p className="text-gray-600 mb-4">
          Select the age groups in your household (helps with portion sizes and nutrition)
        </p>
        <div className="flex flex-wrap gap-2">
          {ageRanges.map((age) => (
            <Button
              key={age}
              variant={data.householdAges.includes(age) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleAgeRange(age)}
              className="rounded-full"
            >
              {age}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

