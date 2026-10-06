# Google Photos • Episodic AI Anchor Prototype

A modern prototype demonstrating **Episodic Retrieval** and **EXIF Anomaly Re-anchoring** for intelligent photo gallery management, designed with Google Photos aesthetics, dark/light mode, and serverless deployment support.

---

## 🌟 Overview & Key Problems Solved

Traditional photo libraries rely strictly on chronological EXIF metadata (`DateTimeOriginal` or file modification timestamps). In real-world usage, this creates significant friction:

1. **The WhatsApp & AirDrop Drift Problem**:
   - Photos received via messaging apps or downloaded years later receive a fresh timestamp (e.g., September 2026) rather than their true capture date (e.g., December 2021).
   - **The Solution**: The Episodic AI Anchor analyzes visual scene semantics, entity co-occurrences, and conversational context to detect EXIF anomalies and automatically re-anchor drifting photos back into their true parent life event.

2. **Doppelgänger Life Events**:
   - Similar-looking scenes (e.g., *Goa Beach Wedding* vs. *Bali Beach Vacation*) often cross-contaminate standard search queries.
   - **The Solution**: Multi-stage episodic clustering separates distinct event clusters and synthesizes conversational follow-up chips (e.g., *"Bride & Groom Mandap"* vs. *"Bali Sunset Vacation"*).

3. **Slow-Burn Life Projects**:
   - Events spanning several months (e.g., a 6-month *Kitchen Renovation*) get scattered across a chronological timeline.
   - **The Solution**: Temporal and graph-based clustering unifies progress snapshots into a cohesive narrative episode.

---

## ✨ Features

- **Google Photos Aesthetic**:
  - Full Google Photos UI layout: Sidebar navigation, top search bar with keyboard shortcut (`/` to focus), dynamic filter chips, and smooth light/dark theme switcher.
- **Emoji-First Cards & Hover Inspection**:
  - Clean, distraction-free cards showing large centered emojis.
  - Smooth frosted-glass overlay (`backdrop-filter: blur(8px)`) revealing the true episodic anchor, full visual description, and entity tags only on hover.
- **Prototype Diagnostic Toast**:
  - Non-intrusive floating pop-up in the bottom-right corner marked for prototype purpose, summarizing detected EXIF drift anomalies and re-anchored files without cluttering the photo feed.
- **Engine Benchmarks Modal**:
  - Live system evaluation dashboard with Precision@K, Recall Rate, Anomaly Resolution metrics, pipeline architecture diagrams, and a 6-suite benchmark evaluation table.
- **Zero-Failure Architecture**:
  - Seamless multi-tier fallbacks: Works with a local Python server, Netlify serverless functions, or 100% in-browser deterministic execution if hosted as a static site.

---

## 📁 Repository Structure

```text
├── netlify/
│   └── functions/
│       ├── search.js          # Netlify serverless episodic search function
│       └── benchmark.js       # Netlify serverless evaluation benchmark function
├── public/
│   ├── css/
│   │   └── index.css          # Design system, themes & responsive layouts
│   ├── data/
│   │   └── gallery.json       # Semantic photo metadata (70 items)
│   ├── js/
│   │   └── app.js             # Frontend controller & in-browser engine fallback
│   ├── _redirects             # Netlify URL routing configuration
│   └── index.html             # Main semantic application view
├── netlify.toml               # Netlify build and redirect definitions
├── server.py                  # Local Python development server
└── README.md                  # Project documentation
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Python 3.8+ (no third-party pip dependencies required; uses Python standard library).

### Running the Local Server
1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd "Anti gravity"
   ```

2. Start the server:
   ```bash
   python server.py
   ```

3. Open your browser and navigate to:
   ```text
   http://127.0.0.1:8080
   ```

---

## ☁️ Deployment on Netlify

This project is pre-configured for **Netlify** with zero build configuration required.

### Method 1: Continuous Deployment via GitHub (Recommended)
1. Push this repository to GitHub.
2. In your [Netlify Dashboard](https://app.netlify.com/), click **Add new site** > **Import an existing project** > **GitHub**.
3. Select your repository. Netlify reads `netlify.toml` and automatically configures:
   - **Publish directory**: `public`
   - **Functions directory**: `netlify/functions`
4. *(Optional)* Add your Gemini API key under **Site configuration > Environment variables**:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `your_api_key_here`
5. Click **Deploy site**.

### Method 2: Manual Drag & Drop
1. In your Netlify dashboard, go to the **Deploys** tab of your site.
2. Drag and drop the repository folder directly into the Netlify drop zone.
3. The site will deploy instantly.

---

## 🧪 Benchmark Test Suites

The embedded **Engine Benchmarks** drawer evaluates the engine across 6 core scenarios:

| Scenario | Objective |
| :--- | :--- |
| **Winter Trip 2021** | Re-anchors WhatsApp photos with scrubbed timestamps back to the 2021 event. |
| **Goa Beach Wedding** | Resolves AirDrop drift photos into the multi-day wedding cluster. |
| **Doppelgänger Disambiguation** | Ensures 0% cross-cluster contamination between similar beach vacations. |
| **Slow-Burn Renovation** | Clusters a 6-month kitchen remodel into a single life project. |
| **Recurring Birthdays** | Isolates 25th (2023), 26th (2024), and 27th (2025) birthday celebrations. |
| **Junk & Meme Suppression** | Verifies screenshots, receipts, and memes never leak into life episodes. |

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (Custom Design Tokens, Flexbox/CSS Grid), Modern ES6+ JavaScript.
- **Backend / Serverless**: Python HTTP Server (`server.py`) for local development; Node.js Serverless Functions (`netlify/functions/`) for cloud hosting.
- **Styling**: Google Photos design tokens, Google Fonts (*Plus Jakarta Sans*, *Inter*), dark/light theme toggle.
