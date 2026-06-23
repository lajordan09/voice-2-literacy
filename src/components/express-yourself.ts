import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('express-yourself')
export class ExpressYourself extends LitElement {
  @state() private text = '';
  @state() private isListening = false;
  @state() private targetSound = 'Short O & F';
  @state() private activeStoryId = 'fox';
  
  // Real-time phonics trackers
  @state() private phonicsCount = 0;
  @state() private phonicsList: string[] = [];

  private recognition: any = null;
  private synthesis = window.speechSynthesis;

  constructor() {
    super();
    this.initSpeechRecognition();
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .express-card {
      background-color: var(--bg-card);
      border-radius: var(--radius-lg);
      padding: 32px;
      border: 2px solid var(--border-color);
      box-shadow: var(--shadow-soft);
      display: flex;
      flex-direction: column;
      gap: 20px;
      position: relative;
      overflow: hidden;
    }

    .express-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, var(--color-accent), var(--color-warning), var(--color-danger));
    }

    .header-group h2 {
      font-size: 1.75rem;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header-group p {
      font-size: 0.95rem;
      color: var(--text-muted);
      margin-top: 4px;
    }

    /* Writing Area Canvas */
    .writing-canvas-container {
      position: relative;
      width: 100%;
    }

    .writing-textarea {
      width: 100%;
      height: 200px;
      border-radius: var(--radius-md);
      padding: 20px;
      font-size: 1.35rem;
      font-family: var(--font-body);
      line-height: 1.6;
      resize: none;
      border: 2px solid var(--border-color);
      background-color: var(--bg-app);
      color: var(--text-main);
    }

    .writing-textarea::placeholder {
      color: var(--text-muted);
      opacity: 0.6;
    }

    /* Dictation Overlay indicator */
    .listening-overlay {
      position: absolute;
      top: 12px;
      right: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: var(--color-danger);
      color: white;
      padding: 6px 12px;
      border-radius: 99px;
      font-size: 0.8rem;
      font-weight: bold;
      animation: pulse 1.5s infinite ease-in-out;
    }

    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; transform: scale(1.03); }
      100% { opacity: 0.6; }
    }

    /* Toolbar controls */
    .canvas-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .btn-voice {
      background-color: var(--color-danger);
      color: white;
      padding: 12px 24px;
      border-radius: 99px;
      font-size: 1.05rem;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
    }

    .btn-voice:hover {
      background-color: hsl(350, 85%, 50%);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(239, 68, 68, 0.35);
    }

    .btn-voice.listening {
      background-color: var(--color-accent);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
    }

    .btn-voice.listening:hover {
      background-color: hsl(150, 65%, 40%);
    }

    .btn-secondary {
      background-color: var(--bg-app);
      border: 2px solid var(--border-color);
      color: var(--text-main);
      padding: 12px 20px;
      border-radius: 99px;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-secondary:hover {
      background-color: var(--border-color);
      transform: translateY(-1px);
    }

    /* Phonics Reward Checkbox list */
    .phonics-milestones {
      background-color: var(--color-primary-light);
      border: 2px dashed var(--color-primary);
      border-radius: var(--radius-md);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .milestone-title {
      font-family: var(--font-heading);
      color: var(--color-primary-dark);
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .badges-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .badge-item {
      font-family: var(--font-heading);
      background-color: var(--bg-card);
      border: 2px solid var(--border-color);
      border-radius: 99px;
      padding: 6px 12px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.3s ease;
    }

    .badge-item.active {
      border-color: var(--color-warning);
      background-color: var(--color-primary-light);
      color: var(--color-primary-dark);
      transform: scale(1.05);
      box-shadow: var(--shadow-bounce);
    }
  `;

  render() {
    return html`
      <div class="express-card">
        <div class="header-group">
          <h2>✍️ Express Yourself</h2>
          <p>Type your own story, or press "Voice Type" to speak directly to the screen!</p>
        </div>

        <div class="writing-canvas-container">
          <textarea
            class="writing-textarea"
            .value=${this.text}
            @input=${this.onTextInput}
            placeholder="Once upon a time, a friendly fox saw a big red bus..."
          ></textarea>
          
          ${this.isListening ? html`
            <div class="listening-overlay">
              🔴 Listening...
            </div>
          ` : ''}
        </div>

        <div class="canvas-actions">
          <button 
            class="btn-voice ${this.isListening ? 'listening' : ''}" 
            @click=${this.toggleListening}
          >
            🎤 ${this.isListening ? 'Done Speaking' : 'Voice Type'}
          </button>
          
          <button class="btn-secondary" @click=${this.speakCanvasText}>
            🔊 Read Aloud
          </button>

          <button class="btn-secondary" @click=${this.clearCanvas}>
            🗑️ Clear
          </button>
        </div>

        <!-- Phonics analysis of student's writing -->
        <div class="phonics-milestones">
          <div class="milestone-title">
            <span>✨</span> Phonics Target Tracker (${this.targetSound})
          </div>
          <p>
            You wrote <strong>${this.phonicsCount}</strong> target sound words in your text!
          </p>
          <div class="badges-list">
            ${this.phonicsList.map(word => html`
              <div class="badge-item active">
                ⭐ ${word}
              </div>
            `)}
            ${this.phonicsCount === 0 ? html`
              <div class="badge-item" style="opacity: 0.6;">
                Write words with the sound target to earn stars!
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // Update target when story changes
  setPhonicsTarget(storyId: string, targetSound: string) {
    this.activeStoryId = storyId;
    this.targetSound = targetSound;
    this.checkPhonics(this.text);
  }

  private initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          // Append transcription
          this.text = (this.text + ' ' + finalTranscript).trim();
          this.checkPhonics(this.text);
          this.dispatchWritingEvent();
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    }
  }

  private toggleListening() {
    if (!this.recognition) {
      alert("Voice typing is not supported in this browser. Please try Chrome or Safari.");
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    } else {
      this.isListening = true;
      this.recognition.start();
    }
  }

  private onTextInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    this.text = target.value;
    this.checkPhonics(this.text);
    this.dispatchWritingEvent();
  }

  private clearCanvas() {
    this.text = '';
    this.phonicsCount = 0;
    this.phonicsList = [];
    this.dispatchWritingEvent();
  }

  private speakCanvasText() {
    this.synthesis.cancel();
    if (!this.text) return;
    
    const utterance = new SpeechSynthesisUtterance(this.text);
    utterance.rate = 0.9;
    
    const voices = this.synthesis.getVoices();
    const friendlyVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                        voices.find(v => v.lang.startsWith('en'));
    if (friendlyVoice) {
      utterance.voice = friendlyVoice;
    }
    
    this.synthesis.speak(utterance);
  }

  private checkPhonics(inputText: string) {
    const words = inputText.toLowerCase().split(/\s+/);
    const matches: string[] = [];
    
    words.forEach(word => {
      const cleaned = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      if (cleaned && this.isWordTargetSound(cleaned)) {
        if (!matches.includes(cleaned)) {
          matches.push(cleaned);
        }
      }
    });

    const oldLength = this.phonicsList.length;
    this.phonicsCount = matches.length;
    this.phonicsList = matches;

    // Celebrate new match
    if (matches.length > oldLength) {
      this.dispatchEvent(new CustomEvent('milestone-reached', {
        detail: { 
          word: matches[matches.length - 1],
          count: matches.length
        },
        bubbles: true,
        composed: true
      }));
    }
  }

  private isWordTargetSound(word: string): boolean {
    if (this.activeStoryId === 'fox') {
      return word.startsWith('f') || word.includes('o');
    } else if (this.activeStoryId === 'cat') {
      return word.includes('a') && !word.includes('aw');
    } else if (this.activeStoryId === 'bus') {
      return word.startsWith('b') || word.includes('u');
    }
    return false;
  }

  private dispatchWritingEvent() {
    this.dispatchEvent(new CustomEvent('writing-updated', {
      detail: { text: this.text },
      bubbles: true,
      composed: true
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'express-yourself': ExpressYourself;
  }
}
