import type { Metadata } from 'next';
import {
  Megaphone,
  Clapperboard,
  Smartphone,
  LayoutPanelTop,
  Target,
  Users,
  ShieldCheck,
  BadgeCheck,
  MessageCircle,
  Instagram,
  Facebook,
  XCircle,
} from 'lucide-react';
import { MobilePageHeader } from '@/components/layout/mobile-page-header';
import { DesktopPageHeader } from '@/components/layout/desktop-page-header';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getCachedGlobalStats } from '@/lib/data';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'أعلن معنا - وصّل إعلانك لجمهور توظيفك',
  description:
    'أعلن مع منصة توظيفك: ريلز احترافية، منشورات وستوري على صفحاتنا، وبانرات ومقالات تعريفية في الموقع، لجمهور مهتم بالشغل والمباريات وفرص الهجرة القانونية.',
  alternates: { canonical: '/advertise' },
};

// ─── Contact & social links (edit here only) ────────────────────────────────
// Put the WhatsApp number in international format WITHOUT "+" or spaces,
// e.g. '2126XXXXXXXX'. While it is empty the WhatsApp button is hidden and
// visitors are sent to the contact page instead.
const WHATSAPP_NUMBER = '';
const WHATSAPP_MESSAGE = 'السلام عليكم، بغيت نعلن مع توظيفك. ممكن تفاصيل العروض؟';

const SOCIAL_LINKS = [
  {
    name: 'إنستغرام',
    handle: '@tawdifak_com',
    href: 'https://www.instagram.com/tawdifak_com',
    icon: Instagram,
    className: 'bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white',
  },
  {
    name: 'فيسبوك',
    handle: 'توظيفك | Tawdifak',
    href: 'https://www.facebook.com/profile.php?id=61595971857986',
    icon: Facebook,
    className: 'bg-[#1877F2] text-white',
  },
  {
    name: 'تيك توك',
    handle: '@tawdifak',
    href: 'https://www.tiktok.com/@tawdifak',
    icon: TikTokIcon,
    className: 'bg-black text-white',
  },
];
// ────────────────────────────────────────────────────────────────────────────

const OFFERS = [
  {
    icon: Clapperboard,
    title: 'ريل احترافي على صفحاتنا',
    description:
      'فيديو قصير بأسلوب توظيفك المميز يعرّف بشركتك أو عرضك، يُنشر على إنستغرام وفيسبوك وتيك توك.',
  },
  {
    icon: Smartphone,
    title: 'منشور أو ستوري',
    description:
      'منشور أو ستوري مصمم بعناية على صفحاتنا للإعلان عن توظيف، تكوين، أو خدمة تهم جمهورنا.',
  },
  {
    icon: LayoutPanelTop,
    title: 'بانر أو مقال في الموقع',
    description:
      'مساحة إعلانية داخل موقع tawdifak.com، أو مقال تعريفي بمؤسستك يبقى منشوراً ويظهر في محركات البحث.',
  },
];

const REASONS = [
  {
    icon: Target,
    title: 'جمهور مستهدف',
    description: 'زوارنا يبحثون فعلاً عن الشغل، المباريات العمومية وفرص الهجرة القانونية.',
  },
  {
    icon: Users,
    title: 'حضور على عدة منصات',
    description: 'إعلانك يصل عبر الموقع وصفحاتنا على إنستغرام وفيسبوك وتيك توك.',
  },
  {
    icon: BadgeCheck,
    title: 'محتوى احترافي',
    description: 'نصمم الإعلان بأسلوب واضح وجذاب يناسب جمهورنا المغربي.',
  },
  {
    icon: ShieldCheck,
    title: 'منصة موثوقة',
    description: 'نراجع كل إعلان قبل نشره، مما يمنح إعلانك مصداقية أكبر.',
  },
];

const AUDIENCE = ['الشركات والمقاولات', 'مكاتب التوظيف المرخّصة', 'مراكز ومعاهد التكوين', 'المدارس الخاصة', 'الخدمات المهنية'];

const NOT_ACCEPTED = [
  'إعلانات تطلب من الباحث عن عمل دفع المال مقابل الوظيفة',
  'عروض هجرة غير قانونية أو غير موثقة',
  'إعلانات مضللة أو لا يمكن التحقق منها',
];

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1-2.6-2.6 2.6 2.6 0 0 1 3.36-2.49V9.66a5.7 5.7 0 0 0-.76-.05 5.69 5.69 0 0 0-5.69 5.69A5.69 5.69 0 0 0 9.86 21a5.69 5.69 0 0 0 5.68-5.69V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.24-1.48z" />
    </svg>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl md:text-2xl font-bold text-green-600 mb-4">{children}</h2>;
}

