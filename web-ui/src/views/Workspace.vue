<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { locale, t } = useI18n()
const router = useRouter()

// Language mapping: display name -> locale code (limit to EN/ZH)
const languageMap = {
  'English (United States)': 'en',
  '简体中文': 'zh'
}

const theme = ref(typeof localStorage !== 'undefined' ? localStorage.getItem('theme') || 'light' : 'light')
const applyTheme = () => {
  const root = document.documentElement
  const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  const useDark = theme.value === 'dark' || (theme.value === 'system' && prefersDark)
  if (useDark) root.classList.add('dark')
  else root.classList.remove('dark')
}
const projects = ref([
  {
    id: 'p1',
    name: '霸道总裁爱上我',
    updated: '2小时前',
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop',
    teamId: 't1',
    episodes: 80,
    status: 'rendering'
  },
  {
    id: 'p2',
    name: '重生之我是大明星',
    updated: '昨天',
    thumbnail: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=800&auto=format&fit=crop',
    teamId: 't2',
    episodes: 50,
    status: 'scripting'
  },
  {
    id: 'p3',
    name: '末日降临',
    updated: '3天前',
    thumbnail: 'https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?q=80&w=800&auto=format&fit=crop',
    teamId: 't1',
    episodes: 12,
    status: 'draft'
  }
])
const headerSearch = ref('')
const filteredProjects = computed(() => {
  const q = headerSearch.value.trim().toLowerCase()
  if (!q) return projects.value
  return projects.value.filter(p =>
    (p.name || '').toLowerCase().includes(q) ||
    (p.updated || '').toLowerCase().includes(q) ||
    (p.desc || '').toLowerCase().includes(q)
  )
})
const currentSection = ref('drafts')
const currentTeamId = ref('')
const setSection = (s) => { currentSection.value = s }
const filteredFavoritesByHeader = computed(() => {
  const q = headerSearch.value.trim().toLowerCase()
  if (!q) return favoritesItems.value
  return favoritesItems.value.filter(x => (x.name||'').toLowerCase().includes(q) || (x.updated||'').toLowerCase().includes(q))
})
const filteredRecentByHeader = computed(() => {
  const q = headerSearch.value.trim().toLowerCase()
  if (!q) return recentItems.value
  return recentItems.value.filter(x => (x.name||'').toLowerCase().includes(q) || (x.time||'').toLowerCase().includes(q))
})
const teamProjectsByHeader = computed(() => {
  const q = headerSearch.value.trim().toLowerCase()
  return projects.value.filter(p => p.teamId === currentTeamId.value).filter(p =>
    !q || (p.name||'').toLowerCase().includes(q) || (p.updated||'').toLowerCase().includes(q)
  )
})
const sectionTitle = computed(() => {
  if (currentSection.value === 'favorites') return t('workspace.favorites')
  if (currentSection.value === 'recent') return t('workspace.recent')
  if (currentSection.value === 'recycle') return t('workspace.recycle')
  if (currentSection.value === 'scripts') return t('workspace.scripts')
  if (currentSection.value === 'characters') return t('workspace.characters')
  if (currentSection.value === 'assets') return t('workspace.assets')
  if (currentSection.value === 'team') {
    const team = teams.value.find(x => x.id === currentTeamId.value)
    return team ? team.name : t('workspace.team')
  }
  return t('workspace.my_drafts')
})
const sortMenuOpen = ref(false)
const sortOption = ref('modified')
const sortOrder = ref('desc')
const sortLabel = computed(() => {
  if (sortOption.value === 'name') return t('workspace.name')
  if (sortOption.value === 'created') return t('workspace.created')
  return t('workspace.modified')
})
const sectionList = computed(() => {
  const base = currentSection.value === 'favorites' ? filteredFavoritesByHeader.value : currentSection.value === 'recent' ? filteredRecentByHeader.value : currentSection.value === 'team' ? teamProjectsByHeader.value : filteredProjects.value
  const list = [...base]
  const order = sortOrder.value === 'asc' ? 1 : -1

  if (sortOption.value === 'name') {
    list.sort((a, b) => ((a.name||'').localeCompare(b.name||'')) * order)
  } else if (sortOption.value === 'created') {
    // 按创建时间排序 - 假设 created 字段存在，如果不存在则使用 id 作为替代
    list.sort((a, b) => {
      const aTime = a.created || a.id || ''
      const bTime = b.created || b.id || ''
      return aTime.localeCompare(bTime) * order
    })
  } else if (sortOption.value === 'modified') {
    // 按修改时间排序 - 使用 updated 字段
    list.sort((a, b) => {
      const aTime = a.updated || ''
      const bTime = b.updated || ''
      return aTime.localeCompare(bTime) * order
    })
  }

  return list
})
const viewMode = ref('grid')
const showCreateModal = ref(false)
const createName = ref('')
const createPerm = ref('private')
const createDesc = ref('')
const nameError = ref('')
const permError = ref('')
const isValid = computed(() => createName.value.trim().length > 0 && !!createPerm.value)
const openMenuId = ref(null)
const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem('theme', theme.value)
  applyTheme()
}
const setTheme = (mode) => {
  theme.value = mode
  localStorage.setItem('theme', mode)
  applyTheme()
}
const toggleMenu = (id) => {
  openMenuId.value = openMenuId.value === id ? null : id
}
const renameProject = (id) => {
  const idx = projects.value.findIndex(p => p.id === id)
  if (idx === -1) return
  const next = window.prompt(t('workspace.rename'), projects.value[idx].name)
  if (next && next.trim()) {
    projects.value[idx].name = next.trim()
  }
  openMenuId.value = null
}
const duplicateProject = (id) => {
  const src = projects.value.find(p => p.id === id)
  if (!src) return
  const newId = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2,6)
  projects.value.unshift({
    id: newId,
    name: src.name + t('workspace.copy'),
    updated: t('workspace.just_now'),
    thumbnail: src.thumbnail
  })
  openMenuId.value = null
}
const showDuplicate = ref(false)
const duplicateName = ref('')
const duplicateError = ref('')
const duplicateSrcId = ref('')
const openDuplicate = async (id) => { const src = projects.value.find(p => p.id === id); if (!src) return; duplicateSrcId.value = id; duplicateName.value = (src.name || '') + t('workspace.copy'); duplicateError.value = ''; openMenuId.value = null; await nextTick(); showDuplicate.value = true }
const cancelDuplicate = () => { showDuplicate.value = false; duplicateName.value = ''; duplicateError.value = ''; duplicateSrcId.value = '' }
const confirmDuplicate = () => { duplicateError.value = ''; const name = (duplicateName.value || '').trim(); if (!name) { duplicateError.value = t('workspace.enter_name'); return } const src = projects.value.find(p => p.id === duplicateSrcId.value); const newId = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); projects.value.unshift({ id: newId, name, updated: t('workspace.just_now'), thumbnail: src?.thumbnail }); cancelDuplicate() }
const deleteProject = (id) => {
  const ok = window.confirm(t('workspace.confirm_delete'))
  if (!ok) return
  projects.value = projects.value.filter(p => p.id !== id)
  openMenuId.value = null
}
const manageProject = (id) => {
  openMenuId.value = null
  router.push({ path: '/studio', query: { id } })
}
const shareProject = async (id) => {
  const link = window.location.origin + '/studio?id=' + encodeURIComponent(id)
  try {
    await navigator.clipboard.writeText(link)
    alert(t('workspace.share_link_copied'))
  } catch {
    alert(t('workspace.share_link') + link)
  }
  openMenuId.value = null
}
// theme popover removed; direct click toggles theme
const userMenuOpen = ref(false)
const toggleUserMenu = () => { userMenuOpen.value = !userMenuOpen.value }
const onDocClick = (e) => {
  const t = e?.target
  if (t && (t.closest('[data-project-menu]') || t.closest('[data-project-menu-button]'))) return
  openMenuId.value = null
  userMenuOpen.value = false
  roleMenuForId.value = null
  notifyOpen.value = false
  languageListOpen.value = false
  sortMenuOpen.value = false
}
onMounted(() => {
  // Load saved locale from localStorage
  const savedLocale = typeof localStorage !== 'undefined' ? localStorage.getItem('locale') : null
  if (savedLocale) {
    locale.value = savedLocale
  }

  // Reflect saved locale in UI label
  uiLanguage.value = (locale.value === 'zh') ? '简体中文' : 'English (United States)'

  applyTheme()
  document.addEventListener('click', onDocClick)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
})
const showSettings = ref(false)
const settingsTab = ref('workspace')
const openSettings = async () => {
  userMenuOpen.value = false
  await nextTick()
  showSettings.value = true
}
const closeSettings = () => {
  showSettings.value = false
}
const providers = ref([
  { id: 'openai', name: 'OpenAI', slug: 'openai', desc: 'OpenAI 提供的模型，例如 GPT‑4、GPT‑4o 等', enabled: true },
  { id: 'anthropic', name: 'Anthropic', slug: 'anthropic', desc: 'Anthropic 的 Claude 系列模型', enabled: false },
  { id: 'bedrock', name: 'Amazon Bedrock', slug: 'bedrock', desc: '亚马逊 Bedrock 聚合多家模型供应商', enabled: false },
  { id: 'azure-openai', name: 'Azure OpenAI', slug: 'azure', desc: 'Azure OpenAI Service，企业级合规与连接能力', enabled: false },
  { id: 'azure-ai-studio', name: 'Azure AI Studio', slug: 'azureai', desc: 'Azure AI Studio，端到端 AI 应用构建平台', enabled: false },
  { id: 'cohere', name: 'Cohere', slug: 'cohere', desc: 'Cohere Command、Embed 等模型', enabled: false },
  { id: 'gemini', name: 'Gemini', slug: 'gemini', desc: '谷歌提供的 Gemini 模型', enabled: false },
  { id: 'huggingface', name: 'Hugging Face Hub', slug: 'huggingface', desc: '海量开源模型与数据集的托管平台', enabled: false },
  { id: 'replicate', name: 'Replicate', slug: 'replicate', desc: '通过 API 调用社区模型进行推理', enabled: false },
  { id: 'deepseek', name: '深度求索', slug: 'deepseek', desc: '深度求索提供的对话与代码模型', enabled: false },
  { id: 'ollama', name: 'Ollama', slug: 'ollama', desc: '本地部署与运行开源大模型', enabled: false },
  { id: 'qwen', name: '通义千问', slug: 'qwen', desc: '阿里通义千问系列模型', enabled: false },
  { id: 'volcengine', name: '火山方舟', slug: 'volcengine', desc: '火山引擎模型与 Doubao 系列', enabled: false },
  { id: 'xinference', name: 'Xorbits Inference', slug: 'xinference', desc: '面向推理的开源框架', enabled: false },
  { id: 'openrouter', name: 'OpenRouter', slug: 'openrouter', desc: '统一访问多家模型的路由平台', enabled: false },
  { id: 'lmstudio', name: 'LM Studio', slug: 'lmstudio', desc: '在本地运行与管理 LLM', enabled: false },
  { id: 'vllm', name: 'vLLM', slug: 'vllm', desc: '高性能推理与服务框架', enabled: false },
  { id: 'zhipu', name: '智谱 AI', slug: 'zhipu', desc: '智谱 ChatGLM、GLM 系列', enabled: false },
  { id: 'jina', name: 'Jina', slug: 'jina', desc: '嵌入与重排等向量服务', enabled: false },
  { id: 'moonshot', name: '月之暗面', slug: 'moonshot', desc: 'Moonshot 模型与 API', enabled: false },
  { id: 'hunyuan', name: '腾讯混元', slug: 'hunyuan', desc: '腾讯混元系列模型', enabled: false },
  { id: 'wenxin', name: '文心一言', slug: 'wenxin', desc: '百度文心系列模型', enabled: false },
  { id: 'minimax', name: 'Minimax', slug: 'minimax', desc: '对话、语音与多模态模型', enabled: false },
  { id: 'vertexai', name: 'Vertex AI', slug: 'vertexai', desc: 'Google Cloud 的 AI 平台', enabled: false },
  { id: 'xai', name: 'xAI', slug: 'xai', desc: 'Grok 等模型与服务', enabled: false },
  { id: 'localai', name: 'LocalAI', slug: 'localai', desc: '纯本地推理的 API 兼容实现', enabled: false },
  { id: 'groq', name: 'Groq', slug: 'groq', desc: 'GroqCloud 与超高速推理', enabled: false },
  { id: 'mistral', name: 'Mistral AI', slug: 'mistral', desc: 'Mistral 系列与 API', enabled: false },
  { id: 'modelscope', name: '魔搭社区', slug: 'modelscope', desc: '阿里巴巴 ModelScope 模型', enabled: false },
  { id: 'baichuan', name: '百川智能', slug: 'baichuan', desc: '百川大模型与 API', enabled: false },
  { id: '01ai', name: '零一万物', slug: '01ai', desc: 'Yi 系列模型', enabled: false },
  { id: 'qiniu', name: '七牛云', slug: 'qiniu', desc: '七牛云模型与推理服务', enabled: false },
  { id: 'llamaapi', name: 'Llama API', slug: 'llamaapi', desc: 'Llama 模型 API 平台', enabled: false },
  { id: 'elevenlabs', name: 'ElevenLabs', slug: 'elevenlabs', desc: '语音 TTS/STT 服务', enabled: false },
  { id: 'voyage', name: 'Voyage', slug: 'voyage', desc: '高质量嵌入与检索服务', enabled: false },
  { id: 'sagemaker', name: 'Amazon SageMaker', slug: 'sagemaker', desc: '自部署模型与托管推理', enabled: false },
  { id: 'togetherai', name: 'Together.AI', slug: 'togetherai', desc: '聚合开源与商用模型', enabled: false },
  { id: 'ucloud', name: 'UCloud 优刻得', slug: 'ucloud', desc: '一站式模型 API 访问', enabled: false },
  { id: 'cometapi', name: 'CometAPI', slug: 'cometapi', desc: '多模型 API 聚合', enabled: false },
  { id: 'longcat', name: 'LongCat', slug: 'longcat', desc: '长上下文模型与服务', enabled: false },
  { id: 'watsonx', name: 'IBM WatsonX', slug: 'watsonx', desc: 'IBM 企业级 AI 平台', enabled: false },
  { id: '302ai', name: '302.AI', slug: '302ai', desc: '统一接入与资源平台', enabled: false }
])
const uiLanguage = ref('简体中文')
const clearUiLanguage = () => { uiLanguage.value = '' }
const languageListOpen = ref(false)
const languageOptions = ref([
  'English (United States)',
  '简体中文'
])
const toggleLanguageList = () => { languageListOpen.value = !languageListOpen.value }
const chooseLanguage = (opt) => {
  uiLanguage.value = opt
  languageListOpen.value = false

  // Switch i18n locale
  const localeCode = languageMap[opt]
  if (localeCode) {
    locale.value = localeCode
    // Save to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('locale', localeCode)
    }
  }
}
const openCreateModal = () => {
  showCreateModal.value = true
}
const cancelCreate = () => {
  showCreateModal.value = false
  createName.value = ''
  createDesc.value = ''
  createPerm.value = 'private'
  nameError.value = ''
  permError.value = ''
}
const confirmCreate = () => {
  nameError.value = createName.value.trim() ? '' : t('workspace.field_required')
  permError.value = createPerm.value ? '' : t('workspace.field_required')
  const name = createName.value.trim()
  if (!name || !createPerm.value) return
  const id = 'p' + Date.now().toString(36)
  projects.value.unshift({
    id,
    name,
    updated: t('workspace.just_now'),
    thumbnail: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=800&auto=format&fit=crop',
    perm: createPerm.value,
    desc: createDesc.value.trim()
  })
  cancelCreate()
}
const adminName = ref('王小明')
const adminEmail = ref('xiaoming@weimeng.com')
const members = ref([
  { id: 'm2', name: '李丽', role: 'editor', email: 'lili@weimeng.com', lastActive: '2天前' },
  { id: 'm3', name: '张伟', role: 'viewer', email: 'zhangwei@weimeng.com', lastActive: '刚刚' },
  { id: 'm4', name: '陈强', role: 'collaborator', email: 'chenqiang@weimeng.com', lastActive: '5小时前' },
  { id: 'm5', name: '刘芳', role: 'editor', email: 'liufang@weimeng.com', lastActive: '1周前' },
  { id: 'm6', name: '赵磊', role: 'viewer', email: 'zhaolei@weimeng.com', lastActive: '3天前' },
])
const searchQuery = ref('')
const filteredMembers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return members.value
  return members.value.filter(m => (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q) || (m.role || '').toLowerCase().includes(q))
})
const editAdminName = () => {
  const next = window.prompt(t('workspace.edit_name'), adminName.value)
  if (next && next.trim()) adminName.value = next.trim()
}
const editMemberName = (id) => {
  const idx = members.value.findIndex(m => m.id === id)
  if (idx === -1) return
  const next = window.prompt(t('workspace.edit_name'), members.value[idx].name)
  if (next && next.trim()) members.value[idx].name = next.trim()
}
const roleMenuForId = ref(null)
const toggleRoleMenu = (id) => {
  roleMenuForId.value = roleMenuForId.value === id ? null : id
}
const setRole = (id, role) => {
  const idx = members.value.findIndex(m => m.id === id)
  if (idx === -1) return
  members.value[idx].role = role
  roleMenuForId.value = null
}
const showAddMember = ref(false)
const addMemberEmail = ref('')
const addMemberRole = ref('member')
const addMemberError = ref('')
const openAddMember = async () => { await nextTick(); showAddMember.value = true }
const closeAddMember = () => { showAddMember.value = false; addMemberEmail.value=''; addMemberRole.value='member'; addMemberError.value='' }
const showInviteLink = ref(false)
const inviteLink = ref('')
const closeInviteLink = () => { showInviteLink.value = false }
const toastOpen = ref(false)
const toastText = ref('')
const toastType = ref('success')
let toastTimer = null
const openToast = (text, type = 'success') => { toastText.value = text; toastType.value = type; toastOpen.value = true; if (toastTimer) clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastOpen.value = false }, 2000) }
const copyHintOpen = ref(false)
const copyHintText = ref('')
let copyHintTimer = null
const openCopyHint = (text) => { copyHintText.value = text; copyHintOpen.value = true; if (copyHintTimer) clearTimeout(copyHintTimer); copyHintTimer = setTimeout(() => { copyHintOpen.value = false }, 2000) }
const copyInviteLink = async () => { try { await navigator.clipboard.writeText(inviteLink.value); openCopyHint(t('workspace.invite_sent')); } catch { openCopyHint(t('workspace.copy_failed')); } }
const shareInviteLink = async () => {
  try {
    if (navigator.share) {
      await navigator.share({ title: t('workspace.invite_link'), url: inviteLink.value })
    } else {
      await copyInviteLink()
    }
  } catch {}
}
const submitAddMember = () => {
  addMemberError.value = ''
  if (!addMemberEmail.value.trim()) { addMemberError.value = t('workspace.email_required'); return }
  members.value.push({ id: 'm'+Date.now(), name: addMemberEmail.value.split('@')[0], role: addMemberRole.value, email: addMemberEmail.value.trim(), lastActive: t('workspace.just_now') })
  inviteLink.value = (typeof location !== 'undefined' ? location.origin : 'https://weimeng.local') + `/invite?team=${encodeURIComponent(currentTeamId.value || 'default')}&email=${encodeURIComponent(addMemberEmail.value.trim())}&t=${Date.now()}`
  closeAddMember()
  showInviteLink.value = true
}
const removeMember = (id) => {
  const m = members.value.find(x => x.id === id)
  const ok = window.confirm(t('workspace.confirm_remove_member', { name: m?.name || '' }))
  if (!ok) return
  members.value = members.value.filter(x => x.id !== id)
  roleMenuForId.value = null
}

