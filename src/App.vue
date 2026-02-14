<script setup>
import { computed, onMounted, ref } from 'vue'

// UI state
const newTask = ref('')
const filter = ref('all')
const todos = ref([])
const commentDrafts = ref({})
const draggingId = ref(null)
const detailTodoId = ref(null)
const loading = ref(false)
const busy = ref(false)
const errorMessage = ref('')

// Auth state
const user = ref(null)
const authMode = ref('login')
const authEmail = ref('')
const authPassword = ref('')
const authBusy = ref(false)

const filteredTodos = computed(() => {
  if (filter.value === 'active') return todos.value.filter((todo) => !todo.done)
  if (filter.value === 'done') return todos.value.filter((todo) => todo.done)
  return todos.value
})

const remainingCount = computed(() => todos.value.filter((todo) => !todo.done).length)
const doneCount = computed(() => todos.value.filter((todo) => todo.done).length)
const isDragEnabled = computed(() => filter.value === 'all')
const detailTodo = computed(() => todos.value.find((todo) => todo.id === detailTodoId.value) || null)
const isAuthenticated = computed(() => Boolean(user.value))

onMounted(async () => {
  // App bootstrap: try session restore, then load user data.
  await loadSessionUser()
  if (user.value) await loadTodos()
})

async function apiRequest(url, options = {}) {
  // Small fetch wrapper with shared JSON parsing + unified error message.
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
  // Equivalent to "current user" endpoint in many Spring-based apps.
  try {
    const payload = await apiRequest('/api/auth')
    user.value = payload.user
  } catch {
    user.value = null
  }
}

async function submitAuth() {
  // Handles both signup and login flows.
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
    errorMessage.value = error.message
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
    errorMessage.value = error.message
  } finally {
    authBusy.value = false
  }
}

async function loadTodos() {
  // User-specific todo load after auth is established.
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
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
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
    errorMessage.value = error.message
  } finally {
    busy.value = false
  }
}

async function setTodoDone(todo, done) {
  // Optimistic UI update with rollback on server error.
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
    errorMessage.value = error.message
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
    errorMessage.value = error.message
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
    errorMessage.value = error.message
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
    errorMessage.value = error.message
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
    errorMessage.value = error.message
  } finally {
    busy.value = false
  }
}

function onDragStart(todoId) {
  if (!isDragEnabled.value || busy.value) return
  draggingId.value = todoId
}

async function onDrop(targetId) {
  // Client reorders immediately, then persists order via PATCH /api/todos.
  if (
    !isDragEnabled.value ||
    busy.value ||
    draggingId.value === null ||
    draggingId.value === targetId
  ) {
    return
  }

  const fromIndex = todos.value.findIndex((todo) => todo.id === draggingId.value)
  const toIndex = todos.value.findIndex((todo) => todo.id === targetId)
  if (fromIndex < 0 || toIndex < 0) return

  const previousOrder = [...todos.value]
  const [moved] = todos.value.splice(fromIndex, 1)
  todos.value.splice(toIndex, 0, moved)
  draggingId.value = null

  busy.value = true
  errorMessage.value = ''
  try {
    await apiRequest('/api/todos', {
      method: 'PATCH',
      body: JSON.stringify({ order: todos.value.map((todo) => todo.id) }),
    })
  } catch (error) {
    todos.value = previousOrder
    errorMessage.value = error.message
  } finally {
    busy.value = false
  }
}

function onDragEnd() {
  draggingId.value = null
}

function openDetail(todoId) {
  detailTodoId.value = todoId
  if (typeof commentDrafts.value[todoId] !== 'string') commentDrafts.value[todoId] = ''
}

function closeDetail() {
  detailTodoId.value = null
}

