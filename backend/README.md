# VSB Grievance Cell Backend

A robust Node.js backend for the VSB Complaint Management System, featuring automated email workflows, one-click resolution, and auto-escalation.

## 📂 Folder Structure

```
backend/
├─ server.js                 # Entry point
├─ firebaseAdmin.js          # Firebase Admin SDK setup
├─ serviceAccountKey.json    # Firebase Credentials (GIT IGNORED)
├─ routes/                   # API Routes (complaints, admin, vp)
├─ controllers/              # Business Logic
├─ services/                 # External Services (Firestore, Email)
├─ cron/                     # Scheduled Jobs (Escalation)
└─ templates/                # Email HTML Templates
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
1. Rename `.env.example` to `.env`.
2. Add your **Gmail App Password** (SMTP).
3. Update email addresses for Wardens/Admins.
4. Ensure `API_BASE_URL` matches your running server (e.g., `http://localhost:5000` or deployed URL).

### 3. Setup Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Navigate to **Project Settings > Service Accounts**.
3. Click **Generate New Private Key**.
4. Save the file as `backend/serviceAccountKey.json`.

### 4. Run Locally
```bash
npm start
# OR for development (auto-restart)
npm run dev
```
Server will run on `http://localhost:5000`.

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/complaints/create` | Submit a new complaint |
| GET | `/api/complaints/auto-resolve/:id` | **One-click resolve** (used in emails) |
| GET | `/api/complaints/:id` | Get complaint details |
| GET | `/api/complaints/warden/:type` | Get complaints for 'boys' or 'girls' |
| GET | `/api/complaints/student/:id` | Get complaints for a student |
| POST | `/api/complaints/resolve/:id` | Manual resolution |
| GET | `/api/admin/all-complaints` | Get ALL complaints |
| GET | `/api/vp/escalated` | Get escalated complaints |

## 📧 Email Automation
1. **New Complaint**: Warden gets email with "Complaint Rectified" button.
2. **Resolution**: When warden clicks button, student gets "Resolved" email.
3. **Escalation**: If not resolved in `resolutionTime` days, VP gets "Escalated" email.

## ⏰ Cron Jobs
- **Escalation**: Runs every 30 minutes.
- Checks `createdAt + resolutionTime` vs `now`.
- Automatically marks as `escalated` and emails VP.

## 📦 Deployment
1. **Render/Vercel**: Add `serviceAccountKey.json` content as a secret.
2. Ensure `NODE_ENV=production`.
3. Update `API_BASE_URL` to your production URL.
