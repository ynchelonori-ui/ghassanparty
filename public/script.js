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

// دخول غرفة
joinBtn.onclick = () => {
    roomId = roomInput.value;
    if (!roomId) return alert("اكتب اسم الغرفة");

    socket.emit("join", roomId);
    console.log("Joined room:", roomId);
};

// إعداد WebRTC
function createPeer() {
    peer = new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" }
        ]
    });

    // استقبال فيديو الطرف الثاني
    peer.ontrack = (event) => {
        console.log("📺 Received stream");
        remoteVideo.srcObject = event.streams[0]; // ⭐ أهم سطر
    };

    // إرسال ICE
    peer.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("ice", {
                roomId,
                candidate: event.candidate
            });
        }
    };
}

// تشغيل الشير سكرين
screenBtn.onclick = async () => {
    try {
        localStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
        });

        localVideo.srcObject = localStream;

        createPeer();

        // إرسال الفيديو
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
        console.error("Screen share error:", err);
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

// استقبال ICE
socket.on("ice", async ({ candidate }) => {
    try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
        console.error("ICE error:", e);
    }
});
