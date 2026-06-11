# System Architecture & Migration Document

## 1. Deletion & Migration Log
The following legacy web-based assets were permanently deleted to transition to a pure Python backend architecture:
- `src/` (Entire frontend directory, React components, Tailwind css)
- `public/` (Old frontend assets)
- `vite.config.ts`
- `tsconfig.json`, `tsconfig.node.json`
- `index.html` (Old Vite entry)
- `main.tsx`, `App.tsx`, `index.css`
- `server.ts`, `server.js`, `server.cjs` (Express backend)
- `package-lock.json`
- Legacy Deployment Guides (`DEPLOY.md`, `DEPLOYMENT_GUIDE.md`, `DEPLOYMENT_GUIDE_UBUNTU.md`)

**Migration Steps Taken:**
1. Eradicated all Node.js and React execution paradigms.
2. Scaffolded the `python_bot/` directory for the `aiogram` bot implementation.
3. Segregated the Captcha system out of the monorepo into an isolated static HTML file (`netlify_captcha/index.html`) to be deployed on Netlify.
4. Bound the Database (PostgreSQL) directly to the Python runtime.

---

## 2. Architectural Plan

**Directory Structure (`/python_bot`):**
```text
python_bot/
│
├── main.py                 # Application entry point, bot initialization & polling
├── config.py               # Environment configuration (Dotenv wrapper)
├── database.py             # PostgreSQL connection pool and schema instantiation
├── sms_api.py              # External API wrapper for fetching & filtering SMS data
├── requirements.txt        # Python dependency manifest
│
└── handlers/
    ├── user_handlers.py    # B2C Interactions: Start, Captcha WebApp, Registration FSM, OTP Retrieval
    └── admin_handlers.py   # B2B Interactions: Admin Dashboard, Approval Workflow, Service Assignment
```

---

## 3. Database Schema

While the current implementation uses high-performance `asyncpg` raw queries natively, the schema maps to the following conceptual ORM models:

```python
# Conceptual SQLAlchemy Models mapping to our raw SQL Tables

class User(Base):
    __tablename__ = 'users'
    telegram_id = Column(BigInteger, primary_key=True)
    username = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    whatsapp = Column(String, nullable=True)
    status = Column(String, default='pending') # states: pending, approved, rejected, banned
    captcha_verified = Column(Boolean, default=False)
    location_data = Column(String, nullable=True)
    assigned_services = Column(JSON, default=list)
    created_at = Column(DateTime, default=func.now())

class Service(Base):
    __tablename__ = 'services'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    match_text = Column(String, nullable=False) # Regex used for SMS filtering

class Admin(Base):
    __tablename__ = 'admins'
    telegram_id = Column(BigInteger, primary_key=True)

class AuditLog(Base):
    __tablename__ = 'audit_logs'
    id = Column(Integer, primary_key=True, autoincrement=True)
    telegram_id = Column(BigInteger)
    action = Column(String)
    details = Column(String)
    timestamp = Column(DateTime, default=func.now())
```

---

## 4. State Machine & Flow Logic

### A. Entry & Captcha Process
- **State: `UNVERIFIED`**
  - **Trigger:** User sends `/start`
  - **Action:** Bot denies text-based interaction and serves a generic message with an Inline WebApp Button ("Verify via Secure Portal").
  - **Transition:** User clicks button -> Opens Netlify WebApp. WebApp requests Geolocation. On Success -> sends `web_app_data` payload to Bot via Telegram JS SDK.
  - **Result:** User state transitions to `VERIFIED`.

### B. Registration Form Interaction
- **State: `VERIFIED_UNREGISTERED`**
  - **Trigger:** Reception of WebApp payload containing Location + Verification Truth.
  - **Action:** Bot initiates User FSM (`Registration.waiting_for_name`).
  - **Transition:** User inputs Full Name -> FSM shifts to `waiting_for_whatsapp`.
  - **Transition:** User inputs WhatsApp -> FSM saves profile, sets User Status to `pending` in Database.
  - **Result:** Notification fired to `APPROVAL_CHANNEL_ID`. User state transitions to `PENDING`.

### C. Admin Dashboard Module Logic
- **Module Access:** Protected by `@router.message(Command("admin"))` & `is_admin()` DB checks.
- **Workflow (Approval Engine):**
  1. Admin clicks "Approve" from Channel notification or Admin Panel.
  2. Bot queries `Services` table and renders an Inline Keyboard checklist.
  3. Admin toggles services ON/OFF `(ad_tog_UserID_ServiceID)`. State is saved to DB `assigned_services` JSON array.
  4. Admin locks assignment globally `(ad_approve_UserID)`. User Status transitions to `APPROVED`.
- **Broadcast & Analytics:** Metrics gathered via aggregate SQL functions (`count(*) WHERE status=...`).

### D. Service-Matching Engine (SMS Filtering)
- **Engine Execution:** Triggered when an `APPROVED` user clicks "Get {Service} OTP".
- **Logic:**
  1. User requests OTP for `ServiceID`.
  2. Bot verifies `ServiceID` exists inside User's `assigned_services` array.
  3. Bot calls `sms_api.py -> fetch_latest_matching_sms(RegexFilter)`.
  4. API queries `http://161.118.182.184:4000/sms/latest`.
  5. The JSON response `text` payload is parsed using the DB-configured `match_text` Regular Expression.
  6. If matched, the cleanly formatted OTP and original context is rendered to the assigned User via Markdown. No other User observes this data stream.
