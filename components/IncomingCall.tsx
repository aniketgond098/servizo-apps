import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, VolumeX, Minimize2, Maximize2, X, Camera } from 'lucide-react';
import { DB } from '../services/db';
import { AuthService } from '../services/auth';
import { Call } from '../types';
import { startIncomingRing, stopIncomingRing, playConnectedSound, playEndCallSound } from '../utils/callSounds';
import CallFeedbackModal from './CallFeedbackModal';

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

export default function IncomingCall() {
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [callState, setCallState] = useState<'idle' | 'ringing' | 'connected' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [feedbackCall, setFeedbackCall] = useState<{ callId: string; toUserId: string; toUserName: string; callType: 'voice' | 'video'; duration: number } | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const disconnectGraceRef = useRef<NodeJS.Timeout | null>(null);
  const unsubCallRef = useRef<(() => void) | null>(null);
  const unsubIceRef = useRef<(() => void) | null>(null);
  // Refs for latest state inside async callbacks
  const activeCallRef = useRef<Call | null>(null);
  const callDurationRef = useRef(0);
  const incomingCallRef = useRef<Call | null>(null);

  const setActiveCallSync = (call: Call | null) => { activeCallRef.current = call; setActiveCall(call); };
  const setIncomingCallSync = (call: Call | null) => { incomingCallRef.current = call; setIncomingCall(call); };
  const setCallDurationSync = (d: number | ((p: number) => number)) => {
    setCallDuration(prev => {
      const next = typeof d === 'function' ? d(prev) : d;
      callDurationRef.current = next;
      return next;
    });
  };

  const currentUser = AuthService.getCurrentUser();

  // Listen for incoming calls — subscribe once, use refs to check current state
  useEffect(() => {
    if (!currentUser) return;
    const unsub = DB.onIncomingCall(currentUser.id, (call) => {
      // Don't show incoming if we're already in a call
      if (activeCallRef.current || incomingCallRef.current) return;
      setIncomingCallSync(call);
      setCallState('ringing');
      startIncomingRing();
    });
    return () => unsub();
  }, [currentUser?.id]);

  // Call duration timer
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
    return () => {
      cleanup();
    };
  }, []);

  // Re-attach streams to video/audio elements when callState changes to connected
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

  const cleanup = () => {
    stopIncomingRing();
    if (disconnectGraceRef.current) { clearTimeout(disconnectGraceRef.current); disconnectGraceRef.current = null; }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (unsubCallRef.current) { unsubCallRef.current(); unsubCallRef.current = null; }
    if (unsubIceRef.current) { unsubIceRef.current(); unsubIceRef.current = null; }
  };

  const acceptCall = async () => {
    const call = incomingCallRef.current;
    if (!call || !currentUser) return;
    stopIncomingRing();
    playConnectedSound();

    setActiveCallSync(call);
    setIncomingCallSync(null);

    try {
      const isVideo = call.type === 'video';
      let stream: MediaStream;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudio = devices.some(d => d.kind === 'audioinput');
        const hasVideo = devices.some(d => d.kind === 'videoinput');
        const constraints: MediaStreamConstraints = {
          audio: hasAudio ? true : false,
          video: isVideo && hasVideo ? true : false,
        };
        if (!constraints.audio && !constraints.video) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const dst = ctx.createMediaStreamDestination();
          osc.connect(dst); osc.start(); osc.frequency.setValueAtTime(0, ctx.currentTime);
          stream = dst.stream;
        } else {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        }
      } catch (mediaErr) {
        console.warn('Media access failed, using silent fallback:', mediaErr);
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const dst = ctx.createMediaStreamDestination();
        osc.connect(dst); osc.start(); osc.frequency.setValueAtTime(0, ctx.currentTime);
        stream = dst.stream;
      }

      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Always assign to ref; useEffect re-attaches to DOM when connected UI mounts
      remoteStreamRef.current = new MediaStream();
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => remoteStreamRef.current!.addTrack(track));
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStreamRef.current;
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStreamRef.current;
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) DB.addIceCandidate(call.id, currentUser.id, event.candidate);
      };

      // Grace period for transient 'disconnected'
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === 'connected') {
          if (disconnectGraceRef.current) { clearTimeout(disconnectGraceRef.current); disconnectGraceRef.current = null; }
          setCallState('connected');
        } else if (state === 'failed') {
          endCall();
        } else if (state === 'disconnected') {
          disconnectGraceRef.current = setTimeout(() => {
            if (pcRef.current?.connectionState === 'disconnected' || pcRef.current?.connectionState === 'failed') endCall();
          }, 4000);
        }
      };

      if (call.offer) {
        const offer = JSON.parse(call.offer);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await DB.updateCall(call.id, { status: 'connected', answer: JSON.stringify(answer), answeredAt: new Date().toISOString() });
      }

      unsubIceRef.current = DB.onIceCandidates(call.id, currentUser.id, async (candidate) => {
        try {
          if (pc.remoteDescription) await pc.addIceCandidate(candidate);
        } catch (e) { console.error('Error adding ICE candidate:', e); }
      });

      unsubCallRef.current = DB.onCallUpdated(call.id, (updated) => {
        if (updated && (updated.status === 'ended' || updated.status === 'missed')) endCall();
      });

      setCallState('connected');
      setCallDurationSync(0);
    } catch (error) {
      console.error('Failed to accept call:', error);
      rejectCall();
    }
  };

  const rejectCall = async () => {
    const call = incomingCallRef.current;
    stopIncomingRing();
    playEndCallSound();
    if (call) {
      await DB.updateCall(call.id, { status: 'rejected', endedAt: new Date().toISOString() });
    }
    setIncomingCallSync(null);
    setCallState('idle');
  };

  const endCall = async () => {
    const call = activeCallRef.current;
    const duration = callDurationRef.current;

    stopIncomingRing();
    playEndCallSound();
    cleanup();
    setCallState('ended');

    if (call && currentUser) {
      await DB.updateCall(call.id, { status: 'ended', endedAt: new Date().toISOString() });

      if (duration > 0) {
        const emoji = call.type === 'video' ? '📹' : '📞';
        const m = Math.floor(duration / 60);
        const s = duration % 60;
        const dur = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        await DB.sendMessage({
          senderId: currentUser.id,
          receiverId: call.callerId === currentUser.id ? call.receiverId : call.callerId,
          content: `${emoji} ${call.type === 'video' ? 'Video' : 'Voice'} call · ${dur}`,
          messageType: 'text',
        });
      }

      setTimeout(() => DB.cleanupCall(call.id), 5000);

      if (duration > 0) {
        const toUserId = call.callerId === currentUser.id ? call.receiverId : call.callerId;
        const toUserName = call.callerId === currentUser.id ? call.receiverName : call.callerName;
        setTimeout(() => {
          setFeedbackCall({ callId: call.id, toUserId, toUserName, callType: call.type, duration });
        }, 1600);
      }
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
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !newVal; });
      }
      return newVal;
    });
  };

  const toggleSpeaker = () => setIsSpeaker(prev => !prev);

  const toggleCamera = () => {
    setIsCameraOff(prev => {
      const newVal = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !newVal; });
      }
      return newVal;
    });
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Incoming Call Ringing UI ───
  if (incomingCall && callState === 'ringing') {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-[340px] text-center">
          {/* Avatar with pulse */}
          <div className="relative mx-auto w-24 h-24 mb-5">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute -inset-2 rounded-full bg-green-500/10 animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#000000] to-[#2a4a7f] flex items-center justify-center text-white text-3xl font-bold">
              {incomingCall.callerName?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </div>

          <h3 className="text-[#000000] text-xl font-semibold mb-1">{incomingCall.callerName}</h3>
          <p className="text-gray-400 text-sm mb-1">
            Incoming {incomingCall.type === 'video' ? 'video' : 'voice'} call
          </p>
          <div className="flex items-center justify-center gap-1 mb-6">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>

          <div className="flex items-center justify-center gap-6">
            <button
              onClick={rejectCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg shadow-red-500/30"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={acceptCall}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors shadow-lg shadow-green-500/30"
            >
              {incomingCall.type === 'video' ? (
                <Video className="w-6 h-6 text-white" />
              ) : (
                <Phone className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2">
            <span className="text-xs text-red-500 w-16 text-center">Decline</span>
            <span className="text-xs text-green-600 w-16 text-center">Accept</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Active Voice Call UI ───
  if (activeCall && activeCall.type === 'voice' && callState !== 'idle') {
    if (isMinimized) {
      return (
        <div className="fixed bottom-6 right-6 z-[60] bg-[#000000] rounded-2xl shadow-2xl p-4 flex items-center gap-3">
          <audio ref={remoteAudioRef} autoPlay />
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <Phone className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">{activeCall.callerName}</p>
            <p className="text-green-400 text-xs font-mono">{formatDuration(callDuration)}</p>
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
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-b from-[#0f1a2e] to-[#000000]">
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
            {callState === 'connected' && (
              <div className="absolute -inset-3 rounded-full border-2 border-green-400/30 animate-pulse" />
            )}
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#2a4a7f] to-[#4169E1] flex items-center justify-center text-white text-4xl font-bold shadow-lg relative z-10">
              {activeCall.callerName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>

          <h2 className="text-white text-2xl font-semibold mb-1">{activeCall.callerName}</h2>
          <div className="flex items-center gap-2 mb-2">
            {callState === 'connected' && (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <p className="text-green-400 text-sm font-mono">{formatDuration(callDuration)}</p>
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

          {callState !== 'ended' && (
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
          )}
        </div>
      </div>
    );
  }

  // ─── Active Video Call UI ───
  if (activeCall && activeCall.type === 'video' && callState !== 'idle') {
    if (isMinimized) {
      return (
        <div className="fixed bottom-6 right-6 z-[60] bg-[#000000] rounded-2xl shadow-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">{activeCall.callerName}</p>
            <p className="text-blue-400 text-xs font-mono">{formatDuration(callDuration)}</p>
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
        <div className="fixed inset-0 z-[60] bg-[#0a0f1a]">
          <audio ref={remoteAudioRef} autoPlay />
          {/* Remote video */}
          <div className="absolute inset-0">
          {callState === 'connected' ? (
            <div className="w-full h-full bg-gradient-to-br from-[#000000] via-[#0f1a2e] to-[#000000] flex items-center justify-center">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              {/* If no remote video tracks, show avatar */}
              {(!remoteStreamRef.current || remoteStreamRef.current.getVideoTracks().length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#2a4a7f] to-[#4169E1] flex items-center justify-center text-white text-5xl font-bold mx-auto mb-4 shadow-xl">
                      {activeCall.callerName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <p className="text-white/60 text-sm">{activeCall.callerName}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full bg-[#0a0f1a] flex items-center justify-center">
              <p className="text-red-400 text-sm">Call ended</p>
            </div>
          )}
        </div>

        {/* Local video PiP */}
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

        {/* Top bar */}
        <div className="absolute top-6 left-6 flex items-center gap-3">
          <button onClick={() => setIsMinimized(true)} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 flex items-center justify-center transition-colors">
            <Minimize2 className="w-4 h-4 text-white" />
          </button>
          {callState === 'connected' && (
            <div className="bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white text-sm font-mono">{formatDuration(callDuration)}</span>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        {callState !== 'ended' && (
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
  }

  if (feedbackCall) {
    return (
      <CallFeedbackModal
        callId={feedbackCall.callId}
        toUserId={feedbackCall.toUserId}
        toUserName={feedbackCall.toUserName}
        callType={feedbackCall.callType}
        callDuration={feedbackCall.duration}
        onClose={() => setFeedbackCall(null)}
      />
    );
  }

  return null;
}
