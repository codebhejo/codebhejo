<script setup>
import { ref } from "vue";
import { io } from "socket.io-client";
import { createPeer } from "../utils/webrtc";
import { Copy, Check, Upload, FileIcon, Wifi } from "lucide-vue-next";
import Navbar from "../components/Navbar.vue";
import QrcodeVue from "qrcode.vue";
import ShareFileFooter from "../components/ShareFileFooter.vue";
import CommandBlock from "../components/CommandBlock.vue";
import { useRouter } from "vue-router";

const API = import.meta.env.VITE_API_URL;
const router = useRouter()

const file = ref(null);
const room = ref(null);
const progress = ref(0);
const shareLink = ref(null);
const copied = ref(false);

let pc, channel, socket;

async function selectFile(e) {
  file.value = e.target.files[0];
  await start();
}

function setupConnection() {
  pc = createPeer();

  channel = pc.createDataChannel("file",{
    ordered: true,
    maxRetransmits: null
  });
  channel.binaryType = "arraybuffer";

  channel.onopen = () => {
    progress.value = 0;
    sendFile();
  };

  channel.onerror = err => {
    console.error("DataChannel error", err);
  };

  pc.onicecandidate = e => {
    if (e.candidate) {
      socket.emit("candidate", {
        room: room.value,
        candidate: e.candidate
      });
    }
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
      cleanupConnection();
    }
  };
}

function cleanupConnection() {
  if (channel) {
    channel.close();
    channel = null;
  }

  if (pc) {
    pc.close();
    pc = null;
  }
}

async function start() {
  const res = await fetch(`${API}/p2p/session`, { method: "POST" });
  const data = await res.json();

  room.value = data.room;
  shareLink.value = `${window.location.origin}/d/${room.value}`;

  socket = io(`${API}/p2p`);
  socket.emit("join", { room: room.value });

  socket.on("peer-joined", async () => {
    cleanupConnection();      // reset
    setupConnection();        // new pc + channel

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("offer", { room: room.value, sdp: offer.sdp });
  });

  socket.on("answer", async ({ sdp }) => {
    await pc.setRemoteDescription({ type: "answer", sdp });
  });

  socket.on("candidate", async ({ candidate }) => {
    if (pc) {
      await pc.addIceCandidate(candidate);
    }
  });
}

async function sendFile() {
  if (!file.value || !channel) return;

  channel.send(JSON.stringify({
    type: "meta",
    name: file.value.name,
    size: file.value.size
  }));

  const CHUNK_SIZE = 16 * 1024;
  let offset = 0;
  const fileSize = file.value.size;

  while (offset < fileSize) {

    while (channel.bufferedAmount > 512 * 1024) {
      await new Promise(r => setTimeout(r, 20));
    }

    const slice = file.value.slice(offset, offset + CHUNK_SIZE);
    const buffer = await slice.arrayBuffer();

    channel.send(buffer);

    offset += buffer.byteLength;
    progress.value = Math.min(100, (offset / fileSize) * 100);
  }

}

function copyLink() {
  if (!shareLink.value) return;

  navigator.clipboard.writeText(shareLink.value);
  copied.value = true;

  setTimeout(() => { copied.value = false },500);
}

function reset() {
  file.value = null;
  room.value = null;
  shareLink.value = null;
  progress.value = 0;

  channel?.close();
  pc?.close();
  socket?.disconnect();
}

</script>

