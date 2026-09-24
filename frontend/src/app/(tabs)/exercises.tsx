import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Chip, EmptyState, ErrorBanner, Loading, text } from '@/components/ui';
import { api } from '@/lib/api';
import { exerciseTypeLabels } from '@/lib/format';
import { colors, radius, spacing } from '@/lib/theme';
import { useApi } from '@/lib/useApi';

export default function ExercisesScreen() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [muscleGroupId, setMuscleGroupId] = useState<number | undefined>();
  const [customOnly, setCustomOnly] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const muscleGroups = useApi(() => api.muscleGroups());
  const exercises = useApi(
    () =>
      api.exercises({
        search: debouncedSearch || undefined,
        muscle_group_id: muscleGroupId,
        custom_only: customOnly || undefined,
      }),
    [debouncedSearch, muscleGroupId, customOnly],
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.filters}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search exercises"
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            clearButtonMode="while-editing"
            style={styles.searchInput}
            accessibilityLabel="Search exercises"
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="Mine" selected={customOnly} onPress={() => setCustomOnly((v) => !v)} />
          <Chip label="All muscles" selected={muscleGroupId === undefined} onPress={() => setMuscleGroupId(undefined)} />
          {(muscleGroups.data?.data ?? []).map((mg) => (
            <Chip
              key={mg.id}
              label={mg.name}
              selected={muscleGroupId === mg.id}
              onPress={() => setMuscleGroupId(muscleGroupId === mg.id ? undefined : mg.id)}
            />
          ))}
        </ScrollView>
      </View>

      {exercises.isLoading && !exercises.data ? (
        <Loading />
      ) : (
        <FlatList
          data={exercises.data?.data ?? []}
          keyExtractor={(e) => String(e.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          ListHeaderComponent={
            <View style={{ padding: spacing.lg, gap: spacing.md }}>
              {exercises.error ? <ErrorBanner message={exercises.error} onRetry={exercises.refresh} /> : null}
              <Button title="+ Custom exercise" variant="secondary" onPress={() => router.push('/exercise/new')} />
            </View>
          }
          ListEmptyComponent={
            exercises.error ? null : <EmptyState title="No exercises match" message="Try a different search or filter." />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/exercise/${item.id}`)}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceMuted }]}
              accessibilityRole="button"
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={text.body}>{item.name}</Text>
                <Text style={text.muted}>
                  {[item.muscle_group?.name, item.equipment?.name, exerciseTypeLabels[item.exercise_type]]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
              {item.is_custom ? <Text style={styles.customBadge}>Custom</Text> : null}
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { paddingTop: spacing.md, gap: spacing.sm, backgroundColor: colors.background },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, minHeight: 44, fontSize: 16, color: colors.text },
  chips: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  customBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
});
