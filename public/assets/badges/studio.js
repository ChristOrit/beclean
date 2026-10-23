/* ══════════════════════════════════════════════════════════════
   Studio badges BeClean — application
   Coque « Atelier de nuit » + moteur de badge CR80 v3 (inchangé).
   Données : /api/badges (cookie HMAC). Démo : ?demo=1
   ══════════════════════════════════════════════════════════════ */
"use strict";

var API = "/api/badges";
var SCENE = "/assets/badges/scene.jpg";
var LOGO = "/assets/badges/logo-disc.png";
var MM = 96 / 25.4;
var CARD_W = 54 * MM;
var K_DR = "bc_studio_draft_v3";

/* — Code 128 (set B) : 106 motifs × 11 modules — */
var C128P = "11011001100110011011001100110011010010011000100100011001000100110010011001000100110001001000110010011001001000110010001001100010010010110011100100110111001001100111010111001100100111011001001110011011001110010110010111001100100111011011100100110011101001110110111011101001100111001011001110010011011101100100111001101001110011001011011011000110110001101100011011010100011000100010110001000100011010110001000100011010001000110001011010001000110001010001100010001010110111000101100011101000110111010111011000101110001101000111011011101110110110100011101100010111011011101000110111000101101110111011101011000111010001101110001011011101101000111011000101110001101011101111010110010000101111000101010100110000101000011001001011000010010000110100001011001000010011010110010000101100001001001101000010011000010100001101001000011001011000010010110010100001111011101011000010100100011110101010011110010010111100100100111101011110010010011110100100111100101111010010011110010100111100100101101101111011011110110111101101101010111100010100011110100010111101011110100010111100010111101010001111010001010111011110101111011101110101111011110101110110100001001101001000011010011100";
var STOP128 = "11000111010" + "11";
function pat(v) { return C128P.substr(v * 11, 11); }
function c128Bits(text) {
  var vals = [104], i, k;
  for (i = 0; i < text.length; i++) {
    var c = text.charCodeAt(i) - 32;
    if (c >= 0 && c <= 94) vals.push(c);
  }
  if (vals.length === 1) return "";
  var cs = 104;
  for (k = 1; k < vals.length; k++) cs += vals[k] * k;
  vals.push(cs % 103);
  var bits = "";
  for (k = 0; k < vals.length; k++) bits += pat(vals[k]);
  return bits + STOP128;
}
function c128SVG(bits) {
  if (!bits) return "";
  var runs = [], i = 0;
  while (i < bits.length) {
    var j = i; while (j < bits.length && bits[j] === bits[i]) j++;
    runs.push({ w: j - i, d: bits[i] === "1" }); i = j;
  }
  var x = 0, r = "";
  for (var q = 0; q < runs.length; q++) {
    if (runs[q].d) r += '<rect x="' + x + '" y="0" width="' + runs[q].w + '" height="26"/>';
    x += runs[q].w;
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + bits.length + ' 26" ' +
    'preserveAspectRatio="none" fill="#0e3550" shape-rendering="crispEdges">' + r + "</svg>";
}

/* — QR (qrcode-generator, chargé avant ce fichier).
   La métrique d'élection du masque a été alignée sur l'ISO 18004
   (cf. patch dans qrcode.js) pour reproduire exactement la matrice
   du générateur Python qui a produit la carte validée.            */
(function bridgeQRMetric() {
  if (typeof window === "undefined" || !window.QRUtil || !QRUtil.getLostPoint) return;
  QRUtil.getLostPoint = function (q) {
    var n = q.getModuleCount(), P = 0, i, j, m = [];
    for (i = 0; i < n; i++) { m.push(new Array(n)); for (j = 0; j < n; j++) m[i][j] = q.isDark(i, j); }
    function runs(v) {
      var length = 1, prev = v[0], t;
      for (t = 1; t < n; t++) {
        if (v[t] === prev) length++;
        else { if (length >= 5) P += length - 2; length = 1; prev = v[t]; }
      }
      if (length >= 5) P += length - 2;
    }
    /* N1 : runs ≥ 5 en ligne et colonne (longueur − 2) */
    for (i = 0; i < n; i++) {
      runs(m[i]);
      var col = new Array(n), t2;
      for (t2 = 0; t2 < n; t2++) col[t2] = m[t2][i];
      runs(col);
    }
    /* N2 : carrés 2×2 uniformes */
    for (i = 0; i < n - 1; i++) for (j = 0; j < n - 1; j++) {
      if (m[i][j] === m[i][j + 1] && m[i][j + 1] === m[i + 1][j] && m[i + 1][j] === m[i + 1][j + 1]) P += 3;
    }
    /* N3 : 1011101 encadrée de 4 modules clairs (les 2 orientations) */
    for (i = 0; i < n; i++) for (j = 0; j + 10 < n; j++) {
      if (!m[i][j + 1] && m[i][j + 4] && !m[i][j + 5] && m[i][j + 6] && !m[i][j + 9] &&
        ((m[i][j] && m[i][j + 2] && m[i][j + 3] && !m[i][j + 7] && !m[i][j + 8] && !m[i][j + 10]) ||
          (!m[i][j] && !m[i][j + 2] && !m[i][j + 3] && m[i][j + 7] && m[i][j + 8] && m[i][j + 10]))) P += 40;
      if (!m[j + 1][i] && m[j + 4][i] && !m[j + 5][i] && m[j + 6][i] && !m[j + 9][i] &&
        ((m[j][i] && m[j + 2][i] && m[j + 3][i] && !m[j + 7][i] && !m[j + 8][i] && !m[j + 10][i]) ||
          (!m[j][i] && !m[j + 2][i] && !m[j + 3][i] && m[j + 7][i] && m[j + 8][i] && m[j + 10][i]))) P += 40;
    }
    /* N4 : densité de noir */
    var darks = 0;
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (m[i][j]) darks++;
    P += Math.floor(Math.abs(darks / (n * n) * 100 - 50) / 5) * 10;
    return P;
  };
})();

function qrSVG(text) {
  try {
    var qr = qrcode(0, "M"); qr.addData(text); qr.make();
    var n = qr.getModuleCount(), c = 8, out = "", x, y;
    for (y = 0; y < n; y++) for (x = 0; x < n; x++)
      if (qr.isDark(y, x)) out += '<rect x="' + (x * c) + '" y="' + (y * c) + '" width="' + c + '" height="' + c + '"/>';
    var d = n * c;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + d + " " + d + '" shape-rendering="crispEdges">' +
      '<rect width="100%" height="100%" fill="#fff"/><g fill="#0e3550">' + out + "</g></svg>";
  } catch (e) { return ""; }
}

/* ────────────── état ────────────── */
var DEF_CO = {
  nom: "BECLEAN", sous: "& MULTISERVICES", act: "PAYSAGISTE · COTONOU",
  standard: "01 67 59 23 19", adresse: "Jéricho, Cotonou", ifu: "IFU 0201910724958",
  site: "https://beclean-benin.vercel.app/",
  slogan: "« Du rêve à la réalité, en toute harmonie. »",
  serv1: "Conception 3D · Création de jardins", serv2: "Rénovation · Entretien · Traitement"
};

var DEMO = [
  { id: "d1", prenom: "Dona", nom: "KPONOU", role: "AGENT PAYSAGISTE", matricule: "BC-26-001",
    whatsapp: "+229 01 99 91 20 80", photo: null, zoom: 100, oy: 38, ordre: 0 },
  { id: "d2", prenom: "Christy-Ange", nom: "ORITCHACHEOUN", role: "AGENT TERRAIN", matricule: "BC-26-002",
    whatsapp: "+229 01 97 12 44 08", photo: null, zoom: 100, oy: 38, ordre: 1 },
  { id: "d3", prenom: "Grâce", nom: "ADJOVI", role: "AGENTE D'ENTRETIEN", matricule: "BC-26-003",
    whatsapp: "+229 01 96 30 77 12", photo: null, zoom: 100, oy: 38, ordre: 2 },
  { id: "d4", prenom: "Roger", nom: "GBAGUIDI", role: "RESPONSABLE D'ÉQUIPE", matricule: "BC-26-004",
    whatsapp: "+229 01 95 44 21 63", photo: null, zoom: 100, oy: 38, ordre: 3 },
  { id: "d5", prenom: "Mireille", nom: "HOUNKPATIN", role: "CHARGÉE CLIENTÈLE", matricule: "BC-26-005",
    whatsapp: "+229 01 94 08 55 20", photo: null, zoom: 100, oy: 38, ordre: 4 },
  { id: "d6", prenom: "Arnaud", nom: "DOSSOU", role: "AGENT PAYSAGISTE", matricule: "",
    whatsapp: "+229 01 93 77 09 41", photo: null, zoom: 100, oy: 38, ordre: 5 }
];

var ARGS = new URLSearchParams(location.search);
var ISDEMO = ARGS.get("demo") === "1";
var members = [];
var comp = Object.assign({}, DEF_CO);
var draft = null;
var dirty = false;
var started = false;
var wallFilter = "all";
var stageT = null, toastT = null, printT = null, coT = null, fitT = null;

/* ────────────── outils ────────────── */
function $(s) { return document.querySelector(s); }
function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function esc(s) {
  return (s == null ? "" : String(s)).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function fold(s) {
  return String(s == null ? "" : s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function pad2(n) { return String(n).padStart(2, "0"); }
function clampNum(v, lo, hi, dflt) {
  var n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
}
function fullName(m) {
  return [m && m.prenom, m && m.nom].filter(Boolean).join(" ").trim();
}
function pretty(s) {
  return String(s || "").toLocaleLowerCase("fr")
    .replace(/(^|[\s\-–—/'’])(\p{L})/gu, function (m, a, b) {
      return a + b.toLocaleUpperCase("fr");
    });
}
function initials(m) {
  var a = (m && m.prenom || "").trim().charAt(0);
  var b = (m && m.nom || "").trim().charAt(0);
  return (a + b).toUpperCase() || "•";
}
function isComplete(m) {
  return !!(m && m.prenom && m.nom && m.role && m.matricule);
}
function statusOf(m) {
  if (!m || (!m.prenom && !m.nom)) return "Fiche vide";
  return isComplete(m) ? "Fiche complète" : "À compléter";
}
function onlyPhoto(p) {
  return typeof p === "string" && /^data:image\/(png|jpe?g|webp);base64,/i.test(p) ? p : null;
}
function normMember(m) {
  return {
    id: String(m && m.id || uid()).slice(0, 40),
    prenom: String(m && m.prenom || "").slice(0, 40),
    nom: String(m && m.nom || "").slice(0, 40),
    role: String(m && m.role || "").slice(0, 60),
    matricule: String(m && m.matricule || "").slice(0, 24),
    whatsapp: String(m && m.whatsapp || "").slice(0, 24),
    photo: onlyPhoto(m && m.photo),
    zoom: clampNum(m && m.zoom, 80, 220, 100),
    oy: clampNum(m && m.oy, 0, 100, 38),
    ordre: clampNum(m && m.ordre, 0, 9999, 0)
  };
}
function store_get(k, d) {
  try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; }
}
function store_set(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* quota */ }
}
function toast(msg) {
  $("#toastMsg").textContent = msg;
  var el = $("#toast");
  el.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(function () { el.classList.remove("show"); }, 2800);
}
function nextMatri() {
  var max = 0;
  members.concat([draft || {}]).forEach(function (m) {
    var mt = (m.matricule || "").match(/^BC-26-(\d{1,3})$/);
    if (mt) max = Math.max(max, parseInt(mt[1], 10));
  });
  return "BC-26-" + String(Math.min(max + 1, 999)).padStart(3, "0");
}
function curIndex() {
  if (!draft || !draft.id) return -1;
  for (var i = 0; i < members.length; i++) if (members[i].id === draft.id) return i;
  return -1;
}
function newDraft() {
  return {
    id: null, prenom: "", nom: "", role: "AGENT PAYSAGISTE", matricule: nextMatri(),
    whatsapp: "", photo: null, zoom: 100, oy: 38, ordre: members.length
  };
}

/* ────────────── atmosphère : aurore GLSL ────────────── */
(function bg() {
  var c = document.getElementById("bg");
  var gl = null;
  try { gl = c.getContext("webgl", { antialias: false, alpha: false, depth: false, powerPreference: "low-power" }); } catch (e) {}
  if (!gl) { document.body.classList.add("no-gl"); return; }
  var vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}";
  var fs = "precision highp float;uniform vec2 u;uniform float t;\n" +
    "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}\n" +
    "float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 w=f*f*(3.0-2.0*f);\n" +
    "  float a=hash(i),b=hash(i+vec2(1.0,0.0)),c=hash(i+vec2(0.0,1.0)),d=hash(i+vec2(1.0,1.0));\n" +
    "  return mix(mix(a,b,w.x),mix(c,d,w.x),w.y);}\n" +
    "float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.03;a*=0.5;}return v;}\n" +
    "void main(){\n" +
    "  vec2 uv=gl_FragCoord.xy/u.xy;\n" +
    "  vec2 p=uv*vec2(u.x/u.y,1.0)*1.15;\n" +
    "  float t1=t*0.017;\n" +
    "  float n=fbm(p*1.35+vec2(t1,-t1*0.7));\n" +
    "  float n2=fbm(p*2.4+vec2(-t1*0.55,n*0.6));\n" +
    "  float v=smoothstep(0.18,0.92,n*0.65+n2*0.55);\n" +
    "  vec3 col=mix(vec3(0.012,0.043,0.066),vec3(0.045,0.16,0.23),v*0.92);\n" +
    "  float d=distance(uv,vec2(0.74,0.9));\n" +
    "  col+=vec3(0.42,0.62,0.28)*0.14*smoothstep(0.64,0.0,d)*(0.55+0.45*n);\n" +
    "  float d2=distance(uv,vec2(0.05,0.02));\n" +
    "  col+=vec3(0.05,0.2,0.29)*0.30*smoothstep(0.75,0.0,d2);\n" +
    "  col*=1.0-0.62*smoothstep(0.34,1.02,distance(uv,vec2(0.5,0.48)));\n" +
    "  col+=(hash(uv*u.xy+t)-0.5)*0.011;\n" +
    "  gl_FragColor=vec4(col,1.0);\n" +
    "}";
  var sh = function (type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; }
    return s;
  };
  var a = sh(gl.VERTEX_SHADER, vs), b = sh(gl.FRAGMENT_SHADER, fs);
  if (!a || !b) { document.body.classList.add("no-gl"); return; }
  var prog = gl.createProgram(); gl.attachShader(prog, a); gl.attachShader(prog, b); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { document.body.classList.add("no-gl"); return; }
  gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var uRes = gl.getUniformLocation(prog, "u"), uT = gl.getUniformLocation(prog, "t");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var run = true;
  function draw(now) {
    gl.uniform1f(uT, (now - t0) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function size() {
    var dpr = Math.min(devicePixelRatio || 1, 1.75);
    c.width = Math.floor(innerWidth * dpr); c.height = Math.floor(innerHeight * dpr);
    gl.viewport(0, 0, c.width, c.height); gl.uniform2f(uRes, c.width, c.height);
    if (reduce) { gl.uniform1f(uT, 0); gl.drawArrays(gl.TRIANGLES, 0, 3); }
  }
  size(); addEventListener("resize", size);
  var t0 = performance.now();
  function frame(now) {
    if (run) draw(now);
    if (!reduce) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.addEventListener("visibilitychange", function () { run = !document.hidden && !reduce; });
  window.__gl = "ok";
})();

/* ────────────── rosace + spores ────────────── */
(function decorate() {
  var s = 600, c = 300, p = "";
  [86, 118, 150, 188].forEach(function (r) {
    p += '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" stroke="currentColor" stroke-width=".6"/>';
  });
  for (var i = 0; i < 240; i++) {
    var ang = i * Math.PI / 120, inn = 150;
    var len = (i % 6 === 0) ? 26 : (i % 2 ? 9 : 14);
    p += '<line x1="' + (c + Math.cos(ang) * inn) + '" y1="' + (c + Math.sin(ang) * inn) +
      '" x2="' + (c + Math.cos(ang) * (inn + len)) + '" y2="' + (c + Math.sin(ang) * (inn + len)) +
      '" stroke="currentColor" stroke-width=".5"/>';
  }
  for (var k = 0; k < 12; k++) {
    var a2 = k * Math.PI / 6;
    p += '<line x1="' + (c + Math.cos(a2) * 86) + '" y1="' + (c + Math.sin(a2) * 86) +
      '" x2="' + (c + Math.cos(a2) * 188) + '" y2="' + (c + Math.sin(a2) * 188) +
      '" stroke="currentColor" stroke-width=".35" stroke-dasharray="2 7"/>';
  }
  $("#rosette").innerHTML = '<svg viewBox="0 0 600 600" fill="none" style="color:#a9cf78" aria-hidden="true">' + p + "</svg>";

  var layer = $("#spores");
  for (var j = 0; j < 26; j++) {
    var sp = document.createElement("i"); sp.className = "spore";
    sp.style.cssText = "--x:" + (Math.random() * 100) + "%;--y:" + (20 + Math.random() * 80) + "%;" +
      "--s:" + (1 + Math.random() * 2.6) + "px;--d:" + (10 + Math.random() * 16) + "s;" +
      "--dl:" + (-Math.random() * 22) + "s;--o:" + (.08 + Math.random() * .3);
    layer.appendChild(sp);
  }
})();

/* ────────────── rendu du badge (v3, inchangé) ────────────── */
function photoWin(m) {
  if (m.photo) {
    return '<img src="' + esc(m.photo) + '" alt="" style="object-position:50% ' + (m.oy || 38) +
      '%;transform:scale(' + ((m.zoom || 100) / 100) + ')">';
  }
  return '<div class="bd-ph"><svg viewBox="0 0 24 24" fill="currentColor">' +
    '<path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z"/></svg></div>' +
    '<div class="bd-cap">PHOTO 4×5</div>';
}
var TEL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
  '<path stroke-linecap="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>';

function faceR(m, c) {
  var matri = (m.matricule || "").trim();
  var matriBits = matri ? c128Bits(matri.toUpperCase()) : "";
  return '<div class="bd-face bd-recto">' +
    '<div class="bd-band"><img class="bd-scene" src="' + SCENE + '" alt="">' +
      '<div class="bd-veil"></div>' +
      '<div class="bd-head"><img class="bd-mark" src="' + LOGO + '" alt="">' +
        '<div class="bd-brand"><b>' + esc(c.nom) + "</b><span>" + esc(c.sous) + "</span></div></div></div>" +
    '<div class="bd-paper"></div>' +
    '<div class="bd-pcard"><div class="bd-win">' + photoWin(m) + "</div></div>" +
    '<span class="bd-hole"></span>' +
    '<div class="bd-first">' + esc(m.prenom) + "</div>" +
    '<div class="bd-name" data-fit>' + esc(m.nom) + "</div>" +
    '<div class="bd-role">' + esc(m.role) + "</div>" +
    (m.whatsapp
      ? '<div class="bd-tel">' + TEL_ICON + "<div>" +
        '<div class="bd-k">WHATSAPP</div><div class="bd-n">' + esc(m.whatsapp) + "</div></div></div>"
      : "") +
    (matriBits
      ? '<div class="bd-bc">' + c128SVG(matriBits) + "</div>" +
      '<div class="bd-idline"><span>ID</span><b>' + esc(matri) + "</b></div>"
      : "") +
    "</div>";
}
function faceV(m, c) {
  return '<div class="bd-face bd-verso">' +
    '<img class="bd-vbg" src="' + SCENE + '" alt="">' +
    '<div class="bd-vshade"></div>' +
    '<span class="bd-hole"></span>' +
    '<div class="bd-vhead"><img class="bd-mark" src="' + LOGO + '" alt="">' +
      '<div class="bd-brand"><b>' + esc(c.nom) + "</b><span>" + esc(c.sous) + "</span></div>" +
      '<span class="bd-act">' + esc(c.act) + "</span></div>" +
    '<div class="bd-serv">' + esc(c.serv1) + "<br>" + esc(c.serv2) + "</div>" +
    '<div class="bd-slogan">' + esc(c.slogan) + "</div>" +
    '<div class="bd-qr"><div class="bd-qrs">' + qrSVG(c.site) + "</div></div>" +
    '<div class="bd-std"><div class="bd-k">STANDARD</div><div class="bd-stdn">' + esc(c.standard) + "</div></div>" +
    '<div class="bd-vaddr">' + esc(c.adresse) + "<i>·</i>" + esc(c.ifu) + "</div>" +
    '<div class="bd-vfound">Badge trouvé ?&nbsp; Appelez le <b>' + esc(c.standard) + "</b></div>" +
    "</div>";
}
function pageHTML(m) {
  return '<div class="bd-pg">' + faceR(m, comp) + "</div>" +
    '<div class="bd-pg">' + faceV(m, comp) + "</div>";
}

/* ────────────── autofit (nom) ────────────── */
function autofitIn(root) {
  if (!root) return;
  var els = root.querySelectorAll("[data-fit]");
  for (var i = 0; i < els.length; i++) {
    (function (el) {
      var cs = getComputedStyle(el);
      var avail = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (!avail) return;
      el.style.whiteSpace = "nowrap"; el.style.fontSize = "";
      var base = parseFloat(getComputedStyle(el).fontSize);
      var s = base, min = Math.max(9.6, base * 0.58), guard = 200;
      while (el.scrollWidth > avail + 0.5 && s > min && guard-- > 0) {
        s -= 0.25; el.style.fontSize = s + "px";
      }
      if (el.scrollWidth > avail + 0.5) { el.style.whiteSpace = "normal"; el.style.lineHeight = "1.02"; }
    })(els[i]);
  }
}

/* ────────────── mise à l'échelle de la carte ────────────── */
function fitStage() {
  var wrap = $("#cardwrap"); if (!wrap) return;
  var w = wrap.clientWidth; if (!w) return;
  wrap.style.setProperty("--card-scale", String(w / CARD_W));
}
function fitMini(el) {
  if (!el) return;
  var w = el.clientWidth; if (!w) return;
  el.style.setProperty("--mini-scale", String(w / CARD_W));
}
function fitMiniCards() {
  $$(".mini-card").forEach(fitMini);
}
function autofitAll() {
  ["#cardFrontFace", "#cardBackFace", "#cardReflectFace"].forEach(function (s) {
    autofitIn($(s));
  });
}

/* ────────────── rendu de l'atelier ────────────── */
function sweep() {
  var cw = $("#cardwrap");
  cw.classList.remove("sweep"); void cw.offsetWidth; cw.classList.add("sweep");
  setTimeout(function () { cw.classList.remove("sweep"); }, 1200);
}

function updateStageText() {
  if (!draft) return;
  var i = curIndex();
  var nm = fullName(draft);
  $("#kIdx").textContent = i >= 0 ? pad2(i + 1) : "—";
  $("#kTotal").textContent = pad2(members.length);
  $("#aName").textContent = nm ? pretty(nm) : "Nouvel agent";
  $("#aRole").textContent = draft.role ? pretty(draft.role) : "Fonction à définir";
  $("#aMat").textContent = draft.matricule || "Sans matricule";
  $("#aStatus").textContent = statusOf(draft);
  $("#aStatus").classList.toggle("dim", !isComplete(draft));
  $("#trayIdx").textContent = i >= 0
    ? pad2(i + 1) + " — " + pad2(members.length)
    : "— / " + pad2(members.length);
  $("#topCount").textContent = pad2(members.length) + " spécimen" + (members.length > 1 ? "s" : "");
}

function renderFront() {
  if (!draft) return;
  var html = faceR(draft, comp);
  $("#cardFrontFace").innerHTML = html;
  $("#cardReflectFace").innerHTML = html;
  autofitIn($("#cardFrontFace"));
  autofitIn($("#cardReflectFace"));
  updateStageText();
}
function renderBack() {
  if (!draft) return;
  $("#cardBackFace").innerHTML = faceV(draft, comp);
  autofitIn($("#cardBackFace"));
}
function renderStage() {
  renderFront(); renderBack(); fitStage();
}

function renderRail() {
  var html = '<span class="rail-top">Équipe</span>';
  members.forEach(function (m, i) {
    var on = draft && draft.id === m.id;
    html += '<button class="spec' + (on ? " on" : "") + '" data-i="' + i + '"' +
      ' aria-label="' + esc(fullName(m) || "Agent") + '" aria-current="' + (on ? "true" : "false") + '">' +
      '<span class="ph">' +
      (m.photo ? '<img src="' + esc(m.photo) + '" alt="">' : '<span class="init">' + esc(initials(m)) + "</span>") +
      "</span><span class=\"num\">" + pad2(i + 1) + "</span></button>";
  });
  html += '<button class="rail-add" id="railAdd" aria-label="Ajouter un agent">+</button>';
  $("#rail").innerHTML = html;
  $$("#rail .spec").forEach(function (el) {
    el.onclick = function () { selectIndex(parseInt(el.dataset.i, 10)); };
  });
  $("#railAdd").onclick = newAgent;
}
function scrollCurrent() {
  var el = $("#rail .spec.on");
  if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function updatePhotoUI() {
  if (!draft) return;
  var has = !!draft.photo;
  var thumb = $("#thumb"), img = $("#insPhoto");
  thumb.classList.toggle("has", has);
  if (has) {
    img.src = draft.photo;
    img.style.objectPosition = "50% " + (draft.oy || 38) + "%";
    img.style.transform = "scale(" + ((draft.zoom || 100) / 100) + ")";
  } else {
    img.removeAttribute("src");
    img.style.objectPosition = "";
    img.style.transform = "";
  }
  $("#thumbEm").innerHTML = has ? "Changer<br>la photo" : "Ajouter<br>photo 4×5";
  $("#insInit").textContent = initials(draft);
  $("#photoTools").classList.toggle("on", has);
  var z = draft.zoom || 100, o = draft.oy || 38;
  $("#r-zoom").value = z; $("#v-zoom").textContent = z + " %";
  $("#r-oy").value = o; $("#v-oy").textContent = o + " %";
}

function updateFoot() {
  var foot = $("#insFoot");
  var sync = $("#sync");
  sync.classList.toggle("warn", dirty);
  foot.textContent = dirty
    ? "Modifications non enregistrées"
    : (ISDEMO ? "Mode démonstration" : "Synchronisé avec la base");
  $("#liveTxt").textContent = dirty
    ? "Modifications locales"
    : (ISDEMO ? "Mode démonstration" : "Base synchronisée");
}
function setDirty(v) {
  dirty = !!v;
  updateFoot();
}
function persistDraft() {
  if (!ISDEMO && draft) store_set(K_DR, draft);
}

function refreshMeta() {
  if (!draft) return;
  var nm = fullName(draft);
  $("#insName").textContent = nm ? pretty(nm) : "Nouvel agent";
  $("#insRole").textContent = draft.role ? pretty(draft.role) : "Fonction à définir";
  $("#insInit").textContent = initials(draft);
  var complete = isComplete(draft);
  $("#insPillTxt").textContent = !draft.id ? "Nouveau" : (complete ? "Complet" : "À compléter");
  $("#insPill").classList.toggle("off", !!draft.id && !complete);
  $("#delBtn").hidden = !(draft.id && members.some(function (m) { return m.id === draft.id; }));
  updateFoot();
}

function fillInspector() {
  if (!draft) return;
  $("#fPrenom").value = draft.prenom || "";
  $("#fNom").value = draft.nom || "";
  $("#fRole").value = draft.role || "";
  $("#fWa").value = draft.whatsapp || "";
  $("#fMat").value = draft.matricule || "";
  $("#saveBtn").textContent = (draft.id && members.some(function (m) { return m.id === draft.id; }))
    ? "Mettre à jour" : "Enregistrer";
  refreshMeta();
  updatePhotoUI();
  var f = $("#fields");
  f.classList.remove("in"); void f.offsetWidth; f.classList.add("in");
}

/* ────────────── rayon ────────────── */
function wallList() {
  return members.map(function (m, i) { return { m: m, i: i }; }).filter(function (o) {
    if (wallFilter === "complete") return isComplete(o.m);
    if (wallFilter === "todo") return !isComplete(o.m);
    return true;
  });
}
function renderCounts() {
  var done = members.filter(isComplete).length;
  $("#cAll").textContent = members.length;
  $("#cDone").textContent = done;
  $("#cTodo").textContent = members.length - done;
}
function renderWall() {
  var list = wallList();
  var grid = $("#wallGrid");
  grid.innerHTML = list.length ? list.map(function (o, k) {
    var m = o.m;
    return '<button class="wall-card" data-i="' + o.i + '" style="--i:' + k + '">' +
      '<div class="mini-card"><div class="mini-scaler">' + faceR(m, comp) + "</div></div>" +
      '<div class="wall-meta"><b>' + esc(pretty(fullName(m)) || "Sans nom") + "</b>" +
      "<span>" + esc(m.role ? pretty(m.role) : "Fonction à définir") + "</span>" +
      '<em class="' + (isComplete(m) ? "" : "arch") + '"><i></i>' +
      esc(m.matricule || "Sans matricule") + "</em></div></button>";
  }).join("") : '<div class="wall-empty">Aucun spécimen dans cette vue.<br>Ajoutez un agent depuis l’atelier.</div>';
  $("#wallCount").textContent = list.length + " spécimen" + (list.length > 1 ? "s" : "");
  renderCounts();
  $$("#wallGrid .wall-card").forEach(function (el) {
    el.onclick = function () {
      var i = parseInt(el.dataset.i, 10);
      closeWall();
      setTimeout(function () { selectIndex(i, true); }, 240);
    };
  });
  requestAnimationFrame(fitMiniCards);
}

/* ────────────── API ────────────── */
async function send(path, method, body) {
  try {
    var r = await fetch(API + path, {
      method: method,
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: body ? JSON.stringify(body) : undefined
    });
    if (r.status === 401) { showSeam(); return null; }
    var d = await r.json().catch(function () { return {}; });
    if (!r.ok) { toast(d.error || "Erreur serveur"); return null; }
    return d;
  } catch (e) {
    toast("Connexion au serveur impossible");
    return null;
  }
}

async function loadTeam() {
  try {
    var r = await fetch(API + "/team", { credentials: "same-origin" });
    if (r.status === 401) return false;
    if (!r.ok) return null;
    var d = await r.json();
    members = (Array.isArray(d.members) ? d.members : []).map(normMember);
    comp = Object.assign({}, DEF_CO, d.company || {});
    return true;
  } catch (e) {
    console.error("[studio]", e);
    return null;
  }
}

function sameAsServer(d) {
  var m = members.find(function (x) { return x.id === d.id; });
  if (!m) return false;
  return ["prenom", "nom", "role", "matricule", "whatsapp", "photo", "zoom", "oy"].every(function (k) {
    return String(m[k] == null ? "" : m[k]) === String(d[k] == null ? "" : d[k]);
  });
}

function afterData() {
  var saved = ISDEMO ? null : store_get(K_DR, null);
  var chosen = null, restored = false;
  if (saved && typeof saved === "object") {
    if (saved.id && members.some(function (m) { return m.id === saved.id; })) {
      chosen = normMember(saved); restored = true;
    } else if (!saved.id && (saved.prenom || saved.nom)) {
      chosen = normMember(saved); restored = true;
    }
  }
  if (!chosen) chosen = members.length ? clone(members[0]) : newDraft();
  draft = chosen;
  dirty = restored ? !sameAsServer(draft) : false;
  persistDraft();
  fillInspector();
  renderStage();
  renderRail();
  renderWall();
  updateFoot();
  requestAnimationFrame(function () { fitStage(); fitMiniCards(); });
}

async function saveMember() {
  if (!draft) return;
  if (!(draft.prenom || "").trim() && !(draft.nom || "").trim()) {
    toast("Indique au moins le prénom ou le nom");
    $("#fPrenom").focus();
    return;
  }
  var m = clone(draft);
  m.photo = onlyPhoto(m.photo);
  m.id = m.id || uid();
  if (ISDEMO) {
    var i = members.findIndex(function (x) { return x.id === m.id; });
    if (i >= 0) members[i] = m; else members.push(m);
  } else {
    var r = await send("/member", "POST", m);
    if (!r || !r.member) return;
    m = normMember(r.member);
  }
  var j = members.findIndex(function (x) { return x.id === m.id; });
  if (j >= 0) members[j] = m; else members.push(m);
  draft = clone(m);
  dirty = false;
  persistDraft();
  fillInspector();
  renderStage();
  renderRail();
  renderWall();
  updateFoot();
  var b = $("#saveBtn");
  b.textContent = "Enregistré"; b.classList.add("ok");
  setTimeout(function () {
    b.classList.remove("ok");
    b.textContent = (draft.id && members.some(function (x) { return x.id === draft.id; }))
      ? "Mettre à jour" : "Enregistrer";
  }, 1500);
  toast("Fiche enregistrée ✓");
}

async function deleteCurrent() {
  if (!draft || !draft.id) return;
  var idx = curIndex();
  var m = idx >= 0 ? members[idx] : null;
  if (!m) return;
  if (!confirm("Retirer " + (pretty(fullName(m)) || "cet agent") + " de l’équipe ?")) return;
  if (ISDEMO) {
    members = members.filter(function (x) { return x.id !== m.id; });
  } else {
    var d = await send("/member?id=" + encodeURIComponent(m.id), "DELETE");
    if (!d) return;
    members = members.filter(function (x) { return x.id !== m.id; });
  }
  if (members.length) {
    draft = clone(members[Math.min(idx, members.length - 1)]);
    dirty = false;
  } else {
    draft = newDraft();
    dirty = false;
  }
  persistDraft();
  fillInspector();
  renderStage();
  renderRail();
  renderWall();
  updateFoot();
  toast("Agent retiré");
}

function setSetState(text, warn) {
  var el = $("#setState");
  el.textContent = text;
  el.classList.toggle("warn", !!warn);
}
function saveCompanySoon() {
  if (ISDEMO) { setSetState("Mode démonstration"); return; }
  setSetState("Enregistrement…", false);
  clearTimeout(coT);
  coT = setTimeout(async function () {
    var d = await send("/company", "PUT", comp);
    setSetState(d ? "Enregistré" : "Erreur — réessayez", !d);
  }, 650);
}

function doExport() {
  var data = JSON.stringify({ v: 2, comp: comp, members: members, draft: draft }, null, 1);
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
  a.download = "beclean-badges.json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
  toast("Équipe exportée (" + members.length + " agents)");
}

async function logout() {
  if (dirty && !confirm("Des modifications ne sont pas enregistrées. Se déconnecter quand même ?")) return;
  try { await fetch(API + "/logout", { method: "POST", credentials: "same-origin" }); } catch (e) {}
  location.href = location.pathname;
}

/* ────────────── sélection / nouveau ────────────── */
function selectIndex(i, force) {
  if (!members.length) { newAgent(); return; }
  i = ((i % members.length) + members.length) % members.length;
  var m = members[i];
  if (!force && draft && draft.id === m.id) return;
  if (!force && dirty && !confirm("Modifications non enregistrées. Continuer sans enregistrer ?")) return;
  clearTimeout(stageT);
  $("#stageInner").classList.add("out");
  stageT = setTimeout(function () {
    draft = clone(m);
    dirty = false;
    persistDraft();
    fillInspector();
    renderStage();
    renderRail();
    updateFoot();
    $("#cardwrap").classList.remove("flip");
    $("#stageInner").classList.remove("out");
    $("#stageInner").classList.add("in");
    setTimeout(function () { $("#stageInner").classList.remove("in"); }, 780);
    sweep();
    scrollCurrent();
  }, 210);
}

function newAgent() {
  if (dirty && !confirm("Modifications non enregistrées. Créer un nouvel agent quand même ?")) return;
  draft = newDraft();
  dirty = false;
  persistDraft();
  fillInspector();
  renderStage();
  renderRail();
  updateFoot();
  $("#cardwrap").classList.remove("flip");
  if (matchMedia("(max-width:1020px)").matches) {
    $("#inspector").classList.add("open");
    $("#scrim").classList.add("on");
  }
  setTimeout(function () { $("#fPrenom").focus(); }, 160);
  toast("Nouveau formulaire — matricule " + draft.matricule);
}

/* ────────────── overlays ────────────── */
function openWall() {
  renderWall();
  $("#wall").classList.add("open");
  $("#wall").setAttribute("aria-hidden", "false");
  $("#wallBtn").setAttribute("aria-expanded", "true");
  $("#inspector").classList.remove("open");
  $("#scrim").classList.remove("on");
  closeMenu();
  setTimeout(fitMiniCards, 80);
  $("#wallBack").focus();
}
function closeWall() {
  $("#wall").classList.remove("open");
  $("#wall").setAttribute("aria-hidden", "true");
  $("#wallBtn").setAttribute("aria-expanded", "false");
  $("#wallBtn").focus();
}

var pItems = [], pIdx = 0;
function paintPalette(q) {
  var s = fold(q || "").trim();
  pItems = members.map(function (m, i) { return { m: m, i: i }; }).filter(function (o) {
    return !s || fold(fullName(o.m) + " " + o.m.matricule + " " + o.m.role).includes(s);
  });
  pIdx = 0;
  var list = $("#pList");
  list.innerHTML = pItems.length ? pItems.map(function (o, k) {
    var m = o.m;
    return '<button class="p-item' + (k === 0 ? " on" : "") + '" data-i="' + o.i + '">' +
      '<span class="p-thumb">' +
      (m.photo ? '<img src="' + esc(m.photo) + '" alt="">' : "<span>" + esc(initials(m)) + "</span>") +
      "</span>" +
      '<div class="pi-t"><b>' + esc(pretty(fullName(m)) || "Sans nom") + "</b>" +
      "<span>" + esc(m.role ? pretty(m.role) : "Fonction à définir") + "</span></div>" +
      "<em>" + esc(m.matricule || "—") + "</em></button>";
  }).join("") : '<p class="p-empty">Aucun résultat.</p>';
  $$("#pList .p-item").forEach(function (el, k) {
    el.onmouseenter = function () { pIdx = k; markItem(); };
    el.onclick = function () { openAgent(parseInt(el.dataset.i, 10)); };
  });
}
function markItem() {
  var els = $$("#pList .p-item");
  els.forEach(function (el, k) { el.classList.toggle("on", k === pIdx); });
  if (els[pIdx] && els[pIdx].scrollIntoView) els[pIdx].scrollIntoView({ block: "nearest" });
}
function openPalette() {
  paintPalette("");
  $("#palette").classList.add("open");
  $("#palette").setAttribute("aria-hidden", "false");
  $("#cmdBtn").setAttribute("aria-expanded", "true");
  closeMenu();
  setTimeout(function () {
    $("#pQuery").value = "";
    $("#pQuery").focus();
  }, 60);
}
function closePalette() {
  $("#palette").classList.remove("open");
  $("#palette").setAttribute("aria-hidden", "true");
  $("#cmdBtn").setAttribute("aria-expanded", "false");
  $("#cmdBtn").focus();
}
function openAgent(i) {
  closePalette();
  closeWall();
  selectIndex(i);
}

function openSettings() {
  $$("[data-c]").forEach(function (inp) { inp.value = comp[inp.dataset.c] || ""; });
  setSetState(ISDEMO ? "Mode démonstration" : "Synchronisé", false);
  $("#settings").classList.add("open");
  $("#settings").setAttribute("aria-hidden", "false");
  closeMenu();
  closePalette();
  setTimeout(function () { $("#cNom").focus(); }, 90);
}
function closeSettings() {
  $("#settings").classList.remove("open");
  $("#settings").setAttribute("aria-hidden", "true");
  $("#accountBtn").focus();
}

function openMenu() {
  $("#menu").classList.add("open");
  $("#menu").setAttribute("aria-hidden", "false");
  $("#accountBtn").setAttribute("aria-expanded", "true");
}
function closeMenu() {
  $("#menu").classList.remove("open");
  $("#menu").setAttribute("aria-hidden", "true");
  $("#accountBtn").setAttribute("aria-expanded", "false");
}
function toggleMenu() {
  if ($("#menu").classList.contains("open")) closeMenu(); else openMenu();
}

/* ────────────── seuil ────────────── */
function clearKeyError() {
  $("#err").classList.remove("show");
}
function keyError(msg) {
  var e = $("#err");
  e.textContent = msg;
  e.classList.add("show");
  var f = $("#keyForm");
  f.classList.remove("shake"); void f.offsetWidth; f.classList.add("shake");
  $("#key").focus();
}
function showSeam(msg) {
  closeMenu();
  closePalette();
  closeSettings();
  closeWall();
  $("#inspector").classList.remove("open");
  $("#scrim").classList.remove("on");
  $("#seam").classList.add("on");
  $("#seam").setAttribute("aria-hidden", "false");
  $("#studio").setAttribute("aria-hidden", "true");
  if (msg) keyError(msg);
  else setTimeout(function () { $("#key").focus(); }, 120);
}
function enterStudio(instant, origin) {
  started = true;
  if (instant) {
    $("#seam").classList.remove("on", "closing");
    $("#seam").setAttribute("aria-hidden", "true");
    $("#studio").classList.add("on");
    $("#studio").setAttribute("aria-hidden", "false");
    setTimeout(function () { fitStage(); fitMiniCards(); }, 80);
    return;
  }
  var r = origin || $("#enterBtn").getBoundingClientRect();
  var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  var iris = $("#iris");
  iris.style.left = cx + "px";
  iris.style.top = cy + "px";
  iris.classList.remove("go"); void iris.offsetWidth; iris.classList.add("go");
  $("#seam").style.setProperty("--cx", cx + "px");
  $("#seam").style.setProperty("--cy", cy + "px");
  $("#studio").classList.add("on");
  $("#studio").setAttribute("aria-hidden", "false");
  $("#seam").classList.add("closing");

  var parts = [".top", ".rail", ".stage-inner", ".inspector", ".tray"];
  var narrow = matchMedia("(max-width:1020px)").matches;
  parts.forEach(function (sel, i) {
    var el = $(sel);
    var keepTransform = narrow && sel === ".inspector";
    el.style.transition = "none";
    el.style.opacity = "0";
    if (!keepTransform) el.style.transform = "translateY(14px)";
    setTimeout(function () {
      el.style.transition = "opacity .9s var(--ease) " + (i * 60) + "ms, transform 1s var(--ease) " + (i * 60) + "ms";
      el.style.opacity = "1";
      if (!keepTransform) el.style.transform = "none";
    }, 120 + i * 60);
  });
  setTimeout(function () {
    parts.forEach(function (sel) {
      var el = $(sel);
      el.style.removeProperty("transition");
      el.style.removeProperty("opacity");
      el.style.removeProperty("transform");
    });
    fitStage(); fitMiniCards();
  }, 1750);
  setTimeout(function () {
    $("#seam").classList.remove("on");
    setTimeout(function () { $("#seam").classList.remove("closing"); }, 480);
  }, 900);
  setTimeout(function () { toast("Atelier ouvert · base synchronisée"); }, 1500);
}

/* ────────────── impression ────────────── */
function showPrintSheet() {
  var s = $("#printsheet"), st = $("#stamp");
  s.classList.remove("show", "hide"); void s.offsetWidth;
  st.classList.remove("show"); void st.offsetWidth;
  s.classList.add("show"); st.classList.add("show");
  clearTimeout(printT);
  printT = setTimeout(function () {
    s.classList.remove("show"); s.classList.add("hide");
    setTimeout(function () { s.classList.remove("hide"); st.classList.remove("show"); }, 500);
  }, 2700);
}
function printPages(list) {
  if (!list.length) { toast("Aucun agent à imprimer"); return; }
  var root = $("#printroot");
  root.innerHTML = list.map(pageHTML).join("");
  autofitIn(root);
  if (list.length === 1) {
    showPrintSheet();
    toast("Badge de " + (pretty(fullName(list[0])) || "l’agent") + " · 2 pages CR80");
  } else {
    toast("Planche · " + (list.length * 2) + " pages CR80");
  }
  setTimeout(function () { window.print(); }, list.length === 1 ? 430 : 80);
}
function printCurrent() {
  if (!draft) return;
  printPages([draft]);
}

/* ────────────── photo ────────────── */
function shrink(dataUrl, max, cb) {
  var im = new Image();
  im.onload = function () {
    var w = im.width, h = im.height, k = Math.min(1, max / Math.max(w, h));
    var cv = document.createElement("canvas");
    cv.width = Math.round(w * k); cv.height = Math.round(h * k);
    cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
    cb(cv.toDataURL("image/jpeg", 0.86));
  };
  im.onerror = function () { toast("Fichier image illisible"); };
  im.src = dataUrl;
}

/* ────────────── import ────────────── */
function importFile(file) {
  if (!file) return;
  var rd = new FileReader();
  rd.onload = async function () {
    try {
      var d = JSON.parse(rd.result);
      if (!d || !Array.isArray(d.members)) throw 0;
      if (!confirm("Importer " + d.members.length + " agents dans l’équipe ?")) return;
      var list = d.members.map(normMember);
      if (ISDEMO) {
        members = list;
        comp = Object.assign({}, DEF_CO, d.comp || {});
      } else {
        for (var i = 0; i < list.length; i++) {
          await send("/member", "POST", list[i]);
        }
        if (d.comp) await send("/company", "PUT", Object.assign({}, comp, d.comp));
        await loadTeam();
      }
      draft = members.length ? clone(members[0]) : newDraft();
      dirty = false;
      persistDraft();
      fillInspector();
      renderStage();
      renderRail();
      renderWall();
      updateFoot();
      toast("Équipe importée : " + members.length + " agents");
    } catch (e) {
      toast("Fichier illisible — utilisez « Exporter l’équipe »");
    }
  };
  rd.readAsText(file);
}

/* ────────────── écouteurs ────────────── */
function bind() {
  $$("[data-f]").forEach(function (inp) {
    inp.addEventListener("input", function () {
      if (!draft) return;
      draft[inp.dataset.f] = inp.value;
      setDirty(true);
      persistDraft();
      renderFront();
      refreshMeta();
    });
  });
  $$("[data-c]").forEach(function (inp) {
    inp.addEventListener("input", function () {
      comp[inp.dataset.c] = inp.value;
      renderFront();
      renderBack();
      saveCompanySoon();
    });
  });

  $("#keyForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    var v = $("#key").value.trim();
    if (!v) return keyError("Entrez votre clé d’accès pour continuer.");
    var btn = $("#enterBtn");
    var origin = btn.getBoundingClientRect();
    var old = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = "Vérification…";
    clearKeyError();
    try {
      var r = await fetch(API + "/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password: v })
      });
      if (!r.ok) {
        keyError(r.status === 401 ? "Clé incorrecte — vérifiez et réessayez." : "Connexion impossible — réessayez.");
        return;
      }
      var ok = await loadTeam();
      if (!ok) {
        keyError(ok === false ? "Session non établie — réessayez." : "Base indisponible — réessayez plus tard.");
        return;
      }
      afterData();
      $("#key").value = "";
      enterStudio(false, origin);
    } catch (err) {
      keyError("Connexion au serveur impossible.");
    } finally {
      btn.disabled = false;
      btn.innerHTML = old;
    }
  });
  $("#key").addEventListener("input", clearKeyError);

  $("#prevBtn").onclick = function () { selectIndex(curIndex() - 1); };
  $("#nextBtn").onclick = function () { selectIndex(curIndex() + 1); };
  $("#flipBtn").onclick = function () { $("#cardwrap").classList.toggle("flip"); };
  $("#cardwrap").onclick = function () { $("#cardwrap").classList.toggle("flip"); };
  $("#cardwrap").addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      $("#cardwrap").classList.toggle("flip");
    }
  });
  $("#printBtn").onclick = printCurrent;
  $("#saveBtn").onclick = saveMember;
  $("#delBtn").onclick = deleteCurrent;
  $("#bMatri").onclick = function () {
    if (!draft) return;
    draft.matricule = nextMatri();
    $("#fMat").value = draft.matricule;
    setDirty(true);
    persistDraft();
    renderFront();
    refreshMeta();
    toast("Matricule " + draft.matricule);
  };
  $("#bPhDel").onclick = function () {
    if (!draft) return;
    draft.photo = null;
    setDirty(true);
    persistDraft();
    updatePhotoUI();
    renderFront();
    refreshMeta();
  };
  $("#thumb").onclick = function () { $("#fPhoto").click(); };
  $("#fPhoto").addEventListener("change", function (ev) {
    var f = ev.target.files && ev.target.files[0];
    if (!f || !draft) return;
    var rd = new FileReader();
    rd.onload = function () {
      shrink(rd.result, 760, function (d) {
        draft.photo = d;
        if (draft.oy == null) draft.oy = 38;
        setDirty(true);
        persistDraft();
        updatePhotoUI();
        renderFront();
        refreshMeta();
        toast("Photo intégrée — règle le cadrage si besoin");
      });
    };
    rd.readAsDataURL(f);
    ev.target.value = "";
  });
  $("#r-zoom").addEventListener("input", function () {
    if (!draft) return;
    draft.zoom = +this.value;
    $("#v-zoom").textContent = this.value + " %";
    setDirty(true);
    persistDraft();
    updatePhotoUI();
    renderFront();
  });
  $("#r-oy").addEventListener("input", function () {
    if (!draft) return;
    draft.oy = +this.value;
    $("#v-oy").textContent = this.value + " %";
    setDirty(true);
    persistDraft();
    updatePhotoUI();
    renderFront();
  });

  $("#wallBtn").onclick = openWall;
  $("#wallBack").onclick = closeWall;
  $("#wallChips").onclick = function (e) {
    var b = e.target.closest(".chip");
    if (!b) return;
    wallFilter = b.dataset.f;
    $$("#wallChips .chip").forEach(function (c) { c.classList.toggle("on", c === b); });
    renderWall();
  };
  $("#cmdBtn").onclick = function () {
    if ($("#palette").classList.contains("open")) closePalette(); else openPalette();
  };
  $("#pQuery").addEventListener("input", function (e) { paintPalette(e.target.value); });
  $("#pQuery").addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      pIdx = Math.min(pIdx + 1, pItems.length - 1);
      markItem();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      pIdx = Math.max(pIdx - 1, 0);
      markItem();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (pItems[pIdx]) openAgent(pItems[pIdx].i);
    }
  });
  $("#palette").addEventListener("click", function (e) {
    if (e.target.id === "palette") closePalette();
  });

  $("#accountBtn").onclick = function (e) { e.stopPropagation(); toggleMenu(); };
  $("#menu").addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var act = b.dataset.act;
    closeMenu();
    if (act === "settings") openSettings();
    if (act === "new") newAgent();
    if (act === "export") doExport();
    if (act === "import") $("#fImport").click();
    if (act === "logout") logout();
  });
  document.addEventListener("click", function (e) {
    if (!$("#menu").classList.contains("open")) return;
    if ($("#menu").contains(e.target) || $("#accountBtn").contains(e.target)) return;
    closeMenu();
  });
  $("#fImport").addEventListener("change", function (ev) {
    var f = ev.target.files && ev.target.files[0];
    importFile(f);
    ev.target.value = "";
  });

  $("#setClose").onclick = closeSettings;
  $("#settings").addEventListener("click", function (e) {
    if (e.target.id === "settings") closeSettings();
  });

  $("#sheetBtn").onclick = function () {
    var open = $("#inspector").classList.toggle("open");
    $("#scrim").classList.toggle("on", open);
  };
  $("#scrim").onclick = function () {
    $("#inspector").classList.remove("open");
    $("#scrim").classList.remove("on");
  };

  $("#plancheBtn").onclick = function () {
    if (!members.length) { toast("Équipe vide — enregistre d’abord un agent"); return; }
    printPages(members);
  };
  $("#exportBtn").onclick = doExport;

  $("#stage").addEventListener("pointermove", function (e) {
    var r = $("#stage").getBoundingClientRect();
    $("#stage").style.setProperty("--mx", (e.clientX - r.left) + "px");
    $("#stage").style.setProperty("--my", (e.clientY - r.top) + "px");
  });

  addEventListener("keydown", function (e) {
    var paletteOpen = $("#palette").classList.contains("open");
    var wallOpen = $("#wall").classList.contains("open");
    var settingsOpen = $("#settings").classList.contains("open");
    var menuOpen = $("#menu").classList.contains("open");
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (paletteOpen) closePalette(); else openPalette();
      return;
    }
    if (e.key === "Escape") {
      if (menuOpen) return closeMenu();
      if (paletteOpen) return closePalette();
      if (settingsOpen) return closeSettings();
      if (wallOpen) return closeWall();
      if ($("#inspector").classList.contains("open")) {
        $("#inspector").classList.remove("open");
        $("#scrim").classList.remove("on");
        return;
      }
    }
    if ($("#seam").classList.contains("on")) return;
    if (paletteOpen || wallOpen || settingsOpen) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
      e.preventDefault();
      printCurrent();
      return;
    }
    if (!started) return;
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (typing) return;
    if (e.key === "ArrowRight") { e.preventDefault(); selectIndex(curIndex() + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); selectIndex(curIndex() - 1); }
    if (e.key.toLowerCase() === "f") $("#cardwrap").classList.toggle("flip");
    if (e.key.toLowerCase() === "g") openWall();
    if (e.key.toLowerCase() === "p") printCurrent();
  });

  addEventListener("resize", function () {
    clearTimeout(fitT);
    fitT = setTimeout(function () { fitStage(); fitMiniCards(); }, 120);
  });

  addEventListener("afterprint", function () {
    $("#printroot").innerHTML = "";
    $("#printsheet").classList.remove("show", "hide");
    $("#stamp").classList.remove("show");
  });

  addEventListener("error", function (e) {
    document.documentElement.dataset.err =
      (document.documentElement.dataset.err || "") + " | " + e.message;
  });
}

/* ────────────── démarrage ────────────── */
bind();

if (ISDEMO) {
  members = DEMO.map(normMember);
  comp = Object.assign({}, DEF_CO);
  afterData();
  enterStudio(true);
  toast("Mode démonstration — données fictives");
} else {
  loadTeam().then(function (ok) {
    if (ok) {
      afterData();
      enterStudio(true);
    } else if (ok === false) {
      showSeam();
    } else {
      showSeam("Studio indisponible — base injoignable.");
    }
  });
}

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(function () {
    fitStage(); fitMiniCards(); autofitAll();
  });
}
window.addEventListener("load", function () {
  fitStage(); fitMiniCards(); autofitAll();
  setTimeout(function () { fitStage(); fitMiniCards(); }, 300);
});
window.__ready = true;
