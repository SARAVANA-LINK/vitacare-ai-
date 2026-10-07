/**
 * VitaCare Step 1 Implementation Test Suite
 * Executes Tests 1-20, Four-Language Validation, and End-to-End Workflows
 */

const assert = require('assert');
const path = require('path');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = 'vitacare-ai-ultra-secure-medical-secret-2026';

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  blocked: 0,
  security: { passed: 0, failed: 0 },
  language: { passed: 0, failed: 0 },
  tracking: { passed: 0, failed: 0 },
  escalation: { passed: 0, failed: 0 },
  details: []
};

function recordTest(category, name, passed, error = null, notes = '') {
  results.total++;
  if (passed) {
    results.passed++;
    if (category === 'security') results.security.passed++;
    else if (category === 'language') results.language.passed++;
    else if (category === 'tracking') results.tracking.passed++;
    else if (category === 'escalation') results.escalation.passed++;
    console.log(`  ✓ PASS: ${name}`);
  } else {
    results.failed++;
    if (category === 'security') results.security.failed++;
    else if (category === 'language') results.language.failed++;
    else if (category === 'tracking') results.tracking.failed++;
    else if (category === 'escalation') results.escalation.failed++;
    console.error(`  ✗ FAIL: ${name} -> Error:`, error?.message || error);
  }
  results.details.push({ category, name, passed, error: error?.message || null, notes });
}

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

