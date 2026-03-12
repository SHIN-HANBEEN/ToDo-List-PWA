const THEME_STORAGE_KEY = 'todo-theme'

export function setupTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  const initialTheme =
    savedTheme === 'dark' || savedTheme === 'light'
      ? savedTheme
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'

  document.documentElement.classList.toggle('dark', initialTheme === 'dark')
}
