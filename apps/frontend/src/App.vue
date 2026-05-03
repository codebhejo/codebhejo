<script setup>
import { onMounted } from "vue";
import { useAuthStore } from "./stores/auth.js";

const auth = useAuthStore();

onMounted(() => {
  if (!auth.user && !auth.loading) {
    auth.fetchUser();
  }
});
</script>

<template>
  <router-view />
</template>

<style>
body, html {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  background-color: #121212; /* match dark theme */
  font-family: 'Fira Code', monospace;
  color: #e0e0e0;
  box-sizing: border-box; /* include borders/padding in size */
  overflow: auto; 
}
</style>