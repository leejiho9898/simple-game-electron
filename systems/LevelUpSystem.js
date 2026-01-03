// 레벨업 선택지 시스템
import { WEAPONS_DB, PASSIVES_DB } from "../data/gameData.js";

export class LevelUpSystem {
  constructor() {
    // 레벨업 선택지 생성 및 적용
  }

  // 레벨업 선택지 생성
  generateLevelUpChoices(gameState) {
    const candidates = this.buildCandidates(gameState);
    const picked = this.drawWeightedUnique(candidates, 3);
    return this.fillWithFallbacks(picked, 3);
  }

  // 후보군 구성
  buildCandidates(gameState) {
    const candidates = [];

    // (A) 신규 무기
    Object.keys(WEAPONS_DB).forEach((weaponId) => {
      if (!gameState.inventory.hasWeapon(weaponId)) {
        if (gameState.inventory.canAddWeapon()) {
          candidates.push({
            kind: "WEAPON_ADD",
            id: weaponId,
            weight: 1.0,
          });
        }
      }
    });

    // (B) 보유 무기 레벨업
    gameState.inventory.weapons.forEach((weapon) => {
      const weaponData = WEAPONS_DB[weapon.id];
      if (weaponData && weapon.level < weaponData.maxLevel) {
        candidates.push({
          kind: "WEAPON_LEVEL_UP",
          id: weapon.id,
          weight: 1.2, // 보유 레벨업은 가중치 높음
        });
      }
    });

    // (C) 신규 패시브
    Object.keys(PASSIVES_DB).forEach((passiveId) => {
      if (!gameState.inventory.hasPassive(passiveId)) {
        if (gameState.inventory.canAddPassive()) {
          candidates.push({
            kind: "PASSIVE_ADD",
            id: passiveId,
            weight: 1.0,
          });
        }
      }
    });

    // (D) 보유 패시브 레벨업
    gameState.inventory.passives.forEach((passive) => {
      const passiveData = PASSIVES_DB[passive.id];
      if (passiveData && passive.level < passiveData.maxLevel) {
        candidates.push({
          kind: "PASSIVE_LEVEL_UP",
          id: passive.id,
          weight: 1.2, // 보유 레벨업은 가중치 높음
        });
      }
    });

    return candidates;
  }

  // 가중치 기반 중복 없는 선택
  drawWeightedUnique(candidates, count) {
    const picked = [];
    const usedIds = new Set();

    // 후보가 부족하면 모두 반환
    if (candidates.length <= count) {
      return candidates;
    }

    // 가중치 합 계산
    let totalWeight = 0;
    candidates.forEach((c) => {
      if (!usedIds.has(this.getChoiceId(c))) {
        totalWeight += c.weight;
      }
    });

    // count개 선택
    for (let i = 0; i < count && picked.length < count; i++) {
      if (totalWeight <= 0) break;

      // 랜덤 선택
      let random = Math.random() * totalWeight;
      let selected = null;

      for (const candidate of candidates) {
        const choiceId = this.getChoiceId(candidate);
        if (usedIds.has(choiceId)) continue;

        random -= candidate.weight;
        if (random <= 0) {
          selected = candidate;
          break;
        }
      }

      if (selected) {
        picked.push(selected);
        usedIds.add(this.getChoiceId(selected));
        totalWeight -= selected.weight;
      }
    }

    return picked;
  }

  // 선택지 ID 생성 (중복 체크용)
  getChoiceId(choice) {
    return `${choice.kind}_${choice.id}`;
  }

  // 선택지 부족 시 대체 보상으로 채움
  fillWithFallbacks(picked, targetCount) {
    const fallbacks = [
      { kind: "GOLD", amount: 25, weight: 1.0 },
      { kind: "HEAL", percent: 0.2, weight: 1.0 },
      { kind: "REROLL_TOKEN", amount: 1, weight: 1.0 },
    ];

    while (picked.length < targetCount) {
      const fallback = fallbacks[picked.length % fallbacks.length];
      picked.push(fallback);
    }

    return picked;
  }

  // 선택 적용
  applyChoice(gameState, choice) {
    switch (choice.kind) {
      case "WEAPON_ADD":
        if (gameState.inventory.addWeapon(choice.id)) {
          // 무기 추가 성공
        }
        break;

      case "WEAPON_LEVEL_UP":
        const weapon = gameState.inventory.getWeapon(choice.id);
        if (weapon) {
          const weaponData = WEAPONS_DB[choice.id];
          if (weaponData && weapon.level < weaponData.maxLevel) {
            gameState.inventory.levelUpWeapon(choice.id);
          }
        }
        break;

      case "PASSIVE_ADD":
        if (gameState.inventory.addPassive(choice.id)) {
          // 패시브 추가 성공 - 스탯 재계산 필요
          // PassiveSystem.rebuildPlayerStats()는 게임 메인에서 호출
        }
        break;

      case "PASSIVE_LEVEL_UP":
        const passive = gameState.inventory.getPassive(choice.id);
        if (passive) {
          const passiveData = PASSIVES_DB[choice.id];
          if (passiveData && passive.level < passiveData.maxLevel) {
            gameState.inventory.levelUpPassive(choice.id);
            // 패시브 레벨업 - 스탯 재계산 필요
          }
        }
        break;

      case "GOLD":
        gameState.run.gold += choice.amount;
        break;

      case "HEAL":
        const healAmount = gameState.player.hpMax * choice.percent;
        gameState.player.hp = Math.min(
          gameState.player.hpMax,
          gameState.player.hp + healAmount
        );
        break;

      case "REROLL_TOKEN":
        gameState.run.rerollTokens += choice.amount;
        break;
    }
  }

