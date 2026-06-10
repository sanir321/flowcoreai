(function() {
  const script = document.currentScript;
  const workspaceId = script.getAttribute('data-workspace');
  const baseUrl = script.src.replace('/widget/widget.js', '');

  if (!workspaceId) return;

  // Persistence
  const storageKey = `fc_${workspaceId}`;
  let sessionToken = localStorage.getItem(storageKey);
  if (!sessionToken) {
    sessionToken = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    localStorage.setItem(storageKey, sessionToken);
  }

  // Inject Google Fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@500;600;700&display=swap';
  document.head.appendChild(fontLink);

  // Constants
  const BRAND_DARK = "#050505";
  const ACCENT_ORANGE = "#c65f39";
  const BG_GRAY = "#F9F9FB";

  // Inject Styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fc-fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fc-slide-up { from { opacity: 0; transform: translateY(30px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes fc-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
    @keyframes fc-pulse-soft { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }

    .fc-widget { position: fixed; bottom: 32px; right: 32px; z-index: 2147483647; font-family: 'Inter', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
    
    .fc-fab { 
      width: 64px; height: 64px; border-radius: 22px; cursor: pointer; 
      box-shadow: 0 12px 40px rgba(0,0,0,0.15); display: flex; align-items: center; 
      justify-content: center; transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1); 
      border: none; outline: none; background: ${BRAND_DARK}; color: #fff;
      position: relative; overflow: hidden;
    }
    .fc-fab::after {
      content: ''; position: absolute; inset: 0; 
      background: linear-gradient(45deg, ${ACCENT_ORANGE}33, transparent); 
      opacity: 0; transition: opacity 0.3s;
    }
    .fc-fab:hover { transform: translateY(-5px) scale(1.03); box-shadow: 0 16px 48px rgba(0,0,0,0.22); }
    .fc-fab:hover::after { opacity: 1; }
    .fc-fab:active { transform: scale(0.92); }
    .fc-fab svg { width: 28px; height: 28px; transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1); position: relative; z-index: 2; }
    .fc-fab.open svg { transform: rotate(90deg) scale(0.8); }

    .fc-panel { 
      position: absolute; bottom: 84px; right: 0; width: 400px; height: 640px; 
      background: #fff; border-radius: 32px; display: none; flex-direction: column; 
      overflow: hidden; box-shadow: 0 24px 64px rgba(0,0,0,0.18); 
      border: 1px solid rgba(0,0,0,0.06); transform-origin: bottom right;
      animation: fc-slide-up 0.6s cubic-bezier(0.19, 1, 0.22, 1);
    }
    .fc-panel.open { display: flex; }
    
    @media (max-width: 480px) {
      .fc-panel { width: calc(100vw - 40px); height: calc(100vh - 120px); right: -10px; }
      .fc-widget { bottom: 20px; right: 20px; }
    }

    .fc-header { 
      padding: 32px; background: #fff; border-bottom: 1px solid rgba(0,0,0,0.03); 
      display: flex; align-items: center; gap: 16px; position: relative;
    }
    .fc-avatar { 
      width: 52px; height: 52px; border-radius: 18px; 
      background: ${BRAND_DARK}; display: flex; align-items: center; 
      justify-content: center; color: #fff; font-weight: 700; font-family: 'Outfit';
      box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid rgba(255,255,255,0.1);
    }
    .fc-header-info h3 { 
      margin: 0; font-family: 'Outfit'; font-size: 20px; font-weight: 700; 
      color: ${BRAND_DARK}; letter-spacing: -0.02em; line-height: 1.1;
    }
    .fc-status { display: flex; align-items: center; gap: 6px; mt: 6px; }
    .fc-dot-live { width: 6px; height: 6px; border-radius: 50%; background: #10b981; animation: fc-pulse-soft 2s infinite; }
    .fc-status span { font-size: 11px; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }

    .fc-messages { 
      flex: 1; overflow-y: auto; padding: 32px 24px; display: flex; 
      flex-direction: column; gap: 20px; background: #fff;
      scrollbar-width: none;
    }
    .fc-messages::-webkit-scrollbar { display: none; }

    .fc-msg-group { display: flex; gap: 12px; max-width: 88%; }
    .fc-msg-group.user { align-self: flex-end; flex-direction: row-reverse; }
    .fc-msg-group.ai { align-self: flex-start; }

    .fc-msg-avatar { 
      width: 24px; height: 24px; border-radius: 8px; background: ${BRAND_DARK}; 
      display: flex; align-items: center; justify-content: center; shrink-0;
      margin-top: 4px; border: 1px solid rgba(0,0,0,0.05);
    }
    .fc-msg-avatar.user { background: #fff; }
    .fc-msg-avatar svg { width: 12px; height: 12px; color: #fff; }
    .fc-msg-avatar.user svg { color: #ccc; }

    .fc-bubble { 
      padding: 14px 18px; border-radius: 22px; font-size: 14px; 
      line-height: 1.55; font-weight: 450; animation: fc-fade-in 0.5s ease-out both;
      box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    }
    .fc-bubble.ai { 
      background: ${BG_GRAY}; color: ${BRAND_DARK}; 
      border-top-left-radius: 4px; border: 1px solid rgba(0,0,0,0.03);
    }
    .fc-bubble.user { 
      background: ${BRAND_DARK}; color: #fff; 
      border-top-right-radius: 4px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }

    .fc-typing {
      align-self: flex-start; padding: 14px 20px; background: ${BG_GRAY};
      border-radius: 18px; border-top-left-radius: 4px; display: none;
      align-items: center; gap: 4px; margin-left: 36px;
    }
    .fc-typing.active { display: flex; }
    .fc-dot { width: 4px; height: 4px; border-radius: 50%; background: #999; opacity: 0.6; animation: fc-bounce 1s infinite; }
    .fc-dot:nth-child(2) { animation-delay: 0.2s; }
    .fc-dot:nth-child(3) { animation-delay: 0.4s; }

    .fc-input-area { 
      padding: 24px 32px 32px; background: #fff; border-top: 1px solid rgba(0,0,0,0.03); 
      display: flex; flex-direction: column; gap: 16px;
    }
    .fc-input-wrapper { position: relative; display: flex; align-items: center; }
    .fc-input { 
      flex: 1; border: 1.5px solid ${BG_GRAY}; border-radius: 20px; 
      padding: 16px 56px 16px 20px; font-size: 14px; outline: none; 
      transition: all 0.3s ease; font-family: inherit; font-weight: 500;
      background: ${BG_GRAY};
    }
    .fc-input:focus { border-color: ${ACCENT_ORANGE}; background: #fff; box-shadow: 0 0 0 4px ${ACCENT_ORANGE}10; }
    .fc-send { 
      position: absolute; right: 8px; width: 40px; height: 40px;
      background: ${ACCENT_ORANGE}; color: #fff; border: none; border-radius: 14px; 
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
      box-shadow: 0 4px 12px ${ACCENT_ORANGE}33;
    }
    .fc-send:hover { transform: scale(1.08) translateY(-2px); box-shadow: 0 6px 16px ${ACCENT_ORANGE}44; }
    .fc-send:active { transform: scale(0.95); }
    .fc-send:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }
    
    .fc-footer { text-align: center; display: flex; align-items: center; justify-content: center; gap: 6px; }
    .fc-footer-label { font-size: 9px; color: #bbb; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; }
    .fc-footer-brand { font-size: 9px; color: ${BRAND_DARK}; font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.7; }
  `;
  document.head.appendChild(style);

  // Icons
  const Icons = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
    bot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 8V4m0 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 12h1M20 12h1M9 12h.01M15 12h.01"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
  };

  // HTML Structure
  const container = document.createElement('div');
  container.className = 'fc-widget';
  container.innerHTML = `
    <div class="fc-panel" id="fc-panel">
      <div class="fc-header">
        <div class="fc-avatar" id="fc-avatar">F</div>
        <div class="fc-header-info">
          <h3 id="fc-agent-name">Assistant</h3>
          <div class="fc-status">
            <div class="fc-dot-live"></div>
            <span>Active & Online</span>
          </div>
        </div>
      </div>
      <div class="fc-messages" id="fc-messages"></div>
      <div class="fc-typing" id="fc-typing">
        <div class="fc-dot"></div><div class="fc-dot"></div><div class="fc-dot"></div>
      </div>
      <div class="fc-input-area">
        <div class="fc-input-wrapper">
          <input type="text" class="fc-input" id="fc-input" placeholder="How can I help you?">
          <button class="fc-send" id="fc-send">${Icons.send}</button>
        </div>
        <div class="fc-footer">
          <span class="fc-footer-label">Powered by</span>
          <span class="fc-footer-brand">FlowCore</span>
        </div>
      </div>
    </div>
    <button class="fc-fab" id="fc-fab">${Icons.chat}</button>
  `;
  document.body.appendChild(container);

  const panel = document.getElementById('fc-panel');
  const fab = document.getElementById('fc-fab');
  const messages = document.getElementById('fc-messages');
  const input = document.getElementById('fc-input');
  const send = document.getElementById('fc-send');
  const agentName = document.getElementById('fc-agent-name');
  const avatar = document.getElementById('fc-avatar');
  const typing = document.getElementById('fc-typing');

  let config = {};
  let isProcessing = false;

  // Fetch Config
  fetch(`${baseUrl}/api/widget/config?id=${workspaceId}`)
    .then(r => r.json())
    .then(data => {
      config = data;
      agentName.innerText = data.agent_name || 'FlowCore Assistant';
      avatar.innerText = (data.agent_name || 'F').charAt(0).toUpperCase();
      addMessage(data.greeting || "Hi! I'm your automated assistant. How can I help you today?", 'ai');
    });

  function addMessage(text, role) {
    const group = document.createElement('div');
    group.className = `fc-msg-group ${role}`;
    
    const icon = role === 'ai' ? Icons.bot : Icons.user;
    
    group.innerHTML = `
      <div class="fc-msg-avatar ${role}">${icon}</div>
      <div class="fc-bubble ${role}">${text}</div>
    `;
    
    messages.appendChild(group);
    messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
  }

  function setTyping(active) {
    if (active) typing.classList.add('active');
    else typing.classList.remove('active');
    messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
  }

  fab.onclick = () => {
    const isOpen = panel.classList.toggle('open');
    fab.classList.toggle('open', isOpen);
    fab.innerHTML = isOpen ? Icons.close : Icons.chat;
    if (isOpen) input.focus();
  };

  async function handleSend() {
    const text = input.value.trim();
    if (!text || isProcessing) return;
    
    input.value = '';
    isProcessing = true;
    send.disabled = true;
    
    addMessage(text, 'user');
    setTyping(true);

    try {
      const res = await fetch(`${baseUrl}/api/widget/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          session_token: sessionToken,
          message: text
        })
      });
      const data = await res.json();
      addMessage(data.reply, 'ai');
    } catch (e) {
      addMessage("I'm sorry, I'm having a small technical hiccup. Please try again.", 'ai');
    } finally {
      isProcessing = false;
      send.disabled = false;
      setTyping(false);
    }
  }

  send.onclick = handleSend;
  input.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };
})();
