import { useRef } from "react";
import { useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { springs, tilt } from "./tokens";

export function useCardTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const held = useRef(false);
  const reduce = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(rawX, springs.soft);
  const rotateY = useSpring(rawY, springs.soft);

  const point = (clientX: number, clientY: number) => {
    const node = ref.current;
    if (!node || reduce) return;
    const box = node.getBoundingClientRect();
    if (box.width < 8 || box.height < 8) return;
    const px = (clientX - box.left) / box.width - 0.5;
    const py = (clientY - box.top) / box.height - 0.5;
    rawX.set(-py * tilt.max * 2);
    rawY.set(px * tilt.max * 2);
  };

  const reset = () => {
    held.current = false;
    rawX.set(0);
    rawY.set(0);
  };

  const onPointerEnter = (clientX: number, clientY: number, pointerType: string) => {
    if (pointerType === "mouse") point(clientX, clientY);
  };

  const onPointerDown = (clientX: number, clientY: number, pointerType: string) => {
    if (pointerType !== "mouse") held.current = true;
    point(clientX, clientY);
  };

  const onPointerMove = (clientX: number, clientY: number, pointerType: string) => {
    if (pointerType !== "mouse" && !held.current) return;
    point(clientX, clientY);
  };

  return { ref, rotateX, rotateY, onPointerEnter, onPointerDown, onPointerMove, reset, reduce };
}
