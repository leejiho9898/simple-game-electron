// 뱀파이어 서바이벌 스타일 게임
// 탑뷰 생존 게임

class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    // Canvas 크기 설정
    this.canvas.width = 800;
    this.canvas.height = 600;

    // 게임 상태
    this.score = 0;
    this.level = 1;
    this.experience = 0;
    this.experienceToNext = 100;
    this.isRunning = false;
    this.gameTime = 0;

    // 플레이어 객체
    this.player = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      radius: 15,
      speed: 3,
      maxHp: 100,
      hp: 100,
      color: "#4ecdc4",
    };

    // 적 배열
    this.enemies = [];
    this.enemySpawnTimer = 0;
    this.enemySpawnInterval = 60; // 프레임 단위

    // 경험치 오브젝트 배열
    this.experienceOrbs = [];

    // 무기 시스템
    this.weapons = [];
    this.weaponCooldowns = {};

    // 키 입력 상태
    this.keys = {};

    // 카메라 (플레이어 중심)
    this.camera = {
      x: 0,
      y: 0,
    };

    // 이벤트 리스너 설정
    this.setupEventListeners();

    // 초기 무기 추가 (회전하는 칼)
    this.addWeapon("knife", {
      damage: 10,
      cooldown: 30,
      range: 80,
      speed: 0.1,
    });

    // 게임 시작
    this.start();
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

  addWeapon(type, config) {
    if (type === "knife") {
      this.weapons.push({
        type: "knife",
        angle: 0,
        distance: config.range,
        damage: config.damage,
        cooldown: config.cooldown,
        speed: config.speed,
        timer: 0,
      });
      this.weaponCooldowns["knife"] = 0;
    }
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

    this.enemies.push({
      x: x,
      y: y,
      radius: 10 + Math.random() * 10,
      speed: 0.5 + Math.random() * 0.8, // 속도 감소
      hp: 20 + this.level * 5,
      maxHp: 20 + this.level * 5,
      color: `hsl(${Math.random() * 60}, 70%, 50%)`,
      lastHitTime: 0, // 마지막 피격 시간 추적
    });
  }

  update() {
    this.gameTime++;

    // 플레이어 이동
    let moveX = 0;
    let moveY = 0;

    if (this.keys["w"] || this.keys["arrowup"]) moveY -= 1;
    if (this.keys["s"] || this.keys["arrowdown"]) moveY += 1;
    if (this.keys["a"] || this.keys["arrowleft"]) moveX -= 1;
    if (this.keys["d"] || this.keys["arrowright"]) moveX += 1;

    // 대각선 이동 정규화
    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.707;
      moveY *= 0.707;
    }

    this.player.x += moveX * this.player.speed;
    this.player.y += moveY * this.player.speed;

    // 경계 체크
    this.player.x = Math.max(
      this.player.radius,
      Math.min(this.canvas.width - this.player.radius, this.player.x)
    );
    this.player.y = Math.max(
      this.player.radius,
      Math.min(this.canvas.height - this.player.radius, this.player.y)
    );

    // 적 스폰
    this.enemySpawnTimer++;
    if (this.enemySpawnTimer >= this.enemySpawnInterval) {
      this.spawnEnemy();
      this.enemySpawnTimer = 0;
      // 시간이 지날수록 더 자주 스폰
      this.enemySpawnInterval = Math.max(
        30,
        60 - Math.floor(this.gameTime / 600)
      );
    }

    // 적 업데이트 (플레이어를 향해 이동)
    this.enemies.forEach((enemy, index) => {
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        enemy.x += (dx / distance) * enemy.speed;
        enemy.y += (dy / distance) * enemy.speed;
      }

      // 플레이어와 충돌 체크
      if (distance < this.player.radius + enemy.radius) {
        this.player.hp -= 0.5;
        if (this.player.hp <= 0) {
          this.gameOver();
        }
      }
    });

    // 무기 업데이트
    this.weapons.forEach((weapon) => {
      if (weapon.type === "knife") {
        weapon.angle += weapon.speed;

        // 무기 공격 범위 계산
        const weaponX =
          this.player.x + Math.cos(weapon.angle) * weapon.distance;
        const weaponY =
          this.player.y + Math.sin(weapon.angle) * weapon.distance;

        // 적과 충돌 체크
        this.enemies.forEach((enemy, index) => {
          const dx = weaponX - enemy.x;
          const dy = weaponY - enemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // 무기 범위 내에 있고 쿨다운이 지났으면 피격
          if (distance < enemy.radius + 5) {
            // 무기 크기 고려
            const timeSinceLastHit = this.gameTime - enemy.lastHitTime;

            if (timeSinceLastHit >= weapon.cooldown) {
              enemy.hp -= weapon.damage;
              enemy.lastHitTime = this.gameTime;

              if (enemy.hp <= 0) {
                // 경험치 오브젝트 생성
                this.experienceOrbs.push({
                  x: enemy.x,
                  y: enemy.y,
                  value: 10 + Math.floor(Math.random() * 10),
                  radius: 5,
                  speed: 2,
                  collected: false,
                });

                this.score += 10;
                this.enemies.splice(index, 1);
              }
            }
          }
        });
      }
    });

    // 경험치 오브젝트 업데이트 (플레이어에게 끌림)
    this.experienceOrbs.forEach((orb, index) => {
      if (orb.collected) return;

      const dx = this.player.x - orb.x;
      const dy = this.player.y - orb.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 30) {
        // 플레이어에게 끌림
        orb.speed += 0.2;
      }

      if (distance > 0) {
        orb.x += (dx / distance) * orb.speed;
        orb.y += (dy / distance) * orb.speed;
      }

      // 수집 체크
      if (distance < this.player.radius + orb.radius) {
        this.experience += orb.value;
        orb.collected = true;
        this.experienceOrbs.splice(index, 1);

        // 레벨업 체크
        if (this.experience >= this.experienceToNext) {
          this.levelUp();
        }
      }
    });

    // 점수 증가 (생존 시간)
    this.score += 0.1;
  }

  levelUp() {
    this.level++;
    this.experience -= this.experienceToNext;
    this.experienceToNext = Math.floor(this.experienceToNext * 1.5);

    // 플레이어 체력 회복
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);

    // 무기 강화 또는 새 무기 추가
    const weapon = this.weapons[0];
    if (weapon) {
      weapon.damage += 5;
      weapon.range += 5;
    }
  }

  gameOver() {
    this.isRunning = false;
    alert(`게임 오버!\n레벨: ${this.level}\n점수: ${Math.floor(this.score)}`);
    // 게임 재시작
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

      // 빛나는 효과
      this.ctx.fillStyle = "#ffff00";
      this.ctx.globalAlpha = 0.5;
      this.ctx.beginPath();
      this.ctx.arc(orb.x, orb.y, orb.radius * 0.5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    });

    // 무기 그리기
    this.weapons.forEach((weapon) => {
      if (weapon.type === "knife") {
        const weaponX =
          this.player.x + Math.cos(weapon.angle) * weapon.distance;
        const weaponY =
          this.player.y + Math.sin(weapon.angle) * weapon.distance;

        // 칼 그리기
        this.ctx.strokeStyle = "#ffffff";
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x, this.player.y);
        this.ctx.lineTo(weaponX, weaponY);
        this.ctx.stroke();

        // 칼 끝
        this.ctx.fillStyle = "#ff0000";
        this.ctx.beginPath();
        this.ctx.arc(weaponX, weaponY, 5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    // 적 그리기
    this.enemies.forEach((enemy) => {
      // 적 그림자
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      this.ctx.beginPath();
      this.ctx.arc(enemy.x, enemy.y + 3, enemy.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // 적 본체
      this.ctx.fillStyle = enemy.color;
      this.ctx.beginPath();
      this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // HP 바
      const hpPercent = enemy.hp / enemy.maxHp;
      this.ctx.fillStyle = "#ff0000";
      this.ctx.fillRect(
        enemy.x - enemy.radius,
        enemy.y - enemy.radius - 8,
        enemy.radius * 2,
        3
      );
      this.ctx.fillStyle = "#00ff00";
      this.ctx.fillRect(
        enemy.x - enemy.radius,
        enemy.y - enemy.radius - 8,
        enemy.radius * 2 * hpPercent,
        3
      );
    });

    // 플레이어 그리기
    // 플레이어 그림자
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    this.ctx.beginPath();
    this.ctx.arc(
      this.player.x,
      this.player.y + 3,
      this.player.radius,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // 플레이어 본체
    this.ctx.fillStyle = this.player.color;
    this.ctx.beginPath();
    this.ctx.arc(
      this.player.x,
      this.player.y,
      this.player.radius,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // 플레이어 HP 바
    const hpPercent = this.player.hp / this.player.maxHp;
    this.ctx.fillStyle = "#ff0000";
    this.ctx.fillRect(
      this.player.x - this.player.radius,
      this.player.y - this.player.radius - 10,
      this.player.radius * 2,
      4
    );
    this.ctx.fillStyle = "#00ff00";
    this.ctx.fillRect(
      this.player.x - this.player.radius,
      this.player.y - this.player.radius - 10,
      this.player.radius * 2 * hpPercent,
      4
    );

    // UI 업데이트
    document.getElementById("score").textContent = Math.floor(this.score);
    document.getElementById("level").textContent = this.level;
    document.getElementById("exp").textContent = Math.floor(this.experience);
    document.getElementById("expMax").textContent = Math.floor(
      this.experienceToNext
    );

    // 경험치 바 업데이트
    const expPercent = this.experience / this.experienceToNext;
    const expBar = document.getElementById("expBar");
    if (expBar) {
      expBar.style.width = `${expPercent * 100}%`;
    }
  }

  gameLoop() {
    if (!this.isRunning) return;

    this.update();
    this.render();

    // 다음 프레임 요청
    requestAnimationFrame(() => this.gameLoop());
  }

  start() {
    this.isRunning = true;
    this.gameLoop();
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
