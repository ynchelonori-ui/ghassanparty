const socket = io();

let roomId = "";
let peer;
let localStream;

// عناصر الصفحة
const joinBtn = document.getElementById("joinBtn");
const roomInput = document.getElementById("roomInput");
const screenBtn = document.getElementById("screenBtn");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

// اتصال
socket.on("connect", () => {
    console.log("✅ connected to server");
});

// 🔥 دخول الغرفة
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

// إنشاء WebRTC
function createPeer() {
    peer = new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" }
        ]
    });

    peer.ontrack = (event) => {
        console.log("📺 Received stream");
        remoteVideo.srcObject = event.streams[0];
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

// 📺 مشاركة الشاشة
screenBtn.onclick = async () => {
    if (!roomId) {
        alert("ادخل غرفة أول");
        return;
    }

    try {
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

        socket.emit("offer", {
            roomId,
            offer
        });

    } catch (err) {
        console.error("❌ Screen share error:", err);
    }
};

// استقبال offer
socket.on("offer", async ({ offer }) => {
    createPeer();

    await peer.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit("answer", {
        roomId,
        answer
    });
});

// استقبال answer
socket.on("answer", async ({ answer }) => {
    await peer.setRemoteDescription(new RTCSessionDescription(answer));
});

// ICE
socket.on("ice", async ({ candidate }) => {
    try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
        console.error("ICE error:", e);
    }
});
