import { View, Text, Pressable } from 'react-native';
import { Link, Stack } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <View className="flex-1 bg-washi items-center justify-center p-8">
        <Text className="font-nunito text-sumi-light text-center mb-6">
          This page doesn't exist
        </Text>
        <Link href="/" asChild>
          <Pressable>
            <Text className="font-nunito text-moegi">
              return home
            </Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}
