<script setup lang="ts">
import { Shield } from 'lucide-vue-next';

</script>

<template>
<footer class="p2p-footer">
  <p>
    <Shield size="14" style="vertical-align: middle; margin-right: 4px" />
    This is peer-to-peer transfer.
    Files are sent directly between devices and are never stored on any servers.
  </p>
</footer>

</template>

<style scoped>
.p2p-footer {
  margin-top: auto;
  padding: 14px 16px;
  text-align: center;
  font-size: 12.5px;
  color: #9ca3af;
  border-top: 1px solid #262626;
  background: transparent;
}

.p2p-footer p {
  margin: 0;
  line-height: 1.6;
}

</style>