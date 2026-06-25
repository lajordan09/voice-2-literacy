# 🏫 Literacy Lab (Voice2Literacy)

> **Literacy Lab** is an interactive, full-stack, speech-to-write coaching application designed specifically for 4th-grade students. It uses speech-to-text inputs, dynamic scaffolding, and gamified badge mechanics to help young learners polish their written expression while providing teachers with comprehensive diagnostics and a real-time historical logs dashboard.

---

## ✨ Features

### 🐨 Student Coach Experience
* **Voice-to-Text Input:** Uses HTML5 Web Speech API with beautifully animated, responsive audio visualizers.
* **COPS Scaffolding Engine:** 
  * 🛑 **The Stop Sign:** Practice period placement in run-on sentences.
  * 📛 **The Name Game:** Learn capitalization of names, days, and places.
  * 🍒 **Word Upgrade:** Transform simple words (e.g., *went*, *said*) into rich, "Juicy Words" (e.g., *scampered*, *bellowed*).
  * 💡 **Evidence Check:** Practice elaboration by adding exciting "Why" or "Because" details.
* **Supportive AI Scaffolding:** Intelligent feedback crafted for a 4th-grade tone. Includes an automated, child-friendly local safety booster fallback in case of API high-demand states.
* **Gamified Rewards:** Create customized buddy avatars (🐨, 🐻, 🦊, 🦁, 🦉, 🦄) and unlock specialized writing badges.

### 📊 Teacher Console
* **Sync Real-Time Logs:** View a live comparison of the raw spoken transcripts versus the student's polished written masterpiece.
* **Diagnostics & Notes:** Standardized, server-evaluated COPS metrics, engagement scores, and coach diagnostics.
* **Classroom Customizer:** Dynamically add new word pairs to the "Juicy Words" list or adjust active lesson tracks.
* **Roster Progress Tracker:** Track total sessions, average engagement levels, and mastered skills for every student in the classroom.

---

## 🛠️ Technology Stack

* **Frontend:** React 18+, TypeScript, Tailwind CSS, Motion (Framer Motion) for beautiful feedback loops and confetti celebrations.
* **Backend:** Express, Node.js, `tsx` for TypeScript execution, bundled via `esbuild` to optimize stand-alone container warm starts.
* **LLM Engine:** Google Gen AI SDK (`@google/genai`) utilizing `gemini-3.5-flash` with automatic fallback to `gemini-3.1-flash-lite` and offline rule-based scaffolders.

---

## 📂 Project Structure

```text
├── .github/                  # GitHub workflows & templates
│   ├── workflows/
│   │   └── node.js.yml       # Continuous Integration (CI) configuration
│   └── pull_request_template.md
├── assets/                   # Static assets & media
├── data/                     # Local data stores / mocks
├── src/
│   ├── components/
│   │   ├── StudentCoach.tsx      # Student voice-to-write interaction interface
│   │   ├── TeacherDashboard.tsx  # In-depth Teacher Console & metrics
│   │   └── WaveformAnimation.tsx # Audio recording waveforms
│   ├── App.tsx               # Primary interface coordinator
│   ├── index.css             # Tailwind styling and typography imports
│   ├── main.tsx              # Application entry point
│   └── types.ts              # Strongly typed shared definitions
├── .env.example              # Environment variables template
├── .gitignore                # Standard file exclusion patterns
├── server.ts                 # Full-stack Express server with integrated Vite middleware
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration
└── package.json              # App manifests & script definitions
```

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or newer recommended)
* NPM

### Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/voice2literacy.git
   cd voice2literacy
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and add your Google Gemini API key:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your credential:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the Development Server:**
   This starts the full-stack server under `tsx` on port `3000`:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build and Run for Production:**
   ```bash
   npm run build
   npm run start
   ```

---

## 🔄 How to Sync & Push to GitHub

This project is built and optimized for the **Google AI Studio Build** environment. To sync this repository directly to your personal GitHub account:

1. **Locate the Settings Menu:** Look at the top right of the AI Studio Build interface.
2. **Export to GitHub:** Click on the settings icon and select the **Export to GitHub** option.
3. **Authorize and Link:** Log in with your GitHub account, grant the necessary permissions, and specify whether you want to export to a brand new repository or an existing one.
4. **Push/Pull Updates:** Once connected, the platform manages your branch synchronizations automatically.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