const showExtractWizard = ref(false)
const extractStep = ref(1)
const scriptInput = ref('')
const extractedRoles = ref([])
const extractError = ref('')
const openExtractWizard = async () => { extractStep.value = 1; scriptInput.value = ''; extractedRoles.value = []; extractError.value = ''; await nextTick(); showExtractWizard.value = true }
const closeExtractWizard = () => { showExtractWizard.value = false; extractStep.value = 1; scriptInput.value = ''; extractedRoles.value = []; extractError.value = '' }
const extractCandidates = () => {
  extractError.value = ''
  const txt = (scriptInput.value || '').trim()
  if (!txt) { extractError.value = '请粘贴剧本文本'; return }
  const set = new Set()
  let m
  const reZh = /([\u4e00-\u9fa5]{2,8})：/g
  const reEn = /([A-Z][A-Za-z\s]{0,20}):/g
  while ((m = reZh.exec(txt))) { set.add(m[1]) }
  while ((m = reEn.exec(txt))) { set.add(m[1].trim()) }
  const list = Array.from(set)
  if (list.length === 0) { extractError.value = '未识别到角色名称，请检查格式'; return }
  extractedRoles.value = list.slice(0, 20).map(n => ({ name: n, selected: true }))
  extractStep.value = 2
}
const toggleRoleSelected = (idx) => { const it = extractedRoles.value[idx]; if (!it) return; it.selected = !it.selected }
const prevExtract = () => { if (extractStep.value > 1) extractStep.value -= 1 }
const nextExtract = () => { if (extractStep.value === 2) extractStep.value = 3 }
const confirmExtractCreate = () => { const chosen = extractedRoles.value.filter(x => x.selected); if (chosen.length === 0) { extractError.value = '请至少选择一个角色'; return } openToast('角色已创建'); closeExtractWizard() }
const notifyOpen = ref(false)
const toggleNotify = () => { notifyOpen.value = !notifyOpen.value }
const notifications = ref([
  { id: 'n1', title: '你的设计稿被评论', time: '3分钟前', icon: 'comment-dots', read: false },
  { id: 'n2', title: '组件库已更新到 v2.4', time: '1小时前', icon: 'diagram-project', read: false },
  { id: 'n3', title: '协作者邀请已通过', time: '昨天', icon: 'users', read: true },
])
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
const clearNotifications = () => { notifications.value.forEach(n => { n.read = true }) }
const showAccount = ref(false)
const accountName = ref('胡子君')
const accountEmail = ref('huzijun@tangdou.com')
const openAccount = async () => { userMenuOpen.value = false; await nextTick(); showAccount.value = true }
const closeAccount = () => { showAccount.value = false }
const editingAccountName = ref(false)
const tempAccountName = ref('')
const editAccountName = () => { editingAccountName.value = true; tempAccountName.value = accountName.value }
const saveAccountName = () => { const next = (tempAccountName.value || '').trim(); if (next) accountName.value = next; editingAccountName.value = false }
const cancelAccountName = () => { editingAccountName.value = false; tempAccountName.value = '' }
const showChangeEmail = ref(false)
const changeTab = ref('email')
const changePhase = ref('current')
const changeForm = ref({ email: accountEmail.value, phone: '', code: '', password: '' })
const changeErrors = ref({ email: '', phone: '', code: '', password: '' })
const changeSending = ref(false)
const changeSeconds = ref(0)
let changeTimer = null
const newEmail = ref('')
const newEmailError = ref('')
const newEmailCodeError = ref('')
const openChangeEmail = async () => { await nextTick(); showChangeEmail.value = true; changePhase.value = 'current'; changeTab.value = 'email'; changeForm.value = { email: accountEmail.value, phone: '', code: '', password: '' }; changeErrors.value = { email: '', phone: '', code: '', password: '' }; newEmail.value = ''; newEmailError.value = ''; newEmailCodeError.value = '' }
const closeChangeEmail = () => { showChangeEmail.value = false; changePhase.value = 'current'; changeForm.value = { email: accountEmail.value, phone: '', code: '', password: '' }; changeErrors.value = { email: '', phone: '', code: '', password: '' }; newEmail.value = ''; newEmailError.value = ''; newEmailCodeError.value = ''; changeTimer && clearInterval(changeTimer); changeSeconds.value = 0; changeSending.value = false }
const changeSendCode = async () => { if (changeSending.value || changeSeconds.value > 0) return; changeSending.value = true; await new Promise(r => setTimeout(r, 800)); changeSending.value = false; changeSeconds.value = 60; changeTimer && clearInterval(changeTimer); changeTimer = setInterval(() => { if (changeSeconds.value > 0) changeSeconds.value--; else { clearInterval(changeTimer); changeTimer = null } }, 1000) }
const showChangePassword = ref(false)
const submitChangeVerify = () => { changeErrors.value = { email: '', phone: '', code: '', password: '' }; if (changeTab.value === 'email') { const e = (changeForm.value.email||'').trim(); const c = (changeForm.value.code||'').trim(); if (!e) { changeErrors.value.email = t('workspace.email_required'); return } if (!c) { changeErrors.value.code = t('workspace.enter_code'); return } } else if (changeTab.value === 'phone') { const p = (changeForm.value.phone||'').trim(); const c = (changeForm.value.code||'').trim(); if (!p) { changeErrors.value.phone = t('workspace.email_required'); return } if (!c) { changeErrors.value.code = t('workspace.enter_code'); return } } else { const pw = (changeForm.value.password||'').trim(); if (!pw) { changeErrors.value.password = t('workspace.email_required'); return } }
  changePhase.value = 'new'; changeForm.value.code = ''; newEmailError.value = ''; newEmailCodeError.value = '' }
