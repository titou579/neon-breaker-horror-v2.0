'use strict';

// ============================================================
// NEON BREAKER: HORROR - Vanilla JS Arcade Game
// 36 levels, 12 bosses, screamers, horror atmosphere - EDITION CAUCHEMAR
// ============================================================

// ==================== CONSTANTS ====================
var CANVAS_WIDTH = 800;
var CANVAS_HEIGHT = 600;
var PADDLE_WIDTH = 120;
var PADDLE_HEIGHT = 16;
var PADDLE_Y_OFFSET = 40;
var PADDLE_SPEED = 500;
var BALL_RADIUS = 8;
var BALL_BASE_SPEED = 340;
var BRICK_COLS = 10;
var BRICK_WIDTH = 64;
var BRICK_HEIGHT = 24;
var BRICK_PADDING = 4;
var BRICK_OFFSET_TOP = 80;
var BRICK_OFFSET_LEFT = (CANVAS_WIDTH - (BRICK_COLS * BRICK_WIDTH + (BRICK_COLS - 1) * BRICK_PADDING)) / 2;
var MAX_PARTICLES = 400;
var POWERUP_DROP_CHANCE = 0.15;
var POWERUP_SPEED = 150;
var POWERUP_DURATION = 10000;
var TICK_RATE = 1000 / 60;
var MAX_LIVES = 3;
var MAX_BALLS = 5;
var MAX_LASER_SHOTS = 10;
var MAX_BOSS_PROJECTILES = 20;
var SCREAMER_COOLDOWN_MIN = 20;
var SCREAMER_COOLDOWN_MAX = 38;
var SCREAMER_FREEZE = 0.9;
var SCREAMER_DURATION = 0.85;
var NUM_SCREAMER_TYPES = 16;
var SANITY_MAX = 100;
var KONAMI_CODE = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'];

// Codes secrets -> versions cachées du jeu
var SECRET_CODES = {
  'ENFER666': 'infernal',   // Version Infernale
  'ABYSSE404': 'abyss',     // L'Abysse
  'BONBON13': 'candy',      // Bonbon Maudit
};

var SECRET_MODE_NAMES = {
  infernal: 'ENFER : VERSION INFERNALE',
  abyss: "L'ABYSSE : LE GOUFFRE SANS LUMIÈRE",
  candy: 'BONBON MAUDIT : LA DOUCEUR PIÉGÉE',
};

// Le Monstre : si la raquette s'arrête, il vient la manger
var IDLE_WARN_TIME = 2.2;   // secondes d'immobilité avant l'avertissement
var IDLE_EAT_TIME = 4.2;    // secondes d'immobilité avant la morsure

var ACHIEVEMENTS_STORAGE_KEY = 'neonBreakerAchievementsV2';

// Game states
var STATE_MENU = 'menu';
var STATE_PLAYING = 'playing';
var STATE_PAUSED = 'paused';
var STATE_LEVEL_COMPLETE = 'levelComplete';
var STATE_GAME_OVER = 'gameOver';
var STATE_VICTORY = 'victory';

// Brick type definitions
var BRICK_TYPES = {
  NORMAL:       { hits: 1, points: 10,  colors: ['#4af0c0', '#3ad5a8'] },
  TOUGH:        { hits: 2, points: 30,  colors: ['#ffaa22', '#ff8822', '#ff6622'] },
  STRONG:       { hits: 3, points: 50,  colors: ['#ff4466', '#ff3355', '#ff2244', '#ff1133'] },
  EXPLOSIVE:    { hits: 1, points: 20,  colors: ['#ff8800', '#ff6600'] },
  INVISIBLE:    { hits: 1, points: 40,  colors: ['#555588', '#444477'] },
  REGENERATING: { hits: 2, points: 40,  colors: ['#22ddaa', '#11cc99', '#00bb88'] },
  MOVING:       { hits: 2, points: 40,  colors: ['#cc66ff', '#bb55ee', '#aa44dd'] },
  INDESTRUCTIBLE:{ hits: 999, points: 0, colors: ['#444466'] },
};

// Power-up type definitions (troll types marked with troll:true)
var POWERUP_TYPES = {
  EXPAND:    { color: '#4af0c0', label: 'RAQUETTE LARGE', symbol: 'W', troll: false },
  SLOW:      { color: '#5591c7', label: 'BALLE LENTE',    symbol: 'S', troll: false },
  MULTIBALL: { color: '#ffaa22', label: 'MULTI-BALLES',   symbol: 'M', troll: false },
  LASER:     { color: '#ff4466', label: 'LASER',          symbol: 'L', troll: false },
  SHIELD:    { color: '#22ddaa', label: 'BOUCLIER',       symbol: 'B', troll: false },
  GHOST:     { color: '#cc66ff', label: 'BALLE FANTOME',  symbol: 'G', troll: false },
  TINY:      { color: '#4af0c0', label: 'RAQUETTE...',   symbol: 'W', troll: true },
  INVERSE:   { color: '#5591c7', label: 'INVERSION...',  symbol: 'S', troll: true },
  FAST:      { color: '#5591c7', label: 'BALLE...',      symbol: 'S', troll: true },
  CHAOS:     { color: '#ffaa22', label: 'CHAOS...',      symbol: 'M', troll: true },
  FOG:       { color: '#8899aa', label: 'BRUME...',      symbol: 'S', troll: true },
  BLACKOUT:  { color: '#334455', label: 'LUMIÈRE...',    symbol: 'B', troll: true },
  DRUNK:     { color: '#ff66aa', label: 'IVRESSE...',    symbol: 'W', troll: true },
  CURSE:     { color: '#9933cc', label: 'MALÉDICTION...', symbol: 'M', troll: true },
  MINIBALL:  { color: '#66ccff', label: 'BALLE...',      symbol: 'S', troll: true },
};

var TROLL_TYPES = ['TINY', 'INVERSE', 'FAST', 'CHAOS', 'FOG', 'BLACKOUT', 'DRUNK', 'CURSE', 'MINIBALL'];
var GOOD_TYPES = ['EXPAND', 'SLOW', 'MULTIBALL', 'LASER', 'SHIELD', 'GHOST'];

// Boss definitions
var BOSS_DEFS = [
  { name: 'LE GARDIEN',      hp: 14,  color: '#ff4466', pattern: 'mover' },
  { name: 'LE TIREUR',       hp: 20,  color: '#ff8822', pattern: 'shooter' },
  { name: "L'INVOCATEUR",    hp: 26,  color: '#cc66ff', pattern: 'summoner' },
  { name: "L'OEIL",          hp: 32,  color: '#22ddaa', pattern: 'laser' },
  { name: 'LE VIDE',         hp: 45,  color: '#ff2244', pattern: 'final' },
  { name: 'LE POSSEDE',      hp: 52,  color: '#ff66cc', pattern: 'chaser' },
  { name: 'LA NUEE',         hp: 58,  color: '#aa2299', pattern: 'swarm' },
  { name: 'LE MIROIR',       hp: 65,  color: '#33aaff', pattern: 'mirror' },
  { name: 'LE FANTOME',      hp: 72,  color: '#99ffee', pattern: 'phantom' },
  { name: "L'ENRAGE",        hp: 80,  color: '#ff3300', pattern: 'berserker' },
  { name: 'LE TOURBILLON',   hp: 90,  color: '#ffee33', pattern: 'vortex' },
  { name: "L'ABOMINATION",   hp: 120, color: '#ff0044', pattern: 'apocalypse' },
];

// Boss levels: tous les 3 niveaux
var BOSS_LEVELS = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];

// Level layouts
// 0=empty 1=normal 2=tough 3=strong 4=explosive 5=invisible 6=regenerating 7=moving 8=indestructible
var LEVELS = [
  // Level 1 - Introduction (deja plus dure qu'avant)
  [
    '0000000000',
    '0111111110',
    '0122222210',
    '0111111110',
    '0012222100',
  ],
  // Level 2 - Steps
  [
    '0000110000',
    '0001221000',
    '0012332100',
    '0123443210',
    '0712222170',
  ],
  // Level 3 - BOSS: Le Gardien
  [
    '0000000000',
    '0800000080',
    '0000000000',
    '0000000000',
  ],
  // Level 4 - Diamond
  [
    '0000110000',
    '0001221000',
    '0013443100',
    '0123443210',
    '0013443100',
    '0001221000',
  ],
  // Level 5 - Fortress
  [
    '0222222220',
    '0233333320',
    '0234554320',
    '0233333320',
    '0222222220',
  ],
  // Level 6 - BOSS: Le Tireur
  [
    '0000000000',
    '0800000080',
    '0000000000',
    '0000000000',
  ],
  // Level 7 - Minefield
  [
    '0400400400',
    '4040404040',
    '0400400400',
    '4040404040',
    '0400400400',
  ],
  // Level 8 - Ghost Wall
  [
    '0055005500',
    '0555225550',
    '0255552550',
    '0555005550',
    '0025500250',
  ],
  // Level 9 - BOSS: L'Invokeur
  [
    '0000000000',
    '0800000080',
    '0000000000',
    '0000000000',
  ],
  // Level 10 - Regrowth
  [
    '0066006600',
    '0666226660',
    '0266662660',
    '0666006660',
    '0026600260',
  ],
  // Level 11 - Drift
  [
    '0707070707',
    '7070070070',
    '0707070707',
    '7070070070',
    '0707070707',
  ],
  // Level 12 - BOSS: L'Oeil
  [
    '0000000000',
    '0800000080',
    '0000000000',
    '0000000000',
  ],
  // Level 13 - Mixed Chaos
  [
    '1234123412',
    '2356235623',
    '1234123412',
    '3478347834',
    '0056005600',
  ],
  // Level 14 - The Abyss
  [
    '0022002200',
    '0544445400',
    '0033663300',
    '0544445400',
    '0566226650',
    '0022002200',
  ],
  // Level 15 - BOSS: Le Vide
  [
    '0000000000',
    '0800000080',
    '0000000000',
    '0000000000',
  ],
  // Level 16 - Spikes
  [
    '1313131313',
    '2424242424',
    '1313131313',
    '2424242424',
    '3535353535',
  ],
  // Level 17 - Cage
  [
    '8222222228',
    '8233333328',
    '8234554328',
    '8233333328',
    '8222222228',
  ],
  // Level 18 - BOSS: Le Possede
  [
    '0000000000',
    '0800000080',
    '0000000000',
    '0000000000',
  ],
  // Level 19 - Storm
  [
    '4747474747',
    '7474747474',
    '4747474747',
    '7474747474',
    '4747474747',
  ],
  // Level 20 - Phantom Grid
  [
    '5656565656',
    '6565656565',
    '5656565656',
    '6565656565',
    '5656565656',
  ],
  // Level 21 - BOSS: La Nuee
  [
    '0000000000',
    '0800000080',
    '0000000000',
    '0000000000',
  ],
  // Level 22 - Iron Maze
  [
    '8118118118',
    '8228228228',
    '8338338338',
    '8228228228',
    '8118118118',
  ],
  // Level 23 - Corrosion
  [
    '0666666660',
    '6224422460',
    '6244664460',
    '6224422460',
    '0666666660',
  ],
  // Level 24 - BOSS: Le Miroir
  [
    '0000000000',
    '0800000080',
    '0000000000',
    '0000000000',
  ],
  // Level 25 - Bastion
  [
    '8333333338',
    '8355555538',
    '8354445438',
    '8355555538',
    '8333333338',
  ],
  // Level 26 - The Swarm
  [
    '4545454545',
    '5454545454',
    '4747474747',
    '5454545454',
    '4545454545',
  ],
  // Level 27 - BOSS: Le Fantome
  [
    '0000000000',
    '0800000080',
    '0000000000',
    '0000000000',
  ],
  // Level 28 - Labyrinth
  [
    '8262626268',
    '8626262628',
    '8262626268',
    '8626262628',
    '8262626268',
  ],
  // Level 29 - Chaos Theory
  [
    '1234554321',
    '2345665432',
    '3456776543',
    '2345665432',
    '1234554321',
  ],
  // Level 30 - BOSS: L'Enrage
  [
    '0000000000',
    '0800000080',
    '0000000000',
    '0000000000',
  ],
  // Level 31 - The Furnace
  [
    '4444444444',
    '3333333333',
    '4444444444',
    '3333333333',
    '4444444444',
  ],
  // Level 32 - Void Fragments
  [
    '5858585858',
    '8585858585',
    '5858585858',
    '8585858585',
    '5858585858',
  ],
  // Level 33 - BOSS: Le Tourbillon
  [
    '0000000000',
    '0800000080',
    '0000000000',
    '0000000000',
  ],
  // Level 34 - Last Bastion
  [
    '8373737378',
    '8737373738',
    '8373737378',
    '8737373738',
    '8373737378',
  ],
  // Level 35 - Nightmare Wall
  [
    '3434343434',
    '4646464646',
    '3434343434',
    '4646464646',
    '3434343434',
    '2727272727',
  ],
  // Level 36 - BOSS FINAL: L'Abomination
  [
    '0000000000',
    '0800000080',
    '0000000000',
    '0000000000',
  ],
];

// ==================== UTILITY FUNCTIONS ====================
function clamp(val, min, max) {
  return val < min ? min : (val > max ? max : val);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function distSq(x1, y1, x2, y2) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  return dx * dx + dy * dy;
}

function isBossLevel(level) {
  return BOSS_LEVELS.indexOf(level) >= 0;
}

function getBossIndex(level) {
  return BOSS_LEVELS.indexOf(level);
}

// ==================== GAME STATE ====================
var gameState = {
  current: STATE_MENU,
  score: 0,
  lives: MAX_LIVES,
  level: 1,
  highScore: 0,
  combo: 0,
  horrorMode: true,
  totalBricks: 0,
  bricksDestroyed: 0,
  sanity: SANITY_MAX,
  achievements: [],
  rageMode: false,
  secretMode: null,        // null | 'infernal' | 'abyss' | 'candy'
  deathsThisRun: 0,
  malusSeen: {},
  levelMods: null,         // malus cumulés par les cinéatiques
};

function freshLevelMods() {
  return {
    paddleScale: 1,    // raquette rongée par le Monstre
    speedScale: 1,     // balle accélérée
    darkness: 0,       // néon soufflé
    fog: 0,            // brume crachée
    curseChance: 0,    // briques maudites
    trollBonus: 0,     // plus de faux bonus
    idleSpeed: 1,      // Monstre plus rapide
    invertChance: 0,   // sorts d'inversion
  };
}
gameState.levelMods = freshLevelMods();

// ==================== ENTITIES ====================
var balls = [];
var paddle = {
  x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
  y: CANVAS_HEIGHT - PADDLE_Y_OFFSET,
  w: PADDLE_WIDTH,
  h: PADDLE_HEIGHT,
  targetX: null,
};
var bricks = [];
var particles = [];
var powerUps = [];
var laserShots = [];
var bossProjectiles = [];
var ballTrails = [];

// Power-up state
var activePowerUp = { type: null, timer: 0, active: false };
var shieldActive = false;
var shieldHits = 0;

// Effect multipliers
var shakeIntensity = 0;
var speedMultiplier = 1.0;
var paddleWidthMultiplier = 1.0;
var ghostBall = false;

// Boss state
var boss = {
  active: false,
  defeated: false,
  x: 400,
  y: 120,
  w: 80,
  h: 40,
  hp: 0,
  maxHp: 0,
  vx: 0,
  vy: 0,
  hitCooldown: 0,
  attackTimer: 0,
  pattern: '',
  color: '#ff4466',
  name: '',
  phase: 0,
  spawnTimer: 0,
  invulnerable: false,
  rotAngle: 0,
  phaseTimer: 0,
};

// Horror system
var screamer = {
  active: false,
  timer: 0,
  cooldown: 35,
  type: 0,
  freeze: 0,
};

var horrorEffects = {
  flicker: 0,
  glitch: 0,
  darkness: 0,
  heartbeat: 0,
  heartbeatRate: 1.2,
  drone: null,
  colorInvert: 0,
  screenTilt: 0,
  screenWarp: 0,
  whisper: 0,
  whisperText: '',
  possessedPaddle: 0,
  possessedDir: 1,
  fogScreen: 0,
  blackout: 0,
  drunk: 0,
  invertSpell: 0,
};

// ==================== LE MONSTRE ====================
var monster = {
  idleTime: 0,
  warned: false,
  anim: 0,      // progression des mâchoires (0..1)
};

function resetMonsterIdle() {
  monster.idleTime = 0;
  monster.warned = false;
}

// ==================== CINÉMATIQUES ====================
var STATE_CINEMATIC = 'cinematic';
var cinematic = { active: false, t: 0, chars: 0, finished: false, scene: null };

// Achievement messages (troll-flavored)
var ACHIEVEMENTS = {
  firstBrick: { name: 'PREMIÈRE BRIQUE', msg: 'Enfin, on a commencé...' },
  firstBoss: { name: 'PREMIER BOSS', msg: 'Tu as survécu... pour l\'instant' },
  firstScreamer: { name: 'PREMIER SCREAMER', msg: 'T\'as fait pipi ?' },
  combo10: { name: 'COMBO x10', msg: 'On se calme ou quoi ?' },
  halfGame: { name: 'MOITIÉ DU CHEMIN', msg: 'La moitié... le pire arrive' },
  rageMode: { name: 'MODE RAGE', msg: '1 vie... bonne chance' },
  sanityLow: { name: 'SANTÉ MENTALE', msg: 'Tu devrais faire une pause' },
  konami: { name: 'CODE KONAMI', msg: '...rien ne se passe. Mensonge.' },
  catacombes: { name: 'EXPLORATEUR DES CATACOMBES', msg: 'Tu as franchi la porte au fond du noir' },
  volNocturne: { name: 'AILES DE CAUCHEMAR', msg: '10 points sans te faire dévorer' },
  faceAuMonstre: { name: 'IL A TREMBLÉ', msg: 'Tu l\'as battu à son propre jeu' },
  firstDeath: { name: 'PREMIÈRE MORT', msg: 'Bienvenue dans le club' },
  victory: { name: 'VICTOIRE', msg: 'Tu as vaincu le Vide... ou pas' },
  survivedMonster: { name: "IL T'A RATÉ", msg: "Bouger, c'est vivre" },
  allMalus: { name: 'COLLECTIONNEUR DE MALHEUR', msg: 'Tu as tout goûté. Bravo ?' },
  secretFinder: { name: 'PORTES CACHÉES', msg: 'Un code murmuré dans le noir' },
  infernalWin: { name: 'ENFER ÉTEINT', msg: 'Tu as cassé des briques en enfer' },
  abyssWin: { name: "REMONTÉ DE L'ABYSSE", msg: 'La lumière te revoit' },
  candyWin: { name: 'CARIE FINALE', msg: 'Trop sucré pour ce monde' },
  level10: { name: 'PERSISTANT', msg: 'Niveau 10 : il commence à te respecter' },
  noDeath5: { name: 'INTOUCHABLE', msg: 'Cinq niveaux sans mourir' },
  horrorMaster: { name: "MAÎTRE DE L'HORREUR", msg: '36 niveaux en mode horreur' },
  nightmareSlayer: { name: 'TUEUR DE CAUCHEMARS', msg: 'Les 12 boss sont tombés' },
  trueEnd: { name: 'LA VRAIE FIN', msg: 'Tu as tout vu. Il te connaît par cœur.' },
};

// Random death messages
var DEATH_MESSAGES = [
  "Tu t'es arrêté. Il l'a senti.",
  "La mort n'est qu'un début",
  'Le Monstre est encore affamé',
  'Il a gardé ta raquette pour le dessert',
  'On t\'attendait',
  "Le Vide t'a vu",
  'Tu ne devais pas t\'arrêter',
  'Il est trop tard',
  'La prochaine fois, bouge.',
  'Repose en paix... ou pas',
];

// Random whisper texts
var WHISPER_TEXTS = [
  "ne t'arrête pas",
  "il entend l'immobilité",
  'bouge. toujours.',
  'il mange les raquettes immobiles',
  'continue de bouger',
  "si tu t'arrêtes, il vient",
  'il a faim',
  'plus vite',
  'il gronde',
  "ne t'arrête jamais",
  'il sent tes hésitations',
  'bouge ou il te mange',
];

var WHISPER_TEXTS_CANDY = [
  'reste avec moi',
  'un bonbon ?',
  'tu sens le sucre',
  'ne pars pas',
  'encore un niveau',
  'je t\'ai menti, reste',
  'sois mon goûter',
  'mange-moi',
];

// Achievement popup system
var achievementPopup = {
  active: false,
  timer: 0,
  name: '',
  msg: '',
};

// Input tracking
var inputMode = 'keyboard';
var mouseTargetX = null;
var reducedMotion = false;
var inverseControls = false;
var konamiBuffer = [];

// Canvas references
var canvas = null;
var ctx = null;

