import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "../pages/analytics.css";

export default function Analytics({ user, theme }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, "tasks"), where("owner", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const eventsList = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data?.title || "Task",
          start: data?.date,
          extendedProps: {
            taskId: doc.id,
            description: data?.description || "",
            priority: data?.priority || "medium",
            category: data?.category || "work",
            completed: data?.completed || false,
            createdAt: data?.createdAt || new Date().toISOString()
          }
        };
      });
      setTasks(eventsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const stats = useMemo(() => {
    if (!tasks.length) {
      return {
        total: 0,
        completed: 0,
        pending: 0,
        completionRate: 0,
        byCategory: {},
        byPriority: {},
        completionByCategory: {},
        weeklyTrends: []
      };
    }

    const total = tasks.length;
    const completed = tasks.filter(t => t.extendedProps?.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const byCategory = {};
    tasks.forEach(t => {
      const cat = t.extendedProps?.category || 'other';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });

    const byPriority = {};
    tasks.forEach(t => {
      const pri = t.extendedProps?.priority || 'medium';
      byPriority[pri] = (byPriority[pri] || 0) + 1;
    });

    const completionByCategory = {};
    tasks.forEach(t => {
      const cat = t.extendedProps?.category || 'other';
      if (!completionByCategory[cat]) {
        completionByCategory[cat] = { total: 0, completed: 0 };
      }
      completionByCategory[cat].total += 1;
      if (t.extendedProps?.completed) {
        completionByCategory[cat].completed += 1;
      }
    });

    const weeklyTrends = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTasks = tasks.filter(t => {
        const taskDate = t.start?.split('T')[0];
        return taskDate === dateStr;
      });

      weeklyTrends.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tasks: dayTasks.length,
        completed: dayTasks.filter(t => t.extendedProps?.completed).length
      });
    }

    return {
      total, completed, pending, completionRate,
      byCategory, byPriority, completionByCategory, weeklyTrends
    };
  }, [tasks]);

  const COLORS = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#a78bfa'];

  if (loading) {
    return (
      <div className={`loading-container ${theme === "dark" ? "dark" : ""}`}>
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const categoryData = Object.entries(stats.byCategory).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const priorityData = Object.entries(stats.byPriority).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const completionData = Object.entries(stats.completionByCategory).map(([name, data]) => ({
    category: name.charAt(0).toUpperCase() + name.slice(1),
    completed: data.completed,
    pending: data.total - data.completed
  }));

  return (
    <div className={`analytics-container ${theme === "dark" ? "dark" : ""}`}>
      <div className="analytics-wrapper">
        {/* Header */}
        <div className="analytics-header">
          <div className="analytics-header-content">
            <h1>📊 Analytics Dashboard</h1>
            <p>Track your productivity and task performance</p>
          </div>
          <button 
            className="back-btn"
            onClick={() => navigate('/')}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card blue">
            <div className="kpi-label">Total Tasks</div>
            <div className="kpi-value">{stats.total}</div>
            <div className="kpi-description">All tasks created</div>
          </div>

          <div className="kpi-card green">
            <div className="kpi-label">Completed</div>
            <div className="kpi-value">{stats.completed}</div>
            <div className="kpi-description">{stats.completionRate}% completion rate</div>
          </div>

          <div className="kpi-card orange">
            <div className="kpi-label">Pending</div>
            <div className="kpi-value">{stats.pending}</div>
            <div className="kpi-description">In progress</div>
          </div>

          <div className="kpi-card purple">
            <div className="kpi-label">Completion Rate</div>
            <div className="kpi-value">{stats.completionRate}%</div>
            <div className="kpi-description">Overall progress</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Weekly Trends */}
          <div className={`chart-card ${theme === "dark" ? "dark" : ""}`}>
            <h2 className="chart-title">📈 Weekly Trends</h2>
            <div className="recharts-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.weeklyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                  <Legend />
                  <Line type="monotone" dataKey="tasks" stroke="#667eea" strokeWidth={2} name="Total" />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tasks by Category */}
          <div className={`chart-card ${theme === "dark" ? "dark" : ""}`}>
            <h2 className="chart-title">🏷️ Tasks by Category</h2>
            <div className="recharts-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tasks by Priority */}
          <div className={`chart-card ${theme === "dark" ? "dark" : ""}`}>
            <h2 className="chart-title">🎯 Priority Distribution</h2>
            <div className="recharts-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b' }} />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Completion by Category */}
          <div className={`chart-card ${theme === "dark" ? "dark" : ""}`}>
            <h2 className="chart-title">✅ Completion by Category</h2>
            <div className="recharts-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="category" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b' }} />
                  <Legend />
                  <Bar dataKey="completed" fill="#10b981" name="Done" />
                  <Bar dataKey="pending" fill="#ef4444" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className={`metrics-section ${theme === "dark" ? "dark" : ""}`}>
          <h2 className="metrics-title">📋 Performance Metrics</h2>
          <div className="metrics-grid">
            {Object.entries(stats.completionByCategory).map(([category, data]) => {
              const rate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
              return (
                <div key={category} className={`metric-item ${theme === "dark" ? "dark" : ""}`}>
                  <div className="metric-header">
                    <span className="metric-category">{category}</span>
                    <span className="metric-rate">{rate}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${rate}%` }}></div>
                  </div>
                  <div className="metric-info">
                    {data.completed} of {data.total} completed
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}