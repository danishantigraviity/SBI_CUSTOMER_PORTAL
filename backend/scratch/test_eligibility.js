// Override Node's default DNS servers to Google Public DNS to prevent local network resolution failures for Atlas SRV subdomains
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const request = require('supertest');

async function runTest() {
  try {
    const targetUrl = 'http://localhost:5000';

    const payload = {
      appId: null,
      salary: 67887,
      dob: '15/05/1990', // DD/MM/YYYY format
      empType: 'Salaried',
      experience: 12,
      pincode: '600017'
    };

    const res = await request(targetUrl)
      .post('/api/eligibility/check')
      .send(payload);

    console.log('Eligibility Check Status:', res.status);
    console.log('Eligibility Check Body:', JSON.stringify(res.body, null, 2));

  } catch (err) {
    console.error('Test Error:', err);
  } finally {
    process.exit(0);
  }
}

runTest();
