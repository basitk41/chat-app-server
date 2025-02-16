// functions/function.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Handler } = require('@netlify/functions');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

app.use(cors());

const users = [
    { id: 1, name: "Basit", email: "basit@test.com", status: { value: "offline", lastSeen: new Date() }, socketId: "" },
    { id: 2, name: "Asfand", email: "asfand@test.com", status: { value: "offline", lastSeen: new Date() }, socketId: "" },
    { id: 3, name: "Shafiq", email: "shafiq@test.com", status: { value: "offline", lastSeen: new Date() }, socketId: "" },
    { id: 4, name: "Samad", email: "samad@test.com", status: { value: "offline", lastSeen: new Date() }, socketId: "" },
    { id: 5, name: "Ali", email: "ali@test.com", status: { value: "offline", lastSeen: new Date() }, socketId: "" },
    { id: 6, name: "Test", email: "test@test.com", status: { value: "offline", lastSeen: new Date() }, socketId: "" },
];

const groupChat = [
    { id: 1, senderId: "basit@test.com", senderName: "Basit", message: "Hello" },
    { id: 2, senderId: "ali@test.com", senderName: "Ali", message: "Hello" },
    { id: 3, senderId: "asfand@test.com", senderName: "Asfand", message: "Hello" },
    { id: 4, senderId: "shafiq@test.com", senderName: "Shafiq", message: "Hello" },
    { id: 5, senderId: "samad@test.com", senderName: "Samad", message: "Hello" },
    { id: 6, senderId: "test@test.com", senderName: "Test", message: "Hello" },
];

io.on("connection", (socket) => {
    console.log("A user connected", socket.id);

    socket.on("connectUser", ({ email }) => {
        const index = users.findIndex((u) => u.email === email);
        if (index !== -1) {
            users.splice(index, 1, { ...users[index], status: { value: "online", lastSeen: "" }, socketId: socket.id });
            io.sockets.emit("users", users);
            io.sockets.emit("groupChat", groupChat);
        }
    });

    socket.on("message", ({ message, senderId }) => {
        const user = users.find((u) => u.email === senderId);
        const msg = { id: groupChat.length + 1, senderId, senderName: user.name, message };
        groupChat.push(msg);
        io.sockets.emit("groupChat", groupChat);
    });

    socket.on("callUser", ({ userToCall, signalData, from, audioOnly }) => {
        io.to(userToCall).emit("incomingCall", { signal: signalData, from, audioOnly });
    });

    socket.on("acceptCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
    });

    socket.on("rejectCall", ({ to }) => {
        io.to(to).emit("callRejected", { to });
    });

    socket.on("endCall", ({ to }) => {
        io.to(to).emit("callEnded");
    });

    socket.on("offline", ({ email }) => {
        const index = users.findIndex((u) => u.email === email);
        if (index !== -1) {
            users.splice(index, 1, { ...users[index], status: { value: "offline", lastSeen: new Date() }, socketId: socket.id });
            io.sockets.emit("users", users);
        }
    });

    socket.on("disconnect", () => {
        const index = users.findIndex((u) => u.socketId === socket.id);
        if (index !== -1) {
            users.splice(index, 1, { ...users[index], status: { value: "offline", lastSeen: new Date() }, socketId: socket.id });
            io.sockets.emit("users", users);
        }
    });
});

// Export handler function to make it compatible with Netlify
exports.handler = async (event, context) => {
    // Start server only if needed
    server.listen(5005, () => {
        console.log("Server is running on http://localhost:5005");
    });

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Server running' }),
    };
};
