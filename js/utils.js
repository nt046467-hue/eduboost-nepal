// ============================================================
// EduBoost Nepal - Shared Utilities & Firebase Configuration
// ============================================================

// ---- FIREBASE CONFIG ----
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCbVzplSn0UL2KRB3B45SCByJSm2FXPByw",
  authDomain: "eduboost-f611f.firebaseapp.com",
  projectId: "eduboost-f611f",
  storageBucket: "eduboost-f611f.firebasestorage.app",
  messagingSenderId: "121788124993",
  appId: "1:121788124993:web:4df0ec72b1e187e76c1bc0",
  measurementId: "G-1SDQZYXSKS",
};

// ---- AI CONFIG ----
const GEMINI_API_URL = "/.netlify/functions/gemini";

// ============================================================
// Firebase Initialization
// ============================================================
function initFirebase() {
  if (typeof firebase === "undefined") {
    console.error(
      "Firebase SDK not loaded. Make sure to include Firebase CDN scripts.",
    );
    return null;
  }
  // FIX: firebase.apps is an array, not optional — check length directly
  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }
  return firebase;
}

// ============================================================
// Auth Helpers
// ============================================================

// Get current user or redirect to login
function requireAuth(redirectTo = "../pages/login.html") {
  return new Promise((resolve, reject) => {
    // FIX: Added null check so initFirebase failures don't silently break this
    const fb = initFirebase();
    if (!fb) {
      reject(new Error("Firebase not initialized"));
      return;
    }

    fb.auth().onAuthStateChanged((user) => {
      if (user) {
        resolve(user);
      } else {
        window.location.href = redirectTo;
        reject(new Error("User not authenticated"));
      }
    });
  });
}

// Get user profile from Firestore
async function getUserProfile(uid) {
  try {
    const doc = await firebase.firestore().collection("users").doc(uid).get();
    return doc.exists ? doc.data() : null;
  } catch (e) {
    console.error("Error fetching user profile:", e);
    return null;
  }
}

// Sign out
async function signOut() {
  try {
    await firebase.auth().signOut();
    window.location.href = "../index.html";
  } catch (e) {
    console.error("Sign out error:", e);
    showToast("Failed to sign out. Please try again.", "error");
  }
}

// ============================================================
// Gemini AI Helper
// ============================================================

/**
 * Call Gemini AI with optional retry on transient failures.
 * @param {string} prompt - The user prompt
 * @param {string} systemContext - Optional system-level instructions
 * @param {number} retries - Number of retry attempts on failure (default 2)
 * @returns {Promise<string>} - The AI response text
 */
async function callGeminiAI(prompt, systemContext = "", retries = 2) {
  // FIX: Combine system context as a proper prefix, trimmed
  const fullPrompt = systemContext
    ? `${systemContext.trim()}\n\n${prompt.trim()}`
    : prompt.trim();

  const body = JSON.stringify({
    prompt: fullPrompt,
    systemContext,
  });

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || data?.error) {
        const message = data?.error || `HTTP ${response.status}`;

        if (
          response.status === 400 ||
          response.status === 403 ||
          response.status === 429
        ) {
          throw new Error(`Gemini proxy error: ${message}`);
        }

        if (attempt < retries) {
          await _sleep(500 * (attempt + 1));
          continue;
        }

        throw new Error(`Gemini proxy error: ${message}`);
      }

      const text = data?.text;
      if (!text) {
        throw new Error("AI returned an empty response.");
      }

      return text;
    } catch (e) {
      if (attempt === retries) throw e; // Rethrow on final attempt
      await _sleep(500 * (attempt + 1));
    }
  }
}

// Internal sleep helper
function _sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// Firestore Helpers
// ============================================================

