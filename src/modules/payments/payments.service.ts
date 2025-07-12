import crypto from 'crypto';
import 'dotenv/config';

const apiKey = process.env.TRIPAY_API_KEY;
const privateKey = process.env.TRIPAY_PRIVATE_KEY;
const merchantCode = process.env.TRIPAY_MERCHANT_CODE;
const tripayApiUrl = 'https://tripay.co.id/api-sandbox/transaction/create'; // Gunakan URL Sandbox

interface TransactionDetails {
  merchant_ref: string;
  amount: number;
  customer_name: string;
  customer_email: string;
  order_items: any[];
  method: string; // e.g., 'QRIS'
}

export const createTripayTransaction = async (details: TransactionDetails) => {
  if (!apiKey || !privateKey || !merchantCode) {
    throw new Error('Tripay credentials are not configured.');
  }

  // 1. Buat signature
  const signature = crypto
    .createHmac('sha256', privateKey)
    .update(merchantCode + details.merchant_ref + details.amount)
    .digest('hex');

  const payload = {
    ...details,
    signature,
    merchant_code: merchantCode,
    expired_time: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 jam
  };

  // 2. Kirim request ke TriPay
  const response = await fetch(tripayApiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json() as any;

  if (!result.success) {
    console.error('Tripay API Error:', result.message);
    throw new Error(result.message || 'Failed to create Tripay transaction.');
  }

  return result.data;
};

export const validateTripayWebhook = (body: any, signatureHeader: string): boolean => {
    if (!privateKey) {
        console.error('Tripay private key is not configured for webhook validation.');
        return false;
    }
    const localSignature = crypto
        .createHmac('sha256', privateKey)
        .update(JSON.stringify(body))
        .digest('hex');
    
    return localSignature === signatureHeader;
} 