'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRequest } from 'ahooks';
import {
  MessageSquare,
  Search,
  Send,
  X,
  RefreshCw,
  CheckCircle,
  Clock,
  ChevronUp,
  Headphones,
  User,
  Image as ImageIcon,
  Paperclip,
  Play,
  Pause,
  Download,
  MapPin,
  Undo2,
  Zap,
  FileText,
  WifiOff,
  Wifi,
} from 'lucide-react';
import { PageHeader } from '@/components/scaffold/PageHeader';
import { chatApi } from '@/api';
import type {
  ChatConversation,
  ChatMessage,
  QueryConversationsParams,
} from '@/type/types';
import { format } from 'date-fns';
import { useChatSocket, type SocketStatus } from '@/hooks/useChatSocket';
import { ModalManager } from '@repo/ui';

// ─── CDN 媒体 URL 工具 ────────────────────────────────────────────────────────

const IMG_BASE_URL =
  process.env.NEXT_PUBLIC_IMG_BASE_URL ?? 'https://img.joyminis.com';

function resolveMediaUrl(content: string): string {
  if (!content) return '';
  if (content.startsWith('https://') || content.startsWith('http://'))
    return content;
  if (content.startsWith('uploads/')) return `${IMG_BASE_URL}/${content}`;
  return `${IMG_BASE_URL}/${content.replace(/^\//, '')}`;
}

function resolveImageUrl(content: string, width = 240): string {
  const base = resolveMediaUrl(content);
  if (!base || !base.includes('uploads/')) return base;
  const key = base.substring(base.indexOf('uploads/'));
  return `${IMG_BASE_URL}/cdn-cgi/image/width=${width},quality=75,fit=cover,f=auto/${key}`;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(ms?: number): string {
  if (!ms) return '0s';
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

/** 生成波形柱高度（与 Flutter hashCode 算法对齐） */
function generateWaveform(messageId: string, barCount = 12): number[] {
  let seed = 0;
  for (let i = 0; i < messageId.length; i++) {
    seed = (Math.imul(31, seed) + messageId.charCodeAt(i)) | 0;
  }
  const heights: number[] = [];
  for (let i = 0; i < barCount; i++) {
    seed = (Math.imul(1664525, seed) + 1013904223) | 0;
    const rand = (seed >>> 0) / 0xffffffff;
    heights.push(0.3 + rand * 0.7);
  }
  return heights;
}

// ─── 快捷回复预设 ─────────────────────────────────────────────────────────────

const QUICK_REPLIES = [
  'Thank you for contacting support! How can I help you today?',
  'I understand your concern. Let me look into this for you.',
  'Your issue has been resolved. Please let us know if you need further assistance.',
  'Could you please provide more details about the problem?',
  'We apologize for the inconvenience. Our team is working on it.',
  'Your account has been updated successfully.',
  'Please allow 1-3 business days for the transaction to process.',
];

// ─── 工具函数 ────────────────────────────────────────────────────────────────

function formatTime(ms: number) {
  if (!ms) return '';
  try {
    return format(new Date(ms), 'MM/dd HH:mm');
  } catch {
    return '';
  }
}

function formatMsgTime(ms: number) {
  if (!ms) return '';
  try {
    return format(new Date(ms), 'HH:mm');
  } catch {
    return '';
  }
}

function getInitials(name: string | null) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

// ─── Socket 连接状态指示 ────────────────────────────────────────────────────

function SocketIndicator({ status }: { status: SocketStatus }) {
  if (status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2.5 py-1 rounded-full">
        <Wifi size={11} />
        Live
      </span>
    );
  }
  if (status === 'connecting') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 px-2.5 py-1 rounded-full">
        <RefreshCw size={11} className="animate-spin" />
        Connecting…
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-full">
      <WifiOff size={11} />
      Polling
    </span>
  );
}

// ─── 状态徽章 ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: number }) {
  if (status === 2) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
        <CheckCircle size={10} />
        Closed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400">
      <Clock size={10} />
      Active
    </span>
  );
}

// ─── 图片消息 ─────────────────────────────────────────────────────────────────

