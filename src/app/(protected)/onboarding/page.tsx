"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { updateUserProfile, completeOnboarding } from "@/lib/actions/user";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { HouseholdStep } from "@/components/onboarding/household-step";
import { DietaryStep } from "@/components/onboarding/dietary-step";
import { CuisineStep } from "@/components/onboarding/cuisine-step";
import { KitchenStep } from "@/components/onboarding/kitchen-step";
import { SkillStep } from "@/components/onboarding/skill-step";
import { ShoppingStep } from "@/components/onboarding/shopping-step";

const steps = [
  { id: "household", title: "Your Household", icon: "🏠" },
  { id: "dietary", title: "Dietary Profile", icon: "🥗" },
  { id: "cuisine", title: "Cuisine Preferences", icon: "🌍" },
  { id: "kitchen", title: "Kitchen Setup", icon: "🍳" },
  { id: "skill", title: "Cooking Level", icon: "👨‍🍳" },
  { id: "shopping", title: "Shopping Habits", icon: "🛒" },
];

export interface OnboardingData {
  householdSize: number;
  householdAges: string[];
  allergies: string[];
  restrictions: string[];
  restrictionDetails: Record<string, { strict: boolean; avoidFoods?: string[] }>;
  dislikes: string[];
  cuisinePreferences: Record<string, string>;
  cookware: string[];
  appliances: string[];
  skillLevel: string;
  preferredStores: string[];
  shoppingFrequency: string;
  budgetPreference: string;
}

const initialData: OnboardingData = {
  householdSize: 1,
  householdAges: [],
  allergies: [],
  restrictions: [],
  restrictionDetails: {},
  dislikes: [],
  cuisinePreferences: {},
  cookware: [],
  appliances: [],
  skillLevel: "beginner",
  preferredStores: [],
  shoppingFrequency: "weekly",
  budgetPreference: "moderate",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      await handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await updateUserProfile(data);
      await completeOnboarding();
      toast.success("Welcome to Hungry Owl! 🦉");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <HouseholdStep data={data} updateData={updateData} />;
      case 1:
        return <DietaryStep data={data} updateData={updateData} />;
      case 2:
        return <CuisineStep data={data} updateData={updateData} />;
      case 3:
        return <KitchenStep data={data} updateData={updateData} />;
      case 4:
        return <SkillStep data={data} updateData={updateData} />;
      case 5:
        return <ShoppingStep data={data} updateData={updateData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">🦉</span>
          <h1 className="text-2xl font-bold text-gray-900">Let&apos;s set up your kitchen</h1>
          <p className="text-gray-600 mt-2">
            This helps us personalize your recipe recommendations
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {steps[currentStep].icon} {steps[currentStep].title}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button onClick={handleNext} disabled={isSubmitting}>
            {currentStep === steps.length - 1 ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                {isSubmitting ? "Saving..." : "Complete Setup"}
              </>
            ) : (
              <>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

