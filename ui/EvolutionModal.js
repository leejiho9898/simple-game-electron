// 진화 모달 UI
import { EvolutionSystem } from "../systems/EvolutionSystem.js";

export class EvolutionModal {
  constructor() {
    this.modalElement = null;
    this.evolutionSystem = new EvolutionSystem();
    this.onEvolutionConfirmed = null; // 콜백 함수
    this.currentEvolution = null;
    this.isConfirming = false; // 중복 확인 방지
  }

  // 모달 초기화
  init() {
    this.modalElement = document.getElementById("evolutionModal");
    if (!this.modalElement) {
      console.error("EvolutionModal: modal element not found");
      return;
    }

    // 확인 버튼
    const confirmBtn = this.modalElement.querySelector(".confirm-btn");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        this.confirmEvolution();
      });
    }

    // 취소 버튼 (선택사항)
    const cancelBtn = this.modalElement.querySelector(".cancel-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.hide();
      });
    }

    // 콘텐츠 자체를 클릭해도 확인되도록 처리 (사용자 경험 개선)
    const content = this.modalElement.querySelector(".evolution-content");
    if (content) {
      content.addEventListener("click", () => {
        this.confirmEvolution();
      });
    }
  }

  // 모달 표시
  show(evolutionInfo, gameState) {
    if (!this.modalElement) {
      this.init();
    }

    if (!this.modalElement) return;

    this.currentEvolution = evolutionInfo;
    this.isConfirming = false;

    // 진화 정보 표시
    const title = this.modalElement.querySelector(".evolution-title");
    const description = this.modalElement.querySelector(".evolution-description");
    const beforeWeapon = this.modalElement.querySelector(".before-weapon");
    const afterWeapon = this.modalElement.querySelector(".after-weapon");

    if (title) {
      title.textContent = "진화 발생!";
    }

    if (description) {
      const desc = this.evolutionSystem.getEvolutionDescription(evolutionInfo);
      description.textContent = desc;
    }

    if (beforeWeapon) {
      const weaponData = gameState.inventory.getWeapon(evolutionInfo.weaponId);
      beforeWeapon.textContent = weaponData
        ? `기존: ${evolutionInfo.weaponName} (Lv.${weaponData.level})`
        : `기존: ${evolutionInfo.weaponName}`;
    }

    if (afterWeapon) {
      afterWeapon.textContent = `진화: ${evolutionInfo.evolutionName}`;
    }

    // 모달 표시
    this.modalElement.style.display = "flex";
  }

  // 진화 확인
  confirmEvolution() {
    if (this.isConfirming) return;
    if (this.onEvolutionConfirmed && this.currentEvolution) {
      this.isConfirming = true;
      this.onEvolutionConfirmed(this.currentEvolution);
    }
    this.hide();
  }

  // 모달 숨기기
  hide() {
    if (this.modalElement) {
      this.modalElement.style.display = "none";
    }
    this.currentEvolution = null;
  }

  // 콜백 설정
  setOnEvolutionConfirmed(callback) {
    this.onEvolutionConfirmed = callback;
  }
}

