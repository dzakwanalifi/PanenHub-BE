import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// Import routers
import storesRouter from './modules/stores/stores.routes';
import productsRouter from './modules/products/products.routes';
import ordersRouter from './modules/orders/orders.routes';
import paymentsRouter from './modules/payments/payments.routes';

const app = express();
const port = process.env.PORT || 8080;

// Middlewares
app.use(cors()); // Aktifkan CORS untuk semua origin
app.use(express.json()); // Untuk mem-parsing body JSON

// Routes
app.get('/', (req, res) => {
  res.send('PanenHub Backend is running!');
});

app.use('/api/v1/stores', storesRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/payments', paymentsRouter);

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});

export default app; 