import React, { useState, useEffect } from 'react';
import { X, Bot, Stethoscope, AlertTriangle, Clock } from 'lucide-react';
import { aiApi } from '../../services/api';
import ReactMarkdown from 'react-markdown';

interface GlobalReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
}

export const GlobalReviewModal: React.FC<GlobalReviewModalProps> = ({ 
  isOpen, 
  onClose, 
  projectId,
  projectTitle
}) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !report) {
      startReview();
    }
  }, [isOpen]);

  const startReview = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the new dedicated Global Review API endpoint
      const response = await aiApi.reviewGlobal(projectId);
      
      console.log('Global Review Response:', response); // Debug log
      
      if (response.success && response.data?.report) {
        setReport(response.data.report);
      } else {
        console.error('Response format issue:', response); // Debug log
        setError(response.error?.message || '审阅失败，请稍后重试');
      }
    } catch (err: any) {
      console.error('Global Review Error:', err); // Debug log
      if (err.response?.status === 429) {
        setError("AI 服务繁忙 (429)。由于全书审阅消耗较大，请稍后再试。");
      } else {
        setError(err.message || "审阅失败，请检查网络连接。");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-gray-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center gap-3">
             <div className="bg-purple-100 p-2 rounded-lg">
                <Stethoscope size={24} className="text-purple-600" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-gray-800">全书体检报告</h2>
                <p className="text-sm text-gray-500">针对《{projectTitle}》的深度逻辑与节奏分析</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white min-h-[300px]">
           {loading && (
             <div className="flex flex-col items-center justify-center h-full space-y-4 py-12">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                    <Bot size={24} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-600" />
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-800">AI 正在通读全书...</h3>
                    <p className="text-sm text-gray-500 max-w-md mt-2">
                        正在聚合所有章节摘要，检查伏笔回收与人物行为逻辑。
                        <br/>这可能需要 30-60 秒，请耐心等待。
                    </p>
                </div>
             </div>
           )}

           {error && (
             <div className="flex flex-col items-center justify-center h-full py-12">
                <AlertTriangle size={48} className="text-red-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-800">无法完成审阅</h3>
                <p className="text-gray-500 mt-2">{error}</p>
                <button 
                    onClick={startReview}
                    className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                    重试
                </button>
             </div>
           )}

           {!loading && !error && report && (
             <div className="prose prose-purple max-w-none">
                <ReactMarkdown>{report}</ReactMarkdown>
             </div>
           )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-between items-center text-sm text-gray-500">
             <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>生成时间: {new Date().toLocaleTimeString()}</span>
             </div>
             <div className="flex gap-3">
                 <button onClick={startReview} className="text-purple-600 hover:underline">重新生成</button>
                 <button 
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                    onClick={onClose}
                 >
                    关闭
                 </button>
             </div>
        </div>
      </div>
    </div>
  );
};
