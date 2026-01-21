// client/js/app.js
import { socketClient } from './socket.js';
import { CanvasEngine } from './canvas.js';

// Initialize
socketClient.connect();
const mainCanvas = new CanvasEngine('mainCanvas', socketClient);

// Cursor Canvas (Separate layer for performance)
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

// 1. Initial State Sync
socketClient.on('init', (data) => {
    document.getElementById('connectionStatus').classList.remove('disconnected');
    document.getElementById('connectionStatus').classList.add('connected');
    document.getElementById('statusText').innerText = 'Connected';
    
    // Replay history
    redrawHistory(data.history);
});

// 2. Real-time Drawing from others
socketClient.on('draw_chunk', (data) => {
    // We reuse the drawing engine's logic but on the main canvas
    mainCanvas.drawSmoothPath(data.points, data.color, data.width);
});

// 3. History Update (Undo/Redo or New User)
socketClient.on('history_update', (history) => {
    redrawHistory(history);
});

// 4. Cursor Updates
socketClient.on('cursor_update', (data) => {
    remoteCursors[data.id] = data; // {id, pos: {x,y}, color}
});

socketClient.on('user_left', (id) => {
    delete remoteCursors[id];
});

// --- Helper Functions ---

function redrawHistory(history) {
    mainCanvas.clear();
    history.forEach(action => {
        mainCanvas.drawSmoothPath(action.points, action.color, action.width);
    });
}

// Cursor Animation Loop (60 FPS)
function renderCursors() {
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    
    Object.values(remoteCursors).forEach(user => {
        if (!user.pos) return;
        const { x, y } = user.pos;
        
        cursorCtx.beginPath();
        cursorCtx.fillStyle = user.color || '#ff0000';
        cursorCtx.arc(x, y, 5, 0, Math.PI * 2);
        cursorCtx.fill();
        
        // Optional: Draw name tag
        cursorCtx.fillStyle = 'black';
        cursorCtx.font = '10px sans-serif';
        cursorCtx.fillText('User ' + user.id.substr(0, 4), x + 8, y);
    });
    
    requestAnimationFrame(renderCursors);
}
requestAnimationFrame(renderCursors);

// --- UI Interactions ---

document.getElementById('colorPicker').addEventListener('change', (e) => {
    mainCanvas.color = e.target.value;
});

document.getElementById('brushSize').addEventListener('change', (e) => {
    mainCanvas.width = parseInt(e.target.value);
});

document.getElementById('undoBtn').addEventListener('click', () => {
    socketClient.emit('undo');
});