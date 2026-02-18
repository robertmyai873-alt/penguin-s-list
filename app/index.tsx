import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ListRenderItemInfo,
} from 'react-native';
import { useFocusEffect, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  Easing,
} from 'react-native-reanimated';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { Note, getNotes, createNote, updateNoteOrder, DateRange } from '../db/queries';
import { DatePickerModal } from '../components/DatePickerModal';
import { DateRangePickerModal } from '../components/DateRangePickerModal';
import theme from '../constants/theme';

// Japanese-inspired animation timings (from Iki philosophy)
const DURATION_INSTANT = 100;  // Micro-interactions
const DURATION_SWIFT = 200;    // Quick feedback
const DURATION_NATURAL = 300;  // Standard transitions

// Gentle easing for natural movement
const EASE_GENTLE = Easing.bezier(0.4, 0, 0.2, 1);

// Animated Pressable with Kizen (気前) - "moment before" feedback
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface KizenButtonProps {
  onPress?: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

function KizenButton({ onPress, onLongPress, children, className, disabled }: KizenButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    // Kizen: the anticipation before action
    scale.value = withTiming(0.97, { duration: DURATION_INSTANT, easing: EASE_GENTLE });
    opacity.value = withTiming(0.85, { duration: DURATION_INSTANT, easing: EASE_GENTLE });
  };

  const handlePressOut = () => {
    // Gentle return, like settling water
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(1, { duration: DURATION_SWIFT, easing: EASE_GENTLE });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={animatedStyle}
      className={className}
    >
      {children}
    </AnimatedPressable>
  );
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// Format as YY.MM.DD for display (returns null indicator for unknown dates)
function formatDateCompact(dateString: string | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  return `${yy}.${mm}.${dd}`;
}

// Format for input area (today/yesterday/date)
function formatDateRelative(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) return 'today';
  if (dateOnly.getTime() === yesterdayOnly.getTime()) return 'yesterday';

  return formatDateCompact(dateString);
}

// Format date range for display
function formatDateRange(range: DateRange): string {
  if (range.from === range.to) {
    return formatDateCompact(range.from);
  }
  return `${formatDateCompact(range.from)} → ${formatDateCompact(range.to)}`;
}

