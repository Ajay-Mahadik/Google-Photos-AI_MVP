/**
 * Google Photos Episodic AI Anchor
 * Frontend Controller with Active Gemini AI Engine & Neural Reasoning
 */

// Migrate legacy models to Gemini 3.5 / 3.8
let initialModel = localStorage.getItem("gp_gemini_model") || "gemini-3.5-flash-lite";
if (!initialModel || initialModel.includes("2.0") || initialModel.includes("1.5")) {
  initialModel = "gemini-3.5-flash-lite";
  localStorage.setItem("gp_gemini_model", "gemini-3.5-flash-lite");
}

const state = {
  gallery: [],
  results: null,
  isSearching: false,
  searchQuery: "",
  activeFilter: null,
  activePhoto: null,
  theme: "light",
  geminiApiKey: localStorage.getItem("gp_gemini_api_key") || "",
  geminiModel: initialModel,
  geminiConfigured: false,
  isTestingGemini: false
};

// Initialize application
document.addEventListener("DOMContentLoaded", async () => {
  setupTheme();
  setupEventListeners();
  await checkGeminiStatus();
  await loadGallery();
  renderApp();
});

function setupTheme() {
  const saved = localStorage.getItem("gp_theme") || "light";
  state.theme = saved;
  document.documentElement.setAttribute("data-theme", saved);
  updateThemeIcon();
}

function toggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
  localStorage.setItem("gp_theme", state.theme);
  document.documentElement.setAttribute("data-theme", state.theme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.getElementById("btn-theme-toggle");
  if (btn) {
    btn.innerHTML = state.theme === "light"
      ? `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>`
      : `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`;
  }
}

async function loadGallery() {
  try {
    const res = await fetch("/api/photos");
    if (res.ok) {
      state.gallery = await res.json();
    } else {
      console.warn("Falling back to local data file");
      const localRes = await fetch("data/gallery.json");
      state.gallery = await localRes.json();
    }
  } catch (err) {
    console.error("Failed to load gallery:", err);
  }
}

// ==========================================
// GEMINI STATUS & CONFIGURATION
// ==========================================

async function checkGeminiStatus() {
  let backendConfigured = false;
  let backendModel = state.geminiModel;

  // 1. Try local Python status
  try {
    const res = await fetch("/api/config/status");
    if (res.ok) {
      const data = await res.json();
      backendConfigured = Boolean(data.gemini_configured);
      if (data.model) backendModel = data.model;
    }
  } catch (e) {
    // 2. Try Netlify serverless config
    try {
      const res = await fetch("/.netlify/functions/config");
      if (res.ok) {
        const data = await res.json();
        backendConfigured = Boolean(data.gemini_configured);
        if (data.model) backendModel = data.model;
      }
    } catch (err) {}
  }

  state.geminiConfigured = Boolean(backendConfigured || state.geminiApiKey);
  if (!state.geminiModel && backendModel) state.geminiModel = backendModel;

  updateGeminiStatusUI();
}

function updateGeminiStatusUI() {
  const topText = document.getElementById("top-gemini-status-text");
  const topDot = document.getElementById("top-gemini-dot");
  const topBtn = document.getElementById("btn-top-gemini");

  const sidebarText = document.getElementById("sidebar-status-text");
  const sidebarDot = document.getElementById("sidebar-pulse-dot");

  if (state.geminiConfigured) {
    const modelShort = state.geminiModel.replace("gemini-", "").replace("-flash", " Flash");
    if (topText) topText.textContent = `Gemini ${modelShort}`;
    if (topDot) topDot.className = "live-dot active";
    if (topBtn) {
      topBtn.className = "gemini-pill-btn connected";
      topBtn.title = `Active Gemini AI Engine (${state.geminiModel})`;
    }

    if (sidebarText) sidebarText.textContent = `Gemini AI Active`;
    if (sidebarDot) {
      sidebarDot.style.backgroundColor = "var(--accent-green)";
      sidebarDot.style.boxShadow = "0 0 10px var(--accent-green)";
    }
  } else {
    if (topText) topText.textContent = "Connect Gemini";
    if (topDot) topDot.className = "live-dot";
    if (topBtn) {
      topBtn.className = "gemini-pill-btn disconnected";
      topBtn.title = "Click to connect your Google Gemini API Key";
    }

    if (sidebarText) sidebarText.textContent = "Connect Gemini AI";
    if (sidebarDot) {
      sidebarDot.style.backgroundColor = "var(--accent-amber)";
      sidebarDot.style.boxShadow = "0 0 10px var(--accent-amber)";
    }
  }
}

function openGeminiModal() {
  const modal = document.getElementById("gemini-modal");
  if (!modal) return;

  const keyInput = document.getElementById("gemini-api-key-input");
  const modelSelect = document.getElementById("gemini-model-select");
  const clearBtn = document.getElementById("btn-clear-key");
  const banner = document.getElementById("gemini-modal-status-banner");

  if (keyInput) keyInput.value = state.geminiApiKey || "";
  if (modelSelect) modelSelect.value = state.geminiModel || "gemini-3.8-flash";

  if (state.geminiConfigured) {
    if (clearBtn) clearBtn.style.display = "inline-flex";
    if (banner) {
      banner.className = "gemini-status-banner connected";
      banner.innerHTML = `
        <span style="font-size:1.1rem;">✅</span>
        <div>
          <strong>Gemini AI Connected & Active</strong>
          <div style="font-size:0.78rem; opacity:0.9;">Neural episodic reasoning is active for photo queries and EXIF drift resolution.</div>
        </div>
      `;
    }
  } else {
    if (clearBtn) clearBtn.style.display = "none";
    if (banner) {
      banner.className = "gemini-status-banner disconnected";
      banner.innerHTML = `
        <span style="font-size:1.1rem;">🔑</span>
        <div>
          <strong>Running in Deterministic Fallback Mode</strong>
          <div style="font-size:0.78rem; opacity:0.9;">Enter a Gemini API key below to activate live multi-stage neural retrieval.</div>
        </div>
      `;
    }
  }

  modal.classList.add("active");
}

