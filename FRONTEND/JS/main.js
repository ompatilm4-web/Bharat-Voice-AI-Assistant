// =========================================================
//  main.js — Saarthi AI · Standalone Mode (no api.js)
//  Uses mock responses so chat works without backend
//  When backend is ready: uncomment api.js in main.html
//  and uncomment the real API block in sendMessageToBackend()
// =========================================================

// ── DOM References ─────────────────────────────────────────
const heroSection      = document.getElementById("heroSection");
const chatOnlyView     = document.getElementById("chatOnlyView");
const featuresSection  = document.getElementById("features");
const languagesSection = document.getElementById("languages");
const footerSection    = document.getElementById("footerSection");
const navLinks         = document.querySelectorAll(".nav-link");

const textInputSimple  = document.getElementById("textInputSimple");
const micButtonLarge   = document.getElementById("micButtonLarge");
const statusTextSimple = document.getElementById("statusTextSimple");

const micButton        = document.getElementById("micButton");
const sendButton       = document.getElementById("sendButton");
const textInput        = document.getElementById("textInput");
const chatDisplay      = document.getElementById("chatDisplay");
const statusText       = document.getElementById("statusText");
const languageSelect   = document.getElementById("language");
const backButton       = document.getElementById("backButton");

// ── App state ──────────────────────────────────────────────
let isChatActive     = false;
let isListening      = false;
let currentSessionId = null;

// ── Speech Recognition ─────────────────────────────────────
const SpeechRecognition  = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognitionSupported = !!SpeechRecognition;

// ── Init ───────────────────────────────────────────────────
if (chatOnlyView) {
  chatOnlyView.style.display = "none";
  chatOnlyView.classList.remove("active");
}

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("openChat") === "true") {
  window.addEventListener("DOMContentLoaded", () => showChatOnly(""));
  if (document.readyState !== "loading") showChatOnly("");
}

window.testShowChat = function () { showChatOnly("Test message"); };

// ── Language helper ────────────────────────────────────────
function getSelectedLang() {
  if (languageSelect) return languageSelect.value || "hi";
  return localStorage.getItem("saarthi_lang") || "hi";
}

// =========================================================
//  MOCK AI RESPONSE
//  Replace sendMessageToBackend() with real API
//  once backend is ready
// =========================================================
function getMockResponse(userMessage) {
  const msg = userMessage.toLowerCase();

  if (msg.includes("pension") || msg.includes("पेंशन"))
    return "To check your pension status, visit the NSAP portal or call helpline <strong>1800-123-456</strong>. Would you like step-by-step guidance?";

  if (msg.includes("pm kisan") || msg.includes("farmer") || msg.includes("किसान"))
    return "PM-KISAN provides <strong>₹6,000 per year</strong> to farmer families in 3 instalments. The next instalment is due in March 2026. Want me to help you check your status?";

  if (msg.includes("certificate") || msg.includes("birth") || msg.includes("income") || msg.includes("caste"))
    return "You can apply for certificates through your state portal. Which do you need?<br><br>• 📄 Birth Certificate<br>• 📄 Caste Certificate<br>• 📄 Income Certificate<br>• 📄 Residence Certificate";

  if (msg.includes("ration") || msg.includes("राशन"))
    return "For ration card services I can help you check status, add members, or apply for a new card. Please share your ration card number or Aadhaar to proceed.";

  if (msg.includes("ayushman") || msg.includes("health") || msg.includes("hospital"))
    return "Ayushman Bharat PM-JAY provides <strong>₹5 lakh health cover</strong> per family per year. To check eligibility visit pmjay.gov.in or call <strong>14555</strong>.";

  if (msg.includes("mudra") || msg.includes("loan") || msg.includes("business"))
    return "PM Mudra Yojana provides loans from <strong>₹50,000 to ₹10 lakh</strong> for small businesses at low interest. Want me to guide you through the application?";

  if (msg.includes("scholarship") || msg.includes("education") || msg.includes("student"))
    return "Several scholarships are available on <strong>scholarships.gov.in</strong>. You can filter by category (SC/ST/OBC/Minority) and education level. Want me to find the best match for you?";

  if (msg.includes("hello") || msg.includes("hi") || msg.includes("नमस्ते") || msg.includes("namaste"))
    return "Namaste! 🙏 I'm Saarthi, your AI assistant for government services. Ask me about:<br><br>🌾 Farmer schemes &nbsp;|&nbsp; 💰 Pensions<br>📄 Certificates &nbsp;|&nbsp; 🏥 Healthcare<br>🎓 Education &nbsp;|&nbsp; 🏦 Banking";

  return "I'm here to help! You can ask me about:<br><br>🌾 <strong>Farmer schemes</strong> (PM-KISAN, Fasal Bima)<br>💰 <strong>Pensions & benefits</strong><br>📄 <strong>Certificates</strong> (Birth, Caste, Income)<br>🏥 <strong>Healthcare</strong> (Ayushman Bharat)<br>🎓 <strong>Education & scholarships</strong><br>🏦 <strong>Banking</strong> (Jan Dhan, Mudra)";
}

