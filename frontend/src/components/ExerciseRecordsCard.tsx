import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import type { ExerciseRecords } from '@/lib/recordGroups';
import { makeStyles, radius, spacing, useColors } from '@/lib/theme';

import { RecordRow } from './RecordRow';
import { Card, Rule, useText } from './ui';

/** One exercise's records in a card: a header that opens the exercise, then each record, tap to expand. */
export function ExerciseRecordsCard({ group }: { group: ExerciseRecords }) {
  const styles = useStyles();
  const t = useText();
  const c = useColors();
  return (
    <Card flush>
      <Pressable
        onPress={() => router.push(`/exercise/${group.exerciseId}`)}
        accessibilityRole="button"
        accessibilityHint="Open the exercise"
        style={({ pressed }) => [styles.head, pressed && styles.pressed]}
      >
        <View style={styles.trophy}>
          <Ionicons name="trophy" size={18} color={c.record} />
        </View>
        <Text style={[t.heading, styles.flex]} accessibilityRole="header" numberOfLines={1}>
          {group.name}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
      </Pressable>
      {group.records.map((r) => (
        <View key={r.id}>
          <Rule />
          <RecordRow record={r} />
        </View>
      ))}
    </Card>
  );
}

const useStyles = makeStyles((c) => ({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 60, paddingHorizontal: spacing.lg },
  pressed: { opacity: 0.7 },
  trophy: {
    width: 32,
    height: 32,
    borderRadius: radius.round,
    backgroundColor: c.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
