"use client";

import React, { useState, useRef } from "react";

export function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    
    // Centre de l'élément
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    // Distance entre la souris et le centre de l'élément
    const x = clientX - centerX;
    const y = clientY - centerY;

    // Sensibilité magnétique (coefficient multiplicateur)
    const strength = 0.3; 
    
    setPosition({ x: x * strength, y: y * strength });
  };

  const handleMouseLeave = () => {
    // Retour à la position d'origine
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: position.x === 0 && position.y === 0 
          ? "transform 0.6s cubic-bezier(0.19, 1, 0.22, 1)" 
          : "transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)",
        willChange: "transform",
      }}
      className="inline-block"
    >
      {children}
    </div>
  );
}
