/**
 * Google Photos Episodic AI Anchor MVP
 * Frontend Controller & Semantic Interface
 */

const state = {
  gallery: [],
  results: null,
  isSearching: false,
  searchQuery: "",
  activeFilter: null,
  activePhoto: null,
  isBenchmarkOpen: false,
  benchmarkData: null,
  theme: "light"
};

// Initialize application
document.addEventListener("DOMContentLoaded", async () => {
  setupTheme();
  setupEventListeners();
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

  // Thesis benchmark modal
  const benchmarkBtn = document.getElementById("btn-thesis-benchmark");
  const closeBenchmarkBtn = document.getElementById("btn-close-thesis");
  const thesisModal = document.getElementById("thesis-modal");

  if (benchmarkBtn) {
    benchmarkBtn.addEventListener("click", openThesisModal);
  }
  if (closeBenchmarkBtn) {
    closeBenchmarkBtn.addEventListener("click", closeThesisModal);
  }
  if (thesisModal) {
    thesisModal.addEventListener("click", (e) => {
      if (e.target === thesisModal) closeThesisModal();
    });
  }

  // Lightbox modal close
  const lightboxModal = document.getElementById("lightbox-modal");
  const closeLightboxBtn = document.getElementById("btn-close-lightbox");
  if (closeLightboxBtn) {
    closeLightboxBtn.addEventListener("click", closeLightbox);
  }
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
      closeThesisModal();
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

async function executeSearch(query) {
  if (!query) {
    resetSearch();
    return;
  }

  state.isSearching = true;
  state.searchQuery = query;
  renderSearchLoading(true);

  try {
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query })
    });

    if (!res.ok) throw new Error("Search API failed");

    const data = await res.json();
    state.results = data;
  } catch (err) {
    console.error("API error, executing client-side fallback:", err);
    state.results = runClientSideFallback(query);
  } finally {
    state.isSearching = false;
    renderSearchLoading(false);
    renderApp();
  }
}

function renderSearchLoading(loading) {
  const btn = document.getElementById("btn-ask-ai");
  if (!btn) return;
  if (loading) {
    btn.innerHTML = `<div class="spinner-small" style="width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:spin 0.6s linear infinite;"></div> Searching...`;
  } else {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.999 22C11.999 22 11.233 13.784 4 12C11.233 10.216 11.999 2 11.999 2C11.999 2 12.765 10.216 20 12C12.765 13.784 11.999 22 11.999 22ZM18.499 6.5C18.499 6.5 18.04 4.035 15.5 3.5C18.04 2.965 18.499 0.5 18.499 0.5C18.499 0.5 18.959 2.965 21.5 3.5C18.959 4.035 18.499 6.5 18.499 6.5Z"/></svg> Ask AI`;
  }
}

function renderApp() {
  renderFilterChips();
  renderGallery();
}

function renderFilterChips() {
  const container = document.getElementById("filter-chips-bar");
  if (!container) return;

  container.innerHTML = "";

  // If we have dynamic follow-up filters from search
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
    // Default preset query suggestions demonstrating key capabilities
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

  // Search Results Mode
  if (state.results) {
    renderSearchResults(container);
  } else {
    // Default Chronological Photos Mode (Google Photos Timeline)
    renderDefaultTimeline(container);
  }
}

function renderSearchResults(container) {
  const { episodes, loose_matches, debug } = state.results;

  // Collect all resolved anomalies across episodes
  const allAnomalies = [];
  episodes.forEach(ep => {
    if (ep.anomalies && ep.anomalies.length > 0) {
      allAnomalies.push(...ep.anomalies);
    }
  });

  // Display Diagnostic as Floating Popup / Toast marked for Prototype Purpose Only
  if (allAnomalies.length > 0) {
    showPrototypeAnomalyPopup(allAnomalies);
  } else {
    hidePrototypeAnomalyPopup();
  }

  // Empty state check
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

    // Photos Grid
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
  // Group photos chronologically by EXIF date (simulating classic Google Photos timeline)
  const dateGroups = {};
  state.gallery.forEach((photo) => {
    const date = photo.exif_date.toUpperCase();
    if (!dateGroups[date]) dateGroups[date] = [];
    dateGroups[date].push(photo);
  });

  // Sort dates
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
        <span class="engine-pill">AI Anchor Diagnostic</span>
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
            re-anchored into true life event via semantic co-occurrence.
          </div>
        </div>
      `).join("")}
    </div>
  `;

  document.body.appendChild(toast);

  toast.querySelector("#btn-close-anomaly-toast").addEventListener("click", () => {
    hidePrototypeAnomalyPopup();
  });
}

function hidePrototypeAnomalyPopup() {
  const existing = document.getElementById("prototype-anomaly-toast");
  if (existing) {
    existing.classList.add("toast-hiding");
    setTimeout(() => existing.remove(), 220);
  }
}

