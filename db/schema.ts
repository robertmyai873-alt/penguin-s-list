import { SQLiteDatabase } from 'expo-sqlite';
import { seedNotes } from './seed-notes';

const CURRENT_DB_VERSION = 2;

export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  // Get current version
  const versionResult = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = versionResult?.user_version ?? 0;

  // Check if notes table already exists (for databases created before versioning)
  const tableExists = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='notes'"
  );

  // Fresh install - no existing table
  if (!tableExists) {
    await db.execAsync(`
      CREATE TABLE notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        date TEXT,
        image_uri TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(date DESC);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_notes_content ON notes(content);
    `);

    // Seed with pre-existing notes (unknown dates)
    await seedInitialNotes(db);

    await db.execAsync(`PRAGMA user_version = ${CURRENT_DB_VERSION}`);
    return;
  }

  // Table exists but needs migration (version < 2)
  if (currentVersion < 2) {
    // SQLite doesn't support ALTER COLUMN, so we need to recreate the table
    // to allow NULL dates
    await db.execAsync(`
      CREATE TABLE notes_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        date TEXT,
        image_uri TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execAsync(`
      INSERT INTO notes_new (id, content, date, image_uri, created_at, updated_at)
      SELECT id, content, date, image_uri, created_at, updated_at FROM notes;
    `);

    await db.execAsync(`DROP TABLE notes;`);
    await db.execAsync(`ALTER TABLE notes_new RENAME TO notes;`);

    // Recreate indexes
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(date DESC);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_notes_content ON notes(content);
    `);

    // Seed with pre-existing notes (unknown dates)
    await seedInitialNotes(db);

    await db.execAsync(`PRAGMA user_version = ${CURRENT_DB_VERSION}`);
  }
}

// Seed the database with pre-existing gratitude notes (with unknown dates)
async function seedInitialNotes(db: SQLiteDatabase): Promise<void> {
  // Check if we already have seeded notes (avoid duplicate seeding)
  const countResult = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM notes WHERE date IS NULL'
  );

  if (countResult && countResult.count > 0) {
    return; // Already seeded
  }

  // Insert all seed notes with NULL date
  for (const content of seedNotes) {
    await db.runAsync(
      'INSERT INTO notes (content, date) VALUES (?, NULL)',
      [content]
    );
  }
}
