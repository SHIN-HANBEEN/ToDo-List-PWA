<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import draggable from 'vuedraggable'
import { CalendarDays, Check, CircleHelp, Clock3, List, LogOut, MapPin, Menu, Moon, Pause, Pencil, Play, Plus, RotateCcw, Search, SendHorizontal, Sun, Tag, Trash2, UserRound, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
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
const ROLLOVER_DEFAULT_KEY = 'todo-default-rollover'
const PROFILE_IMAGE_MAX_DATA_LENGTH = 2_000_000
const PROFILE_IMAGE_MAX_UPLOAD_BYTES = 1_200_000
const locale = ref('ko')
const theme = ref('light')
const viewMode = ref('list')
const WEB_PUSH_PUBLIC_KEY = String(import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY || '').trim()
const calendarMonthAnchor = ref(startOfMonth(new Date()))
const newTodoTitle = ref('')
const newTodoContent = ref('')
const newDueAt = ref('')
const newLocation = ref('')
const LABEL_NONE_VALUE = '__none__'
const LABEL_FILTER_ALL_VALUE = '__all__'
const labels = ref([])
const newTodoLabelId = ref(LABEL_NONE_VALUE)
const todoLabelFilterId = ref(LABEL_FILTER_ALL_VALUE)
const addLabelOpen = ref(false)
const newLabelName = ref('')
const newLabelDraftColor = ref('#64748b')
const editingLabelId = ref(null)
const editLabelName = ref('')
const editLabelColor = ref('#64748b')
const defaultRolloverEnabled = ref(true)
const newRolloverEnabled = ref(true)
const filter = ref('all')
const searchQuery = ref('')
const todos = ref([])
const commentDrafts = ref({})
const addTodoOpen = ref(false)
const settingsOpen = ref(false)
const mobileHeaderOpen = ref(false)
const profileOpen = ref(false)
const profileEditMode = ref(false)
const profileBusy = ref(false)
const profileUsernameDraft = ref('')
const profileAvatarDraft = ref('')
const profileUsernameCheckBusy = ref(false)
const profileUsernameCheckMessage = ref('')
const profileUsernameAvailable = ref(null)
const profileFileInputRef = ref(null)
const rolloverTooltipOpen = ref(false)
const rolloverTooltipContext = ref('')
const rolloverTooltipStyle = ref({})
const rolloverTooltipRef = ref(null)
const mobileRolloverTooltipTriggerRef = ref(null)
const settingsRolloverTooltipTriggerRef = ref(null)
const detailTodoId = ref(null)
const detailEditMode = ref(false)
const detailTitleDraft = ref('')
const detailContentDraft = ref('')
const detailDueAtDraft = ref('')
const detailLocationDraft = ref('')
const detailTodoLabelId = ref(LABEL_NONE_VALUE)
const detailRolloverDraft = ref(false)
const editingCommentId = ref(null)
const commentEditDraft = ref('')
const commentEditTextareaRef = ref(null)
const loading = ref(false)
const busy = ref(false)
const errorMessage = ref('')
const user = ref(null)
const authMode = ref('login')
const authEmail = ref('')
const authUsername = ref('')
const authPassword = ref('')
const authBusy = ref(false)
const labelBusy = ref(false)
const notificationBusy = ref(false)
const notificationSupported = ref(false)
const notificationEnabled = ref(false)
const notificationPermission = ref('default')

const messages = {
  ko: {
    appTitle: 'Todogram',
    language: '언어',
    settings: '설정',
    settingsTitle: '앱 설정',
    profileTitle: '내 프로필',
    profileImage: '유저 이미지',
    profileUsername: '유저 네임',
    profileEmail: '이메일',
    changeImage: '이미지 변경',
    removeImage: '이미지 제거',
    checkDuplicate: '중복 확인',
    usernameAvailable: '사용 가능한 유저 네임입니다.',
    usernameTaken: '이미 사용 중인 유저 네임입니다.',
    addSchedule: '일정 추가',
    addScheduleTitle: '새 일정 추가',
    guest: '비로그인',
    login: '로그인',
    signup: '회원가입',
    logout: '로그아웃',
    createAccount: '계정 만들기',
    emailPlaceholder: '이메일 주소',
    usernamePlaceholder: '사용자 이름 (2-24자)',
    passwordPlaceholder: '비밀번호 (최소 8자)',
    theme: '테마',
    lightMode: '라이트',
    darkMode: '다크',
    authSigninHelp: '로그인해서 계속 진행하세요',
    authSignupHelp: '새 계정을 만들고 시작하세요',
    listView: '리스트',
    calendarView: '캘린더',
    addTask: '추가',
    todoTitle: '제목',
    todoTitlePlaceholder: 'TODO 제목을 입력하세요',
    todoContent: '내용',
    todoContentPlaceholder: 'TODO 내용을 입력하세요',
    taskPlaceholder: '할 일을 입력하세요',
    dueAt: '마감일시',
    dueAtPlaceholder: '마감일시 선택',
    pickerClear: '지우기',
    pickerDone: '확인',
    label: '라벨',
    labelPlaceholder: '라벨 텍스트',
    labelColor: '라벨 색상',
    labelSelectPrompt: '라벨을 선택해주세요',
    allLabels: '전체 라벨',
    labelSettings: '라벨 설정',
    labelAdd: '라벨 추가',
    labelSavedList: '저장한 라벨',
    labelNameInputPlaceholder: '라벨 이름',
    labelEmpty: '저장한 라벨이 없습니다.',
    location: '장소',
    locationPlaceholder: '장소를 입력하세요',
    rolloverOption: '미완료 시 다음날 자동 이월',
    rolloverHint: '마감일시를 넘기면 다음날 같은 시간으로 자동 이월됩니다.',
    all: '전체',
    status: '상태',
    searchPlaceholder: '할 일을 검색하세요',
    waiting: '대기',
    active: '진행중',
    done: '완료',
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
    todayTasksBadge: '오늘 할 일 {count}',
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
    notifications: '알림',
    notificationReminder30m: '일정 시작 30분 전 알림',
    notificationUnsupported: '현재 기기 또는 브라우저에서 푸시 알림을 지원하지 않습니다.',
    notificationNotConfigured: '알림 기능이 아직 서버에 설정되지 않았습니다.',
    notificationPermissionDenied: '브라우저 알림 권한이 차단되었습니다. 브라우저 설정에서 허용해 주세요.',
    notificationStatusOn: '현재 활성화됨',
    notificationStatusOff: '현재 비활성화됨',
    notificationEnableAction: '켜기',
    notificationDisableAction: '끄기',
  },
  en: {
    appTitle: 'Todogram',
    language: 'Language',
    settings: 'Settings',
    settingsTitle: 'App settings',
    profileTitle: 'My profile',
    profileImage: 'User image',
    profileUsername: 'Username',
    profileEmail: 'Email',
    changeImage: 'Change image',
    removeImage: 'Remove image',
    checkDuplicate: 'Check duplicate',
    usernameAvailable: 'This username is available.',
    usernameTaken: 'This username is already taken.',
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
    todoTitle: 'Title',
    todoTitlePlaceholder: 'Enter TODO title',
    todoContent: 'Content',
    todoContentPlaceholder: 'Enter TODO content',
    taskPlaceholder: 'Add a task',
    dueAt: 'Due date/time',
    dueAtPlaceholder: 'Choose due date/time',
    pickerClear: 'Clear',
    pickerDone: 'Done',
    label: 'Label',
    labelPlaceholder: 'Label text',
    labelColor: 'Label color',
    labelSelectPrompt: 'Please select a label',
    allLabels: 'All labels',
    labelSettings: 'Label settings',
    labelAdd: 'Add label',
    labelSavedList: 'Saved labels',
    labelNameInputPlaceholder: 'Label name',
    labelEmpty: 'No saved labels.',
    location: 'Location',
    locationPlaceholder: 'Add location',
    rolloverOption: 'Auto-move deadline to next day if unfinished',
    rolloverHint: 'If not completed by due date, it will automatically move to the same time next day.',
    all: 'All',
    status: 'Status',
    searchPlaceholder: 'Search tasks',
    waiting: 'Waiting',
    active: 'Active',
    done: 'Done',
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
    todayTasksBadge: "Today's tasks {count}",
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
    notifications: 'Notifications',
    notificationReminder30m: 'Notify 30 minutes before schedule starts',
    notificationUnsupported: 'Push notifications are not supported on this device or browser.',
    notificationNotConfigured: 'Notification service is not configured on server yet.',
    notificationPermissionDenied: 'Browser notification permission is blocked. Allow it in browser settings.',
    notificationStatusOn: 'Currently enabled',
    notificationStatusOff: 'Currently disabled',
    notificationEnableAction: 'Enable',
    notificationDisableAction: 'Disable',
  },
  zh: {
    appTitle: 'Todogram',
    language: '语言',
    settings: '设置',
    settingsTitle: '应用设置',
    profileTitle: '我的资料',
    profileImage: '用户头像',
    profileUsername: '用户名',
    profileEmail: '邮箱',
    changeImage: '更换图片',
    removeImage: '移除图片',
    checkDuplicate: '重复检查',
    usernameAvailable: '该用户名可用。',
    usernameTaken: '该用户名已被使用。',
    addSchedule: '添加日程',
    addScheduleTitle: '添加新日程',
    guest: '访客',
    login: '登录',
    signup: '注册',
    logout: '退出登录',
    createAccount: '创建账号',
    emailPlaceholder: '邮箱地址',
    usernamePlaceholder: '用户名（2-24个字符）',
    passwordPlaceholder: '密码（至少8位）',
    theme: '主题',
    lightMode: '浅色',
    darkMode: '深色',
    authSigninHelp: '登录后继续',
    authSignupHelp: '创建账号开始使用',
    listView: '列表',
    calendarView: '日历',
    addTask: '添加',
    todoTitle: '标题',
    todoTitlePlaceholder: '请输入 TODO 标题',
    todoContent: '内容',
    todoContentPlaceholder: '请输入 TODO 内容',
    taskPlaceholder: '输入待办事项',
    dueAt: '截止日期时间',
    dueAtPlaceholder: '选择截止日期时间',
    pickerClear: '清除',
    pickerDone: '完成',
    label: '标签',
    labelPlaceholder: '标签文本',
    labelColor: '标签颜色',
    labelSelectPrompt: '请选择标签',
    allLabels: '全部标签',
    labelSettings: '标签设置',
    labelAdd: '添加标签',
    labelSavedList: '已保存的标签',
    labelNameInputPlaceholder: '标签名称',
    labelEmpty: '暂无已保存标签。',
    location: '地点',
    locationPlaceholder: '输入地点',
    rolloverOption: '未完成时自动顺延到次日',
    rolloverHint: '若到截止时间仍未完成，将自动顺延到次日同一时间。',
    all: '全部',
    status: '状态',
    searchPlaceholder: '搜索任务',
    waiting: '待处理',
    active: '进行中',
    done: '已完成',
    loading: '加载中...',
    detail: '详情',
    edit: '编辑',
    save: '保存',
    cancel: '取消',
    editTodoMeta: '编辑日程信息',
    delete: '删除',
    created: '创建时间',
    noItems: '没有可显示的项目。',
    remaining: '剩余 {count}',
    doneCount: '完成 {count}',
    todayTasksBadge: '今日待办 {count}',
    close: '关闭',
    commentPlaceholder: '添加评论',
    commentEditPlaceholder: '编辑评论',
    comment: '评论',
    remove: '删除',
    noComments: '暂无评论。',
    calendarToday: '今天',
    calendarNoItems: '该日期没有日程。',
    calendarNoDue: '未设置截止时间的项目：{count}',
    due: '截止',
    place: '地点',
    rolloverEnabled: '已启用自动顺延',
    notifications: '通知',
    notificationReminder30m: '开始前30分钟通知',
    notificationUnsupported: '当前设备或浏览器不支持推送通知。',
    notificationNotConfigured: '服务器尚未完成通知配置。',
    notificationPermissionDenied: '浏览器通知权限已被阻止，请在浏览器设置中允许。',
    notificationStatusOn: '当前已启用',
    notificationStatusOff: '当前未启用',
    notificationEnableAction: '开启',
    notificationDisableAction: '关闭',
  },
  ja: {
    appTitle: 'Todogram',
    language: '言語',
    settings: '設定',
    settingsTitle: 'アプリ設定',
    profileTitle: 'プロフィール',
    profileImage: 'ユーザー画像',
    profileUsername: 'ユーザー名',
    profileEmail: 'メール',
    changeImage: '画像を変更',
    removeImage: '画像を削除',
    checkDuplicate: '重複確認',
    usernameAvailable: 'このユーザー名は使用できます。',
    usernameTaken: 'このユーザー名はすでに使われています。',
    addSchedule: '予定追加',
    addScheduleTitle: '新しい予定を追加',
    guest: 'ゲスト',
    login: 'ログイン',
    signup: '新規登録',
    logout: 'ログアウト',
    createAccount: 'アカウント作成',
    emailPlaceholder: 'メールアドレス',
    usernamePlaceholder: 'ユーザー名（2-24文字）',
    passwordPlaceholder: 'パスワード（8文字以上）',
    theme: 'テーマ',
    lightMode: 'ライト',
    darkMode: 'ダーク',
    authSigninHelp: 'ログインして続行してください',
    authSignupHelp: 'アカウントを作成して開始してください',
    listView: 'リスト',
    calendarView: 'カレンダー',
    addTask: '追加',
    todoTitle: 'タイトル',
    todoTitlePlaceholder: 'TODOタイトルを入力',
    todoContent: '内容',
    todoContentPlaceholder: 'TODO内容を入力',
    taskPlaceholder: 'タスクを入力',
    dueAt: '締切日時',
    dueAtPlaceholder: '締切日時を選択',
    pickerClear: 'クリア',
    pickerDone: '完了',
    label: 'ラベル',
    labelPlaceholder: 'ラベルテキスト',
    labelColor: 'ラベル色',
    labelSelectPrompt: 'ラベルを選択してください',
    allLabels: 'すべてのラベル',
    labelSettings: 'ラベル設定',
    labelAdd: 'ラベル追加',
    labelSavedList: '保存済みラベル',
    labelNameInputPlaceholder: 'ラベル名',
    labelEmpty: '保存済みラベルはありません。',
    location: '場所',
    locationPlaceholder: '場所を入力',
    rolloverOption: '未完了なら翌日に自動繰り越し',
    rolloverHint: '締切までに完了しない場合、翌日の同時刻に自動で繰り越されます。',
    all: 'すべて',
    status: 'ステータス',
    searchPlaceholder: 'タスクを検索',
    waiting: '待機',
    active: '進行中',
    done: '完了',
    loading: '読み込み中...',
    detail: '詳細',
    edit: '編集',
    save: '保存',
    cancel: 'キャンセル',
    editTodoMeta: '予定情報を編集',
    delete: '削除',
    created: '作成',
    noItems: '表示する項目がありません。',
    remaining: '残り {count}',
    doneCount: '完了 {count}',
    todayTasksBadge: '今日の予定 {count}',
    close: '閉じる',
    commentPlaceholder: 'コメントを追加',
    commentEditPlaceholder: 'コメントを編集',
    comment: 'コメント',
    remove: '削除',
    noComments: 'コメントはありません。',
    calendarToday: '今日',
    calendarNoItems: 'この日付の予定はありません。',
    calendarNoDue: '締切未設定の項目: {count}',
    due: '締切',
    place: '場所',
    rolloverEnabled: '自動繰り越し有効',
    notifications: '通知',
    notificationReminder30m: '予定開始30分前に通知',
    notificationUnsupported: 'この端末またはブラウザではプッシュ通知を利用できません。',
    notificationNotConfigured: '通知機能のサーバー設定がまだ完了していません。',
    notificationPermissionDenied: 'ブラウザの通知権限がブロックされています。設定で許可してください。',
    notificationStatusOn: '現在有効',
    notificationStatusOff: '現在無効',
    notificationEnableAction: '有効化',
    notificationDisableAction: '無効化',
  },
}
const errorMessages = {
  Unauthorized: { ko: '로그인이 필요합니다.', en: 'Login required.', zh: '需要登录。', ja: 'ログインが必要です。' },
  'forbidden': {
    ko: '접근 권한이 없습니다.',
    en: 'Forbidden.',
    zh: '没有访问权限。',
    ja: 'アクセス権限がありません。',
  },
  'web push is not configured on server': {
    ko: '서버에 푸시 알림 설정이 없습니다.',
    en: 'Web push is not configured on server.',
    zh: '服务器尚未配置推送通知。',
    ja: 'サーバーでWebプッシュが設定されていません。',
  },
  'push notifications are not supported on this device/browser': {
    ko: '현재 기기 또는 브라우저에서 푸시 알림을 지원하지 않습니다.',
    en: 'Push notifications are not supported on this device/browser.',
    zh: '当前设备或浏览器不支持推送通知。',
    ja: 'この端末またはブラウザではプッシュ通知を利用できません。',
  },
  'notification permission denied': {
    ko: '알림 권한이 거부되었습니다.',
    en: 'Notification permission denied.',
    zh: '通知权限被拒绝。',
    ja: '通知権限が拒否されました。',
  },
  'subscription endpoint is required': {
    ko: '구독 endpoint 값이 필요합니다.',
    en: 'Subscription endpoint is required.',
    zh: '需要 subscription endpoint。',
    ja: 'subscription endpoint が必要です。',
  },
  'subscription keys are required': {
    ko: '구독 키 값이 필요합니다.',
    en: 'Subscription keys are required.',
    zh: '需要 subscription keys。',
    ja: 'subscription keys が必要です。',
  },
  'email and password are required': {
    ko: '이메일과 비밀번호를 입력하세요.',
    en: 'Email and password are required.',
    zh: '请输入邮箱和密码。',
    ja: 'メールアドレスとパスワードを入力してください。',
  },
  'password must be at least 8 characters': {
    ko: '비밀번호는 최소 8자 이상이어야 합니다.',
    en: 'Password must be at least 8 characters.',
    zh: '密码至少需要 8 个字符。',
    ja: 'パスワードは8文字以上である必要があります。',
  },
  'email already registered': {
    ko: '이미 가입된 이메일입니다.',
    en: 'Email is already registered.',
    zh: '该邮箱已注册。',
    ja: 'このメールアドレスはすでに登録されています。',
  },
  'username already exists': {
    ko: '이미 사용 중인 유저 네임입니다.',
    en: 'Username already exists.',
    zh: '用户名已存在。',
    ja: 'このユーザー名はすでに存在します。',
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
    zh: '用户名长度需为 2~24 个字符。',
    ja: 'ユーザー名は2文字以上24文字以下で入力してください。',
  },
  'invalid credentials': {
    ko: '이메일 또는 비밀번호가 올바르지 않습니다.',
    en: 'Invalid credentials.',
    zh: '邮箱或密码不正确。',
    ja: 'メールアドレスまたはパスワードが正しくありません。',
  },
  'avatarUrl must be a valid image url': {
    ko: '올바른 이미지 형식으로 업로드하세요.',
    en: 'Please provide a valid image format.',
    zh: '请提供有效的图片格式。',
    ja: '有効な画像形式で指定してください。',
  },
  'avatar image is too large': {
    ko: '이미지 크기가 너무 큽니다. 2MB 이하 이미지를 사용하세요.',
    en: 'Image is too large. Please use an image smaller than 2MB.',
    zh: '图片过大，请使用 2MB 以下的图片。',
    ja: '画像サイズが大きすぎます。2MB以下の画像を使用してください。',
  },
  'text is required': {
    ko: '내용을 입력하세요.',
    en: 'Text is required.',
    zh: '请输入内容。',
    ja: '内容を入力してください。',
  },
  'title is required': {
    ko: '제목을 입력하세요.',
    en: 'Title is required.',
    zh: '请输入标题。',
    ja: 'タイトルを入力してください。',
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
    ja: 'ラベル色は有効な16進カラー（#RRGGBB）である必要があります。',
  },
  'label name is required': {
    ko: '라벨 이름을 입력하세요.',
    en: 'Label name is required.',
    zh: '请输入标签名称。',
    ja: 'ラベル名を入力してください。',
  },
  'label color must be a valid hex color': {
    ko: '라벨 색상은 16진수 색상(#RRGGBB) 형식이어야 합니다.',
    en: 'Label color must be a valid hex color (#RRGGBB).',
    zh: '标签颜色必须是有效的十六进制颜色（#RRGGBB）。',
    ja: 'ラベル色は有効な16進カラー（#RRGGBB）である必要があります。',
  },
  'label name already exists': {
    ko: '같은 이름의 라벨이 이미 존재합니다.',
    en: 'A label with the same name already exists.',
    zh: '同名标签已存在。',
    ja: '同じ名前のラベルがすでに存在します。',
  },
  'label not found': {
    ko: '라벨을 찾을 수 없습니다.',
    en: 'Label not found.',
    zh: '未找到标签。',
    ja: 'ラベルが見つかりません。',
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
  'title must not be empty': {
    ko: '제목은 비워둘 수 없습니다.',
    en: 'Title must not be empty.',
    zh: '标题不能为空。',
    ja: 'タイトルは空にできません。',
  },
  'no valid fields to update': {
    ko: '수정할 항목이 없습니다.',
    en: 'No valid fields to update.',
    zh: '没有可更新的有效字段。',
    ja: '更新できる有効な項目がありません。',
  },
  'status must be one of waiting, active, done': {
    ko: '상태는 대기, 진행중, 완료 중 하나여야 합니다.',
    en: 'Status must be one of waiting, active, done.',
    zh: '状态必须是 waiting、active、done 之一。',
    ja: 'ステータスは waiting / active / done のいずれかである必要があります。',
  },
  'todo not found': {
    ko: '할 일을 찾을 수 없습니다.',
    en: 'Todo not found.',
    zh: '未找到待办事项。',
    ja: 'TODO が見つかりません。',
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
const rolloverSettingLabels = {
  ko: '일정 자동 이월',
  en: 'Schedule rollover',
  zh: 'Schedule rollover',
  ja: 'Schedule rollover',
}

const rolloverTooltipMessages = {
  ko: '일정을 제 시간에 완료하지 못한 경우 그 다음날로 자동 이월됩니다.',
  en: 'If a schedule is not finished on time, it automatically rolls over to the next day.',
  zh: 'If a schedule is not finished on time, it automatically rolls over to the next day.',
  ja: 'If a schedule is not finished on time, it automatically rolls over to the next day.',
}
const TODO_STATUS_WAITING = 'waiting'
const TODO_STATUS_ACTIVE = 'active'
const TODO_STATUS_DONE = 'done'

function normalizeTodoStatus(rawStatus, fallbackDone = false) {
  const normalized = typeof rawStatus === 'string' ? rawStatus.trim().toLowerCase() : ''
  if (normalized === TODO_STATUS_WAITING) return TODO_STATUS_WAITING
  if (normalized === TODO_STATUS_ACTIVE) return TODO_STATUS_ACTIVE
  if (normalized === TODO_STATUS_DONE) return TODO_STATUS_DONE
  return fallbackDone ? TODO_STATUS_DONE : TODO_STATUS_ACTIVE
}

function getTodoStatus(todo) {
  return normalizeTodoStatus(todo?.status, Boolean(todo?.done))
}

function isTodoDone(todo) {
  return getTodoStatus(todo) === TODO_STATUS_DONE
}

function matchesTodoStatusFilter(todo) {
  if (filter.value === TODO_STATUS_WAITING) return getTodoStatus(todo) === TODO_STATUS_WAITING
  if (filter.value === TODO_STATUS_ACTIVE) return getTodoStatus(todo) === TODO_STATUS_ACTIVE
  if (filter.value === TODO_STATUS_DONE) return getTodoStatus(todo) === TODO_STATUS_DONE
  return true
}

function matchesTodoLabelFilter(todo) {
  const selectedLabel = selectedLabelForTodoFilter.value
  if (!selectedLabel) return true
  return String(todo.labelText || '') === String(selectedLabel.name || '')
}

function getTodoTitle(todo) {
  const title = String(todo?.title || '').trim()
  if (title) return title
  return String(todo?.text || '').trim()
}

function getTodoContent(todo) {
  return String(todo?.content || '').trim()
}

function truncateText(value, maxChars) {
  const text = String(value || '').trim()
  const chars = Array.from(text)
  if (chars.length <= maxChars) return text
  return `${chars.slice(0, maxChars).join('')}...`
}

function applyTodoStatusShape(todo) {
  const status = getTodoStatus(todo)
  const title = getTodoTitle(todo)
  const content = getTodoContent(todo)
  return {
    ...todo,
    title,
    content,
    text: title,
    status,
    done: status === TODO_STATUS_DONE,
  }
}

const isAuthenticated = computed(() => Boolean(user.value))
const isDark = computed(() => theme.value === 'dark')
const filteredTodos = computed(() => {
  let subset = todos.value.filter((todo) => matchesTodoStatusFilter(todo) && matchesTodoLabelFilter(todo))

  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return subset

  return subset.filter((todo) => {
    const title = String(getTodoTitle(todo) || '').toLowerCase()
    const content = String(getTodoContent(todo) || '').toLowerCase()
    const location = String(todo.location || '').toLowerCase()
    const label = String(todo.labelText || '').toLowerCase()
    return title.includes(query) || content.includes(query) || location.includes(query) || label.includes(query)
  })
})
const draggableTodos = computed({
  get() {
    return filteredTodos.value
  },
  set(reorderedSubset) {
    if (filter.value === 'all' && !selectedLabelForTodoFilter.value) {
      todos.value = [...reorderedSubset]
      return
    }

    const shouldInclude = (todo) => matchesTodoStatusFilter(todo) && matchesTodoLabelFilter(todo)
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
const summaryTodos = computed(() => todos.value.filter((todo) => matchesTodoLabelFilter(todo)))
const doneCount = computed(() => summaryTodos.value.filter((todo) => isTodoDone(todo)).length)
const completionPercent = computed(() => {
  const total = summaryTodos.value.length
  if (total <= 0) return 0
  return Math.round((doneCount.value / total) * 100)
})
const todayTodoCount = computed(() => {
  const todayKey = toDateKey(new Date())
  return todos.value.filter((todo) => !isTodoDone(todo) && todo.dueAt && toDateKey(todo.dueAt) === todayKey).length
})
const detailTodo = computed(() => todos.value.find((todo) => todo.id === detailTodoId.value) || null)
const todosWithoutDueCount = computed(() => filteredTodos.value.filter((todo) => !todo.dueAt).length)
const calendarMonthLabel = computed(() => {
  const dateLocale = localeCodeByLanguage[locale.value] || 'en-US'
  return new Intl.DateTimeFormat(dateLocale, { year: 'numeric', month: 'long' }).format(calendarMonthAnchor.value)
})
const calendarWeekdayLabels = computed(() => {
  const dateLocale = localeCodeByLanguage[locale.value] || 'en-US'
  const base = new Date(2024, 0, 7) // 2024-01-07? ?쇱슂??
  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(dateLocale, { weekday: 'short' }).format(addDays(base, index))
  )
})
const todosByDate = computed(() => {
  const grouped = new Map()
  for (const todo of filteredTodos.value) {
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
const currentUserInitial = computed(() => {
  const base = String(user.value?.username || user.value?.email || '').trim()
  if (!base) return '?'
  return base.charAt(0).toUpperCase()
})
const currentUserAvatar = computed(() => {
  const raw = String(user.value?.avatarUrl || '').trim()
  return raw || ''
})
const profileAvatarPreview = computed(() => {
  const raw = String(profileAvatarDraft.value || '').trim()
  if (raw) return raw
  return currentUserAvatar.value
})
const labelOptions = computed(() =>
  [...labels.value].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''), localeCodeByLanguage[locale.value] || 'en-US')
  )
)
const selectedLabelForNewTodo = computed(() => {
  if (newTodoLabelId.value === LABEL_NONE_VALUE) return null
  const id = Number(newTodoLabelId.value)
  if (!Number.isFinite(id)) return null
  return labels.value.find((label) => label.id === id) || null
})
const selectedLabelForTodoFilter = computed(() => {
  if (todoLabelFilterId.value === LABEL_FILTER_ALL_VALUE) return null
  const id = Number(todoLabelFilterId.value)
  if (!Number.isFinite(id)) return null
  return labels.value.find((label) => label.id === id) || null
})
const selectedLabelForDetailTodo = computed(() => {
  if (detailTodoLabelId.value === LABEL_NONE_VALUE) return null
  const id = Number(detailTodoLabelId.value)
  if (!Number.isFinite(id)) return null
  return labels.value.find((label) => label.id === id) || null
})
const isAnyModalOpen = computed(() =>
  profileOpen.value ||
  mobileHeaderOpen.value ||
  settingsOpen.value ||
  addTodoOpen.value ||
  addLabelOpen.value ||
  Boolean(detailTodo.value)
)
const rolloverSettingLabel = computed(() => rolloverSettingLabels[locale.value] || rolloverSettingLabels.en)
const rolloverTooltipText = computed(() => rolloverTooltipMessages[locale.value] || rolloverTooltipMessages.en)
const isPushConfigured = computed(() => WEB_PUSH_PUBLIC_KEY.length > 0)
const notificationHelpText = computed(() => {
  if (!notificationSupported.value) return t('notificationUnsupported')
  if (!isPushConfigured.value) return t('notificationNotConfigured')
  if (notificationPermission.value === 'denied') return t('notificationPermissionDenied')
  return notificationEnabled.value ? t('notificationStatusOn') : t('notificationStatusOff')
})

function syncAuthScrollLock() {
  if (typeof document === 'undefined') return
  const shouldLock = !isAuthenticated.value
  document.documentElement.classList.toggle('auth-no-scroll', shouldLock)
  document.body.classList.toggle('auth-no-scroll', shouldLock)
}

function syncModalInteractionLock() {
  if (typeof document === 'undefined') return
  const shouldLock = isAnyModalOpen.value
  document.documentElement.classList.toggle('modal-open-lock', shouldLock)
  document.body.classList.toggle('modal-open-lock', shouldLock)
}

async function syncAppBadge() {
  if (typeof navigator === 'undefined') return
  const canSet = typeof navigator.setAppBadge === 'function'
  const canClear = typeof navigator.clearAppBadge === 'function'
  if (!canSet && !canClear) return

  const nextCount = isAuthenticated.value ? todayTodoCount.value : 0
  try {
    if (nextCount > 0 && canSet) {
      await navigator.setAppBadge(nextCount)
      return
    }
    if (canClear) {
      await navigator.clearAppBadge()
      return
    }
    if (canSet) {
      await navigator.setAppBadge(0)
    }
  } catch {
    // Ignore unsupported badge environments and transient platform failures.
  }
}

function isPushSupported() {
  if (typeof window === 'undefined') return false
  return (
    window.isSecureContext &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  )
}

function decodeVapidKey(key) {
  const base64 = key.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

async function getCurrentPushSubscription() {
  if (!isPushSupported()) return null
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

async function syncPushStatus() {
  notificationSupported.value = isPushSupported()
  if (!notificationSupported.value) {
    notificationPermission.value = 'default'
    notificationEnabled.value = false
    return
  }

  notificationPermission.value = Notification.permission
  try {
    const subscription = await getCurrentPushSubscription()
    notificationEnabled.value = Boolean(subscription)
  } catch {
    notificationEnabled.value = false
  }
}

async function attachSubscriptionToServer(subscription) {
  await apiRequest('/api/notifications/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      subscription,
      locale: navigator.language || localeCodeByLanguage[locale.value] || 'en-US',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      userAgent: navigator.userAgent || '',
    }),
  })
}

async function detachSubscriptionFromServer(endpoint = '') {
  await apiRequest('/api/notifications/subscriptions', {
    method: 'DELETE',
    body: JSON.stringify({ endpoint }),
  })
}

async function syncPushSubscriptionToServer() {
  if (!isAuthenticated.value) return
  if (!isPushSupported()) return
  if (Notification.permission !== 'granted') return
  if (!isPushConfigured.value) return

  const subscription = await getCurrentPushSubscription()
  if (!subscription) return
  await attachSubscriptionToServer(subscription.toJSON())
}

async function enableReminderNotifications() {
  if (notificationBusy.value) return
  notificationBusy.value = true
  errorMessage.value = ''

  try {
    if (!isPushSupported()) throw new Error('push notifications are not supported on this device/browser')
    if (!isPushConfigured.value) throw new Error('web push is not configured on server')

    const permission = await Notification.requestPermission()
    notificationPermission.value = permission
    if (permission !== 'granted') {
      if (permission === 'denied') throw new Error('notification permission denied')
      notificationEnabled.value = false
      return
    }

    const registration = await navigator.serviceWorker.ready
    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidKey(WEB_PUSH_PUBLIC_KEY),
      })
    }

    await attachSubscriptionToServer(subscription.toJSON())
    notificationEnabled.value = true
  } catch (error) {
    errorMessage.value = translateError(error.message || 'notification permission denied')
  } finally {
    notificationBusy.value = false
  }
}

async function disableReminderNotifications() {
  if (notificationBusy.value) return
  notificationBusy.value = true
  errorMessage.value = ''

  try {
    if (!isPushSupported()) return
    const subscription = await getCurrentPushSubscription()
    if (subscription) {
      await detachSubscriptionFromServer(subscription.endpoint)
      await subscription.unsubscribe()
    } else if (isAuthenticated.value) {
      await detachSubscriptionFromServer('')
    }
    notificationEnabled.value = false
  } catch (error) {
    errorMessage.value = translateError(error.message || 'Request failed')
  } finally {
    notificationBusy.value = false
  }
}

function closeRolloverTooltip() {
  rolloverTooltipOpen.value = false
  rolloverTooltipContext.value = ''
  rolloverTooltipStyle.value = {}
}

function getRolloverTooltipTrigger() {
  if (rolloverTooltipContext.value === 'mobile') return mobileRolloverTooltipTriggerRef.value
  if (rolloverTooltipContext.value === 'settings') return settingsRolloverTooltipTriggerRef.value
  return null
}

function positionRolloverTooltip() {
  if (!rolloverTooltipOpen.value) return
  const trigger = getRolloverTooltipTrigger()
  const tooltip = rolloverTooltipRef.value
  if (!trigger || !tooltip) return

  const viewportPadding = 12
  const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
  const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
  const preferredMaxWidth = viewportWidth <= 768 ? 248 : 320
  const hardMaxWidth = Math.min(preferredMaxWidth, viewportWidth - viewportPadding * 2)
  const minWidth = 120
  const triggerRect = trigger.getBoundingClientRect()
  const tooltipRect = tooltip.getBoundingClientRect()
  const naturalWidth = Math.max(tooltip.scrollWidth || 0, tooltipRect.width || 0)
  let width = Math.min(Math.max(160, naturalWidth), hardMaxWidth)

  let left = triggerRect.left + triggerRect.width / 2 - width / 2
  left = Math.max(viewportPadding, Math.min(left, viewportWidth - width - viewportPadding))
  const rightSpace = viewportWidth - left - viewportPadding
  width = Math.min(width, rightSpace)
  width = Math.max(minWidth, width)
  left = Math.max(viewportPadding, Math.min(left, viewportWidth - width - viewportPadding))

  const estimatedHeight = Math.max(tooltip.scrollHeight || 0, tooltipRect.height || 0)

  let top = triggerRect.bottom + 8
  if (top + estimatedHeight > viewportHeight - viewportPadding) {
    top = triggerRect.top - estimatedHeight - 8
  }
  if (top < viewportPadding) top = viewportPadding

  rolloverTooltipStyle.value = {
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`,
    width: `${Math.round(width)}px`,
    maxWidth: `${Math.round(width)}px`,
  }
}

async function toggleRolloverTooltip(context) {
  if (rolloverTooltipOpen.value && rolloverTooltipContext.value === context) {
    closeRolloverTooltip()
    return
  }
  rolloverTooltipContext.value = context
  rolloverTooltipOpen.value = true
  await nextTick()
  positionRolloverTooltip()
}

function handleTooltipViewportChange() {
  if (!rolloverTooltipOpen.value) return
  positionRolloverTooltip()
}

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
    backgroundColor: hexToRgba(color, 0.1),
  }
}

function getLabelDotStyle(todo) {
  return { backgroundColor: normalizeLabelColor(todo.labelColor) }
}

function getLabelDotStyleByColor(color) {
  return { backgroundColor: normalizeLabelColor(color) }
}

function getDetailStateDotStyle(todo, statusOverride = null) {
  const color = normalizeLabelColor(todo?.labelColor, '#94a3b8')
  const status =
    typeof statusOverride === 'string'
      ? normalizeTodoStatus(statusOverride)
      : getTodoStatus(todo)
  if (status === TODO_STATUS_DONE) {
    return {
      borderColor: color,
      backgroundColor: color,
      color: '#ffffff',
    }
  }
  return {
    borderColor: color,
    backgroundColor: 'transparent',
    color,
  }
}

function getTodoItemLabelTextStyle(todo) {
  return { color: normalizeLabelColor(todo?.labelColor, '#64748b') }
}

function onNewTodoLabelChange(value) {
  newTodoLabelId.value = typeof value === 'string' ? value : LABEL_NONE_VALUE
}

function onTodoLabelFilterChange(value) {
  todoLabelFilterId.value = typeof value === 'string' ? value : LABEL_FILTER_ALL_VALUE
}

function onDetailTodoLabelChange(value) {
  detailTodoLabelId.value = typeof value === 'string' ? value : LABEL_NONE_VALUE
}

function findDetailLabelId(todo) {
  if (!todo?.labelText) return LABEL_NONE_VALUE
  const byName = labels.value.find((label) => String(label.name || '') === String(todo.labelText || ''))
  if (!byName) return LABEL_NONE_VALUE
  return String(byName.id)
}

function resolveTextareaElement(target) {
  if (!target) return null
  if (target instanceof HTMLTextAreaElement) return target
  if (Array.isArray(target)) {
    for (const item of target) {
      const resolved = resolveTextareaElement(item)
      if (resolved) return resolved
    }
    return null
  }
  if (target?.$el) return resolveTextareaElement(target.$el)
  if (target instanceof HTMLElement) {
    if (target.tagName === 'TEXTAREA') return target
    const nested = target.querySelector('textarea')
    if (nested instanceof HTMLTextAreaElement) return nested
  }
  return null
}

function resizeTextarea(target) {
  const element = resolveTextareaElement(target)
  if (!element) return
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight}px`
}

function resizeActiveCommentEditTextarea() {
  const textareaFromRef = resolveTextareaElement(commentEditTextareaRef.value)
  if (textareaFromRef) {
    resizeTextarea(textareaFromRef)
    return
  }
  if (typeof document === 'undefined') return
  const fallback = document.querySelector('textarea.comment-edit-textarea')
  if (fallback) resizeTextarea(fallback)
}

function onCommentEditTextareaInput(event) {
  resizeTextarea(event?.target)
}

function moveCalendarMonth(offset) {
  const next = new Date(calendarMonthAnchor.value)
  next.setMonth(next.getMonth() + offset)
  calendarMonthAnchor.value = startOfMonth(next)
}

function goCalendarToday() {
  calendarMonthAnchor.value = startOfMonth(new Date())
}

function normalizeProfileUsername(value) {
  return String(value || '').trim()
}

function clearProfileUsernameCheckResult() {
  profileUsernameCheckMessage.value = ''
  profileUsernameAvailable.value = null
}

function resetProfileDraftFromUser() {
  profileUsernameDraft.value = normalizeProfileUsername(user.value?.username)
  profileAvatarDraft.value = String(user.value?.avatarUrl || '').trim()
  clearProfileUsernameCheckResult()
}

function resetProfileFileInput() {
  const input = profileFileInputRef.value
  if (input) input.value = ''
}

function openProfile() {
  if (!isAuthenticated.value) return
  closeRolloverTooltip()
  settingsOpen.value = false
  mobileHeaderOpen.value = false
  errorMessage.value = ''
  profileOpen.value = true
  profileEditMode.value = false
  resetProfileDraftFromUser()
}

function closeProfile() {
  profileOpen.value = false
  profileEditMode.value = false
  profileBusy.value = false
  profileUsernameCheckBusy.value = false
  clearProfileUsernameCheckResult()
  resetProfileFileInput()
}

function startProfileEdit() {
  if (!isAuthenticated.value) return
  errorMessage.value = ''
  profileEditMode.value = true
  resetProfileDraftFromUser()
}

function cancelProfileEdit() {
  profileEditMode.value = false
  resetProfileDraftFromUser()
  resetProfileFileInput()
}

function onProfileUsernameInput() {
  clearProfileUsernameCheckResult()
}

function openProfileFilePicker() {
  if (!profileEditMode.value) return
  profileFileInputRef.value?.click()
}

function removeProfileImage() {
  if (!profileEditMode.value) return
  profileAvatarDraft.value = ''
  resetProfileFileInput()
}

function handleProfileImageChange(event) {
  if (!profileEditMode.value) return
  const input = event?.target
  const file = input?.files?.[0]
  if (!file) return

  if (!file.type || !file.type.startsWith('image/')) {
    errorMessage.value = translateError('avatarUrl must be a valid image url')
    resetProfileFileInput()
    return
  }

  if (file.size > PROFILE_IMAGE_MAX_UPLOAD_BYTES) {
    errorMessage.value = translateError('avatar image is too large')
    resetProfileFileInput()
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    const result = String(reader.result || '')
    if (!result.startsWith('data:image/')) {
      errorMessage.value = translateError('avatarUrl must be a valid image url')
      resetProfileFileInput()
      return
    }
    if (result.length > PROFILE_IMAGE_MAX_DATA_LENGTH) {
      errorMessage.value = translateError('avatar image is too large')
      resetProfileFileInput()
      return
    }
    profileAvatarDraft.value = result
    errorMessage.value = ''
    resetProfileFileInput()
  }
  reader.onerror = () => {
    errorMessage.value = translateError('avatarUrl must be a valid image url')
    resetProfileFileInput()
  }
  reader.readAsDataURL(file)
}

async function checkProfileUsernameDuplicate() {
  if (!isAuthenticated.value || profileUsernameCheckBusy.value) return
  const username = normalizeProfileUsername(profileUsernameDraft.value)
  if (!username) {
    errorMessage.value = translateError('username is required')
    return
  }
  if (username.length < 2 || username.length > 24) {
    errorMessage.value = translateError('username must be between 2 and 24 characters')
    return
  }

  profileUsernameCheckBusy.value = true
  profileUsernameCheckMessage.value = ''
  errorMessage.value = ''
  try {
    const payload = await apiRequest('/api/auth', {
      method: 'POST',
      body: JSON.stringify({
        action: 'check-username',
        username,
      }),
    })
    profileUsernameAvailable.value = Boolean(payload.available)
    profileUsernameCheckMessage.value = payload.available ? t('usernameAvailable') : t('usernameTaken')
  } catch (error) {
    profileUsernameAvailable.value = null
    errorMessage.value = translateError(error.message)
  } finally {
    profileUsernameCheckBusy.value = false
  }
}

async function saveProfile() {
  if (!isAuthenticated.value || profileBusy.value) return
  const username = normalizeProfileUsername(profileUsernameDraft.value)
  const avatarUrl = String(profileAvatarDraft.value || '').trim()
  if (!username) {
    errorMessage.value = translateError('username is required')
    return
  }
  if (username.length < 2 || username.length > 24) {
    errorMessage.value = translateError('username must be between 2 and 24 characters')
    return
  }
  if (avatarUrl.length > PROFILE_IMAGE_MAX_DATA_LENGTH) {
    errorMessage.value = translateError('avatar image is too large')
    return
  }

  const currentUsername = normalizeProfileUsername(user.value?.username).toLowerCase()
  const changedUsername = username.toLowerCase() !== currentUsername

  profileBusy.value = true
  errorMessage.value = ''
  try {
    if (changedUsername) {
      const check = await apiRequest('/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'check-username',
          username,
        }),
      })
      if (!check.available) {
        profileUsernameAvailable.value = false
        profileUsernameCheckMessage.value = t('usernameTaken')
        return
      }
      profileUsernameAvailable.value = true
      profileUsernameCheckMessage.value = t('usernameAvailable')
    }

    const payload = await apiRequest('/api/auth', {
      method: 'PATCH',
      body: JSON.stringify({
        username,
        avatarUrl,
      }),
    })
    user.value = payload.user
    profileEditMode.value = false
    resetProfileDraftFromUser()
    resetProfileFileInput()
  } catch (error) {
    errorMessage.value = translateError(error.message)
  } finally {
    profileBusy.value = false
  }
}

