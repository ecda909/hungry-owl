"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addToInventory, removeFromInventory, updateInventoryItem, createIngredientFromUSDA, createCustomIngredient } from "@/lib/actions/inventory";
import { Plus, Minus, Trash2, Search, AlertTriangle, Loader2, Database, Globe, PlusCircle, Edit3, Sparkles } from "lucide-react";
import type { UserInventory, Ingredient, PantryStaple, IngredientCategory } from "@/generated/prisma";

type InventoryWithIngredient = UserInventory & { ingredient: Ingredient };
type PantryStapleWithIngredient = PantryStaple & { ingredient: Ingredient };

// Search result type that can be either local or from USDA
interface SearchResult {
  id?: string;
  name: string;
  category: string;
  commonUnits: string[];
  emoji: string;
  source: 'local' | 'usda';
  fdcId?: number;
}

interface RecommendedItem {
  name: string;
  category: string;
  reason: string;
  emoji: string;
}

interface Recommendations {
  recommendations: RecommendedItem[];
  isWellStocked: boolean;
  message: string;
}

interface Props {
  initialInventory: InventoryWithIngredient[];
  ingredients: Ingredient[];
  pantryStaples: PantryStapleWithIngredient[];
  recommendations: Recommendations;
}

const categories: { value: IngredientCategory; label: string; emoji: string }[] = [
  { value: "PRODUCE", label: "Produce", emoji: "🥬" },
  { value: "PROTEIN", label: "Protein", emoji: "🥩" },
  { value: "DAIRY", label: "Dairy", emoji: "🧀" },
  { value: "GRAINS", label: "Grains", emoji: "🌾" },
  { value: "PANTRY", label: "Pantry", emoji: "🫙" },
  { value: "FROZEN", label: "Frozen", emoji: "🧊" },
  { value: "SPICES", label: "Spices", emoji: "🌿" },
  { value: "BEVERAGES", label: "Beverages", emoji: "🥤" },
];

