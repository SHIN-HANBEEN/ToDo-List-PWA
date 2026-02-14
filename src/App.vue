<script setup>
import { computed, onMounted, ref } from 'vue'
import draggable from 'vuedraggable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const LANGUAGE_KEY = 'todo-language'
const locale = ref('ko')
const newTask = ref('')
const filter = ref('all')
const todos = ref([])
const commentDrafts = ref({})
const detailTodoId = ref(null)
const loading = ref(false)
const busy = ref(false)
const errorMessage = ref('')
const user = ref(null)
const authMode = ref('login')
const authEmail = ref('')
const authPassword = ref('')
const authBusy = ref(false)

const messages = {
  ko: {
    appTitle: 'Todogram',
    language: '언어',
    guest: '비로그인',
    login: '로그인',
    signup: '회원가입',
    logout: '로그아웃',
    createAccount: '계정 만들기',
    emailPlaceholder: '이메일 주소',
    passwordPlaceholder: '비밀번호 (최소 8자)',
    authSigninHelp: '로그인해서 계속 진행하세요',
    authSignupHelp: '새 계정을 만들어 시작하세요',
    addTask: '추가',
    taskPlaceholder: '할 일을 입력하세요',
    all: '전체',
    active: '진행중',
    done: '완료',
    clearDone: '완료 삭제',
    dragHint: '전체/진행중/완료 탭 모두에서 드래그 정렬이 가능합니다.',
    loading: '불러오는 중...',
    detail: '상세보기',
    delete: '삭제',
    created: '생성',
    noItems: '표시할 항목이 없습니다.',
    remaining: '남은 작업 {count}',
    doneCount: '완료 {count}',
    close: '닫기',
    commentPlaceholder: '댓글 작성',
    comment: '댓글',
    remove: '삭제',
    noComments: '댓글이 없습니다.',
  },
  en: {
    appTitle: 'Todogram',
    language: 'Language',
    guest: 'Guest',
    login: 'Login',
    signup: 'Sign up',
    logout: 'Logout',
    createAccount: 'Create account',
    emailPlaceholder: 'Email address',
    passwordPlaceholder: 'Password (min 8 chars)',
    authSigninHelp: 'Sign in to continue',
    authSignupHelp: 'Create your account to get started',
    addTask: 'Add',
    taskPlaceholder: 'Add a task',
    all: 'All',
    active: 'Active',
    done: 'Done',
    clearDone: 'Clear done',
    dragHint: 'Drag reorder is available in All, Active, and Done tabs.',
    loading: 'Loading...',
    detail: 'Detail',
    delete: 'Delete',
    created: 'Created',
    noItems: 'No items to display.',
    remaining: 'Remaining {count}',
    doneCount: 'Done {count}',
    close: 'Close',
    commentPlaceholder: 'Add comment',
    comment: 'Comment',
    remove: 'Remove',
    noComments: 'No comments yet.',
  },
  zh: {
    appTitle: 'Todogram',
    language: '语言',
    guest: '未登录',
    login: '登录',
    signup: '注册',
    logout: '退出登录',
    createAccount: '创建账号',
    emailPlaceholder: '邮箱地址',
    passwordPlaceholder: '密码（至少 8 位）',
    authSigninHelp: '登录后继续使用',
    authSignupHelp: '创建新账号开始使用',
    addTask: '添加',
    taskPlaceholder: '输入待办事项',
    all: '全部',
    active: '进行中',
    done: '已完成',
    clearDone: '清除已完成',
    dragHint: '全部/进行中/已完成标签都支持拖拽排序。',
    loading: '加载中...',
    detail: '详情',
    delete: '删除',
    created: '创建时间',
    noItems: '没有可显示的项目。',
    remaining: '剩余 {count}',
    doneCount: '已完成 {count}',
    close: '关闭',
    commentPlaceholder: '添加评论',
    comment: '评论',
    remove: '移除',
    noComments: '暂无评论。',
  },
  ja: {
    appTitle: 'Todogram',
    language: '言語',
    guest: '未ログイン',
    login: 'ログイン',
    signup: '新規登録',
    logout: 'ログアウト',
    createAccount: 'アカウント作成',
    emailPlaceholder: 'メールアドレス',
    passwordPlaceholder: 'パスワード（8文字以上）',
    authSigninHelp: 'ログインして続行',
    authSignupHelp: '新しいアカウントを作成',
    addTask: '追加',
    taskPlaceholder: 'タスクを入力',
    all: 'すべて',
    active: '進行中',
    done: '完了',
    clearDone: '完了を削除',
    dragHint: 'すべて/進行中/完了タブでドラッグ並び替えが可能です。',
    loading: '読み込み中...',
    detail: '詳細',
    delete: '削除',
    created: '作成日時',
    noItems: '表示する項目がありません。',
    remaining: '残り {count}',
    doneCount: '完了 {count}',
    close: '閉じる',
    commentPlaceholder: 'コメントを追加',
    comment: 'コメント',
    remove: '削除',
    noComments: 'コメントはありません。',
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
const currentUserLabel = computed(() => user.value?.email || t('guest'))

onMounted(async () => {
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
        password: authPassword.value,
      }),
    })
    user.value = payload.user
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

async function onDragChange(event) {
  if (!event?.moved) return
  if (busy.value) return
  await persistOrder()
}

