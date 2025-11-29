<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ModelSelector from '@/components/ModelSelector.vue'

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
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:7767'
const projects = ref([])
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
const createType = ref('')
const createDesc = ref('')
const nameError = ref('')
const typeError = ref('')
const isValid = computed(() => createName.value.trim().length > 0 && createType.value !== '')
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
const showDeleteConfirm = ref(false)
const deleteTargetId = ref('')
const deleteTargetName = ref('')
const openDuplicate = async (id) => { const src = projects.value.find(p => p.id === id); if (!src) return; duplicateSrcId.value = id; duplicateName.value = (src.name || '') + t('workspace.copy'); duplicateError.value = ''; openMenuId.value = null; await nextTick(); showDuplicate.value = true }
const cancelDuplicate = () => { showDuplicate.value = false; duplicateName.value = ''; duplicateError.value = ''; duplicateSrcId.value = '' }
const confirmDuplicate = () => { duplicateError.value = ''; const name = (duplicateName.value || '').trim(); if (!name) { duplicateError.value = t('workspace.enter_name'); return } const src = projects.value.find(p => p.id === duplicateSrcId.value); const newId = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); projects.value.unshift({ id: newId, name, updated: t('workspace.just_now'), thumbnail: src?.thumbnail }); cancelDuplicate() }
const deleteProject = async (id) => {
  const project = projects.value.find(p => p.id === id)
  if (!project) return
  deleteTargetId.value = id
  deleteTargetName.value = project.name
  openMenuId.value = null
  await nextTick()
  showDeleteConfirm.value = true
}
const cancelDelete = () => {
  showDeleteConfirm.value = false
  deleteTargetId.value = ''
  deleteTargetName.value = ''
}
const confirmDelete = async () => {
  const id = deleteTargetId.value
  if (!id) return
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : ''
    const res = await fetch(`${API_BASE}/api/v1/script/libraries/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    })
    if (!res.ok) {
      if (res.status === 401) { router.push('/login'); return }
      alert(t('workspace.delete_failed'))
      return
    }
    projects.value = projects.value.filter(p => p.id !== id)
    cancelDelete()
  } catch {
    alert(t('workspace.delete_failed'))
  }
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
  loadLibraries()
  loadConfiguredModels()
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
  { id: 'openai', name: 'OpenAI', slug: 'openai', desc: 'OpenAI 提供的模型，例如 GPT‑4、GPT‑4o 等', enabled: true, caps: ['LLM','Embedding'], models: [], configured: false },
  { id: 'anthropic', name: 'Anthropic', slug: 'anthropic', desc: 'Anthropic 的 Claude 系列模型', enabled: false, caps: ['LLM'], models: [], configured: false },
  { id: 'openai-compatible', name: 'OpenAI-API-compatible', slug: 'openai', desc: '兼容 OpenAI API 的模型供应商，例如 LM Studio', enabled: false, caps: ['LLM','Compatible'], models: [], configured: false },
  { id: 'qwen', name: '通义千问', slug: 'qwen', desc: '阿里通义千问系列模型', enabled: false, caps: ['LLM'], models: [], configured: false },
  { id: 'deepseek', name: '深度求索', slug: 'deepseek', desc: '深度求索提供的对话与代码模型', enabled: false, caps: ['LLM','Code'], models: [], configured: false },
  { id: 'minimax', name: 'Minimax', slug: 'minimax', desc: '对话、语音与多模态模型', enabled: false, caps: ['LLM','Speech'], models: [], configured: false },
  { id: 'qiniu', name: '七牛云', slug: 'qiniu', desc: '七牛云模型与推理服务', enabled: false, caps: ['LLM'], models: [], configured: false }
])
const showSystemModelSettings = ref(false)
const systemReasoningModel = ref('')
const embeddingModel = ref('')
const rerankModel = ref('')
const speechToTextModel = ref('')
const textToSpeechModel = ref('')
const videoModel = ref('')
const imageModel = ref('')

// Available models from API
const availableModels = ref({
  LLM: [],
  Embedding: [],
  Rerank: [],
  STT: [],
  TTS: [],
  Video: [],
  Image: []
})
const loadingModels = ref(false)
// Get provider icon based on model name
const getProviderIcon = (modelName) => {
  if (!modelName) return 'https://unpkg.com/@lobehub/icons-static-png@latest/light/openai.png'
  
  const name = modelName.toLowerCase()
  if (name.includes('gpt') || name.includes('openai')) {
    return 'https://unpkg.com/@lobehub/icons-static-png@latest/light/openai.png'
  } else if (name.includes('claude') || name.includes('anthropic')) {
    return 'https://unpkg.com/@lobehub/icons-static-png@latest/light/anthropic.png'
  } else if (name.includes('qwen') || name.includes('tongyi')) {
    return 'https://unpkg.com/@lobehub/icons-static-png@latest/light/qwen.png'
  } else if (name.includes('glm') || name.includes('zhipu')) {
    return 'https://unpkg.com/@lobehub/icons-static-png@latest/light/zhipu.png'
  } else if (name.includes('deepseek')) {
    return 'https://unpkg.com/@lobehub/icons-static-png@latest/light/deepseek.png'
  } else if (name.includes('gemini') || name.includes('google')) {
    return 'https://unpkg.com/@lobehub/icons-static-png@latest/light/google.png'
  }
  return 'https://unpkg.com/@lobehub/icons-static-png@latest/light/openai.png'
}

// Load model configurations from API
const loadModelConfigurations = async (modelType) => {
  try {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(
      `${API_BASE}/api/v2/model_config/list?page=1&page_size=100&model_type=${modelType}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    
    if (response.status === 401) {
      router.push('/login')
      return []
    }
    
    const data = await response.json()
    if (data.code === 200 && data.data && data.data.list) {
      return data.data.list
    }
    return []
  } catch (error) {
    console.error(`Failed to load ${modelType} models:`, error)
    return []
  }
}

// Load default model configuration from backend
const loadDefaultModelConfig = async () => {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      console.log('[默认模型配置] 未找到 token，跳过加载')
      return null
    }

    // 使用固定的 config_id，或者从用户配置中获取
    const configId = 'wm63405339065589127630'
    const url = `${API_BASE}/api/v3/chat/default-model?config_id=${configId}`

    console.log('[默认模型配置] 开始加载:', url)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    console.log('[默认模型配置] 响应状态:', response.status)

    if (response.status === 401) {
      console.warn('[默认模型配置] 未授权，跳转到登录页')
      router.push('/login')
      return null
    }

    if (!response.ok) {
      console.error('[默认模型配置] 加载失败，状态码:', response.status)
      return null
    }

    const data = await response.json()
    console.log('[默认模型配置] 加载成功:', data)
    return data
  } catch (error) {
    console.error('[默认模型配置] 加载异常:', error)
    return null
  }
}

