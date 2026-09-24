import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { SetInput } from '@/lib/api';
import { setFieldsFor, type SetField } from '@/lib/format';
import { colors, radius, spacing } from '@/lib/theme';
import type { ExerciseSet, ExerciseType, SetType } from '@/lib/types';

const setTypeOrder: SetType[] = ['normal', 'warmup', 'drop', 'failure'];
const setTypeBadge: Record<SetType, { label: string; color: string }> = {
  normal: { label: '', color: colors.text },
  warmup: { label: 'W', color: colors.gold },
  drop: { label: 'D', color: colors.primary },
  failure: { label: 'F', color: colors.danger },
};

type Drafts = Record<SetField, string>;

function toDrafts(set: ExerciseSet): Drafts {
  const str = (v: number | null) => (v == null ? '' : String(v));
  return {
    weight_kg: str(set.weight_kg),
    reps: str(set.reps),
    distance_meters: str(set.distance_meters),
    duration_seconds: str(set.duration_seconds),
  };
}

function parse(field: SetField, raw: string): number | null {
  const trimmed = raw.trim().replace(',', '.');
  if (trimmed === '') return null;
  const value = field === 'weight_kg' ? Number.parseFloat(trimmed) : Number.parseInt(trimmed, 10);
  return Number.isFinite(value) ? value : null;
}

/** One editable set line inside a workout. Saves on blur and when ticked. */
export function SetRow({
  set,
  exerciseType,
  onSave,
  onDelete,
}: {
  set: ExerciseSet;
  exerciseType: ExerciseType;
  onSave: (changes: SetInput) => Promise<void>;
  onDelete: () => void;
}) {
  const fields = setFieldsFor(exerciseType);
  const [drafts, setDrafts] = useState<Drafts>(() => toDrafts(set));
  const [syncedSet, setSyncedSet] = useState(set);
  const [focusedField, setFocusedField] = useState<SetField | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  // Take server values when the set changes underneath us (e.g. after a save),
  // but never overwrite the field the user is typing into.
  if (syncedSet !== set) {
    setSyncedSet(set);
    const server = toDrafts(set);
    setDrafts((current) => (focusedField ? { ...server, [focusedField]: current[focusedField] } : server));
  }

  // Run saves one at a time so an older response can't land after a newer one.
  const save = (changes: SetInput) => {
    saveQueue.current = saveQueue.current.then(() => onSave(changes));
  };

  const values = (): SetInput =>
    Object.fromEntries(fields.map(({ field }) => [field, parse(field, drafts[field])])) as SetInput;

  const isDirty = fields.some(({ field }) => parse(field, drafts[field]) !== set[field]);

  const saveIfDirty = () => {
    if (isDirty) save(values());
  };

  const cycleType = () => {
    const next = setTypeOrder[(setTypeOrder.indexOf(set.set_type) + 1) % setTypeOrder.length];
    save({ set_type: next });
  };

  const badge = setTypeBadge[set.set_type];

  return (
    <View style={[styles.row, set.is_completed && styles.rowCompleted]}>
      <Pressable
        onPress={cycleType}
        onLongPress={onDelete}
        style={styles.setNumber}
        accessibilityRole="button"
        accessibilityLabel={`Set ${set.set_number}, ${set.set_type}. Tap to change type, long press to delete.`}
      >
        <Text style={[styles.setNumberText, { color: badge.color }]}>{badge.label || set.set_number}</Text>
      </Pressable>

      {fields.map(({ field, label }) => (
        <TextInput
          key={field}
          value={drafts[field]}
          onChangeText={(v) => setDrafts((d) => ({ ...d, [field]: v }))}
          onFocus={() => setFocusedField(field)}
          onBlur={() => {
            setFocusedField(null);
            saveIfDirty();
          }}
          placeholder={label}
          placeholderTextColor={colors.textMuted}
          keyboardType={field === 'weight_kg' ? 'decimal-pad' : 'number-pad'}
          selectTextOnFocus
          style={styles.input}
          accessibilityLabel={`Set ${set.set_number} ${label}`}
        />
      ))}

      <Pressable
        onPress={() => save({ ...values(), is_completed: !set.is_completed })}
        style={[styles.check, set.is_completed && styles.checkDone]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: set.is_completed }}
        accessibilityLabel={`Mark set ${set.set_number} ${set.is_completed ? 'not done' : 'done'}`}
      >
        <Ionicons name="checkmark" size={20} color={set.is_completed ? colors.onPrimary : colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  rowCompleted: { backgroundColor: colors.successMuted },
  setNumber: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center' },
  setNumberText: { fontSize: 16, fontWeight: '700' },
  input: {
    flex: 1,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    textAlign: 'center',
    fontSize: 16,
    color: colors.text,
  },
  check: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.success },
});
