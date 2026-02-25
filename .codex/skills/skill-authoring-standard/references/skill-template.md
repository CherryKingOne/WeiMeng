# Skill 模板

## A. 最小模板

```markdown
---
name: "your-skill-name"
description: "简要说明技能功能和触发场景。"
---

# 角色定义
你是...

# 目标与范围
- 目标：
- 范围：
- 非范围：

# 工作流程
1. ...
2. ...
3. ...

# 规则与约束
- ...
- ...

# 输出格式
1. ...
2. ...

# 资源引用
- references/...
- scripts/...
```

## B. 完整模板（扩展元数据）

```markdown
---
name: "your-skill-name"
description: "简要说明技能功能和触发场景。"
version: "1.0.0"
author: "Your Team"
tags: ["tag1", "tag2"]
---

# 角色定义
你是...

# 目标与范围
- 目标：
- 范围：
- 非范围：

# 工作流程
1. 需求分析
2. 方案生成
3. 执行与验证
4. 输出结果

# 规则与约束
- 禁止...
- 必须...

# 输出格式
## 结果摘要
...

## 变更清单
...

## 校验结果
...

# 资源引用
- scripts/validate_skill.sh
- references/xxx.md
```
