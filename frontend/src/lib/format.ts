import type { ExerciseType, RecordType } from './types';

export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null) return '—';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatNumber(value: number | null | undefined, maxDecimals = 1): string {
  if (value == null) return '—';
  return value.toLocaleString(undefined, { maximumFractionDigits: maxDecimals });
}

export const recordLabels: Record<RecordType, string> = {
  max_weight: 'Heaviest weight',
  max_reps: 'Most reps',
  max_volume: 'Best set volume',
  max_duration: 'Longest duration',
  max_distance: 'Longest distance',
};

export function formatRecordValue(type: RecordType, value: number): string {
  switch (type) {
    case 'max_weight':
      return `${formatNumber(value, 2)} kg`;
    case 'max_volume':
      return `${formatNumber(value)} kg`;
    case 'max_reps':
      return `${formatNumber(value, 0)} reps`;
    case 'max_duration':
      return formatDuration(value);
    case 'max_distance':
      return `${formatNumber(value, 0)} m`;
  }
}

export const exerciseTypeLabels: Record<ExerciseType, string> = {
  weight_reps: 'Weight & reps',
  bodyweight_reps: 'Bodyweight reps',
  weighted_bodyweight: 'Weighted bodyweight',
  assisted_bodyweight: 'Assisted bodyweight',
  duration: 'Duration',
  distance_duration: 'Distance & duration',
  weight_distance: 'Weight & distance',
};

export type SetField = 'weight_kg' | 'reps' | 'distance_meters' | 'duration_seconds';

/** Which set inputs make sense for an exercise type, with their column labels. */
export function setFieldsFor(type: ExerciseType): { field: SetField; label: string }[] {
  switch (type) {
    case 'weight_reps':
    case 'weighted_bodyweight':
      return [
        { field: 'weight_kg', label: 'kg' },
        { field: 'reps', label: 'Reps' },
      ];
    case 'assisted_bodyweight':
      return [
        { field: 'weight_kg', label: 'Assist kg' },
        { field: 'reps', label: 'Reps' },
      ];
    case 'bodyweight_reps':
      return [{ field: 'reps', label: 'Reps' }];
    case 'duration':
      return [{ field: 'duration_seconds', label: 'Seconds' }];
    case 'distance_duration':
      return [
        { field: 'distance_meters', label: 'Meters' },
        { field: 'duration_seconds', label: 'Seconds' },
      ];
    case 'weight_distance':
      return [
        { field: 'weight_kg', label: 'kg' },
        { field: 'distance_meters', label: 'Meters' },
      ];
  }
}
