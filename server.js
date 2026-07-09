const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Room structure
const rooms = ['General', 'Posadas', 'Misiones', 'Random', 'VIP'];

// Store users and their current room
const users = new Map(); // socket.id -> { username, room }

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a room
    socket.on('join-room', ({ username, room }) => {
        if (!rooms.includes(room)) {
            socket.emit('error', 'Room does not exist');
            return;
        }

        // Leave previous room if any
        const prevData = users.get(socket.id);
        if (prevData && prevData.room) {
            socket.leave(prevData.room);
            socket.to(prevData.room).emit('user-left', { id: socket.id, username: prevData.username });
        }

        // Join new room
        socket.join(room);
        users.set(socket.id, { username, room });

        // Notify others in the room
        socket.to(room).emit('user-joined', { id: socket.id, username });

        // Send current list of users in the room to the new user
        const roomUsers = [];
        for (const [id, data] of users.entries()) {
            if (data.room === room && id !== socket.id) {
                roomUsers.push({ id, username: data.username });
            }
        }
        socket.emit('room-users', roomUsers);

        console.log(`${username} joined ${room}`);
    });

    // Chat message
    socket.on('send-message', (message) => {
        const userData = users.get(socket.id);
        if (userData) {
            io.to(userData.room).emit('new-message', {
                id: socket.id,
                username: userData.username,
                text: message,
                time: new Date().toLocaleTimeString()
            });
        }
    });

    // WebRTC Signaling
    socket.on('signal', ({ to, signal }) => {
        const userData = users.get(socket.id);
        if (userData) {
            socket.to(to).emit('signal', {
                from: socket.id,
                username: userData.username,
                signal
            });
        }
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
        const userData = users.get(socket.id);
        if (userData) {
            socket.to(userData.room).emit('user-left', { id: socket.id, username: userData.username });
            users.delete(socket.id);
        }
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
