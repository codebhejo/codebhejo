<script setup>
import { ref } from "vue";
import { io } from "socket.io-client";
import { createPeer } from "../utils/webrtc";
import { Copy, Check, Upload } from "lucide-vue-next";
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
    console.log("✅ P2P CONNECTED");
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
    console.log("PC:", pc.connectionState);

    if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
      cleanupConnection();
    }
  };
}

function cleanupConnection() {
  console.log("🧹 Cleaning old connection");

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
    console.log("👤 Peer joined");

    cleanupConnection();      // 🔥 reset
    setupConnection();        // 🔥 new pc + channel

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

  const CHUNK_SIZE = 16 * 1024; // 🔥 CRITICAL
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

  console.log("📦 File sent");
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
  <div class="page">
    <div class="send-container">
      <h1 class="title">Share File</h1>

      <label class="file-box">
        <Upload v-if="!file" size="18"/>
        <input type="file" hidden @change="selectFile" />
        <span>{{ file ? file.name : "Choose a file" }}</span>
      </label>

      <div v-if="shareLink" class="share-box">
        <p>Share this link:</p>

        <div class="copy-row" @click="copyLink">
          <span class="link-text">{{ shareLink }}</span>
          <Copy v-if="!copied" size="18" />
          <Check v-else size="18" />
        </div>

        <div class="qr-container">
          <div class="qr-box">
          <QrcodeVue
            :value="shareLink"
            :size="96"
            background="#121212"
            foreground="#ffffff"
          />
        </div>
        </div>
      </div>

    </div>

    <!-- OUTSIDE CARD -->
    <div v-if="shareLink" class="another">
      <button @click="reset">
        Share another file
      </button>
    </div>

    <div class="cli-box">
        <p class="cli-title">Share via CLI</p>

        <CommandBlock v-if="room" :command="`codebhejo receive ${room}`" />
        <CommandBlock v-else command="codebhejo send <file>" />

        <a class="cli-hint" href="#"
            @click.prevent="router.push('/docs/cli')">
          Install script
        </a>
      </div>
  </div>

  <ShareFileFooter/>
</template>

<style scoped>
.page {
  min-height: calc(80vh - 64px);
  background: #0f0f0f;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
}

.card {
  width: 100%;
  max-width: 420px;
  padding: 32px;
  background: linear-gradient(180deg, #161616, #121212);
  border-radius: 14px;
  border: 1px solid #2a2a2a;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  color: #e5e7eb;
  font-family: "Fira Code", monospace;
}

.title {
  font-size: 26px;
  text-align: center;
  margin-bottom: 28px;
  font-weight: 600;
}

.send-container {
  min-width: 300px;
}
.file-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 18px;
  background: #1f1e1e;
  border: 1px dashed #3a3a3a;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-box:hover {
  background: #1f1f1f;
  border-color: #555;
}

.file-box span {
  font-size: 14px;
  color: #d1d5db;
}

.share-row {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.qr-container {
  margin: 20px 0;
  display: flex;
  justify-content: center;
}

.qr-box {
  padding: 8px;
  background: transparent;
  border: 1px solid #2f2f2f;
  border-radius: 10px;
  display: inline-block;
}


.label {
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.copy-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #181818;
  border: 1px solid #2f2f2f;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.copy-row:hover {
  background: #202020;
  border-color: #4b5563;
}

.link-text {
  flex: 1;
  font-size: 13px;
  color: #e5e7eb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.another {
  margin-top: 22px;
}

.another button {
  background: transparent;
  border: 1px solid #9ca3af;
  border-radius: 6px;
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
  padding: 6px 12px;
  transition: color 0.15s ease;
}

.another button:hover {
  color: #ffffff;
}

.cli-box {
  margin-top: auto;
  padding: 10px;
  border-radius: 12px;
  min-width: 300px;
}

.cli-title {
  font-size: 13px;
  font-weight: 500;
  color: #9ca3af;
  margin-bottom: 10px;
  text-align: center;
}

.cli-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  display: block;
  text-align: center;
}

.cli-hint span {
  color: #9ca3af;
}

</style>