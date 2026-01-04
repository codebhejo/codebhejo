<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { ref } from "vue";
import { Share2 } from "lucide-vue-next";

const auth = useAuthStore();
const router = useRouter();
const showMenu = ref(false);

const logout = async () => {
  await auth.logout();
  showMenu.value = false;
  router.push("/");
};

</script>

<template>
<nav class="navbar">
  <div class="nav-left">
    <span class="brand" @click="router.push('/')">CodeBhejo</span>
  </div>

  <div class="nav-right">
    <button
      class="share-btn"
      @click="router.push('/share-file')"
    >
      <Share2 size="18"/>
      <span>Share File</span>
    </button>
    <!-- Loading -->
    <span v-if="auth.loading" class="nav-text">Loading…</span>
    <!-- Logged out -->
    <button
      v-else-if="!auth.isLoggedIn"
      class="signin-btn"
      @click="router.push('/signin')"
    >
      Sign in
    </button>

    <!-- Logged in -->
    <div v-else class="profile-wrapper">
      <div class="avatar" @click="showMenu = !showMenu">
        {{ auth.user.email.charAt(0).toUpperCase() }}
      </div>

      <div v-if="showMenu" class="dropdown">
        <p class="email">{{ auth.user.email }}</p>

        <button class="danger" @click="logout">
          Logout
        </button>
      </div>
    </div>
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
}

.signin-btn {
  padding: 8px 20px;
  border-radius: 6px;
  border: 1px solid #333;
  background: #1f1f1f;
  color: white;
  cursor: pointer;
}

.share-btn {
  padding: 8px 12px;
  margin-right: 30px;
  border-radius: 6px;
  border: 1px solid #1e1e1f;
  background: #3b3b3b;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.avatar {
  width: 36px;
  height: 36px;
  background: #333;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-weight: bold;
}

.profile-wrapper {
  position: relative;
}

.dropdown {
  position: absolute;
  right: 0;
  top: 48px;
  min-width: 100px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
  z-index: 10;
}

.dropdown .email {
  padding: 12px;
  font-size: 14px;
  color: #aaa;
  border-bottom: 1px solid #333;
}

.dropdown button {
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  color: #e0e0e0;
  text-align: left;
  cursor: pointer;
}

.dropdown button:hover {
  background: #2a2a2a;
}

.dropdown button.danger {
  color: #ef4444;
}
</style>