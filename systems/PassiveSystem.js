// 패시브 효과 시스템
import { PASSIVES_DB } from "../data/gameData.js";

export class PassiveSystem {
  constructor() {
    // 패시브 효과 적용을 위한 시스템
  }

  // 플레이어 스탯 재계산
  rebuildPlayerStats(playerState, inventoryState) {
    // 기본값으로 초기화
    playerState.hpMax = 100;
    playerState.pickupRadius = 1.0;
    playerState.luck = 0;
    playerState.cooldownMult = 1.0;
    playerState.projectileSpeedMult = 1.0;
    playerState.projectileCountBonus = 0;
    playerState.mightMult = 1.0;
    playerState.durationMult = 1.0;
    playerState.areaMult = 1.0;
    playerState.hpRegen = 0;
    playerState.damageReduction = 0;
    playerState.expGainMult = 1.0;

    // 보유한 패시브 효과 누적 적용
    inventoryState.passives.forEach((passive) => {
      const passiveData = PASSIVES_DB[passive.id];
      if (!passiveData) return;

      const level = passive.level;
      if (level < 1 || level > passiveData.maxLevel) return;

      const effectValue = passiveData.levels[level - 1];

      switch (passiveData.effect) {
        case "hpMax":
          playerState.hpMax += effectValue;
          break;
        case "projectileSpeed":
          playerState.projectileSpeedMult += effectValue;
          break;
        case "might":
          playerState.mightMult += effectValue;
          break;
        case "area":
          playerState.areaMult += effectValue;
          break;
        case "duration":
          playerState.durationMult += effectValue;
          break;
        case "luck":
          playerState.luck += effectValue;
          break;
        case "hpRegen":
          playerState.hpRegen += effectValue;
          break;
        case "pickupRadius":
          playerState.pickupRadius += effectValue;
          break;
        case "projectileCount":
          playerState.projectileCountBonus += effectValue;
          break;
        case "damageReduction":
          playerState.damageReduction += effectValue;
          break;
        case "expGain":
          playerState.expGainMult += effectValue;
          break;
        case "cooldown":
          // 쿨다운 감소는 곱셈으로 적용 (예: 0.05 감소 = 0.95 배율)
          playerState.cooldownMult *= 1.0 - effectValue;
          break;
      }
    });

    // HP Max가 변경되었으면 현재 HP도 조정
    if (playerState.hp > playerState.hpMax) {
      playerState.hp = playerState.hpMax;
    }
  }

  // 특정 패시브의 현재 레벨 효과 가져오기
  getPassiveEffectValue(passiveId, level) {
    const passiveData = PASSIVES_DB[passiveId];
    if (!passiveData) return 0;
    if (level < 1 || level > passiveData.maxLevel) return 0;
    return passiveData.levels[level - 1];
  }

  // 패시브 설명 텍스트 생성
  getPassiveDescription(passiveId, level) {
    const passiveData = PASSIVES_DB[passiveId];
    if (!passiveData) return "";

    const currentValue = this.getPassiveEffectValue(passiveId, level);
    const nextValue =
      level < passiveData.maxLevel
        ? this.getPassiveEffectValue(passiveId, level + 1)
        : null;

    let description = "";
    switch (passiveData.effect) {
      case "hpMax":
        description = `HP 최대치 +${currentValue}`;
        if (nextValue !== null)
          description += ` → +${nextValue}`;
        break;
      case "projectileSpeed":
        description = `투사체 속도 +${(currentValue * 100).toFixed(0)}%`;
        if (nextValue !== null)
          description += ` → +${(nextValue * 100).toFixed(0)}%`;
        break;
      case "might":
        description = `피해 +${(currentValue * 100).toFixed(0)}%`;
        if (nextValue !== null)
          description += ` → +${(nextValue * 100).toFixed(0)}%`;
        break;
      case "area":
        description = `공격 범위 +${(currentValue * 100).toFixed(0)}%`;
        if (nextValue !== null)
          description += ` → +${(nextValue * 100).toFixed(0)}%`;
        break;
      case "duration":
        description = `지속 시간 +${(currentValue * 100).toFixed(0)}%`;
        if (nextValue !== null)
          description += ` → +${(nextValue * 100).toFixed(0)}%`;
        break;
      case "luck":
        description = `행운 +${currentValue}`;
        if (nextValue !== null) description += ` → +${nextValue}`;
        break;
      case "hpRegen":
        description = `초당 HP 회복 +${currentValue.toFixed(1)}`;
        if (nextValue !== null)
          description += ` → +${nextValue.toFixed(1)}`;
        break;
      case "pickupRadius":
        description = `획득 반경 +${(currentValue * 100).toFixed(0)}%`;
        if (nextValue !== null)
          description += ` → +${(nextValue * 100).toFixed(0)}%`;
        break;
      case "projectileCount":
        description = `투사체 개수 +${currentValue}`;
        if (nextValue !== null) description += ` → +${nextValue}`;
        break;
      case "damageReduction":
        description = `받는 피해 -${currentValue}`;
        if (nextValue !== null) description += ` → -${nextValue}`;
        break;
      case "expGain":
        description = `경험치 획득 +${(currentValue * 100).toFixed(0)}%`;
        if (nextValue !== null)
          description += ` → +${(nextValue * 100).toFixed(0)}%`;
        break;
      case "cooldown":
        description = `쿨다운 -${(currentValue * 100).toFixed(0)}%`;
        if (nextValue !== null)
          description += ` → -${(nextValue * 100).toFixed(0)}%`;
        break;
    }

    return description;
  }
}

