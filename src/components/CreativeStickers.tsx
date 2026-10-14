import React, { useState, useMemo } from 'react';

/**
 * Shared SVG Filter for authentic Die-Cut Vinyl Sticker Outline + Drop Shadow
 */
export const StickerSvgDefs: React.FC = () => (
  <svg className="sr-only" width="0" height="0" aria-hidden="true">
    <defs>
      <filter id="die-cut-sticker" x="-25%" y="-25%" width="150%" height="150%">
        <feMorphology in="SourceAlpha" result="DILATED" operator="dilate" radius="3.2" />
        <feFlood floodColor="#FFFFFF" floodOpacity="1" result="WHITE_OUTLINE" />
        <feComposite in="WHITE_OUTLINE" in2="DILATED" operator="in" result="STICKER_BORDER" />
        <feDropShadow
          in="STICKER_BORDER"
          dx="0"
          dy="4"
          stdDeviation="3.5"
          floodColor="#000000"
          floodOpacity="0.42"
          result="STICKER_SHADOW"
        />
        <feMerge>
          <feMergeNode in="STICKER_SHADOW" />
          <feMergeNode in="STICKER_BORDER" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  </svg>
);

/**
 * 1. STICKER: MORCEGA (A mais velha e gorda — gata preta bem peluda/felpuda que parece uma morceguinha!)
 * Die-cut vinyl illustration of a super-fluffy, round chubby black bat-cat with scalloped bat wings,
 * tufted fur cheeks/chest, bat ears, and tiny fangs sleeping on a crimson cushion.
 */
export const StickerMorcega: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [awake, setAwake] = useState(false);
  const [purrCount, setPurrCount] = useState(0);

  const interact = () => {
    setAwake(true);
    setPurrCount((c) => c + 1);
    setTimeout(() => setAwake(false), 2000);
  };

  return (
    <div className={`relative inline-block select-none group ${className}`}>
      <div
        className={`pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-zinc-900/95 text-zinc-100 border border-zinc-700 shadow-xl text-[11px] font-mono whitespace-nowrap transition-all duration-200 z-30 ${
          awake
            ? 'opacity-100 -translate-y-1 scale-105 border-[#E11D48]'
            : 'opacity-0 translate-y-1 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100'
        }`}
      >
        {awake
          ? `Mrrr-miau... zZz 🦇♥ (+${purrCount} carinho)`
          : 'Morcega · A mais velha, gorda, peluda & morceguinha'}
      </div>

      <button
        type="button"
        onClick={interact}
        aria-label="Sticker interativo da gata Morcega. Clique para ela miar, abrir as asinhas de morcega e ronronar."
        className={`relative bg-transparent border-0 p-1 transition-all duration-300 -rotate-3 group-hover:rotate-0 group-hover:-translate-y-1.5 group-hover:animate-[bounce_1.8s_ease-in-out_infinite] active:scale-90 cursor-pointer focus:outline-none ${
          awake ? 'scale-115 rotate-2' : ''
        }`}
      >
        <svg
          viewBox="0 0 136 102"
          className="w-22 h-17 sm:w-26 sm:h-20 overflow-visible"
          style={{ filter: 'url(#die-cut-sticker)' }}
        >
          {/* Plush Crimson Velvet Cushion Base */}
          <ellipse cx="68" cy="79" rx="48" ry="14" fill="#E11D48" />
          <ellipse cx="68" cy="76" rx="43" ry="10" fill="#BE123C" />

          {/* Left Scalloped Bat Wing */}
          <g
            className={`transition-transform duration-300 [transform-box:fill-box] origin-right ${
              awake ? 'rotate-12 -translate-y-1.5' : 'group-hover:rotate-6'
            }`}
          >
            <path
              d="M32 50 C18 32, 6 38, 4 56 C10 53, 14 57, 15 63 C20 59, 25 62, 28 67 Z"
              fill="#27272A"
              stroke="#18181B"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M29 52 L12 45 M28 56 L16 58" stroke="#3F3F46" strokeWidth="1.4" strokeLinecap="round" />
          </g>

          {/* Right Scalloped Bat Wing */}
          <g
            className={`transition-transform duration-300 [transform-box:fill-box] origin-left ${
              awake ? '-rotate-12 -translate-y-1.5' : 'group-hover:-rotate-6'
            }`}
          >
            <path
              d="M104 50 C118 32, 130 38, 132 56 C126 53, 122 57, 121 63 C116 59, 111 62, 108 67 Z"
              fill="#27272A"
              stroke="#18181B"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M107 52 L124 45 M108 56 L120 58" stroke="#3F3F46" strokeWidth="1.4" strokeLinecap="round" />
          </g>

          {/* Ultra-Fluffy & Chubby Tufted Loaf Body (Scalloped Fluffy Fur Silhouette!) */}
          <path
            d="M26 64
               Q21 57 25 50
               Q22 41 30 36
               Q42 24 68 24
               Q94 24 106 36
               Q114 41 111 50
               Q115 57 110 64
               Q113 73 102 78
               Q86 83 68 83
               Q50 83 34 78
               Q23 73 26 64 Z"
            fill="#18181B"
          />

          {/* Fluffy Chest Ruff & Fur Texture Tufts */}
          <path
            d="M44 63 Q49 69 54 64 Q61 71 68 64 Q75 71 82 64 Q87 69 92 63"
            fill="none"
            stroke="#3F3F46"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M36 42 Q42 38 48 41 M88 41 Q94 38 100 42"
            fill="none"
            stroke="#3F3F46"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Large Bat-Like Tufted Ears */}
          <path d="M35 37 L20 7 L52 25 Z" fill="#18181B" />
          <path d="M36 33 L26 14 L47 26 Z" fill="#FB7185" opacity="0.85" />
          {/* Ear Fur Tuft */}
          <path d="M34 32 L29 29 L38 28" fill="none" stroke="#F4F4F5" strokeWidth="1.5" strokeLinecap="round" />

          <path d="M84 25 L116 7 L101 37 Z" fill="#18181B" />
          <path d="M89 26 L110 14 L100 33 Z" fill="#FB7185" opacity="0.85" />
          {/* Ear Fur Tuft */}
          <path d="M102 32 L107 29 L98 28" fill="none" stroke="#F4F4F5" strokeWidth="1.5" strokeLinecap="round" />

          {/* Fluffy Cheek Tufts on Sides of Face */}
          <path
            d="M26 52 L19 50 L24 56 L18 58 L27 61 Z"
            fill="#18181B"
          />
          <path
            d="M110 52 L117 50 L112 56 L118 58 L109 61 Z"
            fill="#18181B"
          />

          {/* Cute Chubby Paws Tucked In */}
          <ellipse cx="48" cy="79" rx="9" ry="5" fill="#27272A" />
          <ellipse cx="88" cy="79" rx="9" ry="5" fill="#27272A" />
          <circle cx="46" cy="80" r="1.5" fill="#FB7185" />
          <circle cx="50" cy="80" r="1.5" fill="#FB7185" />
          <circle cx="86" cy="80" r="1.5" fill="#FB7185" />
          <circle cx="90" cy="80" r="1.5" fill="#FB7185" />

          {/* Cozy Cheek Blush */}
          <ellipse cx="44" cy="55" rx="5" ry="2.8" fill="#FB7185" opacity="0.55" />
          <ellipse cx="92" cy="55" rx="5" ry="2.8" fill="#FB7185" opacity="0.55" />

          {/* Eyes: Cozy Sleeping Arcs or Golden Bat-Cat Awake Eyes */}
          {awake ? (
            <>
              <circle cx="53" cy="48" r="6" fill="#FBBF24" />
              <circle cx="83" cy="48" r="6" fill="#FBBF24" />
              <ellipse cx="53" cy="48" rx="2.2" ry="4.5" fill="#09090B" />
              <ellipse cx="83" cy="48" rx="2.2" ry="4.5" fill="#09090B" />
              <circle cx="51.2" cy="46" r="1.6" fill="#FFFFFF" />
              <circle cx="81.2" cy="46" r="1.6" fill="#FFFFFF" />
            </>
          ) : (
            <>
              <path
                d="M47 48 Q53 54 59 48"
                fill="none"
                stroke="#F4F4F5"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path
                d="M77 48 Q83 54 89 48"
                fill="none"
                stroke="#F4F4F5"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </>
          )}

          {/* Bat-Cat Nose & Cute Vampire/Bat Fangs */}
          <polygon points="65,52 71,52 68,55.5" fill="#FB7185" />
          <path
            d="M61 57 Q68 60 75 57"
            fill="none"
            stroke="#E4E4E7"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Two Tiny Bat Fangs Peeking Out */}
          <polygon points="62.5,57.5 65,57.5 63.8,61.5" fill="#FFFFFF" />
          <polygon points="71,57.5 73.5,57.5 72.2,61.5" fill="#FFFFFF" />

          {/* Floating Badge / zZz */}
          {awake ? (
            <g>
              <circle cx="112" cy="18" r="10" fill="#E11D48" />
              <text x="112" y="22" textAnchor="middle" fontSize="12" fill="#FFFFFF">
                ♥
              </text>
            </g>
          ) : (
            <g>
              <circle cx="112" cy="20" r="10" fill="#27272A" />
              <text
                x="112"
                y="23.5"
                textAnchor="middle"
                fontSize="8.5"
                fill="#FBBF24"
                className="font-mono font-bold"
              >
                zZz
              </text>
            </g>
          )}
        </svg>
      </button>
    </div>
  );
};

