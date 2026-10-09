// "Try the menu": a replica of the Tempo hub window. Tabs and features are the
// real ones from each game's hub; nothing here talks to a game.
(() => {
  const root = document.getElementById("hubDemo");
  if (!root) return;

  // Theme rows copied from WindLib THEMES (panel, top, card, hover, off, divider, accent, glow, btn, text, dim, faint).
  const THEMES = {
    Tempo:    ["#0A0A0B","#0D0D0F","#111113","#1A1A1D","#303034","#1E1E21","#FF8A2A","#FFC48F","#7A3A10","#E8ECF1","#8C9198","#5C6066"],
    Ember:    ["#0B0908","#0F0C0A","#141010","#1E1815","#38302C","#241D1A","#FF7A3D","#FFC9A8","#7A3A1C","#F2EAE5","#9A8E87","#665D58"],
    Verdant:  ["#080B09","#0A0F0C","#0F1411","#161E1A","#2C382F","#18231C","#3DD68C","#B4F2D6","#1C6B44","#E6F2EB","#879A8F","#586660"],
    Orchid:   ["#0A080C","#0D0A10","#131017","#1C1622","#362C40","#221B29","#A87BFF","#DCC9FF","#4E2E80","#EDE8F2","#918799","#5F5866"],
    Scarlet:  ["#0C0809","#100A0C","#150F11","#1F1518","#3A2A2E","#261A1E","#F8536A","#FFB8C2","#7A2635","#F2E8EA","#9A888C","#66595C"],
    Aurora:   ["#070C14","#09101A","#0D1520","#141F2E","#2A3A4D","#16222F","#38E0D0","#B6F7F0","#176B66","#E4F0F2","#85949A","#576368"],
    Sakura:   ["#0C090B","#100C0E","#151013","#1F171B","#3A2C33","#261C21","#FF8ABF","#FFD1E6","#7A3557","#F2EAEE","#9A8A91","#665B60"],
    Bullion:  ["#0B0A07","#0F0D09","#14120C","#1E1B13","#383225","#241F16","#E8B93D","#F8E5A8","#755C16","#F2EEE3","#9A9382","#665F52"],
    Slate:    ["#0D0D0F","#111113","#17171A","#212125","#3C3C42","#26262B","#C8CDD6","#F0F3F8","#4A4F59","#EDEFF2","#8E9299","#5E6268"],
    Nocturne: ["#080A16","#0B0E1C","#101426","#181D33","#2E3552","#1B2138","#6E7BFF","#C2C8FF","#303A94","#E7E9F5","#888DA6","#5A5F75"],
    Sin:      ["#F6F6F7","#FFFFFF","#FFFFFF","#EFEFF1","#D0D0D6","#E2E2E6","#111113","#3A3A40","#1A1A1D","#0B0B0C","#5E6066","#8C9198"],
  };
  const VARS = ["panel","top","card","hover","off","div","acc","glow","btn","text","dim","faint"];

  const I = {
    swords: '<path d="M4 20 14 10M14 4h6v6L10 20H4v-6z"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
    film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 12h18"/>',
    sprout: '<path d="M12 21V11M12 11C12 6 8 4 4 4c0 5 3 7 8 7zM12 13c0-4 3-6 8-6 0 4-3 6-8 6z"/>',
    run: '<circle cx="14" cy="4" r="2"/><path d="M10 21l2-6-3-3 3-5 4 3h3M6 12l3-4"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    palette: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1.2"/><circle cx="12" cy="7.5" r="1.2"/><circle cx="16" cy="10" r="1.2"/>',
    wrench: '<path d="M14 7a4 4 0 0 0 5 5l-9 9-3-3 9-9a4 4 0 0 1-2-2z"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    ball: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    shirt: '<path d="M8 3 3 6l2 4 3-1v12h8V9l3 1 2-4-5-3a4 4 0 0 1-8 0z"/>',
    pin: '<path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  };
  const svg = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${I[k] || ""}</svg>`;

  // Element helpers: T toggle, S slider, D dropdown, B button, V stat, L label.
  const T = (name, desc, on, drives) => ({ t: "toggle", name, desc, on: !!on, drives });
  const S = (name, min, max, val, suf) => ({ t: "slider", name, min, max, val, suf: suf || "" });
  const D = (name, opts, val) => ({ t: "dropdown", name, opts, val: val || opts[0] });
  const B = (name, toast) => ({ t: "button", name, toast });
  const V = (name, live, val) => ({ t: "stat", name, live, val });
  const L = (text) => ({ t: "label", text });

  const GAMES = {
    aba: { title: "Anime Battle Arena", tabs: [
      { name: "Combat", icon: "swords", secs: [
        ["M1 Trade", [L("Answers an incoming M1 the moment its swing starts."), T("Auto M1 Trade", "Blocks their hit, counters before the next one", false, "trade"),
          D("Response Mode", ["Smart", "Trade", "Block"]), S("Hold Block", 150, 400, 205, " ms"), D("Finisher (5th hit)", ["Dodge", "Block", "Trade"]),
          T("Trade Dash M1s", "Catches dash-M1s from up to 30 studs", true), V("Trades", "trade", "none yet"), B("Reset Learned M1s", "forgot 0 learned M1s")]],
        ["Parry / Block / Dodge", [T("Auto Parry", "Timed tap of F"), T("Auto Block", "Fallback for anything trade skips"), T("Auto Dodge", "Q on incoming swings"), S("Hit Chance", 0, 100, 100, "%")]],
      ]},
      { name: "Aim", icon: "target", secs: [
        ["Lock On", [T("Lock On", "Turns you toward the target"), D("Activate", ["Hold RMB", "Always"]), D("Lock Mode", ["Character", "Camera", "Both"]), D("Priority", ["Closest", "Lowest HP", "Crosshair"]), S("Lock Range", 5, 150, 60, " studs")]],
        ["Mahoraga Aim (Sukuna)", [T("Mahoraga Aim", "Keeps your M1s aimed at the nearest enemy"), D("Mahoraga Mode", ["Hold M1", "Auto"])]],
        ["Auto Headride", [T("Auto Headride", "Stands you on their head, M1s swing under you", false, "ride"), T("Ride Dummies", "Practice on the training dummies"), D("Headride Mode", ["Hold", "Always"]), D("Headride Key", ["T", "H", "G", "X", "ButtonR3"]), S("Height Above Head", 1, 8, 3, " studs"), V("Headride", "ride", "off")]],
      ]},
      { name: "Timing", icon: "timer", secs: [
        ["Timed checks", [T("Auto Nanami Cut", "Clicks at 0.7 on the bar"), T("Auto Kokushibo", "Right-click check, random point in the window", false, "koku"), S("Kokushibo Hit Chance", 0, 100, 100, "%"), T("Tengen Auto Osu", "Hits the rhythm circles on move 3", false, "osu"), S("Osu Hit Chance", 0, 100, 100, "%"), V("Landed", "osu", "0 / 0")]],
      ]},
      { name: "Characters", icon: "user", secs: [
        ["Auto Variants", [L("Pick a variant once and the move casts it straight away."), T("Auto Variants", "Aizen, Yhwach, Neferpitou", true), D("Move 2 (Aizen)", ["Menu", "1. True Power", "2. Complete Swap", "3. Bakudo Trick", "4. Replace Self"], "2. Complete Swap"), D("Move 3 (Aizen)", ["Menu", "1. Kurohitsugi", "2. Raikoho", "3. Shitotsu Sansen", "4. Danku"], "2. Raikoho")]],
        ["Built-in Techs", [D("Tech", ["Accel + Contender", "Accel + Knife", "Accel + Rapid Fire", "Rapid Fire Tech"]), D("Tech Key", ["Z", "X", "C", "DPadDown"]), B("Bind Tech", "Accel + Contender -> Z"), B("Run Selected", "Accel + Contender: done")]],
      ]},
      { name: "Macros", icon: "film", secs: [["Record", [B("Record", "recording... close the menu and do the combo"), B("Stop Recording", "recorded 14 inputs"), D("Play / Stop Key", ["V", "X", "Z", "ButtonR3"]), T("Loop", "Repeat until stopped")]]] },
      { name: "Farm", icon: "sprout", secs: [["Auto Farm", [T("Auto Farm", "Sprints in, five-hit chain, then your moves", false, "farm"), D("Targets", ["Both", "Players", "NPCs"]), S("M1s Before a Move", 1, 5, 5), T("Sprint", "", true), T("Use M1 Trade", "", true), V("Farm", "farm", "idle")]]] },
      { name: "Movement", icon: "run", secs: [
        ["Movement", [T("Speed Hack"), S("Speed", 16, 60, 24), T("Infinite Jump"), T("Fly"), T("Noclip"), T("Anti Stun", "Walk while stunned")]],
        ["Special", [D("Dodge Style", ["None", "Wuxian", "Mob", "Geppo", "Flashstep", "MUI", "Raiden", "Kiritsugu"]), T("Vigilante Float"), T("Gojo Blue Buff"), T("Dash Spam (Natsu / Bakugo)")]],
      ]},
      { name: "ESP", icon: "eye", secs: [["Players", [T("Boxes", "", true), T("Names", "", true), T("Health Bars"), T("Tracers"), S("Max Distance", 50, 1000, 400, " studs")]]] },
      { name: "Misc", icon: "wrench", secs: [["Utility", [T("Anti-AFK", "", true), T("Anti Confusion"), T("Reveal Claymores"), T("Anti Subway"), D("Controller: Open Menu", ["ButtonR3", "ButtonL3", "ButtonSelect", "Off"]), B("Unload Hub", "[TeekHub] unloaded")]]] },
      { name: "Interface", icon: "sliders", themes: true },
    ]},
    rh2: { title: "RH2 The Journey", tabs: [
      { name: "Auto Green", icon: "ball", secs: [
        ["Auto Green", [T("Auto Green", "Releases on the green for every shot", false, "green"), T("Hold Mode", "Hold the shot, it lets go on time", true), T("Live Window", "Reads the window each shot"), T("Smart Cancel Acro (BETA)")]],
        ["Layups and dunks", [T("Time Layups", "", true), T("Time Dunks", "", true)]],
        ["Shot Feedback", [T("Shot Feedback", "Card after every shot", true), B("Preview the Card", "Jumper · 76 · PERFECT · open"), V("This Session", "green", "0 / 0")]],
        ["Calibrate", [B("Apply what the game says", "release points updated")]],
      ]},
      { name: "Player", icon: "run", secs: [["Player", [T("Infinite Stamina"), T("Dribble Speed"), T("Safe Mode", "", true), T("Dribble Glide"), T("Ball Magnet"), T("TP Walk"), T("FPS Boost")]], ["Name Spoof", [T("Hide My Name"), T("Hide Everyone's Names")]]] },
      { name: "Cosmetics", icon: "shirt", secs: [["Look", [D("Shoes", ["Default", "Retro 1", "Foam", "Slides"]), D("Mascot", ["None", "Eagle", "Tiger", "Bear"]), D("Green Effect", ["None", "Lightning", "Fire", "Galaxy"]), D("Ball Trail", ["None", "Ice", "Flame"]), D("Jumpshot Speed", ["Normal", "Quick", "Slow"]), B("Put my own look back", "restored your look")]]] },
      { name: "Teleport", icon: "pin", secs: [["Go somewhere", [D("Place", ["Park", "Gym", "Court 1", "Shop"]), B("Teleport", "teleported")]]] },
      { name: "Interface", icon: "sliders", themes: true },
    ]},
    ps2: { title: "Project Slayers 2", tabs: [
      { name: "Farm", icon: "sprout", secs: [["Farm", [T("Mob Farm", "", false, "mob"), T("Boss Farm"), T("Auto Quest"), T("Use Skills", "", true), T("Loot Chests", "", true), V("Status", "mob", "idle")]]] },
      { name: "Combat", icon: "swords", secs: [["Combat", [T("Kill Aura"), S("Aura Range", 5, 40, 15, " studs"), B("Clan Reroll", "rolled: Kamado"), B("Race Reroll", "rolled: Human")]]] },
      { name: "ESP", icon: "eye", secs: [["Show", [T("Players", "", true), T("Bosses", "", true), T("Chests"), T("Crystals"), T("Shrines"), T("Spider Lilies")]]] },
      { name: "Movement", icon: "run", secs: [["Movement", [T("Fly"), T("Speed"), T("Noclip"), T("Infinite Stamina"), T("No Slow"), T("Walk on Water")]], ["Safety", [T("Staff Join Alert", "", true), T("Auto Retreat"), T("Auto Rejoin")]]] },
      { name: "Interface", icon: "sliders", themes: true },
    ]},
  };

  const $ = (sel, el = root) => el.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let game = "aba", tab = 0, theme = "Tempo", query = "";
  const live = {};   // drives key -> on/off

  function applyTheme(name) {
    theme = name;
    const row = THEMES[name];
    const hub = $(".hub");
    VARS.forEach((v, i) => hub.style.setProperty("--h-" + v, row[i]));
    // Text on the dark selected-tab and button fill: on Sin (black on white)
    // that fill is near-black, so its text turns white.
    hub.style.setProperty("--h-onbtn", name === "Sin" ? "#FFFFFF" : row[9]);
  }

  function toast(text) {
    const box = $(".hub-toasts");
    const t = document.createElement("div");
    t.className = "hub-toast"; t.textContent = text;
    box.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  function elHTML(e, id) {
    const lbl = (extra) => `<div class="lbl"><b>${esc(e.name)}</b>${e.desc ? `<small>${esc(e.desc)}</small>` : ""}${extra || ""}</div>`;
    if (e.t === "label") return `<div class="hub-note">${esc(e.text)}</div>`;
    if (e.t === "toggle") return `<div class="hub-el">${lbl()}<button class="hub-sw" role="switch" aria-checked="${e.on}" aria-label="${esc(e.name)}" data-id="${id}"></button></div>`;
    if (e.t === "slider") return `<div class="hub-el">${lbl()}<div class="hub-sl"><input type="range" min="${e.min}" max="${e.max}" value="${e.val}" data-id="${id}" aria-label="${esc(e.name)}"><output>${e.val}${esc(e.suf)}</output></div></div>`;
    if (e.t === "dropdown") return `<div class="hub-el">${lbl()}<div class="hub-dd"><button data-id="${id}" aria-haspopup="listbox">${esc(e.val)}</button></div></div>`;
    if (e.t === "button") return `<div class="hub-el">${lbl()}<button class="hub-btn" data-id="${id}">Run</button></div>`;
    if (e.t === "stat") return `<div class="hub-el">${lbl()}<span class="hub-stat" data-live="${e.live}">${esc(e.val)}</span></div>`;
    return "";
  }

  let flat = [];
  function render() {
    const g = GAMES[game];
    $(".hub-top .tt span").textContent = g.title + "  -  v6";
    $(".hub-tabs").innerHTML = g.tabs.map((t, i) => `<button class="hub-tab${i === tab ? " on" : ""}" data-tab="${i}">${svg(t.icon)}${esc(t.name)}</button>`).join("");
    const main = $(".hub-main");
    flat = [];
    const q = query.trim().toLowerCase();
    const tabs = q ? g.tabs : [g.tabs[tab]];
    let html = q ? `<h4>Search: ${esc(query)}</h4>` : `<h4>${esc(g.tabs[tab].name)}</h4>`;
    let any = false;
    for (const t of tabs) {
      if (t.themes) {
        if (q && !"theme interface".includes(q)) continue;
        any = true;
        html += `<div class="hub-sec">Theme</div><div class="hub-themes">` + Object.keys(THEMES).map((n) =>
          `<button data-theme="${n}" class="${n === theme ? "on" : ""}"><i style="background:${THEMES[n][6]}"></i>${n}</button>`).join("") + `</div>`;
        continue;
      }
      for (const [sec, items] of t.secs) {
        const shown = items.filter((e) => !q || (e.name || e.text || "").toLowerCase().includes(q));
        if (!shown.length) continue;
        any = true;
        html += `<div class="hub-sec">${esc(sec)}</div>`;
        for (const e of shown) { flat.push(e); html += elHTML(e, flat.length - 1); }
      }
    }
    if (!any) html += `<div class="hub-empty">Nothing matches "${esc(query)}".</div>`;
    main.innerHTML = html;
    main.scrollTop = 0;
    paintLive();
  }

  // ---- live bits: what a switched-on feature would show in its stat line
  const counters = { trade: [0, 0], osu: [0, 0], green: [0, 0], farm: 0, ride: 0, mob: 0, koku: 0 };
  function paintLive() {
    const set = (k, v) => root.querySelectorAll(`[data-live="${k}"]`).forEach((s) => s.textContent = v);
    set("trade", live.trade ? `${counters.trade[0]} traded · ${counters.trade[1]} blocked` : "none yet");
    set("osu", `${counters.osu[0]} / ${counters.osu[1]}`);
    set("green", `${counters.green[0]} / ${counters.green[1]} PERFECT`);
    set("farm", live.farm ? ["combo: M1 1/5", "combo: M1 3/5", "combo: M1 5/5", "combo: move 2 (casting)"][counters.farm % 4] : "idle");
    set("ride", live.ride ? "riding Stun Dummy" : "off");
    set("mob", live.mob ? ["farming Demon (lv 40)", "looting chest", "farming Demon (lv 41)"][counters.mob % 3] : "idle");
  }
  setInterval(() => {
    if (live.trade) { if (Math.random() < 0.8) counters.trade[0]++; else counters.trade[1]++; }
    if (live.osu) { counters.osu[0]++; counters.osu[1]++; }
    if (live.green) { counters.green[1]++; counters.green[0]++; if (counters.green[1] % 3 === 0) toast("PERFECT · jumper · released at 74"); }
    if (live.farm) counters.farm++;
    if (live.mob) counters.mob++;
    paintLive();
  }, 1400);

  // ---- input
  root.addEventListener("click", (ev) => {
    const b = ev.target.closest("button");
    if (!b || !root.contains(b)) return;
    if (b.dataset.game) {
      game = b.dataset.game; tab = 0; query = ""; $(".hub-search").value = "";
      root.querySelectorAll(".hubgames button").forEach((x) => x.classList.toggle("on", x === b));
      closeDD(); render(); return;
    }
    if (b.dataset.tab) { tab = +b.dataset.tab; query = ""; $(".hub-search").value = ""; closeDD(); render(); return; }
    if (b.dataset.theme) { applyTheme(b.dataset.theme); render(); toast("theme: " + b.dataset.theme); return; }
    if (b.dataset.pick !== undefined) {
      const e = flat[+b.dataset.for]; e.val = b.dataset.pick; closeDD(); render(); toast(`${e.name}: ${e.val}`); return;
    }
    const id = b.dataset.id;
    if (id === undefined) return;
    const e = flat[+id];
    if (e.t === "toggle") {
      e.on = !e.on; b.setAttribute("aria-checked", e.on);
      if (e.drives) { live[e.drives] = e.on; paintLive(); }
      toast(`${e.name} ${e.on ? "on" : "off"}`);
    } else if (e.t === "button") {
      toast(e.toast || e.name);
    } else if (e.t === "dropdown") {
      const open = b.parentElement.querySelector("ul");
      closeDD();
      if (open) return;
      const ul = document.createElement("ul");
      ul.setAttribute("role", "listbox");
      ul.innerHTML = e.opts.map((o) => `<li><button data-pick="${esc(o)}" data-for="${id}" class="${o === e.val ? "on" : ""}">${esc(o)}</button></li>`).join("");
      b.parentElement.appendChild(ul);
    }
  });
  function closeDD() { root.querySelectorAll(".hub-dd ul").forEach((u) => u.remove()); }
  document.addEventListener("click", (ev) => { if (!ev.target.closest(".hub-dd")) closeDD(); });
  root.addEventListener("input", (ev) => {
    if (ev.target.matches(".hub-search")) { query = ev.target.value; render(); return; }
    const r = ev.target.closest('input[type="range"]');
    if (!r) return;
    const e = flat[+r.dataset.id]; e.val = r.value;
    r.nextElementSibling.textContent = r.value + e.suf;
  });
  // The close and minimise dots do what they do in game: the hub goes away and
  // comes back.
  $(".hub-top .win").addEventListener("click", () => toast("in game: K (or R3 on a controller) opens it again"));

  applyTheme("Tempo");
  render();
})();
