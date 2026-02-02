import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Note,
  CreateNoteInput,
  UpdateNoteInput,
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote
} from '../db/queries';

export function useNotes(searchQuery?: string) {
  const db = useSQLiteContext();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotes(db, searchQuery);
      setNotes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notes'));
    } finally {
      setLoading(false);
    }
  }, [db, searchQuery]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = useCallback(async (input: CreateNoteInput) => {
    const id = await createNote(db, input);
    await fetchNotes();
    return id;
  }, [db, fetchNotes]);

  const editNote = useCallback(async (id: number, input: UpdateNoteInput) => {
    await updateNote(db, id, input);
    await fetchNotes();
  }, [db, fetchNotes]);

  const removeNote = useCallback(async (id: number) => {
    await deleteNote(db, id);
    await fetchNotes();
  }, [db, fetchNotes]);

  return {
    notes,
    loading,
    error,
    refresh: fetchNotes,
    addNote,
    editNote,
    removeNote,
  };
}

export function useNote(id: number | null) {
  const db = useSQLiteContext();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNote = useCallback(async () => {
    if (id === null) {
      setNote(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getNoteById(db, id);
      setNote(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch note'));
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  const update = useCallback(async (input: UpdateNoteInput) => {
    if (id === null) return;
    await updateNote(db, id, input);
    await fetchNote();
  }, [db, id, fetchNote]);

  const remove = useCallback(async () => {
    if (id === null) return;
    await deleteNote(db, id);
  }, [db, id]);

  return {
    note,
    loading,
    error,
    refresh: fetchNote,
    update,
    remove,
  };
}