// Frame counter for animations
var frameCount = 0;

// ==================== INPUT SYSTEM ====================
var Input = {
  keys: {},

  init: function () {
    var self = this;
    document.addEventListener('keydown', function (e) {
      self.keys[e.code] = true;
    });
    document.addEventListener('keyup', function (e) {
      self.keys[e.code] = false;
    });
  },

  isDown: function (code) {
    return !!this.keys[code];
  },
};

// ==================== AUDIO SYSTEM ====================
var Sound = {
  ctx: null,
  muted: false,
  droneNode: null,
  droneGain: null,
  heartbeatTimer: 0,

  init: function () {
    if (!this.ctx) {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          this.ctx = new AC();
        }
      } catch (e) {}
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  play: function (frequency, duration, type, volume) {
    if (!this.ctx || this.muted) return;
    try {
      var osc = this.ctx.createOscillator();
      var gain = this.ctx.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      gain.gain.setValueAtTime(volume || 0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  },

  playNoise: function (duration, volume, filterFreq) {
    if (!this.ctx || this.muted) return;
    try {
      var bufferSize = this.ctx.sampleRate * duration;
      var buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
      }
      var source = this.ctx.createBufferSource();
      source.buffer = buffer;
      var filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq || 800;
      var gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume || 0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      source.start();
      source.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  },

  bounce: function () {
    this.play(440, 0.05, 'square', 0.15);
  },

  brickBreak: function () {
    this.play(800, 0.06, 'sine', 0.2);
    var self = this;
    setTimeout(function () { self.play(600, 0.04, 'sine', 0.15); }, 30);
  },

  brickHit: function () {
    this.play(500, 0.04, 'square', 0.1);
  },

  explosion: function () {
    this.playNoise(0.3, 0.4, 400);
    this.play(80, 0.2, 'sawtooth', 0.3);
  },

  powerUp: function () {
    var self = this;
    this.play(523, 0.08, 'sine', 0.2);
    setTimeout(function () { self.play(659, 0.08, 'sine', 0.2); }, 70);
    setTimeout(function () { self.play(784, 0.12, 'sine', 0.2); }, 140);
  },

  loseLife: function () {
    this.play(200, 0.25, 'sawtooth', 0.2);
    var self = this;
    setTimeout(function () { self.play(150, 0.25, 'sawtooth', 0.2); }, 100);
  },

  levelComplete: function () {
    var notes = [523, 659, 784, 1047];
    var self = this;
    for (var i = 0; i < notes.length; i++) {
      (function (idx) {
        setTimeout(function () { self.play(notes[idx], 0.12, 'sine', 0.2); }, idx * 90);
      })(i);
    }
  },

  gameOver: function () {
    var notes = [400, 350, 300, 250];
    var self = this;
    for (var i = 0; i < notes.length; i++) {
      (function (idx) {
        setTimeout(function () { self.play(notes[idx], 0.2, 'sawtooth', 0.2); }, idx * 140);
      })(i);
    }
  },

  bossSpawn: function () {
    this.play(150, 0.5, 'sawtooth', 0.25);
    var self = this;
    setTimeout(function () { self.play(100, 0.5, 'sawtooth', 0.25); }, 200);
    setTimeout(function () { self.play(80, 0.8, 'sawtooth', 0.3); }, 400);
  },

  bossHit: function () {
    this.play(300, 0.08, 'square', 0.2);
    this.playNoise(0.05, 0.15, 2000);
  },

  bossDefeated: function () {
    var notes = [200, 150, 100, 80, 60];
    var self = this;
    for (var i = 0; i < notes.length; i++) {
      (function (idx) {
        setTimeout(function () { self.play(notes[idx], 0.3, 'sawtooth', 0.25); }, idx * 100);
      })(i);
    }
    setTimeout(function () { self.playNoise(0.5, 0.3, 200); }, 500);
  },

  laser: function () {
    this.play(1200, 0.04, 'sine', 0.1);
  },

  trollPowerUp: function () {
    // Sounds like a normal power-up but ends with a sinister note
    var self = this;
    this.play(523, 0.08, 'sine', 0.2);
    setTimeout(function () { self.play(659, 0.08, 'sine', 0.2); }, 70);
    setTimeout(function () { self.play(784, 0.12, 'sine', 0.2); }, 140);
    setTimeout(function () { self.play(200, 0.3, 'sawtooth', 0.25); }, 300);
  },

  achievement: function () {
    var self = this;
    this.play(880, 0.1, 'sine', 0.15);
    setTimeout(function () { self.play(1320, 0.15, 'sine', 0.15); }, 100);
  },

  whisper: function () {
    if (!this.ctx || this.muted) return;
    this.playNoise(0.3, 0.08, 600);
  },

  rageMode: function () {
    var self = this;
    this.play(100, 0.5, 'sawtooth', 0.3);
    this.playNoise(0.5, 0.3, 200);
    setTimeout(function () { self.play(80, 0.4, 'sawtooth', 0.3); }, 200);
  },

  konami: function () {
    var notes = [523, 659, 784, 1047, 1319];
    var self = this;
    for (var i = 0; i < notes.length; i++) {
      (function (idx) {
        setTimeout(function () { self.play(notes[idx], 0.15, 'sine', 0.2); }, idx * 120);
      })(i);
    }
  },

  fakeGameOver: function () {
    var self = this;
    this.play(300, 0.3, 'sawtooth', 0.3);
    setTimeout(function () { self.play(200, 0.3, 'sawtooth', 0.3); }, 150);
    setTimeout(function () { self.play(100, 0.5, 'sawtooth', 0.3); }, 300);
  },

  screamer: function () {
    if (!this.ctx || this.muted) return;
    var self = this;
    // Hurlement saturé (distorsion tanh) — plus fort, plus long
    try {
      var now = this.ctx.currentTime;
      var osc = this.ctx.createOscillator();
      var shaper = this.ctx.createWaveShaper();
      var curve = new Float32Array(256);
      for (var i = 0; i < 256; i++) {
        var x = i / 128 - 1;
        curve[i] = Math.tanh(x * 7);
      }
      shaper.curve = curve;
      var gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.75);
      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc.connect(shaper);
      shaper.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.9);
    } catch (e) {}
    // Couche de bruit violente
    this.playNoise(0.8, 0.9, 5000);
    this.play(45, 0.75, 'square', 0.6);
    this.play(66, 0.65, 'sawtooth', 0.5);
    // Stridents
    setTimeout(function () {
      self.play(2400, 0.3, 'sawtooth', 0.45);
      self.play(1900, 0.3, 'square', 0.4);
      self.play(3100, 0.2, 'sawtooth', 0.3);
    }, 60);
    // Murmure tordu final
    setTimeout(function () { self.playNoise(0.4, 0.3, 400); }, 380);
  },

  growl: function () {
    if (!this.ctx || this.muted) return;
    this.play(65, 0.7, 'sawtooth', 0.28);
    this.playNoise(0.6, 0.14, 150);
    var self = this;
    setTimeout(function () { self.play(55, 0.5, 'sawtooth', 0.22); }, 150);
  },

  bite: function () {
    if (!this.ctx || this.muted) return;
    this.playNoise(0.25, 0.85, 900);
    this.play(120, 0.15, 'square', 0.55);
    var self = this;
    setTimeout(function () {
      self.play(60, 0.5, 'sawtooth', 0.55);
      self.playNoise(0.35, 0.5, 300);
    }, 120);
  },

  cinematicSting: function () {
    if (!this.ctx || this.muted) return;
    var self = this;
    this.play(220, 0.6, 'sawtooth', 0.25);
    setTimeout(function () { self.play(160, 0.8, 'sawtooth', 0.25); }, 300);
    setTimeout(function () { self.play(90, 1.2, 'sawtooth', 0.3); }, 700);
    setTimeout(function () { self.playNoise(0.6, 0.2, 250); }, 900);
  },

  secretUnlock: function () {
    if (!this.ctx || this.muted) return;
    var self = this;
    this.play(660, 0.12, 'sine', 0.25);
    setTimeout(function () { self.play(880, 0.12, 'sine', 0.25); }, 110);
    setTimeout(function () { self.play(1100, 0.2, 'sine', 0.25); }, 220);
    setTimeout(function () { self.play(180, 0.5, 'sawtooth', 0.3); }, 420);
  },

  heartbeat: function () {
    if (!this.ctx || this.muted) return;
    try {
      var osc = this.ctx.createOscillator();
      var gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, this.ctx.currentTime);
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);

      // Second thump
      var osc2 = this.ctx.createOscillator();
      var gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(50, this.ctx.currentTime + 0.18);
      gain2.gain.setValueAtTime(0, this.ctx.currentTime + 0.18);
      gain2.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(this.ctx.currentTime + 0.18);
      osc2.stop(this.ctx.currentTime + 0.32);
    } catch (e) {}
  },

  startDrone: function () {
    if (!this.ctx || this.droneNode || this.muted) return;
    try {
      var osc = this.ctx.createOscillator();
      var gain = this.ctx.createGain();
      var filter = this.ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.value = 55;
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 2);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      this.droneNode = osc;
      this.droneGain = gain;
    } catch (e) {}
  },

  stopDrone: function () {
    if (this.droneGain) {
      try {
        this.droneGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
      } catch (e) {}
    }
    if (this.droneNode) {
      try {
        var node = this.droneNode;
        setTimeout(function () { try { node.stop(); } catch (e) {} }, 600);
      } catch (e) {}
      this.droneNode = null;
      this.droneGain = null;
    }
  },

  setDroneIntensity: function (level) {
    if (this.droneGain && this.ctx) {
      try {
        var vol = 0.04 + level * 0.04;
        this.droneGain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 1);
      } catch (e) {}
    }
  },
};

// ==================== HELPER: ROUNDED RECTANGLE ====================
function roundRect(ctx, x, y, w, h, r) {
  var radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// ==================== PARTICLE SYSTEM ====================
function spawnParticles(x, y, color, count) {
  if (reducedMotion) count = Math.min(count, 4);
  for (var i = 0; i < count; i++) {
    if (particles.length >= MAX_PARTICLES) break;
    var angle = Math.random() * Math.PI * 2;
    var speed = 50 + Math.random() * 150;
    particles.push({
      x: x, y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.5 + Math.random() * 0.5,
      maxLife: 1.0,
      color: color,
      size: 3 + Math.random() * 3,
    });
  }
}

function updateParticles(dt) {
  for (var i = particles.length - 1; i >= 0; i--) {
    var p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 200 * dt;
    p.vx *= 0.98;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// ==================== LEVEL BUILDING ====================
function buildLevel(levelNum) {
  var layout = LEVELS[levelNum - 1];
  bricks = [];

  for (var row = 0; row < layout.length; row++) {
    for (var col = 0; col < layout[row].length; col++) {
      var cell = parseInt(layout[row][col], 10);
      if (cell === 0 || isNaN(cell)) continue;

      var type = null;
      if (cell === 1) type = 'NORMAL';
      else if (cell === 2) type = 'TOUGH';
      else if (cell === 3) type = 'STRONG';
      else if (cell === 4) type = 'EXPLOSIVE';
      else if (cell === 5) type = 'INVISIBLE';
      else if (cell === 6) type = 'REGENERATING';
      else if (cell === 7) type = 'MOVING';
      else if (cell === 8) type = 'INDESTRUCTIBLE';

      if (!type) continue;

      var brickData = BRICK_TYPES[type];
      bricks.push({
        x: BRICK_OFFSET_LEFT + col * (BRICK_WIDTH + BRICK_PADDING),
        y: BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_PADDING),
        w: BRICK_WIDTH,
        h: BRICK_HEIGHT,
        type: type,
        hitsTaken: 0,
        destroyed: false,
        originalX: BRICK_OFFSET_LEFT + col * (BRICK_WIDTH + BRICK_PADDING),
        vx: type === 'MOVING' ? (Math.random() > 0.5 ? 40 : -40) : 0,
        regenerating: false,
        regenTimer: 0,
        regenCount: 0,
        visible: type !== 'INVISIBLE',
      });
    }
  }

  // Count destructible bricks
  gameState.totalBricks = 0;
  gameState.bricksDestroyed = 0;
  for (var i = 0; i < bricks.length; i++) {
    if (bricks[i].type !== 'INDESTRUCTIBLE') gameState.totalBricks++;
  }

  // Malus de cinéatique : briques maudites
  if (gameState.levelMods.curseChance > 0) {
    var normalCount = 0;
    for (var nc = 0; nc < bricks.length; nc++) {
      if (bricks[nc].type === 'NORMAL' || bricks[nc].type === 'TOUGH') normalCount++;
    }
    var cursedN = Math.floor(normalCount * gameState.levelMods.curseChance);
    for (var c = 0; c < cursedN; c++) {
      var idx = randInt(0, bricks.length - 1);
      if (bricks[idx].type === 'NORMAL' || bricks[idx].type === 'TOUGH') {
        bricks[idx].type = 'STRONG';
        bricks[idx].hitsTaken = 0;
        bricks[idx].cursed = true;
      }
    }
  }
}

// ==================== BALL SYSTEM ====================
function createBall(x, y, vx, vy) {
  return {
    x: x, y: y,
    vx: vx, vy: vy,
    r: BALL_RADIUS,
    stuck: true,
    ghost: false,
  };
}

function getEffectivePaddleWidth() {
  return paddle.w * paddleWidthMultiplier * gameState.levelMods.paddleScale;
}

function getLevelSpeedMultiplier() {
  var lvl = gameState.level;
  var base = 1 + Math.min(lvl - 1, 14) * 0.10;
  var extra = Math.max(0, lvl - 15) * 0.045;
  return Math.min(base + extra, 3.6) * gameState.levelMods.speedScale;
}

function resetBalls() {
  balls = [];
  var pw = getEffectivePaddleWidth();
  var b = createBall(paddle.x + pw / 2, paddle.y - BALL_RADIUS - 2, 0, 0);
  balls.push(b);
  ballTrails = [];
  gameState.combo = 0;
}

function launchBalls() {
  for (var i = 0; i < balls.length; i++) {
    if (balls[i].stuck) {
      balls[i].stuck = false;
      var angle = (Math.random() - 0.5) * (Math.PI / 3);
      var speed = BALL_BASE_SPEED * getLevelSpeedMultiplier();
      balls[i].vx = speed * Math.sin(angle);
      balls[i].vy = -speed * Math.cos(angle);
    }
  }
}

function updatePaddle(dt) {
  var pw = getEffectivePaddleWidth();

  // Possessed paddle - moves on its own
  if (horrorEffects.possessedPaddle > 0) {
    paddle.x += horrorEffects.possessedDir * PADDLE_SPEED * 0.7 * dt;
    // Randomly change direction
    if (Math.random() < 0.02) {
      horrorEffects.possessedDir *= -1;
    }
    // Bounce off walls
    if (paddle.x <= 0) horrorEffects.possessedDir = 1;
    if (paddle.x >= CANVAS_WIDTH - pw) horrorEffects.possessedDir = -1;
    paddle.x = clamp(paddle.x, 0, CANVAS_WIDTH - pw);
    return;
  }

  if (inputMode === 'mouse' && mouseTargetX !== null) {
    var targetX = mouseTargetX;
    if (horrorEffects.drunk > 0) {
      // Ivresse : la raquette suit avec retard et titube
      targetX += Math.sin(frameCount * 0.06) * 70;
      paddle.x = lerp(paddle.x, targetX, 0.08);
    } else {
      paddle.x = lerp(paddle.x, targetX, 0.3);
    }
  } else {
    var leftDown = Input.isDown('ArrowLeft') || Input.isDown('KeyA') || Input.isDown('KeyQ');
    var rightDown = Input.isDown('ArrowRight') || Input.isDown('KeyD');
    // Inverse controls (troll effect)
    if (inverseControls) {
      var tmp = leftDown;
      leftDown = rightDown;
      rightDown = tmp;
    }
    var speedFactor = horrorEffects.drunk > 0 ? 0.55 : 1;
    if (leftDown) {
      paddle.x -= PADDLE_SPEED * speedFactor * dt;
    }
    if (rightDown) {
      paddle.x += PADDLE_SPEED * speedFactor * dt;
    }
    if (horrorEffects.drunk > 0) {
      paddle.x += Math.sin(frameCount * 0.06) * 70 * dt;
    }
  }

  paddle.x = clamp(paddle.x, 0, CANVAS_WIDTH - pw);

  // Le Monstre traque l'immobilité de la raquette
  var lastX = paddle.lastX === undefined ? paddle.x : paddle.lastX;
  if (Math.abs(paddle.x - lastX) > 0.4) {
    if (monster.warned && monster.anim > 0.25) {
      unlockAchievement('survivedMonster');
    }
    resetMonsterIdle();
  }
  paddle.lastX = paddle.x;
}

function updateBalls(dt) {
  for (var bi = balls.length - 1; bi >= 0; bi--) {
    var ball = balls[bi];

    if (ball.stuck) {
      var pw = getEffectivePaddleWidth();
      ball.x = paddle.x + pw / 2;
      ball.x = clamp(ball.x, ball.r, CANVAS_WIDTH - ball.r);
      ball.y = paddle.y - ball.r - 2;
      continue;
    }

    var evx = ball.vx * speedMultiplier;
    var evy = ball.vy * speedMultiplier;
    ball.x += evx * dt;
    ball.y += evy * dt;

    // Trail
    if (!ballTrails[bi]) ballTrails[bi] = [];
    ballTrails[bi].push({ x: ball.x, y: ball.y, life: 0.3 });
    if (ballTrails[bi].length > 20) ballTrails[bi].shift();
    for (var ti = ballTrails[bi].length - 1; ti >= 0; ti--) {
      ballTrails[bi][ti].life -= dt;
      if (ballTrails[bi][ti].life <= 0) ballTrails[bi].splice(ti, 1);
    }

    // Wall collisions
    if (ball.x - ball.r < 0) {
      ball.x = ball.r;
      ball.vx = -ball.vx;
      Sound.bounce();
      if (Math.abs(ball.vy) < 30) ball.vy = ball.vy >= 0 ? 30 : -30;
    }
    if (ball.x + ball.r > CANVAS_WIDTH) {
      ball.x = CANVAS_WIDTH - ball.r;
      ball.vx = -ball.vx;
      Sound.bounce();
      if (Math.abs(ball.vy) < 30) ball.vy = ball.vy >= 0 ? 30 : -30;
    }
    if (ball.y - ball.r < 0) {
      ball.y = ball.r;
      ball.vy = -ball.vy;
      Sound.bounce();
    }

    // Bottom - ball lost
    if (ball.y - ball.r > CANVAS_HEIGHT) {
      // Shield check
      if (shieldActive && shieldHits > 0) {
        shieldHits--;
        ball.y = CANVAS_HEIGHT - 40;
        ball.vy = -Math.abs(ball.vy);
        if (Math.abs(ball.vy) < 100) ball.vy = -200;
        Sound.bounce();
        if (shieldHits <= 0) shieldActive = false;
        continue;
      }
      balls.splice(bi, 1);
      ballTrails.splice(bi, 1);
      if (balls.length === 0) {
        loseLife();
        return;
      }
      continue;
    }

    // Paddle collision
    checkBallPaddleCollision(ball);

    // Brick collisions
    checkBallBrickCollisions(ball);

    // Boss collision
    if (boss.active && !boss.defeated) {
      checkBallBossCollision(ball);
    }
  }
}

function checkBallPaddleCollision(ball) {
  var pw = getEffectivePaddleWidth();

  if (ball.y + ball.r >= paddle.y &&
      ball.y - ball.r <= paddle.y + paddle.h &&
      ball.x + ball.r >= paddle.x &&
      ball.x - ball.r <= paddle.x + pw &&
      ball.vy > 0) {

    var hitPos = (ball.x - (paddle.x + pw / 2)) / (pw / 2);
    var clampedHit = clamp(hitPos, -1, 1);
    var maxAngle = Math.PI / 3;
    var angle = clampedHit * maxAngle;

    var speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (speed < 1) speed = BALL_BASE_SPEED * getLevelSpeedMultiplier();
    ball.vx = speed * Math.sin(angle);
    ball.vy = -speed * Math.cos(angle);

    ball.y = paddle.y - ball.r - 1;
    gameState.combo = 0;
    Sound.bounce();
  }
}

function checkBallBrickCollisions(ball) {
  for (var i = 0; i < bricks.length; i++) {
    var brick = bricks[i];
    if (brick.destroyed) {
      continue;
    }

    // Reveal invisible bricks near ball
    if (brick.type === 'INVISIBLE') {
      var distToBall = Math.sqrt(distSq(ball.x, ball.y, brick.x + brick.w / 2, brick.y + brick.h / 2));
      brick.visible = distToBall < 100;
    }

    // Move moving bricks
    if (brick.type === 'MOVING') {
      // Movement handled in updateBricks
    }

    // Find closest point on brick to ball center
    var closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.w));
    var closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.h));

    var dx = ball.x - closestX;
    var dy = ball.y - closestY;
    var distSqVal = dx * dx + dy * dy;

    if (distSqVal < ball.r * ball.r) {
      // Ghost ball destroys without bouncing
      if (ghostBall || ball.ghost) {
        damageBrick(brick, ball, true);
        continue;
      }

      var dist = Math.sqrt(distSqVal);
      var nx, ny;

      if (dist < 0.001) {
        if (Math.abs(ball.vx) > Math.abs(ball.vy)) {
          nx = ball.vx > 0 ? -1 : 1;
          ny = 0;
        } else {
          nx = 0;
          ny = ball.vy > 0 ? -1 : 1;
        }
      } else {
        nx = dx / dist;
        ny = dy / dist;
      }

      var dot = ball.vx * nx + ball.vy * ny;
      ball.vx -= 2 * dot * nx;
      ball.vy -= 2 * dot * ny;

      var overlap = Math.min(ball.r - dist + 0.5, ball.r);
      ball.x += nx * overlap;
      ball.y += ny * overlap;

      damageBrick(brick, ball, false);
      updateHUD();
      break;
    }
  }
}

