import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { allIngredients } from './data/ingredients';

// Load environment variables
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🦉 Starting Hungry Owl database seed...');
  console.log(`📦 Seeding ${allIngredients.length} ingredients...`);

  // Clear existing ingredients
  await prisma.ingredient.deleteMany();
  console.log('Cleared existing ingredients');

  // Create ingredients in batches for performance
  const batchSize = 50;
  for (let i = 0; i < allIngredients.length; i += batchSize) {
    const batch = allIngredients.slice(i, i + batchSize);
    await prisma.ingredient.createMany({
      data: batch.map((ing) => ({
        name: ing.name,
        aliases: ing.aliases || [],
        category: ing.category,
        commonUnits: ing.commonUnits,
        shelfLife: ing.shelfLife,
        emoji: ing.emoji,
        substitutes: JSON.stringify(ing.substitutes || []),
      })),
    });
    console.log(`  Created ingredients ${i + 1} - ${Math.min(i + batchSize, allIngredients.length)}`);
  }

  console.log(`✅ Created ${allIngredients.length} ingredients`);
  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });