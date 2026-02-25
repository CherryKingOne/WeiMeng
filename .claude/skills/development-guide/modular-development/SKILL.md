# SKILL: 模块化开发指南 - 前端与后端项目架构规范

## 1. 技能概述 (Overview)

本技能定义了使用模块化思路开发前端和后端项目的标准规范。涵盖目录结构设计、代码组织原则、模块划分策略、依赖管理等核心内容，旨在提升代码可维护性、可扩展性和团队协作效率。

## 2. 核心原则 (Core Principles)

### 2.1 模块化设计四大原则

| 原则 | 说明 | 实践方式 |
| :--- | :--- | :--- |
| **单一职责** | 每个模块只负责一个功能领域 | 一个文件/目录只做一件事 |
| **高内聚低耦合** | 模块内部紧密关联，模块间松散依赖 | 通过接口/类型定义交互边界 |
| **依赖倒置** | 高层模块不依赖低层模块，两者都依赖抽象 | 使用接口、类型定义解耦 |
| **开闭原则** | 对扩展开放，对修改关闭 | 通过配置和插件机制扩展功能 |

### 2.2 命名规范

```
目录命名：kebab-case (小写-连字符)
文件命名：
  - 组件文件：PascalCase.tsx (React) / camelCase.vue (Vue)
  - 工具函数：camelCase.ts
  - 类型定义：camelCase.types.ts 或 types.ts
  - 常量文件：camelCase.constants.ts 或 constants.ts
  - 样式文件：与组件同名，后缀区分 (Button.module.css / Button.scss)
```

## 3. 前端项目结构规范 (Frontend Architecture)

### 3.1 推荐目录结构

```
frontend/
├── app/                          # Next.js App Router 页面
│   ├── (auth)/                   # 路由组：认证相关页面
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # 路由组：需认证的页面
│   │   ├── dashboard/
│   │   └── projects/
│   ├── layout.tsx                # 根布局
│   └── globals.css               # 全局样式
│
├── components/                   # 组件库
│   ├── ui/                       # 基础 UI 组件
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Modal/
│   ├── layout/                   # 布局组件
│   │   ├── Sidebar/
│   │   ├── Header/
│   │   └── Footer/
│   └── features/                 # 业务功能组件
│       ├── ProjectCard/
│       └── ChatPanel/
│
├── hooks/                        # 自定义 Hooks
│   ├── useAuth.ts
│   ├── useLocalStorage.ts
│   └── useDebounce.ts
│
├── services/                     # API 服务层
│   ├── api.ts                    # Axios 实例配置
│   ├── auth.service.ts
│   └── project.service.ts
│
├── stores/                       # 状态管理 (Zustand/Redux)
│   ├── auth.store.ts
│   └── project.store.ts
│
├── types/                        # TypeScript 类型定义
│   ├── api.types.ts
│   ├── user.types.ts
│   └── project.types.ts
│
├── utils/                        # 工具函数
│   ├── format.ts
│   ├── validation.ts
│   └── helpers.ts
│
├── constants/                    # 常量定义
│   ├── routes.ts
│   └── config.ts
│
├── config/                       # 配置文件
│   └── navigation.tsx
│
└── styles/                       # 全局样式资源
    ├── variables.css
    └── mixins.scss
```

### 3.2 组件设计规范

```tsx
// ✅ 推荐的组件结构
// components/ui/Button/Button.tsx
import { cn } from '@/utils/cn';
import { ButtonProps } from './Button.types';
import styles from './Button.module.css';

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className,
  children,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        styles.button,
        styles[variant],
        styles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// components/ui/Button/index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button.types';
```

### 3.3 API 服务层规范

```typescript
// services/api.ts - Axios 实例配置
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // 处理未授权
    }
    return Promise.reject(error);
  }
);

export default api;

// services/project.service.ts - 业务服务
import api from './api';
import { Project, CreateProjectDto } from '@/types/project.types';

export const projectService = {
  getAll: () => api.get<Project[]>('/projects'),
  getById: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (data: CreateProjectDto) => api.post<Project>('/projects', data),
  update: (id: string, data: Partial<CreateProjectDto>) => 
    api.put<Project>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};
```

### 3.4 状态管理规范 (Zustand)

```typescript
// stores/project.store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Project } from '@/types/project.types';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  
  // Actions
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  devtools(
    persist(
      (set) => ({
        projects: [],
        currentProject: null,
        isLoading: false,
        
        setProjects: (projects) => set({ projects }),
        setCurrentProject: (project) => set({ currentProject: project }),
        addProject: (project) => 
          set((state) => ({ projects: [...state.projects, project] })),
        updateProject: (id, data) =>
          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === id ? { ...p, ...data } : p
            ),
          })),
        deleteProject: (id) =>
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
          })),
      }),
      { name: 'project-store' }
    )
  )
);
```

