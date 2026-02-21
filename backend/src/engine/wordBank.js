// src/engine/wordBank.js

// ================= EASY =================
const EASY_WORDS = [
  "cat","dog","car","bus","sun","moon","star","fish","tree","ball",
  "cake","hat","cup","book","shoe","bed","chair","phone","apple","milk",
  "duck","frog","lion","tiger","bear","cloud","rain","snow","leaf","boat",
  "train","cake","gift","drum","bell","flag","ring","kite","sock","lamp",
  "bread","cheese","egg","banana","grape","pizza","rice","soup","fork","spoon",
  "shirt","pants","clock","key","lock","box","coin","pen","pencil","paper"
];

// ================= MEDIUM =================
const MEDIUM_WORDS = [
  "elephant","giraffe","dolphin","kangaroo","penguin","octopus","parrot","flamingo",
  "cheetah","lobster","peacock","jellyfish","hedgehog","squirrel","raccoon",
  "pizza","sushi","burrito","waffle","pretzel","avocado","pineapple","cupcake",
  "popcorn","broccoli","croissant","smoothie","dumpling","nachos",
  "umbrella","telescope","backpack","lantern","compass","hammock","suitcase",
  "megaphone","hourglass","periscope","typewriter","calculator","flashlight",
  "lighthouse","volcano","pyramid","igloo","treehouse","submarine","gondola",
  "skyscraper","waterfall","windmill","canyon","glacier","island","desert",
  "juggling","surfing","painting","skydiving","snorkeling","archery","karate",
  "dancing","gardening","climbing","bowling","knitting","fishing",
  "rainbow","thunderstorm","fireworks","eclipse","tornado","blizzard","meteor"
];

// ================= HARD =================
const HARD_WORDS = [
  "microscope","constellation","archaeology","metamorphosis","philosophy",
  "astronaut","laboratory","algorithm","telescope","galaxy","supernova",
  "quantum","nebula","thermodynamics","photosynthesis","evolution",
  "hologram","cyborg","spaceship","satellite","artificial","intelligence",
  "biotechnology","nanotechnology","cryptography","blockchain",
  "catastrophe","infrastructure","architecture","engineering","mechanism",
  "circumference","hypothesis","equilibrium","transformation",
  "renaissance","civilization","industrialization","urbanization",
  "astronomy","geography","mathematics","chemistry","philosopher",
  "volcanology","meteorology","archipelago","hemisphere","ecosystem",
  "constitutional","representative","bureaucracy","legislation",
  "imagination","perception","consciousness","revolutionary",
  "telecommunication","microprocessor","synchronization",
  "hyperventilation","hallucination","determination",
  "unbelievable","miscommunication","counterintuitive"
];

// Track used words per difficulty
const usedWords = {
  easy: new Set(),
  medium: new Set(),
  hard: new Set()
};

function getBank(level) {
  switch (level) {
    case "easy":
      return EASY_WORDS;
    case "hard":
      return HARD_WORDS;
    default:
      return MEDIUM_WORDS;
  }
}

function getRandomWords(level = "medium", count = 3) {
  const bank = getBank(level);
  const used = usedWords[level];

  const available = bank.filter((w) => !used.has(w));

  if (available.length < count) {
    used.clear();
    return shuffle([...bank]).slice(0, count);
  }

  const selected = shuffle(available).slice(0, count);
  selected.forEach((w) => used.add(w));

  return selected;
}

function buildHintMask(word) {
  return word
    .split('')
    .map((c) => (c === ' ' ? ' ' : '_'))
    .join(' ');
}

function revealHintChar(word, currentHint) {
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

module.exports = {
  getRandomWords,
  buildHintMask,
  revealHintChar,
  shuffle
};