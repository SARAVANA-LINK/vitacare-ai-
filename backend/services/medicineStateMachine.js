/**
 * VitaCare Medicine Status State Machine
 * Enforces strict medical adherence state progression and rejects unauthorized direct status mutations.
 */

const MEDICINE_STATUS = {
  SCHEDULED: 'SCHEDULED',
  PENDING: 'PENDING',
  TRACKING: 'TRACKING',
  CONSUMPTION_DETECTED: 'CONSUMPTION_DETECTED',
  VERIFIED: 'VERIFIED',
  PATIENT_REFUSED: 'PATIENT_REFUSED',
  CALL_ATTEMPT_1: 'CALL_ATTEMPT_1',
  CALL_ATTEMPT_2: 'CALL_ATTEMPT_2',
  GUARDIAN_ESCALATION: 'GUARDIAN_ESCALATION',
  MISSED: 'MISSED',
  REFUSED: 'REFUSED',
  NO_RESPONSE: 'NO_RESPONSE',
  TRACKING_FAILED: 'TRACKING_FAILED',
  SKIPPED: 'SKIPPED'
};

// Map of permitted state transitions
const VALID_TRANSITIONS = {
  [MEDICINE_STATUS.SCHEDULED]: [
    MEDICINE_STATUS.PENDING,
    MEDICINE_STATUS.TRACKING,
    MEDICINE_STATUS.PATIENT_REFUSED,
    MEDICINE_STATUS.SKIPPED
  ],
  [MEDICINE_STATUS.PENDING]: [
    MEDICINE_STATUS.TRACKING,
    MEDICINE_STATUS.PATIENT_REFUSED,
    MEDICINE_STATUS.CALL_ATTEMPT_1,
    MEDICINE_STATUS.NO_RESPONSE,
    MEDICINE_STATUS.MISSED,
    MEDICINE_STATUS.SKIPPED
    // Note: Direct PENDING -> VERIFIED is strictly disallowed
  ],
  [MEDICINE_STATUS.TRACKING]: [
    MEDICINE_STATUS.CONSUMPTION_DETECTED,
    MEDICINE_STATUS.TRACKING_FAILED,
    MEDICINE_STATUS.PENDING,
    MEDICINE_STATUS.PATIENT_REFUSED
  ],
  [MEDICINE_STATUS.CONSUMPTION_DETECTED]: [
    MEDICINE_STATUS.VERIFIED
  ],
  [MEDICINE_STATUS.PATIENT_REFUSED]: [
    MEDICINE_STATUS.CALL_ATTEMPT_1,
    MEDICINE_STATUS.REFUSED,
    MEDICINE_STATUS.TRACKING
  ],
  [MEDICINE_STATUS.CALL_ATTEMPT_1]: [
    MEDICINE_STATUS.CALL_ATTEMPT_2,
    MEDICINE_STATUS.TRACKING,
    MEDICINE_STATUS.CONSUMPTION_DETECTED,
    MEDICINE_STATUS.VERIFIED,
    MEDICINE_STATUS.NO_RESPONSE,
    MEDICINE_STATUS.PENDING
  ],
  [MEDICINE_STATUS.CALL_ATTEMPT_2]: [
    MEDICINE_STATUS.GUARDIAN_ESCALATION,
    MEDICINE_STATUS.TRACKING,
    MEDICINE_STATUS.CONSUMPTION_DETECTED,
    MEDICINE_STATUS.VERIFIED,
    MEDICINE_STATUS.MISSED,
    MEDICINE_STATUS.NO_RESPONSE,
    MEDICINE_STATUS.PENDING
  ],
  [MEDICINE_STATUS.GUARDIAN_ESCALATION]: [
    MEDICINE_STATUS.MISSED,
    MEDICINE_STATUS.VERIFIED
  ],
  [MEDICINE_STATUS.TRACKING_FAILED]: [
    MEDICINE_STATUS.TRACKING,
    MEDICINE_STATUS.PENDING,
    MEDICINE_STATUS.CALL_ATTEMPT_1,
    MEDICINE_STATUS.PATIENT_REFUSED
  ],
  [MEDICINE_STATUS.VERIFIED]: [], // Terminal state
  [MEDICINE_STATUS.MISSED]: [],
  [MEDICINE_STATUS.REFUSED]: [],
  [MEDICINE_STATUS.NO_RESPONSE]: [],
  [MEDICINE_STATUS.SKIPPED]: []
};

class MedicineStateMachine {
  constructor() {
    this.STATUS = MEDICINE_STATUS;
  }

  normalizeStatus(status) {
    if (!status) return MEDICINE_STATUS.PENDING;
    const upper = String(status).trim().toUpperCase();
    if (upper === 'TAKEN') return MEDICINE_STATUS.VERIFIED;
    if (upper === 'VERIFIED') return MEDICINE_STATUS.VERIFIED;
    if (upper === 'PENDING') return MEDICINE_STATUS.PENDING;
    if (upper === 'SCHEDULED') return MEDICINE_STATUS.SCHEDULED;
    if (upper === 'MISSED') return MEDICINE_STATUS.MISSED;
    if (upper === 'SKIPPED') return MEDICINE_STATUS.SKIPPED;
    if (upper === 'REFUSED') return MEDICINE_STATUS.REFUSED;
    if (upper === 'PATIENT_REFUSED') return MEDICINE_STATUS.PATIENT_REFUSED;
    if (upper === 'TRACKING') return MEDICINE_STATUS.TRACKING;
    if (upper === 'TRACKING_FAILED') return MEDICINE_STATUS.TRACKING_FAILED;
    if (upper === 'CONSUMPTION_DETECTED') return MEDICINE_STATUS.CONSUMPTION_DETECTED;
    if (upper === 'NO_RESPONSE') return MEDICINE_STATUS.NO_RESPONSE;
    return upper;
  }

  canTransition(currentStatus, targetStatus) {
    const from = this.normalizeStatus(currentStatus);
    const to = this.normalizeStatus(targetStatus);

    if (from === to) return true; // Idempotent same-state is allowed

    const allowed = VALID_TRANSITIONS[from];
    if (!allowed) return false;
    return allowed.includes(to);
  }

  assertTransition(currentStatus, targetStatus) {
    const from = this.normalizeStatus(currentStatus);
    const to = this.normalizeStatus(targetStatus);

    if (from === to) return true;

    // Direct bypass check: PENDING -> VERIFIED without tracking / detection
    if ((from === MEDICINE_STATUS.PENDING || from === MEDICINE_STATUS.SCHEDULED) && to === MEDICINE_STATUS.VERIFIED) {
      const err = new Error(`Direct transition from ${from} to ${to} is strictly rejected. Medicine status can ONLY be verified via camera-based pill consumption tracking.`);
      err.code = 'INVALID_MANUAL_TRANSITION';
      err.statusCode = 403;
      throw err;
    }

    if (!this.canTransition(from, to)) {
      const err = new Error(`Invalid state transition: cannot transition medicine schedule from ${from} to ${to}.`);
      err.code = 'INVALID_STATE_TRANSITION';
      err.statusCode = 400;
      throw err;
    }

    return true;
  }
}

module.exports = new MedicineStateMachine();
