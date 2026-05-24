import { useRef, useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

/**
 * /guide — In-app version of the customer guide.
 *
 * Mirrors the structure of the web /how-it-works page and the PDF user
 * guide so users get the same explanations without leaving the app.
 *
 * Layout:
 *   - Custom header with a Back button
 *   - "Jump to" pill row that scrolls the body to the chosen section
 *   - Long scrollable body with branded section dividers, callouts,
 *     comparison rows, and a closing back-cover-style card
 *
 * Why a native screen instead of a WebView: avoids a long initial blank
 * while keepswell.com loads, avoids auth/cookie complications, looks
 * native, and the content rarely changes so going through Metro is fine.
 */

const BRAND = {
  cream: '#F6F1EA',
  sand: '#DCCCB7',
  coral: '#D86F5C',
  coralDeep: '#c2604f',
  sage: '#7A8A74',
  slate: '#3C4858',
  charcoal: '#1F2328',
};

type SectionKey =
  | 'what'
  | 'how'
  | 'journals'
  | 'prompts'
  | 'entries'
  | 'participants'
  | 'memorybook'
  | 'app'
  | 'sms'
  | 'privacy'
  | 'sharing'
  | 'faq';

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'what', label: 'What it is' },
  { key: 'how', label: 'How it works' },
  { key: 'journals', label: 'Journals' },
  { key: 'prompts', label: 'Prompts' },
  { key: 'entries', label: 'Memories' },
  { key: 'participants', label: 'Contributors' },
  { key: 'memorybook', label: 'Memory Book' },
  { key: 'app', label: 'iOS app' },
  { key: 'sms', label: 'SMS' },
  { key: 'privacy', label: 'Privacy' },
  { key: 'sharing', label: 'Sharing' },
  { key: 'faq', label: 'FAQ' },
];

