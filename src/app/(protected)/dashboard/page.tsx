import { getUserInventory } from "@/lib/actions/inventory";
import { getUserProfile } from "@/lib/actions/user";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const [inventory, user] = await Promise.all([
    getUserInventory(),
    getUserProfile(),
  ]);

  const expiringItems = inventory.filter(
    (i) => i.status === "EXPIRING" || i.status === "USE_SOON"
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ""}! 🦉
        </h1>
        <p className="text-gray-600">
          What would you like to cook today?
        </p>
      </div>

      <DashboardClient
        inventory={inventory}
        expiringItems={expiringItems}
        userProfile={user?.profile}
      />
    </div>
  );
}

