<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { io } from "socket.io-client";
import { createPeer } from "../utils/webrtc";
import { useRoute } from "vue-router";
import { CheckCircle } from "lucide-vue-next";
import Navbar from "../components/Navbar.vue";
import ShareFileFooter from "../components/ShareFileFooter.vue";

const API = import.meta.env.VITE_API_URL;
const WAIT_TIMEOUT = import.meta.env.VITE_WAIT_FOR_SENDER || 10000; // 10s default

const route = useRoute();
const room = ref(route.params.fileId || "");
const fileName = ref("");
const progress = ref(0);
const completed = ref(false);
const visible = ref(false); // show receiving UI
const loading = ref(true);   // waiting for sender
const stopped = ref(false);   // sender not connected within timeout

let pc = null;
let socket = null;
let dataChannel = null;

let chunks = [];
let receivedBytes = 0;
let fileSize = 0;
let stallTimer = null;
let waitTimer = null;

/* -------------------- JOIN ROOM -------------------- */
function join() {
  socket = io(`${API}/p2p`);
  pc = createPeer();

  socket.emit("join", { room: room.value });

  // ICE candidates
  pc.onicecandidate = e => {
    if (e.candidate) {
      socket.emit("candidate", { room: room.value, candidate: e.candidate });
    }
  };
  socket.on("candidate", async ({ candidate }) => {
    try { await pc.addIceCandidate(candidate); } 
    catch (err) { console.error("ICE error", err); }
  });

  // Offer from sender
  socket.on("offer", async ({ sdp }) => {
    await pc.setRemoteDescription({ type: "offer", sdp });
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("answer", { room: room.value, sdp: answer.sdp });
  });

  // Data channel
  pc.ondatachannel = e => {
    dataChannel = e.channel;
    dataChannel.onopen = () => {
      console.log("✅ Receiver connected");
      resetUI();
      clearWaitTimer(); // sender connected in time
    };
    dataChannel.onmessage = onMessage;
    dataChannel.onerror = err => console.error("Channel error", err);
  };
}

/* -------------------- MESSAGE HANDLER -------------------- */
function onMessage(msg) {
  resetStallTimer();

  // Meta message
  if (typeof msg.data === "string") {
    const meta = JSON.parse(msg.data);
    fileName.value = meta.name;
    fileSize = meta.size;
    receivedBytes = 0;
    chunks = [];
    progress.value = 0;
    completed.value = false;
    visible.value = true;
    stopped.value = false;
    loading.value = false;
    return;
  }

  // Binary chunk
  chunks.push(msg.data);
  receivedBytes += msg.data.byteLength;
  progress.value = Math.min(100, Math.floor((receivedBytes / fileSize) * 100));

  if (receivedBytes >= fileSize) finishDownload();
}

function finishDownload() {
  const blob = new Blob(chunks);
  download(blob, fileName.value);
  progress.value = 100;
  completed.value = true;
  cleanupTransfer();
}

function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function resetUI() {
  progress.value = 0;
  completed.value = false;
}

function resetStallTimer() {
  clearTimeout(stallTimer);
  stallTimer = setTimeout(() => {
    console.warn("⚠ Transfer stalled");
    dataChannel?.close();
  }, 30000);
}

function cleanupTransfer() {
  clearTimeout(stallTimer);
  dataChannel?.close();
  chunks = [];
  receivedBytes = 0;
  fileSize = 0;
}


function startWaitTimer() {
  clearWaitTimer();
  waitTimer = setTimeout(() => {
    loading.value = false;
    stopped.value = true; // no sender connected
  }, WAIT_TIMEOUT);
}

function clearWaitTimer() {
  if (waitTimer) {
    clearTimeout(waitTimer);
    waitTimer = null;
  }
}

onMounted(() => {
  if (room.value) {
    join();
    startWaitTimer(); // start 10s wait
  } else {
    loading.value = false; 
    stopped.value = true;
  }
});

onBeforeUnmount(() => {
  clearTimeout(stallTimer);
  clearWaitTimer();
  dataChannel?.close();
  pc?.close();
  socket?.disconnect();
});
</script>

<template>
  <Navbar></Navbar>

  <!-- Waiting for sender -->
  <div v-if="loading" class="waiting-wrapper">
    <div class="card">
      <h2>Waiting for sender...</h2>
      <p>File will start downloading automatically when sender connects.</p>
    </div>
  </div>

  <!-- Receiving file -->
  <div v-else-if="visible" class="receive-wrapper">
    <div class="card">
      <h2 class="filename">{{ fileName }}</h2>

      <div class="progress">
        <div class="bar" :style="{ width: progress + '%' }"></div>
      </div>

      <p v-if="!completed" class="percent">{{ progress }}%</p>
      <p v-else class="done">
        <CheckCircle :size="22" />
        <span>Downloaded</span>
      </p>
    </div>
  </div>

  <!-- No room / session ended -->
  <div v-else-if="stopped" class="no-room">
    <div class="card">
      <h2>⚠ File sharing stopped</h2>
      <p>The sender is no longer sharing the file or the link is invalid.</p>
    </div>
  </div>

  <ShareFileFooter></ShareFileFooter>
</template>

<style scoped>

.waiting-wrapper,
.receive-wrapper,
.no-room {
  height: 82vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #121212;
  color: #e0e0e0;
  font-family: "Fira Code", monospace;
}

.card {
  width: 360px;
  padding: 28px;
  background: #1a1a1a;
  border-radius: 12px;
  border: 1px solid #333;
  text-align: center;
}

.filename {
  font-size: 16px;
  margin-bottom: 18px;
  word-break: break-all;
}

.progress {
  height: 8px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: #4caf50;
  transition: width 0.25s ease;
}

.percent {
  margin-top: 10px;
  font-size: 14px;
  color: #bbb;
}

.done {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #4caf50;
}

.waiting-wrapper h2 {
  font-size: 18px;
  margin-bottom: 12px;
  color: #facc15;
}

.waiting-wrapper p {
  font-size: 14px;
  color: #bbb;
}

.no-room h2 {
  font-size: 18px;
  margin-bottom: 12px;
  color: #ff5252;
}

.no-room p {
  font-size: 14px;
  color: #bbb;
}
</style>
