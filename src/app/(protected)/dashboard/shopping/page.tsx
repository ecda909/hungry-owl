import { getActiveShoppingList, getShoppingLists } from "@/lib/actions/shopping";
import { getIngredients } from "@/lib/actions/inventory";
import { ShoppingClient } from "./shopping-client";

export default async function ShoppingPage() {
  const [activeList, allLists, ingredients] = await Promise.all([
    getActiveShoppingList(),
    getShoppingLists(),
    getIngredients(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Shopping List</h1>
        <p className="text-gray-600">Manage your grocery shopping</p>
      </div>

      <ShoppingClient
        activeList={activeList}
        allLists={allLists}
        ingredients={ingredients}
      />
    </div>
  );
}