const loadAllModelConfigurations = async () => {
  console.log('[模型配置] 开始加载所有模型配置')
  loadingModels.value = true
  try {
    // Map frontend keys to backend model_type values
    const typeMapping = {
      'LLM': 'LLM',
      'Embedding': 'TEXT_EMBEDDING',
      'Rerank': 'RERANK',
      'STT': 'SPEECH2TEXT',
      'TTS': 'TTS',
      'Video': 'VIDEO_GENERATION',
      'Image': 'IMAGE_GENERATION'
    }

    const types = ['LLM', 'Embedding', 'Rerank', 'STT', 'TTS', 'Video', 'Image']
    const results = await Promise.all(
      types.map(type => loadModelConfigurations(typeMapping[type]))
    )

    types.forEach((type, index) => {
      availableModels.value[type] = results[index]
      console.log(`[模型配置] ${type} 模型数量:`, results[index].length)
    })

    // Load default model configuration from backend
    const defaultConfig = await loadDefaultModelConfig()

    // Set models from backend config or auto-select first model
    if (defaultConfig && defaultConfig.data) {
      const config = defaultConfig.data
      console.log('[模型配置] 使用后端配置设置默认模型:', {
        chat_model: config.chat_model,
        embedding_model: config.embedding_model,
        rerank_model: config.rerank_model,
        stt_model: config.stt_model,
        tts_model: config.tts_model,
        video_model: config.video_model,
        image_model: config.image_model
      })

      systemReasoningModel.value = config.chat_model || (availableModels.value.LLM.length > 0 ? availableModels.value.LLM[0].model_name : '')
      embeddingModel.value = config.embedding_model || (availableModels.value.Embedding.length > 0 ? availableModels.value.Embedding[0].model_name : '')
      rerankModel.value = config.rerank_model || (availableModels.value.Rerank.length > 0 ? availableModels.value.Rerank[0].model_name : '')
      speechToTextModel.value = config.stt_model || (availableModels.value.STT.length > 0 ? availableModels.value.STT[0].model_name : '')
      textToSpeechModel.value = config.tts_model || (availableModels.value.TTS.length > 0 ? availableModels.value.TTS[0].model_name : '')
      videoModel.value = config.video_model || (availableModels.value.Video.length > 0 ? availableModels.value.Video[0].model_name : '')
      imageModel.value = config.image_model || (availableModels.value.Image.length > 0 ? availableModels.value.Image[0].model_name : '')
    } else {
      console.log('[模型配置] 未找到后端配置，使用自动选择')
      // Auto-select first model if current selection is empty
      if (!systemReasoningModel.value && availableModels.value.LLM.length > 0) {
        systemReasoningModel.value = availableModels.value.LLM[0].model_name
      }
      if (!embeddingModel.value && availableModels.value.Embedding.length > 0) {
        embeddingModel.value = availableModels.value.Embedding[0].model_name
      }
      if (!rerankModel.value && availableModels.value.Rerank.length > 0) {
        rerankModel.value = availableModels.value.Rerank[0].model_name
      }
      if (!speechToTextModel.value && availableModels.value.STT.length > 0) {
        speechToTextModel.value = availableModels.value.STT[0].model_name
      }
      if (!textToSpeechModel.value && availableModels.value.TTS.length > 0) {
        textToSpeechModel.value = availableModels.value.TTS[0].model_name
      }
      if (!videoModel.value && availableModels.value.Video.length > 0) {
        videoModel.value = availableModels.value.Video[0].model_name
      }
      if (!imageModel.value && availableModels.value.Image.length > 0) {
        imageModel.value = availableModels.value.Image[0].model_name
      }
    }

    console.log('[模型配置] 最终选择的模型:', {
      systemReasoningModel: systemReasoningModel.value,
      embeddingModel: embeddingModel.value,
      rerankModel: rerankModel.value,
      speechToTextModel: speechToTextModel.value,
      textToSpeechModel: textToSpeechModel.value,
      videoModel: videoModel.value,
      imageModel: imageModel.value
    })
  } finally {
    loadingModels.value = false
    console.log('[模型配置] 加载完成')
  }
}

