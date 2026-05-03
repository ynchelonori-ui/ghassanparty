const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // دخول غرفة
  socket.on("join", (roomId) => {
    socket.join(roomId);
    console.log("User joined:", roomId);
    socket.emit("joined", roomId);
  });

  // 💬 الشات مع اسم المستخدم
  socket.on("chat", ({ roomId, message, username }) => {
    io.to(roomId).emit("chat", {
      message,
      username
    });
  });

  // 🔥 WebRTC
  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", { offer });
  });

  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", { answer });
  });

  socket.on("ice", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice", { candidate });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
