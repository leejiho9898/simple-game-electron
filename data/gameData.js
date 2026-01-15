// 게임 데이터베이스
// 무기 12개, 패시브 12개, 진화 12개

export const WEAPONS_DB = {
  w_whip: {
    id: "w_whip",
    name: "채찍",
    maxLevel: 5,
    tags: ["melee"],
    levels: [
      { damage: 10, cooldown: 1.2, range: 1.0 },
      { damage: 13, cooldown: 1.0, range: 1.1 },
      { damage: 16, cooldown: 1.0, range: 1.2 },
      { damage: 20, cooldown: 0.9, range: 1.3 },
      { damage: 25, cooldown: 0.5, range: 1.4 },
    ],
    evolution: {
      weaponId: "w_bloodyTear",
      requiredPassive: "p_hollowHeart",
      requiredPassiveLevel: 3,
    },
  },
  w_knife: {
    id: "w_knife",
    name: "단검",
    maxLevel: 5,
    tags: ["projectile"],
    levels: [
      { damage: 8, projectileCount: 1, cooldown: 1.5 },
      { damage: 10, projectileCount: 1, cooldown: 1.4 },
      { damage: 10, projectileCount: 2, cooldown: 1.3 },
      { damage: 13, projectileCount: 2, cooldown: 1.2 },
      { damage: 14, projectileCount: 3, cooldown: 0.8 },
    ],
    evolution: {
      weaponId: "w_thousandEdge",
      requiredPassive: "p_bracer",
      requiredPassiveLevel: 3,
    },
  },
  w_homingMissile: {
    id: "w_homingMissile",
    name: "유도탄",
    maxLevel: 5,
    tags: ["projectile", "homing"],
    levels: [
      { damage: 10, projectileCount: 1, cooldown: 2.5 },
      { damage: 12, projectileCount: 1, cooldown: 2.3 },
      { damage: 12, projectileCount: 2, cooldown: 2.1 },
      { damage: 15, projectileCount: 2, cooldown: 1.9 },
      { damage: 18, projectileCount: 3, cooldown: 1.5 },
    ],
    evolution: {
      weaponId: "w_advancedMissile",
      requiredPassive: "p_bracer",
      requiredPassiveLevel: 3,
    },
  },
  w_magicWand: {
    id: "w_magicWand",
    name: "마법 지팡이",
    maxLevel: 5,
    tags: ["projectile", "auto-aim"],
    levels: [
      { damage: 7, projectileCount: 1, cooldown: 2.5 },
      { damage: 9, projectileCount: 1, cooldown: 2.3 },
      { damage: 9, projectileCount: 2, cooldown: 2.1 },
      { damage: 12, projectileCount: 2, cooldown: 1.9 },
      { damage: 12, projectileCount: 3, cooldown: 1.5 },
    ],
    evolution: {
      weaponId: "w_holyWand",
      requiredPassive: "p_spellbinder",
      requiredPassiveLevel: 3,
    },
  },
  w_garlic: {
    id: "w_garlic",
    name: "마늘 오라",
    maxLevel: 5,
    tags: ["aura", "melee"],
    levels: [
      { dps: 6, radius: 1.0 },
      { dps: 8, radius: 1.15 },
      { dps: 8, radius: 1.3 },
      { dps: 11, radius: 1.4 },
      { dps: 11, radius: 1.9 },
    ],
    evolution: {
      weaponId: "w_soulEater",
      requiredPassive: "p_pummarola",
      requiredPassiveLevel: 3,
    },
  },
  w_santaWater: {
    id: "w_santaWater",
    name: "성수",
    maxLevel: 5,
    tags: ["ground", "aoe"],
    levels: [
      { dps: 10, duration: 1.0, area: 1.0, cooldown: 2.5 },
      { dps: 12, duration: 2.0, area: 1.0, cooldown: 2.3 },
      { dps: 12, duration: 2.0, area: 1.1, cooldown: 2.1 },
      { dps: 12, duration: 2.2, area: 1.15, cooldown: 1.9 },
      { dps: 15, duration: 2.5, area: 1.25, cooldown: 1.5 },
    ],
    evolution: {
      weaponId: "w_laBorra",
      requiredPassive: "p_attractorb",
      requiredPassiveLevel: 3,
    },
  },
  w_kingBible: {
    id: "w_kingBible",
    name: "왕의 성경",
    maxLevel: 5,
    tags: ["orbital", "defense"],
    levels: [
      { dps: 12, count: 1, duration: 1.0 },
      { dps: 14, count: 2, duration: 1.0 },
      { dps: 14, count: 2, duration: 1.2 },
      { dps: 17, count: 3, duration: 1.2 },
      { dps: 19, count: 4, duration: 1.2, cooldownMult: 0.9 },
    ],
    evolution: {
      weaponId: "w_unchainedSpirits",
      requiredPassive: "p_spellbinder",
      requiredPassiveLevel: 3,
    },
  },
  w_lightningRing: {
    id: "w_lightningRing",
    name: "번개 반지",
    maxLevel: 5,
    tags: ["aoe", "random"],
    levels: [
      { damage: 14, boltCount: 1, cooldown: 1.0 },
      { damage: 17, boltCount: 1, cooldown: 0.9 },
      { damage: 17, boltCount: 2, cooldown: 0.8 },
      { damage: 21, boltCount: 2, cooldown: 0.7 },
      { damage: 21, boltCount: 3, cooldown: 0.6 },
    ],
    evolution: {
      weaponId: "w_thunderLoop",
      requiredPassive: "p_duplicator",
      requiredPassiveLevel: 3,
    },
  },
  w_fireWand: {
    id: "w_fireWand",
    name: "화염 지팡이",
    maxLevel: 5,
    tags: ["projectile", "explosive"],
    levels: [
      { damage: 10, projectileCount: 1, explosionRadius: 1.0, cooldown: 2.5 },
      { damage: 13, projectileCount: 1, explosionRadius: 1.0, cooldown: 2.3 },
      { damage: 13, projectileCount: 1, explosionRadius: 1.15, cooldown: 2.1 },
      { damage: 13, projectileCount: 2, explosionRadius: 1.15, cooldown: 1.9 },
      { damage: 17, projectileCount: 2, explosionRadius: 1.15, cooldown: 1.5 },
    ],
    evolution: {
      weaponId: "w_hellfire",
      requiredPassive: "p_spinach",
      requiredPassiveLevel: 3,
    },
  },
  w_runetracer: {
    id: "w_runetracer",
    name: "룬 추적자",
    maxLevel: 5,
    tags: ["projectile", "bounce"],
    levels: [
      { damage: 9, bounceCount: 2, duration: 1.0 },
      { damage: 11, bounceCount: 2, duration: 1.0 },
      { damage: 11, bounceCount: 3, duration: 1.0 },
      { damage: 11, bounceCount: 3, duration: 1.2 },
      { damage: 14, bounceCount: 3, duration: 1.2 },
    ],
    evolution: {
      weaponId: "w_noFuture",
      requiredPassive: "p_armor",
      requiredPassiveLevel: 3,
    },
  },
};