async function openThesisModal() {
  const modal = document.getElementById("thesis-modal");
  if (!modal) return;

  modal.classList.add("active");
  const body = document.getElementById("thesis-modal-body");
  body.innerHTML = `<div style="text-align:center; padding:40px;"><div class="spinner-small" style="width:24px; height:24px; border:3px solid var(--border-light); border-top-color:var(--google-blue); border-radius:50%; animation:spin 0.6s linear infinite; margin:0 auto 12px auto;"></div> Running automated episodic benchmark evaluation...</div>`;

  try {
    const res = await fetch("/api/benchmark");
    if (!res.ok) throw new Error("Benchmark fetch failed");
    state.benchmarkData = await res.json();
    renderBenchmarkData(body, state.benchmarkData);
  } catch (err) {
    console.error("Benchmark error:", err);
    body.innerHTML = `<p style="color:red; padding:20px;">Failed to load live benchmark data.</p>`;
  }
}

function closeThesisModal() {
  const modal = document.getElementById("thesis-modal");
  if (modal) modal.classList.remove("active");
}

function renderBenchmarkData(container, data) {
  const { summary, test_results } = data;

  container.innerHTML = `
    <!-- Top Summary Metrics Grid -->
    <div class="stats-grid">
      <div class="stat-card stat-blue">
        <span class="stat-value">${Math.round(summary.overall_precision * 100)}%</span>
        <span class="stat-label">Precision@K</span>
      </div>
      <div class="stat-card stat-purple">
        <span class="stat-value">${Math.round(summary.overall_recall * 100)}%</span>
        <span class="stat-label">Recall Rate</span>
      </div>
      <div class="stat-card stat-green">
        <span class="stat-value">${summary.exif_anomaly_resolution_rate}</span>
        <span class="stat-label">WhatsApp Anomaly Fixed</span>
      </div>
      <div class="stat-card stat-amber">
        <span class="stat-value">${summary.junk_leakage_rate}</span>
        <span class="stat-label">Meme/Junk Leakage</span>
      </div>
    </div>

    <!-- Pipeline Architecture Visualizer -->
    <div>
      <h3 style="font-size:1rem; font-weight:700; margin-bottom:10px;">Dual-Stage Episodic Retrieval Pipeline</h3>
      <div class="pipeline-flow">
        <div class="flow-node">
          <span class="flow-node-title">1. Query Intent & Embeddings</span>
          <p class="flow-node-desc">Visual concept extraction, entity tokens, and temporal constraint filtering.</p>
        </div>
        <span class="flow-arrow">➔</span>
        <div class="flow-node">
          <span class="flow-node-title">2. Semantic Vector Recall</span>
          <p class="flow-node-desc">Heavily weights visual scene descriptions over corrupted EXIF timestamps.</p>
        </div>
        <span class="flow-arrow">➔</span>
        <div class="flow-node">
          <span class="flow-node-title">3. Temporal & Graph Clustering</span>
          <p class="flow-node-desc">Re-anchors WhatsApp / AirDrop drift into the true parent life event.</p>
        </div>
        <span class="flow-arrow">➔</span>
        <div class="flow-node">
          <span class="flow-node-title">4. Follow-up Synthesis</span>
          <p class="flow-node-desc">Disambiguates Doppelgängers (e.g., Goa vs Bali) and suggests contextual filters.</p>
        </div>
      </div>
    </div>

    <!-- Test Suite Results Table -->
    <div>
      <h3 style="font-size:1rem; font-weight:700; margin-bottom:10px;">Evaluation Test Suite (6 Core Retrieval Benchmarks)</h3>
      <div class="comparison-table-wrapper">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Benchmark Scenario</th>
              <th>Precision</th>
              <th>Recall</th>
              <th>F1 Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${test_results.map(r => `
              <tr>
                <td>
                  <strong>${r.test}</strong>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${r.details}</div>
                </td>
                <td>${Math.round(r.precision * 100)}%</td>
                <td>${Math.round(r.recall * 100)}%</td>
                <td>${Math.round(r.f1_score * 100)}%</td>
                <td><span class="tag-green">${r.status}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Client-side fallback if backend API is not reached
function runClientSideFallback(query) {
  const q = query.toLowerCase();
  const matched = state.gallery.filter(p => 
    p.visual.toLowerCase().includes(q) || 
    p.true_event.toLowerCase().includes(q) ||
    (p.entities || []).some(e => e.toLowerCase().includes(q))
  );

  return {
    query: query,
    episodes: [{
      title: "Matched Photos",
      confidence: 0.95,
      date_span: "Event Cluster",
      photo_ids: matched.map(p => p.id),
      anomalies: []
    }],
    loose_matches: [],
    follow_up_filters: []
  };
}
