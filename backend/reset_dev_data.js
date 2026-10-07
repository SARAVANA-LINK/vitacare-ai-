/**
 * VitaCare AI - Step 0 Development Environment Data Reset Script
 * Clears old test/demo data, safeguards production patient data,
 * and sets up fresh test accounts for Step 1 testing.
 */

const db = require('./db');

function runReset() {
  console.log('================================================================');
  console.log('     VITACARE AI - STEP 0 DEV/TEST DATA RESET & INITIALIZATION  ');
  console.log('================================================================\n');

  try {
    const report = db.resetDevelopmentDatabase();

    console.log('\n--- VERIFICATION CHECKS ---');
    console.log(`1. Old test/demo data cleared:       [ ${report.oldTestDataCleared} ]`);
    console.log(`2. Fresh test environment created:   [ ${report.freshTestEnvironmentCreated} ]`);
    console.log(`3. Production data protected:        [ ${report.productionDataProtected} ]\n`);

    console.log('--- POST-RESET DATABASE RECORD COUNTS ---');
    console.table(report.collectionCounts);

    console.log('\n--- FRESH TEST ACCOUNTS CREATED ---');
    console.table(report.freshUsers);

    console.log('\n--- PROTECTED REAL / PRODUCTION ACCOUNTS ---');
    console.table(report.protectedProductionUsers);

    console.log('\n================================================================');
    if (report.success) {
      console.log('STATUS: PASS - Ready for Step 1 Implementation & Testing');
    } else {
      console.log('STATUS: FAIL - One or more verification checks failed');
    }
    console.log('================================================================\n');

    return report;
  } catch (err) {
    console.error('CRITICAL ERROR during data reset:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  const result = runReset();
  process.exit(result.success ? 0 : 1);
}

module.exports = { runReset };
