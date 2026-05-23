import { Database } from 'lucide-react';

export default function PromptsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
        <Database className="w-8 h-8 text-blue-600" />
      </div>
      <h1 className="text-3xl font-display font-bold text-gray-900 mb-4">Prompts Library</h1>
      <p className="text-gray-500 max-w-md mx-auto text-lg">
        The Prompts Library is a premium feature allowing you to save, share, and test custom agentic prompt pipelines. 
        It is currently in development and will be available in the next release.
      </p>
    </div>
  );
}