onMounted(async () => {
  syncAuthScrollLock()
  window.addEventListener('resize', handleTooltipViewportChange)
  window.addEventListener('scroll', handleTooltipViewportChange, true)

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

  const savedRolloverDefault = localStorage.getItem(ROLLOVER_DEFAULT_KEY)
  if (savedRolloverDefault === 'true' || savedRolloverDefault === 'false') {
    defaultRolloverEnabled.value = savedRolloverDefault === 'true'
  } else {
    defaultRolloverEnabled.value = true
    localStorage.setItem(ROLLOVER_DEFAULT_KEY, 'true')
  }
  newRolloverEnabled.value = defaultRolloverEnabled.value

  await loadSessionUser()
  if (user.value) {
    await Promise.all([loadTodos(), loadLabels()])
    await syncPushStatus()
    await syncPushSubscriptionToServer()
  } else {
    await syncPushStatus()
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('auth-no-scroll')
    document.documentElement.classList.remove('modal-open-lock')
    document.body.classList.remove('auth-no-scroll')
    document.body.classList.remove('modal-open-lock')
  }
  window.removeEventListener('resize', handleTooltipViewportChange)
  window.removeEventListener('scroll', handleTooltipViewportChange, true)
})

watch([rolloverTooltipOpen, rolloverTooltipContext], async ([isOpen]) => {
  if (!isOpen) return
  await nextTick()
  positionRolloverTooltip()
})

