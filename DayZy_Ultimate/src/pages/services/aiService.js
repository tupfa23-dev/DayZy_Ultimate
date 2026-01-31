// src/services/aiService.js
// AI Chat Service with error handling and caching
// Optimized for Vite

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

class AIService {
  constructor() {
    this.endpoint = `${API_BASE_URL}/api/ai-chat`;
    this.timeout = 30000; // 30 seconds timeout
    this.messageHistory = [];
  }

  /**
   * Send message to AI Assistant
   * @param {string} message - User message
   * @param {Object} context - User data context
   * @param {string} userId - User ID
   * @returns {Promise<string>} AI response
   */
  async sendMessage(message, context, userId) {
    if (!message.trim()) {
      throw new Error("Message cannot be empty");
    }

    if (!context) {
      throw new Error("Context data is required");
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          message: message.trim(),
          context: context,
          userId: userId
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.error || `Server error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.response) {
        throw new Error("No response received from AI");
      }

      // Store in history
      this.messageHistory.push({
        timestamp: new Date().toISOString(),
        role: "user",
        content: message
      });
      this.messageHistory.push({
        timestamp: new Date().toISOString(),
        role: "assistant",
        content: data.response
      });

      return data.response;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout - AI Assistant took too long to respond");
      }

      if (error instanceof TypeError) {
        throw new Error(
          "Network error - unable to reach AI Assistant. Make sure the server is running."
        );
      }

      throw error;
    }
  }

  /**
   * Prepare context data for AI
   * @param {Array} events - User tasks
   * @param {Array} projects - User projects
   * @param {Object} stats - User statistics
   * @param {string} email - User email
   * @returns {Object} Formatted context
   */
  formatContext(events, projects, stats, email) {
    return {
      tasks: events.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.start,
        description: e.extendedProps?.description || "",
        priority: e.extendedProps?.priority || "medium",
        category: e.extendedProps?.category || "work",
        completed: e.extendedProps?.completed || false,
        daysUntilDue: this.calculateDaysUntilDue(e.start)
      })),
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || "",
        members: p.members?.length || 0,
        status: p.status || "active",
        createdAt: p.createdAt
      })),
      stats: {
        totalTasks: stats.totalTasks,
        completedTasks: stats.completedTasks,
        completionRate: stats.totalTasks > 0 
          ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
          : 0,
        totalProjects: stats.totalProjects,
        upcomingEvents: stats.upcomingEvents
      },
      userEmail: email
    };
  }

  /**
   * Calculate days until task is due
   */
  calculateDaysUntilDue(dateStr) {
    const today = new Date();
    const dueDate = new Date(dateStr);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Get message history
   */
  getHistory() {
    return this.messageHistory;
  }

  /**
   * Clear message history
   */
  clearHistory() {
    this.messageHistory = [];
  }

  /**
   * Get quick suggestions based on context
   */
  getQuickSuggestions(context) {
    const suggestions = [];

    if (context.stats.totalTasks === 0) {
      suggestions.push("🎯 Get started by creating your first task!");
    }

    if (context.stats.completionRate < 50) {
      suggestions.push("📈 Try to increase your task completion rate");
    }

    const incompleteTasks = context.tasks.filter(t => !t.completed);
    if (incompleteTasks.length > 5) {
      suggestions.push("⚠️ You have many pending tasks - consider prioritizing");
    }

    const overdueTasks = context.tasks.filter(
      t => !t.completed && t.daysUntilDue < 0
    );
    if (overdueTasks.length > 0) {
      suggestions.push(`🔴 You have ${overdueTasks.length} overdue task(s)`);
    }

    const highPriorityTasks = context.tasks.filter(
      t => !t.completed && t.priority === "high"
    );
    if (highPriorityTasks.length > 0) {
      suggestions.push(`🔥 Focus on ${highPriorityTasks.length} high-priority task(s)`);
    }

    return suggestions;
  }
}

export default new AIService();