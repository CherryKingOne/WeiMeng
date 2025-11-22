<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const projectId = route.query.id

const activeTab = ref('script')
const scriptMode = ref('selection') // 'selection', 'write', 'upload'
const tabs = [
  { id: 'script', label: '剧本创作', icon: 'book' },
  { id: 'characters', label: '角色一致性', icon: 'users' },
  { id: 'storyboard', label: '分镜生成', icon: 'clapperboard' },
  { id: 'video', label: '视频生成', icon: 'video' }
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

const generateImage = (shot) => {
  shot.generatedImage = true
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
  storyboards.value.forEach(s => generateImage(s))
}

const generateAllVideos = () => {
  storyboards.value.forEach(s => generateVideo(s))
}

const openActionMenuId = ref(null)
const toggleActionMenu = (id) => {
  openActionMenuId.value = openActionMenuId.value === id ? null : id
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
const uploadedFiles = ref([])

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

const handleDrop = (event) => {
  event.preventDefault()
  isDragging.value = false
  
  const files = event.dataTransfer.files
  if (files && files.length > 0) {
    // Process all dropped files
    Array.from(files).forEach(file => processFile(file))
  }
}

const processFile = (file) => {
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
  const fileData = {
    file: file,
    chunks: 0, // Initially 0, will be calculated during processing
    progress: 'processing', // 'processing', 'completed', 'error'
    processedChunks: 0
  }
  uploadedFiles.value.push(fileData)
  
  // Simulate file processing
  simulateFileProcessing(fileData)
}

const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1)
}

