# `06-COMMON-PATTERNS-AND-RECIPES.md`

## Panduan Pola Umum & Resep Kode - PanenHub Web App

Dokumen ini adalah "cookbook" resmi untuk developer PanenHub. Gunakan resep-resep di bawah ini untuk tugas-tugas yang sering berulang. Ini akan memastikan konsistensi, keamanan, dan kecepatan dalam pengembangan.

> **Catatan Status Saat Ini:** Banyak resep di bawah ini, terutama yang berkaitan dengan backend (Supabase, GCP), menjelaskan **arsitektur target**. Saat ini, aplikasi masih berjalan dengan data mock. Gunakan resep ini sebagai panduan untuk implementasi di masa depan.

---

### 1. Resep Frontend (Next.js)

#### 1.1. Resep (Target): Mengambil Data dari Supabase dengan `SWR`

Untuk pengambilan data di sisi klien (Client-Side Rendering) saat terhubung ke backend, kita **akan** menggunakan `SWR` (Stale-While-Revalidate) dari Vercel. Ini memberikan caching, revalidasi otomatis, dan pengalaman pengguna yang lebih baik.

**Contoh Penggunaan di Masa Depan:**
```jsx
import useSWR from 'swr';
import { supabase } from '../lib/supabase'; // Target

const fetcher = (key) => supabase.from('products').select('*').eq('id', key).single().then(r => r.data);

function ProductPage({ productId }) {
  const { data: product, error, isLoading } = useSWR(productId, fetcher);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message={error.message} />;
  
  return <div>{product.name}</div>;
}
```

#### 1.2. Resep: Mengelola State Global Keranjang Belanja dengan `Zustand`

Zustand digunakan untuk mengelola state global keranjang belanja.

**File: `store/cartStore.ts` (Sesuai Implementasi Saat Ini)**
```typescript
import { create } from 'zustand';

// Definisikan tipe untuk item dan state
export interface CartItem {
  id: string; // ID produk asli
  cartItemId: string; // ID unik untuk setiap item di keranjang
  name: string;
  price: number;
  quantity: number;
  image: string;
  store: string;
}

export interface CartState {
  items: CartItem[];
  addItem: (itemToAdd: Omit<CartItem, 'quantity' | 'cartItemId'>) => void;
  removeItem: (cartItemId: string) => void; // Menggunakan cartItemId
  updateQuantity: (cartItemId: string, newQuantity: number) => void; // Menggunakan cartItemId
  clearCart: () => void;
  getItemCount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (itemToAdd) => set((state) => {
    const existingItem = state.items.find((i) => i.id === itemToAdd.id);
    if (existingItem) {
      // Update kuantitas jika produk sudah ada
      return {
        items: state.items.map((i) =>
          i.id === itemToAdd.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      };
    }
    // Buat ID unik untuk item baru di keranjang
    const cartItemId = `${itemToAdd.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return { items: [...state.items, { ...itemToAdd, cartItemId, quantity: 1 }] };
  }),
  removeItem: (cartItemId) => set((state) => ({
    items: state.items.filter((item) => item.cartItemId !== cartItemId),
  })),
  updateQuantity: (cartItemId, newQuantity) => set((state) => ({
    items: newQuantity <= 0 
      ? state.items.filter((item) => item.cartItemId !== cartItemId)
      : state.items.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
        ),
  })),
  clearCart: () => set({ items: [] }),
  getItemCount: () => get().items.reduce((total, item) => total + item.quantity, 0),
  getTotal: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0),
}));
```

**Catatan Pola:** Penggunaan `cartItemId` yang unik untuk setiap baris di keranjang adalah pola penting. Ini memungkinkan produk yang sama dari toko yang berbeda (atau dengan varian berbeda di masa depan) untuk ditangani sebagai entitas terpisah di dalam keranjang, yang dicegah jika hanya menggunakan `productId`.

**Cara Penggunaan di Komponen:**
```jsx
import { useCartStore } from '../store/cartStore';

function AddToCartButton({ product }) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem({ id: product.id, name: product.name, price: product.price, image: product.images[0], store: product.store });
  };

  return <button onClick={handleAddToCart}>Tambah ke Keranjang</button>;
}
```

#### 1.3. Resep (Target): Melakukan Aksi Mutasi Data (Insert/Update)

Gunakan pola `async function` dengan `try-catch` dan state loading lokal untuk semua aksi mutasi data ke backend. Pola ini sudah diterapkan di `authStore.ts`.

**Cara Penggunaan di Komponen:**
```jsx
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleUpdateProfile = async (newName) => {
  setIsLoading(true);
  setError(null);
  try {
    const { error: updateError } = await supabase // Target
      .from('profiles')
      .update({ full_name: newName })
      .eq('id', user.id);
      
    if (updateError) throw updateError;
    
    // Tampilkan notifikasi sukses
  } catch (err: any) {
    setError(err.message);
    // Tampilkan notifikasi error
  } finally {
    setIsLoading(false);
  }
};
```

---

### 2. Resep Backend Monolith (Target)

#### 2.1. Resep: Struktur Modular dalam Aplikasi Monolith

Gunakan struktur direktori yang terorganisir untuk memudahkan pemeliharaan dan evolusi ke microservices jika diperlukan.

**Struktur Direktori Target:**
```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.service.ts
│   │   └── auth.middleware.ts
│   ├── stores/
│   │   ├── stores.routes.ts
│   │   └── stores.service.ts
│   ├── products/
│   │   ├── products.routes.ts
│   │   └── products.service.ts
│   ├── orders/
│   │   ├── orders.routes.ts
│   │   └── orders.service.ts
│   └── payments/
│       ├── payments.routes.ts
│       └── payments.service.ts
├── core/
│   ├── supabaseClient.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   └── utils/
└── index.ts
```

#### 2.2. Resep: Middleware Otentikasi untuk Aplikasi Monolith

Gunakan middleware Express untuk verifikasi JWT token dari Supabase.

**File: `src/core/middleware/auth.middleware.ts`**
```typescript
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../supabaseClient';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token verification failed' });
  }
};
```

#### 2.3. Resep: Struktur Router Modul

Setiap modul memiliki router terpisah yang kemudian digabungkan di aplikasi utama.

**File: `src/modules/stores/stores.routes.ts`**
```typescript
import { Router } from 'express';
import { authenticateToken } from '../../core/middleware/auth.middleware';
import { createStore, updateStore } from './stores.service';

