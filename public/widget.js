(function () {
  'use strict';

  var SCRIPT = document.currentScript || document.querySelector('script[data-workspace]');
  var WORKSPACE_ID = SCRIPT ? SCRIPT.getAttribute('data-workspace') : null;
  var BASE = SCRIPT ? SCRIPT.src.substring(0, SCRIPT.src.lastIndexOf('/')) : '';
  var SESSION_KEY = 'fw_sesh_' + WORKSPACE_ID;
  var POLL_INTERVAL = 3000;
  var pollTimer = null;
  var lastPoll = null;

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  var sessionToken;
  try { sessionToken = sessionStorage.getItem(SESSION_KEY) || uuid(); } catch(e) { sessionToken = uuid(); }

  var state = { config: null, open: false, messages: [], loading: false, sending: false };
  var els = {};

  function q(s) { return document.querySelector(s); }
  function ce(t) { return document.createElement(t); }

  function css() {
    return (
      '#fw-b { position:fixed;bottom:24px;right:24px;z-index:999999;border:none;cursor:pointer;width:52px;height:52px;border-radius:100%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,.14);transition:transform .2s,box-shadow .2s;font-family:Inter,system-ui,sans-serif;color:#fff; }' +
      '#fw-b:hover { transform:scale(1.05);box-shadow:0 6px 28px rgba(0,0,0,.18); }' +
      '#fw-b svg { width:22px;height:22px; }' +
      '#fw-av svg { color:#fff; }' +
      '#fw-p { position:fixed;bottom:86px;right:24px;z-index:999999;width:380px;max-width:calc(100vw - 48px);height:560px;max-height:calc(100vh - 120px);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.1);border:1px solid rgba(0,0,0,.05);opacity:0;transform:translateY(12px) scale(.97);pointer-events:none;transition:all .22s ease;font-family:Inter,system-ui,sans-serif; }' +
      '#fw-p.open { opacity:1;transform:translateY(0) scale(1);pointer-events:auto; }' +
      '#fw-hdr { padding:16px 20px;display:flex;align-items:center;gap:10px; }' +
      '#fw-av { width:30px;height:30px;border-radius:100%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:14px; }' +
      '#fw-hdr-txt { flex:1;font-size:14px;font-weight:600;color:#fff;letter-spacing:-0.01em; }' +
      '#fw-cls { background:none;border:none;color:rgba(255,255,255,.7);cursor:pointer;padding:4px;border-radius:6px; }' +
      '#fw-cls:hover { background:rgba(255,255,255,.15); }' +
      '#fw-body { flex:1;overflow-y:auto;padding:16px;background:#f6f7f9; }' +
      '#fw-msgs { display:flex;flex-direction:column;gap:8px;min-height:100%; }' +
      '.fw-msg { max-width:82%;padding:8px 12px;border-radius:12px;font-size:13px;line-height:1.5;word-wrap:break-word; }' +
      '.fw-msg.bot { align-self:flex-start;background:#fff;color:#222;border:1px solid #e8eaed;border-bottom-left-radius:4px; }' +
      '.fw-msg.user { align-self:flex-end;color:#fff;background:var(--fw-color);border-bottom-right-radius:4px; }' +
      '.fw-msg-typing { align-self:flex-start;background:#fff;color:#888;border:1px solid #e8eaed;border-radius:12px;padding:8px 14px;font-size:13px;display:flex;gap:4px;align-items:center; }' +
      '.fw-msg-typing span { animation:fw-dot 1.4s infinite; }' +
      '.fw-msg-typing span:nth-child(2) { animation-delay:.2s; }' +
      '.fw-msg-typing span:nth-child(3) { animation-delay:.4s; }' +
      '@keyframes fw-dot { 0%,60%,100% { opacity:.3; } 30% { opacity:1; } }' +
      '#fw-foot { padding:10px 14px;background:#fff;border-top:1px solid #eee; }' +
      '#fw-inner { display:flex;gap:6px;align-items:flex-end; }' +
      '#fw-inp { flex:1;border:1px solid #e0e2e6;border-radius:8px;padding:7px 10px;font-size:13px;outline:none;font-family:inherit;resize:none;min-height:32px;max-height:96px;line-height:1.4; }' +
      '#fw-inp:focus { border-color:var(--fw-color); }' +
      '#fw-send { border:none;border-radius:8px;color:#fff;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:opacity .15s;flex-shrink:0; }' +
      '#fw-send:disabled { opacity:.4;cursor:default; }' +
      '#fw-send svg { width:14px;height:14px; }' +
      '.fw-hide { display:none !important; }'
    );
  }

  function svgBubble() {
    return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  }

  function svgClose() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>';
  }

  function svgBubbleSmall() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  }

  function svgSend() {
    return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7"/></svg>';
  }

  function build() {
    var style = ce('style');
    style.textContent = css();
    document.head.appendChild(style);

    var bubble = ce('button');
    bubble.id = 'fw-b';
    bubble.innerHTML = svgBubble();
    bubble.addEventListener('click', toggle);

    var panel = ce('div');
    panel.id = 'fw-p';

    var hdr = ce('div');
    hdr.id = 'fw-hdr';
    hdr.innerHTML =
      '<div id="fw-av">' + svgBubbleSmall() + '</div>' +
      '<div id="fw-hdr-txt">' + (state.config.agent_name || 'Support') + '</div>' +
      '<button id="fw-cls">' + svgClose() + '</button>';
    hdr.querySelector('#fw-cls').addEventListener('click', toggle);

    var body = ce('div');
    body.id = 'fw-body';
    var msgsDiv = ce('div');
    msgsDiv.id = 'fw-msgs';
    body.appendChild(msgsDiv);

    var foot = ce('div');
    foot.id = 'fw-foot';
    foot.innerHTML =
      '<div id="fw-inner">' +
      '<textarea id="fw-inp" placeholder="Type a message..." rows="1"></textarea>' +
      '<button id="fw-send" disabled>' + svgSend() + '</button>' +
      '</div>';

    panel.appendChild(hdr);
    panel.appendChild(body);
    panel.appendChild(foot);

    document.body.appendChild(bubble);
    document.body.appendChild(panel);

    els.bubble = bubble;
    els.panel = panel;
    els.msgs = msgsDiv;
    els.inp = document.getElementById('fw-inp');
    els.send = document.getElementById('fw-send');

    els.inp.addEventListener('input', resizeInput);
    els.inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
    });
    els.send.addEventListener('click', sendMsg);

    showGreeting();
  }

  function resizeInput() {
    els.inp.style.height = 'auto';
    els.inp.style.height = Math.min(els.inp.scrollHeight, 96) + 'px';
  }

  function applyTheme() {
    var c = state.config.accent_color || '#D95E46';
    document.documentElement.style.setProperty('--fw-color', c);
    document.getElementById('fw-b').style.background = c;
    document.getElementById('fw-hdr').style.background = c;
    document.getElementById('fw-send').style.background = c;
    if (els.inp) els.inp.style.setProperty('--fw-color', c, 'important');
    var headerTxt = document.getElementById('fw-hdr-txt');
    if (headerTxt) headerTxt.textContent = state.config.agent_name || 'Support';
  }

  function showGreeting() {
    var msg = state.config.greeting || 'Hi! How can I help you today?';
    addMsg(msg, 'bot');
  }

  function addMsg(text, role) {
    var div = ce('div');
    div.className = 'fw-msg ' + role;
    div.textContent = text;
    els.msgs.appendChild(div);
    scrollBottom();
  }

  function showTyping() {
    var div = ce('div');
    div.className = 'fw-msg-typing';
    div.id = 'fw-typing';
    div.innerHTML = '<span>●</span><span>●</span><span>●</span>';
    els.msgs.appendChild(div);
    scrollBottom();
  }

  function hideTyping() {
    var t = document.getElementById('fw-typing');
    if (t) t.remove();
  }

  function scrollBottom() {
    var body = document.getElementById('fw-body');
    if (body) body.scrollTop = body.scrollHeight;
  }

  function toggle() {
    state.open = !state.open;
    els.panel.classList.toggle('open', state.open);
    if (state.open) { scrollBottom(); loadHistory(); startPoll(); } else { stopPoll(); }
  }

  function loadHistory() {
    fetchMessages(null, function (data) {
      if (data && data.messages) processIncoming(data.messages);
    });
  }

  function fetchMessages(since, cb) {
    var url = BASE + '/api/widget/message?workspace_id=' + encodeURIComponent(WORKSPACE_ID) + '&session_token=' + encodeURIComponent(sessionToken);
    if (since) url += '&since=' + encodeURIComponent(since);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try { cb(JSON.parse(xhr.responseText)); } catch (_) { cb(null); }
      } else { cb(null); }
    };
    xhr.onerror = function () { cb(null); };
    xhr.send();
  }

  function processIncoming(msgs) {
    if (!msgs || !msgs.length) return;
    var existing = els.msgs.querySelectorAll('.fw-msg.user, .fw-msg.bot');
    var known = {};
    existing.forEach(function (el) { known[el.textContent + ' ' + el.className] = true; });
    var newCount = 0;
    msgs.forEach(function (m) {
      var key = m.content + (m.role === 'customer' ? ' fw-msg user' : ' fw-msg bot');
      if (known[key]) return;
      if (m.role === 'system') return;
      addMsg(m.content, m.role === 'customer' ? 'user' : 'bot');
      newCount++;
    });
    if (newCount > 0 && msgs.length > 0) {
      var last = msgs[msgs.length - 1];
      lastPoll = last.created_at;
    }
  }

  function poll() {
    if (!state.open) return;
    fetchMessages(lastPoll, function (data) {
      if (data && data.messages) processIncoming(data.messages);
    });
  }

  function startPoll() {
    stopPoll();
    pollTimer = setInterval(poll, POLL_INTERVAL);
  }

  function stopPoll() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  function sendMsg() {
    var text = els.inp.value.trim();
    if (!text || state.sending) return;
    els.inp.value = '';
    resizeInput();
    els.send.disabled = true;

    addMsg(text, 'user');
    showTyping();
    state.sending = true;

    var xhr = new XMLHttpRequest();
    xhr.open('POST', BASE + '/api/widget/message');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      state.sending = false;
      hideTyping();
      els.send.disabled = false;
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (data.reply) {
            var dup = false;
            var existingMsgs = els.msgs.querySelectorAll('.fw-msg.bot');
            existingMsgs.forEach(function (el) { if (el.textContent === data.reply) dup = true; });
            if (!dup) addMsg(data.reply, 'bot');
            lastPoll = new Date().toISOString();
          }
        } catch (_) { /* ignore parse errors */ }
      } else {
        addMsg('Sorry, something went wrong. Please try again.', 'bot');
      }
    };
    xhr.onerror = function () {
      state.sending = false;
      hideTyping();
      els.send.disabled = false;
      addMsg('Connection error. Please check your internet.', 'bot');
    };
    xhr.send(JSON.stringify({
      workspace_id: WORKSPACE_ID,
      session_token: sessionToken,
      message: text
    }));
  }

  function fetchConfig(cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', BASE + '/api/widget/config?id=' + WORKSPACE_ID);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try { cb(JSON.parse(xhr.responseText)); } catch (_) { cb(null); }
      } else { cb(null); }
    };
    xhr.onerror = function () { cb(null); };
    xhr.send();
  }

  function init() {
    if (!WORKSPACE_ID) {
      console.warn('[FlowWidget] Missing data-workspace attribute on script tag.');
      return;
    }
    try { sessionStorage.setItem(SESSION_KEY, sessionToken); } catch(e) {}
    fetchConfig(function (cfg) {
      if (!cfg) cfg = {};
      state.config = cfg;
      build();
      applyTheme();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
