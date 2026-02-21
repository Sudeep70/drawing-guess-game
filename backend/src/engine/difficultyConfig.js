const DIFFICULTY_CONFIG = {
  easy: {
    hintReveals: 2,
    fuzzyDistance: 2,
    scoreDecayMultiplier: 0.8,
    drawerBonusMultiplier: 1.0,
  },
  medium: {
    hintReveals: 1,
    fuzzyDistance: 1,
    scoreDecayMultiplier: 1.0,
    drawerBonusMultiplier: 1.2,
  },
  hard: {
    hintReveals: 0,
    fuzzyDistance: 0,
    scoreDecayMultiplier: 1.3,
    drawerBonusMultiplier: 1.5,
  },
};

function getDifficultyConfig(level) {
  return DIFFICULTY_CONFIG[level] || DIFFICULTY_CONFIG.medium;
}

module.exports = { getDifficultyConfig };