/**
 * 2. STICKER: BANGUELA (A do meio e menorzinha — gatinha preta pequena com bochechas enormes de esquilo e sem 1 presa!)
 * Small black cat with huge puffed-out squirrel cheeks stuffed with food and a single white fang.
 */
export const StickerBanguela: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [munching, setMunching] = useState(false);
  const [snackCount, setSnackCount] = useState(3);

  const interact = () => {
    setMunching(true);
    setSnackCount((c) => c + 1);
    setTimeout(() => setMunching(false), 1600);
  };

  return (
    <div className={`relative inline-block select-none group ${className}`}>
      <div
        className={`pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-zinc-900/95 text-zinc-100 border border-zinc-700 shadow-xl text-[11px] font-mono whitespace-nowrap transition-all duration-200 z-30 ${
          munching
            ? 'opacity-100 -translate-y-1 scale-105 border-emerald-400'
            : 'opacity-0 translate-y-1 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100'
        }`}
      >
        {munching
          ? `Nhac nhac! *bochecha de esquilo + 1 presa* (${snackCount} petiscos)`
          : 'Banguela · Pequenininha, bochecha de esquilo & 1 presa só'}
      </div>

      <button
        type="button"
        onClick={interact}
        aria-label="Sticker interativo da gata Banguela. Clique para dar petisco e ver as bochechas de esquilo e sua única presa."
        className={`relative bg-transparent border-0 p-1 transition-all duration-300 rotate-2 group-hover:rotate-0 group-hover:-translate-y-1.5 group-hover:scale-105 active:scale-95 cursor-pointer focus:outline-none ${
          munching ? 'scale-110 -rotate-2' : ''
        }`}
      >
        <svg
          viewBox="0 0 120 98"
          className="w-21 h-17 sm:w-24 sm:h-20 overflow-visible"
          style={{ filter: 'url(#die-cut-sticker)' }}
        >
          {/* Petite Tiny Body underneath her Giant Squirrel Cheeks */}
          <path
            d="M42 68 C40 81, 46 89, 60 89 C74 89, 80 81, 78 68 Z"
            fill="#18181B"
          />

          {/* Small Cute Rounded Cat Ears */}
          <path d="M33 34 C29 17, 40 14, 49 25 Z" fill="#18181B" />
          <path d="M36 31 C34 21, 40 19, 46 26 Z" fill="#FB7185" opacity="0.85" />

          <path d="M87 34 C91 17, 80 14, 71 25 Z" fill="#18181B" />
          <path d="M84 31 C86 21, 80 19, 74 26 Z" fill="#FB7185" opacity="0.85" />

          {/* Upper Petite Black Forehead */}
          <ellipse cx="60" cy="42" rx="23" ry="18" fill="#18181B" />

          {/* GIANT PUFFY SQUIRREL CHEEKS STUFFED WITH FOOD ("bochechas grandes cheias de comida") */}
          <g className="transition-transform duration-300 [transform-box:fill-box] origin-center group-hover:scale-105">
            {/* Left Bulging Squirrel Cheek Pouch */}
            <circle
              cx={munching ? '27' : '29'}
              cy="56"
              r={munching ? '19' : '17.5'}
              fill="#18181B"
            />
            <ellipse
              cx={munching ? '26' : '28'}
              cy="57"
              rx={munching ? '14' : '12.5'}
              ry="11"
              fill="#27272A"
            />
            <ellipse cx="24" cy="55" rx="6" ry="3.8" fill="#FB7185" opacity="0.7" />
            {/* Squirrel Cheek Puff Dimple */}
            <path
              d="M16 49 Q12 56 17 63"
              fill="none"
              stroke="#52525B"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* Right Bulging Squirrel Cheek Pouch */}
            <circle
              cx={munching ? '93' : '91'}
              cy="56"
              r={munching ? '19' : '17.5'}
              fill="#18181B"
            />
            <ellipse
              cx={munching ? '94' : '92'}
              cy="57"
              rx={munching ? '14' : '12.5'}
              ry="11"
              fill="#27272A"
            />
            <ellipse cx="96" cy="55" rx="6" ry="3.8" fill="#FB7185" opacity="0.7" />
            {/* Squirrel Cheek Puff Dimple */}
            <path
              d="M104 49 Q108 56 103 63"
              fill="none"
              stroke="#52525B"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* Center Chubby Muzzle Bridge */}
            <ellipse cx="60" cy="58" rx="28" ry="15" fill="#18181B" />
          </g>

          {/* Big Glossy Emerald Eyes */}
          <circle cx="47" cy="42" r="7" fill="#10B981" />
          <circle cx="73" cy="42" r="7" fill="#10B981" />
          <circle cx="47" cy="42" r="3.8" fill="#09090B" />
          <circle cx="73" cy="42" r="3.8" fill="#09090B" />
          <circle cx="44.8" cy="39.8" r="2.1" fill="#FFFFFF" />
          <circle cx="70.8" cy="39.8" r="2.1" fill="#FFFFFF" />

          {/* Cute Pink Button Nose */}
          <ellipse cx="60" cy="49.5" rx="3.4" ry="2.3" fill="#FB7185" />

          {/* Wide Happy Squirrel Smile with ONLY ONE SINGLE FANG (Banguela!) */}
          <path
            d={munching ? 'M47 54 Q60 69 73 54 Z' : 'M48 54 Q60 66 72 54 Z'}
            fill="#9F1239"
            stroke="#F4F4F5"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <ellipse cx="60" cy="60.5" rx="6" ry="2.8" fill="#FB7185" />

          {/* THE SINGLE WHITE FANG on Left (Right fang clearly missing!) */}
          <polygon points="50.5,54.5 56,54.5 53.2,63" fill="#FFFFFF" />

          {/* Tiny Paws Holding a Crunchy Golden Acorn/Snack Under Chin */}
          <ellipse cx="49" cy="74" rx="6.5" ry="5" fill="#27272A" />
          <ellipse cx="71" cy="74" rx="6.5" ry="5" fill="#27272A" />
          <circle cx="60" cy="74" r="6.5" fill="#F59E0B" stroke="#FEF08A" strokeWidth="1.5" />
          <path d="M55 71 Q60 68 65 71" fill="none" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />

          {/* Munching Crumb Sparkles */}
          {munching && (
            <g>
              <circle cx="18" cy="35" r="2.5" fill="#FBBF24" />
              <circle cx="102" cy="37" r="2.5" fill="#FBBF24" />
              <circle cx="60" cy="14" r="2.5" fill="#34D399" />
            </g>
          )}
        </svg>
      </button>
    </div>
  );
};

