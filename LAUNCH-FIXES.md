# إصلاحات ما قبل الإطلاق (16-11-2026)

## ملفات تغيّرت في الكود
| الملف | التغيير |
|---|---|
| `src/app/{jobs,workers,competitions,immigration}/[id]/page.tsx` | إضافة `generateStaticParams` ← صفحة الإعلان تُخزَّن في CDN (ISR) بدل تشغيل السيرفر في كل زيارة |
| `src/app/{jobs,workers,competitions,immigration}/page.tsx` | لم تعد تقرأ `searchParams` في السيرفر ← الصفحات أصبحت ثابتة ومخزنة (حتى مع `?fbclid=`) |
| `src/app/{jobs,workers,competitions,immigration}/page-content.tsx` | البحث يمر عبر السيرفر (0 قراءة Firestore لكل بحث) + إصلاح تكرار النتائج عند "تحميل المزيد" في البحث |
| `src/lib/search-actions.ts` (جديد) | بحث على السيرفر فوق آخر 300 إعلان مخزّنة (تتجدد كل 30 دقيقة أو فور نشر إعلان) |
| `src/lib/data.ts` | خطأ Firestore لا يُخزَّن بعد الآن كـ"قائمة فارغة" لمدة ساعة؛ إصلاح تسجيل الأخطاء (كان يفشل بسبب حقول undefined) |
| `src/app/sitemaps/*.xml/route.ts` | خرائط الموقع مخزنة 12 ساعة بدل قراءة كل الوثائق في كل طلب |
| `src/context/auth-context.tsx` | إيقاف استدعاء `/api/session-logout` لكل زائر مجهول في كل صفحة، و`session-login` مرة كل 24 ساعة فقط |
| `src/app/jobs/[id]/report-ad-dialog.tsx`, `src/app/contact/contact-form.tsx` | حذف `revalidateAll()` (التبليغ/الرسالة لا يغيّران محتوى الموقع) |
| `src/lib/utils.ts` | دالة `mergeUniqueById` لمنع تكرار البطاقات |
| `package-lock.json` (جديد) | تثبيت نسخ المكتبات حتى لا تتغير تلقائياً مع كل نشر |

## يجب نشرها يدوياً في Firebase (لا تُنشر مع Vercel)
1. `firestore.rules` (انظر التحديث في الأسفل) ← Firebase Console › Firestore › Rules (أو `firebase deploy --only firestore:rules`)
   - `users` لم تعد مقروءة للعموم (كانت تكشف إيميلات وهواتف كل المستخدمين)
   - إعلان "باحث عن عمل" والرأي يُنشآن باسم صاحبهما فقط
   - التبليغات/الرسائل/سجل الأخطاء: حجم وحقول محدودة (ضد البوتات)
   - العدادات `stats/general`: ±1 فقط لعدّاد واحد
2. `firestore.indexes.json` ← فهرس جديد: `workers (userId ↑, createdAt ↓)` لصفحة "إعلاناتي"
   (`firebase deploy --only firestore:indexes`)

تأكد أن وثيقة `stats/general` موجودة وفيها الحقول الخمسة: `jobs, workers, competitions, immigration, users` (أرقام).

## حذف الفلاتر (لم تكن لها واجهة في الموقع)
- حُذف دعم فلاتر الدولة/المدينة/المجال/نوع العمل من `data.ts` و`search-actions.ts` وصفحتي `jobs` و`workers`.
- حُذف البحث القديم (200 قراءة لكل بحث من المتصفح) من `data.ts`؛ البحث الوحيد الآن هو بحث السيرفر.
- `firestore.indexes.json` لم يعد يحتوي إلا فهرس "إعلاناتي". عند `firebase deploy` سيسألك هل تحذف الفهارس القديمة من Firebase: أجب بنعم (أو اتركها، لا تضر).

## firestore.rules (تحديث)
الملف الآن = القواعد المنشورة حالياً في Firebase + تعديلين فقط:
- `workers`: الإنشاء باسم صاحب الحساب فقط، وصاحب الإعلان لا يستطيع نقل ملكيته لغيره.
- `reviews`: نفس الشيء للآراء.
