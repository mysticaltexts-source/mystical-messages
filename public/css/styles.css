/* ==========================================
   MYSTICAL MESSAGES - MOBILE-FIRST CSS
   ========================================== */

/* CSS Variables for theming */
:root {
    /* Colors */
    --primary-color: #6B46C1;
    --primary-dark: #553C9A;
    --primary-light: #9F7AEA;
    --secondary-color: #F687B3;
    --accent-color: #F6AD55;
    --success-color: #48BB78;
    --error-color: #F56565;
    --warning-color: #ED8936;
    
    /* Neutrals */
    --bg-color: #FAF5FF;
    --card-bg: #FFFFFF;
    --text-primary: #2D3748;
    --text-secondary: #718096;
    --text-light: #A0AEC0;
    --border-color: #E2E8F0;
    
    /* Magic colors per character */
    --santa-red: #C53030;
    --santa-green: #38A169;
    --tooth-fairy-pink: #ED64A6;
    --tooth-fairy-blue: #63B3ED;
    --easter-purple: #805AD5;
    --easter-yellow: #ECC94B;
    
    /* Shadows */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
    --shadow-magic: 0 4px 20px rgba(107, 70, 193, 0.2);
    
    /* Spacing */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    
    /* Border radius */
    --radius-sm: 0.375rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --radius-xl: 1rem;
    --radius-full: 9999px;
    
    /* Typography */
    --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-size-xs: 0.75rem;
    --font-size-sm: 0.875rem;
    --font-size-md: 1rem;
    --font-size-lg: 1.125rem;
    --font-size-xl: 1.25rem;
    --font-size-2xl: 1.5rem;
    --font-size-3xl: 1.875rem;
}

/* Reset & Base */
*, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

body {
    font-family: var(--font-family);
    background-color: var(--bg-color);
    color: var(--text-primary);
    line-height: 1.5;
    min-height: 100vh;
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    line-height: 1.25;
    color: var(--text-primary);
}

h1 { font-size: var(--font-size-3xl); }
h2 { font-size: var(--font-size-2xl); }
h3 { font-size: var(--font-size-xl); }
h4 { font-size: var(--font-size-lg); }

p {
    color: var(--text-secondary);
}

a {
    color: var(--primary-color);
    text-decoration: none;
    transition: color 0.2s;
}

a:hover {
    color: var(--primary-dark);
}

/* Container */
.container {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    padding: var(--spacing-md);
}

.container-fluid {
    width: 100%;
    padding: var(--spacing-md);
}

/* Cards */
.card {
    background: var(--card-bg);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-md);
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-md);
}

.card-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
}

/* Buttons */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-sm) var(--spacing-lg);
    font-size: var(--font-size-md);
    font-weight: 500;
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
    gap: var(--spacing-sm);
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-primary {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
    color: white;
    box-shadow: var(--shadow-md);
}

.btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--primary-dark), var(--primary-color));
    box-shadow: var(--shadow-lg);
    transform: translateY(-1px);
}

.btn-secondary {
    background: var(--card-bg);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
    background: var(--bg-color);
}

.btn-success {
    background: var(--success-color);
    color: white;
}

.btn-danger {
    background: var(--error-color);
    color: white;
}

.btn-block {
    width: 100%;
}

.btn-lg {
    padding: var(--spacing-md) var(--spacing-xl);
    font-size: var(--font-size-lg);
}

.btn-sm {
    padding: var(--spacing-xs) var(--spacing-md);
    font-size: var(--font-size-sm);
}

/* Magic button effect */
.btn-magic {
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
    position: relative;
    overflow: hidden;
}

.btn-magic::before {
    content: '✨';
    position: absolute;
    right: var(--spacing-md);
    opacity: 0.8;
}

/* Forms */
.form-group {
    margin-bottom: var(--spacing-lg);
}

.form-label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
}

.form-input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-md);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--card-bg);
    color: var(--text-primary);
    transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(107, 70, 193, 0.1);
}

.form-input::placeholder {
    color: var(--text-light);
}

.form-select {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-md);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--card-bg);
    color: var(--text-primary);
    cursor: pointer;
}

.form-textarea {
    min-height: 100px;
    resize: vertical;
}

