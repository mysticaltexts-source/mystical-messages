// ==========================================
// MYSTICAL MESSAGES - FRONTEND APPLICATION
// ==========================================

// ─── XSS Prevention: HTML Escape Utility ─────────────────────────────────────
/**
 * Escape user-supplied strings before inserting into innerHTML.
 * Always wrap any data from the server / user input with esc() before
 * interpolating into HTML template literals.
 */
function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#x27;')
        .replace(/`/g, '&#x60;');
}

// API Helper
const API = {
    async get(url) {
        const response = await fetch(url, { credentials: 'same-origin' });
        if (response.status === 401 || response.redirected) {
            window.location.href = '/auth/login';
            throw new Error('Not authenticated');
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            window.location.href = '/auth/login';
            throw new Error('Not authenticated');
        }
        return response.json();
    },
    
    async post(url, data) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'same-origin'
        });
        if (response.status === 401) {
            window.location.href = '/auth/login';
            throw new Error('Not authenticated');
        }
        return response.json();
    },
    
    async put(url, data) {
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'same-origin'
        });
        if (response.status === 401) {
            window.location.href = '/auth/login';
            throw new Error('Not authenticated');
        }
        return response.json();
    },
    
    async delete(url) {
        const response = await fetch(url, { method: 'DELETE', credentials: 'same-origin' });
        if (response.status === 401) {
            window.location.href = '/auth/login';
            throw new Error('Not authenticated');
        }
        return response.json();
    }
};

// Toast Notifications
const Toast = {
    container: null,
    
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'success') {
        this.init();
        const toast = document.createElement('div');
        toast.className = `toast toast-${esc(type)}`;
        // Use textContent — never innerHTML — for user-visible messages
        toast.textContent = message;
        this.container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    },
    
    success(message) {
        this.show(message, 'success');
    },
    
    error(message) {
        this.show(message, 'error');
    }
};

// Loading State
const Loading = {
    overlay: null,
    
    show(message = 'Loading...') {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'loading-overlay';

            const spinner = document.createElement('div');
            spinner.className = 'spinner';

            const text = document.createElement('div');
            text.className = 'loading-text';
            // Use textContent — never innerHTML — for the message
            text.textContent = message;

            this.overlay.appendChild(spinner);
            this.overlay.appendChild(text);
        } else {
            // Update text safely if overlay already exists
            const textEl = this.overlay.querySelector('.loading-text');
            if (textEl) textEl.textContent = message;
        }
        document.body.appendChild(this.overlay);
    },
    
    hide() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
    }
};

// Modal
const Modal = {
    /**
     * Show a modal. `content` must be a SAFE HTML string (only use esc()
     * on any user-controlled values before passing here).
     */
    show(content) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';

        const inner = document.createElement('div');
        inner.className = 'modal-content';
        // content is expected to be safe HTML assembled by our own code
        // All user-controlled values inside content must use esc() at the call site
        inner.innerHTML = content;

        overlay.appendChild(inner);
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });
        
        return overlay;
    },
    
    close() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
    }
};

// Character Selection Component
class CharacterSelector {
    constructor(container, options = {}) {
        this.container = container;
        this.selectedCharacters = options.selected || [];
        this.onSelect = options.onSelect || (() => {});
        this.init();
    }
    
    async init() {
        try {
            const { characters } = await API.get('/characters');
            this.characters = characters;
            this.render();
        } catch (error) {
            console.error('Failed to load characters:', error);
        }
    }
    
    render() {
        this.container.innerHTML = `
            <div class="character-grid">
                ${this.characters.map(char => `
                    <div class="character-card ${this.selectedCharacters.includes(char.id) ? 'selected' : ''} ${char.is_premium ? 'premium' : ''}" 
                         data-id="${esc(char.id)}">
                        <div class="character-avatar ${esc(char.name.replace('_', '-'))}">
                            ${esc(this.getCharacterEmoji(char.name))}
                        </div>
                        <div class="character-name">${esc(char.display_name)}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        this.container.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => this.toggleCharacter(card.dataset.id));
        });
    }
    
    getCharacterEmoji(name) {
        const emojis = {
            'santa_claus': '🎅',
            'tooth_fairy': '🧚',
            'easter_bunny': '🐰',
            'custom': '⭐'
        };
        return emojis[name] || '✨';
    }
    
    toggleCharacter(id) {
        const idNum = parseInt(id);
        const index = this.selectedCharacters.indexOf(idNum);
        
        if (index === -1) {
            this.selectedCharacters.push(idNum);
        } else {
            this.selectedCharacters.splice(index, 1);
        }
        
        this.render();
        this.onSelect(this.selectedCharacters);
    }
    
    getSelected() {
        return this.selectedCharacters;
    }
}

// Message Builder Component
class MessageBuilder {
    constructor(container, options = {}) {
        this.container = container;
        this.mode = options.mode || 'preset'; // 'preset' or 'custom'
        this.characterId = options.characterId || null;
        this.childName = options.childName || '';
        this.onPreview = options.onPreview || (() => {});
        this.init();
    }
    
    async init() {
        const { templates, characters, children } = await API.get('/messages/create/data');
        this.templates = templates;
        this.characters = characters;
        this.children = children;
        this.render();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="card">
                <div class="tabs">
                    <div class="tab ${this.mode === 'preset' ? 'active' : ''}" data-mode="preset">
                        Quick Preset
                    </div>
                    <div class="tab ${this.mode === 'custom' ? 'active' : ''}" data-mode="custom">
                        Custom Message
                    </div>
                </div>
                
                <div class="form-group mt-2">
                    <label class="form-label">Select Character</label>
                    <select class="form-select" id="character-select">
                        <option value="">Choose a character...</option>
                        ${this.characters.map(char => `
                            <option value="${esc(char.id)}" ${this.characterId === char.id ? 'selected' : ''}>
                                ${esc(char.display_name)}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Child's Name</label>
                    <input type="text" class="form-input" id="child-name" 
                           placeholder="Enter child's name" value="${esc(this.childName)}">
                </div>
                
                ${this.mode === 'preset' ? this.renderPresetMode() : this.renderCustomMode()}
            </div>
        `;
        
        this.attachEvents();
    }
    
    renderPresetMode() {
        const filteredTemplates = this.characterId 
            ? this.templates.filter(t => t.character_id === this.characterId)
            : this.templates;
            
        return `
            <div class="form-group">
                <label class="form-label">Select Template</label>
                <select class="form-select" id="template-select">
                    <option value="">Choose a template...</option>
                    ${filteredTemplates.map(template => `
                        <option value="${esc(template.id)}">${esc(template.title)}</option>
                    `).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Preview</label>
                <div class="message-preview" id="message-preview">
                    <p class="text-center" style="color: var(--text-light);">
                        Select a template to preview
                    </p>
                </div>
            </div>
        `;
    }
    
    renderCustomMode() {
        return `
            <div class="form-group">
                <label class="form-label">Your Message (from child)</label>
                <textarea class="form-input form-textarea" id="outgoing-message" 
                          placeholder="What will your child say? (optional)"></textarea>
            </div>
            
            <div class="form-group">
                <label class="form-label">Character's Response</label>
                <textarea class="form-input form-textarea" id="response-message" 
                          placeholder="What should the character say?"></textarea>
                <p class="form-helper">Use {child_name} to personalize with the child's name</p>
            </div>
        `;
    }
    
    attachEvents() {
        // Tab switching
        this.container.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.mode = tab.dataset.mode;
                this.render();
            });
        });
        
        // Character selection
        const charSelect = this.container.querySelector('#character-select');
        if (charSelect) {
            charSelect.addEventListener('change', (e) => {
                this.characterId = parseInt(e.target.value) || null;
                if (this.mode === 'preset') {
                    this.render();
                }
            });
        }
        
        // Template selection (preset mode)
        const templateSelect = this.container.querySelector('#template-select');
        if (templateSelect) {
            templateSelect.addEventListener('change', (e) => {
                this.updatePreview(parseInt(e.target.value));
            });
        }
    }
    
    updatePreview(templateId) {
        const preview = this.container.querySelector('#message-preview');
        const template = this.templates.find(t => t.id === templateId);
        const childName = this.container.querySelector('#child-name')?.value || 'little one';
        
        if (template && preview) {
            // Replace placeholders with escaped child name to prevent XSS
            let content = esc(template.content)
                .replace(/\{child_name\}/g, esc(childName))
                .replace(/\{behavior\}/g, 'good')
                .replace(/\{encouragement\}/g, 'great work');
            
            preview.innerHTML = `
                <div class="message-bubble incoming">
                    ${content}
                    <div class="message-meta">${esc(template.tone)} tone</div>
                </div>
            `;
        }
    }
    
    getData() {
        const childName = this.container.querySelector('#child-name')?.value || '';
        
        if (this.mode === 'preset') {
            const templateId = this.container.querySelector('#template-select')?.value;
            const template = this.templates.find(t => t.id === parseInt(templateId));
            
            return {
                characterId: this.characterId,
                childName,
                responseMessage: template?.content,
                scenarioType: template?.scenario_type,
                tone: template?.tone
            };
        } else {
            return {
                characterId: this.characterId,
                childName,
                outgoingMessage: this.container.querySelector('#outgoing-message')?.value,
                responseMessage: this.container.querySelector('#response-message')?.value,
                scenarioType: 'custom',
                tone: 'playful'
            };
        }
    }
}

// Scheduling Component
class MessageScheduler {
    constructor(container, options = {}) {
        this.container = container;
        this.sendMode = 'immediate';
        this.onSchedule = options.onSchedule || (() => {});
        this.render();
    }
    
    render() {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30);
        const defaultTime = now.toISOString().slice(0, 16);
        
        this.container.innerHTML = `
            <div class="card">
                <h4 class="card-title">When should we send it?</h4>
                
                <div class="quick-actions mt-2">
                    <div class="quick-action-btn ${this.sendMode === 'immediate' ? 'selected' : ''}" data-mode="immediate">
                        <div class="quick-action-icon">⚡</div>
                        <div class="quick-action-content">
                            <div class="quick-action-title">Send Now</div>
                            <div class="quick-action-desc">Deliver immediately</div>
                        </div>
                    </div>
                    
                    <div class="quick-action-btn ${this.sendMode === 'delayed' ? 'selected' : ''}" data-mode="delayed">
                        <div class="quick-action-icon">⏱️</div>
                        <div class="quick-action-content">
                            <div class="quick-action-title">With Delay</div>
                            <div class="quick-action-desc">Add realistic delay</div>
                        </div>
                    </div>
                    
                    <div class="quick-action-btn ${this.sendMode === 'scheduled' ? 'selected' : ''}" data-mode="scheduled">
                        <div class="quick-action-icon">📅</div>
                        <div class="quick-action-content">
                            <div class="quick-action-title">Schedule</div>
                            <div class="quick-action-desc">Pick a specific time</div>
                        </div>
                    </div>
                </div>
                
                <div id="schedule-options" class="mt-2 hidden">
                    ${this.renderScheduleOptions(esc(defaultTime))}
                </div>
            </div>
        `;
        
        this.attachEvents();
    }
    
    renderScheduleOptions(defaultTime) {
        if (this.sendMode === 'delayed') {
            return `
                <div class="form-group">
                    <label class="form-label">Delay (minutes)</label>
                    <select class="form-select" id="delay-select">
                        <option value="1">1 minute</option>
                        <option value="5">5 minutes</option>
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                    </select>
                </div>
            `;
        } else if (this.sendMode === 'scheduled') {
            return `
                <div class="form-group">
                    <label class="form-label">Schedule Date & Time</label>
                    <input type="datetime-local" class="form-input" id="schedule-time" 
                           value="${defaultTime}" min="${defaultTime}">
                </div>
            `;
        }
        return '';
    }
    
    attachEvents() {
        this.container.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.sendMode = btn.dataset.mode;
                this.render();
            });
        });
    }
    
    getData() {
        const data = { sendMode: this.sendMode };
        
        if (this.sendMode === 'delayed') {
            data.delayMinutes = parseInt(this.container.querySelector('#delay-select')?.value) || 1;
        } else if (this.sendMode === 'scheduled') {
            data.scheduledAt = this.container.querySelector('#schedule-time')?.value;
        }
        
        return data;
    }
}

// Dashboard Page
const Dashboard = {
    data: null,
    
    async init() {
        Loading.show('Loading your magical dashboard...');
        
        try {
            this.data = await API.get('/dashboard/data');
            Loading.hide();
            this.render();
        } catch (error) {
            Loading.hide();
            Toast.error('Failed to load dashboard');
            console.error(error);
        }
    },
    
    render() {
        const app = document.getElementById('app');
        
        // All user-controlled values wrapped in esc()
        app.innerHTML = `
            <div class="container pb-nav">
                <div class="header">
                    <div>
                        <div class="header-title">✨ Mystical Messages</div>
                        <div class="header-subtitle">Hello, ${esc(this.data.user.firstName || 'there')}!</div>
                    </div>
                    <a href="/auth/logout" class="btn btn-sm btn-secondary">Logout</a>
                </div>
                
                ${this.renderQuickActions()}
                
                ${this.renderSubscriptionBanner()}
                
                ${this.renderCharacters()}
                
                ${this.renderRecentConversations()}
                
                ${this.renderBottomNav()}
            </div>
        `;
        
        this.attachEvents();
    },
    
    renderQuickActions() {
        return `
            <div class="card">
                <h3 class="card-title">🚨 Oh Crap Button</h3>
                <p class="form-helper mb-2">Emergency moments solved instantly</p>
                
                <div class="quick-actions">
                    <button class="quick-action-btn" data-action="lost_tooth">
                        <div class="quick-action-icon">🦷</div>
                        <div class="quick-action-content">
                            <div class="quick-action-title">Lost Tooth Emergency</div>
                            <div class="quick-action-desc">Child lost a tooth and you're not prepared</div>
                        </div>
                    </button>
                    
                    <button class="quick-action-btn" data-action="santa_check">
                        <div class="quick-action-icon">🎅</div>
                        <div class="quick-action-content">
                            <div class="quick-action-title">Naughty/Nice Check</div>
                            <div class="quick-action-desc">Kid asking about Santa's list RIGHT NOW</div>
                        </div>
                    </button>
                    
                    <button class="quick-action-btn" data-action="easter_ready">
                        <div class="quick-action-icon">🐰</div>
                        <div class="quick-action-content">
                            <div class="quick-action-title">Easter Visit Alert</div>
                            <div class="quick-action-desc">Easter Bunny needs to send a message</div>
                        </div>
                    </button>
                    
                    <button class="quick-action-btn" data-action="gift_confirm">
                        <div class="quick-action-icon">🎁</div>
                        <div class="quick-action-content">
                            <div class="quick-action-title">Gift Confirmation</div>
                            <div class="quick-action-desc">Confirm a gift request was received</div>
                        </div>
                    </button>
                </div>
            </div>
        `;
    },
    
    renderSubscriptionBanner() {
        if (this.data.user.subscriptionTier === 'free') {
            return `
                <div class="card" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white;">
                    <h3>⭐ Upgrade to Premium</h3>
                    <p style="color: rgba(255,255,255,0.8); margin: 0.5rem 0;">Unlock all characters, custom messages & more!</p>
                    <a href="/subscriptions/plans" class="btn btn-magic" style="margin-top: 0.5rem;">
                        View Plans
                    </a>
                </div>
            `;
        }
        return '';
    },
    
    renderCharacters() {
        if (!this.data.characters || this.data.characters.length === 0) {
            return `
                <div class="card">
                    <h4 class="card-title">Your Characters</h4>
                    <p class="form-helper">No characters selected yet. 
                        <a href="/characters/select">Choose your characters</a>
                    </p>
                </div>
            `;
        }
        
        return `
            <div class="card">
                <h4 class="card-title">Your Characters</h4>
                <div class="character-grid" style="grid-template-columns: repeat(3, 1fr);">
                    ${this.data.characters.map(char => `
                        <div class="text-center">
                            <div class="character-avatar ${esc(char.name.replace('_', '-'))}" style="width: 48px; height: 48px; font-size: 1.5rem;">
                                ${esc(this.getCharacterEmoji(char.name))}
                            </div>
                            <div class="character-name" style="font-size: 0.75rem; margin-top: 0.25rem;">
                                ${esc(char.display_name)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },
    
    renderRecentConversations() {
        if (!this.data.conversations || this.data.conversations.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">💬</div>
                    <div class="empty-state-title">No messages yet</div>
                    <div class="empty-state-desc">Start your first magical conversation!</div>
                    <a href="/messages/create" class="btn btn-primary">
                        Create Message
                    </a>
                </div>
            `;
        }
        
        return `
            <div class="card">
                <h4 class="card-title">Recent Messages</h4>
                ${this.data.conversations.slice(0, 5).map(conv => `
                    <div class="quick-action-btn" style="margin-bottom: 0.5rem;">
                        <div class="quick-action-icon">${esc(this.getCharacterEmoji(conv.character_name))}</div>
                        <div class="quick-action-content">
                            <div class="quick-action-title">${esc(conv.character_name)}</div>
                            <div class="quick-action-desc">${esc(new Date(conv.created_at).toLocaleDateString())}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    renderBottomNav() {
        return `
            <nav class="nav-bottom">
                <div class="nav-item active">
                    <div class="nav-icon">🏠</div>
                    Home
                </div>
                <div class="nav-item" onclick="location.href='/messages/create'">
                    <div class="nav-icon">✨</div>
                    Create
                </div>
                <div class="nav-item" onclick="location.href='/messages/scripts'">
                    <div class="nav-icon">📝</div>
                    Scripts
                </div>
                <div class="nav-item" onclick="location.href='/dashboard/settings'">
                    <div class="nav-icon">⚙️</div>
                    Settings
                </div>
            </nav>
        `;
    },
    
    getCharacterEmoji(name) {
        const emojis = {
            'Santa Claus': '🎅',
            'Tooth Fairy': '🧚',
            'Easter Bunny': '🐰',
            'santa_claus': '🎅',
            'tooth_fairy': '🧚',
            'easter_bunny': '🐰',
            'custom': '⭐'
        };
        return emojis[name] || '✨';
    },
    
    attachEvents() {
        // Quick action buttons
        document.querySelectorAll('.quick-action-btn[data-action]').forEach(btn => {
            btn.addEventListener('click', () => this.handleQuickAction(btn.dataset.action));
        });
    },
    
    async handleQuickAction(actionId) {
        // Safe default child name from server data (escaped at render time)
        const defaultChildName = esc(this.data.children?.[0]?.name || '');

        Modal.show(`
            <div class="modal-header">
                <h3>Quick Send</h3>
                <button class="modal-close" onclick="Modal.close()">×</button>
            </div>
            
            <div class="form-group">
                <label class="form-label">Child's Name</label>
                <input type="text" class="form-input" id="quick-child-name" 
                       placeholder="Enter child's name" value="${defaultChildName}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Custom Message (optional)</label>
                <textarea class="form-input form-textarea" id="quick-custom-message" 
                          placeholder="Leave blank to use default message"></textarea>
            </div>
            
            <button class="btn btn-magic btn-block btn-lg" id="quick-send-btn">
                ✨ Send Magic Message
            </button>
        `);

        // Attach click event via DOM (not inline onclick with user data) to avoid XSS
        document.getElementById('quick-send-btn')?.addEventListener('click', () => {
            Dashboard.sendQuickMessage(actionId);
        });
    },
    
    async sendQuickMessage(actionId) {
        const childName = document.getElementById('quick-child-name')?.value;
        const customMessage = document.getElementById('quick-custom-message')?.value;
        
        Loading.show('Sending magical message...');
        
        try {
            const result = await API.post('/messages/quick-send', {
                actionId,
                childName,
                customMessage
            });
            
            Loading.hide();
            
            if (result.success) {
                Modal.close();
                Toast.success(result.message || 'Message sent!');
            } else {
                Toast.error(result.error || 'Failed to send message');
            }
        } catch (error) {
            Loading.hide();
            Toast.error('Failed to send message');
        }
    }
};

// Initialize based on page
document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    
    switch(page) {
        case 'signup':
            // Signup page specific logic
            break;
        case 'onboarding':
            // Onboarding page logic
            break;
    }
    // Note: dashboard init is handled inline in dashboard.html
});