watch([isAuthenticated, todayTodoCount], () => {
  void syncAppBadge()
}, { immediate: true })

watch(
  isAuthenticated,
  async (authenticated) => {
    syncAuthScrollLock()
    if (authenticated) {
      await syncPushStatus()
      await syncPushSubscriptionToServer()
      return
    }
    await syncPushStatus()
  },
  { immediate: true }
)

watch(
  isAnyModalOpen,
  () => {
    syncModalInteractionLock()
  },
  { immediate: true }
)

watch(rolloverTooltipText, async () => {
  if (!rolloverTooltipOpen.value) return
  await nextTick()
  positionRolloverTooltip()
})

watch(
  editingCommentId,
  async (nextId) => {
    if (nextId === null) return
    await nextTick()
    resizeActiveCommentEditTextarea()
  }
)

watch(
  labelOptions,
  (nextOptions) => {
    if (todoLabelFilterId.value === LABEL_FILTER_ALL_VALUE) return
    const currentId = Number(todoLabelFilterId.value)
    if (!Number.isFinite(currentId) || !nextOptions.some((label) => label.id === currentId)) {
      todoLabelFilterId.value = LABEL_FILTER_ALL_VALUE
    }
  }
)

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

function setDefaultRollover(nextValue) {
  defaultRolloverEnabled.value = Boolean(nextValue)
  localStorage.setItem(ROLLOVER_DEFAULT_KEY, defaultRolloverEnabled.value ? 'true' : 'false')
  if (!addTodoOpen.value) {
    newRolloverEnabled.value = defaultRolloverEnabled.value
  }
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
    await Promise.all([loadTodos(), loadLabels()])
    await syncPushStatus()
    await syncPushSubscriptionToServer()
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
    if (isPushSupported()) {
      try {
        const subscription = await getCurrentPushSubscription()
        if (subscription) {
          await detachSubscriptionFromServer(subscription.endpoint)
        }
      } catch {
        // Ignore local cleanup errors during logout.
      }
    }

    await apiRequest('/api/auth', { method: 'DELETE' })
    user.value = null
    todos.value = []
    labels.value = []
    commentDrafts.value = {}
    detailTodoId.value = null
    detailTodoLabelId.value = LABEL_NONE_VALUE
    newTodoTitle.value = ''
    newTodoContent.value = ''
    newDueAt.value = ''
    newLocation.value = ''
    newTodoLabelId.value = LABEL_NONE_VALUE
    todoLabelFilterId.value = LABEL_FILTER_ALL_VALUE
    searchQuery.value = ''
    addLabelOpen.value = false
    newLabelName.value = ''
    newLabelDraftColor.value = '#64748b'
    newRolloverEnabled.value = defaultRolloverEnabled.value
    addTodoOpen.value = false
    settingsOpen.value = false
    mobileHeaderOpen.value = false
    profileOpen.value = false
    profileEditMode.value = false
    profileBusy.value = false
    profileUsernameDraft.value = ''
    profileAvatarDraft.value = ''
    profileUsernameCheckBusy.value = false
    profileUsernameCheckMessage.value = ''
    profileUsernameAvailable.value = null
    resetProfileFileInput()
    notificationEnabled.value = false
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
    todos.value = (payload.todos || []).map(applyTodoStatusShape)
    for (const todo of todos.value) {
      if (typeof commentDrafts.value[todo.id] !== 'string') commentDrafts.value[todo.id] = ''
    }
  } catch (error) {
    errorMessage.value = translateError(error.message)
  } finally {
    loading.value = false
  }
}

