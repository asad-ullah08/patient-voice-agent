# Voice AI Agent - Patient Registration System

Conversational Voice AI agent accessible via a dialable U.S. phone number that collects patient demographics, persists records to a local SQLite database, and exposes an administrative REST API with a real-time web dashboard.

---

## 1. Submission Deliverables
- **U.S. Phone Number to Call:** +1 (945) 788 9320
- **API Base URL:** [https://overhang-crewman-constable.ngrok-free.dev](https://overhang-crewman-constable.ngrok-free.dev)
- **Dashboard URL:** https://overhang-crewman-constable.ngrok-free.dev/
- **Repository URL:** https://github.com/asad-ullah08/patient-voice-agent

---

## 2. Architecture Overview
- **Telephony & Conversational Layer:** Vapi provisions the inbound U.S. number, runs Deepgram speech-to-text, and streams text-to-speech responses.
- **LLM Engine:** OpenAI gpt-4o-mini conducts natural intake, performs format validation, handles mid-call corrections, and enforces verbal confirmation before saving.
- **Application & Validation:** Node.js/Express service validates payloads, generates UUIDv4 identifiers, and wraps outputs in { data: ..., error: null }.
- **Persistence Engine:** File-backed SQLite (patients.db) ensuring complete data persistence across server restarts and repeated calls.
- **Web Console:** Built-in web dashboard at / displaying live registered patient entries and metrics.

---

## 3. Tech Stack Justification
- **Vapi + gpt-4o-mini:** Recommended in the assessment guidelines to abstract raw SIP/STT/TTS streaming complexity, minimize conversational latency, and ensure structured function calling within the 3-hour limit.
- **Node.js / Express:** Lightweight, non-blocking asynchronous REST framework matching required endpoint structures and JSON response envelopes.
- **SQLite3:** Relational, zero-config file persistence satisfying the requirement that data survives restarts without introducing external cloud network failure points.

---

## 4. Environment Variables
Create a .env file in the root directory:
PORT=3000

---

## 5. Setup & Running Instructions

1. Install dependencies:
   npm install express cors sqlite3 uuid dotenv

2. Start the API & Dashboard server:
   node server.js

3. Expose with ngrok:
   ngrok http --domain=overhang-crewman-constable.ngrok-free.dev 3000

---

## 6. REST API Reference

All responses follow the envelope format: { data: <payload>, error: <string|null> }.

| Method | Endpoint | Description |
|---|---|---|
| GET | /patients | List all active patients. Supports ?last_name=, ?date_of_birth=, ?phone_number= |
| GET | /patients/:id | Retrieve single patient record by UUID |
| POST | /patients | Create new patient record with server-side validation |
| PUT | /patients/:id | Update patient record (full or partial) |
| DELETE | /patients/:id | Soft-delete a record by setting deleted_at timestamp |
| POST | /voice-webhook | Inbound tool-calling integration webhook for Vapi |
| GET | / | Real-time web intake dashboard |

---

## 7. Voice Agent System Prompt
(Configured on Vapi and archived in prompts/system-prompt.txt)

You are Alex, an empathetic, professional medical intake coordinator registering a patient over the phone.

CONVERSATION FLOW:
1. Greet the caller and collect their First and Last Name.
2. Collect required fields one at a time: Date of Birth, Sex (Male/Female/Other/Decline), Phone Number (10 digits), and Address (Street, City, 2-letter State, ZIP).
3. Optional Fields: Ask once if they would like to provide insurance details, emergency contact, or preferred language.
4. Corrections: Acknowledge and update any mid-conversation corrections (spelling, date, phone).
5. Mandatory Verbal Confirmation: You MUST read back all collected details and ask for explicit verbal confirmation before calling save_patient.
6. Completion: Once confirmed, execute save_patient, confirm completion to the caller, and end gracefully.

---

## 8. Known Limitations & Trade-Offs
- SQLite Storage: Selected for immediate file persistence and rapid local execution; high-concurrency production deployments would use PostgreSQL with connection pooling.
- ngrok Ingress: Provides zero-cost public evaluation routing but requires the host machine to stay awake; production systems would run containerized on cloud infrastructure (Render/AWS).
- HIPAA Scope: Patient data is stored without PHI encryption or audit logs, per technical assessment guidelines.
