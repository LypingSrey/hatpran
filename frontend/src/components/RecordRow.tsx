import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDate, formatRecordValue, formatTime, recordLabels } from '@/lib/format';
import { colors, radius, spacing } from '@/lib/theme';
import type { PersonalRecord } from '@/lib/types';

import { Button, text } from './ui';

/** Where to go to change a record: the entry the user typed in, or the workout whose set holds it. */
function editRoute(record: PersonalRecord): Href | null {
  if (record.source === 'manual' && record.manual_record_id) {
    return { pathname: '/record/manual', params: { id: record.manual_record_id } };
  }
  if (record.workout) return `/workout/${record.workout.id}`;
  return null;
}

/**
 * One record line: what it is and its value. Tapping shows where and when it was set, with a button
 * to edit the manual entry or open the workout, since those sets are what the record is computed from.
 */
export function RecordRow({ record, showExercise = false }: { record: PersonalRecord; showExercise?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const route = editRoute(record);
  const isManual = record.source === 'manual';
  const label = showExercise
    ? `${record.exercise?.name ?? 'Exercise'} · ${recordLabels[record.record_type]}`
    : recordLabels[record.record_type];
  const origin = isManual ? 'Entered by you' : (record.workout?.name ?? 'From a workout');
  // Manual entries are stored at midday as a placeholder, so only their date means anything.
  const when = isManual
    ? formatDate(record.achieved_at)
    : `${formatDate(record.achieved_at)} · ${formatTime(record.achieved_at)}`;

  return (
    <View>
      <Pressable
        onPress={() => setExpanded((open) => !open)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityHint={expanded ? 'Hide where this record is from' : 'Show where this record is from'}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
      >
        <Text style={[text.body, { flex: 1 }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[text.body, { fontWeight: '700' }]}>{formatRecordValue(record.record_type, record.value)}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
      </Pressable>

      {expanded ? (
        <View style={styles.details}>
          <View style={styles.detailLine}>
            <Ionicons name={isManual ? 'create-outline' : 'barbell-outline'} size={14} color={colors.textMuted} />
            <Text style={[text.body, { flex: 1 }]}>{origin}</Text>
          </View>
          <View style={styles.detailLine}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={[text.muted, { flex: 1 }]}>{when}</Text>
          </View>
          {route ? (
            <Button
              title={isManual ? 'Edit record' : 'Open workout'}
              variant="secondary"
              onPress={() => router.push(route)}
              style={styles.action}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  details: {
    gap: spacing.xs,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  detailLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  action: { marginTop: spacing.xs },
});
