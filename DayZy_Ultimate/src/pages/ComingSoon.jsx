import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function ComingSoon({ theme }) {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [launchDate, setLaunchDate] = useState(null);
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isLaunched, setIsLaunched] = useState(false);
  const navigate = useNavigate();

  // ตรวจสอบ auth state จาก Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      console.log('Auth state:', currentUser?.email || 'not logged in');
    });
    return unsubscribe;
  }, []);

  // ดึง launch date จาก Firestore
  useEffect(() => {
    const fetchLaunchDate = async () => {
      try {
        const docRef = doc(db, 'config', 'site');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLaunchDate(new Date(docSnap.data().launchDate));
        }
      } catch (err) {
        console.error('Error:', err);
      }
    };
    fetchLaunchDate();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!launchDate) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const launchTime = launchDate.getTime();
      const distance = launchTime - now;

      if (distance <= 0) {
        setIsLaunched(true);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setCountdown({ days, hours, minutes, seconds });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [launchDate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful');
      setEmail('');
      setPassword('');
      // onAuthStateChanged จะจัดการ update user state
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const setLaunchTime = async (hoursFromNow) => {
    try {
      const newDate = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
      const docRef = doc(db, 'config', 'site');
      await setDoc(
        docRef,
        {
          launchDate: newDate.toISOString(),
        },
        { merge: true }
      );
      setLaunchDate(newDate);
      setIsLaunched(false);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // Coming Soon page
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 50%, #c4b5fd 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '36rem' }}>
        {/* Logo & Title */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '1rem',
          padding: '3rem 2rem',
          marginBottom: '2rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{
            fontSize: '4rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            DayZy
          </h1>
          <p style={{ fontSize: '1.5rem', color: '#666', fontWeight: '500' }}>
            Coming Soon
          </p>
          <p style={{
            fontSize: '1.125rem',
            color: '#999',
            marginTop: '1rem',
            lineHeight: '1.6'
          }}>
            เรากำลังเตรียมบางสิ่งที่พิเศษสำหรับคุณ
          </p>
          <div style={{
            marginTop: '1.5rem',
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1.125rem',
              color: '#8b5cf6',
              fontWeight: '600'
            }}>
              🤖 AI
            </div>
            <div style={{
              width: '1px',
              backgroundColor: '#d8b4fe',
              height: '24px'
            }}></div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1.125rem',
              color: '#8b5cf6',
              fontWeight: '600'
            }}>
              📝 Note
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            เปิดตัวในอีก
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>
                {String(countdown.days).padStart(2, '0')}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: '500' }}>
                วัน
              </div>
            </div>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>
                {String(countdown.hours).padStart(2, '0')}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: '500' }}>
                ชั่วโมง
              </div>
            </div>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>
                {String(countdown.minutes).padStart(2, '0')}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: '500' }}>
                นาที
              </div>
            </div>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>
                {String(countdown.seconds).padStart(2, '0')}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: '500' }}>
                วินาที
              </div>
            </div>
          </div>
          {launchDate && (
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>
              📅 {launchDate.toLocaleString('th-TH')}
            </p>
          )}
        </div>

        {/* Admin Login */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#8b5cf6',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            🔐 Admin Login
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="email"
              placeholder="อีเมล"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: '2px solid #e9d5ff',
                outline: 'none',
                fontSize: '1rem',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
              onBlur={(e) => e.target.style.borderColor = '#e9d5ff'}
            />
            <input
              type="password"
              placeholder="รหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: '2px solid #e9d5ff',
                outline: 'none',
                fontSize: '1rem',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
              onBlur={(e) => e.target.style.borderColor = '#e9d5ff'}
            />
            <button
              onClick={handleLogin}
              style={{
                backgroundColor: '#8b5cf6',
                color: 'white',
                fontWeight: 'bold',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#7c3aed'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#8b5cf6'}
            >
              เข้าสู่ระบบ
            </button>
          </div>
          {loginError && (
            <p style={{
              color: '#dc2626',
              fontSize: '0.875rem',
              marginTop: '1rem',
              textAlign: 'center'
            }}>
              ⚠️ {loginError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}