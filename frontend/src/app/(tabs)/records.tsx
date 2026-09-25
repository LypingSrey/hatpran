import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { RecordRow } from '@/components/RecordRow';
import { Button, Card, EmptyState, ErrorBanner, Loading, text } from '@/components/ui';
import { api } from '@/lib/api';
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
  // Load every page: records are grouped by exercise, so a partial list would split or drop groups.
  const { data, error, isLoading, isRefreshing, refresh } = useApi(() => api.allPersonalRecords());

  if (isLoading && !data) return <Loading />;

  return (
    <FlatList
      data={groupByExercise(data ?? [])}
      keyExtractor={(g) => String(g.exerciseId)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
      ListHeaderComponent={
        <View style={{ gap: spacing.md }}>
          {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}
          <Button title="+ Add a past record" variant="secondary" onPress={() => router.push('/record/manual')} />
        </View>
      }
      ListEmptyComponent={
        error ? null : (
          <EmptyState
            title="No records yet"
            message="Finish a workout with completed sets, or add a best you set before, and it will appear here."
          />
        )
      }
      renderItem={({ item }) => (
        <Card style={{ gap: spacing.sm }}>
          <Pressable
            onPress={() => router.push(`/exercise/${item.exerciseId}`)}
            accessibilityRole="button"
            accessibilityHint="Open the exercise"
            style={styles.header}
          >
            <Ionicons name="trophy" size={20} color={colors.gold} />
            <Text style={[text.heading, { flex: 1 }]}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
          {item.records.map((r) => (
            <RecordRow key={r.id} record={r} />
          ))}
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
