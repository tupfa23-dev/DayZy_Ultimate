// src/pages/About.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./about.css";

export default function About({ theme }) {
  const navigate = useNavigate();

  return (
    <div className={`page-container ${theme === "dark" ? "dark-mode" : "light-mode"}`}>
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
        <h1>ℹ️ About DayZy</h1>
      </header>

      <main className="page-content">
        <div className="about-content">
          {/* Hero Section */}
          <section className="hero">
            <h2>Welcome to DayZy</h2>
            <p>
              A modern task management and collaboration platform designed to help you and your team stay organized and productive.
            </p>
          </section>

          {/* Features Section */}
          <section className="about-section">
            <h2>✨ Key Features</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">📅</div>
                <h3>Calendar</h3>
                <p>Visualize tasks</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">👥</div>
                <h3>Teams</h3>
                <p>Collaborate easily</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📝</div>
                <h3>Tasks</h3>
                <p>Organize work</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🤖</div>
                <h3>DAYZY AI</h3>
                <p>Assistance will help you</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔍</div>
                <h3>Search</h3>
                <p>Find quickly</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🗒️</div>
                <h3>Note</h3>
                <p>Take note on your work</p>
              </div>
            </div>
          </section>

          {/* Version Info */}
          <section className="about-section info-box">
            <h2>📊 Version Info</h2>
            <div className="info-item">
              <span className="info-label">App Name:</span>
              <span className="info-value">DayZy</span>
            </div>
            <div className="info-item">
              <span className="info-label">Version:</span>
              <span className="info-value">1.0.0</span>
            </div>
            <div className="info-item">
              <span className="info-label">Release:</span>
              <span className="info-value">December 2024</span>
            </div>
            <div className="info-item">
              <span className="info-label">Built with:</span>
              <span className="info-value">React & Firebase</span>
            </div>
          </section>

          {/* About Team */}
          <section className="about-section">
            <h2>👨‍💼 About Us</h2>
            <p>
              DayZy was created by a passionate team of developers dedicated to building the best task management experience. We believe in simplicity, collaboration, and productivity.
            </p>
          </section>

          {/* Contact Section */}
          <section className="contact-section">
            <h2>📞 Get In Touch</h2>
            <div className="contact-links">
              <a href="5dayzy67@gmail.com" className="contact-link">
                📧 Email
              </a>
              <a href="https://twitter.com/dayzy" target="_blank" rel="noopener noreferrer" className="contact-link">
                𝕏 Twitter
              </a>
            </div>
          </section>

          {/* Legal Section */}
          <section className="legal-section">
            <h2>⚖️ Legal</h2>
            <div className="legal-links">
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
              <span>•</span>
              <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">
                Terms of Service
              </a>
            </div>
          </section>

          {/* Footer */}
          <section className="footer-section">
            <p>© 2025 DayZy. All rights reserved.</p>
            <p className="tagline">Made with ❤️ for productive teams</p>
          </section>
        </div>
      </main>
    </div>
  );
}