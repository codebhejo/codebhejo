<script setup>
import { ref, onMounted } from "vue";

const email = ref("");
const loading = ref(false);
const sent = ref(false);
const error = ref(null);
const emailInput = ref(null);

const API = import.meta.env.VITE_API_URL;

const validateEmail = (email) => {
  if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    return true;
  }
  return false;
};

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
    loading.value = false;
    sent.value = true;
  } catch (error) {
    console.log(error);
    alert("Something went wrong. Try again.");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="container">
    <h1 class="title">Sign in</h1>
    <p class="subtitle">We’ll email you a secure sign-in link.</p>

    <form @submit.prevent="sendLink">
      <input
        ref="emailInput"
        class="input"
        type="email"
        placeholder="Enter your email address"
        v-model="email"
        :disabled="sent"
        autocomplete="email"
        name="email"
        @input="error = null"
      />

      <p v-if="error" class="error">{{ error }}</p>

      <button
        v-if="!sent"
        class="btn"
        type="submit"
        :disabled="loading || !email"
      >
        {{ loading ? "Sending..." : "Send login link" }}
      </button>
    </form>

    <p v-if="sent" class="success">
      Login link sent! Check your email to continue.
    </p>
  </div>
</template>


<style scoped>
.container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #121212;
  color: #e0e0e0;
  font-family: "Fira Code", monospace;
}

form {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  font-size: 42px;
  margin-bottom: 8px;
}

.subtitle {
  color: #b0b0b0;
  margin-bottom: 32px;
}

.input {
  width: 320px;
  padding: 12px;
  background: #1f1f1f;
  border: 1px solid #333;
  color: white;
  border-radius: 6px;
  margin-bottom: 20px;
}

.btn {
  padding: 12px 32px;
  background: #1f1f1f;
  border: none;
  color: white;
  border-radius: 6px;
  cursor: pointer;
}

.btn:hover {
  background: #333;
}

.error {
  color: #ff5252;
  margin-bottom: 20px;
}

.success {
  color: #4caf50;
}
</style>

