import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDate, formatRecordValue, recordLabels } from '@/lib/format';
import { colors, spacing } from '@/lib/theme';
import type { PersonalRecord } from '@/lib/types';

import { text } from './ui';

/** Where to go to change a record: the entry the user typed in, or the workout whose set holds it. */
function editRoute(record: PersonalRecord): Href | null {
  if (record.source === 'manual' && record.manual_record_id) {
    return { pathname: '/record/manual', params: { id: record.manual_record_id } };
  }
  if (record.workout) return `/workout/${record.workout.id}`;
  return null;
}

/**
 * One record line with where it came from. Tapping opens the manual entry to edit,
 * or the workout it was set in, since those sets are what the record is computed from.
 */
export function RecordRow({ record, showExercise = false }: { record: PersonalRecord; showExercise?: boolean }) {
  const route = editRoute(record);
  const origin =
    record.source === 'manual' ? 'Entered by you' : record.workout ? `In “${record.workout.name}”` : 'From a workout';
  const label = showExercise
    ? `${record.exercise?.name ?? 'Exercise'} · ${recordLabels[record.record_type]}`
    : recordLabels[record.record_type];

  return (
    <Pressable
      onPress={route ? () => router.push(route) : undefined}
      disabled={!route}
      accessibilityRole={route ? 'button' : undefined}
      accessibilityHint={record.source === 'manual' ? 'Edit this record' : 'Open the workout this record is from'}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={text.body} numberOfLines={1}>
          {label}
        </Text>
        <View style={styles.meta}>
          {record.source === 'manual' ? <Ionicons name="create-outline" size={12} color={colors.textMuted} /> : null}
          <Text style={text.muted} numberOfLines={1}>
            {origin} · {formatDate(record.achieved_at)}
          </Text>
        </View>
      </View>
      <Text style={[text.body, { fontWeight: '700' }]}>{formatRecordValue(record.record_type, record.value)}</Text>
      {route ? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
