/**
 * USDA FoodData Central API Service
 * 
 * Provides access to the USDA food database for ingredient search
 * API Documentation: https://fdc.nal.usda.gov/api-guide.html
 */

const USDA_API_KEY = process.env.USDA_API_KEY;
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// Map USDA food categories to our app categories
const USDA_CATEGORY_MAP: Record<string, string> = {
  'Vegetables and Vegetable Products': 'PRODUCE',
  'Fruits and Fruit Juices': 'PRODUCE',
  'Spices and Herbs': 'SPICES',
  'Beef Products': 'PROTEIN',
  'Pork Products': 'PROTEIN',
  'Poultry Products': 'PROTEIN',
  'Lamb, Veal, and Game Products': 'PROTEIN',
  'Finfish and Shellfish Products': 'PROTEIN',
  'Legumes and Legume Products': 'PANTRY',
  'Nut and Seed Products': 'PANTRY',
  'Dairy and Egg Products': 'DAIRY',
  'Fats and Oils': 'PANTRY',
  'Cereal Grains and Pasta': 'GRAINS',
  'Baked Products': 'GRAINS',
  'Breakfast Cereals': 'GRAINS',
  'Beverages': 'BEVERAGES',
  'Sweets': 'PANTRY',
  'Soups, Sauces, and Gravies': 'PANTRY',
  'Snacks': 'PANTRY',
};

// Common unit mapping for USDA foods
const DEFAULT_UNITS = ['piece', 'oz', 'cup', 'lb'];

export interface USDAFood {
  fdcId: number;
  description: string;
  dataType: string;
  foodCategory?: string;
  brandOwner?: string;
  ingredients?: string;
  servingSize?: number;
  servingSizeUnit?: string;
}

export interface USDASearchResult {
  foods: USDAFood[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}

export interface NormalizedIngredient {
  name: string;
  category: string;
  commonUnits: string[];
  emoji: string;
  source: 'usda';
  fdcId: number;
}

/**
 * Search for foods in the USDA database
 */
export async function searchUSDAFoods(
  query: string,
  pageSize: number = 25,
  pageNumber: number = 1,
  dataType: string[] = ['Foundation', 'SR Legacy']
): Promise<USDASearchResult> {
  if (!USDA_API_KEY) {
    throw new Error('USDA_API_KEY is not configured');
  }

  const response = await fetch(`${USDA_BASE_URL}/foods/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': USDA_API_KEY,
    },
    body: JSON.stringify({
      query,
      pageSize,
      pageNumber,
      dataType,
      sortBy: 'dataType.keyword',
      sortOrder: 'asc',
    }),
  });

  if (!response.ok) {
    throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get emoji for a food based on its name and category
 */
function getEmojiForFood(name: string, category: string): string {
  const lowerName = name.toLowerCase();
  
  // Produce
  if (lowerName.includes('apple')) return '🍎';
  if (lowerName.includes('banana')) return '🍌';
  if (lowerName.includes('orange') || lowerName.includes('citrus')) return '🍊';
  if (lowerName.includes('lemon')) return '🍋';
  if (lowerName.includes('grape')) return '🍇';
  if (lowerName.includes('strawberr')) return '🍓';
  if (lowerName.includes('blueberr') || lowerName.includes('berr')) return '🫐';
  if (lowerName.includes('cherry')) return '🍒';
  if (lowerName.includes('peach')) return '🍑';
  if (lowerName.includes('pear')) return '🍐';
  if (lowerName.includes('pineapple')) return '🍍';
  if (lowerName.includes('watermelon') || lowerName.includes('melon')) return '🍉';
  if (lowerName.includes('mango')) return '🥭';
  if (lowerName.includes('avocado')) return '🥑';
  if (lowerName.includes('tomato')) return '🍅';
  if (lowerName.includes('broccoli')) return '🥦';
  if (lowerName.includes('carrot')) return '🥕';
  if (lowerName.includes('corn')) return '🌽';
  if (lowerName.includes('pepper') || lowerName.includes('chili')) return '🌶️';
  if (lowerName.includes('cucumber')) return '🥒';
  if (lowerName.includes('lettuce') || lowerName.includes('salad') || lowerName.includes('green')) return '🥬';
  if (lowerName.includes('potato')) return '🥔';
  if (lowerName.includes('onion')) return '🧅';
  if (lowerName.includes('garlic')) return '🧄';
  if (lowerName.includes('mushroom')) return '🍄';
  if (lowerName.includes('coconut')) return '🥥';
  if (lowerName.includes('ginger')) return '🫚';
  
  // Proteins
  if (lowerName.includes('chicken')) return '🍗';
  if (lowerName.includes('beef') || lowerName.includes('steak')) return '🥩';
  if (lowerName.includes('pork') || lowerName.includes('bacon')) return '🥓';
  if (lowerName.includes('fish') || lowerName.includes('salmon') || lowerName.includes('tuna')) return '🐟';
  if (lowerName.includes('shrimp') || lowerName.includes('prawn')) return '🦐';
  if (lowerName.includes('crab')) return '🦀';
  if (lowerName.includes('lobster')) return '🦞';
  if (lowerName.includes('egg')) return '🥚';
  
  // Dairy
  if (lowerName.includes('milk')) return '🥛';
  if (lowerName.includes('cheese')) return '🧀';
  if (lowerName.includes('butter')) return '🧈';
  if (lowerName.includes('yogurt')) return '🥛';
  
  // Grains
  if (lowerName.includes('bread')) return '🍞';
  if (lowerName.includes('rice')) return '🍚';
  if (lowerName.includes('pasta') || lowerName.includes('spaghetti') || lowerName.includes('noodle')) return '🍝';
  
  // Other
  if (lowerName.includes('coffee')) return '☕';
  if (lowerName.includes('tea')) return '🍵';
  if (lowerName.includes('honey')) return '🍯';
  if (lowerName.includes('chocolate')) return '🍫';
  if (lowerName.includes('salt')) return '🧂';
  
  // Category-based fallbacks
  if (category === 'PRODUCE') return '🥬';
  if (category === 'PROTEIN') return '🍖';
  if (category === 'DAIRY') return '🥛';
  if (category === 'GRAINS') return '🌾';
  if (category === 'SPICES') return '🌿';
  if (category === 'PANTRY') return '🥫';
  if (category === 'BEVERAGES') return '🥤';
  if (category === 'FROZEN') return '❄️';
  
  return '🍽️';
}

/**
 * Clean up USDA food description for display
 */
function cleanFoodName(description: string): string {
  // Remove common USDA suffixes and prefixes
  let name = description
    .replace(/,\s*raw$/i, '')
    .replace(/,\s*cooked$/i, '')
    .replace(/,\s*fresh$/i, '')
    .replace(/,\s*frozen$/i, '')
    .replace(/,\s*canned$/i, '')
    .replace(/,\s*dried$/i, '')
    .replace(/,\s*NFS$/i, '') // Not Further Specified
    .replace(/,\s*NS.*$/i, '') // Not Specified variants
    .trim();

  // Capitalize first letter of each word
  name = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return name;
}

/**
 * Normalize USDA food to our ingredient format
 */
export function normalizeUSDAFood(food: USDAFood): NormalizedIngredient {
  const category = food.foodCategory
    ? (USDA_CATEGORY_MAP[food.foodCategory] || 'PANTRY')
    : 'PANTRY';

  const name = cleanFoodName(food.description);

  return {
    name,
    category,
    commonUnits: DEFAULT_UNITS,
    emoji: getEmojiForFood(name, category),
    source: 'usda',
    fdcId: food.fdcId,
  };
}

/**
 * Search for ingredients - combines local DB search with USDA API
 * This is meant to be called from a server action
 */
export async function searchIngredients(query: string): Promise<NormalizedIngredient[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const results = await searchUSDAFoods(query, 15);

    return results.foods
      .map(normalizeUSDAFood)
      // Remove duplicates by name
      .filter((food, index, self) =>
        index === self.findIndex(f => f.name.toLowerCase() === food.name.toLowerCase())
      )
      .slice(0, 10);
  } catch (error) {
    console.error('Error searching USDA foods:', error);
    return [];
  }
}

