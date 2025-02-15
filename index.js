const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        // want to enable for all origins
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
// const groups = [{ id: 1, name: "Family", adminId: 1, members: [1] }];
// const groupChat = [{ id: 1, senderId: 1, msg: "Hello", groupId: 1 }];

const groupChat = [
    { id: 1, senderId: "basit@test.com", senderName: "Basit", message: "Hello" },
    { id: 2, senderId: "ali@test.com", senderName: "Ali", message: "Hello" },
    { id: 3, senderId: "asfand@test.com", senderName: "Asfand", message: "Hello" },
    { id: 4, senderId: "shafiq@test.com", senderName: "Shafiq", message: "Hello" },
    { id: 5, senderId: "samad@test.com", senderName: "Samad", message: "Hello" },
    { id: 6, senderId: "test@test.com", senderName: "Test", message: "Hello" },
];

io.on("connection", (socket) => {
    // socket id
    console.log("A user connected", socket.id);

    // user connected
    socket.on("connectUser", ({ email }) => {
        const index = users.findIndex((u) => u.email === email);
        if (index !== -1) {
            users.splice(index, 1, { ...users[index], status: { value: "online", lastSeen: "" }, socketId: socket.id });
            io.sockets.emit("users", users);
            io.sockets.emit("groupChat", groupChat);
        }
    })

    // send message
    socket.on("message", ({ message, senderId }) => {
        const user = users.find((u) => u.email === senderId);
        const msg = { id: groupChat.length + 1, senderId, senderName: user.name, message };
        groupChat.push(msg);
        io.sockets.emit("groupChat", groupChat);
    });

    // user call
    socket.on("callUser", ({ userToCall, signalData, from, audioOnly }) => {
        io.to(userToCall).emit("incomingCall", { signal: signalData, from, audioOnly });
    });

    // on accepting call.
    socket.on("acceptCall", (data) => {
        // if accept call this event will listen and emit signal to
        // that specific socket id from which we are being called.
        io.to(data.to).emit("callAccepted", data.signal);
    });

    // reject call
    socket.on("rejectCall", ({ to }) => {
        io.to(to).emit("callRejected", { to });
    });

    // call ended
    socket.on("endCall", ({ to }) => {
        io.to(to).emit("callEnded");
    });

    // diconnect user
    socket.on("offline", ({ email }) => {
        const index = users.findIndex((u) => u.email === email);
        if (index !== -1) {
            users.splice(index, 1, { ...users[index], status: { value: "offline", lastSeen: new Date() }, socketId: socket.id });
            io.sockets.emit("users", users);
        }
    })
    socket.on("disconnect", () => {
        const index = users.findIndex((u) => u.socketId === socket.id);
        if (index !== -1) {
            users.splice(index, 1, { ...users[index], status: { value: "offline", lastSeen: new Date() }, socketId: socket.id });
            io.sockets.emit("users", users);
        }
    });
});

server.listen(5005, () => {
    console.log("Server is running on http://localhost:5005");
});
