const socket = io();

let roomId;
let peer;

const video = document.getElementById("video");
const remoteVideo = document.getElementById("remoteVideo");
const status = document.getElementById("status");

// اتصال
socket.on("connect", () => {
  console.log("✅ connected");
});

// دخول غرفة
function joinRoom() {
  roomId = document.getElementById("roomInput").value;

  if (!roomId) {
    alert("اكتب اسم غرفة");
    return;
  }

  socket.emit("join", roomId);
  status.innerText = "✅ Joined room: " + roomId;

  initWebRTC();
}

// WebRTC setup
function initWebRTC() {
  peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice", { roomId, candidate: event.candidate });
    }
  };

  peer.ontrack = (event) => {
    console.log("📺 stream received");
    remoteVideo.srcObject = event.streams[0];
  };
}

// 🎥 فيديو
video.onplay = () => socket.emit("play", roomId);
video.onpause = () => socket.emit("pause", roomId);

socket.on("play", () => video.play());
socket.on("pause", () => video.pause());

socket.on("seek", (time) => {
  video.currentTime = time;
});

// 💬 chat
function sendMessage() {
  const msg = document.getElementById("msg").value;
  if (!msg) return;

  socket.emit("chat", { roomId, message: msg });
}

socket.on("chat", (msg) => {
  const li = document.createElement("li");
  li.innerText = msg;
  document.getElementById("chat").appendChild(li);
});

// 🔥 مشاركة الشاشة
async function startScreenShare() {
  if (!peer) initWebRTC();

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true
  });

  stream.getTracks().forEach(track => {
    peer.addTrack(track, stream);
  });

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);

  socket.emit("offer", { roomId, offer });
}

// استقبال offer
socket.on("offer", async ({ offer }) => {
  if (!peer) initWebRTC();

  await peer.setRemoteDescription(offer);

  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);

  socket.emit("answer", { roomId, answer });
});

// استقبال answer
socket.on("answer", async ({ answer }) => {
  await peer.setRemoteDescription(answer);
});

// ICE
socket.on("ice", async ({ candidate }) => {
  if (candidate) {
    await peer.addIceCandidate(candidate);
  }
});
