// Notes App JavaScript
class NotesApp {
  constructor() {
    this.notes = [];
    this.editingId = null;
    this.initializeElements();
    this.attachEventListeners();
    this.loadNotes();
  }

  initializeElements() {
    // Form elements
    this.noteForm = document.getElementById("noteForm");
    this.titleInput = document.getElementById("noteTitle");
    this.contentInput = document.getElementById("noteContent");
    this.btnText = document.getElementById("btnText");
    this.btnSpinner = document.getElementById("btnSpinner");
    this.cancelBtn = document.getElementById("cancelBtn");

    // Notes container
    this.notesContainer = document.getElementById("notesContainer");
    this.notesCount = document.getElementById("notesCount");
    this.loadingMessage = document.getElementById("loadingMessage");
    this.emptyMessage = document.getElementById("emptyMessage");

    // Modal elements
    this.editModal = document.getElementById("editModal");
    this.editForm = document.getElementById("editForm");
    this.editTitle = document.getElementById("editTitle");
    this.editContent = document.getElementById("editContent");
    this.closeModal = document.querySelector(".close");
    this.cancelEdit = document.querySelector(".cancel-edit");

    // Notification
    this.notification = document.getElementById("notification");
    this.notificationMessage = document.getElementById("notificationMessage");
    this.closeNotification = document.getElementById("closeNotification");
  }

  attachEventListeners() {
    // Form submission
    this.noteForm.addEventListener("submit", (e) => this.handleSubmit(e));
    this.cancelBtn.addEventListener("click", () => this.cancelEdit());

    // Edit modal
    this.editForm.addEventListener("submit", (e) => this.handleEditSubmit(e));
    this.closeModal.addEventListener("click", () => this.hideEditModal());
    this.cancelEdit.addEventListener("click", () => this.hideEditModal());

    // Modal background click
    this.editModal.addEventListener("click", (e) => {
      if (e.target === this.editModal) {
        this.hideEditModal();
      }
    });

    // Notification
    this.closeNotification.addEventListener("click", () =>
      this.hideNotification()
    );

    // Auto-hide notification after 5 seconds
    setTimeout(() => this.hideNotification(), 5000);
  }

  async loadNotes() {
    try {
      this.showLoading();
      const response = await fetch("/api/notes");
      if (!response.ok) throw new Error("Failed to fetch notes");

      this.notes = await response.json();
      this.renderNotes();
    } catch (error) {
      console.error("Error loading notes:", error);
      this.showNotification("Failed to load notes", "error");
      this.hideLoading();
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    const title = this.titleInput.value.trim();
    const content = this.contentInput.value.trim();

    if (!title || !content) {
      this.showNotification("Please fill in both title and content", "error");
      return;
    }

    this.setLoading(true);

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) throw new Error("Failed to add note");

      const newNote = await response.json();
      this.notes.unshift(newNote); // Add to beginning of array
      this.renderNotes();
      this.noteForm.reset();
      this.showNotification("Note added successfully!");
    } catch (error) {
      console.error("Error adding note:", error);
      this.showNotification("Failed to add note", "error");
    } finally {
      this.setLoading(false);
    }
  }

  async handleEditSubmit(e) {
    e.preventDefault();

    const title = this.editTitle.value.trim();
    const content = this.editContent.value.trim();

    if (!title || !content) {
      this.showNotification("Please fill in both title and content", "error");
      return;
    }

    try {
      const response = await fetch(`/api/notes/${this.editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) throw new Error("Failed to update note");

      const updatedNote = await response.json();
      const index = this.notes.findIndex((note) => note.id === this.editingId);
      if (index !== -1) {
        this.notes[index] = updatedNote;
      }

      this.renderNotes();
      this.hideEditModal();
      this.showNotification("Note updated successfully!");
    } catch (error) {
      console.error("Error updating note:", error);
      this.showNotification("Failed to update note", "error");
    }
  }

  async deleteNote(id) {
    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete note");

      this.notes = this.notes.filter((note) => note.id !== id);
      this.renderNotes();
      this.showNotification("Note deleted successfully!");
    } catch (error) {
      console.error("Error deleting note:", error);
      this.showNotification("Failed to delete note", "error");
    }
  }

  editNote(id) {
    const note = this.notes.find((note) => note.id === id);
    if (!note) return;

    this.editingId = id;
    this.editTitle.value = note.title;
    this.editContent.value = note.content;
    this.showEditModal();
  }

  renderNotes() {
    this.hideLoading();
    this.updateNotesCount();

    if (this.notes.length === 0) {
      this.showEmptyMessage();
      return;
    }

    this.hideEmptyMessage();

    const notesHTML = this.notes
      .map(
        (note) => `
            <div class="note-card" data-id="${note.id}">
                <div class="note-header">
                    <h3 class="note-title">${this.escapeHtml(note.title)}</h3>
                    <div class="note-actions">
                        <button class="btn btn-edit" onclick="app.editNote(${
                          note.id
                        })">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-danger" onclick="app.deleteNote(${
                          note.id
                        })">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
                <div class="note-content">${this.escapeHtml(note.content)}</div>
                <div class="note-date">
                    Created: ${this.formatDate(note.createdAt)}
                    ${
                      note.updatedAt
                        ? `<br>Updated: ${this.formatDate(note.updatedAt)}`
                        : ""
                    }
                </div>
            </div>
        `
      )
      .join("");

    this.notesContainer.innerHTML = notesHTML;
  }

  updateNotesCount() {
    const count = this.notes.length;
    this.notesCount.textContent = `${count} note${count !== 1 ? "s" : ""}`;
  }

  showLoading() {
    this.loadingMessage.style.display = "block";
    this.emptyMessage.style.display = "none";
    this.notesContainer.innerHTML = "";
  }

  hideLoading() {
    this.loadingMessage.style.display = "none";
  }

  showEmptyMessage() {
    this.emptyMessage.style.display = "block";
    this.notesContainer.innerHTML = "";
  }

  hideEmptyMessage() {
    this.emptyMessage.style.display = "none";
  }

  setLoading(isLoading) {
    if (isLoading) {
      this.btnText.style.display = "none";
      this.btnSpinner.style.display = "inline";
      this.noteForm.querySelector('button[type="submit"]').disabled = true;
    } else {
      this.btnText.style.display = "inline";
      this.btnSpinner.style.display = "none";
      this.noteForm.querySelector('button[type="submit"]').disabled = false;
    }
  }

  showEditModal() {
    this.editModal.style.display = "flex";
    document.body.style.overflow = "hidden";
    this.editTitle.focus();
  }

  hideEditModal() {
    this.editModal.style.display = "none";
    document.body.style.overflow = "auto";
    this.editingId = null;
    this.editForm.reset();
  }

  cancelEdit() {
    this.hideEditModal();
  }

  showNotification(message, type = "success") {
    this.notificationMessage.textContent = message;
    this.notification.className = `notification ${type}`;
    this.notification.style.display = "flex";

    // Auto-hide after 3 seconds
    setTimeout(() => this.hideNotification(), 3000);
  }

  hideNotification() {
    this.notification.style.display = "none";
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new NotesApp();
});

// Handle keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Escape key to close modal
  if (e.key === "Escape" && window.app) {
    window.app.hideEditModal();
    window.app.hideNotification();
  }

  // Ctrl/Cmd + Enter to submit form
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    const activeForm = document.activeElement.closest("form");
    if (activeForm) {
      activeForm.requestSubmit();
    }
  }
});

// Service Worker Registration (for PWA capabilities)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}
