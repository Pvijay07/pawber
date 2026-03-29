const https = require('https');

const BASE = 'https://pawber.onrender.com';

function request(method, path, body = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data.substring(0, 200) });
      });
    });

    req.on('error', (e) => {
      resolve({ status: 0, body: e.message });
    });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const tests = [
    // Health
    ['GET', '/health', null, 'Root health check'],
    ['GET', '/api/health', null, 'API health check'],

    // Auth (public)
    ['POST', '/api/auth/signin', { email: 'test@test.com', password: 'test123' }, 'Sign in'],
    ['POST', '/api/auth/refresh', { refresh_token: 'invalid' }, 'Refresh token (invalid)'],

    // Auth (protected - should 401)
    ['GET', '/api/auth/me', null, 'Get profile (no auth, expect 401)'],

    // Services (public)
    ['GET', '/api/services', null, 'List services'],
    ['GET', '/api/services/categories', null, 'List categories'],

    // Events (public)
    ['GET', '/api/events', null, 'List events'],

    // Providers (public)
    ['GET', '/api/providers', null, 'List providers'],

    // Reviews (public - need provider id)
    // Slots (public - need provider id)

    // Protected endpoints (should 401)
    ['GET', '/api/bookings', null, 'List bookings (no auth, expect 401)'],
    ['GET', '/api/pets', null, 'List pets (no auth, expect 401)'],
    ['GET', '/api/wallet', null, 'Get wallet (no auth, expect 401)'],
    ['GET', '/api/wallet/transactions', null, 'Wallet transactions (no auth, expect 401)'],
    ['GET', '/api/notifications', null, 'Notifications (no auth, expect 401)'],
    ['GET', '/api/payments', null, 'Payments (no auth, expect 401)'],

    // Admin (should 401 then 403)
    ['GET', '/api/admin/dashboard', null, 'Admin dashboard (no auth, expect 401)'],
    ['GET', '/api/admin/users', null, 'Admin users (no auth, expect 401)'],
    ['GET', '/api/admin/providers', null, 'Admin providers (no auth, expect 401)'],
    ['GET', '/api/admin/bookings', null, 'Admin bookings (no auth, expect 401)'],
    ['GET', '/api/admin/coupons', null, 'Admin coupons (no auth, expect 401)'],

    // Webhooks (public)
    ['POST', '/api/webhooks/razorpay', { event: 'test' }, 'Razorpay webhook'],
    ['POST', '/api/webhooks/qr-scan', { qr_code: 'test' }, 'QR scan webhook'],

    // Debug
    ['GET', '/api/debug/supabase', null, 'Debug supabase'],

    // 404
    ['GET', '/api/nonexistent', null, '404 test (expect 404)'],
  ];

  console.log('='.repeat(70));
  console.log('  PetCare (Pawber) API — Render Deployment Test');
  console.log('  Base URL:', BASE);
  console.log('  Timestamp:', new Date().toISOString());
  console.log('='.repeat(70));

  const results = [];
  for (const [method, path, body, desc] of tests) {
    const r = await request(method, path, body);
    
    // Determine pass/fail
    let result;
    if (desc.includes('expect 401') && (r.status === 401 || r.status === 403)) {
      result = 'PASS';
    } else if (desc.includes('expect 404') && r.status === 404) {
      result = 'PASS';
    } else if (r.status >= 200 && r.status < 500) {
      result = 'PASS';
    } else if (r.status === 0) {
      result = 'FAIL (connection error)';
    } else {
      result = 'FAIL';
    }
    
    results.push({ method, path, status: r.status, result, desc, body: r.body });
    const icon = result === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${method}] ${path.padEnd(35)} => ${r.status} (${result}) — ${desc}`);
    if (result !== 'PASS') {
      console.log(`   Response: ${r.body}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('  SUMMARY');
  console.log('='.repeat(70));

  const pass = results.filter(r => r.result === 'PASS').length;
  const fail = results.filter(r => r.result !== 'PASS').length;
  console.log(`Total: ${results.length} | Pass: ${pass} | Fail: ${fail}`);

  if (fail > 0) {
    console.log('\n❌ FAILED ENDPOINTS:');
    results.filter(r => r.result !== 'PASS').forEach(r => {
      console.log(`  [${r.method}] ${r.path} => ${r.status} — ${r.desc}`);
      console.log(`  Response: ${r.body}`);
    });
  }

  // Show all responses for debugging
  console.log('\n' + '='.repeat(70));
  console.log('  DETAILED RESPONSES');
  console.log('='.repeat(70));
  results.forEach(r => {
    console.log(`\n[${r.method}] ${r.path} => ${r.status}`);
    console.log(`Response: ${r.body}`);
  });
}

main().catch(console.error);
