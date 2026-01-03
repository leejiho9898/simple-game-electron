// 진화 시스템
import { EVOLUTIONS_DB, WEAPONS_DB } from "../data/gameData.js";

export class EvolutionSystem {
  constructor() {
    // 진화 조건 확인 및 실행
  }

  // 진화 가능한 무기/패시브 조합 확인
  checkEvolutionEligibility(gameState) {
    const eligible = [];

    gameState.inventory.weapons.forEach((weapon) => {
      const weaponData = WEAPONS_DB[weapon.id];
      if (!weaponData || !weaponData.evolution) return;

      // 무기가 레벨 5인지 확인
      if (weapon.level < 5) return;

      const evolution = weaponData.evolution;
      const requiredPassive = gameState.inventory.getPassive(
        evolution.requiredPassive
      );

      // 필요한 패시브가 있고 레벨이 충족되는지 확인
      if (
        requiredPassive &&
        requiredPassive.level >= evolution.requiredPassiveLevel
      ) {
        eligible.push({
          weaponId: weapon.id,
          evoWeaponId: evolution.weaponId,
          recipeId: `${weapon.id}_${evolution.requiredPassive}`,
          weaponName: weaponData.name,
          evolutionName: EVOLUTIONS_DB[evolution.weaponId]?.name || "Unknown",
        });
      }
    });

    return eligible;
  }

  // 진화 실행
  triggerEvolution(gameState, evolutionInfo) {
    // 기존 무기를 진화 무기로 교체
    const success = gameState.inventory.replaceWeapon(
      evolutionInfo.weaponId,
      evolutionInfo.evoWeaponId
    );

    if (success) {
      // 진화 성공
      return true;
    }

    return false;
  }

  // ChestOpen 이벤트에서 진화 처리
  processChestEvolution(gameState) {
    const eligible = this.checkEvolutionEligibility(gameState);

    if (eligible.length === 0) {
      return null; // 진화 불가
    }

    // 우선순위: 먼저 만렙 달성한 무기 (여러 개면 랜덤)
    // 간단하게 첫 번째 진화 가능한 것 선택
    const selected = eligible[0];

    // 진화 실행
    if (this.triggerEvolution(gameState, selected)) {
      return selected;
    }

    return null;
  }

  // 진화 정보 가져오기
  getEvolutionInfo(evoWeaponId) {
    return EVOLUTIONS_DB[evoWeaponId] || null;
  }

  // 무기가 진화 가능한지 확인 (UI 힌트용)
  canEvolveWeapon(weaponId, gameState) {
    const weapon = gameState.inventory.getWeapon(weaponId);
    if (!weapon) return false;

    const weaponData = WEAPONS_DB[weaponId];
    if (!weaponData || !weaponData.evolution) return false;

    if (weapon.level < 5) return false;

    const evolution = weaponData.evolution;
    const requiredPassive = gameState.inventory.getPassive(
      evolution.requiredPassive
    );

    return (
      requiredPassive &&
      requiredPassive.level >= evolution.requiredPassiveLevel
    );
  }

  // 진화 설명 텍스트
  getEvolutionDescription(evolutionInfo) {
    const evoData = EVOLUTIONS_DB[evolutionInfo.evoWeaponId];
    if (!evoData) return "";

    return `${evolutionInfo.weaponName} → ${evolutionInfo.evolutionName}\n${evoData.description}`;
  }
}

