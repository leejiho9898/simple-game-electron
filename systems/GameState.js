// 게임 상태 관리 시스템

export class RunState {
  constructor() {
    this.runId = this.generateRunId();
    this.seed = Math.floor(Math.random() * 1000000);
    this.timeMs = 0;
    this.difficulty = 1;
    this.gold = 0;
    this.pausedReason = "NONE"; // 'NONE' | 'LEVEL_UP' | 'CHEST' | 'MENU'
    this.rerollTokens = 0;
  }

  generateRunId() {
    return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  isPaused() {
    return this.pausedReason !== "NONE";
  }
}

export class PlayerState {
  constructor() {
    this.level = 1;
    this.exp = 0;
    this.expToNext = 100;
    this.hp = 100;
    this.hpMax = 100;
    this.moveSpeed = 3;
    this.pickupRadius = 1.0;
    this.luck = 0;
    this.cooldownMult = 1.0; // 기본 1.0, 낮을수록 빠름
    this.projectileSpeedMult = 1.0;
    this.projectileCountBonus = 0;
    this.mightMult = 1.0; // 피해 배율
    this.durationMult = 1.0;
    this.areaMult = 1.0;
    this.hpRegen = 0; // 초당 회복
    this.damageReduction = 0; // 받는 피해 감소
    this.expGainMult = 170.0; // 경험치 획득 배율
  }

  calcNextExp(level) {
    // 레벨에 따른 필요 경험치 계산
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }
}

export class InventoryState {
  constructor() {
    this.weapons = []; // Array<{ id: string; level: number }>
    this.passives = []; // Array<{ id: string; level: number }>
    this.weaponSlotsMax = 3; // 최대 무기 3개
    this.passiveSlotsMax = 3; // 최대 패시브 3개
  }

  hasWeapon(weaponId) {
    return this.weapons.some((w) => w.id === weaponId);
  }

  getWeapon(weaponId) {
    return this.weapons.find((w) => w.id === weaponId);
  }

  hasPassive(passiveId) {
    return this.passives.some((p) => p.id === passiveId);
  }

  getPassive(passiveId) {
    return this.passives.find((p) => p.id === passiveId);
  }

  canAddWeapon() {
    return this.weapons.length < this.weaponSlotsMax;
  }

  canAddPassive() {
    return this.passives.length < this.passiveSlotsMax;
  }

  addWeapon(weaponId) {
    if (!this.canAddWeapon()) return false;
    if (this.hasWeapon(weaponId)) return false;
    this.weapons.push({ id: weaponId, level: 1 });
    return true;
  }

  levelUpWeapon(weaponId) {
    const weapon = this.getWeapon(weaponId);
    if (!weapon) return false;
    // maxLevel 체크는 외부에서
    weapon.level++;
    return true;
  }

  addPassive(passiveId) {
    if (!this.canAddPassive()) return false;
    if (this.hasPassive(passiveId)) return false;
    this.passives.push({ id: passiveId, level: 1 });
    return true;
  }

  levelUpPassive(passiveId) {
    const passive = this.getPassive(passiveId);
    if (!passive) return false;
    // maxLevel 체크는 외부에서
    passive.level++;
    return true;
  }

  removeWeapon(weaponId) {
    const index = this.weapons.findIndex((w) => w.id === weaponId);
    if (index >= 0) {
      this.weapons.splice(index, 1);
      return true;
    }
    return false;
  }

  replaceWeapon(oldWeaponId, newWeaponId) {
    const index = this.weapons.findIndex((w) => w.id === oldWeaponId);
    if (index >= 0) {
      this.weapons[index] = { id: newWeaponId, level: 1 }; // 진화 무기는 레벨 1
      return true;
    }
    return false;
  }
}

export class ChoiceState {
  constructor() {
    this.pendingChoices = null; // LevelUpChoice[] | null
    this.lastChoices = []; // 디버그/리롤용
  }
}

export class ChestState {
  constructor() {
    this.pendingChest = null; // { source: 'ELITE'|'BOSS'|'EVENT'; rollCount: number } | null
  }

  openChest(source = "ELITE") {
    this.pendingChest = {
      source: source,
      rollCount: 1,
    };
  }

  clear() {
    this.pendingChest = null;
  }
}

// 통합 게임 상태
export class GameState {
  constructor() {
    this.run = new RunState();
    this.player = new PlayerState();
    this.inventory = new InventoryState();
    this.choice = new ChoiceState();
    this.chest = new ChestState();
  }

  reset() {
    this.run = new RunState();
    this.player = new PlayerState();
    this.inventory = new InventoryState();
    this.choice = new ChoiceState();
    this.chest = new ChestState();
  }
}
