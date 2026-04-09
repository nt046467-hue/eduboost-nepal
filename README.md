# EduBoost Nepal 🇳🇵

### NEB Class 11–12 AI-Powered Exam Preparation Platform

A complete, production-ready educational web app for NEB Nepal students and teachers — featuring AI question/answer generation, notes, blog, downloads, and an admin panel.

---

## 📁 Project Structure

```
eduboost-nepal/
├── index.html              ← Public landing page
├── README.md               ← This file
├── js/
│   └── utils.js            ← 🔑 Firebase + Gemini config (edit this first!)
└── pages/
    ├── login.html          ← Firebase login (email + Google OAuth)
    ├── signup.html         ← Registration with role selection
    ├── dashboard.html      ← Main app: AI tools, stats, saved content
    ├── notes.html          ← Notes library by class/subject
    ├── blog.html           ← Blog & study guides
    ├── downloads.html      ← PDF resources
    └── admin.html          ← Teacher admin panel (add notes, posts, manage users)
```

---

## ⚡ Quick Start (5 Steps)

### Step 1 — Get Your API Keys

**A. Firebase (Auth + Database)**

1. Go to https://console.firebase.google.com
2. Click **"Add Project"** → name it (e.g. `eduboost-nepal`) → Continue
3. Go to **Authentication** → Sign-in method → Enable:
   - **Email/Password** ✅
   - **Google** ✅ (set your project's support email)
4. Go to **Firestore Database** → Create database → Start in **test mode**
5. Go to **Project Settings** (⚙️ gear icon) → scroll to **"Your apps"** → Click **</>** (Web)
6. Register app → Copy the `firebaseConfig` object values

**B. Gemini AI**

1. Go to https://aistudio.google.com/app/apikey
2. Click **"Create API Key"**
3. Copy the key

---

### Step 2 — Configure `js/utils.js`

Open `js/utils.js` and replace the placeholder values:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "AIzaSy...",              // ← Your Firebase API key
  authDomain: "myproject.firebaseapp.com",
  projectId: "myproject-12345",
  storageBucket: "myproject.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const GEMINI_API_KEY = "AIzaSy..."; // ← Your Gemini API key

> Note: On Netlify, do not keep your Gemini key in client-side JS. Configure `GEMINI_API_KEY` as a Netlify environment variable and use the built-in serverless function proxy.
```

---

### Step 3 — Set Firestore Security Rules

In Firebase Console → Firestore → **Rules** tab, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users: can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Notes: public read, authenticated write
    match /notes/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Blog posts: public read, authenticated write
    match /blogPosts/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Saved content: user's own only
    match /savedContent/{doc} {
      allow read, write: if request.auth != null
        && (resource == null || resource.data.userId == request.auth.uid);
    }
  }
}
```

Click **Publish**.

---

### Step 4 — Open the App

No build step required! Just open `index.html` in a browser.

> **⚠️ Important:** Because the app uses Firebase and fetch(), you need to serve it via a local server — not just open the file directly. Use one of:
>
> ```bash
> # Option A: VS Code Live Server extension (easiest)
> # Right-click index.html → "Open with Live Server"
>
> # Option B: Python
> python3 -m http.server 8000
> # Then open http://localhost:8000
>
> # Option C: Node.js
> npx serve .
> ```

---

### Step 5 — Create Your First Teacher Account

1. Go to `/pages/signup.html` → Sign up with role **Teacher**
2. To grant admin access: Go to Firebase Console → Firestore → `users` collection
3. Find your user document → Edit → set `role: "teacher"`
4. Reload the app — Admin Panel link will appear in the sidebar

---

## 🚀 Deploy to Firebase Hosting (Free)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (run from project root)
firebase init
# → Select: Hosting
# → Select your project
# → Public directory: . (dot, current folder)
# → Single page app: No
# → Overwrite index.html: No

# Deploy
firebase deploy
```

Your app will be live at `https://YOUR-PROJECT.web.app`

---

## 🔧 Customization

### Add Real PDF Downloads

In `pages/downloads.html`, find the downloads array and replace `url: '#'` with real links:

```javascript
{ title: 'Physics Class 12 Notes', url: 'https://your-storage/physics12.pdf', ... }
```

Upload PDFs to Firebase Storage or Google Drive (make public), copy the direct link.

### Add More Subjects / Chapters

In `js/utils.js`, edit the `NEB_SUBJECTS` and `NEB_CHAPTERS` objects:

```javascript
const NEB_CHAPTERS = {
  'Economics': {
    11: ['Introduction', 'Demand & Supply', ...],
    12: ['National Income', 'Money & Banking', ...]
  },
  // ...
};
```

### Change Theme Colors

In any page's `<style>` block, edit the CSS variables:

```css
.btn-primary {
  background: linear-gradient(135deg, #f97316, #dc2626);
}
/* Orange → Red gradient. Change to any colors you want. */
```

---

## 📊 Firestore Collections

| Collection     | Purpose            | Key Fields                              |
| -------------- | ------------------ | --------------------------------------- |
| `users`        | User profiles      | uid, name, email, role, class           |
| `notes`        | Study notes        | subject, class, chapter, title, content |
| `blogPosts`    | Blog articles      | title, category, author, content        |
| `savedContent` | AI-generated saves | userId, type, content, metadata         |

---

## 🛠️ Tech Stack

| Layer    | Technology                             |
| -------- | -------------------------------------- |
| Frontend | HTML5, Tailwind CSS (CDN), Vanilla JS  |
| Auth     | Firebase Authentication                |
| Database | Cloud Firestore                        |
| AI       | Google Gemini 1.5 Flash                |
| Fonts    | Sora + DM Serif Display (Google Fonts) |
| Hosting  | Firebase Hosting (recommended)         |

---

## 🌟 Features

- ✅ Firebase Email/Password + Google OAuth login
- ✅ Student & Teacher role system
- ✅ AI Question Generator (MCQ, Short, Long — NEB syllabus aligned)
- ✅ AI Answer Generator (board style, detailed, bullet points, notes)
- ✅ Notes library with class/subject filters
- ✅ Blog section with category filters
- ✅ PDF downloads section
- ✅ Admin panel (add notes, blog posts, manage users)
- ✅ Save generated content to Firestore
- ✅ Copy-to-clipboard on all outputs
- ✅ Dark mode toggle
- ✅ Mobile responsive
- ✅ Toast notifications
- ✅ Glassmorphism UI with Nepal flag colors

---

## ❓ Troubleshooting

**"Firebase not defined" error**
→ Make sure you're serving via a local server, not opening the file directly.

**AI not working**
→ Check your Gemini API key in `js/utils.js`. Make sure it's not expired. Test it at aistudio.google.com.

**Login not working**
→ Ensure Email/Password and Google providers are enabled in Firebase Console → Authentication.

**Firestore writes failing**
→ Check your Firestore Security Rules are published correctly (Step 3 above).

**Admin panel not accessible**
→ Manually set `role: "teacher"` in your Firestore `users` document (Step 5 above).

---

## 📧 Support

Built for NEB Nepal students. For issues, check the Firebase Console logs and browser DevTools console for error messages.

---

_EduBoost Nepal — Powered by AI, Built for Nepal 🇳🇵_