const router = Router();

// Semua route di sini memerlukan otentikasi
router.use(authenticateToken);

router.post('/create', createStore);
router.put('/update', updateStore);

export default router;
```

**File: `src/index.ts` (Aplikasi Utama)**
```typescript
import express from 'express';
import storesRoutes from './modules/stores/stores.routes';
import productsRoutes from './modules/products/products.routes';
import ordersRoutes from './modules/orders/orders.routes';
import paymentsRoutes from './modules/payments/payments.routes';

const app = express();

app.use(express.json());

// Daftarkan semua router modul
app.use('/api/stores', storesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### 2.4. Resep: Komunikasi Antar Modul

Dalam aplikasi monolith, modul dapat memanggil fungsi dari modul lain secara langsung.

**File: `src/modules/orders/orders.service.ts`**
```typescript
import { AuthenticatedRequest } from '../../core/middleware/auth.middleware';
import { Response } from 'express';
import { createTripayTransaction } from '../payments/payments.service';
import { supabase } from '../../core/supabaseClient';

export const createFromCart = async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  
  try {
    // Mulai transaksi database
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id);

    if (cartError) throw cartError;
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Buat checkout session
    const { data: session, error: sessionError } = await supabase
      .from('checkout_sessions')
      .insert({
        user_id: user.id,
        total_amount: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        payment_status: 'pending'
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Panggil modul pembayaran secara langsung
    const paymentUrl = await createTripayTransaction({
      amount: session.total_amount,
      customer_email: user.email,
      reference_id: session.id
    });

    res.json({ payment_url: paymentUrl });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

---

### 3. Resep Styling: Komponen UI dengan `CVA`

Kita tidak menggunakan `@apply` di CSS global. Sebaliknya, kita membangun komponen UI yang dapat digunakan ulang dengan **CVA (Class Variance Authority)** dan `tailwind-merge`. Ini adalah pola yang lebih modern dan dapat dipelihara.

#### 3.1. Resep: Membuat Komponen UI Bervarian (Contoh: Tombol)

Resep ini menjelaskan bagaimana komponen `<Button>` kita dibuat. Gunakan pola yang sama untuk komponen UI lainnya.

**File: `components/ui/Button.tsx` (Disederhanakan)**
```typescript
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils'; // Fungsi untuk menggabungkan kelas Tailwind

// 1. Definisikan varian kelas dengan CVA
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// 2. Definisikan tipe Props
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

// 3. Implementasi komponen
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
```

---

### 4. Resep Deployment & DevOps

#### 4.1. Resep: Dockerfile untuk Aplikasi Monolith

**File: `Dockerfile`**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 8000

# Start the application
CMD ["node", "dist/index.js"]
```

#### 4.2. Resep: CI/CD Sederhana dengan GitHub Actions

**File: `.github/workflows/deploy.yml`**
```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Google Cloud CLI
        uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: ${{ secrets.GCP_PROJECT_ID }}
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          
      - name: Build and Deploy
        run: |
          gcloud builds submit . --tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/panenhub-backend
          gcloud run deploy panenhub-backend \
            --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/panenhub-backend \
            --platform managed \
            --region europe-west1 \
            --allow-unauthenticated
```

---

### 5. Resep Testing & Quality Assurance

#### 5.1. Resep: Unit Testing untuk Modul

Gunakan Jest untuk testing unit pada fungsi service.

**File: `src/modules/stores/stores.service.test.ts`**
```typescript
import { createStore } from './stores.service';
import { supabase } from '../../core/supabaseClient';

// Mock Supabase
jest.mock('../../core/supabaseClient');

describe('Store Service', () => {
  test('should create store successfully', async () => {
    const mockRequest = {
      user: { id: 'user-123', email: 'test@example.com' },
      body: { store_name: 'Test Store', description: 'Test Description' }
    };
    
    const mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'store-123', store_name: 'Test Store' },
            error: null
          })
        })
      })
    });

    await createStore(mockRequest as any, mockResponse as any);
    
    expect(mockResponse.json).toHaveBeenCalledWith({
      store: { id: 'store-123', store_name: 'Test Store' }
    });
  });
});
```

---

### ✅ Keuntungan Pola Monolith Terstruktur

*   **Komunikasi Langsung:** Modul dapat memanggil fungsi dari modul lain tanpa overhead HTTP.
*   **Transaksi Database:** Mudah mengelola transaksi yang melibatkan multiple tabel.
*   **Debugging Sederhana:** Semua log dan error dalam satu aplikasi.
*   **Deployment Tunggal:** Hanya satu artifact yang perlu di-deploy dan dimonitor.
*   **Evolusi Bertahap:** Struktur modular memungkinkan ekstraksi ke microservices jika diperlukan.