function formatDateTime(value) {
  // Shared date formatter used by todos and comments.
  if (!value) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
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
    <section class="card">
      <header class="header">
        <p class="eyebrow">Vue 3 + PWA + Postgres</p>
        <h1>TODO List</h1>
      </header>

      <section v-if="!isAuthenticated" class="auth-shell">
        <article class="auth-card">
          <p class="auth-script">Todogram</p>
          <p class="auth-subtitle">
            {{ authMode === 'signup' ? 'Create your account' : 'Sign in to continue' }}
          </p>

          <div class="chips auth-chips">
            <button :class="{ active: authMode === 'login' }" @click="authMode = 'login'">Login</button>
            <button :class="{ active: authMode === 'signup' }" @click="authMode = 'signup'">
              Sign up
            </button>
          </div>

          <form class="auth-form" @submit.prevent="submitAuth">
            <input v-model="authEmail" type="email" placeholder="Email address" autocomplete="email" />
            <input
              v-model="authPassword"
              type="password"
              placeholder="Password (min 8 chars)"
              autocomplete="current-password"
            />
            <button class="auth-submit" type="submit" :disabled="authBusy">
              {{ authMode === 'signup' ? 'Create account' : 'Login' }}
            </button>
          </form>
        </article>
      </section>

      <template v-else>
        <div class="user-bar">
          <span>{{ user.email }}</span>
          <button class="ghost" @click="logout" :disabled="authBusy">Logout</button>
        </div>

        <form class="composer" @submit.prevent="addTodo">
          <input v-model="newTask" type="text" placeholder="Add a task" autocomplete="off" />
          <button type="submit" :disabled="busy">Add</button>
        </form>

        <div class="toolbar">
          <div class="chips" role="tablist" aria-label="filter">
            <button :class="{ active: filter === 'all' }" @click="filter = 'all'" :disabled="busy">
              All
            </button>
            <button
              :class="{ active: filter === 'active' }"
              @click="filter = 'active'"
              :disabled="busy"
            >
              Active
            </button>
            <button :class="{ active: filter === 'done' }" @click="filter = 'done'" :disabled="busy">
              Done
            </button>
          </div>
          <button class="ghost" @click="clearDone" :disabled="doneCount === 0 || busy">
            Clear done
          </button>
        </div>

        <p class="hint">Drag reorder works in "All" filter only.</p>
        <p v-if="loading" class="hint">Loading...</p>

        <ul class="list">
          <li
            v-for="todo in filteredTodos"
            :key="todo.id"
            :class="{ done: todo.done, dragging: draggingId === todo.id }"
            :draggable="isDragEnabled && !busy"
            @dragstart="onDragStart(todo.id)"
            @dragover.prevent
            @drop="onDrop(todo.id)"
            @dragend="onDragEnd"
          >
            <div class="todo-main">
              <label>
                <input
                  :checked="todo.done"
                  type="checkbox"
                  @change="setTodoDone(todo, $event.target.checked)"
                />
                <span>{{ todo.text }}</span>
              </label>
              <div class="todo-actions">
                <button class="ghost" @click="openDetail(todo.id)">Detail</button>
                <button class="danger" @click="deleteTodo(todo.id)" aria-label="delete">Delete</button>
              </div>
            </div>
            <p class="created-at">Created: {{ formatDateTime(todo.createdAt) }}</p>
          </li>
          <li v-if="!loading && filteredTodos.length === 0" class="empty">No items to display.</li>
        </ul>

        <footer class="meta">
          <span>Remaining {{ remainingCount }}</span>
          <span>Done {{ doneCount }}</span>
        </footer>
      </template>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </section>

    <section v-if="detailTodo" class="modal-wrap" @click.self="closeDetail">
      <article class="modal">
        <header class="modal-header">
          <h2>{{ detailTodo.text }}</h2>
          <button class="ghost" @click="closeDetail">Close</button>
        </header>
        <p class="created-at">Created: {{ formatDateTime(detailTodo.createdAt) }}</p>

        <form class="comment-form" @submit.prevent="addComment(detailTodo.id)">
          <input
            v-model="commentDrafts[detailTodo.id]"
            type="text"
            placeholder="Add comment"
            autocomplete="off"
          />
          <button type="submit" :disabled="busy">Comment</button>
        </form>

        <ul class="comment-list" v-if="detailTodo.comments.length > 0">
          <li v-for="comment in detailTodo.comments" :key="comment.id">
            <div>
              <p>{{ comment.text }}</p>
              <small>{{ formatDateTime(comment.createdAt) }}</small>
            </div>
            <button class="comment-delete" @click="deleteComment(detailTodo.id, comment.id)">
              Remove
            </button>
          </li>
        </ul>
        <p v-else class="empty">No comments yet.</p>
      </article>
    </section>
  </main>
</template>
