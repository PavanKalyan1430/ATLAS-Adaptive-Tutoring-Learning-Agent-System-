import { useStore } from '../store';
import { Database, Activity, Clock, Server, CheckCircle2, AlertCircle, ArrowUpRight, Cpu, Network, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';
import { CardContainer, CardBody, CardItem } from '../components/ui/3d-card';

function cn(...inputs) { return twMerge(clsx(inputs)); }

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
};

export default function Dashboard() {
  const { documents, analytics } = useStore();

  const totalChunks = documents.reduce((sum, d) => sum + (d.chunk_count || 0), 0);
  const readyDocs = documents.filter(d => d.status === 'ready').length;

  return (
    <div className="h-full w-full p-8 lg:p-10 bg-transparent overflow-y-auto custom-scrollbar relative">
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-6 max-w-[1600px] mx-auto relative z-10">
        
        {/* Header */}
        <motion.div variants={item} className="flex justify-between items-end mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-[24px] font-display font-semibold text-[#111827] dark:text-white tracking-tight leading-none">Command Center</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wider">Live</span>
            </div>
            <p className="text-[14px] text-[#6B7280] dark:text-zinc-400">
              Global orchestration metrics, vector node health, and autonomous agent routing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-mono text-gray-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-3 py-1.5 rounded-md shadow-sm">
              Last sync: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </motion.div>

        {/* Telemetry Grid (Dense Metrics) */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <TelemetryCard 
            title="Total Embeddings" 
            value={totalChunks.toLocaleString()} 
            unit="Vectors"
            delta="+12%"
            deltaType="positive"
            icon={<Database className="w-4 h-4 text-indigo-600" />} 
            sparkline={[30, 40, 35, 50, 49, 60, 70, 91, 125]}
          />
          <TelemetryCard 
            title="Knowledge Sources" 
            value={readyDocs} 
            unit="Active Docs"
            delta="Nominal"
            deltaType="neutral"
            icon={<Server className="w-4 h-4 text-emerald-600" />} 
            sparkline={[2, 2, 3, 3, 4, 4, 4, 5, 5]}
          />
          <TelemetryCard 
            title="Graph Executions" 
            value={analytics.totalQueries.toLocaleString()} 
            unit="Queries"
            delta="+4.2%"
            deltaType="positive"
            icon={<Network className="w-4 h-4 text-blue-600" />} 
            sparkline={[10, 15, 25, 20, 35, 45, 60, 50, 80]}
          />
          <TelemetryCard 
            title="P95 Latency" 
            value={analytics.avgResponseTime ? (analytics.avgResponseTime / 1000).toFixed(2) : '0.00'} 
            unit="Seconds"
            delta="-150ms"
            deltaType="positive"
            icon={<Clock className="w-4 h-4 text-orange-600" />} 
            sparkline={[1.5, 1.4, 1.6, 1.2, 1.1, 0.9, 0.85, 0.8, 0.82]}
            reverseSparkline
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
          
          {/* Active Workers Data Table */}
          <motion.div variants={item} className="lg:col-span-2 bento-card overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-black/5 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 flex justify-between items-center backdrop-blur-md">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-800 dark:text-zinc-200 uppercase tracking-wide">
                <Cpu className="w-4 h-4 text-gray-500 dark:text-zinc-400" /> Infrastructure Nodes
              </div>
              <button className="text-[12px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center gap-1">
                View Logs <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/20">
                    <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Service</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Model / Engine</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Uptime</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider text-right">Ping</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-gray-700 dark:text-zinc-200 font-medium">
                  <tr className="border-b border-gray-50 dark:border-zinc-800/30 hover:bg-gray-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                    <td className="px-5 py-3">Vector Database</td>
                    <td className="px-5 py-3"><StatusBadge status="operational" /></td>
                    <td className="px-5 py-3 font-mono text-[12px] text-gray-500 dark:text-zinc-400">Qdrant v1.8.0</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-zinc-400">99.99%</td>
                    <td className="px-5 py-3 text-right font-mono text-[12px] text-gray-500 dark:text-zinc-400">12ms</td>
                  </tr>
                  <tr className="border-b border-gray-50 dark:border-zinc-800/30 hover:bg-gray-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                    <td className="px-5 py-3">Primary LLM</td>
                    <td className="px-5 py-3"><StatusBadge status="operational" /></td>
                    <td className="px-5 py-3 font-mono text-[12px] text-gray-500 dark:text-zinc-400">gpt-4o-mini</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-zinc-400">100.0%</td>
                    <td className="px-5 py-3 text-right font-mono text-[12px] text-gray-500 dark:text-zinc-400">340ms</td>
                  </tr>
                  <tr className="border-b border-gray-50 dark:border-zinc-800/30 hover:bg-gray-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                    <td className="px-5 py-3">Fallback LLM</td>
                    <td className="px-5 py-3"><StatusBadge status="standby" /></td>
                    <td className="px-5 py-3 font-mono text-[12px] text-gray-500 dark:text-zinc-400">llama-3-8b</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-zinc-400">—</td>
                    <td className="px-5 py-3 text-right font-mono text-[12px] text-gray-500 dark:text-zinc-400">—</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                    <td className="px-5 py-3">Embedding Engine</td>
                    <td className="px-5 py-3"><StatusBadge status="operational" /></td>
                    <td className="px-5 py-3 font-mono text-[12px] text-gray-500 dark:text-zinc-400">BGE-Base-En</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-zinc-400">99.98%</td>
                    <td className="px-5 py-3 text-right font-mono text-[12px] text-gray-500 dark:text-zinc-400">85ms</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            
            {/* System Health */}
            <motion.div variants={item} className="bento-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/45">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">System Nominal</h3>
                  <p className="text-[12px] text-gray-500 dark:text-zinc-400">All routing paths verified</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[12px] font-medium">
                    <span className="text-gray-600 dark:text-zinc-400">Memory Pressure</span>
                    <span className="text-gray-900 dark:text-white">32%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '32%' }}></div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[12px] font-medium">
                    <span className="text-gray-600 dark:text-zinc-400">Vector Storage</span>
                    <span className="text-gray-900 dark:text-white">1.4 GB / 50 GB</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5">
                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '8%' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={item} className="bento-card flex flex-col flex-1">
              <div className="px-5 py-4 border-b border-black/5 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md">
                <h3 className="text-[13px] font-semibold text-gray-800 dark:text-zinc-200 uppercase tracking-wide">Quick Operations</h3>
              </div>
              <div className="p-2 flex flex-col gap-1">
                <Link to="/chat" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/20 transition-colors group">
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-md group-hover:bg-blue-600 group-hover:text-white dark:group-hover:text-white transition-colors">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-gray-900 dark:text-white">Launch Analyst Terminal</span>
                    <span className="text-[11px] text-gray-500 dark:text-zinc-400">Begin hybrid document querying</span>
                  </div>
                </Link>
                <Link to="/documents" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/20 transition-colors group">
                  <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-md group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:text-white transition-colors">
                    <Database className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-gray-900 dark:text-white">Manage Datasets</span>
                    <span className="text-[11px] text-gray-500 dark:text-zinc-400">Upload and chunk new PDFs</span>
                  </div>
                </Link>
              </div>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Subcomponents

function TelemetryCard({ title, value, unit, icon, delta, deltaType, sparkline, reverseSparkline }) {
  // Simple mock SVG sparkline generator
  const max = Math.max(...sparkline);
  const min = Math.min(...sparkline);
  const range = max - min || 1;
  const points = sparkline.map((val, i) => {
    const x = (i / (sparkline.length - 1)) * 100;
    const y = 100 - (((val - min) / range) * 100);
    return `${x},${y}`;
  }).join(' ');

  const strokeColor = deltaType === 'positive' ? (reverseSparkline ? '#10B981' : '#10B981') : (deltaType === 'negative' ? '#EF4444' : '#6B7280');

  return (
    <CardContainer className="w-full">
      <CardBody className="bento-card p-5 flex flex-col relative overflow-hidden group w-full h-full">
        <CardItem translateZ="20" className="flex justify-between items-start mb-3 w-full">
          <h3 className="text-[12px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{title}</h3>
          <div className="p-1.5 bg-white/50 dark:bg-zinc-800/40 rounded-lg border border-black/5 dark:border-zinc-700/50 text-gray-500 dark:text-zinc-400 group-hover:bg-white dark:group-hover:bg-zinc-800 transition-colors">
            {icon}
          </div>
        </CardItem>
        
        <CardItem translateZ="40" className="flex items-baseline gap-2 mb-4 w-full">
          <span className="text-[28px] font-mono font-bold text-gray-900 dark:text-white tracking-tight leading-none">{value}</span>
          <span className="text-[12px] font-medium text-gray-500 dark:text-zinc-400">{unit}</span>
        </CardItem>

        <CardItem translateZ="30" className="flex justify-between items-end mt-auto w-full">
          <span className={cn(
            "text-[11px] font-bold px-2 py-0.5 rounded-md",
            deltaType === 'positive' ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400" : 
            deltaType === 'negative' ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400" : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400"
          )}>
            {delta}
          </span>
          
          {/* SVG Sparkline */}
          <div className="w-20 h-8 opacity-80 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 -10 100 120" className="w-full h-full preserve-aspect-ratio-none">
              <polyline 
                fill="none" 
                stroke={strokeColor} 
                strokeWidth="4" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                points={points} 
              />
            </svg>
          </div>
        </CardItem>
      </CardBody>
    </CardContainer>
  );
}

function StatusBadge({ status }) {
  if (status === 'operational') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
        <span className="text-[10px] font-bold uppercase tracking-wider">Operational</span>
      </div>
    );
  }
  if (status === 'standby') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/25 border border-amber-100 dark:border-amber-900/40 text-amber-700 dark:text-amber-400">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        <span className="text-[10px] font-bold uppercase tracking-wider">Standby</span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/25 border border-red-100 dark:border-red-900/40 text-red-700 dark:text-red-400">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
      <span className="text-[10px] font-bold uppercase tracking-wider">Offline</span>
    </div>
  );
}
