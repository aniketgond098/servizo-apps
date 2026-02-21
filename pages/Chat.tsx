import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, ExternalLink, Phone, Video, Info, Image, Smile, Lock, Check, CheckCheck, Paperclip, X, FileText, Download, ZoomIn, Mic, MicOff, Volume2, VolumeX, PhoneOff, VideoOff, Camera, Minimize2, Maximize2 } from 'lucide-react';
import { DB } from '../services/db';
import { AuthService } from '../services/auth';
import { Message, MessageAttachment, Call } from '../types';
import { startOutgoingRing, stopOutgoingRing, playConnectedSound, playEndCallSound, playBusySound } from '../utils/callSounds';

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🫣','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐']
  },
  {
    name: 'Gestures',
    emojis: ['👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','👏','🙌','🫶','🤝','🙏','💪','🦾','🫂']
  },
  {
    name: 'Hearts',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','💕','💞','💓','💗','💖','💘','💝','💟']
  },
  {
    name: 'Objects',
    emojis: ['🔧','🔨','⚡','🔩','🛠️','🪛','🪜','🧰','🪠','🔑','🏠','🏡','🏢','🚗','📱','💻','📸','📦','💰','💳','📋','📌','✅','⭐','🔔','💡','🎯','🚀','💎','🏆']
  }
];

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.stunprotocol.org:3478' },
  ],
  iceCandidatePoolSize: 10,
};

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatUser, setChatUser] = useState<any>(null);
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState(0);

  // Call state
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [callState, setCallState] = useState<'idle' | 'ringing' | 'connected' | 'ended' | 'not_answering'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  // Keep refs in sync so async WebRTC callbacks always see the latest values
  const setActiveCallSync = (call: Call | null) => { activeCallRef.current = call; setActiveCall(call); };
  const setCallDurationSync = (d: number | ((p: number) => number)) => {
    setCallDuration(prev => {
      const next = typeof d === 'function' ? d(prev) : d;
      callDurationRef.current = next;
      return next;
    });
  };
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const attachRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const disconnectGraceRef = useRef<NodeJS.Timeout | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const unsubCallRef = useRef<(() => void) | null>(null);
  const unsubIceRef = useRef<(() => void) | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);
  // Refs to always have latest state inside async callbacks
  const activeCallRef = useRef<Call | null>(null);
  const callDurationRef = useRef(0);
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    if (!userId) return;

      // Load chat user info
      (async () => {
        const specialists = await DB.getSpecialists();

        // userId in the URL may be a user ID or a specialist doc ID — resolve both
        let user = await DB.getUserById(userId);
        let specialist = specialists.find(s => s.id === userId || s.userId === userId);

        // If not found by user ID, try resolving via the specialist doc
        if (!user && specialist) {
          user = await DB.getUserById(specialist.userId);
        }

        if (specialist) {
          const displayName = `${specialist.name} (${specialist.category})`;
          setChatUser({ ...(user || { id: userId, role: 'worker' }), name: specialist.name, displayName });
          setSpecialistId(specialist.id);
        } else if (user) {
          if (user.role === 'worker') {
            const sp = specialists.find(s => s.userId === user!.id);
            setChatUser({ ...user, displayName: sp ? `${user.name} (${sp.category})` : `${user.name} (Service Provider)` });
            if (sp) setSpecialistId(sp.id);
          } else {
            setChatUser({ ...user, displayName: user.name });
          }
        } else {
          setChatUser({ id: userId, name: 'Unknown User', displayName: 'Unknown User', role: 'user' as const });
        }
      })();

      // Resolve specialist doc ID → actual user ID for conversation queries
      const resolvedUserId = await DB.resolveToUserId(userId);

      // Real-time conversation listener
      DB.markMessagesAsRead(currentUser.id, resolvedUserId);
      const unsubMessages = DB.onConversation(currentUser.id, resolvedUserId, (msgs) => {
        setMessages(msgs);
        DB.markMessagesAsRead(currentUser.id, resolvedUserId);
      });

      return () => { unsubMessages(); };
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmojiPicker(false);
      if (attachRef.current && !attachRef.current.contains(e.target as Node)) setShowAttachMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Call timer
  useEffect(() => {
    if (callState === 'connected') {
      callTimerRef.current = setInterval(() => setCallDurationSync(prev => prev + 1), 1000);
    } else {
      if (callTimerRef.current) { clearInterval(callTimerRef.current); callTimerRef.current = null; }
    }
    return () => { if (callTimerRef.current) clearInterval(callTimerRef.current); };
  }, [callState]);

    // Cleanup on unmount
    useEffect(() => {
      return () => { cleanupCall(); };
    }, []);

    // Re-attach streams to video/audio elements when callState changes to connected
    // (elements may not exist in DOM until the connected UI renders)
    useEffect(() => {
      if (callState === 'connected') {
        if (remoteStreamRef.current) {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
          }
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStreamRef.current;
          }
        }
        if (localStreamRef.current && localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }
    }, [callState]);

    const cleanupCall = () => {
      stopOutgoingRing();
      if (callTimeoutRef.current) { clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; }
      if (disconnectGraceRef.current) { clearTimeout(disconnectGraceRef.current); disconnectGraceRef.current = null; }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
      if (unsubCallRef.current) { unsubCallRef.current(); unsubCallRef.current = null; }
      if (unsubIceRef.current) { unsubIceRef.current(); unsubIceRef.current = null; }
      pendingCandidatesRef.current = [];
    };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !userId) return;
    setLoading(true);
    const text = newMessage;
    setNewMessage('');
    await DB.sendMessage(
      { senderId: currentUser.id, receiverId: userId, content: text, messageType: 'text' },
      currentUser.name
    );
    setLoading(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !userId) return;
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) return;
    setUploadingFile(true); setShowAttachMenu(false);
    try {
        const url = await DB.uploadPhoto(file);
        await DB.sendMessage(
          { senderId: currentUser.id, receiverId: userId, content: '📷 Photo', messageType: 'image', attachment: { type: 'image', url, name: file.name, size: file.size } },
          currentUser.name
        );
      } catch (err) { console.error('Photo upload failed:', err); }
    setUploadingFile(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !userId) return;
    if (file.size > 25 * 1024 * 1024) return;
    setUploadingFile(true); setShowAttachMenu(false);
    try {
        const url = await DB.uploadPhoto(file);
        await DB.sendMessage(
          { senderId: currentUser.id, receiverId: userId, content: `📎 ${file.name}`, messageType: 'document', attachment: { type: 'document', url, name: file.name, size: file.size } },
          currentUser.name
        );
      } catch (err) { console.error('Document upload failed:', err); }
    setUploadingFile(false);
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ─── WebRTC Call Functions (Caller side) ───

  // Guard flag: prevents double-endCall loops from stale Firestore snapshots
  const callEndedRef = useRef(false);

  const startCall = async (type: 'voice' | 'video') => {
    if (!currentUser || !userId || !chatUser) return;

    callEndedRef.current = false;
    setCallState('ringing');
    setCallDurationSync(0);
    setIsMuted(false);
    setIsSpeaker(false);
    setIsCameraOff(false);
    setIsMinimized(false);

    try {
      // ── 1. Get local media ──
      let stream: MediaStream;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudio = devices.some(d => d.kind === 'audioinput');
        const hasVideo = devices.some(d => d.kind === 'videoinput');
        const constraints: MediaStreamConstraints = {
          audio: hasAudio,
          video: type === 'video' && hasVideo,
        };
        if (!constraints.audio && !constraints.video) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const dst = ctx.createMediaStreamDestination();
          osc.connect(dst); osc.start(); osc.frequency.setValueAtTime(0, ctx.currentTime);
          stream = dst.stream;
          if (type === 'video') setIsCameraOff(true);
          setIsMuted(true);
        } else {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (type === 'video' && !hasVideo) setIsCameraOff(true);
          if (!hasAudio) setIsMuted(true);
        }
      } catch (mediaErr: any) {
        console.warn('Media access failed, using silent fallback:', mediaErr.message);
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const dst = ctx.createMediaStreamDestination();
        osc.connect(dst); osc.start(); osc.frequency.setValueAtTime(0, ctx.currentTime);
        stream = dst.stream;
        if (type === 'video') setIsCameraOff(true);
        setIsMuted(true);
      }

      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      // ── 2. Create peer connection & attach tracks ──
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      remoteStreamRef.current = new MediaStream();
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
          if (!remoteStreamRef.current!.getTracks().find(t => t.id === track.id)) {
            remoteStreamRef.current!.addTrack(track);
          }
        });
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStreamRef.current;
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStreamRef.current;
      };

      // ── 3. Create offer & persist call ──
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const resolvedReceiverId = await DB.resolveToUserId(userId);

      const call = await DB.createCall({
        callerId: currentUser.id,
        callerName: currentUser.name,
        receiverId: resolvedReceiverId,
        receiverName: chatUser.name || 'User',
        type,
        status: 'ringing',
        offer: JSON.stringify(offer),
      });

      setActiveCallSync(call);
      startOutgoingRing();

      // ── 4. ICE candidates (start AFTER createCall so we have the callId) ──
      pc.onicecandidate = (event) => {
        if (event.candidate) DB.addIceCandidate(call.id, currentUser.id, event.candidate);
      };

      // Buffer remote ICE candidates until remoteDescription is set
      unsubIceRef.current = DB.onIceCandidates(call.id, currentUser.id, async (candidate) => {
        try {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(candidate);
          } else {
            pendingCandidatesRef.current.push(candidate);
          }
        } catch (e) { console.error('ICE candidate error (caller):', e); }
      });

      // ── 5. Connection state — only used for media connectivity; signaling via Firestore ──
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === 'connected') {
          if (disconnectGraceRef.current) { clearTimeout(disconnectGraceRef.current); disconnectGraceRef.current = null; }
        } else if (state === 'failed') {
          endCall();
        } else if (state === 'disconnected') {
          disconnectGraceRef.current = setTimeout(() => {
            if (pcRef.current?.connectionState === 'disconnected' || pcRef.current?.connectionState === 'failed') endCall();
          }, 4000);
        }
      };

      // ── 6. Watch call document for answer / rejection / remote hang-up ──
      unsubCallRef.current = DB.onCallUpdated(call.id, async (updatedCall) => {
        if (!updatedCall || callEndedRef.current) return;

        if (updatedCall.status === 'connected' && updatedCall.answer && pc.signalingState === 'have-local-offer') {
          try {
            const answer = JSON.parse(updatedCall.answer);
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            // Drain buffered remote ICE candidates now that remoteDescription is set
            for (const c of pendingCandidatesRef.current) {
              try { await pc.addIceCandidate(c); } catch (_) {}
            }
            pendingCandidatesRef.current = [];
            stopOutgoingRing();
            playConnectedSound();
            setCallState('connected');
          } catch (e) { console.error('setRemoteDescription failed (caller):', e); }
          return;
        }

        if (updatedCall.status === 'rejected') {
          if (callEndedRef.current) return;
          callEndedRef.current = true;
          stopOutgoingRing();
          playBusySound();
          setCallState('not_answering');
          cleanupCall();
          if (userId && currentUser) {
            await DB.sendMessage({ senderId: currentUser.id, receiverId: userId, content: `📞 ${type === 'video' ? 'Video' : 'Voice'} call · Declined`, messageType: 'text' }, currentUser.name);
          }
          setTimeout(() => { setActiveCallSync(null); setCallState('idle'); }, 3000);
          return;
        }

        // Only react to 'ended'/'missed' if WE didn't trigger it (guard against own update echo)
        if ((updatedCall.status === 'ended' || updatedCall.status === 'missed') && !callEndedRef.current) {
          endCall();
        }
      });

      // ── 7. No-answer timeout ──
      callTimeoutRef.current = setTimeout(async () => {
        if (callEndedRef.current) return;
        callEndedRef.current = true;
        stopOutgoingRing();
        playBusySound();
        setCallState('not_answering');
        cleanupCall();
        await DB.updateCall(call.id, { status: 'missed', endedAt: new Date().toISOString() });
        if (userId && currentUser) {
          await DB.sendMessage({ senderId: currentUser.id, receiverId: userId, content: `📞 ${type === 'video' ? 'Video' : 'Voice'} call · No answer`, messageType: 'text' }, currentUser.name);
        }
        setTimeout(() => { setActiveCallSync(null); setCallState('idle'); }, 3000);
      }, 30000);

    } catch (error) {
      console.error('Failed to start call:', error);
      setCallState('idle');
      cleanupCall();
    }
  };

  const endCall = async () => {
    if (callEndedRef.current) return;
    callEndedRef.current = true;

    const call = activeCallRef.current;
    const duration = callDurationRef.current;
    const type = call?.type;

    stopOutgoingRing();
    playEndCallSound();
    cleanupCall();
    setCallState('ended');

    if (call && currentUser) {
      await DB.updateCall(call.id, { status: 'ended', endedAt: new Date().toISOString() });

      if (duration > 0 && userId) {
        const emoji = type === 'video' ? '📹' : '📞';
        const m = Math.floor(duration / 60);
        const s = duration % 60;
        const dur = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        await DB.sendMessage({
          senderId: currentUser.id,
          receiverId: userId,
          content: `${emoji} ${type === 'video' ? 'Video' : 'Voice'} call · ${dur}`,
          messageType: 'text',
        }, currentUser.name);
      }

      setTimeout(() => DB.cleanupCall(call.id), 5000);
    }

    setTimeout(() => {
      setActiveCallSync(null);
      setCallState('idle');
      setCallDurationSync(0);
      setIsMuted(false);
      setIsSpeaker(false);
      setIsCameraOff(false);
      setIsMinimized(false);
    }, 1500);
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const newVal = !prev;
      if (localStreamRef.current) localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !newVal; });
      return newVal;
    });
  };

  const toggleSpeaker = () => setIsSpeaker(prev => !prev);

  const toggleCamera = () => {
    setIsCameraOff(prev => {
      const newVal = !prev;
      if (localStreamRef.current) localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !newVal; });
      return newVal;
    });
  };

  const formatCallDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentUser) {
    return (
      <div className="bg-gray-50 min-h-[calc(100vh-64px)] flex items-center justify-center">
        <p className="text-gray-500">Please login to send messages</p>
      </div>
    );
  }

  if (!chatUser) {
    return (
      <div className="bg-gray-50 min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#4169E1]" />
      </div>
    );
  }

  const formatTime = (date: string) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDateLabel = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'TODAY';
    if (diffDays === 1) return 'YESTERDAY';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  };

  const groupedMessages: { label: string; msgs: Message[] }[] = [];
  messages.forEach(msg => {
    const label = formatDateLabel(msg.createdAt);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.label === label) lastGroup.msgs.push(msg);
    else groupedMessages.push({ label, msgs: [msg] });
  });

  const renderMessageContent = (msg: Message, isOwn: boolean) => {
    if (msg.messageType === 'image' && msg.attachment) {
      return (
        <div className="relative group/img">
          <img src={msg.attachment.url} alt={msg.attachment.name} className="max-w-[240px] max-h-[240px] rounded-lg object-cover cursor-pointer" onClick={() => setPreviewImage(msg.attachment!.url)} />
          <button onClick={() => setPreviewImage(msg.attachment!.url)} className="absolute top-2 right-2 w-7 h-7 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
            <ZoomIn className="w-3.5 h-3.5 text-white" />
          </button>
          {msg.attachment.name && <p className={`text-[10px] mt-1.5 ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>{msg.attachment.name}</p>}
        </div>
      );
    }
    if (msg.messageType === 'document' && msg.attachment) {
      return (
        <a href={msg.attachment.url} download={msg.attachment.name} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isOwn ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-50 hover:bg-gray-100'}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isOwn ? 'bg-white/20' : 'bg-[#4169E1]/10'}`}>
            <FileText className={`w-5 h-5 ${isOwn ? 'text-white' : 'text-[#4169E1]'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-[#000000]'}`}>{msg.attachment.name}</p>
            {msg.attachment.size && <p className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>{formatFileSize(msg.attachment.size)}</p>}
          </div>
          <Download className={`w-4 h-4 flex-shrink-0 ${isOwn ? 'text-white/70' : 'text-gray-400'}`} />
        </a>
      );
    }
    if (msg.content.startsWith('📞') || msg.content.startsWith('📹')) {
      return (
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isOwn ? 'bg-white/15' : 'bg-green-50'}`}>
            {msg.content.startsWith('📹') ? <Video className={`w-3.5 h-3.5 ${isOwn ? 'text-white' : 'text-green-600'}`} /> : <Phone className={`w-3.5 h-3.5 ${isOwn ? 'text-white' : 'text-green-600'}`} />}
          </div>
          <p className="text-sm">{msg.content.replace('📞 ', '').replace('📹 ', '')}</p>
        </div>
      );
    }
    return <p className="text-sm leading-relaxed">{msg.content}</p>;
  };

  // ─── Voice Call Overlay (Caller) ───
  const renderVoiceCallOverlay = () => {
    if (!activeCall || activeCall.type !== 'voice') return null;

    if (isMinimized) {
      return (
          <div className="fixed bottom-6 right-6 z-[1200] bg-[#000000] rounded-2xl shadow-2xl p-4 flex items-center gap-3">
            <audio ref={remoteAudioRef} autoPlay />
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <Phone className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">{chatUser?.name}</p>
            <p className="text-green-400 text-xs font-mono">{formatCallDuration(callDuration)}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <button onClick={() => setIsMinimized(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <Maximize2 className="w-3.5 h-3.5 text-white" />
            </button>
            <button onClick={endCall} className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors">
              <PhoneOff className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      );
    }

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-gradient-to-b from-[#0f1a2e] to-[#000000]">
          <audio ref={remoteAudioRef} autoPlay />
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-400 blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-purple-400 blur-[80px]" />
          </div>
          <button onClick={() => setIsMinimized(true)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <Minimize2 className="w-4 h-4 text-white" />
        </button>
        <div className="relative flex flex-col items-center">
          <div className="relative mb-8">
            {callState === 'ringing' && (
              <>
                <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute -inset-4 rounded-full bg-green-500/10 animate-pulse" />
              </>
            )}
            {callState === 'connected' && <div className="absolute -inset-3 rounded-full border-2 border-green-400/30 animate-pulse" />}
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#2a4a7f] to-[#4169E1] flex items-center justify-center text-white text-4xl font-bold shadow-lg relative z-10">
              {chatUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
          <h2 className="text-white text-2xl font-semibold mb-1">{chatUser?.name || 'User'}</h2>
          <div className="flex items-center gap-2 mb-2">
            {callState === 'ringing' && (
              <>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-green-400 text-sm">Calling...</p>
              </>
            )}
            {callState === 'not_answering' && (
              <>
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                <p className="text-red-400 text-sm">Not answering</p>
              </>
            )}
            {callState === 'connected' && (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <p className="text-green-400 text-sm font-mono">{formatCallDuration(callDuration)}</p>
              </>
            )}
            {callState === 'ended' && <p className="text-red-400 text-sm">Call ended</p>}
          </div>
          {callState === 'connected' && !isMuted && (
            <div className="flex items-center gap-1 mb-8 h-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-1 bg-green-400/60 rounded-full animate-pulse" style={{ height: `${12 + Math.random() * 12}px`, animationDelay: `${i * 100}ms`, animationDuration: '0.8s' }} />
              ))}
            </div>
          )}
          {(callState !== 'connected' || isMuted) && <div className="mb-8 h-6" />}
          {callState === 'not_answering' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mb-2">
                <PhoneOff className="w-7 h-7 text-red-400" />
              </div>
              <p className="text-white/60 text-sm">The person you're calling is not available right now</p>
              <div className="flex items-center gap-4 mt-2">
                <button onClick={() => { setActiveCall(null); setCallState('idle'); }} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium transition-colors">
                  Close
                </button>
                <button onClick={() => { setActiveCall(null); setCallState('idle'); setTimeout(() => startCall(activeCall?.type || 'voice'), 100); }} className="px-6 py-2.5 bg-green-500 hover:bg-green-600 rounded-xl text-white text-sm font-medium transition-colors flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Call Again
                </button>
              </div>
            </div>
          )}
          {callState !== 'ended' && callState !== 'not_answering' && (
            <>
              <div className="flex items-center gap-5">
                <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/20 border border-red-500/40' : 'bg-white/10 hover:bg-white/20 border border-white/10'}`}>
                  {isMuted ? <MicOff className="w-5 h-5 text-red-400" /> : <Mic className="w-5 h-5 text-white" />}
                </button>
                <button onClick={toggleSpeaker} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isSpeaker ? 'bg-blue-500/20 border border-blue-500/40' : 'bg-white/10 hover:bg-white/20 border border-white/10'}`}>
                  {isSpeaker ? <Volume2 className="w-5 h-5 text-blue-400" /> : <VolumeX className="w-5 h-5 text-white" />}
                </button>
                <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg shadow-red-500/30">
                  <PhoneOff className="w-6 h-6 text-white" />
                </button>
              </div>
              <div className="flex items-center gap-5 mt-3">
                <span className={`text-[11px] w-14 text-center ${isMuted ? 'text-red-400' : 'text-white/50'}`}>{isMuted ? 'Unmute' : 'Mute'}</span>
                <span className={`text-[11px] w-14 text-center ${isSpeaker ? 'text-blue-400' : 'text-white/50'}`}>Speaker</span>
                <span className="text-[11px] w-16 text-center text-red-400">End</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // ─── Video Call Overlay (Caller) ───
  const renderVideoCallOverlay = () => {
    if (!activeCall || activeCall.type !== 'video') return null;

    if (isMinimized) {
      return (
          <div className="fixed bottom-6 right-6 z-[1200] bg-[#000000] rounded-2xl shadow-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">{chatUser?.name}</p>
            <p className="text-blue-400 text-xs font-mono">{formatCallDuration(callDuration)}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <button onClick={() => setIsMinimized(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <Maximize2 className="w-3.5 h-3.5 text-white" />
            </button>
            <button onClick={endCall} className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors">
              <PhoneOff className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      );
    }

      return (
        <div className="fixed inset-0 z-[1200] bg-[#0a0f1a]">
            <audio ref={remoteAudioRef} autoPlay />
          <div className="absolute inset-0">
            {callState === 'connected' ? (
            <div className="w-full h-full bg-gradient-to-br from-[#000000] via-[#0f1a2e] to-[#000000] flex items-center justify-center relative">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              {(!remoteStreamRef.current || remoteStreamRef.current.getVideoTracks().length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#2a4a7f] to-[#4169E1] flex items-center justify-center text-white text-5xl font-bold mx-auto mb-4 shadow-xl">
                      {chatUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <p className="text-white/60 text-sm">{chatUser?.name}'s camera</p>
                  </div>
                </div>
              )}
            </div>
          ) : callState === 'ringing' ? (
            <div className="w-full h-full bg-gradient-to-b from-[#0f1a2e] to-[#000000] flex items-center justify-center">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#2a4a7f] to-[#4169E1] flex items-center justify-center text-white text-4xl font-bold relative z-10 mx-auto">
                    {chatUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                </div>
                <h2 className="text-white text-xl font-semibold mb-1">{chatUser?.name}</h2>
                <div className="flex items-center justify-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <p className="text-blue-400 text-sm">Calling...</p>
                </div>
              </div>
            </div>
          ) : callState === 'not_answering' ? (
            <div className="w-full h-full bg-gradient-to-b from-[#0f1a2e] to-[#000000] flex items-center justify-center">
              <div className="text-center">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#2a4a7f] to-[#4169E1] flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6 opacity-60">
                  {chatUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <h2 className="text-white text-xl font-semibold mb-1">{chatUser?.name}</h2>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                  <p className="text-red-400 text-sm">Not answering</p>
                </div>
                <p className="text-white/50 text-sm mb-6">The person you're calling is not available right now</p>
                <div className="flex items-center justify-center gap-4">
                  <button onClick={() => { setActiveCall(null); setCallState('idle'); }} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium transition-colors">
                    Close
                  </button>
                  <button onClick={() => { setActiveCall(null); setCallState('idle'); setTimeout(() => startCall('video'), 100); }} className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-xl text-white text-sm font-medium transition-colors flex items-center gap-2">
                    <Video className="w-4 h-4" /> Call Again
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-[#0a0f1a] flex items-center justify-center">
              <p className="text-red-400 text-sm">Call ended</p>
            </div>
          )}
        </div>

        {callState === 'connected' && (
          <div className="absolute top-6 right-6 w-40 h-28 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-[#0a0f1a]">
            {!isCameraOff ? (
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#000000] to-[#2a4a7f] flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <VideoOff className="w-5 h-5 text-white/50" />
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2">
              <span className="text-[10px] text-white/60 bg-black/40 px-1.5 py-0.5 rounded">You</span>
            </div>
          </div>
        )}

        <div className="absolute top-6 left-6 flex items-center gap-3">
          <button onClick={() => setIsMinimized(true)} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 flex items-center justify-center transition-colors">
            <Minimize2 className="w-4 h-4 text-white" />
          </button>
          {callState === 'connected' && (
            <div className="bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white text-sm font-mono">{formatCallDuration(callDuration)}</span>
            </div>
          )}
        </div>

        {callState !== 'ended' && callState !== 'not_answering' && (
          <div className="absolute bottom-0 left-0 right-0 pb-10 pt-20 bg-gradient-to-t from-black/60 to-transparent">
            <div className="flex items-center justify-center gap-5">
              <div className="flex flex-col items-center gap-1.5">
                <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/80 backdrop-blur-sm' : 'bg-white/15 backdrop-blur-sm hover:bg-white/25'}`}>
                  {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                </button>
                <span className="text-[11px] text-white/60">{isMuted ? 'Unmute' : 'Mute'}</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <button onClick={toggleCamera} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isCameraOff ? 'bg-red-500/80 backdrop-blur-sm' : 'bg-white/15 backdrop-blur-sm hover:bg-white/25'}`}>
                  {isCameraOff ? <VideoOff className="w-5 h-5 text-white" /> : <Camera className="w-5 h-5 text-white" />}
                </button>
                <span className="text-[11px] text-white/60">{isCameraOff ? 'Start' : 'Stop'}</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg shadow-red-500/30">
                  <PhoneOff className="w-6 h-6 text-white" />
                </button>
                <span className="text-[11px] text-red-400">End</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <button onClick={toggleSpeaker} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isSpeaker ? 'bg-blue-500/80 backdrop-blur-sm' : 'bg-white/15 backdrop-blur-sm hover:bg-white/25'}`}>
                  {isSpeaker ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-white" />}
                </button>
                <span className="text-[11px] text-white/60">Speaker</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      {renderVoiceCallOverlay()}
      {renderVideoCallOverlay()}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#000000] mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Messages
        </button>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
          {/* Chat Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#000000] to-[#2a4a7f] flex items-center justify-center text-white font-semibold text-sm">
                  {chatUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div>
                {specialistId ? (
                  <Link to={`/profile/${specialistId}`} className="font-semibold text-[#000000] hover:text-[#4169E1] transition-colors flex items-center gap-1.5 group text-sm">
                    {chatUser?.displayName || chatUser?.name || 'User'}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ) : (
                  <h2 className="font-semibold text-[#000000] text-sm">{chatUser?.displayName || chatUser?.name || 'User'}</h2>
                )}
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  <p className="text-xs text-green-600">Online</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => startCall('video')}
                disabled={callState !== 'idle'}
                className="w-9 h-9 rounded-lg hover:bg-blue-50 flex items-center justify-center transition-colors group disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Video className="w-4 h-4 text-gray-500 group-hover:text-[#4169E1]" />
              </button>
              <button
                onClick={() => startCall('voice')}
                disabled={callState !== 'idle'}
                className="w-9 h-9 rounded-lg hover:bg-green-50 flex items-center justify-center transition-colors group disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Phone className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
              </button>
              <button className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                <Info className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50/50">
            {messages.length > 0 ? (
              <>
                {groupedMessages.map((group, gi) => (
                  <div key={gi}>
                    <div className="flex items-center justify-center my-4">
                      <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-semibold text-gray-400 tracking-wider">
                        {group.label}
                      </span>
                    </div>
                    {group.msgs.map((msg, mi) => {
                      const isOwn = msg.senderId === currentUser.id;
                      const showAvatar = !isOwn && (mi === 0 || group.msgs[mi - 1]?.senderId === currentUser.id);
                      return (
                        <div key={msg.id} className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          {!isOwn && (
                            <div className="flex-shrink-0 mr-2 mt-auto">
                              {showAvatar ? (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#000000] to-[#2a4a7f] flex items-center justify-center text-white text-xs font-semibold">
                                  {chatUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                              ) : (
                                <div className="w-8" />
                              )}
                            </div>
                          )}
                          <div className={`max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
                            <div className={`${msg.messageType === 'image' ? 'p-1.5' : 'px-4 py-2.5'} ${isOwn ? 'bg-gradient-to-br from-[#1a9be8] to-[#0ea5e9] text-white rounded-2xl rounded-br-md' : 'bg-white border border-gray-100 text-[#000000] rounded-2xl rounded-bl-md shadow-sm'}`}>
                              {renderMessageContent(msg, isOwn)}
                            </div>
                            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
                              {isOwn && <CheckCheck className="w-3 h-3 text-[#4169E1]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Send className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500 font-medium">No messages yet</p>
                <p className="text-xs text-gray-400 mt-1">Start the conversation!</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {uploadingFile && (
            <div className="px-6 py-2 border-t border-gray-100 bg-blue-50 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#4169E1]" />
              <span className="text-xs text-[#4169E1] font-medium">Uploading file...</span>
            </div>
          )}

          {/* Message Input */}
          <div className="border-t border-gray-100 bg-white px-4 py-3 relative">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar" className="hidden" onChange={handleDocUpload} />

              <form onSubmit={handleSend} className="flex items-center gap-1.5 sm:gap-2">
                <div className="relative" ref={attachRef}>
                  <button type="button" onClick={() => { setShowAttachMenu(!showAttachMenu); setShowEmojiPicker(false); }} className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${showAttachMenu ? 'bg-[#4169E1]/10 text-[#4169E1]' : 'hover:bg-gray-100 text-gray-400'}`}>
                    <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  {showAttachMenu && (
                    <div className="absolute bottom-12 left-0 bg-white border border-gray-200 rounded-xl shadow-lg py-2 w-48 z-50">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center"><Image className="w-4 h-4 text-green-600" /></div>
                        <div><p className="text-sm font-medium text-[#000000]">Photo</p><p className="text-[10px] text-gray-400">Up to 10 MB</p></div>
                      </button>
                      <button type="button" onClick={() => docInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center"><FileText className="w-4 h-4 text-purple-600" /></div>
                        <div><p className="text-sm font-medium text-[#000000]">Document</p><p className="text-[10px] text-gray-400">PDF, DOC, XLS, etc.</p></div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Image button - hidden on small screens since it's also in the attach menu */}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="hidden sm:flex w-9 h-9 rounded-lg hover:bg-gray-100 items-center justify-center transition-colors flex-shrink-0">
                  <Image className="w-5 h-5 text-gray-400" />
                </button>

                <input ref={inputRef} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-[#000000] placeholder-gray-400 focus:outline-none focus:border-[#4169E1] focus:ring-1 focus:ring-[#4169E1]/20 transition-all" />

                <div className="relative" ref={emojiRef}>
                  <button type="button" onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowAttachMenu(false); }} className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${showEmojiPicker ? 'bg-[#4169E1]/10 text-[#4169E1]' : 'hover:bg-gray-100 text-gray-400'}`}>
                    <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-12 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-[280px] sm:w-[320px]">
                      <div className="flex border-b border-gray-100 px-2 pt-2 overflow-x-auto">
                        {EMOJI_CATEGORIES.map((cat, i) => (
                          <button key={cat.name} type="button" onClick={() => setEmojiCategory(i)} className={`px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap ${emojiCategory === i ? 'bg-[#4169E1]/10 text-[#4169E1]' : 'text-gray-400 hover:text-gray-600'}`}>
                            {cat.name}
                          </button>
                        ))}
                      </div>
                      <div className="p-2 sm:p-3 grid grid-cols-7 sm:grid-cols-8 gap-0.5 max-h-[200px] overflow-y-auto">
                        {EMOJI_CATEGORIES[emojiCategory].emojis.map((emoji, i) => (
                          <button key={i} type="button" onClick={() => handleEmojiSelect(emoji)} className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-lg sm:text-xl hover:bg-gray-100 rounded-lg transition-colors">
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading || !newMessage.trim()} className="w-8 h-8 sm:w-10 sm:h-10 bg-[#4169E1] rounded-xl flex items-center justify-center hover:bg-[#1557b0] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
                </button>
              </form>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <Lock className="w-3 h-3 text-gray-300" />
              <span className="text-[10px] text-gray-300 tracking-wider font-medium">END-TO-END ENCRYPTED</span>
            </div>
          </div>
        </div>
      </div>

      {previewImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
          <img src={previewImage} alt="Preview" className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
