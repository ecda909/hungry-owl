import { getUserInventory, getIngredients, getPantryStaples, getRecommendedIngredients } from "@/lib/actions/inventory";
import { InventoryClient } from "./inventory-client";

export default async function InventoryPage() {
  const [inventory, ingredients, pantryStaples, recommendations] = await Promise.all([
    getUserInventory(),
    getIngredients(),
    getPantryStaples(),
    getRecommendedIngredients(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600">Track what&apos;s in your fridge, freezer, and pantry</p>
        </div>
      </div>

      <InventoryClient
        initialInventory={inventory}
        ingredients={ingredients}
        pantryStaples={pantryStaples}
        recommendations={recommendations}
      />
    </div>
  );
}

