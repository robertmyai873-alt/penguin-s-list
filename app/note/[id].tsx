import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeIn, Easing } from 'react-native-reanimated';
import { Note, getNoteById, deleteNote, getNotes, updateNote } from '../../db/queries';
import { DatePickerModal } from '../../components/DatePickerModal';
import theme from '../../constants/theme';

const DURATION_SWIFT = 200;
const EASE_GENTLE = Easing.bezier(0.4, 0, 0.2, 1);

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// Format as YY.MM.DD (returns null indicator for unknown dates)
function formatDateCompact(dateString: string | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  return `${yy}.${mm}.${dd}`;
}

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const editInputRef = useRef<TextInput>(null);

  const [note, setNote] = useState<Note | null>(null);
  const [noteIndex, setNoteIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getToday());

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  // Copy feedback state
  const [justCopied, setJustCopied] = useState(false);

  useEffect(() => {
    loadNote();
  }, [id]);

  const loadNote = async () => {
    if (!id) return;
    setLoading(true);

    const data = await getNoteById(db, parseInt(id));
    setNote(data);

    // Set selected date to existing date or today for picker
    if (data?.date) {
      setSelectedDate(data.date);
    } else {
      setSelectedDate(getToday());
    }

    // Get the index of this note in the full sorted list
    const allNotes = await getNotes(db);
    const index = allNotes.findIndex(n => n.id === parseInt(id));
    // Notes are sorted by sort_order ASC, so index 0 is the top note
    // Display number = total - index (top note = highest number)
    setNoteIndex(allNotes.length - index);

    setLoading(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove this note?',
      '',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!note) return;
            await deleteNote(db, note.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleDateSelect = async (date: string) => {
    if (!note) return;
    setSelectedDate(date);
    await updateNote(db, note.id, { date });
    setNote({ ...note, date });
  };

  const handleClearDate = () => {
    if (!note) return;
    Alert.alert(
      'Remove date?',
      'This will set the date back to unknown.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          onPress: async () => {
            await updateNote(db, note.id, { date: null });
            setNote({ ...note, date: null });
          },
        },
      ]
    );
  };

  const handleEditStart = () => {
    if (!note) return;
    setEditText(note.content);
    setIsEditing(true);
    setTimeout(() => {
      editInputRef.current?.focus();
    }, 100);
  };

  const handleEditSave = async () => {
    if (!note || !editText.trim()) return;
    await updateNote(db, note.id, { content: editText.trim() });
    setNote({ ...note, content: editText.trim() });
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditText('');
  };

  const handleCopy = async () => {
    if (!note) return;
    await Clipboard.setStringAsync(note.content);
    setJustCopied(true);
    setTimeout(() => {
      setJustCopied(false);
    }, 1500);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-washi items-center justify-center">
        <View className="w-8 h-px bg-washi-warm" />
      </View>
    );
  }

  if (!note) {
    return (
      <View
        className="flex-1 bg-washi items-center justify-center px-8"
        style={{ paddingTop: insets.top }}
      >
        <Text className="font-nunito text-sumi-light text-center mb-4">
          Note not found
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text className="font-nunito text-moegi">go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-washi" style={{ paddingTop: insets.top }}>
      {/* Header - back, copy, edit, delete */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable
          onPress={() => router.back()}
          className="p-2 -ml-2"
          hitSlop={16}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.sumi} />
        </Pressable>

        <View className="flex-row items-center gap-4">
          {/* Copy button */}
          <Pressable
            onPress={handleCopy}
            className="p-2"
            hitSlop={16}
          >
            <Ionicons
              name={justCopied ? 'checkmark' : 'copy-outline'}
              size={18}
              color={justCopied ? theme.colors.moegi : theme.colors.sumiLight}
            />
          </Pressable>

          {/* Edit button */}
          <Pressable
            onPress={handleEditStart}
            className="p-2"
            hitSlop={16}
          >
            <Ionicons name="pencil-outline" size={18} color={theme.colors.sumiLight} />
          </Pressable>

          {/* Delete button */}
          <Pressable
            onPress={handleDelete}
            className="p-2 -mr-2"
            hitSlop={16}
          >
            <Ionicons name="close" size={20} color={theme.colors.sumiLight} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 32,
          paddingBottom: insets.bottom + 48,
        }}
      >
        {/* Large number as visual anchor */}
        <Text className="font-nunito text-moegi text-4xl mb-6">
          {noteIndex}
        </Text>

        {/* The gratitude content - editable or display */}
        {isEditing ? (
          <Animated.View entering={FadeIn.duration(DURATION_SWIFT).easing(EASE_GENTLE)}>
            <TextInput
              ref={editInputRef}
              className="font-nunito text-sumi text-xl leading-9 mb-4 min-h-[120px]"
              value={editText}
              onChangeText={setEditText}
              multiline
              textAlignVertical="top"
            />
            <View className="flex-row items-center gap-8 mb-8">
              <Pressable onPress={handleEditCancel} className="py-3 px-2">
                <Text className="font-nunito text-sumi-light text-base">cancel</Text>
              </Pressable>
              <Pressable onPress={handleEditSave} className="py-3 px-2">
                <Text className="font-nunito-semibold text-moegi text-base">save</Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : (
          <Text className="font-nunito text-sumi text-xl leading-9 mb-8">
            {note.content}
          </Text>
        )}

        {/* Date at the bottom - tappable to add/change date */}
        <Pressable
          onPress={() => setShowDatePicker(true)}
          onLongPress={note.date ? handleClearDate : undefined}
          className="flex-row items-center active:opacity-60"
        >
          <Ionicons
            name={note.date ? 'calendar' : 'calendar-outline'}
            size={14}
            color={note.date ? theme.colors.sumiLight : theme.colors.moegi}
          />
          <Text
            className={`font-nunito text-sm ml-1.5 ${
              note.date ? 'text-sumi-light' : 'text-moegi'
            }`}
          >
            {note.date ? formatDateCompact(note.date) : 'add date'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        onClose={() => setShowDatePicker(false)}
      />
    </View>
  );
}
