export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  TEAMS: '/teams',
  PROJECTS: '/projects',
  WORKFLOWS: '/workflows',
  WORKFLOW_EDITOR: '/workflow-editor',
  ASSETS: '/assets',
  SCRIPTS: '/scripts',
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
