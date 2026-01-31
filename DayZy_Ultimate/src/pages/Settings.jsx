import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, setDoc, collection, onSnapshot } from "firebase/firestore";
import { FiMoon, FiSun, FiBell, FiBellOff, FiArrowLeft } from "react-icons/fi";
import "./Settings.css";

export default function Settings({ user, theme, setTheme }) {
  const navigate = useNavigate();
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [tasks, setTasks] = useState([]);

  // โหลด notifyEnabled จาก Firebase
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    getDoc(userRef).then((snap) => {
      if (snap.exists()) setNotifyEnabled(snap.data().notifyEnabled || false);
    });
  }, [user]);

  // โหลด Tasks/Projects ของผู้ใช้
  useEffect(() => {
    if (!user) return;
    const tasksCol = collection(db, "tasks"); // สมมติมี collection tasks
    const unsub = onSnapshot(tasksCol, (snap) => {
      const list = [];
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.userId === user.uid) list.push({ id: doc.id, ...data });
      });
      setTasks(list);
    });
    return () => unsub();
  }, [user]);

  // Toggle Notification
  const toggleNotify = async () => {
    if (!user) return alert("Login ก่อนนะ");

    const userRef = doc(db, "users", user.uid);

    if (!notifyEnabled) {
      if (!("Notification" in window)) return alert("Browser ไม่รองรับ Notification");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return alert("คุณต้องอนุญาต Notification ก่อน");

      setNotifyEnabled(true);
      await setDoc(userRef, { notifyEnabled: true }, { merge: true });

      new Notification("🔔 เปิดแจ้งเตือนแล้ว", { body: "ระบบจะเตือนงานของคุณ" });

      // ส่ง Notification สำหรับงานทั้งหมดทันที (ตัวอย่าง)
      tasks.forEach(task => {
        new Notification("📌 งานที่ต้องทำ", { body: task.title || "งานไม่ระบุชื่อ" });
      });

    } else {
      setNotifyEnabled(false);
      await setDoc(userRef, { notifyEnabled: false }, { merge: true });
      alert("ปิดการแจ้งเตือนแล้ว");
    }
  };

  return (
    <div className="settings-wrapper">
      <div className="settings-box fade-in">

        <h2 className="settings-title">⚙️ Settings</h2>
        <p className="user-display">
          ผู้ใช้งาน: <span>{user ? user.email : "Guest"}</span>
        </p>

        {/* Theme */}
        <div className="section">
          <h3>🎨 Theme</h3>
          <div className="btn-row">
            <button className="btn light" onClick={() => setTheme("light")}><FiSun /> Light</button>
            <button className="btn dark" onClick={() => setTheme("dark")}><FiMoon /> Dark</button>
          </div>
        </div>

        {/* Notification Toggle */}
        <div className="section">
          <h3>🔔 Notifications</h3>
          <button className="btn primary" onClick={toggleNotify}>
            {notifyEnabled ? <FiBell /> : <FiBellOff />}
            {notifyEnabled ? "ปิดแจ้งเตือน" : "เปิดแจ้งเตือน"}
          </button>
          <p className="notify-status">
            สถานะ: <b>{notifyEnabled ? "เปิดแจ้งเตือนแล้ว" : "ปิดอยู่"}</b>
          </p>
        </div>

        <button className="btn back" onClick={() => navigate("/")}>
          <FiArrowLeft /> กลับ
        </button>

      </div>
    </div>
  );
}
