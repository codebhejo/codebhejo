<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useFilesStore } from "../stores/files.js";
import Navbar from "../components/Navbar.vue";
import Footer from "../components/Footer.vue";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import DatePicker from "../components/DatePicker.vue";
import { createFile } from "../main.js";
import { Link, Trash2, FileCode } from "lucide-vue-next";

const filesStore = useFilesStore();
const API = import.meta.env.VITE_API_URL;


const search = ref("");
const filterDate = ref("");
const showDeleteConfirm = ref(false);
const fileToDelete = ref(null);
const isDeleting = ref(false);

const PAGE_SIZE = 10;
const currentPage = ref(1);

onMounted(() => {
  filesStore.fetchFiles();
});

// Reset to page 1 whenever filters change
watch([search, filterDate], () => { currentPage.value = 1; });

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
    files = files.filter(file => file.name.toLowerCase().includes(q));
  }

  if (filterDate.value) {
    const start = new Date(filterDate.value).setHours(0, 0, 0, 0);
    const end = new Date(filterDate.value).setHours(23, 59, 59, 999);
    files = files.filter(file => {
      const updated = new Date(file.updated_at).getTime();
      return updated >= start && updated <= end;
    });
  }

  return files;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredFiles.value.length / PAGE_SIZE)));

const pagedFiles = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filteredFiles.value.slice(start, start + PAGE_SIZE);
});

const pageNumbers = computed(() => {
  const total = totalPages.value;
  const cur = currentPage.value;
  const pages = [];
  const delta = 2;
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= cur - delta && i <= cur + delta)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }
  return pages;
});

function goToPage(p) {
  if (typeof p === 'number') currentPage.value = p;
}

const rangeLabel = computed(() => {
  const total = filteredFiles.value.length;
  if (!total) return "0 files";
  const from = (currentPage.value - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage.value * PAGE_SIZE, total);
  return total <= PAGE_SIZE ? `${total} file${total !== 1 ? 's' : ''}` : `${from}–${to} of ${total}`;
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

    <div class="list-card">
      <div class="header">
        <div class="controls">
          <input
            v-model="search"
            type="text"
            class="search-input"
            placeholder="Search files..."
          />
          <DatePicker v-model="filterDate" />
          <span class="file-count">{{ rangeLabel }}</span>
        </div>

        <button class="create-btn" @click="createFile">
          + New File
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
            v-for="(file, index) in pagedFiles"
            :key="file.file_id"
          >
            <td class="sr">{{ (currentPage - 1) * PAGE_SIZE + index + 1 }}</td>

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
              <button class="icon-btn copy-btn" @click="copyFileLink(file.file_id)" title="Copy file link">
                <Link size="14" />
              </button>
              <button class="icon-btn delete-btn" @click="deleteFile(file.file_id)" title="Delete file">
                <Trash2 size="14" />
              </button>
            </td>
          </tr>

          <tr v-if="!pagedFiles.length">
            <td colspan="5" class="empty">
              <FileCode size="32" class="empty-icon" />
              <div>{{ search || filterDate ? 'No files match your filters' : 'No files yet' }}</div>
              <button v-if="!search && !filterDate" class="empty-create-btn" @click="createFile">Create your first file</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="totalPages > 1" class="pagination">
        <button class="pg-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">‹</button>
        <template v-for="p in pageNumbers" :key="p">
          <span v-if="p === '…'" class="pg-ellipsis">…</span>
          <button v-else class="pg-btn" :class="{ active: p === currentPage }" @click="goToPage(p)">{{ p }}</button>
        </template>
        <button class="pg-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">›</button>
        <span class="pg-range">{{ rangeLabel }}</span>
      </div>
    </div>

    <div class="spacer"></div>
    <Footer />
  </div>
</template>

<style scoped>
.files-root {
  min-height: calc(100vh - 56px);
  padding: 16px;
  background-color: #121212;
  color: #e0e0e0;
  font-family: 'Fira Code', monospace;
  display: flex;
  flex-direction: column;
}

.spacer {
  flex: 1;
}

.list-card {
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  overflow: hidden;
  background-color: #161616;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #2a2a2a;
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

.search-input {
  width: 200px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #2a2a2a;
  background-color: #1f1f1f;
  color: #e0e0e0;
  font-size: 13px;
  outline: none;
}

.search-input::placeholder {
  color: #777;
}

.search-input:focus {
  border-color: #555;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  border-top: 1px solid #2a2a2a;
}

.pg-btn {
  min-width: 30px;
  height: 30px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid #2a2a2a;
  background: #1f1f1f;
  color: #e0e0e0;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.pg-btn:hover:not(:disabled) {
  background: #2a2a2a;
  border-color: #555;
}

.pg-btn:disabled {
  color: #444;
  cursor: default;
}

.pg-btn.active {
  background: #3a6ea5;
  border-color: #3a6ea5;
  color: #fff;
  font-weight: 600;
}

.pg-ellipsis {
  color: #555;
  padding: 0 4px;
  font-size: 13px;
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
  font-size: 12px;
  font-weight: 500;
  padding: 7px 12px;
  border-bottom: 1px solid #333;
  text-align: left;
}

.files-table td {
  padding: 6px 12px;
  font-size: 12px;
  border-bottom: 1px solid #1f1f1f;
  color: #e0e0e0;
  text-align: left;
}

.files-table tbody tr {
  transition: background 0.1s;
}

.files-table tbody tr:hover {
  background-color: #1e1e1e;
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
  width: 80px;
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
  padding: 40px 20px !important;
  text-align: center !important;
  color: #555;
  font-size: 13px;
}

.empty-icon {
  color: #333;
  margin-bottom: 10px;
}

.empty-create-btn {
  margin-top: 12px;
  padding: 6px 14px;
  font-size: 12px;
  font-family: inherit;
  border: 1px solid #333;
  border-radius: 6px;
  background: transparent;
  color: #888;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.empty-create-btn:hover {
  color: #e0e0e0;
  border-color: #555;
}

.file-count {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #555;
  padding-left: 4px;
  white-space: nowrap;
}

.create-btn {
  padding: 6px 14px;
  font-size: 13px;
  border: 1px solid #444;
  border-radius: 6px;
  background-color: #2a2a2a;
  color: #ffffff;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  white-space: nowrap;
}

.create-btn:hover {
  background-color: #3a3a3a;
  border-color: #666;
}

.pg-range {
  font-size: 11px;
  color: #444;
  margin-left: 8px;
  white-space: nowrap;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #2a2a2a;
  background-color: transparent;
  color: #888;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  margin-left: 6px;
}

.copy-btn:hover {
  background-color: #1f2a1f;
  border-color: #3a7a3a;
  color: #6dbf6d;
}

.delete-btn:hover {
  background-color: #2a1a1a;
  border-color: #7a3a3a;
  color: #e06060;
}

.icon-btn:active {
  transform: scale(0.93);
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

