# MAMA FOOD — Phase 1 (Customer Side) Implementation Notes

## 1. What Exists
- **Architecture & Tech Stack**: React 18, Vite, Tailwind CSS 3 (RTL), React Router 6, Zustand, TanStack Query, Lucide icons.
- **Mock API Layer (`src/api`)**:
  - `menuApi.getUpcoming()`: Generates the next 7 days starting tomorrow with meals, addons, and cutoff times.
  - `ordersApi.create()`, `ordersApi.list()`, `ordersApi.get()`: Mock order storage and retrieval in `localStorage` (`mamafood:db:orders`).
  - Swappable backend contract with `USE_MOCK` toggle in `src/api/config.js`.
- **Customer Pages & Layout**:
  - `Home`: Hero banner, next-7-days picker, accordion meal list per selected day, sticky cart bar.
  - `Checkout`: Delivery data collection with Zod validation, order summary, cash-on-delivery notice, and WhatsApp direct ordering.
  - `OrderSuccess`: Order number, status badge, delivery and item summary, confetti animation, WhatsApp copy, and re-order CTA.
  - `NotFound`: 404 page for unmatched customer routes.
- **Core Components & Stores**:
  - `DayPicker`, `DayChip`, `DayAccordion`, `MealCard`, `AddonsSheet`, `QuantityStepper`, `CartDrawer`, `CartLine`, `OrderSummary`, `StickyCartBar`, `CountdownBadge`.
  - `useCartStore`: Persistent cart storage in `localStorage` (`mamafood:cart`), per-day per-meal configuration, undo history.
  - `useToastStore` & `Toaster`: Centralized toast notification system.
  - `useUIStore`: Shared UI store for customer drawer control.

---

## 2. What Was Fixed or Added