.form-helper {
    font-size: var(--font-size-sm);
    color: var(--text-light);
    margin-top: var(--spacing-xs);
}

.form-error {
    color: var(--error-color);
    font-size: var(--font-size-sm);
    margin-top: var(--spacing-xs);
}

/* Character Selection */
.character-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
}

.character-card {
    background: var(--card-bg);
    border: 2px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
}

.character-card:hover {
    border-color: var(--primary-light);
    box-shadow: var(--shadow-magic);
}

.character-card.selected {
    border-color: var(--primary-color);
    background: linear-gradient(to bottom, rgba(107, 70, 193, 0.05), transparent);
}

.character-card.premium {
    position: relative;
}

.character-card.premium::after {
    content: '⭐ PREMIUM';
    position: absolute;
    top: var(--spacing-xs);
    right: var(--spacing-xs);
    background: var(--accent-color);
    color: white;
    font-size: var(--font-size-xs);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
}

.character-avatar {
    width: 64px;
    height: 64px;
    border-radius: var(--radius-full);
    margin: 0 auto var(--spacing-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
}

.character-avatar.santa {
    background: linear-gradient(135deg, var(--santa-red), #9B2C2C);
}

.character-avatar.tooth-fairy {
    background: linear-gradient(135deg, var(--tooth-fairy-pink), var(--tooth-fairy-blue));
}

.character-avatar.easter-bunny {
    background: linear-gradient(135deg, var(--easter-purple), var(--easter-yellow));
}

.character-avatar.custom {
    background: linear-gradient(135deg, var(--primary-light), var(--secondary-color));
}

.character-name {
    font-weight: 600;
    font-size: var(--font-size-sm);
}

/* Quick Action Buttons (Oh Crap Button) */
.quick-actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}

.quick-action-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: var(--spacing-md);
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
}

.quick-action-btn:hover {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-magic);
    transform: translateX(4px);
}

.quick-action-icon {
    font-size: 1.5rem;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-color);
    border-radius: var(--radius-md);
}

.quick-action-content {
    flex: 1;
}

.quick-action-title {
    font-weight: 600;
    font-size: var(--font-size-md);
}

.quick-action-desc {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
}

/* Message Preview */
.message-preview {
    background: var(--card-bg);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    border: 1px solid var(--border-color);
}

.message-bubble {
    padding: var(--spacing-md);
    border-radius: var(--radius-lg);
    margin-bottom: var(--spacing-sm);
    max-width: 85%;
}

.message-bubble.outgoing {
    background: var(--primary-light);
    color: white;
    margin-left: auto;
    border-bottom-right-radius: var(--spacing-xs);
}

.message-bubble.incoming {
    background: var(--bg-color);
    border-bottom-left-radius: var(--spacing-xs);
}

.message-meta {
    font-size: var(--font-size-xs);
    color: var(--text-light);
    margin-top: var(--spacing-xs);
}

/* Navigation */
.nav-bottom {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--card-bg);
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: space-around;
    padding: var(--spacing-sm) 0;
    z-index: 100;
}

.nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--spacing-xs) var(--spacing-md);
    color: var(--text-light);
    font-size: var(--font-size-xs);
    cursor: pointer;
    transition: color 0.2s;
}

.nav-item.active {
    color: var(--primary-color);
}

.nav-item:hover {
    color: var(--primary-color);
}

.nav-icon {
    font-size: 1.25rem;
    margin-bottom: var(--spacing-xs);
}

/* Header */
.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md) 0;
    margin-bottom: var(--spacing-lg);
}

.header-title {
    font-size: var(--font-size-xl);
    font-weight: 700;
}

.header-subtitle {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
}

/* Tabs */
.tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: var(--spacing-lg);
}

.tab {
    flex: 1;
    padding: var(--spacing-md);
    text-align: center;
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-secondary);
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
}

.tab.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
}

/* Badge */
.badge {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
    font-weight: 500;
    border-radius: var(--radius-full);
}

.badge-primary {
    background: rgba(107, 70, 193, 0.1);
    color: var(--primary-color);
}

.badge-success {
    background: rgba(72, 187, 120, 0.1);
    color: var(--success-color);
}