/**
 * 3. STICKER: TOMADA (O caçula — gato GRANDE, magro/esguio, comprido e ligado no 220V!)
 * Illustrated in an iconic dynamic leaping/stretched "long-cat" athletic pose with long slender body,
 * long legs, whip tail, and 220V electric lightning bolts.
 */
export const StickerTomada: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [zooming, setZooming] = useState(false);

  const interact = () => {
    setZooming(true);
    setTimeout(() => setZooming(false), 1600);
  };

  return (
    <div className={`relative inline-block select-none group ${className}`}>
      <div
        className={`pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-zinc-900/95 text-amber-300 border border-amber-400/60 shadow-xl text-[11px] font-mono whitespace-nowrap transition-all duration-200 z-30 ${
          zooming
            ? 'opacity-100 -translate-y-1 scale-105'
            : 'opacity-0 translate-y-1 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100'
        }`}
      >
        {zooming
          ? 'ZOOOOM 220V!! ⚡ Gato comprido em modo turbo!'
          : 'Tomada · Gato GRANDE, magro, comprido & 220V'}
      </div>

      <button
        type="button"
        onClick={interact}
        aria-label="Sticker interativo do gato Tomada. Clique para ativar o modo 220V."
        className={`relative bg-transparent border-0 p-1 transition-all duration-200 -rotate-2 group-hover:rotate-1 group-hover:-translate-y-1.5 active:scale-90 cursor-pointer focus:outline-none ${
          zooming ? 'animate-[electric-buzz_0.25s_linear_infinite] scale-115' : ''
        }`}
      >
        <svg
          viewBox="0 0 138 104"
          className="w-24 h-18 sm:w-28 sm:h-21 overflow-visible"
          style={{ filter: 'url(#die-cut-sticker)' }}
        >
          {/* Electric 220V Lightning Sparks Around His Long Body */}
          <polygon
            points="18,26 36,18 28,32 44,28 22,46 28,34 14,36"
            fill="#FACC15"
          />
          <polygon
            points="116,54 98,64 108,66 94,82 122,70 110,66"
            fill="#FACC15"
          />

          {/* Super Long Whip-Like Tail Crackling on Left */}
          <path
            d={
              zooming
                ? 'M26 68 L8 52 L18 42 L4 24 L16 14'
                : 'M26 68 C10 62, 6 40, 16 20'
            }
            fill="none"
            stroke="#18181B"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Long Slender Hind Legs (Bottom Left Launch) */}
          <path
            d="M28 66 L14 92 M38 68 L28 94"
            fill="none"
            stroke="#18181B"
            strokeWidth="7.5"
            strokeLinecap="round"
          />
          <ellipse cx="13" cy="93" rx="4.5" ry="3" fill="#27272A" />
          <ellipse cx="27" cy="95" rx="4.5" ry="3" fill="#27272A" />

          {/* SLIM, LONG, STRETCHED ATHLETIC TORSO ("Long Cat" Arched Leap!) */}
          <path
            d="M24 66 C42 40, 72 34, 98 44 C74 48, 48 54, 34 72 Z"
            fill="#18181B"
          />
          <path
            d="M26 64 C46 42, 74 38, 96 44"
            fill="none"
            stroke="#18181B"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Sleek Slim Chest/Belly Line */}
          <path
            d="M32 67 C50 47, 74 43, 94 48"
            fill="none"
            stroke="#27272A"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Spiky Electrified Back Fur Tufts */}
          <polygon points="48,38 52,29 57,37 63,28 67,36 74,29 77,37" fill="#18181B" />

          {/* Long Slender Front Legs Reaching Out (Right) */}
          <path
            d="M94 48 L116 74 M86 52 L102 82"
            fill="none"
            stroke="#18181B"
            strokeWidth="7.5"
            strokeLinecap="round"
          />
          <ellipse cx="117" cy="75" rx="4.5" ry="3" fill="#27272A" />
          <ellipse cx="103" cy="83" rx="4.5" ry="3" fill="#27272A" />

          {/* Tall Alert Ears & Angular Sleek Head on Top-Right */}
          <path d="M84 30 L80 4 L97 20 Z" fill="#18181B" />
          <path d="M86 26 L83 10 L94 20 Z" fill="#F59E0B" />
          <path d="M104 20 L122 4 L116 30 Z" fill="#18181B" />
          <path d="M107 20 L118 10 L114 26 Z" fill="#F59E0B" />

          <ellipse cx="101" cy="31" rx="19" ry="15" fill="#18181B" />

          {/* Huge Hyper-Alert 220V Yellow Eyes */}
          <circle cx="93" cy="30" r="6" fill="#FEF08A" />
          <circle cx="110" cy="30" r="6" fill="#FEF08A" />
          <circle cx="93" cy="30" r={zooming ? '3.8' : '2.4'} fill="#09090B" />
          <circle cx="110" cy="30" r={zooming ? '3.8' : '2.4'} fill="#09090B" />
          <circle cx="91.2" cy="28" r="1.5" fill="#FFFFFF" />
          <circle cx="108.2" cy="28" r="1.5" fill="#FFFFFF" />

          {/* Forehead Lightning Bolt */}
          <polygon points="102,16 97,23 101,23 99,29 106,21 102,21" fill="#FACC15" />

          {/* Pink Nose & Excited Meow */}
          <polygon points="99,36 104,36 101.5,38.5" fill="#FB7185" />
          <polygon points="97,40 106,40 101.5,45" fill="#E11D48" />

          {/* 220V Tag Badge */}
          <rect x="46" y="54" width="36" height="13" rx="6.5" fill="#E11D48" />
          <text
            x="64"
            y="63"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="8.5"
            className="font-mono font-bold"
          >
            220V⚡
          </text>
        </svg>
      </button>
    </div>
  );
};

