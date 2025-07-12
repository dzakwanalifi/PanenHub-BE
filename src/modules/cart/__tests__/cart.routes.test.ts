import request from 'supertest';
import express from 'express';
import cartRouter from '../cart.routes';

// Simple test without complex mocking
const app = express();
app.use(express.json());
app.use('/api/v1/cart', cartRouter);

describe('Cart API Routes', () => {
  it('should have cart routes defined', () => {
    expect(cartRouter).toBeDefined();
  });

  it('should return 401 for GET /api/v1/cart without auth', async () => {
    const response = await request(app).get('/api/v1/cart');
    expect(response.status).toBe(401);
  });

  it('should return 401 for POST /api/v1/cart/items without auth', async () => {
    const response = await request(app)
      .post('/api/v1/cart/items')
      .send({ product_id: 'test-id', quantity: 1 });
    expect(response.status).toBe(401);
  });

  it('should return 401 for PUT /api/v1/cart/items/:id without auth', async () => {
    const response = await request(app)
      .put('/api/v1/cart/items/test-id')
      .send({ quantity: 1 });
    expect(response.status).toBe(401);
  });

  it('should return 401 for DELETE /api/v1/cart/items/:id without auth', async () => {
    const response = await request(app)
      .delete('/api/v1/cart/items/test-id');
    expect(response.status).toBe(401);
  });
}); 