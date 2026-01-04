<template>
  <div class="dialog-backdrop">
    <div class="dialog-box">
      <p class="message">{{ message }}</p>
      <div class="buttons">
        <button class="btn cancel-btn" @click="$emit('cancel')">Cancel</button>
        <button class="btn confirm-btn" @click="$emit('confirm')" :disabled="loading">
          {{ loading ? "Deleting..." : "Confirm" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    required: true,
  },
  loading: Boolean
});
defineEmits(['confirm', 'cancel']);
</script>

<style scoped>
.dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  font-family: 'Fira Code', monospace;
}

.dialog-box {
  background: #1f1f1f;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #333;
  width: 90%;
  max-width: 400px;
  text-align: center;
}

.message {
  font-size: 16px;
  color: #e0e0e0;
  margin-bottom: 24px;
}

.buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.cancel-btn {
  background-color: #333;
  color: #e0e0e0;
}

.cancel-btn:hover {
  background-color: #444;
}

.confirm-btn {
  background-color: #b71c1c;
  color: white;
}

.confirm-btn:hover {
  background-color: #c62828;
}

.confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