/**
 * 4. STICKER: D20 RPG DIE (Baldur's Gate 3, Valheim, Dota 2, Valorant, Cities: Skylines)
 * Contoured 3D crimson & gold metallic icosahedron die sticker.
 */
export const StickerD20: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [rollValue, setRollValue] = useState<number>(20);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [gameIdx, setGameIdx] = useState<number>(0);

  const games = [
    "Baldur's Gate 3",
    'Valheim',
    'Dota 2',
    'Valorant',
    'Cities: Skylines'
  ];

  const handleRoll = () => {
    setIsRolling(true);
    setTimeout(() => {
      const next = Math.floor(Math.random() * 20) + 1;
      setRollValue(next);
      setGameIdx((prev) => (prev + 1) % games.length);
      setIsRolling(false);
    }, 260);
  };

  return (
    <div className={`relative inline-block select-none group ${className}`}>
      <div
        className={`pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-zinc-900/95 text-zinc-100 border border-zinc-700 shadow-xl text-[11px] font-mono whitespace-nowrap transition-all duration-200 z-30 ${
          isRolling
            ? 'opacity-100 -translate-y-1 border-[#E11D48]'
            : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'
        }`}
      >
        {rollValue === 20
          ? `NAT 20 Crítico! · ${games[gameIdx]}`
          : `D20 = ${rollValue} · ${games[gameIdx]}`}
      </div>

      <button
        type="button"
        onClick={handleRoll}
        aria-label={`Sticker de dado D20 de RPG. Valor atual ${rollValue}. Clique para rolar o dado.`}
        className="relative bg-transparent border-0 p-1 transition-all duration-300 rotate-6 group-hover:-rotate-6 group-hover:scale-110 active:scale-90 cursor-pointer focus:outline-none"
      >
        <svg
          viewBox="0 0 96 96"
          className={`w-18 h-18 sm:w-21 sm:h-21 overflow-visible transition-transform duration-500 ease-out group-hover:rotate-[18deg] ${
            isRolling ? 'animate-spin scale-110' : ''
          }`}
          style={{ filter: 'url(#die-cut-sticker)' }}
        >
          <defs>
            <linearGradient id="d20-crimson" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="50%" stopColor="#E11D48" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>
          </defs>

          {/* Outer Hexagonal Icosahedron Silhouette */}
          <polygon
            points="48,6 86,27 86,69 48,90 10,69 10,27"
            fill="url(#d20-crimson)"
            stroke="#FBBF24"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />

          {/* Shaded Facets for 3D Depth */}
          <polygon points="48,6 86,27 48,22" fill="#FB7185" opacity="0.35" />
          <polygon points="10,69 48,90 48,64" fill="#4C0519" opacity="0.45" />

          {/* Center Triangle Face */}
          <polygon
            points="48,22 73,64 23,64"
            fill="#9F1239"
            stroke="#FDE68A"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Gold Engraved Facet Connectors */}
          <line x1="48" y1="6" x2="48" y2="22" stroke="#FDE68A" strokeWidth="1.8" />
          <line x1="86" y1="27" x2="48" y2="22" stroke="#FDE68A" strokeWidth="1.8" />
          <line x1="10" y1="27" x2="48" y2="22" stroke="#FDE68A" strokeWidth="1.8" />
          <line x1="86" y1="69" x2="73" y2="64" stroke="#FDE68A" strokeWidth="1.8" />
          <line x1="10" y1="69" x2="23" y2="64" stroke="#FDE68A" strokeWidth="1.8" />
          <line x1="48" y1="90" x2="73" y2="64" stroke="#FDE68A" strokeWidth="1.8" />
          <line x1="48" y1="90" x2="23" y2="64" stroke="#FDE68A" strokeWidth="1.8" />

          {/* Engraved Gold Number */}
          <text
            x="48"
            y="56"
            textAnchor="middle"
            fill="#FEF08A"
            className="font-mono font-bold text-[19px] tabular-nums"
          >
            {rollValue}
          </text>
        </svg>
      </button>
    </div>
  );
};