## 4. 后端项目结构规范 (Backend Architecture)

### 4.1 推荐目录结构 (Python/FastAPI)

```
backend/
├── app/
│   ├── main.py                   # 应用入口
│   ├── config.py                 # 配置管理
│   │
│   ├── api/                      # API 路由层
│   │   ├── __init__.py
│   │   ├── deps.py               # 依赖注入
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py         # 路由聚合
│   │       ├── auth.py
│   │       └── projects.py
│   │
│   ├── core/                     # 核心模块
│   │   ├── __init__.py
│   │   ├── security.py           # 认证/加密
│   │   ├── exceptions.py         # 异常定义
│   │   └── middleware.py         # 中间件
│   │
│   ├── models/                   # 数据模型 (ORM)
│   │   ├── __init__.py
│   │   ├── base.py               # 基础模型
│   │   ├── user.py
│   │   └── project.py
│   │
│   ├── schemas/                  # Pydantic 模型 (请求/响应)
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── user.py
│   │   └── project.py
│   │
│   ├── services/                 # 业务逻辑层
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   └── project.py
│   │
│   ├── repositories/             # 数据访问层
│   │   ├── __init__.py
│   │   ├── base.py
│   │   └── project.py
│   │
│   └── utils/                    # 工具函数
│       ├── __init__.py
│       └── helpers.py
│
├── tests/                        # 测试目录
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   └── test_projects.py
│
├── alembic/                      # 数据库迁移
│   ├── versions/
│   └── env.py
│
├── requirements.txt
├── pyproject.toml
└── Dockerfile
```

### 4.2 分层架构设计

```
┌─────────────────────────────────────────────────────────┐
│                      API Layer                          │
│  (路由定义、请求验证、响应格式化)                          │
├─────────────────────────────────────────────────────────┤
│                    Service Layer                        │
│  (业务逻辑、事务管理、跨模块协调)                          │
├─────────────────────────────────────────────────────────┤
│                  Repository Layer                       │
│  (数据访问、CRUD 操作、查询封装)                          │
├─────────────────────────────────────────────────────────┤
│                    Model Layer                          │
│  (ORM 模型、数据库映射、关系定义)                         │
└─────────────────────────────────────────────────────────┘
```

### 4.3 API 路由规范

```python
# app/api/v1/projects.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.project import Project, ProjectCreate, ProjectUpdate
from app.services.project import ProjectService
from app.api.deps import get_project_service, get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("/", response_model=List[Project])
async def list_projects(
    skip: int = 0,
    limit: int = 100,
    service: ProjectService = Depends(get_project_service),
    current_user = Depends(get_current_user),
):
    """获取项目列表"""
    return await service.get_multi(skip=skip, limit=limit, user_id=current_user.id)

@router.post("/", response_model=Project, status_code=201)
async def create_project(
    data: ProjectCreate,
    service: ProjectService = Depends(get_project_service),
    current_user = Depends(get_current_user),
):
    """创建新项目"""
    return await service.create(data, user_id=current_user.id)

@router.get("/{project_id}", response_model=Project)
async def get_project(
    project_id: str,
    service: ProjectService = Depends(get_project_service),
):
    """获取单个项目"""
    project = await service.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project
```

### 4.4 Service 层规范

```python
# app/services/project.py
from typing import List, Optional
from app.repositories.project import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.models.project import Project

class ProjectService:
    def __init__(self, repository: ProjectRepository):
        self.repository = repository
    
    async def get(self, project_id: str) -> Optional[Project]:
        return await self.repository.get(project_id)
    
    async def get_multi(
        self, 
        skip: int = 0, 
        limit: int = 100,
        user_id: Optional[str] = None
    ) -> List[Project]:
        return await self.repository.get_multi(
            skip=skip, 
            limit=limit, 
            user_id=user_id
        )
    
    async def create(self, data: ProjectCreate, user_id: str) -> Project:
        # 业务逻辑：创建前检查
        project_data = data.model_dump()
        project_data["owner_id"] = user_id
        
        # 可以添加更多业务逻辑
        return await self.repository.create(project_data)
    
    async def update(self, project_id: str, data: ProjectUpdate) -> Project:
        return await self.repository.update(project_id, data.model_dump(exclude_unset=True))
    
    async def delete(self, project_id: str) -> bool:
        return await self.repository.delete(project_id)
```

