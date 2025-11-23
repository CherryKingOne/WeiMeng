import os
from pathlib import Path


def load_prompt(filename: str) -> str:
    """
    Load prompt content from markdown file in prompts directory
    
    Args:
        filename: Name of the prompt file (e.g., 'storyboard_prompt.md')
    
    Returns:
        Content of the prompt file
    """
    # Get the project root directory (assuming utils is in app/utils)
    current_dir = Path(__file__).parent.parent.parent
    prompts_dir = current_dir / "prompts"
    
    prompt_path = prompts_dir / filename
    
    if not prompt_path.exists():
        print(f"Warning: Prompt file {filename} not found at {prompt_path}")
        return ""
    
    try:
        with open(prompt_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return content
    except Exception as e:
        print(f"Error loading prompt file {filename}: {e}")
        return ""
