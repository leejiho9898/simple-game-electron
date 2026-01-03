// 레벨업 모달 UI
import { LevelUpSystem } from "../systems/LevelUpSystem.js";
import { WEAPONS_DB, PASSIVES_DB, EVOLUTIONS_DB } from "../data/gameData.js";

export class LevelUpModal {
  constructor() {
    this.modalElement = null;
    this.levelUpSystem = new LevelUpSystem();
    this.onChoiceSelected = null; // 콜백 함수
  }

  // 모달 초기화
  init() {
    this.modalElement = document.getElementById("levelUpModal");
    if (!this.modalElement) {
      console.error("LevelUpModal: modal element not found");
      return;
    }

    // 선택지 카드 클릭 이벤트
    const cards = this.modalElement.querySelectorAll(".choice-card");
    cards.forEach((card, index) => {
      card.addEventListener("click", () => {
        this.selectChoice(index);
      });
    });
  }

  // 모달 표시
  show(choices, gameState) {
    if (!this.modalElement) {
      this.init();
    }

    if (!this.modalElement) return;

    // 선택지 카드 업데이트
    const container = this.modalElement.querySelector(".choices-container");
    if (!container) return;

    container.innerHTML = "";

    choices.forEach((choice, index) => {
      const card = this.createChoiceCard(choice, gameState, index);
      container.appendChild(card);
    });

    // 모달 표시
    this.modalElement.style.display = "flex";
  }

  // 선택지 카드 생성
  createChoiceCard(choice, gameState, index) {
    const card = document.createElement("div");
    card.className = "choice-card";
    card.dataset.index = index;

    const details = this.levelUpSystem.getChoiceDetails(choice, gameState);
    if (!details) return card;

    // 진화 정보 가져오기 (패시브인 경우)
    let evolutionInfo = "";
    if (
      (choice.kind === "PASSIVE_ADD" || choice.kind === "PASSIVE_LEVEL_UP") &&
      details.name
    ) {
      const passiveId = choice.id;
      // 이 패시브를 필요로 하는 진화 찾기
      for (const evoId in EVOLUTIONS_DB) {
        const evolution = EVOLUTIONS_DB[evoId];
        if (evolution.requiredPassive === passiveId) {
          const baseWeapon = WEAPONS_DB[evolution.baseWeapon];
          if (baseWeapon) {
            evolutionInfo = `
              <div class="evolution-info">
                <div class="evolution-title">진화 가능</div>
                <div class="evolution-weapon">${baseWeapon.name} Lv.5 + 이 패시브 Lv.${evolution.requiredPassiveLevel}+</div>
                <div class="evolution-result">→ ${evolution.name}</div>
              </div>
            `;
            break; // 첫 번째 진화만 표시
          }
        }
      }
    }

    // 카드 내용
    card.innerHTML = `
      <div class="choice-header">
        <h3>${details.name}</h3>
        <span class="choice-type">${details.type}</span>
      </div>
      ${
        details.currentLevel !== undefined
          ? `<div class="choice-level">레벨 ${details.currentLevel || 0}/${
              details.maxLevel
            } → ${details.nextLevel}</div>`
          : ""
      }
      <div class="choice-description">${details.description}</div>
      ${evolutionInfo}
      <div class="choice-select-hint">클릭하여 선택</div>
    `;

    // 클릭 이벤트
    card.addEventListener("click", () => {
      this.selectChoice(index);
    });

    return card;
  }

  // 선택 처리
  selectChoice(index) {
    if (this.onChoiceSelected) {
      this.onChoiceSelected(index);
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
  setOnChoiceSelected(callback) {
    this.onChoiceSelected = callback;
  }
}