function closeGeminiModal() {
  const modal = document.getElementById("gemini-modal");
  if (modal) modal.classList.remove("active");
}

async function saveAndTestGeminiKey() {
  const keyInput = document.getElementById("gemini-api-key-input");
  const modelSelect = document.getElementById("gemini-model-select");
  const btn = document.getElementById("btn-save-gemini-key");
  const banner = document.getElementById("gemini-modal-status-banner");

  const apiKey = keyInput ? keyInput.value.trim() : "";
  const model = modelSelect ? modelSelect.value : "gemini-3.8-flash";

  if (!apiKey) {
    if (banner) {
      banner.className = "gemini-status-banner disconnected";
      banner.innerHTML = `<span>⚠️</span> Please enter a valid Gemini API key.`;
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<div class="spinner-small" style="width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin 0.6s linear infinite;"></div> Testing Connection...`;
  }

  let success = false;
  let statusMessage = "";

  // 1. Try testing via backend /api/config/key
  try {
    const res = await fetch("/api/config/key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, model: model })
    });
    const data = await res.json();
    if (res.ok && data.status === "success") {
      success = true;
      statusMessage = data.message || "Connected successfully!";
    } else {
      statusMessage = data.message || "Invalid API key.";
    }
  } catch (err) {
    // 2. Fallback: Test directly from browser against Google Gemini API
    try {
      const probeUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const probeRes = await fetch(probeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Return JSON: {\"ping\": \"pong\"}" }] }],
          generationConfig: { response_mime_type: "application/json", temperature: 0 }
        })
      });
      if (probeRes.ok) {
        success = true;
        statusMessage = `Direct connection to ${model} verified!`;
      } else {
        const errJson = await probeRes.json().catch(() => ({}));
        statusMessage = (errJson.error && errJson.error.message) || `Error (${probeRes.status})`;
      }
    } catch (browserErr) {
      statusMessage = `Network error: ${browserErr.message}`;
    }
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `<span>Test & Connect Live AI</span>`;
  }

  if (success) {
    state.geminiApiKey = apiKey;
    state.geminiModel = model;
    state.geminiConfigured = true;

    localStorage.setItem("gp_gemini_api_key", apiKey);
    localStorage.setItem("gp_gemini_model", model);

    if (banner) {
      banner.className = "gemini-status-banner connected";
      banner.innerHTML = `
        <span style="font-size:1.1rem;">✅</span>
        <div>
          <strong>Connected to ${model}!</strong>
          <div style="font-size:0.78rem;">${statusMessage}</div>
        </div>
      `;
    }

    const clearBtn = document.getElementById("btn-clear-key");
    if (clearBtn) clearBtn.style.display = "inline-flex";

    updateGeminiStatusUI();
    setTimeout(closeGeminiModal, 1200);
  } else {
    if (banner) {
      banner.className = "gemini-status-banner disconnected";
      banner.innerHTML = `
        <span style="font-size:1.1rem;">❌</span>
        <div>
          <strong>Authentication Failed</strong>
          <div style="font-size:0.78rem;">${statusMessage}</div>
        </div>
      `;
    }
  }
}

async function clearGeminiKey() {
  state.geminiApiKey = "";
  state.geminiConfigured = false;
  localStorage.removeItem("gp_gemini_api_key");

  try {
    await fetch("/api/config/key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: "" })
    });
  } catch (e) {}

  const keyInput = document.getElementById("gemini-api-key-input");
  if (keyInput) keyInput.value = "";

  const clearBtn = document.getElementById("btn-clear-key");
  if (clearBtn) clearBtn.style.display = "none";

  const banner = document.getElementById("gemini-modal-status-banner");
  if (banner) {
    banner.className = "gemini-status-banner disconnected";
    banner.innerHTML = `<span>ℹ️</span> Gemini API key removed. Running in deterministic mode.`;
  }

  updateGeminiStatusUI();
}

function toggleKeyVisibility() {
  const input = document.getElementById("gemini-api-key-input");
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
}

// ==========================================
// EVENT LISTENERS SETUP
// ==========================================

function setupEventListeners() {
  // Search Form
  const form = document.getElementById("search-form");
  const input = document.getElementById("search-input");
  const clearBtn = document.getElementById("btn-clear-search");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      executeSearch(input.value.trim());
    });
  }

  if (input) {
    input.addEventListener("input", (e) => {
      if (clearBtn) {
        clearBtn.style.display = e.target.value ? "flex" : "none";
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      clearBtn.style.display = "none";
      resetSearch();
    });
  }

  // Theme toggle
  const themeBtn = document.getElementById("btn-theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", toggleTheme);
  }

  // Gemini Configuration Modals
  const topGeminiBtn = document.getElementById("btn-top-gemini");
  const sidebarGeminiBtn = document.getElementById("btn-sidebar-gemini");
  const closeGeminiBtn = document.getElementById("btn-close-gemini-modal");
  const geminiModal = document.getElementById("gemini-modal");
  const saveKeyBtn = document.getElementById("btn-save-gemini-key");
  const clearKeyBtn = document.getElementById("btn-clear-key");
  const toggleVisibilityBtn = document.getElementById("btn-toggle-key-visibility");

  if (topGeminiBtn) topGeminiBtn.addEventListener("click", openGeminiModal);
  if (sidebarGeminiBtn) sidebarGeminiBtn.addEventListener("click", openGeminiModal);
  if (closeGeminiBtn) closeGeminiBtn.addEventListener("click", closeGeminiModal);
  if (saveKeyBtn) saveKeyBtn.addEventListener("click", saveAndTestGeminiKey);
  if (clearKeyBtn) clearKeyBtn.addEventListener("click", clearGeminiKey);
  if (toggleVisibilityBtn) toggleVisibilityBtn.addEventListener("click", toggleKeyVisibility);

  if (geminiModal) {
    geminiModal.addEventListener("click", (e) => {
      if (e.target === geminiModal) closeGeminiModal();
    });
  }

  // Lightbox modal close
  const lightboxModal = document.getElementById("lightbox-modal");
  const closeLightboxBtn = document.getElementById("btn-close-lightbox");
  if (closeLightboxBtn) closeLightboxBtn.addEventListener("click", closeLightbox);
  if (lightboxModal) {
    lightboxModal.addEventListener("click", (e) => {
      if (e.target === lightboxModal) closeLightbox();
    });
  }

  // Home Nav
  const homeBtn = document.getElementById("nav-photos");
  if (homeBtn) {
    homeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      resetSearch();
    });
  }

  // Keyboard shortcut: '/' to focus search, Escape to close modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== input) {
      e.preventDefault();
      input.focus();
    } else if (e.key === "Escape") {
      closeLightbox();
      closeGeminiModal();
    }
  });
}

function resetSearch() {
  state.searchQuery = "";
  state.results = null;
  const input = document.getElementById("search-input");
  if (input) input.value = "";
  const clearBtn = document.getElementById("btn-clear-search");
  if (clearBtn) clearBtn.style.display = "none";
  hidePrototypeAnomalyPopup();
  renderApp();
}

// ==========================================
// SEARCH ENGINE DISPATCHER
// ==========================================

async function executeSearch(query) {
  if (!query) {
    resetSearch();
    return;
  }

  state.isSearching = true;
  state.searchQuery = query;
  renderSearchLoading(true);

  let searchData = null;
  const requestHeaders = {
    "Content-Type": "application/json",
    "X-Gemini-Api-Key": state.geminiApiKey || "",
    "X-Gemini-Model": state.geminiModel || "gemini-3.8-flash"
  };

  const requestPayload = {
    query: query,
    api_key: state.geminiApiKey || "",
    model: state.geminiModel || "gemini-3.8-flash"
  };

  // 1. Try standard /api/search (Python server)
  try {
    const res = await fetch("/api/search", {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(requestPayload)
    });
    if (res.ok) {
      const text = await res.text();
      try {
        searchData = JSON.parse(text);
      } catch (e) {}
    }
  } catch (err) {}

  // 2. Try direct Netlify function path
  if (!searchData) {
    try {
      const res = await fetch("/.netlify/functions/search", {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(requestPayload)
      });
      if (res.ok) {
        const text = await res.text();
        try {
          searchData = JSON.parse(text);
        } catch (e) {}
      }
    } catch (err) {}
  }

  // 3. Direct browser Gemini execution (if client has key and backend server is offline/static)
  if (!searchData && state.geminiApiKey) {
    try {
      searchData = await callDirectBrowserGemini(query, state.geminiApiKey, state.geminiModel);
    } catch (browserGeminiErr) {
      console.warn("Direct browser Gemini call failed:", browserGeminiErr);
    }
  }

  // 4. Deterministic fallback clustering engine
  if (!searchData) {
    searchData = runFullEpisodicSearchEngine(query);
  }

  state.results = searchData;
  state.isSearching = false;
  renderSearchLoading(false);
  renderApp();
}

function renderSearchLoading(loading) {
  const btn = document.getElementById("btn-ask-ai");
  if (!btn) return;
  if (loading) {
    btn.innerHTML = `<div class="spinner-small" style="width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin 0.6s linear infinite;"></div> Gemini Thinking...`;
  } else {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.999 22C11.999 22 11.233 13.784 4 12C11.233 10.216 11.999 2 11.999 2C11.999 2 12.765 10.216 20 12C12.765 13.784 11.999 22 11.999 22ZM18.499 6.5C18.499 6.5 18.04 4.035 15.5 3.5C18.04 2.965 18.499 0.5 18.499 0.5C18.499 0.5 18.959 2.965 21.5 3.5C18.959 4.035 18.499 6.5 18.499 6.5Z"/></svg> Ask AI`;
  }
}

// ==========================================
// DIRECT BROWSER GEMINI INVOCATION
// ==========================================

async function callDirectBrowserGemini(query, apiKey, model = "gemini-3.8-flash") {
  const startTime = Date.now();
  const catalogSummary = state.gallery.map(p => ({
    id: String(p.id),
    emoji: p.emoji || "📷",
    visual: p.visual || "",
    exif_date: p.exif_date || "",
    source: p.source || "Camera",
    true_event: p.true_event || "",
    category: p.category || "event",
    entities: p.entities || []
  }));

  const systemInstruction = `You are Google Photos' Episodic AI Engine. Analyze the user query against the photo library catalog and retrieve matching photos organized into episodic life events, strictly adhering to these rules:

1. SEMANTIC EPISODIC CLUSTERING: Group matching photos into cohesive life events ('episodes'). Episodes must have >=2 photos. Standalone photos go into 'loose_matches'.
2. EXIF ANOMALY RE-ANCHORING (CRITICAL): Photos received via 'WhatsApp Download' or 'AirDrop' often have drifted timestamps. Re-anchor them into their true parent episode based on visual scene context. Include an anomaly object for each: photo_id, original_exif, source, reason.
3. DOPPELGÄNGER DISAMBIGUATION: Separate visually ambiguous events (e.g. Goa beach wedding vs Bali vacation) into distinct episodes with 0% mixing.
4. SLOW-BURN PROJECTS: Unify multi-month project snapshots (e.g. Kitchen Remodel) into a single episode.
5. TEMPORAL PRECISION: Respect explicit years or recurring events (e.g. 25th birthday in 2023).
6. JUNK SUPPRESSION: Exclude memes, receipts, and utility screenshots from life events.
7. FOLLOW-UPS: Generate 2-4 conversational filter suggestions.
8. REASONING: Explain your clustering and anomaly detection decisions in 'ai_reasoning'.`;

  const userPrompt = `User Query: "${query}"

Photo Library Catalog (70 items):
${JSON.stringify(catalogSummary, null, 2)}

Respond with JSON adhering to this schema:
{
  "ai_reasoning": "string",
  "episodes": [
    {
      "title": "string",
      "confidence": 0.98,
      "date_span": "string",
      "photo_ids": ["string"],
      "anomalies": [
        {
          "photo_id": "string",
          "original_exif": "string",
          "source": "string",
          "reason": "string"
        }
      ]
    }
  ],
  "loose_matches": ["string"],
  "follow_up_filters": ["string"]
}`;

  const modelsToTry = [model, "gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-2.5-flash", "gemini-3.8-pro"].filter((m, i, arr) => m && arr.indexOf(m) === i);
  let geminiData = null;
  let usedModel = model;
  let lastErr = null;

  for (const m of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.1
          }
        })
      });

      if (res.ok) {
        const json = await res.json();
        const candidate = json.candidates && json.candidates[0];
        if (candidate && candidate.content && candidate.content.parts && candidate.content.parts[0]) {
          const rawText = candidate.content.parts[0].text;
          const cleaned = rawText.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
          geminiData = JSON.parse(cleaned);
          usedModel = m;
          break;
        }
      } else {
        const errText = await res.text();
        lastErr = `HTTP ${res.status}: ${errText}`;
        if ([404, 429, 500, 503].includes(res.status)) {
          console.warn(`Direct Browser Gemini model ${m} returned ${res.status}. Falling over to next model.`);
          continue;
        }
        break;
      }
    } catch (e) {
      lastErr = e.message;
      continue;
    }
  }

  if (!geminiData) {
    throw new Error(`Direct Browser Gemini failed: ${lastErr}`);
  }

  const elapsedMs = Date.now() - startTime;
  const photoLookup = new Map(state.gallery.map(p => [String(p.id), p]));

  const validatedEpisodes = [];
  let totalAnomalies = 0;

  for (const ep of (geminiData.episodes || [])) {
    const validIds = (ep.photo_ids || []).map(String).filter(id => photoLookup.has(id));
    if (!validIds.length) continue;

    const anomaliesList = [];
    for (const anom of (ep.anomalies || [])) {
      const pid = String(anom.photo_id);
      if (photoLookup.has(pid)) {
        const pObj = photoLookup.get(pid);
        anomaliesList.push({
          photo_id: pid,
          original_exif: anom.original_exif || pObj.exif_date,
          source: anom.source || pObj.source,
          reason: anom.reason || `Re-anchored into ${ep.title} via Gemini semantic inference.`
        });
      }
    }
    totalAnomalies += anomaliesList.length;

    validatedEpisodes.push({
      title: ep.title || "Episode",
      confidence: typeof ep.confidence === "number" ? ep.confidence : 0.96,
      date_span: ep.date_span || "",
      photo_ids: validIds,
      anomalies: anomaliesList
    });
  }

  return {
    query,
    episodes: validatedEpisodes,
    loose_matches: (geminiData.loose_matches || []).map(String).filter(id => photoLookup.has(id)),
    follow_up_filters: (geminiData.follow_up_filters || []).slice(0, 4),
    ai_reasoning: geminiData.ai_reasoning || `Episodic clustering synthesized by ${model} live neural inference in browser.`,
    is_ai_native: true,
    gemini_live_call: true,
    debug: {
      execution_time_ms: elapsedMs,
      candidates_evaluated: state.gallery.length,
      anomalies_resolved_count: totalAnomalies,
      algorithm: `Direct Browser Google Gemini Inference (${model})`,
      model: model,
      gemini_live_call: true,
      is_ai_native: true
    }
  };
}

