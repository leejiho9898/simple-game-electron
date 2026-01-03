// 무기 실행 시스템
import { WEAPONS_DB, EVOLUTIONS_DB } from "../data/gameData.js";

// 진화 무기를 기본 무기로 매핑하는 헬퍼 함수
function getBaseWeaponId(weaponId) {
  // 진화 무기인 경우 baseWeapon 반환
  const evolution = EVOLUTIONS_DB[weaponId];
  if (evolution) {
    return evolution.baseWeapon;
  }
  return weaponId;
}

export class WeaponSystem {
  constructor() {
    this.activeWeapons = []; // 실제 실행 중인 무기 인스턴스들
    this.projectiles = []; // 모든 투사체
    this.groundEffects = []; // 바닥 장판 효과
    this.lightningStrikes = []; // 낙뢰 효과
  }

  // 무기 추가/업데이트
  updateWeapons(inventoryState, playerState, playerPos) {
    // 인벤토리의 무기와 동기화
    const weaponIds = inventoryState.weapons.map((w) => w.id);

    // 제거된 무기 삭제
    this.activeWeapons = this.activeWeapons.filter((w) =>
      weaponIds.includes(w.weaponId)
    );

    // 새 무기 추가 또는 기존 무기 업데이트
    inventoryState.weapons.forEach((weapon) => {
      let activeWeapon = this.activeWeapons.find(
        (w) => w.weaponId === weapon.id
      );

      if (!activeWeapon) {
        // 새 무기 인스턴스 생성
        activeWeapon = this.createWeaponInstance(
          weapon.id,
          weapon.level,
          playerState
        );
        if (activeWeapon) {
          this.activeWeapons.push(activeWeapon);
        }
      } else {
        // 기존 무기 레벨 업데이트
        this.updateWeaponInstance(activeWeapon, weapon.level, playerState);
      }
    });
  }

  // 무기 인스턴스 생성
  createWeaponInstance(weaponId, level, playerState) {
    // 기본 무기 또는 진화 무기 확인
    let weaponData = WEAPONS_DB[weaponId];
    let isEvolution = false;

    if (!weaponData) {
      // 진화 무기인지 확인
      weaponData = EVOLUTIONS_DB[weaponId];
      isEvolution = true;
    }

    if (!weaponData) return null;

    const levelData = weaponData.levels[level - 1];
    if (!levelData) return null;

    const instance = {
      weaponId: weaponId,
      level: level,
      type: weaponData.tags[0] || "projectile",
      // 무기별 고유 속성
      angle: 0,
      cooldownTimer: 0,
      swingDirection: 1, // Whip용: 1=우, -1=좌
      lastSwingTime: 0, // Whip용
      // 스탯 (플레이어 스탯 적용 후)
      damage: 0,
      cooldown: 0,
      range: 0,
      projectileCount: 0,
      // 기타 속성
      projectiles: [], // 무기별 투사체
      groundEffects: [], // 무기별 장판
    };

    this.applyWeaponStats(instance, levelData, playerState);
    return instance;
  }

  // 무기 인스턴스 업데이트
  updateWeaponInstance(instance, level, playerState) {
    // 기본 무기 또는 진화 무기 확인
    let weaponData = WEAPONS_DB[instance.weaponId];
    let isEvolution = false;

    if (!weaponData) {
      weaponData = EVOLUTIONS_DB[instance.weaponId];
      isEvolution = true;
    }

    if (!weaponData) return;

    // 진화 무기는 stats를 사용, 기본 무기는 levels 사용
    let levelData;
    if (isEvolution) {
      // 진화 무기는 레벨 1 고정, stats 사용
      levelData = weaponData.stats || {};
    } else {
      levelData = weaponData.levels[level - 1];
      if (!levelData) return;
    }

    instance.level = level;
    this.applyWeaponStats(instance, levelData, playerState);
  }

  // 무기 스탯 적용 (플레이어 스탯 반영)
  applyWeaponStats(instance, levelData, playerState) {
    // 기본 스탯
    if (levelData.damage !== undefined) {
      instance.damage = levelData.damage * playerState.mightMult;
    }
    if (levelData.cooldown !== undefined) {
      instance.cooldown = levelData.cooldown * playerState.cooldownMult;
    } else {
      instance.cooldown = 0.1;
    }
    if (levelData.range !== undefined) {
      instance.range = levelData.range * playerState.areaMult;
    } else {
      instance.range = 1.0;
    }
    if (levelData.projectileCount !== undefined) {
      instance.projectileCount =
        levelData.projectileCount + playerState.projectileCountBonus;
    }
    if (levelData.area !== undefined) {
      instance.area = levelData.area * playerState.areaMult;
    }
    if (levelData.duration !== undefined) {
      instance.duration = levelData.duration * playerState.durationMult;
    }
    if (levelData.projectileSpeed !== undefined) {
      instance.projectileSpeed =
        levelData.projectileSpeed * playerState.projectileSpeedMult;
    }
    if (levelData.dps !== undefined) {
      instance.dps = levelData.dps * playerState.mightMult;
    }
    if (levelData.radius !== undefined) {
      instance.radius = levelData.radius * playerState.areaMult;
    }
    if (levelData.boltCount !== undefined) {
      instance.boltCount = levelData.boltCount;
    }
    if (levelData.count !== undefined) {
      instance.count = levelData.count;
    }
  }

