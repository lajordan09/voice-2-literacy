import { LitElement, css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';

// Import our custom components
import './components/phonics-room';
import './components/express-yourself';
import './components/agent-tutor';

import { PhonicsRoom } from './components/phonics-room';
import { ExpressYourself } from './components/express-yourself';
import { AgentTutor } from './components/agent-tutor';

@customElement('my-element')
export class MyElement extends LitElement {
  @query('phonics-room') private phonicsRoom!: PhonicsRoom;
  @query('express-yourself') private expressYourself!: ExpressYourself;
  @query('agent-tutor') private agentTutor!: AgentTutor;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding: 24px;
      gap: 24px;
      box-sizing: border-box;
    }

    /* App Header */
    .app-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background-color: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 2px solid var(--border-color);
      box-shadow: var(--shadow-soft);
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo-emoji {
      font-size: 2.25rem;
      animation: wiggle 2s infinite ease-in-out;
    }

    @keyframes wiggle {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(10deg); }
    }

    .brand-info h1 {
      font-size: 1.75rem;
      color: var(--color-primary-dark);
      margin: 0;
    }

    .brand-info p {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin: 0;
    }

    /* Theme Mode Indicator */
    .theme-badge {
      font-size: 0.85rem;
      padding: 8px 16px;
      background-color: var(--bg-app);
      border-radius: 99px;
      border: 2px solid var(--border-color);
      font-family: var(--font-heading);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Dashboard Layout Grid */
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 24px;
      flex: 1;
    }

    @media (max-width: 1100px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }

    .workspace-pane {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Footer links */
    .app-footer {
      text-align: center;
      padding: 16px;
      font-size: 0.85rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border-color);
      margin-top: auto;
    }
  `;

  render() {
    return html`
      <!-- Top Header -->
      <header class="app-header">
        <div class="brand-logo">
          <div class="brand-logo-emoji">🌈</div>
          <div class="brand-info">
            <h1>Voice 2 Literacy</h1>
            <p>Interactive Elementary Phonics Reading Room</p>
          </div>
        </div>

        <div class="theme-badge">
          🎨 Kid-Friendly Theme Active
        </div>
      </header>

      <!-- Dashboard Grid -->
      <main class="dashboard-grid">
        <!-- Workspace Panel (Stories & Writing Canvas) -->
        <div class="workspace-pane">
          <!-- Story Room Component -->
          <phonics-room
            @story-changed=${this.onStoryChanged}
            @sound-found=${this.onSoundFound}
            @story-read-completed=${this.onStoryReadCompleted}
          ></phonics-room>

          <!-- Writing Canvas Component -->
          <express-yourself
            @writing-updated=${this.onWritingUpdated}
            @milestone-reached=${this.onMilestoneReached}
          ></express-yourself>
        </div>

        <!-- AI Tutor Component (A2UI Surface) -->
        <div class="tutor-pane">
          <agent-tutor></agent-tutor>
        </div>
      </main>

      <!-- Footer -->
      <footer class="app-footer">
        © 2026 Voice 2 Literacy - Built with Lit & Google A2UI (Agent-to-User Interface)
      </footer>
    `;
  }

  // --- Dashboard Event Handlers ---

  private onStoryChanged(e: CustomEvent) {
    const { story } = e.detail;
    if (this.expressYourself) {
      this.expressYourself.setPhonicsTarget(story.id, story.targetSound);
    }
    if (this.agentTutor) {
      this.agentTutor.handleStoryChange(story.title, story.targetSound);
    }
  }

  private onSoundFound(e: CustomEvent) {
    const { word, isCompleted } = e.detail;
    
    // Notify Toby
    if (this.agentTutor && this.phonicsRoom) {
      const activeStory = this.phonicsRoom.currentStoryIndex;
      const targetSound = this.phonicsRoom.stories[activeStory].targetSound;
        
      if (isCompleted) {
        const title = this.phonicsRoom.stories[activeStory].title;
        this.agentTutor.handleHuntCompleted(title);
      } else {
        this.agentTutor.handleWordClick(word, true, targetSound);
      }
    }
  }

  private onStoryReadCompleted(e: CustomEvent) {
    const { story } = e.detail;
    if (this.agentTutor) {
      this.agentTutor.handleWritingUpdate(
        `Let's write a story about ${story.title}!`,
        0
      );
    }
  }

  private onWritingUpdated(e: CustomEvent) {
    const { text } = e.detail;
    if (this.agentTutor) {
      // Calculate how many phonics words are written
      const phonicsCount = this.expressYourself ? (this.expressYourself as any).phonicsCount : 0;
      this.agentTutor.handleWritingUpdate(text, phonicsCount);
    }
  }

  private onMilestoneReached(e: CustomEvent) {
    const { word } = e.detail;
    if (this.agentTutor) {
      const targetSound = this.expressYourself ? (this.expressYourself as any).targetSound : 'target sound';
      this.agentTutor.handleWordClick(word, true, targetSound);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement;
  }
}