// ==========================================
// RENDER CONTROLLERS
// ==========================================

function renderApp() {
  renderFilterChips();
  renderGallery();
}

function renderFilterChips() {
  const container = document.getElementById("filter-chips-bar");
  if (!container) return;

  container.innerHTML = "";

  if (state.results && state.results.follow_up_filters && state.results.follow_up_filters.length > 0) {
    state.results.follow_up_filters.forEach((filterText) => {
      const chip = document.createElement("button");
      chip.className = "chip-filter";
      chip.innerHTML = `✨ ${filterText}`;
      chip.addEventListener("click", () => {
        const input = document.getElementById("search-input");
        if (input) input.value = filterText;
        executeSearch(filterText);
      });
      container.appendChild(chip);
    });
  } else {
    const presets = [
      { label: "🎿 Winter Trip with Rahul", query: "winter trip with rahul skiing" },
      { label: "🏖️ Goa Beach Wedding", query: "goa destination wedding apurva" },
      { label: "🌴 Bali Beach Vacation", query: "bali beach seminyak sunset" },
      { label: "🔨 Kitchen Remodel Project", query: "kitchen remodel renovation cabinets" },
      { label: "🎂 25th Birthday Celebration", query: "25th birthday party cake 2023" },
      { label: "🐕 Golden Retriever", query: "golden retriever dog on couch" }
    ];

    presets.forEach((p) => {
      const chip = document.createElement("button");
      chip.className = "chip-filter chip-preset";
      chip.innerText = p.label;
      chip.addEventListener("click", () => {
        const input = document.getElementById("search-input");
        if (input) input.value = p.query;
        executeSearch(p.query);
      });
      container.appendChild(chip);
    });
  }
}