/**
 * 5. STICKER: GINCANAS RS — SETOR DE DIVERSAS (Foco extremo em Dados, Documentos, Pessoas & Locais!)
 * Contoured investigative OSINT data dossier, document scanner & location pin sticker.
 */
export const StickerGincanaCipher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [scanned, setScanned] = useState(false);

  return (
    <div className={`relative inline-block select-none group ${className}`}>
      <div
        className={`pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-zinc-900/95 text-zinc-100 border border-zinc-700 shadow-xl text-[11px] font-mono whitespace-nowrap transition-all duration-200 z-30 ${
          scanned
            ? 'opacity-100 -translate-y-1 border-emerald-400'
            : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'
        }`}
      >
        {scanned
          ? 'Registro Localizado! · Docs, Dados, Pessoas & Locais (RS)'
          : 'Setor de Diversas (Gincanas RS) · Dados, Docs & Locais'}
      </div>

      <button
        type="button"
        onClick={() => setScanned((s) => !s)}
        aria-label="Sticker do Setor de Diversas das Gincanas do RS. Focado em pesquisa de dados, documentos, registros pessoais e locais."
        className="relative bg-transparent border-0 p-1 transition-all duration-300 -rotate-3 group-hover:rotate-0 group-hover:scale-110 active:scale-90 cursor-pointer focus:outline-none"
      >
        <svg
          viewBox="0 0 104 94"
          className="w-19 h-17 sm:w-22 sm:h-20 overflow-visible"
          style={{ filter: 'url(#die-cut-sticker)' }}
        >
          {/* Back Dossier Tab Folder */}
          <path
            d="M12 18 L42 18 L48 24 L86 24 C90 24, 92 26, 92 30 L92 78 C92 82, 90 84, 86 84 L12 84 C8 84, 6 82, 6 78 L6 24 C6 20, 8 18, 12 18 Z"
            fill="#18181B"
            stroke="#F59E0B"
            strokeWidth="2.5"
          />

          {/* Top Folder Classification Header */}
          <rect x="14" y="29" width="38" height="9" rx="2" fill="#E11D48" />
          <text
            x="33"
            y="35.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="6.5"
            className="font-mono font-bold"
          >
            DIVERSAS·DATA
          </text>

          {/* ID / Personal Record Card inside Dossier */}
          <rect x="14" y="42" width="24" height="26" rx="3" fill="#27272A" stroke="#52525B" strokeWidth="1.2" />
          {/* Person Silhouette inside Document */}
          <circle cx="26" cy="50" r="4.5" fill="#FBBF24" />
          <path d="M18 63 C18 57, 34 57, 34 63 Z" fill="#FBBF24" />

          {/* Data / Document Index Lines */}
          <rect x="43" y="43" width="36" height="4" rx="2" fill={scanned ? '#34D399' : '#A1A1AA'} />
          <rect x="43" y="51" width="28" height="4" rx="2" fill={scanned ? '#34D399' : '#71717A'} />
          <rect x="43" y="59" width="32" height="4" rx="2" fill="#71717A" />

          {/* Bottom Status Bar */}
          <rect x="14" y="72" width="66" height="7" rx="2" fill="#09090B" />
          <text
            x="47"
            y="77.5"
            textAnchor="middle"
            fill={scanned ? '#34D399' : '#FBBF24'}
            fontSize="6.5"
            className="font-mono font-bold"
          >
            {scanned ? '✓ DOC · INFO · LOCAL OK' : 'DOCS · INFOS · LOCAIS'}
          </text>

          {/* Tactical Geo-Location Pin + Magnifying Lens Badge on Right */}
          <g className="transition-transform duration-300 [transform-box:fill-box] origin-center group-hover:-translate-y-1">
            <path
              d="M82 12 C73 12, 66 19, 66 28 C66 40, 82 54, 82 54 C82 54, 98 40, 98 28 C98 19, 91 12, 82 12 Z"
              fill={scanned ? '#10B981' : '#E11D48'}
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            <circle cx="82" cy="27" r="6.5" fill="#18181B" />
            <circle cx="82" cy="27" r="2.8" fill="#FEF08A" />
          </g>
        </svg>
      </button>
    </div>
  );
};

/**
 * 6. STICKER: GYM & E-SPORTS (Halter + Insígnia Competitiva)
 * Contoured die-cut sticker of a heavy gym dumbbell with a tactical e-sports star.
 */
