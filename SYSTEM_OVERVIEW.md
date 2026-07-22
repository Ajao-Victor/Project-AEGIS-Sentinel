# Aegis Sentinel: System Overview & Architecture Logic

**Target Audience:** Project Founders, Stakeholders, and Technical Judges  
**Purpose:** To explain the end-to-end functionality of the Aegis Sentinel application, bridging the gap between clinical value and software engineering execution.

---

## Executive Summary
Aegis Sentinel is a "Clinical Command Center." It is an automated, real-time safety net that monitors patient lab results and cross-references them against active medication regimens to instantly catch fatal drug interactions before they happen. It operates with zero exposure to Protected Health Information (PHI) by utilizing synthetic "Digital Twins."

---

## Step-by-Step System Flow

### Phase 1: Data Ingestion (The Trigger)
** The Layman Concept:** 
Imagine a nurse or doctor gets a new lab result for a patient (like a sudden spike in Potassium levels) and enters it into the hospital system. Aegis acts as the invisible watcher that intercepts this data the millisecond it is submitted.

** The Technical Approach:**
* The user interacts with the React frontend (The Command Center UI). 
* They use the **Lab Event Injector** to submit a simulated lab value. 
* The frontend packages this data into a JSON payload and fires an HTTP `POST` request to the NestJS backend `SimulatorController` at the `/simulate/lab` endpoint. 

### Phase 2: Digital Twin Synchronization (The Context)
** The Layman Concept:** 
To know if a new lab result is dangerous, the system needs to know what medications the patient is already taking. However, privacy laws (HIPAA) make accessing real patient files risky. Instead, Aegis connects to a highly secure, anonymous "Digital Twin"—a synthetic replica of the patient's medical state that contains no personal names or identifiers.

** The Technical Approach:**
* The `AegisMonitorService` acts as the orchestrator.
* On boot, it securely authenticates with the external **HOLON API** using an OAuth2 Grant Token.
* It attaches to a synthetic patient profile (e.g., `pt-8821-alpha-7x`).
* It retrieves the patient's active medication list using universal medical coding standards (RxNorm codes, like `11289` for Warfarin). 

### Phase 3: The Intelligence Engine (The Brain)
** The Layman Concept:** 
This is the core of the application. Aegis takes the new lab result and the patient's current medications and asks: *"Will combining these cause a catastrophic chemical reaction in the body?"* It calculates the risk instantly.

** The Technical Approach:**
* The simulated lab event is pushed directly into the `RulesEngineService`.
* The engine evaluates the specific lab diagnostic (e.g., LOINC code `2823-3`) against the active RxNorm medication array.
* Instead of relying on a static, hardcoded list of bad drug combinations, the system is designed to dynamically query clinical knowledge bases to detect Drug-Drug Interactions (DDI) and metabolic contraindications. 

### Phase 4: Alerting & Audit Logging (The Action)
** The Layman Concept:** 
If the system detects a danger, it does two things simultaneously: it flashes a massive warning to the clinical staff to stop the treatment, and it permanently writes a record of the incident into a secure hospital database so administrators can review it later. 

** The Technical Approach:**
* **Database Write-Back:** If the Rules Engine returns `alertTriggered: true`, the backend instantly formulates a structured incident payload. It uses **TypeORM** to write this payload into a highly scalable **PostgreSQL** database. 
* **Frontend Bubbling:** The `SimulatorController` captures the successful database write and sends the actual PostgreSQL payload *back* to the React frontend.
* **UI Rendering:** The React application parses this raw JSON data into a clean, formatted **Terminal Audit Stream**, displaying a professional incident log (e.g., `System: CARDIOVASCULAR | LOINC: 2823-3 | Value: 6.5 | Severity: HIGH`) confirming the threat was successfully neutralized and logged.

---

## Core Technologies Used

| Layer | Technology | Why We Chose It |
|---|---|---|
| **Frontend** | React 18, Vite | Lightning-fast component rendering and immediate state updates for real-time monitoring. |
| **Styling** | Tailwind CSS (v3.4) | Allowed us to rapidly build a custom, dark-mode "Cyber-Clinical" theme without writing thousands of lines of custom CSS. |
| **Backend API** | NestJS, TypeScript | Provides enterprise-grade architecture. Its modular service/controller structure mimics large-scale production environments perfectly. |
| **Database** | PostgreSQL | The industry standard for reliable, relational data storage. Ensures our medical audit logs are never lost. |
| **Integration** | HOLON API | Provides live clinical intelligence and digital twin infrastructure, proving the app works with real-world medical data structures. |

---

## Why This Matters (The Business Value)

1. **Risk Mitigation:** Medication errors cost the healthcare system billions of dollars and countless lives annually. Aegis automates the detection of these errors.
2. **Compliance by Design:** By utilizing anonymous Digital Twins, the system proves we can perform advanced AI health screening without ever touching or risking a real patient's identity. 
3. **Production Ready:** This is not a fragile hackathon script. The use of NestJS, strict TypeScript interfaces, and PostgreSQL means this exact architecture can be scaled up to monitor an entire hospital network tomorrow.