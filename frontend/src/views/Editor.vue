<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth.js";
import MonacoEditor from "monaco-editor-vue3";
import { List, TextAlignJustify } from "lucide-vue-next";

const route = useRoute();
const auth = useAuthStore();

const fileId = route.params.fileId;
const API = import.meta.env.VITE_API_URL;

const fileName = ref("");
const content = ref("");
const saving = ref(false);
const autoSaveInterval = ref(null);
const lastSavedContent = ref("");

const options = {
  automaticLayout: true,
  wordWrap: "on"
};

const language = computed(() => {
  const extension = fileName.value.split(".").pop().toLowerCase();
  switch (extension) {
    case "js":
      return "javascript";
    case "php":
      return "php";
    case "html":
      return "html";
    case "css":
      return "css";
    default:
      return "plaintext";
  }
});

const loadCode = async () => {
  const res = await fetch(`${API}/code/${fileId}`, {
    credentials: "include",
  });
  const data = await res.json();
  content.value = data.content;
  fileName.value = data.name || fileId;
};

const saveCode = async (force = false) => {
  if (saving.value) return;
  console.log('test');
  
  if (!force && content.value === lastSavedContent.value) return;

  saving.value = true;

  try {
    const res = await fetch(`${API}/code/sign-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: fileName.value,
        fileId: fileId,
        contentType: "text/plain", // You might want to update this based on language
      }),
      credentials: "include",
    });

    const { signedUrl } = await res.json();

    await fetch(signedUrl, {
      method: "PUT",
      body: content.value,
      headers: {
        "Content-Type": "text/plain",
      },
    });

    lastSavedContent.value = content.value;

  } catch (err) {
    console.error("Save failed:", err);
    alert("Failed to save file");
  } finally {
    saving.value = false;
  }
};

const handleGlobalKeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    saveCode();
  }
};

onMounted(() => {
  loadCode();
  window.addEventListener("keydown", handleGlobalKeydown);

  autoSaveInterval.value = setInterval(() => {
    saveCode();
  }, 5000);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleGlobalKeydown);

  if (autoSaveInterval.value) {
    clearInterval(autoSaveInterval.value);
  }
});
</script>

<template>
  <div class="editor-root">
    <!-- Top bar -->
    <div class="top-bar">
      <router-link v-if="auth.isLoggedIn" to="/files" class="nav-btn">
        <TextAlignJustify size="18"/>
        <span>Files</span>
      </router-link>
      <div v-else></div>
      <input
        v-model="fileName"
        class="filename-input"
        :class="{ readonly: !auth.isLoggedIn, centered: !auth.isLoggedIn }"
        :readonly="!auth.isLoggedIn"
        placeholder="Enter filename"
        spellcheck="false"
      />

      <button class="save-btn" @click="saveCode(true)" :disabled="saving">
        {{ saving ? "Saving..." : "Save" }}
      </button>
    </div>

    <!-- Fullscreen editor -->
    <MonacoEditor
      class="editor"
      v-model:value="content"
      :options="options"
      :language="language"
      theme="vs-dark"
    />
  </div>
</template>

<style scoped>
.nav-buttons {
  display: flex;
  gap: 8px;
}
.nav-btn {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  gap: 5px;
  background-color: #1f1f1f;
  color: #ffffff;
  font-size: 13px;
  text-decoration: none;
  cursor: pointer;
  border-radius: 6px;
  border: 1px solid #797676;
}
.nav-btn:hover {
  background-color: #2a2a2a;
  border-color: #555;
}
.filename-input {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 14px;
  font-family: 'Fira Code', monospace;
  padding: 4px 6px;
  outline: none;
  min-width: 200px;
  text-align: center;
}
.filename-input::placeholder {
  color: #777;
}
.filename-input:focus {
  border-bottom-color: #888;
}
.link {
  text-decoration: none;
  color: #ffffff;
  font-weight: 500;
}
.link:hover {
  color: #ccc4c2;
}
.editor-root {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background-color: #121212;
  color: #e0e0e0;
  overflow: hidden;
}
.top-bar {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #333;
  background-color: #1f1f1f;
  flex-shrink: 0;
}
.file-id {
  font-family: monospace;
  font-size: 13px;
  color: #c0c0c0;
}
.save-btn {
  padding: 6px 14px;
  border-radius: 6px;
  border: none;
  background-color: #333;
  color: #ffffff;
  cursor: pointer;
}
.save-btn:disabled {
  opacity: 0.6;
}
.save-btn:hover:not(:disabled) {
  background-color: #555;
}
.editor {
  flex: 1 1 auto;
}
</style>
