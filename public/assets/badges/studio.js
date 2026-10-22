/* ══════════════════════════════════════════════════════════════
   Studio badges BeClean — application (moteur v3 + API /api/badges)
   Génère les badges CR80 54 × 85,6 mm de chaque agent.
   ══════════════════════════════════════════════════════════════ */
"use strict";

var API = "/api/badges";
var SCENE = "/assets/badges/scene.jpg";
var LOGO = "/assets/badges/logo-disc.png";

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

/* — QR (qrcode-generator, chargé avant ce fichier) — */
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
var K_DR = "bc_studio_draft";

var DEMO = [
  { id: "d1", prenom: "Dona", nom: "KPONOU", role: "AGENT PAYSAGISTE", matricule: "BC-26-001",
    whatsapp: "+229 01 99 91 20 80", photo: null, zoom: 100, oy: 38, ordre: 0 },
  { id: "d2", prenom: "Christy-Ange", nom: "ORITCHACHEOUN", role: "AGENT TERRAIN", matricule: "BC-26-002",
    whatsapp: "+229 01 97 11 22 33", photo: null, zoom: 100, oy: 38, ordre: 1 },
  { id: "d3", prenom: "Grâce", nom: "ADJOVI", role: "AGENTE D'ENTRETIEN", matricule: "BC-26-003",
    whatsapp: "+229 01 95 44 55 66", photo: null, zoom: 100, oy: 38, ordre: 2 },
  { id: "d4", prenom: "Roger", nom: "GBAGUIDI", role: "RESPONSABLE", matricule: "BC-26-004",
    whatsapp: "", photo: null, zoom: 100, oy: 38, ordre: 3 }
];

var ARGS = new URLSearchParams(location.search);
var ISDEMO = ARGS.get("demo") === "1";
var members = [];
var comp = Object.assign({}, DEF_CO);
var draft = null;

function $(id) { return document.getElementById(id); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function esc(s) {
  return (s == null ? "" : String(s)).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function store_get(k, d) {
  try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; }
}
function store_set(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* quota */ }
}
var tT;
function toast(msg) {
  var el = $("toast");
  el.textContent = msg; el.classList.add("on");
  clearTimeout(tT); tT = setTimeout(function () { el.classList.remove("on"); }, 2800);
}

/* ────────────── API ────────────── */
function showLogin() {
  $("app").style.display = "none";
  $("login").hidden = false;
  $("lgPwd").focus();
}
async function send(path, method, body) {
  var r = await fetch(API + path, {
    method: method,
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    body: body ? JSON.stringify(body) : undefined
  });
  if (r.status === 401) { showLogin(); return null; }
  var d = await r.json().catch(function () { return {}; });
  if (!r.ok) { toast(d.error || "Erreur serveur"); return null; }
  return d;
}