async function loadLabels() {
  if (!isAuthenticated.value) return
  try {
    const payload = await apiRequest('/api/labels')
    labels.value = payload.labels || []
  } catch (error) {
    errorMessage.value = translateError(error.message)
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
  const title = newTodoTitle.value.trim()
  const content = newTodoContent.value.trim()
  if (!title || busy.value) {
    if (!title) errorMessage.value = translateError('title is required')
    return
  }
  const selectedLabel = selectedLabelForNewTodo.value
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
        title,
        content,
        dueAt,
        location: newLocation.value.trim(),
        labelText: selectedLabel?.name || '',
        labelColor: normalizeLabelColor(selectedLabel?.color),
        rolloverEnabled: newRolloverEnabled.value,
        status: TODO_STATUS_ACTIVE,
      }),
    })
    todos.value.unshift(applyTodoStatusShape(payload.todo))
    commentDrafts.value[payload.todo.id] = ''
    newTodoTitle.value = ''
    newTodoContent.value = ''
    newDueAt.value = ''
    newLocation.value = ''
    newTodoLabelId.value = LABEL_NONE_VALUE
    newRolloverEnabled.value = defaultRolloverEnabled.value
    addTodoOpen.value = false
  } catch (error) {
    errorMessage.value = translateError(error.message)
  } finally {
    busy.value = false
  }
}

