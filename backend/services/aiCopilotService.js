const db = require('../db');

// Multi-language Clinical AI Response Templates & Translators
const AI_LOCALES = {
  en: {
    emergencyTitle: "⚠️ **URGENT MEDICAL SAFETY ALERT**",
    emergencyBody: "The symptoms you mentioned may indicate an acute medical emergency.\n\n• **Immediate Action**: Please stop using this chat and call emergency services immediately (911, 108, or your local emergency number).\n• **Emergency SOS**: You can trigger the VitaCare Emergency SOS button on your dashboard to instantly alert your configured emergency contacts and guardian.\n• VitaCare AI is an assistive organizer and copilot, **NOT an emergency response system or a physician**.\n\nPlease seek professional emergency medical evaluation immediately.",
    emergencyDisclaimer: "VitaCare AI is not a doctor and does not provide emergency medical diagnosis or treatment.",
    medScheduleHeader: "### 💊 Today's Medication Schedule\n\n",
    medScheduledFor: "scheduled for",
    instructions: "Instructions",
    statusLabel: "Status",
    statusTaken: "✅ Taken & Verified",
    statusMissed: "❌ Missed",
    statusUpcoming: "⏳ Upcoming",
    nextDose: "Next dose",
    activeMedsCount: "You have **{{count}}** active medicines in your profile:\n",
    noMedsToday: "You currently have **no medicines scheduled** for today. You can upload a new prescription or add a medicine from the Medicine Management tab.",
    medKnowledge: "Always take medications at the prescribed intervals with appropriate meals as directed by your prescribing physician.",
    glucoseHeader: "### 🩸 Your Blood Glucose Records\n\n",
    recordedOn: "Recorded on",
    statusIndicator: "Status",
    elevatedNote: "\n*Note*: Some glucose readings were slightly elevated compared to standard fasting reference ranges.",
    noGlucoseFound: "No blood glucose measurements found in your uploaded health reports yet.",
    glucoseKnowledge: "Standard fasting blood glucose ranges for non-diabetic adults are typically between 70 and 99 mg/dL. Values between 100–125 mg/dL indicate impaired fasting glucose, while 126 mg/dL or higher indicates diabetes.",
    hbHeader: "### 🔬 Your Hemoglobin Level (Hb)\n\n",
    stdRefRange: "Standard Reference Range",
    recordedDate: "Recorded Date",
    verifiedByPatient: "Verified by Patient",
    trendDiff: "Trend: Previous measurement was **{{prev}}** on {{date}} (Change: {{diff}}).",
    noHbFound: "No hemoglobin measurement has been recorded yet. Please upload a Complete Blood Count (CBC) report.",
    hbKnowledge: "Hemoglobin is the iron-rich protein in red blood cells that transports oxygen throughout the human body. Normal adult male ranges are generally 13.5–17.5 g/dL, and female ranges are 12.0–15.5 g/dL.",
    bpHeader: "### 💓 Your Blood Pressure Record (BP)\n\n",
    currentReading: "Current Reading",
    stdTarget: "Standard Target: < 120/80 mmHg",
    noBpFound: "No blood pressure readings are recorded in your account yet.",
    bpKnowledge: "Blood pressure consists of Systolic (pressure when heart beats) over Diastolic (pressure when heart rests between beats). Optimal resting blood pressure is under 120/80 mmHg.",
    compareHeader: "### 📊 Report Comparison Overview\n\nComparing your two most recent health records:\n",
    noOverlap: "Both reports represent different clinical panels. You can view full granular details in the **Compare Reports** view.\n",
    singleReport: "You currently have **1 uploaded report** ({{type}} from {{date}}).\nUpload a second report to perform an automatic side-by-side metric comparison!",
    noReports: "You have not uploaded any health reports yet. Click **+ ADD HEALTH REPORT** on your dashboard to begin.",
    summaryHeader: "### 🩺 VitaCare Health Summary for {{name}}\n\nHere is your current health profile at a glance:\n",
    activeMedsSummary: "• **Active Medications**: {{count}} registered\n",
    todayDosesSummary: "• **Today's Scheduled Doses**: {{count}} events\n",
    reportsSummary: "• **Verified Health Reports**: {{count}} document(s)\n",
    vitalsSummary: "• **Tracked Vitals**: {{count}} measurement(s)\n",
    allergiesSummary: "• **Known Allergies**: {{allergies}}\n",
    suggestedHeader: "\nYou can ask me specific questions such as:\n- *\"What medicines do I have today?\"*\n- *\"What is my latest blood glucose level?\"*\n- *\"Compare my recent lab reports\"*\n- *\"Explain my hemoglobin reading\"*\n",
    modeSimplePrefix: "\n\n💡 **In Simple Words:**\n",
    modeStandardPrefix: "\n\n📋 **Medical Context:**\n",
    modeDetailedPrefix: "\n\n🔬 **Clinical Reference & Biological Context:**\n",
    modeDetailedSuffix: "\n*Physiological note*: Laboratory reference ranges vary slightly across testing methodologies and regional clinical standards.",
    disclaimer: "VitaCare AI organizes your verified records and provides educational context. It does not replace clinical consultation with your licensed physician."
  },

  ta: {
    emergencyTitle: "⚠️ **அவசர மருத்துவ பாதுகாப்பு எச்சரிக்கை**",
    emergencyBody: "நீங்கள் குறிப்பிட்ட அறிகுறிகள் தீவிர மருத்துவ அவசரநிலையைக் குறிக்கலாம்.\n\n• **உடனடி நடவடிக்கை**: தயவுசெய்து அவசர மருத்துவ சேவைகளை (108 / 112) உடனே அழைக்கவும்.\n• **அவசர SOS**: உங்கள் டாஷ்போர்டில் உள்ள அவசர SOS பொத்தானை அழுத்தி பாதுகாவலர் மற்றும் குடும்பத்தினருக்கு உடனடியாக எச்சரிக்கை அனுப்பலாம்.\n• விடாகேர் AI என்பது ஒரு சுகாதார வழிகாட்டி மட்டுமே, **மருத்துவர் அல்ல**.\n\nஉடனடியாக மருத்துவ நிபுணரின் உதவியை நாடுங்கள்.",
    emergencyDisclaimer: "விடாகேர் AI மருத்துவர் அல்ல, அவசர மருத்துவ சிகிச்சை அளிக்காது.",
    medScheduleHeader: "### 💊 இன்றைய மருந்து அட்டவணை\n\n",
    medScheduledFor: "திட்டமிடப்பட்ட நேரம்",
    instructions: "வழிமுறைகள்",
    statusLabel: "நிலை",
    statusTaken: "✅ உட்கொள்ளப்பட்டது (சரிபார்க்கப்பட்டது)",
    statusMissed: "❌ தவறவிடப்பட்டது",
    statusUpcoming: "⏳ வரவிருப்பது",
    nextDose: "அடுத்த மருந்து",
    activeMedsCount: "உங்கள் கணக்கில் **{{count}}** செயலில் உள்ள மருந்துகள் உள்ளன:\n",
    noMedsToday: "இன்று உட்கொள்ள வேண்டிய மருந்துகள் எதுவும் இல்லை. புதிய மருந்துச்சீட்டைப் பதிவேற்றலாம்.",
    medKnowledge: "மருத்துவர் பரிந்துரைத்தபடி குறிப்பிட்ட நேரத்தில் உணவோடு அல்லது உணவுக்குப் பின் தவறாமல் மருந்துகளை உட்கொள்ளவும்.",
    glucoseHeader: "### 🩸 உங்கள் இரத்த சர்க்கரை அளவீடுகள் (Blood Glucose)\n\n",
    recordedOn: "பதிவு செய்த தேதி",
    statusIndicator: "நிலை",
    elevatedNote: "\n*குறிப்பு*: சில சர்க்கரை அளவீடுகள் இயல்பான வரம்பை விட சற்று அதிகமாக உள்ளன.",
    noGlucoseFound: "உங்கள் மருத்துவ அறிக்கைகளில் இரத்த சர்க்கரை அளவீடுகள் இன்னும் இல்லை.",
    glucoseKnowledge: "வெறும் வயிற்றில் இரத்த சர்க்கரை அளவு 70-99 mg/dL இருப்பது இயல்பானது. 100-125 mg/dL என்பது முன்-நீரிழிவு நிலையையும், 126 mg/dL அல்லது அதற்கு மேல் இருப்பது நீரிழிவையும் குறிக்கும்.",
    hbHeader: "### 🔬 உங்கள் ஹீமோகுளோபின் அளவு (Hemoglobin - Hb)\n\n",
    stdRefRange: "நிலையான குறிப்பு வரம்பு",
    recordedDate: "பதிவு செய்த தேதி",
    verifiedByPatient: "நோயாளியால் சரிபார்க்கப்பட்டது",
    trendDiff: "போக்கு: முந்தைய அளவீடு {{date}} அன்று **{{prev}}** ஆக இருந்தது (மாற்றம்: {{diff}}).",
    noHbFound: "ஹீமோகுளோபின் அளவீடு இன்னும் பதிவு செய்யப்படவில்லை. முழு இரத்த பரிசோதனை (CBC) அறிக்கையைப் பதிவேற்றவும்.",
    hbKnowledge: "ஹீமோகுளோபின் என்பது இரத்த சிவப்பணுக்களில் உள்ள இரும்புச்சத்து நிறைந்த புரதமாகும், இது உடலெங்கும் ஆக்ஸிஜனைக் கொண்டு செல்கிறது. ஆண்களுக்கு 13.5–17.5 g/dL, பெண்களுக்கு 12.0–15.5 g/dL இயல்பான அளவாகும்.",
    bpHeader: "### 💓 உங்கள் இரத்த அழுத்த அளவீடு (Blood Pressure - BP)\n\n",
    currentReading: "தற்போதைய அளவீடு",
    stdTarget: "நிலையான இலக்கு: < 120/80 mmHg",
    noBpFound: "உங்கள் கணக்கில் இரத்த அழுத்த அளவீடுகள் எதுவும் இல்லை.",
    bpKnowledge: "இரத்த அழுத்தம் என்பது சிஸ்டாலிக் (இதயம் துடிக்கும் போது ஏற்படும் அழுத்தம்) மற்றும் டயஸ்டாலிக் (இதயம் ஓய்வெடுக்கும் போது ஏற்படும் அழுத்தம்) ஆகியவற்றைக் குறிக்கும். சிறந்த ஓய்வு இரத்த அழுத்தம் 120/80 mmHg-க்கு கீழ் இருக்க வேண்டும்.",
    compareHeader: "### 📊 மருத்துவ ஆய்வக அறிக்கைகள் ஒப்பீடு\n\nஉங்கள் சமீபத்திய இரண்டு அறிக்கைகளின் ஒப்பீடு:\n",
    noOverlap: "இரண்டு அறிக்கைகளும் வெவ்வேறு சோதனைகளைக் குறிக்கின்றன. முழு விவரங்களை **அறிக்கைகள் ஒப்பீடு** பிரிவில் காணலாம்.\n",
    singleReport: "தற்போது **1 அறிக்கை** மட்டுமே உள்ளது ({{type}} - {{date}}).\nஇரண்டாவது அறிக்கையைப் பதிவேற்றினால் தானாக ஒப்பிட்டுப் பார்க்கலாம்!",
    noReports: "மருத்துவ அறிக்கைகள் எதுவும் பதிவேற்றப்படவில்லை. டாஷ்போர்டில் **+ மருத்துவ அறிக்கை சேர்** பொத்தானை அழுத்தவும்.",
    summaryHeader: "### 🩺 {{name}} அவர்களின் சுகாதார சுருக்கம்\n\nஉங்கள் தற்போதைய ஆரோக்கிய சுயவிவரம்:\n",
    activeMedsSummary: "• **செயலில் உள்ள மருந்துகள்**: {{count}} பதிவு செய்யப்பட்டுள்ளன\n",
    todayDosesSummary: "• **இன்றைய திட்டமிடப்பட்ட மருந்துகள்**: {{count}} நிகழ்வுகள்\n",
    reportsSummary: "• **சரிபார்க்கப்பட்ட அறிக்கைகள்**: {{count}} ஆவணங்கள்\n",
    vitalsSummary: "• **கண்காணிக்கப்படும் அளவீடுகள்**: {{count}} அளவீடுகள்\n",
    allergiesSummary: "• **தெரிந்த ஒவ்வாமைகள்**: {{allergies}}\n",
    suggestedHeader: "\nநீங்கள் என்னிடம் கேட்கலாம்:\n- *\"இன்று எனக்கு என்ன மருந்துகள் உள்ளன?\"*\n- *\"எனது சமீபத்திய இரத்த சர்க்கரை அளவு என்ன?\"*\n- *\"எனது சமீபத்திய அறிக்கைகளை ஒப்பிடு\"*\n- *\"எனது ஹீமோகுளோபின் அளவை விளக்கு\"*\n",
    modeSimplePrefix: "\n\n💡 **எளிய விளக்கம்:**\n",
    modeStandardPrefix: "\n\n📋 **மருத்துவ விளக்கம்:**\n",
    modeDetailedPrefix: "\n\n🔬 **விரிவான உடலியல் விளக்கம்:**\n",
    modeDetailedSuffix: "\n*குறிப்பு*: ஆய்வக குறிப்பு வரம்புகள் பரிசோதனை முறையைப் பொறுத்து சற்று மாறுபடலாம்.",
    disclaimer: "விடாகேர் AI உங்கள் சரிபார்க்கப்பட்ட பதிவுகளை ஒழுங்கமைத்து விழிப்புணர்வை மட்டுமே வழங்குகிறது. இது மருத்துவ ஆலோசனைக்கு மாற்றாகாது."
  },

  te: {
    emergencyTitle: "⚠️ **అత్యవసర వైద్య భద్రతా హెచ్చరిక**",
    emergencyBody: "మీరు పేర్కొన్న లక్షణాలు తీవ్రమైన వైద్య అత్యవసర పరిస్థితిని సూచించవచ్చు.\n\n• **తక్షణ చర్య**: దయచేసి వెంటనే అత్యవసర సేవలకు (108 / 112) కాల్ చేయండి.\n• **ఎమర్జెన్సీ SOS**: మీ డ్యాష్‌బోర్డ్‌లోని ఎమర్జెన్సీ SOS బటన్‌ను నొక్కి సంరక్షకులకు తక్షణమే హెచ్చరిక పంపవచ్చు.\n• విటాకేర్ AI కేవలం ఆరోగ్య సహాయకుడు మాత్రమే, **వైద్యుడు కాదు**.\n\nవెంటనే వైద్యుడిని సంప్రదించండి.",
    emergencyDisclaimer: "విటాకేర్ AI వైద్యుడు కాదు, అత్యవసర చికిత్స అందించదు.",
    medScheduleHeader: "### 💊 నేటి మందుల షెడ్యూల్\n\n",
    medScheduledFor: "షెడ్యూల్ సమయం",
    instructions: "సూచనలు",
    statusLabel: "స్థితి",
    statusTaken: "✅ తీసుకున్నారు (ధృవీకరించబడింది)",
    statusMissed: "❌ మిస్ అయింది",
    statusUpcoming: "⏳ రాబోయేది",
    nextDose: "తదుపరి మందు",
    activeMedsCount: "మీ ఖాతాలో **{{count}}** యాక్టివ్ మందులు ఉన్నాయి:\n",
    noMedsToday: "ఈ రోజుకు మందులు ఏవీ షెడ్యూల్ చేయబడలేదు. కొత్త ప్రిస్క్రిప్షన్‌ను అప్‌లోడ్ చేయవచ్చు.",
    medKnowledge: "వైద్యుడు సూచించిన విధంగా సమయానికి భోజనంతో పాటు మందులను క్రమం తప్పకుండా తీసుకోండి.",
    glucoseHeader: "### 🩸 మీ బ్లడ్ గ్లూకోజ్ రికార్డులు (Blood Glucose)\n\n",
    recordedOn: "నమోదైన తేదీ",
    statusIndicator: "స్థితి",
    elevatedNote: "\n*గమనిక*: కొన్ని చక్కెర కొలతలు సాధారణ పరిధి కంటే కొద్దిగా ఎక్కువగా ఉన్నాయి.",
    noGlucoseFound: "మీ వైద్య నివేదికలలో బ్లడ్ షుగర్ కొలతలు ఇంకా నమోదు కాలేదు.",
    glucoseKnowledge: "ఖాళీ కడుపుతో రక్తంలో చక్కెర సాధారణంగా 70-99 mg/dL ఉండాలి. 100-125 mg/dL ఉంటే ప్రీ-డయాబెటిస్ మరియు 126 mg/dL లేదా అంతకంటే ఎక్కువ ఉంటే డయాబెటిస్ అని సూచిస్తుంది.",
    hbHeader: "### 🔬 మీ హిమోగ్లోబిన్ స్థాయి (Hemoglobin - Hb)\n\n",
    stdRefRange: "ప్రామాణిక సూచన పరిధి",
    recordedDate: "నమోదైన తేదీ",
    verifiedByPatient: "రోగి ద్వారా ధృవీకరించబడింది",
    trendDiff: "మార్పు: మునుపటి కొలత {{date}} నాడు **{{prev}}** గా ఉంది (తేడా: {{diff}}).",
    noHbFound: "హిమోగ్లోబిన్ కొలత ఇంకా నమోదు కాలేదు. పూర్తి రక్త పరీక్ష (CBC) నివేదికను అప్‌లోడ్ చేయండి.",
    hbKnowledge: "హిమోగ్లోబిన్ అనేది ఎర్ర రక్త కణాలలో ఉండే ప్రోటీన్, ఇది శరీరమంతటా ఆక్సిజన్‌ను మోసుకెళుతుంది. పురుషులకు 13.5–17.5 g/dL మరియు మహిళలకు 12.0–15.5 g/dL సాధారణ పరిధి.",
    bpHeader: "### 💓 మీ రక్తపోటు రికార్డు (Blood Pressure - BP)\n\n",
    currentReading: "ప్రస్తుత కొలత",
    stdTarget: "ప్రామాణిక లక్ష్యం: < 120/80 mmHg",
    noBpFound: "మీ ఖాతాలో రక్తపోటు కొలతలు ఏవీ నమోదు కాలేదు.",
    bpKnowledge: "రక్తపోటులో సిస్టోలిక్ మరియు డయాస్టోలిక్ ఉంటాయి. సాధారణ రక్తపోటు 120/80 mmHg కంటే తక్కువగా ఉండాలి.",
    compareHeader: "### 📊 ల్యాబ్ నివేదికల పోలిక\n\nమీ ఇటీవలి రెండు నివేదికల పోలిక:\n",
    noOverlap: "రెండు నివేదికలలో వేర్వేరు పరీక్షలు ఉన్నాయి. పూర్తి వివరాలను **నివేదికల పోలిక** వీక్షణలో చూడవచ్చు.\n",
    singleReport: "ప్రస్తుతం **1 నివేదిక** మాత్రమే ఉంది ({{type}} - {{date}}).\nరెండవ నివేదికను అప్‌లోడ్ చేసి ఆటోమేటిక్‌గా పోల్చండి!",
    noReports: "ఆరోగ్య నివేదికలు ఏవీ అప్‌లోడ్ చేయలేదు. డ్యాష్‌బోర్డ్‌లో **+ ల్యాబ్ రిపోర్ట్ జోడించండి** క్లిక్ చేయండి.",
    summaryHeader: "### 🩺 {{name}} గారి ఆరోగ్య సారాంశం\n\nమీ ప్రస్తుత ఆరోగ్య ప్రొఫైల్:\n",
    activeMedsSummary: "• **యాక్టివ్ మందులు**: {{count}} నమోదయ్యాయి\n",
    todayDosesSummary: "• **నేటి మందుల మోతాదులు**: {{count}} ఈవెంట్‌లు\n",
    reportsSummary: "• **ధృవీకరించిన నివేదికలు**: {{count}} పత్రాలు\n",
    vitalsSummary: "• **ట్రాక్ చేసిన కొలతలు**: {{count}} కొలతలు\n",
    allergiesSummary: "• **అలెర్జీలు**: {{allergies}}\n",
    suggestedHeader: "\nమీరు నన్ను ఇలా అడగవచ్చు:\n- *\"ఈ రోజు నాకు ఏ మందులు ఉన్నాయి?\"*\n- *\"నా తాజా బ్లడ్ షుగర్ స్థాయి ఎంత?\"*\n- *\"నా ఇటీవలి నివేదికలను పోల్చండి\"*\n- *\"నా హిమోగ్లోబిన్ గురించి వివరించండి\"*\n",
    modeSimplePrefix: "\n\n💡 **సరళమైన వివరణ:**\n",
    modeStandardPrefix: "\n\n📋 **క్లినికల్ వివరణ:**\n",
    modeDetailedPrefix: "\n\n🔬 **వివరణాత్మక బయోలాజికల్ వివరణ:**\n",
    modeDetailedSuffix: "\n*గమనిక*: ల్యాబ్ సూచన పరిధులు పరీక్షా విధానాన్ని బట్టి మారవచ్చు.",
    disclaimer: "విటాకేర్ AI విద్యాపరమైన సమాచారాన్ని మాత్రమే అందిస్తుంది. ఇది వైద్యుడి సలహాకు ప్రత్యామ్నాయం కాదు."
  },

  ml: {
    emergencyTitle: "⚠️ **അടിയന്തര മെഡിക്കൽ സുരക്ഷാ മുന്നറിയിപ്പ്**",
    emergencyBody: "നിങ്ങൾ സൂചിപ്പിച്ച ലക്ഷണങ്ങൾ ഗുരുതരമായ മെഡിക്കൽ അടിയന്തരാവസ്ഥയെ സൂചിപ്പിക്കാം.\n\n• **ഉടൻ ചെയ്യേണ്ടത്**: ദയവായി അടിയന്തര മെഡിക്കൽ സേവനങ്ങളെ (108 / 112) ഉടൻ വിളിക്കുക.\n• **എമർജൻസി SOS**: ഡാഷ്‌ബോർഡിലെ എമർജൻസി SOS ബട്ടൺ അമർത്തി രക്ഷാകർത്താവിനെ ഉടൻ അറിയിക്കാം.\n• വിറ്റാകെയർ AI ഒരു സഹായി മാത്രമാണ്, **ഡോക്ടറല്ല**.\n\nഉടൻ ഒരു ഡോക്ടറെ സമീപിക്കുക.",
    emergencyDisclaimer: "വിറ്റാകെയർ AI ഡോക്ടറല്ല, അടിയന്തര ചികിത്സ നൽകുന്നില്ല.",
    medScheduleHeader: "### 💊 ഇന്നത്തെ മരുന്ന് സമയം\n\n",
    medScheduledFor: "നിശ്ചയിച്ച സമയം",
    instructions: "നിർദ്ദേശങ്ങൾ",
    statusLabel: "നില",
    statusTaken: "✅ കഴിച്ചു (സ്ഥിരീകരിച്ചു)",
    statusMissed: "❌ നഷ്ടപ്പെട്ടു",
    statusUpcoming: "⏳ വരാനിരിക്കുന്നത്",
    nextDose: "അടുത്ത മരുന്ന്",
    activeMedsCount: "നിങ്ങൾക്ക് **{{count}}** സജീവ മരുന്നുകൾ ഉണ്ട്:\n",
    noMedsToday: "ഇന്ന് കഴിക്കാൻ മരുന്നുകൾ ഒന്നും നിശ്ചയിച്ചിട്ടില്ല. പുതിയ കുറിപ്പടി അപ്‌ലോഡ് ചെയ്യാം.",
    medKnowledge: "ഡോക്ടർ നിർദ്ദേശിച്ച കൃത്യമായ സമയത്ത് ഭക്ഷണത്തോടൊപ്പം മരുന്നുകൾ മുടങ്ങാതെ കഴിക്കുക.",
    glucoseHeader: "### 🩸 നിങ്ങളുടെ രക്തത്തിലെ പഞ്ചസാരയുടെ അളവ് (Blood Glucose)\n\n",
    recordedOn: "രേഖപ്പെടുത്തിയ തീയതി",
    statusIndicator: "നില",
    elevatedNote: "\n*കുറിപ്പ്*: ചില ഗ്ലൂക്കോസ് അളവുകൾ സാധാരണ പരിധിയേക്കാൾ കൂടുതലാണ്.",
    noGlucoseFound: "രക്തത്തിലെ പഞ്ചസാരയുടെ അളവുകൾ ഇതുവരെ രേഖപ്പെടുത്തിയിട്ടില്ല.",
    glucoseKnowledge: "വെറും വയറ്റിലെ രക്തത്തിലെ പഞ്ചസാര സാധാരണയായി 70-99 mg/dL ആയിരിക്കണം. 100-125 mg/dL പ്രീ-ഡയബറ്റിസിനെയും 126 mg/dL അല്ലെങ്കിൽ അതിൽ കൂടുതലോ പ്രമേഹത്തെയും സൂചിപ്പിക്കുന്നു.",
    hbHeader: "### 🔬 നിങ്ങളുടെ ഹീമോഗ്ലോബിൻ അളവ് (Hemoglobin - Hb)\n\n",
    stdRefRange: "സാധാരണ അളവ് പരിധി",
    recordedDate: "രേഖപ്പെടുത്തിയ തീയതി",
    verifiedByPatient: "രോഗി സ്ഥിരീകരിച്ചു",
    trendDiff: "മാറ്റം: മുമ്പത്തെ അളവ് {{date}}-ൽ **{{prev}}** ആയിരുന്നു (വ്യത്യാസം: {{diff}}).",
    noHbFound: "ഹീമോഗ്ലോബിൻ അളവ് രേഖപ്പെടുത്തിയിട്ടില്ല. സമ്പൂർണ്ണ രക്തപരിശോധന (CBC) റിപ്പോർട്ട് അപ്‌ലോഡ് ചെയ്യുക.",
    hbKnowledge: "ചുവന്ന രക്താണുക്കളിൽ ഓക്സിജൻ വഹിക്കുന്ന പ്രോട്ടീനാണ് ഹീമോഗ്ലോബിൻ. പുരുഷന്മാർക്ക് 13.5–17.5 g/dL ഉം സ്ത്രീകൾക്ക് 12.0–15.5 g/dL ഉം സാധാരണ പരിധിയാണ്.",
    bpHeader: "### 💓 നിങ്ങളുടെ രക്തസമ്മർദ്ദം (Blood Pressure - BP)\n\n",
    currentReading: "നിലവിലെ അളവ്",
    stdTarget: "സാധാരണ ലക്ഷ്യം: < 120/80 mmHg",
    noBpFound: "രക്തസമ്മർദ്ദ അളവുകൾ ഒന്നും രേഖപ്പെടുത്തിയിട്ടില്ല.",
    bpKnowledge: "രക്തസമ്മർദ്ദം സിസ്റ്റോളിക്, ഡയസ്റ്റോളിക് എന്നിവ ചേർന്നതാണ്. സാധാരണ രക്തസമ്മർദ്ദം 120/80 mmHg-ൽ താഴെയായിരിക്കണം.",
    compareHeader: "### 📊 ലാബ് റിപ്പോർട്ടുകളുടെ താരതമ്യം\n\nഏറ്റവും പുതിയ രണ്ട് റിപ്പോർട്ടുകളുടെ താരതമ്യം:\n",
    noOverlap: "രണ്ട് റിപ്പോർട്ടുകളിലും വ്യത്യസ്ത പരിശോധനകളാണ് ഉള്ളത്. പൂർണ്ണ വിവരങ്ങൾ **റിപ്പോർട്ടുകൾ താരതമ്യം** കാഴ്‌ചയിൽ കാണാം.\n",
    singleReport: "നിലവിൽ **1 റിപ്പോർട്ട്** മാത്രമേയുള്ളൂ ({{type}} - {{date}}).\nരണ്ടാമത്തെ റിപ്പോർട്ട് അപ്‌ലോഡ് ചെയ്ത് താരതമ്യം ചെയ്യുക!",
    noReports: "ആരോഗ്യ റിപ്പോർട്ടുകൾ ഒന്നും അപ്‌ലോഡ് ചെയ്തിട്ടില്ല.",
    summaryHeader: "### 🩺 {{name}} യുടെ ആരോഗ്യ സംഗ്രഹം\n\nനിങ്ങളുടെ നിലവിലെ ആരോഗ്യ വിവരങ്ങൾ:\n",
    activeMedsSummary: "• **സജീവ മരുന്നുകൾ**: {{count}} എണ്ണം\n",
    todayDosesSummary: "• **ഇന്നത്തെ മരുന്ന് സമയങ്ങൾ**: {{count}} ഇവന്റുകൾ\n",
    reportsSummary: "• **സ്ഥിരീകരിച്ച റിപ്പോർട്ടുകൾ**: {{count}} രേഖകൾ\n",
    vitalsSummary: "• **ട്രാക്ക് ചെയ്ത അളവുകൾ**: {{count}} അളവുകൾ\n",
    allergiesSummary: "• **അലർജികൾ**: {{allergies}}\n",
    suggestedHeader: "\nനിങ്ങൾക്ക് ചോദിക്കാം:\n- *\"ഇന്ന് എനിക്ക് എന്തൊക്കെ മരുന്നുകളുണ്ട്?\"*\n- *\"എന്റെ രക്തത്തിലെ പഞ്ചസാര എത്രയാണ്?\"*\n- *\"എന്റെ സമീപകാല റിപ്പോർട്ടുകൾ താരതമ്യം ചെയ്യുക\"*\n- *\"എന്റെ ഹീമോഗ്ലോബിൻ വിശദീകരിക്കുക\"*\n",
    modeSimplePrefix: "\n\n💡 **ലളിതമായ വിവരണം:**\n",
    modeStandardPrefix: "\n\n📋 **മെഡിക്കൽ വിവരണം:**\n",
    modeDetailedPrefix: "\n\n🔬 **വിശദമായ ബയോളജിക്കൽ വിവരണം:**\n",
    modeDetailedSuffix: "\n*കുറിപ്പ്*: ലാബ് റഫറൻസ് പരിധികൾ പരിശോധനാ രീതി അനുസരിച്ച് വ്യത്യാസപ്പെടാം.",
    disclaimer: "വിറ്റാകെയർ AI ആരോഗ്യ വിവരങ്ങൾ മാത്രമാണ് നൽകുന്നത്. ഇത് ഡോക്ടറുടെ ചികിത്സക്ക് പകരമല്ല."
  },

  kn: {
    emergencyTitle: "⚠️ **ತುರ್ತು ವೈದ್ಯಕೀಯ ಸುರಕ್ಷತಾ ಎಚ್ಚರಿಕೆ**",
    emergencyBody: "ನೀವು ತಿಳಿಸಿದ ಲಕ್ಷಣಗಳು ಗಂಭೀರ ವೈದ್ಯಕೀಯ ತುರ್ತು ಪರಿಸ್ಥಿತಿಯನ್ನು ಸೂಚಿಸಬಹುದು.\n\n• **ತಕ್ಷಣದ ಕ್ರಮ**: ದಯವಿಟ್ಟು ತಕ್ಷಣವೇ ತುರ್ತು ಸೇವೆಗಳಿಗೆ (108 / 112) ಕರೆ ಮಾಡಿ.\n• **ತುರ್ತು SOS**: ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿರುವ ತುರ್ತು SOS ಬಟನ್ ಒತ್ತುವ ಮೂಲಕ ಪೋಷಕರಿಗೆ ತಕ್ಷಣ ಎಚ್ಚರಿಕೆ ಕಳುಹಿಸಬಹುದು.\n• ವಿಟಾಕೇರ್ AI ಕೇವಲ ಆರೋಗ್ಯ ಸಹಾಯಕ, **ವೈದ್ಯರಲ್ಲ**.\n\nತಕ್ಷಣವೇ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    emergencyDisclaimer: "ವಿಟಾಕೇರ್ AI ವೈದ್ಯರಲ್ಲ, ತುರ್ತು ಚಿಕಿತ್ಸೆ ನೀಡುವುದಿಲ್ಲ.",
    medScheduleHeader: "### 💊 ಇಂದಿನ ಔಷಧಿ ವೇಳಾಪಟ್ಟಿ\n\n",
    medScheduledFor: "ನಿಗದಿತ ಸಮಯ",
    instructions: "ಸೂಚನೆಗಳು",
    statusLabel: "ಸ್ಥಿತಿ",
    statusTaken: "✅ ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ (ಪರಿಶೀಲಿಸಲಾಗಿದೆ)",
    statusMissed: "❌ ತಪ್ಪಿಹೋಗಿದೆ",
    statusUpcoming: "⏳ ಮುಂಬರುವ",
    nextDose: "ಮುಂದಿನ ಔಷಧಿ",
    activeMedsCount: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ **{{count}}** ಸಕ್ರಿಯ ಔಷಧಿಗಳಿವೆ:\n",
    noMedsToday: "ಇಂದು ಯಾವುದೇ ಔಷಧಿಗಳು ನಿಗದಿಯಾಗಿಲ್ಲ. ಹೊಸ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಬಹುದು.",
    medKnowledge: "ವೈದ್ಯರು ಸೂಚಿಸಿದಂತೆ ಸರಿಯಾದ ಸಮಯದಲ್ಲಿ ಊಟದೊಂದಿಗೆ ಔಷಧಿಗಳನ್ನು ನಿಯಮಿತವಾಗಿ ತೆಗೆದುಕೊಳ್ಳಿ.",
    glucoseHeader: "### 🩸 ನಿಮ್ಮ ರಕ್ತದ ಗ್ಲೂಕೋಸ್ ದಾಖಲೆಗಳು (Blood Glucose)\n\n",
    recordedOn: "ದಾಖಲಾದ ದಿನಾಂಕ",
    statusIndicator: "ಸ್ಥಿತಿ",
    elevatedNote: "\n*ಗಮನಿಸಿ*: ಕೆಲವು ಸಕ್ಕರೆ ಅಳತೆಗಳು ಸಾಮಾನ್ಯ ಮಿತಿಗಿಂತ ಹೆಚ್ಚಾಗಿದೆ.",
    noGlucoseFound: "ನಿಮ್ಮ ವರದಿಗಳಲ್ಲಿ ರಕ್ತದ ಸಕ್ಕರೆ ಅಳತೆಗಳು ಇನ್ನೂ ದಾಖಲಾಗಿಲ್ಲ.",
    glucoseKnowledge: "ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ ರಕ್ತದ ಸಕ್ಕರೆ ಸಾಮಾನ್ಯ ಪ್ರಮಾಣ 70-99 mg/dL ಇರಬೇಕು. 100-125 mg/dL ಪ್ರಿ-ಡಯಾಬಿಟಿಸ್ ಮತ್ತು 126 mg/dL ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚು ಮಧುಮೇಹವನ್ನು ಸೂಚಿಸುತ್ತದೆ.",
    hbHeader: "### 🔬 ನಿಮ್ಮ ಹಿಮೋಗ್ಲೋಬಿನ್ ಮಟ್ಟ (Hemoglobin - Hb)\n\n",
    stdRefRange: "ಪ್ರಮಾಣಿತ ಉಲ್ಲೇಖ ಶ್ರೇಣಿ",
    recordedDate: "ದಾಖಲಾದ ದಿನಾಂಕ",
    verifiedByPatient: "ರೋಗಿಯಿಂದ ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    trendDiff: "ಬದಲಾವಣೆ: ಹಿಂದಿನ ಅಳತೆ {{date}} ರಂದು **{{prev}}** ಇತ್ತು (ವ್ಯತ್ಯಾಸ: {{diff}}).",
    noHbFound: "ಹಿಮೋಗ್ಲೋಬಿನ್ ಅಳತೆ ದಾಖಲಾಗಿಲ್ಲ. ಸಂಪೂರ್ಣ ರಕ್ತ ಪರೀಕ್ಷೆ (CBC) ವರದಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.",
    hbKnowledge: "ಹಿಮೋಗ್ಲೋಬಿನ್ ಕೆಂಪು ರಕ್ತ ಕಣಗಳಲ್ಲಿ ಆಮ್ಲಜನಕವನ್ನು ಸಾಗಿಸುವ ಪ್ರೋಟೀನ್ ಆಗಿದೆ. ಪುರುಷರಿಗೆ 13.5–17.5 g/dL ಮತ್ತು ಮಹಿಳೆಯರಿಗೆ 12.0–15.5 g/dL ಸಾಮಾನ್ಯ ಶ್ರೇಣಿ.",
    bpHeader: "### 💓 ನಿಮ್ಮ ರಕ್ತದೊತ್ತಡ ದಾಖಲೆ (Blood Pressure - BP)\n\n",
    currentReading: "ಪ್ರಸ್ತುತ ಅಳತೆ",
    stdTarget: "ಸಾಮಾನ್ಯ ಗುರಿ: < 120/80 mmHg",
    noBpFound: "ಯಾವುದೇ ರಕ್ತದೊತ್ತಡ ಅಳತೆಗಳು ದಾಖಲಾಗಿಲ್ಲ.",
    bpKnowledge: "ರಕ್ತದೊತ್ತಡವು ಸಿಸ್ಟೊಲಿಕ್ ಮತ್ತು ಡಯಾಸ್ಟೊಲಿಕ್ ಒಳಗೊಂಡಿರುತ್ತದೆ. ಸಾಮಾನ್ಯ ರಕ್ತದೊತ್ತಡ 120/80 mmHg ಗಿಂತ ಕಡಿಮೆಯಿರಬೇಕು.",
    compareHeader: "### 📊 ಲ್ಯಾಬ್ ವರದಿಗಳ ಹೋಲಿಕೆ\n\nಇತ್ತೀಚಿನ ಎರಡು ವರದಿಗಳ ಹೋಲಿಕೆ:\n",
    noOverlap: "ಎರಡೂ ವರದಿಗಳಲ್ಲಿ ವಿಭಿನ್ನ ಪರೀಕ್ಷೆಗಳಿವೆ. ಪೂರ್ಣ ವಿವರಗಳನ್ನು **ವರದಿಗಳ ಹೋಲಿಕೆ** ನೋಟದಲ್ಲಿ ವೀಕ್ಷಿಸಿ.\n",
    singleReport: "ಪ್ರಸ್ತುತ **1 ವರದಿ** ಮಾತ್ರ ಲಭ್ಯವಿದೆ ({{type}} - {{date}}).\nಎರಡನೇ ವರದಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಹೋಲಿಸಿ ನೋಡಿ!",
    noReports: "ಆರೋಗ್ಯ ವರದಿಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗಿಲ್ಲ.",
    summaryHeader: "### 🩺 {{name}} ಅವರ ಆರೋಗ್ಯ ಸಾರಾಂಶ\n\nನಿಮ್ಮ ಪ್ರಸ್ತುತ ಆರೋಗ್ಯ ವಿವರಗಳು:\n",
    activeMedsSummary: "• **ಸಕ್ರಿಯ ಔಷಧಿಗಳು**: {{count}} ನೋಂದಣಿಯಾಗಿವೆ\n",
    todayDosesSummary: "• **ಇಂದಿನ ಔಷಧಿ ಸಮಯಗಳು**: {{count}} ಘಟನೆಗಳು\n",
    reportsSummary: "• **ಪರಿಶೀಲಿಸಿದ ವರದಿಗಳು**: {{count}} ದಾಖಲೆಗಳು\n",
    vitalsSummary: "• **ಟ್ರ್ಯಾಕ್ ಮಾಡಿದ ಅಳತೆಗಳು**: {{count}} ಅಳತೆಗಳು\n",
    allergiesSummary: "• **ಅಲರ್ಜಿಗಳು**: {{allergies}}\n",
    suggestedHeader: "\nನೀವು ಕೇಳಬಹುದು:\n- *\"ಇಂದು ನನಗೆ ಯಾವ ಔಷಧಿಗಳಿವೆ?\"*\n- *\"ನನ್ನ ರಕ್ತದ ಸಕ್ಕರೆ ಮಟ್ಟ ಎಷ್ಟು?\"*\n- *\"ನನ್ನ ಇತ್ತೀಚಿನ ವರದಿಗಳನ್ನು ಹೋಲಿಸಿ\"*\n- *\"ನನ್ನ ಹಿಮೋಗ್ಲೋಬಿನ್ ವಿವರಿಸಿ\"*\n",
    modeSimplePrefix: "\n\n💡 **ಸರಳ ವಿವರಣೆ:**\n",
    modeStandardPrefix: "\n\n📋 **ವೈದ್ಯಕೀಯ ವಿವರಣೆ:**\n",
    modeDetailedPrefix: "\n\n🔬 **ವಿವರವಾದ ಜೈವಿಕ ವಿವರಣೆ:**\n",
    modeDetailedSuffix: "\n*ಗಮನಿಸಿ*: ಲ್ಯಾಬ್ ಉಲ್ಲೇಖ ಶ್ರೇಣಿಗಳು ಪರೀಕ್ಷಾ ವಿಧಾನದ ಆಧಾರದ ಮೇಲೆ ಬದಲಾಗಬಹುದು.",
    disclaimer: "ವಿಟಾಕೇರ್ AI ಶೈಕ್ಷಣಿಕ ಮಾಹಿತಿಯನ್ನು ಮಾತ್ರ ನೀಡುತ್ತದೆ. ಇದು ವೈದ್ಯರ ಸಲಹೆಗೆ ಪರ್ಯಾಯವಲ್ಲ."
  },

  hi: {
    emergencyTitle: "⚠️ **तत्काल चिकित्सा सुरक्षा चेतावनी**",
    emergencyBody: "आपके द्वारा बताए गए लक्षण गंभीर आपातकालीन स्थिति का संकेत हो सकते हैं।\n\n• **तत्काल कार्रवाई**: कृपया तुरंत आपातकालीन सेवाओं (108 / 112) को कॉल करें।\n• **आपातकालीन SOS**: अभिभावक को तुरंत सतर्क करने के लिए डैशबोर्ड पर SOS बटन दबाएं।\n• विटाकेयर AI केवल एक स्वास्थ्य सहायक है, **डॉक्टर नहीं**।\n\nकृपया तुरंत डॉक्टर से संपर्क करें।",
    emergencyDisclaimer: "विटाकेयर AI डॉक्टर नहीं है और आपातकालीन उपचार प्रदान नहीं करता है।",
    medScheduleHeader: "### 💊 आज का दवा शेड्यूल\n\n",
    medScheduledFor: "निर्धारित समय",
    instructions: "निर्देश",
    statusLabel: "स्थिति",
    statusTaken: "✅ ले ली गई (सत्यापित)",
    statusMissed: "❌ छूट गई",
    statusUpcoming: "⏳ आगामी",
    nextDose: "अगली दवा",
    activeMedsCount: "आपकी प्रोफ़ाइल में **{{count}}** सक्रिय दवाइयां हैं:\n",
    noMedsToday: "आज के लिए कोई दवा निर्धारित नहीं है। आप नया पर्चा अपलोड कर सकते हैं।",
    medKnowledge: "चिकित्सक के निर्देशानुसार भोजन के साथ या बाद में नियमित रूप से दवाएं लें।",
    glucoseHeader: "### 🩸 आपके ब्लड ग्लूकोज रिकॉर्ड (Blood Glucose)\n\n",
    recordedOn: "दर्ज की गई तारीख",
    statusIndicator: "स्थिति",
    elevatedNote: "\n*नोट*: कुछ ग्लूकोज रीडिंग सामान्य सीमा से थोड़ी अधिक हैं।",
    noGlucoseFound: "आपकी रिपोर्ट में ब्लड शुगर का कोई माप अभी नहीं मिला है।",
    glucoseKnowledge: "खाली पेट ब्लड शुगर 70-99 mg/dL सामान्य है। 100-125 mg/dL प्री-डायबिटीज और 126 mg/dL या अधिक डायबिटीज का संकेत है।",
    hbHeader: "### 🔬 आपका हीमोग्लोबिन स्तर (Hemoglobin - Hb)\n\n",
    stdRefRange: "मानक संदर्भ सीमा",
    recordedDate: "दर्ज तारीख",
    verifiedByPatient: "रोगी द्वारा सत्यापित",
    trendDiff: "बदलाव: पिछला माप {{date}} को **{{prev}}** था (अंतर: {{diff}})।",
    noHbFound: "हीमोग्लोबिन माप दर्ज नहीं है। कृपया सीबीसी (CBC) रिपोर्ट अपलोड करें।",
    hbKnowledge: "हीमोग्लोबिन लाल रक्त कोशिकाओं में ऑक्सीजन ले जाने वाला प्रोटीन है। पुरुषों के लिए 13.5–17.5 g/dL और महिलाओं के लिए 12.0–15.5 g/dL सामान्य सीमा है।",
    bpHeader: "### 💓 आपका रक्तचाप रिकॉर्ड (Blood Pressure - BP)\n\n",
    currentReading: "वर्तमान माप",
    stdTarget: "मानक लक्ष्य: < 120/80 mmHg",
    noBpFound: "रक्तचाप का कोई माप दर्ज नहीं है।",
    bpKnowledge: "रक्तचाप सिस्टोलिक और डायस्टोलिक से बना होता है। सामान्य रक्तचाप 120/80 mmHg से कम होना चाहिए।",
    compareHeader: "### 📊 लैब रिपोर्ट तुलना अवलोकन\n\nआपकी पिछली दो रिपोर्टों की तुलना:\n",
    noOverlap: "दोनों रिपोर्टों में अलग-अलग परीक्षण हैं। पूरी जानकारी **रिपोर्ट तुलना** में देखें।\n",
    singleReport: "वर्तमान में केवल **1 रिपोर्ट** उपलब्ध है ({{type}} - {{date}})।\nदूसरी रिपोर्ट अपलोड करके तुलना करें!",
    noReports: "कोई स्वास्थ्य रिपोर्ट अपलोड नहीं की गई है।",
    summaryHeader: "### 🩺 {{name}} का स्वास्थ्य सारांश\n\nआपकी वर्तमान स्वास्थ्य प्रोफ़ाइल:\n",
    activeMedsSummary: "• **सक्रिय दवाइयां**: {{count}} पंजीकृत\n",
    todayDosesSummary: "• **आज की निर्धारित खुराक**: {{count}} घटनाएं\n",
    reportsSummary: "• **सत्यापित रिपोर्टें**: {{count}} दस्तावेज़\n",
    vitalsSummary: "• **ट्रैक किए गए बायोमार्कर**: {{count}} माप\n",
    allergiesSummary: "• **एलर्जी**: {{allergies}}\n",
    suggestedHeader: "\nआप पूछ सकते हैं:\n- *\"आज मेरी कौन सी दवाएं हैं?\"*\n- *\"मेरा ब्लड शुगर स्तर क्या है?\"*\n- *\"मेरी रिपोर्टों की तुलना करें\"*\n- *\"मेरे हीमोग्लोबिन के बारे में बताएं\"*\n",
    modeSimplePrefix: "\n\n💡 **सरल शब्दों में:**\n",
    modeStandardPrefix: "\n\n📋 **चिकित्सीय संदर्भ:**\n",
    modeDetailedPrefix: "\n\n🔬 **विस्तृत जैविक संदर्भ:**\n",
    modeDetailedSuffix: "\n*नोट*: परीक्षण पद्धति के आधार पर संदर्भ सीमाएं थोड़ी भिन्न हो सकती हैं।",
    disclaimer: "विटाकेयर AI केवल शैक्षिक जानकारी प्रदान करता है। यह डॉक्टर के परामर्श का विकल्प नहीं है।"
  },

  bn: {
    emergencyTitle: "⚠️ **জরুরি চিকিৎসা নিরাপত্তা সতর্কতা**",
    emergencyBody: "আপনার উল্লেখিত লক্ষণগুলি একটি তীব্র জরুরি চিকিৎসার ইঙ্গিত দিতে পারে।\n\n• **তাৎক্ষণিক পদক্ষেপ**: অনুগ্রহ করে অবিলম্বে জরুরি পরিষেবাতে (108 / 112) কল করুন।\n• **জরুরি SOS**: ড্যাশবোর্ডে SOS বোতাম টিপে অভিভাবককে সতর্ক করুন।\n• ভিটাকെയர் AI কেবলমাত্র একটি সহায়ক, **চিকিৎসক নয়**।\n\nঅবিলম্বে ডাক্তারের পরামর্শ নিন।",
    emergencyDisclaimer: "ভিটাকെയர் AI ডাক্তার নয় এবং জরুরি চিকিৎসা প্রদান করে না।",
    medScheduleHeader: "### 💊 আজকের ওষুধের সময়সূচী\n\n",
    medScheduledFor: "নির্ধারিত সময়",
    instructions: "নির্দেশনা",
    statusLabel: "অবস্থা",
    statusTaken: "✅ গ্রহণ করা হয়েছে (যাচাইকৃত)",
    statusMissed: "❌ মিস হয়েছে",
    statusUpcoming: "⏳ আসন্ন",
    nextDose: "পরবর্তী ওষুধ",
    activeMedsCount: "আপনার প্রোফাইলে **{{count}}** টি সক্রিয় ওষুধ রয়েছে:\n",
    noMedsToday: "আজকের জন্য কোনো ওষুধ নির্ধারিত নেই। প্রেসক্রিপশন আপলোড করতে পারেন।",
    medKnowledge: "ডাক্তারের পরামর্শ অনুযায়ী নির্দিষ্ট সময়ে খাবারের সাথে নিয়মিত ওষুধ গ্রহণ করুন।",
    glucoseHeader: "### 🩸 আপনার রক্তের শর্করার রেকর্ড (Blood Glucose)\n\n",
    recordedOn: "রেকর্ডের তারিখ",
    statusIndicator: "অবস্থা",
    elevatedNote: "\n*নোট*: কিছু শর্করার পরিমাপ স্বাভাবিক সীমার চেয়ে বেশি।",
    noGlucoseFound: "রক্তের শর্করার পরিমাপ এখনও পাওয়া যায়নি।",
    glucoseKnowledge: "খালি পেটে রক্তের শর্কራ 70-99 mg/dL স্বাভাবিক। 100-125 mg/dL প্রি-ডায়াবেটিস এবং 126 mg/dL বা তার বেশি ডায়াবেটিস নির্দেশ করে।",
    hbHeader: "### 🔬 আপনার হিমোগ্লোবিনের মাত্রা (Hemoglobin - Hb)\n\n",
    stdRefRange: "রেফারেন্স সীমা",
    recordedDate: "রেকর্ডের তারিখ",
    verifiedByPatient: "রোগী কর্তৃক যাচাইকৃত",
    trendDiff: "পরিবর্তন: পূর্ববর্তী পরিমাপ {{date}} তারিখে **{{prev}}** ছিল (পার্থক্য: {{diff}})।",
    noHbFound: "হিমোগ্লোবিন পরিমাপ এখনও নেই। সিবিসি (CBC) রিপোর্ট আপলোড করুন।",
    hbKnowledge: "হিমোগ্লোবিন লোহিত রক্তকণিকায় অক্সিজেন পরিবহনকারী প্রোটিন। পুরুষদের জন্য 13.5–17.5 g/dL এবং মহিলাদের জন্য 12.0–15.5 g/dL স্বাভাবিক।",
    bpHeader: "### 💓 আপনার রক্তচাপের রেকর্ড (Blood Pressure - BP)\n\n",
    currentReading: "বর্তমান পরিমাপ",
    stdTarget: "স্বাভাবিক লক্ষ্য: < 120/80 mmHg",
    noBpFound: "রক্তচাপের কোনো পরিমাপ নেই।",
    bpKnowledge: "রক্তচাপ সিস্টোলিক এবং ডায়াস্টোলিক নিয়ে গঠিত। স্বাভাবিক রক্তচাপ 120/80 mmHg এর নিচে থাকা উচিত।",
    compareHeader: "### 📊 ল্যাব রিপোর্ট তুলনা\n\nআপনার সাম্প্রতিক দুটি রিপোর্টের তুলনা:\n",
    noOverlap: "উভয় রিপোর্টে ভিন্ন পরীক্ষা রয়েছে। বিস্তারিত **রিপোর্ট তুলনা** বিভাগে দেখুন।\n",
    singleReport: "বর্তমানে কেবল **1টি রিপোর্ট** আছে ({{type}} - {{date}})।\nদ্বিতীয় রিপোর্ট আপলোড করে তুলনা করুন!",
    noReports: "কোনো স্বাস্থ্য রিপোর্ট আপলোড করা হয়নি।",
    summaryHeader: "### 🩺 {{name}} এর স্বাস্থ্য সারাংশ\n\nআপনার বর্তমান স্বাস্থ্য প্রোফাইল:\n",
    activeMedsSummary: "• **সক্রিয় ওষুধ**: {{count}} টি\n",
    todayDosesSummary: "• **আজকের ডোজ**: {{count}} টি\n",
    reportsSummary: "• **যাচাইকৃত রিপোর্ট**: {{count}} টি\n",
    vitalsSummary: "• **ট্র্যাক করা বায়োমার্কার**: {{count}} টি\n",
    allergiesSummary: "• **অ্যালার্জি**: {{allergies}}\n",
    suggestedHeader: "\nআপনি জিজ্ঞাসা করতে পারেন:\n- *\"আজ আমার কী কী ওষুধ আছে?\"*\n- *\"আমার রক্তের শর্করা কত?\"*\n- *\"আমার রিপোর্টগুলো তুলনা করুন\"*\n- *\"আমার হিমোগ্লোবিন ব্যাখ্যা করুন\"*\n",
    modeSimplePrefix: "\n\n💡 **সহজ কথায়:**\n",
    modeStandardPrefix: "\n\n📋 **চিকিৎসা প্রসঙ্গ:**\n",
    modeDetailedPrefix: "\n\n🔬 **বিস্তারিত জৈবিক ব্যাখ্যা:**\n",
    modeDetailedSuffix: "\n*নোট*: ল্যাব রেফারেন্স সীমা পরীক্ষা পদ্ধতির উপর ভিত্তি করে পরিবর্তিত হতে পারে।",
    disclaimer: "ভিটাকെയர் AI কেবল তথ্য সরবরাহ করে। এটি ডাক্তারের বিকল্প নয়।"
  },

  mr: {
    emergencyTitle: "⚠️ **तातडीची वैद्यकीय सुरक्षा चेतावणी**",
    emergencyBody: "तुम्ही नमूद केलेली लक्षणे गंभीर वैद्यकीय आणीबाणी दर्शवू शकतात.\n\n• **तातडीची कृती**: कृपया तात्काळ रुग्णवाहिका किंवा आणीबाणी सेवांना (108 / 112) कॉल करा.\n• **आणीबाणी SOS**: पालकांना त्वरित सूचना देण्यासाठी डॅशबोर्डवरील SOS बटण दाबा.\n• व्हिटाकेअर AI केवळ एक सहाय्यक आहे, **डॉक्टर नाही**.\n\nकृपया त्वरित डॉक्टरांचा सल्ला घ्या.",
    emergencyDisclaimer: "व्हिटाकेअर AI डॉक्टर नाही आणि आपत्कालीन उपचार देत नाही.",
    medScheduleHeader: "### 💊 आजचे औषध वेळापत्रक\n\n",
    medScheduledFor: "नियोजित वेळ",
    instructions: "सूचना",
    statusLabel: "स्थिती",
    statusTaken: "✅ घेतले (सत्यापित)",
    statusMissed: "❌ चुकले",
    statusUpcoming: "⏳ आगामी",
    nextDose: "पुढील औषध",
    activeMedsCount: "तुमच्या प्रोफाइलमध्ये **{{count}}** सक्रिय औषधे आहेत:\n",
    noMedsToday: "आजसाठी कोणतीही औषधे नियोजित नाहीत. नवीन प्रिस्क्रिप्शन अपलोड करू शकता.",
    medKnowledge: "डॉक्टरांच्या सल्ल्यानुसार जेवणासोबत नियमितपणे औषधे वेळेवर घ्या.",
    glucoseHeader: "### 🩸 रक्तातील साखरेचे मोजमाप (Blood Glucose)\n\n",
    recordedOn: "नोंदवलेली तारीख",
    statusIndicator: "स्थिती",
    elevatedNote: "\n*टीप*: रक्तातील साखरेचे काही मोजमाप सामान्य पातळीपेक्षा जास्त आहे.",
    noGlucoseFound: "रक्तातील साखरेचे मोजमाप अद्याप उपलब्ध नाही.",
    glucoseKnowledge: "उपाशीपोटी रक्तातील साखर 70-99 mg/dL सामान्य असते. 100-125 mg/dL प्री-डायबिटीज आणि 126 mg/dL किंवा त्याहून अधिक मधुमेह दर्शवते.",
    hbHeader: "### 🔬 तुमची हिमोग्लोबिन पातळी (Hemoglobin - Hb)\n\n",
    stdRefRange: "संदर्भ श्रेणी",
    recordedDate: "नोंद तारीख",
    verifiedByPatient: "रुग्णाने सत्यापित केले",
    trendDiff: "बदल: मागील मोजमाप {{date}} रोजी **{{prev}}** होते (फरक: {{diff}}).",
    noHbFound: "हिमोग्लोबिन मोजमाप नोंदवलेले नाही. कृपया सीबीसी (CBC) अहवाल अपलोड करा.",
    hbKnowledge: "हिमोग्लोबिन हे लाल रक्तपेशींमध्ये ऑक्सिजन वाहून नेणारे प्रथिन आहे. पुरुषांसाठी 13.5–17.5 g/dL आणि स्त्रियांसाठी 12.0–15.5 g/dL सामान्य श्रेणी आहे.",
    bpHeader: "### 💓 तुमचा रक्तदाब रेकॉर्ड (Blood Pressure - BP)\n\n",
    currentReading: "सध्याचे मोजमाप",
    stdTarget: "सामान्य लक्ष्य: < 120/80 mmHg",
    noBpFound: "रक्तदाबाचे मोजमाप नोंदवलेले नाही.",
    bpKnowledge: "रक्तदाब सिस्टोलिक आणि डायस्टोलिक असतो. सामान्य रक्तदाब 120/80 mmHg पेक्षा कमी असावा.",
    compareHeader: "### 📊 लॅब अहवाल तुलना\n\nतुमच्या मागील दोन अहवालांची तुलना:\n",
    noOverlap: "दोन्ही अहवालांमध्ये भिन्न चाचण्या आहेत. पूर्ण माहितीसाठी **अहवाल तुलना** पहा.\n",
    singleReport: "सध्या फक्त **1 अहवाल** उपलब्ध आहे ({{type}} - {{date}}).\nदुसरा अहवाल अपलोड करून तुलना करा!",
    noReports: "आरोग्य अहवाल अपलोड केलेले नाहीत.",
    summaryHeader: "### 🩺 {{name}} यांचा आरोग्य सारांश\n\nतुमची सध्याची आरोग्य माहिती:\n",
    activeMedsSummary: "• **सक्रिय औषधे**: {{count}} नोंदणीकृत\n",
    todayDosesSummary: "• **आजचे नियोजित डोस**: {{count}} वेळा\n",
    reportsSummary: "• **सत्यापित अहवाल**: {{count}} दस्तऐवज\n",
    vitalsSummary: "• **ट्रॅक केलेले बायोमार्कर्स**: {{count}} मोजमाप\n",
    allergiesSummary: "• **ॲलर्जी**: {{allergies}}\n",
    suggestedHeader: "\nतुम्ही विचारू शकता:\n- *\"आज माझी कोणती औषधे आहेत?\"*\n- *\"माझी रक्तातील साखरेची पातळी काय आहे?\"*\n- *\"माझ्या अलीकडील अहवालांची तुलना करा\"*\n- *\"माझ्या हिमोग्लोबिनबद्दल सांगा\"*\n",
    modeSimplePrefix: "\n\n💡 **सोप्या शब्दांत:**\n",
    modeStandardPrefix: "\n\n📋 **वैद्यकीय संदर्भ:**\n",
    modeDetailedPrefix: "\n\n🔬 **तपशीलवार जैविक संदर्भ:**\n",
    modeDetailedSuffix: "\n*टीप*: चाचणी पद्धतीनुसार संदर्भ श्रेणी थोडी बदलू शकते.",
    disclaimer: "व्हिटाकेअर AI केवळ शैक्षणिक माहिती पुरवतो. हा डॉक्टरांच्या सल्ल्याचा पर्याय नाही."
  }
};

