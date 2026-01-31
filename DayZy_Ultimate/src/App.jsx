import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/analytics";
import Dev from "./pages/Developer";
import Settings from "./pages/Settings";
import Splash from "./pages/Splash.jsx";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/profile";
import Notifications from "./pages/notifications.jsx";
import Help from "./pages/help";
import About from "./pages/about";
import ExportData from "./pages/exportdata";
import ComingSoon from "./pages/ComingSoon.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import AdminDashboard from "./pages/AdminDashboard";
import Plan from "./pages/Plan";
import NotesApp from "./pages/GoodNotes.jsx"; // ← เพิ่มบรรทัดนี้
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import "./DarkMode.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("dayzy_theme") || "light";
    } catch (e) {
      console.error("Failed to load theme:", e);
      return "light";
    }
  });
  const [showSplash, setShowSplash] = useState(true);
  const [isLaunched, setIsLaunched] = useState(true);

  // Step 1: ตรวจสอบ Auth State
  useEffect(() => {
    console.log('🔍 Checking auth state...');
    const unsub = onAuthStateChanged(auth, (u) => {
      console.log('👤 Auth state:', u?.email || 'not logged in');
      setUser(u);
    });
    return () => unsub();
  }, []);

  // Step 2: ตรวจสอบว่า site เปิดแล้วหรือยัง
  useEffect(() => {
    const checkLaunchStatus = async () => {
      try {
        const docRef = doc(db, 'config', 'site');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const launchDateStr = docSnap.data().launchDate;
          const launchDate = new Date(launchDateStr);
          
          if (isNaN(launchDate.getTime())) {
            console.error('Invalid launch date:', launchDateStr);
            setIsLaunched(true);
            setLoading(false);
            return;
          }
          
          const now = new Date();
          const launched = now >= launchDate;
          console.log('📅 Launch check:', {
            launched,
            now: now.toLocaleString('th-TH'),
            launchDate: launchDate.toLocaleString('th-TH')
          });
          setIsLaunched(launched);
        } else {
          console.log('✅ No launch config, treating as launched');
          setIsLaunched(true);
        }
      } catch (err) {
        console.error('❌ Error checking launch:', err);
        setIsLaunched(true);
      } finally {
        setLoading(false);
      }
    };
    
    checkLaunchStatus();
  }, []);

  // บันทึก Theme
  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("dayzy_theme", theme);
    } catch (e) {
      console.error("Failed to save theme:", e);
    }
  }, [theme]);

  const handleSplashEnd = () => setShowSplash(false);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // ยังกำลังโหลด
  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: theme === "dark" ? "#1a1a1a" : "#fff",
        color: theme === "dark" ? "#fff" : "#333",
        fontSize: "18px"
      }}>
        🔄 Loading...
      </div>
    );
  }

  // ถ้าเว็บยังไม่เปิด และ ยังไม่ login - แสดง Coming Soon
  if (!isLaunched && !user) {
    console.log('📌 Showing Coming Soon page');
    return (
      <div className={theme === "dark" ? "dark-mode" : "light-mode"}>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword theme={theme} />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="*" element={<ComingSoon theme={theme} />} />
        </Routes>
      </div>
    );
  }

  // ถ้าเว็บเปิดแล้ว หรือ admin login แล้ว - แสดง app ปกติ
  console.log('✅ Showing normal app, user:', user?.email);
  return (
    <div className={theme === "dark" ? "dark-mode" : "light-mode"}>
      <Routes>
        {/* Reset Password - ทุกคนเข้าได้ */}
        <Route path="/reset-password" element={<ResetPassword theme={theme} />} />
        
        {/* Privacy Policy - ทุกคนเข้าได้ */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        
        {/* Terms of Service - ทุกคนเข้าได้ */}
        <Route path="/terms-of-service" element={<TermsOfService />} />

        {/* ถ้า login แล้ว - แสดง Dashboard & Pages */}
        {user ? (
          <>
            <Route 
              path="/" 
              element={<Dashboard user={user} theme={theme} setTheme={setTheme} />} 
            />
            <Route 
              path="/dashboard" 
              element={<Dashboard user={user} theme={theme} setTheme={setTheme} />} 
            />
            <Route 
              path="/admin" 
              element={<AdminDashboard user={user} theme={theme} />} 
            />
            <Route 
              path="/plan" 
              element={<Plan user={user} theme={theme} />} 
            />
            {/* Notes - ตรวจสอบ share code และแสดง viewer หรือ editor */}
            <Route 
              path="/notes" 
              element={<NotesApp user={user} onLogout={handleLogout} theme={theme} />} 
            />
            <Route 
              path="/analytics" 
              element={<Analytics user={user} theme={theme} />} 
            />
            <Route 
              path="/profile" 
              element={<Profile user={user} theme={theme} />} 
            />
            <Route 
              path="/notifications" 
              element={<Notifications user={user} theme={theme} />} 
            />
            <Route 
              path="/settings" 
              element={<Settings user={user} theme={theme} setTheme={setTheme} />} 
            />
            <Route 
              path="/developer" 
              element={<Dev user={user} theme={theme} setTheme={setTheme} />} 
            />
            <Route 
              path="/help" 
              element={<Help user={user} theme={theme} />} 
            />
            <Route 
              path="/about" 
              element={<About theme={theme} />} 
            />
            <Route 
              path="/export" 
              element={<ExportData user={user} theme={theme} />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            {/* ถ้ายังไม่ login */}
            {showSplash ? (
              <Route path="*" element={<Splash onEnd={handleSplashEnd} />} />
            ) : (
              <>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            )}
          </>
        )}
      </Routes>
    </div>
  );
}