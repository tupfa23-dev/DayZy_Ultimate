// src/pages/ExportData.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  collectionGroup
} from "firebase/firestore";
import "./exportdata.css";

export default function ExportData({ user, theme }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportFormat, setExportFormat] = useState("json");
  const [selectedData, setSelectedData] = useState({
    tasks: true,
    projects: true
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch tasks
      const tasksQuery = query(
        collection(db, "tasks"),
        where("owner", "==", user.uid)
      );
      const tasksSnap = await getDocs(tasksQuery);
      const tasksData = tasksSnap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setTasks(tasksData);

      // Fetch projects
      const projectsQuery = collection(db, "projects");
      const projectsSnap = await getDocs(projectsQuery);
      const projectsData = projectsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter(
          (p) =>
            (p.members || []).includes(user.uid) ||
            (p.invites || []).includes(user.email?.toLowerCase())
        );
      setProjects(projectsData);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setLoading(false);
    }
  };

  const exportToJSON = () => {
    const data = {};
    if (selectedData.tasks) data.tasks = tasks;
    if (selectedData.projects) data.projects = projects;

    const jsonStr = JSON.stringify(data, null, 2);
    downloadFile(jsonStr, "dayzy_export.json", "application/json");
  };

  const exportToCSV = () => {
    let csv = "";

    if (selectedData.tasks && tasks.length > 0) {
      csv += "TASKS\n";
      csv += "ID,Title,Date,Owner,Items\n";
      tasks.forEach((task) => {
        const itemsCount = (task.items || []).length;
        csv += `"${task.id}","${task.title}","${task.date}","${task.owner}","${itemsCount}"\n`;
      });
      csv += "\n\n";
    }

    if (selectedData.projects && projects.length > 0) {
      csv += "PROJECTS\n";
      csv += "ID,Name,Members,Status,CreatedAt\n";
      projects.forEach((project) => {
        const memberCount = (project.members || []).length;
        csv += `"${project.id}","${project.name}","${memberCount}","${
          project.status || "active"
        }","${project.createdAt || ""}"\n`;
      });
    }

    downloadFile(csv, "dayzy_export.csv", "text/csv");
  };

  const exportToXML = () => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<dayzy>\n';

    if (selectedData.tasks && tasks.length > 0) {
      xml += "  <tasks>\n";
      tasks.forEach((task) => {
        xml += `    <task>\n`;
        xml += `      <id>${escapeXml(task.id)}</id>\n`;
        xml += `      <title>${escapeXml(task.title)}</title>\n`;
        xml += `      <date>${task.date}</date>\n`;
        xml += `      <owner>${task.owner}</owner>\n`;
        xml += `    </task>\n`;
      });
      xml += "  </tasks>\n";
    }

    if (selectedData.projects && projects.length > 0) {
      xml += "  <projects>\n";
      projects.forEach((project) => {
        xml += `    <project>\n`;
        xml += `      <id>${escapeXml(project.id)}</id>\n`;
        xml += `      <name>${escapeXml(project.name)}</name>\n`;
        xml += `      <members>${(project.members || []).length}</members>\n`;
        xml += `    </project>\n`;
      });
      xml += "  </projects>\n";
    }

    xml += "</dayzy>";
    downloadFile(xml, "dayzy_export.xml", "text/xml");
  };

  const escapeXml = (str) => {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  const downloadFile = (content, filename, type) => {
    const element = document.createElement("a");
    element.setAttribute("href", `data:${type};charset=utf-8,${encodeURIComponent(content)}`);
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExport = () => {
    if (!selectedData.tasks && !selectedData.projects) {
      alert("Please select at least one data type to export");
      return;
    }

    if (exportFormat === "json") exportToJSON();
    else if (exportFormat === "csv") exportToCSV();
    else if (exportFormat === "xml") exportToXML();
  };

  return (
    <div className={`page-container ${theme === "dark" ? "dark-mode" : "light-mode"}`}>
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
        <h1>📥 Export Data</h1>
      </header>

      <main className="page-content">
        {loading ? (
          <div className="loading">Loading your data...</div>
        ) : (
          <div className="export-container">
            {/* Data Selection */}
            <section className="export-section">
              <h2>Select Data to Export</h2>
              <div className="checkbox-group">
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedData.tasks}
                    onChange={(e) =>
                      setSelectedData({ ...selectedData, tasks: e.target.checked })
                    }
                  />
                  <span>📝 Tasks ({tasks.length})</span>
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedData.projects}
                    onChange={(e) =>
                      setSelectedData({ ...selectedData, projects: e.target.checked })
                    }
                  />
                  <span>👥 Projects ({projects.length})</span>
                </label>
              </div>
            </section>

            {/* Format Selection */}
            <section className="export-section">
              <h2>Export Format</h2>
              <div className="radio-group">
                <label className="radio-item">
                  <input
                    type="radio"
                    name="format"
                    value="json"
                    checked={exportFormat === "json"}
                    onChange={(e) => setExportFormat(e.target.value)}
                  />
                  <span>JSON (Best for backup)</span>
                </label>
                <label className="radio-item">
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={exportFormat === "csv"}
                    onChange={(e) => setExportFormat(e.target.value)}
                  />
                  <span>CSV (For Excel/Sheets)</span>
                </label>
                <label className="radio-item">
                  <input
                    type="radio"
                    name="format"
                    value="xml"
                    checked={exportFormat === "xml"}
                    onChange={(e) => setExportFormat(e.target.value)}
                  />
                  <span>XML (Universal format)</span>
                </label>
              </div>
            </section>

            {/* Data Summary */}
            <section className="export-section info-box">
              <h2>Summary</h2>
              <p>📝 Tasks: <strong>{tasks.length}</strong></p>
              <p>👥 Projects: <strong>{projects.length}</strong></p>
              <p>📅 Export Date: <strong>{new Date().toLocaleDateString()}</strong></p>
            </section>

            {/* Export Button */}
            <section className="export-section">
              <button className="btn-primary btn-large" onClick={handleExport}>
                ⬇️ Download Export
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </button>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}