const openSystemModelSettings = async () => {
  await nextTick()
  showSystemModelSettings.value = true
  loadAllModelConfigurations()
}
const closeSystemModelSettings = () => {
  showSystemModelSettings.value = false
}
const saveSystemModelSettings = async () => {
  console.log('[保存模型配置] ========== 开始保存 ==========')
  try {
    const token = localStorage.getItem('accessToken')
    console.log('[保存模型配置] Token 存在:', !!token)
    console.log('[保存模型配置] Token 长度:', token ? token.length : 0)
    console.log('[保存模型配置] Token 前20字符:', token ? token.substring(0, 20) + '...' : 'null')

    if (!token) {
      console.warn('[保存模型配置] ❌ 未找到 token')
      openToast('请先登录', 'error')
      return
    }

    // 使用固定的 config_id，或者从用户配置中获取
    const configId = 'wm63405339065589127630'
    console.log('[保存模型配置] Config ID:', configId)

    // 构建请求体
    const requestBody = {
      config_id: configId,
      chat_model: systemReasoningModel.value || null,
      embedding_model: embeddingModel.value || null,
      rerank_model: rerankModel.value || null,
      stt_model: speechToTextModel.value || null,
      tts_model: textToSpeechModel.value || null,
      video_model: videoModel.value || null,
      image_model: imageModel.value || null
    }

    console.log('[保存模型配置] 📦 请求体:', JSON.stringify(requestBody, null, 2))
    console.log('[保存模型配置] 🌐 请求 URL:', `${API_BASE}/api/v3/chat/default-model`)
    console.log('[保存模型配置] 📋 请求方法: POST')
    console.log('[保存模型配置] 📋 Content-Type: application/json')

    const response = await fetch(
      `${API_BASE}/api/v3/chat/default-model`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      }
    )

    console.log('[保存模型配置] ========== 响应信息 ==========')
    console.log('[保存模型配置] 📊 响应状态码:', response.status)
    console.log('[保存模型配置] 📊 响应状态文本:', response.statusText)
    console.log('[保存模型配置] 📊 响应 OK:', response.ok)
    console.log('[保存模型配置] 📊 响应 Headers:', Object.fromEntries(response.headers.entries()))

    if (response.status === 401) {
      console.warn('[保存模型配置] ❌ 401 未授权，跳转到登录页')
      router.push('/login')
      return
    }

    if (response.status === 403) {
      console.error('[保存模型配置] ❌ 403 禁止访问')
      console.error('[保存模型配置] 可能原因:')
      console.error('  1. Token 无效或已过期')
      console.error('  2. 用户没有权限访问此接口')
      console.error('  3. Config ID 不属于当前用户')
      console.error('  4. 后端权限验证失败')
      const errorText = await response.text()
      console.error('[保存模型配置] 错误响应体:', errorText)
      try {
        const errorData = JSON.parse(errorText)
        console.error('[保存模型配置] 错误数据:', errorData)
        openToast(errorData.message || errorData.detail || '没有权限执行此操作', 'error')
      } catch (e) {
        openToast('没有权限执行此操作 (403)', 'error')
      }
      return
    }

    if (response.status === 404) {
      console.error('[保存模型配置] ❌ 404 未找到')
      console.error('[保存模型配置] 可能原因:')
      console.error('  1. API 路径不存在')
      console.error('  2. Config ID 不存在')
      console.error('  3. 后端路由配置错误')
      const errorText = await response.text()
      console.error('[保存模型配置] 错误响应体:', errorText)
      try {
        const errorData = JSON.parse(errorText)
        console.error('[保存模型配置] 错误数据:', errorData)
        openToast(errorData.message || errorData.detail || '配置不存在', 'error')
      } catch (e) {
        openToast('配置不存在 (404)', 'error')
      }
      return
    }

    if (!response.ok) {
      console.error('[保存模型配置] ❌ 请求失败，状态码:', response.status)
      const errorText = await response.text()
      console.error('[保存模型配置] 错误响应体:', errorText)
      try {
        const errorData = JSON.parse(errorText)
        console.error('[保存模型配置] 错误数据:', errorData)
        openToast(errorData.message || errorData.detail || '保存失败', 'error')
      } catch (e) {
        openToast(`保存失败 (${response.status})`, 'error')
      }
      return
    }

    const responseText = await response.text()
    console.log('[保存模型配置] 📥 原始响应体:', responseText)

    const result = JSON.parse(responseText)
    console.log('[保存模型配置] 📥 解析后的响应数据:', result)

    if (result.code === 200 || result.success) {
      console.log('[保存模型配置] ✅ 保存成功')
      openToast('系统模型设置已保存')
      closeSystemModelSettings()
    } else {
      console.error('[保存模型配置] ❌ 保存失败，返回错误:', result.message)
      openToast(result.message || '保存失败', 'error')
    }
  } catch (error) {
    console.error('[保存模型配置] ========== 异常信息 ==========')
    console.error('[保存模型配置] ❌ 保存异常:', error)
    console.error('[保存模型配置] 错误类型:', error.constructor.name)
    console.error('[保存模型配置] 错误消息:', error.message)
    console.error('[保存模型配置] 错误堆栈:', error.stack)
    openToast('保存失败，请稍后重试', 'error')
  }
  console.log('[保存模型配置] ========== 结束 ==========')
}
const showApiKeyConfig = ref(false)
const apiKeyForm = ref({
  modelName: '',
  modelType: '',
  key: '',
  url: '',
  description: ''
})
const configuredModels = ref([])
const showModelList = ref(false)
const toggleModelList = () => {
  showModelList.value = !showModelList.value
}
const loadConfiguredModels = async () => {
  try {
    const token = localStorage.getItem('accessToken')

    if (!token) {
      return
    }

    const url = `${API_BASE}/api/v2/model_config/list?page=1&page_size=100&keyword=`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.status === 401) {
      router.push('/login')
      return
    }

    if (!response.ok) {
      throw new Error('获取模型列表失败')
    }

    const result = await response.json()

    // 处理 {code: 200, msg: 'success', data: {...}} 格式
    let dataList = []
    if (result.code === 200 && result.data) {
      if (result.data.items && Array.isArray(result.data.items)) {
        dataList = result.data.items
      } else if (result.data.list && Array.isArray(result.data.list)) {
        dataList = result.data.list
      } else if (Array.isArray(result.data)) {
        dataList = result.data
      }
    } else if (result.items && Array.isArray(result.items)) {
      // 兼容 { items: [...], total: number } 格式
      dataList = result.items
    } else if (Array.isArray(result)) {
      // 兼容直接返回数组格式
      dataList = result
    }

    configuredModels.value = dataList.map(item => ({
      id: item.config_id || item.id,
      modelName: item.model_name,
      modelType: item.model_type,
      key: item.api_key,
      url: item.base_url,
      description: item.description
    }))
  } catch (error) {
    console.error('[模型列表] 加载失败:', error)
  }
}
const editingModelId = ref(null)
const showDeleteModelConfirm = ref(false)
const deleteModelTarget = ref(null)
const openApiKeyConfig = async () => {
  await nextTick()
  showApiKeyConfig.value = true
}
const closeApiKeyConfig = () => {
  showApiKeyConfig.value = false
  editingModelId.value = null
  apiKeyForm.value = { modelName: '', modelType: '', key: '', url: '', description: '' }
}
const editModel = async (model) => {
  editingModelId.value = model.id

  apiKeyForm.value = {
    modelName: model.modelName,
    modelType: model.modelType,
    key: model.key,
    url: model.url,
    description: model.description || ''
  }

  await nextTick()
  showApiKeyConfig.value = true
}
const openDeleteModelConfirm = async (model) => {
  deleteModelTarget.value = model
  await nextTick()
  showDeleteModelConfirm.value = true
}
const closeDeleteModelConfirm = () => {
  showDeleteModelConfirm.value = false
  deleteModelTarget.value = null
}
const confirmDeleteModel = async () => {
  const model = deleteModelTarget.value
  if (!model) return

  try {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      openToast('未找到授权令牌，请重新登录', 'error')
      router.push('/login')
      return
    }

    const response = await fetch(`${API_BASE}/api/v2/model_config/${model.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.status === 401) {
      openToast('授权已过期，请重新登录', 'error')
      router.push('/login')
      return
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || errorData.message || '删除失败')
    }

    openToast('模型删除成功')
    closeDeleteModelConfirm()
    await loadConfiguredModels()
  } catch (error) {
    console.error('[删除模型] 失败:', error)
    openToast(error.message || '删除失败，请稍后重试', 'error')
  }
}
const deleteModel = openDeleteModelConfirm
const saveApiKeyConfig = async () => {
  // 验证必填字段
  if (!apiKeyForm.value.modelName || !apiKeyForm.value.key || !apiKeyForm.value.url) {
    openToast('请填写所有必填字段', 'error')
    return
  }

  try {
    // 获取 token
    const token = localStorage.getItem('accessToken')
    if (!token) {
      openToast('未找到授权令牌，请重新登录', 'error')
      router.push('/login')
      return
    }

    // 准备请求数据
    const requestData = {
      model_name: apiKeyForm.value.modelName.trim(),
      model_type: apiKeyForm.value.modelType || 'LLM',
      base_url: apiKeyForm.value.url.trim(),
      api_key: apiKeyForm.value.key.trim(),
      description: apiKeyForm.value.description ? apiKeyForm.value.description.trim() : ''
    }

    // 判断是编辑还是创建
    const isEditing = editingModelId.value !== null
    const url = isEditing
      ? `${API_BASE}/api/v2/model_config/${editingModelId.value}`
      : `${API_BASE}/api/v2/model_config/create`
    const method = isEditing ? 'PUT' : 'POST'

    // 调用后端 API
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    })

    if (response.status === 401) {
      openToast('授权已过期，请重新登录', 'error')
      router.push('/login')
      return
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[保存模型] 错误详情:', errorData)

      // 处理 FastAPI 的验证错误格式
      let errorMessage = `保存失败 (${response.status})`
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => `${err.loc?.join('.')||'字段'}: ${err.msg}`).join('; ')
        } else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail
        }
      } else if (errorData.message) {
        errorMessage = errorData.message
      }

      throw new Error(errorMessage)
    }

    const result = await response.json()

    openToast(isEditing ? '模型更新成功' : 'API 密钥配置已保存')
    closeApiKeyConfig()

    // 重新加载模型列表
    await loadConfiguredModels()
  } catch (error) {
    console.error('[保存模型] 失败:', error)
    openToast(error.message || '保存失败，请稍后重试', 'error')
  }
}
const configureProvider = (p) => { p.configured = true }
const viewProviderDetail = (p) => {
  const q = encodeURIComponent((p.name || '') + ' API')
  const url = 'https://www.google.com/search?q=' + q
  window.open(url, '_blank')
}
const showAddModelModal = ref(false)
const addModelProvider = ref(null)
const addModelName = ref('')
const addModelType = ref('LLM')
const addModelApiKey = ref('')
const addModelEndpoint = ref('')
const addModelError = ref('')
const openAddModelModal = async (p) => {
  addModelProvider.value = p
  addModelName.value = ''
  addModelType.value = 'LLM'
  addModelApiKey.value = ''
  addModelEndpoint.value = ''
  addModelError.value = ''
  await nextTick()
  showAddModelModal.value = true
}
const cancelAddModel = () => {
  showAddModelModal.value = false
  addModelProvider.value = null
  addModelName.value = ''
  addModelType.value = 'LLM'
  addModelApiKey.value = ''
  addModelEndpoint.value = ''
  addModelError.value = ''
}
const confirmAddModel = () => {
  addModelError.value = ''
  const name = addModelName.value.trim()
  if (!name) { addModelError.value = '请输入模型名称'; return }
  if (!addModelType.value) { addModelError.value = '请选择模型类型'; return }
  if (!addModelProvider.value) { addModelError.value = '未选择供应商'; return }
  const m = { id: 'm' + Date.now().toString(36), name, type: addModelType.value, apiKey: addModelApiKey.value.trim(), endpoint: addModelEndpoint.value.trim() }
  addModelProvider.value.models.push(m)
  addModelProvider.value.configured = true
  cancelAddModel()
}
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
  createType.value = ''
  createDesc.value = ''
  nameError.value = ''
  typeError.value = ''
}
const confirmCreate = async () => {
  nameError.value = createName.value.trim() ? '' : t('workspace.field_required')
  typeError.value = createType.value ? '' : t('workspace.field_required')
  const name = createName.value.trim()
  const type = createType.value
  if (!name || !type) return
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : ''
    const res = await fetch(`${API_BASE}/api/v1/script/libraries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ name, type, description: createDesc.value.trim() })
    })
    if (!res.ok) {
      if (res.status === 401) { router.push('/login'); return }
      return
    }
    const lib = await res.json()
    projects.value.unshift({
      id: String(lib.id),
      name: lib.name,
      type: lib.type,
      updated: new Date(lib.created_at).toLocaleString(),
      thumbnail: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=800&auto=format&fit=crop',
      desc: lib.description || ''
    })
    cancelCreate()
  } catch {}
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
const openUpgrade = async () => { openToast('正在开发中，目前没有内容'); showUpgrade.value = false }
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

