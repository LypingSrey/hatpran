import type { PersonalRecord } from './types';

/** Key of the category for exercises with no muscle group. */
export const OTHER_CATEGORY = 'other';

/** One exercise's records, as shown in a card. */
export interface ExerciseRecords {
  exerciseId: number;
  name: string;
  records: PersonalRecord[];
  /** When the most recent of these records was set. */
  latest: string;
}

/** A muscle group (Chest, Back, …) and every exercise in it that has a record. */
export interface MuscleCategory {
  /** The muscle group's id as a string, or OTHER_CATEGORY. Used in the category screen's route. */
  key: string;
  name: string;
  exercises: ExerciseRecords[];
  recordCount: number;
}

/** Group records by exercise, most recently improved first. */
export function groupByExercise(records: PersonalRecord[]): ExerciseRecords[] {
  const groups = new Map<number, ExerciseRecords>();
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
  return [...groups.values()].sort((a, b) => b.latest.localeCompare(a.latest));
}

/**
 * Split records into muscle-group categories by each exercise's primary muscle group, alphabetically,
 * with exercises that have no group under "Other" at the end.
 */
export function groupByMuscle(records: PersonalRecord[]): MuscleCategory[] {
  const byKey = new Map<string, { name: string; records: PersonalRecord[] }>();
  for (const record of records) {
    const muscle = record.exercise?.muscle_group;
    const key = muscle ? String(muscle.id) : OTHER_CATEGORY;
    const entry = byKey.get(key) ?? { name: muscle?.name ?? 'Other', records: [] };
    entry.records.push(record);
    byKey.set(key, entry);
  }
  return [...byKey.entries()]
    .map(([key, { name, records: categoryRecords }]) => ({
      key,
      name,
      exercises: groupByExercise(categoryRecords),
      recordCount: categoryRecords.length,
    }))
    .sort((a, b) => {
      if (a.key === OTHER_CATEGORY) return 1;
      if (b.key === OTHER_CATEGORY) return -1;
      return a.name.localeCompare(b.name);
    });
}
