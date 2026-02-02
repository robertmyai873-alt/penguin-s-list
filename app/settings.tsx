import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Switch, Platform, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  NotificationSettings,
  getNotificationSettings,
  saveNotificationSettings,
  scheduleDailyNotification,
  cancelAllNotifications,
  requestNotificationPermissions,
  formatTime,
  areNotificationsAvailable,
} from '../services/notifications';
import { getRandomNote } from '../db/queries';
import theme from '../constants/theme';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    hour: 9,
    minute: 0,
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notificationsAvailable, setNotificationsAvailable] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    const available = await areNotificationsAvailable();
    setNotificationsAvailable(available);

    const saved = await getNotificationSettings();
    setSettings(saved);
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      // Request permissions first
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Notifications disabled',
          'Please enable notifications in your device settings to receive daily reminders.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Schedule notification with random note
      const randomNote = await getRandomNote(db);
      if (randomNote) {
        await scheduleDailyNotification(
          settings.hour,
          settings.minute,
          randomNote.content
        );
      }
    } else {
      await cancelAllNotifications();
    }

    const newSettings = { ...settings, enabled };
    setSettings(newSettings);
    await saveNotificationSettings(newSettings);
  };

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (selectedDate) {
      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();

      const newSettings = { ...settings, hour, minute };
      setSettings(newSettings);
      await saveNotificationSettings(newSettings);

      // Reschedule if enabled
      if (settings.enabled) {
        const randomNote = await getRandomNote(db);
        if (randomNote) {
          await scheduleDailyNotification(hour, minute, randomNote.content);
        }
      }
    }
  };

  const timePickerDate = new Date();
  timePickerDate.setHours(settings.hour);
  timePickerDate.setMinutes(settings.minute);

  return (
    <View className="flex-1 bg-washi" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-6 py-4">
        <Pressable
          onPress={() => router.back()}
          className="p-2 -ml-2"
          hitSlop={16}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.sumi} />
        </Pressable>
        <Text className="font-nunito text-sumi text-lg ml-2">Settings</Text>
      </View>

      {/* Settings content */}
      <View className="px-8 pt-4">
        {/* Notifications Section */}
        <Text className="font-nunito-semibold text-moegi text-xs uppercase tracking-widest mb-4">
          Daily Reminder
        </Text>

        {!notificationsAvailable ? (
          <Text className="font-nunito text-sumi-light text-sm">
            Notifications are not available on this device.
          </Text>
        ) : (
          <>
            {/* Enable toggle */}
            <View className="flex-row items-center justify-between py-4 border-b border-washi-warm">
              <View className="flex-1 pr-4">
                <Text className="font-nunito text-sumi text-base">
                  Daily gratitude reminder
                </Text>
                <Text className="font-nunito text-sumi-light text-sm mt-1">
                  Receive a random note each day
                </Text>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={handleToggleNotifications}
                trackColor={{
                  false: theme.colors.washiWarm,
                  true: theme.colors.moegiLight,
                }}
                thumbColor={
                  settings.enabled ? theme.colors.moegi : theme.colors.sumiLight
                }
              />
            </View>

            {/* Time picker */}
            <Pressable
              onPress={() => settings.enabled && setShowTimePicker(true)}
              className={`flex-row items-center justify-between py-4 ${
                !settings.enabled ? 'opacity-40' : ''
              }`}
              disabled={!settings.enabled}
            >
              <View>
                <Text className="font-nunito text-sumi text-base">
                  Notification time
                </Text>
                <Text className="font-nunito text-sumi-light text-sm mt-1">
                  When to receive the reminder
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="font-nunito text-moegi text-base mr-2">
                  {formatTime(settings.hour, settings.minute)}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.colors.sumiLight}
                />
              </View>
            </Pressable>

            {/* Time picker modal/inline */}
            {showTimePicker && (
              <View className="items-center py-4">
                <DateTimePicker
                  value={timePickerDate}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                  textColor={theme.colors.sumi}
                />
                {Platform.OS === 'ios' && (
                  <Pressable
                    onPress={() => setShowTimePicker(false)}
                    className="mt-4"
                  >
                    <Text className="font-nunito-semibold text-moegi text-sm">
                      Done
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </>
        )}

        {/* Explanation */}
        <View className="mt-8 p-4 bg-washi-warm/50 rounded-lg">
          <Text className="font-nunito text-sumi-light text-sm leading-6">
            Each day at your chosen time, you'll receive a notification with a
            randomly selected gratitude note from your collection. A gentle
            reminder to appreciate life's small joys.
          </Text>
        </View>
      </View>
    </View>
  );
}