// ==================== BRICK SYSTEM ====================
function damageBrick(brick, ball, ghostMode) {
  if (brick.type === 'INDESTRUCTIBLE') {
    Sound.brickHit();
    return;
  }

  brick.hitsTaken++;
  var brickType = BRICK_TYPES[brick.type];
  var colors = brickType.colors;

  if (brick.hitsTaken >= brickType.hits) {
    destroyBrick(brick, ghostMode);
  } else {
    var hitColorIdx = Math.min(brick.hitsTaken, colors.length - 1);
    var hitColor = colors[hitColorIdx];
    spawnParticles(ball.x, ball.y, hitColor, 4);
    Sound.brickHit();
  }
}

function destroyBrick(brick, ghostMode) {
  if (brick.destroyed) return;
  brick.destroyed = true;
  gameState.bricksDestroyed++;

  // First brick achievement
  if (gameState.bricksDestroyed === 1) {
    unlockAchievement('firstBrick');
  }
  // Combo achievement
  if (gameState.combo === 10) {
    unlockAchievement('combo10');
  }
  // Half game achievement
  if (gameState.level >= Math.ceil(LEVELS.length / 2) && gameState.achievements.indexOf('halfGame') < 0) {
    unlockAchievement('halfGame');
  }

  var brickType = BRICK_TYPES[brick.type];
  var colors = brickType.colors;
  var colorIdx = Math.min(brick.hitsTaken - 1, colors.length - 1);
  var pColor = colors[colorIdx];

  // Score with combo
  gameState.combo++;
  var points = brickType.points * gameState.combo;
  gameState.score += points;

  // Particles
  spawnParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, pColor, 12);

  // Screen shake
  if (!reducedMotion) {
    shakeIntensity = Math.max(shakeIntensity, 4);
  }

  Sound.brickBreak();

  // Explosive brick - chain reaction
  if (brick.type === 'EXPLOSIVE') {
    Sound.explosion();
    shakeIntensity = Math.max(shakeIntensity, 12);
    spawnParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, '#ff8800', 30);
    // Destroy nearby bricks
    var explosionRadius = 80;
    for (var i = 0; i < bricks.length; i++) {
      var other = bricks[i];
      if (other.destroyed || other === brick) continue;
      if (other.type === 'INDESTRUCTIBLE') continue;
      var cx = other.x + other.w / 2;
      var cy = other.y + other.h / 2;
      var dist = Math.sqrt(distSq(brick.x + brick.w / 2, brick.y + brick.h / 2, cx, cy));
      if (dist < explosionRadius) {
        destroyBrick(other, ghostMode);
      }
    }
  }

  // Regenerating brick - start regen timer
  if (brick.type === 'REGENERATING' && brick.regenCount < 1) {
    brick.regenerating = true;
    brick.regenTimer = 5.0;
  }

  // Power-up drop
  if (Math.random() < POWERUP_DROP_CHANCE) {
    var puType;
    var trollChance = 0;
    if (gameState.horrorMode) {
      trollChance = 0.25 + gameState.levelMods.trollBonus;
      if (gameState.secretMode === 'infernal') trollChance += 0.2;
      if (gameState.secretMode === 'candy') trollChance += 0.35;
    }
    if (Math.random() < Math.min(0.75, trollChance)) {
      puType = TROLL_TYPES[Math.floor(Math.random() * TROLL_TYPES.length)];
    } else {
      puType = GOOD_TYPES[Math.floor(Math.random() * GOOD_TYPES.length)];
    }
    powerUps.push({
      x: brick.x + brick.w / 2,
      y: brick.y + brick.h / 2,
      type: puType,
      w: 24, h: 24,
      vy: POWERUP_SPEED,
    });
  }

  checkLevelComplete();
}

function updateBricks(dt) {
  for (var i = 0; i < bricks.length; i++) {
    var brick = bricks[i];
    if (brick.destroyed) {
      if (brick.regenerating && brick.regenCount < 1) {
        brick.regenTimer -= dt;
        if (brick.regenTimer <= 0) {
          brick.destroyed = false;
          brick.regenerating = false;
          brick.hitsTaken = 0;
          brick.regenCount++;
          spawnParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, '#22ddaa', 8);
        }
      }
      continue;
    }

    // Move moving bricks
    if (brick.type === 'MOVING') {
      brick.x += brick.vx * dt;
      if (brick.x < BRICK_OFFSET_LEFT) {
        brick.x = BRICK_OFFSET_LEFT;
        brick.vx = Math.abs(brick.vx);
      }
      if (brick.x + brick.w > CANVAS_WIDTH - BRICK_OFFSET_LEFT) {
        brick.x = CANVAS_WIDTH - BRICK_OFFSET_LEFT - brick.w;
        brick.vx = -Math.abs(brick.vx);
      }
    }
  }
}

// ==================== MALUS HELPERS ====================
function restoreBallRadius() {
  for (var i = 0; i < balls.length; i++) balls[i].r = BALL_RADIUS;
}

function curseBricks(maxCount) {
  var candidates = [];
  for (var i = 0; i < bricks.length; i++) {
    if (!bricks[i].destroyed && (bricks[i].type === 'NORMAL' || bricks[i].type === 'TOUGH')) {
      candidates.push(bricks[i]);
    }
  }
  var n = Math.min(maxCount, candidates.length);
  for (var j = 0; j < n; j++) {
    var b = candidates.splice(randInt(0, candidates.length - 1), 1)[0];
    if (!b) break;
    b.type = 'STRONG';
    b.hitsTaken = 0;
    b.cursed = true;
    spawnParticles(b.x + b.w / 2, b.y + b.h / 2, '#9933cc', 10);
  }
}

// ==================== POWER-UP LOGIC ====================
function updatePowerUps(dt) {
  var pw = getEffectivePaddleWidth();

  for (var i = powerUps.length - 1; i >= 0; i--) {
    var pu = powerUps[i];
    pu.y += pu.vy * dt;

    if (pu.y > CANVAS_HEIGHT) {
      powerUps.splice(i, 1);
      continue;
    }

    if (pu.x + pu.w / 2 > paddle.x &&
        pu.x - pu.w / 2 < paddle.x + pw &&
        pu.y + pu.h / 2 > paddle.y &&
        pu.y - pu.h / 2 < paddle.y + paddle.h) {
      applyPowerUp(pu.type);
      powerUps.splice(i, 1);
    }
  }
}

function applyPowerUp(type) {
  var isTroll = POWERUP_TYPES[type] && POWERUP_TYPES[type].troll;

  // Reset previous power-up effect
  if (activePowerUp.active) {
    if (activePowerUp.type === 'EXPAND') paddleWidthMultiplier = 1.0;
    else if (activePowerUp.type === 'SLOW') speedMultiplier = 1.0;
    else if (activePowerUp.type === 'GHOST') ghostBall = false;
    else if (activePowerUp.type === 'TINY') paddleWidthMultiplier = 1.0;
    else if (activePowerUp.type === 'FAST') speedMultiplier = 1.0;
    else if (activePowerUp.type === 'INVERSE') inverseControls = false;
    else if (activePowerUp.type === 'MINIBALL') restoreBallRadius();
  }

  activePowerUp.type = type;
  activePowerUp.timer = POWERUP_DURATION;
  activePowerUp.active = true;

  if (type === 'EXPAND') {
    paddleWidthMultiplier = 1.5;
    Sound.powerUp();
  } else if (type === 'SLOW') {
    speedMultiplier = 0.6;
    Sound.powerUp();
  } else if (type === 'GHOST') {
    ghostBall = true;
    Sound.powerUp();
  } else if (type === 'MULTIBALL') {
    // Split existing balls into 3
    var newBalls = [];
    for (var i = 0; i < balls.length && newBalls.length < MAX_BALLS - 1; i++) {
      if (!balls[i].stuck) {
        var speed = Math.sqrt(balls[i].vx * balls[i].vx + balls[i].vy * balls[i].vy);
        var angle = Math.atan2(balls[i].vy, balls[i].vx);
        newBalls.push(createBall(balls[i].x, balls[i].y,
          speed * Math.cos(angle + 0.4), speed * Math.sin(angle + 0.4)));
        newBalls.push(createBall(balls[i].x, balls[i].y,
          speed * Math.cos(angle - 0.4), speed * Math.sin(angle - 0.4)));
      }
    }
    for (var j = 0; j < newBalls.length && balls.length < MAX_BALLS; j++) {
      newBalls[j].stuck = false;
      balls.push(newBalls[j]);
      ballTrails.push([]);
    }
    Sound.powerUp();
  } else if (type === 'SHIELD') {
    shieldActive = true;
    shieldHits = 3;
    Sound.powerUp();
  } else if (type === 'LASER') {
    Sound.powerUp();
  } else if (type === 'TINY') {
    // Troll: makes paddle tiny instead of large
    paddleWidthMultiplier = 0.4;
    Sound.trollPowerUp();
    horrorEffects.glitch = Math.max(horrorEffects.glitch, 0.5);
  } else if (type === 'INVERSE') {
    // Troll: inverse controls
    inverseControls = true;
    Sound.trollPowerUp();
    horrorEffects.flicker = Math.max(horrorEffects.flicker, 0.4);
  } else if (type === 'FAST') {
    // Troll: ball speeds up instead of slowing down
    speedMultiplier = 1.8;
    Sound.trollPowerUp();
    shakeIntensity = Math.max(shakeIntensity, 10);
  } else if (type === 'CHAOS') {
    // Troll: random effect - could be good or bad
    var chaosRoll = randInt(0, 5);
    if (chaosRoll === 0) {
      // Good: temporary invincibility (shield + ghost)
      shieldActive = true;
      shieldHits = 5;
      ghostBall = true;
      Sound.powerUp();
    } else if (chaosRoll === 1) {
      // Bad: tiny paddle + fast ball
      paddleWidthMultiplier = 0.5;
      speedMultiplier = 1.5;
      Sound.trollPowerUp();
    } else if (chaosRoll === 2) {
      // Neutral: trigger a screamer
      triggerScreamer();
      Sound.trollPowerUp();
    } else if (chaosRoll === 3) {
      // Good: big score bonus
      gameState.score += 500;
      updateHUD();
      Sound.powerUp();
    } else if (chaosRoll === 4) {
      // Bad: possessed paddle
      horrorEffects.possessedPaddle = 5.0;
      horrorEffects.possessedDir = Math.random() < 0.5 ? -1 : 1;
      Sound.trollPowerUp();
    } else {
      // Neutral: multiball
      var chaosBalls = [];
      for (var ci = 0; ci < balls.length && chaosBalls.length < MAX_BALLS - 1; ci++) {
        if (!balls[ci].stuck) {
          var cspeed = Math.sqrt(balls[ci].vx * balls[ci].vx + balls[ci].vy * balls[ci].vy);
          var cangle = Math.atan2(balls[ci].vy, balls[ci].vx);
          chaosBalls.push(createBall(balls[ci].x, balls[ci].y,
            cspeed * Math.cos(cangle + 0.5), cspeed * Math.sin(cangle + 0.5)));
          chaosBalls.push(createBall(balls[ci].x, balls[ci].y,
            cspeed * Math.cos(cangle - 0.5), cspeed * Math.sin(cangle - 0.5)));
        }
      }
      for (var cj = 0; cj < chaosBalls.length && balls.length < MAX_BALLS; cj++) {
        chaosBalls[cj].stuck = false;
        balls.push(chaosBalls[cj]);
        ballTrails.push([]);
      }
      Sound.powerUp();
    }
  } else if (type === 'FOG') {
    // Malus : brume épaisse sur l'écran
    horrorEffects.fogScreen = 8;
    Sound.trollPowerUp();
    Sound.growl();
  } else if (type === 'BLACKOUT') {
    // Malus : coupure de courant
    horrorEffects.blackout = 2.0;
    Sound.trollPowerUp();
    horrorEffects.glitch = Math.max(horrorEffects.glitch, 0.8);
  } else if (type === 'DRUNK') {
    // Malus : raquette ivre
    horrorEffects.drunk = 8;
    Sound.trollPowerUp();
    horrorEffects.flicker = Math.max(horrorEffects.flicker, 0.5);
  } else if (type === 'CURSE') {
    // Malus : briques maudites
    curseBricks(4);
    Sound.trollPowerUp();
    horrorEffects.glitch = Math.max(horrorEffects.glitch, 0.6);
  } else if (type === 'MINIBALL') {
    // Malus : balle minuscule
    for (var mi = 0; mi < balls.length; mi++) balls[mi].r = 4;
    Sound.trollPowerUp();
  }

  // Suivi des malus pour le succès "collectionneur"
  if (POWERUP_TYPES[type] && POWERUP_TYPES[type].troll) {
    gameState.malusSeen[type] = true;
    var seenCount = 0;
    for (var mt = 0; mt < TROLL_TYPES.length; mt++) {
      if (gameState.malusSeen[TROLL_TYPES[mt]]) seenCount++;
    }
    if (seenCount >= TROLL_TYPES.length) unlockAchievement('allMalus');
  }

  var pw = getEffectivePaddleWidth();
  paddle.x = clamp(paddle.x, 0, CANVAS_WIDTH - pw);
}

function updateActivePowerUp(dt) {
  if (activePowerUp.active) {
    activePowerUp.timer -= dt * 1000;
    if (activePowerUp.timer <= 0) {
      activePowerUp.active = false;
      if (activePowerUp.type === 'EXPAND') paddleWidthMultiplier = 1.0;
      else if (activePowerUp.type === 'SLOW') speedMultiplier = 1.0;
      else if (activePowerUp.type === 'GHOST') ghostBall = false;
      else if (activePowerUp.type === 'TINY') paddleWidthMultiplier = 1.0;
      else if (activePowerUp.type === 'FAST') speedMultiplier = 1.0;
      else if (activePowerUp.type === 'INVERSE') inverseControls = false;
      else if (activePowerUp.type === 'MINIBALL') restoreBallRadius();
      activePowerUp.type = null;
    }
  }
}

// ==================== LASER SYSTEM ====================
function fireLaser() {
  if (!activePowerUp.active || activePowerUp.type !== 'LASER') return;
  if (laserShots.length >= MAX_LASER_SHOTS) return;

  var pw = getEffectivePaddleWidth();
  laserShots.push({
    x: paddle.x + 15,
    y: paddle.y,
    vy: -600,
    w: 4, h: 16,
  });
  laserShots.push({
    x: paddle.x + pw - 19,
    y: paddle.y,
    vy: -600,
    w: 4, h: 16,
  });
  Sound.laser();
}

function updateLaserShots(dt) {
  for (var i = laserShots.length - 1; i >= 0; i--) {
    var shot = laserShots[i];
    shot.y += shot.vy * dt;

    if (shot.y < 0) {
      laserShots.splice(i, 1);
      continue;
    }

    // Check brick collisions
    var hitBrick = false;
    for (var bi = 0; bi < bricks.length; bi++) {
      var brick = bricks[bi];
      if (brick.destroyed) continue;
      if (shot.x + shot.w > brick.x && shot.x < brick.x + brick.w &&
          shot.y < brick.y + brick.h && shot.y + shot.h > brick.y) {
        if (brick.type !== 'INDESTRUCTIBLE') {
          damageBrick(brick, { x: shot.x, y: shot.y }, false);
        }
        hitBrick = true;
        break;
      }
    }

    // Check boss collision
    if (!hitBrick && boss.active && !boss.defeated) {
      if (shot.x + shot.w > boss.x - boss.w / 2 && shot.x < boss.x + boss.w / 2 &&
          shot.y < boss.y + boss.h / 2 && shot.y + shot.h > boss.y - boss.h / 2) {
        damageBoss(1);
        hitBrick = true;
      }
    }

    if (hitBrick) {
      laserShots.splice(i, 1);
    }
  }
}

// ==================== BOSS SYSTEM ====================
function startBoss(level) {
  var idx = getBossIndex(level);
  if (idx < 0) return;

  var def = BOSS_DEFS[idx];
  boss.active = true;
  boss.defeated = false;
  boss.x = CANVAS_WIDTH / 2;
  boss.y = 120;
  boss.w = 80;
  boss.h = 40;
  boss.hp = def.hp;
  boss.maxHp = def.hp;
  boss.vx = 100;
  boss.vy = 0;
  boss.hitCooldown = 0;
  boss.attackTimer = 2.0;
  boss.pattern = def.pattern;
  boss.color = def.color;
  boss.name = def.name;
  boss.phase = 0;
  boss.spawnTimer = 0;
  boss.invulnerable = false;
  boss.rotAngle = 0;
  boss.phaseTimer = 1.5;

  Sound.bossSpawn();
  showBossHud(def.name, def.hp);

  // First boss achievement
  if (gameState.achievements.indexOf('firstBoss') < 0) {
    unlockAchievement('firstBoss');
  }

  if (gameState.horrorMode) {
    Sound.startDrone();
    Sound.setDroneIntensity(0.5 + idx * 0.1);
  }
}

