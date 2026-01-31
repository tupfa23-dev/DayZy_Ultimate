import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // ← เพิ่ม import นี้
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // login, register, reset
  const [particles, setParticles] = useState([]);
  const navigate = useNavigate();

  // Generate floating particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 3 + Math.random() * 2,
        size: 2 + Math.random() * 4
      }));
      setParticles(newParticles);
    };
    generateParticles();
  }, []);

  const clearMessages = () => {
    setError("");
    setMsg("");
  };

  const login = async () => {
    clearMessages();
    if (!email.trim() || !pass.trim()) {
      return setError("Please enter email and password");
    }
    
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;

      // ← ตรวจสอบและบันทึก Email ลง Firestore ถ้ายังไม่มี
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || "",
        phoneNumber: "",
        photoURL: user.photoURL || "",
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });

      console.log("✅ User data synced");
      navigate("/");
    } catch (e) {
      const errors = {
        "auth/invalid-email": "Invalid email address",
        "auth/user-not-found": "User not found",
        "auth/wrong-password": "Wrong password",
        "auth/user-disabled": "Account disabled",
        "auth/too-many-requests": "Try again later (10 min)"
      };
      setError(errors[e.code] || e.message);
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    clearMessages();
    if (!email.trim() || !pass.trim()) {
      return setError("Please enter email and password");
    }
    if (pass.length < 6) {
      return setError("Password must be at least 6 characters");
    }
    
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;

      // ← บันทึก Email และข้อมูลอื่นลง Firestore
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || "",
        phoneNumber: "",
        photoURL: user.photoURL || "",
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });

      console.log("✅ User data saved to Firestore");
      navigate("/");
    } catch (e) {
      const errors = {
        "auth/invalid-email": "Invalid email address",
        "auth/email-already-in-use": "Email already in use",
        "auth/weak-password": "Password too weak",
        "auth/operation-not-allowed": "Registration disabled"
      };
      setError(errors[e.code] || e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    clearMessages();
    if (!email.trim()) {
      return setError("Please enter your email");
    }
    
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login?email=${encodeURIComponent(email)}`,
        handleCodeInApp: false
      });
      setMsg("✅ Email sent successfully!\n📧 Check your inbox\n⏱️ Link expires in 1 hour");
      setPass("");
      setTimeout(() => setMode("login"), 3000);
    } catch (e) {
      const errors = {
        "auth/invalid-email": "Invalid email address",
        "auth/user-not-found": "User not found",
        "auth/too-many-requests": "Try again later (10 min)"
      };
      setError(errors[e.code] || e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e, callback) => {
    if (e.key === "Enter" && !loading) {
      callback();
    }
  };

  return (
    <div className="center-screen">
      {/* Animated Background */}
      <div className="bg-gradient"></div>
      <div className="bg-blur"></div>
      
      {/* Floating Particles */}
      <div className="particles-container">
        {particles.map(p => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`
            }}
          ></div>
        ))}
      </div>

      {/* Login Card */}
      <div className={`card login-card ${mode}`}>
        {/* Header with Logo */}
        <div className="logo-section">
          <div className="logo-icon">🎯</div>
          <h2 className="logo-text">DayZy</h2>
          <p className="tagline">Organize Your Day, Everyday</p>
        </div>

        {/* Mode Tabs */}
        <div className="mode-tabs">
          <button 
            className={`tab ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); clearMessages(); }}
          >
            Sign In
          </button>
          <button 
            className={`tab ${mode === "register" ? "active" : ""}`}
            onClick={() => { setMode("register"); clearMessages(); }}
          >
            Sign Up
          </button>
        </div>

        {/* Login Mode */}
        {mode === "login" && (
          <div className="mode-content">
            <h3>Welcome Back</h3>
            <div className="form-group">
              <label>Email</label>
              <input 
                placeholder="name@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, login)}
                disabled={loading}
                type="email"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                placeholder="••••••••" 
                type="password" 
                value={pass} 
                onChange={e => setPass(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, login)}
                disabled={loading}
              />
            </div>
            {error && <p className="err">{error}</p>}
            {msg && <p className="success">{msg}</p>}
            <button className="btn btn-primary" onClick={login} disabled={loading}>
              <span className="btn-text">
                {loading ? "🔄 Signing in..." : "Sign In"}
              </span>
            </button>
            <div className="divider">or</div>
            <button className="link-btn" onClick={() => { setMode("reset"); clearMessages(); }}>
              🔐 Forgot Password?
            </button>
          </div>
        )}

        {/* Register Mode */}
        {mode === "register" && (
          <div className="mode-content">
            <h3>Create Account</h3>
            <div className="form-group">
              <label>Email</label>
              <input 
                placeholder="name@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                type="email"
              />
            </div>
            <div className="form-group">
              <label>Password (min 6 characters)</label>
              <input 
                placeholder="••••••••" 
                type="password" 
                value={pass} 
                onChange={e => setPass(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, register)}
                disabled={loading}
              />
            </div>
            {error && <p className="err">{error}</p>}
            {msg && <p className="success">{msg}</p>}
            <button className="btn btn-primary" onClick={register} disabled={loading}>
              <span className="btn-text">
                {loading ? "🔄 Creating..." : "Create Account"}
              </span>
            </button>
          </div>
        )}

        {/* Reset Mode */}
        {mode === "reset" && (
          <div className="mode-content">
            <h3>Reset Password</h3>
            <p className="info-text">
              Enter your email and we'll send you a link to reset your password.
            </p>
            <div className="form-group">
              <label>Email</label>
              <input 
                placeholder="name@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, reset)}
                disabled={loading}
                type="email"
              />
            </div>
            {error && <p className="err">{error}</p>}
            {msg && <p className="success">{msg}</p>}
            <button className="btn btn-primary" onClick={reset} disabled={loading}>
              <span className="btn-text">
                {loading ? "🔄 Sending..." : "Send Reset Link"}
              </span>
            </button>
            <button className="link-btn" onClick={() => { setMode("login"); clearMessages(); }}>
              ← Back to Sign In
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="footer-text">🔒 Your data is encrypted and secure</p>
      </div>
    </div>
  );
}