import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { RecordRow } from '@/components/RecordRow';
import { Button, Card, ErrorBanner, text } from '@/components/ui';
import { WorkoutCard } from '@/components/WorkoutCard';
import { API_URL, api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatNumber } from '@/lib/format';
import { colors, spacing } from '@/lib/theme';
import { useApi } from '@/lib/useApi';

const RECENT_COUNT = 5;

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const stats = useApi(() => api.stats());
  const recent = useApi(() => api.workouts({ completed: true, per_page: RECENT_COUNT }));
  const records = useApi(() => api.personalRecords({ per_page: RECENT_COUNT }));

  const refresh = () => Promise.all([stats.refresh(), recent.refresh(), records.refresh()]);
  const error = stats.error ?? recent.error ?? records.error;
  const totals = stats.data?.data;
  const workouts = recent.data?.data ?? [];
  const recordList = records.data?.data ?? [];
  const memberSince = user ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : '';

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={stats.isRefreshing || recent.isRefreshing || records.isRefreshing}
          onRefresh={refresh}
        />
      }
    >
      <Card style={styles.card}>
        <Pressable
          onPress={() => router.push('/profile/edit')}
          accessibilityRole="button"
          accessibilityLabel="Change profile picture"
          style={{ marginBottom: spacing.sm }}
        >
          <Avatar user={user} />
        </Pressable>
        <Text style={text.title}>{user?.name}</Text>
        <Text style={text.muted}>{user?.email}</Text>
        <Text style={text.muted}>Member since {memberSince}</Text>
        <Button
          title="Edit profile"
          variant="secondary"
          onPress={() => router.push('/profile/edit')}
          style={{ marginTop: spacing.sm, alignSelf: 'stretch' }}
        />
      </Card>

      {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}

      <View style={styles.statsGrid}>
        <StatTile label="Workouts" value={totals ? formatNumber(totals.workouts_count, 0) : '—'} />
        <StatTile label="Volume" value={totals ? formatVolume(totals.total_volume) : '—'} />
        <StatTile label="Sets" value={totals ? formatNumber(totals.total_sets, 0) : '—'} />
        <StatTile label="Records" value={totals ? formatNumber(totals.records_count, 0) : '—'} />
      </View>

      <SectionHeader title="Recent workouts" onSeeAll={workouts.length > 0 ? () => router.navigate('/') : undefined} />
      {workouts.length === 0 && !recent.isLoading ? (
        <Card>
          <Text style={text.muted}>Finished workouts will show up here. Tap one to edit it.</Text>
        </Card>
      ) : null}
      {workouts.map((w) => (
        <WorkoutCard key={w.id} workout={w} />
      ))}

      <SectionHeader
        title="Personal records"
        onSeeAll={recordList.length > 0 ? () => router.navigate('/records') : undefined}
      />
      <Card style={{ gap: spacing.xs }}>
        {recordList.length === 0 && !records.isLoading ? (
          <Text style={text.muted}>No records yet. Finish a workout, or add a best you set before using HatPran.</Text>
        ) : null}
        {recordList.map((r) => (
          <RecordRow key={r.id} record={r} showExercise />
        ))}
        <Button
          title="+ Add a past record"
          variant="ghost"
          onPress={() => router.push('/record/manual')}
          style={{ marginTop: spacing.xs }}
        />
      </Card>

      <Button
        title="Log out"
        variant="secondary"
        loading={signingOut}
        onPress={async () => {
          setSigningOut(true);
          await signOut();
        }}
      />

      <Text style={[text.muted, { textAlign: 'center', fontSize: 12 }]}>Server: {API_URL}</Text>
    </ScrollView>
  );
}

/** Kilograms, switching to tonnes once the number gets long. */
function formatVolume(kg: number): string {
  return kg >= 10000 ? `${formatNumber(kg / 1000)} t` : `${formatNumber(kg, 0)} kg`;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.tile}>
      <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={text.muted}>{label}</Text>
    </Card>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={text.heading}>{title}</Text>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} accessibilityRole="button" hitSlop={8} style={styles.seeAll}>
          <Text style={styles.seeAllText}>See all</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  card: { alignItems: 'center', gap: spacing.xs },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { flexGrow: 1, flexBasis: '45%', alignItems: 'center', gap: 2, paddingVertical: spacing.md },
  tileValue: { fontSize: 22, fontWeight: '700', color: colors.text },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
});
