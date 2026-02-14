<script setup>
import { computed, onMounted, ref } from 'vue'
import draggable from 'vuedraggable'
import { Moon, Settings, Sun } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DateTimePicker from '@/components/DateTimePicker.vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const LANGUAGE_KEY = 'todo-language'
const THEME_KEY = 'todo-theme'
const locale = ref('ko')
const theme = ref('light')
const viewMode = ref('list')
const calendarMonthAnchor = ref(startOfMonth(new Date()))
const newTask = ref('')
const newDueAt = ref('')
const newLocation = ref('')
const newLabelText = ref('')
const newLabelColor = ref('#64748b')
const newRolloverEnabled = ref(false)
const filter = ref('all')
const todos = ref([])
const commentDrafts = ref({})
const addTodoOpen = ref(false)
const settingsOpen = ref(false)
const detailTodoId = ref(null)
const detailEditMode = ref(false)
const detailDueAtDraft = ref('')
const detailLocationDraft = ref('')
const detailLabelTextDraft = ref('')
const detailLabelColorDraft = ref('#64748b')
const detailRolloverDraft = ref(false)
const editingCommentId = ref(null)
const commentEditDraft = ref('')
const loading = ref(false)
const busy = ref(false)
const errorMessage = ref('')
const user = ref(null)
const authMode = ref('login')
const authEmail = ref('')
const authUsername = ref('')
const authPassword = ref('')
const authBusy = ref(false)

const messages = {
  ko: {
    appTitle: 'Todogram',
    language: '언어',
    settings: '설정',
    settingsTitle: '앱 설정',
    addSchedule: '일정 추가',
    addScheduleTitle: '새 일정 추가',
    guest: '비로그인',
    login: '로그인',
    signup: '회원가입',
    logout: '로그아웃',
    createAccount: '계정 만들기',
    emailPlaceholder: '이메일 주소',
    usernamePlaceholder: '사용자 이름 (2~24자)',
    passwordPlaceholder: '비밀번호 (최소 8자)',
    theme: '테마',
    lightMode: '라이트',
    darkMode: '다크',
    authSigninHelp: '로그인해서 계속 진행하세요',
    authSignupHelp: '새 계정을 만들어 시작하세요',
    listView: '리스트',
    calendarView: '캘린더',
    addTask: '추가',
    taskPlaceholder: '할 일을 입력하세요',
    dueAt: '마감일시',
    dueAtPlaceholder: '마감일시 선택',
    pickerClear: '지우기',
    pickerDone: '확인',
    label: '라벨',
    labelPlaceholder: '라벨 텍스트',
    labelColor: '라벨 색상',
    location: '장소',
    locationPlaceholder: '장소를 입력하세요',
    rolloverOption: '미완료 시 다음날로 자동 이월',
    rolloverHint: '마감일이 지나도 완료하지 않으면 자동으로 다음날 같은 시각으로 이동합니다.',
    all: '전체',
    active: '진행중',
    done: '완료',
    clearDone: '완료 삭제',
    dragHint: '전체/진행중/완료 탭 모두에서 드래그 정렬이 가능합니다. 모바일에서는 핸들을 길게 눌러 이동하세요.',
    loading: '불러오는 중...',
    detail: '상세보기',
    edit: '수정',
    save: '저장',
    cancel: '취소',
    editTodoMeta: '일정 정보 수정',
    delete: '삭제',
    created: '생성',
    noItems: '표시할 항목이 없습니다.',
    remaining: '남은 작업 {count}',
    doneCount: '완료 {count}',
    close: '닫기',
    commentPlaceholder: '댓글 작성',
    commentEditPlaceholder: '댓글 수정',
    comment: '댓글',
    remove: '삭제',
    noComments: '댓글이 없습니다.',
    calendarToday: '오늘',
    calendarNoItems: '해당 날짜 일정이 없습니다.',
    calendarNoDue: '마감일 미설정 항목 {count}개',
    due: '마감',
    place: '장소',
    rolloverEnabled: '자동 이월 사용',
  },
  en: {
    appTitle: 'Todogram',
    language: 'Language',
    settings: 'Settings',
    settingsTitle: 'App settings',
    addSchedule: 'Add schedule',
    addScheduleTitle: 'Add new schedule',
    guest: 'Guest',
    login: 'Login',
    signup: 'Sign up',
    logout: 'Logout',
    createAccount: 'Create account',
    emailPlaceholder: 'Email address',
    usernamePlaceholder: 'Username (2-24 chars)',
    passwordPlaceholder: 'Password (min 8 chars)',
    theme: 'Theme',
    lightMode: 'Light',
    darkMode: 'Dark',
    authSigninHelp: 'Sign in to continue',
    authSignupHelp: 'Create your account to get started',
    listView: 'List',
    calendarView: 'Calendar',
    addTask: 'Add',
    taskPlaceholder: 'Add a task',
    dueAt: 'Due date/time',
    dueAtPlaceholder: 'Choose due date/time',
    pickerClear: 'Clear',
    pickerDone: 'Done',
    label: 'Label',
    labelPlaceholder: 'Label text',
    labelColor: 'Label color',
    location: 'Location',
    locationPlaceholder: 'Add location',
    rolloverOption: 'Auto-move deadline to next day if unfinished',
    rolloverHint: 'If not completed by due date, it will automatically move to the same time next day.',
    all: 'All',
    active: 'Active',
    done: 'Done',
    clearDone: 'Clear done',
    dragHint: 'Drag reorder is available in All, Active, and Done tabs. On mobile, long-press the handle to move.',
    loading: 'Loading...',
    detail: 'Detail',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    editTodoMeta: 'Edit schedule details',
    delete: 'Delete',
    created: 'Created',
    noItems: 'No items to display.',
    remaining: 'Remaining {count}',
    doneCount: 'Done {count}',
    close: 'Close',
    commentPlaceholder: 'Add comment',
    commentEditPlaceholder: 'Edit comment',
    comment: 'Comment',
    remove: 'Remove',
    noComments: 'No comments yet.',
    calendarToday: 'Today',
    calendarNoItems: 'No schedule on this date.',
    calendarNoDue: 'Items without due date: {count}',
    due: 'Due',
    place: 'Location',
    rolloverEnabled: 'Auto rollover enabled',
  },
  zh: {
    appTitle: 'Todogram',
    language: '语言',
    settings: '设置',
    settingsTitle: '应用设置',
    addSchedule: '添加日程',
    addScheduleTitle: '添加新日程',
    guest: '未登录',
    login: '登录',
    signup: '注册',
    logout: '退出登录',
    createAccount: '创建账号',
    emailPlaceholder: '邮箱地址',
    usernamePlaceholder: '用户名（2-24个字符）',
    passwordPlaceholder: '密码（至少 8 位）',
    theme: '主题',
    lightMode: '浅色',
    darkMode: '深色',
    authSigninHelp: '登录后继续使用',
    authSignupHelp: '创建新账号开始使用',
    listView: '列表',
    calendarView: '日历',
    addTask: '添加',
    taskPlaceholder: '输入待办事项',
    dueAt: '截止日期时间',
    dueAtPlaceholder: '选择截止日期时间',
    pickerClear: '清除',
    pickerDone: '完成',
    label: '标签',
    labelPlaceholder: '标签文本',
    labelColor: '标签颜色',
    location: '地点',
    locationPlaceholder: '输入地点',
    rolloverOption: '未完成时自动顺延到次日',
    rolloverHint: '若截止时间到期仍未完成，会自动顺延到次日同一时间。',
    all: '全部',
    active: '进行中',
    done: '已完成',
    clearDone: '清除已完成',
    dragHint: '全部/进行中/已完成标签都支持拖拽排序。移动端请长按拖拽手柄后移动。',
    loading: '加载中...',
    detail: '详情',
    edit: '编辑',
    save: '保存',
    cancel: '取消',
    editTodoMeta: '修改日程信息',
    delete: '删除',
    created: '创建时间',
    noItems: '没有可显示的项目。',
    remaining: '剩余 {count}',
    doneCount: '已完成 {count}',
    close: '关闭',
    commentPlaceholder: '添加评论',
    commentEditPlaceholder: '编辑评论',
    comment: '评论',
    remove: '移除',
    noComments: '暂无评论。',
    calendarToday: '今天',
    calendarNoItems: '该日期没有日程。',
    calendarNoDue: '未设置截止时间的项目 {count} 个',
    due: '截止',
    place: '地点',
    rolloverEnabled: '已启用自动顺延',
  },
  ja: {
    appTitle: 'Todogram',
    language: '言語',
    settings: '設定',
    settingsTitle: 'アプリ設定',
    addSchedule: '予定追加',
    addScheduleTitle: '新しい予定を追加',
    guest: '未ログイン',
    login: 'ログイン',
    signup: '新規登録',
    logout: 'ログアウト',
    createAccount: 'アカウント作成',
    emailPlaceholder: 'メールアドレス',
    usernamePlaceholder: 'ユーザー名（2〜24文字）',
    passwordPlaceholder: 'パスワード（8文字以上）',
    theme: 'テーマ',
    lightMode: 'ライト',
    darkMode: 'ダーク',
    authSigninHelp: 'ログインして続行',
    authSignupHelp: '新しいアカウントを作成',
    listView: 'リスト',
    calendarView: 'カレンダー',
    addTask: '追加',
    taskPlaceholder: 'タスクを入力',
    dueAt: '締切日時',
    dueAtPlaceholder: '締切日時を選択',
    pickerClear: 'クリア',
    pickerDone: '完了',
    label: 'ラベル',
    labelPlaceholder: 'ラベルテキスト',
    labelColor: 'ラベル色',
    location: '場所',
    locationPlaceholder: '場所を入力',
    rolloverOption: '未完了なら締切を翌日に自動繰り越し',
    rolloverHint: '締切までに完了しない場合、翌日の同時刻へ自動移動します。',
    all: 'すべて',
    active: '進行中',
    done: '完了',
    clearDone: '完了を削除',
    dragHint: 'すべて/進行中/完了タブでドラッグ並び替えが可能です。モバイルではハンドルを長押しして移動してください。',
    loading: '読み込み中...',
    detail: '詳細',
    edit: '編集',
    save: '保存',
    cancel: 'キャンセル',
    editTodoMeta: '予定情報を編集',
    delete: '削除',
    created: '作成日時',
    noItems: '表示する項目がありません。',
    remaining: '残り {count}',
    doneCount: '完了 {count}',
    close: '閉じる',
    commentPlaceholder: 'コメントを追加',
    commentEditPlaceholder: 'コメントを編集',
    comment: 'コメント',
    remove: '削除',
    noComments: 'コメントはありません。',
    calendarToday: '今日',
    calendarNoItems: 'この日付の予定はありません。',
    calendarNoDue: '締切未設定の項目 {count} 件',
    due: '締切',
    place: '場所',
    rolloverEnabled: '自動繰り越し有効',
  },
}

