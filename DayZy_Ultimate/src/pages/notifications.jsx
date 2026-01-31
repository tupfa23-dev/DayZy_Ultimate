// src/pages/Notifications.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import "./notifications.css";

export default function Notifications({ user, theme }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const notifs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        timestamp: d.data().timestamp?.toDate?.() || new Date()
      }));
      setNotifications(notifs.sort((a, b) => b.timestamp - a.timestamp));
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const handleDelete = async (notifId) => {
    try {
      await deleteDoc(doc(db, "notifications", notifId));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm("Delete all notifications?")) {
      for (const notif of notifications) {
        await handleDelete(notif.id);
      }
    }
  };

  const getIcon = (type) => {
    const icons = {
      task: "📝",
      project: "👥",
      message: "💬",
      invite: "📧",
      reminder: "⏰",
      default: "🔔"
    };
    return icons[type] || icons.default;
  };

  return (
    <div className={`page-container ${theme === "dark" ? "dark-mode" : "light-mode"}`}>
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
        <h1>🔔 Notifications</h1>
        {notifications.length > 0 && (
          <button className="clear-all-btn" onClick={handleDeleteAll}>
            Clear All
          </button>
        )}
      </header>

      <main className="page-content">
        {loading ? (
          <div className="loading">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notif) => (
              <div key={notif.id} className={`notification-item ${notif.read ? "read" : "unread"}`}>
                <div className="notif-icon">{getIcon(notif.type)}</div>
                <div className="notif-content">
                  <div className="notif-title">{notif.title}</div>
                  <div className="notif-message">{notif.message}</div>
                  <div className="notif-time">
                    {notif.timestamp.toLocaleString()}
                  </div>
                </div>
                <button
                  className="notif-delete"
                  onClick={() => handleDelete(notif.id)}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}