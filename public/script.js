const socket = io();

let roomId = "";
let localStream;
let peer;

const video = document.getElementById("video");

// دخول غرفة
function joinRoom() {
    roomId = document.getElementById("roomInput").value;
    socket.emit("join", roomId);
}

// 🖥️ مشاركة الشاشة
async function startScreen() {
    localStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
    });

    video.srcObject = localStream;

    createPeer();
}

// إنشاء اتصال
function createPeer() {
    peer = new RTCPeerConnection();

    localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream);
    });

    peer.ontrack = (event) => {
        video.srcObject = event.streams[0];
    };

    peer.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("ice", { roomId, candidate: event.candidate });
        }
    };

    socket.on("ice", async ({ candidate }) => {
        if (candidate) {
            await peer.addIceCandidate(candidate);
        }
    });

    socket.on("offer", async ({ offer }) => {
        await peer.setRemoteDescription(offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("answer", { roomId, answer });
    });

    socket.on("answer", async ({ answer }) => {
        await peer.setRemoteDescription(answer);
    });

    createOffer();
}

// إرسال عرض
async function createOffer() {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit("offer", { roomId, offer });
}

// 💬 الشات (مثل ما هو)
function sendMsg() {
    const input = document.getElementById("msgInput");
    const message = input.value;

    socket.emit("chat", { roomId, message });
    addMsg("أنت: " + message);

    input.value = "";
}

socket.on("chat", (msg) => {
    addMsg("الشخص: " + msg);
});

function addMsg(msg) {
    const div = document.createElement("div");
    div.textContent = msg;
    document.getElementById("messages").appendChild(div);
}