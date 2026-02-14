<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  locale: {
    type: String,
    default: 'en-US',
  },
  placeholder: {
    type: String,
    default: '',
  },
  clearLabel: {
    type: String,
    default: 'Clear',
  },
  doneLabel: {
    type: String,
    default: 'Done',
  },
})

const emit = defineEmits(['update:modelValue'])

const rootEl = ref(null)
const popoverEl = ref(null)
const open = ref(false)
const popoverStyle = ref({})

const selectedDate = ref(parseDate(props.modelValue))
const selectedHour = ref(selectedDate.value ? selectedDate.value.getHours() : new Date().getHours())
const selectedMinute = ref(
  selectedDate.value ? selectedDate.value.getMinutes() : roundMinute(new Date().getMinutes())
)
const viewMonth = ref(startOfMonth(selectedDate.value || new Date()))

watch(open, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    updatePopoverPosition()
    window.addEventListener('resize', updatePopoverPosition)
    window.addEventListener('scroll', updatePopoverPosition, true)
    return
  }

  window.removeEventListener('resize', updatePopoverPosition)
  window.removeEventListener('scroll', updatePopoverPosition, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePopoverPosition)
  window.removeEventListener('scroll', updatePopoverPosition, true)
})

watch(
  () => props.modelValue,
  (nextValue) => {
    const parsed = parseDate(nextValue)
    selectedDate.value = parsed
    if (parsed) {
      selectedHour.value = parsed.getHours()
      selectedMinute.value = parsed.getMinutes()
      viewMonth.value = startOfMonth(parsed)
    }
  }
)

const hourOptions = Array.from({ length: 24 }, (_, hour) => String(hour))
const minuteOptions = Array.from({ length: 12 }, (_, index) => String(index * 5))

const displayValue = computed(() => {
  const parsed = parseDate(props.modelValue)
  if (!parsed) return ''
  return new Intl.DateTimeFormat(props.locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
})

const monthLabel = computed(() =>
  new Intl.DateTimeFormat(props.locale, { year: 'numeric', month: 'long' }).format(viewMonth.value)
)

const weekdayLabels = computed(() => {
  const baseSunday = new Date(2024, 0, 7)
  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(props.locale, { weekday: 'short' }).format(addDays(baseSunday, index))
  )
})

const calendarCells = computed(() => {
  const monthStart = startOfMonth(viewMonth.value)
  const gridStart = addDays(monthStart, -monthStart.getDay())
  const selectedKey = toDateKey(selectedDate.value)
  const todayKey = toDateKey(new Date())

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index)
    const key = toDateKey(date)
    return {
      key,
      date,
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === monthStart.getMonth(),
      isSelected: key === selectedKey,
      isToday: key === todayKey,
    }
  })
})

function parseDate(value) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function startOfMonth(value) {
  return new Date(value.getFullYear(), value.getMonth(), 1)
}

function addDays(value, amount) {
  const date = new Date(value)
  date.setDate(date.getDate() + amount)
  return date
}

