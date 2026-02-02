import { useState } from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import theme from '../constants/theme';

interface DateRangePickerModalProps {
  visible: boolean;
  initialFrom?: string;
  initialTo?: string;
  onRangeSelect: (from: string, to: string) => void;
  onClose: () => void;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// Format as YY.MM.DD
function formatDateCompact(dateString: string): string {
  const date = new Date(dateString);
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  return `${yy}.${mm}.${dd}`;
}

export function DateRangePickerModal({
  visible,
  initialFrom,
  initialTo,
  onRangeSelect,
  onClose,
}: DateRangePickerModalProps) {
  const [fromDate, setFromDate] = useState<string | null>(initialFrom || null);
  const [toDate, setToDate] = useState<string | null>(initialTo || null);
  const [selectingFrom, setSelectingFrom] = useState(true);

  const handleDayPress = (day: DateData) => {
    if (selectingFrom) {
      setFromDate(day.dateString);
      setToDate(null); // Reset to date when selecting new from
      setSelectingFrom(false);
    } else {
      // Ensure to date is after from date
      if (fromDate && day.dateString < fromDate) {
        // If selected date is before from, swap them
        setToDate(fromDate);
        setFromDate(day.dateString);
      } else {
        setToDate(day.dateString);
      }
    }
  };

  const handleApply = () => {
    if (fromDate && toDate) {
      onRangeSelect(fromDate, toDate);
    } else if (fromDate) {
      // If only from is selected, use same date for both (single day)
      onRangeSelect(fromDate, fromDate);
    }
  };

  const handleReset = () => {
    setFromDate(null);
    setToDate(null);
    setSelectingFrom(true);
  };

  // Build marked dates for the range
  const getMarkedDates = () => {
    const marked: Record<string, any> = {};

    if (fromDate) {
      marked[fromDate] = {
        selected: true,
        startingDay: true,
        color: theme.colors.moegi,
        textColor: '#ffffff',
      };
    }

    if (toDate && fromDate) {
      // Mark the range between from and to
      const start = new Date(fromDate);
      const end = new Date(toDate);
      const current = new Date(start);
      current.setDate(current.getDate() + 1);

      while (current < end) {
        const dateStr = current.toISOString().split('T')[0];
        marked[dateStr] = {
          selected: true,
          color: theme.colors.moegiSoft,
          textColor: theme.colors.sumi,
        };
        current.setDate(current.getDate() + 1);
      }

      marked[toDate] = {
        selected: true,
        endingDay: true,
        color: theme.colors.moegi,
        textColor: '#ffffff',
      };
    }

    return marked;
  };

  const canApply = fromDate !== null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/30 justify-center items-center p-6"
        onPress={onClose}
      >
        <Pressable
          className="bg-washi rounded-soft overflow-hidden w-full max-w-sm"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="px-6 pt-6 pb-4">
            <Text className="text-sumi font-nunito-semibold text-base mb-3">
              Filter by period
            </Text>

            {/* From/To display */}
            <View className="flex-row items-center">
              <Pressable
                onPress={() => setSelectingFrom(true)}
                className={`flex-1 py-2 px-3 rounded-gentle mr-2 ${
                  selectingFrom ? 'bg-moegi-soft' : 'bg-washi-warm'
                }`}
              >
                <Text className="font-nunito text-sumi-light text-xs mb-1">from</Text>
                <Text className={`font-nunito text-sm ${fromDate ? 'text-sumi' : 'text-sumi-light'}`}>
                  {fromDate ? formatDateCompact(fromDate) : '—'}
                </Text>
              </Pressable>

              <Text className="font-nunito text-sumi-light text-sm mx-1">→</Text>

              <Pressable
                onPress={() => fromDate && setSelectingFrom(false)}
                className={`flex-1 py-2 px-3 rounded-gentle ml-2 ${
                  !selectingFrom ? 'bg-moegi-soft' : 'bg-washi-warm'
                }`}
              >
                <Text className="font-nunito text-sumi-light text-xs mb-1">to</Text>
                <Text className={`font-nunito text-sm ${toDate ? 'text-sumi' : 'text-sumi-light'}`}>
                  {toDate ? formatDateCompact(toDate) : '—'}
                </Text>
              </Pressable>
            </View>
          </View>

          <Calendar
            current={fromDate || getToday()}
            onDayPress={handleDayPress}
            markedDates={getMarkedDates()}
            markingType={fromDate && toDate ? 'period' : 'dot'}
            maxDate={getToday()}
            theme={{
              backgroundColor: theme.colors.washi,
              calendarBackground: theme.colors.washi,
              textSectionTitleColor: theme.colors.sumiLight,
              selectedDayBackgroundColor: theme.colors.moegi,
              selectedDayTextColor: '#ffffff',
              todayTextColor: theme.colors.moegi,
              dayTextColor: theme.colors.sumi,
              textDisabledColor: theme.colors.washiWarm,
              arrowColor: theme.colors.sumiLight,
              monthTextColor: theme.colors.sumi,
              textDayFontFamily: 'Nunito_400Regular',
              textMonthFontFamily: 'Nunito_600SemiBold',
              textDayHeaderFontFamily: 'Nunito_400Regular',
              textDayFontSize: 15,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
          />

          {/* Actions */}
          <View className="flex-row border-t border-washi-warm">
            <Pressable
              onPress={handleReset}
              className="flex-1 p-4"
            >
              <Text className="text-center font-nunito text-sumi-light text-sm">
                reset
              </Text>
            </Pressable>

            <View className="w-px bg-washi-warm" />

            <Pressable
              onPress={onClose}
              className="flex-1 p-4"
            >
              <Text className="text-center font-nunito text-sumi-light text-sm">
                cancel
              </Text>
            </Pressable>

            <View className="w-px bg-washi-warm" />

            <Pressable
              onPress={handleApply}
              disabled={!canApply}
              className="flex-1 p-4"
            >
              <Text className={`text-center font-nunito-semibold text-sm ${
                canApply ? 'text-moegi' : 'text-sumi-light'
              }`}>
                apply
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