  // 선택지 설명 텍스트 생성
  getChoiceDescription(choice) {
    switch (choice.kind) {
      case "WEAPON_ADD": {
        const weaponData = WEAPONS_DB[choice.id];
        if (!weaponData) return "";
        const levelData = weaponData.levels[0];
        return `신규 무기: ${weaponData.name}\n레벨 1 효과`;
      }

      case "WEAPON_LEVEL_UP": {
        const weapon = WEAPONS_DB[choice.id];
        if (!weapon) return "";
        // 현재 레벨과 다음 레벨 비교는 외부에서 전달 필요
        return `무기 레벨업: ${weapon.name}`;
      }

      case "PASSIVE_ADD": {
        const passiveData = PASSIVES_DB[choice.id];
        if (!passiveData) return "";
        return `신규 패시브: ${passiveData.name}\n레벨 1 효과`;
      }

      case "PASSIVE_LEVEL_UP": {
        const passive = PASSIVES_DB[choice.id];
        if (!passive) return "";
        return `패시브 레벨업: ${passive.name}`;
      }

      case "GOLD":
        return `골드 +${choice.amount}`;

      case "HEAL":
        return `HP ${(choice.percent * 100).toFixed(0)}% 회복`;

      case "REROLL_TOKEN":
        return `리롤권 +${choice.amount}`;

      default:
        return "";
    }
  }

  // 선택지 상세 정보 (레벨, 효과 등)
  getChoiceDetails(choice, gameState) {
    switch (choice.kind) {
      case "WEAPON_ADD": {
        const weaponData = WEAPONS_DB[choice.id];
        if (!weaponData) return null;
        return {
          name: weaponData.name,
          type: "무기",
          currentLevel: 0,
          maxLevel: weaponData.maxLevel,
          nextLevel: 1,
          description: this.getWeaponLevelDescription(weaponData, 1),
        };
      }

      case "WEAPON_LEVEL_UP": {
        const weapon = gameState.inventory.getWeapon(choice.id);
        const weaponData = WEAPONS_DB[choice.id];
        if (!weapon || !weaponData) return null;
        return {
          name: weaponData.name,
          type: "무기",
          currentLevel: weapon.level,
          maxLevel: weaponData.maxLevel,
          nextLevel: weapon.level + 1,
          description: this.getWeaponLevelDescription(
            weaponData,
            weapon.level + 1
          ),
        };
      }

      case "PASSIVE_ADD": {
        const passiveData = PASSIVES_DB[choice.id];
        if (!passiveData) return null;
        return {
          name: passiveData.name,
          type: "패시브",
          currentLevel: 0,
          maxLevel: passiveData.maxLevel,
          nextLevel: 1,
          description: this.getPassiveLevelDescription(passiveData, 1),
        };
      }

      case "PASSIVE_LEVEL_UP": {
        const passive = gameState.inventory.getPassive(choice.id);
        const passiveData = PASSIVES_DB[choice.id];
        if (!passive || !passiveData) return null;
        return {
          name: passiveData.name,
          type: "패시브",
          currentLevel: passive.level,
          maxLevel: passiveData.maxLevel,
          nextLevel: passive.level + 1,
          description: this.getPassiveLevelDescription(
            passiveData,
            passive.level + 1
          ),
        };
      }

      case "GOLD":
        return {
          name: "골드",
          type: "보상",
          description: `골드 +${choice.amount}`,
        };

      case "HEAL":
        return {
          name: "회복",
          type: "보상",
          description: `HP ${(choice.percent * 100).toFixed(0)}% 회복`,
        };

      case "REROLL_TOKEN":
        return {
          name: "리롤권",
          type: "보상",
          description: `리롤권 +${choice.amount}`,
        };

      default:
        return null;
    }
  }

  // 무기 레벨 설명
  getWeaponLevelDescription(weaponData, level) {
    if (level < 1 || level > weaponData.maxLevel) return "";
    const levelData = weaponData.levels[level - 1];
    const parts = [];

    if (levelData.damage !== undefined) parts.push(`피해 ${levelData.damage}`);
    if (levelData.dps !== undefined) parts.push(`DPS ${levelData.dps}`);
    if (levelData.cooldown !== undefined)
      parts.push(`쿨타임 ${levelData.cooldown}s`);
    if (levelData.range !== undefined) parts.push(`범위 ${levelData.range}`);
    if (levelData.projectileCount !== undefined)
      parts.push(`발사수 ${levelData.projectileCount}`);
    if (levelData.radius !== undefined) parts.push(`반경 ${levelData.radius}`);

    return parts.join(", ");
  }

  // 패시브 레벨 설명
  getPassiveLevelDescription(passiveData, level) {
    if (level < 1 || level > passiveData.maxLevel) return "";
    const value = passiveData.levels[level - 1];

    switch (passiveData.effect) {
      case "hpMax":
        return `HP 최대치 +${value}`;
      case "projectileSpeed":
        return `투사체 속도 +${(value * 100).toFixed(0)}%`;
      case "might":
        return `피해 +${(value * 100).toFixed(0)}%`;
      case "area":
        return `공격 범위 +${(value * 100).toFixed(0)}%`;
      case "duration":
        return `지속 시간 +${(value * 100).toFixed(0)}%`;
      case "luck":
        return `행운 +${value}`;
      case "hpRegen":
        return `초당 HP 회복 +${value.toFixed(1)}`;
      case "pickupRadius":
        return `획득 반경 +${(value * 100).toFixed(0)}%`;
      case "projectileCount":
        return `투사체 개수 +${value}`;
      case "damageReduction":
        return `받는 피해 -${value}`;
      case "expGain":
        return `경험치 획득 +${(value * 100).toFixed(0)}%`;
      case "cooldown":
        return `쿨다운 -${(value * 100).toFixed(0)}%`;
      default:
        return "";
    }
  }
}