export const PASSIVES_DB = {
  p_hollowHeart: {
    id: "p_hollowHeart",
    name: "빈 심장",
    maxLevel: 5,
    effect: "hpMax",
    levels: [10, 20, 30, 40, 50],
  },
  p_bracer: {
    id: "p_bracer",
    name: "팔찌",
    maxLevel: 5,
    effect: "projectileSpeed",
    levels: [0.1, 0.2, 0.3, 0.4, 0.5], // +10%, +20%, etc.
  },
  p_spinach: {
    id: "p_spinach",
    name: "시금치",
    maxLevel: 5,
    effect: "might",
    levels: [0.05, 0.1, 0.15, 0.2, 0.25], // +5%, +10%, etc.
  },
  p_candelabrador: {
    id: "p_candelabrador",
    name: "촛대",
    maxLevel: 5,
    effect: "area",
    levels: [0.05, 0.1, 0.15, 0.2, 0.25], // +5%, +10%, etc.
  },
  p_spellbinder: {
    id: "p_spellbinder",
    name: "주문 결속자",
    maxLevel: 5,
    effect: "duration",
    levels: [0.05, 0.1, 0.15, 0.2, 0.25], // +5%, +10%, etc.
  },
  p_clover: {
    id: "p_clover",
    name: "네잎클로버",
    maxLevel: 5,
    effect: "luck",
    levels: [5, 10, 15, 20, 25],
  },
  p_pummarola: {
    id: "p_pummarola",
    name: "토마토",
    maxLevel: 5,
    effect: "hpRegen",
    levels: [0.1, 0.2, 0.3, 0.4, 0.5],
  },
  p_attractorb: {
    id: "p_attractorb",
    name: "자석 구슬",
    maxLevel: 5,
    effect: "pickupRadius",
    levels: [0.1, 0.2, 0.3, 0.4, 0.5], // +10%, +20%, etc.
  },
  p_duplicator: {
    id: "p_duplicator",
    name: "복제기",
    maxLevel: 5,
    effect: "projectileCount",
    levels: [0, 1, 1, 2, 2], // Lv2부터 의미 있게
  },
  p_armor: {
    id: "p_armor",
    name: "갑옷",
    maxLevel: 5,
    effect: "damageReduction",
    levels: [1, 2, 3, 4, 5], // 받는 피해 감소
  },
  p_crown: {
    id: "p_crown",
    name: "왕관",
    maxLevel: 5,
    effect: "expGain",
    levels: [0.05, 0.1, 0.15, 0.2, 0.25], // +5%, +10%, etc.
  },
  p_emptyTome: {
    id: "p_emptyTome",
    name: "빈 책",
    maxLevel: 5,
    effect: "cooldown",
    levels: [0.05, 0.1, 0.15, 0.2, 0.25], // -5%, -10%, etc. (쿨다운 감소)
  },
};

