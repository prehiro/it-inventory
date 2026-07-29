"use client";

import React, { useState, useEffect, CSSProperties } from "react";

export interface BackgroundSceneProps {
  /** Number of animated light beams */
  beamCount?: number;
  className?: string;
}

const BACKGROUND_BEAM_COUNT = 60;

const BackgroundScene: React.FC<BackgroundSceneProps> = ({
  beamCount = BACKGROUND_BEAM_COUNT,
  className = "",
}) => {
  const [beams, setBeams] = useState<Array<{ id: number; style: CSSProperties }>>([]);

  useEffect(() => {
    const generated = Array.from({ length: beamCount }).map((_, i) => {
      const fallDur = Math.random() * 3 + 3;   // 3–6s fall
      const fadeDur = fallDur;                  // sync fade

      return {
        id: i,
        style: {
          left: `${Math.random() * 100}%`,
          width: `${Math.floor(Math.random() * 3) + 1}px`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${fallDur}s, ${fadeDur}s`,
        } as CSSProperties,
      };
    });
    setBeams(generated);
  }, [beamCount]);

  return (
    <div
      className={`scene ${className}`}
      role="img"
      aria-label="Animated digital data background"
    >
      {/* 3D perspective floor with grid lines */}
      <div className="floor">
        <div className="floor-grid" />
      </div>

      {/* Falling light beams */}
      <div className="light-stream-container">
        {beams.map((beam) => (
          <div key={beam.id} className="light-beam" style={beam.style} />
        ))}
      </div>

      {/* Top-down radial gradient fade overlay */}
      <div className="scene-fade" />
    </div>
  );
};

export default React.memo(BackgroundScene);