const confirmNewEmail = () => { newEmailError.value = ''; newEmailCodeError.value = ''; const next = (newEmail.value||'').trim(); const k = (changeForm.value.code||'').trim(); if (!next) { newEmailError.value = t('workspace.enter_new_email'); return } if (!/^\d{6}$/.test(k)) { newEmailCodeError.value = t('workspace.enter_code'); return } accountEmail.value = next; closeChangeEmail(); openToast(t('workspace.email_updated')) }
const changeAccountEmail = () => { openChangeEmail() }
const showAbout = ref(false)
const currentVersion = ref('1.7.2')
const latestVersion = ref('1.9.2')
const openAbout = async () => { userMenuOpen.value = false; await nextTick(); showAbout.value = true }
const closeAbout = () => { showAbout.value = false }
const showUpgrade = ref(false)
const openUpgrade = async () => { await nextTick(); showUpgrade.value = true }
const closeUpgrade = () => { showUpgrade.value = false }
const logout = () => {
  try {
    localStorage.removeItem('loggedIn')
  } catch {}
  userMenuOpen.value = false
  router.push('/login')
}
const upgradeTab = ref('cloud')
const annualBilling = ref(false)
const accountAppsOpen = ref(false)
const accountApps = ref([
  { id: 'app1', name: '电商平台', projects: 12, lastActive: '今天' },
  { id: 'app2', name: 'CRM 系统', projects: 8, lastActive: '2天前' },
  { id: 'app3', name: '移动健康App', projects: 5, lastActive: '1周前' },
])
const toggleAccountApps = () => { accountAppsOpen.value = !accountAppsOpen.value }
const showReset = ref(false)
const resetForm = ref({ password: '', confirm: '', code: '' })
const resetErrors = ref({ password: '', confirm: '', code: '' })
const showResetPassword = ref(false)
const showResetConfirm = ref(false)
const openReset = () => { showReset.value = true }
const closeReset = () => { showReset.value = false; resetForm.value = { password: '', confirm: '', code: '' }; resetErrors.value = { password: '', confirm: '', code: '' } }
const submitReset = () => {
  resetErrors.value = { password: '', confirm: '', code: '' }
  const p = resetForm.value.password.trim()
  const c = resetForm.value.confirm.trim()
  const k = resetForm.value.code.trim()
  if (p.length < 8) resetErrors.value.password = t('workspace.password_min_length')
  if (c !== p) resetErrors.value.confirm = t('workspace.password_mismatch')
  if (!/^\d{6}$/.test(k)) resetErrors.value.code = t('workspace.enter_code')
  if (!resetErrors.value.password && !resetErrors.value.confirm && !resetErrors.value.code) {
    alert(t('workspace.password_reset'))
    closeReset()
  }
}
const sendingCode = ref(false)
const secondsLeft = ref(0)
let codeTimer = null
const sendCode = async () => {
  if (sendingCode.value || secondsLeft.value > 0) return
  sendingCode.value = true
  await new Promise(r => setTimeout(r, 800))
  sendingCode.value = false
  secondsLeft.value = 60
  codeTimer && clearInterval(codeTimer)
  codeTimer = setInterval(() => {
    if (secondsLeft.value > 0) secondsLeft.value--
    else { clearInterval(codeTimer); codeTimer = null }
  }, 1000)
}
const showRecent = ref(false)
const recentSearch = ref('')
const recentItems = ref([
  { id: 'r1', name: 'Dashboard 概览页', time: '3分钟前', thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=800&auto=format&fit=crop' },
  { id: 'r2', name: '电商购物车原型', time: '昨天', thumbnail: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=800&auto=format&fit=crop' },
  { id: 'r3', name: '移动端登录页', time: '1周前', thumbnail: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=800&auto=format&fit=crop' },
])
const filteredRecent = computed(() => {
  const q = recentSearch.value.trim().toLowerCase()
  if (!q) return recentItems.value
  return recentItems.value.filter(x => (x.name||'').toLowerCase().includes(q) || (x.time||'').toLowerCase().includes(q))
})
const openRecent = async () => { await nextTick(); showRecent.value = true }
const closeRecent = () => { showRecent.value = false; recentSearch.value = '' }
const clearRecent = () => { recentItems.value = [] }
const recycleSearch = ref('')
const recycleItems = ref([
  { id: 'd1', name: '旧版登录页原型', deletedAt: '2天前', thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=800&auto=format&fit=crop' },
  { id: 'd2', name: '电商结算流程草稿', deletedAt: '昨天', thumbnail: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=800&auto=format&fit=crop' }
])
const filteredRecycle = computed(() => {
  const q = recycleSearch.value.trim().toLowerCase()
  if (!q) return recycleItems.value
  return recycleItems.value.filter(x => (x.name||'').toLowerCase().includes(q) || (x.deletedAt||'').toLowerCase().includes(q))
})
const restoreRecycleItem = (id) => {
  const item = recycleItems.value.find(x => x.id === id)
  if (!item) return
  projects.value.unshift({ id: 'p'+Date.now().toString(36), name: item.name, updated: t('workspace.just_now'), thumbnail: item.thumbnail })
  recycleItems.value = recycleItems.value.filter(x => x.id !== id)
  openToast(t('workspace.restored'))
}
const deleteRecycleItem = (id) => {
  const ok = window.confirm(t('workspace.confirm_delete_permanent'))
  if (!ok) return
  recycleItems.value = recycleItems.value.filter(x => x.id !== id)
}
const clearRecycle = () => {
  const ok = window.confirm(t('workspace.confirm_empty_recycle'))
  if (!ok) return
  recycleItems.value = []
}
const showFavorites = ref(false)
const favoritesSearch = ref('')
const favoritesItems = ref([
  { id: 'f1', name: '电商首页原型', updated: '2天前', thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop' },
  { id: 'f2', name: '数据报表仪表盘', updated: '3小时前', thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop' },
  { id: 'f3', name: '移动端注册页', updated: '上周', thumbnail: 'https://images.unsplash.com/photo-1517249361621-f11084eb8eba?q=80&w=800&auto=format&fit=crop' },
])
const teams = ref([
  { id: 't1', name: 'UX 部门', icon: '' },
  { id: 't2', name: '电商项目组', icon: '' }
])
const filteredFavorites = computed(() => {
  const q = favoritesSearch.value.trim().toLowerCase()
  if (!q) return favoritesItems.value
  return favoritesItems.value.filter(x => (x.name||'').toLowerCase().includes(q) || (x.updated||'').toLowerCase().includes(q))
})
const openFavorites = async () => { await nextTick(); showFavorites.value = true }
const closeFavorites = () => { showFavorites.value = false; favoritesSearch.value = '' }
const showTeamCreate = ref(false)
const teamName = ref('')
const teamDesc = ref('')
const teamIconPreview = ref('')
const teamNameError = ref('')
const teamIconInput = ref(null)
const triggerTeamIconPick = () => { teamIconInput.value && teamIconInput.value.click() }
const teamValid = computed(() => teamName.value.trim().length > 0)
const openTeamCreate = async () => { await nextTick(); showTeamCreate.value = true }
const closeTeamCreate = () => { showTeamCreate.value = false; teamName.value = ''; teamDesc.value = ''; teamIconPreview.value=''; teamNameError.value='' }
const onTeamIconChange = (e) => {
  const file = e?.target?.files?.[0]
  if (!file) { teamIconPreview.value = ''; return }
  const reader = new FileReader()
  reader.onload = () => { teamIconPreview.value = reader.result }
  reader.readAsDataURL(file)
}
const submitTeamCreate = () => {
  teamNameError.value = ''
  if (!teamName.value.trim()) { teamNameError.value = t('workspace.enter_team_name'); return }
  teams.value.push({ id: 't' + Date.now(), name: teamName.value.trim(), icon: teamIconPreview.value })
  alert(t('workspace.team_created'))
  closeTeamCreate()
}
</script>

<template>
  <div class="flex h-screen text-primary bg-light-gray dark:bg-[#121212] dark:text-[#E0E0E0]">
    <aside class="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col dark:bg-[#1E1E1E] dark:border-[#333333]">
      <div class="h-16 flex items-center px-6 border-b border-gray-200 dark:border-[#3A3A3C]">
        <router-link to="/" class="text-2xl font-bold text-primary dark:text-white flex items-center">
          <img src="@/assets/logo.png" :alt="t('brand.name') + ' Logo'" class="w-10 h-10 mr-2 rounded-lg" />
          {{ t('brand.name') }}
        </router-link>
      </div>

      <div class="p-4 space-y-4 flex-grow">
        <router-link to="#" class="flex items-center justify-center w-full bg-brand-green text-white font-semibold px-4 py-3 rounded-lg hover:bg-brand-green-dark transition-colors shadow-sm hover:shadow-md">
          <fa :icon="['fas','plus']" class="mr-2" />
          {{ $t('workspace.new_project') }}
        </router-link>

        <button class="flex items-center justify-center w-full bg-white text-brand-green font-semibold px-4 py-3 rounded-lg border border-brand-green hover:bg-brand-green/10 transition-colors" @click="openExtractWizard">
          <fa :icon="['fas','user']" class="mr-2" /> 剧本提炼角色
        </button>

        <nav class="mt-6 space-y-1">
          <a href="#" @click.prevent="setSection('home')" :class="['flex items-center px-3 py-2 rounded-md transition-colors', currentSection==='home' ? 'font-semibold bg-brand-green/10 text-brand-green' : 'text-secondary dark:text-[#E0E0E0] hover:bg-gray-100 dark:hover:bg-[#2C2C2E]']">
            <fa :icon="['fas','house']" class="w-6 text-center" />
            <span class="ml-3 font-medium">{{ $t('workspace.home') }}</span>
          </a>
          <a href="#" @click.prevent="setSection('drafts')" :class="['flex items-center px-3 py-2 rounded-md transition-colors', currentSection==='drafts' ? 'font-semibold bg-brand-green/10 text-brand-green' : 'text-secondary dark:text-[#E0E0E0] hover:bg-gray-100 dark:hover:bg-[#2C2C2E]']">
            <fa :icon="['fas','inbox']" class="w-6 text-center" />
            <span class="ml-3 font-medium">{{ $t('workspace.my_drafts') }}</span>
          </a>
          <a href="#" @click.prevent="setSection('shared')" :class="['flex items-center px-3 py-2 rounded-md transition-colors', currentSection==='shared' ? 'font-semibold bg-brand-green/10 text-brand-green' : 'text-secondary dark:text-[#E0E0E0] hover:bg-gray-100 dark:hover:bg-[#2C2C2E]']">
            <fa :icon="['fas','share-nodes']" class="w-6 text-center" />
            <span class="ml-3 font-medium">{{ $t('workspace.shared_with_me') }}</span>
          </a>
        </nav>

        <!-- 分割线 -->
        <div class="pt-4 pb-2">
          <div class="border-t border-gray-200 dark:border-[#333333]"></div>
        </div>

        <div class="pt-2">
          <a href="#" @click.prevent="setSection('community')" class="flex items-center px-3 py-2 text-secondary dark:text-[#E0E0E0] hover:bg-gray-100 dark:hover:bg-[#2C2C2E] rounded-md transition-colors">
            <div class="w-6 h-6 flex items-center justify-center">
              <svg class="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="7" height="7" rx="1.5" fill="#FF6B6B"/>
                <rect x="11" y="2" width="7" height="7" rx="1.5" fill="#4ECDC4"/>
                <rect x="2" y="11" width="7" height="7" rx="1.5" fill="#FFE66D"/>
                <rect x="11" y="11" width="7" height="7" rx="1.5" fill="#95E1D3"/>
              </svg>
            </div>
            <span class="ml-3 font-medium">{{ $t('workspace.community_resources') }}</span>
          </a>
        </div>

        <!-- 分割线 -->
        <div class="pt-4 pb-2">
          <div class="border-t border-gray-200 dark:border-[#333333]"></div>
        </div>

        <div class="pt-2">
          <h5 class="px-3 text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">{{ $t('workspace.team_space') }}</h5>
          <nav class="mt-2 space-y-1">
            <a v-for="t in teams" :key="t.id" href="#" class="flex items-center px-3 py-2 text-secondary dark:text-[#E0E0E0] hover:bg-gray-100 dark:hover:bg-[#2C2C2E] rounded-md transition-colors" @click.prevent="currentTeamId=t.id; setSection('team')">
              <div class="w-6 h-6 flex items-center justify-center">
                <img v-if="t.icon" :src="t.icon" class="w-6 h-6 rounded-full object-cover" />
                <fa v-else :icon="['fas','users']" />
              </div>
              <span class="ml-3 font-medium">{{ t.name }}</span>
            </a>
            <a href="#" class="flex items-center px-3 py-2 text-gray-400 dark:text-gray-400 hover:text-primary dark:hover:text-white rounded-md transition-colors" @click.prevent="openTeamCreate">
              <fa :icon="['fas','plus-circle']" class="w-6 text-center" />
              <span class="ml-3 font-medium text-sm">{{ $t('workspace.create_team') }}</span>
            </a>
          </nav>
        </div>
      </div>

      <div class="p-4 border-t border-gray-200 dark:border-[#3A3A3C]">
        <a href="#" class="flex items-center px-3 py-2 text-secondary dark:text-[#E0E0E0] hover:bg-gray-100 dark:hover:bg-[#2C2C2E] rounded-md transition-colors" @click.prevent="setSection('recycle')">
          <fa :icon="['fas','trash']" class="w-6 text-center" />
          <span class="ml-3 font-medium">{{ $t('workspace.recycle') }}</span>
        </a>
        <div class="mt-4 p-3 bg-brand-green/10 rounded-lg text-center cursor-pointer" @click="openUpgrade">
          <p class="text-sm font-semibold text-brand-green">{{ $t('workspace.unlock_ai') }}</p>
          <a href="#" class="text-xs text-brand-green/80 hover:underline" @click.prevent="openUpgrade">{{ $t('workspace.upgrade_pro') }}</a>
        </div>
      </div>
    </aside>

    <div class="flex-1 flex flex-col">
      <header class="relative z-50 h-16 bg-white/80 backdrop-blur-lg border-b border-gray-200 flex items-center justify-between px-8 dark:bg-[#2C2C2E]/80 dark:border-[#3A3A3C]">
        <div class="relative w-full max-w-md">
          <fa :icon="['fas','search']" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input v-model="headerSearch" type="text" :placeholder="$t('workspace.search_placeholder')" class="w-full bg-light-gray border border-transparent focus:bg-white focus:outline-none focus-visible:outline-none focus:ring-0 focus:border-transparent rounded-lg py-2 pl-11 pr-4 transition-colors dark:bg-black/30 dark:text-[#E0E0E0] dark:placeholder-gray-500 dark:focus:bg-[#2C2C2E] dark:border-transparent dark:focus:border-transparent">
        </div>
        <div class="flex items-center space-x-6">
          <button class="text-gray-500 hover:text-primary transition-colors dark:text-gray-400 dark:hover:text-white">
            <fa :icon="['fas','question-circle']" class="fa-lg" />
          </button>
          <div class="relative">
            <button class="relative text-gray-500 hover:text-primary transition-colors dark:text-gray-400 dark:hover:text-white" @click.stop="toggleNotify">
              <fa :icon="['fas','bell']" class="fa-lg" />
              <span v-if="unreadCount>0" class="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            <div v-if="notifyOpen" class="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
              <div class="px-4 py-3 flex items-center justify-between">
                <div class="font-semibold text-primary dark:text-white">{{ $t('workspace.notifications') }}</div>
                <button class="text-xs px-2 py-1 rounded-md border border-gray-300 text-black hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]" @click.stop="clearNotifications">{{ $t('workspace.clear') }}</button>
              </div>
              <div class="border-t border-gray-200 dark:border-[#3A3A3C]">
                <div v-for="n in notifications" :key="n.id" class="flex items-center justify-between px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" :class="!n.read ? 'bg-brand-green/5' : ''">
                  <div class="flex items-center gap-4 mt-6">
                    <div class="w-7 h-7 rounded-md bg-light-gray flex items-center justify-center dark:bg-[#1E1E1E]">
                      <fa :icon="['fas', n.icon]" class="text-gray-600 text-sm dark:text-[#E0E0E0]" />
                    </div>
                    <div>
                      <div class="text-sm font-medium text-primary dark:text-white flex items-center gap-2">
                        <span>{{ n.title }}</span>
                        <span v-if="!n.read" class="text-[10px] px-1.5 py-0.5 rounded bg-brand-green/10 text-brand-green">{{ $t('workspace.new_badge') }}</span>
                      </div>
                      <div class="text-xs text-secondary">{{ n.time }}</div>
                    </div>
                  </div>
                  <button class="text-xs text-secondary hover:text-primary dark:hover:text-white">{{ $t('workspace.view') }}</button>
                </div>
              </div>
            </div>
          </div>
          <button class="text-gray-500 hover:text-primary transition-colors dark:text-gray-400 dark:hover:text-white" @click="toggleTheme">
            <fa :icon="['fas', theme==='dark' ? 'sun' : 'moon']" />
          </button>
          <div class="relative">
            <button class="flex items-center space-x-2" @click.stop="toggleUserMenu">
              <img src="https://i.pravatar.cc/40?u=a042581f4e29026704d" alt="User Avatar" class="w-8 h-8 rounded-full border-2 border-transparent hover:border-brand-green transition-all">
            </button>
            <div v-if="userMenuOpen" class="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
              <div class="px-4 py-3 flex items-center justify-between">
                <div>
                  <div class="font-semibold text-primary dark:text-white">{{ accountName }}</div>
                  <div class="text-xs text-secondary">{{ accountEmail }}</div>
                </div>
                <div class="w-8 h-8 rounded-full bg-brand-green text-white flex items-center justify-center font-bold">{{ accountName.charAt(0) }}</div>
              </div>
              <div class="border-t border-gray-200 dark:border-[#3A3A3C]">
                <button class="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" @click.stop="openAccount">
                  <span class="flex items-center gap-2"><fa :icon="['fas','user']" /> {{ $t('workspace.account') }}</span>
                  <fa :icon="['fas','chevron-right']" class="text-xs text-gray-400" />
                </button>
                <button class="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" @click.stop="openSettings">
                  <span class="flex items-center gap-2"><fa :icon="['fas','gear']" /> {{ $t('workspace.settings') }}</span>
                  <fa :icon="['fas','chevron-right']" class="text-xs text-gray-400" />
                </button>
                <button class="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#3A3A3C]">
                  <span class="flex items-center gap-2"><fa :icon="['fas','book']" /> {{ $t('workspace.help_docs') }}</span>
                  <fa :icon="['fas','chevron-right']" class="text-xs text-gray-400" />
                </button>
                <button class="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#3A3A3C]">
                  <span class="flex items-center gap-2"><fa :icon="['fas','question-circle']" /> {{ $t('workspace.support') }}</span>
                  <fa :icon="['fas','chevron-right']" class="text-xs text-gray-400" />
                </button>
                <button class="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#3A3A3C]">
                  <span class="flex items-center gap-2"><fa :icon="['fas','sitemap']" /> {{ $t('workspace.roadmap') }}</span>
                  <fa :icon="['fas','chevron-right']" class="text-xs text-gray-400" />
                </button>
                <button class="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#3A3A3C]">
                  <span class="flex items-center gap-2"><fa :icon="['fab','github']" /> GitHub</span>
                  <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">118,905</span>
                </button>
                <button class="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" @click.stop="openAbout">
                  <span class="flex items-center gap-2"><fa :icon="['fas','circle-info']" /> {{ $t('workspace.about') }}</span>
                  <span class="text-xs text-secondary">1.7.2</span>
                </button>
              </div>
              <div class="border-t border-gray-200 px-4 py-3 dark:border-[#3A3A3C]">
                <div class="text-xs mb-2 text-secondary">{{ $t('workspace.theme') }}</div>
                <div class="flex items-center gap-2">
                  <button class="px-2.5 py-1.5 rounded-md border text-xs flex items-center gap-1 hover:bg-gray-100 dark:border-[#3A3A3C] dark:hover:bg-[#3A3A3C]" @click="setTheme('light')"><fa :icon="['fas','sun']" /> {{ $t('workspace.theme_light') }}</button>
                  <button class="px-2.5 py-1.5 rounded-md border text-xs flex items-center gap-1 hover:bg-gray-100 dark:border-[#3A3A3C] dark:hover:bg-[#3A3A3C]" @click="setTheme('dark')"><fa :icon="['fas','moon']" /> {{ $t('workspace.theme_dark') }}</button>
                </div>
              </div>
              <div class="border-t border-gray-200 dark:border-[#3A3A3C]">
                <button class="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-[#3A3A3C]" @click.stop="logout">
                  {{ $t('workspace.logout') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 p-8 overflow-y-auto overflow-x-hidden no-scrollbar">
        <div class="flex justify-between items-center mb-8">
          <div>
            <span class="text-sm text-secondary dark:text-gray-400">{{ currentSection==='team' ? $t('workspace.team_space') : $t('workspace.personal_space') }}</span>
            <h1 class="text-3xl font-bold text-primary dark:text-white">{{ sectionTitle }}</h1>
          </div>
          <div class="flex items-center space-x-2">
            <button class="px-3 py-1 text-sm rounded-md border border-gray-200 bg-white text-primary hover:bg-gray-50 dark:bg-[#2C2C2E] dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]" @click="openAddMember">{{ $t('workspace.add_team_member') }}</button>
            <div class="flex items-center bg-white p-1 rounded-lg border border-gray-200 dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
              <button class="px-3 py-1 text-sm rounded-md" :class="viewMode==='grid' ? 'font-semibold text-white bg-brand-green' : 'text-secondary hover:text-primary dark:text-gray-300 dark:hover:text-white'" @click="viewMode='grid'"><fa :icon="['fas','th-large']" /></button>
              <button class="px-3 py-1 text-sm rounded-md" :class="viewMode==='list' ? 'font-semibold text-white bg-brand-green' : 'text-secondary hover:text-primary dark:text-gray-300 dark:hover:text-white'" @click="viewMode='list'"><fa :icon="['fas','list']" /></button>
            </div>
            <div class="relative">
              <button class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 dark:bg-[#2C2C2E] dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]" @click.stop="sortMenuOpen=!sortMenuOpen">
                {{ sortLabel }} <fa :icon="['fas','chevron-down']" class="ml-2 text-xs" />
              </button>
              <div v-if="sortMenuOpen" class="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-xl z-20 dark:bg-[#2C2C2E] dark:border-[#3A3A3C]" @click.stop>
                <div class="px-4 py-3 text-sm font-semibold text-primary dark:text-white">{{ $t('workspace.sort') }}</div>
                <div class="border-t border-gray-200 dark:border-[#3A3A3C]"></div>
                <div class="p-2 text-sm">
                  <button class="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" :class="sortOption==='modified' ? 'bg-brand-green/10 text-brand-green' : ''" @click.stop="sortOption='modified'">{{ $t('workspace.modified') }}</button>
                  <button class="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" :class="sortOption==='name' ? 'bg-brand-green/10 text-brand-green' : ''" @click.stop="sortOption='name'">{{ $t('workspace.name') }}</button>
                  <button class="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#3A3A3C]" :class="sortOption==='created' ? 'bg-brand-green/10 text-brand-green' : ''" @click.stop="sortOption='created'">{{ $t('workspace.created') }}</button>
                  <div class="mt-2 flex items-center justify-between px-3">
                    <span class="text-secondary dark:text-gray-300">{{ $t('workspace.order') }}</span>
                    <div class="flex items-center gap-2">
                      <button class="px-2 py-1 rounded-md border text-xs" :class="sortOrder==='asc' ? 'border-brand-green text-brand-green' : 'border-gray-300 text-secondary'" @click.stop="sortOrder='asc'">{{ $t('workspace.ascending') }}</button>
                      <button class="px-2 py-1 rounded-md border text-xs" :class="sortOrder==='desc' ? 'border-brand-green text-brand-green' : 'border-gray-300 text-secondary'" @click.stop="sortOrder='desc'">{{ $t('workspace.descending') }}</button>
                    </div>
                  </div>
                </div>
                <div class="border-t border-gray-200 dark:border-[#3A3A3C] p-3 flex items-center justify-end gap-2">
                  <button class="px-3 py-1.5 rounded-md border border-gray-300 text-black hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]" @click="sortOption='modified'; sortOrder='desc'; sortMenuOpen=false">{{ $t('workspace.reset') }}</button>
                  <button class="px-3 py-1.5 rounded-md bg-brand-green text-white hover:bg-brand-green/90" @click="sortMenuOpen=false">{{ $t('workspace.apply') }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="currentSection==='recycle'" class="space-y-4">
          <div class="mb-2 flex items-center gap-2">
            <fa :icon="['fas','search']" class="text-gray-400" />
            <input v-model="recycleSearch" type="text" :placeholder="$t('workspace.search_recycle')" class="flex-1 bg-light-gray border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-0 focus:border-brand-green dark:bg-[#1E1E1E] dark:text-[#E0E0E0] dark:border-[#3A3A3C]" />
            <button class="px-3 py-2 rounded-md border border-gray-300 text-black hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]" @click="clearRecycle">{{ $t('workspace.empty_recycle') }}</button>
          </div>
          <div v-if="viewMode==='grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div v-for="d in filteredRecycle" :key="d.id" class="bg-white rounded-lg shadow-sm border border-gray-200 relative dark:bg-[#12161a] dark:border-[#333333]">
              <div class="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                <img :src="d.thumbnail" class="w-full h-full object-cover" />
              </div>
              <div class="p-4">
                <div class="font-semibold text-primary truncate dark:text-white">{{ d.name }}</div>
                <div class="text-xs text-secondary mt-1">{{ $t('workspace.deleted_at') }}：{{ d.deletedAt }}</div>
                <div class="mt-3 flex items-center gap-2">
                  <button class="px-3 py-1.5 rounded-md border border-gray-300 text-black hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]" @click="restoreRecycleItem(d.id)">{{ $t('workspace.restore') }}</button>
                  <button class="px-3 py-1.5 rounded-md border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-[#3A3A3C]" @click="deleteRecycleItem(d.id)">{{ $t('workspace.delete_permanent') }}</button>
                </div>
              </div>
            </div>
            <div v-if="filteredRecycle.length===0" class="col-span-full">
              <div class="rounded-lg border border-gray-200 bg-white p-6 text-center text-secondary dark:bg-[#12161a] dark:border-[#333333] dark:text-gray-400">{{ $t('workspace.recycle_empty') }}</div>
            </div>
          </div>
          <div v-else class="rounded-lg border border-gray-200 bg-white dark:bg-[#12161a] dark:border-[#333333]">
            <div v-for="d in filteredRecycle" :key="d.id" class="flex items-center justify-between px-4 py-3 border-b last:border-b-0 border-gray-200 dark:border-[#333333]">
              <div class="flex items-center gap-3">
                <div class="w-14 h-8 bg-gray-100 rounded overflow-hidden"><img :src="d.thumbnail" class="w-full h-full object-cover" /></div>
                <div>
                  <div class="font-medium text-primary dark:text-white">{{ d.name }}</div>
                  <div class="text-xs text-secondary">{{ $t('workspace.deleted_at') }}：{{ d.deletedAt }}</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button class="px-3 py-1.5 rounded-md border border-gray-300 text-black hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]" @click="restoreRecycleItem(d.id)">{{ $t('workspace.restore') }}</button>
                <button class="px-3 py-1.5 rounded-md border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-[#3A3A3C]" @click="deleteRecycleItem(d.id)">{{ $t('workspace.delete_permanent') }}</button>
              </div>
            </div>
            <div v-if="filteredRecycle.length===0" class="px-4 py-6 text-center text-secondary">{{ $t('workspace.recycle_empty') }}</div>
          </div>
        </div>
          <div v-else>
          <div v-if="viewMode==='grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div v-for="p in sectionList" :key="p.id" class="bg-white rounded-lg shadow-sm border border-gray-200 relative dark:bg-[#12161a] dark:border-[#333333] group hover:shadow-md transition-all">
              <router-link :to="{ path: '/studio', query: { id: p.id } }">
                <div class="aspect-video bg-gray-100 rounded-t-lg overflow-hidden relative">
                  <img :src="p.thumbnail" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Project thumbnail">
                  <div class="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white font-medium">
                    {{ p.episodes }} {{ $t('workspace.episodes') }}
                  </div>
                  <div class="absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide" 
                    :class="{
                      'bg-yellow-100 text-yellow-700': p.status === 'draft',
                      'bg-blue-100 text-blue-700': p.status === 'scripting',
                      'bg-purple-100 text-purple-700': p.status === 'rendering',
                      'bg-green-100 text-green-700': p.status === 'published'
                    }">
                    {{ $t('workspace.status.' + (p.status || 'draft')) }}
                  </div>
                </div>
                <div class="p-4">
                  <h3 class="font-semibold text-primary truncate dark:text-white text-lg">{{ p.name }}</h3>
                  <p class="text-sm text-secondary mt-1 dark:text-gray-400 flex items-center gap-2">
                    <fa :icon="['fas','clock']" class="text-xs" /> {{ p.updated || p.time }}
                  </p>
                </div>
              </router-link>
              <button data-project-menu-button class="absolute top-2 right-2 px-2 py-1 rounded-md bg-transparent text-secondary hover:text-primary dark:text-[#E0E0E0] dark:hover:text-white" @click.stop="toggleMenu(p.id)">
                <span class="inline-block align-middle text-xl leading-none">…</span>
              </button>
              <div v-if="openMenuId===p.id" data-project-menu class="absolute top-10 right-2 z-20 w-40 rounded-xl border border-gray-200 bg-white shadow-xl dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
                <button class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#3A3A3C] dark:text-[#E0E0E0]" @click.stop="renameProject(p.id)">{{ $t('workspace.rename') }}</button>
                <button class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#3A3A3C] dark:text-[#E0E0E0]" @click.stop="shareProject(p.id)">{{ $t('workspace.share') }}</button>
                <button class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#3A3A3C] dark:text-[#E0E0E0]" @click.stop="openDuplicate(p.id)">{{ $t('workspace.duplicate') }}</button>
                <div class="border-t border-gray-200 dark:border-[#333333]"></div>
                <button class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-[#3A3A3C]" @click.stop="deleteProject(p.id)">{{ $t('workspace.delete') }}</button>
              </div>
            </div>
            <a href="#" @click.prevent="openCreateModal" class="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-brand-green hover:text-brand-green transition-colors dark:border-gray-700 dark:text-gray-400">
              <fa :icon="['fas','plus']" class="text-3xl" />
              <span class="mt-2 font-semibold">{{ $t('workspace.create_new_project') }}</span>
            </a>
            <div v-if="filteredProjects.length===0" class="col-span-full">
              <div class="rounded-lg border border-gray-200 bg-white p-6 text-center text-secondary dark:bg-[#12161a] dark:border-[#333333] dark:text-gray-400">{{ $t('workspace.no_drafts') }}</div>
            </div>
          </div>
          <div v-else class="rounded-lg border border-gray-200 bg-white dark:bg-[#12161a] dark:border-[#333333]">
            <div v-for="p in sectionList" :key="p.id" class="flex items-center justify-between px-4 py-3 border-b last:border-b-0 border-gray-200 dark:border-[#333333] hover:bg-gray-50 dark:hover:bg-[#1E1E1E] transition-colors">
              <router-link :to="{ path: '/studio', query: { id: p.id } }" class="flex items-center gap-4 flex-1">
                <div class="w-24 h-14 bg-gray-100 rounded-lg overflow-hidden relative">
                  <img :src="p.thumbnail" class="w-full h-full object-cover" />
                  <div class="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white">
                    {{ p.episodes }} {{ $t('workspace.episodes') }}
                  </div>
                </div>
                <div>
                  <div class="font-medium text-primary dark:text-white text-base">{{ p.name }}</div>
                  <div class="flex items-center gap-3 mt-1">
                    <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-[#333333] dark:text-gray-300">
                      {{ $t('workspace.status.' + (p.status || 'draft')) }}
                    </span>
                    <span class="text-xs text-secondary">{{ $t('workspace.modified_at') }}：{{ p.updated || p.time }}</span>
                  </div>
                </div>
              </router-link>
              <div class="relative">
                <button data-project-menu-button class="px-2 py-1 rounded-md bg-transparent text-secondary hover:text-primary dark:text-[#E0E0E0] dark:hover:text-white" @click.stop="toggleMenu(p.id)">
                  <span class="inline-block align-middle text-xl leading-none">…</span>
                </button>
                <div v-if="openMenuId===p.id" data-project-menu class="absolute right-0 mt-2 z-20 w-40 rounded-xl border border-gray-200 bg-white shadow-xl dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
                  <button class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#3A3A3C] dark:text-[#E0E0E0]" @click.stop="renameProject(p.id)">{{ $t('workspace.rename') }}</button>
                  <button class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#3A3A3C] dark:text-[#E0E0E0]" @click.stop="shareProject(p.id)">{{ $t('workspace.share') }}</button>
                  <button class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#3A3A3C] dark:text-[#E0E0E0]" @click.stop="openDuplicate(p.id)">{{ $t('workspace.duplicate') }}</button>
                  <div class="border-t border-gray-200 dark:border-[#333333]"></div>
                  <button class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-[#3A3A3C]" @click.stop="deleteProject(p.id)">{{ $t('workspace.delete') }}</button>
                </div>
              </div>
            </div>
            <div v-if="sectionList.length===0" class="px-4 py-6 text-center text-secondary">{{ $t('workspace.no_content') }}</div>
          </div>
        </div>

        <div v-if="showCreateModal" class="fixed inset-0 z-30 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/40"></div>
          <div class="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 p-6 dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
            <h3 class="text-xl font-semibold text-primary dark:text-white">{{ $t('workspace.new_design') }}</h3>
            <div class="mt-4 space-y-4">
              <div>
                <label class="block text-sm font-medium text-secondary dark:text-gray-300">{{ $t('workspace.design_name') }}</label>
                <input v-model="createName" type="text" class="mt-1 w-full bg-light-gray border rounded-lg py-2 px-3 focus:outline-none focus:ring-0 dark:bg-black/30 dark:text-[#E0E0E0]" :class="nameError ? 'border-red-500 focus:border-red-500 dark:border-red-500' : 'border-gray-300 focus:border-brand-green dark:border-[#3A3A3C]'" :placeholder="$t('workspace.enter_design_name')" required>
                <p v-if="nameError" class="mt-1 text-xs text-red-500">{{ nameError }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-secondary dark:text-gray-300">{{ $t('workspace.permission_settings') }}</label>
                <div class="mt-2 flex items-center gap-4 border rounded-lg px-3 py-2" :class="permError ? 'border-red-500 dark:border-red-500' : 'border-transparent dark:border-transparent'">
                  <label class="flex items-center gap-2 text-secondary dark:text-gray-300"><input type="radio" value="private" v-model="createPerm" class="accent-brand-green" required> {{ $t('workspace.private') }}</label>
                  <label class="flex items-center gap-2 text-secondary dark:text-gray-300"><input type="radio" value="public" v-model="createPerm" class="accent-brand-green" required> {{ $t('workspace.public') }}</label>
                  <label class="flex items-center gap-2 text-secondary dark:text-gray-300"><input type="radio" value="team" v-model="createPerm" class="accent-brand-green" required> {{ $t('workspace.team') }}</label>
                </div>
                <p v-if="permError" class="mt-1 text-xs text-red-500">{{ permError }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-secondary dark:text-gray-300">{{ $t('workspace.description') }}</label>
                <textarea v-model="createDesc" rows="3" class="mt-1 w-full bg-light-gray border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-0 focus:border-brand-green dark:bg-black/30 dark:text-[#E0E0E0] dark:border-[#3A3A3C]" :placeholder="$t('workspace.optional')"></textarea>
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-3">
              <button class="px-4 py-2 rounded-lg border border-gray-300 text-secondary hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-gray-300 dark:hover:bg-[#3A3A3C]" @click="cancelCreate">{{ $t('workspace.cancel') }}</button>
              <button class="px-4 py-2 rounded-lg" :class="!isValid ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-300' : 'bg-brand-green text-white hover:bg-brand-green/90'" :disabled="!isValid" @click="confirmCreate">{{ $t('workspace.confirm') }}</button>
            </div>
          </div>
        </div>
        <div v-if="showDuplicate" class="fixed inset-0 z-30 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/40" @click="cancelDuplicate"></div>
          <div class="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 p-6 dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
            <h3 class="text-xl font-semibold text-primary dark:text-white">{{ $t('workspace.duplicate_project') }}</h3>
            <div class="mt-4 space-y-4">
              <div>
                <label class="block text-sm font-medium text-secondary dark:text-gray-300">{{ $t('workspace.name_label') }}</label>
                <input v-model="duplicateName" type="text" class="mt-1 w-full bg-light-gray border rounded-lg py-2 px-3 focus:outline-none focus:ring-0 dark:bg-black/30 dark:text-[#E0E0E0]" :class="duplicateError ? 'border-red-500 focus:border-red-500 dark:border-red-500' : 'border-gray-300 focus:border-brand-green dark:border-[#3A3A3C]'" :placeholder="$t('workspace.enter_name_placeholder')">
                <p v-if="duplicateError" class="mt-1 text-xs text-red-500">{{ duplicateError }}</p>
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-3">
              <button class="px-4 py-2 rounded-lg border border-gray-300 text-secondary hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-gray-300 dark:hover:bg-[#3A3A3C]" @click="cancelDuplicate">{{ $t('workspace.cancel') }}</button>
              <button class="px-4 py-2 rounded-lg bg-brand-green text-white hover:bg-brand-green/90" @click="confirmDuplicate">{{ $t('workspace.create') }}</button>
            </div>
          </div>
        </div>
      </main>
      <teleport to="body">
        <div v-if="showSettings" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/30 backdrop-blur-md" @click="closeSettings"></div>
          <div class="relative w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
            <div class="flex h-full">
              <aside class="w-64 border-r border-gray-200 p-4 overflow-y-auto no-scrollbar dark:border-[#3A3A3C]">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-full bg-brand-green text-white flex items-center justify-center font-bold">胡</div>
                <div>
                  <div class="font-semibold text-primary dark:text-white">{{ $t('workspace.workspace_name') }}</div>
                  <div class="text-xs text-secondary">{{ $t('workspace.members_projects', { m: 8, p: 24 }) }}</div>
                </div>
              </div>
              <nav class="space-y-1">
                <button class="w-full text-left px-3 py-2 rounded-md" :class="settingsTab==='workspace' ? 'bg-brand-green/10 text-brand-green' : 'text-secondary hover:bg-gray-100 dark:hover:bg-[#3A3A3C] dark:text-[#E0E0E0]'" @click="settingsTab='workspace'">{{ $t('workspace.settings_workspace') }}</button>
                <button class="w-full text-left px-3 py-2 rounded-md" :class="settingsTab==='providers' ? 'bg-brand-green/10 text-brand-green' : 'text-secondary hover:bg-gray-100 dark:hover:bg-[#3A3A3C] dark:text-[#E0E0E0]'" @click="settingsTab='providers'">{{ $t('workspace.providers') }}</button>
                <button class="w-full text-left px-3 py-2 rounded-md" :class="settingsTab==='data' ? 'bg-brand-green/10 text-brand-green' : 'text-secondary hover:bg-gray-100 dark:hover:bg-[#3A3A3C] dark:text-[#E0E0E0]'" @click="settingsTab='data'">{{ $t('workspace.data_sources') }}</button>
                <button class="w-full text-left px-3 py-2 rounded-md" :class="settingsTab==='api' ? 'bg-brand-green/10 text-brand-green' : 'text-secondary hover:bg-gray-100 dark:hover:bg-[#3A3A3C] dark:text-[#E0E0E0]'" @click="settingsTab='api'">{{ $t('workspace.api_extensions') }}</button>
                <button class="w-full text-left px-3 py-2 rounded-md" :class="settingsTab==='general' ? 'bg-brand-green/10 text-brand-green' : 'text-secondary hover:bg-gray-100 dark:hover:bg-[#3A3A3C] dark:text-[#E0E0E0]'" @click="settingsTab='general'">{{ $t('workspace.general') }}</button>
                <button class="w-full text-left px-3 py-2 rounded-md" :class="settingsTab==='language' ? 'bg-brand-green/10 text-brand-green' : 'text-secondary hover:bg-gray-100 dark:hover:bg-[#3A3A3C] dark:text-[#E0E0E0]'" @click="settingsTab='language'">{{ $t('workspace.language') }}</button>
              </nav>
            </aside>
              <section class="flex-1 p-6 overflow-y-auto no-scrollbar">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-semibold text-primary dark:text-white">{{ settingsTab==='general' ? $t('workspace.general') : $t('workspace.settings') }}</h3>
                <button class="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-100 dark:border-[#3A3A3C] dark:hover:bg-[#3A3A3C]" @click="closeSettings">{{ $t('workspace.close') }}</button>
              </div>
              <div v-if="settingsTab==='workspace'" class="space-y-6">
                <div class="p-4 rounded-xl border bg-white dark:bg-[#1E1E1E] dark:border-[#333333]">
                  <div class="font-semibold mb-2">{{ $t('workspace.admin') }}</div>
                  <div class="flex items-center justify-between py-2">
                    <div class="flex items-center gap-3">
                      <img src="https://i.pravatar.cc/40?u=member1" class="w-8 h-8 rounded-full" />
                      <div>
                        <div class="font-medium flex items-center">
                          {{ adminName }}
                          <button class="ml-2 text-xs text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white" @click="editAdminName"><fa :icon="['fas','pen-to-square']" /></button>
                        </div>
                        <div class="text-xs text-secondary">{{ adminEmail }}</div>
                      </div>
                    </div>
                    <div class="text-xs text-secondary dark:text-gray-400">{{ $t('workspace.admin') }}</div>
                </div>
              </div>
              
              <div class="p-4 rounded-xl border bg-white dark:bg-[#1E1E1E] dark:border-[#333333]">
                <div class="font-semibold mb-2">{{ $t('workspace.add_member') }}</div>
                <div class="flex gap-2">
                  <input type="email" :placeholder="$t('workspace.invite_email_placeholder')" class="flex-1 bg-light-gray border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-0 focus:border-brand-green dark:bg-black/30 dark:text-[#E0E0E0] dark:border-[#3A3A3C]" />
                  <button class="px-3 py-2 bg-brand-green text-white rounded-md">{{ $t('workspace.invite') }}</button>
                </div>
              </div>
              <div class="p-4 rounded-xl border bg-white dark:bg-[#1E1E1E] dark:border-[#333333]">
                <div class="font-semibold mb-2">{{ $t('workspace.search') }} {{ $t('workspace.members') }}</div>
                <div class="flex gap-2">
                  <input v-model="searchQuery" type="text" :placeholder="$t('workspace.search_name_email_role')" class="flex-1 bg-light-gray border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-0 focus:border-brand-green dark:bg-black/30 dark:text-[#E0E0E0] dark:border-[#3A3A3C]" />
                  <button class="px-3 py-2 bg-brand-green text-white rounded-md">{{ $t('workspace.search') }}</button>
                </div>
              </div>
              <div class="p-4 rounded-xl border bg-white dark:bg-[#1E1E1E] dark:border-[#333333]">
                <div class="font-semibold mb-2">{{ $t('workspace.members') }}</div>
                <div class="grid grid-cols-[minmax(0,1fr)_minmax(160px,auto)_minmax(120px,auto)] items-center justify-items-start gap-8 text-xs text-secondary px-1 py-1 border-b border-gray-200 dark:border-[#333333]">
                  <div>{{ $t('workspace.full_name') }}</div>
                  <div>{{ $t('workspace.last_active_time') }}</div>
                  <div>{{ $t('workspace.role') }}</div>
                </div>
                <div class="space-y-3">
                  <div v-for="m in filteredMembers" :key="m.id">
                    <div class="grid grid-cols-[minmax(0,1fr)_minmax(160px,auto)_minmax(120px,auto)] items-center justify-items-start py-2 gap-8">
                      <div class="flex items-center gap-3">
                        <img :src="'https://i.pravatar.cc/40?u=' + m.id" class="w-8 h-8 rounded-full" />
                        <div>
                            <div class="font-medium flex items-center">
                              {{ m.name }}
                              <button class="ml-2 text-xs text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white" @click="editMemberName(m.id)"><fa :icon="['fas','pen-to-square']" /></button>
                            </div>
                            <div class="text-xs text-secondary">{{ m.email }}</div>
                          </div>
                        </div>
                        <div class="text-xs text-secondary dark:text-gray-400">{{ m.lastActive }}</div>
                        <div>
                          <button class="text-xs text-secondary hover:bg-gray-100 px-2 py-1 rounded-md dark:text-gray-400 dark:hover:bg-[#3A3A3C]" @click.stop="toggleRoleMenu(m.id)">{{ m.role }}</button>
                        </div>
                      </div>
                      <div v-if="roleMenuForId===m.id" class="mt-2 border-t border-gray-200 dark:border-[#333333] pt-3">
                        <div class="rounded-xl border bg-white dark:bg-[#1E1E1E] dark:border-[#333333] p-2">
                          <button class="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-[#2C2C2E] flex items-start gap-2" @click.stop="setRole(m.id,'admin')">
                            <fa v-if="m.role==='admin'" :icon="['fas','check']" class="text-brand-green mt-0.5" />
                            <div>
                              <div class="font-medium">{{ $t('workspace.admin') }}</div>
                              <div class="text-xs text-secondary">{{ $t('workspace.admin_can_manage') }}</div>
                            </div>
                          </button>
                          <button class="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-[#2C2C2E] flex items-start gap-2" @click.stop="setRole(m.id,'editor')">
                            <fa v-if="m.role==='editor'" :icon="['fas','check']" class="text-brand-green mt-0.5" />
                            <div>
                              <div class="font-medium">{{ $t('workspace.editor') }}</div>
                              <div class="text-xs text-secondary">{{ $t('workspace.can_create_edit') }}</div>
                            </div>
                          </button>
                          <button class="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-[#2C2C2E] flex items-start gap-2" @click.stop="setRole(m.id,'member')">
                            <fa v-if="m.role==='member'" :icon="['fas','check']" class="text-brand-green mt-0.5" />
                            <div>
                              <div class="font-medium">{{ $t('workspace.member') }}</div>
                              <div class="text-xs text-secondary">{{ $t('workspace.member_can_use') }}</div>
                            </div>
                          </button>
                          <div class="border-t border-gray-200 dark:border-[#333333] my-1"></div>
                          <button class="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-[#2C2C2E] text-red-600 dark:text-red-400" @click.stop="removeMember(m.id)">{{ $t('workspace.remove_from_team') }}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else-if="settingsTab==='providers'" class="space-y-4">
                <div class="p-4 rounded-xl border bg-white dark:bg-[#1E1E1E] dark:border-[#333333]">
                  <div class="font-semibold mb-4">{{ $t('workspace.providers') }}</div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div v-for="p in providers" :key="p.id" class="rounded-xl border border-gray-200 bg-white p-4 dark:bg-[#12161a] dark:border-[#333333]">
                      <div class="flex items-start gap-3">
                        <picture>
                          <source :srcset="`https://unpkg.com/@lobehub/icons-static-png@latest/dark/${p.slug}.png`" media="(prefers-color-scheme: dark)" />
                          <img :src="`https://unpkg.com/@lobehub/icons-static-png@latest/light/${p.slug}.png`" class="w-10 h-10 rounded-md" alt="logo" />
                        </picture>
                        <div>
                          <div class="font-semibold text-primary dark:text-white">{{ p.name }}</div>
                          <div class="text-sm text-secondary mt-1 dark:text-gray-400">{{ p.desc }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else-if="settingsTab==='data'" class="space-y-4">
                <div class="p-4 rounded-xl border bg-white dark:bg-[#1E1E1E] dark:border-[#333333]">
                  <div class="font-semibold mb-2">{{ $t('workspace.data_sources') }}</div>
                  <div class="text-sm text-secondary">{{ $t('workspace.data_sources_desc') }}</div>
                </div>
              </div>
              <div v-else-if="settingsTab==='api'" class="space-y-4">
                <div class="p-4 rounded-xl border bg-white dark:bg-[#1E1E1E] dark:border-[#333333]">
                  <div class="font-semibold mb-2">{{ $t('workspace.api_extensions') }}</div>
                  <div class="text-sm text-secondary">{{ $t('workspace.api_extensions_desc') }}</div>
                </div>
              </div>
              <div v-else-if="settingsTab==='general'" class="space-y-4">
                <div class="p-4 rounded-xl border bg-white dark:bg-[#1E1E1E] dark:border-[#333333]">
                  <div class="font-semibold mb-2">{{ $t('workspace.general_settings') }}</div>
                  <div class="flex items-center gap-3 text-sm">
                    <span>{{ $t('workspace.theme') }}</span>
                    <button class="px-2 py-1 rounded-md border text-xs hover:bg-gray-100 dark:border-[#3A3A3C] dark:hover:bg-[#3A3A3C]" @click="setTheme('light')">{{ $t('workspace.theme_light') }}</button>
                    <button class="px-2 py-1 rounded-md border text-xs hover:bg-gray-100 dark:border-[#3A3A3C] dark:hover:bg-[#3A3A3C]" @click="setTheme('dark')">{{ $t('workspace.theme_dark') }}</button>
                    <button class="px-2 py-1 rounded-md border text-xs hover:bg-gray-100 dark:border-[#3A3A3C] dark:hover:bg-[#3A3A3C]" @click="setTheme('system')">{{ $t('workspace.theme_system') }}</button>
                  </div>
                </div>
              </div>
              <div v-else-if="settingsTab==='language'" class="space-y-8">
                <div class="text-2xl font-bold text-primary dark:text-white">{{ $t('workspace.language') }}</div>
                <div>
                  <div class="text-sm font-semibold text-secondary dark:text-gray-300 mb-3">{{ $t('workspace.ui_language_label') }}</div>
                  <div class="relative">
                    <div class="bg-light-gray rounded-lg px-4 py-3 flex justify-between items-center cursor-pointer dark:bg-[#1E1E1E]" @click.stop="toggleLanguageList">
                      <span class="text-primary dark:text-white font-medium">{{ uiLanguage || $t('workspace.not_selected') }}</span>
                      <button class="text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white"><fa :icon="['fas', languageListOpen ? 'chevron-up' : 'chevron-down']" class="text-sm" /></button>
                    </div>
                    <div v-if="languageListOpen" class="absolute left-0 right-0 mt-2 z-10 bg-white rounded-2xl shadow-2xl border border-gray-200 dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
                      <div class="py-2 max-h-64 overflow-y-auto no-scrollbar">
                        <button v-for="opt in languageOptions" :key="opt" class="w-full text-left px-4 py-2 text-primary hover:bg-gray-100 dark:text-white dark:hover:bg-[#3A3A3C]" @click.stop="chooseLanguage(opt)">{{ opt }}</button>
                      </div>
                    </div>
                  </div>
                </div>
                
              </div>
              </section>
            </div>
          </div>
        </div>
      </teleport>
      <teleport to="body">
        <div v-if="showExtractWizard" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/30 backdrop-blur-md" @click="closeExtractWizard"></div>
          <div class="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
            <div class="p-6">
              <h3 class="text-xl font-semibold text-primary dark:text-white">剧本提炼角色</h3>
              <div v-if="extractStep===1" class="mt-4 space-y-3">
                <div class="text-sm text-secondary dark:text-gray-300">粘贴剧本文本，格式如：张三：台词内容</div>
                <textarea v-model="scriptInput" rows="8" class="w-full bg-light-gray border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-0 focus:border-brand-green dark:bg-[#1E1E1E] dark:text-[#E0E0E0] dark:border-[#3A3A3C]"></textarea>
                <p v-if="extractError" class="text-xs text-red-500">{{ extractError }}</p>
                <div class="flex justify-end gap-3">
                  <button class="px-4 py-2 rounded-lg border border-gray-300 text-secondary hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-gray-300 dark:hover:bg-[#3A3A3C]" @click="closeExtractWizard">取消</button>
                  <button class="px-4 py-2 rounded-lg bg-brand-green text-white hover:bg-brand-green/90" @click="extractCandidates">提炼</button>
                </div>
              </div>
              <div v-else-if="extractStep===2" class="mt-4 space-y-3">
                <div class="text-sm text-secondary dark:text-gray-300">选择需要创建的角色</div>
                <div class="grid grid-cols-2 gap-2">
                  <button v-for="(r,i) in extractedRoles" :key="r.name" class="flex items-center justify-between px-3 py-2 rounded-md border" :class="r.selected ? 'border-brand-green text-brand-green' : 'border-gray-300 text-secondary'" @click="toggleRoleSelected(i)">
                    <span>{{ r.name }}</span>
                    <span v-if="r.selected" class="text-xs">已选</span>
                  </button>
                </div>
                <p v-if="extractError" class="text-xs text-red-500">{{ extractError }}</p>
                <div class="flex justify-between">
                  <button class="px-4 py-2 rounded-lg border border-gray-300 text-secondary hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-gray-300 dark:hover:bg-[#3A3A3C]" @click="prevExtract">上一步</button>
                  <div class="flex gap-3">
                    <button class="px-4 py-2 rounded-lg border border-gray-300 text-secondary hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-gray-300 dark:hover:bg-[#3A3A3C]" @click="closeExtractWizard">取消</button>
                    <button class="px-4 py-2 rounded-lg bg-brand-green text-white hover:bg-brand-green/90" @click="nextExtract">下一步</button>
                  </div>
                </div>
              </div>
              <div v-else class="mt-4 space-y-3">
                <div class="text-sm text-secondary dark:text-gray-300">确认创建以下角色</div>
                <ul class="list-disc pl-6 text-sm">
                  <li v-for="r in extractedRoles.filter(x=>x.selected)" :key="r.name">{{ r.name }}</li>
                </ul>
                <p v-if="extractError" class="text-xs text-red-500">{{ extractError }}</p>
                <div class="flex justify-between">
                  <button class="px-4 py-2 rounded-lg border border-gray-300 text-secondary hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-gray-300 dark:hover:bg-[#3A3A3C]" @click="prevExtract">上一步</button>
                  <div class="flex gap-3">
                    <button class="px-4 py-2 rounded-lg border border-gray-300 text-secondary hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-gray-300 dark:hover:bg-[#3A3A3C]" @click="closeExtractWizard">取消</button>
                    <button class="px-4 py-2 rounded-lg bg-brand-green text-white hover:bg-brand-green/90" @click="confirmExtractCreate">创建</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </teleport>
      <teleport to="body">
        <div v-if="false" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/30 backdrop-blur-md" @click="closeChangeEmail"></div>
          <div class="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
            <div class="p-6 min-h-[360px]">
              <h3 class="text-xl font-semibold text-primary dark:text-white">{{ $t('workspace.change_email') }}</h3>
              <div class="flex items-center gap-6 mt-4 border-b border-gray-200 dark:border-[#3A3A3C]">
                <button class="pb-2 font-medium" :class="changeTab==='email' ? 'text-brand-green border-b-2 border-brand-green' : 'text-secondary hover:text-primary dark:text-[#E0E0E0] dark:hover:text-white'" @click="changeTab='email'">{{ $t('workspace.email_verification') }}</button>
                <button class="pb-2 font-medium" :class="changeTab==='phone' ? 'text-brand-green border-b-2 border-brand-green' : 'text-secondary hover:text-primary dark:text-[#E0E0E0] dark:hover:text-white'" @click="changeTab='phone'">{{ $t('workspace.phone_verification') }}</button>
                <button class="pb-2 font-medium" :class="changeTab==='password' ? 'text-brand-green border-b-2 border-brand-green' : 'text-secondary hover:text-primary dark:text-[#E0E0E0] dark:hover:text-white'" @click="changeTab='password'">{{ $t('workspace.password_verification') }}</button>
              </div>
              <div class="mt-4 space-y-4">
                <div v-if="changeTab==='email'">
                  <input v-model="changeForm.email" type="email" :placeholder="$t('workspace.enter_email_address')" class="w-full bg-light-gray border rounded-lg py-2 px-3 focus:outline-none focus:ring-0 dark:bg-black/30 dark:text-[#E0E0E0]" :class="changeErrors.email ? 'border-red-500 focus:border-red-500 dark:border-red-500' : 'border-gray-300 focus:border-brand-green dark:border-[#3A3A3C]'">
                  <div class="flex items-center gap-4 mt-6">
                    <input v-model="changeForm.code" type="text" inputmode="numeric" maxlength="6" :placeholder="$t('auth.code_placeholder')" class="flex-1 bg-light-gray border rounded-lg py-2 px-3 focus:outline-none focus:ring-0 dark:bg-black/30 dark:text-[#E0E0E0]" :class="changeErrors.code ? 'border-red-500 focus:border-red-500 dark:border-red-500' : 'border-gray-300 focus:border-brand-green dark:border-[#3A3A3C]'">
                    <button type="button" class="px-4 py-2 rounded-md border border-gray-300 text-black hover:bg-gray-100 disabled:opacity-60 dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]" :disabled="changeSending || changeSeconds>0" @click="changeSendCode">
                      <span v-if="changeSending">{{ $t('auth.sending') }}</span>
                      <span v-else-if="changeSeconds>0">{{ changeSeconds }} {{ $t('auth.seconds') }}</span>
                      <span v-else>{{ $t('workspace.get_code') }}</span>
                    </button>
                  </div>
                </div>
                <div v-else-if="changeTab==='phone'">
                  <input v-model="changeForm.phone" type="tel" :placeholder="$t('workspace.enter_phone_number')" class="w-full bg-light-gray border rounded-lg py-2 px-3 focus:outline-none focus:ring-0 dark:bg-black/30 dark:text-[#E0E0E0]" :class="changeErrors.phone ? 'border-red-500 focus:border-red-500 dark:border-red-500' : 'border-gray-300 focus:border-brand-green dark:border-[#3A3A3C]'">
                  <div class="flex items-center gap-3">
                    <input v-model="changeForm.code" type="text" inputmode="numeric" maxlength="6" :placeholder="$t('auth.code_placeholder')" class="flex-1 bg-light-gray border rounded-lg py-2 px-3 focus:outline-none focus:ring-0 dark:bg-black/30 dark:text-[#E0E0E0]" :class="changeErrors.code ? 'border-red-500 focus:border-red-500 dark:border-red-500' : 'border-gray-300 focus:border-brand-green dark:border-[#3A3A3C]'">
                    <button type="button" class="px-4 py-2 rounded-md border border-gray-300 text-black hover:bg-gray-100 disabled:opacity-60 dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]" :disabled="changeSending || changeSeconds>0" @click="changeSendCode">
                      <span v-if="changeSending">{{ $t('auth.sending') }}</span>
                      <span v-else-if="changeSeconds>0">{{ changeSeconds }} {{ $t('auth.seconds') }}</span>
                      <span v-else>{{ $t('workspace.get_code') }}</span>
                    </button>
                  </div>
                </div>
                <div v-else>
                  <div class="relative">
                    <input v-model="changeForm.password" :type="showChangePassword ? 'text' : 'password'" :placeholder="$t('workspace.enter_account_password')" class="w-full bg-light-gray border rounded-lg py-2 pl-3 pr-10 focus:outline-none focus:ring-0 dark:bg-black/30 dark:text-[#E0E0E0]" :class="changeErrors.password ? 'border-red-500 focus:border-red-500 dark:border-red-500' : 'border-gray-300 focus:border-brand-green dark:border-[#3A3A3C]'">
                    <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary" @click="showChangePassword = !showChangePassword"><fa :icon="['fas', showChangePassword ? 'eye-slash' : 'eye']" /></button>
                  </div>
                </div>
              </div>
              <div class="mt-6 flex justify-end gap-3">
                <button class="px-4 py-2 rounded-lg border border-gray-300 text-secondary hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-gray-300 dark:hover:bg-[#3A3A3C]" @click="closeChangeEmail">{{ $t('workspace.cancel') }}</button>
                <button class="px-4 py-2 rounded-lg bg-brand-green text-white hover:bg-brand-green/90" @click="submitChangeVerify">{{ $t('workspace.next_step') }}</button>
              </div>
            </div>
          </div>
        </div>
      </teleport>
      
      <teleport to="body">
        <div v-if="toastOpen" class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div :class="[toastType==='success' ? 'bg-brand-green' : 'bg-red-500', 'pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl ring-1 ring-white/30']">
            <fa :icon="['fas', toastType==='success' ? 'check' : 'xmark']" class="text-white" />
            <span class="text-base font-semibold text-white">{{ toastText }}</span>
          </div>
        </div>
      </teleport>
      <teleport to="body">
        <div v-if="showInviteLink" class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div class="absolute inset-0 bg-black/30 backdrop-blur-md pointer-events-auto z-0" @click="closeInviteLink"></div>
          <div class="relative z-10 pointer-events-auto w-[90%] max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-2xl dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
            <div class="p-4 flex items-start justify-between">
              <div>
                <div class="text-sm text-secondary">{{ $t('workspace.share_link_label') }}</div>
                <div class="mt-1 font-mono text-primary break-all dark:text-white">{{ inviteLink }}</div>
              </div>
              <button class="text-secondary hover:text-primary" @click="closeInviteLink"><fa :icon="['fas','xmark']" /></button>
            </div>
            <div class="border-t border-gray-200 p-3 flex items-center justify-end gap-2 dark:border-[#3A3A3C]">
              <button class="px-3 py-1.5 rounded-md border border-gray-300 text-black hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]" @click="shareInviteLink">{{ $t('workspace.share_button') }}</button>
              <button class="px-3 py-1.5 rounded-md bg-brand-green text-white hover:bg-brand-green/90" @click="copyInviteLink">{{ $t('workspace.copy_button') }}</button>
            </div>
          </div>
        </div>
      </teleport>
      <teleport to="body">
        <div v-if="copyHintOpen" class="fixed z-50 pointer-events-none top-[160px] left-1/2 -translate-x-1/2">
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-green text-white shadow-lg">
            <fa :icon="['fas','check']" />
            <span class="text-sm font-medium">{{ copyHintText }}</span>
          </div>
        </div>
      </teleport>
      <teleport to="body">
        <div v-if="showAddMember" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/30 backdrop-blur-md" @click="closeAddMember"></div>
          <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
            <form class="p-6 space-y-4" @submit.prevent="submitAddMember">
              <h3 class="text-lg font-semibold text-primary dark:text-white">{{ $t('workspace.add_team_member') }}</h3>
              
              <div>
                <label class="block text-sm font-medium text-secondary dark:text-gray-300">{{ $t('workspace.email_label') }}</label>
                <input v-model="addMemberEmail" type="email" :placeholder="$t('workspace.invite_email_placeholder')" class="mt-1 w-full bg-light-gray border rounded-lg py-2 px-3 focus:outline-none focus:ring-0 dark:bg-black/30 dark:text-[#E0E0E0]" :class="addMemberError ? 'border-red-500 focus:border-red-500 dark:border-red-500' : 'border-gray-300 focus:border-brand-green dark:border-[#3A3A3C]'" />
                <p v-if="addMemberError" class="mt-1 text-xs text-red-500">{{ addMemberError }}</p>
                <p class="mt-1 text-xs text-secondary">{{ $t('workspace.invite_by_email') }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-secondary dark:text-gray-300">{{ $t('workspace.role') }}</label>
                <select v-model="addMemberRole" class="mt-1 w-full bg-light-gray border rounded-lg py-2 px-3 focus:outline-none focus:ring-0 dark:bg-black/30 dark:text-[#E0E0E0]" :class="'border-gray-300 focus:border-brand-green dark:border-[#3A3A3C]'">
                  <option>{{ $t('workspace.admin') }}</option>
                  <option>{{ $t('workspace.editor') }}</option>
                  <option>{{ $t('workspace.member') }}</option>
                </select>
              </div>
              <div class="mt-6">
                <div class="font-semibold mb-2">{{ $t('workspace.added_members') }}</div>
                <div class="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                  <div v-for="m in members" :key="m.id" class="flex items-center justify-between p-2 rounded-md border border-gray-200 dark:border-[#333333] bg-white dark:bg-[#1E1E1E]">
                    <div class="flex items-center gap-3">
                      <img :src="'https://i.pravatar.cc/40?u=' + m.id" class="w-8 h-8 rounded-full" />
                      <div>
                        <div class="text-sm font-medium text-primary dark:text-white">{{ m.name }}</div>
                        <div class="text-xs text-secondary">{{ m.email }}</div>
                      </div>
                    </div>
                    <span class="text-xs text-secondary">{{ m.role }}</span>
                  </div>
                </div>
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button type="button" class="px-4 py-2 rounded-lg border border-gray-300 text-secondary hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-gray-300 dark:hover:bg-[#3A3A3C]" @click="closeAddMember">{{ $t('workspace.cancel') }}</button>
                <button type="submit" class="px-4 py-2 rounded-lg bg-brand-green text-white hover:bg-brand-green/90">{{ $t('workspace.send_invite') }}</button>
              </div>
            </form>
          </div>
        </div>
      </teleport>
      <teleport to="body">
        <div v-if="showTeamCreate" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/30 backdrop-blur-md" @click="closeTeamCreate"></div>
          <div class="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
            <form class="p-6 space-y-4" @submit.prevent="submitTeamCreate">
              <h3 class="text-lg font-semibold text-primary dark:text-white">{{ $t('workspace.create_team_modal') }}</h3>
              <div>
                <label class="block text-sm font-medium text-secondary dark:text-gray-300">{{ $t('workspace.team_name') }}</label>
                <input v-model="teamName" type="text" :placeholder="$t('workspace.team_name_placeholder')" class="mt-1 w-full bg-light-gray border rounded-lg py-2 px-3 focus:outline-none focus:ring-0 dark:bg-black/30 dark:text-[#E0E0E0]" :class="teamNameError ? 'border-red-500 focus:border-red-500 dark:border-red-500' : 'border-gray-300 focus:border-brand-green dark:border-[#3A3A3C]'" />
                <p v-if="teamNameError" class="mt-1 text-xs text-red-500">{{ teamNameError }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-secondary dark:text-gray-300">{{ $t('workspace.description_optional') }}</label>
                <textarea v-model="teamDesc" rows="3" :placeholder="$t('workspace.team_description_placeholder')" class="mt-1 w-full bg-light-gray border rounded-lg py-2 px-3 focus:outline-none focus:ring-0 dark:bg-black/30 dark:text-[#E0E0E0]" :class="'border-gray-300 focus:border-brand-green dark:border-[#3A3A3C]'" />
              </div>
              <div>
                <label class="block text-sm font-medium text-secondary dark:text-gray-300">{{ $t('workspace.team_icon_optional') }}</label>
                <div class="mt-2">
                  <div class="relative border border-gray-300 rounded-lg h-32 flex items-center justify-center text-gray-500 hover:border-brand-green cursor-pointer dark:border-[#3A3A3C]" @click="triggerTeamIconPick">
                    <img v-if="teamIconPreview" :src="teamIconPreview" class="absolute inset-0 w-full h-full object-cover rounded-lg" />
                    <div v-else class="flex flex-col items-center">
                      <fa :icon="['fas','image']" class="text-2xl" />
                      <span class="mt-2 text-sm">{{ $t('workspace.click_upload_icon') }}</span>
                    </div>
                  </div>
                  <input ref="teamIconInput" type="file" accept="image/*" class="hidden" @change="onTeamIconChange" />
                </div>
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button type="button" class="px-4 py-2 rounded-lg border border-gray-300 text-secondary hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-gray-300 dark:hover:bg-[#3A3A3C]" @click="closeTeamCreate">{{ $t('workspace.cancel') }}</button>
                <button type="submit" class="px-4 py-2 rounded-lg" :class="teamValid ? 'bg-brand-green text-white hover:bg-brand-green/90' : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-300'" :disabled="!teamValid">{{ $t('workspace.create_team_modal') }}</button>
              </div>
            </form>
          </div>
        </div>
      </teleport>
      <teleport to="body">
        <div v-if="showRecent" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/30 backdrop-blur-md" @click="closeRecent"></div>
          <div class="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
            <div class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-semibold text-primary dark:text-white">{{ $t('workspace.recent') }}</h3>
                <button class="text-xs px-2 py-1 rounded-md border border-gray-300 text-black hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]" @click="clearRecent">{{ $t('workspace.clear') }}</button>
              </div>
              <div class="mb-4 flex items-center gap-2">
                <fa :icon="['fas','search']" class="text-gray-400" />
                <input v-model="recentSearch" type="text" :placeholder="$t('workspace.search_name_or_time')" class="flex-1 bg-light-gray border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-0 focus:border-brand-green dark:bg-[#1E1E1E] dark:text-[#E0E0E0] dark:border-[#3A3A3C]" />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div v-for="r in filteredRecent" :key="r.id" class="rounded-lg border border-gray-200 bg-white overflow-hidden dark:bg-[#12161a] dark:border-[#333333]">
                  <div class="aspect-video bg-gray-100">
                    <img :src="r.thumbnail" class="w-full h-full object-cover" />
                  </div>
                  <div class="p-3">
                    <div class="font-medium text-primary truncate dark:text-white">{{ r.name }}</div>
                    <div class="text-xs text-secondary mt-1">{{ r.time }}</div>
                  </div>
                </div>
              </div>
              <div v-if="filteredRecent.length===0" class="mt-6 text-center text-secondary dark:text-gray-400">{{ $t('workspace.no_records') }}</div>
              <div class="mt-6 text-right">
                <button class="px-3 py-1.5 rounded-md border border-gray-300 text-black hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]" @click="closeRecent">{{ $t('workspace.close') }}</button>
              </div>
            </div>
          </div>
        </div>
      </teleport>
      <teleport to="body">
        <div v-if="showFavorites" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/30 backdrop-blur-md" @click="closeFavorites"></div>
          <div class="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
            <div class="p-6">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <span class="text-sm text-secondary">{{ $t('workspace.personal_space') }}</span>
                  <h1 class="text-2xl font-bold text-primary dark:text-white">{{ $t('workspace.favorites') }}</h1>
                </div>
                <div class="flex items-center gap-2">
                  <div class="flex items-center bg-white p-1 rounded-lg border border-gray-200 dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
                    <button class="px-3 py-1 text-sm font-semibold text-white bg-brand-green rounded-md"><fa :icon="['fas','table-cells-large']" /></button>
                    <button class="px-3 py-1 text-sm text-secondary hover:text-primary dark:text-gray-300 dark:hover:text-white"><fa :icon="['fas','list']" /></button>
                  </div>
                  <button class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 dark(bg-[#2C2C2E]) dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]"> {{ $t('workspace.modified') }} <fa :icon="['fas','chevron-down']" class="ml-2 text-xs" /></button>
                </div>
              </div>
              <div class="mb-4 flex items-center gap-2">
                <fa :icon="['fas','search']" class="text-gray-400" />
                <input v-model="favoritesSearch" type="text" :placeholder="$t('workspace.search_favorites')" class="flex-1 bg-light-gray border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-0 focus:border-brand-green dark:bg-[#1E1E1E] dark:text-[#E0E0E0] dark:border-[#3A3A3C]" />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div v-for="p in filteredFavorites" :key="p.id" class="bg-white rounded-lg shadow-sm border border-gray-200 relative dark:bg-[#12161a] dark:border-[#333333]">
                  <router-link :to="{ path: '/studio', query: { id: p.id } }">
                    <div class="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                      <img :src="p.thumbnail" class="w-full h-full object-cover" alt="Project thumbnail" />
                    </div>
                    <div class="p-4">
                      <h3 class="font-semibold text-primary truncate dark:text-white">{{ p.name }}</h3>
                      <p class="text-sm text-secondary mt-1 dark:text-gray-400">{{ $t('workspace.modified_at') }}：{{ p.updated }}</p>
                    </div>
                  </router-link>
                </div>
                <div v-if="filteredFavorites.length===0" class="col-span-full">
                  <div class="rounded-lg border border-gray-200 bg-white p-6 text-center text-secondary dark:bg-[#12161a] dark:border-[#333333] dark:text-gray-400">{{ $t('workspace.no_content') }}</div>
                </div>
              </div>
              <div class="mt-6 text-right">
                <button class="px-3 py-1.5 rounded-md border border-gray-300 text-black hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]" @click="closeFavorites">{{ $t('workspace.close') }}</button>
              </div>
            </div>
          </div>
        </div>
      </teleport>
      <teleport to="body">
        <div v-if="showAccount" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/30 backdrop-blur-md" @click="closeAccount"></div>
          <div class="relative w-full max-w-2xl h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
            <div class="p-6 h-full overflow-y-auto no-scrollbar">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-semibold text-primary dark:text-white">{{ $t('workspace.my_account') }}</h3>
                <button class="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-100 dark:border-[#3A3A3C] dark:hover:bg-[#3A3A3C]" @click="closeAccount">{{ $t('workspace.close') }}</button>
              </div>
              <div class="bg-light-gray rounded-xl p-6 flex items-center space-x-5 mb-8 dark:bg-[#1E1E1E]">
                <div class="w-16 h-16 rounded-full bg-brand-green text-white flex items-center justify-center text-2xl font-semibold">胡</div>
                <div>
                  <p class="text-xl font-bold text-primary dark:text-white">{{ accountName }}</p>
                  <p class="text-secondary">{{ accountEmail }}</p>
                </div>
              </div>
              <div class="space-y-8">
                <div>
                  <h2 class="text-sm font-semibold text-primary dark:text-white mb-2">{{ $t('workspace.username') }}</h2>
                  <div class="bg-light-gray rounded-lg p-4 flex justify-between items-center dark:bg-[#1E1E1E]">
                    <template v-if="editingAccountName">
                      <div class="flex items-center gap-3 w-full">
                        <input v-model="tempAccountName" type="text" class="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-0 focus:border-brand-green dark:bg-[#1E1E1E] dark:border-[#3A3A3C] dark:text-[#E0E0E0]" />
                        <button class="font-medium px-3 py-1.5 rounded-md border border-gray-300 text-black hover:bg-gray-100 transition-colors dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]" @click="saveAccountName">{{ $t('workspace.save') }}</button>
                        <button class="px-3 py-1.5 rounded-md border border-gray-300 text-secondary hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-gray-300 dark:hover:bg-[#3A3A3C]" @click="cancelAccountName">{{ $t('workspace.cancel') }}</button>
                      </div>
                    </template>
                    <template v-else>
                      <span class="text-primary dark:text-white">{{ accountName }}</span>
                      <button class="font-medium px-3 py-1.5 rounded-md border border-gray-300 text-black hover:bg-gray-100 transition-colors dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]" @click="editAccountName">{{ $t('workspace.edit') }}</button>
                    </template>
                  </div>
                </div>
                <div>
                  <h2 class="text-sm font-semibold text-primary dark:text-white mb-2">{{ $t('workspace.email_label') }}</h2>
                  <div class="bg-light-gray rounded-lg p-4 flex justify-between items-center dark:bg-[#1E1E1E]">
                    <span class="text-primary dark:text-white">{{ accountEmail }}</span>
                    <button class="font-medium px-3 py-1.5 rounded-md border border-gray-300 text-black hover:bg-gray-100 transition-colors dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]" @click="changeAccountEmail">{{ $t('workspace.change') }}</button>
                  </div>
                </div>
                <div>
                  <div class="flex justify-between items-start pt-4">
                    <div>
                      <h2 class="text-sm font-semibold text-primary dark:text-white">{{ $t('workspace.password') }}</h2>
                      <p class="text-secondary text-sm mt-1 dark:text-gray-400">{{ $t('workspace.password_hint') }}</p>
                    </div>
                    <button class="font-medium px-3 py-1.5 rounded-md border border-gray-300 text-black hover:bg-gray-100 transition-colors flex-shrink-0 ml-4 dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]" @click="openReset">{{ $t('workspace.reset_password') }}</button>
                  </div>
                  <hr class="border-light-gray mt-6 dark:border-[#333333]">
                </div>
                <div>
                  <h2 class="text-sm font-semibold text-primary dark:text-white">{{ $t('workspace.account_data') }}</h2>
                  <p class="text-secondary text-sm mt-1 mb-2">{{ $t('workspace.account_data_desc') }}</p>
                  <button class="w-full bg-light-gray rounded-lg p-4 flex justify-between items-center hover:bg-gray-200 transition-colors dark:bg-[#1E1E1E] dark:hover:bg-[#2C2C2E]" @click="toggleAccountApps">
                    <span class="text-primary dark:text-white">{{ $t('workspace.show_apps', { n: 38 }) }}</span>
                    <fa :icon="['fas', accountAppsOpen ? 'chevron-down' : 'chevron-right']" class="text-secondary transition-transform" />
                  </button>
                  <div v-show="accountAppsOpen" class="mt-3 space-y-2">
                    <div v-for="a in accountApps" :key="a.id" class="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3 dark:bg-[#1E1E1E] dark:border-[#333333]">
                      <div class="flex items-center gap-3">
                        <div class="w-6 h-6 rounded-sm bg-green-100 flex items-center justify-center">
                          <fa :icon="['fas','square']" class="text-green-500 text-xs" />
                        </div>
                        <div>
                          <div class="font-medium text-sm text-primary dark:text-white">{{ a.name }}</div>
                          <div class="text-xs text-secondary">{{ $t('workspace.projects') }} {{ a.projects }} · {{ $t('workspace.last_activity') }} {{ a.lastActive }}</div>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </teleport>
      <teleport to="body">
        <div v-if="showChangeEmail" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="closeChangeEmail"></div>
          <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
            <div class="p-6">
              <h3 class="text-xl font-bold text-primary dark:text-white mb-4">{{ changePhase==='current' ? $t('workspace.change_email') : $t('workspace.verify_new_email') }}</h3>
              <div v-if="changePhase==='current'" class="flex items-center gap-6 border-b pb-2 border-gray-200 dark:border-[#3A3A3C]">
                <button class="pb-2 font-medium" :class="changeTab==='email' ? 'text-brand-green border-b-2 border-brand-green' : 'text-secondary hover:text-primary dark:text-[#E0E0E0] dark:hover:text-white'" @click="changeTab='email'">{{ $t('workspace.email_verification') }}</button>
                <button class="pb-2 font-medium" :class="changeTab==='phone' ? 'text-brand-green border-b-2 border-brand-green' : 'text-secondary hover:text-primary dark:text-[#E0E0E0] dark:hover:text-white'" @click="changeTab='phone'">{{ $t('workspace.phone_verification') }}</button>
                <button class="pb-2 font-medium" :class="changeTab==='password' ? 'text-brand-green border-b-2 border-brand-green' : 'text-secondary hover:text-primary dark:text-[#E0E0E0] dark:hover:text-white'" @click="changeTab='password'">{{ $t('workspace.password_verification') }}</button>
              </div>
              <div class="mt-4 space-y-4">
                <template v-if="changePhase==='current'">
                  <div v-if="changeTab==='email'">
                    <input :value="accountEmail" type="email" readonly class="w-full bg-gray-100 border border-gray-300 rounded-md py-2.5 px-4 text-gray-600 cursor-not-allowed focus:outline-none focus:ring-0 focus:border-gray-300 dark:bg-[#1E1E1E] dark:text-gray-400 dark:border-[#3A3A3C] dark:focus:border-[#3A3A3C]">
                    <div class="flex items-center gap-3 mt-3">
                      <input v-model="changeForm.code" type="text" inputmode="numeric" maxlength="6" :placeholder="$t('auth.code_placeholder')" class="flex-1 bg-light-gray border border-gray-300 rounded-md py-2.5 px-4 focus:outline-none focus:ring-0 focus:border-brand-green dark:bg-[#1E1E1E] dark:text-[#E0E0E0] dark:border-[#3A3A3C] dark:focus:border-brand-green" :class="{'border-red-500 focus:border-red-500 dark:border-red-500': changeErrors.code}">
                      <button type="button" class="px-4 py-2 rounded-md border border-gray-300 text-black hover:bg-gray-100 disabled:opacity-60 dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]" :disabled="changeSending || changeSeconds>0" @click="changeSendCode">
                        <span v-if="changeSending">{{ $t('auth.sending') }}</span>
                        <span v-else-if="changeSeconds>0">{{ changeSeconds }} {{ $t('auth.seconds') }}</span>
                        <span v-else>{{ $t('workspace.get_code') }}</span>
                      </button>
                    </div>
                  </div>
                  <div v-else-if="changeTab==='phone'">
                    <input v-model="changeForm.phone" type="tel" :placeholder="$t('workspace.enter_phone_number')" class="w-full bg-light-gray border rounded-md py-2.5 px-4 focus:outline-none focus:ring-0 dark:bg-[#1E1E1E] dark:text-[#E0E0E0]" :class="changeErrors.phone ? 'border-red-500 focus:border-red-500 dark:border-red-500' : 'border-gray-300 focus:border-brand-green dark:border-[#3A3A3C]'">
                    <div class="flex items-center gap-3 mt-3">
                      <input v-model="changeForm.code" type="text" inputmode="numeric" maxlength="6" :placeholder="$t('auth.code_placeholder')" class="flex-1 bg-light-gray border border-gray-300 rounded-md py-2.5 px-4 focus:outline-none focus:ring-0 focus:border-brand-green dark:bg-[#1E1E1E] dark:text-[#E0E0E0] dark:border-[#3A3A3C] dark:focus:border-brand-green" :class="{'border-red-500 focus:border-red-500 dark:border-red-500': changeErrors.code}">
                      <button type="button" class="px-4 py-2 rounded-md border border-gray-300 text-black hover:bg-gray-100 disabled:opacity-60 dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]" :disabled="changeSending || changeSeconds>0" @click="changeSendCode">
                        <span v-if="changeSending">{{ $t('auth.sending') }}</span>
                        <span v-else-if="changeSeconds>0">{{ changeSeconds }} {{ $t('auth.seconds') }}</span>
                        <span v-else>{{ $t('workspace.get_code') }}</span>
                      </button>
                    </div>
                  </div>
                  <div v-else>
                    <div class="relative">
                      <input v-model="changeForm.password" :type="showChangePassword ? 'text' : 'password'" :placeholder="$t('workspace.enter_account_password')" class="w-full bg-light-gray border rounded-md py-2.5 pl-4 pr-10 focus:outline-none focus:ring-0 dark:bg-[#1E1E1E] dark:text-[#E0E0E0]" :class="changeErrors.password ? 'border-red-500 focus:border-red-500 dark:border-red-500' : 'border-gray-300 focus:border-brand-green dark:border-[#3A3A3C]'">
                      <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary" @click="showChangePassword = !showChangePassword"><fa :icon="['fas', showChangePassword ? 'eye-slash' : 'eye']" /></button>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div>
                    <input v-model="newEmail" type="email" :placeholder="$t('workspace.new_email_placeholder')" class="w-full bg-light-gray border border-gray-300 rounded-md py-2.5 px-4 focus:outline-none focus:ring-0 focus:border-brand-green dark:bg-[#1E1E1E] dark:text-[#E0E0E0] dark:border-[#3A3A3C] dark:focus:border-brand-green" :class="newEmailError ? 'border-red-500 focus:border-red-500 dark:border-red-500' : ''">
                    <p v-if="newEmailError" class="mt-1 text-xs text-red-500">{{ newEmailError }}</p>
                    <div class="flex items-center gap-3 mt-3">
                      <input v-model="changeForm.code" type="text" inputmode="numeric" maxlength="6" :placeholder="$t('auth.code_placeholder')" class="flex-1 bg-light-gray border border-gray-300 rounded-md py-2.5 px-4 focus:outline-none focus:ring-0 focus:border-brand-green dark:bg-[#1E1E1E] dark:text-[#E0E0E0] dark:border-[#3A3A3C] dark:focus:border-brand-green" :class="newEmailCodeError ? 'border-red-500 focus:border-red-500 dark:border-red-500' : ''">
                      <button type="button" class="px-4 py-2 rounded-md border border-gray-300 text-black hover:bg-gray-100 disabled:opacity-60 dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]" :disabled="changeSending || changeSeconds>0" @click="changeSendCode">
                        <span v-if="changeSending">{{ $t('auth.sending') }}</span>
                        <span v-else-if="changeSeconds>0">{{ changeSeconds }} {{ $t('auth.seconds') }}</span>
                        <span v-else>{{ $t('workspace.get_code') }}</span>
                      </button>
                    </div>
                  </div>
                </template>
              </div>
              <div class="mt-6 flex justify-end gap-3">
                <button class="px-4 py-2 rounded-md border border-gray-300 text-secondary hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-gray-300 dark:hover:bg-[#3A3A3C]" @click="closeChangeEmail">{{ $t('workspace.cancel') }}</button>
                <button v-if="changePhase==='current'" class="px-4 py-2 rounded-md bg-brand-green text-white hover:bg-brand-green/90" @click="submitChangeVerify">{{ $t('workspace.next_step') }}</button>
                <button v-else class="px-4 py-2 rounded-md bg-brand-green text-white hover:bg-brand-green/90" @click="confirmNewEmail">{{ $t('workspace.confirm') }}</button>
              </div>
            </div>
          </div>
        </div>
      </teleport>
      <teleport to="body">
        <div v-if="showAbout" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/30 backdrop-blur-md" @click="closeAbout"></div>
          <div class="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
            <div class="p-8 text-center">
              <div class="text-4xl font-extrabold tracking-tight">
                <span class="text-black dark:text-white">One</span><span class="text-brand-green">Four</span>
              </div>
              <div class="mt-3 text-secondary">Version {{ currentVersion }}</div>
              <div class="mt-4 text-sm text-secondary">© 2025 OneFour Inc., Contributors.</div>
              <a href="https://opensource.org/license/mit" target="_blank" rel="noopener" class="mt-3 inline-block text-brand-green font-medium hover:underline">Open Source License</a>
            </div>
            <div class="border-t border-gray-200 bg-light-gray p-4 flex items-center justify-between dark:bg-[#1E1E1E] dark:border-[#3A3A3C]">
              <div class="text-sm text-secondary dark:text-gray-400">{{ $t('workspace.update_available', { version: latestVersion }) }}</div>
              <button class="px-3 py-1.5 rounded-md border border-gray-300 text-black hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]">{{ $t('workspace.changelog') }}</button>
            </div>
          </div>
        </div>
      </teleport>
      <teleport to="body">
        <div v-if="showUpgrade" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/30 backdrop-blur-md" @click="closeUpgrade"></div>
          <div class="relative w-full max-w-7xl h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
            <div class="p-6 h-full overflow-y-auto no-scrollbar">
              <div class="flex justify-between items-start mb-6">
                <div>
                  <h3 class="text-2xl font-bold text-primary dark:text-white">{{ $t('workspace.onefour_plans') }}</h3>
                  <p class="text-secondary mt-1">{{ $t('workspace.plans_desc') }}</p>
                </div>
                <button class="text-secondary hover:text-primary" @click="closeUpgrade"><fa :icon="['fas','xmark']" class="text-xl" /></button>
              </div>
              <div class="flex items-center justify-between border-b border-gray-200 mb-6 dark:border-[#333333]">
                <nav class="flex">
                  <button class="px-3 py-3 font-semibold" :class="upgradeTab==='cloud' ? 'text-brand-green border-b-2 border-brand-green' : 'text-secondary hover:text-primary'" @click="upgradeTab='cloud'"><fa :icon="['fas','cloud']" class="w-5 mr-2" /> {{ $t('workspace.cloud_service') }}</button>
                  <button class="px-3 py-3 font-semibold" :class="upgradeTab==='self' ? 'text-brand-green border-b-2 border-brand-green' : 'text-secondary hover:text-primary'" @click="upgradeTab='self'"><fa :icon="['fas','diagram-project']" class="w-5 mr-2" /> {{ $t('workspace.self_hosted') }}</button>
                </nav>
                <div v-if="upgradeTab==='cloud'" class="flex items-center gap-3">
                  <label class="relative inline-flex items-center w-10 h-5 cursor-pointer">
                    <input type="checkbox" class="sr-only" v-model="annualBilling" />
                    <span class="w-10 h-5 rounded-full transition-colors" :class="annualBilling ? 'bg-brand-green' : 'bg-gray-200'"></span>
                    <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transform transition-transform" :class="annualBilling ? 'translate-x-5' : 'translate-x-0'"></span>
                  </label>
                  <span class="text-sm text-primary">{{ $t('workspace.annual_billing') }}</span>
                </div>
              </div>
              <div v-if="upgradeTab==='cloud'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="rounded-2xl p-6 border border-gray-200 flex flex-col dark:border-[#333333]">
                  <div class="h-12 w-12 mb-4 rounded-md bg-light-gray"></div>
                  <div class="text-2xl font-bold text-primary dark:text-white">{{ $t('workspace.sandbox') }}</div>
                  <div class="text-secondary mt-1">{{ $t('workspace.sandbox_desc') }}</div>
                  <div class="my-4 text-3xl font-extrabold text-primary">{{ $t('workspace.free') }}</div>
                  <button disabled class="w-full bg-light-gray py-2 rounded-lg font-semibold text-secondary cursor-not-allowed">{{ $t('workspace.current_plan') }}</button>
                </div>
                <div class="rounded-2xl p-6 border border-gray-200 flex flex-col dark:border-[#333333]">
                  <div class="h-12 w-12 mb-4 rounded-md bg-brand-green"></div>
                  <div class="text-2xl font-bold text-primary dark:text-white flex items-center">{{ $t('workspace.professional') }} <span class="ml-2 px-2 py-0.5 text-xs rounded-full bg-brand-green text-white">{{ $t('workspace.most_popular') }}</span></div>
                  <div class="text-secondary mt-1">{{ $t('workspace.professional_desc') }}</div>
                  <div class="my-4" v-if="!annualBilling">
                    <div class="text-3xl font-extrabold text-primary">$59 <span class="text-base text-secondary font-normal">{{ $t('workspace.per_space_month') }}</span></div>
                  </div>
                  <div class="my-4" v-else>
                    <div class="flex items-baseline space-x-4">
                      <div class="text-2xl font-normal text-gray-400 line-through">$708</div>
                      <div class="text-4xl font-extrabold text-primary">$590</div>
                      <div class="text-base font-normal text-secondary">{{ $t('workspace.per_space_year') }}</div>
                    </div>
                  </div>
                  <button class="w-full bg-brand-green text-white py-2 rounded-lg font-semibold hover:bg-brand-green/90">{{ $t('workspace.start_building') }}</button>
                </div>
                <div class="rounded-2xl p-6 border border-gray-200 flex flex-col dark:border-[#333333]">
                  <div class="h-12 w-12 mb-4 rounded-md bg-[#1C1C1E]"></div>
                  <div class="text-2xl font-bold text-primary dark:text-white">{{ $t('workspace.team_plan') }}</div>
                  <div class="text-secondary mt-1">{{ $t('workspace.team_desc') }}</div>
                  <div class="my-4" v-if="!annualBilling">
                    <div class="text-3xl font-extrabold text-primary">$159 <span class="text-base text-secondary font-normal">{{ $t('workspace.per_space_month') }}</span></div>
                  </div>
                  <div class="my-4" v-else>
                    <div class="flex items-baseline space-x-4">
                      <div class="text-2xl font-normal text-gray-400 line-through">$1908</div>
                      <div class="text-4xl font-extrabold text-primary">$1590</div>
                      <div class="text-base font-normal text-secondary">{{ $t('workspace.per_space_year') }}</div>
                    </div>
                  </div>
                  <button class="w-full bg-[#1C1C1E] text-white py-2 rounded-lg font-semibold hover:bg-[#333333]">{{ $t('workspace.start_now') }}</button>
                </div>
              </div>
              <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="rounded-2xl p-6 border border-gray-200 flex flex-col dark:border-[#333333]">
                  <div class="h-12 w-12 mb-4 border-2 border-dashed border-gray-300 rounded-md"></div>
                  <div class="text-2xl font-bold text-primary dark:text-white">{{ $t('workspace.community') }}</div>
                  <div class="text-secondary mt-1">{{ $t('workspace.community_desc') }}</div>
                  <div class="my-4 text-3xl font-extrabold text-primary">{{ $t('workspace.free') }}</div>
                  <button class="w-full bg-light-gray py-2 rounded-lg font-semibold text-primary hover:bg-gray-200">{{ $t('workspace.start_using') }}</button>
                </div>
                <div class="rounded-2xl p-6 border border-gray-200 flex flex-col dark:border-[#333333]">
                  <div class="h-12 w-12 mb-4 border-2 border-dashed border-orange-300 rounded-md"></div>
                  <div class="text-2xl font-bold text-primary dark:text-white">{{ $t('workspace.premium') }}</div>
                  <div class="text-secondary mt-1">{{ $t('workspace.premium_desc') }}</div>
                  <div class="my-4 text-3xl font-extrabold text-primary">{{ $t('workspace.scalable') }}</div>
                  <button class="w-full bg-[#1C1C1E] text-white py-2 rounded-lg font-semibold hover:bg-[#333333]">{{ $t('workspace.get_via_marketplace') }}</button>
                </div>
                <div class="rounded-2xl p-6 border border-gray-200 flex flex-col dark:border-[#333333]">
                  <div class="h-12 w-12 mb-4 border-2 border-dashed border-blue-300 rounded-md"></div>
                  <div class="text-2xl font-bold text-primary dark:text-white">{{ $t('workspace.enterprise') }}</div>
                  <div class="text-secondary mt-1">{{ $t('workspace.enterprise_desc') }}</div>
                  <div class="my-4 text-3xl font-extrabold text-primary">{{ $t('workspace.custom') }}</div>
                  <button class="w-full bg-brand-green text-white py-2 rounded-lg font-semibold hover:bg-brand-green/90">{{ $t('workspace.contact_sales') }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </teleport>
      <teleport to="body">
        <div v-if="showReset" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/30 backdrop-blur-md" @click="closeReset"></div>
          <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
            <form class="p-6 space-y-4" @submit.prevent="submitReset">
              <h3 class="text-lg font-semibold text-primary dark:text-white">{{ $t('workspace.reset_password') }}</h3>
              <div>
                <label class="block text-sm font-medium text-secondary dark:text-gray-300">{{ $t('workspace.new_password_label') }}</label>
                <div class="mt-1 relative">
                  <input v-model="resetForm.password" :type="showResetPassword ? 'text' : 'password'" :placeholder="$t('workspace.at_least_8')" class="w-full bg-light-gray border rounded-lg py-2 pl-3 pr-10 focus:outline-none focus:ring-0 dark:bg-black/30 dark:text-[#E0E0E0]" :class="resetErrors.password ? 'border-red-500 focus:border-red-500 dark:border-red-500' : 'border-gray-300 focus:border-brand-green dark:border-[#3A3A3C]'" />
                  <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary" @click="showResetPassword = !showResetPassword"><fa :icon="['fas', showResetPassword ? 'eye-slash' : 'eye']" /></button>
                </div>
                <p v-if="resetErrors.password" class="mt-1 text-xs text-red-500">{{ resetErrors.password }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-secondary dark:text-gray-300">{{ $t('workspace.confirm_password_label') }}</label>
                <div class="mt-1 relative">
                  <input v-model="resetForm.confirm" :type="showResetConfirm ? 'text' : 'password'" :placeholder="$t('workspace.enter_new_password_again')" class="w-full bg-light-gray border rounded-lg py-2 pl-3 pr-10 focus:outline-none focus:ring-0 dark:bg-black/30 dark:text-[#E0E0E0]" :class="resetErrors.confirm ? 'border-red-500 focus:border-red-500 dark:border-red-500' : 'border-gray-300 focus:border-brand-green dark:border-[#3A3A3C]'" />
                  <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary" @click="showResetConfirm = !showResetConfirm"><fa :icon="['fas', showResetConfirm ? 'eye-slash' : 'eye']" /></button>
                </div>
                <p v-if="resetErrors.confirm" class="mt-1 text-xs text-red-500">{{ resetErrors.confirm }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-secondary dark:text-gray-300">{{ $t('workspace.verification_code_label') }}</label>
                <div class="mt-1 flex items-center gap-2">
                  <input v-model="resetForm.code" type="text" inputmode="numeric" maxlength="6" :placeholder="$t('auth.code_placeholder')" class="flex-1 bg-light-gray border rounded-lg py-2 px-3 focus:outline-none focus:ring-0 dark:bg-black/30 dark:text-[#E0E0E0]" :class="resetErrors.code ? 'border-red-500 focus:border-red-500 dark:border-red-500' : 'border-gray-300 focus:border-brand-green dark:border-[#3A3A3C]'" />
                  <button type="button" class="px-3 py-2 rounded-md border border-gray-300 text-black hover:bg-gray-100 disabled:opacity-60 dark:border-[#3A3A3C] dark:text-[#E0E0E0] dark:hover:bg-[#3A3A3C]" :disabled="sendingCode || secondsLeft>0" @click="sendCode">
                    <span v-if="sendingCode">{{ $t('auth.sending') }}</span>
                    <span v-else-if="secondsLeft>0">{{ secondsLeft }} {{ $t('auth.seconds') }}</span>
                    <span v-else>{{ $t('workspace.get_code') }}</span>
                  </button>
                </div>
                <p v-if="resetErrors.code" class="mt-1 text-xs text-red-500">{{ resetErrors.code }}</p>
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button type="button" class="px-4 py-2 rounded-lg border border-gray-300 text-secondary hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-gray-300 dark:hover:bg-[#3A3A3C]" @click="closeReset">{{ $t('workspace.cancel') }}</button>
                <button type="submit" class="px-4 py-2 rounded-lg bg-brand-green text-white hover:bg-brand-green/90">{{ $t('workspace.reset') }}</button>
              </div>
            </form>
          </div>
        </div>
      </teleport>
    </div>
  </div>
</template>
