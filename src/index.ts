import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// Import routers
import storesRouter from './modules/stores/stores.routes';
import productsRouter from './modules/products/products.routes';
import ordersRouter from './modules/orders/orders.routes';
import paymentsRouter from './modules/payments/payments.routes';
import notificationsRouter from './modules/notifications/notifications.routes';

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Register all routers
app.use('/api/v1/stores', storesRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/notifications', notificationsRouter);

app.listen(port, () => {
  console.log(`🚀 Server backend PanenHub berjalan di http://localhost:${port}`);
}); 