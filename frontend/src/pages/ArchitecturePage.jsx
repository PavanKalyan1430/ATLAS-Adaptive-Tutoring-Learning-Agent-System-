import { useStore } from '../store';
import { ReactFlow, Background, Handle, Position, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { Workflow, Activity, Cpu, Clock, CheckCircle2, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

function cn(...inputs) { return twMerge(clsx(inputs)); }

// ============================
// LangGraph Node Configuration
// ============================
const NODES = [
  { id: 'gateway', position: { x: 300, y: 50 }, data: { label: 'API Gateway', type: 'Ingress', model: 'NGINX / FastAPI', stats: { req: '45/s', err: '0.01%' } } },
  { id: 'rewrite', position: { x: 300, y: 200 }, data: { label: 'Query Optimizer', type: 'LLM Node', model: 'llama-3-8b', stats: { tokens: '420 t/s', ping: '112ms' } } },
  { id: 'retrieve', position: { x: 300, y: 350 }, data: { label: 'Qdrant Vector Engine', type: 'Database', model: 'BGE-Base-En', stats: { shards: '3 Active', ping: '12ms' } } },
  { id: 'grade', position: { x: 300, y: 500 }, data: { label: 'Context Grader', type: 'LLM Node', model: 'llama-3-8b', stats: { tokens: '380 t/s', ping: '145ms' } } },
  { id: 'generate', position: { x: 300, y: 650 }, data: { label: 'Synthesis Matrix', type: 'LLM Node', model: 'OpenRouter 20B', stats: { tokens: '85 t/s', ping: '1.2s' } } },
  { id: 'supervisor', position: { x: 300, y: 800 }, data: { label: 'Hallucination Guard', type: 'Agent', model: 'llama-3-8b', stats: { state: 'Enforcing', ping: '85ms' } } },
];

const EDGES = [
  { id: 'e1', source: 'gateway', target: 'rewrite', type: 'smoothstep', animated: true, style: { stroke: '#3B82F6', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3B82F6' } },
  { id: 'e2', source: 'rewrite', target: 'retrieve', type: 'smoothstep', style: { stroke: '#9CA3AF', strokeWidth: 1.5 } },
  { id: 'e3', source: 'retrieve', target: 'grade', type: 'smoothstep', style: { stroke: '#9CA3AF', strokeWidth: 1.5 } },
  { id: 'e4', source: 'grade', target: 'generate', type: 'smoothstep', animated: true, style: { stroke: '#10B981', strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#10B981' } },
  { id: 'e5', source: 'generate', target: 'supervisor', type: 'smoothstep', style: { stroke: '#9CA3AF', strokeWidth: 1.5 } },
  { id: 'e6', source: 'supervisor', target: 'rewrite', type: 'step', sourceHandle: 'left', targetHandle: 'left', style: { stroke: '#F59E0B', strokeDasharray: '5,5', strokeWidth: 2 }, label: 'Fallback Route', labelStyle: { fill: '#B45309', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }, labelBgStyle: { fill: '#FEF3C7', fillOpacity: 1, rx: 4 } },
];

function WorkflowNode({ data }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md min-w-[320px] hover:shadow-lg hover:border-blue-400 transition-all duration-300 relative overflow-hidden group">
      {/* Node Status Glow Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-80" />
      
      <Handle type="target" id="top" position={Position.Top} className="!w-2.5 !h-2.5 !bg-blue-500 !border-2 !border-white" />
      <Handle type="target" id="left" position={Position.Left} className="!w-2.5 !h-2.5 !bg-amber-500 !border-2 !border-white" />
      
      {/* Node Header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-blue-100 rounded text-blue-700">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-widest">{data.type}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Active</span>
        </div>
      </div>
      
      {/* Node Body */}
      <div className="p-5 bg-white">
        <h3 className="text-[16px] font-semibold text-gray-900 mb-4 tracking-tight">{data.label}</h3>
        
        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col p-2 bg-gray-50 rounded border border-gray-100">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Core Engine
            </span>
            <span className="text-[12px] font-mono text-gray-800 font-medium truncate">{data.model}</span>
          </div>
          <div className="flex flex-col p-2 bg-gray-50 rounded border border-gray-100">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Throughput
            </span>
            <div className="flex justify-between items-center text-[12px] font-mono font-medium">
              <span className="text-gray-800">{Object.values(data.stats)[0]}</span>
              <span className="text-gray-400">{Object.values(data.stats)[1]}</span>
            </div>
          </div>
        </div>
      </div>

      <Handle type="source" id="bottom" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-gray-400 !border-2 !border-white" />
      <Handle type="source" id="left-src" position={Position.Left} className="!w-2.5 !h-2.5 !bg-amber-500 !border-2 !border-white" style={{ top: '80%' }} />
    </div>
  );
}

const nodeTypes = { default: WorkflowNode };

export default function ArchitecturePage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full mx-auto p-8 lg:p-10 h-full flex flex-col bg-transparent relative">
      <header className="mb-6 flex-shrink-0 flex justify-between items-end relative z-10">
        <div>
          <h1 className="text-[24px] font-display font-semibold text-gray-900 mb-2 tracking-tight">System Architecture Map</h1>
          <p className="text-[14px] text-gray-500 max-w-3xl">
            Live observability into the autonomous LangGraph state machine. Monitoring agent routing and node latencies.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[12px] font-semibold text-gray-700">Cluster Nominal</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[700px] relative z-10">
        
        {/* Visualizer Panel */}
        <div className="lg:col-span-3 bento-card flex flex-col overflow-hidden relative">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-gray-200/50 shadow-sm">
            <Workflow className="w-4 h-4 text-gray-600" />
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-widest">Routing Topology</span>
          </div>
          
          <div className="flex-1 w-full h-full bg-white/40">
            <ReactFlow
              nodes={NODES.map((n) => ({ ...n, type: 'default' }))}
              edges={EDGES}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.5}
              maxZoom={1.5}
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
              className="react-flow-enterprise"
            >
              <Background color="#CBD5E1" gap={20} size={1} variant="dots" />
            </ReactFlow>
          </div>
        </div>

        {/* Action Panel */}
        <div className="flex flex-col gap-6">
          <div className="bento-card overflow-hidden">
            <div className="px-5 py-4 border-b border-black/5 bg-white/40 backdrop-blur-md">
              <h2 className="text-[12px] font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4" /> Edge Latencies
              </h2>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <LatencyRow label="Gateway -> Optimizer" time="14ms" status="good" />
              <LatencyRow label="Optimizer -> Qdrant" time="85ms" status="good" />
              <LatencyRow label="Grader -> Matrix" time="1240ms" status="warn" />
              <LatencyRow label="Supervisor Check" time="35ms" status="good" />
            </div>
          </div>

          <div className="bg-[#0E1A2B] rounded-xl shadow-lg p-5 text-white flex-1 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="w-24 h-24" />
            </div>
            <h3 className="text-[14px] font-semibold mb-2 text-white">LangGraph Runtime</h3>
            <p className="text-[12px] text-gray-400 mb-6 leading-relaxed">
              The autonomous state machine is currently running without interrupts. Hallucination checks are enforcing strict boundary conditions.
            </p>
            <div className="mt-auto flex flex-col gap-2">
              <div className="flex justify-between items-center text-[12px] border-b border-white/10 pb-2">
                <span className="text-gray-400">Total States Executed</span>
                <span className="font-mono font-bold text-blue-400">14,204</span>
              </div>
              <div className="flex justify-between items-center text-[12px] pt-1">
                <span className="text-gray-400">Fallback Rate</span>
                <span className="font-mono font-bold text-emerald-400">0.02%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LatencyRow({ label, time, status }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[12px] font-medium text-gray-600">{label}</span>
      <span className={cn(
        "text-[12px] font-mono font-bold px-2 py-0.5 rounded",
        status === 'warn' ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
      )}>
        {time}
      </span>
    </div>
  );
}