  // 무기 업데이트 (게임 루프에서 호출)
  updateWeaponsInGame(gameTime, playerPos, playerVelocity, enemies, canvas) {
    const deltaTime = 1 / 60; // 60fps 가정

    this.activeWeapons.forEach((weapon) => {
      weapon.cooldownTimer += deltaTime;

      // 무기별 업데이트 (진화 무기는 기본 무기 로직 사용)
      const baseWeaponId = getBaseWeaponId(weapon.weaponId);
      switch (baseWeaponId) {
        case "w_whip":
        case "w_bloodyTear":
          this.updateWhip(weapon, playerPos, gameTime);
          break;
        case "w_knife":
        case "w_thousandEdge":
          this.updateKnife(
            weapon,
            playerPos,
            playerVelocity,
            gameTime,
            canvas,
            enemies
          );
          break;
        case "w_homingMissile":
        case "w_advancedMissile":
          this.updateHomingMissile(
            weapon,
            playerPos,
            playerVelocity,
            gameTime,
            canvas,
            enemies
          );
          break;
        case "w_magicWand":
        case "w_holyWand":
          this.updateMagicWand(weapon, playerPos, enemies, gameTime, canvas);
          break;
        case "w_axe":
          this.updateAxe(weapon, playerPos, gameTime, canvas);
          break;
        case "w_garlic":
        case "w_soulEater":
          // 오라는 별도 처리 불필요
          break;
        case "w_santaWater":
        case "w_laBorra":
          this.updateSantaWater(weapon, playerPos, gameTime, canvas, enemies);
          break;
        case "w_kingBible":
        case "w_unchainedSpirits":
          this.updateKingBible(weapon, playerPos, gameTime);
          break;
        case "w_lightningRing":
        case "w_thunderLoop":
          this.updateLightningRing(weapon, gameTime, canvas, enemies);
          break;
        case "w_fireWand":
        case "w_hellfire":
          this.updateFireWand(weapon, playerPos, enemies, gameTime, canvas);
          break;
        case "w_runetracer":
        case "w_noFuture":
          this.updateRunetracer(weapon, playerPos, gameTime, canvas);
          break;
      }
    });

    // 투사체 업데이트
    this.projectiles.forEach((proj, index) => {
      if (proj.update) {
        // 유도 무기는 enemies도 전달
        if (
          (proj.weaponId === "w_homingMissile" ||
            proj.weaponId === "w_advancedMissile") &&
          proj.update.length > 2
        ) {
          proj.update(deltaTime, canvas, enemies);
        } else {
          proj.update(deltaTime, canvas);
        }
        if (proj.shouldRemove) {
          this.projectiles.splice(index, 1);
        }
      }
    });

    // 장판 업데이트
    this.groundEffects.forEach((effect, index) => {
      effect.lifetime -= deltaTime;
      if (effect.lifetime <= 0) {
        this.groundEffects.splice(index, 1);
      }
    });

    // 낙뢰 업데이트
    this.lightningStrikes.forEach((strike, index) => {
      strike.lifetime -= deltaTime;
      if (strike.lifetime <= 0) {
        this.lightningStrikes.splice(index, 1);
      }
    });
  }

  // 1. Whip - 넓은 범위 좌우 번갈아 스윙 (레벨 3 이상: 양옆 동시)
  updateWhip(weapon, playerPos, gameTime) {
    if (weapon.cooldownTimer >= weapon.cooldown) {
      weapon.cooldownTimer = 0;

      // 레벨 3 이상: 양옆 동시 스윙
      if (weapon.level >= 3) {
        weapon.swingDirections = [1, -1]; // 양옆 동시
      } else {
        // 레벨 3 미만: 좌우 번갈아
        weapon.swingDirection *= -1;
        weapon.swingDirections = [weapon.swingDirection];
      }

      weapon.lastSwingTime = gameTime;
      weapon.isSwinging = true;
      weapon.swingDuration = 0.3; // 스윙 지속 시간
      weapon.swingProgress = 0; // 스윙 진행도
    }

    if (weapon.isSwinging) {
      weapon.swingDuration -= 1 / 60;
      weapon.swingProgress += 1 / 60;
      if (weapon.swingDuration <= 0) {
        weapon.isSwinging = false;
        weapon.swingProgress = 0;
      }
    }
  }

