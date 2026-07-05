// deno:https://esm.sh/tslib@2.8.1/denonext/tslib.mjs
function S(e, t) {
  var r = {};
  for (var n3 in e) Object.prototype.hasOwnProperty.call(e, n3) && t.indexOf(n3) < 0 && (r[n3] = e[n3]);
  if (e != null && typeof Object.getOwnPropertySymbols == "function") for (var i4 = 0, n3 = Object.getOwnPropertySymbols(e); i4 < n3.length; i4++) t.indexOf(n3[i4]) < 0 && Object.prototype.propertyIsEnumerable.call(e, n3[i4]) && (r[n3[i4]] = e[n3[i4]]);
  return r;
}
function F(e, t, r, n3) {
  function i4(o3) {
    return o3 instanceof r ? o3 : new r(function(a) {
      a(o3);
    });
  }
  return new (r || (r = Promise))(function(o3, a) {
    function f4(s) {
      try {
        c3(n3.next(s));
      } catch (l) {
        a(l);
      }
    }
    function p4(s) {
      try {
        c3(n3.throw(s));
      } catch (l) {
        a(l);
      }
    }
    function c3(s) {
      s.done ? o3(s.value) : i4(s.value).then(f4, p4);
    }
    c3((n3 = n3.apply(e, t || [])).next());
  });
}

// deno:https://esm.sh/@supabase/auth-js@2.108.1/denonext/auth-js.mjs
var de = "2.108.1";
var q = 30 * 1e3;
var ee = 3;
var fe = ee * q;
var Ge = "http://localhost:9999";
var Be = "supabase.auth.token";
var Fe = {
  "X-Client-Info": `gotrue-js/${de}`
};
var se = "X-Supabase-Api-Version";
var Ae = {
  "2024-01-01": {
    timestamp: Date.parse("2024-01-01T00:00:00.0Z"),
    name: "2024-01-01"
  }
};
var ze = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i;
var Ve = 600 * 1e3;
var M = class extends Error {
  constructor(e, t, r) {
    super(e), this.__isAuthError = true, this.name = "AuthError", this.status = t, this.code = r;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code
    };
  }
};
function h(i4) {
  return typeof i4 == "object" && i4 !== null && "__isAuthError" in i4;
}
var _e = class extends M {
  constructor(e, t, r) {
    super(e, t, r), this.name = "AuthApiError", this.status = t, this.code = r;
  }
};
function Je(i4) {
  return h(i4) && i4.name === "AuthApiError";
}
var x = class extends M {
  constructor(e, t) {
    super(e), this.name = "AuthUnknownError", this.originalError = t;
  }
};
var C = class extends M {
  constructor(e, t, r, s) {
    super(e, r, s), this.name = t, this.status = r;
  }
};
var E = class extends C {
  constructor() {
    super("Auth session missing!", "AuthSessionMissingError", 400, void 0);
  }
};
function ae(i4) {
  return h(i4) && i4.name === "AuthSessionMissingError";
}
var K = class extends C {
  constructor() {
    super("Auth session or user missing", "AuthInvalidTokenResponseError", 500, void 0);
  }
};
var J = class extends C {
  constructor(e) {
    super(e, "AuthInvalidCredentialsError", 400, void 0);
  }
};
var H = class extends C {
  constructor(e, t = null) {
    super(e, "AuthImplicitGrantRedirectError", 500, void 0), this.details = null, this.details = t;
  }
  toJSON() {
    return Object.assign(Object.assign({}, super.toJSON()), {
      details: this.details
    });
  }
};
function He(i4) {
  return h(i4) && i4.name === "AuthImplicitGrantRedirectError";
}
var ie = class extends C {
  constructor(e, t = null) {
    super(e, "AuthPKCEGrantCodeExchangeError", 500, void 0), this.details = null, this.details = t;
  }
  toJSON() {
    return Object.assign(Object.assign({}, super.toJSON()), {
      details: this.details
    });
  }
};
var ge = class extends C {
  constructor() {
    super("PKCE code verifier not found in storage. This can happen if the auth flow was initiated in a different browser or device, or if the storage was cleared. For SSR frameworks (Next.js, SvelteKit, etc.), use @supabase/ssr on both the server and client to store the code verifier in cookies.", "AuthPKCECodeVerifierMissingError", 400, "pkce_code_verifier_not_found");
  }
};
var te = class extends C {
  constructor(e, t) {
    super(e, "AuthRetryableFetchError", t, void 0);
  }
};
function we(i4) {
  return h(i4) && i4.name === "AuthRetryableFetchError";
}
var ne = class extends C {
  constructor(e = "Refresh result discarded: session state changed mid-flight (e.g., concurrent signOut)") {
    super(e, "AuthRefreshDiscardedError", 409, void 0);
  }
};
function Ye(i4) {
  return h(i4) && i4.name === "AuthRefreshDiscardedError";
}
var oe = class extends C {
  constructor(e, t, r) {
    super(e, "AuthWeakPasswordError", t, "weak_password"), this.reasons = r;
  }
  toJSON() {
    return Object.assign(Object.assign({}, super.toJSON()), {
      reasons: this.reasons
    });
  }
};
var G = class extends C {
  constructor(e) {
    super(e, "AuthInvalidJwtError", 400, "invalid_jwt");
  }
};
var pe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split("");
var Xe = ` 	
\r=`.split("");
var Rt = (() => {
  let i4 = new Array(128);
  for (let e = 0; e < i4.length; e += 1) i4[e] = -1;
  for (let e = 0; e < Xe.length; e += 1) i4[Xe[e].charCodeAt(0)] = -2;
  for (let e = 0; e < pe.length; e += 1) i4[pe[e].charCodeAt(0)] = e;
  return i4;
})();
function Ze(i4, e, t) {
  if (i4 !== null) for (e.queue = e.queue << 8 | i4, e.queuedBits += 8; e.queuedBits >= 6; ) {
    let r = e.queue >> e.queuedBits - 6 & 63;
    t(pe[r]), e.queuedBits -= 6;
  }
  else if (e.queuedBits > 0) for (e.queue = e.queue << 6 - e.queuedBits, e.queuedBits = 6; e.queuedBits >= 6; ) {
    let r = e.queue >> e.queuedBits - 6 & 63;
    t(pe[r]), e.queuedBits -= 6;
  }
}
function Qe(i4, e, t) {
  let r = Rt[i4];
  if (r > -1) for (e.queue = e.queue << 6 | r, e.queuedBits += 6; e.queuedBits >= 8; ) t(e.queue >> e.queuedBits - 8 & 255), e.queuedBits -= 8;
  else {
    if (r === -2) return;
    throw new Error(`Invalid Base64-URL character "${String.fromCharCode(i4)}"`);
  }
}
function Te(i4) {
  let e = [], t = (o3) => {
    e.push(String.fromCodePoint(o3));
  }, r = {
    utf8seq: 0,
    codepoint: 0
  }, s = {
    queue: 0,
    queuedBits: 0
  }, n3 = (o3) => {
    At(o3, r, t);
  };
  for (let o3 = 0; o3 < i4.length; o3 += 1) Qe(i4.charCodeAt(o3), s, n3);
  return e.join("");
}
function St(i4, e) {
  if (i4 <= 127) {
    e(i4);
    return;
  } else if (i4 <= 2047) {
    e(192 | i4 >> 6), e(128 | i4 & 63);
    return;
  } else if (i4 <= 65535) {
    e(224 | i4 >> 12), e(128 | i4 >> 6 & 63), e(128 | i4 & 63);
    return;
  } else if (i4 <= 1114111) {
    e(240 | i4 >> 18), e(128 | i4 >> 12 & 63), e(128 | i4 >> 6 & 63), e(128 | i4 & 63);
    return;
  }
  throw new Error(`Unrecognized Unicode codepoint: ${i4.toString(16)}`);
}
function Et(i4, e) {
  for (let t = 0; t < i4.length; t += 1) {
    let r = i4.charCodeAt(t);
    if (r > 55295 && r <= 56319) {
      let s = (r - 55296) * 1024 & 65535;
      r = (i4.charCodeAt(t + 1) - 56320 & 65535 | s) + 65536, t += 1;
    }
    St(r, e);
  }
}
function At(i4, e, t) {
  if (e.utf8seq === 0) {
    if (i4 <= 127) {
      t(i4);
      return;
    }
    for (let r = 1; r < 6; r += 1) if ((i4 >> 7 - r & 1) === 0) {
      e.utf8seq = r;
      break;
    }
    if (e.utf8seq === 2) e.codepoint = i4 & 31;
    else if (e.utf8seq === 3) e.codepoint = i4 & 15;
    else if (e.utf8seq === 4) e.codepoint = i4 & 7;
    else throw new Error("Invalid UTF-8 sequence");
    e.utf8seq -= 1;
  } else if (e.utf8seq > 0) {
    if (i4 <= 127) throw new Error("Invalid UTF-8 sequence");
    e.codepoint = e.codepoint << 6 | i4 & 63, e.utf8seq -= 1, e.utf8seq === 0 && t(e.codepoint);
  }
}
function B(i4) {
  let e = [], t = {
    queue: 0,
    queuedBits: 0
  }, r = (s) => {
    e.push(s);
  };
  for (let s = 0; s < i4.length; s += 1) Qe(i4.charCodeAt(s), t, r);
  return new Uint8Array(e);
}
function et(i4) {
  let e = [];
  return Et(i4, (t) => e.push(t)), new Uint8Array(e);
}
function W(i4) {
  let e = [], t = {
    queue: 0,
    queuedBits: 0
  }, r = (s) => {
    e.push(s);
  };
  return i4.forEach((s) => Ze(s, t, r)), Ze(null, t, r), e.join("");
}
function tt(i4) {
  return Math.round(Date.now() / 1e3) + i4;
}
function rt() {
  return Symbol("auth-callback");
}
var T = () => typeof globalThis < "u" && typeof document < "u";
var Y = {
  tested: false,
  writable: false
};
var ye = () => {
  if (!T()) return false;
  try {
    if (typeof globalThis.localStorage != "object") return false;
  } catch {
    return false;
  }
  if (Y.tested) return Y.writable;
  let i4 = `lswt-${Math.random()}${Math.random()}`;
  try {
    globalThis.localStorage.setItem(i4, i4), globalThis.localStorage.removeItem(i4), Y.tested = true, Y.writable = true;
  } catch {
    Y.tested = true, Y.writable = false;
  }
  return Y.writable;
};
function st(i4) {
  let e = {}, t = new URL(i4);
  if (t.hash && t.hash[0] === "#") try {
    new URLSearchParams(t.hash.substring(1)).forEach((s, n3) => {
      e[n3] = s;
    });
  } catch {
  }
  return t.searchParams.forEach((r, s) => {
    e[s] = r;
  }), e;
}
var ve = (i4) => i4 ? (...e) => i4(...e) : (...e) => fetch(...e);
var it = (i4) => typeof i4 == "object" && i4 !== null && "status" in i4 && "ok" in i4 && "json" in i4 && typeof i4.json == "function";
var X = async (i4, e, t) => {
  await i4.setItem(e, JSON.stringify(t));
};
var $ = async (i4, e) => {
  let t = await i4.getItem(e);
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
};
var A = async (i4, e) => {
  await i4.removeItem(e);
};
var le = class i {
  constructor() {
    this.promise = new i.promiseConstructor((e, t) => {
      this.resolve = e, this.reject = t;
    });
  }
};
le.promiseConstructor = Promise;
function ue(i4) {
  let e = i4.split(".");
  if (e.length !== 3) throw new G("Invalid JWT structure");
  for (let r = 0; r < e.length; r++) if (!ze.test(e[r])) throw new G("JWT not in base64url format");
  return {
    header: JSON.parse(Te(e[0])),
    payload: JSON.parse(Te(e[1])),
    signature: B(e[2]),
    raw: {
      header: e[0],
      payload: e[1]
    }
  };
}
async function nt(i4) {
  return await new Promise((e) => {
    setTimeout(() => e(null), i4);
  });
}
function ot(i4, e) {
  return new Promise((r, s) => {
    (async () => {
      for (let n3 = 0; n3 < 1 / 0; n3++) try {
        let o3 = await i4(n3);
        if (!e(n3, null, o3)) {
          r(o3);
          return;
        }
      } catch (o3) {
        if (!e(n3, o3)) {
          s(o3);
          return;
        }
      }
    })();
  });
}
function Tt(i4) {
  return ("0" + i4.toString(16)).substr(-2);
}
function It() {
  let e = new Uint32Array(56);
  if (typeof crypto > "u") {
    let t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~", r = t.length, s = "";
    for (let n3 = 0; n3 < 56; n3++) s += t.charAt(Math.floor(Math.random() * r));
    return s;
  }
  return crypto.getRandomValues(e), Array.from(e, Tt).join("");
}
async function xt(i4) {
  let t = new TextEncoder().encode(i4), r = await crypto.subtle.digest("SHA-256", t), s = new Uint8Array(r);
  return Array.from(s).map((n3) => String.fromCharCode(n3)).join("");
}
async function Ot(i4) {
  if (!(typeof crypto < "u" && typeof crypto.subtle < "u" && typeof TextEncoder < "u")) return console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256."), i4;
  let t = await xt(i4);
  return btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function F2(i4, e, t = false) {
  let r = It(), s = r;
  t && (s += "/recovery"), await X(i4, `${e}-code-verifier`, s);
  let n3 = await Ot(r);
  return [
    n3,
    r === n3 ? "plain" : "s256"
  ];
}
var Pt = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;
function at(i4) {
  let e = i4.headers.get(se);
  if (!e || !e.match(Pt)) return null;
  try {
    return /* @__PURE__ */ new Date(`${e}T00:00:00.0Z`);
  } catch {
    return null;
  }
}
function lt(i4) {
  if (!i4) throw new Error("Missing exp claim");
  let e = Math.floor(Date.now() / 1e3);
  if (i4 <= e) throw new Error("JWT has expired");
}
function ut(i4) {
  switch (i4) {
    case "RS256":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-256"
        }
      };
    case "ES256":
      return {
        name: "ECDSA",
        namedCurve: "P-256",
        hash: {
          name: "SHA-256"
        }
      };
    default:
      throw new Error("Invalid alg claim");
  }
}
var Ct = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function N(i4) {
  if (!Ct.test(i4)) throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not");
}
function O(i4) {
  if (!i4.passkey) throw new Error("@supabase/auth-js: the passkey API is experimental and disabled by default. Enable it by passing `auth: { experimental: { passkey: true } }` to createClient (or to the GoTrueClient constructor).");
}
function be() {
  let i4 = {};
  return new Proxy(i4, {
    get: (e, t) => {
      if (t === "__isUserNotAvailableProxy") return true;
      if (typeof t == "symbol") {
        let r = t.toString();
        if (r === "Symbol(Symbol.toPrimitive)" || r === "Symbol(Symbol.toStringTag)" || r === "Symbol(util.inspect.custom)") return;
      }
      throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Accessing the "${t}" property of the session object is not supported. Please use getUser() instead.`);
    },
    set: (e, t) => {
      throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Setting the "${t}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
    },
    deleteProperty: (e, t) => {
      throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Deleting the "${t}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
    }
  });
}
function ct(i4, e) {
  return new Proxy(i4, {
    get: (t, r, s) => {
      if (r === "__isInsecureUserWarningProxy") return true;
      if (typeof r == "symbol") {
        let n3 = r.toString();
        if (n3 === "Symbol(Symbol.toPrimitive)" || n3 === "Symbol(Symbol.toStringTag)" || n3 === "Symbol(util.inspect.custom)" || n3 === "Symbol(nodejs.util.inspect.custom)") return Reflect.get(t, r, s);
      }
      return !e.value && typeof r == "string" && (console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server."), e.value = true), Reflect.get(t, r, s);
    }
  });
}
function Ie(i4) {
  return JSON.parse(JSON.stringify(i4));
}
var Z = (i4) => {
  if (typeof i4 == "object" && i4 !== null) {
    let e = i4;
    if (typeof e.msg == "string") return e.msg;
    if (typeof e.message == "string") return e.message;
    if (typeof e.error_description == "string") return e.error_description;
    if (typeof e.error == "string") return e.error;
  }
  return JSON.stringify(i4);
};
var Ut = [
  502,
  503,
  504,
  520,
  521,
  522,
  523,
  524,
  530
];
async function ht(i4) {
  var e;
  if (!it(i4)) throw new te(Z(i4), 0);
  if (Ut.includes(i4.status)) throw new te(Z(i4), i4.status);
  let t;
  try {
    t = await i4.json();
  } catch (n3) {
    throw new x(Z(n3), n3);
  }
  let r, s = at(i4);
  if (s && s.getTime() >= Ae["2024-01-01"].timestamp && typeof t == "object" && t && typeof t.code == "string" ? r = t.code : typeof t == "object" && t && typeof t.error_code == "string" && (r = t.error_code), r) {
    if (r === "weak_password") throw new oe(Z(t), i4.status, ((e = t.weak_password) === null || e === void 0 ? void 0 : e.reasons) || []);
    if (r === "session_not_found") throw new E();
  } else if (typeof t == "object" && t && typeof t.weak_password == "object" && t.weak_password && Array.isArray(t.weak_password.reasons) && t.weak_password.reasons.length && t.weak_password.reasons.reduce((n3, o3) => n3 && typeof o3 == "string", true)) throw new oe(Z(t), i4.status, t.weak_password.reasons);
  throw new _e(Z(t), i4.status || 500, r);
}
var $t = (i4, e, t, r) => {
  let s = {
    method: i4,
    headers: e?.headers || {}
  };
  return i4 === "GET" ? s : (s.headers = Object.assign({
    "Content-Type": "application/json;charset=UTF-8"
  }, e?.headers), s.body = JSON.stringify(r), Object.assign(Object.assign({}, s), t));
};
async function f(i4, e, t, r) {
  var s;
  let n3 = Object.assign({}, r?.headers);
  n3[se] || (n3[se] = Ae["2024-01-01"].name), r?.jwt && (n3.Authorization = `Bearer ${r.jwt}`);
  let o3 = (s = r?.query) !== null && s !== void 0 ? s : {};
  r?.redirectTo && (o3.redirect_to = r.redirectTo);
  let a = Object.keys(o3).length ? "?" + new URLSearchParams(o3).toString() : "", l = await Nt(i4, e, t + a, {
    headers: n3,
    noResolveJson: r?.noResolveJson
  }, {}, r?.body);
  return r?.xform ? r?.xform(l) : {
    data: Object.assign({}, l),
    error: null
  };
}
async function Nt(i4, e, t, r, s, n3) {
  let o3 = $t(e, r, s, n3), a;
  try {
    a = await i4(t, Object.assign({}, o3));
  } catch (l) {
    throw console.error(l), new te(Z(l), 0);
  }
  if (a.ok || await ht(a), r?.noResolveJson) return a;
  try {
    return await a.json();
  } catch (l) {
    await ht(l);
  }
}
function P(i4) {
  var e;
  let t = null;
  Lt(i4) && (t = Object.assign({}, i4), i4.expires_at || (t.expires_at = tt(i4.expires_in)));
  let r = (e = i4.user) !== null && e !== void 0 ? e : typeof i4?.id == "string" ? i4 : null;
  return {
    data: {
      session: t,
      user: r
    },
    error: null
  };
}
function xe(i4) {
  let e = P(i4);
  return !e.error && i4.weak_password && typeof i4.weak_password == "object" && Array.isArray(i4.weak_password.reasons) && i4.weak_password.reasons.length && i4.weak_password.message && typeof i4.weak_password.message == "string" && i4.weak_password.reasons.reduce((t, r) => t && typeof r == "string", true) && (e.data.weak_password = i4.weak_password), e;
}
function L(i4) {
  var e;
  return {
    data: {
      user: (e = i4.user) !== null && e !== void 0 ? e : i4
    },
    error: null
  };
}
function dt(i4) {
  return {
    data: i4,
    error: null
  };
}
function ft(i4) {
  let { action_link: e, email_otp: t, hashed_token: r, redirect_to: s, verification_type: n3 } = i4, o3 = S(i4, [
    "action_link",
    "email_otp",
    "hashed_token",
    "redirect_to",
    "verification_type"
  ]), a = {
    action_link: e,
    email_otp: t,
    hashed_token: r,
    redirect_to: s,
    verification_type: n3
  }, l = Object.assign({}, o3);
  return {
    data: {
      properties: a,
      user: l
    },
    error: null
  };
}
function Oe(i4) {
  return i4;
}
function Lt(i4) {
  return !!i4.access_token && !!i4.refresh_token && !!i4.expires_in;
}
var me = [
  "global",
  "local",
  "others"
];
var z = class {
  constructor({ url: e = "", headers: t = {}, fetch: r, experimental: s }) {
    this.url = e, this.headers = t, this.fetch = ve(r), this.experimental = s ?? {}, this.mfa = {
      listFactors: this._listFactors.bind(this),
      deleteFactor: this._deleteFactor.bind(this)
    }, this.oauth = {
      listClients: this._listOAuthClients.bind(this),
      createClient: this._createOAuthClient.bind(this),
      getClient: this._getOAuthClient.bind(this),
      updateClient: this._updateOAuthClient.bind(this),
      deleteClient: this._deleteOAuthClient.bind(this),
      regenerateClientSecret: this._regenerateOAuthClientSecret.bind(this)
    }, this.customProviders = {
      listProviders: this._listCustomProviders.bind(this),
      createProvider: this._createCustomProvider.bind(this),
      getProvider: this._getCustomProvider.bind(this),
      updateProvider: this._updateCustomProvider.bind(this),
      deleteProvider: this._deleteCustomProvider.bind(this)
    }, this.passkey = {
      listPasskeys: this._adminListPasskeys.bind(this),
      deletePasskey: this._adminDeletePasskey.bind(this)
    };
  }
  async signOut(e, t = me[0]) {
    if (me.indexOf(t) < 0) throw new Error(`@supabase/auth-js: Parameter scope must be one of ${me.join(", ")}`);
    try {
      return await f(this.fetch, "POST", `${this.url}/logout?scope=${t}`, {
        headers: this.headers,
        jwt: e,
        noResolveJson: true
      }), {
        data: null,
        error: null
      };
    } catch (r) {
      if (h(r)) return {
        data: null,
        error: r
      };
      throw r;
    }
  }
  async inviteUserByEmail(e, t = {}) {
    try {
      return await f(this.fetch, "POST", `${this.url}/invite`, {
        body: {
          email: e,
          data: t.data
        },
        headers: this.headers,
        redirectTo: t.redirectTo,
        xform: L
      });
    } catch (r) {
      if (h(r)) return {
        data: {
          user: null
        },
        error: r
      };
      throw r;
    }
  }
  async generateLink(e) {
    try {
      let { options: t } = e, r = S(e, [
        "options"
      ]), s = Object.assign(Object.assign({}, r), t);
      return "newEmail" in r && (s.new_email = r?.newEmail, delete s.newEmail), await f(this.fetch, "POST", `${this.url}/admin/generate_link`, {
        body: s,
        headers: this.headers,
        xform: ft,
        redirectTo: t?.redirectTo
      });
    } catch (t) {
      if (h(t)) return {
        data: {
          properties: null,
          user: null
        },
        error: t
      };
      throw t;
    }
  }
  async createUser(e) {
    try {
      return await f(this.fetch, "POST", `${this.url}/admin/users`, {
        body: e,
        headers: this.headers,
        xform: L
      });
    } catch (t) {
      if (h(t)) return {
        data: {
          user: null
        },
        error: t
      };
      throw t;
    }
  }
  async listUsers(e) {
    var t, r, s, n3, o3, a, l;
    try {
      let u4 = {
        nextPage: null,
        lastPage: 0,
        total: 0
      }, c3 = await f(this.fetch, "GET", `${this.url}/admin/users`, {
        headers: this.headers,
        noResolveJson: true,
        query: {
          page: (r = (t = e?.page) === null || t === void 0 ? void 0 : t.toString()) !== null && r !== void 0 ? r : "",
          per_page: (n3 = (s = e?.perPage) === null || s === void 0 ? void 0 : s.toString()) !== null && n3 !== void 0 ? n3 : ""
        },
        xform: Oe
      });
      if (c3.error) throw c3.error;
      let w6 = await c3.json(), d2 = (o3 = c3.headers.get("x-total-count")) !== null && o3 !== void 0 ? o3 : 0, _6 = (l = (a = c3.headers.get("link")) === null || a === void 0 ? void 0 : a.split(",")) !== null && l !== void 0 ? l : [];
      return _6.length > 0 && (_6.forEach((v4) => {
        let b3 = parseInt(v4.split(";")[0].split("=")[1].substring(0, 1)), y4 = JSON.parse(v4.split(";")[1].split("=")[1]);
        u4[`${y4}Page`] = b3;
      }), u4.total = parseInt(d2)), {
        data: Object.assign(Object.assign({}, w6), u4),
        error: null
      };
    } catch (u4) {
      if (h(u4)) return {
        data: {
          users: []
        },
        error: u4
      };
      throw u4;
    }
  }
  async getUserById(e) {
    N(e);
    try {
      return await f(this.fetch, "GET", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        xform: L
      });
    } catch (t) {
      if (h(t)) return {
        data: {
          user: null
        },
        error: t
      };
      throw t;
    }
  }
  async updateUserById(e, t) {
    N(e);
    try {
      return await f(this.fetch, "PUT", `${this.url}/admin/users/${e}`, {
        body: t,
        headers: this.headers,
        xform: L
      });
    } catch (r) {
      if (h(r)) return {
        data: {
          user: null
        },
        error: r
      };
      throw r;
    }
  }
  async deleteUser(e, t = false) {
    N(e);
    try {
      return await f(this.fetch, "DELETE", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        body: {
          should_soft_delete: t
        },
        xform: L
      });
    } catch (r) {
      if (h(r)) return {
        data: {
          user: null
        },
        error: r
      };
      throw r;
    }
  }
  async _listFactors(e) {
    N(e.userId);
    try {
      let { data: t, error: r } = await f(this.fetch, "GET", `${this.url}/admin/users/${e.userId}/factors`, {
        headers: this.headers,
        xform: (s) => ({
          data: {
            factors: s
          },
          error: null
        })
      });
      return {
        data: t,
        error: r
      };
    } catch (t) {
      if (h(t)) return {
        data: null,
        error: t
      };
      throw t;
    }
  }
  async _deleteFactor(e) {
    N(e.userId), N(e.id);
    try {
      return {
        data: await f(this.fetch, "DELETE", `${this.url}/admin/users/${e.userId}/factors/${e.id}`, {
          headers: this.headers
        }),
        error: null
      };
    } catch (t) {
      if (h(t)) return {
        data: null,
        error: t
      };
      throw t;
    }
  }
  async _listOAuthClients(e) {
    var t, r, s, n3, o3, a, l;
    try {
      let u4 = {
        nextPage: null,
        lastPage: 0,
        total: 0
      }, c3 = await f(this.fetch, "GET", `${this.url}/admin/oauth/clients`, {
        headers: this.headers,
        noResolveJson: true,
        query: {
          page: (r = (t = e?.page) === null || t === void 0 ? void 0 : t.toString()) !== null && r !== void 0 ? r : "",
          per_page: (n3 = (s = e?.perPage) === null || s === void 0 ? void 0 : s.toString()) !== null && n3 !== void 0 ? n3 : ""
        },
        xform: Oe
      });
      if (c3.error) throw c3.error;
      let w6 = await c3.json(), d2 = (o3 = c3.headers.get("x-total-count")) !== null && o3 !== void 0 ? o3 : 0, _6 = (l = (a = c3.headers.get("link")) === null || a === void 0 ? void 0 : a.split(",")) !== null && l !== void 0 ? l : [];
      return _6.length > 0 && (_6.forEach((v4) => {
        let b3 = parseInt(v4.split(";")[0].split("=")[1].substring(0, 1)), y4 = JSON.parse(v4.split(";")[1].split("=")[1]);
        u4[`${y4}Page`] = b3;
      }), u4.total = parseInt(d2)), {
        data: Object.assign(Object.assign({}, w6), u4),
        error: null
      };
    } catch (u4) {
      if (h(u4)) return {
        data: {
          clients: []
        },
        error: u4
      };
      throw u4;
    }
  }
  async _createOAuthClient(e) {
    try {
      return await f(this.fetch, "POST", `${this.url}/admin/oauth/clients`, {
        body: e,
        headers: this.headers,
        xform: (t) => ({
          data: t,
          error: null
        })
      });
    } catch (t) {
      if (h(t)) return {
        data: null,
        error: t
      };
      throw t;
    }
  }
  async _getOAuthClient(e) {
    try {
      return await f(this.fetch, "GET", `${this.url}/admin/oauth/clients/${e}`, {
        headers: this.headers,
        xform: (t) => ({
          data: t,
          error: null
        })
      });
    } catch (t) {
      if (h(t)) return {
        data: null,
        error: t
      };
      throw t;
    }
  }
  async _updateOAuthClient(e, t) {
    try {
      return await f(this.fetch, "PUT", `${this.url}/admin/oauth/clients/${e}`, {
        body: t,
        headers: this.headers,
        xform: (r) => ({
          data: r,
          error: null
        })
      });
    } catch (r) {
      if (h(r)) return {
        data: null,
        error: r
      };
      throw r;
    }
  }
  async _deleteOAuthClient(e) {
    try {
      return await f(this.fetch, "DELETE", `${this.url}/admin/oauth/clients/${e}`, {
        headers: this.headers,
        noResolveJson: true
      }), {
        data: null,
        error: null
      };
    } catch (t) {
      if (h(t)) return {
        data: null,
        error: t
      };
      throw t;
    }
  }
  async _regenerateOAuthClientSecret(e) {
    try {
      return await f(this.fetch, "POST", `${this.url}/admin/oauth/clients/${e}/regenerate_secret`, {
        headers: this.headers,
        xform: (t) => ({
          data: t,
          error: null
        })
      });
    } catch (t) {
      if (h(t)) return {
        data: null,
        error: t
      };
      throw t;
    }
  }
  async _listCustomProviders(e) {
    try {
      let t = {};
      return e?.type && (t.type = e.type), await f(this.fetch, "GET", `${this.url}/admin/custom-providers`, {
        headers: this.headers,
        query: t,
        xform: (r) => {
          var s;
          return {
            data: {
              providers: (s = r?.providers) !== null && s !== void 0 ? s : []
            },
            error: null
          };
        }
      });
    } catch (t) {
      if (h(t)) return {
        data: {
          providers: []
        },
        error: t
      };
      throw t;
    }
  }
  async _createCustomProvider(e) {
    try {
      return await f(this.fetch, "POST", `${this.url}/admin/custom-providers`, {
        body: e,
        headers: this.headers,
        xform: (t) => ({
          data: t,
          error: null
        })
      });
    } catch (t) {
      if (h(t)) return {
        data: null,
        error: t
      };
      throw t;
    }
  }
  async _getCustomProvider(e) {
    try {
      return await f(this.fetch, "GET", `${this.url}/admin/custom-providers/${e}`, {
        headers: this.headers,
        xform: (t) => ({
          data: t,
          error: null
        })
      });
    } catch (t) {
      if (h(t)) return {
        data: null,
        error: t
      };
      throw t;
    }
  }
  async _updateCustomProvider(e, t) {
    try {
      return await f(this.fetch, "PUT", `${this.url}/admin/custom-providers/${e}`, {
        body: t,
        headers: this.headers,
        xform: (r) => ({
          data: r,
          error: null
        })
      });
    } catch (r) {
      if (h(r)) return {
        data: null,
        error: r
      };
      throw r;
    }
  }
  async _deleteCustomProvider(e) {
    try {
      return await f(this.fetch, "DELETE", `${this.url}/admin/custom-providers/${e}`, {
        headers: this.headers,
        noResolveJson: true
      }), {
        data: null,
        error: null
      };
    } catch (t) {
      if (h(t)) return {
        data: null,
        error: t
      };
      throw t;
    }
  }
  async _adminListPasskeys(e) {
    O(this.experimental), N(e.userId);
    try {
      return await f(this.fetch, "GET", `${this.url}/admin/users/${e.userId}/passkeys`, {
        headers: this.headers,
        xform: (t) => ({
          data: t,
          error: null
        })
      });
    } catch (t) {
      if (h(t)) return {
        data: null,
        error: t
      };
      throw t;
    }
  }
  async _adminDeletePasskey(e) {
    O(this.experimental), N(e.userId), N(e.passkeyId);
    try {
      return await f(this.fetch, "DELETE", `${this.url}/admin/users/${e.userId}/passkeys/${e.passkeyId}`, {
        headers: this.headers,
        noResolveJson: true
      }), {
        data: null,
        error: null
      };
    } catch (t) {
      if (h(t)) return {
        data: null,
        error: t
      };
      throw t;
    }
  }
};
function Pe(i4 = {}) {
  return {
    getItem: (e) => i4[e] || null,
    setItem: (e, t) => {
      i4[e] = t;
    },
    removeItem: (e) => {
      delete i4[e];
    }
  };
}
var U = {
  debug: !!(globalThis && ye() && globalThis.localStorage && globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug") === "true")
};
var V = class extends Error {
  constructor(e) {
    super(e), this.isAcquireTimeout = true;
  }
};
function gt() {
  if (typeof globalThis != "object") try {
    Object.defineProperty(Object.prototype, "__magic__", {
      get: function() {
        return this;
      },
      configurable: true
    }), __magic__.globalThis = __magic__, delete Object.prototype.__magic__;
  } catch {
    typeof self < "u" && (self.globalThis = self);
  }
}
function je(i4) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(i4)) throw new Error(`@supabase/auth-js: Address "${i4}" is invalid.`);
  return i4.toLowerCase();
}
function wt(i4) {
  return parseInt(i4, 16);
}
function pt(i4) {
  let e = new TextEncoder().encode(i4);
  return "0x" + Array.from(e, (r) => r.toString(16).padStart(2, "0")).join("");
}
function yt(i4) {
  var e;
  let { chainId: t, domain: r, expirationTime: s, issuedAt: n3 = /* @__PURE__ */ new Date(), nonce: o3, notBefore: a, requestId: l, resources: u4, scheme: c3, uri: w6, version: d2 } = i4;
  {
    if (!Number.isInteger(t)) throw new Error(`@supabase/auth-js: Invalid SIWE message field "chainId". Chain ID must be a EIP-155 chain ID. Provided value: ${t}`);
    if (!r) throw new Error('@supabase/auth-js: Invalid SIWE message field "domain". Domain must be provided.');
    if (o3 && o3.length < 8) throw new Error(`@supabase/auth-js: Invalid SIWE message field "nonce". Nonce must be at least 8 characters. Provided value: ${o3}`);
    if (!w6) throw new Error('@supabase/auth-js: Invalid SIWE message field "uri". URI must be provided.');
    if (d2 !== "1") throw new Error(`@supabase/auth-js: Invalid SIWE message field "version". Version must be '1'. Provided value: ${d2}`);
    if (!((e = i4.statement) === null || e === void 0) && e.includes(`
`)) throw new Error(`@supabase/auth-js: Invalid SIWE message field "statement". Statement must not include '\\n'. Provided value: ${i4.statement}`);
  }
  let _6 = je(i4.address), v4 = c3 ? `${c3}://${r}` : r, b3 = i4.statement ? `${i4.statement}
` : "", y4 = `${v4} wants you to sign in with your Ethereum account:
${_6}

${b3}`, m3 = `URI: ${w6}
Version: ${d2}
Chain ID: ${t}${o3 ? `
Nonce: ${o3}` : ""}
Issued At: ${n3.toISOString()}`;
  if (s && (m3 += `
Expiration Time: ${s.toISOString()}`), a && (m3 += `
Not Before: ${a.toISOString()}`), l && (m3 += `
Request ID: ${l}`), u4) {
    let p4 = `
Resources:`;
    for (let g3 of u4) {
      if (!g3 || typeof g3 != "string") throw new Error(`@supabase/auth-js: Invalid SIWE message field "resources". Every resource must be a valid string. Provided value: ${g3}`);
      p4 += `
- ${g3}`;
    }
    m3 += p4;
  }
  return `${y4}
${m3}`;
}
var S2 = class extends Error {
  constructor({ message: e, code: t, cause: r, name: s }) {
    var n3;
    super(e, {
      cause: r
    }), this.__isWebAuthnError = true, this.name = (n3 = s ?? (r instanceof Error ? r.name : void 0)) !== null && n3 !== void 0 ? n3 : "Unknown Error", this.code = t;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code
    };
  }
};
var Q = class extends S2 {
  constructor(e, t) {
    super({
      code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
      cause: t,
      message: e
    }), this.name = "WebAuthnUnknownError", this.originalError = t;
  }
};
function vt({ error: i4, options: e }) {
  var t, r, s;
  let { publicKey: n3 } = e;
  if (!n3) throw Error("options was missing required publicKey property");
  if (i4.name === "AbortError") {
    if (e.signal instanceof AbortSignal) return new S2({
      message: "Registration ceremony was sent an abort signal",
      code: "ERROR_CEREMONY_ABORTED",
      cause: i4
    });
  } else if (i4.name === "ConstraintError") {
    if (((t = n3.authenticatorSelection) === null || t === void 0 ? void 0 : t.requireResidentKey) === true) return new S2({
      message: "Discoverable credentials were required but no available authenticator supported it",
      code: "ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT",
      cause: i4
    });
    if (e.mediation === "conditional" && ((r = n3.authenticatorSelection) === null || r === void 0 ? void 0 : r.userVerification) === "required") return new S2({
      message: "User verification was required during automatic registration but it could not be performed",
      code: "ERROR_AUTO_REGISTER_USER_VERIFICATION_FAILURE",
      cause: i4
    });
    if (((s = n3.authenticatorSelection) === null || s === void 0 ? void 0 : s.userVerification) === "required") return new S2({
      message: "User verification was required but no available authenticator supported it",
      code: "ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT",
      cause: i4
    });
  } else {
    if (i4.name === "InvalidStateError") return new S2({
      message: "The authenticator was previously registered",
      code: "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED",
      cause: i4
    });
    if (i4.name === "NotAllowedError") return new S2({
      message: i4.message,
      code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
      cause: i4
    });
    if (i4.name === "NotSupportedError") return n3.pubKeyCredParams.filter((a) => a.type === "public-key").length === 0 ? new S2({
      message: 'No entry in pubKeyCredParams was of type "public-key"',
      code: "ERROR_MALFORMED_PUBKEYCREDPARAMS",
      cause: i4
    }) : new S2({
      message: "No available authenticator supported any of the specified pubKeyCredParams algorithms",
      code: "ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG",
      cause: i4
    });
    if (i4.name === "SecurityError") {
      let o3 = globalThis.location.hostname;
      if (Ue(o3)) {
        if (n3.rp.id !== o3) return new S2({
          message: `The RP ID "${n3.rp.id}" is invalid for this domain`,
          code: "ERROR_INVALID_RP_ID",
          cause: i4
        });
      } else return new S2({
        message: `${globalThis.location.hostname} is an invalid domain`,
        code: "ERROR_INVALID_DOMAIN",
        cause: i4
      });
    } else if (i4.name === "TypeError") {
      if (n3.user.id.byteLength < 1 || n3.user.id.byteLength > 64) return new S2({
        message: "User ID was not between 1 and 64 characters",
        code: "ERROR_INVALID_USER_ID_LENGTH",
        cause: i4
      });
    } else if (i4.name === "UnknownError") return new S2({
      message: "The authenticator was unable to process the specified options, or could not create a new credential",
      code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
      cause: i4
    });
  }
  return new S2({
    message: "a Non-Webauthn related error has occurred",
    code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
    cause: i4
  });
}
function bt({ error: i4, options: e }) {
  let { publicKey: t } = e;
  if (!t) throw Error("options was missing required publicKey property");
  if (i4.name === "AbortError") {
    if (e.signal instanceof AbortSignal) return new S2({
      message: "Authentication ceremony was sent an abort signal",
      code: "ERROR_CEREMONY_ABORTED",
      cause: i4
    });
  } else {
    if (i4.name === "NotAllowedError") return new S2({
      message: i4.message,
      code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
      cause: i4
    });
    if (i4.name === "SecurityError") {
      let r = globalThis.location.hostname;
      if (Ue(r)) {
        if (t.rpId !== r) return new S2({
          message: `The RP ID "${t.rpId}" is invalid for this domain`,
          code: "ERROR_INVALID_RP_ID",
          cause: i4
        });
      } else return new S2({
        message: `${globalThis.location.hostname} is an invalid domain`,
        code: "ERROR_INVALID_DOMAIN",
        cause: i4
      });
    } else if (i4.name === "UnknownError") return new S2({
      message: "The authenticator was unable to process the specified options, or could not create a new assertion signature",
      code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
      cause: i4
    });
  }
  return new S2({
    message: "a Non-Webauthn related error has occurred",
    code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
    cause: i4
  });
}
var $e = class {
  createNewAbortSignal() {
    if (this.controller) {
      let t = new Error("Cancelling existing WebAuthn API call for new one");
      t.name = "AbortError", this.controller.abort(t);
    }
    let e = new AbortController();
    return this.controller = e, e.signal;
  }
  cancelCeremony() {
    if (this.controller) {
      let e = new Error("Manually cancelling existing WebAuthn API call");
      e.name = "AbortError", this.controller.abort(e), this.controller = void 0;
    }
  }
};
var Se = new $e();
function Ne(i4) {
  if (!i4) throw new Error("Credential creation options are required");
  if (typeof PublicKeyCredential < "u" && "parseCreationOptionsFromJSON" in PublicKeyCredential && typeof PublicKeyCredential.parseCreationOptionsFromJSON == "function") return PublicKeyCredential.parseCreationOptionsFromJSON(i4);
  let { challenge: e, user: t, excludeCredentials: r } = i4, s = S(i4, [
    "challenge",
    "user",
    "excludeCredentials"
  ]), n3 = B(e).buffer, o3 = Object.assign(Object.assign({}, t), {
    id: B(t.id).buffer
  }), a = Object.assign(Object.assign({}, s), {
    challenge: n3,
    user: o3
  });
  if (r && r.length > 0) {
    a.excludeCredentials = new Array(r.length);
    for (let l = 0; l < r.length; l++) {
      let u4 = r[l];
      a.excludeCredentials[l] = Object.assign(Object.assign({}, u4), {
        id: B(u4.id).buffer,
        type: u4.type || "public-key",
        transports: u4.transports
      });
    }
  }
  return a;
}
function Le(i4) {
  if (!i4) throw new Error("Credential request options are required");
  if (typeof PublicKeyCredential < "u" && "parseRequestOptionsFromJSON" in PublicKeyCredential && typeof PublicKeyCredential.parseRequestOptionsFromJSON == "function") return PublicKeyCredential.parseRequestOptionsFromJSON(i4);
  let { challenge: e, allowCredentials: t } = i4, r = S(i4, [
    "challenge",
    "allowCredentials"
  ]), s = B(e).buffer, n3 = Object.assign(Object.assign({}, r), {
    challenge: s
  });
  if (t && t.length > 0) {
    n3.allowCredentials = new Array(t.length);
    for (let o3 = 0; o3 < t.length; o3++) {
      let a = t[o3];
      n3.allowCredentials[o3] = Object.assign(Object.assign({}, a), {
        id: B(a.id).buffer,
        type: a.type || "public-key",
        transports: a.transports
      });
    }
  }
  return n3;
}
function De(i4) {
  var e;
  if ("toJSON" in i4 && typeof i4.toJSON == "function") return i4.toJSON();
  let t = i4;
  return {
    id: i4.id,
    rawId: i4.id,
    response: {
      attestationObject: W(new Uint8Array(i4.response.attestationObject)),
      clientDataJSON: W(new Uint8Array(i4.response.clientDataJSON))
    },
    type: "public-key",
    clientExtensionResults: i4.getClientExtensionResults(),
    authenticatorAttachment: (e = t.authenticatorAttachment) !== null && e !== void 0 ? e : void 0
  };
}
function qe(i4) {
  var e;
  if ("toJSON" in i4 && typeof i4.toJSON == "function") return i4.toJSON();
  let t = i4, r = i4.getClientExtensionResults(), s = i4.response;
  return {
    id: i4.id,
    rawId: i4.id,
    response: {
      authenticatorData: W(new Uint8Array(s.authenticatorData)),
      clientDataJSON: W(new Uint8Array(s.clientDataJSON)),
      signature: W(new Uint8Array(s.signature)),
      userHandle: s.userHandle ? W(new Uint8Array(s.userHandle)) : void 0
    },
    type: "public-key",
    clientExtensionResults: r,
    authenticatorAttachment: (e = t.authenticatorAttachment) !== null && e !== void 0 ? e : void 0
  };
}
function Ue(i4) {
  return i4 === "localhost" || /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(i4);
}
function he() {
  var i4, e;
  return !!(T() && "PublicKeyCredential" in globalThis && globalThis.PublicKeyCredential && "credentials" in navigator && typeof ((i4 = navigator?.credentials) === null || i4 === void 0 ? void 0 : i4.create) == "function" && typeof ((e = navigator?.credentials) === null || e === void 0 ? void 0 : e.get) == "function");
}
async function Ke(i4) {
  try {
    let e = await navigator.credentials.create(i4);
    return e ? e instanceof PublicKeyCredential ? {
      data: e,
      error: null
    } : {
      data: null,
      error: new Q("Browser returned unexpected credential type", e)
    } : {
      data: null,
      error: new Q("Empty credential response", e)
    };
  } catch (e) {
    return {
      data: null,
      error: vt({
        error: e,
        options: i4
      })
    };
  }
}
async function We(i4) {
  try {
    let e = await navigator.credentials.get(i4);
    return e ? e instanceof PublicKeyCredential ? {
      data: e,
      error: null
    } : {
      data: null,
      error: new Q("Browser returned unexpected credential type", e)
    } : {
      data: null,
      error: new Q("Empty credential response", e)
    };
  } catch (e) {
    return {
      data: null,
      error: bt({
        error: e,
        options: i4
      })
    };
  }
}
var Wt = {
  hints: [
    "security-key"
  ],
  authenticatorSelection: {
    authenticatorAttachment: "cross-platform",
    requireResidentKey: false,
    userVerification: "preferred",
    residentKey: "discouraged"
  },
  attestation: "direct"
};
var Mt = {
  userVerification: "preferred",
  hints: [
    "security-key"
  ],
  attestation: "direct"
};
function ke(...i4) {
  let e = (s) => s !== null && typeof s == "object" && !Array.isArray(s), t = (s) => s instanceof ArrayBuffer || ArrayBuffer.isView(s), r = {};
  for (let s of i4) if (s) for (let n3 in s) {
    let o3 = s[n3];
    if (o3 !== void 0) if (Array.isArray(o3)) r[n3] = o3;
    else if (t(o3)) r[n3] = o3;
    else if (e(o3)) {
      let a = r[n3];
      e(a) ? r[n3] = ke(a, o3) : r[n3] = ke(o3);
    } else r[n3] = o3;
  }
  return r;
}
function Gt(i4, e) {
  return ke(Wt, i4, e || {});
}
function Bt(i4, e) {
  return ke(Mt, i4, e || {});
}
var Re = class {
  constructor(e) {
    this.client = e, this.enroll = this._enroll.bind(this), this.challenge = this._challenge.bind(this), this.verify = this._verify.bind(this), this.authenticate = this._authenticate.bind(this), this.register = this._register.bind(this);
  }
  async _enroll(e) {
    return this.client.mfa.enroll(Object.assign(Object.assign({}, e), {
      factorType: "webauthn"
    }));
  }
  async _challenge({ factorId: e, webauthn: t, friendlyName: r, signal: s }, n3) {
    var o3;
    try {
      let { data: a, error: l } = await this.client.mfa.challenge({
        factorId: e,
        webauthn: t
      });
      if (!a) return {
        data: null,
        error: l
      };
      let u4 = s ?? Se.createNewAbortSignal();
      if (a.webauthn.type === "create") {
        let { user: c3 } = a.webauthn.credential_options.publicKey;
        if (!c3.name) {
          let w6 = r;
          if (w6) c3.name = `${c3.id}:${w6}`;
          else {
            let _6 = (await this.client.getUser()).data.user, v4 = ((o3 = _6?.user_metadata) === null || o3 === void 0 ? void 0 : o3.name) || _6?.email || _6?.id || "User";
            c3.name = `${c3.id}:${v4}`;
          }
        }
        c3.displayName || (c3.displayName = c3.name);
      }
      switch (a.webauthn.type) {
        case "create": {
          let c3 = Gt(a.webauthn.credential_options.publicKey, n3?.create), { data: w6, error: d2 } = await Ke({
            publicKey: c3,
            signal: u4
          });
          return w6 ? {
            data: {
              factorId: e,
              challengeId: a.id,
              webauthn: {
                type: a.webauthn.type,
                credential_response: w6
              }
            },
            error: null
          } : {
            data: null,
            error: d2
          };
        }
        case "request": {
          let c3 = Bt(a.webauthn.credential_options.publicKey, n3?.request), { data: w6, error: d2 } = await We(Object.assign(Object.assign({}, a.webauthn.credential_options), {
            publicKey: c3,
            signal: u4
          }));
          return w6 ? {
            data: {
              factorId: e,
              challengeId: a.id,
              webauthn: {
                type: a.webauthn.type,
                credential_response: w6
              }
            },
            error: null
          } : {
            data: null,
            error: d2
          };
        }
      }
    } catch (a) {
      return h(a) ? {
        data: null,
        error: a
      } : {
        data: null,
        error: new x("Unexpected error in challenge", a)
      };
    }
  }
  async _verify({ challengeId: e, factorId: t, webauthn: r }) {
    return this.client.mfa.verify({
      factorId: t,
      challengeId: e,
      webauthn: r
    });
  }
  async _authenticate({ factorId: e, webauthn: { rpId: t = typeof globalThis < "u" ? globalThis.location.hostname : void 0, rpOrigins: r = typeof globalThis < "u" ? [
    globalThis.location.origin
  ] : void 0, signal: s } = {} }, n3) {
    if (!t) return {
      data: null,
      error: new M("rpId is required for WebAuthn authentication")
    };
    try {
      if (!he()) return {
        data: null,
        error: new x("Browser does not support WebAuthn", null)
      };
      let { data: o3, error: a } = await this.challenge({
        factorId: e,
        webauthn: {
          rpId: t,
          rpOrigins: r
        },
        signal: s
      }, {
        request: n3
      });
      if (!o3) return {
        data: null,
        error: a
      };
      let { webauthn: l } = o3;
      return this._verify({
        factorId: e,
        challengeId: o3.challengeId,
        webauthn: {
          type: l.type,
          rpId: t,
          rpOrigins: r,
          credential_response: l.credential_response
        }
      });
    } catch (o3) {
      return h(o3) ? {
        data: null,
        error: o3
      } : {
        data: null,
        error: new x("Unexpected error in authenticate", o3)
      };
    }
  }
  async _register({ friendlyName: e, webauthn: { rpId: t = typeof globalThis < "u" ? globalThis.location.hostname : void 0, rpOrigins: r = typeof globalThis < "u" ? [
    globalThis.location.origin
  ] : void 0, signal: s } = {} }, n3) {
    if (!t) return {
      data: null,
      error: new M("rpId is required for WebAuthn registration")
    };
    try {
      if (!he()) return {
        data: null,
        error: new x("Browser does not support WebAuthn", null)
      };
      let { data: o3, error: a } = await this._enroll({
        friendlyName: e
      });
      if (!o3) return await this.client.mfa.listFactors().then((c3) => {
        var w6;
        return (w6 = c3.data) === null || w6 === void 0 ? void 0 : w6.all.find((d2) => d2.factor_type === "webauthn" && d2.friendly_name === e && d2.status !== "unverified");
      }).then((c3) => c3 ? this.client.mfa.unenroll({
        factorId: c3?.id
      }) : void 0), {
        data: null,
        error: a
      };
      let { data: l, error: u4 } = await this._challenge({
        factorId: o3.id,
        friendlyName: o3.friendly_name,
        webauthn: {
          rpId: t,
          rpOrigins: r
        },
        signal: s
      }, {
        create: n3
      });
      return l ? this._verify({
        factorId: o3.id,
        challengeId: l.challengeId,
        webauthn: {
          rpId: t,
          rpOrigins: r,
          type: l.webauthn.type,
          credential_response: l.webauthn.credential_response
        }
      }) : {
        data: null,
        error: u4
      };
    } catch (o3) {
      return h(o3) ? {
        data: null,
        error: o3
      } : {
        data: null,
        error: new x("Unexpected error in register", o3)
      };
    }
  }
};
gt();
var Ft = {
  url: Ge,
  storageKey: Be,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  headers: Fe,
  flowType: "implicit",
  debug: false,
  hasCustomAuthorizationHeader: false,
  throwOnError: false,
  lockAcquireTimeout: 5e3,
  skipAutoInitialize: false,
  experimental: {}
};
var re = {};
var Ee = class i2 {
  get jwks() {
    var e, t;
    return (t = (e = re[this.storageKey]) === null || e === void 0 ? void 0 : e.jwks) !== null && t !== void 0 ? t : {
      keys: []
    };
  }
  set jwks(e) {
    re[this.storageKey] = Object.assign(Object.assign({}, re[this.storageKey]), {
      jwks: e
    });
  }
  get jwks_cached_at() {
    var e, t;
    return (t = (e = re[this.storageKey]) === null || e === void 0 ? void 0 : e.cachedAt) !== null && t !== void 0 ? t : Number.MIN_SAFE_INTEGER;
  }
  set jwks_cached_at(e) {
    re[this.storageKey] = Object.assign(Object.assign({}, re[this.storageKey]), {
      cachedAt: e
    });
  }
  constructor(e) {
    var t, r, s;
    this.userStorage = null, this.memoryStorage = null, this.stateChangeEmitters = /* @__PURE__ */ new Map(), this.autoRefreshTicker = null, this.autoRefreshTickTimeout = null, this.visibilityChangedCallback = null, this.refreshingDeferred = null, this._sessionRemovalEpoch = 0, this.initializePromise = null, this.detectSessionInUrl = true, this.hasCustomAuthorizationHeader = false, this.suppressGetSessionWarning = false, this.lock = null, this.lockAcquired = false, this.pendingInLock = [], this.broadcastChannel = null, this.logger = console.log;
    let n3 = Object.assign(Object.assign({}, Ft), e);
    if (this.storageKey = n3.storageKey, this.instanceID = (t = i2.nextInstanceID[this.storageKey]) !== null && t !== void 0 ? t : 0, i2.nextInstanceID[this.storageKey] = this.instanceID + 1, this.logDebugMessages = !!n3.debug, typeof n3.debug == "function" && (this.logger = n3.debug), this.instanceID > 0 && T()) {
      let o3 = `${this._logPrefix()} Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.`;
      console.warn(o3), this.logDebugMessages && console.trace(o3);
    }
    if (this.persistSession = n3.persistSession, this.autoRefreshToken = n3.autoRefreshToken, this.experimental = (r = n3.experimental) !== null && r !== void 0 ? r : {}, this.admin = new z({
      url: n3.url,
      headers: n3.headers,
      fetch: n3.fetch,
      experimental: this.experimental
    }), this.url = n3.url, this.headers = n3.headers, this.fetch = ve(n3.fetch), this.detectSessionInUrl = n3.detectSessionInUrl, this.flowType = n3.flowType, this.hasCustomAuthorizationHeader = n3.hasCustomAuthorizationHeader, this.throwOnError = n3.throwOnError, this.lockAcquireTimeout = n3.lockAcquireTimeout, n3.lock != null && (this.lock = n3.lock), this.jwks || (this.jwks = {
      keys: []
    }, this.jwks_cached_at = Number.MIN_SAFE_INTEGER), this.mfa = {
      verify: this._verify.bind(this),
      enroll: this._enroll.bind(this),
      unenroll: this._unenroll.bind(this),
      challenge: this._challenge.bind(this),
      listFactors: this._listFactors.bind(this),
      challengeAndVerify: this._challengeAndVerify.bind(this),
      getAuthenticatorAssuranceLevel: this._getAuthenticatorAssuranceLevel.bind(this),
      webauthn: new Re(this)
    }, this.oauth = {
      getAuthorizationDetails: this._getAuthorizationDetails.bind(this),
      approveAuthorization: this._approveAuthorization.bind(this),
      denyAuthorization: this._denyAuthorization.bind(this),
      listGrants: this._listOAuthGrants.bind(this),
      revokeGrant: this._revokeOAuthGrant.bind(this)
    }, this.passkey = {
      startRegistration: this._startPasskeyRegistration.bind(this),
      verifyRegistration: this._verifyPasskeyRegistration.bind(this),
      startAuthentication: this._startPasskeyAuthentication.bind(this),
      verifyAuthentication: this._verifyPasskeyAuthentication.bind(this),
      list: this._listPasskeys.bind(this),
      update: this._updatePasskey.bind(this),
      delete: this._deletePasskey.bind(this)
    }, this.persistSession ? (n3.storage ? this.storage = n3.storage : ye() ? this.storage = globalThis.localStorage : (this.memoryStorage = {}, this.storage = Pe(this.memoryStorage)), n3.userStorage && (this.userStorage = n3.userStorage)) : (this.memoryStorage = {}, this.storage = Pe(this.memoryStorage)), T() && globalThis.BroadcastChannel && this.persistSession && this.storageKey) {
      try {
        this.broadcastChannel = new globalThis.BroadcastChannel(this.storageKey);
      } catch (o3) {
        console.error("Failed to create a new BroadcastChannel, multi-tab state changes will not be available", o3);
      }
      (s = this.broadcastChannel) === null || s === void 0 || s.addEventListener("message", async (o3) => {
        this._debug("received broadcast notification from other tab or client", o3);
        try {
          await this._notifyAllSubscribers(o3.data.event, o3.data.session, false);
        } catch (a) {
          this._debug("#broadcastChannel", "error", a);
        }
      });
    }
    n3.skipAutoInitialize || this.initialize().catch((o3) => {
      this._debug("#initialize()", "error", o3);
    });
  }
  isThrowOnErrorEnabled() {
    return this.throwOnError;
  }
  _returnResult(e) {
    if (this.throwOnError && e && e.error) throw e.error;
    return e;
  }
  _logPrefix() {
    return `GoTrueClient@${this.storageKey}:${this.instanceID} (${de}) ${(/* @__PURE__ */ new Date()).toISOString()}`;
  }
  _debug(...e) {
    return this.logDebugMessages && this.logger(this._logPrefix(), ...e), this;
  }
  async initialize() {
    return this.initializePromise ? await this.initializePromise : (this.initializePromise = (async () => this.lock != null ? await this._acquireLock(this.lockAcquireTimeout, async () => await this._initialize()) : await this._initialize())(), await this.initializePromise);
  }
  async _initialize() {
    var e;
    try {
      let t = {}, r = "none";
      if (T() && (t = st(globalThis.location.href), this._isImplicitGrantCallback(t) ? r = "implicit" : await this._isPKCECallback(t) && (r = "pkce")), T() && this.detectSessionInUrl && r !== "none") {
        let { data: s, error: n3 } = await this._getSessionFromURL(t, r);
        if (n3) {
          if (this._debug("#_initialize()", "error detecting session from URL", n3), He(n3)) {
            let l = (e = n3.details) === null || e === void 0 ? void 0 : e.code;
            if (l === "identity_already_exists" || l === "identity_not_found" || l === "single_identity_not_deletable") return {
              error: n3
            };
          }
          return {
            error: n3
          };
        }
        let { session: o3, redirectType: a } = s;
        return this._debug("#_initialize()", "detected session in URL", o3, "redirect type", a), await this._saveSession(o3), setTimeout(async () => {
          a === "recovery" ? await this._notifyAllSubscribers("PASSWORD_RECOVERY", o3) : await this._notifyAllSubscribers("SIGNED_IN", o3);
        }, 0), {
          error: null
        };
      }
      return await this._recoverAndRefresh(), {
        error: null
      };
    } catch (t) {
      return h(t) ? this._returnResult({
        error: t
      }) : this._returnResult({
        error: new x("Unexpected error during initialization", t)
      });
    } finally {
      await this._handleVisibilityChange(), this._debug("#_initialize()", "end");
    }
  }
  async signInAnonymously(e) {
    var t, r, s;
    try {
      let n3 = await f(this.fetch, "POST", `${this.url}/signup`, {
        headers: this.headers,
        body: {
          data: (r = (t = e?.options) === null || t === void 0 ? void 0 : t.data) !== null && r !== void 0 ? r : {},
          gotrue_meta_security: {
            captcha_token: (s = e?.options) === null || s === void 0 ? void 0 : s.captchaToken
          }
        },
        xform: P
      }), { data: o3, error: a } = n3;
      if (a || !o3) return this._returnResult({
        data: {
          user: null,
          session: null
        },
        error: a
      });
      let l = o3.session, u4 = o3.user;
      return o3.session && (await this._saveSession(o3.session), await this._notifyAllSubscribers("SIGNED_IN", l)), this._returnResult({
        data: {
          user: u4,
          session: l
        },
        error: null
      });
    } catch (n3) {
      if (h(n3)) return this._returnResult({
        data: {
          user: null,
          session: null
        },
        error: n3
      });
      throw n3;
    }
  }
  async signUp(e) {
    var t, r, s;
    try {
      let n3;
      if ("email" in e) {
        let { email: c3, password: w6, options: d2 } = e, _6 = null, v4 = null;
        this.flowType === "pkce" && ([_6, v4] = await F2(this.storage, this.storageKey)), n3 = await f(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          redirectTo: d2?.emailRedirectTo,
          body: {
            email: c3,
            password: w6,
            data: (t = d2?.data) !== null && t !== void 0 ? t : {},
            gotrue_meta_security: {
              captcha_token: d2?.captchaToken
            },
            code_challenge: _6,
            code_challenge_method: v4
          },
          xform: P
        });
      } else if ("phone" in e) {
        let { phone: c3, password: w6, options: d2 } = e;
        n3 = await f(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          body: {
            phone: c3,
            password: w6,
            data: (r = d2?.data) !== null && r !== void 0 ? r : {},
            channel: (s = d2?.channel) !== null && s !== void 0 ? s : "sms",
            gotrue_meta_security: {
              captcha_token: d2?.captchaToken
            }
          },
          xform: P
        });
      } else throw new J("You must provide either an email or phone number and a password");
      let { data: o3, error: a } = n3;
      if (a || !o3) return await A(this.storage, `${this.storageKey}-code-verifier`), this._returnResult({
        data: {
          user: null,
          session: null
        },
        error: a
      });
      let l = o3.session, u4 = o3.user;
      return o3.session && (await this._saveSession(o3.session), await this._notifyAllSubscribers("SIGNED_IN", l)), this._returnResult({
        data: {
          user: u4,
          session: l
        },
        error: null
      });
    } catch (n3) {
      if (await A(this.storage, `${this.storageKey}-code-verifier`), h(n3)) return this._returnResult({
        data: {
          user: null,
          session: null
        },
        error: n3
      });
      throw n3;
    }
  }
  async signInWithPassword(e) {
    try {
      let t;
      if ("email" in e) {
        let { email: n3, password: o3, options: a } = e;
        t = await f(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
          headers: this.headers,
          body: {
            email: n3,
            password: o3,
            gotrue_meta_security: {
              captcha_token: a?.captchaToken
            }
          },
          xform: xe
        });
      } else if ("phone" in e) {
        let { phone: n3, password: o3, options: a } = e;
        t = await f(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
          headers: this.headers,
          body: {
            phone: n3,
            password: o3,
            gotrue_meta_security: {
              captcha_token: a?.captchaToken
            }
          },
          xform: xe
        });
      } else throw new J("You must provide either an email or phone number and a password");
      let { data: r, error: s } = t;
      if (s) return this._returnResult({
        data: {
          user: null,
          session: null
        },
        error: s
      });
      if (!r || !r.session || !r.user) {
        let n3 = new K();
        return this._returnResult({
          data: {
            user: null,
            session: null
          },
          error: n3
        });
      }
      return r.session && (await this._saveSession(r.session), await this._notifyAllSubscribers("SIGNED_IN", r.session)), this._returnResult({
        data: Object.assign({
          user: r.user,
          session: r.session
        }, r.weak_password ? {
          weakPassword: r.weak_password
        } : null),
        error: s
      });
    } catch (t) {
      if (h(t)) return this._returnResult({
        data: {
          user: null,
          session: null
        },
        error: t
      });
      throw t;
    }
  }
  async signInWithOAuth(e) {
    var t, r, s, n3;
    return await this._handleProviderSignIn(e.provider, {
      redirectTo: (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo,
      scopes: (r = e.options) === null || r === void 0 ? void 0 : r.scopes,
      queryParams: (s = e.options) === null || s === void 0 ? void 0 : s.queryParams,
      skipBrowserRedirect: (n3 = e.options) === null || n3 === void 0 ? void 0 : n3.skipBrowserRedirect
    });
  }
  async exchangeCodeForSession(e) {
    return await this.initializePromise, this.lock != null ? this._acquireLock(this.lockAcquireTimeout, async () => this._exchangeCodeForSession(e)) : this._exchangeCodeForSession(e);
  }
  async signInWithWeb3(e) {
    let { chain: t } = e;
    switch (t) {
      case "ethereum":
        return await this.signInWithEthereum(e);
      case "solana":
        return await this.signInWithSolana(e);
      default:
        throw new Error(`@supabase/auth-js: Unsupported chain "${t}"`);
    }
  }
  async signInWithEthereum(e) {
    var t, r, s, n3, o3, a, l, u4, c3, w6, d2;
    let _6, v4;
    if ("message" in e) _6 = e.message, v4 = e.signature;
    else {
      let { chain: b3, wallet: y4, statement: m3, options: p4 } = e, g3;
      if (T()) if (typeof y4 == "object") g3 = y4;
      else {
        let D5 = globalThis;
        if ("ethereum" in D5 && typeof D5.ethereum == "object" && "request" in D5.ethereum && typeof D5.ethereum.request == "function") g3 = D5.ethereum;
        else throw new Error("@supabase/auth-js: No compatible Ethereum wallet interface on the window object (window.ethereum) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'ethereum', wallet: resolvedUserWallet }) instead.");
      }
      else {
        if (typeof y4 != "object" || !p4?.url) throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
        g3 = y4;
      }
      let R5 = new URL((t = p4?.url) !== null && t !== void 0 ? t : globalThis.location.href), j6 = await g3.request({
        method: "eth_requestAccounts"
      }).then((D5) => D5).catch(() => {
        throw new Error("@supabase/auth-js: Wallet method eth_requestAccounts is missing or invalid");
      });
      if (!j6 || j6.length === 0) throw new Error("@supabase/auth-js: No accounts available. Please ensure the wallet is connected.");
      let k3 = je(j6[0]), I5 = (r = p4?.signInWithEthereum) === null || r === void 0 ? void 0 : r.chainId;
      if (!I5) {
        let D5 = await g3.request({
          method: "eth_chainId"
        });
        I5 = wt(D5);
      }
      let kt = {
        domain: R5.host,
        address: k3,
        statement: m3,
        uri: R5.href,
        version: "1",
        chainId: I5,
        nonce: (s = p4?.signInWithEthereum) === null || s === void 0 ? void 0 : s.nonce,
        issuedAt: (o3 = (n3 = p4?.signInWithEthereum) === null || n3 === void 0 ? void 0 : n3.issuedAt) !== null && o3 !== void 0 ? o3 : /* @__PURE__ */ new Date(),
        expirationTime: (a = p4?.signInWithEthereum) === null || a === void 0 ? void 0 : a.expirationTime,
        notBefore: (l = p4?.signInWithEthereum) === null || l === void 0 ? void 0 : l.notBefore,
        requestId: (u4 = p4?.signInWithEthereum) === null || u4 === void 0 ? void 0 : u4.requestId,
        resources: (c3 = p4?.signInWithEthereum) === null || c3 === void 0 ? void 0 : c3.resources
      };
      _6 = yt(kt), v4 = await g3.request({
        method: "personal_sign",
        params: [
          pt(_6),
          k3
        ]
      });
    }
    try {
      let { data: b3, error: y4 } = await f(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
        headers: this.headers,
        body: Object.assign({
          chain: "ethereum",
          message: _6,
          signature: v4
        }, !((w6 = e.options) === null || w6 === void 0) && w6.captchaToken ? {
          gotrue_meta_security: {
            captcha_token: (d2 = e.options) === null || d2 === void 0 ? void 0 : d2.captchaToken
          }
        } : null),
        xform: P
      });
      if (y4) throw y4;
      if (!b3 || !b3.session || !b3.user) {
        let m3 = new K();
        return this._returnResult({
          data: {
            user: null,
            session: null
          },
          error: m3
        });
      }
      return b3.session && (await this._saveSession(b3.session), await this._notifyAllSubscribers("SIGNED_IN", b3.session)), this._returnResult({
        data: Object.assign({}, b3),
        error: y4
      });
    } catch (b3) {
      if (h(b3)) return this._returnResult({
        data: {
          user: null,
          session: null
        },
        error: b3
      });
      throw b3;
    }
  }
  async signInWithSolana(e) {
    var t, r, s, n3, o3, a, l, u4, c3, w6, d2, _6;
    let v4, b3;
    if ("message" in e) v4 = e.message, b3 = e.signature;
    else {
      let { chain: y4, wallet: m3, statement: p4, options: g3 } = e, R5;
      if (T()) if (typeof m3 == "object") R5 = m3;
      else {
        let k3 = globalThis;
        if ("solana" in k3 && typeof k3.solana == "object" && ("signIn" in k3.solana && typeof k3.solana.signIn == "function" || "signMessage" in k3.solana && typeof k3.solana.signMessage == "function")) R5 = k3.solana;
        else throw new Error("@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.");
      }
      else {
        if (typeof m3 != "object" || !g3?.url) throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
        R5 = m3;
      }
      let j6 = new URL((t = g3?.url) !== null && t !== void 0 ? t : globalThis.location.href);
      if ("signIn" in R5 && R5.signIn) {
        let k3 = await R5.signIn(Object.assign(Object.assign(Object.assign({
          issuedAt: (/* @__PURE__ */ new Date()).toISOString()
        }, g3?.signInWithSolana), {
          version: "1",
          domain: j6.host,
          uri: j6.href
        }), p4 ? {
          statement: p4
        } : null)), I5;
        if (Array.isArray(k3) && k3[0] && typeof k3[0] == "object") I5 = k3[0];
        else if (k3 && typeof k3 == "object" && "signedMessage" in k3 && "signature" in k3) I5 = k3;
        else throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");
        if ("signedMessage" in I5 && "signature" in I5 && (typeof I5.signedMessage == "string" || I5.signedMessage instanceof Uint8Array) && I5.signature instanceof Uint8Array) v4 = typeof I5.signedMessage == "string" ? I5.signedMessage : new TextDecoder().decode(I5.signedMessage), b3 = I5.signature;
        else throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields");
      } else {
        if (!("signMessage" in R5) || typeof R5.signMessage != "function" || !("publicKey" in R5) || typeof R5 != "object" || !R5.publicKey || !("toBase58" in R5.publicKey) || typeof R5.publicKey.toBase58 != "function") throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");
        v4 = [
          `${j6.host} wants you to sign in with your Solana account:`,
          R5.publicKey.toBase58(),
          ...p4 ? [
            "",
            p4,
            ""
          ] : [
            ""
          ],
          "Version: 1",
          `URI: ${j6.href}`,
          `Issued At: ${(s = (r = g3?.signInWithSolana) === null || r === void 0 ? void 0 : r.issuedAt) !== null && s !== void 0 ? s : (/* @__PURE__ */ new Date()).toISOString()}`,
          ...!((n3 = g3?.signInWithSolana) === null || n3 === void 0) && n3.notBefore ? [
            `Not Before: ${g3.signInWithSolana.notBefore}`
          ] : [],
          ...!((o3 = g3?.signInWithSolana) === null || o3 === void 0) && o3.expirationTime ? [
            `Expiration Time: ${g3.signInWithSolana.expirationTime}`
          ] : [],
          ...!((a = g3?.signInWithSolana) === null || a === void 0) && a.chainId ? [
            `Chain ID: ${g3.signInWithSolana.chainId}`
          ] : [],
          ...!((l = g3?.signInWithSolana) === null || l === void 0) && l.nonce ? [
            `Nonce: ${g3.signInWithSolana.nonce}`
          ] : [],
          ...!((u4 = g3?.signInWithSolana) === null || u4 === void 0) && u4.requestId ? [
            `Request ID: ${g3.signInWithSolana.requestId}`
          ] : [],
          ...!((w6 = (c3 = g3?.signInWithSolana) === null || c3 === void 0 ? void 0 : c3.resources) === null || w6 === void 0) && w6.length ? [
            "Resources",
            ...g3.signInWithSolana.resources.map((I5) => `- ${I5}`)
          ] : []
        ].join(`
`);
        let k3 = await R5.signMessage(new TextEncoder().encode(v4), "utf8");
        if (!k3 || !(k3 instanceof Uint8Array)) throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");
        b3 = k3;
      }
    }
    try {
      let { data: y4, error: m3 } = await f(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
        headers: this.headers,
        body: Object.assign({
          chain: "solana",
          message: v4,
          signature: W(b3)
        }, !((d2 = e.options) === null || d2 === void 0) && d2.captchaToken ? {
          gotrue_meta_security: {
            captcha_token: (_6 = e.options) === null || _6 === void 0 ? void 0 : _6.captchaToken
          }
        } : null),
        xform: P
      });
      if (m3) throw m3;
      if (!y4 || !y4.session || !y4.user) {
        let p4 = new K();
        return this._returnResult({
          data: {
            user: null,
            session: null
          },
          error: p4
        });
      }
      return y4.session && (await this._saveSession(y4.session), await this._notifyAllSubscribers("SIGNED_IN", y4.session)), this._returnResult({
        data: Object.assign({}, y4),
        error: m3
      });
    } catch (y4) {
      if (h(y4)) return this._returnResult({
        data: {
          user: null,
          session: null
        },
        error: y4
      });
      throw y4;
    }
  }
  async _exchangeCodeForSession(e) {
    let t = await $(this.storage, `${this.storageKey}-code-verifier`), [r, s] = (t ?? "").split("/");
    try {
      if (!r && this.flowType === "pkce") throw new ge();
      let { data: n3, error: o3 } = await f(this.fetch, "POST", `${this.url}/token?grant_type=pkce`, {
        headers: this.headers,
        body: {
          auth_code: e,
          code_verifier: r
        },
        xform: P
      });
      if (await A(this.storage, `${this.storageKey}-code-verifier`), o3) throw o3;
      if (!n3 || !n3.session || !n3.user) {
        let a = new K();
        return this._returnResult({
          data: {
            user: null,
            session: null,
            redirectType: null
          },
          error: a
        });
      }
      return n3.session && (await this._saveSession(n3.session), await this._notifyAllSubscribers(s === "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", n3.session)), this._returnResult({
        data: Object.assign(Object.assign({}, n3), {
          redirectType: s ?? null
        }),
        error: o3
      });
    } catch (n3) {
      if (await A(this.storage, `${this.storageKey}-code-verifier`), h(n3)) return this._returnResult({
        data: {
          user: null,
          session: null,
          redirectType: null
        },
        error: n3
      });
      throw n3;
    }
  }
  async signInWithIdToken(e) {
    try {
      let { options: t, provider: r, token: s, access_token: n3, nonce: o3 } = e, a = await f(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
        headers: this.headers,
        body: {
          provider: r,
          id_token: s,
          access_token: n3,
          nonce: o3,
          gotrue_meta_security: {
            captcha_token: t?.captchaToken
          }
        },
        xform: P
      }), { data: l, error: u4 } = a;
      if (u4) return this._returnResult({
        data: {
          user: null,
          session: null
        },
        error: u4
      });
      if (!l || !l.session || !l.user) {
        let c3 = new K();
        return this._returnResult({
          data: {
            user: null,
            session: null
          },
          error: c3
        });
      }
      return l.session && (await this._saveSession(l.session), await this._notifyAllSubscribers("SIGNED_IN", l.session)), this._returnResult({
        data: l,
        error: u4
      });
    } catch (t) {
      if (h(t)) return this._returnResult({
        data: {
          user: null,
          session: null
        },
        error: t
      });
      throw t;
    }
  }
  async signInWithOtp(e) {
    var t, r, s, n3, o3;
    try {
      if ("email" in e) {
        let { email: a, options: l } = e, u4 = null, c3 = null;
        this.flowType === "pkce" && ([u4, c3] = await F2(this.storage, this.storageKey));
        let { error: w6 } = await f(this.fetch, "POST", `${this.url}/otp`, {
          headers: this.headers,
          body: {
            email: a,
            data: (t = l?.data) !== null && t !== void 0 ? t : {},
            create_user: (r = l?.shouldCreateUser) !== null && r !== void 0 ? r : true,
            gotrue_meta_security: {
              captcha_token: l?.captchaToken
            },
            code_challenge: u4,
            code_challenge_method: c3
          },
          redirectTo: l?.emailRedirectTo
        });
        return this._returnResult({
          data: {
            user: null,
            session: null
          },
          error: w6
        });
      }
      if ("phone" in e) {
        let { phone: a, options: l } = e, { data: u4, error: c3 } = await f(this.fetch, "POST", `${this.url}/otp`, {
          headers: this.headers,
          body: {
            phone: a,
            data: (s = l?.data) !== null && s !== void 0 ? s : {},
            create_user: (n3 = l?.shouldCreateUser) !== null && n3 !== void 0 ? n3 : true,
            gotrue_meta_security: {
              captcha_token: l?.captchaToken
            },
            channel: (o3 = l?.channel) !== null && o3 !== void 0 ? o3 : "sms"
          }
        });
        return this._returnResult({
          data: {
            user: null,
            session: null,
            messageId: u4?.message_id
          },
          error: c3
        });
      }
      throw new J("You must provide either an email or phone number.");
    } catch (a) {
      if (await A(this.storage, `${this.storageKey}-code-verifier`), h(a)) return this._returnResult({
        data: {
          user: null,
          session: null
        },
        error: a
      });
      throw a;
    }
  }
  async verifyOtp(e) {
    var t, r;
    try {
      let s, n3;
      "options" in e && (s = (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo, n3 = (r = e.options) === null || r === void 0 ? void 0 : r.captchaToken);
      let { data: o3, error: a } = await f(this.fetch, "POST", `${this.url}/verify`, {
        headers: this.headers,
        body: Object.assign(Object.assign({}, e), {
          gotrue_meta_security: {
            captcha_token: n3
          }
        }),
        redirectTo: s,
        xform: P
      });
      if (a) throw a;
      if (!o3) throw new Error("An error occurred on token verification.");
      let l = o3.session, u4 = o3.user;
      return l?.access_token && (await this._saveSession(l), await this._notifyAllSubscribers(e.type == "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", l)), this._returnResult({
        data: {
          user: u4,
          session: l
        },
        error: null
      });
    } catch (s) {
      if (h(s)) return this._returnResult({
        data: {
          user: null,
          session: null
        },
        error: s
      });
      throw s;
    }
  }
  async signInWithSSO(e) {
    var t, r, s, n3, o3;
    try {
      let a = null, l = null;
      this.flowType === "pkce" && ([a, l] = await F2(this.storage, this.storageKey));
      let u4 = await f(this.fetch, "POST", `${this.url}/sso`, {
        body: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, "providerId" in e ? {
          provider_id: e.providerId
        } : null), "domain" in e ? {
          domain: e.domain
        } : null), {
          redirect_to: (r = (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo) !== null && r !== void 0 ? r : void 0
        }), !((s = e?.options) === null || s === void 0) && s.captchaToken ? {
          gotrue_meta_security: {
            captcha_token: e.options.captchaToken
          }
        } : null), {
          skip_http_redirect: true,
          code_challenge: a,
          code_challenge_method: l
        }),
        headers: this.headers,
        xform: dt
      });
      return !((n3 = u4.data) === null || n3 === void 0) && n3.url && T() && !(!((o3 = e.options) === null || o3 === void 0) && o3.skipBrowserRedirect) && globalThis.location.assign(u4.data.url), this._returnResult(u4);
    } catch (a) {
      if (await A(this.storage, `${this.storageKey}-code-verifier`), h(a)) return this._returnResult({
        data: null,
        error: a
      });
      throw a;
    }
  }
  async reauthenticate() {
    return await this.initializePromise, this.lock != null ? await this._acquireLock(this.lockAcquireTimeout, async () => await this._reauthenticate()) : await this._reauthenticate();
  }
  async _reauthenticate() {
    try {
      return await this._useSession(async (e) => {
        let { data: { session: t }, error: r } = e;
        if (r) throw r;
        if (!t) throw new E();
        let { error: s } = await f(this.fetch, "GET", `${this.url}/reauthenticate`, {
          headers: this.headers,
          jwt: t.access_token
        });
        return this._returnResult({
          data: {
            user: null,
            session: null
          },
          error: s
        });
      });
    } catch (e) {
      if (h(e)) return this._returnResult({
        data: {
          user: null,
          session: null
        },
        error: e
      });
      throw e;
    }
  }
  async resend(e) {
    try {
      let t = `${this.url}/resend`;
      if ("email" in e) {
        let { email: r, type: s, options: n3 } = e, o3 = null, a = null;
        this.flowType === "pkce" && ([o3, a] = await F2(this.storage, this.storageKey));
        let { error: l } = await f(this.fetch, "POST", t, {
          headers: this.headers,
          body: {
            email: r,
            type: s,
            gotrue_meta_security: {
              captcha_token: n3?.captchaToken
            },
            code_challenge: o3,
            code_challenge_method: a
          },
          redirectTo: n3?.emailRedirectTo
        });
        return l && await A(this.storage, `${this.storageKey}-code-verifier`), this._returnResult({
          data: {
            user: null,
            session: null
          },
          error: l
        });
      } else if ("phone" in e) {
        let { phone: r, type: s, options: n3 } = e, { data: o3, error: a } = await f(this.fetch, "POST", t, {
          headers: this.headers,
          body: {
            phone: r,
            type: s,
            gotrue_meta_security: {
              captcha_token: n3?.captchaToken
            }
          }
        });
        return this._returnResult({
          data: {
            user: null,
            session: null,
            messageId: o3?.message_id
          },
          error: a
        });
      }
      throw new J("You must provide either an email or phone number and a type");
    } catch (t) {
      if (await A(this.storage, `${this.storageKey}-code-verifier`), h(t)) return this._returnResult({
        data: {
          user: null,
          session: null
        },
        error: t
      });
      throw t;
    }
  }
  async getSession() {
    return await this.initializePromise, this.lock != null ? await this._acquireLock(this.lockAcquireTimeout, async () => this._useSession(async (e) => e)) : await this._useSession(async (e) => e);
  }
  async _acquireLock(e, t) {
    this._debug("#_acquireLock", "begin", e);
    try {
      if (this.lockAcquired) {
        let r = this.pendingInLock.length ? this.pendingInLock[this.pendingInLock.length - 1] : Promise.resolve(), s = (async () => (await r, await t()))();
        return this.pendingInLock.push((async () => {
          try {
            await s;
          } catch {
          }
        })()), s;
      }
      return await this.lock(`lock:${this.storageKey}`, e, async () => {
        this._debug("#_acquireLock", "lock acquired for storage key", this.storageKey);
        try {
          this.lockAcquired = true;
          let r = t();
          for (this.pendingInLock.push((async () => {
            try {
              await r;
            } catch {
            }
          })()), await r; this.pendingInLock.length; ) {
            let s = [
              ...this.pendingInLock
            ];
            await Promise.all(s), this.pendingInLock.splice(0, s.length);
          }
          return await r;
        } finally {
          this._debug("#_acquireLock", "lock released for storage key", this.storageKey), this.lockAcquired = false;
        }
      });
    } finally {
      this._debug("#_acquireLock", "end");
    }
  }
  async _useSession(e) {
    this._debug("#_useSession", "begin");
    try {
      let t = await this.__loadSession();
      return await e(t);
    } finally {
      this._debug("#_useSession", "end");
    }
  }
  async __loadSession() {
    this._debug("#__loadSession()", "begin"), this.lock != null && !this.lockAcquired && this._debug("#__loadSession()", "used outside of an acquired lock!", new Error().stack);
    try {
      let e = null, t = await $(this.storage, this.storageKey);
      if (this._debug("#getSession()", "session from storage", t), t !== null && (this._isValidSession(t) ? e = t : (this._debug("#getSession()", "session from storage is not valid"), await this._removeSession())), !e) return {
        data: {
          session: null
        },
        error: null
      };
      let r = e.expires_at ? e.expires_at * 1e3 - Date.now() < fe : false;
      if (this._debug("#__loadSession()", `session has${r ? "" : " not"} expired`, "expires_at", e.expires_at), !r) {
        if (this.userStorage) {
          let o3 = await $(this.userStorage, this.storageKey + "-user");
          o3?.user ? e.user = o3.user : e.user = be();
        }
        if (this.storage.isServer && e.user && !e.user.__isUserNotAvailableProxy) {
          let o3 = {
            value: this.suppressGetSessionWarning
          };
          e.user = ct(e.user, o3), o3.value && (this.suppressGetSessionWarning = true);
        }
        return {
          data: {
            session: e
          },
          error: null
        };
      }
      let { data: s, error: n3 } = await this._callRefreshToken(e.refresh_token);
      return n3 ? this._returnResult({
        data: {
          session: null
        },
        error: n3
      }) : this._returnResult({
        data: {
          session: s
        },
        error: null
      });
    } finally {
      this._debug("#__loadSession()", "end");
    }
  }
  async getUser(e) {
    if (e) return await this._getUser(e);
    await this.initializePromise;
    let t;
    return this.lock != null ? t = await this._acquireLock(this.lockAcquireTimeout, async () => await this._getUser()) : t = await this._getUser(), t.data.user && (this.suppressGetSessionWarning = true), t;
  }
  async _getUser(e) {
    try {
      return e ? await f(this.fetch, "GET", `${this.url}/user`, {
        headers: this.headers,
        jwt: e,
        xform: L
      }) : await this._useSession(async (t) => {
        var r, s, n3;
        let { data: o3, error: a } = t;
        if (a) throw a;
        return !(!((r = o3.session) === null || r === void 0) && r.access_token) && !this.hasCustomAuthorizationHeader ? {
          data: {
            user: null
          },
          error: new E()
        } : await f(this.fetch, "GET", `${this.url}/user`, {
          headers: this.headers,
          jwt: (n3 = (s = o3.session) === null || s === void 0 ? void 0 : s.access_token) !== null && n3 !== void 0 ? n3 : void 0,
          xform: L
        });
      });
    } catch (t) {
      if (h(t)) return ae(t) && (await this._removeSession(), await A(this.storage, `${this.storageKey}-code-verifier`)), this._returnResult({
        data: {
          user: null
        },
        error: t
      });
      throw t;
    }
  }
  async updateUser(e, t = {}) {
    return await this.initializePromise, this.lock != null ? await this._acquireLock(this.lockAcquireTimeout, async () => await this._updateUser(e, t)) : await this._updateUser(e, t);
  }
  async _updateUser(e, t = {}) {
    try {
      return await this._useSession(async (r) => {
        let { data: s, error: n3 } = r;
        if (n3) throw n3;
        if (!s.session) throw new E();
        let o3 = s.session, a = null, l = null;
        this.flowType === "pkce" && e.email != null && ([a, l] = await F2(this.storage, this.storageKey));
        let { data: u4, error: c3 } = await f(this.fetch, "PUT", `${this.url}/user`, {
          headers: this.headers,
          redirectTo: t?.emailRedirectTo,
          body: Object.assign(Object.assign({}, e), {
            code_challenge: a,
            code_challenge_method: l
          }),
          jwt: o3.access_token,
          xform: L
        });
        if (c3) throw c3;
        return o3.user = u4.user, await this._saveSession(o3), await this._notifyAllSubscribers("USER_UPDATED", o3), this._returnResult({
          data: {
            user: o3.user
          },
          error: null
        });
      });
    } catch (r) {
      if (await A(this.storage, `${this.storageKey}-code-verifier`), h(r)) return this._returnResult({
        data: {
          user: null
        },
        error: r
      });
      throw r;
    }
  }
  async setSession(e) {
    return await this.initializePromise, this.lock != null ? await this._acquireLock(this.lockAcquireTimeout, async () => await this._setSession(e)) : await this._setSession(e);
  }
  async _setSession(e) {
    try {
      if (!e.access_token || !e.refresh_token) throw new E();
      let t = Date.now() / 1e3, r = t, s = true, n3 = null, { payload: o3 } = ue(e.access_token);
      if (o3.exp && (r = o3.exp, s = r <= t), s) {
        let { data: a, error: l } = await this._callRefreshToken(e.refresh_token);
        if (l) return this._returnResult({
          data: {
            user: null,
            session: null
          },
          error: l
        });
        if (!a) return {
          data: {
            user: null,
            session: null
          },
          error: null
        };
        n3 = a;
      } else {
        let { data: a, error: l } = await this._getUser(e.access_token);
        if (l) return this._returnResult({
          data: {
            user: null,
            session: null
          },
          error: l
        });
        n3 = {
          access_token: e.access_token,
          refresh_token: e.refresh_token,
          user: a.user,
          token_type: "bearer",
          expires_in: r - t,
          expires_at: r
        }, await this._saveSession(n3), await this._notifyAllSubscribers("SIGNED_IN", n3);
      }
      return this._returnResult({
        data: {
          user: n3.user,
          session: n3
        },
        error: null
      });
    } catch (t) {
      if (h(t)) return this._returnResult({
        data: {
          session: null,
          user: null
        },
        error: t
      });
      throw t;
    }
  }
  async refreshSession(e) {
    return await this.initializePromise, this.lock != null ? await this._acquireLock(this.lockAcquireTimeout, async () => await this._refreshSession(e)) : await this._refreshSession(e);
  }
  async _refreshSession(e) {
    try {
      return await this._useSession(async (t) => {
        var r;
        if (!e) {
          let { data: o3, error: a } = t;
          if (a) throw a;
          e = (r = o3.session) !== null && r !== void 0 ? r : void 0;
        }
        if (!e?.refresh_token) throw new E();
        let { data: s, error: n3 } = await this._callRefreshToken(e.refresh_token);
        return n3 ? this._returnResult({
          data: {
            user: null,
            session: null
          },
          error: n3
        }) : s ? this._returnResult({
          data: {
            user: s.user,
            session: s
          },
          error: null
        }) : this._returnResult({
          data: {
            user: null,
            session: null
          },
          error: null
        });
      });
    } catch (t) {
      if (h(t)) return this._returnResult({
        data: {
          user: null,
          session: null
        },
        error: t
      });
      throw t;
    }
  }
  async _getSessionFromURL(e, t) {
    var r;
    try {
      if (!T()) throw new H("No browser detected.");
      if (e.error || e.error_description || e.error_code) throw new H(e.error_description || "Error in URL with unspecified error_description", {
        error: e.error || "unspecified_error",
        code: e.error_code || "unspecified_code"
      });
      switch (t) {
        case "implicit":
          if (this.flowType === "pkce") throw new ie("Not a valid PKCE flow url.");
          break;
        case "pkce":
          if (this.flowType === "implicit") throw new H("Not a valid implicit grant flow url.");
          break;
        default:
      }
      if (t === "pkce") {
        if (this._debug("#_initialize()", "begin", "is PKCE flow", true), !e.code) throw new ie("No code detected.");
        let { data: g3, error: R5 } = await this._exchangeCodeForSession(e.code);
        if (R5) throw R5;
        let j6 = new URL(globalThis.location.href);
        return j6.searchParams.delete("code"), globalThis.history.replaceState(globalThis.history.state, "", j6.toString()), {
          data: {
            session: g3.session,
            redirectType: (r = g3.redirectType) !== null && r !== void 0 ? r : null
          },
          error: null
        };
      }
      let { provider_token: s, provider_refresh_token: n3, access_token: o3, refresh_token: a, expires_in: l, expires_at: u4, token_type: c3 } = e;
      if (!o3 || !l || !a || !c3) throw new H("No session defined in URL");
      let w6 = Math.round(Date.now() / 1e3), d2 = parseInt(l), _6 = w6 + d2;
      u4 && (_6 = parseInt(u4));
      let v4 = _6 - w6;
      v4 * 1e3 <= q && console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${v4}s, should have been closer to ${d2}s`);
      let b3 = _6 - d2;
      w6 - b3 >= 120 ? console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale", b3, _6, w6) : w6 - b3 < 0 && console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew", b3, _6, w6);
      let { data: y4, error: m3 } = await this._getUser(o3);
      if (m3) throw m3;
      let p4 = {
        provider_token: s,
        provider_refresh_token: n3,
        access_token: o3,
        expires_in: d2,
        expires_at: _6,
        refresh_token: a,
        token_type: c3,
        user: y4.user
      };
      return globalThis.location.hash = "", this._debug("#_getSessionFromURL()", "clearing window.location.hash"), this._returnResult({
        data: {
          session: p4,
          redirectType: e.type
        },
        error: null
      });
    } catch (s) {
      if (h(s)) return this._returnResult({
        data: {
          session: null,
          redirectType: null
        },
        error: s
      });
      throw s;
    }
  }
  _isImplicitGrantCallback(e) {
    return typeof this.detectSessionInUrl == "function" ? this.detectSessionInUrl(new URL(globalThis.location.href), e) : !!(e.access_token || e.error || e.error_description || e.error_code);
  }
  async _isPKCECallback(e) {
    let t = await $(this.storage, `${this.storageKey}-code-verifier`);
    return !!(e.code && t);
  }
  async signOut(e = {
    scope: "global"
  }) {
    return await this.initializePromise, this.lock != null ? await this._acquireLock(this.lockAcquireTimeout, async () => await this._signOut(e)) : await this._signOut(e);
  }
  async _signOut({ scope: e } = {
    scope: "global"
  }) {
    return await this._useSession(async (t) => {
      var r;
      let { data: s, error: n3 } = t;
      if (n3 && !ae(n3)) return this._returnResult({
        error: n3
      });
      let o3 = (r = s.session) === null || r === void 0 ? void 0 : r.access_token;
      if (o3) {
        let { error: a } = await this.admin.signOut(o3, e);
        if (a && !(Je(a) && (a.status === 404 || a.status === 401 || a.status === 403) || ae(a))) return this._returnResult({
          error: a
        });
      }
      return e !== "others" && (await this._removeSession(), await A(this.storage, `${this.storageKey}-code-verifier`)), this._returnResult({
        error: null
      });
    });
  }
  onAuthStateChange(e) {
    let t = rt(), r = {
      id: t,
      callback: e,
      unsubscribe: () => {
        this._debug("#unsubscribe()", "state change callback with id removed", t), this.stateChangeEmitters.delete(t);
      }
    };
    return this._debug("#onAuthStateChange()", "registered callback with id", t), this.stateChangeEmitters.set(t, r), (async () => (await this.initializePromise, this.lock != null ? await this._acquireLock(this.lockAcquireTimeout, async () => {
      this._emitInitialSession(t);
    }) : await this._emitInitialSession(t)))(), {
      data: {
        subscription: r
      }
    };
  }
  async _emitInitialSession(e) {
    return await this._useSession(async (t) => {
      var r, s;
      try {
        let { data: { session: n3 }, error: o3 } = t;
        if (o3) throw o3;
        await ((r = this.stateChangeEmitters.get(e)) === null || r === void 0 ? void 0 : r.callback("INITIAL_SESSION", n3)), this._debug("INITIAL_SESSION", "callback id", e, "session", n3);
      } catch (n3) {
        await ((s = this.stateChangeEmitters.get(e)) === null || s === void 0 ? void 0 : s.callback("INITIAL_SESSION", null)), this._debug("INITIAL_SESSION", "callback id", e, "error", n3), ae(n3) ? console.warn(n3) : console.error(n3);
      }
    });
  }
  async resetPasswordForEmail(e, t = {}) {
    let r = null, s = null;
    this.flowType === "pkce" && ([r, s] = await F2(this.storage, this.storageKey, true));
    try {
      return await f(this.fetch, "POST", `${this.url}/recover`, {
        body: {
          email: e,
          code_challenge: r,
          code_challenge_method: s,
          gotrue_meta_security: {
            captcha_token: t.captchaToken
          }
        },
        headers: this.headers,
        redirectTo: t.redirectTo
      });
    } catch (n3) {
      if (await A(this.storage, `${this.storageKey}-code-verifier`), h(n3)) return this._returnResult({
        data: null,
        error: n3
      });
      throw n3;
    }
  }
  async getUserIdentities() {
    var e;
    try {
      let { data: t, error: r } = await this.getUser();
      if (r) throw r;
      return this._returnResult({
        data: {
          identities: (e = t.user.identities) !== null && e !== void 0 ? e : []
        },
        error: null
      });
    } catch (t) {
      if (h(t)) return this._returnResult({
        data: null,
        error: t
      });
      throw t;
    }
  }
  async linkIdentity(e) {
    return "token" in e ? this.linkIdentityIdToken(e) : this.linkIdentityOAuth(e);
  }
  async linkIdentityOAuth(e) {
    var t;
    try {
      let { data: r, error: s } = await this._useSession(async (n3) => {
        var o3, a, l, u4, c3;
        let { data: w6, error: d2 } = n3;
        if (d2) throw d2;
        let _6 = await this._getUrlForProvider(`${this.url}/user/identities/authorize`, e.provider, {
          redirectTo: (o3 = e.options) === null || o3 === void 0 ? void 0 : o3.redirectTo,
          scopes: (a = e.options) === null || a === void 0 ? void 0 : a.scopes,
          queryParams: (l = e.options) === null || l === void 0 ? void 0 : l.queryParams,
          skipBrowserRedirect: true
        });
        return await f(this.fetch, "GET", _6, {
          headers: this.headers,
          jwt: (c3 = (u4 = w6.session) === null || u4 === void 0 ? void 0 : u4.access_token) !== null && c3 !== void 0 ? c3 : void 0
        });
      });
      if (s) throw s;
      return T() && !(!((t = e.options) === null || t === void 0) && t.skipBrowserRedirect) && globalThis.location.assign(r?.url), this._returnResult({
        data: {
          provider: e.provider,
          url: r?.url
        },
        error: null
      });
    } catch (r) {
      if (h(r)) return this._returnResult({
        data: {
          provider: e.provider,
          url: null
        },
        error: r
      });
      throw r;
    }
  }
  async linkIdentityIdToken(e) {
    return await this._useSession(async (t) => {
      var r;
      try {
        let { error: s, data: { session: n3 } } = t;
        if (s) throw s;
        let { options: o3, provider: a, token: l, access_token: u4, nonce: c3 } = e, w6 = await f(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
          headers: this.headers,
          jwt: (r = n3?.access_token) !== null && r !== void 0 ? r : void 0,
          body: {
            provider: a,
            id_token: l,
            access_token: u4,
            nonce: c3,
            link_identity: true,
            gotrue_meta_security: {
              captcha_token: o3?.captchaToken
            }
          },
          xform: P
        }), { data: d2, error: _6 } = w6;
        return _6 ? this._returnResult({
          data: {
            user: null,
            session: null
          },
          error: _6
        }) : !d2 || !d2.session || !d2.user ? this._returnResult({
          data: {
            user: null,
            session: null
          },
          error: new K()
        }) : (d2.session && (await this._saveSession(d2.session), await this._notifyAllSubscribers("USER_UPDATED", d2.session)), this._returnResult({
          data: d2,
          error: _6
        }));
      } catch (s) {
        if (await A(this.storage, `${this.storageKey}-code-verifier`), h(s)) return this._returnResult({
          data: {
            user: null,
            session: null
          },
          error: s
        });
        throw s;
      }
    });
  }
  async unlinkIdentity(e) {
    try {
      return await this._useSession(async (t) => {
        var r, s;
        let { data: n3, error: o3 } = t;
        if (o3) throw o3;
        return await f(this.fetch, "DELETE", `${this.url}/user/identities/${e.identity_id}`, {
          headers: this.headers,
          jwt: (s = (r = n3.session) === null || r === void 0 ? void 0 : r.access_token) !== null && s !== void 0 ? s : void 0
        });
      });
    } catch (t) {
      if (h(t)) return this._returnResult({
        data: null,
        error: t
      });
      throw t;
    }
  }
  async _refreshAccessToken(e) {
    let t = "#_refreshAccessToken()";
    this._debug(t, "begin");
    try {
      let r = Date.now();
      return await ot(async (s) => (s > 0 && await nt(200 * Math.pow(2, s - 1)), this._debug(t, "refreshing attempt", s), await f(this.fetch, "POST", `${this.url}/token?grant_type=refresh_token`, {
        body: {
          refresh_token: e
        },
        headers: this.headers,
        xform: P
      })), (s, n3) => {
        let o3 = 200 * Math.pow(2, s);
        return n3 && we(n3) && Date.now() + o3 - r < q;
      });
    } catch (r) {
      if (this._debug(t, "error", r), h(r)) return this._returnResult({
        data: {
          session: null,
          user: null
        },
        error: r
      });
      throw r;
    } finally {
      this._debug(t, "end");
    }
  }
  _isValidSession(e) {
    return typeof e == "object" && e !== null && "access_token" in e && "refresh_token" in e && "expires_at" in e;
  }
  async _handleProviderSignIn(e, t) {
    let r = await this._getUrlForProvider(`${this.url}/authorize`, e, {
      redirectTo: t.redirectTo,
      scopes: t.scopes,
      queryParams: t.queryParams
    });
    return this._debug("#_handleProviderSignIn()", "provider", e, "options", t, "url", r), T() && !t.skipBrowserRedirect && globalThis.location.assign(r), {
      data: {
        provider: e,
        url: r
      },
      error: null
    };
  }
  async _recoverAndRefresh() {
    var e, t;
    let r = "#_recoverAndRefresh()";
    this._debug(r, "begin");
    try {
      let s = await $(this.storage, this.storageKey);
      if (s && this.userStorage) {
        let o3 = await $(this.userStorage, this.storageKey + "-user");
        !this.storage.isServer && Object.is(this.storage, this.userStorage) && !o3 && (o3 = {
          user: s.user
        }, await X(this.userStorage, this.storageKey + "-user", o3)), s.user = (e = o3?.user) !== null && e !== void 0 ? e : be();
      } else if (s && !s.user && !s.user) {
        let o3 = await $(this.storage, this.storageKey + "-user");
        o3 && o3?.user ? (s.user = o3.user, await A(this.storage, this.storageKey + "-user"), await X(this.storage, this.storageKey, s)) : s.user = be();
      }
      if (this._debug(r, "session from storage", s), !this._isValidSession(s)) {
        this._debug(r, "session is not valid"), s !== null && await this._removeSession();
        return;
      }
      let n3 = ((t = s.expires_at) !== null && t !== void 0 ? t : 1 / 0) * 1e3 - Date.now() < fe;
      if (this._debug(r, `session has${n3 ? "" : " not"} expired with margin of ${fe}s`), n3) {
        if (this.autoRefreshToken && s.refresh_token) {
          let { error: o3 } = await this._callRefreshToken(s.refresh_token);
          o3 && (Ye(o3) ? this._debug(r, "refresh discarded by commit guard", o3) : (this._debug(r, "refresh failed", o3), we(o3) || (this._debug(r, "refresh failed with a non-retryable error, removing the session", o3), await this._removeSession())));
        }
      } else if (s.user && s.user.__isUserNotAvailableProxy === true) try {
        let { data: o3, error: a } = await this._getUser(s.access_token);
        !a && o3?.user ? (s.user = o3.user, await this._saveSession(s), await this._notifyAllSubscribers("SIGNED_IN", s)) : this._debug(r, "could not get user data, skipping SIGNED_IN notification");
      } catch (o3) {
        console.error("Error getting user data:", o3), this._debug(r, "error getting user data, skipping SIGNED_IN notification", o3);
      }
      else await this._notifyAllSubscribers("SIGNED_IN", s);
    } catch (s) {
      this._debug(r, "error", s), console.error(s);
      return;
    } finally {
      this._debug(r, "end");
    }
  }
  async _callRefreshToken(e) {
    var t, r;
    if (!e) throw new E();
    if (this.refreshingDeferred) return this.refreshingDeferred.promise;
    let s = "#_callRefreshToken()";
    this._debug(s, "begin");
    try {
      this.refreshingDeferred = new le();
      let n3 = await $(this.storage, this.storageKey), { data: o3, error: a } = await this._refreshAccessToken(e);
      if (a) throw a;
      if (!o3.session) throw new E();
      let l = await $(this.storage, this.storageKey);
      if (n3 !== null && (l === null || l.refresh_token !== n3.refresh_token)) {
        this._debug(s, "commit guard: storage changed since refresh started, discarding rotated tokens", {
          startedWith: "present",
          nowHolds: l ? "replaced" : "cleared"
        });
        let d2 = {
          data: null,
          error: new ne()
        };
        return this.refreshingDeferred.resolve(d2), d2;
      }
      let c3 = this._sessionRemovalEpoch;
      if (await this._saveSession(o3.session), this._sessionRemovalEpoch !== c3) {
        this._debug(s, "commit guard (post-save): _removeSession ran during _saveSession, undoing write"), await A(this.storage, this.storageKey), this.userStorage && await A(this.userStorage, this.storageKey + "-user");
        let d2 = {
          data: null,
          error: new ne()
        };
        return this.refreshingDeferred.resolve(d2), d2;
      }
      await this._notifyAllSubscribers("TOKEN_REFRESHED", o3.session);
      let w6 = {
        data: o3.session,
        error: null
      };
      return this.refreshingDeferred.resolve(w6), w6;
    } catch (n3) {
      if (this._debug(s, "error", n3), h(n3)) {
        let o3 = {
          data: null,
          error: n3
        };
        return we(n3) || await this._removeSession(), (t = this.refreshingDeferred) === null || t === void 0 || t.resolve(o3), o3;
      }
      throw (r = this.refreshingDeferred) === null || r === void 0 || r.reject(n3), n3;
    } finally {
      this.refreshingDeferred = null, this._debug(s, "end");
    }
  }
  async _notifyAllSubscribers(e, t, r = true) {
    let s = `#_notifyAllSubscribers(${e})`;
    this._debug(s, "begin", t, `broadcast = ${r}`);
    try {
      this.broadcastChannel && r && this.broadcastChannel.postMessage({
        event: e,
        session: t
      });
      let n3 = [], o3 = Array.from(this.stateChangeEmitters.values()).map(async (a) => {
        try {
          await a.callback(e, t);
        } catch (l) {
          n3.push(l);
        }
      });
      if (await Promise.all(o3), n3.length > 0) {
        for (let a = 0; a < n3.length; a += 1) console.error(n3[a]);
        throw n3[0];
      }
    } finally {
      this._debug(s, "end");
    }
  }
  async _saveSession(e) {
    this._debug("#_saveSession()", e), this.suppressGetSessionWarning = true, await A(this.storage, `${this.storageKey}-code-verifier`);
    let t = Object.assign({}, e), r = t.user && t.user.__isUserNotAvailableProxy === true;
    if (this.userStorage) {
      !r && t.user && await X(this.userStorage, this.storageKey + "-user", {
        user: t.user
      });
      let s = Object.assign({}, t);
      delete s.user;
      let n3 = Ie(s);
      await X(this.storage, this.storageKey, n3);
    } else {
      let s = Ie(t);
      await X(this.storage, this.storageKey, s);
    }
  }
  async _removeSession() {
    this._sessionRemovalEpoch += 1, this._debug("#_removeSession()"), this.suppressGetSessionWarning = false, await A(this.storage, this.storageKey), await A(this.storage, this.storageKey + "-code-verifier"), await A(this.storage, this.storageKey + "-user"), this.userStorage && await A(this.userStorage, this.storageKey + "-user"), await this._notifyAllSubscribers("SIGNED_OUT", null);
  }
  _removeVisibilityChangedCallback() {
    this._debug("#_removeVisibilityChangedCallback()");
    let e = this.visibilityChangedCallback;
    this.visibilityChangedCallback = null;
    try {
      e && T() && globalThis?.removeEventListener && globalThis.removeEventListener("visibilitychange", e);
    } catch (t) {
      console.error("removing visibilitychange callback failed", t);
    }
  }
  async _startAutoRefresh() {
    await this._stopAutoRefresh(), this._debug("#_startAutoRefresh()");
    let e = setInterval(() => this._autoRefreshTokenTick(), q);
    this.autoRefreshTicker = e, e && typeof e == "object" && typeof e.unref == "function" ? e.unref() : typeof Deno < "u" && typeof Deno.unrefTimer == "function" && Deno.unrefTimer(e);
    let t = setTimeout(async () => {
      await this.initializePromise, await this._autoRefreshTokenTick();
    }, 0);
    this.autoRefreshTickTimeout = t, t && typeof t == "object" && typeof t.unref == "function" ? t.unref() : typeof Deno < "u" && typeof Deno.unrefTimer == "function" && Deno.unrefTimer(t);
  }
  async _stopAutoRefresh() {
    this._debug("#_stopAutoRefresh()");
    let e = this.autoRefreshTicker;
    this.autoRefreshTicker = null, e && clearInterval(e);
    let t = this.autoRefreshTickTimeout;
    this.autoRefreshTickTimeout = null, t && clearTimeout(t);
  }
  async startAutoRefresh() {
    this._removeVisibilityChangedCallback(), await this._startAutoRefresh();
  }
  async stopAutoRefresh() {
    this._removeVisibilityChangedCallback(), await this._stopAutoRefresh();
  }
  async dispose() {
    var e;
    this._removeVisibilityChangedCallback(), await this._stopAutoRefresh(), (e = this.broadcastChannel) === null || e === void 0 || e.close(), this.broadcastChannel = null, this.stateChangeEmitters.clear();
  }
  async _autoRefreshTokenTick() {
    if (this._debug("#_autoRefreshTokenTick()", "begin"), this.lock != null) {
      try {
        await this._acquireLock(0, async () => {
          try {
            let e = Date.now();
            try {
              return await this._useSession(async (t) => {
                let { data: { session: r } } = t;
                if (!r || !r.refresh_token || !r.expires_at) {
                  this._debug("#_autoRefreshTokenTick()", "no session");
                  return;
                }
                let s = Math.floor((r.expires_at * 1e3 - e) / q);
                this._debug("#_autoRefreshTokenTick()", `access token expires in ${s} ticks, a tick lasts ${q}ms, refresh threshold is ${ee} ticks`), s <= ee && await this._callRefreshToken(r.refresh_token);
              });
            } catch (t) {
              console.error("Auto refresh tick failed with error. This is likely a transient error.", t);
            }
          } finally {
            this._debug("#_autoRefreshTokenTick()", "end");
          }
        });
      } catch (e) {
        if (e instanceof V) this._debug("auto refresh token tick lock not available");
        else throw e;
      }
      return;
    }
    if (this.refreshingDeferred !== null) {
      this._debug("#_autoRefreshTokenTick()", "refresh already in flight, skipping");
      return;
    }
    try {
      let e = Date.now();
      try {
        await this._useSession(async (t) => {
          let { data: { session: r } } = t;
          if (!r || !r.refresh_token || !r.expires_at) {
            this._debug("#_autoRefreshTokenTick()", "no session");
            return;
          }
          let s = Math.floor((r.expires_at * 1e3 - e) / q);
          this._debug("#_autoRefreshTokenTick()", `access token expires in ${s} ticks, a tick lasts ${q}ms, refresh threshold is ${ee} ticks`), s <= ee && await this._callRefreshToken(r.refresh_token);
        });
      } catch (t) {
        console.error("Auto refresh tick failed with error. This is likely a transient error.", t);
      }
    } finally {
      this._debug("#_autoRefreshTokenTick()", "end");
    }
  }
  async _handleVisibilityChange() {
    if (this._debug("#_handleVisibilityChange()"), !T() || !globalThis?.addEventListener) return this.autoRefreshToken && this.startAutoRefresh(), false;
    try {
      this.visibilityChangedCallback = async () => {
        try {
          await this._onVisibilityChanged(false);
        } catch (e) {
          this._debug("#visibilityChangedCallback", "error", e);
        }
      }, globalThis?.addEventListener("visibilitychange", this.visibilityChangedCallback), await this._onVisibilityChanged(true);
    } catch (e) {
      console.error("_handleVisibilityChange", e);
    }
  }
  async _onVisibilityChanged(e) {
    let t = `#_onVisibilityChanged(${e})`;
    if (this._debug(t, "visibilityState", document.visibilityState), document.visibilityState === "visible") {
      if (this.autoRefreshToken && this._startAutoRefresh(), !e) if (await this.initializePromise, this.lock != null) await this._acquireLock(this.lockAcquireTimeout, async () => {
        if (document.visibilityState !== "visible") {
          this._debug(t, "acquired the lock to recover the session, but the browser visibilityState is no longer visible, aborting");
          return;
        }
        await this._recoverAndRefresh();
      });
      else {
        if (document.visibilityState !== "visible") {
          this._debug(t, "visibilityState is no longer visible, skipping recovery");
          return;
        }
        await this._recoverAndRefresh();
      }
    } else document.visibilityState === "hidden" && this.autoRefreshToken && this._stopAutoRefresh();
  }
  async _getUrlForProvider(e, t, r) {
    let s = [
      `provider=${encodeURIComponent(t)}`
    ];
    if (r?.redirectTo && s.push(`redirect_to=${encodeURIComponent(r.redirectTo)}`), r?.scopes && s.push(`scopes=${encodeURIComponent(r.scopes)}`), this.flowType === "pkce") {
      let [n3, o3] = await F2(this.storage, this.storageKey), a = new URLSearchParams({
        code_challenge: `${encodeURIComponent(n3)}`,
        code_challenge_method: `${encodeURIComponent(o3)}`
      });
      s.push(a.toString());
    }
    if (r?.queryParams) {
      let n3 = new URLSearchParams(r.queryParams);
      s.push(n3.toString());
    }
    return r?.skipBrowserRedirect && s.push(`skip_http_redirect=${r.skipBrowserRedirect}`), `${e}?${s.join("&")}`;
  }
  async _unenroll(e) {
    try {
      return await this._useSession(async (t) => {
        var r;
        let { data: s, error: n3 } = t;
        return n3 ? this._returnResult({
          data: null,
          error: n3
        }) : await f(this.fetch, "DELETE", `${this.url}/factors/${e.factorId}`, {
          headers: this.headers,
          jwt: (r = s?.session) === null || r === void 0 ? void 0 : r.access_token
        });
      });
    } catch (t) {
      if (h(t)) return this._returnResult({
        data: null,
        error: t
      });
      throw t;
    }
  }
  async _enroll(e) {
    try {
      return await this._useSession(async (t) => {
        var r, s;
        let { data: n3, error: o3 } = t;
        if (o3) return this._returnResult({
          data: null,
          error: o3
        });
        let a = Object.assign({
          friendly_name: e.friendlyName,
          factor_type: e.factorType
        }, e.factorType === "phone" ? {
          phone: e.phone
        } : e.factorType === "totp" ? {
          issuer: e.issuer
        } : {}), { data: l, error: u4 } = await f(this.fetch, "POST", `${this.url}/factors`, {
          body: a,
          headers: this.headers,
          jwt: (r = n3?.session) === null || r === void 0 ? void 0 : r.access_token
        });
        return u4 ? this._returnResult({
          data: null,
          error: u4
        }) : (e.factorType === "totp" && l.type === "totp" && (!((s = l?.totp) === null || s === void 0) && s.qr_code) && (l.totp.qr_code = `data:image/svg+xml;utf-8,${l.totp.qr_code}`), this._returnResult({
          data: l,
          error: null
        }));
      });
    } catch (t) {
      if (h(t)) return this._returnResult({
        data: null,
        error: t
      });
      throw t;
    }
  }
  async _verify(e) {
    let t = async () => {
      try {
        return await this._useSession(async (r) => {
          var s;
          let { data: n3, error: o3 } = r;
          if (o3) return this._returnResult({
            data: null,
            error: o3
          });
          let a = Object.assign({
            challenge_id: e.challengeId
          }, "webauthn" in e ? {
            webauthn: Object.assign(Object.assign({}, e.webauthn), {
              credential_response: e.webauthn.type === "create" ? De(e.webauthn.credential_response) : qe(e.webauthn.credential_response)
            })
          } : {
            code: e.code
          }), { data: l, error: u4 } = await f(this.fetch, "POST", `${this.url}/factors/${e.factorId}/verify`, {
            body: a,
            headers: this.headers,
            jwt: (s = n3?.session) === null || s === void 0 ? void 0 : s.access_token
          });
          return u4 ? this._returnResult({
            data: null,
            error: u4
          }) : (await this._saveSession(Object.assign({
            expires_at: Math.round(Date.now() / 1e3) + l.expires_in
          }, l)), await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED", l), this._returnResult({
            data: l,
            error: u4
          }));
        });
      } catch (r) {
        if (h(r)) return this._returnResult({
          data: null,
          error: r
        });
        throw r;
      }
    };
    return this.lock != null ? this._acquireLock(this.lockAcquireTimeout, t) : t();
  }
  async _challenge(e) {
    let t = async () => {
      try {
        return await this._useSession(async (r) => {
          var s;
          let { data: n3, error: o3 } = r;
          if (o3) return this._returnResult({
            data: null,
            error: o3
          });
          let a = await f(this.fetch, "POST", `${this.url}/factors/${e.factorId}/challenge`, {
            body: e,
            headers: this.headers,
            jwt: (s = n3?.session) === null || s === void 0 ? void 0 : s.access_token
          });
          if (a.error) return a;
          let { data: l } = a;
          if (l.type !== "webauthn") return {
            data: l,
            error: null
          };
          switch (l.webauthn.type) {
            case "create":
              return {
                data: Object.assign(Object.assign({}, l), {
                  webauthn: Object.assign(Object.assign({}, l.webauthn), {
                    credential_options: Object.assign(Object.assign({}, l.webauthn.credential_options), {
                      publicKey: Ne(l.webauthn.credential_options.publicKey)
                    })
                  })
                }),
                error: null
              };
            case "request":
              return {
                data: Object.assign(Object.assign({}, l), {
                  webauthn: Object.assign(Object.assign({}, l.webauthn), {
                    credential_options: Object.assign(Object.assign({}, l.webauthn.credential_options), {
                      publicKey: Le(l.webauthn.credential_options.publicKey)
                    })
                  })
                }),
                error: null
              };
          }
        });
      } catch (r) {
        if (h(r)) return this._returnResult({
          data: null,
          error: r
        });
        throw r;
      }
    };
    return this.lock != null ? this._acquireLock(this.lockAcquireTimeout, t) : t();
  }
  async _challengeAndVerify(e) {
    let { data: t, error: r } = await this._challenge({
      factorId: e.factorId
    });
    return r ? this._returnResult({
      data: null,
      error: r
    }) : await this._verify({
      factorId: e.factorId,
      challengeId: t.id,
      code: e.code
    });
  }
  async _listFactors() {
    var e;
    let { data: { user: t }, error: r } = await this.getUser();
    if (r) return {
      data: null,
      error: r
    };
    let s = {
      all: [],
      phone: [],
      totp: [],
      webauthn: []
    };
    for (let n3 of (e = t?.factors) !== null && e !== void 0 ? e : []) s.all.push(n3), n3.status === "verified" && s[n3.factor_type].push(n3);
    return {
      data: s,
      error: null
    };
  }
  async _getAuthenticatorAssuranceLevel(e) {
    var t, r, s, n3;
    if (e) try {
      let { payload: _6 } = ue(e), v4 = null;
      _6.aal && (v4 = _6.aal);
      let b3 = v4, { data: { user: y4 }, error: m3 } = await this.getUser(e);
      if (m3) return this._returnResult({
        data: null,
        error: m3
      });
      ((r = (t = y4?.factors) === null || t === void 0 ? void 0 : t.filter((R5) => R5.status === "verified")) !== null && r !== void 0 ? r : []).length > 0 && (b3 = "aal2");
      let g3 = _6.amr || [];
      return {
        data: {
          currentLevel: v4,
          nextLevel: b3,
          currentAuthenticationMethods: g3
        },
        error: null
      };
    } catch (_6) {
      if (h(_6)) return this._returnResult({
        data: null,
        error: _6
      });
      throw _6;
    }
    let { data: { session: o3 }, error: a } = await this.getSession();
    if (a) return this._returnResult({
      data: null,
      error: a
    });
    if (!o3) return {
      data: {
        currentLevel: null,
        nextLevel: null,
        currentAuthenticationMethods: []
      },
      error: null
    };
    let { payload: l } = ue(o3.access_token), u4 = null;
    l.aal && (u4 = l.aal);
    let c3 = u4;
    ((n3 = (s = o3.user.factors) === null || s === void 0 ? void 0 : s.filter((_6) => _6.status === "verified")) !== null && n3 !== void 0 ? n3 : []).length > 0 && (c3 = "aal2");
    let d2 = l.amr || [];
    return {
      data: {
        currentLevel: u4,
        nextLevel: c3,
        currentAuthenticationMethods: d2
      },
      error: null
    };
  }
  async _getAuthorizationDetails(e) {
    try {
      return await this._useSession(async (t) => {
        let { data: { session: r }, error: s } = t;
        return s ? this._returnResult({
          data: null,
          error: s
        }) : r ? await f(this.fetch, "GET", `${this.url}/oauth/authorizations/${e}`, {
          headers: this.headers,
          jwt: r.access_token,
          xform: (n3) => ({
            data: n3,
            error: null
          })
        }) : this._returnResult({
          data: null,
          error: new E()
        });
      });
    } catch (t) {
      if (h(t)) return this._returnResult({
        data: null,
        error: t
      });
      throw t;
    }
  }
  async _approveAuthorization(e, t) {
    try {
      return await this._useSession(async (r) => {
        let { data: { session: s }, error: n3 } = r;
        if (n3) return this._returnResult({
          data: null,
          error: n3
        });
        if (!s) return this._returnResult({
          data: null,
          error: new E()
        });
        let o3 = await f(this.fetch, "POST", `${this.url}/oauth/authorizations/${e}/consent`, {
          headers: this.headers,
          jwt: s.access_token,
          body: {
            action: "approve"
          },
          xform: (a) => ({
            data: a,
            error: null
          })
        });
        return o3.data && o3.data.redirect_url && T() && !t?.skipBrowserRedirect && globalThis.location.assign(o3.data.redirect_url), o3;
      });
    } catch (r) {
      if (h(r)) return this._returnResult({
        data: null,
        error: r
      });
      throw r;
    }
  }
  async _denyAuthorization(e, t) {
    try {
      return await this._useSession(async (r) => {
        let { data: { session: s }, error: n3 } = r;
        if (n3) return this._returnResult({
          data: null,
          error: n3
        });
        if (!s) return this._returnResult({
          data: null,
          error: new E()
        });
        let o3 = await f(this.fetch, "POST", `${this.url}/oauth/authorizations/${e}/consent`, {
          headers: this.headers,
          jwt: s.access_token,
          body: {
            action: "deny"
          },
          xform: (a) => ({
            data: a,
            error: null
          })
        });
        return o3.data && o3.data.redirect_url && T() && !t?.skipBrowserRedirect && globalThis.location.assign(o3.data.redirect_url), o3;
      });
    } catch (r) {
      if (h(r)) return this._returnResult({
        data: null,
        error: r
      });
      throw r;
    }
  }
  async _listOAuthGrants() {
    try {
      return await this._useSession(async (e) => {
        let { data: { session: t }, error: r } = e;
        return r ? this._returnResult({
          data: null,
          error: r
        }) : t ? await f(this.fetch, "GET", `${this.url}/user/oauth/grants`, {
          headers: this.headers,
          jwt: t.access_token,
          xform: (s) => ({
            data: s,
            error: null
          })
        }) : this._returnResult({
          data: null,
          error: new E()
        });
      });
    } catch (e) {
      if (h(e)) return this._returnResult({
        data: null,
        error: e
      });
      throw e;
    }
  }
  async _revokeOAuthGrant(e) {
    try {
      return await this._useSession(async (t) => {
        let { data: { session: r }, error: s } = t;
        return s ? this._returnResult({
          data: null,
          error: s
        }) : r ? (await f(this.fetch, "DELETE", `${this.url}/user/oauth/grants`, {
          headers: this.headers,
          jwt: r.access_token,
          query: {
            client_id: e.clientId
          },
          noResolveJson: true
        }), {
          data: {},
          error: null
        }) : this._returnResult({
          data: null,
          error: new E()
        });
      });
    } catch (t) {
      if (h(t)) return this._returnResult({
        data: null,
        error: t
      });
      throw t;
    }
  }
  async fetchJwk(e, t = {
    keys: []
  }) {
    let r = t.keys.find((a) => a.kid === e);
    if (r) return r;
    let s = Date.now();
    if (r = this.jwks.keys.find((a) => a.kid === e), r && this.jwks_cached_at + Ve > s) return r;
    let { data: n3, error: o3 } = await f(this.fetch, "GET", `${this.url}/.well-known/jwks.json`, {
      headers: this.headers
    });
    if (o3) throw o3;
    return !n3.keys || n3.keys.length === 0 || (this.jwks = n3, this.jwks_cached_at = s, r = n3.keys.find((a) => a.kid === e), !r) ? null : r;
  }
  async getClaims(e, t = {}) {
    try {
      let r = e;
      if (!r) {
        let { data: _6, error: v4 } = await this.getSession();
        if (v4 || !_6.session) return this._returnResult({
          data: null,
          error: v4
        });
        r = _6.session.access_token;
      }
      let { header: s, payload: n3, signature: o3, raw: { header: a, payload: l } } = ue(r);
      if (!t?.allowExpired) try {
        lt(n3.exp);
      } catch (_6) {
        throw new G(_6 instanceof Error ? _6.message : "JWT validation failed");
      }
      let u4 = !s.alg || s.alg.startsWith("HS") || !s.kid || !("crypto" in globalThis && "subtle" in globalThis.crypto) ? null : await this.fetchJwk(s.kid, t?.keys ? {
        keys: t.keys
      } : t?.jwks);
      if (!u4) {
        let { error: _6 } = await this.getUser(r);
        if (_6) throw _6;
        return {
          data: {
            claims: n3,
            header: s,
            signature: o3
          },
          error: null
        };
      }
      let c3 = ut(s.alg), w6 = await crypto.subtle.importKey("jwk", u4, c3, true, [
        "verify"
      ]);
      if (!await crypto.subtle.verify(c3, w6, o3, et(`${a}.${l}`))) throw new G("Invalid JWT signature");
      return {
        data: {
          claims: n3,
          header: s,
          signature: o3
        },
        error: null
      };
    } catch (r) {
      if (h(r)) return this._returnResult({
        data: null,
        error: r
      });
      throw r;
    }
  }
  async signInWithPasskey(e) {
    var t, r, s;
    O(this.experimental);
    try {
      if (!he()) return this._returnResult({
        data: null,
        error: new x("Browser does not support WebAuthn", null)
      });
      let { data: n3, error: o3 } = await this._startPasskeyAuthentication({
        options: {
          captchaToken: (t = e?.options) === null || t === void 0 ? void 0 : t.captchaToken
        }
      });
      if (o3 || !n3) return this._returnResult({
        data: null,
        error: o3
      });
      let a = Le(n3.options), l = (s = (r = e?.options) === null || r === void 0 ? void 0 : r.signal) !== null && s !== void 0 ? s : Se.createNewAbortSignal(), { data: u4, error: c3 } = await We({
        publicKey: a,
        signal: l
      });
      if (c3 || !u4) return this._returnResult({
        data: null,
        error: c3 ?? new x("WebAuthn ceremony failed", null)
      });
      let w6 = qe(u4);
      return this._verifyPasskeyAuthentication({
        challengeId: n3.challenge_id,
        credential: w6
      });
    } catch (n3) {
      if (h(n3)) return this._returnResult({
        data: null,
        error: n3
      });
      throw n3;
    }
  }
  async registerPasskey(e) {
    var t, r;
    O(this.experimental);
    try {
      if (!he()) return this._returnResult({
        data: null,
        error: new x("Browser does not support WebAuthn", null)
      });
      let { data: s, error: n3 } = await this._startPasskeyRegistration();
      if (n3 || !s) return this._returnResult({
        data: null,
        error: n3
      });
      let o3 = Ne(s.options), a = (r = (t = e?.options) === null || t === void 0 ? void 0 : t.signal) !== null && r !== void 0 ? r : Se.createNewAbortSignal(), { data: l, error: u4 } = await Ke({
        publicKey: o3,
        signal: a
      });
      if (u4 || !l) return this._returnResult({
        data: null,
        error: u4 ?? new x("WebAuthn ceremony failed", null)
      });
      let c3 = De(l);
      return this._verifyPasskeyRegistration({
        challengeId: s.challenge_id,
        credential: c3
      });
    } catch (s) {
      if (h(s)) return this._returnResult({
        data: null,
        error: s
      });
      throw s;
    }
  }
  async _startPasskeyRegistration() {
    O(this.experimental);
    try {
      return await this._useSession(async (e) => {
        let { data: { session: t }, error: r } = e;
        if (r) return this._returnResult({
          data: null,
          error: r
        });
        if (!t) return this._returnResult({
          data: null,
          error: new E()
        });
        let { data: s, error: n3 } = await f(this.fetch, "POST", `${this.url}/passkeys/registration/options`, {
          headers: this.headers,
          jwt: t.access_token,
          body: {}
        });
        return n3 ? this._returnResult({
          data: null,
          error: n3
        }) : this._returnResult({
          data: s,
          error: null
        });
      });
    } catch (e) {
      if (h(e)) return this._returnResult({
        data: null,
        error: e
      });
      throw e;
    }
  }
  async _verifyPasskeyRegistration(e) {
    O(this.experimental);
    try {
      return await this._useSession(async (t) => {
        let { data: { session: r }, error: s } = t;
        if (s) return this._returnResult({
          data: null,
          error: s
        });
        if (!r) return this._returnResult({
          data: null,
          error: new E()
        });
        let { data: n3, error: o3 } = await f(this.fetch, "POST", `${this.url}/passkeys/registration/verify`, {
          headers: this.headers,
          jwt: r.access_token,
          body: {
            challenge_id: e.challengeId,
            credential: e.credential
          }
        });
        return o3 ? this._returnResult({
          data: null,
          error: o3
        }) : this._returnResult({
          data: n3,
          error: null
        });
      });
    } catch (t) {
      if (h(t)) return this._returnResult({
        data: null,
        error: t
      });
      throw t;
    }
  }
  async _startPasskeyAuthentication(e) {
    var t;
    O(this.experimental);
    try {
      let { data: r, error: s } = await f(this.fetch, "POST", `${this.url}/passkeys/authentication/options`, {
        headers: this.headers,
        body: {
          gotrue_meta_security: {
            captcha_token: (t = e?.options) === null || t === void 0 ? void 0 : t.captchaToken
          }
        }
      });
      return s ? this._returnResult({
        data: null,
        error: s
      }) : this._returnResult({
        data: r,
        error: null
      });
    } catch (r) {
      if (h(r)) return this._returnResult({
        data: null,
        error: r
      });
      throw r;
    }
  }
  async _verifyPasskeyAuthentication(e) {
    O(this.experimental);
    try {
      let { data: t, error: r } = await f(this.fetch, "POST", `${this.url}/passkeys/authentication/verify`, {
        headers: this.headers,
        body: {
          challenge_id: e.challengeId,
          credential: e.credential
        },
        xform: P
      });
      return r ? this._returnResult({
        data: null,
        error: r
      }) : (t.session && (await this._saveSession(t.session), await this._notifyAllSubscribers("SIGNED_IN", t.session)), this._returnResult({
        data: t,
        error: null
      }));
    } catch (t) {
      if (h(t)) return this._returnResult({
        data: null,
        error: t
      });
      throw t;
    }
  }
  async _listPasskeys() {
    O(this.experimental);
    try {
      return await this._useSession(async (e) => {
        let { data: { session: t }, error: r } = e;
        if (r) return this._returnResult({
          data: null,
          error: r
        });
        if (!t) return this._returnResult({
          data: null,
          error: new E()
        });
        let { data: s, error: n3 } = await f(this.fetch, "GET", `${this.url}/passkeys`, {
          headers: this.headers,
          jwt: t.access_token,
          xform: (o3) => ({
            data: o3,
            error: null
          })
        });
        return n3 ? this._returnResult({
          data: null,
          error: n3
        }) : this._returnResult({
          data: s,
          error: null
        });
      });
    } catch (e) {
      if (h(e)) return this._returnResult({
        data: null,
        error: e
      });
      throw e;
    }
  }
  async _updatePasskey(e) {
    O(this.experimental);
    try {
      return await this._useSession(async (t) => {
        let { data: { session: r }, error: s } = t;
        if (s) return this._returnResult({
          data: null,
          error: s
        });
        if (!r) return this._returnResult({
          data: null,
          error: new E()
        });
        let { data: n3, error: o3 } = await f(this.fetch, "PATCH", `${this.url}/passkeys/${e.passkeyId}`, {
          headers: this.headers,
          jwt: r.access_token,
          body: {
            friendly_name: e.friendlyName
          }
        });
        return o3 ? this._returnResult({
          data: null,
          error: o3
        }) : this._returnResult({
          data: n3,
          error: null
        });
      });
    } catch (t) {
      if (h(t)) return this._returnResult({
        data: null,
        error: t
      });
      throw t;
    }
  }
  async _deletePasskey(e) {
    O(this.experimental);
    try {
      return await this._useSession(async (t) => {
        let { data: { session: r }, error: s } = t;
        if (s) return this._returnResult({
          data: null,
          error: s
        });
        if (!r) return this._returnResult({
          data: null,
          error: new E()
        });
        let { error: n3 } = await f(this.fetch, "DELETE", `${this.url}/passkeys/${e.passkeyId}`, {
          headers: this.headers,
          jwt: r.access_token,
          noResolveJson: true
        });
        return n3 ? this._returnResult({
          data: null,
          error: n3
        }) : this._returnResult({
          data: null,
          error: null
        });
      });
    } catch (t) {
      if (h(t)) return this._returnResult({
        data: null,
        error: t
      });
      throw t;
    }
  }
};
Ee.nextInstanceID = {};
var Me = Ee;
var Jt = Me;
var Ht = Jt;

// deno:https://esm.sh/@supabase/functions-js@2.108.1/denonext/functions-js.mjs
var O2 = (e) => e ? (...t) => e(...t) : (...t) => fetch(...t);
var c = class extends Error {
  constructor(t, p4 = "FunctionsError", n3) {
    super(t), this.name = p4, this.context = n3;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      context: this.context
    };
  }
};
var x2 = class extends c {
  constructor(t) {
    super("Failed to send a request to the Edge Function", "FunctionsFetchError", t);
  }
};
var f2 = class extends c {
  constructor(t) {
    super("Relay Error invoking the Edge Function", "FunctionsRelayError", t);
  }
};
var u = class extends c {
  constructor(t) {
    super("Edge Function returned a non-2xx status code", "FunctionsHttpError", t);
  }
};
var E2;
(function(e) {
  e.Any = "any", e.ApNortheast1 = "ap-northeast-1", e.ApNortheast2 = "ap-northeast-2", e.ApSouth1 = "ap-south-1", e.ApSoutheast1 = "ap-southeast-1", e.ApSoutheast2 = "ap-southeast-2", e.CaCentral1 = "ca-central-1", e.EuCentral1 = "eu-central-1", e.EuWest1 = "eu-west-1", e.EuWest2 = "eu-west-2", e.EuWest3 = "eu-west-3", e.SaEast1 = "sa-east-1", e.UsEast1 = "us-east-1", e.UsWest1 = "us-west-1", e.UsWest2 = "us-west-2";
})(E2 || (E2 = {}));
var A2 = class {
  constructor(t, { headers: p4 = {}, customFetch: n3, region: h3 = E2.Any } = {}) {
    this.url = t, this.headers = p4, this.region = h3, this.fetch = O2(n3);
  }
  setAuth(t) {
    this.headers.Authorization = `Bearer ${t}`;
  }
  invoke(t) {
    return F(this, arguments, void 0, function* (p4, n3 = {}) {
      var h3;
      let g3, d2;
      try {
        let { headers: o3, method: T7, body: r, signal: b3, timeout: v4 } = n3, y4 = {}, { region: i4 } = n3;
        i4 || (i4 = this.region);
        let C6 = new URL(`${this.url}/${p4}`);
        i4 && i4 !== "any" && (y4["x-region"] = i4, C6.searchParams.set("forceFunctionRegion", i4));
        let a;
        r && (o3 && !Object.prototype.hasOwnProperty.call(o3, "Content-Type") || !o3) ? typeof Blob < "u" && r instanceof Blob || r instanceof ArrayBuffer ? (y4["Content-Type"] = "application/octet-stream", a = r) : typeof r == "string" ? (y4["Content-Type"] = "text/plain", a = r) : typeof FormData < "u" && r instanceof FormData ? a = r : (y4["Content-Type"] = "application/json", a = JSON.stringify(r)) : r && typeof r != "string" && !(typeof Blob < "u" && r instanceof Blob) && !(r instanceof ArrayBuffer) && !(typeof FormData < "u" && r instanceof FormData) ? a = JSON.stringify(r) : a = r;
        let w6 = b3;
        v4 && (d2 = new AbortController(), g3 = setTimeout(() => d2.abort(), v4), b3 ? (w6 = d2.signal, b3.addEventListener("abort", () => d2.abort())) : w6 = d2.signal);
        let s = yield this.fetch(C6.toString(), {
          method: T7 || "POST",
          headers: Object.assign(Object.assign(Object.assign({}, y4), this.headers), o3),
          body: a,
          signal: w6
        }).catch((F6) => {
          throw new x2(F6);
        }), S6 = s.headers.get("x-relay-error");
        if (S6 && S6 === "true") throw new f2(s);
        if (!s.ok) throw new u(s);
        let m3 = ((h3 = s.headers.get("Content-Type")) !== null && h3 !== void 0 ? h3 : "text/plain").split(";")[0].trim(), l;
        return m3 === "application/json" ? l = yield s.json() : m3 === "application/octet-stream" || m3 === "application/pdf" ? l = yield s.blob() : m3 === "text/event-stream" ? l = s : m3 === "multipart/form-data" ? l = yield s.formData() : l = yield s.text(), {
          data: l,
          error: null,
          response: s
        };
      } catch (o3) {
        return {
          data: null,
          error: o3,
          response: o3 instanceof u || o3 instanceof f2 ? o3.context : void 0
        };
      } finally {
        g3 && clearTimeout(g3);
      }
    });
  }
};

// deno:https://esm.sh/@supabase/postgrest-js@2.108.1/denonext/postgrest-js.mjs
var L2 = (t) => Math.min(1e3 * 2 ** t, 3e4);
var D = [
  520,
  503
];
var j = [
  "GET",
  "HEAD",
  "OPTIONS"
];
var b = class extends Error {
  constructor(t) {
    super(t.message), this.name = "PostgrestError", this.details = t.details, this.hint = t.hint, this.code = t.code;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      details: this.details,
      hint: this.hint,
      code: this.code
    };
  }
};
function A3(t, e) {
  return new Promise((r) => {
    if (e?.aborted) {
      r();
      return;
    }
    let s = setTimeout(() => {
      e?.removeEventListener("abort", l), r();
    }, t);
    function l() {
      clearTimeout(s), r();
    }
    e?.addEventListener("abort", l);
  });
}
function N2(t, e, r, s) {
  return !(!s || r >= 3 || !j.includes(t) || !D.includes(e));
}
var E3 = class {
  constructor(t) {
    var e, r, s, l, a;
    this.shouldThrowOnError = false, this.retryEnabled = true, this.method = t.method, this.url = t.url, this.headers = new Headers(t.headers), this.schema = t.schema, this.body = t.body, this.shouldThrowOnError = (e = t.shouldThrowOnError) !== null && e !== void 0 ? e : false, this.signal = t.signal, this.isMaybeSingle = (r = t.isMaybeSingle) !== null && r !== void 0 ? r : false, this.shouldStripNulls = (s = t.shouldStripNulls) !== null && s !== void 0 ? s : false, this.urlLengthLimit = (l = t.urlLengthLimit) !== null && l !== void 0 ? l : 8e3, this.retryEnabled = (a = t.retry) !== null && a !== void 0 ? a : true, t.fetch ? this.fetch = t.fetch : this.fetch = fetch;
  }
  throwOnError() {
    return this.shouldThrowOnError = true, this;
  }
  stripNulls() {
    if (this.headers.get("Accept") === "text/csv") throw new Error("stripNulls() cannot be used with csv()");
    return this.shouldStripNulls = true, this;
  }
  setHeader(t, e) {
    return this.headers = new Headers(this.headers), this.headers.set(t, e), this;
  }
  retry(t) {
    return this.retryEnabled = t, this;
  }
  then(t, e) {
    var r = this;
    if (this.schema === void 0 || ([
      "GET",
      "HEAD"
    ].includes(this.method) ? this.headers.set("Accept-Profile", this.schema) : this.headers.set("Content-Profile", this.schema)), this.method !== "GET" && this.method !== "HEAD" && this.headers.set("Content-Type", "application/json"), this.shouldStripNulls) {
      let i4 = this.headers.get("Accept");
      i4 === "application/vnd.pgrst.object+json" ? this.headers.set("Accept", "application/vnd.pgrst.object+json;nulls=stripped") : (!i4 || i4 === "application/json") && this.headers.set("Accept", "application/vnd.pgrst.array+json;nulls=stripped");
    }
    let s = this.fetch, a = (async () => {
      let i4 = 0;
      for (; ; ) {
        let o3 = {};
        r.headers.forEach((n3, d2) => {
          o3[d2] = n3;
        }), i4 > 0 && (o3["X-Retry-Count"] = String(i4));
        let c3;
        try {
          c3 = await s(r.url.toString(), {
            method: r.method,
            headers: o3,
            body: JSON.stringify(r.body, (n3, d2) => typeof d2 == "bigint" ? d2.toString() : d2),
            signal: r.signal
          });
        } catch (n3) {
          if (n3?.name === "AbortError" || n3?.code === "ABORT_ERR" || !j.includes(r.method)) throw n3;
          if (r.retryEnabled && i4 < 3) {
            let d2 = L2(i4);
            i4++, await A3(d2, r.signal);
            continue;
          }
          throw n3;
        }
        if (N2(r.method, c3.status, i4, r.retryEnabled)) {
          var u4, h3;
          let n3 = (u4 = (h3 = c3.headers) === null || h3 === void 0 ? void 0 : h3.get("Retry-After")) !== null && u4 !== void 0 ? u4 : null, d2 = n3 !== null ? Math.max(0, parseInt(n3, 10) || 0) * 1e3 : L2(i4);
          await c3.text(), i4++, await A3(d2, r.signal);
          continue;
        }
        return await r.processResponse(c3);
      }
    })();
    return this.shouldThrowOnError || (a = a.catch((i4) => {
      var u4;
      let h3 = "", o3 = "", c3 = "", n3 = i4?.cause;
      if (n3) {
        var d2, p4, f4, P5;
        let k3 = (d2 = n3?.message) !== null && d2 !== void 0 ? d2 : "", $7 = (p4 = n3?.code) !== null && p4 !== void 0 ? p4 : "";
        h3 = `${(f4 = i4?.name) !== null && f4 !== void 0 ? f4 : "FetchError"}: ${i4?.message}`, h3 += `

Caused by: ${(P5 = n3?.name) !== null && P5 !== void 0 ? P5 : "Error"}: ${k3}`, $7 && (h3 += ` (${$7})`), n3?.stack && (h3 += `
${n3.stack}`);
      } else {
        var w6;
        h3 = (w6 = i4?.stack) !== null && w6 !== void 0 ? w6 : "";
      }
      let g3 = this.url.toString().length;
      return i4?.name === "AbortError" || i4?.code === "ABORT_ERR" ? (c3 = "", o3 = "Request was aborted (timeout or manual cancellation)", g3 > this.urlLengthLimit && (o3 += `. Note: Your request URL is ${g3} characters, which may exceed server limits. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [many IDs])), consider using an RPC function to pass values server-side.`)) : (n3?.name === "HeadersOverflowError" || n3?.code === "UND_ERR_HEADERS_OVERFLOW") && (c3 = "", o3 = "HTTP headers exceeded server limits (typically 16KB)", g3 > this.urlLengthLimit && (o3 += `. Your request URL is ${g3} characters. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [200+ IDs])), consider using an RPC function instead.`)), {
        success: false,
        error: {
          message: `${(u4 = i4?.name) !== null && u4 !== void 0 ? u4 : "FetchError"}: ${i4?.message}`,
          details: h3,
          hint: o3,
          code: c3
        },
        data: null,
        count: null,
        status: 0,
        statusText: ""
      };
    })), a.then(t, e);
  }
  async processResponse(t) {
    var e = this;
    let r = null, s = null, l = null, a = t.status, i4 = t.statusText;
    if (t.ok) {
      var u4, h3;
      if (e.method !== "HEAD") {
        var o3;
        let d2 = await t.text();
        if (d2 !== "") if (e.headers.get("Accept") === "text/csv") s = d2;
        else if (e.headers.get("Accept") && (!((o3 = e.headers.get("Accept")) === null || o3 === void 0) && o3.includes("application/vnd.pgrst.plan+text"))) s = d2;
        else try {
          s = JSON.parse(d2);
        } catch {
          if (r = {
            message: d2
          }, s = null, e.shouldThrowOnError) throw new b({
            message: d2,
            details: "",
            hint: "",
            code: ""
          });
        }
      }
      let c3 = (u4 = e.headers.get("Prefer")) === null || u4 === void 0 ? void 0 : u4.match(/count=(exact|planned|estimated)/), n3 = (h3 = t.headers.get("content-range")) === null || h3 === void 0 ? void 0 : h3.split("/");
      c3 && n3 && n3.length > 1 && (l = parseInt(n3[1])), e.isMaybeSingle && Array.isArray(s) && (s.length > 1 ? (r = {
        code: "PGRST116",
        details: `Results contain ${s.length} rows, application/vnd.pgrst.object+json requires 1 row`,
        hint: null,
        message: "JSON object requested, multiple (or no) rows returned"
      }, s = null, l = null, a = 406, i4 = "Not Acceptable") : s.length === 1 ? s = s[0] : s = null);
    } else {
      let c3 = await t.text();
      try {
        r = JSON.parse(c3), Array.isArray(r) && t.status === 404 && (s = [], r = null, a = 200, i4 = "OK");
      } catch {
        t.status === 404 && c3 === "" ? (a = 204, i4 = "No Content") : r = {
          message: c3
        };
      }
      if (r && e.shouldThrowOnError) throw new b(r);
    }
    return {
      success: r === null,
      error: r,
      data: s,
      count: l,
      status: a,
      statusText: i4
    };
  }
  returns() {
    return this;
  }
  overrideTypes() {
    return this;
  }
};
var R = class extends E3 {
  throwOnError() {
    return super.throwOnError();
  }
  select(t) {
    let e = false, r = (t ?? "*").split("").map((s) => /\s/.test(s) && !e ? "" : (s === '"' && (e = !e), s)).join("");
    return this.url.searchParams.set("select", r), this.headers.append("Prefer", "return=representation"), this;
  }
  order(t, { ascending: e = true, nullsFirst: r, foreignTable: s, referencedTable: l = s } = {}) {
    let a = l ? `${l}.order` : "order", i4 = this.url.searchParams.get(a);
    return this.url.searchParams.set(a, `${i4 ? `${i4},` : ""}${t}.${e ? "asc" : "desc"}${r === void 0 ? "" : r ? ".nullsfirst" : ".nullslast"}`), this;
  }
  limit(t, { foreignTable: e, referencedTable: r = e } = {}) {
    let s = typeof r > "u" ? "limit" : `${r}.limit`;
    return this.url.searchParams.set(s, `${t}`), this;
  }
  range(t, e, { foreignTable: r, referencedTable: s = r } = {}) {
    let l = typeof s > "u" ? "offset" : `${s}.offset`, a = typeof s > "u" ? "limit" : `${s}.limit`;
    return this.url.searchParams.set(l, `${t}`), this.url.searchParams.set(a, `${e - t + 1}`), this;
  }
  abortSignal(t) {
    return this.signal = t, this;
  }
  single() {
    return this.headers.set("Accept", "application/vnd.pgrst.object+json"), this;
  }
  maybeSingle() {
    return this.isMaybeSingle = true, this;
  }
  csv() {
    return this.headers.set("Accept", "text/csv"), this;
  }
  geojson() {
    return this.headers.set("Accept", "application/geo+json"), this;
  }
  explain({ analyze: t = false, verbose: e = false, settings: r = false, buffers: s = false, wal: l = false, format: a = "text" } = {}) {
    var i4;
    let u4 = [
      t ? "analyze" : null,
      e ? "verbose" : null,
      r ? "settings" : null,
      s ? "buffers" : null,
      l ? "wal" : null
    ].filter(Boolean).join("|"), h3 = (i4 = this.headers.get("Accept")) !== null && i4 !== void 0 ? i4 : "application/json";
    return this.headers.set("Accept", `application/vnd.pgrst.plan+${a}; for="${h3}"; options=${u4};`), a === "json" ? this : this;
  }
  rollback() {
    return this.headers.append("Prefer", "tx=rollback"), this;
  }
  returns() {
    return this;
  }
  maxAffected(t) {
    return this.headers.append("Prefer", "handling=strict"), this.headers.append("Prefer", `max-affected=${t}`), this;
  }
};
var O3 = new RegExp("[,()]");
var m = class extends R {
  throwOnError() {
    return super.throwOnError();
  }
  eq(t, e) {
    return this.url.searchParams.append(t, `eq.${e}`), this;
  }
  neq(t, e) {
    return this.url.searchParams.append(t, `neq.${e}`), this;
  }
  gt(t, e) {
    return this.url.searchParams.append(t, `gt.${e}`), this;
  }
  gte(t, e) {
    return this.url.searchParams.append(t, `gte.${e}`), this;
  }
  lt(t, e) {
    return this.url.searchParams.append(t, `lt.${e}`), this;
  }
  lte(t, e) {
    return this.url.searchParams.append(t, `lte.${e}`), this;
  }
  like(t, e) {
    return this.url.searchParams.append(t, `like.${e}`), this;
  }
  likeAllOf(t, e) {
    return this.url.searchParams.append(t, `like(all).{${e.join(",")}}`), this;
  }
  likeAnyOf(t, e) {
    return this.url.searchParams.append(t, `like(any).{${e.join(",")}}`), this;
  }
  ilike(t, e) {
    return this.url.searchParams.append(t, `ilike.${e}`), this;
  }
  ilikeAllOf(t, e) {
    return this.url.searchParams.append(t, `ilike(all).{${e.join(",")}}`), this;
  }
  ilikeAnyOf(t, e) {
    return this.url.searchParams.append(t, `ilike(any).{${e.join(",")}}`), this;
  }
  regexMatch(t, e) {
    return this.url.searchParams.append(t, `match.${e}`), this;
  }
  regexIMatch(t, e) {
    return this.url.searchParams.append(t, `imatch.${e}`), this;
  }
  is(t, e) {
    return this.url.searchParams.append(t, `is.${e}`), this;
  }
  isDistinct(t, e) {
    return this.url.searchParams.append(t, `isdistinct.${e}`), this;
  }
  in(t, e) {
    let r = Array.from(new Set(e)).map((s) => typeof s == "string" && O3.test(s) ? `"${s}"` : `${s}`).join(",");
    return this.url.searchParams.append(t, `in.(${r})`), this;
  }
  notIn(t, e) {
    let r = Array.from(new Set(e)).map((s) => typeof s == "string" && O3.test(s) ? `"${s}"` : `${s}`).join(",");
    return this.url.searchParams.append(t, `not.in.(${r})`), this;
  }
  contains(t, e) {
    return typeof e == "string" ? this.url.searchParams.append(t, `cs.${e}`) : Array.isArray(e) ? this.url.searchParams.append(t, `cs.{${e.join(",")}}`) : this.url.searchParams.append(t, `cs.${JSON.stringify(e)}`), this;
  }
  containedBy(t, e) {
    return typeof e == "string" ? this.url.searchParams.append(t, `cd.${e}`) : Array.isArray(e) ? this.url.searchParams.append(t, `cd.{${e.join(",")}}`) : this.url.searchParams.append(t, `cd.${JSON.stringify(e)}`), this;
  }
  rangeGt(t, e) {
    return this.url.searchParams.append(t, `sr.${e}`), this;
  }
  rangeGte(t, e) {
    return this.url.searchParams.append(t, `nxl.${e}`), this;
  }
  rangeLt(t, e) {
    return this.url.searchParams.append(t, `sl.${e}`), this;
  }
  rangeLte(t, e) {
    return this.url.searchParams.append(t, `nxr.${e}`), this;
  }
  rangeAdjacent(t, e) {
    return this.url.searchParams.append(t, `adj.${e}`), this;
  }
  overlaps(t, e) {
    return typeof e == "string" ? this.url.searchParams.append(t, `ov.${e}`) : this.url.searchParams.append(t, `ov.{${e.join(",")}}`), this;
  }
  textSearch(t, e, { config: r, type: s } = {}) {
    let l = "";
    s === "plain" ? l = "pl" : s === "phrase" ? l = "ph" : s === "websearch" && (l = "w");
    let a = r === void 0 ? "" : `(${r})`;
    return this.url.searchParams.append(t, `${l}fts${a}.${e}`), this;
  }
  match(t) {
    return Object.entries(t).filter(([e, r]) => r !== void 0).forEach(([e, r]) => {
      this.url.searchParams.append(e, `eq.${r}`);
    }), this;
  }
  not(t, e, r) {
    return this.url.searchParams.append(t, `not.${e}.${r}`), this;
  }
  or(t, { foreignTable: e, referencedTable: r = e } = {}) {
    let s = r ? `${r}.or` : "or";
    return this.url.searchParams.append(s, `(${t})`), this;
  }
  filter(t, e, r) {
    return this.url.searchParams.append(t, `${e}.${r}`), this;
  }
};
var T2 = class {
  constructor(t, { headers: e = {}, schema: r, fetch: s, urlLengthLimit: l = 8e3, retry: a }) {
    this.url = t, this.headers = new Headers(e), this.schema = r, this.fetch = s, this.urlLengthLimit = l, this.retry = a;
  }
  cloneRequestState() {
    return {
      url: new URL(this.url.toString()),
      headers: new Headers(this.headers)
    };
  }
  select(t, e) {
    let { head: r = false, count: s } = e ?? {}, l = r ? "HEAD" : "GET", a = false, i4 = (t ?? "*").split("").map((o3) => /\s/.test(o3) && !a ? "" : (o3 === '"' && (a = !a), o3)).join(""), { url: u4, headers: h3 } = this.cloneRequestState();
    return u4.searchParams.set("select", i4), s && h3.append("Prefer", `count=${s}`), new m({
      method: l,
      url: u4,
      headers: h3,
      schema: this.schema,
      fetch: this.fetch,
      urlLengthLimit: this.urlLengthLimit,
      retry: this.retry
    });
  }
  insert(t, { count: e, defaultToNull: r = true } = {}) {
    var s;
    let l = "POST", { url: a, headers: i4 } = this.cloneRequestState();
    if (e && i4.append("Prefer", `count=${e}`), r || i4.append("Prefer", "missing=default"), Array.isArray(t)) {
      let u4 = t.reduce((h3, o3) => h3.concat(Object.keys(o3)), []);
      if (u4.length > 0) {
        let h3 = [
          ...new Set(u4)
        ].map((o3) => `"${o3}"`);
        a.searchParams.set("columns", h3.join(","));
      }
    }
    return new m({
      method: l,
      url: a,
      headers: i4,
      schema: this.schema,
      body: t,
      fetch: (s = this.fetch) !== null && s !== void 0 ? s : fetch,
      urlLengthLimit: this.urlLengthLimit,
      retry: this.retry
    });
  }
  upsert(t, { onConflict: e, ignoreDuplicates: r = false, count: s, defaultToNull: l = true } = {}) {
    var a;
    let i4 = "POST", { url: u4, headers: h3 } = this.cloneRequestState();
    if (h3.append("Prefer", `resolution=${r ? "ignore" : "merge"}-duplicates`), e !== void 0 && u4.searchParams.set("on_conflict", e), s && h3.append("Prefer", `count=${s}`), l || h3.append("Prefer", "missing=default"), Array.isArray(t)) {
      let o3 = t.reduce((c3, n3) => c3.concat(Object.keys(n3)), []);
      if (o3.length > 0) {
        let c3 = [
          ...new Set(o3)
        ].map((n3) => `"${n3}"`);
        u4.searchParams.set("columns", c3.join(","));
      }
    }
    return new m({
      method: i4,
      url: u4,
      headers: h3,
      schema: this.schema,
      body: t,
      fetch: (a = this.fetch) !== null && a !== void 0 ? a : fetch,
      urlLengthLimit: this.urlLengthLimit,
      retry: this.retry
    });
  }
  update(t, { count: e } = {}) {
    var r;
    let s = "PATCH", { url: l, headers: a } = this.cloneRequestState();
    return e && a.append("Prefer", `count=${e}`), new m({
      method: s,
      url: l,
      headers: a,
      schema: this.schema,
      body: t,
      fetch: (r = this.fetch) !== null && r !== void 0 ? r : fetch,
      urlLengthLimit: this.urlLengthLimit,
      retry: this.retry
    });
  }
  delete({ count: t } = {}) {
    var e;
    let r = "DELETE", { url: s, headers: l } = this.cloneRequestState();
    return t && l.append("Prefer", `count=${t}`), new m({
      method: r,
      url: s,
      headers: l,
      schema: this.schema,
      fetch: (e = this.fetch) !== null && e !== void 0 ? e : fetch,
      urlLengthLimit: this.urlLengthLimit,
      retry: this.retry
    });
  }
};
function y(t) {
  "@babel/helpers - typeof";
  return y = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
    return typeof e;
  } : function(e) {
    return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
  }, y(t);
}
function H2(t, e) {
  if (y(t) != "object" || !t) return t;
  var r = t[Symbol.toPrimitive];
  if (r !== void 0) {
    var s = r.call(t, e || "default");
    if (y(s) != "object") return s;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
function q2(t) {
  var e = H2(t, "string");
  return y(e) == "symbol" ? e : e + "";
}
function _(t, e, r) {
  return (e = q2(e)) in t ? Object.defineProperty(t, e, {
    value: r,
    enumerable: true,
    configurable: true,
    writable: true
  }) : t[e] = r, t;
}
function S3(t, e) {
  var r = Object.keys(t);
  if (Object.getOwnPropertySymbols) {
    var s = Object.getOwnPropertySymbols(t);
    e && (s = s.filter(function(l) {
      return Object.getOwnPropertyDescriptor(t, l).enumerable;
    })), r.push.apply(r, s);
  }
  return r;
}
function v(t) {
  for (var e = 1; e < arguments.length; e++) {
    var r = arguments[e] != null ? arguments[e] : {};
    e % 2 ? S3(Object(r), true).forEach(function(s) {
      _(t, s, r[s]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(r)) : S3(Object(r)).forEach(function(s) {
      Object.defineProperty(t, s, Object.getOwnPropertyDescriptor(r, s));
    });
  }
  return t;
}
var C2 = class x3 {
  constructor(e, { headers: r = {}, schema: s, fetch: l, timeout: a, urlLengthLimit: i4 = 8e3, retry: u4 } = {}) {
    this.url = e, this.headers = new Headers(r), this.schemaName = s, this.urlLengthLimit = i4;
    let h3 = l ?? globalThis.fetch;
    a !== void 0 && a > 0 ? this.fetch = (o3, c3) => {
      let n3 = new AbortController(), d2 = setTimeout(() => n3.abort(), a), p4 = c3?.signal;
      if (p4) {
        if (p4.aborted) return clearTimeout(d2), h3(o3, c3);
        let f4 = () => {
          clearTimeout(d2), n3.abort();
        };
        return p4.addEventListener("abort", f4, {
          once: true
        }), h3(o3, v(v({}, c3), {}, {
          signal: n3.signal
        })).finally(() => {
          clearTimeout(d2), p4.removeEventListener("abort", f4);
        });
      }
      return h3(o3, v(v({}, c3), {}, {
        signal: n3.signal
      })).finally(() => clearTimeout(d2));
    } : this.fetch = h3, this.retry = u4;
  }
  from(e) {
    if (!e || typeof e != "string" || e.trim() === "") throw new Error("Invalid relation name: relation must be a non-empty string.");
    return new T2(new URL(`${this.url}/${e}`), {
      headers: new Headers(this.headers),
      schema: this.schemaName,
      fetch: this.fetch,
      urlLengthLimit: this.urlLengthLimit,
      retry: this.retry
    });
  }
  schema(e) {
    return new x3(this.url, {
      headers: this.headers,
      schema: e,
      fetch: this.fetch,
      urlLengthLimit: this.urlLengthLimit,
      retry: this.retry
    });
  }
  rpc(e, r = {}, { head: s = false, get: l = false, count: a } = {}) {
    var i4;
    let u4, h3 = new URL(`${this.url}/rpc/${e}`), o3, c3 = (p4) => p4 !== null && typeof p4 == "object" && (!Array.isArray(p4) || p4.some(c3)), n3 = s && Object.values(r).some(c3);
    n3 ? (u4 = "POST", o3 = r) : s || l ? (u4 = s ? "HEAD" : "GET", Object.entries(r).filter(([p4, f4]) => f4 !== void 0).map(([p4, f4]) => [
      p4,
      Array.isArray(f4) ? `{${f4.join(",")}}` : `${f4}`
    ]).forEach(([p4, f4]) => {
      h3.searchParams.append(p4, f4);
    })) : (u4 = "POST", o3 = r);
    let d2 = new Headers(this.headers);
    return n3 ? d2.set("Prefer", a ? `count=${a},return=minimal` : "return=minimal") : a && d2.set("Prefer", `count=${a}`), new m({
      method: u4,
      url: h3,
      headers: d2,
      schema: this.schemaName,
      body: o3,
      fetch: (i4 = this.fetch) !== null && i4 !== void 0 ? i4 : fetch,
      urlLengthLimit: this.urlLengthLimit,
      retry: this.retry
    });
  }
};

// deno:https://esm.sh/@supabase/realtime-js@2.108.1/denonext/realtime-js.mjs
import __Process$ from "node:process";

// deno:https://esm.sh/@supabase/phoenix@0.4.4/denonext/phoenix.mjs
var k = (e) => typeof e == "function" ? e : function() {
  return e;
};
var H3 = typeof self < "u" ? self : null;
var v2 = typeof globalThis < "u" ? globalThis : null;
var d = H3 || v2 || globalThis;
var _2 = "2.0.0";
var B2 = 1e4;
var P2 = 1e3;
var g = {
  connecting: 0,
  open: 1,
  closing: 2,
  closed: 3
};
var u2 = {
  closed: "closed",
  errored: "errored",
  joined: "joined",
  joining: "joining",
  leaving: "leaving"
};
var p = {
  close: "phx_close",
  error: "phx_error",
  join: "phx_join",
  reply: "phx_reply",
  leave: "phx_leave"
};
var j2 = {
  longpoll: "longpoll",
  websocket: "websocket"
};
var N3 = {
  complete: 4
};
var w = "base64url.bearer.phx.";
var y2 = class {
  constructor(e, t, i4, s) {
    this.channel = e, this.event = t, this.payload = i4 || function() {
      return {};
    }, this.receivedResp = null, this.timeout = s, this.timeoutTimer = null, this.recHooks = [], this.sent = false, this.ref = void 0;
  }
  resend(e) {
    this.timeout = e, this.reset(), this.send();
  }
  send() {
    this.hasReceived("timeout") || (this.startTimeout(), this.sent = true, this.channel.socket.push({
      topic: this.channel.topic,
      event: this.event,
      payload: this.payload(),
      ref: this.ref,
      join_ref: this.channel.joinRef()
    }));
  }
  receive(e, t) {
    return this.hasReceived(e) && t(this.receivedResp.response), this.recHooks.push({
      status: e,
      callback: t
    }), this;
  }
  reset() {
    this.cancelRefEvent(), this.ref = null, this.refEvent = null, this.receivedResp = null, this.sent = false;
  }
  destroy() {
    this.cancelRefEvent(), this.cancelTimeout();
  }
  matchReceive({ status: e, response: t, _ref: i4 }) {
    this.recHooks.filter((s) => s.status === e).forEach((s) => s.callback(t));
  }
  cancelRefEvent() {
    this.refEvent && this.channel.off(this.refEvent);
  }
  cancelTimeout() {
    clearTimeout(this.timeoutTimer), this.timeoutTimer = null;
  }
  startTimeout() {
    this.timeoutTimer && this.cancelTimeout(), this.ref = this.channel.socket.makeRef(), this.refEvent = this.channel.replyEventName(this.ref), this.channel.on(this.refEvent, (e) => {
      this.cancelRefEvent(), this.cancelTimeout(), this.receivedResp = e, this.matchReceive(e);
    }), this.timeoutTimer = setTimeout(() => {
      this.trigger("timeout", {});
    }, this.timeout);
  }
  hasReceived(e) {
    return this.receivedResp && this.receivedResp.status === e;
  }
  trigger(e, t) {
    this.channel.trigger(this.refEvent, {
      status: e,
      response: t
    });
  }
};
var L3 = class {
  constructor(e, t) {
    this.callback = e, this.timerCalc = t, this.timer = void 0, this.tries = 0;
  }
  reset() {
    this.tries = 0, clearTimeout(this.timer);
  }
  scheduleTimeout() {
    clearTimeout(this.timer), this.timer = setTimeout(() => {
      this.tries = this.tries + 1, this.callback();
    }, this.timerCalc(this.tries + 1));
  }
};
var x4 = class {
  constructor(e, t, i4) {
    this.state = u2.closed, this.topic = e, this.params = k(t || {}), this.socket = i4, this.bindings = [], this.bindingRef = 0, this.timeout = this.socket.timeout, this.joinedOnce = false, this.joinPush = new y2(this, p.join, this.params, this.timeout), this.pushBuffer = [], this.stateChangeRefs = [], this.rejoinTimer = new L3(() => {
      this.socket.isConnected() && this.rejoin();
    }, this.socket.rejoinAfterMs), this.stateChangeRefs.push(this.socket.onError(() => this.rejoinTimer.reset())), this.stateChangeRefs.push(this.socket.onOpen(() => {
      this.rejoinTimer.reset(), this.isErrored() && this.rejoin();
    })), this.joinPush.receive("ok", () => {
      this.state = u2.joined, this.rejoinTimer.reset(), this.pushBuffer.forEach((s) => s.send()), this.pushBuffer = [];
    }), this.joinPush.receive("error", (s) => {
      this.state = u2.errored, this.socket.hasLogger() && this.socket.log("channel", `error ${this.topic}`, s), this.socket.isConnected() && this.rejoinTimer.scheduleTimeout();
    }), this.onClose(() => {
      this.rejoinTimer.reset(), this.socket.hasLogger() && this.socket.log("channel", `close ${this.topic}`), this.state = u2.closed, this.socket.remove(this);
    }), this.onError((s) => {
      this.socket.hasLogger() && this.socket.log("channel", `error ${this.topic}`, s), this.isJoining() && this.joinPush.reset(), this.state = u2.errored, this.socket.isConnected() && this.rejoinTimer.scheduleTimeout();
    }), this.joinPush.receive("timeout", () => {
      this.socket.hasLogger() && this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout), new y2(this, p.leave, k({}), this.timeout).send(), this.state = u2.errored, this.joinPush.reset(), this.socket.isConnected() && this.rejoinTimer.scheduleTimeout();
    }), this.on(p.reply, (s, n3) => {
      this.trigger(this.replyEventName(n3), s);
    });
  }
  join(e = this.timeout) {
    if (this.joinedOnce) throw new Error("tried to join multiple times. 'join' can only be called a single time per channel instance");
    return this.timeout = e, this.joinedOnce = true, this.rejoin(), this.joinPush;
  }
  teardown() {
    this.pushBuffer.forEach((e) => e.destroy()), this.pushBuffer = [], this.rejoinTimer.reset(), this.joinPush.destroy(), this.state = u2.closed, this.bindings = [];
  }
  onClose(e) {
    this.on(p.close, e);
  }
  onError(e) {
    return this.on(p.error, (t) => e(t));
  }
  on(e, t) {
    let i4 = this.bindingRef++;
    return this.bindings.push({
      event: e,
      ref: i4,
      callback: t
    }), i4;
  }
  off(e, t) {
    this.bindings = this.bindings.filter((i4) => !(i4.event === e && (typeof t > "u" || t === i4.ref)));
  }
  canPush() {
    return this.socket.isConnected() && this.isJoined();
  }
  push(e, t, i4 = this.timeout) {
    if (t = t || {}, !this.joinedOnce) throw new Error(`tried to push '${e}' to '${this.topic}' before joining. Use channel.join() before pushing events`);
    let s = new y2(this, e, function() {
      return t;
    }, i4);
    return this.canPush() ? s.send() : (s.startTimeout(), this.pushBuffer.push(s)), s;
  }
  leave(e = this.timeout) {
    this.rejoinTimer.reset(), this.joinPush.cancelTimeout(), this.state = u2.leaving;
    let t = () => {
      this.socket.hasLogger() && this.socket.log("channel", `leave ${this.topic}`), this.trigger(p.close, "leave");
    }, i4 = new y2(this, p.leave, k({}), e);
    return i4.receive("ok", () => t()).receive("timeout", () => t()), i4.send(), this.canPush() || i4.trigger("ok", {}), i4;
  }
  onMessage(e, t, i4) {
    return t;
  }
  filterBindings(e, t, i4) {
    return true;
  }
  isMember(e, t, i4, s) {
    return this.topic !== e ? false : s && s !== this.joinRef() ? (this.socket.hasLogger() && this.socket.log("channel", "dropping outdated message", {
      topic: e,
      event: t,
      payload: i4,
      joinRef: s
    }), false) : true;
  }
  joinRef() {
    return this.joinPush.ref;
  }
  rejoin(e = this.timeout) {
    this.isLeaving() || (this.socket.leaveOpenTopic(this.topic), this.state = u2.joining, this.joinPush.resend(e));
  }
  trigger(e, t, i4, s) {
    let n3 = this.onMessage(e, t, i4, s);
    if (t && !n3) throw new Error("channel onMessage callbacks must return the payload, modified or unmodified");
    let o3 = this.bindings.filter((h3) => h3.event === e && this.filterBindings(h3, t, i4));
    for (let h3 = 0; h3 < o3.length; h3++) o3[h3].callback(n3, i4, s || this.joinRef());
  }
  replyEventName(e) {
    return `chan_reply_${e}`;
  }
  isClosed() {
    return this.state === u2.closed;
  }
  isErrored() {
    return this.state === u2.errored;
  }
  isJoined() {
    return this.state === u2.joined;
  }
  isJoining() {
    return this.state === u2.joining;
  }
  isLeaving() {
    return this.state === u2.leaving;
  }
};
var E4 = class {
  static request(e, t, i4, s, n3, o3, h3) {
    if (d.XDomainRequest) {
      let r = new d.XDomainRequest();
      return this.xdomainRequest(r, e, t, s, n3, o3, h3);
    } else if (d.XMLHttpRequest) {
      let r = new d.XMLHttpRequest();
      return this.xhrRequest(r, e, t, i4, s, n3, o3, h3);
    } else {
      if (d.fetch && d.AbortController) return this.fetchRequest(e, t, i4, s, n3, o3, h3);
      throw new Error("No suitable XMLHttpRequest implementation found");
    }
  }
  static fetchRequest(e, t, i4, s, n3, o3, h3) {
    let r = {
      method: e,
      headers: i4,
      body: s
    }, a = null;
    if (n3) {
      a = new AbortController();
      let l = setTimeout(() => a.abort(), n3);
      r.signal = a.signal;
    }
    return d.fetch(t, r).then((l) => l.text()).then((l) => this.parseJSON(l)).then((l) => h3 && h3(l)).catch((l) => {
      l.name === "AbortError" && o3 ? o3() : h3 && h3(null);
    }), a;
  }
  static xdomainRequest(e, t, i4, s, n3, o3, h3) {
    return e.timeout = n3, e.open(t, i4), e.onload = () => {
      let r = this.parseJSON(e.responseText);
      h3 && h3(r);
    }, o3 && (e.ontimeout = o3), e.onprogress = () => {
    }, e.send(s), e;
  }
  static xhrRequest(e, t, i4, s, n3, o3, h3, r) {
    e.open(t, i4, true), e.timeout = o3;
    for (let [a, l] of Object.entries(s)) e.setRequestHeader(a, l);
    return e.onerror = () => r && r(null), e.onreadystatechange = () => {
      if (e.readyState === N3.complete && r) {
        let a = this.parseJSON(e.responseText);
        r(a);
      }
    }, h3 && (e.ontimeout = h3), e.send(n3), e;
  }
  static parseJSON(e) {
    if (!e || e === "") return null;
    try {
      return JSON.parse(e);
    } catch {
      return console && console.log("failed to parse JSON response", e), null;
    }
  }
  static serialize(e, t) {
    let i4 = [];
    for (var s in e) {
      if (!Object.prototype.hasOwnProperty.call(e, s)) continue;
      let n3 = t ? `${t}[${s}]` : s, o3 = e[s];
      typeof o3 == "object" ? i4.push(this.serialize(o3, n3)) : i4.push(encodeURIComponent(n3) + "=" + encodeURIComponent(o3));
    }
    return i4.join("&");
  }
  static appendParams(e, t) {
    if (Object.keys(t).length === 0) return e;
    let i4 = e.match(/\?/) ? "&" : "?";
    return `${e}${i4}${this.serialize(t)}`;
  }
};
var $2 = (e) => {
  let t = "", i4 = new Uint8Array(e), s = i4.byteLength;
  for (let n3 = 0; n3 < s; n3++) t += String.fromCharCode(i4[n3]);
  return btoa(t);
};
var T3 = class {
  constructor(e, t) {
    t && t.length === 2 && t[1].startsWith(w) && (this.authToken = atob(t[1].slice(w.length))), this.endPoint = null, this.token = null, this.skipHeartbeat = true, this.reqs = /* @__PURE__ */ new Set(), this.awaitingBatchAck = false, this.currentBatch = null, this.currentBatchTimer = null, this.batchBuffer = [], this.onopen = function() {
    }, this.onerror = function() {
    }, this.onmessage = function() {
    }, this.onclose = function() {
    }, this.pollEndpoint = this.normalizeEndpoint(e), this.readyState = g.connecting, setTimeout(() => this.poll(), 0);
  }
  normalizeEndpoint(e) {
    return e.replace("ws://", "http://").replace("wss://", "https://").replace(new RegExp("(.*)/" + j2.websocket), "$1/" + j2.longpoll);
  }
  endpointURL() {
    return E4.appendParams(this.pollEndpoint, {
      token: this.token
    });
  }
  closeAndRetry(e, t, i4) {
    this.close(e, t, i4), this.readyState = g.connecting;
  }
  ontimeout() {
    this.onerror("timeout"), this.closeAndRetry(1005, "timeout", false);
  }
  isActive() {
    return this.readyState === g.open || this.readyState === g.connecting;
  }
  poll() {
    let e = {
      Accept: "application/json"
    };
    this.authToken && (e["X-Phoenix-AuthToken"] = this.authToken), this.ajax("GET", e, null, () => this.ontimeout(), (t) => {
      if (t) {
        var { status: i4, token: s, messages: n3 } = t;
        if (i4 === 410 && this.token !== null) {
          this.onerror(410), this.closeAndRetry(3410, "session_gone", false);
          return;
        }
        this.token = s;
      } else i4 = 0;
      switch (i4) {
        case 200:
          n3.forEach((o3) => {
            setTimeout(() => this.onmessage({
              data: o3
            }), 0);
          }), this.poll();
          break;
        case 204:
          this.poll();
          break;
        case 410:
          this.readyState = g.open, this.onopen({}), this.poll();
          break;
        case 403:
          this.onerror(403), this.close(1008, "forbidden", false);
          break;
        case 0:
        case 500:
          this.onerror(500), this.closeAndRetry(1011, "internal server error", 500);
          break;
        default:
          throw new Error(`unhandled poll status ${i4}`);
      }
    });
  }
  send(e) {
    typeof e != "string" && (e = $2(e)), this.currentBatch ? this.currentBatch.push(e) : this.awaitingBatchAck ? this.batchBuffer.push(e) : (this.currentBatch = [
      e
    ], this.currentBatchTimer = setTimeout(() => {
      this.batchSend(this.currentBatch), this.currentBatch = null;
    }, 0));
  }
  batchSend(e) {
    this.awaitingBatchAck = true, this.ajax("POST", {
      "Content-Type": "application/x-ndjson"
    }, e.join(`
`), () => this.onerror("timeout"), (t) => {
      this.awaitingBatchAck = false, !t || t.status !== 200 ? (this.onerror(t && t.status), this.closeAndRetry(1011, "internal server error", false)) : this.batchBuffer.length > 0 && (this.batchSend(this.batchBuffer), this.batchBuffer = []);
    });
  }
  close(e, t, i4) {
    for (let n3 of this.reqs) n3.abort();
    this.readyState = g.closed;
    let s = Object.assign({
      code: 1e3,
      reason: void 0,
      wasClean: true
    }, {
      code: e,
      reason: t,
      wasClean: i4
    });
    this.batchBuffer = [], clearTimeout(this.currentBatchTimer), this.currentBatchTimer = null, typeof CloseEvent < "u" ? this.onclose(new CloseEvent("close", s)) : this.onclose(s);
  }
  ajax(e, t, i4, s, n3) {
    let o3, h3 = () => {
      this.reqs.delete(o3), s();
    };
    o3 = E4.request(e, this.endpointURL(), t, i4, this.timeout, h3, (r) => {
      this.reqs.delete(o3), this.isActive() && n3(r);
    }), this.reqs.add(o3);
  }
};
var O4 = class C3 {
  constructor(t, i4 = {}) {
    let s = i4.events || {
      state: "presence_state",
      diff: "presence_diff"
    };
    this.state = {}, this.pendingDiffs = [], this.channel = t, this.joinRef = null, this.caller = {
      onJoin: function() {
      },
      onLeave: function() {
      },
      onSync: function() {
      }
    }, this.channel.on(s.state, (n3) => {
      let { onJoin: o3, onLeave: h3, onSync: r } = this.caller;
      this.joinRef = this.channel.joinRef(), this.state = C3.syncState(this.state, n3, o3, h3), this.pendingDiffs.forEach((a) => {
        this.state = C3.syncDiff(this.state, a, o3, h3);
      }), this.pendingDiffs = [], r();
    }), this.channel.on(s.diff, (n3) => {
      let { onJoin: o3, onLeave: h3, onSync: r } = this.caller;
      this.inPendingSyncState() ? this.pendingDiffs.push(n3) : (this.state = C3.syncDiff(this.state, n3, o3, h3), r());
    });
  }
  onJoin(t) {
    this.caller.onJoin = t;
  }
  onLeave(t) {
    this.caller.onLeave = t;
  }
  onSync(t) {
    this.caller.onSync = t;
  }
  list(t) {
    return C3.list(this.state, t);
  }
  inPendingSyncState() {
    return !this.joinRef || this.joinRef !== this.channel.joinRef();
  }
  static syncState(t, i4, s, n3) {
    let o3 = this.clone(t), h3 = {}, r = {};
    return this.map(o3, (a, l) => {
      i4[a] || (r[a] = l);
    }), this.map(i4, (a, l) => {
      let f4 = o3[a];
      if (f4) {
        let c3 = l.metas.map((b3) => b3.phx_ref), m3 = f4.metas.map((b3) => b3.phx_ref), S6 = l.metas.filter((b3) => m3.indexOf(b3.phx_ref) < 0), A7 = f4.metas.filter((b3) => c3.indexOf(b3.phx_ref) < 0);
        S6.length > 0 && (h3[a] = l, h3[a].metas = S6), A7.length > 0 && (r[a] = this.clone(f4), r[a].metas = A7);
      } else h3[a] = l;
    }), this.syncDiff(o3, {
      joins: h3,
      leaves: r
    }, s, n3);
  }
  static syncDiff(t, i4, s, n3) {
    let { joins: o3, leaves: h3 } = this.clone(i4);
    return s || (s = function() {
    }), n3 || (n3 = function() {
    }), this.map(o3, (r, a) => {
      let l = t[r];
      if (t[r] = this.clone(a), l) {
        let f4 = t[r].metas.map((m3) => m3.phx_ref), c3 = l.metas.filter((m3) => f4.indexOf(m3.phx_ref) < 0);
        t[r].metas.unshift(...c3);
      }
      s(r, l, a);
    }), this.map(h3, (r, a) => {
      let l = t[r];
      if (!l) return;
      let f4 = a.metas.map((c3) => c3.phx_ref);
      l.metas = l.metas.filter((c3) => f4.indexOf(c3.phx_ref) < 0), n3(r, l, a), l.metas.length === 0 && delete t[r];
    }), t;
  }
  static list(t, i4) {
    return i4 || (i4 = function(s, n3) {
      return n3;
    }), this.map(t, (s, n3) => i4(s, n3));
  }
  static map(t, i4) {
    return Object.getOwnPropertyNames(t).map((s) => i4(s, t[s]));
  }
  static clone(t) {
    return JSON.parse(JSON.stringify(t));
  }
};
var R2 = {
  HEADER_LENGTH: 1,
  META_LENGTH: 4,
  KINDS: {
    push: 0,
    reply: 1,
    broadcast: 2
  },
  encode(e, t) {
    if (e.payload.constructor === ArrayBuffer) return t(this.binaryEncode(e));
    {
      let i4 = [
        e.join_ref,
        e.ref,
        e.topic,
        e.event,
        e.payload
      ];
      return t(JSON.stringify(i4));
    }
  },
  decode(e, t) {
    if (e.constructor === ArrayBuffer) return t(this.binaryDecode(e));
    {
      let [i4, s, n3, o3, h3] = JSON.parse(e);
      return t({
        join_ref: i4,
        ref: s,
        topic: n3,
        event: o3,
        payload: h3
      });
    }
  },
  binaryEncode(e) {
    let { join_ref: t, ref: i4, event: s, topic: n3, payload: o3 } = e, h3 = this.META_LENGTH + t.length + i4.length + n3.length + s.length, r = new ArrayBuffer(this.HEADER_LENGTH + h3), a = new DataView(r), l = 0;
    a.setUint8(l++, this.KINDS.push), a.setUint8(l++, t.length), a.setUint8(l++, i4.length), a.setUint8(l++, n3.length), a.setUint8(l++, s.length), Array.from(t, (c3) => a.setUint8(l++, c3.charCodeAt(0))), Array.from(i4, (c3) => a.setUint8(l++, c3.charCodeAt(0))), Array.from(n3, (c3) => a.setUint8(l++, c3.charCodeAt(0))), Array.from(s, (c3) => a.setUint8(l++, c3.charCodeAt(0)));
    var f4 = new Uint8Array(r.byteLength + o3.byteLength);
    return f4.set(new Uint8Array(r), 0), f4.set(new Uint8Array(o3), r.byteLength), f4.buffer;
  },
  binaryDecode(e) {
    let t = new DataView(e), i4 = t.getUint8(0), s = new TextDecoder();
    switch (i4) {
      case this.KINDS.push:
        return this.decodePush(e, t, s);
      case this.KINDS.reply:
        return this.decodeReply(e, t, s);
      case this.KINDS.broadcast:
        return this.decodeBroadcast(e, t, s);
    }
  },
  decodePush(e, t, i4) {
    let s = t.getUint8(1), n3 = t.getUint8(2), o3 = t.getUint8(3), h3 = this.HEADER_LENGTH + this.META_LENGTH - 1, r = i4.decode(e.slice(h3, h3 + s));
    h3 = h3 + s;
    let a = i4.decode(e.slice(h3, h3 + n3));
    h3 = h3 + n3;
    let l = i4.decode(e.slice(h3, h3 + o3));
    h3 = h3 + o3;
    let f4 = e.slice(h3, e.byteLength);
    return {
      join_ref: r,
      ref: null,
      topic: a,
      event: l,
      payload: f4
    };
  },
  decodeReply(e, t, i4) {
    let s = t.getUint8(1), n3 = t.getUint8(2), o3 = t.getUint8(3), h3 = t.getUint8(4), r = this.HEADER_LENGTH + this.META_LENGTH, a = i4.decode(e.slice(r, r + s));
    r = r + s;
    let l = i4.decode(e.slice(r, r + n3));
    r = r + n3;
    let f4 = i4.decode(e.slice(r, r + o3));
    r = r + o3;
    let c3 = i4.decode(e.slice(r, r + h3));
    r = r + h3;
    let m3 = e.slice(r, e.byteLength), S6 = {
      status: c3,
      response: m3
    };
    return {
      join_ref: a,
      ref: l,
      topic: f4,
      event: p.reply,
      payload: S6
    };
  },
  decodeBroadcast(e, t, i4) {
    let s = t.getUint8(1), n3 = t.getUint8(2), o3 = this.HEADER_LENGTH + 2, h3 = i4.decode(e.slice(o3, o3 + s));
    o3 = o3 + s;
    let r = i4.decode(e.slice(o3, o3 + n3));
    o3 = o3 + n3;
    let a = e.slice(o3, e.byteLength);
    return {
      join_ref: null,
      ref: null,
      topic: h3,
      event: r,
      payload: a
    };
  }
};
var M2 = class {
  constructor(e, t = {}) {
    this.stateChangeCallbacks = {
      open: [],
      close: [],
      error: [],
      message: []
    }, this.channels = [], this.sendBuffer = [], this.ref = 0, this.fallbackRef = null, this.timeout = t.timeout || B2, this.transport = t.transport || d.WebSocket || T3, this.conn = void 0, this.primaryPassedHealthCheck = false, this.longPollFallbackMs = t.longPollFallbackMs, this.fallbackTimer = null;
    let i4 = null;
    try {
      i4 = d && d.sessionStorage;
    } catch {
    }
    this.sessionStore = t.sessionStorage || i4, this.establishedConnections = 0, this.defaultEncoder = R2.encode.bind(R2), this.defaultDecoder = R2.decode.bind(R2), this.closeWasClean = true, this.disconnecting = false, this.binaryType = t.binaryType || "arraybuffer", this.connectClock = 1, this.pageHidden = false, this.encode = void 0, this.decode = void 0, this.transport !== T3 ? (this.encode = t.encode || this.defaultEncoder, this.decode = t.decode || this.defaultDecoder) : (this.encode = this.defaultEncoder, this.decode = this.defaultDecoder);
    let s = null;
    v2 && v2.addEventListener && (v2.addEventListener("pagehide", (n3) => {
      this.conn && (this.disconnect(), s = this.connectClock);
    }), v2.addEventListener("pageshow", (n3) => {
      s === this.connectClock && (s = null, this.connect());
    }), v2.addEventListener("visibilitychange", () => {
      document.visibilityState === "hidden" ? this.pageHidden = true : (this.pageHidden = false, !this.isConnected() && !this.closeWasClean && this.teardown(() => this.connect()));
    })), this.heartbeatIntervalMs = t.heartbeatIntervalMs || 3e4, this.autoSendHeartbeat = t.autoSendHeartbeat ?? true, this.heartbeatCallback = t.heartbeatCallback ?? (() => {
    }), this.rejoinAfterMs = (n3) => t.rejoinAfterMs ? t.rejoinAfterMs(n3) : [
      1e3,
      2e3,
      5e3
    ][n3 - 1] || 1e4, this.reconnectAfterMs = (n3) => t.reconnectAfterMs ? t.reconnectAfterMs(n3) : [
      10,
      50,
      100,
      150,
      200,
      250,
      500,
      1e3,
      2e3
    ][n3 - 1] || 5e3, this.logger = t.logger || null, !this.logger && t.debug && (this.logger = (n3, o3, h3) => {
      console.log(`${n3}: ${o3}`, h3);
    }), this.longpollerTimeout = t.longpollerTimeout || 2e4, this.params = k(t.params || {}), this.endPoint = `${e}/${j2.websocket}`, this.vsn = t.vsn || _2, this.heartbeatTimeoutTimer = null, this.heartbeatTimer = null, this.heartbeatSentAt = null, this.pendingHeartbeatRef = null, this.reconnectTimer = new L3(() => {
      if (this.pageHidden) {
        this.log("Not reconnecting as page is hidden!"), this.teardown();
        return;
      }
      this.teardown(async () => {
        t.beforeReconnect && await t.beforeReconnect(), this.connect();
      });
    }, this.reconnectAfterMs), this.authToken = t.authToken;
  }
  getLongPollTransport() {
    return T3;
  }
  replaceTransport(e) {
    this.connectClock++, this.closeWasClean = true, clearTimeout(this.fallbackTimer), this.reconnectTimer.reset(), this.conn && (this.conn.close(), this.conn = null), this.transport = e;
  }
  protocol() {
    return location.protocol.match(/^https/) ? "wss" : "ws";
  }
  endPointURL() {
    let e = E4.appendParams(E4.appendParams(this.endPoint, this.params()), {
      vsn: this.vsn
    });
    return e.charAt(0) !== "/" ? e : e.charAt(1) === "/" ? `${this.protocol()}:${e}` : `${this.protocol()}://${location.host}${e}`;
  }
  disconnect(e, t, i4) {
    this.connectClock++, this.disconnecting = true, this.closeWasClean = true, clearTimeout(this.fallbackTimer), this.reconnectTimer.reset(), this.teardown(() => {
      this.disconnecting = false, e && e();
    }, t, i4);
  }
  connect(e) {
    e && (console && console.log("passing params to connect is deprecated. Instead pass :params to the Socket constructor"), this.params = k(e)), !(this.conn && !this.disconnecting) && (this.longPollFallbackMs && this.transport !== T3 ? this.connectWithFallback(T3, this.longPollFallbackMs) : this.transportConnect());
  }
  log(e, t, i4) {
    this.logger && this.logger(e, t, i4);
  }
  hasLogger() {
    return this.logger !== null;
  }
  onOpen(e) {
    let t = this.makeRef();
    return this.stateChangeCallbacks.open.push([
      t,
      e
    ]), t;
  }
  onClose(e) {
    let t = this.makeRef();
    return this.stateChangeCallbacks.close.push([
      t,
      e
    ]), t;
  }
  onError(e) {
    let t = this.makeRef();
    return this.stateChangeCallbacks.error.push([
      t,
      e
    ]), t;
  }
  onMessage(e) {
    let t = this.makeRef();
    return this.stateChangeCallbacks.message.push([
      t,
      e
    ]), t;
  }
  onHeartbeat(e) {
    this.heartbeatCallback = e;
  }
  ping(e) {
    if (!this.isConnected()) return false;
    let t = this.makeRef(), i4 = Date.now();
    this.push({
      topic: "phoenix",
      event: "heartbeat",
      payload: {},
      ref: t
    });
    let s = this.onMessage((n3) => {
      n3.ref === t && (this.off([
        s
      ]), e(Date.now() - i4));
    });
    return true;
  }
  transportName(e) {
    return e === T3 ? "LongPoll" : e.name;
  }
  transportConnect() {
    this.connectClock++, this.closeWasClean = false;
    let e;
    this.authToken && (e = [
      "phoenix",
      `${w}${btoa(this.authToken).replace(/=/g, "")}`
    ]), this.conn = new this.transport(this.endPointURL(), e), this.conn.binaryType = this.binaryType, this.conn.timeout = this.longpollerTimeout, this.conn.onopen = () => this.onConnOpen(), this.conn.onerror = (t) => this.onConnError(t), this.conn.onmessage = (t) => this.onConnMessage(t), this.conn.onclose = (t) => this.onConnClose(t);
  }
  getSession(e) {
    return this.sessionStore && this.sessionStore.getItem(e);
  }
  storeSession(e, t) {
    this.sessionStore && this.sessionStore.setItem(e, t);
  }
  connectWithFallback(e, t = 2500) {
    clearTimeout(this.fallbackTimer);
    let i4 = false, s = true, n3, o3, h3 = this.transportName(e), r = (a) => {
      this.log("transport", `falling back to ${h3}...`, a), this.off([
        n3,
        o3
      ]), s = false, this.replaceTransport(e), this.transportConnect();
    };
    if (this.getSession(`phx:fallback:${h3}`)) return r("memorized");
    this.fallbackTimer = setTimeout(r, t), o3 = this.onError((a) => {
      this.log("transport", "error", a), s && !i4 && (clearTimeout(this.fallbackTimer), r(a));
    }), this.fallbackRef && this.off([
      this.fallbackRef
    ]), this.fallbackRef = this.onOpen(() => {
      if (i4 = true, !s) {
        let a = this.transportName(e);
        return this.primaryPassedHealthCheck || this.storeSession(`phx:fallback:${a}`, "true"), this.log("transport", `established ${a} fallback`);
      }
      clearTimeout(this.fallbackTimer), this.fallbackTimer = setTimeout(r, t), this.ping((a) => {
        this.log("transport", "connected to primary after", a), this.primaryPassedHealthCheck = true, clearTimeout(this.fallbackTimer);
      });
    }), this.transportConnect();
  }
  clearHeartbeats() {
    clearTimeout(this.heartbeatTimer), clearTimeout(this.heartbeatTimeoutTimer);
  }
  onConnOpen() {
    this.hasLogger() && this.log("transport", `connected to ${this.endPointURL()}`), this.closeWasClean = false, this.disconnecting = false, this.establishedConnections++, this.flushSendBuffer(), this.reconnectTimer.reset(), this.autoSendHeartbeat && this.resetHeartbeat(), this.triggerStateCallbacks("open");
  }
  heartbeatTimeout() {
    if (this.pendingHeartbeatRef) {
      this.pendingHeartbeatRef = null, this.heartbeatSentAt = null, this.hasLogger() && this.log("transport", "heartbeat timeout. Attempting to re-establish connection");
      try {
        this.heartbeatCallback("timeout");
      } catch (e) {
        this.log("error", "error in heartbeat callback", e);
      }
      this.triggerChanError(new Error("heartbeat timeout")), this.closeWasClean = false, this.teardown(() => this.reconnectTimer.scheduleTimeout(), P2, "heartbeat timeout");
    }
  }
  resetHeartbeat() {
    this.conn && this.conn.skipHeartbeat || (this.pendingHeartbeatRef = null, this.clearHeartbeats(), this.heartbeatTimer = setTimeout(() => this.sendHeartbeat(), this.heartbeatIntervalMs));
  }
  teardown(e, t, i4) {
    if (!this.conn) return e && e();
    let s = this.conn;
    this.waitForBufferDone(s, () => {
      t ? s.close(t, i4 || "") : s.close(), this.waitForSocketClosed(s, () => {
        this.conn === s && (this.conn.onopen = function() {
        }, this.conn.onerror = function() {
        }, this.conn.onmessage = function() {
        }, this.conn.onclose = function() {
        }, this.conn = null), e && e();
      });
    });
  }
  waitForBufferDone(e, t, i4 = 1) {
    if (i4 === 5 || !e.bufferedAmount) {
      t();
      return;
    }
    setTimeout(() => {
      this.waitForBufferDone(e, t, i4 + 1);
    }, 150 * i4);
  }
  waitForSocketClosed(e, t, i4 = 1) {
    if (i4 === 5 || e.readyState === g.closed) {
      t();
      return;
    }
    setTimeout(() => {
      this.waitForSocketClosed(e, t, i4 + 1);
    }, 150 * i4);
  }
  onConnClose(e) {
    this.conn && (this.conn.onclose = () => {
    }), this.hasLogger() && this.log("transport", "close", e), this.triggerChanError(e), this.clearHeartbeats(), this.closeWasClean || this.reconnectTimer.scheduleTimeout(), this.triggerStateCallbacks("close", e);
  }
  onConnError(e) {
    this.hasLogger() && this.log("transport", "error", e);
    let t = this.transport, i4 = this.establishedConnections;
    this.triggerStateCallbacks("error", e, t, i4), (t === this.transport || i4 > 0) && this.triggerChanError(e);
  }
  triggerChanError(e) {
    this.channels.forEach((t) => {
      t.isErrored() || t.isLeaving() || t.isClosed() || t.trigger(p.error, e);
    });
  }
  connectionState() {
    switch (this.conn && this.conn.readyState) {
      case g.connecting:
        return "connecting";
      case g.open:
        return "open";
      case g.closing:
        return "closing";
      default:
        return "closed";
    }
  }
  isConnected() {
    return this.connectionState() === "open";
  }
  remove(e) {
    this.off(e.stateChangeRefs), this.channels = this.channels.filter((t) => t !== e);
  }
  off(e) {
    for (let t in this.stateChangeCallbacks) this.stateChangeCallbacks[t] = this.stateChangeCallbacks[t].filter(([i4]) => e.indexOf(i4) === -1);
  }
  channel(e, t = {}) {
    let i4 = new x4(e, t, this);
    return this.channels.push(i4), i4;
  }
  push(e) {
    if (this.hasLogger()) {
      let { topic: t, event: i4, payload: s, ref: n3, join_ref: o3 } = e;
      this.log("push", `${t} ${i4} (${o3}, ${n3})`, s);
    }
    this.isConnected() ? this.encode(e, (t) => this.conn.send(t)) : this.sendBuffer.push(() => this.encode(e, (t) => this.conn.send(t)));
  }
  makeRef() {
    let e = this.ref + 1;
    return e === this.ref ? this.ref = 0 : this.ref = e, this.ref.toString();
  }
  sendHeartbeat() {
    if (!this.isConnected()) {
      try {
        this.heartbeatCallback("disconnected");
      } catch (e) {
        this.log("error", "error in heartbeat callback", e);
      }
      return;
    }
    if (this.pendingHeartbeatRef) {
      this.heartbeatTimeout();
      return;
    }
    this.pendingHeartbeatRef = this.makeRef(), this.heartbeatSentAt = Date.now(), this.push({
      topic: "phoenix",
      event: "heartbeat",
      payload: {},
      ref: this.pendingHeartbeatRef
    });
    try {
      this.heartbeatCallback("sent");
    } catch (e) {
      this.log("error", "error in heartbeat callback", e);
    }
    this.heartbeatTimeoutTimer = setTimeout(() => this.heartbeatTimeout(), this.heartbeatIntervalMs);
  }
  flushSendBuffer() {
    this.isConnected() && this.sendBuffer.length > 0 && (this.sendBuffer.forEach((e) => e()), this.sendBuffer = []);
  }
  onConnMessage(e) {
    this.decode(e.data, (t) => {
      let { topic: i4, event: s, payload: n3, ref: o3, join_ref: h3 } = t;
      if (o3 && o3 === this.pendingHeartbeatRef) {
        let r = this.heartbeatSentAt ? Date.now() - this.heartbeatSentAt : void 0;
        this.clearHeartbeats();
        try {
          this.heartbeatCallback(n3.status === "ok" ? "ok" : "error", r);
        } catch (a) {
          this.log("error", "error in heartbeat callback", a);
        }
        this.pendingHeartbeatRef = null, this.heartbeatSentAt = null, this.autoSendHeartbeat && (this.heartbeatTimer = setTimeout(() => this.sendHeartbeat(), this.heartbeatIntervalMs));
      }
      this.hasLogger() && this.log("receive", `${n3.status || ""} ${i4} ${s} ${o3 && "(" + o3 + ")" || ""}`.trim(), n3);
      for (let r = 0; r < this.channels.length; r++) {
        let a = this.channels[r];
        a.isMember(i4, s, n3, h3) && a.trigger(s, n3, o3, h3);
      }
      this.triggerStateCallbacks("message", t);
    });
  }
  triggerStateCallbacks(e, ...t) {
    try {
      this.stateChangeCallbacks[e].forEach(([i4, s]) => {
        try {
          s(...t);
        } catch (n3) {
          this.log("error", `error in ${e} callback`, n3);
        }
      });
    } catch (i4) {
      this.log("error", `error triggering ${e} callbacks`, i4);
    }
  }
  leaveOpenTopic(e) {
    let t = this.channels.find((i4) => i4.topic === e && (i4.isJoined() || i4.isJoining()));
    t && (this.hasLogger() && this.log("transport", `leaving duplicate topic "${e}"`), t.leave());
  }
};

// deno:https://esm.sh/@supabase/realtime-js@2.108.1/denonext/realtime-js.mjs
var B3 = class {
  constructor() {
  }
  static detectEnvironment() {
    var e;
    if (typeof WebSocket < "u") return {
      type: "native",
      wsConstructor: WebSocket
    };
    let t = globalThis;
    if (typeof globalThis < "u" && typeof t.WebSocket < "u") return {
      type: "native",
      wsConstructor: t.WebSocket
    };
    let r = typeof globalThis < "u" ? globalThis : void 0;
    if (r && typeof r.WebSocket < "u") return {
      type: "native",
      wsConstructor: r.WebSocket
    };
    if (typeof globalThis < "u" && typeof t.WebSocketPair < "u" && typeof globalThis.WebSocket > "u") return {
      type: "cloudflare",
      error: "Cloudflare Workers detected. WebSocket clients are not supported in Cloudflare Workers.",
      workaround: "Use Cloudflare Workers WebSocket API for server-side WebSocket handling, or deploy to a different runtime."
    };
    if (typeof globalThis < "u" && t.EdgeRuntime || typeof navigator < "u" && (!((e = navigator.userAgent) === null || e === void 0) && e.includes("Vercel-Edge"))) return {
      type: "unsupported",
      error: "Edge runtime detected (Vercel Edge/Netlify Edge). WebSockets are not supported in edge functions.",
      workaround: "Use serverless functions or a different deployment target for WebSocket functionality."
    };
    let s = __Process$;
    if (s) {
      let i4 = s.versions;
      if (i4 && i4.node) {
        let o3 = i4.node, a = parseInt(o3.replace(/^v/, "").split(".")[0]);
        return a >= 22 ? typeof globalThis.WebSocket < "u" ? {
          type: "native",
          wsConstructor: globalThis.WebSocket
        } : {
          type: "unsupported",
          error: `Node.js ${a} detected but native WebSocket not found.`,
          workaround: "Provide a WebSocket implementation via the transport option."
        } : {
          type: "unsupported",
          error: `Node.js ${a} detected without native WebSocket support.`,
          workaround: `For Node.js < 22, install "ws" package and provide it via the transport option:
import ws from "ws"
new RealtimeClient(url, { transport: ws })`
        };
      }
    }
    return {
      type: "unsupported",
      error: "Unknown JavaScript runtime without WebSocket support.",
      workaround: "Ensure you're running in a supported environment (browser, Node.js, Deno) or provide a custom WebSocket implementation."
    };
  }
  static getWebSocketConstructor() {
    let e = this.detectEnvironment();
    if (e.wsConstructor) return e.wsConstructor;
    let t = e.error || "WebSocket not supported in this environment.";
    throw e.workaround && (t += `

Suggested solution: ${e.workaround}`), new Error(t);
  }
  static isWebSocketSupported() {
    try {
      let e = this.detectEnvironment();
      return e.type === "native" || e.type === "ws";
    } catch {
      return false;
    }
  }
};
var x5 = B3;
var V2 = "2.108.1";
var J2 = `realtime-js/${V2}`;
var $3 = "1.0.0";
var D2 = "2.0.0";
var F3 = D2;
var z2 = 1e4;
var K2 = 100;
var k2 = {
  closed: "closed",
  errored: "errored",
  joined: "joined",
  joining: "joining",
  leaving: "leaving"
};
var O5 = {
  close: "phx_close",
  error: "phx_error",
  join: "phx_join",
  reply: "phx_reply",
  leave: "phx_leave",
  access_token: "access_token"
};
var T4 = {
  connecting: "connecting",
  open: "open",
  closing: "closing",
  closed: "closed"
};
var C4 = class {
  constructor(e) {
    this.HEADER_LENGTH = 1, this.USER_BROADCAST_PUSH_META_LENGTH = 6, this.KINDS = {
      userBroadcastPush: 3,
      userBroadcast: 4
    }, this.BINARY_ENCODING = 0, this.JSON_ENCODING = 1, this.BROADCAST_EVENT = "broadcast", this.allowedMetadataKeys = [], this.allowedMetadataKeys = e ?? [];
  }
  encode(e, t) {
    if (e.event === this.BROADCAST_EVENT && !(e.payload instanceof ArrayBuffer) && typeof e.payload.event == "string") return t(this._binaryEncodeUserBroadcastPush(e));
    let r = [
      e.join_ref,
      e.ref,
      e.topic,
      e.event,
      e.payload
    ];
    return t(JSON.stringify(r));
  }
  _binaryEncodeUserBroadcastPush(e) {
    var t;
    return this._isArrayBuffer((t = e.payload) === null || t === void 0 ? void 0 : t.payload) ? this._encodeBinaryUserBroadcastPush(e) : this._encodeJsonUserBroadcastPush(e);
  }
  _encodeBinaryUserBroadcastPush(e) {
    var t, r;
    let s = (r = (t = e.payload) === null || t === void 0 ? void 0 : t.payload) !== null && r !== void 0 ? r : new ArrayBuffer(0);
    return this._encodeUserBroadcastPush(e, this.BINARY_ENCODING, s);
  }
  _encodeJsonUserBroadcastPush(e) {
    var t, r;
    let s = (r = (t = e.payload) === null || t === void 0 ? void 0 : t.payload) !== null && r !== void 0 ? r : {}, o3 = new TextEncoder().encode(JSON.stringify(s)).buffer;
    return this._encodeUserBroadcastPush(e, this.JSON_ENCODING, o3);
  }
  _encodeUserBroadcastPush(e, t, r) {
    var s, i4;
    let o3 = e.topic, a = (s = e.ref) !== null && s !== void 0 ? s : "", c3 = (i4 = e.join_ref) !== null && i4 !== void 0 ? i4 : "", d2 = e.payload.event, f4 = this.allowedMetadataKeys ? this._pick(e.payload, this.allowedMetadataKeys) : {}, p4 = Object.keys(f4).length === 0 ? "" : JSON.stringify(f4);
    if (c3.length > 255) throw new Error(`joinRef length ${c3.length} exceeds maximum of 255`);
    if (a.length > 255) throw new Error(`ref length ${a.length} exceeds maximum of 255`);
    if (o3.length > 255) throw new Error(`topic length ${o3.length} exceeds maximum of 255`);
    if (d2.length > 255) throw new Error(`userEvent length ${d2.length} exceeds maximum of 255`);
    if (p4.length > 255) throw new Error(`metadata length ${p4.length} exceeds maximum of 255`);
    let g3 = this.USER_BROADCAST_PUSH_META_LENGTH + c3.length + a.length + o3.length + d2.length + p4.length, h3 = new ArrayBuffer(this.HEADER_LENGTH + g3), l = new DataView(h3), m3 = 0;
    l.setUint8(m3++, this.KINDS.userBroadcastPush), l.setUint8(m3++, c3.length), l.setUint8(m3++, a.length), l.setUint8(m3++, o3.length), l.setUint8(m3++, d2.length), l.setUint8(m3++, p4.length), l.setUint8(m3++, t), Array.from(c3, (v4) => l.setUint8(m3++, v4.charCodeAt(0))), Array.from(a, (v4) => l.setUint8(m3++, v4.charCodeAt(0))), Array.from(o3, (v4) => l.setUint8(m3++, v4.charCodeAt(0))), Array.from(d2, (v4) => l.setUint8(m3++, v4.charCodeAt(0))), Array.from(p4, (v4) => l.setUint8(m3++, v4.charCodeAt(0)));
    var b3 = new Uint8Array(h3.byteLength + r.byteLength);
    return b3.set(new Uint8Array(h3), 0), b3.set(new Uint8Array(r), h3.byteLength), b3.buffer;
  }
  decode(e, t) {
    if (this._isArrayBuffer(e)) {
      let r = this._binaryDecode(e);
      return t(r);
    }
    if (typeof e == "string") {
      let r = JSON.parse(e), [s, i4, o3, a, c3] = r;
      return t({
        join_ref: s,
        ref: i4,
        topic: o3,
        event: a,
        payload: c3
      });
    }
    return t({});
  }
  _binaryDecode(e) {
    let t = new DataView(e), r = t.getUint8(0), s = new TextDecoder();
    if (r === this.KINDS.userBroadcast) return this._decodeUserBroadcast(e, t, s);
  }
  _decodeUserBroadcast(e, t, r) {
    let s = t.getUint8(1), i4 = t.getUint8(2), o3 = t.getUint8(3), a = t.getUint8(4), c3 = this.HEADER_LENGTH + 4, d2 = r.decode(e.slice(c3, c3 + s));
    c3 = c3 + s;
    let f4 = r.decode(e.slice(c3, c3 + i4));
    c3 = c3 + i4;
    let p4 = r.decode(e.slice(c3, c3 + o3));
    c3 = c3 + o3;
    let g3 = e.slice(c3, e.byteLength), h3 = a === this.JSON_ENCODING ? JSON.parse(r.decode(g3)) : g3, l = {
      type: this.BROADCAST_EVENT,
      event: f4,
      payload: h3
    };
    return o3 > 0 && (l.meta = JSON.parse(p4)), {
      join_ref: null,
      ref: null,
      topic: d2,
      event: this.BROADCAST_EVENT,
      payload: l
    };
  }
  _isArrayBuffer(e) {
    var t;
    return e instanceof ArrayBuffer || ((t = e?.constructor) === null || t === void 0 ? void 0 : t.name) === "ArrayBuffer";
  }
  _pick(e, t) {
    return !e || typeof e != "object" ? {} : Object.fromEntries(Object.entries(e).filter(([r]) => t.includes(r)));
  }
};
var u3;
(function(n3) {
  n3.abstime = "abstime", n3.bool = "bool", n3.date = "date", n3.daterange = "daterange", n3.float4 = "float4", n3.float8 = "float8", n3.int2 = "int2", n3.int4 = "int4", n3.int4range = "int4range", n3.int8 = "int8", n3.int8range = "int8range", n3.json = "json", n3.jsonb = "jsonb", n3.money = "money", n3.numeric = "numeric", n3.oid = "oid", n3.reltime = "reltime", n3.text = "text", n3.time = "time", n3.timestamp = "timestamp", n3.timestamptz = "timestamptz", n3.timetz = "timetz", n3.tsrange = "tsrange", n3.tstzrange = "tstzrange";
})(u3 || (u3 = {}));
var H4 = (n3, e, t = {}) => {
  var r;
  let s = (r = t.skipTypes) !== null && r !== void 0 ? r : [];
  return e ? Object.keys(e).reduce((i4, o3) => (i4[o3] = Z2(o3, n3, e, s), i4), {}) : {};
};
var Z2 = (n3, e, t, r) => {
  let s = e.find((a) => a.name === n3), i4 = s?.type, o3 = t[n3];
  return i4 && !r.includes(i4) ? G2(i4, o3) : I(o3);
};
var G2 = (n3, e) => {
  if (n3.charAt(0) === "_") {
    let t = n3.slice(1, n3.length);
    return ne2(e, t);
  }
  switch (n3) {
    case u3.bool:
      return Q2(e);
    case u3.float4:
    case u3.float8:
    case u3.int2:
    case u3.int4:
    case u3.int8:
    case u3.numeric:
    case u3.oid:
      return ee2(e);
    case u3.json:
    case u3.jsonb:
      return te2(e);
    case u3.timestamp:
      return re2(e);
    case u3.abstime:
    case u3.date:
    case u3.daterange:
    case u3.int4range:
    case u3.int8range:
    case u3.money:
    case u3.reltime:
    case u3.text:
    case u3.time:
    case u3.timestamptz:
    case u3.timetz:
    case u3.tsrange:
    case u3.tstzrange:
      return I(e);
    default:
      return I(e);
  }
};
var I = (n3) => n3;
var Q2 = (n3) => {
  switch (n3) {
    case "t":
      return true;
    case "f":
      return false;
    default:
      return n3;
  }
};
var ee2 = (n3) => {
  if (typeof n3 == "string") {
    let e = parseFloat(n3);
    if (!Number.isNaN(e)) return e;
  }
  return n3;
};
var te2 = (n3) => {
  if (typeof n3 == "string") try {
    return JSON.parse(n3);
  } catch {
    return n3;
  }
  return n3;
};
var ne2 = (n3, e) => {
  if (typeof n3 != "string") return n3;
  let t = n3.length - 1, r = n3[t];
  if (n3[0] === "{" && r === "}") {
    let i4, o3 = n3.slice(1, t);
    try {
      i4 = JSON.parse("[" + o3 + "]");
    } catch {
      i4 = o3 ? o3.split(",") : [];
    }
    return i4.map((a) => G2(e, a));
  }
  return n3;
};
var re2 = (n3) => typeof n3 == "string" ? n3.replace(" ", "T") : n3;
var U2 = (n3) => {
  let e = new URL(n3);
  return e.protocol = e.protocol.replace(/^ws/i, "http"), e.pathname = e.pathname.replace(/\/+$/, "").replace(/\/socket\/websocket$/i, "").replace(/\/socket$/i, "").replace(/\/websocket$/i, ""), e.pathname === "" || e.pathname === "/" ? e.pathname = "/api/broadcast" : e.pathname = e.pathname + "/api/broadcast", e.href;
};
var S4 = class n {
  constructor(e, t) {
    let r = ae2(t);
    this.presence = new O4(e.getChannel(), r), this.presence.onJoin((s, i4, o3) => {
      let a = n.onJoinPayload(s, i4, o3);
      e.getChannel().trigger("presence", a);
    }), this.presence.onLeave((s, i4, o3) => {
      let a = n.onLeavePayload(s, i4, o3);
      e.getChannel().trigger("presence", a);
    }), this.presence.onSync(() => {
      e.getChannel().trigger("presence", {
        event: "sync"
      });
    });
  }
  get state() {
    return n.transformState(this.presence.state);
  }
  static transformState(e) {
    return e = oe2(e), Object.getOwnPropertyNames(e).reduce((t, r) => {
      let s = e[r];
      return t[r] = L4(s), t;
    }, {});
  }
  static onJoinPayload(e, t, r) {
    let s = q3(t), i4 = L4(r);
    return {
      event: "join",
      key: e,
      currentPresences: s,
      newPresences: i4
    };
  }
  static onLeavePayload(e, t, r) {
    let s = q3(t), i4 = L4(r);
    return {
      event: "leave",
      key: e,
      currentPresences: s,
      leftPresences: i4
    };
  }
};
function L4(n3) {
  return n3.metas.map((e) => (e.presence_ref = e.phx_ref, delete e.phx_ref, delete e.phx_ref_prev, e));
}
function oe2(n3) {
  return JSON.parse(JSON.stringify(n3));
}
function ae2(n3) {
  return n3?.events && {
    events: n3.events
  };
}
function q3(n3) {
  return n3?.metas ? L4(n3) : [];
}
var M3;
(function(n3) {
  n3.SYNC = "sync", n3.JOIN = "join", n3.LEAVE = "leave";
})(M3 || (M3 = {}));
var A4 = class {
  get state() {
    return this.presenceAdapter.state;
  }
  constructor(e, t) {
    this.channel = e, this.presenceAdapter = new S4(this.channel.channelAdapter, t);
  }
};
function Y2(n3) {
  if (n3 instanceof Error) return n3;
  if (typeof n3 == "string") return new Error(n3);
  if (n3 && typeof n3 == "object") {
    let e = n3;
    if (typeof e.code == "number") {
      let t = typeof e.reason == "string" && e.reason ? ` (${e.reason})` : "";
      return new Error(`socket closed: ${e.code}${t}`, {
        cause: n3
      });
    }
    return new Error("channel error: transport failure", {
      cause: n3
    });
  }
  return new Error("channel error: connection lost");
}
var N4 = class {
  constructor(e, t, r) {
    let s = ce(r);
    this.channel = e.getSocket().channel(t, s), this.socket = e;
  }
  get state() {
    return this.channel.state;
  }
  set state(e) {
    this.channel.state = e;
  }
  get joinedOnce() {
    return this.channel.joinedOnce;
  }
  get joinPush() {
    return this.channel.joinPush;
  }
  get rejoinTimer() {
    return this.channel.rejoinTimer;
  }
  on(e, t) {
    return this.channel.on(e, t);
  }
  off(e, t) {
    this.channel.off(e, t);
  }
  subscribe(e) {
    return this.channel.join(e);
  }
  unsubscribe(e) {
    return this.channel.leave(e);
  }
  teardown() {
    this.channel.teardown();
  }
  onClose(e) {
    this.channel.onClose(e);
  }
  onError(e) {
    return this.channel.onError(e);
  }
  push(e, t, r) {
    let s;
    try {
      s = this.channel.push(e, t, r);
    } catch {
      throw new Error(`tried to push '${e}' to '${this.channel.topic}' before joining. Use channel.subscribe() before pushing events`);
    }
    if (this.channel.pushBuffer.length > K2) {
      let i4 = this.channel.pushBuffer.shift();
      i4.cancelTimeout(), this.socket.log("channel", `discarded push due to buffer overflow: ${i4.event}`, i4.payload());
    }
    return s;
  }
  updateJoinPayload(e) {
    let t = this.channel.joinPush.payload();
    this.channel.joinPush.payload = () => Object.assign(Object.assign({}, t), e);
  }
  canPush() {
    return this.socket.isConnected() && this.state === k2.joined;
  }
  isJoined() {
    return this.state === k2.joined;
  }
  isJoining() {
    return this.state === k2.joining;
  }
  isClosed() {
    return this.state === k2.closed;
  }
  isLeaving() {
    return this.state === k2.leaving;
  }
  updateFilterBindings(e) {
    this.channel.filterBindings = e;
  }
  updatePayloadTransform(e) {
    this.channel.onMessage = e;
  }
  getChannel() {
    return this.channel;
  }
};
function ce(n3) {
  return {
    config: Object.assign({
      broadcast: {
        ack: false,
        self: false
      },
      presence: {
        key: "",
        enabled: false
      },
      private: false
    }, n3.config)
  };
}
var W2;
(function(n3) {
  n3.ALL = "*", n3.INSERT = "INSERT", n3.UPDATE = "UPDATE", n3.DELETE = "DELETE";
})(W2 || (W2 = {}));
var E5;
(function(n3) {
  n3.BROADCAST = "broadcast", n3.PRESENCE = "presence", n3.POSTGRES_CHANGES = "postgres_changes", n3.SYSTEM = "system";
})(E5 || (E5 = {}));
var _3;
(function(n3) {
  n3.SUBSCRIBED = "SUBSCRIBED", n3.TIMED_OUT = "TIMED_OUT", n3.CLOSED = "CLOSED", n3.CHANNEL_ERROR = "CHANNEL_ERROR";
})(_3 || (_3 = {}));
var w2 = class n2 {
  get state() {
    return this.channelAdapter.state;
  }
  set state(e) {
    this.channelAdapter.state = e;
  }
  get joinedOnce() {
    return this.channelAdapter.joinedOnce;
  }
  get timeout() {
    return this.socket.timeout;
  }
  get joinPush() {
    return this.channelAdapter.joinPush;
  }
  get rejoinTimer() {
    return this.channelAdapter.rejoinTimer;
  }
  constructor(e, t = {
    config: {}
  }, r) {
    var s, i4;
    if (this.topic = e, this.params = t, this.socket = r, this.bindings = {}, this.subTopic = e.replace(/^realtime:/i, ""), this.params.config = Object.assign({
      broadcast: {
        ack: false,
        self: false
      },
      presence: {
        key: "",
        enabled: false
      },
      private: false
    }, t.config), this.channelAdapter = new N4(this.socket.socketAdapter, e, this.params), this.presence = new A4(this), this._onClose(() => {
      this.socket._remove(this);
    }), this._updateFilterTransform(), this.broadcastEndpointURL = U2(this.socket.socketAdapter.endPointURL()), this.private = this.params.config.private || false, !this.private && (!((i4 = (s = this.params.config) === null || s === void 0 ? void 0 : s.broadcast) === null || i4 === void 0) && i4.replay)) throw new Error(`tried to use replay on public channel '${this.topic}'. It must be a private channel.`);
  }
  subscribe(e, t = this.timeout) {
    var r, s, i4;
    if (this.socket.isConnected() || this.socket.connect(), this.channelAdapter.isClosed()) {
      let { config: { broadcast: o3, presence: a, private: c3 } } = this.params, d2 = (s = (r = this.bindings.postgres_changes) === null || r === void 0 ? void 0 : r.map((h3) => h3.filter)) !== null && s !== void 0 ? s : [], f4 = !!this.bindings[E5.PRESENCE] && this.bindings[E5.PRESENCE].length > 0 || ((i4 = this.params.config.presence) === null || i4 === void 0 ? void 0 : i4.enabled) === true, p4 = {}, g3 = {
        broadcast: o3,
        presence: Object.assign(Object.assign({}, a), {
          enabled: f4
        }),
        postgres_changes: d2,
        private: c3
      };
      this.socket.accessTokenValue && (p4.access_token = this.socket.accessTokenValue), this._onError((h3) => {
        e?.(_3.CHANNEL_ERROR, Y2(h3));
      }), this._onClose(() => e?.(_3.CLOSED)), this.updateJoinPayload(Object.assign({
        config: g3
      }, p4)), this._updateFilterMessage(), this.channelAdapter.subscribe(t).receive("ok", async ({ postgres_changes: h3 }) => {
        if (this.socket._isManualToken() || this.socket.setAuth(), h3 === void 0) {
          e?.(_3.SUBSCRIBED);
          return;
        }
        this._updatePostgresBindings(h3, e);
      }).receive("error", (h3) => {
        this.state = k2.errored;
        let l = Object.values(h3).join(", ") || "error";
        e?.(_3.CHANNEL_ERROR, new Error(l, {
          cause: h3
        }));
      }).receive("timeout", () => {
        e?.(_3.TIMED_OUT);
      });
    }
    return this;
  }
  _updatePostgresBindings(e, t) {
    var r;
    let s = this.bindings.postgres_changes, i4 = (r = s?.length) !== null && r !== void 0 ? r : 0, o3 = [];
    for (let a = 0; a < i4; a++) {
      let c3 = s[a], { filter: { event: d2, schema: f4, table: p4, filter: g3 } } = c3, h3 = e && e[a];
      if (h3 && h3.event === d2 && n2.isFilterValueEqual(h3.schema, f4) && n2.isFilterValueEqual(h3.table, p4) && n2.isFilterValueEqual(h3.filter, g3)) o3.push(Object.assign(Object.assign({}, c3), {
        id: h3.id
      }));
      else {
        this.unsubscribe(), this.state = k2.errored, t?.(_3.CHANNEL_ERROR, new Error("mismatch between server and client bindings for postgres changes"));
        return;
      }
    }
    this.bindings.postgres_changes = o3, this.state != k2.errored && t && t(_3.SUBSCRIBED);
  }
  presenceState() {
    return this.presence.state;
  }
  async track(e, t = {}) {
    return await this.send({
      type: "presence",
      event: "track",
      payload: e
    }, t.timeout || this.timeout);
  }
  async untrack(e = {}) {
    return await this.send({
      type: "presence",
      event: "untrack"
    }, e);
  }
  on(e, t, r) {
    let s = this.channelAdapter.isJoined() || this.channelAdapter.isJoining(), i4 = e === E5.PRESENCE || e === E5.POSTGRES_CHANGES;
    if (s && i4) throw this.socket.log("channel", `cannot add \`${e}\` callbacks for ${this.topic} after \`subscribe()\`.`), new Error(`cannot add \`${e}\` callbacks for ${this.topic} after \`subscribe()\`.`);
    return this._on(e, t, r);
  }
  async httpSend(e, t, r = {}) {
    var s;
    if (t == null) return Promise.reject(new Error("Payload is required for httpSend()"));
    let i4 = t instanceof ArrayBuffer || ArrayBuffer.isView(t), o3 = {
      apikey: this.socket.apiKey ? this.socket.apiKey : "",
      "Content-Type": i4 ? "application/octet-stream" : "application/json"
    };
    this.socket.accessTokenValue && (o3.Authorization = `Bearer ${this.socket.accessTokenValue}`);
    let a = new URL(this.broadcastEndpointURL);
    a.pathname += `/${encodeURIComponent(this.subTopic)}/events/${encodeURIComponent(e)}`, this.private && a.searchParams.set("private", "true");
    let c3 = {
      method: "POST",
      headers: o3,
      body: i4 ? t : JSON.stringify(t)
    }, d2 = await this._fetchWithTimeout(a.toString(), c3, (s = r.timeout) !== null && s !== void 0 ? s : this.timeout);
    if (d2.status === 202) return {
      success: true
    };
    let f4 = d2.statusText;
    try {
      let p4 = await d2.json();
      f4 = p4.error || p4.message || f4;
    } catch {
    }
    return Promise.reject(new Error(f4));
  }
  async send(e, t = {}) {
    var r, s;
    if (!this.channelAdapter.canPush() && e.type === "broadcast") {
      console.warn("Realtime send() is automatically falling back to REST API. This behavior will be deprecated in the future. Please use httpSend() explicitly for REST delivery.");
      let { event: i4, payload: o3 } = e, a = {
        apikey: this.socket.apiKey ? this.socket.apiKey : "",
        "Content-Type": "application/json"
      };
      this.socket.accessTokenValue && (a.Authorization = `Bearer ${this.socket.accessTokenValue}`);
      let c3 = {
        method: "POST",
        headers: a,
        body: JSON.stringify({
          messages: [
            {
              topic: this.subTopic,
              event: i4,
              payload: o3,
              private: this.private
            }
          ]
        })
      };
      try {
        let d2 = await this._fetchWithTimeout(this.broadcastEndpointURL, c3, (r = t.timeout) !== null && r !== void 0 ? r : this.timeout);
        return await ((s = d2.body) === null || s === void 0 ? void 0 : s.cancel()), d2.ok ? "ok" : "error";
      } catch (d2) {
        return d2 instanceof Error && d2.name === "AbortError" ? "timed out" : "error";
      }
    } else return new Promise((i4) => {
      var o3, a, c3;
      let d2 = this.channelAdapter.push(e.type, e, t.timeout || this.timeout);
      e.type === "broadcast" && !(!((c3 = (a = (o3 = this.params) === null || o3 === void 0 ? void 0 : o3.config) === null || a === void 0 ? void 0 : a.broadcast) === null || c3 === void 0) && c3.ack) && i4("ok"), d2.receive("ok", () => i4("ok")), d2.receive("error", () => i4("error")), d2.receive("timeout", () => i4("timed out"));
    });
  }
  updateJoinPayload(e) {
    this.channelAdapter.updateJoinPayload(e);
  }
  async unsubscribe(e = this.timeout) {
    return new Promise((t) => {
      this.channelAdapter.unsubscribe(e).receive("ok", () => t("ok")).receive("timeout", () => t("timed out")).receive("error", () => t("error"));
    });
  }
  teardown() {
    this.channelAdapter.teardown();
  }
  async _fetchWithTimeout(e, t, r) {
    let s = new AbortController(), i4 = setTimeout(() => s.abort(), r), o3 = await this.socket.fetch(e, Object.assign(Object.assign({}, t), {
      signal: s.signal
    }));
    return clearTimeout(i4), o3;
  }
  _on(e, t, r) {
    let s = e.toLocaleLowerCase(), i4 = this.channelAdapter.on(e, r), o3 = {
      type: s,
      filter: t,
      callback: r,
      ref: i4
    };
    return this.bindings[s] ? this.bindings[s].push(o3) : this.bindings[s] = [
      o3
    ], this._updateFilterMessage(), this;
  }
  _onClose(e) {
    this.channelAdapter.onClose(e);
  }
  _onError(e) {
    this.channelAdapter.onError(e);
  }
  _updateFilterMessage() {
    this.channelAdapter.updateFilterBindings((e, t, r) => {
      var s, i4, o3, a, c3, d2, f4;
      let p4 = e.event.toLocaleLowerCase();
      if (this._notThisChannelEvent(p4, r)) return false;
      let g3 = (s = this.bindings[p4]) === null || s === void 0 ? void 0 : s.find((h3) => h3.ref === e.ref);
      if (!g3) return true;
      if ([
        "broadcast",
        "presence",
        "postgres_changes"
      ].includes(p4)) if ("id" in g3) {
        let h3 = g3.id, l = (i4 = g3.filter) === null || i4 === void 0 ? void 0 : i4.event;
        return h3 && ((o3 = t.ids) === null || o3 === void 0 ? void 0 : o3.includes(h3)) && (l === "*" || l?.toLocaleLowerCase() === ((a = t.data) === null || a === void 0 ? void 0 : a.type.toLocaleLowerCase()));
      } else {
        let h3 = (d2 = (c3 = g3?.filter) === null || c3 === void 0 ? void 0 : c3.event) === null || d2 === void 0 ? void 0 : d2.toLocaleLowerCase();
        return h3 === "*" || h3 === ((f4 = t?.event) === null || f4 === void 0 ? void 0 : f4.toLocaleLowerCase());
      }
      else return g3.type.toLocaleLowerCase() === p4;
    });
  }
  _notThisChannelEvent(e, t) {
    let { close: r, error: s, leave: i4, join: o3 } = O5;
    return t && [
      r,
      s,
      i4,
      o3
    ].includes(e) && t !== this.joinPush.ref;
  }
  _updateFilterTransform() {
    this.channelAdapter.updatePayloadTransform((e, t, r) => {
      if (typeof t == "object" && "ids" in t) {
        let s = t.data, { schema: i4, table: o3, commit_timestamp: a, type: c3, errors: d2 } = s;
        return Object.assign(Object.assign({}, {
          schema: i4,
          table: o3,
          commit_timestamp: a,
          eventType: c3,
          new: {},
          old: {},
          errors: d2
        }), this._getPayloadRecords(s));
      }
      return t;
    });
  }
  copyBindings(e) {
    if (this.joinedOnce) throw new Error("cannot copy bindings into joined channel");
    for (let t in e.bindings) for (let r of e.bindings[t]) this._on(r.type, r.filter, r.callback);
  }
  static isFilterValueEqual(e, t) {
    return (e ?? void 0) === (t ?? void 0);
  }
  _getPayloadRecords(e) {
    let t = {
      new: {},
      old: {}
    };
    return (e.type === "INSERT" || e.type === "UPDATE") && (t.new = H4(e.columns, e.record)), (e.type === "UPDATE" || e.type === "DELETE") && (t.old = H4(e.columns, e.old_record)), t;
  }
};
var R3 = class {
  constructor(e, t) {
    this.socket = new M2(e, t);
  }
  get timeout() {
    return this.socket.timeout;
  }
  get endPoint() {
    return this.socket.endPoint;
  }
  get transport() {
    return this.socket.transport;
  }
  get heartbeatIntervalMs() {
    return this.socket.heartbeatIntervalMs;
  }
  get heartbeatCallback() {
    return this.socket.heartbeatCallback;
  }
  set heartbeatCallback(e) {
    this.socket.heartbeatCallback = e;
  }
  get heartbeatTimer() {
    return this.socket.heartbeatTimer;
  }
  get pendingHeartbeatRef() {
    return this.socket.pendingHeartbeatRef;
  }
  get reconnectTimer() {
    return this.socket.reconnectTimer;
  }
  get vsn() {
    return this.socket.vsn;
  }
  get encode() {
    return this.socket.encode;
  }
  get decode() {
    return this.socket.decode;
  }
  get reconnectAfterMs() {
    return this.socket.reconnectAfterMs;
  }
  get sendBuffer() {
    return this.socket.sendBuffer;
  }
  get stateChangeCallbacks() {
    return this.socket.stateChangeCallbacks;
  }
  connect() {
    this.socket.connect();
  }
  disconnect(e, t, r, s = 1e4) {
    return new Promise((i4) => {
      setTimeout(() => i4("timeout"), s), this.socket.disconnect(() => {
        e(), i4("ok");
      }, t, r);
    });
  }
  push(e) {
    this.socket.push(e);
  }
  log(e, t, r) {
    this.socket.log(e, t, r);
  }
  makeRef() {
    return this.socket.makeRef();
  }
  onOpen(e) {
    this.socket.onOpen(e);
  }
  onClose(e) {
    this.socket.onClose(e);
  }
  onError(e) {
    this.socket.onError(e);
  }
  onMessage(e) {
    this.socket.onMessage(e);
  }
  isConnected() {
    return this.socket.isConnected();
  }
  isConnecting() {
    return this.socket.connectionState() == T4.connecting;
  }
  isDisconnecting() {
    return this.socket.connectionState() == T4.closing;
  }
  connectionState() {
    return this.socket.connectionState();
  }
  endPointURL() {
    return this.socket.endPointURL();
  }
  sendHeartbeat() {
    this.socket.sendHeartbeat();
  }
  getSocket() {
    return this.socket;
  }
};
var X2 = {
  HEARTBEAT_INTERVAL: 25e3,
  RECONNECT_DELAY: 10,
  HEARTBEAT_TIMEOUT_FALLBACK: 100
};
var he2 = [
  1e3,
  2e3,
  5e3,
  1e4
];
var ue2 = 1e4;
function pe2() {
  let n3 = /* @__PURE__ */ new Map();
  return {
    get length() {
      return n3.size;
    },
    clear() {
      n3.clear();
    },
    getItem(e) {
      return n3.has(e) ? n3.get(e) : null;
    },
    key(e) {
      var t;
      return (t = Array.from(n3.keys())[e]) !== null && t !== void 0 ? t : null;
    },
    removeItem(e) {
      n3.delete(e);
    },
    setItem(e, t) {
      n3.set(e, String(t));
    }
  };
}
function fe2() {
  try {
    if (typeof globalThis < "u" && globalThis.sessionStorage) return globalThis.sessionStorage;
  } catch {
  }
  return pe2();
}
var ge2 = `
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;
var j3 = class {
  get endPoint() {
    return this.socketAdapter.endPoint;
  }
  get timeout() {
    return this.socketAdapter.timeout;
  }
  get transport() {
    return this.socketAdapter.transport;
  }
  get heartbeatCallback() {
    return this.socketAdapter.heartbeatCallback;
  }
  get heartbeatIntervalMs() {
    return this.socketAdapter.heartbeatIntervalMs;
  }
  get heartbeatTimer() {
    return this.worker ? this._workerHeartbeatTimer : this.socketAdapter.heartbeatTimer;
  }
  get pendingHeartbeatRef() {
    return this.worker ? this._pendingWorkerHeartbeatRef : this.socketAdapter.pendingHeartbeatRef;
  }
  get reconnectTimer() {
    return this.socketAdapter.reconnectTimer;
  }
  get vsn() {
    return this.socketAdapter.vsn;
  }
  get encode() {
    return this.socketAdapter.encode;
  }
  get decode() {
    return this.socketAdapter.decode;
  }
  get reconnectAfterMs() {
    return this.socketAdapter.reconnectAfterMs;
  }
  get sendBuffer() {
    return this.socketAdapter.sendBuffer;
  }
  get stateChangeCallbacks() {
    return this.socketAdapter.stateChangeCallbacks;
  }
  constructor(e, t) {
    var r;
    if (this.channels = new Array(), this.accessTokenValue = null, this.accessToken = null, this.apiKey = null, this.httpEndpoint = "", this.headers = {}, this.params = {}, this.ref = 0, this.serializer = new C4(), this._manuallySetToken = false, this._authPromise = null, this._workerHeartbeatTimer = void 0, this._pendingWorkerHeartbeatRef = null, this._pendingDisconnectTimer = null, this._disconnectOnEmptyChannelsAfterMs = 0, this._resolveFetch = (i4) => i4 ? (...o3) => i4(...o3) : (...o3) => fetch(...o3), !(!((r = t?.params) === null || r === void 0) && r.apikey)) throw new Error("API key is required to connect to Realtime");
    this.apiKey = t.params.apikey;
    let s = this._initializeOptions(t);
    this.socketAdapter = new R3(e, s), this.httpEndpoint = U2(e), this.fetch = this._resolveFetch(t?.fetch);
  }
  connect() {
    if (!(this.isConnecting() || this.isDisconnecting() || this.isConnected())) {
      this.accessToken && !this._authPromise && this._setAuthSafely("connect"), this._setupConnectionHandlers();
      try {
        this.socketAdapter.connect();
      } catch (e) {
        let t = e.message;
        throw t.includes("Node.js") ? new Error(`${t}

To use Realtime in Node.js, you need to provide a WebSocket implementation:

Option 1: Use Node.js 22+ which has native WebSocket support
Option 2: Install and provide the "ws" package:

  npm install ws

  import ws from "ws"
  const client = new RealtimeClient(url, {
    ...options,
    transport: ws
  })`) : new Error(`WebSocket not available: ${t}`);
      }
      this._handleNodeJsRaceCondition();
    }
  }
  endpointURL() {
    return this.socketAdapter.endPointURL();
  }
  async disconnect(e, t) {
    return this._cancelPendingDisconnect(), this.isDisconnecting() ? "ok" : await this.socketAdapter.disconnect(() => {
      clearInterval(this._workerHeartbeatTimer), this._terminateWorker();
    }, e, t);
  }
  getChannels() {
    return this.channels;
  }
  async removeChannel(e) {
    let t = await e.unsubscribe();
    return t === "ok" && e.teardown(), t;
  }
  async removeAllChannels() {
    let e = this.channels.map(async (r) => {
      let s = await r.unsubscribe();
      return r.teardown(), s;
    }), t = await Promise.all(e);
    return await this.disconnect(), t;
  }
  log(e, t, r) {
    this.socketAdapter.log(e, t, r);
  }
  connectionState() {
    return this.socketAdapter.connectionState() || T4.closed;
  }
  isConnected() {
    return this.socketAdapter.isConnected();
  }
  isConnecting() {
    return this.socketAdapter.isConnecting();
  }
  isDisconnecting() {
    return this.socketAdapter.isDisconnecting();
  }
  channel(e, t = {
    config: {}
  }) {
    let r = `realtime:${e}`, s = this.getChannels().find((i4) => i4.topic === r);
    if (s) return s;
    {
      let i4 = new w2(`realtime:${e}`, t, this);
      return this._cancelPendingDisconnect(), this.channels.push(i4), i4;
    }
  }
  push(e) {
    this.socketAdapter.push(e);
  }
  async setAuth(e = null) {
    this._authPromise = this._performAuth(e);
    try {
      await this._authPromise;
    } finally {
      this._authPromise = null;
    }
  }
  _isManualToken() {
    return this._manuallySetToken;
  }
  async sendHeartbeat() {
    this.socketAdapter.sendHeartbeat();
  }
  onHeartbeat(e) {
    this.socketAdapter.heartbeatCallback = this._wrapHeartbeatCallback(e);
  }
  _makeRef() {
    return this.socketAdapter.makeRef();
  }
  _remove(e) {
    this.channels = this.channels.filter((t) => t.topic !== e.topic), this.channels.length === 0 && (this.log("transport", "no channels remaining, scheduling disconnect"), this._schedulePendingDisconnect());
  }
  _schedulePendingDisconnect() {
    if (this._cancelPendingDisconnect(), this._disconnectOnEmptyChannelsAfterMs === 0) {
      this.log("transport", "disconnecting immediately - no channels"), this.disconnect();
      return;
    }
    this._pendingDisconnectTimer = setTimeout(() => {
      this._pendingDisconnectTimer = null, this.channels.length === 0 && (this.log("transport", "deferred disconnect fired - no channels, disconnecting"), this.disconnect());
    }, this._disconnectOnEmptyChannelsAfterMs), this.log("transport", `deferred disconnect scheduled in ${this._disconnectOnEmptyChannelsAfterMs}ms`);
  }
  _cancelPendingDisconnect() {
    this._pendingDisconnectTimer !== null && (this.log("transport", "pending disconnect cancelled - channel activity detected"), clearTimeout(this._pendingDisconnectTimer), this._pendingDisconnectTimer = null);
  }
  async _performAuth(e = null) {
    let t, r = false;
    if (e) t = e, r = true;
    else if (this.accessToken) try {
      t = await this.accessToken();
    } catch (s) {
      this.log("error", "Error fetching access token from callback", s), t = this.accessTokenValue;
    }
    else t = this.accessTokenValue;
    r ? this._manuallySetToken = true : this.accessToken && (this._manuallySetToken = false), this.accessTokenValue != t && (this.accessTokenValue = t, this.channels.forEach((s) => {
      let i4 = {
        access_token: t,
        version: J2
      };
      t && s.updateJoinPayload(i4), s.joinedOnce && s.channelAdapter.isJoined() && s.channelAdapter.push(O5.access_token, {
        access_token: t
      });
    }));
  }
  async _waitForAuthIfNeeded() {
    this._authPromise && await this._authPromise;
  }
  _setAuthSafely(e = "general") {
    this._isManualToken() || this.setAuth().catch((t) => {
      this.log("error", `Error setting auth in ${e}`, t);
    });
  }
  _setupConnectionHandlers() {
    this.socketAdapter.onOpen(() => {
      (this._authPromise || (this.accessToken && !this.accessTokenValue ? this.setAuth() : Promise.resolve())).catch((t) => {
        this.log("error", "error waiting for auth on connect", t);
      }), this.worker && !this.workerRef && this._startWorkerHeartbeat();
    }), this.socketAdapter.onClose(() => {
      this.worker && this.workerRef && this._terminateWorker();
    }), this.socketAdapter.onMessage((e) => {
      e.ref && e.ref === this._pendingWorkerHeartbeatRef && (this._pendingWorkerHeartbeatRef = null);
    });
  }
  _handleNodeJsRaceCondition() {
    this.socketAdapter.isConnected() && this.socketAdapter.getSocket().onConnOpen();
  }
  _wrapHeartbeatCallback(e) {
    return (t, r) => {
      t == "sent" && this._setAuthSafely(), e && e(t, r);
    };
  }
  _startWorkerHeartbeat() {
    this.workerUrl ? this.log("worker", `starting worker for from ${this.workerUrl}`) : this.log("worker", "starting default worker");
    let e = this._workerObjectUrl(this.workerUrl);
    this.workerRef = new Worker(e), this.workerRef.onerror = (t) => {
      this.log("worker", "worker error", t.message), this._terminateWorker(), this.disconnect();
    }, this.workerRef.onmessage = (t) => {
      t.data.event === "keepAlive" && this.sendHeartbeat();
    }, this.workerRef.postMessage({
      event: "start",
      interval: this.heartbeatIntervalMs
    });
  }
  _terminateWorker() {
    this.workerRef && (this.log("worker", "terminating worker"), this.workerRef.terminate(), this.workerRef = void 0);
  }
  _workerObjectUrl(e) {
    let t;
    if (e) t = e;
    else {
      let r = new Blob([
        ge2
      ], {
        type: "application/javascript"
      });
      t = URL.createObjectURL(r);
    }
    return t;
  }
  _initializeOptions(e) {
    var t, r, s, i4, o3, a, c3, d2, f4, p4, g3, h3;
    this.worker = (t = e?.worker) !== null && t !== void 0 ? t : false, this.accessToken = (r = e?.accessToken) !== null && r !== void 0 ? r : null;
    let l = {};
    l.timeout = (s = e?.timeout) !== null && s !== void 0 ? s : z2, l.heartbeatIntervalMs = (i4 = e?.heartbeatIntervalMs) !== null && i4 !== void 0 ? i4 : X2.HEARTBEAT_INTERVAL, this._disconnectOnEmptyChannelsAfterMs = (o3 = e?.disconnectOnEmptyChannelsAfterMs) !== null && o3 !== void 0 ? o3 : 2 * ((a = e?.heartbeatIntervalMs) !== null && a !== void 0 ? a : X2.HEARTBEAT_INTERVAL), l.transport = (c3 = e?.transport) !== null && c3 !== void 0 ? c3 : x5.getWebSocketConstructor(), l.params = e?.params, l.logger = e?.logger, l.heartbeatCallback = this._wrapHeartbeatCallback(e?.heartbeatCallback), l.sessionStorage = (d2 = e?.sessionStorage) !== null && d2 !== void 0 ? d2 : fe2(), l.reconnectAfterMs = (f4 = e?.reconnectAfterMs) !== null && f4 !== void 0 ? f4 : (y4) => he2[y4 - 1] || ue2;
    let m3, b3, v4 = (p4 = e?.vsn) !== null && p4 !== void 0 ? p4 : F3;
    switch (v4) {
      case $3:
        m3 = (y4, P5) => P5(JSON.stringify(y4)), b3 = (y4, P5) => P5(JSON.parse(y4));
        break;
      case D2:
        m3 = this.serializer.encode.bind(this.serializer), b3 = this.serializer.decode.bind(this.serializer);
        break;
      default:
        throw new Error(`Unsupported serializer version: ${l.vsn}`);
    }
    if (l.vsn = v4, l.encode = (g3 = e?.encode) !== null && g3 !== void 0 ? g3 : m3, l.decode = (h3 = e?.decode) !== null && h3 !== void 0 ? h3 : b3, l.beforeReconnect = this._reconnectAuth.bind(this), (e?.logLevel || e?.log_level) && (this.logLevel = e.logLevel || e.log_level, l.params = Object.assign(Object.assign({}, l.params), {
      log_level: this.logLevel
    })), this.worker) {
      if (typeof globalThis < "u" && !globalThis.Worker) throw new Error("Web Worker is not supported");
      this.workerUrl = e?.workerUrl, l.autoSendHeartbeat = !this.worker;
    }
    return l;
  }
  async _reconnectAuth() {
    await this._waitForAuthIfNeeded(), this.isConnected() || this.connect();
  }
};

// deno:https://esm.sh/@supabase/storage-js@2.108.1/denonext/storage-js.mjs
import { Buffer as __Buffer$ } from "node:buffer";

// deno:https://esm.sh/iceberg-js@0.8.1/denonext/iceberg-js.mjs
var o = class extends Error {
  constructor(e, t) {
    super(e), this.name = "IcebergError", this.status = t.status, this.icebergType = t.icebergType, this.icebergCode = t.icebergCode, this.details = t.details, this.isCommitStateUnknown = t.icebergType === "CommitStateUnknownException" || [
      500,
      502,
      504
    ].includes(t.status) && t.icebergType?.includes("CommitState") === true;
  }
  isNotFound() {
    return this.status === 404;
  }
  isConflict() {
    return this.status === 409;
  }
  isAuthenticationTimeout() {
    return this.status === 419;
  }
};
function w3(e, t, a) {
  let s = new URL(t, e);
  if (a) for (let [c3, r] of Object.entries(a)) r !== void 0 && s.searchParams.set(c3, r);
  return s.toString();
}
async function $4(e) {
  return !e || e.type === "none" ? {} : e.type === "bearer" ? {
    Authorization: `Bearer ${e.token}`
  } : e.type === "header" ? {
    [e.name]: e.value
  } : e.type === "custom" ? await e.getHeaders() : {};
}
function N5(e) {
  let t = e.fetchImpl ?? globalThis.fetch;
  return {
    async request({ method: a, path: s, query: c3, body: r, headers: g3 }) {
      let x7 = w3(e.baseUrl, s, c3), E8 = await $4(e.auth), n3 = await t(x7, {
        method: a,
        headers: {
          ...r ? {
            "Content-Type": "application/json"
          } : {},
          ...E8,
          ...g3
        },
        body: r ? JSON.stringify(r) : void 0
      }), l = await n3.text(), u4 = (n3.headers.get("content-type") || "").includes("application/json"), m3 = u4 && l ? JSON.parse(l) : l;
      if (!n3.ok) {
        let d2 = u4 ? m3 : void 0, h3 = d2?.error;
        throw new o(h3?.message ?? `Request failed with status ${n3.status}`, {
          status: n3.status,
          icebergType: h3?.type,
          icebergCode: h3?.code,
          details: d2
        });
      }
      return {
        status: n3.status,
        headers: n3.headers,
        data: m3
      };
    }
  };
}
function p2(e) {
  return e.join("");
}
var O6 = class {
  constructor(e, t = "") {
    this.client = e, this.prefix = t;
  }
  async listNamespaces(e) {
    let t = e ? {
      parent: p2(e.namespace)
    } : void 0;
    return (await this.client.request({
      method: "GET",
      path: `${this.prefix}/namespaces`,
      query: t
    })).data.namespaces.map((s) => ({
      namespace: s
    }));
  }
  async createNamespace(e, t) {
    let a = {
      namespace: e.namespace,
      properties: t?.properties
    };
    return (await this.client.request({
      method: "POST",
      path: `${this.prefix}/namespaces`,
      body: a
    })).data;
  }
  async dropNamespace(e) {
    await this.client.request({
      method: "DELETE",
      path: `${this.prefix}/namespaces/${p2(e.namespace)}`
    });
  }
  async loadNamespaceMetadata(e) {
    return {
      properties: (await this.client.request({
        method: "GET",
        path: `${this.prefix}/namespaces/${p2(e.namespace)}`
      })).data.properties
    };
  }
  async namespaceExists(e) {
    try {
      return await this.client.request({
        method: "HEAD",
        path: `${this.prefix}/namespaces/${p2(e.namespace)}`
      }), true;
    } catch (t) {
      if (t instanceof o && t.status === 404) return false;
      throw t;
    }
  }
  async createNamespaceIfNotExists(e, t) {
    try {
      return await this.createNamespace(e, t);
    } catch (a) {
      if (a instanceof o && a.status === 409) return;
      throw a;
    }
  }
};
function i3(e) {
  return e.join("");
}
var D3 = class {
  constructor(e, t = "", a) {
    this.client = e, this.prefix = t, this.accessDelegation = a;
  }
  async listTables(e) {
    return (await this.client.request({
      method: "GET",
      path: `${this.prefix}/namespaces/${i3(e.namespace)}/tables`
    })).data.identifiers;
  }
  async createTable(e, t) {
    let a = {};
    return this.accessDelegation && (a["X-Iceberg-Access-Delegation"] = this.accessDelegation), (await this.client.request({
      method: "POST",
      path: `${this.prefix}/namespaces/${i3(e.namespace)}/tables`,
      body: t,
      headers: a
    })).data.metadata;
  }
  async updateTable(e, t) {
    let a = await this.client.request({
      method: "POST",
      path: `${this.prefix}/namespaces/${i3(e.namespace)}/tables/${e.name}`,
      body: t
    });
    return {
      "metadata-location": a.data["metadata-location"],
      metadata: a.data.metadata
    };
  }
  async dropTable(e, t) {
    await this.client.request({
      method: "DELETE",
      path: `${this.prefix}/namespaces/${i3(e.namespace)}/tables/${e.name}`,
      query: {
        purgeRequested: String(t?.purge ?? false)
      }
    });
  }
  async loadTable(e) {
    let t = {};
    return this.accessDelegation && (t["X-Iceberg-Access-Delegation"] = this.accessDelegation), (await this.client.request({
      method: "GET",
      path: `${this.prefix}/namespaces/${i3(e.namespace)}/tables/${e.name}`,
      headers: t
    })).data.metadata;
  }
  async tableExists(e) {
    let t = {};
    this.accessDelegation && (t["X-Iceberg-Access-Delegation"] = this.accessDelegation);
    try {
      return await this.client.request({
        method: "HEAD",
        path: `${this.prefix}/namespaces/${i3(e.namespace)}/tables/${e.name}`,
        headers: t
      }), true;
    } catch (a) {
      if (a instanceof o && a.status === 404) return false;
      throw a;
    }
  }
  async createTableIfNotExists(e, t) {
    try {
      return await this.createTable(e, t);
    } catch (a) {
      if (a instanceof o && a.status === 409) return await this.loadTable({
        namespace: e.namespace,
        name: t.name
      });
      throw a;
    }
  }
};
var I2 = class {
  constructor(e) {
    let t = "v1";
    e.catalogName && (t += `/${e.catalogName}`);
    let a = e.baseUrl.endsWith("/") ? e.baseUrl : `${e.baseUrl}/`;
    this.client = N5({
      baseUrl: a,
      auth: e.auth,
      fetchImpl: e.fetch
    }), this.accessDelegation = e.accessDelegation?.join(","), this.namespaceOps = new O6(this.client, t), this.tableOps = new D3(this.client, t, this.accessDelegation);
  }
  async listNamespaces(e) {
    return this.namespaceOps.listNamespaces(e);
  }
  async createNamespace(e, t) {
    return this.namespaceOps.createNamespace(e, t);
  }
  async dropNamespace(e) {
    await this.namespaceOps.dropNamespace(e);
  }
  async loadNamespaceMetadata(e) {
    return this.namespaceOps.loadNamespaceMetadata(e);
  }
  async listTables(e) {
    return this.tableOps.listTables(e);
  }
  async createTable(e, t) {
    return this.tableOps.createTable(e, t);
  }
  async updateTable(e, t) {
    return this.tableOps.updateTable(e, t);
  }
  async dropTable(e, t) {
    await this.tableOps.dropTable(e, t);
  }
  async loadTable(e) {
    return this.tableOps.loadTable(e);
  }
  async namespaceExists(e) {
    return this.namespaceOps.namespaceExists(e);
  }
  async tableExists(e) {
    return this.tableOps.tableExists(e);
  }
  async createNamespaceIfNotExists(e, t) {
    return this.namespaceOps.createNamespaceIfNotExists(e, t);
  }
  async createTableIfNotExists(e, t) {
    return this.tableOps.createTableIfNotExists(e, t);
  }
};

// deno:https://esm.sh/@supabase/storage-js@2.108.1/denonext/storage-js.mjs
function g2(t) {
  "@babel/helpers - typeof";
  return g2 = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
    return typeof e;
  } : function(e) {
    return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
  }, g2(t);
}
function F4(t, e) {
  if (g2(t) != "object" || !t) return t;
  var r = t[Symbol.toPrimitive];
  if (r !== void 0) {
    var a = r.call(t, e || "default");
    if (g2(a) != "object") return a;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
function L5(t) {
  var e = F4(t, "string");
  return g2(e) == "symbol" ? e : e + "";
}
function D4(t, e, r) {
  return (e = L5(e)) in t ? Object.defineProperty(t, e, {
    value: r,
    enumerable: true,
    configurable: true,
    writable: true
  }) : t[e] = r, t;
}
function j4(t, e) {
  var r = Object.keys(t);
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(t);
    e && (a = a.filter(function(n3) {
      return Object.getOwnPropertyDescriptor(t, n3).enumerable;
    })), r.push.apply(r, a);
  }
  return r;
}
function c2(t) {
  for (var e = 1; e < arguments.length; e++) {
    var r = arguments[e] != null ? arguments[e] : {};
    e % 2 ? j4(Object(r), true).forEach(function(a) {
      D4(t, a, r[a]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(r)) : j4(Object(r)).forEach(function(a) {
      Object.defineProperty(t, a, Object.getOwnPropertyDescriptor(r, a));
    });
  }
  return t;
}
var w4 = class extends Error {
  constructor(t, e = "storage", r, a) {
    super(t), this.__isStorageError = true, this.namespace = e, this.name = e === "vectors" ? "StorageVectorsError" : "StorageError", this.status = r, this.statusCode = a;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      statusCode: this.statusCode
    };
  }
};
function b2(t) {
  return typeof t == "object" && t !== null && "__isStorageError" in t;
}
var S5 = class extends w4 {
  constructor(t, e, r, a = "storage") {
    super(t, a, e, r), this.name = a === "vectors" ? "StorageVectorsApiError" : "StorageApiError", this.status = e, this.statusCode = r;
  }
  toJSON() {
    return c2({}, super.toJSON());
  }
};
var E6 = class extends w4 {
  constructor(t, e, r = "storage") {
    super(t, r), this.name = r === "vectors" ? "StorageVectorsUnknownError" : "StorageUnknownError", this.originalError = e;
  }
};
var de2 = function(t) {
  return t.InternalError = "InternalError", t.S3VectorConflictException = "S3VectorConflictException", t.S3VectorNotFoundException = "S3VectorNotFoundException", t.S3VectorBucketNotEmpty = "S3VectorBucketNotEmpty", t.S3VectorMaxBucketsExceeded = "S3VectorMaxBucketsExceeded", t.S3VectorMaxIndexesExceeded = "S3VectorMaxIndexesExceeded", t;
}({});
function O7(t, e, r) {
  let a = c2({}, t), n3 = e.toLowerCase();
  for (let s of Object.keys(a)) s.toLowerCase() === n3 && delete a[s];
  return a[n3] = r, a;
}
function R4(t) {
  let e = {};
  for (let [r, a] of Object.entries(t)) e[r.toLowerCase()] = a;
  return e;
}
var A5 = (t) => t ? (...e) => t(...e) : (...e) => fetch(...e);
var H5 = (t) => {
  if (typeof t != "object" || t === null) return false;
  let e = Object.getPrototypeOf(t);
  return (e === null || e === Object.prototype || Object.getPrototypeOf(e) === null) && !(Symbol.toStringTag in t) && !(Symbol.iterator in t);
};
var $5 = (t) => {
  if (Array.isArray(t)) return t.map((r) => $5(r));
  if (typeof t == "function" || t !== Object(t)) return t;
  let e = {};
  return Object.entries(t).forEach(([r, a]) => {
    let n3 = r.replace(/([-_][a-z])/gi, (s) => s.toUpperCase().replace(/[-_]/g, ""));
    e[n3] = $5(a);
  }), e;
};
var q4 = (t) => !t || typeof t != "string" || t.length === 0 || t.length > 100 || t.trim() !== t || t.includes("/") || t.includes("\\") ? false : /^[\w!.\*'() &$@=;:+,?-]+$/.test(t);
var T5 = (t) => {
  if (typeof t == "object" && t !== null) {
    let e = t;
    if (typeof e.msg == "string") return e.msg;
    if (typeof e.message == "string") return e.message;
    if (typeof e.error_description == "string") return e.error_description;
    if (typeof e.error == "string") return e.error;
    if (typeof e.error == "object" && e.error !== null) {
      let r = e.error;
      if (typeof r.message == "string") return r.message;
    }
  }
  return JSON.stringify(t);
};
var M4 = async (t, e, r, a) => {
  if (t !== null && typeof t == "object" && "json" in t && typeof t.json == "function") {
    let n3 = t, s = parseInt(String(n3.status), 10);
    Number.isFinite(s) || (s = 500), n3.json().then((o3) => {
      let u4 = o3?.statusCode || o3?.code || s + "";
      e(new S5(T5(o3), s, u4, a));
    }).catch(() => {
      let o3 = s + "";
      e(new S5(n3.statusText || `HTTP ${s} error`, s, o3, a));
    });
  } else e(new E6(T5(t), t, a));
};
var z3 = (t, e, r, a) => {
  let n3 = {
    method: t,
    headers: e?.headers || {}
  };
  if (t === "GET" || t === "HEAD" || !a) return c2(c2({}, n3), r);
  if (H5(a)) {
    var s;
    let o3 = e?.headers || {}, u4;
    for (let [i4, l] of Object.entries(o3)) i4.toLowerCase() === "content-type" && (u4 = l);
    n3.headers = O7(o3, "Content-Type", (s = u4) !== null && s !== void 0 ? s : "application/json"), n3.body = JSON.stringify(a);
  } else n3.body = a;
  return e?.duplex && (n3.duplex = e.duplex), c2(c2({}, n3), r);
};
async function v3(t, e, r, a, n3, s, o3) {
  return new Promise((u4, i4) => {
    t(r, z3(e, a, n3, s)).then((l) => {
      if (!l.ok) throw l;
      if (a?.noResolveJson) return l;
      if (o3 === "vectors") {
        let d2 = l.headers.get("content-type");
        if (l.headers.get("content-length") === "0" || l.status === 204) return {};
        if (!d2 || !d2.includes("application/json")) return {};
      }
      return l.json();
    }).then((l) => u4(l)).catch((l) => M4(l, i4, a, o3));
  });
}
function N6(t = "storage") {
  return {
    get: async (e, r, a, n3) => v3(e, "GET", r, a, n3, void 0, t),
    post: async (e, r, a, n3, s) => v3(e, "POST", r, n3, s, a, t),
    put: async (e, r, a, n3, s) => v3(e, "PUT", r, n3, s, a, t),
    head: async (e, r, a, n3) => v3(e, "HEAD", r, c2(c2({}, a), {}, {
      noResolveJson: true
    }), n3, void 0, t),
    remove: async (e, r, a, n3, s) => v3(e, "DELETE", r, n3, s, a, t)
  };
}
var K3 = N6("storage");
var { get: m2, post: f3, put: B4, head: J3, remove: P3 } = K3;
var h2 = N6("vectors");
var p3 = class {
  constructor(t, e = {}, r, a = "storage") {
    this.shouldThrowOnError = false, this.url = t, this.headers = R4(e), this.fetch = A5(r), this.namespace = a;
  }
  throwOnError() {
    return this.shouldThrowOnError = true, this;
  }
  setHeader(t, e) {
    return this.headers = O7(this.headers, t, e), this;
  }
  async handleOperation(t) {
    var e = this;
    try {
      return {
        data: await t(),
        error: null
      };
    } catch (r) {
      if (e.shouldThrowOnError) throw r;
      if (b2(r)) return {
        data: null,
        error: r
      };
      throw r;
    }
  }
};
var V3;
V3 = Symbol.toStringTag;
var G3 = class {
  constructor(t, e) {
    this.downloadFn = t, this.shouldThrowOnError = e, this[V3] = "StreamDownloadBuilder", this.promise = null;
  }
  then(t, e) {
    return this.getPromise().then(t, e);
  }
  catch(t) {
    return this.getPromise().catch(t);
  }
  finally(t) {
    return this.getPromise().finally(t);
  }
  getPromise() {
    return this.promise || (this.promise = this.execute()), this.promise;
  }
  async execute() {
    var t = this;
    try {
      return {
        data: (await t.downloadFn()).body,
        error: null
      };
    } catch (e) {
      if (t.shouldThrowOnError) throw e;
      if (b2(e)) return {
        data: null,
        error: e
      };
      throw e;
    }
  }
};
var C5;
C5 = Symbol.toStringTag;
var Q3 = class {
  constructor(t, e) {
    this.downloadFn = t, this.shouldThrowOnError = e, this[C5] = "BlobDownloadBuilder", this.promise = null;
  }
  asStream() {
    return new G3(this.downloadFn, this.shouldThrowOnError);
  }
  then(t, e) {
    return this.getPromise().then(t, e);
  }
  catch(t) {
    return this.getPromise().catch(t);
  }
  finally(t) {
    return this.getPromise().finally(t);
  }
  getPromise() {
    return this.promise || (this.promise = this.execute()), this.promise;
  }
  async execute() {
    var t = this;
    try {
      return {
        data: await (await t.downloadFn()).blob(),
        error: null
      };
    } catch (e) {
      if (t.shouldThrowOnError) throw e;
      if (b2(e)) return {
        data: null,
        error: e
      };
      throw e;
    }
  }
};
var W3 = {
  limit: 100,
  offset: 0,
  sortBy: {
    column: "name",
    order: "asc"
  }
};
var I3 = {
  cacheControl: "3600",
  contentType: "text/plain;charset=UTF-8",
  upsert: false
};
var X3 = class extends p3 {
  constructor(t, e = {}, r, a) {
    super(t, e, a, "storage"), this.bucketId = r;
  }
  async uploadOrUpdate(t, e, r, a) {
    var n3 = this;
    return n3.handleOperation(async () => {
      let s, o3 = c2(c2({}, I3), a), u4 = c2(c2({}, n3.headers), t === "POST" && {
        "x-upsert": String(o3.upsert)
      }), i4 = o3.metadata;
      if (typeof Blob < "u" && r instanceof Blob ? (s = new FormData(), s.append("cacheControl", o3.cacheControl), i4 && s.append("metadata", n3.encodeMetadata(i4)), s.append("", r)) : typeof FormData < "u" && r instanceof FormData ? (s = r, s.has("cacheControl") || s.append("cacheControl", o3.cacheControl), i4 && !s.has("metadata") && s.append("metadata", n3.encodeMetadata(i4))) : (s = r, u4["cache-control"] = `max-age=${o3.cacheControl}`, u4["content-type"] = o3.contentType, i4 && (u4["x-metadata"] = n3.toBase64(n3.encodeMetadata(i4))), (typeof ReadableStream < "u" && s instanceof ReadableStream || s && typeof s == "object" && "pipe" in s && typeof s.pipe == "function") && !o3.duplex && (o3.duplex = "half")), a?.headers) for (let [x7, k3] of Object.entries(a.headers)) u4 = O7(u4, x7, k3);
      let l = n3._removeEmptyFolders(e), d2 = n3._getFinalPath(l), y4 = await (t == "PUT" ? B4 : f3)(n3.fetch, `${n3.url}/object/${d2}`, s, c2({
        headers: u4
      }, o3?.duplex ? {
        duplex: o3.duplex
      } : {}));
      return {
        path: l,
        id: y4.Id,
        fullPath: y4.Key
      };
    });
  }
  async upload(t, e, r) {
    return this.uploadOrUpdate("POST", t, e, r);
  }
  async uploadToSignedUrl(t, e, r, a) {
    var n3 = this;
    let s = n3._removeEmptyFolders(t), o3 = n3._getFinalPath(s), u4 = new URL(n3.url + `/object/upload/sign/${o3}`);
    return u4.searchParams.set("token", e), n3.handleOperation(async () => {
      let i4, l = c2(c2({}, I3), a), d2 = c2(c2({}, n3.headers), {
        "x-upsert": String(l.upsert)
      }), y4 = l.metadata;
      if (typeof Blob < "u" && r instanceof Blob ? (i4 = new FormData(), i4.append("cacheControl", l.cacheControl), y4 && i4.append("metadata", n3.encodeMetadata(y4)), i4.append("", r)) : typeof FormData < "u" && r instanceof FormData ? (i4 = r, i4.has("cacheControl") || i4.append("cacheControl", l.cacheControl), y4 && !i4.has("metadata") && i4.append("metadata", n3.encodeMetadata(y4))) : (i4 = r, d2["cache-control"] = `max-age=${l.cacheControl}`, d2["content-type"] = l.contentType, y4 && (d2["x-metadata"] = n3.toBase64(n3.encodeMetadata(y4))), (typeof ReadableStream < "u" && i4 instanceof ReadableStream || i4 && typeof i4 == "object" && "pipe" in i4 && typeof i4.pipe == "function") && !l.duplex && (l.duplex = "half")), a?.headers) for (let [x7, k3] of Object.entries(a.headers)) d2 = O7(d2, x7, k3);
      return {
        path: s,
        fullPath: (await B4(n3.fetch, u4.toString(), i4, c2({
          headers: d2
        }, l?.duplex ? {
          duplex: l.duplex
        } : {}))).Key
      };
    });
  }
  async createSignedUploadUrl(t, e) {
    var r = this;
    return r.handleOperation(async () => {
      let a = r._getFinalPath(t), n3 = c2({}, r.headers);
      e?.upsert && (n3["x-upsert"] = "true");
      let s = await f3(r.fetch, `${r.url}/object/upload/sign/${a}`, {}, {
        headers: n3
      }), o3 = new URL(r.url + s.url), u4 = o3.searchParams.get("token");
      if (!u4) throw new w4("No token returned by API");
      return {
        signedUrl: o3.toString(),
        path: t,
        token: u4
      };
    });
  }
  async update(t, e, r) {
    return this.uploadOrUpdate("PUT", t, e, r);
  }
  async move(t, e, r) {
    var a = this;
    return a.handleOperation(async () => await f3(a.fetch, `${a.url}/object/move`, {
      bucketId: a.bucketId,
      sourceKey: t,
      destinationKey: e,
      destinationBucket: r?.destinationBucket
    }, {
      headers: a.headers
    }));
  }
  async copy(t, e, r) {
    var a = this;
    return a.handleOperation(async () => ({
      path: (await f3(a.fetch, `${a.url}/object/copy`, {
        bucketId: a.bucketId,
        sourceKey: t,
        destinationKey: e,
        destinationBucket: r?.destinationBucket
      }, {
        headers: a.headers
      })).Key
    }));
  }
  async createSignedUrl(t, e, r) {
    var a = this;
    return a.handleOperation(async () => {
      let n3 = a._getFinalPath(t), s = typeof r?.transform == "object" && r.transform !== null && Object.keys(r.transform).length > 0, o3 = await f3(a.fetch, `${a.url}/object/sign/${n3}`, c2({
        expiresIn: e
      }, s ? {
        transform: r.transform
      } : {}), {
        headers: a.headers
      }), u4 = new URLSearchParams();
      r?.download && u4.set("download", r.download === true ? "" : r.download), r?.cacheNonce != null && u4.set("cacheNonce", String(r.cacheNonce));
      let i4 = u4.toString();
      return {
        signedUrl: encodeURI(`${a.url}${o3.signedURL}${i4 ? `&${i4}` : ""}`)
      };
    });
  }
  async createSignedUrls(t, e, r) {
    var a = this;
    return a.handleOperation(async () => {
      let n3 = await f3(a.fetch, `${a.url}/object/sign/${a.bucketId}`, {
        expiresIn: e,
        paths: t
      }, {
        headers: a.headers
      }), s = new URLSearchParams();
      r?.download && s.set("download", r.download === true ? "" : r.download), r?.cacheNonce != null && s.set("cacheNonce", String(r.cacheNonce));
      let o3 = s.toString();
      return n3.map((u4) => c2(c2({}, u4), {}, {
        signedUrl: u4.signedURL ? encodeURI(`${a.url}${u4.signedURL}${o3 ? `&${o3}` : ""}`) : null
      }));
    });
  }
  download(t, e, r) {
    let a = typeof e?.transform == "object" && e.transform !== null && Object.keys(e.transform).length > 0 ? "render/image/authenticated" : "object", n3 = new URLSearchParams();
    e?.transform && this.applyTransformOptsToQuery(n3, e.transform), e?.cacheNonce != null && n3.set("cacheNonce", String(e.cacheNonce));
    let s = n3.toString(), o3 = this._getFinalPath(t), u4 = () => m2(this.fetch, `${this.url}/${a}/${o3}${s ? `?${s}` : ""}`, {
      headers: this.headers,
      noResolveJson: true
    }, r);
    return new Q3(u4, this.shouldThrowOnError);
  }
  async info(t) {
    var e = this;
    let r = e._getFinalPath(t);
    return e.handleOperation(async () => $5(await m2(e.fetch, `${e.url}/object/info/${r}`, {
      headers: e.headers
    })));
  }
  async exists(t) {
    var e = this;
    let r = e._getFinalPath(t);
    try {
      return await J3(e.fetch, `${e.url}/object/${r}`, {
        headers: e.headers
      }), {
        data: true,
        error: null
      };
    } catch (n3) {
      if (e.shouldThrowOnError) throw n3;
      if (b2(n3)) {
        var a;
        let s = n3 instanceof S5 ? n3.status : n3 instanceof E6 ? (a = n3.originalError) === null || a === void 0 ? void 0 : a.status : void 0;
        if (s !== void 0 && [
          400,
          404
        ].includes(s)) return {
          data: false,
          error: n3
        };
      }
      throw n3;
    }
  }
  getPublicUrl(t, e) {
    let r = this._getFinalPath(t), a = new URLSearchParams();
    e?.download && a.set("download", e.download === true ? "" : e.download), e?.transform && this.applyTransformOptsToQuery(a, e.transform), e?.cacheNonce != null && a.set("cacheNonce", String(e.cacheNonce));
    let n3 = a.toString(), s = typeof e?.transform == "object" && e.transform !== null && Object.keys(e.transform).length > 0 ? "render/image" : "object";
    return {
      data: {
        publicUrl: encodeURI(`${this.url}/${s}/public/${r}`) + (n3 ? `?${n3}` : "")
      }
    };
  }
  async remove(t) {
    var e = this;
    return e.handleOperation(async () => await P3(e.fetch, `${e.url}/object/${e.bucketId}`, {
      prefixes: t
    }, {
      headers: e.headers
    }));
  }
  async list(t, e, r) {
    var a = this;
    return a.handleOperation(async () => {
      let n3 = c2(c2(c2({}, W3), e), {}, {
        prefix: t || ""
      });
      return await f3(a.fetch, `${a.url}/object/list/${a.bucketId}`, n3, {
        headers: a.headers
      }, r);
    });
  }
  async listV2(t, e) {
    var r = this;
    return r.handleOperation(async () => {
      let a = c2({}, t);
      return await f3(r.fetch, `${r.url}/object/list-v2/${r.bucketId}`, a, {
        headers: r.headers
      }, e);
    });
  }
  encodeMetadata(t) {
    return JSON.stringify(t);
  }
  toBase64(t) {
    return typeof __Buffer$ < "u" ? __Buffer$.from(t).toString("base64") : btoa(t);
  }
  _getFinalPath(t) {
    return `${this.bucketId}/${t.replace(/^\/+/, "")}`;
  }
  _removeEmptyFolders(t) {
    return t.replace(/^\/|\/$/g, "").replace(/\/+/g, "/");
  }
  applyTransformOptsToQuery(t, e) {
    return e.width && t.set("width", e.width.toString()), e.height && t.set("height", e.height.toString()), e.resize && t.set("resize", e.resize), e.format && t.set("format", e.format), e.quality && t.set("quality", e.quality.toString()), t;
  }
};
var Y3 = "2.108.1";
var _4 = {
  "X-Client-Info": `storage-js/${Y3}`
};
var Z3 = class extends p3 {
  constructor(t, e = {}, r, a) {
    let n3 = new URL(t);
    a?.useNewHostname && /supabase\.(co|in|red)$/.test(n3.hostname) && !n3.hostname.includes("storage.supabase.") && (n3.hostname = n3.hostname.replace("supabase.", "storage.supabase."));
    let s = n3.href.replace(/\/$/, ""), o3 = c2(c2({}, _4), e);
    super(s, o3, r, "storage");
  }
  async listBuckets(t) {
    var e = this;
    return e.handleOperation(async () => {
      let r = e.listBucketOptionsToQueryString(t);
      return await m2(e.fetch, `${e.url}/bucket${r}`, {
        headers: e.headers
      });
    });
  }
  async getBucket(t) {
    var e = this;
    return e.handleOperation(async () => await m2(e.fetch, `${e.url}/bucket/${t}`, {
      headers: e.headers
    }));
  }
  async createBucket(t, e = {
    public: false
  }) {
    var r = this;
    return r.handleOperation(async () => await f3(r.fetch, `${r.url}/bucket`, {
      id: t,
      name: t,
      type: e.type,
      public: e.public,
      file_size_limit: e.fileSizeLimit,
      allowed_mime_types: e.allowedMimeTypes
    }, {
      headers: r.headers
    }));
  }
  async updateBucket(t, e) {
    var r = this;
    return r.handleOperation(async () => await B4(r.fetch, `${r.url}/bucket/${t}`, {
      id: t,
      name: t,
      public: e.public,
      file_size_limit: e.fileSizeLimit,
      allowed_mime_types: e.allowedMimeTypes
    }, {
      headers: r.headers
    }));
  }
  async emptyBucket(t) {
    var e = this;
    return e.handleOperation(async () => await f3(e.fetch, `${e.url}/bucket/${t}/empty`, {}, {
      headers: e.headers
    }));
  }
  async deleteBucket(t) {
    var e = this;
    return e.handleOperation(async () => await P3(e.fetch, `${e.url}/bucket/${t}`, {}, {
      headers: e.headers
    }));
  }
  listBucketOptionsToQueryString(t) {
    let e = {};
    return t && ("limit" in t && (e.limit = String(t.limit)), "offset" in t && (e.offset = String(t.offset)), t.search && (e.search = t.search), t.sortColumn && (e.sortColumn = t.sortColumn), t.sortOrder && (e.sortOrder = t.sortOrder)), Object.keys(e).length > 0 ? "?" + new URLSearchParams(e).toString() : "";
  }
};
var ee3 = class extends p3 {
  constructor(t, e = {}, r) {
    let a = t.replace(/\/$/, ""), n3 = c2(c2({}, _4), e);
    super(a, n3, r, "storage");
  }
  async createBucket(t) {
    var e = this;
    return e.handleOperation(async () => await f3(e.fetch, `${e.url}/bucket`, {
      name: t
    }, {
      headers: e.headers
    }));
  }
  async listBuckets(t) {
    var e = this;
    return e.handleOperation(async () => {
      let r = new URLSearchParams();
      t?.limit !== void 0 && r.set("limit", t.limit.toString()), t?.offset !== void 0 && r.set("offset", t.offset.toString()), t?.sortColumn && r.set("sortColumn", t.sortColumn), t?.sortOrder && r.set("sortOrder", t.sortOrder), t?.search && r.set("search", t.search);
      let a = r.toString(), n3 = a ? `${e.url}/bucket?${a}` : `${e.url}/bucket`;
      return await m2(e.fetch, n3, {
        headers: e.headers
      });
    });
  }
  async deleteBucket(t) {
    var e = this;
    return e.handleOperation(async () => await P3(e.fetch, `${e.url}/bucket/${t}`, {}, {
      headers: e.headers
    }));
  }
  from(t) {
    var e = this;
    if (!q4(t)) throw new w4("Invalid bucket name: File, folder, and bucket names must follow AWS object key naming guidelines and should avoid the use of any other characters.");
    let r = new I2({
      baseUrl: this.url,
      catalogName: t,
      auth: {
        type: "custom",
        getHeaders: async () => e.headers
      },
      fetch: this.fetch
    }), a = this.shouldThrowOnError;
    return new Proxy(r, {
      get(n3, s) {
        let o3 = n3[s];
        return typeof o3 != "function" ? o3 : async (...u4) => {
          try {
            return {
              data: await o3.apply(n3, u4),
              error: null
            };
          } catch (i4) {
            if (a) throw i4;
            return {
              data: null,
              error: i4
            };
          }
        };
      }
    });
  }
};
var te3 = class extends p3 {
  constructor(t, e = {}, r) {
    let a = t.replace(/\/$/, ""), n3 = c2(c2({}, _4), {}, {
      "Content-Type": "application/json"
    }, e);
    super(a, n3, r, "vectors");
  }
  async createIndex(t) {
    var e = this;
    return e.handleOperation(async () => await h2.post(e.fetch, `${e.url}/CreateIndex`, t, {
      headers: e.headers
    }) || {});
  }
  async getIndex(t, e) {
    var r = this;
    return r.handleOperation(async () => await h2.post(r.fetch, `${r.url}/GetIndex`, {
      vectorBucketName: t,
      indexName: e
    }, {
      headers: r.headers
    }));
  }
  async listIndexes(t) {
    var e = this;
    return e.handleOperation(async () => await h2.post(e.fetch, `${e.url}/ListIndexes`, t, {
      headers: e.headers
    }));
  }
  async deleteIndex(t, e) {
    var r = this;
    return r.handleOperation(async () => await h2.post(r.fetch, `${r.url}/DeleteIndex`, {
      vectorBucketName: t,
      indexName: e
    }, {
      headers: r.headers
    }) || {});
  }
};
var re3 = class extends p3 {
  constructor(t, e = {}, r) {
    let a = t.replace(/\/$/, ""), n3 = c2(c2({}, _4), {}, {
      "Content-Type": "application/json"
    }, e);
    super(a, n3, r, "vectors");
  }
  async putVectors(t) {
    var e = this;
    if (t.vectors.length < 1 || t.vectors.length > 500) throw new Error("Vector batch size must be between 1 and 500 items");
    return e.handleOperation(async () => await h2.post(e.fetch, `${e.url}/PutVectors`, t, {
      headers: e.headers
    }) || {});
  }
  async getVectors(t) {
    var e = this;
    return e.handleOperation(async () => await h2.post(e.fetch, `${e.url}/GetVectors`, t, {
      headers: e.headers
    }));
  }
  async listVectors(t) {
    var e = this;
    if (t.segmentCount !== void 0) {
      if (t.segmentCount < 1 || t.segmentCount > 16) throw new Error("segmentCount must be between 1 and 16");
      if (t.segmentIndex !== void 0 && (t.segmentIndex < 0 || t.segmentIndex >= t.segmentCount)) throw new Error(`segmentIndex must be between 0 and ${t.segmentCount - 1}`);
    }
    return e.handleOperation(async () => await h2.post(e.fetch, `${e.url}/ListVectors`, t, {
      headers: e.headers
    }));
  }
  async queryVectors(t) {
    var e = this;
    return e.handleOperation(async () => await h2.post(e.fetch, `${e.url}/QueryVectors`, t, {
      headers: e.headers
    }));
  }
  async deleteVectors(t) {
    var e = this;
    if (t.keys.length < 1 || t.keys.length > 500) throw new Error("Keys batch size must be between 1 and 500 items");
    return e.handleOperation(async () => await h2.post(e.fetch, `${e.url}/DeleteVectors`, t, {
      headers: e.headers
    }) || {});
  }
};
var ae3 = class extends p3 {
  constructor(t, e = {}, r) {
    let a = t.replace(/\/$/, ""), n3 = c2(c2({}, _4), {}, {
      "Content-Type": "application/json"
    }, e);
    super(a, n3, r, "vectors");
  }
  async createBucket(t) {
    var e = this;
    return e.handleOperation(async () => await h2.post(e.fetch, `${e.url}/CreateVectorBucket`, {
      vectorBucketName: t
    }, {
      headers: e.headers
    }) || {});
  }
  async getBucket(t) {
    var e = this;
    return e.handleOperation(async () => await h2.post(e.fetch, `${e.url}/GetVectorBucket`, {
      vectorBucketName: t
    }, {
      headers: e.headers
    }));
  }
  async listBuckets(t = {}) {
    var e = this;
    return e.handleOperation(async () => await h2.post(e.fetch, `${e.url}/ListVectorBuckets`, t, {
      headers: e.headers
    }));
  }
  async deleteBucket(t) {
    var e = this;
    return e.handleOperation(async () => await h2.post(e.fetch, `${e.url}/DeleteVectorBucket`, {
      vectorBucketName: t
    }, {
      headers: e.headers
    }) || {});
  }
};
var ne3 = class extends ae3 {
  constructor(t, e = {}) {
    super(t, e.headers || {}, e.fetch);
  }
  from(t) {
    return new se2(this.url, this.headers, t, this.fetch);
  }
  async createBucket(t) {
    var e = () => super.createBucket, r = this;
    return e().call(r, t);
  }
  async getBucket(t) {
    var e = () => super.getBucket, r = this;
    return e().call(r, t);
  }
  async listBuckets(t = {}) {
    var e = () => super.listBuckets, r = this;
    return e().call(r, t);
  }
  async deleteBucket(t) {
    var e = () => super.deleteBucket, r = this;
    return e().call(r, t);
  }
};
var se2 = class extends te3 {
  constructor(t, e, r, a) {
    super(t, e, a), this.vectorBucketName = r;
  }
  async createIndex(t) {
    var e = () => super.createIndex, r = this;
    return e().call(r, c2(c2({}, t), {}, {
      vectorBucketName: r.vectorBucketName
    }));
  }
  async listIndexes(t = {}) {
    var e = () => super.listIndexes, r = this;
    return e().call(r, c2(c2({}, t), {}, {
      vectorBucketName: r.vectorBucketName
    }));
  }
  async getIndex(t) {
    var e = () => super.getIndex, r = this;
    return e().call(r, r.vectorBucketName, t);
  }
  async deleteIndex(t) {
    var e = () => super.deleteIndex, r = this;
    return e().call(r, r.vectorBucketName, t);
  }
  index(t) {
    return new ce2(this.url, this.headers, this.vectorBucketName, t, this.fetch);
  }
};
var ce2 = class extends re3 {
  constructor(t, e, r, a, n3) {
    super(t, e, n3), this.vectorBucketName = r, this.indexName = a;
  }
  async putVectors(t) {
    var e = () => super.putVectors, r = this;
    return e().call(r, c2(c2({}, t), {}, {
      vectorBucketName: r.vectorBucketName,
      indexName: r.indexName
    }));
  }
  async getVectors(t) {
    var e = () => super.getVectors, r = this;
    return e().call(r, c2(c2({}, t), {}, {
      vectorBucketName: r.vectorBucketName,
      indexName: r.indexName
    }));
  }
  async listVectors(t = {}) {
    var e = () => super.listVectors, r = this;
    return e().call(r, c2(c2({}, t), {}, {
      vectorBucketName: r.vectorBucketName,
      indexName: r.indexName
    }));
  }
  async queryVectors(t) {
    var e = () => super.queryVectors, r = this;
    return e().call(r, c2(c2({}, t), {}, {
      vectorBucketName: r.vectorBucketName,
      indexName: r.indexName
    }));
  }
  async deleteVectors(t) {
    var e = () => super.deleteVectors, r = this;
    return e().call(r, c2(c2({}, t), {}, {
      vectorBucketName: r.vectorBucketName,
      indexName: r.indexName
    }));
  }
};
var fe3 = class extends Z3 {
  constructor(t, e = {}, r, a) {
    super(t, e, r, a);
  }
  from(t) {
    return new X3(this.url, this.headers, t, this.fetch);
  }
  get vectors() {
    return new ne3(this.url + "/vector", {
      headers: this.headers,
      fetch: this.fetch
    });
  }
  get analytics() {
    return new ee3(this.url + "/iceberg", this.headers, this.fetch);
  }
};

// deno:https://esm.sh/@supabase/supabase-js@2.108.1/denonext/supabase-js.mjs
import __Process$2 from "node:process";
var I4 = "2.108.1";
var T6 = "";
var w5;
typeof Deno < "u" ? (T6 = "deno", w5 = (O8 = Deno.version) === null || O8 === void 0 ? void 0 : O8.deno) : typeof document < "u" ? T6 = "web" : typeof navigator < "u" && navigator.product === "ReactNative" ? T6 = "react-native" : (T6 = "node", w5 = typeof __Process$2 < "u" ? (_5 = __Process$2.version) === null || _5 === void 0 ? void 0 : _5.replace(/^v/, "") : void 0);
var O8;
var _5;
var L6 = [
  `runtime=${T6}`
];
w5 && L6.push(`runtime-version=${w5}`);
var F5 = {
  "X-Client-Info": `supabase-js/${I4}; ${L6.join("; ")}`
};
var N7 = {
  headers: F5
};
var j5 = {
  schema: "public"
};
var x6 = {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  flowType: "implicit"
};
var H6 = {};
var K4 = {
  enabled: false,
  respectSamplingDecision: true
};
function $6(e, t, r, n3) {
  function s(i4) {
    return i4 instanceof r ? i4 : new r(function(l) {
      l(i4);
    });
  }
  return new (r || (r = Promise))(function(i4, l) {
    function p4(c3) {
      try {
        f4(n3.next(c3));
      } catch (u4) {
        l(u4);
      }
    }
    function a(c3) {
      try {
        f4(n3.throw(c3));
      } catch (u4) {
        l(u4);
      }
    }
    function f4(c3) {
      c3.done ? i4(c3.value) : s(c3.value).then(p4, a);
    }
    f4((n3 = n3.apply(e, t || [])).next());
  });
}
var A6 = null;
var G4 = "@opentelemetry/api";
function B5() {
  return A6 === null && (A6 = import(G4).catch(() => null)), A6;
}
function M5() {
  return $6(this, void 0, void 0, function* () {
    try {
      let e = yield B5();
      if (!e || !e.propagation || !e.context) return null;
      let t = {};
      e.propagation.inject(e.context.active(), t);
      let r = t.traceparent;
      return r ? {
        traceparent: r,
        tracestate: t.tracestate,
        baggage: t.baggage
      } : null;
    } catch {
      return null;
    }
  });
}
function z4(e) {
  if (!e || typeof e != "string") return null;
  let t = e.split("-");
  if (t.length !== 4) return null;
  let [r, n3, s, i4] = t;
  if (r.length !== 2 || n3.length !== 32 || s.length !== 16 || i4.length !== 2) return null;
  let l = /^[0-9a-f]+$/i;
  return !l.test(r) || !l.test(n3) || !l.test(s) || !l.test(i4) || n3 === "00000000000000000000000000000000" || s === "0000000000000000" ? null : {
    version: r,
    traceId: n3,
    parentId: s,
    traceFlags: i4,
    isSampled: (parseInt(i4, 16) & 1) === 1
  };
}
function W4(e, t) {
  if (!e || !t || t.length === 0) return false;
  let r;
  if (e instanceof URL) r = e;
  else try {
    r = new URL(e);
  } catch {
    return false;
  }
  for (let n3 of t) try {
    if (typeof n3 == "string") {
      if (V4(r.hostname, n3)) return true;
    } else if (n3 instanceof RegExp) {
      if (n3.test(r.hostname)) return true;
    } else if (typeof n3 == "function" && n3(r)) return true;
  } catch {
    continue;
  }
  return false;
}
function V4(e, t) {
  if (t === e) return true;
  if (t.startsWith("*.")) {
    let r = t.slice(2);
    if (e.endsWith(r) && (e === r || e.endsWith("." + r))) return true;
  }
  return false;
}
function q5(e) {
  let t = [];
  try {
    let r = new URL(e);
    t.push(r.hostname);
  } catch {
  }
  return t.push("*.supabase.co", "*.supabase.in"), t.push("localhost", "127.0.0.1", "[::1]"), t;
}
function y3(e) {
  "@babel/helpers - typeof";
  return y3 = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, y3(e);
}
function J4(e, t) {
  if (y3(e) != "object" || !e) return e;
  var r = e[Symbol.toPrimitive];
  if (r !== void 0) {
    var n3 = r.call(e, t || "default");
    if (y3(n3) != "object") return n3;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function X4(e) {
  var t = J4(e, "string");
  return y3(t) == "symbol" ? t : t + "";
}
function Q4(e, t, r) {
  return (t = X4(t)) in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: true,
    configurable: true,
    writable: true
  }) : e[t] = r, e;
}
function E7(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n3 = Object.getOwnPropertySymbols(e);
    t && (n3 = n3.filter(function(s) {
      return Object.getOwnPropertyDescriptor(e, s).enumerable;
    })), r.push.apply(r, n3);
  }
  return r;
}
function o2(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = arguments[t] != null ? arguments[t] : {};
    t % 2 ? E7(Object(r), true).forEach(function(n3) {
      Q4(e, n3, r[n3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : E7(Object(r)).forEach(function(n3) {
      Object.defineProperty(e, n3, Object.getOwnPropertyDescriptor(r, n3));
    });
  }
  return e;
}
var Y4 = (e) => e ? (...t) => e(...t) : (...t) => fetch(...t);
var Z4 = () => Headers;
var ee4 = (e, t, r, n3, s) => {
  let i4 = Y4(n3), l = Z4(), p4 = s?.enabled === true, a = s?.respectSamplingDecision !== false, f4 = p4 ? q5(t) : null;
  return async (c3, u4) => {
    var m3;
    let b3 = (m3 = await r()) !== null && m3 !== void 0 ? m3 : e, h3 = new l(u4?.headers);
    if (h3.has("apikey") || h3.set("apikey", e), h3.has("Authorization") || h3.set("Authorization", `Bearer ${b3}`), f4) {
      let d2 = await te4(c3, f4, a);
      d2 && (d2.traceparent && !h3.has("traceparent") && h3.set("traceparent", d2.traceparent), d2.tracestate && !h3.has("tracestate") && h3.set("tracestate", d2.tracestate), d2.baggage && !h3.has("baggage") && h3.set("baggage", d2.baggage));
    }
    return i4(c3, o2(o2({}, u4), {}, {
      headers: h3
    }));
  };
};
async function te4(e, t, r) {
  if (!W4(typeof e == "string" || e instanceof URL ? e : e.url, t)) return null;
  let n3 = await M5();
  if (!n3 || !n3.traceparent) return null;
  if (r) {
    let s = z4(n3.traceparent);
    if (s && !s.isSampled) return null;
  }
  return n3;
}
function P4(e) {
  return typeof e == "boolean" ? {
    enabled: e
  } : e;
}
function re4(e) {
  return e.endsWith("/") ? e : e + "/";
}
function ne4(e, t) {
  var r, n3, s, i4, l, p4;
  let { db: a, auth: f4, realtime: c3, global: u4 } = e, { db: m3, auth: b3, realtime: h3, global: d2 } = t, g3 = P4(e.tracePropagation), v4 = P4(t.tracePropagation), S6 = {
    db: o2(o2({}, m3), a),
    auth: o2(o2({}, b3), f4),
    realtime: o2(o2({}, h3), c3),
    storage: {},
    global: o2(o2(o2({}, d2), u4), {}, {
      headers: o2(o2({}, (r = d2?.headers) !== null && r !== void 0 ? r : {}), (n3 = u4?.headers) !== null && n3 !== void 0 ? n3 : {})
    }),
    tracePropagation: {
      enabled: (s = (i4 = g3?.enabled) !== null && i4 !== void 0 ? i4 : v4?.enabled) !== null && s !== void 0 ? s : false,
      respectSamplingDecision: (l = (p4 = g3?.respectSamplingDecision) !== null && p4 !== void 0 ? p4 : v4?.respectSamplingDecision) !== null && l !== void 0 ? l : true
    },
    accessToken: async () => ""
  };
  return e.accessToken ? S6.accessToken = e.accessToken : delete S6.accessToken, S6;
}
function se3(e) {
  let t = e?.trim();
  if (!t) throw new Error("supabaseUrl is required.");
  if (!t.match(/^https?:\/\//i)) throw new Error("Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.");
  try {
    return new URL(re4(t));
  } catch {
    throw Error("Invalid supabaseUrl: Provided URL is malformed.");
  }
}
var ie2 = class extends Ht {
  constructor(e) {
    super(e);
  }
};
var ae4 = class {
  constructor(e, t, r) {
    var n3, s;
    this.supabaseUrl = e, this.supabaseKey = t;
    let i4 = se3(e);
    if (!t) throw new Error("supabaseKey is required.");
    this.realtimeUrl = new URL("realtime/v1", i4), this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace("http", "ws"), this.authUrl = new URL("auth/v1", i4), this.storageUrl = new URL("storage/v1", i4), this.functionsUrl = new URL("functions/v1", i4);
    let l = `sb-${i4.hostname.split(".")[0]}-auth-token`, p4 = {
      db: j5,
      realtime: H6,
      auth: o2(o2({}, x6), {}, {
        storageKey: l
      }),
      global: N7,
      tracePropagation: K4
    }, a = ne4(r ?? {}, p4);
    if (this.settings = a, this.storageKey = (n3 = a.auth.storageKey) !== null && n3 !== void 0 ? n3 : "", this.headers = (s = a.global.headers) !== null && s !== void 0 ? s : {}, a.accessToken) this.accessToken = a.accessToken, this.auth = new Proxy({}, {
      get: (c3, u4) => {
        throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(u4)} is not possible`);
      }
    });
    else {
      var f4;
      this.auth = this._initSupabaseAuthClient((f4 = a.auth) !== null && f4 !== void 0 ? f4 : {}, this.headers, a.global.fetch);
    }
    this.fetch = ee4(t, e, this._getAccessToken.bind(this), a.global.fetch, a.tracePropagation), this.realtime = this._initRealtimeClient(o2({
      headers: this.headers,
      accessToken: this._getAccessToken.bind(this),
      fetch: this.fetch
    }, a.realtime)), this.accessToken && Promise.resolve(this.accessToken()).then((c3) => this.realtime.setAuth(c3)).catch((c3) => console.warn("Failed to set initial Realtime auth token:", c3)), this.rest = new C2(new URL("rest/v1", i4).href, {
      headers: this.headers,
      schema: a.db.schema,
      fetch: this.fetch,
      timeout: a.db.timeout,
      urlLengthLimit: a.db.urlLengthLimit
    }), this.storage = new fe3(this.storageUrl.href, this.headers, this.fetch, r?.storage), a.accessToken || this._listenForAuthEvents();
  }
  get functions() {
    return new A2(this.functionsUrl.href, {
      headers: this.headers,
      customFetch: this.fetch
    });
  }
  from(e) {
    return this.rest.from(e);
  }
  schema(e) {
    return this.rest.schema(e);
  }
  rpc(e, t = {}, r = {
    head: false,
    get: false,
    count: void 0
  }) {
    return this.rest.rpc(e, t, r);
  }
  channel(e, t = {
    config: {}
  }) {
    return this.realtime.channel(e, t);
  }
  getChannels() {
    return this.realtime.getChannels();
  }
  removeChannel(e) {
    return this.realtime.removeChannel(e);
  }
  removeAllChannels() {
    return this.realtime.removeAllChannels();
  }
  async _getAccessToken() {
    var e = this, t, r;
    if (e.accessToken) return await e.accessToken();
    let { data: n3 } = await e.auth.getSession();
    return (t = (r = n3.session) === null || r === void 0 ? void 0 : r.access_token) !== null && t !== void 0 ? t : e.supabaseKey;
  }
  _initSupabaseAuthClient({ autoRefreshToken: e, persistSession: t, detectSessionInUrl: r, storage: n3, userStorage: s, storageKey: i4, flowType: l, lock: p4, debug: a, throwOnError: f4, experimental: c3, lockAcquireTimeout: u4, skipAutoInitialize: m3 }, b3, h3) {
    let d2 = {
      Authorization: `Bearer ${this.supabaseKey}`,
      apikey: `${this.supabaseKey}`
    };
    return new ie2({
      url: this.authUrl.href,
      headers: o2(o2({}, d2), b3),
      storageKey: i4,
      autoRefreshToken: e,
      persistSession: t,
      detectSessionInUrl: r,
      storage: n3,
      userStorage: s,
      flowType: l,
      lock: p4,
      debug: a,
      throwOnError: f4,
      experimental: c3,
      fetch: h3,
      lockAcquireTimeout: u4,
      skipAutoInitialize: m3,
      hasCustomAuthorizationHeader: Object.keys(this.headers).some((g3) => g3.toLowerCase() === "authorization")
    });
  }
  _initRealtimeClient(e) {
    return new j3(this.realtimeUrl.href, o2(o2({}, e), {}, {
      params: o2(o2({}, {
        apikey: this.supabaseKey
      }), e?.params)
    }));
  }
  _listenForAuthEvents() {
    return this.auth.onAuthStateChange((e, t) => {
      this._handleTokenChanged(e, "CLIENT", t?.access_token);
    });
  }
  _handleTokenChanged(e, t, r) {
    (e === "TOKEN_REFRESHED" || e === "SIGNED_IN") && this.changedAccessToken !== r ? (this.changedAccessToken = r, this.realtime.setAuth(r)) : e === "SIGNED_OUT" && (this.realtime.setAuth(), t == "STORAGE" && this.auth.signOut(), this.changedAccessToken = void 0);
  }
};
var ye2 = (e, t, r) => new ae4(e, t, r);
function oe3() {
  if (typeof globalThis < "u") return false;
  let e = __Process$2;
  if (!e) return false;
  let t = e.version;
  if (t == null) return false;
  let r = t.match(/^v(\d+)\./);
  return r ? parseInt(r[1], 10) <= 18 : false;
}
oe3() && console.warn("\u26A0\uFE0F  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217");

// supabase/functions/agent-orchestrator/guards/non-text.ts
var NON_TEXT_TYPES = [
  "image",
  "audio",
  "document",
  "sticker",
  "reaction",
  "video"
];
function checkNonText(ctx) {
  if (NON_TEXT_TYPES.includes(ctx.payload.message_type)) {
    return "I can only read text messages right now. Please type your question!";
  }
  return null;
}

// supabase/functions/agent-orchestrator/guards/credits.ts
var GOWA_BASE_URL = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "");
var GOWA_AUTH = Deno.env.get("GOWA_API_KEY") ? btoa(Deno.env.get("GOWA_API_KEY")) : "";
var APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://7flowcore.vercel.app";
async function checkCredits(ctx, workspace) {
  if ((workspace.credits_remaining ?? workspace.credits_balance ?? 0) > 0) return null;
  if (!workspace.low_credits_notified) {
    try {
      await ctx.supabase.from("workspaces").update({
        low_credits_notified: true
      }).eq("id", ctx.payload.workspace_id);
      const notifId = crypto.randomUUID();
      await ctx.supabase.from("notifications").insert({
        id: notifId,
        workspace_id: ctx.payload.workspace_id,
        title: "Credits Exhausted",
        message: "Your workspace has run out of credits. Customer messages are being blocked. Upgrade your plan to continue serving customers.",
        type: "warning",
        link: "/settings/billing",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      const ownerId = workspace.owner_id;
      if (ownerId) {
        const { data: ownerUser } = await ctx.supabase.auth.admin.getUserById(ownerId);
        const ownerEmail = ownerUser?.user?.email || null;
        const ownerPhone = workspace.owner_personal_phone || null;
        const internalSecret = Deno.env.get("INTERNAL_CRON_SECRET") || "";
        (async () => {
          try {
            await fetch(`${APP_URL}/api/internal/notify-low-credits`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${internalSecret}`
              },
              body: JSON.stringify({
                workspace_id: ctx.payload.workspace_id,
                owner_email: ownerEmail,
                owner_phone: ownerPhone
              })
            });
          } catch (_6) {
          }
          if (ownerPhone && GOWA_BASE_URL && GOWA_AUTH) {
            try {
              const { data: gs } = await ctx.supabase.from("gowa_sessions").select("gowa_session_id").eq("workspace_id", ctx.payload.workspace_id).maybeSingle();
              if (gs?.gowa_session_id) {
                let cleanedPhone = ownerPhone.replace(/\D/g, "");
                if (cleanedPhone.length === 10 && /^[6-9]/.test(cleanedPhone)) {
                  cleanedPhone = "91" + cleanedPhone;
                }
                await fetch(`${GOWA_BASE_URL}/send/message`, {
                  method: "POST",
                  headers: {
                    Authorization: `Basic ${GOWA_AUTH}`,
                    "Content-Type": "application/json",
                    "X-Device-Id": gs.gowa_session_id
                  },
                  body: JSON.stringify({
                    phone: cleanedPhone,
                    message: `\u26A0\uFE0F Your FlowCore workspace has run out of credits. Customer messages are being blocked. Upgrade your plan at ${APP_URL}/settings/billing`
                  })
                });
              }
            } catch (_6) {
            }
          }
        })();
      }
    } catch (e) {
      console.error("[CREDITS_GUARD] Notification error:", e?.message || e);
    }
  }
  return workspace.guardrail_config?.out_of_credits_message ?? "Our service is currently unavailable. Please contact the business directly.";
}

// supabase/functions/agent-orchestrator/guards/window.ts
function checkWhatsAppWindow(ctx, workspace) {
  if (ctx.payload.source !== "whatsapp") return null;
  const lastUserMsgAt = ctx.session.last_customer_message_at;
  if (!lastUserMsgAt) return null;
  const hoursSinceLastMsg = (Date.now() - new Date(lastUserMsgAt).getTime()) / 36e5;
  if (hoursSinceLastMsg > 23.5) {
    return workspace.guardrail_config?.window_expired_message ?? "Our response window has closed. A human agent will get back to you soon.";
  }
  return null;
}

// supabase/functions/agent-orchestrator/guards/escalation.ts
var APP_URL2 = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://7flowcore.vercel.app";
var CRON_SECRET = Deno.env.get("INTERNAL_CRON_SECRET") || "";
var DEFAULT_KEYWORDS = [
  // Explicit human handoff requests
  "talk to a human",
  "talk to a person",
  "speak to a human",
  "speak to a person",
  "connect me to",
  "transfer me to",
  "escalate to",
  // Management/authority requests
  "talk to manager",
  "speak to manager",
  "talk to owner",
  "speak to owner",
  "call manager",
  "call owner",
  "contact manager",
  "contact owner",
  "where is the manager",
  "where is the owner",
  "get me the boss",
  // Severe emotional distress (require compound phrases, not single words)
  "i am furious",
  "i'm furious",
  "this is unacceptable",
  "unacceptable service",
  "worst service ever",
  "terrible service",
  "absolutely terrible",
  "i want a refund",
  "give me a refund",
  "refund my money",
  "i will sue",
  "i'm going to sue",
  "legal action",
  "lawyer",
  "social media complaint",
  "posting on social",
  "chargeback"
];
function expandEscalationKeywords(keywords) {
  const out = [];
  for (const kw of keywords) {
    const t = kw.trim().toLowerCase();
    if (!t) continue;
    if (t.includes(" ") && t.length >= 4) {
      out.push(t);
      continue;
    }
    const demand = [
      `i want a ${t}`,
      `give me a ${t}`,
      `i need a ${t}`,
      `demand a ${t}`
    ];
    out.push(...demand);
    if ([
      "refund",
      "complaint",
      "cancel"
    ].includes(t)) out.push(`${t} my money`, `${t} immediately`, `i want my ${t}`, `i have a ${t}`, `filing a ${t}`, `lodging a ${t}`);
    if ([
      "manager",
      "owner",
      "boss",
      "supervisor"
    ].includes(t)) out.push(`talk to the ${t}`, `speak to the ${t}`, `call the ${t}`, `get me the ${t}`);
    if (t === "legal") out.push(`take ${t} action`, `seek ${t} advice`);
  }
  return out;
}
async function checkEscalation(ctx, workspace) {
  if (ctx.session?.status === "escalated") return null;
  if (ctx._escalationHandled) return null;
  ctx._escalationHandled = true;
  const customKeywords = workspace.guardrail_config?.escalation_keywords;
  const expandedCustom = customKeywords ? expandEscalationKeywords(customKeywords) : [];
  const keywords = [
    .../* @__PURE__ */ new Set([
      ...DEFAULT_KEYWORDS,
      ...expandedCustom
    ])
  ];
  const msgLower = ctx.payload.message.toLowerCase();
  if (!keywords.some((k3) => msgLower.includes(k3))) return null;
  await ctx.supabase.from("conversation_sessions").update({
    status: "escalated",
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", ctx.session.id);
  try {
    await ctx.supabase.from("escalation_logs").insert({
      session_id: ctx.session.id,
      workspace_id: ctx.payload.workspace_id,
      trigger_type: "guardrail_hit",
      trigger_message: msgLower,
      conversation_snapshot: {
        message: ctx.payload.message.substring(0, 500)
      },
      status: "open"
    });
  } catch (e) {
    console.error("[ESCALATION] Failed to insert escalation_log:", e.message);
  }
  try {
    await ctx.supabase.from("notifications").insert({
      id: crypto.randomUUID(),
      workspace_id: ctx.payload.workspace_id,
      title: "Customer Escalation",
      message: `A customer (${ctx.contact?.name || ctx.session?.customer_name || "Unknown"}) has requested human assistance.`,
      type: "escalation",
      link: "/inbox",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (e) {
    console.error("[ESCALATION] Dashboard notification error:", e.message);
  }
  const { data: notifPref } = await ctx.supabase.from("workspace_notifications").select("notification_mode, email_on_escalation, whatsapp_alert_number").eq("workspace_id", ctx.payload.workspace_id).maybeSingle();
  const notificationMode = notifPref?.notification_mode || "instant";
  if (notificationMode === "instant" && notifPref?.email_on_escalation !== false) {
    try {
      const ownerEmail = workspace.owner_id ? await ctx.supabase.rpc("get_user_email", {
        user_id: workspace.owner_id
      }) : null;
      if (ownerEmail?.data) {
        await fetch(`${APP_URL2}/api/emails/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${CRON_SECRET}`
          },
          body: JSON.stringify({
            to: ownerEmail.data,
            subject: `Escalation Alert \u2014 ${workspace.name || "Your Workspace"}`,
            template: "escalation",
            data: {
              workspaceName: workspace.name || "Your Workspace",
              customerName: ctx.contact?.name || ctx.session?.customer_name || "A Customer",
              reason: msgLower,
              inboxUrl: `${APP_URL2}/inbox`
            }
          })
        });
      }
    } catch (e) {
      console.error("[ESCALATION] Email notification error:", e.message);
    }
  }
  const alertPhone = notifPref?.whatsapp_alert_number || workspace.owner_personal_phone || null;
  if (alertPhone && notificationMode === "instant") {
    try {
      const { data: device } = await ctx.supabase.from("gowa_sessions").select("gowa_session_id").eq("workspace_id", ctx.payload.workspace_id).eq("status", "connected").maybeSingle();
      if (device?.gowa_session_id) {
        const gowaKey = Deno.env.get("GOWA_API_KEY") || "";
        const alertMsg = `\u{1F6A8} *Escalation Alert*

Customer: ${ctx.contact?.name || ctx.session?.customer_name || "Unknown"}
Reason: ${msgLower}

View inbox: ${APP_URL2}/inbox`;
        await fetch(`${Deno.env.get("GOWA_BASE_URL")}/send/message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(gowaKey)}`,
            "X-Device-Id": device.gowa_session_id
          },
          body: JSON.stringify({
            phone: alertPhone,
            message: alertMsg
          })
        });
      }
    } catch (e) {
      console.error("[ESCALATION] WhatsApp alert error:", e.message);
    }
  }
  return workspace.guardrail_config?.handoff_message ?? "I've notified our team and a human will get back to you shortly.";
}

// supabase/functions/agent-orchestrator/guards/blocked-topics.ts
function checkBlockedTopics(ctx, workspace) {
  const blockedTopics = workspace.guardrail_config?.blocked_topics ?? [];
  if (blockedTopics.length === 0) return null;
  const msgLower = ctx.payload.message.toLowerCase();
  if (blockedTopics.some((topic) => msgLower.includes(topic.toLowerCase()))) {
    return workspace.guardrail_config?.fallback_message ?? "I'm sorry, I can't help with that. Please contact the business directly.";
  }
  return null;
}

// supabase/functions/agent-orchestrator/guards/pricing.ts
var PRICING_KEYWORDS = [
  "price",
  "cost",
  "how much",
  "rate",
  "pricing",
  "charge",
  "fee",
  "what is the price",
  "what are your rates",
  "how much does",
  "cost of",
  "price list",
  "rate card",
  "\u591A\u5C11\u94B1"
];
function checkPricing(ctx, workspace) {
  if (workspace.guardrail_config?.allow_pricing !== false) return null;
  const msgLower = ctx.payload.message.toLowerCase();
  if (PRICING_KEYWORDS.some((kw) => msgLower.includes(kw))) {
    ctx.pricingBlocked = true;
  }
  return null;
}

// supabase/functions/agent-orchestrator/guards/token-budget.ts
function checkTokenBudget(ctx, workspace) {
  const sessionLimit = workspace.guardrail_config?.session_token_limit ?? workspace.guardrail_config?.daily_token_limit ?? 5e4;
  if ((ctx.session.total_tokens_used ?? 0) >= sessionLimit) {
    return workspace.guardrail_config?.limit_replied_message ?? workspace.guardrail_config?.limit_reached_message ?? "Your conversation has reached its limit. A human agent will take over.";
  }
  return null;
}

// supabase/functions/agent-orchestrator/guards/greeting.ts
var GREETING_PATTERNS = /^(hi|hello|hey|howdy|hola|good\s*(morning|afternoon|evening|day)|greetings|sup|yo|namaste|hiya|heya|what'?s\s*up|hii+|hell+o+)[\s!.,;:?\-~\p{Extended_Pictographic}]*(?:\s+(how|what|there|everyone)\s*.*)?$/iu;
function checkGreeting(ctx, workspace) {
  if ((ctx.session.message_count ?? 0) > 0) return null;
  const msg = (ctx.payload.message ?? "").trim();
  if (!GREETING_PATTERNS.test(msg)) return null;
  if (workspace.welcome_template) {
    return workspace.welcome_template;
  }
  const businessName = workspace.name ?? "our business";
  return `Hi! Welcome to ${businessName}. How can I help you today? \u{1F44B}`;
}

// supabase/functions/agent-orchestrator/guards/sales.ts
var SALES_GUARD_KEYWORDS = [
  "order",
  "buy",
  "purchase",
  "product",
  "menu",
  "service list",
  "what do you sell",
  "quote",
  "deal",
  "discount"
];
function checkSales(ctx, workspace) {
  if (workspace.guardrail_config?.allow_sales !== false) return null;
  const msgLower = ctx.payload.message.toLowerCase();
  if (SALES_GUARD_KEYWORDS.some((kw) => msgLower.includes(kw))) {
    ctx.salesBlocked = true;
  }
  return null;
}

// supabase/functions/agent-orchestrator/guards/index.ts
async function runGuard(ctx, workspace, fn, reason) {
  const response = await fn(ctx, workspace);
  if (response !== null) {
    return {
      handled: true,
      response,
      reason: `guardrail_${reason}`
    };
  }
  return null;
}
async function runAllGuards(ctx, workspace) {
  const guards = [
    [
      checkNonText,
      "non_text"
    ],
    [
      checkEscalation,
      "escalation"
    ],
    [
      checkBlockedTopics,
      "blocked"
    ],
    [
      checkCredits,
      "credits"
    ],
    [
      checkWhatsAppWindow,
      "window"
    ],
    [
      checkSales,
      "sales"
    ],
    [
      checkPricing,
      "pricing"
    ],
    [
      checkTokenBudget,
      "tokens"
    ],
    [
      checkGreeting,
      "greeting"
    ]
  ];
  for (const [fn, reason] of guards) {
    const result = await runGuard(ctx, workspace, fn, reason);
    if (result) return result;
  }
  return null;
}

// supabase/functions/agent-orchestrator/pipeline/t0-instant.ts
async function runT0(ctx) {
  const { payload, supabase } = ctx;
  if (!payload.message || payload.message.trim().length === 0) {
    return {
      handled: true,
      response: "",
      reason: "empty_message_skipped"
    };
  }
  if (payload.source !== "widget" || payload.is_test) {
    const { data: existing } = await supabase.from("messages").select("id").eq("gowa_message_id", payload.gowa_message_id).maybeSingle();
    if (!existing) {
      try {
        await supabase.from("messages").insert({
          workspace_id: payload.workspace_id,
          session_id: ctx.session.id,
          content: payload.message || payload.message_type || "[non-text]",
          direction: "inbound",
          role: "customer",
          gowa_message_id: payload.gowa_message_id,
          is_test: payload.is_test || false
        });
      } catch (e) {
        console.error("[T0] Message store failed:", e.message);
      }
    }
  }
  if (ctx.session?.status === "escalated") {
    return {
      handled: true,
      response: ctx.workspace?.guardrail_config?.handoff_message ?? "Your request has been escalated to our team. They will get back to you shortly.",
      reason: "already_escalated"
    };
  }
  const guardResult = await runAllGuards(ctx, ctx.workspace);
  if (guardResult) {
    return guardResult;
  }
  return {
    handled: false
  };
}

// supabase/functions/agent-orchestrator/lib/hf-embeddings.ts
var model = null;
async function getModel() {
  if (!model) {
    model = new Supabase.ai.Session("gte-small");
  }
  return model;
}
async function generateEmbedding(text) {
  try {
    const m3 = await getModel();
    const embedding = await m3.run(text, {
      mean_pool: true,
      normalize: true
    });
    return Array.from(embedding);
  } catch (error) {
    console.error("Embedding generation failed:", error);
    throw new Error("Embedding generation failed");
  }
}

// supabase/functions/agent-orchestrator/pipeline/t1-cache.ts
async function runT1(ctx) {
  const msgBytes = new TextEncoder().encode(ctx.payload.message.toLowerCase().trim().slice(0, 500));
  const hashBuf = await crypto.subtle.digest("SHA-256", msgBytes);
  const cacheKeyHex = Array.from(new Uint8Array(hashBuf)).map((b3) => b3.toString(16).padStart(2, "0")).join("");
  ctx._cacheKeyHex = cacheKeyHex;
  const { data: cached } = await ctx.supabase.from("kb_response_cache").select("response_text, access_count, id").eq("workspace_id", ctx.payload.workspace_id).eq("cache_key", cacheKeyHex).maybeSingle();
  if (cached) {
    await ctx.supabase.from("kb_response_cache").update({
      accessed_at: (/* @__PURE__ */ new Date()).toISOString(),
      access_count: (cached.access_count || 0) + 1
    }).eq("id", cached.id);
    return {
      handled: true,
      response: cached.response_text,
      reason: "cache_hit_exact"
    };
  }
  const workspace = ctx.workspace;
  try {
    const embedding = await generateEmbedding(ctx.payload.message);
    ctx.embedding = embedding;
    const { data: similar } = await ctx.supabase.rpc("match_kb_chunks", {
      query_embedding: embedding,
      match_threshold: 0.8,
      match_count: 1,
      p_workspace_id: ctx.payload.workspace_id
    });
    if (similar && similar.length > 0 && similar[0].similarity > 0.8) {
      return {
        handled: true,
        response: similar[0].content,
        reason: "cache_hit_embedding"
      };
    }
  } catch (_6) {
  }
  return {
    handled: false
  };
}

// supabase/functions/agent-orchestrator/lib/llm.ts
var OPENCODE_ZEN_API_KEY = Deno.env.get("OPENCODE_ZEN_API_KEY");
var OPENCODE_ZEN_BASE_URL = (Deno.env.get("OPENCODE_ZEN_BASE_URL") || "https://opencode.ai/zen/v1").replace(/\/+$/, "");
var DEFAULT_FALLBACK_MESSAGE = "I'm not sure about that. Please contact us directly for more information.";
var FALLBACK_MODEL = "nemotron-3-ultra-free";
var DEFAULT_PRIMARY = "deepseek-v4-flash-free";
var REASONING_MODELS = [
  "deepseek"
];
function stripReasoning(text) {
  if (!text || text.length < 20) return text;
  const lines = text.split("\n").map((l) => l.trim());
  let start = 0;
  for (let i4 = 0; i4 < Math.min(15, lines.length); i4++) {
    const line = lines[i4];
    if (!line) continue;
    if (/^(thinking|thought|let me (think|analyze|check|consider|start|break|look|search|figure|see))/i.test(line)) {
      start = i4 + 1;
      continue;
    }
    if (/^wait,? (let me|i should|i need|i can|let's)/i.test(line)) {
      start = i4 + 1;
      continue;
    }
    if (/^\d+\.\s*\*\*[A-Z]/.test(line)) {
      start = i4 + 1;
      continue;
    }
    if (/^(today is|let me check|okay,? let|first,? let|so let)/i.test(line)) {
      start = i4 + 1;
      continue;
    }
    if (/^(\*\*)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)/i.test(line) && line.length < 60) {
      start = i4 + 1;
      continue;
    }
    if (/^[\*\-]\s*\*?[A-Z][a-z]+[^a-z]*:/i.test(line) && line.length < 80) {
      start = i4 + 1;
      continue;
    }
    break;
  }
  return lines.slice(start).join("\n").trim() || text;
}
async function callLLM(payload) {
  const modelChain = payload.model ? [
    payload.model,
    FALLBACK_MODEL
  ] : [
    DEFAULT_PRIMARY,
    FALLBACK_MODEL
  ];
  let lastError;
  for (const model2 of modelChain) {
    try {
      return await callZen({
        ...payload,
        model: model2
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("ALL_MODELS_FAILED");
}
async function callZen(payload) {
  if (!OPENCODE_ZEN_API_KEY) throw new Error("OPENCODE_ZEN_API_KEY is not set");
  let systemMsg = payload.system || "";
  const isReasoningModel = REASONING_MODELS.some((m3) => payload.model.includes(m3));
  if (isReasoningModel && systemMsg) {
    systemMsg += "\n\nIMPORTANT: Output ONLY the final response. Do NOT include any reasoning, analysis, planning, or chain-of-thought. Respond directly and conversationally.";
  }
  const body = {
    model: payload.model,
    messages: systemMsg ? [
      {
        role: "system",
        content: systemMsg
      },
      ...payload.messages
    ] : payload.messages,
    max_tokens: payload.max_tokens ?? 800,
    temperature: payload.temperature ?? 0.3,
    stream: false
  };
  if (payload.response_format) body.response_format = payload.response_format;
  if (payload.tools) body.tools = payload.tools;
  if (payload.tool_choice) body.tool_choice = payload.tool_choice;
  const doFetch = async (b3) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), payload.max_tokens && payload.max_tokens <= 100 ? 5e3 : 1e4);
    try {
      const res = await fetch(`${OPENCODE_ZEN_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENCODE_ZEN_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(b3),
        signal: controller.signal
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const errMsg = errBody.error?.message || "API error";
        const e = new Error(errMsg);
        e.status = res.status;
        e._raw = errBody;
        throw e;
      }
      return await res.json();
    } finally {
      clearTimeout(timeout);
    }
  };
  try {
    const json = await doFetch(body);
    const msg = json?.choices?.[0]?.message;
    if (msg) {
      const raw = msg.content || msg.reasoning_content || "";
      if (isReasoningModel) {
        msg.content = stripReasoning(raw);
      } else if (!msg.content || msg.content === "") {
        msg.content = msg.reasoning_content;
      }
    }
    return json;
  } catch (e) {
    if (e._raw?.error?.message?.includes("tool_choice") && body.tool_choice) {
      delete body.tool_choice;
      const json = await doFetch(body);
      const msg = json?.choices?.[0]?.message;
      if (msg) {
        const raw = msg.content || msg.reasoning_content || "";
        if (isReasoningModel) msg.content = stripReasoning(raw);
        else if (!msg.content || msg.content === "") msg.content = msg.reasoning_content;
      }
      return json;
    }
    throw e;
  }
}

// supabase/functions/agent-orchestrator/lib/template-engine.ts
function renderTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    if (key in vars) return vars[key];
    console.warn(`[TEMPLATE] Missing variable: ${key}`);
    return `{{${key}}}`;
  });
}
function collectTemplateVars(ctx) {
  const workspace = ctx.workspace || {};
  const session = ctx.session || {};
  const working = session.working_context || {};
  const profile = workspace.business_profile || {};
  const traits = ctx.session?.workspace_agents?.config?.traits || {};
  return {
    workspaceName: workspace.name || "this business",
    businessProfile: buildBusinessProfileText(ctx),
    personaInstructions: buildPersonaInstructions(traits),
    sentimentLine: working.sentiment ? `
Customer sentiment: ${working.sentiment}${working.sentiment === "frustrated" ? " \u2014 escalate if they remain frustrated." : ""}` : "",
    currentDateTime: `Today is ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    })}. Current time in India is ${(/* @__PURE__ */ new Date()).toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit"
    })} IST.`,
    agentType: ctx.agentType || "customer_support",
    businessPhone: profile.contact?.phone || "",
    businessEmail: profile.contact?.email || "",
    businessAddress: profile.contact?.address || "",
    businessDescription: profile.description || "",
    fallbackMessage: workspace.guardrail_config?.fallback_message || "I'm not sure about that. Please contact us directly for more information."
  };
}
function buildBusinessProfileText(ctx) {
  const workspace = ctx.workspace || {};
  const profile = workspace.business_profile || {};
  const parts = [];
  if (profile.description) parts.push(`About: ${profile.description}`);
  if (profile.contact?.phone) parts.push(`Phone: ${profile.contact.phone}`);
  if (profile.contact?.email) parts.push(`Email: ${profile.contact.email}`);
  if (profile.contact?.address) parts.push(`Address: ${profile.contact.address}`);
  if (profile.hours?.daily) {
    const openDays = Object.entries(profile.hours.daily).filter(([, d2]) => !d2.closed).map(([day, d2]) => `${day.charAt(0).toUpperCase() + day.slice(1)}: ${d2.open}-${d2.close}`);
    const closedDays = Object.entries(profile.hours.daily).filter(([, d2]) => d2.closed).map(([day]) => day.charAt(0).toUpperCase() + day.slice(1));
    if (openDays.length) parts.push(`Business Hours: ${openDays.join(", ")}`);
    if (closedDays.length) parts.push(`Closed on: ${closedDays.join(", ")}`);
  }
  if (profile.pricing?.description) parts.push(`Pricing: ${profile.pricing.description}`);
  if (workspace.services_offered) parts.push(`Services: ${workspace.services_offered}`);
  if (profile.amenities?.length) parts.push(`Amenities: ${profile.amenities.join(", ")}`);
  if (profile.policies) {
    const entries = Object.entries(profile.policies).filter(([, v4]) => v4);
    if (entries.length) parts.push(`Policies: ${entries.map(([k3, v4]) => `${k3}: ${v4}`).join(" | ")}`);
  }
  return parts.length > 0 ? parts.join("\n") : "No profile data yet. Call get_business_info for details.";
}
function buildPersonaInstructions(traits) {
  const constraints = [
    "- NEVER identify as an AI, bot, or automated assistant.",
    "- Talk like a human employee on WhatsApp: use short, snappy sentences.",
    '- Use natural conversational fillers sparingly (e.g., "Alright," "Got it," "Give me a sec").',
    "- Use emojis naturally to keep it friendly (\u{1F44B}, \u2728, \u{1F44D}).",
    "- Avoid formal bullet points; use plain text paragraphs or simple dashes.",
    `- If you don't know something, don't apologize like a robot. Just say "I'm not 100% sure about that, let me check with the team."`
  ];
  if (!traits) return constraints.join("\n");
  const lines = [
    ...constraints
  ];
  if (traits.tone === "friendly") lines.push("- Keep the vibe warm and super welcoming.");
  else if (traits.tone === "professional") lines.push("- Keep it polite and efficient, like a top-tier concierge.");
  else if (traits.tone === "enthusiastic") lines.push("- Be high-energy and exciting! Use more emojis.");
  if (traits.formality === "formal") lines.push("- Avoid slang. Use full sentences but keep them human.");
  else if (traits.formality === "casual") lines.push("- Use casual language, contractions (it's, don't), and a very relaxed vibe.");
  if (traits.brevity === "concise") lines.push("- Be extremely short. Get straight to the point.");
  else if (traits.brevity === "detailed") lines.push("- Provide helpful details and context when answering.");
  if (traits.proactivity === "assertive") lines.push("- Take charge of the chat. Proactively suggest the next step.");
  else if (traits.proactivity === "passive") lines.push("- Wait for the user to ask before offering more help.");
  return lines.join("\n");
}
var BOOKING_TEMPLATE = `You are the Appointment Booking Specialist for {{workspaceName}}.

## Identity
You help customers book, reschedule, check availability, or cancel appointments.
{{personaInstructions}}

## Business Profile
{{businessProfile}}

## Booking flow
- Read history. Parse all info from customer's latest message (they may give service + date + name at once).
- Collect: service, date, time, name, email. Ask only for what's STILL MISSING.
- Once you have all details (service, date, time, name), submit BOTH check AND create in your actions array (both run together; the system uses results to decide the final response):
  actions: [
    {tool: "manage_appointment", params: {action: "check", date: "...", time: "..."}},
    {tool: "manage_appointment", params: {action: "create", date: "...", time: "...", service: "...", name: "..."}}
  ]
- **CRITICAL**: Never include manage_appointment in more than one plan. One plan with both check+create is all you need.
- If already_booked: true \u2192 acknowledge and ask if they need to change/cancel.
- If customer says a name that differs from the existing appointment's name, it's a different person \u2014 create new instead of linking.
- Rescheduling \u2192 manage_contact (get) first, then manage_appointment (update).
- Cancellation \u2192 manage_contact (get) first, then manage_appointment (cancel).
- Availability \u2192 manage_appointment (check) with a date.
- One tool call per message max.

## Rules
- If customer asks about services or pricing \u2192 use get_business_info to look up what's offered.
- If customer wants support \u2192 transfer_agent to customer_support.
- If customer wants to order/buy something \u2192 transfer_agent to sales.
- Tools: manage_appointment, manage_contact, get_business_info, transfer_agent.

## Response style
- Under 80 words. WhatsApp formatting: *single asterisk* for bold, NOT double.
- Direct: state what's needed, ask for the missing info.
- Never end with "does that answer your question" or "anything else I can help with".
- State what's next. Stop.

## Appointment confirmation
- When appointment is created, the response MUST use ONLY this format:
  "Your {service} is confirmed for {day}, {date} at {time}. View details: {appointment_link}"
- STRICTLY FORBIDDEN: Including the meeting_link, Google Meet link, or any join link. NEVER mention them.

`;
var SUPPORT_TEMPLATE = `You are the Customer Support Specialist for {{workspaceName}}.

## Identity
You answer questions about the business, services, hours, and policies.
{{personaInstructions}}

## Business Profile
{{businessProfile}}

## Rules
- Answer directly from the business profile above for general questions.
- Use search_kb ONLY when the customer asks about something NOT in the business profile (specific processes, troubleshooting, detailed policies, technical documentation).
- If search_kb returns nothing \u2192 try get_business_info.
- If neither has it, say so honestly and offer to create a ticket or transfer.
- If customer wants booking or is providing booking details (service, date, time, name, phone, email) \u2192 transfer_agent to appointment_booking.
- If customer wants ordering \u2192 transfer_agent to sales.
- Tools: search_kb, manage_contact, get_business_info, transfer_agent, escalate.

## Response style
- Lead with the answer. One sentence. Then add brief context if needed.
- Under 150 words. WhatsApp formatting: *single asterisk* for bold, NOT double.
- Never end with "does that answer your question" or "anything else I can help with".
- State the answer. Stop.`;
var SALES_TEMPLATE = `You are the Sales Specialist for {{workspaceName}}.

## Identity
You help customers browse the menu, understand pricing, and place orders.
{{personaInstructions}}

## Business Profile
{{businessProfile}}

## Order taking
1. Customer asks to see menu \u2192 call manage_catalog.
2. If customer says "yes" or "place the order" after seeing items \u2192 call place_order IMMEDIATELY. Do NOT ask for their name/email/phone/address/appointment details.
3. On success, give order number and say the team will contact them for payment & delivery. Do NOT ask scheduling questions.

## Rules
- Any pricing/product/menu question \u2192 call manage_catalog FIRST. If it returns items, LIST them all \u2014 do NOT just say "let me help with that".
- If manage_catalog returns empty \u2192 try search_kb next BEFORE responding.
- If search_kb also returns nothing \u2192 answer using the business profile only. Do NOT make up services.
- Never give vague empty responses. Always list items when you have them.
- NEVER discuss payment methods. Say "the team will contact you for payment details."
- The business profile is already loaded \u2014 answer directly. Do NOT say you'll look it up.
- If customer wants support \u2192 transfer_agent to customer_support.
- If customer wants booking \u2192 transfer_agent to appointment_booking.
- CRITICAL: place_order does NOT need contact info or appointment details. Just the item name. Call it when the customer says "yes" or "place it".
- CRITICAL: Do NOT ask scheduling/appointment questions when the customer is ordering. That is a separate flow.
- Tools: manage_catalog, manage_contact, get_business_info, place_order, search_kb, transfer_agent.

## Response style
- Be direct. Short sentences. No fluff.
- Under 150 words. WhatsApp formatting: *single asterisk* for bold, NOT double.
- Never end with "does that answer your question" or "anything else I can help with".
- State the answer. Stop.`;
function resolveAgentPrompt(agentType, ctx) {
  const vars = collectTemplateVars(ctx);
  switch (agentType) {
    case "appointment_booking":
      return renderTemplate(BOOKING_TEMPLATE, vars);
    case "sales":
      return renderTemplate(SALES_TEMPLATE, vars);
    case "customer_support":
    default:
      return renderTemplate(SUPPORT_TEMPLATE, vars);
  }
}
function resolveAgentPromptWithOverrides(agentType, ctx, overrides) {
  let prompt = resolveAgentPrompt(agentType, ctx);
  if (overrides?.[agentType]) {
    const vars = collectTemplateVars(ctx);
    prompt = renderTemplate(overrides[agentType], vars);
  }
  return prompt;
}

// supabase/functions/agent-orchestrator/pipeline/t2-router.ts
var QUERY_ANALYSIS_TEMPLATE = `You are an intent classifier for {{workspaceName}}. Read the user's message and determine what they need.

Available agents:
- customer_support: Handles general business Q&A \u2014 services, hours, location, policies, support issues, account help. Answers factually from knowledge base. Also handles escalation requests (wants to speak to a human).
- appointment_booking: Manages scheduling \u2014 booking, rescheduling, cancelling, checking availability for any service. Collects details (service, date, time, name, contact info) to confirm appointments.
- sales: Handles pricing, cost inquiries, quotes, service packages, ordering/buying, lead capture. Does NOT process payments.

For each message, identify what the user wants to accomplish right now and pick the best agent. The primary agent should match the user's main need. If the user's current message starts a new topic, route to the appropriate agent for that topic regardless of conversation history.

If the message contains multiple distinct requests that need different agents, set the primary agent for the main request and list the others in sub_tasks.

Output valid JSON only, with no markdown or commentary:
{
  "agent": "customer_support" | "appointment_booking" | "sales",
  "intent": "concise description",
  "entities": { "service": "", "date": "", "time": "", "name": "", "phone": "", "email": "", "product": "" },
  "urgency": "low" | "medium" | "high",
  "wants_human": false,
  "emotional_tone": "calm" | "positive" | "frustrated" | "urgent" | "distressed",
  "sub_tasks": []
}

Example multi-intent: "I want to book a consultation and know your pricing" -> agent: "appointment_booking", sub_tasks: [{agent: "sales", intent: "check pricing"}]
Example booking follow-up: "Friday at 2pm works" with context showing booking flow -> agent: "appointment_booking"
Example cancel/rebook: User has existing booking and says "cancel it and book tomorrow 3pm" -> agent: "appointment_booking" (stays on booking for modification)
Example providing booking details: "tomorrow 3pm in person name samir" after being asked for info -> agent: "appointment_booking"
`;
function buildQueryAnalysisPrompt(vars) {
  return renderTemplate(QUERY_ANALYSIS_TEMPLATE, vars);
}
async function llmClassify(ctx, activeAgents, conversationContext) {
  const msg = ctx.payload.message;
  const agentList = activeAgents.map((a) => a.replace("_", " ")).join(", ");
  try {
    const vars = {
      workspaceName: ctx.workspace?.name || "a business"
    };
    const systemPrompt = buildQueryAnalysisPrompt(vars) + `

Active agents for this workspace: ${agentList}`;
    const messages = [];
    if (conversationContext) {
      messages.push({
        role: "user",
        content: `Previous conversation:
${conversationContext}

New message: ${msg}`
      });
    } else {
      messages.push({
        role: "user",
        content: msg
      });
    }
    const llmPayload = {
      system: systemPrompt,
      messages,
      max_tokens: 350,
      temperature: 0.2
    };
    const llmResponse = await callLLM(llmPayload);
    let raw = llmResponse.choices?.[0]?.message?.content || "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) raw = jsonMatch[0];
    const analysis = JSON.parse(raw);
    if (![
      "customer_support",
      "appointment_booking",
      "sales"
    ].includes(analysis.agent)) {
      analysis.agent = "customer_support";
    }
    if (!activeAgents.includes(analysis.agent)) {
      analysis.agent = "customer_support";
      analysis.intent = "fallback_unavailable_agent";
    }
    return analysis;
  } catch (e) {
    console.error("[T2] LLM query analysis failed:", e.message);
    return {
      agent: activeAgents.includes("customer_support") ? "customer_support" : "appointment_booking",
      intent: "fallback_classification_error",
      entities: {},
      urgency: "low",
      wants_human: false,
      emotional_tone: "calm"
    };
  }
}
async function runT2(ctx) {
  const msg = ctx.payload.message;
  const { data: activeAgentRows } = await ctx.supabase.from("workspace_agents").select("agent_type").eq("workspace_id", ctx.session.workspace_id).eq("status", "active").is("deleted_at", null);
  const activeAgents = new Set(activeAgentRows?.map((a) => a.agent_type) || []);
  if (ctx.payload.agent_type && ctx.payload.is_test) {
    ctx.agentType = ctx.payload.agent_type;
    ctx.routingReason = "explicit_test_agent";
    ctx._queryAnalysis = {
      agent: ctx.payload.agent_type,
      intent: "test_message",
      entities: {},
      urgency: "low",
      wants_human: false,
      emotional_tone: "calm"
    };
    return {
      handled: false
    };
  }
  if (ctx.payload.source === "widget") {
    ctx.agentType = "customer_support";
    ctx.routingReason = "widget_channel";
    ctx._queryAnalysis = {
      agent: "customer_support",
      intent: "widget_message",
      entities: {},
      urgency: "low",
      wants_human: false,
      emotional_tone: "calm"
    };
    return {
      handled: false
    };
  }
  let conversationContext = "";
  try {
    const { data: recent } = await ctx.supabase.from("messages").select("role, content").eq("session_id", ctx.session.id).order("created_at", {
      ascending: false
    }).limit(6);
    if (recent && recent.length > 0) {
      const lines = recent.reverse().map((m3) => `${m3.role === "agent" ? "Assistant" : "Customer"}: ${m3.content.slice(0, 200)}`);
      conversationContext = lines.join("\n");
    }
  } catch (_6) {
  }
  const workingAgent = ctx.session?.working_context?.agent_type;
  const msgLower = msg.toLowerCase();
  const bookingKeywords = /\b(book|appointment|schedule|reschedule|cancel|rebook)\b/i.test(msgLower);
  const priceKeywords = /\b(price|cost|quote|how much|buy|order|pricing|rates|prices)\b/i.test(msgLower);
  console.log(`[T2] msg="${msgLower}" bookingMatch=${bookingKeywords} priceMatch=${priceKeywords} activeBooking=${activeAgents.has("appointment_booking")} workingAgent=${workingAgent}`);
  const hasBookingIntent = bookingKeywords;
  if (hasBookingIntent && activeAgents.has("appointment_booking")) {
    console.log("[T2] KEYWORD PRE-CHECK: routing to appointment_booking");
    ctx.agentType = "appointment_booking";
    ctx.routingReason = "keyword_pre_check_booking";
    ctx._queryAnalysis = {
      agent: "appointment_booking",
      intent: "booking_request",
      entities: {},
      urgency: "low",
      wants_human: false,
      emotional_tone: "calm"
    };
    return {
      handled: false
    };
  }
  const hasSalesIntent = /\b(price|cost|quote|how much|buy|order|pricing|rates|prices|menu)\b/i.test(msgLower);
  if (hasSalesIntent && activeAgents.has("sales")) {
    ctx.agentType = "sales";
    ctx.routingReason = "keyword_pre_check_sales";
    ctx._queryAnalysis = {
      agent: "sales",
      intent: "pricing_or_order",
      entities: {},
      urgency: "low",
      wants_human: false,
      emotional_tone: "calm"
    };
    return {
      handled: false
    };
  }
  console.log(`[T2] workingAgent=${workingAgent} convCtxLen=${conversationContext?.length} hasActive=${workingAgent ? activeAgents.has(workingAgent) : "N/A"}`);
  if ((ctx.session.message_count ?? 0) > 0 && workingAgent && activeAgents.has(workingAgent) && conversationContext) {
    const isFollowUp = /^(ok|yes|yeah|sure|correct|right|that'?s? right|go ahead|please|okay|alright)/i.test(msg) || /(cancel|reschedule|reshedule|change|modify|book|schedule|appointment|consult|visit|service|design|construct|name|date|time|email|phone|contact|tomorrow|today|next|hours|this\s+(week|month))/i.test(msg);
    console.log(`[T2] followUpCheck=${isFollowUp}`);
    if (isFollowUp) {
      console.log(`[T2] WORKING CONTEXT: keeping agent ${workingAgent}`);
      ctx.agentType = workingAgent;
      ctx.routingReason = "working_context_follow_up";
      ctx._queryAnalysis = {
        agent: workingAgent,
        intent: "follow_up",
        entities: {},
        urgency: "low",
        wants_human: false,
        emotional_tone: "calm"
      };
      return {
        handled: false
      };
    }
  }
  const analysis = await llmClassify(ctx, [
    ...activeAgents
  ], conversationContext);
  if (!activeAgents.has(analysis.agent)) {
    ctx.agentType = activeAgents.has("customer_support") ? "customer_support" : [
      ...activeAgents
    ][0] || "customer_support";
    ctx.routingReason = `requested_agent_unavailable_${analysis.agent}`;
  } else {
    ctx.agentType = analysis.agent;
    ctx.routingReason = `llm_classified_${analysis.intent}`;
  }
  ctx._queryAnalysis = analysis;
  if (analysis.sub_tasks && analysis.sub_tasks.length > 0) {
    ctx._subTasks = analysis.sub_tasks;
  }
  if (analysis.wants_human) {
    ctx._wantsHuman = true;
  }
  return {
    handled: false
  };
}

// supabase/functions/agent-orchestrator/tools/impl/kb.ts
var DEFAULT_KB_CONFIG = {
  match_count: 3,
  match_threshold: 0.35,
  chunk_truncation: 800,
  noise_stripping: true
};
async function matchChunks(params, ctx) {
  if (ctx.kbSearchPromise && params.query.trim().toLowerCase() === ctx.payload.message.trim().toLowerCase()) {
    return ctx.kbSearchPromise;
  }
  let embedding;
  try {
    if (ctx.embedding && params.query.trim().toLowerCase() === ctx.payload.message.trim().toLowerCase()) {
      embedding = ctx.embedding;
    } else {
      embedding = await generateEmbedding(params.query);
    }
  } catch {
    return {
      success: true,
      chunks: [],
      kb_chunks: []
    };
  }
  const kbConfig = ctx.workspace?.kb_config || DEFAULT_KB_CONFIG;
  const matchThreshold = params.match_threshold ?? kbConfig.match_threshold ?? DEFAULT_KB_CONFIG.match_threshold;
  const { data: kb, error } = await ctx.supabase.rpc("match_kb_chunks", {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: kbConfig.match_count ?? DEFAULT_KB_CONFIG.match_count,
    p_workspace_id: ctx.payload.workspace_id,
    p_query_text: params.query
  });
  if (error) {
    console.error("[KB] match_kb_chunks RPC error:", error.message);
    return {
      success: true,
      chunks: [],
      kb_chunks: []
    };
  }
  const chunks = kb || [];
  return {
    success: true,
    chunks,
    kb_chunks: chunks
  };
}

// supabase/functions/agent-orchestrator/pipeline/t3-context.ts
async function runT3(ctx, requeryContext) {
  const agentType = ctx.agentType || "customer_support";
  const promises = [];
  if (agentType === "customer_support" || agentType === "sales") {
    const query = requeryContext?.previous_query || ctx.payload.message;
    const matchThreshold = requeryContext?.previous_empty ? 0.25 : void 0;
    promises.push(matchChunks({
      query,
      match_threshold: matchThreshold
    }, ctx).then((result) => {
      ctx._kbChunks = result?.chunks || result?.kb_chunks || result?.results || [];
    }).catch(() => {
      ctx._kbChunks = [];
    }));
  }
  if (agentType === "appointment_booking") {
    promises.push(ctx.supabase.from("appointments").select("id, start_at, service, status, customer_name").eq("session_id", ctx.session.id).not("status", "eq", "cancelled").maybeSingle().then(({ data }) => {
      if (!data) {
        ctx._existingAppointment = null;
        return;
      }
      const nameInAppt = (data.customer_name || "").toLowerCase().trim();
      const nameInSession = (ctx.payload.customer_name || ctx.session.customer_name || "").toLowerCase().trim();
      if (nameInSession && nameInAppt && nameInSession !== nameInAppt) {
        console.log(`[T3] Name mismatch: session "${nameInSession}" vs appointment "${nameInAppt}" \u2014 treating as new customer`);
        ctx._existingAppointment = null;
      } else {
        ctx._existingAppointment = data;
      }
    }).catch(() => {
      ctx._existingAppointment = null;
    }));
  }
  await Promise.all(promises);
  return {
    handled: false
  };
}

// supabase/functions/agent-orchestrator/tools/impl/google.ts
async function getGoogleConfig(supabase, workspace_id) {
  const { data: config } = await supabase.from("google_oauth_tokens").select("*").eq("workspace_id", workspace_id).is("deleted_at", null).order("created_at", {
    ascending: false
  }).limit(1).maybeSingle();
  if (!config) throw new Error("Google integration not found");
  const now = /* @__PURE__ */ new Date();
  const expiry = new Date(config.token_expiry);
  if (expiry.getTime() - now.getTime() < 5 * 60 * 1e3) {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: Deno.env.get("GOOGLE_CLIENT_ID"),
        client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET"),
        refresh_token: config.refresh_token,
        grant_type: "refresh_token"
      })
    });
    const newTokens = await response.json();
    if (!response.ok) {
      if (newTokens?.error === "invalid_grant") {
        await supabase.from("google_oauth_tokens").update({
          deleted_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("workspace_id", workspace_id);
      }
      throw new Error("Failed to refresh Google token");
    }
    const newExpiry = new Date(Date.now() + newTokens.expires_in * 1e3).toISOString();
    await supabase.from("google_oauth_tokens").update({
      access_token: newTokens.access_token,
      token_expiry: newExpiry
    }).eq("workspace_id", workspace_id);
    return {
      ...config,
      access_token: newTokens.access_token
    };
  }
  return config;
}

// supabase/functions/agent-orchestrator/tools/impl/calendar.ts
var IST_OFFSET = 5.5 * 60 * 60 * 1e3;
function parseDT(dStr, tStr) {
  const months = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11
  };
  const istNow = new Date(Date.now() + IST_OFFSET);
  let y4 = istNow.getUTCFullYear();
  let mo = istNow.getUTCMonth();
  let d2 = istNow.getUTCDate();
  if (dStr) {
    const s = dStr.toLowerCase().trim();
    if (s.includes("tomorrow") || s === "tom") {
      const t = new Date(istNow.getTime() + 864e5);
      y4 = t.getUTCFullYear();
      mo = t.getUTCMonth();
      d2 = t.getUTCDate();
    } else if (s.includes("today")) {
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const p4 = s.split("-").map(Number);
      y4 = p4[0];
      mo = p4[1] - 1;
      d2 = p4[2];
    } else {
      const dm = s.match(/(\d{1,2})(?:st|nd|rd|th)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
      const md = s.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*(\d{1,2})(?:st|nd|rd|th)?/i);
      if (dm) {
        d2 = parseInt(dm[1]);
        mo = months[dm[2].toLowerCase().slice(0, 3)];
      } else if (md) {
        mo = months[md[1].toLowerCase().slice(0, 3)];
        d2 = parseInt(md[2]);
      }
    }
  }
  let h3 = 10, mi = 0;
  if (tStr) {
    const ts = tStr.toLowerCase().trim();
    if (ts.includes("afternoon") || ts.includes("noon")) {
      h3 = 14;
      mi = 0;
    } else if (ts.includes("evening")) {
      h3 = 18;
      mi = 0;
    } else if (ts.includes("morning")) {
      h3 = 9;
      mi = 0;
    } else if (ts.includes("night")) {
      h3 = 20;
      mi = 0;
    } else {
      const mt = ts.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      if (mt) {
        h3 = parseInt(mt[1]);
        mi = mt[2] ? parseInt(mt[2]) : 0;
        const a = mt[3]?.toLowerCase();
        if (a === "pm" && h3 < 12) h3 += 12;
        if (a === "am" && h3 === 12) h3 = 0;
      }
    }
  }
  return new Date(Date.UTC(y4, mo, d2, h3, mi) - IST_OFFSET).toISOString();
}
function formatIST(isoString) {
  const d2 = new Date(isoString);
  const ist = new Date(d2.getTime() + IST_OFFSET);
  const datePart = ist.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });
  const timePart = ist.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC"
  });
  return `${datePart} at ${timePart} IST`;
}
function getDayName(dateStr) {
  const d2 = new Date(dateStr);
  return d2.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC"
  }).toLowerCase();
}
function validateBusinessHours(dateStr, ctx) {
  const hours = ctx.workspace?.business_profile?.hours?.daily;
  if (!hours) return null;
  const dayName = getDayName(dateStr);
  const daySchedule = hours[dayName];
  if (!daySchedule) return null;
  const errors = [];
  if (daySchedule.closed) {
    const openDays = Object.entries(hours).filter(([, d2]) => !d2.closed).map(([day, d2]) => `${day.charAt(0).toUpperCase() + day.slice(1)} ${d2.open}-${d2.close}`);
    errors.push(`We're closed on ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}.`);
    if (openDays.length) errors.push(`Open: ${openDays.join(", ")}.`);
    return errors.join(" ");
  }
  if (daySchedule.open && daySchedule.close) {
    const d2 = new Date(dateStr);
    const istTime = new Date(d2.getTime() + IST_OFFSET);
    const timeStr = `${String(istTime.getUTCHours()).padStart(2, "0")}:${String(istTime.getUTCMinutes()).padStart(2, "0")}`;
    if (timeStr < daySchedule.open || timeStr >= daySchedule.close) {
      errors.push(`We're closed at ${timeStr}. Our hours on ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} are ${daySchedule.open}-${daySchedule.close}.`);
    }
  }
  return errors.length ? errors.join(" ") : null;
}
function isTimeSlotBusy(startAt, durationMinutes, busyPeriods) {
  const startMs = new Date(startAt).getTime();
  const endMs = startMs + durationMinutes * 60 * 1e3;
  return busyPeriods.some((bp) => {
    const bpStart = new Date(bp.start).getTime();
    const bpEnd = new Date(bp.end).getTime();
    return startMs < bpEnd && endMs > bpStart;
  });
}
async function checkAvailability(params, ctx) {
  const startAt = parseDT(params.date, params.time);
  const hoursError = validateBusinessHours(startAt, ctx);
  if (hoursError) return {
    success: false,
    error: hoursError,
    requested_time: startAt
  };
  try {
    const gConfig = await getGoogleConfig(ctx.supabase, ctx.payload.workspace_id);
    const gRes = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gConfig.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        timeMin: startAt,
        timeMax: new Date(new Date(startAt).getTime() + 7 * 24 * 60 * 60 * 1e3).toISOString(),
        items: [
          {
            id: gConfig.calendar_id || "primary"
          }
        ]
      })
    });
    if (gRes.ok) {
      const data = await gRes.json();
      const busyPeriods = data.calendars[gConfig.calendar_id || "primary"]?.busy || [];
      const available = !isTimeSlotBusy(startAt, 30, busyPeriods);
      return {
        success: true,
        available,
        availability: busyPeriods,
        requested_time: startAt
      };
    }
  } catch (_6) {
  }
  return {
    success: true,
    available: null,
    checked: false,
    requested_time: startAt,
    note: "Calendar unavailable \u2014 could not verify availability"
  };
}
async function createAppointment(params, ctx) {
  const rawName = params.name?.toString().trim();
  const PLACEHOLDER_NAMES = [
    "your name",
    "name",
    "customer",
    "guest",
    "null",
    "none",
    "n/a",
    "unknown"
  ];
  if (!rawName || rawName.length < 2 || PLACEHOLDER_NAMES.includes(rawName.toLowerCase())) {
    return {
      error: "I need your full name to book the appointment. Please tell me your name."
    };
  }
  const customerName = rawName;
  if (!params.service?.toString().trim()) {
    return {
      error: "Service is required. Ask the customer what service they'd like to book."
    };
  }
  const { data: existingAppt } = await ctx.supabase.from("appointments").select("id, start_at, service").eq("session_id", ctx.session.id).not("status", "eq", "cancelled").maybeSingle();
  if (existingAppt) {
    return {
      id: existingAppt.id,
      start_at: existingAppt.start_at,
      service: existingAppt.service,
      customer_name: customerName,
      note: "Already booked for this session.",
      already_booked: true
    };
  }
  const startAt = parseDT(params.date, params.time);
  const hoursError = validateBusinessHours(startAt, ctx);
  if (hoursError) return {
    error: hoursError
  };
  const endAt = new Date(new Date(startAt).getTime() + 30 * 60 * 1e3).toISOString();
  const { data: slotTaken } = await ctx.supabase.from("appointments").select("id").eq("workspace_id", ctx.payload.workspace_id).eq("start_at", startAt).not("status", "eq", "cancelled").maybeSingle();
  if (slotTaken) {
    return {
      error: "That time slot has already been booked. Please suggest an alternative time."
    };
  }
  const { data: curSession } = await ctx.supabase.from("conversation_sessions").select("contact_id, customer_jid").eq("id", ctx.session.id).single();
  const jidPhone = curSession?.customer_jid?.split("@")[0] || null;
  const customerPhone = params.phone && /^\d{7,15}$/.test(params.phone.replace(/\D/g, "")) ? params.phone : jidPhone;
  const customerEmail = params.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.email) ? params.email : null;
  const { data: appt, error: insertErr } = await ctx.supabase.from("appointments").insert({
    workspace_id: ctx.payload.workspace_id,
    session_id: ctx.session.id,
    contact_id: curSession?.contact_id || null,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: customerEmail,
    service: params.service,
    start_at: startAt,
    end_at: endAt,
    status: "confirmed"
  }).select().single();
  if (insertErr || !appt) {
    return {
      error: "Failed to save appointment. Please try again."
    };
  }
  let googleEventId = null;
  let meetLink = null;
  let calendarSyncFailed = false;
  try {
    const gConfig = await getGoogleConfig(ctx.supabase, ctx.payload.workspace_id);
    const gRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${gConfig.calendar_id || "primary"}/events?conferenceDataVersion=1`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gConfig.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        summary: `${params.service || "Appointment"}: ${params.name || "Customer"}`,
        description: `Customer: ${params.name || "N/A"}
Phone: ${params.phone || "N/A"}
Email: ${params.email || "N/A"}
Service: ${params.service || "N/A"}
Session: ${ctx.session.id}`,
        start: {
          dateTime: startAt
        },
        end: {
          dateTime: endAt
        },
        conferenceData: {
          createRequest: {
            requestId: `fc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
          }
        }
      })
    });
    if (gRes.ok) {
      const gEvent = await gRes.json();
      googleEventId = gEvent.id;
      meetLink = gEvent.hangoutLink || gEvent.conferenceData?.entryPoints?.[0]?.uri || null;
      await ctx.supabase.from("appointments").update({
        google_event_id: googleEventId,
        meeting_link: meetLink
      }).eq("id", appt.id);
    } else {
      calendarSyncFailed = true;
      console.error("[CALENDAR] Google Calendar API error:", gRes.status, await gRes.text());
    }
  } catch (e) {
    calendarSyncFailed = true;
    console.error("[CALENDAR] Google Calendar sync failed:", e.message);
    if (e.message?.includes("token") || e.message?.includes("invalid_grant")) {
      try {
        const APP_URL4 = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://7flowcore.vercel.app";
        const CRON_SECRET3 = Deno.env.get("INTERNAL_CRON_SECRET") || "";
        const { data: workspace } = await ctx.supabase.from("workspaces").select("owner_id, name").eq("id", ctx.payload.workspace_id).maybeSingle();
        if (workspace?.owner_id) {
          const { data: ownerEmail } = await ctx.supabase.rpc("get_user_email", {
            user_id: workspace.owner_id
          });
          if (ownerEmail) {
            await fetch(`${APP_URL4}/api/emails/send`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${CRON_SECRET3}`
              },
              body: JSON.stringify({
                to: ownerEmail,
                subject: `Google Calendar Disconnected \u2014 ${workspace.name || "Your Workspace"}`,
                template: "welcome",
                data: {
                  workspaceName: workspace.name || "Your Workspace",
                  customerName: "System Alert",
                  customerEmail: "Your Google Calendar integration has expired. Please re-authorize in Settings > Integrations."
                }
              })
            });
          }
        }
      } catch (_6) {
      }
    }
  }
  if (params.email && curSession?.contact_id) {
    await ctx.supabase.from("contacts").update({
      email: params.email,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", curSession.contact_id);
  }
  await ctx.supabase.from("booking_sessions").update({
    appointment_id: appt.id,
    state: "booked",
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("session_id", ctx.session.id).is("deleted_at", null);
  EdgeRuntime.waitUntil(sendAppointmentNotifications(ctx, appt, meetLink));
  const updatedAppt = googleEventId ? {
    ...appt,
    google_event_id: googleEventId,
    meeting_link: meetLink
  } : appt;
  const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://7flowcore.vercel.app";
  const appointmentLink = `${appUrl}/appointment/${appt.id}`;
  return {
    ...updatedAppt,
    appointment_link: appointmentLink,
    ...calendarSyncFailed ? {
      warning: "Appointment saved but Google Calendar sync failed. A Meet link was not generated."
    } : {}
  };
}
async function sendAppointmentNotifications(ctx, appt, meetLink) {
  try {
    const contactName = ctx.contact?.name || ctx.session?.customer_name || "A customer";
    await ctx.supabase.from("notifications").insert({
      id: crypto.randomUUID(),
      workspace_id: ctx.payload.workspace_id,
      title: "New Booking",
      message: `${contactName} booked an appointment on ${ctx.payload.message?.substring(0, 100) || "the platform"}.`,
      type: "booking",
      link: "/calendar",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (e) {
    console.error("[BOOKING] Dashboard notification error:", e.message);
  }
  await Promise.allSettled([
    sendAppointmentWhatsApp(ctx, appt, meetLink),
    sendAppointmentEmail(ctx, appt, meetLink)
  ]);
}
async function sendAppointmentWhatsApp(ctx, appt, meetLink) {
  try {
    const { data: sessionData } = await ctx.supabase.from("conversation_sessions").select("customer_jid, contact:contacts(phone), gowa_session:gowa_sessions!workspace_id(gowa_session_id)").eq("id", ctx.session.id).eq("workspace_id", ctx.payload.workspace_id).single();
    if (!sessionData) return;
    const deviceId = sessionData.gowa_session?.gowa_session_id;
    if (!deviceId) return;
    let phone = appt.customer_phone;
    if (!phone || !/^\d{7,15}$/.test(phone.replace(/\D/g, ""))) {
      phone = sessionData.customer_jid?.split("@")[0] || sessionData.contact?.phone;
    }
    if (!phone) return;
    const gowaBase = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "");
    const gowaKey = Deno.env.get("GOWA_API_KEY");
    if (!gowaBase || !gowaKey) return;
    const auth = btoa(gowaKey);
    const formattedDate = formatIST(appt.start_at);
    const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://7flowcore.vercel.app";
    const appointmentLink = `${appUrl}/appointment/${appt.id}`;
    let message = `\u2705 Appointment Confirmed!

Hi ${appt.customer_name},

Your appointment has been confirmed:
\u2022 Service: ${appt.service}
\u2022 Date: ${formattedDate}

View details: ${appointmentLink}

Thank you!`;
    await fetch(`${gowaBase}/send/message`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        "X-Device-Id": deviceId
      },
      body: JSON.stringify({
        phone,
        message
      })
    });
  } catch (_6) {
  }
}
async function sendAppointmentEmail(ctx, appt, meetLink) {
  try {
    const { data: notifPref } = await ctx.supabase.from("workspace_notifications").select("email_on_booking, notification_mode").eq("workspace_id", ctx.payload.workspace_id).maybeSingle();
    if (notifPref && notifPref.email_on_booking === false) return;
    if (notifPref?.notification_mode && notifPref.notification_mode !== "instant") return;
    const { data: workspaceData } = await ctx.supabase.from("workspaces").select("name, session:conversation_sessions!workspace_id(contact:contacts(email))").eq("id", ctx.payload.workspace_id).eq("session.id", ctx.session.id).single();
    if (!workspaceData) return;
    const email = appt.customer_email || workspaceData.session?.[0]?.contact?.email;
    if (!email) return;
    const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://7flowcore.vercel.app";
    const workspaceName = workspaceData.name || "FlowCore";
    const formattedDate = formatIST(appt.start_at);
    const appointmentLink = `${appUrl}/appointment/${appt.id}`;
    const cronSecret = Deno.env.get("INTERNAL_CRON_SECRET") || "";
    await fetch(`${appUrl}/api/emails/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cronSecret}`
      },
      body: JSON.stringify({
        to: email,
        subject: `Appointment Confirmed \u2014 ${workspaceName}`,
        template: "appointment",
        data: {
          customerName: appt.customer_name,
          workspaceName,
          service: appt.service,
          date: formattedDate,
          meetLink,
          appointmentLink
        }
      })
    });
  } catch (_6) {
  }
}
async function updateAppointment(params, ctx) {
  let { data: existing } = await ctx.supabase.from("appointments").select("*").eq("id", params.appointment_id).maybeSingle();
  if (!existing) {
    const { data: all } = await ctx.supabase.from("appointments").select("*").eq("workspace_id", ctx.payload.workspace_id).gte("start_at", new Date(Date.now() - 7 * 864e5).toISOString()).order("created_at", {
      ascending: false
    });
    const match = (all || []).find((a) => a.id.toLowerCase().startsWith(params.appointment_id.toLowerCase()));
    if (!match) return {
      error: "Appointment not found."
    };
    existing = match;
  }
  const startAt = params.date || params.time ? parseDT(params.date, params.time) : existing.start_at;
  const durationMs = (params.duration || 30) * 6e4;
  const endAt = new Date(new Date(startAt).getTime() + durationMs).toISOString();
  const { data: updated } = await ctx.supabase.from("appointments").update({
    customer_name: params.name || existing.customer_name,
    service: params.service || existing.service,
    start_at: startAt,
    end_at: endAt,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", params.appointment_id).select().single();
  let syncStatus = null;
  if (existing.google_event_id) {
    try {
      const gConfig = await getGoogleConfig(ctx.supabase, ctx.payload.workspace_id);
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/${gConfig.calendar_id || "primary"}/events/${existing.google_event_id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${gConfig.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          start: {
            dateTime: startAt
          },
          end: {
            dateTime: endAt
          }
        })
      });
    } catch (e) {
      console.error(`[Calendar] Google Calendar update failed for ${existing.google_event_id}:`, e.message);
      syncStatus = "failed_sync";
      await ctx.supabase.from("appointments").update({
        sync_status: "failed_sync"
      }).eq("id", params.appointment_id);
    }
  }
  return {
    ...updated,
    sync_status: syncStatus
  };
}
async function cancelAppointment(params, ctx) {
  let { data: appt } = await ctx.supabase.from("appointments").select("*").eq("id", params.appointment_id).maybeSingle();
  if (!appt) {
    const { data: all } = await ctx.supabase.from("appointments").select("*").eq("workspace_id", ctx.payload.workspace_id).gte("start_at", new Date(Date.now() - 7 * 864e5).toISOString()).order("created_at", {
      ascending: false
    });
    const match = (all || []).find((a) => a.id.toLowerCase().startsWith(params.appointment_id.toLowerCase()));
    if (!match) return {
      error: "Appointment not found."
    };
    appt = match;
  }
  await ctx.supabase.from("appointments").update({
    status: "cancelled",
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", params.appointment_id);
  if (appt.google_event_id) {
    try {
      const gConfig = await getGoogleConfig(ctx.supabase, ctx.payload.workspace_id);
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/${gConfig.calendar_id || "primary"}/events/${appt.google_event_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${gConfig.access_token}`
        }
      });
    } catch (e) {
      console.error(`[Calendar] Google Calendar delete failed for ${appt.google_event_id}:`, e.message);
      await ctx.supabase.from("appointments").update({
        sync_status: "failed_sync"
      }).eq("id", params.appointment_id);
    }
  }
  return {
    success: true
  };
}

// supabase/functions/agent-orchestrator/tools/impl/contact.ts
async function getHistory(params, ctx) {
  const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
  let contactId = session?.contact_id;
  if (!contactId) {
    const jid = ctx.payload.customer_jid || ctx.session.customer_jid;
    const { data: found } = await ctx.supabase.from("contacts").select("id").eq("workspace_id", ctx.payload.workspace_id).or(`whatsapp_jid.eq.${jid},session_token.eq.${jid}`).maybeSingle();
    if (found) contactId = found.id;
  }
  if (!contactId) return {
    success: false,
    error: "Contact not found"
  };
  const { data: contact } = await ctx.supabase.from("contacts").select("*").eq("id", contactId).single();
  const { data: byContact } = await ctx.supabase.from("appointments").select("*").eq("contact_id", contactId).order("created_at", {
    ascending: false
  });
  const { data: bySession } = await ctx.supabase.from("appointments").select("*").eq("session_id", ctx.session.id).order("created_at", {
    ascending: false
  });
  const merged = [
    ...byContact || [],
    ...bySession || []
  ];
  const seen = /* @__PURE__ */ new Set();
  const appointments = merged.filter((a) => {
    const k3 = a.id;
    return seen.has(k3) ? false : (seen.add(k3), true);
  });
  return {
    success: true,
    data: {
      ...contact,
      appointments: appointments || []
    }
  };
}
async function update(params, ctx) {
  const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
  if (!session?.contact_id) {
    const jid = ctx.payload.customer_jid || ctx.session.customer_jid;
    const { data: found } = await ctx.supabase.from("contacts").select("id").eq("workspace_id", ctx.payload.workspace_id).or(`whatsapp_jid.eq.${jid},session_token.eq.${jid}`).maybeSingle();
    if (!found) return {
      success: false,
      error: "Contact not found"
    };
    const { data: updated2 } = await ctx.supabase.from("contacts").update({
      name: params.name,
      email: params.email,
      phone: params.phone,
      notes: params.notes ? `[Update] ${params.notes}` : void 0,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", found.id).select().single();
    return {
      success: true,
      data: updated2
    };
  }
  const { data: updated } = await ctx.supabase.from("contacts").update({
    name: params.name,
    email: params.email,
    phone: params.phone,
    notes: params.notes ? `[Update] ${params.notes}` : void 0,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", session.contact_id).select().single();
  return {
    success: true,
    data: updated
  };
}

// supabase/functions/agent-orchestrator/tools/impl/crm.ts
var APP_URL3 = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://7flowcore.vercel.app";
var CRON_SECRET2 = Deno.env.get("INTERNAL_CRON_SECRET") || "";
function potentialToScore(potential) {
  switch (potential) {
    case "high":
      return 80;
    case "intermediate":
      return 50;
    case "low":
      return 20;
    default:
      return 0;
  }
}
async function captureLead(params, ctx) {
  if (!params.name && !params.email && !params.phone) {
    return {
      success: false,
      error: "At least one of name, email, or phone is required to capture a lead."
    };
  }
  const jid = ctx.payload.customer_jid || ctx.session.customer_jid;
  const { data: existing } = await ctx.supabase.from("contacts").select("id").eq("workspace_id", ctx.payload.workspace_id).or(`whatsapp_jid.eq.${jid},session_token.eq.${jid}`).maybeSingle();
  const updateData = {
    name: params.name,
    email: params.email,
    phone: params.phone,
    notes: params.notes ? `[Lead] ${params.notes}` : void 0,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (params.potential) updateData.lead_score = potentialToScore(params.potential);
  const insertData = {
    workspace_id: ctx.payload.workspace_id,
    [ctx.payload.source === "whatsapp" ? "whatsapp_jid" : "session_token"]: jid,
    name: params.name,
    email: params.email,
    phone: params.phone,
    notes: params.notes
  };
  if (params.potential) insertData.lead_score = potentialToScore(params.potential);
  const { data: contact } = existing ? await ctx.supabase.from("contacts").update(updateData).eq("id", existing.id).select().single() : await ctx.supabase.from("contacts").insert(insertData).select().single();
  let sessionLinked = false;
  if (contact?.id) {
    const { error: linkError } = await ctx.supabase.from("conversation_sessions").update({
      contact_id: contact.id,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", ctx.session.id);
    sessionLinked = !linkError;
  }
  try {
    const gConfig = await getGoogleConfig(ctx.supabase, ctx.payload.workspace_id);
    if (gConfig?.sheet_id) {
      const sheetRange = gConfig.sheet_range ?? "Sheet1!A:Z";
      const row = [
        params.name ?? "",
        params.email ?? "",
        params.phone ?? "",
        params.potential ?? "",
        "",
        (/* @__PURE__ */ new Date()).toISOString(),
        (/* @__PURE__ */ new Date()).toISOString()
      ];
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${gConfig.sheet_id}/values/${sheetRange}:append?valueInputOption=USER_ENTERED`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gConfig.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          values: [
            row
          ]
        })
      });
    }
  } catch (_6) {
  }
  try {
    await ctx.supabase.from("notifications").insert({
      id: crypto.randomUUID(),
      workspace_id: ctx.payload.workspace_id,
      title: "New Lead Captured",
      message: `A new lead "${params.name || "Unknown"}" was captured via ${ctx.payload.source || "chat"}.`,
      type: "lead",
      link: "/contacts",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (e) {
    console.error("[LEAD] Dashboard notification error:", e.message);
  }
  try {
    const { data: notifPref } = await ctx.supabase.from("workspace_notifications").select("email_on_lead, notification_mode").eq("workspace_id", ctx.payload.workspace_id).maybeSingle();
    if (notifPref?.email_on_lead && notifPref?.notification_mode === "instant") {
      const { data: workspace } = await ctx.supabase.from("workspaces").select("owner_id, name").eq("id", ctx.payload.workspace_id).maybeSingle();
      if (workspace?.owner_id) {
        const { data: ownerEmail } = await ctx.supabase.rpc("get_user_email", {
          user_id: workspace.owner_id
        });
        if (ownerEmail) {
          await fetch(`${APP_URL3}/api/emails/send`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${CRON_SECRET2}`
            },
            body: JSON.stringify({
              to: ownerEmail,
              subject: `New Lead Captured \u2014 ${workspace.name || "Your Workspace"}`,
              template: "welcome",
              data: {
                workspaceName: workspace.name || "Your Workspace",
                customerName: params.name || "Unknown",
                customerEmail: params.email || "No email"
              }
            })
          });
        }
      }
    }
  } catch (e) {
    console.error("[CAPTURE_LEAD] Notification error:", e.message);
  }
  return {
    success: true,
    contact_id: contact?.id,
    session_linked: sessionLinked,
    ...sessionLinked ? {} : {
      warning: "Contact saved but failed to link to session"
    }
  };
}
async function updateLeadStage(params, ctx) {
  const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
  if (!session?.contact_id) return {
    error: "Contact not found"
  };
  await ctx.supabase.from("contacts").update({
    pipeline_stage: params.stage,
    notes: params.notes ? `[Stage: ${params.stage}] ${params.notes}` : void 0,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", session.contact_id);
  return {
    success: true,
    stage: params.stage
  };
}
async function getPipeline(params, ctx) {
  const stages = [
    "new",
    "contacted",
    "qualified",
    "proposal",
    "negotiation",
    "won",
    "lost"
  ];
  const { data: contacts } = await ctx.supabase.from("contacts").select("pipeline_stage, name").eq("workspace_id", ctx.payload.workspace_id).not("pipeline_stage", "is", null).in("pipeline_stage", stages);
  const counts = {};
  for (const s of stages) counts[s] = 0;
  for (const c3 of contacts || []) {
    if (c3.pipeline_stage) counts[c3.pipeline_stage] = (counts[c3.pipeline_stage] || 0) + 1;
  }
  const totalLeads = Object.values(counts).reduce((a, b3) => a + b3, 0);
  if (totalLeads === 0) {
    return {
      success: true,
      pipeline: counts,
      summary: "Your pipeline is empty. Start capturing leads to build your sales pipeline!",
      total_leads: 0
    };
  }
  const activeStages = stages.filter((s) => counts[s] > 0).map((s) => `${s}: ${counts[s]}`);
  return {
    success: true,
    pipeline: counts,
    summary: `Pipeline: ${activeStages.join(", ")}. Total: ${totalLeads} leads.`,
    total_leads: totalLeads
  };
}
async function scheduleFollowUp(params, ctx) {
  const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
  const scheduledAt = new Date(Date.now() + (params.hours || 24) * 36e5).toISOString();
  const { data: followUp } = await ctx.supabase.from("follow_ups").insert({
    workspace_id: ctx.payload.workspace_id,
    contact_id: session?.contact_id || null,
    session_id: ctx.session.id,
    scheduled_at: scheduledAt,
    message_template: params.message || "Hi! Just following up on our conversation. Let me know if you need any help!",
    status: "pending"
  }).select().single();
  return {
    success: true,
    follow_up_id: followUp?.id,
    scheduled_at: scheduledAt
  };
}

// supabase/functions/agent-orchestrator/tools/impl/order.ts
async function searchMenu(params, ctx) {
  const generic = [
    "menu",
    "services",
    "list",
    "all",
    "everything",
    "show",
    "available",
    "catalog",
    "offer",
    "have",
    "product",
    "item",
    "option",
    ""
  ];
  const q6 = params.query?.toString().toLowerCase().trim() || "";
  const words = q6.split(/\s+/).filter(Boolean);
  const isGeneric = !q6 || words.length === 0 || words.every((w6) => generic.includes(w6));
  let query = ctx.supabase.from("menu_items").select("id, name, description, price, category").eq("workspace_id", ctx.payload.workspace_id).eq("is_available", true);
  if (!isGeneric && params.query) {
    const safe = escapeLike(String(params.query));
    query = query.or(`name.ilike.%${safe}%,category.ilike.%${safe}%,description.ilike.%${safe}%`);
  }
  if (params.category) query = query.eq("category", params.category);
  const { data: items } = await query.order("name").limit(20);
  return {
    success: true,
    items: items || []
  };
}
async function sendMenuMedia(params, ctx) {
  try {
    const { data: media } = await ctx.supabase.from("menu_media").select("file_path, file_type, file_name").eq("workspace_id", ctx.payload.workspace_id).is("deleted_at", null).order("created_at", {
      ascending: false
    }).limit(1).maybeSingle();
    if (!media) {
      const searchResult = await searchMenu({
        query: "",
        category: void 0
      }, ctx);
      if (searchResult.items && searchResult.items.length > 0) {
        return {
          success: true,
          auto_fallback: true,
          items: searchResult.items,
          message: "Here are our available items:"
        };
      }
      return {
        success: true,
        message: "No menu available yet. Please contact us directly for more information."
      };
    }
    if (ctx.payload.is_test) {
      const fileUrl2 = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/menu-media/${media.file_path}`;
      return {
        success: true,
        message: "Menu sent.",
        media_info: {
          file_name: media.file_name,
          file_type: media.file_type,
          url: fileUrl2,
          type: media.file_type.startsWith("image/") ? "image" : "document"
        }
      };
    }
    const pd = await getPhoneAndDevice(ctx);
    if (!pd) return {
      success: false,
      error: "Customer phone or WhatsApp device not found"
    };
    const { phone, deviceId } = pd;
    const gowaKey = Deno.env.get("GOWA_API_KEY");
    if (!gowaKey) return {
      success: false,
      error: "WhatsApp not configured"
    };
    const gowaBase = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "");
    const auth = btoa(gowaKey);
    const fileUrl = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/menu-media/${media.file_path}`;
    const formattedPhone = formatPhoneForGoWA(phone);
    const caption = params.caption || "Here is our menu \u2014 take a look!";
    const isImage = media.file_type.startsWith("image/");
    let resp;
    if (isImage) {
      resp = await fetch(`${gowaBase}/send/image`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          "X-Device-Id": deviceId
        },
        body: JSON.stringify({
          phone: formattedPhone,
          image_url: fileUrl,
          caption
        })
      });
    } else {
      resp = await fetch(`${gowaBase}/send/message`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          "X-Device-Id": deviceId
        },
        body: JSON.stringify({
          phone: formattedPhone,
          message: `${caption}

\u{1F4C4} View Menu: ${fileUrl}`
        })
      });
    }
    if (!resp.ok) return {
      success: false,
      error: "Failed to send menu via WhatsApp"
    };
    return {
      success: true,
      message: "Menu sent to customer via WhatsApp."
    };
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
}
async function checkStock(params, ctx) {
  const name = params.product_name?.trim();
  if (!name) return {
    success: false,
    error: "product_name is required"
  };
  const safeName = escapeLike(name);
  const { data: items } = await ctx.supabase.from("menu_items").select("id, name, description, price, category, is_available, stock_count").eq("workspace_id", ctx.payload.workspace_id).or(`name.ilike.%${safeName}%,description.ilike.%${safeName}%`).order("name").limit(5);
  if (!items || items.length === 0) {
    return {
      success: true,
      found: false,
      message: `No product found matching "${name}".`
    };
  }
  const results = items.map((item) => ({
    name: item.name,
    price: item.price,
    category: item.category,
    in_stock: item.is_available,
    stock_count: item.stock_count ?? null,
    description: item.description
  }));
  const inStock = results.filter((r) => r.in_stock);
  const outOfStock = results.filter((r) => !r.in_stock);
  return {
    success: true,
    found: true,
    items: results,
    summary: inStock.length > 0 ? `${inStock.length} item(s) available${outOfStock.length > 0 ? `, ${outOfStock.length} out of stock` : ""}` : `All ${results.length} matching item(s) are currently out of stock`
  };
}
async function sendCatalog(params, ctx) {
  try {
    let query = ctx.supabase.from("menu_items").select("name, price, category, description, is_available").eq("workspace_id", ctx.payload.workspace_id).order("category").order("name");
    if (params.category) query = query.eq("category", params.category);
    const { data: items } = await query.limit(50);
    if (!items || items.length === 0) {
      const services = ctx.workspace?.services_offered;
      if (services) {
        return {
          success: true,
          message: `We don't have a product catalog, but here are our services:
${services}

Would you like to know more about any of these?`
        };
      }
      return {
        success: true,
        message: "Our catalog is being set up. In the meantime, feel free to ask about our services or contact us directly!"
      };
    }
    const grouped = {};
    for (const item of items) {
      const cat = item.category || "Other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }
    const lines = [
      "*Product Catalog*\n"
    ];
    for (const [cat, catItems] of Object.entries(grouped)) {
      lines.push(`*${cat}*`);
      for (const item of catItems) {
        const stock = item.is_available ? "" : " _(out of stock)_";
        lines.push(`  ${item.name} \u2014 \u20B9${item.price}${stock}`);
      }
      lines.push("");
    }
    lines.push(`_Total: ${items.length} products_`);
    const catalogText = lines.join("\n").trim();
    if (!ctx.payload.is_test) {
      const pd = await getPhoneAndDevice(ctx);
      if (pd && await sendGowaMessage(pd.deviceId, pd.phone, catalogText)) {
        return {
          success: true,
          message: "Catalog sent to customer via WhatsApp.",
          item_count: items.length,
          catalog_text: catalogText
        };
      }
    }
    return {
      success: true,
      catalog_text: catalogText,
      item_count: items.length
    };
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
}
function escapeLike(s) {
  return s.replace(/\\/g, "\\\\").replace(/[%_().,]/g, "\\$&");
}
function formatPhoneForGoWA(phone) {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) cleaned = "91" + cleaned;
  return cleaned;
}
async function getPhoneAndDevice(ctx) {
  const { data: sessionRow } = await ctx.supabase.from("conversation_sessions").select("customer_jid").eq("id", ctx.session.id).eq("workspace_id", ctx.payload.workspace_id).single();
  const phone = sessionRow?.customer_jid?.split("@")[0];
  if (!phone) return null;
  const { data: gs } = await ctx.supabase.from("gowa_sessions").select("gowa_session_id").eq("workspace_id", ctx.payload.workspace_id).maybeSingle();
  return gs?.gowa_session_id ? {
    phone,
    deviceId: gs.gowa_session_id
  } : null;
}
async function sendGowaMessage(deviceId, phone, message) {
  const gowaBase = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "");
  const gowaKey = Deno.env.get("GOWA_API_KEY");
  if (!gowaBase || !gowaKey || !deviceId || !phone) return false;
  try {
    const resp = await fetch(`${gowaBase}/send/message`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(gowaKey)}`,
        "Content-Type": "application/json",
        "X-Device-Id": deviceId
      },
      body: JSON.stringify({
        phone: formatPhoneForGoWA(phone),
        message
      })
    });
    return resp.ok;
  } catch {
    return false;
  }
}
async function placeOrder(params, ctx) {
  let items = params.items || [];
  if (items.length === 0 && params.item_name) items = [
    {
      name: params.item_name,
      qty: 1
    }
  ];
  if (items.length === 0) {
    return {
      success: false,
      error: "No items in the order. Ask the customer what they'd like to order."
    };
  }
  const resolved = [];
  const unknown = [];
  for (const it2 of items) {
    const name = (it2.name || "").trim();
    const qty = Math.max(1, Math.floor(Number(it2.qty) || 1));
    if (!name) continue;
    const safe = escapeLike(name);
    const { data: matches } = await ctx.supabase.from("menu_items").select("name, price, is_available").eq("workspace_id", ctx.payload.workspace_id).eq("is_available", true).ilike("name", `%${safe}%`).order("name").limit(1);
    const match = matches && matches.length > 0 ? matches[0] : null;
    if (!match || !match.price) {
      unknown.push(name);
      continue;
    }
    resolved.push({
      name: match.name,
      qty,
      price: Number(match.price)
    });
  }
  if (unknown.length > 0) {
    return {
      success: false,
      error: `These items aren't on the menu: ${unknown.join(", ")}. Ask the customer to pick from the menu.`,
      unknown_items: unknown
    };
  }
  if (resolved.length === 0) {
    return {
      success: false,
      error: "No valid items in the order. Ask the customer what they'd like to order."
    };
  }
  const subtotal = resolved.reduce((sum, it2) => sum + it2.qty * it2.price, 0);
  const total = subtotal;
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
  const { data: orderSession } = await ctx.supabase.from("conversation_sessions").select("contact_id, customer_jid").eq("id", ctx.session.id).eq("workspace_id", ctx.payload.workspace_id).single();
  const customerPhone = (orderSession?.customer_jid || ctx.payload.customer_jid || "").split("@")[0];
  const { data: order, error: insertError } = await ctx.supabase.from("orders").insert({
    workspace_id: ctx.payload.workspace_id,
    contact_id: orderSession?.contact_id || null,
    session_id: ctx.session.id,
    order_number: orderNumber,
    items: resolved,
    subtotal,
    total,
    customer_phone: customerPhone || null,
    status: "pending",
    notes: params.notes || null
  }).select().single();
  if (insertError || !order) {
    return {
      success: false,
      error: "Failed to save the order. Please try again."
    };
  }
  const itemLines = resolved.map((i4) => `\u2022 ${i4.name} \xD7 ${i4.qty} = \u20B9${(i4.qty * i4.price).toLocaleString()}`).join("\n");
  const businessName = ctx.workspace?.name || "us";
  const customerBill = `*Order ${orderNumber}*

${itemLines}

*Total: \u20B9${total.toLocaleString()}*

Thank you for your order! The team at ${businessName} will contact you shortly for payment and delivery details.`;
  const ownerNotice = `*New Order ${orderNumber}*

From: ${customerPhone || "unknown"}

${itemLines}

*Total: \u20B9${total.toLocaleString()}*${params.notes ? `

Notes: ${params.notes}` : ""}

Open the dashboard to verify payment.`;
  const pd = await getPhoneAndDevice(ctx);
  const deviceId = pd?.deviceId;
  const ownerPhone = ctx.workspace?.owner_personal_phone;
  const [billSent, ownerNotified] = await Promise.all([
    pd && customerPhone ? sendGowaMessage(pd.deviceId, customerPhone, customerBill) : Promise.resolve(false),
    deviceId && ownerPhone ? sendGowaMessage(deviceId, ownerPhone, ownerNotice) : Promise.resolve(false)
  ]);
  if (!ownerNotified && ownerPhone && ctx.workspace?.owner_id) {
    try {
      const APP_URL4 = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://7flowcore.vercel.app";
      const CRON_SECRET3 = Deno.env.get("INTERNAL_CRON_SECRET") || "";
      const { data: ownerEmail } = await ctx.supabase.rpc("get_user_email", {
        user_id: ctx.workspace.owner_id
      });
      if (ownerEmail) {
        await fetch(`${APP_URL4}/api/emails/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${CRON_SECRET3}`
          },
          body: JSON.stringify({
            to: ownerEmail,
            subject: `New Order ${orderNumber} \u2014 ${businessName}`,
            template: "welcome",
            data: {
              workspaceName: businessName,
              customerName: ctx.session?.customer_name || customerPhone || "A Customer",
              customerEmail: `New order \u20B9${total.toLocaleString()}. ${params.notes ? `Notes: ${params.notes}` : "Open the dashboard to view details."}`
            }
          })
        });
      }
    } catch (e) {
      console.error("[ORDER] Email fallback notification error:", e.message);
    }
  }
  return {
    success: true,
    order_id: order.id,
    order_number: orderNumber,
    total,
    items: resolved,
    bill_sent: billSent,
    owner_notified: ownerNotified
  };
}

// supabase/functions/agent-orchestrator/tools/impl/handoff.ts
async function requestHandoff(params, ctx) {
  if (ctx.session.working_context?.transferred) {
    return {
      success: false,
      error: "Transfer already in progress."
    };
  }
  if (!params.target_agent) {
    return {
      success: false,
      error: "target_agent is required."
    };
  }
  return {
    success: true,
    handoff_to: params.target_agent,
    handoff_reason: params.reason || "",
    handoff_context: params.context || ""
  };
}

// supabase/functions/agent-orchestrator/tools/impl/support-ticket.ts
async function createTicket(params, ctx) {
  if (!params.subject) return {
    error: "Subject is required"
  };
  const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
  const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
  const { data: ticket, error } = await ctx.supabase.from("support_tickets").insert({
    workspace_id: ctx.payload.workspace_id,
    session_id: ctx.session.id,
    contact_id: session?.contact_id || null,
    ticket_number: ticketNumber,
    subject: params.subject,
    description: params.description || "",
    priority: params.priority || "normal",
    status: "open"
  }).select().single();
  if (error) {
    console.error("[createTicket] DB insert failed:", error.message);
    return {
      error: "Failed to create support ticket. Please try again."
    };
  }
  return {
    success: true,
    ticket_id: ticket?.id,
    ticket_number: ticketNumber,
    status: "open",
    priority: params.priority || "normal"
  };
}
async function getTicketStatus(params, ctx) {
  if (!params.ticket_number && !params.ticket_id) {
    return {
      error: "ticket_number or ticket_id is required"
    };
  }
  let query = ctx.supabase.from("support_tickets").select("ticket_number, subject, status, priority, resolution_notes, created_at, updated_at").eq("workspace_id", ctx.payload.workspace_id);
  if (params.ticket_number) {
    query = query.eq("ticket_number", params.ticket_number);
  } else if (params.ticket_id) {
    query = query.eq("id", params.ticket_id);
  }
  const { data: ticket, error } = await query.single();
  if (error || !ticket) {
    return {
      error: "Ticket not found or access denied."
    };
  }
  return ticket;
}

// supabase/functions/agent-orchestrator/tools/impl/business-profile.ts
async function getBusinessProfile(params, ctx) {
  const { data: workspace, error } = await ctx.supabase.from("workspaces").select("business_profile").eq("id", ctx.payload.workspace_id).maybeSingle();
  if (error) {
    console.error("[BusinessProfile] Query error:", error.message);
    return {
      business_profile: null,
      success: false,
      error: "Failed to load profile"
    };
  }
  const profile = workspace?.business_profile;
  if (!profile) {
    return {
      business_profile: null,
      success: true
    };
  }
  if (params.sections && params.sections.length > 0) {
    const filtered = {};
    for (const section of params.sections) {
      if (profile[section] !== void 0) {
        filtered[section] = profile[section];
      }
    }
    return {
      business_profile: filtered,
      success: true
    };
  }
  return {
    business_profile: profile,
    success: true
  };
}

// supabase/functions/agent-orchestrator/tools/executor.ts
var PER_TOOL_TIMEOUTS = {
  search_kb: 3e3,
  manage_contact: 5e3,
  get_business_info: 5e3,
  manage_appointment: 1e4,
  manage_catalog: 8e3,
  place_order: 12e3,
  transfer_agent: 5e3,
  escalate: 1e4
};
var TOOL_RATE_LIMITS = {
  manage_appointment: 5,
  search_kb: 10,
  manage_catalog: 10,
  manage_contact: 10,
  get_business_info: 10,
  place_order: 5,
  escalate: 3,
  transfer_agent: 5
};
var countCache = /* @__PURE__ */ new WeakMap();
function stripPII(args) {
  const str = JSON.stringify(args);
  const cleaned = str.replace(/[\w.-]+@[\w.-]+\.\w+/g, "[REDACTED]").replace(/\b\d{10,}\b/g, "[REDACTED]");
  try {
    return JSON.parse(cleaned);
  } catch {
    return args;
  }
}
function normalizeToolName(name) {
  return name.replace(/^(functions\.|tool_calls\[|tools\.)/, "");
}
var toolExecutor = {
  async run(toolName, params, ctx) {
    toolName = normalizeToolName(toolName);
    const startTime = Date.now();
    if (toolName === "manage_appointment" && params.action === "create") {
      if (ctx._appointmentCreated) {
        return {
          success: true,
          already_booked: true,
          note: "Appointment already created in this session."
        };
      }
    }
    if (toolName === "place_order") {
      if (ctx._orderPlaced) {
        return {
          success: true,
          already_placed: true,
          note: "Order already placed in this session."
        };
      }
      ctx._orderPlaced = true;
    }
    if (toolName === "transfer_agent" && ctx.payload.source === "widget") {
      return {
        error: "Transfers are not available through the web widget."
      };
    }
    if (toolName === "transfer_agent") {
      if (ctx._transferAgentCalled) {
        return {
          success: true,
          handoff_to: params.target_agent,
          note: "Already transferred in this session."
        };
      }
      ctx._transferAgentCalled = true;
    }
    const limit = TOOL_RATE_LIMITS[toolName] ?? 20;
    if (limit > 0) {
      let counts = countCache.get(ctx);
      if (!counts) {
        const { data } = await ctx.supabase.from("tool_call_logs").select("tool_name").eq("session_id", ctx.session.id).gte("created_at", new Date(Date.now() - 36e5).toISOString());
        counts = {};
        data?.forEach((row) => {
          counts[row.tool_name] = (counts[row.tool_name] || 0) + 1;
        });
        countCache.set(ctx, counts);
      }
      const count = counts[toolName] || 0;
      if (count >= limit) {
        return {
          success: false,
          error: `Rate limit exceeded for ${toolName} (max ${limit}/hour)`
        };
      }
    }
    const timeout = PER_TOOL_TIMEOUTS[toolName] ?? 1e4;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    let result;
    try {
      result = await Promise.race([
        routeToImpl(toolName, params, ctx),
        new Promise((_6, reject) => {
          const t = setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout);
          controller.signal.addEventListener("abort", () => {
            clearTimeout(t);
            reject(new Error(`Timeout after ${timeout}ms`));
          });
        })
      ]);
    } catch (error) {
      console.error(`[ToolExecutor] ${toolName} error:`, error.message);
      result = {
        success: false,
        error: error.message || "Tool execution failed"
      };
    } finally {
      clearTimeout(timer);
    }
    const durationMs = Date.now() - startTime;
    if (ctx.payload.is_test) {
      if (!ctx._toolCalls) ctx._toolCalls = [];
      ctx._toolCalls.push({
        tool: toolName,
        params,
        success: !result.error,
        result: result.error ? result.error : result,
        duration_ms: durationMs
      });
    }
    if (!ctx._toolCallBuffer) ctx._toolCallBuffer = [];
    ctx._toolCallBuffer.push({
      session_id: ctx.session.id,
      workspace_id: ctx.payload.workspace_id,
      tool_name: toolName,
      args: stripPII(params),
      result: result?.data || result,
      error: result?.error,
      success: !result?.error,
      duration_ms: durationMs
    });
    if (!ctx._toolFailCounts) ctx._toolFailCounts = {};
    ctx._toolFailCounts[toolName] = (ctx._toolFailCounts[toolName] || 0) + (result?.error ? 1 : 0);
    if (toolName === "manage_appointment" && params.action === "create" && !result?.error) {
      ctx._appointmentCreated = true;
    }
    return result;
  },
  async flushToolCalls(ctx) {
    if (!ctx._toolCallBuffer || ctx._toolCallBuffer.length === 0) return;
    const buffer = ctx._toolCallBuffer;
    ctx._toolCallBuffer = [];
    try {
      await ctx.supabase.from("tool_call_logs").insert(buffer);
    } catch (e) {
      console.error("[ToolExecutor] Flush failed:", e.message);
    }
  }
};
async function routeToImpl(toolName, params, ctx) {
  const action = params.action || "";
  switch (toolName) {
    case "search_kb":
      return matchChunks({
        query: params.query
      }, ctx);
    case "manage_appointment": {
      switch (action) {
        case "check":
          return checkAvailability({
            date: params.date,
            time: params.time
          }, ctx);
        case "create":
          return createAppointment(params, ctx);
        case "update":
          return updateAppointment(params, ctx);
        case "cancel":
          return cancelAppointment(params, ctx);
        default:
          return {
            success: false,
            error: `Unknown manage_appointment action: ${action}`
          };
      }
    }
    case "manage_contact": {
      switch (action) {
        case "get":
          return getHistory(params, ctx);
        case "update":
          return update(params, ctx);
        case "capture-lead":
          return captureLead(params, ctx);
        case "update-stage":
          return updateLeadStage(params, ctx);
        case "get-pipeline":
          return getPipeline(params, ctx);
        case "schedule-follow-up":
          return scheduleFollowUp(params, ctx);
        default:
          return {
            success: false,
            error: `Unknown manage_contact action: ${action}`
          };
      }
    }
    case "manage_catalog": {
      const catalogAction = action || (params.query ? "search" : params.caption ? "send-media" : "");
      switch (catalogAction) {
        case "search":
          return searchMenu(params, ctx);
        case "list":
        case "get_all":
          return searchMenu({
            query: "",
            category: void 0
          }, ctx);
        case "check-stock":
          return checkStock({
            product_name: params.query || params.product_name || ""
          }, ctx);
        case "send-catalog":
          return sendCatalog(params, ctx);
        case "send-media":
          return sendMenuMedia(params, ctx);
        default:
          return {
            success: false,
            error: `Unknown manage_catalog action: ${action || "(empty)"}`
          };
      }
    }
    case "get_business_info":
      return getBusinessProfile({
        sections: params.sections
      }, ctx);
    case "place_order":
      return placeOrder(params, ctx);
    case "transfer_agent":
      return requestHandoff(params, ctx);
    case "escalate": {
      switch (action) {
        case "create":
          return createTicket(params, ctx);
        case "status":
          return getTicketStatus(params, ctx);
        default:
          return {
            success: false,
            error: `Unknown escalate action: ${action}`
          };
      }
    }
    default:
      return {
        success: false,
        error: `Unknown tool: ${toolName}`
      };
  }
}

// supabase/functions/agent-orchestrator/tools/registry.ts
var AGENT_TOOLS = {
  customer_support: [
    "search_kb",
    "manage_contact",
    "get_business_info",
    "transfer_agent",
    "escalate"
  ],
  appointment_booking: [
    "manage_appointment",
    "manage_contact",
    "get_business_info",
    "transfer_agent",
    "escalate"
  ],
  sales: [
    "manage_catalog",
    "manage_contact",
    "get_business_info",
    "place_order",
    "search_kb",
    "transfer_agent"
  ]
};
var SUBMIT_PLAN_TOOL = {
  type: "function",
  function: {
    name: "submit_plan",
    description: "Submit your final plan with response text and any tool actions needed.",
    parameters: {
      type: "object",
      properties: {
        response: {
          type: "string",
          description: "Natural language response to the user."
        },
        actions: {
          type: "array",
          description: "List of tools to execute. Each action you claim to perform must have a corresponding tool call here.",
          items: {
            type: "object",
            properties: {
              tool: {
                type: "string",
                description: "Name of the tool to call."
              },
              params: {
                type: "object",
                description: "Arguments for the tool.",
                additionalProperties: true
              },
              required: {
                type: "boolean",
                description: "If true, failure halts the response."
              },
              result_key: {
                type: "string",
                description: "Key to store the result for templating."
              }
            },
            required: [
              "tool",
              "params"
            ],
            additionalProperties: false
          }
        },
        fallback: {
          type: "string",
          description: "Fallback message if tools fail."
        }
      },
      required: [
        "response",
        "actions"
      ],
      additionalProperties: false
    }
  }
};

// supabase/functions/agent-orchestrator/agents/booking.ts
function buildBookingSystemPrompt(ctx) {
  const overrides = ctx.workspace?.agent_templates;
  return resolveAgentPromptWithOverrides("appointment_booking", ctx, overrides);
}

// supabase/functions/agent-orchestrator/agents/support.ts
function buildSupportSystemPrompt(ctx) {
  const overrides = ctx.workspace?.agent_templates;
  return resolveAgentPromptWithOverrides("customer_support", ctx, overrides);
}

// supabase/functions/agent-orchestrator/agents/sales.ts
function buildSalesSystemPrompt(ctx) {
  const overrides = ctx.workspace?.agent_templates;
  return resolveAgentPromptWithOverrides("sales", ctx, overrides);
}

// supabase/functions/agent-orchestrator/lib/session.ts
async function getOrCreateSession(supabase, { workspace_id, customer_jid, channel, agent_type, customer_name }) {
  const VALID_AGENT_TYPES = [
    "customer_support",
    "appointment_booking",
    "sales"
  ];
  const AGENT_TYPE_ALIASES = {
    "booking": "appointment_booking",
    "book": "appointment_booking"
  };
  const dbAgentType = AGENT_TYPE_ALIASES[agent_type] || agent_type;
  agent_type = VALID_AGENT_TYPES.includes(dbAgentType) ? dbAgentType : "customer_support";
  const ALLOWED_CHANNELS = [
    "whatsapp",
    "widget",
    "api",
    "test"
  ];
  const dbChannel = ALLOWED_CHANNELS.includes(channel) ? channel : "widget";
  let { data: session } = await supabase.from("conversation_sessions").select("*, workspaces(name, is_ai_enabled, credits_balance, owner_personal_phone, owner_id, low_credits_notified, welcome_template, guardrail_config, kb_config, services_offered, description, business_profile, website_url, business_type, review_url)").eq("workspace_id", workspace_id).eq("customer_jid", customer_jid).eq("status", "active").is("deleted_at", null).order("created_at", {
    ascending: false
  }).limit(1).maybeSingle();
  if (!session) {
    const { data: escalatedSession } = await supabase.from("conversation_sessions").select("*, workspaces(name, is_ai_enabled, credits_balance, owner_personal_phone, owner_id, low_credits_notified, welcome_template, guardrail_config, kb_config, services_offered, description, business_profile, website_url, business_type, review_url)").eq("workspace_id", workspace_id).eq("customer_jid", customer_jid).eq("status", "escalated").is("deleted_at", null).order("created_at", {
      ascending: false
    }).limit(1).maybeSingle();
    if (escalatedSession) {
      session = escalatedSession;
    }
  }
  if (!session) {
    const { data: contact } = await supabase.from("contacts").select("id").eq("workspace_id", workspace_id).eq(channel === "whatsapp" ? "whatsapp_jid" : "session_token", customer_jid).is("deleted_at", null).maybeSingle();
    let contact_id = contact?.id;
    if (!contact_id) {
      const { data: newContact, error: contactError } = await supabase.from("contacts").insert({
        workspace_id,
        [channel === "whatsapp" ? "whatsapp_jid" : "session_token"]: customer_jid,
        channel: dbChannel,
        name: customer_name || null,
        phone: channel === "whatsapp" ? customer_jid.split("@")[0] : null
      }).select("id").single();
      if (contactError || !newContact) {
        const { data: fallbackContact } = await supabase.from("contacts").select("id").eq("workspace_id", workspace_id).eq("phone", channel === "whatsapp" ? customer_jid.split("@")[0] : null).is("deleted_at", null).maybeSingle();
        if (fallbackContact) {
          contact_id = fallbackContact.id;
        } else {
          const { data: emergencyContact } = await supabase.from("contacts").insert({
            workspace_id,
            whatsapp_jid: customer_jid,
            channel: dbChannel,
            name: customer_name || null,
            phone: channel === "whatsapp" ? customer_jid.split("@")[0] : null
          }).select("id").maybeSingle();
          contact_id = emergencyContact?.id || crypto.randomUUID();
        }
      } else {
        contact_id = newContact.id;
      }
    }
    const { data: newSession, error: createError } = await supabase.from("conversation_sessions").insert({
      workspace_id,
      contact_id,
      channel: dbChannel,
      customer_jid,
      agent_type,
      status: "active",
      failed_attempts: 0,
      message_count: 0,
      working_context: {
        intent: null,
        collected_data: {},
        customer_name: null,
        pending_action: null,
        agent_type: agent_type || "customer_support",
        handoff_count: 0,
        sentiment: null
      }
    }).select("*, workspaces(name, is_ai_enabled, credits_balance, owner_personal_phone, owner_id, low_credits_notified, welcome_template, guardrail_config, kb_config, services_offered, description, business_profile, website_url, business_type, review_url)").single();
    if (createError) throw createError;
    session = newSession;
  }
  if (!session.working_context) {
    session.working_context = {
      intent: null,
      collected_data: {},
      customer_name: null,
      pending_action: null,
      agent_type: session.agent_type || "customer_support",
      handoff_count: 0,
      sentiment: null
    };
  }
  return session;
}
async function touchSession(ctx, agentType, finalResponse, tokensUsed = 0) {
  const wc = ctx.session.working_context;
  const newMessageCount = (ctx.session.message_count ?? 0) + 1;
  const updateData = {
    agent_type: agentType,
    last_message_at: (/* @__PURE__ */ new Date()).toISOString(),
    last_message_preview: finalResponse.substring(0, 100),
    message_count: newMessageCount,
    total_tokens_used: (ctx.session.total_tokens_used || 0) + tokensUsed,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  let wcChanged = false;
  const newWc = {
    ...wc || {}
  };
  if (agentType === "appointment_booking" && (!newWc.intent || newWc.intent !== "booking")) {
    newWc.intent = "booking";
    newWc.pending_action = "collect_email";
    wcChanged = true;
  } else if (agentType !== (wc?.agent_type || "customer_support") && agentType !== "appointment_booking") {
    newWc.intent = null;
    newWc.pending_action = null;
    wcChanged = true;
  }
  if (ctx._sentiment && ctx._sentiment !== (wc?.sentiment || null)) {
    newWc.sentiment = ctx._sentiment;
    wcChanged = true;
  }
  if (wcChanged) {
    newWc.agent_type = agentType;
    updateData.working_context = newWc;
  }
  await ctx.supabase.from("conversation_sessions").update(updateData).eq("id", ctx.session.id);
  ctx.session.message_count = newMessageCount;
}

// supabase/functions/agent-orchestrator/lib/sanitize.ts
var SYSTEM_PROMPT_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directions|rules|prompts)/gi,
  /you\s+are\s+(now|actually|really)\s+/gi,
  /system\s+(message|prompt|instruction):/gi,
  /reset\s+(your\s+)?(instructions|config|configuration)/gi,
  /new\s+(system\s+)?(prompt|instruction):/gi,
  /disregard\s+(all\s+)?(previous|prior)/gi
];
function sanitizeUserInput(input) {
  let sanitized = input;
  for (const pattern of SYSTEM_PROMPT_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[content removed]");
  }
  return sanitized.trim();
}
var HTML_TAG_PATTERN = /<[^>]*>/g;
var JSON_ARTIFACT_PATTERN = /\s*\{[^}]*"(?:caption|image_url|phone|message)"[^}]*\}\s*/g;
function sanitizeLlmOutput(output) {
  if (!output) return output;
  let clean = output.replace(HTML_TAG_PATTERN, "");
  clean = clean.replace(JSON_ARTIFACT_PATTERN, "");
  clean = clean.replace(/\s+,?\s*$/, "").trim();
  clean = clean.replace(/\bfor([a-z]+)\b/gi, (m3, s) => {
    const prefix = m3.slice(0, -s.length);
    return prefix + " " + s;
  });
  return clean;
}
function stripToolCallJson(response) {
  const TOOL_CALL_PATTERN = /^\s*(\{[^}]*"(?:tool|function|name|action|arguments|params)"[^}]*\})\s*$/s;
  return response.replace(TOOL_CALL_PATTERN, "").trim();
}
function cleanFinalResponse(response) {
  if (!response) return response;
  let clean = stripToolCallJson(response);
  if (clean !== response) response = clean;
  const SHORT_TOOL_JSON = /^\s*(?:\{[^}]{0,200}\})\s*$/s;
  if (SHORT_TOOL_JSON.test(response.trim())) {
    return "";
  }
  return response.trim();
}

// supabase/functions/agent-orchestrator/pipeline/t3-planner.ts
var AGENT_SYSTEM_PROMPTS = {
  customer_support: buildSupportSystemPrompt,
  appointment_booking: buildBookingSystemPrompt,
  sales: buildSalesSystemPrompt
};
var MAX_CONSECUTIVE_TOOL_FAILURES = 3;
async function runT32(ctx) {
  const t3Start = Date.now();
  let agentType = ctx.agentType || "customer_support";
  console.log(`[T3-PLANNER] agentType=${agentType} ctx.agentType=${ctx.agentType} routingReason=${ctx.routingReason}`);
  const { data: agent } = await ctx.supabase.from("workspace_agents").select("*").eq("workspace_id", ctx.session.workspace_id).eq("agent_type", agentType).maybeSingle();
  if (agent) {
    ctx.session.workspace_agents = agent;
  }
  if (ctx.session?.status === "escalated") {
    const handoffResult = await toolExecutor.run("transfer_agent", {
      target_agent: "customer_support",
      reason: "escalation"
    }, ctx);
    const response = handoffResult?.response ?? "I completely understand why this is frustrating. I am escalating your profile to our management team right now so they can resolve this.";
    await ctx.supabase.from("conversation_sessions").update({
      agent_type: "customer_support",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", ctx.session.id);
    ctx.agentType = "customer_support";
    await postProcess(ctx, null, null, response, "customer_support");
    return {
      handled: true,
      response,
      reason: "t3_escalation_handoff"
    };
  }
  const { data: latestMsg } = await ctx.supabase.from("messages").select("id, created_at, gowa_message_id").eq("session_id", ctx.session.id).eq("direction", "inbound").order("created_at", {
    ascending: false
  }).limit(1).maybeSingle();
  const isStale = latestMsg && latestMsg.gowa_message_id !== ctx.payload.gowa_message_id && new Date(latestMsg.created_at).getTime() > (ctx.payload.timestamp || 0) + 2e3;
  if (isStale) {
    const fallback = ctx.workspace?.guardrail_config?.fallback_message ?? "I'm not sure about that. Please contact us directly for more information.";
    return {
      handled: true,
      response: fallback,
      reason: "t3_stale_message"
    };
  }
  const buildPrompt = AGENT_SYSTEM_PROMPTS[agentType] || AGENT_SYSTEM_PROMPTS.customer_support;
  let systemPrompt = buildPrompt(ctx);
  try {
    const agentId = agent?.id;
    if (agentId) {
      const { data: assignments } = await ctx.supabase.from("agent_skill_assignments").select("skill_id").eq("agent_id", agentId);
      if (assignments && assignments.length > 0) {
        const skillIds = assignments.map((a) => a.skill_id);
        const { data: skills } = await ctx.supabase.from("agent_skills").select("name, description, condition, instructions").in("id", skillIds).eq("is_active", true);
        if (skills && skills.length > 0) {
          const blocks = skills.map((s) => {
            let block = `## ${s.name}`;
            if (s.description) block += `
${s.description}`;
            if (s.condition) block += `
Trigger: ${s.condition}`;
            block += `
${s.instructions}`;
            return block;
          });
          systemPrompt += "\n\n" + blocks.join("\n\n");
        }
      }
    }
  } catch (e) {
    console.error("[T3] Skills injection failed:", e.message);
  }
  if (ctx.pricingBlocked) {
    systemPrompt += "\n\n[SECURITY] Pricing information is restricted for this workspace. Do NOT provide specific prices. Instead, refer the customer to the official website or offer to connect them with a human.";
  }
  systemPrompt += `

## Current Date/Time
Today is ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  })}. Current time in India is ${(/* @__PURE__ */ new Date()).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit"
  })} IST. Use this to calculate relative dates like "tomorrow", "next week", "today" correctly.`;
  if (agentType === "appointment_booking" && ctx._existingAppointment) {
    const existingAppt = ctx._existingAppointment;
    const apptDate = new Date(existingAppt.start_at);
    const now = /* @__PURE__ */ new Date();
    const diffDays = Math.floor((apptDate.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24));
    let temporalHint;
    if (diffDays < -1) {
      temporalHint = `This appointment was ${Math.abs(diffDays)} days ago (PAST).`;
    } else if (diffDays === -1) {
      temporalHint = "This appointment was yesterday (PAST).";
    } else if (diffDays === 0) {
      temporalHint = "This appointment is TODAY.";
    } else if (diffDays === 1) {
      temporalHint = "This appointment is TOMORROW.";
    } else {
      temporalHint = `This appointment is in ${diffDays} days (FUTURE).`;
    }
    systemPrompt += `

## IMPORTANT: Existing Appointment Detected
This customer already has a confirmed appointment:
- ID: ${existingAppt.id}
- Service: ${existingAppt.service}
- Date/Time: ${existingAppt.start_at}
- Status: ${existingAppt.status}
- Relative: ${temporalHint}

CRITICAL: Use the RELATIVE timing above to decide what to say. If the appointment is PAST, do NOT say "tomorrow" or "coming up" \u2014 acknowledge it was scheduled and ask if they want to reschedule. If it's today/tomorrow, confirm the upcoming booking.

Do NOT attempt to create another appointment. Instead:
1. Inform the customer about their existing booking
2. Ask if they need to reschedule, cancel, or have questions
3. Use the appointment ID for any updates or cancellations`;
  }
  if (ctx._kbChunks && ctx._kbChunks.length > 0) {
    const kbText = ctx._kbChunks.map((c3) => c3.content || c3.text || "").filter(Boolean).join("\n\n").slice(0, 1500);
    if (kbText) {
      systemPrompt += `

## Knowledge Base Context
The following information was found in your knowledge base. Use it to answer the customer if relevant:
${kbText}`;
    }
  }
  if (ctx._subTasks && ctx._subTasks.length > 0) {
    const otherTasks = ctx._subTasks.filter((s) => s.agent !== agentType);
    if (otherTasks.length > 0) {
      systemPrompt += `

## Other Requests to Handle
This customer also asked about:
${otherTasks.map((t) => `- ${t.intent} (handled by ${t.agent})`).join("\n")}
Address their primary request first. If relevant, briefly acknowledge you've noted the other requests too.`;
    }
  }
  if (ctx._retryHint) {
    systemPrompt += `

## Quality Note
${ctx._retryHint}`;
  }
  systemPrompt += buildToolDescriptions(agentType, ctx.payload.source);
  const messages = await buildMessages(ctx);
  let parsedPlan;
  let llmResponse;
  let lastError;
  let needsPass2 = false;
  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const llmOpts = {
        agentType,
        max_tokens: 800,
        temperature: 0.3,
        system: systemPrompt,
        messages,
        tools: [
          SUBMIT_PLAN_TOOL
        ]
      };
      if (attempt < 1) {
        llmOpts.tool_choice = {
          type: "function",
          function: {
            name: "submit_plan"
          }
        };
      }
      llmResponse = await callLLM(llmOpts);
      const toolCall = llmResponse.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall && toolCall.function.name === "submit_plan") {
        parsedPlan = JSON.parse(toolCall.function.arguments);
        lastError = null;
        break;
      }
      if (toolCall) {
        parsedPlan = {
          response: "",
          actions: [
            {
              tool: toolCall.function.name,
              params: JSON.parse(toolCall.function.arguments || "{}")
            }
          ]
        };
        needsPass2 = true;
        lastError = null;
        break;
      }
      const msg0 = llmResponse.choices?.[0]?.message;
      const content = (msg0?.content || msg0?.reasoning_content || "").trim();
      if (content && content.length > 0) {
        parsedPlan = {
          response: content,
          actions: []
        };
        lastError = null;
        break;
      }
      throw new Error("LLM did not call submit_plan");
    } catch (e) {
      lastError = e;
      console.error(`[T3] Plan attempt ${attempt + 1} error:`, e.message);
      if (attempt < 1) {
        await new Promise((res) => setTimeout(res, 1e3 + Math.random() * 1e3));
      }
    }
  }
  if (lastError) {
    console.error("[T3] All plan attempts failed. Attempting bare-text fallback LLM call.");
    try {
      const fallbackResponse = await callLLM({
        model: FALLBACK_MODEL,
        system: `You are a helpful assistant for ${ctx.workspace?.name || "this business"}. Be brief, natural, and helpful.`,
        messages: [
          {
            role: "user",
            content: ctx.payload.message
          }
        ],
        max_tokens: 200,
        temperature: 0.5
      });
      const text = (fallbackResponse?.choices?.[0]?.message?.content || "").trim();
      if (text) {
        return {
          handled: true,
          response: text,
          reason: "t3_plan_execute"
        };
      }
    } catch (e2) {
      console.error("[T3] Bare-text fallback also failed:", e2.message);
    }
    return {
      handled: true,
      response: ctx.workspace?.guardrail_config?.fallback_message ?? DEFAULT_FALLBACK_MESSAGE,
      reason: "t3_plan_error"
    };
  }
  try {
    await ctx.supabase.from("agent_traces").insert({
      session_id: ctx.session.id,
      workspace_id: ctx.payload.workspace_id,
      trace_id: crypto.randomUUID(),
      model_used: llmResponse?.model || FALLBACK_MODEL,
      tokens_used: llmResponse?.usage?.total_tokens || 0,
      intent_detected: ctx.agentType || agentType,
      message_length: ctx.payload.message.length,
      response_length: parsedPlan.response.length,
      latency_ms: Date.now() - t3Start
    });
  } catch (e) {
    console.error("[T3] Failed to insert agent_trace:", e.message);
  }
  let finalResponse = parsedPlan.response;
  let toolResults = [];
  if (parsedPlan.actions.length > 0) {
    ctx._toolFailCounts = {};
    toolResults = await Promise.allSettled(parsedPlan.actions.map((action) => toolExecutor.run(action.tool, action.params, ctx)));
    for (let i4 = 0; i4 < toolResults.length; i4++) {
      const r = toolResults[i4];
      if (r.status === "rejected") {
        needsPass2 = true;
      } else if (r.value?.error) {
        needsPass2 = true;
      }
    }
    const forcePass2Tools = [
      "manage_appointment",
      "escalate"
    ];
    const hasForcePass2 = parsedPlan.actions.some((a) => forcePass2Tools.includes(a.tool));
    if (hasForcePass2) needsPass2 = true;
    const requiredFailed = parsedPlan.actions.some((action, i4) => action.required && toolResults[i4].status === "rejected");
    if (requiredFailed) {
      finalResponse = (parsedPlan.fallback || "").replace(/\{[^}]+\}/g, "");
      needsPass2 = false;
    }
    if (ctx._toolFailCounts) {
      for (const [, failCount] of Object.entries(ctx._toolFailCounts)) {
        if (failCount >= MAX_CONSECUTIVE_TOOL_FAILURES) {
          console.warn(`[T3] Tool failed ${failCount} consecutive times \u2014 circuit open`);
          needsPass2 = true;
          break;
        }
      }
    }
  }
  if (parsedPlan.actions.length > 0) {
    await toolExecutor.flushToolCalls(ctx);
  }
  if (toolResults.length > 0) {
    const catalogHasItems = parsedPlan.actions.some((a) => a.tool === "manage_catalog" && a.params?.action === "search") && toolResults.some((r) => r.status === "fulfilled" && r.value?.items?.length > 0);
    if (needsPass2 && !catalogHasItems) {
      try {
        const pass2System = buildPass2System(ctx, agentType);
        const toolContext = buildToolContext(parsedPlan.actions, toolResults);
        const toolCalls = llmResponse?.choices?.[0]?.message?.tool_calls;
        if (toolCalls && toolCalls.length > 0) {
          const secondPassResponse = await callLLM({
            agentType,
            max_tokens: 600,
            temperature: 0.3,
            system: pass2System,
            messages: [
              ...messages,
              {
                role: "assistant",
                content: "",
                tool_calls: toolCalls
              },
              {
                role: "tool",
                tool_call_id: toolCalls[0].id,
                content: toolContext
              }
            ]
          });
          finalResponse = secondPassResponse.choices?.[0]?.message?.content || parsedPlan.fallback || "";
        }
      } catch (e) {
        console.error("[T3] Second pass error:", e.message);
      }
    }
  }
  for (let i4 = 0; i4 < parsedPlan.actions.length; i4++) {
    const action = parsedPlan.actions[i4];
    const result = toolResults[i4];
    if (result?.status === "fulfilled" && result.value?.handoff_to) {
      return await handleHandoff(ctx, result.value.handoff_to, result.value.handoff_context || "");
    }
  }
  finalResponse = finalResponse.replace(/\{[^}]+\}/g, "").replace(/\[Correction:[^\]]*\]/gi, "").trim();
  finalResponse = cleanFinalResponse(finalResponse);
  if (!finalResponse || finalResponse.trim().length === 0) {
    finalResponse = parsedPlan.fallback || ctx.workspace?.guardrail_config?.fallback_message || "Thank you for your message. How else can I help you?";
  }
  const sentimentMatch = finalResponse.match(/^\[SENTIMENT:\s*(\w+)\]\s*/i);
  if (sentimentMatch) {
    ctx._sentiment = sentimentMatch[1].toLowerCase();
    finalResponse = finalResponse.slice(sentimentMatch[0].length).trim();
  }
  await postProcess(ctx, llmResponse, parsedPlan, finalResponse, agentType);
  return {
    handled: true,
    response: finalResponse,
    reason: "t3_plan_execute"
  };
}
async function buildMessages(ctx) {
  const historyCount = ctx.workspace?.kb_config?.message_history_count ?? 6;
  const { data: msgHistory } = await ctx.supabase.from("messages").select("role, content, created_at").eq("session_id", ctx.session.id).order("created_at", {
    ascending: false
  }).limit(historyCount);
  const history = (msgHistory || []).reverse();
  const messages = [];
  for (const m3 of history) {
    messages.push({
      role: m3.role === "agent" ? "assistant" : "user",
      content: m3.content
    });
  }
  const lastMsg = history[history.length - 1];
  if (!lastMsg || lastMsg.content !== ctx.payload.message || lastMsg.role !== "user") {
    messages.push({
      role: "user",
      content: ctx.payload.message
    });
  }
  return messages;
}
var PASS2_TEMPLATE = `You are a {{agentType}} assistant for {{workspaceName}}.
You already called tools and results are below.

CRITICAL: Your response is the FINAL message to the customer. Be brief and direct. 2-3 sentences only.

Slot taken? \u2192 "That time is taken. Would you like [nearby_time_1] or [nearby_time_2] instead?"
Booked? \u2192 "Your [service] is confirmed for [date] at [time]. Details: [link]"
Unreachable calendar? \u2192 "Our booking system is offline. Please leave your name/phone/email and we'll follow up."
Closed? \u2192 "We're closed then. Our hours are [hours]. Please pick another time."
- manage_catalog: If items are returned (non-empty array), LIST them in your response grouped by category with prices. Do NOT just say "let me show you" \u2014 actually show the items.
- Other tools: "error" field means it failed. "success: false" means it failed. Otherwise assume success.{{hoursInfo}}

Write ONLY the customer-facing message. Under 150 words. Use single *asterisks* for emphasis (not double).`;
function buildPass2System(ctx, agentType) {
  const workspace = ctx.workspace || {};
  const profile = workspace?.business_profile || {};
  const hours = profile.hours?.daily;
  let hoursInfo = "";
  if (hours) {
    const openDays = Object.entries(hours).filter(([, d2]) => !d2.closed).map(([day, d2]) => `${day.charAt(0).toUpperCase() + day.slice(1)} ${d2.open}-${d2.close}`).join(", ");
    if (openDays) hoursInfo = `
Business hours: ${openDays}.`;
  }
  const vars = {
    agentType: agentType.replace("_", " "),
    workspaceName: workspace.name || "a business",
    hoursInfo
  };
  return renderTemplate(PASS2_TEMPLATE, vars);
}
function buildToolContext(actions, results) {
  return actions.map((a, i4) => {
    const r = results[i4];
    const status = r.status === "fulfilled" ? "SUCCESS" : "FAILED";
    const data = r.status === "fulfilled" ? JSON.stringify(r.value) : r.reason?.message;
    return `[${a.tool}] ${status}: ${data}`;
  }).join("\n");
}
async function handleHandoff(ctx, targetAgent, context) {
  if (ctx.payload.source === "widget") {
    return {
      handled: true,
      response: "I'm sorry, transfers are not available through the web widget. Please reach out via WhatsApp for specialized assistance.",
      reason: "widget_handoff_blocked"
    };
  }
  const depth = (ctx.handoffDepth ?? 0) + 1;
  if (depth > 2) {
    const fallbackResponse = "I've reached the limit for transferring between specialists. A human agent will follow up with you shortly.";
    await ctx.supabase.from("conversation_sessions").update({
      last_message_at: (/* @__PURE__ */ new Date()).toISOString(),
      last_message_preview: fallbackResponse.substring(0, 100),
      message_count: (ctx.session.message_count || 0) + 1
    }).eq("id", ctx.session.id);
    return {
      handled: true,
      response: fallbackResponse,
      reason: "handoff_depth_limit"
    };
  }
  await ctx.supabase.from("conversation_sessions").update({
    agent_type: targetAgent,
    working_context: {
      ...ctx.session.working_context || {},
      transferred: true
    },
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", ctx.session.id);
  ctx.agentType = targetAgent;
  ctx.routingReason = "handoff_execution";
  ctx.handoffDepth = depth;
  return await runT32(ctx);
}
async function postProcess(ctx, llmResponse, plan, finalResponse, agentType, skipCredits = false) {
  if (!ctx.payload.is_test && !skipCredits) {
    try {
      await ctx.supabase.rpc("decrement_credits", {
        p_workspace_id: ctx.payload.workspace_id,
        p_credits: 1
      });
    } catch (e) {
      console.error("[CREDITS] decrement_credits RPC failed:", e?.message || e);
    }
  }
  await toolExecutor.flushToolCalls(ctx);
  const usage = llmResponse?.usage?.total_tokens || 0;
  await touchSession(ctx, agentType, finalResponse, usage);
}
function buildToolDescriptions(agentType, source) {
  const allowed = AGENT_TOOLS[agentType] || AGENT_TOOLS.customer_support;
  const filtered = source === "widget" ? allowed.filter((n3) => n3 !== "transfer_agent") : allowed;
  return `

## Allowed Tools
${filtered.map((n3) => `- ${n3}`).join("\n")}`;
}

// supabase/functions/agent-orchestrator/pipeline/t4-reflection.ts
var EMPTY_RESPONSE_PATTERNS = [
  /\bI'?m\s+not\s+(sure|certain|confident|able)\b/i,
  /\bI\s+don'?t\s+(know|have|understand)\b/i,
  /\bI\s+cannot\s+(help|assist|answer)\b/i,
  /\bI\s+apologize\b/i,
  /\bsorry,\s+I\s+(can'?t|cannot|don'?t)\b/i,
  /\bplease\s+contact\s+(us|the\s+business|them)\s+directly\b/i
];
var JSON_TOOL_CALL_PATTERN = /^\s*\{\s*"(?:tool|function|name|action|arguments|params)"\s*:/i;
async function runT5(ctx, response, agentType) {
  const msg = ctx.payload.message;
  const fallbackMsg = ctx.workspace?.guardrail_config?.fallback_message ?? "I'm not sure about that. Please contact us directly for more information.";
  const isEmpty = !response || response.trim().length < 15;
  const isGeneric = EMPTY_RESPONSE_PATTERNS.some((p4) => p4.test(response));
  const isToolCallJson = JSON_TOOL_CALL_PATTERN.test(response.trim());
  if (isEmpty) {
    console.warn(`[T5] Empty response (len=${(response || "").length}) for agent ${agentType}`);
    return {
      response: fallbackMsg,
      reason: "t5_empty",
      retry_hint: "Generate a complete, direct response. Do not apologize or say you're not sure."
    };
  }
  if (isToolCallJson) {
    console.warn(`[T5] Raw JSON tool call in response for agent ${agentType}: "${response.slice(0, 80)}..."`);
    return {
      response: fallbackMsg,
      reason: "t5_json_tool_call",
      retry_hint: "Output a natural-language response to the customer, not a JSON tool call. Write conversationally."
    };
  }
  if (isGeneric && ctx._queryAnalysis) {
    console.warn(`[T5] Generic response for ${ctx._queryAnalysis.intent}: "${response.slice(0, 60)}..."`);
    return {
      response: fallbackMsg,
      reason: "t5_generic",
      retry_hint: `Be specific and helpful about: ${ctx._queryAnalysis.intent}. Answer directly from your knowledge.`
    };
  }
  return {
    response,
    reason: "t5_passed"
  };
}

// supabase/functions/agent-orchestrator/lib/dispatch.ts
async function sendPresence(gowaBase, auth, deviceId, phone, type) {
  try {
    const ac = new AbortController();
    setTimeout(() => ac.abort(), 5e3);
    await fetch(`${gowaBase}/send/presence`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        "X-Device-Id": deviceId
      },
      body: JSON.stringify({
        phone,
        type
      }),
      signal: ac.signal
    });
  } catch (_6) {
  }
}
async function dispatch(ctx, response) {
  if (!response) return;
  const phone = ctx.payload.customer_phone;
  const source = ctx.payload.source || "whatsapp";
  if (ctx.payload.is_test) {
    const parts2 = response.length > 1e3 ? splitAtSentence(response, 1e3) : [
      response
    ];
    for (const part of parts2) {
      await storeOutboundMessage(ctx, part);
    }
    await ctx.supabase.from("conversation_sessions").update({
      last_message_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", ctx.session.id);
    return;
  }
  const gowaBase = Deno.env.get("GOWA_BASE_URL")?.replace(/\/$/, "");
  const gowaKey = Deno.env.get("GOWA_API_KEY");
  let deviceId = "";
  if (source === "whatsapp" && gowaBase && gowaKey) {
    const { data: gowaSession } = await ctx.supabase.from("gowa_sessions").select("gowa_session_id").eq("workspace_id", ctx.payload.workspace_id).eq("status", "connected").maybeSingle();
    deviceId = gowaSession?.gowa_session_id || "";
  }
  const auth = gowaKey ? btoa(gowaKey) : "";
  const parts = response.length > 1e3 ? splitAtSentence(response, 1e3) : [
    response
  ];
  for (const part of parts) {
    await storeOutboundMessage(ctx, part);
    if (source === "whatsapp" && deviceId && phone) {
      await sendPresence(gowaBase, auth, deviceId, phone, "available");
      const delayMs = Math.min(part.length * 12, 1500);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await sendPresence(gowaBase, auth, deviceId, phone, "unavailable");
    }
    if (source === "whatsapp" && deviceId && phone) {
      const formatted = part.replace(/\*\*(.+?)\*\*/g, "*$1*");
      await sendWithRetry(ctx, gowaBase, phone, formatted, auth, deviceId);
      if (parts.length > 1) await new Promise((res) => setTimeout(res, 500));
    }
  }
  await ctx.supabase.from("conversation_sessions").update({
    last_message_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", ctx.session.id);
}
async function sendWithRetry(ctx, gowaBase, phone, text, auth, deviceId, attempt = 1) {
  const backoffs = [
    0,
    1e3,
    2e3,
    4e3
  ];
  if (attempt > 1) await new Promise((res) => setTimeout(res, backoffs[attempt - 1]));
  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), 1e4);
  try {
    const res = await fetch(`${gowaBase}/send/message`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        "X-Device-Id": deviceId
      },
      body: JSON.stringify({
        phone,
        message: text
      }),
      signal: ac.signal
    });
    if (!res.ok && attempt < 3) {
      return sendWithRetry(ctx, gowaBase, phone, text, auth, deviceId, attempt + 1);
    } else if (!res.ok) {
      await saveFailedMessage(ctx, phone, text, `GoWA ${res.status}`);
    }
  } catch (_6) {
    if (attempt < 3) {
      return sendWithRetry(ctx, gowaBase, phone, text, auth, deviceId, attempt + 1);
    }
    await saveFailedMessage(ctx, phone, text, "GoWA timeout");
  } finally {
    clearTimeout(timeout);
  }
}
function splitAtSentence(text, maxLen) {
  if (text.length <= maxLen) return [
    text
  ];
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [
    text
  ];
  const parts = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > maxLen && current) {
      parts.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}
async function storeOutboundMessage(ctx, response) {
  await ctx.supabase.from("messages").insert({
    workspace_id: ctx.payload.workspace_id,
    session_id: ctx.session.id,
    content: response,
    direction: "outbound",
    role: "agent",
    agent_type: ctx.agentType || "customer_support",
    is_test: ctx.payload.is_test || false
  });
}
async function saveFailedMessage(ctx, phone, text, reason) {
  try {
    await ctx.supabase.from("failed_messages").insert({
      workspace_id: ctx.payload.workspace_id,
      session_id: ctx.session.id,
      raw_message: text,
      failure_reason: reason,
      retry_count: 3,
      resolved: false
    });
  } catch (_6) {
  }
}

// supabase/functions/agent-orchestrator/index.ts
var responseHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff"
};
function timingSafeEqual(a, b3) {
  if (a.length !== b3.length) return false;
  let result = 0;
  for (let i4 = 0; i4 < a.length; i4++) {
    result |= a.charCodeAt(i4) ^ b3.charCodeAt(i4);
  }
  return result === 0;
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", {
    status: 204
  });
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const serviceKey = Deno.env.get("SERVICE_KEY") || "";
  const internalSecret = Deno.env.get("INTERNAL_CRON_SECRET") || "";
  if (!token) {
    return new Response(JSON.stringify({
      error: "Unauthorized"
    }), {
      status: 401,
      headers: responseHeaders
    });
  }
  const isServiceRole = timingSafeEqual(token, serviceRoleKey) || serviceKey && timingSafeEqual(token, serviceKey);
  const isInternal = internalSecret && timingSafeEqual(token, internalSecret);
  if (!isServiceRole && !isInternal) {
    // Tier 3 removed: anon key no longer accepted — only service_role, SERVICE_KEY,
    // INTERNAL_CRON_SECRET, or a valid user JWT can invoke this function.
    const fallbackClient = ye2(Deno.env.get("SUPABASE_URL") ?? "", serviceRoleKey);
    const { data: { user }, error: authError } = await fallbackClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({
        error: "Unauthorized"
      }), {
        status: 401,
        headers: responseHeaders
      });
    }
  }
  let payload = null;
  try {
    payload = await parseWebhook(req);
    if (!payload) return new Response("ok", {
      status: 200
    });
    const result = await processMessage(payload);
    if (payload.is_test) {
      const toolCalls = (result[1]._toolCalls || []).map((tc) => ({
        tool: tc.tool,
        params: tc.params,
        success: tc.success,
        result: tc.result,
        duration_ms: tc.duration_ms
      }));
      return new Response(JSON.stringify({
        ...result[0],
        agent_type: result[1].agentType || "customer_support",
        tool_calls: toolCalls
      }), {
        status: 200,
        headers: responseHeaders
      });
    }
    return new Response("ok", {
      status: 200
    });
  } catch (e) {
    console.error("[ORCHESTRATOR] Top-level error:", e.message, e?.stack);
    if (payload?.is_test) {
      return new Response(JSON.stringify({
        error: e.message,
        stack: e.stack
      }), {
        status: 200,
        headers: responseHeaders
      });
    }
    return new Response(JSON.stringify({
      error: "Internal error"
    }), {
      status: 500,
      headers: responseHeaders
    });
  }
});
async function processMessage(payload) {
  const supabase = ye2(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  try {
    const session = await getOrCreateSession(supabase, {
      workspace_id: payload.workspace_id,
      customer_jid: payload.customer_jid,
      channel: payload.source,
      agent_type: payload.agent_type || "customer_support",
      customer_name: payload.customer_name
    });
    const ctx = {
      supabase,
      session,
      payload
    };
    ctx.workspace = session.workspaces;
    ctx.payload.message = sanitizeUserInput(ctx.payload.message || "");
    const t0 = await runT0(ctx);
    if (t0.handled) {
      t0.response = sanitizeLlmOutput(t0.response || "");
      await touchSession(ctx, "customer_support", t0.response);
      await dispatch(ctx, t0.response);
      return [
        t0,
        ctx
      ];
    }
    const t1 = await runT1(ctx);
    if (t1.handled) {
      t1.response = sanitizeLlmOutput(t1.response || "");
      await touchSession(ctx, "customer_support", t1.response);
      await dispatch(ctx, t1.response);
      return [
        t1,
        ctx
      ];
    }
    await runT2(ctx);
    await runT3(ctx);
    const kbWasEmpty = ctx._kbChunks?.length === 0;
    const t4 = await runT32(ctx);
    let finalResponse = sanitizeLlmOutput(t4.response || "");
    const t5 = await runT5(ctx, finalResponse, ctx.agentType || "customer_support");
    if (t5.reason !== "t5_passed") {
      ctx._retryHint = t5.retry_hint || "Be specific and helpful. Answer directly from your knowledge.";
      const retryPromise = (async () => {
        if (kbWasEmpty && (ctx.agentType === "customer_support" || ctx.agentType === "sales")) {
          ctx._kbChunks = [];
          await runT3(ctx, {
            previous_empty: true,
            previous_query: ctx.payload.message
          });
        }
        const t4Retry = await runT32(ctx);
        const t5Retry = await runT5(ctx, sanitizeLlmOutput(t4Retry.response || ""), ctx.agentType || "customer_support");
        return { response: sanitizeLlmOutput(t4Retry.response || ""), reason: t5Retry.reason, responseRaw: t5Retry.response };
      })();
      const timeoutMs = ctx._timeoutPerMessage || 15000;
      const result = await Promise.race([
        retryPromise,
        new Promise<{ response: string; reason: string; responseRaw: string }>((_, reject) =>
          setTimeout(() => reject(new Error(`T5 retry timeout after ${timeoutMs}ms`)), timeoutMs)
        )
      ]).catch(e => {
        console.error("[PIPELINE] T5 retry timed out — using initial response:", e?.message || e);
        return null;
      });
      if (result) {
        finalResponse = result.response;
        t5.reason = result.reason;
        t5.response = result.responseRaw;
      }
    }
    finalResponse = cleanFinalResponse(t5.response);
    if (!finalResponse) finalResponse = DEFAULT_FALLBACK_MESSAGE;
    await dispatch(ctx, finalResponse);
    const userMsg = ctx.payload.message?.trim() || "";
    const isFarewell = /^(?:thanks\b|thank you\b|bye\b|goodbye\b|see you\b|talk later\b|that'?s all\b|that is all\b|that'?s it\b|im done\b|i'?m done\b|all good\b|ok bye\b|okay bye\b|thanks bye\b|thanks a lot\b)/i.test(userMsg);
    if (!ctx._reviewSent && ctx.workspace?.review_url && !ctx._wantsHuman) {
      const hasMeaningfulWork = ctx._appointmentCreated || ctx._orderPlaced || (ctx.session.message_count ?? 0) > 2;
      if (hasMeaningfulWork && isFarewell) {
        ctx._reviewSent = true;
        await dispatch(ctx, `We'd love your feedback! Please leave us a quick review: ${ctx.workspace.review_url}`);
      }
    }
    if (ctx._cacheKeyHex && finalResponse && finalResponse.length < 2e3) {
      try {
        await supabase.from("kb_response_cache").upsert({
          workspace_id: payload.workspace_id,
          cache_key: ctx._cacheKeyHex,
          response_text: finalResponse,
          access_count: 1,
          accessed_at: (/* @__PURE__ */ new Date()).toISOString()
        }, {
          onConflict: "workspace_id, cache_key"
        });
      } catch (_6) {
      }
    }
    return [
      {
        handled: true,
        response: finalResponse,
        reason: t5?.reason || "completed"
      },
      ctx
    ];
  } catch (e) {
    console.error("[ORCHESTRATOR] CRASH in processMessage:", e.message);
    console.error("[ORCHESTRATOR] Stack:", e.stack);
    try {
      await supabase.from("debug_logs").insert({
        level: "error",
        scope: "agent-orchestrator",
        message: e.message,
        metadata: {
          stack: e.stack,
          workspace_id: payload.workspace_id,
          agent_type: payload.agent_type
        }
      });
    } catch (dbErr) {
      console.error("[ORCHESTRATOR] Failed to log crash to DB:", dbErr?.message || String(dbErr));
    }
    if (payload.is_test) {
      return [
        {
          handled: true,
          response: `[CRASH] ${e.message}`,
          reason: "crash"
        },
        {
          supabase,
          session: {},
          payload
        }
      ];
    }
    return [
      {
        handled: true,
        response: DEFAULT_FALLBACK_MESSAGE,
        reason: "crash"
      },
      {
        supabase,
        session: {},
        payload
      }
    ];
  }
}
async function parseWebhook(req) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
  if (contentLength > 1e6) return null;
  const body = await req.json();
  if (!body.workspace_id) return null;
  body.message = body.message ?? "";
  body.message_type = body.message_type ?? "text";
  const isWhatsApp = body.channel === "whatsapp" || body.source === "whatsapp";
  const stableJid = isWhatsApp ? body.customer_jid || `${body.customer_phone || ""}@s.whatsapp.net` : body.customer_jid || (() => {
    const ws = body.workspace_id?.substring(0, 8) || "unknown";
    const sid = body.client_session_id || crypto.randomUUID();
    return `widget_${ws}_${sid}`;
  })();
  return {
    workspace_id: body.workspace_id,
    customer_jid: stableJid,
    customer_phone: body.customer_jid?.split("@")[0] || "",
    customer_name: body.customer_name || null,
    message: body.message,
    message_type: body.message_type || "text",
    gowa_message_id: body.gowa_message_id || null,
    timestamp: body.timestamp || Date.now(),
    source: body.channel || body.source || "whatsapp",
    is_test: body.is_test || req.headers.get("x-is-test") === "true" || false,
    agent_type: body.agent_type || void 0
  };
}
