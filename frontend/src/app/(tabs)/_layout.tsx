import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { colors } from '@/lib/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color, size }: { name: IconName; color: ColorValue; size: number }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerTitleStyle: { color: colors.text },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Workouts', tabBarIcon: ({ color, size }) => <TabIcon name="barbell" color={color} size={size} /> }} />
      <Tabs.Screen name="templates" options={{ title: 'Templates', tabBarIcon: ({ color, size }) => <TabIcon name="list" color={color} size={size} /> }} />
      <Tabs.Screen name="exercises" options={{ title: 'Exercises', tabBarIcon: ({ color, size }) => <TabIcon name="search" color={color} size={size} /> }} />
      <Tabs.Screen name="records" options={{ title: 'Records', tabBarIcon: ({ color, size }) => <TabIcon name="trophy" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <TabIcon name="person-circle" color={color} size={size} /> }} />
    </Tabs>
  );
}
