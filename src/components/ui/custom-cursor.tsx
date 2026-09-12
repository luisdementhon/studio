"use client";

import { useEffect, useRef } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Désactiver sur mobile/tactile
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) {
      if (dotRef.current) dotRef.current.style.display = "none";
      return;
    }

    const dot = dotRef.current;
    if (!dot) return;

    const dotInner = dot.firstElementChild as HTMLElement;
    if (!dotInner) return;

    let mouseX = -100, mouseY = -100;
    let isHovered = false;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('a, button, [role="button"], input, select, textarea, .interactive-hover')) {
        isHovered = true;
      } else {
        isHovered = false;
      }
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseover", onMouseOver);

    const animate = () => {
      dot.style.transform = `translate3d(${mouseX - 4}px, ${mouseY - 4}px, 0)`;

      if (isHovered) {
        dotInner.style.transform = "scale(1.8)";
      } else {
        dotInner.style.transform = "scale(1)";
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onMouseOver);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={dotRef}
      className="fixed top-0 left-0 z-[9999] pointer-events-none"
      style={{ willChange: "transform" }}
    >
      <div className="w-2.5 h-2.5 rounded-full bg-brand-coral transition-transform duration-200 ease-out shadow-sm" />
    </div>
  );
}
