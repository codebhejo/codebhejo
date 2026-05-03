<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";
import * as monaco from "monaco-editor";
import { Copy, Check, Download, Link } from "lucide-vue-next";
import ProfileMenu from "../components/ProfileMenu.vue";


const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const fileId = route.params.fileId;
const API = import.meta.env.VITE_API_URL;

const editorEl = ref(null);
let monacoEditor = null;

const fileName = ref("");
const content = ref("");
const saving = ref(false);
const lastSavedContent = ref("");
const hasUnsaved = computed(() => content.value !== lastSavedContent.value);

let debounceTimer = null;

// Toast
const toastMessage = ref("");
let toastTimer = null;

function showToast(msg) {
  toastMessage.value = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastMessage.value = ""; }, 2000);
}

function copyFileLink() {
  navigator.clipboard.writeText(window.location.href).then(() => showToast("Link copied"));
}

function copyContent() {
  navigator.clipboard.writeText(content.value).then(() => showToast("Content copied"));
}

function downloadFile() {
  const blob = new Blob([content.value], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName.value || "file.txt";
  a.click();
  URL.revokeObjectURL(a.href);
}


const LANG_MAP = {
  js: "javascript", jsx: "javascript",
  ts: "typescript", tsx: "typescript",
  html: "html", css: "css", scss: "scss", less: "less",
  json: "json", php: "php", py: "python", go: "go",
  rs: "rust", java: "java", c: "c", cpp: "cpp", cs: "csharp",
  rb: "ruby", sh: "shell", bash: "shell",
  yml: "yaml", yaml: "yaml", md: "markdown", sql: "sql", xml: "xml",
};

const language = computed(() => {
  const ext = fileName.value.split(".").pop().toLowerCase();
  return LANG_MAP[ext] ?? "plaintext";
});

// Keep Monaco model language in sync when filename changes
watch(language, (lang) => {
  if (monacoEditor) {
    monaco.editor.setModelLanguage(monacoEditor.getModel(), lang);
  }
});

const loadCode = async () => {
  const res = await fetch(`${API}/code/${fileId}`, { credentials: "include" });
  const data = await res.json();
  fileName.value = data.name || fileId;
  content.value = data.content ?? "";
  if (monacoEditor) {
    monacoEditor.setValue(content.value);
    monaco.editor.setModelLanguage(monacoEditor.getModel(), language.value);
  }
};

const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10 MB

const saveCode = async (force = false) => {
  if (saving.value) return;
  if (!force && content.value === lastSavedContent.value) return;

  const sizeInBytes = new Blob([content.value]).size;
  if (sizeInBytes > FILE_SIZE_LIMIT) {
    showToast(`File too large (${(sizeInBytes / 1024 / 1024).toFixed(1)} MB). Limit is 10 MB.`);
    return;
  }

  saving.value = true;

  try {
    const res = await fetch(`${API}/code/sign-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: fileName.value,
        fileId: fileId,
        contentType: "text/plain",
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
    saveCode(true);
  }
};

const handleBeforeUnload = (e) => {
  if (hasUnsaved.value) {
    e.preventDefault();
    e.returnValue = "";
  }
};

const handleVisibilityChange = () => {
  if (document.visibilityState === "hidden" && hasUnsaved.value) {
    saveCode(true);
  }
};

onMounted(async () => {
  monacoEditor = monaco.editor.create(editorEl.value, {
    value: "",
    language: "plaintext",
    theme: "vs-dark",
    automaticLayout: true,
    wordWrap: "on",
    fontSize: 14,
    fontFamily: "'Fira Code', monospace",
    fontLigatures: true,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    renderLineHighlight: "all",
  });

  monacoEditor.onDidChangeModelContent(() => {
    content.value = monacoEditor.getValue();
    // Debounce: save 1.5s after user stops typing
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => saveCode(), 1500);
  });

  await loadCode();

  window.addEventListener("keydown", handleGlobalKeydown);
  window.addEventListener("beforeunload", handleBeforeUnload);
  document.addEventListener("visibilitychange", handleVisibilityChange);
});

onBeforeUnmount(() => {
  clearTimeout(debounceTimer);
  // Save any unsaved changes before leaving
  if (hasUnsaved.value) saveCode(true);
  monacoEditor?.dispose();
  window.removeEventListener("keydown", handleGlobalKeydown);
  window.removeEventListener("beforeunload", handleBeforeUnload);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});
</script>

<template>
  <div class="editor-root">
    <!-- Toast -->
    <transition name="toast">
      <div v-if="toastMessage" class="toast">{{ toastMessage }}</div>
    </transition>

    <!-- Top bar -->
    <div class="top-bar">

      <!-- Left: brand -->
      <div class="top-left">
        <span class="brand" @click="router.push('/')">CodeBhejo</span>
      </div>

      <!-- Center: filename -->
      <input
        v-model="fileName"
        class="filename-input"
        :readonly="!auth.isLoggedIn"
        placeholder="Untitled"
        spellcheck="false"
      />

      <!-- Right: share + save + profile -->
      <div class="top-right">

        <!-- Copy content -->
        <button class="icon-btn" @click="copyContent" title="Copy content">
          <Copy size="16" />
        </button>

        <!-- Copy link -->
        <button class="icon-btn" @click="copyFileLink" title="Copy link">
          <Link size="16" />
        </button>

        <!-- Download -->
        <button class="icon-btn" @click="downloadFile" title="Download file">
          <Download size="16" />
        </button>

        <!-- Save status pill -->
        <div
          class="save-pill"
          :class="{ saving: saving, unsaved: hasUnsaved && !saving }"
          title="Ctrl+S to save"
        >
          <span class="save-dot"></span>
          <span>{{ saving ? "Saving..." : hasUnsaved ? "Unsaved" : "Saved" }}</span>
        </div>

        <div class="nav-divider"></div>

        <!-- Profile -->
        <ProfileMenu v-if="auth.isLoggedIn" />

        <!-- Sign in (guest) -->
        <button v-else-if="!auth.loading" class="signin-btn" @click="router.push('/signin')">
          Sign in
        </button>

      </div>
    </div>

    <!-- Fullscreen editor -->
    <div ref="editorEl" class="editor"></div>
  </div>
</template>

<style scoped>
.editor-root {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background-color: #0d1117;
  color: #e6edf3;
  overflow: hidden;
}

/* ── Top bar ── */
.top-bar {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #30363d;
  background-color: #161b22;
  flex-shrink: 0;
  gap: 12px;
}

.top-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.top-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* Brand */
.brand {
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  color: #ffffff;
  white-space: nowrap;
}
.brand:hover {
  color: #ccc;
}

/* Files nav button */
.nav-btn {
  display: flex;
  align-items: center;
  padding: 5px 10px;
  gap: 5px;
  background-color: transparent;
  color: #8b949e;
  font-size: 13px;
  text-decoration: none;
  cursor: pointer;
  border-radius: 6px;
  border: 1px solid #30363d;
  transition: all 0.2s;
}
.nav-btn:hover {
  color: #e6edf3;
  border-color: #6e7681;
  background-color: #21262d;
}

/* Filename */
.filename-input {
  width: 200px;
  background: transparent;
  border: none;
  border-bottom: 1px solid transparent;
  color: #ffffff;
  font-size: 13px;
  padding: 4px 6px;
  outline: none;
  text-align: center;
  transition: border-color 0.2s;
}
.filename-input::placeholder { color: #555; }
.filename-input:focus { border-bottom-color: #555; }
.filename-input[readonly] { color: #aaa; cursor: default; }

/* Save status pill */
.save-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid #30363d;
  background: #161b22;
  font-size: 12px;
  color: #6e7681;
  white-space: nowrap;
  flex-shrink: 0;
  width: 90px;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.save-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #3fb950;
  flex-shrink: 0;
  transition: background 0.2s;
}
.save-pill.unsaved { color: #f0883e; border-color: #f0883e33; background: #f0883e0d; }
.save-pill.unsaved .save-dot { background: #f0883e; }
.save-pill.saving { color: #8b949e; border-color: #30363d; }
.save-pill.saving .save-dot { background: #8b949e; animation: pulse-dot 1s ease-in-out infinite; }

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* Divider between pill and avatar */
.nav-divider {
  width: 1px;
  height: 20px;
  background: #30363d;
  flex-shrink: 0;
}


/* Sign in */
.signin-btn {
  padding: 5px 14px;
  border-radius: 6px;
  border: 1px solid #30363d;
  background: #21262d;
  color: #e6edf3;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.signin-btn:hover { background: #30363d; border-color: #6e7681; }

/* Shared dropdown wrapper */
.dropdown-wrapper {
  position: relative;
}

/* Icon-only buttons */
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid #30363d;
  background: transparent;
  color: #8b949e;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.icon-btn:hover { color: #e6edf3; border-color: #6e7681; background: #21262d; }


/* Editor */
.editor { flex: 1 1 auto; }

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #21262d;
  border: 1px solid #30363d;
  color: #e6edf3;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  z-index: 999;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  pointer-events: none;
}
.toast-enter-active, .toast-leave-active { transition: opacity 0.2s, transform 0.2s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(6px); }
</style>
