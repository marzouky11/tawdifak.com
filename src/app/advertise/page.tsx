import type { Metadata } from 'next';
import {
  Megaphone,
  Clapperboard,
  Smartphone,
  LayoutPanelTop,
  MessageCircle,
  Instagram,
  Facebook,
  ShieldCheck,
} from 'lucide-react';
import { unstable_cache } from 'next/cache';
import { getAdminFirestoreSafe } from '@/lib/firebase-admin';
import { MobilePageHeader } from '@/components/layout/mobile-page-header';
import { DesktopPageHeader } from '@/components/layout/desktop-page-header';
import { getCachedGlobalStats } from '@/lib/data';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'أعلن معنا - توظيفك',
  description:
    'أعلن مع منصة توظيفك عبر ريلز احترافية، منشورات وستوري على صفحاتنا، أو بانر ومقال في الموقع، لجمهور مهتم بعروض العمل والمباريات وفرص الهجرة.',
  alternates: { canonical: '/advertise' },
};

// ─── Contact & social links (edit here only) ────────────────────────────────
// WhatsApp number in international format WITHOUT "+" or spaces, e.g. '2126XXXXXXXX'.
// While it is empty, the buttons send visitors to the contact page instead.
const WHATSAPP_NUMBER = '212764130114';
const WHATSAPP_MESSAGE = 'السلام عليكم، أريد الإعلان مع توظيفك. هل يمكنني معرفة تفاصيل العروض؟';

const SOCIAL_LINKS = [
  { name: 'إنستغرام', href: 'https://www.instagram.com/tawdifak_com', icon: Instagram },
  { name: 'فيسبوك', href: 'https://www.facebook.com/profile.php?id=61595971857986', icon: Facebook },
  { name: 'تيك توك', href: 'https://www.tiktok.com/@tawdifak', icon: TikTokIcon },
];
// ────────────────────────────────────────────────────────────────────────────

const OFFERS = [
  { icon: Clapperboard, title: 'ريل احترافي', description: 'فيديو قصير ينشر على إنستغرام وفيسبوك وتيك توك.' },
  { icon: Smartphone, title: 'منشور أو ستوري', description: 'إعلان مصمم بعناية على صفحاتنا.' },
  { icon: LayoutPanelTop, title: 'بانر أو مقال', description: 'مساحة إعلانية أو مقال تعريفي داخل الموقع.' },
];

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1-2.6-2.6 2.6 2.6 0 0 1 3.36-2.49V9.66a5.7 5.7 0 0 0-.76-.05 5.69 5.69 0 0 0-5.69 5.69A5.69 5.69 0 0 0 9.86 21a5.69 5.69 0 0 0 5.68-5.69V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.24-1.48z" />
    </svg>
  );
}

function ContactLink({ href, external, className }: { href: string; external: boolean; className: string }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-base font-semibold shadow-sm transition active:scale-95 ${className}`}
    >
      <MessageCircle className="h-5 w-5" />
      {external ? 'تواصل عبر واتساب' : 'تواصل معنا'}
    </a>
  );
}

// Real document counts (not the stats counters), computed on the server with
// Firestore count() and cached for 6 hours: visitors never trigger a database read.
// Falls back to the stats/general counters if the Admin SDK isn't configured.
const getAudienceCounts = unstable_cache(
  async () => {
    const db = getAdminFirestoreSafe();
    if (db) {
      const [workers, users] = await Promise.all([
        db.collection('workers').count().get(),
        db.collection('users').count().get(),
      ]);
      return { workers: workers.data().count, users: users.data().count };
    }
    const stats = await getCachedGlobalStats();
    return { workers: stats.workers, users: stats.users };
  },
  ['advertise-audience-counts'],
  { revalidate: 21600 }
);

function formatNumber(value: number) {
  return value.toLocaleString('en-US').replace(/,/g, '\u00A0');
}

export default async function AdvertisePage() {
  const counts = await getAudienceCounts().catch(() => null);
  const statItems =
    counts && counts.workers > 0 && counts.users > 0
      ? [
          { label: 'باحث عن عمل', value: counts.workers },
          { label: 'مستخدم مسجّل', value: counts.users },
        ]
      : [];

  const isWhatsApp = Boolean(WHATSAPP_NUMBER);
  const contactHref = isWhatsApp
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
    : '/contact';

  return (
    <>
      <MobilePageHeader title="أعلن معنا">
        <Megaphone className="h-5 w-5 text-primary" />
      </MobilePageHeader>
      <DesktopPageHeader
        icon={Megaphone}
        title="أعلن معنا"
        description="اعرض خدماتك وعروضك على موقع توظيفك وصفحاته على مواقع التواصل."
      />

      <div className="container mx-auto max-w-5xl px-4 pt-4 md:pt-2 pb-16 space-y-12 md:space-y-16">
        {/* Hero */}
        <section className="text-center space-y-5">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight">
            وصّل إعلانك إلى <span className="text-primary whitespace-nowrap">جمهور توظيفك</span>
          </h1>
          <p className="mx-auto max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed">
            جمهور يبحث يومياً عن عروض العمل والمباريات وفرص الهجرة.
          </p>
          <ContactLink
            href={contactHref}
            external={isWhatsApp}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          />
        </section>

        {/* Stats */}
        {statItems.length > 0 && (
          <section className="mx-auto grid max-w-xl grid-cols-2 divide-x divide-x-reverse rounded-2xl border bg-card">
            {statItems.map(item => (
              <div key={item.label} className="py-5 text-center">
                <div className="text-2xl md:text-4xl font-bold text-primary tabular-nums">{formatNumber(item.value)}</div>
                <div className="mt-1 text-xs md:text-sm text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </section>
        )}

        {/* Offers */}
        <section className="space-y-6">
          <h2 className="text-center text-2xl md:text-3xl font-bold">ماذا نقدم لك</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {OFFERS.map(offer => (
              <div
                key={offer.title}
                className="flex items-center gap-4 rounded-2xl border bg-card p-5 transition hover:border-primary/40 hover:shadow-md md:flex-col md:items-start md:p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <offer.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{offer.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{offer.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Social pages */}
        <section className="space-y-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">تابع صفحاتنا</h2>
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {SOCIAL_LINKS.map(social => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-sm font-medium transition hover:border-primary hover:text-primary md:px-6 md:py-3 md:text-base"
              >
                <social.icon className="h-5 w-5" />
                <span>{social.name}</span>
              </a>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="rounded-3xl bg-primary px-6 py-10 text-center text-primary-foreground md:py-14">
          <h2 className="text-2xl md:text-3xl font-bold">جاهز للإعلان معنا؟</h2>
          <p className="mx-auto mt-3 max-w-md opacity-90">أخبرنا بما تريد الإعلان عنه، وسنرسل لك العرض المناسب.</p>
          <ContactLink
            href={contactHref}
            external={isWhatsApp}
            className="mt-6 bg-white text-primary hover:bg-white/90"
          />
          <p className="mx-auto mt-6 flex max-w-md items-start justify-center gap-1.5 text-xs opacity-80">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            نراجع كل إعلان قبل نشره، ولا نقبل الإعلانات التي تطلب المال من الباحثين عن عمل.
          </p>
        </section>
      </div>
    </>
  );
}
