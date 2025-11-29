<script setup>
import { ref, onMounted, onBeforeUnmount, computed, reactive, watch } from 'vue'
import JSZip from 'jszip'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import ModelSelector from '@/components/ModelSelector.vue'

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: true,
  mangle: false
})

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

const activeTab = ref('files')

// 提示条状态
const showBanner = ref(false)
const bannerMessage = ref('')
const bannerType = ref('info') // 'info', 'warning', 'error', 'success'

const tabs = [
  { id: 'files', label: '剧本文件管理', icon: 'folder' },
  { id: 'novelAnalysis', label: '小说拆解', icon: 'book-open' },
  { id: 'storyboard', label: '分镜生成', icon: 'clapperboard' },
  { id: 'videoAssets', label: '视频素材管理', icon: 'film', badge: 'Beta' },
  { id: 'audioAssets', label: '音频素材管理', icon: 'music', badge: 'Beta' },
  { id: 'video', label: '视频剪辑', icon: 'scissors', badge: 'Beta' },
  { id: 'publish', label: '多平台管理', icon: 'share-nodes', badge: 'Beta' }
]

// 发布管理子标签页状态
const publishSubTab = ref('overview') // 'overview', 'platforms', 'messages', 'violations', 'aiService', 'competitors'

// 切换标签页时的处理
const switchTab = (tabId) => {
  // 如果切换到视频剪辑标签,显示开发中提示,不切换标签
  if (tabId === 'video') {
    showBanner.value = true
    bannerMessage.value = '自动化剪辑Agent正在开发中，暂时无法使用'
    bannerType.value = 'warning'
    return // 阻止标签切换
  }

  // 如果切换到视频素材管理标签,显示开发中提示,不切换标签
  if (tabId === 'videoAssets') {
    showBanner.value = true
    bannerMessage.value = '视频素材管理功能配合视频剪辑使用，正在开发中'
    bannerType.value = 'warning'
    return // 阻止标签切换
  }

  // 如果切换到音频素材管理标签,显示开发中提示,不切换标签
  if (tabId === 'audioAssets') {
    showBanner.value = true
    bannerMessage.value = '音频素材管理功能配合视频剪辑使用，正在开发中'
    bannerType.value = 'warning'
    return // 阻止标签切换
  }

  // 如果切换到多平台发布管理标签,显示开发中提示,不切换标签
  if (tabId === 'publish') {
    showBanner.value = true
    bannerMessage.value = '多平台发布管理功能正在开发中，暂时无法使用'
    bannerType.value = 'warning'
    return // 阻止标签切换
  }

  // 正常切换标签
  activeTab.value = tabId
  showBanner.value = false
}

// 切换发布管理子标签页
const switchPublishSubTab = (subTab) => {
  publishSubTab.value = subTab
}

const scriptContent = ref('[场景] 豪华办公室，白天\n顾北辰：（冷冷地）这份设计稿重做。\n苏晚晚：（坚定地）我会重新来过。\n旁白：两人的眼神交错，空气凝固。\nJohn: You should reconsider.\nMary: I won\'t.')

// Novel Analysis Data
const novelChapters = ref([])
const loadingChapters = ref(false)

const selectedChapter = ref(null)
const analysisTab = ref('characters') // 'characters', 'scenes', 'plots', 'dialogues'

// Analysis Result
const analysisResult = ref('')
const isAnalyzing = ref(false)
const analysisError = ref('')

// System Prompt
const showSystemPromptModal = ref(false)
const systemPrompt = ref('')
const systemPromptType = ref('preset') // 'preset' or 'custom'
const presetSystemPrompt = `# Role: AIGC 影视级分镜导演 & 提示词专家

## Profile
你是一位拥有丰富经验的影视动画导演，擅长将文字小说转化为高质量的 AIGC 视频分镜脚本。你精通镜头语言、视觉叙事、节奏把控，并熟练掌握 Midjourney (文生图) 和 Runway/Pika (图生视频) 的提示词编写技巧。

## Task
你的任务是将用户提供的【小说章节文本】，改编并输出为一份**高度详细、时长达标**的【AIGC 视频分镜头脚本表格】。

## Rules & Constraints (核心要求)

1.  **时长强制拓展 (Time Dilation)**:
    *   **核心目标**：2000字左右的文本必须转化为**不低于 20-23 分钟**的视频内容。
    *   **拓展原则**：严禁流水账。原文的一句话（如"两人打了起来"），你必须将其拆解为 10-20 个分镜（起势、特写、光效、慢动作、周围环境反应、破坏效果等）。
    *   **内容配比**：**40% 还原原著剧情，60% 原创视觉填充**。你需要脑补环境渲染、人物微表情、无台词的意境空镜、战斗特效细节等。

2.  **人物与美术设定 (Pre-Production)**:
    *   在输出表格前，必须先提取并构思人物形象（外貌、衣着、配饰）、场景风格、光影基调。

3.  **镜头语言 (Cinematography)**:
    *   灵活使用景别（远景、全景、中景、特写、大特写）。
    *   丰富的运镜（推、拉、摇、移、跟、升降、希区柯克变焦等）。
    *   **打斗/高潮戏**：必须通过多角度回放、慢动作（Bullet time）、粒子特效特写来拉长时长并增强视觉冲击力。

4.  **提示词编写 (Prompt Engineering)**:
    *   **文生图 (MJ/SD)**：必须包含主体、环境、光照、风格（如 Cyberpunk, Xianxia, Unreal Engine 5 render, 8k, Cinematic lighting）、构图词。
    *   **图生视频 (Runway/SVD)**：必须包含具体的运动指令（Pan right, Zoom in, Slow motion, Explosion effects）。

5.  **视觉风格设定 (Art Style)**:
    *   **2D 日漫动漫风格**：采用日式动画美学，包括：
        *   人物特征：大眼睛、精致五官、动态发型、流畅线条
        *   色彩处理：饱和度高、赛璐璐阴影、高光明确
        *   画面质感：anime style, 2D animation, Japanese anime aesthetic, cel shading
        *   参考风格：鬼灭之刃、进击的巨人、咒术回战等主流日漫
    *   **国漫风格参考**：
        *   可参考《一人之下》的视觉风格：写实与夸张结合、中国传统元素融合、武侠动作设计
        *   关键词：Chinese anime style, martial arts aesthetic, traditional Chinese elements

## Workflow (工作流程)

请严格按照以下步骤进行思考和输出：

### <Phase_1: Analysis> (分析与设定)
在生成表格前，先输出一段 markdown 分析：
*   **人物设定卡**：列出登场人物的详细视觉特征（发色、发型、服饰材质、随身武器/道具）。
*   **场景氛围**：定义本章的主要色调、光影风格（如：阴郁的蓝调、热血的橙红光效）。
*   **时长估算策略**：简述你将如何把本章内容拓展到目标时长（例如：增加 3 分钟的环境空镜，5 分钟的打斗慢镜头解析）。

### <Phase_2: Storyboard_Generation> (脚本生成)
按照用户指定的表格格式输出。

**分镜填写指南：**
*   **时长 (duration)**：每个镜头的时长需合理，打斗动作可设置为 2-3 秒，环境渲染可设置为 5-8 秒。
*   **画面内容 (visualContent)**：不仅仅复述小说，要描写画面构成（例："镜头低角度仰拍，主角的靴子踏碎地面的水洼，水花四溅，背景是燃烧的废墟"）。
*   **文生图提示词 (text2imgPrompt)**：
    *   positive: 数组格式，包含主体描述、环境、光照、风格修饰词、技术参数
    *   negative: 数组格式，包含需要避免的元素（如 "低质量:1.4", "模糊", "变形", "丑陋", "水印"）
*   **图生视频提示词 (img2videoPrompt)**：
    *   positive: 数组格式，描述具体的运动指令和动作
    *   negative: 数组格式，包含需要避免的运动效果（如 "静止", "模糊", "抖动", "变形"）

## Output Format (输出格式)

**⚠️ 重要：必须严格按照以下 JSON 格式输出，不得遗漏任何字段！**

**输出步骤：**
1. 首先输出 Phase 1 的人物与场景设定分析（Markdown 格式）
2. 然后输出完整的 JSON 格式分镜脚本

**JSON 格式要求：**

\`\`\`json
{
  "title": "[小说标题/章节] - AIGC 深度分镜脚本",
  "shots": [
    {
      "id": 1,
      "shotType": "全景",
      "cameraMove": "推镜",
      "visualContent": "夕阳下的城市天际线，车流形成光轨",
      "audio": "底噪城市环境声＋轻微风声",
      "duration": 3,
      "remark": "需匹配片头 LOGO 出现节奏",
      "text2imgPrompt": {
        "positive": [
          "夕阳下的城市天际线",
          "车流光轨",
          "暖色高光，胶片质感",
          "8K, ultra sharp, cinematic"
        ],
        "negative": [
          "低质量:1.4",
          "模糊",
          "变形",
          "丑陋",
          "水印"
        ]
      },
      "img2videoPrompt": {
        "positive": [
          "镜头缓慢推近",
          "车流光轨移动",
          "云层微动"
        ],
        "negative": [
          "静止",
          "模糊",
          "抖动",
          "变形"
        ]
      },
      "generatedImage": "",
      "generatedVideo": "",
      "description": "夕阳下的城市全景，车流光轨交织，镜头缓慢推近，营造宏大开场氛围"
    },
    {
      "id": 2,
      "shotType": "特写",
      "cameraMove": "固定",
      "visualContent": "主角眼睛特写，瞳孔中映出城市灯光",
      "audio": "心跳声＋低频环境音",
      "duration": 2,
      "remark": "强调主角内心状态",
      "text2imgPrompt": {
        "positive": [
          "anime style character close-up",
          "detailed eyes reflecting city lights",
          "dramatic lighting",
          "cinematic composition",
          "8K, high detail"
        ],
        "negative": [
          "low quality:1.4",
          "blurry",
          "deformed eyes",
          "ugly"
        ]
      },
      "img2videoPrompt": {
        "positive": [
          "subtle eye movement",
          "light reflection shifting",
          "slow blink"
        ],
        "negative": [
          "static",
          "no movement",
          "blurred"
        ]
      },
      "generatedImage": "",
      "generatedVideo": "",
      "description": "主角眼睛特写，瞳孔中映出城市灯光，表现内心的决心与渴望"
    }
  ]
}
\`\`\`

**JSON 字段说明：**
- **title**: 脚本标题
- **shots**: 分镜数组，包含所有镜头
  - **id**: 镜头编号（从 1 开始递增）
  - **shotType**: 景别（远景/全景/中景/特写/大特写）
  - **cameraMove**: 运镜方式（推/拉/摇/移/跟/升降/固定/希区柯克变焦等）
  - **visualContent**: 详细的画面内容描述
  - **audio**: 音频描述（对白/音效/背景音乐）
  - **duration**: 镜头时长（秒）
  - **remark**: 备注说明
  - **text2imgPrompt**: 文生图提示词对象
    - **positive**: 正向提示词数组（英文）
    - **negative**: 反向提示词数组（英文）
  - **img2videoPrompt**: 图生视频提示词对象
    - **positive**: 正向运动提示词数组（英文）
    - **negative**: 反向运动提示词数组（英文）
  - **generatedImage**: 生成的图片 URL（留空）
  - **generatedVideo**: 生成的视频 URL（留空）
  - **description**: 镜头的整体描述

---`

// Result Preview Modal
const showResultPreviewModal = ref(false)

// JSON Preview Modal
const showJsonPreview = ref(false)

// View Mode Toggle (JSON or Table)
const resultViewMode = ref('markdown') // 'markdown' or 'table'

// Storyboard Save State
const isSavingStoryboard = ref(false)
const saveStoryboardError = ref('')