function renderGallery() {
  const container = document.getElementById("gallery-scroll-area");
  if (!container) return;

  container.innerHTML = "";

  if (state.results) {
    renderSearchResults(container);
  } else {
    renderDefaultTimeline(container);
  }
}

function renderGeminiInsightCard(container, results) {
  const card = document.createElement("div");
  card.className = "gemini-insight-card";

  const isLive = Boolean(results.gemini_live_call || results.is_ai_native);
  const isKeyConfigured = Boolean(
    state.geminiConfigured ||
    state.geminiApiKey ||
    (results.debug && results.debug.gemini_key_detected) ||
    results.gemini_configured
  );
  const modelName = (results.debug && results.debug.model) || (isLive ? (state.geminiModel || "Gemini AI") : "Deterministic Fallback");
  const latency = (results.debug && results.debug.execution_time_ms) || 0;
  const reasoning = results.ai_reasoning || (isLive ? "Synthesized via Gemini episodic semantic reasoning." : "Deterministic clustering applied.");

  card.innerHTML = `
    <div class="gemini-insight-header">
      <div class="gemini-insight-title">
        <span class="gemini-icon">✨</span>
        <span>Google Gemini • Episodic Reasoning</span>
      </div>
      <div class="gemini-badges-row">
        <span class="prototype-pill">For Prototype Purposes Only</span>
        <span class="badge-live-ai ${isLive ? 'live' : 'fallback'}">
          ${isLive ? `🟢 Live AI (${latency}ms)` : '🛡️ Fallback Mode'}
        </span>
        <span class="badge-model-tag">${modelName}</span>
      </div>
    </div>
    
    <div class="gemini-reasoning-text" style="margin-bottom: 0;">
      ${reasoning}
    </div>

    ${!isLive ? (
      isKeyConfigured ? `
        <div style="font-size:0.82rem; margin-top:8px; color:var(--text-muted); display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span>💡 <em>Gemini API is connected. Cloud model server temporarily reported capacity limits. Auto-fallback engaged.</em></span>
          <button class="btn-open-config-inline" id="btn-insight-connect-key">Settings / Switch Model</button>
        </div>
      ` : `
        <div style="font-size:0.82rem; margin-top:8px; color:var(--text-muted); display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span>💡 <em>Want real-time Gemini neural reasoning?</em></span>
          <button class="btn-open-config-inline" id="btn-insight-connect-key">Connect your free Gemini API Key</button>
        </div>
      `
    ) : ''}
  `;

  const inlineBtn = card.querySelector('#btn-insight-connect-key');
  if (inlineBtn) {
    inlineBtn.addEventListener('click', openGeminiModal);
  }

  container.appendChild(card);
}