const loadLibraries = async () => {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : ''
    const res = await fetch(`${API_BASE}/api/v1/script/libraries`, {
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    })
    if (!res.ok) {
      if (res.status === 401) { try { localStorage.setItem('loggedIn','false') } catch {} ; router.push('/login'); return }
      return
    }
    const data = await res.json()
    const mapped = (Array.isArray(data) ? data : []).map(lib => ({
      id: String(lib.id),
      name: lib.name,
      type: lib.type,
      updated: new Date(lib.created_at).toLocaleString(),
      thumbnail: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=800&auto=format&fit=crop',
      desc: lib.description || ''
    }))
    projects.value = mapped
  } catch {}
}
</script>

<template>
  <div class="flex h-screen text-primary bg-light-gray dark:bg-[#121212] dark:text-[#E0E0E0]">
    <aside class="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col dark:bg-[#1E1E1E] dark:border-[#333333]">
      <div class="h-16 flex items-center px-6 border-b border-gray-200 dark:border-[#3A3A3C]">
        <router-link to="/" class="text-2xl font-bold text-primary dark:text-white flex items-center">
          <img src="@/assets/logo.png" :alt="t('brand.name') + ' Logo'" class="h-10 w-auto mr-3 object-contain" />
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
        <div class="mt-4 p-3 bg-brand-green/10 rounded-lg text-center">
          <p class="text-sm font-semibold text-brand-green">更多AI功能正在开发中...</p>
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
              <router-link :to="{ path: '/studio', query: { id: p.id } }" class="block p-6">
                <!-- 用户头像 -->
                <div class="flex items-start justify-between mb-16">
                  <div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <fa :icon="['fas','user']" class="text-gray-400 dark:text-gray-500 text-xl" />
                  </div>
                  <div v-if="p.status" class="px-2 py-1 rounded text-xs font-medium"
                    :class="{
                      'bg-yellow-100 text-yellow-700': p.status === 'draft',
                      'bg-blue-100 text-blue-700': p.status === 'scripting',
                      'bg-purple-100 text-purple-700': p.status === 'rendering',
                      'bg-green-100 text-green-700': p.status === 'published'
                    }">
                    {{ $t('workspace.status.' + p.status) }}
                  </div>
                </div>

                <!-- 文件名 -->
                <h3 class="font-semibold text-primary dark:text-white text-lg mb-2 break-words">{{ p.name }}</h3>
                
                <!-- 类型标签 -->
                <div v-if="p.type" class="mb-6">
                  <span v-if="p.type === 'novel'" class="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    小说剧本
                  </span>
                  <span v-else-if="p.type === 'ad'" class="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    广告创作
                  </span>
                </div>

                <!-- 底部信息 -->
                <div class="space-y-2 text-sm text-secondary dark:text-gray-400">
                  <div class="flex items-center gap-2">
                    <fa :icon="['fas','file']" class="text-xs" />
                    <span>0 文档</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <fa :icon="['fas','clock']" class="text-xs" />
                    <span>{{ p.updated || p.time }}</span>
                  </div>
                </div>
              </router-link>
              <button data-project-menu-button class="absolute top-4 right-4 px-2 py-1 rounded-md bg-transparent text-secondary hover:text-primary dark:text-[#E0E0E0] dark:hover:text-white" @click.stop="toggleMenu(p.id)">
                <span class="inline-block align-middle text-xl leading-none">…</span>
              </button>
              <div v-if="openMenuId===p.id" data-project-menu class="absolute top-12 right-4 z-20 w-40 rounded-xl border border-gray-200 bg-white shadow-xl dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
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
                  <div v-if="p.episodes!=null" class="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white">
                    {{ p.episodes }} {{ $t('workspace.episodes') }}
                  </div>
                </div>
                <div>
                  <div class="font-medium text-primary dark:text-white text-base">{{ p.name }}</div>
                  <div class="flex items-center gap-3 mt-1">
                    <span v-if="p.type === 'novel'" class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      小说剧本
                    </span>
                    <span v-else-if="p.type === 'ad'" class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      广告创作
                    </span>
                    <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-[#333333] dark:text-gray-300">
                      <span v-if="p.status">{{ $t('workspace.status.' + p.status) }}</span>
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

        <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/40"></div>
          <div class="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 p-6 dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
            <h3 class="text-xl font-semibold text-primary dark:text-white">{{ $t('workspace.new_design') }}</h3>
            <div class="mt-4 space-y-4">
              <div>
                <label class="block text-sm font-medium text-secondary dark:text-gray-300">
                  {{ $t('workspace.design_name') }}
                  <span class="text-red-500 ml-0.5">*</span>
                </label>
                <input v-model="createName" type="text" class="mt-1 w-full bg-light-gray border rounded-lg py-2 px-3 focus:outline-none focus:ring-0 dark:bg-black/30 dark:text-[#E0E0E0]" :class="nameError ? 'border-red-500 focus:border-red-500 dark:border-red-500' : 'border-gray-300 focus:border-brand-green dark:border-[#3A3A3C]'" :placeholder="$t('workspace.enter_design_name')" required>
                <p v-if="nameError" class="mt-1 text-xs text-red-500">{{ nameError }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-secondary dark:text-gray-300">
                  类型选择
                  <span class="text-red-500 ml-0.5">*</span>
                </label>
                <div class="mt-1 grid grid-cols-2 gap-3">
                  <button type="button" @click="createType = 'novel'" class="px-4 py-2 rounded-lg border text-sm font-medium transition-all" :class="createType === 'novel' ? 'border-brand-green bg-brand-green/10 text-brand-green' : 'border-gray-300 text-secondary hover:border-brand-green dark:border-[#3A3A3C] dark:text-gray-300'">
                    小说剧本
                  </button>
                  <button type="button" @click="createType = 'ad'" class="px-4 py-2 rounded-lg border text-sm font-medium transition-all" :class="createType === 'ad' ? 'border-brand-green bg-brand-green/10 text-brand-green' : 'border-gray-300 text-secondary hover:border-brand-green dark:border-[#3A3A3C] dark:text-gray-300'">
                    广告创作
                  </button>
                </div>
                <p v-if="typeError" class="mt-1 text-xs text-red-500">{{ typeError }}</p>
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
        <div v-if="showDuplicate" class="fixed inset-0 z-50 flex items-center justify-center">
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

        <!-- 删除确认弹窗 -->
        <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/40" @click="cancelDelete"></div>
          <div class="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 p-6 dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <fa :icon="['fas','triangle-exclamation']" class="text-red-600 dark:text-red-400 text-xl" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-primary dark:text-white">{{ $t('workspace.confirm_delete') }}</h3>
                <p class="mt-2 text-sm text-secondary dark:text-gray-400">
                  {{ $t('workspace.delete_warning') }} <span class="font-semibold text-primary dark:text-white">"{{ deleteTargetName }}"</span>{{ $t('workspace.delete_warning_suffix') }}
                </p>
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-3">
              <button class="px-4 py-2 rounded-lg border border-gray-300 text-secondary hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-gray-300 dark:hover:bg-[#3A3A3C]" @click="cancelDelete">{{ $t('workspace.cancel') }}</button>
              <button class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700" @click="confirmDelete">{{ $t('workspace.delete') }}</button>
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
              <div v-else-if="settingsTab==='providers'" class="space-y-8">
                <!-- Header -->
                <div class="flex items-center justify-between">
                  <div class="text-xl font-bold text-primary dark:text-white">模型列表</div>
                  <button class="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-primary hover:bg-gray-50 flex items-center gap-2 dark:bg-[#2C2C2E] dark:border-[#3A3A3C] dark:text-white dark:hover:bg-[#3A3A3C]" @click="openSystemModelSettings">
                    <fa :icon="['fas','sliders']" />
                    系统模型设置
                  </button>
                </div>

                <!-- Configured Models (Mock for OpenAI) -->
                <div class="rounded-xl bg-gray-100 border border-gray-200 p-4 dark:bg-[#1E1E1E] dark:border-[#333333]">
                  <div class="flex items-start justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center dark:bg-[#2C2C2E]">
                        <img src="https://unpkg.com/@lobehub/icons-static-png@latest/light/openai.png" class="w-8 h-8 object-contain" />
                      </div>
                      <div>
                        <div class="font-bold text-lg text-primary dark:text-white">OpenAI-Compatible</div>
                        <div class="flex gap-2 mt-1">
                          <span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-600 dark:bg-[#333333] dark:text-gray-400">LLM</span>
                          <span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-600 dark:bg-[#333333] dark:text-gray-400">TEXT EMBEDDING</span>
                          <span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-600 dark:bg-[#333333] dark:text-gray-400">SPEECH2TEXT</span>
                          <span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-600 dark:bg-[#333333] dark:text-gray-400">MODERATION</span>
                          <span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-600 dark:bg-[#333333] dark:text-gray-400">TTS</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="mt-4 pt-3 border-t border-gray-200 dark:border-[#333333] flex items-center justify-between">
                    <button v-if="configuredModels.length > 0" class="text-sm text-secondary hover:text-primary flex items-center gap-1 dark:text-gray-400 dark:hover:text-white" @click="toggleModelList">
                      {{ configuredModels.length }}个模型 <fa :icon="['fas', showModelList ? 'chevron-down' : 'chevron-right']" class="text-xs" />
                    </button>
                    <div v-else class="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                      <fa :icon="['fas','circle-info']" />
                      <span>请配置 API 密钥，添加模型。</span>
                    </div>
                    <div class="flex items-center gap-3">
                      <button v-if="configuredModels.length > 0" class="text-sm text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white">管理凭据</button>
                      <button class="text-sm text-secondary hover:text-primary flex items-center gap-1 dark:text-gray-400 dark:hover:text-white" @click="openApiKeyConfig">
                        <fa :icon="['fas','plus-circle']" /> 添加模型
                      </button>
                    </div>
                  </div>

                  <!-- 模型列表展开区域 -->
                  <div v-if="showModelList && configuredModels.length > 0" class="mt-4 space-y-3">
                    <div v-for="model in configuredModels" :key="model.id" class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:bg-[#1E1E1E] dark:border-[#333333]">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="flex items-center gap-2">
                            <div class="font-medium text-primary dark:text-white">{{ model.modelName }}</div>
                            <span v-if="model.modelType" class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-600 dark:bg-[#333333] dark:text-gray-400">
                              {{ model.modelType }}
                            </span>
                          </div>
                          <div class="text-xs text-secondary mt-1 dark:text-gray-400">{{ model.url }}</div>
                          <div v-if="model.description" class="text-xs text-secondary mt-1 dark:text-gray-400">{{ model.description }}</div>
                        </div>
                        <div class="flex items-center gap-2">
                          <button class="text-gray-400 hover:text-primary dark:hover:text-white" title="编辑" @click="editModel(model)">
                            <fa :icon="['fas','pen-to-square']" class="text-sm" />
                          </button>
                          <button class="text-gray-400 hover:text-red-500" title="删除" @click="deleteModel(model)">
                            <fa :icon="['fas','trash']" class="text-sm" />
                          </button>
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
        <div v-if="showAddModelModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/30 backdrop-blur-md" @click="cancelAddModel"></div>
          <div class="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
            <div class="p-6">
              <div class="flex items-start justify-between">
                <div>
                  <div class="text-xl font-semibold text-primary dark:text-white">添加模型</div>
                  <div class="mt-1 text-sm text-secondary dark:text-gray-300" v-if="addModelProvider">{{ addModelProvider.name }}</div>
                </div>
                <button class="text-secondary hover:text-primary" @click="cancelAddModel"><fa :icon="['fas','xmark']" class="text-xl" /></button>
              </div>
              <div class="mt-4 space-y-4">
                <div>
                  <label class="block text-sm font-medium text-secondary dark:text-gray-300">模型名称</label>
                  <input v-model="addModelName" type="text" class="mt-1 w-full bg-light-gray border rounded-lg py-2 px-3 focus:outline-none focus:ring-0 dark:bg-black/30 dark:text-[#E0E0E0]" :class="'border-gray-300 focus:border-brand-green dark:border-[#3A3A3C]'" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-secondary dark:text-gray-300">类型</label>
                  <select v-model="addModelType" class="mt-1 w-full bg-light-gray border rounded-lg py-2 px-3 focus:outline-none focus:ring-0 dark:bg-black/30 dark:text-[#E0E0E0]" :class="'border-gray-300 focus:border-brand-green dark:border-[#3A3A3C]'">
                    <option value="LLM">LLM</option>
                    <option value="Embedding">Embedding</option>
                    <option value="Vision">Vision</option>
                    <option value="Speech">Speech</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-secondary dark:text-gray-300">API Key</label>
                  <input v-model="addModelApiKey" type="text" class="mt-1 w-full bg-light-gray border rounded-lg py-2 px-3 focus:outline-none focus:ring-0 dark:bg-black/30 dark:text-[#E0E0E0]" :class="'border-gray-300 focus:border-brand-green dark:border-[#3A3A3C]'" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-secondary dark:text-gray-300">Endpoint</label>
                  <input v-model="addModelEndpoint" type="text" class="mt-1 w-full bg-light-gray border rounded-lg py-2 px-3 focus:outline-none focus:ring-0 dark:bg-black/30 dark:text-[#E0E0E0]" :class="'border-gray-300 focus:border-brand-green dark:border-[#3A3A3C]'" placeholder="https://api.example.com/v1" />
                </div>
                <p v-if="addModelError" class="text-xs text-red-500">{{ addModelError }}</p>
              </div>
              <div class="mt-6 flex justify-end gap-3">
                <button class="px-4 py-2 rounded-lg border border-gray-300 text-secondary hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-gray-300 dark:hover:bg-[#3A3A3C]" @click="cancelAddModel">取消</button>
                <button class="px-4 py-2 rounded-lg" :class="!addModelName ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-300' : 'bg-brand-green text-white hover:bg-brand-green/90'" :disabled="!addModelName" @click="confirmAddModel">确认</button>
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
          <div class="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
            <div class="p-8 text-center">
              <h3 class="text-2xl font-bold text-primary dark:text-white">功能正在开发中</h3>
              <p class="text-secondary mt-2">目前没有内容</p>
              <div class="mt-6 flex justify-center">
                <button class="px-4 py-2 rounded-md bg-brand-green text-white hover:bg-brand-green/90" @click="closeUpgrade">知道了</button>
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
      <teleport to="body">
        <div v-if="showSystemModelSettings" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/30 backdrop-blur-md" @click="closeSystemModelSettings"></div>
          <div class="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 dark:bg-[#2C2C2E] dark:border-[#3A3A3C] max-h-[90vh] flex flex-col">
            <div class="p-6 border-b border-gray-200 dark:border-[#3A3A3C] flex-shrink-0">
              <div class="flex items-center justify-between">
                 <h3 class="text-lg font-bold text-primary dark:text-white">系统模型设置</h3>
                 <button class="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-100 dark:border-[#3A3A3C] dark:hover:bg-[#3A3A3C]" @click="closeSystemModelSettings">
                    关闭
                 </button>
              </div>
            </div>

            <div class="p-6 overflow-y-auto flex-1">
              <div class="space-y-5">
                 <!-- System Reasoning -->
                 <div>
                   <div class="flex items-center gap-2 mb-2">
                     <label class="text-sm font-bold text-primary dark:text-white">系统推理模型</label>
                     <fa :icon="['fas','circle-question']" class="text-gray-400 text-sm" />
                   </div>
                   <div v-if="loadingModels" class="text-center py-2">
                     <span class="text-xs text-secondary dark:text-gray-400">加载中...</span>
                   </div>
                   <div v-else-if="availableModels.LLM.length === 0" class="bg-gray-100 rounded-lg py-2 px-3 text-sm text-gray-400 dark:bg-[#1E1E1E]">
                     暂无可用模型
                   </div>
                   <div v-else class="relative">
                     <ModelSelector
                       v-model="systemReasoningModel"
                       :models="availableModels.LLM"
                       :get-provider-icon="getProviderIcon"
                       placeholder="请选择模型"
                       @open-settings="openApiKeyConfig"
                     />
                     <div class="absolute right-8 top-2.5 pointer-events-none z-10">
                        <span class="text-[10px] px-1.5 py-0.5 rounded border border-gray-300 text-gray-500 bg-white dark:bg-[#2C2C2E] dark:border-[#3A3A3C] dark:text-gray-400">CHAT</span>
                     </div>
                   </div>
                 </div>

                 <!-- Embedding -->
                 <div>
                   <div class="flex items-center gap-2 mb-2">
                     <label class="text-sm font-bold text-primary dark:text-white">Embedding 模型</label>
                     <fa :icon="['fas','circle-question']" class="text-gray-400 text-sm" />
                   </div>
                   <div v-if="loadingModels" class="text-center py-2">
                     <span class="text-xs text-secondary dark:text-gray-400">加载中...</span>
                   </div>
                   <div v-else-if="availableModels.Embedding.length === 0" class="bg-gray-100 rounded-lg py-2 px-3 text-sm text-gray-400 dark:bg-[#1E1E1E]">
                     暂无可用模型
                   </div>
                   <div v-else>
                     <ModelSelector
                       v-model="embeddingModel"
                       :models="availableModels.Embedding"
                       :get-provider-icon="getProviderIcon"
                       placeholder="请选择模型"
                       @open-settings="openApiKeyConfig"
                     />
                   </div>
                 </div>

                 <!-- Rerank -->
                 <div>
                   <div class="flex items-center gap-2 mb-2">
                     <label class="text-sm font-bold text-primary dark:text-white">Rerank 模型</label>
                     <fa :icon="['fas','circle-question']" class="text-gray-400 text-sm" />
                   </div>
                   <div v-if="loadingModels" class="text-center py-2">
                     <span class="text-xs text-secondary dark:text-gray-400">加载中...</span>
                   </div>
                   <div v-else-if="availableModels.Rerank.length === 0" class="bg-gray-100 rounded-lg py-2 px-3 flex items-center justify-between dark:bg-[#1E1E1E]">
                      <div class="flex items-center gap-2 text-gray-400">
                        <fa :icon="['fas','cubes']" />
                        <span class="text-sm">暂无可用模型</span>
                      </div>
                      <button class="text-gray-500 hover:text-primary dark:hover:text-white" @click="openApiKeyConfig">
                        <fa :icon="['fas','sliders']" />
                      </button>
                   </div>
                   <div v-else>
                     <ModelSelector
                       v-model="rerankModel"
                       :models="availableModels.Rerank"
                       :get-provider-icon="getProviderIcon"
                       placeholder="请选择模型"
                       @open-settings="openApiKeyConfig"
                     />
                   </div>
                 </div>

                 <!-- Speech to Text -->
                 <div>
                   <div class="flex items-center gap-2 mb-2">
                     <label class="text-sm font-bold text-primary dark:text-white">语音转文本模型</label>
                     <fa :icon="['fas','circle-question']" class="text-gray-400 text-sm" />
                   </div>
                   <div v-if="loadingModels" class="text-center py-2">
                     <span class="text-xs text-secondary dark:text-gray-400">加载中...</span>
                   </div>
                   <div v-else-if="availableModels.STT.length === 0" class="bg-gray-100 rounded-lg py-2 px-3 text-sm text-gray-400 dark:bg-[#1E1E1E]">
                     暂无可用模型
                   </div>
                   <div v-else>
                     <ModelSelector
                       v-model="speechToTextModel"
                       :models="availableModels.STT"
                       :get-provider-icon="getProviderIcon"
                       placeholder="请选择模型"
                       @open-settings="openApiKeyConfig"
                     />
                   </div>
                 </div>

                 <!-- Text to Speech -->
                 <div>
                   <div class="flex items-center gap-2 mb-2">
                     <label class="text-sm font-bold text-primary dark:text-white">文本转语音模型</label>
                     <fa :icon="['fas','circle-question']" class="text-gray-400 text-sm" />
                   </div>
                   <div v-if="loadingModels" class="text-center py-2">
                     <span class="text-xs text-secondary dark:text-gray-400">加载中...</span>
                   </div>
                   <div v-else-if="availableModels.TTS.length === 0" class="bg-gray-100 rounded-lg py-2 px-3 flex items-center justify-between dark:bg-[#1E1E1E]">
                      <div class="flex items-center gap-2 text-gray-400">
                        <fa :icon="['fas','cubes']" />
                        <span class="text-sm">暂无可用模型</span>
                      </div>
                      <button class="text-gray-500 hover:text-primary dark:hover:text-white" @click="openApiKeyConfig">
                        <fa :icon="['fas','sliders']" />
                      </button>
                   </div>
                   <div v-else>
                     <ModelSelector
                       v-model="textToSpeechModel"
                       :models="availableModels.TTS"
                       :get-provider-icon="getProviderIcon"
                       placeholder="请选择模型"
                       @open-settings="openApiKeyConfig"
                     />
                   </div>
                 </div>

                 <!-- Video Generation -->
                 <div>
                   <div class="flex items-center gap-2 mb-2">
                     <label class="text-sm font-bold text-primary dark:text-white">视频生成模型</label>
                     <fa :icon="['fas','circle-question']" class="text-gray-400 text-sm" />
                   </div>
                   <div v-if="loadingModels" class="text-center py-2">
                     <span class="text-xs text-secondary dark:text-gray-400">加载中...</span>
                   </div>
                   <div v-else-if="availableModels.Video.length === 0" class="bg-gray-100 rounded-lg py-2 px-3 text-sm text-gray-400 dark:bg-[#1E1E1E]">
                     暂无可用模型
                   </div>
                   <div v-else>
                     <ModelSelector
                       v-model="videoModel"
                       :models="availableModels.Video"
                       :get-provider-icon="getProviderIcon"
                       placeholder="请选择模型"
                       @open-settings="openApiKeyConfig"
                     />
                   </div>
                 </div>

                 <!-- Image Generation -->
                 <div>
                   <div class="flex items-center gap-2 mb-2">
                     <label class="text-sm font-bold text-primary dark:text-white">图片生成模型</label>
                     <fa :icon="['fas','circle-question']" class="text-gray-400 text-sm" />
                   </div>
                   <div v-if="loadingModels" class="text-center py-2">
                     <span class="text-xs text-secondary dark:text-gray-400">加载中...</span>
                   </div>
                   <div v-else-if="availableModels.Image.length === 0" class="bg-gray-100 rounded-lg py-2 px-3 text-sm text-gray-400 dark:bg-[#1E1E1E]">
                     暂无可用模型
                   </div>
                   <div v-else>
                     <ModelSelector
                       v-model="imageModel"
                       :models="availableModels.Image"
                       :get-provider-icon="getProviderIcon"
                       placeholder="请选择模型"
                       @open-settings="openApiKeyConfig"
                     />
                   </div>
                 </div>
              </div>
            </div>

            <div class="p-6 border-t border-gray-200 dark:border-[#3A3A3C] flex-shrink-0">
              <div class="flex justify-end gap-3">
                <button class="px-4 py-2 rounded-lg border border-gray-300 text-secondary hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-gray-300 dark:hover:bg-[#3A3A3C]" @click="closeSystemModelSettings">取消</button>
                <button class="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium" @click="saveSystemModelSettings">保存</button>
              </div>
            </div>
          </div>
        </div>
      </teleport>
      <teleport to="body">
        <div v-if="showApiKeyConfig" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/30 backdrop-blur-md" @click="closeApiKeyConfig"></div>
          <div class="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
            <div class="p-8">
              <div class="flex items-start justify-between mb-4">
                 <div>
                   <h3 class="text-xl font-bold text-primary dark:text-white mb-1">{{ editingModelId ? '更新 API 密钥授权配置' : 'API 密钥授权配置' }}</h3>
                   <p class="text-sm text-secondary dark:text-gray-400">配置凭据后，工作空间中的所有成员都可以在编排应用时使用此模型。</p>
                 </div>
                 <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" @click="closeApiKeyConfig">
                    <fa :icon="['fas','xmark']" class="text-lg" />
                 </button>
              </div>

              <div class="space-y-5">
                 <!-- 模型名称 -->
                 <div>
                   <label class="block text-sm font-bold text-primary dark:text-white mb-2">模型名称 <span class="text-red-500">*</span></label>
                   <input v-model="apiKeyForm.modelName" type="text" placeholder="请输入模型名称" class="w-full bg-gray-100 border-none rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-green dark:bg-[#1E1E1E] dark:text-[#E0E0E0]" />
                 </div>

                 <!-- 模型类型 -->
                 <div>
                   <label class="block text-sm font-bold text-primary dark:text-white mb-2">模型类型</label>
                   <select v-model="apiKeyForm.modelType" class="w-full bg-gray-100 border-none rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-green dark:bg-[#1E1E1E] dark:text-[#E0E0E0]">
                     <option value="">请选择模型类型</option>
                     <option value="LLM">LLM</option>
                     <option value="TEXT_EMBEDDING">TEXT EMBEDDING</option>
                     <option value="RERANK">RERANK</option>
                     <option value="SPEECH2TEXT">SPEECH2TEXT</option>
                     <option value="TTS">TTS</option>
                     <option value="IMAGE_GENERATION">IMAGE GENERATION</option>
                     <option value="VIDEO_GENERATION">VIDEO GENERATION</option>
                   </select>
                 </div>

                 <!-- Key -->
                 <div>
                   <label class="block text-sm font-bold text-primary dark:text-white mb-2">Key <span class="text-red-500">*</span></label>
                   <input v-model="apiKeyForm.key" type="password" placeholder="在此输入您的 Key" class="w-full bg-gray-100 border-none rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-green dark:bg-[#1E1E1E] dark:text-[#E0E0E0]" />
                 </div>

                 <!-- URL -->
                 <div>
                   <label class="block text-sm font-bold text-primary dark:text-white mb-2">URL <span class="text-red-500">*</span></label>
                   <input v-model="apiKeyForm.url" type="text" placeholder="在此输入您的 URL，如：https://api.openai.com" class="w-full bg-gray-100 border-none rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-green dark:bg-[#1E1E1E] dark:text-[#E0E0E0]" />
                 </div>

                 <!-- 描述 -->
                 <div>
                   <label class="block text-sm font-bold text-primary dark:text-white mb-2">描述</label>
                   <textarea v-model="apiKeyForm.description" placeholder="请输入描述（可选）" rows="3" class="w-full bg-gray-100 border-none rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-brand-green dark:bg-[#1E1E1E] dark:text-[#E0E0E0] resize-none"></textarea>
                 </div>
              </div>

              <div class="mt-8 flex items-center justify-between">
                <a href="#" class="text-brand-green text-sm font-medium hover:underline flex items-center gap-1">
                  从 OpenAI 获取 API Key <fa :icon="['fas','arrow-up-right-from-square']" class="text-xs" />
                </a>
                <div class="flex gap-3">
                  <button class="px-6 py-2 rounded-lg border border-gray-300 text-secondary hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-gray-300 dark:hover:bg-[#3A3A3C]" @click="closeApiKeyConfig">取消</button>
                  <button class="px-8 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium" @click="saveApiKeyConfig">{{ editingModelId ? '更新配置' : '保存' }}</button>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-8 py-3 border-t border-gray-200 dark:bg-[#1E1E1E] dark:border-[#3A3A3C]">
               <div class="flex items-center gap-2 text-xs text-secondary dark:text-gray-400">
                 <fa :icon="['fas','lock']" />
                 您的密钥将使用 PKCS1_OAEP 技术进行加密和存储。
               </div>
            </div>
          </div>
        </div>
      </teleport>
      <!-- 删除模型确认弹窗 -->
      <teleport to="body">
        <div v-if="showDeleteModelConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/40" @click="closeDeleteModelConfirm"></div>
          <div class="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 p-6 dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <fa :icon="['fas','triangle-exclamation']" class="text-red-600 dark:text-red-400 text-xl" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-primary dark:text-white">确认删除模型</h3>
                <p class="mt-2 text-sm text-secondary dark:text-gray-400">
                  确定要删除模型 <span class="font-semibold text-primary dark:text-white">"{{ deleteModelTarget?.modelName }}"</span> 吗？此操作无法撤销。
                </p>
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-3">
              <button class="px-4 py-2 rounded-lg border border-gray-300 text-secondary hover:bg-gray-100 dark:border-[#3A3A3C] dark:text-gray-300 dark:hover:bg-[#3A3A3C]" @click="closeDeleteModelConfirm">取消</button>
              <button class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700" @click="confirmDeleteModel">删除</button>
            </div>
          </div>
        </div>
      </teleport>
</template>
