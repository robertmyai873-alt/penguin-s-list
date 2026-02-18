import { SQLiteDatabase } from 'expo-sqlite';

export interface Note {
  id: number;
  content: string;
  date: string | null; // null = unknown date
  image_uri: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteInput {
  content: string;
  date?: string | null; // optional - null for unknown date
  image_uri?: string | null;
}

export interface UpdateNoteInput {
  content?: string;
  date?: string | null;
  image_uri?: string | null;
}

export interface DateRange {
  from: string;
  to: string;
}

// Get all notes, optionally filtered by search query or date range
// Notes with NULL dates are sorted to the end
export async function getNotes(
  db: SQLiteDatabase,
  searchQuery?: string,
  dateRange?: DateRange,
  includeUnknownDates: boolean = true
): Promise<Note[]> {
  // Filter by date range (excludes unknown dates)
  if (dateRange) {
    return await db.getAllAsync<Note>(
      'SELECT * FROM notes WHERE date >= ? AND date <= ? ORDER BY date DESC, created_at DESC',
      [dateRange.from, dateRange.to]
    );
  }

  // Filter by text search
  if (searchQuery && searchQuery.trim()) {
    const query = `%${searchQuery.trim()}%`;
    return await db.getAllAsync<Note>(
      `SELECT * FROM notes WHERE content LIKE ?
       ORDER BY CASE WHEN date IS NULL THEN 1 ELSE 0 END, date DESC, created_at DESC`,
      [query]
    );
  }

  // Get all notes - dated notes first (sorted by date), then unknown dates
  if (!includeUnknownDates) {
    return await db.getAllAsync<Note>(
      'SELECT * FROM notes WHERE date IS NOT NULL ORDER BY date DESC, created_at DESC'
    );
  }

  return await db.getAllAsync<Note>(
    `SELECT * FROM notes ORDER BY sort_order ASC`
  );
}

// Get all unique dates that have notes (for date picker)
export async function getNoteDates(db: SQLiteDatabase): Promise<string[]> {
  const results = await db.getAllAsync<{ date: string }>(
    'SELECT DISTINCT date FROM notes ORDER BY date DESC'
  );
  return results.map(r => r.date);
}

// Get a single note by ID
export async function getNoteById(
  db: SQLiteDatabase,
  id: number
): Promise<Note | null> {
  return await db.getFirstAsync<Note>(
    'SELECT * FROM notes WHERE id = ?',
    [id]
  );
}

// Create a new note (inserts at top with sort_order = 0, bumps existing)
export async function createNote(
  db: SQLiteDatabase,
  input: CreateNoteInput
): Promise<number> {
  // Bump all existing notes' sort_order by 1
  await db.runAsync('UPDATE notes SET sort_order = sort_order + 1');

  const result = await db.runAsync(
    'INSERT INTO notes (content, date, image_uri, sort_order) VALUES (?, ?, ?, 0)',
    [input.content, input.date ?? null, input.image_uri ?? null]
  );

  return result.lastInsertRowId;
}

// Update an existing note
export async function updateNote(
  db: SQLiteDatabase,
  id: number,
  input: UpdateNoteInput
): Promise<void> {
  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (input.content !== undefined) {
    updates.push('content = ?');
    values.push(input.content);
  }

  if (input.date !== undefined) {
    updates.push('date = ?');
    values.push(input.date);
  }

  if (input.image_uri !== undefined) {
    updates.push('image_uri = ?');
    values.push(input.image_uri);
  }

  if (updates.length === 0) return;

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id.toString());

  await db.runAsync(
    `UPDATE notes SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
}

// Delete a note
export async function deleteNote(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
}

// Update sort_order for all notes based on their position in the array
export async function updateNoteOrder(
  db: SQLiteDatabase,
  orderedIds: number[]
): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    await db.runAsync(
      'UPDATE notes SET sort_order = ? WHERE id = ?',
      [i, orderedIds[i]]
    );
  }
}

// Get a random note (for notifications)
export async function getRandomNote(db: SQLiteDatabase): Promise<Note | null> {
  return await db.getFirstAsync<Note>(
    'SELECT * FROM notes ORDER BY RANDOM() LIMIT 1'
  );
}