### 4.5 Repository 层规范

```python
# app/repositories/base.py
from typing import Generic, TypeVar, List, Optional, Any, Dict
from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: type[ModelType], session):
        self.model = model
        self.session = session
    
    async def get(self, id: str) -> Optional[ModelType]:
        return await self.session.get(self.model, id)
    
    async def get_multi(
        self, 
        skip: int = 0, 
        limit: int = 100,
        **filters
    ) -> List[ModelType]:
        query = self.session.query(self.model)
        for key, value in filters.items():
            if value is not None:
                query = query.filter(getattr(self.model, key) == value)
        return query.offset(skip).limit(limit).all()
    
    async def create(self, data: Dict[str, Any]) -> ModelType:
        obj = self.model(**data)
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj
    
    async def update(self, id: str, data: Dict[str, Any]) -> ModelType:
        obj = await self.get(id)
        if obj:
            for key, value in data.items():
                setattr(obj, key, value)
            await self.session.commit()
            await self.session.refresh(obj)
        return obj
    
    async def delete(self, id: str) -> bool:
        obj = await self.get(id)
        if obj:
            await self.session.delete(obj)
            await self.session.commit()
            return True
        return False
```

## 5. 类型定义规范 (TypeScript/Python)

### 5.1 前端类型定义

```typescript
// types/api.types.ts - API 通用类型
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// types/project.types.ts - 业务类型
export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  owner: User;
}

export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {
  status?: ProjectStatus;
}
```

### 5.2 后端类型定义 (Pydantic)

```python
# app/schemas/base.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class TimestampMixin(BaseModel):
    created_at: datetime
    updated_at: datetime

# app/schemas/project.py
from app.schemas.base import BaseSchema, TimestampMixin
from app.schemas.user import User
from typing import Optional
from enum import Enum

class ProjectStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"

class ProjectBase(BaseSchema):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None

class Project(ProjectBase, TimestampMixin):
    id: str
    status: ProjectStatus
    owner_id: str
    owner: Optional[User] = None
```

## 6. 依赖管理规范

### 6.1 前端 (package.json)

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "@types/react": "^18.2.0"
  }
}
```

### 6.2 后端 (requirements.txt / pyproject.toml)

```
# requirements.txt
fastapi>=0.100.0
uvicorn>=0.23.0
sqlalchemy>=2.0.0
pydantic>=2.0.0
python-dotenv>=1.0.0
httpx>=0.24.0

# Development
pytest>=7.0.0
black>=23.0.0
ruff>=0.0.280
mypy>=1.0.0
```

## 7. 最佳实践清单

### 7.1 前端最佳实践

- [ ] 组件按功能分类 (ui/layout/features)
- [ ] 使用 TypeScript 严格模式
- [ ] API 调用统一通过 service 层
- [ ] 状态管理使用 Zustand/Redux，避免 prop drilling
- [ ] 样式使用 CSS Modules 或 Tailwind CSS
- [ ] 使用 React Query/SWR 管理 API 缓存
- [ ] 实现 Error Boundary 错误边界
- [ ] 配置 ESLint + Prettier

### 7.2 后端最佳实践

- [ ] 严格分层：API -> Service -> Repository -> Model
- [ ] 使用 Pydantic 进行数据验证
- [ ] 实现统一的异常处理
- [ ] 使用依赖注入管理服务实例
- [ ] 配置 CORS 中间件
- [ ] 实现 API 文档 (OpenAPI/Swagger)
- [ ] 编写单元测试和集成测试
- [ ] 使用 Alembic 管理数据库迁移

## 8. 常见问题与解决方案

| 问题 | 原因 | 解决方案 |
| :--- | :--- | :--- |
| 循环依赖 | 模块间相互导入 | 使用依赖注入或重构模块边界 |
| 类型丢失 | 未正确导出类型 | 统一在 index.ts 中导出类型 |
| 状态不同步 | 多个状态源 | 使用单一数据源原则 |
| API 调用重复 | 未封装 service | 统一通过 service 层调用 |
| 组件过大 | 单一职责违反 | 拆分为更小的组件 |
| 测试困难 | 紧耦合设计 | 使用依赖注入和接口抽象 |

## 9. 总结

模块化开发的核心在于**清晰的边界划分**和**一致的代码组织**。遵循本规范可以：

1. 提升代码可读性和可维护性
2. 降低模块间耦合度
3. 便于团队协作和代码审查
4. 支持功能的独立开发和测试
5. 提高代码复用率

在实际项目中，应根据团队规模和项目复杂度适当调整规范，保持灵活性和实用性的平衡。