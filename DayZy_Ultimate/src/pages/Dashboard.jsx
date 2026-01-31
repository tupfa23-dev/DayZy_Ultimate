import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import aiService from "./services/aiService";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  getDocs
} from "firebase/firestore";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import TeamPanel from "../widgets/TeamPanel";
import TodoPanel from "../widgets/TodoPanel";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";

const INITIAL_TASK_FORM = { 
  title: "", 
  description: "", 
  priority: "medium", 
  category: "work" 
};

// Extracted Modal Components
function TaskModal({ isOpen, taskForm, setTaskForm, onClose, onSubmit, isLoading }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New Task</h3>
          <button onClick={onClose} aria-label="Close modal">✕</button>
        </div>
        <div className="modal-body">
          <input 
            type="text" 
            placeholder="Task title..." 
            value={taskForm.title} 
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} 
            className="modal-input"
            autoFocus
          />
          <textarea 
            placeholder="Description (optional)..." 
            value={taskForm.description} 
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} 
            className="modal-textarea" 
            rows="3"
          />
          <select 
            value={taskForm.priority} 
            onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} 
            className="modal-select"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <select 
            value={taskForm.category} 
            onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })} 
            className="modal-select"
          >
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="meeting">Meeting</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="modal-footer">
          <button 
            className="btn-secondary" 
            onClick={onClose} 
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="btn-primary" 
            onClick={onSubmit} 
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EventModal({ isOpen, event, onClose, onToggleComplete, onDelete, isLoading }) {
  if (!isOpen || !event) return null;

  const title = event.title || event.extendedProps?.title || "Untitled";
  const date = event.start || event.extendedProps?.date;
  const description = event.extendedProps?.description;
  const priority = event.extendedProps?.priority || "medium";
  const category = event.extendedProps?.category || "work";
  const completed = event.extendedProps?.completed || false;
  const taskId = event.id || event.extendedProps?.taskId;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} aria-label="Close modal">✕</button>
        </div>
        <div className="modal-body">
          <div className="event-detail"><strong>Date:</strong> {date}</div>
          {description && (
            <div className="event-detail"><strong>Description:</strong> {description}</div>
          )}
          <div className="event-detail">
            <strong>Priority:</strong>
            <span className={`priority-badge ${priority}`}>{priority}</span>
          </div>
          <div className="event-detail"><strong>Category:</strong> {category}</div>
          <div className="event-detail">
            <strong>Status:</strong>
            <span className={completed ? "status-done" : "status-pending"}>
              {completed ? "Completed" : "Pending"}
            </span>
          </div>
        </div>
        <div className="modal-footer">
          <button 
            className="btn-secondary" 
            onClick={() => onToggleComplete(taskId, completed)} 
            disabled={isLoading}
          >
            {completed ? "Mark Incomplete" : "Mark Complete"}
          </button>
          <button 
            className="btn-danger" 
            onClick={() => onDelete(taskId)} 
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickActionsMenu({ isOpen, onAction }) {
  if (!isOpen) return null;
  return (
    <div className="quick-actions-menu">
      <button onClick={() => onAction("task")}>➕ New Task</button>
      <button onClick={() => onAction("meeting")}>📅 Schedule Meeting</button>
      <button onClick={() => onAction("note")}>📝 Quick Note</button>
    </div>
  );
}

function NotificationsPanel({ isOpen, notifications, onClose, onNotificationClick }) {
  if (!isOpen) return null;
  return (
    <div className="notifications-panel">
      <div className="panel-header">
        <strong>Notifications</strong>
        <button onClick={onClose} aria-label="Close notifications">✕</button>
      </div>
      {notifications.length > 0 ? (
        notifications.map((notif) => (
          <div 
            key={notif.id} 
            className={`notif-item ${notif.read ? "read" : "unread"}`} 
            onClick={() => onNotificationClick(notif.id)}
            role="button"
            tabIndex={0}
          >
            <div className="notif-message">{notif.message}</div>
            <div className="notif-time">{notif.time}</div>
          </div>
        ))
      ) : (
        <div style={{ padding: "16px", textAlign: "center" }}>No notifications</div>
      )}
    </div>
  );
}