export default async function AdvertisePage() {
  const stats = await getCachedGlobalStats().catch(() => null);
  const totalPosts = stats ? stats.jobs + stats.competitions + stats.immigration + stats.workers : 0;
  // Figures are only shown once they are meaningful, so the page never advertises tiny numbers.
  const showStats = totalPosts >= 100;

  const whatsappHref = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
    : null;

  return (
    <>
      <MobilePageHeader title="أعلن معنا">
        <Megaphone className="h-5 w-5 text-primary" />
      </MobilePageHeader>
      <DesktopPageHeader
        icon={Megaphone}
        title="أعلن معنا"
        description="وصّل إعلانك لآلاف الباحثين عن عمل والمهتمين بالمباريات وفرص الهجرة في المغرب."
      />

      <div className="container mx-auto max-w-5xl px-4 pb-12 space-y-6 md:space-y-8">
        {/* Intro */}
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2 text-red-600 md:text-3xl">
              <Megaphone className="h-6 w-6" />
              أعلن مع توظيفك
            </h1>
          </CardHeader>
          <CardContent className="pt-0 md:pt-2 space-y-4">
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
              توظيفك منصة مغربية متخصصة في عروض الشغل، المباريات العمومية وفرص الهجرة القانونية. إذا كانت
              لديك شركة أو مركز تكوين أو خدمة تهم الباحثين عن عمل، نساعدك على الوصول إلى جمهور مهتم فعلاً بما تقدمه.
            </p>

            {showStats && stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                {[
                  { label: 'إعلان منشور', value: totalPosts },
                  { label: 'عرض شغل', value: stats.jobs },
                  { label: 'مباراة عمومية', value: stats.competitions },
                  { label: 'مستخدم مسجّل', value: stats.users },
                ]
                  .filter(item => item.value > 0)
                  .map(item => (
                    <div key={item.label} className="rounded-xl border bg-primary/5 p-4 text-center">
                      <div className="text-2xl md:text-3xl font-bold text-primary">
                        {item.value.toLocaleString('fr-MA')}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{item.label}</div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Offers */}
        <section>
          <SectionTitle>ماذا نقدم لك</SectionTitle>
          <div className="grid gap-4 md:grid-cols-3">
            {OFFERS.map(offer => (
              <Card key={offer.title} className="h-full">
                <CardContent className="p-5 md:p-6 flex flex-col gap-3 h-full">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <offer.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">{offer.title}</h3>
                  <p className="text-sm md:text-base leading-relaxed text-muted-foreground">{offer.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Why us */}
        <section>
          <SectionTitle>لماذا تعلن معنا</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            {REASONS.map(reason => (
              <Card key={reason.title}>
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-600/10 text-green-600">
                    <reason.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">{reason.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{reason.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Social pages */}
        <section>
          <SectionTitle>صفحاتنا على مواقع التواصل</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            {SOCIAL_LINKS.map(social => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 rounded-xl p-4 shadow-sm transition-transform hover:scale-[1.02] active:scale-95 ${social.className}`}
              >
                <social.icon className="h-7 w-7 shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold">{social.name}</div>
                  <div className="text-sm opacity-90 truncate" dir="auto">
                    {social.handle}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Audience + rules */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-5 md:p-6">
              <SectionTitle>من يمكنه الإعلان معنا</SectionTitle>
              <ul className="space-y-2">
                {AUDIENCE.map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <BadgeCheck className="h-5 w-5 shrink-0 text-green-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 md:p-6">
              <SectionTitle>إعلانات لا نقبلها</SectionTitle>
              <ul className="space-y-2">
                {NOT_ACCEPTED.map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <XCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground mt-4">كل إعلان تتم مراجعته قبل النشر.</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6 md:p-8 text-center space-y-4">
            <h2 className="text-xl md:text-2xl font-bold">هل تريد الإعلان معنا؟</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              تواصل معنا وأخبرنا بما تريد الإعلان عنه، وسنرسل لك العرض المناسب وسعره.
            </p>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-[#25D366] px-8 py-3 text-lg font-bold text-white shadow-sm transition-transform hover:bg-[#25D366]/90 active:scale-95"
              >
                <MessageCircle className="h-6 w-6" />
                تواصل معنا عبر واتساب
              </a>
            ) : (
              <a
                href="/contact"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-lg font-bold text-primary-foreground shadow-sm transition-transform hover:bg-primary/90 active:scale-95"
              >
                <MessageCircle className="h-6 w-6" />
                تواصل معنا
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
