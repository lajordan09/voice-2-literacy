# Voice 2 Literacy 🌈

**Voice 2 Literacy** is an interactive web-based elementary phonics reading room designed for young learners. It allows children to read stories, practice pronunciation via native Web Speech synthesis, dictate stories using Speech Recognition, and receive real-time, dynamic guidance from **Toby the Tutor**—an AI agent rendered dynamically using Google's **A2UI (Agent-to-User Interface)** protocol.

This project was built as a capstone project for **Kaggle's 5-Day AI Agents: Intensive Vibe Coding Course with Google**.

---

## 🚀 Key Features

*   **Interactive Phonics Stories**: Explore sound focus stories (e.g. *The Friendly Fox*, *Sam the Fat Cat*, *Ben's Big Red Bus*). Click on any word to hear it read aloud with kids-oriented speed and pitch.
*   **Sound Hunt Game**: Complete challenges by finding and clicking words containing the targeted phonics sounds. Highlights progress and updates in real-time.
*   **Expressive Dictation Canvas**: A child-friendly canvas where kids can type or click **"Voice Type"** to transcribe speech to text. Offers real-time phonics milestones tracking how many focus sound words they've typed.
*   **Toby the AI Tutor (A2UI Surface)**: Powered by a simulated AI agent session using `@a2ui/lit` and `@a2ui/web_core`. Toby dynamically streams visual feedback cards, traces, and sticker medals (like the 🏆 Sound Master Badge) directly to the A2UI surface in response to user actions.
*   **Developer Console**: Toggle open the built-in debugger to inspect the exact A2UI JSON message streams (e.g. `createSurface`, `updateComponents`) being processed by the renderer.

---

## 🛠️ Technology Stack

1.  **Frontend Framework**: Lit (Web Components) + TypeScript
2.  **State & Rendering Engine**: Google A2UI (`@a2ui/lit`, `@a2ui/web_core`)
3.  **Build Tool**: Vite
4.  **Speech APIs**: Web Speech API (`SpeechSynthesis`, `webkitSpeechRecognition`)
5.  **Styling**: Child-friendly design tokens (using Fredoka and Outfit Google Fonts)

---

## ⚡ Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm (v10+)

### Installation
1.  Clone this repository to your local machine.
2.  Navigate to the directory:
    ```bash
    cd voice-2-literacy
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```

### Running Locally
1.  Start the Vite local development server:
    ```bash
    npm run dev
    ```
2.  Open your browser and navigate to the local server URL (usually `http://localhost:5173/`).
---

## 🎬 Demo Video

This project serves as my capstone project, designed and developed during the **Kaggle & Google AI Agents Intensive** (June 15 – 19, 2026). 

**[Watch the Capstone Demo Video on YouTube](https://youtu.be/321mK_wepHw)**

**The walkthrough covers the core features, system architecture, and live agent behaviors.**
---

## 🛠️ Created By

**Laquita Jordan**  
*AI Developer & Capstone Creator*  
📅 Developed during the Kaggle & Google AI Agents Intensive (June 15 – 19, 2026)

👉🏾 [Email Me](mailto:laquitaj901@gmail.com) • [LinkedIn Profile](https://www.linkedin.com/in/laquitajordan-memphis/) • [Data Portfolio](https://mydatafolio.com/p/laquita-jordan)