/* ────────────── rendu du badge ────────────── */
function photoWin(m) {
  if (m.photo) {
    return '<img src="' + m.photo + '" alt="" style="object-position:50% ' + (m.oy || 38) +
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
  return '<div class="bd-pg"><div class="bd-sh">' + faceR(m, comp) + "</div></div>" +
    '<div class="bd-pg"><div class="bd-sh">' + faceV(m, comp) + "</div></div>";
}

/* ────────────── autofit (nom) ────────────── */
function autofitIn(root) {
  var els = root.querySelectorAll("[data-fit]");
  for (var i = 0; i < els.length; i++) {
    (function (el) {
      var cs = getComputedStyle(el);
      var avail = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
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
function fitDocs() {
  autofitIn($("pvR")); autofitIn($("pvV")); autofitIn($("printroot"));
}

/* ────────────── rendu global ────────────── */
function renderBadge() {
  if (!draft) return;
  $("pvR").innerHTML = '<div class="pvzoom">' + faceR(draft, comp) + "</div>";
  $("pvV").innerHTML = '<div class="pvzoom">' + faceV(draft, comp) + "</div>";
  $("printroot").innerHTML = pageHTML(draft);
  var nm = ((draft.prenom || "") + " " + (draft.nom || "")).trim();
  $("pvChip").textContent =
    [draft.matricule || null, nm || null].filter(Boolean).join(" — ") || "sans matricule";
  fitDocs();
}

/* ────────────── formulaire ────────────── */
function bindFields() {
  document.querySelectorAll("[data-f]").forEach(function (inp) {
    inp.addEventListener("input", function () {
      draft[inp.dataset.f] = inp.value;
      store_set(K_DR, draft);
      renderBadge(); renderRoster();
    });
  });
  document.querySelectorAll("[data-c]").forEach(function (inp) {
    inp.addEventListener("input", function () {
      comp[inp.dataset.c] = inp.value;
      renderBadge(); saveCompSoon();
    });
  });
}
function fillForm() {
  document.querySelectorAll("[data-f]").forEach(function (inp) {
    inp.value = draft ? (draft[inp.dataset.f] || "") : "";
  });
  document.querySelectorAll("[data-c]").forEach(function (inp) {
    inp.value = comp[inp.dataset.c] || "";
  });
  updatePhotoUI();
  renderBadge(); renderRoster();
}
function nextMatri() {
  var max = 0;
  members.concat([draft || {}]).forEach(function (m) {
    var mt = (m.matricule || "").match(/^BC-26-(\d{1,3})$/);
    if (mt) max = Math.max(max, parseInt(mt[1], 10));
  });
  return "BC-26-" + String(Math.min(max + 1, 999)).padStart(3, "0");
}

/* photo */
function updatePhotoUI() {
  var has = !!(draft && draft.photo);
  $("dz").style.display = has ? "none" : "";
  $("phPrev").style.display = has ? "flex" : "none";
  if (has) $("phImg").src = draft.photo;
  var z = draft ? (draft.zoom || 100) : 100, o = draft ? (draft.oy || 38) : 38;
  $("r-zoom").value = z; $("v-zoom").textContent = z + " %";
  $("r-oy").value = o; $("v-oy").textContent = o + " %";
}
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
$("dz").addEventListener("click", function () { $("fPhoto").click(); });
$("fPhoto").addEventListener("change", function (ev) {
  var f = ev.target.files && ev.target.files[0]; if (!f) return;
  var rd = new FileReader();
  rd.onload = function () {
    shrink(rd.result, 760, function (d) {
      draft.photo = d; if (draft.oy == null) draft.oy = 38;
      store_set(K_DR, draft);
      updatePhotoUI(); renderBadge();
      toast("Photo intégrée — règle le cadrage si besoin");
    });
  };
  rd.readAsDataURL(f);
  ev.target.value = "";
});
$("r-zoom").addEventListener("input", function () {
  if (!draft) return;
  draft.zoom = +this.value; $("v-zoom").textContent = this.value + " %";
  renderBadge(); store_set(K_DR, draft);
});
$("r-oy").addEventListener("input", function () {
  if (!draft) return;
  draft.oy = +this.value; $("v-oy").textContent = this.value + " %";
  renderBadge(); store_set(K_DR, draft);
});
$("bPhDel").addEventListener("click", function () {
  if (!draft) return;
  draft.photo = null; store_set(K_DR, draft); updatePhotoUI(); renderBadge();
});

/* ────────────── équipe ────────────── */
var ICON_PRINT = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>';
var ICON_DEL = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6v14a2 2 0 002 2h8a2 2 0 002-2V6"/></svg>';

function initials(m) {
  var a = (m.prenom || "").trim().charAt(0) || "", b = (m.nom || "").trim().charAt(0) || "";
  return (a + b).toUpperCase() || "•";
}
function renderRoster() {
  var box = $("roster"), html = "";
  members.forEach(function (m) {
    var cur = draft && draft.id && draft.id === m.id ? " cur" : "";
    html += '<div class="mrow' + cur + '" data-id="' + esc(m.id) + '">' +
      '<div class="mth">' + (m.photo ? '<img src="' + m.photo + '" alt="">' : initials(m)) + "</div>" +
      '<div class="mm"><b>' + esc((m.prenom + " " + m.nom).trim()) + "</b><span>" + esc((m.role || "").toUpperCase()) + "</span></div>" +
      '<span class="mchip">' + esc(m.matricule || "—") + "</span>" +
      '<div class="mbt">' +
      '<button class="ibtn" title="Imprimer ce badge (2 pages)" data-act="print">' + ICON_PRINT + "</button>" +
      '<button class="ibtn d" title="Retirer de l’équipe" data-act="del">' + ICON_DEL + "</button>" +
      "</div></div>";
  });
  if (!members.length)
    html = '<div class="empty">Aucun agent enregistré.<br>Remplis la fiche puis «&nbsp;Enregistrer dans l’équipe&nbsp;».</div>';
  box.innerHTML = html;
  $("teamCt").textContent = members.length;
  $("bPlate").textContent = "🖨 Planche — toute l’équipe (" + members.length * 2 + " pages)";
}
$("roster").addEventListener("click", async function (ev) {
  var row = ev.target.closest(".mrow"); if (!row) return;
  var act = ev.target.closest("[data-act]");
  var m = members.find(function (x) { return x.id === row.dataset.id; }); if (!m) return;
  if (act && act.dataset.act === "print") { printPages([m]); return; }
  if (act && act.dataset.act === "del") {
    if (!confirm("Retirer " + (m.prenom + " " + m.nom).trim() + " de l’équipe ?")) return;
    if (ISDEMO) members = members.filter(function (x) { return x.id !== m.id; });
    else {
      var d = await send("/member?id=" + encodeURIComponent(m.id), "DELETE");
      if (!d) return;
      members = members.filter(function (x) { return x.id !== m.id; });
    }
    if (draft && draft.id === m.id) draft.id = null;
    updateSaveBtn(); renderRoster(); renderBadge();
    toast("Agent retiré");
    return;
  }
  loadMember(m);
});

function loadMember(m) {
  draft = clone(m);
  store_set(K_DR, draft);
  fillForm(); updateSaveBtn();
}

/* ────────────── actions ────────────── */
function updateSaveBtn() {
  var exists = draft && draft.id && members.some(function (x) { return x.id === draft.id; });
  $("bSave").textContent = exists ? "Mettre à jour l’agent" : "Enregistrer dans l’équipe";
}
async function saveMember() {
  if (!draft || (!(draft.prenom || "").trim() && !(draft.nom || "").trim())) {
    toast("Indique au moins le prénom ou le nom"); return;
  }
  var m = clone(draft);
  m.id = m.id || uid();
  if (ISDEMO) {
    var i = members.findIndex(function (x) { return x.id === m.id; });
    if (i >= 0) members[i] = m; else members.push(m);
  } else {
    var r = await send("/member", "POST", m);
    if (!r || !r.member) return;
    var saved = r.member;
    var j = members.findIndex(function (x) { return x.id === saved.id; });
    if (j >= 0) members[j] = saved; else members.push(saved);
    draft.id = saved.id;
  }
  store_set(K_DR, draft);
  updateSaveBtn(); renderRoster(); renderBadge();
  toast("Agent enregistré ✓");
}
function newDraft() {
  return {
    id: null, prenom: "", nom: "", role: "AGENT PAYSAGISTE", matricule: nextMatri(),
    whatsapp: "", photo: null, zoom: 100, oy: 38, ordre: members.length
  };
}
function newAgent() {
  var keepRole = (draft && draft.role) || "AGENT PAYSAGISTE";
  draft = newDraft(); draft.role = keepRole;
  store_set(K_DR, draft);
  fillForm(); updateSaveBtn();
  toast("Nouveau formulaire — matricule " + draft.matricule);
}

var coT;
function saveCompSoon() {
  if (ISDEMO) return;
  clearTimeout(coT);
  coT = setTimeout(function () { send("/company", "PUT", comp); }, 600);
}

/* ────────────── impression ────────────── */
function printPages(list) {
  if (!list.length) { toast("Aucun agent à imprimer"); return; }
  var root = $("printroot");
  root.innerHTML = list.map(function (m) { return pageHTML(m); }).join("");
  autofitIn(root);
  window.print();
}
$("bPrintOne").addEventListener("click", function () { if (draft) printPages([draft]); });
$("bPlate").addEventListener("click", function () {
  if (!members.length) { toast("Équipe vide — enregistre d’abord un agent"); return; }
  printPages(members);
  toast("Planche : " + members.length * 2 + " pages en file d’impression");
});

/* ────────────── export / import ────────────── */
function doExport() {
  var data = JSON.stringify({ v: 1, comp: comp, members: members, draft: draft }, null, 1);
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
  a.download = "beclean-badges.json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
  toast("Équipe exportée (" + members.length + " agents)");
}
$("bExport").addEventListener("click", doExport);
$("bImport").addEventListener("click", function () { $("fImport").click(); });
$("fImport").addEventListener("change", function (ev) {
  var f = ev.target.files && ev.target.files[0]; if (!f) return;
  var rd = new FileReader();
  rd.onload = async function () {
    try {
      var d = JSON.parse(rd.result);
      if (!d || !Array.isArray(d.members)) throw 0;
      if (!ISDEMO && !confirm("Importer " + d.members.length + " agents dans l’équipe en ligne ?")) return;
      comp = Object.assign({}, DEF_CO, d.comp || {});
      if (ISDEMO) { members = d.members; }
      else {
        for (var i = 0; i < d.members.length; i++) {
          var r = await send("/member", "POST", d.members[i]);
          if (r && r.member) {
            var j = members.findIndex(function (x) { return x.id === r.member.id; });
            if (j >= 0) members[j] = r.member; else members.push(r.member);
          }
        }
        send("/company", "PUT", comp);
      }
      fillForm(); updateSaveBtn();
      toast("Équipe importée : " + d.members.length + " agents");
    } catch (e) { toast("Fichier illisible — utilise « Sauver l’équipe »"); }
  };
  rd.readAsText(f);
  ev.target.value = "";
});

/* ────────────── connexion ────────────── */
$("lgForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  var r = await fetch(API + "/login", {
    method: "POST", headers: { "content-type": "application/json" },
    credentials: "same-origin", body: JSON.stringify({ password: $("lgPwd").value })
  });
  if (r.ok) location.reload();
  else { $("lgErr").hidden = false; $("lgPwd").select(); }
});
$("bLogout").addEventListener("click", async function () {
  await fetch(API + "/logout", { method: "POST", credentials: "same-origin" });
  location.reload();
});

/* ────────────── démarrage ────────────── */
$("bSave").addEventListener("click", saveMember);
$("bNew").addEventListener("click", newAgent);
$("bMatri").addEventListener("click", function () {
  if (!draft) return;
  draft.matricule = nextMatri();
  $("f-matricule").value = draft.matricule;
  store_set(K_DR, draft);
  renderBadge();
});
bindFields();
window.addEventListener("afterprint", function () { renderBadge(); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitDocs);
window.addEventListener("load", function () { fitDocs(); setTimeout(fitDocs, 260); setTimeout(fitDocs, 800); });

async function boot() {
  if (ISDEMO) {
    members = DEMO.slice();
    comp = Object.assign({}, DEF_CO);
    draft = clone(members[0]);
    fillForm(); updateSaveBtn();
    return;
  }
  var r = await fetch(API + "/team", { credentials: "same-origin" });
  if (r.status === 401) { showLogin(); return; }
  if (!r.ok) { toast("Erreur de chargement de l’équipe"); return; }
  var d = await r.json();
  members = d.members || [];
  comp = Object.assign({}, DEF_CO, d.company || {});
  var saved = store_get(K_DR, null);
  draft = saved || (members.length ? clone(members[0]) : newDraft());
  fillForm(); updateSaveBtn();
}
boot();
