#!/usr/bin/env node

const http = require('http');

const API_BASE_URL = 'http://localhost:8080';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testOrderCreation() {
  console.log('🧪 Testing Order Creation Endpoint...\n');
  
  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthCheck = await makeRequest(`${API_BASE_URL}/health`);
    console.log(`   Status: ${healthCheck.status}`);
    console.log(`   Response: ${JSON.stringify(healthCheck.data)}\n`);
    
    // Test 2: Order Creation without token (should fail with 401)
    console.log('2. Testing Order Creation without token...');
    const noTokenTest = await makeRequest(`${API_BASE_URL}/api/v1/orders/create_from_cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    console.log(`   Status: ${noTokenTest.status}`);
    console.log(`   Response: ${JSON.stringify(noTokenTest.data)}\n`);
    
    // Test 3: Order Creation with fake token (should fail with different error)
    console.log('3. Testing Order Creation with fake token...');
    const fakeTokenTest = await makeRequest(`${API_BASE_URL}/api/v1/orders/create_from_cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake_token_for_testing'
      },
      body: JSON.stringify({})
    });
    console.log(`   Status: ${fakeTokenTest.status}`);
    console.log(`   Response: ${JSON.stringify(fakeTokenTest.data)}\n`);
    
    // Test 4: Check what endpoints are available
    console.log('4. Testing available auth endpoints...');
    const authStatus = await makeRequest(`${API_BASE_URL}/api/v1/auth/status`);
    console.log(`   Auth Status: ${authStatus.status}`);
    console.log(`   Response: ${JSON.stringify(authStatus.data)}\n`);
    
    // Test 5: Test checkout endpoint without token
    console.log('5. Testing checkout endpoint without token...');
    const checkoutNoToken = await makeRequest(`${API_BASE_URL}/api/v1/payments/checkout/test-session-id`);
    console.log(`   Checkout Status: ${checkoutNoToken.status}`);
    console.log(`   Response: ${JSON.stringify(checkoutNoToken.data)}\n`);
    
    // Test 6: Test checkout endpoint with fake token
    console.log('6. Testing checkout endpoint with fake token...');
    const checkoutFakeToken = await makeRequest(`${API_BASE_URL}/api/v1/payments/checkout/test-session-id`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer fake_token_for_testing'
      }
    });
    console.log(`   Checkout with fake token Status: ${checkoutFakeToken.status}`);
    console.log(`   Response: ${JSON.stringify(checkoutFakeToken.data)}\n`);
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

testOrderCreation();
