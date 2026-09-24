import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState, ErrorBanner, Loading, text } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate, formatRecordValue, recordLabels } from '@/lib/format';
import { colors, spacing } from '@/lib/theme';
import type { PersonalRecord } from '@/lib/types';
import { useApi } from '@/lib/useApi';

interface Group {
  exerciseId: number;
  name: string;
  records: PersonalRecord[];
  latest: string;
}

function groupByExercise(records: PersonalRecord[]): Group[] {
  const groups = new Map<number, Group>();
  for (const record of records) {
    const exerciseId = record.exercise?.id ?? 0;
    const group = groups.get(exerciseId) ?? {
      exerciseId,
      name: record.exercise?.name ?? 'Exercise',
      records: [],
      latest: record.achieved_at,
    };
    group.records.push(record);
    if (record.achieved_at > group.latest) group.latest = record.achieved_at;
    groups.set(exerciseId, group);
  }
  // Most recently improved exercises first.
  return [...groups.values()].sort((a, b) => b.latest.localeCompare(a.latest));
}

export default function RecordsScreen() {
  const { data, error, isLoading, isRefreshing, refresh } = useApi(() => api.personalRecords());

  if (isLoading && !data) return <Loading />;

  return (
    <FlatList
      data={groupByExercise(data?.data ?? [])}
      keyExtractor={(g) => String(g.exerciseId)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
      ListHeaderComponent={error ? <ErrorBanner message={error} onRetry={refresh} /> : null}
      ListEmptyComponent={
        error ? null : (
          <EmptyState
            title="No records yet"
            message="Finish a workout with completed sets and your best lifts will appear here."
          />
        )
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/exercise/${item.exerciseId}`)} accessibilityRole="button">
          <Card style={{ gap: spacing.sm }}>
            <View style={styles.header}>
              <Ionicons name="trophy" size={20} color={colors.gold} />
              <Text style={[text.heading, { flex: 1 }]}>{item.name}</Text>
              <Text style={text.muted}>{formatDate(item.latest)}</Text>
            </View>
            {item.records.map((r) => (
              <View key={r.id} style={styles.line}>
                <Text style={[text.body, { flex: 1, color: colors.textMuted }]}>{recordLabels[r.record_type]}</Text>
                <Text style={[text.body, { fontWeight: '700' }]}>{formatRecordValue(r.record_type, r.value)}</Text>
              </View>
            ))}
          </Card>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  line: { flexDirection: 'row', gap: spacing.sm },
});
