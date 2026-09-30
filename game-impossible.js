// ============================================================
// NEON BREAKER : HORROR — ÉDITION ABOMINATION
// Patch de difficulté extrême.
// À charger APRÈS game.js
// ============================================================

(function () {
  'use strict';

  // 1. SAUVEGARDE DE LA VERSION CLASSIQUE
  var CLASSIC_LEVELS = window.LEVELS.slice();
  var CLASSIC_BOSS_DEFS = window.BOSS_DEFS.map(function (b) {
    return Object.assign({}, b);
  });
  window.__CLASSIC_LEVELS = CLASSIC_LEVELS;
  window.__CLASSIC_BOSS_DEFS = CLASSIC_BOSS_DEFS;

  // 2. DURCISSEMENT DES CONSTANTES
  window.BALL_BASE_SPEED       = 390;
  window.SCREAMER_COOLDOWN_MIN = 15;
  window.SCREAMER_COOLDOWN_MAX = 28;
  window.IDLE_WARN_TIME        = 1.7;
  window.IDLE_EAT_TIME         = 3.2;
  window.POWERUP_DROP_CHANCE   = 0.14;
  window.SCREAMER_FREEZE       = 1.0;

  // 3. NOUVEAUX NIVEAUX (36)
  window.LEVELS = [
    ['0111111110','1222222221','1277777721','1222222221','0133333310'],
    ['0022222200','0266666620','0255555520','0266666620','0227777220','0022222200'],
    ['0000000000','0800000080','0000000000','0000000000'],
    ['8111111118','1222222221','1233333321','1222222221','8111111118'],
    ['0404404404','4044044040','0400400400','4044044040','0404404404'],
    ['0000000000','0800000080','0000000000','0000000000'],
    ['0555555550','5555555555','0555555550','5555555555','0555555550'],
    ['0666666660','6777777776','0766666670','6777777776','0666666660'],
    ['0000000000','0800000080','0000000000','0000000000'],
    ['8888888888','8222222228','8233333328','8234554328','8233333328','8222222228'],
    ['7777777777','7007007007','7777777777','7007007007','7777777777'],
    ['0000000000','0800000080','0000000000','0000000000'],
    ['1234123412','2356235623','1234123412','2356235623','1234123412'],
    ['8222222228','8544444458','8066666608','8544444458','8222222228'],
    ['0000000000','0800000080','0000000000','0000000000'],
    ['4444444444','4444444444','0444444440','4444444444','4444444444'],
    ['8118118118','8228228228','8338338338','8228228228','8118118118'],
    ['0000000000','0800000080','0000000000','0000000000'],
    ['4747474747','7474747474','4747474747','7474747474','4747474747'],
    ['5656565656','6565656565','5757575757','6565656565','5656565656'],
    ['0000000000','0800000080','0000000000','0000000000'],
    ['8118118118','8122222218','8133333318','8122222218','8118118118'],
    ['0666666660','6224422460','6244664460','6224422460','0666666660'],
    ['0000000000','0800000080','0000000000','0000000000'],
    ['8333333338','8355555538','8354445438','8355555538','8333333338'],
    ['4545454545','5454545454','4777774774','5454545454','4545454545'],
    ['0000000000','0800000080','0000000000','0000000000'],
    ['8262626268','8626262628','8262626268','8626262628','8262626268','8626262628'],
    ['1234554321','2345665432','3456776543','2345665432','1234554321'],
    ['0000000000','0800000080','0000000000','0000000000'],
    ['4444444444','4343434343','4444444444','4343434343','4444444444'],
    ['5858585858','8585858585','5858585858','8585858585','5858585858'],
    ['0000000000','0800000080','0000000000','0000000000'],
    ['8338338338','8558558558','8338338338','8558558558','8338338338'],
    ['8888888888','8333333338','8344444438','8355555538','8344444438','8333333338'],
    ['0000000000','0800000080','0000000000','0000000000'],
  ];

  // 4. NOUVEAUX BOSS
  window.BOSS_DEFS = [
    { name: 'LE GARDIEN RONGEUR',   hp: 30,  color: '#ff4466', pattern: 'guardian'   },
    { name: 'LE TIREUR FOUDROYANT', hp: 45,  color: '#ff8822', pattern: 'shooter'    },
    { name: "L'INVOCATEUR",         hp: 62,  color: '#cc66ff', pattern: 'splitter'   },
    { name: "L'ŒIL ABSOLU",         hp: 82,  color: '#22ddaa', pattern: 'homing'     },
    { name: 'LE VIDE',              hp: 108, color: '#ff2244', pattern: 'teleporter' },
    { name: 'LE POSSÉDÉ',           hp: 138, color: '#ff66cc', pattern: 'chaser'     },
    { name: 'LA NUÉE',              hp: 172, color: '#aa2299', pattern: 'swarm'      },
    { name: 'LE MIROIR',            hp: 210, color: '#33aaff', pattern: 'mirror'     },
    { name: 'LE FANTÔME',           hp: 252, color: '#99ffee', pattern: 'phantom'    },
    { name: "L'ENRAGÉ",             hp: 300, color: '#ff3300', pattern: 'berserker'  },
    { name: 'LE TOURBILLON',        hp: 360, color: '#ffee33', pattern: 'vortex'     },
    { name: "L'ABOMINATION",        hp: 500, color: '#ff0044', pattern: 'apocalypse' },
  ];

  // 5. NOUVEAU updateBoss
  window.updateBoss = function (dt) {
    if (!boss.active || boss.defeated) return;
    if (boss.hitCooldown > 0) boss.hitCooldown -= dt;
    if (boss.attackTimer  > 0) boss.attackTimer  -= dt;
    if (boss.phaseTimer   > 0) boss.phaseTimer   -= dt;

    var hpFrac = boss.maxHp > 0 ? boss.hp / boss.maxHp : 1;
    var rage = 1 + (1 - hpFrac) * 1.5;

    if (boss.pattern === 'guardian') {
      boss.rotAngle += dt * 2.0;
      boss.x = CANVAS_WIDTH / 2 + Math.cos(boss.rotAngle) * 180;
      boss.y = 120 + Math.sin(boss.rotAngle * 1.3) * 25;
      boss.invulnerable = (Math.sin(frameCount * 0.08) > 0.85);
      if (boss.attackTimer <= 0) {
        boss.attackTimer = 1.4 / rage;
        for (var g1 = 0; g1 < 3; g1++) {
          var ga = boss.rotAngle + g1 * (Math.PI * 2 / 3);
          spawnBossProjectile(boss.x, boss.y, Math.cos(ga) * 260, Math.sin(ga) * 260 + 100);
        }
      }
    } else if (boss.pattern === 'shooter') {
      boss.x += boss.vx * 0.6 * rage * dt;
      if (boss.x < 80) { boss.x = 80; boss.vx = Math.abs(boss.vx); }
      if (boss.x > CANVAS_WIDTH - 80) { boss.x = CANVAS_WIDTH - 80; boss.vx = -Math.abs(boss.vx); }
      if (boss.attackTimer <= 0) {
        boss.attackTimer = 1.2 / rage;
        var shots = 5 + Math.floor((1 - hpFrac) * 4);
        for (var s1 = 0; s1 < shots; s1++) {
          var sa = (s1 - (shots - 1) / 2) * 0.18 + Math.PI / 2;
          spawnBossProjectile(boss.x, boss.y + boss.h / 2, Math.cos(sa) * 260, Math.sin(sa) * 260);
        }
      }
    } else if (boss.pattern === 'splitter') {
      boss.x = CANVAS_WIDTH / 2;
      boss.y = 120;
      if (boss.attackTimer <= 0) {
        boss.attackTimer = 2.4 / rage;
        for (var sp1 = 0; sp1 < 3; sp1++) {
          var sbx = randRange(100, CANVAS_WIDTH - 164);
          var sby = randRange(80, 210);
          bricks.push({
            x: sbx, y: sby, w: BRICK_WIDTH, h: BRICK_HEIGHT,
            type: 'NORMAL', hitsTaken: 0, destroyed: false,
            originalX: sbx, vx: 0,
            regenerating: false, regenTimer: 0, regenCount: 0, visible: true,
          });
          gameState.totalBricks++;
        }
        boss.rotAngle += 0.6;
        for (var sp2 = 0; sp2 < 6; sp2++) {
          var spa = boss.rotAngle + sp2 * (Math.PI / 3);
          spawnBossProjectile(boss.x, boss.y, Math.cos(spa) * 220, Math.sin(spa) * 220);
        }
      }
    } else if (boss.pattern === 'homing') {
      boss.x = CANVAS_WIDTH / 2 + Math.sin(frameCount * 0.02) * 200;
      boss.y = 100;
      if (boss.attackTimer <= 0) {
        boss.attackTimer = 1.0 / rage;
        var pwh = getEffectivePaddleWidth();
        var dxh = (paddle.x + pwh / 2) - boss.x;
        var dyh = (CANVAS_HEIGHT - 40) - boss.y;
        var lenh = Math.sqrt(dxh * dxh + dyh * dyh) || 1;
        spawnBossProjectile(boss.x, boss.y, (dxh / lenh) * 320, (dyh / lenh) * 320);
        if (hpFrac < 0.5) {
          spawnBossProjectile(boss.x, boss.y, (dxh / lenh) * 320 + 90, (dyh / lenh) * 320 - 40);
        }
      }
    } else if (boss.pattern === 'teleporter') {
      if (boss.phaseTimer <= 0) {
        boss.phaseTimer = 1.8 / rage;
        boss.x = randRange(120, CANVAS_WIDTH - 120);
        boss.y = randRange(100, 180);
        horrorEffects.glitch = Math.max(horrorEffects.glitch, 0.6);
        Sound.play(80, 0.2, 'sawtooth', 0.3);
      }
      if (boss.attackTimer <= 0) {
        boss.attackTimer = 0.8 / rage;
        var cnt = 8 + Math.floor((1 - hpFrac) * 6);
        for (var t1 = 0; t1 < cnt; t1++) {
          var ta = (t1 / cnt) * Math.PI * 2 + boss.rotAngle;
          spawnBossProjectile(boss.x, boss.y, Math.cos(ta) * 240, Math.sin(ta) * 240);
        }
        boss.rotAngle += 0.4;
      }
    } else if (boss.pattern === 'chaser') {
      var pwc = getEffectivePaddleWidth();
      var targetXc = clamp(paddle.x + pwc / 2, 90, CANVAS_WIDTH - 90);
      var maxStep = 480 * rage * dt;
      boss.x += clamp(targetXc - boss.x, -maxStep, maxStep);
      boss.y = 110 + Math.sin(frameCount * 0.06) * 25;
      if (boss.attackTimer <= 0) {
        boss.attackTimer = 1.1 / rage;
        var dxc = (paddle.x + pwc / 2) - boss.x;
        var dyc = (CANVAS_HEIGHT - 40) - boss.y;
        var lenc = Math.sqrt(dxc * dxc + dyc * dyc) || 1;
        spawnBossProjectile(boss.x, boss.y + boss.h / 2, (dxc / lenc) * 360, (dyc / lenc) * 360);
        if (hpFrac < 0.6) {
          spawnBossProjectile(boss.x, boss.y + boss.h / 2, (dxc / lenc) * 360 - 70, (dyc / lenc) * 360);
          spawnBossProjectile(boss.x, boss.y + boss.h / 2, (dxc / lenc) * 360 + 70, (dyc / lenc) * 360);
        }
      }
    } else if (boss.pattern === 'swarm') {
      boss.x += boss.vx * 0.5 * rage * dt;
      if (boss.x < 80) { boss.x = 80; boss.vx = Math.abs(boss.vx); }
      if (boss.x > CANVAS_WIDTH - 80) { boss.x = CANVAS_WIDTH - 80; boss.vx = -Math.abs(boss.vx); }
      if (boss.attackTimer <= 0) {
        boss.attackTimer = 1.6 / rage;
        for (var sw1 = 0; sw1 < 4; sw1++) {
          bricks.push({
            x: randRange(100, CANVAS_WIDTH - 164), y: randRange(80, 210),
            w: BRICK_WIDTH, h: BRICK_HEIGHT,
            type: 'NORMAL', hitsTaken: 0, destroyed: false,
            originalX: 0, vx: 0,
            regenerating: false, regenTimer: 0, regenCount: 0, visible: true,
          });
          gameState.totalBricks++;
        }
        for (var sw2 = 0; sw2 < 5; sw2++) {
          var swa = (sw2 - 2) * 0.25 + Math.PI / 2;
          spawnBossProjectile(boss.x, boss.y, Math.cos(swa) * 220, Math.sin(swa) * 220);
        }
      }
    } else if (boss.pattern === 'mirror') {
      var pwm = getEffectivePaddleWidth();
      boss.x = clamp(CANVAS_WIDTH - (paddle.x + pwm / 2), 90, CANVAS_WIDTH - 90);
      boss.y = 120;
      if (boss.attackTimer <= 0) {
        boss.attackTimer = 1.0 / rage;
        spawnBossProjectile(boss.x, boss.y + boss.h / 2, 0, 300);
        var dxm = (paddle.x + pwm / 2) - boss.x;
        var dym = (CANVAS_HEIGHT - 40) - boss.y;
        var lenm = Math.sqrt(dxm * dxm + dym * dym) || 1;
        spawnBossProjectile(boss.x, boss.y + boss.h / 2, (dxm / lenm) * 280, (dym / lenm) * 280);
      }
    } else if (boss.pattern === 'phantom') {
      if (boss.phaseTimer <= 0) {
        boss.invulnerable = !boss.invulnerable;
        boss.phaseTimer = boss.invulnerable ? 1.0 : 1.5;
        if (boss.invulnerable) {
          boss.x = randRange(110, CANVAS_WIDTH - 110);
          boss.y = randRange(90, 170);
        }
      }
      if (boss.invulnerable) {
        if (boss.attackTimer <= 0) {
          boss.attackTimer = 0.4 / rage;
          for (var ph1 = 0; ph1 < 6; ph1++) {
            var pha = (ph1 / 6) * Math.PI * 2 + boss.rotAngle;
            spawnBossProjectile(boss.x, boss.y, Math.cos(pha) * 240, Math.sin(pha) * 240);
          }
          boss.rotAngle += 0.5;
        }
      } else {
        boss.x += boss.vx * 0.7 * rage * dt;
        if (boss.x < 90) { boss.x = 90; boss.vx = Math.abs(boss.vx); }
        if (boss.x > CANVAS_WIDTH - 90) { boss.x = CANVAS_WIDTH - 90; boss.vx = -Math.abs(boss.vx); }
      }
    } else if (boss.pattern === 'berserker') {
      boss.x += boss.vx * rage * dt;
      if (boss.x < 80) { boss.x = 80; boss.vx = Math.abs(boss.vx); }
      if (boss.x > CANVAS_WIDTH - 80) { boss.x = CANVAS_WIDTH - 80; boss.vx = -Math.abs(boss.vx); }
      if (boss.attackTimer <= 0) {
        boss.attackTimer = Math.max(0.35, 1.5 / rage);
        var burst = Math.floor(3 + (1 - hpFrac) * 6);
        for (var br1 = 0; br1 < burst; br1++) {
          var ba = (br1 - (burst - 1) / 2) * 0.16 + Math.PI / 2;
          var bs = 260 * (0.8 + rage * 0.3);
          spawnBossProjectile(boss.x, boss.y + boss.h / 2, Math.cos(ba) * bs, Math.sin(ba) * bs);
        }
      }
    } else if (boss.pattern === 'vortex') {
      boss.x = CANVAS_WIDTH / 2 + Math.sin(frameCount * 0.028) * 260;
      boss.y = 110 + Math.cos(frameCount * 0.04) * 40;
      boss.rotAngle += dt * 3.5 * rage;
      if (boss.attackTimer <= 0) {
        boss.attackTimer = 0.28 / rage;
        for (var vr1 = 0; vr1 < 3; vr1++) {
          var va = boss.rotAngle + vr1 * (Math.PI * 2 / 3);
          spawnBossProjectile(boss.x, boss.y + boss.h / 2, Math.cos(va) * 230, Math.sin(va) * 230 + 80);
        }
      }
    } else if (boss.pattern === 'apocalypse') {
      var pwa = getEffectivePaddleWidth();
      var targetXa = clamp(paddle.x + pwa / 2, 90, CANVAS_WIDTH - 90);
      boss.x += clamp(targetXa - boss.x, -180 * rage * dt, 180 * rage * dt);
      if (boss.invulnerable) {
        boss.phaseTimer -= dt;
        if (boss.phaseTimer <= 0) boss.invulnerable = false;
      }
      if (boss.attackTimer <= 0) {
        boss.attackTimer = 0.85 / rage;
        var atk = randInt(0, 5);
        if (atk === 0) {
          for (var ap1 = 0; ap1 < 11; ap1++) {
            var aa = (ap1 - 5) * 0.13 + Math.PI / 2;
            spawnBossProjectile(boss.x, boss.y, Math.cos(aa) * 260, Math.sin(aa) * 260);
          }
        } else if (atk === 1) {
          for (var side = -1; side <= 1; side += 2) {
            var dxa = (paddle.x + pwa / 2 + side * 30) - boss.x;
            var dya = (CANVAS_HEIGHT - 40) - boss.y;
            var lena = Math.sqrt(dxa * dxa + dya * dya) || 1;
            spawnBossProjectile(boss.x, boss.y, (dxa / lena) * 340, (dya / lena) * 340);
          }
        } else if (atk === 2) {
          for (var asw1 = 0; asw1 < 3; asw1++) {
            bricks.push({
              x: randRange(100, CANVAS_WIDTH - 164), y: randRange(80, 210),
              w: BRICK_WIDTH, h: BRICK_HEIGHT,
              type: 'NORMAL', hitsTaken: 0, destroyed: false,
              originalX: 0, vx: 0,
              regenerating: false, regenTimer: 0, regenCount: 0, visible: true,
            });
            gameState.totalBricks++;
          }
        } else if (atk === 3) {
          for (var c1 = 0; c1 < 8; c1++) {
            var ca = boss.rotAngle + (c1 / 8) * Math.PI * 2;
            spawnBossProjectile(boss.x, boss.y, Math.cos(ca) * 240, Math.sin(ca) * 240);
          }
          boss.rotAngle += 0.7;
        } else if (atk === 4) {
          boss.invulnerable = true;
          boss.phaseTimer = 0.4;
          boss.x = randRange(110, CANVAS_WIDTH - 110);
          horrorEffects.glitch = 1.0;
          if (gameState.horrorMode) triggerScreamer();
        } else {
          for (var rf1 = 0; rf1 < 5; rf1++) {
            spawnBossProjectile(boss.x + (rf1 - 2) * 30, boss.y + boss.h / 2, 0, 380);
          }
        }
      }
    }
  };

  // 6. VITESSE PLUS AGRESSIVE
  window.getLevelSpeedMultiplier = function () {
    var lvl = gameState.level;
    var base = 1.15 + Math.min(lvl - 1, 14) * 0.11;
    var extra = Math.max(0, lvl - 15) * 0.05;
    return Math.min(base + extra, 4.0) * gameState.levelMods.speedScale;
  };

  // 7. CODE CLASSIQUE
  window.SECRET_CODES['CLASSIQUE'] = 'classic';
  window.SECRET_CODES['ANCIEN']    = 'classic';

  var _origSecretModeName = window.secretModeName;
  window.secretModeName = function (mode) {
    if (mode === 'classic') return 'VERSION CLASSIQUE (originale)';
    return _origSecretModeName(mode);
  };

  window.__ABOMINATION_LEVELS    = window.LEVELS;
  window.__ABOMINATION_BOSS_DEFS = window.BOSS_DEFS;

  var _origStartGame = window.startGame;
  window.startGame = function () {
    if (gameState.secretMode === 'classic') {
      window.LEVELS    = window.__CLASSIC_LEVELS;
      window.BOSS_DEFS = window.__CLASSIC_BOSS_DEFS;
    } else {
      window.LEVELS    = window.__ABOMINATION_LEVELS;
      window.BOSS_DEFS = window.__ABOMINATION_BOSS_DEFS;
    }
    return _origStartGame.apply(this, arguments);
  };

  console.log('[NEON BREAKER] ÉDITION ABOMINATION chargée. Tape CLASSIQUE dans le menu pour revenir à la version originale.');
})();
