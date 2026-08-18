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
      --fc-accent-light: rgba(5,5,5,0.08);
      --fc-bg: #ffffff;
      --fc-text: #050505;
      --fc-surface: #f3f4f6;
      --fc-border: #e5e7eb;
      --fc-input-bg: #fafafa;
      --fc-shadow: 0 24px 64px rgba(0,0,0,0.18), 0 0 0 1px var(--fc-border);
      position: fixed; bottom: 28px; right: 28px; z-index: 2147483647;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; -webkit-font-smoothing: antialiased;
    }

    .fc-fab {
      width: 56px; height: 56px; border-radius: 18px; cursor: pointer;
      box-shadow: 0 8px 28px rgba(0,0,0,0.18), 0 0 0 0 rgba(0,0,0,0.12); display: flex; align-items: center;
      justify-content: center; transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
      border: none; outline: none; background: var(--fc-accent); color: #fff;
    }
    .fc-fab:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 14px 36px rgba(0,0,0,0.22); }
    .fc-fab:active { transform: scale(0.95); }
    .fc-fab svg { width: 24px; height: 24px; transition: transform 0.4s ease; }
    .fc-fab.open svg { transform: rotate(90deg); }

    .fc-panel {
      position: absolute; bottom: 76px; right: 0; width: 380px; height: 560px;
      background: var(--fc-bg); border-radius: 24px; display: none; flex-direction: column;
      overflow: hidden; box-shadow: var(--fc-shadow);
      border: 1px solid var(--fc-border); transform-origin: bottom right;
      animation: fc-slide-up 0.5s cubic-bezier(0.19, 1, 0.22, 1);
    }
    .fc-panel.open { display: flex; }

    @media (max-width: 480px) {
      .fc-panel { width: calc(100vw - 24px); height: calc(100vh - 96px); right: -6px; bottom: 68px; }
      .fc-widget { bottom: 14px; right: 14px; }
    }

    .fc-view { display: none; flex: 1; flex-direction: column; height: 100%; }
    .fc-view.active { display: flex; }

    /* Header */
    .fc-header {
      padding: 20px 24px; background: var(--fc-bg); border-bottom: 1px solid var(--fc-border);
      display: flex; align-items: center; gap: 12px;
    }
    .fc-avatar {
      width: 42px; height: 42px; border-radius: 13px;
      background: var(--fc-accent); display: flex; align-items: center;
      justify-content: center; color: #fff; font-weight: 700; font-family: 'Outfit', sans-serif;
      overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .fc-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .fc-header-info h3 {
      margin: 0; font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700;
      color: var(--fc-text); letter-spacing: -0.01em; line-height: 1.2;
    }
    .fc-header-info p {
      margin: 4px 0 0; font-size: 11px; color: var(--fc-text); opacity: 0.6; font-weight: 500;
      text-transform: uppercase; letter-spacing: 0.08em;
    }

    /* Form Styles */
    .fc-form { padding: 24px; flex: 1; display: flex; flex-direction: column; gap: 16px; color: var(--fc-text); }
    .fc-field { display: flex; flex-direction: column; gap: 8px; }
    .fc-field label { font-size: 11px; font-weight: 700; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.06em; }
    .fc-field input { padding: 12px 16px; border-radius: 14px; border: 1.5px solid var(--fc-border); outline: none; font-size: 14px; font-family: inherit; background: var(--fc-input-bg); color: var(--fc-text); transition: all 0.2s; }
    .fc-field input:focus { border-color: var(--fc-accent); background: var(--fc-bg); box-shadow: 0 0 0 3px var(--fc-accent-light); }
    .fc-submit {
      padding: 14px; border-radius: 14px; background: var(--fc-accent); color: #fff;
      border: none; font-weight: 600; cursor: pointer; margin-top: 12px; font-size: 14px;
      transition: all 0.2s; box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }
    .fc-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }

    /* Chat Styles */
    .fc-messages {
      flex: 1; overflow-y: auto; padding: 20px; display: flex;
      flex-direction: column; gap: 10px; background: var(--fc-bg);
      scrollbar-width: thin; scroll-behavior: smooth;
    }
    .fc-bubble {
      max-width: 84%; padding: 11px 16px; border-radius: 18px; font-size: 13.5px;
      line-height: 1.55; animation: fc-fade-in 0.35s ease-out both; word-wrap: break-word;
    }
    .fc-bubble.ai { align-self: flex-start; background: var(--fc-surface); color: var(--fc-text); border-bottom-left-radius: 4px; }
    .fc-bubble.user { align-self: flex-end; background: var(--fc-accent); color: #fff; border-bottom-right-radius: 4px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); }

    .fc-typing { align-self: flex-start; background: var(--fc-surface); border-radius: 18px; border-bottom-left-radius: 4px; padding: 14px 20px; display: none; gap: 5px; align-items: center; }
    .fc-typing.active { display: flex; }
    .fc-typing-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--fc-text); opacity: 0.5; animation: fc-dot-pulse 1.2s ease-in-out infinite; }
    .fc-typing-dot:nth-child(2) { animation-delay: 0.15s; }
    .fc-typing-dot:nth-child(3) { animation-delay: 0.3s; }

    .fc-input-area { padding: 14px 16px; border-top: 1px solid var(--fc-border); display: flex; gap: 10px; align-items: flex-end; background: var(--fc-bg); }
    .fc-input-wrapper { flex: 1; background: var(--fc-input-bg); border: 1.5px solid var(--fc-border); border-radius: 20px; padding: 10px 16px; transition: all 0.2s; }
    .fc-input-wrapper:focus-within { border-color: var(--fc-accent); background: var(--fc-bg); box-shadow: 0 0 0 3px var(--fc-accent-light); }
    .fc-input { width: 100%; border: none; outline: none; font-size: 14px; font-family: inherit; background: transparent; color: var(--fc-text); resize: none; }
    .fc-send { color: #fff; background: var(--fc-accent); border: none; cursor: pointer; padding: 8px; border-radius: 14px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
    .fc-send:hover { transform: scale(1.05); box-shadow: 0 4px 14px rgba(0,0,0,0.2); }
    .fc-send svg { width: 18px; height: 18px; }

    .fc-footer { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 10px; font-weight: 700; color: var(--fc-text); opacity: 0.4; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px; transition: opacity 0.2s; cursor: default; }
    .fc-footer:hover { opacity: 1; }
    .fc-footer svg { filter: grayscale(100%) opacity(0.8); transition: filter 0.2s; }
    .fc-footer:hover svg { filter: none; }
  `;
  document.head.appendChild(style);

  const Icons = {
    chat: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    message: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
    support: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z"/><path d="M7 11h10"/><path d="M12 15v-4"/><path d="M8 15h8"/></svg>',
    bot: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" x2="8" y1="16" y2="16"/><line x1="16" x2="16" y1="16" y2="16"/></svg>',
    comment: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    whatsapp: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
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
        <div style="margin-left:auto;width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,0.15);" title="Online"></div>
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
          <div class="fc-input-wrapper">
            <input type="text" class="fc-input" id="fc-input" placeholder="Type a message..." autocomplete="off">
          </div>
          <button class="fc-send" id="fc-send-msg" aria-label="Send message">${Icons.send}</button>
        </div>
      </div>

      <div class="fc-footer">
        <span>Powered by</span>
        <svg width="60" height="15" viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="fc-brand-widget" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#c65f39"/>
              <stop offset="100%" stop-color="#a84a2a"/>
            </linearGradient>
          </defs>
          <rect x="10" y="22" width="56" height="56" rx="14" fill="url(#fc-brand-widget)"/>
          <path d="M24 32h28v5H29v5h16v5H29v10h5v5H24V32z" fill="#fff"/>
          <text x="80" y="62" font-family="sans-serif" font-size="38" fill="var(--fc-text)">
            <tspan font-weight="700">Flow</tspan><tspan font-weight="300" opacity="0.6">Core</tspan>
          </text>
        </svg>
      </div>
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
      container.style.setProperty('--fc-surface', '#f3f4f6');
      container.style.setProperty('--fc-border', '#e5e7eb');
      container.style.setProperty('--fc-input-bg', '#fafafa');
    } else {
      container.style.setProperty('--fc-bg', '#0f0f0f');
      container.style.setProperty('--fc-text', '#f0f0f0');
      container.style.setProperty('--fc-surface', '#262626');
      container.style.setProperty('--fc-border', '#333333');
      container.style.setProperty('--fc-input-bg', '#171717');
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
      
      hideTyping();
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      const bubble = document.createElement('div');
      bubble.className = `fc-bubble ai`;
      messages.insertBefore(bubble, typingEl);
      if (isNearBottom()) scrollToBottom(false);

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep the last incomplete line
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                bubble.innerText += content;
                if (isNearBottom()) scrollToBottom(false);
              }
            } catch (e) {}
          }
        }
      }
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
