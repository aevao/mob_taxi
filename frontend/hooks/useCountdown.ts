import { useCallback, useEffect, useState } from "react";

/** Seconds-remaining timer, e.g. for "Resend code in 42s". */
export function useCountdown(initialSeconds: number) {
  const [endsAt, setEndsAt] = useState(() => Date.now() + initialSeconds * 1000);
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    const tick = () =>
      setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [endsAt]);

  const restart = useCallback((seconds: number) => {
    setEndsAt(Date.now() + seconds * 1000);
  }, []);

  return { remaining, restart };
}
