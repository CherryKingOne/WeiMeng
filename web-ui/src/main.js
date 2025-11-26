import './assets/base.css'
import './assets/tailwind.css'
import './assets/main.css'

import { createApp, watch } from 'vue'
import App from './App.vue'
import i18n from './i18n'
import router from './router'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCubes, faSearch, faRobot, faLayerGroup, faUsers, faHistory, faCode, faCheckCircle, faArrowRight, faArrowLeft, faEnvelope, faLock, faUnlock, faEye, faEyeSlash, faPlus, faClock, faFile, faLightbulb, faStar, faShoppingCart, faPlusCircle, faTrash, faQuestionCircle, faBell, faChevronDown, faChevronRight, faThLarge, faList, faEllipsisH, faRocket, faBars, faCloud, faMousePointer, faSquare, faCrop, faPenNib, faPlay, faPlayCircle, faUpload, faDice, faMinus, faBolt, faAlignLeft, faAlignCenter, faAlignRight, faAlignJustify, faGripLines, faGripLinesVertical, faFont, faICursor, faWandMagicSparkles, faPaperPlane, faMoon, faSun, faImages, faImage, faDownload, faTable, faTableColumns, faFolder, faStream, faBarsStaggered, faMobileScreenButton, faCalendarDays, faSliders, faTriangleExclamation, faPalette, faTag, faTags, faChartBar, faChartLine, faChartPie, faTasks, faWindowRestore, faIndent, faGhost, faSitemap, faDiagramProject, faGauge, faFileLines, faRuler, faXmark, faSearchMinus, faSearchPlus, faToggleOn, faCircleDot, faSquareCheck, faCommentDots, faCaretDown, faUser, faGear, faBook, faLifeRing, faCircleInfo, faPenToSquare, faCheck, faClapperboard, faVideo, faMagic, faPen, faFilm, faFileVideo, faMusic, faScissors, faScaleBalanced, faBullseye, faCube, faArrowUpRightFromSquare, faCircleQuestion, faBookOpen } from '@fortawesome/free-solid-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons'

library.add(
  faCubes, faSearch, faRobot, faLayerGroup, faUsers, faHistory, faCode, faCheckCircle, faArrowRight, faEnvelope, faLock, faEye, faEyeSlash, faPlus, faClock, faFile, faLightbulb, faStar, faShoppingCart, faPlusCircle, faTrash, faQuestionCircle, faBell, faChevronDown, faChevronRight, faThLarge, faList, faEllipsisH, faRocket, faBars, faCloud, faMousePointer, faSquare, faCrop, faPenNib, faPlay, faPlayCircle, faUpload, faDice, faMinus, faBolt, faAlignLeft, faAlignCenter, faAlignRight, faAlignJustify, faGripLines, faGripLinesVertical, faFont, faICursor, faWandMagicSparkles, faPaperPlane, faMoon, faSun, faImages, faImage, faDownload, faTable, faTableColumns, faFolder, faStream, faBarsStaggered, faMobileScreenButton, faCalendarDays, faSliders, faTriangleExclamation, faPalette, faTag, faTags, faChartBar, faChartLine, faChartPie, faTasks, faWindowRestore, faIndent, faGhost, faSitemap, faDiagramProject, faGauge, faFileLines, faRuler, faXmark, faSearchMinus, faSearchPlus, faToggleOn, faCircleDot, faSquareCheck, faCommentDots, faCaretDown,
  faUser, faGear, faBook, faLifeRing, faCircleInfo, faPenToSquare, faCheck,
  faArrowLeft, faClapperboard, faVideo, faMagic, faPen, faFilm, faFileVideo, faMusic, faScissors,
  faScaleBalanced, faBullseye,
  faGithub,
  faCube, faArrowUpRightFromSquare, faCircleQuestion, faBookOpen
)

const app = createApp(App).component('fa', FontAwesomeIcon).use(i18n).use(router)
app.mount('#app')

const setTitleAndLang = (loc) => {
  const isZh = String(loc || '').toLowerCase().startsWith('zh')
  document.title = isZh ? '维梦' : 'WeiMeng'
  document.documentElement.lang = isZh ? 'zh-CN' : 'en'
}

setTitleAndLang(i18n.global.locale?.value || i18n.global.locale)
if (i18n.global?.locale) {
  const localeRef = i18n.global.locale
  if (localeRef && typeof localeRef === 'object' && 'value' in localeRef) {
    watch(localeRef, (loc) => setTitleAndLang(loc))
  }
}