async function setTodoStatus(todo, status) {
  const nextStatus = normalizeTodoStatus(status)
  const previousStatus = getTodoStatus(todo)
  if (previousStatus === nextStatus) return

  todo.status = nextStatus
  todo.done = nextStatus === TODO_STATUS_DONE
  errorMessage.value = ''
  try {
    await apiRequest('/api/todos', {
      method: 'PATCH',
      body: JSON.stringify({ id: todo.id, status: nextStatus }),
    })

    if (previousStatus !== TODO_STATUS_DONE && nextStatus === TODO_STATUS_DONE) {
      const previousOrder = [...todos.value]
      const moved = moveTodoToBottom(todo.id)
      if (moved) {
        try {
          await apiRequest('/api/todos', {
            method: 'PATCH',
            body: JSON.stringify({ order: todos.value.map((item) => item.id) }),
          })
        } catch (orderError) {
          todos.value = previousOrder
          errorMessage.value = translateError(orderError.message)
        }
      }
    }
  } catch (error) {
    todo.status = previousStatus
    todo.done = previousStatus === TODO_STATUS_DONE
    errorMessage.value = translateError(error.message)
  }
}

function cycleTodoStatus(todo) {
  const current = getTodoStatus(todo)
  const nextStatus =
    current === TODO_STATUS_WAITING
      ? TODO_STATUS_ACTIVE
      : current === TODO_STATUS_ACTIVE
        ? TODO_STATUS_DONE
        : TODO_STATUS_WAITING
  void setTodoStatus(todo, nextStatus)
}

function onTodoStatusSelect(todo, value) {
  if (value !== TODO_STATUS_WAITING && value !== TODO_STATUS_ACTIVE && value !== TODO_STATUS_DONE) return
  void setTodoStatus(todo, value)
}

