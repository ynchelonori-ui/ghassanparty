const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 🔥 مهم لـ Render
const PORT = process.env.PORT || 3000;

// ربط مجلد public
app.use(express.static(path.join(__dirname, "public")));

let rooms = {};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // دخول غرفة
    socket.on("join", (roomId) => {
        socket.join(roomId);

        if (!rooms[roomId]) {
            rooms[roomId] = {
                time: 0,
                playing: false
            };
        }

        socket.emit("sync", rooms[roomId]);
        console.log(`User joined room: ${roomId}`);
    });

    // تشغيل فيديو
    socket.on("play", (roomId) => {
        if (!rooms[roomId]) return;
        rooms[roomId].playing = true;
        socket.to(roomId).emit("play");
    });

    // إيقاف فيديو
    socket.on("pause", (roomId) => {
        if (!rooms[roomId]) return;
        rooms[roomId].playing = false;
        socket.to(roomId).emit("pause");
    });

    // مزامنة الوقت
    socket.on("seek", ({ roomId, time }) => {
        if (!rooms[roomId]) return;
        rooms[roomId].time = time;
        socket.to(roomId).emit("seek", time);
    });

    // 💬 الشات
    socket.on("chat", ({ roomId, message }) => {
        socket.to(roomId).emit("chat", message);
    });

    // 🔥 WebRTC (مشاركة الشاشة)
    socket.on("offer", ({ roomId, offer }) => {
        socket.to(roomId).emit("offer", { offer });
    });

    socket.on("answer", ({ roomId, answer }) => {
        socket.to(roomId).emit("answer", { answer });
    });

    socket.on("ice", ({ roomId, candidate }) => {
        socket.to(roomId).emit("ice", { candidate });
    });

    // خروج المستخدم
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

// 🚀 تشغيل السيرفر (معدل لـ Render)
server.listen(PORT, () => {
    console.log("🚀 Server running on port " + PORT);
});
