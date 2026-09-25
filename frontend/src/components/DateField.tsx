import { View } from 'react-native';

import { toDateInput } from '@/lib/format';
import { spacing } from '@/lib/theme';

import { Chip, Field } from './ui';

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toDateInput(date);
}

/** A YYYY-MM-DD text field with one-tap shortcuts for today and yesterday. */
export function DateField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const today = daysAgo(0);
  const yesterday = daysAgo(1);
  return (
    <View style={{ gap: spacing.sm }}>
      <Field
        label={label}
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
        error={error}
      />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Chip label="Today" selected={value === today} onPress={() => onChange(today)} />
        <Chip label="Yesterday" selected={value === yesterday} onPress={() => onChange(yesterday)} />
      </View>
    </View>
  );
}
