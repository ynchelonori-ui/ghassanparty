console.log("🔥 script loaded");

const socket = io();

let roomId = "";
let peer;
let localStream;
let username = "User" + Math.floor(Math.random() * 1000);

// عناصر
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

// اتصال
socket.on("connect", () => {
  console.log("✅ connected");
});

// دخول غرفة
function joinRoom() {
  const input = document.getElementById("roomInput");
  roomId = input.value.trim();

  if (!roomId) {
    alert("اكتب اسم الغرفة");
    return;
  }

  console.log("Joining:", roomId);
  socket.emit("join", roomId);
}

// تأكيد
socket.on("joined", (room) => {
  alert("دخلت الغرفة: " + room);
});

// WebRTC
function createPeer() {
  peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  peer.ontrack = (event) => {
    console.log("📺 stream received");
    remoteVideo.srcObject = event.streams[0];
    remoteVideo.play().catch(() => {});
  };

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice", { roomId, candidate: event.candidate });
    }
  };
}

// مشاركة الشاشة
async function startScreen() {
  if (!roomId) {
    alert("ادخل غرفة أول");
    return;
  }

  localStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true
  });

  localVideo.srcObject = localStream;

  createPeer();

  localStream.getTracks().forEach(track => {
    peer.addTrack(track, localStream);
  });

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);

  socket.emit("offer", { roomId, offer });
}

// استقبال offer
socket.on("offer", async ({ offer }) => {
  createPeer();

  await peer.setRemoteDescription(new RTCSessionDescription(offer));

  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);

  socket.emit("answer", { roomId, answer });
});

// استقبال answer
socket.on("answer", async ({ answer }) => {
  await peer.setRemoteDescription(new RTCSessionDescription(answer));
});

// ICE
socket.on("ice", async ({ candidate }) => {
  if (candidate) {
    await peer.addIceCandidate(new RTCIceCandidate(candidate));
  }
});

// 💬 إرسال
function sendMessage() {
  const input = document.getElementById("msgInput");
  const msg = input.value.trim();

  if (!msg) return;

  socket.emit("chat", {
    roomId,
    message: msg,
    username
  });

  addMessage("Me", msg);
  input.value = "";
}

// 💬 استقبال
socket.on("chat", ({ message, username }) => {
  addMessage(username, message);
});

// عرض
function addMessage(user, msg) {
  const li = document.createElement("li");
  li.innerHTML = <b>${user}:</b> ${msg};
  document.getElementById("chatBox").appendChild(li);
}