function updateBoss(dt) {
  if (!boss.active || boss.defeated) return;

  if (boss.hitCooldown > 0) boss.hitCooldown -= dt;
  if (boss.attackTimer > 0) boss.attackTimer -= dt;

  // Movement patterns
  if (boss.pattern === 'mover' || boss.pattern === 'final') {
    boss.x += boss.vx * dt;
    if (boss.x < 80) { boss.x = 80; boss.vx = Math.abs(boss.vx); }
    if (boss.x > CANVAS_WIDTH - 80) { boss.x = CANVAS_WIDTH - 80; boss.vx = -Math.abs(boss.vx); }
  }

  if (boss.pattern === 'shooter') {
    // Slow horizontal movement
    boss.x += boss.vx * 0.5 * dt;
    if (boss.x < 80) { boss.x = 80; boss.vx = Math.abs(boss.vx); }
    if (boss.x > CANVAS_WIDTH - 80) { boss.x = CANVAS_WIDTH - 80; boss.vx = -Math.abs(boss.vx); }

    // Shoot projectiles
    if (boss.attackTimer <= 0) {
      boss.attackTimer = 2.0;
      spawnBossProjectile(boss.x, boss.y + boss.h / 2, 0, 250);
    }
  }

  if (boss.pattern === 'summoner') {
    // Slow movement
    boss.x += boss.vx * 0.3 * dt;
    if (boss.x < 80) { boss.x = 80; boss.vx = Math.abs(boss.vx); }
    if (boss.x > CANVAS_WIDTH - 80) { boss.x = CANVAS_WIDTH - 80; boss.vx = -Math.abs(boss.vx); }

    // Spawn cursed bricks
    if (boss.attackTimer <= 0) {
      boss.attackTimer = 4.0;
      // Add a few normal bricks that need to be destroyed
      for (var i = 0; i < 3; i++) {
        var bx = randRange(100, CANVAS_WIDTH - 164);
        var by = randRange(80, 200);
        var existing = false;
        for (var j = 0; j < bricks.length; j++) {
          if (!bricks[j].destroyed && Math.abs(bricks[j].x - bx) < 70 && Math.abs(bricks[j].y - by) < 30) {
            existing = true;
            break;
          }
        }
        if (!existing) {
          bricks.push({
            x: bx, y: by, w: BRICK_WIDTH, h: BRICK_HEIGHT,
            type: 'NORMAL', hitsTaken: 0, destroyed: false,
            originalX: bx, vx: 0,
            regenerating: false, regenTimer: 0, regenCount: 0,
            visible: true,
          });
          gameState.totalBricks++;
        }
      }
    }
  }

  if (boss.pattern === 'laser') {
    // Stay in center
    boss.x = CANVAS_WIDTH / 2;

    // Fire laser beams (vertical lines)
    if (boss.attackTimer <= 0) {
      boss.attackTimer = 3.0;
      // Create laser warning then fire
      horrorEffects.glitch = Math.max(horrorEffects.glitch, 0.5);
      // Fire projectiles in a spread
      for (var k = 0; k < 5; k++) {
        var angle = (k - 2) * 0.15 + Math.PI / 2;
        var speed = 200;
        spawnBossProjectile(boss.x, boss.y + boss.h / 2,
          Math.cos(angle) * speed, Math.sin(angle) * speed);
      }
    }
  }

  if (boss.pattern === 'final') {
    // Mix of all patterns + extra
    if (boss.attackTimer <= 0) {
      boss.attackTimer = 1.5;
      var attackType = randInt(0, 2);
      if (attackType === 0) {
        // Spread shot
        for (var m = 0; m < 7; m++) {
          var a = (m - 3) * 0.12 + Math.PI / 2;
          spawnBossProjectile(boss.x, boss.y + boss.h / 2,
            Math.cos(a) * 220, Math.sin(a) * 220);
        }
      } else if (attackType === 1) {
        // Targeted shot
        var pw = getEffectivePaddleWidth();
        var targetX = paddle.x + pw / 2;
        var dx = targetX - boss.x;
        var dy = CANVAS_HEIGHT - 40 - boss.y;
        var len = Math.sqrt(dx * dx + dy * dy);
        spawnBossProjectile(boss.x, boss.y + boss.h / 2,
          (dx / len) * 280, (dy / len) * 280);
      } else {
        // Glitch attack
        horrorEffects.glitch = 1.0;
        horrorEffects.flicker = 1.0;
        if (gameState.horrorMode) {
          triggerScreamer();
        }
      }
    }
  }

  if (boss.pattern === 'chaser') {
    // LE POSSEDE : traque la raquette a l'horizontale
    var pwc = getEffectivePaddleWidth();
    var targetXc = clamp(paddle.x + pwc / 2, 90, CANVAS_WIDTH - 90);
    var maxStep = 340 * dt;
    var deltaC = targetXc - boss.x;
    boss.x += clamp(deltaC, -maxStep, maxStep);
    boss.y = 110 + Math.sin(frameCount * 0.06) * 18;

    if (boss.attackTimer <= 0) {
      boss.attackTimer = 1.6;
      var dxc = (paddle.x + pwc / 2) - boss.x;
      var dyc = (CANVAS_HEIGHT - 40) - boss.y;
      var lenc = Math.sqrt(dxc * dxc + dyc * dyc) || 1;
      spawnBossProjectile(boss.x, boss.y + boss.h / 2, (dxc / lenc) * 320, (dyc / lenc) * 320);
    }
  }

  if (boss.pattern === 'swarm') {
    // LA NUEE : invoque des briques en rafale et tire des essaims
    boss.x += boss.vx * 0.4 * dt;
    if (boss.x < 80) { boss.x = 80; boss.vx = Math.abs(boss.vx); }
    if (boss.x > CANVAS_WIDTH - 80) { boss.x = CANVAS_WIDTH - 80; boss.vx = -Math.abs(boss.vx); }

    if (boss.attackTimer <= 0) {
      boss.attackTimer = 2.6;
      for (var sw = 0; sw < 5; sw++) {
        var sbx = randRange(100, CANVAS_WIDTH - 164);
        var sby = randRange(80, 210);
        var existsSw = false;
        for (var sj = 0; sj < bricks.length; sj++) {
          if (!bricks[sj].destroyed && Math.abs(bricks[sj].x - sbx) < 60 && Math.abs(bricks[sj].y - sby) < 26) {
            existsSw = true;
            break;
          }
        }
        if (!existsSw) {
          bricks.push({
            x: sbx, y: sby, w: BRICK_WIDTH, h: BRICK_HEIGHT,
            type: 'NORMAL', hitsTaken: 0, destroyed: false,
            originalX: sbx, vx: 0,
            regenerating: false, regenTimer: 0, regenCount: 0,
            visible: true,
          });
          gameState.totalBricks++;
        }
      }
      for (var sp = 0; sp < 3; sp++) {
        var sAngle = (sp - 1) * 0.3 + Math.PI / 2;
        spawnBossProjectile(boss.x, boss.y + boss.h / 2, Math.cos(sAngle) * 180, Math.sin(sAngle) * 180);
      }
    }
  }

  if (boss.pattern === 'mirror') {
    // LE MIROIR : se deplace a l'inverse de la raquette et tire dans son propre alignement
    var pwm = getEffectivePaddleWidth();
    var mirroredX = CANVAS_WIDTH - (paddle.x + pwm / 2);
    boss.x = clamp(mirroredX, 90, CANVAS_WIDTH - 90);

    if (boss.attackTimer <= 0) {
      boss.attackTimer = 1.7;
      spawnBossProjectile(boss.x, boss.y + boss.h / 2, 0, 260);
      if (Math.random() < 0.5) {
        var pwm2 = getEffectivePaddleWidth();
        var realX = paddle.x + pwm2 / 2;
        var dxm = realX - boss.x;
        var dym = (CANVAS_HEIGHT - 40) - boss.y;
        var lenm = Math.sqrt(dxm * dxm + dym * dym) || 1;
        spawnBossProjectile(boss.x, boss.y + boss.h / 2, (dxm / lenm) * 240, (dym / lenm) * 240);
      }
    }
  }

  if (boss.pattern === 'phantom') {
    // LE FANTOME : alterne phases visibles/invulnerables
    boss.phaseTimer -= dt;
    if (boss.phaseTimer <= 0) {
      boss.invulnerable = !boss.invulnerable;
      boss.phaseTimer = boss.invulnerable ? 1.3 : 1.8;
      if (boss.invulnerable) {
        boss.x = randRange(110, CANVAS_WIDTH - 110);
      }
    }
    if (boss.invulnerable) {
      if (boss.attackTimer <= 0) {
        boss.attackTimer = 0.5;
        for (var ph = 0; ph < 4; ph++) {
          var phAngle = (ph - 1.5) * 0.35 + Math.PI / 2;
          spawnBossProjectile(boss.x, boss.y + boss.h / 2, Math.cos(phAngle) * 200, Math.sin(phAngle) * 200);
        }
      }
    } else {
      boss.x += boss.vx * 0.6 * dt;
      if (boss.x < 90) { boss.x = 90; boss.vx = Math.abs(boss.vx); }
      if (boss.x > CANVAS_WIDTH - 90) { boss.x = CANVAS_WIDTH - 90; boss.vx = -Math.abs(boss.vx); }
    }
  }

  if (boss.pattern === 'berserker') {
    // L'ENRAGE : plus il perd de vie, plus il devient rapide et agressif
    var hpFrac = boss.maxHp > 0 ? boss.hp / boss.maxHp : 1;
    var rage = 1 + (1 - hpFrac) * 1.4;
    boss.x += boss.vx * rage * dt;
    if (boss.x < 80) { boss.x = 80; boss.vx = Math.abs(boss.vx); }
    if (boss.x > CANVAS_WIDTH - 80) { boss.x = CANVAS_WIDTH - 80; boss.vx = -Math.abs(boss.vx); }

    if (boss.attackTimer <= 0) {
      boss.attackTimer = Math.max(0.5, 1.8 / rage);
      var burst = Math.floor(2 + (1 - hpFrac) * 4);
      for (var br = 0; br < burst; br++) {
        var bAngle = (br - (burst - 1) / 2) * 0.22 + Math.PI / 2;
        spawnBossProjectile(boss.x, boss.y + boss.h / 2, Math.cos(bAngle) * (220 * rage * 0.7), Math.sin(bAngle) * (220 * rage * 0.7));
      }
    }
  }

  if (boss.pattern === 'vortex') {
    // LE TOURBILLON : trajectoire circulaire et tirs rotatifs continus
    boss.x = CANVAS_WIDTH / 2 + Math.sin(frameCount * 0.03) * 230;
    boss.y = 110 + Math.cos(frameCount * 0.04) * 35;
    boss.rotAngle += dt * 2.4;

    if (boss.attackTimer <= 0) {
      boss.attackTimer = 0.35;
      spawnBossProjectile(boss.x, boss.y + boss.h / 2, Math.cos(boss.rotAngle) * 210, Math.sin(boss.rotAngle) * 210 + 60);
      spawnBossProjectile(boss.x, boss.y + boss.h / 2, Math.cos(boss.rotAngle + Math.PI) * 210, Math.sin(boss.rotAngle + Math.PI) * 210 + 60);
    }
  }

  if (boss.pattern === 'apocalypse') {
    // L'ABOMINATION : boss final, combine tout
    var pwa = getEffectivePaddleWidth();
    var targetXa = clamp(paddle.x + pwa / 2, 90, CANVAS_WIDTH - 90);
    boss.x += clamp(targetXa - boss.x, -140 * dt, 140 * dt);

    if (boss.invulnerable) {
      boss.phaseTimer -= dt;
      if (boss.phaseTimer <= 0) boss.invulnerable = false;
    }

    if (boss.attackTimer <= 0) {
      boss.attackTimer = 1.0;
      var atk = randInt(0, 3);
      if (atk === 0) {
        for (var ap = 0; ap < 9; ap++) {
          var aAngle = (ap - 4) * 0.14 + Math.PI / 2;
          spawnBossProjectile(boss.x, boss.y + boss.h / 2, Math.cos(aAngle) * 230, Math.sin(aAngle) * 230);
        }
      } else if (atk === 1) {
        var dxa1 = (paddle.x + pwa / 2 - 25) - boss.x;
        var dya1 = (CANVAS_HEIGHT - 40) - boss.y;
        var lena1 = Math.sqrt(dxa1 * dxa1 + dya1 * dya1) || 1;
        spawnBossProjectile(boss.x, boss.y + boss.h / 2, (dxa1 / lena1) * 300, (dya1 / lena1) * 300);
        var dxa2 = (paddle.x + pwa / 2 + 25) - boss.x;
        var dya2 = (CANVAS_HEIGHT - 40) - boss.y;
        var lena2 = Math.sqrt(dxa2 * dxa2 + dya2 * dya2) || 1;
        spawnBossProjectile(boss.x, boss.y + boss.h / 2, (dxa2 / lena2) * 300, (dya2 / lena2) * 300);
      } else if (atk === 2) {
        for (var asw = 0; asw < 4; asw++) {
          var asbx = randRange(100, CANVAS_WIDTH - 164);
          var asby = randRange(80, 210);
          bricks.push({
            x: asbx, y: asby, w: BRICK_WIDTH, h: BRICK_HEIGHT,
            type: 'NORMAL', hitsTaken: 0, destroyed: false,
            originalX: asbx, vx: 0,
            regenerating: false, regenTimer: 0, regenCount: 0,
            visible: true,
          });
          gameState.totalBricks++;
        }
      } else {
        horrorEffects.glitch = 1.0;
        horrorEffects.flicker = 1.0;
        boss.invulnerable = true;
        boss.phaseTimer = 0.5;
        boss.x = randRange(110, CANVAS_WIDTH - 110);
        if (gameState.horrorMode) triggerScreamer();
      }
    }
  }
}

function spawnBossProjectile(x, y, vx, vy) {
  if (bossProjectiles.length >= MAX_BOSS_PROJECTILES) return;
  bossProjectiles.push({
    x: x, y: y, vx: vx, vy: vy,
    r: 8, life: 5.0,
  });
}

function updateBossProjectiles(dt) {
  for (var i = bossProjectiles.length - 1; i >= 0; i--) {
    var proj = bossProjectiles[i];
    proj.x += proj.vx * dt;
    proj.y += proj.vy * dt;
    proj.life -= dt;

    if (proj.life <= 0 || proj.y > CANVAS_HEIGHT || proj.x < 0 || proj.x > CANVAS_WIDTH) {
      bossProjectiles.splice(i, 1);
      continue;
    }

    // Check paddle collision
    var pw = getEffectivePaddleWidth();
    if (proj.y + proj.r > paddle.y && proj.y - proj.r < paddle.y + paddle.h &&
        proj.x + proj.r > paddle.x && proj.x - proj.r < paddle.x + pw) {
      bossProjectiles.splice(i, 1);
      // Shield absorbs
      if (shieldActive && shieldHits > 0) {
        shieldHits--;
        if (shieldHits <= 0) shieldActive = false;
        Sound.bounce();
      } else {
        loseLife();
        return;
      }
    }
  }
}

function checkBallBossCollision(ball) {
  if (boss.hitCooldown > 0) return;
  if (boss.invulnerable) return;

  var bx = boss.x;
  var by = boss.y;
  var bw = boss.w / 2;
  var bh = boss.h / 2;

  var closestX = Math.max(bx - bw, Math.min(ball.x, bx + bw));
  var closestY = Math.max(by - bh, Math.min(ball.y, by + bh));

  var dx = ball.x - closestX;
  var dy = ball.y - closestY;
  var dsq = dx * dx + dy * dy;

  if (dsq < ball.r * ball.r) {
    var dist = Math.sqrt(dsq);
    var nx, ny;
    if (dist < 0.001) {
      nx = 0; ny = -1;
    } else {
      nx = dx / dist;
      ny = dy / dist;
    }

    // Reflect ball
    var dot = ball.vx * nx + ball.vy * ny;
    ball.vx -= 2 * dot * nx;
    ball.vy -= 2 * dot * ny;
    var overlap = Math.min(ball.r - dist + 0.5, ball.r);
    ball.x += nx * overlap;
    ball.y += ny * overlap;

    damageBoss(1);
    boss.hitCooldown = 0.25;
  }
}

function damageBoss(amount) {
  boss.hp -= amount;
  Sound.bossHit();
  shakeIntensity = Math.max(shakeIntensity, 8);
  spawnParticles(boss.x, boss.y, boss.color, 15);

  updateBossHud();

  if (boss.hp <= 0) {
    boss.hp = 0;
    boss.defeated = true;
    boss.active = false;
    Sound.bossDefeated();
    hideBossHud();
    Sound.stopDrone();
    shakeIntensity = 20;

    // Big particle explosion
    for (var i = 0; i < 50; i++) {
      spawnParticles(boss.x + randRange(-30, 30), boss.y + randRange(-20, 20), boss.color, 5);
    }

    checkLevelComplete();
  }
}

// ==================== SCREAMER SYSTEM ====================
function triggerScreamer(forcedType) {
  if (!gameState.horrorMode) return;
  if (gameState.current !== STATE_PLAYING) return;

  screamer.active = true;
  screamer.timer = SCREAMER_DURATION;
  screamer.freeze = SCREAMER_FREEZE;
  screamer.type = (typeof forcedType === 'number') ? forcedType : randInt(0, NUM_SCREAMER_TYPES - 1);
  var levelFactor = Math.max(0.55, 1 - (gameState.level - 1) * 0.018);
  var cdMin = SCREAMER_COOLDOWN_MIN * levelFactor;
  var cdMax = SCREAMER_COOLDOWN_MAX * levelFactor;
  if (gameState.secretMode === 'infernal') { cdMin *= 0.6; cdMax *= 0.6; }
  screamer.cooldown = randRange(cdMin, cdMax);

  // Decrease sanity with each screamer
  gameState.sanity = Math.max(0, gameState.sanity - randInt(8, 15));
  if (gameState.sanity <= 30 && gameState.achievements.indexOf('sanityLow') < 0) {
    unlockAchievement('sanityLow');
  }

  // Type-specific sounds and effects
  if (screamer.type === 4) {
    // Fake game over
    Sound.fakeGameOver();
  } else if (screamer.type === 5) {
    // Fake crash - electronic noise
    Sound.screamer();
    horrorEffects.glitch = 1.5;
  } else if (screamer.type === 8) {
    // BSOD sound
    Sound.play(150, 1.0, 'sine', 0.3);
  } else {
    Sound.screamer();
  }

  horrorEffects.flicker = 1.0;
  horrorEffects.glitch = Math.max(horrorEffects.glitch, 0.8);
  shakeIntensity = 35;

  // Trigger screen effects based on type
  if (screamer.type === 6) horrorEffects.colorInvert = 1.0; // Color inversion
  if (screamer.type === 7) horrorEffects.screenWarp = 1.0; // Screen warp
  if (screamer.type === 9) horrorEffects.screenTilt = 1.0; // Screen tilt
  if (screamer.type === 10) horrorEffects.darkness = Math.max(horrorEffects.darkness, 0.85); // Near total darkness
  if (screamer.type === 13) horrorEffects.screenTilt = -1.0; // Visage renverse
  if (screamer.type === 14) horrorEffects.darkness = Math.max(horrorEffects.darkness, 0.4); // Essaim d'yeux
  if (screamer.type === 15) shakeIntensity = 45; // Morsure eclair

  // First screamer achievement
  if (gameState.achievements.indexOf('firstScreamer') < 0) {
    unlockAchievement('firstScreamer');
  }

  // Show screamer overlay
  var overlay = document.getElementById('screamerOverlay');
  if (overlay) {
    overlay.classList.add('active');
  }
}

function updateScreamer(dt) {
  if (screamer.freeze > 0) {
    screamer.freeze -= dt;
    if (screamer.freeze <= 0) {
      screamer.freeze = 0;
    }
  }

  if (screamer.timer > 0) {
    screamer.timer -= dt;
    if (screamer.timer <= 0) {
      screamer.timer = 0;
      screamer.active = false;
      var overlay = document.getElementById('screamerOverlay');
      if (overlay) overlay.classList.remove('active');
    }
  }

  // Cooldown countdown
  if (screamer.cooldown > 0) {
    screamer.cooldown -= dt;
    if (screamer.cooldown <= 0 && gameState.current === STATE_PLAYING && gameState.horrorMode) {
      triggerScreamer();
    }
  }
}

// ==================== LE MONSTRE (immobilité) ====================
function monsterActive() {
  if (gameState.current !== STATE_PLAYING) return false;
  if (!gameState.horrorMode && !gameState.secretMode) return false;
  if (screamer.freeze > 0) return false;
  var flying = false;
  for (var i = 0; i < balls.length; i++) {
    if (!balls[i].stuck) { flying = true; break; }
  }
  return flying;
}

function updateMonster(dt) {
  if (!monsterActive()) {
    monster.anim = Math.max(0, monster.anim - dt * 1.6);
    return;
  }
  var speedMod = gameState.levelMods.idleSpeed * (gameState.secretMode === 'infernal' ? 1.5 : 1);
  monster.idleTime += dt * speedMod;

  if (monster.idleTime >= IDLE_WARN_TIME && !monster.warned) {
    monster.warned = true;
    horrorEffects.whisper = 1.8;
    horrorEffects.whisperText = gameState.secretMode === 'candy' ? "ne t'arrête pas, je t'en prie" : "NE T'ARRÊTE PAS";
    Sound.growl();
  }

  if (monster.idleTime >= IDLE_EAT_TIME) {
    // MORSURE : le Monstre mange la raquette
    monster.idleTime = 0;
    monster.warned = false;
    monster.anim = 0;
    Sound.bite();
    triggerScreamer(11);
    spawnParticles(paddle.x + getEffectivePaddleWidth() / 2, paddle.y, '#ff2244', 40);
    shakeIntensity = 35;
    loseLife();
    return;
  }

  var target = clamp((monster.idleTime - IDLE_WARN_TIME) / Math.max(0.01, IDLE_EAT_TIME - IDLE_WARN_TIME), 0, 1);
  monster.anim = lerp(monster.anim, target, 0.12);
}