export default function HomeScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const searchInputRef = useRef<TextInput>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Date range filter state
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [showRangePicker, setShowRangePicker] = useState(false);

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Smart animation: track which notes we've already seen
  // This prevents re-triggering FadeIn on existing notes
  const seenNoteIds = useRef<Set<number>>(new Set());

  // Whether drag-reorder is allowed (only when no filters active)
  const isDragEnabled = !dateRange && !debouncedSearch;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchNotes = useCallback(async () => {
    const searchQuery = debouncedSearch.trim() || undefined;
    const data = await getNotes(db, searchQuery, dateRange || undefined);
    setNotes(data);
  }, [db, dateRange, debouncedSearch]);

  useFocusEffect(
    useCallback(() => {
      fetchNotes();
    }, [fetchNotes])
  );

  const handlePlusPress = useCallback(() => {
    setIsAdding(true);
    setSelectedDate(getToday());

    // Focus input after render
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  const handleAdd = useCallback(async () => {
    if (!inputText.trim()) {
      setIsAdding(false);
      return;
    }

    try {
      await createNote(db, {
        content: inputText.trim(),
        date: selectedDate,
      });

      // Clear input state first (before triggering list update)
      setInputText('');
      setSelectedDate(getToday());

      // Small delay to let input area animate out before list updates
      // This prevents animation conflicts between input exit and list shift
      setTimeout(() => {
        setIsAdding(false);
        fetchNotes();
      }, 50);
    } catch (error) {
      console.error('Failed to create note:', error);
      // Still close the input on error, but don't lose the text
      setIsAdding(false);
    }
  }, [inputText, selectedDate, db, fetchNotes]);

  const handleCancel = useCallback(() => {
    setInputText('');
    setIsAdding(false);
  }, []);

  const handleRangeSelect = useCallback((from: string, to: string) => {
    setDateRange({ from, to });
    setShowRangePicker(false);
  }, []);

  const clearFilter = useCallback(() => {
    setDateRange(null);
  }, []);

  const handleSearchOpen = useCallback(() => {
    setIsSearching(true);
    setDateRange(null); // Clear date filter when searching
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, []);

  const handleSearchClose = useCallback(() => {
    setIsSearching(false);
    setSearchText('');
    setDebouncedSearch('');
  }, []);

  const handleDragEnd = useCallback(async ({ data }: { data: Note[] }) => {
    setNotes(data);
    const orderedIds = data.map(n => n.id);
    await updateNoteOrder(db, orderedIds);
  }, [db]);

  // Newest first - new notes appear right below input
  const sortedNotes = notes;

  // Track which notes are new (for FadeIn animation)
  const newNoteIds = useMemo(() => {
    const newIds = new Set<number>();

    sortedNotes.forEach((note) => {
      if (!seenNoteIds.current.has(note.id)) {
        newIds.add(note.id);
        seenNoteIds.current.add(note.id);
      }
    });

    return newIds;
  }, [sortedNotes]);

  // Render individual note item for regular FlatList
  const renderNoteItem = useCallback(({ item: note, index }: ListRenderItemInfo<Note>) => {
    const isNew = newNoteIds.has(note.id);
    const noteNumber = sortedNotes.length - index;

    return (
      <Animated.View
        entering={isNew ? FadeIn.duration(DURATION_NATURAL).easing(EASE_GENTLE) : undefined}
      >
        <Link href={`/note/${note.id}`} asChild>
          <KizenButton className="flex-row items-start mb-8">
            <View className="flex-1 pr-4">
              <Text className="font-nunito text-moegi text-sm mb-2">
                {noteNumber}
              </Text>
              <Text className="font-nunito text-sumi text-base leading-7">
                {note.content}
              </Text>
            </View>
            <View className="flex-row items-center mt-6">
              {!note.date && (
                <Ionicons
                  name="calendar-outline"
                  size={10}
                  color={theme.colors.sumiLight}
                  style={{ marginRight: 2, opacity: 0.5 }}
                />
              )}
              <Text className={`font-nunito text-xs ${note.date ? 'text-sumi-light' : 'text-sumi-light opacity-50'}`}>
                {formatDateCompact(note.date)}
              </Text>
            </View>
          </KizenButton>
        </Link>
      </Animated.View>
    );
  }, [newNoteIds, sortedNotes.length]);

  // Render individual note item for DraggableFlatList
  const renderDraggableItem = useCallback(({ item: note, drag, isActive, getIndex }: RenderItemParams<Note>) => {
    const index = getIndex() ?? 0;
    const noteNumber = sortedNotes.length - index;

    return (
      <ScaleDecorator>
        <Link href={`/note/${note.id}`} asChild>
          <KizenButton
            onLongPress={drag}
            disabled={isActive}
            className={`flex-row items-start mb-8 ${isActive ? 'opacity-90' : ''}`}
          >
            <View className="flex-1 pr-4">
              <Text className="font-nunito text-moegi text-sm mb-2">
                {noteNumber}
              </Text>
              <Text className="font-nunito text-sumi text-base leading-7">
                {note.content}
              </Text>
            </View>
            <View className="flex-row items-center mt-6">
              {!note.date && (
                <Ionicons
                  name="calendar-outline"
                  size={10}
                  color={theme.colors.sumiLight}
                  style={{ marginRight: 2, opacity: 0.5 }}
                />
              )}
              <Text className={`font-nunito text-xs ${note.date ? 'text-sumi-light' : 'text-sumi-light opacity-50'}`}>
                {formatDateCompact(note.date)}
              </Text>
            </View>
          </KizenButton>
        </Link>
      </ScaleDecorator>
    );
  }, [sortedNotes.length]);

  // Header component for FlatList (includes title, input area, etc.)
  const ListHeader = useMemo(() => (
    <>
      {/* Header row - Title and actions */}
      <View className="flex-row items-center justify-between mb-2">
        {isSearching ? (
          <Animated.View
            className="flex-1 flex-row items-center mr-3"
            entering={FadeIn.duration(DURATION_SWIFT).easing(EASE_GENTLE)}
          >
            <Ionicons name="search" size={16} color={theme.colors.sumiLight} />
            <TextInput
              ref={searchInputRef}
              className="flex-1 font-nunito text-sumi text-base ml-2 py-1"
              placeholder="search..."
              placeholderTextColor={theme.colors.sumiLight}
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            <Pressable
              onPress={handleSearchClose}
              className="p-1 active:opacity-60"
            >
              <Ionicons name="close" size={18} color={theme.colors.sumiLight} />
            </Pressable>
          </Animated.View>
        ) : (
          <>
            <Text className="font-nunito text-sumi text-base leading-6">
              a list I made with reasons{'\n'}that are worth staying alive
            </Text>

            <View className="flex-row items-center gap-3">
              {/* Search button */}
              <Pressable
                onPress={handleSearchOpen}
                className="p-1 active:opacity-60"
              >
                <Ionicons name="search-outline" size={18} color={theme.colors.sumiLight} />
              </Pressable>

              {/* Date range filter button */}
              {dateRange ? (
                <Pressable
                  onPress={clearFilter}
                  className="flex-row items-center active:opacity-60"
                >
                  <Text className="font-nunito text-moegi text-xs mr-1">
                    {formatDateRange(dateRange)}
                  </Text>
                  <Ionicons name="close" size={14} color={theme.colors.moegi} />
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => setShowRangePicker(true)}
                  className="p-1 active:opacity-60"
                >
                  <Ionicons name="calendar-outline" size={18} color={theme.colors.sumiLight} />
                </Pressable>
              )}

              {/* Settings button */}
              <Link href="/settings" asChild>
                <Pressable className="p-1 active:opacity-60">
                  <Ionicons name="settings-outline" size={18} color={theme.colors.sumiLight} />
                </Pressable>
              </Link>
            </View>
          </>
        )}
      </View>

      {/* Subtle divider */}
      <View className="h-px bg-moegi/30 mb-6" />

      {/* Add New Note Area - at top */}
      {isAdding ? (
        <Animated.View
          className="pt-4 pb-6 mb-8"
          entering={FadeIn.duration(DURATION_SWIFT).easing(EASE_GENTLE)}
        >
          <TextInput
            ref={inputRef}
            className="font-nunito text-sumi text-xl leading-8 min-h-[80px] mb-6"
            placeholder="I'm grateful for..."
            placeholderTextColor={theme.colors.sumiLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            textAlignVertical="top"
          />

          <View className="flex-row items-center justify-between">
            <KizenButton
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center py-3"
            >
              <Ionicons name="calendar-outline" size={16} color={theme.colors.sumiLight} />
              <Text className="font-nunito text-sumi-light text-sm ml-3">
                {formatDateRelative(selectedDate)}
              </Text>
            </KizenButton>

            <View className="flex-row items-center gap-8">
              <KizenButton onPress={handleCancel} className="py-3 px-2">
                <Text className="font-nunito text-sumi-light text-base">cancel</Text>
              </KizenButton>
              <KizenButton onPress={handleAdd} className="py-3 px-2">
                <Text className="font-nunito-semibold text-moegi text-base">add</Text>
              </KizenButton>
            </View>
          </View>
        </Animated.View>
      ) : (
        <KizenButton
          onPress={handlePlusPress}
          className="py-16 mb-8"
        >
          <Text className="font-nunito text-sumi-light text-xl leading-9">
            What brought you joy today?
          </Text>
          <View className="h-px bg-moegi/30 mt-5 w-56" />
        </KizenButton>
      )}

    </>
  ), [dateRange, isAdding, inputText, selectedDate, sortedNotes.length, handleCancel, handleAdd, handlePlusPress, clearFilter, isSearching, searchText, handleSearchOpen, handleSearchClose]);

  // Empty state component
  const ListEmpty = useMemo(() => {
    if (isAdding) return null;
    return (
      <View className="flex-1 items-center justify-center py-16">
        <Text className="font-nunito text-sumi-light text-center text-base leading-relaxed">
          {debouncedSearch
            ? `no notes found`
            : dateRange
            ? `No notes in this period`
            : "Start adding your\ngratitude notes"}
        </Text>
        {debouncedSearch ? (
          <Pressable onPress={handleSearchClose} className="mt-4">
            <Text className="font-nunito text-moegi text-sm">clear search</Text>
          </Pressable>
        ) : dateRange ? (
          <Pressable onPress={clearFilter} className="mt-4">
            <Text className="font-nunito text-moegi text-sm">clear filter</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }, [dateRange, debouncedSearch, isAdding, clearFilter, handleSearchClose]);

  const contentContainerStyle = useMemo(() => ({
    paddingTop: insets.top + 48,
    paddingBottom: insets.bottom + 32,
    paddingHorizontal: 32,
    flexGrow: 1,
  }), [insets.top, insets.bottom]);

  return (
    <View className="flex-1 bg-washi">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {isDragEnabled ? (
          <DraggableFlatList
            data={sortedNotes}
            renderItem={renderDraggableItem}
            keyExtractor={(item) => item.id.toString()}
            onDragEnd={handleDragEnd}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={ListEmpty}
            contentContainerStyle={contentContainerStyle}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            autoscrollSpeed={1600}
            autoscrollThreshold={150}
          />
        ) : (
          <FlatList
            data={sortedNotes}
            renderItem={renderNoteItem}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={ListEmpty}
            contentContainerStyle={contentContainerStyle}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        )}
      </KeyboardAvoidingView>

      {/* Date Picker Modal - for new note */}
      <DatePickerModal
        visible={showDatePicker}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        onClose={() => setShowDatePicker(false)}
      />

      {/* Date Range Picker Modal - for filtering */}
      <DateRangePickerModal
        visible={showRangePicker}
        initialFrom={dateRange?.from}
        initialTo={dateRange?.to}
        onRangeSelect={handleRangeSelect}
        onClose={() => setShowRangePicker(false)}
      />
    </View>
  );
}
