import { Component, type ComponentType, type ReactNode } from "react";
import { transform } from "sucrase";
import * as React from "react";
import * as Motion from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  Clock,
  Cloud,
  CloudOff,
  Eye,
  Heart,
  LoaderCircle,
  Minus,
  Monitor,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Smartphone,
  Star,
  Target,
  Zap,
} from "lucide-react";
import { StageCard } from "../components/StageCard";
import { StageMorph } from "../components/StageMorph";
import { useStageDock } from "./stage-dock";
import { springs, card, breakpoints, nestedRadius, tilt } from "./tokens";
import { useViewport } from "./viewport";

const LucideIcons = {
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  Clock,
  Cloud,
  CloudOff,
  Eye,
  Heart,
  LoaderCircle,
  Minus,
  Monitor,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Smartphone,
  Star,
  Target,
  Zap,
};

const Lucide = new Proxy(LucideIcons, {
  get(target, prop, receiver) {
    if (typeof prop === "symbol" || prop in target) return Reflect.get(target, prop, receiver);
    return Circle;
  },
});

const modules: Record<string, unknown> = {
  react: React,
  "motion/react": Motion,
  "lucide-react": Lucide,
  "../components/StageCard": { StageCard },
  "../components/StageMorph": { StageMorph },
  "../lib/tokens": { springs, card, breakpoints, nestedRadius, tilt },
  "../lib/stage-dock": { useStageDock },
  "../lib/viewport": { useViewport },
};

function resolve(specifier: string) {
  const key = specifier.replace(/\\/g, "/").replace(/\.tsx?$/, "");
  return modules[key] ?? modules[specifier];
}

export function compileStudy(source: string): ComponentType | null {
  const { code } = transform(source, {
    transforms: ["typescript", "jsx", "imports"],
    production: true,
    filePath: "Study.tsx",
  });
  const exports: Record<string, unknown> = {};
  const require = (name: string) => {
    const mod = resolve(name);
    if (!mod) throw new Error(`Import not allowed: ${name}`);
    return mod;
  };
  const run = new Function("exports", "require", "module", "React", code);
  run(exports, require, { exports }, React);
  const candidate = exports.default ?? Object.values(exports).find((value) => typeof value === "function");
  return typeof candidate === "function" ? (candidate as ComponentType) : null;
}

type BoundaryProps = { fallback: ReactNode | ((error: string) => ReactNode); children: ReactNode };

type BoundaryState = { error: string | null };

export class StudyBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error: error.message || String(error) };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error("[study]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      const { fallback } = this.props;
      return typeof fallback === "function" ? fallback(this.state.error) : fallback;
    }
    return this.props.children;
  }
}
