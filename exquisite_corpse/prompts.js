const HEAD_DESCRIPTORS = [
  'astronaut helmet',
  'crown of flowers',
  'robot visor',
  'pumpkin head',
  'noir detective hat',
  'cloud of bees',
  'vintage TV screen',
];

const TORSO_DESCRIPTORS = [
  'pirate captain coat',
  'ballerina tutu',
  'spaghetti armor',
  'wizard cloak covered in stars',
  'retro spacesuit chest panel',
  'icy crystal corset',
  'steam-powered jetpack',
];

const LEGS_DESCRIPTORS = [
  'octopus tentacles',
  'rollerblade legs',
  'centaur hooves',
  'spring-loaded pogo legs',
  'dragon tail swirl',
  'tap dancing shoes',
  'cloud puff trousers',
];

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function generatePrompt() {
  const head = pickRandom(HEAD_DESCRIPTORS);
  const torso = pickRandom(TORSO_DESCRIPTORS);
  const legs = pickRandom(LEGS_DESCRIPTORS);

  const segments = [
    { label: 'Head', clue: head },
    { label: 'Torso', clue: torso },
    { label: 'Legs', clue: legs },
  ];

  const summary = `${head}, ${torso}, and ${legs}`;

  return {
    segments,
    summary,
  };
}

module.exports = {
  generatePrompt,
};

