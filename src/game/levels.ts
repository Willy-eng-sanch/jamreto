import { LevelData } from './types.ts';

export const LEVELS: LevelData[] = [
  // LEVEL 1: El Primer Trazo
  {
    id: 1,
    title: 'Página 1: El Primer Trazo',
    subtitle: 'Pantalla Dividida: Lo que tú no ves, tu compañero sí lo ve',
    description: 'Arriba: Stickman Negro en mundo blanco. Abajo: Stickman Blanco en mundo negro. Pulsa [SHIFT] para intercambiar las mitades y alternar el control.',
    width: 960,
    height: 540,
    spawn: { x: 80, y: 380, initialDimension: 'WHITE' },
    goal: { id: 'g1', x: 860, y: 360, w: 40, h: 60, label: 'SELLO 10/10' },
    platforms: [
      { id: 'p1_1', x: 40, y: 440, w: 300, h: 50, physicalIn: 'BOTH', label: 'Tinta base' },
      { id: 'p1_2', x: 460, y: 440, w: 190, h: 50, physicalIn: 'BOTH' },
      { id: 'p1_3', x: 730, y: 440, w: 210, h: 50, physicalIn: 'BOTH' },
      { id: 'p1_4', x: 840, y: 410, w: 100, h: 30, physicalIn: 'BOTH' }
    ],
    spikes: [
      // Spikes in the first gap: physical in WHITE (invisible to Black stickman; visible to White stickman below!)
      { id: 's1_1', x: 360, y: 490, w: 40, h: 30, physicalIn: 'WHITE' },
      { id: 's1_2', x: 405, y: 490, w: 40, h: 30, physicalIn: 'WHITE' },
      // Spikes on middle island: physical in BLACK (invisible to White stickman; visible to Black stickman above!)
      { id: 's1_b1', x: 530, y: 415, w: 45, h: 25, physicalIn: 'BLACK' },
      // Spikes on the second gap: physical in WHITE
      { id: 's1_3', x: 670, y: 490, w: 45, h: 30, physicalIn: 'WHITE' }
    ],
    erasers: [],
    inkDrops: [],
    stars: [
      { id: 'star1_1', x: 400, y: 360, w: 24, h: 24, dimension: 'WHITE', collected: false },
      { id: 'star1_2', x: 550, y: 360, w: 24, h: 24, dimension: 'ANY', collected: false }
    ]
  },

  // LEVEL 2: El Salto de Fe & Trazos de Ayuda
  {
    id: 2,
    title: 'Página 2: Trazos Cruzados',
    subtitle: 'Dibuja con el ratón o dedo para tender puentes a tu compañero',
    description: 'Tu trazo es invisible en tu propio mundo, pero en el mundo del otro se convierte en un puente sólido de tiza o grafito.',
    width: 1000,
    height: 560,
    spawn: { x: 80, y: 160, initialDimension: 'WHITE' },
    goal: { id: 'g2', x: 900, y: 440, w: 40, h: 60, label: 'APROBADO' },
    platforms: [
      { id: 'p2_1', x: 40, y: 220, w: 220, h: 30, physicalIn: 'BOTH' },
      { id: 'p2_2', x: 320, y: 440, w: 220, h: 30, physicalIn: 'BOTH' },
      { id: 'p2_3', x: 580, y: 370, w: 180, h: 30, physicalIn: 'BOTH' },
      { id: 'p2_4', x: 820, y: 500, w: 160, h: 40, physicalIn: 'BOTH' }
    ],
    spikes: [
      { id: 's2_1', x: 250, y: 530, w: 65, h: 30, physicalIn: 'WHITE' },
      { id: 's2_2', x: 535, y: 530, w: 50, h: 30, physicalIn: 'BLACK' },
      { id: 's2_3', x: 760, y: 530, w: 55, h: 30, physicalIn: 'WHITE' }
    ],
    erasers: [],
    inkDrops: [],
    stars: [
      { id: 'star2_1', x: 420, y: 370, w: 24, h: 24, dimension: 'BLACK', collected: false },
      { id: 'star2_2', x: 670, y: 300, w: 24, h: 24, dimension: 'WHITE', collected: false }
    ]
  },

  // LEVEL 3: La Escalera Intermitente
  {
    id: 3,
    title: 'Página 3: La Escalera Intermitente',
    subtitle: 'Ascenso coordinado: doble salto y puentes cooperativos',
    description: 'Escalones suspendidos sobre un foso de púas. Mira la otra pantalla para esquivar las trampas camufladas en tu propio mundo.',
    width: 960,
    height: 600,
    spawn: { x: 80, y: 500, initialDimension: 'WHITE' },
    goal: { id: 'g3', x: 820, y: 150, w: 40, h: 60, label: 'DESTINO' },
    platforms: [
      { id: 'p3_0', x: 40, y: 560, w: 200, h: 30, physicalIn: 'BOTH' },
      { id: 'p3_1', x: 260, y: 480, w: 120, h: 24, physicalIn: 'BOTH' },
      { id: 'p3_2', x: 400, y: 410, w: 120, h: 24, physicalIn: 'BOTH' },
      { id: 'p3_3', x: 270, y: 330, w: 120, h: 24, physicalIn: 'BOTH' },
      { id: 'p3_4', x: 410, y: 250, w: 120, h: 24, physicalIn: 'BOTH' },
      { id: 'p3_5', x: 560, y: 190, w: 140, h: 24, physicalIn: 'BOTH' },
      { id: 'p3_top', x: 750, y: 210, w: 160, h: 30, physicalIn: 'BOTH' }
    ],
    spikes: [
      { id: 's3_1', x: 240, y: 575, w: 120, h: 25, physicalIn: 'WHITE' },
      { id: 's3_2', x: 380, y: 575, w: 120, h: 25, physicalIn: 'BLACK' },
      { id: 's3_3', x: 520, y: 575, w: 120, h: 25, physicalIn: 'WHITE' },
      // Sneaky spike on step 3 for Black stickman (visible to White stickman)
      { id: 's3_4', x: 300, y: 306, w: 35, h: 24, physicalIn: 'WHITE' },
      // Sneaky spike on step 4 for White stickman (visible to Black stickman)
      { id: 's3_5', x: 440, y: 226, w: 35, h: 24, physicalIn: 'BLACK' }
    ],
    erasers: [],
    inkDrops: [],
    stars: [
      { id: 'star3_1', x: 320, y: 290, w: 24, h: 24, dimension: 'WHITE', collected: false },
      { id: 'star3_2', x: 450, y: 210, w: 24, h: 24, dimension: 'BLACK', collected: false },
      { id: 'star3_3', x: 620, y: 140, w: 24, h: 24, dimension: 'ANY', collected: false }
    ]
  },

  // LEVEL 4: El Muro Ilusorio & La Goma
  {
    id: 4,
    title: 'Página 4: El Muro Ilusorio & La Goma',
    subtitle: 'Borradores patrulleros y barreras cruzadas',
    description: 'La Goma de Borrar patrulla el pasillo. Fíjate en la otra pantalla para anticipar su trayectoria exacta.',
    width: 1040,
    height: 560,
    spawn: { x: 70, y: 420, initialDimension: 'WHITE' },
    goal: { id: 'g4', x: 950, y: 420, w: 40, h: 60, label: 'FIRMA' },
    platforms: [
      { id: 'p4_1', x: 40, y: 480, w: 260, h: 40, physicalIn: 'BOTH' },
      { id: 'p4_wall', x: 300, y: 250, w: 40, h: 230, physicalIn: 'WHITE', type: 'scribble_wall', label: 'Muro Blanco' },
      { id: 'p4_mid', x: 340, y: 480, w: 380, h: 40, physicalIn: 'BOTH' },
      { id: 'p4_wall2', x: 720, y: 250, w: 40, h: 230, physicalIn: 'BLACK', type: 'scribble_wall', label: 'Muro Negro' },
      { id: 'p4_end', x: 760, y: 480, w: 240, h: 40, physicalIn: 'BOTH' }
    ],
    spikes: [
      { id: 's4_1', x: 820, y: 450, w: 40, h: 30, physicalIn: 'WHITE' }
    ],
    erasers: [
      { id: 'eraser1', x: 380, y: 430, w: 60, h: 50, vx: 120, minX: 350, maxX: 700, physicalIn: 'WHITE' }
    ],
    inkDrops: [],
    stars: [
      { id: 'star4_1', x: 320, y: 190, w: 24, h: 24, dimension: 'BLACK', collected: false },
      { id: 'star4_2', x: 530, y: 400, w: 24, h: 24, dimension: 'ANY', collected: false }
    ]
  },

  // LEVEL 5: Lluvia de Tinta
  {
    id: 5,
    title: 'Página 5: Lluvia de Tinta',
    subtitle: 'Gotas que caen del cielo: esquiva las invisibles guiándote por el espejo',
    description: 'Cada mundo tiene sus propias gotas letales camufladas. El otro mundo te avisa exactamente cuándo cae la gota.',
    width: 1040,
    height: 560,
    spawn: { x: 70, y: 420, initialDimension: 'WHITE' },
    goal: { id: 'g5', x: 940, y: 420, w: 40, h: 60, label: 'CUADERNO' },
    platforms: [
      { id: 'p5_1', x: 40, y: 480, w: 240, h: 40, physicalIn: 'BOTH' },
      { id: 'p5_2', x: 310, y: 480, w: 230, h: 40, physicalIn: 'BOTH' },
      { id: 'p5_3', x: 570, y: 480, w: 210, h: 40, physicalIn: 'BOTH' },
      { id: 'p5_4', x: 810, y: 480, w: 190, h: 40, physicalIn: 'BOTH' }
    ],
    spikes: [
      { id: 's5_1', x: 280, y: 530, w: 30, h: 30, physicalIn: 'WHITE' },
      { id: 's5_2', x: 540, y: 530, w: 30, h: 30, physicalIn: 'BLACK' }
    ],
    erasers: [],
    inkDrops: [
      { id: 'ink1', x: 180, y: 80, radius: 10, vy: 90, physicalIn: 'WHITE', spawnY: 80, respawnTime: 1.6, timer: 0.1 },
      { id: 'ink2', x: 380, y: 80, radius: 12, vy: 110, physicalIn: 'WHITE', spawnY: 80, respawnTime: 1.8, timer: 0.8 },
      { id: 'ink3', x: 470, y: 80, radius: 10, vy: 100, physicalIn: 'BLACK', spawnY: 80, respawnTime: 1.5, timer: 0.4 },
      { id: 'ink4', x: 660, y: 80, radius: 13, vy: 120, physicalIn: 'WHITE', spawnY: 80, respawnTime: 1.7, timer: 1.1 },
      { id: 'ink5', x: 740, y: 80, radius: 11, vy: 95, physicalIn: 'BLACK', spawnY: 80, respawnTime: 1.4, timer: 0.3 }
    ],
    stars: [
      { id: 'star5_1', x: 420, y: 410, w: 24, h: 24, dimension: 'WHITE', collected: false },
      { id: 'star5_2', x: 700, y: 410, w: 24, h: 24, dimension: 'BLACK', collected: false }
    ]
  },

  // LEVEL 6: El Gran Dúo
  {
    id: 6,
    title: 'Página 6: El Gran Dúo',
    subtitle: 'El examen final: coordinación, visión cruzada y puentes dibujados',
    description: 'Lleva a ambos stickman a la meta cooperando. Dibuja rampas, esquiva los peligros invisibles e intercambia posiciones con [SHIFT].',
    width: 1200,
    height: 600,
    spawn: { x: 80, y: 460, initialDimension: 'WHITE' },
    goal: { id: 'g6', x: 1120, y: 220, w: 45, h: 65, label: 'GRADUADOS' },
    platforms: [
      { id: 'p6_1', x: 40, y: 520, w: 260, h: 40, physicalIn: 'BOTH' },
      { id: 'p6_2', x: 300, y: 520, w: 460, h: 40, physicalIn: 'BOTH' },
      { id: 'p6_3', x: 790, y: 450, w: 110, h: 25, physicalIn: 'BOTH' },
      { id: 'p6_4', x: 920, y: 370, w: 110, h: 25, physicalIn: 'BOTH' },
      { id: 'p6_5', x: 810, y: 290, w: 110, h: 25, physicalIn: 'BOTH' },
      { id: 'p6_roof', x: 950, y: 280, w: 210, h: 30, physicalIn: 'BOTH' }
    ],
    spikes: [
      { id: 's6_1', x: 360, y: 490, w: 40, h: 30, physicalIn: 'WHITE' },
      { id: 's6_2', x: 470, y: 490, w: 40, h: 30, physicalIn: 'BLACK' },
      { id: 's6_3', x: 590, y: 490, w: 40, h: 30, physicalIn: 'WHITE' },
      { id: 's6_4', x: 700, y: 490, w: 40, h: 30, physicalIn: 'BLACK' }
    ],
    erasers: [
      { id: 'e6_1', x: 140, y: 470, w: 65, h: 50, vx: 130, minX: 80, maxX: 740, physicalIn: 'WHITE' }
    ],
    inkDrops: [
      { id: 'ink6_1', x: 520, y: 80, radius: 12, vy: 110, physicalIn: 'BLACK', spawnY: 80, respawnTime: 2.0, timer: 0.5 },
      { id: 'ink6_2', x: 860, y: 80, radius: 11, vy: 105, physicalIn: 'WHITE', spawnY: 80, respawnTime: 1.8, timer: 0.2 }
    ],
    stars: [
      { id: 'star6_1', x: 530, y: 450, w: 24, h: 24, dimension: 'WHITE', collected: false },
      { id: 'star6_2', x: 860, y: 230, w: 24, h: 24, dimension: 'BLACK', collected: false },
      { id: 'star6_3', x: 1040, y: 220, w: 24, h: 24, dimension: 'ANY', collected: false }
    ]
  }
];
