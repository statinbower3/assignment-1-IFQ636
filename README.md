# Online Course Registration System — IFQ636

A full-stack course registration platform built on the MERN stack (MongoDB, Express.js, React.js, Node.js). Students can browse courses, enrol within capacity limits, and manage their profile. Administrators have a protected panel to create, update, and delete courses, and view all enrolments across the platform.

**Live URL:** http://3.106.127.224  
**Backend API:** http://3.106.127.224:5001  
**GitHub Repository:** https://github.com/statinbower3/assignment-1-IFQ636

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started (Local)](#getting-started-local)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [Production Deployment](#production-deployment)
- [Reflection](#reflection)
- [References](#references)

---

## Features

### Student
- Register and log in securely (JWT authentication with bcrypt password hashing)
- Browse all available courses with real-time capacity indicators
- Enrol in courses (capacity enforced — full courses are blocked with HTTP 400)
- Drop enrolled courses (enrolled counter decrements automatically)
- View and update profile (name, email, university, address)

### Admin
- All student capabilities
- Create, update, and delete courses via a protected admin panel
- Cascading delete — removing a course also removes all associated enrolments
- View all student enrolments across every course with student and course details

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React.js | 18.2 |
| Routing | React Router DOM | 6.10 |
| HTTP Client | Axios | 1.3.4 |
| Styling | Tailwind CSS | 3.4 |
| Backend | Node.js + Express.js | Express 4.17 |
| Database | MongoDB Atlas | Mongoose 6 |
| Authentication | JWT + bcrypt | jsonwebtoken 9 |
| Testing | Mocha + Chai + chai-http | Mocha 11 |
| Process Manager | PM2 | Latest |
| Web Server | Nginx | Latest |
| CI/CD | GitHub Actions (self-hosted runner) | — |
| Cloud | AWS EC2 (Ubuntu 22.04) | — |

---

## Project Structure

```
assignment-1-IFQ636/
├── .github/
│   └── workflows/
│       └── deploy.yml              # 3-job CI/CD pipeline (test → build → deploy)
├── backend/
│   ├── config/
│   │   └── db.js                   # MongoDB Atlas connection via Mongoose
│   ├── controllers/
│   │   ├── authController.js       # register, login, getProfile, updateProfile
│   │   ├── courseController.js     # CRUD operations + cascade delete enrollments
│   │   └── enrollmentController.js # enrol, drop, list (student + admin views)
│   ├── middleware/
│   │   └── authMiddleware.js       # protect (JWT verify) + adminOnly (role check)
│   ├── models/
│   │   ├── User.js                 # name, email, password (bcrypt hashed), role
│   │   ├── Course.js               # title, description, instructor, schedule, capacity, enrolled
│   │   └── Enrollment.js           # student ref, course ref, enrolledAt timestamp
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth endpoints
│   │   ├── courseRoutes.js         # /api/courses (write routes protected by JWT)
│   │   └── enrollmentRoutes.js     # /api/enrollments (all protected by JWT)
│   ├── test/
│   │   └── sample.test.js          # 26 Mocha/Chai integration tests
│   ├── .mocharc.yml                # Mocha config (timeout, exit)
│   ├── server.js                   # Express app; exports for testing, listens when run directly
│   └── package.json
├── frontend/
│   └── src/
│       ├── components/             # Navbar, TaskForm, TaskList
│       ├── context/
│       │   └── AuthContext.js      # Global user state — login/logout/token
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── CourseList.jsx      # Public course browser with Enrol button
│       │   ├── MyCourses.jsx       # Student's enrolled courses with Drop button
│       │   ├── Profile.jsx         # View and update user profile
│       │   └── AdminPanel.jsx      # Course CRUD form + enrolments table
│       ├── axiosConfig.jsx         # Axios instance — baseURL set to EC2 public IP
│       └── App.js                  # Route definitions + admin route guard
└── package.json                    # Root scripts: install-all, start, dev
```

---

## Getting Started (Local)

### Prerequisites

- Node.js v22+
- npm v8+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/assignment-1-IFQ636.git
cd assignment-1-IFQ636
```

### 2. Install all dependencies at once

```bash
npm run install-all
```

This runs `npm install` in the root, `backend/`, and `frontend/` directories simultaneously.

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — see Environment Variables section below
```

### 4. Update the frontend API base URL for local development

In `frontend/src/axiosConfig.jsx`, switch the baseURL:

```js
// For local development:
baseURL: 'http://localhost:5001',

// For production (already set in repo):
// baseURL: 'http://3.106.127.224:5001',
```

### 5. Run in development mode

```bash
npm run dev
```

Uses `concurrently` to start both the backend (nodemon, auto-reload) and the frontend dev server simultaneously.

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5001 |

### 6. Run tests

```bash
npm test --prefix backend
```

---

## Environment Variables

Create `backend/.env` with the following:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your_jwt_secret_here
PORT=5001
```

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens |
| `PORT` | Port for the Express server (default: 5001) |

> **In production**, these values are stored as GitHub Actions Secrets and written to the `.env` file on the server automatically during deployment. They are never committed to the repository. MongoDB Atlas Network Access must include `0.0.0.0/0` to allow connections from GitHub Actions' dynamic IP addresses.

---

## API Endpoints

All protected endpoints require an `Authorization: Bearer <token>` header.

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create a new user account (role: student) |
| POST | `/api/auth/login` | None | Log in and receive a 30-day JWT |
| GET | `/api/auth/profile` | JWT | Get the current user's profile |
| PUT | `/api/auth/profile` | JWT | Update name, email, university, address |

### Courses — `/api/courses`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/courses` | None | Get all courses (public) |
| GET | `/api/courses/:id` | None | Get a single course by ID |
| POST | `/api/courses` | JWT | Create a new course |
| PUT | `/api/courses/:id` | JWT | Update a course |
| DELETE | `/api/courses/:id` | JWT | Delete a course (cascades to enrolments) |

### Enrollments — `/api/enrollments`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/enrollments/:courseId` | JWT | Enrol in a course (capacity enforced) |
| GET | `/api/enrollments/my` | JWT | Get current student's enrolments |
| DELETE | `/api/enrollments/:courseId` | JWT | Drop a course |
| GET | `/api/enrollments/all` | JWT | Get all enrolments (admin view) |

---

## Testing

The test suite is in `backend/test/sample.test.js` and uses Mocha + Chai + chai-http to fire real HTTP requests against the Express app connected to MongoDB Atlas.

### What is tested (26 tests)

| Group | Tests |
|---|---|
| Auth — Register | Success (201), duplicate email (400), admin setup |
| Auth — Login | Valid credentials (200), wrong password (401), unknown email (401) |
| Auth — Profile GET | Authenticated (200), no token (401), invalid token (401) |
| Auth — Profile PUT | Update fields (200), no token (401) |
| Courses — GET all | Returns array without auth |
| Courses — POST | Create with token (201), no token (401) |
| Courses — GET by ID | Single course, invalid ID format |
| Courses — PUT | Update with token (200), no token (401) |
| Enrollments — POST | Enrol (201), duplicate (400), no token (401) |
| Enrollments — GET /my | Student list (200), no token (401) |
| Enrollments — GET /all | Admin view (200), no token (401) |
| Enrollments — DELETE | Drop (200), drop again 404, no token (401) |
| Capacity enforcement | Returns 400 "Course is full" on a capacity-1 course |
| Course DELETE | Delete (200), no token (401) |

### Running tests locally

```bash
cd backend
npm test
```

### Test configuration (`backend/.mocharc.yml`)

```yaml
spec: 'test/**/*.test.js'
timeout: 20000
exit: true
```

The 20-second timeout accommodates MongoDB Atlas network round-trips. The `exit: true` flag ensures the process terminates cleanly after all tests complete.

---

## CI/CD Pipeline

The deployment pipeline is defined in `.github/workflows/deploy.yml` and runs automatically on every push to the `main` branch. Three sequential jobs enforce a test-before-deploy discipline:

```
push to main
     │
     ▼
┌─────────────┐
│  Job 1      │  test
│  Run tests  │  runs-on: ubuntu-latest
│  (backend)  │  → npm install --prefix backend
└──────┬──────┘  → npm test --prefix backend
       │         (uses MONGO_URI + JWT_SECRET from GitHub Secrets)
       ▼
┌──────────────────┐
│  Job 2           │  build-frontend
│  Build React app │  runs-on: ubuntu-latest
│                  │  → npm install --prefix frontend
└──────┬───────────┘  → CI=false npm run build --prefix frontend
       │               → uploads build/ as GitHub Actions artifact
       ▼
┌─────────────────────────────────────┐
│  Job 3                              │  deploy
│  Deploy to EC2                      │  runs-on: self-hosted  ← EC2 runner
│                                     │
│  1. Download frontend build artifact│
│  2. rsync backend → /home/ubuntu/app/backend/
│  3. rsync frontend/build/ → /home/ubuntu/app/frontend/build/
│  4. Write .env from GitHub Secrets  │
│  5. npm install --omit=dev          │
│  6. pm2 restart mern-backend        │
│  7. pm2 save                        │
│  8. sudo systemctl reload nginx     │
└─────────────────────────────────────┘
```

### GitHub Secrets required

| Secret | Used in |
|---|---|
| `MONGO_URI` | Job 1 (tests) + Job 3 (writes .env on EC2) |
| `JWT_SECRET` | Job 1 (tests) + Job 3 (writes .env on EC2) |
| `EC2_HOST` | git runner |
| `EC2_SSH_KEY` | git runner |
| `EC2_USER` | git runners |

### Self-hosted runner setup

The deploy job runs directly on the EC2 instance using a GitHub Actions self-hosted runner. This eliminates the need for SSH keys or external deployment tools.

```bash
# On the EC2 instance:
# 1. Go to GitHub repo → Settings → Actions → Runners → New self-hosted runner
# 2. Select Linux and run the installation commands shown
# 3. Start as a persistent service:
sudo ./svc.sh install
sudo ./svc.sh start
```

---

## Production Deployment

The application runs on AWS EC2 (Ubuntu 22.04) with the following infrastructure:

| Component | Tool | Details |
|---|---|---|
| Backend process | PM2 | Process name: `mern-backend`, auto-restarts on crash |
| Static file serving | Nginx | Serves `frontend/build/` and proxies `/api` to port 5001 |
| Database | MongoDB Atlas | Cloud-hosted, connection via `MONGO_URI` env var |

### Nginx configuration

```nginx
server {
    listen 80;

    root /home/ubuntu/app/frontend/build;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Useful PM2 commands

```bash
pm2 list                    # Show all running processes
pm2 logs mern-backend       # Stream backend logs
pm2 restart mern-backend    # Restart the backend
pm2 stop mern-backend       # Stop the backend
pm2 startup                 # Configure auto-start on server reboot
pm2 save                    # Save current process list
```

---

## Reflection

### What went well

The MERN stack proved to be a productive choice for this project. The shared use of JavaScript across the frontend and backend eliminated context-switching between languages and made it straightforward to reuse data structures such as the course and enrollment schemas on both sides of the application. React's component model and Context API made global authentication state simple to manage — once `AuthContext` was in place, adding token-gated behaviour to any new page required only a single `useAuth()` call.

The CI/CD pipeline was the most rewarding component to build. The decision to use a self-hosted GitHub Actions runner on the EC2 instance — rather than SSH-based deployment — turned out to be significantly simpler to maintain as it was easier to run the CI/CD pipeline once the ec2 instace was made the runner and deployment system. There are no key pairs to rotate, no deployment secrets beyond the two already needed for the application, and the runner executes commands with direct filesystem access exactly as a developer would on the server. Watching a `git push` automatically test, build, and deploy the full application in under two minutes made the operational value of continuous deployment tangible in a way that reading about it does not.

Planning the project through JIRA sprints also added genuine structure. Writing user stories before opening the code editor forced a clear articulation of what each feature needed to achieve from the user's perspective, which kept the implementation focused. The sprint backlog made it easy to identify when scope creep was occurring and defer non-essential features to a later sprint.

### Challenges and how they were resolved

The most significant technical challenge was configuring MongoDB Atlas network access for the CI/CD pipeline. GitHub Actions runners use dynamic IP addresses that change on every run, so the Atlas default whitelist — which restricts connections to specific IPs — caused the test job's `before` hook to hang until Mocha's 20-second timeout killed it with zero tests run. The fix required two changes: opening Atlas network access to `0.0.0.0/0` (all IPs) for the test cluster, and adding `serverSelectionTimeoutMS: 10000` to the Mongoose connection options so that future connection failures produce a clear, immediate error rather than a silent hang.s

### What I would do differently

With additional time I would invest more effort in the Figma prototype before beginning frontend development. I would write the Mocha test suite alongside each controller rather than after all controllers were complete.

---

## References

- Amazon Web Services. (2024). *Getting started with Amazon EC2*. https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html
- Atlassian. (2024). *Scrum with Jira Software*. https://www.atlassian.com/agile/tutorials/how-to-do-scrum-with-jira-software
- Axios. (2024). *Axios HTTP client documentation*. https://axios-http.com/docs/intro
- Chai. (2024). *Chai assertion library documentation*. https://www.chaijs.com/api/
- Express.js. (2024). *Express 4.x API reference*. https://expressjs.com/en/4x/api.html
- GitHub Docs. (2024). *Understanding GitHub Actions*. https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions
- Mocha. (2024). *Mocha — the fun, simple, flexible JavaScript test framework*. https://mochajs.org
- MongoDB. (2024). *MongoDB Atlas documentation*. https://www.mongodb.com/docs/atlas/
- Mongoose. (2024). *Mongoose v6 documentation — getting started*. https://mongoosejs.com/docs/guide.html
- Nginx. (2024). *Beginner's guide to Nginx*. https://nginx.org/en/docs/beginners_guide.html
- npm. (2024). *bcrypt package*. https://www.npmjs.com/package/bcrypt
- npm. (2024). *jsonwebtoken package*. https://www.npmjs.com/package/jsonwebtoken
- Object Management Group. (2019). *OMG Systems Modeling Language (OMG SysML™) v1.6*. https://www.omg.org/spec/SysML/1.6/PDF
- PM2. (2024). *PM2 — advanced process manager for Node.js*. https://pm2.keymetrics.io/docs/usage/quick-start/
- React. (2024). *React documentation — learn React*. https://react.dev/learn
- Tailwind Labs. (2024). *Tailwind CSS documentation*. https://tailwindcss.com/docs
- Wieringa, R. J. (2014). *Design science methodology for information systems and software engineering*. Springer.