function ImageMessage({
  content,
  meta,
}: {
  content: string;
  meta: Record<string, unknown> | null;
}) {
  const [lightbox, setLightbox] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const thumbUrl = resolveImageUrl(content, 240);
  const fullUrl = resolveImageUrl(content, 1200);
  const w = meta?.w as number | undefined;
  const h = meta?.h as number | undefined;
  const aspect = w && h ? Math.min(2, Math.max(0.5, w / h)) : 1;

  return (
    <>
      <button
        onClick={() => setLightbox(true)}
        className="relative overflow-hidden rounded-xl cursor-pointer group"
        style={{ width: 200, aspectRatio: String(aspect) }}
      >
        {/* 占位 */}
        {!loaded && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-white/10 animate-pulse rounded-xl" />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbUrl}
          alt="image"
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover rounded-xl transition-opacity group-hover:opacity-90 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
          <Play size={20} className="text-white drop-shadow-lg" fill="white" />
        </div>
      </button>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
          >
            <X size={24} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fullUrl}
            alt="preview"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

// ─── 音频消息 ─────────────────────────────────────────────────────────────────

function AudioMessage({
  msgId,
  content,
  meta,
}: {
  msgId: string;
  content: string;
  meta: Record<string, unknown> | null;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const duration = meta?.duration as number | undefined;
  const bars = generateWaveform(msgId);
  const minW = 140;
  const dynW = Math.min(280, minW + Math.round((duration ?? 0) / 1000) * 5);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      void audioRef.current.play();
    }
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-2xl"
      style={{ width: dynW }}
    >
      <button
        onClick={toggle}
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
      >
        {playing ? <Pause size={12} /> : <Play size={12} fill="currentColor" />}
      </button>
      {/* 波形 */}
      <div className="flex items-center gap-[2px] flex-1">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`rounded-full transition-all ${playing ? 'bg-white animate-pulse' : 'bg-white/70'}`}
            style={{
              width: 3,
              height: `${Math.round(h * 20)}px`,
              animationDelay: `${(i * 80) % 500}ms`,
            }}
          />
        ))}
      </div>
      <span className="text-xs opacity-75 flex-shrink-0">
        {formatDuration(duration)}
      </span>
      <audio
        ref={audioRef}
        src={resolveMediaUrl(content)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
    </div>
  );
}

// ─── 视频消息 ─────────────────────────────────────────────────────────────────

function VideoMessage({
  content,
  meta,
}: {
  content: string;
  meta: Record<string, unknown> | null;
}) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const thumbUrl = (meta?.remote_thumb ?? meta?.thumb) as string | undefined;
  const thumbResolved = thumbUrl ? resolveImageUrl(thumbUrl, 240) : undefined;
  const videoUrl = resolveMediaUrl(content);
  const vw = meta?.w as number | undefined;
  const vh = meta?.h as number | undefined;
  const aspect = vw && vh ? Math.min(2, Math.max(0.5, vw / vh)) : 16 / 9;

  const handlePlay = () => {
    setPlaying(true);
    setTimeout(() => videoRef.current?.play(), 50);
  };

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{ width: 200, aspectRatio: String(aspect) }}
    >
      {playing ? (
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          autoPlay
          className="w-full h-full object-cover rounded-xl"
        />
      ) : (
        <>
          {thumbResolved ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbResolved}
              alt="video"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <Play size={24} className="text-white/50" />
            </div>
          )}
          {/* 时长 */}
          {meta?.duration && (
            <span className="absolute bottom-1.5 right-2 text-xs text-white bg-black/60 px-1.5 py-0.5 rounded">
              {formatDuration(meta.duration as number)}
            </span>
          )}
          {/* 播放按钮 */}
          <button
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play size={18} fill="white" className="text-white ml-0.5" />
            </div>
          </button>
        </>
      )}
    </div>
  );
}

// ─── 文件消息 ─────────────────────────────────────────────────────────────────