export const StickerGymEsports: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [pumped, setPumped] = useState(false);
  const [sets, setSets] = useState(5);

  const handlePump = () => {
    setPumped(true);
    setSets((s) => (s >= 10 ? 5 : s + 1));
    setTimeout(() => setPumped(false), 260);
  };

  return (
    <div className={`relative inline-block select-none group ${className}`}>
      <div className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-zinc-900/95 text-zinc-100 border border-zinc-700 shadow-xl text-[11px] font-mono whitespace-nowrap opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-30">
        Academia ({sets}x/sem) & E-Sports (+1 STR)
      </div>

      <button
        type="button"
        onClick={handlePump}
        aria-label="Sticker de Academia e E-Sports. Clique para animar."
        className={`relative bg-transparent border-0 p-1 transition-all duration-200 rotate-2 group-hover:rotate-0 group-hover:animate-[bounce_1.1s_ease-in-out_infinite] active:scale-90 cursor-pointer focus:outline-none ${
          pumped ? '-translate-y-2.5 scale-115' : ''
        }`}
      >
        <svg
          viewBox="0 0 112 76"
          className="w-20 h-14 sm:w-24 sm:h-16 overflow-visible"
          style={{ filter: 'url(#die-cut-sticker)' }}
        >
          {/* Tactical E-Sports Radiant Star Behind */}
          <polygon
            points="56,6 64,26 86,26 68,39 74,60 56,47 38,60 44,39 26,26 48,26"
            fill="#F59E0B"
          />

          {/* Heavy Knurled Chrome Bar */}
          <rect x="20" y="34" width="72" height="8" rx="3" fill="#D4D4D8" />

          {/* Left Weight Plates */}
          <rect x="10" y="16" width="12" height="44" rx="4" fill="#18181B" />
          <rect x="12" y="20" width="8" height="36" rx="2" fill="#E11D48" />
          <rect x="23" y="22" width="9" height="32" rx="3" fill="#27272A" />

          {/* Right Weight Plates */}
          <rect x="80" y="22" width="9" height="32" rx="3" fill="#27272A" />
          <rect x="90" y="16" width="12" height="44" rx="4" fill="#18181B" />
          <rect x="92" y="20" width="8" height="36" rx="2" fill="#E11D48" />

          {/* Center PR Weight Badge */}
          <rect x="42" y="27" width="28" height="22" rx="6" fill="#18181B" />
          <text
            x="56"
            y="41.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="9.5"
            className="font-mono font-bold"
          >
            {sets}xPR
          </text>
        </svg>
      </button>
    </div>
  );
};

/**
 * 7. STICKER: STYLISH STEAMING SPECIALTY COFFEE CUP (Pedro's True Coding Fuel!)
 * Designer ceramic cup on a saucer with latte-art crema, roasted coffee beans, and animated rising steam wisps.
 */
export const StickerCoffee: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [sips, setSips] = useState(0);
  const [brewing, setBrewing] = useState(false);

  const handleDrink = () => {
    setBrewing(true);
    setSips((s) => s + 1);
    setTimeout(() => setBrewing(false), 1600);
  };

  return (
    <div className={`relative inline-block select-none group ${className}`}>
      <div
        className={`pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-zinc-900/95 text-amber-200 border border-amber-500/50 shadow-xl text-[11px] font-mono whitespace-nowrap transition-all duration-200 z-30 ${
          brewing
            ? 'opacity-100 -translate-y-1 scale-105'
            : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'
        }`}
      >
        {brewing
          ? `Café especial passado na hora! ☕ (+${sips} dose de foco)`
          : 'Specialty Coffee Lover ☕ · Combustível Oficial'}
      </div>

      <button
        type="button"
        onClick={handleDrink}
        aria-label="Sticker de Xícara de Café Fumegante. Clique para tomar um gole de café."
        className={`relative bg-transparent border-0 p-1 transition-all duration-300 -rotate-3 group-hover:rotate-2 group-hover:-translate-y-1.5 group-hover:scale-110 active:scale-90 cursor-pointer focus:outline-none ${
          brewing ? 'scale-115 rotate-3' : ''
        }`}
      >
        <svg
          viewBox="0 0 104 98"
          className="w-18 h-18 sm:w-21 sm:h-21 overflow-visible"
          style={{ filter: 'url(#die-cut-sticker)' }}
        >
          {/* Animated Rising Coffee Steam Wisps */}
          <path
            d="M35 27 C31 20, 39 14, 34 6"
            fill="none"
            stroke="#FDE68A"
            strokeWidth="3"
            strokeLinecap="round"
            className="animate-[steam-rise_2.2s_ease-in-out_infinite]"
          />
          <path
            d="M48 25 C43 16, 53 10, 48 3"
            fill="none"
            stroke="#FBBF24"
            strokeWidth="3.4"
            strokeLinecap="round"
            className="animate-[steam-rise_1.8s_ease-in-out_infinite]"
          />
          <path
            d="M61 27 C57 20, 65 14, 60 6"
            fill="none"
            stroke="#FDE68A"
            strokeWidth="3"
            strokeLinecap="round"
            className="animate-[steam-rise_2.5s_ease-in-out_infinite]"
          />

          {/* Ceramic Saucer Plate Base */}
          <ellipse cx="48" cy="82" rx="36" ry="7.5" fill="#27272A" stroke="#E4E4E7" strokeWidth="2" />
          <ellipse cx="48" cy="80" rx="24" ry="4" fill="#18181B" />

          {/* Stylish Ergonomic Mug Handle on Right */}
          <path
            d="M72 42 C88 42, 88 66, 70 66"
            fill="none"
            stroke="#E11D48"
            strokeWidth="7.5"
            strokeLinecap="round"
          />
          <path
            d="M72 45 C83 45, 83 63, 70 63"
            fill="none"
            stroke="#18181B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Stylish Tapered Specialty Coffee Cup Body */}
          <path
            d="M19 35 L77 35 L71 70 C69 78, 60 82, 48 82 C36 82, 27 78, 25 70 Z"
            fill="#18181B"
            stroke="#F4F4F5"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          {/* Crimson Barista Grip Band Around Cup */}
          <path
            d="M22 50 L74 50 L72 65 L24 65 Z"
            fill="#E11D48"
          />
          <text
            x="48"
            y="60.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="8.5"
            className="font-mono font-bold tracking-wider"
          >
            COFFEE
          </text>

          {/* Rich Glossy Espresso & Crema Top Rim */}
          <ellipse cx="48" cy="35" rx="29" ry="7.5" fill="#451A03" stroke="#F4F4F5" strokeWidth="2.2" />
          <ellipse cx="48" cy="35" rx="23" ry="5" fill="#92400E" />
          {/* Latte Art Heart / Crema Detail */}
          <path
            d="M44 34 C44 31.5, 48 32, 48 34 C48 32, 52 31.5, 52 34 C52 36.5, 48 38, 48 38 C48 38, 44 36.5, 44 34 Z"
            fill="#FDE68A"
          />

          {/* Two Roasted Coffee Beans on Left of Saucer */}
          <g transform="translate(17, 79) rotate(-22)">
            <ellipse cx="0" cy="0" rx="7.5" ry="5" fill="#78350F" stroke="#FDE68A" strokeWidth="1.2" />
            <path d="M-5 0 Q0 -2 5 0" fill="none" stroke="#18181B" strokeWidth="1.4" />
          </g>
          <g transform="translate(27, 84) rotate(14)">
            <ellipse cx="0" cy="0" rx="6.5" ry="4.5" fill="#451A03" stroke="#FDE68A" strokeWidth="1.1" />
            <path d="M-4 0 Q0 -1.5 4 0" fill="none" stroke="#18181B" strokeWidth="1.2" />
          </g>
        </svg>
      </button>
    </div>
  );
};

