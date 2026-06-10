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
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700&display=swap';
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
    
    .fc-widget { position: fixed; bottom: 24px; right: 24px; z-index: 2147483647; font-family: 'Inter', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
    
    .fc-fab { 
      width: 60px; height: 60px; border-radius: 20px; cursor: pointer; 
      box-shadow: 0 12px 32px rgba(0,0,0,0.15); display: flex; align-items: center; 
      justify-content: center; transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1); 
      border: none; outline: none; background: ${BRAND_DARK}; color: #fff;
    }
    .fc-fab:hover { transform: translateY(-5px) scale(1.05); box-shadow: 0 16px 40px rgba(0,0,0,0.2); }
    .fc-fab:active { transform: scale(0.92); }
    .fc-fab svg { width: 26px; height: 26px; transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1); }
    .fc-fab.open svg { transform: rotate(90deg) scale(0.8); }

    .fc-panel { 
      position: absolute; bottom: 76px; right: 0; width: 380px; height: 620px; 
      background: #fff; border-radius: 24px; display: none; flex-direction: column; 
      overflow: hidden; box-shadow: 0 24px 64px rgba(0,0,0,0.12); 
      border: 1px solid rgba(0,0,0,0.06); transform-origin: bottom right;
      animation: fc-slide-up 0.6s cubic-bezier(0.19, 1, 0.22, 1);
    }
    .fc-panel.open { display: flex; }
    
    @media (max-width: 480px) {
      .fc-panel { width: calc(100vw - 32px); height: calc(100vh - 110px); right: -4px; }
    }

    /* Views */
    .fc-view { display: none; flex: 1; flex-direction: column; height: 100%; }
    .fc-view.active { display: flex; }

    /* Start View */
    .fc-start-header { padding: 48px 32px 32px; }
    .fc-logo { width: 56px; height: 56px; background: ${BRAND_DARK}; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
    .fc-logo svg { width: 28px; height: 28px; color: #fff; }
    .fc-start-header h1 { font-family: 'Outfit'; font-size: 32px; font-weight: 700; margin: 0; color: ${BRAND_DARK}; line-height: 1.1; letter-spacing: -0.02em; }
    .fc-start-body { padding: 0 32px; flex: 1; }
    .fc-start-button { 
      width: 100%; padding: 18px 24px; background: ${BG_GRAY}; border-radius: 20px; 
      display: flex; align-items: center; justify-content: space-between; 
      border: 1px solid rgba(0,0,0,0.03); cursor: pointer; transition: all 0.2s;
      margin-top: 40px;
    }
    .fc-start-button:hover { background: #fff; border-color: ${ACCENT_ORANGE}; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.05); }
    .fc-start-button-label { display: flex; align-items: center; gap: 12px; font-weight: 600; font-size: 15px; color: ${BRAND_DARK}; }
    .fc-start-button-label svg { width: 20px; height: 20px; color: #666; }

    /* Form View */
    .fc-view-header { padding: 24px 32px; border-bottom: 1px solid rgba(0,0,0,0.03); display: flex; align-items: center; justify-content: space-between; }
    .fc-back { cursor: pointer; color: #999; transition: color 0.2s; }
    .fc-back:hover { color: ${BRAND_DARK}; }
    .fc-form-body { padding: 32px; flex: 1; }
    .fc-form-body h2 { font-family: 'Outfit'; font-size: 20px; font-weight: 700; margin: 0 0 8px; color: ${BRAND_DARK}; }
    .fc-form-body p { font-size: 13px; color: #888; margin: 0 0 32px; line-height: 1.4; }
    .fc-field { margin-bottom: 20px; }
    .fc-field label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #bbb; margin-bottom: 8px; }
    .fc-field input { width: 100%; padding: 14px 18px; border-radius: 14px; border: 1.5px solid ${BG_GRAY}; background: ${BG_GRAY}; font-size: 14px; outline: none; transition: all 0.2s; }
    .fc-field input:focus { background: #fff; border-color: ${BRAND_DARK}; }
    .fc-submit { width: 100%; padding: 16px; background: ${BRAND_DARK}; color: #fff; border: none; border-radius: 16px; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; margin-top: 12px; }
    .fc-submit:hover { transform: scale(1.02); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }

    /* Chat View */
    .fc-chat-header { padding: 20px 24px; border-bottom: 1px solid rgba(0,0,0,0.03); display: flex; align-items: center; gap: 12px; }
    .fc-chat-avatar { width: 36px; height: 36px; border-radius: 12px; background: ${BRAND_DARK}; display: flex; align-items: center; justify-content: center; color: #fff; font-family: 'Outfit'; font-weight: 700; font-size: 14px; }
    .fc-chat-info h4 { margin: 0; font-size: 14px; font-weight: 700; color: ${BRAND_DARK}; }
    .fc-chat-info p { margin: 2px 0 0; font-size: 10px; color: #10b981; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .fc-messages { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; background: #fff; scrollbar-width: none; }
    .fc-bubble { max-width: 85%; padding: 12px 16px; border-radius: 18px; font-size: 13.5px; line-height: 1.5; }
    .fc-bubble.ai { align-self: flex-start; background: ${BG_GRAY}; color: ${BRAND_DARK}; border-bottom-left-radius: 4px; }
    .fc-bubble.user { align-self: flex-end; background: ${BRAND_DARK}; color: #fff; border-bottom-right-radius: 4px; }
    .fc-chat-input-area { padding: 20px 24px 24px; border-top: 1px solid rgba(0,0,0,0.03); display: flex; gap: 10px; }
    .fc-chat-input { flex: 1; border: none; font-size: 14px; outline: none; font-family: inherit; }
    .fc-chat-send { background: none; border: none; color: ${ACCENT_ORANGE}; cursor: pointer; padding: 4px; transition: transform 0.2s; }
    .fc-chat-send:hover { transform: scale(1.1); }
    
    .fc-footer { text-align: center; padding: 16px; font-size: 9px; color: #ccc; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; border-top: 1px solid rgba(0,0,0,0.01); }
    .fc-footer span { color: #999; }

    .fc-close-x { cursor: pointer; color: #ccc; transition: color 0.2s; }
    .fc-close-x:hover { color: #666; }
  `;
  document.head.appendChild(style);

  // Icons
  const Icons = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>'
  };

  // HTML Structure
  const container = document.createElement('div');
  container.className = 'fc-widget';
  container.innerHTML = `
    <div class="fc-panel" id="fc-panel">
      <!-- VIEW: START -->
      <div class="fc-view active" id="fc-view-start">
        <div class="fc-view-header" style="border:none; padding-bottom:0;">
          <div style="flex:1"></div>
          <div class="fc-close-x" onclick="window.fcClose()">${Icons.close}</div>
        </div>
        <div class="fc-start-header">
          <div class="fc-logo">${Icons.chat}</div>
          <h1 id="fc-start-greeting">Hi there, how can we help?</h1>
        </div>
        <div class="fc-start-body">
          <div class="fc-start-button" onclick="window.fcGoTo('form')">
            <div class="fc-start-button-label">${Icons.mail} Send us a message</div>
            ${Icons.arrowRight}
          </div>
        </div>
        <div class="fc-footer">Powered by <span>FlowCore</span></div>
      </div>

      <!-- VIEW: FORM -->
      <div class="fc-view" id="fc-view-form">
        <div class="fc-view-header">
          <div class="fc-back" onclick="window.fcGoTo('start')">${Icons.back}</div>
          <div class="fc-close-x" onclick="window.fcClose()">${Icons.close}</div>
        </div>
        <div class="fc-form-body">
          <h2>Let's get some basic info</h2>
          <p>This will help us know who you are</p>
          <div class="fc-field">
            <label>Full Name</label>
            <input type="text" id="fc-input-name" placeholder="John Doe">
          </div>
          <div class="fc-field">
            <label>Email Address</label>
            <input type="email" id="fc-input-email" placeholder="john@doe.com">
          </div>
          <button class="fc-submit" onclick="window.fcSubmitForm()">Submit</button>
        </div>
      </div>

      <!-- VIEW: CHAT -->
      <div class="fc-view" id="fc-view-chat">
        <div class="fc-chat-header">
          <div class="fc-chat-avatar" id="fc-chat-avatar">F</div>
          <div class="fc-chat-info">
            <h4 id="fc-chat-agent-name">Assistant</h4>
            <p>Active & Online</p>
          </div>
          <div style="flex:1"></div>
          <div class="fc-close-x" onclick="window.fcClose()">${Icons.close}</div>
        </div>
        <div class="fc-messages" id="fc-messages"></div>
        <div class="fc-chat-input-area">
          <input type="text" class="fc-chat-input" id="fc-chat-input" placeholder="Type a message...">
          <button class="fc-chat-send" onclick="window.fcSendMessage()">${Icons.send}</button>
        </div>
        <div class="fc-footer">Powered by <span>FlowCore</span></div>
      </div>
    </div>
    <button class="fc-fab" id="fc-fab" onclick="window.fcToggle()">${Icons.chat}</button>
  `;
  document.body.appendChild(container);

  const panel = document.getElementById('fc-panel');
  const fab = document.getElementById('fc-fab');
  const messages = document.getElementById('fc-messages');
  
  window.fcToggle = function() {
    const isOpen = panel.classList.toggle('open');
    fab.classList.toggle('open', isOpen);
    fab.innerHTML = isOpen ? Icons.close : Icons.chat;
  };

  window.fcClose = function() {
    panel.classList.remove('open');
    fab.classList.remove('open');
    fab.innerHTML = Icons.chat;
  };

  window.fcGoTo = function(viewName) {
    document.querySelectorAll('.fc-view').forEach(v => v.classList.remove('active'));
    document.getElementById(`fc-view-${viewName}`).classList.add('active');
  };

  let config = {};
  fetch(`${baseUrl}/api/widget/config?id=${workspaceId}`)
    .then(r => r.json())
    .then(data => {
      config = data;
      if (data.greeting) document.getElementById('fc-start-greeting').innerText = data.greeting;
      if (data.agent_name) {
        document.getElementById('fc-chat-agent-name').innerText = data.agent_name;
        document.getElementById('fc-chat-avatar').innerText = data.agent_name.charAt(0).toUpperCase();
      }
    });

  window.fcSubmitForm = function() {
    const name = document.getElementById('fc-input-name').value;
    const email = document.getElementById('fc-input-email').value;
    if (!name || !email) return alert('Please fill in all fields');
    
    // In a real scenario, we would save this to the contact. 
    // For now, we jump to chat.
    window.fcGoTo('chat');
    if (messages.children.length === 0) {
      addMessage("Hi! I've received your details. How can I help you today?", 'ai');
    }
  };

  function addMessage(text, role) {
    const bubble = document.createElement('div');
    bubble.className = `fc-bubble ${role}`;
    bubble.innerText = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  window.fcSendMessage = async function() {
    const input = document.getElementById('fc-chat-input');
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
      addMessage("I'm sorry, I'm having a small technical hiccup. Please try again.", 'ai');
    }
  };

  document.getElementById('fc-chat-input').onkeypress = (e) => { if (e.key === 'Enter') window.fcSendMessage(); };
})();
