import { getUserProfile } from "@/lib/actions/user";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const user = await getUserProfile();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your profile and preferences</p>
      </div>

      <SettingsClient user={user} />
    </div>
  );
}

