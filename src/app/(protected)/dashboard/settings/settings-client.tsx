"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { updateUserProfile } from "@/lib/actions/user";
import { User, UserProfile } from "@/generated/prisma";
import { UserButton } from "@clerk/nextjs";
import { Save, Loader2 } from "lucide-react";

interface Props {
  user: (User & { profile: UserProfile | null }) | null;
}

export function SettingsClient({ user }: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const profile = user?.profile;

  const [allergies, setAllergies] = useState<string[]>(profile?.allergies || []);
  const [restrictions, setRestrictions] = useState<string[]>(profile?.restrictions || []);
  const [skillLevel, setSkillLevel] = useState(profile?.skillLevel || "beginner");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile({
        allergies,
        restrictions,
        skillLevel,
      });
      toast.success("Settings saved!");
      router.refresh();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleItem = (list: string[], setList: (l: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <UserButton
              appearance={{
                elements: { avatarBox: "w-16 h-16" },
              }}
            />
            <div>
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dietary Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Dietary Preferences</CardTitle>
          <CardDescription>Update your dietary restrictions and allergies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-2 block">Allergies</Label>
            <div className="flex flex-wrap gap-2">
              {["Peanuts", "Tree Nuts", "Dairy", "Eggs", "Wheat", "Gluten", "Soy", "Shellfish", "Fish"].map((allergy) => (
                <Badge
                  key={allergy}
                  variant={allergies.includes(allergy) ? "destructive" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleItem(allergies, setAllergies, allergy)}
                >
                  {allergy}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Dietary Restrictions</Label>
            <div className="flex flex-wrap gap-2">
              {["Vegetarian", "Vegan", "Pescatarian", "Kosher", "Halal", "Keto", "Paleo", "Low-Carb"].map((restriction) => (
                <Badge
                  key={restriction}
                  variant={restrictions.includes(restriction) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleItem(restrictions, setRestrictions, restriction)}
                >
                  {restriction}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Skill Level</Label>
            <div className="flex gap-2">
              {["beginner", "intermediate", "advanced"].map((level) => (
                <Button
                  key={level}
                  variant={skillLevel === level ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSkillLevel(level)}
                  className="capitalize"
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Expiring Items Alerts</Label>
              <p className="text-sm text-gray-500">Get notified when items are about to expire</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Recipe Suggestions</Label>
              <p className="text-sm text-gray-500">Weekly recipe recommendations based on your inventory</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
        ) : (
          <><Save className="w-4 h-4 mr-2" />Save Settings</>
        )}
      </Button>
    </div>
  );
}

