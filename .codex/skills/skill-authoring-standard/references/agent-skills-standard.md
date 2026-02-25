# Agent Skills 标准说明

## 1. 标准目录结构

最小结构：

```text
skill-name/
└── SKILL.md
```

推荐结构：

```text
skill-name/
├── SKILL.md
├── scripts/
│   ├── validate.sh
│   └── generate_report.py
├── references/
│   ├── style_guide.md
│   └── api_docs.pdf
├── assets/
│   └── example_output.png
└── examples/
    └── demo_input.txt
```

命名要求：
- 文件夹名使用 `kebab-case`，例如 `code-review-skill`。
- `SKILL.md` 是必需文件。

## 2. SKILL.md 标准写法

`SKILL.md` 必须使用 Markdown，且以 YAML Front Matter 开头。

推荐元数据：

```yaml
---
name: "技能名称"
description: "技能描述"
version: "1.0.0"
author: "作者名"
tags: ["标签1", "标签2"]
---
```

正文建议包含以下固定模块：
1. 角色定义（Role Definition）
2. 目标与范围（Goals & Scope）
3. 工作流程（Workflow / SOP）
4. 规则与约束（Rules & Constraints）
5. 输出格式（Output Format）
6. 资源引用（References）

## 3. 建议实践

- `SKILL.md` 保持精炼，详细规范下沉到 `references/`。
- 如果流程可程序化，补充 `scripts/` 脚本用于检查或初始化。
- 至少提供一个 `examples/` 示例，便于复用。
- 先写触发条件，再写执行步骤，避免泛化描述。

## 4. 跨工具兼容说明

- 某些平台只强依赖 `name` 与 `description`。
- 为提高可移植性，可保留 `version`、`author`、`tags` 等扩展字段。
- 迁移到新平台时，优先校验 Front Matter 兼容性。