  // 2. Knife - 발사 시점의 가장 가까운 적 위치로 직선 발사
  updateKnife(weapon, playerPos, playerVelocity, gameTime, canvas, enemies) {
    if (weapon.cooldownTimer >= weapon.cooldown) {
      weapon.cooldownTimer = 0;

      // 발사 시점의 가장 가까운 적 찾기
      let nearestEnemy = null;
      let nearestDist = Infinity;
      enemies.forEach((enemy) => {
        if (enemy.hp <= 0) return;
        const dx = enemy.x - playerPos.x;
        const dy = enemy.y - playerPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestEnemy = enemy;
        }
      });

      // 투사체 생성
      for (let i = 0; i < weapon.projectileCount; i++) {
        const projId = Math.random().toString(36).substr(2, 9);

        // 초기 방향 설정 (발사 시점의 적 위치로 고정)
        let initialAngle = 0;
        if (nearestEnemy) {
          initialAngle = Math.atan2(
            nearestEnemy.y - playerPos.y,
            nearestEnemy.x - playerPos.x
          );
        } else if (playerVelocity.x !== 0 || playerVelocity.y !== 0) {
          initialAngle = Math.atan2(playerVelocity.y, playerVelocity.x);
        } else {
          initialAngle = Math.random() * Math.PI * 2;
        }

        // 여러 발사체일 경우 약간의 스프레드 추가
        const spread = (i - (weapon.projectileCount - 1) / 2) * 0.1;
        initialAngle += spread;

        this.projectiles.push({
          id: projId,
          x: playerPos.x,
          y: playerPos.y,
          vx: Math.cos(initialAngle) * 400 * (weapon.projectileSpeed || 1.0),
          vy: Math.sin(initialAngle) * 400 * (weapon.projectileSpeed || 1.0),
          damage: weapon.damage,
          radius: 5,
          lifetime: 2.0,
          weaponId: weapon.weaponId,
          update: function (dt, canvas) {
            // 직선 이동만 (유도 없음)
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.lifetime -= dt;
            this.shouldRemove =
              this.lifetime <= 0 ||
              this.x < 0 ||
              this.x > canvas.width ||
              this.y < 0 ||
              this.y > canvas.height;
          },
        });
      }
    }
  }

  // 유도탄 - 가장 가까운 적을 자동 유도하는 투사체
  updateHomingMissile(
    weapon,
    playerPos,
    playerVelocity,
    gameTime,
    canvas,
    enemies
  ) {
    if (weapon.cooldownTimer >= weapon.cooldown) {
      weapon.cooldownTimer = 0;

      // 가장 가까운 적 찾기
      let nearestEnemy = null;
      let nearestDist = Infinity;
      enemies.forEach((enemy) => {
        if (enemy.hp <= 0) return;
        const dx = enemy.x - playerPos.x;
        const dy = enemy.y - playerPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestEnemy = enemy;
        }
      });

      // 투사체 생성
      for (let i = 0; i < weapon.projectileCount; i++) {
        const projId = Math.random().toString(36).substr(2, 9);

        // 초기 방향 설정
        let initialAngle = 0;
        if (nearestEnemy) {
          initialAngle = Math.atan2(
            nearestEnemy.y - playerPos.y,
            nearestEnemy.x - playerPos.x
          );
        } else if (playerVelocity.x !== 0 || playerVelocity.y !== 0) {
          initialAngle = Math.atan2(playerVelocity.y, playerVelocity.x);
        } else {
          initialAngle = Math.random() * Math.PI * 2;
        }

        // 여러 발사체일 경우 약간의 스프레드 추가
        const spread = (i - (weapon.projectileCount - 1) / 2) * 0.1;
        initialAngle += spread;

        const isEvolution = weapon.weaponId === "w_advancedMissile";
        const turnSpeed = isEvolution ? 6.0 : 4.0;

        this.projectiles.push({
          id: projId,
          x: playerPos.x,
          y: playerPos.y,
          vx: Math.cos(initialAngle) * 350 * (weapon.projectileSpeed || 1.0),
          vy: Math.sin(initialAngle) * 350 * (weapon.projectileSpeed || 1.0),
          damage: weapon.damage,
          radius: 5,
          lifetime: 3.0, // 유도 무기라서 수명 증가
          weaponId: weapon.weaponId,
          targetEnemy: nearestEnemy, // 추적할 적
          turnSpeed: turnSpeed, // 회전 속도 (라디안/초)
          speed: 350 * (weapon.projectileSpeed || 1.0), // 기본 속도
          update: function (dt, canvas, enemies) {
            // 타겟 적이 죽었거나 없으면 새로운 적 찾기
            if (!this.targetEnemy || this.targetEnemy.hp <= 0) {
              this.targetEnemy = null;

              // 가장 가까운 적 찾기
              if (enemies && enemies.length > 0) {
                let nearest = null;
                let nearestDist = Infinity;
                enemies.forEach((enemy) => {
                  if (enemy.hp <= 0) return;
                  const dx = enemy.x - this.x;
                  const dy = enemy.y - this.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = enemy;
                  }
                });
                this.targetEnemy = nearest;
              }
            }

            // 속도 벡터 계산
            if (this.targetEnemy && this.targetEnemy.hp > 0) {
              const dx = this.targetEnemy.x - this.x;
              const dy = this.targetEnemy.y - this.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist > 0) {
                const targetAngle = Math.atan2(dy, dx);
                const currentAngle = Math.atan2(this.vy, this.vx);

                // 각도 차이 계산 (-PI ~ PI 범위로 정규화)
                let angleDiff = targetAngle - currentAngle;
                if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                // 회전 속도 제한
                const maxTurn = this.turnSpeed * dt;
                const turnAmount = Math.max(
                  -maxTurn,
                  Math.min(maxTurn, angleDiff)
                );
                const newAngle = currentAngle + turnAmount;

                this.vx = Math.cos(newAngle) * this.speed;
                this.vy = Math.sin(newAngle) * this.speed;
              }
            }

            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.lifetime -= dt;
            this.shouldRemove =
              this.lifetime <= 0 ||
              this.x < 0 ||
              this.x > canvas.width ||
              this.y < 0 ||
              this.y > canvas.height;
          },
        });
      }
    }
  }

  // 3. Magic Wand - 가장 가까운 적 자동 조준
  updateMagicWand(weapon, playerPos, enemies, gameTime, canvas) {
    if (weapon.cooldownTimer >= weapon.cooldown && enemies.length > 0) {
      weapon.cooldownTimer = 0;

      // 가장 가까운 적 찾기
      let nearestEnemy = null;
      let nearestDist = Infinity;
      enemies.forEach((enemy) => {
        const dx = enemy.x - playerPos.x;
        const dy = enemy.y - playerPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestEnemy = enemy;
        }
      });

      if (nearestEnemy) {
        const angle = Math.atan2(
          nearestEnemy.y - playerPos.y,
          nearestEnemy.x - playerPos.x
        );

        for (let i = 0; i < weapon.projectileCount; i++) {
          const spread = (i - (weapon.projectileCount - 1) / 2) * 0.1;
          const projId = Math.random().toString(36).substr(2, 9);
          this.projectiles.push({
            id: projId,
            x: playerPos.x,
            y: playerPos.y,
            vx:
              Math.cos(angle + spread) * 300 * (weapon.projectileSpeed || 1.0),
            vy:
              Math.sin(angle + spread) * 300 * (weapon.projectileSpeed || 1.0),
            damage: weapon.damage,
            radius: 4,
            lifetime: 2.0,
            weaponId: weapon.weaponId,
            update: function (dt, canvas) {
              this.x += this.vx * dt;
              this.y += this.vy * dt;
              this.lifetime -= dt;
              this.shouldRemove =
                this.lifetime <= 0 ||
                this.x < 0 ||
                this.x > canvas.width ||
                this.y < 0 ||
                this.y > canvas.height;
            },
          });
        }
      }
    }
  }

  // 4. Axe - 위로 던져 포물선
  updateAxe(weapon, playerPos, gameTime, canvas) {
    if (weapon.cooldownTimer >= weapon.cooldown) {
      weapon.cooldownTimer = 0;

      for (let i = 0; i < weapon.projectileCount; i++) {
        const spread = (i - (weapon.projectileCount - 1) / 2) * 0.2;
        const projId = Math.random().toString(36).substr(2, 9);
        this.projectiles.push({
          id: projId,
          x: playerPos.x,
          y: playerPos.y,
          vx: Math.cos(Math.PI / 2 + spread) * 200,
          vy: Math.sin(Math.PI / 2 + spread) * 200,
          gravity: 400, // 중력
          damage: weapon.damage,
          radius: 8,
          lifetime: 3.0,
          hasHitGround: false,
          weaponId: weapon.weaponId,
          update: function (dt, canvas) {
            this.vy += this.gravity * dt; // 중력 적용
            this.x += this.vx * dt;
            this.y += this.vy * dt;

            // 바닥 충돌
            if (this.y >= canvas.height - 20 && !this.hasHitGround) {
              this.hasHitGround = true;
              this.vx = 0;
              this.vy = 0;
              this.y = canvas.height - 20;
              this.lifetime = 0.5; // 바닥에 머무는 시간
            }

            this.lifetime -= dt;
            this.shouldRemove = this.lifetime <= 0;
          },
        });
      }
    }
  }

  // 7. Santa Water - 랜덤 위치 장판
  updateSantaWater(weapon, playerPos, gameTime, canvas, enemies) {
    if (weapon.cooldownTimer >= weapon.cooldown) {
      weapon.cooldownTimer = 0;

      const isEvolution = weapon.weaponId === "w_laBorra";

      if (isEvolution) {
        // 라 보라: 가장 가까운 적 위치에 생성
        let targetX = playerPos.x;
        let targetY = playerPos.y;

        if (enemies && enemies.length > 0) {
          let nearestEnemy = null;
          let nearestDist = Infinity;
          enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return;
            const dx = enemy.x - playerPos.x;
            const dy = enemy.y - playerPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestEnemy = enemy;
            }
          });

          if (nearestEnemy) {
            targetX = nearestEnemy.x;
            targetY = nearestEnemy.y;
          }
        }

        this.groundEffects.push({
          x: targetX,
          y: targetY,
          radius: (weapon.area || 1.0) * 60,
          dps: weapon.dps,
          lifetime: weapon.duration || 3.0,
          weaponId: weapon.weaponId,
          targetEnemy: null, // 추적할 적
          speed: 50, // 이동 속도
        });
      } else {
        // 기본 성수: 플레이어 주변 랜덤 위치
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 100;
        const x = playerPos.x + Math.cos(angle) * distance;
        const y = playerPos.y + Math.sin(angle) * distance;

        const clampedX = Math.max(50, Math.min(canvas.width - 50, x));
        const clampedY = Math.max(50, Math.min(canvas.height - 50, y));

        this.groundEffects.push({
          x: clampedX,
          y: clampedY,
          radius: (weapon.area || 1.0) * 60,
          dps: weapon.dps,
          lifetime: weapon.duration || 2.0,
          weaponId: weapon.weaponId,
        });
      }
    }

    // 라 보라 장판 이동 업데이트
    if (weapon.weaponId === "w_laBorra" && enemies) {
      this.groundEffects.forEach((effect) => {
        if (effect.weaponId === "w_laBorra" && effect.speed) {
          // 가장 가까운 적 찾기
          let nearestEnemy = null;
          let nearestDist = Infinity;
          enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return;
            const dx = enemy.x - effect.x;
            const dy = enemy.y - effect.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestEnemy = enemy;
            }
          });

          if (nearestEnemy) {
            const dx = nearestEnemy.x - effect.x;
            const dy = nearestEnemy.y - effect.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
              const moveX = (dx / dist) * effect.speed * (1 / 60);
              const moveY = (dy / dist) * effect.speed * (1 / 60);
              effect.x += moveX;
              effect.y += moveY;
            }
          }
        }
      });
    }
  }

  // 8. King Bible - 회전 궤도
  updateKingBible(weapon, playerPos, gameTime) {
    weapon.angle += 0.1; // 회전 속도
  }

  // 9. Lightning Ring - 랜덤 위치 낙뢰
  updateLightningRing(weapon, gameTime, canvas, enemies) {
    if (weapon.cooldownTimer >= weapon.cooldown) {
      weapon.cooldownTimer = 0;

      const isEvolution = weapon.weaponId === "w_thunderLoop";
      const boltCount = weapon.boltCount || 1;
      const chainCount = isEvolution ? weapon.chainCount || 3 : 0;

      for (let i = 0; i < boltCount; i++) {
        let x, y;

        if (isEvolution && enemies && enemies.length > 0) {
          // 천둥 고리: 적 위치에 낙뢰
          const randomEnemy =
            enemies[Math.floor(Math.random() * enemies.length)];
          if (randomEnemy && randomEnemy.hp > 0) {
            x = randomEnemy.x;
            y = randomEnemy.y;
          } else {
            x = Math.random() * canvas.width;
            y = Math.random() * canvas.height;
          }
        } else {
          x = Math.random() * canvas.width;
          y = Math.random() * canvas.height;
        }

        this.lightningStrikes.push({
          x: x,
          y: y,
          radius: (weapon.area || 1.0) * (isEvolution ? 60 : 50),
          damage: weapon.damage,
          lifetime: 0.2,
          weaponId: weapon.weaponId,
          chainCount: chainCount,
          chainIndex: 0,
          chainTargets: [],
        });

        // 연쇄 번개 생성
        if (isEvolution && chainCount > 0 && enemies && enemies.length > 0) {
          let lastX = x;
          let lastY = y;

          for (let chain = 0; chain < chainCount; chain++) {
            // 다음 타겟 찾기
            let nextEnemy = null;
            let nextDist = Infinity;
            enemies.forEach((enemy) => {
              if (enemy.hp <= 0) return;
              const dx = enemy.x - lastX;
              const dy = enemy.y - lastY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < nextDist && dist > 30) {
                // 너무 가까운 적 제외
                nextDist = dist;
                nextEnemy = enemy;
              }
            });

            if (nextEnemy) {
              lastX = nextEnemy.x;
              lastY = nextEnemy.y;

              this.lightningStrikes.push({
                x: lastX,
                y: lastY,
                radius: (weapon.area || 1.0) * 50 * (1 - chain * 0.2), // 연쇄마다 작아짐
                damage: weapon.damage * (1 - chain * 0.2), // 연쇄마다 데미지 감소
                lifetime: 0.15,
                weaponId: weapon.weaponId,
                chainIndex: chain + 1,
              });
            } else {
              break;
            }
          }
        }
      }
    }
  }

  // 10. Fire Wand - 폭발형 투사체
  updateFireWand(weapon, playerPos, enemies, gameTime, canvas) {
    if (weapon.cooldownTimer >= weapon.cooldown) {
      weapon.cooldownTimer = 0;

      // 가장 가까운 적 방향
      let angle = 0;
      if (enemies.length > 0) {
        let nearestEnemy = null;
        let nearestDist = Infinity;
        enemies.forEach((enemy) => {
          const dx = enemy.x - playerPos.x;
          const dy = enemy.y - playerPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestEnemy = enemy;
          }
        });
        if (nearestEnemy) {
          angle = Math.atan2(
            nearestEnemy.y - playerPos.y,
            nearestEnemy.x - playerPos.x
          );
        }
      }

      for (let i = 0; i < weapon.projectileCount; i++) {
        const spread = (i - (weapon.projectileCount - 1) / 2) * 0.15;
        const projId = Math.random().toString(36).substr(2, 9);
        this.projectiles.push({
          id: projId,
          x: playerPos.x,
          y: playerPos.y,
          vx: Math.cos(angle + spread) * 250,
          vy: Math.sin(angle + spread) * 250,
          damage: weapon.damage,
          radius: 6,
          maxDistance: 400,
          distance: 0,
          explosionRadius: (weapon.explosionRadius || 1.0) * 40,
          hasExploded: false,
          lifetime: 3.0,
          weaponId: weapon.weaponId,
          update: function (dt, canvas) {
            if (!this.hasExploded) {
              this.distance +=
                Math.sqrt(this.vx * this.vx + this.vy * this.vy) * dt;
              this.x += this.vx * dt;
              this.y += this.vy * dt;

              if (this.distance >= this.maxDistance) {
                this.hasExploded = true;
                this.lifetime = 0.3; // 폭발 지속 시간
              }
            } else {
              this.lifetime -= dt;
            }

            this.shouldRemove = this.lifetime <= 0;
          },
        });
      }
    }
  }

  // 11. Runetracer - 바운스 투사체
  updateRunetracer(weapon, playerPos, gameTime, canvas) {
    if (weapon.cooldownTimer >= weapon.cooldown) {
      weapon.cooldownTimer = 0;

      const isEvolution = weapon.weaponId === "w_noFuture";
      const angle = Math.random() * Math.PI * 2;
      const projId = Math.random().toString(36).substr(2, 9);

      this.projectiles.push({
        id: projId,
        x: playerPos.x,
        y: playerPos.y,
        vx: Math.cos(angle) * 200,
        vy: Math.sin(angle) * 200,
        damage: weapon.damage,
        radius: 5,
        bounceCount: 0,
        maxBounces: weapon.bounceCount || 2,
        lifetime: weapon.duration || 3.0,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        weaponId: weapon.weaponId,
        explosionOnBounce: isEvolution,
        explosionRadius: isEvolution ? 40 : 0,
        hasExploded: false,
        update: function (dt, canvas) {
          this.x += this.vx * dt;
          this.y += this.vy * dt;

          // 벽 충돌 및 반사
          let bounced = false;
          if (this.x <= 0 || this.x >= canvas.width) {
            this.vx *= -1;
            this.bounceCount++;
            this.x = Math.max(0, Math.min(canvas.width, this.x));
            bounced = true;
          }
          if (this.y <= 0 || this.y >= canvas.height) {
            this.vy *= -1;
            this.bounceCount++;
            this.y = Math.max(0, Math.min(canvas.height, this.y));
            bounced = true;
          }

          // 미래 없음: 바운스 시 폭발 효과
          if (bounced && this.explosionOnBounce && !this.hasExploded) {
            this.hasExploded = true;
            this.explosionLifetime = 0.3; // 폭발 지속 시간
          }

          if (this.hasExploded && this.explosionLifetime !== undefined) {
            this.explosionLifetime -= dt;
            if (this.explosionLifetime <= 0) {
              this.hasExploded = false;
            }
          }

          this.lifetime -= dt;
          this.shouldRemove =
            this.lifetime <= 0 || this.bounceCount >= this.maxBounces;
        },
      });
    }
  }

  // 무기 렌더링
  renderWeapons(ctx, playerPos) {
    this.activeWeapons.forEach((weapon) => {
      const weaponData = WEAPONS_DB[weapon.weaponId];
      if (!weaponData) return;

      // 진화 무기는 기본 무기 렌더링 로직 사용
      const baseWeaponId = getBaseWeaponId(weapon.weaponId);
      switch (baseWeaponId) {
        case "w_whip":
        case "w_bloodyTear":
          this.renderWhip(ctx, weapon, playerPos);
          break;
        case "w_knife":
        case "w_thousandEdge":
        case "w_magicWand":
        case "w_holyWand":
        case "w_axe":
        case "w_fireWand":
        case "w_hellfire":
        case "w_runetracer":
        case "w_noFuture":
        case "w_homingMissile":
        case "w_advancedMissile":
          // 투사체는 별도 렌더링
          break;
        case "w_garlic":
        case "w_soulEater":
          this.renderAuraWeapon(ctx, weapon, playerPos);
          break;
        case "w_santaWater":
        case "w_laBorra":
          // 장판은 별도 렌더링
          break;
        case "w_kingBible":
        case "w_unchainedSpirits":
          this.renderOrbitalWeapon(ctx, weapon, playerPos);
          break;
        case "w_lightningRing":
        case "w_thunderLoop":
          // 낙뢰는 별도 렌더링
          break;
      }
    });

    // 투사체 렌더링
    this.projectiles.forEach((proj) => {
      this.renderProjectile(ctx, proj);
    });

    // 장판 렌더링
    this.groundEffects.forEach((effect) => {
      this.renderGroundEffect(ctx, effect);
    });

    // 낙뢰 렌더링
    this.lightningStrikes.forEach((strike) => {
      this.renderLightning(ctx, strike);
    });
  }

  // Whip 렌더링 - 개선된 시각 효과
  renderWhip(ctx, weapon, playerPos) {
    if (!weapon.isSwinging) return;

    const isEvolution = weapon.weaponId === "w_bloodyTear";
    const range = (weapon.range || 1.0) * (isEvolution ? 120 : 100); // 진화는 더 넓은 범위
    const swingAngle = Math.PI / (isEvolution ? 2.0 : 2.5); // 진화는 더 넓은 각도
    const progress = weapon.swingProgress / 0.3;

    // 레벨 3 이상: 양옆 동시, 미만: 한쪽만
    const swingDirections = weapon.swingDirections || [
      weapon.swingDirection || 1,
    ];

    // 각 방향에 대해 렌더링
    swingDirections.forEach((direction) => {
      const angle = direction === 1 ? Math.PI / 4 : -Math.PI / 4;

      if (isEvolution) {
        // 피눈물: 어두운 빨강 + 피 효과
        // 외곽 선 (어두운 빨강)
        ctx.strokeStyle = "#8b0000";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(
          playerPos.x,
          playerPos.y,
          range,
          angle - swingAngle * (1 - progress),
          angle + swingAngle * (1 - progress)
        );
        ctx.stroke();

        // 중간 선 (진한 빨강)
        ctx.strokeStyle = "#cc0000";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(
          playerPos.x,
          playerPos.y,
          range * 0.95,
          angle - swingAngle * (1 - progress),
          angle + swingAngle * (1 - progress)
        );
        ctx.stroke();

        // 내부 선 (밝은 빨강)
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(
          playerPos.x,
          playerPos.y,
          range * 0.9,
          angle - swingAngle * (1 - progress),
          angle + swingAngle * (1 - progress)
        );
        ctx.stroke();

        // 피 파티클 효과
        const endAngle = angle + swingAngle * (1 - progress) * direction;
        const endX = playerPos.x + Math.cos(endAngle) * range;
        const endY = playerPos.y + Math.sin(endAngle) * range;

        // 큰 피 방울
        ctx.fillStyle = "#8b0000";
        ctx.beginPath();
        ctx.arc(endX, endY, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.arc(endX, endY, 8, 0, Math.PI * 2);
        ctx.fill();

        // 작은 피 방울들
        for (let i = 0; i < 5; i++) {
          const dropAngle = endAngle + (Math.random() - 0.5) * 0.5;
          const dropDist = 15 + Math.random() * 10;
          const dropX = endX + Math.cos(dropAngle) * dropDist;
          const dropY = endY + Math.sin(dropAngle) * dropDist;
          ctx.fillStyle = `rgba(255, 0, 0, ${0.6 + Math.random() * 0.4})`;
          ctx.beginPath();
          ctx.arc(dropX, dropY, 3 + Math.random() * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // 기본 채찍
        ctx.strokeStyle = "#cc0000";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(
          playerPos.x,
          playerPos.y,
          range,
          angle - swingAngle * (1 - progress),
          angle + swingAngle * (1 - progress)
        );
        ctx.stroke();

        ctx.strokeStyle = "#ff6b6b";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(
          playerPos.x,
          playerPos.y,
          range * 0.9,
          angle - swingAngle * (1 - progress),
          angle + swingAngle * (1 - progress)
        );
        ctx.stroke();

        const endAngle = angle + swingAngle * (1 - progress) * direction;
        const endX = playerPos.x + Math.cos(endAngle) * range;
        const endY = playerPos.y + Math.sin(endAngle) * range;

        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.arc(endX, endY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(endX, endY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  // 회전형 무기 렌더링 (King Bible)
  renderOrbitalWeapon(ctx, weapon, playerPos) {
    const isEvolution = weapon.weaponId === "w_unchainedSpirits";
    const count = isEvolution ? weapon.count || 5 : weapon.count || 1;
    const range = (weapon.range || 1.0) * 50;
    const angleStep = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
      const angle = weapon.angle + angleStep * i;
      const weaponX = playerPos.x + Math.cos(angle) * range;
      const weaponY = playerPos.y + Math.sin(angle) * range;

      if (isEvolution) {
        // 해방된 영혼: 더 밝고 큰 효과
        // 외곽 빛
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.beginPath();
        ctx.arc(weaponX, weaponY, 12, 0, Math.PI * 2);
        ctx.fill();

        // 중심
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(weaponX, weaponY, 8, 0, Math.PI * 2);
        ctx.fill();

        // 내부 빛
        ctx.fillStyle = "#ffff00";
        ctx.beginPath();
        ctx.arc(weaponX, weaponY, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(weaponX, weaponY, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 오라 무기 렌더링 (Garlic)
  renderAuraWeapon(ctx, weapon, playerPos) {
    const isEvolution = weapon.weaponId === "w_soulEater";
    const radius = (weapon.radius || 1.0) * 50;

    if (isEvolution) {
      // 영혼 포식자: 어두운 보라색 오라 + 영혼 파티클
      // 외곽 오라
      ctx.strokeStyle = "rgba(75, 0, 130, 0.5)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(playerPos.x, playerPos.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 내부 오라
      ctx.strokeStyle = "rgba(138, 43, 226, 0.4)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(playerPos.x, playerPos.y, radius * 0.9, 0, Math.PI * 2);
      ctx.stroke();

      // 영혼 파티클 (간단한 효과)
      const time = Date.now() / 1000;
      for (let i = 0; i < 8; i++) {
        const angle = ((Math.PI * 2) / 8) * i + time;
        const dist = radius * 0.7 + Math.sin(time * 2 + i) * 10;
        const x = playerPos.x + Math.cos(angle) * dist;
        const y = playerPos.y + Math.sin(angle) * dist;
        ctx.fillStyle = `rgba(138, 43, 226, ${
          0.5 + Math.sin(time * 3 + i) * 0.3
        })`;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = "rgba(255, 255, 0, 0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(playerPos.x, playerPos.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 투사체 렌더링
  renderProjectile(ctx, proj) {
    // 유도탄: 빨간색 미사일 효과
    if (
      proj.weaponId === "w_homingMissile" ||
      proj.weaponId === "w_advancedMissile"
    ) {
      const isEvolution = proj.weaponId === "w_advancedMissile";
      // 미사일 몸체
      ctx.fillStyle = isEvolution ? "#ff4444" : "#ff6666";
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // 미사일 꼬리
      const angle = Math.atan2(proj.vy, proj.vx);
      const tailLength = 10;
      ctx.strokeStyle = isEvolution ? "#ff0000" : "#ff6666";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(proj.x, proj.y);
      ctx.lineTo(
        proj.x - Math.cos(angle) * tailLength,
        proj.y - Math.sin(angle) * tailLength
      );
      ctx.stroke();

      // 진화 버전: 더 밝은 효과
      if (isEvolution) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // 천검: 더 밝고 빠른 효과
    else if (proj.weaponId === "w_thousandEdge") {
      ctx.fillStyle = "#ffff00";
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    // 성스러운 지팡이: 황금색 빛
    else if (proj.weaponId === "w_holyWand") {
      ctx.fillStyle = "#ffd700";
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius * 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffff00";
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius * 0.8, 0, Math.PI * 2);
      ctx.fill();
      // 빛 효과
      ctx.strokeStyle = "rgba(255, 215, 0, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    // 지옥불: 더 큰 빨간 투사체
    else if (proj.weaponId === "w_hellfire") {
      ctx.fillStyle = "#ff4500";
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius * 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff0000";
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius * 0.9, 0, Math.PI * 2);
      ctx.fill();
      // 폭발 시
      if (proj.hasExploded) {
        ctx.fillStyle = "rgba(255, 69, 0, 0.6)";
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.explosionRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // 미래 없음: 보라색 + 바운스 시 폭발
    else if (proj.weaponId === "w_noFuture") {
      ctx.fillStyle = "#8b00ff";
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff00ff";
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    // 기본 투사체
    else {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fire Wand/Hellfire 폭발 효과
    if (
      (proj.weaponId === "w_fireWand" || proj.weaponId === "w_hellfire") &&
      proj.hasExploded
    ) {
      ctx.fillStyle = "rgba(255, 100, 0, 0.5)";
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.explosionRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 미래 없음: 바운스 시 폭발 효과
    if (
      proj.weaponId === "w_noFuture" &&
      proj.hasExploded &&
      proj.explosionLifetime !== undefined
    ) {
      const alpha = proj.explosionLifetime / 0.3;
      ctx.fillStyle = `rgba(139, 0, 255, ${alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.explosionRadius || 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 0, 255, ${alpha * 0.4})`;
      ctx.beginPath();
      ctx.arc(
        proj.x,
        proj.y,
        (proj.explosionRadius || 40) * 0.7,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  // 장판 렌더링 (Santa Water)
  renderGroundEffect(ctx, effect) {
    const isEvolution = effect.weaponId === "w_laBorra";

    if (isEvolution) {
      // 라 보라: 더 큰 범위 + 이동 효과
      // 외곽 원
      ctx.fillStyle = "rgba(0, 100, 200, 0.3)";
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // 중간 원
      ctx.fillStyle = "rgba(0, 150, 255, 0.5)";
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.fill();

      // 내부 원
      ctx.fillStyle = "rgba(100, 200, 255, 0.6)";
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // 파도 효과
      const time = Date.now() / 500;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        effect.x,
        effect.y,
        effect.radius * 0.9 + Math.sin(time) * 5,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(0, 150, 255, 0.4)";
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 낙뢰 렌더링
  renderLightning(ctx, strike) {
    const isEvolution = strike.weaponId === "w_thunderLoop";

    if (isEvolution) {
      // 천둥 고리: 더 강한 번개 + 연쇄 효과
      // 메인 번개 (더 두껍고 밝음)
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(strike.x, 0);
      ctx.lineTo(strike.x, strike.y);
      ctx.stroke();

      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(strike.x, 0);
      ctx.lineTo(strike.x, strike.y);
      ctx.stroke();

      // 폭발 효과 (더 큰 범위)
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();
      ctx.arc(strike.x, strike.y, strike.radius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 0, 0.7)";
      ctx.beginPath();
      ctx.arc(strike.x, strike.y, strike.radius, 0, Math.PI * 2);
      ctx.fill();

      // 연쇄 번개 효과 (작은 번개들)
      for (let i = 0; i < 3; i++) {
        const offsetX = (Math.random() - 0.5) * strike.radius * 2;
        const offsetY = (Math.random() - 0.5) * strike.radius * 2;
        ctx.strokeStyle = `rgba(255, 255, 0, ${0.5 - i * 0.15})`;
        ctx.lineWidth = 2 - i * 0.5;
        ctx.beginPath();
        ctx.moveTo(strike.x + offsetX, strike.y - strike.radius);
        ctx.lineTo(strike.x + offsetX, strike.y + offsetY);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(strike.x, 0);
      ctx.lineTo(strike.x, strike.y);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 0, 0.6)";
      ctx.beginPath();
      ctx.arc(strike.x, strike.y, strike.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 무기 충돌 체크 (적과의 충돌)
  checkWeaponCollisions(
    weapon,
    playerPos,
    playerVelocity,
    enemies,
    gameTime,
    canvas
  ) {
    const hits = [];
    // 기본 무기 또는 진화 무기 확인
    let weaponData = WEAPONS_DB[weapon.weaponId];
    if (!weaponData) {
      weaponData = EVOLUTIONS_DB[weapon.weaponId];
    }
    if (!weaponData) return hits;

    if (!weapon.enemyHitTimes) {
      weapon.enemyHitTimes = new Map();
    }

    // 진화 무기는 기본 무기 로직 사용
    const baseWeaponId = getBaseWeaponId(weapon.weaponId);
    switch (baseWeaponId) {
      case "w_whip":
      case "w_bloodyTear":
        // 좌우 스윙 충돌 (레벨 3 이상: 양옆 동시)
        if (weapon.isSwinging) {
          const isEvolution = weapon.weaponId === "w_bloodyTear";
          const range = (weapon.range || 1.0) * (isEvolution ? 120 : 100); // 렌더링 범위와 일치
          const swingAngle = Math.PI / (isEvolution ? 2.0 : 2.5); // 렌더링과 일치
          const progress = weapon.swingProgress
            ? weapon.swingProgress / 0.3
            : 1;

          // 레벨 3 이상: 양옆 동시, 미만: 한쪽만
          const swingDirections = weapon.swingDirections || [
            weapon.swingDirection || 1,
          ];

          enemies.forEach((enemy, index) => {
            const dx = enemy.x - playerPos.x;
            const dy = enemy.y - playerPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const enemyAngle = Math.atan2(dy, dx);

            // 각 방향에 대해 충돌 체크
            for (const direction of swingDirections) {
              const angle = direction === 1 ? Math.PI / 4 : -Math.PI / 4;

              // 부채꼴 범위 체크 (스윙 진행도 반영)
              const minAngle = angle - swingAngle * (1 - progress);
              const maxAngle = angle + swingAngle * (1 - progress);

              // 각도 범위 체크 (각도 정규화)
              let angleInRange = false;
              if (minAngle <= maxAngle) {
                // 일반적인 경우
                angleInRange = enemyAngle >= minAngle && enemyAngle <= maxAngle;
              } else {
                // 각도가 -PI ~ PI 경계를 넘는 경우
                angleInRange = enemyAngle >= minAngle || enemyAngle <= maxAngle;
              }

              if (distance < range + enemy.radius && angleInRange) {
                const lastHitTime = weapon.enemyHitTimes.get(index) || 0;
                if (gameTime - lastHitTime >= 0.1) {
                  hits.push({ enemyIndex: index, damage: weapon.damage });
                  weapon.enemyHitTimes.set(index, gameTime);
                  break; // 한 번만 히트
                }
              }
            }
          });
        }
        break;

      case "w_garlic":
      case "w_soulEater":
        // 오라 지속 피해
        enemies.forEach((enemy, index) => {
          const dx = playerPos.x - enemy.x;
          const dy = playerPos.y - enemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < (weapon.radius || 1.0) * 50 + enemy.radius) {
            hits.push({
              enemyIndex: index,
              damage: (weapon.dps || 0) / 60,
            });
          }
        });
        break;

      case "w_kingBible":
      case "w_unchainedSpirits":
        // 회전 궤도 충돌 (모든 성경에 대해 체크)
        const isEvolution = weapon.weaponId === "w_unchainedSpirits";
        const count = isEvolution ? weapon.count || 5 : weapon.count || 1;
        const range = (weapon.range || 1.0) * 50;
        const angleStep = (Math.PI * 2) / count;

        enemies.forEach((enemy, index) => {
          // 모든 성경에 대해 충돌 체크
          for (let i = 0; i < count; i++) {
            const angle = weapon.angle + angleStep * i;
            const weaponX = playerPos.x + Math.cos(angle) * range;
            const weaponY = playerPos.y + Math.sin(angle) * range;

            const dx = weaponX - enemy.x;
            const dy = weaponY - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < enemy.radius + 8) {
              const lastHitTime = weapon.enemyHitTimes.get(index) || 0;
              if (gameTime - lastHitTime >= weapon.cooldown) {
                hits.push({ enemyIndex: index, damage: weapon.damage || 0 });
                weapon.enemyHitTimes.set(index, gameTime);
                break; // 한 번만 히트
              }
            }
          }
        });
        break;

      case "w_santaWater":
      case "w_laBorra":
        // 장판 충돌
        this.groundEffects.forEach((effect) => {
          if (effect.weaponId === weapon.weaponId) {
            enemies.forEach((enemy, index) => {
              const dx = effect.x - enemy.x;
              const dy = effect.y - enemy.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < effect.radius + enemy.radius) {
                hits.push({
                  enemyIndex: index,
                  damage: (effect.dps || 0) / 60,
                });
              }
            });
          }
        });
        break;

      case "w_lightningRing":
      case "w_thunderLoop":
        // 낙뢰 충돌
        this.lightningStrikes.forEach((strike) => {
          if (strike.weaponId === weapon.weaponId) {
            enemies.forEach((enemy, index) => {
              const dx = strike.x - enemy.x;
              const dy = strike.y - enemy.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < strike.radius + enemy.radius) {
                const lastHitTime = weapon.enemyHitTimes.get(index) || 0;
                if (gameTime - lastHitTime >= 0.1) {
                  hits.push({ enemyIndex: index, damage: strike.damage });
                  weapon.enemyHitTimes.set(index, gameTime);
                }
              }
            });
          }
        });
        break;
    }

    // 투사체 충돌 체크
    this.projectiles.forEach((proj) => {
      if (proj.weaponId !== weapon.weaponId) return;

      // 미래 없음: 폭발 범위 데미지
      if (
        proj.weaponId === "w_noFuture" &&
        proj.hasExploded &&
        proj.explosionLifetime !== undefined
      ) {
        const explosionRadius = proj.explosionRadius || 40;
        enemies.forEach((enemy, index) => {
          const dx = proj.x - enemy.x;
          const dy = proj.y - enemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < explosionRadius + enemy.radius) {
            const lastHitTime =
              weapon.enemyHitTimes.get(`${index}_${proj.id || 0}_explosion`) ||
              0;
            if (gameTime - lastHitTime >= 0.1) {
              hits.push({ enemyIndex: index, damage: proj.damage * 1.5 }); // 폭발 데미지 증가
              weapon.enemyHitTimes.set(
                `${index}_${proj.id || 0}_explosion`,
                gameTime
              );
            }
          }
        });
      }

      // 일반 투사체 충돌
      enemies.forEach((enemy, index) => {
        const dx = proj.x - enemy.x;
        const dy = proj.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < proj.radius + enemy.radius) {
          const lastHitTime =
            weapon.enemyHitTimes.get(`${index}_${proj.id || 0}`) || 0;
          if (gameTime - lastHitTime >= 0.1) {
            hits.push({ enemyIndex: index, damage: proj.damage });

            // Fire Wand/Hellfire는 폭발 후 제거
            if (
              (proj.weaponId === "w_fireWand" ||
                proj.weaponId === "w_hellfire") &&
              !proj.hasExploded
            ) {
              proj.hasExploded = true;
              proj.lifetime = 0.3;
            } else if (
              proj.weaponId !== "w_homingMissile" &&
              proj.weaponId !== "w_advancedMissile"
            ) {
              // 유도탄만 관통, 나머지는 제거
              proj.shouldRemove = true;
            }

            weapon.enemyHitTimes.set(`${index}_${proj.id || 0}`, gameTime);
          }
        }
      });

      // Axe 바닥 충돌 시 광역 데미지
      if (proj.weaponId === "w_axe" && proj.hasHitGround && !proj.exploded) {
        proj.exploded = true;
        const explosionRadius = (weapon.area || 1.0) * 60;
        enemies.forEach((enemy, index) => {
          const dx = proj.x - enemy.x;
          const dy = proj.y - enemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < explosionRadius + enemy.radius) {
            hits.push({ enemyIndex: index, damage: proj.damage });
          }
        });
      }
    });

    return hits;
  }
}
