<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";
import Navbar from "../components/Navbar.vue";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const API = import.meta.env.VITE_API_URL;

const message = ref("Signing you in…");
const subMessage = ref("Please wait a moment");
const isError = ref(false);

onMounted(async () => {
  const token = route.query.token;

  if (!token) {
    showError("Invalid or missing login link");
    return;
  }

  try {
    const res = await fetch(`${API}/auth/verify?token=${token}`, {
      credentials: "include",
    });

    if (!res.ok) {
      showError("This login link is invalid or has expired");
      return;
    }

    message.value = "Signed in successfully";
    subMessage.value = "";

    setTimeout(() => {
      if (!auth.user && !auth.loading) {
        auth.fetchUser();
      }
      router.replace("/");
    }, 800);
  } catch (err) {
    console.error("Auth verify failed:", err);
    showError("Unable to connect to the server");
  }
});

function showError(text) {
  isError.value = true;
  message.value = "Sign-in failed";
  subMessage.value = text;

  setTimeout(() => {
    router.replace("/");
  }, 2500);
}
</script>


<template>
  <Navbar/>
  <div class="container">
    <h1 class="title" :class="{ error: isError }">{{ message }}</h1>
    <p class="subtitle">{{ subMessage }}</p>
  </div>
</template>


<style scoped>
.container {
  height: 90vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #121212;
  color: #e0e0e0;
  font-family: "Fira Code", monospace;
}

.title {
  font-size: 36px;
}

.subtitle {
  color: #888;
}

.title.error {
  color: #ef4444; /* red */
}
</style>
