import React from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Code2, Zap, Facebook, Instagram, Banknote } from "lucide-react";

export default function Developer() {
  const navigate = useNavigate();

  return (
    <div className="dev-container">
      <div className="dev-bg"></div>
      
      <div className="dev-card">
        {/* Header */}
        <div className="dev-header">
          <div className="dev-avatar">
            <div className="avatar-glow"></div>
            <span className="avatar-text">TD</span>
          </div>
          <h1>Thanawat Doopad</h1>
          <p className="dev-title">Full Stack Developer</p>
        </div>

        {/* Skills */}
        <div className="dev-skills">
          <div className="skill-item">
            <Code2 size={20} />
            <span>React & Firebase</span>
          </div>
          <div className="skill-item">
            <Zap size={20} />
            <span>Fast & Responsive</span>
          </div>
        </div>

        {/* Contact */}
        <div className="dev-contact">
          <a href="mailto:tupfa23@gmail.com" className="contact-link">
            <Mail size={18} />
            <span>tupfa23@gmail.com</span>
          </a>
        </div>

        {/* Social Links */}
        <div className="dev-socials">
          <a href="https://www.facebook.com/share/15wpk54m3Z/" target="_blank" rel="noopener noreferrer" className="social-btn fb" title="Facebook">
            <Facebook size={20} />
          </a>
          <a href="https://www.instagram.com/thnd1726?igsh=cDNiZ3k0Ynptb25v" target="_blank" rel="noopener noreferrer" className="social-btn ig" title="Instagram">
            <Instagram size={20} />
          </a>
          <a href="https://tmn.app.link/LYgPksyQYYb" target="_blank" rel="noopener noreferrer" className="social-btn tm" title="True Money">
            <Banknote size={20} />
          </a>
        </div>

        {/* Button */}
        <button className="dev-btn" onClick={() => navigate("/")}>
          ← กลับหน้าแรก
        </button>
      </div>

      <style>{`
        .dev-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0d1a 0%, #1a1a2e 50%, #16213e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        .dev-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 50%, rgba(123, 95, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(184, 107, 255, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }

        .dev-card {
          background: rgba(16, 13, 32, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(123, 95, 255, 0.3);
          border-radius: 20px;
          padding: 40px;
          max-width: 450px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(123, 95, 255, 0.2);
          animation: slideUp 0.6s ease-out;
          position: relative;
          z-index: 1;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dev-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .dev-avatar {
          width: 100px;
          height: 100px;
          margin: 0 auto 20px;
          position: relative;
        }

        .avatar-glow {
          position: absolute;
          inset: -5px;
          background: linear-gradient(45deg, #7b5fff, #b86bff);
          border-radius: 50%;
          animation: glow 3s ease-in-out infinite;
          opacity: 0.6;
        }

        @keyframes glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .avatar-text {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #7b5fff 0%, #b86bff 100%);
          border-radius: 50%;
          font-size: 28px;
          font-weight: bold;
          color: white;
          z-index: 1;
        }

        .dev-header h1 {
          font-size: 28px;
          margin: 0 0 8px 0;
          background: linear-gradient(135deg, #fff 0%, #a88eff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .dev-title {
          font-size: 14px;
          color: #a88eff;
          margin: 0;
          font-weight: 500;
          letter-spacing: 1px;
        }

        .dev-skills {
          display: flex;
          gap: 12px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .skill-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(123, 95, 255, 0.1);
          border: 1px solid rgba(123, 95, 255, 0.3);
          padding: 10px 16px;
          border-radius: 20px;
          font-size: 13px;
          color: #a88eff;
          transition: all 0.3s ease;
          flex: 1;
          justify-content: center;
        }

        .skill-item:hover {
          background: rgba(123, 95, 255, 0.2);
          border-color: rgba(123, 95, 255, 0.6);
          transform: translateY(-2px);
        }

        .dev-contact {
          margin-bottom: 30px;
        }

        .contact-link {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(123, 95, 255, 0.15);
          border: 1px solid rgba(123, 95, 255, 0.3);
          padding: 14px 18px;
          border-radius: 12px;
          color: #a88eff;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .contact-link:hover {
          background: rgba(123, 95, 255, 0.25);
          border-color: #b86bff;
          transform: translateX(5px);
          box-shadow: 0 10px 30px rgba(123, 95, 255, 0.2);
        }

        .contact-link span {
          font-size: 14px;
          font-weight: 500;
        }

        .dev-btn {
          width: 100%;
          padding: 14px 24px;
          background: linear-gradient(135deg, #7b5fff 0%, #b86bff 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(123, 95, 255, 0.2);
          letter-spacing: 0.5px;
        }

        .dev-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(123, 95, 255, 0.4);
        }

        .dev-btn:active {
          transform: translateY(-1px);
        }

        .dev-socials {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          justify-content: center;
        }

        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 45px;
          height: 45px;
          border-radius: 50%;
          border: 1px solid rgba(123, 95, 255, 0.3);
          background: rgba(123, 95, 255, 0.1);
          color: #a88eff;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .social-btn:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(123, 95, 255, 0.3);
        }

        .social-btn.fb:hover {
          background: rgba(59, 89, 152, 0.3);
          border-color: #3b5998;
          color: #3b5998;
        }

        .social-btn.ig:hover {
          background: linear-gradient(45deg, rgba(255, 0, 127, 0.2), rgba(255, 165, 0, 0.2));
          border-color: #ff1493;
          color: #ff1493;
        }

        .social-btn.prompt:hover {
          background: rgba(0, 184, 148, 0.2);
          border-color: #00b894;
          color: #00b894;
        }
      `}</style>
    </div>
  );
}