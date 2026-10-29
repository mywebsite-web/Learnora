import React, { useId } from 'react';

export interface AiRobotMascotProps {
  variant?: 'waving' | 'winking' | 'banner' | 'mini' | 'celebrate' | 'face';
  size?: number;
  className?: string;
  showBubble?: boolean;
}

export const AiRobotMascot: React.FC<AiRobotMascotProps> = ({
  variant = 'waving',
  size = 220,
  className = '',
  showBubble = false
}) => {
  // Generate isolated IDs for gradients to prevent duplicate ID DOM collisions that blur SVG renders
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9]/g, '');

  const bodyWhiteGradId = `robot-body-${id}`;
  const royalBlueGradId = `robot-blue-${id}`;
  const visorGradId = `robot-visor-${id}`;
  const cyanEyeGradId = `robot-eye-${id}`;
  const softShadowId = `robot-shadow-${id}`;
  const cheekBlushId = `robot-blush-${id}`;
  const glassSheenId = `robot-sheen-${id}`;

  const isFaceOnly = variant === 'mini' || variant === 'face';
  const isWinking = variant === 'winking';

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {/* Speech Bubble (matching Screen 2 from Figma UI Kit) */}
      {showBubble && !isFaceOnly && (
        <div className="absolute -top-3.5 -right-3.5 sm:-right-5 z-20 animate-bounce duration-1000 pointer-events-none">
          <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-2 sm:p-2.5 rounded-2xl shadow-md shadow-blue-500/30 border border-blue-300/40 flex items-center justify-center">
            {/* Robot face glyph inside speech bubble */}
            <svg width="22" height="20" viewBox="0 0 24 22" fill="none" xmlns="http://www.w3.org/2000/svg" shapeRendering="geometricPrecision">
              <rect x="2" y="4" width="20" height="15" rx="5" fill="white" />
              {/* Screen visor */}
              <rect x="5" y="7" width="14" height="9" rx="3" fill="#1D4ED8" />
              {/* Cyan glowing eyes */}
              <circle cx="9" cy="11.5" r="1.8" fill="#38BDF8" />
              <circle cx="15" cy="11.5" r="1.8" fill="#38BDF8" />
              {/* Mini antenna */}
              <path d="M12 4V1" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="1" r="1.5" fill="#38BDF8" />
            </svg>
            {/* Bubble tail */}
            <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-indigo-600 rotate-45" />
          </div>
        </div>
      )}

      {/* SVG AI Robot Mascot - Crisp Geometric Precision, No Filter Raster Blur */}
      <svg
        width={size}
        height={size}
        viewBox={isFaceOnly ? "36 14 168 136" : "0 0 240 240"}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
        className="transition-transform duration-300 hover:scale-105"
        style={{
          filter: 'none',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
        }}
      >
        <defs>
          {/* Head & Body White Ceramic Gradient with crisp luminous sheen */}
          <linearGradient id={bodyWhiteGradId} x1="60" y1="30" x2="180" y2="210" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#F1F5F9" />
            <stop offset="85%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Royal Blue Accent Gradient */}
          <linearGradient id={royalBlueGradId} x1="0" y1="0" x2="240" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          {/* Cyan Glow Visor Gradient - High Contrast Obsidian Glass */}
          <linearGradient id={visorGradId} x1="70" y1="58" x2="170" y2="126" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="40%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          {/* Glowing Eye Cyan - Radiant Turquoise Neon */}
          <linearGradient id={cyanEyeGradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#67E8F9" />
            <stop offset="40%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>

          {/* Cute Rosy Baby Face Blush Gradient */}
          <radialGradient id={cheekBlushId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FB7185" stopOpacity="0.75" />
            <stop offset="60%" stopColor="#F43F5E" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
          </radialGradient>

          {/* Visor Glass Sheen Gradient */}
          <linearGradient id={glassSheenId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
            <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.02" />
          </linearGradient>

          {/* Vector Ambient Ground Floating Shadow */}
          <radialGradient id={softShadowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.4" />
            <stop offset="65%" stopColor="#2563EB" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Ground Floating Shadow (Full Body only) */}
        {!isFaceOnly && (
          <ellipse cx="120" cy="225" rx="52" ry="10" fill={`url(#${softShadowId})`} />
        )}

        {/* --- LOWER FLOATING THRUSTER / POD (Full Body only) --- */}
        {!isFaceOnly && (
          <>
            <path
              d="M95 186 C95 186, 105 212, 120 212 C135 212, 145 186, 145 186 Z"
              fill={`url(#${royalBlueGradId})`}
            />
            <ellipse cx="120" cy="205" rx="14" ry="4" fill="#60A5FA" opacity="0.9" />
            <ellipse cx="120" cy="208" rx="8" ry="2" fill="#93C5FD" />
          </>
        )}

        {/* --- ROBOT TORSO (Full Body only) --- */}
        {!isFaceOnly && (
          <>
            {/* Main Chest Body */}
            <path
              d="M86 138 C84 138, 80 148, 82 172 C83 186, 96 194, 120 194 C144 194, 157 186, 158 172 C160 148, 156 138, 154 138 Z"
              fill={`url(#${bodyWhiteGradId})`}
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />

            {/* Royal Blue Chest Plate Center */}
            <path
              d="M98 146 C98 144, 102 142, 120 142 C138 142, 142 144, 142 146 C143 158, 141 172, 120 172 C99 172, 97 158, 98 146 Z"
              fill={`url(#${royalBlueGradId})`}
            />
            <circle cx="120" cy="157" r="4.5" fill="#38BDF8" />
            <circle cx="118.5" cy="155.5" r="1.5" fill="#FFFFFF" />

            {/* Neck Ring */}
            <ellipse cx="120" cy="136" rx="22" ry="7" fill={`url(#${royalBlueGradId})`} />
          </>
        )}

        {/* --- ROBOT ARMS (Full Body only) --- */}
        {!isFaceOnly && (
          <>
            {/* Left Arm */}
            <g>
              <circle cx="76" cy="146" r="9" fill={`url(#${royalBlueGradId})`} />
              <path
                d="M74 150 C70 162, 64 174, 60 184 C56 194, 66 198, 70 190 C74 182, 80 168, 82 156 Z"
                fill={`url(#${bodyWhiteGradId})`}
                stroke="#CBD5E1"
                strokeWidth="1.2"
              />
              <ellipse cx="60" cy="190" rx="7" ry="8" fill={`url(#${royalBlueGradId})`} />
            </g>

            {/* Right Arm */}
            {variant !== 'banner' ? (
              <g>
                <circle cx="164" cy="146" r="9" fill={`url(#${royalBlueGradId})`} />
                <path
                  d="M167 142 C178 132, 188 116, 192 102 C196 90, 185 86, 180 96 C175 106, 168 124, 162 136 Z"
                  fill={`url(#${bodyWhiteGradId})`}
                  stroke="#CBD5E1"
                  strokeWidth="1.2"
                />
                <ellipse cx="193" cy="94" rx="8" ry="9" fill={`url(#${royalBlueGradId})`} />
                <circle cx="196" cy="85" r="4" fill={`url(#${royalBlueGradId})`} />
              </g>
            ) : (
              <g>
                <circle cx="164" cy="146" r="9" fill={`url(#${royalBlueGradId})`} />
                <path
                  d="M166 150 C170 162, 176 174, 180 184 C184 194, 174 198, 170 190 C166 182, 160 168, 158 156 Z"
                  fill={`url(#${bodyWhiteGradId})`}
                  stroke="#CBD5E1"
                  strokeWidth="1.2"
                />
                <ellipse cx="180" cy="190" rx="7" ry="8" fill={`url(#${royalBlueGradId})`} />
              </g>
            )}
          </>
        )}

        {/* --- CUTE AI BABY FACE & HEAD (Sharp, Detailed, High-Definition) --- */}
        
        {/* Top Antenna Orb & Stem */}
        <g>
          {/* Antenna Stem */}
          <path d="M120 42 L120 23" stroke={`url(#${royalBlueGradId})`} strokeWidth="3" strokeLinecap="round" />
          {/* Antenna Glowing Orb */}
          <circle cx="120" cy="20" r="5.5" fill={`url(#${cyanEyeGradId})`} />
          <circle cx="118.5" cy="18.5" r="1.8" fill="#FFFFFF" />
        </g>

        {/* Antenna Ears (Left & Right Audio Sensors) */}
        <g>
          {/* Left Ear Antenna */}
          <rect x="42" y="78" width="13" height="26" rx="6.5" fill={`url(#${royalBlueGradId})`} transform="rotate(-15 42 78)" />
          <circle cx="46" cy="73" r="5" fill="#38BDF8" />
          <circle cx="45" cy="72" r="1.6" fill="#FFFFFF" />

          {/* Right Ear Antenna */}
          <rect x="185" y="72" width="13" height="26" rx="6.5" fill={`url(#${royalBlueGradId})`} transform="rotate(15 185 72)" />
          <circle cx="194" cy="73" r="5" fill="#38BDF8" />
          <circle cx="193" cy="72" r="1.6" fill="#FFFFFF" />
        </g>

        {/* Main Head Shell (Ultra-Smooth Rounded 3D Ceramic Pebble Shape) */}
        <rect
          x="52"
          y="42"
          width="136"
          height="100"
          rx="44"
          fill={`url(#${bodyWhiteGradId})`}
          stroke="#CBD5E1"
          strokeWidth="1.8"
        />

        {/* Gloss highlight on top curve of head */}
        <path
          d="M80 47 C92 45, 148 45, 160 47 C168 49, 172 54, 164 57 C146 55, 94 55, 76 57 C68 54, 72 49, 80 47 Z"
          fill="#FFFFFF"
          opacity="0.95"
        />

        {/* Visor Screen (Deep Midnight Obsidian Glass) */}
        <rect
          x="68"
          y="58"
          width="104"
          height="68"
          rx="28"
          fill={`url(#${visorGradId})`}
          stroke="#0F172A"
          strokeWidth="2"
        />

        {/* Visor Specular Glass Reflection Sheen */}
        <path
          d="M72 70 C88 62, 144 62, 164 70 C168 73, 160 84, 148 82 C120 78, 90 80, 74 88 C70 86, 68 76, 72 70 Z"
          fill={`url(#${glassSheenId})`}
        />

        {/* --- CUTE BABY FACE CHEEK BLUSH (Adorable Soft Pink Glow) --- */}
        <ellipse cx="82" cy="108" rx="8" ry="4.5" fill={`url(#${cheekBlushId})`} />
        <ellipse cx="158" cy="108" rx="8" ry="4.5" fill={`url(#${cheekBlushId})`} />

        {/* --- RADIANT DIGITAL CYAN EYES (Ultra-Sharp Specs & Catchlights) --- */}
        {isWinking ? (
          <g>
            {/* Left Eye: Open, Radiant, Sparkly */}
            <circle cx="97" cy="91" r="13" fill={`url(#${cyanEyeGradId})`} />
            <circle cx="97" cy="91" r="14.5" fill="none" stroke="#38BDF8" strokeWidth="1" opacity="0.6" />
            <circle cx="93.5" cy="87.5" r="4.5" fill="#FFFFFF" />
            <ellipse cx="101" cy="95.5" rx="2.8" ry="1.6" fill="#A5F3FC" opacity="0.85" />

            {/* Right Eye: Friendly Cute Winking Curve */}
            <path
              d="M131 93 C135 84, 147 84, 151 93"
              stroke="#38BDF8"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            {/* Sparkle star beside winking eye */}
            <path
              d="M156 86 L157.5 89 L160.5 89.5 L158 91.5 L159 94.5 L156 93 L153 94.5 L154 91.5 L151.5 89.5 L154.5 89 Z"
              fill="#FFFFFF"
              opacity="0.9"
            />
          </g>
        ) : (
          <g>
            {/* Left Eye */}
            <circle cx="97" cy="91" r="13" fill={`url(#${cyanEyeGradId})`} />
            <circle cx="97" cy="91" r="14.5" fill="none" stroke="#38BDF8" strokeWidth="1" opacity="0.6" />
            <circle cx="93.5" cy="87.5" r="4.5" fill="#FFFFFF" />
            <ellipse cx="101" cy="95.5" rx="2.8" ry="1.6" fill="#A5F3FC" opacity="0.85" />

            {/* Right Eye */}
            <circle cx="143" cy="91" r="13" fill={`url(#${cyanEyeGradId})`} />
            <circle cx="143" cy="91" r="14.5" fill="none" stroke="#38BDF8" strokeWidth="1" opacity="0.6" />
            <circle cx="139.5" cy="87.5" r="4.5" fill="#FFFFFF" />
            <ellipse cx="147" cy="95.5" rx="2.8" ry="1.6" fill="#A5F3FC" opacity="0.85" />
          </g>
        )}

        {/* Cute Baby Smile Line */}
        <path
          d="M112 110 C116 115, 124 115, 128 110"
          stroke="#38BDF8"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.95"
        />
      </svg>
    </div>
  );
};