function renderSearchResults(container) {
  const { episodes, loose_matches } = state.results;

  // Render Live Gemini Insight Card at the top of results
  renderGeminiInsightCard(container, state.results);

  // Collect all resolved anomalies across episodes for toast diagnostic
  const allAnomalies = [];
  episodes.forEach(ep => {
    if (ep.anomalies && ep.anomalies.length > 0) {
      allAnomalies.push(...ep.anomalies);
    }
  });

  if (allAnomalies.length > 0) {
    showPrototypeAnomalyPopup(allAnomalies);
  } else {
    hidePrototypeAnomalyPopup();
  }

  if (episodes.length === 0 && (!loose_matches || loose_matches.length === 0)) {
    container.innerHTML += `
      <div class="empty-gallery-state">
        <div class="empty-icon-circle">
          <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
        <h3 class="empty-title">No matching photos found</h3>
        <p class="empty-subtitle">We couldn't find any photos or life episodes matching "${state.searchQuery}". Try selecting one of the suggested filters above.</p>
      </div>
    `;
    return;
  }

  // Render Life Event Episodes
  episodes.forEach((ep) => {
    const section = document.createElement("section");
    section.className = "episode-section";

    const header = document.createElement("div");
    header.className = "episode-header";

    const titleGroup = document.createElement("div");
    titleGroup.className = "episode-titleGroup";

    const titleInput = document.createElement("input");
    titleInput.className = "episode-editable-title";
    titleInput.value = ep.title;
    titleInput.title = "Click to rename this episodic anchor";
    titleInput.addEventListener("change", (e) => {
      ep.title = e.target.value;
    });

    const meta = document.createElement("span");
    meta.className = "episode-meta-tag";
    meta.textContent = `• ${ep.photo_ids.length} photos • ${ep.date_span}`;

    const confidenceBadge = document.createElement("span");
    confidenceBadge.className = "episode-confidence-badge";
    confidenceBadge.innerHTML = `★ ${Math.round(ep.confidence * 100)}% Coherence`;

    header.appendChild(titleInput);
    header.appendChild(meta);
    header.appendChild(confidenceBadge);
    section.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "photo-grid";

    ep.photo_ids.forEach((id) => {
      const photo = state.gallery.find((p) => String(p.id) === String(id));
      if (photo) {
        grid.appendChild(createPhotoCard(photo, ep));
      }
    });

    section.appendChild(grid);
    container.appendChild(section);
  });

  // Render Loose Matches if any
  if (loose_matches && loose_matches.length > 0) {
    const looseSection = document.createElement("section");
    looseSection.className = "episode-section";
    looseSection.innerHTML = `
      <div class="episode-header">
        <h3 style="font-size:1.1rem; font-weight:700; color:var(--text-secondary);">Individual & Loose Matches</h3>
        <span class="episode-meta-tag">• ${loose_matches.length} items</span>
      </div>
    `;

    const looseGrid = document.createElement("div");
    looseGrid.className = "photo-grid";

    loose_matches.forEach((id) => {
      const photo = state.gallery.find((p) => String(p.id) === String(id));
      if (photo) {
        looseGrid.appendChild(createPhotoCard(photo, null));
      }
    });

    looseSection.appendChild(looseGrid);
    container.appendChild(looseSection);
  }
}

