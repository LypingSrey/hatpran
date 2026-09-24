import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, ErrorBanner, Loading, text } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { spacing } from '@/lib/theme';
import type { WorkoutTemplate } from '@/lib/types';
import { errorMessage, useApi } from '@/lib/useApi';

export default function TemplatesScreen() {
  const { data, error, isLoading, isRefreshing, refresh } = useApi(() => api.templates());
  const [startingId, setStartingId] = useState<number | null>(null);

  const start = async (template: WorkoutTemplate) => {
    setStartingId(template.id);
    try {
      const { data: workout } = await api.startTemplate(template.id);
      router.push(`/workout/${workout.id}`);
    } catch (e) {
      const message = errorMessage(e);
      if (Platform.OS === 'web') globalThis.alert?.(message);
      else Alert.alert('Could not start workout', message);
    } finally {
      setStartingId(null);
    }
  };

  if (isLoading && !data) return <Loading />;

  return (
    <FlatList
      data={data?.data ?? []}
      keyExtractor={(t) => String(t.id)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
      ListHeaderComponent={
        <View style={{ gap: spacing.md }}>
          {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}
          <Button title="+ New template" variant="secondary" onPress={() => router.push('/template/new')} />
        </View>
      }
      ListEmptyComponent={
        error ? null : (
          <EmptyState
            title="No templates yet"
            message="Save a routine like “Push Day” once, then start it with one tap."
          />
        )
      }
      renderItem={({ item }) => (
        <Card style={{ gap: spacing.md }}>
          <Pressable
            onPress={() => router.push(`/template/${item.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.name}`}
            style={{ gap: spacing.xs }}
          >
            <Text style={text.heading}>{item.name}</Text>
            <Text style={text.muted} numberOfLines={2}>
              {(item.exercises ?? []).map((e) => e.exercise?.name).join(', ')}
            </Text>
            <Text style={text.muted}>
              {item.times_used > 0
                ? `Used ${item.times_used}× · last ${formatDate(item.last_used_at)}`
                : 'Never used'}
            </Text>
          </Pressable>
          <Button title="Start workout" onPress={() => start(item)} loading={startingId === item.id} />
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md },
});