// Parse JSON from analysis result
const parsedJsonData = computed(() => {
  if (!analysisResult.value) return null

  try {
    // Try to extract JSON from markdown code blocks (greedy match to get the largest JSON block)
    const jsonMatch = analysisResult.value.match(/```json\s*([\s\S]*?)\s*```/g)
    if (jsonMatch && jsonMatch.length > 0) {
      // Try each matched code block, starting from the largest one
      const blocks = jsonMatch.map(block => block.replace(/```json\s*|\s*```/g, '').trim())

      // Sort by length (largest first) to prioritize complete JSON objects
      blocks.sort((a, b) => b.length - a.length)

      for (const block of blocks) {
        try {
          const parsed = JSON.parse(block)
          // Check if it has the expected structure (shots array)
          if (parsed && typeof parsed === 'object') {
            console.log('【JSON解析】成功解析 JSON 代码块:', parsed)
            return parsed
          }
        } catch (e) {
          // Try next block
          continue
        }
      }
    }

    // Try to parse the entire result as JSON
    const parsed = JSON.parse(analysisResult.value)
    console.log('【JSON解析】成功解析完整 JSON:', parsed)
    return parsed
  } catch (e) {
    console.log('【JSON解析】无法解析 JSON:', e)
    console.log('【JSON解析】原始内容前500字符:', analysisResult.value.substring(0, 500))
    console.log('【JSON解析】找到的代码块数量:', (analysisResult.value.match(/```json/g) || []).length)
    return null
  }
})

// Syntax highlight JSON
const highlightedJson = computed(() => {
  if (!parsedJsonData.value) return ''

  const json = JSON.stringify(parsedJsonData.value, null, 2)

  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'text-orange-500' // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-blue-600 dark:text-blue-400' // key
        } else {
          cls = 'text-green-600 dark:text-green-400' // string
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-purple-600 dark:text-purple-400' // boolean
      } else if (/null/.test(match)) {
        cls = 'text-red-600 dark:text-red-400' // null
      }
      return `<span class="${cls}">${match}</span>`
    })
})

// Rendered Markdown
const renderedMarkdown = computed(() => {
  if (!analysisResult.value) return ''
  return marked.parse(analysisResult.value)
})

// Storyboard data - loaded from backend
const storyboardShots = ref([]) // List of shots with metadata
const selectedShot = ref(null) // Currently selected shot
const storyboards = ref([]) // Parsed storyboard shots from selected shot
const isLoadingStoryboards = ref(false)

// Load storyboard shots from backend
const loadStoryboardScripts = async () => {
  if (!projectId) return

  try {
    isLoadingStoryboards.value = true
    const token = localStorage.getItem('accessToken')

    const response = await fetch(`${API_BASE}/api/v4/shot/list?library_id=${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.log('【分镜加载】没有找到分镜数据')
        storyboardShots.value = []
        return
      }
      throw new Error(`加载失败: ${response.status}`)
    }

    const result = await response.json()
    console.log('【分镜加载】成功:', result)

    if (result.code === 200 && result.data) {
      storyboardShots.value = result.data

      // Auto-select first shot if available
      if (storyboardShots.value.length > 0 && !selectedShot.value) {
        selectShot(storyboardShots.value[0])
      }
    }
  } catch (error) {
    console.error('【分镜加载】错误:', error)
    showToastMessage('加载分镜列表失败: ' + error.message, 'error')
  } finally {
    isLoadingStoryboards.value = false
  }
}

// Select a shot and load its content
const selectShot = async (shot) => {
  // If clicking the same shot, deselect it and clear storyboards
  if (selectedShot.value?.shot_uuid === shot.shot_uuid) {
    selectedShot.value = null
    storyboards.value = []
    console.log('【分镜选择】取消选择')
    return
  }

  // Otherwise, select the new shot and load its content
  selectedShot.value = shot
  await loadShotContent(shot.shot_uuid)
}

// Load shot content by UUID
const loadShotContent = async (shotUuid) => {
  if (!shotUuid) return

  try {
    const token = localStorage.getItem('accessToken')

    const response = await fetch(`${API_BASE}/api/v4/shot?shot_uuid=${shotUuid}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`加载失败: ${response.status}`)
    }

    const result = await response.json()
    console.log('【分镜内容加载】成功:', result)

    if (result.code === 200 && result.data) {
      // Backend returns 'content' field (alias for 'text')
      const contentText = result.data.content || result.data.text
      if (contentText) {
        parseStoryboardContent(contentText)
      } else {
        console.log('【分镜内容加载】没有内容数据')
        storyboards.value = []
      }
    } else {
      console.log('【分镜内容加载】没有内容数据')
      storyboards.value = []
    }
  } catch (error) {
    console.error('【分镜内容加载】错误:', error)
    showToastMessage('加载分镜内容失败: ' + error.message, 'error')
    storyboards.value = []
  }
}

// Parse storyboard JSON content into display format
const parseStoryboardContent = (jsonText) => {
  try {
    const data = JSON.parse(jsonText)

    if (!data.shots || !Array.isArray(data.shots)) {
      console.warn('【分镜解析】没有找到 shots 数组')
      storyboards.value = []
      return
    }

    // Transform backend data to display format
    storyboards.value = data.shots.map(shot => {
      // 解析图片提示词
      let imagePrompt = '无提示词'
      if (shot.text2imgPrompt) {
        if (Array.isArray(shot.text2imgPrompt.positive)) {
          imagePrompt = shot.text2imgPrompt.positive.join(', ')
        } else if (typeof shot.text2imgPrompt === 'string') {
          imagePrompt = shot.text2imgPrompt
        } else {
          imagePrompt = JSON.stringify(shot.text2imgPrompt)
        }
      } else if (shot.visualContent) {
        // 如果没有专门的提示词,使用视觉内容作为备用
        imagePrompt = shot.visualContent
      } else if (shot.description) {
        // 如果连视觉内容都没有,使用描述
        imagePrompt = shot.description
      }

      // 解析视频提示词
      let videoPrompt = '无提示词'
      if (shot.img2videoPrompt) {
        if (Array.isArray(shot.img2videoPrompt.positive)) {
          videoPrompt = shot.img2videoPrompt.positive.join(', ')
        } else if (typeof shot.img2videoPrompt === 'string') {
          videoPrompt = shot.img2videoPrompt
        } else {
          videoPrompt = JSON.stringify(shot.img2videoPrompt)
        }
      }

      return {
        id: shot.id,
        scene: shot.visualContent ? shot.visualContent.substring(0, 50) + '...' : '未命名场景',
        size: shot.shotType || '未指定',
        shot: shot.cameraMove || '未指定',
        duration: shot.duration ? `${shot.duration}s` : '0s',
        desc: shot.description || shot.visualContent || '无描述',
        dialogue: shot.audio || '无对白',
        sound: shot.audio || '无音效',
        imagePrompt: imagePrompt,
        videoPrompt: videoPrompt,
        generatedImage: !!shot.generatedImage,
        generatedVideo: !!shot.generatedVideo,
        notes: shot.remark || '无备注',
        img: shot.generatedImage || `https://placehold.co/300x200/333/FFF?text=Scene+${shot.id}`,
        // Keep original data for reference
        originalData: shot
      }
    })

    console.log('【分镜解析】成功解析', storyboards.value.length, '个镜头')
  } catch (error) {
    console.error('【分镜解析】错误:', error)
    showToastMessage('解析分镜数据失败: ' + error.message, 'error')
    storyboards.value = []
  }
}
const storyboardView = ref('detail') // 'compact' | 'detail'

const generateImage = async (shot, w, h) => {
  // 直接使用已经解析好的 imagePrompt 字段
  let prompt = shot.imagePrompt

  console.log(`[图片生成] 镜号 ${shot.id}: 原始提示词数据:`, {
    imagePrompt: shot.imagePrompt,
    originalData: shot.originalData?.text2imgPrompt,
    visualContent: shot.originalData?.visualContent,
    description: shot.originalData?.description
  })

  // 如果提示词为"无提示词"，尝试使用备用字段
  if (!prompt || prompt === '无提示词') {
    // 尝试从原始数据中获取备用提示词
    if (shot.originalData?.visualContent) {
      prompt = shot.originalData.visualContent
      console.log(`[图片生成] 镜号 ${shot.id}: 使用 visualContent 作为提示词`)
    } else if (shot.originalData?.description) {
      prompt = shot.originalData.description
      console.log(`[图片生成] 镜号 ${shot.id}: 使用 description 作为提示词`)
    } else if (shot.desc && shot.desc !== '无描述') {
      prompt = shot.desc
      console.log(`[图片生成] 镜号 ${shot.id}: 使用 desc 作为提示词`)
    }
  }

  // 最终检查：如果还是没有有效的提示词，显示错误
  if (!prompt || prompt === '无提示词') {
    console.error(`[图片生成] 镜号 ${shot.id}: 没有任何可用的提示词，无法生成图片`)
    showToastMessage(`镜号 ${shot.id} 没有可用的提示词，无法生成图片`, 'error')
    return
  }

  // 获取选中的图像模型配置 ID
  if (!selectedImageModel.value) {
    console.error(`[图片生成] 镜号 ${shot.id}: 未选择图像模型`)
    showToastMessage('请先选择图像生成模型', 'error')
    return
  }

  // 查找模型的 config_id
  const imageModel = availableImageModels.value.find(m => m.model_name === selectedImageModel.value)

  console.log(`[图片生成] 镜号 ${shot.id}: 查找模型配置`)
  console.log(`[图片生成] 选中的模型名称: ${selectedImageModel.value}`)
  console.log(`[图片生成] 可用的图像模型列表:`, availableImageModels.value)
  console.log(`[图片生成] 找到的模型配置:`, imageModel)

  if (!imageModel || !imageModel.config_id) {
    console.error(`[图片生成] 镜号 ${shot.id}: 未找到模型配置 ID`)
    showToastMessage('模型配置错误，请重新选择', 'error')
    return
  }

  // 构建尺寸字符串
  const size = w && h ? `${w}x${h}` : '1024x1024'

  console.log(`[图片生成] ========== 开始生成 ==========`)
  console.log(`[图片生成] 镜号: ${shot.id}`)
  console.log(`[图片生成] 提示词: ${prompt}`)
  console.log(`[图片生成] 尺寸: ${size}`)
  console.log(`[图片生成] 模型: ${selectedImageModel.value}`)
  console.log(`[图片生成] Config ID: ${imageModel.config_id}`)
  console.log(`[图片生成] 模型类型: ${imageModel.model_type}`)
  console.log(`[图片生成] Base URL: ${imageModel.base_url}`)

  // 标记为生成中
  shot.generatingImage = true

  try {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      console.error(`[图片生成] 镜号 ${shot.id}: 未找到 token`)
      showToastMessage('请先登录', 'error')
      return
    }

    const requestBody = {
      config_id: imageModel.config_id,
      prompt: prompt,
      size: size
    }

    console.log(`[图片生成] 镜号 ${shot.id}: 请求体:`, JSON.stringify(requestBody, null, 2))

    const response = await fetch(`${API_BASE}/api/v3/chat/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    })

    console.log(`[图片生成] 镜号 ${shot.id}: 响应状态:`, response.status)

    if (response.status === 401) {
      console.error(`[图片生成] 镜号 ${shot.id}: 未授权`)
      router.push('/login')
      return
    }

    if (!response.ok) {
      let errorText = await response.text()
      console.error(`[图片生成] 镜号 ${shot.id}: 请求失败:`, errorText)

      // 尝试解析错误信息
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.detail) {
          errorText = errorJson.detail
        }
      } catch (e) {
        // 如果不是 JSON,使用原始文本
      }

      // 显示更详细的错误信息
      if (response.status === 403) {
        showToastMessage(`权限错误: ${errorText}`, 'error')
      } else if (response.status === 400) {
        showToastMessage(`参数错误: ${errorText}`, 'error')
      } else {
        showToastMessage(`图片生成失败 (${response.status}): ${errorText}`, 'error')
      }
      return
    }

    const data = await response.json()
    console.log(`[图片生成] 镜号 ${shot.id}: 响应数据:`, data)

    if (data.code === 200 && data.data && data.data.images && data.data.images.length > 0) {
      const imageData = data.data.images[0]
      const imageUrl = imageData.url

      console.log(`[图片生成] 镜号 ${shot.id}: ✅ 生成成功!`)
      console.log(`[图片生成] 镜号 ${shot.id}: 图片 URL: ${imageUrl}`)
      console.log(`[图片生成] 镜号 ${shot.id}: 图片对象:`, imageData)
      console.log(`[图片生成] 镜号 ${shot.id}: 耗时: ${data.meta?.duration_ms}ms`)

      // 尝试从响应中获取实际的图片尺寸
      let actualWidth = w
      let actualHeight = h
      let actualSize = size

      // 检查响应中是否包含实际尺寸信息
      if (imageData.width && imageData.height) {
        actualWidth = imageData.width
        actualHeight = imageData.height
        actualSize = `${actualWidth}x${actualHeight}`
        console.log(`[图片生成] 镜号 ${shot.id}: 从响应获取实际尺寸: ${actualSize}`)
      } else if (imageData.size) {
        actualSize = imageData.size
        const [w, h] = actualSize.split('x').map(Number)
        actualWidth = w
        actualHeight = h
        console.log(`[图片生成] 镜号 ${shot.id}: 从响应获取实际尺寸: ${actualSize}`)
      } else {
        console.warn(`[图片生成] 镜号 ${shot.id}: 响应中没有尺寸信息,将通过加载图片检测实际尺寸`)

        // 通过加载图片来检测实际尺寸,设置5秒超时
        try {
          const img = new Image()
          img.crossOrigin = 'anonymous'

          const loadPromise = new Promise((resolve, reject) => {
            img.onload = () => {
              actualWidth = img.naturalWidth
              actualHeight = img.naturalHeight
              actualSize = `${actualWidth}x${actualHeight}`
              console.log(`[图片生成] 镜号 ${shot.id}: 通过加载图片检测到实际尺寸: ${actualSize}`)
              resolve()
            }
            img.onerror = (error) => {
              console.warn(`[图片生成] 镜号 ${shot.id}: 图片加载失败,使用请求尺寸: ${actualSize}`)
              resolve() // 即使失败也继续,使用请求的尺寸
            }
            img.src = imageUrl
          })

          // 添加5秒超时
          const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => {
              console.warn(`[图片生成] 镜号 ${shot.id}: 图片加载超时(5秒),使用请求尺寸: ${actualSize}`)
              resolve()
            }, 5000)
          })

          // 等待加载完成或超时
          await Promise.race([loadPromise, timeoutPromise])
        } catch (error) {
          console.warn(`[图片生成] 镜号 ${shot.id}: 检测图片尺寸异常:`, error)
        }
      }

      // 只更新当前镜头的图片
      shot.img = imageUrl
      shot.generatedImage = true
      shot.generatingImage = false
      // 保存实际的图片尺寸,供视频生成时使用
      shot.imageSize = actualSize
      shot.imageWidth = actualWidth
      shot.imageHeight = actualHeight

      console.log(`[图片生成] 镜号 ${shot.id}: 保存的尺寸信息: ${actualWidth}x${actualHeight}`)
      showToastMessage(`镜号 ${shot.id} 图片生成成功`, 'success')
    } else {
      console.error(`[图片生成] 镜号 ${shot.id}: 响应格式错误:`, data)
      showToastMessage('图片生成失败: 响应格式错误', 'error')
    }
  } catch (error) {
    console.error(`[图片生成] 镜号 ${shot.id}: 异常:`, error)
    showToastMessage(`图片生成失败: ${error.message}`, 'error')
  } finally {
    shot.generatingImage = false
    console.log(`[图片生成] ========== 结束 ==========`)
  }
}

const generateVideo = async (shot, w, h, duration = '4', ratio = null, resolution = null) => {
  // 直接使用已经解析好的 videoPrompt 字段
  let prompt = shot.videoPrompt

  console.log(`[视频生成] 镜号 ${shot.id}: 原始提示词数据:`, {
    videoPrompt: shot.videoPrompt,
    originalData: shot.originalData?.img2videoPrompt,
    visualContent: shot.originalData?.visualContent,
    description: shot.originalData?.description
  })

  // 如果提示词为"无提示词"，尝试使用备用字段
  if (!prompt || prompt === '无提示词') {
    // 尝试从原始数据中获取备用提示词
    if (shot.originalData?.visualContent) {
      prompt = shot.originalData.visualContent
      console.log(`[视频生成] 镜号 ${shot.id}: 使用 visualContent 作为提示词`)
    } else if (shot.originalData?.description) {
      prompt = shot.originalData.description
      console.log(`[视频生成] 镜号 ${shot.id}: 使用 description 作为提示词`)
    } else if (shot.desc && shot.desc !== '无描述') {
      prompt = shot.desc
      console.log(`[视频生成] 镜号 ${shot.id}: 使用 desc 作为提示词`)
    }
  }

  // 最终检查：如果还是没有有效的提示词，显示错误
  if (!prompt || prompt === '无提示词') {
    console.error(`[视频生成] 镜号 ${shot.id}: 没有任何可用的提示词，无法生成视频`)
    showToastMessage(`镜号 ${shot.id} 没有可用的提示词，无法生成视频`, 'error')
    return
  }

  // 获取选中的视频模型配置 ID
  if (!selectedVideoModel.value) {
    console.error(`[视频生成] 镜号 ${shot.id}: 未选择视频模型`)
    showToastMessage('请先选择视频生成模型', 'error')
    return
  }

  // 查找模型的 config_id
  const videoModel = availableVideoModels.value.find(m => m.model_name === selectedVideoModel.value)

  console.log(`[视频生成] 镜号 ${shot.id}: 查找模型配置`)
  console.log(`[视频生成] 选中的模型名称: ${selectedVideoModel.value}`)
  console.log(`[视频生成] 可用的视频模型列表:`, availableVideoModels.value)
  console.log(`[视频生成] 找到的模型配置:`, videoModel)

  if (!videoModel || !videoModel.config_id) {
    console.error(`[视频生成] 镜号 ${shot.id}: 未找到模型配置 ID`)
    showToastMessage('模型配置错误，请重新选择', 'error')
    return
  }

  // 检测是否为字节跳动模型
  const isDoubao = isDoubaoModel(selectedVideoModel.value)

  // 标记为生成中
  shot.generatingVideo = true

  try {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      console.error(`[视频生成] 镜号 ${shot.id}: 未找到 token`)
      showToastMessage('请先登录', 'error')
      shot.generatingVideo = false
      return
    }

    // 检查是否有已生成的图片作为参考
    if (!shot.img || !shot.generatedImage) {
      console.error(`[视频生成] 镜号 ${shot.id}: 需要先生成图片`)
      showToastMessage(`镜号 ${shot.id} 需要先生成图片才能生成视频`, 'error')
      shot.generatingVideo = false
      return
    }

    console.log(`[视频生成] ========== 开始生成 ==========`)
    console.log(`[视频生成] 镜号: ${shot.id}`)
    console.log(`[视频生成] 提示词: ${prompt}`)
    console.log(`[视频生成] 模型: ${selectedVideoModel.value}`)
    console.log(`[视频生成] 模型类型: ${isDoubao ? '字节跳动' : '通用'}`)
    console.log(`[视频生成] Config ID: ${videoModel.config_id}`)

    // 构建请求体 - 根据模型类型使用不同的格式
    let requestBody

    if (isDoubao) {
      // 字节跳动格式: 使用 ratio + resolution + duration
      requestBody = {
        config_id: videoModel.config_id,
        prompt: prompt,
        input_reference: shot.img,
        ratio: ratio || '16:9',
        resolution: resolution || '720p',
        duration: parseInt(duration)
      }
      console.log(`[视频生成] 字节跳动格式 - Ratio: ${ratio}, Resolution: ${resolution}, Duration: ${duration}秒`)
    } else {
      // 通用格式: 使用 width x height + seconds
      const size = shot.imageSize || `${w}x${h}` || '1280x720'
      requestBody = {
        config_id: videoModel.config_id,
        prompt: prompt,
        input_reference: shot.img,
        seconds: duration,
        size: size
      }
      console.log(`[视频生成] 通用格式 - Size: ${size}, Duration: ${duration}秒`)
    }

    console.log(`[视频生成] 镜号 ${shot.id}: 请求体:`, JSON.stringify(requestBody, null, 2))

    const response = await fetch(`${API_BASE}/api/v3/chat/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    })

    console.log(`[视频生成] 镜号 ${shot.id}: 响应状态:`, response.status)

    if (response.status === 401) {
      console.error(`[视频生成] 镜号 ${shot.id}: 未授权`)
      router.push('/login')
      return
    }

    if (!response.ok) {
      let errorText = await response.text()
      console.error(`[视频生成] 镜号 ${shot.id}: 请求失败:`, errorText)

      // 尝试解析错误信息
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.detail) {
          errorText = errorJson.detail
        }
      } catch (e) {
        // 如果不是 JSON,使用原始文本
      }

      // 显示更详细的错误信息
      if (response.status === 403) {
        showToastMessage(`权限错误: ${errorText}`, 'error')
      } else if (response.status === 400) {
        showToastMessage(`参数错误: ${errorText}`, 'error')
      } else {
        showToastMessage(`视频生成失败 (${response.status}): ${errorText}`, 'error')
      }
      return
    }

    const data = await response.json()
    console.log(`[视频生成] 镜号 ${shot.id}: 响应数据:`, data)

    // 检查是否返回了 task_id (字段名是 task_id 而不是 id)
    if (data.code === 200 && data.data && data.data.task_id) {
      const taskId = data.data.task_id
      console.log(`[视频生成] 镜号 ${shot.id}: 获得任务ID: ${taskId}`)
      console.log(`[视频生成] 镜号 ${shot.id}: 开始轮询任务状态...`)

      // 开始轮询任务状态
      await pollVideoTask(shot, taskId, token)
    } else {
      console.error(`[视频生成] 镜号 ${shot.id}: 响应格式错误，未获得任务ID:`, data)
      showToastMessage('视频生成失败: 未获得任务ID', 'error')
      shot.generatingVideo = false
    }
  } catch (error) {
    console.error(`[视频生成] 镜号 ${shot.id}: 异常:`, error)
    showToastMessage(`视频生成失败: ${error.message}`, 'error')
    shot.generatingVideo = false
  }
}

