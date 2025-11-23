目录结构大纲：
api：
    - llm.py
    - auth.py
    - file.py
    - script.py  查看剧本
    - image.py  文生图
    - video.py  文生视频
database:
- rustfs：
    - 存储文件
- postgresql：
    - models.py
    - user.py
    - script.py
- prompts：
    - storyboard_script_prompts.md(必须是md格式)




我现在要开发后端，同时为了方便维护，这个是目前的目录结构可能有些问题，你需要站在专业架构师和和可维护的角度去出发包括解耦性等角度帮我重新规划目录结构和对应的代码文件我好方便项目初始化