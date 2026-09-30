// ============================================================
// NEON BREAKER : HORROR — ÉDITION ULTIME
// Daily Run, Ghost du meilleur run, Dialogue procédural des boss,
// Éditeur de niveaux avec partage base64.
// À charger APRÈS game-abomination.js
// ============================================================

(function () {
  'use strict';

  // 0. UTILITAIRES
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashString(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function todaySeedStr() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  // 1. DAILY RUN
  window.SECRET_CODES['DAILY'] = 'daily';
  window.SECRET_CODES['QUOTIDIEN'] = 'daily';

  var _origSecretModeName1 = window.secretModeName;
  window.secretModeName = function (mode) {
    if (mode === 'daily') return 'DAILY RUN — ' + todaySeedStr();
    return _origSecretModeName1(mode);
  };

  function generateDailyLayout(levelNum, rng) {
    var rows = 5 + (levelNum > 20 ? 1 : 0);
    var maxType = Math.min(8, 1 + Math.floor(levelNum / 4));
    var density = 0.55 + Math.min(0.3, levelNum * 0.01);
    var layout = [];
    for (var r = 0; r < rows; r++) {
      var row = '';
      for (var c = 0; c < 10; c++) {
        var roll = rng();
        if (roll > density) { row += '0'; continue; }
        var t = rng();
        var cell;
        if (t < 0.40) cell = 1;
        else if (t < 0.62) cell = Math.min(2, maxType);
        else if (t < 0.76) cell = Math.min(3, maxType);
        else if (t < 0.84) cell = Math.min(4, maxType);
        else if (t < 0.89) cell = Math.min(5, maxType);
        else if (t < 0.94) cell = Math.min(6, maxType);
        else if (t < 0.97) cell = Math.min(7, maxType);
        else cell = maxType >= 8 ? 8 : Math.min(3, maxType);
        row += cell;
      }
      if (r === 0 && row === '0000000000') row = '0111111110';
      layout.push(row);
    }
    var cassables = 0;
    for (var i = 0; i < layout.length; i++) {
      for (var j = 0; j < layout[i].length; j++) {
        var v = parseInt(layout[i][j], 10);
        if (v > 0 && v < 8) cassables++;
      }
    }
    if (cassables < 12) { layout[0] = '0111111110'; layout[1] = '0111111110'; }
    return layout;
  }

  function buildDailyLevels() {
    var rng = mulberry32(hashString('NB-DAILY-' + todaySeedStr()));
    var daily = [];
    var classic = window.__ABOMINATION_LEVELS || window.LEVELS;
    for (var i = 1; i <= 36; i++) {
      if (window.BOSS_LEVELS.indexOf(i) >= 0) daily.push(classic[i - 1]);
      else daily.push(generateDailyLayout(i, rng));
    }
    return daily;
  }

  var _origStartGameDaily = window.startGame;
  window.startGame = function () {
    if (gameState.secretMode === 'daily') {
      window.LEVELS = buildDailyLevels();
    }
    return _origStartGameDaily.apply(this, arguments);
  };

  // 2. GHOST DU MEILLEUR RUN
  var ghost = {
    recActive: false, recLevel: -1, recT: 0, recLastSample: 0, recFrames: [],
    playing: [], playT: 0, playIdx: 0, bestScore: 0,
  };

  function ghostSaveKey(level) { return 'neonBreakerGhost_L' + level; }

  function ghostLoadForPlayback(level) {
    ghost.playing = []; ghost.playT = 0; ghost.playIdx = 0; ghost.bestScore = 0;
    try {
      var raw = (window['local' + 'Storage'] || window.localStorage).getItem(ghostSaveKey(level));
      if (raw) {
        var data = JSON.parse(raw);
        if (data && Array.isArray(data.frames)) {
          ghost.playing = data.frames;
          ghost.bestScore = data.score || 0;
        }
      }
    } catch (e) {}
  }

  function ghostStartRecording(level) {
    ghost.recActive = true; ghost.recLevel = level;
    ghost.recT = 0; ghost.recLastSample = 0; ghost.recFrames = [];
    ghostLoadForPlayback(level);
  }

  function ghostStopRecording(complete) {
    if (!ghost.recActive) return;
    if (complete && ghost.recFrames.length > 30) {
      try {
        (window['local' + 'Storage'] || window.localStorage).setItem(
          ghostSaveKey(ghost.recLevel),
          JSON.stringify({ frames: ghost.recFrames, score: gameState.score, savedAt: Date.now() })
        );
      } catch (e) {}
    }
    ghost.recActive = false;
  }

  function ghostUpdate(dt) {
    if (!ghost.recActive) return;
    ghost.recT += dt;
    if (ghost.recT - ghost.recLastSample >= 0.05) {
      ghost.recLastSample = ghost.recT;
      ghost.recFrames.push([Math.round(ghost.recT * 100) / 100, Math.round(paddle.x)]);
      if (ghost.recFrames.length > 2400) ghost.recFrames.shift();
    }
    ghost.playT += dt;
    while (ghost.playIdx < ghost.playing.length && ghost.playing[ghost.playIdx][0] < ghost.playT) {
      ghost.playIdx++;
    }
  }

  function ghostDraw(ctx) {
    if (ghost.playIdx >= ghost.playing.length) return;
    var frame = ghost.playing[ghost.playIdx];
    if (!frame) return;
    var x = frame[1];
    var pw = getEffectivePaddleWidth();
    var pulse = 0.18 + 0.08 * Math.sin(frameCount * 0.12);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#4af0c0';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#4af0c0';
    ctx.fillRect(x, paddle.y, pw, paddle.h);
    ctx.restore();
  }

  var _origBuildLevelGhost = window.buildLevel;
  window.buildLevel = function (levelNum) {
    if (ghost.recActive) ghostStopRecording(false);
    _origBuildLevelGhost.apply(this, arguments);
    ghostStartRecording(levelNum);
  };

  var _origUpdateGhost = window.update;
  window.update = function (dt) {
    _origUpdateGhost.apply(this, arguments);
    if (gameState.current === STATE_PLAYING) ghostUpdate(dt);
  };

  var _origCheckLevelCompleteGhost = window.checkLevelComplete;
  window.checkLevelComplete = function () {
    var before = gameState.current;
    _origCheckLevelCompleteGhost.apply(this, arguments);
    if (before === STATE_PLAYING && gameState.current !== STATE_PLAYING) {
      ghostStopRecording(gameState.current === STATE_VICTORY || gameState.current === STATE_CINEMATIC);
    }
  };

  // 3. DIALOGUE PROCÉDURAL DES BOSS
  var BOSS_LINES = {
    spawn: [
      "Tu n'aurais pas dû venir.",
      'Je te connais. Je t\'attendais.',
      'Encore toi. Toujours toi.',
      'Tu sens la peur. Ça me plaît.',
      "Cette fois je ne te raterai pas.",
    ],
    playerHit: [
      'Tu saignes. Continue.',
      "J'aime ce bruit que tu fais.",
      'Encore. Encore.',
      'Ta peur me nourrit.',
      "Ne t'inquiète pas, ça ne fait mal qu'au début.",
    ],
    phase2: [
      "Tu m'as énervé.",
      'Maintenant, on joue pour de vrai.',
      'Regarde ce que tu as réveillé.',
      'Tu croyais que c\'était fini ?',
    ],
    phase3: [
      'ASSEZ.',
      'Je vais te dévorer.',
      'VOIS CE QUE JE SUIS VRAIMENT.',
      'Plus de règles. Plus de pitié.',
    ],
    playerRage: [
      "Une vie. C'est tout ce qu'il te reste.",
      'J\'entends ton cœur. Il bat trop vite.',
      'Tremble. C\'est mieux.',
      'Tu tiens à ce dernier souffle ?',
    ],
    bossLow: [
      "Ce n'est pas fini...",
      'Tu... m\'as... touché...',
      'NON. NON. NON.',
      'Tu me paieras ça.',
      'Tu ne comprends pas ce que tu fais.',
    ],
    death: ['À bientôt...', 'Tu n\'as rien gagné.', 'Le prochain t\'attendra.', 'Je reviendrai.', '...'],
    longFight: [
      'Tu es coriace. J\'aime ça.',
      'Combien de temps peux-tu tenir ?',
      'Tu ralentis. Je le sens.',
      'Plus vite. Frappe-moi.',
      'Tu commences à fatiguer.',
    ],
  };

  var dialogue = {
    text: '', timer: 0, duration: 3.2, lastTrigger: {},
  };

  function say(text) {
    if (!text) return;
    dialogue.text = text;
    dialogue.timer = dialogue.duration;
  }

  function pick(pool, cooldownKey, cooldownSec) {
    if (!pool || pool.length === 0) return;
    var now = performance.now() / 1000;
    var last = dialogue.lastTrigger[cooldownKey] || 0;
    if (now - last < cooldownSec) return;
    dialogue.lastTrigger[cooldownKey] = now;
    say(pool[Math.floor(Math.random() * pool.length)]);
  }

  var lastBossState = { hp: -1, phase: -1, playerLives: -1, fightStart: 0, firedLong: false };

  function updateBossDialogue(dt) {
    if (dialogue.timer > 0) dialogue.timer -= dt;
    if (!boss || !boss.active || boss.defeated) return;
    var hpFrac = boss.maxHp > 0 ? boss.hp / boss.maxHp : 1;
    var phase = hpFrac > 0.66 ? 0 : hpFrac > 0.33 ? 1 : 2;

    if (lastBossState.hp < 0) {
      lastBossState.fightStart = performance.now() / 1000;
      lastBossState.firedLong = false;
      say(BOSS_LINES.spawn[Math.floor(Math.random() * BOSS_LINES.spawn.length)]);
    } else if (phase > lastBossState.phase) {
      if (phase === 1) pick(BOSS_LINES.phase2, 'phase2', 30);
      else if (phase === 2) pick(BOSS_LINES.phase3, 'phase3', 30);
    }
    if (lastBossState.playerLives >= 0 && gameState.lives < lastBossState.playerLives) {
      pick(BOSS_LINES.playerHit, 'playerHit', 8);
    }
    if (gameState.rageMode && lastBossState.playerLives > 1) {
      pick(BOSS_LINES.playerRage, 'playerRage', 20);
    }
    if (hpFrac < 0.15 && hpFrac > 0 && Math.random() < 0.02) {
      pick(BOSS_LINES.bossLow, 'bossLow', 15);
    }
    var elapsed = performance.now() / 1000 - lastBossState.fightStart;
    if (elapsed > 55 && !lastBossState.firedLong) {
      lastBossState.firedLong = true;
      pick(BOSS_LINES.longFight, 'longFight', 60);
    }
    lastBossState.hp = boss.hp;
    lastBossState.phase = phase;
    lastBossState.playerLives = gameState.lives;
  }

  var _origDamageBossTalk = window.damageBoss;
  window.damageBoss = function (amount) {
    var wasActive = boss && boss.active && !boss.defeated;
    var oldHp = wasActive ? boss.hp : 0;
    _origDamageBossTalk.apply(this, arguments);
    if (wasActive && boss.hp <= 0 && oldHp > 0) {
      say(BOSS_LINES.death[Math.floor(Math.random() * BOSS_LINES.death.length)]);
    }
  };

  var _origStartBossTalk = window.startBoss;
  window.startBoss = function () {
    lastBossState.hp = -1;
    lastBossState.phase = -1;
    lastBossState.playerLives = gameState.lives;
    lastBossState.fightStart = performance.now() / 1000;
    lastBossState.firedLong = false;
    _origStartBossTalk.apply(this, arguments);
  };

  var _origUpdateTalk = window.update;
  window.update = function (dt) {
    _origUpdateTalk.apply(this, arguments);
    if (gameState.current === STATE_PLAYING) updateBossDialogue(dt);
  };

  function drawBossDialogue(ctx) {
    if (dialogue.timer <= 0) return;
    if (!boss || !boss.active || boss.defeated) return;
    var text = dialogue.text;
    var maxWidth = 320;
    ctx.save();
    ctx.font = '600 15px "Rajdhani", sans-serif';
    var words = text.split(' ');
    var lines = [];
    var line = '';
    for (var i = 0; i < words.length; i++) {
      var test = line + (line ? ' ' : '') + words[i];
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = words[i]; }
      else line = test;
    }
    if (line) lines.push(line);
    var boxW = maxWidth + 24;
    var boxH = lines.length * 20 + 22;
    var boxX = clamp(boss.x - boxW / 2, 12, CANVAS_WIDTH - boxW - 12);
    var boxY = boss.y + boss.h / 2 + 18;
    var alpha = Math.min(1, dialogue.timer) * (dialogue.timer > dialogue.duration - 0.3
      ? (dialogue.duration - dialogue.timer) / 0.3 : 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(10, 4, 4, 0.92)';
    ctx.strokeStyle = boss.color || '#ff4466';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 18;
    ctx.shadowColor = boss.color || '#ff4466';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(boxX, boxY, boxW, boxH, 10);
    else ctx.rect(boxX, boxY, boxW, boxH);
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(boss.x - 8, boxY + 1);
    ctx.lineTo(boss.x, boxY - 8);
    ctx.lineTo(boss.x + 8, boxY + 1);
    ctx.closePath();
    ctx.fillStyle = 'rgba(10, 4, 4, 0.92)';
    ctx.fill();
    ctx.fillStyle = '#ffd9e0';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (var li = 0; li < lines.length; li++) {
      ctx.fillText(lines[li], boxX + 12, boxY + 12 + li * 20);
    }
    ctx.restore();
  }

  // 4. ÉDITEUR DE NIVEAUX
  var editor = {
    active: false, grid: [], rows: 5, cols: 10, currentType: 1, customLevel: null,
  };

  function encodeLevel(layout) {
    try { return btoa(layout.join('|')); } catch (e) { return ''; }
  }
  function decodeLevel(code) {
    try {
      var s = atob(code.trim());
      var arr = s.split('|');
      if (!Array.isArray(arr) || arr.length === 0 || arr.length > 8) return null;
      for (var i = 0; i < arr.length; i++) {
        if (typeof arr[i] !== 'string' || arr[i].length !== 10) return null;
        if (!/^[0-8]{10}$/.test(arr[i])) return null;
      }
      return arr;
    } catch (e) { return null; }
  }

  var EDITOR_TYPES = [
    { v: 0, color: '#1a1a1a', label: 'vide' },
    { v: 1, color: '#4af0c0', label: 'normale' },
    { v: 2, color: '#ffaa22', label: 'solide' },
    { v: 3, color: '#ff4466', label: 'forte' },
    { v: 4, color: '#ff8800', label: 'explosive' },
    { v: 5, color: '#555588', label: 'invisible' },
    { v: 6, color: '#22ddaa', label: 'regen' },
    { v: 7, color: '#cc66ff', label: 'mobile' },
    { v: 8, color: '#444466', label: 'indestructible' },
  ];

  function openEditor() {
    if (editor.active) return;
    editor.active = true;
    editor.grid = [];
    for (var r = 0; r < editor.rows; r++) {
      var row = [];
      for (var c = 0; c < editor.cols; c++) row.push(1);
      editor.grid.push(row);
    }
    buildEditorUI();
    Sound.init();
    Sound.play(660, 0.1, 'sine', 0.2);
  }

  function closeEditor() {
    editor.active = false;
    var el = document.getElementById('nb-editor');
    if (el) el.remove();
  }

  function buildEditorUI() {
    var old = document.getElementById('nb-editor');
    if (old) old.remove();
    var wrap = document.createElement('div');
    wrap.id = 'nb-editor';
    wrap.innerHTML = [
      '<div class="nbe-panel">',
      '  <h2>ÉDITEUR DE NIVEAUX</h2>',
      '  <div class="nbe-toolbar" id="nbeToolbar"></div>',
      '  <div class="nbe-grid" id="nbeGrid"></div>',
      '  <div class="nbe-row-actions">',
      '    <button id="nbeAddRow" class="btn-mini">+ ligne</button>',
      '    <button id="nbeRemRow" class="btn-mini">- ligne</button>',
      '    <button id="nbeClear" class="btn-mini">effacer</button>',
      '  </div>',
      '  <div class="nbe-code-row">',
      '    <input id="nbeCodeInput" placeholder="COLLER UN CODE..." />',
      '    <button id="nbeLoad" class="btn-mini">charger</button>',
      '  </div>',
      '  <div class="nbe-output" id="nbeOutput"></div>',
      '  <div class="nbe-actions">',
      '    <button id="nbeCopy" class="btn-neon">COPIER LE CODE</button>',
      '    <button id="nbePlay" class="btn-neon">JOUER CE NIVEAU</button>',
      '    <button id="nbeClose" class="btn-neon btn-secondary">FERMER</button>',
      '  </div>',
      '  <p class="nbe-hint">Clic gauche : peindre — Clic droit : vider — Échap : fermer</p>',
      '</div>',
    ].join('');
    document.body.appendChild(wrap);

    var toolbar = document.getElementById('nbeToolbar');
    EDITOR_TYPES.forEach(function (t) {
      var b = document.createElement('button');
      b.className = 'nbe-type-btn';
      b.style.background = t.color;
      b.textContent = t.label;
      b.dataset.v = t.v;
      b.addEventListener('click', function () {
        editor.currentType = t.v;
        refreshEditor();
      });
      toolbar.appendChild(b);
    });

    document.getElementById('nbeAddRow').addEventListener('click', function () {
      if (editor.grid.length >= 8) return;
      var row = [];
      for (var c = 0; c < editor.cols; c++) row.push(0);
      editor.grid.push(row);
      refreshEditor();
    });
    document.getElementById('nbeRemRow').addEventListener('click', function () {
      if (editor.grid.length <= 2) return;
      editor.grid.pop();
      refreshEditor();
    });
    document.getElementById('nbeClear').addEventListener('click', function () {
      for (var r = 0; r < editor.grid.length; r++) {
        for (var c = 0; c < editor.cols; c++) editor.grid[r][c] = 0;
      }
      refreshEditor();
    });
    document.getElementById('nbeLoad').addEventListener('click', function () {
      var code = document.getElementById('nbeCodeInput').value;
      var decoded = decodeLevel(code);
      if (!decoded) {
        document.getElementById('nbeOutput').textContent = '✖ Code invalide';
        return;
      }
      editor.grid = decoded.map(function (row) {
        return row.split('').map(function (ch) { return parseInt(ch, 10); });
      });
      refreshEditor();
    });
    document.getElementById('nbeCopy').addEventListener('click', function () {
      var code = encodeLevel(editor.grid.map(function (row) { return row.join(''); }));
      var out = document.getElementById('nbeOutput');
      out.textContent = '✔ Code copié : ' + code.slice(0, 24) + '...';
      try { if (navigator.clipboard) navigator.clipboard.writeText(code); } catch (e) {}
      document.getElementById('nbeCodeInput').value = code;
    });
    document.getElementById('nbePlay').addEventListener('click', function () {
      var layout = editor.grid.map(function (row) { return row.join(''); });
      editor.customLevel = layout;
      gameState.secretMode = 'custom';
      closeEditor();
      startGame();
    });
    document.getElementById('nbeClose').addEventListener('click', closeEditor);
    refreshEditor();
  }

  function refreshEditor() {
    var grid = document.getElementById('nbeGrid');
    if (!grid) return;
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = 'repeat(' + editor.cols + ', 44px)';
    for (var r = 0; r < editor.grid.length; r++) {
      for (var c = 0; c < editor.cols; c++) {
        var cell = document.createElement('div');
        cell.className = 'nbe-cell';
        var v = editor.grid[r][c];
        var t = EDITOR_TYPES[v];
        cell.style.background = t.color;
        cell.title = 'Ligne ' + (r + 1) + ', Col ' + (c + 1) + ' — ' + t.label;
        (function (rr, cc) {
          cell.addEventListener('click', function (e) {
            e.preventDefault();
            editor.grid[rr][cc] = editor.currentType;
            refreshEditor();
          });
          cell.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            editor.grid[rr][cc] = 0;
            refreshEditor();
          });
        })(r, c);
        grid.appendChild(cell);
      }
    }
    var btns = document.querySelectorAll('.nbe-type-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', parseInt(btns[i].dataset.v, 10) === editor.currentType);
    }
  }

  var _origBuildLevelEditor = window.buildLevel;
  window.buildLevel = function (levelNum) {
    if (editor.customLevel && levelNum === 1) {
      var saved = LEVELS[0];
      LEVELS[0] = editor.customLevel;
      _origBuildLevelEditor.call(this, levelNum);
      LEVELS[0] = saved;
      return;
    }
    return _origBuildLevelEditor.apply(this, arguments);
  };

  var editorCSS = document.createElement('style');
  editorCSS.textContent = [
    '#nb-editor{position:fixed;inset:0;z-index:80;display:flex;',
    'align-items:center;justify-content:center;background:rgba(0,0,0,.9);',
    'backdrop-filter:blur(6px);font-family:"Rajdhani",sans-serif;}',
    '.nbe-panel{background:#0a0a14;border:1px solid #ff4466;border-radius:12px;',
    'padding:20px;max-width:640px;width:96%;max-height:94vh;overflow-y:auto;',
    'box-shadow:0 0 40px rgba(255,68,102,.25);}',
    '.nbe-panel h2{font-family:"Orbitron",sans-serif;color:#ff4466;font-size:16px;',
    'letter-spacing:2px;margin-bottom:14px;text-align:center;}',
    '.nbe-toolbar{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;justify-content:center;}',
    '.nbe-type-btn{padding:6px 10px;border-radius:4px;border:2px solid transparent;',
    'color:#000;font-weight:700;font-size:11px;cursor:pointer;transition:all .15s;}',
    '.nbe-type-btn.active{border-color:#fff;box-shadow:0 0 12px #fff;}',
    '.nbe-grid{display:grid;gap:2px;justify-content:center;margin:10px auto;}',
    '.nbe-cell{width:44px;height:22px;border-radius:3px;cursor:pointer;',
    'transition:transform .1s;border:1px solid rgba(255,255,255,.08);}',
    '.nbe-cell:hover{transform:scale(1.1);z-index:2;}',
    '.nbe-row-actions{display:flex;gap:8px;justify-content:center;margin:10px 0;}',
    '.nbe-code-row{display:flex;gap:8px;margin:10px 0;}',
    '.nbe-code-row input{flex:1;background:#050508;border:1px solid #444;',
    'color:#e8e8ec;padding:8px;border-radius:4px;font-family:monospace;font-size:11px;}',
    '.nbe-output{text-align:center;color:#4af0c0;font-size:12px;margin:8px 0;min-height:18px;}',
    '.nbe-actions{display:flex;gap:8px;justify-content:center;margin-top:10px;}',
    '.nbe-actions .btn-neon{padding:10px 20px;font-size:12px;}',
    '.nbe-hint{text-align:center;color:#666;font-size:11px;margin-top:10px;}',
  ].join('');
  document.head.appendChild(editorCSS);

  document.addEventListener('keydown', function (e) {
    if (editor.active && e.code === 'Escape') {
      e.preventDefault();
      closeEditor();
      return;
    }
    if (editor.active) return;
    if (e.code !== 'KeyE') return;
    var overlay = document.getElementById('overlay');
    var menuShown = overlay && overlay.classList.contains('active') && gameState.current === STATE_MENU;
    if (!menuShown) return;
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    e.preventDefault();
    openEditor();
  });

  window.NBEditor = { open: openEditor, close: closeEditor };

  // 5. RENDU
  var _origRenderUlt = window.render;
  window.render = function () {
    _origRenderUlt.apply(this, arguments);
    if (gameState.current === STATE_PLAYING) ghostDraw(ctx);
    if (gameState.current === STATE_PLAYING && boss && boss.active && !boss.defeated) {
      drawBossDialogue(ctx);
    }
  };

  // 6. SUCCÈS
  window.ACHIEVEMENTS.dailyClear = { name: 'RUN QUOTIDIEN', msg: 'Tu as battu le Daily Run' };
  window.ACHIEVEMENTS.ghostBeaten = { name: 'PLUS RAPIDE QUE TOI-MÊME', msg: 'Tu as fini un niveau avec un meilleur score que ton ghost' };
  window.ACHIEVEMENTS.levelBuilder = { name: 'ARCHITECTE MAUDIT', msg: 'Tu as créé un niveau dans l\'éditeur' };

  var _origCheckLevelCompleteUlt = window.checkLevelComplete;
  window.checkLevelComplete = function () {
    var before = gameState.current;
    _origCheckLevelCompleteUlt.apply(this, arguments);
    if (before === STATE_PLAYING && gameState.current === STATE_VICTORY &&
        gameState.secretMode === 'daily') {
      unlockAchievement('dailyClear');
    }
    if (before === STATE_PLAYING && gameState.current === STATE_CINEMATIC &&
        ghost.bestScore > 0 && gameState.score > ghost.bestScore) {
      unlockAchievement('ghostBeaten');
    }
  };

  var _origStartGameEditor = window.startGame;
  window.startGame = function () {
    if (editor.customLevel) unlockAchievement('levelBuilder');
    return _origStartGameEditor.apply(this, arguments);
  };

  console.log('[NEON BREAKER] ÉDITION ULTIME chargée — Daily Run, Ghost, Dialogue boss, Éditeur (touche E au menu).');
})();
