import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { MessageProcessor, SurfaceModel } from '@a2ui/web_core/v0_9';
import { basicCatalog } from '@a2ui/lit/v0_9';
import '@a2ui/lit/v0_9'; // Triggers custom element registration for <a2ui-surface>

@customElement('agent-tutor')
export class AgentTutor extends LitElement {
  @state() private surface: SurfaceModel | null = null;
  @state() private messageLogs: string[] = [];
  @state() private showLogs = false;

  private processor: MessageProcessor<any>;
  private surfaceId = 'tutor-surface';

  constructor() {
    super();
    // Initialize MessageProcessor with the basic catalog
    this.processor = new MessageProcessor([basicCatalog]);
    
    // Initialize the Surface
    this.initSurface();
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .tutor-panel {
      background-color: var(--bg-card);
      border-radius: var(--radius-lg);
      padding: 24px;
      border: 2px solid var(--border-color);
      box-shadow: var(--shadow-soft);
      display: flex;
      flex-direction: column;
      gap: 20px;
      height: 100%;
    }

    .tutor-header {
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 2px dashed var(--border-color);
      padding-bottom: 16px;
    }

    .avatar-container {
      position: relative;
    }

    .avatar {
      font-size: 2.5rem;
      background-color: var(--color-primary-light);
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 99px;
      border: 2px solid var(--color-primary);
    }

    .status-dot {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background-color: var(--color-accent);
      border: 2px solid var(--bg-card);
      border-radius: 99px;
    }

    .tutor-info h3 {
      font-size: 1.25rem;
      color: var(--text-main);
    }

    .tutor-info span {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    /* A2UI Surface Area styles override */
    .surface-wrapper {
      flex: 1;
      min-height: 250px;
      background-color: var(--bg-app);
      border-radius: var(--radius-md);
      border: 2px dashed var(--border-color);
      padding: 16px;
      overflow-y: auto;
    }

    a2ui-surface {
      display: block;
      width: 100%;
    }

    /* Customize standard A2UI components rendered on the surface */
    a2ui-surface::part(card) {
      background-color: var(--bg-card);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
    }

    /* Developer Debug Panel */
    .dev-logs {
      border-top: 1px solid var(--border-color);
      padding-top: 16px;
    }

    .logs-toggle {
      font-size: 0.8rem;
      color: var(--color-primary);
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      justify-content: space-between;
    }

    .logs-container {
      background-color: hsl(215, 25%, 11%);
      color: hsl(150, 65%, 50%);
      padding: 12px;
      border-radius: var(--radius-sm);
      font-family: monospace;
      font-size: 0.75rem;
      max-height: 200px;
      overflow-y: auto;
      margin-top: 10px;
      white-space: pre-wrap;
      border: 1px solid hsl(215, 25%, 22%);
    }

    .log-entry {
      border-bottom: 1px solid hsl(215, 25%, 18%);
      padding: 6px 0;
    }
    
    .log-entry:last-child {
      border: none;
    }
  `;

  render() {
    return html`
      <div class="tutor-panel">
        <div class="tutor-header">
          <div class="avatar-container">
            <div class="avatar">🦉</div>
            <div class="status-dot"></div>
          </div>
          <div class="tutor-info">
            <h3>Toby the Phonics Tutor</h3>
            <span>Agent-to-User Interface (A2UI)</span>
          </div>
        </div>

        <div class="surface-wrapper">
          <a2ui-surface .surface=${this.surface}></a2ui-surface>
        </div>

        <!-- Dev logs for checking A2UI JSON payloads -->
        <div class="dev-logs">
          <button class="logs-toggle" @click=${() => this.showLogs = !this.showLogs}>
            <span>🛠️ Developer Console (Inspect A2UI JSON Messages)</span>
            <span>${this.showLogs ? '▲' : '▼'}</span>
          </button>
          ${this.showLogs ? html`
            <div class="logs-container">
              ${this.messageLogs.map(log => html`
                <div class="log-entry">${log}</div>
              `)}
              ${this.messageLogs.length === 0 ? 'No messages received yet.' : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private initSurface() {
    // 1. Create Surface message
    const createMessage = {
      createSurface: {
        surfaceId: this.surfaceId,
        catalogId: basicCatalog.id,
        theme: {
          primaryColor: '#3b82f6',
          borderRadius: '16px'
        }
      }
    };

    this.processMessage(createMessage);
    this.surface = this.processor.model.getSurface(this.surfaceId) || null;

    // 2. Load Greeting Component Tree
    this.sendGreeting();
  }

  private processMessage(message: any) {
    // Log the message stringified for developer debugging
    const log = JSON.stringify(message, null, 2);
    this.messageLogs = [log, ...this.messageLogs];
    
    // Process using web_core
    this.processor.processMessages([message]);
    this.requestUpdate();
  }

  // --- Agent Streaming States / Responses ---

  public sendGreeting() {
    const message = {
      updateComponents: {
        surfaceId: this.surfaceId,
        components: [
          {
            id: 'root',
            component: 'Column',
            children: ['greeting-card']
          },
          {
            id: 'greeting-card',
            component: 'Card',
            child: 'greeting-content'
          },
          {
            id: 'greeting-content',
            component: 'Column',
            children: ['greeting-text', 'tutor-hint']
          },
          {
            id: 'greeting-text',
            component: 'Text',
            text: 'Hello there, little reader! 👋 I am **Toby**, your AI phonics tutor. Choose a story, and we will learn the letter sounds together!',
            variant: 'body'
          },
          {
            id: 'tutor-hint',
            component: 'Text',
            text: '💡 *Tip: Try clicking words in the story to hear how they are read aloud!*',
            variant: 'caption'
          }
        ]
      }
    };
    this.processMessage(message);
  }

  public handleStoryChange(storyTitle: string, targetSound: string) {
    const message = {
      updateComponents: {
        surfaceId: this.surfaceId,
        components: [
          {
            id: 'root',
            component: 'Column',
            children: ['story-alert']
          },
          {
            id: 'story-alert',
            component: 'Card',
            child: 'alert-content'
          },
          {
            id: 'alert-content',
            component: 'Column',
            children: ['alert-title', 'alert-desc', 'start-prompt']
          },
          {
            id: 'alert-title',
            component: 'Text',
            text: `📖 New Story: ${storyTitle}`,
            variant: 'h3'
          },
          {
            id: 'alert-desc',
            component: 'Text',
            text: `Let\'s look for words focusing on the **${targetSound}** sound.`,
            variant: 'body'
          },
          {
            id: 'start-prompt',
            component: 'Text',
            text: '👇 Start clicking words in the story canvas to search for the hidden sounds!',
            variant: 'caption'
          }
        ]
      }
    };
    this.processMessage(message);
  }

  public handleWordClick(word: string, isTarget: boolean, targetSound: string) {
    const wordClean = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    
    let detailText = `The word **"${wordClean}"** has other sounds. Try to find a word that has the **${targetSound}** sound!`;
    let titleText = `🔊 Listening: "${wordClean}"`;
    let children = ['click-title', 'click-desc'];

    if (isTarget) {
      titleText = `⭐ Awesome Match! ⭐`;
      detailText = `You clicked **"${wordClean}"**! Great job. That matches our **${targetSound}** focus sound!`;
    }

    const message = {
      updateComponents: {
        surfaceId: this.surfaceId,
        components: [
          {
            id: 'root',
            component: 'Column',
            children: ['click-card']
          },
          {
            id: 'click-card',
            component: 'Card',
            child: 'click-content'
          },
          {
            id: 'click-content',
            component: 'Column',
            children: children
          },
          {
            id: 'click-title',
            component: 'Text',
            text: titleText,
            variant: 'h3'
          },
          {
            id: 'click-desc',
            component: 'Text',
            text: detailText,
            variant: 'body'
          }
        ]
      }
    };
    this.processMessage(message);
  }

  public handleHuntCompleted(storyTitle: string) {
    const message = {
      updateComponents: {
        surfaceId: this.surfaceId,
        components: [
          {
            id: 'root',
            component: 'Column',
            children: ['badge-card']
          },
          {
            id: 'badge-card',
            component: 'Card',
            child: 'badge-content'
          },
          {
            id: 'badge-content',
            component: 'Column',
            children: ['badge-medal', 'badge-title', 'badge-desc']
          },
          {
            id: 'badge-medal',
            component: 'Text',
            text: '🏆🥇🌟',
            variant: 'h1'
          },
          {
            id: 'badge-title',
            component: 'Text',
            text: 'Sound Master Badge Earned!',
            variant: 'h2'
          },
          {
            id: 'badge-desc',
            component: 'Text',
            text: `Congratulations! You found all the sound focus words in **"${storyTitle}"**! Toby is very proud of you! Keep up the amazing work!`,
            variant: 'body'
          }
        ]
      }
    };
    this.processMessage(message);
  }

  public handleWritingUpdate(text: string, phonicsCount: number) {
    if (!text.trim()) {
      this.sendGreeting();
      return;
    }

    let feedback = 'I see you are typing. Try using some words containing our target sounds!';
    let header = '✍️ Writing in Progress';

    if (phonicsCount > 0) {
      header = '🌟 Incredible Storyteller!';
      feedback = `You wrote **${phonicsCount}** focus sound words! That is superb! Let's write even more stories.`;
    }

    const message = {
      updateComponents: {
        surfaceId: this.surfaceId,
        components: [
          {
            id: 'root',
            component: 'Column',
            children: ['write-card']
          },
          {
            id: 'write-card',
            component: 'Card',
            child: 'write-content'
          },
          {
            id: 'write-content',
            component: 'Column',
            children: ['write-header', 'write-desc']
          },
          {
            id: 'write-header',
            component: 'Text',
            text: header,
            variant: 'h3'
          },
          {
            id: 'write-desc',
            component: 'Text',
            text: feedback,
            variant: 'body'
          }
        ]
      }
    };
    this.processMessage(message);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'agent-tutor': AgentTutor;
  }
}
