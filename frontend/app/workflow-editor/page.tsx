'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';

// Define Node Types
type NodeType = 'media' | 'video' | 'text' | 'gen' | 'videogen' | 'post' | 'upscale' | 'controlnet';

interface NodeData {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  label?: string;
  content?: string;
  image?: string;
}

const INITIAL_NODES: NodeData[] = [
  {
    id: 'media',
    type: 'media',
    x: 400,
    y: 300,
    label: 'Portrait_Ref.jpg',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'text',
    type: 'text',
    x: 400,
    y: 520,
    content: 'Cyberpunk city street, neon lights, rain, <lora:neon_v2:0.8>, cinematic lighting, 8k resolution'
  },
  {
    id: 'gen',
    type: 'gen',
    x: 860,
    y: 350,
    label: 'Flux Pro 1.0',
    image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=600&q=80'
  }
];

export default function WorkflowEditor() {
  const [nodes, setNodes] = useState<NodeData[]>(INITIAL_NODES);
  const [activeTab, setActiveTab] = useState('assets');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [accordions, setAccordions] = useState({
    assets: true,
    logic: true,
    gen: true,
    post: true
  });

  const canvasRef = useRef<HTMLDivElement>(null);

  const toggleAccordion = (key: keyof typeof accordions) => {
    setAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNode(nodeId);
  };

  const handleCanvasClick = () => {
    setSelectedNode(null);
  };

  const handleRun = () => {
    setIsRunning(true);
    setHasResult(false);
    setTimeout(() => {
      setIsRunning(false);
      setHasResult(true);
    }, 3000);
  };

  // Drag and Drop Handlers
  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow') as NodeType;
    if (!type || !canvasRef.current) return;

    const reactFlowBounds = canvasRef.current.getBoundingClientRect();
    
    // Calculate position relative to the canvas
    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    };

    // Define default data based on node type
    let label: string | undefined = undefined;
    let content: string | undefined = undefined;
    let image: string | undefined = undefined;

    switch (type) {
        case 'media':
            label = 'New Image';
            image = 'https://via.placeholder.com/150';
            break;
        case 'video':
            label = 'New Video';
            image = 'https://via.placeholder.com/150';
            break;
        case 'text':
            content = 'Enter your prompt here...';
            break;
        case 'gen':
            label = 'Flux Pro 1.0';
            break;
        case 'videogen':
            label = 'Video Gen';
            break;
        case 'upscale':
            label = 'Upscale / Fix';
            break;
        case 'controlnet':
            label = 'ControlNet';
            break;
        default:
            label = type;
    }

    const newNode: NodeData = {
      id: `${type}-${Date.now()}`,
      type,
      x: position.x - 100, // Center the node (approximate width/2)
      y: position.y - 40,  // Center the node (approximate height/2)
      label,
      content,
      image
    };

    setNodes((nds) => nds.concat(newNode));
  };

  return (
    <div className="bg-white text-gray-900 h-screen w-screen overflow-hidden selection:bg-black selection:text-white font-sans">
      <style jsx global>{`
        /* 1. Global Canvas Grid - Plus Pattern */
        .bg-grid-plus {
            background-size: 40px 40px;
            background-image: 
                linear-gradient(to right, #F3F4F6 1px, transparent 1px),
                linear-gradient(to bottom, #F3F4F6 1px, transparent 1px);
        }

        /* 2. Custom Scrollbar for panels */
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: #E5E7EB;
            border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #D1D5DB;
        }

        /* 3. Node Base Styles */
        .node-base {
            background: #FFFFFF;
            border-radius: 16px; /* rounded-2xl */
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); /* shadow-lg custom */
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .node-base:hover {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            transform: translateY(-2px);
        }
        .node-selected {
            border: 2px solid #000;
        }
        
        /* 4. Connection Lines */
        @keyframes flow-animation {
            to { stroke-dashoffset: 0; }
        }
        .connection-line {
            stroke-dasharray: 8 4;
            stroke-dashoffset: 24;
            animation: flow-animation 1s linear infinite paused;
            stroke-linecap: round;
        }
        .connection-line.active {
            animation-play-state: running;
        }

        /* 5. Specific Node Effects */
        .gradient-border-active {
            position: relative;
        }
        .gradient-border-active::after {
            content: "";
            position: absolute;
            inset: -2px;
            border-radius: 18px; 
            background: linear-gradient(45deg, #ff00cc, #3333ff, #00ccff, #ff00cc);
            background-size: 400% 400%;
            z-index: -1;
            animation: gradient-border 3s ease infinite;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .processing .gradient-border-active::after { opacity: 1; }
        @keyframes gradient-border {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        /* Hide scrollbar */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* Accordion Rotate */
        .accordion-chevron {
            transition: transform 0.3s ease;
        }
        .rotate-180 {
            transform: rotate(180deg);
        }
        
        /* Glassmorphism utility */
        .glass-panel {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }

        /* Range Slider */
        input[type=range] {
            -webkit-appearance: none; 
            background: transparent; 
        }
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #000;
            margin-top: -6px; 
            cursor: pointer;
        }
        input[type=range]::-webkit-slider-runnable-track {
            width: 100%;
            height: 4px;
            cursor: pointer;
            background: #E5E7EB;
            border-radius: 2px;
        }
      `}</style>

      {/* 1. Infinite Canvas Background */}
      <div id="canvas-container" className="fixed inset-0 z-0 bg-white bg-grid-plus cursor-grab active:cursor-grabbing overflow-hidden" onClick={handleCanvasClick}>
        {/* Transform Wrapper for Pan/Zoom */}
        <div 
            id="canvas-content" 
            ref={canvasRef}
            className="w-full h-full relative origin-top-left transition-transform duration-75 ease-out" 
            style={{ transform: 'translate(0px, 0px) scale(1)' }}
            onDrop={onDrop}
            onDragOver={onDragOver}
        >
            
            {/* SVG Layer for Connections - Keeping static for demo purposes */}
            <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none z-0 overflow-visible">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#E5E7EB" />
                    </marker>
                    <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#000" />
                    </marker>
                </defs>

                {/* Connection 1: Image Input -> Gen Node */}
                <path d="M 640 380 C 740 380, 760 500, 860 500" 
                      stroke="#E5E7EB" strokeWidth="3" fill="none" 
                      className={`connection-line transition-colors duration-500 ${isRunning ? 'active' : ''}`}
                      id="conn-1" />
                
                {/* Connection 2: Text Prompt -> Gen Node */}
                <path d="M 640 600 C 740 600, 760 550, 860 550" 
                      stroke="#E5E7EB" strokeWidth="3" fill="none" 
                      className={`connection-line transition-colors duration-500 ${isRunning ? 'active' : ''}`}
                      id="conn-2" />
            </svg>

            {/* NODES LAYER */}
            {nodes.map((node) => {
                if (node.type === 'media' || node.type === 'video') {
                    return (
                        <div 
                            key={node.id}
                            style={{ left: node.x, top: node.y }}
                            className={`absolute w-[240px] h-[160px] bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow group z-10 cursor-pointer ${selectedNode === node.id ? 'ring-2 ring-black' : ''}`} 
                            onClick={(e) => handleNodeClick(e, node.id)}
                        >
                            <div className="relative w-full h-full rounded-2xl overflow-hidden">
                                <img src={node.image || "https://via.placeholder.com/240x160"} className="w-full h-full object-cover" alt="Input" />
                                {/* Capsule Label */}
                                <div className="absolute bottom-3 left-3 px-2 py-1 bg-white/90 backdrop-blur rounded-full flex items-center gap-1.5 shadow-sm border border-gray-100">
                                    <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                    <span className="text-[10px] font-medium text-gray-700">{node.label || 'Image'}</span>
                                </div>
                            </div>
                            {/* Output Dot */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white border-2 border-gray-300 rounded-full hover:border-black hover:scale-125 transition-all z-20"></div>
                        </div>
                    );
                }

                if (node.type === 'text') {
                    return (
                        <div 
                            key={node.id}
                            style={{ left: node.x, top: node.y }}
                            className={`absolute w-[240px] bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow group z-10 flex flex-col cursor-pointer ${selectedNode === node.id ? 'ring-2 ring-black' : ''}`}
                            onClick={(e) => handleNodeClick(e, node.id)}
                        >
                            <div className="h-10 border-b border-gray-50 px-4 flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Prompt</span>
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </div>
                            <div className="p-4 bg-gray-50/50 rounded-b-2xl">
                                <p className="text-sm text-gray-800 font-mono leading-relaxed break-words">
                                    {node.content}
                                </p>
                                <div className="mt-3 flex justify-end">
                                    <span className="text-[10px] text-gray-400">{node.content?.length || 0} chars</span>
                                </div>
                            </div>
                            {/* Output Dot */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white border-2 border-gray-300 rounded-full hover:border-black hover:scale-125 transition-all z-20"></div>
                        </div>
                    );
                }

                if (node.type === 'videogen' || node.type === 'upscale' || node.type === 'controlnet') {
                    return (
                        <div 
                            key={node.id}
                            style={{ left: node.x, top: node.y }}
                            className={`absolute w-[280px] bg-white rounded-xl shadow-lg border border-gray-200 z-20 cursor-pointer transition-all hover:shadow-xl ${selectedNode === node.id ? 'ring-2 ring-black' : ''}`}
                            onClick={(e) => handleNodeClick(e, node.id)}
                        >
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-xl">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${node.type === 'videogen' ? 'bg-black' : (node.type === 'upscale' ? 'bg-indigo-500' : 'bg-green-500')}`}></div>
                                    <span className="text-xs font-bold text-gray-900">{node.label || node.type}</span>
                                </div>
                            </div>
                            
                            {/* Content */}
                            <div className="p-8 flex flex-col items-center justify-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                    {node.type === 'videogen' && (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                                    )}
                                    {node.type === 'upscale' && (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
                                    )}
                                    {node.type === 'controlnet' && (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium">Waiting for input...</span>
                            </div>

                            {/* Inputs/Outputs */}
                            <div className="absolute left-0 top-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-gray-400 rounded-full hover:scale-125 transition-all" title="Input"></div>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white border-2 border-gray-300 rounded-full hover:border-black hover:scale-125 transition-all"></div>
                        </div>
                    );
                }

                // Image Gen Node
                if (node.type === 'gen') {
                    const isDemoNode = node.id === 'gen';
                    const showPlaceholder = !(isDemoNode && hasResult) && !node.image;
                    const showImage = (isDemoNode && hasResult) || !!node.image;

                    return (
                        <div 
                            key={node.id}
                            id={isDemoNode ? 'gen-node' : undefined}
                            style={{ left: node.x, top: node.y }}
                            className={`absolute w-[300px] bg-white rounded-2xl shadow-xl border border-gray-200 transition-all duration-300 z-20 cursor-pointer gradient-border-active ${selectedNode === node.id ? 'ring-2 ring-black' : ''} ${isRunning && isDemoNode ? 'processing' : ''}`}
                            onClick={(e) => handleNodeClick(e, node.id)}
                        >
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-2xl">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                                    <span className="text-xs font-bold text-gray-900">{node.label || 'Image Gen'}</span>
                                </div>
                                <div className="flex gap-1">
                                     <button className="p-1 hover:bg-gray-100 rounded text-gray-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"/></svg></button>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="relative w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden group">
                                {/* Placeholder State */}
                                <div className={`text-center transition-opacity duration-300 ${showPlaceholder ? 'block' : 'hidden'}`}>
                                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mx-auto mb-2">
                                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                    </div>
                                    <span className="text-xs text-gray-400">{isRunning && isDemoNode ? 'Generating...' : 'Waiting for run...'}</span>
                                </div>
                                
                                {/* Result Image */}
                                <img 
                                    src={node.image || "https://via.placeholder.com/300"} 
                                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${showImage ? 'opacity-100' : 'opacity-0'}`} 
                                    alt="Generated" 
                                />
                                
                                {/* Hover Actions */}
                                <div className="absolute top-2 right-2 flex flex-col gap-2 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
                                    <button className="p-1.5 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-white text-gray-700" title="Upscale">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
                                    </button>
                                    <button className="p-1.5 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-white text-gray-700" title="Save">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Footer Info */}
                            <div className="px-4 py-2 bg-white rounded-b-2xl border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400">
                                <span>1024x1024</span>
                                <span>Steps: 30</span>
                            </div>

                            {/* Input Dots */}
                            <div className="absolute left-0 top-1/4 -translate-x-1/2 w-3 h-3 bg-white border-2 border-gray-400 rounded-full hover:scale-125 transition-all" title="Input 1"></div>
                            <div className="absolute left-0 top-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-gray-400 rounded-full hover:scale-125 transition-all" title="Input 2"></div>
                            <div className="absolute left-0 top-3/4 -translate-x-1/2 w-3 h-3 bg-white border-2 border-gray-400 rounded-full hover:scale-125 transition-all" title="Input 3"></div>
                            
                            {/* Output Dot */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white border-2 border-gray-300 rounded-full hover:border-black hover:scale-125 transition-all"></div>
                        </div>
                    );
                }

                return null;
            })}

        </div>
      </div>

      {/* 2. Left Sidebar: Media & Nodes Dock */}
      <div className="fixed left-4 top-4 bottom-4 w-72 glass-panel rounded-2xl shadow-2xl border border-white/20 flex flex-col z-40 overflow-hidden transition-all duration-300" id="left-dock">
        {/* Tabs */}
        <div className="flex p-1 m-3 bg-gray-100/50 rounded-xl">
            <button 
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === 'assets' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                onClick={() => setActiveTab('assets')}
            >
                资产 Assets
            </button>
            <button 
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === 'nodes' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                onClick={() => setActiveTab('nodes')}
            >
                节点 Nodes
            </button>
        </div>

        {/* Content Area: Assets */}
        {activeTab === 'assets' && (
            <div id="tab-assets" className="flex-1 overflow-y-auto px-3 pb-3">
                <div className="grid grid-cols-2 gap-2">
                    {/* Asset Item */}
                    <div className="aspect-square rounded-lg overflow-hidden relative group cursor-grab active:cursor-grabbing border border-transparent hover:border-black transition-all" draggable={true} onDragStart={(e) => onDragStart(e, 'media')}>
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                    </div>
                    <div className="aspect-square rounded-lg overflow-hidden relative group cursor-grab active:cursor-grabbing border border-transparent hover:border-black transition-all" draggable={true} onDragStart={(e) => onDragStart(e, 'media')}>
                        <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=200&q=80" className="w-full h-full object-cover" />
                    </div>
                    <div className="aspect-square rounded-lg overflow-hidden relative group cursor-grab active:cursor-grabbing border border-transparent hover:border-black transition-all" draggable={true} onDragStart={(e) => onDragStart(e, 'media')}>
                        <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80" className="w-full h-full object-cover" />
                    </div>
                    <div className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors cursor-pointer bg-white/50">
                        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                        <span className="text-[10px]">Upload</span>
                    </div>
                </div>
            </div>
        )}

        {/* Content Area: Nodes */}
        {activeTab === 'nodes' && (
            <div id="tab-nodes" className="flex-1 overflow-y-auto px-3 pb-3 no-scrollbar space-y-4">
                {/* Section: Assets */}
                <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center justify-between cursor-pointer hover:text-gray-600 transition-colors" onClick={() => toggleAccordion('assets')}>
                        <div className="flex items-center gap-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"/></svg>
                            Assets
                        </div>
                        <svg className={`w-3 h-3 accordion-chevron ${accordions.assets ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                    </h3>
                    {accordions.assets && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 p-2 bg-white/50 hover:bg-white rounded-lg cursor-grab active:cursor-grabbing border border-transparent hover:border-gray-200 transition-all hover:translate-x-1 shadow-sm" draggable={true} onDragStart={(e) => onDragStart(e, 'media')}>
                                <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>
                                <span className="text-xs font-medium text-gray-700">Image Upload</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 bg-white/50 hover:bg-white rounded-lg cursor-grab active:cursor-grabbing border border-transparent hover:border-gray-200 transition-all hover:translate-x-1 shadow-sm" draggable={true} onDragStart={(e) => onDragStart(e, 'video')}>
                                <div className="w-6 h-6 rounded bg-red-100 text-red-600 flex items-center justify-center"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg></div>
                                <span className="text-xs font-medium text-gray-700">Video Clip</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Section: Logic */}
                <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center justify-between cursor-pointer hover:text-gray-600 transition-colors" onClick={() => toggleAccordion('logic')}>
                        <div className="flex items-center gap-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                            Script & Logic
                        </div>
                        <svg className={`w-3 h-3 accordion-chevron ${accordions.logic ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                    </h3>
                    {accordions.logic && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 p-2 bg-white/50 hover:bg-white rounded-lg cursor-grab active:cursor-grabbing border border-transparent hover:border-gray-200 transition-all hover:translate-x-1 shadow-sm" draggable={true} onDragStart={(e) => onDragStart(e, 'text')}>
                                <div className="w-6 h-6 rounded bg-yellow-100 text-yellow-600 flex items-center justify-center"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></div>
                                <span className="text-xs font-medium text-gray-700">Text Prompt</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Section: Generation */}
                <div>
                    <h3 className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-600 uppercase tracking-widest mb-3 flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity" onClick={() => toggleAccordion('gen')}>
                        <div className="flex items-center gap-2">
                            <svg className="w-3 h-3 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 3.214L13 21l-2.286-6.857L5 12l5.714-3.214z"/></svg>
                            <span className="text-pink-600">Generation</span>
                        </div>
                        <svg className={`w-3 h-3 accordion-chevron text-pink-500 ${accordions.gen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                    </h3>
                    {accordions.gen && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-lg cursor-grab active:cursor-grabbing border border-purple-100 hover:border-purple-200 transition-all hover:translate-x-1 shadow-sm" draggable={true} onDragStart={(e) => onDragStart(e, 'gen')}>
                                <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center shadow"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>
                                <span className="text-xs font-bold text-gray-800">Image Gen</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 bg-white/50 hover:bg-white rounded-lg cursor-grab active:cursor-grabbing border border-transparent hover:border-gray-200 transition-all hover:translate-x-1 shadow-sm" draggable={true} onDragStart={(e) => onDragStart(e, 'videogen')}>
                                <div className="w-6 h-6 rounded bg-black text-white flex items-center justify-center"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg></div>
                                <span className="text-xs font-medium text-gray-700">Video Gen</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Section: Post Processing */}
                <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center justify-between cursor-pointer hover:text-gray-600 transition-colors" onClick={() => toggleAccordion('post')}>
                        <div className="flex items-center gap-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
                            Post Process
                        </div>
                        <svg className={`w-3 h-3 accordion-chevron ${accordions.post ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                    </h3>
                    {accordions.post && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 p-2 bg-white/50 hover:bg-white rounded-lg cursor-grab active:cursor-grabbing border border-transparent hover:border-gray-200 transition-all hover:translate-x-1 shadow-sm" draggable={true} onDragStart={(e) => onDragStart(e, 'upscale')}>
                                <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg></div>
                                <span className="text-xs font-medium text-gray-700">Upscale / Fix</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 bg-black hover:bg-gray-900 rounded-lg cursor-grab active:cursor-grabbing border border-transparent transition-all hover:translate-x-1 shadow-sm group" draggable={true} onDragStart={(e) => onDragStart(e, 'controlnet')}>
                                <div className="w-6 h-6 rounded bg-gray-800 text-green-400 flex items-center justify-center"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg></div>
                                <span className="text-xs font-medium text-white">ControlNet</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* 3. Right Sidebar: Inspector Panel */}
      <div className={`fixed right-4 top-4 bottom-4 w-72 glass-panel rounded-2xl shadow-2xl border border-white/20 z-40 transition-transform duration-300 flex flex-col ${selectedNode ? 'translate-x-0' : 'translate-x-[120%]'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Properties</h2>
            <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Node Name */}
            <div>
                <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Node Name</label>
                <input type="text" defaultValue="Flux Pro 1.0" className="w-full bg-white/50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-black transition-colors" />
            </div>

            {/* Parameters Group */}
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-xs font-medium text-gray-700">Steps</label>
                        <span className="text-xs text-gray-500 font-mono">30</span>
                    </div>
                    <input type="range" min="1" max="50" defaultValue="30" className="w-full" />
                </div>

                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-xs font-medium text-gray-700">CFG Scale</label>
                        <span className="text-xs text-gray-500 font-mono">7.0</span>
                    </div>
                    <input type="range" min="1" max="20" step="0.5" defaultValue="7.0" className="w-full" />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Aspect Ratio</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button className="px-2 py-1.5 bg-black text-white text-xs rounded border border-black text-center">1:1</button>
                        <button className="px-2 py-1.5 bg-white text-gray-600 text-xs rounded border border-gray-200 hover:border-gray-400 text-center">16:9</button>
                        <button className="px-2 py-1.5 bg-white text-gray-600 text-xs rounded border border-gray-200 hover:border-gray-400 text-center">9:16</button>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Seed</label>
                    <div className="flex gap-2">
                        <input type="number" defaultValue="-1" className="flex-1 bg-white/50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-black" />
                        <button className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-black hover:border-black transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 4. Bottom Playback Control */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-1 h-14 rounded-full shadow-2xl flex items-center gap-1 z-50">
        {/* Undo/Redo */}
        <div className="flex items-center px-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"/></svg>
            </button>
        </div>

        <div className="w-px h-6 bg-gray-700"></div>

        {/* Run Button */}
        <button className="px-6 h-full flex items-center gap-2 hover:bg-gray-800 transition-colors rounded-lg mx-1 group" onClick={handleRun}>
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-3 h-3 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <span className="font-medium text-sm tracking-wide">{isRunning ? 'Running...' : 'Run Workflow'}</span>
        </button>

        <div className="w-px h-6 bg-gray-700"></div>

        {/* Save */}
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors mx-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
        </button>
      </div>

      {/* Floating Back Button */}
      <Link href="/workflows" className="fixed top-6 left-6 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-black hover:scale-110 transition-all z-50">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
      </Link>

    </div>
  );
}
