// src/engine/scoringEngine.js

const BASE_SCORE = 1000;
const TIME_BONUS_MAX = 500;
const ORDER_PENALTY = 100;
const SCORE_FLOOR = 100;
const DRAWER_BONUS_PER_GUESSER = 75;
const ROUND_DURATION = 60;

/**
 * Score for a guesser.
 * @param {number} timeLeft - seconds remaining when guess was made
 * @param {number} guessOrder - 1-indexed position among correct guessers
 */
function calcGuesserScore(timeLeft, guessOrder) {
  const timeBonus = Math.floor((timeLeft / ROUND_DURATION) * TIME_BONUS_MAX);
  const orderPenalty = (guessOrder - 1) * ORDER_PENALTY;
  return Math.max(SCORE_FLOOR, BASE_SCORE + timeBonus - orderPenalty);
}

/**
 * Score for the drawer at round end.
 * @param {number} correctGuessCount - total players who guessed correctly
 */
function calcDrawerBonus(correctGuessCount) {
  return correctGuessCount * DRAWER_BONUS_PER_GUESSER;
}

/**
 * Build leaderboard sorted array from players object.
 */
function buildLeaderboard(players) {
  return Object.values(players)
    .map((p) => ({ socketId: p.socketId, name: p.name, score: p.score }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // tiebreak: earlier join = higher rank (joinedAt not in snapshot, use name alpha as fallback)
      return a.name.localeCompare(b.name);
    });
}

module.exports = { calcGuesserScore, calcDrawerBonus, buildLeaderboard };
