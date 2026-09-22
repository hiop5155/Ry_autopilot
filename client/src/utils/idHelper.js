// client/src/utils/idHelper.js

const ROC_LETTER_MAP = {
  A: [1, 0], B: [1, 1], C: [1, 2], D: [1, 3], E: [1, 4],
  F: [1, 5], G: [1, 6], H: [1, 7], I: [3, 4], J: [1, 8],
  K: [1, 9], L: [2, 0], M: [2, 1], N: [2, 2], O: [3, 5],
  P: [2, 3], Q: [2, 4], R: [2, 5], S: [2, 6], T: [2, 7],
  U: [2, 8], V: [2, 9], W: [3, 2], X: [3, 0], Y: [3, 1],
  Z: [3, 3]
};

export function validateROCId(raw) {
  if (!raw || typeof raw !== "string") return false;
  const id = raw.trim().toUpperCase();
  if (!/^[A-Z][1289]\d{8}$/.test(id)) return false;

  const letter = id[0];
  const pair = ROC_LETTER_MAP[letter];
  if (!pair) return false;

  const [n1, n2] = pair;
  const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1];
  const digits = [n1, n2, ...id.slice(1).split("").map(Number)];

  const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0);
  return sum % 10 === 0;
}

export function generateROCId() {
  const letters = Object.keys(ROC_LETTER_MAP);
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const genderDigit = Math.random() < 0.5 ? 1 : 2;

  const [n1, n2] = ROC_LETTER_MAP[letter];
  const bodyDigits = [genderDigit];
  for (let i = 0; i < 7; i++) {
    bodyDigits.push(Math.floor(Math.random() * 10));
  }

  const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  const allKnown = [n1, n2, ...bodyDigits];
  const partialSum = allKnown.reduce((acc, d, i) => acc + d * weights[i], 0);
  const checkDigit = (10 - (partialSum % 10)) % 10;

  return `${letter}${bodyDigits.join("")}${checkDigit}`;
}
