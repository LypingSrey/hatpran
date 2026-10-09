import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { EmptyState, ErrorBanner, GroupedRow, Loading, useText } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { groupByMuscle } from '@/lib/recordGroups';
import { makeStyles, radius, spacing, useColors } from '@/lib/theme';
import { useApi } from '@/lib/useApi';

/** One muscle group's exercises that have a record, most recently improved first; each opens its own records. */
export default function RecordCategoryScreen() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const { data, error, isLoading, isRefreshing, refresh } = useApi(() => api.allPersonalRecords());
  const styles = useStyles();
  const t = useText();
  const c = useColors();

  if (isLoading && !data) return <Loading />;

  const category = groupByMuscle(data ?? []).find((candidate) => candidate.key === group);
  const exercises = category?.exercises ?? [];

  return (
    <FlatList
      data={exercises}
      keyExtractor={(e) => String(e.exerciseId)}
      style={styles.screen}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={c.textMuted} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Stack.Screen options={{ title: '' }} />
          <Text style={t.title}>{category?.name ?? 'Records'}</Text>
          {category ? (
            <Text style={t.muted}>
              {exercises.length} exercise{exercises.length === 1 ? '' : 's'} · {category.recordCount} record
              {category.recordCount === 1 ? '' : 's'}
            </Text>
          ) : null}
          {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}
        </View>
      }
      ListEmptyComponent={
        error ? null : <EmptyState title="No records here yet" message="Records for this muscle group will show up here." />
      }
      renderItem={({ item, index }) => {
        const count = item.records.length;
        const summary = `${count} record${count === 1 ? '' : 's'} · ${formatDate(item.latest)}`;
        return (
          <GroupedRow index={index} total={exercises.length}>
            <Pressable
              onPress={() => router.push(`/exercise/${item.exerciseId}`)}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${summary}`}
              accessibilityHint="Open this exercise's records"
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View style={styles.trophy}>
                <Ionicons name="trophy" size={18} color={c.record} />
              </View>
              <View style={styles.rowText}>
                <Text style={t.bodyStrong} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={t.caption}>{summary}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
            </Pressable>
          </GroupedRow>
        );
      }}
    />
  );
}

const useStyles = makeStyles((c) => ({
  screen: { backgroundColor: c.background },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.xxxl },
  header: { gap: 2, paddingHorizontal: spacing.xs, marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md + 2,
    minHeight: 68,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowPressed: { backgroundColor: c.surfaceMuted },
  trophy: {
    width: 32,
    height: 32,
    borderRadius: radius.round,
    backgroundColor: c.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
}));
