import { Modal, View, Text, Pressable } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import theme from '../constants/theme';

interface DatePickerModalProps {
  visible: boolean;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onClose: () => void;
  title?: string;
}

export function DatePickerModal({
  visible,
  selectedDate,
  onDateSelect,
  onClose,
  title = 'Pick a date',
}: DatePickerModalProps) {
  const handleDayPress = (day: DateData) => {
    onDateSelect(day.dateString);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/30 justify-center items-center p-8"
        onPress={onClose}
      >
        <Pressable
          className="bg-washi rounded-soft overflow-hidden w-full max-w-sm"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Simple header - no heavy chrome */}
          <View className="px-6 pt-6 pb-4">
            <Text className="text-sumi font-nunito-semibold text-base">
              {title}
            </Text>
          </View>

          <Calendar
            current={selectedDate}
            onDayPress={handleDayPress}
            markedDates={{
              [selectedDate]: {
                selected: true,
                selectedColor: theme.colors.moegi,
              },
            }}
            maxDate={new Date().toISOString().split('T')[0]}
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

          <Pressable
            onPress={onClose}
            className="p-4 border-t border-washi-warm"
          >
            <Text className="text-center font-nunito text-sumi-light text-sm">
              cancel
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
