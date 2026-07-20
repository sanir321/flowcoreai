(function() {
  const script = document.currentScript;
  const workspaceId = script.getAttribute('data-workspace');
  const baseUrl = script.src.replace('/widget/widget.js', '');

  if (!workspaceId) return;

  // Persistence
  const storageKey = `fc_${workspaceId}`;
  const profileKey = `fc_profile_${workspaceId}`;
  let sessionToken = localStorage.getItem(storageKey);
  if (!sessionToken) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      sessionToken = crypto.randomUUID();
    } else {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      sessionToken = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
    }
    localStorage.setItem(storageKey, sessionToken);
  }

  // Load saved profile
  let customerName = '';
  let customerEmail = '';
  let savedProfile = null;
  try { savedProfile = JSON.parse(localStorage.getItem(profileKey)); } catch {}
  if (savedProfile?.name && savedProfile?.email) {
    customerName = savedProfile.name;
    customerEmail = savedProfile.email;
  }

  // Inject Google Fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@500;600;700&display=swap';
  document.head.appendChild(fontLink);

  // Inject Styles using CSS custom properties for dynamic theming
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fc-fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fc-slide-up { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes fc-dot-pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }

    .fc-widget {
      --fc-accent: #050505;
      --fc-accent-light: #F5F5F7;
      --fc-bg: #fff;
      --fc-text: #050505;
      position: fixed; bottom: 32px; right: 32px; z-index: 2147483647;
      font-family: 'Inter', -apple-system, sans-serif; -webkit-font-smoothing: antialiased;
    }

    .fc-fab {
      width: 56px; height: 56px; border-radius: 18px; cursor: pointer;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12); display: flex; align-items: center;
      justify-content: center; transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
      border: none; outline: none; background: var(--fc-accent); color: #fff;
    }
    .fc-fab:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 12px 32px rgba(0,0,0,0.18); }
    .fc-fab:active { transform: scale(0.95); }
    .fc-fab svg { width: 28px; height: 28px; transition: transform 0.4s ease; }
    .fc-fab.open svg { transform: rotate(90deg); }

    .fc-panel {
      position: absolute; bottom: 84px; right: 0; width: 360px; height: 520px;
      background: var(--fc-bg); border-radius: 28px; display: none; flex-direction: column;
      overflow: hidden; box-shadow: 0 20px 48px rgba(0,0,0,0.15);
      border: 1px solid rgba(0,0,0,0.04); transform-origin: bottom right;
      animation: fc-slide-up 0.5s cubic-bezier(0.19, 1, 0.22, 1);
    }
    .fc-panel.open { display: flex; }

    @media (max-width: 480px) {
      .fc-panel { width: calc(100vw - 32px); height: calc(100vh - 100px); right: -8px; }
      .fc-widget { bottom: 16px; right: 16px; }
    }

    .fc-view { display: none; flex: 1; flex-direction: column; height: 100%; }
    .fc-view.active { display: flex; }

    /* Header */
    .fc-header {
      padding: 24px; background: var(--fc-bg); border-bottom: 1px solid var(--fc-accent-light);
      display: flex; align-items: center; gap: 12px;
    }
    .fc-avatar {
      width: 40px; height: 40px; border-radius: 14px;
      background: var(--fc-accent); display: flex; align-items: center;
      justify-content: center; color: #fff; font-weight: 700; font-family: 'Outfit';
      overflow: hidden; flex-shrink: 0;
    }
    .fc-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .fc-header-info h3 {
      margin: 0; font-family: 'Outfit'; font-size: 16px; font-weight: 600;
      color: var(--fc-text); letter-spacing: -0.01em;
    }
    .fc-header-info p { margin: 4px 0 0; font-size: 12px; color: #888; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }

    /* Form Styles */
    .fc-form { padding: 24px; flex: 1; display: flex; flex-direction: column; gap: 16px; }
    .fc-field { display: flex; flex-direction: column; gap: 8px; }
    .fc-field label { font-size: 12px; font-weight: 600; color: #666; }
    .fc-field input { padding: 12px 16px; border-radius: 12px; border: 1.5px solid var(--fc-accent-light); outline: none; font-size: 14px; }
    .fc-field input:focus { border-color: var(--fc-accent); }
    .fc-submit {
      padding: 14px; border-radius: 14px; background: var(--fc-accent); color: #fff;
      border: none; font-weight: 600; cursor: pointer; margin-top: 10px;
    }

    /* Chat Styles */
    .fc-messages {
      flex: 1; overflow-y: auto; padding: 20px; display: flex;
      flex-direction: column; gap: 12px; background: var(--fc-bg);
      scrollbar-width: thin; scroll-behavior: smooth;
    }
    .fc-bubble {
      max-width: 82%; padding: 12px 16px; border-radius: 18px; font-size: 13px;
      line-height: 1.5; animation: fc-fade-in 0.3s ease-out both;
    }
    .fc-bubble.ai { align-self: flex-start; background: var(--fc-accent-light); color: var(--fc-text); border-bottom-left-radius: 4px; }
    .fc-bubble.user { align-self: flex-end; background: var(--fc-accent); color: #fff; border-bottom-right-radius: 4px; }

    .fc-typing { align-self: flex-start; background: var(--fc-accent-light); border-radius: 18px; border-bottom-left-radius: 4px; padding: 14px 20px; display: none; gap: 5px; align-items: center; }
    .fc-typing.active { display: flex; }
    .fc-typing-dot { width: 7px; height: 7px; border-radius: 50%; background: #999; animation: fc-dot-pulse 1.2s ease-in-out infinite; }
    .fc-typing-dot:nth-child(2) { animation-delay: 0.15s; }
    .fc-typing-dot:nth-child(3) { animation-delay: 0.3s; }

    .fc-input-area { padding: 16px; border-top: 1px solid var(--fc-accent-light); display: flex; gap: 10px; }
    .fc-input { flex: 1; border: none; outline: none; font-size: 13px; font-family: inherit; background: transparent; }
    .fc-send { color: var(--fc-accent); background: none; border: none; cursor: pointer; }

    .fc-footer { text-align: center; font-size: 9px; color: #ccc; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; padding: 12px; }
  `;
  document.head.appendChild(style);

  const Icons = {
    chat: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>',
    message: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
    support: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"/><path d="M21 16v2a4 4 0 0 1-4 4h-5"/></svg>',
    bot: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>',
    comment: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    whatsapp: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 6.5a7 7 0 0 1-9.9 9.9l-2.1.7.7-2.1a7 7 0 0 1 9.9-9.9"/><path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10 10 10 0 0 1-8.5-4.9"/><path d="M8 11c.3-1 1-1.5 2-1.5s1.7.5 2 1.5c.3 1 .5 2 1 2.5s1.5 1 2.5 1"/><circle cx="9" cy="10" r=".5" fill="currentColor"/><circle cx="15" cy="10" r=".5" fill="currentColor"/></svg>',
    close: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    send: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>'
  };

  const container = document.createElement('div');
  container.className = 'fc-widget';
  container.innerHTML = `
    <div class="fc-panel" id="fc-panel">
      <div class="fc-header">
        <div class="fc-avatar" id="fc-avatar">F</div>
        <div class="fc-header-info">
          <h3 id="fc-agent-name">Assistant</h3>
          <p id="fc-header-status">Support Specialist</p>
        </div>
      </div>

      <!-- FORM VIEW -->
      <div id="fc-view-form" class="fc-view active">
        <div class="fc-form">
          <div class="fc-field">
            <label>Full Name</label>
            <input type="text" id="fc-name" placeholder="John Doe">
          </div>
          <div class="fc-field">
            <label>Email Address</label>
            <input type="email" id="fc-email" placeholder="john@example.com">
          </div>
          <button class="fc-submit" id="fc-start-chat">Start Chat</button>
        </div>
      </div>

      <!-- CHAT VIEW -->
      <div id="fc-view-chat" class="fc-view">
        <div class="fc-messages" id="fc-messages">
          <div class="fc-typing" id="fc-typing">
            <div class="fc-typing-dot"></div>
            <div class="fc-typing-dot"></div>
            <div class="fc-typing-dot"></div>
          </div>
        </div>
        <div class="fc-input-area">
          <input type="text" class="fc-input" id="fc-input" placeholder="Type a message...">
          <button class="fc-send" id="fc-send-msg">${Icons.send}</button>
        </div>
      </div>

      <div class="fc-footer">Powered by <span>FlowCore</span></div>
    </div>
    <button class="fc-fab" id="fc-fab">${Icons.chat}</button>
  `;
  document.body.appendChild(container);

  const panel = document.getElementById('fc-panel');
  const fab = document.getElementById('fc-fab');
  const messages = document.getElementById('fc-messages');
  const input = document.getElementById('fc-input');
  const sendBtn = document.getElementById('fc-send-msg');
  const startBtn = document.getElementById('fc-start-chat');

  let config = {};
  const typingEl = document.getElementById('fc-typing');

  // Apply accent color dynamically via CSS custom properties
  function applyTheme(accentColor, theme) {
    if (!accentColor) return;
    container.style.setProperty('--fc-accent', accentColor);
    const r = parseInt(accentColor.slice(1,3), 16);
    const g = parseInt(accentColor.slice(3,5), 16);
    const b = parseInt(accentColor.slice(5,7), 16);
    container.style.setProperty('--fc-accent-light', `rgba(${r},${g},${b},0.08)`);

    let resolved = theme;
    if (theme === 'auto' || !theme) {
      resolved = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    if (resolved === 'light') {
      container.style.setProperty('--fc-bg', '#ffffff');
      container.style.setProperty('--fc-text', '#050505');
    } else {
      container.style.setProperty('--fc-bg', '#0a0a0a');
      container.style.setProperty('--fc-text', '#f0f0f0');
    }
  }

  function getLauncherIcon(key) {
    return Icons[key] || Icons.chat;
  }

  fab.onclick = () => {
    const isOpen = panel.classList.toggle('open');
    fab.innerHTML = isOpen ? Icons.close : getLauncherIcon(config.launcher_icon || 'chat');
  };

  function isNearBottom() {
    return messages.scrollHeight - messages.scrollTop - messages.clientHeight < 80;
  }

  function scrollToBottom(smooth) {
    if (smooth) {
      messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
    } else {
      messages.scrollTop = messages.scrollHeight;
    }
  }

  startBtn.onclick = () => {
    const name = document.getElementById('fc-name').value;
    const email = document.getElementById('fc-email').value;
    if (!name || !email) return alert("Please provide your details");

    customerName = name;
    customerEmail = email;
    localStorage.setItem(profileKey, JSON.stringify({ name, email }));

    document.getElementById('fc-view-form').classList.remove('active');
    document.getElementById('fc-view-chat').classList.add('active');

    const postMsg = config.post_form_message || "Thank you! How can I help you today?";
    addMessage(postMsg, 'ai');
  };

  function addMessage(text, role) {
    const bubble = document.createElement('div');
    bubble.className = `fc-bubble ${role}`;
    bubble.innerText = text;
    messages.insertBefore(bubble, typingEl);
    const wasAtBottom = isNearBottom();
    if (wasAtBottom) scrollToBottom(false);
  }

  function showTyping() {
    typingEl.classList.add('active');
    if (isNearBottom()) scrollToBottom(false);
  }

  function hideTyping() {
    typingEl.classList.remove('active');
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMessage(text, 'user');
    showTyping();

    try {
      const res = await fetch(`${baseUrl}/api/widget/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-widget-token': sessionToken },
        body: JSON.stringify({ workspace_id: workspaceId, session_token: sessionToken, message: text, customer_name: customerName, customer_email: customerEmail })
      });
      if (res.status === 403) {
        hideTyping();
        addMessage("This chat is not available on this website.", 'ai');
        return;
      }
      const data = await res.json();
      hideTyping();
      addMessage(data.reply, 'ai');
    } catch (e) {
      hideTyping();
      addMessage("Technical hiccup. Please try again.", 'ai');
    }
  }

  sendBtn.onclick = sendMessage;
  input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };

  // Fetch config and apply theme immediately
  fetch(`${baseUrl}/api/widget/config?id=${workspaceId}`)
    .then(r => {
      if (r.status === 403) {
        container.innerHTML = '<div style="position:fixed;bottom:32px;right:32px;z-index:2147483647;background:#fff;border-radius:18px;box-shadow:0 8px 24px rgba(0,0,0,0.12);padding:20px 24px;font-family:Inter,-apple-system,sans-serif;max-width:320px;border:1px solid #fecaca;"><p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#dc2626;">Domain not authorized</p><p style="margin:0;font-size:12px;color:#666;">This widget is not configured to run on this website.</p></div>';
        return;
      }
      if (!r.ok) throw new Error('Config failed');
      return r.json();
    })
    .then(d => {
      if (!d) return;
      config = d;

      // Widget disabled — hide everything
      if (d.is_active === false) {
        container.style.display = 'none';
        return;
      }

      // Apply accent color and theme immediately
      applyTheme(d.accent_color, d.theme);

      // Set agent name & avatar
      if (d.agent_name) {
        document.getElementById('fc-agent-name').innerText = d.agent_name;
      }
      if (d.logo_url) {
        const avatarEl = document.getElementById('fc-avatar');
        avatarEl.innerHTML = '';
        const img = document.createElement('img');
        img.src = String(d.logo_url);
        img.alt = 'Logo';
        avatarEl.appendChild(img);
      } else if (d.avatar_url) {
        const avatarEl = document.getElementById('fc-avatar');
        avatarEl.innerHTML = '';
        const img = document.createElement('img');
        img.src = String(d.avatar_url);
        img.alt = 'Avatar';
        avatarEl.appendChild(img);
      } else if (d.agent_name) {
        document.getElementById('fc-avatar').innerText = d.agent_name.charAt(0);
      }

      // Set launcher icon
      if (d.launcher_icon) {
        fab.innerHTML = getLauncherIcon(d.launcher_icon);
      }

      // Apply header text
      if (d.header_text) {
        document.getElementById('fc-header-status').innerText = d.header_text;
      }

      // Auto-fill form fields from saved profile
      if (d.auto_fill_params && savedProfile) {
        const nameInput = document.getElementById('fc-name');
        const emailInput = document.getElementById('fc-email');
        if (nameInput && savedProfile.name) nameInput.value = savedProfile.name;
        if (emailInput && savedProfile.email) emailInput.value = savedProfile.email;
      }

      // Skip form if profile already saved or anonymous allowed
      if (d.allow_anonymous || savedProfile) {
        document.getElementById('fc-view-form').classList.remove('active');
        document.getElementById('fc-view-chat').classList.add('active');
        const greeting = d.greeting || "Hi! How can I help you today?";
        const userName = savedProfile?.name?.split(' ')[0];
        addMessage(userName ? `Hi ${userName}! ${greeting}` : greeting, 'ai');

        // Reload previous messages
        fetch(`${baseUrl}/api/widget/message?workspace_id=${workspaceId}&session_token=${sessionToken}`)
          .then(r => r.json())
          .then(({ messages: hist }) => {
            if (hist?.length) {
              hist.forEach(m => {
                const bubble = document.createElement('div');
                bubble.className = `fc-bubble ${m.role === 'customer' ? 'user' : 'ai'}`;
                bubble.innerText = m.content;
                messages.insertBefore(bubble, typingEl);
              });
              scrollToBottom(false);
            }
          })
          .catch(() => {});
      }
    });
})();
