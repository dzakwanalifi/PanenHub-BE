import { Router } from 'express';

const router = Router();

// GET /api/v1/shipping/methods - Mendapatkan metode pengiriman yang tersedia
router.get('/methods', async (req, res) => {
  try {
    // For now, return static shipping methods
    // In the future, this could be dynamic based on location, weight, etc.
    const shippingMethods = [
      {
        id: 'REGULER',
        name: 'Pengiriman Reguler',
        description: '3-5 hari kerja',
        price: 5000,
        estimatedDays: '3-5 hari'
      },
      {
        id: 'EXPRESS',
        name: 'Pengiriman Express',
        description: '1-2 hari kerja',
        price: 12000,
        estimatedDays: '1-2 hari'
      },
      {
        id: 'SAME_DAY',
        name: 'Pengiriman Same Day',
        description: 'Hari yang sama (untuk area tertentu)',
        price: 20000,
        estimatedDays: 'Hari yang sama'
      }
    ];

    res.json(shippingMethods);
  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    res.status(500).json({ message: 'Gagal mengambil metode pengiriman' });
  }
});

// GET /api/v1/shipping/calculate - Menghitung biaya pengiriman
router.get('/calculate', async (req, res) => {
  try {
    const { origin, destination, weight, method } = req.query;

    // For now, return static calculation
    // In the future, integrate with shipping API (JNE, TIKI, POS, etc.)
    let basePrice = 5000;
    let multiplier = 1;

    switch (method) {
      case 'EXPRESS':
        multiplier = 2.4; // 12000
        break;
      case 'SAME_DAY':
        multiplier = 4; // 20000
        break;
      default:
        multiplier = 1; // 5000
    }

    const calculatedPrice = Math.round(basePrice * multiplier);

    res.json({
      method: method || 'REGULER',
      price: calculatedPrice,
      estimatedDays: method === 'SAME_DAY' ? 'Hari yang sama' : 
                     method === 'EXPRESS' ? '1-2 hari' : '3-5 hari',
      origin,
      destination,
      weight: weight || 1
    });
  } catch (error) {
    console.error('Error calculating shipping cost:', error);
    res.status(500).json({ message: 'Gagal menghitung biaya pengiriman' });
  }
});

export default router; 