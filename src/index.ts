import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import pino from 'pino-http';

// Import routers
import authRoutes from './modules/auth/auth.routes';
import productsRoutes from './modules/products/products.routes';
import storesRoutes from './modules/stores/stores.routes';
import cartRoutes from './modules/cart/cart.routes';
import ordersRoutes from './modules/orders/orders.routes';
import usersRoutes from './modules/users/users.routes';
import shippingRoutes from './modules/shipping/shipping.routes';
// import notificationsRoutes from './modules/notifications/notifications.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import groupBuyRoutes from './modules/groupbuy/groupbuy.routes';

const app = express();
const port = parseInt(process.env.PORT || '8000', 10);

// Setup logger
const logger = pino({
    transport: process.env.NODE_ENV !== 'production' 
        ? { target: 'pino-pretty' } 
        : undefined,
});
app.use(logger);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Register routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/stores', storesRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/user', usersRoutes);
app.use('/api/v1/shipping', shippingRoutes);
// app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/group-buy', groupBuyRoutes);

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${port}`);
    console.log(`📖 Health check: http://localhost:${port}/health`);
});

export default app;
