import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import "./AdminDashboard.css";

export default function AdminDashboard({ user, theme }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(true);

  // ดึงข้อมูล Users หรือ Tickets
  useEffect(() => {
    if (isAdminVerified) {
      if (activeTab === "users") {
        fetchUsers();
      } else if (activeTab === "support") {
        fetchSupportTickets();
      }
    }
  }, [activeTab, isAdminVerified]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"));
      const querySnapshot = await getDocs(q);
      const userList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(userList);
      console.log("✅ Users fetched:", userList.length);
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ดึงข้อมูล Support Tickets
  const fetchSupportTickets = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "support_tickets"));
      const querySnapshot = await getDocs(q);
      const ticketList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTickets(ticketList);
      console.log("✅ Tickets fetched:", ticketList.length);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ลบ User
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("⚠️ Are you sure? This action cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers(users.filter(u => u.id !== userId));
      setMessage("✅ User deleted successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting user:", error);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  // ลบ Support Ticket
  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm("⚠️ Delete this support ticket?")) return;

    try {
      await deleteDoc(doc(db, "support_tickets", ticketId));
      setTickets(tickets.filter(t => t.id !== ticketId));
      setSelectedTicket(null);
      setMessage("✅ Ticket deleted successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting ticket:", error);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  // อัปเดต Ticket Status
  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try {
      await updateDoc(doc(db, "support_tickets", ticketId), {
        status: newStatus
      });
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
      setMessage("✅ Ticket status updated");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating ticket:", error);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  // ส่งตอบกลับ
  const handleSendReply = async (ticketId, ticketEmail) => {
    if (!replyText.trim()) {
      setMessage("❌ Please enter a reply message");
      return;
    }

    try {
      // เพิ่ม reply ใน ticket
      const replies = selectedTicket.replies || [];
      replies.push({
        from: "admin",
        message: replyText,
        timestamp: new Date()
      });

      await updateDoc(doc(db, "support_tickets", ticketId), {
        replies: replies,
        lastReply: new Date()
      });

      // อัปเดต UI
      const updatedTicket = { ...selectedTicket, replies };
      setSelectedTicket(updatedTicket);
      setTickets(tickets.map(t => t.id === ticketId ? updatedTicket : t));
      setReplyText("");
      setMessage("✅ Reply sent successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error sending reply:", error);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  // อัปเดต User
  const handleUpdateUser = async (updatedUser) => {
    try {
      const userRef = doc(db, "users", updatedUser.id);
      await updateDoc(userRef, {
        displayName: updatedUser.displayName,
        phoneNumber: updatedUser.phoneNumber,
        updatedAt: new Date()
      });
      
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      setEditingUser(null);
      setMessage("✅ User updated successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating user:", error);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  // Reset Password ของ User
  const handleResetPassword = async (userEmail) => {
    if (!window.confirm(`Send password reset email to ${userEmail}?`)) return;

    try {
      await sendPasswordResetEmail(auth, userEmail);
      setMessage(`✅ Reset email sent to ${userEmail}`);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error sending reset email:", error);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  // ตรวจสอบ Admin Password
  const handleAdminVerification = (e) => {
    e.preventDefault();
    const ADMIN_PASSWORD = "Tupfa@2010";
    
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdminVerified(true);
      setShowPasswordModal(false);
      setMessage("✅ Admin access granted!");
      setTimeout(() => setMessage(""), 3000);
    } else {
      setMessage("❌ Wrong password!");
      setAdminPassword("");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // Filter Users
  const filteredUsers = users.filter(u =>
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter Tickets
  const filteredTickets = tickets.filter(t =>
    t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ถ้ายังไม่ verify - แสดง password modal
  if (showPasswordModal) {
    return (
      <div className={`admin-container ${theme === "dark" ? "dark-mode" : "light-mode"}`}>
        <div className="modal-overlay">
          <div className="modal password-modal">
            <h2>🔐 Admin Verification Required</h2>
            <p>Enter admin password to access all management features</p>
            {message && (
              <div className={`message ${message.includes("✅") ? "success" : "error"}`}>
                {message}
              </div>
            )}
            <form onSubmit={handleAdminVerification}>
              <div className="form-group">
                <label>Admin Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter password"
                  className="form-input"
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  🔓 Verify Admin Access
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate("/dashboard")}
                >
                  Back to Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-container ${theme === "dark" ? "dark-mode" : "light-mode"}`}>
      <header className="admin-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
        <h1>⚙️ Admin Management System</h1>
        <div className="admin-info">
          <span>🔐 Verified Admin</span>
        </div>
      </header>

      <main className="admin-content">
        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            👥 Users ({users.length})
          </button>
          <button
            className={`tab ${activeTab === "support" ? "active" : ""}`}
            onClick={() => setActiveTab("support")}
          >
            📧 Support ({tickets.length})
          </button>
          <button
            className={`tab ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`message ${message.includes("✅") ? "success" : "error"}`}>
            {message}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="tab-content">
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {loading ? (
              <div className="loading">⏳ Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="empty">No users found</div>
            ) : (
              <div className="users-cards">
                {filteredUsers.map(u => (
                  <div key={u.id} className="user-card">
                    <div className="card-header">
                      <h3>{u.displayName || "N/A"}</h3>
                      <div className="card-actions">
                        <button
                          className="btn-edit"
                          onClick={() => setEditingUser(u)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-reset"
                          onClick={() => handleResetPassword(u.email)}
                          title="Reset Password"
                        >
                          🔑
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteUser(u.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="info-row">
                        <span className="label">User ID:</span>
                        <span className="value">{u.id}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Email:</span>
                        <span className="value">{u.email || "N/A"}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Phone:</span>
                        <span className="value">{u.phoneNumber || "N/A"}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Display Name:</span>
                        <span className="value">{u.displayName || "N/A"}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Created:</span>
                        <span className="value">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Support Tickets Tab */}
        {activeTab === "support" && (
          <div className="tab-content">
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Search by subject or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {loading ? (
              <div className="loading">⏳ Loading tickets...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="empty">No support tickets found</div>
            ) : (
              <div className="tickets-list">
                {filteredTickets.map(t => (
                  <div key={t.id} className="ticket-card">
                    <div className="ticket-header">
                      <div className="ticket-title">
                        <h3>{t.subject}</h3>
                        <span className={`badge ${t.status}`}>{t.status}</span>
                      </div>
                      <div className="ticket-header-actions">
                        <button
                          className="btn-view"
                          onClick={() => setSelectedTicket(t)}
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteTicket(t.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="ticket-body">
                      <div className="info-row">
                        <span className="label">From:</span>
                        <span className="value">{t.userEmail}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Category:</span>
                        <span className="value">{t.category}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Date:</span>
                        <span className="value">
                          {t.createdAt ? new Date(t.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                      <div className="message-box">
                        <p>{t.message}</p>
                      </div>
                      <div className="ticket-actions">
                        <select
                          value={t.status}
                          onChange={(e) => handleUpdateTicketStatus(t.id, e.target.value)}
                          className="status-select"
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="tab-content settings-content">
            <div className="setting-card">
              <h3>📊 System Statistics</h3>
              <div className="stats-grid">
                <div className="stat">
                  <span className="stat-label">Total Users</span>
                  <span className="stat-value">{users.length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Support Tickets</span>
                  <span className="stat-value">{tickets.length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Open Tickets</span>
                  <span className="stat-value">{tickets.filter(t => t.status === "open").length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Last Updated</span>
                  <span className="stat-value">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="setting-card">
              <h3>🔒 Admin Actions</h3>
              <button className="btn-danger" onClick={() => {
                if (window.confirm("Are you sure?")) {
                  setMessage("🔄 Refreshing data...");
                  fetchUsers();
                  fetchSupportTickets();
                }
              }}>
                🔄 Refresh All Data
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal ticket-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedTicket.subject}</h2>
              <button className="close-btn" onClick={() => setSelectedTicket(null)}>✕</button>
            </div>
            
            <div className="modal-body">
              {/* Ticket Details */}
              <div className="ticket-details">
                <div className="detail-row">
                  <span className="label">From:</span>
                  <span className="value">{selectedTicket.userEmail}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Category:</span>
                  <span className="value">{selectedTicket.category}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateTicketStatus(selectedTicket.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="detail-row">
                  <span className="label">Date:</span>
                  <span className="value">
                    {selectedTicket.createdAt ? new Date(selectedTicket.createdAt.seconds * 1000).toLocaleString() : "N/A"}
                  </span>
                </div>
              </div>

              {/* Original Message */}
              <div className="conversation">
                <div className="message user-message">
                  <div className="message-header">
                    <strong>User Message</strong>
                  </div>
                  <p>{selectedTicket.message}</p>
                </div>

                {/* Replies */}
                {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                  <div className="replies">
                    {selectedTicket.replies.map((reply, idx) => (
                      <div key={idx} className={`message ${reply.from}-message`}>
                        <div className="message-header">
                          <strong>{reply.from === "admin" ? "Admin Reply" : "User Reply"}</strong>
                          <span className="message-time">
                            {reply.timestamp ? new Date(reply.timestamp.seconds * 1000).toLocaleString() : ""}
                          </span>
                        </div>
                        <p>{reply.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reply Form */}
              <div className="reply-form">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  className="reply-textarea"
                  rows="4"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={() => handleSendReply(selectedTicket.id, selectedTicket.userEmail)}
              >
                📧 Send Reply
              </button>
              <button
                className="btn-secondary"
                onClick={() => setSelectedTicket(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit User</h2>
            <div className="modal-form">
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={editingUser.displayName || ""}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    displayName: e.target.value
                  })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={editingUser.phoneNumber || ""}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    phoneNumber: e.target.value
                  })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Email (Read-only)</label>
                <input
                  type="email"
                  value={editingUser.email || ""}
                  disabled
                  className="form-input disabled"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={() => handleUpdateUser(editingUser)}
              >
                Save Changes
              </button>
              <button
                className="btn-secondary"
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}