// =========================================================
//  sendMessageToBackend — currently uses mock
//  When backend ready, uncomment the real API block below
// =========================================================
async function sendMessageToBackend(message) {
  addTypingIndicator();
  await new Promise(r => setTimeout(r, 800)); // simulate delay
  removeTypingIndicator();
  addMessage(getMockResponse(message), false);

  // ── REAL API (uncomment when backend + api.js are ready) ─
  // try {
  //   const result = await sendTextQuery(message, "gov_schemes", getSelectedLang(), currentSessionId);
  //   if (result.session_id) currentSessionId = result.session_id;
  //   removeTypingIndicator();
  //   addMessage(result.answer || "Sorry, no response.", false);
  // } catch (err) {
  //   removeTypingIndicator();
  //   addMessage("Something went wrong. Please try again.", false);
  // }
}

// ── Speech Recognition ─────────────────────────────────────
function createRecognition() {
  if (!SpeechRecognition) return null;
  const recognition          = new SpeechRecognition();
  recognition.continuous     = false;
  recognition.interimResults = false;
  recognition.lang           = isChatActive ? getSelectedLang() : "hi-IN";

  recognition.onresult = (e) => handleRecognitionResult(e.results[0][0].transcript);
  recognition.onerror  = (e) => handleRecognitionError(e.error);
  recognition.onend    = () => {
    isListening = false;
    micButtonLarge?.classList.remove("listening");
    micButton?.classList.remove("listening");
    if (!isChatActive) statusTextSimple?.classList.remove("listening");
    else statusText?.classList.remove("listening");
  };
  return recognition;
}

function handleRecognitionResult(transcript) {
  if (!isChatActive) {
    if (statusTextSimple) statusTextSimple.textContent = "Processing...";
    setTimeout(() => {
      showChatOnly(transcript);
      if (statusTextSimple) { statusTextSimple.textContent = ""; statusTextSimple.classList.remove("listening"); }
      micButtonLarge?.classList.remove("listening");
      isListening = false;
    }, 400);
  } else {
    if (textInput) textInput.value = transcript;
    if (statusText) statusText.textContent = "Processing...";
    setTimeout(() => {
      sendMessage(transcript);
      if (statusText) { statusText.textContent = ""; statusText.classList.remove("listening"); }
      micButton?.classList.remove("listening");
      isListening = false;
    }, 400);
  }
}

function handleRecognitionError(error) {
  const msgs = {
    "not-allowed":         "Microphone access denied. Please enable permissions.",
    "service-not-allowed": "Microphone access denied. Please enable permissions.",
    "no-speech":           "No speech detected. Please try again.",
    "network":             "Network error. Please check your connection.",
    "aborted":             "",
  };
  const msg = msgs[error] ?? "Could not understand. Please try again.";
  if (!isChatActive) {
    if (statusTextSimple) statusTextSimple.textContent = msg;
    statusTextSimple?.classList.remove("listening");
    micButtonLarge?.classList.remove("listening");
  } else {
    if (statusText) statusText.textContent = msg;
    statusText?.classList.remove("listening");
    micButton?.classList.remove("listening");
  }
  isListening = false;
  if (msg) setTimeout(() => {
    if (statusTextSimple) statusTextSimple.textContent = "";
    if (statusText) statusText.textContent = "";
  }, 4000);
}

