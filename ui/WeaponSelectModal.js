// 초기 무기 선택 모달 UI
import { WEAPONS_DB, PASSIVES_DB, EVOLUTIONS_DB } from "../data/gameData.js";

export class WeaponSelectModal {
  constructor() {
    this.modalElement = null;
    this.onWeaponSelected = null; // 콜백 함수
  }

  // 모달 초기화
  init() {
    this.modalElement = document.getElementById("weaponSelectModal");
    if (!this.modalElement) {
      console.error("WeaponSelectModal: modal element not found");
      return;
    }
  }

  // 모달 표시
  show() {
    if (!this.modalElement) {
      this.init();
    }

    if (!this.modalElement) return;

    // 무기 선택지 생성
    const container = this.modalElement.querySelector(".weapons-container");
    if (!container) return;

    container.innerHTML = "";

    // 무기 3개 랜덤 선택
    const weaponIds = Object.keys(WEAPONS_DB);
    const selectedWeapons = this.selectRandomWeapons(weaponIds, 3);

    selectedWeapons.forEach((weaponId) => {
      const card = this.createWeaponCard(weaponId);
      container.appendChild(card);
    });

    // 모달 표시
    this.modalElement.style.display = "flex";
  }

  // 랜덤 무기 선택
  selectRandomWeapons(weaponIds, count) {
    const shuffled = [...weaponIds].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // 무기 카드 생성
  createWeaponCard(weaponId) {
    const weaponData = WEAPONS_DB[weaponId];
    if (!weaponData) return document.createElement("div");

    const card = document.createElement("div");
    card.className = "weapon-card";
    card.dataset.weaponId = weaponId;

    const level1Data = weaponData.levels[0];
    let description = "";

    // 레벨 1 효과 설명 생성
    if (level1Data.damage !== undefined) {
      description += `피해: ${level1Data.damage}`;
    }
    if (level1Data.dps !== undefined) {
      description += `DPS: ${level1Data.dps}`;
    }
    if (level1Data.cooldown !== undefined) {
      description += `쿨타임: ${level1Data.cooldown}s`;
    }
    if (level1Data.range !== undefined) {
      description += `범위: ${level1Data.range}`;
    }
    if (level1Data.projectileCount !== undefined) {
      description += `발사수: ${level1Data.projectileCount}`;
    }
    if (level1Data.radius !== undefined) {
      description += `반경: ${level1Data.radius}`;
    }

    // 카드 내용
    card.innerHTML = `
      <div class="weapon-header">
        <h3>${weaponData.name}</h3>
      </div>
      <div class="weapon-description">${description}</div>
      <div class="weapon-select-hint">클릭하여 선택</div>
    `;

    // 클릭 이벤트
    card.addEventListener("click", () => {
      this.selectWeapon(weaponId);
    });

    return card;
  }

  // 무기 선택 처리
  selectWeapon(weaponId) {
    if (this.onWeaponSelected) {
      this.onWeaponSelected(weaponId);
    }
    this.hide();
  }

  // 모달 숨기기
  hide() {
    if (this.modalElement) {
      this.modalElement.style.display = "none";
    }
  }

  // 콜백 설정
  setOnWeaponSelected(callback) {
    this.onWeaponSelected = callback;
  }
}
