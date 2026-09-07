import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FinancialCardViewModel } from '../../types/finance';
import { BalanceCard } from './cards/BalanceCard';
import { EarningsCard } from './cards/EarningsCard';
import { PayoutCard } from './cards/PayoutCard';

interface FinancialCardSceneProps {
  data: FinancialCardViewModel;
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  onOpenPayout?: () => void;
  onUserInteraction?: () => void;
}

export const FinancialCardScene: React.FC<FinancialCardSceneProps> = ({
  data,
  activeIndex,
  onSelectIndex,
  onOpenPayout,
  onUserInteraction,
}) => {
  // Parallax subtle tilt for active card (rotateX ±2°, rotateY ±3°)
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag & Swipe gesture state
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const dragDistanceRef = useRef<number>(0);
  const [dragOffset, setDragOffset] = useState<number>(0);

  // Mouse Parallax Handler (Active card only)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // Constrain strictly to ±2° for X (pitch), ±3° for Y (yaw)
    const rotY = Number(((x / (rect.width / 2)) * 3).toFixed(2));
    const rotX = Number((-(y / (rect.height / 2)) * 2).toFixed(2));

    setTilt({ x: rotX, y: rotY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    if (isDraggingRef.current) {
      handleDragEnd();
    }
  }, []);

  // Drag start
  const handleDragStart = (clientX: number) => {
    isDraggingRef.current = true;
    startXRef.current = clientX;
    dragDistanceRef.current = 0;
    onUserInteraction?.();
  };

  // Drag move
  const handleDragMove = (clientX: number) => {
    if (!isDraggingRef.current) return;
    const delta = clientX - startXRef.current;
    dragDistanceRef.current = delta;
    // Cap visual drag offset for stability
    const cappedDelta = Math.max(-120, Math.min(120, delta));
    setDragOffset(cappedDelta);
  };

  // Drag end / Swipe trigger
  const handleDragEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const distance = dragDistanceRef.current;
    setDragOffset(0);

    const threshold = 45; // 45px threshold for swipe
    if (distance > threshold) {
      // Swiped right -> go to previous
      onSelectIndex((activeIndex - 1 + 3) % 3);
      onUserInteraction?.();
    } else if (distance < -threshold) {
      // Swiped left -> go to next
      onSelectIndex((activeIndex + 1) % 3);
      onUserInteraction?.();
    }
  };

  // Card items array
  const cards = [
    {
      id: 'balance',
      component: (
        <BalanceCard
          data={data}
          onOpenPayout={onOpenPayout}
          isActive={activeIndex === 0}
        />
      ),
    },
    {
      id: 'earnings',
      component: (
        <EarningsCard
          data={data}
          isActive={activeIndex === 1}
        />
      ),
    },
    {
      id: 'payout',
      component: (
        <PayoutCard
          data={data}
          onOpenPayout={onOpenPayout}
          isActive={activeIndex === 2}
        />
      ),
    },
  ];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={(e) => handleDragStart(e.clientX)}
      onMouseMoveCapture={(e) => isDraggingRef.current && handleDragMove(e.clientX)}
      onMouseUp={handleDragEnd}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
      onTouchEnd={handleDragEnd}
      className="relative w-full max-w-4xl mx-auto h-[260px] sm:h-[280px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      style={{
        perspective: '1200px',
        perspectiveOrigin: '50% 50%',
      }}
    >
      {cards.map((card, idx) => {
        // Calculate relative position to activeIndex (-1: prev, 0: active, 1: next)
        let diff = (idx - activeIndex + 3) % 3;
        if (diff === 2) diff = -1; // wrap around so 2 is prev

        const isActive = diff === 0;
        const isPrev = diff === -1;
        const isNext = diff === 1;

        // Base 3D Spatial Geometry based on ТЗ specification:
        // Active: scale 1, rotateY 0° (or mouse tilt), translateZ +35px
        // Prev: scale ~0.92, rotateY +11°, translateX -14%, translateZ -60px, opacity 0.55
        // Next: scale ~0.92, rotateY -11°, translateX +14%, translateZ -60px, opacity 0.55
        let transform = '';
        let opacity = 1;
        let zIndex = 20;

        if (isActive) {
          const activeRotX = tilt.x;
          const activeRotY = tilt.y;
          const dragX = dragOffset * 0.4;
          transform = `translate3d(${dragX}px, 0, 35px) scale(1) rotateY(${activeRotY}deg) rotateX(${activeRotX}deg)`;
          opacity = 1;
          zIndex = 30;
        } else if (isPrev) {
          transform = `translate3d(-14%, 0, -65px) scale(0.91) rotateY(12deg)`;
          opacity = 0.55;
          zIndex = 10;
        } else if (isNext) {
          transform = `translate3d(14%, 0, -65px) scale(0.91) rotateY(-12deg)`;
          opacity = 0.55;
          zIndex = 10;
        }

        return (
          <div
            key={card.id}
            onClick={() => {
              if (!isActive) {
                onSelectIndex(idx);
                onUserInteraction?.();
              }
            }}
            className="absolute top-0 w-[88%] sm:w-[500px] md:w-[540px] h-full transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] origin-center will-change-transform"
            style={{
              transform,
              opacity,
              zIndex,
              cursor: isActive ? 'default' : 'pointer',
              filter: isActive ? 'none' : 'brightness(0.85)',
              transformStyle: 'preserve-3d',
            }}
          >
            {card.component}
          </div>
        );
      })}
    </div>
  );
};
