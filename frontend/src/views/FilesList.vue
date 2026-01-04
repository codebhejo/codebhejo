<script setup>
import { ref, computed, onMounted } from "vue";
import { useFilesStore } from "../stores/files.js";
import Navbar from "../components/Navbar.vue";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import { createFile } from "../main.js";

const filesStore = useFilesStore();
const API = import.meta.env.VITE_API_URL;


const search = ref("");
const limit = ref(10);
const filterDate = ref(""); // single date
const showDeleteConfirm = ref(false);
const fileToDelete = ref(null);
const isDeleting = ref(false);


const HARD_LIMIT_ALL = 200;

const limitOptions = [
  { label: "10", value: 10 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
  { label: "All", value: "all" },
];

onMounted(() => {
  filesStore.fetchFiles();
});

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const filteredFiles = computed(() => {
  let files = filesStore.files;

  if (search.value.trim()) {
    const q = search.value.toLowerCase();
    files = files.filter(file =>
      file.name.toLowerCase().includes(q)
    );
  }

  if (filterDate.value) {
    const start = new Date(filterDate.value).setHours(0, 0, 0, 0);
    const end = new Date(filterDate.value).setHours(23, 59, 59, 999);

    files = files.filter(file => {
      const updated = new Date(file.updated_at).getTime();
      return updated >= start && updated <= end;
    });
  }

  const effectiveLimit =
    limit.value === "all" ? HARD_LIMIT_ALL : limit.value;

  return files.slice(0, effectiveLimit);
});

const copied = ref(false);

function copyFileLink(fileId) {
  const url = `${window.location.origin}/${fileId}`;

  navigator.clipboard.writeText(url).then(() => {
    copied.value = true;

    setTimeout(() => {
      copied.value = false;
    }, 1500);
  });
}

function deleteFile(fileId) {
  fileToDelete.value = fileId;
  showDeleteConfirm.value = true;
}

async function handleDeleteConfirm() {
  if (!fileToDelete.value || isDeleting.value) return;

  isDeleting.value = true;

  try {

    const res = await fetch(`${API}/code/${fileToDelete.value}`, {
      method: "DELETE",
      credentials: "include"
    });

    if (res.ok) {
      filesStore.fetchFiles();
    } else {
      const errorData = await res.json();
      alert(errorData.message || "Failed to delete file.");
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    alert("An error occurred while deleting the file.");
  } finally {
    isDeleting.value = false;
    handleDeleteCancel();
  }
}

function handleDeleteCancel() {
  showDeleteConfirm.value = false;
  fileToDelete.value = null;
}
</script>

<template>
  <Navbar></Navbar>

  <ConfirmDialog
    v-if="showDeleteConfirm"
    message="Are you sure you want to delete this file?"
    :loading="isDeleting"
    @confirm="handleDeleteConfirm"
    @cancel="handleDeleteCancel"
  />

  <div class="files-root">
    <div v-if="copied" class="copy-popup">
      Link copied ✔
    </div>

    <div class="header">
      <div class="controls">
        <input
          v-model="search"
          type="text"
          class="search-input"
          placeholder="Search files..."
        />

        <input
          v-model="filterDate"
          type="date"
          class="date-input"
          title="Filter by date"
        />

        <select v-model="limit" class="limit-select">
          <option
            v-for="opt in limitOptions"
            :key="opt.label"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>

      <button class="create-btn" @click="createFile">
        New Code File
      </button>
    </div>

    <table class="files-table">
      <thead>
        <tr>
          <th>SR</th>
          <th>Name</th>
          <th class="date-col right">Updated At</th>
          <th class="date-col right">Created At</th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="(file, index) in filteredFiles"
          :key="file.file_id"
        >
          <td class="sr">{{ index + 1 }}</td>

          <td>
            <router-link
              class="file-link"
              :to="`/${file.file_id}`"
            >
              {{ file.name }}
            </router-link>
          </td>
          
          <td class="date date-col right">
            {{ formatDate(file.updated_at) }}
          </td>

          <td class="date date-col right">
            {{ formatDate(file.created_at) }}
          </td>

          <td class="actions-col right">
            <button
              class="copy-btn"
              @click="copyFileLink(file.file_id)"
              title="Copy file link"
            >
              Copy
            </button>
            <button
              class="delete-btn"
              @click="deleteFile(file.file_id)"
              title="Delete file"
            >
              Delete
            </button>
          </td>
        </tr>

        <tr v-if="!filteredFiles.length">
          <td colspan="5" class="empty">
            No files found
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.files-root {
  min-height: 100%;
  padding: 16px;
  background-color: #121212;
  color: #e0e0e0;
  font-family: 'Fira Code', monospace;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.title {
  font-size: 18px;
  font-weight: 500;
  color: #ffffff;
}

.search-input,
.date-input,
.limit-select {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #2a2a2a;
  background-color: #1f1f1f;
  color: #e0e0e0;
  font-size: 13px;
  outline: none;
}

.search-input {
  width: 200px;
}

.date-input {
  width: 140px;
}

.search-input::placeholder {
  color: #777;
}

.search-input:focus,
.date-input:focus,
.limit-select:focus {
  border-color: #555;
}

.files-table {
  width: 100%;
  border-collapse: collapse;
}

.files-table thead th {
  position: sticky;
  top: 0;
  background-color: #1f1f1f;
  color: #cfcfcf;
  font-size: 13px;
  font-weight: 500;
  padding: 10px 12px;
  border-bottom: 1px solid #333;
  text-align: left;
}

.files-table td {
  padding: 10px 12px;
  font-size: 13px;
  border-bottom: 1px solid #1f1f1f;
  color: #e0e0e0;
  text-align: left;
}

.files-table tbody tr:hover {
  background-color: #1a1a1a;
}

.sr {
  width: 60px;
  color: #9e9e9e;
}

.date-col {
  width: 180px;
  white-space: nowrap;
}

.actions-col {
  width: 160px;
  white-space: nowrap;
  text-align: right;
}

.right {
  text-align: right;
}

.date {
  color: #b0b0b0;
  font-size: 12px;
}

.file-link {
  color: #ffffff;
  text-decoration: none;
}

.file-link:hover {
  color: #ccc4c2;
  text-decoration: underline;
}

.empty {
  padding: 20px;
  text-align: center !important;
  color: #777;
}

.create-btn {
  padding: 10px 12px;
  font-size: 13px;
  border: none;
  border-radius: 8px;
  background-color: #1f1f1f;
  color: #ffffff;
  cursor: pointer;
  transition: background 0.2s;
}

.copy-btn,
.delete-btn {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid #2a2a2a;
  background-color: #1f1f1f;
  color: #e0e0e0;
  cursor: pointer;
  transition: background 0.2s, border 0.2s;
  margin-left: 8px;
}

.copy-btn:hover {
  background-color: #2a2a2a;
  border-color: #444;
}

.delete-btn:hover {
  background-color: #4f2b2b;
  border-color: #ff5252;
  color: #ffcici;
}


.copy-btn:active,
.delete-btn:active {
  transform: scale(0.97);
}

.copy-popup {
  position: fixed;
  top: 10%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #1f1f1f;
  color: #e0e0e0;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 14px;
  border: 1px solid #2a2a2a;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.45);
  z-index: 9999;
  animation: popupFade 1.5s ease;
}


@keyframes popupFade {
  0% {
    opacity: 0;
    transform: translate(-50%, -60%);
  }
  15% {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
  85% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -40%);
  }
}
</style>

