# WeiMeng (唯梦)

![WeiMeng Logo](./logo.png)

**[中文文档](./README_CN.md)**

## Overview

WeiMeng is an AI-assisted drama and video production platform that streamlines the entire creative workflow from script writing to final video editing.

## Features

- **Script Management**: Write, upload, and manage scripts with AI-powered continuation
- **Character Extraction**: Automatically extract characters from scripts with detailed profiles
- **Storyboard Generation**: AI-powered storyboard creation with customizable styles
- **Video Editing**: Timeline-based video editor with drag-and-drop functionality
- **Project Management**: Organize projects with team collaboration features
- **Multi-language Support**: Full internationalization (English/Chinese)

## Tech Stack

**Frontend**: Vue 3, Vite, Tailwind CSS, Vue Router, Vue I18n
**Backend**: FastAPI, Python 3.8+

## Quick Start

### Prerequisites

- Node.js 20.19.0+ or 22.12.0+
- Python 3.8+

### Frontend Setup

```bash
cd web-ui
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### Backend Setup

```bash
cd src
pip install -r requirements.txt
python main.py
```

Backend runs at `http://localhost:7767`

## Project Structure

```
WeiMeng/
├── web-ui/          # Vue 3 frontend application
├── src/             # FastAPI backend application
├── docs/            # Documentation
└── logo.png         # Project logo
```

## Development

- Frontend dev server: `npm run dev` in `web-ui/`
- Backend dev server: `python main.py` in `src/`
- Build frontend: `npm run build` in `web-ui/`
