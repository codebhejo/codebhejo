<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import Navbar from "../components/Navbar.vue";
import Footer from "../components/Footer.vue";
import { createFile } from "../main.js";
import { ref, onMounted } from "vue";
import { FilePlus, Files, LogIn } from "lucide-vue-next";

const auth = useAuthStore();
const router = useRouter();

const publicIp = ref("detecting...");

function getIPv4ViaSTUN() {
  return new Promise((resolve, reject) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.createDataChannel("ip");

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      const match = event.candidate.candidate.match(
        /\b((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)\b/
      );
      if (match) {
        resolve(match[0]);
        pc.onicecandidate = null;
        pc.close();
      }
    };

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch((err) => { pc.close(); reject(err); });

    setTimeout(() => { pc.close(); reject(new Error("STUN timeout")); }, 4000);
  });
}

onMounted(async () => {
  try {
    publicIp.value = await getIPv4ViaSTUN();
  } catch {
    publicIp.value = "unavailable";
  }
});
</script>

<template>
  <div class="home-container">
    <Navbar />

    <main class="home-main">
      <div class="center">
        <h1 class="title">CodeBhejo</h1>
        <p class="subtitle">Instantly create and share code snippets with your team.</p>

        <div class="actions">
          <button class="create-btn" @click="createFile">
            <FilePlus size="16" />
            New Code File
          </button>

          <button v-if="auth.isLoggedIn" class="ghost-btn" @click="router.push('/files')">
            <Files size="15" />
            My Files
          </button>

          <p v-else class="hint">
            <a class="signin-link" href="#" @click.prevent="router.push('/signin')">
              <LogIn size="13" />
              Sign in
            </a>
            to view your saved files
          </p>
        </div>

        <div class="ip-badge">
          <span class="ip-label">Your Public IPv4</span>
          <span class="ip-sep">·</span>
          <span class="ip-value">{{ publicIp }}</span>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  color: #e0e0e0;
  font-family: 'Fira Code', monospace;
  background-image:
    linear-gradient(rgba(18, 18, 18, 0.88), rgba(18, 18, 18, 0.88)),
    url('/banner.avif');
  background-size: cover;
  background-position: center;
  background-color: #121212;
}

.home-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  padding: 0 16px;
}

.title {
  font-size: 42px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  letter-spacing: -0.02em;
}

.subtitle {
  font-size: 14px;
  color: #5a6370;
  margin: 0;
  line-height: 1.6;
}

.actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.create-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 28px;
  font-size: 14px;
  font-family: inherit;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  background-color: #1f1f1f;
  color: #ffffff;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.create-btn:hover {
  background-color: #2a2a2a;
  border-color: #555;
}

.ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 16px;
  font-size: 13px;
  font-family: inherit;
  background: transparent;
  color: #6b7280;
  border: 1px dashed #2a2a2a;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.ghost-btn:hover {
  color: #e0e0e0;
  border-color: #444;
  background: #1a1a1a;
}

.hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #555;
  margin: 0;
}

.signin-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #888;
  text-decoration: none;
  transition: color 0.15s;
}

.signin-link:hover {
  color: #e0e0e0;
}

.ip-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 6px 14px;
  background: #161616;
  border: 1px solid #1e1e1e;
  border-radius: 6px;
  font-size: 12px;
}

.ip-label {
  color: #3d3d3d;
}

.ip-sep {
  color: #2a2a2a;
}

.ip-value {
  color: #888;
  letter-spacing: 0.03em;
}
</style>
