const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'data', 'vitacare_db.json');

const INITIAL_STATE = {
  users: [],
  user_profiles: [],
  guardians: [],
  prescriptions: [],
  prescription_items: [],
  medicines: [],
  medicine_schedules: [],
  medicine_adherence_logs: [],
  health_reports: [],
  report_versions: [],
  extracted_health_values: [],
  vitals: [],
  medical_timeline: [],
  careconnect_sessions: [],
  emergency_contacts: [],
  notifications: [],
  ai_conversations: [],
  medicine_alerts_history: [],
  alert_history: [],
  consumption_events: [],
  call_logs: [],
  sms_logs: [],
  sms_triggers: [],
  sms_templates: [],
  translations: [],
  system_settings: [],
  cms_modules: [],
  cms_cards: [],
  cms_announcements: [],
  cms_content: []
};

class JsonDatabase {
  constructor() {
    this.data = INITIAL_STATE;
    this.lastLoadedMtime = 0;
    this.init();
  }

  checkReload() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const stat = fs.statSync(DB_PATH);
        if (stat.mtimeMs > (this.lastLoadedMtime || 0)) {
          const raw = fs.readFileSync(DB_PATH, 'utf-8');
          this.data = JSON.parse(raw);
          for (const key of Object.keys(INITIAL_STATE)) {
            if (!this.data[key]) {
              this.data[key] = [];
            }
          }
          this.lastLoadedMtime = stat.mtimeMs;
        }
      }
    } catch (err) {
      // Ignore transient file lock / parse errors
    }
  }

  reload() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(raw);
        for (const key of Object.keys(INITIAL_STATE)) {
          if (!this.data[key]) {
            this.data[key] = [];
          }
        }
        const stat = fs.statSync(DB_PATH);
        this.lastLoadedMtime = stat.mtimeMs;
      }
    } catch (err) {
      console.error('Error reloading database:', err);
    }
  }

  init() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure all collections exist
        for (const key of Object.keys(INITIAL_STATE)) {
          if (!this.data[key]) {
            this.data[key] = [];
          }
        }
        const stat = fs.statSync(DB_PATH);
        this.lastLoadedMtime = stat.mtimeMs;
        this.ensureAdminAndSettings();
      } else {
        this.data = JSON.parse(JSON.stringify(INITIAL_STATE));
        this.ensureAdminAndSettings();
        this.save();
      }
    } catch (err) {
      console.error('Failed to load database file, reinitializing empty db:', err);
      this.data = JSON.parse(JSON.stringify(INITIAL_STATE));
      this.ensureAdminAndSettings();
      this.save();
    }
  }

  ensureAdminAndSettings() {
    // 1. Root Administrator
    const adminExists = this.data.users.some(u => u.email === 'admin@vitacare.ai');
    if (!adminExists) {
      const salt = bcrypt.genSaltSync(10);
      const adminHash = bcrypt.hashSync('AdminSecure2026!', salt);
      const adminUser = {
        id: 'admin-root-001',
        email: 'admin@vitacare.ai',
        passwordHash: adminHash,
        name: 'VitaCare Chief Administrator',
        role: 'admin',
        age: 42,
        gender: 'Not specified',
        bloodGroup: 'O+',
        preferredLanguage: 'en',
        emergencyPhone: '+1 (800) 555-0199',
        createdAt: new Date().toISOString()
      };
      this.data.users.push(adminUser);
    } else {
      // Ensure role is admin
      this.data.users = this.data.users.map(u => {
        if (u.email === 'admin@vitacare.ai') {
          return { ...u, role: 'admin' };
        }
        return u;
      });
    }

    // Ensure developer/evaluator email also has admin privileges and is tagged as protected production account
    this.data.users = this.data.users.map(u => {
      if (u.email === 'saravanakumar.s16072007@gmail.com') {
        return { ...u, role: 'admin', isProduction: true, environment: 'production' };
      }
      return u;
    });

    // 2. System Settings
    if (!this.data.system_settings || this.data.system_settings.length === 0) {
      this.data.system_settings = [
        {
          id: 'system-config-1',
          websiteName: 'VitaCare AI',
          logoUrl: '',
          supportPhone: '+1 (800) 555-VITA',
          supportEmail: 'support@vitacare.ai',
          warningCallAttempts: 2,
          warningTimeoutMinutes: 15,
          escalateToGuardian: true,
          defaultLanguage: 'en',
          careConnectEnabled: true,
          allowPatientRegistration: true,
          updatedAt: new Date().toISOString()
        }
      ];
    }

    // 3. CMS Dynamic Modules
    if (!this.data.cms_modules || this.data.cms_modules.length === 0) {
      this.data.cms_modules = [
        { id: 'mod-1', key: 'quick_stats', title: 'Clinical KPI & Metric Cards', description: 'Header stat cards showing adherence, active medicines, vitals, and reports', isEnabled: true, orderIndex: 1 },
        { id: 'mod-2', key: 'announcements', title: 'System Announcements Banner', description: 'Admin broadcast alert banner at top of dashboard', isEnabled: true, orderIndex: 2 },
        { id: 'mod-3', key: 'next_dose', title: 'Upcoming Medication Dose Card', description: 'Real-time card displaying next due medicine and countdown', isEnabled: true, orderIndex: 3 },
        { id: 'mod-4', key: 'today_schedules', title: 'Today Dose Schedule Timeline', description: 'Interactive schedule list with dynamic intake verification', isEnabled: true, orderIndex: 4 },
        { id: 'mod-5', key: 'vitals_summary', title: 'Verified Physiological Biomarkers', description: 'Biomarker intervals (Glucose, BP, SpO2, Hemoglobin)', isEnabled: true, orderIndex: 5 },
        { id: 'mod-6', key: 'health_status', title: 'Clinical Health Status Insights', description: 'Data-driven overview of physiological parameters', isEnabled: true, orderIndex: 6 },
        { id: 'mod-7', key: 'careconnect_banner', title: 'CareConnect Video Supervision Hub', description: 'Consent-based caregiver video adherence check-in banner', isEnabled: true, orderIndex: 7 },
        { id: 'mod-8', key: 'recent_reports', title: 'Recent Diagnostic Lab Reports', description: 'Cards for lab panels and diagnostic documents', isEnabled: true, orderIndex: 8 },
        { id: 'mod-9', key: 'timeline_activity', title: 'Medical Timeline & Audit Feed', description: 'Chronological timeline of doses, uploads, and vitals', isEnabled: true, orderIndex: 9 }
      ];
    }

    // 4. CMS Dynamic Metric Cards
    if (!this.data.cms_cards || this.data.cms_cards.length === 0) {
      this.data.cms_cards = [
        { id: 'card-1', key: 'adherence_stat', title: 'Adherence Rate', subtitle: '30-Day Medication Adherence', value: '100%', delta: 'Ready for intake logging', badgeColor: 'green', isVisible: true, orderIndex: 1 },
        { id: 'card-2', key: 'active_meds_stat', title: 'Active Prescriptions', subtitle: 'Current Clinical Regimen', value: 'Active', delta: 'Managed digitally', badgeColor: 'blue', isVisible: true, orderIndex: 2 },
        { id: 'card-3', key: 'verified_doses_stat', title: 'Doses Verified Today', subtitle: 'Intake Confirmed by Patient', value: '0 Verified', delta: 'Pending logs', badgeColor: 'orange', isVisible: true, orderIndex: 3 },
        { id: 'card-4', key: 'reports_stat', title: 'Diagnostic Reports', subtitle: 'Verified Clinical Records', value: 'Ready', delta: 'OCR extraction enabled', badgeColor: 'purple', isVisible: true, orderIndex: 4 }
      ];
    }

    // 5. CMS Announcements
    if (!this.data.cms_announcements || this.data.cms_announcements.length === 0) {
      this.data.cms_announcements = [
        { id: 'ann-1', title: 'Welcome to VitaCare AI Health Copilot', message: 'Secure multilingual patient portal active. Register your account and configure guardian SMS notifications.', alertType: 'info', isPublished: true, priority: 1, createdAt: new Date().toISOString() }
      ];
    }

    // 6. CMS Editable Content & Text Dictionary
    if (!this.data.cms_content || this.data.cms_content.length === 0) {
      this.data.cms_content = [
        { id: 'cnt-1', key: 'hero_title', title: 'Dashboard Header Title', value: 'Welcome back to your Clinical Health Hub', category: 'General' },
        { id: 'cnt-2', key: 'hero_subtitle', title: 'Dashboard Header Subtitle', value: 'Track scheduled medications, verify doses, and monitor diagnostic biomarkers.', category: 'General' },
        { id: 'cnt-3', key: 'clinic_name', title: 'Healthcare Center Name', value: 'VitaCare Integrated Healthcare Center', category: 'Branding' },
        { id: 'cnt-4', key: 'hotline_phone', title: 'Emergency / Support Hotline', value: '+1 (800) 555-VITA (8482)', category: 'Support' },
        { id: 'cnt-5', key: 'emergency_disclaimer', title: 'Emergency Disclaimer Text', value: 'For severe symptoms or immediate emergency, press the SOS button or contact 911 immediately.', category: 'Legal' }
      ];
    }

    // 7. Seed Editable Translations Table (for admin management)
    if (!this.data.translations || this.data.translations.length === 0) {
      this.seedInitialTranslations();
    }

    this.save();
  }

  ensureTestUsers() {
    const salt = bcrypt.genSaltSync(10);
    const patientPasswordHash = bcrypt.hashSync('Password123!', salt);

    // Patient A
    const patientA = this.data.users.find(u => u.email === 'patient.a@vitacare.ai');
    if (!patientA) {
      this.data.users.push({
        id: 'user-patient-a',
        email: 'patient.a@vitacare.ai',
        passwordHash: patientPasswordHash,
        name: 'Patient A',
        role: 'patient',
        age: 62,
        gender: 'Male',
        bloodGroup: 'A+',
        preferredLanguage: 'en',
        emergencyPhone: '+1 (555) 111-2222',
        environment: 'development',
        isProduction: false,
        createdAt: new Date().toISOString()
      });
      this.data.user_profiles.push({
        id: 'profile-patient-a',
        userId: 'user-patient-a',
        allergies: 'Penicillin',
        chronicConditions: 'Hypertension',
        preferredLanguage: 'en',
        createdAt: new Date().toISOString()
      });
      this.data.guardians.push({
        id: 'guardian-patient-a',
        userId: 'user-patient-a',
        name: 'Guardian A',
        phoneNumber: '+91 98765 11111',
        relationship: 'Parent',
        isPrimary: true,
        notifyOnMissed: true,
        allowMedicationEscalation: true,
        allowEmergencyNotification: true,
        allowCareConnectAccess: true,
        allowHealthView: true,
        createdAt: new Date().toISOString()
      });
    }

    // Patient B
    const patientB = this.data.users.find(u => u.email === 'patient.b@vitacare.ai');
    if (!patientB) {
      this.data.users.push({
        id: 'user-patient-b',
        email: 'patient.b@vitacare.ai',
        passwordHash: patientPasswordHash,
        name: 'Patient B',
        role: 'patient',
        age: 58,
        gender: 'Female',
        bloodGroup: 'B+',
        preferredLanguage: 'en',
        emergencyPhone: '+1 (555) 333-4444',
        environment: 'development',
        isProduction: false,
        createdAt: new Date().toISOString()
      });
      this.data.user_profiles.push({
        id: 'profile-patient-b',
        userId: 'user-patient-b',
        allergies: 'None',
        chronicConditions: 'Type 2 Diabetes',
        preferredLanguage: 'en',
        createdAt: new Date().toISOString()
      });
      this.data.guardians.push({
        id: 'guardian-patient-b',
        userId: 'user-patient-b',
        name: 'Guardian B',
        phoneNumber: '+91 98765 22222',
        relationship: 'Spouse',
        isPrimary: true,
        notifyOnMissed: true,
        allowMedicationEscalation: true,
        allowEmergencyNotification: true,
        allowCareConnectAccess: true,
        allowHealthView: true,
        createdAt: new Date().toISOString()
      });
    }
  }

  seedInitialTranslations() {
    const defaultTranslations = [
      { key: 'appTitle', en: 'VitaCare AI', ta: 'வைட்டாகேர் AI', te: 'వైటాకేర్ AI', ml: 'വൈറ്റകെയർ AI', kn: 'ವೈಟಾಕೇರ್ AI', hi: 'वाइटाकेयर AI', bn: 'ভিটাকেয়ার এআই', mr: 'व्हिटाकेअर AI', category: 'Brand' },
      { key: 'tagline', en: 'Your Health. Organized. Intelligent. Connected.', ta: 'உங்கள் நல்வாழ்வு. நேர்த்தியானது. அறிவார்ந்தது. இணைக்கப்பட்டது.', te: 'మీ ఆరోగ్యం. వ్యవస్థీకృతం. తెలివైనది. అనుసంధానించబడింది.', ml: 'നിങ്ങളുടെ ആരോഗ്യം. സംഘടിതവും ബുദ്ധിപരവും ബന്ധിപ്പിച്ചതും.', kn: 'ನಿಮ್ಮ ಆರೋಗ್ಯ. ಸಂಘಟಿತ. ಬುದ್ಧಿವಂತ. ಸಂಪರ್ಕಿತ.', hi: 'आपका स्वास्थ्य। व्यवस्थित। बुद्धिमान। जुड़ा हुआ।', bn: 'আপনার স্বাস্থ্য। সুবিন্যস্ত। বুদ্ধিমান। সংযুক্ত।', mr: 'तुमचे आरोग्य. सुव्यवस्थित. बुद्धिमान. जोडलेले.', category: 'Brand' },
      { key: 'dashboard', en: 'Dashboard', ta: 'முகப்பு பலகை', te: 'డాష్‌బోర్డ్', ml: 'ഡാഷ്‌ബോർഡ്', kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', hi: 'डैशबोर्ड', bn: 'ড্যাশবোর্ড', mr: 'डॅशबोर्ड', category: 'Navigation' },
      { key: 'reports', en: 'Medical Reports', ta: 'மருத்துவ அறிக்கைகள்', te: 'ఆరోగ్య నివేదికలు', ml: 'മെഡിക്കൽ റിപ്പോർട്ടുകൾ', kn: 'ವೈದ್ಯಕೀಯ ವರದಿಗಳು', hi: 'स्वास्थ्य रिपोर्ट', bn: 'মেডিকেল রিপোর্ট', mr: 'वैद्यकीय अहवाल', category: 'Navigation' },
      { key: 'healthTracker', en: 'Health Tracker', ta: 'ஆரோக்கிய கண்காணிப்பாளர்', te: 'హెల్త్ ట్రాకర్', ml: 'ഹെൽത്ത് ട്രാക്കർ', kn: 'ಹೆಲ್ತ್ ಟ್ರ್ಯಾಕರ್', hi: 'हेल्थ ट्रैकर', bn: 'হেলথ ট্র্যাকার', mr: 'हेल्थ ट्रॅकर', category: 'Navigation' },
      { key: 'trends', en: 'Trends & Analytics', ta: 'முன்னேற்றப் போக்குகள்', te: 'ట్రెండ్స్', ml: 'ട്രെൻഡുകൾ', kn: 'ಟ್ರೆಂಡ್‌ಗಳು', hi: 'प्रवृत्ति (ट्रेंड्स)', bn: 'ট্রেন্ডস ও বিশ্লেষণ', mr: 'ट्रेंड्स आणि विश्लेषण', category: 'Navigation' },
      { key: 'medicines', en: 'Medications', ta: 'மருந்துகள்', te: 'మందులు', ml: 'മരുന്നുകൾ', kn: 'ಔಷಧಗಳು', hi: 'दवाइयाँ', bn: 'ওষুধপত্র', mr: 'औषधे', category: 'Navigation' },
      { key: 'careConnect', en: 'CareConnect Video', ta: 'கேர்கனெக்ட்', te: 'కేర్‌కనెక్ట్', ml: 'കെയർ കണക്റ്റ്', kn: 'ಕೇರ್‌ಕನೆಕ್ಟ್', hi: 'केयरकनेक्ट', bn: 'কেয়ারকানেক্ট', mr: 'কেअरकनेक्ट', category: 'Navigation' },
      { key: 'adherence', en: 'Medication Adherence', ta: 'மருந்து கடைபிடிப்பு', te: 'ఔషధ నియమం', ml: 'മരുന്ന് പാലനം', kn: 'ಔಷಧ ನಿಯಮ', hi: 'दवा अनुपालन', bn: 'ওষুধ আনুগত্য', mr: 'औषध अनुपालन', category: 'Navigation' },
      { key: 'timeline', en: 'Medical Timeline', ta: 'காலவரிசை', te: 'టైమ్‌లైன்', ml: 'ടൈംലൈൻ', kn: 'ಟೈಮ್‌ಲೈನ್', hi: 'टाइमलाइन', bn: 'টাইমলাইন', mr: 'टाइमलाइन', category: 'Navigation' },
      { key: 'aiCopilot', en: 'AI Health Copilot', ta: 'AI வழிகாட்டி', te: 'AI కోపైலட்', ml: 'AI കോപൈലറ്റ്', kn: 'AI ಕೋಪೈಲಟ್', hi: 'AI कोपायलट', bn: 'এআই কোপাইলট', mr: 'AI कोपायलट', category: 'Navigation' },
      { key: 'guardians', en: 'Guardians & SMS', ta: 'பாதுகாவலர்கள் & SMS', te: 'రక్షకులు & SMS', ml: 'രക്ഷാകർത്താക്കൾ & SMS', kn: 'ಪೋಷಕರು & SMS', hi: 'अभिभावक एवं SMS', bn: 'অভিভাবক ও এসএমএস', mr: 'पालक आणि SMS', category: 'Navigation' },
      { key: 'adminPanel', en: 'Admin Portal', ta: 'நிர்வாக பலகை', te: 'అడ్మిన్ ప్యానెల్', ml: 'അഡ്മിൻ പാനൽ', kn: 'ಅಡ್ಮಿನ್ ಪ್ಯಾನೆಲ್', hi: 'एडमिन पैनल', bn: 'অ্যাডমিন প্যানেল', mr: 'अ‍ॅडमिन पॅनेल', category: 'Navigation' },
      { key: 'confirmIntake', en: 'Confirm Intake', ta: 'உட்கொண்டதை உறுதிசெய்', te: 'తీసుకున్నట్లు నిర్ధారించండి', ml: 'കഴിച്ചുവെന്ന് സ്ഥിരീകരിക്കുക', kn: 'ತೆಗೆದುಕೊಂಡಿದ್ದನ್ನು ದೃಢೀಕರಿಸಿ', hi: 'दवा लेने की पुष्टि करें', bn: 'সেবন নিশ্চিত করুন', mr: 'औषध घेतल्याची पुष्टी करा', category: 'Actions' },
      { key: 'takeNow', en: 'TAKE NOW', ta: 'இப்போது உட்கொள்', te: 'இప్పుడే తీసుకోండి', ml: 'ഇപ്പോൾ കഴിക്കുക', kn: 'ಈಗ ತೆಗೆದುಕೊಳ್ಳಿ', hi: 'अभी लें', bn: 'এখনই নিন', mr: 'आत्ता घ्या', category: 'Actions' },
      { key: 'verified', en: 'Verified', ta: 'சரிபார்க்கப்பட்டது', te: 'ధృవీకరించబడింది', ml: 'സ്ഥിരീകരിച്ചു', kn: 'ದೃಢೀಕರಿಸಲಾಗಿದೆ', hi: 'सत्यापित (Verified)', bn: 'যাচাইকৃত', mr: 'पडताळणी झाली', category: 'Status' },
      { key: 'pending', en: 'Pending', ta: 'நிலுவையில் உள்ளது', te: 'పెండింగ్‌లో ఉంది', ml: 'തീർപ്പാക്കാത്തത്', kn: 'ಬಾಕಿ ಉಳಿದಿದೆ', hi: 'लंबित (Pending)', bn: 'ಮুলತುಬಿ', mr: 'प्रलंबित', category: 'Status' },
      { key: 'emergencySos', en: 'EMERGENCY SOS', ta: 'அவசர SOS', te: 'அत्यవసర SOS', ml: 'അടിയന്തര SOS', kn: 'ತುರ್ತು SOS', hi: 'आपातकालीन SOS', bn: 'জরুরি এসওএস', mr: 'आणीबाणी SOS', category: 'Emergency' }
    ];
    this.data.translations = defaultTranslations;
  }

  /**
   * STEP 0: RESET DEVELOPMENT DATABASE
   * Completely clears all test/demo application data in development/test environment.
   * Safeguards production patient data, protects real accounts, and creates fresh test accounts.
   */
  resetDevelopmentDatabase(options = {}) {
    // 0. DATA ISOLATION ENFORCEMENT
    const isProductionEnv = process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production';
    if (isProductionEnv) {
      throw new Error('SECURITY VIOLATION: Database reset is strictly prohibited in the PRODUCTION environment. Production patient data is protected.');
    }

    console.log('[VitaCare DB] Executing Step 0 Development Data Reset...');

    // 1. Safeguard production / real accounts
    const preservedProductionUsers = this.data.users.filter(u => 
      u.isProduction === true || 
      u.email === 'saravanakumar.s16072007@gmail.com'
    ).map(u => ({
      ...u,
      role: 'admin',
      isProduction: true,
      environment: 'production'
    }));

    // 2. Wipe ALL old test/demo clinical, medication, and tracking records
    this.data.prescriptions = [];
    this.data.prescription_items = [];
    this.data.medicines = [];
    this.data.medicine_schedules = [];
    this.data.medicine_adherence_logs = [];
    this.data.health_reports = [];
    this.data.report_versions = [];
    this.data.extracted_health_values = [];
    this.data.vitals = [];
    this.data.medical_timeline = [];
    this.data.careconnect_sessions = [];
    this.data.emergency_contacts = [];
    this.data.notifications = [];
    this.data.ai_conversations = [];
    this.data.medicine_alerts_history = [];
    this.data.alert_history = [];
    this.data.consumption_events = [];
    this.data.call_logs = [];
    this.data.sms_logs = [];

    // Wipe test profiles and test guardians
    this.data.user_profiles = [];
    this.data.guardians = [];

    // Initialize users array with only preserved production users
    this.data.users = [...preservedProductionUsers];

    // 3. Clean uploaded test files from uploads/
    try {
      const uploadsDir = path.join(__dirname, 'uploads');
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        for (const file of files) {
          if (file.startsWith('report-') || file.startsWith('rx-') || file.startsWith('sample-')) {
            try {
              fs.unlinkSync(path.join(uploadsDir, file));
            } catch (unlinkErr) {
              // Ignore file lock
            }
          }
        }
      }
    } catch (err) {
      console.warn('[VitaCare DB] Warning cleaning uploads directory:', err.message);
    }

    // 4. Create fresh Root Administrator account
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('AdminSecure2026!', salt);
    this.data.users.push({
      id: 'admin-root-001',
      email: 'admin@vitacare.ai',
      passwordHash: adminHash,
      name: 'VitaCare Chief Administrator',
      role: 'admin',
      age: 42,
      gender: 'Not specified',
      bloodGroup: 'O+',
      preferredLanguage: 'en',
      emergencyPhone: '+1 (800) 555-0199',
      environment: 'development',
      isProduction: false,
      createdAt: new Date().toISOString()
    });

    // 5. Create fresh Test Accounts only if not in clean-empty-state mode
    if (!options.cleanEmptyState) {
      this.ensureTestUsers();
    }

    // 6. Reset System Settings to standard defaults
    this.data.system_settings = [
      {
        id: 'system-config-1',
        websiteName: 'VitaCare AI',
        logoUrl: '',
        supportPhone: '+1 (800) 555-VITA',
        supportEmail: 'support@vitacare.ai',
        warningCallAttempts: 2,
        warningTimeoutMinutes: 15,
        escalateToGuardian: true,
        defaultLanguage: 'en',
        careConnectEnabled: true,
        allowPatientRegistration: true,
        updatedAt: new Date().toISOString()
      }
    ];

    // 7. Ensure CMS modules, cards, and announcements are populated
    if (!this.data.cms_modules || this.data.cms_modules.length === 0) {
      this.data.cms_modules = [
        { id: 'mod-1', key: 'quick_stats', title: 'Clinical KPI & Metric Cards', description: 'Header stat cards showing adherence, active medicines, vitals, and reports', isEnabled: true, orderIndex: 1 },
        { id: 'mod-2', key: 'announcements', title: 'System Announcements Banner', description: 'Admin broadcast alert banner at top of dashboard', isEnabled: true, orderIndex: 2 },
        { id: 'mod-3', key: 'next_dose', title: 'Upcoming Medication Dose Card', description: 'Real-time card displaying next due medicine and countdown', isEnabled: true, orderIndex: 3 },
        { id: 'mod-4', key: 'today_schedules', title: 'Today Dose Schedule Timeline', description: 'Interactive schedule list with dynamic intake verification', isEnabled: true, orderIndex: 4 },
        { id: 'mod-5', key: 'vitals_summary', title: 'Verified Physiological Biomarkers', description: 'Biomarker intervals (Glucose, BP, SpO2, Hemoglobin)', isEnabled: true, orderIndex: 5 },
        { id: 'mod-6', key: 'health_status', title: 'Clinical Health Status Insights', description: 'Data-driven overview of physiological parameters', isEnabled: true, orderIndex: 6 },
        { id: 'mod-7', key: 'careconnect_banner', title: 'CareConnect Video Supervision Hub', description: 'Consent-based caregiver video adherence check-in banner', isEnabled: true, orderIndex: 7 },
        { id: 'mod-8', key: 'recent_reports', title: 'Recent Diagnostic Lab Reports', description: 'Cards for lab panels and diagnostic documents', isEnabled: true, orderIndex: 8 },
        { id: 'mod-9', key: 'timeline_activity', title: 'Medical Timeline & Audit Feed', description: 'Chronological timeline of doses, uploads, and vitals', isEnabled: true, orderIndex: 9 }
      ];
    }
    if (!this.data.cms_cards || this.data.cms_cards.length === 0) {
      this.data.cms_cards = [
        { id: 'card-1', key: 'adherence_stat', title: 'Adherence Rate', subtitle: '30-Day Medication Adherence', value: '100%', delta: 'Ready for intake logging', badgeColor: 'green', isVisible: true, orderIndex: 1 },
        { id: 'card-2', key: 'active_meds_stat', title: 'Active Prescriptions', subtitle: 'Current Clinical Regimen', value: 'Active', delta: 'Managed digitally', badgeColor: 'blue', isVisible: true, orderIndex: 2 },
        { id: 'card-3', key: 'verified_doses_stat', title: 'Doses Verified Today', subtitle: 'Intake Confirmed by Patient', value: '0 Verified', delta: 'Pending logs', badgeColor: 'orange', isVisible: true, orderIndex: 3 },
        { id: 'card-4', key: 'reports_stat', title: 'Diagnostic Reports', subtitle: 'Verified Clinical Records', value: 'Ready', delta: 'OCR extraction enabled', badgeColor: 'purple', isVisible: true, orderIndex: 4 }
      ];
    }
    if (!this.data.cms_announcements || this.data.cms_announcements.length === 0) {
      this.data.cms_announcements = [
        { id: 'ann-1', title: 'Welcome to VitaCare AI Health Copilot', message: 'Secure multilingual patient portal active. Register your account and configure guardian SMS notifications.', alertType: 'info', isPublished: true, priority: 1, createdAt: new Date().toISOString() }
      ];
    }
    if (!this.data.translations || this.data.translations.length === 0) {
      this.seedInitialTranslations();
    }

    // Save clean state
    this.save();

    // 8. Strict Verification Checks
    const clinicalCollectionsEmpty = (
      this.data.prescriptions.length === 0 &&
      this.data.prescription_items.length === 0 &&
      this.data.medicines.length === 0 &&
      this.data.medicine_schedules.length === 0 &&
      this.data.medicine_adherence_logs.length === 0 &&
      this.data.consumption_events.length === 0 &&
      this.data.health_reports.length === 0 &&
      this.data.report_versions.length === 0 &&
      this.data.extracted_health_values.length === 0 &&
      this.data.vitals.length === 0 &&
      this.data.call_logs.length === 0 &&
      this.data.sms_logs.length === 0 &&
      this.data.notifications.length === 0 &&
      this.data.alert_history.length === 0 &&
      this.data.medicine_alerts_history.length === 0 &&
      this.data.careconnect_sessions.length === 0 &&
      this.data.emergency_contacts.length === 0 &&
      this.data.ai_conversations.length === 0 &&
      this.data.medical_timeline.length === 0
    );

    const freshAccountsReady = options.cleanEmptyState
      ? (this.data.users.some(u => u.email === 'admin@vitacare.ai' && u.role === 'admin'))
      : (
        this.data.users.some(u => u.email === 'patient.a@vitacare.ai' && u.name === 'Patient A') &&
        this.data.users.some(u => u.email === 'patient.b@vitacare.ai' && u.name === 'Patient B') &&
        this.data.users.some(u => u.email === 'admin@vitacare.ai' && u.role === 'admin') &&
        this.data.guardians.some(g => g.id === 'guardian-patient-a' && g.name === 'Guardian A') &&
        this.data.guardians.some(g => g.id === 'guardian-patient-b' && g.name === 'Guardian B')
      );

    const productionAccountsSafe = (
      preservedProductionUsers.length > 0
        ? preservedProductionUsers.every(u => this.data.users.some(cur => cur.email === u.email && cur.isProduction === true))
        : true
    );

    const auditReport = {
      success: clinicalCollectionsEmpty && freshAccountsReady && productionAccountsSafe,
      oldTestDataCleared: clinicalCollectionsEmpty ? 'PASS' : 'FAIL',
      freshTestEnvironmentCreated: freshAccountsReady ? 'PASS' : 'FAIL',
      productionDataProtected: productionAccountsSafe ? 'PASS' : 'FAIL',
      cleanEmptyState: options.cleanEmptyState === true,
      collectionCounts: {
        users: this.data.users.length,
        user_profiles: this.data.user_profiles.length,
        guardians: this.data.guardians.length,
        prescriptions: this.data.prescriptions.length,
        prescription_items: this.data.prescription_items.length,
        medicines: this.data.medicines.length,
        medicine_schedules: this.data.medicine_schedules.length,
        medicine_adherence_logs: this.data.medicine_adherence_logs.length,
        consumption_events: this.data.consumption_events.length,
        health_reports: this.data.health_reports.length,
        report_versions: this.data.report_versions.length,
        extracted_health_values: this.data.extracted_health_values.length,
        vitals: this.data.vitals.length,
        medical_timeline: this.data.medical_timeline.length,
        careconnect_sessions: this.data.careconnect_sessions.length,
        emergency_contacts: this.data.emergency_contacts.length,
        notifications: this.data.notifications.length,
        ai_conversations: this.data.ai_conversations.length,
        medicine_alerts_history: this.data.medicine_alerts_history.length,
        alert_history: this.data.alert_history.length,
        call_logs: this.data.call_logs.length,
        sms_logs: this.data.sms_logs.length
      },
      freshUsers: options.cleanEmptyState
        ? [{ email: 'admin@vitacare.ai', role: 'admin', name: 'VitaCare Chief Administrator' }]
        : [
          { email: 'patient.a@vitacare.ai', role: 'patient', name: 'Patient A', guardian: 'Guardian A' },
          { email: 'patient.b@vitacare.ai', role: 'patient', name: 'Patient B', guardian: 'Guardian B' },
          { email: 'admin@vitacare.ai', role: 'admin', name: 'VitaCare Chief Administrator' }
        ],
      protectedProductionUsers: preservedProductionUsers.map(u => ({ email: u.email, role: u.role, isProduction: true })),
      timestamp: new Date().toISOString()
    };

    console.log('[VitaCare DB] Development Data Reset Complete.');
    console.log(`  Old test/demo data cleared: ${auditReport.oldTestDataCleared}`);
    console.log(`  Clean environment initialized: ${auditReport.freshTestEnvironmentCreated}`);
    console.log(`  Production data protected: ${auditReport.productionDataProtected}`);

    return auditReport;
  }

  resetToCleanEmptyState() {
    return this.resetDevelopmentDatabase({ cleanEmptyState: true });
  }

  clearUserData() {
    return this.resetToCleanEmptyState();
  }

  save() {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
      const stat = fs.statSync(DB_PATH);
      this.lastLoadedMtime = stat.mtimeMs;
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  find(collection, filterFn = () => true) {
    this.checkReload();
    if (!this.data[collection]) return [];
    return this.data[collection].filter(filterFn);
  }

  findOne(collection, filterFn = () => true) {
    this.checkReload();
    if (!this.data[collection]) return null;
    return this.data[collection].find(filterFn) || null;
  }

  findById(collection, id) {
    return this.findOne(collection, item => item.id === id);
  }

  insert(collection, item) {
    this.checkReload();
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    const newRecord = {
      id: item.id || crypto.randomUUID(),
      ...item,
      createdAt: item.createdAt || new Date().toISOString()
    };
    this.data[collection].push(newRecord);
    this.save();
    return newRecord;
  }

  insertMany(collection, items) {
    this.checkReload();
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    const created = items.map(item => ({
      id: item.id || crypto.randomUUID(),
      ...item,
      createdAt: item.createdAt || new Date().toISOString()
    }));
    this.data[collection].push(...created);
    this.save();
    return created;
  }

  update(collection, filterFn, updateFnOrData) {
    this.checkReload();
    if (!this.data[collection]) return [];
    let updatedCount = 0;
    const updatedItems = [];

    this.data[collection] = this.data[collection].map(item => {
      if (filterFn(item)) {
        updatedCount++;
        const updated = typeof updateFnOrData === 'function'
          ? updateFnOrData({ ...item })
          : { ...item, ...updateFnOrData, updatedAt: new Date().toISOString() };
        updatedItems.push(updated);
        return updated;
      }
      return item;
    });

    if (updatedCount > 0) {
      this.save();
    }
    return updatedItems;
  }

  delete(collection, filterFn) {
    this.checkReload();
    if (!this.data[collection]) return 0;
    const initialLength = this.data[collection].length;
    this.data[collection] = this.data[collection].filter(item => !filterFn(item));
    const deletedCount = initialLength - this.data[collection].length;
    if (deletedCount > 0) {
      this.save();
    }
    return deletedCount;
  }
}

const db = new JsonDatabase();
module.exports = db;
