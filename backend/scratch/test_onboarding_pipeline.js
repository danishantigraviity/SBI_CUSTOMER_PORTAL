// Override Node's default DNS servers to Google Public DNS to prevent local network resolution failures for Atlas SRV subdomains
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const { Customer } = require('../models/schemas');
const { generateTokens } = require('../middleware/auth');

async function runTest() {
  try {
    await new Promise((resolve) => {
      mongoose.connect(process.env.MONGODB_URI)
        .then(resolve)
        .catch((err) => {
          console.error('Mongoose connection failed:', err);
          process.exit(1);
        });
    });

    console.log('Connected to DB');

    const mobile = '8888888888';
    let customer = await Customer.findOne({ mobile });
    if (!customer) {
      customer = new Customer({
        name: 'Test Danish Onboarding',
        mobile,
        email: 'test_danish_onboarding@gmail.com',
      });
      await customer.save();
    }
    console.log('Customer ID:', customer._id);

    const { accessToken } = generateTokens(customer);
    const targetUrl = 'http://localhost:5000';

    // Step 0: Create draft and update personal info
    console.log('\n--- Step 0: Creating Draft ---');
    let res = await request(targetUrl)
      .post('/api/applications/draft')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();

    console.log('Draft Create Status:', res.status);
    if (res.status !== 201) {
      console.error('Failed to create draft:', res.body);
      return;
    }
    const appId = res.body.data._id;
    console.log('Draft App ID:', appId);

    console.log('\n--- Step 0: Saving Personal Details ---');
    res = await request(targetUrl)
      .patch(`/api/applications/draft/${appId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        personal: {
          name: 'Test Danish Onboarding',
          mobile: '8888888888',
          email: 'test_danish_onboarding@gmail.com',
          dob: '1990-05-15',
          gender: 'Male',
          fatherName: 'Father Name',
          motherName: 'Mother Name',
          pincode: '110001',
          state: 'Delhi',
          city: 'New Delhi',
          address: '123 Main Street Road'
        }
      });
    console.log('Step 0 PATCH Status:', res.status);
    console.log('Step 0 Response:', res.body);
    if (res.status !== 200) return;

    // Step 1: Save KYC info
    console.log('\n--- Step 1: Saving KYC Details ---');
    res = await request(targetUrl)
      .patch(`/api/applications/draft/${appId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        kyc: {
          panNumber: 'ABCDE1234F',
          aadhaarNumber: '123456789012',
          panVerified: true,
          aadhaarVerified: true
        },
        personal: {
          name: 'Test Danish Onboarding',
          dob: '1990-05-15',
          gender: 'Male',
          pincode: '110001',
          state: 'Delhi',
          city: 'New Delhi',
          address: '123 Main Street Road',
          fatherName: 'Father Name',
          motherName: 'Mother Name',
          mobile: '8888888888',
          email: 'test_danish_onboarding@gmail.com'
        }
      });
    console.log('Step 1 PATCH Status:', res.status);
    console.log('Step 1 Response:', res.body);
    if (res.status !== 200) return;

    // Step 2: Save Employment Details and check eligibility
    console.log('\n--- Step 2: Saving Employment Details ---');
    const empPayload = {
      employmentType: 'Salaried',
      salaried: {
        companyName: 'ACME Corp',
        designation: 'Staff Engineer',
        monthlySalary: 75000,
        workExpYears: 5
      }
    };
    res = await request(targetUrl)
      .patch(`/api/applications/draft/${appId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(empPayload);
    console.log('Step 2 PATCH Status:', res.status);
    console.log('Step 2 Response:', res.body);
    if (res.status !== 200) return;

    console.log('\n--- Step 2: Checking Eligibility ---');
    res = await request(targetUrl)
      .post('/api/eligibility/check')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        appId,
        salary: 75000,
        dob: '1990-05-15',
        empType: 'Salaried',
        experience: 5,
        pincode: '110001'
      });
    console.log('Step 2 Check Status:', res.status);
    console.log('Step 2 Check Response:', res.body);
    if (res.status !== 200) return;

    const elig = res.body.result;

    // Step 3: Save final eligibility selection
    console.log('\n--- Step 3: Saving Selected Card and Eligibility Details ---');
    res = await request(targetUrl)
      .patch(`/api/applications/draft/${appId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        eligibility: {
          score: elig.score,
          status: elig.status,
          recommendedCard: elig.card || 'SimplySAVE',
          creditLimit: elig.creditLimit,
          reasons: elig.reasons,
          positives: elig.positives,
          age: elig.age || 36,
          exp: elig.exp || 5,
          checkedAt: new Date()
        }
      });
    console.log('Step 3 PATCH Status:', res.status);
    console.log('Step 3 Response:', res.body);

  } catch (err) {
    console.error('Pipeline Test Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTest();
