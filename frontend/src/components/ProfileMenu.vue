<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { TextAlignJustify } from "lucide-vue-next";

const auth = useAuthStore();
const router = useRouter();
const showMenu = ref(false);
const wrapper = ref(null);

const logout = async () => {
  await auth.logout();
  showMenu.value = false;
  router.push("/");
};

const handleClickOutside = (e) => {
  if (wrapper.value && !wrapper.value.contains(e.target)) {
    showMenu.value = false;
  }
};

onMounted(() => document.addEventListener("click", handleClickOutside));
onBeforeUnmount(() => document.removeEventListener("click", handleClickOutside));
</script>

<template>
  <div v-if="auth.isLoggedIn" class="profile-wrapper" ref="wrapper">
    <div class="avatar" @click="showMenu = !showMenu">
      {{ auth.user.email.charAt(0).toUpperCase() }}
    </div>

    <div v-if="showMenu" class="dropdown">
      <p class="email">{{ auth.user.email }}</p>

      <button @click="router.push('/files'); showMenu = false">
        <TextAlignJustify size="14" /> My Files
      </button>

      <div class="divider"></div>

      <button class="danger" @click="logout">
        Logout
      </button>
    </div>
  </div>
</template>

<style scoped>
.profile-wrapper {
  position: relative;
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
  transition: background 0.2s;
}
.avatar:hover { background: #444; }

.dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 160px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
  z-index: 100;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.email {
  padding: 12px;
  font-size: 14px;
  color: #aaa;
  border-bottom: 1px solid #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  color: #e0e0e0;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.dropdown button:hover { background: #2a2a2a; }
.dropdown button.danger { color: #ef4444; }

.divider {
  height: 1px;
  background: #333;
  margin: 2px 0;
}
</style>
