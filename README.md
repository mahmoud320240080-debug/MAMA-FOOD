# MAMA FOOD — Frontend

React + Vite + Tailwind (RTL، Mobile-first). فرونت فقط، والبيانات حاليًا Mock على `localStorage`.

## التشغيل
```bash
npm install
cp .env.example .env
npm run dev
```
- الأدمن: `/admin/login` ← `admin@mamafood.com` / `admin123` (**تجريبي فقط**، الحماية الحقيقية على الباك).

## الفكرة
- الزبون يشوف **7 أيام تبدأ من بكره**، يختار الأيام، وبعدين وجبات وإضافات **كل يوم لوحده**.
- الأدمن بيعدّل **قالب أسبوعي ثابت** (وجبات كل يوم من الأحد للسبت) بيتكرر كل أسبوع.
- قفل الطلب لكل يوم: الساعة 10 م اليوم اللي قبله (قابل للتعديل من الإعدادات).

## الهيكل
```
src/
  api/          طبقة الـ API (كل الكومبوننتس بتكلمها هي بس). USE_MOCK في config.js
  components/   common (Button, Input, Modal, BottomSheet, ResponsiveTable...) + layout
  pages/        customer + admin
  routes/       AppRoutes + ProtectedRoute
  store/        Zustand (auth, toast)
  lib/          constants, dates, format
  assets/       اللوجو والأيقونة والباترن (شفافة وجاهزة)
```

## التحويل للباك الحقيقي
في `.env`: `VITE_USE_MOCK=false` و `VITE_API_URL=...`. كل ملف في `src/api` فيه الـ endpoint المقابل.
(`API_CONTRACT.md` الكامل في مرحلة التسليم.)

## الهوية
أحمر `#ED1C24` · أصفر `#FFDE17` · بني `#2B1B17` · كريمي `#FFFBEA`.
خطوط: Baloo Bhaijaan 2 (عناوين) + Cairo (نص). **ممنوع أصفر على أبيض/كريمي** (مش مقروء).