async function addTodo() {
  const text = newTask.value.trim()
  if (!text || busy.value) return
  busy.value = true
  errorMessage.value = ''
  try {
    const payload = await apiRequest('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
    todos.value.unshift(payload.todo)
    commentDrafts.value[payload.todo.id] = ''
    newTask.value = ''
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
  } catch (error) {
    if (target) target.comments = originalComments
    errorMessage.value = translateError(error.message)
  } finally {
    busy.value = false
  }
}

function openDetail(todoId) {
  detailTodoId.value = todoId
  if (typeof commentDrafts.value[todoId] !== 'string') commentDrafts.value[todoId] = ''
}

function closeDetail() {
  detailTodoId.value = null
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
</script>

<template>
  <main class="page">
    <Card class="mx-1 w-full max-w-3xl border-white/60 bg-white/90 shadow-2xl backdrop-blur-xl sm:mx-0">
      <CardHeader class="space-y-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle class="text-2xl tracking-tight sm:text-3xl">{{ t('appTitle') }}</CardTitle>
          <div class="flex w-full items-center justify-between gap-2 text-xs text-muted-foreground sm:w-auto sm:justify-end">
            <span class="max-w-[70vw] truncate font-medium sm:max-w-[220px]">{{ currentUserLabel }}</span>
            <Button v-if="isAuthenticated" variant="outline" size="sm" @click="logout" :disabled="authBusy">
              {{ t('logout') }}
            </Button>
          </div>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
            <span class="text-sm text-muted-foreground">{{ t('language') }}</span>
            <Select :model-value="locale" @update:model-value="setLocale">
              <SelectTrigger class="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in languageOptions" :key="option.code" :value="option.code">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid w-full grid-cols-3 gap-1 rounded-lg border bg-background p-1 sm:inline-flex sm:w-auto sm:gap-0">
            <Button
              size="sm"
              class="w-full"
              :variant="filter === 'all' ? 'default' : 'ghost'"
              @click="filter = 'all'"
              :disabled="busy || !isAuthenticated"
            >
              {{ t('all') }}
            </Button>
            <Button
              size="sm"
              class="w-full"
              :variant="filter === 'active' ? 'default' : 'ghost'"
              @click="filter = 'active'"
              :disabled="busy || !isAuthenticated"
            >
              {{ t('active') }}
            </Button>
            <Button
              size="sm"
              class="w-full"
              :variant="filter === 'done' ? 'default' : 'ghost'"
              @click="filter = 'done'"
              :disabled="busy || !isAuthenticated"
            >
              {{ t('done') }}
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
          <form class="flex flex-col gap-2 md:flex-row" @submit.prevent="addTodo">
            <Input
              v-model="newTask"
              class="md:flex-1"
              type="text"
              :placeholder="t('taskPlaceholder')"
              autocomplete="off"
            />
            <Button class="w-full md:w-auto" type="submit" :disabled="busy">{{ t('addTask') }}</Button>
            <Button
              class="w-full md:w-auto"
              variant="outline"
              type="button"
              @click="clearDone"
              :disabled="doneCount === 0 || busy"
            >
              {{ t('clearDone') }}
            </Button>
          </form>

          <p class="text-xs text-muted-foreground">{{ t('dragHint') }}</p>
          <p v-if="loading" class="text-sm text-muted-foreground">{{ t('loading') }}</p>

          <draggable
            v-model="draggableTodos"
            tag="ul"
            class="todo-list"
            item-key="id"
            handle=".drag-handle"
            :animation="180"
            :disabled="busy"
            ghost-class="drag-ghost"
            chosen-class="drag-chosen"
            @change="onDragChange"
          >
            <template #item="{ element: todo }">
              <li class="rounded-lg border bg-card p-3">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div class="flex min-w-0 flex-1 items-center gap-2">
                    <button type="button" class="drag-handle" aria-label="drag">&#8942;&#8942;</button>
                    <input
                      :checked="todo.done"
                      type="checkbox"
                      @change="setTodoDone(todo, $event.target.checked)"
                    />
                    <span :class="{ 'text-muted-foreground line-through': todo.done }">{{ todo.text }}</span>
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

        <p v-if="errorMessage" class="text-sm font-semibold text-rose-600">{{ errorMessage }}</p>
      </CardContent>
    </Card>

    <section v-if="detailTodo" class="modal-wrap" @click.self="closeDetail">
      <article class="modal">
        <header class="modal-header">
          <h2>{{ detailTodo.text }}</h2>
          <Button variant="outline" size="sm" @click="closeDetail">{{ t('close') }}</Button>
        </header>
        <p class="created-at">{{ t('created') }}: {{ formatDateTime(detailTodo.createdAt) }}</p>

        <form class="comment-form" @submit.prevent="addComment(detailTodo.id)">
          <Input v-model="commentDrafts[detailTodo.id]" type="text" :placeholder="t('commentPlaceholder')" />
          <Button type="submit" :disabled="busy">{{ t('comment') }}</Button>
        </form>

        <ul class="comment-list" v-if="detailTodo.comments.length > 0">
          <li v-for="comment in detailTodo.comments" :key="comment.id">
            <div>
              <p>{{ comment.text }}</p>
              <small>{{ formatDateTime(comment.createdAt) }}</small>
            </div>
            <Button variant="ghost" size="sm" @click="deleteComment(detailTodo.id, comment.id)">
              {{ t('remove') }}
            </Button>
          </li>
        </ul>
        <p v-else class="empty">{{ t('noComments') }}</p>
      </article>
    </section>
  </main>
</template>
