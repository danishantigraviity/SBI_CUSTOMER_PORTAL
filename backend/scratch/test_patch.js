// Override Node's default DNS servers to Google Public DNS to prevent local network resolution failures for Atlas SRV subdomains
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const { Customer, Application } = require('../models/schemas');
const { generateTokens } = require('../middleware/auth');

async function runTest() {
  try {
    // Wait for DB connection
    await new Promise((resolve) => {
      mongoose.connect(process.env.MONGODB_URI)
        .then(resolve)
        .catch((err) => {
          console.error('Mongoose connection failed:', err);
          process.exit(1);
        });
    });

    console.log('Connected to DB');

    // Create or find a mock customer
    const mobile = '9999999999';
    let customer = await Customer.findOne({ mobile });
    if (!customer) {
      customer = new Customer({
        name: 'Test Danish',
        mobile,
        email: 'test_danish@gmail.com',
      });
      await customer.save();
    }
    console.log('Customer:', customer._id);

    const { accessToken } = generateTokens(customer);

    const targetUrl = 'http://localhost:5000';

    // 1. Create Draft
    let res = await request(targetUrl)
      .post('/api/applications/draft')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    console.log('Draft Create Status:', res.status);
    console.log('Draft Create Body:', JSON.stringify(res.body, null, 2));

    const draftId = res.body.data._id;

    // 2. Update Draft (Step 3 payload)
    const payload = {
      eligibility: {
        score: 67,
        status: 'Conditionally Approved',
        recommendedCard: 'SBI Prime',
        creditLimit: '₹1.6L – ₹2.4L',
        reasons: ['Limited card delivery serviceability'],
        positives: ['Good income (₹60K+/mo)', 'Prime age bracket (25–45)', 'Salaried — stable income profile'],
        age: 36,
        exp: 12,
        checkedAt: new Date()
      }
    };

    res = await request(targetUrl)
      .patch(`/api/applications/draft/${draftId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    console.log('PATCH Status:', res.status);
    console.log('PATCH Body:', JSON.stringify(res.body, null, 2));

  } catch (err) {
    console.error('Test Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTest();