const errorMessages = {
  Unauthorized: { ko: '로그인이 필요합니다.', en: 'Login required.', zh: '需要登录。', ja: 'ログインが必要です。' },
  'email and password are required': {
    ko: '이메일과 비밀번호를 입력하세요.',
    en: 'Email and password are required.',
    zh: '请输入邮箱和密码。',
    ja: 'メールアドレスとパスワードを入力してください。',
  },
  'password must be at least 8 characters': {
    ko: '비밀번호는 최소 8자 이상이어야 합니다.',
    en: 'Password must be at least 8 characters.',
    zh: '密码至少需要 8 位。',
    ja: 'パスワードは8文字以上必要です。',
  },
  'email already registered': {
    ko: '이미 가입된 이메일입니다.',
    en: 'Email is already registered.',
    zh: '该邮箱已注册。',
    ja: 'このメールアドレスは既に登録されています。',
  },
  'username is required': {
    ko: '사용자 이름을 입력하세요.',
    en: 'Username is required.',
    zh: '请输入用户名。',
    ja: 'ユーザー名を入力してください。',
  },
  'username must be between 2 and 24 characters': {
    ko: '사용자 이름은 2자 이상 24자 이하여야 합니다.',
    en: 'Username must be between 2 and 24 characters.',
    zh: '用户名长度必须在 2 到 24 个字符之间。',
    ja: 'ユーザー名は2文字以上24文字以下で入力してください。',
  },
  'invalid credentials': {
    ko: '이메일 또는 비밀번호가 올바르지 않습니다.',
    en: 'Invalid credentials.',
    zh: '邮箱或密码不正确。',
    ja: 'メールアドレスまたはパスワードが正しくありません。',
  },
  'text is required': {
    ko: '내용을 입력하세요.',
    en: 'Text is required.',
    zh: '请输入内容。',
    ja: '内容を入力してください。',
  },
  'dueAt must be a valid datetime': {
    ko: '올바른 마감일시를 입력하세요.',
    en: 'Please provide a valid due date/time.',
    zh: '请输入有效的截止日期时间。',
    ja: '有効な締切日時を入力してください。',
  },
  'labelColor must be a valid hex color': {
    ko: '라벨 색상은 16진수 색상(#RRGGBB) 형식이어야 합니다.',
    en: 'Label color must be a valid hex color (#RRGGBB).',
    zh: '标签颜色必须是有效的十六进制颜色（#RRGGBB）。',
    ja: 'ラベル色は有効な16進カラー（#RRGGBB）で入力してください。',
  },
  'id is required': {
    ko: 'ID 값이 필요합니다.',
    en: 'ID is required.',
    zh: '需要 ID。',
    ja: 'ID が必要です。',
  },
  'text must not be empty': {
    ko: '빈 내용은 저장할 수 없습니다.',
    en: 'Text must not be empty.',
    zh: '内容不能为空。',
    ja: '空の内容は保存できません。',
  },
  'no valid fields to update': {
    ko: '수정할 항목이 없습니다.',
    en: 'No valid fields to update.',
    zh: '没有可更新的字段。',
    ja: '更新できる項目がありません。',
  },
  'todo not found': {
    ko: '할 일을 찾을 수 없습니다.',
    en: 'Todo not found.',
    zh: '未找到待办事项。',
    ja: 'TODOが見つかりません。',
  },
  'comment not found': {
    ko: '댓글을 찾을 수 없습니다.',
    en: 'Comment not found.',
    zh: '未找到评论。',
    ja: 'コメントが見つかりません。',
  },
}

