import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface PhonicsStory {
  id: string;
  title: string;
  emoji: string;
  targetSound: string;
  description: string;
  words: string[];
}

const PHONICS_STORIES: PhonicsStory[] = [
  {
    id: 'fox',
    title: 'The Friendly Fox',
    emoji: '🦊',
    targetSound: 'Short O & F',
    description: 'Practice the "o" and "f" sounds!',
    words: ['fox', 'ran', 'fast', 'in', 'the', 'fog', '.', 'He', 'got', 'hot', 'and', 'sat', 'on', 'a', 'log', '.']
  },
  {
    id: 'cat',
    title: 'Sam the Fat Cat',
    emoji: '🐱',
    targetSound: 'Short A',
    description: 'Practice the short "a" sound!',
    words: ['Sam', 'is', 'a', 'fat', 'cat', '.', 'He', 'sat', 'on', 'a', 'flat', 'mat', '.', 'He', 'saw', 'a', 'rat', 'in', 'a', 'hat', '.']
  },
  {
    id: 'bus',
    title: 'Ben\'s Big Red Bus',
    emoji: '🚌',
    targetSound: 'Short U & B',
    description: 'Practice the "b" and short "u" sounds!',
    words: ['Ben', 'got', 'on', 'the', 'big', 'bus', '.', 'The', 'bus', 'ran', 'in', 'the', 'mud', '.', 'Ben', 'had', 'fun', 'in', 'the', 'sun', '.']
  }
];

@customElement('phonics-room')
export class PhonicsRoom extends LitElement {
  @state() private activeStoryIndex = 0;
  @state() private activeWordIndex = -1;
  @state() private isReading = false;
  @state() private foundTargetWords: Set<number> = new Set();
  @state() private showPhonicsHint = false;

  get stories() {
    return PHONICS_STORIES;
  }

  get currentStoryIndex() {
    return this.activeStoryIndex;
  }


  private synthesis = window.speechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .room-container {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 24px;
      padding: 16px;
    }

    @media (max-width: 900px) {
      .room-container {
        grid-template-columns: 1fr;
      }
    }

    /* Sidebar list of stories */
    .sidebar {
      background-color: var(--bg-card);
      border-radius: var(--radius-lg);
      padding: 20px;
      border: 2px solid var(--border-color);
      box-shadow: var(--shadow-soft);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .sidebar-title {
      font-size: 1.25rem;
      color: var(--color-primary-dark);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .story-tab {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      border: 2px solid transparent;
      text-align: left;
      background-color: var(--bg-app);
      color: var(--text-main);
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    .story-tab:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-bounce);
      border-color: var(--color-primary-light);
    }

    .story-tab.active {
      background-color: var(--color-primary-light);
      border-color: var(--color-primary);
      color: var(--color-primary-dark);
    }

    .story-tab-emoji {
      font-size: 1.75rem;
    }

    .story-tab-info h4 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
    }

