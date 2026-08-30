\---



\### File 2: `design.md`



```markdown

\# Design System \& UI Guidelines



\## 1. Aesthetic Direction

\- \*\*Style:\*\* Clean, High-End Minimalist Apparel E-Commerce (inspired by Uniqlo and Zara).

\- \*\*Core Philosophy:\*\* Content-first. UI elements must not distract from product photography.

\- \*\*Rule:\*\* Strictly no neon gradients, no bubbly floating shapes, and no bloated AI templates.



\---



\## 2. Color Palette (Tailwind CSS Tokens)

\- \*\*Background:\*\*

&#x20; - Page Main: `bg-white` (`#FFFFFF`) / Secondary: `bg-zinc-50` (`#FAFAFA`)

&#x20; - Admin/Staff Canvas: `bg-zinc-100` (`#F4F4F5`)

\- \*\*Typography \& Foreground:\*\*

&#x20; - Primary Text: `text-zinc-900` (`#18181B`)

&#x20; - Secondary/Muted: `text-zinc-500` (`#71717A`)

\- \*\*Borders \& Dividers:\*\*

&#x20; - Default Border: `border-zinc-200` (`#E4E4E7`)

&#x20; - Subtle Divider: `border-zinc-100` (`#F4F4F5`)

\- \*\*Interactive Elements:\*\*

&#x20; - Primary Buttons: `bg-zinc-900 text-white hover:bg-zinc-800`

&#x20; - Secondary Buttons: `bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border border-zinc-200`

&#x20; - Destructive: `bg-red-600 text-white hover:bg-red-700`

\- \*\*Status Badges:\*\*

&#x20; - Pending: `bg-amber-100 text-amber-800 border-amber-200`

&#x20; - Paid / Processing: `bg-blue-100 text-blue-800 border-blue-200`

&#x20; - Shipped: `bg-purple-100 text-purple-800 border-purple-200`

&#x20; - Completed: `bg-emerald-100 text-emerald-800 border-emerald-200`

&#x20; - Cancelled: `bg-rose-100 text-rose-800 border-rose-200`



\---



\## 3. Typography Hierarchy

\- \*\*Font Family:\*\* `Geist Sans` or `Inter` (sans-serif).

\- \*\*Product Headings:\*\* `text-xl md:text-2xl font-bold tracking-tight text-zinc-900`

\- \*\*Pricing:\*\* `text-lg font-semibold tabular-nums text-zinc-900`

\- \*\*Labels / Badges:\*\* `text-xs font-medium uppercase tracking-wider`

\- \*\*Body / Descriptions:\*\* `text-sm text-zinc-600 leading-relaxed`



\---



\## 4. Component Standards



\### 4.1 Product Card

\- \*\*Image Container:\*\* `aspect-\[3/4] relative overflow-hidden bg-zinc-100 rounded-lg`

\- \*\*Image Fit:\*\* `object-cover w-full h-full transition-transform duration-300 group-hover:scale-105`

\- \*\*Information Block:\*\* Clean vertical layout beneath the photo without heavy card borders or aggressive drop shadows.



\### 4.2 Variant Pickers

\- \*\*Size Selector:\*\* Grid/Flexbox of square buttons (`w-11 h-11 border text-sm font-medium rounded-md`). Active state: `bg-zinc-900 text-white border-zinc-900`. Disabled state: `line-through opacity-40 cursor-not-allowed`.

\- \*\*Color Selector:\*\* Circular swatches (`w-7 h-7 rounded-full border border-zinc-300`). Active state: `ring-2 ring-zinc-900 ring-offset-2`.



\### 4.3 Tables (Admin / Staff)

\- Minimalist data tables with thin row dividers (`divide-y divide-zinc-200`).

\- Compact padding (`py-3 px-4`) with clear status pills and inline action buttons.