const localeCodeByLanguage = {
  ko: 'ko-KR',
  en: 'en-US',
  zh: 'zh-CN',
  ja: 'ja-JP',
}

const languageOptions = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
]

const isAuthenticated = computed(() => Boolean(user.value))
const isDark = computed(() => theme.value === 'dark')
const filteredTodos = computed(() => {
  if (filter.value === 'active') return todos.value.filter((todo) => !todo.done)
  if (filter.value === 'done') return todos.value.filter((todo) => todo.done)
  return todos.value
})
const draggableTodos = computed({
  get() {
    return filteredTodos.value
  },
  set(reorderedSubset) {
    if (filter.value === 'all') {
      todos.value = [...reorderedSubset]
      return
    }

    const shouldInclude = filter.value === 'active' ? (todo) => !todo.done : (todo) => todo.done
    const byId = new Map(todos.value.map((todo) => [todo.id, todo]))
    const reorderedIds = reorderedSubset.map((todo) => todo.id)
    let cursor = 0

    todos.value = todos.value.map((todo) => {
      if (!shouldInclude(todo)) return todo
      const nextId = reorderedIds[cursor]
      cursor += 1
      return byId.get(nextId) || todo
    })
  },
})
const remainingCount = computed(() => todos.value.filter((todo) => !todo.done).length)
const doneCount = computed(() => todos.value.filter((todo) => todo.done).length)
const detailTodo = computed(() => todos.value.find((todo) => todo.id === detailTodoId.value) || null)
const todosWithoutDueCount = computed(() => todos.value.filter((todo) => !todo.dueAt).length)
const calendarMonthLabel = computed(() => {
  const dateLocale = localeCodeByLanguage[locale.value] || 'en-US'
  return new Intl.DateTimeFormat(dateLocale, { year: 'numeric', month: 'long' }).format(calendarMonthAnchor.value)
})
const calendarWeekdayLabels = computed(() => {
  const dateLocale = localeCodeByLanguage[locale.value] || 'en-US'
  const base = new Date(2024, 0, 7) // 2024-01-07은 일요일.
  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(dateLocale, { weekday: 'short' }).format(addDays(base, index))
  )
})
const todosByDate = computed(() => {
  const grouped = new Map()
  for (const todo of todos.value) {
    if (!todo.dueAt) continue
    const key = toDateKey(todo.dueAt)
    if (!key) continue
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(todo)
  }
  for (const [, items] of grouped) {
    items.sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
  }
  return grouped
})
const calendarCells = computed(() => {
  const monthStart = startOfMonth(calendarMonthAnchor.value)
  const gridStart = addDays(monthStart, -monthStart.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index)
    const key = toDateKey(date)
    return {
      key,
      date,
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === monthStart.getMonth(),
      isToday: key === toDateKey(new Date()),
      items: todosByDate.value.get(key) || [],
    }
  })
})
const currentUserLabel = computed(() => user.value?.username || user.value?.email || t('guest'))

function startOfMonth(value) {
  const date = new Date(value)
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addDays(value, amount) {
  const date = new Date(value)
  date.setDate(date.getDate() + amount)
  return date
}

function toDateKey(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isValidLabelColor(value) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value.trim())
}

function normalizeLabelColor(value, fallback = '#64748b') {
  if (!isValidLabelColor(value)) return fallback
  return value.trim().toLowerCase()
}