function moveTodoToBottom(todoId) {
  const index = todos.value.findIndex((item) => item.id === todoId)
  if (index < 0 || index >= todos.value.length - 1) return false
  const next = [...todos.value]
  const [target] = next.splice(index, 1)
  next.push(target)
  todos.value = next
  return true
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

async function startDetailEdit() {
  const target = detailTodo.value
  if (!target) return
  if (labels.value.length === 0) {
    await loadLabels()
  }
  detailEditMode.value = true
  detailTitleDraft.value = getTodoTitle(target)
  detailContentDraft.value = getTodoContent(target)
  detailDueAtDraft.value = target.dueAt || ''
  detailLocationDraft.value = target.location || ''
  detailTodoLabelId.value = findDetailLabelId(target)
  detailRolloverDraft.value = Boolean(target.rolloverEnabled)
}

function cancelDetailEdit() {
  detailEditMode.value = false
  const target = detailTodo.value
  detailTitleDraft.value = getTodoTitle(target)
  detailContentDraft.value = getTodoContent(target)
  detailDueAtDraft.value = target?.dueAt || ''
  detailLocationDraft.value = target?.location || ''
  detailTodoLabelId.value = findDetailLabelId(target)
  detailRolloverDraft.value = Boolean(target?.rolloverEnabled)
}

async function saveDetailEdit() {
  const target = detailTodo.value
  if (!target || busy.value) return
  const nextTitle = detailTitleDraft.value.trim()
  if (!nextTitle) {
    errorMessage.value = translateError('title must not be empty')
    return
  }
  const nextContent = detailContentDraft.value.trim()
  const selectedLabel = selectedLabelForDetailTodo.value
  const nextLabelText = selectedLabel?.name || ''
  const nextLabelColor = normalizeLabelColor(selectedLabel?.color)
  busy.value = true
  errorMessage.value = ''
  const previous = {
    title: getTodoTitle(target),
    content: getTodoContent(target),
    dueAt: target.dueAt || '',
    location: target.location || '',
    labelText: target.labelText || '',
    labelColor: normalizeLabelColor(target.labelColor),
    rolloverEnabled: Boolean(target.rolloverEnabled),
  }

  target.title = nextTitle
  target.text = nextTitle
  target.content = nextContent
  target.dueAt = detailDueAtDraft.value || null
  target.location = detailLocationDraft.value.trim()
  target.labelText = nextLabelText
  target.labelColor = nextLabelColor
  target.rolloverEnabled = detailRolloverDraft.value

  try {
    await apiRequest('/api/todos', {
      method: 'PATCH',
      body: JSON.stringify({
        id: target.id,
        title: nextTitle,
        content: nextContent,
        dueAt: detailDueAtDraft.value || null,
        location: detailLocationDraft.value,
        labelText: nextLabelText,
        labelColor: nextLabelColor,
        rolloverEnabled: detailRolloverDraft.value,
      }),
    })
    detailEditMode.value = false
  } catch (error) {
    target.title = previous.title
    target.text = previous.title
    target.content = previous.content
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
  commentEditDraft.value = comment.text
  editingCommentId.value = comment.id
  nextTick(() => resizeActiveCommentEditTextarea())
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
  detailTitleDraft.value = getTodoTitle(target)
  detailContentDraft.value = getTodoContent(target)
  detailDueAtDraft.value = target?.dueAt || ''
  detailLocationDraft.value = target?.location || ''
  detailTodoLabelId.value = findDetailLabelId(target)
  detailRolloverDraft.value = Boolean(target?.rolloverEnabled)
  editingCommentId.value = null
  commentEditDraft.value = ''
}

async function openSettings() {
  closeRolloverTooltip()
  profileOpen.value = false
  profileEditMode.value = false
  settingsOpen.value = true
  await syncPushStatus()
  if (isAuthenticated.value) {
    await syncPushSubscriptionToServer()
  }
}

function closeSettings() {
  closeRolloverTooltip()
  settingsOpen.value = false
}

function openMobileHeader() {
  closeRolloverTooltip()
  profileOpen.value = false
  profileEditMode.value = false
  mobileHeaderOpen.value = true
}

function closeMobileHeader() {
  closeRolloverTooltip()
  mobileHeaderOpen.value = false
}

async function logoutFromMobile() {
  closeMobileHeader()
  await logout()
}

function openAddLabel() {
  if (!isAuthenticated.value) return
  errorMessage.value = ''
  newLabelName.value = ''
  newLabelDraftColor.value = '#64748b'
  editingLabelId.value = null
  editLabelName.value = ''
  editLabelColor.value = '#64748b'
  addLabelOpen.value = true
}

function closeAddLabel() {
  addLabelOpen.value = false
  editingLabelId.value = null
}

async function createLabel() {
  if (labelBusy.value) return
  const name = newLabelName.value.trim()
  if (!name) {
    errorMessage.value = translateError('label name is required')
    return
  }
  if (!isValidLabelColor(newLabelDraftColor.value)) {
    errorMessage.value = translateError('label color must be a valid hex color')
    return
  }

  labelBusy.value = true
  errorMessage.value = ''
  try {
    const payload = await apiRequest('/api/labels', {
      method: 'POST',
      body: JSON.stringify({
        name,
        color: normalizeLabelColor(newLabelDraftColor.value),
      }),
    })
    const next = payload.label
    labels.value = [next, ...labels.value.filter((item) => item.id !== next.id)]
    newTodoLabelId.value = String(next.id)
    if (detailEditMode.value) detailTodoLabelId.value = String(next.id)
    newLabelName.value = ''
    newLabelDraftColor.value = '#64748b'
  } catch (error) {
    errorMessage.value = translateError(error.message)
  } finally {
    labelBusy.value = false
  }
}

function startLabelEdit(label) {
  editingLabelId.value = label.id
  editLabelName.value = label.name
  editLabelColor.value = normalizeLabelColor(label.color)
}

function cancelLabelEdit() {
  editingLabelId.value = null
  editLabelName.value = ''
  editLabelColor.value = '#64748b'
}

async function saveLabelEdit(labelId) {
  if (labelBusy.value) return
  const target = labels.value.find((item) => item.id === labelId)
  if (!target) {
    errorMessage.value = translateError('label not found')
    return
  }

  const name = editLabelName.value.trim()
  const color = normalizeLabelColor(editLabelColor.value)
  if (!name) {
    errorMessage.value = translateError('label name is required')
    return
  }
  if (!isValidLabelColor(editLabelColor.value)) {
    errorMessage.value = translateError('label color must be a valid hex color')
    return
  }

  labelBusy.value = true
  errorMessage.value = ''
  try {
    const payload = await apiRequest('/api/labels', {
      method: 'PATCH',
      body: JSON.stringify({ id: labelId, name, color }),
    })
    const updated = payload.label
    const previousName = payload.previousName || target.name
    labels.value = labels.value.map((item) => (item.id === updated.id ? updated : item))
    todos.value = todos.value.map((todo) =>
      todo.labelText === previousName
        ? {
            ...todo,
            labelText: updated.name,
            labelColor: updated.color,
          }
        : todo
    )
    cancelLabelEdit()
  } catch (error) {
    errorMessage.value = translateError(error.message)
  } finally {
    labelBusy.value = false
  }
}

function openAddTodo() {
  if (!isAuthenticated.value) return
  errorMessage.value = ''
  newRolloverEnabled.value = defaultRolloverEnabled.value
  if (labels.value.length === 0) {
    void loadLabels()
  }
  addTodoOpen.value = true
}

function closeAddTodo() {
  addTodoOpen.value = false
  addLabelOpen.value = false
}

function closeDetail() {
  detailTodoId.value = null
  detailEditMode.value = false
  detailTitleDraft.value = ''
  detailContentDraft.value = ''
  detailTodoLabelId.value = LABEL_NONE_VALUE
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

function formatMonthDay(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}.${day}`
}

function formatTodoItemDue(value) {
  const monthDay = formatMonthDay(value)
  const time = formatTime(value)
  if (!monthDay) return time
  if (!time) return monthDay
  return `${monthDay} ${time}`
}
</script>

<template>
  <main class="page" :class="{ 'page--auth': !isAuthenticated }">
    <div
      :inert="isAnyModalOpen"
      :aria-hidden="isAnyModalOpen ? 'true' : null"
      :class="{ 'app-shell--modal-lock': isAnyModalOpen }"
    >
      <Card
        class="w-full max-w-none rounded-none border-0 bg-transparent shadow-none"
      >
        <CardContent :class="isAuthenticated ? 'todo-card-content space-y-4 px-3 pb-3 pt-3' : 'auth-card-content'">
        <section
          v-if="!isAuthenticated"
          class="auth-centered mx-auto max-w-md space-y-4 rounded-none border-0 bg-transparent p-0"
        >
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
          <div class="todo-layout">
            <header class="todo-topbar">
              <div class="todo-brand">
                <img src="/todogram-icon-20260214-glyph-192.png" alt="Todogram icon" class="todo-brand-icon" />
                <p class="todo-brand-name">To-Do List</p>
              </div>
              <div class="todo-top-actions">
                <Button
                  size="sm"
                  class="todo-top-icon-btn"
                  :variant="viewMode === 'list' ? 'secondary' : 'ghost'"
                  @click="viewMode = 'list'"
                  :aria-label="t('listView')"
                >
                  <List class="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  class="todo-top-icon-btn"
                  :variant="viewMode === 'calendar' ? 'secondary' : 'ghost'"
                  @click="viewMode = 'calendar'"
                  :aria-label="t('calendarView')"
                >
                  <CalendarDays class="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  class="todo-top-icon-btn todo-user-trigger"
                  @click="openProfile"
                  :aria-label="t('profileTitle')"
                >
                  <img
                    v-if="currentUserAvatar"
                    :src="currentUserAvatar"
                    alt=""
                    class="todo-top-user-avatar"
                  />
                  <span v-else class="todo-top-user-fallback">
                    <UserRound class="h-4 w-4" />
                  </span>
                </Button>
                <Button size="sm" variant="ghost" class="todo-top-icon-btn" @click="openMobileHeader" aria-label="open menu">
                  <Menu class="h-4 w-4" />
                </Button>
              </div>
            </header>

            <p v-if="loading" class="text-sm text-muted-foreground">{{ t('loading') }}</p>

            <div class="todo-search-row">
              <div class="todo-searchbar">
                <Search class="todo-search-icon" />
                <Input
                  v-model="searchQuery"
                  type="text"
                  class="todo-search-input border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  :placeholder="t('searchPlaceholder')"
                  autocomplete="off"
                />
              </div>
              <Button
                class="todo-add-task-btn"
                variant="ghost"
                @click="openAddTodo"
                :aria-label="t('addSchedule')"
              >
                <Plus class="h-5 w-5" />
                {{ t('addSchedule') }}
              </Button>
            </div>

            <section class="todo-summary-panel">
              <div class="todo-summary-head">
                <div class="todo-summary-filter">
                  <Select :model-value="todoLabelFilterId" @update:model-value="onTodoLabelFilterChange">
                    <SelectTrigger class="todo-summary-filter-trigger">
                      <SelectValue :placeholder="t('allLabels')" />
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectItem :value="LABEL_FILTER_ALL_VALUE">{{ t('allLabels') }}</SelectItem>
                      <SelectItem v-for="label in labelOptions" :key="label.id" :value="String(label.id)">
                        <span class="label-option-item">
                          <span class="todo-label-dot" :style="getLabelDotStyleByColor(label.color)"></span>
                          {{ label.name }}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="todo-summary-right">
                  <div class="todo-progress-row">
                    <span>{{ doneCount }} / {{ summaryTodos.length }} {{ t('done') }}</span>
                    <div class="todo-progress-track">
                      <div class="todo-progress-fill" :style="{ width: `${completionPercent}%` }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <nav class="todo-bottom-tabs">
              <Button
                size="sm"
                class="todo-tab-btn"
                :variant="filter === 'all' ? 'default' : 'ghost'"
                @click="filter = 'all'"
                :disabled="busy"
              >
                {{ t('all') }}
              </Button>
              <Button
                size="sm"
                class="todo-tab-btn"
                :variant="filter === 'waiting' ? 'default' : 'ghost'"
                @click="filter = 'waiting'"
                :disabled="busy"
              >
                {{ t('waiting') }}
              </Button>
              <Button
                size="sm"
                class="todo-tab-btn"
                :variant="filter === 'active' ? 'default' : 'ghost'"
                @click="filter = 'active'"
                :disabled="busy"
              >
                {{ t('active') }}
              </Button>
              <Button
                size="sm"
                class="todo-tab-btn"
                :variant="filter === 'done' ? 'default' : 'ghost'"
                @click="filter = 'done'"
                :disabled="busy"
              >
                {{ t('done') }}
              </Button>
            </nav>

            <template v-if="viewMode === 'list'">
              <draggable
                v-model="draggableTodos"
                tag="ul"
                class="todo-list todo-list--panel"
                item-key="id"
                handle=".todo-item-drag-space"
                :animation="180"
                :delay="140"
                :delay-on-touch-only="true"
                :touch-start-threshold="4"
                :fallback-tolerance="8"
                :force-fallback="true"
                :fallback-on-body="true"
                :disabled="busy || searchQuery.trim().length > 0"
                ghost-class="drag-ghost"
                chosen-class="drag-chosen"
                @end="onDragEnd"
              >
                <template #item="{ element: todo }">
                  <li class="todo-item-row">
                    <div class="todo-item-main">
                      <Select
                        :model-value="getTodoStatus(todo)"
                        @update:model-value="(value) => onTodoStatusSelect(todo, value)"
                      >
                        <SelectTrigger class="todo-item-state-trigger no-drag" :aria-label="t('status')">
                          <span class="todo-item-state-dot" :style="getDetailStateDotStyle(todo)">
                            <Check v-if="isTodoDone(todo)" class="h-3 w-3" />
                            <Play
                              v-else-if="getTodoStatus(todo) === TODO_STATUS_ACTIVE"
                              class="h-3 w-3 fill-current"
                            />
                            <Pause v-else class="h-3 w-3" />
                          </span>
                        </SelectTrigger>
                        <SelectContent class="todo-item-state-content" side="bottom" align="start">
                          <SelectItem :value="TODO_STATUS_WAITING" :text-value="t('waiting')" class="todo-item-state-option no-drag">
                            <span class="todo-item-state-dot" :style="getDetailStateDotStyle(todo, TODO_STATUS_WAITING)" aria-hidden="true">
                              <Pause class="h-3 w-3" />
                            </span>
                            <span class="sr-only">{{ t('waiting') }}</span>
                          </SelectItem>
                          <SelectItem :value="TODO_STATUS_ACTIVE" :text-value="t('active')" class="todo-item-state-option no-drag">
                            <span class="todo-item-state-dot" :style="getDetailStateDotStyle(todo, TODO_STATUS_ACTIVE)" aria-hidden="true">
                              <Play class="h-3 w-3 fill-current" />
                            </span>
                            <span class="sr-only">{{ t('active') }}</span>
                          </SelectItem>
                          <SelectItem :value="TODO_STATUS_DONE" :text-value="t('done')" class="todo-item-state-option no-drag">
                            <span class="todo-item-state-dot" :style="getDetailStateDotStyle(todo, TODO_STATUS_DONE)" aria-hidden="true">
                              <Check class="h-3 w-3" />
                            </span>
                            <span class="sr-only">{{ t('done') }}</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <div class="todo-item-body">
                        <button
                          type="button"
                          class="todo-item-title-btn no-drag"
                          :class="{ 'todo-item-title-btn--done': isTodoDone(todo) }"
                          :title="getTodoTitle(todo)"
                          @click="openDetail(todo.id)"
                        >
                          {{ getTodoTitle(todo) }}
                        </button>
                        <p v-if="getTodoContent(todo)" class="todo-item-content" :title="getTodoContent(todo)">
                          {{ truncateText(getTodoContent(todo), 54) }}
                        </p>
                        <div class="todo-item-meta">
                          <span v-if="todo.dueAt" class="todo-item-meta-due">{{ formatTodoItemDue(todo.dueAt) }}</span>
                          <span
                            v-if="todo.labelText"
                            class="todo-item-meta-text todo-item-meta-label"
                            :style="getTodoItemLabelTextStyle(todo)"
                          >
                            {{ todo.labelText }}
                          </span>
                          <span class="todo-item-meta-text">{{ t(getTodoStatus(todo)) }}</span>
                          <span class="todo-item-meta-text">{{ t('comment') }} {{ todo.comments.length }}</span>
                          <span v-if="todo.location" class="todo-item-meta-text todo-item-meta-location">
                            {{ truncateText(todo.location, 16) }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="todo-item-drag-space" aria-hidden="true"></div>
                  </li>
                </template>
              </draggable>

              <p v-if="!loading && filteredTodos.length === 0" class="text-sm text-muted-foreground">
                {{ t('noItems') }}
              </p>
            </template>

            <section v-else class="todo-calendar-shell">
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
                        :class="{ 'calendar-item--done': isTodoDone(todo) }"
                        :style="getCalendarItemStyle(todo)"
                        @click="openDetail(todo.id)"
                      >
                        <span class="calendar-item-main" :title="getTodoTitle(todo)">
                          {{ truncateText(getTodoTitle(todo), 7) }}
                        </span>
                      </button>
                    </li>
                    <li v-if="cell.items.length > 3" class="calendar-more">+{{ cell.items.length - 3 }}</li>
                  </ul>
                </li>
              </ul>

              <p class="text-xs text-muted-foreground">{{ t('calendarNoDue', { count: todosWithoutDueCount }) }}</p>
            </section>
          </div>
        </template>

        <p v-if="errorMessage" class="text-sm font-semibold text-rose-600">{{ errorMessage }}</p>
        </CardContent>
      </Card>
    </div>

    <section v-if="profileOpen && isAuthenticated" class="modal-wrap" @click.self="closeProfile">
      <article class="modal profile-modal">
        <Button
          variant="ghost"
          size="sm"
          class="modal-close"
          @click="closeProfile"
          :aria-label="t('close')"
        >
          <X class="h-4 w-4" />
        </Button>
        <header class="modal-header">
          <h2>{{ t('profileTitle') }}</h2>
        </header>

        <div class="profile-shell">
          <div class="profile-avatar-section">
            <div class="profile-avatar-preview">
              <img
                v-if="profileAvatarPreview"
                :src="profileAvatarPreview"
                alt=""
                class="profile-avatar-image"
              />
              <span v-else class="profile-avatar-fallback">{{ currentUserInitial }}</span>
            </div>
            <input
              ref="profileFileInputRef"
              type="file"
              accept="image/*"
              class="profile-file-input"
              @change="handleProfileImageChange"
            />
            <div v-if="profileEditMode" class="profile-avatar-actions">
              <Button type="button" variant="outline" size="sm" @click="openProfileFilePicker">
                {{ t('changeImage') }}
              </Button>
              <Button type="button" variant="outline" size="sm" @click="removeProfileImage">
                {{ t('removeImage') }}
              </Button>
            </div>
          </div>

          <div class="profile-fields">
            <div class="space-y-1">
              <p class="text-xs text-muted-foreground">{{ t('profileUsername') }}</p>
              <Input
                v-if="profileEditMode"
                v-model="profileUsernameDraft"
                type="text"
                maxlength="24"
                autocomplete="nickname"
                @input="onProfileUsernameInput"
              />
              <p v-else class="profile-value">{{ user?.username || '-' }}</p>
            </div>

            <div v-if="profileEditMode" class="profile-check-row">
              <Button
                type="button"
                size="sm"
                variant="outline"
                :disabled="profileUsernameCheckBusy || profileBusy"
                @click="checkProfileUsernameDuplicate"
              >
                {{ t('checkDuplicate') }}
              </Button>
              <p
                v-if="profileUsernameCheckMessage"
                class="profile-check-message"
                :class="{
                  'profile-check-message--ok': profileUsernameAvailable === true,
                  'profile-check-message--error': profileUsernameAvailable === false,
                }"
              >
                {{ profileUsernameCheckMessage }}
              </p>
            </div>

            <div class="space-y-1">
              <p class="text-xs text-muted-foreground">{{ t('profileEmail') }}</p>
              <p class="profile-value">{{ user?.email || '-' }}</p>
            </div>
          </div>
        </div>

        <div class="profile-actions">
          <template v-if="profileEditMode">
            <Button type="button" variant="outline" @click="cancelProfileEdit">
              {{ t('cancel') }}
            </Button>
            <Button type="button" :disabled="profileBusy || profileUsernameCheckBusy" @click="saveProfile">
              {{ t('save') }}
            </Button>
          </template>
          <Button v-else type="button" @click="startProfileEdit">
            {{ t('edit') }}
          </Button>
        </div>
      </article>
    </section>

    <section v-if="mobileHeaderOpen" class="modal-wrap" @click.self="closeMobileHeader">
      <article class="modal modal--allow-overflow settings-modal mobile-menu-modal">
        <Button
          variant="ghost"
          size="sm"
          class="modal-close"
          @click="closeMobileHeader"
          :aria-label="t('close')"
        >
          <X class="h-4 w-4" />
        </Button>
        <header class="modal-header">
          <h2>{{ t('appTitle') }}</h2>
        </header>

        <div class="grid min-h-[380px] gap-3 text-xs text-muted-foreground">
          <div class="space-y-1">
            <p class="text-sm text-muted-foreground">{{ t('theme') }}</p>
            <div class="inline-flex w-full rounded-lg border bg-background p-1">
              <Button class="flex-1 text-sm" :variant="isDark ? 'ghost' : 'default'" @click="setTheme('light')">
                <Sun class="mr-1 h-4 w-4" />
                {{ t('lightMode') }}
              </Button>
              <Button class="flex-1 text-sm" :variant="isDark ? 'default' : 'ghost'" @click="setTheme('dark')">
                <Moon class="mr-1 h-4 w-4" />
                {{ t('darkMode') }}
              </Button>
            </div>
          </div>

          <div class="space-y-1">
            <p class="text-sm text-muted-foreground">{{ t('language') }}</p>
            <Select :model-value="locale" @update:model-value="setLocale">
              <SelectTrigger class="w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in languageOptions" :key="option.code" :value="option.code">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1">
            <div class="flex items-center gap-1.5">
              <p class="text-sm text-muted-foreground">{{ rolloverSettingLabel }}</p>
              <div class="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  ref="mobileRolloverTooltipTriggerRef"
                  class="h-7 w-7 rounded-full p-0 text-muted-foreground"
                  :aria-label="rolloverTooltipText"
                  @click.stop="toggleRolloverTooltip('mobile')"
                >
                  <CircleHelp class="h-4 w-4" />
                </Button>
                <div
                  v-if="rolloverTooltipOpen && rolloverTooltipContext === 'mobile'"
                  ref="rolloverTooltipRef"
                  :style="rolloverTooltipStyle"
                  class="settings-tooltip rounded-md border bg-popover px-3 py-2 text-xs leading-relaxed text-popover-foreground shadow-lg"
                >
                  {{ rolloverTooltipText }}
                </div>
              </div>
            </div>
            <div class="inline-flex w-full rounded-lg border bg-background p-1">
              <Button class="flex-1 text-sm" :variant="defaultRolloverEnabled ? 'default' : 'ghost'" @click="setDefaultRollover(true)">
                true
              </Button>
              <Button class="flex-1 text-sm" :variant="defaultRolloverEnabled ? 'ghost' : 'default'" @click="setDefaultRollover(false)">
                false
              </Button>
            </div>
          </div>

          <Button
            v-if="isAuthenticated"
            variant="ghost"
            size="sm"
            class="mt-auto ml-auto justify-center gap-2 rounded-full border-0 bg-muted/40 px-3 shadow-none"
            @click="logoutFromMobile"
            :disabled="authBusy"
          >
            <LogOut class="h-4 w-4" />
            {{ t('logout') }}
          </Button>
        </div>
      </article>
    </section>
    <section v-if="settingsOpen" class="modal-wrap" @click.self="closeSettings">
      <article class="modal modal--allow-overflow settings-modal">
        <Button
          variant="ghost"
          size="sm"
          class="modal-close"
          @click="closeSettings"
          :aria-label="t('close')"
        >
          <X class="h-4 w-4" />
        </Button>
        <header class="modal-header">
          <h2>{{ t('settingsTitle') }}</h2>
        </header>

        <div class="grid gap-3">
          <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] sm:items-center sm:gap-3">
            <p class="text-sm text-muted-foreground sm:text-base">{{ t('theme') }}</p>
            <div class="inline-flex w-full rounded-lg border bg-background p-1">
              <Button class="flex-1 text-sm sm:text-base" :variant="isDark ? 'ghost' : 'default'" @click="setTheme('light')">
                <Sun class="mr-1 h-4 w-4" />
                {{ t('lightMode') }}
              </Button>
              <Button class="flex-1 text-sm sm:text-base" :variant="isDark ? 'default' : 'ghost'" @click="setTheme('dark')">
                <Moon class="mr-1 h-4 w-4" />
                {{ t('darkMode') }}
              </Button>
            </div>
          </div>

          <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] sm:items-center sm:gap-3">
            <p class="text-sm text-muted-foreground sm:text-base">{{ t('language') }}</p>
            <Select :model-value="locale" @update:model-value="setLocale">
              <SelectTrigger class="w-full text-sm sm:text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in languageOptions" :key="option.code" :value="option.code">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] sm:items-center sm:gap-3">
            <div class="flex items-center gap-1.5">
              <p class="text-sm text-muted-foreground sm:text-base">{{ rolloverSettingLabel }}</p>
              <div class="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  ref="settingsRolloverTooltipTriggerRef"
                  class="h-7 w-7 rounded-full p-0 text-muted-foreground"
                  :aria-label="rolloverTooltipText"
                  @click.stop="toggleRolloverTooltip('settings')"
                >
                  <CircleHelp class="h-4 w-4" />
                </Button>
                <div
                  v-if="rolloverTooltipOpen && rolloverTooltipContext === 'settings'"
                  ref="rolloverTooltipRef"
                  :style="rolloverTooltipStyle"
                  class="settings-tooltip rounded-md border bg-popover px-3 py-2 text-xs leading-relaxed text-popover-foreground shadow-lg"
                >
                  {{ rolloverTooltipText }}
                </div>
              </div>
            </div>
            <div class="inline-flex w-full rounded-lg border bg-background p-1">
              <Button
                class="flex-1 text-sm sm:text-base"
                :variant="defaultRolloverEnabled ? 'default' : 'ghost'"
                @click="setDefaultRollover(true)"
              >
                true
              </Button>
              <Button
                class="flex-1 text-sm sm:text-base"
                :variant="defaultRolloverEnabled ? 'ghost' : 'default'"
                @click="setDefaultRollover(false)"
              >
                false
              </Button>
            </div>
          </div>

          <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] sm:items-center sm:gap-3">
            <div class="grid gap-1">
              <p class="text-sm text-muted-foreground sm:text-base">{{ t('notificationReminder30m') }}</p>
              <p class="text-xs text-muted-foreground">{{ notificationHelpText }}</p>
            </div>
            <div class="inline-flex w-full rounded-lg border bg-background p-1">
              <Button
                class="flex-1 text-sm sm:text-base"
                :variant="notificationEnabled ? 'default' : 'ghost'"
                :disabled="notificationBusy || !isAuthenticated || !notificationSupported || !isPushConfigured || notificationPermission === 'denied'"
                @click="enableReminderNotifications"
              >
                {{ t('notificationEnableAction') }}
              </Button>
              <Button
                class="flex-1 text-sm sm:text-base"
                :variant="notificationEnabled ? 'ghost' : 'default'"
                :disabled="notificationBusy || !isAuthenticated || !notificationSupported || !notificationEnabled"
                @click="disableReminderNotifications"
              >
                {{ t('notificationDisableAction') }}
              </Button>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section v-if="addTodoOpen && isAuthenticated" class="modal-wrap" @click.self="closeAddTodo">
      <article class="modal settings-modal">
        <Button
          variant="ghost"
          size="sm"
          class="modal-close"
          @click="closeAddTodo"
          :aria-label="t('close')"
        >
          <X class="h-4 w-4" />
        </Button>
        <header class="modal-header">
          <h2>{{ t('addScheduleTitle') }}</h2>
        </header>

        <form class="space-y-2" @submit.prevent="addTodo">
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground">{{ t('todoTitle') }}</p>
            <Input
              v-model="newTodoTitle"
              class="w-full"
              type="text"
              :placeholder="t('todoTitlePlaceholder')"
              autocomplete="off"
            />
          </div>
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground">{{ t('todoContent') }}</p>
            <Textarea
              v-model="newTodoContent"
              class="w-full min-h-[120px]"
              :placeholder="t('todoContentPlaceholder')"
            />
          </div>
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
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground">{{ t('label') }}</p>
            <div v-if="labelOptions.length > 0" class="label-select-row">
              <Select :model-value="newTodoLabelId" @update:model-value="onNewTodoLabelChange">
                <SelectTrigger class="w-full">
                  <SelectValue :placeholder="t('labelSelectPrompt')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="LABEL_NONE_VALUE">{{ t('labelSelectPrompt') }}</SelectItem>
                  <SelectItem v-for="label in labelOptions" :key="label.id" :value="String(label.id)">
                    <span class="label-option-item">
                      <span class="todo-label-dot" :style="getLabelDotStyleByColor(label.color)" />
                      {{ label.name }}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" @click="openAddLabel">{{ t('labelSettings') }}</Button>
            </div>
            <Button v-else class="w-full" type="button" variant="outline" @click="openAddLabel">{{ t('labelSettings') }}</Button>
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

    <section v-if="addLabelOpen && isAuthenticated" class="modal-wrap" @click.self="closeAddLabel">
      <article class="modal settings-modal">
        <Button
          variant="ghost"
          size="sm"
          class="modal-close"
          @click="closeAddLabel"
          :aria-label="t('close')"
        >
          <X class="h-4 w-4" />
        </Button>
        <header class="modal-header">
          <h2>{{ t('labelSettings') }}</h2>
        </header>

        <form class="space-y-2" @submit.prevent="createLabel">
          <p class="text-sm font-medium">{{ t('labelAdd') }}</p>
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground">{{ t('label') }}</p>
            <Input
              v-model="newLabelName"
              class="w-full"
              type="text"
              :placeholder="t('labelNameInputPlaceholder')"
              autocomplete="off"
            />
          </div>
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground">{{ t('labelColor') }}</p>
            <div class="label-color-field">
              <input v-model="newLabelDraftColor" class="label-color-input" type="color" />
              <Input v-model="newLabelDraftColor" class="label-color-code" type="text" inputmode="text" />
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <Button type="button" variant="outline" @click="closeAddLabel">{{ t('cancel') }}</Button>
            <Button type="submit" :disabled="labelBusy">{{ t('save') }}</Button>
          </div>
        </form>

        <div class="space-y-2">
          <p class="text-sm font-medium">{{ t('labelSavedList') }}</p>
          <ul v-if="labelOptions.length > 0" class="label-manage-list">
            <li v-for="label in labelOptions" :key="label.id">
              <template v-if="editingLabelId === label.id">
                <div class="space-y-2">
                  <Input v-model="editLabelName" type="text" />
                  <div class="label-color-field">
                    <input v-model="editLabelColor" class="label-color-input" type="color" />
                    <Input v-model="editLabelColor" class="label-color-code" type="text" inputmode="text" />
                  </div>
                  <div class="flex justify-end gap-2">
                    <Button size="sm" @click="saveLabelEdit(label.id)" :disabled="labelBusy">{{ t('save') }}</Button>
                    <Button variant="outline" size="sm" @click="cancelLabelEdit">{{ t('cancel') }}</Button>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="label-manage-row">
                  <span class="todo-label-badge" :style="{ borderColor: normalizeLabelColor(label.color), color: normalizeLabelColor(label.color), backgroundColor: hexToRgba(label.color, 0.14) }">
                    <span class="todo-label-dot" :style="getLabelDotStyleByColor(label.color)" />
                    {{ label.name }}
                  </span>
                  <Button variant="outline" size="sm" @click="startLabelEdit(label)">{{ t('edit') }}</Button>
                </div>
              </template>
            </li>
          </ul>
          <p v-else class="text-xs text-muted-foreground">{{ t('labelEmpty') }}</p>
        </div>
      </article>
    </section>

    <section v-if="detailTodo" class="modal-wrap" @click.self="closeDetail">
      <article class="modal detail-modal">
        <Button
          variant="ghost"
          size="sm"
          class="modal-close detail-close-btn"
          @click="closeDetail"
          :aria-label="t('close')"
        >
          <X class="h-4 w-4" />
        </Button>

        <div class="detail-shell">
          <div class="detail-breadcrumb">
            <List class="h-3.5 w-3.5" />
            <span>{{ t('listView') }}</span>
            <span class="detail-breadcrumb-sep">›</span>
            <span class="detail-breadcrumb-current">{{ t('detail') }}</span>
          </div>

          <header class="detail-header">
            <div class="detail-title-wrap">
              <span class="detail-state-dot" :style="getDetailStateDotStyle(detailTodo)">
                <Check v-if="isTodoDone(detailTodo)" class="h-3 w-3" />
                <Play v-else-if="getTodoStatus(detailTodo) === TODO_STATUS_ACTIVE" class="h-3 w-3 fill-current" />
                <Pause v-else class="h-3 w-3" />
              </span>
              <div v-if="!detailEditMode" class="detail-title-copy">
                <h2>{{ getTodoTitle(detailTodo) }}</h2>
                <p class="detail-title-sub">{{ t(getTodoStatus(detailTodo)) }}</p>
              </div>
            </div>

            <div class="detail-toolbar">
              <template v-if="detailEditMode">
                <Button
                  size="sm"
                  variant="ghost"
                  class="detail-icon-btn"
                  :aria-label="t('save')"
                  :disabled="busy"
                  @click="saveDetailEdit"
                >
                  <Check class="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  class="detail-icon-btn"
                  :aria-label="t('cancel')"
                  @click="cancelDetailEdit"
                >
                  <X class="h-4 w-4" />
                </Button>
              </template>
              <Button
                v-else
                variant="ghost"
                size="sm"
                class="detail-icon-btn"
                :aria-label="t('edit')"
                @click="startDetailEdit"
              >
                <Pencil class="h-4 w-4" />
              </Button>
              <Button
                v-if="!detailEditMode"
                variant="ghost"
                size="sm"
                class="detail-icon-btn detail-icon-btn--danger"
                :aria-label="t('delete')"
                :disabled="busy"
                @click="deleteTodo(detailTodo.id)"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </header>

          <section v-if="!detailEditMode" class="detail-description-panel">
            <p class="detail-description-label">{{ t('todoContent') }}</p>
            <p class="detail-description-body">{{ getTodoContent(detailTodo) || '-' }}</p>
          </section>

          <template v-if="detailEditMode">
            <div class="detail-edit-panel">
              <p class="text-sm font-medium">{{ t('editTodoMeta') }}</p>
              <div class="space-y-1">
                <p class="text-xs text-muted-foreground">{{ t('todoTitle') }}</p>
                <Input v-model="detailTitleDraft" type="text" :placeholder="t('todoTitlePlaceholder')" />
              </div>
              <div class="space-y-1">
                <p class="text-xs text-muted-foreground">{{ t('todoContent') }}</p>
                <Textarea
                  v-model="detailContentDraft"
                  class="w-full min-h-[120px]"
                  :placeholder="t('todoContentPlaceholder')"
                />
              </div>
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
              <div class="space-y-1">
                <p class="text-xs text-muted-foreground">{{ t('label') }}</p>
                <div v-if="labelOptions.length > 0" class="label-select-row">
                  <Select :model-value="detailTodoLabelId" @update:model-value="onDetailTodoLabelChange">
                    <SelectTrigger class="w-full">
                      <SelectValue :placeholder="t('labelSelectPrompt')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem :value="LABEL_NONE_VALUE">{{ t('labelSelectPrompt') }}</SelectItem>
                      <SelectItem v-for="label in labelOptions" :key="label.id" :value="String(label.id)">
                        <span class="label-option-item">
                          <span class="todo-label-dot" :style="getLabelDotStyleByColor(label.color)" />
                          {{ label.name }}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" @click="openAddLabel">{{ t('labelSettings') }}</Button>
                </div>
                <Button v-else class="w-full" type="button" variant="outline" @click="openAddLabel">{{ t('labelSettings') }}</Button>
              </div>
              <label class="flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm">
                <input v-model="detailRolloverDraft" type="checkbox" class="mt-1" />
                <span class="space-y-0.5">
                  <span class="block font-medium">{{ t('rolloverOption') }}</span>
                  <span class="block text-xs text-muted-foreground">{{ t('rolloverHint') }}</span>
                </span>
              </label>
            </div>
          </template>
          <template v-else>
            <ul class="detail-meta-list">
              <li class="detail-meta-item">
                <CalendarDays class="detail-meta-icon" />
                <div class="detail-meta-content">
                  <p class="detail-meta-label">{{ t('due') }}</p>
                  <p class="detail-meta-value">{{ formatDateTime(detailTodo.dueAt) }}</p>
                </div>
              </li>
              <li v-if="detailTodo.labelText" class="detail-meta-item">
                <Tag class="detail-meta-icon" />
                <div class="detail-meta-content">
                  <p class="detail-meta-label">{{ t('label') }}</p>
                  <div class="detail-meta-value">
                    <span class="todo-label-badge" :style="getLabelBadgeStyle(detailTodo)">
                      <span class="todo-label-dot" :style="getLabelDotStyle(detailTodo)" />
                      {{ detailTodo.labelText }}
                    </span>
                  </div>
                </div>
              </li>
              <li class="detail-meta-item">
                <MapPin class="detail-meta-icon" />
                <div class="detail-meta-content">
                  <p class="detail-meta-label">{{ t('place') }}</p>
                  <p class="detail-meta-value detail-meta-value--truncate">{{ detailTodo.location || '-' }}</p>
                </div>
              </li>
              <li class="detail-meta-item">
                <Clock3 class="detail-meta-icon" />
                <div class="detail-meta-content">
                  <p class="detail-meta-label">{{ t('created') }}</p>
                  <p class="detail-meta-value">{{ formatDateTime(detailTodo.createdAt) }}</p>
                </div>
              </li>
              <li v-if="detailTodo.rolloverEnabled" class="detail-meta-item">
                <RotateCcw class="detail-meta-icon" />
                <div class="detail-meta-content">
                  <p class="detail-meta-label">{{ t('rolloverOption') }}</p>
                  <p class="detail-meta-value">{{ t('rolloverEnabled') }}</p>
                </div>
              </li>
            </ul>
          </template>

          <section class="detail-comment-panel">
            <div class="detail-comment-head">
              <p>{{ t('comment') }}</p>
              <span>{{ detailTodo.comments.length }}</span>
            </div>

            <form class="comment-form detail-comment-form" @submit.prevent="addComment(detailTodo.id)">
              <Textarea
                v-model="commentDrafts[detailTodo.id]"
                class="comment-textarea detail-comment-input"
                :placeholder="t('commentPlaceholder')"
              />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                class="detail-icon-btn detail-comment-submit"
                :aria-label="t('comment')"
                :disabled="busy"
              >
                <SendHorizontal class="h-4 w-4" />
              </Button>
            </form>

            <component
              :is="detailTodo.comments.length > 3 ? ScrollArea : 'div'"
              v-if="detailTodo.comments.length > 0"
              :class="detailTodo.comments.length > 3 ? 'comment-scroll-area' : null"
            >
              <ul class="comment-list" :class="{ 'comment-list--scroll': detailTodo.comments.length > 3 }">
                <li v-for="comment in detailTodo.comments" :key="comment.id">
                  <div class="comment-content min-w-0 flex-1">
                    <p v-if="editingCommentId !== comment.id" class="comment-text">{{ comment.text }}</p>
                    <Textarea
                      v-else
                      ref="commentEditTextareaRef"
                      v-model="commentEditDraft"
                      class="comment-edit-textarea"
                      :placeholder="t('commentEditPlaceholder')"
                      @input="onCommentEditTextareaInput"
                    />
                    <small>{{ formatDateTime(comment.createdAt) }}</small>
                  </div>
                  <div class="comment-actions">
                    <template v-if="editingCommentId === comment.id">
                      <Button
                        size="sm"
                        variant="ghost"
                        class="detail-icon-btn"
                        :aria-label="t('save')"
                        :disabled="busy"
                        @click="saveCommentEdit(detailTodo.id, comment.id)"
                      >
                        <Check class="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        class="detail-icon-btn"
                        :aria-label="t('cancel')"
                        @click="cancelCommentEdit"
                      >
                        <X class="h-4 w-4" />
                      </Button>
                    </template>
                    <template v-else>
                      <Button
                        variant="ghost"
                        size="sm"
                        class="detail-icon-btn"
                        :aria-label="t('edit')"
                        @click="startCommentEdit(comment)"
                      >
                        <Pencil class="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        class="detail-icon-btn"
                        :aria-label="t('remove')"
                        @click="deleteComment(detailTodo.id, comment.id)"
                      >
                        <Trash2 class="h-4 w-4" />
                      </Button>
                    </template>
                  </div>
                </li>
              </ul>
            </component>
            <p v-else class="empty">{{ t('noComments') }}</p>
          </section>
        </div>
      </article>
    </section>
  </main>
</template>





