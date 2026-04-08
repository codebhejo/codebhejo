<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-vue-next";

const props = defineProps({
  modelValue: { type: String, default: "" }, // "YYYY-MM-DD" or ""
});
const emit = defineEmits(["update:modelValue"]);

const open = ref(false);
const pickerRef = ref(null);

const today = new Date();
const viewYear = ref(today.getFullYear());
const viewMonth = ref(today.getMonth()); // 0-based

// Keep view in sync when value is set externally
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      const d = new Date(val + "T00:00:00");
      viewYear.value = d.getFullYear();
      viewMonth.value = d.getMonth();
    }
  }
);

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const calendarDays = computed(() => {
  const year = viewYear.value;
  const month = viewMonth.value;
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  // leading blanks
  for (let i = 0; i < firstDay; i++) cells.push(null);
  // actual days
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
});

function toISO(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function selectDay(day) {
  if (!day) return;
  const iso = toISO(viewYear.value, viewMonth.value, day);
  emit("update:modelValue", iso);
  open.value = false;
}

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value--; }
  else viewMonth.value--;
}

function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++; }
  else viewMonth.value++;
}

function clearDate(e) {
  e.stopPropagation();
  emit("update:modelValue", "");
}

function toggleOpen() {
  open.value = !open.value;
}

function isSelected(day) {
  if (!day || !props.modelValue) return false;
  return props.modelValue === toISO(viewYear.value, viewMonth.value, day);
}

function isToday(day) {
  if (!day) return false;
  return (
    day === today.getDate() &&
    viewMonth.value === today.getMonth() &&
    viewYear.value === today.getFullYear()
  );
}

// Formatted label shown on the trigger button
const displayLabel = computed(() => {
  if (!props.modelValue) return null;
  const [y, m, d] = props.modelValue.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
});

// Close on outside click
function onOutsideClick(e) {
  if (pickerRef.value && !pickerRef.value.contains(e.target)) {
    open.value = false;
  }
}

onMounted(() => document.addEventListener("mousedown", onOutsideClick));
onUnmounted(() => document.removeEventListener("mousedown", onOutsideClick));
</script>

<template>
  <div class="dp-wrap" ref="pickerRef">
    <!-- Trigger -->
    <div class="dp-trigger-wrap" :class="{ active: modelValue }">
      <button class="dp-trigger" @click="toggleOpen" type="button">
        <CalendarDays size="14" class="dp-icon" />
        <span class="dp-label">{{ displayLabel ?? "Filter by date" }}</span>
      </button>
      <button v-if="modelValue" class="dp-clear-btn" type="button" @click="clearDate" title="Clear date">
        <X size="11" />
      </button>
    </div>

    <!-- Calendar popup -->
    <div v-if="open" class="dp-popup">
      <!-- Header -->
      <div class="dp-header">
        <button class="dp-nav" @click="prevMonth" type="button">
          <ChevronLeft size="14" />
        </button>
        <span class="dp-month-label">{{ MONTHS[viewMonth] }} {{ viewYear }}</span>
        <button class="dp-nav" @click="nextMonth" type="button">
          <ChevronRight size="14" />
        </button>
      </div>

      <!-- Weekday row -->
      <div class="dp-grid">
        <div v-for="d in DAYS" :key="d" class="dp-weekday">{{ d }}</div>

        <!-- Day cells -->
        <button
          v-for="(day, i) in calendarDays"
          :key="i"
          type="button"
          class="dp-day"
          :class="{
            blank: !day,
            selected: isSelected(day),
            today: isToday(day) && !isSelected(day),
          }"
          :disabled="!day"
          @click="selectDay(day)"
        >
          {{ day ?? "" }}
        </button>
      </div>

      <!-- Footer -->
      <div class="dp-footer">
        <button
          v-if="modelValue"
          class="dp-clear-date-btn"
          type="button"
          @click="emit('update:modelValue', ''); open = false"
        >
          Clear
        </button>
        <button
          class="dp-today-btn"
          type="button"
          @click="selectDay(today.getDate()), viewYear = today.getFullYear(), viewMonth = today.getMonth()"
        >
          Today
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dp-wrap {
  position: relative;
  display: inline-block;
}

/* Trigger */
.dp-trigger-wrap {
  display: flex;
  align-items: center;
  border-radius: 6px;
  border: 1px solid #2a2a2a;
  background-color: #1f1f1f;
  height: 33px;
  transition: border-color 0.2s;
  overflow: hidden;
}

.dp-trigger-wrap:hover,
.dp-trigger-wrap.active {
  border-color: #555;
}

.dp-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: none;
  border: none;
  color: #777;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  height: 100%;
  transition: color 0.2s;
}

.dp-trigger-wrap:hover .dp-trigger,
.dp-trigger-wrap.active .dp-trigger {
  color: #e0e0e0;
}

.dp-trigger-wrap.active .dp-icon {
  color: #aaa;
}

.dp-icon {
  color: #666;
  flex-shrink: 0;
}

.dp-label {
  flex: 1;
}

.dp-clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-left: 1px solid #2a2a2a;
  color: #555;
  cursor: pointer;
  padding: 0 8px;
  height: 100%;
  transition: color 0.15s, background 0.15s;
}

.dp-clear-btn:hover {
  color: #e0e0e0;
  background: #2a2a2a;
}

/* Popup */
.dp-popup {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 999;
  background: #1a1a1a;
  border: 1px solid #2e2e2e;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55);
  width: 224px;
  user-select: none;
}

/* Header nav */
.dp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.dp-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid #2e2e2e;
  border-radius: 5px;
  color: #aaa;
  cursor: pointer;
  padding: 4px 6px;
  transition: background 0.15s, color 0.15s;
}

.dp-nav:hover {
  background: #2a2a2a;
  color: #fff;
}

.dp-month-label {
  font-size: 13px;
  font-weight: 600;
  color: #e0e0e0;
  letter-spacing: 0.02em;
}

/* Day grid – 7 columns */
.dp-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.dp-weekday {
  text-align: center;
  font-size: 11px;
  color: #555;
  padding: 2px 0 6px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.dp-day {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  border-radius: 5px;
  border: none;
  background: none;
  color: #ccc;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.dp-day:not(.blank):hover {
  background: #2a2a2a;
  color: #fff;
}

.dp-day.blank {
  cursor: default;
  pointer-events: none;
}

.dp-day.today {
  color: #7db8f7;
  font-weight: 700;
}

.dp-day.selected {
  background: #3a6ea5;
  color: #fff;
  font-weight: 600;
}

/* Footer */
.dp-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #252525;
}

.dp-clear-date-btn {
  background: none;
  border: 1px solid #333;
  border-radius: 5px;
  color: #888;
  font-size: 12px;
  font-family: inherit;
  padding: 3px 10px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.dp-clear-date-btn:hover {
  background: #2a1a1a;
  border-color: #663333;
  color: #e0e0e0;
}

.dp-today-btn {
  background: none;
  border: 1px solid #333;
  border-radius: 5px;
  color: #7db8f7;
  font-size: 12px;
  font-family: inherit;
  padding: 3px 10px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.dp-today-btn:hover {
  background: #1e2d40;
  border-color: #3a6ea5;
}
</style>