<template>
  <Navbar></Navbar>
  <div class="page-wrap">
    <div class="page">
      <div class="card">

        <!-- Title -->
        <h1 class="title">Share File</h1>

        <!-- File picker -->
        <label class="file-box" :class="{ 'has-file': file }">
          <Upload v-if="!file" size="16" class="upload-icon" />
          <FileIcon v-else size="16" class="file-icon" />
          <input type="file" hidden @change="selectFile" />
          <span class="file-name">{{ file ? file.name : "Choose a file to share" }}</span>
        </label>

        <!-- Share section -->
        <div v-if="shareLink" class="share-section">

          <!-- Status -->
          <div class="status" :class="progress >= 100 ? 'done' : progress > 0 ? 'sending' : 'waiting'">
            <span class="status-dot"></span>
            {{ progress >= 100 ? 'Transfer complete' : progress > 0 ? `Sending… ${Math.floor(progress)}%` : 'Waiting for receiver…' }}
          </div>

          <!-- Progress bar -->
          <div v-if="progress > 0" class="progress-bar-track">
            <div class="progress-bar-fill" :style="{ width: progress + '%' }"></div>
          </div>

          <div class="share-body">
            <!-- QR -->
            <div class="qr-box">
              <QrcodeVue :value="shareLink" :size="110" background="#161616" foreground="#ffffff" />
            </div>

            <!-- Link + actions -->
            <div class="share-right">
              <p class="share-label">Share link</p>
              <div class="copy-row" @click="copyLink">
                <span class="link-text">{{ shareLink }}</span>
                <Copy v-if="!copied" size="15" />
                <Check v-else size="15" class="check-icon" />
              </div>

              <div class="divider"></div>

              <p class="share-label">Via CLI</p>
              <CommandBlock :command="`codebhejo receive ${room}`" />
              <a class="cli-hint" href="#" @click.prevent="router.push('/docs/cli')">Install script</a>
            </div>
          </div>

          <button class="reset-btn" @click="reset">Share another file</button>
        </div>

        <!-- CLI hint before file selected -->
        <div v-else class="pre-cli">
          <p class="share-label">Via CLI</p>
          <CommandBlock command="codebhejo send &lt;file&gt;" />
          <a class="cli-hint" href="#" @click.prevent="router.push('/docs/cli')">Install script</a>
        </div>

      </div>
    </div>
    <ShareFileFooter/>
  </div>
</template>

<style scoped>
.page-wrap {
  min-height: calc(100vh - 56px);
  background: #0f0f0f;
  display: flex;
  flex-direction: column;
}

.page {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 32px 16px;
}

.card {
  width: 100%;
  max-width: 520px;
  background: #161616;
  border-radius: 14px;
  border: 1px solid #2a2a2a;
  padding: 24px;
  font-family: 'Fira Code', monospace;
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 16px;
}

/* File box */
.file-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #1c1c1c;
  border: 1px dashed #3a3a3a;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  margin-bottom: 0;
}

.file-box:hover {
  border-color: #555;
  background: #202020;
}

.file-box.has-file {
  border-style: solid;
  border-color: #2e4a2e;
  background: #1a231a;
}

.upload-icon { color: #666; }
.file-icon   { color: #6dbf6d; }

.file-name {
  font-size: 13px;
  color: #ccc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Share section */
.share-section {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Status badge */
.status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #2a2a2a;
  color: #9ca3af;
  background: #1a1a1a;
}

.status.waiting  { border-color: #2a3a2a; color: #888; }
.status.sending  { border-color: #3a3a2a; color: #c9b45a; background: #1e1d16; }
.status.done     { border-color: #2a4a2a; color: #6dbf6d; background: #161e16; }

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.waiting .status-dot  { animation: pulse 1.5s infinite; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

/* Progress bar */
.progress-bar-track {
  height: 4px;
  background: #2a2a2a;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: #4caf50;
  transition: width 0.25s ease;
}

/* Share body: QR left, details right */
.share-body {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.qr-box {
  flex-shrink: 0;
  padding: 8px;
  background: #161616;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  line-height: 0;
}

.share-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.share-label {
  font-size: 11px;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.copy-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 7px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.copy-row:hover {
  background: #202020;
  border-color: #444;
}

.link-text {
  flex: 1;
  font-size: 12px;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.check-icon { color: #6dbf6d; }

.divider {
  height: 1px;
  background: #222;
  margin: 2px 0;
}

.cli-hint {
  font-size: 11px;
  color: #555;
  text-decoration: none;
  transition: color 0.15s;
}

.cli-hint:hover { color: #aaa; }

/* Reset button */
.reset-btn {
  align-self: flex-start;
  background: transparent;
  border: 1px solid #333;
  border-radius: 6px;
  color: #777;
  font-size: 12px;
  font-family: inherit;
  padding: 5px 12px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.reset-btn:hover {
  color: #e0e0e0;
  border-color: #555;
}

/* Pre-file CLI hint */
.pre-cli {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #222;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>