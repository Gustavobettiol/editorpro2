const socket = io();

let localStream;
let username;
let currentRoom = 'General';
let peers = {}; // id -> SimplePeer instance

const loginOverlay = document.getElementById('login-overlay');
const appContainer = document.getElementById('app-container');
const usernameInput = document.getElementById('username-input');
const roomSelect = document.getElementById('room-select');
const btnEnter = document.getElementById('btn-enter');

const videoGrid = document.getElementById('video-grid');
const localVideo = document.getElementById('local-video');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');
const currentRoomName = document.getElementById('current-room-name');

const btnToggleCam = document.getElementById('btn-toggle-cam');
const btnToggleMic = document.getElementById('btn-toggle-mic');

let camEnabled = true;
let micEnabled = true;

// Enter App
btnEnter.addEventListener('click', async () => {
    username = usernameInput.value.trim() || 'Anónimo' + Math.floor(Math.random() * 1000);
    currentRoom = roomSelect.value;

    loginOverlay.classList.add('hidden');
    appContainer.classList.remove('hidden');
    currentRoomName.textContent = currentRoom;

    await initCamera();
    joinRoom(currentRoom);
});

async function initCamera() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        localVideo.srcObject = localStream;
    } catch (err) {
        console.error('No se pudo acceder a la cámara:', err);
        // Fallback to audio only or nothing
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e) {
            console.error('Tampoco se pudo acceder al micrófono');
            // Create dummy stream to avoid crashes
            localStream = new MediaStream();
        }
    }
}

function joinRoom(room) {
    socket.emit('join-room', { username, room });
}

// Room switching
document.querySelectorAll('.room-item').forEach(item => {
    item.addEventListener('click', () => {
        const newRoom = item.getAttribute('data-room');
        if (newRoom === currentRoom) return;

        // UI update
        document.querySelector('.room-item.active').classList.remove('active');
        item.classList.add('active');
        currentRoomName.textContent = newRoom;

        // Clean old peers
        Object.keys(peers).forEach(id => {
            if (peers[id]) {
                peers[id].destroy();
                removeVideo(id);
            }
        });
        peers = {};

        // Socket action
        currentRoom = newRoom;
        joinRoom(currentRoom);

        // Clear chat
        chatMessages.innerHTML = `<div class="system-msg">Bienvenido a la sala ${currentRoom}</div>`;
    });
});

// Chat Logic
btnSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const text = chatInput.value.trim();
    if (text) {
        socket.emit('send-message', text);
        chatInput.value = '';
    }
}

socket.on('new-message', ({ id, username, text, time }) => {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg';

    const header = document.createElement('div');
    header.className = 'msg-header';

    const userSpan = document.createElement('span');
    userSpan.className = 'user';
    userSpan.textContent = username;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'time';
    timeSpan.textContent = time;

    header.appendChild(userSpan);
    header.appendChild(timeSpan);

    const textDiv = document.createElement('div');
    textDiv.className = 'msg-text';
    textDiv.textContent = text;

    msgDiv.appendChild(header);
    msgDiv.appendChild(textDiv);

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// WebRTC Logic
socket.on('room-users', (users) => {
    users.forEach(user => {
        const peer = createPeer(user.id, socket.id, localStream);
        peers[user.id] = peer;
    });
});

socket.on('user-joined', ({ id, username }) => {
    addSystemMsg(`${username} ha entrado.`);
});

socket.on('user-left', ({ id, username }) => {
    addSystemMsg(`${username} ha salido.`);
    if (peers[id]) {
        peers[id].destroy();
        delete peers[id];
    }
    removeVideo(id);
});

socket.on('signal', ({ from, signal }) => {
    if (!peers[from]) {
        const peer = addPeer(from, socket.id, localStream);
        peers[from] = peer;
    }
    peers[from].signal(signal);
});

function createPeer(userToSignal, callerID, stream) {
    const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream
    });

    peer.on('signal', signal => {
        socket.emit('signal', { to: userToSignal, signal });
    });

    peer.on('stream', stream => {
        addVideo(userToSignal, stream);
    });

    return peer;
}

function addPeer(incomingSignal, callerID, stream) {
    const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream
    });

    peer.on('signal', signal => {
        socket.emit('signal', { to: incomingSignal, signal });
    });

    peer.on('stream', stream => {
        addVideo(incomingSignal, stream);
    });

    return peer;
}

function addVideo(id, stream) {
    let videoWrapper = document.getElementById(`video-${id}`);
    if (!videoWrapper) {
        videoWrapper = document.createElement('div');
        videoWrapper.className = 'video-wrapper';
        videoWrapper.id = `video-${id}`;

        const video = document.createElement('video');
        video.autoplay = true;
        video.playsinline = true;
        video.srcObject = stream;

        const label = document.createElement('div');
        label.className = 'video-label';
        label.textContent = 'Usuario'; // Could fetch actual username

        videoWrapper.appendChild(video);
        videoWrapper.appendChild(label);
        videoGrid.appendChild(videoWrapper);
    }
}

function removeVideo(id) {
    const videoWrapper = document.getElementById(`video-${id}`);
    if (videoWrapper) videoWrapper.remove();
}

function addSystemMsg(text) {
    const div = document.createElement('div');
    div.className = 'system-msg';
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Media Controls
btnToggleCam.addEventListener('click', () => {
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
        camEnabled = !camEnabled;
        videoTrack.enabled = camEnabled;
        btnToggleCam.innerHTML = camEnabled ? '<i class="fas fa-video"></i>' : '<i class="fas fa-video-slash"></i>';
        btnToggleCam.style.backgroundColor = camEnabled ? 'rgba(0,0,0,0.6)' : 'var(--red)';
    } else {
        alert('No se detectó cámara.');
    }
});

btnToggleMic.addEventListener('click', () => {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
        micEnabled = !micEnabled;
        audioTrack.enabled = micEnabled;
        btnToggleMic.innerHTML = micEnabled ? '<i class="fas fa-microphone"></i>' : '<i class="fas fa-microphone-slash"></i>';
        btnToggleMic.style.backgroundColor = micEnabled ? 'rgba(0,0,0,0.6)' : 'var(--red)';
    } else {
        alert('No se detectó micrófono.');
    }
});
