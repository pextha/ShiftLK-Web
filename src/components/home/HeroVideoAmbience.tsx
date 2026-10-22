'use client';

import React, { useState, useRef, useEffect } from 'react';

const VIDEO_PLAYLIST = [
  '/videos/IMG_4279.MP4',
  '/videos/IMG_4280.MP4',
  '/videos/IMG_4281.MP4',
  '/videos/IMG_4282.MP4',
  '/videos/IMG_4283.MP4',
  '/videos/IMG_4284.MP4',
  '/videos/IMG_4285.MP4',
];

export default function HeroVideoAmbience() {
  // Left side starts at index 0, Right side starts at index 3 for distinct visuals
  const [leftIndex, setLeftIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(3);

  const [leftFade, setLeftFade] = useState(false);
  const [rightFade, setRightFade] = useState(false);

  const leftVideoRef = useRef<HTMLVideoElement | null>(null);
  const rightVideoRef = useRef<HTMLVideoElement | null>(null);

  // Auto advance left side video on end
  const handleLeftEnded = () => {
    setLeftFade(true);
    setTimeout(() => {
      setLeftIndex((prev) => (prev + 1) % VIDEO_PLAYLIST.length);
      setLeftFade(false);
    }, 500);
  };

  // Auto advance right side video on end
  const handleRightEnded = () => {
    setRightFade(true);
    setTimeout(() => {
      setRightIndex((prev) => (prev + 1) % VIDEO_PLAYLIST.length);
      setRightFade(false);
    }, 500);
  };

  // Ensure playback on index update
  useEffect(() => {
    if (leftVideoRef.current) {
      leftVideoRef.current.play().catch(() => {});
    }
  }, [leftIndex]);

  useEffect(() => {
    if (rightVideoRef.current) {
      rightVideoRef.current.play().catch(() => {});
    }
  }, [rightIndex]);

  const leftSrc = VIDEO_PLAYLIST[leftIndex];
  const rightSrc = VIDEO_PLAYLIST[rightIndex];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* ========================================================
          FULL COVER 50/50 SPLIT-SCREEN VIDEO BACKGROUND ENGINE
          Left 50% = Video L | Right 50% = Video R
         ======================================================== */}
      <div className="absolute inset-0 grid grid-cols-2 gap-1 md:gap-1.5 bg-slate-950">
        
        {/* ====================================================
            LEFT HALF VIDEO (Covers Left 0% to 50%)
           ==================================================== */}
        <div className="relative w-full h-full overflow-hidden bg-slate-950">
          {/* Subtle neon glow under the left video */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-brand-neon/15 rounded-full blur-3xl" />

          <video
            ref={leftVideoRef}
            key={`left-${leftSrc}`}
            src={leftSrc}
            autoPlay
            muted
            playsInline
            onEnded={handleLeftEnded}
            onError={handleLeftEnded}
            className={`w-full h-full object-cover transition-opacity duration-700 ${
              leftFade ? 'opacity-0' : 'opacity-55 sm:opacity-50 md:opacity-45'
            }`}
          />

          {/* Left Video Gradient Overlays:
              - Fade toward center dividing line
              - Fade from left edge
              - Top & Bottom page blend
          */}
          {/* Center-directed inner gradient (blends toward middle seam) */}
          <div className="absolute inset-y-0 right-0 w-28 sm:w-44 md:w-64 bg-gradient-to-r from-transparent via-slate-950/75 to-slate-950" />
          {/* Left edge fade */}
          <div className="absolute inset-y-0 left-0 w-12 sm:w-20 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />
          {/* Top fade */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-slate-950 via-slate-950/60 to-transparent" />
          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent" />
        </div>

        {/* ====================================================
            RIGHT HALF VIDEO (Covers Right 50% to 100%)
           ==================================================== */}
        <div className="relative w-full h-full overflow-hidden bg-slate-950">
          {/* Subtle cyan/emerald glow under the right video */}
          <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl" />

          <video
            ref={rightVideoRef}
            key={`right-${rightSrc}`}
            src={rightSrc}
            autoPlay
            muted
            playsInline
            onEnded={handleRightEnded}
            onError={handleRightEnded}
            className={`w-full h-full object-cover transition-opacity duration-700 ${
              rightFade ? 'opacity-0' : 'opacity-55 sm:opacity-50 md:opacity-45'
            }`}
          />

          {/* Right Video Gradient Overlays:
              - Fade toward center dividing line
              - Fade from right edge
              - Top & Bottom page blend
          */}
          {/* Center-directed inner gradient (blends toward middle seam) */}
          <div className="absolute inset-y-0 left-0 w-28 sm:w-44 md:w-64 bg-gradient-to-l from-transparent via-slate-950/75 to-slate-950" />
          {/* Right edge fade */}
          <div className="absolute inset-y-0 right-0 w-12 sm:w-20 bg-gradient-to-l from-slate-950 via-slate-950/40 to-transparent" />
          {/* Top fade */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-slate-950 via-slate-950/60 to-transparent" />
          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent" />
        </div>
      </div>

      {/* ========================================================
          CENTER SEAM & VERTICAL DIVIDER GRADIENT
          (Where the user drew the vertical line down the middle)
         ======================================================== */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-48 sm:w-80 md:w-[480px] pointer-events-none flex items-center justify-center">
        {/* Soft dark blending gradient pillar down the middle */}
        <div className="w-full h-full bg-gradient-to-r from-transparent via-slate-950/95 to-transparent" />
        
        {/* Subtle high-tech vertical dividing hairline */}
        <div className="absolute inset-y-10 w-px bg-gradient-to-b from-transparent via-brand-neon/35 to-transparent opacity-70" />
      </div>

      {/* ========================================================
          RADIAL VIGNETTE (Center reading spotlight)
          Ensures Hero title, subtitle, and buttons remain ultra-crisp & high-contrast
         ======================================================== */}
      <div className="absolute inset-0 bg-slate-950/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,8,13,0.92)_0%,rgba(6,8,13,0.65)_45%,rgba(6,8,13,0.3)_100%)]" />

      {/* Extreme top & bottom edge blend into surrounding page sections */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-950 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 to-transparent" />
    </div>
  );
}
