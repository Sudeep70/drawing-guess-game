// src/utils/normalize.js
// Normalize guesses to allow minor typos/casing differences.

function normalizeGuess(str) {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')                    // decompose accents
    .replace(/[\u0300-\u036f]/g, '')     // strip accent marks
    .replace(/[^a-z0-9\s]/g, '')        // remove punctuation
    .replace(/\s+/g, ' ');              // collapse whitespace
}

function isCorrectGuess(guess, word) {
  return normalizeGuess(guess) === normalizeGuess(word);
}

module.exports = { normalizeGuess, isCorrectGuess };
