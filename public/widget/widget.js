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
    sessionToken = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
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
      width: 56px; height: 56px; border-radius: 18px; cursor: pointer; 
      box-shadow: 0 8px 24px rgba(0,0,0,0.12); display: flex; align-items: center; 
      justify-content: center; transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1); 
      border: none; outline: none; background: ${TRUE_BLACK}; color: #fff;
    }
    .fc-fab:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 12px 32px rgba(0,0,0,0.18); }
    .fc-fab:active { transform: scale(0.95); }
    .fc-fab svg { width: 28px; height: 28px; transition: transform 0.4s ease; }
    .fc-fab.open svg { transform: rotate(90deg); }

    .fc-panel { 
      position: absolute; bottom: 84px; right: 0; width: 360px; height: 520px; 
      background: #fff; border-radius: 28px; display: none; flex-direction: column; 
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

    /* Header (Universal) */
    .fc-header { 
      padding: 24px; background: #fff; border-bottom: 1px solid ${SOFT_GRAY}; 
      display: flex; align-items: center; gap: 12px;
    }
    .fc-avatar { 
      width: 40px; height: 40px; border-radius: 14px; 
      background: ${TRUE_BLACK}; display: flex; align-items: center; 
      justify-content: center; color: #fff; font-weight: 700; font-family: 'Outfit';
    }
    .fc-header-info h3 { 
      margin: 0; font-family: 'Outfit'; font-size: 16px; font-weight: 600; 
      color: ${TRUE_BLACK}; letter-spacing: -0.01em; 
    }
    .fc-header-info p { margin: 4px 0 0; font-size: 12px; color: #888; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }

    /* Form Styles */
    .fc-form { padding: 24px; flex: 1; display: flex; flex-direction: column; gap: 16px; }
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
      flex: 1; overflow-y: auto; padding: 20px; display: flex; 
      flex-direction: column; gap: 12px; background: #fff;
      scrollbar-width: thin;
    }
    .fc-bubble { 
      max-width: 82%; padding: 12px 16px; border-radius: 18px; font-size: 13px; 
      line-height: 1.5; animation: fc-fade-in 0.4s ease-out both;
    }
    .fc-bubble.ai { align-self: flex-start; background: ${SOFT_GRAY}; color: ${TRUE_BLACK}; border-bottom-left-radius: 4px; }
    .fc-bubble.user { align-self: flex-end; background: ${TRUE_BLACK}; color: #fff; border-bottom-right-radius: 4px; }

    .fc-input-area { padding: 16px; border-top: 1px solid ${SOFT_GRAY}; display: flex; gap: 10px; }
    .fc-input { flex: 1; border: none; outline: none; font-size: 13px; font-family: inherit; }
    .fc-send { color: ${TRUE_BLACK}; background: none; border: none; cursor: pointer; }

    .fc-footer { text-align: center; font-size: 9px; color: #ccc; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; padding: 12px; }

    .fc-whatsapp {
      display: none; align-items: center; justify-content: center; gap: 8px;
      padding: 12px; background: #25D366; color: #fff; border-radius: 12px;
      text-decoration: none; font-size: 13px; font-weight: 600; margin-top: 8px;
    }
    .fc-whatsapp.active { display: flex; }
  `;
  document.head.appendChild(style);

  const Icons = {
    chat: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>',
    close: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    send: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
    whatsapp: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>'
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
          <a href="#" target="_blank" class="fc-whatsapp" id="fc-whatsapp-link">
            ${Icons.whatsapp} Message on WhatsApp
          </a>
        </div>
      </div>

      <!-- CHAT VIEW -->
      <div id="fc-view-chat" class="fc-view">
        <div class="fc-messages" id="fc-messages"></div>
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
  const whatsappLink = document.getElementById('fc-whatsapp-link');

  let config = {};

  fab.onclick = () => {
    const isOpen = panel.classList.toggle('open');
    fab.innerHTML = isOpen ? Icons.close : Icons.chat;
  };

  let customerName = '';
  let customerEmail = '';

  startBtn.onclick = () => {
    const name = document.getElementById('fc-name').value;
    const email = document.getElementById('fc-email').value;
    if (!name || !email) return alert("Please provide your details");

    customerName = name;
    customerEmail = email;
    localStorage.setItem(profileKey, JSON.stringify({ name, email }));

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

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMessage(text, 'user');

    try {
      const res = await fetch(`${baseUrl}/api/widget/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, session_token: sessionToken, message: text, customer_name: customerName, customer_email: customerEmail })
      });
      const data = await res.json();
      addMessage(data.reply, 'ai');
    } catch (e) {
      addMessage("Technical hiccup. Please try again.", 'ai');
    }
  }

  sendBtn.onclick = sendMessage;
  input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };

  fetch(`${baseUrl}/api/widget/config?id=${workspaceId}`)
    .then(r => r.json())
    .then(d => {
      config = d;
      if (d.agent_name) {
        document.getElementById('fc-agent-name').innerText = d.agent_name;
        document.getElementById('fc-avatar').innerText = d.agent_name.charAt(0);
      }
      if (d.enable_whatsapp) {
        whatsappLink.classList.add('active');
        whatsappLink.href = d.whatsapp_number ? `https://wa.me/${d.whatsapp_number.replace(/[^0-9]/g, '')}` : '#';
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
          .then(({ messages }) => {
            if (messages?.length) {
              messages.forEach(m => addMessage(m.content, m.role === 'customer' ? 'user' : 'ai'));
            }
          })
          .catch(() => {});
      }
    });
})();
