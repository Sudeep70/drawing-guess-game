// src/engine/wordBank.js

const WORDS = [
  // Animals
  'elephant', 'penguin', 'giraffe', 'dolphin', 'kangaroo', 'octopus', 'parrot',
  'flamingo', 'cheetah', 'hamster', 'lobster', 'peacock', 'jellyfish', 'hedgehog',
  // Food & Drink
  'pizza', 'sushi', 'burrito', 'waffle', 'pretzel', 'avocado', 'pineapple',
  'cupcake', 'popcorn', 'broccoli', 'croissant', 'smoothie', 'dumpling', 'nachos',
  // Objects
  'umbrella', 'telescope', 'backpack', 'lantern', 'compass', 'hammock', 'suitcase',
  'megaphone', 'hourglass', 'periscope', 'typewriter', 'calculator', 'flashlight',
  // Places
  'lighthouse', 'volcano', 'pyramid', 'igloo', 'treehouse', 'submarine', 'gondola',
  'skyscraper', 'waterfall', 'colosseum', 'windmill', 'canyon', 'glacier',
  // Actions
  'juggling', 'surfing', 'painting', 'skydiving', 'snorkeling', 'archery', 'karate',
  'dancing', 'gardening', 'climbing', 'bowling', 'knitting', 'fishing',
  // Pop culture
  'rainbow', 'thunderstorm', 'fireworks', 'eclipse', 'tornado', 'blizzard',
  'avalanche', 'hurricane', 'meteor', 'aurora', 'tsunami',
  // Tech & Modern
  'robot', 'rocket', 'satellite', 'drone', 'hologram', 'spaceship', 'cyborg',
  'smartphone', 'headphones', 'keyboard', 'microchip',
  // Fantasy
  'dragon', 'unicorn', 'mermaid', 'wizard', 'phoenix', 'goblin', 'centaur',
  'kraken', 'werewolf', 'vampire', 'golem', 'griffin',
];

const usedWords = new Set();

function getRandomWords(count = 3) {
  const available = WORDS.filter((w) => !usedWords.has(w));
  // Reset if we've used most of the bank
  if (available.length < count) {
    usedWords.clear();
    return shuffle([...WORDS]).slice(0, count);
  }
  const selected = shuffle(available).slice(0, count);
  selected.forEach((w) => usedWords.add(w));
  return selected;
}

function buildHintMask(word) {
  return word
    .split('')
    .map((c) => (c === ' ' ? ' ' : '_'))
    .join(' ');
}

function revealHintChar(word, currentHint) {
  // currentHint is like "_ _ _ _ _" — space-joined chars
  const hintChars = currentHint.split(' ');
  const hidden = [];
  word.split('').forEach((c, i) => {
    if (c !== ' ' && hintChars[i] === '_') hidden.push(i);
  });
  if (hidden.length === 0) return currentHint;
  const idx = hidden[Math.floor(Math.random() * hidden.length)];
  hintChars[idx] = word[idx];
  return hintChars.join(' ');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

module.exports = { getRandomWords, buildHintMask, revealHintChar, shuffle };
