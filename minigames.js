// ============================================================
// NEON BREAKER : HORROR — MINI-JEUX CACHÉS
// 1. LES CATACOMBES  (platformer 2D sombre)  → brique cachée ×3
// 2. VOL NOCTURNE    (flappy bird horrifique) → luminosité mini + son coupé → oiseau
// 3. FACE AU MONSTRE (pong contre LUI)        → taper CAUCHEMAR au menu
// ============================================================

var MINIGAME = {
  active: false,
  type: null,          // 'mario' | 'flappy' | 'pong'
  raf: null,
  lastT: 0,
  t: 0,                // temps de partie
  shake: 0,
  screamerT: 0,        // screamer en cours (> 0 = actif)
  screamerText: '',
  ambientT: 0,         // timer des mini-screamers d'ambiance
  over: false,
  won: false,
  overT: 0,
};

// ---------- Déclencheurs du menu ----------
var menuLuminosity = 100;
var LUMINOSITY_LEVELS = [100, 85, 70, 55, 40];
var lumIdx = 0;
var cauchemarBuffer = '';
var brickClicks = 0;

function applyLuminosity() {
  document.body.style.filter = menuLuminosity < 100
    ? 'brightness(' + (menuLuminosity / 100) + ')'
    : '';
}

function menuIsShown() {
  var ov = document.getElementById('overlay');
  return ov && ov.classList.contains('active') && gameState.current === STATE_MENU;
}

function updateBirdTrigger() {
  var bird = document.getElementById('birdTrigger');
  if (!bird) return;
  // L'oiseau n'apparaît que si tout est sombre et silencieux
  var reveal = menuIsShown() && menuLuminosity <= 40 && Sound.muted;
  bird.classList.toggle('visible', reveal);
}

function setupMiniGameTriggers() {
  brickClicks = 0;
  var brick = document.getElementById('hiddenBrick');
  if (brick) {
    brick.addEventListener('click', function () {
      brickClicks++;
      Sound.init();
      Sound.play(70 + brickClicks * 30, 0.15, 'square', 0.2);
      // La brique se révèle un peu à chaque clic
      brick.style.opacity = String(0.05 + brickClicks * 0.3);
      if (brickClicks >= 3) {
        Sound.play(50, 0.4, 'sawtooth', 0.3);
        startMiniGame('mario');
      }
    });
  }
  var bird = document.getElementById('birdTrigger');
  if (bird) {
    bird.addEventListener('click', function () {
      if (menuLuminosity <= 40 && Sound.muted) startMiniGame('flappy');
    });
  }
  updateBirdTrigger();
}

// Surveille l'état (mute / luminosité) pour révéler l'oiseau
setInterval(function () {
  if (!MINIGAME.active) updateBirdTrigger();
}, 400);

// Clavier global des secrets : luminosité + mot CAUCHEMAR
document.addEventListener('keydown', function (e) {
  if (MINIGAME.active) return;
  if (!menuIsShown()) return;
  var tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  if (e.code === 'ArrowDown') {
    lumIdx = Math.min(LUMINOSITY_LEVELS.length - 1, lumIdx + 1);
    menuLuminosity = LUMINOSITY_LEVELS[lumIdx];
    applyLuminosity();
    updateBirdTrigger();
    return;
  }
  if (e.code === 'ArrowUp') {
    lumIdx = Math.max(0, lumIdx - 1);
    menuLuminosity = LUMINOSITY_LEVELS[lumIdx];
    applyLuminosity();
    updateBirdTrigger();
    return;
  }
  // Mot secret : CAUCHEMAR
  if (e.key && e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
    cauchemarBuffer = (cauchemarBuffer + e.key.toLowerCase()).slice(-10);
    // Le « m » de CAUCHEMAR ne doit pas couper le son (piège du mot)
    if (e.key.toLowerCase() === 'm' && 'cauchemar'.indexOf(cauchemarBuffer) === 0) {
      window.__mgCauchemarTyping = Date.now();
    }
    if (cauchemarBuffer.slice(-9) === 'cauchemar') {
      cauchemarBuffer = '';
      startMiniGame('pong');
    }
  }
});

// ---------- Cycle de vie ----------
function startMiniGame(type) {
  if (MINIGAME.active) return;
  MINIGAME.active = true;
  MINIGAME.type = type;
  MINIGAME.t = 0;
  MINIGAME.shake = 0;
  MINIGAME.screamerT = 0;
  MINIGAME.ambientT = 0;
  MINIGAME.over = false;
  MINIGAME.won = false;
  MINIGAME.overT = 0;
  MINIGAME.lastT = 0;

  // Le menu et le HUD principal disparaissent, la luminosité se rétablit
  hideOverlay();
  var mainHud = document.getElementById('hud');
  if (mainHud) mainHud.style.display = 'none';
  document.body.style.filter = '';
  Sound.init();
  Sound.stopDrone();

  MG_Mario.reset();
  MG_Flappy.reset();
  MG_Pong.reset();

  Sound.play(110, 0.3, 'sawtooth', 0.25);
  MINIGAME.raf = requestAnimationFrame(miniGameLoop);
}

