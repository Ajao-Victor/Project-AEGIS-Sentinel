
# Project AEGIS: Clinical Command Center 

Author: Victor Oluwatimileyin AJAO

Developed for Hackathon Demonstration.

Aegis Sentinel is an enterprise-grade, event-driven microservice and frontend dashboard designed for real-time clinical monitoring. It ingests simulated patient lab results, evaluates them against live active medication regimens using the HOLON API, and flags critical drug-drug or metabolic interactions. 

Built with a focus on zero-PHI exposure and production-ready auditability, Aegis provides a high-fidelity "Command Center" interface to visualize systemic health threats as they occur.

##  System Architecture

The system is separated into a robust backend processing engine and a responsive, dark-theme client application.

**Backend (Microservice API)**
* **Framework:** NestJS / TypeScript
* **Database:** PostgreSQL (via TypeORM)
* **Caching:** Redis
* **Clinical Intelligence:** Live HOLON API Integration (DTP Client)

**Frontend (Client Dashboard)**
* **Core:** React 18 + Vite
* **Styling:** Tailwind CSS (v3.4) + Custom Cyber-Clinical Theme
* **Icons:** Lucide React

##  Key Features

* **Real-Time Lab Simulator:** Inject synthetic diagnostic events (e.g., cardiovascular LOINC codes) directly into the rules engine.
* **Live DDI Screening:** Automates RxNorm resolution and screens for contraindications (e.g., Warfarin/Ibuprofen interactions) using external clinical intelligence.
* **Persistent Audit Logging:** Securely writes formatted incident payloads to a PostgreSQL database to maintain clinical audit trails.
* **Synthetic Patient Sandbox:** Utilizes a secure, OAuth2-synchronized test patient (`pt-8821-alpha-7x`) to ensure zero exposure of Protected Health Information (PHI) during demonstrations.
* **Command Center UI:** A high-contrast, terminal-style interface for live system observability.

##  Getting Started

### Prerequisites
* Node.js (v18+)
* PostgreSQL running locally
* Redis server

### 1. Backend Setup (NestJS)

Navigate to the root directory and install dependencies:
```bash
npm install
Configure your environment variables. Create a .env file in the root directory:

Code snippet
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=aegis_db

# External APIs
PATIENT_GRANT_TOKEN=your_holon_grant_token_here
Start the backend microservice:

Bash
npm run start:dev
The API will run on http://localhost:3000

2. Frontend Setup (React/Vite)
Open a new terminal window, navigate to the client directory, and install dependencies:

Bash
cd client
npm install
Start the frontend development server:

Bash
npm run dev
The Dashboard will run on http://localhost:5173

💻 Usage / Demo Flow
Open the Aegis Command Center at http://localhost:5173.

Observe the automated boot sequence synchronizing the synthetic patient profile.

Use the Lab Event Injector panel to transmit a simulated LOINC code (e.g., Potassium levels).

Watch the Audit Stream as the backend evaluates the payload via the HOLON API.

If an interaction is detected, the UI will flag the twin and display the structured PostgreSQL write-back confirmation.

 Data Structure
Aegis formats raw engine results into professional, structured JSON payloads for database insertion. Example incident payload:

JSON
{
  "twinId": "pt-8821-alpha-7x",
  "triggeringSystem": "cardiovascular",
  "labCode": "2823-3",
  "labValue": 6.5,
  "totalInteractions": 1,
  "severityLevel": "HIGH",
  "metadata": {
    "medsScreened": 2
  }
}








