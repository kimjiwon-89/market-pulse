import { useState, useEffect } from "react";

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

function checkMarketOpen(): boolean {
  const kst = new Date(Date.now() + 9 * 3_600_000);
  const day = kst.getUTCDay(); // 0=일, 6=토
  if (day === 0 || day === 6) return false;
  const min = kst.getUTCHours() * 60 + kst.getUTCMinutes();
  return min >= 540 && min < 930; // 09:00 ~ 15:30 KST
}

export function useIsMarketOpen() {
  const [open, setOpen] = useState(checkMarketOpen);
  useEffect(() => {
    const id = setInterval(() => setOpen(checkMarketOpen()), 60_000);
    return () => clearInterval(id);
  }, []);
  return open;
}
