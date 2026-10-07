# VitaCare AI — Personal Health Copilot
> **"Your Health. Organized. Intelligent. Connected."**

VitaCare AI is a comprehensive, production-grade personal healthcare platform designed to transform fragmented medical documents into a unified, intelligent, and interactive health ecosystem.

---

## 🌟 Key Architecture & Capabilities

1. **Authentication & Data Isolation**
   - User account registration & secure password hashing (Bcrypt + JWT).
   - Multi-tenant medical data isolation: Patient A cannot access Patient B's records.
   - 1-click **Hackathon Evaluator Demo Login** for instantaneous review.

2. **Prescription Processing Pipeline**
   - Inputs: Scanned documents, JPG, PNG, PDF, or Live Camera Capture via HTML5 WebRTC.
   - OCR Engine (Tesseract.js & PDF parsing).
   - AI Information Extraction: Automatically detects doctor name, clinic, dates, medications, dosages, frequency, durations, and food instructions.
   - **Verification Screen**: Zero-hallucination policy. Users review, edit, or append medications before committing to their official record.
   - **Auto Schedule Generator**: Automatically populates daily intake events and adherence tracking.

3. **Medical Health Reports & Biomarker Extraction**
   - Ingestion: Complete Blood Count (CBC), Comprehensive Metabolic Panel (CMP), Lipid Profile, Glycated Hemoglobin (HbA1c), Vitals.
   - Extracts values, units, biological reference ranges, and abnormal indicators (`normal`, `elevated`, `low`).
   - Permanent Version History (V1, V2, etc.) preserving original files.
   - **Report Comparison Tool**: Side-by-side progression matrix calculating quantitative differences and trend directions with non-diagnostic clinical transparency.

4. **Unified Health Tracker & Interactive Trends**
   - Consolidated dashboard of all verified measurements.
   - Source transparency: Cites original report, upload date, extraction method, and user confirmation.
   - Interactive SVG progression charts for longitudinal tracking with Daily, Weekly, Monthly, and Lifetime filters.
   - **Strict Data-Driven Rule**: Never fabricates dummy points. Displays *"Not enough historical data for a trend"* if fewer than 2 readings exist.

5. **Medicine Tracker & Reminders**
   - Visual daily schedule: `Upcoming`, `Due Now`, `Taken`, `Missed`, and `Skipped`.
   - Dose confirmation: Immediate adherence logging and timeline synchronization.
   - Automated voice/phone reminder testing (tagged `DEMO CALL`).

6. **CareConnect (Consent-Based Caregiver Video Check-in)**
   - Live video check-in session for supervised medication adherence.
   - Camera and microphone controls with WebRTC device access.
   - Dedicated caregiver tile for Eleanor Doe (Primary Healthcare Proxy).
   - **Medical Safety Guarantee**: System explicitly disclaims algorithmic swallowing detection; adherence is authenticated via consent-based human witnessing and patient confirmation.

7. **Medication Adherence & Guardian Escalation**
   - Mathematical compliance score calculated from real stored events.
   - 7-Day compliance calendar with green/orange/red status indicators.
   - Guardian escalation alert for missed or overdue doses (tagged `DEMO NOTIFICATION`).

8. **AI Health Copilot**
   - Retrieval-Augmented Health Assistant grounded directly in the user's verified records.
   - 3 Language Modes:
     - **Simple Mode**: Conversational, accessible, everyday language.
     - **Standard Mode**: Clinical clarity and medical definitions.
     - **Detailed Mode**: Comprehensive physiological and biological breakdown.
   - **Medical Safety Guardrails**: Never diagnoses, never alters prescriptions, and immediately triggers urgent safety notices for emergency symptoms.

9. **Emergency SOS System**
   - 5-second countdown with prominent `CANCEL` safety button.
   - Dual contacts: Emergency Medical Services (911/112) & Primary Guardian.
   - Clear `DEMO SOS MODE` indicator for hackathon demonstration.

10. **Medical Timeline**
    - Chronological lifetime health stream combining document uploads, doses taken, vitals updates, CareConnect sessions, and emergency events.

---

## 🚀 Running the Application

### 1. Backend Server
```bash
cd backend
npm install
node server.js
```
*Backend runs on `http://localhost:5000` with SQLite/JSON storage, Multer uploads, Tesseract OCR, and REST APIs.*

### 2. Frontend Web Application
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000` with custom Medical Blue vanilla CSS design system and Lucide icons.*

---

## 🏆 Hackathon Demonstration Flow

1. Open `http://localhost:3000/`.
2. Click **Instant Demo Login** to enter as Johnathan Doe.
3. Click **Load Sample Data [DEMO]** in the top navigation bar to populate verified baseline and follow-up lab panels, prescriptions, and timeline events.
4. Review the **Dashboard**, next medicine card, and today's schedule. Click `[ TAKE NOW ]`.
5. Click `+ ADD PRESCRIPTION` ➔ Click `Use Sample Prescription` ➔ Review the **Editable Verification Screen** ➔ Click `Confirm & Save Verified Prescription`.
6. Click `+ ADD HEALTH REPORT` ➔ Click `Use Sample Lab Report` ➔ Review the **Extracted Biomarkers** ➔ Click `Confirm & Save Verified Health Data`.
7. Navigate to **Compare** to observe side-by-side progression between baseline and follow-up tests.
8. Navigate to **Trends** to view interactive progression curves.
9. Navigate to **CareConnect** ➔ Click `Start Video Check-in [DEMO]` ➔ Click `Confirm Medication Taken`.
10. Navigate to **AI Copilot** ➔ Click *"What medicines do I have today?"* or *"Show my recent blood glucose results"* to see verified data citations.
11. Click the red **SOS** button in the navbar to test emergency protocol handling.
