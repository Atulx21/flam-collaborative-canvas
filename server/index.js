// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const state = require('./state'); // Import our new State Manager

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '../client')));

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // 1. Initialize User
    const userColor = state.addUser(socket.id);
    
    // Send immediate state to the new user
    socket.emit('init', {
        id: socket.id,
        history: state.history,
        color: userColor
    });

    // 2. Handle Real-time Drawing (The Stream)
    // We broadcast chunks immediately so others see it happening live
    socket.on('draw_chunk', (data) => {
        socket.broadcast.emit('draw_chunk', data);
    });

    // 3. Handle Commit (The Save)
    // We only save to history when the user lifts their mouse
    socket.on('draw_commit', (data) => {
        state.addStroke(data);
        // We don't need to broadcast this because clients already 
        // received the chunks. We just sync the "Truth".
    });

    // 4. Handle Cursors
    socket.on('cursor_move', (pos) => {
        const user = state.updateCursor(socket.id, pos.x, pos.y);
        // "Volatile" means: if the network is busy, drop this packet. 
        // It's okay if a cursor jumps slightly, but drawing must be smooth.
        socket.broadcast.volatile.emit('cursor_update', {
            id: socket.id,
            pos: pos,
            color: user ? user.color : '#000'
        });
    });

    // 5. Handle Global Undo
    socket.on('undo', () => {
        const newHistory = state.undo();
        if (newHistory) {
            // Tell EVERYONE to redraw the canvas from scratch
            io.emit('history_update', newHistory);
        }
    });

    socket.on('disconnect', () => {
        state.removeUser(socket.id);
        io.emit('user_left', socket.id);
        console.log(`User disconnected: ${socket.id}`);
    });

    
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});