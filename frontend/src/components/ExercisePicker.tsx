import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '@/lib/api';
import { makeStyles, radius, spacing, type, useColors } from '@/lib/theme';
import type { Exercise } from '@/lib/types';
import { errorMessage } from '@/lib/useApi';

import { Button, ErrorBanner, GroupedRow, Loading, useText } from './ui';

/** Full-screen sheet for choosing one or more exercises. With `single`, a tap picks and closes. */
export function ExercisePicker({
  visible,
  onClose,
  onDone,
  excludeIds = [],
  single = false,
  title = single ? 'Choose exercise' : 'Add exercises',
}: {
  visible: boolean;
  onClose: () => void;
  onDone: (exercises: Exercise[]) => void;
  excludeIds?: number[];
  single?: boolean;
  title?: string;
}) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Exercise[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Exercise[]>([]);
  const styles = useStyles();
  const t = useText();
  const c = useColors();

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const page = await api.exercises({ search: search.trim() || undefined });
        if (!cancelled) {
          setResults(page.data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(errorMessage(e));
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, visible]);

  const toggle = (exercise: Exercise) =>
    setSelected((current) =>
      current.some((e) => e.id === exercise.id)
        ? current.filter((e) => e.id !== exercise.id)
        : [...current, exercise],
    );

  const close = () => {
    setSelected([]);
    onClose();
  };

  const available = (results ?? []).filter((e) => !excludeIds.includes(e.id));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Button title="Cancel" variant="ghost" onPress={close} />
          <Text style={t.heading}>{title}</Text>
          {single ? (
            // Keeps the title centred.
            <View style={{ width: 80 }} />
          ) : (
            <Button
              title={selected.length ? `Add (${selected.length})` : 'Add'}
              variant="ghost"
              disabled={selected.length === 0}
              onPress={() => {
                onDone(selected);
                setSelected([]);
              }}
            />
          )}
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={c.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search exercises"
            placeholderTextColor={c.textFaint}
            selectionColor={c.accent}
            autoCorrect={false}
            style={styles.searchInput}
            accessibilityLabel="Search exercises"
          />
        </View>

        {error ? <ErrorBanner message={error} /> : null}

        {results === null && !error ? (
          <Loading />
        ) : (
          <FlatList
            data={available}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={[t.muted, styles.empty]}>No exercises found.</Text>}
            renderItem={({ item, index }) => {
              const isSelected = selected.some((e) => e.id === item.id);
              return (
                <GroupedRow index={index} total={available.length}>
                <Pressable
                  onPress={() => (single ? onDone([item]) : toggle(item))}
                  accessibilityRole={single ? 'button' : 'checkbox'}
                  accessibilityState={single ? undefined : { checked: isSelected }}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={t.body}>{item.name}</Text>
                    <Text style={t.caption}>
                      {[item.muscle_group?.name, item.equipment?.name, item.is_custom ? 'Custom' : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  {single ? (
                    <Ionicons name="chevron-forward" size={20} color={c.textFaint} />
                  ) : (
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={26}
                      color={isSelected ? c.accent : c.ruleStrong}
                    />
                  )}
                </Pressable>
                </GroupedRow>
              );
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    minHeight: 52,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: c.surfaceMuted,
  },
  searchInput: { ...type.body, flex: 1, minHeight: 44, color: c.text },
  empty: { textAlign: 'center', padding: spacing.xl },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 64,
  },
  rowPressed: { backgroundColor: c.surfaceMuted },
}));