export default function GuideScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  // Map of section key → vertical Y position inside the ScrollView.
  // Populated as each section renders and reports its offset via onLayout.
  // We need the offsets to scroll to a section when the user taps a pill.
  const offsets = useRef<Record<string, number>>({});

  // Highlight the active pill as the user scrolls. Updated on scroll.
  const [active, setActive] = useState<SectionKey>('what');

  const trackSectionLayout = (key: SectionKey) => (e: LayoutChangeEvent) => {
    offsets.current[key] = e.nativeEvent.layout.y;
  };

  const scrollTo = (key: SectionKey) => {
    const y = offsets.current[key];
    if (typeof y === 'number') {
      // Small offset so the section title isn't kissed against the pill row.
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
    }
    setActive(key);
  };

  const handleScroll = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = e.nativeEvent.contentOffset.y + 80; // pill row height
    let current: SectionKey = 'what';
    for (const { key } of SECTIONS) {
      const sectionY = offsets.current[key];
      if (typeof sectionY === 'number' && sectionY <= y) current = key;
    }
    if (current !== active) setActive(current);
  };

  const openWeb = () => {
    Linking.openURL('https://keepswell.com/how-it-works').catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Back"
        >
          <FontAwesome name="chevron-left" size={18} color={BRAND.charcoal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How Keepswell works</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Section pills */}
      <View style={styles.pillsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          {SECTIONS.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.pill, active === s.key && styles.pillActive]}
              onPress={() => scrollTo(s.key)}
            >
              <Text style={[styles.pillText, active === s.key && styles.pillTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={64}
        onScroll={handleScroll}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.tagline}>Capture moments. Cherish life.</Text>
          <Text style={styles.heroTitle}>
            A complete guide to capturing what matters.
          </Text>
          <Text style={styles.heroSubtitle}>
            Keepswell is the gentle, private way to gather your family's
            stories, photos, and small everyday moments — and turn them
            into a memory book you'll treasure.
          </Text>
        </View>

        {/* ── What is Keepswell? ─────────────────────────────── */}
        <View onLayout={trackSectionLayout('what')}>
          <SectionTitle label="What is Keepswell?" />
          <P>
            Keepswell is a <B>memory-keeping app</B> that helps people gather
            the stories, photos, and small everyday moments that make up a
            life. Think of it as a private group journal you share with the
            people who matter most — without the noise of social media.
          </P>
          <P>
            You can use Keepswell on your own, or invite family and friends
            to contribute alongside you. Everyone responds when it suits
            them — by text message, in this app, or on the website — and
            their memories appear together in one beautifully organized
            <B> memory book</B>.
          </P>
          <Callout icon="lock" title="Our promise">
            Your journals are private. Your memories belong to you and the
            people you've invited. We don't sell your data, and we never
            will.
          </Callout>
        </View>

        {/* ── How it works ──────────────────────────────────── */}
        <View onLayout={trackSectionLayout('how')}>
          <SectionTitle label="How it works at a glance" />
          <P>
            The whole experience is built around three simple ideas: a
            <B> journal</B> to hold the memories, <B>prompts</B> that gently
            invite people to share, and a <B>memory book</B> that turns all
            of it into something beautiful to look back on.
          </P>
          <Step n={1} title="Create a journal">
            Pick a template (Family, Friends, Romantic, Vacation,
            Celebration, or Custom), give it a title, and choose how often
            you'd like prompts to arrive.
          </Step>
          <Step n={2} title="Invite the people you want to share with">
            Send invites by text or share a join link. Contributors don't
            need an app — they can respond by SMS if that's easier.
          </Step>
          <Step n={3} title="Memories arrive on their own schedule">
            A short prompt goes out on the cadence you choose. Anyone can
            respond with a story, a photo, or both — whenever they like.
          </Step>
          <Step n={4} title="Read, react, and remember">
            Open your memory book any time to read what's been shared,
            react to favorites, and watch your family story take shape.
          </Step>
        </View>

        {/* ── Journals & templates ──────────────────────────── */}
        <View onLayout={trackSectionLayout('journals')}>
          <SectionTitle label="Journals & templates" />
          <P>
            A <B>journal</B> is one collection of memories. Most people have
            a few — a family journal, a journal for each child, a vacation
            journal, a journal for a big upcoming milestone. Each one has
            its own prompts, contributors, and memory book.
          </P>
          <P>
            When you create a journal you start from a <B>template</B>.
            Templates set the tone, suggest prompts, and shape what the
            finished memory book looks like:
          </P>
          <Compare items={[
            ['👨‍👩‍👧 Family', 'Warm, multi-generational prompts about traditions, milestones, and everyday life.'],
            ['👯 Friends', "Playful, story-driven prompts perfect for a group you've been close to for years."],
            ['💕 Romantic', 'Intimate prompts for couples about shared moments, gratitude, and the small things.'],
            ['✈️ Vacation', "Short, in-the-moment prompts designed to be answered on the go, so a trip doesn't fade."],
            ['🎉 Celebration', 'Built for milestones — weddings, retirements, graduations.'],
            ['📔 Custom', 'Start blank and write all of your own prompts.'],
          ]} />
          <Callout icon="pencil" title="Templates are a starting point, not a cage">
            You can change templates, edit any prompt, or add your own
            custom prompts at any time.
          </Callout>
        </View>

        {/* ── Writing prompts ───────────────────────────────── */}
        <View onLayout={trackSectionLayout('prompts')}>
          <SectionTitle label="Writing prompts" />
          <P>
            Prompts are short questions or invitations — <I>"What's a small
            thing that made you smile this week?"</I> — designed to make it
            easy to write something honest in under a minute.
          </P>
          <P>
            When you create a journal, Keepswell auto-generates a queue of
            upcoming prompts from the template you picked. <B>You're in
            full control:</B>
          </P>
          <Compare items={[
            ['Preview', 'See the next several prompts that will be sent.'],
            ['Edit', 'Change the wording so it sounds more like you.'],
            ['Cancel', "Skip a prompt you don't want to send."],
            ['Add', 'Drop in a custom prompt that matters to your family.'],
            ['Pause', 'Turn prompts off entirely and write on your own schedule.'],
          ]} />
          <P>
            Prompts arrive on the cadence you choose — <B>daily, weekly,
            biweekly, or monthly</B> — at a time of your choosing, in your
            local timezone.
          </P>
        </View>

        {/* ── Memories ──────────────────────────────────────── */}
        <View onLayout={trackSectionLayout('entries')}>
          <SectionTitle label="Adding memories" />
          <P>
            A <B>memory</B> (or "entry") is one thing someone shares with
            the journal. It can be a written story, one or more photos, or
            both. There's no minimum, no formatting to fuss with, no word
            count. Anything you'd want to remember belongs.
          </P>
          <P>
            When you respond to a prompt, your memory is automatically
            attached to it. You can also add memories without a prompt
            anytime you have something you want to capture.
          </P>
          <P>
            Other people in the journal can <B>comment</B> and add{' '}
            <B>reactions</B> — small acknowledgments that say "I read this,
            I loved it" without turning the journal into another social
            feed.
          </P>
        </View>

        {/* ── Contributors ──────────────────────────────────── */}
        <View onLayout={trackSectionLayout('participants')}>
          <SectionTitle label="Inviting contributors" />
          <P>
            A journal is more meaningful when other people are in it with
            you. <B>Contributors</B> can read every memory in the journal,
            add their own, comment, and react.
          </P>
          <P>You can invite people three ways:</P>
          <Bullets items={[
            'By text message — they get a friendly invite they can respond to right from their phone.',
            'By join link or QR code — share a link that opens a simple sign-up form.',
            'From this app — invite people from a journal\'s settings.',
          ]} />
          <SubHeading>How each contributor receives prompts</SubHeading>
          <Compare items={[
            ['📱 SMS', "People who don't want to install an app. Prompts arrive as a regular text."],
            ['🔔 In-app', 'Contributors who use the Keepswell app. Prompts land in the Prompts tab.'],
            ['✨ Both', 'SMS first, also visible in the in-app feed.'],
          ]} />
          <Callout icon="users" title="Owner controls">
            Owners can approve, pause, or remove contributors at any time
            from the journal's settings.
          </Callout>
        </View>

        {/* ── Memory Book ───────────────────────────────────── */}
        <View onLayout={trackSectionLayout('memorybook')}>
          <SectionTitle label="The Memory Book" />
          <P>
            Everything you and your contributors share automatically flows
            into a <B>memory book</B> for each journal — a beautiful,
            readable view of every memory in chronological order, themed
            to match the journal type.
          </P>
          <Callout icon="book" title="Read it on a big screen">
            The memory book looks especially lovely on a laptop or TV
            browser — perfect for sharing around a dinner table.
          </Callout>
        </View>

        {/* ── Using the iOS app ─────────────────────────────── */}
        <View onLayout={trackSectionLayout('app')}>
          <SectionTitle label="Using this iOS app" />
          <SubHeading>Tabs</SubHeading>
          <Compare items={[
            ['📓 Journals', 'Every journal you own. Tap one to open it.'],
            ['💬 Prompts', 'Writing prompts waiting for you across all your journals.'],
            ['⚙️ Settings', 'Your profile, subscription, and account.'],
          ]} />
          <SubHeading>Capturing a memory</SubHeading>
          <P>
            From any journal tap <B>+</B> to add a memory. Type freely,
            attach photos from your camera roll, or take a new photo. Your
            memory goes live when you tap <B>Share</B>.
          </P>
          <SubHeading>Push notifications</SubHeading>
          <P>With your permission, we send a gentle push when:</P>
          <Bullets items={[
            'A contributor adds a new memory.',
            'Someone comments on or reacts to a memory.',
            'A new contributor joins a journal you own.',
            'A new writing prompt is ready for you.',
          ]} />
          <P>
            You can turn each of these on or off <B>per journal</B> in
            journal settings → Notifications.
          </P>
        </View>

        {/* ── SMS ───────────────────────────────────────────── */}
        <View onLayout={trackSectionLayout('sms')}>
          <SectionTitle label="Contributing by text (SMS)" />
          <P>
            Not everyone wants another app, and Keepswell honors that.
            Anyone you invite can fully participate using nothing but text
            messages.
          </P>
          <SubHeading>Helpful keywords</SubHeading>
          <Compare items={[
            ['YES', 'Confirm you want to participate.'],
            ['STOP', 'Stop receiving texts from Keepswell, anytime.'],
            ['HELP', 'Get a short help message and a link to support.'],
          ]} />
          <Callout icon="mobile" title="Why SMS matters">
            A grandparent who doesn't want to install anything new can
            still share the story of how they met your grandmother — by
            text — and it lands in your family memory book alongside
            everyone else's.
          </Callout>
        </View>

        {/* ── Privacy ───────────────────────────────────────── */}
        <View onLayout={trackSectionLayout('privacy')}>
          <SectionTitle label="Notifications & privacy" />
          <P>
            For each journal, you can independently turn notifications on
            or off for new memories, comments, reactions, and new
            contributors joining.
          </P>
          <SubHeading>What we do (and don't) with your data</SubHeading>
          <Compare items={[
            ['✅ We do', "Store your memories so the people you've invited can read them."],
            ['✅ We do', "Send the notifications you've opted into."],
            ['✅ We do', 'Back up your content in secure, replicated cloud storage.'],
            ["❌ We don't", 'Sell your data. Ever.'],
            ["❌ We don't", 'Share your phone number or email for marketing.'],
            ["❌ We don't", 'Make journals public unless you explicitly share them.'],
          ]} />
        </View>

        {/* ── Sharing ───────────────────────────────────────── */}
        <View onLayout={trackSectionLayout('sharing')}>
          <SectionTitle label="Sharing your memory book" />
          <Compare items={[
            ['🔗 Public link', 'Anyone with the link can view the memory book without signing in. Turn it off again any time.'],
            ['📱 Direct invite', "Contributors can view the book anytime through their phone, no account needed."],
            ['🖥️ Big screen', 'Open the memory book on a laptop or TV browser to share around a dinner table.'],
          ]} />
        </View>

        {/* ── FAQ ───────────────────────────────────────────── */}
        <View onLayout={trackSectionLayout('faq')}>
          <SectionTitle label="Frequently asked questions" />
          <Faq q="Do my contributors need to download anything?">
            No. Anyone can participate over SMS — they just need a phone
            number that receives text messages.
          </Faq>
          <Faq q="Is Keepswell free?">
            Yes — you can start a journal at no cost. Pro adds more
            journals, more contributors, and SMS prompts.
          </Faq>
          <Faq q="Can I have more than one journal?">
            Yes. Many people have a few — one for the family, one for each
            child, one for a specific trip or event.
          </Faq>
          <Faq q="What if a contributor doesn't want to be in the journal anymore?">
            They can reply STOP to a text to opt out, and the owner can
            remove anyone from the participants list at any time.
          </Faq>
          <Faq q="What happens if I delete a journal?">
            The journal and every memory, photo, and contributor record
            inside it is permanently removed. We can't recover a deleted
            journal.
          </Faq>
          <Faq q="Can I edit a memory after I share it?">
            The person who created a memory can hide or remove it. Owners
            can also hide any memory from the memory book.
          </Faq>
          <Faq q="Is my data backed up?">
            Yes. Memories and photos are stored in secure, replicated cloud
            storage. Your family stories should outlast any one device.
          </Faq>
        </View>

        {/* ── Back cover ────────────────────────────────────── */}
        <View style={styles.backCover}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkK}>k</Text>
          </View>
          <Text style={styles.backTagline}>Capture moments. Cherish life.</Text>
          <Text style={styles.backFooter}>
            © Keepswell. A product of PikeSquare, LLC.
          </Text>
          <TouchableOpacity onPress={openWeb} style={styles.webLinkBtn}>
            <FontAwesome name="external-link" size={12} color={BRAND.coral} />
            <Text style={styles.webLinkText}>Read this guide on keepswell.com</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Small layout helpers ──────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subHeading}>{children}</Text>;
}

