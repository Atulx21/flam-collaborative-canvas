// client/js/app.js
import { socketClient } from './socket.js';
import { CanvasEngine } from './canvas.js';
import { UIManager } from './ui.js';

// Initialize
const ui = new UIManager();
socketClient.connect();
const mainCanvas = new CanvasEngine('mainCanvas', socketClient);

// Cursor Setup
const cursorCanvas = document.getElementById('cursorCanvas');
const cursorCtx = cursorCanvas.getContext('2d');
let remoteCursors = {};

function resizeCursorCanvas() {
    cursorCanvas.width = window.innerWidth;
    cursorCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCursorCanvas);
resizeCursorCanvas();

// --- Socket Events ---

socketClient.on('connect', () => {
    ui.setConnectionStatus(true);
});

socketClient.on('disconnect', () => {
    ui.setConnectionStatus(false);
});

socketClient.on('init', (data) => {
    mainCanvas.clear();
    data.history.forEach(action => {
        mainCanvas.drawSmoothPath(action.points, action.color, action.width);
    });
});

socketClient.on('draw_chunk', (data) => {
    mainCanvas.drawSmoothPath(data.points, data.color, data.width);
});

socketClient.on('history_update', (history) => {
    mainCanvas.clear();
    history.forEach(action => {
        mainCanvas.drawSmoothPath(action.points, action.color, action.width);
    });
});

socketClient.on('cursor_update', (data) => {
    remoteCursors[data.id] = data;
    
    // Update User List in UI
    const users = Object.keys(remoteCursors).map(id => ({
        id: id,
        color: remoteCursors[id].color
    }));
    ui.updateUserList(users);
});

socketClient.on('user_left', (id) => {
    delete remoteCursors[id];
    ui.showNotification("A user left the session");
});

// Cursor Animation Loop
function renderCursors() {
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    Object.values(remoteCursors).forEach(user => {
        if (!user.pos) return;
        cursorCtx.beginPath();
        cursorCtx.fillStyle = user.color || '#ff0000';
        cursorCtx.arc(user.pos.x, user.pos.y, 5, 0, Math.PI * 2);
        cursorCtx.fill();
        
        // Draw ID
        cursorCtx.fillStyle = 'black';
        cursorCtx.font = '10px sans-serif';
        cursorCtx.fillText(user.id.slice(0, 4), user.pos.x + 8, user.pos.y);
    });
    requestAnimationFrame(renderCursors);
}
requestAnimationFrame(renderCursors);

// UI Controls
document.getElementById('colorPicker').addEventListener('change', (e) => mainCanvas.color = e.target.value);
document.getElementById('brushSize').addEventListener('change', (e) => mainCanvas.width = parseInt(e.target.value));
document.getElementById('undoBtn').addEventListener('click', () => {
    socketClient.emit('undo');
    ui.showNotification("Undoing last stroke...");
});
document.getElementById('clearBtn').addEventListener('click', () => {
    if(confirm("Clear canvas for everyone?")) {
        // You can add a socket emit for clear here if your server supports it
        // socketClient.emit('clear'); 
        location.reload(); // Simple fallback
    }
});