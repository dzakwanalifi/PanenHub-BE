import crypto from 'crypto';
import 'dotenv/config';

interface TripayTransactionData {
  merchant_ref: string;
  amount: number;
  customer_name: string;
  customer_email: string;
  order_items: Array<{
    sku: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  method: string;
}

export const createTripayTransaction = async (data: TripayTransactionData) => {
  const tripayApiKey = process.env.TRIPAY_API_KEY;
  const tripayPrivateKey = process.env.TRIPAY_PRIVATE_KEY;
  const tripayMerchantCode = process.env.TRIPAY_MERCHANT_CODE;

  if (!tripayApiKey || !tripayPrivateKey || !tripayMerchantCode) {
    throw new Error('TriPay credentials not configured');
  }

  const payload = {
    method: data.method,
    merchant_ref: data.merchant_ref,
    amount: data.amount,
    customer_name: data.customer_name,
    customer_email: data.customer_email,
    order_items: data.order_items,
    return_url: `${process.env.FRONTEND_URL}/orders/success`,
    expired_time: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 jam
  };

  // Buat signature
  const signature = crypto
    .createHmac('sha256', tripayPrivateKey)
    .update(tripayMerchantCode + data.merchant_ref + data.amount)
    .digest('hex');

  try {
    // Gunakan sandbox URL untuk development
    const apiUrl = tripayApiKey.startsWith('DEV-') 
      ? 'https://tripay.co.id/api-sandbox/transaction/create'
      : 'https://tripay.co.id/api/transaction/create';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tripayApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...payload, signature }),
    });

    const result = await response.json() as any;
    
    if (!response.ok) {
      throw new Error(`TriPay API Error: ${result.message}`);
    }

    return result.data;
  } catch (error: any) {
    throw new Error(`Failed to create TriPay transaction: ${error.message}`);
  }
};

export const validateTripayWebhook = (payload: any, signature: string): { valid: boolean; error?: string } => {
  const tripayPrivateKey = process.env.TRIPAY_PRIVATE_KEY;
  
  if (!tripayPrivateKey) {
    return { valid: false, error: 'TriPay private key not configured' };
  }

  if (!signature) {
    return { valid: false, error: 'No signature provided' };
  }

  const expectedSignature = crypto
    .createHmac('sha256', tripayPrivateKey)
    .update(JSON.stringify(payload))
    .digest('hex');

  return { valid: signature === expectedSignature };
}; 