// Backwards-compatible alias
export const StickerChimarraoRS = StickerCoffee;

/**
 * 8. EXTRA STICKER: VALHEIM / CITIES BUILDER HAMMER & COMPASS
 */
export const StickerBuilderHammer: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [forged, setForged] = useState(false);

  return (
    <div className={`relative inline-block select-none group ${className}`}>
      <div className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-zinc-900/95 text-zinc-100 border border-zinc-700 shadow-xl text-[11px] font-mono whitespace-nowrap opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-30">
        {forged ? 'Construção nivelada! · Valheim & Cities: Skylines' : 'Arquiteto de Sistemas & Bases'}
      </div>

      <button
        type="button"
        onClick={() => setForged((f) => !f)}
        aria-label="Sticker de martelo construtor de Valheim e Cities Skylines."
        className={`relative bg-transparent border-0 p-1 transition-all duration-200 rotate-6 group-hover:-rotate-12 group-hover:scale-110 active:scale-90 cursor-pointer focus:outline-none ${
          forged ? '-rotate-45 scale-115' : ''
        }`}
      >
        <svg
          viewBox="0 0 88 88"
          className="w-16 h-16 sm:w-18 sm:h-18 overflow-visible"
          style={{ filter: 'url(#die-cut-sticker)' }}
        >
          {/* Handle */}
          <rect x="39" y="34" width="10" height="44" rx="4" fill="#92400E" />
          <rect x="38" y="66" width="12" height="8" rx="2" fill="#FBBF24" />
          {/* Iron Forge Hammer Head */}
          <path
            d="M16 20 L72 20 L78 30 L72 40 L16 40 L10 30 Z"
            fill="#27272A"
            stroke="#E4E4E7"
            strokeWidth="2"
          />
          <polygon points="44,23 50,30 44,37 38,30" fill="#38BDF8" />
        </svg>
      </button>
    </div>
  );
};

interface ScatteredBgNode {
  id: number;
  title: string;
  baseTop: number;
  baseLeft: number;
  rotation: number;
  duration: number;
  delay: number;
  activeColor: string;
  kind: 'paw' | 'bat' | 'coffee' | 'd20' | 'spark' | 'data' | 'fang' | 'dumbbell';
}

const SCATTERED_BG_SEEDS: ScatteredBgNode[] = [
  {
    id: 1,
    title: 'Morcega · Morceguinha dormindo',
    baseTop: 9,
    baseLeft: 5,
    rotation: -16,
    duration: 5.4,
    delay: 0.2,
    activeColor: 'text-[#E11D48]',
    kind: 'bat'
  },
  {
    id: 2,
    title: 'Grão de Café Torrado ☕',
    baseTop: 15,
    baseLeft: 91,
    rotation: 24,
    duration: 4.8,
    delay: 1.1,
    activeColor: 'text-amber-400',
    kind: 'coffee'
  },
  {
    id: 3,
    title: 'Patinha da Banguela',
    baseTop: 27,
    baseLeft: 12,
    rotation: 19,
    duration: 6.2,
    delay: 0.7,
    activeColor: 'text-emerald-400',
    kind: 'paw'
  },
  {
    id: 4,
    title: 'Runa Tática D20 (BG3 / RPG)',
    baseTop: 34,
    baseLeft: 86,
    rotation: -12,
    duration: 5.9,
    delay: 1.8,
    activeColor: 'text-[#E11D48]',
    kind: 'd20'
  },
  {
    id: 5,
    title: 'Faísca 220V do Tomada ⚡',
    baseTop: 46,
    baseLeft: 4,
    rotation: 14,
    duration: 3.9,
    delay: 0.4,
    activeColor: 'text-amber-400',
    kind: 'spark'
  },
  {
    id: 6,
    title: 'Setor de Diversas · Pin de Dados & Locais',
    baseTop: 53,
    baseLeft: 94,
    rotation: -21,
    duration: 5.1,
    delay: 2.1,
    activeColor: 'text-emerald-400',
    kind: 'data'
  },
  {
    id: 7,
    title: 'Café Expresso Quentinho ☕',
    baseTop: 64,
    baseLeft: 9,
    rotation: -9,
    duration: 4.6,
    delay: 1.4,
    activeColor: 'text-amber-400',
    kind: 'coffee'
  },
  {
    id: 8,
    title: 'Única Presa da Banguela ✨',
    baseTop: 71,
    baseLeft: 89,
    rotation: 15,
    duration: 5.7,
    delay: 0.9,
    activeColor: 'text-[#E11D48]',
    kind: 'fang'
  },
  {
    id: 9,
    title: 'Halter & E-Sports (+1 STR)',
    baseTop: 82,
    baseLeft: 6,
    rotation: -25,
    duration: 6.0,
    delay: 1.6,
    activeColor: 'text-amber-400',
    kind: 'dumbbell'
  },
  {
    id: 10,
    title: 'Rastro do Tomada 220V',
    baseTop: 88,
    baseLeft: 92,
    rotation: -18,
    duration: 4.3,
    delay: 0.3,
    activeColor: 'text-amber-400',
    kind: 'paw'
  }
];

