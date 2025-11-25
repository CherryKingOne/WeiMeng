<script setup>
import { ref, onMounted, onBeforeUnmount, computed, reactive, watch } from 'vue'
import JSZip from 'jszip'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const projectId = route.query.id
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:7767'

// Library info
const libraryInfo = ref({
  name: '加载中...',
  description: '',
  created_at: '',
  updated_at: ''
})

const loadLibraryInfo = async () => {
  if (!projectId) return

  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : ''
    const res = await fetch(`${API_BASE}/api/v1/script/libraries/${projectId}`, {
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    })

    if (!res.ok) {
      if (res.status === 401) {
        router.push('/login')
        return
      }
      console.error('Failed to load library info')
      libraryInfo.value.name = '未知剧本库'
      return
    }

    const data = await res.json()
    libraryInfo.value = {
      name: data.name || '未命名剧本库',
      description: data.description || '',
      created_at: data.created_at || '',
      updated_at: data.updated_at || ''
    }
  } catch (error) {
    console.error('Error loading library info:', error)
    libraryInfo.value.name = '加载失败'
  }
}

const formatLastSaved = computed(() => {
  if (!libraryInfo.value.updated_at) return '未知'
  try {
    const date = new Date(libraryInfo.value.updated_at)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}小时前`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}天前`
    
    return date.toLocaleDateString('zh-CN')
  } catch (e) {
    return '未知'
  }
})

const activeTab = ref('script')
const scriptMode = ref('selection') // 'selection', 'write', 'upload'
const tabs = [
  { id: 'script', label: '剧本创作', icon: 'book' },
  { id: 'files', label: '剧本文件管理', icon: 'folder' },
  { id: 'videoAssets', label: '视频素材管理', icon: 'film' },
  { id: 'audioAssets', label: '音频素材管理', icon: 'music' },
  { id: 'characters', label: '角色一致性', icon: 'users' },
  { id: 'storyboard', label: '分镜生成', icon: 'clapperboard' },
  { id: 'video', label: '视频剪辑', icon: 'scissors', badge: 'Beta' }
]

const scriptContent = ref('[场景] 豪华办公室，白天\n顾北辰：（冷冷地）这份设计稿重做。\n苏晚晚：（坚定地）我会重新来过。\n旁白：两人的眼神交错，空气凝固。\nJohn: You should reconsider.\nMary: I won\'t.')
const characters = ref([
  { id: 1, name: '顾北辰', role: '男主角', desc: '霸道总裁，冷酷深情', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
  { id: 2, name: '苏晚晚', role: '女主角', desc: '坚韧乐观，设计师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' }
])

const storyboards = ref([
  {
    id: 1,
    scene: '办公室/白天',
    size: '中景',
    shot: '固定',
    duration: '4s',
    desc: '顾北辰坐在办公室，眉头紧锁',
    dialogue: '旁白：气氛紧张',
    sound: '环境音轻微',
    imagePrompt: '冷色调办公室，中景，居中构图',
    videoPrompt: '固定镜头，4秒，中景，缓慢节奏',
    generatedImage: false,
    generatedVideo: false,
    notes: '构图居中，冷色调',
    img: 'https://placehold.co/300x200/333/FFF?text=Scene+1'
  },
  {
    id: 2,
    scene: '办公室门口/白天',
    size: '近景',
    shot: '推镜',
    duration: '3s',
    desc: '苏晚晚推门而入，神色慌张',
    dialogue: '苏晚晚：总监……',
    sound: '门声、脚步声',
    imagePrompt: '门口近景，人物慌张表情，跟随入场',
    videoPrompt: '推镜进入，3秒，人物入场镜头',
    generatedImage: false,
    generatedVideo: false,
    notes: '镜头跟随入场',
    img: 'https://placehold.co/300x200/444/FFF?text=Scene+2'
  },
  {
    id: 3,
    scene: '办公室/白天',
    size: '双人近景',
    shot: '摇镜',
    duration: '5s',
    desc: '两人对视，气氛凝固',
    dialogue: '无对白，眼神交锋',
    sound: '低沉配乐进入',
    imagePrompt: '双人近景，对视，压迫感，慢摇',
    videoPrompt: '摇镜强调压迫感，5秒，低沉配乐',
    generatedImage: false,
    generatedVideo: false,
    notes: '慢摇强调压迫感',
    img: 'https://placehold.co/300x200/555/FFF?text=Scene+3'
  }
])
const storyboardView = ref('detail') // 'compact' | 'detail'

const generateImage = (shot, w, h) => {
  shot.generatedImage = true
  if (w && h) {
    shot.img = `https://placehold.co/${w}x${h}/2f8f2f/FFF?text=Image+Generated`
    return
  }
  if (shot.img) return
  shot.img = 'https://placehold.co/300x200/2f8f2f/FFF?text=Image+Generated'
}

const generateVideo = (shot) => {
  shot.generatedVideo = true
}

const removeShot = (id) => {
  const i = storyboards.value.findIndex(s => s.id === id)
  if (i !== -1) storyboards.value.splice(i, 1)
}

const generateAllImages = () => {
  openSizeModalBatch('image')
}

const generateAllVideos = () => {
  openSizeModalBatch('video')
}

const openActionMenuId = ref(null)
const actionMenuPos = ref({ left: 0, top: 0, width: 144 })
const toggleActionMenu = (id, ev) => {
  if (openActionMenuId.value === id) { openActionMenuId.value = null; return }
  const el = ev?.currentTarget
  if (el) {
    const r = el.getBoundingClientRect()
    actionMenuPos.value = { left: r.right - actionMenuPos.value.width, top: r.bottom + window.scrollY, width: actionMenuPos.value.width }
  }
  openActionMenuId.value = id
}
const closeActionMenu = () => { openActionMenuId.value = null }
const getShotById = (id) => storyboards.value.find(s => s.id === id)

const showSizeModal = ref(false)
const sizeModalMode = ref('single')
const sizeModalAction = ref('image')
const sizeModalShotId = ref(null)
const selectedRatio = ref('1:1')
const ratioOptions = [
  { key: '1:1', w: 2048, h: 2048 },
  { key: '4:3', w: 2304, h: 1728 },
  { key: '3:4', w: 1728, h: 2304 },
  { key: '16:9', w: 2560, h: 1440 },
  { key: '9:16', w: 1440, h: 2560 },
  { key: '3:2', w: 2496, h: 1664 },
  { key: '2:3', w: 1664, h: 2496 },
  { key: '21:9', w: 3024, h: 1296 }
]
const sizeInfoVisible = ref(false)
const openSizeModalForShot = (shot, action) => {
  sizeModalMode.value = 'single'
  sizeModalAction.value = action
  sizeModalShotId.value = shot.id
  showSizeModal.value = true
}
const openSizeModalBatch = (action) => {
  sizeModalMode.value = 'batch'
  sizeModalAction.value = action
  sizeModalShotId.value = null
  showSizeModal.value = true
}
const applySizeSelection = () => {
  const opt = ratioOptions.find(r => r.key === selectedRatio.value)
  if (!opt) { showSizeModal.value = false; return }
  if (sizeModalAction.value === 'image') {
    if (sizeModalMode.value === 'batch') {
      storyboards.value.forEach(s => generateImage(s, opt.w, opt.h))
    } else {
      const s = getShotById(sizeModalShotId.value)
      if (s) generateImage(s, opt.w, opt.h)
    }
  } else {
    if (sizeModalMode.value === 'batch') {
      storyboards.value.forEach(s => generateVideo(s, opt.w, opt.h))
    } else {
      const s = getShotById(sizeModalShotId.value)
      if (s) generateVideo(s, opt.w, opt.h)
    }
  }
  showSizeModal.value = false
}

const currentPreview = ref(null)
const playing = ref(false)
const currentTime = ref(0)
const timelineItems = ref([])
const externalMedia = ref([
  { 
    key: 'demo-video-1', 
    type: 'video', 
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    shortUrl: 'https://s.weimeng.ai/v/abc123',
    label: '示例视频 - 大兔子.mp4',
    uuid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    sceneTags: ['户外', '森林', '动物', '阳光', '草地', '蓝天'],
    videoText: '在一个阳光明媚的早晨,大兔子从树洞里走出来,伸了个懒腰。森林里的鸟儿在欢快地歌唱,蝴蝶在花丛中飞舞。大兔子看到了三只小动物在欺负一只小蝴蝶,他决定教训一下这些坏家伙。经过一番追逐和较量,大兔子成功地保护了小蝴蝶,森林又恢复了往日的宁静。',
    summary: '这是一部关于正义与勇气的短片动画。讲述了善良的大兔子如何保护弱小动物,对抗森林中的欺凌者的故事。画面色彩鲜艳,充满童趣,适合作为儿童教育或温馨场景的素材。',
    duration: '9:56',
    resolution: '1920x1080',
    aspectRatio: '16:9',
    frameRate: '30fps',
    size: '5.3 MB'
  },
  { 
    key: 'demo-video-2', 
    type: 'video', 
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    shortUrl: 'https://s.weimeng.ai/v/def456',
    label: '示例视频 - 大象之梦.mp4',
    uuid: '550e8400-e29b-41d4-a716-446655440000',
    sceneTags: ['科幻', '机械', '未来', '工业', '抽象', '黑暗'],
    videoText: '在一个充满机械装置的神秘空间里,两个角色在探索着这个奇异的世界。巨大的齿轮在转动,管道纵横交错,整个场景充满了超现实主义的色彩。他们穿梭在这个机械迷宫中,寻找着出口,也在寻找着真相。',
    summary: '这是一部实验性的3D动画短片,展现了一个充满想象力的机械世界。画面风格独特,充满工业感和未来感,适合作为科幻、悬疑或实验性项目的视觉素材。',
    duration: '10:53',
    resolution: '1280x720',
    aspectRatio: '16:9',
    frameRate: '24fps',
    size: '6.8 MB'
  },
  { 
    key: 'demo-video-3', 
    type: 'video', 
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    shortUrl: 'https://s.weimeng.ai/v/ghi789',
    label: '宣传片素材.mp4',
    uuid: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    sceneTags: ['宣传', '产品', '现代', '科技', '专业'],
    videoText: '介绍最新的科技产品,展示其卓越的性能和创新的设计。产品在各种场景下的应用,彰显其强大的功能和便捷的使用体验。',
    summary: '这是一段专业的产品宣传视频,画面简洁大气,节奏明快。适合用于商业广告、产品展示或企业宣传片的制作。',
    duration: '0:15',
    resolution: '1920x1080',
    aspectRatio: '16:9',
    frameRate: '60fps',
    size: '2.1 MB'
  },
  { 
    key: 'demo-video-4', 
    type: 'video', 
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    shortUrl: 'https://s.weimeng.ai/v/jkl012',
    label: '短片 - Sintel.mp4',
    uuid: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    sceneTags: ['奇幻', '冒险', '龙', '战斗', '史诗', '情感'],
    videoText: '一位勇敢的女战士在寻找她失散的龙伙伴。她穿越险峻的山脉,对抗强大的敌人,经历了无数的艰难险阻。在最后的战斗中,她发现了一个令人震惊的真相,关于她的龙伙伴的命运。',
    summary: '这是一部史诗级的奇幻冒险动画短片,讲述了友谊、勇气和牺牲的故事。画面精美,情节感人,音乐震撼,适合作为高质量的叙事性视频素材。',
    duration: '14:48',
    resolution: '1920x1080',
    aspectRatio: '16:9',
    frameRate: '24fps',
    size: '8.7 MB'
  }
])
const mediaLibrary = computed(() => {
  const list = []
  storyboards.value.forEach(s => {
    if (s.generatedImage && s.img) list.push({ key: `img-${s.id}`, type: 'image', src: s.img, label: `图片 #${s.id}` })
    if (s.generatedVideo) list.push({ key: `vid-${s.id}`, type: 'video', src: '', label: `视频片段 #${s.id}` })
  })
  externalMedia.value.forEach(m => list.push(m))
  return list
})
const handleDragStart = (item, ev) => {
  ev.dataTransfer.setData('text/plain', JSON.stringify(item))
}
const handleTimelineDrop = (track, ev) => {
  const txt = ev.dataTransfer.getData('text/plain')
  if (!txt) return
  const data = JSON.parse(txt)
  const id = Date.now() + Math.random()
  const duration = 5
  timelineItems.value.push({ id, track, label: data.label, duration })
}
const removeTimelineItem = (id) => {
  const i = timelineItems.value.findIndex(t => t.id === id)
  if (i !== -1) timelineItems.value.splice(i, 1)
}
const togglePlay = () => { playing.value = !playing.value }
const getItemStyle = (it) => {
  const trackItems = timelineItems.value.filter(t => t.track === it.track)
  const idx = trackItems.findIndex(t => t.id === it.id)
  const left = trackItems.slice(0, idx).reduce((acc, cur) => acc + cur.duration, 0) * 40 + 4
  const width = it.duration * 40
  return { left: left + 'px', width: width + 'px' }
}

// Video Assets View Mode
const videoViewMode = ref('grid') // 'grid' or 'list'

// Delete Confirmation Modal
const showDeleteConfirm = ref(false)
const videoToDelete = ref(null)

const openDeleteConfirm = (media) => {
  videoToDelete.value = media
  showDeleteConfirm.value = true
}

const closeDeleteConfirm = () => {
  showDeleteConfirm.value = false
  videoToDelete.value = null
}

const confirmDeleteVideo = async () => {
  if (!videoToDelete.value || !videoToDelete.value.fileId) return

  try {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(`${API_BASE}/api/v1/script/files/${videoToDelete.value.fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        router.push('/login')
        return
      }
      throw new Error('删除失败')
    }

    // Remove from local list
    const index = externalMedia.value.findIndex(m => m.fileId === videoToDelete.value.fileId)
    if (index !== -1) {
      externalMedia.value.splice(index, 1)
    }

    showToastMessage('视频删除成功', 'success')
    closeDeleteConfirm()
  } catch (error) {
    console.error('Delete error:', error)
    showToastMessage(error.message || '删除失败', 'error')
  }
}

// Video Upload Modal
const showVideoUploadModal = ref(false)
const videoUploadFiles = ref([])

// AI Configuration Menu
const showAIConfigMenu = ref(false)
const aiConfig = ref({
  model: 'gpt-4',
  temperature: { enabled: false, value: 0 },
  topP: { enabled: false, value: 1 },
  presencePenalty: { enabled: false, value: 0 },
  frequencyPenalty: { enabled: false, value: 0 },
  maxTokens: { enabled: false, value: 512 },
  seed: { enabled: false, value: 0 },
  responseFormat: { enabled: false, value: 'text' }
})

const showPresetMenu = ref(false)
const currentPreset = ref('custom') // 当前选中的预设，默认为自定义
const presets = {
  creative: {
    label: '创意',
    icon: 'pen-nib',
    color: 'text-purple-500',
    config: {
      temperature: 0.8,
      topP: 0.9,
      presencePenalty: 0.1,
      frequencyPenalty: 0.1
    }
  },
  balanced: {
    label: '平衡',
    icon: 'scale-balanced',
    color: 'text-blue-500',
    config: {
      temperature: 0.5,
      topP: 0.85,
      presencePenalty: 0.2,
      frequencyPenalty: 0.3
    }
  },
  precise: {
    label: '精确',
    icon: 'bullseye',
    color: 'text-teal-500',
    config: {
      temperature: 0.2,
      topP: 0.75,
      presencePenalty: 0.5,
      frequencyPenalty: 0.5
    }
  },
  custom: {
    label: '自定义',
    icon: 'sliders',
    color: 'text-gray-500'
  }
}

const togglePresetMenu = () => {
  showPresetMenu.value = !showPresetMenu.value
}

const applyPreset = (key) => {
  const preset = presets[key]
  if (!preset) return

  // 如果是自定义预设，只更新当前预设状态，不修改配置
  if (key === 'custom') {
    currentPreset.value = key
    showPresetMenu.value = false
    return
  }

  // 应用预设配置
  if (preset.config) {
    aiConfig.value.temperature.enabled = true
    aiConfig.value.temperature.value = preset.config.temperature

    aiConfig.value.topP.enabled = true
    aiConfig.value.topP.value = preset.config.topP

    aiConfig.value.presencePenalty.enabled = true
    aiConfig.value.presencePenalty.value = preset.config.presencePenalty

    aiConfig.value.frequencyPenalty.enabled = true
    aiConfig.value.frequencyPenalty.value = preset.config.frequencyPenalty
  }

  currentPreset.value = key
  showPresetMenu.value = false
}

// 当用户修改配置时，自动切换到自定义预设
const onConfigChange = () => {
  if (currentPreset.value !== 'custom') {
    currentPreset.value = 'custom'
  }
}

const toggleAIConfigMenu = () => {
  showAIConfigMenu.value = !showAIConfigMenu.value
}

const closeAIConfigMenu = () => {
  showAIConfigMenu.value = false
}

// Model Selection Menu
const showModelMenu = ref(false)
const modelSearchQuery = ref('')

const availableModels = [
  { id: 'chatgpt-4o-latest', name: 'chatgpt-4o-latest', provider: 'OpenAI', icon: 'robot', color: 'text-blue-500' },
  { id: 'gpt-4o', name: 'gpt-4o', provider: 'OpenAI', icon: 'robot', color: 'text-blue-500' },
  { id: 'gpt-4o-mini', name: 'gpt-4o-mini', provider: 'OpenAI', icon: 'robot', color: 'text-blue-500' },
  { id: 'gpt-4o-mini-2024-07-18', name: 'gpt-4o-mini-2024-07-18', provider: 'OpenAI', icon: 'robot', color: 'text-blue-500' },
  { id: 'gpt-4', name: 'gpt-4', provider: 'OpenAI', icon: 'robot', color: 'text-purple-500' },
  { id: 'gpt-3.5-turbo', name: 'gpt-3.5-turbo', provider: 'OpenAI', icon: 'robot', color: 'text-green-500' },
  { id: 'gpt-3.5-turbo-0125', name: 'gpt-3.5-turbo-0125', provider: 'OpenAI', icon: 'robot', color: 'text-green-500' },
  { id: 'gpt-3.5-turbo-1106', name: 'gpt-3.5-turbo-1106', provider: 'OpenAI', icon: 'robot', color: 'text-green-500' },
  { id: 'gpt-3.5-turbo-16k', name: 'gpt-3.5-turbo-16k', provider: 'OpenAI', icon: 'robot', color: 'text-green-500' },
  { id: 'gpt-3.5-turbo-instruct', name: 'gpt-3.5-turbo-instruct', provider: 'OpenAI', icon: 'robot', color: 'text-green-500' }
]

const filteredModels = computed(() => {
  if (!modelSearchQuery.value) return availableModels
  const query = modelSearchQuery.value.toLowerCase()
  return availableModels.filter(model =>
    model.name.toLowerCase().includes(query) ||
    model.provider.toLowerCase().includes(query)
  )
})

const currentModel = computed(() => {
  return availableModels.find(m => m.id === aiConfig.value.model) || availableModels[4]
})

const toggleModelMenu = () => {
  showModelMenu.value = !showModelMenu.value
  if (showModelMenu.value) {
    modelSearchQuery.value = ''
  }
}

const selectModel = (modelId) => {
  aiConfig.value.model = modelId
  showModelMenu.value = false
  modelSearchQuery.value = ''
}

const getSliderStyle = (value, min, max, enabled) => {
  const percentage = ((value - min) / (max - min)) * 100
  const color = enabled ? '#4285F4' : '#d1d5db' // brand-green or gray-300
  const trackColor = document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb' // gray-700 or gray-200
  
  return {
    background: `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, ${trackColor} ${percentage}%, ${trackColor} 100%)`
  }
}
const videoUploadInput = ref(null)
const videoUploadDragging = ref(false)

const openVideoUploadModal = () => {
  showVideoUploadModal.value = true
  videoUploadFiles.value = []
}

const closeVideoUploadModal = () => {
  showVideoUploadModal.value = false
  videoUploadFiles.value = []
  if (videoUploadInput.value) videoUploadInput.value.value = ''
}

const triggerVideoUploadInput = () => {
  videoUploadInput.value?.click()
}

const handleVideoUploadSelect = (event) => {
  const files = event.target.files
  if (files && files.length > 0) {
    addFilesToUploadList(Array.from(files))
  }
}

const handleVideoUploadDragOver = (event) => {
  event.preventDefault()
  videoUploadDragging.value = true
}

const handleVideoUploadDragLeave = () => {
  videoUploadDragging.value = false
}

const handleVideoUploadDrop = (event) => {
  event.preventDefault()
  videoUploadDragging.value = false
  const files = event.dataTransfer.files
  if (files && files.length > 0) {
    const videoFiles = Array.from(files).filter(f => f.type.startsWith('video/'))
    if (videoFiles.length > 0) {
      addFilesToUploadList(videoFiles)
    } else {
      showToastMessage('请选择视频文件', 'error')
    }
  }
}

const addFilesToUploadList = (files) => {
  files.forEach(file => {
    const fileObj = {
      id: Date.now() + Math.random(),
      file: file,
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      status: 'pending', // pending, uploading, completed, error
      progress: 0,
      error: null
    }
    videoUploadFiles.value.push(fileObj)
    
    // Automatically start upload for this file
    uploadSingleVideoFile(fileObj)
  })
}


const removeUploadFile = (id) => {
  const index = videoUploadFiles.value.findIndex(f => f.id === id)
  if (index !== -1) {
    videoUploadFiles.value.splice(index, 1)
  }
}

const clearUploadList = () => {
  videoUploadFiles.value = []
}

const startBatchUpload = async () => {
  const pendingFiles = videoUploadFiles.value.filter(f => f.status === 'pending' || f.status === 'error')
  
  for (const fileObj of pendingFiles) {
    await uploadSingleVideoFile(fileObj)
  }
  
  // Check if all uploads completed successfully
  const allCompleted = videoUploadFiles.value.every(f => f.status === 'completed')
  if (allCompleted && videoUploadFiles.value.length > 0) {
    showToastMessage('所有视频上传成功', 'success')
    setTimeout(() => {
      closeVideoUploadModal()
      loadMediaFiles() // Reload media list
    }, 1000)
  }
}

const uploadSingleVideoFile = async (fileObj) => {
  if (!projectId) {
    fileObj.status = 'error'
    fileObj.error = '未找到项目ID'
    return
  }

  fileObj.status = 'uploading'
  fileObj.progress = 0

  const formData = new FormData()
  formData.append('file', fileObj.file)

  try {
    const token = localStorage.getItem('accessToken')
    const xhr = new XMLHttpRequest()

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        fileObj.progress = Math.round((e.loaded / e.total) * 100)
      }
    })

    // Handle completion
    await new Promise((resolve, reject) => {
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Handle large integer IDs by converting to strings before JSON parsing
          const text = xhr.responseText.replace(/"id":(\d{15,})/g, '"id":"$1"')
          const result = JSON.parse(text)
          fileObj.status = 'completed'
          fileObj.progress = 100

          // Add to externalMedia list
          externalMedia.value.push({
            key: result.id.toString(),
            type: result.file_type,
            src: result.file_url,
            label: result.filename,
            uuid: result.id.toString(),
            fileId: result.id
          })

          resolve()
        } else {
          reject(new Error(`上传失败: ${xhr.statusText}`))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('网络错误'))
      })

      xhr.open('POST', `${API_BASE}/api/v1/script/libraries/${projectId}/files`)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.send(formData)
    })
  } catch (error) {
    console.error('Upload error:', error)
    fileObj.status = 'error'
    fileObj.error = error.message || '上传失败'
  }
}


const mediaIsDragging = ref(false)
const mediaFileInput = ref(null)
const uploadingMedia = ref(false)

const triggerMediaFileInput = () => { openVideoUploadModal() }

const handleMediaFileSelect = async (event) => {
  const files = event.target.files
  if (files && files.length > 0) {
    for (const file of Array.from(files)) {
      await uploadMediaToBackend(file)
    }
  }
  // Reset input
  if (mediaFileInput.value) mediaFileInput.value.value = ''
}

const handleMediaDragOver = (event) => { 
  event.preventDefault()
  mediaIsDragging.value = true
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
}

const handleMediaDragLeave = () => { mediaIsDragging.value = false }

const handleMediaDrop = async (event) => {
  event.preventDefault()
  mediaIsDragging.value = false
  const files = event.dataTransfer.files
  if (!files || files.length === 0) return
  
  let accepted = 0
  for (const file of Array.from(files)) {
    if (file.type && file.type.startsWith('video/')) {
      await uploadMediaToBackend(file)
      accepted++
    }
  }
  if (accepted === 0) {
    showToastMessage('仅支持拖拽视频文件', 'error')
  }
}


const uploadMediaToBackend = async (file) => {
  if (!projectId) {
    showToastMessage('未找到项目ID', 'error')
    return
  }

  uploadingMedia.value = true
  const formData = new FormData()
  formData.append('file', file)

  try {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(`${API_BASE}/api/v1/script/libraries/${projectId}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })

    if (!response.ok) {
      if (response.status === 401) {
        router.push('/login')
        return
      }
      throw new Error(`上传失败: ${response.statusText}`)
    }

    const result = await response.json()
    
    // Add to externalMedia list
    externalMedia.value.push({
      key: result.id.toString(),
      type: result.file_type,
      src: result.file_url,
      label: result.filename,
      uuid: result.id.toString(),
      fileId: result.id
    })

    showToastMessage('视频上传成功', 'success')
  } catch (error) {
    console.error('Upload error:', error)
    showToastMessage(error.message || '上传失败', 'error')
  } finally {
    uploadingMedia.value = false
  }
}