class AiCopilotService {
  /**
   * Invokes Google Gemini Generative AI API with clinical grounding
   */
  async callGemini(systemPrompt, userMessage) {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not configured in environment.');
      return null;
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: `${systemPrompt}\n\nPatient Question: "${userMessage}"` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 1200
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Gemini API returned status ${response.status}:`, errText);
        return null;
      }

      const data = await response.json();
      const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return generated ? generated.trim() : null;
    } catch (err) {
      clearTimeout(timeout);
      console.warn('Gemini API call failed, falling back to local clinical engine:', err.message);
      return null;
    }
  }

  /**
   * Main entrypoint to generate localized AI Copilot response.
   * @param {string} userId - Authenticated user ID
   * @param {string} userMessage - Natural language patient query
   * @param {string} mode - 'simple' | 'standard' | 'detailed'
   * @param {string} requestedLang - 'en' | 'ta' | 'te' | 'ml' | 'kn' | 'hi' | 'bn' | 'mr'
   */
  async generateResponse(userId, userMessage, mode = 'simple', requestedLang = null) {
    const user = db.findById('users', userId);
    const lang = requestedLang || user?.preferredLanguage || 'en';
    const loc = AI_LOCALES[lang] || AI_LOCALES['en'];

    const profile = db.findOne('user_profiles', p => p.userId === userId);
    const reports = db.find('health_reports', r => r.userId === userId);
    const vitals = db.find('vitals', v => v.userId === userId);
    const medicines = db.find('medicines', m => m.userId === userId && m.isActive);
    const today = new Date().toISOString().split('T')[0];
    const todaySchedules = db.find('medicine_schedules', s => s.userId === userId && s.scheduledDate === today);

    const query = (userMessage || '').toLowerCase();

    // 1. Critical Emergency Symptom Triage Check
    const emergencyKeywords = [
      'chest pain', 'heart attack', 'cannot breathe', 'severe shortness of breath',
      'stroke', 'sudden weakness', 'face drooping', 'slurred speech',
      'severe bleeding', 'unconscious', 'overdose', 'anaphylaxis', 'choking',
      'நெஞ்சு வலி', 'மூச்சுத் திணறல்', 'గుండె నొప్పి', 'శ్వాస ఆడకపోవడం',
      'നെഞ്ചുവേദന', 'ശ്വാസതടസ്സം', 'ಎದೆ ನೋವು', 'ಉಸಿರಾಟದ ತೊಂದರೆ',
      'सीने में दर्द', 'सांस लेने में तकलीफ', 'বুকে ব্যথা', 'শ্বাসকষ্ট', 'छातीत दुखणे'
    ];
    const hasEmergencyKeywords = emergencyKeywords.some(kw => query.includes(kw));

    if (hasEmergencyKeywords) {
      return {
        reply: `${loc.emergencyTitle}\n\n${loc.emergencyBody}`,
        mode: mode,
        language: lang,
        contextUsed: { emergencyTriggered: true },
        hasEmergencyWarning: true,
        disclaimer: loc.emergencyDisclaimer
      };
    }

    // 2. Attempt Google Gemini AI Generation with Full Clinical Prompt Context
    const languageNames = {
      en: 'English',
      ta: 'Tamil (தமிழ்)',
      te: 'Telugu (తెలుగు)',
      ml: 'Malayalam (മലയാളം)',
      kn: 'Kannada (ಕನ್ನಡ)',
      hi: 'Hindi (हिन्दी)',
      bn: 'Bengali (বাংলা)',
      mr: 'Marathi (मराठी)'
    };
    const targetLanguage = languageNames[lang] || 'English';

    const systemPrompt = `You are VitaCare AI – an empathetic, intelligent, and clinically grounded personal health assistant copilot.
Your mission is to help the patient understand their verified medical records, active prescription regimens, scheduled doses, diagnostic laboratory biomarkers, and physiological health trends.

CLINICAL & SAFETY OPERATING RULES:
1. Medical Disclaimer: You are an assistive health copilot and organizer, NOT an emergency response system or licensed medical doctor. Always provide educational clarity and recommend consulting a physician.
2. Grounding: Ground all statements strictly in the patient's verified health context below. Do not fabricate unrecorded laboratory values or prescriptions.
3. Response Mode:
   - "simple": Use plain, everyday language, simple bullet points, and intuitive analogies. Avoid technical jargon.
   - "standard": Balanced clinical overview with clear medication adherence guidance.
   - "detailed": Deep biological, biochemical, and physiological context with clinical reference intervals and pathophysiological significance.
4. Output Language: Formulate your entire response in ${targetLanguage}. Maintain standard clinical metric units intact (e.g. mg/dL, mmHg, g/dL, %).
5. Emergency Protocol: If any severe symptom is mentioned, instruct the patient to contact local emergency services immediately (911/112/108) or tap Emergency SOS.

PATIENT'S VERIFIED HEALTH CONTEXT:
- Patient Name: ${user?.name || 'Patient'}
- Blood Group: ${user?.bloodGroup || 'Not specified'}
- Allergies: ${(profile?.allergies && profile.allergies.length > 0) ? (Array.isArray(profile.allergies) ? profile.allergies.join(', ') : profile.allergies) : 'None recorded'}
- Chronic Conditions: ${(profile?.chronicConditions && profile.chronicConditions.length > 0) ? (Array.isArray(profile.chronicConditions) ? profile.chronicConditions.join(', ') : profile.chronicConditions) : 'None recorded'}
- Active Medications (${medicines.length}): ${medicines.map(m => `${m.name} (${m.dosage}, ${m.frequency})`).join('; ') || 'No active medications'}
- Today's Dose Schedule (${todaySchedules.length}): ${todaySchedules.map(s => `${s.scheduledTime} - ${s.medicineName} (${s.dosage}) [Status: ${s.status}]`).join('; ') || 'No doses scheduled for today'}
- Recent Tracked Vitals (${vitals.length}): ${vitals.slice(-6).map(v => `${v.metricName}: ${v.value} ${v.unit} (Ref: ${v.referenceRange || 'Standard'}, Date: ${v.date})`).join('; ') || 'No vitals recorded'}
- Verified Diagnostic Reports (${reports.length}): ${reports.slice(-3).map(r => `${r.reportType} from ${r.labName} (${r.reportDate})`).join('; ') || 'No reports uploaded'}
- Current Response Mode: ${mode.toUpperCase()}
`;

    const geminiReply = await this.callGemini(systemPrompt, userMessage);
    if (geminiReply) {
      const finalReply = `${geminiReply}\n\n---\n*${loc.disclaimer}*`;

      // Save to conversation history
      db.insert('ai_conversations', {
        userId,
        role: 'user',
        content: userMessage,
        mode,
        language: lang,
        createdAt: new Date().toISOString()
      });

      db.insert('ai_conversations', {
        userId,
        role: 'assistant',
        content: finalReply,
        mode,
        language: lang,
        contextUsed: {
          vitalsCount: vitals.length,
          medicinesCount: medicines.length,
          reportsCount: reports.length,
          model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
        },
        createdAt: new Date().toISOString()
      });

      return {
        reply: finalReply,
        mode,
        language: lang,
        userDataCitations: [
          ...medicines.map(m => `Medication: ${m.name} (${m.dosage})`),
          ...vitals.slice(-3).map(v => `${v.metricName}: ${v.value} ${v.unit}`)
        ],
        contextUsed: {
          vitalsCount: vitals.length,
          reportsCount: reports.length,
          medicinesCount: medicines.length,
          aiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
        },
        disclaimer: loc.disclaimer
      };
    }

    // 3. Fallback to Built-in Multi-language Deterministic Clinical Engine
    let reply = '';
    const userDataCitations = [];
    let generalKnowledge = '';

    // 2. Intent Detection & Multilingual Dynamic Response Generation

    // A. Medicine / Schedule Query
    if (
      query.includes('medicine') || query.includes('schedule') || query.includes('pills') || query.includes('tablets') ||
      query.includes('மருந்து') || query.includes('மாத்திரை') || query.includes('మందు') || query.includes('ಮಾತ್ರೆ') ||
      query.includes('മരുന്ന്') || query.includes('दवा') || query.includes('औषध') || query.includes('ওষুধ')
    ) {
      if (todaySchedules.length > 0) {
        reply += loc.medScheduleHeader;
        todaySchedules.forEach(s => {
          const statusText = s.status === 'taken' || s.status === 'Verified' ? loc.statusTaken : s.status === 'missed' ? loc.statusMissed : loc.statusUpcoming;
          reply += `• **${s.scheduledTime}** — **${s.medicineName}** (${s.dosage})\n  *${loc.instructions}*: ${s.instructions || 'As prescribed'} | *${loc.statusLabel}*: ${statusText}\n`;
          userDataCitations.push(`${s.medicineName} ${loc.medScheduledFor} ${s.scheduledTime}`);
        });

        const nextMed = todaySchedules.find(s => s.status === 'upcoming' || s.status === 'due_now' || s.status === 'Pending');
        if (nextMed) {
          reply += `\n**${loc.nextDose}:** **${nextMed.medicineName}** (${nextMed.dosage}) @ **${nextMed.scheduledTime}**.\n`;
        }
      } else if (medicines.length > 0) {
        reply += loc.activeMedsCount.replace('{{count}}', medicines.length);
        medicines.forEach(m => {
          reply += `• **${m.name}** ${m.dosage} — ${m.frequency} (${m.instructions || 'As directed'})\n`;
        });
      } else {
        reply += loc.noMedsToday;
      }
      generalKnowledge = loc.medKnowledge;
    }

    // B. Glucose / Diabetes Query
    else if (
      query.includes('glucose') || query.includes('sugar') || query.includes('diabetes') || query.includes('hba1c') ||
      query.includes('சர்க்கரை') || query.includes('చక్కెర') || query.includes('പഞ്ചസാര') || query.includes('ಸಕ್ಕರೆ') ||
      query.includes('शुगर') || query.includes('शर्करा') || query.includes('साखर')
    ) {
      const glucoseVitals = vitals.filter(v => v.metricKey.includes('glucose') || v.metricKey.includes('hba1c'));
      if (glucoseVitals.length > 0) {
        reply += loc.glucoseHeader;
        glucoseVitals.forEach(v => {
          reply += `• **${v.metricName}**: **${v.value} ${v.unit}** (Ref: ${v.referenceRange || '70-99 mg/dL'})\n  *${loc.recordedOn}*: ${v.date} | *${loc.statusIndicator}*: ${v.statusIndicator.toUpperCase()}\n`;
          userDataCitations.push(`${v.metricName}: ${v.value} ${v.unit} on ${v.date}`);
        });

        if (glucoseVitals.some(v => v.statusIndicator === 'elevated')) {
          reply += loc.elevatedNote;
        }
      } else {
        reply += loc.noGlucoseFound;
      }
      generalKnowledge = loc.glucoseKnowledge;
    }

    // C. Hemoglobin / CBC Query
    else if (
      query.includes('hemoglobin') || query.includes('hb') || query.includes('anemia') || query.includes('cbc') ||
      query.includes('ஹீமோகுளோபின்') || query.includes('హిమోగ్లోబిన్') || query.includes('ഹീമോഗ്ലോബിൻ') || query.includes('ಹಿಮೋಗ್ಲೋಬಿನ್') ||
      query.includes('हीमोग्लोबिन') || query.includes('হিমোগ্লোবিন') || query.includes('हिमोग्लोबिन')
    ) {
      const hbVitals = vitals.filter(v => v.metricKey === 'hemoglobin');
      if (hbVitals.length > 0) {
        const latest = hbVitals[hbVitals.length - 1];
        reply += loc.hbHeader;
        reply += `• **Hemoglobin**: **${latest.value} ${latest.unit}**\n• **${loc.stdRefRange}**: ${latest.referenceRange || '13.0 - 17.5 g/dL'}\n• **${loc.recordedDate}**: ${latest.date}\n• **${loc.statusIndicator}**: ${loc.verifiedByPatient}\n\n`;
        userDataCitations.push(`Hemoglobin: ${latest.value} ${latest.unit} on ${latest.date}`);

        if (hbVitals.length > 1) {
          const prev = hbVitals[hbVitals.length - 2];
          const diff = (parseFloat(latest.value) - parseFloat(prev.value)).toFixed(1);
          reply += loc.trendDiff.replace('{{prev}}', `${prev.value} ${prev.unit}`).replace('{{date}}', prev.date).replace('{{diff}}', `${diff > 0 ? '+' : ''}${diff} ${latest.unit}`) + '\n\n';
        }
      } else {
        reply += loc.noHbFound;
      }
      generalKnowledge = loc.hbKnowledge;
    }

    // D. Blood Pressure Query
    else if (
      query.includes('blood pressure') || query.includes('bp') || query.includes('hypertension') ||
      query.includes('இரத்த அழுத்தம்') || query.includes('రక్తపోటు') || query.includes('രക്തസമ്മർദ്ദം') || query.includes('ರಕ್ತದೊತ್ತಡ') ||
      query.includes('रक्तचाप') || query.includes('রক্তচাপ') || query.includes('रक्तदाब')
    ) {
      const bpVitals = vitals.filter(v => v.metricKey === 'blood_pressure');
      if (bpVitals.length > 0) {
        const latest = bpVitals[bpVitals.length - 1];
        reply += loc.bpHeader;
        reply += `• **${loc.currentReading}**: **${latest.value} ${latest.unit}**\n• **${loc.stdTarget}**\n• **${loc.recordedDate}**: ${latest.date}\n• **${loc.statusIndicator}**: ${latest.statusIndicator.toUpperCase()}\n\n`;
        userDataCitations.push(`Blood Pressure: ${latest.value} ${latest.unit} on ${latest.date}`);
      } else {
        reply += loc.noBpFound;
      }
      generalKnowledge = loc.bpKnowledge;
    }

    // E. Compare Reports Query
    else if (
      query.includes('compare') || query.includes('comparison') || query.includes('reports') ||
      query.includes('ஒப்பிடு') || query.includes('పోల్చండి') || query.includes('താരതമ്യം') || query.includes('ಹೋಲಿಸಿ') ||
      query.includes('तुलना') || query.includes('তুলনা')
    ) {
      if (reports.length >= 2) {
        const r1 = reports[reports.length - 2];
        const r2 = reports[reports.length - 1];
        reply += loc.compareHeader;
        reply += `1. **${r1.reportType}** (${r1.reportDate})\n`;
        reply += `2. **${r2.reportType}** (${r2.reportDate})\n\n`;

        const v1List = db.find('extracted_health_values', v => v.reportId === r1.id);
        const v2List = db.find('extracted_health_values', v => v.reportId === r2.id);

        let comparedCount = 0;
        for (const v2 of v2List) {
          const matchV1 = v1List.find(x => x.metricKey === v2.metricKey);
          if (matchV1) {
            comparedCount++;
            const diff = (parseFloat(v2.value) - parseFloat(matchV1.value)).toFixed(1);
            reply += `• **${v2.metricName}**: ${matchV1.value} ${matchV1.unit} ➔ **${v2.value} ${v2.unit}** (${diff >= 0 ? '+' : ''}${diff})\n`;
          }
        }

        if (comparedCount === 0) {
          reply += loc.noOverlap;
        }
      } else if (reports.length === 1) {
        reply += loc.singleReport.replace('{{type}}', reports[0].reportType).replace('{{date}}', reports[0].reportDate);
      } else {
        reply += loc.noReports;
      }
    }

    // F. General Overview / Summary
    else {
      const patientName = user ? user.name : 'Patient';
      reply += loc.summaryHeader.replace('{{name}}', patientName);
      reply += loc.activeMedsSummary.replace('{{count}}', medicines.length);
      reply += loc.todayDosesSummary.replace('{{count}}', todaySchedules.length);
      reply += loc.reportsSummary.replace('{{count}}', reports.length);
      reply += loc.vitalsSummary.replace('{{count}}', vitals.length);
      if (profile && profile.allergies && profile.allergies.length > 0) {
        reply += loc.allergiesSummary.replace('{{allergies}}', profile.allergies.join(', '));
      }
      reply += loc.suggestedHeader;
    }

    // 3. Mode Explanations (Simple, Standard, Detailed) in Selected Language
    let modeExplanation = '';
    if (mode === 'simple') {
      modeExplanation = generalKnowledge ? `${loc.modeSimplePrefix}${generalKnowledge}` : '';
    } else if (mode === 'detailed') {
      modeExplanation = generalKnowledge ? `${loc.modeDetailedPrefix}${generalKnowledge}${loc.modeDetailedSuffix}` : '';
    } else {
      modeExplanation = generalKnowledge ? `${loc.modeStandardPrefix}${generalKnowledge}` : '';
    }

    const finalResponse = `${reply}${modeExplanation}\n\n---\n*${loc.disclaimer}*`;

    // Save to conversation history
    db.insert('ai_conversations', {
      userId,
      role: 'user',
      content: userMessage,
      mode,
      language: lang,
      createdAt: new Date().toISOString()
    });

    db.insert('ai_conversations', {
      userId,
      role: 'assistant',
      content: finalResponse,
      mode,
      language: lang,
      contextUsed: {
        userDataCitations,
        vitalsCount: vitals.length,
        medicinesCount: medicines.length
      },
      createdAt: new Date().toISOString()
    });

    return {
      reply: finalResponse,
      mode,
      language: lang,
      userDataCitations,
      contextUsed: {
        vitalsCount: vitals.length,
        reportsCount: reports.length,
        medicinesCount: medicines.length
      },
      disclaimer: loc.disclaimer
    };
  }
}

module.exports = new AiCopilotService();