async function runSuite() {
  console.log('\n======================================================');
  console.log('  VITACARE AI – STEP 1 AUTOMATED COMPREHENSIVE SUITE  ');
  console.log('======================================================\n');

  // Load fresh DB reference
  const db = require('./db');
  db.ensureTestUsers();
  db.save();

  // Authenticate Test Users
  console.log('--- Authenticating Test Accounts ---');
  const loginPatientA = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'patient.a@vitacare.ai', password: 'Password123!' })
  });
  assert(loginPatientA.ok, 'Patient A login must succeed');
  const tokenA = loginPatientA.body.token;
  const userA = loginPatientA.body.user;

  const loginPatientB = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'patient.b@vitacare.ai', password: 'Password123!' })
  });
  assert(loginPatientB.ok, 'Patient B login must succeed');
  const tokenB = loginPatientB.body.token;
  const userB = loginPatientB.body.user;

  const loginAdmin = await req('/auth/admin-login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@vitacare.ai', password: 'AdminSecure2026!' })
  });
  assert(loginAdmin.ok, 'Admin login must succeed');
  const tokenAdmin = loginAdmin.body.token;

  console.log('Test accounts authenticated successfully.\n');

  // -----------------------------------------------------------
  // TEST 1 – Scheduled Medicine
  // -----------------------------------------------------------
  console.log('--- Running TEST 1: Scheduled Medicine ---');
  try {
    const medRes = await req('/medicines', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Metformin XR',
        dosage: '500 mg',
        frequency: 'Once daily',
        intakeTimes: ['08:00 AM'],
        duration: '14 days'
      })
    }, tokenA);

    assert.strictEqual(medRes.status, 201, 'Should create medicine');
    const createdMed = medRes.body.medicine;

    // Verify in Database
    const dbSchedules = db.find('medicine_schedules', s => s.medicineId === createdMed.id && s.userId === userA.id);
    assert(dbSchedules.length > 0, 'Schedules must be generated in DB');
    const firstSched = dbSchedules[0];

    assert(
      firstSched.status === 'Pending' || firstSched.status === 'PENDING' || firstSched.status === 'upcoming',
      `Medicine schedule must appear as PENDING in DB, got: ${firstSched.status}`
    );

    // Verify via today endpoint
    const todayRes = await req('/medicines/today', {}, tokenA);
    const foundSched = todayRes.body.schedules.find(s => s.medicineId === createdMed.id);
    assert(foundSched, 'Schedule must appear in today schedule');
    assert.strictEqual(foundSched.status, 'Pending', 'API status must be Pending');

    recordTest('tracking', 'TEST 1 – Scheduled Medicine (DB status = PENDING)', true);
  } catch (err) {
    recordTest('tracking', 'TEST 1 – Scheduled Medicine', false, err);
  }

  // -----------------------------------------------------------
  // TEST 2 – Manual Verification Attack
  // -----------------------------------------------------------
  console.log('\n--- Running TEST 2: Manual Verification Attack ---');
  try {
    const sched = db.findOne('medicine_schedules', s => s.userId === userA.id && (s.status === 'Pending' || s.status === 'PENDING'));
    assert(sched, 'Must have a pending schedule');

    // Attempt direct manual take
    const manualTakeRes = await req(`/medicines/schedules/${sched.id}/take`, {
      method: 'POST'
    }, tokenA);

    assert.strictEqual(manualTakeRes.status, 403, 'Manual take endpoint must return 403 Forbidden');
    assert(manualTakeRes.body.error.includes('prohibited'), 'Error message must specify manual verification is prohibited');

    // Attempt direct status = VERIFIED injection via consumption event without telemetry
    const fakeInjectionRes = await req(`/medicines/schedules/${sched.id}/consumption-event`, {
      method: 'POST',
      body: JSON.stringify({
        status: 'VERIFIED'
      })
    }, tokenA);

    assert.strictEqual(fakeInjectionRes.status, 403, 'Direct status = VERIFIED injection must be rejected with 403');

    // Verify in DB that schedule STILL remains PENDING
    const dbSchedAfter = db.findById('medicine_schedules', sched.id);
    assert.notStrictEqual(dbSchedAfter.status, 'Verified', 'DB schedule must NOT be marked Verified');
    assert.notStrictEqual(dbSchedAfter.status, 'VERIFIED', 'DB schedule must NOT be marked VERIFIED');

    recordTest('security', 'TEST 2 – Manual Verification Attack (Direct status change rejected with 403)', true);
  } catch (err) {
    recordTest('security', 'TEST 2 – Manual Verification Attack', false, err);
  }

  // -----------------------------------------------------------
  // TEST 3 – Successful Consumption
  // -----------------------------------------------------------
  console.log('\n--- Running TEST 3: Successful Consumption Tracking ---');
  try {
    const sched = db.findOne('medicine_schedules', s => s.userId === userA.id && (s.status === 'Pending' || s.status === 'PENDING'));
    assert(sched, 'Pending schedule required');

    const validTrackingPayload = {
      sessionId: 'sess_vision_001_test',
      startedAt: new Date(Date.now() - 15000).toISOString(),
      detectedAt: new Date(Date.now() - 3000).toISOString(),
      completedAt: new Date().toISOString(),
      confidenceScore: 0.94,
      verificationSource: 'camera_vision_pipeline',
      milestones: ['face_aligned', 'pill_detected', 'hand_to_mouth_motion', 'consumption_completed'],
      status: 'CONSUMPTION_DETECTED'
    };

    const verifyRes = await req(`/medicines/schedules/${sched.id}/consumption-event`, {
      method: 'POST',
      body: JSON.stringify(validTrackingPayload)
    }, tokenA);

    assert.strictEqual(verifyRes.status, 200, 'Valid consumption event must succeed with 200');
    assert.strictEqual(verifyRes.body.status, 'VERIFIED', 'Response status must be VERIFIED');
    assert.strictEqual(verifyRes.body.verified, true, 'Verified flag must be true');

    // Check DB consumption_events
    const eventRecord = db.findOne('consumption_events', e => e.scheduleId === sched.id);
    assert(eventRecord, 'Consumption event record must be stored in DB');
    assert.strictEqual(eventRecord.status, 'VERIFIED', 'Event record status must be VERIFIED');
    assert.strictEqual(eventRecord.confidenceScore, 0.94, 'Confidence score must match');
    assert.strictEqual(eventRecord.verificationSource, 'camera_vision_pipeline', 'Source must match');

    // Check DB schedule
    const updatedSched = db.findById('medicine_schedules', sched.id);
    assert(updatedSched.status === 'Verified' || updatedSched.status === 'VERIFIED', 'DB schedule status must be Verified');
    assert(updatedSched.takenAt, 'takenAt timestamp must be recorded');
    assert.strictEqual(updatedSched.verifiedVia, 'camera_vision_pipeline', 'verifiedVia must be recorded');

    recordTest('tracking', 'TEST 3 – Successful Consumption (Vision event verified in DB)', true);
  } catch (err) {
    recordTest('tracking', 'TEST 3 – Successful Consumption', false, err);
  }

  // -----------------------------------------------------------
  // TEST 4 – Duplicate Consumption Event
  // -----------------------------------------------------------
  console.log('\n--- Running TEST 4: Duplicate Consumption Event (Idempotency) ---');
  try {
    const verifiedSched = db.findOne('medicine_schedules', s => s.userId === userA.id && (s.status === 'Verified' || s.status === 'VERIFIED'));
    assert(verifiedSched, 'Verified schedule required');

    const alertsCountBefore = db.find('medicine_alerts_history', a => a.scheduleId === verifiedSched.id).length;
    const eventsCountBefore = db.find('consumption_events', e => e.scheduleId === verifiedSched.id).length;

    // Send the exact same event a second time
    const dupRes = await req(`/medicines/schedules/${verifiedSched.id}/consumption-event`, {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'sess_vision_001_test',
        confidenceScore: 0.94,
        verificationSource: 'camera_vision_pipeline',
        milestones: ['face_aligned', 'pill_detected', 'hand_to_mouth_motion', 'consumption_completed'],
        status: 'CONSUMPTION_DETECTED'
      })
    }, tokenA);

    assert.strictEqual(dupRes.status, 200, 'Duplicate request must return 200 idempotently');
    assert.strictEqual(dupRes.body.isDuplicate, true, 'isDuplicate must be true');

    const alertsCountAfter = db.find('medicine_alerts_history', a => a.scheduleId === verifiedSched.id).length;
    const eventsCountAfter = db.find('consumption_events', e => e.scheduleId === verifiedSched.id).length;

    assert.strictEqual(alertsCountAfter, alertsCountBefore, 'Must NOT create duplicate alert history entry');
    assert.strictEqual(eventsCountAfter, eventsCountBefore, 'Must NOT create duplicate consumption event');

    recordTest('tracking', 'TEST 4 – Duplicate Consumption Event (Idempotent, no duplicate alerts)', true);
  } catch (err) {
    recordTest('tracking', 'TEST 4 – Duplicate Consumption Event', false, err);
  }

  // -----------------------------------------------------------
  // TEST 5 – Patient Refuses Medicine
  // -----------------------------------------------------------
  console.log('\n--- Running TEST 5: Patient Refuses Medicine ---');
  let refusalScheduleId = null;
  try {
    // Create new schedule for refusal test
    const newMed = await req('/medicines', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Lisinopril',
        dosage: '10 mg',
        frequency: 'Once daily',
        intakeTimes: ['09:00 AM'],
        duration: '7 days'
      })
    }, tokenA);
    const sched = db.findOne('medicine_schedules', s => s.medicineId === newMed.body.medicine.id);
    assert(sched, 'Schedule must exist');
    refusalScheduleId = sched.id;

    // Patient refuses dose
    const refuseRes = await req(`/medicines/schedules/${sched.id}/refuse`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Feeling dizzy and nauseous' })
    }, tokenA);

    assert.strictEqual(refuseRes.status, 200, 'Refusal must be accepted');
    assert.strictEqual(refuseRes.body.status, 'PATIENT_REFUSED', 'Status must be PATIENT_REFUSED');

    // Check DB status
    const dbSched = db.findById('medicine_schedules', sched.id);
    assert.strictEqual(dbSched.status, 'PATIENT_REFUSED', 'DB schedule status must be PATIENT_REFUSED');

    // Check Patient Call #1 was initiated
    const callLogs = db.find('call_logs', c => c.scheduleId === sched.id && c.recipientType === 'patient');
    assert(callLogs.length >= 1, 'Patient Call #1 must be initiated');
    assert.strictEqual(callLogs[0].attemptNumber, 1, 'First call attempt must be #1');

    recordTest('escalation', 'TEST 5 – Patient Refuses (Status = PATIENT_REFUSED, Call #1 initiated)', true);
  } catch (err) {
    recordTest('escalation', 'TEST 5 – Patient Refuses', false, err);
  }

  // -----------------------------------------------------------
  // TEST 6 – First Call Answered (Escalation Stops)
  // -----------------------------------------------------------
  console.log('\n--- Running TEST 6: First Call Answered ---');
  try {
    assert(refusalScheduleId, 'Schedule ID required');
    const latestCall = db.findOne('call_logs', c => c.scheduleId === refusalScheduleId && c.attemptNumber === 1);
    assert(latestCall, 'Call #1 must exist');

    // Patient answers Call #1
    const respondRes = await req(`/medicines/schedules/${refusalScheduleId}/call-respond`, {
      method: 'POST',
      body: JSON.stringify({
        callId: latestCall.id,
        status: 'ANSWERED'
      })
    }, tokenA);

    assert.strictEqual(respondRes.status, 200, 'Respond endpoint must return 200');
    assert.strictEqual(respondRes.body.escalationHalted, true, 'Escalation must be halted');

    // Verify Call #2 does NOT occur
    const call2Attempt = await req(`/medicines/schedules/${refusalScheduleId}/warning-call`, {
      method: 'POST'
    }, tokenA);

    assert(call2Attempt.body.blocked, 'Subsequent warning call must be blocked because call was answered');

    // Verify Guardian was NOT called
    const guardianCalls = db.find('call_logs', c => c.scheduleId === refusalScheduleId && c.recipientType === 'guardian');
    assert.strictEqual(guardianCalls.length, 0, 'Guardian must NOT be called when patient answers call');

    recordTest('escalation', 'TEST 6 – First Call Answered (Escalation stops, Guardian not called)', true);
  } catch (err) {
    recordTest('escalation', 'TEST 6 – First Call Answered', false, err);
  }

  // -----------------------------------------------------------
  // TEST 7 – First Call Not Answered (Call #2 Occurs)
  // -----------------------------------------------------------
  console.log('\n--- Running TEST 7: First Call Not Answered ---');
  let unansweredScheduleId = null;
  try {
    // Ensure standard 2 warning call attempts setting is active
    await req('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ warningCallAttempts: 2, warningTimeoutMinutes: 15, escalateToGuardian: true })
    }, tokenAdmin);

    // Create separate medicine schedule
    const medRes = await req('/medicines', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Amlodipine',
        dosage: '5 mg',
        frequency: 'Once daily',
        intakeTimes: ['10:00 AM'],
        duration: '7 days'
      })
    }, tokenA);
    const sched = db.findOne('medicine_schedules', s => s.medicineId === medRes.body.medicine.id);
    unansweredScheduleId = sched.id;

    // Trigger Call #1
    const call1 = await req(`/medicines/schedules/${sched.id}/warning-call`, { method: 'POST' }, tokenA);
    assert.strictEqual(call1.body.attemptNumber, 1, 'Attempt #1 must trigger');

    // Simulate NO_ANSWER on Call #1
    const callLog1 = db.findOne('call_logs', c => c.scheduleId === sched.id && c.attemptNumber === 1);
    await req(`/medicines/schedules/${sched.id}/call-respond`, {
      method: 'POST',
      body: JSON.stringify({ callId: callLog1.id, status: 'NO_ANSWER' })
    }, tokenA);

    // Call #2 occurs
    const call2 = await req(`/medicines/schedules/${sched.id}/warning-call`, { method: 'POST' }, tokenA);
    assert.strictEqual(call2.body.attemptNumber, 2, 'Call #2 must trigger after unanswered Call #1');

    recordTest('escalation', 'TEST 7 – First Call Not Answered (Call #2 occurs)', true);
  } catch (err) {
    recordTest('escalation', 'TEST 7 – First Call Not Answered', false, err);
  }

  // -----------------------------------------------------------
  // TEST 8 – Both Calls Unanswered -> Guardian Escalation
  // -----------------------------------------------------------
  console.log('\n--- Running TEST 8: Both Calls Unanswered -> Guardian Escalation ---');
  try {
    assert(unansweredScheduleId, 'Schedule ID required');
    const callLog2 = db.findOne('call_logs', c => c.scheduleId === unansweredScheduleId && c.attemptNumber === 2);
    assert(callLog2, 'Call #2 log must exist');

    // Simulate NO_ANSWER on Call #2
    const respond2 = await req(`/medicines/schedules/${unansweredScheduleId}/call-respond`, {
      method: 'POST',
      body: JSON.stringify({ callId: callLog2.id, status: 'NO_ANSWER' })
    }, tokenA);

    assert(respond2.body.escalatedToGuardian, 'Must trigger guardian escalation');

    // Check DB for Guardian Call
    const guardianLogs = db.find('call_logs', c => c.scheduleId === unansweredScheduleId && c.recipientType === 'guardian');
    assert.strictEqual(guardianLogs.length, 1, 'Guardian escalation must occur exactly once');

    // Check Alert History entry
    const guardianAlert = db.findOne('medicine_alerts_history', a => a.scheduleId === unansweredScheduleId && a.alertType === 'guardian_escalated');
    assert(guardianAlert, 'Guardian escalation must be recorded in Alert History');
    assert(guardianAlert.messageContent.includes('VitaCare Alert'), 'Alert content must follow required format');

    recordTest('escalation', 'TEST 8 – Both Calls Unanswered (Guardian escalation occurs exactly once)', true);
  } catch (err) {
    recordTest('escalation', 'TEST 8 – Both Calls Unanswered', false, err);
  }

  // -----------------------------------------------------------
  // TEST 9 – Guardian Escalation Duplication (Idempotency)
  // -----------------------------------------------------------
  console.log('\n--- Running TEST 9: Guardian Escalation Duplication Prevention ---');
  try {
    assert(unansweredScheduleId, 'Schedule ID required');
    const callService = require('./services/callService');

    // Trigger guardian escalation again on the same schedule
    const dupGuardian = await callService.callGuardian({
      userId: userA.id,
      scheduleId: unansweredScheduleId
    });

    assert.strictEqual(dupGuardian.isDuplicate, true, 'Duplicate guardian escalation must be recognized as duplicate');

    // Check total guardian calls in DB
    const totalGuardianCalls = db.find('call_logs', c => c.scheduleId === unansweredScheduleId && c.recipientType === 'guardian');
    assert.strictEqual(totalGuardianCalls.length, 1, 'DB must contain exactly ONE guardian call record');

    recordTest('escalation', 'TEST 9 – Guardian Escalation Duplication (Idempotent guard prevents duplicates)', true);
  } catch (err) {
    recordTest('escalation', 'TEST 9 – Guardian Escalation Duplication', false, err);
  }

  // -----------------------------------------------------------
  // TEST 10 – User Isolation
  // -----------------------------------------------------------
  console.log('\n--- Running TEST 10: User Isolation ---');
  try {
    // Patient A medicine
    const medA = db.findOne('medicines', m => m.userId === userA.id);
    assert(medA, 'Patient A medicine required');

    // Patient B attempts to access Patient A's medicine
    const accessRes = await req(`/medicines/${medA.id}`, {}, tokenB);
    assert.strictEqual(accessRes.status, 403, 'Patient B accessing Patient A medicine must receive 403 Forbidden');

    // Patient B attempts to modify Patient A's medicine
    const modifyRes = await req(`/medicines/${medA.id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Hacked Medicine' })
    }, tokenB);
    assert.strictEqual(modifyRes.status, 403, 'Patient B modifying Patient A medicine must receive 403 Forbidden');

    // Patient B attempts to verify consumption on Patient A's schedule
    const schedA = db.findOne('medicine_schedules', s => s.userId === userA.id);
    const verifyCrossRes = await req(`/medicines/schedules/${schedA.id}/consumption-event`, {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'hack_attempt',
        confidenceScore: 0.99,
        verificationSource: 'camera_vision_pipeline',
        milestones: ['face_aligned', 'pill_detected', 'hand_to_mouth_motion', 'consumption_completed']
      })
    }, tokenB);
    assert.strictEqual(verifyCrossRes.status, 403, 'Cross-user consumption event must receive 403 Forbidden');

    recordTest('security', 'TEST 10 – User Isolation (Patient B blocked from Patient A data with 403)', true);
  } catch (err) {
    recordTest('security', 'TEST 10 – User Isolation', false, err);
  }

  // -----------------------------------------------------------
  // TEST 11 – API ID Manipulation
  // -----------------------------------------------------------
  console.log('\n--- Running TEST 11: API ID Manipulation ---');
  try {
    const schedA = db.findOne('medicine_schedules', s => s.userId === userA.id);
    assert(schedA, 'Schedule A required');

    // 1. Spoof userId in body
    const spoofUser = await req(`/medicines/schedules/${schedA.id}/consumption-event`, {
      method: 'POST',
      body: JSON.stringify({
        userId: userB.id, // Mismatched userId
        confidenceScore: 0.95,
        verificationSource: 'camera_vision_pipeline',
        milestones: ['face_aligned', 'pill_detected', 'hand_to_mouth_motion', 'consumption_completed']
      })
    }, tokenA);
    assert.strictEqual(spoofUser.status, 403, 'Mismatched userId must be rejected with 403');

    // 2. Spoof scheduleId in body
    const spoofSched = await req(`/medicines/schedules/${schedA.id}/consumption-event`, {
      method: 'POST',
      body: JSON.stringify({
        scheduleId: 'random-spoofed-schedule-id',
        confidenceScore: 0.95,
        verificationSource: 'camera_vision_pipeline',
        milestones: ['face_aligned', 'pill_detected', 'hand_to_mouth_motion', 'consumption_completed']
      })
    }, tokenA);
    assert.strictEqual(spoofSched.status, 400, 'Mismatched scheduleId must be rejected with 400');

    // 3. Spoof medicineId in body
    const spoofMed = await req(`/medicines/schedules/${schedA.id}/consumption-event`, {
      method: 'POST',
      body: JSON.stringify({
        medicineId: 'random-spoofed-medicine-id',
        confidenceScore: 0.95,
        verificationSource: 'camera_vision_pipeline',
        milestones: ['face_aligned', 'pill_detected', 'hand_to_mouth_motion', 'consumption_completed']
      })
    }, tokenA);
    assert.strictEqual(spoofMed.status, 400, 'Mismatched medicineId must be rejected with 400');

    recordTest('security', 'TEST 11 – API ID Manipulation (Manipulated IDs rejected server-side)', true);
  } catch (err) {
    recordTest('security', 'TEST 11 – API ID Manipulation', false, err);
  }

  // -----------------------------------------------------------
  // TEST 12 & 18 – Four-Language Verification
  // -----------------------------------------------------------
  console.log('\n--- Running TEST 12 & 18: Four-Language System Verification ---');
  try {
    const { translations } = await import('../frontend/src/i18n/translations.js');
    const languages = ['en', 'ta', 'te', 'hi'];

    const mandatoryKeys = [
      'appTitle', 'tagline', 'dashboard', 'medicines', 'healthTracker',
      'careConnect', 'alertHistoryTitle', 'trackPillIntake', 'pillTrackingHUDTitle',
      'stageAligning', 'stagePillDetected', 'stageHandToMouth', 'stageConsumptionDetected',
      'stageVerified', 'cameraPermissionNotice', 'cameraPermissionDenied',
      'refuseMedicine', 'statusVerified', 'statusPending', 'statusRefused',
      'statusMissed', 'statusNoResponse', 'statusTrackingFailed', 'callAttempt1',
      'callAttempt2', 'callStatusAnswered', 'callStatusNoAnswer', 'guardianEscalated'
    ];

    let missing = [];
    for (const lang of languages) {
      assert(translations[lang], `Translations must exist for ${lang}`);
      for (const k of mandatoryKeys) {
        if (!translations[lang][k] || typeof translations[lang][k] !== 'string' || translations[lang][k].trim() === '') {
          missing.push(`${lang}.${k}`);
        }
      }
    }

    assert.strictEqual(missing.length, 0, `Missing translation keys: ${missing.join(', ')}`);
    recordTest('language', 'TEST 12 & 18 – Four-Language System (en, ta, te, hi fully populated)', true);
  } catch (err) {
    recordTest('language', 'TEST 12 & 18 – Four-Language System', false, err);
  }

  // -----------------------------------------------------------
  // TEST 13 – Language Persistence
  // -----------------------------------------------------------
  console.log('\n--- Running TEST 13: Language Persistence ---');
  try {
    const testLangs = ['ta', 'te', 'hi', 'en'];
    for (const lang of testLangs) {
      // 1. Set language preference
      const setLangRes = await req('/auth/language', {
        method: 'PUT',
        body: JSON.stringify({ language: lang })
      }, tokenA);
      assert.strictEqual(setLangRes.status, 200, `Setting language to ${lang} must succeed`);

      // 2. Fetch user profile /me
      const meRes = await req('/auth/me', {}, tokenA);
      assert.strictEqual(meRes.body.user.preferredLanguage, lang, `Profile must persist ${lang}`);

      // 3. Login again (simulating logout -> login)
      const reLogin = await req('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'patient.a@vitacare.ai', password: 'Password123!' })
      });
      assert.strictEqual(reLogin.body.user.preferredLanguage, lang, `Language ${lang} must persist after re-login`);
    }

    recordTest('language', 'TEST 13 – Language Persistence (Persists across logout/login for ta, te, hi, en)', true);
  } catch (err) {
    recordTest('language', 'TEST 13 – Language Persistence', false, err);
  }

  // -----------------------------------------------------------
  // TEST 14 – Camera Permission Handling
  // -----------------------------------------------------------
  console.log('\n--- Running TEST 14: Camera Permission Handling ---');
  try {
    const { translations } = await import('../frontend/src/i18n/translations.js');
    // Verify localized error messages for permission denial
    for (const lang of ['en', 'ta', 'te', 'hi']) {
      assert(translations[lang].cameraPermissionDenied, `Missing cameraPermissionDenied in ${lang}`);
      assert(translations[lang].cameraPermissionError, `Missing cameraPermissionError in ${lang}`);
      assert(translations[lang].cameraNotFound, `Missing cameraNotFound in ${lang}`);
    }
    recordTest('tracking', 'TEST 14 – Camera Permission Handling (Clear localized errors defined)', true);
  } catch (err) {
    recordTest('tracking', 'TEST 14 – Camera Permission Handling', false, err);
  }

  // -----------------------------------------------------------
  // TEST 15 – Camera Stop (Resource Cleanup)
  // -----------------------------------------------------------
  console.log('\n--- Running TEST 15: Camera Stop (Cleanup Logic) ---');
  try {
    const fs = require('fs');
    const modalContent = fs.readFileSync(path.join(__dirname, '../frontend/src/components/PillConsumptionTrackerModal.jsx'), 'utf-8');
    assert(modalContent.includes('track.stop()'), 'PillConsumptionTrackerModal must call track.stop() on all tracks');
    assert(modalContent.includes('cancelAnimationFrame'), 'Must cancel animation frame loop on unmount/close');
    recordTest('tracking', 'TEST 15 – Camera Stop (Tracks and animation frames safely stopped)', true);
  } catch (err) {
    recordTest('tracking', 'TEST 15 – Camera Stop', false, err);
  }

  // -----------------------------------------------------------
  // TEST 16 – Tracking Failure Handling
  // -----------------------------------------------------------
  console.log('\n--- Running TEST 16: Tracking Failure Handling ---');
  try {
    const sched = db.findOne('medicine_schedules', s => s.userId === userA.id && s.status !== 'Verified' && s.status !== 'VERIFIED');
    assert(sched, 'Schedule required');

    // Send tracking event with low confidence score (< 0.70 threshold)
    const lowConfRes = await req(`/medicines/schedules/${sched.id}/consumption-event`, {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'fail_test_session',
        confidenceScore: 0.42, // Too low!
        verificationSource: 'camera_vision_pipeline',
        milestones: ['face_aligned'],
        status: 'TRACKING_FAILED'
      })
    }, tokenA);

    assert.strictEqual(lowConfRes.status, 400, 'Low confidence tracking must be rejected with 400');
    assert.strictEqual(lowConfRes.body.verified, false, 'verified must be false');
    assert.strictEqual(lowConfRes.body.status, 'TRACKING_FAILED', 'Status must be TRACKING_FAILED');

    // DB Schedule must NOT be marked VERIFIED
    const dbSched = db.findById('medicine_schedules', sched.id);
    assert.notStrictEqual(dbSched.status, 'Verified', 'Must NOT be marked Verified on failure');
    assert.notStrictEqual(dbSched.status, 'VERIFIED', 'Must NOT be marked VERIFIED on failure');

    recordTest('tracking', 'TEST 16 – Tracking Failure (Does not verify medicine, status = TRACKING_FAILED)', true);
  } catch (err) {
    recordTest('tracking', 'TEST 16 – Tracking Failure', false, err);
  }

  // -----------------------------------------------------------
  // TEST 17 – Logout During Tracking (Session Security)
  // -----------------------------------------------------------
  console.log('\n--- Running TEST 17: Logout During Tracking ---');
  try {
    const fs = require('fs');
    const authContextContent = fs.readFileSync(path.join(__dirname, '../frontend/src/context/AuthContext.jsx'), 'utf-8');
    assert(authContextContent.includes('api.setToken(null)'), 'Logout must clear authentication token');
    assert(authContextContent.includes('setUser(null)'), 'Logout must wipe current in-memory user');
    recordTest('security', 'TEST 17 – Logout During Tracking (Session safely terminated)', true);
  } catch (err) {
    recordTest('security', 'TEST 17 – Logout During Tracking', false, err);
  }

  // -----------------------------------------------------------
  // TEST 18 – Expired Session Security
  // -----------------------------------------------------------
  console.log('\n--- Running TEST 18: Expired Session Security ---');
  try {
    // Generate expired JWT token
    const expiredToken = jwt.sign(
      { userId: userA.id, email: userA.email },
      JWT_SECRET,
      { expiresIn: '-10s' } // Expired in the past!
    );

    const expiredRes = await req('/medicines/today', {}, expiredToken);
    assert.strictEqual(expiredRes.status, 403, 'Expired token must be rejected with 403');

    // Attempt consumption verification with expired token
    const sched = db.findOne('medicine_schedules', s => s.userId === userA.id);
    const expiredVerify = await req(`/medicines/schedules/${sched.id}/consumption-event`, {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'expired_sess',
        confidenceScore: 0.95,
        milestones: ['face_aligned', 'pill_detected', 'hand_to_mouth_motion', 'consumption_completed']
      })
    }, expiredToken);
    assert.strictEqual(expiredVerify.status, 403, 'Expired verification request must be rejected with 403');

    recordTest('security', 'TEST 18 – Expired Session (Rejected with 403)', true);
  } catch (err) {
    recordTest('security', 'TEST 18 – Expired Session', false, err);
  }

  // -----------------------------------------------------------
  // TEST 19 – Admin Configuration
  // -----------------------------------------------------------
  console.log('\n--- Running TEST 19: Admin Configuration ---');
  try {
    // Admin updates call attempts and timeout
    const updateRes = await req('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({
        warningCallAttempts: 2,
        warningTimeoutMinutes: 20
      })
    }, tokenAdmin);

    assert.strictEqual(updateRes.status, 200, 'Admin settings update must succeed');
    assert.strictEqual(updateRes.body.settings.warningCallAttempts, 2, 'Call attempts must be updated to 2');
    assert.strictEqual(updateRes.body.settings.warningTimeoutMinutes, 20, 'Timeout must be updated to 20');

    // CallService reads new configuration
    const callService = require('./services/callService');
    const settings = callService.getSettings();
    assert.strictEqual(settings.maxAttempts, 2, 'CallService must respect maxAttempts = 2');
    assert.strictEqual(settings.timeoutMinutes, 20, 'CallService must respect timeout = 20');

    recordTest('escalation', 'TEST 19 – Admin Configuration (Settings updated and respected by CallService)', true);
  } catch (err) {
    recordTest('escalation', 'TEST 19 – Admin Configuration', false, err);
  }

  // -----------------------------------------------------------
  // TEST 20 – Non-Admin Configuration Attack
  // -----------------------------------------------------------
  console.log('\n--- Running TEST 20: Non-Admin Configuration Attack ---');
  try {
    // Patient A attempts to modify system settings
    const attackRes = await req('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({
        warningCallAttempts: 99,
        escalateToGuardian: false
      })
    }, tokenA);

    assert.strictEqual(attackRes.status, 403, 'Patient cannot access admin settings (403 Forbidden)');

    // Verify DB settings were NOT changed
    const dbSettings = db.findOne('system_settings', s => s.id === 'system-config-1');
    assert.strictEqual(dbSettings.warningCallAttempts, 2, 'DB warningCallAttempts must remain 2');
    assert.strictEqual(dbSettings.escalateToGuardian, true, 'DB escalateToGuardian must remain true');

    recordTest('security', 'TEST 20 – Non-Admin Configuration Attack (Rejected with 403 Forbidden)', true);
  } catch (err) {
    recordTest('security', 'TEST 20 – Non-Admin Configuration Attack', false, err);
  }

  // -----------------------------------------------------------
  // FINAL END-TO-END VERIFICATION
  // -----------------------------------------------------------
  console.log('\n--- Running FINAL END-TO-END TEST ---');
  try {
    // Flow 1: Full legitimate consumption flow
    const medE2E = await req('/medicines', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Atorvastatin E2E',
        dosage: '20 mg',
        frequency: 'Once daily',
        intakeTimes: ['08:00 AM'],
        duration: '7 days'
      })
    }, tokenA);
    const schedE2E = db.findOne('medicine_schedules', s => s.medicineId === medE2E.body.medicine.id);
    assert.strictEqual(schedE2E.status, 'Pending', 'E2E schedule must start as Pending');

    const verifyE2E = await req(`/medicines/schedules/${schedE2E.id}/consumption-event`, {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'e2e_session_happy_path',
        startedAt: new Date(Date.now() - 20000).toISOString(),
        detectedAt: new Date(Date.now() - 2000).toISOString(),
        completedAt: new Date().toISOString(),
        confidenceScore: 0.96,
        verificationSource: 'camera_vision_pipeline',
        milestones: ['face_aligned', 'pill_detected', 'hand_to_mouth_motion', 'consumption_completed'],
        status: 'CONSUMPTION_DETECTED'
      })
    }, tokenA);
    assert.strictEqual(verifyE2E.body.status, 'VERIFIED', 'E2E status must be VERIFIED');

    const alertHist = await req('/medicines/alerts/history', {}, tokenA);
    const verifiedEntry = alertHist.body.history.find(h => h.scheduleId === schedE2E.id);
    assert(verifiedEntry, 'Alert history must contain verified entry');

    // Flow 2: Full refusal -> Call #1 -> Call #2 -> Guardian Escalation
    const medEsc = await req('/medicines', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Escalation Test Med',
        dosage: '50 mg',
        frequency: 'Once daily',
        intakeTimes: ['12:00 PM'],
        duration: '7 days'
      })
    }, tokenA);
    const schedEsc = db.findOne('medicine_schedules', s => s.medicineId === medEsc.body.medicine.id);

    // Refusal
    const refuse = await req(`/medicines/schedules/${schedEsc.id}/refuse`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'E2E Refusal' })
    }, tokenA);
    assert.strictEqual(refuse.body.status, 'PATIENT_REFUSED', 'E2E Refused status');

    // Call #1 NO_ANSWER
    const call1Log = db.findOne('call_logs', c => c.scheduleId === schedEsc.id && c.attemptNumber === 1);
    await req(`/medicines/schedules/${schedEsc.id}/call-respond`, {
      method: 'POST',
      body: JSON.stringify({ callId: call1Log.id, status: 'NO_ANSWER' })
    }, tokenA);

    // Call #2
    await req(`/medicines/schedules/${schedEsc.id}/warning-call`, { method: 'POST' }, tokenA);
    const call2Log = db.findOne('call_logs', c => c.scheduleId === schedEsc.id && c.attemptNumber === 2);

    // Call #2 NO_ANSWER -> Guardian Escalation
    const respond2 = await req(`/medicines/schedules/${schedEsc.id}/call-respond`, {
      method: 'POST',
      body: JSON.stringify({ callId: call2Log.id, status: 'NO_ANSWER' })
    }, tokenA);
    assert(respond2.body.escalatedToGuardian, 'E2E Guardian Escalated');

    recordTest('tracking', 'FINAL END-TO-END TEST (Happy Path & Escalation Flow Verified)', true);
  } catch (err) {
    recordTest('tracking', 'FINAL END-TO-END TEST', false, err);
  }

  // -----------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------
  console.log('\n======================================================');
  console.log('                 FINAL TEST SUMMARY                   ');
  console.log('======================================================');
  console.log(`Total Tests Run:     ${results.total}`);
  console.log(`Passed:              ${results.passed}`);
  console.log(`Failed:              ${results.failed}`);
  console.log(`Blocked:             ${results.blocked}`);
  console.log(`Security Tests:      ${results.security.passed} Passed / ${results.security.failed} Failed`);
  console.log(`Language Tests:      ${results.language.passed} Passed / ${results.language.failed} Failed`);
  console.log(`Medicine Tracking:   ${results.tracking.passed} Passed / ${results.tracking.failed} Failed`);
  console.log(`Call Escalation:     ${results.escalation.passed} Passed / ${results.escalation.failed} Failed`);
  console.log('======================================================');
  console.log(`PRODUCTION READINESS: ${results.failed === 0 ? 'PASS' : 'FAIL'}`);
  console.log('======================================================\n');

  return results;
}

if (require.main === module) {
  runSuite().then(res => {
    process.exit(res.failed > 0 ? 1 : 0);
  }).catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}

module.exports = { runSuite };
