const assert = require('assert');
const path = require('path');
const db = require('./db');

const BASE_URL = 'http://localhost:5000/api';

async function req(endpoint, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body, headers: res.headers };
}

async function runGuardianVerificationTests() {
  console.log('======================================================');
  console.log('  VITACARE – GUARDIAN & SMS INTAKE NOTIFICATION TESTS  ');
  console.log('======================================================');

  db.ensureTestUsers();
  db.save();

  // Authenticate Patient A
  const loginRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'patient.a@vitacare.ai', password: 'Password123!' })
  });
  assert.strictEqual(loginRes.status, 200, 'Patient A login must succeed');
  const tokenA = loginRes.body.token;
  const userA = loginRes.body.user;

  let passed = 0;

  // 1. Verify GET /api/medicines/adherence is NOT 404
  console.log('\n--- TEST 1: Adherence Endpoint Route Fix ---');
  const adhRes = await req('/medicines/adherence', {}, tokenA);
  assert.strictEqual(adhRes.status, 200, 'Adherence endpoint must return 200, not 404');
  assert(adhRes.body.adherence !== undefined, 'Adherence object must be present');
  console.log('  ✓ PASS: GET /api/medicines/adherence returns 200 with calculation data');
  passed++;

  // 2. Verify GET /api/medicines/notification-history is NOT 404
  console.log('\n--- TEST 2: Notification History Route Fix ---');
  const notifHistRes = await req('/medicines/notification-history', {}, tokenA);
  assert.strictEqual(notifHistRes.status, 200, 'Notification history must return 200, not 404');
  assert(Array.isArray(notifHistRes.body.history), 'History array must be returned');
  console.log('  ✓ PASS: GET /api/medicines/notification-history returns 200');
  passed++;

  // 3. Test POST /api/guardians (Adding guardian without undefined error)
  console.log('\n--- TEST 3: Add Guardian Endpoint Fix ---');
  const newGuardianRes = await req('/guardians', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Dr. Sarah Connor',
      relationship: 'Primary Caregiver',
      phoneNumber: '+91 98765 88990',
      email: 'sconnor@example.com',
      notificationPreference: 'BOTH',
      smsEnabled: true,
      allowMedicationEscalation: true,
      consentGiven: true
    })
  }, tokenA);
  assert.strictEqual(newGuardianRes.status, 201, 'Adding guardian must return 201');
  assert.strictEqual(newGuardianRes.body.guardian.name, 'Dr. Sarah Connor');
  assert.strictEqual(newGuardianRes.body.guardian.userId, userA.id);
  console.log('  ✓ PASS: POST /api/guardians successfully creates guardian with auth session');
  passed++;

  // Create a fresh schedule for testing intake notifications
  const testSched = db.insert('medicine_schedules', {
    userId: userA.id,
    medicineId: 'med_notif_test',
    medicineName: 'Amlodipine 5mg',
    dosage: '5mg',
    scheduledTime: '09:00 AM',
    scheduledDate: new Date().toISOString().split('T')[0],
    status: 'Pending'
  });

  // 4. Test Successful Consumption -> Verified Status & SMS format
  console.log('\n--- TEST 4: Successful Intake -> Taken – Verified & Guardian SMS ---');
  const intakeRes = await req(`/medicines/schedules/${testSched.id}/consumption-event`, {
    method: 'POST',
    body: JSON.stringify({
      sessionId: 'sess_notif_test_01',
      startedAt: new Date(Date.now() - 5000).toISOString(),
      detectedAt: new Date(Date.now() - 2000).toISOString(),
      completedAt: new Date().toISOString(),
      confidenceScore: 0.94,
      verificationSource: 'camera_vision_pipeline',
      milestones: ['face_aligned', 'hand_detected', 'hand_to_mouth_motion', 'mouth_interaction_hold', 'hand_retreated', 'consumption_completed'],
      status: 'CONSUMPTION_DETECTED'
    })
  }, tokenA);
  assert.strictEqual(intakeRes.status, 200, 'Consumption event must verify');
  assert.strictEqual(intakeRes.body.verified, true);

  const updatedSched = db.findById('medicine_schedules', testSched.id);
  assert.strictEqual(updatedSched.status, 'Verified', 'DB status must be Verified');

  // Check SMS log
  const smsLogs = db.find('sms_logs', l => l.userId === userA.id && l.eventType === 'dose_verified');
  assert(smsLogs.length > 0, 'dose_verified SMS log must exist');
  const latestSms = smsLogs[smsLogs.length - 1];
  assert(latestSms.message.includes('completed the scheduled medication intake for Amlodipine 5mg'), 'Message must contain requested verification phrasing');
  assert(latestSms.message.includes('Status: Taken – Verified'), 'Message must include Status: Taken – Verified');
  assert(latestSms.maskedPhone.includes('***'), 'Phone must be masked for privacy');
  console.log(`  ✓ PASS: dose_verified SMS dispatched: "${latestSms.message}"`);
  passed++;

  // 5. Test Repeated Verification Failure
  console.log('\n--- TEST 5: Failed Verification Flow ---');
  const failedSched = db.insert('medicine_schedules', {
    userId: userA.id,
    medicineId: 'med_notif_fail',
    medicineName: 'Atorvastatin 20mg',
    dosage: '20mg',
    scheduledTime: '10:00 AM',
    scheduledDate: new Date().toISOString().split('T')[0],
    status: 'Pending'
  });

  const failRes = await req(`/medicines/schedules/${failedSched.id}/failed-verification`, {
    method: 'POST'
  }, tokenA);
  assert.strictEqual(failRes.status, 200, 'Failed verification must return 200');
  assert.strictEqual(failRes.body.verified, false, 'verified must be false');
  assert.strictEqual(failRes.body.status, 'TRACKING_FAILED');

  const dbFailed = db.findById('medicine_schedules', failedSched.id);
  assert.strictEqual(dbFailed.status, 'TRACKING_FAILED', 'DB status must be TRACKING_FAILED, NOT verified');
  console.log('  ✓ PASS: Failed verification marks status TRACKING_FAILED and notifies guardian');
  passed++;

  // 6. Test Missed Dose Alert
  console.log('\n--- TEST 6: Missed Dose Notification Flow ---');
  const missedSched = db.insert('medicine_schedules', {
    userId: userA.id,
    medicineId: 'med_notif_missed',
    medicineName: 'Lisinopril 10mg',
    dosage: '10mg',
    scheduledTime: '11:00 AM',
    scheduledDate: new Date().toISOString().split('T')[0],
    status: 'Pending'
  });

  const missRes = await req(`/medicines/schedules/${missedSched.id}/mark-missed`, {
    method: 'POST'
  }, tokenA);
  assert.strictEqual(missRes.status, 200, 'Mark missed must return 200');
  assert.strictEqual(missRes.body.status, 'Missed');

  const dbMissed = db.findById('medicine_schedules', missedSched.id);
  assert.strictEqual(dbMissed.status, 'Missed');

  const missedSmsLogs = db.find('sms_logs', l => l.userId === userA.id && l.eventType === 'missed_medication');
  assert(missedSmsLogs.length > 0, 'missed_medication SMS log must exist');
  const latestMissedSms = missedSmsLogs[missedSmsLogs.length - 1];
  assert(latestMissedSms.message.includes('has not completed the scheduled medication intake for Lisinopril 10mg'), 'Message must contain requested missed dose text');
  console.log(`  ✓ PASS: missed_medication SMS dispatched: "${latestMissedSms.message}"`);
  passed++;

  // 7. Verify Notification History Endpoint includes all events
  console.log('\n--- TEST 7: Notification History Audit Completeness ---');
  const historyRes = await req('/medicines/notification-history', {}, tokenA);
  assert.strictEqual(historyRes.status, 200);
  const hist = historyRes.body.history;
  const types = hist.map(h => h.notificationType);
  assert(types.includes('Taken – Verified'), 'History must include Taken – Verified');
  assert(types.includes('Missed Medication'), 'History must include Missed Medication');
  console.log(`  ✓ PASS: Audit history contains ${hist.length} entries with complete delivery status.`);
  passed++;

  console.log('\n======================================================');
  console.log(`  ALL ${passed} GUARDIAN NOTIFICATION SUITE TESTS PASSED!`);
  console.log('======================================================');
}

runGuardianVerificationTests().catch(err => {
  console.error('Guardian test failure:', err);
  process.exit(1);
});
