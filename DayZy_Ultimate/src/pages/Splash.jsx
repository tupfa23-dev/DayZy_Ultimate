import DayZyLogo from "../assets/logo.png";
import React, { useEffect, useState } from "react";

export default function Splash({ onEnd }) {
  const [isLoading, setIsLoading] = useState(true);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate particles
    setParticles(
      [...Array(50)].map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 5 + 2,
        duration: Math.random() * 10 + 8,
        delay: Math.random() * 2,
        opacity: Math.random() * 0.6 + 0.3,
      }))
    );

    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    if (onEnd) onEnd();
  };

  return (
    <div className="splash-container">
      {/* Animated gradient background */}
      <div className="splash-bg"></div>

      {/* Floating blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      {/* Particles */}
      <div className="particles-layer">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: p.x + "%",
              top: p.y + "%",
              width: p.size + "px",
              height: p.size + "px",
              "--duration": p.duration + "s",
              "--delay": p.delay + "s",
              "--opacity": p.opacity,
            }}
          />
        ))}
      </div>

      {/* Grid */}
      <div className="grid-bg"></div>

      <div className="splash-content">
        {/* Logo with glow */}
        <div className="logo-container">
          <div className="logo-shine"></div>
          <img src={DayZyLogo} alt="DayZy" className="logo-image" />
          <div className="logo-glow"></div>
        </div>

        {/* Title */}
        <div className="title-container">
          <h1 className="splash-title">DayZy</h1>
          <div className="title-underline"></div>
        </div>
        <p className="splash-subtitle">Master Your Schedule</p>

        {/* Loading */}
        {isLoading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p className="loading-text">Initializing...</p>
          </div>
        )}

        {/* Button */}
        {!isLoading && (
          <button className="cta-button" onClick={handleLogin}>
            <span className="button-text">START PLANNING</span>
            <svg
              className="button-icon"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M5 12h14M12 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Glow orbs */}
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>
      <div className="glow-orb orb-3"></div>
    </div>
  );
}

const styles = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.splash-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-family: 'Inter', 'Helvetica Neue', sans-serif;
  background: #0a0e1a;
  overflow: hidden;
}

/* Background */
.splash-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(-45deg, #0a0e1a, #1a1f3a, #0d1117, #0a0e1a);
  background-size: 400% 400%;
  animation: bgShift 15s ease infinite;
  z-index: 1;
}

@keyframes bgShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Floating blobs */
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.25;
  mix-blend-mode: screen;
  z-index: 2;
}

.blob-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #a855f7 0%, transparent 70%);
  top: -150px;
  left: -100px;
  animation: float 10s ease-in-out infinite;
}

.blob-2 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, #7c3aed 0%, transparent 70%);
  bottom: -100px;
  right: -50px;
  animation: float 12s ease-in-out infinite reverse;
}

.blob-3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #d8b4fe 0%, transparent 70%);
  top: 40%;
  right: 5%;
  animation: float 14s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-50px) translateX(30px); }
}

/* Particles */
.particles-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.particle {
  position: absolute;
  background: radial-gradient(circle, #a855f7 0%, #7c3aed 100%);
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.9);
  opacity: var(--opacity);
  animation: particleFloat var(--duration) linear infinite;
  animation-delay: var(--delay);
}

@keyframes particleFloat {
  0% {
    transform: translateY(100vh) translateX(0);
    opacity: 0;
  }
  5% {
    opacity: var(--opacity);
  }
  95% {
    opacity: var(--opacity);
  }
  100% {
    transform: translateY(-100vh) translateX(80px);
    opacity: 0;
  }
}

/* Grid */
.grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(168, 85, 247, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(168, 85, 247, 0.06) 1px, transparent 1px);
  background-size: 60px 60px;
  z-index: 2;
  animation: gridMove 15s linear infinite;
}

@keyframes gridMove {
  0% { transform: translateY(0); }
  100% { transform: translateY(60px); }
}

/* Content */
.splash-content {
  position: relative;
  z-index: 10;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 35px;
  animation: contentFadeIn 1s ease-out;
}

