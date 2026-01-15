// 뱀파이어 서바이벌 스타일 게임
// 새로운 시스템 통합 버전

import { GameState } from "./systems/GameState.js";
import { PassiveSystem } from "./systems/PassiveSystem.js";
import { WeaponSystem } from "./systems/WeaponSystem.js";
import { LevelUpSystem } from "./systems/LevelUpSystem.js";
import { EvolutionSystem } from "./systems/EvolutionSystem.js";
import { LevelUpModal } from "./ui/LevelUpModal.js";
import { EvolutionModal } from "./ui/EvolutionModal.js";
import { WeaponSelectModal } from "./ui/WeaponSelectModal.js";
import { WEAPONS_DB, PASSIVES_DB } from "./data/gameData.js";

class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    // Canvas 크기 설정
    this.canvas.width = 1600;
    this.canvas.height = 1000;

    // 게임 상태 관리
    this.state = new GameState();
    this.passiveSystem = new PassiveSystem();
    this.weaponSystem = new WeaponSystem();
    this.levelUpSystem = new LevelUpSystem();
    this.evolutionSystem = new EvolutionSystem();

    // UI 모달
    this.weaponSelectModal = new WeaponSelectModal();
    this.levelUpModal = new LevelUpModal();
    this.evolutionModal = new EvolutionModal();

    // 게임 루프 상태
    this.isRunning = false;
    this.lastFrameTime = 0;
    this.gameStarted = false; // 무기 선택 전까지는 게임 시작 안 함
    this.gameLoopStarted = false; // 게임 루프 시작 여부

    // 플레이어 위치 (게임 월드)
    this.playerPos = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      radius: 15,
      color: "#4ecdc4",
    };

    // 플레이어 이동 속도 (무기 방향 계산용)
    this.playerVelocity = { x: 0, y: 0 };

    // 적 배열
    this.enemies = [];
    this.enemySpawnTimer = 0;
    this.enemySpawnInterval = 60; // 프레임 단위
    this.eliteSpawnTimer = 0;
    this.eliteSpawnInterval = 30 * 60; // 30초 (60fps 기준)

    // 경험치 오브젝트 배열
    this.experienceOrbs = [];

    // Chest 오브젝트 배열
    this.chests = [];

    // 키 입력 상태
    this.keys = {};

    // 이벤트 리스너 설정
    this.setupEventListeners();

    // 모달 콜백 설정
    this.setupModals();

    // 게임 루프 시작 (렌더링을 위해)
    this.lastFrameTime = performance.now();
    this.gameLoopStarted = true;
    requestAnimationFrame((time) => this.gameLoop(time));

    // 초기 무기 선택 화면 표시
    this.showInitialWeaponSelect();
  }

  setupEventListeners() {
    // 키보드 입력 감지
    window.addEventListener("keydown", (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  setupModals() {
    // 초기 무기 선택 모달 콜백
    this.weaponSelectModal.setOnWeaponSelected((weaponId) => {
      // 선택한 무기를 인벤토리에 추가
      this.state.inventory.addWeapon(weaponId);

      // 무기 시스템 업데이트
      this.weaponSystem.updateWeapons(
        this.state.inventory,
        this.state.player,
        this.playerPos
      );

      // 패시브 스탯 재계산
      this.passiveSystem.rebuildPlayerStats(
        this.state.player,
        this.state.inventory
      );

      // 게임 시작
      this.gameStarted = true;
      this.state.run.pausedReason = "NONE"; // 일시정지 해제
      this.start();
    });

    // 레벨업 모달 콜백
    this.levelUpModal.setOnChoiceSelected((index) => {
      const choices = this.state.choice.pendingChoices;
      if (choices && choices[index]) {
        this.levelUpSystem.applyChoice(this.state, choices[index]);

        // 패시브 변경 시 스탯 재계산
        if (
          choices[index].kind === "PASSIVE_ADD" ||
          choices[index].kind === "PASSIVE_LEVEL_UP"
        ) {
          this.passiveSystem.rebuildPlayerStats(
            this.state.player,
            this.state.inventory
          );
        }

        // 무기 시스템 업데이트
        this.weaponSystem.updateWeapons(
          this.state.inventory,
          this.state.player,
          this.playerPos
        );

        // Chest에서 온 경우 Chest 상태 정리
        if (this.state.run.pausedReason === "CHEST") {
          this.state.chest.clear();
        }

        // 선택 완료
        this.state.choice.pendingChoices = null;
        this.state.run.pausedReason = "NONE";
      }
    });

    // 진화 모달 콜백
    this.evolutionModal.setOnEvolutionConfirmed((evolutionInfo) => {
      this.evolutionSystem.triggerEvolution(this.state, evolutionInfo);

      // 무기 시스템 업데이트
      this.weaponSystem.updateWeapons(
        this.state.inventory,
        this.state.player,
        this.playerPos
      );

      // Chest 처리 완료
      this.state.chest.clear();
      this.state.run.pausedReason = "NONE";
    });
  }

  // 경험치 획득
  gainExp(amount) {
    // 경험치 획득 배율 적용
    const actualAmount = amount * this.state.player.expGainMult;
    this.state.player.exp += actualAmount;

    // 레벨업 체크
    while (this.state.player.exp >= this.state.player.expToNext) {
      this.state.player.exp -= this.state.player.expToNext;
      this.state.player.level += 1;
      this.state.player.expToNext = this.state.player.calcNextExp(
        this.state.player.level
      );

      // 레벨업 처리 (한 번에 하나씩)
      this.enterLevelUp();
      break; // UI 대기 후 재진입
    }
  }

  // 레벨업 진입
  enterLevelUp() {
    this.state.run.pausedReason = "LEVEL_UP";
    const choices = this.levelUpSystem.generateLevelUpChoices(this.state);
    this.state.choice.pendingChoices = choices;
    this.state.choice.lastChoices = [...choices];

    // 모달 표시
    this.levelUpModal.show(choices, this.state);
  }

  spawnEnemy() {
    // 화면 밖에서 랜덤 위치에 적 스폰
    const side = Math.floor(Math.random() * 4);
    let x, y;

    switch (side) {
      case 0: // 위
        x = Math.random() * this.canvas.width;
        y = -20;
        break;
      case 1: // 오른쪽
        x = this.canvas.width + 20;
        y = Math.random() * this.canvas.height;
        break;
      case 2: // 아래
        x = Math.random() * this.canvas.width;
        y = this.canvas.height + 20;
        break;
      case 3: // 왼쪽
        x = -20;
        y = Math.random() * this.canvas.height;
        break;
    }

    // 레벨에 따라 적 체력 증가 (기하급수적으로)
    const baseHp = 20;
    const hpMultiplier = 1 + (this.state.player.level - 1) * 0.3; // 레벨당 30% 증가
    const enemyHp = Math.floor(baseHp * hpMultiplier);

    this.enemies.push({
      x: x,
      y: y,
      radius: 10 + Math.random() * 10,
      speed: 0.5 + Math.random() * 0.8,
      hp: enemyHp,
      maxHp: enemyHp,
      color: `hsl(${Math.random() * 60}, 70%, 50%)`,
      lastHitTime: 0,
      isElite: false,
    });
  }

  spawnEliteEnemy() {
    // 화면 밖에서 랜덤 위치에 엘리트 적 스폰
    const side = Math.floor(Math.random() * 4);
    let x, y;

    switch (side) {
      case 0: // 위
        x = Math.random() * this.canvas.width;
        y = -30;
        break;
      case 1: // 오른쪽
        x = this.canvas.width + 30;
        y = Math.random() * this.canvas.height;
        break;
      case 2: // 아래
        x = Math.random() * this.canvas.width;
        y = this.canvas.height + 30;
        break;
      case 3: // 왼쪽
        x = -30;
        y = Math.random() * this.canvas.height;
        break;
    }

    // 엘리트는 레벨에 따라 더 강력하게
    const baseHp = 100;
    const hpMultiplier = 1 + (this.state.player.level - 1) * 0.5; // 레벨당 50% 증가
    const eliteHp = Math.floor(baseHp * hpMultiplier);

    this.enemies.push({
      x: x,
      y: y,
      radius: 20 + Math.random() * 10, // 더 큰 크기
      speed: 0.8 + Math.random() * 0.5, // 더 빠른 속도
      hp: eliteHp,
      maxHp: eliteHp,
      color: `hsl(${300 + Math.random() * 60}, 90%, 40%)`, // 보라색 계열
      lastHitTime: 0,
      isElite: true, // 엘리트 표시
    });
  }

  spawnChest(x, y, source = "ELITE") {
    this.chests.push({
      x: x,
      y: y,
      radius: 15,
      source: source,
      collected: false,
    });
  }

  // 초기 무기 선택 화면 표시
  showInitialWeaponSelect() {
    this.state.run.pausedReason = "MENU";
    this.weaponSelectModal.show();
  }

  update(deltaTime) {
    // 게임이 시작되지 않았거나 일시정지 중이면 업데이트 안 함
    if (!this.gameStarted || this.state.run.isPaused()) {
      return;
    }

    this.state.run.timeMs += deltaTime * 1000;

    // 플레이어 이동
    let moveX = 0;
    let moveY = 0;

    if (this.keys["w"]) moveY -= 1;
    if (this.keys["s"]) moveY += 1;
    if (this.keys["a"]) moveX -= 1;
    if (this.keys["d"]) moveX += 1;

    // 대각선 이동 정규화
    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.707;
      moveY *= 0.707;
    }

    this.playerPos.x += moveX * this.state.player.moveSpeed;
    this.playerPos.y += moveY * this.state.player.moveSpeed;

    // 플레이어 속도 저장 (무기 방향 계산용)
    this.playerVelocity.x = moveX * this.state.player.moveSpeed;
    this.playerVelocity.y = moveY * this.state.player.moveSpeed;

    // 경계 체크
    this.playerPos.x = Math.max(
      this.playerPos.radius,
      Math.min(this.canvas.width - this.playerPos.radius, this.playerPos.x)
    );
    this.playerPos.y = Math.max(
      this.playerPos.radius,
      Math.min(this.canvas.height - this.playerPos.radius, this.playerPos.y)
    );

    // HP 회복 (패시브 효과)
    if (this.state.player.hpRegen > 0) {
      this.state.player.hp = Math.min(
        this.state.player.hpMax,
        this.state.player.hp + this.state.player.hpRegen * deltaTime
      );
    }

    // 적 스폰
    this.enemySpawnTimer++;
    if (this.enemySpawnTimer >= this.enemySpawnInterval) {
      this.spawnEnemy();
      this.enemySpawnTimer = 0;
      this.enemySpawnInterval = Math.max(
        30,
        60 - Math.floor(this.state.run.timeMs / 1000 / 10)
      );
    }

    // 엘리트 적 스폰 (30초마다)
    this.eliteSpawnTimer++;
    if (this.eliteSpawnTimer >= this.eliteSpawnInterval) {
      this.spawnEliteEnemy();
      this.eliteSpawnTimer = 0;
    }

    // 적 업데이트
    this.enemies.forEach((enemy, index) => {
      const dx = this.playerPos.x - enemy.x;
      const dy = this.playerPos.y - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        enemy.x += (dx / distance) * enemy.speed;
        enemy.y += (dy / distance) * enemy.speed;
      }

      // 플레이어와 충돌 체크
      if (distance < this.playerPos.radius + enemy.radius) {
        const damage = Math.max(0.5, 0.5 - this.state.player.damageReduction);
        this.state.player.hp -= damage;
        if (this.state.player.hp <= 0) {
          this.gameOver();
        }
      }
    });

    // 무기 업데이트 및 충돌 체크
    const gameTime = this.state.run.timeMs / 1000;
    this.weaponSystem.updateWeapons(
      this.state.inventory,
      this.state.player,
      this.playerPos
    );
    this.weaponSystem.updateWeaponsInGame(
      gameTime,
      this.playerPos,
      this.playerVelocity,
      this.enemies,
      this.canvas
    );

    // 무기 충돌 체크
    this.weaponSystem.activeWeapons.forEach((weapon) => {
      const hits = this.weaponSystem.checkWeaponCollisions(
        weapon,
        this.playerPos,
        this.playerVelocity,
        this.enemies,
        gameTime,
        this.canvas
      );

      hits.forEach((hit) => {
        const enemy = this.enemies[hit.enemyIndex];
        if (enemy) {
          enemy.hp -= hit.damage;

          if (enemy.hp <= 0) {
            // 경험치 오브젝트 생성 (레벨에 따라 증가)
            const isElite = enemy.isElite || false;
            const baseExp = isElite ? 50 : 10; // 엘리트는 5배 경험치
            const expMultiplier = 1 + (this.state.player.level - 1) * 0.2; // 레벨당 20% 증가
            const baseExpValue = Math.floor(baseExp * expMultiplier);
            const expValue =
              baseExpValue + Math.floor(Math.random() * (baseExpValue * 0.5));

            this.experienceOrbs.push({
              x: enemy.x,
              y: enemy.y,
              value: expValue,
              radius: 5,
              speed: 2,
              collected: false,
            });

            // Chest 드롭 (엘리트 처치 시 더 높은 확률)
            const chestChance = isElite ? 0.3 : 0.01; // 엘리트는 30%, 일반은 1%
            if (Math.random() < chestChance) {
              this.spawnChest(enemy.x, enemy.y, isElite ? "ELITE" : "NORMAL");
            }

            this.enemies.splice(hit.enemyIndex, 1);
          }
        }
      });
    });

    // 경험치 오브젝트 업데이트
    this.experienceOrbs.forEach((orb, index) => {
      if (orb.collected) return;

      const dx = this.playerPos.x - orb.x;
      const dy = this.playerPos.y - orb.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 수집 체크 (플레이어가 직접 접촉해야만 획득)
      if (distance < this.playerPos.radius + orb.radius) {
        this.gainExp(orb.value);
        orb.collected = true;
        this.experienceOrbs.splice(index, 1);
      }
    });

    // Chest 업데이트
    this.chests.forEach((chest, index) => {
      if (chest.collected) return;

      const dx = this.playerPos.x - chest.x;
      const dy = this.playerPos.y - chest.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 수집 체크
      if (distance < this.playerPos.radius + chest.radius) {
        chest.collected = true;
        this.chests.splice(index, 1);

        // Chest 열기
        this.openChest(chest.source);
      }
    });
  }

  // Chest 열기
  openChest(source) {
    this.state.chest.openChest(source);
    this.state.run.pausedReason = "CHEST";

    // 진화 체크
    const evolutionInfo = this.evolutionSystem.processChestEvolution(
      this.state
    );

    if (evolutionInfo) {
      // 진화 발생
      this.evolutionModal.show(evolutionInfo, this.state);
    } else {
      // 일반 보상: 무기/패시브 선택창 표시 (레벨업 없이)
      const choices = this.levelUpSystem.generateLevelUpChoices(this.state);
      this.state.choice.pendingChoices = choices;
      this.state.choice.lastChoices = [...choices];

      // 모달 표시
      this.levelUpModal.show(choices, this.state);
      // 게임은 멈춰있음 (pausedReason = "CHEST" 유지)
    }
  }

  gameOver() {
    this.isRunning = false;
    alert(
      `게임 오버!\n레벨: ${this.state.player.level}\n점수: ${Math.floor(
        this.state.run.timeMs / 100
      )}`
    );
    location.reload();
  }

  render() {
    // 화면 지우기
    this.ctx.fillStyle = "#0a0a1a";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 배경 그리드
    this.ctx.strokeStyle = "#1a1a2a";
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    // 경험치 오브젝트 그리기
    this.experienceOrbs.forEach((orb) => {
      if (orb.collected) return;
      this.ctx.fillStyle = "#ffd700";
      this.ctx.beginPath();
      this.ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = "#ffff00";
      this.ctx.globalAlpha = 0.5;
      this.ctx.beginPath();
      this.ctx.arc(orb.x, orb.y, orb.radius * 0.5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    });

    // Chest 그리기
    this.chests.forEach((chest) => {
      if (chest.collected) return;
      this.ctx.fillStyle = "#8b4513";
      this.ctx.beginPath();
      this.ctx.arc(chest.x, chest.y, chest.radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = "#ffd700";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    });

    // 무기 렌더링
    this.weaponSystem.renderWeapons(this.ctx, this.playerPos);

    // 적 그리기
    this.enemies.forEach((enemy) => {
      const isElite = enemy.isElite || false;

      // 적 그림자
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      this.ctx.beginPath();
      this.ctx.arc(enemy.x, enemy.y + 3, enemy.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // 엘리트 외곽 빛 효과
      if (isElite) {
        this.ctx.strokeStyle = "rgba(255, 0, 255, 0.8)";
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(enemy.x, enemy.y, enemy.radius + 3, 0, Math.PI * 2);
        this.ctx.stroke();

        // 펄스 효과
        const pulse = Math.sin(Date.now() / 200) * 2;
        this.ctx.strokeStyle = `rgba(255, 0, 255, ${0.4 + pulse * 0.2})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(enemy.x, enemy.y, enemy.radius + pulse, 0, Math.PI * 2);
        this.ctx.stroke();
      }

      // 적 본체
      this.ctx.fillStyle = enemy.color;
      this.ctx.beginPath();
      this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // 엘리트 내부 강조
      if (isElite) {
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        this.ctx.beginPath();
        this.ctx.arc(enemy.x, enemy.y, enemy.radius * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // HP 바 (엘리트는 더 두껍게)
      const hpBarHeight = isElite ? 6 : 4;
      const hpBarOffset = isElite ? -12 : -8;
      const hpPercent = enemy.hp / enemy.maxHp;
      this.ctx.fillStyle = isElite ? "#ff00ff" : "#ff0000";
      this.ctx.fillRect(
        enemy.x - enemy.radius,
        enemy.y - enemy.radius + hpBarOffset,
        enemy.radius * 2,
        hpBarHeight
      );
      this.ctx.fillStyle = isElite ? "#ffff00" : "#00ff00";
      this.ctx.fillRect(
        enemy.x - enemy.radius,
        enemy.y - enemy.radius + hpBarOffset,
        enemy.radius * 2 * hpPercent,
        hpBarHeight
      );

      // 엘리트 표시 텍스트
      if (isElite) {
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "bold 12px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("ELITE", enemy.x, enemy.y - enemy.radius - 18);
      }
    });

    // 플레이어 그리기
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    this.ctx.beginPath();
    this.ctx.arc(
      this.playerPos.x,
      this.playerPos.y + 3,
      this.playerPos.radius,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    this.ctx.fillStyle = this.playerPos.color;
    this.ctx.beginPath();
    this.ctx.arc(
      this.playerPos.x,
      this.playerPos.y,
      this.playerPos.radius,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // 플레이어 HP 바
    const hpPercent = this.state.player.hp / this.state.player.hpMax;
    this.ctx.fillStyle = "#ff0000";
    this.ctx.fillRect(
      this.playerPos.x - this.playerPos.radius,
      this.playerPos.y - this.playerPos.radius - 10,
      this.playerPos.radius * 2,
      4
    );
    this.ctx.fillStyle = "#00ff00";
    this.ctx.fillRect(
      this.playerPos.x - this.playerPos.radius,
      this.playerPos.y - this.playerPos.radius - 10,
      this.playerPos.radius * 2 * hpPercent,
      4
    );

    // UI 업데이트
    document.getElementById("score").textContent = Math.floor(
      this.state.run.timeMs / 100
    );
    document.getElementById("level").textContent = this.state.player.level;
    document.getElementById("exp").textContent = Math.floor(
      this.state.player.exp
    );
    document.getElementById("expMax").textContent = Math.floor(
      this.state.player.expToNext
    );

    // 경험치 바 업데이트
    const expPercent = this.state.player.exp / this.state.player.expToNext;
    const expBar = document.getElementById("expBar");
    if (expBar) {
      expBar.style.width = `${expPercent * 100}%`;
    }

    // 인벤토리 UI 업데이트
    this.updateInventoryUI();
  }

  // 인벤토리 UI 업데이트
  updateInventoryUI() {
    const weaponsList = document.getElementById("weaponsList");
    const passivesList = document.getElementById("passivesList");

    if (!weaponsList || !passivesList) return;

    // 무기 목록
    weaponsList.innerHTML = "";
    this.state.inventory.weapons.forEach((weapon) => {
      const weaponData = WEAPONS_DB[weapon.id];
      if (!weaponData) return;

      const item = document.createElement("div");
      item.className = "inventory-item";
      item.textContent = `${weaponData.name} `;
      const levelSpan = document.createElement("span");
      levelSpan.className = "item-level";
      levelSpan.textContent = `Lv.${weapon.level}`;
      item.appendChild(levelSpan);
      weaponsList.appendChild(item);
    });

    // 패시브 목록
    passivesList.innerHTML = "";
    this.state.inventory.passives.forEach((passive) => {
      const passiveData = PASSIVES_DB[passive.id];
      if (!passiveData) return;

      const item = document.createElement("div");
      item.className = "inventory-item";
      item.textContent = `${passiveData.name} `;
      const levelSpan = document.createElement("span");
      levelSpan.className = "item-level";
      levelSpan.textContent = `Lv.${passive.level}`;
      item.appendChild(levelSpan);
      passivesList.appendChild(item);
    });
  }

  gameLoop(currentTime) {
    // 게임 루프는 항상 실행 (렌더링을 위해)
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // 초 단위
    this.lastFrameTime = currentTime;

    // 업데이트는 게임이 시작되고 일시정지가 아닐 때만
    if (this.isRunning && this.gameStarted) {
      this.update(deltaTime);
    }

    // 렌더링은 항상 실행
    this.render();

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  start() {
    this.isRunning = true;
    // 게임 루프는 이미 생성자에서 시작됨
  }

  stop() {
    this.isRunning = false;
  }
}

// 게임 시작
window.addEventListener("DOMContentLoaded", () => {
  const game = new Game();

  // 전역에서 접근 가능하도록 (디버깅용)
  window.game = game;
});