    .story-tab-info span {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* Main Story Area */
    .story-card {
      background-color: var(--bg-card);
      border-radius: var(--radius-lg);
      padding: 32px;
      border: 2px solid var(--border-color);
      box-shadow: var(--shadow-soft);
      display: flex;
      flex-direction: column;
      gap: 24px;
      position: relative;
      overflow: hidden;
    }

    .story-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, var(--color-primary), var(--color-secondary), var(--color-accent));
    }

    .story-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px dashed var(--border-color);
      padding-bottom: 16px;
    }

    .story-title-group h2 {
      font-size: 2rem;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .story-sound-badge {
      font-family: var(--font-heading);
      background-color: var(--color-secondary-light);
      color: var(--color-secondary);
      font-size: 0.85rem;
      padding: 6px 12px;
      border-radius: 99px;
      font-weight: 600;
      margin-top: 4px;
      display: inline-block;
    }

    /* Interactive Story Text Canvas */
    .story-canvas {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 12px;
      line-height: 2.2;
      font-size: 1.75rem;
      font-family: var(--font-heading);
      padding: 24px;
      background-color: var(--bg-app);
      border-radius: var(--radius-md);
      border: 2px solid var(--border-color);
    }

    .word-tile {
      display: inline-block;
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      border: 1px solid transparent;
      user-select: none;
      transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .word-tile:hover {
      background-color: var(--color-primary-light);
      border-color: var(--color-primary);
      transform: scale(1.1);
    }

    .word-tile.active-word {
      background-color: var(--color-warning);
      color: hsl(35, 100%, 15%);
      box-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
      transform: scale(1.15);
    }

    .word-tile.punctuation {
      cursor: default;
      pointer-events: none;
      padding: 0;
    }

    .word-tile.sound-highlight {
      border-bottom: 3px dotted var(--color-secondary);
      border-radius: 0;
    }

    .word-tile.found {
      background-color: var(--color-accent-light);
      color: var(--color-accent);
      border: 2px solid var(--color-accent);
      transform: scale(1.05);
    }

    /* Control Bar */
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
    }

    .btn-read {
      background-color: var(--color-primary);
      color: #ffffff;
      padding: 14px 28px;
      border-radius: 99px;
      font-size: 1.15rem;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
    }

    .btn-read:hover {
      background-color: var(--color-primary-dark);
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
    }

    .btn-read.reading {
      background-color: var(--color-danger);
      box-shadow: 0 6px 16px rgba(239, 68, 68, 0.3);
    }

    .btn-read.reading:hover {
      background-color: hsl(350, 85%, 50%);
    }

    .btn-secondary-action {
      background-color: var(--bg-app);
      border: 2px solid var(--border-color);
      color: var(--text-main);
      padding: 12px 24px;
      border-radius: 99px;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-secondary-action:hover {
      border-color: var(--text-muted);
      background-color: var(--border-color);
      transform: translateY(-1px);
    }

    /* Phonics Activity Module */
    .phonics-activity {
      background-color: var(--color-accent-light);
      border: 2px dashed var(--color-accent);
      border-radius: var(--radius-md);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .activity-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .activity-title {
      font-family: var(--font-heading);
      color: var(--color-accent);
      font-size: 1.15rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .activity-progress {
      font-size: 0.9rem;
      font-weight: bold;
      color: var(--color-accent);
    }

    .hint-box {
      font-size: 0.9rem;
      background-color: var(--bg-card);
      border: 1px solid var(--color-accent);
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      color: var(--text-main);
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  render() {
    const story = PHONICS_STORIES[this.activeStoryIndex];
    const targetSoundWords = this.getTargetSoundWords(story);
    const progress = `${this.foundTargetWords.size} / ${targetSoundWords.length}`;

    return html`
      <div class="room-container">
        <!-- Sidebar Navigation -->
        <div class="sidebar">
          <div class="sidebar-title">
            <span>📚</span> Choose a Story
          </div>
          ${PHONICS_STORIES.map((s, idx) => html`
            <button 
              class="story-tab ${this.activeStoryIndex === idx ? 'active' : ''}"
              @click=${() => this.changeStory(idx)}
            >
              <span class="story-tab-emoji">${s.emoji}</span>
              <div class="story-tab-info">
                <h4>${s.title}</h4>
                <span>${s.targetSound}</span>
              </div>
            </button>
          `)}
        </div>

        <!-- Main Story Reader -->
        <div class="story-card">
          <div class="story-header">
            <div class="story-title-group">
              <h2>${story.emoji} ${story.title}</h2>
              <span class="story-sound-badge">🎯 Sound Focus: ${story.targetSound}</span>
            </div>
          </div>

          <!-- Story Text Canvas -->
          <div class="story-canvas">
            ${story.words.map((word, idx) => {
              const isPunc = /^[.,\/#!$%\^&\*;:{}=\-_`~()]$/.test(word);
              if (isPunc) {
                return html`<span class="word-tile punctuation">${word}</span>`;
              }
              const isTargetSound = this.isWordTargetSound(word, story.id);
              const isFound = this.foundTargetWords.has(idx);

              return html`
                <span 
                  class="word-tile 
                    ${this.activeWordIndex === idx ? 'active-word' : ''} 
                    ${this.showPhonicsHint && isTargetSound ? 'sound-highlight' : ''}
                    ${isFound ? 'found' : ''}"
                  @click=${() => this.onWordClick(word, idx, isTargetSound)}
                >
                  ${word}
                </span>
              `;
            })}
          </div>

          <!-- Controls -->
          <div class="controls">
            <button 
              class="btn-read ${this.isReading ? 'reading' : ''}"
              @click=${this.toggleReadStory}
            >
              ${this.isReading 
                ? html`<span>⏹ Stop Listening</span>` 
                : html`<span>🔊 Listen to Story</span>`}
            </button>

            <button 
              class="btn-secondary-action"
              @click=${() => this.showPhonicsHint = !this.showPhonicsHint}
            >
              💡 ${this.showPhonicsHint ? 'Hide Helpers' : 'Highlight Sounds'}
            </button>
          </div>

          <!-- Interactive Game: Sound Hunt -->
          <div class="phonics-activity">
            <div class="activity-header">
              <div class="activity-title">
                <span>⭐</span> Sound Hunt Activity
              </div>
              <div class="activity-progress">
                Found: ${progress}
              </div>
            </div>
            <p>
              Can you click all the words that have the <strong>${story.targetSound}</strong> sound?
            </p>
            ${this.showPhonicsHint ? html`
              <div class="hint-box">
                👉 Words with dotted underlines match the target sound! Click on them to complete the hunt.
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  private changeStory(index: number) {
    this.stopReading();
    this.activeStoryIndex = index;
    this.activeWordIndex = -1;
    this.foundTargetWords = new Set();
    this.showPhonicsHint = false;
    
    // Dispatch custom event to notify parent/tutor that story changed
    this.dispatchEvent(new CustomEvent('story-changed', {
      detail: { story: PHONICS_STORIES[index] },
      bubbles: true,
      composed: true
    }));
  }

  private getTargetSoundWords(story: PhonicsStory): number[] {
    const list: number[] = [];
    story.words.forEach((word, idx) => {
      if (this.isWordTargetSound(word, story.id)) {
        list.push(idx);
      }
    });
    return list;
  }

  private isWordTargetSound(word: string, storyId: string): boolean {
    const cleaned = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    if (!cleaned) return false;
    
    if (storyId === 'fox') {
      // Short O or starting with F
      return cleaned.startsWith('f') || cleaned.includes('o');
    } else if (storyId === 'cat') {
      // Short A
      return cleaned.includes('a') && !cleaned.includes('aw');
    } else if (storyId === 'bus') {
      // Short U or starting with B
      return cleaned.startsWith('b') || cleaned.includes('u');
    }
    return false;
  }

  private async onWordClick(word: string, index: number, isTargetSound: boolean) {
    // Speak clicked word
    this.speakWord(word);
    
    // If it's a target sound and not already found, add it
    if (isTargetSound) {
      const newFound = new Set(this.foundTargetWords);
      if (!newFound.has(index)) {
        newFound.add(index);
        this.foundTargetWords = newFound;

        // Sparkle or sound success
        this.dispatchEvent(new CustomEvent('sound-found', {
          detail: { 
            word,
            index,
            isCompleted: this.foundTargetWords.size === this.getTargetSoundWords(PHONICS_STORIES[this.activeStoryIndex]).length
          },
          bubbles: true,
          composed: true
        }));
      }
    }
  }

  private speakWord(word: string) {
    this.synthesis.cancel();
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    if (!cleanWord) return;
    
    const utterance = new SpeechSynthesisUtterance(cleanWord);
    utterance.rate = 0.85; // Read slightly slower for phonics clarity
    
    // Find a friendly English voice if possible
    const voices = this.synthesis.getVoices();
    const friendlyVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                        voices.find(v => v.lang.startsWith('en'));
    if (friendlyVoice) {
      utterance.voice = friendlyVoice;
    }
    
    this.synthesis.speak(utterance);
  }

  private toggleReadStory() {
    if (this.isReading) {
      this.stopReading();
    } else {
      this.readStory();
    }
  }

  private readStory() {
    this.stopReading();
    this.isReading = true;
    
    const story = PHONICS_STORIES[this.activeStoryIndex];
    let wordIdx = 0;

    const readNextWord = () => {
      if (!this.isReading || wordIdx >= story.words.length) {
        this.stopReading();
        // Dispatch completed event
        this.dispatchEvent(new CustomEvent('story-read-completed', {
          detail: { story },
          bubbles: true,
          composed: true
        }));
        return;
      }

      const word = story.words[wordIdx];
      this.activeWordIndex = wordIdx;

      // Handle punctuation
      const isPunc = /^[.,\/#!$%\^&\*;:{}=\-_`~()]$/.test(word);
      if (isPunc) {
        wordIdx++;
        setTimeout(readNextWord, 100);
        return;
      }

      this.currentUtterance = new SpeechSynthesisUtterance(word);
      this.currentUtterance.rate = 0.85;
      
      const voices = this.synthesis.getVoices();
      const friendlyVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                          voices.find(v => v.lang.startsWith('en'));
      if (friendlyVoice) {
        this.currentUtterance.voice = friendlyVoice;
      }

      this.currentUtterance.onend = () => {
        wordIdx++;
        // Tiny pause between words for young learners
        setTimeout(readNextWord, 150);
      };

      this.currentUtterance.onerror = () => {
        this.stopReading();
      };

      this.synthesis.speak(this.currentUtterance);
    };

    readNextWord();
  }

  private stopReading() {
    this.isReading = false;
    this.activeWordIndex = -1;
    this.synthesis.cancel();
    if (this.currentUtterance) {
      this.currentUtterance.onend = null;
      this.currentUtterance = null;
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopReading();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phonics-room': PhonicsRoom;
  }
}
