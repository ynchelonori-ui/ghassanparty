const socket = io();

let room = "";
const video = document.getElementById("video");

function joinRoom() {
  room = document.getElementById("roomInput").value;
  socket.emit("join", room);
}

// استقبال حالة الفيديو عند الدخول
socket.on("sync", (data) => {
  video.currentTime = data.time;
  if (data.playing) video.play();
});

// تحكم الفيديو
video.onplay = () => socket.emit("play", room);
video.onpause = () => socket.emit("pause", room);
video.onseeked = () => {
  socket.emit("seek", {
    roomId: room,
    time: video.currentTime
  });
};

// استقبال الأحداث
socket.on("play", () => video.play());
socket.on("pause", () => video.pause());
socket.on("seek", (time) => {
  video.currentTime = time;
});

// شات
function sendMsg() {
  const msg = document.getElementById("msg").value;
  socket.emit("chat", { roomId: room, message: msg });
}

socket.on("chat", (msg) => {
  const li = document.createElement("li");
  li.textContent = msg;
  document.getElementById("chat").appendChild(li);
});
