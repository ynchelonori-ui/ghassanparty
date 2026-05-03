const socket = io();

let room = "";
let peer;

const video = document.getElementById("video");
const remoteVideo = document.getElementById("remoteVideo");

function joinRoom() {
  room = document.getElementById("roomInput").value.trim();
  if (!room) return alert("اكتب اسم الغرفة");

  socket.emit("join", room);
  alert("دخلت الغرفة");
}

// 🎬 مزامنة فيديو
video.onplay = () => room && socket.emit("play", room);
video.onpause = () => room && socket.emit("pause", room);
video.onseeked = () => {
  if (!room) return;
  socket.emit("seek", { roomId: room, time: video.currentTime });
};

socket.on("play", () => video.play());
socket.on("pause", () => video.pause());
socket.on("seek", (time) => (video.currentTime = time));

// 💬 شات
function sendMsg() {
  const input = document.getElementById("msg");
  const msg = input.value.trim();
  if (!room) return alert("ادخل غرفة أول");
  if (!msg) return;

  socket.emit("chat", { roomId: room, message: msg });
  input.value = "";
}

socket.on("chat", (msg) => {
  const li = document.createElement("li");
  li.textContent = msg;
  document.getElementById("chat").appendChild(li);
});

// 📺 مشاركة شاشة
async function shareScreen() {
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });

  video.srcObject = stream;

  peer = new RTCPeerConnection();

  stream.getTracks().forEach(track => {
    peer.addTrack(track, stream);
  });

  peer.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit("ice", { roomId: room, candidate: e.candidate });
    }
  };

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);

  socket.emit("offer", { roomId: room, offer });
}

socket.on("offer", async ({ offer }) => {
  peer = new RTCPeerConnection();

  peer.ontrack = (e) => {
    remoteVideo.srcObject = e.streams[0];
  };

  await peer.setRemoteDescription(offer);
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);

  socket.emit("answer", { roomId: room, answer });
});

socket.on("answer", async ({ answer }) => {
  await peer.setRemoteDescription(answer);
});

socket.on("ice", async ({ candidate }) => {
  if (peer) await peer.addIceCandidate(candidate);
});