@keyframes contentFadeIn {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Logo */
.logo-container {
  position: relative;
  width: 320px;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: logoFloat 3s ease-in-out infinite;
}

@keyframes logoFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.logo-shine {
  position: absolute;
  inset: -20px;
  background: radial-gradient(circle at 30% 30%, rgba(168, 85, 247, 0.4) 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(40px);
  animation: shinePulse 3s ease-in-out infinite;
}

@keyframes shinePulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

.logo-glow {
  position: absolute;
  inset: 0;
  border: 2px solid transparent;
  border-radius: 50%;
  border-top-color: rgba(168, 85, 247, 0.6);
  border-right-color: rgba(168, 85, 247, 0.2);
  animation: rotate 4s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.logo-image {
  position: relative;
  z-index: 5;
  width: 75%;
  height: 75%;
  object-fit: contain;
  filter: drop-shadow(0 0 25px rgba(168, 85, 247, 0.7));
}

/* Title */
.title-container {
  position: relative;
}

.splash-title {
  font-size: 68px;
  font-weight: 900;
  letter-spacing: -2px;
  text-transform: uppercase;
  background: linear-gradient(135deg, #a855f7 0%, #d8b4fe 50%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 15px 0;
  animation: titleGlow 2s ease-in-out infinite;
}

@keyframes titleGlow {
  0%, 100% { filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.4)); }
  50% { filter: drop-shadow(0 0 40px rgba(168, 85, 247, 0.8)); }
}

.title-underline {
  width: 100px;
  height: 3px;
  background: linear-gradient(90deg, transparent, #a855f7, #7c3aed, transparent);
  margin: 0 auto;
  animation: expandWidth 2.5s ease-in-out infinite;
}

@keyframes expandWidth {
  0%, 100% { width: 100px; opacity: 0.5; }
  50% { width: 150px; opacity: 1; }
}

.splash-subtitle {
  font-size: 16px;
  color: rgba(216, 180, 254, 0.85);
  font-weight: 300;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin: 0;
}

/* Loading */
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  animation: contentFadeIn 0.6s ease-out 0.3s both;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid transparent;
  border-top-color: #a855f7;
  border-right-color: #7c3aed;
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.6);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-text {
  color: rgba(216, 180, 254, 0.7);
  font-size: 12px;
  letter-spacing: 2px;
  text-transform: uppercase;
  animation: textPulse 1.5s ease-in-out infinite;
}

@keyframes textPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* Button */
.cta-button {
  padding: 15px 45px;
  font-size: 15px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
  border: 2px solid rgba(168, 85, 247, 0.6);
  border-radius: 50px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  box-shadow: 0 0 40px rgba(168, 85, 247, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.1);
  animation: contentFadeIn 0.8s ease-out 0.4s both;
  position: relative;
  overflow: hidden;
}

.button-text {
  display: inline-block;
  position: relative;
  z-index: 2;
}

.button-icon {
  transition: transform 0.4s ease;
  position: relative;
  z-index: 2;
}

.cta-button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s;
  z-index: 1;
}

.cta-button:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 0 60px rgba(168, 85, 247, 0.9), inset 0 0 30px rgba(255, 255, 255, 0.15), 0 20px 40px rgba(0, 0, 0, 0.5);
  border-color: rgba(216, 180, 254, 0.9);
}

.cta-button:hover::before {
  transform: translateX(100%);
}

.cta-button:hover .button-icon {
  transform: translateX(5px);
}

.cta-button:active {
  transform: translateY(-2px) scale(1.02);
}

/* Glow orbs */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.2;
  pointer-events: none;
  z-index: 0;
  animation: orbPulse 8s ease-in-out infinite;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.6) 0%, transparent 70%);
  top: 10%;
  left: 5%;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.5) 0%, transparent 70%);
  bottom: 10%;
  right: 10%;
  animation-delay: 2s;
}

.orb-3 {
  width: 450px;
  height: 450px;
  background: radial-gradient(circle, rgba(216, 180, 254, 0.5) 0%, transparent 70%);
  top: 50%;
  right: 5%;
  animation-delay: 4s;
}

@keyframes orbPulse {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.4; }
}

/* Responsive */
@media (max-width: 768px) {
  .splash-title {
    font-size: 48px;
  }
  .splash-subtitle {
    font-size: 14px;
  }
  .logo-container {
    width: 240px;
    height: 240px;
  }
  .splash-content {
    gap: 30px;
  }
}

@media (max-width: 480px) {
  .splash-title {
    font-size: 36px;
  }
  .splash-subtitle {
    font-size: 12px;
  }
  .logo-container {
    width: 160px;
    height: 160px;
  }
  .cta-button {
    padding: 12px 35px;
    font-size: 13px;
  }
  .splash-content {
    gap: 25px;
  }
}
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}