function exitMiniGame() {
  MINIGAME.active = false;
  MINIGAME.type = null;
  if (MINIGAME.raf) cancelAnimationFrame(MINIGAME.raf);
  MINIGAME.raf = null;
  var mainHud2 = document.getElementById('hud');
  if (mainHud2) mainHud2.style.display = '';
  gameState.current = STATE_MENU;
  showOverlay('menu');
  menuLuminosity = 100;
  lumIdx = 0;
  applyLuminosity();
}

function miniGameLoop(timestamp) {
  if (!MINIGAME.active) return;
  if (MINIGAME.lastT === 0) MINIGAME.lastT = timestamp;
  var dt = Math.min((timestamp - MINIGAME.lastT) / 1000, 0.05);
  MINIGAME.lastT = timestamp;
  MINIGAME.t += dt;

  if (MINIGAME.screamerT > 0) MINIGAME.screamerT -= dt;
  if (MINIGAME.shake > 0) {
    MINIGAME.shake *= 0.88;
    if (MINIGAME.shake < 0.3) MINIGAME.shake = 0;
  }

  if (!MINIGAME.over) {
    if (MINIGAME.type === 'mario') MG_Mario.update(dt);
    else if (MINIGAME.type === 'flappy') MG_Flappy.update(dt);
    else if (MINIGAME.type === 'pong') MG_Pong.update(dt);
  } else {
    MINIGAME.overT += dt;
  }

  // Rendu
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(Math.min(window.devicePixelRatio || 1, 2), 0, 0, Math.min(window.devicePixelRatio || 1, 2), 0, 0);
  if (MINIGAME.shake > 0) {
    ctx.translate((Math.random() - 0.5) * MINIGAME.shake, (Math.random() - 0.5) * MINIGAME.shake);
  }
  if (MINIGAME.type === 'mario') MG_Mario.draw(ctx);
  else if (MINIGAME.type === 'flappy') MG_Flappy.draw(ctx);
  else if (MINIGAME.type === 'pong') MG_Pong.draw(ctx);
  drawMiniScreamer(ctx);
  drawMiniHUD(ctx);
  ctx.restore();

  MINIGAME.raf = requestAnimationFrame(miniGameLoop);
}

// ---------- Screamer maison ----------
function mgScare(text, big) {
  MINIGAME.screamerT = big ? 0.9 : 0.35;
  MINIGAME.screamerText = text || '';
  MINIGAME.shake = big ? 30 : 12;
  Sound.init();
  Sound.screamer();
}

