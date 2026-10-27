# CivicConnect 🏙️
## A Smart Platform for Smarter Cities

[![Node.js](https://img.shields.io/badge/Node.js-v24-green)](https://nodejs.org) [![React](https://img.shields.io/badge/React-19-blue)](https://react.dev) [![MongoDB](https://img.shields.io/badge/MongoDB-9.0-green)](https://mongodb.com) [![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

CivicConnect is a full-stack civic issue reporting and management platform. Citizens can report problems, upload photos, pin locations on a map, track complaint status, and support each other's issues. Administrators get a full dashboard with AI-assisted classification, analytics, and CSV export.

---

## 🚀 Features

| Feature | Description |
|---|---|
| 📱 Citizen Portal | Report issues with photo + map location |
| 🗺️ Interactive Map | Color-coded complaint markers by status |
| 🤖 AI Classification | Auto-categorize and suggest severity |
| 🔍 Duplicate Detection | Prevent repeated complaints via similarity check |
| 👥 Community Voting | Upvote complaints to prioritize urgent ones |
| 📊 Admin Dashboard | Stats, charts, complaint management |
| 📈 Analytics | Category, trend, department performance charts |
| 🔔 Notifications | Real-time in-app status updates |
| 📤 CSV Export | Download filtered complaint records |
| 🔐 JWT Auth | Secure role-based authentication |

---

## 🛠️ Technology Stack

- **Frontend:** React 19 + Vite + Tailwind CSS v4 + Lucide React
- **Backend:** Node.js + Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcryptjs
- **Maps:** Leaflet + React-Leaflet (OpenStreetMap)
- **Charts:** Recharts
- **Uploads:** Multer
- **AI:** Rule-based classification (no API key required)

---

## ⚡ Quick Start (Windows)

### Prerequisites

1. **Node.js 18+**: https://nodejs.org/en/download
2. **MongoDB Community**: https://www.mongodb.com/try/download/community
   - Install with default settings
   - MongoDB runs on port `27017` by default
   - The service starts automatically on Windows after install

### Step 1 — Clone / Open Project

```bash
# The project is at:
cd "C:\Users\Administrator\OneDrive\Microsoft Copilot Chat Files\Desktop\1\civicconnect"
```

### Step 2 — Set Up Backend

```bash
cd backend

# Copy environment file
copy .env.example .env

# Dependencies already installed. If needed:
npm install
```

**Edit `backend\.env`** (already pre-filled for local dev — no changes needed to start):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/civicconnect
JWT_SECRET=civicconnect_jwt_secret_change_in_production_2024
ADMIN_EMAIL=admin@civicconnect.com
ADMIN_PASSWORD=Admin@2024!
```

### Step 3 — Seed the Database

```bash
# From the civicconnect/backend directory:
npm run seed
```

This creates:
- ✅ Admin account: `admin@civicconnect.com` / `Admin@2024!`
- ✅ 5 citizen accounts: `rahul@example.com` / `Citizen@2024`
- ✅ 18 realistic sample complaints across all categories
- ✅ 7 departments
- ✅ Sample notifications

### Step 4 — Start Backend

```bash
# From civicconnect/backend:
npm run dev
# → API running at http://localhost:5000
```

### Step 5 — Set Up and Start Frontend

```bash
# Open a NEW terminal, then:
cd "C:\Users\Administrator\OneDrive\Microsoft Copilot Chat Files\Desktop\1\civicconnect\frontend"
npm install   # if node_modules not present
npm run dev
# → Frontend at http://localhost:5173
```

### Step 6 — Open in Browser

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api/health
- **Admin panel:** Login with `admin@civicconnect.com` / `Admin@2024!`

---

## 🔑 Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@civicconnect.com | Admin@2024! |
| Citizen 1 | rahul@example.com | Citizen@2024 |
| Citizen 2 | priya@example.com | Citizen@2024 |
| Citizen 3 | arun@example.com | Citizen@2024 |

---

## 📁 Project Structure

```
civicconnect/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app entry point
│   │   ├── controllers/        # Business logic
│   │   │   ├── authController.js
│   │   │   ├── complaintController.js
│   │   │   ├── adminController.js
│   │   │   ├── aiController.js
│   │   │   └── notificationController.js
│   │   ├── routes/             # API routes
│   │   ├── models/             # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Complaint.js
│   │   │   ├── Notification.js
│   │   │   └── Department.js
│   │   ├── middleware/         # Auth, upload, validation
│   │   └── services/           # Notification service
│   ├── scripts/
│   │   └── seed.js             # Database seeder
│   ├── uploads/                # Uploaded images
│   ├── .env                    # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Router + providers
│   │   ├── main.jsx            # React entry
│   │   ├── index.css           # Tailwind + global styles
│   │   ├── layouts/
│   │   │   ├── PublicLayout.jsx   # Navbar + footer
│   │   │   └── DashboardLayout.jsx # Sidebar layout
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ReportPage.jsx         # Submit complaint
│   │   │   ├── TrackPage.jsx          # Track by ID
│   │   │   ├── MapPage.jsx            # Interactive map
│   │   │   ├── CitizenDashboard.jsx
│   │   │   ├── ComplaintDetailPage.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminComplaints.jsx
│   │   │   └── AdminAnalytics.jsx
│   │   ├── hooks/
│   │   │   └── useAuth.jsx     # Auth context + hook
│   │   ├── services/
│   │   │   └── api.js          # Axios instance
│   │   └── utils/
│   │       └── constants.js    # Shared constants
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
├── .env.example
└── README.md
```

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Register citizen |
| POST | /api/auth/login | Public | Login |
| GET | /api/auth/me | JWT | Get current user |

### Complaints
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/complaints | Public | List all complaints |
| POST | /api/complaints | JWT | Submit complaint |
| GET | /api/complaints/:id | Public | Get complaint |
| GET | /api/complaints/my | JWT | My complaints |
| GET | /api/complaints/track/:id | Public | Track by complaint ID |
| POST | /api/complaints/:id/support | JWT | Support/unsupport |

### AI
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/ai/classify | Public | AI classification |
| POST | /api/ai/duplicate-check | Public | Duplicate detection |

### Admin (Admin JWT required)
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/admin/dashboard | Dashboard stats |
| GET | /api/admin/complaints | All complaints |
| PATCH | /api/admin/complaints/:id/status | Update status |
| PATCH | /api/admin/complaints/:id/assign | Assign department |
| GET | /api/admin/analytics | Full analytics |
| GET | /api/admin/export | CSV export |

### Notifications
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/notifications | JWT | My notifications |
| PATCH | /api/notifications/:id/read | JWT | Mark read |
| PATCH | /api/notifications/read-all | JWT | Mark all read |

---

## 🔧 Troubleshooting

### MongoDB won't connect
```bash
# Start MongoDB service on Windows:
net start MongoDB

# Or run manually:
"C:\Program Files\MongoDB\Server\9.0\bin\mongod.exe" --dbpath="C:\data\db"

# Create data directory if needed:
mkdir C:\data\db
```

### Port already in use
```powershell
# Find what's on port 5000:
netstat -ano | findstr :5000
# Kill it:
taskkill /PID <PID> /F
```

### Leaflet map icons missing
The app uses CDN URLs for Leaflet markers. Ensure you have internet connectivity.

### Image uploads not working
```bash
# Ensure uploads directory exists:
mkdir backend\uploads
```

### Frontend won't start (TypeScript errors)
The project uses JSX (.jsx files), not TypeScript. If Vite complains, ensure `vite.config.js` (not .ts) is present.

---

## 🌐 Production Deployment

### Backend (Render / Railway / Heroku)
1. Set environment variables (see `.env.example`)
2. Set `MONGODB_URI` to your MongoDB Atlas connection string
3. Deploy backend folder
4. Start command: `npm start`

### Frontend (Vercel / Netlify)
1. Build: `npm run build`
2. Publish directory: `dist`
3. Set `VITE_API_URL` if backend is on a different domain
4. Update `vite.config.js` proxy for production

### MongoDB Atlas (Cloud DB)
1. Create free cluster at https://cloud.mongodb.com
2. Whitelist your server IP
3. Get connection string and set as `MONGODB_URI`

---

## 🏆 Hackathon Highlights

- **Map-based visualization** of all city issues with color-coded markers
- **AI-assisted classification** (rule-based, works offline — no API key needed)
- **Duplicate detection** using Jaccard text similarity + geographic proximity
- **Priority scoring** formula: `(severity × 3) + log(supporters + 1) × 2 + age_score`
- **Community voting** with toggle support (upvote/undo)
- **Real-time status timeline** with admin notes
- **Department-wise analytics** for accountability
- **CSV export** for government reporting

---

## 📄 License

MIT License — Built for national-level hackathon demonstration.
