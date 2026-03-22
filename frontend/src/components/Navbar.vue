<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { Github, Share2 } from "lucide-vue-next";
import ProfileMenu from "./ProfileMenu.vue";

const auth = useAuthStore();
const router = useRouter();
</script>

<template>
<nav class="navbar">
  <div class="nav-left">
    <span class="brand" @click="router.push('/')">CodeBhejo</span>
  </div>

  <div class="nav-right">
    <a
      href="https://github.com/codebhejo/codebhejo"
      target="_blank"
      rel="noopener noreferrer"
      class="github-link"
    >
      <Github size="18" />
      <span>GitHub</span>
    </a>

    <button class="share-btn" @click="router.push('/share-file')">
      <Share2 size="18"/>
      <span>Share File</span>
    </button>

    <span v-if="auth.loading" class="nav-text">Loading…</span>

    <button
      v-else-if="!auth.isLoggedIn"
      class="signin-btn"
      @click="router.push('/signin')"
    >
      Sign in
    </button>

    <ProfileMenu v-else />
  </div>
</nav>
</template>

<style scoped>
.navbar {
  height: 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid #222;
  background: #121212;
}

.brand {
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.signin-btn {
  padding: 8px 20px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #1f1f1f;
  color: white;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.signin-btn:hover {
  background: #2a2a2a;
  border-color: #666;
}

.share-btn {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #555;
  background: #3b3b3b;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background 0.2s, border-color 0.2s;
}

.share-btn:hover {
  background: #4a4a4a;
  border-color: #777;
}


.github-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #1e1e1f;
  background: transparent;
  color: #9ca3af;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
}

.github-link:hover {
  color: #ffffff;
  border-color: #333;
  background: #1f1f1f;
}

</style>