function toDateKey(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function roundMinute(value) {
  return Math.min(55, Math.max(0, Math.floor(value / 5) * 5))
}

function moveMonth(offset) {
  const next = new Date(viewMonth.value)
  next.setMonth(next.getMonth() + offset)
  viewMonth.value = startOfMonth(next)
}

function toggleOpen() {
  open.value = !open.value
}

function updatePopoverPosition() {
  const anchor = rootEl.value
  if (!anchor) return

  const rect = anchor.getBoundingClientRect()
  const viewportPadding = 12
  const width = Math.min(360, Math.max(260, window.innerWidth - viewportPadding * 2))
  const popoverHeight = popoverEl.value?.offsetHeight || 420
  const preferredTop = rect.bottom + 8
  const fallbackTop = rect.top - popoverHeight - 8

  let left = rect.left
  if (left + width > window.innerWidth - viewportPadding) {
    left = window.innerWidth - width - viewportPadding
  }
  if (left < viewportPadding) {
    left = viewportPadding
  }

  let top = preferredTop
  if (preferredTop + popoverHeight > window.innerHeight - viewportPadding && fallbackTop >= viewportPadding) {
    top = fallbackTop
  } else if (preferredTop + popoverHeight > window.innerHeight - viewportPadding) {
    top = Math.max(viewportPadding, window.innerHeight - popoverHeight - viewportPadding)
  }

  popoverStyle.value = {
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
    width: `${Math.round(width)}px`,
  }
}

function selectDay(date) {
  selectedDate.value = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  emitMergedValue()
}

function onHourChange(nextHour) {
  selectedHour.value = Number(nextHour)
  if (!selectedDate.value) selectedDate.value = new Date()
  emitMergedValue()
}

function onMinuteChange(nextMinute) {
  selectedMinute.value = Number(nextMinute)
  if (!selectedDate.value) selectedDate.value = new Date()
  emitMergedValue()
}

function emitMergedValue() {
  if (!selectedDate.value) {
    emit('update:modelValue', '')
    return
  }

  const merged = new Date(
    selectedDate.value.getFullYear(),
    selectedDate.value.getMonth(),
    selectedDate.value.getDate(),
    selectedHour.value,
    selectedMinute.value,
    0,
    0
  )
  emit('update:modelValue', merged.toISOString())
}

function clearValue() {
  selectedDate.value = null
  emit('update:modelValue', '')
}
</script>

<template>
  <div ref="rootEl">
    <Button type="button" variant="outline" class="w-full justify-start text-left font-normal" @click="toggleOpen">
      <CalendarDays class="mr-2 h-4 w-4" />
      <span v-if="displayValue">{{ displayValue }}</span>
      <span v-else class="text-muted-foreground">{{ placeholder }}</span>
    </Button>
  </div>

  <Teleport to="body">
    <div v-if="open" ref="popoverEl" class="picker-popover" :style="popoverStyle">
      <div class="picker-month-nav">
        <Button type="button" variant="ghost" size="sm" @click="moveMonth(-1)">
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <p>{{ monthLabel }}</p>
        <Button type="button" variant="ghost" size="sm" @click="moveMonth(1)">
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>

      <ul class="picker-weekdays">
        <li v-for="label in weekdayLabels" :key="label">{{ label }}</li>
      </ul>

      <ul class="picker-days">
        <li v-for="cell in calendarCells" :key="cell.key">
          <button
            type="button"
            class="picker-day-btn"
            :class="{
              'picker-day-btn--muted': !cell.isCurrentMonth,
              'picker-day-btn--today': cell.isToday,
              'picker-day-btn--selected': cell.isSelected,
            }"
            @click="selectDay(cell.date)"
          >
            {{ cell.day }}
          </button>
        </li>
      </ul>

      <div class="picker-time-row">
        <Select :model-value="String(selectedHour)" @update:model-value="onHourChange">
          <SelectTrigger class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="hour in hourOptions" :key="hour" :value="hour">
              {{ hour.padStart(2, '0') }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select :model-value="String(selectedMinute)" @update:model-value="onMinuteChange">
          <SelectTrigger class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="minute in minuteOptions" :key="minute" :value="minute">
              {{ minute.padStart(2, '0') }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="picker-actions">
        <Button type="button" variant="ghost" size="sm" @click="clearValue">{{ clearLabel }}</Button>
        <Button type="button" size="sm" @click="open = false">{{ doneLabel }}</Button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.picker-popover {
  position: fixed;
  z-index: 120;
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  background: hsl(var(--card));
  color: hsl(var(--card-foreground));
  padding: 10px;
  box-shadow: 0 20px 40px rgba(2, 6, 23, 0.18);
}

.picker-month-nav {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 4px;
}

.picker-month-nav p {
  margin: 0;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
}

.picker-weekdays {
  margin: 4px 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  font-size: 0.74rem;
  color: hsl(var(--muted-foreground));
}

.picker-weekdays li {
  text-align: center;
  padding: 4px 0;
}

.picker-days {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 2px;
}

.picker-day-btn {
  width: 100%;
  border: 0;
  background: transparent;
  border-radius: 8px;
  padding: 6px 0;
  font-size: 0.82rem;
  color: hsl(var(--foreground));
  cursor: pointer;
}

.picker-day-btn:hover {
  background: hsl(var(--accent));
}

.picker-day-btn--muted {
  opacity: 0.45;
}

.picker-day-btn--today {
  box-shadow: 0 0 0 1px hsl(var(--ring) / 0.5) inset;
}

.picker-day-btn--selected {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.picker-time-row {
  margin-top: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.picker-actions {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
}
</style>
