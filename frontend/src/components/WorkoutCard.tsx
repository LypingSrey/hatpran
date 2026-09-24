import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDate, formatDuration, formatNumber } from '@/lib/format';
import { colors, spacing } from '@/lib/theme';
import type { Workout } from '@/lib/types';

import { Card, text } from './ui';

/** A finished workout in a history list; tapping opens it for viewing and editing. */
export function WorkoutCard({ workout }: { workout: Workout }) {
  const exerciseNames = (workout.exercises ?? []).map((e) => e.exercise?.name).filter(Boolean);
  return (
    <Pressable onPress={() => router.push(`/workout/${workout.id}`)} accessibilityRole="button">
      {({ pressed }) => (
        <Card style={[{ gap: spacing.sm }, pressed && { opacity: 0.8 }]}>
          <View style={styles.rowHeader}>
            <Text style={text.heading} numberOfLines={1}>
              {workout.name}
            </Text>
            <Text style={text.muted}>{formatDate(workout.completed_at ?? workout.started_at)}</Text>
          </View>
          <View style={styles.stats}>
            <Stat icon="time-outline" value={formatDuration(workout.duration_seconds)} />
            <Stat icon="barbell-outline" value={`${formatNumber(workout.total_volume ?? 0, 0)} kg`} />
            <Stat icon="checkmark-done-outline" value={`${workout.total_sets ?? 0} sets`} />
          </View>
          {exerciseNames.length > 0 ? (
            <Text style={text.muted} numberOfLines={2}>
              {exerciseNames.join(', ')}
            </Text>
          ) : null}
        </Card>
      )}
    </Pressable>
  );
}

function Stat({ icon, value }: { icon: ComponentProps<typeof Ionicons>['name']; value: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <Text style={text.body}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  stats: { flexDirection: 'row', gap: spacing.lg, flexWrap: 'wrap' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
