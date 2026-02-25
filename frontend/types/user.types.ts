export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  nickname?: string;
  bio?: string;
  website?: string;
  social?: {
    twitter?: string;
    github?: string;
    wechat?: string;
  };
}