export const EVOLUTIONS_DB = {
  w_bloodyTear: {
    id: "w_bloodyTear",
    name: "피눈물",
    baseWeapon: "w_whip",
    requiredPassive: "p_hollowHeart",
    requiredPassiveLevel: 3,
    description: "Whip 강화 + 흡혈 효과",
    // 진화 무기는 고정 레벨 1
    stats: {
      damage: 30,
      cooldown: 1.0,
      range: 1.3,
      lifesteal: 0.1, // 적 처치/히트 시 HP 회복
    },
  },
  w_thousandEdge: {
    id: "w_thousandEdge",
    name: "천검",
    baseWeapon: "w_knife",
    requiredPassive: "p_bracer",
    requiredPassiveLevel: 3,
    description: "Knife 강화 + 극단적 연사",
    stats: {
      damage: 15,
      projectileCount: 5,
      cooldown: 0.5,
    },
  },
  w_advancedMissile: {
    id: "w_advancedMissile",
    name: "고급 유도탄",
    baseWeapon: "w_homingMissile",
    requiredPassive: "p_bracer",
    requiredPassiveLevel: 3,
    description: "유도탄 강화 + 빠른 추적 속도",
    stats: {
      damage: 18,
      projectileCount: 2,
      cooldown: 1.5,
      turnSpeed: 6.0,
    },
  },
  w_holyWand: {
    id: "w_holyWand",
    name: "성스러운 지팡이",
    baseWeapon: "w_magicWand",
    requiredPassive: "p_spellbinder",
    requiredPassiveLevel: 3,
    description: "Magic Wand 강화 + 쿨다운 대폭 감소",
    stats: {
      damage: 15,
      projectileCount: 4,
      cooldown: 0.5,
    },
  },
  w_soulEater: {
    id: "w_soulEater",
    name: "영혼 포식자",
    baseWeapon: "w_garlic",
    requiredPassive: "p_pummarola",
    requiredPassiveLevel: 3,
    description: "Garlic 강화 + 피해량 비례 회복",
    stats: {
      dps: 15,
      radius: 1.4,
      lifesteal: 0.15,
    },
  },
  w_laBorra: {
    id: "w_laBorra",
    name: "라 보라",
    baseWeapon: "w_santaWater",
    requiredPassive: "p_attractorb",
    requiredPassiveLevel: 3,
    description: "Santa Water 강화 + 이동하며 적 추적",
    stats: {
      dps: 18,
      duration: 3.0,
      area: 1.3,
      tracking: true,
    },
  },
  w_unchainedSpirits: {
    id: "w_unchainedSpirits",
    name: "해방된 영혼",
    baseWeapon: "w_kingBible",
    requiredPassive: "p_spellbinder",
    requiredPassiveLevel: 3,
    description: "Bible 강화 + 상시 보호",
    stats: {
      dps: 10,
      count: 5,
      duration: 1.5,
      cooldownMult: 0.7,
    },
  },
  w_thunderLoop: {
    id: "w_thunderLoop",
    name: "천둥 고리",
    baseWeapon: "w_lightningRing",
    requiredPassive: "p_duplicator",
    requiredPassiveLevel: 3,
    description: "Lightning 강화 + 낙뢰 횟수/연쇄 강화",
    stats: {
      damage: 25,
      boltCount: 5,
      chainCount: 3,
    },
  },
  w_hellfire: {
    id: "w_hellfire",
    name: "지옥불",
    baseWeapon: "w_fireWand",
    requiredPassive: "p_spinach",
    requiredPassiveLevel: 3,
    description: "Fire Wand 강화 + 폭발 다발/관통",
    stats: {
      damage: 20,
      projectileCount: 4,
      explosionRadius: 1.3,
      pierce: 2,
    },
  },
  w_noFuture: {
    id: "w_noFuture",
    name: "미래 없음",
    baseWeapon: "w_runetracer",
    requiredPassive: "p_armor",
    requiredPassiveLevel: 3,
    description: "Runetracer 강화 + 바운스/폭발 복합",
    stats: {
      damage: 15,
      bounceCount: 5,
      duration: 1.5,
      explosionOnBounce: true,
    },
  },
};

// 진화 조회 헬퍼 함수
export function getEvolutionByWeapon(weaponId) {
  for (const evoId in EVOLUTIONS_DB) {
    const evo = EVOLUTIONS_DB[evoId];
    if (evo.baseWeapon === weaponId) {
      return evo;
    }
  }
  return null;
}

// 무기/패시브 조회 헬퍼
export function getWeapon(id) {
  return WEAPONS_DB[id] || null;
}

export function getPassive(id) {
  return PASSIVES_DB[id] || null;
}

export function getEvolution(id) {
  return EVOLUTIONS_DB[id] || null;
}
