export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  FORGOT_PASSWORD: '/auth/forgot-password',
  DASHBOARD: '/dashboard',
  TEAMS: '/weimeng/teams',
  PROJECTS: '/projects',
  WORKFLOWS: '/workflows',
  WORKFLOW_EDITOR: '/workflows/workflow-editor',
  ASSETS: '/assets',
  SCRIPTS: '/scripts',
  TEXT2IMAGE: '/workbench/text2image',
  IMAGE2IMAGE: '/workbench/image2image',
  IMAGE2VIDEO: '/workbench/image2video',
  TEXT2VIDEO: '/workbench/text2video',
  PLUGINS: '/plugins',
} as const;

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    RESET_PASSWORD: '/auth/reset-password',
  },
  CAPTCHA: {
    SEND: '/captcha/email/send',
  },
  WORKFLOWS: '/workflows',
  PROJECTS: '/projects',
  ASSETS: '/assets',
  SCRIPTS: '/scripts',
  PLUGINS: '/plugins',
} as const;
