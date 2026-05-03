<script setup>
import { ref } from "vue"
import { Copy, Check } from "lucide-vue-next"

defineProps({
  command: {
    type: String,
    required: true,
  },
  label: String,
})

const copied = ref(false)

function copy(command) {
  navigator.clipboard.writeText(command)
  copied.value = true
  setTimeout(() => (copied.value = false), 500)
}
</script>

<template>
  <div class="command-wrapper">
    <p v-if="label" class="command-label">{{ label }}</p>

    <div class="command-box" @click="copy(command)">
      <code>{{ command }}</code>
      <Copy v-if="!copied" size="16" />
      <Check v-else size="16" />
    </div>
  </div>
</template>

<style scoped>
    .command-wrapper {
  margin-bottom: 10px;
}

.command-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.command-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #0d0d0d;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.command-box:hover {
  border-color: #4b5563;
  background: #141414;
}

.command-box code {
  flex: 1;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>