import React, { useState } from 'react';
import { useRequest } from 'ahooks';
import { Button } from '@repo/ui';
import { User, ShieldCheck, AlertCircle, Video } from 'lucide-react';
import { KYC_STATUS, TimeHelper } from '@lucky/shared';
import { useToastStore } from '@/store/useToastStore';
import { SmartImage } from '@/components/ui/SmartImage';
import { KycRecord } from '@/type/types.ts';
import { kycApi } from '@/api'; // ✅ 1. 引入 SmartImage

interface Props {
  data: KycRecord;
  close: () => void;
  reload: () => void;
}

// ✅ 2. 修改 ImageCard 组件，使用 SmartImage
const ImageCard = ({ title, src }: { title: string; src?: string }) => (
  <div className="border border-gray-200 dark:border-white/10 rounded-lg p-2 bg-gray-50 dark:bg-white/5">
    <div className="text-xs text-gray-500 mb-2 font-medium">{title}</div>
    {src ? (
      <div className="relative aspect-video rounded-md overflow-hidden bg-black/5 dark:bg-white/5 cursor-pointer group">
        <SmartImage
          src={src}
          alt={title}
          // 为了审核清晰，这里设大一点的宽高基准，实际显示由 CSS 控制
          width={800}
          height={450}
          layout="constrained"
          // 让图片充满容器，并保持 object-cover
          className="w-full h-full"
          imgClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* 悬停遮罩提示 */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium backdrop-blur-[2px]">
          Click to Zoom
        </div>
      </div>
    ) : (
      <div className="aspect-video flex items-center justify-center text-gray-400 text-xs bg-gray-100 dark:bg-white/5 rounded-md border border-dashed border-gray-200 dark:border-white/10">
        No Image
      </div>
    )}
  </div>
);

export const KycAuditModal: React.FC<Props> = ({ data, close, reload }) => {
  const [remark, setRemark] = useState('');
  const addToast = useToastStore((state) => state.addToast);

  const isReviewing = data.kycStatus === KYC_STATUS.REVIEWING;

  const { run: submitAudit, loading } = useRequest(kycApi.audit, {
    manual: true,
    onSuccess: () => {
      addToast('success', 'Audit submitted successfully');
      reload();
      close();
    },
    onError: (err) => {
      addToast('error', err.message || 'Audit failed');
    },
  });

  const handleAudit = (action: 'APPROVE' | 'REJECT' | 'NEED_MORE') => {
    if (!remark && action !== 'APPROVE') {
      return addToast('error', 'Please enter a remark for rejection.');
    }
    submitAudit(data.id, { action, remark });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[70vh] overflow-hidden">
      {/* LEFT: Evidence Area (Images & Video) - Scrollable */}
      <div className="lg:col-span-3 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white dark:bg-gray-900 z-10 py-2">
          <ShieldCheck className="text-primary-600" size={18} />
          <h3 className="font-bold text-gray-800 dark:text-white">
            Identity Evidence
          </h3>
        </div>

        {/* 证件照区域 */}
        <div className="grid grid-cols-2 gap-4">
          <ImageCard title="ID Card Front" src={data.idCardFront} />
          <ImageCard title="ID Card Back" src={data.idCardBack} />
        </div>

        {/* 人脸与活体区域 */}
        <div className="grid grid-cols-2 gap-4">
          <ImageCard title="Face / Selfie" src={data.faceImage} />

          {/* 视频区域保持原样，也可以封装 Video 组件 */}
          <div className="border border-gray-200 dark:border-white/10 rounded-lg p-2 bg-gray-50 dark:bg-white/5">
            <div className="text-xs text-gray-500 mb-2 font-medium flex justify-between">
              <span>Liveness Video</span>
              {data.livenessScore && (
                <span
                  className={
                    data.livenessScore > 90
                      ? 'text-green-600'
                      : 'text-amber-500'
                  }
                >
                  Score: {data.livenessScore.toFixed(1)}%
                </span>
              )}
            </div>
            {data.videoUrl ? (
              <video
                src={data.videoUrl}
                controls
                className="w-full h-auto rounded-md aspect-video bg-black object-contain"
              />
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center text-gray-400 text-xs bg-gray-100 dark:bg-white/5 rounded-md border border-dashed border-gray-200 dark:border-white/10">
                <Video size={24} className="mb-1 opacity-50" />
                No Video
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Info & Action Area */}
      <div className="lg:col-span-2 flex flex-col border-l border-gray-100 dark:border-white/10 pl-6 bg-white dark:bg-gray-900">
        {/* User Info */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <User className="text-primary-600" size={18} />
            <h3 className="font-bold text-gray-800 dark:text-white">
              Applicant Info
            </h3>
          </div>
          <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl space-y-3 text-sm border border-gray-100 dark:border-white/5">
            <div className="flex justify-between">
              <span className="text-gray-500">User ID</span>
              <span className="font-mono select-all">{data.userId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Nickname</span>
              <span className="font-medium">{data.user?.nickname || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone</span>
              <span className="font-medium">{data.user?.phone || '-'}</span>
            </div>
            <div className="border-t border-dashed border-gray-200 dark:border-white/10 my-2 pt-2"></div>
            <div className="flex justify-between">
              <span className="text-gray-500">Submitted Name</span>
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                {data.realName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">ID Number</span>
              <code className="bg-white dark:bg-black/20 px-2 py-1 rounded border border-gray-200 dark:border-white/10 font-mono text-primary-600 font-bold select-all">
                {data.idNumber}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Submitted At</span>
              <span>{TimeHelper.formatDateTime(data.submittedAt)}</span>
            </div>
          </div>
        </div>

        {/* Audit Actions - Sticky Bottom */}
        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="text-primary-600" size={18} />
            <h3 className="font-bold text-gray-800 dark:text-white">
              Audit Decision
            </h3>
          </div>

          <textarea
            className="w-full h-24 border border-gray-200 dark:border-white/20 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50 dark:bg-white/5 resize-none mb-4 transition-all"
            disabled={!isReviewing}
            placeholder={
              isReviewing
                ? 'Enter audit remark (required for rejection)...'
                : 'Audit remark...'
            }
            value={
              isReviewing ? remark : data.auditResult || data.rejectReason || ''
            }
            onChange={(e) => setRemark(e.target.value)}
          />

          {isReviewing ? (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="danger"
                isLoading={loading}
                disabled={!remark} // Reject requires remark
                onClick={() => handleAudit('REJECT')}
                className="w-full"
              >
                Reject
              </Button>
              <Button
                variant="primary"
                isLoading={loading}
                onClick={() => handleAudit('APPROVE')}
                className="w-full"
              >
                Approve
              </Button>
            </div>
          ) : (
            <div
              className={`text-center p-3 rounded-lg font-bold border ${
                data.kycStatus === KYC_STATUS.APPROVED
                  ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                  : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-800'
              }`}
            >
              {data.kycStatus === KYC_STATUS.APPROVED
                ? 'Current Status: Approved'
                : 'Current Status: Rejected'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
