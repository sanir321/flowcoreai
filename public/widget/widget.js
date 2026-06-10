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
  const SOFT_GRAY = "#F5F5F7";

  // Inject Styles (STRICT OLD UI STYLE)
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

    .fc-view { display: none; flex: 1; flex-direction: column; height: 100%; }
    .fc-view.active { display: flex; }

    /* Header (Universal) */
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

    /* Form Styles */
    .fc-form { padding: 32px; flex: 1; display: flex; flex-direction: column; gap: 20px; }
    .fc-field { display: flex; flex-direction: column; gap: 8px; }
    .fc-field label { font-size: 12px; font-weight: 600; color: #666; }
    .fc-field input { padding: 12px 16px; border-radius: 12px; border: 1.5px solid ${SOFT_GRAY}; outline: none; font-size: 14px; }
    .fc-field input:focus { border-color: ${TRUE_BLACK}; }
    .fc-submit { 
      padding: 14px; border-radius: 14px; background: ${TRUE_BLACK}; color: #fff; 
      border: none; font-weight: 600; cursor: pointer; margin-top: 10px;
    }

    /* Chat Styles */
    .fc-messages { 
      flex: 1; overflow-y: auto; padding: 24px; display: flex; 
      flex-direction: column; gap: 16px; background: #fff;
      scrollbar-width: thin;
    }
    .fc-bubble { 
      max-width: 82%; padding: 14px 18px; border-radius: 20px; font-size: 14px; 
      line-height: 1.5; animation: fc-fade-in 0.4s ease-out both;
    }
    .fc-bubble.ai { align-self: flex-start; background: ${SOFT_GRAY}; color: ${TRUE_BLACK}; border-bottom-left-radius: 4px; }
    .fc-bubble.user { align-self: flex-end; background: ${TRUE_BLACK}; color: #fff; border-bottom-right-radius: 4px; }

    .fc-input-area { padding: 24px; border-top: 1px solid ${SOFT_GRAY}; display: flex; gap: 12px; }
    .fc-input { flex: 1; border: none; outline: none; font-size: 14px; font-family: inherit; }
    .fc-send { color: ${TRUE_BLACK}; background: none; border: none; cursor: pointer; }

    .fc-footer { text-align: center; font-size: 10px; color: #ccc; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; padding: 16px; }
  `;
  document.head.appendChild(style);

  const Icons = {
    chat: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>',
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
          <button class="fc-submit" onclick="window.fcStartChat()">Start Chat</button>
        </div>
      </div>

      <!-- CHAT VIEW -->
      <div id="fc-view-chat" class="fc-view">
        <div class="fc-messages" id="fc-messages"></div>
        <div class="fc-input-area">
          <input type="text" class="fc-input" id="fc-input" placeholder="Type a message...">
          <button class="fc-send" onclick="window.fcSendMessage()">${Icons.send}</button>
        </div>
      </div>

      <div class="fc-footer">Powered by <span>FlowCore</span></div>
    </div>
    <button class="fc-fab" id="fc-fab" onclick="window.fcToggle()">${Icons.chat}</button>
  `;
  document.body.appendChild(container);

  const panel = document.getElementById('fc-panel');
  const fab = document.getElementById('fc-fab');
  const messages = document.getElementById('fc-messages');
  const input = document.getElementById('fc-input');

  window.fcToggle = () => {
    const isOpen = panel.classList.toggle('open');
    fab.innerHTML = isOpen ? Icons.close : Icons.chat;
  };

  window.fcStartChat = () => {
    const name = document.getElementById('fc-name').value;
    const email = document.getElementById('fc-email').value;
    if (!name || !email) return alert("Please provide your details");

    document.getElementById('fc-view-form').classList.remove('active');
    document.getElementById('fc-view-chat').classList.add('active');
    
    addMessage(`Hi ${name.split(' ')[0]}! How can I help you today?`, 'ai');
  };

  function addMessage(text, role) {
    const bubble = document.createElement('div');
    bubble.className = `fc-bubble ${role}`;
    bubble.innerText = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  window.fcSendMessage = async () => {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMessage(text, 'user');

    try {
      const res = await fetch(`${baseUrl}/api/widget/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, session_token: sessionToken, message: text })
      });
      const data = await res.json();
      addMessage(data.reply, 'ai');
    } catch (e) {
      addMessage("Technical hiccup. Please try again.", 'ai');
    }
  };

  input.onkeypress = (e) => { if (e.key === 'Enter') window.fcSendMessage(); };

  fetch(`${baseUrl}/api/widget/config?id=${workspaceId}`)
    .then(r => r.json())
    .then(d => {
      if (d.agent_name) {
        document.getElementById('fc-agent-name').innerText = d.agent_name;
        document.getElementById('fc-avatar').innerText = d.agent_name.charAt(0);
      }
      if (d.allow_anonymous) {
        window.fcStartChat = () => {}; // No-op
        document.getElementById('fc-view-form').classList.remove('active');
        document.getElementById('fc-view-chat').classList.add('active');
        addMessage(d.greeting || "Hi! How can I help?", 'ai');
      }
    });
})();
