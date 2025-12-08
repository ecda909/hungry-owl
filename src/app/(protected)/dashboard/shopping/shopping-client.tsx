"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search, Copy, ShoppingCart, Check, Loader2, Database, Globe, PlusCircle, Package } from "lucide-react";
import { createShoppingList, addItemToList, toggleItemChecked, removeItemFromList, clearCheckedItems, markItemPurchased, type ShoppingItem } from "@/lib/actions/shopping";
import type { ShoppingList, Ingredient, IngredientCategory } from "@/generated/prisma";

interface SearchResult {
  id?: string;
  name: string;
  category: string;
  commonUnits: string[];
  emoji: string;
  source: 'local' | 'usda';
  fdcId?: number;
}

interface Props {
  activeList: ShoppingList | null;
  allLists: ShoppingList[];
  ingredients: Ingredient[];
}

const categoryOrder = ["PRODUCE", "PROTEIN", "DAIRY", "GRAINS", "FROZEN", "PANTRY", "BEVERAGES", "SPICES", "OTHER"];

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function ShoppingClient({ activeList: initialList, ingredients }: Props) {
  const router = useRouter();
  const [list, setList] = useState(initialList);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [customItem, setCustomItem] = useState("");

  const debouncedSearch = useDebounce(search, 300);

  const items = (list?.items as unknown as ShoppingItem[]) || [];
  const checkedCount = items.filter((i) => i.checked).length;

  // Sync list with prop changes (after server revalidation)
  useEffect(() => {
    setList(initialList);
  }, [initialList]);

  // Search for ingredients using the API (same as inventory)
  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/ingredients/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      // Fall back to local search
      const localResults = ingredients
        .filter((ing) =>
          ing.name.toLowerCase().includes(query.toLowerCase()) ||
          ing.aliases.some((a) => a.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 10)
        .map((ing) => ({
          id: ing.id,
          name: ing.name,
          category: ing.category,
          commonUnits: ing.commonUnits,
          emoji: ing.emoji,
          source: 'local' as const,
        }));
      setSearchResults(localResults);
    } finally {
      setIsSearching(false);
    }
  }, [ingredients]);

  // Trigger search when debounced value changes
  useEffect(() => {
    performSearch(debouncedSearch);
  }, [debouncedSearch, performSearch]);

  // Check if search term matches any result exactly
  const hasExactMatch = searchResults.some(
    r => r.name.toLowerCase() === search.toLowerCase()
  );

  const handleCreateList = async () => {
    try {
      const newList = await createShoppingList();
      setList(newList);
      toast.success("New shopping list created");
      router.refresh();
    } catch {
      toast.error("Failed to create list");
    }
  };

  const handleAddItem = async (item: SearchResult) => {
    if (!list) return;
    try {
      await addItemToList(list.id, {
        name: item.name,
        quantity: 1,
        unit: item.commonUnits[0] || "piece",
        category: item.category as IngredientCategory,
        ingredientId: item.id,
        emoji: item.emoji,
      });
      setSearch("");
      setSearchResults([]);
      toast.success(`Added ${item.name}`);
      router.refresh();
    } catch {
      toast.error("Failed to add item");
    }
  };

  const handleAddCustomItem = async (itemName?: string) => {
    const name = itemName || customItem.trim();
    if (!list || !name) return;
    try {
      await addItemToList(list.id, {
        name,
        quantity: 1,
        unit: "item",
        category: "OTHER",
      });
      setCustomItem("");
      setSearch("");
      setSearchResults([]);
      toast.success(`Added ${name}`);
      router.refresh();
    } catch {
      toast.error("Failed to add item");
    }
  };

  const handleToggle = async (item: ShoppingItem) => {
    if (!list) return;

    const wasChecked = item.checked;
    await toggleItemChecked(list.id, item.id);

    // If checking off (not unchecking), offer to add to inventory
    if (!wasChecked) {
      toast.success(`Checked off ${item.name}`, {
        action: {
          label: "Add to Inventory",
          onClick: async () => {
            try {
              await markItemPurchased(list.id, item.id);
              toast.success(`${item.name} added to your inventory!`);
              router.refresh();
            } catch {
              toast.error("Failed to add to inventory");
            }
          },
        },
        duration: 5000,
      });
    }
    router.refresh();
  };

  const handleRemove = async (itemId: string) => {
    if (!list) return;
    await removeItemFromList(list.id, itemId);
    toast.success("Item removed");
    router.refresh();
  };

  const handleClearChecked = async () => {
    if (!list) return;
    await clearCheckedItems(list.id);
    toast.success("Cleared checked items");
    router.refresh();
  };

  const handleCopyToClipboard = () => {
    const text = items.filter((i) => !i.checked).map((i) => `- ${i.quantity} ${i.unit} ${i.name}`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const groupedItems = categoryOrder.reduce((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  if (!list) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No active shopping list</h2>
          <p className="text-gray-500 mb-6">Create a new list to start tracking your groceries</p>
          <Button onClick={handleCreateList}>
            <Plus className="w-4 h-4 mr-2" />Create Shopping List
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Items */}
      <Card>
        <CardHeader>
          <CardTitle>Add Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search ingredients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {search && (
            <div className="max-h-64 overflow-y-auto border rounded-lg">
              {isSearching ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Searching...
                </div>
              ) : (
                <>
                  {searchResults.map((item, index) => (
                    <button
                      key={item.id || `search-${index}`}
                      onClick={() => handleAddItem(item)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-b last:border-b-0"
                    >
                      <span className="text-lg">{item.emoji}</span>
                      <span className="flex-1">{item.name}</span>
                      <div className="flex items-center gap-1">
                        {item.source === 'usda' ? (
                          <Globe className="w-3 h-3 text-blue-500" title="From USDA Database" />
                        ) : (
                          <Database className="w-3 h-3 text-green-500" title="Local Database" />
                        )}
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      </div>
                    </button>
                  ))}

                  {/* Always show custom item option if not an exact match */}
                  {search.length >= 2 && !hasExactMatch && (
                    <button
                      onClick={() => handleAddCustomItem(search)}
                      className="w-full px-3 py-2 text-left hover:bg-purple-50 flex items-center gap-2 border-t bg-purple-25"
                    >
                      <PlusCircle className="w-5 h-5 text-purple-500" />
                      <span className="flex-1">
                        Add <strong>&quot;{search}&quot;</strong> as custom item
                      </span>
                      <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">Custom</Badge>
                    </button>
                  )}

                  {searchResults.length === 0 && search.length >= 2 && (
                    <div className="py-4 text-center text-gray-500 text-sm">
                      No matching ingredients found
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Quick add custom item */}
          <div className="flex gap-2">
            <Input
              placeholder="Quick add custom item..."
              value={customItem}
              onChange={(e) => setCustomItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCustomItem()}
            />
            <Button onClick={() => handleAddCustomItem()} disabled={!customItem.trim()}>
              <Plus className="w-4 h-4 mr-1" />Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shopping List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            {list.name}
            <Badge variant="secondary">{items.length - checkedCount} remaining</Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
              <Copy className="w-4 h-4 mr-1" />Copy
            </Button>
            {checkedCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearChecked}>
                <Check className="w-4 h-4 mr-1" />Clear {checkedCount}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No items in your list yet</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, catItems]) => (
                <div key={category}>
                  <h3 className="font-medium text-gray-700 mb-2 text-sm uppercase tracking-wide">{category}</h3>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {catItems.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${item.checked ? "bg-gray-50 border-gray-100" : "bg-white border-gray-200"}`}
                        >
                          <Checkbox checked={item.checked} onCheckedChange={() => handleToggle(item)} />
                          <span className={`flex-1 ${item.checked ? "line-through text-gray-400" : ""}`}>
                            {item.quantity} {item.unit} <span className="font-medium">{item.name}</span>
                          </span>
                          <Button variant="ghost" size="icon" onClick={() => handleRemove(item.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

