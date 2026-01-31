import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import "./Plan.css";

export default function Plan({ user, theme }) {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    status: "pending",
    category: "work"
  });

  // ดึงข้อมูล Plans
  useEffect(() => {
    fetchPlans();
  }, [user?.uid]);

  const fetchPlans = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const q = query(collection(db, "plans"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const planList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlans(planList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error("Error fetching plans:", error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // สร้าง Plan ใหม่
  const handleCreatePlan = useCallback(async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setMessage("❌ Title is required");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "plans"), {
        ...formData,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setMessage("✅ Plan created successfully");
      resetForm();
      fetchPlans();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error creating plan:", error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [formData, user?.uid, fetchPlans]);

  // อัปเดต Plan
  const handleUpdatePlan = useCallback(async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setMessage("❌ Title is required");
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, "plans", editingPlan.id), {
        ...formData,
        updatedAt: new Date()
      });
      setMessage("✅ Plan updated successfully");
      resetForm();
      fetchPlans();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating plan:", error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [formData, editingPlan, fetchPlans]);

  // ลบ Plan
  const handleDeletePlan = useCallback(async (planId) => {
    if (!window.confirm("⚠️ Are you sure?")) return;
    try {
      await deleteDoc(doc(db, "plans", planId));
      setPlans(plans.filter(p => p.id !== planId));
      setMessage("✅ Plan deleted");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting plan:", error);
      setMessage(`❌ Error: ${error.message}`);
    }
  }, [plans]);

  const handleEditPlan = useCallback((plan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      description: plan.description || "",
      dueDate: plan.dueDate || "",
      priority: plan.priority || "medium",
      status: plan.status || "pending",
      category: plan.category || "work"
    });
    setShowForm(true);
  }, []);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      dueDate: "",
      priority: "medium",
      status: "pending",
      category: "work"
    });
    setEditingPlan(null);
    setShowForm(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "#fbbf24",
      in_progress: "#60a5fa",
      completed: "#10b981",
      cancelled: "#ef4444"
    };
    return colors[status] || "#667eea";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "#10b981",
      medium: "#fbbf24",
      high: "#ef4444"
    };
    return colors[priority] || "#667eea";
  };

  if (!user) {
    return <div className="page-container"><p>Loading...</p></div>;
  }

  return (
    <div className={`page-container ${theme === "dark" ? "dark-mode" : "light-mode"}`}>
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
        <h1>📋 Plans</h1>
        <button className="btn-add" onClick={() => setShowForm(!showForm)}>
          {showForm ? "✕" : "+ New"}
        </button>
      </header>

      <main className="page-content">
        {message && <div className={`message ${message.includes("✅") ? "success" : "error"}`}>{message}</div>}

        {showForm && (
          <div className="plan-form-container">
            <form onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan}>
              <h2>{editingPlan ? "✏️ Edit" : "📝 New Plan"}</h2>
              <input type="text" placeholder="Title *" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="form-input" required disabled={loading} />
              <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="form-input" rows="3" disabled={loading} />
              <div className="form-row">
                <input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="form-input" disabled={loading} />
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="form-input" disabled={loading}>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="health">Health</option>
                  <option value="education">Education</option>
                </select>
              </div>
              <div className="form-row">
                <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="form-input" disabled={loading}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="form-input" disabled={loading}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>{loading ? "⏳" : "Save"}</button>
            </form>
          </div>
        )}

        {loading && !showForm ? (
          <div className="loading">⏳ Loading...</div>
        ) : plans.length === 0 ? (
          <div className="empty"><p>📭 No plans yet</p></div>
        ) : (
          <div className="plans-grid">
            {plans.map(plan => (
              <div key={plan.id} className="plan-card">
                <div className="plan-header">
                  <h3>{plan.title}</h3>
                  <div className="plan-badges">
                    <span className="badge" style={{backgroundColor: getStatusColor(plan.status)}}>{plan.status.replace("_", " ")}</span>
                    <span className="badge" style={{backgroundColor: getPriorityColor(plan.priority)}}>{plan.priority}</span>
                  </div>
                </div>
                {plan.description && <p className="description">{plan.description}</p>}
                <div className="plan-meta">
                  {plan.category && <span>📁 {plan.category}</span>}
                  {plan.dueDate && <span>📅 {new Date(plan.dueDate).toLocaleDateString()}</span>}
                </div>
                <div className="plan-actions">
                  <button className="btn-edit" onClick={() => handleEditPlan(plan)}>✏️</button>
                  <button className="btn-delete" onClick={() => handleDeletePlan(plan.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}