function P({ children }: { children: React.ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

function B({ children }: { children: React.ReactNode }) {
  return <Text style={styles.bold}>{children}</Text>;
}

function I({ children }: { children: React.ReactNode }) {
  return <Text style={styles.italic}>{children}</Text>;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View style={styles.bullets}>
      {items.map((it, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>{it}</Text>
        </View>
      ))}
    </View>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <View style={styles.stepBody}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepText}>{children}</Text>
      </View>
    </View>
  );
}

function Compare({ items }: { items: Array<[string, string]> }) {
  return (
    <View style={styles.compareTable}>
      {items.map(([left, right], i) => (
        <View
          key={i}
          style={[
            styles.compareRow,
            i < items.length - 1 && styles.compareRowDivider,
          ]}
        >
          <Text style={styles.compareLeft}>{left}</Text>
          <Text style={styles.compareRight}>{right}</Text>
        </View>
      ))}
    </View>
  );
}

function Callout({
  icon,
  title,
  children,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.callout}>
      <View style={styles.calloutHeader}>
        <FontAwesome name={icon} size={14} color={BRAND.coral} />
        <Text style={styles.calloutTitle}>{title}</Text>
      </View>
      <Text style={styles.calloutBody}>{children}</Text>
    </View>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.faq}>
      <TouchableOpacity onPress={() => setOpen((v) => !v)} activeOpacity={0.7}>
        <View style={styles.faqRow}>
          <Text style={styles.faqQ}>{q}</Text>
          <Text style={styles.faqToggle}>{open ? '−' : '+'}</Text>
        </View>
      </TouchableOpacity>
      {open ? <Text style={styles.faqA}>{children}</Text> : null}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: BRAND.charcoal,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  pillsWrap: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  pillsRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: BRAND.cream,
    borderWidth: 1,
    borderColor: BRAND.sand,
  },
  pillActive: {
    backgroundColor: BRAND.coral,
    borderColor: BRAND.coral,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.slate,
  },
  pillTextActive: {
    color: '#fff',
  },
  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  hero: {
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  tagline: {
    fontSize: 12,
    color: BRAND.coral,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 26,
    color: BRAND.charcoal,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 12,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  heroSubtitle: {
    fontSize: 15,
    color: BRAND.slate,
    textAlign: 'center',
    lineHeight: 22,
  },

  sectionTitleWrap: {
    alignItems: 'center',
    marginTop: 36,
    marginBottom: 16,
  },
  sectionAccent: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: BRAND.coral,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 22,
    color: BRAND.charcoal,
    fontFamily: 'PlayfairDisplay_600SemiBold',
    textAlign: 'center',
  },
  subHeading: {
    fontSize: 16,
    color: BRAND.coral,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },

  paragraph: {
    fontSize: 15,
    color: BRAND.slate,
    lineHeight: 23,
    marginBottom: 12,
  },
  bold: {
    fontWeight: '700',
    color: BRAND.charcoal,
  },
  italic: {
    fontStyle: 'italic',
    color: BRAND.coralDeep,
  },

  bullets: {
    marginBottom: 12,
    marginTop: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND.sage,
    marginTop: 9,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: BRAND.slate,
    lineHeight: 22,
  },

  step: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  stepBody: { flex: 1 },
  stepTitle: {
    fontSize: 16,
    color: BRAND.charcoal,
    fontFamily: 'PlayfairDisplay_600SemiBold',
    marginBottom: 2,
  },
  stepText: {
    fontSize: 14,
    color: BRAND.slate,
    lineHeight: 20,
  },

  compareTable: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.sand,
    overflow: 'hidden',
    marginVertical: 8,
  },
  compareRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  compareRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0eae1',
  },
  compareLeft: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.charcoal,
  },
  compareRight: {
    flex: 2,
    fontSize: 14,
    color: BRAND.slate,
    lineHeight: 20,
  },

  callout: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: BRAND.coral,
    borderRadius: 8,
    padding: 14,
    marginVertical: 12,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  calloutTitle: {
    fontSize: 14,
    color: BRAND.charcoal,
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  calloutBody: {
    fontSize: 14,
    color: BRAND.slate,
    lineHeight: 20,
  },

  faq: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BRAND.sand,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQ: {
    flex: 1,
    fontSize: 14,
    color: BRAND.charcoal,
    fontFamily: 'PlayfairDisplay_600SemiBold',
    paddingRight: 12,
  },
  faqToggle: {
    fontSize: 20,
    color: BRAND.coral,
    fontWeight: '600',
  },
  faqA: {
    marginTop: 8,
    fontSize: 14,
    color: BRAND.slate,
    lineHeight: 20,
  },

  backCover: {
    alignItems: 'center',
    marginTop: 40,
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  brandMark: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: BRAND.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  brandMarkK: {
    fontSize: 28,
    color: BRAND.charcoal,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  backTagline: {
    fontSize: 18,
    color: BRAND.coral,
    fontFamily: 'PlayfairDisplay_400Regular_Italic',
    marginBottom: 6,
  },
  backFooter: {
    fontSize: 11,
    color: BRAND.slate,
    opacity: 0.7,
    marginBottom: 12,
    textAlign: 'center',
  },
  webLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  webLinkText: {
    fontSize: 13,
    color: BRAND.coral,
    fontWeight: '600',
  },
});
