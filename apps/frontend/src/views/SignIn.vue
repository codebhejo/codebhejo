<script setup>
import { ref, onMounted } from "vue";
import Navbar from "../components/Navbar.vue";
import { Mail, ArrowRight, Loader } from "lucide-vue-next";

const email = ref("");
const loading = ref(false);
const sent = ref(false);
const error = ref(null);
const emailInput = ref(null);

const API = import.meta.env.VITE_API_URL;

const validateEmail = (e) =>
  /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(e);

onMounted(() => {
  emailInput.value?.focus();
});

const sendLink = async () => {
  error.value = null;
  if (!validateEmail(email.value)) {
    error.value = "Please enter a valid email address.";
    return;
  }
  try {
    loading.value = true;
    await fetch(`${API}/auth/request-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.value }),
    });
    sent.value = true;
  } catch {
    alert("Something went wrong. Try again.");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <Navbar />
  <div class="page">
    <div class="card">

      <!-- Icon -->
      <div class="icon-wrap">
        <Mail size="20" />
      </div>

      <!-- Before send -->
      <template v-if="!sent">
        <h1 class="title">Sign in</h1>
        <p class="subtitle">We'll send you a secure magic link.</p>

        <form @submit.prevent="sendLink">
          <div class="input-wrap" :class="{ 'has-error': error }">
            <input
              ref="emailInput"
              class="input"
              type="email"
              placeholder="your@email.com"
              v-model="email"
              autocomplete="email"
              name="email"
              @input="error = null"
            />
          </div>

          <p v-if="error" class="error">{{ error }}</p>

          <button class="btn" type="submit" :disabled="loading || !email">
            <Loader v-if="loading" size="14" class="spin" />
            <template v-else>
              Send magic link
              <ArrowRight size="14" />
            </template>
          </button>
        </form>
      </template>

      <!-- After send -->
      <template v-else>
        <h1 class="title">Check your email</h1>
        <p class="subtitle">We sent a sign-in link to</p>
        <p class="sent-email">{{ email }}</p>
        <p class="sent-hint">Click the link in the email to sign in. You can close this tab.</p>
      </template>

    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #121212;
  font-family: 'Fira Code', monospace;
  padding: 24px;
}

.card {
  width: 100%;
  max-width: 360px;
  background: #161616;
  border: 1px solid #242424;
  border-radius: 14px;
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.icon-wrap {
  width: 42px;
  height: 42px;
  background: #1f1f1f;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  margin-bottom: 20px;
}

.title {
  font-size: 22px;
  font-weight: 700;
  color: #f0f0f0;
  margin: 0 0 6px;
}

.subtitle {
  font-size: 13px;
  color: #555;
  margin: 0 0 24px;
}

form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-wrap {
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.15s;
}

.input-wrap:focus-within {
  border-color: #444;
}

.input-wrap.has-error {
  border-color: #5a2a2a;
}

.input {
  width: 100%;
  padding: 11px 14px;
  background: #1a1a1a;
  border: none;
  outline: none;
  color: #e0e0e0;
  font-size: 13px;
  font-family: inherit;
  box-sizing: border-box;
}

.input::placeholder {
  color: #444;
}

.error {
  font-size: 12px;
  color: #e06060;
  text-align: left;
  margin: 0;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 11px;
  background: #1f1f1f;
  border: 1px solid #333;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  margin-top: 2px;
}

.btn:hover:not(:disabled) {
  background: #2a2a2a;
  border-color: #444;
}

.btn:disabled {
  opacity: 0.4;
  cursor: default;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 0.8s linear infinite;
}

/* Success state */
.sent-email {
  font-size: 14px;
  color: #e0e0e0;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  padding: 8px 16px;
  margin: 4px 0 16px;
}

.sent-hint {
  font-size: 12px;
  color: #555;
  line-height: 1.6;
  margin: 0;
}
</style>