function renderBgGlyph(kind: ScatteredBgNode['kind']) {
  switch (kind) {
    case 'bat':
      return (
        <svg viewBox="0 0 40 28" className="w-8 h-6 fill-current">
          <path d="M20 10 L16 4 L14 9 C8 5, 2 8, 1 16 C6 14, 9 16, 11 20 C14 17, 17 18, 20 22 C23 18, 26 17, 29 20 C31 16, 34 14, 39 16 C38 8, 32 5, 26 9 L24 4 Z" />
        </svg>
      );
    case 'coffee':
      return (
        <svg viewBox="0 0 36 36" className="w-7 h-7 stroke-current fill-none" strokeWidth="2">
          <path d="M13 8 C11 5, 15 3, 13 1 M19 8 C17 5, 21 3, 19 1" strokeLinecap="round" />
          <path d="M8 13 H24 V22 C24 26, 20 29, 16 29 C12 29, 8 26, 8 22 Z" />
          <path d="M24 15 H27 C29 15, 30 17, 30 19 C30 21, 29 23, 27 23 H24" />
        </svg>
      );
    case 'paw':
      return (
        <svg viewBox="0 0 36 36" className="w-7 h-7 fill-current">
          <ellipse cx="18" cy="23" rx="6.5" ry="5.5" />
          <circle cx="9.5" cy="14.5" r="2.8" />
          <circle cx="15" cy="11" r="2.8" />
          <circle cx="21" cy="11" r="2.8" />
          <circle cx="26.5" cy="14.5" r="2.8" />
        </svg>
      );
    case 'd20':
      return (
        <svg viewBox="0 0 36 36" className="w-8 h-8 stroke-current fill-none" strokeWidth="1.8">
          <polygon points="18,3 32,11 32,25 18,33 4,25 4,11" />
          <polygon points="18,9 27,24 9,24" />
        </svg>
      );
    case 'spark':
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7 fill-current">
          <polygon points="18,2 6,18 15,18 12,30 26,13 17,13" />
        </svg>
      );
    case 'data':
      return (
        <svg viewBox="0 0 36 36" className="w-7 h-7 stroke-current fill-none" strokeWidth="2">
          <path d="M18 4 C12 4, 8 8.5, 8 14 C8 21.5, 18 31, 18 31 C18 31, 28 21.5, 28 14 C28 8.5, 24 4, 18 4 Z" />
          <circle cx="18" cy="14" r="3.5" />
        </svg>
      );
    case 'fang':
      return (
        <svg viewBox="0 0 36 36" className="w-7 h-7 stroke-current fill-none" strokeWidth="2">
          <path d="M7 14 Q18 22 29 14" strokeLinecap="round" />
          <polygon points="11,15.5 16,16.5 13,25" className="fill-current" />
        </svg>
      );
    case 'dumbbell':
      return (
        <svg viewBox="0 0 36 36" className="w-7 h-7 stroke-current fill-none" strokeWidth="2.2">
          <line x1="9" y1="18" x2="27" y2="18" strokeLinecap="round" />
          <rect x="4" y="11" width="4" height="14" rx="1.5" className="fill-current" />
          <rect x="28" y="11" width="4" height="14" rx="1.5" className="fill-current" />
        </svg>
      );
  }
}

/**
 * 9. AMBIENT INTERACTIVE BACKGROUND LAYER
 * Randomly scattered, non-aligned floating animated icons across the background canvas!
 */
export const AmbientBackgroundCanvas: React.FC = () => {
  const [litRunes, setLitRunes] = useState<Record<number, boolean>>({});

  // Compute organic randomized jitter once per session so icons are never stiffly aligned
  const randomizedNodes = useMemo(() => {
    return SCATTERED_BG_SEEDS.map((node) => {
      const topJitter = (Math.random() - 0.5) * 4.5;
      const leftJitter = (Math.random() - 0.5) * 3.5;
      const rotJitter = (Math.random() - 0.5) * 18;
      return {
        ...node,
        top: `${Math.max(5, Math.min(93, node.baseTop + topJitter)).toFixed(1)}%`,
        left: `${Math.max(2, Math.min(95, node.baseLeft + leftJitter)).toFixed(1)}%`,
        rot: Math.round(node.rotation + rotJitter)
      };
    });
  }, []);

  const toggleRune = (id: number) => {
    setLitRunes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <StickerSvgDefs />

      {/* Subtle Architectural Dot Grid */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.045] dark:opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '36px 36px'
        }}
        aria-hidden="true"
      />

      {/* Organically Scattered, Non-Aligned Floating Background Icons */}
      <div className="hidden lg:block pointer-events-none fixed inset-0 z-10 overflow-hidden">
        {randomizedNodes.map((node) => {
          const isLit = !!litRunes[node.id];
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => toggleRune(node.id)}
              title={`${node.title} (clique para interagir)`}
              style={{
                top: node.top,
                left: node.left,
                animation: `float-drift ${node.duration}s ease-in-out ${node.delay}s infinite`
              }}
              className={`pointer-events-auto absolute p-2 rounded-full transition-all duration-300 cursor-pointer focus:outline-none ${
                isLit
                  ? `${node.activeColor} scale-125 opacity-95`
                  : 'text-[var(--text-muted)] opacity-25 hover:opacity-80 hover:scale-115'
              }`}
            >
              <div style={{ transform: `rotate(${node.rot}deg)` }}>
                {renderBgGlyph(node.kind)}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
};
