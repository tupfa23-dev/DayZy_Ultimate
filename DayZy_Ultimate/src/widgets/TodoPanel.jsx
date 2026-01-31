import React, { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import "./Widgets.css";

export default function TodoPanel({ user, filter }) {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [itemTexts, setItemTexts] = useState({});
  const [expandedTodo, setExpandedTodo] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    const q = query(collection(db, "tasks"), where("owner", "==", uid));

    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTodos(list);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [todos]);

  const addTodo = async () => {
    if (!title.trim() || !user) return;
    const uid = user.uid;
    const docRef = doc(db, "tasks", `${uid}_${Date.now()}`);
    const newTodo = { owner: uid, title, items: [], date: null, completed: false };
    await setDoc(docRef, newTodo);
    setTitle("");
  };

  const deleteTodo = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    await deleteDoc(doc(db, "tasks", id));
    setExpandedTodo(null);
  };

  const toggleComplete = async (id, currentStatus) => {
    await updateDoc(doc(db, "tasks", id), { completed: !currentStatus });
  };

  const setDate = async (id) => {
    const dateStr = prompt("Enter date (YYYY-MM-DD):");
    if (!dateStr) return;
    await updateDoc(doc(db, "tasks", id), { date: dateStr });
  };

  const addItem = async (todo) => {
    const text = itemTexts[todo.id]?.trim();
    if (!text) return;
    await updateDoc(doc(db, "tasks", todo.id), { items: arrayUnion({ text, done: false }) });
    setItemTexts(prev => ({ ...prev, [todo.id]: "" }));
  };

  const toggleItem = async (todo, index) => {
    const item = todo.items[index];
    await updateDoc(doc(db, "tasks", todo.id), { items: arrayRemove(item) });
    await updateDoc(doc(db, "tasks", todo.id), { items: arrayUnion({ ...item, done: !item.done }) });
  };

  const deleteItem = async (todo, index) => {
    const item = todo.items[index];
    await updateDoc(doc(db, "tasks", todo.id), { items: arrayRemove(item) });
  };

  const filteredTodos = todos.filter(t =>
    t.title.toLowerCase().includes((filter || "").toLowerCase())
  );

  const getCompletionPercentage = (todo) => {
    if (!todo.items || todo.items.length === 0) return 0;
    const completed = todo.items.filter(item => item.done).length;
    return Math.round((completed / todo.items.length) * 100);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "No date";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };

  const handleKeyPress = (e, callback) => {
    if (e.key === "Enter") {
      callback();
    }
  };

  return (
    <div className="todo-panel">
      <div className="panel-header">
        <h3 className="panel-title">📝 Tasks</h3>
        <span className="task-count">{filteredTodos.length}</span>
      </div>

      {/* Add Task Section */}
      <div className="add-task-section">
        <div className="task-input-row">
          <input
            placeholder="New task..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, addTodo)}
            className="input-field"
          />
          <button className="btn btn-primary" onClick={addTodo}>
            ✚ Add
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="todo-list scrollable" ref={listRef}>
        {filteredTodos.length === 0 && (
          <div className="empty-state">
            <p>😊 No tasks yet</p>
            <span>Create one to get started!</span>
          </div>
        )}

        {filteredTodos.map((t) => {
          const completionPercentage = getCompletionPercentage(t);
          const isExpanded = expandedTodo === t.id;

          return (
            <div
              key={t.id}
              className={`todo-card ${isExpanded ? 'expanded' : ''} ${t.completed ? 'completed' : ''}`}
              onClick={() => setExpandedTodo(isExpanded ? null : t.id)}
            >
              {/* Task Header */}
              <div className="task-header">
                <div className="task-info">
                  <button
                    className="task-complete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleComplete(t.id, t.completed);
                    }}
                    title={t.completed ? "Mark as incomplete" : "Mark as complete"}
                  >
                    {t.completed ? "✓" : "○"}
                  </button>
                  <div className={`task-title ${t.completed ? 'completed' : ''}`}>{t.title}</div>
                  {t.items && t.items.length > 0 && (
                    <div className="task-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                      <span className="progress-text">
                        {completionPercentage}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="task-meta">
                  <span className="date-badge">
                    📅 {formatDate(t.date)}
                  </span>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="task-content" onClick={e => e.stopPropagation()}>
                  {/* Checklist */}
                  {(t.items || []).length > 0 && (
                    <div className="checklist-section">
                      <div className="checklist-header">
                        Subtasks ({completionPercentage}%)
                      </div>
                      <ul className="checklist">
                        {t.items.map((it, idx) => (
                          <li
                            key={idx}
                            className={`checklist-item ${it.done ? "done" : ""}`}
                          >
                            <button
                              className="checkbox-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleItem(t, idx);
                              }}
                              title="Toggle completion"
                            >
                              {it.done ? "✓" : "○"}
                            </button>
                            <span className="item-text">{it.text}</span>
                            <button
                              className="btn-delete-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteItem(t, idx);
                              }}
                              title="Delete item"
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Add Item Input */}
                  <div className="add-item-section">
                    <input
                      placeholder="Add subtask..."
                      value={itemTexts[t.id] || ""}
                      onChange={e => setItemTexts(prev => ({ ...prev, [t.id]: e.target.value }))}
                      onKeyPress={(e) => handleKeyPress(e, () => addItem(t))}
                      className="input-field input-small"
                      onClick={e => e.stopPropagation()}
                    />
                    <button 
                      className="btn btn-small btn-add-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        addItem(t);
                      }}
                    >
                      ✚
                    </button>
                  </div>

                  {/* Task Actions */}
                  <div className="task-actions">
                    <button
                      className="btn btn-small btn-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDate(t.id);
                      }}
                      title="Edit date"
                    >
                      ✏️ Date
                    </button>
                    <button
                      className={`btn btn-small ${t.completed ? 'btn-incomplete' : 'btn-complete'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleComplete(t.id, t.completed);
                      }}
                      title={t.completed ? "Mark as incomplete" : "Mark as complete"}
                    >
                      {t.completed ? "↩️ Undo" : "✓ Complete"}
                    </button>
                    <button
                      className="btn btn-small btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTodo(t.id);
                      }}
                      title="Delete task"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}