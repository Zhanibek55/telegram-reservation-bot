import { db } from './db';
import { tables, clubSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function seed() {
  console.log('Seeding database...');

  // Check if we already have club settings
  const existingSettings = await db.select().from(clubSettings);
  if (existingSettings.length === 0) {
    console.log('Creating default club settings...');
    await db.insert(clubSettings).values({
      id: 1,
      opening_time: "15:00",
      closing_time: "00:00",
      slot_duration: 2,
      club_name: "Бильярдный клуб"
    });
  }

  // Check if we already have tables
  const existingTables = await db.select().from(tables);
  if (existingTables.length === 0) {
    console.log('Creating billiard tables...');
    // Create all 9 tables
    for (let i = 1; i <= 9; i++) {
      await db.insert(tables).values({
        number: i,
        status: "available"
      });
    }
  }

  console.log('Seeding completed!');
}

// For ES modules, we can't check if this is the main module the same way
// The seed function will be imported and called from index.ts