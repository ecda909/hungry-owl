import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { searchUSDAFoods, normalizeUSDAFood, NormalizedIngredient } from '@/lib/services/usda';

export interface SearchResult {
  id?: string;
  name: string;
  category: string;
  commonUnits: string[];
  emoji: string;
  source: 'local' | 'usda';
  fdcId?: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // First, search local database
    const localResults = await prisma.ingredient.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { aliases: { has: query.toLowerCase() } },
          { aliases: { hasSome: [query, query.toLowerCase(), query.toUpperCase()] } },
        ],
      },
      take: 15,
      orderBy: {
        name: 'asc',
      },
    });

    // Transform local results
    const localSearchResults: SearchResult[] = localResults.map((ing) => ({
      id: ing.id,
      name: ing.name,
      category: ing.category,
      commonUnits: ing.commonUnits,
      emoji: ing.emoji || "🍽️",
      source: 'local' as const,
    }));

    // If we have enough local results, return them
    if (localSearchResults.length >= 10) {
      return NextResponse.json({ 
        results: localSearchResults.slice(0, 15),
        hasMore: false 
      });
    }

    // Otherwise, also search USDA for more options
    let usdaResults: NormalizedIngredient[] = [];
    try {
      const usdaResponse = await searchUSDAFoods(query, 20);
      usdaResults = usdaResponse.foods
        .map(normalizeUSDAFood)
        // Filter out duplicates that are already in local results
        .filter(usdaFood => 
          !localSearchResults.some(local => 
            local.name.toLowerCase() === usdaFood.name.toLowerCase()
          )
        );
    } catch (usdaError) {
      console.error('USDA API error (continuing with local results):', usdaError);
    }

    // Transform USDA results
    const usdaSearchResults: SearchResult[] = usdaResults.map((ing) => ({
      name: ing.name,
      category: ing.category,
      commonUnits: ing.commonUnits,
      emoji: ing.emoji,
      source: 'usda' as const,
      fdcId: ing.fdcId,
    }));

    // Combine results, prioritizing local
    const allResults = [...localSearchResults, ...usdaSearchResults].slice(0, 20);

    return NextResponse.json({ 
      results: allResults,
      localCount: localSearchResults.length,
      usdaCount: usdaSearchResults.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search ingredients' },
      { status: 500 }
    );
  }
}

