import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { formatDate, formatDuration, formatNumber } from '@/lib/format';
import { makeStyles, radius, spacing, type, useColors } from '@/lib/theme';
import type { Workout } from '@/lib/types';

import { useText } from './ui';

/** A finished workout as a row in a grouped list: date badge, name and totals. Tapping opens it. */
export function WorkoutRow({ workout }: { workout: Workout }) {
  const styles = useStyles();
  const t = useText();
  const c = useColors();
  const when = new Date(workout.completed_at ?? workout.started_at);
  const sets = workout.total_sets ?? 0;
  const summary = [
    formatDuration(workout.duration_seconds),
    `${formatNumber(workout.total_volume ?? 0, 0)} kg`,
    `${sets} set${sets === 1 ? '' : 's'}`,
  ].join(' · ');

  return (
    <Pressable
      onPress={() => router.push(`/workout/${workout.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${workout.name}, ${formatDate(workout.completed_at ?? workout.started_at)}, ${summary}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.date}>
        <Text style={styles.day}>{when.getDate()}</Text>
        <Text style={styles.month}>{when.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</Text>
      </View>
      <View style={styles.text}>
        <Text style={t.bodyStrong} numberOfLines={1}>
          {workout.name}
        </Text>
        <Text style={t.caption} numberOfLines={1}>
          {summary}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md + 2, paddingVertical: spacing.md + 2, paddingHorizontal: spacing.lg },
  pressed: { backgroundColor: c.surfaceMuted },
  date: {
    width: 48,
    height: 48,
    borderRadius: radius.lg - 2,
    backgroundColor: c.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: { ...type.bodyStrong, fontFamily: type.figure.fontFamily, fontSize: 18, lineHeight: 20, color: c.text, fontVariant: ['tabular-nums'] },
  month: { ...type.column, fontSize: 11, lineHeight: 14, color: c.textMuted },
  text: { flex: 1, gap: 2 },
}));
