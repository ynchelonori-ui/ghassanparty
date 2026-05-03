const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

let rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (roomId) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = { time: 0, playing: false };
    }

    socket.emit("joined", roomId);
    socket.emit("sync", rooms[roomId]);
  });

  socket.on("play", (roomId) => socket.to(roomId).emit("play"));
  socket.on("pause", (roomId) => socket.to(roomId).emit("pause"));

  socket.on("seek", ({ roomId, time }) => {
    socket.to(roomId).emit("seek", time);
  });

  // 💬 chat
  socket.on("chat", ({ roomId, message }) => {
    io.to(roomId).emit("chat", message);
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