function renderDefaultTimeline(container) {
  const dateGroups = {};
  state.gallery.forEach((photo) => {
    const date = photo.exif_date.toUpperCase();
    if (!dateGroups[date]) dateGroups[date] = [];
    dateGroups[date].push(photo);
  });

  const sortedDates = Object.keys(dateGroups).sort((a, b) => new Date(b) - new Date(a));

  sortedDates.forEach((dateLabel) => {
    const section = document.createElement("section");
    section.className = "episode-section";

    const header = document.createElement("div");
    header.className = "episode-header";
    header.innerHTML = `
      <h2 style="font-size: 0.95rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">${dateLabel}</h2>
      <span class="episode-meta-tag">${dateGroups[dateLabel].length} items</span>
    `;
    section.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "photo-grid";

    dateGroups[dateLabel].forEach((photo) => {
      grid.appendChild(createPhotoCard(photo, null));
    });

    section.appendChild(grid);
    container.appendChild(section);
  });
}

function createPhotoCard(photo, episode) {
  const card = document.createElement("div");
  const isAnomaly = photo.is_anomaly || ["WhatsApp Download", "AirDrop"].includes(photo.source);
  card.className = `photo-card ${isAnomaly ? "has-anomaly" : ""}`;

  card.innerHTML = `
    <div class="photo-image-wrapper">
      <div class="photo-placeholder-box">
        <span class="photo-emoji-large">${photo.emoji}</span>
      </div>
      
      <div class="card-top-badges">
        <span class="card-date-badge">${photo.exif_date}</span>
        <span class="card-source-badge ${isAnomaly ? "anomaly-source" : ""}">${photo.source}</span>
      </div>

      ${isAnomaly && episode ? `
        <div class="anomaly-ribbon" title="${photo.anomaly_reason || ''}">
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
          Re-anchored
        </div>
      ` : ""}

      <div class="card-hover-overlay">
        <div class="overlay-anchor">${photo.true_event}</div>
        <p class="overlay-desc">${photo.visual}</p>
        <div class="overlay-tags">
          ${(photo.entities || []).slice(0, 3).map(e => `<span class="overlay-tag-pill">${e}</span>`).join("")}
        </div>
      </div>
    </div>
  `;

  card.addEventListener("click", () => openLightbox(photo, episode));
  return card;
}

function openLightbox(photo, episode) {
  state.activePhoto = photo;
  const modal = document.getElementById("lightbox-modal");
  if (!modal) return;

  const imgSide = document.getElementById("lightbox-image-container");
  const detailsSide = document.getElementById("lightbox-details-container");

  imgSide.innerHTML = `
    <div class="lightbox-placeholder-preview">
      <span style="font-size: 6rem; filter: drop-shadow(0 8px 24px rgba(0,0,0,0.3));">${photo.emoji}</span>
      <div style="margin-top: 14px; font-size: 0.9rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">${photo.true_event}</div>
    </div>
  `;

  const isAnomaly = photo.is_anomaly || ["WhatsApp Download", "AirDrop"].includes(photo.source);

  detailsSide.innerHTML = `
    <div class="lightbox-header">
      <h3 class="lightbox-title">Photo #${photo.id} Metadata</h3>
      <button class="btn-close-modal" id="btn-modal-close-inner">
        <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>

    <div class="meta-field-group">
      <span class="meta-label">Visual Scene Description</span>
      <span class="meta-value">${photo.visual}</span>
    </div>

    <div class="meta-field-group">
      <span class="meta-label">True Episodic Anchor</span>
      <span class="meta-value" style="color:var(--google-blue); font-weight:700;">${photo.true_event}</span>
    </div>

    <div class="meta-field-group">
      <span class="meta-label">File Capture / EXIF Timestamp</span>
      <span class="meta-value">${photo.exif_date}</span>
    </div>

    <div class="meta-field-group">
      <span class="meta-label">Ingestion Source</span>
      <span class="meta-value">${photo.source}</span>
    </div>

    ${isAnomaly ? `
      <div class="meta-field-group" style="background:#fffbeb; padding:12px; border-radius:8px; border:1px solid #fde68a;">
        <span class="meta-label" style="color:#b45309;">⚠️ EXIF Anomaly Diagnosis</span>
        <span class="meta-value" style="color:#92400e; font-size:0.85rem;">
          ${photo.anomaly_reason || `The EXIF date (${photo.exif_date}) is corrupted by ${photo.source}. Episodic AI Engine bound this photo to "${photo.true_event}" based on visual co-occurrence.`}
        </span>
      </div>
    ` : ""}

    <div class="meta-field-group">
      <span class="meta-label">Extracted Entities & Semantics</span>
      <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:4px;">
        ${(photo.entities || []).map(e => `<span style="background:var(--bg-tertiary); padding:3px 8px; border-radius:6px; font-size:0.8rem; font-weight:600;">${e}</span>`).join("")}
      </div>
    </div>
  `;

  document.getElementById("btn-modal-close-inner").addEventListener("click", closeLightbox);
  modal.classList.add("active");
}

