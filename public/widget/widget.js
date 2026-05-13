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
  const TRUE_BLACK = "#050505";
  const ACCENT_ORANGE = "#f9510b";
  const SOFT_GRAY = "#F5F5F7";

  // Inject Styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fc-fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fc-slide-up { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes fc-dot-pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }

    .fc-widget { position: fixed; bottom: 32px; right: 32px; z-index: 2147483647; font-family: 'Inter', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
    
    .fc-fab { 
      width: 64px; height: 64px; border-radius: 22px; cursor: pointer; 
      box-shadow: 0 8px 24px rgba(0,0,0,0.12); display: flex; align-items: center; 
      justify-content: center; transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1); 
      border: none; outline: none; background: ${TRUE_BLACK}; color: #fff;
    }
    .fc-fab:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 12px 32px rgba(0,0,0,0.18); }
    .fc-fab:active { transform: scale(0.95); }
    .fc-fab svg { width: 28px; height: 28px; transition: transform 0.4s ease; }
    .fc-fab.open svg { transform: rotate(90deg); }

    .fc-panel { 
      position: absolute; bottom: 84px; right: 0; width: 400px; height: 620px; 
      background: #fff; border-radius: 32px; display: none; flex-direction: column; 
      overflow: hidden; box-shadow: 0 20px 48px rgba(0,0,0,0.15); 
      border: 1px solid rgba(0,0,0,0.04); transform-origin: bottom right;
      animation: fc-slide-up 0.5s cubic-bezier(0.19, 1, 0.22, 1);
    }
    .fc-panel.open { display: flex; }
    
    @media (max-width: 480px) {
      .fc-panel { width: calc(100vw - 40px); height: calc(100vh - 120px); right: -10px; }
      .fc-widget { bottom: 20px; right: 20px; }
    }

    .fc-header { 
      padding: 32px; background: #fff; border-bottom: 1px solid ${SOFT_GRAY}; 
      display: flex; align-items: center; gap: 16px;
    }
    .fc-avatar { 
      width: 48px; height: 48px; border-radius: 16px; 
      background: ${TRUE_BLACK}; display: flex; align-items: center; 
      justify-content: center; color: #fff; font-weight: 700; font-family: 'Outfit';
    }
    .fc-header-info h3 { 
      margin: 0; font-family: 'Outfit'; font-size: 18px; font-weight: 600; 
      color: ${TRUE_BLACK}; letter-spacing: -0.01em; 
    }
    .fc-header-info p { margin: 4px 0 0; font-size: 12px; color: #888; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }

    .fc-messages { 
      flex: 1; overflow-y: auto; padding: 24px; display: flex; 
      flex-direction: column; gap: 16px; background: #fff;
      scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.1) transparent;
    }
    .fc-messages::-webkit-scrollbar { width: 4px; }
    .fc-messages::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }

    .fc-bubble { 
      max-width: 82%; padding: 14px 18px; border-radius: 20px; font-size: 14px; 
      line-height: 1.5; font-weight: 450; animation: fc-fade-in 0.4s ease-out both;
    }
    .fc-bubble.ai { 
      align-self: flex-start; background: ${SOFT_GRAY}; color: ${TRUE_BLACK}; 
      border-bottom-left-radius: 4px; border: 1px solid rgba(0,0,0,0.02);
    }
    .fc-bubble.user { 
      align-self: flex-end; background: ${TRUE_BLACK}; color: #fff; 
      border-bottom-right-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .fc-typing {
      align-self: flex-start; padding: 12px 16px; background: ${SOFT_GRAY};
      border-radius: 16px; border-bottom-left-radius: 4px; display: none;
      align-items: center; gap: 4px; margin-bottom: 8px;
    }
    .fc-typing.active { display: flex; }
    .fc-dot { width: 4px; height: 4px; border-radius: 50%; background: ${TRUE_BLACK}; opacity: 0.4; animation: fc-dot-pulse 1.4s infinite; }
    .fc-dot:nth-child(2) { animation-delay: 0.2s; }
    .fc-dot:nth-child(3) { animation-delay: 0.4s; }

    .fc-input-area { 
      padding: 24px; background: #fff; border-top: 1px solid ${SOFT_GRAY}; 
      display: flex; flex-direction: column; gap: 12px;
    }
    .fc-input-wrapper {
      position: relative; display: flex; align-items: center;
    }
    .fc-input { 
      flex: 1; border: 1.5px solid ${SOFT_GRAY}; border-radius: 18px; 
      padding: 14px 50px 14px 20px; font-size: 14px; outline: none; 
      transition: all 0.3s ease; font-family: inherit; font-weight: 500;
    }
    .fc-input:focus { border-color: ${TRUE_BLACK}; background: #fff; }
    .fc-send { 
      position: absolute; right: 8px; width: 36px; height: 36px;
      background: ${TRUE_BLACK}; color: #fff; border: none; border-radius: 12px; 
      cursor: pointer; display: flex; items-center: center; justify-content: center;
      transition: all 0.2s;
    }
    .fc-send:hover { transform: scale(1.05); }
    .fc-send:disabled { opacity: 0.3; cursor: not-allowed; }
    
    .fc-footer { text-align: center; font-size: 10px; color: #ccc; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; padding-top: 4px; }
    .fc-footer span { color: ${TRUE_BLACK}; }
  `;
  document.head.appendChild(style);

  // Icons
  const Icons = {
    chat: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>',
    close: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    send: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>'
  };

  // HTML Structure
  const container = document.createElement('div');
  container.className = 'fc-widget';
  container.innerHTML = `
    <div class="fc-panel" id="fc-panel">
      <div class="fc-header">
        <div class="fc-avatar" id="fc-avatar">C</div>
        <div class="fc-header-info">
          <h3 id="fc-agent-name">Conduit Assistant</h3>
          <p>Automated Agent</p>
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
        <div class="fc-footer">Powered by <span>Conduit</span></div>
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
      agentName.innerText = data.agent_name || 'Conduit Assistant';
      avatar.innerText = (data.agent_name || 'C').charAt(0);
      if (data.accent_color) {
          // Optional: Apply accent color to small highlights if desired
      }
      addMessage(data.greeting || "Hi! I'm your automated assistant. How can I help you today?", 'ai');
    });

  function addMessage(text, role) {
    const bubble = document.createElement('div');
    bubble.className = `fc-bubble ${role}`;
    bubble.innerText = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  function setTyping(active) {
    if (active) typing.classList.add('active');
    else typing.classList.remove('active');
    messages.scrollTop = messages.scrollHeight;
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
      addMessage("I'm sorry, I'm having trouble connecting. Please try again in a moment.", 'ai');
    } finally {
      isProcessing = false;
      send.disabled = false;
      setTyping(false);
    }
  }

  send.onclick = handleSend;
  input.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };
})();
