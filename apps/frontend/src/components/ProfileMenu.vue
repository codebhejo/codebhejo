<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { Files, LogOut, ShieldCheck } from "lucide-vue-next";

const auth = useAuthStore();
const router = useRouter();
const showMenu = ref(false);
const wrapper = ref(null);

const initial = computed(() => auth.user?.email?.charAt(0).toUpperCase() ?? "?");

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
    <div
      class="avatar"
      :class="{ open: showMenu }"
      @click="showMenu = !showMenu"
      :title="auth.user.email"
    >
      {{ initial }}
    </div>

    <Transition name="dropdown">
      <div v-if="showMenu" class="dropdown">
        <div class="user-info">
          <span class="email">{{ auth.user.email }}</span>
        </div>

        <div class="divider"></div>

        <button class="menu-item" @click="router.push('/files'); showMenu = false">
          <Files size="14" />
          My Files
        </button>

        <template v-if="auth.isAdmin">
          <div class="divider"></div>
          <button class="menu-item admin" @click="router.push('/admin'); showMenu = false">
            <ShieldCheck size="14" />
            Admin Dashboard
          </button>
        </template>

        <div class="divider"></div>

        <button class="menu-item danger" @click="logout">
          <LogOut size="14" />
          Sign out
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.profile-wrapper {
  position: relative;
}

.avatar {
  width: 34px;
  height: 34px;
  background: #2a2a2a;
  border: 1px solid #333;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #e0e0e0;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
  user-select: none;
}

.avatar:hover,
.avatar.open {
  background: #333;
  border-color: #555;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05);
}

.dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 200px;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  overflow: hidden;
  z-index: 200;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.user-info {
  padding: 12px 14px;
}

.email {
  font-size: 12px;
  color: #aaa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 9px 14px;
  background: none;
  border: none;
  color: #aaa;
  font-size: 13px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.menu-item:hover {
  background: #222;
  color: #e0e0e0;
}

.menu-item.admin {
  color: #4a6fa5;
}

.menu-item.admin:hover {
  background: #0f1a2e;
  color: #7da4d8;
}

.menu-item.danger:hover {
  background: #2a1a1a;
  color: #e06060;
}

.divider {
  height: 1px;
  background: #222;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
