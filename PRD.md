# Product Requirement Document (PRD)

## 1. Project Overview
- **Project Name:** Toko Pakaian E-Commerce (Dummy Project)
- **Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL, Auth, Storage)
- **Deployment Target:** Vercel (Serverless)

---

## 2. User Roles & Access Matrix
- **Admin:**
  - Full system access.
  - Manage user roles (promote user to staff).
  - View overall sales summary and reports.
  - Manage categories and all products.
- **Staff:**
  - Product catalog management (create, update, delete products, upload photos).
  - Stock variant management (sizes: S/M/L/XL, colors, quantities).
  - Order management (view incoming orders, update shipping status, input tracking numbers).
- **User (Customer):**
  - Register, login, manage profile.
  - Browse apparel catalog, search, and filter by category.
  - Select clothing size and color variants.
  - Client-side shopping cart (persisted state).
  - Dummy checkout flow and order history tracking.

---

## 3. Database Schema (Supabase PostgreSQL)

### 3.1 Tables & Relations
- `profiles`
  - `id`: UUID (PK, references `auth.users.id` on delete cascade)
  - `email`: TEXT (NOT NULL)
  - `full_name`: TEXT
  - `role`: ENUM ('admin', 'staff', 'user') DEFAULT 'user'
  - `created_at`: TIMESTAMPTZ DEFAULT now()

- `categories`
  - `id`: UUID (PK, default uuid_generate_v4())
  - `name`: TEXT (NOT NULL)
  - `slug`: TEXT (UNIQUE, NOT NULL)

- `products`
  - `id`: UUID (PK, default uuid_generate_v4())
  - `category_id`: UUID (FK -> `categories.id`)
  - `title`: TEXT (NOT NULL)
  - `slug`: TEXT (UNIQUE, NOT NULL)
  - `description`: TEXT
  - `price`: NUMERIC(12, 2) (NOT NULL)
  - `image_url`: TEXT (NOT NULL)
  - `is_active`: BOOLEAN DEFAULT true
  - `created_at`: TIMESTAMPTZ DEFAULT now()

- `product_variants`
  - `id`: UUID (PK, default uuid_generate_v4())
  - `product_id`: UUID (FK -> `products.id` on delete cascade)
  - `size`: TEXT (e.g., 'S', 'M', 'L', 'XL', 'All Size')
  - `color`: TEXT (NOT NULL)
  - `stock`: INTEGER DEFAULT 0

- `orders`
  - `id`: UUID (PK, default uuid_generate_v4())
  - `user_id`: UUID (FK -> `profiles.id`)
  - `total_amount`: NUMERIC(12, 2) (NOT NULL)
  - `status`: ENUM ('pending', 'paid', 'shipped', 'completed', 'cancelled') DEFAULT 'pending'
  - `tracking_number`: TEXT (NULLABLE)
  - `shipping_address`: TEXT (NOT NULL)
  - `created_at`: TIMESTAMPTZ DEFAULT now()

- `order_items`
  - `id`: UUID (PK, default uuid_generate_v4())
  - `order_id`: UUID (FK -> `orders.id` on delete cascade)
  - `variant_id`: UUID (FK -> `product_variants.id`)
  - `quantity`: INTEGER (NOT NULL)
  - `price_at_purchase`: NUMERIC(12, 2) (NOT NULL)

---

## 4. Storage Bucket Configuration
- **Bucket Name:** `products` (Public Bucket)
- **Path Pattern:** `items/[timestamp]-[random_hash].[extension]`
- **RLS Policies:**
  - Read: Public (`anon`, `authenticated`)
  - Write: Only `authenticated` users with `admin` or `staff` role.

---

## 5. Application Architecture & Routing

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (shop)/
│   │   ├── page.tsx                 # Catalog Homepage
│   │   ├── products/[id]/page.tsx   # Product Detail + Variant Selector
│   │   ├── cart/page.tsx            # Shopping Cart
│   │   └── checkout/page.tsx        # Checkout Form
│   ├── staff/
│   │   ├── products/
│   │   │   ├── page.tsx             # Inventory Table
│   │   │   └── new/page.tsx         # Upload Image & Add Product Form
│   │   └── orders/page.tsx          # Order Processing & Tracking Number
│   ├── admin/
│   │   ├── users/page.tsx           # Role Management
│   │   └── reports/page.tsx         # Sales Analytics Overview
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                          # Reusable Buttons, Inputs, Dialogs, Badges
│   ├── Navbar.tsx
│   ├── ProductCard.tsx
│   └── UploadProductImage.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Browser Client
│   │   └── server.ts                # Server Client with Cookies
│   └── store/
│       └── useCartStore.ts          # Zustand Client State
└── middleware.ts                    # RBAC Route Protection