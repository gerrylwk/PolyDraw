const COLORS = [
  'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'cyan',
  'amber', 'lime', 'teal', 'indigo', 'rose', 'emerald', 'sky', 'violet'
];

const MOODS = [
  'happy', 'calm', 'swift', 'brave', 'quiet', 'wild', 'gentle', 'bold',
  'bright', 'cool', 'warm', 'quick', 'silent', 'eager', 'keen', 'smart'
];

const ANIMALS = [
  'pigeon', 'falcon', 'tiger', 'wolf', 'bear', 'eagle', 'lion', 'fox',
  'hawk', 'otter', 'panda', 'owl', 'crow', 'deer', 'lynx', 'seal'
];

export function generateRandomName(): string {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const mood = MOODS[Math.floor(Math.random() * MOODS.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${color}-${mood}-${animal}`;
}

export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