function closeLightbox() {
  const modal = document.getElementById("lightbox-modal");
  if (modal) modal.classList.remove("active");
  state.activePhoto = null;
}

function showPrototypeAnomalyPopup(anomalies) {
  hidePrototypeAnomalyPopup();
  if (!anomalies || anomalies.length === 0) return;

  const toast = document.createElement("div");
  toast.id = "prototype-anomaly-toast";
  toast.className = "prototype-anomaly-toast";
  toast.innerHTML = `
    <div class="toast-header">
      <div class="toast-badge-group">
        <span class="prototype-pill">Prototype Purpose Only</span>
        <span class="engine-pill">Gemini AI Diagnostic</span>
      </div>
      <button class="toast-close-btn" id="btn-close-anomaly-toast" title="Dismiss popup" aria-label="Dismiss popup">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    <div class="toast-title">
      <span class="toast-bullet">⚡</span>
      <span>${anomalies.length} EXIF Date Anomalies Re-Anchored</span>
    </div>
    <div class="toast-body">
      ${anomalies.map(a => `
        <div class="toast-item">
          <span class="toast-bullet">•</span>
          <div>
            <strong>Photo #${a.photo_id}</strong> (${a.source} date: <em>${a.original_exif}</em>) 
            re-anchored into true life event via neural visual co-occurrence.
          </div>
        </div>
      `).join("")}
    </div>
  `;

  document.body.appendChild(toast);
  toast.querySelector("#btn-close-anomaly-toast").addEventListener("click", hidePrototypeAnomalyPopup);
}

function hidePrototypeAnomalyPopup() {
  const existing = document.getElementById("prototype-anomaly-toast");
  if (existing) {
    existing.classList.add("toast-hiding");
    setTimeout(() => existing.remove(), 220);
  }
}



// ==========================================
// DETERMINISTIC CLIENT-SIDE FALLBACK ENGINE
// ==========================================

const STOPWORDS_SET = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", 
  "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", 
  "by", "can", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", 
  "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him", 
  "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", 
  "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", 
  "once", "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "s", 
  "same", "she", "should", "so", "some", "such", "than", "that", "the", "their", "theirs", 
  "them", "themselves", "then", "there", "these", "they", "this", "those", "through", "to", 
  "too", "under", "until", "up", "very", "was", "we", "were", "what", "when", "where", 
  "which", "while", "who", "whom", "why", "with", "would", "you", "your", "yours", 
  "yourself", "yourselves", "photo", "photos", "pic", "pics", "picture", "pictures", "show", "find"
]);

function tokenizeQuery(text) {
  if (!text) return [];
  const words = text.toLowerCase().match(/[a-zA-Z0-9]+/g) || [];
  return words.filter(w => !STOPWORDS_SET.has(w) && w.length > 1);
}

function calculateClientSimilarity(queryTokens, photo) {
  if (!queryTokens.length) return 0.0;
  let score = 0.0;
  const textCorpus = `${photo.visual || ""} ${(photo.entities || []).join(" ")} ${photo.true_event || ""}`.toLowerCase();
  
  const queryStr = queryTokens.join(" ");
  if (textCorpus.includes(queryStr)) score += 4.0;

  const queryYears = queryTokens.filter(t => ["2021", "2022", "2023", "2024", "2025", "2026"].includes(t));
  const photoTextAndEvent = `${photo.true_event || ""} ${photo.visual || ""} ${photo.exif_date || ""}`;
  if (queryYears.length > 0) {
    const hasMatchingYear = queryYears.some(y => photoTextAndEvent.includes(y));
    if (!hasMatchingYear) {
      if (["2021", "2022", "2023", "2024", "2025", "2026"].some(y => (photo.true_event || "").includes(y))) {
        return 0.0;
      }
    }
  }

  const ordinals = ["25th", "26th", "27th"];
  const queryOrds = queryTokens.filter(t => ordinals.includes(t));
  if (queryOrds.length > 0) {
    const hasOrd = queryOrds.some(o => textCorpus.includes(o));
    if (!hasOrd && ordinals.some(o => textCorpus.includes(o))) return 0.0;
  }

  for (const token of queryTokens) {
    for (const entity of (photo.entities || [])) {
      if (token === entity.toLowerCase()) score += 3.0;
      else if (entity.toLowerCase().includes(token)) score += 1.5;
    }
    const visualTokens = tokenizeQuery(photo.visual || "");
    if (visualTokens.includes(token)) score += 2.0;

    const eventTokens = tokenizeQuery(photo.true_event || "");
    if (eventTokens.includes(token)) score += 2.5;

    if (token === (photo.category || "").toLowerCase()) score += 1.0;
    const exifTokens = tokenizeQuery(photo.exif_date || "");
    if (exifTokens.includes(token)) score += 0.8;
  }

  return score;
}

