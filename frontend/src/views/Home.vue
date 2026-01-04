<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import Navbar from "../components/Navbar.vue";
import { createFile } from "../main.js";
import { ref, onMounted } from "vue";
import { TextAlignJustify } from "lucide-vue-next";

const auth = useAuthStore();
const router = useRouter();

const publicIp = ref("Detecting...");

function getIPv4ViaSTUN() {
  return new Promise((resolve, reject) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.createDataChannel("ip");

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;

      const candidate = event.candidate.candidate;
      console.log(candidate);
      
      // Extract IPv4 only
      const match = candidate.match(
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
      .catch((err) => {
        pc.close();
        reject(err);
      });

    // Safety timeout (privacy-blocked browsers)
    setTimeout(() => {
      pc.close();
      reject(new Error("STUN timeout"));
    }, 4000);
  });
}

onMounted(async () => {
  try {
    publicIp.value = await getIPv4ViaSTUN();
  } catch {
    publicIp.value = "Unavailable";
  }
});
</script>

<template>
  <div class="home-container">
    
    <Navbar></Navbar>

    <header class="home-header">
      <h1 class="title">CodeBhejo</h1>
      <p class="subtitle">
        A simple internal code-sharing and collaboration tool for developers.
      </p>
    </header>

    <main class="home-main">
      <div class="actions">
        <button class="create-btn" @click="createFile">
          Create New Code File
        </button>

        <!-- Secondary action -->
        <button
          v-if="auth.isLoggedIn"
          class="files-btn"
          @click="router.push('/files')"
        >
          <TextAlignJustify size="18"/>
          <span>View My Files</span>
        </button>

        <p v-else class="hint">
          <a
            href="#"
            @click.prevent="router.push('/signin')"
            class="signin-link"
          >Sign in</a> to view your saved files
        </p>
      </div>
    </main>

    <div class="ip-section">
      <p class="ip-text">
        Your Public IPv4:
        <span class="ip-value">{{ publicIp }}</span>
      </p>
    </div>

    <footer class="home-footer">
      <p class="footer-text">
        Instantly create and share code snippets with your team.
      </p>
    </footer>
  </div>
</template>

<style scoped>
.ip-section {
  text-align: center;
  padding: 10px;
}

.ip-text {
  font-size: 14px;
  color: #9ca3af;
}

.ip-value {
  color: #ffffff;
  font-weight: 600;
}

.home-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: #121212; /* Dark background */
  color: #e0e0e0;
  font-family: 'Fira Code', monospace;
}

/* Header at the top */
.home-header {
  text-align: center;
  padding: 150px 16px 16px 16px;
}

.title {
  font-size: 48px;
  font-weight: bold;
  margin: 0;
  color: #ffffff;
}

.subtitle {
  font-size: 18px;
  margin-top: 8px;
  color: #b0b0b0;
  line-height: 1.5;
}

/* Main: button centered vertically */
.home-main {
  flex: 1; /* take remaining space */
  display: flex;
  justify-content: center;
  align-items: center;
}

.create-btn {
  padding: 16px 40px;
  font-size: 18px;
  border: none;
  border-radius: 8px;
  background-color: #1f1f1f;
  color: #ffffff;
  cursor: pointer;
  transition: background 0.2s;
}

.create-btn:hover {
  background-color: #333333;
}

/* Footer at the bottom */
.home-footer {
  text-align: center;
  padding: 16px;
  border-top: 1px solid #333;
}

.footer-text {
  font-size: 16px;
  color: #888888;
  margin: 0;
}

.actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.files-btn {
  background: transparent;
  color: #9ca3af;
  border: 1px dashed #333;
  padding: 10px 15px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.files-btn:hover {
  color: #ffffff;
  border-color: #555;
  background: #1f1f1f;
}

.hint {
  font-size: 14px;
  color: #777;
}

.signin-link {
  color: #9ca3af;
  text-decoration: underline;
  cursor: pointer;
}

.signin-link:hover {
  color: #ffffff;
}
</style>