function drawMiniScreamer(ctx) {
  if (MINIGAME.screamerT <= 0) return;
  ctx.save();
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawGiantJaws(ctx, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 30 + Math.random() * 40);
  if (MINIGAME.screamerText) {
    ctx.font = '900 52px "Creepster", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = Math.random() > 0.5 ? '#ff2244' : '#ffffff';
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#ff0000';
    ctx.fillText(MINIGAME.screamerText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
  ctx.restore();
}

function drawMiniHUD(ctx) {
  // Échap pour quitter — rappel discret
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.font = '400 12px "Rajdhani", sans-serif';
  ctx.fillStyle = '#aaaabb';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('ÉCHAP : fuir', 10, 10);
  if (MINIGAME.over && MINIGAME.screamerT <= 0) {
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.font = '700 42px "Creepster", cursive';
    ctx.fillStyle = MINIGAME.won ? '#4af0c0' : '#ff2244';
    ctx.shadowBlur = 20;
    ctx.shadowColor = MINIGAME.won ? '#4af0c0' : '#ff0000';
    ctx.fillText(MINIGAME.won ? 'TU T\'ES ÉCHAPPÉ' : 'IL T\'A EU', CANVAS_WIDTH / 2, 240);
    ctx.shadowBlur = 0;
    ctx.font = '400 18px "Rajdhani", sans-serif';
    ctx.fillStyle = '#e8e8ec';
    ctx.fillText(MINIGAME.won ? '' : '[R] réessayer — [ÉCHAP] fuir', CANVAS_WIDTH / 2, 290);
    if (MINIGAME.won) {
      ctx.fillText('[ÉCHAP] revenir au menu', CANVAS_WIDTH / 2, 290);
    }
  }
  ctx.restore();
}

// ---------- Entrées communes ----------
document.addEventListener('keydown', function (e) {
  if (!MINIGAME.active) return;
  var key = (e.key || '').toLowerCase();
  var code = e.code;

  if (code === 'Escape' || key === 'escape') {
    e.preventDefault();
    exitMiniGame();
    return;
  }
  if (MINIGAME.over) {
    if (code === 'KeyR' || key === 'r') {
      if (!MINIGAME.won) {
        var t = MINIGAME.type;
        MINIGAME.over = false;
        MINIGAME.overT = 0;
        MINIGAME.t = 0;
        if (t === 'mario') MG_Mario.reset();
        else if (t === 'flappy') MG_Flappy.reset();
        else if (t === 'pong') MG_Pong.reset();
      }
    }
    return;
  }
  if (e.code === 'Space' || key === ' ' || code === 'ArrowUp') {
    e.preventDefault();
    if (MINIGAME.type === 'mario') MG_Mario.jump();
    else if (MINIGAME.type === 'flappy') MG_Flappy.flap();
  }
  if (MINIGAME.type === 'pong') {
    if (code === 'ArrowUp') MG_Pong.playerDir = -1;
    if (code === 'ArrowDown') MG_Pong.playerDir = 1;
  }
});

document.addEventListener('keyup', function (e) {
  if (!MINIGAME.active) return;
  if (e.code === 'ArrowUp' && MG_Pong.playerDir === -1) MG_Pong.playerDir = 0;
  if (e.code === 'ArrowDown' && MG_Pong.playerDir === 1) MG_Pong.playerDir = 0;
});

// ---------- Entrées communes (canvas) ----------
function mgAttachCanvasListeners() {
  if (typeof canvas === 'undefined' || !canvas) {
    setTimeout(mgAttachCanvasListeners, 200);
    return;
  }
  canvas.addEventListener('mousemove', function (e) {
    if (!MINIGAME.active || MINIGAME.type !== 'pong') return;
    var coords = getCanvasCoords(e.clientX, e.clientY);
    MG_Pong.targetY = coords.y;
  });

  canvas.addEventListener('mousedown', function () {
    if (!MINIGAME.active || MINIGAME.over) return;
    if (MINIGAME.type === 'mario') MG_Mario.jump();
    else if (MINIGAME.type === 'flappy') MG_Flappy.flap();
  });

  canvas.addEventListener('touchstart', function (e) {
    if (!MINIGAME.active || MINIGAME.over) return;
    if (MINIGAME.type === 'mario') MG_Mario.jump();
    else if (MINIGAME.type === 'flappy') MG_Flappy.flap();
  }, { passive: true });
}
mgAttachCanvasListeners();

// ============================================================
// 1. LES CATACOMBES — platformer 2D
// ============================================================
var MG_Mario = {
  GRAVITY: 2300,
  SPEED: 300,
  JUMP: 790,
  LEVEL_END: 3300,

  platforms: [],
  spikes: [],
  souls: [],
  door: null,
  player: null,
  darkness: null,   // le mur de noirceur qui avance
  camX: 0,
  soulCount: 0,

  reset: function () {
    this.platforms = [
      // sol
      { x: 0, y: 540, w: 600, h: 60 },
      { x: 700, y: 540, w: 500, h: 60 },
      { x: 1350, y: 540, w: 750, h: 60 },
      { x: 2250, y: 540, w: 1050, h: 60 },
      // plateformes flottantes
      { x: 300, y: 420, w: 130, h: 14 },
      { x: 520, y: 330, w: 110, h: 14 },
      { x: 830, y: 440, w: 120, h: 14 },
      { x: 1050, y: 350, w: 120, h: 14 },
      { x: 1500, y: 430, w: 130, h: 14 },
      { x: 1700, y: 340, w: 110, h: 14 },
      { x: 1900, y: 440, w: 120, h: 14 },
      { x: 2300, y: 420, w: 130, h: 14 },
      { x: 2520, y: 330, w: 110, h: 14 },
      { x: 2750, y: 420, w: 120, h: 14 },
    ];
    this.spikes = [
      { x: 950, y: 528, w: 70 },
      { x: 1600, y: 528, w: 60 },
      { x: 2450, y: 528, w: 80 },
      { x: 2900, y: 528, w: 60 },
    ];
    this.souls = [
      { x: 355, y: 385, taken: false },
      { x: 565, y: 295, taken: false },
      { x: 1105, y: 315, taken: false },
      { x: 1745, y: 305, taken: false },
      { x: 2565, y: 295, taken: false },
    ];
    this.door = { x: 3150, y: 470, w: 44, h: 70 };
    this.player = { x: 60, y: 480, vx: 0, vy: 0, onGround: false, w: 26, h: 30, face: 1 };
    this.darkness = { x: -350, speed: 125 };
    this.camX = 0;
    this.soulCount = 0;
  },

  jump: function () {
    if (MINIGAME.over || MINIGAME.type !== 'mario') return;
    if (this.player.onGround) {
      this.player.vy = -this.JUMP;
      this.player.onGround = false;
      Sound.play(300, 0.1, 'square', 0.15);
    }
  },

  die: function (msg) {
    if (MINIGAME.over) return;
    mgScare(msg || 'IL T\'A ATTRAPÉ', true);
    MINIGAME.over = true;
    MINIGAME.won = false;
  },

  win: function () {
    if (MINIGAME.over) return;
    MINIGAME.over = true;
    MINIGAME.won = true;
    unlockAchievement('catacombes');
    Sound.play(660, 0.15, 'sine', 0.25);
    Sound.play(880, 0.3, 'sine', 0.25);
  },

  update: function (dt) {
    var p = this.player;

    // Déplacements
    var left = Input.isDown('ArrowLeft') || Input.isDown('KeyA') || Input.isDown('KeyQ');
    var right = Input.isDown('ArrowRight') || Input.isDown('KeyD');
    p.vx = (right ? this.SPEED : 0) - (left ? this.SPEED : 0);
    if (p.vx !== 0) p.face = p.vx > 0 ? 1 : -1;

    p.vy += this.GRAVITY * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Collisions plateformes (simple AABB par le dessus)
    p.onGround = false;
    for (var i = 0; i < this.platforms.length; i++) {
      var pl = this.platforms[i];
      if (p.x + p.w > pl.x && p.x < pl.x + pl.w) {
        if (p.y + p.h > pl.y && p.y + p.h - p.vy * dt <= pl.y + 4 && p.vy >= 0) {
          p.y = pl.y - p.h;
          p.vy = 0;
          p.onGround = true;
        }
      }
    }
    if (p.y > CANVAS_HEIGHT + 60) { this.die('TROP BAS'); return; }
    if (p.x < 0) p.x = 0;

    // Piques
    for (var s = 0; s < this.spikes.length; s++) {
      var sp = this.spikes[s];
      if (p.x + p.w > sp.x && p.x < sp.x + sp.w && p.y + p.h > sp.y) {
        this.die('ÇA PIQUE'); return;
      }
    }

    // Âmes
    for (var so = 0; so < this.souls.length; so++) {
      var soul = this.souls[so];
      if (!soul.taken && Math.abs(p.x + p.w / 2 - soul.x) < 26 && Math.abs(p.y + p.h / 2 - soul.y) < 30) {
        soul.taken = true;
        this.soulCount++;
        Sound.play(880, 0.12, 'sine', 0.2);
        // Petit screamer surprise sur certaines âmes
        if (this.soulCount === 2 || this.soulCount === 4) {
          mgScare('CONTINUE', false);
        }
      }
    }

    // Le noir avance
    this.darkness.x += this.darkness.speed * dt;
    if (this.darkness.x > p.x - 10) { this.die('LE NOIR T\'A PRIS'); return; }

    // Battements de cœur quand le noir approche
    var dist = p.x - this.darkness.x;
    if (dist < 220 && Math.floor(MINIGAME.t * 2) !== Math.floor((MINIGAME.t - dt) * 2)) {
      Sound.heartbeat();
    }

    // Porte de sortie
    if (this.soulCount >= 5 &&
        p.x + p.w > this.door.x && p.x < this.door.x + this.door.w &&
        p.y + p.h > this.door.y) {
      this.win();
      return;
    }

    // Caméra
    var targetCam = p.x - 300;
    this.camX = Math.max(0, Math.min(targetCam, this.LEVEL_END - CANVAS_WIDTH + 80));
  },

  draw: function (ctx) {
    var cam = this.camX;

    // Fond
    var g = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    g.addColorStop(0, '#05050a');
    g.addColorStop(1, '#0d0d1a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Yeux lointains qui suivent le joueur
    ctx.save();
    for (var e = 0; e < 6; e++) {
      var ex = ((e * 520 + 130) - cam * 0.3) % 2400;
      if (ex < -40 || ex > CANVAS_WIDTH + 40) continue;
      var ey = 90 + (e % 3) * 60;
      var look = Math.sign(this.player.x - (ex + cam * 0.3));
      ctx.globalAlpha = 0.25 + 0.1 * Math.sin(MINIGAME.t * 2 + e);
      ctx.fillStyle = '#ff2244';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 7, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(ex + look * 2, ey, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(-cam, 0);

    // Plateformes
    for (var i = 0; i < this.platforms.length; i++) {
      var pl = this.platforms[i];
      ctx.fillStyle = '#141426';
      ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = '#4af0c0';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#4af0c0';
      ctx.fillRect(pl.x, pl.y, pl.w, 3);
      ctx.shadowBlur = 0;
    }

    // Piques
    for (var s = 0; s < this.spikes.length; s++) {
      var sp = this.spikes[s];
      ctx.fillStyle = '#99a';
      for (var tx = 0; tx < sp.w; tx += 14) {
        ctx.beginPath();
        ctx.moveTo(sp.x + tx, 540);
        ctx.lineTo(sp.x + tx + 7, 510);
        ctx.lineTo(sp.x + tx + 14, 540);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Âmes
    for (var so = 0; so < this.souls.length; so++) {
      var soul = this.souls[so];
      if (soul.taken) continue;
      var bob = Math.sin(MINIGAME.t * 3 + so) * 6;
      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#4af0c0';
      ctx.fillStyle = 'rgba(74, 240, 192, 0.85)';
      ctx.beginPath();
      ctx.arc(soul.x, soul.y + bob, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Porte
    var doorOpen = this.soulCount >= 5;
    ctx.save();
    ctx.shadowBlur = doorOpen ? 25 : 8;
    ctx.shadowColor = doorOpen ? '#4af0c0' : '#ff2244';
    ctx.strokeStyle = doorOpen ? '#4af0c0' : '#ff2244';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.door.x, this.door.y, this.door.w, this.door.h);
    ctx.shadowBlur = 0;
    ctx.fillStyle = doorOpen ? 'rgba(74,240,192,0.25)' : 'rgba(255,34,68,0.12)';
    ctx.fillRect(this.door.x, this.door.y, this.door.w, this.door.h);
    ctx.font = '700 11px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = doorOpen ? '#4af0c0' : '#ff2244';
    ctx.fillText(doorOpen ? 'SORTIE' : this.soulCount + '/5', this.door.x + this.door.w / 2, this.door.y - 10);
    ctx.restore();

    // Joueur : petite silhouette pâle aux yeux rouges
    var p = this.player;
    ctx.save();
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#e8e8ec';
    ctx.fillStyle = '#cfcfe0';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff2244';
    ctx.fillRect(p.x + (p.face > 0 ? 14 : 4), p.y + 7, 4, 5);
    ctx.fillRect(p.x + (p.face > 0 ? 20 : 10), p.y + 7, 4, 5);
    ctx.restore();

    // Le mur de noirceur qui poursuit
    ctx.save();
    var dg = ctx.createLinearGradient(this.darkness.x - 260, 0, this.darkness.x, 0);
    dg.addColorStop(0, 'rgba(0,0,0,1)');
    dg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = dg;
    ctx.fillRect(this.darkness.x - 260, 0, 260, CANVAS_HEIGHT);
    ctx.fillStyle = '#000000';
    ctx.fillRect(this.darkness.x - 900, 0, 900, CANVAS_HEIGHT);
    // yeux dans le noir
    for (var de = 0; de < 4; de++) {
      var dey = 120 + de * 110;
      ctx.fillStyle = '#ff0000';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ff0000';
      ctx.beginPath();
      ctx.arc(this.darkness.x - 20, dey + Math.sin(MINIGAME.t * 4 + de) * 8, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.restore();

    // HUD
    ctx.save();
    ctx.font = '700 16px "Orbitron", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4af0c0';
    ctx.fillText('ÂMES : ' + this.soulCount + ' / 5', 14, 30);
    ctx.fillStyle = '#ff4466';
    ctx.fillText('COURS.', 14, 52);
    ctx.restore();
  },
};

// ============================================================
// 2. VOL NOCTURNE — flappy horrifique
// ============================================================
var MG_Flappy = {
  GRAVITY: 1650,
  FLAP: -500,
  PIPE_SPEED: 225,
  PIPE_INTERVAL: 1.55,
  GAP: 168,

  bird: null,
  pipes: [],
  spawnT: 0,
  score: 0,
  best: 0,
  eyes: [],

  reset: function () {
    this.bird = { x: 200, y: 280, vy: 0, r: 14 };
    this.pipes = [];
    this.spawnT = 0.8;
    this.score = 0;
    try {
      this.best = parseInt((window['local' + 'Storage'] || window.localStorage).getItem('neonBreakerVolNocturne') || '0', 10) || 0;
    } catch (e) { this.best = 0; }
    this.eyes = [];
    for (var i = 0; i < 8; i++) {
      this.eyes.push({ x: Math.random() * CANVAS_WIDTH, y: 60 + Math.random() * 420, blink: Math.random() * 5 });
    }
  },

  flap: function () {
    if (MINIGAME.over || MINIGAME.type !== 'flappy') return;
    this.bird.vy = this.FLAP;
    Sound.play(420, 0.06, 'square', 0.1);
  },

  die: function () {
    if (MINIGAME.over) return;
    mgScare('AÎE.', true);
    MINIGAME.over = true;
    MINIGAME.won = false;
    try {
      (window['local' + 'Storage'] || window.localStorage).setItem('neonBreakerVolNocturne', String(this.best));
    } catch (e) {}
  },

  update: function (dt) {
    var b = this.bird;
    b.vy += this.GRAVITY * dt;
    b.y += b.vy * dt;

    // Tuyaux
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = this.PIPE_INTERVAL;
      var gapY = 90 + Math.random() * (CANVAS_HEIGHT - 180 - this.GAP);
      this.pipes.push({ x: CANVAS_WIDTH + 40, gapY: gapY, passed: false });
    }
    for (var i = this.pipes.length - 1; i >= 0; i--) {
      var pipe = this.pipes[i];
      pipe.x -= this.PIPE_SPEED * dt;
      if (pipe.x < -80) { this.pipes.splice(i, 1); continue; }

      // Score
      if (!pipe.passed && pipe.x + 30 < b.x - b.r) {
        pipe.passed = true;
        this.score++;
        Sound.play(700, 0.08, 'sine', 0.15);
        if (this.score > this.best) this.best = this.score;
        if (this.score === 10) unlockAchievement('volNocturne');
        // Mini-screamer aux jalons
        if (this.score > 0 && this.score % 5 === 0) {
          mgScare('VOILÀ ' + this.score, false);
        }
      }

      // Collision (tuyaux de largeur 60)
      if (b.x + b.r > pipe.x && b.x - b.r < pipe.x + 60) {
        if (b.y - b.r < pipe.gapY || b.y + b.r > pipe.gapY + this.GAP) {
          this.die();
          return;
        }
      }
    }

    if (b.y + b.r > CANVAS_HEIGHT - 30 || b.y - b.r < 0) {
      this.die();
      return;
    }
  },

  draw: function (ctx) {
    // Ciel nocturne
    var g = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    g.addColorStop(0, '#03030a');
    g.addColorStop(1, '#12060f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Yeux qui observent dans le lointain
    ctx.save();
    for (var e = 0; e < this.eyes.length; e++) {
      var eye = this.eyes[e];
      eye.blink -= 0.016;
      if (eye.blink < -0.5) eye.blink = 2 + Math.random() * 5;
      var open = eye.blink > 0 ? 1 : 0.1;
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#ff2244';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ff2244';
      ctx.beginPath();
      ctx.ellipse(eye.x, eye.y, 8, 11 * open, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Tuyaux : colonnes noires aux dents
    for (var i = 0; i < this.pipes.length; i++) {
      var pipe = this.pipes[i];
      ctx.save();
      ctx.fillStyle = '#0a0a16';
      ctx.strokeStyle = '#ff4466';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ff4466';
      // haut
      ctx.fillRect(pipe.x, 0, 60, pipe.gapY);
      ctx.strokeRect(pipe.x, -10, 60, pipe.gapY + 10);
      // bas
      ctx.fillRect(pipe.x, pipe.gapY + this.GAP, 60, CANVAS_HEIGHT - pipe.gapY - this.GAP);
      ctx.strokeRect(pipe.x, pipe.gapY + this.GAP, 60, CANVAS_HEIGHT);
      // dents vers l'ouverture
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#e8e8ec';
      for (var t = 0; t < 60; t += 12) {
        ctx.beginPath();
        ctx.moveTo(pipe.x + t, pipe.gapY - 2);
        ctx.lineTo(pipe.x + t + 12, pipe.gapY - 2);
        ctx.lineTo(pipe.x + t + 6, pipe.gapY - 16);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(pipe.x + t, pipe.gapY + this.GAP + 2);
        ctx.lineTo(pipe.x + t + 12, pipe.gapY + this.GAP + 2);
        ctx.lineTo(pipe.x + t + 6, pipe.gapY + this.GAP + 16);
        ctx.closePath();
        ctx.fill();
      }
      // un œil sur chaque colonne
      ctx.fillStyle = '#ff2244';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff2244';
      ctx.beginPath();
      ctx.arc(pipe.x + 30, pipe.gapY - 55, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pipe.x + 30, pipe.gapY + this.GAP + 55, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Sol
    ctx.fillStyle = '#0a0a16';
    ctx.fillRect(0, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 30);
    ctx.strokeStyle = 'rgba(255,68,102,0.4)';
    ctx.strokeRect(-5, CANVAS_HEIGHT - 30, CANVAS_WIDTH + 10, 35);

    // L'oiseau : chauve-souris pâle
    var b = this.bird;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(Math.max(-0.5, Math.min(1, b.vy / 600)));
    ctx.shadowBlur = 16;
    ctx.shadowColor = '#e8e8ec';
    ctx.fillStyle = '#d8d8e8';
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // ailes battantes
    var wing = Math.sin(MINIGAME.t * 18) * 8;
    ctx.beginPath();
    ctx.moveTo(-4, -2);
    ctx.lineTo(-22, -10 - wing);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, -2);
    ctx.lineTo(22, -10 - wing);
    ctx.lineTo(8, 4);
    ctx.closePath();
    ctx.fill();
    // œil rouge
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#ff2244';
    ctx.fillStyle = '#ff2244';
    ctx.beginPath();
    ctx.arc(5, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // HUD
    ctx.save();
    ctx.font = '700 34px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8e8ec';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff4466';
    ctx.fillText(String(this.score), CANVAS_WIDTH / 2, 60);
    ctx.font = '400 13px "Rajdhani", sans-serif';
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#aaaabb';
    ctx.fillText('RECORD : ' + this.best, CANVAS_WIDTH / 2, 82);
    ctx.restore();
  },
};

// ============================================================
// 3. FACE AU MONSTRE — pong
// ============================================================
var MG_Pong = {
  WIN_SCORE: 5,

  playerY: 255,
  targetY: 255,
  playerDir: 0,
  monsterY: 255,
  ball: null,
  scoreP: 0,
  scoreM: 0,
  serveT: 1,
  monsterTaunt: '',
  tauntT: 0,

  reset: function () {
    this.playerY = 255;
    this.targetY = 255;
    this.playerDir = 0;
    this.monsterY = 255;
    this.scoreP = 0;
    this.scoreM = 0;
    this.serveT = 1.2;
    this.monsterTaunt = '';
    this.tauntT = 0;
    this.ball = { x: 400, y: 300, vx: 0, vy: 0, r: 10 };
  },

  serve: function () {
    var dir = Math.random() > 0.5 ? 1 : -1;
    var angle = (Math.random() - 0.5) * 0.6;
    this.ball.x = CANVAS_WIDTH / 2;
    this.ball.y = CANVAS_HEIGHT / 2;
    this.ball.vx = 380 * dir * Math.cos(angle);
    this.ball.vy = 380 * Math.sin(angle) + (Math.random() - 0.5) * 80;
  },

  monsterScore: function () {
    this.scoreM++;
    this.serveT = 1.4;
    mgScare('Point à MOI.', false);
    var taunts = ['trop lent.', 'je vois tout.', 'continue de trembler.', 'tu me fais rire.'];
    this.monsterTaunt = taunts[randInt(0, taunts.length - 1)];
    this.tauntT = 2.5;
    if (this.scoreM >= this.WIN_SCORE) {
      MINIGAME.over = true;
      MINIGAME.won = false;
      mgScare('À MOI.', true);
    }
  },

  playerScore: function () {
    this.scoreP++;
    this.serveT = 1.2;
    Sound.play(880, 0.1, 'sine', 0.2);
    Sound.growl();
    if (this.scoreP >= this.WIN_SCORE) {
      MINIGAME.over = true;
      MINIGAME.won = true;
      unlockAchievement('faceAuMonstre');
      Sound.secretUnlock();
    }
  },

  update: function (dt) {
    // Raquette joueur (souris prioritaire, sinon flèches)
    var playerSpeed = 380;
    if (Math.abs(this.targetY - this.playerY) > 4) {
      this.playerY += (this.targetY - this.playerY) * Math.min(1, dt * 12);
    }
    this.playerY += this.playerDir * playerSpeed * dt;
    this.playerY = Math.max(45, Math.min(CANVAS_HEIGHT - 45, this.playerY));

    // IA du Monstre : il suit la balle... avec dédain
    var mSpeed = 240 + Math.max(0, (this.scoreM - this.scoreP)) * 30;
    var mTarget = this.ball.vx > 0 ? this.ball.y + Math.sin(MINIGAME.t * 3) * 30 : CANVAS_HEIGHT / 2;
    if (this.ball.vx > 0 && this.ball.x > CANVAS_WIDTH - 300) {
      // Quand il mène, il laisse filer parfois
      mTarget += (this.scoreM > this.scoreP) ? Math.sin(MINIGAME.t) * 70 : 0;
    }
    this.monsterY += Math.max(-mSpeed * dt, Math.min(mSpeed * dt, mTarget - this.monsterY));
    this.monsterY = Math.max(55, Math.min(CANVAS_HEIGHT - 55, this.monsterY));

    if (this.tauntT > 0) this.tauntT -= dt;

    // Service
    if (this.serveT > 0) {
      this.serveT -= dt;
      this.ball.x = CANVAS_WIDTH / 2;
      this.ball.y = CANVAS_HEIGHT / 2 + Math.sin(MINIGAME.t * 2) * 30;
      if (this.serveT <= 0) this.serve();
      return;
    }

    // Balle
    var b = this.ball;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.y < b.r + 8) { b.y = b.r + 8; b.vy = Math.abs(b.vy); }
    if (b.y > CANVAS_HEIGHT - b.r - 8) { b.y = CANVAS_HEIGHT - b.r - 8; b.vy = -Math.abs(b.vy); }

    // Raquette joueur (x=40, h=90)
    if (b.vx < 0 && b.x - b.r < 54 && b.x - b.r > 30 && Math.abs(b.y - this.playerY) < 52) {
      b.x = 54 + b.r;
      b.vx = Math.abs(b.vx) * 1.07;
      b.vy += (b.y - this.playerY) * 4;
      Sound.play(500, 0.05, 'square', 0.15);
    }

    // Gueule du Monstre (x=746, h=110)
    if (b.vx > 0 && b.x + b.r > 746 && b.x + b.r < 772 && Math.abs(b.y - this.monsterY) < 62) {
      b.x = 746 - b.r;
      b.vx = -Math.abs(b.vx) * 1.07;
      b.vy += (b.y - this.monsterY) * 3;
      Sound.play(140, 0.08, 'sawtooth', 0.2);
    }

    // Points
    if (b.x < -30) { this.monsterScore(); this.ball = { x: 400, y: 300, vx: 0, vy: 0, r: 10 }; return; }
    if (b.x > CANVAS_WIDTH + 30) { this.playerScore(); this.ball = { x: 400, y: 300, vx: 0, vy: 0, r: 10 }; return; }
  },

  draw: function (ctx) {
    // Arène
    var g = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    g.addColorStop(0, '#050508');
    g.addColorStop(1, '#0e0510');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Ligne centrale
    ctx.save();
    ctx.strokeStyle = 'rgba(255,68,102,0.25)';
    ctx.setLineDash([8, 12]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.restore();

    // Scores
    ctx.save();
    ctx.font = '700 56px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4af0c0';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#4af0c0';
    ctx.fillText(String(this.scoreP), CANVAS_WIDTH / 2 - 70, 80);
    ctx.fillStyle = '#ff4466';
    ctx.shadowColor = '#ff4466';
    ctx.fillText(String(this.scoreM), CANVAS_WIDTH / 2 + 70, 80);
    ctx.font = '400 13px "Rajdhani", sans-serif';
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#aaaabb';
    ctx.fillText('TOI', CANVAS_WIDTH / 2 - 70, 100);
    ctx.fillText('LUI', CANVAS_WIDTH / 2 + 70, 100);
    ctx.fillText('PREMIER À ' + this.WIN_SCORE, CANVAS_WIDTH / 2, 122);
    ctx.restore();

    // Raquette joueur
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#4af0c0';
    var pg = ctx.createLinearGradient(0, this.playerY - 45, 0, this.playerY + 45);
    pg.addColorStop(0, '#4af0c0');
    pg.addColorStop(1, '#2a9a80');
    ctx.fillStyle = pg;
    ctx.fillRect(40, this.playerY - 45, 14, 90);
    ctx.restore();

    // LE MONSTRE : tête dressée avec gueule-palette
    ctx.save();
    var my = this.monsterY;
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#ff0000';
    ctx.fillStyle = '#1a0505';
    // crâne
    ctx.beginPath();
    ctx.ellipse(770, my - 85, 46, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    // yeux
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff0000';
    ctx.fillStyle = '#ff0000';
    var blink = Math.floor(MINIGAME.t * 2) % 6 === 0 ? 0.15 : 1;
    ctx.globalAlpha = blink;
    ctx.beginPath();
    ctx.ellipse(754, my - 92, 9, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(786, my - 92, 9, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // gueule-palette
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#2a0808';
    ctx.fillRect(746, my - 55, 16, 110);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e8e8ec';
    for (var t = 0; t < 110; t += 14) {
      ctx.beginPath();
      ctx.moveTo(746, my - 55 + t);
      ctx.lineTo(762, my - 55 + t);
      ctx.lineTo(754, my - 55 + t + 9);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Balle = œil qui te fixe
    var b = this.ball;
    if (this.serveT <= 0) {
      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#ffffff';
      ctx.fillStyle = '#f0f0f5';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      var lookX = b.vx > 0 ? 3 : -3;
      ctx.fillStyle = '#ff2244';
      ctx.beginPath();
      ctx.arc(b.x + lookX, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Compte à rebours du service
      ctx.save();
      ctx.font = '700 24px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#aaaabb';
      ctx.fillText('IL ARRIVE...', CANVAS_WIDTH / 2, 200);
      ctx.restore();
    }

    // Moquerie du Monstre
    if (this.tauntT > 0 && this.monsterTaunt) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.tauntT);
      ctx.font = '400 20px "Creepster", cursive';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff4466';
      ctx.fillText('« ' + this.monsterTaunt + ' »', CANVAS_WIDTH / 2, 170);
      ctx.restore();
    }
  },
};