### Routing & Navigation
- **Fixed missing customer routes in [AppRoutes.jsx](file:///c:/Users/amgad/Downloads/mama-food/src/routes/AppRoutes.jsx)**:
  - Registered `/checkout` and `/order-success/:id` inside `<Route element={<CustomerLayout />}>` before the 404 catch-all route.
  - Resolved the bug where clicking "كمّل الطلب" showed "الصفحة مش موجودة".

### Cart Drawer & Navbar Integration
- **Created [useUIStore.js](file:///c:/Users/amgad/Downloads/mama-food/src/store/useUIStore.js)**: Centralized `cartDrawerOpen`, `openCartDrawer`, `closeCartDrawer` state.
- **Updated [Navbar.jsx](file:///c:/Users/amgad/Downloads/mama-food/src/components/layout/Navbar.jsx)**:
  - Added the cart button with live count badge (`min-w-[20px] h-5 rounded-full bg-brand-yellow text-ink`).
  - Strict brand adherence: white icon on red header, ink number on yellow badge.
  - Proper touch target (`h-11 w-11` = 44x44px).
- **Updated [CustomerLayout.jsx](file:///c:/Users/amgad/Downloads/mama-food/src/components/layout/CustomerLayout.jsx)**:
  - Ensured exactly **one** `<CartDrawer />` instance rendered across all customer routes.
- **Cleaned [Home.jsx](file:///c:/Users/amgad/Downloads/mama-food/src/pages/customer/Home.jsx)**:
  - Removed duplicate local cart drawer state and duplicated component instance.
  - Connected `StickyCartBar` directly to `openCartDrawer`.

### Pre-Checkout Warning Modal
- **Added Pre-Checkout validation in [CartDrawer.jsx](file:///c:/Users/amgad/Downloads/mama-food/src/components/customer/CartDrawer.jsx)**:
  - Detects if any day selected in `selectedDates` has 0 items in the cart.
  - Displays a warning modal: "أيام مختارة بدون وجبات" listing each empty day with a "شيل اليوم ده" button and a "كمّل بدونه" button.
  - Seamlessly transitions to `/checkout` once resolved.

### Toast Action & Real Undo
- **Updated [useToastStore.js](file:///c:/Users/amgad/Downloads/mama-food/src/store/useToastStore.js) & [Toaster.jsx](file:///c:/Users/amgad/Downloads/mama-food/src/components/common/Toaster.jsx)**:
  - Added support for toast actions (`{ action: { label, onClick }, ms }`).
  - Styled action button according to brand rules: `bg-ink text-brand-yellow` on yellow info toasts, high contrast.
- **Updated [useCartStore.js](file:///c:/Users/amgad/Downloads/mama-food/src/store/useCartStore.js)**:
  - `removeItem`: Triggers toast with action button `"تراجع"`.
  - `undoRemove`: Restores full cart line and re-adds the line's date to `selectedDates` if previously unselected.

### AddonsSheet Experience
- **Updated [AddonsSheet.jsx](file:///c:/Users/amgad/Downloads/mama-food/src/components/customer/AddonsSheet.jsx)**:
  - Subtitle now displays the day name and date: e.g. "للأحد ١١ أكتوبر".
  - Moved submit button into `BottomSheet`'s sticky `footer` prop with live price update ("أضف للسلة — N جنيه").
  - Fixed state reset using `useEffect` when meal or date changes.
  - Brand-compliant color tokens for "مجاني" and addon prices.

### Checkout & Order Success Flow
- **Updated [Checkout.jsx](file:///c:/Users/amgad/Downloads/mama-food/src/pages/customer/Checkout.jsx)**:
  - Form inputs watched so live values flow into the WhatsApp order message.
  - Fresh re-validation of days via `menuApi.getUpcoming()` right before order creation to prevent submitting closed days.
  - Secondary button labeled "ابعت الطلب على واتساب".
- **Updated [OrderSuccess.jsx](file:///c:/Users/amgad/Downloads/mama-food/src/pages/customer/OrderSuccess.jsx)**:
  - Displays brand `LogoIcon`.
  - Shows party popper icon, order number, status badge, delivery details, and order summary.
  - Integrated `whatsappUrl` and "ابعت الطلب على واتساب" button.
- **Standardized [whatsapp.js](file:///c:/Users/amgad/Downloads/mama-food/src/lib/whatsapp.js)**:
  - Pure `buildWhatsAppMessage` grouped by day.
  - Exports `whatsappUrl` using `WHATSAPP_NUMBER` with alias `buildWhatsAppUrl` for backwards compatibility.

### Responsive & Accessibility Polish
- **Touch Targets**: Updated [QuantityStepper.jsx](file:///c:/Users/amgad/Downloads/mama-food/src/components/customer/QuantityStepper.jsx) (`h-11 w-11`), [MealCard.jsx](file:///c:/Users/amgad/Downloads/mama-food/src/components/customer/MealCard.jsx) (`min-h-[44px]`), and Navbar buttons to meet 44x44px minimum touch target size.
- **Content Padding**: Added `pb-32 md:pb-28` to Home page sections when cart is non-empty to ensure `StickyCartBar` never covers content.
- **Logical Tailwind Classes**: Verified 100% logical directional utilities (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) across the entire project.

---

## 3. Assumptions
- **Egyptian Phone Regex**: Handled using `PHONE_REGEX` (`^01[0125][0-9]{8}$`) supporting all 4 Egyptian mobile networks (Vodafone 010, Orange 012, Etisalat 011, WE 015).
- **Default Cutoff Hour**: Cutoff set to 10:00 PM (22:00) on the preceding day, computed dynamically by mock API.
- **Cart Persistence**: Key `mamafood:cart` persists items, selectedDates, and saved customer contact info for convenience.

---

## 4. Responsive Test Matrix

| Viewport Width | Page / Component | Test Status | Notes |
|---|---|---|---|
| **320px** | Home (DayPicker + Accordion) | **PASS** | Horizontal scroll contained in DayPicker container; zero page overflow |
| **320px** | AddonsSheet | **PASS** | Sticky footer inside safe-area; internal scroll for options |
| **320px** | CartDrawer | **PASS** | Bottom sheet format, 90dvh max height, internal scroll |
| **320px** | /checkout | **PASS** | 1 column, collapsible summary above form, zero horizontal scroll |
| **360px** | Home & StickyCartBar | **PASS** | Safe-area padding, sticky bar doesn't overlap meals |
| **375px** | Full Order Flow | **PASS** | Day select -> Addons -> Cart -> Warning modal -> Checkout -> Success |
| **390px** | /order-success/:id | **PASS** | Confetti triggers once, WhatsApp button and order summary aligned |
| **768px** | Home (Meal Grid) | **PASS** | 2-column meal grid, DayPicker grid view |
| **768px** | CartDrawer | **PASS** | Converts smoothly to 400px side drawer |
| **1024px** | /checkout | **PASS** | 2 columns with sticky summary on the side |
| **1366px** | Home (Desktop) | **PASS** | 3-column meal grid, centered modals |
| **1920px** | All Pages | **PASS** | Max width constraints (max-w-6xl, max-w-5xl) prevent stretching |

---

---

## 6. Phase 2 — Admin Dashboard Setup & Authentication

### What Was Created & Updated:
1. **Admin Layout (`src/layouts/AdminLayout.jsx`, lazy-loaded from `src/routes/pages.js`)**:
   - Sidebar on desktop (`lg:block w-64`) with brand red background (`dark:bg-ink`).
   - Mobile header with Logo, title "لوحة التحكم", and hamburger button.
   - Mobile slide-in drawer (`w-72 shadow-pop animate-drawer-in`) with top-end close button.
   - Nav links with active styles (`bg-brand-yellow text-ink`):
     - المنيو الأسبوعي (`/admin/menu`)
     - الوجبات (`/admin/meals`)
     - الإضافات (`/admin/addons`)
     - الطلبات (`/admin/orders`)
     - الإعدادات (`/admin/settings`)
   - Logout button at the bottom: clears token and redirects to `/admin/login`.
   - Dark mode support: `dark:bg-ink dark:text-cream`.

2. **Admin Store (`src/store/useAdminStore.js`)**:
   - Zustand store persisting to `mamafood:admin`.
   - State: `adminToken`, `setToken(token)`, `clearToken()`.
   - Synced with `tokenStorage`.

3. **Protected Route Component (`src/components/ProtectedRoute.jsx` & `src/routes/ProtectedRoute.jsx`)**:
   - Redirects to `/admin/login` if `adminToken` is missing, remembering target location in state.
   - Renders protected routes (`<Outlet />` or `children`) when token exists.

4. **Admin Login Page (`src/pages/admin/Login.jsx`)**:
   - React Hook Form + Zod schema with Egyptian Arabic validation errors.
   - Calls `adminApi.login(email, password)`.
   - On success: updates `adminToken`, redirects to `/admin/menu`.
   - On error: triggers error toast.
   - Prominent demo warning text: `"هذه بيانات وهمية للتجربة فقط — استخدم: admin@mamafood.com / 123456"`.
   - Auto-redirects to `/admin/menu` if admin is already logged in.

5. **Admin Routing (`src/routes/AppRoutes.jsx`)**:
   - `/admin/login`: public login page.
   - `/admin`: redirects by default to `/admin/menu`.
   - All sub-routes (`menu`, `meals`, `addons`, `orders`, `settings`) wrapped in `ProtectedRoute`.
   - Added `src/pages/admin/Settings.jsx` placeholder page.

### Phase 2 Responsive Test Matrix:

| Viewport Width | Screen / Component | Test Status | Notes |
|---|---|---|---|
| **375px** | `/admin/login` | **PASS** | Centered form, font size 16px, touch targets $\ge 44\text{px}$, zero horizontal scroll |
| **375px** | `/admin/menu` (Header + Drawer) | **PASS** | Mobile header sticky, hamburger opens slide-in drawer, links close drawer on click |
| **768px** | `/admin/menu` & AdminLayout | **PASS** | Drawer format, content padding `p-6` to `p-8`, fluid responsive layout |
| **1280px / 1366px** | `/admin/menu` (Desktop) | **PASS** | Fixed sidebar `w-64`, content margin `lg:ms-64`, active pill styling |
| **Any** | Dark mode adaptation | **PASS** | Adapts to `dark:bg-ink dark:text-cream` with high brand contrast |

---

## 7. Phase 2.2 — Weekly Menu (`/admin/menu`)
- **Dashboard & Layout**: Built 7-column dashboard (Sat-Fri in RTL so Saturday is right-most). Each column displays day name, upcoming date, meal count badge, quick action buttons ("+ إضافة وجبة" and "نسخ اليوم"), and meal cards.
- **Add / Remove / Copy Logic**:
  - `AddMealModal`: Displays available meals from `mealsApi.list()` with live search. Adds meal to day and persists to `weeklyMenu`. Full-screen sheet on mobile, modal on desktop.
  - `CopyDayModal`: Dropdowns to select source and destination days with conflict warning and confirmation.
  - Remove Confirmation: Modal confirmation before dropping meal from a day with undoable/re-add options.
- **State & Storage**: Created `useAdminMenuStore.js` with `fetchData`, `addMealToDay`, `removeMealFromDay`, `copyDayToDay`, synced with `menuApi.updateWeeklyMenu` (`mamafood:db:weeklyMenu`).
- **Responsive at 375 / 768 / 1280**:
  - 375px: Internal horizontal scroll container with snap-like card width (`82vw`), zero horizontal page scroll.
  - 768px: Fluid 2-3 column preview with internal container scrolling.
  - 1280px: All 7 columns visible side-by-side (`xl:grid xl:grid-cols-7`).
  - Buttons touch targets $\ge 44\text{px}$. Safe-area padding on modals and headers.

---

## 8. Phase 2.3 — Meals Management (`/admin/meals`)
- **CRUD Operations**: Complete management for meals (`create`, `update`, `delete`, `isAvailable` toggle) with TanStack Query cache invalidation and mock localStorage persistence (`mamafood:db:meals`).
- **Form Component (`MealForm.jsx`)**:
  - React Hook Form + Zod validation with Arabic errors.
  - Category dropdown from `MEAL_CATEGORIES`.
  - Image handling: file upload converting to base64 Data URL via `FileReader`, 100x100px thumbnail preview with remove button, and >500KB size warning.
  - Addon Multi-Select: fetches all addons from `addonsApi.list()` and links addon IDs to the meal.
  - Available toggle switch (`isAvailable`).
  - Responsive: full-screen sheet on 375px mobile, centered modal on desktop.
- **List Views**:
  - 375px Mobile: responsive cards layout with 60x60px image thumbnail, quick available toggle, and touch targets $\ge 44\text{px}$.
  - 768px+ Tablet & Desktop: complete table layout with thumbnail, meal details, category badge, price, addons list, available toggle, and edit/delete actions.
  - Delete confirmation modal with danger action.
- **Responsive at 375 / 768 / 1280**: Tested with zero horizontal page scroll and inputs font size $\ge 16\text{px}$.