function FileMessage({
  content,
  meta,
  isSupport,
}: {
  content: string;
  meta: Record<string, unknown> | null;
  isSupport: boolean;
}) {
  const fileUrl = resolveMediaUrl(content);
  const fileName = (meta?.fileName as string) ?? 'file';
  const fileSize = meta?.fileSize as number | undefined;
  const fileExt = ((meta?.fileExt as string) ?? '').toUpperCase();

  return (
    <a
      href={fileUrl}
      download={fileName}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-52 group transition-colors ${
        isSupport
          ? 'bg-teal-600/80 hover:bg-teal-600 text-white'
          : 'bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-900 dark:text-white'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
          isSupport
            ? 'bg-white/20'
            : 'bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400'
        }`}
      >
        {fileExt || <FileText size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName}</p>
        {fileSize && (
          <p
            className={`text-xs ${isSupport ? 'text-white/70' : 'text-gray-400'}`}
          >
            {formatFileSize(fileSize)}
          </p>
        )}
      </div>
      <Download
        size={14}
        className="flex-shrink-0 opacity-60 group-hover:opacity-100"
      />
    </a>
  );
}

// ─── 位置消息 ─────────────────────────────────────────────────────────────────

function LocationMessage({ meta }: { meta: Record<string, unknown> | null }) {
  const thumb = meta?.thumb as string | undefined;
  const title = (meta?.title as string) ?? 'Location';
  const address = meta?.address as string | undefined;
  const lat = meta?.latitude as number | undefined;
  const lng = meta?.longitude as number | undefined;
  const mapsUrl =
    lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : undefined;

  return (
    <a
      href={mapsUrl ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl overflow-hidden w-48 group"
    >
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolveMediaUrl(thumb)}
          alt="map"
          className="w-full h-28 object-cover group-hover:opacity-90 transition-opacity"
        />
      ) : (
        <div className="w-full h-28 bg-gray-200 dark:bg-white/10 flex items-center justify-center">
          <MapPin size={24} className="text-gray-400" />
        </div>
      )}
      <div className="px-2 py-1.5 bg-white dark:bg-gray-800">
        <p className="text-xs font-medium text-gray-800 dark:text-white truncate">
          {title}
        </p>
        {address && <p className="text-xs text-gray-400 truncate">{address}</p>}
      </div>
    </a>
  );
}

// ─── 消息气泡 ─────────────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  onRecall,
}: {
  msg: ChatMessage;
  onRecall?: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  // type=99 系统通知（关闭会话等）
  if (msg.type === 99) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
          {msg.content}
        </span>
      </div>
    );
  }

  const isSupport = msg.isSystem; // senderId === null
  const senderName = isSupport
    ? ((msg.meta as Record<string, string> | null)?.agentName ?? 'Support')
    : (msg.sender?.nickname ?? 'User');

  const renderContent = () => {
    if (msg.isRecalled) {
      return (
        <span className="italic opacity-60 text-sm">[Message recalled]</span>
      );
    }
    const meta = msg.meta as Record<string, unknown> | null;
    switch (msg.type) {
      case 1: // image
        return <ImageMessage content={msg.content} meta={meta} />;
      case 2: // audio
        return (
          <AudioMessage msgId={msg.id} content={msg.content} meta={meta} />
        );
      case 3: // video
        return <VideoMessage content={msg.content} meta={meta} />;
      case 5: // file
        return (
          <FileMessage
            content={msg.content}
            meta={meta}
            isSupport={isSupport}
          />
        );
      case 6: // location
        return <LocationMessage meta={meta} />;
      default: // text (0) + fallback
        return (
          <span className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {msg.content}
          </span>
        );
    }
  };

  // 媒体消息（图片/视频/文件/位置）不显示外层气泡背景
  const isMediaBubble = !msg.isRecalled && [1, 3, 5, 6].includes(msg.type);
  // 音频消息 type=2 使用彩色背景
  const isAudioBubble = !msg.isRecalled && msg.type === 2;

  return (
    <div
      className={`flex gap-2 ${isSupport ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 头像 */}
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold self-end ${
          isSupport
            ? 'bg-teal-500'
            : 'bg-gradient-to-br from-blue-400 to-blue-600'
        }`}
      >
        {isSupport ? <Headphones size={13} /> : <User size={13} />}
      </div>

      {/* 气泡区 */}
      <div
        className={`max-w-[70%] ${isSupport ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}
      >
        <span className="text-xs text-gray-400 px-1">{senderName}</span>
        <div
          className={`rounded-2xl ${
            isMediaBubble
              ? '' // 无背景
              : isAudioBubble
                ? isSupport
                  ? 'bg-teal-500 text-white rounded-tr-sm'
                  : 'bg-blue-500 text-white rounded-tl-sm'
                : msg.isRecalled
                  ? 'bg-gray-100 dark:bg-white/5 text-gray-400 px-3 py-2'
                  : isSupport
                    ? 'bg-teal-500 text-white rounded-tr-sm px-3 py-2'
                    : 'bg-white dark:bg-white/10 text-gray-900 dark:text-white border border-gray-100 dark:border-white/10 rounded-tl-sm px-3 py-2'
          }`}
        >
          {renderContent()}
        </div>
        <div
          className={`flex items-center gap-1.5 px-1 ${isSupport ? 'flex-row-reverse' : ''}`}
        >
          <span className="text-xs text-gray-400">
            {formatMsgTime(msg.createdAt)}
          </span>
          {/* 撤回按钮 — 仅对客服消息且非已撤回 */}
          {isSupport && !msg.isRecalled && onRecall && hovered && (
            <button
              onClick={() => onRecall(msg.id)}
              title="Force recall"
              className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-0.5"
            >
              <Undo2 size={11} />
              <span className="text-[10px]">Recall</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 快捷回复面板 ─────────────────────────────────────────────────────────────

function QuickRepliesPanel({
  onSelect,
  onClose,
}: {
  onSelect: (text: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg overflow-hidden z-10">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-white/10">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Zap size={11} className="text-yellow-500" />
          Quick Replies
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={13} />
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {QUICK_REPLIES.map((text, i) => (
          <button
            key={i}
            onClick={() => {
              onSelect(text);
              onClose();
            }}
            className="w-full text-left text-sm px-3 py-2 hover:bg-teal-50 dark:hover:bg-teal-500/10 text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors truncate"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 聊天窗口 ─────────────────────────────────────────────────────────────────

function ChatWindow({
  conversation,
  onMessageSent,
  registerOnNewMessage,
  registerOnRecalled,
}: {
  conversation: ChatConversation;
  onMessageSent: () => void;
  registerOnNewMessage?: (fn: (msg: ChatMessage) => void) => void;
  registerOnRecalled?: (
    fn: (d: { conversationId: string; messageId: string }) => void,
  ) => void;
}) {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const user =
    conversation.members.find((m) => m.role !== 'OWNER') ??
    conversation.members[0];
  const displayName = user?.nickname ?? conversation.name ?? 'Unknown';

  // ── 实时消息回调注册 ──────────────────────────────────────────
  useEffect(() => {
    // 收到新消息时追加到末尾（去重 by id）
    registerOnNewMessage?.((msg) => {
      setAllMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    // 收到撤回事件时本地标记为已撤回
    registerOnRecalled?.((data) => {
      if (data.conversationId !== conversation.id) return;
      setAllMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? { ...m, isRecalled: true, content: '[Message recalled]' }
            : m,
        ),
      );
    });
  }, [conversation.id, registerOnNewMessage, registerOnRecalled]); // eslint-disable-line react-hooks/exhaustive-deps

  const { loading: loadingMsgs, run: fetchMessages } = useRequest(
    () => chatApi.getMessages(conversation.id, { pageSize: 30 }),
    {
      refreshDeps: [conversation.id],
      pollingInterval: 10000,
      onSuccess: (data) => {
        const sorted = [...data.list].reverse();
        setAllMessages(sorted);
        setCursor(data.nextCursor ?? undefined);
        setHasMore(data.nextCursor !== null);
      },
    },
  );

  // 加载更多历史消息
  const loadMore = useCallback(async () => {
    if (!hasMore || !cursor) return;
    const data = await chatApi.getMessages(conversation.id, {
      cursor,
      pageSize: 30,
    });
    const older = [...data.list].reverse();
    setAllMessages((prev) => [...older, ...prev]);
    setCursor(data.nextCursor ?? undefined);
    setHasMore(data.nextCursor !== null);
  }, [conversation.id, cursor, hasMore]);

  // 发送后滚到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  const handleSend = async (text?: string) => {
    const content = (text ?? replyText).trim();
    if (!content || sending) return;
    setSending(true);
    try {
      await chatApi.reply(conversation.id, { content, type: 0 });
      if (!text) setReplyText('');
      fetchMessages();
      onMessageSent();
    } finally {
      setSending(false);
    }
  };

  /** 上传文件并发送 */
  const handleFileUpload = async (
    file: File,
    msgType: number /* 1=image, 5=file */,
  ) => {
    setUploading(true);
    try {
      // 1. 获取预签名 URL
      const tokenResult = await chatApi.getUploadToken(file.name, file.type);
      // 2. 上传到 R2
      await fetch(tokenResult.url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      // 3. 构建 CDN URL / 相对路径
      const cdnUrl = tokenResult.cdnUrl ?? tokenResult.key;
      // 4. 构建 meta
      const meta: Record<string, unknown> = { fileName: file.name };
      if (msgType === 5) meta.fileSize = file.size;
      if (msgType === 1 && file.type.startsWith('image/')) {
        // 获取图片尺寸
        await new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => {
            meta.w = img.naturalWidth;
            meta.h = img.naturalHeight;
            resolve();
          };
          img.onerror = () => resolve();
          img.src = URL.createObjectURL(file);
        });
      }
      // 5. 发送消息
      await chatApi.reply(conversation.id, {
        content: cdnUrl,
        type: msgType,
        meta,
      });
      fetchMessages();
      onMessageSent();
    } finally {
      setUploading(false);
    }
  };

  /** 强制撤回消息 */
  const handleRecall = (messageId: string) => {
    ModalManager.open({
      title: 'Force Recall Message',
      content: 'Force recall this message?',
      confirmText: 'Recall',
      onConfirm: async () => {
        try {
          await chatApi.forceRecall(messageId);
          fetchMessages();
        } catch {
          alert('Failed to recall message');
        }
      },
    });
  };

  const handleClose = async () => {
    if (closing) return;
    setClosing(true);
    try {
      await chatApi.closeConversation(conversation.id, {
        reason: 'Resolved by support agent',
      });
      onMessageSent();
      fetchMessages();
    } finally {
      setClosing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const isClosed = conversation.status === 2;

  return (
    <div className="flex flex-col h-full">
      {/* 顶栏 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-white/10 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-sm font-semibold">
            {getInitials(displayName)}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {displayName}
            </p>
            <p className="text-xs text-gray-400">
              {conversation.id.slice(0, 12)}…
            </p>
          </div>
          <StatusBadge status={conversation.status} />
        </div>
        <div className="flex items-center gap-2">
          {!isClosed && (
            <button
              onClick={() => void handleClose()}
              disabled={closing}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors disabled:opacity-50"
            >
              <X size={12} />
              {closing ? 'Closing…' : 'Close Ticket'}
            </button>
          )}
          <button
            onClick={fetchMessages}
            disabled={loadingMsgs}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <RefreshCw
              size={14}
              className={loadingMsgs ? 'animate-spin' : ''}
            />
          </button>
        </div>
      </div>

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50 dark:bg-gray-950">
        {hasMore && (
          <div className="flex justify-center">
            <button
              onClick={() => void loadMore()}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-teal-500 transition-colors"
            >
              <ChevronUp size={14} />
              Load earlier messages
            </button>
          </div>
        )}

        {loadingMsgs && allMessages.length === 0 && (
          <div className="flex justify-center py-8 text-gray-400 text-sm">
            Loading messages…
          </div>
        )}

        {!loadingMsgs && allMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <MessageSquare size={32} className="mb-2 opacity-40" />
            <p className="text-sm">No messages yet</p>
          </div>
        )}

        {allMessages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} onRecall={handleRecall} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 回复栏 */}
      {isClosed ? (
        <div className="px-5 py-4 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-gray-900 text-center text-sm text-gray-400">
          This conversation is closed.
        </div>
      ) : (
        <div className="px-5 py-3 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-gray-900">
          {/* 隐藏 file input */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFileUpload(file, 1);
              e.target.value = '';
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFileUpload(file, 5);
              e.target.value = '';
            }}
          />

          {/* 输入区（含快捷回复） */}
          <div className="relative">
            {showQuickReplies && (
              <QuickRepliesPanel
                onSelect={(text) => setReplyText(text)}
                onClose={() => setShowQuickReplies(false)}
              />
            )}

            <div className="flex items-end gap-2">
              {/* 工具按钮 */}
              <div className="flex items-center gap-1 mb-1">
                <button
                  onClick={() => setShowQuickReplies((v) => !v)}
                  title="Quick replies"
                  className={`p-1.5 rounded-lg transition-colors ${
                    showQuickReplies
                      ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10'
                      : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  <Zap size={15} />
                </button>
                <button
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploading}
                  title="Send image"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-teal-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-40"
                >
                  <ImageIcon size={15} />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Send file"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-teal-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-40"
                >
                  <Paperclip size={15} />
                </button>
              </div>

              <textarea
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  uploading
                    ? 'Uploading…'
                    : 'Type a reply… (Enter to send, Shift+Enter for new line)'
                }
                disabled={uploading}
                className="flex-1 resize-none text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 disabled:opacity-60"
              />
              <button
                onClick={() => void handleSend()}
                disabled={
                  (!replyText.trim() && !uploading) || sending || uploading
                }
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 会话列表项 ───────────────────────────────────────────────────────────────

function ConversationItem({
  conv,
  isActive,
  unreadCount = 0,
  onClick,
}: {
  conv: ChatConversation;
  isActive: boolean;
  unreadCount?: number;
  onClick: () => void;
}) {
  const user = conv.members.find((m) => m.role !== 'OWNER') ?? conv.members[0];
  const displayName = user?.nickname ?? conv.name ?? 'Unknown';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl transition-all ${
        isActive
          ? 'bg-teal-50 dark:bg-teal-500/15 border border-teal-200 dark:border-teal-500/30'
          : 'hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* 头像 + 未读角标 */}
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-sm font-semibold">
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(displayName)
            )}
          </div>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span
              className={`text-sm font-medium truncate ${unreadCount > 0 ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-900 dark:text-white'}`}
            >
              {displayName}
            </span>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatTime(conv.lastMsgTime)}
            </span>
          </div>
          <p
            className={`text-xs truncate ${unreadCount > 0 ? 'text-gray-700 dark:text-gray-200 font-medium' : 'text-gray-500 dark:text-gray-400'}`}
          >
            {conv.lastMsgContent ?? 'No messages yet'}
          </p>
          <div className="mt-1">
            <StatusBadge status={conv.status} />
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export function CustomerServiceDesk() {
  const [selectedConv, setSelectedConv] = useState<ChatConversation | null>(
    null,
  );
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | undefined>(
    undefined,
  );
  const [page, setPage] = useState(1);
  // 本地记录每个会话的「最后已读 seqId」，用于计算未读数角标
  const [lastSeenSeqId, setLastSeenSeqId] = useState<Record<string, number>>(
    {},
  );

  const queryParams: QueryConversationsParams = {
    page,
    pageSize: 30,
    type: 'SUPPORT',
    keyword: keyword || undefined,
    status: statusFilter,
  };

  const {
    data,
    loading,
    run: refreshList,
  } = useRequest(() => chatApi.getConversations(queryParams), {
    refreshDeps: [page, keyword, statusFilter],
    pollingInterval: 30000, // 30s fallback 轮询（Socket 实时为主）
  });

  const conversations = data?.list ?? [];
  const total = data?.total ?? 0;

  // ── Socket.IO 实时连接 ──
  const { status: socketStatus } = useChatSocket({
    conversationId: selectedConv?.id ?? null,
    onMessage: useCallback(
      (msg: ChatMessage) => {
        // 通知 ChatWindow 有新消息（通过 ref 回调）
        onNewMessageRef.current?.(msg);
        // 刷新会话列表（更新 lastMsgContent/lastMsgTime）
        refreshList();
      },
      [refreshList],
    ),
    onRecalled: useCallback((data) => {
      onRecalledRef.current?.(data);
    }, []),
    onConversationUpdated: useCallback(() => {
      refreshList();
    }, [refreshList]),
  });

  // 这两个 ref 由 ChatWindow 注册，用于把 socket 事件路由到正确的窗口
  const onNewMessageRef = useRef<((msg: ChatMessage) => void) | null>(null);
  const onRecalledRef = useRef<
    ((d: { conversationId: string; messageId: string }) => void) | null
  >(null);

  // 选中某会话后：更新「已读 seqId」
  const handleSelectConv = (conv: ChatConversation) => {
    setSelectedConv(conv);
    setLastSeenSeqId((prev) => ({ ...prev, [conv.id]: conv.lastMsgSeqId }));
  };

  // 同步更新 selectedConv（列表刷新后）
  useEffect(() => {
    if (selectedConv && conversations.length > 0) {
      const updated = conversations.find((c) => c.id === selectedConv.id);
      if (updated) setSelectedConv(updated);
    }
  }, [conversations]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-full gap-0">
      <PageHeader
        title="Customer Service Desk"
        description="Handle support conversations from users"
        action={<SocketIndicator status={socketStatus} />}
      />

      <div className="flex flex-1 min-h-0 gap-4 mt-4">
        {/* ── 左侧：会话列表 ────────────────────────── */}
        <div className="w-80 flex-shrink-0 flex flex-col rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-gray-900 overflow-hidden">
          {/* 搜索 + 过滤 */}
          <div className="p-3 border-b border-gray-100 dark:border-white/10 space-y-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search user or keyword…"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
            {/* 状态标签 */}
            <div className="flex gap-1.5">
              {[
                { label: 'All', value: undefined },
                { label: 'Active', value: 1 },
                { label: 'Closed', value: 2 },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => {
                    setStatusFilter(opt.value);
                    setPage(1);
                  }}
                  className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${
                    statusFilter === opt.value
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <button
                onClick={() => refreshList()}
                disabled={loading}
                className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <RefreshCw
                  size={13}
                  className={loading ? 'animate-spin' : ''}
                />
              </button>
            </div>
          </div>

          {/* 列表 */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading && conversations.length === 0 && (
              <div className="flex justify-center py-8 text-gray-400 text-sm">
                Loading…
              </div>
            )}
            {!loading && conversations.length === 0 && (
              <div className="flex flex-col items-center py-12 text-gray-400">
                <MessageSquare size={28} className="mb-2 opacity-40" />
                <p className="text-sm">No conversations</p>
              </div>
            )}
            {conversations.map((conv) => {
              const unread = Math.max(
                0,
                conv.lastMsgSeqId -
                  (lastSeenSeqId[conv.id] ?? conv.lastMsgSeqId),
              );
              return (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={selectedConv?.id === conv.id}
                  unreadCount={unread}
                  onClick={() => handleSelectConv(conv)}
                />
              );
            })}
          </div>

          {/* 分页 */}
          {total > 30 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-white/10">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/5 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                Prev
              </button>
              <span className="text-xs text-gray-400">
                {(page - 1) * 30 + 1}–{Math.min(page * 30, total)} / {total}
              </span>
              <button
                disabled={page * 30 >= total}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/5 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* ── 右侧：聊天窗口 ────────────────────────── */}
        <div className="flex-1 min-w-0 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden bg-white dark:bg-gray-900">
          {selectedConv ? (
            <ChatWindow
              key={selectedConv.id}
              conversation={selectedConv}
              onMessageSent={refreshList}
              registerOnNewMessage={(fn) => {
                onNewMessageRef.current = fn;
              }}
              registerOnRecalled={(fn) => {
                onRecalledRef.current = fn;
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 select-none">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p className="text-base font-medium">Select a conversation</p>
              <p className="text-sm mt-1 opacity-60">
                Choose a support ticket from the left to start responding
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
