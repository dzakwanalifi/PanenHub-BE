import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// Import routers
import authRoutes from './modules/auth/auth.routes';
import productsRoutes from './modules/products/products.routes';
import storesRoutes from './modules/stores/stores.routes';
import ordersRoutes from './modules/orders/orders.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import groupBuyRoutes from './modules/groupbuy/groupbuy.routes';

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Register all routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/stores', storesRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/group-buy', groupBuyRoutes);

app.listen(port, () => {
  console.log(`🚀 Server backend PanenHub berjalan di http://localhost:${port}`);
}); 