// 轮询视频生成任务状态
const pollVideoTask = async (shot, taskId, token) => {
  const maxAttempts = 60 // 最多轮询60次
  const pollInterval = 5000 // 每5秒轮询一次
  let attempts = 0

  const checkStatus = async () => {
    attempts++
    console.log(`[视频轮询] 镜号 ${shot.id}: 第 ${attempts} 次检查任务状态...`)

    try {
      const response = await fetch(`${API_BASE}/api/v3/chat/videos/${taskId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        console.error(`[视频轮询] 镜号 ${shot.id}: 查询失败:`, response.status)
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, pollInterval)
        } else {
          showToastMessage(`镜号 ${shot.id} 视频生成超时`, 'error')
          shot.generatingVideo = false
        }
        return
      }

      const data = await response.json()
      console.log(`[视频轮询] 镜号 ${shot.id}: 任务状态:`, data.data?.status)

      if (data.code === 200 && data.data) {
        const status = data.data.status

        if (status === 'succeeded' || status === 'completed') {
          // 任务完成，提取视频URL
          const taskResult = data.data.task_result
          if (taskResult && taskResult.videos && taskResult.videos.length > 0) {
            const video = taskResult.videos[0]
            const videoUrl = video.video_url || video.url

            if (videoUrl) {
              console.log(`[视频轮询] 镜号 ${shot.id}: ✅ 生成成功!`)
              console.log(`[视频轮询] 镜号 ${shot.id}: 视频 URL: ${videoUrl}`)

              // 更新视频 URL
              shot.videoUrl = videoUrl
              shot.generatedVideo = true
              shot.generatingVideo = false

              showToastMessage(`镜号 ${shot.id} 视频生成成功`, 'success')
              console.log(`[视频生成] ========== 结束 ==========`)
            } else {
              console.error(`[视频轮询] 镜号 ${shot.id}: 未找到视频URL`)
              showToastMessage(`镜号 ${shot.id} 视频生成失败: 未找到视频URL`, 'error')
              shot.generatingVideo = false
            }
          } else {
            console.error(`[视频轮询] 镜号 ${shot.id}: 响应中没有视频数据`)
            showToastMessage(`镜号 ${shot.id} 视频生成失败: 没有视频数据`, 'error')
            shot.generatingVideo = false
          }
        } else if (status === 'failed' || status === 'error') {
          // 任务失败,提取错误信息
          const errorInfo = data.data.error
          let errorMessage = '未知错误'

          if (errorInfo) {
            if (errorInfo.message) {
              errorMessage = errorInfo.message
            } else if (typeof errorInfo === 'string') {
              errorMessage = errorInfo
            }
            console.error(`[视频轮询] 镜号 ${shot.id}: 任务失败`)
            console.error(`[视频轮询] 错误代码: ${errorInfo.code || 'N/A'}`)
            console.error(`[视频轮询] 错误信息: ${errorMessage}`)
            console.error(`[视频轮询] 完整错误对象:`, errorInfo)
          } else {
            console.error(`[视频轮询] 镜号 ${shot.id}: 任务失败,无错误详情`)
          }

          // 显示友好的错误提示
          if (errorMessage.includes('must match the requested width and height')) {
            showToastMessage(`镜号 ${shot.id} 视频生成失败: 图片尺寸不匹配`, 'error')
          } else {
            showToastMessage(`镜号 ${shot.id} 视频生成失败: ${errorMessage}`, 'error')
          }

          shot.generatingVideo = false
          console.log(`[视频生成] ========== 结束 ==========`)
        } else {
          // 任务还在进行中，继续轮询
          if (attempts < maxAttempts) {
            console.log(`[视频轮询] 镜号 ${shot.id}: 任务进行中，${pollInterval/1000}秒后再次检查...`)
            setTimeout(checkStatus, pollInterval)
          } else {
            console.error(`[视频轮询] 镜号 ${shot.id}: 轮询超时`)
            showToastMessage(`镜号 ${shot.id} 视频生成超时`, 'error')
            shot.generatingVideo = false
            console.log(`[视频生成] ========== 结束 ==========`)
          }
        }
      } else {
        console.error(`[视频轮询] 镜号 ${shot.id}: 响应格式错误:`, data)
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, pollInterval)
        } else {
          showToastMessage(`镜号 ${shot.id} 视频生成失败`, 'error')
          shot.generatingVideo = false
        }
      }
    } catch (error) {
      console.error(`[视频轮询] 镜号 ${shot.id}: 异常:`, error)
      if (attempts < maxAttempts) {
        setTimeout(checkStatus, pollInterval)
      } else {
        showToastMessage(`镜号 ${shot.id} 视频生成失败: ${error.message}`, 'error')
        shot.generatingVideo = false
      }
    }
  }

  // 开始第一次检查
  checkStatus()
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

// Image preview modal
const showImagePreview = ref(false)
const previewImageUrl = ref('')
const previewImageShot = ref(null)

const openImagePreview = (shot) => {
  if (shot.img && shot.generatedImage) {
    previewImageUrl.value = shot.img
    previewImageShot.value = shot
    showImagePreview.value = true
  }
}

const closeImagePreview = () => {
  showImagePreview.value = false
  previewImageUrl.value = ''
  previewImageShot.value = null
}

// Video preview modal
const showVideoPreview = ref(false)
const previewVideoUrl = ref('')
const previewVideoShot = ref(null)

const openVideoPreview = (shot) => {
  if (shot.videoUrl && shot.generatedVideo) {
    previewVideoUrl.value = shot.videoUrl
    previewVideoShot.value = shot
    showVideoPreview.value = true
  }
}

const closeVideoPreview = () => {
  showVideoPreview.value = false
  previewVideoUrl.value = ''
  previewVideoShot.value = null
}

const showSizeModal = ref(false)
const sizeModalMode = ref('single')
const sizeModalAction = ref('image')
const sizeModalShotId = ref(null)
const selectedRatio = ref('16:9')
const selectedDuration = ref('4') // 视频时长选择

// 检测是否为字节跳动的 doubao 模型
const isDoubaoModel = (modelName) => {
  if (!modelName) return false
  const name = modelName.toLowerCase()
  return name.includes('doubao') || name.includes('seedance')
}

// 图片生成尺寸选项 - 通用格式
const imageRatioOptions = [
  { key: '16:9', w: 1280, h: 720 },
  { key: '9:16', w: 720, h: 1280 }
]

// 字节跳动视频生成尺寸选项 - 使用 ratio + resolution 格式
const doubaoVideoRatioOptions = [
  { key: '16:9', ratio: '16:9', resolution: '720p', label: '16:9 (720p)' },
  { key: '16:9-1080p', ratio: '16:9', resolution: '1080p', label: '16:9 (1080p)' },
  { key: '4:3', ratio: '4:3', resolution: '720p', label: '4:3 (720p)' },
  { key: '1:1', ratio: '1:1', resolution: '720p', label: '1:1 (720p)' },
  { key: '3:4', ratio: '3:4', resolution: '720p', label: '3:4 (720p)' },
  { key: '9:16', ratio: '9:16', resolution: '720p', label: '9:16 (720p)' },
  { key: '9:16-1080p', ratio: '9:16', resolution: '1080p', label: '9:16 (1080p)' },
  { key: '21:9', ratio: '21:9', resolution: '720p', label: '21:9 (720p)' }
]

// 通用视频生成尺寸选项 - 使用 width x height 格式
const genericVideoRatioOptions = [
  { key: '16:9', w: 1280, h: 720 },
  { key: '9:16', w: 720, h: 1280 }
]

// 字节跳动视频时长选项 (2-12秒)
const doubaoVideoDurationOptions = [
  { value: '2', label: '2秒' },
  { value: '4', label: '4秒' },
  { value: '5', label: '5秒' },
  { value: '6', label: '6秒' },
  { value: '8', label: '8秒' },
  { value: '10', label: '10秒' },
  { value: '12', label: '12秒' }
]

// 通用视频时长选项
const genericVideoDurationOptions = [
  { value: '4', label: '4秒' },
  { value: '8', label: '8秒' },
  { value: '12', label: '12秒' }
]

// 根据当前操作类型和选择的模型返回对应的尺寸选项
const ratioOptions = computed(() => {
  console.log('[尺寸选项] 计算 ratioOptions')
  console.log('[尺寸选项] sizeModalAction:', sizeModalAction.value)
  console.log('[尺寸选项] selectedVideoModel:', selectedVideoModel.value)

  if (sizeModalAction.value === 'image') {
    return imageRatioOptions
  } else {
    // 视频生成:根据模型类型返回不同的选项
    const isDoubao = isDoubaoModel(selectedVideoModel.value)
    console.log('[尺寸选项] 是否为字节跳动模型:', isDoubao)
    return isDoubao ? doubaoVideoRatioOptions : genericVideoRatioOptions
  }
})

// 根据选择的模型返回对应的时长选项
const videoDurationOptions = computed(() => {
  const isDoubao = isDoubaoModel(selectedVideoModel.value)
  return isDoubao ? doubaoVideoDurationOptions : genericVideoDurationOptions
})

const sizeInfoVisible = ref(false)
const openSizeModalForShot = (shot, action) => {
  sizeModalMode.value = 'single'
  sizeModalAction.value = action
  sizeModalShotId.value = shot.id
  // 根据操作类型设置默认选中的尺寸
  selectedRatio.value = action === 'video' ? '16:9' : '1:1'
  selectedDuration.value = '4' // 默认4秒
  showSizeModal.value = true
}
const openSizeModalBatch = (action) => {
  sizeModalMode.value = 'batch'
  sizeModalAction.value = action
  sizeModalShotId.value = null
  // 根据操作类型设置默认选中的尺寸
  selectedRatio.value = action === 'video' ? '16:9' : '1:1'
  showSizeModal.value = true
}
const applySizeSelection = () => {
  const opts = ratioOptions.value
  const opt = opts.find(r => r.key === selectedRatio.value)
  if (!opt) { showSizeModal.value = false; return }

  if (sizeModalAction.value === 'image') {
    if (sizeModalMode.value === 'batch') {
      storyboards.value.forEach(s => generateImage(s, opt.w, opt.h))
    } else {
      const s = getShotById(sizeModalShotId.value)
      if (s) generateImage(s, opt.w, opt.h)
    }
  } else {
    // 视频生成需要传递时长参数和尺寸信息
    const duration = selectedDuration.value
    const isDoubao = isDoubaoModel(selectedVideoModel.value)

    if (sizeModalMode.value === 'batch') {
      storyboards.value.forEach(s => {
        if (isDoubao) {
          // 字节跳动格式: 传递 ratio, resolution, duration
          generateVideo(s, null, null, duration, opt.ratio, opt.resolution)
        } else {
          // 通用格式: 传递 width, height, duration
          generateVideo(s, opt.w, opt.h, duration)
        }
      })
    } else {
      const s = getShotById(sizeModalShotId.value)
      if (s) {
        if (isDoubao) {
          // 字节跳动格式: 传递 ratio, resolution, duration
          generateVideo(s, null, null, duration, opt.ratio, opt.resolution)
        } else {
          // 通用格式: 传递 width, height, duration
          generateVideo(s, opt.w, opt.h, duration)
        }
      }
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
  streamingOutput: true,
  temperature: { enabled: true, value: 0.3 },
  reasoningMode: { enabled: false },
  reasoningLimit: { enabled: false, value: 4096 }
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
const loadingModels = ref(false)

const availableModels = ref([])
const availableImageModels = ref([])
const availableVideoModels = ref([])
const selectedImageModel = ref('')
const selectedVideoModel = ref('')
const showImageModelSelector = ref(false)
const showVideoModelSelector = ref(false)

// Get provider icon helper function
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

// Fetch models from API
const fetchModels = async () => {
  console.log('[ModelSelector] Starting to fetch models...')
  loadingModels.value = true
  try {
    const token = localStorage.getItem('accessToken')
    console.log('[ModelSelector] Token retrieved:', token ? 'Yes' : 'No')

    const url = `${API_BASE}/api/v2/model_config/list?page=1&page_size=100&model_type=LLM`
    console.log('[ModelSelector] Request URL:', url)
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
    
    console.log('[ModelSelector] Response status:', response.status)
    
    if (response.status === 401) {
      console.warn('[ModelSelector] Unauthorized, redirecting to login')
      router.push('/login')
      return
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('[ModelSelector] Response data:', data)
    
    if (data.code === 200 && data.data && data.data.list) {
      console.log('[ModelSelector] Models found:', data.data.list.length)
      availableModels.value = data.data.list.map(m => {
        let color = 'text-gray-500'
        const name = m.model_name.toLowerCase()
        if (name.includes('gpt-4')) color = 'text-purple-500'
        else if (name.includes('gpt-3.5')) color = 'text-green-500'
        else if (name.includes('claude')) color = 'text-orange-500'
        else if (m.provider === 'OpenAI') color = 'text-blue-500'

        return {
          id: m.model_name,
          name: m.model_name,
          provider: m.provider,
          config_id: m.config_id || m.id,  // 保存 config_id 用于配置局部模型
          icon: 'robot',
          color: color
        }
      })
      console.log('[ModelSelector] Mapped models:', availableModels.value)
    } else {
      console.warn('[ModelSelector] No models found or invalid format', data)
      availableModels.value = []
    }
  } catch (error) {
    console.error('[ModelSelector] Error fetching models:', error)
    showToastMessage('获取模型列表失败', 'error')
  } finally {
    loadingModels.value = false
    console.log('[ModelSelector] Fetch completed')
  }
}

// Fetch image models from API
const fetchImageModels = async () => {
  console.log('[ImageModels] Starting to fetch image models...')
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    const url = `${API_BASE}/api/v2/model_config/list?page=1&page_size=100&model_type=IMAGE_GENERATION`
    console.log('[ImageModels] Request URL:', url)

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })

    if (response.status === 401) {
      router.push('/login')
      return
    }

    if (!response.ok) return

    const data = await response.json()
    console.log('[ImageModels] Response data:', data)

    if (data.code === 200 && data.data && data.data.list) {
      availableImageModels.value = data.data.list
      // Auto-select first model if none selected
      if (!selectedImageModel.value && data.data.list.length > 0) {
        selectedImageModel.value = data.data.list[0].model_name
      }
      console.log('[ImageModels] Models loaded:', data.data.list.length)
    }
  } catch (error) {
    console.error('[ImageModels] Error fetching models:', error)
  }
}

// Fetch video models from API
const fetchVideoModels = async () => {
  console.log('[VideoModels] Starting to fetch video models...')
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    const url = `${API_BASE}/api/v2/model_config/list?page=1&page_size=100&model_type=VIDEO_GENERATION`
    console.log('[VideoModels] Request URL:', url)

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })

    if (response.status === 401) {
      router.push('/login')
      return
    }

    if (!response.ok) return

    const data = await response.json()
    console.log('[VideoModels] Response data:', data)

    if (data.code === 200 && data.data && data.data.list) {
      availableVideoModels.value = data.data.list
      // Auto-select first model if none selected
      if (!selectedVideoModel.value && data.data.list.length > 0) {
        selectedVideoModel.value = data.data.list[0].model_name
      }
      console.log('[VideoModels] Models loaded:', data.data.list.length)
    }
  } catch (error) {
    console.error('[VideoModels] Error fetching models:', error)
  }
}

const filteredModels = computed(() => {
  if (!modelSearchQuery.value) return availableModels.value
  const query = modelSearchQuery.value.toLowerCase()
  return availableModels.value.filter(model =>
    model.name.toLowerCase().includes(query) ||
    model.provider.toLowerCase().includes(query)
  )
})

const currentModel = computed(() => {
  return availableModels.value.find(m => m.id === aiConfig.value.model) ||
         (availableModels.value.length > 0 ? availableModels.value[0] : { name: aiConfig.value.model, icon: 'robot', color: 'text-gray-500' })
})

// Load effective model (local first, then global)
const loadEffectiveModel = async () => {
  if (!projectId) {
    console.warn('【有效模型】未找到剧本库 ID，跳过加载')
    return
  }

  try {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      console.warn('【有效模型】未找到 token，跳过加载')
      return
    }

    const url = `${API_BASE}/api/v3/chat/libraries/${projectId}/effective-model`
    console.log('【有效模型】开始加载:', url)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    console.log('【有效模型】响应状态:', response.status)

    if (response.status === 401) {
      console.warn('【有效模型】未授权，跳转到登录页')
      router.push('/login')
      return
    }

    // 如果是 404，说明该剧本库还没有配置，尝试加载全局默认模型
    if (response.status === 404) {
      console.warn('【有效模型】该剧本库未配置模型，尝试加载全局默认模型')
      await loadGlobalDefaultModel()
      return
    }

    if (!response.ok) {
      console.error('【有效模型】加载失败，状态码:', response.status)
      return
    }

    const data = await response.json()
    console.log('【有效模型】响应数据:', data)

    if (data.code === 200 && data.data) {
      const effectiveModel = data.data
      const modelType = effectiveModel.is_local ? '局部' : '全局'
      console.log(`【${modelType}】有效模型信息:`, {
        chat_model: effectiveModel.chat_model,
        is_local: effectiveModel.is_local,
        config_id: effectiveModel.config_id
      })

      // 设置当前使用的模型
      if (effectiveModel.chat_model) {
        aiConfig.value.model = effectiveModel.chat_model
        console.log(`【${modelType}】已设置模型:`, effectiveModel.chat_model)
      }
    }
  } catch (error) {
    console.error('【有效模型】加载异常:', error)
    // 出错时尝试加载全局默认模型
    await loadGlobalDefaultModel()
  }
}

// Load global default model
const loadGlobalDefaultModel = async () => {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      console.warn('【全局】未找到 token，跳过加载')
      return
    }

    // 使用固定的 config_id 或从用户配置中获取
    const configId = 'wm63405339065589127630'
    const url = `${API_BASE}/api/v3/chat/default-model?config_id=${configId}`
    console.log('【全局】开始加载全局默认模型:', url)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    console.log('【全局】响应状态:', response.status)

    if (response.status === 401) {
      console.warn('【全局】未授权，跳转到登录页')
      router.push('/login')
      return
    }

    if (!response.ok) {
      console.error('【全局】加载失败，状态码:', response.status)
      return
    }

    const data = await response.json()
    console.log('【全局】响应数据:', data)

    if (data.code === 200 && data.data && data.data.chat_model) {
      aiConfig.value.model = data.data.chat_model
      console.log('【全局】已设置默认模型:', data.data.chat_model)
    }
  } catch (error) {
    console.error('【全局】加载异常:', error)
  }
}

// Configure local model for current library
const configureLocalModel = async (configId) => {
  if (!projectId) {
    console.warn('【局部】未找到剧本库 ID，无法配置')
    showToastMessage('无法配置局部模型', 'error')
    return false
  }

  try {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      console.warn('【局部】未找到 token')
      showToastMessage('请先登录', 'error')
      return false
    }

    const url = `${API_BASE}/api/v3/chat/libraries/${projectId}/local-model`
    const requestBody = { config_id: configId }

    console.log('【局部】开始配置局部模型:', url)
    console.log('【局部】请求体:', requestBody)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    })

    console.log('【局部】响应状态:', response.status)

    if (response.status === 401) {
      console.warn('【局部】未授权，跳转到登录页')
      router.push('/login')
      return false
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('【局部】配置失败:', errorData)
      showToastMessage(errorData.message || '配置局部模型失败', 'error')
      return false
    }

    const result = await response.json()
    console.log('【局部】响应数据:', result)

    if (result.code === 200 || result.success) {
      console.log('【局部】配置成功')
      showToastMessage('局部模型配置成功', 'success')
      // 重新加载有效模型
      await loadEffectiveModel()
      return true
    } else {
      console.error('【局部】配置失败，返回错误:', result.message)
      showToastMessage(result.message || '配置局部模型失败', 'error')
      return false
    }
  } catch (error) {
    console.error('【局部】配置异常:', error)
    showToastMessage('配置局部模型失败，请稍后重试', 'error')
    return false
  }
}

const toggleModelMenu = () => {
  showModelMenu.value = !showModelMenu.value
  if (showModelMenu.value) {
    modelSearchQuery.value = ''
    fetchModels()
  }
}

const selectModel = async (modelId, configId) => {
  console.log('【模型选择】用户选择模型:', modelId, '配置ID:', configId)

  // 先更新 UI 显示
  aiConfig.value.model = modelId
  showModelMenu.value = false
  modelSearchQuery.value = ''

  // 如果有 configId，则配置为局部模型
  if (configId && projectId) {
    console.log('【模型选择】配置为局部模型')
    await configureLocalModel(configId)
  } else {
    console.log('【模型选择】仅更新 UI，不配置局部模型')
  }
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

// Media Library Video Preview Modal
const showMediaVideoPreview = ref(false)
const currentMediaVideoPreview = ref(null)
const mediaVideoPreviewTab = ref('structure')

const openMediaVideoPreview = (media) => {
  currentMediaVideoPreview.value = media
  showMediaVideoPreview.value = true
}

const closeMediaVideoPreview = () => {
  showMediaVideoPreview.value = false
  currentMediaVideoPreview.value = null
  mediaVideoPreviewTab.value = 'structure'
}

const exportVideoJson = () => {
  if (!currentMediaVideoPreview.value) return
  const json = JSON.stringify(currentMediaVideoPreview.value, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${currentMediaVideoPreview.value.label || 'video'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const regenerateImage = (shot) => {
  shot.generatedImage = false
  shot.img = ''
  openActionMenuId.value = null
  openSizeModalForShot(shot, 'image')
}
const regenerateVideo = (shot) => {
  shot.generatedVideo = false
  shot.videoUrl = ''
  openActionMenuId.value = null
  openSizeModalForShot(shot, 'video')
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
      // 如果是 404，说明是新创建的剧本库，还没有文件，这是正常的
      if (res.status === 404) {
        console.log('【文件加载】新剧本库，暂无文件')
        existingFiles.value = []
        return
      }
      console.error('【文件加载】加载失败，状态码:', res.status)
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

// Novel Analysis Functions
// Load chapters from backend API
const loadNovelChapters = async () => {
  if (!projectId) return

  loadingChapters.value = true

  try {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(`${API_BASE}/api/v1/script/libraries/${projectId}/files`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        router.push('/login')
        return
      }
      // 如果是 404，说明是新创建的剧本库，还没有文件，这是正常的
      if (response.status === 404) {
        console.log('【章节加载】新剧本库，暂无文件')
        novelChapters.value = []
        return
      }
      // 其他错误才抛出
      throw new Error('Failed to load chapters')
    }

    // Handle large integer IDs
    const text = await response.text()
    const data = JSON.parse(text.replace(/"id":(\d{15,})/g, '"id":"$1"'))

    // Convert files to chapters
    const apiChapters = data.map(file => ({
      id: file.id,
      fileId: file.id,
      title: file.filename,
      content: '',  // Will be loaded on demand
      preview: '',  // Will be loaded on demand
      loading: false
    }))

    novelChapters.value = apiChapters

    // Load preview for each chapter (first 50 chars)
    for (const chapter of novelChapters.value) {
      loadChapterPreview(chapter)
    }

  } catch (error) {
    console.error('【章节加载】加载异常:', error)
    showToastMessage('加载章节失败', 'error')
  } finally {
    loadingChapters.value = false
  }
}

// Load chapter preview (first N characters)
const loadChapterPreview = async (chapter) => {
  try {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(`${API_BASE}/api/v1/script/files/${chapter.fileId}/content?max_length=50`, {
      headers: {
        'Accept': 'text/plain',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      const text = await response.text()
      chapter.preview = text || ''
    }
  } catch (error) {
    console.error('Error loading chapter preview:', error)
  }
}

// Load full chapter content
const loadChapterContent = async (chapter) => {
  if (chapter.content) return  // Already loaded
  
  chapter.loading = true
  
  try {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(`${API_BASE}/api/v1/script/files/${chapter.fileId}/content`, {
      headers: {
        'Accept': 'text/plain',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        router.push('/login')
        return
      }
      throw new Error('Failed to load content')
    }
    
    const text = await response.text()
    chapter.content = text || ''
  } catch (error) {
    console.error('Error loading chapter content:', error)
    showToastMessage('加载章节内容失败', 'error')
  } finally {
    chapter.loading = false
  }
}

const selectChapter = (chapter) => {
  selectedChapter.value = chapter
  // Load full content if not already loaded
  if (!chapter.content) {
    loadChapterContent(chapter)
  }
}

// Run Analysis with AI
const runAnalysis = async () => {
  if (!selectedChapter.value || !selectedChapter.value.content) {
    showToastMessage('请先选择章节并加载内容', 'error')
    return
  }

  if (!currentModel.value) {
    showToastMessage('请先选择模型', 'error')
    return
  }

  isAnalyzing.value = true
  analysisError.value = ''
  analysisResult.value = ''

  try {
    const token = localStorage.getItem('accessToken')
    const userInput = selectedChapter.value.content

    // Build request body
    const requestBody = {
      config_id: currentModel.value.config_id,
      messages: [
        {
          role: 'user',
          content: userInput
        }
      ],
      stream: aiConfig.value.streamingOutput,
      thinking_mode: aiConfig.value.reasoningMode.enabled
    }

    // Add system prompt based on type
    if (systemPromptType.value === 'preset') {
      // Use preset system prompt
      requestBody.system_prompt = presetSystemPrompt
    } else if (systemPromptType.value === 'custom' && systemPrompt.value && systemPrompt.value.trim()) {
      // Use custom system prompt only if it's not empty
      requestBody.system_prompt = systemPrompt.value.trim()
    }

    // Add optional parameters
    if (aiConfig.value.temperature.enabled) {
      requestBody.temperature = aiConfig.value.temperature.value
    }
    if (aiConfig.value.reasoningLimit.enabled) {
      requestBody.reasoning_limit = aiConfig.value.reasoningLimit.value
    }

    console.log('【运行分析】请求参数:', requestBody)

    const response = await fetch(`${API_BASE}/api/v3/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`)
    }

    // Handle streaming response
    if (aiConfig.value.streamingOutput) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue

            try {
              const json = JSON.parse(data)
              // Support both formats: {"content": "..."} and {"choices": [{"delta": {"content": "..."}}]}
              let content = ''
              if (json.content) {
                // Direct content format
                content = json.content
              } else if (json.choices && json.choices[0] && json.choices[0].delta) {
                // OpenAI format
                content = json.choices[0].delta.content || ''
              }

              if (content) {
                analysisResult.value += content
                console.log('【流式输出】接收内容:', content)
              }
            } catch (e) {
              console.warn('解析流式数据失败:', e, '原始数据:', data)
            }
          }
        }
      }
    } else {
      // Handle non-streaming response
      const data = await response.json()
      if (data.choices && data.choices[0] && data.choices[0].message) {
        analysisResult.value = data.choices[0].message.content
      }
    }

    showToastMessage('分析完成', 'success')
  } catch (error) {
    console.error('【运行分析】错误:', error)
    analysisError.value = error.message
    showToastMessage('分析失败: ' + error.message, 'error')
  } finally {
    isAnalyzing.value = false
  }
}

// Save Storyboard to Backend
const saveStoryboard = async () => {
  console.log('【保存分镜】开始执行')
  console.log('【保存分镜】parsedJsonData:', parsedJsonData.value)
  console.log('【保存分镜】projectId:', projectId)
  console.log('【保存分镜】selectedChapter:', selectedChapter.value)

  if (!parsedJsonData.value) {
    showToastMessage('没有可保存的分镜数据', 'error')
    return
  }

  if (!parsedJsonData.value.shots || parsedJsonData.value.shots.length === 0) {
    showToastMessage('分镜数据中没有镜头信息', 'error')
    return
  }

  if (!projectId) {
    showToastMessage('缺少剧本库 ID', 'error')
    return
  }

  if (!selectedChapter.value || !selectedChapter.value.id) {
    showToastMessage('请先选择章节', 'error')
    return
  }

  isSavingStoryboard.value = true
  saveStoryboardError.value = ''

  try {
    const token = localStorage.getItem('accessToken')

    // Use fileId or id (both are the same, but keep as string for large integers)
    const fileId = selectedChapter.value.fileId || selectedChapter.value.id

    console.log('【保存分镜】调试信息:', {
      projectId,
      projectIdType: typeof projectId,
      fileId,
      fileIdType: typeof fileId,
      selectedChapter: selectedChapter.value
    })

    // Prepare request body for /api/v4/shot endpoint
    // Convert the entire JSON data to a string for the text field
    const requestBody = {
      library_id: String(projectId),
      script_id: String(fileId),
      text: JSON.stringify(parsedJsonData.value, null, 2)
    }

    console.log('【保存分镜】请求参数:', requestBody)

    const response = await fetch(`${API_BASE}/api/v4/shot`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || errorData.message || `保存失败: ${response.status}`)
    }

    const result = await response.json()
    console.log('【保存分镜】成功:', result)

    showToastMessage('分镜数据保存成功！', 'success')

    // Close JSON preview modal if open
    showJsonPreview.value = false
  } catch (error) {
    console.error('【保存分镜】错误:', error)
    saveStoryboardError.value = error.message
    showToastMessage('保存失败: ' + error.message, 'error')
  } finally {
    isSavingStoryboard.value = false
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

// Character modal
const showCharacterModal = ref(false)
const closeCharacterModal = () => {
  showCharacterModal.value = false
}

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

onMounted(async () => {
  loadLibraryInfo()
  loadExistingFiles()
  loadMediaFiles()  // Load existing video files from backend
  loadNovelChapters()  // Load novel chapters for analysis
  loadStoryboardScripts()  // Load storyboard scripts from backend

  // Load models first, then load effective model
  await fetchModels()  // Load available models list
  await loadEffectiveModel()  // Load effective model (local first, then global)
  await fetchImageModels()  // Load image generation models
  await fetchVideoModels()  // Load video generation models

  // Auto-select first chapter for novel analysis (after chapters are loaded or tab switched)
  watch([novelChapters, activeTab], ([chapters, tab]) => {
    if (chapters.length > 0 && !selectedChapter.value && tab === 'novelAnalysis') {
      selectedChapter.value = chapters[0]
      loadChapterContent(chapters[0])
    }
  }, { immediate: true })

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
  } else if (newTab === 'storyboard') {
    loadStoryboardScripts()
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
          </h1>
          <span class="text-xs text-secondary dark:text-gray-500">上次保存: {{ formatLastSaved }}</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <!-- System Prompt Button -->
        <button
          @click="showSystemPromptModal = true"
          class="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-[#3A3A3C]/80 transition"
          :class="systemPrompt ? 'border-brand-green text-brand-green' : 'text-gray-700 dark:text-gray-200'"
        >
          <fa :icon="['fas', 'file-lines']" :class="systemPrompt ? 'text-brand-green' : 'text-gray-500'" />
          <span class="text-sm font-medium">系统提示词</span>
          <span v-if="systemPrompt" class="px-1.5 py-0.5 text-[10px] font-bold bg-brand-green/10 text-brand-green rounded">已设置</span>
        </button>

        <!-- AI Model Selector -->
        <div class="relative">
          <div
            @click.stop="toggleAIConfigMenu"
            class="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#3A3A3C]/80 transition group"
            :class="showAIConfigMenu ? 'ring-2 ring-brand-green/20 border-brand-green' : ''"
          >
            <fa :icon="['fas', 'wand-magic-sparkles']" class="text-purple-500" />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ currentModel.name }}</span>
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
                  <div v-if="loadingModels" class="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    <fa :icon="['fas', 'spinner']" spin class="mr-2" />
                    加载中...
                  </div>
                  <div v-else-if="filteredModels.length === 0" class="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    暂无可用模型
                  </div>
                  <div v-else class="p-2">
                    <div class="text-xs font-bold text-gray-500 dark:text-gray-400 px-2 py-1">OpenAI</div>
                    <button
                      v-for="model in filteredModels"
                      :key="model.id"
                      @click="selectModel(model.id, model.config_id)"
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

              <!-- Streaming Output -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div
                      @click="aiConfig.streamingOutput = !aiConfig.streamingOutput; onConfigChange()"
                      class="w-8 h-4 rounded-full relative cursor-pointer transition-colors"
                      :class="aiConfig.streamingOutput ? 'bg-brand-green' : 'bg-gray-200 dark:bg-gray-700'"
                    >
                      <div
                        class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm"
                        :class="aiConfig.streamingOutput ? 'translate-x-4' : ''"
                      ></div>
                    </div>
                    <span class="text-sm text-gray-700 dark:text-gray-300">流式输出</span>
                    <fa :icon="['fas', 'circle-info']" class="text-gray-300 text-xs cursor-help" title="启用流式响应" />
                  </div>
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

              <!-- Reasoning Mode -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div
                    @click="aiConfig.reasoningMode.enabled = !aiConfig.reasoningMode.enabled; onConfigChange()"
                    class="w-8 h-4 rounded-full relative cursor-pointer transition-colors"
                    :class="aiConfig.reasoningMode.enabled ? 'bg-brand-green' : 'bg-gray-200 dark:bg-gray-700'"
                  >
                    <div
                      class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm"
                      :class="aiConfig.reasoningMode.enabled ? 'translate-x-4' : ''"
                    ></div>
                  </div>
                  <span class="text-sm text-gray-700 dark:text-gray-300">思考模式</span>
                  <fa :icon="['fas', 'circle-info']" class="text-gray-300 text-xs cursor-help" />
                </div>
              </div>

              <!-- Reasoning Limit -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div
                      @click="aiConfig.reasoningLimit.enabled = !aiConfig.reasoningLimit.enabled; onConfigChange()"
                      class="w-8 h-4 rounded-full relative cursor-pointer transition-colors"
                      :class="aiConfig.reasoningLimit.enabled ? 'bg-brand-green' : 'bg-gray-200 dark:bg-gray-700'"
                    >
                      <div
                        class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm"
                        :class="aiConfig.reasoningLimit.enabled ? 'translate-x-4' : ''"
                      ></div>
                    </div>
                    <span class="text-sm text-gray-700 dark:text-gray-300">思考长度限制</span>
                    <fa :icon="['fas', 'circle-info']" class="text-gray-300 text-xs cursor-help" />
                  </div>
                  <input
                    type="number"
                    v-model.number="aiConfig.reasoningLimit.value"
                    @input="onConfigChange"
                    class="w-16 px-2 py-1 text-xs border border-gray-200 dark:border-[#3A3A3C] rounded bg-gray-50 dark:bg-[#1C1C1E] text-right"
                    :disabled="!aiConfig.reasoningLimit.enabled"
                  />
                </div>
                <input
                  type="range"
                  v-model.number="aiConfig.reasoningLimit.value"
                  @input="onConfigChange"
                  min="1"
                  max="8192"
                  step="1"
                  class="w-full h-1 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-colors"
                  :class="aiConfig.reasoningLimit.enabled ? '[&::-webkit-slider-thumb]:bg-brand-green' : '[&::-webkit-slider-thumb]:bg-gray-300 opacity-50'"
                  :disabled="!aiConfig.reasoningLimit.enabled"
                  :style="getSliderStyle(aiConfig.reasoningLimit.value, 1, 8192, aiConfig.reasoningLimit.enabled)"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="h-6 w-px bg-gray-200 dark:bg-[#3A3A3C]"></div>
        <button class="p-2 text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white transition" @click="toggleTheme">
          <fa :icon="['fas', theme === 'dark' ? 'sun' : 'moon']" />
        </button>
        <button
          @click="runAnalysis"
          :disabled="isAnalyzing || !selectedChapter || !currentModel"
          class="px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-md text-sm font-medium hover:opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isAnalyzing" class="flex items-center gap-2">
            <fa :icon="['fas', 'circle-dot']" class="animate-spin" />
            运行中...
          </span>
          <span v-else>运行</span>
        </button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-52 bg-white dark:bg-[#2C2C2E] border-r border-gray-200 dark:border-[#3A3A3C] flex flex-col shrink-0">
        <nav class="p-2 space-y-1">
          <div
            v-for="tab in tabs"
            :key="tab.id"
            class="relative group"
          >
            <button
              @click="switchTab(tab.id)"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              :class="activeTab === tab.id
                ? 'bg-brand-green/10 text-brand-green dark:bg-brand-green/20'
                : 'text-secondary hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#3A3A3C]'"
            >
              <fa :icon="['fas', tab.icon]" class="w-4" />
              {{ tab.label }}
              <span v-if="tab.badge" class="ml-auto px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{{ tab.badge }}</span>
            </button>
            <!-- Tooltip for Beta features -->
            <div
              v-if="tab.badge"
              class="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none"
            >
              <div class="relative">
                <template v-if="tab.id === 'video'">自动化剪辑Agent正在开发中</template>
                <template v-else-if="tab.id === 'videoAssets'">视频素材管理配合视频剪辑使用，正在开发中</template>
                <template v-else-if="tab.id === 'audioAssets'">音频素材管理配合视频剪辑使用，正在开发中</template>
                <template v-else-if="tab.id === 'publish'">多平台发布管理功能正在开发中</template>
                <!-- Arrow -->
                <div class="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
              </div>
            </div>
          </div>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#1C1C1E] p-6">
        <!-- Files View (Script File Management) -->
        <div v-if="activeTab === 'files'" class="max-w-6xl mx-auto">
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
        <!-- Novel Analysis View -->
        <div v-else-if="activeTab === 'novelAnalysis'" class="h-full flex gap-4">
          <!-- Left Sidebar: Chapter List -->
          <div class="w-80 flex-shrink-0 bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] p-4 overflow-y-auto">
            <h2 class="text-lg font-bold mb-4 text-primary dark:text-gray-200">章节列表</h2>
            <div v-if="novelChapters.length === 0" class="text-center py-8 text-secondary dark:text-gray-400">
              <fa :icon="['fas', 'book-open']" class="text-4xl mb-2 opacity-50" />
              <p class="text-sm">暂无章节</p>
            </div>
            <div v-else class="space-y-2">
              <button
                v-for="chapter in novelChapters"
                :key="chapter.id"
                @click="selectChapter(chapter)"
                class="w-full text-left p-3 rounded-lg border transition"
                :class="selectedChapter?.id === chapter.id 
                  ? 'bg-brand-green/10 border-brand-green text-brand-green dark:bg-brand-green/20' 
                  : 'border-gray-200 dark:border-[#3A3A3C] hover:bg-gray-50 dark:hover:bg-[#3A3A3C] text-primary dark:text-gray-200'"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium text-sm">{{ chapter.title }}</span>
                </div>
                <p class="text-xs text-secondary dark:text-gray-400 line-clamp-2">{{ chapter.preview || '加载中...' }}</p>
              </button>
            </div>
          </div>

          <!-- Center: Chapter Content -->
          <div class="flex-1 bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] p-6 overflow-y-auto">
            <div v-if="!selectedChapter" class="h-full flex flex-col items-center justify-center text-secondary dark:text-gray-400">
              <fa :icon="['fas', 'book-open']" class="text-6xl mb-4 opacity-30" />
              <p class="text-lg">选择章节查看内容</p>
            </div>
            <div v-else>
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-2xl font-bold text-primary dark:text-gray-200">{{ selectedChapter.title }}</h2>
              </div>
              <div class="prose dark:prose-invert max-w-none">
                <div v-if="selectedChapter.loading" class="flex items-center justify-center py-12">
                  <fa :icon="['fas', 'circle-dot']" class="text-3xl text-brand-green animate-spin mr-3" />
                  <span class="text-secondary dark:text-gray-400">加载内容中...</span>
                </div>
                <p v-else-if="selectedChapter.content" class="text-base leading-relaxed text-primary dark:text-gray-300 whitespace-pre-wrap">{{ selectedChapter.content }}</p>
                <p v-else class="text-center text-secondary dark:text-gray-400 py-12">暂无内容</p>
              </div>
            </div>
          </div>

          <!-- Right Sidebar: Analysis Results -->
          <div class="w-96 flex-shrink-0 bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] overflow-hidden flex flex-col">
            <div class="p-4 border-b border-gray-200 dark:border-[#3A3A3C]">
              <div class="flex items-center justify-between mb-3">
                <h2 class="text-lg font-bold text-primary dark:text-gray-200">运行结果</h2>
                <button
                  @click="showResultPreviewModal = true"
                  class="p-2 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg transition"
                  :class="!analysisResult ? 'opacity-50 cursor-not-allowed' : ''"
                  :disabled="!analysisResult"
                  title="全屏查看"
                >
                  <fa :icon="['fas', 'arrow-up-right-from-square']" class="text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <!-- View Mode Toggle -->
              <div class="flex items-center gap-2 bg-gray-100 dark:bg-[#1C1C1E] rounded-lg p-1">
                <button
                  @click="resultViewMode = 'markdown'"
                  class="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition"
                  :class="resultViewMode === 'markdown'
                    ? 'bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'"
                >
                  <fa :icon="['fas', 'file-lines']" class="mr-1.5" />
                  Markdown
                </button>
                <button
                  @click="resultViewMode = 'table'"
                  class="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition"
                  :class="resultViewMode === 'table'
                    ? 'bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'"
                >
                  <fa :icon="['fas', 'table']" class="mr-1.5" />
                  表格
                </button>
              </div>
            </div>

            <!-- Loading State (only show when no content yet) -->
            <div v-if="isAnalyzing && !analysisResult" class="flex-1 flex flex-col items-center justify-center text-secondary dark:text-gray-400 p-6">
              <fa :icon="['fas', 'circle-dot']" class="text-5xl mb-3 text-brand-green animate-spin" />
              <p class="text-sm text-center">AI 正在分析中...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="analysisError && !analysisResult" class="flex-1 p-6">
              <div class="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div class="flex items-start gap-2">
                  <fa :icon="['fas', 'triangle-exclamation']" class="text-red-500 mt-0.5" />
                  <div class="flex-1">
                    <h4 class="font-bold text-sm text-red-700 dark:text-red-400 mb-1">运行失败</h4>
                    <p class="text-xs text-red-600 dark:text-red-300">{{ analysisError }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="!analysisResult && !isAnalyzing" class="flex-1 flex flex-col items-center justify-center text-secondary dark:text-gray-400 p-6">
              <fa :icon="['fas', 'circle-info']" class="text-5xl mb-3 opacity-30" />
              <p class="text-sm text-center">点击"运行"按钮<br/>开始 AI 分析</p>
            </div>

            <!-- Result Display (with streaming indicator) -->
            <div v-else class="flex-1 overflow-y-auto p-6">
              <!-- Markdown View -->
              <div v-if="resultViewMode === 'markdown'" class="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-table:text-xs prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-code:text-brand-green prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded markdown-content">
                <div v-html="renderedMarkdown"></div>
                <!-- Streaming indicator -->
                <div v-if="isAnalyzing" class="flex items-center gap-2 mt-3 text-brand-green not-prose">
                  <fa :icon="['fas', 'circle-dot']" class="animate-pulse text-xs" />
                  <span class="text-xs">正在生成中...</span>
                </div>
              </div>

              <!-- Table View -->
              <div v-else-if="resultViewMode === 'table'" class="space-y-4">
                <!-- JSON Parse Error -->
                <div v-if="!parsedJsonData" class="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <div class="flex items-start gap-2">
                    <fa :icon="['fas', 'triangle-exclamation']" class="text-yellow-500 mt-0.5" />
                    <div class="flex-1">
                      <h4 class="font-bold text-sm text-yellow-700 dark:text-yellow-400 mb-1">无法解析为表格</h4>
                      <p class="text-xs text-yellow-600 dark:text-yellow-300">当前内容无法解析为 JSON 格式，请确保 AI 输出了正确的 JSON 格式数据。</p>
                    </div>
                  </div>
                </div>

                <!-- No Shots Data -->
                <div v-else-if="!parsedJsonData.shots || parsedJsonData.shots.length === 0" class="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <div class="flex items-start gap-2">
                    <fa :icon="['fas', 'triangle-exclamation']" class="text-yellow-500 mt-0.5" />
                    <div class="flex-1">
                      <h4 class="font-bold text-sm text-yellow-700 dark:text-yellow-400 mb-1">没有分镜数据</h4>
                      <p class="text-xs text-yellow-600 dark:text-yellow-300">JSON 中没有找到 shots 数组数据。</p>
                    </div>
                  </div>
                </div>

                <!-- Table Content -->
                <template v-else>
                  <div v-if="parsedJsonData.title" class="mb-4">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ parsedJsonData.title }}</h3>
                  </div>

                  <!-- Table -->
                  <div class="overflow-x-auto">
                  <table class="w-full text-xs border-collapse">
                    <thead>
                      <tr class="bg-gray-100 dark:bg-[#1C1C1E]">
                        <th class="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center font-semibold">镜号</th>
                        <th class="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center font-semibold">景别</th>
                        <th class="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center font-semibold">运镜</th>
                        <th class="border border-gray-300 dark:border-gray-600 px-2 py-2 text-left font-semibold">画面内容</th>
                        <th class="border border-gray-300 dark:border-gray-600 px-2 py-2 text-left font-semibold">音频</th>
                        <th class="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center font-semibold">时长</th>
                        <th class="border border-gray-300 dark:border-gray-600 px-2 py-2 text-left font-semibold">备注</th>
                        <th class="border border-gray-300 dark:border-gray-600 px-2 py-2 text-left font-semibold">文生图提示词</th>
                        <th class="border border-gray-300 dark:border-gray-600 px-2 py-2 text-left font-semibold">图生视频提示词</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="shot in parsedJsonData.shots" :key="shot.id" class="hover:bg-gray-50 dark:hover:bg-[#2C2C2E]">
                        <td class="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center font-bold">{{ shot.id }}</td>
                        <td class="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center">{{ shot.shotType }}</td>
                        <td class="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center">{{ shot.cameraMove }}</td>
                        <td class="border border-gray-300 dark:border-gray-600 px-2 py-2">{{ shot.visualContent }}</td>
                        <td class="border border-gray-300 dark:border-gray-600 px-2 py-2">{{ shot.audio }}</td>
                        <td class="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center">{{ shot.duration }}s</td>
                        <td class="border border-gray-300 dark:border-gray-600 px-2 py-2">{{ shot.remark }}</td>
                        <td class="border border-gray-300 dark:border-gray-600 px-2 py-2">
                          <div class="space-y-1">
                            <div v-if="shot.text2imgPrompt && shot.text2imgPrompt.positive">
                              <strong class="text-green-600 dark:text-green-400">正向：</strong>
                              <div class="text-gray-700 dark:text-gray-300">{{ shot.text2imgPrompt.positive.join(', ') }}</div>
                            </div>
                            <div v-if="shot.text2imgPrompt && shot.text2imgPrompt.negative">
                              <strong class="text-red-600 dark:text-red-400">反向：</strong>
                              <div class="text-gray-700 dark:text-gray-300">{{ shot.text2imgPrompt.negative.join(', ') }}</div>
                            </div>
                          </div>
                        </td>
                        <td class="border border-gray-300 dark:border-gray-600 px-2 py-2">
                          <div class="space-y-1">
                            <div v-if="shot.img2videoPrompt && shot.img2videoPrompt.positive">
                              <strong class="text-green-600 dark:text-green-400">正向：</strong>
                              <div class="text-gray-700 dark:text-gray-300">{{ shot.img2videoPrompt.positive.join(', ') }}</div>
                            </div>
                            <div v-if="shot.img2videoPrompt && shot.img2videoPrompt.negative">
                              <strong class="text-red-600 dark:text-red-400">反向：</strong>
                              <div class="text-gray-700 dark:text-gray-300">{{ shot.img2videoPrompt.negative.join(', ') }}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                  <!-- Action Buttons -->
                  <div class="flex items-center justify-end gap-2 mt-4">
                    <button
                      @click="saveStoryboard"
                      :disabled="isSavingStoryboard"
                      class="px-4 py-2 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-brand-green-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <fa :icon="isSavingStoryboard ? ['fas', 'circle-notch'] : ['fas', 'check']" :class="{'animate-spin': isSavingStoryboard}" class="mr-1.5" />
                      {{ isSavingStoryboard ? '保存中...' : '应用到分镜' }}
                    </button>
                  </div>

                  <!-- Streaming indicator -->
                  <div v-if="isAnalyzing" class="flex items-center gap-2 mt-3 text-brand-green">
                    <fa :icon="['fas', 'circle-dot']" class="animate-pulse text-xs" />
                    <span class="text-xs">正在生成中...</span>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Storyboard View -->
        <div v-else-if="activeTab === 'storyboard'" class="mx-auto w-full px-2 lg:px-4">
          <!-- Script Selector -->
          <div class="mb-4 bg-white dark:bg-[#2C2C2E] rounded-lg border border-gray-200 dark:border-[#3A3A3C] p-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">选择剧本</h3>
              <button
                @click="loadStoryboardScripts"
                :disabled="isLoadingStoryboards"
                class="text-xs text-brand-green hover:text-brand-green-dark disabled:opacity-50"
              >
                <fa :icon="['fas', 'sync-alt']" :class="{'animate-spin': isLoadingStoryboards}" class="mr-1" />
                刷新
              </button>
            </div>

            <!-- Loading State -->
            <div v-if="isLoadingStoryboards" class="flex items-center justify-center py-8">
              <fa :icon="['fas', 'circle-notch']" class="animate-spin text-brand-green text-2xl" />
              <span class="ml-2 text-sm text-gray-500">加载中...</span>
            </div>

            <!-- Empty State -->
            <div v-else-if="storyboardShots.length === 0" class="text-center py-8">
              <fa :icon="['fas', 'film']" class="text-4xl text-gray-300 dark:text-gray-600 mb-2" />
              <p class="text-sm text-gray-500 dark:text-gray-400">暂无分镜数据</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">请先在"小说拆解"标签页生成分镜数据</p>
            </div>

            <!-- Shot List -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div
                v-for="shot in storyboardShots"
                :key="shot.shot_uuid"
                @click="selectShot(shot)"
                class="p-3 rounded-lg border cursor-pointer transition"
                :class="selectedShot?.shot_uuid === shot.shot_uuid
                  ? 'border-brand-green bg-brand-green/5 dark:bg-brand-green/10'
                  : 'border-gray-200 dark:border-[#3A3A3C] hover:border-gray-300 dark:hover:border-gray-500'"
              >
                <div class="flex items-start justify-between mb-2">
                  <div class="flex-1">
                    <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                      {{ shot.filename || `剧本 #${shot.script_id}` }}
                    </h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {{ new Date(shot.created_at).toLocaleString('zh-CN') }}
                    </p>
                  </div>
                  <fa
                    v-if="selectedShot?.shot_uuid === shot.shot_uuid"
                    :icon="['fas', 'check-circle']"
                    class="text-brand-green flex-shrink-0 ml-2"
                  />
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>ID: {{ shot.shot_uuid.substring(0, 8) }}...</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-4">
              <h2 class="text-xl font-bold">分镜预览</h2>
              <div class="flex items-center gap-1">
                <button @click="storyboardView='compact'" class="px-3 py-1.5 text-sm rounded border bg-white dark:bg-[#2C2C2E] dark:border-[#3A3A3C] text-secondary hover:border-gray-300" :class="storyboardView==='compact' ? 'border-gray-500' : ''">缩写</button>
                <button @click="storyboardView='detail'" class="px-3 py-1.5 text-sm rounded border bg-white dark:bg-[#2C2C2E] dark:border-[#3A3A3C] text-secondary hover:border-gray-300" :class="storyboardView==='detail' ? 'border-gray-500' : ''">详情</button>
              </div>
            </div>
            <div class="flex gap-2 items-center">
              <!-- Image Model Selector -->
              <div class="relative compact-model-selector">
                <ModelSelector
                  v-model="selectedImageModel"
                  :models="availableImageModels"
                  :get-provider-icon="getProviderIcon"
                  placeholder="图像模型"
                />
              </div>

              <!-- Video Model Selector -->
              <div class="relative compact-model-selector">
                <ModelSelector
                  v-model="selectedVideoModel"
                  :models="availableVideoModels"
                  :get-provider-icon="getProviderIcon"
                  placeholder="视频模型"
                />
              </div>

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
            <table class="min-w-[2400px] text-xs">
              <thead>
                <tr class="text-left bg-gray-50 dark:bg-[#1C1C1E]">
                  <th class="px-2 py-2 border-b dark:border-[#3A3A3C] w-12 text-center">镜号</th>
                  <th class="px-2 py-2 border-b dark:border-[#3A3A3C] w-32">场景</th>
                  <th class="px-2 py-2 border-b dark:border-[#3A3A3C] w-20 text-center">景别</th>
                  <th class="px-2 py-2 border-b dark:border-[#3A3A3C] w-20 text-center">镜头</th>
                  <th class="px-2 py-2 border-b dark:border-[#3A3A3C] w-16 text-center">时长</th>
                  <th class="px-2 py-2 border-b dark:border-[#3A3A3C] w-48">画面描述</th>
                  <th class="px-2 py-2 border-b dark:border-[#3A3A3C] w-40">对白/旁白</th>
                  <th class="px-2 py-2 border-b dark:border-[#3A3A3C] w-40">音效/音乐</th>
                  <th class="px-2 py-2 border-b dark:border-[#3A3A3C] w-64">图片提示词</th>
                  <th class="px-2 py-2 border-b dark:border-[#3A3A3C] w-64">视频提示词</th>
                  <th class="px-2 py-2 border-b dark:border-[#3A3A3C] w-32 text-center">生成图片</th>
                  <th class="px-2 py-2 border-b dark:border-[#3A3A3C] w-32 text-center">生成视频</th>
                  <th class="px-2 py-2 border-b dark:border-[#3A3A3C] w-32 text-center">操作</th>
                  <th class="px-2 py-2 border-b dark:border-[#3A3A3C] w-40">备注</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="shot in storyboards" :key="shot.id" class="border-t dark:border-[#3A3A3C] hover:bg-gray-50 dark:hover:bg-[#1C1C1E]">
                  <td class="px-2 py-2 text-center">{{ shot.id }}</td>
                  <td class="px-2 py-2">
                    <div class="line-clamp-3">{{ shot.scene }}</div>
                  </td>
                  <td class="px-2 py-2 text-center">{{ shot.size }}</td>
                  <td class="px-2 py-2 text-center">{{ shot.shot }}</td>
                  <td class="px-2 py-2 text-center">{{ shot.duration }}</td>
                  <td class="px-2 py-2">
                    <div class="line-clamp-4">{{ shot.desc }}</div>
                  </td>
                  <td class="px-2 py-2">
                    <div class="line-clamp-3">{{ shot.dialogue }}</div>
                  </td>
                  <td class="px-2 py-2">
                    <div class="line-clamp-3">{{ shot.sound }}</div>
                  </td>
                  <td class="px-2 py-2">
                    <div class="text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words">{{ shot.imagePrompt }}</div>
                  </td>
                  <td class="px-2 py-2">
                    <div class="text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words">{{ shot.videoPrompt }}</div>
                  </td>
                  <td class="px-2 py-2">
                    <div class="w-28 h-16 bg-gray-100 dark:bg-[#3A3A3C] rounded flex items-center justify-center overflow-hidden mx-auto">
                      <img v-if="shot.generatedImage && shot.img" :src="shot.img" class="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" alt="图片预览" @click="openImagePreview(shot)">
                      <div v-else-if="shot.generatingImage" class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <fa :icon="['fas','spinner']" spin class="text-brand-green" />
                        <span>生成中...</span>
                      </div>
                      <button v-else @click="openSizeModalForShot(shot, 'image')" class="px-2 py-1 text-xs rounded bg-brand-green text-white hover:bg-brand-green-dark whitespace-nowrap">生成图片</button>
                    </div>
                  </td>
                  <td class="px-2 py-2">
                    <div class="w-28 h-16 bg-gray-100 dark:bg-[#3A3A3C] rounded flex items-center justify-center overflow-hidden mx-auto">
                      <div v-if="shot.generatedVideo && shot.videoUrl" @click="openVideoPreview(shot)" class="relative w-full h-full cursor-pointer group">
                        <video :src="shot.videoUrl" class="w-full h-full object-cover" muted></video>
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <fa :icon="['fas','play']" class="text-white text-2xl" />
                        </div>
                      </div>
                      <div v-else-if="shot.generatingVideo" class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <fa :icon="['fas','spinner']" spin class="text-brand-green" />
                        <span>生成中...</span>
                      </div>
                      <button v-else @click="openSizeModalForShot(shot, 'video')" class="px-2 py-1 text-xs rounded bg-brand-green text-white hover:bg-brand-green-dark whitespace-nowrap">生成视频</button>
                    </div>
                  </td>
                  <td class="px-2 py-2">
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
                              <td class="px-3 py-1.5">{{ opt.label || opt.key }}</td>
                              <td class="px-3 py-1.5">
                                <span v-if="opt.w && opt.h" class="px-2 py-1 rounded bg-gray-100 dark:bg-[#3A3A3C] text-[11px] font-medium">{{ opt.w }}x{{ opt.h }}</span>
                                <span v-else class="px-2 py-1 rounded bg-gray-100 dark:bg-[#3A3A3C] text-[11px] font-medium">{{ opt.ratio }} @ {{ opt.resolution }}</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div class="px-6 py-5 space-y-4">
                    <!-- 尺寸选择 -->
                    <div>
                      <label class="block text-sm font-medium mb-2">选择尺寸</label>
                      <div class="grid grid-cols-3 gap-3">
                        <button
                          v-for="opt in ratioOptions"
                          :key="opt.key"
                          @click="selectedRatio = opt.key"
                          class="px-3 py-2 rounded-lg border text-sm dark:border-[#3A3A3C] hover:bg-gray-50 dark:hover:bg-[#3A3A3C]"
                          :class="selectedRatio===opt.key ? 'border-brand-green ring-2 ring-brand-green' : ''"
                        >
                          <div class="font-medium">{{ opt.label || opt.key }}</div>
                          <div v-if="opt.w && opt.h" class="text-xs text-secondary">{{ opt.w }}x{{ opt.h }}</div>
                          <div v-else class="text-xs text-secondary">{{ opt.resolution }}</div>
                        </button>
                      </div>
                    </div>

                    <!-- 时长选择 (仅视频生成时显示) -->
                    <div v-if="sizeModalAction === 'video'">
                      <label class="block text-sm font-medium mb-2">选择时长</label>
                      <div class="grid grid-cols-3 gap-3">
                        <button
                          v-for="opt in videoDurationOptions"
                          :key="opt.value"
                          @click="selectedDuration = opt.value"
                          class="px-3 py-2 rounded-lg border text-sm dark:border-[#3A3A3C] hover:bg-gray-50 dark:hover:bg-[#3A3A3C]"
                          :class="selectedDuration===opt.value ? 'border-brand-green ring-2 ring-brand-green' : ''"
                        >
                          <div class="font-medium">{{ opt.label }}</div>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-[#3A3A3C]">
                    <button @click="showSizeModal=false" class="px-3 py-1.5 rounded-lg border bg-white dark:bg-[#2C2C2E] dark:border-[#3A3A3C] text-sm">取消</button>
                    <button @click="applySizeSelection" class="px-3 py-1.5 rounded-lg bg-brand-green text-white text-sm">确定</button>
                  </div>
                </div>
              </div>
            </teleport>
            <!-- Image Preview Modal -->
            <teleport to="body">
              <div v-if="showImagePreview" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/90" @click="closeImagePreview">
                <!-- Close button - fixed position -->
                <button @click="closeImagePreview" class="fixed top-4 right-4 z-[70] w-12 h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors backdrop-blur-sm">
                  <fa :icon="['fas','xmark']" class="text-2xl" />
                </button>

                <!-- Image only -->
                <div class="relative max-w-[95vw] max-h-[95vh]" @click.stop>
                  <img :src="previewImageUrl" class="max-w-full max-h-[95vh] w-auto h-auto rounded-lg shadow-2xl" alt="图片预览">
                </div>
              </div>
            </teleport>
            <!-- Video Preview Modal -->
            <teleport to="body">
              <div v-if="showVideoPreview" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/90" @click="closeVideoPreview">
                <!-- Close button - fixed position -->
                <button @click="closeVideoPreview" class="fixed top-4 right-4 z-[70] w-12 h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors backdrop-blur-sm">
                  <fa :icon="['fas','xmark']" class="text-2xl" />
                </button>

                <!-- Video player -->
                <div class="relative max-w-[95vw] max-h-[95vh]" @click.stop>
                  <video :src="previewVideoUrl" class="max-w-full max-h-[95vh] w-auto h-auto rounded-lg shadow-2xl" controls autoplay loop></video>
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

        <!-- Publish Management View -->
        <div v-else-if="activeTab === 'publish'" class="h-full flex flex-col">
          <!-- Top Navigation Tabs -->
          <div class="bg-white dark:bg-[#2C2C2E] border-b border-gray-200 dark:border-[#3A3A3C] mb-6">
            <div class="flex items-center gap-1 px-6">
              <button
                @click="switchPublishSubTab('overview')"
                class="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                :class="publishSubTab === 'overview'
                  ? 'border-brand-green text-brand-green'
                  : 'border-transparent text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white'"
              >
                数据概览
              </button>
              <button
                @click="switchPublishSubTab('platforms')"
                class="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                :class="publishSubTab === 'platforms'
                  ? 'border-brand-green text-brand-green'
                  : 'border-transparent text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white'"
              >
                平台管理
              </button>
              <button
                @click="switchPublishSubTab('messages')"
                class="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                :class="publishSubTab === 'messages'
                  ? 'border-brand-green text-brand-green'
                  : 'border-transparent text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white'"
              >
                消息中心
              </button>
              <button
                @click="switchPublishSubTab('violations')"
                class="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                :class="publishSubTab === 'violations'
                  ? 'border-brand-green text-brand-green'
                  : 'border-transparent text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white'"
              >
                违禁管理
              </button>
              <button
                @click="switchPublishSubTab('aiService')"
                class="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                :class="publishSubTab === 'aiService'
                  ? 'border-brand-green text-brand-green'
                  : 'border-transparent text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white'"
              >
                AI 客服
              </button>
              <button
                @click="switchPublishSubTab('competitors')"
                class="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                :class="publishSubTab === 'competitors'
                  ? 'border-brand-green text-brand-green'
                  : 'border-transparent text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white'"
              >
                竞品分析
              </button>
            </div>
          </div>

          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto px-6">
            <!-- Data Overview Tab -->
            <div v-if="publishSubTab === 'overview'">
            <!-- Key Metrics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <!-- Total Views -->
              <div class="bg-white dark:bg-[#2C2C2E] rounded-lg border border-gray-200 dark:border-[#3A3A3C] p-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm text-secondary dark:text-gray-400">总播放量</span>
                  <fa :icon="['fas', 'eye']" class="text-blue-500" />
                </div>
                <div class="text-2xl font-bold text-primary dark:text-white mb-1">0</div>
                <div class="flex items-center gap-1 text-xs">
                  <span class="text-green-500">+0%</span>
                  <span class="text-secondary dark:text-gray-400">较昨日</span>
                </div>
              </div>

              <!-- Total Likes -->
              <div class="bg-white dark:bg-[#2C2C2E] rounded-lg border border-gray-200 dark:border-[#3A3A3C] p-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm text-secondary dark:text-gray-400">总点赞数</span>
                  <fa :icon="['fas', 'heart']" class="text-red-500" />
                </div>
                <div class="text-2xl font-bold text-primary dark:text-white mb-1">0</div>
                <div class="flex items-center gap-1 text-xs">
                  <span class="text-green-500">+0%</span>
                  <span class="text-secondary dark:text-gray-400">较昨日</span>
                </div>
              </div>

              <!-- Total Comments -->
              <div class="bg-white dark:bg-[#2C2C2E] rounded-lg border border-gray-200 dark:border-[#3A3A3C] p-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm text-secondary dark:text-gray-400">总评论数</span>
                  <fa :icon="['fas', 'comment']" class="text-yellow-500" />
                </div>
                <div class="text-2xl font-bold text-primary dark:text-white mb-1">0</div>
                <div class="flex items-center gap-1 text-xs">
                  <span class="text-green-500">+0%</span>
                  <span class="text-secondary dark:text-gray-400">较昨日</span>
                </div>
              </div>

              <!-- Total Shares -->
              <div class="bg-white dark:bg-[#2C2C2E] rounded-lg border border-gray-200 dark:border-[#3A3A3C] p-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm text-secondary dark:text-gray-400">总分享数</span>
                  <fa :icon="['fas', 'share']" class="text-purple-500" />
                </div>
                <div class="text-2xl font-bold text-primary dark:text-white mb-1">0</div>
                <div class="flex items-center gap-1 text-xs">
                  <span class="text-green-500">+0%</span>
                  <span class="text-secondary dark:text-gray-400">较昨日</span>
                </div>
              </div>
            </div>

            <!-- Platform Status & AI Analysis -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <!-- Platform Status -->
              <div class="lg:col-span-2 bg-white dark:bg-[#2C2C2E] rounded-lg border border-gray-200 dark:border-[#3A3A3C] p-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-bold text-primary dark:text-white">平台连接状态</h3>
                  <button class="text-sm text-brand-green hover:text-brand-green/80">管理平台</button>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <!-- Platform Status Items -->
                  <div class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-[#1C1C1E] rounded-lg">
                    <div class="w-8 h-8 rounded bg-black flex items-center justify-center flex-shrink-0">
                      <span class="text-white text-xs font-bold">抖</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-primary dark:text-white truncate">抖音</div>
                      <div class="text-xs text-red-500">未连接</div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-[#1C1C1E] rounded-lg">
                    <div class="w-8 h-8 rounded bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                      <span class="text-white text-xs font-bold">快</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-primary dark:text-white truncate">快手</div>
                      <div class="text-xs text-red-500">未连接</div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-[#1C1C1E] rounded-lg">
                    <div class="w-8 h-8 rounded bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <span class="text-white text-xs font-bold">小</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-primary dark:text-white truncate">小红书</div>
                      <div class="text-xs text-red-500">未连接</div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-[#1C1C1E] rounded-lg">
                    <div class="w-8 h-8 rounded bg-gradient-to-br from-pink-400 to-blue-400 flex items-center justify-center flex-shrink-0">
                      <span class="text-white text-xs font-bold">B</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-primary dark:text-white truncate">哔哩哔哩</div>
                      <div class="text-xs text-red-500">未连接</div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-[#1C1C1E] rounded-lg">
                    <div class="w-8 h-8 rounded bg-green-500 flex items-center justify-center flex-shrink-0">
                      <span class="text-white text-xs font-bold">视</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-primary dark:text-white truncate">视频号</div>
                      <div class="text-xs text-red-500">未连接</div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-[#1C1C1E] rounded-lg">
                    <div class="w-8 h-8 rounded bg-red-600 flex items-center justify-center flex-shrink-0">
                      <span class="text-white text-xs font-bold">YT</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-primary dark:text-white truncate">YouTube</div>
                      <div class="text-xs text-red-500">未连接</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- AI Analysis Assistant -->
              <div class="bg-white dark:bg-[#2C2C2E] rounded-lg border border-gray-200 dark:border-[#3A3A3C] p-6">
                <div class="flex items-center gap-2 mb-4">
                  <fa :icon="['fas', 'robot']" class="text-brand-green text-lg" />
                  <h3 class="text-lg font-bold text-primary dark:text-white">AI 分析管家</h3>
                </div>
                <div class="space-y-3">
                  <div class="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span class="text-sm text-primary dark:text-white">数据观测</span>
                    <span class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">实时</span>
                  </div>
                  <div class="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <span class="text-sm text-primary dark:text-white">智能建议</span>
                    <span class="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400">Beta</span>
                  </div>
                  <div class="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span class="text-sm text-primary dark:text-white">趋势预测</span>
                    <span class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">AI</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recent Activities & Quick Actions -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Recent Activities -->
              <div class="bg-white dark:bg-[#2C2C2E] rounded-lg border border-gray-200 dark:border-[#3A3A3C] p-6">
                <h3 class="text-lg font-bold text-primary dark:text-white mb-4">最近动态</h3>
                <div class="text-center py-8">
                  <fa :icon="['fas', 'inbox']" class="text-4xl text-gray-300 dark:text-gray-600 mb-2" />
                  <p class="text-sm text-secondary dark:text-gray-400">暂无动态</p>
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="bg-white dark:bg-[#2C2C2E] rounded-lg border border-gray-200 dark:border-[#3A3A3C] p-6">
                <h3 class="text-lg font-bold text-primary dark:text-white mb-4">快捷操作</h3>
                <div class="grid grid-cols-2 gap-3">
                  <button class="p-4 rounded-lg border border-gray-200 dark:border-[#3A3A3C] hover:border-brand-green hover:bg-brand-green/5 transition-colors text-center">
                    <fa :icon="['fas', 'upload']" class="text-2xl text-brand-green mb-2" />
                    <div class="text-sm font-medium text-primary dark:text-white">发布视频</div>
                  </button>
                  <button class="p-4 rounded-lg border border-gray-200 dark:border-[#3A3A3C] hover:border-brand-green hover:bg-brand-green/5 transition-colors text-center">
                    <fa :icon="['fas', 'chart-line']" class="text-2xl text-blue-500 mb-2" />
                    <div class="text-sm font-medium text-primary dark:text-white">查看数据</div>
                  </button>
                  <button class="p-4 rounded-lg border border-gray-200 dark:border-[#3A3A3C] hover:border-brand-green hover:bg-brand-green/5 transition-colors text-center">
                    <fa :icon="['fas', 'message']" class="text-2xl text-yellow-500 mb-2" />
                    <div class="text-sm font-medium text-primary dark:text-white">消息管理</div>
                  </button>
                  <button class="p-4 rounded-lg border border-gray-200 dark:border-[#3A3A3C] hover:border-brand-green hover:bg-brand-green/5 transition-colors text-center">
                    <fa :icon="['fas', 'shield-halved']" class="text-2xl text-red-500 mb-2" />
                    <div class="text-sm font-medium text-primary dark:text-white">违禁检测</div>
                  </button>
                </div>
              </div>
            </div>
            </div>

            <!-- Platform Management Tab -->
            <div v-else-if="publishSubTab === 'platforms'" class="max-w-6xl mx-auto">
              <h2 class="text-xl font-bold text-primary dark:text-white mb-6">平台账号管理</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Platform Cards with Connect Button -->
                <div class="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] p-6">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 rounded-lg bg-black flex items-center justify-center">
                      <span class="text-white font-bold text-lg">抖</span>
                    </div>
                    <div>
                      <h3 class="font-bold text-primary dark:text-white">抖音</h3>
                      <p class="text-xs text-red-500">未连接</p>
                    </div>
                  </div>
                  <button class="w-full px-4 py-2 rounded-lg bg-brand-green text-white hover:bg-brand-green/90 transition-colors text-sm font-medium">
                    连接账号
                  </button>
                </div>

                <div class="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] p-6">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <span class="text-white font-bold text-lg">快</span>
                    </div>
                    <div>
                      <h3 class="font-bold text-primary dark:text-white">快手</h3>
                      <p class="text-xs text-red-500">未连接</p>
                    </div>
                  </div>
                  <button class="w-full px-4 py-2 rounded-lg bg-brand-green text-white hover:bg-brand-green/90 transition-colors text-sm font-medium">
                    连接账号
                  </button>
                </div>

                <div class="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] p-6">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                      <span class="text-white font-bold text-lg">小</span>
                    </div>
                    <div>
                      <h3 class="font-bold text-primary dark:text-white">小红书</h3>
                      <p class="text-xs text-red-500">未连接</p>
                    </div>
                  </div>
                  <button class="w-full px-4 py-2 rounded-lg bg-brand-green text-white hover:bg-brand-green/90 transition-colors text-sm font-medium">
                    连接账号
                  </button>
                </div>

                <div class="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] p-6">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-400 to-blue-400 flex items-center justify-center">
                      <span class="text-white font-bold text-lg">B</span>
                    </div>
                    <div>
                      <h3 class="font-bold text-primary dark:text-white">哔哩哔哩</h3>
                      <p class="text-xs text-red-500">未连接</p>
                    </div>
                  </div>
                  <button class="w-full px-4 py-2 rounded-lg bg-brand-green text-white hover:bg-brand-green/90 transition-colors text-sm font-medium">
                    连接账号
                  </button>
                </div>

                <div class="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] p-6">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                      <span class="text-white font-bold text-lg">视</span>
                    </div>
                    <div>
                      <h3 class="font-bold text-primary dark:text-white">微信视频号</h3>
                      <p class="text-xs text-red-500">未连接</p>
                    </div>
                  </div>
                  <button class="w-full px-4 py-2 rounded-lg bg-brand-green text-white hover:bg-brand-green/90 transition-colors text-sm font-medium">
                    连接账号
                  </button>
                </div>

                <div class="bg-white dark:bg-[#2C2C2E] rounded-xl border border-gray-200 dark:border-[#3A3A3C] p-6">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-12 h-12 rounded-lg bg-red-600 flex items-center justify-center">
                      <span class="text-white font-bold text-lg">YT</span>
                    </div>
                    <div>
                      <h3 class="font-bold text-primary dark:text-white">YouTube</h3>
                      <p class="text-xs text-red-500">未连接</p>
                    </div>
                  </div>
                  <button class="w-full px-4 py-2 rounded-lg bg-brand-green text-white hover:bg-brand-green/90 transition-colors text-sm font-medium">
                    连接账号
                  </button>
                </div>
              </div>
            </div>

            <!-- Messages Tab -->
            <div v-else-if="publishSubTab === 'messages'">
              <div class="max-w-6xl mx-auto">
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-xl font-bold text-primary dark:text-white">消息中心</h2>
                  <button class="px-4 py-2 rounded-lg border border-gray-200 dark:border-[#3A3A3C] text-sm hover:bg-gray-50 dark:hover:bg-[#3A3A3C]">
                    <fa :icon="['fas', 'filter']" class="mr-2" />
                    筛选
                  </button>
                </div>
                <div class="bg-white dark:bg-[#2C2C2E] rounded-lg border border-gray-200 dark:border-[#3A3A3C] p-6">
                  <div class="text-center py-12">
                    <fa :icon="['fas', 'envelope-open']" class="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 class="text-lg font-medium text-primary dark:text-white mb-2">暂无消息</h3>
                    <p class="text-sm text-secondary dark:text-gray-400">连接平台账号后，可在此查看和管理所有平台的消息</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Violations Tab -->
            <div v-else-if="publishSubTab === 'violations'">
              <div class="max-w-6xl mx-auto">
                <h2 class="text-xl font-bold text-primary dark:text-white mb-6">违禁内容管理</h2>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div class="bg-white dark:bg-[#2C2C2E] rounded-lg border border-gray-200 dark:border-[#3A3A3C] p-6">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm text-secondary dark:text-gray-400">违禁词库</span>
                      <fa :icon="['fas', 'book']" class="text-red-500" />
                    </div>
                    <div class="text-2xl font-bold text-primary dark:text-white">0</div>
                    <p class="text-xs text-secondary dark:text-gray-400 mt-1">个关键词</p>
                  </div>
                  <div class="bg-white dark:bg-[#2C2C2E] rounded-lg border border-gray-200 dark:border-[#3A3A3C] p-6">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm text-secondary dark:text-gray-400">检测次数</span>
                      <fa :icon="['fas', 'shield-halved']" class="text-blue-500" />
                    </div>
                    <div class="text-2xl font-bold text-primary dark:text-white">0</div>
                    <p class="text-xs text-secondary dark:text-gray-400 mt-1">本月检测</p>
                  </div>
                  <div class="bg-white dark:bg-[#2C2C2E] rounded-lg border border-gray-200 dark:border-[#3A3A3C] p-6">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm text-secondary dark:text-gray-400">拦截记录</span>
                      <fa :icon="['fas', 'ban']" class="text-yellow-500" />
                    </div>
                    <div class="text-2xl font-bold text-primary dark:text-white">0</div>
                    <p class="text-xs text-secondary dark:text-gray-400 mt-1">条内容被拦截</p>
                  </div>
                </div>
                <div class="bg-white dark:bg-[#2C2C2E] rounded-lg border border-gray-200 dark:border-[#3A3A3C] p-6">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-primary dark:text-white">AI 违禁检测</h3>
                    <button class="px-4 py-2 rounded-lg bg-brand-green text-white hover:bg-brand-green/90 transition-colors text-sm font-medium">
                      开始检测
                    </button>
                  </div>
                  <div class="text-center py-8">
                    <fa :icon="['fas', 'robot']" class="text-4xl text-gray-300 dark:text-gray-600 mb-2" />
                    <p class="text-sm text-secondary dark:text-gray-400">使用 AI 智能检测内容合规性</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- AI Service Tab -->
            <div v-else-if="publishSubTab === 'aiService'">
              <div class="max-w-6xl mx-auto">
                <h2 class="text-xl font-bold text-primary dark:text-white mb-6">AI 智能客服</h2>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div class="bg-white dark:bg-[#2C2C2E] rounded-lg border border-gray-200 dark:border-[#3A3A3C] p-6">
                    <h3 class="text-lg font-bold text-primary dark:text-white mb-4">自动回复设置</h3>
                    <div class="space-y-4">
                      <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1C1C1E] rounded-lg">
                        <div>
                          <div class="font-medium text-primary dark:text-white">智能回复</div>
                          <div class="text-xs text-secondary dark:text-gray-400">AI 自动回复用户消息</div>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" class="sr-only peer">
                          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-green/20 dark:peer-focus:ring-brand-green/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-green"></div>
                        </label>
                      </div>
                      <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1C1C1E] rounded-lg">
                        <div>
                          <div class="font-medium text-primary dark:text-white">关键词回复</div>
                          <div class="text-xs text-secondary dark:text-gray-400">根据关键词自动回复</div>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" class="sr-only peer">
                          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-green/20 dark:peer-focus:ring-brand-green/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-green"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div class="bg-white dark:bg-[#2C2C2E] rounded-lg border border-gray-200 dark:border-[#3A3A3C] p-6">
                    <h3 class="text-lg font-bold text-primary dark:text-white mb-4">服务统计</h3>
                    <div class="space-y-3">
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-secondary dark:text-gray-400">今日回复</span>
                        <span class="text-lg font-bold text-primary dark:text-white">0</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-secondary dark:text-gray-400">平均响应时间</span>
                        <span class="text-lg font-bold text-primary dark:text-white">--</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-secondary dark:text-gray-400">用户满意度</span>
                        <span class="text-lg font-bold text-primary dark:text-white">--</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Competitors Tab -->
            <div v-else-if="publishSubTab === 'competitors'">
              <div class="max-w-7xl mx-auto">
                <div class="flex items-center justify-between mb-6">
                  <div>
                    <h2 class="text-xl font-bold text-primary dark:text-white">竞品分析</h2>
                    <p class="text-sm text-secondary dark:text-gray-400 mt-1">实时监控竞品数据，AI 智能分析内容策略</p>
                  </div>
                  <button class="px-4 py-2 rounded-lg bg-brand-green text-white hover:bg-brand-green/90 transition-colors text-sm font-medium">
                    <fa :icon="['fas', 'plus']" class="mr-2" />
                    添加竞品账号
                  </button>
                </div>

                <!-- Competitors List -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <!-- Competitor Card 1 -->
                  <div class="bg-white dark:bg-[#2C2C2E] rounded-lg border border-gray-200 dark:border-[#3A3A3C] p-6">
                    <div class="flex items-start justify-between mb-4">
                      <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <span class="text-white font-bold text-lg">A</span>
                        </div>
                        <div>
                          <h3 class="font-bold text-primary dark:text-white">账号A - 短剧达人</h3>
                          <p class="text-xs text-secondary dark:text-gray-400">抖音 · 最后更新: 2小时前</p>
                        </div>
                      </div>
                      <button class="text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white">
                        <fa :icon="['fas', 'ellipsis-h']" />
                      </button>
                    </div>

                    <div class="grid grid-cols-4 gap-3 mb-4">
                      <div class="text-center">
                        <div class="text-lg font-bold text-primary dark:text-white">128.5K</div>
                        <div class="text-xs text-secondary dark:text-gray-400">粉丝</div>
                      </div>
                      <div class="text-center">
                        <div class="text-lg font-bold text-primary dark:text-white">2.3M</div>
                        <div class="text-xs text-secondary dark:text-gray-400">获赞</div>
                      </div>
                      <div class="text-center">
                        <div class="text-lg font-bold text-primary dark:text-white">156</div>
                        <div class="text-xs text-secondary dark:text-gray-400">作品</div>
                      </div>
                      <div class="text-center">
                        <div class="text-lg font-bold text-green-500">+12.3%</div>
                        <div class="text-xs text-secondary dark:text-gray-400">增长率</div>
                      </div>
                    </div>

                    <div class="flex items-center gap-2">
                      <button class="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#3A3A3C] text-sm hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors">
                        查看详情
                      </button>
                      <button class="flex-1 px-3 py-2 rounded-lg bg-brand-green/10 text-brand-green text-sm hover:bg-brand-green/20 transition-colors">
                        AI 分析
                      </button>
                    </div>
                  </div>

                  <!-- Competitor Card 2 -->
                  <div class="bg-white dark:bg-[#2C2C2E] rounded-lg border border-gray-200 dark:border-[#3A3A3C] p-6">
                    <div class="flex items-start justify-between mb-4">
                      <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                          <span class="text-white font-bold text-lg">B</span>
                        </div>
                        <div>
                          <h3 class="font-bold text-primary dark:text-white">账号B - 剧情创作</h3>
                          <p class="text-xs text-secondary dark:text-gray-400">快手 · 最后更新: 5小时前</p>
                        </div>
                      </div>
                      <button class="text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white">
                        <fa :icon="['fas', 'ellipsis-h']" />
                      </button>
                    </div>

                    <div class="grid grid-cols-4 gap-3 mb-4">
                      <div class="text-center">
                        <div class="text-lg font-bold text-primary dark:text-white">95.2K</div>
                        <div class="text-xs text-secondary dark:text-gray-400">粉丝</div>
                      </div>
                      <div class="text-center">
                        <div class="text-lg font-bold text-primary dark:text-white">1.8M</div>
                        <div class="text-xs text-secondary dark:text-gray-400">获赞</div>
                      </div>
                      <div class="text-center">
                        <div class="text-lg font-bold text-primary dark:text-white">203</div>
                        <div class="text-xs text-secondary dark:text-gray-400">作品</div>
                      </div>
                      <div class="text-center">
                        <div class="text-lg font-bold text-green-500">+8.7%</div>
                        <div class="text-xs text-secondary dark:text-gray-400">增长率</div>
                      </div>
                    </div>

                    <div class="flex items-center gap-2">
                      <button class="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#3A3A3C] text-sm hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors">
                        查看详情
                      </button>
                      <button class="flex-1 px-3 py-2 rounded-lg bg-brand-green/10 text-brand-green text-sm hover:bg-brand-green/20 transition-colors">
                        AI 分析
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Data Comparison -->
                <div class="bg-white dark:bg-[#2C2C2E] rounded-lg border border-gray-200 dark:border-[#3A3A3C] p-6 mb-6">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-primary dark:text-white">数据对比</h3>
                    <div class="flex items-center gap-2">
                      <button class="px-3 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-[#3A3A3C] hover:bg-gray-50 dark:hover:bg-[#3A3A3C]">
                        7天
                      </button>
                      <button class="px-3 py-1.5 rounded-lg text-xs bg-brand-green text-white">
                        30天
                      </button>
                      <button class="px-3 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-[#3A3A3C] hover:bg-gray-50 dark:hover:bg-[#3A3A3C]">
                        90天
                      </button>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="text-center p-4 bg-gray-50 dark:bg-[#1C1C1E] rounded-lg">
                      <div class="text-sm text-secondary dark:text-gray-400 mb-2">平均播放量</div>
                      <div class="text-2xl font-bold text-primary dark:text-white mb-1">45.2K</div>
                      <div class="text-xs text-green-500">↑ 15.3% vs 我的账号</div>
                    </div>
                    <div class="text-center p-4 bg-gray-50 dark:bg-[#1C1C1E] rounded-lg">
                      <div class="text-sm text-secondary dark:text-gray-400 mb-2">平均互动率</div>
                      <div class="text-2xl font-bold text-primary dark:text-white mb-1">8.5%</div>
                      <div class="text-xs text-red-500">↓ 2.1% vs 我的账号</div>
                    </div>
                    <div class="text-center p-4 bg-gray-50 dark:bg-[#1C1C1E] rounded-lg">
                      <div class="text-sm text-secondary dark:text-gray-400 mb-2">发布频率</div>
                      <div class="text-2xl font-bold text-primary dark:text-white mb-1">3.2/天</div>
                      <div class="text-xs text-green-500">↑ 0.8 vs 我的账号</div>
                    </div>
                  </div>
                </div>

                <!-- AI Insights -->
                <div class="bg-gradient-to-br from-brand-green/10 to-blue-500/10 dark:from-brand-green/20 dark:to-blue-500/20 rounded-lg border border-brand-green/20 p-6">
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center flex-shrink-0">
                      <fa :icon="['fas', 'robot']" class="text-white" />
                    </div>
                    <div class="flex-1">
                      <h3 class="font-bold text-primary dark:text-white mb-2">AI 智能洞察</h3>
                      <div class="space-y-2 text-sm text-secondary dark:text-gray-300">
                        <p>• <strong>内容策略:</strong> 竞品账号更倾向于发布情感类短剧,平均时长 2-3 分钟,互动率较高</p>
                        <p>• <strong>发布时间:</strong> 主要集中在晚上 8-10 点,周末发布频率提升 40%</p>
                        <p>• <strong>热门话题:</strong> #都市情感 #霸道总裁 #逆袭 等标签使用频率最高</p>
                        <p>• <strong>建议:</strong> 可以尝试增加情感类内容占比,优化发布时间至晚间黄金时段</p>
                      </div>
                      <button class="mt-4 px-4 py-2 rounded-lg bg-brand-green text-white text-sm hover:bg-brand-green/90 transition-colors">
                        查看完整分析报告
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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

    <!-- Result Preview Modal -->
    <teleport to="body">
      <div
        v-if="showResultPreviewModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click="showResultPreviewModal = false"
      >
        <div
          class="bg-white dark:bg-[#2C2C2E] rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col"
          @click.stop
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200 dark:border-[#3A3A3C]">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-brand-green/10 flex items-center justify-center">
                  <fa :icon="['fas', 'file-lines']" class="text-brand-green text-lg" />
                </div>
                <div>
                  <h3 class="text-lg font-bold text-primary dark:text-gray-200">运行结果</h3>
                  <p class="text-xs text-secondary dark:text-gray-400">AI 生成的完整内容</p>
                </div>
              </div>
              <button
                @click="showResultPreviewModal = false"
                class="p-2 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg transition"
              >
                <fa :icon="['fas', 'xmark']" class="text-gray-400" />
              </button>
            </div>

            <!-- View Mode Toggle -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 bg-gray-100 dark:bg-[#1C1C1E] rounded-lg p-1 w-80">
                <button
                  @click="resultViewMode = 'markdown'"
                  class="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition"
                  :class="resultViewMode === 'markdown'
                    ? 'bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'"
                >
                  <fa :icon="['fas', 'file-lines']" class="mr-1.5" />
                  Markdown
                </button>
                <button
                  @click="resultViewMode = 'table'"
                  class="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition"
                  :class="resultViewMode === 'table'
                    ? 'bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'"
                >
                  <fa :icon="['fas', 'table']" class="mr-1.5" />
                  表格
                </button>
              </div>
              <div v-if="resultViewMode === 'table' && parsedJsonData && parsedJsonData.shots" class="flex items-center gap-2">
                <button
                  @click="showJsonPreview = true"
                  class="px-4 py-1.5 bg-gray-100 dark:bg-[#3A3A3C] text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-[#4A4A4C] transition"
                >
                  <fa :icon="['fas', 'code']" class="mr-1.5" />
                  JSON预览
                </button>
                <button
                  @click="saveStoryboard"
                  :disabled="isSavingStoryboard"
                  class="px-4 py-1.5 bg-brand-green text-white rounded-lg text-xs font-medium hover:bg-brand-green-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <fa :icon="isSavingStoryboard ? ['fas', 'circle-notch'] : ['fas', 'check']" :class="{'animate-spin': isSavingStoryboard}" class="mr-1.5" />
                  {{ isSavingStoryboard ? '保存中...' : '应用' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-8">
            <!-- Markdown View -->
            <div v-if="resultViewMode === 'markdown'" class="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-table:text-xs prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-code:text-brand-green prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded markdown-content">
              <div v-html="renderedMarkdown"></div>
            </div>

            <!-- Table View -->
            <div v-else-if="resultViewMode === 'table'">
              <!-- JSON Parse Error -->
              <div v-if="!parsedJsonData" class="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <div class="flex items-start gap-2">
                  <fa :icon="['fas', 'triangle-exclamation']" class="text-yellow-500 mt-0.5" />
                  <div class="flex-1">
                    <h4 class="font-bold text-sm text-yellow-700 dark:text-yellow-400 mb-1">无法解析为表格</h4>
                    <p class="text-xs text-yellow-600 dark:text-yellow-300">当前内容无法解析为 JSON 格式，请确保 AI 输出了正确的 JSON 格式数据。</p>
                  </div>
                </div>
              </div>

              <!-- No Shots Data -->
              <div v-else-if="!parsedJsonData.shots || parsedJsonData.shots.length === 0" class="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <div class="flex items-start gap-2">
                  <fa :icon="['fas', 'triangle-exclamation']" class="text-yellow-500 mt-0.5" />
                  <div class="flex-1">
                    <h4 class="font-bold text-sm text-yellow-700 dark:text-yellow-400 mb-1">没有分镜数据</h4>
                    <p class="text-xs text-yellow-600 dark:text-yellow-300">JSON 中没有找到 shots 数组数据。</p>
                  </div>
                </div>
              </div>

              <!-- Table Content -->
              <div v-else>
                <div v-if="parsedJsonData.title" class="mb-6">
                  <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ parsedJsonData.title }}</h3>
                </div>

                <!-- Table -->
                <div class="overflow-x-auto">
                  <table class="w-full text-sm border-collapse">
                    <thead>
                      <tr class="bg-gray-100 dark:bg-[#1C1C1E]">
                        <th class="border border-gray-300 dark:border-gray-600 px-3 py-3 text-center font-semibold">镜号</th>
                        <th class="border border-gray-300 dark:border-gray-600 px-3 py-3 text-center font-semibold">景别</th>
                        <th class="border border-gray-300 dark:border-gray-600 px-3 py-3 text-center font-semibold">运镜</th>
                        <th class="border border-gray-300 dark:border-gray-600 px-3 py-3 text-left font-semibold">画面内容</th>
                        <th class="border border-gray-300 dark:border-gray-600 px-3 py-3 text-left font-semibold">音频</th>
                        <th class="border border-gray-300 dark:border-gray-600 px-3 py-3 text-center font-semibold">时长</th>
                        <th class="border border-gray-300 dark:border-gray-600 px-3 py-3 text-left font-semibold">备注</th>
                        <th class="border border-gray-300 dark:border-gray-600 px-3 py-3 text-left font-semibold">文生图提示词</th>
                        <th class="border border-gray-300 dark:border-gray-600 px-3 py-3 text-left font-semibold">图生视频提示词</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="shot in parsedJsonData.shots" :key="shot.id" class="hover:bg-gray-50 dark:hover:bg-[#2C2C2E]">
                        <td class="border border-gray-300 dark:border-gray-600 px-3 py-3 text-center font-bold">{{ shot.id }}</td>
                        <td class="border border-gray-300 dark:border-gray-600 px-3 py-3 text-center">{{ shot.shotType }}</td>
                        <td class="border border-gray-300 dark:border-gray-600 px-3 py-3 text-center">{{ shot.cameraMove }}</td>
                        <td class="border border-gray-300 dark:border-gray-600 px-3 py-3">{{ shot.visualContent }}</td>
                        <td class="border border-gray-300 dark:border-gray-600 px-3 py-3">{{ shot.audio }}</td>
                        <td class="border border-gray-300 dark:border-gray-600 px-3 py-3 text-center">{{ shot.duration }}s</td>
                        <td class="border border-gray-300 dark:border-gray-600 px-3 py-3">{{ shot.remark }}</td>
                        <td class="border border-gray-300 dark:border-gray-600 px-3 py-3">
                          <div class="space-y-2">
                            <div v-if="shot.text2imgPrompt && shot.text2imgPrompt.positive">
                              <strong class="text-green-600 dark:text-green-400">正向：</strong>
                              <div class="text-gray-700 dark:text-gray-300 mt-1">{{ shot.text2imgPrompt.positive.join(', ') }}</div>
                            </div>
                            <div v-if="shot.text2imgPrompt && shot.text2imgPrompt.negative">
                              <strong class="text-red-600 dark:text-red-400">反向：</strong>
                              <div class="text-gray-700 dark:text-gray-300 mt-1">{{ shot.text2imgPrompt.negative.join(', ') }}</div>
                            </div>
                          </div>
                        </td>
                        <td class="border border-gray-300 dark:border-gray-600 px-3 py-3">
                          <div class="space-y-2">
                            <div v-if="shot.img2videoPrompt && shot.img2videoPrompt.positive">
                              <strong class="text-green-600 dark:text-green-400">正向：</strong>
                              <div class="text-gray-700 dark:text-gray-300 mt-1">{{ shot.img2videoPrompt.positive.join(', ') }}</div>
                            </div>
                            <div v-if="shot.img2videoPrompt && shot.img2videoPrompt.negative">
                              <strong class="text-red-600 dark:text-red-400">反向：</strong>
                              <div class="text-gray-700 dark:text-gray-300 mt-1">{{ shot.img2videoPrompt.negative.join(', ') }}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- JSON Preview Modal -->
    <teleport to="body">
      <div
        v-if="showJsonPreview"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click="showJsonPreview = false"
      >
        <div
          class="bg-white dark:bg-[#2C2C2E] rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#3A3A3C]">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <fa :icon="['fas', 'code']" class="text-purple-500 text-lg" />
              </div>
              <div>
                <h3 class="text-lg font-bold text-primary dark:text-gray-200">JSON 数据预览</h3>
                <p class="text-xs text-secondary dark:text-gray-400">查看原始 JSON 格式数据</p>
              </div>
            </div>
            <button
              @click="showJsonPreview = false"
              class="p-2 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg transition"
            >
              <fa :icon="['fas', 'xmark']" class="text-gray-400" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6">
            <pre class="bg-gray-50 dark:bg-[#1C1C1E] rounded-lg p-4 text-xs font-mono overflow-x-auto" v-html="highlightedJson"></pre>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-[#3A3A3C] bg-gray-50 dark:bg-[#1C1C1E]">
            <button
              @click="() => { navigator.clipboard.writeText(JSON.stringify(parsedJsonData, null, 2)); showJsonPreview = false }"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2C2C2E] rounded-lg transition"
            >
              <fa :icon="['fas', 'copy']" class="mr-2" />
              复制
            </button>
            <button
              @click="showJsonPreview = false"
              class="px-4 py-2 text-sm font-medium bg-brand-green text-white rounded-lg hover:bg-brand-green-dark transition"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- System Prompt Modal -->
    <teleport to="body">
      <div
        v-if="showSystemPromptModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click="showSystemPromptModal = false"
      >
        <div
          class="bg-white dark:bg-[#2C2C2E] rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#3A3A3C]">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-brand-green/10 flex items-center justify-center">
                <fa :icon="['fas', 'file-lines']" class="text-brand-green text-lg" />
              </div>
              <div>
                <h3 class="text-lg font-bold text-primary dark:text-gray-200">系统提示词</h3>
                <p class="text-xs text-secondary dark:text-gray-400">设置 AI 的角色和行为规范</p>
              </div>
            </div>
            <button
              @click="showSystemPromptModal = false"
              class="p-2 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg transition"
            >
              <fa :icon="['fas', 'xmark']" class="text-gray-400" />
            </button>
          </div>

          <!-- Content -->
          <div class="p-6">
            <!-- Type Selector -->
            <div class="flex items-center gap-6 mb-4">
              <label
                @click="systemPromptType = 'preset'"
                class="flex items-center gap-2 cursor-pointer group"
              >
                <div class="flex items-center justify-center w-5 h-5 rounded-full border-2 transition"
                  :class="systemPromptType === 'preset'
                    ? 'border-brand-green'
                    : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400'"
                >
                  <div v-if="systemPromptType === 'preset'" class="w-3 h-3 rounded-full bg-brand-green"></div>
                </div>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition">预设</span>
              </label>

              <label
                @click="systemPromptType = 'custom'"
                class="flex items-center gap-2 cursor-pointer group"
              >
                <div class="flex items-center justify-center w-5 h-5 rounded-full border-2 transition"
                  :class="systemPromptType === 'custom'
                    ? 'border-brand-green'
                    : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400'"
                >
                  <div v-if="systemPromptType === 'custom'" class="w-3 h-3 rounded-full bg-brand-green"></div>
                </div>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition">自定义</span>
              </label>
            </div>

            <!-- Preset View (Read-only with Markdown rendering) -->
            <div v-if="systemPromptType === 'preset'">
              <div class="relative">
                <div
                  class="w-full h-[32rem] px-4 py-3 border border-gray-200 dark:border-[#3A3A3C] rounded-lg bg-gray-50 dark:bg-[#1C1C1E] overflow-y-auto markdown-content"
                  v-html="marked.parse(presetSystemPrompt)"
                ></div>
                <div class="absolute top-3 right-3 px-2 py-1 bg-gray-200 dark:bg-[#3A3A3C] rounded text-xs font-medium text-gray-600 dark:text-gray-400">
                  只读
                </div>
              </div>
            </div>

            <!-- Custom View (Editable) -->
            <div v-else>
              <textarea
                v-model="systemPrompt"
                placeholder="例如：你是一个专业的 UI 设计师，擅长现代化的界面设计..."
                class="w-full h-[32rem] px-4 py-3 border border-gray-200 dark:border-[#3A3A3C] rounded-lg bg-white dark:bg-[#1C1C1E] text-primary dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition"
              ></textarea>
            </div>

            <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div class="flex items-start gap-2">
                <fa :icon="['fas', 'circle-info']" class="text-blue-500 mt-0.5 text-sm" />
                <div class="flex-1">
                  <p class="text-xs text-blue-700 dark:text-blue-300">
                    <span v-if="systemPromptType === 'preset'">
                      预设提示词专为小说章节分析优化，提供最佳的分析效果。
                    </span>
                    <span v-else>
                      自定义提示词会在每次对话时发送给 AI，用于定义 AI 的角色、专业领域和回答风格。
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-[#3A3A3C] bg-gray-50 dark:bg-[#1C1C1E]">
            <button
              @click="systemPrompt = ''; showSystemPromptModal = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2C2C2E] rounded-lg transition"
            >
              清空
            </button>
            <button
              @click="showSystemPromptModal = false"
              class="px-4 py-2 text-sm font-medium bg-brand-green text-white rounded-lg hover:bg-brand-green-dark transition"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Toast Notification -->
    <teleport to="body">
      <transition name="toast">
        <div v-if="showToast" class="fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg"
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
        v-if="showMediaVideoPreview && currentVideoPreview"
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
                :src="currentMediaVideoPreview.src"
                controls
                preload="metadata"
                class="w-full h-full max-h-[70vh] rounded-lg"
                @error="(e) => console.error('Video load error:', e, 'URL:', currentMediaVideoPreview.src)"
                @loadedmetadata="() => console.log('Video loaded:', currentMediaVideoPreview.src)"
              >
                您的浏览器不支持视频播放
              </video>
            </div>

            <!-- Right: Info Panel -->
            <div class="w-96 border-l border-gray-200 dark:border-[#3A3A3C] flex flex-col">
              <!-- Tabs -->
              <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-[#3A3A3C]">
                <button 
                  @click="mediaVideoPreviewTab = 'structure'"
                  class="px-3 py-1.5 text-sm rounded-lg transition"
                  :class="mediaVideoPreviewTab === 'structure' ? 'bg-brand-green text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#3A3A3C]'"
                >
                  结构化列表
                </button>
                <button 
                  @click="mediaVideoPreviewTab = 'json'"
                  class="px-3 py-1.5 text-sm rounded-lg transition"
                  :class="mediaVideoPreviewTab === 'json' ? 'bg-brand-green text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#3A3A3C]'"
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
                <div v-if="mediaVideoPreviewTab === 'structure'" class="space-y-3">
                  <!-- Row 1: Video Name -->
                  <div class="bg-gray-50 dark:bg-[#3A3A3C] rounded-lg p-3">
                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">视频名称</div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{{ currentMediaVideoPreview.label }}</div>
                  </div>
                  
                  <!-- Row 2: Scene Tags -->
                  <div class="bg-gray-50 dark:bg-[#3A3A3C] rounded-lg p-3">
                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">画面和场景关键词</div>
                    <div class="flex flex-wrap gap-1.5">
                      <span 
                        v-for="(tag, index) in currentMediaVideoPreview.sceneTags || []" 
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
                      {{ currentMediaVideoPreview.videoText || '暂无音频文本' }}
                    </div>
                  </div>
                  
                  <!-- Row 4: Summary -->
                  <div class="bg-gray-50 dark:bg-[#3A3A3C] rounded-lg p-3">
                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">视频总结描述</div>
                    <div class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {{ currentMediaVideoPreview.summary || '暂无描述' }}
                    </div>
                  </div>
                  
                  <!-- Row 5: Metadata -->
                  <div class="bg-gray-50 dark:bg-[#3A3A3C] rounded-lg p-3">
                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">元数据</div>
                    <div class="space-y-2">
                      <div class="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span class="text-gray-500 dark:text-gray-400">时长:</span>
                          <span class="ml-1 text-gray-900 dark:text-white font-medium">{{ currentMediaVideoPreview.duration || '未知' }}</span>
                        </div>
                        <div>
                          <span class="text-gray-500 dark:text-gray-400">分辨率:</span>
                          <span class="ml-1 text-gray-900 dark:text-white font-medium">{{ currentMediaVideoPreview.resolution || '未知' }}</span>
                        </div>
                        <div>
                          <span class="text-gray-500 dark:text-gray-400">比例:</span>
                          <span class="ml-1 text-gray-900 dark:text-white font-medium">{{ currentMediaVideoPreview.aspectRatio || '未知' }}</span>
                        </div>
                        <div>
                          <span class="text-gray-500 dark:text-gray-400">帧率:</span>
                          <span class="ml-1 text-gray-900 dark:text-white font-medium">{{ currentMediaVideoPreview.frameRate || '未知' }}</span>
                        </div>
                        <div>
                          <span class="text-gray-500 dark:text-gray-400">类型:</span>
                          <span class="ml-1 text-gray-900 dark:text-white font-medium">{{ currentMediaVideoPreview.type.toUpperCase() }}</span>
                        </div>
                        <div>
                          <span class="text-gray-500 dark:text-gray-400">大小:</span>
                          <span class="ml-1 text-gray-900 dark:text-white font-medium">{{ currentMediaVideoPreview.size || '未知' }}</span>
                        </div>
                      </div>
                      <div class="pt-2 border-t border-gray-200 dark:border-[#48484A]">
                        <div class="text-xs mb-1">
                          <span class="text-gray-500 dark:text-gray-400">文件名:</span>
                          <span class="ml-1 text-gray-900 dark:text-white font-mono text-[11px]">{{ currentMediaVideoPreview.label }}</span>
                        </div>
                        <div class="text-xs mb-1">
                          <span class="text-gray-500 dark:text-gray-400">UUID:</span>
                          <span class="ml-1 text-gray-900 dark:text-white font-mono text-[11px]">{{ currentMediaVideoPreview.uuid || '未知' }}</span>
                        </div>
                        <div class="text-xs">
                          <span class="text-gray-500 dark:text-gray-400">短链:</span>
                          <a :href="currentMediaVideoPreview.shortUrl" target="_blank" class="ml-1 text-brand-green hover:underline font-mono text-[11px]">
                            {{ currentMediaVideoPreview.shortUrl || currentMediaVideoPreview.src }}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- JSON Tab -->
                <div v-else-if="mediaVideoPreviewTab === 'json'" class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre class="text-xs text-green-400 font-mono">{{ JSON.stringify(currentMediaVideoPreview, null, 2) }}</pre>
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
/* Markdown table styles */
.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
}

.markdown-content :deep(table thead) {
  background-color: #f3f4f6;
}

.dark .markdown-content :deep(table thead) {
  background-color: #374151;
}

.markdown-content :deep(table th),
.markdown-content :deep(table td) {
  border: 1px solid #d1d5db;
  padding: 0.5rem 0.75rem;
  text-align: left;
}

.dark .markdown-content :deep(table th),
.dark .markdown-content :deep(table td) {
  border-color: #4b5563;
}

.markdown-content :deep(table th) {
  font-weight: 600;
  font-size: 0.75rem;
}

.markdown-content :deep(table tbody tr:hover) {
  background-color: #f9fafb;
}

.dark .markdown-content :deep(table tbody tr:hover) {
  background-color: #1f2937;
}

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

/* System Prompt Modal Markdown Styles */
.markdown-content :deep(h1) {
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  color: #1f2937;
}

.dark .markdown-content :deep(h1) {
  color: #f3f4f6;
}

.markdown-content :deep(h2) {
  font-size: 1.25rem;
  font-weight: bold;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: #374151;
}

.dark .markdown-content :deep(h2) {
  color: #e5e7eb;
}

.markdown-content :deep(h3) {
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  color: #4b5563;
}

.dark .markdown-content :deep(h3) {
  color: #d1d5db;
}

.markdown-content :deep(p) {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
}

.markdown-content :deep(li) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.markdown-content :deep(ul ul),
.markdown-content :deep(ol ul),
.markdown-content :deep(ul ol),
.markdown-content :deep(ol ol) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.markdown-content :deep(code) {
  background-color: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: monospace;
}

.dark .markdown-content :deep(code) {
  background-color: #374151;
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: #111827;
}

.dark .markdown-content :deep(strong) {
  color: #f9fafb;
}

.markdown-content :deep(hr) {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  border-color: #e5e7eb;
}

.dark .markdown-content :deep(hr) {
  border-color: #4b5563;
}

/* Compact Model Selector Styles - Only for storyboard section */
.compact-model-selector :deep(> div > button) {
  padding: 0.25rem 0.5rem !important;
  font-size: 0.75rem !important;
  min-width: 150px;
  max-width: 200px;
  background-color: white !important;
  border: 1px solid #e5e7eb !important;
}

.dark .compact-model-selector :deep(> div > button) {
  background-color: #2C2C2E !important;
  border-color: #3A3A3C !important;
}

.compact-model-selector :deep(> div > button):hover {
  background-color: #f9fafb !important;
}

.dark .compact-model-selector :deep(> div > button):hover {
  background-color: #3A3A3C !important;
}

.compact-model-selector :deep(> div > button .absolute.left-3) {
  left: 0.5rem !important;
}

.compact-model-selector :deep(> div > button .absolute.right-3) {
  right: 0.5rem !important;
}

.compact-model-selector :deep(> div > button span) {
  padding-left: 1.75rem !important;
  padding-right: 1.25rem !important;
}
</style>
