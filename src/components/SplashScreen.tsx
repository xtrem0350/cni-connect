import { useEffect, useState } from "react";
import logo from "@/assets/images/profile.png";

interface SplashScreenProps {
  duration?: number;
}

export function SplashScreen({ duration = 2500 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setIsExiting(true), duration);
    const removeTimer = window.setTimeout(() => setIsVisible(false), duration + 500);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
    };
  }, [duration]);

  if (!isVisible) return null;

  return (
    <div
      className={`splash-screen${isExiting ? " splash-screen--exiting" : ""}`}
      role="status"
      aria-label="Chargement de GogoSoft"
    >
      <div className="splash-screen__glow splash-screen__glow--top" aria-hidden="true" />
      <div className="splash-screen__glow splash-screen__glow--bottom" aria-hidden="true" />

      <div className="splash-screen__content">
        <div className="splash-screen__logo-wrap">
          <img src={logo} alt="GogoSoft" className="splash-screen__logo" />
        </div>

        <div className="splash-screen__copy">
          <h1>GogoSoft</h1>
          <p>Technology Solutions</p>
        </div>

        <div className="splash-screen__loader" aria-hidden="true">
          <span />
        </div>
      </div>

      <p className="splash-screen__version">v1.0.0</p>
    </div>
  );
}