function AIChatModal({ isOpen, onClose, events, projects, stats, user, plans }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

const handleSendMessage = async () => {
  if (loading) return;
  if (!input.trim()) return;

  const userMessage = input.trim();

  const messageObj = { role: "user", content: userMessage };
  setMessages((prev) => [...prev, messageObj]);
  setInput("");
  setLoading(true);

  try {
    const context = {
      tasks: events.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.start,
        description: e.extendedProps?.description,
        priority: e.extendedProps?.priority,
        category: e.extendedProps?.category,
        completed: e.extendedProps?.completed
      })),
      plans: plans?.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        dueDate: p.dueDate,
        priority: p.priority,
        status: p.status,
        category: p.category
      })) || [],
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        members: p.members?.length || 0,
        status: p.status
      })),
      stats: stats,
      userEmail: user?.email
    };

    const response = await fetch("https://dayzy.onrender.com/api/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        context,
        userId: user?.uid
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("AI ถูกเรียกถี่เกินไป ลองใหม่อีกครั้ง");
      }
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    const aiMessage = {
      role: "assistant",
      content: data.response || "I couldn't process that request."
    };

    setMessages((prev) => [...prev, aiMessage]);

  } catch (error) {
    console.error("Error:", error.message);

    const errorMessage = {
      role: "assistant",
      content: error.message || "เกิดข้อผิดพลาด กรุณาลองใหม่"
    };

    setMessages((prev) => [...prev, errorMessage]);

  } finally {
    setLoading(false);
  }
};


  if (!isOpen) return null;

  return (
    <div className="ai-chat-modal-overlay" onClick={onClose}>
      <div className="ai-chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ai-chat-header">
          <h3>🤖 AI Assistant</h3>
          <button onClick={onClose} aria-label="Close AI chat">✕</button>
        </div>
        
        <div className="ai-chat-messages">
          {messages.length === 0 ? (
            <div className="ai-chat-welcome">
              <p>👋 Hello! I'm your AI Assistant</p>
              <p>I can help you with:</p>
              <ul>
                <li>📊 Analyze your tasks and projects</li>
                <li>📅 Schedule and plan your work</li>
                <li>💡 Get suggestions and insights</li>
                <li>🎯 Set priorities and goals</li>
              </ul>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`ai-chat-message ${msg.role}`}>
                <div className="ai-chat-avatar">
                  {msg.role === "user" ? "👤" : "🤖"}
                </div>
                <div className="ai-chat-text">{msg.content}</div>
              </div>
            ))
          )}
          {loading && (
            <div className="ai-chat-message assistant">
              <div className="ai-chat-avatar">🤖</div>
              <div className="ai-chat-text">
                <span className="typing-indicator">
                  <span></span><span></span><span></span>
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-chat-input-area">
          <input
            type="text"
            placeholder="Ask me anything about your tasks..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="ai-chat-input"
            disabled={loading}
          />
          <button 
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="ai-chat-send-btn"
          >
            {loading ? "⏳" : "📤"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ user, theme, setTheme }) {
  const navigate = useNavigate();
  const calRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [calendarView, setCalendarView] = useState(
    typeof window !== "undefined" && window.innerWidth < 720 ? "listWeek" : "dayGridMonth"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [allProjects, setAllProjects] = useState([]);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [stats, setStats] = useState({ 
    totalTasks: 0, 
    completedTasks: 0, 
    totalProjects: 0, 
    upcomingEvents: 0 
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [taskForm, setTaskForm] = useState(INITIAL_TASK_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  // Memoized filtered data
  const { filteredEvents, filteredProjects, searchResults } = useMemo(() => {
    if (!searchQuery.trim()) {
      return { 
        filteredEvents: events, 
        filteredProjects: allProjects, 
        searchResults: { tasks: [], projects: [] } 
      };
    }

    const lowerQuery = searchQuery.toLowerCase();
    const matchedTasks = events.filter((task) =>
      task.title.toLowerCase().includes(lowerQuery) ||
      task.extendedProps?.description?.toLowerCase().includes(lowerQuery)
    );
    const matchedProjects = allProjects.filter((project) =>
      project.name?.toLowerCase().includes(lowerQuery) ||
      project.description?.toLowerCase().includes(lowerQuery)
    );

    return {
      filteredEvents: matchedTasks,
      filteredProjects: matchedProjects,
      searchResults: { tasks: matchedTasks, projects: matchedProjects }
    };
  }, [searchQuery, events, allProjects]);

  const showSearchResults = searchQuery.trim().length > 0;

  // Theme persistence
  useEffect(() => {
    if (theme) {
      try {
        localStorage.setItem("dayzy_theme", theme);
      } catch (e) {
        console.warn("Failed to save theme:", e.message);
      }
    }
  }, [theme]);

  // Responsive calendar view
  useEffect(() => {
    const handleResize = () => {
      const newView = window.innerWidth < 720 ? "listWeek" : "dayGridMonth";
      if (newView !== calendarView) {
        setCalendarView(newView);
        calRef.current?.getApi()?.changeView(newView);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [calendarView]);

  // Load tasks
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, "tasks"), where("owner", "==", user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
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

        setEvents(eventsList);

        const completed = eventsList.filter((e) => e.extendedProps.completed).length;
        const upcoming = eventsList.filter((e) => new Date(e.start) > new Date()).length;

        setStats((prev) => ({
          ...prev,
          totalTasks: eventsList.length,
          completedTasks: completed,
          upcomingEvents: upcoming
        }));
      },
      (error) => console.error("Error loading tasks:", error)
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Load plans
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, "plans"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const plansList = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setPlans(plansList);
      },
      (error) => console.error("Error loading plans:", error)
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Load projects
  useEffect(() => {
    if (!user?.uid || !user?.email) return;

    const uid = user.uid;
    const email = user.email.toLowerCase();

    const unsubscribe = onSnapshot(
      collection(db, "projects"),
      (snap) => {
        const projectsList = [];
        snap.forEach((doc) => {
          const data = doc.data();
          const members = data.members || [];
          const invites = data.invites || [];

          if (members.includes(uid) || invites.includes(email)) {
            projectsList.push({ id: doc.id, ...data });
          }
        });

        setAllProjects(projectsList);
        setStats((prev) => ({ ...prev, totalProjects: projectsList.length }));
      },
      (error) => console.error("Error loading projects:", error)
    );

    return () => unsubscribe();
  }, [user?.uid, user?.email]);

  // Load notifications
  useEffect(() => {
    if (!user?.uid) return;

    const mockNotifications = [
      { 
        id: 1, 
        type: "task", 
        message: "Task 'Project Review' is due tomorrow", 
        time: "2h ago", 
        read: false 
      },
      { 
        id: 2, 
        type: "project", 
        message: "New member joined 'Website Redesign'", 
        time: "5h ago", 
        read: false 
      },
      { 
        id: 3, 
        type: "reminder", 
        message: "Weekly meeting at 3 PM", 
        time: "1d ago", 
        read: true 
      }
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter((n) => !n.read).length);
  }, [user?.uid]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setQuickActionsOpen(false);
      setShowNotificationPanel(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Handlers
  const closeTaskModal = useCallback(() => {
    setShowTaskModal(false);
    setTaskForm(INITIAL_TASK_FORM);
    setSelectedDate(null);
  }, []);

  const closeEventModal = useCallback(() => {
    setShowEventModal(false);
    setSelectedEvent(null);
  }, []);

  const onDateClick = useCallback((arg) => {
    setSelectedDate(arg.dateStr);
    setTaskForm(INITIAL_TASK_FORM);
    setShowTaskModal(true);
  }, []);

  const onEventClick = useCallback(
    (info) => {
      const event = events.find((e) => e.id === info.event.id) || info.event;
      setSelectedEvent(event);
      setShowEventModal(true);
    },
    [events]
  );

  const handleCreateTask = useCallback(async () => {
    if (!taskForm.title.trim() || !user?.uid || !selectedDate) {
      alert("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const uid = user.uid;
      const taskId = `${uid}_${selectedDate}_${Date.now()}`;
      const newTask = {
        owner: uid,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        date: selectedDate,
        priority: taskForm.priority,
        category: taskForm.category,
        completed: false,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "tasks", taskId), newTask);
      closeTaskModal();
      setSearchQuery("");
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [taskForm, user?.uid, selectedDate, closeTaskModal]);

  const handleDeleteTask = useCallback(
    async (taskId) => {
      if (!window.confirm("Are you sure you want to delete this task?")) return;

      setIsLoading(true);
      try {
        await deleteDoc(doc(db, "tasks", taskId));
        closeEventModal();
      } catch (error) {
        console.error("Error deleting task:", error);
        alert("Failed to delete task. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [closeEventModal]
  );

  const handleToggleComplete = useCallback(async (taskId, currentStatus) => {
    setIsLoading(true);
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        completed: !currentStatus,
        updatedAt: new Date().toISOString()
      });

      setSelectedEvent((prev) =>
        prev
          ? {
              ...prev,
              extendedProps: {
                ...prev.extendedProps,
                completed: !currentStatus
              }
            }
          : prev
      );
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("dayzy_theme", newTheme);
      } catch (e) {
        console.warn("Failed to save theme:", e.message);
      }
      return newTheme;
    });
  }, [setTheme]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      navigate("/Login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to logout. Please try again.");
    }
  }, [navigate]);

  const handleExportData = useCallback(async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    try {
      const tasksSnapshot = await getDocs(
        query(collection(db, "tasks"), where("owner", "==", user.uid))
      );
      const tasksData = tasksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      const exportData = {
        exportDate: new Date().toISOString(),
        tasks: tasksData,
        projects: allProjects,
        stats
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `dayzy-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert("Data exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsLoading(false);
      setDrawerOpen(false);
    }
  }, [user?.uid, allProjects, stats]);

  const handleQuickAction = useCallback(
    (action) => {
      setQuickActionsOpen(false);
      const today = new Date().toISOString().split("T")[0];

      switch (action) {
        case "task":
          setSelectedDate(today);
          setTaskForm(INITIAL_TASK_FORM);
          setShowTaskModal(true);
          break;
        case "project":
          navigate("/projects/new");
          break;
        case "meeting":
          setSelectedDate(today);
          setTaskForm({ title: "", description: "", priority: "medium", category: "meeting" });
          setShowTaskModal(true);
          break;
        case "note":
          navigate("/notes/new");
          break;
        default:
          break;
      }
    },
    [navigate]
  );

  const handleNotificationClick = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  return (
    <div className={`dash-app ${theme === "dark" ? "dark-mode" : "light-mode"}`}>
      <header className="dash-header">
        <div className="left-header">
          <button 
            className="hamburger-btn" 
            aria-label="Open menu" 
            onClick={() => setDrawerOpen(true)}
          >
            <span className="hamburger-lines">☰</span>
          </button>
          <div 
            className="brand" 
            onClick={() => navigate("/")} 
            style={{ cursor: "pointer" }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate("/")}
          >
            DayZy
          </div>
        </div>

        <div className="right-header">
          <div className="search-container">
            <input
              type="text"
              placeholder="🔍 Search tasks & projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Search tasks and projects"
            />
            {searchQuery && (
              <button 
                className="search-clear-btn" 
                onClick={() => setSearchQuery("")} 
                title="Clear search"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}

            {showSearchResults && (
              <div className="search-dropdown">
                {searchResults.tasks.length === 0 && searchResults.projects.length === 0 ? (
                  <div className="search-empty">No results found</div>
                ) : (
                  <>
                    {searchResults.tasks.length > 0 && (
                      <div className="search-section">
                        <div className="search-section-title">
                          📝 Tasks ({searchResults.tasks.length})
                        </div>
                        {searchResults.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="search-result-item"
                            onClick={() => {
                              setSelectedEvent(task);
                              setShowEventModal(true);
                              setSearchQuery("");
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="result-title">{task.title}</div>
                            <div className="result-meta">{task.start} • {task.extendedProps.priority}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.projects.length > 0 && (
                      <div className="search-section">
                        <div className="search-section-title">
                          👥 Projects ({searchResults.projects.length})
                        </div>
                        {searchResults.projects.map((project) => (
                          <div
                            key={project.id}
                            className="search-result-item"
                            onClick={() => navigate(`/projects/${project.id}`)}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="result-title">{project.name}</div>
                            <div className="result-meta">
                              {(project.members || []).length} members
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="header-actions">
            <div 
              className="quick-actions-wrapper" 
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="icon-btn"
                title="Quick Actions"
                aria-label="Quick actions"
                onClick={() => setQuickActionsOpen(!quickActionsOpen)}
              >
                ⚡
              </button>
              <QuickActionsMenu 
                isOpen={quickActionsOpen} 
                onAction={handleQuickAction}
              />
            </div>

            <div
              className="notifications-wrapper"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="icon-btn"
                title="Notifications"
                aria-label="Notifications"
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
              >
                🔔
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>
              <NotificationsPanel
                isOpen={showNotificationPanel}
                notifications={notifications}
                onClose={() => setShowNotificationPanel(false)}
                onNotificationClick={handleNotificationClick}
              />
            </div>

            <button
              className="icon-btn"
              title="Toggle theme"
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              {theme === "dark" ? "🌞" : "🌙"}
            </button>

            <div className="user-badge">{user?.email || "User"}</div>
            <button 
              className="logout-small" 
              onClick={handleLogout}
              aria-label="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className={`drawer ${drawerOpen ? "open" : ""}`} role="dialog" aria-label="Navigation menu">
        <div className="drawer-header">
          <div className="drawer-title">Menu</div>
          <button 
            className="close-drawer" 
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <div className="drawer-body">
          <div className="stats-section">
            <h4>📊 Overview</h4>
            <div className="stat-item"><span>Total Tasks:</span><strong>{stats.totalTasks}</strong></div>
            <div className="stat-item"><span>Completed:</span><strong>{stats.completedTasks}</strong></div>
            <div className="stat-item"><span>Projects:</span><strong>{stats.totalProjects}</strong></div>
            <div className="stat-item"><span>Upcoming:</span><strong>{stats.upcomingEvents}</strong></div>
          </div>
          <div className="drawer-divider"></div>
          <button className="drawer-item" onClick={() => { navigate("/profile"); setDrawerOpen(false); }}>👤 Profile</button>
          <button className="drawer-item" onClick={() => { navigate("/notifications"); setDrawerOpen(false); }}>🔔 Notifications</button>
          <button className="drawer-item" onClick={() => { navigate("/settings"); setDrawerOpen(false); }}>⚙️ Settings</button>
          <button className="drawer-item" onClick={() => { navigate("/developer"); setDrawerOpen(false); }}>💻 Developer</button>
          <div className="drawer-divider"></div>
          <button className="drawer-item" onClick={() => { navigate("/analytics"); setDrawerOpen(false); }}>📈 Analytics</button>
          <button className="drawer-item" onClick={() => { navigate("/help"); setDrawerOpen(false); }}>❓ Help & Support</button>
          <button className="drawer-item" onClick={() => { navigate("/about"); setDrawerOpen(false); }}>ℹ️ About</button>
          <button className="drawer-item" onClick={toggleTheme}>🌓 Toggle Theme</button>
          <button className="drawer-item" onClick={() => { navigate("/notes"); setDrawerOpen(false); }}>📝 Quick Note</button>
          <button className="drawer-item" onClick={() => { navigate("/plan"); setDrawerOpen(false); }}>📋 Plan</button>
          <div className="drawer-divider"></div>
          <button className="drawer-item" onClick={() => { setShowAIChat(true); setDrawerOpen(false); }}>🤖 AI Assistant</button>
          <div className="drawer-divider"></div>
          <button className="drawer-item destructive" onClick={handleLogout}>⎋ Logout</button>
        </div>
      </div>

      <div className={`drawer-backdrop ${drawerOpen ? "visible" : ""}`} onClick={() => setDrawerOpen(false)} role="presentation" />

      <TaskModal
        isOpen={showTaskModal}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        onClose={closeTaskModal}
        onSubmit={handleCreateTask}
        isLoading={isLoading}
      />

      <EventModal
        isOpen={showEventModal}
        event={selectedEvent}
        onClose={closeEventModal}
        onToggleComplete={handleToggleComplete}
        onDelete={handleDeleteTask}
        isLoading={isLoading}
      />

      <AIChatModal
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        events={events}
        projects={allProjects}
        stats={stats}
        user={user}
        plans={plans}
        db={db}
      />

      <main className="dash-main">
        <aside className="left-panels">
          {showSearchResults && (
            <div className="filter-badge">
              <span>🔍 Searching: "{searchQuery}"</span>
              <button 
                onClick={() => setSearchQuery("")} 
                className="badge-close"
                aria-label="Clear filter"
              >
                ✕
              </button>
            </div>
          )}
          <div className="panel-card">
            <TeamPanel
              user={user}
              searchFilter={searchQuery}
              filteredProjects={filteredProjects}
            />
          </div>
          <div className="panel-card">
            <TodoPanel user={user} filter={searchQuery} />
          </div>
        </aside>

        <section className="calendar-area">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin, listPlugin, timeGridPlugin]}
            initialView={calendarView}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,listWeek"
            }}
            events={showSearchResults ? filteredEvents : events}
            dateClick={onDateClick}
            eventClick={onEventClick}
            ref={calRef}
            height="auto"
            dayMaxEventRows={3}
            weekNumbers={false}
            eventDisplay="block"
            editable={true}
            selectable={true}
            eventDidMount={(info) => {
              if (info.event.extendedProps?.completed) {
                info.el.style.opacity = "0.6";
              }
            }}
          />
        </section>
      </main>
    </div>
  );
}