const statusColors = {
  FRESH: "bg-green-100 text-green-800",
  USE_SOON: "bg-yellow-100 text-yellow-800",
  EXPIRING: "bg-orange-100 text-orange-800",
  EXPIRED: "bg-red-100 text-red-800",
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function InventoryClient({ initialInventory, ingredients, pantryStaples, recommendations }: Props) {
  const router = useRouter();
  const [inventory, setInventory] = useState(initialInventory);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryWithIngredient | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<SearchResult | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("");
  const [storage, setStorage] = useState<"FRIDGE" | "FREEZER" | "PANTRY">("FRIDGE");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Custom ingredient state
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customCategory, setCustomCategory] = useState<IngredientCategory>("PANTRY");
  const [customEmoji, setCustomEmoji] = useState("🍽️");

  const debouncedSearch = useDebounce(search, 300);

  // Update inventory when initialInventory changes (after server revalidation)
  useEffect(() => {
    setInventory(initialInventory);
  }, [initialInventory]);

  // Search for ingredients using the API
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
          emoji: ing.emoji || "🍽️",
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

  const handleAddItem = async () => {
    if (!selectedIngredient) return;
    try {
      let ingredientId = selectedIngredient.id;

      // If this is a USDA ingredient without an ID, we need to create it first
      if (selectedIngredient.source === 'usda' && !ingredientId) {
        const newIngredient = await createIngredientFromUSDA({
          name: selectedIngredient.name,
          category: selectedIngredient.category as IngredientCategory,
          commonUnits: selectedIngredient.commonUnits,
          emoji: selectedIngredient.emoji,
          fdcId: selectedIngredient.fdcId,
        });
        ingredientId = newIngredient.id;
      }

      if (!ingredientId) {
        toast.error("Could not find or create ingredient");
        return;
      }

      await addToInventory({
        ingredientId,
        quantity,
        unit: unit || selectedIngredient.commonUnits[0] || "piece",
        storageLocation: storage,
      });
      toast.success(`Added ${selectedIngredient.name} to inventory`);
      setIsAddOpen(false);
      resetForm();
      router.refresh(); // Refresh to show new item
    } catch (error) {
      console.error("Add item error:", error);
      toast.error("Failed to add item");
    }
  };

  const handleAddCustomItem = async () => {
    if (!customName.trim()) {
      toast.error("Please enter a name for your item");
      return;
    }
    try {
      const newIngredient = await createCustomIngredient({
        name: customName.trim(),
        description: customDescription.trim(),
        category: customCategory,
        emoji: customEmoji,
      });

      await addToInventory({
        ingredientId: newIngredient.id,
        quantity,
        unit: unit || "piece",
        storageLocation: storage,
      });

      toast.success(`Added ${customName} to inventory`);
      setIsCustomOpen(false);
      setCustomName("");
      setCustomDescription("");
      setCustomCategory("PANTRY");
      setCustomEmoji("🍽️");
      resetForm();
      router.refresh();
    } catch (error) {
      console.error("Add custom item error:", error);
      toast.error("Failed to add custom item");
    }
  };

  const handleEditItem = async () => {
    if (!editingItem) return;
    try {
      await updateInventoryItem(editingItem.id, {
        quantity,
        unit,
        storageLocation: storage,
      });
      toast.success(`Updated ${editingItem.ingredient.name}`);
      setEditingItem(null);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error("Edit item error:", error);
      toast.error("Failed to update item");
    }
  };

  const handleUpdateQuantity = async (item: InventoryWithIngredient, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      await removeFromInventory(item.id);
      toast.success(`Removed ${item.ingredient.name}`);
    } else {
      await updateInventoryItem(item.id, { quantity: newQty });
    }
    router.refresh();
  };

  const handleRemove = async (item: InventoryWithIngredient) => {
    await removeFromInventory(item.id);
    toast.success(`Removed ${item.ingredient.name}`);
    router.refresh();
  };

  const openEditDialog = (item: InventoryWithIngredient) => {
    setEditingItem(item);
    setQuantity(item.quantity);
    setUnit(item.unit);
    setStorage(item.storageLocation);
  };

  const resetForm = () => {
    setSelectedIngredient(null);
    setQuantity(1);
    setUnit("");
    setSearch("");
  };

  const expiringItems = inventory.filter((i) => i.status === "EXPIRING" || i.status === "USE_SOON");

  return (
    <div className="space-y-6">
      {/* Expiring Soon Alert */}
      {expiringItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-orange-700 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">Expiring Soon</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {expiringItems.map((item) => (
                <Badge key={item.id} variant="warning">
                  {item.ingredient.emoji} {item.ingredient.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations Section */}
      {!recommendations.isWellStocked && recommendations.recommendations.length > 0 && (
        <Card className="mb-6 border-purple-200 bg-gradient-to-r from-purple-50 to-white">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-purple-700 mb-3">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Suggested Items to Add</span>
            </div>
            <p className="text-sm text-purple-600 mb-3">{recommendations.message}</p>
            <div className="flex flex-wrap gap-2">
              {recommendations.recommendations.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    setSearch(item.name);
                    setIsAddOpen(true);
                  }}
                  className="group flex items-center gap-2 px-3 py-2 bg-white border border-purple-200 rounded-lg hover:border-purple-400 hover:shadow-sm transition-all"
                >
                  <span className="text-lg">{item.emoji}</span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.reason}</p>
                  </div>
                  <Plus className="w-4 h-4 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recommendations.isWellStocked && (
        <Card className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-white">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-700">
              <span className="text-xl">🎉</span>
              <span className="font-medium">{recommendations.message}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Item Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogTrigger asChild>
          <Button className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" />Add Item</Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add to Inventory</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search ingredients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            {search && (
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    {searchResults.map((ing, index) => (
                      <button
                        key={ing.id || `usda-${ing.fdcId}-${index}`}
                        onClick={() => {
                          setSelectedIngredient(ing);
                          setUnit(ing.commonUnits[0] || "piece");
                          setSearch("");
                          setSearchResults([]);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-b last:border-b-0"
                      >
                        <span className="text-lg">{ing.emoji}</span>
                        <span className="flex-1">{ing.name}</span>
                        <div className="flex items-center gap-1">
                          {ing.source === 'usda' ? (
                            <span title="From USDA Database"><Globe className="w-3 h-3 text-blue-500" /></span>
                          ) : (
                            <span title="Local Database"><Database className="w-3 h-3 text-green-500" /></span>
                          )}
                          <Badge variant="outline" className="text-xs">{ing.category}</Badge>
                        </div>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="py-6 text-center text-gray-500">
                    <p>No ingredients found for &quot;{search}&quot;</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        setCustomName(search);
                        setIsAddOpen(false);
                        setIsCustomOpen(true);
                        setSearch("");
                      }}
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add &quot;{search}&quot; as custom item
                    </Button>
                  </div>
                )}
              </div>
            )}
            {selectedIngredient && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                  <span className="text-2xl">{selectedIngredient.emoji}</span>
                  <span className="font-medium">{selectedIngredient.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Quantity</Label><Input type="number" min="0.5" step="0.5" value={quantity} onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)} /></div>
                  <div><Label>Unit</Label>
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{selectedIngredient.commonUnits.map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Storage</Label>
                  <Select value={storage} onValueChange={(v) => setStorage(v as "FRIDGE" | "FREEZER" | "PANTRY")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FRIDGE">🧊 Fridge</SelectItem>
                      <SelectItem value="FREEZER">❄️ Freezer</SelectItem>
                      <SelectItem value="PANTRY">🫙 Pantry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleAddItem}>Add to Inventory</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Item Dialog */}
      <Dialog open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Custom Item</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Item Name *</Label>
              <Input
                placeholder="e.g., Grandma's Special Sauce"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Describe the item so we can suggest it for future recipes..."
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={customCategory} onValueChange={(v) => setCustomCategory(v as IngredientCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Emoji</Label>
                <Input value={customEmoji} onChange={(e) => setCustomEmoji(e.target.value)} className="text-center text-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Quantity</Label><Input type="number" min="0.5" step="0.5" value={quantity} onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)} /></div>
              <div><Label>Unit</Label><Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="piece, lb, oz..." /></div>
            </div>
            <div>
              <Label>Storage</Label>
              <Select value={storage} onValueChange={(v) => setStorage(v as "FRIDGE" | "FREEZER" | "PANTRY")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FRIDGE">🧊 Fridge</SelectItem>
                  <SelectItem value="FREEZER">❄️ Freezer</SelectItem>
                  <SelectItem value="PANTRY">🫙 Pantry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleAddCustomItem} disabled={!customName.trim()}>
              Add Custom Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Item</DialogTitle></DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <span className="text-2xl">{editingItem.ingredient.emoji}</span>
                <span className="font-medium">{editingItem.ingredient.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Quantity</Label><Input type="number" min="0.5" step="0.5" value={quantity} onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)} /></div>
                <div><Label>Unit</Label><Input value={unit} onChange={(e) => setUnit(e.target.value)} /></div>
              </div>
              <div>
                <Label>Storage</Label>
                <Select value={storage} onValueChange={(v) => setStorage(v as "FRIDGE" | "FREEZER" | "PANTRY")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FRIDGE">🧊 Fridge</SelectItem>
                    <SelectItem value="FREEZER">❄️ Freezer</SelectItem>
                    <SelectItem value="PANTRY">🫙 Pantry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleEditItem}>Save Changes</Button>
                <Button variant="destructive" onClick={() => { handleRemove(editingItem); setEditingItem(null); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Category Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map((cat) => (<TabsTrigger key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</TabsTrigger>))}
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <InventoryGrid items={inventory} onUpdateQuantity={handleUpdateQuantity} onRemove={handleRemove} onEdit={openEditDialog} />
        </TabsContent>
        {categories.map((cat) => (
          <TabsContent key={cat.value} value={cat.value} className="mt-4">
            <InventoryGrid items={inventory.filter((i) => i.ingredient.category === cat.value)} onUpdateQuantity={handleUpdateQuantity} onRemove={handleRemove} onEdit={openEditDialog} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function InventoryGrid({ items, onUpdateQuantity, onRemove, onEdit }: {
  items: InventoryWithIngredient[];
  onUpdateQuantity: (item: InventoryWithIngredient, delta: number) => void;
  onRemove: (item: InventoryWithIngredient) => void;
  onEdit: (item: InventoryWithIngredient) => void;
}) {
  if (items.length === 0) return <div className="text-center py-12 text-gray-500">No items in this category</div>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => onEdit(item)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{item.ingredient.emoji}</span>
                    <div>
                      <h3 className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                        {item.ingredient.name}
                        <Edit3 className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-sm text-gray-500">{item.quantity} {item.unit}</p>
                    </div>
                  </div>
                  <Badge className={statusColors[item.status]}>{item.status.replace("_", " ")}</Badge>
                </div>
                <div className="flex items-center justify-between mt-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" onClick={() => onUpdateQuantity(item, -1)}><Minus className="w-4 h-4" /></Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button size="icon" variant="outline" onClick={() => onUpdateQuantity(item, 1)}><Plus className="w-4 h-4" /></Button>
                  </div>
                  <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onRemove(item)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