function drawMonster(ctx) {
  if (monster.anim <= 0.01) return;
  var p = monster.anim;
  var pw = getEffectivePaddleWidth();
  var cx = paddle.x + pw / 2;
  var cy = paddle.y + paddle.h / 2;
  var candy = gameState.secretMode === 'candy';
  var jawColor = candy ? '#d9538c' : '#2a0808';
  var glow = candy ? '#ff9ec7' : '#ff0000';

  ctx.save();
  ctx.globalAlpha = 0.35 + p * 0.65;
  ctx.shadowBlur = 25;
  ctx.shadowColor = glow;

  // Mâchoire gauche (depuis le bord gauche vers la raquette)
  ctx.fillStyle = jawColor;
  var leftTip = cx - 130 * p;
  ctx.beginPath();
  ctx.moveTo(0, cy - 90 - p * 40);
  ctx.lineTo(0, cy + 90 + p * 40);
  ctx.lineTo(leftTip, cy);
  ctx.closePath();
  ctx.fill();

  // Mâchoire droite
  var rightTip = cx + 130 * p;
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH, cy - 90 - p * 40);
  ctx.lineTo(CANVAS_WIDTH, cy + 90 + p * 40);
  ctx.lineTo(rightTip, cy);
  ctx.closePath();
  ctx.fill();

  // Dents le long des mâchoires
  ctx.shadowBlur = 0;
  ctx.fillStyle = candy ? '#fff0f6' : '#e8e8e8';
  var t, bx, by, by2, rx;
  for (var i = 1; i <= 3; i++) {
    t = i / 4;
    bx = leftTip * t;
    by = cy - (90 + p * 40) * (1 - t);
    by2 = cy + (90 + p * 40) * (1 - t);
    ctx.beginPath();
    ctx.moveTo(bx - 12, by + 4);
    ctx.lineTo(bx + 12, by + 4);
    ctx.lineTo(bx, by + 46);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bx - 12, by2 - 4);
    ctx.lineTo(bx + 12, by2 - 4);
    ctx.lineTo(bx, by2 - 46);
    ctx.closePath();
    ctx.fill();
    rx = CANVAS_WIDTH - (CANVAS_WIDTH - rightTip) * t;
    ctx.beginPath();
    ctx.moveTo(rx + 12, by + 4);
    ctx.lineTo(rx - 12, by + 4);
    ctx.lineTo(rx, by + 46);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(rx + 12, by2 - 4);
    ctx.lineTo(rx - 12, by2 - 4);
    ctx.lineTo(rx, by2 - 46);
    ctx.closePath();
    ctx.fill();
  }

  // Yeux au-dessus de la raquette
  var eyeY = cy - 130;
  ctx.shadowBlur = 20;
  ctx.shadowColor = glow;
  ctx.fillStyle = glow;
  var blink = Math.floor(frameCount / 20) % 7 === 0 ? 0.15 : 1;
  ctx.globalAlpha *= blink;
  ctx.beginPath();
  ctx.ellipse(cx - 50, eyeY, 16, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 50, eyeY, 16, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Avertissement clignotant
  if (monster.warned) {
    ctx.globalAlpha = 0.35 + p * 0.65;
    ctx.shadowBlur = 15;
    ctx.font = '900 30px "Creepster", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = Math.floor(frameCount / 6) % 2 === 0 ? '#ff2244' : '#ffffff';
    ctx.fillText(candy ? 'BOUGE AVEC MOI' : "NE T'ARRÊTE PAS", cx, eyeY - 60);
  }

  ctx.restore();
}

// ==================== HORROR EFFECTS ====================
function updateHorrorEffects(dt) {
  if (!gameState.horrorMode) return;

  // Flicker decay
  if (horrorEffects.flicker > 0) {
    horrorEffects.flicker -= dt * 2;
    if (horrorEffects.flicker < 0) horrorEffects.flicker = 0;
  }

  // Glitch decay
  if (horrorEffects.glitch > 0) {
    horrorEffects.glitch -= dt * 1.5;
    if (horrorEffects.glitch < 0) horrorEffects.glitch = 0;
  }

  // Color invert decay
  if (horrorEffects.colorInvert > 0) {
    horrorEffects.colorInvert -= dt * 2;
    if (horrorEffects.colorInvert < 0) horrorEffects.colorInvert = 0;
  }

  // Screen tilt decay
  if (horrorEffects.screenTilt > 0) {
    horrorEffects.screenTilt -= dt * 1.5;
    if (horrorEffects.screenTilt < 0) horrorEffects.screenTilt = 0;
  }

  // Screen warp decay
  if (horrorEffects.screenWarp > 0) {
    horrorEffects.screenWarp -= dt * 1.5;
    if (horrorEffects.screenWarp < 0) horrorEffects.screenWarp = 0;
  }

  // Whisper timer
  if (horrorEffects.whisper > 0) {
    horrorEffects.whisper -= dt;
    if (horrorEffects.whisper < 0) horrorEffects.whisper = 0;
  }

  // Possessed paddle timer
  if (horrorEffects.possessedPaddle > 0) {
    horrorEffects.possessedPaddle -= dt;
    if (horrorEffects.possessedPaddle < 0) horrorEffects.possessedPaddle = 0;
  }

  // Timers des nouveaux malus
  if (horrorEffects.fogScreen > 0) horrorEffects.fogScreen = Math.max(0, horrorEffects.fogScreen - dt);
  if (horrorEffects.blackout > 0) horrorEffects.blackout = Math.max(0, horrorEffects.blackout - dt);
  if (horrorEffects.drunk > 0) horrorEffects.drunk = Math.max(0, horrorEffects.drunk - dt);

  // Sort d'inversion (malus de cinéatique)
  if (horrorEffects.invertSpell > 0) {
    horrorEffects.invertSpell -= dt;
    if (horrorEffects.invertSpell <= 0) {
      if (!(activePowerUp.active && activePowerUp.type === 'INVERSE')) inverseControls = false;
    }
  } else if (gameState.levelMods.invertChance > 0 && gameState.current === STATE_PLAYING) {
    if (Math.random() < 0.002 * (0.5 + gameState.levelMods.invertChance * 4)) {
      horrorEffects.invertSpell = 2.5;
      inverseControls = true;
      horrorEffects.whisper = 1.6;
      horrorEffects.whisperText = 'il inverse tes mains';
      Sound.whisper();
    }
  }

  // Random flicker (more frequent with low sanity)
  var flickerChance = 0.005 + (1 - gameState.sanity / SANITY_MAX) * 0.01;
  if (gameState.current === STATE_PLAYING && Math.random() < flickerChance) {
    horrorEffects.flicker = Math.max(horrorEffects.flicker, 0.3);
  }

  // Random glitch (more frequent with low sanity)
  var glitchChance = 0.003 + (1 - gameState.sanity / SANITY_MAX) * 0.008;
  if (gameState.current === STATE_PLAYING && Math.random() < glitchChance) {
    horrorEffects.glitch = Math.max(horrorEffects.glitch, 0.2);
  }

  // Random whispers (more frequent with low sanity)
  var whisperChance = 0.002 + (1 - gameState.sanity / SANITY_MAX) * 0.006;
  if (gameState.current === STATE_PLAYING && horrorEffects.whisper <= 0 && Math.random() < whisperChance) {
    horrorEffects.whisper = 2.0;
    var wList = gameState.secretMode === 'candy' ? WHISPER_TEXTS_CANDY : WHISPER_TEXTS;
    horrorEffects.whisperText = wList[randInt(0, wList.length - 1)];
    Sound.whisper();
  }

  // Heartbeat
  if (gameState.current === STATE_PLAYING) {
    horrorEffects.heartbeat += dt;
    if (horrorEffects.heartbeat >= horrorEffects.heartbeatRate) {
      horrorEffects.heartbeat = 0;
      // Faster heartbeat at higher levels or lower sanity
      var sanityFactor = (1 - gameState.sanity / SANITY_MAX) * 0.4;
      horrorEffects.heartbeatRate = Math.max(0.3, 1.2 - gameState.level * 0.05 - sanityFactor);
      Sound.heartbeat();
    }
  }

  // Darkness increases with level, low sanity and cinematic malus
  var sanityDarkness = (1 - gameState.sanity / SANITY_MAX) * 0.15;
  horrorEffects.darkness = Math.min(0.55, gameState.level * 0.02 + sanityDarkness + gameState.levelMods.darkness);

  // Rage mode when 1 life left
  if (gameState.lives <= 1 && !gameState.rageMode && gameState.current === STATE_PLAYING) {
    gameState.rageMode = true;
    Sound.rageMode();
    shakeIntensity = 20;
    horrorEffects.glitch = 1.0;
    unlockAchievement('rageMode');
  }
  if (gameState.lives > 1) {
    gameState.rageMode = false;
  }

  // Update achievement popup
  updateAchievementPopup(dt);
}

