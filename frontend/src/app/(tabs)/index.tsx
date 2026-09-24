import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, ErrorBanner, Loading, text } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate, formatDuration, formatNumber } from '@/lib/format';
import { colors, radius, spacing } from '@/lib/theme';
import type { Workout } from '@/lib/types';
import { errorMessage, useApi } from '@/lib/useApi';

export default function WorkoutsScreen() {
  const active = useApi(() => api.workouts({ in_progress: true }));
  const history = useApi(() => api.workouts({ completed: true }));
  const [extraPages, setExtraPages] = useState<Workout[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);

  const refresh = async () => {
    setExtraPages([]);
    setPage(1);
    await Promise.all([active.refresh(), history.refresh()]);
  };

  const lastPage = history.data?.meta.last_page ?? 1;
  // Page 1 is refetched on every focus; drop any rows it now shares with pages loaded later.
  const firstPage = history.data?.data ?? [];
  const firstPageIds = new Set(firstPage.map((w) => w.id));
  const workouts = [...firstPage, ...extraPages.filter((w) => !firstPageIds.has(w.id))];

  const loadMore = async () => {
    if (loadingMore || page >= lastPage) return;
    setLoadingMore(true);
    try {
      const next = await api.workouts({ completed: true, page: page + 1 });
      setExtraPages((current) => [...current, ...next.data]);
      setPage(page + 1);
      setMoreError(null);
    } catch (e) {
      setMoreError(errorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  };

  if (history.isLoading && !history.data) return <Loading />;

  const inProgress = active.data?.data ?? [];

  return (
    <FlatList
      data={workouts}
      keyExtractor={(w) => String(w.id)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={history.isRefreshing} onRefresh={refresh} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={
        <View style={{ gap: spacing.md }}>
          {history.error ? <ErrorBanner message={history.error} onRetry={refresh} /> : null}

          {inProgress.map((w) => (
            <Pressable
              key={w.id}
              onPress={() => router.push(`/workout/${w.id}`)}
              style={styles.activeBanner}
              accessibilityRole="button"
              accessibilityLabel={`Resume ${w.name}`}
            >
              <Ionicons name="play-circle" size={32} color={colors.onPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activeLabel}>In progress</Text>
                <Text style={styles.activeName}>{w.name}</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.onPrimary} />
            </Pressable>
          ))}

          <Button title="Start empty workout" onPress={() => router.push('/workout/new')} />
          <Button title="Start from a template" variant="secondary" onPress={() => router.push('/templates')} />

          <Text style={[text.heading, { marginTop: spacing.md }]}>History</Text>
        </View>
      }
      ListEmptyComponent={
        history.error ? null : (
          <EmptyState title="No finished workouts yet" message="Complete a workout and it will show up here." />
        )
      }
      ListFooterComponent={
        moreError ? <ErrorBanner message={moreError} onRetry={loadMore} /> : loadingMore ? <Loading /> : null
      }
      renderItem={({ item }) => <WorkoutRow workout={item} />}
    />
  );
}

function WorkoutRow({ workout }: { workout: Workout }) {
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

function Stat({ icon, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; value: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <Text style={text.body}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.success,
  },
  activeLabel: { color: colors.onPrimary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  activeName: { color: colors.onPrimary, fontSize: 17, fontWeight: '700' },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  stats: { flexDirection: 'row', gap: spacing.lg, flexWrap: 'wrap' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