// ── Show Chat ──────────────────────────────────────────────
function showChatOnly(firstMessage = "") {
  if (isChatActive) return;

  heroSection?.style.setProperty("display", "none");
  featuresSection?.style.setProperty("display", "none");
  languagesSection?.style.setProperty("display", "none");
  footerSection?.style.setProperty("display", "none");
  document.getElementById("categories")?.style.setProperty("display", "none");
  document.querySelector(".featured-section")?.style.setProperty("display", "none");
  navLinks.forEach((l) => l?.style.setProperty("display", "none"));

  const headerEl          = document.getElementById("header");
  const announcementBarEl = document.getElementById("announcementBar");
  if (headerEl) headerEl.style.transform = "translateY(-200%)";
  if (announcementBarEl) announcementBarEl.style.transform = "translateY(-200%)";

  if (chatOnlyView) {
    chatOnlyView.style.display = "block";
    chatOnlyView.classList.add("active", "fullscreen");
  }

  isChatActive = true;

  if (chatDisplay) {
    while (chatDisplay.firstChild) chatDisplay.removeChild(chatDisplay.firstChild);
    const welcomeDiv     = document.createElement("div");
    welcomeDiv.className = "message assistant-message";
    welcomeDiv.innerHTML = "👋 Namaste! How can I help you with government services today?";
    chatDisplay.appendChild(welcomeDiv);
  }

  // Handle prefill from schemes page "Ask AI" button
  const prefill = localStorage.getItem("saarthi_prefill_query");
  if (prefill) {
    localStorage.removeItem("saarthi_prefill_query");
    setTimeout(() => { addMessage(prefill, true); sendMessageToBackend(prefill); }, 300);
  } else if (firstMessage && firstMessage !== "Test message") {
    addMessage(firstMessage, true);
    sendMessageToBackend(firstMessage);
  }

  setTimeout(() => textInput?.focus(), 500);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── Go Back ────────────────────────────────────────────────
function goBackToHome() {
  if (!isChatActive) return;

  if (heroSection)      { heroSection.style.display = "flex"; heroSection.classList.remove("hidden"); }
  if (featuresSection)  featuresSection.style.display = "block";
  if (languagesSection) languagesSection.style.display = "block";
  if (footerSection)    footerSection.style.display = "block";

  document.getElementById("categories")?.style.setProperty("display", "block");
  document.querySelector(".featured-section")?.style.setProperty("display", "block");
  navLinks.forEach((l) => { if (l) l.style.display = "block"; });

  const headerEl          = document.getElementById("header");
  const announcementBarEl = document.getElementById("announcementBar");
  if (headerEl) headerEl.style.transform = "";
  if (announcementBarEl && !announcementBarEl.classList.contains("hidden")) announcementBarEl.style.transform = "";

  if (chatOnlyView) {
    chatOnlyView.style.display = "none";
    chatOnlyView.classList.remove("active", "fullscreen");
  }

  isChatActive     = false;
  currentSessionId = null;

  if (chatDisplay) {
    while (chatDisplay.children.length > 1) chatDisplay.removeChild(chatDisplay.lastChild);
  }

  heroSection?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── Chat helpers ───────────────────────────────────────────
function addMessage(text, isUser = false) {
  if (!chatDisplay) return;
  const div     = document.createElement("div");
  div.className = `message ${isUser ? "user-message" : "assistant-message"}`;
  div.innerHTML = text;
  chatDisplay.appendChild(div);
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

function addTypingIndicator() {
  if (!chatDisplay) return;
  const div     = document.createElement("div");
  div.className = "message assistant-message typing-indicator";
  div.id        = "typingIndicator";
  div.innerHTML = "<span></span><span></span><span></span>";
  chatDisplay.appendChild(div);
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

function removeTypingIndicator() {
  document.getElementById("typingIndicator")?.remove();
}

function sendMessage(text = null) {
  const message = text || textInput?.value.trim();
  if (!message) return;
  addMessage(message, true);
  if (textInput) textInput.value = "";
  sendMessageToBackend(message);
}

// ── Event Listeners ────────────────────────────────────────
textInputSimple?.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && textInputSimple.value.trim()) {
    showChatOnly(textInputSimple.value.trim());
    textInputSimple.value = "";
  }
});

sendButton?.addEventListener("click", () => sendMessage());
textInput?.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });

micButtonLarge?.addEventListener("click", () => {
  if (!recognitionSupported) {
    if (statusTextSimple) statusTextSimple.textContent = "Voice recognition not supported. Please type.";
    setTimeout(() => { if (statusTextSimple) statusTextSimple.textContent = ""; }, 3000);
    return;
  }
  if (!isListening) {
    const rec = createRecognition();
    if (rec) {
      try {
        rec.start(); isListening = true;
        micButtonLarge.classList.add("listening");
        if (statusTextSimple) { statusTextSimple.textContent = "Listening… Speak now"; statusTextSimple.classList.add("listening"); }
      } catch { isListening = false; }
    }
  } else {
    isListening = false;
    micButtonLarge.classList.remove("listening");
    if (statusTextSimple) { statusTextSimple.textContent = ""; statusTextSimple.classList.remove("listening"); }
  }
});

