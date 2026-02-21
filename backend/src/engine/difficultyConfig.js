const DIFFICULTY_CONFIG = {
  easy: {
    hintReveals: 2,
    fuzzyFactor: 0.30,        // 30% tolerance
    scoreDecayMultiplier: 0.8,
    drawerBonusMultiplier: 1.0,
  },
  medium: {
    hintReveals: 1,
    fuzzyFactor: 0.20,        // 20% tolerance
    scoreDecayMultiplier: 1.0,
    drawerBonusMultiplier: 1.2,
  },
  hard: {
    hintReveals: 0,
    fuzzyFactor: 0.10,        // 10% tolerance (still allowed)
    scoreDecayMultiplier: 1.3,
    drawerBonusMultiplier: 1.5,
  },
};

function getDifficultyConfig(level) {
  return DIFFICULTY_CONFIG[level] || DIFFICULTY_CONFIG.medium;
}

module.exports = { getDifficultyConfig };