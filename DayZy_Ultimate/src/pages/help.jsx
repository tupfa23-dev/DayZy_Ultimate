// src/pages/Help.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "./help.css";

export default function Help({ user, theme }) {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    category: "general"
  });
  const [sending, setSending] = useState(false);
  const [sendMessage, setSendMessage] = useState("");

  const faqs = [
    {
      question: "How do I create a new task?",
      answer: "Click on any date in the calendar to create a new task. A prompt will appear where you can enter the task title."
    },
    {
      question: "How do I create a project?",
      answer: "Go to the Team Panel on the left side and click the 'New Project' button. Fill in the project details and add team members."
    },
    {
      question: "How do I invite team members?",
      answer: "When creating a project, add their email addresses in the 'Invite Members' field. They'll receive an invitation to join."
    },
    {
      question: "Can I change the theme?",
      answer: "Yes! Click the moon/sun icon in the header, or go to Menu → Toggle Theme."
    },
    {
      question: "How do I export my data?",
      answer: "Click Menu → Export Data to download your tasks and projects as a file."
    },
    {
      question: "What is the calendar view?",
      answer: "The calendar shows your tasks on specific dates. You can switch between Month and Week views using the buttons in the top right."
    }
  ];

  const handleSubmitSupport = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      setSendMessage("❌ Please fill in all fields");
      return;
    }

    setSending(true);
    try {
      await addDoc(collection(db, "support_tickets"), {
        userId: user.uid,
        userEmail: user.email,
        subject: formData.subject,
        message: formData.message,
        category: formData.category,
        status: "open",
        createdAt: serverTimestamp()
      });

      setSendMessage("✅ Support ticket sent successfully! We'll be in touch soon.");
      setFormData({ subject: "", message: "", category: "general" });
      setTimeout(() => {
        setShowForm(false);
        setSendMessage("");
      }, 2000);
    } catch (err) {
      setSendMessage("❌ Error sending support ticket: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`page-container ${theme === "dark" ? "dark-mode" : "light-mode"}`}>
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
        <h1>❓ Help & Support</h1>
      </header>

      <main className="page-content help-content">
        {/* FAQs Section */}
        <section className="help-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`faq-item ${expandedFaq === idx ? "expanded" : ""}`}
              >
                <button
                  className="faq-question"
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                >
                  <span>{faq.question}</span>
                  <span className="faq-icon">{expandedFaq === idx ? "▼" : "▶"}</span>
                </button>
                {expandedFaq === idx && (
                  <div className="faq-answer">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Support Form Section */}
        <section className="help-section">
          <h2>Need More Help?</h2>
          {!showForm ? (
            <button
              className="btn-primary"
              onClick={() => setShowForm(true)}
            >
              📧 Contact Support
            </button>
          ) : (
            <form onSubmit={handleSubmitSupport} className="support-form">
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="form-input"
                >
                  <option value="general">General Question</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="account">Account Issue</option>
                </select>
              </div>

              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  placeholder="Enter subject"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Describe your issue or question"
                  className="form-textarea"
                  rows="5"
                />
              </div>

              {sendMessage && (
                <div className={`message ${sendMessage.includes("✅") ? "success" : "error"}`}>
                  {sendMessage}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={sending}
                  className="btn-primary"
                >
                  {sending ? "Sending..." : "Send Ticket"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Quick Links */}
        <section className="help-section">
          <h2>Quick Links</h2>
          <div className="quick-links">
            <a href="https://twitter.com/dayzy" target="_blank" rel="noopener noreferrer" className="quick-link">
              𝕏 Twitter
            </a>
            <a href="mailto:5dayzy67@gmail.com" className="quick-link">
              📧 Email Support
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}