// Load existing media files from backend
const loadMediaFiles = async () => {
  if (!projectId) return

  try {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(`${API_BASE}/api/v1/script/libraries/${projectId}/files?file_type=video`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        router.push('/login')
        return
      }
      throw new Error('加载视频失败')
    }

    // Handle large integer IDs by converting to strings before JSON parsing
    const text = await response.text()
    const files = JSON.parse(text.replace(/"id":(\d{15,})/g, '"id":"$1"'))

    // Clear demo data and load real data
    externalMedia.value = files.map(file => ({
      key: file.id.toString(),
      type: file.file_type,
      src: file.file_url,
      label: file.filename,
      uuid: file.id.toString(),
      fileId: file.id
    }))
  } catch (error) {
    console.error('Load media error:', error)
  }
}

// Video Preview Modal
const showVideoPreview = ref(false)
const currentVideoPreview = ref(null)
const videoPreviewTab = ref('structure')

const openVideoPreview = (media) => {
  currentVideoPreview.value = media
  showVideoPreview.value = true
}

const closeVideoPreview = () => {
  showVideoPreview.value = false
  currentVideoPreview.value = null
  videoPreviewTab.value = 'structure'
}

const exportVideoJson = () => {
  if (!currentVideoPreview.value) return
  const json = JSON.stringify(currentVideoPreview.value, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${currentVideoPreview.value.label || 'video'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const regenerateImage = (shot) => {
  shot.generatedImage = false
  shot.img = ''
  generateImage(shot)
  openActionMenuId.value = null
}
const regenerateVideo = (shot) => {
  shot.generatedVideo = false
  generateVideo(shot)
  openActionMenuId.value = null
}

const exportStoryboardTable = () => {
  const headers = ['镜号','场景','景别','镜头','时长','画面描述','对白/旁白','音效/音乐','图片提示词','视频提示词','生成图片','生成视频','操作','备注']
  const rows = storyboards.value.map(s => [
    s.id,
    s.scene || '',
    s.size || '',
    s.shot || '',
    s.duration || '',
    (s.desc || '').replace(/\n/g, ' '),
    (s.dialogue || '').replace(/\n/g, ' '),
    s.sound || '',
    (s.imagePrompt || '').replace(/\n/g, ' '),
    (s.videoPrompt || '').replace(/\n/g, ' '),
    s.generatedImage ? '已生成' : '',
    s.generatedVideo ? '已生成' : '',
    '',
    s.notes || ''
  ])
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '分镜表.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const openExportMenu = ref(false)
const toggleExportMenu = () => { openExportMenu.value = !openExportMenu.value }
const closeExportMenu = () => { openExportMenu.value = false }

const exportStoryboardScript = () => {
  exportStoryboardTable()
  closeExportMenu()
}

const exportStoryboardImages = async () => {
  const items = storyboards.value.filter(s => !!s.img)
  if (items.length === 0) { alert('没有可导出的分镜图片'); closeExportMenu(); return }
  const zip = new JSZip()
  await Promise.all(items.map(async s => {
    try {
      const res = await fetch(s.img)
      const blob = await res.blob()
      let ext = 'jpg'
      if (blob.type === 'image/png') ext = 'png'
      else if (blob.type === 'image/jpeg') ext = 'jpg'
      else if (blob.type === 'image/webp') ext = 'webp'
      else {
        const m = String(s.img).match(/\.([a-zA-Z0-9]+)(?:\?|$)/)
        if (m && m[1]) ext = m[1]
      }
      const ab = await blob.arrayBuffer()
      zip.file(`${s.id}.${ext}`, ab)
    } catch (e) {}
  }))
  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = '分镜图片.zip'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  closeExportMenu()
}

const exportStoryboardVideos = () => {
  const headers = ['镜号','视频状态']
  const rows = storyboards.value.map(s => [s.id, s.generatedVideo ? '已生成' : '未生成'])
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '分镜视频.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  closeExportMenu()
}

// Delete confirmation modal
const showDeleteFileConfirm = ref(false)
const deleteFileIndex = ref(-1)
const deleteFileName = ref('')

const openFileSettings = (fileData) => {
  currentSettingsFile.value = fileData
  // Initialize form with defaults or existing values
  settingsForm.description = fileData.description || ''
  settingsForm.permissions = fileData.permissions || 'private'
  settingsForm.parser = fileData.parser || 'DeepDoc'
  settingsForm.embeddingModel = fileData.embeddingModel || 'gpt-5'
  settingsForm.chunkingMethod = fileData.chunkingMethod || 'novel_en'
  settingsForm.chunkSize = fileData.chunkSize || 128
  settingsForm.separator = fileData.separator || '\\n\\n'
  settingsForm.pageRanking = fileData.pageRanking || 0
  settingsForm.keywordExtraction = fileData.keywordExtraction || 0
  settingsForm.questionExtraction = fileData.questionExtraction || 0
  settingsForm.tableToHtml = fileData.tableToHtml || false
  
  showSettingsModal.value = true
}

// Settings Modal
const showSettingsModal = ref(false)
const currentSettingsFile = ref(null)
const settingsForm = reactive({
  description: '',
  permissions: 'private',
  parser: 'DeepDoc',
  embeddingModel: 'gpt-5',
  chunkingMethod: 'novel_en',
  chunkSize: 128,
  separator: '\\n\\n',
  pageRanking: 0,
  keywordExtraction: 0,
  questionExtraction: 0,
  tableToHtml: false
})

const closeSettingsModal = () => {
  showSettingsModal.value = false
  currentSettingsFile.value = null
}

const saveSettings = () => {
  if (currentSettingsFile.value) {
    console.log('Saving settings for:', currentSettingsFile.value.fileName)
    console.log('Form Data:', JSON.parse(JSON.stringify(settingsForm)))
    
    // Update local data
    Object.assign(currentSettingsFile.value, settingsForm)
    
    showToastMessage('设置已保存', 'success')
    closeSettingsModal()
  }
}

const chunkingMethodDetails = {
  novel_en: {
    label: 'Novel',
    formats: 'TXT、MD',
    description: '按照小说文本的分块方式进行分段：',
    steps: [
      '根据小说结构（章节、段落、对白）划分文本片段。'
    ],
    question: '请解释一下什么是"Novel"分块方法？',
    answer: 'Novel分块方法面向小说类文本，依据章节、段落与对白等结构进行分段，使每个块尽量语义完整，便于后续检索与生成。'
  },
  txt: {
    label: 'txt',
    formats: 'TXT',
    description: '此方法适用于纯文本文件：',
    steps: [
      '按行或固定字符数分割文本。',
      '保持简单的文本结构。'
    ],
    question: 'txt分块方法如何工作？',
    answer: 'txt分块方法主要针对纯文本文件，按照预设的规则进行简单的分割...'
  },
  markdown: {
    label: 'markdown',
    formats: 'MD, MARKDOWN',
    description: '此方法适用于Markdown格式文件：',
    steps: [
      '识别Markdown标题和结构。',
      '按章节进行智能分块。'
    ],
    question: 'Markdown分块有什么优势？',
    answer: 'Markdown分块能够保留文档的层级结构，确保每个块包含完整的上下文信息...'
  }
}

const currentChunkingDetail = computed(() => {
  return chunkingMethodDetails[settingsForm.chunkingMethod] || chunkingMethodDetails['novel_en']
})

// Toast notification
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success') // 'success' or 'error'

const theme = ref('light')
const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  if (theme.value === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

const scriptTextarea = ref(null)
const showAiDialog = ref(false)
const aiState = ref('idle') // 'idle', 'generating', 'review'
const aiDialogStyle = ref({ top: '0px', left: '0px' })
const aiInput = ref('')
const generatedContent = ref('')

const openAiDialog = () => {
  if (!scriptTextarea.value) return

  const textarea = scriptTextarea.value
  const { selectionStart, value } = textarea
  
  // Create a mirror div to calculate cursor position
  const div = document.createElement('div')
  const style = window.getComputedStyle(textarea)
  
  // Copy styles
  Array.from(style).forEach(prop => {
    div.style[prop] = style.getPropertyValue(prop)
  })
  
  div.style.position = 'absolute'
  div.style.top = '0'
  div.style.left = '-9999px'
  div.style.visibility = 'hidden'
  div.style.height = 'auto'
  div.style.width = textarea.clientWidth + 'px'
  div.style.overflow = 'hidden'
  div.style.whiteSpace = 'pre-wrap'
  
  // Get text up to cursor
  const text = value.substring(0, selectionStart)
  div.textContent = text
  
  // Add a span to get the position
  const span = document.createElement('span')
  span.textContent = '|'
  div.appendChild(span)
  
  document.body.appendChild(div)
  
  const { offsetLeft, offsetTop } = span
  const { scrollTop } = textarea
  
  // Calculate position relative to the textarea container
  // We add some offset to place it below the line
  const lineHeight = parseInt(style.lineHeight) || 24
  
  // Adjust for textarea's own padding if needed, but offsetLeft/Top from the span inside the div 
  // which mimics the textarea content box should be close. 
  // We need to account for the textarea's position relative to its offset parent if we were positioning absolutely to the container.
  // The container is the relative parent.
  // The textarea might have padding.
  const paddingLeft = parseInt(style.paddingLeft)
  const paddingTop = parseInt(style.paddingTop)
  
  aiDialogStyle.value = {
    left: (offsetLeft + paddingLeft) + 'px',
    top: (offsetTop + paddingTop - scrollTop + lineHeight) + 'px'
  }
  
  document.body.removeChild(div)
  showAiDialog.value = true
  aiState.value = 'idle'
  
  // Focus input next tick
  setTimeout(() => {
    const input = document.querySelector('#ai-input')
    if (input) input.focus()
  }, 0)
}

const closeAiDialog = () => {
  showAiDialog.value = false
  aiState.value = 'idle'
  aiInput.value = ''
  generatedContent.value = ''
}

const startGeneration = () => {
  if (!aiInput.value) return
  aiState.value = 'generating'
  
  // Simulate generation
  setTimeout(() => {
    if (aiState.value === 'generating') {
      aiState.value = 'review'
      generatedContent.value = "顾北辰猛地站起身，椅子在地面划出刺耳的声响。他大步走到落地窗前，背对着苏晚晚，声音低沉得可怕：“你以为我在开玩笑？”"
    }
  }, 2000)
}

const stopGeneration = () => {
  aiState.value = 'idle'
}

const acceptGeneration = () => {
  scriptContent.value += '\n' + generatedContent.value
  closeAiDialog()
}

const rejectGeneration = () => {
  closeAiDialog()
}

// File upload (Multiple files support)
const fileInput = ref(null)
const isDragging = ref(false)
const uploadedFiles = ref([]) // Files being uploaded in modal (temporary)
const existingFiles = ref([]) // Files loaded from backend (persistent)
const showUploadModal = ref(false)
const uploadModalDragging = ref(false)

const openUploadModal = () => {
  showUploadModal.value = true
}

const closeUploadModal = () => {
  showUploadModal.value = false
  uploadModalDragging.value = false
  // Clear the upload list when closing modal
  uploadedFiles.value = []
  if (fileInput.value) fileInput.value.value = ''
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const files = event.target.files
  if (files && files.length > 0) {
    // Process all selected files
    Array.from(files).forEach(file => processFile(file))
  }
}

const handleDragOver = (event) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleUploadDrop = (event) => {
  event.preventDefault()
  isDragging.value = false
  
  const files = event.dataTransfer.files
  if (files && files.length > 0) {
    // Process all dropped files
    Array.from(files).forEach(file => processFile(file))
  }
}

// Upload modal drag handlers
const handleModalDragOver = (event) => {
  event.preventDefault()
  uploadModalDragging.value = true
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
}

const handleModalDragLeave = (event) => {
  // Only set to false if leaving the modal container itself
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY
  if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
    uploadModalDragging.value = false
  }
}

const handleModalDrop = (event) => {
  event.preventDefault()
  uploadModalDragging.value = false
  
  const files = event.dataTransfer.files
  if (files && files.length > 0) {
    Array.from(files).forEach(file => processFile(file))
  }
}

const processFile = async (file) => {
  // Check if file already exists
  const exists = uploadedFiles.value.some(f => f.file.name === file.name && f.file.size === file.size)
  if (exists) {
    alert('文件已存在')
    return
  }

  // Check file size (10MB max)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    alert('文件大小超过 10MB 限制')
    return
  }

  // Check file type
  const validExtensions = ['.txt', '.md', '.doc', '.docx', '.csv', '.xlsx', '.pdf']
  const fileName = file.name.toLowerCase()
  const isValid = validExtensions.some(ext => fileName.endsWith(ext))

  if (!isValid) {
    alert('不支持的文件格式')
    return
  }

  // Add file to the list with initial metadata
  const fileData = reactive({
    file: file,
    chunks: 0,
    progress: 'uploading', // 'uploading', 'completed', 'error'
    processedChunks: 0,
    uploadProgress: 0,
    selected: false // Add selected state
  })
  uploadedFiles.value.push(fileData)

  // Upload file to backend
  await uploadFileToBackend(fileData)
}

const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

const removeFile = (index) => {
  const fileData = existingFiles.value[index]

  // If it's an existing file from backend, show confirmation modal
  if (fileData.isExisting && fileData.fileId) {
    deleteFileIndex.value = index
    deleteFileName.value = fileData.fileName
    showDeleteFileConfirm.value = true
  } else {
    // For files that are still uploading or failed, just remove from list
    existingFiles.value.splice(index, 1)
  }
}

const cancelDeleteFile = () => {
  showDeleteFileConfirm.value = false
  deleteFileIndex.value = -1
  deleteFileName.value = ''
}

const confirmDeleteFile = async () => {
  const index = deleteFileIndex.value
  if (index === -1) return

  const fileData = existingFiles.value[index]

  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : ''
    const res = await fetch(`${API_BASE}/api/v1/script/files/${fileData.fileId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    })

    if (!res.ok) {
      if (res.status === 401) {
        router.push('/login')
        return
      }
      showToastMessage('删除文件失败', 'error')
      cancelDeleteFile()
      return
    }

    // Remove from list after successful deletion
    existingFiles.value.splice(index, 1)
    showToastMessage('文件删除成功', 'success')
    cancelDeleteFile()
  } catch (error) {
    console.error('Error deleting file:', error)
    showToastMessage('删除文件失败', 'error')
    cancelDeleteFile()
  }
}

const uploadFileToBackend = async (fileData) => {
  if (!projectId) {
    alert('未找到剧本库 ID')
    fileData.progress = 'error'
    return
  }

  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : ''
    const formData = new FormData()
    formData.append('file', fileData.file)

    const xhr = new XMLHttpRequest()

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100)
        fileData.uploadProgress = percentComplete
      }
    })

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status === 200 || xhr.status === 201) {
        fileData.progress = 'completed'
        fileData.uploadProgress = 100
        try {
          // Handle large integer IDs by converting to strings before JSON parsing
          const text = xhr.responseText.replace(/"id":(\d{15,})/g, '"id":"$1"')
          const response = JSON.parse(text)

          // Store file ID if returned by backend
          if (response.id) {
            fileData.fileId = response.id
            fileData.isExisting = true
          }
          if (response.filename) {
            fileData.fileName = response.filename
          }

          // Add to existingFiles list after successful upload
          existingFiles.value.push({
            fileId: response.id,
            fileName: response.filename,
            fileUrl: response.file_url,
            fileType: response.file_type,
            file: {
              name: response.filename,
              size: fileData.file.size
            },
            progress: 'completed',
            uploadProgress: 100,
            isExisting: true,
            selected: false
          })
        } catch (e) {
          console.error('Failed to parse response:', e)
        }
      } else if (xhr.status === 401) {
        fileData.progress = 'error'
        router.push('/login')
      } else {
        fileData.progress = 'error'
        alert('文件上传失败')
      }
    })

    // Handle errors
    xhr.addEventListener('error', () => {
      fileData.progress = 'error'
      alert('文件上传失败')
    })

    // Send request
    xhr.open('POST', `${API_BASE}/api/v1/script/libraries/${projectId}/files`)
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }
    xhr.send(formData)
  } catch (error) {
    console.error('Upload error:', error)
    fileData.progress = 'error'
    alert('文件上传失败')
  }
}

const loadExistingFiles = async () => {
  if (!projectId) return

  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : ''
    const res = await fetch(`${API_BASE}/api/v1/script/libraries/${projectId}/files`, {
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    })

    if (!res.ok) {
      if (res.status === 401) {
        router.push('/login')
        return
      }
      console.error('Failed to load files')
      return
    }

    // Get response as text first to preserve large integers
    const text = await res.text()
    // Replace large integer IDs with quoted strings to preserve precision
    const fixedText = text.replace(/"id":(\d{15,})/g, '"id":"$1"')
    const files = JSON.parse(fixedText)

    // Clear existing files and reload
    existingFiles.value = []

    // Convert backend files to the same format as uploaded files
    if (Array.isArray(files)) {
      files.forEach(backendFile => {
        // Calculate file size from URL if available
        let fileSize = 0
        // Since backend doesn't provide file_size, we'll fetch it or show as unknown

        const fileData = reactive({
          fileId: backendFile.id, // Already a string after regex replacement
          fileName: backendFile.filename, // Backend uses 'filename' not 'file_name'
          fileUrl: backendFile.file_url,
          fileType: backendFile.file_type,
          file: {
            name: backendFile.filename,
            size: fileSize // Will be 0 if not available
          },
          progress: 'completed',
          uploadProgress: 100,
          isExisting: true, // Mark as existing file from backend
          selected: false // Add selected state
        })
        existingFiles.value.push(fileData)
      })
    }
  } catch (error) {
    console.error('Error loading files:', error)
  }
}

// File preview functionality
const showFilePreview = ref(false)
const previewFileData = ref(null)
const previewFileContent = ref('')
const previewFileLoading = ref(false)
const previewFileError = ref('')

const openFilePreview = async (fileData) => {
  if (!fileData.fileId) return

  previewFileData.value = fileData
  showFilePreview.value = true
  previewFileLoading.value = true
  previewFileError.value = ''
  previewFileContent.value = ''

  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : ''
    const res = await fetch(`${API_BASE}/api/v1/script/files/${fileData.fileId}/content`, {
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    })

    if (!res.ok) {
      if (res.status === 401) {
        router.push('/login')
        return
      }
      previewFileError.value = '加载文件内容失败'
      previewFileLoading.value = false
      return
    }

    // API returns plain text content directly, not JSON
    const content = await res.text()
    previewFileContent.value = content
    previewFileLoading.value = false
  } catch (error) {
    console.error('Error loading file content:', error)
    previewFileError.value = '加载文件内容失败'
    previewFileLoading.value = false
  }
}

const closeFilePreview = () => {
  showFilePreview.value = false
  previewFileData.value = null
  previewFileContent.value = ''
  previewFileError.value = ''
}

const downloadFile = async (fileData) => {
  if (!fileData.fileUrl) {
    showToastMessage('文件下载链接不可用', 'error')
    return
  }

  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : ''
    const res = await fetch(fileData.fileUrl, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    })

    if (!res.ok) {
      showToastMessage('文件下载失败', 'error')
      return
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileData.fileName || 'download'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToastMessage('文件下载成功', 'success')
  } catch (error) {
    console.error('Error downloading file:', error)
    showToastMessage('文件下载失败', 'error')
  }
}

const copyFileContent = async () => {
  if (!previewFileContent.value) {
    showToastMessage('没有可复制的内容', 'error')
    return
  }

  try {
    await navigator.clipboard.writeText(previewFileContent.value)
    showToastMessage('内容已复制到剪贴板', 'success')
  } catch (error) {
    console.error('Error copying content:', error)
    showToastMessage('复制失败', 'error')
  }
}

// Character creation modal
const showCharacterModal = ref(false)
const newCharacter = ref({
  name: '',
  role: '',
  desc: '',
  avatar: ''
})
const characterError = ref('')
const characterImageInput = ref(null)
const characterImagePreview = ref('')

const openCharacterModal = () => {
  showCharacterModal.value = true
  newCharacter.value = { name: '', role: '', desc: '', avatar: '' }
  characterError.value = ''
  characterImagePreview.value = ''
}

const closeCharacterModal = () => {
  showCharacterModal.value = false
  newCharacter.value = { name: '', role: '', desc: '', avatar: '' }
  characterError.value = ''
  characterImagePreview.value = ''
}

const createCharacter = () => {
  if (!newCharacter.value.name.trim()) {
    characterError.value = '请输入角色名称'
    return
  }
  if (!newCharacter.value.role.trim()) {
    characterError.value = '请输入角色定位'
    return
  }
  
  // Use uploaded image, or generate random avatar if not provided
  const avatar = characterImagePreview.value || newCharacter.value.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${newCharacter.value.name}`
  
  const character = {
    id: Date.now(),
    name: newCharacter.value.name,
    role: newCharacter.value.role,
    desc: newCharacter.value.desc || '暂无描述',
    avatar: avatar
  }
  
  characters.value.push(character)
  closeCharacterModal()
}

const triggerCharacterImageUpload = () => {
  characterImageInput.value?.click()
}

const handleCharacterImageUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  
  // Check if file is an image
  if (!file.type.startsWith('image/')) {
    characterError.value = '请上传图片文件'
    return
  }
  
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    characterError.value = '图片大小不能超过 5MB'
    return
  }
  
  // Read and preview image
  const reader = new FileReader()
  reader.onload = (e) => {
    characterImagePreview.value = e.target?.result
    characterError.value = ''
  }
  reader.readAsDataURL(file)
}

const removeCharacterImage = () => {
  characterImagePreview.value = ''
  newCharacter.value.avatar = ''
  if (characterImageInput.value) {
    characterImageInput.value.value = ''
  }
}

// Extract characters from script
const showExtractWizard = ref(false)
const extractStep = ref(1)
const scriptInput = ref('')
const extractedRoles = ref([])
const extractError = ref('')
const scriptSegments = ref([]) // Parsed script segments with selection state
const selectAll = ref(true)
const visibleSegments = computed(() => scriptSegments.value.map((seg, idx) => ({ seg, idx })))
const visibleFiles = computed(() => existingFiles.value.map((file, idx) => ({ file, idx })))
const fileListSelectAll = ref(false)

const toggleFileSelectAll = () => {
  fileListSelectAll.value = !fileListSelectAll.value
  existingFiles.value.forEach(f => f.selected = fileListSelectAll.value)
}

const toggleFileSelection = (index) => {
  const file = existingFiles.value[index]
  if (file) {
    file.selected = !file.selected
    fileListSelectAll.value = existingFiles.value.every(f => f.selected)
  }
}

// Batch delete confirmation modal
const showBatchDeleteConfirm = ref(false)
const batchDeleteCount = ref(0)

const openBatchDeleteConfirm = () => {
  const selectedCount = existingFiles.value.filter(f => f.selected).length
  if (selectedCount === 0) return
  batchDeleteCount.value = selectedCount
  showBatchDeleteConfirm.value = true
}

const cancelBatchDelete = () => {
  showBatchDeleteConfirm.value = false
  batchDeleteCount.value = 0
}

const batchDeleteFiles = async () => {
  const selectedIndices = existingFiles.value
    .map((f, i) => f.selected ? i : -1)
    .filter(i => i !== -1)
    .sort((a, b) => b - a) // Sort descending to remove from end

  if (selectedIndices.length === 0) return

  for (const index of selectedIndices) {
    // reusing removeFile logic but bypassing confirmation for batch
    // Note: This is a simplified batch delete. Ideally, we should have a batch API.
    // For now, we'll just call the delete API sequentially or remove from list.
    // Since removeFile has UI interaction (modal), we should refactor or just call the API directly here.

    const fileData = existingFiles.value[index]
    if (fileData.isExisting && fileData.fileId) {
       try {
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : ''
        await fetch(`${API_BASE}/api/v1/script/files/${fileData.fileId}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        })
       } catch (e) {
         console.error('Failed to delete file', fileData.fileName)
       }
    }
    existingFiles.value.splice(index, 1)
  }
  fileListSelectAll.value = false
  showToastMessage('批量删除完成', 'success')
}
const roleAppearance = reactive({})
const roleEditing = reactive({})
const roleDetailsOpen = reactive({})
const roleDetails = reactive({})
const styleKind = ref('2d')
const selectedCharacterStyle = ref(null)
const characterStyleCards = ref([
  { id: '2d-cute', kind: '2d', title: '2D 可爱风', prompt: '可爱卡通、明亮配色、圆润线条、轻松氛围' },
  { id: '2d-anime', kind: '2d', title: '2D 动漫风', prompt: '二次元、细致描线、渐变阴影、动态夸张表情' },
  { id: 'live-real', kind: 'live', title: '写实风', prompt: '真实光影、精细皮肤、自然比例、生活化场景' },
  { id: 'live-cinematic', kind: 'live', title: '电影风', prompt: '电影级构图、对比光、胶片质感、高动态范围' }
])
const sceneStyleKind = ref('2d')
const selectedSceneStyle = ref(null)
const sceneStyleCards = ref([
  { id: '2d-city', kind: '2d', title: '2D 城市场景', prompt: '卡通都市、简化建筑、鲜明色块、活泼气氛' },
  { id: '2d-fantasy', kind: '2d', title: '2D 奇幻场景', prompt: '奇幻元素、夸张比例、梦幻配色、想象力强' },
  { id: 'live-office', kind: 'live', title: '写实办公室', prompt: '真实办公环境、自然材质、准确透视、现代风' },
  { id: 'live-street', kind: 'live', title: '写实街景', prompt: '真实街道、立体光影、细节丰富、生活气息' }
])
const sceneSegments = computed(() => scriptSegments.value.filter(s => /^\s*\[.+\]/.test(s.text)))
const dialogueSegments = computed(() => scriptSegments.value.filter(s => /[:：]/.test(s.text)))

const openExtractWizard = () => {
  extractStep.value = 1
  scriptInput.value = ''
  extractedRoles.value = []
  extractError.value = ''
  selectAll.value = true
  scriptSegments.value = []
  
  // Parse script content into segments
  const content = scriptContent.value.trim()
  if (content) {
    // Split by lines and create segments
    const lines = content.split('\n').filter(line => line.trim())
    scriptSegments.value = lines.map((line, index) => ({
      id: index,
      text: line.trim(),
      selected: true
    }))
  }
  
  // Always show the wizard, even if there's no content
  showExtractWizard.value = true
}

const closeExtractWizard = () => {
  showExtractWizard.value = false
  extractStep.value = 1
  scriptInput.value = ''
  extractedRoles.value = []
  extractError.value = ''
  scriptSegments.value = []
  selectAll.value = true
}

const extractCandidates = () => {
  extractError.value = ''
  
  // Get selected segments
  const selectedSegments = scriptSegments.value.filter(s => s.selected)
  if (selectedSegments.length === 0) {
    extractError.value = '请至少选择一条剧本内容'
    return
  }
  
  const txt = selectedSegments.map(s => s.text).join('\n')
  
  const set = new Set()
  // Match Chinese names: 张三：对话
  const reZh = /([\u4e00-\u9fa5]{2,8})：/g
  // Match English names: John: dialogue
  const reEn = /([A-Z][A-Za-z\s]{0,20}):/g
  
  let m
  while ((m = reZh.exec(txt))) {
    set.add(m[1])
  }
  while ((m = reEn.exec(txt))) {
    set.add(m[1].trim())
  }
  
  const list = Array.from(set)
  if (list.length === 0) {
    extractError.value = '未识别到角色名称，请检查格式'
    return
  }
  
  extractedRoles.value = list.slice(0, 20).map(n => ({ name: n, selected: true }))
  extractStep.value = 2
}

const toggleSegmentSelected = (idx) => {
  const seg = scriptSegments.value[idx]
  if (!seg) return
  seg.selected = !seg.selected
  // Update selectAll state
  selectAll.value = scriptSegments.value.every(s => s.selected)
}

const toggleSelectAll = () => {
  selectAll.value = !selectAll.value
  visibleSegments.value.forEach(item => {
    const i = item.idx
    const seg = scriptSegments.value[i]
    if (seg) seg.selected = selectAll.value
  })
}

const toggleRoleSelected = (idx) => {
  const it = extractedRoles.value[idx]
  if (!it) return
  it.selected = !it.selected
}

const prevExtract = () => {
  if (extractStep.value > 1) extractStep.value -= 1
}

const populateRoleAppearance = () => {
  const selected = scriptSegments.value.filter(s => s.selected)
  const lines = selected.map(s => s.text)
  extractedRoles.value.filter(x => x.selected).forEach(r => {
    const name = r.name
    let suggestion = ''
    for (const line of lines) {
      if (line.startsWith(name)) {
        const m = line.match(/（(.+?)）/)
        if (m && m[1]) { suggestion = m[1]; break }
      }
    }
    roleAppearance[name] = suggestion || '自动提炼：暂无'
    roleEditing[name] = false
    roleDetailsOpen[name] = false
    roleDetails[name] = roleDetails[name] || { age: '', address: '', identity: '', gender: '', relations: '', description: roleAppearance[name] }
  })
}

const toggleRoleEdit = (name) => {
  roleEditing[name] = !roleEditing[name]
}

const nextExtract = () => {
  if (extractStep.value < 7) {
    extractStep.value += 1
    if (extractStep.value === 3) {
      populateRoleAppearance()
    }
  }
}

const confirmExtractCreate = () => {
  const chosen = extractedRoles.value.filter(x => x.selected)
  if (chosen.length === 0) {
    extractError.value = '请至少选择一个角色'
    return
  }
  
  // Create characters from selected roles
  chosen.forEach(role => {
    const character = {
      id: Date.now() + Math.random(),
      name: role.name,
      role: '未设置',
      desc: '从剧本中提炼',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${role.name}`
    }
    characters.value.push(character)
  })
  
  closeExtractWizard()
}


// Global click handler to close AI config menu and all submenus
const handleGlobalClick = (event) => {
  // Check if click is outside the AI config menu
  const aiConfigMenu = event.target.closest('.ai-config-menu-container')
  if (!aiConfigMenu && showAIConfigMenu.value) {
    showAIConfigMenu.value = false
    showModelMenu.value = false
    showPresetMenu.value = false
  }
}

onMounted(() => {
  loadLibraryInfo()
  loadExistingFiles()
  loadMediaFiles()  // Load existing video files from backend

  // Add global click listener
  document.addEventListener('click', handleGlobalClick)
})

onBeforeUnmount(() => {
  // Remove global click listener
  document.removeEventListener('click', handleGlobalClick)
})

// Watch for tab changes to reload files when switching to files tab
watch(activeTab, (newTab) => {
  if (newTab === 'files') {
    loadExistingFiles()
  }
})
</script>

<template>
  <div class="flex flex-col h-screen bg-gray-50 dark:bg-[#1C1C1E] text-primary dark:text-white overflow-hidden">
    <!-- Header -->
    <header class="h-14 bg-white dark:bg-[#2C2C2E] border-b border-gray-200 dark:border-[#3A3A3C] flex items-center justify-between px-4 shrink-0">
      <div class="flex items-center gap-4">
        <router-link to="/workspace" class="text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white transition">
          <fa :icon="['fas', 'arrow-left']" />
        </router-link>
        <div class="flex flex-col">
          <h1 class="text-sm font-bold flex items-center gap-2">
            {{ libraryInfo.name }}
            <span class="px-1.5 py-0.5 rounded text-[10px] bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500">剧本创作中</span>
          </h1>
          <span class="text-xs text-secondary dark:text-gray-500">上次保存: {{ formatLastSaved }}</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <!-- AI Model Selector -->
        <div class="relative">
          <div 
            @click.stop="toggleAIConfigMenu"
            class="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#3A3A3C]/80 transition group"
            :class="showAIConfigMenu ? 'ring-2 ring-brand-green/20 border-brand-green' : ''"
          >
            <fa :icon="['fas', 'wand-magic-sparkles']" class="text-purple-500" />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-200">GPT-4</span>
            <span class="px-1.5 py-0.5 text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded ml-1">CHAT</span>
            <fa :icon="['fas', 'sliders']" class="text-gray-400 group-hover:text-purple-500 transition ml-1 text-xs" />
          </div>

          <!-- AI Config Menu Popover -->
          <div
            v-if="showAIConfigMenu"
            class="ai-config-menu-container absolute top-full right-0 mt-2 w-80 bg-white dark:bg-[#2C2C2E] rounded-xl shadow-xl border border-gray-200 dark:border-[#3A3A3C] z-50 overflow-hidden"
            @click.stop
          >
            <!-- Model Selection -->
            <div class="p-4 border-b border-gray-100 dark:border-[#3A3A3C] relative">
              <h4 class="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">模型</h4>
              <div
                @click.stop="toggleModelMenu"
                class="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#1C1C1E] rounded-lg border border-gray-200 dark:border-[#3A3A3C] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2C2C2E] transition-colors"
              >
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded flex items-center justify-center"
                    :class="currentModel.color === 'text-purple-500' ? 'bg-purple-100 dark:bg-purple-900/30' :
                            currentModel.color === 'text-blue-500' ? 'bg-blue-100 dark:bg-blue-900/30' :
                            'bg-green-100 dark:bg-green-900/30'"
                  >
                    <fa :icon="['fas', currentModel.icon]" :class="currentModel.color" class="text-xs" />
                  </div>
                  <span class="text-sm font-medium text-gray-900 dark:text-white">{{ currentModel.name }}</span>
                  <span class="text-[10px] px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-500 dark:text-gray-400">CHAT</span>
                </div>
                <fa :icon="['fas', 'chevron-down']" class="text-gray-400 text-xs transition-transform" :class="showModelMenu ? 'rotate-180' : ''" />
              </div>

              <!-- Model Selection Dropdown -->
              <div
                v-if="showModelMenu"
                class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#2C2C2E] rounded-lg shadow-xl border border-gray-200 dark:border-[#3A3A3C] z-50 max-h-96 overflow-hidden"
                @click.stop
              >
                <!-- Search Input -->
                <div class="p-3 border-b border-gray-100 dark:border-[#3A3A3C]">
                  <div class="relative">
                    <fa :icon="['fas', 'search']" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      v-model="modelSearchQuery"
                      type="text"
                      placeholder="搜索模型"
                      class="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#3A3A3C] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                    />
                  </div>
                </div>

                <!-- Model List -->
                <div class="max-h-64 overflow-y-auto">
                  <div class="p-2">
                    <div class="text-xs font-bold text-gray-500 dark:text-gray-400 px-2 py-1">OpenAI</div>
                    <button
                      v-for="model in filteredModels"
                      :key="model.id"
                      @click="selectModel(model.id)"
                      class="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors text-left"
                      :class="aiConfig.model === model.id ? 'bg-gray-50 dark:bg-[#3A3A3C]' : ''"
                    >
                      <div class="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                        :class="model.color === 'text-purple-500' ? 'bg-purple-100 dark:bg-purple-900/30' :
                                model.color === 'text-blue-500' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                'bg-green-100 dark:bg-green-900/30'"
                      >
                        <fa :icon="['fas', model.icon]" :class="model.color" class="text-xs" />
                      </div>
                      <span class="text-sm text-gray-700 dark:text-gray-200 flex-1">{{ model.name }}</span>
                      <fa v-if="aiConfig.model === model.id" :icon="['fas', 'check']" class="text-brand-green text-sm" />
                    </button>
                  </div>
                </div>

                <!-- Model Settings Link -->
                <div class="p-3 border-t border-gray-100 dark:border-[#3A3A3C]">
                  <button class="text-xs text-brand-green hover:text-brand-green/80 flex items-center gap-1 transition-colors">
                    模型设置
                    <fa :icon="['fas', 'arrow-right']" class="text-[10px]" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Parameters -->
            <div class="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div class="flex items-center justify-between mb-2 relative">
                <h4 class="text-sm font-bold text-gray-900 dark:text-white">参数</h4>
                <button
                  @click.stop="togglePresetMenu"
                  class="text-xs hover:text-brand-green flex items-center gap-1.5 border border-gray-200 dark:border-[#3A3A3C] px-2 py-1 rounded transition-colors"
                  :class="presets[currentPreset]?.color || 'text-gray-500'"
                >
                  <fa :icon="['fas', presets[currentPreset]?.icon || 'sliders']" class="text-xs" />
                  {{ presets[currentPreset]?.label || '自定义' }}
                  <fa :icon="['fas', 'chevron-down']" class="transition-transform duration-200 text-xs" :class="showPresetMenu ? 'rotate-180' : ''" />
                </button>

                <!-- Preset Menu -->
                <div 
                  v-if="showPresetMenu"
                  class="absolute top-full right-0 mt-1 w-32 bg-white dark:bg-[#2C2C2E] rounded-lg shadow-xl border border-gray-200 dark:border-[#3A3A3C] z-10 overflow-hidden py-1"
                >
                  <button
                    v-for="(preset, key) in presets"
                    :key="key"
                    @click="applyPreset(key)"
                    class="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors"
                  >
                    <fa :icon="['fas', preset.icon]" :class="preset.color" class="text-xs w-4" />
                    <span class="text-sm text-gray-700 dark:text-gray-200">{{ preset.label }}</span>
                  </button>
                </div>
              </div>

              <!-- Temperature -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div
                      @click="aiConfig.temperature.enabled = !aiConfig.temperature.enabled; onConfigChange()"
                      class="w-8 h-4 rounded-full relative cursor-pointer transition-colors"
                      :class="aiConfig.temperature.enabled ? 'bg-brand-green' : 'bg-gray-200 dark:bg-gray-700'"
                    >
                      <div
                        class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm"
                        :class="aiConfig.temperature.enabled ? 'translate-x-4' : ''"
                      ></div>
                    </div>
                    <span class="text-sm text-gray-700 dark:text-gray-300">温度</span>
                    <fa :icon="['fas', 'circle-info']" class="text-gray-300 text-xs cursor-help" title="控制随机性" />
                  </div>
                  <input
                    type="number"
                    v-model.number="aiConfig.temperature.value"
                    @input="onConfigChange"
                    class="w-16 px-2 py-1 text-xs border border-gray-200 dark:border-[#3A3A3C] rounded bg-gray-50 dark:bg-[#1C1C1E] text-right"
                    :disabled="!aiConfig.temperature.enabled"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  v-model.number="aiConfig.temperature.value"
                  @input="onConfigChange"
                  class="w-full h-1 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-colors"
                  :disabled="!aiConfig.temperature.enabled"
                  :class="aiConfig.temperature.enabled ? '[&::-webkit-slider-thumb]:bg-brand-green' : '[&::-webkit-slider-thumb]:bg-gray-300 opacity-50'"
                  :style="getSliderStyle(aiConfig.temperature.value, 0, 1, aiConfig.temperature.enabled)"
                />
              </div>

              <!-- Top P -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div
                      @click="aiConfig.topP.enabled = !aiConfig.topP.enabled; onConfigChange()"
                      class="w-8 h-4 rounded-full relative cursor-pointer transition-colors"
                      :class="aiConfig.topP.enabled ? 'bg-brand-green' : 'bg-gray-200 dark:bg-gray-700'"
                    >
                      <div
                        class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm"
                        :class="aiConfig.topP.enabled ? 'translate-x-4' : ''"
                      ></div>
                    </div>
                    <span class="text-sm text-gray-700 dark:text-gray-300">Top P</span>
                    <fa :icon="['fas', 'circle-info']" class="text-gray-300 text-xs cursor-help" title="核采样" />
                  </div>
                  <input
                    type="number"
                    v-model.number="aiConfig.topP.value"
                    @input="onConfigChange"
                    class="w-16 px-2 py-1 text-xs border border-gray-200 dark:border-[#3A3A3C] rounded bg-gray-50 dark:bg-[#1C1C1E] text-right"
                    :disabled="!aiConfig.topP.enabled"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  v-model.number="aiConfig.topP.value"
                  @input="onConfigChange"
                  class="w-full h-1 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-colors"
                  :disabled="!aiConfig.topP.enabled"
                  :class="aiConfig.topP.enabled ? '[&::-webkit-slider-thumb]:bg-brand-green' : '[&::-webkit-slider-thumb]:bg-gray-300 opacity-50'"
                  :style="getSliderStyle(aiConfig.topP.value, 0, 1, aiConfig.topP.enabled)"
                />
              </div>

              <!-- Presence Penalty -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div
                      @click="aiConfig.presencePenalty.enabled = !aiConfig.presencePenalty.enabled; onConfigChange()"
                      class="w-8 h-4 rounded-full relative cursor-pointer transition-colors"
                      :class="aiConfig.presencePenalty.enabled ? 'bg-brand-green' : 'bg-gray-200 dark:bg-gray-700'"
                    >
                      <div
                        class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm"
                        :class="aiConfig.presencePenalty.enabled ? 'translate-x-4' : ''"
                      ></div>
                    </div>
                    <span class="text-sm text-gray-700 dark:text-gray-300">存在惩罚</span>
                    <fa :icon="['fas', 'circle-info']" class="text-gray-300 text-xs cursor-help" />
                  </div>
                  <input
                    type="number"
                    v-model.number="aiConfig.presencePenalty.value"
                    @input="onConfigChange"
                    class="w-16 px-2 py-1 text-xs border border-gray-200 dark:border-[#3A3A3C] rounded bg-gray-50 dark:bg-[#1C1C1E] text-right"
                    :disabled="!aiConfig.presencePenalty.enabled"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  v-model.number="aiConfig.presencePenalty.value"
                  @input="onConfigChange"
                  class="w-full h-1 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-colors"
                  :disabled="!aiConfig.presencePenalty.enabled"
                  :class="aiConfig.presencePenalty.enabled ? '[&::-webkit-slider-thumb]:bg-brand-green' : '[&::-webkit-slider-thumb]:bg-gray-300 opacity-50'"
                  :style="getSliderStyle(aiConfig.presencePenalty.value, 0, 1, aiConfig.presencePenalty.enabled)"
                />
              </div>

              <!-- Frequency Penalty -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div
                      @click="aiConfig.frequencyPenalty.enabled = !aiConfig.frequencyPenalty.enabled; onConfigChange()"
                      class="w-8 h-4 rounded-full relative cursor-pointer transition-colors"
                      :class="aiConfig.frequencyPenalty.enabled ? 'bg-brand-green' : 'bg-gray-200 dark:bg-gray-700'"
                    >
                      <div
                        class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm"
                        :class="aiConfig.frequencyPenalty.enabled ? 'translate-x-4' : ''"
                      ></div>
                    </div>
                    <span class="text-sm text-gray-700 dark:text-gray-300">频率惩罚</span>
                    <fa :icon="['fas', 'circle-info']" class="text-gray-300 text-xs cursor-help" />
                  </div>
                  <input
                    type="number"
                    v-model.number="aiConfig.frequencyPenalty.value"
                    @input="onConfigChange"
                    class="w-16 px-2 py-1 text-xs border border-gray-200 dark:border-[#3A3A3C] rounded bg-gray-50 dark:bg-[#1C1C1E] text-right"
                    :disabled="!aiConfig.frequencyPenalty.enabled"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  v-model.number="aiConfig.frequencyPenalty.value"
                  @input="onConfigChange"
                  class="w-full h-1 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-colors"
                  :disabled="!aiConfig.frequencyPenalty.enabled"
                  :class="aiConfig.frequencyPenalty.enabled ? '[&::-webkit-slider-thumb]:bg-brand-green' : '[&::-webkit-slider-thumb]:bg-gray-300 opacity-50'"
                  :style="getSliderStyle(aiConfig.frequencyPenalty.value, 0, 1, aiConfig.frequencyPenalty.enabled)"
                />
              </div>

              <!-- Max Tokens -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div
                      @click="aiConfig.maxTokens.enabled = !aiConfig.maxTokens.enabled; onConfigChange()"
                      class="w-8 h-4 rounded-full relative cursor-pointer transition-colors"
                      :class="aiConfig.maxTokens.enabled ? 'bg-brand-green' : 'bg-gray-200 dark:bg-gray-700'"
                    >
                      <div
                        class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm"
                        :class="aiConfig.maxTokens.enabled ? 'translate-x-4' : ''"
                      ></div>
                    </div>
                    <span class="text-sm text-gray-700 dark:text-gray-300">最大标记</span>
                    <fa :icon="['fas', 'circle-info']" class="text-gray-300 text-xs cursor-help" />
                  </div>
                  <input
                    type="number"
                    v-model.number="aiConfig.maxTokens.value"
                    @input="onConfigChange"
                    class="w-16 px-2 py-1 text-xs border border-gray-200 dark:border-[#3A3A3C] rounded bg-gray-50 dark:bg-[#1C1C1E] text-right"
                    :disabled="!aiConfig.maxTokens.enabled"
                  />
                </div>
                <input
                  type="range"
                  min="1"
                  max="4096"
                  step="1"
                  v-model.number="aiConfig.maxTokens.value"
                  @input="onConfigChange"
                  class="w-full h-1 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-colors"
                  :disabled="!aiConfig.maxTokens.enabled"
                  :class="aiConfig.maxTokens.enabled ? '[&::-webkit-slider-thumb]:bg-brand-green' : '[&::-webkit-slider-thumb]:bg-gray-300 opacity-50'"
                  :style="getSliderStyle(aiConfig.maxTokens.value, 1, 4096, aiConfig.maxTokens.enabled)"
                />
              </div>

              <!-- Seed -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div
                    @click="aiConfig.seed.enabled = !aiConfig.seed.enabled; onConfigChange()"
                    class="w-8 h-4 rounded-full relative cursor-pointer transition-colors"
                    :class="aiConfig.seed.enabled ? 'bg-brand-green' : 'bg-gray-200 dark:bg-gray-700'"
                  >
                    <div
                      class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm"
                      :class="aiConfig.seed.enabled ? 'translate-x-4' : ''"
                    ></div>
                  </div>
                  <span class="text-sm text-gray-700 dark:text-gray-300">种子</span>
                  <fa :icon="['fas', 'circle-info']" class="text-gray-300 text-xs cursor-help" />
                </div>
                <input
                  type="number"
                  v-model.number="aiConfig.seed.value"
                  @input="onConfigChange"
                  class="w-24 px-2 py-1 text-xs border border-gray-200 dark:border-[#3A3A3C] rounded bg-gray-50 dark:bg-[#1C1C1E] text-right"
                  :disabled="!aiConfig.seed.enabled"
                />
              </div>

              <!-- Response Format -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div
                    @click="aiConfig.responseFormat.enabled = !aiConfig.responseFormat.enabled; onConfigChange()"
                    class="w-8 h-4 rounded-full relative cursor-pointer transition-colors"
                    :class="aiConfig.responseFormat.enabled ? 'bg-brand-green' : 'bg-gray-200 dark:bg-gray-700'"
                  >
                    <div
                      class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm"
                      :class="aiConfig.responseFormat.enabled ? 'translate-x-4' : ''"
                    ></div>
                  </div>
                  <span class="text-sm text-gray-700 dark:text-gray-300">回复格式</span>
                  <fa :icon="['fas', 'circle-info']" class="text-gray-300 text-xs cursor-help" />
                </div>
                <select
                  v-model="aiConfig.responseFormat.value"
                  @change="onConfigChange"
                  class="w-24 px-2 py-1 text-xs border border-gray-200 dark:border-[#3A3A3C] rounded bg-gray-50 dark:bg-[#1C1C1E]"
                  :disabled="!aiConfig.responseFormat.enabled"
                >
                  <option value="text">text</option>
                  <option value="json_object">json_object</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="h-6 w-px bg-gray-200 dark:bg-[#3A3A3C]"></div>
        <button class="p-2 text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white transition" @click="toggleTheme">
          <fa :icon="['fas', theme === 'dark' ? 'sun' : 'moon']" />
        </button>
        <button class="px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-md text-sm font-medium hover:opacity-80 transition">
          导出
        </button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-52 bg-white dark:bg-[#2C2C2E] border-r border-gray-200 dark:border-[#3A3A3C] flex flex-col shrink-0">
        <nav class="p-2 space-y-1">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            :class="activeTab === tab.id
              ? 'bg-brand-green/10 text-brand-green dark:bg-brand-green/20'
              : 'text-secondary hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#3A3A3C]'"
          >
            <fa :icon="['fas', tab.icon]" class="w-4" />
            {{ tab.label }}
            <span v-if="tab.badge" class="ml-auto px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{{ tab.badge }}</span>
          </button>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#1C1C1E] p-6">
        <!-- Script View -->
        <div v-if="activeTab === 'script'" class="h-full flex flex-col">
          <!-- Script Mode Selection -->
          <div v-if="scriptMode === 'selection'" class="flex-1 flex items-center justify-center p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
              <!-- Upload Option -->
              <button 
                @click="scriptMode = 'upload'"
                class="group relative flex flex-col items-center justify-center p-12 bg-white dark:bg-[#2C2C2E] rounded-2xl border-2 border-dashed border-gray-300 dark:border-[#3A3A3C] hover:border-brand-green dark:hover:border-brand-green transition-all duration-300 hover:shadow-xl"
              >
                <div class="w-20 h-20 rounded-full bg-brand-green/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <fa :icon="['fas', 'cloud-arrow-up']" class="text-3xl text-brand-green" />
                </div>
                <h3 class="text-2xl font-bold text-primary dark:text-white mb-3">上传小说/故事</h3>
                <p class="text-secondary dark:text-gray-400 text-center leading-relaxed">
                  支持 PDF, Word, TXT 格式<br>
                  AI 自动提取角色与场景
                </p>
              </button>

              <!-- Write Option -->
              <button 
                @click="scriptMode = 'write'"
                class="group relative flex flex-col items-center justify-center p-12 bg-white dark:bg-[#2C2C2E] rounded-2xl border-2 border-gray-200 dark:border-[#3A3A3C] hover:border-brand-green dark:hover:border-brand-green transition-all duration-300 hover:shadow-xl"
              >
                <div class="w-20 h-20 rounded-full bg-brand-green/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <fa :icon="['fas', 'pen-nib']" class="text-3xl text-brand-green" />
                </div>
                <h3 class="text-2xl font-bold text-primary dark:text-white mb-3">编写故事剧本</h3>
                <p class="text-secondary dark:text-gray-400 text-center leading-relaxed">
                  使用专业剧本编辑器<br>
                  AI 辅助续写与润色
                </p>
              </button>
            </div>
          </div>

          <!-- Upload View -->
          <div v-else-if="scriptMode === 'upload'" class="max-w-5xl mx-auto w-full">
            <!-- Tab Buttons -->
            <div class="flex items-center justify-center gap-4 mb-8">
              <button 
                class="px-8 py-3 rounded-full border-2 font-medium transition-all"
                :class="scriptMode === 'upload' ? 'border-red-500 text-red-500 bg-white dark:bg-[#2C2C2E]' : 'border-gray-300 dark:border-[#3A3A3C] text-gray-500 dark:text-gray-400'"
              >
                上传文件
              </button>
              <button 
                @click="scriptMode = 'write'"
                class="px-8 py-3 rounded-full border-2 font-medium transition-all"
                :class="scriptMode === 'write' ? 'border-red-500 text-red-500 bg-white dark:bg-[#2C2C2E]' : 'border-gray-300 dark:border-[#3A3A3C] text-gray-500 dark:text-gray-400 hover:border-gray-400'"
              >
                剧本创造
              </button>
            </div>

            <!-- Hidden file input -->
            <input 
              ref="fileInput"
              type="file" 
              multiple
              class="hidden" 
              accept=".txt,.md,.doc,.docx,.csv,.xlsx,.pdf"
              @change="handleFileSelect"
            >
            
            <!-- Upload area -->
            <div 
              class="border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer mb-6"
              :class="isDragging 
                ? 'border-brand-green bg-brand-green/5 dark:bg-brand-green/10' 
                : 'border-gray-300 dark:border-[#3A3A3C] hover:bg-gray-50 dark:hover:bg-[#3A3A3C]/30'"
              @click="triggerFileInput"
              @dragover="handleDragOver"
              @dragleave="handleDragLeave"
              @drop="handleUploadDrop"
            >
              <fa :icon="['fas', 'file-import']" class="text-4xl mb-4" :class="isDragging ? 'text-brand-green' : 'text-gray-300 dark:text-gray-600'" />
              <p class="text-lg font-medium text-primary dark:text-white mb-2">
                {{ isDragging ? '释放以上传文件' : '点击或拖拽文件到此处' }}
              </p>
              <p class="text-sm text-secondary dark:text-gray-400">支持 .txt, .md, .doc, .docx, .csv, .xlsx, .pdf (最大 10MB)</p>
            </div>
            
            <!-- Uploaded Files List -->
            <div v-if="uploadedFiles.length > 0" class="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] overflow-hidden">
              <!-- Header Row -->
              <div class="flex items-center gap-4 px-6 py-3 bg-gray-50 dark:bg-[#3A3A3C]/50 border-b border-gray-200 dark:border-[#3A3A3C]">
                <div class="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    :checked="fileListSelectAll"
                    @change="toggleFileSelectAll"
                    class="w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                  >
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">文件列表</span>
                </div>
                <div class="ml-auto flex items-center gap-2" v-if="uploadedFiles.some(f => f.selected)">
                  <button 
                    @click="openBatchDeleteConfirm"
                    class="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    批量删除
                  </button>
                </div>
              </div>

              <!-- File List -->
              <div class="p-4 space-y-3">
                <div
                  v-for="(fileData, index) in uploadedFiles"
                  :key="index"
                  class="flex items-center gap-4 px-6 py-4 bg-white dark:bg-[#2C2C2E] rounded-xl border-2 shadow-sm transition-all"
                  :class="[
                    fileData.selected ? 'border-brand-green bg-brand-green/5' : 'border-gray-100 dark:border-[#3A3A3C]',
                    fileData.progress === 'completed' ? '' : fileData.progress === 'error' ? 'border-red-500' : 'border-blue-500'
                  ]"
                  @click="toggleFileSelection(index)"
                >
                  <!-- Checkbox -->
                  <div class="flex-shrink-0" @click.stop>
                    <input 
                      type="checkbox" 
                      v-model="fileData.selected"
                      @change="fileListSelectAll = uploadedFiles.every(f => f.selected)"
                      class="w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                    >
                  </div>

                  <!-- File Icon -->
                  <div class="flex-shrink-0">
                    <fa :icon="['fas', 'file']" class="text-2xl"
                      :class="fileData.progress === 'completed' ? 'text-brand-green' : fileData.progress === 'error' ? 'text-red-500' : 'text-blue-500'" />
                  </div>

                  <!-- File Info -->
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">{{ fileData.file.name }}</p>
                    <div class="flex items-center gap-2">
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ (fileData.file.size / 1024).toFixed(2) }} KB</p>
                      <span class="text-gray-300 dark:text-gray-600">•</span>
                      <p class="text-xs"
                        :class="fileData.progress === 'completed' ? 'text-brand-green' : fileData.progress === 'error' ? 'text-red-500' : 'text-blue-500'">
                        {{ fileData.progress === 'completed' ? '上传完成' : fileData.progress === 'error' ? '上传失败' : `上传中 ${fileData.uploadProgress}%` }}
                      </p>
                    </div>
                    <!-- Progress Bar -->
                    <div v-if="fileData.progress === 'uploading'" class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div class="bg-blue-500 h-1.5 rounded-full transition-all duration-300" :style="{ width: fileData.uploadProgress + '%' }"></div>
                    </div>
                  </div>

                  <!-- Delete Button -->
                  <button
                    @click.stop="removeFile(index)"
                    class="flex-shrink-0 px-4 py-2 rounded-lg border border-gray-300 dark:border-[#3A3A3C] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors"
                  >
                    <fa :icon="['fas', 'trash']" class="text-sm" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Write View (Existing) -->
          <div v-else-if="scriptMode === 'write'" class="max-w-4xl mx-auto w-full bg-white dark:bg-[#2C2C2E] rounded-xl shadow-sm border border-gray-200 dark:border-[#3A3A3C] min-h-[800px] p-8 relative">
            <div class="mb-6 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <button @click="scriptMode = 'selection'" class="text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white transition">
                  <fa :icon="['fas', 'arrow-left']" />
                </button>
                <h2 class="text-lg font-bold">第一集：初遇</h2>
              </div>
              <button class="text-sm text-brand-green hover:underline" @click="openAiDialog">
                <fa :icon="['fas', 'magic']" class="mr-1" /> AI 续写
              </button>
            </div>
            <textarea 
              ref="scriptTextarea"
              v-model="scriptContent"
              class="w-full h-full min-h-[600px] resize-none outline-none bg-transparent text-lg leading-relaxed text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600"
              placeholder="在此处开始创作剧本...&#10;例如：&#10;[场景] 豪华办公室，白天&#10;[人物] 顾北辰，苏晚晚&#10;顾北辰：（冷冷地）这份设计稿重做。"
            ></textarea>

            <!-- AI Continuation Dialog -->
            <div 
              v-if="showAiDialog"
              :style="aiDialogStyle"
              class="absolute z-50 w-[500px] bg-white dark:bg-[#1E1E1E] rounded-xl shadow-2xl border border-gray-200 dark:border-[#3A3A3C] overflow-hidden animate-in fade-in zoom-in duration-200"
            >
              <div class="p-3">
                <!-- Input Area -->
                <div class="relative">
                  <input 
                    v-if="aiState !== 'review'"
                    id="ai-input"
                    v-model="aiInput"
                    type="text" 
                    class="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-lg py-2.5 pl-4 pr-12 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-green placeholder-gray-400 dark:placeholder-gray-500"
                    :placeholder="aiState === 'generating' ? '思考中...' : '输入提示词，例如：顾北辰生气了...'"
                    :readonly="aiState === 'generating'"
                    @keydown.esc="closeAiDialog"
                    @keydown.enter="startGeneration"
                  >
                  <div v-else class="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-lg p-4 text-sm text-gray-800 dark:text-white leading-relaxed">
                    {{ generatedContent }}
                  </div>

                  <!-- Action Button (Idle/Generating) -->
                  <button 
                    v-if="aiState !== 'review'"
                    class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    :class="aiState === 'generating' ? 'bg-[#3B82F6] hover:bg-[#2563EB]' : 'bg-[#3B82F6] hover:bg-[#2563EB]'"
                    @click="aiState === 'generating' ? stopGeneration() : startGeneration()"
                  >
                    <!-- Stop Icon (Square) -->
                    <svg v-if="aiState === 'generating'" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="text-white">
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                    </svg>
                    <!-- Send Icon (Arrow Up) -->
                    <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-white">
                      <line x1="12" y1="19" x2="12" y2="5"></line>
                      <polyline points="5 12 12 5 19 12"></polyline>
                    </svg>
                  </button>
                </div>

                <!-- Review Toolbar -->
                <div v-if="aiState === 'review'" class="mt-3 flex items-center justify-between px-1">
                  <div class="flex items-center gap-2">
                    <button class="px-3 py-1.5 bg-brand-green text-white text-xs font-medium rounded-md hover:bg-brand-green/90 transition-colors" @click="acceptGeneration">
                      接受 <span class="ml-1 opacity-60">⌘⏎</span>
                    </button>
                    <button class="px-3 py-1.5 bg-gray-100 text-gray-600 dark:bg-[#3A3A3C] dark:text-gray-300 text-xs font-medium rounded-md hover:bg-gray-200 dark:hover:bg-[#48484A] transition-colors" @click="rejectGeneration">
                      拒绝 <span class="ml-1 opacity-60">Esc</span>
                    </button>
                  </div>
                  
                  <div class="flex items-center gap-2">
                    <button class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors" @click="startGeneration">
                      <fa :icon="['fas', 'rotate']" />
                    </button>
                    <div class="w-px h-4 bg-gray-200 dark:bg-[#3A3A3C]"></div>
                    <button class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                      <fa :icon="['fas', 'thumbs-up']" />
                    </button>
                    <button class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                      <fa :icon="['fas', 'thumbs-down']" />
                    </button>
                  </div>
                </div>

                <!-- Helper Text (Idle only) -->
                <div v-if="aiState === 'idle'" class="mt-2 flex items-center justify-between text-xs text-gray-500 px-1">
                  <span>按 "↑↓" 查看历史输入，按 "ESC" 关闭</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Files View (Script File Management) -->
        <div v-else-if="activeTab === 'files'" class="max-w-6xl mx-auto">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold">剧本文件管理</h2>
            <button 
              @click="openUploadModal"
              class="px-4 py-2 bg-brand-green text-white rounded-lg text-sm hover:bg-brand-green-dark transition flex items-center gap-2"
            >
              <fa :icon="['fas', 'plus']" />
              上传文件
            </button>
          </div>

          <!-- Hidden file input -->
          <input 
            ref="fileInput"
            type="file" 
            multiple
            class="hidden" 
            accept=".txt,.md,.doc,.docx,.csv,.xlsx,.pdf"
            @change="handleFileSelect"
          >

          <!-- Files List -->
          <div v-if="existingFiles.length > 0" class="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] overflow-hidden">
            <!-- Header Row -->
            <div class="flex items-center gap-4 px-6 py-3 bg-gray-50 dark:bg-[#3A3A3C]/50 border-b border-gray-200 dark:border-[#3A3A3C]">
              <div class="flex items-center gap-3">
                <input
                  type="checkbox"
                  :checked="fileListSelectAll"
                  @change="toggleFileSelectAll"
                  class="w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                >
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">全部文件</span>
              </div>
              <div class="ml-auto flex items-center gap-2">
                <span class="text-xs text-gray-500 dark:text-gray-400">共 {{ existingFiles.length }} 个文件</span>
                <button
                  v-if="existingFiles.some(f => f.selected)"
                  @click="openBatchDeleteConfirm"
                  class="text-xs text-red-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  <fa :icon="['fas', 'trash']" class="mr-1" />
                  批量删除
                </button>
              </div>
            </div>

            <!-- File List -->
            <div class="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
              <div
                v-for="(fileData, index) in existingFiles"
                :key="index"
                class="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-[#3A3A3C]/30 transition-colors cursor-pointer"
                :class="fileData.selected ? 'bg-brand-green/5' : ''"
                @click="openFilePreview(fileData)"
              >
                <!-- Checkbox -->
                <div class="flex-shrink-0" @click.stop>
                  <input
                    type="checkbox"
                    v-model="fileData.selected"
                    @change="fileListSelectAll = existingFiles.every(f => f.selected)"
                    class="w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                  >
                </div>

                <!-- File Icon -->
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 rounded-lg bg-brand-green/10 flex items-center justify-center">
                    <fa :icon="['fas', 'file']" class="text-lg text-brand-green" />
                  </div>
                </div>

                <!-- File Info -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ fileData.file.name }}
                  </p>
                  <div class="flex items-center gap-3 mt-1">
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {{ (fileData.file.size / 1024).toFixed(2) }} KB
                    </span>
                    <span class="text-xs px-2 py-0.5 rounded-full"
                      :class="fileData.progress === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : fileData.progress === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'">
                      {{ fileData.progress === 'completed' ? '已上传' : fileData.progress === 'error' ? '上传失败' : '上传中' }}
                    </span>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2">
                  <button
                    v-if="fileData.progress === 'completed'"
                    @click.stop="openFilePreview(fileData)"
                    class="p-2 text-gray-400 hover:text-brand-green hover:bg-brand-green/10 rounded-lg transition"
                    title="预览"
                  >
                    <fa :icon="['fas', 'eye']" />
                  </button>
                  <button
                    v-if="fileData.progress === 'completed'"
                    @click.stop="downloadFile(fileData)"
                    class="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                    title="下载"
                  >
                    <fa :icon="['fas', 'download']" />
                  </button>
                  <button
                    v-if="fileData.progress === 'completed'"
                    @click.stop="openFileSettings(fileData)"
                    class="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition"
                    title="设置"
                  >
                    <fa :icon="['fas', 'gear']" />
                  </button>
                  <button
                    @click.stop="removeFile(index)"
                    class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    title="删除"
                  >
                    <fa :icon="['fas', 'trash']" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="flex flex-col items-center justify-center py-16 px-4">
            <div class="w-24 h-24 rounded-full bg-gray-100 dark:bg-[#3A3A3C] flex items-center justify-center mb-6">
              <fa :icon="['fas', 'folder-open']" class="text-4xl text-gray-400 dark:text-gray-500" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">暂无文件</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
              上传剧本文件以便管理和使用。支持 TXT、MD、Word、PDF 等格式。
            </p>
            <button 
              @click="openUploadModal"
              class="px-6 py-3 bg-brand-green text-white rounded-lg font-medium hover:bg-brand-green-dark transition flex items-center gap-2"
            >
              <fa :icon="['fas', 'upload']" />
              上传第一个文件
            </button>
          </div>
        </div>

        <!-- Video Assets View -->
        <div v-else-if="activeTab === 'videoAssets'" class="max-w-6xl mx-auto">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold">视频素材管理</h2>
            <div class="flex items-center gap-3">
              <!-- View Mode Switcher -->
              <div class="flex items-center bg-white p-1 rounded-lg border border-gray-200 dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
                <button 
                  @click="videoViewMode = 'grid'"
                  class="px-3 py-1 text-sm rounded-md transition"
                  :class="videoViewMode === 'grid' ? 'font-semibold text-white bg-brand-green' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'"
                >
                  <fa :icon="['fas', 'table-cells-large']" />
                </button>
                <button 
                  @click="videoViewMode = 'list'"
                  class="px-3 py-1 text-sm rounded-md transition"
                  :class="videoViewMode === 'list' ? 'font-semibold text-white bg-brand-green' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'"
                >
                  <fa :icon="['fas', 'list']" />
                </button>
              </div>
              
              <!-- Upload Button -->
              <button
                @click="triggerMediaFileInput"
                class="px-4 py-2 bg-brand-green text-white rounded-lg text-sm hover:bg-brand-green-dark transition flex items-center gap-2"
              >
                <fa :icon="['fas', 'plus']" />
                上传视频
              </button>
            </div>
          </div>

          <!-- Hidden file input for video uploads -->
          <input 
            ref="mediaFileInput" 
            type="file" 
            multiple 
            class="hidden" 
            accept="video/*" 
            @change="handleMediaFileSelect" 
          />

          <!-- Video Assets Grid View -->
          <div v-if="externalMedia.filter(m => m.type === 'video').length > 0">
            <!-- Grid View -->
            <div v-if="videoViewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div
                v-for="media in externalMedia.filter(m => m.type === 'video')"
                :key="media.key"
                class="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] overflow-hidden hover:shadow-md transition"
              >
                <div class="aspect-video bg-gray-100 dark:bg-[#3A3A3C] relative group">
                  <video :src="media.src" class="w-full h-full object-cover"></video>
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button @click="openVideoPreview(media)" class="p-3 bg-white rounded-full text-gray-800 hover:scale-110 transition">
                      <fa :icon="['fas', 'play']" />
                    </button>
                  </div>
                </div>
                <div class="p-4">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate mb-2">{{ media.label }}</p>
                  <div class="flex items-center gap-2">
                    <button class="flex-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-[#3A3A3C] rounded-lg hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition">
                      <fa :icon="['fas', 'download']" class="mr-1" /> 下载
                    </button>
                    <button @click="openDeleteConfirm(media)" class="flex-1 px-3 py-1.5 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                      <fa :icon="['fas', 'trash']" class="mr-1" /> 删除
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- List View -->
            <div v-else class="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] overflow-hidden">
              <table class="w-full">
                <thead class="bg-gray-50 dark:bg-[#1C1C1E] border-b border-gray-200 dark:border-[#3A3A3C]">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">预览</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">文件名</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">时长</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">大小</th>
                    <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">操作</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-[#3A3A3C]">
                  <tr 
                    v-for="media in externalMedia.filter(m => m.type === 'video')"
                    :key="media.key"
                    class="hover:bg-gray-50 dark:hover:bg-[#3A3A3C]/50 transition"
                  >
                    <td class="px-4 py-3">
                      <div class="w-24 h-14 bg-gray-100 dark:bg-[#3A3A3C] rounded overflow-hidden relative group cursor-pointer" @click="openVideoPreview(media)">
                        <video :src="media.src" class="w-full h-full object-cover"></video>
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <fa :icon="['fas', 'play']" class="text-white text-sm" />
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <p class="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">{{ media.label }}</p>
                    </td>
                    <td class="px-4 py-3">
                      <p class="text-sm text-gray-600 dark:text-gray-400">{{ media.duration || '-' }}</p>
                    </td>
                    <td class="px-4 py-3">
                      <p class="text-sm text-gray-600 dark:text-gray-400">{{ media.size || '-' }}</p>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center justify-end gap-2">
                        <button class="p-2 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded transition" title="下载">
                          <fa :icon="['fas', 'download']" class="text-gray-600 dark:text-gray-400 text-sm" />
                        </button>
                        <button @click="openDeleteConfirm(media)" class="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition" title="删除">
                          <fa :icon="['fas', 'trash']" class="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="flex flex-col items-center justify-center py-16 px-4">
            <div class="w-24 h-24 rounded-full bg-gray-100 dark:bg-[#3A3A3C] flex items-center justify-center mb-6">
              <fa :icon="['fas', 'file-video']" class="text-4xl text-gray-400 dark:text-gray-500" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">暂无视频素材</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
              上传视频素材以便在剪辑中使用。支持 MP4、MOV、AVI 等格式。
            </p>
            <button
              @click="triggerMediaFileInput"
              class="px-6 py-3 bg-brand-green text-white rounded-lg font-medium hover:bg-brand-green-dark transition flex items-center gap-2"
            >
              <fa :icon="['fas', 'upload']" />
              上传第一个视频
            </button>
          </div>
        </div>

        <!-- Audio Assets View -->
        <div v-else-if="activeTab === 'audioAssets'" class="max-w-6xl mx-auto">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold">音频素材管理</h2>
            <button
              class="px-4 py-2 bg-brand-green text-white rounded-lg text-sm hover:bg-brand-green-dark transition flex items-center gap-2"
            >
              <fa :icon="['fas', 'plus']" />
              上传音频
            </button>
          </div>

          <!-- Audio Assets List -->
          <div class="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] overflow-hidden">
            <div class="divide-y divide-gray-100 dark:divide-[#3A3A3C]">
              <!-- Sample Audio Items -->
              <div class="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-[#3A3A3C]/30 transition-colors">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <fa :icon="['fas', 'music']" class="text-xl text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">背景音乐.mp3</p>
                  <div class="flex items-center gap-3 mt-1">
                    <span class="text-xs text-gray-500 dark:text-gray-400">2.5 MB</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">• 3:24</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button class="p-2 text-gray-400 hover:text-brand-green hover:bg-brand-green/10 rounded-lg transition" title="播放">
                    <fa :icon="['fas', 'play']" />
                  </button>
                  <button class="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" title="下载">
                    <fa :icon="['fas', 'download']" />
                  </button>
                  <button class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="删除">
                    <fa :icon="['fas', 'trash']" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State (hidden when there are items) -->
          <div v-if="false" class="flex flex-col items-center justify-center py-16 px-4">
            <div class="w-24 h-24 rounded-full bg-gray-100 dark:bg-[#3A3A3C] flex items-center justify-center mb-6">
              <fa :icon="['fas', 'music']" class="text-4xl text-gray-400 dark:text-gray-500" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">暂无音频素材</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
              上传音频素材以便在剪辑中使用。支持 MP3、WAV、AAC 等格式。
            </p>
            <button
              class="px-6 py-3 bg-brand-green text-white rounded-lg font-medium hover:bg-brand-green-dark transition flex items-center gap-2"
            >
              <fa :icon="['fas', 'upload']" />
              上传第一个音频
            </button>
          </div>
        </div>

        <!-- Characters View -->
        <div v-else-if="activeTab === 'characters'" class="max-w-6xl mx-auto">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-xl font-bold">角色管理</h2>
            <div class="flex items-center gap-3">
              <button @click="openExtractWizard" class="px-4 py-2 bg-white dark:bg-[#2C2C2E] text-brand-green border border-brand-green rounded-lg text-sm hover:bg-brand-green/10 transition">
                <fa :icon="['fas', 'wand-magic-sparkles']" class="mr-2" /> 角色提炼
              </button>
              <button @click="openCharacterModal" class="px-4 py-2 bg-brand-green text-white rounded-lg text-sm hover:bg-brand-green-dark transition">
                <fa :icon="['fas', 'plus']" class="mr-2" /> 新建角色
              </button>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="char in characters" :key="char.id" class="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] overflow-hidden hover:shadow-md transition">
              <div class="aspect-square bg-gray-100 dark:bg-[#3A3A3C] relative group">
                <img :src="char.avatar" class="w-full h-full object-cover" :alt="char.name">
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button class="p-2 bg-white rounded-full text-gray-800 hover:scale-110 transition"><fa :icon="['fas', 'pen']" /></button>
                  <button class="p-2 bg-white rounded-full text-red-500 hover:scale-110 transition"><fa :icon="['fas', 'trash']" /></button>
                </div>
              </div>
              <div class="p-4">
                <h3 class="font-bold text-lg">{{ char.name }}</h3>
                <p class="text-sm text-brand-green font-medium mb-2">{{ char.role }}</p>
                <p class="text-sm text-secondary dark:text-gray-400 line-clamp-2">{{ char.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Storyboard View -->
        <div v-else-if="activeTab === 'storyboard'" class="mx-auto w-full px-2 lg:px-4">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-4">
              <h2 class="text-xl font-bold">分镜预览</h2>
              <div class="flex items-center gap-1">
                <button @click="storyboardView='compact'" class="px-3 py-1.5 text-sm rounded border bg-white dark:bg-[#2C2C2E] dark:border-[#3A3A3C] text-secondary hover:border-gray-300" :class="storyboardView==='compact' ? 'border-gray-500' : ''">缩写</button>
                <button @click="storyboardView='detail'" class="px-3 py-1.5 text-sm rounded border bg-white dark:bg-[#2C2C2E] dark:border-[#3A3A3C] text-secondary hover:border-gray-300" :class="storyboardView==='detail' ? 'border-gray-500' : ''">详情</button>
              </div>
            </div>
            <div class="flex gap-1">
              <button @click="openSizeModalBatch('image')" class="px-3 py-1.5 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition">
                一键生成图片
              </button>
              <button @click="openSizeModalBatch('video')" class="px-3 py-1.5 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition">
                一键生成视频
              </button>
              <button class="px-3 py-1.5 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition">
                重新生成
              </button>
              <div class="relative inline-block">
                <button @click="toggleExportMenu" class="px-3 py-1.5 bg-brand-green text-white rounded-lg text-sm hover:bg-brand-green-dark transition">
                  导出
                </button>
                <div v-if="openExportMenu" class="absolute right-0 mt-1 w-44 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded shadow z-50">
                  <button @click="exportStoryboardScript" class="block w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-[#3A3A3C]">分镜头脚本导出</button>
                  <button @click="exportStoryboardImages" class="block w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-[#3A3A3C]">分镜头图片导出</button>
                  <button @click="exportStoryboardVideos" class="block w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-[#3A3A3C]">分镜头视频导出</button>
                </div>
              </div>
            </div>
          </div>
          <div v-if="storyboardView==='compact'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="shot in storyboards" :key="shot.id" class="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] p-4">
              <div class="aspect-video bg-gray-100 dark:bg-[#3A3A3C] rounded-lg mb-4 overflow-hidden">
                <img :src="shot.img" class="w-full h-full object-cover" alt="Storyboard">
              </div>
              <div class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 bg-gray-100 dark:bg-[#3A3A3C] rounded text-xs font-bold flex items-center justify-center text-secondary">
                  {{ shot.id }}
                </span>
                <p class="text-sm text-primary dark:text-gray-200">{{ shot.desc }}</p>
              </div>
            </div>
          </div>
          <div v-else class="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] overflow-x-auto overflow-y-visible">
            <table class="min-w-[1600px] text-sm">
              <thead>
                <tr class="text-left bg-gray-50 dark:bg-[#1C1C1E]">
                  <th class="px-3 py-1.5 border-b dark:border-[#3A3A3C]">镜号</th>
                  <th class="px-3 py-1.5 border-b dark:border-[#3A3A3C]">场景</th>
                  <th class="px-3 py-1.5 border-b dark:border-[#3A3A3C]">景别</th>
                  <th class="px-3 py-1.5 border-b dark:border-[#3A3A3C]">镜头</th>
                  <th class="px-3 py-1.5 border-b dark:border-[#3A3A3C]">时长</th>
                  <th class="px-3 py-1.5 border-b dark:border-[#3A3A3C]">画面描述</th>
                  <th class="px-3 py-1.5 border-b dark:border-[#3A3A3C]">对白/旁白</th>
                  <th class="px-3 py-1.5 border-b dark:border-[#3A3A3C]">音效/音乐</th>
                  <th class="px-3 py-1.5 border-b dark:border-[#3A3A3C]">图片提示词</th>
                  <th class="px-3 py-1.5 border-b dark:border-[#3A3A3C]">视频提示词</th>
                  <th class="px-3 py-1.5 border-b dark:border-[#3A3A3C]">生成图片</th>
                  <th class="px-3 py-1.5 border-b dark:border-[#3A3A3C]">生成视频</th>
                  <th class="px-3 py-1.5 border-b dark:border-[#3A3A3C] w-44">操作</th>
                  <th class="px-3 py-1.5 border-b dark:border-[#3A3A3C]">备注</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="shot in storyboards" :key="shot.id" class="border-t dark:border-[#3A3A3C]">
                  <td class="px-3 py-1.5">{{ shot.id }}</td>
                  <td class="px-3 py-1.5">{{ shot.scene }}</td>
                  <td class="px-3 py-1.5">{{ shot.size }}</td>
                  <td class="px-3 py-1.5">{{ shot.shot }}</td>
                  <td class="px-3 py-1.5">{{ shot.duration }}</td>
                  <td class="px-3 py-1.5">{{ shot.desc }}</td>
                  <td class="px-3 py-1.5">{{ shot.dialogue }}</td>
                  <td class="px-3 py-1.5">{{ shot.sound }}</td>
                  <td class="px-3 py-1.5">
                    <div class="text-sm text-primary dark:text-gray-200 whitespace-pre-wrap">{{ shot.imagePrompt }}</div>
                  </td>
                  <td class="px-3 py-1.5">
                    <div class="text-sm text-primary dark:text-gray-200 whitespace-pre-wrap">{{ shot.videoPrompt }}</div>
                  </td>
                  <td class="px-3 py-1.5">
                    <div class="w-32 h-20 bg-gray-100 dark:bg-[#3A3A3C] rounded flex items-center justify-center overflow-hidden">
                      <img v-if="shot.generatedImage && shot.img" :src="shot.img" class="w-full h-full object-cover" alt="图片预览">
                      <button v-else @click="openSizeModalForShot(shot, 'image')" class="px-3 py-1 text-xs rounded bg-brand-green text-white hover:bg-brand-green-dark">生成图片</button>
                    </div>
                  </td>
                  <td class="px-3 py-1.5">
                    <div class="w-32 h-20 bg-gray-100 dark:bg-[#3A3A3C] rounded flex items-center justify-center overflow-hidden">
                      <div v-if="shot.generatedVideo" class="text-xs text-secondary dark:text-gray-300">已生成</div>
                      <button v-else @click="openSizeModalForShot(shot, 'video')" class="px-3 py-1 text-xs rounded bg-brand-green text-white hover:bg-brand-green-dark">生成视频</button>
                    </div>
                  </td>
                  <td class="px-3 py-1.5 w-44">
                    <div class="relative inline-block">
                      <button @click="toggleActionMenu(shot.id, $event)" class="px-2 py-1 text-xs rounded border bg-white dark:bg-[#2C2C2E] dark:border-[#3A3A3C] hover:bg-gray-50 dark:hover:bg-[#3A3A3C]">
                        重新生成
                        <fa :icon="['fas','chevron-down']" class="ml-1" />
                      </button>
                    </div>
                  </td>
                  <td class="px-3 py-1.5">{{ shot.notes }}</td>
                </tr>
              </tbody>
            </table>
            <teleport to="body">
              <div v-if="openActionMenuId!==null" class="fixed z-50" :style="{ left: actionMenuPos.left+'px', top: actionMenuPos.top+'px', width: actionMenuPos.width+'px' }">
                <div class="bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded shadow">
                  <button @click="regenerateImage(getShotById(openActionMenuId))" class="block w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-[#3A3A3C]">重新生成图片</button>
                  <button @click="regenerateVideo(getShotById(openActionMenuId))" class="block w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-[#3A3A3C]">重新生成视频</button>
                  <button @click="removeShot(openActionMenuId)" class="block w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-gray-50 dark:hover:bg-[#3A3A3C]">删除</button>
                </div>
              </div>
              <div v-if="openActionMenuId!==null" class="fixed inset-0 z-40" @click="closeActionMenu"></div>
            </teleport>
            <teleport to="body">
              <div v-if="showSizeModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" @click="showSizeModal=false">
                <div class="bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" @click.stop>
                  <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#3A3A3C]">
                    <h3 class="text-lg font-bold">选择生成尺寸</h3>
                    <div class="relative">
                      <button @mouseenter="sizeInfoVisible=true" @mouseleave="sizeInfoVisible=false" class="w-6 h-6 flex items-center justify-center rounded-full border text-secondary dark:text-gray-400 dark:border-[#3A3A3C]">i</button>
                      <div v-if="sizeInfoVisible" class="absolute right-0 mt-2 w-72 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded shadow text-xs">
                        <table class="min-w-full">
                          <thead>
                            <tr class="bg-blue-50 dark:bg-[#1C1C1E]">
                              <th class="text-left px-3 py-2 border-b dark:border-[#3A3A3C]">宽高比</th>
                              <th class="text-left px-3 py-2 border-b dark:border-[#3A3A3C]">宽高像素值</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="opt in ratioOptions" :key="opt.key" class="border-t dark:border-[#3A3A3C]">
                              <td class="px-3 py-1.5">{{ opt.key }}</td>
                              <td class="px-3 py-1.5">
                                <span class="px-2 py-1 rounded bg-gray-100 dark:bg-[#3A3A3C] text-[11px] font-medium">{{ opt.w }}x{{ opt.h }}</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div class="px-6 py-5 space-y-4">
                    <div class="grid grid-cols-3 gap-3">
                      <button
                        v-for="opt in ratioOptions"
                        :key="opt.key"
                        @click="selectedRatio = opt.key"
                        class="px-3 py-2 rounded-lg border text-sm dark:border-[#3A3A3C] hover:bg-gray-50 dark:hover:bg-[#3A3A3C]"
                        :class="selectedRatio===opt.key ? 'border-brand-green ring-2 ring-brand-green' : ''"
                      >
                        <div class="font-medium">{{ opt.key }}</div>
                        <div class="text-xs text-secondary">{{ opt.w }}x{{ opt.h }}</div>
                      </button>
                    </div>
                  </div>
                  <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-[#3A3A3C]">
                    <button @click="showSizeModal=false" class="px-3 py-1.5 rounded-lg border bg-white dark:bg-[#2C2C2E] dark:border-[#3A3A3C] text-sm">取消</button>
                    <button @click="applySizeSelection" class="px-3 py-1.5 rounded-lg bg-brand-green text-white text-sm">确定</button>
                  </div>
                </div>
              </div>
            </teleport>
          </div>
        </div>

        <!-- Video View -->
        <div v-else-if="activeTab === 'video'" class="h-full flex gap-4">
          <aside class="w-64 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-xl shrink-0 flex flex-col">
            <div class="flex items-center justify-between p-3 pb-2">
              <h3 class="text-sm font-bold">素材面板</h3>
              <button @click="triggerMediaFileInput" class="px-2 py-1 text-xs rounded border bg-white dark:bg-[#2C2C2E] dark:border-[#3A3A3C] hover:bg-gray-50 dark:hover:bg-[#3A3A3C]">导入</button>
            </div>
            <input ref="mediaFileInput" type="file" multiple class="hidden" accept="image/*,video/*" @change="handleMediaFileSelect" />
            <div
              class="flex-1 p-3 pt-0 overflow-y-auto"
              @dragenter="handleMediaDragOver"
              @dragover.prevent="handleMediaDragOver"
              @dragleave="handleMediaDragLeave"
              @drop.prevent.stop="handleMediaDrop"
            >
              <div
                class="space-y-2 min-h-full rounded-lg transition-colors"
                :class="mediaIsDragging ? 'border-2 border-dashed border-brand-green bg-brand-green/5 dark:bg-brand-green/10 p-2' : ''"
              >
                <div v-if="mediaIsDragging" class="text-[11px] text-brand-green mb-2 text-center">仅支持拖拽视频文件到此处导入</div>
                <div
                  v-for="m in mediaLibrary"
                  :key="m.key"
                  class="flex items-center gap-2 p-2 rounded border hover:bg-gray-50 dark:hover:bg-[#3A3A3C] cursor-grab"
                  draggable="true"
                  @dragstart="handleDragStart(m, $event)"
                  @click="currentPreview = m"
                >
                  <div class="w-12 h-8 bg-gray-100 dark:bg-[#3A3A3C] rounded overflow-hidden flex items-center justify-center">
                    <img v-if="m.type==='image'" :src="m.src" class="w-full h-full object-cover">
                    <fa v-else :icon="['fas','film']" class="text-gray-400" />
                  </div>
                  <div class="flex-1">
                    <div class="text-xs font-medium">{{ m.label }}</div>
                    <div class="text-[11px] text-secondary dark:text-gray-400">{{ m.type.toUpperCase() }}</div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
          <section class="flex-1 flex flex-col gap-4">
            <div class="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] p-3">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <button @click="togglePlay" class="px-2 py-1 text-xs rounded bg-black text-white dark:bg-white dark:text-black">播放</button>
                  <div class="text-xs text-secondary dark:text-gray-400">时间 {{ currentTime.toFixed(1) }}s</div>
                </div>
                <div class="text-sm font-bold">预览窗口</div>
              </div>
              <div class="aspect-video bg-gray-100 dark:bg-[#3A3A3C] rounded-lg overflow-hidden flex items-center justify-center">
                <img v-if="currentPreview && currentPreview.type==='image'" :src="currentPreview.src" class="w-full h-full object-cover">
                <div v-else class="flex flex-col items-center justify-center text-secondary dark:text-gray-400">
                  <fa :icon="['fas','film']" class="text-4xl mb-2 text-gray-300 dark:text-gray-600" />
                  <div class="text-xs">选择素材进行预览</div>
                </div>
              </div>
            </div>
            <div class="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] p-3">
              <div class="flex items-center justify-between mb-2">
                <div class="text-sm font-bold">时间轴</div>
                <div class="text-xs text-secondary dark:text-gray-400">拖拽素材到轨道</div>
              </div>
              <div class="space-y-2 overflow-x-auto">
                <div class="min-w-[800px]">
                  <div class="flex items-center gap-2 mb-2">
                    <div class="w-20 text-[11px] text-secondary">视频轨</div>
                    <div class="flex-1 h-20 bg-gray-100 dark:bg-[#3A3A3C] rounded relative" @dragover.prevent @drop="handleTimelineDrop('video',$event)">
                      <div v-for="it in timelineItems.filter(t=>t.track==='video')" :key="it.id" class="absolute top-2 h-16 rounded bg-brand-green/20 border border-brand-green overflow-hidden" :style="getItemStyle(it)">
                        <div class="flex items-center justify-between px-2 py-1 text-[11px]">
                          <span class="font-medium">{{ it.label }}</span>
                          <button @click="removeTimelineItem(it.id)" class="px-1 rounded bg-white dark:bg-[#2C2C2E] border dark:border-[#3A3A3C]">×</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-20 text-[11px] text-secondary">音频轨</div>
                    <div class="flex-1 h-12 bg-gray-100 dark:bg-[#3A3A3C] rounded relative" @dragover.prevent @drop="handleTimelineDrop('audio',$event)">
                      <div v-for="it in timelineItems.filter(t=>t.track==='audio')" :key="it.id" class="absolute top-1 h-10 rounded bg-blue-500/20 border border-blue-500 overflow-hidden" :style="getItemStyle(it)">
                        <div class="flex items-center justify-between px-2 py-1 text-[11px]">
                          <span class="font-medium">{{ it.label }}</span>
                          <button @click="removeTimelineItem(it.id)" class="px-1 rounded bg-white dark:bg-[#2C2C2E] border dark:border-[#3A3A3C]">×</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>

    <!-- Character Creation Modal -->
    <teleport to="body">
      <div 
        v-if="showCharacterModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click="closeCharacterModal"
      >
        <div 
          class="bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          @click.stop
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#3A3A3C]">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">新建角色</h3>
            <button 
              @click="closeCharacterModal"
              class="p-2 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg transition"
            >
              <fa :icon="['fas', 'xmark']" class="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 space-y-4">
            <!-- Character Image Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                角色形象
              </label>
              
              <!-- Hidden file input -->
              <input 
                ref="characterImageInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleCharacterImageUpload"
              />
              
              <!-- Upload area / Preview -->
              <div 
                v-if="!characterImagePreview"
                @click="triggerCharacterImageUpload"
                class="border-2 border-dashed border-gray-300 dark:border-[#3A3A3C] rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-brand-green dark:hover:border-brand-green transition-colors"
              >
                <fa :icon="['fas', 'image']" class="text-3xl text-gray-300 dark:text-gray-600 mb-2" />
                <p class="text-sm text-gray-500 dark:text-gray-400">点击上传角色形象</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">支持 JPG, PNG, GIF (最大 5MB)</p>
              </div>
              
              <!-- Image Preview -->
              <div v-else class="relative group">
                <img 
                  :src="characterImagePreview" 
                  alt="角色形象预览"
                  class="w-full h-48 object-cover rounded-lg"
                />
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <button 
                    @click="triggerCharacterImageUpload"
                    class="px-3 py-1.5 bg-white text-gray-900 rounded-md text-xs font-medium hover:bg-gray-100 transition"
                  >
                    更换图片
                  </button>
                  <button 
                    @click="removeCharacterImage"
                    class="px-3 py-1.5 bg-red-500 text-white rounded-md text-xs font-medium hover:bg-red-600 transition"
                  >
                    删除图片
                  </button>
                </div>
              </div>
            </div>

            <!-- Character Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                角色名称 <span class="text-red-500">*</span>
              </label>
              <input 
                v-model="newCharacter.name"
                type="text"
                placeholder="例如：顾北辰"
                class="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1C1C1E] border border-gray-300 dark:border-[#3A3A3C] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
                @keydown.enter="createCharacter"
              />
            </div>

            <!-- Character Role -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                角色定位 <span class="text-red-500">*</span>
              </label>
              <input 
                v-model="newCharacter.role"
                type="text"
                placeholder="例如：男主角、配角、反派"
                class="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1C1C1E] border border-gray-300 dark:border-[#3A3A3C] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
                @keydown.enter="createCharacter"
              />
            </div>

            <!-- Character Description -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                角色描述
              </label>
              <textarea 
                v-model="newCharacter.desc"
                placeholder="例如：霸道总裁，外冷内热，对女主一见钟情..."
                rows="3"
                class="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1C1C1E] border border-gray-300 dark:border-[#3A3A3C] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 resize-none"
              ></textarea>
            </div>

            <!-- Error Message -->
            <div v-if="characterError" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p class="text-sm text-red-600 dark:text-red-400">{{ characterError }}</p>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-[#1C1C1E] border-t border-gray-200 dark:border-[#3A3A3C]">
            <button 
              @click="closeCharacterModal"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3A3A3C] rounded-lg transition"
            >
              取消
            </button>
            <button 
              @click="createCharacter"
              class="px-4 py-2 text-sm font-medium text-white bg-brand-green hover:bg-brand-green/90 rounded-lg transition"
            >
              创建角色
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Extract Characters Wizard -->
    <teleport to="body">
      <div 
        v-if="showExtractWizard"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click="closeExtractWizard"
      >
        <div 
          class="bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
          @click.stop
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#3A3A3C]">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">剧本提炼向导 - 第 {{ extractStep }}/7 步</h3>
            <button 
              @click="closeExtractWizard"
              class="p-2 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg transition"
            >
              <fa :icon="['fas', 'xmark']" class="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6">
            <!-- Step 1: Select Script Files -->
            <div v-if="extractStep === 1" class="space-y-4">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">选择要提炼的剧本文件</h3>

              <!-- Files List -->
              <div v-if="uploadedFiles.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
                <label 
                  v-for="(fileData, index) in uploadedFiles" 
                  :key="index"
                  class="flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all"
                  :class="fileData.selected 
                    ? 'border-brand-green bg-brand-green/5 dark:bg-brand-green/10' 
                    : 'border-gray-200 dark:border-[#3A3A3C] hover:border-gray-300'"
                >
                  <input 
                    type="checkbox" 
                    v-model="fileData.selected"
                    @change="fileListSelectAll = uploadedFiles.every(f => f.selected)"
                    class="mt-0.5 w-4 h-4 text-brand-green rounded border-gray-300 focus:ring-brand-green"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <fa :icon="['fas', 'file']" class="text-brand-green" />
                      <span class="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {{ fileData.file.name }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{{ (fileData.file.size / 1024).toFixed(2) }} KB</span>
                      <span>•</span>
                      <span :class="fileData.progress === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-gray-500'">
                        {{ fileData.progress === 'completed' ? '已上传' : '处理中' }}
                      </span>
                    </div>
                  </div>
                </label>
              </div>

              <!-- Empty State -->
              <div v-else class="text-center py-12">
                <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#3A3A3C] flex items-center justify-center mx-auto mb-4">
                  <fa :icon="['fas', 'folder-open']" class="text-2xl text-gray-400 dark:text-gray-500" />
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">暂无剧本文件</p>
                <p class="text-xs text-gray-400 dark:text-gray-500">请先在"剧本文件管理"中上传文件</p>
              </div>

              <!-- Select All -->
              <label 
                v-if="uploadedFiles.length > 0"
                class="flex items-center gap-2 cursor-pointer pt-2"
              >
                <input 
                  type="checkbox" 
                  :checked="fileListSelectAll"
                  @change="toggleFileSelectAll"
                  class="w-4 h-4 text-brand-green rounded border-gray-300 focus:ring-brand-green"
                />
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">全选</span>
              </label>

              <p v-if="extractError" class="text-sm text-red-500">{{ extractError }}</p>
            </div>

            <!-- Step 2: Select Characters -->
            <div v-else-if="extractStep === 2" class="space-y-4">
              <div class="text-sm text-gray-600 dark:text-gray-300">
                共识别到 {{ extractedRoles.length }} 个角色，请选择需要创建的角色
              </div>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                <button 
                  v-for="(r, i) in extractedRoles" 
                  :key="r.name"
                  @click="toggleRoleSelected(i)"
                  class="flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all"
                  :class="r.selected 
                    ? 'border-brand-green bg-brand-green/10 text-brand-green' 
                    : 'border-gray-300 dark:border-[#3A3A3C] text-gray-600 dark:text-gray-300 hover:border-gray-400'"
                >
                  <span class="font-medium">{{ r.name }}</span>
                  <fa v-if="r.selected" :icon="['fas', 'check-circle']" class="text-brand-green" />
                </button>
              </div>
              <p v-if="extractError" class="text-sm text-red-500">{{ extractError }}</p>
            </div>
            <!-- Step 3: 角色形象 -->
            <div v-else-if="extractStep === 3" class="space-y-4">
              <div class="text-sm text-gray-600 dark:text-gray-300">为选中的角色补充形象描述</div>
              <div class="space-y-3 max-h-96 overflow-y-auto">
                <div v-for="r in extractedRoles.filter(x=>x.selected)" :key="r.name" class="flex items-start gap-3 p-3 rounded-lg border dark:border-[#3A3A3C]">
                  <img :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.name}`" class="w-10 h-10 rounded"/>
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <div class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ r.name }}</div>
                      <div class="flex items-center gap-2">
                        <button @click="toggleRoleEdit(r.name)" class="text-xs px-2 py-1 rounded border bg-white dark:bg-[#2C2C2E] dark:border-[#3A3A3C] text-secondary hover:border-gray-300">{{ roleEditing[r.name] ? '完成' : '编辑' }}</button>
                        <button @click="roleDetailsOpen[r.name]=!roleDetailsOpen[r.name]" class="text-xs px-2 py-1 rounded border bg-white dark:bg-[#2C2C2E] dark:border-[#3A3A3C] text-secondary hover:border-gray-300">
                          {{ roleDetailsOpen[r.name] ? '▲' : '▼' }} 详情
                        </button>
                      </div>
                    </div>
                    <div v-if="roleDetailsOpen[r.name]" class="mt-3 space-y-2">
                      <div>
                        <span class="text-xs text-secondary">年龄</span>
                        <input type="text" v-model="roleDetails[r.name].age" :readonly="!roleEditing[r.name]" :tabindex="roleEditing[r.name]?0:-1" @mousedown="!roleEditing[r.name] && $event.preventDefault()" @focus="!roleEditing[r.name] && $event.target.blur()" class="mt-1 w-full px-3 py-2 rounded border bg-white dark:bg-[#2C2C2E] text-sm" :class="roleEditing[r.name] ? 'border-brand-green focus:border-brand-green focus:ring-2 focus:ring-brand-green' : 'border-gray-300 dark:border-[#3A3A3C] focus:ring-0 focus:border-gray-300'" />
                      </div>
                      <div>
                        <span class="text-xs text-secondary">地址</span>
                        <input type="text" v-model="roleDetails[r.name].address" :readonly="!roleEditing[r.name]" :tabindex="roleEditing[r.name]?0:-1" @mousedown="!roleEditing[r.name] && $event.preventDefault()" @focus="!roleEditing[r.name] && $event.target.blur()" class="mt-1 w-full px-3 py-2 rounded border bg-white dark:bg-[#2C2C2E] text-sm" :class="roleEditing[r.name] ? 'border-brand-green focus:border-brand-green focus:ring-2 focus:ring-brand-green' : 'border-gray-300 dark:border-[#3A3A3C] focus:ring-0 focus:border-gray-300'" />
                      </div>
                      <div>
                        <span class="text-xs text-secondary">身份</span>
                        <input type="text" v-model="roleDetails[r.name].identity" :readonly="!roleEditing[r.name]" :tabindex="roleEditing[r.name]?0:-1" @mousedown="!roleEditing[r.name] && $event.preventDefault()" @focus="!roleEditing[r.name] && $event.target.blur" class="mt-1 w-full px-3 py-2 rounded border bg-white dark:bg-[#2C2C2E] text-sm" :class="roleEditing[r.name] ? 'border-brand-green focus:border-brand-green focus:ring-2 focus:ring-brand-green' : 'border-gray-300 dark:border-[#3A3A3C] focus:ring-0 focus:border-gray-300'" />
                      </div>
                      <div>
                        <span class="text-xs text-secondary">性别</span>
                        <input type="text" v-model="roleDetails[r.name].gender" :readonly="!roleEditing[r.name]" :tabindex="roleEditing[r.name]?0:-1" @mousedown="!roleEditing[r.name] && $event.preventDefault()" @focus="!roleEditing[r.name] && $event.target.blur()" class="mt-1 w-full px-3 py-2 rounded border bg-white dark:bg-[#2C2C2E] text-sm" :class="roleEditing[r.name] ? 'border-brand-green focus:border-brand-green focus:ring-2 focus:ring-brand-green' : 'border-gray-300 dark:border-[#3A3A3C] focus:ring-0 focus:border-gray-300'" />
                      </div>
                      <div>
                        <span class="text-xs text-secondary">人物关系</span>
                        <input type="text" v-model="roleDetails[r.name].relations" :readonly="!roleEditing[r.name]" :tabindex="roleEditing[r.name]?0:-1" @mousedown="!roleEditing[r.name] && $event.preventDefault()" @focus="!roleEditing[r.name] && $event.target.blur()" class="mt-1 w-full px-3 py-2 rounded border bg-white dark:bg-[#2C2C2E] text-sm" :class="roleEditing[r.name] ? 'border-brand-green focus:border-brand-green focus:ring-2 focus:ring-brand-green' : 'border-gray-300 dark:border-[#3A3A3C] focus:ring-0 focus:border-gray-300'" />
                      </div>
                      <div>
                        <span class="text-xs text-secondary">描述</span>
                        <input type="text" v-model="roleDetails[r.name].description" :readonly="!roleEditing[r.name]" :tabindex="roleEditing[r.name]?0:-1" @mousedown="!roleEditing[r.name] && $event.preventDefault()" @focus="!roleEditing[r.name] && $event.target.blur()" class="mt-1 w-full px-3 py-2 rounded border bg-white dark:bg-[#2C2C2E] text-sm" :class="roleEditing[r.name] ? 'border-brand-green focus:border-brand-green focus:ring-2 focus:ring-brand-green' : 'border-gray-300 dark:border-[#3A3A3C] focus:ring-0 focus:border-gray-300'" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 4: 场景环境 -->
            <div v-else-if="extractStep === 4" class="space-y-4">
              <div class="text-sm text-gray-600 dark:text-gray-300">从剧本中识别到的场景环境</div>
              <div v-if="sceneSegments.length>0" class="space-y-2 max-h-96 overflow-y-auto">
                <div v-for="s in sceneSegments" :key="s.id" class="p-3 rounded-lg border bg-white dark:bg-[#2C2C2E] dark:border-[#3A3A3C] text-sm text-gray-800 dark:text-gray-200">{{ s.text }}</div>
              </div>
              <div v-else class="text-sm text-secondary">暂无场景标注</div>
            </div>

            <!-- Step 5: 角色台词文案 -->
            <div v-else-if="extractStep === 5" class="space-y-4">
              <div class="text-sm text-gray-600 dark:text-gray-300">识别到的角色台词文案</div>
              <div v-if="dialogueSegments.length>0" class="space-y-2 max-h-96 overflow-y-auto">
                <div v-for="d in dialogueSegments" :key="d.id" class="p-3 rounded-lg border bg-white dark:bg-[#2C2C2E] dark:border-[#3A3A3C] text-sm text-gray-800 dark:text-gray-200">{{ d.text }}</div>
              </div>
              <div v-else class="text-sm text-secondary">暂无台词文案</div>
              <p v-if="extractError" class="text-sm text-red-500">{{ extractError }}</p>
            </div>

            <!-- Step 6: 画风风格（人物） -->
            <div v-else-if="extractStep === 6" class="space-y-4">
              <div class="flex gap-6 border-b border-gray-200 dark:border-[#3A3A3C]">
                <button @click="styleKind='2d'" class="pb-3 text-sm font-medium text-gray-600 dark:text-gray-300" :class="styleKind==='2d' ? 'border-b-2 border-gray-500' : ''">2D动画</button>
                <button @click="styleKind='live'" class="pb-3 text-sm font-medium text-gray-600 dark:text-gray-300" :class="styleKind==='live' ? 'border-b-2 border-gray-500' : ''">真人写实风</button>
              </div>
              <div class="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                <button 
                  v-for="card in characterStyleCards.filter(c=>c.kind===styleKind)" 
                  :key="card.id"
                  @click="selectedCharacterStyle = card.id"
                  class="text-left p-3 rounded-lg border transition"
                  :class="selectedCharacterStyle===card.id ? 'border-brand-green bg-brand-green/10' : 'border-gray-300 dark:border-[#3A3A3C] hover:border-gray-400'"
                >
                  <div class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ card.title }}</div>
                  <div class="mt-1 text-xs text-secondary">{{ card.prompt }}</div>
                </button>
              </div>
            </div>

            <!-- Step 7: 场景卡片（风格） -->
            <div v-else-if="extractStep === 7" class="space-y-4">
              <div class="flex gap-6 border-b border-gray-200 dark:border-[#3A3A3C]">
                <button @click="sceneStyleKind='2d'" class="pb-3 text-sm font-medium text-gray-600 dark:text-gray-300" :class="sceneStyleKind==='2d' ? 'border-b-2 border-gray-500' : ''">2D 动画风</button>
                <button @click="sceneStyleKind='live'" class="pb-3 text-sm font-medium text-gray-600 dark:text-gray-300" :class="sceneStyleKind==='live' ? 'border-b-2 border-gray-500' : ''">现实场景写实风</button>
              </div>
              <div class="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                <button 
                  v-for="card in sceneStyleCards.filter(c=>c.kind===sceneStyleKind)" 
                  :key="card.id"
                  @click="selectedSceneStyle = card.id"
                  class="text-left p-3 rounded-lg border transition"
                  :class="selectedSceneStyle===card.id ? 'border-brand-green bg-brand-green/10' : 'border-gray-300 dark:border-[#3A3A3C] hover:border-gray-400'"
                >
                  <div class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ card.title }}</div>
                  <div class="mt-1 text-xs text-secondary">{{ card.prompt }}</div>
                </button>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-[#1C1C1E] border-t border-gray-200 dark:border-[#3A3A3C]">
            <button 
              v-if="extractStep > 1"
              @click="prevExtract"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3A3A3C] rounded-lg transition"
            >
              上一步
            </button>
            <div v-else></div>
            
            <div class="flex items-center gap-3">
              <button 
                @click="closeExtractWizard"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3A3A3C] rounded-lg transition"
              >
                取消
              </button>
              <button 
                v-if="extractStep === 1"
                @click="extractCandidates"
                class="px-4 py-2 text-sm font-medium text-white bg-brand-green hover:bg-brand-green/90 rounded-lg transition"
              >
                下一步
              </button>
              <button 
                v-else-if="extractStep >= 2 && extractStep < 7"
                @click="nextExtract"
                class="px-4 py-2 text-sm font-medium text-white bg-brand-green hover:bg-brand-green/90 rounded-lg transition"
              >
                下一步
              </button>
              <button 
                v-else
                @click="confirmExtractCreate"
                class="px-4 py-2 text-sm font-medium text-white bg-brand-green hover:bg-brand-green/90 rounded-lg transition"
              >
                创建角色
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Delete File Confirmation Modal -->
    <teleport to="body">
      <div 
        v-if="showDeleteFileConfirm" 
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click="cancelDeleteFile"
      >
        <div 
          class="bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          @click.stop
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#3A3A3C]">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">确认删除文件</h3>
            <button 
              @click="cancelDeleteFile"
              class="p-2 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg transition"
            >
              <fa :icon="['fas', 'xmark']" class="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <fa :icon="['fas', 'triangle-exclamation']" class="text-xl text-red-600 dark:text-red-500" />
              </div>
              <div class="flex-1">
                <p class="text-gray-900 dark:text-white font-medium mb-2">
                  确定要删除文件 "{{ deleteFileName }}" 吗?
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  此操作无法撤销，文件将被永久删除。
                </p>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-[#1C1C1E] border-t border-gray-200 dark:border-[#3A3A3C]">
            <button 
              @click="cancelDeleteFile"
              class="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#3A3A3C] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] transition font-medium"
            >
              取消
            </button>
            <button 
              @click="confirmDeleteFile"
              class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition font-medium"
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Upload Modal -->
    <teleport to="body">
      <div 
        v-if="showUploadModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click="closeUploadModal"
      >
        <div 
          class="bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
          @click.stop
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#3A3A3C]">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">上传文件</h3>
            <button 
              @click="closeUploadModal"
              class="p-2 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg transition"
            >
              <fa :icon="['fas', 'xmark']" class="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6">
            <!-- Hidden file input -->
            <input 
              ref="fileInput"
              type="file" 
              multiple
              class="hidden" 
              accept=".txt,.md,.doc,.docx,.csv,.xlsx,.pdf"
              @change="handleFileSelect"
            >

            <!-- Upload Area -->
            <div 
              class="border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer"
              :class="uploadModalDragging 
                ? 'border-brand-green bg-brand-green/5 dark:bg-brand-green/10' 
                : 'border-gray-300 dark:border-[#3A3A3C] hover:bg-gray-50 dark:hover:bg-[#3A3A3C]/30'"
              @click="triggerFileInput"
              @dragover="handleModalDragOver"
              @dragleave="handleModalDragLeave"
              @drop="handleModalDrop"
            >
              <div class="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center mb-4">
                <fa :icon="['fas', uploadModalDragging ? 'file-import' : 'cloud-arrow-up']" 
                  class="text-3xl text-brand-green" />
              </div>
              <p class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {{ uploadModalDragging ? '释放以上传文件' : '点击或拖拽文件到此处' }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                支持批量上传，可同时选择多个文件
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500">
                支持格式：TXT, MD, Word, PDF, CSV, Excel (最大 10MB/文件)
              </p>
            </div>

            <!-- Uploaded Files Preview (in modal) -->
            <div v-if="uploadedFiles.length > 0" class="mt-6">
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  已选择 {{ uploadedFiles.length }} 个文件
                </h4>
                <button 
                  @click="uploadedFiles = []"
                  class="text-xs text-gray-500 hover:text-red-500 transition"
                >
                  清空列表
                </button>
              </div>
              <div class="max-h-48 overflow-y-auto space-y-2">
                <div 
                  v-for="(fileData, index) in uploadedFiles.slice(0, 10)"
                  :key="index"
                  class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#3A3A3C] rounded-lg"
                >
                  <fa :icon="['fas', 'file']" class="text-brand-green" />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {{ fileData.file.name }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ (fileData.file.size / 1024).toFixed(2) }} KB
                    </p>
                  </div>
                  <span class="text-xs px-2 py-1 rounded-full"
                    :class="fileData.progress === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : fileData.progress === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'">
                    {{ fileData.progress === 'completed' ? '完成' : fileData.progress === 'error' ? '失败' : fileData.uploadProgress + '%' }}
                  </span>
                </div>
                <p v-if="uploadedFiles.length > 10" class="text-xs text-center text-gray-500 dark:text-gray-400 pt-2">
                  还有 {{ uploadedFiles.length - 10 }} 个文件...
                </p>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-[#1C1C1E] border-t border-gray-200 dark:border-[#3A3A3C]">
            <button 
              @click="closeUploadModal"
              class="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#3A3A3C] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] transition font-medium"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Batch Delete Confirmation Modal -->
    <teleport to="body">
      <div 
        v-if="showBatchDeleteConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click="cancelBatchDelete"
      >
        <div 
          class="bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          @click.stop
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#3A3A3C]">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">确认批量删除</h3>
            <button 
              @click="cancelBatchDelete"
              class="p-2 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg transition"
            >
              <fa :icon="['fas', 'xmark']" class="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <fa :icon="['fas', 'triangle-exclamation']" class="text-xl text-red-600 dark:text-red-500" />
              </div>
              <div class="flex-1">
                <p class="text-gray-900 dark:text-white font-medium mb-2">
                  确定要删除选中的 {{ batchDeleteCount }} 个文件吗?
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  此操作无法撤销，文件将被永久删除。
                </p>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-[#1C1C1E] border-t border-gray-200 dark:border-[#3A3A3C]">
            <button 
              @click="cancelBatchDelete"
              class="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#3A3A3C] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] transition font-medium"
            >
              取消
            </button>
            <button 
              @click="batchDeleteFiles(); cancelBatchDelete()"
              class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition font-medium"
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Toast Notification -->
    <teleport to="body">
      <transition name="toast">
        <div v-if="showToast" class="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg"
          :class="toastType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'">
          <fa :icon="['fas', toastType === 'success' ? 'check-circle' : 'triangle-exclamation']" class="text-xl" />
          <span class="font-medium">{{ toastMessage }}</span>
        </div>
      </transition>
    </teleport>

    <!-- File Preview Modal -->
    <teleport to="body">
      <div
        v-if="showFilePreview"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click="closeFilePreview"
      >
        <div
          class="bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl w-full max-w-5xl mx-4 h-[90vh] flex flex-col overflow-hidden"
          @click.stop
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#3A3A3C] flex-shrink-0">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <button
                @click="closeFilePreview"
                class="p-2 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg transition"
              >
                <fa :icon="['fas', 'arrow-left']" class="text-gray-500 dark:text-gray-400" />
              </button>
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {{ previewFileData?.file?.name || '文件预览' }}
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ previewFileData?.fileType || '' }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="copyFileContent"
                class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg transition flex items-center gap-2"
                title="复制内容"
              >
                <fa :icon="['fas', 'copy']" />
                复制
              </button>
              <button
                @click="downloadFile(previewFileData)"
                class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg transition flex items-center gap-2"
              >
                <fa :icon="['fas', 'download']" />
                下载
              </button>
              <button
                @click="closeFilePreview"
                class="p-2 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg transition"
              >
                <fa :icon="['fas', 'xmark']" class="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="flex-1 overflow-hidden p-6">
            <!-- Loading State -->
            <div v-if="previewFileLoading" class="h-full flex items-center justify-center">
              <div class="text-center">
                <div class="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p class="text-sm text-gray-500 dark:text-gray-400">加载中...</p>
              </div>
            </div>

            <!-- Error State -->
            <div v-else-if="previewFileError" class="h-full flex items-center justify-center">
              <div class="text-center">
                <div class="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                  <fa :icon="['fas', 'triangle-exclamation']" class="text-2xl text-red-600 dark:text-red-500" />
                </div>
                <p class="text-sm text-gray-900 dark:text-white font-medium mb-2">{{ previewFileError }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">请稍后重试</p>
              </div>
            </div>

            <!-- Content Display -->
            <div v-else class="h-full overflow-auto bg-gray-50 dark:bg-[#1C1C1E] rounded-lg p-6">
              <pre class="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">{{ previewFileContent }}</pre>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Settings Modal -->
    <teleport to="body">
      <div v-if="showSettingsModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" @click="closeSettingsModal"></div>

        <!-- Modal Content -->
        <div class="relative w-full max-w-6xl bg-white dark:bg-[#1C1C1E] rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform transition-all">
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">配置</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">在这里更新您的知识库详细信息，尤其是切片方法。</p>
            </div>
            <button @click="closeSettingsModal" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <fa :icon="['fas', 'xmark']" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-hidden flex flex-col md:flex-row">
            <!-- Left Column: Configuration -->
            <div class="w-full md:w-1/2 p-6 overflow-y-auto border-r border-gray-100 dark:border-gray-800">
              <div class="space-y-6">
                <!-- File Name -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <span class="text-red-500 mr-1">*</span>文件名
                  </label>
                  <div class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm">
                    {{ currentSettingsFile?.fileName }}
                  </div>
                </div>

                <!-- Advanced Settings Box -->
                <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-5">

                  <!-- Embedding Model -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <span class="text-red-500 mr-1">*</span>LLM <fa :icon="['fas', 'circle-info']" class="ml-1 text-gray-400 text-xs" />
                    </label>
                    <div class="relative">
                      <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <fa :icon="['fas', 'cubes']" class="text-brand-green" />
                      </div>
                      <select v-model="settingsForm.embeddingModel" class="w-full pl-10 pr-3 py-2 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/50">
                        <option value="gpt-5">gpt-5</option>
                        <option value="gpt-4">gpt-4</option>
                      </select>
                    </div>
                  </div>

                  <!-- Chunking Method -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <span class="text-red-500 mr-1">*</span>切片方法 <fa :icon="['fas', 'circle-info']" class="ml-1 text-gray-400 text-xs" />
                    </label>
                      <select v-model="settingsForm.chunkingMethod" class="w-full px-3 py-2 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/50">
                        <option value="novel_en">Novel</option>
                        <option value="txt">txt</option>
                        <option value="markdown">markdown</option>
                      </select>
                  </div>

                  <!-- Separator -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <span class="text-red-500 mr-1">*</span>文本分段标识符 <fa :icon="['fas', 'circle-info']" class="ml-1 text-gray-400 text-xs" />
                    </label>
                    <input type="text" v-model="settingsForm.separator" class="w-full px-3 py-2 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/50">
                  </div>
                </div>

                
              </div>
            </div>

            <!-- Right Column: Info & Preview -->
            <div class="w-full md:w-1/2 p-6 bg-gray-50/50 dark:bg-gray-800/20 overflow-y-auto">
              <div class="sticky top-0">
                <h4 class="text-base font-semibold text-gray-900 dark:text-white mb-4">"{{ currentChunkingDetail.label }}" 分块方法说明</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  支持的文件格式为 <strong>{{ currentChunkingDetail.formats }}</strong>。
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{{ currentChunkingDetail.description }}</p>
                <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-1">
                  <li v-for="(step, index) in currentChunkingDetail.steps" :key="index">{{ step }}</li>
                </ul>

                <h4 class="text-base font-semibold text-gray-900 dark:text-white mb-4">"{{ currentChunkingDetail.label }}" 示例</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">提出以下屏幕截图以促进理解。</p>
                
                <!-- Example Images Placeholder -->
                <div class="grid grid-cols-2 gap-4 mb-8">
                  <div>
                    <div class="aspect-video rounded-lg overflow-hidden">
                      <img src="@/assets/meta.png" alt="原图" class="w-full h-full object-cover" />
                    </div>
                    <div class="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">原图</div>
                  </div>
                  <div>
                    <div class="aspect-video rounded-lg overflow-hidden">
                      <img src="@/assets/Novel.png" alt="实际读取方式" class="w-full h-full object-cover" />
                    </div>
                    <div class="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">实际读取方式</div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1C1C1E]">
            <button
              @click="closeSettingsModal"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              取消
            </button>
            <button
              @click="saveSettings"
              class="px-4 py-2 text-sm font-medium text-white bg-brand-green hover:bg-brand-green-hover rounded-lg shadow-sm shadow-brand-green/20 transition"
            >
              保存设置
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Video Preview Modal -->
    <teleport to="body">
      <div 
        v-if="showVideoPreview && currentVideoPreview"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click="closeVideoPreview"
      >
        <div 
          class="bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl w-full max-w-6xl mx-4 overflow-hidden flex flex-col max-h-[90vh]"
          @click.stop
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#3A3A3C]">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">视频预览</h3>
            <button 
              @click="closeVideoPreview"
              class="p-2 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg transition"
            >
              <fa :icon="['fas', 'xmark']" class="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="flex-1 overflow-hidden flex">
            <!-- Left: Video Player -->
            <div class="flex-1 bg-black flex items-center justify-center p-6">
              <video
                :src="currentVideoPreview.src"
                controls
                preload="metadata"
                class="w-full h-full max-h-[70vh] rounded-lg"
                @error="(e) => console.error('Video load error:', e, 'URL:', currentVideoPreview.src)"
                @loadedmetadata="() => console.log('Video loaded:', currentVideoPreview.src)"
              >
                您的浏览器不支持视频播放
              </video>
            </div>

            <!-- Right: Info Panel -->
            <div class="w-96 border-l border-gray-200 dark:border-[#3A3A3C] flex flex-col">
              <!-- Tabs -->
              <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-[#3A3A3C]">
                <button 
                  @click="videoPreviewTab = 'structure'"
                  class="px-3 py-1.5 text-sm rounded-lg transition"
                  :class="videoPreviewTab === 'structure' ? 'bg-brand-green text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#3A3A3C]'"
                >
                  结构化列表
                </button>
                <button 
                  @click="videoPreviewTab = 'json'"
                  class="px-3 py-1.5 text-sm rounded-lg transition"
                  :class="videoPreviewTab === 'json' ? 'bg-brand-green text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#3A3A3C]'"
                >
                  json预览
                </button>
                <button 
                  @click="exportVideoJson"
                  class="ml-auto px-3 py-1.5 text-sm rounded-lg border border-brand-green text-brand-green hover:bg-brand-green hover:text-white transition"
                >
                  导出
                </button>
              </div>

              <!-- Tab Content -->
              <div class="flex-1 overflow-y-auto p-4">
                <!-- Structure Tab -->
                <div v-if="videoPreviewTab === 'structure'" class="space-y-3">
                  <!-- Row 1: Video Name -->
                  <div class="bg-gray-50 dark:bg-[#3A3A3C] rounded-lg p-3">
                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">视频名称</div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{{ currentVideoPreview.label }}</div>
                  </div>
                  
                  <!-- Row 2: Scene Tags -->
                  <div class="bg-gray-50 dark:bg-[#3A3A3C] rounded-lg p-3">
                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">画面和场景关键词</div>
                    <div class="flex flex-wrap gap-1.5">
                      <span 
                        v-for="(tag, index) in currentVideoPreview.sceneTags || []" 
                        :key="index"
                        class="px-2 py-1 text-xs rounded-md bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-green-light"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                  
                  <!-- Row 3: Video Text (Audio Transcription) -->
                  <div class="bg-gray-50 dark:bg-[#3A3A3C] rounded-lg p-3">
                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">音频转文本</div>
                    <div class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {{ currentVideoPreview.videoText || '暂无音频文本' }}
                    </div>
                  </div>
                  
                  <!-- Row 4: Summary -->
                  <div class="bg-gray-50 dark:bg-[#3A3A3C] rounded-lg p-3">
                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">视频总结描述</div>
                    <div class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {{ currentVideoPreview.summary || '暂无描述' }}
                    </div>
                  </div>
                  
                  <!-- Row 5: Metadata -->
                  <div class="bg-gray-50 dark:bg-[#3A3A3C] rounded-lg p-3">
                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">元数据</div>
                    <div class="space-y-2">
                      <div class="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span class="text-gray-500 dark:text-gray-400">时长:</span>
                          <span class="ml-1 text-gray-900 dark:text-white font-medium">{{ currentVideoPreview.duration || '未知' }}</span>
                        </div>
                        <div>
                          <span class="text-gray-500 dark:text-gray-400">分辨率:</span>
                          <span class="ml-1 text-gray-900 dark:text-white font-medium">{{ currentVideoPreview.resolution || '未知' }}</span>
                        </div>
                        <div>
                          <span class="text-gray-500 dark:text-gray-400">比例:</span>
                          <span class="ml-1 text-gray-900 dark:text-white font-medium">{{ currentVideoPreview.aspectRatio || '未知' }}</span>
                        </div>
                        <div>
                          <span class="text-gray-500 dark:text-gray-400">帧率:</span>
                          <span class="ml-1 text-gray-900 dark:text-white font-medium">{{ currentVideoPreview.frameRate || '未知' }}</span>
                        </div>
                        <div>
                          <span class="text-gray-500 dark:text-gray-400">类型:</span>
                          <span class="ml-1 text-gray-900 dark:text-white font-medium">{{ currentVideoPreview.type.toUpperCase() }}</span>
                        </div>
                        <div>
                          <span class="text-gray-500 dark:text-gray-400">大小:</span>
                          <span class="ml-1 text-gray-900 dark:text-white font-medium">{{ currentVideoPreview.size || '未知' }}</span>
                        </div>
                      </div>
                      <div class="pt-2 border-t border-gray-200 dark:border-[#48484A]">
                        <div class="text-xs mb-1">
                          <span class="text-gray-500 dark:text-gray-400">文件名:</span>
                          <span class="ml-1 text-gray-900 dark:text-white font-mono text-[11px]">{{ currentVideoPreview.label }}</span>
                        </div>
                        <div class="text-xs mb-1">
                          <span class="text-gray-500 dark:text-gray-400">UUID:</span>
                          <span class="ml-1 text-gray-900 dark:text-white font-mono text-[11px]">{{ currentVideoPreview.uuid || '未知' }}</span>
                        </div>
                        <div class="text-xs">
                          <span class="text-gray-500 dark:text-gray-400">短链:</span>
                          <a :href="currentVideoPreview.shortUrl" target="_blank" class="ml-1 text-brand-green hover:underline font-mono text-[11px]">
                            {{ currentVideoPreview.shortUrl || currentVideoPreview.src }}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- JSON Tab -->
                <div v-else-if="videoPreviewTab === 'json'" class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre class="text-xs text-green-400 font-mono">{{ JSON.stringify(currentVideoPreview, null, 2) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Video Upload Modal -->
    <teleport to="body">
      <div 
        v-if="showVideoUploadModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click="closeVideoUploadModal"
      >
        <div 
          class="bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
          @click.stop
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#3A3A3C]">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">上传视频</h3>
            <button 
              @click="closeVideoUploadModal"
              class="p-2 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg transition"
            >
              <fa :icon="['fas', 'xmark']" class="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6">
            <!-- Hidden file input -->
            <input 
              ref="videoUploadInput" 
              type="file" 
              multiple 
              class="hidden" 
              accept="video/*"
              @change="handleVideoUploadSelect"
            />

            <!-- Upload Area -->
            <div 
              @click="triggerVideoUploadInput"
              @dragenter="handleVideoUploadDragOver"
              @dragover.prevent="handleVideoUploadDragOver"
              @dragleave="handleVideoUploadDragLeave"
              @drop="handleVideoUploadDrop"
              class="border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer"
              :class="videoUploadDragging ? 'border-brand-green bg-brand-green/5' : 'border-gray-300 dark:border-[#3A3A3C] hover:bg-gray-50 dark:hover:bg-[#3A3A3C]/30'"
            >
              <div class="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center mb-4">
                <fa :icon="['fas', 'cloud-arrow-up']" class="text-3xl text-brand-green" />
              </div>
              <p class="text-lg font-medium text-gray-900 dark:text-white mb-2">点击或拖拽视频到此处</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                支持批量上传,可同时选择多个文件
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500">
                支持格式: MP4, AVI, MOV, MKV, WebM (最大 100MB/文件)
              </p>
            </div>

            <!-- Uploaded Files Preview -->
            <div v-if="videoUploadFiles.length > 0" class="mt-6">
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  已选择 {{ videoUploadFiles.length }} 个文件
                </h4>
                <button 
                  @click="clearUploadList"
                  class="text-xs text-gray-500 hover:text-red-500 transition"
                >
                  清空列表
                </button>
              </div>

              <div class="max-h-64 overflow-y-auto space-y-2">
                <div 
                  v-for="fileObj in videoUploadFiles" 
                  :key="fileObj.id"
                  class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#3A3A3C] rounded-lg"
                >
                  <fa :icon="['fas', 'file-video']" class="text-brand-green text-xl" />
                  
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ fileObj.name }}</p>
                    <div class="flex items-center gap-2 mt-1">
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ fileObj.size }}</p>
                      
                      <!-- Progress bar for uploading -->
                      <div v-if="fileObj.status === 'uploading'" class="flex-1 max-w-xs">
                        <div class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            class="h-full bg-brand-green transition-all duration-300"
                            :style="{ width: fileObj.progress + '%' }"
                          ></div>
                        </div>
                        <p class="text-xs text-gray-500 mt-0.5">{{ fileObj.progress }}%</p>
                      </div>
                      
                      <!-- Error message -->
                      <p v-if="fileObj.status === 'error'" class="text-xs text-red-500">{{ fileObj.error }}</p>
                    </div>
                  </div>

                  <!-- Status badge -->
                  <span 
                    v-if="fileObj.status === 'completed'"
                    class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  >
                    完成
                  </span>
                  <span 
                    v-else-if="fileObj.status === 'uploading'"
                    class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    上传中
                  </span>
                  <span 
                    v-else-if="fileObj.status === 'error'"
                    class="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  >
                    失败
                  </span>
                  <span
                    v-else
                    class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
                  >
                    等待
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-[#1C1C1E] border-t border-gray-200 dark:border-[#3A3A3C]">
            <button 
              @click="closeVideoUploadModal"
              class="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#3A3A3C] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] transition font-medium"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Delete Confirmation Modal -->
    <teleport to="body">
      <div 
        v-if="showDeleteConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click="closeDeleteConfirm"
      >
        <div 
          class="bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          @click.stop
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#3A3A3C]">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">确认删除</h3>
            <button 
              @click="closeDeleteConfirm"
              class="p-2 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg transition"
            >
              <fa :icon="['fas', 'xmark']" class="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <fa :icon="['fas', 'exclamation-triangle']" class="text-red-600 dark:text-red-400 text-xl" />
              </div>
              <div class="flex-1">
                <p class="text-gray-900 dark:text-white font-medium mb-2">
                  确定要删除这个视频吗?
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {{ videoToDelete?.label }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  此操作无法撤销,视频文件将被永久删除。
                </p>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-[#1C1C1E] border-t border-gray-200 dark:border-[#3A3A3C]">
            <button 
              @click="closeDeleteConfirm"
              class="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#3A3A3C] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] transition font-medium"
            >
              取消
            </button>
            <button 
              @click="confirmDeleteVideo"
              class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition font-medium"
            >
              <fa :icon="['fas', 'trash']" class="mr-2" />
              确认删除
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>


<style scoped>
/* Custom scrollbar for script editor */
textarea::-webkit-scrollbar {
  width: 8px;
}
textarea::-webkit-scrollbar-track {
  background: transparent;
}
textarea::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 4px;
}
textarea::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.8);
}

/* Toast animation */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>
