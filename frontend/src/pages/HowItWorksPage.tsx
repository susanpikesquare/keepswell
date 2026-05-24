import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Heart,
  Image as ImageIcon,
  MessageSquare,
  Smartphone,
  Users,
  Sparkles,
  Calendar,
  Bell,
  Lock,
  Share2,
  Globe,
  CheckCircle,
} from 'lucide-react';
import { Button } from '../components/ui';

/**
 * /how-it-works — public, evergreen marketing + user-guide page.
 *
 * Visitors who land on the website can read end-to-end how Keepswell works
 * before signing up. Existing users can use the table of contents as a
 * jumping-off point when they're trying to find a specific feature.
 *
 * The page is intentionally long but scannable: an anchor TOC at the top,
 * lots of headings, short paragraphs, and a final CTA. Keep the tone warm
 * and lifestyle-y, not technical — this is sales surface as well as docs.
 */
export function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#F6F1EA] text-[#1F2328]">
      {/* ============================== HERO ============================== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#F6F1EA] via-[#F6F1EA] to-[#DCCCB7]/40" />
        <div className="container mx-auto px-6 py-20 lg:py-28 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-[#DCCCB7] text-[#3C4858] px-4 py-2 rounded-full text-sm font-medium mb-8">
            <BookOpen className="h-4 w-4 text-[#D86F5C]" />
            <span>How Keepswell works</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight text-[#1F2328] mb-6 tracking-tight">
            A complete guide to <em className="text-[#D86F5C] not-italic font-medium">capturing what matters</em>.
          </h1>
          <p className="text-lg md:text-xl text-[#3C4858] leading-relaxed max-w-2xl mx-auto">
            Keepswell is the gentle, private way to gather your family's
            stories, photos, and small everyday moments — and turn them into
            a memory book you'll treasure. Here's exactly how it works.
          </p>
        </div>
      </section>

      {/* ============================== TOC ============================== */}
      <section className="px-6 -mt-8 pb-8">
        <div className="container mx-auto max-w-3xl bg-white rounded-2xl shadow-sm border border-[#DCCCB7]/60 p-6 md:p-8">
          <h2 className="font-serif text-xl text-[#1F2328] mb-4">In this guide</h2>
          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-[#3C4858]">
            <li><a href="#what" className="hover:text-[#D86F5C] underline-offset-4 hover:underline">What is Keepswell?</a></li>
            <li><a href="#who" className="hover:text-[#D86F5C] underline-offset-4 hover:underline">Who it's for</a></li>
            <li><a href="#how" className="hover:text-[#D86F5C] underline-offset-4 hover:underline">How it works at a glance</a></li>
            <li><a href="#journals" className="hover:text-[#D86F5C] underline-offset-4 hover:underline">Journals &amp; templates</a></li>
            <li><a href="#prompts" className="hover:text-[#D86F5C] underline-offset-4 hover:underline">Writing prompts</a></li>
            <li><a href="#entries" className="hover:text-[#D86F5C] underline-offset-4 hover:underline">Adding memories</a></li>
            <li><a href="#participants" className="hover:text-[#D86F5C] underline-offset-4 hover:underline">Inviting contributors</a></li>
            <li><a href="#memorybook" className="hover:text-[#D86F5C] underline-offset-4 hover:underline">The Memory Book</a></li>
            <li><a href="#web" className="hover:text-[#D86F5C] underline-offset-4 hover:underline">Using the website</a></li>
            <li><a href="#ios" className="hover:text-[#D86F5C] underline-offset-4 hover:underline">Using the iOS app</a></li>
            <li><a href="#sms" className="hover:text-[#D86F5C] underline-offset-4 hover:underline">Contributing by text</a></li>
            <li><a href="#notifications" className="hover:text-[#D86F5C] underline-offset-4 hover:underline">Notifications &amp; privacy</a></li>
            <li><a href="#sharing" className="hover:text-[#D86F5C] underline-offset-4 hover:underline">Sharing your memory book</a></li>
            <li><a href="#faq" className="hover:text-[#D86F5C] underline-offset-4 hover:underline">FAQ</a></li>
          </ul>
        </div>
      </section>

      {/* ============================ WHAT IS IT ============================ */}
      <Section id="what" title="What is Keepswell?">
        <p>
          Keepswell is a memory-keeping app that helps people gather the
          stories, photos, and small everyday moments that make up a life,
          and quietly turn them into something you'll come back to for
          years. It's like a private group journal you share with the
          people who matter most — without the noise of social media.
        </p>
        <p>
          You can use Keepswell on its own, or invite family and friends to
          contribute alongside you. Everyone responds when it suits them —
          by text message, in the iOS app, or on the website — and their
          memories appear together in one beautifully organized memory
          book.
        </p>
        <Callout
          icon={<Heart className="h-5 w-5 text-[#D86F5C]" />}
          title="Capture moments. Cherish life."
        >
          We built Keepswell because so much of what matters gets lost in
          group chats, camera rolls, and folders no one ever opens again.
          Keepswell is the gentle place those moments can live, all
          together, and stay easy to find when you want them.
        </Callout>
      </Section>

      {/* ============================== WHO ============================== */}
      <Section id="who" title="Who it's for" alt>
        <p>
          Keepswell is for anyone who wants to slow down and remember.
          Some of the ways people are using it today:
        </p>
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <UseCase title="Families">
            Parents, kids, grandparents, aunts and uncles — invite everyone
            and watch a shared family story grow week by week.
          </UseCase>
          <UseCase title="New parents">
            Capture the first smile, the first steps, the funny things your
            kids say — all the stuff you swear you'll remember but won't.
          </UseCase>
          <UseCase title="Couples">
            Date nights, inside jokes, the trip you took on a whim. A
            private journal just for the two of you.
          </UseCase>
          <UseCase title="Travelers">
            One memory book per trip. Drop photos and notes as you go,
            print or share when you're home.
          </UseCase>
          <UseCase title="Milestones">
            Weddings, graduations, retirements, a year of recovery — invite
            everyone you love to share what they remember.
          </UseCase>
          <UseCase title="People remembering someone">
            Gather stories from everyone who knew them. A living tribute
            you can revisit, add to, and share.
          </UseCase>
        </div>
      </Section>

      {/* ============================== HOW IT WORKS ============================== */}
      <Section id="how" title="How it works at a glance">
        <p>
          The whole experience is built around three simple ideas: a
          <strong> journal</strong> to hold the memories, <strong>prompts</strong>{' '}
          that gently invite people to share, and a <strong>memory book</strong>{' '}
          that turns all of it into something beautiful to look back on.
        </p>
        <ol className="space-y-5 mt-6">
          <Step n={1} title="Create a journal">
            Pick a template (Family, Friends, Romantic, Vacation,
            Celebration, or Custom), give it a title, and decide how often
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
            Open your memory book anytime to read what's been shared,
            react to favorites, and watch your family story take shape.
          </Step>
        </ol>
      </Section>

      {/* ============================== JOURNALS ============================== */}
      <Section id="journals" title="Journals & templates" alt>
        <p>
          A <strong>journal</strong> is one collection of memories. Most
          people have a few — a family journal, a journal for each of
          their kids, a vacation journal, a journal for a big upcoming
          milestone. Each one has its own prompts, its own contributors,
          and its own memory book.
        </p>
        <p>
          When you create a journal you start from a <strong>template</strong>.
          Templates set the tone, suggest prompts, and shape what the
          finished memory book looks like:
        </p>
        <ul className="space-y-3 mt-4">
          <Bullet>
            <strong>Family</strong> — warm, multi-generational prompts about
            traditions, milestones, and everyday life.
          </Bullet>
          <Bullet>
            <strong>Friends</strong> — playful, story-driven prompts perfect for
            a group you've been close to for years.
          </Bullet>
          <Bullet>
            <strong>Romantic</strong> — intimate prompts for couples about
            shared moments, gratitude, and the small things.
          </Bullet>
          <Bullet>
            <strong>Vacation</strong> — short, in-the-moment prompts designed
            to be answered on the go, so a trip doesn't fade.
          </Bullet>
          <Bullet>
            <strong>Celebration</strong> — built for milestones like weddings,
            retirements, and graduations, with prompts that invite guests
            to share their favorite memories.
          </Bullet>
          <Bullet>
            <strong>Custom</strong> — start blank and write all of your own
            prompts. Best when you have a very specific use in mind.
          </Bullet>
        </ul>
        <p className="mt-6">
          You can change templates, edit any prompt, or add your own
          custom prompts at any time. Templates are a starting point, not
          a cage.
        </p>
      </Section>

      {/* ============================== PROMPTS ============================== */}
      <Section id="prompts" title="Writing prompts">
        <p>
          Prompts are the quiet engine of Keepswell. Each one is a short
          question or invitation — <em>"What's a small thing that made you
          smile this week?"</em> — designed to make it easy to write
          something honest in under a minute.
        </p>
        <p>
          When you create a journal, Keepswell automatically generates a
          queue of upcoming prompts from the template you picked. You're
          in full control of that queue:
        </p>
        <ul className="space-y-3 mt-4">
          <Bullet>
            <strong>Preview</strong> the next several prompts that will be sent
            and see exactly what's coming.
          </Bullet>
          <Bullet>
            <strong>Edit</strong> the wording on any upcoming prompt so it
            sounds more like you.
          </Bullet>
          <Bullet>
            <strong>Cancel</strong> a prompt you don't want to send.
          </Bullet>
          <Bullet>
            <strong>Add</strong> your own custom prompts that matter to your
            family or moment.
          </Bullet>
          <Bullet>
            <strong>Turn prompts off entirely</strong> if you'd rather use
            Keepswell as a journal you write in on your own schedule.
          </Bullet>
        </ul>
        <p className="mt-6">
          Prompts arrive on the cadence you choose — daily, weekly,
          biweekly, or monthly — at a time and day-of-week of your
          choosing, in your local timezone.
        </p>
      </Section>

      {/* ============================== ENTRIES ============================== */}
      <Section id="entries" title="Adding memories" alt>
        <p>
          A <strong>memory</strong> (or "entry") is one thing someone shares
          with the journal. It can be a written story, one or more photos,
          or both. There's no minimum, no formatting to fuss with, no
          word count to hit. Anything you'd want to remember belongs.
        </p>
        <p>
          When you respond to a prompt, your memory is automatically
          attached to it. You can also add memories without a prompt
          anytime you have something you want to capture.
        </p>
        <p className="mt-4">
          Other people in the journal can <strong>comment</strong> on memories
          and add <strong>reactions</strong> — small acknowledgments that say
          "I read this, I loved it" without turning the journal into
          another social feed.
        </p>
      </Section>

      {/* ============================== PARTICIPANTS ============================== */}
      <Section id="participants" title="Inviting contributors">
        <p>
          A journal is more meaningful when other people are in it with
          you. <strong>Contributors</strong> can read every memory in the
          journal, add their own, comment, and react. Each contributor
          gets their own profile in the journal so memories stay credited
          to whoever shared them.
        </p>
        <p>You can invite people three ways:</p>
        <ul className="space-y-3 mt-4">
          <Bullet>
            <strong>By text message</strong> — enter their phone number and
            they'll receive a friendly invite they can respond to right
            from their phone.
          </Bullet>
          <Bullet>
            <strong>By join link or QR code</strong> — share a link (or a code)
            that opens a simple sign-up form. Great for events.
          </Bullet>
          <Bullet>
            <strong>From the iOS app</strong> — invite people directly from a
            journal's settings screen.
          </Bullet>
        </ul>
        <p className="mt-6">
          You decide, for each contributor, how they receive prompts —
          by SMS, in the Keepswell app, or both. If a contributor only
          uses the app, prompts show up in the app's Prompts tab. If
          they don't use the app, prompts arrive as a simple text
          message. They don't have to download anything they don't want
          to.
        </p>
        <p>
          Owners can approve, pause, or remove contributors at any time
          from the journal's settings.
        </p>
      </Section>

      {/* ============================== MEMORY BOOK ============================== */}
      <Section id="memorybook" title="The Memory Book" alt>
        <p>
          Everything you and your contributors share automatically flows
          into a <strong>memory book</strong> for each journal — a beautiful,
          readable view of every memory in chronological order, themed to
          match the journal type. Family books feel warm; vacation books
          feel breezy; celebration books feel formal and timeless.
        </p>
        <p>
          The memory book is meant to be read. It's not a feed. You can
          open it any time on the web or in the iOS app and lose an hour
          flipping through what your family has shared.
        </p>
        <Callout
          icon={<Sparkles className="h-5 w-5 text-[#D86F5C]" />}
          title="It changes how you remember"
        >
          The most common thing people tell us: they didn't realize how
          much had happened until they sat down and read it all in one
          place.
        </Callout>
      </Section>

      {/* ============================== WEB APP ============================== */}
      <Section id="web" title="Using the website">
        <p>
          The Keepswell website at <a href="https://keepswell.com" className="text-[#D86F5C] underline-offset-4 hover:underline">keepswell.com</a>{' '}
          is the full experience — and the best place to manage journals,
          invite contributors, browse the memory book on a big screen,
          and adjust settings.
        </p>
        <Subsection title="Signing up">
          <p>
            Tap <strong>Get Started</strong> in the header. You can create an
            account with your email and a password, or sign in with Google.
            We'll ask you to agree to our Terms of Service and Privacy
            Policy when you sign up — that's all the legal we need.
          </p>
        </Subsection>
        <Subsection title="Your dashboard">
          <p>
            After signing in you land on your <strong>Dashboard</strong>, which
            shows every journal you've created. Tap one to open it; tap
            <strong> New Journal</strong> to start another.
          </p>
        </Subsection>
        <Subsection title="Creating a journal">
          <p>
            On <strong>Create Journal</strong> you'll:
          </p>
          <ul className="space-y-2 mt-3">
            <Bullet>Pick a template (Family, Friends, Romantic, Vacation, Celebration, or Custom).</Bullet>
            <Bullet>Give the journal a title and an optional description.</Bullet>
            <Bullet>Choose whether to include yourself as a contributor (and add your phone number if you'd like prompts by text).</Bullet>
            <Bullet>Decide whether to turn on auto-generated prompts. We recommend leaving this on — you can always edit them later.</Bullet>
          </ul>
        </Subsection>
        <Subsection title="The journal page">
          <p>
            Each journal has its own page where you can:
          </p>
          <ul className="space-y-2 mt-3">
            <Bullet>Browse every memory chronologically.</Bullet>
            <Bullet>Add a new memory yourself.</Bullet>
            <Bullet>See and manage contributors.</Bullet>
            <Bullet>Open the full Memory Book view.</Bullet>
            <Bullet>Open settings to edit prompts, schedule, cover image, sharing, and notifications.</Bullet>
          </ul>
        </Subsection>
        <Subsection title="Settings you can adjust">
          <ul className="space-y-2">
            <Bullet><strong>Cover image</strong> — pick from our curated set, paste an image URL, or upload your own.</Bullet>
            <Bullet><strong>Schedule</strong> — frequency, day of week, time, and timezone for prompts.</Bullet>
            <Bullet><strong>Upcoming prompts</strong> — preview, edit, cancel, or add custom prompts to the queue.</Bullet>
            <Bullet><strong>Prompt library</strong> — reorder the pool of prompts the journal can pull from over time.</Bullet>
            <Bullet><strong>Notifications</strong> — choose which events (new memories, comments, reactions, joins) you want to be notified about.</Bullet>
            <Bullet><strong>Sharing</strong> — generate a public link so people can view the memory book without signing in.</Bullet>
          </ul>
        </Subsection>
      </Section>

      {/* ============================== iOS APP ============================== */}
      <Section id="ios" title="Using the iOS app" alt>
        <p>
          The Keepswell iOS app gives you the same journals and memories,
          designed for capturing things on the go. It's a great fit for
          quick photos and short voice-of-the-moment entries.
        </p>
        <Subsection title="Getting the app">
          <p>
            Search for <strong>Keepswell</strong> on the App Store and download
            it. Sign in with the same account you use on the website —
            your journals, contributors, and memories all sync.
          </p>
        </Subsection>
        <Subsection title="Tabs">
          <p>The app has three tabs at the bottom:</p>
          <ul className="space-y-2 mt-3">
            <Bullet><strong>Journals</strong> — every journal you own. Tap one to open it.</Bullet>
            <Bullet><strong>Prompts</strong> — writing prompts waiting for you across all your journals. Tap <em>Respond</em> on one to compose a memory; tap <em>Dismiss</em> to clear it.</Bullet>
            <Bullet><strong>Settings</strong> — your profile, subscription, and account.</Bullet>
          </ul>
        </Subsection>
        <Subsection title="Capturing a memory">
          <p>
            From any journal tap <strong>+</strong> to add a memory. You can
            type freely, attach photos from your camera roll, or take a
            new photo right from the app. There's no save button — your
            memory goes live when you tap <strong>Share</strong>.
          </p>
        </Subsection>
        <Subsection title="Push notifications">
          <p>
            With your permission, the app sends a gentle push when:
          </p>
          <ul className="space-y-2 mt-3">
            <Bullet>A contributor adds a new memory.</Bullet>
            <Bullet>Someone comments on or reacts to a memory in your journal.</Bullet>
            <Bullet>A new contributor joins a journal you own.</Bullet>
            <Bullet>A new writing prompt is ready for you.</Bullet>
          </ul>
          <p className="mt-3">
            You can turn each of these on or off per journal in journal
            settings → Notifications.
          </p>
        </Subsection>
        <Subsection title="The Memory Book on iOS">
          <p>
            Each journal has its own beautifully themed memory book view
            inside the app — perfect for handing your phone to a relative
            and saying <em>"look at all this."</em>
          </p>
        </Subsection>
      </Section>

      {/* ============================== SMS ============================== */}
      <Section id="sms" title="Contributing by text (SMS)">
        <p>
          Not everyone wants another app on their phone, and Keepswell
          honors that. Anyone you invite can fully participate in a
          journal using nothing but text messages.
        </p>
        <Subsection title="How invites work">
          <p>
            When you invite someone by phone number, they get a friendly
            text from Keepswell letting them know who invited them and
            which journal they've been added to. To opt in they reply
            <strong> YES</strong>. To opt out at any time they reply
            <strong> STOP</strong>.
          </p>
        </Subsection>
        <Subsection title="Receiving prompts by text">
          <p>
            When a prompt is scheduled, contributors who chose SMS get the
            prompt as a regular text message. They can reply with text, a
            photo, or both, and their reply automatically becomes a memory
            attached to that prompt.
          </p>
        </Subsection>
        <Subsection title="Helpful keywords">
          <p>Reply to a Keepswell text with any of these any time:</p>
          <ul className="space-y-2 mt-3">
            <Bullet><strong>YES</strong> — confirm you want to participate.</Bullet>
            <Bullet><strong>STOP</strong> — stop receiving texts from Keepswell.</Bullet>
            <Bullet><strong>HELP</strong> — get help and a link to support.</Bullet>
          </ul>
          <p className="mt-3 text-sm text-[#3C4858]/80">
            Message and data rates may apply. Message frequency varies
            based on the journal's schedule. Your mobile information is
            never sold or shared with third parties for promotional
            purposes. See our <Link to="/sms-consent" className="underline">SMS terms</Link>.
          </p>
        </Subsection>
        <Subsection title="Why SMS matters">
          <p>
            The SMS option is what makes Keepswell different from "another
            app to download." A grandparent who doesn't want to install
            anything new can still share the story of how they met your
            grandmother — by text — and it lands in your family memory
            book alongside everyone else's.
          </p>
        </Subsection>
      </Section>

      {/* ============================== NOTIFICATIONS / PRIVACY ============================== */}
      <Section id="notifications" title="Notifications & privacy" alt>
        <Subsection title="You're in control of notifications">
          <p>
            For each journal, you can independently turn on or off
            notifications for new memories, comments, reactions, and new
            contributors. Open the journal's settings and find the
            <strong> Notifications</strong> section.
          </p>
        </Subsection>
        <Subsection title="Your journals are private by default">
          <p>
            Only you and the contributors you invite can see what's
            inside a journal. We never make a journal public unless you
            explicitly turn on sharing.
          </p>
        </Subsection>
        <Subsection title="What we do (and don't) do with your data">
          <ul className="space-y-2">
            <Bullet>We store your memories so you and the people you've invited can read them. That's the whole reason Keepswell exists.</Bullet>
            <Bullet>We don't sell your data, ever.</Bullet>
            <Bullet>We don't share your phone number or email with third parties for marketing.</Bullet>
            <Bullet>You can delete a journal at any time and we permanently remove the memories in it.</Bullet>
          </ul>
          <p className="mt-3">
            For the full details, read our{' '}
            <Link to="/privacy" className="text-[#D86F5C] underline-offset-4 hover:underline">Privacy Policy</Link>.
          </p>
        </Subsection>
      </Section>

      {/* ============================== SHARING ============================== */}
      <Section id="sharing" title="Sharing your memory book">
        <p>
          When you want to share what your journal has become — say, at
          the end of a year, or for a celebration — Keepswell makes it
          simple.
        </p>
        <ul className="space-y-3 mt-4">
          <Bullet>
            <strong>Public share link</strong> — generate a link that anyone
            with the link can use to view the memory book without signing
            in. Turn it off again any time.
          </Bullet>
          <Bullet>
            <strong>Direct invite by phone</strong> — anyone you've added as a
            contributor can view the book anytime through their phone, no
            account needed.
          </Bullet>
          <Bullet>
            <strong>Read together on a big screen</strong> — open the memory
            book on a laptop or TV browser to share around a dinner table.
          </Bullet>
        </ul>
      </Section>

      {/* ============================== FAQ ============================== */}
      <Section id="faq" title="Frequently asked questions" alt>
        <FAQ q="Do my contributors need to download anything?">
          No. Anyone can participate over SMS — they just need a phone
          number that receives text messages. The iOS app is a nice
          option for people who want one, but it's never required.
        </FAQ>
        <FAQ q="Is Keepswell free?">
          Yes — you can start a journal and begin capturing memories at
          no cost. We offer a Pro plan with extra features like more
          journals, more contributors, and SMS prompts. See{' '}
          <Link to="/pricing" className="text-[#D86F5C] underline-offset-4 hover:underline">pricing</Link>{' '}
          for the current details.
        </FAQ>
        <FAQ q="Can I have more than one journal?">
          Yes. Many people have a few — one for the family, one for each
          child, one for a specific trip or event. Each one is
          independent with its own prompts and contributors.
        </FAQ>
        <FAQ q="What if a contributor doesn't want to be in the journal anymore?">
          They can reply STOP to a text to opt out, and the journal owner
          can remove anyone from the participants list at any time. No
          drama, no awkwardness.
        </FAQ>
        <FAQ q="Can I print my memory book?">
          We're working on print export. Today you can read the full
          memory book on the website or in the iOS app, and share the
          public link with anyone you want to see it.
        </FAQ>
        <FAQ q="What happens if I delete a journal?">
          The journal and every memory, photo, and contributor record
          inside it is permanently removed. We can't recover a deleted
          journal — so we ask you to type the journal's name to confirm
          before deleting.
        </FAQ>
        <FAQ q="Can I edit a memory after I share it?">
          The person who created a memory can hide or remove it. Owners
          can also hide any memory from the memory book.
        </FAQ>
        <FAQ q="Is my data backed up?">
          Yes. Memories and photos are stored in secure, replicated cloud
          storage. We take backups seriously — your family stories should
          outlast any one app or device.
        </FAQ>
        <FAQ q="What if I have a question or feedback?">
          Email us at{' '}
          <a href="mailto:susan@pikesquare.co" className="text-[#D86F5C] underline-offset-4 hover:underline">susan@pikesquare.co</a>{' '}
          or use the{' '}
          <Link to="/support" className="text-[#D86F5C] underline-offset-4 hover:underline">support form</Link>.
          A real person reads everything.
        </FAQ>
      </Section>

      {/* ============================== FINAL CTA ============================== */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#DCCCB7]/40 via-[#F6F1EA] to-[#F6F1EA]" />
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl md:text-4xl mb-4 text-[#1F2328]">
            Start a journal today.
          </h2>
          <p className="text-[#3C4858] text-lg mb-8">
            Free to begin. No app required for the people you invite.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/sign-up">
              <Button
                size="lg"
                className="text-base px-8 py-6 rounded-full bg-[#D86F5C] text-[#F6F1EA] hover:bg-[#c2604f] shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
              >
                Start your journal
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 py-6 rounded-full border-[#DCCCB7] bg-transparent text-[#3C4858] hover:bg-white/60 w-full sm:w-auto"
              >
                See pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================== Small layout helpers ==============================

function Section({
  id,
  title,
  alt,
  children,
}: {
  id: string;
  title: string;
  alt?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`py-20 px-6 ${alt ? 'bg-white' : ''} scroll-mt-24`}>
      <div className="container mx-auto max-w-3xl">
        <h2 className="font-serif text-3xl md:text-4xl text-[#1F2328] mb-6">
          {title}
        </h2>
        <div className="space-y-4 text-[#3C4858] text-base md:text-lg leading-relaxed">
          {children}
        </div>
      </div>
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h3 className="font-serif text-xl md:text-2xl text-[#1F2328] mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle className="h-5 w-5 text-[#7A8A74] flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-5">
      <span
        aria-hidden
        className="flex-shrink-0 w-10 h-10 rounded-full bg-[#D86F5C] text-[#F6F1EA] font-serif text-lg flex items-center justify-center"
      >
        {n}
      </span>
      <div>
        <h3 className="font-serif text-xl text-[#1F2328] mb-1">{title}</h3>
        <p className="text-[#3C4858] leading-relaxed">{children}</p>
      </div>
    </li>
  );
}

function UseCase({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#DCCCB7]/60 rounded-2xl p-5">
      <h3 className="font-serif text-lg text-[#1F2328] mb-2">{title}</h3>
      <p className="text-[#3C4858] text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function Callout({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="my-6 rounded-2xl border border-[#DCCCB7] bg-[#F6F1EA] p-6">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h3 className="font-serif text-lg text-[#1F2328]">{title}</h3>
      </div>
      <p className="text-[#3C4858] leading-relaxed">{children}</p>
    </div>
  );
}

function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group border border-[#DCCCB7]/60 rounded-2xl bg-white p-5 mb-3 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
        <span className="font-serif text-lg text-[#1F2328]">{q}</span>
        <span aria-hidden className="text-[#D86F5C] text-2xl leading-none group-open:rotate-45 transition-transform">+</span>
      </summary>
      <div className="mt-3 text-[#3C4858] leading-relaxed text-base">{children}</div>
    </details>
  );
}

// Silence "imported but unused" lint warnings for icons we kept handy
// for future iterations of this page.
void Globe;
void ImageIcon;
void MessageSquare;
void Smartphone;
void Users;
void Calendar;
void Bell;
void Lock;
void Share2;