// Save generated content to user's saved items
async function saveGeneratedContent(userId, type, content, metadata = {}) {
  try {
    await firebase.firestore().collection("savedContent").add({
      userId,
      type, // 'question' | 'answer' | 'note'
      content,
      metadata,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.error("Save error:", e);
    return false;
  }
}

/**
 * Get user's saved content.
 * NOTE: If filtering by `type`, you must create a composite Firestore index on:
 *   Collection: savedContent | Fields: userId ASC, type ASC, createdAt DESC
 * Firestore will log a direct link to create it on the first query.
 */
async function getSavedContent(userId, type = null) {
  try {
    // FIX: Build the query conditionally to avoid composite index errors when type is null
    let query = firebase
      .firestore()
      .collection("savedContent")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(20);

    // Only add the type filter if provided — this requires a composite index
    if (type) {
      query = firebase
        .firestore()
        .collection("savedContent")
        .where("userId", "==", userId)
        .where("type", "==", type)
        .orderBy("createdAt", "desc")
        .limit(20);
    }

    const snap = await query.get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("Fetch saved error:", e);
    // FIX: Surface composite index errors clearly in development
    if (e.code === "failed-precondition") {
      console.warn(
        "Firestore missing index. Check the console link above to create it, or visit:\n" +
          "https://console.firebase.google.com/project/eduboost-f611f/firestore/indexes",
      );
    }
    return [];
  }
}

// ============================================================
// UI Utilities
// ============================================================

// Show toast notification
function showToast(message, type = "success") {
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500",
  };
  const toast = document.createElement("div");
  toast.className = `fixed bottom-6 right-6 ${colors[type] || colors.info} text-white px-6 py-3 rounded-xl shadow-2xl z-[9999] text-sm font-medium transform translate-y-4 opacity-0 transition-all duration-300`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transform = "translateY(0)";
    toast.style.opacity = "1";
  }, 10);
  setTimeout(() => {
    toast.style.transform = "translateY(4px)";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Copy text to clipboard
async function copyToClipboard(text, btnEl = null) {
  try {
    await navigator.clipboard.writeText(text);
    if (btnEl) {
      const original = btnEl.textContent;
      btnEl.textContent = "✓ Copied!";
      btnEl.classList.add("text-green-400");
      setTimeout(() => {
        btnEl.textContent = original;
        btnEl.classList.remove("text-green-400");
      }, 2000);
    }
    showToast("Copied to clipboard!");
    return true;
  } catch (e) {
    showToast("Failed to copy", "error");
    return false;
  }
}

// Format markdown-like text for display
function formatAIResponse(text) {
  if (!text) return "";

  return (
    // FIX: Wrap entire output in an opening <p> so the replace below closes properly
    '<p class="mb-3">' +
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-orange-300">$1</em>')
      .replace(
        /^### (.*$)/gm,
        '<h3 class="text-lg font-bold text-white mt-4 mb-2">$1</h3>',
      )
      .replace(
        /^## (.*$)/gm,
        '<h2 class="text-xl font-bold text-orange-400 mt-5 mb-3">$1</h2>',
      )
      .replace(
        /^# (.*$)/gm,
        '<h1 class="text-2xl font-bold text-white mt-6 mb-3">$1</h1>',
      )
      .replace(/^- (.*$)/gm, '<li class="ml-4 text-slate-300 mb-1">• $1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 text-slate-300 mb-1">$1</li>')
      // FIX: Double newline creates a new paragraph (was missing opening <p>)
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, "<br/>") +
    "</p>"
  );
}

// Loading spinner HTML
function loadingSpinner(text = "Generating...") {
  return `
    <div class="flex items-center gap-3 text-slate-300 py-8 justify-center">
      <svg class="animate-spin w-6 h-6 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      <span>${text}</span>
    </div>`;
}

// Dark mode toggle
function initDarkMode() {
  const saved = localStorage.getItem("darkMode");
  if (saved === "light") {
    document.documentElement.classList.remove("dark");
  } else if (saved === "dark") {
    document.documentElement.classList.add("dark");
  } else if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("darkMode", isDark ? "dark" : "light");
}

initDarkMode();

// ============================================================
// NEB Curriculum Data
// ============================================================

const NEB_SUBJECTS = {
  science: [
    "Physics",
    "Chemistry",
    "Biology",
    "Mathematics",
    "Computer Science",
  ],
  management: ["Accountancy", "Economics", "Business Studies", "Mathematics"],
  humanities: ["English", "Nepali", "Social Studies", "Optional Mathematics"],
};

const NEB_CHAPTERS = {
  Physics: {
    11: [
      "Measurement",
      "Vectors",
      "Kinematics",
      "Dynamics",
      "Work, Energy & Power",
      "Circular Motion",
      "Gravitation",
      "Simple Harmonic Motion",
      "Mechanical Waves",
      "Heat & Thermodynamics",
      "Electric Field & Potential",
      "Current Electricity",
      "Magnetic Field",
    ],
    12: [
      "Rotational Dynamics",
      "Periodic Motion",
      "Fluid Statics",
      "Surface Tension",
      "Viscosity",
      "Thermodynamics",
      "Waves",
      "Geometrical Optics",
      "Wave Optics",
      "Electrical Circuits",
      "Thermoelectric Effect",
      "Electronics",
      "Photon",
      "Nuclear Physics",
    ],
  },
  Chemistry: {
    11: [
      "General Chemistry",
      "Atomic Structure",
      "Chemical Bonding",
      "Periodic Table",
      "Oxidation & Reduction",
      "Acids, Bases & Salts",
      "Inorganic Chemistry I",
      "Organic Chemistry I",
    ],
    12: [
      "Volumetric Analysis",
      "Ionic Equilibrium",
      "Thermodynamics",
      "Electrochemistry",
      "Chemical Kinetics",
      "Inorganic Chemistry II",
      "Organic Chemistry II",
      "Applied Chemistry",
    ],
  },
  Mathematics: {
    11: [
      "Sets & Functions",
      "Algebra",
      "Complex Numbers",
      "Trigonometry",
      "Coordinate Geometry",
      "Statistics",
      "Probability",
    ],
    12: [
      "Limits & Continuity",
      "Derivatives",
      "Integrals",
      "Differential Equations",
      "Vectors",
      "Statistics & Probability",
    ],
  },
  Biology: {
    11: [
      "Origin of Life",
      "Cell Biology",
      "Genetics",
      "Plant Physiology",
      "Diversity of Living Things",
      "Ecosystem & Environment",
    ],
    12: [
      "Animal Physiology",
      "Human Biology",
      "Biotechnology",
      "Evolution",
      "Biodiversity",
      "Conservation",
    ],
  },
  "Computer Science": {
    11: [
      "Computer System",
      "Number System",
      "Boolean Logic",
      "Computer Software",
      "Operating System",
      "Programming in C",
    ],
    12: [
      "Database",
      "Networking",
      "Web Technology",
      "Multimedia",
      "Programming Concepts",
      "Information Security",
    ],
  },
};
