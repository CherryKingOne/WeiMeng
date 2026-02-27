```
{
  "request_head": {
    "from_agent": "Emma_ArtDirector",
    "to_agent": "Sarah_Scriptwriter",  // 目标Agent
    "task_id": "TASK_1024_Script",     // 任务追踪ID
    "action_type": "NEW_TASK"          // 类型：NEW_TASK(新任务) / REVISION(修改) / QUERY(询问)
  },
  "payload": {
    // 这里放具体的任务参数，不同Agent结构不同，由Emma生成
    "instruction": "...", 
    "constraints": { ... },
    "style_guide": { ... }
  },
  "project_context": {
    // 全局上下文，确保所有Agent在同一个频道
    "project_name": "佛门悍匪",
		"style":"沙雕动画"
    "total_duration": "15s",
    "aspect_ratio": "9:16",
    "tone": "Meme/Hardcore"
  },
  "reference_assets": [
    // 传递图片、文档或上一个环节的产出
    {
      "type": "image",
      "url": "https://...",
      "description": "用户上传的参考图"
    },
    {
      "type": "json",
      "content": "{...}", 
      "description": "上一轮的角色设定数据"
    }
  ]
}
```