.badge-premium {
    background: linear-gradient(135deg, var(--accent-color), #DD6B20);
    color: white;
}

/* Pricing Cards */
.pricing-card {
    background: var(--card-bg);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    text-align: center;
    border: 2px solid var(--border-color);
    margin-bottom: var(--spacing-md);
}

.pricing-card.featured {
    border-color: var(--primary-color);
    position: relative;
}

.pricing-card.featured::before {
    content: 'MOST POPULAR';
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--primary-color);
    color: white;
    font-size: var(--font-size-xs);
    padding: var(--spacing-xs) var(--spacing-md);
    border-radius: var(--radius-full);
}

.pricing-tier {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--primary-color);
}

.pricing-price {
    font-size: var(--font-size-3xl);
    font-weight: 700;
    margin: var(--spacing-sm) 0;
}

.pricing-price span {
    font-size: var(--font-size-md);
    font-weight: 400;
    color: var(--text-secondary);
}

.pricing-features {
    list-style: none;
    margin: var(--spacing-lg) 0;
    text-align: left;
}

.pricing-features li {
    padding: var(--spacing-xs) 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-sm);
}

.pricing-features li::before {
    content: '✓';
    color: var(--success-color);
    font-weight: bold;
}

/* Modal */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 200;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s;
}

.modal-overlay.active {
    opacity: 1;
    visibility: visible;
}

.modal-content {
    background: var(--card-bg);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    padding: var(--spacing-xl);
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    transform: translateY(100%);
    transition: transform 0.3s;
}

.modal-overlay.active .modal-content {
    transform: translateY(0);
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-lg);
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--text-secondary);
    cursor: pointer;
}

/* Loading States */
.spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-color);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.loading-overlay {
    position: fixed;
    inset: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 300;
}

.loading-text {
    margin-top: var(--spacing-md);
    color: var(--text-secondary);
}

/* Toast Notifications */
.toast-container {
    position: fixed;
    top: var(--spacing-lg);
    left: 50%;
    transform: translateX(-50%);
    z-index: 400;
}

.toast {
    background: var(--card-bg);
    border-radius: var(--radius-md);
    padding: var(--spacing-md) var(--spacing-lg);
    box-shadow: var(--shadow-lg);
    margin-bottom: var(--spacing-sm);
    animation: slideIn 0.3s ease;
}

.toast-success {
    border-left: 4px solid var(--success-color);
}

.toast-error {
    border-left: 4px solid var(--error-color);
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Empty State */
.empty-state {
    text-align: center;
    padding: var(--spacing-xl);
}

.empty-state-icon {
    font-size: 3rem;
    margin-bottom: var(--spacing-md);
}

.empty-state-title {
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-sm);
}

.empty-state-desc {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-lg);
}

/* Utilities */
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.mt-0 { margin-top: 0; }
.mt-1 { margin-top: var(--spacing-sm); }
.mt-2 { margin-top: var(--spacing-md); }
.mt-3 { margin-top: var(--spacing-lg); }
.mt-4 { margin-top: var(--spacing-xl); }

.mb-0 { margin-bottom: 0; }
.mb-1 { margin-bottom: var(--spacing-sm); }
.mb-2 { margin-bottom: var(--spacing-md); }
.mb-3 { margin-bottom: var(--spacing-lg); }
.mb-4 { margin-bottom: var(--spacing-xl); }

.hidden { display: none !important; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.gap-1 { gap: var(--spacing-sm); }
.gap-2 { gap: var(--spacing-md); }

.w-full { width: 100%; }

/* Bottom padding for nav */
.pb-nav {
    padding-bottom: 80px;
}

/* Hero Section */
.hero {
    text-align: center;
    padding: var(--spacing-xl) 0;
}

.hero-logo {
    font-size: 4rem;
    margin-bottom: var(--spacing-md);
}

.hero-title {
    font-size: var(--font-size-3xl);
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.hero-subtitle {
    color: var(--text-secondary);
    margin-top: var(--spacing-sm);
}

/* Responsive adjustments */
@media (min-width: 768px) {
    .container {
        padding: var(--spacing-xl);
    }
    
    .character-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    :root {
        --bg-color: #1A202C;
        --card-bg: #2D3748;
        --text-primary: #F7FAFC;
        --text-secondary: #A0AEC0;
        --text-light: #718096;
        --border-color: #4A5568;
    }
}
