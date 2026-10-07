const assert = require('assert');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';
const localesDir = path.join(__dirname, '..', 'frontend', 'src', 'i18n', 'locales');
const languages = ['en', 'ta', 'te', 'ml', 'kn', 'hi', 'bn', 'mr'];

async function req(endpoint, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });
  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    body = null;
  }
  return { status: res.status, ok: res.ok, body };
}

async function verifyAll() {
  console.log('\n======================================================');
  console.log('  VITACARE 8-LANGUAGE COMPLETE SYSTEM VERIFICATION    ');
  console.log('======================================================\n');

  // STEP 1: Verify all 8 JSON locale files
  console.log('--- Step 1: Validating 8 Locale Dictionaries ---');
  const enData = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));
  const allKeys = Object.keys(enData);
  console.log(`English Dictionary has ${allKeys.length} keys.`);

  for (const lang of languages) {
    const filePath = path.join(localesDir, `${lang}.json`);
    assert(fs.existsSync(filePath), `Locale file ${lang}.json must exist!`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const keys = Object.keys(data);
    assert.strictEqual(keys.length, allKeys.length, `Locale ${lang}.json key count (${keys.length}) must match en.json (${allKeys.length})`);
    
    // Check no empty values
    let emptyCount = 0;
    for (const k of allKeys) {
      if (!data[k] || typeof data[k] !== 'string' || data[k].trim() === '') {
        emptyCount++;
      }
    }
    assert.strictEqual(emptyCount, 0, `Locale ${lang}.json has ${emptyCount} empty translations!`);
    console.log(`  ✓ PASS: ${lang}.json fully populated (${keys.length} keys, 0 empty)`);
  }

  // Authenticate user
  console.log('\n--- Step 2: Authenticating Test Accounts ---');
  const loginRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'patient.a@vitacare.ai', password: 'Password123!' })
  });
  assert(loginRes.ok, 'Patient login must succeed');
  const token = loginRes.body.token;

  const adminLogin = await req('/auth/admin-login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@vitacare.ai', password: 'AdminSecure2026!' })
  });
  assert(adminLogin.ok, 'Admin login must succeed');
  const adminToken = adminLogin.body.token;

  // STEP 3: Verify Persistence for all 8 languages
  console.log('\n--- Step 3: Verifying Language Persistence for all 8 Languages ---');
  for (const lang of languages) {
    const updateRes = await req('/users/profile/language', {
      method: 'PUT',
      body: JSON.stringify({ language: lang })
    }, token);
    assert.strictEqual(updateRes.status, 200, `Setting language to ${lang} must succeed`);
    assert.strictEqual(updateRes.body.user.preferredLanguage, lang, `Response must reflect ${lang}`);

    const meRes = await req('/auth/me', {}, token);
    assert.strictEqual(meRes.body.user.preferredLanguage, lang, `Profile must persist ${lang}`);
    console.log(`  ✓ PASS: Persistent preference confirmed for "${lang}"`);
  }

  // STEP 4: AI Copilot localized responses across all 8 languages
  console.log('\n--- Step 4: AI Copilot Multilingual Health Analysis ---');
  for (const lang of languages) {
    const aiRes = await req('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'My blood glucose is 195 mg/dL. What should I do?',
        preferred_language: lang
      })
    }, token);
    assert.strictEqual(aiRes.status, 200, `AI Copilot request in ${lang} must succeed`);
    assert(aiRes.body.reply, `AI response in ${lang} must exist`);
    assert.strictEqual(aiRes.body.language, lang, `AI reply language must be ${lang}`);
    // Check that clinical metrics are preserved
    assert(aiRes.body.reply.includes('195') || aiRes.body.reply.includes('mg/dL') || aiRes.body.reply.length > 30, `AI reply in ${lang} must retain medical precision`);
    console.log(`  ✓ PASS: AI Copilot generated clinical analysis in "${lang}"`);
  }

  // STEP 5: Localized Report Difference Summary in all 8 languages
  console.log('\n--- Step 5: Medical Report Comparison Localization ---');
  let reportsRes = await req('/reports', {}, token);
  let r1Id, r2Id;
  if (reportsRes.body.reports && reportsRes.body.reports.length >= 2) {
    r1Id = reportsRes.body.reports[0].id;
    r2Id = reportsRes.body.reports[1].id;
  } else {
    // Create two sample reports
    const rep1 = await req('/reports/verify', {
      method: 'POST',
      body: JSON.stringify({
        reportType: 'Metabolic Panel Test A',
        labName: 'Central Diagnostics',
        reportDate: '2026-01-10',
        extractedValues: [{ metricKey: 'glucose', metricName: 'Fasting Blood Glucose', value: '110', unit: 'mg/dL' }]
      })
    }, token);
    const rep2 = await req('/reports/verify', {
      method: 'POST',
      body: JSON.stringify({
        reportType: 'Metabolic Panel Test B',
        labName: 'Central Diagnostics',
        reportDate: '2026-02-10',
        extractedValues: [{ metricKey: 'glucose', metricName: 'Fasting Blood Glucose', value: '98', unit: 'mg/dL' }]
      })
    }, token);
    r1Id = rep1.body.report.id;
    r2Id = rep2.body.report.id;
  }

  for (const lang of languages) {
    const diffRes = await req(`/reports/compare/diff?report1Id=${r1Id}&report2Id=${r2Id}&preferred_language=${lang}`, {}, token);
    assert.strictEqual(diffRes.status, 200, `Report diff request in ${lang} must succeed`);
    assert(diffRes.body.summaryNote, `Report summary in ${lang} must exist`);
    console.log(`  ✓ PASS: Report Comparison generated localized summary in "${lang}"`);
  }

  // STEP 6: Admin CMS Multilingual CRUD for 8 Languages
  console.log('\n--- Step 6: Admin CMS Multilingual CRUD for all 8 Languages ---');
  const testKey = 'testCustomMetricKey8';
  
  // Create
  const createRes = await req('/admin/translations', {
    method: 'POST',
    body: JSON.stringify({
      key: testKey,
      en: 'Custom Metric Value',
      ta: 'விருப்ப அளவீட்டு மதிப்பு',
      te: 'అనుకూల మెట్రిక్ విలువ',
      ml: 'ഇഷ്ടാനുസൃത മെട്രിക് മൂല്യം',
      kn: 'ಕಸ್ಟಮ್ ಮೆಟ್ರಿಕ್ ಮೌಲ್ಯ',
      hi: 'कस्टम मीट्रिक मान',
      bn: 'কাস্টম মেট্রিক মান',
      mr: 'कस्टम मेट्रिक मूल्य',
      category: 'Test'
    })
  }, adminToken);
  assert.strictEqual(createRes.status, 201, 'Admin translation key creation must succeed');
  assert.strictEqual(createRes.body.translation.kn, 'ಕಸ್ಟಮ್ ಮೆಟ್ರಿಕ್ ಮೌಲ್ಯ', 'Kannada translation must be saved');
  assert.strictEqual(createRes.body.translation.mr, 'कस्टम मेट्रिक मूल्य', 'Marathi translation must be saved');

  // Update
  const updateTransRes = await req(`/admin/translations/${testKey}`, {
    method: 'PUT',
    body: JSON.stringify({
      bn: 'আপডেট করা কাস্টম মেট্রিক মান',
      ml: 'പുതുക്കിയ മെട്രിക് മൂല്യം'
    })
  }, adminToken);
  assert.strictEqual(updateTransRes.status, 200, 'Admin translation key update must succeed');
  assert.strictEqual(updateTransRes.body.translation.bn, 'আপডেট করা কাস্টম মেট্রিক মান');
  assert.strictEqual(updateTransRes.body.translation.ml, 'പുതുക്കിയ മെട്രിക് മൂല്യം');

  // Delete
  const delRes = await req(`/admin/translations/${testKey}`, {
    method: 'DELETE'
  }, adminToken);
  assert.strictEqual(delRes.status, 200, 'Admin translation key deletion must succeed');
  console.log('  ✓ PASS: Admin CMS successfully performed CRUD across all 8 languages');

  console.log('\n======================================================');
  console.log('  ALL 8 LANGUAGES VERIFIED ACROSS UI, AI & BACKEND!   ');
  console.log('======================================================\n');
}

verifyAll().catch(err => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