function hexToRgba(hex, alpha) {
  const safe = normalizeLabelColor(hex)
  const r = parseInt(safe.slice(1, 3), 16)
  const g = parseInt(safe.slice(3, 5), 16)
  const b = parseInt(safe.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getLabelBadgeStyle(todo) {
  const color = normalizeLabelColor(todo.labelColor)
  return {
    borderColor: color,
    color,
    backgroundColor: hexToRgba(color, 0.14),
  }
}

function getCalendarItemStyle(todo) {
  const color = normalizeLabelColor(todo.labelColor)
  return {
    borderLeft: `3px solid ${color}`,
    backgroundColor: hexToRgba(color, 0.1),
  }
}

function getLabelDotStyle(todo) {
  return { backgroundColor: normalizeLabelColor(todo.labelColor) }
}

function moveCalendarMonth(offset) {
  const next = new Date(calendarMonthAnchor.value)
  next.setMonth(next.getMonth() + offset)
  calendarMonthAnchor.value = startOfMonth(next)
}

function goCalendarToday() {
  calendarMonthAnchor.value = startOfMonth(new Date())
}

onMounted(async () => {
  const savedTheme = localStorage.getItem(THEME_KEY)
  if (savedTheme === 'dark' || savedTheme === 'light') {
    setTheme(savedTheme)
  } else {
    setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  }

  const saved = localStorage.getItem(LANGUAGE_KEY)
  if (saved && messages[saved]) {
    locale.value = saved
  } else {
    const browser = (navigator.language || '').slice(0, 2).toLowerCase()
    if (messages[browser]) locale.value = browser
  }

  await loadSessionUser()
  if (user.value) await loadTodos()
})

function setTheme(nextTheme) {
  if (nextTheme !== 'light' && nextTheme !== 'dark') return
  theme.value = nextTheme
  document.documentElement.classList.toggle('dark', nextTheme === 'dark')
  localStorage.setItem(THEME_KEY, nextTheme)
}

function t(key, vars = {}) {
  const current = messages[locale.value] || messages.en
  const template = current[key] || messages.en[key] || key
  return template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''))
}

function setLocale(nextLocale) {
  if (!messages[nextLocale]) return
  locale.value = nextLocale
  localStorage.setItem(LANGUAGE_KEY, nextLocale)
}

function translateError(message) {
  const item = errorMessages[message]
  if (!item) return message
  return item[locale.value] || item.en || message
}