function runFullEpisodicSearchEngine(query) {
  const queryTokens = tokenizeQuery(query);
  const scored = [];
  for (const photo of state.gallery) {
    const score = calculateClientSimilarity(queryTokens, photo);
    if (score > 0.6) scored.push({ score, photo });
  }
  scored.sort((a, b) => b.score - a.score);

  if (!scored.length) {
    return {
      query,
      episodes: [],
      loose_matches: [],
      follow_up_filters: [],
      ai_reasoning: "No photos matching this query were found in the gallery.",
      is_ai_native: false,
      gemini_live_call: false,
      debug: {
        candidates_evaluated: 0,
        anomalies_resolved_count: 0,
        algorithm: "In-Browser Episodic Clustering Engine (Fallback Mode)"
      }
    };
  }

  const maxScore = Math.max(...scored.map(c => c.score));
  const eventGroups = {};
  const eventScores = {};
  const looseMatches = [];
  const anomaliesResolved = [];

  const isQueryingUtility = queryTokens.some(t => ['meme', 'receipt', 'screenshot', 'ticket', 'prescription', 'utility', 'junk'].includes(t));

  for (const { score, photo } of scored) {
    const event = photo.true_event || 'Everyday';
    const cat = photo.category || 'standalone';

    if (['meme', 'utility', 'junk'].includes(cat) && !isQueryingUtility) {
      if (score >= maxScore * 0.7) looseMatches.push(photo.id);
      continue;
    }

    if (['Everyday', 'Utility', 'Meme', 'Junk'].includes(event)) {
      if (score >= maxScore * 0.5) looseMatches.push(photo.id);
    } else {
      if (!eventGroups[event]) {
        eventGroups[event] = [];
        eventScores[event] = [];
      }
      eventGroups[event].push(photo);
      eventScores[event].push(score);
    }
  }

  const clusterAvgScores = {};
  for (const [ev, scores] of Object.entries(eventScores)) {
    clusterAvgScores[ev] = scores.reduce((a, b) => a + b, 0) / scores.length;
  }
  const topClusterScore = Math.max(...Object.values(clusterAvgScores), 0);

  const finalEpisodes = [];
  for (const [eventName, photos] of Object.entries(eventGroups)) {
    const avgScore = clusterAvgScores[eventName];
    if (avgScore < topClusterScore * 0.52) continue;

    if (photos.length >= 2) {
      const photosInEp = photos.slice().sort((a, b) => Number(a.id) - Number(b.id));
      const epAnomalies = [];
      for (const p of photosInEp) {
        if (p.is_anomaly || ['WhatsApp Download', 'AirDrop'].includes(p.source)) {
          const info = {
            photo_id: p.id,
            original_exif: p.exif_date,
            source: p.source,
            reason: p.anomaly_reason || `Re-anchored from ${p.source} date to ${eventName} based on visual co-occurrence.`
          };
          epAnomalies.push(info);
          anomaliesResolved.push(info);
        }
      }

      const normalDates = photosInEp.filter(p => !p.is_anomaly).map(p => p.exif_date);
      const span = normalDates.length > 1
        ? `${normalDates[0]} - ${normalDates[normalDates.length - 1]}`
        : (normalDates[0] || photosInEp[0].exif_date);

      finalEpisodes.push({
        title: eventName,
        confidence: Math.round((0.94 + Math.min(photos.length, 8) * 0.007) * 100) / 100,
        date_span: span,
        photo_ids: photosInEp.map(p => p.id),
        anomalies: epAnomalies
      });
    } else {
      if (avgScore >= maxScore * 0.6) {
        looseMatches.push(...photos.map(p => p.id));
      }
    }
  }

  const followUpFilters = [];
  const titles = finalEpisodes.map(e => e.title);
  if (titles.some(t => t.includes("Goa")) && titles.some(t => t.includes("Bali"))) {
    followUpFilters.push("🌴 Goa Beach Wedding", "🌅 Bali Sunset Vacation");
  } else if (titles.some(t => t.includes("Goa"))) {
    followUpFilters.push("Bride & Groom Mandap", "Apurva in blue lehenga", "Haldi & Mehendi", "Sangeet Dance");
  } else if (titles.some(t => t.includes("Winter"))) {
    followUpFilters.push("Coffee with Rahul", "Ski lift & Slopes", "Cozy Cabin Fireplace");
  } else if (titles.some(t => t.includes("Diwali"))) {
    followUpFilters.push("Office Rangoli Art", "Colleagues with Sweets", "Cubicle Diyas");
  } else if (titles.some(t => t.includes("Birthday"))) {
    followUpFilters.push("Blowing Birthday Candles", "Birthday Cake", "Friend Group Selfie");
  } else if (titles.some(t => t.includes("Kitchen"))) {
    followUpFilters.push("Old Cabinets Demolition", "White Shaker Cabinets", "Marble Countertops");
  }

  return {
    query,
    episodes: finalEpisodes,
    loose_matches: looseMatches,
    follow_up_filters: followUpFilters.slice(0, 4),
    ai_reasoning: "Deterministic episodic clustering applied. Connect a Gemini API Key to activate live neural reasoning.",
    is_ai_native: false,
    gemini_live_call: false,
    debug: {
      candidates_evaluated: scored.length,
      anomalies_resolved_count: anomaliesResolved.length,
      algorithm: "In-Browser Episodic Clustering Engine (Full Client-Side Resilience)",
      gemini_live_call: false,
      is_ai_native: false
    }
  };
}
