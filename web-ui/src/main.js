import './assets/base.css'
import './assets/tailwind.css'
import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import i18n from './i18n'
import router from './router'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCubes, faSearch, faRobot, faLayerGroup, faUsers, faHistory, faCode, faCheckCircle, faArrowRight, faArrowLeft, faEnvelope, faLock, faUnlock, faEye, faEyeSlash, faPlus, faClock, faFile, faLightbulb, faStar, faShoppingCart, faPlusCircle, faTrash, faQuestionCircle, faBell, faChevronDown, faChevronRight, faThLarge, faList, faEllipsisH, faRocket, faBars, faCloud, faMousePointer, faSquare, faCrop, faPenNib, faPlay, faPlayCircle, faUpload, faDice, faMinus, faBolt, faAlignLeft, faAlignCenter, faAlignRight, faAlignJustify, faGripLines, faGripLinesVertical, faFont, faICursor, faWandMagicSparkles, faPaperPlane, faMoon, faSun, faImages, faImage, faDownload, faTable, faTableColumns, faFolder, faStream, faBarsStaggered, faMobileScreenButton, faCalendarDays, faSliders, faTriangleExclamation, faPalette, faTag, faTags, faChartBar, faChartLine, faChartPie, faTasks, faWindowRestore, faIndent, faGhost, faSitemap, faDiagramProject, faGauge, faFileLines, faRuler, faXmark, faSearchMinus, faSearchPlus, faToggleOn, faCircleDot, faSquareCheck, faCommentDots, faCaretDown, faUser, faGear, faBook, faLifeRing, faCircleInfo, faPenToSquare, faCheck, faClapperboard, faVideo, faMagic, faPen, faFilm } from '@fortawesome/free-solid-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons'

library.add(
  faCubes, faSearch, faRobot, faLayerGroup, faUsers, faHistory, faCode, faCheckCircle, faArrowRight, faEnvelope, faLock, faEye, faEyeSlash, faPlus, faClock, faFile, faLightbulb, faStar, faShoppingCart, faPlusCircle, faTrash, faQuestionCircle, faBell, faChevronDown, faChevronRight, faThLarge, faList, faEllipsisH, faRocket, faBars, faCloud, faMousePointer, faSquare, faCrop, faPenNib, faPlay, faPlayCircle, faUpload, faDice, faMinus, faBolt, faAlignLeft, faAlignCenter, faAlignRight, faAlignJustify, faGripLines, faGripLinesVertical, faFont, faICursor, faWandMagicSparkles, faPaperPlane, faMoon, faSun, faImages, faImage, faDownload, faTable, faTableColumns, faFolder, faStream, faBarsStaggered, faMobileScreenButton, faCalendarDays, faSliders, faTriangleExclamation, faPalette, faTag, faTags, faChartBar, faChartLine, faChartPie, faTasks, faWindowRestore, faIndent, faGhost, faSitemap, faDiagramProject, faGauge, faFileLines, faRuler, faXmark, faSearchMinus, faSearchPlus, faToggleOn, faCircleDot, faSquareCheck, faCommentDots, faCaretDown,
  faUser, faGear, faBook, faLifeRing, faCircleInfo, faPenToSquare, faCheck,
  faArrowLeft, faClapperboard, faVideo, faMagic, faPen, faFilm,
  faGithub
)

createApp(App).component('fa', FontAwesomeIcon).use(i18n).use(router).mount('#app')
