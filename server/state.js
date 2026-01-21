// server/state.js
class StateManager {
    constructor() {
        this.history = [];      // The "Truth" - all committed strokes
        this.undoStack = [];    // For Redo functionality (optional but nice)
        this.users = new Map(); // Track active users { socketId: { color, x, y } }
    }

    // Add a completed stroke to history
    addStroke(stroke) {
        this.history.push(stroke);
        this.undoStack = []; // Clear redo stack on new action
        
        // Performance: Limit history to last 1000 strokes to prevent memory leaks
        if (this.history.length > 1000) {
            this.history.shift();
        }
    }

    undo() {
        if (this.history.length === 0) return null;
        const undoneAction = this.history.pop();
        this.undoStack.push(undoneAction);
        return this.history; // Return the new state
    }

    // User Management
    addUser(id) {
        // Assign a random bright color to new users
        const color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
        this.users.set(id, { color, x: 0, y: 0 });
        return color;
    }

    removeUser(id) {
        this.users.delete(id);
    }

    updateCursor(id, x, y) {
        const user = this.users.get(id);
        if (user) {
            user.x = x;
            user.y = y;
        }
        return user;
    }
}

module.exports = new StateManager();