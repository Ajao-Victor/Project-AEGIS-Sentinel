Here is the complete, professional `README.md` file for Project AEGIS. It is structured to impress hackathon judges by clearly separating the clinical value proposition from the deep technical architecture, while providing foolproof installation steps.

```markdown
#  Project AEGIS: Live Clinical Event Sentinel

**Project AEGIS** is a real-time metabolic and Drug-Drug Interaction (DDI) screening microservice. Built directly on top of the **Ontomorph Digital Twin Platform (DTP) SDK**, AEGIS bridges the gap between raw clinical telemetry and actionable medical intelligence to intercept adverse patient events before they occur.

---

##  The Clinical Vision

During active patient clerking and clinical ward rounds, the greatest risk to patient safety is often the "silent collision"—a newly resulted critical lab value (e.g., a spiking Potassium level) that intersects dangerously with an existing medication regimen. 

AEGIS eliminates the reliance on static, refresh-dependent dashboards. By streaming live Digital Twin telemetry, the AEGIS rules engine actively evaluates incoming LOINC lab codes against active RxNorm medication regimens, logging critical breaches and alerting providers in real-time.

---

## 🏗️ System Architecture

AEGIS is built as a highly decoupled, strictly typed full-stack architecture:

*   **Frontend Client:** React + Vite + Tailwind CSS. A reactive dashboard that visualizes the Digital Twin state and simulates lab event ingestion.
*   **API Gateway & Rules Engine:** NestJS (Node.js). Acts as the core orchestrator, processing HTTP events, querying the Ontomorph HOLON API, and executing metabolic threshold logic with graceful fallbacks.
*   **Data Persistence Layer:** PostgreSQL + TypeORM. Ensures HIPAA-ready auditability by strictly saving all triggered `Incident` entities to a relational database.
*   **Integration Ecosystem:** @ontomorph/dtp-sdk. Securely authenticates via OAuth2/Grant tokens to the Ontomorph Sandbox environment.

---

##  Prerequisites

To run this application locally, judges will need the following installed:
*   [Node.js](https://nodejs.org/) (v18+ recommended)
*   [PostgreSQL](https://www.postgresql.org/) (Running locally on port 5432)
*   An active **Ontomorph Sandbox Developer Account**

---

##  Local Installation & Setup

### 1. Database Configuration
Ensure your local PostgreSQL instance is running. Create a blank database for the application to use:
```sql
CREATE DATABASE aegis_db;

```

*(Note: TypeORM is configured with `synchronize: true` for this hackathon environment. The NestJS backend will automatically build the `incidents` table and apply schemas on boot).*

### 2. Backend Initialization (NestJS)

Navigate to the backend directory and install the dependencies:

```bash
cd aegis-sentinel-api
npm install

```

Create a `.env` file in the root of the backend directory and populate it with your Ontomorph credentials and database config:

```env
# Database Config
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=your_postgres_password
DB_NAME=aegis_db

# Ontomorph SDK Config (Sandbox)
DTP_API_KEY=your_dtp_api_key
HOLON_API_KEY=your_holon_api_key
PATIENT_GRANT_TOKEN=your_patient_grant_token

```

Start the backend server:

```bash
npm run start:dev

```

*The terminal will output successful connection logs to the database and the Ontomorph DTP Client.*

### 3. Frontend Initialization (React/Vite)

Open a new terminal window, navigate to the frontend directory, and install dependencies:

```bash
cd aegis-sentinel-ui
npm install

```

Start the Vite development server:

```bash
npm run dev

```

---

##  Running the Live Demo

1. Open the UI in your browser (typically `http://localhost:5173`).
2. Verify the **Active Digital Twin Profile** panel indicates a successful sync (e.g., Twin ID `mock-twin-123` is populated from the Sandbox).
3. In the **Lab Event Injector**, the default payload is pre-configured for a metabolic panel:
* **System:** cardiovascular
* **LOINC Code:** 2823-3 (Potassium)
* **Result Value:** 6.5


4. Click **INJECT LAB RESULT**.
5. **Observe the Results:**
* The UI will dynamically stream the clinical alert severity (`CRITICAL`).
* Check your NestJS backend terminal to view the real-time execution of the Rules Engine and the successful PostgreSQL database commit.
* Check your local PostgreSQL database to view the fully typed audit payload saved in the `incidents` table.



---

##  Author

**Victor Oluwatimilryin AJAO**
*Full-Stack Systems Architect, Software Engineer & Clinical Medical Student, Obafemi Awolowo University*

```

```