micButton?.addEventListener("click", () => {
  if (!recognitionSupported) {
    if (statusText) statusText.textContent = "Voice recognition not supported. Please type.";
    setTimeout(() => { if (statusText) statusText.textContent = ""; }, 3000);
    return;
  }
  if (!isListening) {
    const rec = createRecognition();
    if (rec) {
      try {
        rec.start(); isListening = true;
        micButton.classList.add("listening");
        if (statusText) { statusText.textContent = "Listening… Speak now"; statusText.classList.add("listening"); }
      } catch { isListening = false; }
    }
  } else {
    isListening = false;
    micButton.classList.remove("listening");
    if (statusText) { statusText.textContent = ""; statusText.classList.remove("listening"); }
  }
});

backButton?.addEventListener("click", goBackToHome);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isChatActive) goBackToHome(); });
document.querySelector(".logo")?.addEventListener("click", () => { if (isChatActive) goBackToHome(); else window.location.reload(); });

// ── Scroll animation ───────────────────────────────────────
const observer = new IntersectionObserver(
  (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("animated"); }),
  { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
);
document.querySelectorAll(".animate-on-scroll, .animate-left, .animate-right, .animate-scale").forEach((el) => el && observer.observe(el));

window.addEventListener("scroll", () => {
  document.getElementById("header")?.classList.toggle("scrolled", window.scrollY > 50);
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    if (!isChatActive) {
      e.preventDefault();
      document.querySelector(this.getAttribute("href"))?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

document.getElementById("announcementClose")?.addEventListener("click", () => {
  document.getElementById("announcementBar")?.classList.add("hidden");
  const h = document.getElementById("header");
  const s = document.getElementById("heroSection");
  if (h) h.style.top = "0px";
  if (s) s.style.marginTop = "70px";
});

// ── Language Initializer ───────────────────────────────────
const LANG_MAP = {
  "हिंदी (Hindi)": "hi", "বাংলা (Bengali)": "bn", "తెలుగు (Telugu)": "te",
  "मराठी (Marathi)": "mr", "தமிழ் (Tamil)": "ta", "ગુજરાતી (Gujarati)": "gu",
  "ಕನ್ನಡ (Kannada)": "kn", "മലയാളം (Malayalam)": "ml", "ਪੰਜਾਬੀ (Punjabi)": "pa",
  "ଓଡ଼ିଆ (Odia)": "or", "অসমীয়া (Assamese)": "as", "English": "en",
};

function applyGoogleTranslateLang(langCode, attempts = 0) {
  const select = document.querySelector(".goog-te-combo");
  if (select) { select.value = langCode; select.dispatchEvent(new Event("change")); }
  else if (attempts < 20) setTimeout(() => applyGoogleTranslateLang(langCode, attempts + 1), 100);
}

function initLanguage() {
  document.querySelectorAll(".language-tag").forEach((tag) => {
    tag.addEventListener("click", function () {
      const code = LANG_MAP[this.textContent.trim()];
      if (code) { localStorage.setItem("saarthi_lang", code); applyGoogleTranslateLang(code); }
    });
  });
  const saved = localStorage.getItem("saarthi_lang");
  if (saved && saved !== "en") applyGoogleTranslateLang(saved);
}

document.addEventListener("DOMContentLoaded", initLanguage);

// ── Typing indicator CSS ───────────────────────────────────
const style = document.createElement("style");
style.textContent = `
  .typing-indicator { display:flex; align-items:center; gap:5px; padding:12px 16px !important; }
  .typing-indicator span { width:8px; height:8px; border-radius:50%; background:#1a56db; display:inline-block; animation:typingBounce 1.2s infinite ease-in-out; }
  .typing-indicator span:nth-child(2) { animation-delay:.2s; }
  .typing-indicator span:nth-child(3) { animation-delay:.4s; }
  @keyframes typingBounce { 0%,80%,100%{transform:scale(.7);opacity:.5} 40%{transform:scale(1);opacity:1} }
`;
document.head.appendChild(style);

console.log("Saarthi AI initialized — standalone mode ✅");
console.log("Speech recognition supported:", recognitionSupported);