const simulateFileProcessing = (fileData) => {
  // Calculate chunks when processing starts
  const totalChunks = Math.ceil(fileData.file.size / (1024 * 100)) // 100KB per chunk
  let processed = 0
  
  const interval = setInterval(() => {
    processed++
    fileData.processedChunks = processed
    
    if (processed >= totalChunks) {
      fileData.progress = 'completed'
      fileData.chunks = totalChunks // Only set chunks count when completed
      clearInterval(interval)
    }
  }, 500) // Process one chunk every 500ms
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
const visibleFiles = computed(() => uploadedFiles.value.map((file, idx) => ({ file, idx })))
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


onMounted(() => {
  // Initialize theme based on system or storage if needed
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
            霸道总裁爱上我
            <span class="px-1.5 py-0.5 rounded text-[10px] bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500">剧本创作中</span>
          </h1>
          <span class="text-xs text-secondary dark:text-gray-500">上次保存: 10分钟前</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button class="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-brand-green to-emerald-500 text-white rounded-full text-sm font-medium hover:opacity-90 transition shadow-sm">
          <fa :icon="['fas', 'wand-magic-sparkles']" />
          AI Copilot
        </button>
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
      <aside class="w-64 bg-white dark:bg-[#2C2C2E] border-r border-gray-200 dark:border-[#3A3A3C] flex flex-col shrink-0">
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
              @drop="handleDrop"
            >
              <fa :icon="['fas', 'file-import']" class="text-4xl mb-4" :class="isDragging ? 'text-brand-green' : 'text-gray-300 dark:text-gray-600'" />
              <p class="text-lg font-medium text-primary dark:text-white mb-2">
                {{ isDragging ? '释放以上传文件' : '点击或拖拽文件到此处' }}
              </p>
              <p class="text-sm text-secondary dark:text-gray-400">支持 .txt, .md, .doc, .docx, .csv, .xlsx, .pdf (最大 10MB)</p>
            </div>
            
            <!-- Uploaded Files List (Horizontal Cards) -->
            <div v-if="uploadedFiles.length > 0" class="space-y-3">
              <div 
                v-for="(fileData, index) in uploadedFiles" 
                :key="index"
                class="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#2C2C2E] rounded-xl border-2 border-red-500 shadow-sm"
              >
                <!-- File Name -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ fileData.file.name }}</p>
                </div>

                <!-- Text Chunks -->
                <div class="mx-4 px-4 py-1.5 bg-gray-100 dark:bg-[#3A3A3C] rounded-full border border-gray-300 dark:border-[#48484A]">
                  <p class="text-xs font-medium text-gray-700 dark:text-gray-300">文本分割数: {{ fileData.chunks }}</p>
                </div>

                <!-- Processing Status -->
                <div 
                  class="mx-4 px-6 py-1.5 rounded-full border-2"
                  :class="fileData.progress === 'completed' 
                    ? 'bg-brand-green/10 border-brand-green text-brand-green' 
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400'"
                >
                  <p class="text-xs font-medium">
                    {{ fileData.progress === 'completed' ? '处理完成' : `处理中 ${fileData.processedChunks}/${fileData.chunks}` }}
                  </p>
                </div>

                <!-- Delete Button -->
                <button 
                  @click="removeFile(index)" 
                  class="ml-4 px-4 py-1.5 rounded-full border-2 border-yellow-500 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                >
                  <span class="text-xs font-medium">删除</span>
                </button>
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

        <!-- Characters View -->
        <div v-else-if="activeTab === 'characters'" class="max-w-6xl mx-auto">
          <div class="flex items-center justify-between mb-6">
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
        <div v-else-if="activeTab === 'storyboard'" class="max-w-6xl mx-auto">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-4">
              <h2 class="text-xl font-bold">分镜预览</h2>
              <div class="flex items-center gap-2">
                <button @click="storyboardView='compact'" class="px-3 py-1.5 text-sm rounded border bg-white dark:bg-[#2C2C2E] dark:border-[#3A3A3C] text-secondary hover:border-gray-300" :class="storyboardView==='compact' ? 'border-gray-500' : ''">缩写</button>
                <button @click="storyboardView='detail'" class="px-3 py-1.5 text-sm rounded border bg-white dark:bg-[#2C2C2E] dark:border-[#3A3A3C] text-secondary hover:border-gray-300" :class="storyboardView==='detail' ? 'border-gray-500' : ''">详情</button>
              </div>
            </div>
            <div class="flex gap-2">
              <button @click="generateAllImages" class="px-4 py-2 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition">
                一键生成图片
              </button>
              <button @click="generateAllVideos" class="px-4 py-2 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition">
                一键生成视频
              </button>
              <button class="px-4 py-2 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition">
                重新生成
              </button>
              <button @click="exportStoryboardTable" class="px-4 py-2 bg-brand-green text-white rounded-lg text-sm hover:bg-brand-green-dark transition">
                导出分镜表
              </button>
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
          <div v-else class="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="text-left bg-gray-50 dark:bg-[#1C1C1E]">
                  <th class="px-4 py-2 border-b dark:border-[#3A3A3C]">镜号</th>
                  <th class="px-4 py-2 border-b dark:border-[#3A3A3C]">场景</th>
                  <th class="px-4 py-2 border-b dark:border-[#3A3A3C]">景别</th>
                  <th class="px-4 py-2 border-b dark:border-[#3A3A3C]">镜头</th>
                  <th class="px-4 py-2 border-b dark:border-[#3A3A3C]">时长</th>
                  <th class="px-4 py-2 border-b dark:border-[#3A3A3C]">画面描述</th>
                  <th class="px-4 py-2 border-b dark:border-[#3A3A3C]">对白/旁白</th>
                  <th class="px-4 py-2 border-b dark:border-[#3A3A3C]">音效/音乐</th>
                  <th class="px-4 py-2 border-b dark:border-[#3A3A3C]">图片提示词</th>
                  <th class="px-4 py-2 border-b dark:border-[#3A3A3C]">视频提示词</th>
                  <th class="px-4 py-2 border-b dark:border-[#3A3A3C]">生成图片</th>
                  <th class="px-4 py-2 border-b dark:border-[#3A3A3C]">生成视频</th>
                  <th class="px-4 py-2 border-b dark:border-[#3A3A3C]">操作</th>
                  <th class="px-4 py-2 border-b dark:border-[#3A3A3C]">备注</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="shot in storyboards" :key="shot.id" class="border-t dark:border-[#3A3A3C]">
                  <td class="px-4 py-2">{{ shot.id }}</td>
                  <td class="px-4 py-2">{{ shot.scene }}</td>
                  <td class="px-4 py-2">{{ shot.size }}</td>
                  <td class="px-4 py-2">{{ shot.shot }}</td>
                  <td class="px-4 py-2">{{ shot.duration }}</td>
                  <td class="px-4 py-2">{{ shot.desc }}</td>
                  <td class="px-4 py-2">{{ shot.dialogue }}</td>
                  <td class="px-4 py-2">{{ shot.sound }}</td>
                  <td class="px-4 py-2">
                    <input v-model="shot.imagePrompt" type="text" class="w-full px-2 py-1 border rounded bg-white dark:bg-[#1C1C1E] dark:border-[#3A3A3C]" />
                  </td>
                  <td class="px-4 py-2">
                    <input v-model="shot.videoPrompt" type="text" class="w-full px-2 py-1 border rounded bg-white dark:bg-[#1C1C1E] dark:border-[#3A3A3C]" />
                  </td>
                  <td class="px-4 py-2">
                    <div class="w-32 h-20 bg-gray-100 dark:bg-[#3A3A3C] rounded flex items-center justify-center overflow-hidden">
                      <img v-if="shot.generatedImage && shot.img" :src="shot.img" class="w-full h-full object-cover" alt="图片预览">
                      <button v-else @click="generateImage(shot)" class="px-3 py-1 text-xs rounded bg-brand-green text-white hover:bg-brand-green-dark">生成图片</button>
                    </div>
                  </td>
                  <td class="px-4 py-2">
                    <div class="w-32 h-20 bg-gray-100 dark:bg-[#3A3A3C] rounded flex items-center justify-center overflow-hidden">
                      <div v-if="shot.generatedVideo" class="text-xs text-secondary dark:text-gray-300">已生成</div>
                      <button v-else @click="generateVideo(shot)" class="px-3 py-1 text-xs rounded bg-brand-green text-white hover:bg-brand-green-dark">生成视频</button>
                    </div>
                  </td>
                  <td class="px-4 py-2">
                    <div class="relative inline-block">
                      <button @click="toggleActionMenu(shot.id)" class="px-2 py-1 text-xs rounded border bg-white dark:bg-[#2C2C2E] dark:border-[#3A3A3C] hover:bg-gray-50 dark:hover:bg-[#3A3A3C]">
                        <fa :icon="['fas','chevron-down']" />
                      </button>
                      <div v-if="openActionMenuId===shot.id" class="absolute z-10 mt-1 right-0 w-36 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded shadow">
                        <button @click="regenerateImage(shot)" class="block w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-[#3A3A3C]">重新生成图片</button>
                        <button @click="regenerateVideo(shot)" class="block w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-[#3A3A3C]">重新生成视频</button>
                        <button @click="removeShot(shot.id)" class="block w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-gray-50 dark:hover:bg-[#3A3A3C]">删除</button>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-2">{{ shot.notes }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Video View -->
        <div v-else-if="activeTab === 'video'" class="h-full flex flex-col items-center justify-center text-center">
          <div class="w-24 h-24 bg-gray-100 dark:bg-[#2C2C2E] rounded-full flex items-center justify-center mb-6">
            <fa :icon="['fas', 'film']" class="text-4xl text-gray-300 dark:text-gray-600" />
          </div>
          <h3 class="text-xl font-bold mb-2">视频生成中</h3>
          <p class="text-secondary dark:text-gray-400 max-w-md mb-8">
            AI 正在根据分镜脚本生成视频片段，预计需要 5-10 分钟，请稍候...
          </p>
          <div class="w-64 h-2 bg-gray-200 dark:bg-[#3A3A3C] rounded-full overflow-hidden">
            <div class="h-full bg-brand-green w-1/3 animate-pulse"></div>
          </div>
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
            <!-- Step 1: Select Script Segments -->
            <div v-if="extractStep === 1" class="space-y-4">
              <!-- Tab-like buttons -->
              <div class="flex gap-6 border-b border-gray-200 dark:border-[#3A3A3C]">
                <span class="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">全部</span>
                <span class="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">剧本</span>
              </div>

              <div :class="visibleFiles.length>0 ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'grid grid-cols-1 gap-6'">
                <!-- Files column -->
                <div v-if="visibleFiles.length > 0">
                  <div v-if="visibleFiles.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
                    <div v-for="it in visibleFiles" :key="it.idx" class="flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-[#2C2C2E] dark:border-[#3A3A3C]">
                      <div class="flex items-center gap-3 min-w-0">
                        <fa :icon="['fas','file']" class="text-secondary" />
                        <span class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ it.file.file.name }}</span>
                      </div>
                      <div class="text-xs text-secondary">{{ it.file.progress==='completed' ? '已处理' : '处理中' }}</div>
                    </div>
                  </div>
                </div>

                <!-- Script segments column -->
                <div>
                  <div v-if="visibleSegments.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
                    <label 
                      v-for="item in visibleSegments" 
                      :key="item.seg.id"
                      class="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
                    :class="item.seg.selected 
                      ? 'border-gray-400 bg-gray-50 dark:bg-gray-800/20' 
                      : 'border-gray-200 dark:border-[#3A3A3C] hover:border-gray-300'"
                    >
                      <input 
                        type="checkbox" 
                        :checked="item.seg.selected"
                        @change="toggleSegmentSelected(item.idx)"
                      class="mt-0.5 w-4 h-4 text-gray-600 rounded border-gray-300 focus:ring-gray-600"
                      />
                      <span class="flex-1 text-sm text-gray-800 dark:text-gray-200">{{ item.seg.text }}</span>
                    </label>
                  </div>
                  <div v-else class="text-center py-8 text-gray-400">暂无剧本内容，请先在剧本创作中编写或上传剧本</div>

                  <!-- Select All -->
                  <label 
                    v-if="visibleSegments.length > 0"
                    class="flex items-center gap-2 cursor-pointer"
                  >
                    <input 
                      type="checkbox" 
                      :checked="selectAll"
                      @change="toggleSelectAll"
                    class="w-4 h-4 text-gray-600 rounded border-gray-300 focus:ring-gray-600"
                    />
                    <span class="text-sm font-medium text-gray-600">全选</span>
                  </label>
                </div>
              </div>
              
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
                提炼角色
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
</style>
