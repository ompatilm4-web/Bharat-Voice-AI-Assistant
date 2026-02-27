// =========================================================
//  api.js — Saarthi AI · Centralized API Client
//  Base URL: change this to your deployed backend URL
// =========================================================

const API_BASE = "http://localhost:8000/api/v1";

// ── Token helpers ──────────────────────────────────────────
function getToken() {
  return localStorage.getItem("saarthi_token");
}

function setToken(token) {
  localStorage.setItem("saarthi_token", token);
}

function clearAuth() {
  localStorage.removeItem("saarthi_token");
  localStorage.removeItem("saarthi_user_id");
}

function isLoggedIn() {
  return !!getToken();
}

// ── Generic fetch wrapper ──────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearAuth();
    window.location.href = "login.html";
    return;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Something went wrong");
  }

  return data;
}

// ── Auth APIs ──────────────────────────────────────────────

/**
 * Send OTP to a phone number.
 * @param {string} phone - e.g. "9876543210"
 */
async function sendOtp(phone) {
  return apiFetch(`/auth/send-otp?phone=${encodeURIComponent(phone)}`, {
    method: "POST",
  });
}

/**
 * Verify OTP and log the user in.
 * Saves JWT token + user ID to localStorage on success.
 * @param {string} phone
 * @param {string} otp
 */
async function verifyOtp(phone, otp) {
  const data = await apiFetch(
    `/auth/verify-otp?phone=${encodeURIComponent(phone)}&otp=${encodeURIComponent(otp)}`,
    { method: "POST" }
  );
  if (data?.access_token) {
    setToken(data.access_token);
  }
  return data;
}

// ── Query APIs ─────────────────────────────────────────────

/**
 * Send a text query to the AI.
 * @param {string} text - User's question
 * @param {string} category - ServiceType enum value (default: "gov_schemes")
 * @param {string} lang - Language code (default: "hi")
 * @param {string|null} sessionId - Optional UUID to continue a session
 */
async function sendTextQuery(text, category = "gov_schemes", lang = "hi", sessionId = null) {
  const body = { text, category, lang };
  if (sessionId) body.session_id = sessionId;

  return apiFetch("/query/text", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Send a voice query to the AI.
 * @param {Blob} audioBlob - Recorded audio
 * @param {string} lang - Language code (default: "hi")
 * @param {string} category - ServiceType enum value (default: "gov_schemes")
 * @param {string|null} sessionId - Optional UUID to continue a session
 */
async function sendVoiceQuery(audioBlob, lang = "hi", category = "gov_schemes", sessionId = null) {
  const token = getToken();
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("lang", lang);
  formData.append("category", category);
  if (sessionId) formData.append("session_id", sessionId);

  const res = await fetch(`${API_BASE}/query/voice`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (res.status === 401) {
    clearAuth();
    window.location.href = "login.html";
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Voice query failed");
  return data;
}

// ── Auth guard ─────────────────────────────────────────────
/**
 * Call on protected pages. Redirects to login if not authenticated.
 */
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
  }
}
