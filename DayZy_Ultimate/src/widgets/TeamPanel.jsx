import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, setDoc, collection, onSnapshot, updateDoc, arrayUnion, arrayRemove, getDoc, deleteDoc } from "firebase/firestore";
import "./TodoPanel.css";

export default function TeamPanel({ user, searchFilter = "", filteredProjects = null }) {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);

  const displayProjects = filteredProjects !== null && filteredProjects !== undefined ? filteredProjects : projects;
  const isFiltering = searchFilter.trim().length > 0;

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    const email = user.email.toLowerCase();
    const q = collection(db, "projects");

    const unsub = onSnapshot(q, snap => {
      const list = [];
      snap.forEach(d => {
        const data = d.data();
        if ((data.members || []).includes(uid) || (data.invites || []).includes(email)) {
          list.push({ id: d.id, ...data });
        }
      });
      setProjects(list);
    });

    return () => unsub();
  }, [user]);

  const createProject = async () => {
    if (!name.trim() || !user) return;
    const uid = user.uid;
    const id = uid + "_" + Date.now();
    const newProject = { 
      name, 
      owner: uid, 
      members: [uid], 
      invites: [], 
      deadline: deadline || null,
      createdAt: Date.now() 
    };
    await setDoc(doc(db, "projects", id), newProject);
    setName("");
    setDeadline("");
  };

  const shareProject = async (pid) => {
    if (!shareEmail.trim()) return alert("Please enter an email");
    const projRef = doc(db, "projects", pid);
    const snap = await getDoc(projRef);
    if (!snap.exists()) return alert("Project not found");

    const data = snap.data();
    const invites = data.invites || [];
    const emailLower = shareEmail.toLowerCase();
    if (!invites.includes(emailLower)) invites.push(emailLower);

    await updateDoc(projRef, { invites });
    setShareEmail("");
    alert("Invitation sent successfully");
  };

  const acceptInvite = async (proj) => {
    if (!user) return;
    const projRef = doc(db, "projects", proj.id);
    await updateDoc(projRef, {
      members: arrayUnion(user.uid),
      invites: arrayRemove(user.email.toLowerCase())
    });
    alert(`You joined "${proj.name}"`);
  };

  const rejectInvite = async (proj) => {
    if (!user) return;
    const projRef = doc(db, "projects", proj.id);
    await updateDoc(projRef, {
      invites: arrayRemove(user.email.toLowerCase())
    });
    alert(`Invitation from "${proj.name}" declined`);
  };

  const leaveProject = async (proj) => {
    if (!user) return;

    if (!window.confirm(`Leave "${proj.name}"?`)) {
      return;
    }

    try {
      const projRef = doc(db, "projects", proj.id);
      await updateDoc(projRef, {
        members: arrayRemove(user.uid)
      });
      setSelectedProjectId(null);
      alert(`Left "${proj.name}"`);
    } catch (error) {
      alert("Error leaving project");
      console.error(error);
    }
  };

  const deleteProject = async (proj) => {
    if (!user) return;
    
    if (proj.owner !== user.uid) {
      return alert("Only project owner can delete");
    }

    if (!window.confirm(`Delete "${proj.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "projects", proj.id));
      setSelectedProjectId(null);
      alert("Project deleted");
    } catch (error) {
      alert("Error deleting project");
      console.error(error);
    }
  };

  const updateProjectDeadline = async (projId, newDeadline) => {
    try {
      const projRef = doc(db, "projects", projId);
      await updateDoc(projRef, { deadline: newDeadline || null });
      alert("Deadline updated");
    } catch (error) {
      alert("Error updating deadline");
      console.error(error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getDeadlineStatus = (deadline) => {
    if (!deadline) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const daysLeft = Math.floor((deadlineDate - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return "expired";
    if (daysLeft === 0) return "today";
    if (daysLeft <= 3) return "urgent";
    return "normal";
  };

  const handleKeyPress = (e, callback) => {
    if (e.key === "Enter") {
      callback();
    }
  };

  return (
    <div className="team-panel">
      <div className="panel-header">
        <h3 className="panel-title">👥 Projects</h3>
        <span className="project-count">{displayProjects.length}</span>
      </div>

      {/* Create Section */}
      {!isFiltering && (
        <div className="create-section">
          <div className="create-row">
            <input
              placeholder="New project name..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, createProject)}
              className="input-field"
            />
            <button className="btn btn-primary" onClick={createProject}>
              ✚ Create
            </button>
          </div>

          <div className="deadline-row">
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="input-field deadline-input"
              title="Set deadline"
            />
            <span className="deadline-label">📅</span>
          </div>
        </div>
      )}

      {/* Filter Info */}
      {isFiltering && displayProjects.length === 0 && (
        <div className="filter-empty">
          <p>❌ No projects match "{searchFilter}"</p>
        </div>
      )}

      {/* Projects List */}
      <div className="project-list scrollable">
        {displayProjects.length === 0 && !isFiltering && (
          <div className="empty-state">
            <p>No projects yet</p>
            <span>Create one to get started!</span>
          </div>
        )}

        {displayProjects.map(p => (
          <div
            key={p.id}
            className={`project-card ${selectedProjectId === p.id ? 'selected' : ''}`}
            onClick={() => setSelectedProjectId(p.id)}
          >
            <div className="project-info">
              <div className="project-name">{p.name}</div>
              <div className="project-meta">
                <span className="member-badge">👤 {(p.members || []).length}</span>
              </div>
            </div>

            {p.deadline && (
              <div className={`deadline-badge ${getDeadlineStatus(p.deadline)}`}>
                {formatDate(p.deadline)}
              </div>
            )}

            {p.invites?.length > 0 && (
              <div className="invite-badge">
                📨 {p.invites.length} pending
              </div>
            )}

            <div className="project-actions">
              {(p.invites || []).includes(user?.email?.toLowerCase()) && (
                <div className="action-group">
                  <button 
                    className="btn btn-small btn-accept"
                    onClick={(e) => {
                      e.stopPropagation();
                      acceptInvite(p);
                    }}
                    title="Accept invitation"
                  >
                    ✓
                  </button>
                  <button 
                    className="btn btn-small btn-reject"
                    onClick={(e) => {
                      e.stopPropagation();
                      rejectInvite(p);
                    }}
                    title="Reject invitation"
                  >
                    ✕
                  </button>
                </div>
              )}

              {p.owner === user?.uid && (
                <div className="action-group">
                  <button 
                    className="btn btn-small btn-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newDeadline = prompt("Deadline (YYYY-MM-DD):", p.deadline || "");
                      if (newDeadline !== null) {
                        updateProjectDeadline(p.id, newDeadline);
                      }
                    }}
                    title="Edit deadline"
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn btn-small btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(p);
                    }}
                    title="Delete project"
                  >
                    🗑️
                  </button>
                </div>
              )}

              {p.owner !== user?.uid && (p.members || []).includes(user?.uid) && (
                <button 
                  className="btn btn-small btn-leave"
                  onClick={(e) => {
                    e.stopPropagation();
                    leaveProject(p);
                  }}
                  title="Leave project"
                >
                  👋 Leave
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Share Section */}
      {!isFiltering && (
        <div className="share-section">
          <div className="share-row">
            <input
              placeholder="Email to share..."
              value={shareEmail}
              onChange={e => setShareEmail(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, () => {
                const pid = selectedProjectId || projects[0]?.id;
                if (pid) shareProject(pid);
                else alert("Create a project first");
              })}
              className="input-field"
            />
            <button
              className="btn btn-primary"
              onClick={() => {
                const pid = selectedProjectId || projects[0]?.id;
                if (pid) shareProject(pid);
                else alert("Create a project first");
              }}
            >
              ✉️ Share
            </button>
          </div>
        </div>
      )}
    </div>
  );
}