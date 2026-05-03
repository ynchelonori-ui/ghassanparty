const socket = io();

let roomId = "";
let peer;
let localStream;

// اسم المستخدم
let username = "User" + Math.floor(Math.random() * 1000);

// عناصر
const joinBtn = document.getElementById("joinBtn");
const roomInput = document.getElementById("roomInput");
const screenBtn = document.getElementById("screenBtn");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const sendBtn = document.getElementById("sendBtn");
const msgInput = document.getElementById("msgInput");

// اتصال
socket.on("connect", () => {
  console.log("✅ connected");
});

// دخول غرفة
joinBtn.onclick = () => {
    roomId = roomInput.value.trim();

    if (!roomId) {
        alert("اكتب اسم الغرفة");
        return;
    }

    console.log("📩 sending join:", roomId);
    socket.emit("join", roomId);
};

// 🔥 تأكيد الدخول (مهم جدًا)
socket.on("joined", (room) => {
    console.log("✅ دخلت الغرفة:", room);
    alert("تم الدخول: " + room);
});

// WebRTC
function createPeer() {
  peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  peer.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
    remoteVideo.play().catch(() => {});
  };

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice", {
        roomId,
        candidate: event.candidate
      });
    }
  };
}

// مشاركة الشاشة
screenBtn.onclick = async () => {
  if (!roomId) return alert("ادخل غرفة أول");

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
};

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

// 💬 إرسال رسالة
sendBtn.onclick = () => {
  const msg = msgInput.value.trim();
  if (!msg) return;

  socket.emit("chat", {
    roomId,
    message: msg,
    username
  });

  addMessage("Me", msg);
  msgInput.value = "";
};

// 💬 استقبال رسالة
socket.on("chat", ({ message, username }) => {
  addMessage(username, message);
});

// عرض الرسالة
function addMessage(user, msg) {
  const li = document.createElement("li");
  li.innerHTML = <b>${user}:</b> ${msg};
  document.getElementById("chatBox").appendChild(li);
}
