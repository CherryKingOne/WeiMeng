# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

WeiMeng (唯梦) 是一个 AI 辅助的短剧/视频制作平台,基于 Vue 3 + Vite 构建。应用包含营销网站(支持国际化)、工作区(项目管理)和工作室界面(剧本创作、角色管理、分镜生成和视频编辑)。

## 开发环境要求

**Node.js**: 需要 Node.js ^20.19.0 或 >=22.12.0 (在 package.json 的 engines 字段中定义)

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器 (http://localhost:5173)
npm run dev

# 生产环境构建
npm run build

# 预览生产构建
npm run preview
```

## 架构设计

**技术栈**: Vue 3 (Composition API)、Vue Router、Vue I18n、Vite、Tailwind CSS、FontAwesome、JSZip

**入口文件**: src/main.js 初始化应用,配置 i18n、路由和 FontAwesome 图标

**路由系统**: src/router/index.js 定义路由及认证守卫:
- `/` - 首页(营销页面,带 header/footer)
- `/login` - 登录页
- `/workspace` - 工作区视图(项目管理,需要认证)
- `/studio` - 工作室界面(StudioDrama.vue - 短剧制作编辑器,需要认证)

**认证机制**: 带有 `meta: { requiresAuth: true }` 的路由会检查 localStorage('loggedIn'),未认证则重定向到登录页

**布局逻辑**: App.vue 根据 route.name 使用计算属性条件性地显示 Header/Footer(仅在首页显示)

**国际化**: src/i18n.js 包含中英文翻译。语言设置持久化到 localStorage('locale')。所有用户界面文本应使用 i18n 键,通过 $t() 或 {{ $t('key') }} 调用。

**样式系统**: Tailwind CSS 是主要样式系统。自定义样式位于 src/assets/(按顺序加载 base.css、tailwind.css、main.css)

**图标系统**: FontAwesome 图标在 main.js 中注册。使用 `<fa :icon="['fas', 'icon-name']" />` 组件。所有图标必须先在 main.js 中导入并添加到 library 才能使用。

**路径别名**: `@` 解析为 `src/` 目录(在 vite.config.js 中配置)

**主题系统**: 深色/浅色模式通过 localStorage('theme') 管理,并应用到文档根元素的 class('dark' class)。每个视图(Workspace、Studio)通过 applyTheme() 函数实现自己的主题应用逻辑。

**环境变量**:
- `VITE_API_BASE` - 后端 API 基础 URL,默认为 'http://localhost:7767'。在 .env 文件中配置或通过环境变量设置。

**自动标题和语言**: main.js 中的 `setTitleAndLang()` 函数根据 i18n locale 自动设置:
- 中文环境: document.title = '维梦', lang = 'zh-CN'
- 英文环境: document.title = 'WeiMeng', lang = 'en'
- 通过 watch 监听 locale 变化实时更新

## 工作区视图 (src/views/Workspace.vue)

工作区是主要的项目管理界面,具有复杂的状态管理:

**模态框架构**: 使用 Vue 的 `<teleport to="body">` 确保所有模态框的 z-index 正确堆叠:
- 设置模态框(`showSettings`) - 多标签工作区配置
- 账户模态框(`showAccount`) - 用户资料管理,支持内联编辑
- 密码重置模态框(`showReset`) - 带验证码的密码修改流程
- 修改邮箱模态框(`showChangeEmail`) - 两阶段验证的邮箱修改(当前+新邮箱)
- 创建项目模态框(`showCreateModal`) - 新建项目,带验证
- 复制项目模态框(`showDuplicate`) - 项目复制,自定义命名
- 添加成员模态框(`showAddMember`) - 团队成员邀请
- 邀请链接模态框(`showInviteLink`) - 添加成员后分享邀请链接

**模态框模式**: 每个模态框遵循以下结构:
1. 布尔 ref 控制可见性(如 `showSettings`)
2. 打开函数先关闭用户菜单,等待 nextTick,然后显示模态框
3. 关闭函数重置模态框状态并清空表单数据
4. 点击背景关闭(通过背景 div 的 `@click`)
5. 表单验证使用错误 refs(如 `nameError`、`permError`)

**状态管理模式**:
- 搜索/过滤: `headerSearch` ref 配合计算属性 `filteredProjects`、`filteredFavoritesByHeader` 等
- 区域导航: `currentSection` ref('drafts'、'favorites'、'recent'、'team'、'recycle')
- 视图模式: `viewMode` ref('grid' 或 'list')
- 排序: `sortOption` ref('modified'、'name') 配合 `sortOrder` ref('asc'、'desc')
- 菜单跟踪: `openMenuId` ref 用于项目菜单,`roleMenuForId` ref 用于成员角色菜单

**全局点击处理器**: 文档级点击监听器(`onDocClick`)关闭所有打开的菜单/下拉框。在下拉框内的交互元素上使用 `@click.stop` 防止事件传播。处理器检查特定的 data 属性(如 `data-project-menu`、`data-project-menu-button`)。

**提示/通知系统**:
- `toastOpen` + `toastText` + `toastType` 用于临时成功/错误消息
- `copyHintOpen` + `copyHintText` 用于剪贴板反馈
- 使用 setTimeout 2 秒后自动关闭

**成员管理**:
- 成员列表带搜索功能(`searchQuery` + `filteredMembers` 计算属性)
- 角色菜单系统使用 `roleMenuForId` ref 跟踪哪个成员的菜单打开
- 使用 window.prompt 内联编辑管理员和成员名称

## 工作室视图 (src/views/StudioDrama.vue)

工作室是短剧制作界面,包含完整视频制作工作流的七个主要标签:

**标签系统**: `activeTab` ref 在以下标签间切换:
- `'files'` - 剧本文件管理
- `'novelAnalysis'` - 小说拆解(章节分析)
- `'storyboard'` - 分镜生成
- `'videoAssets'` - 视频素材管理(Beta)
- `'audioAssets'` - 音频素材管理(Beta)
- `'video'` - 视频剪辑(Beta)
- `'publish'` - 多平台管理(Beta)

**Beta 功能限制**: 标记为 Beta 的标签在点击时会显示"功能正在开发中"横幅,并阻止标签切换。

**文件管理标签** (`activeTab === 'files'`):
- 拖放或点击上传 .txt、.md、.doc、.docx、.csv、.xlsx、.pdf(最大 10MB)
- `existingFiles` ref 跟踪文件的 `selected` 状态、上传进度和完成状态
- 文件通过 `uploadFileToBackend()` 使用 XMLHttpRequest 自动上传到后端以跟踪进度
- `loadExistingFiles()` 从后端获取文件,使用正则表达式保留大整数 ID
- 文件选择系统带复选框: `fileListSelectAll` ref 和 `toggleFileSelection()` 函数
- 批量删除功能: `batchDeleteFiles()` 通过 API 删除多个选中文件
- 自定义删除确认模态框(`showDeleteFileConfirm`)而非浏览器 confirm
- Toast 通知(`showToast`、`toastMessage`、`toastType`)用于成功/错误反馈

**小说拆解标签** (`activeTab === 'novelAnalysis'`):
- 章节列表显示,支持选择章节进行分析
- `novelChapters` ref 存储章节数据,`selectedChapter` ref 跟踪当前选中章节
- `loadNovelChapters()` 从后端加载章节,404 时显示示例章节
- 分析结果显示在四个子标签中: 角色、场景、情节、对话
- 分析配置模态框(`showSystemPromptModal`)包含四个配置子标签:
  - `'visual'` - 风格配置(2D Anime/Realistic)和语言选择(English/Chinese)
  - `'prompt'` - 提示词配置,支持预设/自定义两种类型
  - `'variables'` - 输出变量配置(Beta 功能,开发中)
  - `'json'` - JSON 预览,显示处理结果
- `analysisConfig` ref 存储配置: style, language, promptType, tab, systemPrompt 等
- 预设提示词通过 `getPresetPrompt()` 函数生成,用于 AIGC 视频分镜生成

**分镜生成标签** (`activeTab === 'storyboard'`):
- 通过 `storyboardView` ref 两种视图模式:'compact'(网格卡片)或 'detail'(表格)
- `storyboards` ref 数组包含镜头数据: 场景、尺寸、镜头类型、时长、描述、对话、音效、提示词、生成标志
- 批量操作: `generateAllImages()`、`generateAllVideos()` 打开尺寸选择模态框
- 尺寸模态框(`showSizeModal`)带宽高比选项(1:1、4:3、3:4、16:9、9:16、3:2、2:3、21:9)
- 操作菜单(`openActionMenuId`)用于单个镜头的重新生成/删除,使用 teleport 下拉框
- 导出菜单三个选项: 剧本 CSV、图片 ZIP(使用 JSZip)、视频 CSV
- `ratioOptions` 数组定义每个宽高比的像素尺寸

**视频标签** (`activeTab === 'video'`):
- 媒体库侧边栏支持拖放导入
- `mediaLibrary` 计算属性组合生成的分镜资源 + `externalMedia` ref
- 预览窗口显示选中的媒体(`currentPreview` ref)
- 时间轴包含视频/音频轨道,支持从媒体库拖放
- `timelineItems` ref 跟踪放置的片段,包含轨道、标签、时长
- `getItemStyle()` 计算片段定位(每秒 40px)
- 拖放处理器: `handleDragStart()`、`handleTimelineDrop()`、`handleMediaDrop()`

**模态框架构**: 所有模态框使用 `<teleport to="body">`:
- 角色创建模态框,带图片上传
- 角色提取向导(多步骤)
- 图片/视频生成的尺寸选择模态框
- 操作菜单下拉框(绝对定位)

**主题系统**: `theme` ref('light'/'dark'),`toggleTheme()` 将 'dark' class 应用到文档根元素

**状态管理模式**:
- 菜单跟踪: `openActionMenuId` 用于分镜操作菜单,`openExportMenu` 用于导出下拉框
- 文件上传: `isDragging` 用于拖动状态,`fileInput` ref 用于隐藏的 input 触发器
- 媒体: `mediaIsDragging` 用于视频标签拖动状态,`mediaFileInput` ref
- 向导状态: `extractStep`(1-7),`selectAll` 用于批量选择,`roleEditing`/`roleDetailsOpen` reactive 对象
- 风格选择: `styleKind`/`sceneStyleKind`('2d'/'live'),`selectedCharacterStyle`/`selectedSceneStyle`

**多平台发布管理标签** (`activeTab === 'publish'`):
多平台发布管理是一个企业级的数据仪表板,参考巨量引擎设计,包含完整的平台管理、数据分析和AI辅助功能。

**子标签系统**: `publishSubTab` ref 在以下子标签间切换:
- `'overview'` - 数据概览(默认)
- `'platforms'` - 平台管理
- `'messages'` - 消息中心
- `'violations'` - 违禁管理
- `'aiService'` - AI 客服
- `'competitors'` - 竞品分析

**数据概览子标签** (`publishSubTab === 'overview'`):
- 关键指标卡片(4个):
  - 总播放量 - 蓝色眼睛图标
  - 总点赞数 - 红色心形图标
  - 总评论数 - 黄色评论图标
  - 总分享数 - 紫色分享图标
  - 每个卡片显示: 当前数值、较昨日增长百分比、彩色图标
- 平台连接状态面板(左侧,占2/3宽度):
  - 紧凑的平台卡片网格(2x3布局)
  - 支持的平台: 抖音、快手、小红书、哔哩哔哩、视频号、YouTube
  - 每个平台显示: 品牌图标、平台名称、连接状态(未连接/已连接)
- AI 分析管家面板(右侧,占1/3宽度):
  - 数据观测 - 实时标签
  - 智能建议 - Beta标签
  - 趋势预测 - AI标签
- 最近动态面板 - 显示平台活动和通知
- 快捷操作面板(4个按钮):
  - 发布视频 - 品牌绿色上传图标
  - 查看数据 - 蓝色图表图标
  - 消息管理 - 黄色消息图标
  - 违禁检测 - 红色盾牌图标

**平台管理子标签** (`publishSubTab === 'platforms'`):
- 6个平台的详细卡片展示(3列网格布局)
- 每个平台卡片包含:
  - 平台品牌图标(渐变背景)
  - 平台名称和连接状态
  - "连接账号"操作按钮
- 支持的平台及其视觉标识:
  - 抖音: 黑色背景,白色"抖"字
  - 快手: 橙红渐变背景,白色"快"字
  - 小红书: 红粉渐变背景,白色"小"字
  - 哔哩哔哩: 粉蓝渐变背景,白色"B"字
  - 微信视频号: 绿色背景,白色"视"字
  - YouTube: 红色背景,白色"YT"字

**消息中心子标签** (`publishSubTab === 'messages'`):
- 页面标题和筛选按钮
- 空状态提示: 信封图标 + 引导文案
- 功能说明: "连接平台账号后，可在此查看和管理所有平台的消息"

**违禁管理子标签** (`publishSubTab === 'violations'`):
- 统计卡片(3个):
  - 违禁词库 - 红色书本图标,显示关键词数量
  - 检测次数 - 蓝色盾牌图标,显示本月检测次数
  - 拦截记录 - 黄色禁止图标,显示被拦截内容数
- AI 违禁检测功能区:
  - 标题和"开始检测"按钮
  - 机器人图标 + 功能说明
  - 使用说明: "使用 AI 智能检测内容合规性"

**AI 客服子标签** (`publishSubTab === 'aiService'`):
- 自动回复设置面板(左侧):
  - 智能回复开关 - "AI 自动回复用户消息"
  - 关键词回复开关 - "根据关键词自动回复"
  - 使用 Tailwind CSS peer 类实现的切换开关组件
- 服务统计面板(右侧):
  - 今日回复数
  - 平均响应时间
  - 用户满意度
  - 数据以大号字体显示,未连接时显示 "--"

**竞品分析子标签** (`publishSubTab === 'competitors'`):
- 页面标题和"添加竞品账号"按钮
- 空状态引导:
  - 图表线条图标
  - 标题: "开始竞品分析"
  - 说明: "添加竞品账号，AI 将自动分析其内容策略和数据表现"
  - CTA按钮: "添加第一个竞品"

**状态管理**:
- `publishSubTab` ref - 跟踪当前激活的子标签页
- `switchPublishSubTab(subTab)` - 切换子标签页的函数
- 标签按钮使用动态 class 绑定:
  - 激活状态: `border-brand-green text-brand-green`
  - 未激活状态: `border-transparent text-secondary hover:text-primary`

**UI/UX 特点**:
- 专业的企业级数据仪表板设计
- 清晰的信息层级和视觉分组
- 紧凑的布局充分利用空间
- 完整的深色模式支持
- 响应式网格布局(移动端/平板/桌面)
- 友好的空状态设计和引导文案
- 平滑的过渡动画和交互反馈
- 统一的品牌色(brand-green)和视觉语言

**关键模式**:
- 使用 DOM 测量和镜像 div 技术的光标定位 AI 对话框
- 使用 interval 和 chunk 计数的文件处理模拟
- 带正确转义和 UTF-8 BOM 的 CSV 导出
- 使用 JSZip 的批量图片下载 ZIP 导出
- 通过 dataTransfer 进行 JSON 序列化的拖放
- 过滤视图的计算属性: `visibleSegments`、`visibleFiles`、`sceneSegments`、`dialogueSegments`

## AI 模型配置系统

应用实现了两层模型配置架构,支持全局默认模型和剧本库级别的局部模型:

**全局默认模型** (Workspace.vue):
- 在工作区设置中配置,对所有剧本库生效
- API: `GET/POST /api/v3/chat/default-model?config_id={configId}`
- 配置包含: chat_model, embedding_model, rerank_model, stt_model, tts_model, video_model, image_model
- 函数: `loadDefaultModelConfig()`, `saveSystemModelSettings()`
- 控制台日志标签: `【全局】`

**局部模型** (StudioDrama.vue):
- 针对特定剧本库配置,优先级高于全局模型
- API: `POST /api/v3/chat/libraries/{libraryId}/local-model` (配置局部模型)
- API: `GET /api/v3/chat/libraries/{libraryId}/effective-model` (获取有效模型)
- 函数: `loadEffectiveModel()`, `configureLocalModel()`, `loadGlobalDefaultModel()`
- 控制台日志标签: `【局部】`、`【有效模型】`

**模型选择流程**:
1. 页面加载时调用 `fetchModels()` 加载可用模型列表
2. 调用 `loadEffectiveModel()` 获取当前剧本库的有效模型
3. 如果有局部配置,使用局部模型;否则使用全局默认模型
4. 如果 effective-model API 返回 404(新剧本库),自动回退到 `loadGlobalDefaultModel()`
5. 用户选择模型时,调用 `selectModel(modelId, configId)` 自动配置为局部模型

**404 错误处理**: 新创建的剧本库可能返回 404,这是正常的:
- `loadEffectiveModel()` - 404 时回退到全局默认模型
- `loadNovelChapters()` - 404 时只显示示例章节
- `loadExistingFiles()` - 404 时设置为空数组
- 不显示错误提示,静默处理

## 后端 API 集成

**基础 URL**: 通过 `API_BASE` 常量配置: `import.meta.env.VITE_API_BASE || 'http://localhost:7767'`

**认证**: 所有 API 请求包含 `Authorization: Bearer ${token}` 头,token 来自 localStorage('accessToken')

**主要 API 端点**:

*剧本库管理*:
- `GET /api/v1/script/libraries` - 列出剧本库
- `POST /api/v1/script/libraries` - 创建剧本库
- `DELETE /api/v1/script/libraries/{id}` - 删除剧本库
- `GET /api/v1/script/libraries/{id}/files` - 列出库中的文件
- `POST /api/v1/script/libraries/{id}/files` - 上传文件(multipart/form-data)
- `DELETE /api/v1/script/files/{fileId}` - 删除文件

*模型配置*:
- `GET /api/v3/chat/default-model?config_id={id}` - 获取全局默认模型配置
- `POST /api/v3/chat/default-model` - 保存全局默认模型配置
- `GET /api/v3/chat/libraries/{id}/effective-model` - 获取剧本库的有效模型(局部优先)
- `POST /api/v3/chat/libraries/{id}/local-model` - 配置剧本库的局部模型
- `GET /api/v2/model_config/list?model_type={type}` - 获取可用模型列表

**大整数处理**: 后端返回的 ID 是大整数(15+ 位数字),超过 JavaScript 的 `Number.MAX_SAFE_INTEGER`。为保持精度:
- JSON 解析前使用正则替换: `text.replace(/"id":(\d{15,})/g, '"id":"$1"')`
- 前端状态中始终将 ID 存储为字符串
- 参见 `loadExistingFiles()` 和 `loadLibraries()` 函数中的示例

**错误处理模式**:
- 401 响应通过 `router.push('/login')` 触发重定向到登录页
- 404 响应在新创建的资源上是正常的,应静默处理而非显示错误
- 使用自定义模态框而非 `window.confirm()` 或 `window.alert()`
- 显示 toast 通知用于成功/错误反馈

**调试日志约定**: 使用带标签的控制台日志便于调试:
- `【全局】` - 全局默认模型相关操作
- `【局部】` - 局部模型配置相关操作
- `【有效模型】` - 加载有效模型的操作
- `【章节加载】` - 章节加载相关操作
- `【文件加载】` - 文件加载相关操作
- `【模型选择】` - 用户选择模型的操作
- `[ModelSelector]` - 模型选择器组件的操作

## 可复用组件

**ModelSelector.vue** - AI 模型选择下拉组件:
- Props: `modelType`(模型类型)、`selectedModel`(当前选中模型)、`configId`(配置 ID)
- Emits: `update:selectedModel` - 模型选择变化时触发
- 功能: 从后端加载可用模型列表,显示下拉菜单供用户选择
- 使用场景: 工作区设置(全局模型)、工作室(局部模型)
- API: `GET /api/v2/model_config/list?model_type={type}`

## 状态管理模式

应用不使用 Vuex 或 Pinia,而是通过 Vue 3 Composition API 的 `ref()` 和 `reactive()` 进行组件级状态管理:

**常见模式**:
- 菜单/下拉框跟踪: `openMenuId` ref 跟踪哪个菜单打开
- 模态框可见性: 布尔 ref 控制显示/隐藏
- 表单状态 + 验证: 数据 ref + 错误 ref + 计算属性验证
- 搜索/过滤: 搜索 ref + 计算属性过滤列表
- Toast 通知: `toastOpen` + `toastText` + `toastType` + setTimeout 自动关闭

**全局点击处理器模式**:
```javascript
const onDocClick = (e) => {
  // 检查特定 data 属性防止关闭
  if (e?.target?.closest('[data-menu]')) return
  // 关闭所有菜单
  openMenuId.value = null
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
```

在下拉框内的交互元素上使用 `@click.stop` 防止事件传播。

## 关键约定

- 使用 Composition API 配合 `<script setup>`
- 所有用户界面文本必须通过 i18n 键国际化(注意: 当前实现中有混合的中英文硬编码文本,应迁移到 i18n)
- 组件按类型组织: layout/、sections/、icons/
- 路由组件放在 src/views/
- 模态框 z-index: 使用 z-50 确保正确堆叠
- 表单验证模式: 每个字段单独的错误 ref,提交时清除,验证失败时设置
- 显示模态框前使用 `nextTick()` 确保 DOM 更新完成
- 组件生命周期中清理定时器(使用 onBeforeUnmount 清除 intervals/timeouts)
- 对需要深度响应性的对象使用 `reactive()`(如文件上传进度跟踪)
- 避免浏览器默认对话框: 使用带 `<teleport to="body">` 的自定义模态框
