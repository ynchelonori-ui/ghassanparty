const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// يخلي الموقع يقرأ ملفات public
app.use(express.static("public"));

// تخزين الغرف
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

    // ارسال حالة الفيديو الحالية
    socket.emit("sync", rooms[roomId]);

    // إشعار باقي الأشخاص
    socket.to(roomId).emit("user-joined", socket.id);
  });

  // تشغيل الفيديو
  socket.on("play", (roomId) => {
    if (rooms[roomId]) {
      rooms[roomId].playing = true;
      socket.to(roomId).emit("play");
    }
  });

  // إيقاف الفيديو
  socket.on("pause", (roomId) => {
    if (rooms[roomId]) {
      rooms[roomId].playing = false;
      socket.to(roomId).emit("pause");
    }
  });

  // تغيير الوقت
  socket.on("seek", ({ roomId, time }) => {
    if (rooms[roomId]) {
      rooms[roomId].time = time;
      socket.to(roomId).emit("seek", time);
    }
  });

  // 💬 الشات
  socket.on("chat", ({ roomId, message }) => {
    io.to(roomId).emit("chat", {
      id: socket.id,
      message
    });
  });

  // 📺 WebRTC (Screen Share إشارات فقط)
  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", {
      offer,
      from: socket.id
    });
  });

  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", {
      answer,
      from: socket.id
    });
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", {
      candidate,
      from: socket.id
    });
  });

  // خروج
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// 🔥 هذا أهم سطر لـ Render
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
