// ============================================================
// STRUKTUR FOLDER LENGKAP
// PT Anugerah Cahaya Chandra — Internal ERP
// ============================================================

/*
acc-erp/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx           ← Halaman login
│   │   └── layout.tsx
│   ├── dashboard/
│   │   ├── layout.tsx             ← ✅ DIBUAT: Sidebar + Navbar wrapper
│   │   ├── page.tsx               ← Overview dashboard (semua role)
│   │   ├── supervisor/
│   │   │   └── page.tsx           ← ✅ DIBUAT: Antrean + quick stats
│   │   ├── gudang/
│   │   │   ├── page.tsx           ← Inventori produk
│   │   │   ├── inbound/
│   │   │   │   └── page.tsx       ← Form penerimaan barang
│   │   │   └── outbound/
│   │   │       └── page.tsx       ← Form pengiriman barang
│   │   ├── hr/
│   │   │   ├── page.tsx           ← Daftar staff
│   │   │   ├── attendance/
│   │   │   │   └── page.tsx       ← Rekap absensi
│   │   │   └── reports/
│   │   │       └── page.tsx       ← Laporan SDM
│   │   ├── packing/
│   │   │   ├── page.tsx           ← Daftar tugas packing
│   │   │   └── attendance/
│   │   │       └── page.tsx       ← Absensi mandiri staf packing
│   │   ├── manager/
│   │   │   └── page.tsx           ← Dashboard eksekutif
│   │   └── orders/
│   │       └── [id]/
│   │           └── page.tsx       ← Detail order
│   ├── globals.css
│   └── layout.tsx                 ← Root layout (fonts, providers)
│
├── components/
│   ├── dashboard/
│   │   ├── Sidebar.tsx            ← ✅ DIBUAT: Nav dinamis per role
│   │   ├── Navbar.tsx             ← ✅ DIBUAT: Top bar + profil
│   │   ├── StatsCard.tsx          ← ✅ DIBUAT: Glassmorphism card
│   │   └── OrderQueueTable.tsx    ← ✅ DIBUAT: Tabel + aksi
│   └── ui/
│       ├── button.tsx             ← shadcn/ui (generated)
│       ├── badge.tsx
│       ├── input.tsx
│       ├── table.tsx
│       └── toast.tsx
│
├── actions/
│   ├── orders.ts                  ← ✅ DIBUAT: CRUD + status update
│   └── attendance.ts              ← ✅ DIBUAT: Check-in / Check-out
│
├── lib/
│   ├── supabase/
│   │   ├── server.ts              ← ✅ DIBUAT: SSR client
│   │   └── client.ts             ← ✅ DIBUAT: Browser client
│   └── utils.ts                  ← cn() helper dari shadcn
│
├── hooks/
│   ├── useProfile.ts             ← Hook untuk ambil profil user
│   └── useRealtimeOrders.ts      ← Supabase Realtime untuk order
│
├── types/
│   └── database.ts               ← ✅ DIBUAT: Type definitions
│
├── middleware.ts                  ← ✅ DIBUAT: RBAC route protection
├── next.config.ts
├── tailwind.config.ts
└── package.json
*/

// ============================================================
// package.json
// ============================================================
/*
{
  "name": "acc-erp",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "supabase:types": "npx supabase gen types typescript --local > types/database.ts"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/ssr": "^0.5.0",
    "@supabase/supabase-js": "^2.45.0",
    "lucide-react": "^0.400.0",
    "tailwind-merge": "^2.5.0",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "14.2.0"
  }
}
*/

// ============================================================
// .env.local — Environment Variables
// ============================================================
/*
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...   ← Jangan commit ke git!
*/

// ============================================================
// tailwind.config.ts — Konfigurasi warna ACC ERP
// ============================================================

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        // Warna utama ACC ERP
        primary: {
          DEFAULT: '#4f46e5', // indigo-600
          hover:   '#4338ca', // indigo-700
          light:   '#eef2ff', // indigo-50
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
export default config


// ============================================================
// lib/utils.ts — Utility function
// ============================================================

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// ============================================================
// hooks/useRealtimeOrders.ts
// Subscribe ke perubahan order secara real-time via Supabase
// ============================================================

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/types/database'

export function useRealtimeOrders(initialOrders: Order[]) {
  const [orders, setOrders] = useState(initialOrders)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('realtime:orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new as Order, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev =>
              prev.map(o => o.id === payload.new.id ? payload.new as Order : o)
            )
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return orders
}


// ============================================================
// PERINTAH SETUP — Jalankan secara berurutan
// ============================================================
/*
# 1. Buat project Next.js baru
npx create-next-app@latest acc-erp --typescript --tailwind --eslint --app --src-dir no

# 2. Install dependencies utama
npm install @supabase/ssr @supabase/supabase-js lucide-react tailwind-merge clsx

# 3. Install shadcn/ui (opsional, untuk komponen UI tambahan)
npx shadcn@latest init
npx shadcn@latest add button badge input table

# 4. Setup Supabase local development
npx supabase init
npx supabase start

# 5. Jalankan SQL schema di Supabase SQL Editor
# Copy-paste isi supabase_schema.sql

# 6. Generate TypeScript types dari schema
npm run supabase:types

# 7. Isi .env.local dengan credentials Supabase

# 8. Jalankan development server
npm run dev
*/