async function apiRequest(url, options = {}) {
  const baseHeaders = {}
  if (options.body) baseHeaders['Content-Type'] = 'application/json'

  const response = await fetch(url, {
    ...options,
    headers: {
      ...baseHeaders,
      ...(options.headers || {}),
    },
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) throw new Error(payload?.error || `Request failed (${response.status})`)
  return payload
}

async function loadSessionUser() {
  try {
    const payload = await apiRequest('/api/auth')
    user.value = payload.user
  } catch {
    user.value = null
  }
}

async function submitAuth() {
  if (authBusy.value) return
  authBusy.value = true
  errorMessage.value = ''
  try {
    const payload = await apiRequest('/api/auth', {
      method: 'POST',
      body: JSON.stringify({
        action: authMode.value === 'signup' ? 'signup' : 'login',
        email: authEmail.value.trim(),
        username: authMode.value === 'signup' ? authUsername.value.trim() : undefined,
        password: authPassword.value,
      }),
    })
    user.value = payload.user
    authUsername.value = ''
    authPassword.value = ''
    await loadTodos()
  } catch (error) {
    errorMessage.value = translateError(error.message)
  } finally {
    authBusy.value = false
  }
}

async function logout() {
  if (authBusy.value) return
  authBusy.value = true
  errorMessage.value = ''
  try {
    await apiRequest('/api/auth', { method: 'DELETE' })
    user.value = null
    todos.value = []
    commentDrafts.value = {}
    detailTodoId.value = null
    newTask.value = ''
    newDueAt.value = ''
    newLocation.value = ''
    newLabelText.value = ''
    newLabelColor.value = '#64748b'
    newRolloverEnabled.value = false
    addTodoOpen.value = false
    settingsOpen.value = false
  } catch (error) {
    errorMessage.value = translateError(error.message)
  } finally {
    authBusy.value = false
  }
}

async function loadTodos() {
  if (!isAuthenticated.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    const payload = await apiRequest('/api/todos')
    todos.value = payload.todos || []
    for (const todo of todos.value) {
      if (typeof commentDrafts.value[todo.id] !== 'string') commentDrafts.value[todo.id] = ''
    }
  } catch (error) {
    errorMessage.value = translateError(error.message)
  } finally {
    loading.value = false
  }
}

async function persistOrder() {
  busy.value = true
  errorMessage.value = ''
  const previous = [...todos.value]
  try {
    await apiRequest('/api/todos', {
      method: 'PATCH',
      body: JSON.stringify({ order: todos.value.map((todo) => todo.id) }),
    })
  } catch (error) {
    todos.value = previous
    errorMessage.value = translateError(error.message)
  } finally {
    busy.value = false
  }
}

async function onDragEnd(event) {
  if (!event) return
  if (event.oldIndex === event.newIndex) return
  if (busy.value) return
  await persistOrder()
}

async function addTodo() {
  const text = newTask.value.trim()
  if (!text || busy.value) return
  const labelColor = normalizeLabelColor(newLabelColor.value)
  if (newLabelText.value.trim() && !isValidLabelColor(newLabelColor.value)) {
    errorMessage.value = translateError('labelColor must be a valid hex color')
    return
  }
  let dueAt = null
  if (newDueAt.value) {
    const parsedDueAt = new Date(newDueAt.value)
    if (Number.isNaN(parsedDueAt.getTime())) {
      errorMessage.value = translateError('dueAt must be a valid datetime')
      return
    }
    dueAt = parsedDueAt.toISOString()
  }
  busy.value = true
  errorMessage.value = ''
  try {
    const payload = await apiRequest('/api/todos', {
      method: 'POST',
      body: JSON.stringify({
        text,
        dueAt,
        location: newLocation.value.trim(),
        labelText: newLabelText.value.trim(),
        labelColor,
        rolloverEnabled: newRolloverEnabled.value,
      }),
    })
    todos.value.unshift(payload.todo)
    commentDrafts.value[payload.todo.id] = ''
    newTask.value = ''
    newDueAt.value = ''
    newLocation.value = ''
    newLabelText.value = ''
    newLabelColor.value = '#64748b'
    newRolloverEnabled.value = false
    addTodoOpen.value = false
  } catch (error) {
    errorMessage.value = translateError(error.message)
  } finally {
    busy.value = false
  }
}

async function setTodoDone(todo, done) {
  const previous = todo.done
  todo.done = done
  errorMessage.value = ''
  try {
    await apiRequest('/api/todos', {
      method: 'PATCH',
      body: JSON.stringify({ id: todo.id, done }),
    })
  } catch (error) {
    todo.done = previous
    errorMessage.value = translateError(error.message)
  }
}

async function deleteTodo(id) {
  if (busy.value) return
  busy.value = true
  errorMessage.value = ''
  const previous = [...todos.value]
  todos.value = todos.value.filter((todo) => todo.id !== id)
  delete commentDrafts.value[id]
  if (detailTodoId.value === id) detailTodoId.value = null
  try {
    await apiRequest(`/api/todos?id=${id}`, { method: 'DELETE' })
  } catch (error) {
    todos.value = previous
    errorMessage.value = translateError(error.message)
  } finally {
    busy.value = false
  }
}

async function clearDone() {
  if (busy.value) return
  busy.value = true
  errorMessage.value = ''
  const previous = [...todos.value]
  todos.value = todos.value.filter((todo) => !todo.done)
  if (detailTodo.value?.done) detailTodoId.value = null
  try {
    await apiRequest('/api/todos?done=true', { method: 'DELETE' })
  } catch (error) {
    todos.value = previous
    errorMessage.value = translateError(error.message)
  } finally {
    busy.value = false
  }
}

async function addComment(todoId) {
  if (busy.value) return
  const draft = (commentDrafts.value[todoId] || '').trim()
  if (!draft) return
  busy.value = true
  errorMessage.value = ''
  try {
    const payload = await apiRequest('/api/comments', {
      method: 'POST',
      body: JSON.stringify({ todoId, text: draft }),
    })
    const target = todos.value.find((todo) => todo.id === todoId)
    if (target) target.comments.unshift(payload.comment)
    commentDrafts.value[todoId] = ''
  } catch (error) {
    errorMessage.value = translateError(error.message)
  } finally {
    busy.value = false
  }
}

async function deleteComment(todoId, commentId) {
  if (busy.value) return
  busy.value = true
  errorMessage.value = ''
  const target = todos.value.find((todo) => todo.id === todoId)
  const originalComments = target ? [...target.comments] : []
  if (target) target.comments = target.comments.filter((comment) => comment.id !== commentId)
  try {
    await apiRequest(`/api/comments?id=${commentId}`, { method: 'DELETE' })
    if (editingCommentId.value === commentId) {
      editingCommentId.value = null
      commentEditDraft.value = ''
    }
  } catch (error) {
    if (target) target.comments = originalComments
    errorMessage.value = translateError(error.message)
  } finally {
    busy.value = false
  }
}

function startDetailEdit() {
  const target = detailTodo.value
  if (!target) return
  detailEditMode.value = true
  detailDueAtDraft.value = target.dueAt || ''
  detailLocationDraft.value = target.location || ''
  detailLabelTextDraft.value = target.labelText || ''
  detailLabelColorDraft.value = normalizeLabelColor(target.labelColor)
  detailRolloverDraft.value = Boolean(target.rolloverEnabled)
}

function cancelDetailEdit() {
  detailEditMode.value = false
  const target = detailTodo.value
  detailDueAtDraft.value = target?.dueAt || ''
  detailLocationDraft.value = target?.location || ''
  detailLabelTextDraft.value = target?.labelText || ''
  detailLabelColorDraft.value = normalizeLabelColor(target?.labelColor)
  detailRolloverDraft.value = Boolean(target?.rolloverEnabled)
}

async function saveDetailEdit() {
  const target = detailTodo.value
  if (!target || busy.value) return
  if (detailLabelTextDraft.value.trim() && !isValidLabelColor(detailLabelColorDraft.value)) {
    errorMessage.value = translateError('labelColor must be a valid hex color')
    return
  }
  busy.value = true
  errorMessage.value = ''
  const previous = {
    dueAt: target.dueAt || '',
    location: target.location || '',
    labelText: target.labelText || '',
    labelColor: normalizeLabelColor(target.labelColor),
    rolloverEnabled: Boolean(target.rolloverEnabled),
  }

  target.dueAt = detailDueAtDraft.value || null
  target.location = detailLocationDraft.value.trim()
  target.labelText = detailLabelTextDraft.value.trim()
  target.labelColor = normalizeLabelColor(detailLabelColorDraft.value)
  target.rolloverEnabled = detailRolloverDraft.value

  try {
    await apiRequest('/api/todos', {
      method: 'PATCH',
      body: JSON.stringify({
        id: target.id,
        dueAt: detailDueAtDraft.value || null,
        location: detailLocationDraft.value,
        labelText: detailLabelTextDraft.value.trim(),
        labelColor: normalizeLabelColor(detailLabelColorDraft.value),
        rolloverEnabled: detailRolloverDraft.value,
      }),
    })
    detailEditMode.value = false
  } catch (error) {
    target.dueAt = previous.dueAt || null
    target.location = previous.location
    target.labelText = previous.labelText
    target.labelColor = previous.labelColor
    target.rolloverEnabled = previous.rolloverEnabled
    errorMessage.value = translateError(error.message)
  } finally {
    busy.value = false
  }
}

function startCommentEdit(comment) {
  editingCommentId.value = comment.id
  commentEditDraft.value = comment.text
}

function cancelCommentEdit() {
  editingCommentId.value = null
  commentEditDraft.value = ''
}

async function saveCommentEdit(todoId, commentId) {
  const text = commentEditDraft.value.trim()
  if (!text || busy.value) {
    if (!text) errorMessage.value = translateError('text must not be empty')
    return
  }

  busy.value = true
  errorMessage.value = ''
  const targetTodo = todos.value.find((todo) => todo.id === todoId)
  const targetComment = targetTodo?.comments.find((comment) => comment.id === commentId)
  const previous = targetComment?.text || ''
  if (targetComment) targetComment.text = text

  try {
    const payload = await apiRequest('/api/comments', {
      method: 'PATCH',
      body: JSON.stringify({ id: commentId, text }),
    })
    if (targetComment) targetComment.text = payload.comment.text
    editingCommentId.value = null
    commentEditDraft.value = ''
  } catch (error) {
    if (targetComment) targetComment.text = previous
    errorMessage.value = translateError(error.message)
  } finally {
    busy.value = false
  }
}

function openDetail(todoId) {
  const target = todos.value.find((todo) => todo.id === todoId)
  detailTodoId.value = todoId
  if (typeof commentDrafts.value[todoId] !== 'string') commentDrafts.value[todoId] = ''
  detailEditMode.value = false
  detailDueAtDraft.value = target?.dueAt || ''
  detailLocationDraft.value = target?.location || ''
  detailLabelTextDraft.value = target?.labelText || ''
  detailLabelColorDraft.value = normalizeLabelColor(target?.labelColor)
  detailRolloverDraft.value = Boolean(target?.rolloverEnabled)
  editingCommentId.value = null
  commentEditDraft.value = ''
}

function openSettings() {
  settingsOpen.value = true
}

function closeSettings() {
  settingsOpen.value = false
}

function openAddTodo() {
  if (!isAuthenticated.value) return
  errorMessage.value = ''
  addTodoOpen.value = true
}

function closeAddTodo() {
  addTodoOpen.value = false
}

function closeDetail() {
  detailTodoId.value = null
  detailEditMode.value = false
  editingCommentId.value = null
  commentEditDraft.value = ''
}

function formatDateTime(value) {
  if (!value) return '-'
  const dateLocale = localeCodeByLanguage[locale.value] || 'en-US'
  return new Intl.DateTimeFormat(dateLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatTime(value) {
  if (!value) return ''
  const dateLocale = localeCodeByLanguage[locale.value] || 'en-US'
  return new Intl.DateTimeFormat(dateLocale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
</script>

<template>
  <main class="page">
    <Card class="mx-1 w-full max-w-3xl border-border/80 bg-card/90 shadow-2xl backdrop-blur-xl sm:mx-0">
      <CardHeader class="space-y-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle class="text-2xl tracking-tight sm:text-3xl">{{ t('appTitle') }}</CardTitle>
          <div class="flex w-full flex-wrap items-center justify-end gap-2 text-xs text-muted-foreground sm:w-auto">
            <span class="max-w-[70vw] truncate font-medium sm:max-w-[220px]">{{ currentUserLabel }}</span>

            <div class="grid grid-cols-2 gap-1 rounded-lg border bg-background p-1 sm:inline-flex sm:w-auto sm:gap-0">
              <Button
                size="sm"
                class="w-full"
                :variant="viewMode === 'list' ? 'default' : 'ghost'"
                @click="viewMode = 'list'"
                :disabled="!isAuthenticated"
              >
                {{ t('listView') }}
              </Button>
              <Button
                size="sm"
                class="w-full"
                :variant="viewMode === 'calendar' ? 'default' : 'ghost'"
                @click="viewMode = 'calendar'"
                :disabled="!isAuthenticated"
              >
                {{ t('calendarView') }}
              </Button>
            </div>

            <Button v-if="isAuthenticated" variant="outline" size="sm" @click="openAddTodo">
              {{ t('addSchedule') }}
            </Button>
            <Button variant="outline" size="sm" @click="openSettings">
              <Settings class="mr-1 h-4 w-4" />
              {{ t('settings') }}
            </Button>
            <Button v-if="isAuthenticated" variant="outline" size="sm" @click="logout" :disabled="authBusy">
              {{ t('logout') }}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent class="space-y-4">
        <section v-if="!isAuthenticated" class="mx-auto max-w-md space-y-4 rounded-xl border bg-card p-5">
          <div class="space-y-1 text-center">
            <p class="auth-script">Todogram</p>
            <p class="text-sm text-muted-foreground">
              {{ authMode === 'signup' ? t('authSignupHelp') : t('authSigninHelp') }}
            </p>
          </div>
          <div class="inline-flex w-full rounded-lg border bg-background p-1">
            <Button class="flex-1" :variant="authMode === 'login' ? 'default' : 'ghost'" @click="authMode = 'login'">
              {{ t('login') }}
            </Button>
            <Button class="flex-1" :variant="authMode === 'signup' ? 'default' : 'ghost'" @click="authMode = 'signup'">
              {{ t('signup') }}
            </Button>
          </div>
          <form class="space-y-3" @submit.prevent="submitAuth">
            <Input v-model="authEmail" type="email" :placeholder="t('emailPlaceholder')" autocomplete="email" />
            <Input
              v-if="authMode === 'signup'"
              v-model="authUsername"
              type="text"
              :placeholder="t('usernamePlaceholder')"
              autocomplete="nickname"
            />
            <Input
              v-model="authPassword"
              type="password"
              :placeholder="t('passwordPlaceholder')"
              autocomplete="current-password"
            />
            <Button class="w-full" :disabled="authBusy">
              {{ authMode === 'signup' ? t('createAccount') : t('login') }}
            </Button>
          </form>
        </section>

        <template v-else>
          <p v-if="loading" class="text-sm text-muted-foreground">{{ t('loading') }}</p>

          <template v-if="viewMode === 'list'">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div class="grid w-full grid-cols-3 gap-1 rounded-lg border bg-background p-1 sm:inline-flex sm:w-auto sm:gap-0">
                <Button
                  size="sm"
                  class="w-full"
                  :variant="filter === 'all' ? 'default' : 'ghost'"
                  @click="filter = 'all'"
                  :disabled="busy"
                >
                  {{ t('all') }}
                </Button>
                <Button
                  size="sm"
                  class="w-full"
                  :variant="filter === 'active' ? 'default' : 'ghost'"
                  @click="filter = 'active'"
                  :disabled="busy"
                >
                  {{ t('active') }}
                </Button>
                <Button
                  size="sm"
                  class="w-full"
                  :variant="filter === 'done' ? 'default' : 'ghost'"
                  @click="filter = 'done'"
                  :disabled="busy"
                >
                  {{ t('done') }}
                </Button>
              </div>
              <Button
                class="w-full sm:w-auto"
                variant="outline"
                type="button"
                @click="clearDone"
                :disabled="doneCount === 0 || busy"
              >
                {{ t('clearDone') }}
              </Button>
            </div>
            <p class="text-xs text-muted-foreground">{{ t('dragHint') }}</p>

            <draggable
              v-model="draggableTodos"
              tag="ul"
              class="todo-list"
              item-key="id"
              handle=".drag-handle"
              :animation="180"
              :delay="140"
              :delay-on-touch-only="true"
              :touch-start-threshold="4"
              :fallback-tolerance="8"
              :force-fallback="true"
              :fallback-on-body="true"
              :disabled="busy"
              ghost-class="drag-ghost"
              chosen-class="drag-chosen"
              @end="onDragEnd"
            >
              <template #item="{ element: todo }">
                <li class="rounded-lg border bg-card p-3">
                  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div class="flex min-w-0 flex-1 items-start gap-2">
                      <button type="button" class="drag-handle" aria-label="drag">&#8942;&#8942;</button>
                      <input
                        :checked="todo.done"
                        type="checkbox"
                        @change="setTodoDone(todo, $event.target.checked)"
                      />
                      <div class="min-w-0 space-y-1">
                        <span class="block break-words" :class="{ 'text-muted-foreground line-through': todo.done }">
                          {{ todo.text }}
                        </span>
                        <span v-if="todo.labelText" class="todo-label-badge" :style="getLabelBadgeStyle(todo)">
                          <span class="todo-label-dot" :style="getLabelDotStyle(todo)" />
                          {{ todo.labelText }}
                        </span>
                      </div>
                    </div>
                    <div class="flex w-full gap-2 sm:w-auto">
                      <Button class="flex-1 sm:flex-none" variant="ghost" size="sm" @click="openDetail(todo.id)">
                        {{ t('detail') }}
                      </Button>
                      <Button class="flex-1 sm:flex-none" variant="destructive" size="sm" @click="deleteTodo(todo.id)">
                        {{ t('delete') }}
                      </Button>
                    </div>
                  </div>
                  <p class="mt-2 text-xs text-muted-foreground">{{ t('created') }}: {{ formatDateTime(todo.createdAt) }}</p>
                  <p v-if="todo.dueAt" class="mt-1 text-xs text-muted-foreground">{{ t('due') }}: {{ formatDateTime(todo.dueAt) }}</p>
                  <p v-if="todo.location" class="mt-1 text-xs text-muted-foreground">{{ t('place') }}: {{ todo.location }}</p>
                  <p v-if="todo.rolloverEnabled" class="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {{ t('rolloverEnabled') }}
                  </p>
                </li>
              </template>
            </draggable>

            <p v-if="!loading && filteredTodos.length === 0" class="text-sm text-muted-foreground">
              {{ t('noItems') }}
            </p>

            <footer class="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>{{ t('remaining', { count: remainingCount }) }}</span>
              <span>{{ t('doneCount', { count: doneCount }) }}</span>
            </footer>
          </template>

          <section v-else class="space-y-3">
            <div class="calendar-toolbar">
              <Button variant="outline" size="sm" @click="moveCalendarMonth(-1)">&#10094;</Button>
              <p class="calendar-month">{{ calendarMonthLabel }}</p>
              <Button variant="outline" size="sm" @click="moveCalendarMonth(1)">&#10095;</Button>
              <Button variant="secondary" size="sm" @click="goCalendarToday">{{ t('calendarToday') }}</Button>
            </div>

            <ul class="calendar-weekdays">
              <li v-for="label in calendarWeekdayLabels" :key="label">{{ label }}</li>
            </ul>

            <ul class="calendar-grid">
              <li
                v-for="cell in calendarCells"
                :key="cell.key"
                class="calendar-cell"
                :class="{ 'calendar-cell--muted': !cell.isCurrentMonth, 'calendar-cell--today': cell.isToday }"
              >
                <p class="calendar-day">{{ cell.day }}</p>
                <ul class="calendar-items">
                  <li v-for="todo in cell.items.slice(0, 3)" :key="todo.id">
                    <button
                      type="button"
                      class="calendar-item"
                      :class="{ 'calendar-item--done': todo.done }"
                      :style="getCalendarItemStyle(todo)"
                      @click="openDetail(todo.id)"
                    >
                      <span class="calendar-item-main">
                        <span v-if="todo.labelText" class="todo-label-dot" :style="getLabelDotStyle(todo)" />
                        <span class="truncate">{{ todo.text }}</span>
                      </span>
                      <small class="calendar-item-time">{{ formatTime(todo.dueAt) }}</small>
                      <small v-if="todo.labelText" class="calendar-item-label">{{ todo.labelText }}</small>
                    </button>
                  </li>
                  <li v-if="cell.items.length > 3" class="calendar-more">+{{ cell.items.length - 3 }}</li>
                </ul>
              </li>
            </ul>

            <p class="text-xs text-muted-foreground">{{ t('calendarNoDue', { count: todosWithoutDueCount }) }}</p>
          </section>
        </template>

        <p v-if="errorMessage" class="text-sm font-semibold text-rose-600">{{ errorMessage }}</p>
      </CardContent>
    </Card>

    <section v-if="settingsOpen" class="modal-wrap" @click.self="closeSettings">
      <article class="modal settings-modal">
        <header class="modal-header">
          <h2>{{ t('settingsTitle') }}</h2>
          <Button variant="outline" size="sm" @click="closeSettings">{{ t('close') }}</Button>
        </header>

        <div class="space-y-2">
          <p class="text-sm text-muted-foreground">{{ t('theme') }}</p>
          <div class="inline-flex w-full rounded-lg border bg-background p-1">
            <Button class="flex-1" :variant="isDark ? 'ghost' : 'default'" @click="setTheme('light')">
              <Sun class="mr-1 h-4 w-4" />
              {{ t('lightMode') }}
            </Button>
            <Button class="flex-1" :variant="isDark ? 'default' : 'ghost'" @click="setTheme('dark')">
              <Moon class="mr-1 h-4 w-4" />
              {{ t('darkMode') }}
            </Button>
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-sm text-muted-foreground">{{ t('language') }}</p>
          <Select :model-value="locale" @update:model-value="setLocale">
            <SelectTrigger class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in languageOptions" :key="option.code" :value="option.code">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </article>
    </section>

    <section v-if="addTodoOpen && isAuthenticated" class="modal-wrap" @click.self="closeAddTodo">
      <article class="modal settings-modal">
        <header class="modal-header">
          <h2>{{ t('addScheduleTitle') }}</h2>
          <Button variant="outline" size="sm" @click="closeAddTodo">{{ t('close') }}</Button>
        </header>

        <form class="space-y-2" @submit.prevent="addTodo">
          <Input
            v-model="newTask"
            class="w-full"
            type="text"
            :placeholder="t('taskPlaceholder')"
            autocomplete="off"
          />
          <div class="grid gap-2 md:grid-cols-2">
            <div class="space-y-1">
              <p class="text-xs text-muted-foreground">{{ t('dueAt') }}</p>
              <DateTimePicker
                v-model="newDueAt"
                :locale="localeCodeByLanguage[locale] || 'en-US'"
                :placeholder="t('dueAtPlaceholder')"
                :clear-label="t('pickerClear')"
                :done-label="t('pickerDone')"
              />
            </div>
            <div class="space-y-1">
              <p class="text-xs text-muted-foreground">{{ t('location') }}</p>
              <Input
                v-model="newLocation"
                class="w-full"
                type="text"
                :placeholder="t('locationPlaceholder')"
                autocomplete="off"
              />
            </div>
          </div>
          <div class="grid gap-2 md:grid-cols-[1fr_auto]">
            <div class="space-y-1">
              <p class="text-xs text-muted-foreground">{{ t('label') }}</p>
              <Input
                v-model="newLabelText"
                class="w-full"
                type="text"
                :placeholder="t('labelPlaceholder')"
                autocomplete="off"
              />
            </div>
            <div class="space-y-1">
              <p class="text-xs text-muted-foreground">{{ t('labelColor') }}</p>
              <div class="label-color-field">
                <input v-model="newLabelColor" class="label-color-input" type="color" />
                <Input v-model="newLabelColor" class="label-color-code" type="text" inputmode="text" />
              </div>
            </div>
          </div>
          <label class="flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm">
            <input v-model="newRolloverEnabled" type="checkbox" class="mt-1" />
            <span class="space-y-0.5">
              <span class="block font-medium">{{ t('rolloverOption') }}</span>
              <span class="block text-xs text-muted-foreground">{{ t('rolloverHint') }}</span>
            </span>
          </label>
          <Button class="w-full" type="submit" :disabled="busy">{{ t('addTask') }}</Button>
        </form>
      </article>
    </section>

    <section v-if="detailTodo" class="modal-wrap" @click.self="closeDetail">
      <article class="modal">
        <header class="modal-header">
          <h2>{{ detailTodo.text }}</h2>
          <div class="flex flex-wrap gap-2">
            <template v-if="detailEditMode">
              <Button size="sm" @click="saveDetailEdit" :disabled="busy">{{ t('save') }}</Button>
              <Button variant="outline" size="sm" @click="cancelDetailEdit">{{ t('cancel') }}</Button>
            </template>
            <Button v-else variant="outline" size="sm" @click="startDetailEdit">{{ t('edit') }}</Button>
            <Button variant="outline" size="sm" @click="closeDetail">{{ t('close') }}</Button>
          </div>
        </header>
        <p class="created-at">{{ t('created') }}: {{ formatDateTime(detailTodo.createdAt) }}</p>

        <template v-if="detailEditMode">
          <p class="text-sm font-medium">{{ t('editTodoMeta') }}</p>
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground">{{ t('dueAt') }}</p>
            <DateTimePicker
              v-model="detailDueAtDraft"
              :locale="localeCodeByLanguage[locale] || 'en-US'"
              :placeholder="t('dueAtPlaceholder')"
              :clear-label="t('pickerClear')"
              :done-label="t('pickerDone')"
            />
          </div>
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground">{{ t('location') }}</p>
            <Input v-model="detailLocationDraft" type="text" :placeholder="t('locationPlaceholder')" />
          </div>
          <div class="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div class="space-y-1">
              <p class="text-xs text-muted-foreground">{{ t('label') }}</p>
              <Input v-model="detailLabelTextDraft" type="text" :placeholder="t('labelPlaceholder')" />
            </div>
            <div class="space-y-1">
              <p class="text-xs text-muted-foreground">{{ t('labelColor') }}</p>
              <div class="label-color-field">
                <input v-model="detailLabelColorDraft" class="label-color-input" type="color" />
                <Input v-model="detailLabelColorDraft" class="label-color-code" type="text" inputmode="text" />
              </div>
            </div>
          </div>
          <label class="flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm">
            <input v-model="detailRolloverDraft" type="checkbox" class="mt-1" />
            <span class="space-y-0.5">
              <span class="block font-medium">{{ t('rolloverOption') }}</span>
              <span class="block text-xs text-muted-foreground">{{ t('rolloverHint') }}</span>
            </span>
          </label>
        </template>
        <template v-else>
          <p class="created-at">{{ t('due') }}: {{ formatDateTime(detailTodo.dueAt) }}</p>
          <p class="created-at">{{ t('place') }}: {{ detailTodo.location || '-' }}</p>
          <p v-if="detailTodo.labelText" class="created-at detail-label-row">
            {{ t('label') }}:
            <span class="todo-label-badge" :style="getLabelBadgeStyle(detailTodo)">
              <span class="todo-label-dot" :style="getLabelDotStyle(detailTodo)" />
              {{ detailTodo.labelText }}
            </span>
          </p>
          <p v-if="detailTodo.rolloverEnabled" class="created-at">{{ t('rolloverEnabled') }}</p>
        </template>

        <form class="comment-form" @submit.prevent="addComment(detailTodo.id)">
          <Input v-model="commentDrafts[detailTodo.id]" type="text" :placeholder="t('commentPlaceholder')" />
          <Button type="submit" :disabled="busy">{{ t('comment') }}</Button>
        </form>

        <ul class="comment-list" v-if="detailTodo.comments.length > 0">
          <li v-for="comment in detailTodo.comments" :key="comment.id">
            <div class="min-w-0 flex-1">
              <p v-if="editingCommentId !== comment.id">{{ comment.text }}</p>
              <Input
                v-else
                v-model="commentEditDraft"
                type="text"
                :placeholder="t('commentEditPlaceholder')"
              />
              <small>{{ formatDateTime(comment.createdAt) }}</small>
            </div>
            <div class="comment-actions">
              <template v-if="editingCommentId === comment.id">
                <Button size="sm" @click="saveCommentEdit(detailTodo.id, comment.id)" :disabled="busy">
                  {{ t('save') }}
                </Button>
                <Button variant="outline" size="sm" @click="cancelCommentEdit">{{ t('cancel') }}</Button>
              </template>
              <template v-else>
                <Button variant="ghost" size="sm" @click="startCommentEdit(comment)">{{ t('edit') }}</Button>
                <Button variant="ghost" size="sm" @click="deleteComment(detailTodo.id, comment.id)">
                  {{ t('remove') }}
                </Button>
              </template>
            </div>
          </li>
        </ul>
        <p v-else class="empty">{{ t('noComments') }}</p>
      </article>
    </section>
  </main>
</template>
