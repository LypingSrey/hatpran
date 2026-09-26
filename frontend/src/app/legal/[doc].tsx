import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { useText } from '@/components/ui';
import { makeStyles, spacing } from '@/lib/theme';

// ponytail: placeholder contact, replace before publishing to the stores.
const CONTACT_EMAIL = 'support@hatpran.app';
const UPDATED = '26 September 2026';

type Doc = { title: string; sections: [heading: string, ...paragraphs: string[]][] };

const DOCS: Record<string, Doc> = {
  privacy: {
    title: 'Privacy Policy',
    sections: [
      [
        'What we collect',
        'Your account: name, email address and password. Passwords are stored hashed, never in plain text.',
        'Your training: workouts, sets, templates, custom exercises, personal records and any records you enter by hand, along with the notes, dates and times you add to them.',
        'Your profile picture, if you choose to add one.',
      ],
      [
        'How we use it',
        'Only to run HatPran: to sign you in, save your training, work out your personal records and show your stats. We do not sell your data, show ads, or use analytics or tracking tools.',
      ],
      [
        'Where it is stored',
        'Your data is kept on the HatPran server. On your phone, HatPran keeps only your sign-in token (in the device’s secure storage) and your appearance setting.',
        'Your profile picture is served from a web address that is not listed anywhere, but anyone who has that address can view it.',
      ],
      [
        'Camera and photos',
        'HatPran asks for camera or photo access only when you set a profile picture, and uploads only the picture you pick.',
      ],
      [
        'Sharing',
        'We do not share your data with anyone, except where the law requires it.',
      ],
      [
        'Keeping and deleting your data',
        'We keep your data for as long as you have an account. You can change your name, email, password and profile picture at any time in Edit profile, and edit or delete your workouts, templates and records in the app.',
        'To delete your account and everything in it, go to Profile › Edit profile › Delete account. It is deleted straight away and cannot be recovered.',
      ],
      ['Children', 'HatPran is not meant for children under 13, and we do not knowingly collect their data.'],
      [
        'Changes',
        'If we change this policy, we will update the date below and let you know in the app if the change is significant.',
      ],
      ['Contact', `Questions about your privacy: ${CONTACT_EMAIL}`],
    ],
  },
  terms: {
    title: 'Terms of Service',
    sections: [
      [
        'Agreement',
        'By creating an account or using HatPran, you agree to these terms. If you do not agree, please do not use the app.',
      ],
      [
        'Your account',
        'Keep your password safe; you are responsible for what happens under your account. Give a real email address so you can be contacted about your account. You must be at least 13 to use HatPran.',
      ],
      [
        'Your content',
        'The workouts, records and pictures you add stay yours. You let us store and process them only so we can provide HatPran to you. Do not upload a profile picture you do not have the right to use, or one that is unlawful or offensive.',
      ],
      [
        'Fair use',
        'Do not try to break, overload or get unauthorised access to HatPran or other people’s accounts, and do not use it for anything unlawful.',
      ],
      [
        'Not medical advice',
        'HatPran is a training log. It does not give medical or fitness advice. Lifting weights carries a risk of injury; train within your limits and talk to a doctor before starting a new programme if you have any health concerns. You train at your own risk.',
      ],
      [
        'The service',
        'HatPran is provided “as is”. We work to keep it available and your data safe, but we cannot promise it will always be available or free of errors, so keep your own copy of anything you cannot afford to lose. We may change, pause or stop the service.',
      ],
      [
        'Liability',
        'As far as the law allows, HatPran and its makers are not liable for indirect or consequential losses, lost data, or injuries that come from using the app.',
      ],
      [
        'Ending your account',
        'You can stop using HatPran at any time and delete your account from Edit profile. We may suspend accounts that break these terms.',
      ],
      [
        'Changes',
        'We may update these terms. If a change is significant, we will let you know in the app. Using HatPran after a change means you accept the new terms.',
      ],
      ['Contact', CONTACT_EMAIL],
    ],
  },
};

export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const styles = useStyles();
  const t = useText();
  const content = DOCS[doc] ?? DOCS.privacy;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.page}>
      <Stack.Screen options={{ title: content.title }} />
      {content.sections.map(([heading, ...paragraphs]) => (
        <View key={heading} style={styles.section}>
          <Text style={t.heading} accessibilityRole="header">
            {heading}
          </Text>
          {paragraphs.map((p) => (
            <Text key={p} style={t.body}>
              {p}
            </Text>
          ))}
        </View>
      ))}
      <Text style={t.caption}>Last updated {UPDATED}</Text>
    </ScrollView>
  );
}

const useStyles = makeStyles((c) => ({
  screen: { backgroundColor: c.background },
  page: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xl },
  section: { gap: spacing.sm },
}));
