import { useState, useEffect } from "react";
import { hasDecimals } from "../utils/number";

export default function useAnimatedNumber(target, ms = 2500) {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (target == null) return;
    const start = display ?? target;
    const intMode = !hasDecimals(start) && !hasDecimals(target);
    const fps = 30;
    const steps = Math.round((ms / 1000) * fps);
    let s = 0;

    const id = setInterval(() => {
      s++;
      const t = s / steps;
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      let v = start + (target - start) * ease;
      if (intMode) v = Math.round(v);
      setDisplay(v);
      if (s >= steps) clearInterval(id);
    }, 1000 / fps);

    return () => clearInterval(id);
  }, [target]);

  return display;
}
