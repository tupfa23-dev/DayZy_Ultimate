import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import "../styles/ResetPassword.css";

export default function ResetPassword({ theme }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [validating, setValidating] = useState(true);
  const [actionCode, setActionCode] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);

  // ตรวจสอบ oobCode เมื่อ load
  useEffect(() => {
    const code = searchParams.get("oobCode");
    if (!code) {
      setError("Invalid reset link!");
      setValidating(false);
      return;
    }

    // ตรวจสอบ code ว่าถูกต้องหรือไม่
    verifyPasswordResetCode(auth, code)
      .then(() => {
        setActionCode(code);
        setValidating(false);
      })
      .catch((err) => {
        setError("Reset link expired or invalid: " + err.message);
        setValidating(false);
      });
  }, [searchParams]);

  // คำนวณความแข็งแรงของรหัสผ่าน
  useEffect(() => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password) && /[!@#$%^&*]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // ตรวจสอบความถูกต้อง
    if (!password || !confirmPassword) {
      setError("Please fill in all fields!");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters!");
      return;
    }

    if (!actionCode) {
      setError("Invalid reset link!");
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset(auth, actionCode, password);
      setMessage("✓ Password reset successfully! Redirecting to login...");
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError("Error resetting password: " + err.message);
      setLoading(false);
    }
  };

  // ยังคงตรวจสอบ
  if (validating) {
    return (
      <div className={`reset-container ${theme}`}>
        <div className="reset-card">
          <div className="loading-spinner"></div>
          <p>Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`reset-container ${theme}`}>
      <div className="reset-card">
        <div className="reset-header">
          <div className="reset-icon">🔐</div>
          <h1>Reset Password</h1>
          <p className="reset-subtitle">Create a new secure password</p>
        </div>

        {error && <div className="reset-error">{error}</div>}
        {message && <div className="reset-success">{message}</div>}

        <form onSubmit={handleSubmit} className="reset-form">
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            <div className="strength-bar">
              <div 
                className="strength-fill" 
                style={{
                  width: passwordStrength + "%",
                  backgroundColor: 
                    passwordStrength < 50 ? "#ef4444" :
                    passwordStrength < 75 ? "#f59e0b" :
                    "#10b981"
                }}
              ></div>
            </div>
            <small className="strength-text">
              {passwordStrength < 50 ? "Weak" : 
               passwordStrength < 75 ? "Good" : 
               "Strong"}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button 
            type="submit" 
            className="reset-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="button-spinner"></span>
                Processing...
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>

        <div className="reset-footer">
          <p>Remember your password? <a href="/login">Back to login</a></p>
        </div>
      </div>
    </div>
  );
}