function drawScreamer(ctx) {
  if (!screamer.active) return;

  var t = screamer.timer / SCREAMER_DURATION;
  var alpha = Math.min(1, t * 2);

  ctx.save();
  ctx.globalAlpha = alpha;

  if (screamer.type === 0) {
    // Creepy face
    drawCreepyFace(ctx);
  } else if (screamer.type === 1) {
    // Red flash with text
    ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.font = '900 80px "Creepster", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff0000';
    ctx.fillText('DERRIERE TOI', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  } else if (screamer.type === 2) {
    // Glitch face
    drawCreepyFace(ctx);
    // Glitch lines
    for (var i = 0; i < 20; i++) {
      var y = Math.random() * CANVAS_HEIGHT;
      var h = 2 + Math.random() * 10;
      var offset = (Math.random() - 0.5) * 40;
      ctx.fillStyle = ['#ff0000', '#00ff00', '#0000ff'][Math.floor(Math.random() * 3)];
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillRect(offset, y, CANVAS_WIDTH, h);
    }
  } else if (screamer.type === 3) {
    // Skull
    drawSkull(ctx);
  } else if (screamer.type === 4) {
    // Fake game over screen
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.font = '900 72px "Creepster", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff2244';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff0000';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    ctx.font = '400 20px "Rajdhani", sans-serif';
    ctx.fillStyle = '#888899';
    ctx.shadowBlur = 0;
    ctx.fillText('Score : ' + gameState.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    ctx.font = '400 14px "Rajdhani", sans-serif';
    ctx.fillStyle = '#555566';
    ctx.fillText('...tu croyais que c\'était fini ?', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  } else if (screamer.type === 5) {
    // Fake crash / freeze
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.font = '400 14px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ff4444';
    ctx.shadowBlur = 0;
    var crashLines = [
      'ERREUR FATALE: 0x' + Math.floor(Math.random() * 16777215).toString(16).toUpperCase(),
      'Violation d\'accès mémoire à 0x' + Math.floor(Math.random() * 16777215).toString(16).toUpperCase(),
      '',
      'Le programme va être arrêté...',
      'NE PAS ÉTEINDRE',
      '',
      '...non... pas encore...',
      '...il te voit encore...',
    ];
    for (var ci = 0; ci < crashLines.length; ci++) {
      ctx.fillText(crashLines[ci], 30, 60 + ci * 22);
    }
  } else if (screamer.type === 6) {
    // Color inversion - draw inverted creepy face
    ctx.filter = 'invert(1)';
    drawCreepyFace(ctx);
    ctx.filter = 'none';
    // RGB shift
    ctx.globalAlpha = alpha * 0.3;
    ctx.fillStyle = '#ff0000';
    ctx.font = '900 60px "Creepster", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText('INVERSION', CANVAS_WIDTH / 2 - 3, CANVAS_HEIGHT / 2);
    ctx.fillStyle = '#00ffff';
    ctx.fillText('INVERSION', CANVAS_WIDTH / 2 + 3, CANVAS_HEIGHT / 2);
  } else if (screamer.type === 7) {
    // Multi-eye demon face
    drawMultiEyeDemon(ctx);
  } else if (screamer.type === 8) {
    // Fake blue screen of death
    ctx.fillStyle = '#0000aa';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#ffffff';
    ctx.font = '400 16px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.shadowBlur = 0;
    var bsodLines = [
      'Un problème a été détecté et le jeu a été arrêté',
      'pour éviter des dommages à votre ordinateur.',
      '',
      'Si c\'est la première fois que vous voyez cet écran,',
      'relax... ce n\'est pas réel.',
      '',
      'Mais quelque chose te regarde à travers l\'écran.',
      '',
      'Code d\'arrêt : HORROR_SCREAM_' + randInt(1000, 9999),
    ];
    for (var bi = 0; bi < bsodLines.length; bi++) {
      ctx.fillText(bsodLines[bi], 40, 80 + bi * 24);
    }
  } else if (screamer.type === 9) {
    // Screen tilt + creepy face
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.rotate(0.15);
    ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);
    drawCreepyFace(ctx);
    ctx.font = '900 50px "Creepster", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff0000';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff0000';
    ctx.fillText('TILT', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
  } else if (screamer.type === 10) {
    // Near total darkness - just a faint pair of eyes
    ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff0000';
    ctx.fillStyle = '#ff0000';
    var eyeY = CANVAS_HEIGHT / 2;
    // Blinking eyes
    if (Math.floor(screamer.timer * 10) % 3 !== 0) {
      ctx.beginPath();
      ctx.ellipse(CANVAS_WIDTH / 2 - 40, eyeY, 15, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(CANVAS_WIDTH / 2 + 40, eyeY, 15, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.font = '400 18px "Rajdhani", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#444455';
    ctx.fillText('tu m\'entends ?', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  } else if (screamer.type === 11) {
    // MÂCHOIRES géantes qui se referment
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    var jawClose = Math.min(1, (SCREAMER_DURATION - screamer.timer) / (SCREAMER_DURATION * 0.7));
    var jawGap = Math.max(4, 260 * (1 - jawClose));
    drawGiantJaws(ctx, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, jawGap);
    ctx.font = '900 64px "Creepster", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff2244';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff0000';
    ctx.fillText("NE T'ARRÊTE PAS", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 70);
  } else if (screamer.type === 12) {
    // Faux compte a rebours qui deraille
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.font = '900 100px "Creepster", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff2244';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff0000';
    var fakeNum = Math.random() < 0.7 ? randInt(0, 9) : 'X';
    ctx.fillText(String(fakeNum), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    ctx.font = '400 16px "Rajdhani", sans-serif';
    ctx.fillStyle = '#888899';
    ctx.shadowBlur = 0;
    ctx.fillText('le temps ne veut plus rien dire', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  } else if (screamer.type === 13) {
    // Visage renverse
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.rotate(Math.PI);
    ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);
    drawCreepyFace(ctx);
    ctx.rotate(0);
    ctx.font = '900 40px "Creepster", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff0000';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff0000';
    ctx.save();
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.rotate(Math.PI);
    ctx.fillText('IL TE REGARDE D\'EN BAS', 0, CANVAS_HEIGHT / 2 - 90);
    ctx.restore();
  } else if (screamer.type === 14) {
    // Essaim d'yeux qui s'ouvrent partout dans le noir
    ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff0000';
    ctx.fillStyle = '#ff0000';
    var eyeSeed = Math.floor(screamer.timer * 6);
    for (var esi = 0; esi < 22; esi++) {
      var ex = (esi * 137 + eyeSeed * 53) % CANVAS_WIDTH;
      var ey = (esi * 211 + eyeSeed * 71) % CANVAS_HEIGHT;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.font = '900 34px "Creepster", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ILS SONT TOUS LA', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  } else if (screamer.type === 15) {
    // Morsure eclair : machoires geantes tres rapides
    ctx.fillStyle = '#1a0000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    var jawClose2 = Math.min(1, (SCREAMER_DURATION - screamer.timer) / (SCREAMER_DURATION * 0.35));
    var jawGap2 = Math.max(4, 300 * (1 - jawClose2));
    drawGiantJaws(ctx, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, jawGap2);
    ctx.font = '900 70px "Creepster", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff0000';
    ctx.fillText('TROP TARD', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
  }

  ctx.restore();
}

function drawGiantJaws(ctx, cx, cy, gap) {
  ctx.save();
  var candy = gameState.secretMode === 'candy';
  var jawColor = candy ? '#d9538c' : '#3a0d0d';
  var teethColor = candy ? '#fff0f6' : '#e8e8e8';

  ctx.shadowBlur = 30;
  ctx.shadowColor = candy ? '#ff9ec7' : '#ff0000';

  // Mâchoire supérieure
  ctx.fillStyle = jawColor;
  ctx.beginPath();
  ctx.moveTo(cx - 320, cy - gap - 180);
  ctx.lineTo(cx + 320, cy - gap - 180);
  ctx.lineTo(cx + 300, cy - gap);
  ctx.lineTo(cx - 300, cy - gap);
  ctx.closePath();
  ctx.fill();

  // Dents du haut
  ctx.shadowBlur = 0;
  ctx.fillStyle = teethColor;
  for (var i = 0; i < 10; i++) {
    var tx = cx - 285 + i * 63;
    ctx.beginPath();
    ctx.moveTo(tx, cy - gap);
    ctx.lineTo(tx + 55, cy - gap);
    ctx.lineTo(tx + 27, cy - gap + 40);
    ctx.closePath();
    ctx.fill();
  }

  // Mâchoire inférieure
  ctx.fillStyle = jawColor;
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.moveTo(cx - 320, cy + gap + 180);
  ctx.lineTo(cx + 320, cy + gap + 180);
  ctx.lineTo(cx + 300, cy + gap);
  ctx.lineTo(cx - 300, cy + gap);
  ctx.closePath();
  ctx.fill();

  // Dents du bas
  ctx.fillStyle = teethColor;
  ctx.shadowBlur = 0;
  for (var j = 0; j < 10; j++) {
    var tx2 = cx - 285 + j * 63;
    ctx.beginPath();
    ctx.moveTo(tx2, cy + gap);
    ctx.lineTo(tx2 + 55, cy + gap);
    ctx.lineTo(tx2 + 27, cy + gap - 40);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawMultiEyeDemon(ctx) {
  var cx = CANVAS_WIDTH / 2;
  var cy = CANVAS_HEIGHT / 2;

  ctx.save();
  ctx.shadowBlur = 40;
  ctx.shadowColor = '#ff0000';

  // Dark face
  ctx.fillStyle = '#0a0000';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 140, 170, 0, 0, Math.PI * 2);
  ctx.fill();

  // Multiple eyes scattered across face
  var eyes = [
    {x: cx - 50, y: cy - 60, r: 12},
    {x: cx + 50, y: cy - 60, r: 12},
    {x: cx - 70, y: cy - 20, r: 8},
    {x: cx + 70, y: cy - 20, r: 8},
    {x: cx, y: cy - 30, r: 10},
    {x: cx - 30, y: cy + 10, r: 7},
    {x: cx + 30, y: cy + 10, r: 7},
    {x: cx - 80, y: cy + 30, r: 6},
    {x: cx + 80, y: cy + 30, r: 6},
    {x: cx, y: cy + 50, r: 8},
  ];

  for (var i = 0; i < eyes.length; i++) {
    // White of eye
    ctx.fillStyle = '#220000';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(eyes[i].x, eyes[i].y, eyes[i].r + 4, eyes[i].r + 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Glowing pupil
    ctx.fillStyle = '#ff0000';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff0000';
    ctx.beginPath();
    ctx.arc(eyes[i].x, eyes[i].y, eyes[i].r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wide distorted mouth
  ctx.fillStyle = '#000000';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 90, 60, 25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Jagged teeth
  ctx.fillStyle = '#dddddd';
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#ffffff';
  for (var ti = 0; ti < 8; ti++) {
    var tx = cx - 50 + ti * 14;
    ctx.beginPath();
    ctx.moveTo(tx, cy + 75);
    ctx.lineTo(tx + 7, cy + 75);
    ctx.lineTo(tx + 3.5, cy + 95);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawCreepyFace(ctx) {
  var cx = CANVAS_WIDTH / 2;
  var cy = CANVAS_HEIGHT / 2;

  ctx.save();
  ctx.shadowBlur = 40;
  ctx.shadowColor = '#ff0000';

  // Face outline
  ctx.fillStyle = '#1a0000';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 120, 150, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes - glowing red
  ctx.fillStyle = '#ff0000';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.ellipse(cx - 40, cy - 30, 20, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 40, cy - 30, 20, 25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pupils
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(cx - 40, cy - 30, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 40, cy - 30, 5, 0, Math.PI * 2);
  ctx.fill();

  // Mouth - jagged
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 3;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.moveTo(cx - 50, cy + 40);
  for (var i = 0; i <= 10; i++) {
    var x = cx - 50 + i * 10;
    var y = cy + 40 + (i % 2 === 0 ? 0 : 15);
    ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.restore();
}

function drawSkull(ctx) {
  var cx = CANVAS_WIDTH / 2;
  var cy = CANVAS_HEIGHT / 2;

  ctx.save();
  ctx.shadowBlur = 30;
  ctx.shadowColor = '#ffffff';

  // Skull
  ctx.fillStyle = '#dddddd';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 20, 80, 90, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye sockets
  ctx.fillStyle = '#000000';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.ellipse(cx - 30, cy - 30, 18, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 30, cy - 30, 18, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glowing eyes
  ctx.fillStyle = '#ff0000';
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#ff0000';
  ctx.beginPath();
  ctx.arc(cx - 30, cy - 30, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 30, cy - 30, 8, 0, Math.PI * 2);
    ctx.fill();

  // Nose
  ctx.fillStyle = '#000000';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 10);
  ctx.lineTo(cx - 8, cy + 15);
  ctx.lineTo(cx + 8, cy + 15);
  ctx.closePath();
  ctx.fill();

  // Teeth
  ctx.fillStyle = '#dddddd';
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#ffffff';
  for (var i = 0; i < 6; i++) {
    ctx.fillRect(cx - 30 + i * 10, cy + 30, 7, 20);
  }

  ctx.restore();
}

function drawHorrorOverlay(ctx) {
  // Screen tilt effect
  if (horrorEffects.screenTilt > 0) {
    ctx.save();
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.rotate(horrorEffects.screenTilt * 0.15 * (Math.sin(frameCount * 0.1) * 0.5 + 0.5));
    ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);
  }

  // Screen warp effect
  if (horrorEffects.screenWarp > 0) {
    ctx.save();
    var warpOffset = Math.sin(frameCount * 0.2) * horrorEffects.screenWarp * 10;
    ctx.transform(1, 0, horrorEffects.screenWarp * 0.05, 1, warpOffset, 0);
  }

  // Color inversion
  if (horrorEffects.colorInvert > 0) {
    ctx.save();
    ctx.filter = 'invert(' + (horrorEffects.colorInvert) + ')';
  }

  // Darkness
  if (horrorEffects.darkness > 0 && gameState.secretMode !== 'abyss') {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, ' + horrorEffects.darkness + ')';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  }

  // Brume des cinéatiques + malus FOG
  var fogStrength = gameState.levelMods.fog * 0.65 + (horrorEffects.fogScreen > 0 ? 0.75 : 0);
  if (fogStrength > 0) drawFogLayer(ctx, Math.min(0.9, fogStrength));

  // Noir total (malus BLACKOUT) ou éclairage de l'Abysse
  drawDarknessWithLights(ctx);

  // Teinte infernale
  if (gameState.secretMode === 'infernal') {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 60, 0, ' + (0.08 + Math.sin(frameCount * 0.1) * 0.03) + ')';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  }

  // Flicker
  if (horrorEffects.flicker > 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, ' + horrorEffects.flicker * 0.5 + ')';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  }

  // Glitch lines
  if (horrorEffects.glitch > 0) {
    ctx.save();
    var numLines = Math.floor(horrorEffects.glitch * 15);
    for (var i = 0; i < numLines; i++) {
      var y = Math.random() * CANVAS_HEIGHT;
      var h = 1 + Math.random() * 8;
      var offset = (Math.random() - 0.5) * 30;
      var colors = ['rgba(255,0,0,0.3)', 'rgba(0,255,0,0.2)', 'rgba(0,0,255,0.2)'];
      ctx.fillStyle = colors[Math.floor(Math.random() * 3)];
      ctx.fillRect(offset, y, CANVAS_WIDTH, h);
    }
    ctx.restore();
  }

  // Whisper text
  if (horrorEffects.whisper > 0) {
    ctx.save();
    var wAlpha = Math.min(1, horrorEffects.whisper) * 0.6;
    ctx.globalAlpha = wAlpha;
    ctx.font = '400 28px "Creepster", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#880000';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff0000';
    ctx.fillText(horrorEffects.whisperText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
    ctx.restore();
  }

  // Rage mode red tint
  if (gameState.rageMode) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 0, 0, ' + (0.1 + Math.sin(frameCount * 0.15) * 0.05) + ')';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  }

  // Sanity bar (only in horror mode)
  if (gameState.horrorMode && gameState.current === STATE_PLAYING && gameState.sanity < SANITY_MAX) {
    ctx.save();
    var barW = 200;
    var barH = 8;
    var barX = CANVAS_WIDTH / 2 - barW / 2;
    var barY = 8;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX - 4, barY - 4, barW + 8, barH + 8);
    ctx.fillStyle = '#330000';
    ctx.fillRect(barX, barY, barW, barH);
    var sanityPct = gameState.sanity / SANITY_MAX;
    var sanityColor = sanityPct > 0.5 ? '#4af0c0' : (sanityPct > 0.25 ? '#ffaa22' : '#ff2244');
    ctx.fillStyle = sanityColor;
    ctx.fillRect(barX, barY, barW * sanityPct, barH);
    ctx.font = '400 10px "Rajdhani", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#888899';
    ctx.fillText('SANTÉ MENTALE', CANVAS_WIDTH / 2, barY + barH + 2);
    ctx.restore();
  }

  // Close color invert
  if (horrorEffects.colorInvert > 0) {
    ctx.restore();
  }

  // Close screen warp
  if (horrorEffects.screenWarp > 0) {
    ctx.restore();
  }

  // Close screen tilt
  if (horrorEffects.screenTilt > 0) {
    ctx.restore();
  }
}

// ==================== BRUME & OBSCURITÉ AVEC LUMIÈRES ====================
var darknessCanvas = null;

function drawDarknessWithLights(ctx) {
  var level = 0;
  if (gameState.secretMode === 'abyss') {
    level = 0.93;
  } else if (horrorEffects.blackout > 0) {
    level = Math.min(0.97, 0.85 + horrorEffects.blackout * 0.1);
  }
  if (level <= 0) return;

  if (!darknessCanvas) {
    darknessCanvas = document.createElement('canvas');
  }
  darknessCanvas.width = CANVAS_WIDTH;
  darknessCanvas.height = CANVAS_HEIGHT;
  var dctx = darknessCanvas.getContext('2d');
  dctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  dctx.fillStyle = 'rgba(0, 0, 0, ' + level + ')';
  dctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Trous de lumière autour des balles et de la raquette
  dctx.globalCompositeOperation = 'destination-out';
  var pw = getEffectivePaddleWidth();
  var lights = [{ x: paddle.x + pw / 2, y: paddle.y + paddle.h / 2, r: 85 }];
  for (var i = 0; i < balls.length; i++) {
    lights.push({ x: balls[i].x, y: balls[i].y, r: 95 });
  }
  for (var j = 0; j < lights.length; j++) {
    var g = dctx.createRadialGradient(lights[j].x, lights[j].y, 4, lights[j].x, lights[j].y, lights[j].r);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = g;
    dctx.beginPath();
    dctx.arc(lights[j].x, lights[j].y, lights[j].r, 0, Math.PI * 2);
    dctx.fill();
  }
  dctx.globalCompositeOperation = 'source-over';

  ctx.drawImage(darknessCanvas, 0, 0);
}

function drawFogLayer(ctx, intensity) {
  ctx.save();
  ctx.globalAlpha = intensity;
  for (var i = 0; i < 5; i++) {
    var fx = (CANVAS_WIDTH * (0.12 + 0.19 * i) + Math.sin(frameCount * 0.006 + i * 2.1) * 70 + CANVAS_WIDTH) % CANVAS_WIDTH;
    var fy = 140 + 80 * ((i * 37) % 4) + Math.cos(frameCount * 0.009 + i) * 25;
    var g = ctx.createRadialGradient(fx, fy, 10, fx, fy, 140);
    g.addColorStop(0, 'rgba(15, 23, 38, 0.95)');
    g.addColorStop(1, 'rgba(15, 23, 38, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(fx, fy, 140, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ==================== CINÉMATIQUES ENTRE NIVEAUX ====================
var CINEMATIC_SCENES = {
  2:  { banner: 'MALUS : RAQUETTE RONGÉE',
        lines: ['Le niveau est tombé.', 'Mais sous le néon, quelque chose remue...', 'LE MONSTRE mord un morceau de ta raquette.', 'Elle est plus petite. Définitivement.'],
        mod: function () { gameState.levelMods.paddleScale *= 0.88; } },
  3:  { banner: 'MALUS : HURLEMENT',
        lines: ['Il hurle si fort que ton crâne vibre.', 'Ta santé mentale s\'effrite.'],
        mod: function () { gameState.sanity = Math.max(0, gameState.sanity - 15); } },
  4:  { banner: 'MALUS : BRUME CRACHÉE',
        lines: ['Il ouvre une gueule sans fond...', 'et crache une brume épaisse sur l\'arène.'],
        mod: function () { gameState.levelMods.fog = Math.min(1, gameState.levelMods.fog + 0.4); } },
  5:  { banner: 'MALUS : BRIQUES MAUDITES',
        lines: ['Il lèche les briques une à une.', 'Celles qu\'il touche durcissent.'],
        mod: function () { gameState.levelMods.curseChance = Math.min(0.5, gameState.levelMods.curseChance + 0.15); } },
  6:  { banner: 'MALUS : BALLE AFFOLÉE',
        lines: ['Il souffle sur la balle.', 'Elle accélère. Elle a peur de lui.'],
        mod: function () { gameState.levelMods.speedScale += 0.06; } },
  7:  { banner: 'MALUS : MAINS INVERSÉES',
        lines: ['Il te fixe. Tes mains tremblent.', 'Parfois, gauche devient droite.'],
        mod: function () { gameState.levelMods.invertChance += 0.12; } },
  8:  { banner: 'MALUS : NÉON SOUFFLÉ',
        lines: ['Il éteint les néons un par un.', 'L\'obscurité grandit.'],
        mod: function () { gameState.levelMods.darkness += 0.08; } },
  9:  { banner: 'MALUS : BONUS EMPOISONNÉS',
        lines: ['Il rit. Un rire de verre brisé.', 'Les bonus brillent... trop. Méfie-toi.'],
        mod: function () { gameState.levelMods.trollBonus += 0.08; } },
  10: { banner: 'MALUS : FAIM CROISSANTE',
        lines: ['Il a goûté ta raquette. Il a aimé.', 'Il attendra moins longtemps, maintenant.'],
        mod: function () { gameState.levelMods.idleSpeed += 0.25; } },
  11: { banner: 'MALUS : RAQUETTE RONGÉE (ENCORE)',
        lines: ['Il revient. Il restait un morceau à goûter.', 'CRAC. Encore plus petit.'],
        mod: function () { gameState.levelMods.paddleScale *= 0.9; } },
  12: { banner: 'MALUS : BRUME + OBSCURITÉ',
        lines: ['Il mélange sa brume à la nuit.', 'Tu ne verras plus grand-chose.'],
        mod: function () { gameState.levelMods.fog = Math.min(1, gameState.levelMods.fog + 0.2); gameState.levelMods.darkness += 0.05; } },
  13: { banner: 'MALUS : MALÉDICTION DOUBLÉE',
        lines: ['Il gratte les murs de ses ongles.', 'Les briques et les bonus se liguent contre toi.'],
        mod: function () { gameState.levelMods.curseChance = Math.min(0.5, gameState.levelMods.curseChance + 0.1); gameState.levelMods.trollBonus += 0.06; } },
  14: { banner: "MALUS : IL N'A PLUS FAIM... IL EST AFFAMÉ",
        lines: ['Il te connaît, maintenant.', 'Il accélère. La balle aussi.'],
        mod: function () { gameState.levelMods.idleSpeed += 0.3; gameState.levelMods.speedScale += 0.04; } },
  15: { banner: 'LE VIDE T\'ATTEND',
        lines: ['Plus de jeux. Plus de rires.', 'Seulement LE VIDE.', 'Tu crois que c\'est fini ?', '...ce n\'est que le début.'],
        mod: function () {} },
  16: { banner: 'MALUS : IL Y EN A D\'AUTRES',
        lines: ['Le Vide n\'était qu\'une porte.', 'D\'autres choses vivaient derrière.', 'Elles te connaissent, maintenant.'],
        mod: function () { gameState.levelMods.speedScale += 0.05; gameState.levelMods.darkness += 0.03; } },
  17: { banner: 'MALUS : RAQUETTE RONGÉE (TOUJOURS)',
        lines: ['Une nouvelle bouche mord ta raquette.', 'Elle rétrécit encore.'],
        mod: function () { gameState.levelMods.paddleScale *= 0.92; } },
  18: { banner: 'MALUS : IL TE SUIT PARTOUT',
        lines: ['LE POSSÉDÉ ne te lâchera plus.', 'Où que tu ailles, il sera là.'],
        mod: function () { gameState.levelMods.invertChance += 0.08; gameState.levelMods.trollBonus += 0.05; } },
  19: { banner: 'MALUS : BRUME ÉPAISSE',
        lines: ['L\'air devient irrespirable.', 'Tu ne vois presque plus rien.'],
        mod: function () { gameState.levelMods.fog = Math.min(1, gameState.levelMods.fog + 0.15); } },
  20: { banner: 'MALUS : LA MOITIÉ DU CAUCHEMAR',
        lines: ['Dix-huit niveaux de plus t\'attendent.', 'Il n\'a même pas encore commencé à s\'amuser.'],
        mod: function () { gameState.sanity = Math.max(0, gameState.sanity - 10); gameState.levelMods.curseChance = Math.min(0.55, gameState.levelMods.curseChance + 0.08); } },
  21: { banner: 'MALUS : LA NUÉE ARRIVE',
        lines: ['Des centaines de petites voix murmurent.', 'Elles rampent sur les briques.'],
        mod: function () { gameState.levelMods.trollBonus += 0.08; gameState.levelMods.idleSpeed += 0.1; } },
  22: { banner: 'MALUS : FAIM SANS FIN',
        lines: ['Il ne s\'arrêtera plus de manger.', 'Bouge, ou deviens son repas.'],
        mod: function () { gameState.levelMods.idleSpeed += 0.3; } },
  23: { banner: 'MALUS : NÉONS ÉTEINTS',
        lines: ['Un par un, les néons meurent.', 'Bientôt, il ne restera que le noir.'],
        mod: function () { gameState.levelMods.darkness += 0.1; } },
  24: { banner: 'MALUS : REFLET INVERSÉ',
        lines: ['LE MIROIR te montre ce que tu n\'es pas.', 'Tes gestes se retournent contre toi.'],
        mod: function () { gameState.levelMods.invertChance += 0.15; } },
  25: { banner: 'MALUS : BRIQUES DE VERRE NOIR',
        lines: ['Tout devient plus dur à briser.', 'Le Vide a durci les murs.'],
        mod: function () { gameState.levelMods.curseChance = Math.min(0.6, gameState.levelMods.curseChance + 0.1); } },
  26: { banner: 'MALUS : LA BALLE HURLE',
        lines: ['Elle va trop vite pour être naturelle.', 'Quelque chose la pousse.'],
        mod: function () { gameState.levelMods.speedScale += 0.08; } },
  27: { banner: 'MALUS : IL DISPARAÎT... ET REVIENT',
        lines: ['LE FANTÔME apprend à se cacher de toi.', 'Frappe vite, ou pas du tout.'],
        mod: function () { gameState.levelMods.fog = Math.min(1, gameState.levelMods.fog + 0.1); gameState.levelMods.trollBonus += 0.05; } },
  28: { banner: 'MALUS : LES MURS SE RESSERRENT',
        lines: ['L\'arène elle-même semble plus petite.', 'Il n\'y a plus beaucoup d\'espace pour respirer.'],
        mod: function () { gameState.levelMods.paddleScale *= 0.93; } },
  29: { banner: 'MALUS : SANTÉ MENTALE EN CHUTE',
        lines: ['Tu ne distingues plus le vrai du faux.', 'Est-ce que ceci est réel ?'],
        mod: function () { gameState.sanity = Math.max(0, gameState.sanity - 18); } },
  30: { banner: 'MALUS : SA COLÈRE GRANDIT',
        lines: ["L'ENRAGÉ sent le sang. Il accélère.", "Plus tu le blesses, plus il devient dangereux."],
        mod: function () { gameState.levelMods.idleSpeed += 0.2; gameState.levelMods.speedScale += 0.05; } },
  31: { banner: 'MALUS : LA FOURNAISE',
        lines: ['Tout brûle, tout explose.', 'Rien n\'est plus stable ici.'],
        mod: function () { gameState.levelMods.curseChance = Math.min(0.6, gameState.levelMods.curseChance + 0.1); } },
  32: { banner: 'MALUS : FRAGMENTS DU VIDE',
        lines: ['Des morceaux de néant flottent autour de toi.', 'Ils avalent la lumière.'],
        mod: function () { gameState.levelMods.darkness += 0.12; gameState.levelMods.fog = Math.min(1, gameState.levelMods.fog + 0.1); } },
  33: { banner: 'MALUS : LE TOURBILLON T\'ATTIRE',
        lines: ['Tout tourne. Tout se brouille.', 'Tu ne sais plus où est le haut.'],
        mod: function () { gameState.levelMods.invertChance += 0.1; gameState.levelMods.speedScale += 0.06; } },
  34: { banner: 'MALUS : PRESQUE PLUS RIEN',
        lines: ['Il ne reste presque plus de toi à mordre.', 'Ta raquette n\'est plus qu\'un souvenir.'],
        mod: function () { gameState.levelMods.paddleScale *= 0.9; } },
  35: { banner: 'MALUS : DERNIER SOUFFLE AVANT LA FIN',
        lines: ['Tout ce qu\'il a pris s\'accumule enfin.', 'Ce qui vient ensuite n\'a pas de nom.'],
        mod: function () { gameState.levelMods.curseChance = Math.min(0.6, gameState.levelMods.curseChance + 0.1); gameState.levelMods.idleSpeed += 0.15; } },
  36: { banner: 'DERNIER NIVEAU : L\'ABOMINATION',
        lines: ['Tout ce que tu as affronté n\'était qu\'un avant-goût.', 'Ceci est ce qui reste quand tout le reste a été dévoré.', 'Ne t\'arrête pas. C\'est la dernière fois que ça compte.'],
        mod: function () {} },
};

var CINEMATIC_DEFAULT = { banner: 'IL APPROCHE', lines: ['Quelque chose bouge dans le noir...'], mod: function () {} };

function cinematicTotalChars(scene) {
  var total = 0;
  for (var i = 0; i < scene.lines.length; i++) total += scene.lines[i].length + 10;
  return total;
}

function startCinematic(nextLevel) {
  var scene = CINEMATIC_SCENES[nextLevel] || CINEMATIC_DEFAULT;
  gameState.current = STATE_CINEMATIC;
  hideBossHud();
  Sound.stopDrone();
  clearScreamer();
  cinematic.active = true;
  cinematic.t = 0;
  cinematic.chars = 0;
  cinematic.finished = false;
  cinematic.scene = scene;
  Sound.cinematicSting();
}

function updateCinematic(dt) {
  cinematic.t += dt;
  var total = cinematicTotalChars(cinematic.scene);
  if (cinematic.chars < total) {
    cinematic.chars += dt * 32;
  } else {
    cinematic.finished = true;
  }
}

function advanceCinematic() {
  if (gameState.current !== STATE_CINEMATIC) return;
  if (!cinematic.finished) {
    cinematic.chars = cinematicTotalChars(cinematic.scene);
    cinematic.finished = true;
    return;
  }
  endCinematic();
}

function endCinematic() {
  cinematic.active = false;
  if (cinematic.scene && cinematic.scene.mod) cinematic.scene.mod();
  nextLevel();
}

function drawCinematic(ctx) {
  var scene = cinematic.scene;
  var candy = gameState.secretMode === 'candy';

  // Fond noir + grain
  ctx.fillStyle = '#020204';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  for (var g = 0; g < 40; g++) {
    ctx.fillRect(Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT, 2, 2);
  }

  // Scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (var s = 0; s < CANVAS_HEIGHT; s += 4) {
    ctx.fillRect(0, s, CANVAS_WIDTH, 1);
  }

  drawCinematicMonster(ctx, candy);

  // Texte tapé lettre par lettre
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  var shown = cinematic.chars;
  var y = 400;
  for (var i = 0; i < scene.lines.length; i++) {
    var line = scene.lines[i];
    if (shown <= 0) break;
    var visible = line.substring(0, Math.floor(Math.min(line.length, shown)));
    shown -= line.length + 10;
    var isTitle = i === scene.lines.length - 1;
    ctx.font = (isTitle ? '700 22px' : '400 20px') + ' "Rajdhani", sans-serif';
    ctx.fillStyle = isTitle ? (candy ? '#ff7ab8' : '#ff4466') : 'rgba(232, 232, 236, 0.85)';
    ctx.shadowBlur = isTitle ? 12 : 0;
    ctx.shadowColor = candy ? '#ff7ab8' : '#ff4466';
    ctx.fillText(visible, CANVAS_WIDTH / 2, y);
    ctx.shadowBlur = 0;
    y += 34;
  }

  if (cinematic.finished) {
    // Bannière du malus
    var pulse = 0.6 + Math.sin(cinematic.t * 4) * 0.4;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.font = '900 24px "Orbitron", sans-serif';
    ctx.fillStyle = candy ? '#ff7ab8' : '#ff2244';
    ctx.shadowBlur = 20;
    ctx.shadowColor = candy ? '#ff7ab8' : '#ff2244';
    ctx.fillText(scene.banner, CANVAS_WIDTH / 2, 545);
    ctx.restore();
    ctx.font = '400 14px "Rajdhani", sans-serif';
    ctx.fillStyle = 'rgba(232,232,236,0.5)';
    ctx.fillText('ESPACE / CLIC POUR CONTINUER', CANVAS_WIDTH / 2, 578);
  }
}

function drawCinematicMonster(ctx, candy) {
  var cx = CANVAS_WIDTH / 2;
  var cy = 165;
  var jawOpen = 18 + Math.abs(Math.sin(cinematic.t * 2.2)) * 26;

  ctx.save();
  // Tête
  ctx.shadowBlur = 40;
  ctx.shadowColor = candy ? '#ff9ec7' : '#ff0000';
  ctx.fillStyle = candy ? '#d9538c' : '#160404';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 110, 95, 0, 0, Math.PI * 2);
  ctx.fill();

  // Yeux
  ctx.shadowBlur = 25;
  ctx.shadowColor = candy ? '#ffffff' : '#ff0000';
  ctx.fillStyle = candy ? '#ffffff' : '#ff0000';
  var blink = Math.floor(cinematic.t * 2) % 5 === 0 ? 0.2 : 1;
  ctx.globalAlpha = blink;
  ctx.beginPath();
  ctx.ellipse(cx - 38, cy - 25, 16, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 38, cy - 25, 16, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pupilles
  ctx.fillStyle = candy ? '#d9538c' : '#ffffff';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(cx - 38, cy - 25, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 38, cy - 25, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Gueule animée
  ctx.shadowBlur = 15;
  ctx.shadowColor = candy ? '#ff7ab8' : '#ff0000';
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 42, 58, jawOpen, 0, 0, Math.PI * 2);
  ctx.fill();
  // Dents
  ctx.shadowBlur = 0;
  ctx.fillStyle = candy ? '#fff0f6' : '#e8e8e8';
  for (var i = 0; i < 7; i++) {
    var tx = cx - 49 + i * 16.5;
    ctx.beginPath();
    ctx.moveTo(tx, cy + 42 - jawOpen + 2);
    ctx.lineTo(tx + 13, cy + 42 - jawOpen + 2);
    ctx.lineTo(tx + 6.5, cy + 42 - jawOpen + 14);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(tx, cy + 42 + jawOpen - 2);
    ctx.lineTo(tx + 13, cy + 42 + jawOpen - 2);
    ctx.lineTo(tx + 6.5, cy + 42 + jawOpen - 14);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// ==================== GAME FLOW ====================
function startGame() {
  Sound.init();
  gameState.current = STATE_PLAYING;
  gameState.score = 0;
  gameState.lives = MAX_LIVES;
  gameState.level = 1;
  gameState.combo = 0;
  gameState.deathsThisRun = 0;
  gameState.malusSeen = {};

  // Les versions secrètes imposent le mode horreur
  if (gameState.secretMode) gameState.horrorMode = true;

  // Malus cumulés par les cinéatiques
  gameState.levelMods = freshLevelMods();
  if (gameState.secretMode === 'infernal') {
    gameState.levelMods.speedScale = 1.3;
    gameState.levelMods.trollBonus = 0.2;
    gameState.levelMods.idleSpeed = 1.5;
  }
  if (gameState.secretMode === 'candy') applyCandyPalette();
  else restorePalette();

  activePowerUp = { type: null, timer: 0, active: false };
  speedMultiplier = 1.0;
  paddleWidthMultiplier = 1.0;
  shakeIntensity = 0;
  ghostBall = false;
  shieldActive = false;
  shieldHits = 0;
  inverseControls = false;
  konamiBuffer = [];
  gameState.sanity = SANITY_MAX;
  gameState.rageMode = false;
  achievementPopup.active = false;
  resetMonsterIdle();
  monster.anim = 0;
  horrorEffects.fogScreen = 0;
  horrorEffects.blackout = 0;
  horrorEffects.drunk = 0;
  horrorEffects.invertSpell = 0;

  paddle.w = PADDLE_WIDTH;
  paddle.x = (CANVAS_WIDTH - paddle.w) / 2;
  paddle.y = CANVAS_HEIGHT - PADDLE_Y_OFFSET;
  paddle.targetX = null;

  bricks = [];
  particles = [];
  powerUps = [];
  laserShots = [];
  bossProjectiles = [];
  ballTrails = [];

  boss.active = false;
  boss.defeated = false;
  screamer.active = false;
  screamer.cooldown = 30;
  screamer.freeze = 0;
  screamer.timer = 0;
  horrorEffects.flicker = 0;
  horrorEffects.glitch = 0;
  horrorEffects.darkness = 0;
  horrorEffects.heartbeat = 0;
  horrorEffects.colorInvert = 0;
  horrorEffects.screenTilt = 0;
  horrorEffects.screenWarp = 0;
  horrorEffects.whisper = 0;
  horrorEffects.possessedPaddle = 0;

  buildLevel(gameState.level);
  resetBalls();
  clearScreamer();

  // Start boss if boss level
  if (isBossLevel(gameState.level)) {
    startBoss(gameState.level);
  }

  hideOverlay();
  updateHUD();
}

function restartGame() {
  Sound.stopDrone();
  startGame();
}

function nextLevel() {
  if (gameState.level >= LEVELS.length) return;
  gameState.level++;
  gameState.combo = 0;

  if (gameState.level >= 10) unlockAchievement('level10');
  if (gameState.level >= 6 && gameState.deathsThisRun === 0) unlockAchievement('noDeath5');

  activePowerUp = { type: null, timer: 0, active: false };
  speedMultiplier = 1.0;
  paddleWidthMultiplier = 1.0;
  ghostBall = false;
  shieldActive = false;
  shieldHits = 0;
  inverseControls = false;
  horrorEffects.possessedPaddle = 0;
  horrorEffects.whisper = 0;
  horrorEffects.colorInvert = 0;
  horrorEffects.screenTilt = 0;
  horrorEffects.screenWarp = 0;
  horrorEffects.fogScreen = 0;
  horrorEffects.blackout = 0;
  horrorEffects.drunk = 0;
  horrorEffects.invertSpell = 0;
  resetMonsterIdle();

  paddle.w = PADDLE_WIDTH;
  paddle.x = (CANVAS_WIDTH - paddle.w) / 2;

  bricks = [];
  particles = [];
  powerUps = [];
  laserShots = [];
  bossProjectiles = [];
  ballTrails = [];

  boss.active = false;
  boss.defeated = false;
  screamer.active = false;
  screamer.freeze = 0;

  buildLevel(gameState.level);
  resetBalls();
  clearScreamer();

  if (isBossLevel(gameState.level)) {
    startBoss(gameState.level);
  } else {
    hideBossHud();
    Sound.stopDrone();
  }

  gameState.current = STATE_PLAYING;
  hideOverlay();
  updateHUD();
}

function loseLife() {
  gameState.lives--;
  gameState.combo = 0;
  gameState.deathsThisRun++;
  resetMonsterIdle();
  horrorEffects.invertSpell = 0;

  activePowerUp = { type: null, timer: 0, active: false };
  speedMultiplier = 1.0;
  paddleWidthMultiplier = 1.0;
  ghostBall = false;
  shieldActive = false;
  shieldHits = 0;
  paddle.w = PADDLE_WIDTH;
  powerUps = [];
  laserShots = [];
  bossProjectiles = [];
  inverseControls = false;

  // First death achievement
  if (gameState.achievements.indexOf('firstDeath') < 0) {
    unlockAchievement('firstDeath');
  }

  Sound.loseLife();

  if (gameState.lives <= 0) {
    gameState.current = STATE_GAME_OVER;
    Sound.stopDrone();
    hideBossHud();
    clearScreamer();
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      saveHighScore();
    }
    Sound.gameOver();
    showOverlay('gameOver');
  } else {
    resetBalls();
  }
  updateHUD();
}

function checkLevelComplete() {
  var remaining = 0;
  for (var i = 0; i < bricks.length; i++) {
    if (!bricks[i].destroyed && bricks[i].type !== 'INDESTRUCTIBLE') {
      remaining++;
      break;
    }
    if (bricks[i].destroyed && bricks[i].regenerating && bricks[i].regenCount < 1 && bricks[i].type !== 'INDESTRUCTIBLE') {
      remaining++;
      break;
    }
  }

  var bossDefeated = !boss.active || boss.defeated;
  if (isBossLevel(gameState.level)) {
    bossDefeated = !boss.active || boss.defeated;
  } else {
    bossDefeated = true;
  }

  if (remaining === 0 && bossDefeated) {
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      saveHighScore();
    }

    if (gameState.level >= LEVELS.length) {
      gameState.current = STATE_VICTORY;
      Sound.stopDrone();
      hideBossHud();
      clearScreamer();
      Sound.levelComplete();
      if (gameState.secretMode === 'infernal') unlockAchievement('infernalWin');
      else if (gameState.secretMode === 'abyss') unlockAchievement('abyssWin');
      else if (gameState.secretMode === 'candy') unlockAchievement('candyWin');
      else if (gameState.horrorMode) unlockAchievement('horrorMaster');
      if (isBossLevel(gameState.level)) unlockAchievement('nightmareSlayer');
      showOverlay('victory');
    } else {
      Sound.levelComplete();
      startCinematic(gameState.level + 1);
    }
  }
}

function pauseGame() {
  gameState.current = STATE_PAUSED;
  clearScreamer();
  showOverlay('pause');
}

function resumeGame() {
  gameState.current = STATE_PLAYING;
  hideOverlay();
}

function clearScreamer() {
  screamer.active = false;
  screamer.timer = 0;
  screamer.freeze = 0;
  var overlay = document.getElementById('screamerOverlay');
  if (overlay) overlay.classList.remove('active');
}

// ==================== ACHIEVEMENT SYSTEM ====================
function unlockAchievement(key) {
  if (gameState.achievements.indexOf(key) >= 0) return;
  var ach = ACHIEVEMENTS[key];
  if (!ach) return;
  gameState.achievements.push(key);
  saveUnlockedAchievements();
  achievementPopup.active = true;
  achievementPopup.timer = 4000;
  achievementPopup.name = ach.name;
  achievementPopup.msg = ach.msg;
  Sound.achievement();

  // La VRAIE FIN : tous les autres succès collectionnés
  if (key !== 'trueEnd') {
    var allKeys = Object.keys(ACHIEVEMENTS);
    var done = true;
    for (var i = 0; i < allKeys.length; i++) {
      if (allKeys[i] === 'trueEnd') continue;
      if (gameState.achievements.indexOf(allKeys[i]) < 0) { done = false; break; }
    }
    if (done && gameState.achievements.indexOf('trueEnd') < 0) {
      setTimeout(function () {
        unlockAchievement('trueEnd');
        if (gameState.current === STATE_VICTORY) showOverlay('victory');
      }, 2500);
    }
  }
}

function updateAchievementPopup(dt) {
  if (achievementPopup.active) {
    achievementPopup.timer -= dt * 1000;
    if (achievementPopup.timer <= 0) {
      achievementPopup.active = false;
    }
  }
}

function drawAchievementPopup(ctx) {
  if (!achievementPopup.active) return;
  var alpha = Math.min(1, achievementPopup.timer / 500);
  if (achievementPopup.timer > 3500) alpha = Math.min(1, (4000 - achievementPopup.timer) / 500);
  ctx.save();
  ctx.globalAlpha = alpha;
  var boxW = 320;
  var boxH = 70;
  var boxX = CANVAS_WIDTH / 2 - boxW / 2;
  var boxY = 55;
  ctx.fillStyle = 'rgba(10, 5, 5, 0.9)';
  ctx.strokeStyle = '#ff4466';
  ctx.lineWidth = 2;
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#ff4466';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeRect(boxX, boxY, boxW, boxH);
  ctx.shadowBlur = 0;
  ctx.font = '700 16px "Rajdhani", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ff4466';
  ctx.fillText(achievementPopup.name, CANVAS_WIDTH / 2, boxY + 22);
  ctx.font = '400 13px "Rajdhani", sans-serif';
  ctx.fillStyle = '#aaaabb';
  ctx.fillText(achievementPopup.msg, CANVAS_WIDTH / 2, boxY + 48);
  ctx.restore();
}

// ==================== HIGH SCORE ====================
function getStorage() {
  try {
    return window['local' + 'Storage'] || null;
  } catch (e) {
    return null;
  }
}

function loadHighScore() {
  try {
    var storage = getStorage();
    if (!storage) return 0;
    var val = storage.getItem('neonBreakerHorrorHighScore');
    return val ? parseInt(val, 10) : 0;
  } catch (e) {
    return 0;
  }
}

function saveHighScore() {
  try {
    var storage = getStorage();
    if (!storage) return;
    storage.setItem('neonBreakerHorrorHighScore', String(gameState.highScore));
  } catch (e) {}
}

function loadUnlockedAchievements() {
  try {
    var storage = getStorage();
    if (!storage) return [];
    var val = storage.getItem('neonBreakerAchievementsV2');
    if (!val) return [];
    var parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveUnlockedAchievements() {
  try {
    var storage = getStorage();
    if (!storage) return;
    storage.setItem('neonBreakerAchievementsV2', JSON.stringify(gameState.achievements));
  } catch (e) {}
}

// ==================== PALETTE BONBON MAUDIT ====================
var ORIGINAL_BRICK_COLORS = null;
var CANDY_COLORS = ['#ff9ec7', '#ffd3e8', '#e07ab0', '#ffb3d1', '#f5a0c8', '#ffc2dd', '#e88fbd', '#ffafd0', '#d98cb8', '#ff9ec7', '#ffd9ea', '#e07ab0'];

function applyCandyPalette() {
  if (!ORIGINAL_BRICK_COLORS) {
    ORIGINAL_BRICK_COLORS = {};
    for (var k in BRICK_TYPES) {
      ORIGINAL_BRICK_COLORS[k] = BRICK_TYPES[k].colors.slice();
    }
  }
  var ci = 0;
  for (var t in BRICK_TYPES) {
    if (t === 'INDESTRUCTIBLE') continue;
    var cols = BRICK_TYPES[t].colors;
    for (var i = 0; i < cols.length; i++) {
      cols[i] = CANDY_COLORS[ci % CANDY_COLORS.length];
      ci++;
    }
  }
}

function restorePalette() {
  if (!ORIGINAL_BRICK_COLORS) return;
  for (var k in ORIGINAL_BRICK_COLORS) {
    BRICK_TYPES[k].colors = ORIGINAL_BRICK_COLORS[k].slice();
  }
}

// ==================== BOSS HUD ====================
function showBossHud(name, hp) {
  var hud = document.getElementById('bossHud');
  var nameEl = document.getElementById('bossName');
  var fill = document.getElementById('bossHpFill');
  if (hud) hud.classList.remove('hidden');
  if (nameEl) nameEl.textContent = name;
  if (fill) fill.style.width = '100%';
}

function updateBossHud() {
  var fill = document.getElementById('bossHpFill');
  if (fill && boss.maxHp > 0) {
    fill.style.width = Math.max(0, (boss.hp / boss.maxHp) * 100) + '%';
  }
}

function hideBossHud() {
  var hud = document.getElementById('bossHud');
  if (hud) hud.classList.add('hidden');
}

// ==================== UPDATE ====================
function update(dt) {
  frameCount++;

  // Screamer freeze - only update particles and horror
  if (screamer.freeze > 0) {
    updateParticles(dt);
    updateHorrorEffects(dt);
    updateScreamer(dt);
    shakeIntensity *= 0.9;
    if (shakeIntensity < 0.1) shakeIntensity = 0;
    return;
  }

  updatePaddle(dt);
  updateMonster(dt);
  updateBalls(dt);
  updateBricks(dt);
  updatePowerUps(dt);
  updateParticles(dt);
  updateActivePowerUp(dt);
  updateLaserShots(dt);

  if (boss.active && !boss.defeated) {
    updateBoss(dt);
    updateBossProjectiles(dt);
  }

  if (gameState.horrorMode) {
    updateHorrorEffects(dt);
    updateScreamer(dt);
  }
  updateAchievementPopup(dt);

  // Decay screen shake
  shakeIntensity *= 0.9;
  if (shakeIntensity < 0.1) shakeIntensity = 0;
}

// ==================== RENDER ====================
function render() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (gameState.current === STATE_CINEMATIC) {
    ctx.save();
    if (shakeIntensity > 0) {
      ctx.translate((Math.random() - 0.5) * shakeIntensity, (Math.random() - 0.5) * shakeIntensity);
    }
    drawCinematic(ctx);
    drawAchievementPopup(ctx);
    ctx.restore();
    return;
  }

  ctx.save();
  if (shakeIntensity > 0) {
    var shakeX = (Math.random() - 0.5) * shakeIntensity;
    var shakeY = (Math.random() - 0.5) * shakeIntensity;
    ctx.translate(shakeX, shakeY);
  }

  drawBackground(ctx);

  if (gameState.current !== STATE_MENU) {
    drawBricks(ctx);
    drawBoss(ctx);
    drawPaddle(ctx);
    drawBallTrails(ctx);
    drawBalls(ctx);
    drawParticles(ctx);
    drawPowerUps(ctx);
    drawLaserShots(ctx);
    drawBossProjectiles(ctx);
    drawCombo(ctx);
    drawPowerUpTimer(ctx);
    drawShield(ctx);
    drawMonster(ctx);
  }

  drawHorrorOverlay(ctx);
  drawScreamer(ctx);
  drawAchievementPopup(ctx);

  ctx.restore();
}

function drawBackground(ctx) {
  var gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  if (gameState.secretMode === 'infernal') {
    gradient.addColorStop(0, '#0a0202');
    gradient.addColorStop(1, '#1a0505');
  } else if (gameState.secretMode === 'candy') {
    gradient.addColorStop(0, '#140a10');
    gradient.addColorStop(1, '#241019');
  } else {
    gradient.addColorStop(0, '#050508');
    gradient.addColorStop(1, '#0a0a14');
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Grid lines
  ctx.strokeStyle = gameState.secretMode === 'infernal' ? 'rgba(255, 80, 0, 0.05)' : 'rgba(255, 68, 102, 0.03)';
  ctx.lineWidth = 1;
  var gridSize = 40;
  ctx.beginPath();
  for (var x = 0; x <= CANVAS_WIDTH; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
  }
  for (var y = 0; y <= CANVAS_HEIGHT; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
  }
  ctx.stroke();
}

function drawBricks(ctx) {
  for (var i = 0; i < bricks.length; i++) {
    var brick = bricks[i];
    if (brick.destroyed) continue;

    var brickType = BRICK_TYPES[brick.type];
    var colors = brickType.colors;
    var colorIdx = Math.min(brick.hitsTaken, colors.length - 1);
    var color = colors[colorIdx];

    // Invisible brick - barely visible
    if (brick.type === 'INVISIBLE' && !brick.visible) {
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = color;
      roundRect(ctx, brick.x, brick.y, brick.w, brick.h, 4);
      ctx.fill();
      ctx.restore();
      continue;
    }

    // Regenerating brick - pulsing
    var alpha = 1.0;
    if (brick.type === 'REGENERATING' && brick.hitsTaken > 0) {
      alpha = 0.5 + Math.sin(frameCount * 0.1) * 0.2;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    roundRect(ctx, brick.x, brick.y, brick.w, brick.h, 4);
    ctx.fill();

    // Top highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(brick.x + 3, brick.y + 3, brick.w - 6, 2);

    // Explosive brick - pulsing glow
    if (brick.type === 'EXPLOSIVE') {
      ctx.shadowBlur = 15 + Math.sin(frameCount * 0.15) * 5;
      ctx.shadowColor = '#ff8800';
      ctx.strokeStyle = '#ff8800';
      ctx.lineWidth = 2;
      roundRect(ctx, brick.x, brick.y, brick.w, brick.h, 4);
      ctx.stroke();
    }

    // Moving brick - motion trail
    if (brick.type === 'MOVING') {
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(204, 102, 255, 0.15)';
      var trailDir = brick.vx > 0 ? -8 : 8;
      ctx.fillRect(brick.x + trailDir, brick.y, brick.w, brick.h);
    }

    // Brique maudite par le Monstre
    if (brick.cursed) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#9933cc';
      ctx.strokeStyle = '#9933cc';
      ctx.lineWidth = 2;
      roundRect(ctx, brick.x, brick.y, brick.w, brick.h, 4);
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawBoss(ctx) {
  if (!boss.active || boss.defeated) return;

  ctx.save();
  if (boss.invulnerable) ctx.globalAlpha = 0.35;

  // Boss body
  ctx.shadowBlur = 25;
  ctx.shadowColor = boss.color;

  // Pulsing effect
  var pulse = 1 + Math.sin(frameCount * 0.05) * 0.05;

  ctx.fillStyle = boss.color;
  ctx.beginPath();
  ctx.ellipse(boss.x, boss.y, (boss.w / 2) * pulse, (boss.h / 2) * pulse, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner core
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.ellipse(boss.x, boss.y, (boss.w / 4) * pulse, (boss.h / 4) * pulse, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#ffffff';
  ctx.beginPath();
  ctx.arc(boss.x - 15, boss.y - 5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(boss.x + 15, boss.y - 5, 5, 0, Math.PI * 2);
  ctx.fill();

  // Hit flash
  if (boss.hitCooldown > 0.15) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(boss.x, boss.y, (boss.w / 2) * pulse, (boss.h / 2) * pulse, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawPaddle(ctx) {
  var pw = getEffectivePaddleWidth();

  ctx.save();
  ctx.shadowBlur = 15;
  var padTop = '#ff4466';
  var padBottom = '#cc3344';
  if (gameState.secretMode === 'candy') {
    padTop = '#ff9ec7';
    padBottom = '#e07ab0';
  } else if (gameState.secretMode === 'infernal') {
    padTop = '#ff6a1a';
    padBottom = '#b83000';
  }
  ctx.shadowColor = padTop;

  var gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.h);
  gradient.addColorStop(0, padTop);
  gradient.addColorStop(1, padBottom);
  ctx.fillStyle = gradient;
  roundRect(ctx, paddle.x, paddle.y, pw, paddle.h, 6);
  ctx.fill();

  // Highlight
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(paddle.x + 4, paddle.y + 2, pw - 8, 2);

  // Laser cannons
  if (activePowerUp.active && activePowerUp.type === 'LASER') {
    ctx.fillStyle = '#ff4466';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ff4466';
    ctx.fillRect(paddle.x + 12, paddle.y - 6, 6, 6);
    ctx.fillRect(paddle.x + pw - 18, paddle.y - 6, 6, 6);
  }

  ctx.restore();
}

function drawBalls(ctx) {
  for (var i = 0; i < balls.length; i++) {
    var ball = balls[i];
    var radius = ball.r;
    if (ball.stuck) {
      radius = ball.r + Math.sin(Date.now() / 200) * 2;
    }

    var ballColor = '#ffffff';
    if (ghostBall) ballColor = '#cc66ff';

    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = ghostBall ? '#cc66ff' : '#ffffff';
    ctx.fillStyle = ballColor;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = ghostBall ? 'rgba(204, 102, 255, 0.5)' : 'rgba(255, 68, 102, 0.5)';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBallTrails(ctx) {
  for (var bi = 0; bi < ballTrails.length; bi++) {
    var trail = ballTrails[bi];
    if (!trail) continue;
    for (var i = 0; i < trail.length; i++) {
      var t = trail[i];
      var alpha = (t.life / 0.3) * 0.4;
      var trailRadius = BALL_RADIUS * ((i + 1) / trail.length) * 0.7;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 8;
      ctx.shadowColor = ghostBall ? '#cc66ff' : '#ff4466';
      ctx.fillStyle = ghostBall ? '#cc66ff' : '#ff4466';
      ctx.beginPath();
      ctx.arc(t.x, t.y, trailRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawParticles(ctx) {
  ctx.save();
  for (var i = 0; i < particles.length; i++) {
    var p = particles[i];
    var alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 5;
    ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;
    var size = p.size * alpha;
    ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawPowerUps(ctx) {
  for (var i = 0; i < powerUps.length; i++) {
    var pu = powerUps[i];
    var config = POWERUP_TYPES[pu.type];

    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = config.color;
    ctx.fillStyle = config.color;
    roundRect(ctx, pu.x - pu.w / 2, pu.y - pu.h / 2, pu.w, pu.h, 6);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 14px "Rajdhani", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.symbol, pu.x, pu.y);
    ctx.restore();
  }
}

function drawLaserShots(ctx) {
  ctx.save();
  for (var i = 0; i < laserShots.length; i++) {
    var shot = laserShots[i];
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff4466';
    ctx.fillStyle = '#ff4466';
    ctx.fillRect(shot.x, shot.y, shot.w, shot.h);
  }
  ctx.restore();
}

function drawBossProjectiles(ctx) {
  ctx.save();
  for (var i = 0; i < bossProjectiles.length; i++) {
    var proj = bossProjectiles[i];
    ctx.shadowBlur = 12;
    ctx.shadowColor = boss.color;
    ctx.fillStyle = boss.color;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCombo(ctx) {
  if (gameState.combo > 1) {
    ctx.save();
    ctx.font = '700 24px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffaa22';
    ctx.fillStyle = '#ffaa22';
    ctx.fillText('COMBO x' + gameState.combo, CANVAS_WIDTH / 2, 50);
    ctx.restore();
  }
}

function drawPowerUpTimer(ctx) {
  if (!activePowerUp.active) return;

  var progress = activePowerUp.timer / POWERUP_DURATION;
  var barWidth = 200;
  var barHeight = 6;
  var barX = (CANVAS_WIDTH - barWidth) / 2;
  var barY = CANVAS_HEIGHT - 25;
  var config = POWERUP_TYPES[activePowerUp.type];

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  ctx.shadowBlur = 10;
  ctx.shadowColor = config.color;
  ctx.fillStyle = config.color;
  ctx.fillRect(barX, barY, barWidth * progress, barHeight);

  ctx.shadowBlur = 0;
  ctx.font = '600 12px "Rajdhani", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = config.color;
  ctx.fillText(config.label, CANVAS_WIDTH / 2, barY - 6);
  ctx.restore();
}

function drawShield(ctx) {
  if (!shieldActive) return;
  ctx.save();
  ctx.globalAlpha = 0.3 + Math.sin(frameCount * 0.1) * 0.1;
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#22ddaa';
  ctx.fillStyle = '#22ddaa';
  ctx.fillRect(0, CANVAS_HEIGHT - 5, CANVAS_WIDTH, 3);
  ctx.restore();
}

// ==================== HUD ====================
function updateHUD() {
  var elScore = document.getElementById('score');
  var elLives = document.getElementById('lives');
  var elLevel = document.getElementById('level');
  var elHigh = document.getElementById('highScore');
  if (elScore) elScore.textContent = gameState.score;
  if (elLives) elLives.textContent = gameState.lives;
  if (elLevel) elLevel.textContent = gameState.level;
  if (elHigh) elHigh.textContent = gameState.highScore;
}

// ==================== OVERLAY SYSTEM ====================
function showOverlay(type) {
  var overlay = document.getElementById('overlay');
  if (!overlay) return;

  var content = '';

  if (type === 'menu') {
    content =
      '<div class="overlay-content">' +
      '<div class="warning-banner">ATTENTION : screamers et effets horrifiques — NE T\'ARRÊTE PAS</div>' +
      '<h1 class="game-title">NEON BREAKER</h1>' +
      '<p class="game-subtitle">HORROR EDITION</p>' +
      '<div id="modeBadge" class="mode-badge">' + secretModeName(gameState.secretMode) + '</div>' +
      '<label class="horror-toggle">' +
      '<input type="checkbox" id="horrorToggle" ' + (gameState.horrorMode ? 'checked' : '') + '>' +
      '<span class="toggle-track"><span class="toggle-thumb"></span></span>' +
      '<span class="toggle-label">Mode Horreur</span>' +
      '</label>' +
      '<p class="monster-rule">⚠ RÈGLE DU MONSTRE : si ta raquette s\'arrête, IL la mange.</p>' +
      '<div class="controls-info">' +
      '<p><span class="key">Souris</span> / <span class="key">Flèches</span> / <span class="key">Q-D</span> : Déplacer la raquette</p>' +
      '<p><span class="key">Espace</span> / <span class="key">Clic</span> : Lancer la balle / Tirer au laser</p>' +
      '<p><span class="key">P</span> / <span class="key">Echap</span> : Pause</p>' +
      '<p><span class="key">M</span> : Couper le son</p>' +
      '</div>' +
      '<div class="secret-code">' +
      '<input type="text" id="secretCodeInput" placeholder="CODE SECRET..." maxlength="12" autocomplete="off">' +
      '<button id="btnCode" class="btn-mini">OK</button>' +
      '</div>' +
      '<div id="codeFeedback" class="code-feedback"></div>' +
      '<button id="btnStart" class="btn-neon">JOUER</button>' +
      '<div class="achv-panel">' +
      '<div class="achv-title">SUCCÈS : ' + gameState.achievements.length + ' / ' + Object.keys(ACHIEVEMENTS).length + '</div>' +
      buildAchievementsList() +
      '</div>' +
      '<div id="hiddenBrick" class="hidden-brick"></div>' +
      '<div id="birdTrigger" class="bird-trigger"></div>' +
      '</div>';
  } else if (type === 'pause') {
    content =
      '<div class="overlay-content">' +
      '<h2 class="overlay-title">PAUSE</h2>' +
      '<button id="btnResume" class="btn-neon">REPRENDRE</button>' +
      '<button id="btnRestart" class="btn-neon btn-secondary">RECOMMENCER</button>' +
      '</div>';
  } else if (type === 'gameOver') {
    var deathMsg = DEATH_MESSAGES[randInt(0, DEATH_MESSAGES.length - 1)];
    content =
      '<div class="overlay-content">' +
      '<h2 class="overlay-title danger">GAME OVER</h2>' +
      '<p class="final-score">Score : ' + gameState.score + '</p>' +
      '<p class="final-score muted">Record : ' + gameState.highScore + '</p>' +
      '<p class="final-score muted" style="font-size: 14px; margin-top: 15px; color: #ff4466;">' + deathMsg + '</p>' +
      '<button id="btnRestart" class="btn-neon">RECOMMENCER</button>' +
      '</div>';
  } else if (type === 'levelComplete') {
    content =
      '<div class="overlay-content">' +
      '<h2 class="overlay-title">NIVEAU ' + gameState.level + ' TERMINÉ</h2>' +
      '<p class="final-score">Score : ' + gameState.score + '</p>' +
      '<button id="btnNext" class="btn-neon">NIVEAU SUIVANT</button>' +
      '</div>';
  } else if (type === 'victory') {
    unlockAchievement('victory');
    var achCount = gameState.achievements.length;
    var achTotal = Object.keys(ACHIEVEMENTS).length;
    var versionLine = gameState.secretMode
      ? '<p class="final-score" style="color: #ffcc44;">' + secretModeName(gameState.secretMode) + ' — TERMINÉ</p>'
      : '';
    var trueEndLine = gameState.achievements.indexOf('trueEnd') >= 0
      ? '<p class="final-score" style="color: #ffcc44; margin-top: 10px;">★ LA VRAIE FIN T\'EST OUVERTE ★</p>'
      : '<p class="final-score muted" style="font-size: 14px;">Succès : ' + achCount + ' / ' + achTotal + ' — collectionne-les tous pour la VRAIE FIN.</p>';
    content =
      '<div class="overlay-content">' +
      '<h2 class="overlay-title victory">VICTOIRE</h2>' +
      versionLine +
      '<p class="final-score">Score final : ' + gameState.score + '</p>' +
      '<p class="final-score muted">Record : ' + gameState.highScore + '</p>' +
      trueEndLine +
      '<button id="btnRestart" class="btn-neon">REJOUER</button>' +
      '</div>';
  }

  overlay.innerHTML = content;
  overlay.classList.add('active');

  // Attach event listeners
  var btnStart = document.getElementById('btnStart');
  if (btnStart) btnStart.addEventListener('click', function() {
    var toggle = document.getElementById('horrorToggle');
    if (toggle) gameState.horrorMode = toggle.checked;
    startGame();
  });

  var btnCode = document.getElementById('btnCode');
  if (btnCode) btnCode.addEventListener('click', trySecretCode);

  var codeInput = document.getElementById('secretCodeInput');
  if (codeInput) {
    codeInput.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Enter') trySecretCode();
    });
  }

  var btnResume = document.getElementById('btnResume');
  if (btnResume) btnResume.addEventListener('click', resumeGame);

  var btnRestart = document.getElementById('btnRestart');
  if (btnRestart) btnRestart.addEventListener('click', restartGame);

  var btnNext = document.getElementById('btnNext');
  if (btnNext) btnNext.addEventListener('click', nextLevel);

  if (window.setupMiniGameTriggers) window.setupMiniGameTriggers();
}

function hideOverlay() {
  var overlay = document.getElementById('overlay');
  if (overlay) overlay.classList.remove('active');
}

// ==================== CODES SECRETS ====================
function secretModeName(mode) {
  if (mode === 'infernal') return 'ENFER : VERSION INFERNALE';
  if (mode === 'abyss') return 'L\'ABYSSE : LE GOUFFRE SANS LUMIÈRE';
  if (mode === 'candy') return 'BONBON MAUDIT : LA DOUCEUR PIÉGÉE';
  return 'MODE CLASSIQUE';
}

function trySecretCode() {
  var input = document.getElementById('secretCodeInput');
  var feedback = document.getElementById('codeFeedback');
  if (!input) return;
  var code = input.value.toUpperCase().replace(/\s+/g, '');

  if (code === 'NORMAL') {
    gameState.secretMode = null;
    if (feedback) {
      feedback.textContent = 'Retour au MODE CLASSIQUE.';
      feedback.className = 'code-feedback ok';
    }
  } else if (SECRET_CODES[code]) {
    gameState.secretMode = SECRET_CODES[code];
    if (feedback) {
      feedback.textContent = '✔ ' + secretModeName(gameState.secretMode) + ' débloqué !';
      feedback.className = 'code-feedback ok';
    }
    Sound.init();
    Sound.secretUnlock();
    unlockAchievement('codeBreaker');
  } else {
    if (feedback) {
      feedback.textContent = 'Code inconnu... Le Monstre ricane.';
      feedback.className = 'code-feedback bad';
    }
  }
  updateModeBadge();
}

function updateModeBadge() {
  var badge = document.getElementById('modeBadge');
  if (badge) badge.textContent = secretModeName(gameState.secretMode);
}

function buildAchievementsList() {
  var html = '<div class="achv-list">';
  var keys = Object.keys(ACHIEVEMENTS);
  for (var i = 0; i < keys.length; i++) {
    var unlocked = gameState.achievements.indexOf(keys[i]) >= 0;
    html += '<div class="achv-item' + (unlocked ? ' unlocked' : '') + '">' +
      (unlocked ? ACHIEVEMENTS[keys[i]].name : '???') + '</div>';
  }
  html += '</div>';
  return html;
}

// ==================== CANVAS SIZING ====================
function resizeCanvas() {
  if (!canvas) return;
  var container = document.getElementById('game-container');
  if (!container) return;

  var containerWidth = container.clientWidth;
  var containerHeight = container.clientHeight;
  var targetRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
  var containerRatio = containerWidth / containerHeight;

  var displayWidth, displayHeight;
  if (containerRatio > targetRatio) {
    displayHeight = containerHeight;
    displayWidth = displayHeight * targetRatio;
  } else {
    displayWidth = containerWidth;
    displayHeight = displayWidth / targetRatio;
  }

  canvas.style.width = displayWidth + 'px';
  canvas.style.height = displayHeight + 'px';

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function getCanvasCoords(clientX, clientY) {
  var rect = canvas.getBoundingClientRect();
  var scaleX = CANVAS_WIDTH / rect.width;
  var scaleY = CANVAS_HEIGHT / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

// ==================== GAME LOOP ====================
var lastTime = 0;
var accumulator = 0;

function gameLoop(timestamp) {
  if (lastTime === 0) lastTime = timestamp;
  var delta = timestamp - lastTime;
  lastTime = timestamp;

  var clampedDelta = Math.min(delta, 100);
  accumulator += clampedDelta;

  while (accumulator >= TICK_RATE) {
    if (gameState.current === STATE_PLAYING) {
      update(TICK_RATE / 1000);
    } else if (gameState.current === STATE_CINEMATIC) {
      updateCinematic(TICK_RATE / 1000);
    }
    accumulator -= TICK_RATE;
  }

  if (typeof MINIGAME === 'undefined' || !MINIGAME.active) {
    render();
  }
  requestAnimationFrame(gameLoop);
}

// ==================== MUTE BUTTON ====================
function setupMuteButton() {
  var muteBtn = document.getElementById('muteBtn');
  if (!muteBtn) return;

  var iconOn =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
    '<path d="M11 5L6 9H2v6h4l5 4V5z"/>' +
    '<path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>' +
    '<path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>' +
    '</svg>';

  var iconOff =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
    '<path d="M11 5L6 9H2v6h4l5 4V5z"/>' +
    '<line x1="23" y1="9" x2="17" y2="15"/>' +
    '<line x1="17" y1="9" x2="23" y2="15"/>' +
    '</svg>';

  muteBtn.innerHTML = iconOn;
  muteBtn.addEventListener('click', function () {
    Sound.muted = !Sound.muted;
    muteBtn.innerHTML = Sound.muted ? iconOff : iconOn;
    if (Sound.muted) {
      Sound.stopDrone();
    } else if (boss.active && !boss.defeated && gameState.horrorMode) {
      Sound.startDrone();
    }
  });
}

// ==================== INITIALIZATION ====================
function init() {
  canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  if (!ctx) return;

  try {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {
    reducedMotion = false;
  }

  gameState.highScore = loadHighScore();
  gameState.achievements = loadUnlockedAchievements();

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  Input.init();

  // Mouse movement - paddle control
  canvas.addEventListener('mousemove', function (e) {
    if (gameState.current !== STATE_PLAYING) return;
    var coords = getCanvasCoords(e.clientX, e.clientY);
    var pw = getEffectivePaddleWidth();
    mouseTargetX = coords.x - pw / 2;
    inputMode = 'mouse';
  });

  // Mouse click - launch ball / fire laser / advance cinematic
  canvas.addEventListener('mousedown', function () {
    Sound.init();
    if (gameState.current === STATE_CINEMATIC) {
      advanceCinematic();
      return;
    }
    if (gameState.current === STATE_PLAYING) {
      launchBalls();
      if (activePowerUp.active && activePowerUp.type === 'LASER') {
        fireLaser();
      }
    }
  });

  // Touch movement
  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    if (gameState.current !== STATE_PLAYING) return;
    if (e.touches.length === 0) return;
    var touch = e.touches[0];
    var coords = getCanvasCoords(touch.clientX, touch.clientY);
    var pw = getEffectivePaddleWidth();
    mouseTargetX = coords.x - pw / 2;
    inputMode = 'mouse';
  }, { passive: false });

  // Touch start
  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    Sound.init();
    if (gameState.current === STATE_CINEMATIC) {
      advanceCinematic();
      return;
    }
    if (e.touches.length > 0) {
      var touch = e.touches[0];
      var coords = getCanvasCoords(touch.clientX, touch.clientY);
      var pw = getEffectivePaddleWidth();
      mouseTargetX = coords.x - pw / 2;
      inputMode = 'mouse';
    }
    if (gameState.current === STATE_PLAYING) {
      launchBalls();
      if (activePowerUp.active && activePowerUp.type === 'LASER') {
        fireLaser();
      }
    }
  }, { passive: false });

  // Keyboard
  document.addEventListener('keydown', function (e) {
    var code = e.code;
    var key = (e.key || '').toLowerCase();

    // Konami code detection
    konamiBuffer.push(code);
    if (konamiBuffer.length > KONAMI_CODE.length) konamiBuffer.shift();
    if (konamiBuffer.length === KONAMI_CODE.length) {
      var match = true;
      for (var ki = 0; ki < KONAMI_CODE.length; ki++) {
        if (konamiBuffer[ki] !== KONAMI_CODE[ki]) { match = false; break; }
      }
      if (match) {
        unlockAchievement('konami');
        Sound.konami();
        horrorEffects.glitch = 1.0;
        horrorEffects.flicker = 0.8;
        // Give the player a random power-up as reward
        var konamiTypes = ['EXPAND', 'SHIELD', 'MULTIBALL', 'LASER', 'GHOST'];
        applyPowerUp(konamiTypes[randInt(0, konamiTypes.length - 1)]);
        konamiBuffer = [];
      }
    }

    // Space - launch ball / fire laser / advance cinematic
    if (code === 'Space' || key === ' ' || code === 'Enter' || key === 'enter') {
      e.preventDefault();
      Sound.init();
      if (gameState.current === STATE_CINEMATIC) {
        advanceCinematic();
        return;
      }
      if (gameState.current === STATE_PLAYING) {
        launchBalls();
        if (activePowerUp.active && activePowerUp.type === 'LASER') {
          fireLaser();
        }
      }
      return;
    }

    // P or Escape - pause
    if (code === 'KeyP' || key === 'p' || code === 'Escape' || key === 'escape') {
      if (gameState.current === STATE_PLAYING) {
        pauseGame();
      } else if (gameState.current === STATE_PAUSED) {
        resumeGame();
      }
      return;
    }

    // M - mute (sauf si ce « m » fait partie de la frappe du mot CAUCHEMAR)
    if (code === 'KeyM' || key === 'm') {
      if (Date.now() - (window.__mgCauchemarTyping || 0) < 200) return;
      var muteBtn = document.getElementById('muteBtn');
      if (muteBtn) muteBtn.click();
      return;
    }

    // Arrow keys / Q-D / A-D - keyboard mode
    if (code === 'ArrowLeft' || code === 'ArrowRight' ||
        key === 'a' || key === 'd' || key === 'q') {
      inputMode = 'keyboard';
    }
  });

  // Visibility change
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      lastTime = 0;
    }
  });

  setupMuteButton();

  showOverlay('menu');
  updateHUD();

  requestAnimationFrame(gameLoop);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
