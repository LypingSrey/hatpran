import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { fonts, useColors } from '@/lib/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Filled when active, outlined otherwise, so the current tab reads by shape as well as color. */
function tabIcon(active: IconName, inactive: IconName) {
  return function TabIcon({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) {
    return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
  };
}

export default function TabLayout() {
  const c = useColors();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        tabBarStyle: { backgroundColor: c.background, borderTopColor: c.rule },
        // Each tab draws its own large title at the top of its content.
        headerShown: false,
        sceneStyle: { backgroundColor: c.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Workouts', tabBarIcon: tabIcon('barbell', 'barbell-outline') }} />
      <Tabs.Screen name="templates" options={{ title: 'Templates', tabBarIcon: tabIcon('list', 'list-outline') }} />
      <Tabs.Screen name="exercises" options={{ title: 'Exercises', tabBarIcon: tabIcon('search', 'search-outline') }} />
      <Tabs.Screen name="records" options={{ title: 'Records', tabBarIcon: tabIcon('trophy', 'trophy-outline') }} />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: tabIcon('person-circle', 'person-circle-outline') }}
      />
    </Tabs>
  );
}
