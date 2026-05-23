import React, { useMemo, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CheckCircle2, Lock, PlayCircle, AlertCircle } from 'lucide-react';

// Custom Node Component to render premium styled cards
const CustomPathNode = ({ data }) => {
  const { title, topic, status, is_remediation } = data;
  
  let statusClass = "border-slate-800 bg-[#0e172e]/80 text-slate-400";
  let icon = <Lock className="h-4 w-4 text-slate-500" />;
  
  if (status === 'mastered') {
    statusClass = "border-emerald-500/40 bg-emerald-500/5 text-slate-100 shadow-lg shadow-emerald-500/5";
    icon = <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
  } else if (status === 'current') {
    statusClass = "border-indigo-500/80 bg-indigo-500/10 text-slate-100 shadow-xl shadow-indigo-500/10 pulse-node border-2 ring-1 ring-indigo-500/20";
    icon = <PlayCircle className="h-5 w-5 text-indigo-400 animate-pulse" />;
  } else if (is_remediation) {
    statusClass = "border-amber-500 bg-amber-500/10 text-slate-100 shadow-xl shadow-amber-500/15 border-2 animate-pulse";
    icon = <AlertCircle className="h-5 w-5 text-amber-400" />;
  }

  return (
    <div className={`px-5 py-4 rounded-2xl border glass flex items-center gap-3.5 min-w-[240px] max-w-[280px] transition-all hover:scale-[1.02] duration-300 ${statusClass}`}>
      <div className="flex-shrink-0">{icon}</div>
      <div className="text-left select-none">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-0.5">
          {is_remediation ? '🔧 REMEDIATION' : topic.replace('_', ' ')}
        </span>
        <h3 className="text-sm font-bold leading-snug text-slate-100">{title}</h3>
      </div>
    </div>
  );
};

export default function DAGCanvas({ nodes: pathNodes, edges: pathEdges, onNodeClick }) {
  const nodeTypes = useMemo(() => ({ customPathNode: CustomPathNode }), []);

  // Format pathNodes into React Flow Node objects
  // We place nodes sequentially in a clean grid layout
  const formattedNodes = useMemo(() => {
    return pathNodes.map((n, idx) => {
      // Direct sequence placement (horizontal layout or vertical staircase)
      // Horizontal staircase placement is very clean: x increments by 340, y staggers by 80
      const isRemediation = n.is_remediation || n.node_id.startsWith("remedy_");
      
      let x = idx * 320;
      let y = 150;
      
      // If it's remediation, place it slightly above the node it replaces
      if (isRemediation) {
        x = (idx) * 320 + 20;
        y = 40; // Staggered upwards
      }

      return {
        id: n.node_id,
        type: 'customPathNode',
        position: { x, y },
        data: {
          title: n.title,
          topic: n.topic,
          status: n.status,
          is_remediation: isRemediation
        },
        draggable: false,
        selectable: n.status === 'current' || n.status === 'mastered'
      };
    });
  }, [pathNodes]);

  // Format pathEdges to style edges beautifully
  const formattedEdges = useMemo(() => {
    return pathEdges.map((e) => {
      const isRemedialEdge = e.id.includes("remedy");
      return {
        ...e,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: isRemedialEdge ? '#ff9800' : '#4338ca',
        },
        style: isRemedialEdge 
          ? { stroke: '#ff9800', strokeWidth: 2, strokeDasharray: '5,5' }
          : { stroke: '#4338ca', strokeWidth: 2 }
      };
    });
  }, [pathEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(formattedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(formattedEdges);

  // Sync state when props update
  useEffect(() => {
    setNodes(formattedNodes);
    setEdges(formattedEdges);
  }, [formattedNodes, formattedEdges, setNodes, setEdges]);

  const handleNodeClickInternal = (event, node) => {
    // Only trigger action click for current or mastered nodes
    const clickedNodeData = pathNodes.find(n => n.node_id === node.id);
    if (clickedNodeData && (clickedNodeData.status === 'current' || clickedNodeData.status === 'mastered')) {
      onNodeClick(clickedNodeData);
    }
  };

  return (
    <div className="h-[360px] md:h-[450px] w-full bg-[#040816]/30 border border-slate-800/80 rounded-3xl overflow-hidden relative glow-indigo">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClickInternal}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e293b" gap={24} size={1} />
        <Controls showInteractive={false} className="fill-slate-100" />
      </ReactFlow>
      <div className="absolute bottom-4 left-4 glass px-3.5 py-2 rounded-xl text-slate-500 text-[10px] font-bold tracking-wider uppercase pointer-events-none select-none">
        🎯 Interactive Graph Canvas — Click Active Nodes to Study
      </div>
    </div>
  );
}
