import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, ErrorBanner, Loading, text } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { spacing } from '@/lib/theme';
import { errorMessage, useApi } from '@/lib/useApi';

function notify(title: string, message: string) {
  if (Platform.OS === 'web') globalThis.alert?.(message);
  else Alert.alert(title, message);
}

export default function TemplateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const templateId = Number(id);
  const { data, error, isLoading, refresh } = useApi(() => api.template(templateId), [templateId]);
  const [starting, setStarting] = useState(false);

  const template = data?.data;
  if (isLoading && !template) return <Loading />;
  if (!template) return <ErrorBanner message={error ?? 'Template not found.'} onRetry={refresh} />;

  const start = async () => {
    setStarting(true);
    try {
      const { data: workout } = await api.startTemplate(template.id);
      router.replace(`/workout/${workout.id}`);
    } catch (e) {
      notify('Could not start workout', errorMessage(e));
      setStarting(false);
    }
  };

  const remove = () => {
    const doDelete = async () => {
      try {
        await api.deleteTemplate(template.id);
        router.back();
      } catch (e) {
        notify('Could not delete', errorMessage(e));
      }
    };
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(`Delete “${template.name}”? Past workouts are kept.`)) void doDelete();
      return;
    }
    Alert.alert('Delete template?', 'Past workouts started from it are kept.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: template.name }} />
      {template.notes ? <Text style={text.body}>{template.notes}</Text> : null}
      <Text style={text.muted}>
        {template.times_used > 0
          ? `Used ${template.times_used}× · last ${formatDate(template.last_used_at)}`
          : 'Never used'}
      </Text>

      {(template.exercises ?? []).map((te, index) => (
        <Card key={te.id} style={styles.row}>
          <Text style={[text.heading, styles.index]}>{index + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={text.body}>{te.exercise?.name}</Text>
            <Text style={text.muted}>
              {te.target_sets ?? 3} sets{te.target_reps ? ` × ${te.target_reps} reps` : ''}
            </Text>
          </View>
        </Card>
      ))}

      <Button title="Start workout" onPress={start} loading={starting} />
      <Button title="Delete template" variant="ghost" onPress={remove} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  index: { width: 24, textAlign: 'center' },
});
