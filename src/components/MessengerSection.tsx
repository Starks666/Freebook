/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Search, Sparkles, Smile, Phone, Video, HelpCircle, Shield, Circle, User, Check, 
  MessageSquare, AlertCircle, Volume2, VolumeX, Mic, MicOff, VideoOff, PhoneOff, Play, Pause, Trash2, PhoneCall 
} from 'lucide-react';
import { User as UserType, Message } from '../types';
import AnimatedMedia from './AnimatedMedia';

// Voice Message player component
function VoiceMessageBubble({ voiceUrl, duration }: { voiceUrl: string; duration?: number }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [voiceUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error('Audio play failed:', e));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !duration) {
      setTotalDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2.5 py-1 px-1.5 min-w-[180px] sm:min-w-[220px] text-gray-800 dark:text-gray-100">
      <audio
        ref={audioRef}
        src={voiceUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm cursor-pointer select-none hover:scale-105 active:scale-95 transition"
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5 fill-blue-600 dark:fill-blue-400 text-blue-600" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-blue-600 dark:fill-blue-400 text-blue-600 ml-0.5" />
        )}
      </button>

      <div className="flex-grow flex flex-col min-w-0">
        <div className="flex items-center gap-1 select-none">
          <input
            type="range"
            min={0}
            max={totalDuration || 100}
            value={currentTime}
            onChange={handleProgressChange}
            className="w-full accent-blue-500 h-1 rounded-lg bg-gray-200 dark:bg-gray-700 cursor-pointer"
          />
        </div>
        <div className="flex justify-between items-center mt-1 font-mono text-[9px] text-gray-500 dark:text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span className="flex items-center gap-0.5">
            <Mic className="w-2.5 h-2.5 shrink-0" />
            <span>Voice ({formatTime(totalDuration)})</span>
          </span>
        </div>
      </div>
    </div>
  );
}

interface MessengerSectionProps {
  currentUser: UserType;
  friends: UserType[];
  token: string;
  preselectedUserId?: string | null;
  onClearPreselected?: () => void;
  onClickUser: (userId: string) => void;
  onUpdateCurrentUserStatus: (status: 'active' | 'dnd' | 'offline') => void;
}

export default function MessengerSection({
  currentUser,
  friends,
  token,
  preselectedUserId,
  onClearPreselected,
  onClickUser,
  onUpdateCurrentUserStatus
}: MessengerSectionProps) {
  // Navigation & chat states
  const [activeUser, setActiveUser] = useState<UserType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusPresence, setStatusPresence] = useState<{ [userId: string]: 'active' | 'offline' | 'dnd' }>({});
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Audio Messaging state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Internet Calling State
  const [isCallActive, setIsCallActive] = useState(false);
  const [callState, setCallState] = useState<'idle' | 'calling' | 'incoming' | 'connected' | 'disconnected'>('idle');
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const activeRingerRef = useRef<{ stop: () => void } | null>(null);
  const callTimerRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // WebSocket Ref
  const wsRef = useRef<WebSocket | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Play a gorgeous UI sound on message receipt if enabled
  const playMessageSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      // Cute little dual-tone "ping"
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (_) {
      // Ignore audio constraints in browsers
    }
  };

  // Call Timer Increment effect
  useEffect(() => {
    if (callState === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callState]);

  // Webcam stream effect for Video Calling
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const getStream = async () => {
      if (isCallActive && callType === 'video' && !isVideoPaused) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          activeStream = stream;
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (e) {
          console.error('Error fetching webcam stream:', e);
        }
      } else {
        if (localStream) {
          localStream.getTracks().forEach(t => t.stop());
          setLocalStream(null);
        }
      }
    };
    getStream();
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isCallActive, callType, isVideoPaused]);

  // Outgoing Ringtone Oscillator (dual frequencies 440Hz + 480Hz)
  const startRingingSound = () => {
    if (!soundEnabled) return null;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playRing = () => {
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc1.connect(gain);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, audioCtx.currentTime);
        osc2.connect(gain);

        gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);

        osc1.start();
        osc2.start();

        setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
          } catch (_) {}
        }, 1800);
      };

      playRing();
      const ringInterval = setInterval(playRing, 4000);

      return {
        stop: () => {
          clearInterval(ringInterval);
          audioCtx.close();
        }
      };
    } catch (_) {
      return null;
    }
  };

  // Incoming Ringtone Osc
  const startIncomingRingerSound = () => {
    if (!soundEnabled) return null;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playChirp = () => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      };

      playChirp();
      const ringInterval = setInterval(() => {
        playChirp();
        setTimeout(playChirp, 500);
      }, 3000);

      return {
        stop: () => {
          clearInterval(ringInterval);
          audioCtx.close();
        }
      };
    } catch (_) {
      return null;
    }
  };

  const playConnectBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); 
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (_) {}
  };

  const playDisconnectWarning = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(220, audioCtx.currentTime); 
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (_) {}
  };

  // Calling flow controllers
  const initiateCall = (type: 'voice' | 'video') => {
    if (!activeUser) return;
    setIsCallActive(true);
    setCallState('calling');
    setCallType(type);
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoPaused(false);

    if (activeRingerRef.current) activeRingerRef.current.stop();
    activeRingerRef.current = startRingingSound();

    // After 4 seconds, answer simulated call
    setTimeout(() => {
      setCallState(current => {
        if (current === 'calling') {
          if (activeRingerRef.current) {
            activeRingerRef.current.stop();
            activeRingerRef.current = null;
          }
          playConnectBeep();
          return 'connected';
        }
        return current;
      });
    }, 4000);
  };

  const simulateIncomingCall = (type: 'voice' | 'video') => {
    if (!activeUser) return;
    setIsCallActive(true);
    setCallState('incoming');
    setCallType(type);
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoPaused(false);

    if (activeRingerRef.current) activeRingerRef.current.stop();
    activeRingerRef.current = startIncomingRingerSound();
  };

  const answerCall = () => {
    if (activeRingerRef.current) {
      activeRingerRef.current.stop();
      activeRingerRef.current = null;
    }
    playConnectBeep();
    setCallState('connected');
  };

  const hangupCall = async (status: 'completed' | 'declined' | 'missed') => {
    if (activeRingerRef.current) {
      activeRingerRef.current.stop();
      activeRingerRef.current = null;
    }
    playDisconnectWarning();
    
    const formattedDuration = formatCallDurationSec(callDuration);
    
    if (activeUser) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            receiverId: activeUser.id,
            isCallEvent: true,
            callType,
            callStatus: status,
            callDuration: status === 'completed' ? formattedDuration : undefined
          })
        });
        if (response.ok) {
          const sentMsg = await response.json();
          setMessages(prev => {
            if (prev.some(m => m.id === sentMsg.id)) return prev;
            return [...prev, sentMsg];
          });
        }
      } catch (e) {
        console.error('Error logging call event:', e);
      }
    }

    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
    }

    setIsCallActive(false);
    setCallState('idle');
  };

  const formatCallDurationSec = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Recording audio messages
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Url = reader.result as string;
          await handleSendVoiceMessage(base64Url, recordingDuration);
        };
        reader.readAsDataURL(audioBlob);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error starting audio recording:', err);
      alert('Microphone access is required for voice messages. Please check browser permissions.');
    }
  };

  const stopVoiceRecording = (shouldSave: boolean) => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (shouldSave) {
      mediaRecorderRef.current.stop();
    } else {
      mediaRecorderRef.current.onstop = null; 
      mediaRecorderRef.current.stop();
      const stream = mediaRecorderRef.current.stream;
      stream.getTracks().forEach(track => track.stop());
    }

    setIsRecording(false);
  };

  const handleSendVoiceMessage = async (voiceUrl: string, duration: number) => {
    if (!activeUser) return;
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: activeUser.id,
          voiceUrl,
          voiceDuration: duration
        })
      });
      if (response.ok) {
        const sentMsg = await response.json();
        setMessages(prev => {
          if (prev.some(m => m.id === sentMsg.id)) return prev;
          return [...prev, sentMsg];
        });
      }
    } catch (e) {
      console.error('Error sending voice message REST:', e);
    }
  };

  // Sync users list to initialize status presence (with default active or from DB statusMode)
  useEffect(() => {
    const presenceMap: { [userId: string]: 'active' | 'offline' | 'dnd' } = {};
    friends.forEach(f => {
      presenceMap[f.id] = f.statusMode || 'offline';
    });
    setStatusPresence(prev => ({ ...presenceMap, ...prev }));
  }, [friends]);

  // Set up WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = `${protocol}//${window.location.host}`;
    
    const ws = new WebSocket(socketUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Authenticate with server
      ws.send(JSON.stringify({
        type: 'auth',
        userId: currentUser.id
      }));
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        // Receive real-time message
        if (payload.type === 'message') {
          const msg = payload.message as Message;
          // Append message
          setMessages(prev => {
            // Guarantee deduplication
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });

          // Play audio notification if message is from active friend (or sender is not current user)
          if (msg.senderId !== currentUser.id) {
            playMessageSound();
          }
        }

        // Presence update from server
        if (payload.type === 'status_update') {
          const { userId, statusMode } = payload;
          setStatusPresence(prev => ({ ...prev, [userId]: statusMode }));
        }

        // Full presence sync from server on mount
        if (payload.type === 'presence_sync') {
          const { statuses } = payload;
          const updatedStatuses: { [userId: string]: 'active' | 'offline' | 'dnd' } = {};
          statuses.forEach((item: { userId: string, statusMode: 'active' | 'offline' | 'dnd' }) => {
            updatedStatuses[item.userId] = item.statusMode;
          });
          setStatusPresence(prev => ({ ...prev, ...updatedStatuses }));
        }

      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    ws.onclose = () => {
      console.log('WebSocket closed, attempting fallback short-polling mode');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [currentUser.id]);

  // Read message transcripts via REST on startup OR when active user shifts
  useEffect(() => {
    if (!activeUser) return;

    const fetchTranscripts = async () => {
      try {
        const response = await fetch(`/api/messages/${activeUser.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (e) {
        console.error('Error fetching chat history:', e);
      }
    };

    fetchTranscripts();
  }, [activeUser, token]);

  // Handle pre-selected user injection
  useEffect(() => {
    if (preselectedUserId) {
      const selected = friends.find(f => f.id === preselectedUserId);
      if (selected) {
        setActiveUser(selected);
      }
      if (onClearPreselected) {
        onClearPreselected();
      }
    } else if (!activeUser && friends.length > 0) {
      setActiveUser(friends[0]);
    }
  }, [preselectedUserId, friends, activeUser, onClearPreselected]);

  // Keep chat bottom scrolled down perfectly
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Send message trigger
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeUser || !inputText.trim()) return;

    const textPayload = inputText.trim();
    setInputText('');

    // Attempt WebSocket transmission
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        receiverId: activeUser.id,
        content: textPayload
      }));
    } else {
      // Fallback REST endpoint to guarantee reliability
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            receiverId: activeUser.id,
            content: textPayload
          })
        });
        if (response.ok) {
          const sentMsg = await response.json();
          setMessages(prev => {
            if (prev.some(m => m.id === sentMsg.id)) return prev;
            return [...prev, sentMsg];
          });
        }
      } catch (e) {
        console.error('Fallback send error:', e);
      }
    }
  };

  // Change current user's mode
  const handleChangeMyStatus = async (status: 'active' | 'dnd' | 'offline') => {
    // Save locally/UI
    onUpdateCurrentUserStatus(status);
    
    // Notify server via WS
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'status_update',
        statusMode: status
      }));
    }

    // fallback rest sync
    try {
      await fetch('/api/users/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ statusMode: status })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Filter contacts by search name
  const filteredFriends = friends.filter(friend => 
    friend.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    friend.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Status helper colors
  const getStatusIndicator = (userId: string) => {
    const status = statusPresence[userId] || 'offline';
    switch (status) {
      case 'active':
        return { color: 'bg-emerald-500 ring-white dark:ring-gray-900', text: 'Active Now' };
      case 'dnd':
        return { color: 'bg-rose-500 ring-white dark:ring-gray-900', text: 'Do Not Disturb' };
      case 'offline':
      default:
        return { color: 'bg-gray-400 ring-white dark:ring-gray-900', text: 'Offline' };
    }
  };

  const getMyStatusLabel = (s?: string) => {
    switch (s) {
      case 'active': return 'Active';
      case 'dnd': return 'Do Not Disturb';
      case 'offline': return 'Offline Mode';
      default: return 'Active';
    }
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const dt = new Date(isoString);
      return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden flex h-[620px] font-sans antialiased text-gray-800 dark:text-gray-100 mb-6 transition-all duration-300">
      
      {/* LEFT LIST PANEL: Contacts and Quick Search */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50/50 dark:bg-gray-900/60 h-full shrink-0">
        
        {/* Contact list header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-xl tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5.5 h-5.5 text-blue-500 fill-blue-500/15" />
              Texter
            </h2>
            
            {/* Status sound toggler */}
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1 px-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
              title="Toggle audio alert"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>Sound ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-gray-400" />
                  <span>Sound OFF</span>
                </>
              )}
            </button>
          </div>

          {/* Current user's custom status mode card */}
          <div className="bg-white dark:bg-gray-850 p-2.5 rounded-xl border border-gray-150 dark:border-gray-800 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <AnimatedMedia 
                  src={currentUser.avatarUrl} 
                  alt="me" 
                  className="w-8.5 h-8.5 rounded-full object-cover border border-gray-200 dark:border-gray-750" 
                  referrerPolicy="no-referrer"
                />
                <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ${
                  currentUser.statusMode === 'active' ? 'bg-emerald-500 ring-white dark:ring-gray-850' :
                  currentUser.statusMode === 'dnd' ? 'bg-rose-500 ring-white dark:ring-gray-850' : 'bg-gray-400 ring-white dark:ring-gray-850'
                }`} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold truncate dark:text-gray-200">My Status</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 capitalize leading-tight">
                  ({getMyStatusLabel(currentUser.statusMode)})
                </span>
              </div>
            </div>

            {/* Selector buttons directly */}
            <div className="flex gap-1 shrink-0 bg-gray-50 dark:bg-gray-900 p-0.5 rounded-lg border border-gray-150 dark:border-gray-800">
              <button 
                onClick={() => handleChangeMyStatus('active')}
                className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer transition ${currentUser.statusMode === 'active' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Active Now"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </button>
              <button 
                onClick={() => handleChangeMyStatus('dnd')}
                className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer transition ${currentUser.statusMode === 'dnd' ? 'bg-rose-50 dark:bg-rose-955/20 text-rose-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Do Not Disturb"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              </button>
              <button 
                onClick={() => handleChangeMyStatus('offline')}
                className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer transition ${currentUser.statusMode === 'offline' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Appear Offline"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              </button>
            </div>
          </div>

          {/* Search Contacts */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search active friends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-850 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-150 hover:border-gray-250 dark:border-gray-800 dark:hover:border-gray-750 text-gray-900 dark:text-white transition"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-grow overflow-y-auto p-2 space-y-1">
          {filteredFriends.length === 0 ? (
            <div className="py-12 px-4 text-center text-gray-400 dark:text-gray-500 space-y-2">
              <User className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-700" />
              <p className="text-xs font-semibold">No contacts found</p>
              <p className="text-[11px] text-gray-400/80">Make sure you have friends accepted in your Friends tab!</p>
            </div>
          ) : (
            filteredFriends.map((friend) => {
              const isActive = activeUser?.id === friend.id;
              const presence = getStatusIndicator(friend.id);
              const lastMsg = messages
                .filter(m => (m.senderId === friend.id && m.receiverId === currentUser.id) || (m.senderId === currentUser.id && m.receiverId === friend.id))
                .pop();

              return (
                <button
                  key={friend.id}
                  onClick={() => setActiveUser(friend)}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition cursor-pointer select-none ${
                    isActive 
                      ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-md' 
                      : 'hover:bg-gray-150/50 dark:hover:bg-gray-800/50 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <div className="relative shrink-0">
                    <AnimatedMedia
                      src={friend.avatarUrl}
                      alt={friend.displayName}
                      className={`w-10 h-10 rounded-full object-cover border ${isActive ? 'border-blue-400' : 'border-gray-200 dark:border-gray-700'}`}
                      referrerPolicy="no-referrer"
                    />
                    <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ${presence.color}`} />
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-extrabold truncate">{friend.displayName}</span>
                      {lastMsg && (
                        <span className={`text-[9px] ${isActive ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'} font-mono`}>
                          {formatMessageTime(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {lastMsg ? (
                        <p className={`text-[10px] truncate max-w-[120px] ${isActive ? 'text-blue-150' : 'text-gray-450 dark:text-gray-400'}`}>
                          {lastMsg.senderId === currentUser.id ? 'You: ' : ''}{lastMsg.content}
                        </p>
                      ) : (
                        <p className={`text-[9px] ${isActive ? 'text-blue-100/90' : 'text-gray-400'} capitalize`}>
                          {presence.text}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT CONVERSATION MODULE */}
      <div className="flex-grow flex flex-col h-full bg-white dark:bg-gray-900">
        {activeUser ? (
          <>
            {/* Conversation Header */}
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div 
                  className="relative cursor-pointer hover:opacity-90"
                  onClick={() => onClickUser(activeUser.id)}
                >
                  <AnimatedMedia
                    src={activeUser.avatarUrl}
                    alt={activeUser.displayName}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                    referrerPolicy="no-referrer"
                  />
                  <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ${getStatusIndicator(activeUser.id).color}`} />
                </div>
                <div>
                  <h3 
                    className="text-sm font-bold text-gray-900 dark:text-white hover:underline cursor-pointer"
                    onClick={() => onClickUser(activeUser.id)}
                  >
                    {activeUser.displayName}
                  </h3>
                  <p className="text-[10px] text-gray-450 dark:text-gray-400 font-medium flex items-center gap-1.5 capitalize mt-0.5">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${getStatusIndicator(activeUser.id).color}`} />
                    {getStatusIndicator(activeUser.id).text}
                  </p>
                </div>
              </div>

              {/* Action buttons with voice/video dialing and simulation triggers */}
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                {statusPresence[activeUser.id] === 'dnd' && (
                  <div className="bg-rose-50 dark:bg-rose-955/20 px-2 py-0.5 border border-rose-100 dark:border-rose-950/20 rounded-lg text-[9px] text-rose-600 dark:text-rose-450 font-bold flex items-center gap-1 select-none animate-pulse">
                    <AlertCircle className="w-3 h-3" />
                    <span>DND Mode Active</span>
                  </div>
                )}

                {/* Simulated test button */}
                <button
                  onClick={() => simulateIncomingCall('voice')}
                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/45 text-[10px] text-amber-700 dark:text-amber-400 font-bold rounded-xl border border-amber-200/40 dark:border-amber-900/30 flex items-center gap-1.5 cursor-pointer hover:scale-103 transition active:scale-97"
                  title="Simulate incoming call to test ringers & answer modes!"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-bounce" />
                  <span className="hidden sm:inline">Simulate Incoming Call</span>
                </button>
                
                <button 
                  onClick={() => initiateCall('voice')}
                  className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-full cursor-pointer transition-all active:scale-95" 
                  title="Make Voice Call"
                >
                  <Phone className="w-4.5 h-4.5 text-blue-500 fill-blue-500/10" />
                </button>
                <button 
                  onClick={() => initiateCall('video')}
                  className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-full cursor-pointer transition-all active:scale-95" 
                  title="Make Video Call"
                >
                  <Video className="w-4.5 h-4.5 text-blue-500 fill-blue-500/10" />
                </button>
              </div>
            </div>

            {/* Conversation Messages viewport */}
            <div className="flex-grow overflow-y-auto p-5 bg-gray-50/30 dark:bg-transparent space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3.5 max-w-sm mx-auto select-none py-12">
                  <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-955/40 flex items-center justify-center text-blue-500 animate-bounce">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">Send a direct spark</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-550 leading-relaxed">
                      Say hi to {activeUser.displayName}! Your instant sync transcripts are fully secure.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message) => {
                  const isMe = message.senderId === currentUser.id;
                  
                  if (message.isCallEvent) {
                    const isVoice = message.callType === 'voice';
                    const isCompleted = message.callStatus === 'completed';
                    const isMissed = message.callStatus === 'missed';
                    const isDeclined = message.callStatus === 'declined';
                    
                    return (
                      <div 
                        key={message.id}
                        className="w-full flex justify-center my-2.5 select-none"
                      >
                        <div className="bg-gray-100 dark:bg-gray-850 border border-gray-200/50 dark:border-gray-800/60 rounded-full px-4 py-1.5 text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-2.5 shadow-2xs font-semibold">
                          {isVoice ? (
                            <Phone className={`w-3.5 h-3.5 ${isMissed ? 'text-rose-500' : 'text-emerald-500'}`} />
                          ) : (
                            <Video className={`w-3.5 h-3.5 ${isMissed ? 'text-rose-500' : 'text-emerald-500'}`} />
                          )}
                          <span>
                            {isMe ? 'Outgoing' : 'Incoming'} {isVoice ? 'Voice Call' : 'Video Call'} -{' '}
                            {isCompleted ? `Completed (${message.callDuration || '00:00'})` : isMissed ? 'Missed' : isDeclined ? 'Declined' : 'No Answer'}
                          </span>
                          <span className="text-[8px] font-mono opacity-60">
                            {formatMessageTime(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={message.id} 
                      className={`flex gap-2.5 items-end max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      {!isMe && (
                        <AnimatedMedia
                          src={activeUser.avatarUrl}
                          alt="avatar"
                          className="w-7.5 h-7.5 rounded-full object-cover shrink-0 border border-gray-100 dark:border-gray-800 inline-block mb-1"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="space-y-1">
                        <div 
                          className={`p-3 rounded-2xl text-xs leading-relaxed shadow-3xs ${
                            isMe 
                              ? 'bg-blue-600 text-white rounded-br-none' 
                              : 'bg-gray-100/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 rounded-bl-none'
                          }`}
                        >
                          {message.voiceUrl ? (
                            <VoiceMessageBubble voiceUrl={message.voiceUrl} duration={message.voiceDuration} />
                          ) : (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          )}
                        </div>
                        <p className={`text-[9px] font-mono select-none ${isMe ? 'text-right text-gray-400' : 'text-left text-gray-450'}`}>
                          {formatMessageTime(message.createdAt)}
                          {isMe && <span className="ml-1 text-blue-500 dark:text-blue-400 font-extrabold font-mono">✓</span>}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Conversation Input Box */}
            {isRecording ? (
              <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-amber-50/50 dark:bg-amber-955/10 flex gap-3.5 items-center justify-between shrink-0 px-5 select-none">
                <div className="flex items-center gap-3.5 animate-pulse text-amber-700 dark:text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
                  <Mic className="w-4.5 h-4.5" />
                  <span className="text-xs font-mono font-bold">Recording Voice Note... {formatCallDurationSec(recordingDuration)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => stopVoiceRecording(false)}
                    className="p-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition"
                    title="Discard recording"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stopVoiceRecording(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center gap-2 text-xs font-bold shadow-md cursor-pointer hover:scale-103 active:scale-97 transition"
                    title="Send voice note"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            ) : (
              <form 
                onSubmit={handleSendMessage}
                className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-2.5 items-center shrink-0 pr-4"
              >
                {/* Microphone recording handle */}
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-955/20 dark:text-blue-400 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition shrink-0"
                  title="Record direct voice message"
                >
                  <Mic className="w-4.5 h-4.5 text-blue-500 hover:text-blue-600 dark:text-blue-400" />
                </button>

                <div className="flex-grow flex items-center bg-gray-100 dark:bg-gray-850 rounded-full px-4 py-2 border border-transparent focus-within:bg-white dark:focus-within:bg-gray-900 focus-within:border-gray-200 dark:focus-within:border-gray-850 shadow-2xs focus-within:ring-1 focus-within:ring-blue-500 transition-all duration-250">
                  <input
                    type="text"
                    placeholder={
                      statusPresence[activeUser.id] === 'dnd'
                        ? `Reply to ${activeUser.displayName}... (They are in Do Not Disturb)`
                        : `Spark a message to ${activeUser.displayName}...`
                    }
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-grow text-xs focus:ring-0 focus:outline-none border-0 bg-transparent text-gray-950 dark:text-white"
                  />
                  
                  {/* Visual sparkles indicator */}
                  <span className="text-gray-400 dark:text-gray-500 shrink-0">
                    <Smile className="w-4 h-4 hover:text-blue-500 transition cursor-help" />
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:hover:bg-blue-600 shrink-0 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 cursor-pointer transition-all disabled:pointer-events-none"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-12 space-y-4 select-none">
            <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-450">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="font-extrabold text-gray-900 dark:text-white">Active Texter Lounge</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                Connect deeply and live. Maintain active/DND statuses instantly, talk real-time under compliant socket nodes.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Immersive Internet Calling Overlay System */}
      {isCallActive && activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/75 backdrop-blur-md select-none text-white transition-all duration-300">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center p-6 relative">
            
            {/* Header branding */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 opacity-60 text-[10px] font-mono tracking-wider font-extrabold text-blue-400">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
              <span>TEXTER SECURE SYNC CALL</span>
            </div>

            {/* Video Feed Window / Remote View */}
            {callType === 'video' && callState === 'connected' ? (
              <div className="w-full aspect-video rounded-2xl bg-gray-950 border border-gray-800 overflow-hidden relative mb-6 group shadow-inner">
                {/* Simulated remote stream mockup or fallback visual */}
                {isVideoPaused ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-950 text-gray-500 text-xs flex-col gap-2">
                    <VideoOff className="w-10 h-10 mb-2 opacity-55 animate-pulse text-red-500" />
                    <span>Video Feeds Paused</span>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted={isMuted}
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                )}
                
                {/* Absolute overlay of active channel status */}
                <span className="absolute bottom-3 left-3 bg-gray-900/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-medium rounded-full border border-gray-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{activeUser.displayName} (Remote user)</span>
                </span>
              </div>
            ) : (
              // Immersive voice avatar screen
              <div className="my-8 flex flex-col items-center">
                <div className="relative">
                  {/* Pulse ring animation around caller avatar */}
                  {(callState === 'calling' || callState === 'incoming') && (
                    <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-ping opacity-65 scale-125" />
                  )}
                  <AnimatedMedia
                    src={activeUser.avatarUrl}
                    alt={activeUser.displayName}
                    className="w-24 h-24 rounded-full border-4 border-gray-800 object-cover shadow-xl relative z-10"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-0 right-1 bg-blue-600 rounded-full p-2 border-2 border-gray-900 z-20">
                    {callType === 'video' ? (
                      <Video className="w-4 h-4 text-white" />
                    ) : (
                      <Phone className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
                
                <h4 className="mt-5 text-lg font-black tracking-tight">{activeUser.displayName}</h4>
                <p className="text-xs text-gray-400 capitalize mt-1.5 tracking-wide flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  <span>{callState === 'connected' ? `In Call • ${formatCallDurationSec(callDuration)}` : callState}</span>
                </p>
              </div>
            )}

            {/* Calling system message prompts */}
            {callState === 'calling' && (
              <p className="text-xs text-gray-500 text-center select-none animate-pulse">
                Ringing, awaiting connection...
              </p>
            )}
            {callState === 'incoming' && (
              <p className="text-xs text-amber-400 font-bold text-center select-none animate-bounce">
                Incoming call request from {activeUser.displayName}!
              </p>
            )}

            {/* Custom controls menu */}
            <div className="mt-6 flex items-center justify-center gap-6 w-full max-w-xs">
              {callState === 'incoming' ? (
                <>
                  <button
                    onClick={() => hangupCall('declined')}
                    className="w-14 h-14 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer transition transform hover:scale-105"
                    title="Decline Call"
                  >
                    <Phone className="w-6 h-6 rotate-[135deg]" />
                  </button>
                  <button
                    onClick={answerCall}
                    className="w-14 h-14 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer transition transform hover:scale-105"
                    title="Answer Call"
                  >
                    <Phone className="w-6 h-6 animate-bounce" />
                  </button>
                </>
              ) : (
                <>
                  {/* Connected caller controls */}
                  {callState === 'connected' && (
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition cursor-pointer active:scale-95 ${
                        isMuted ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                      title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                    >
                      {isMuted ? <MicOff className="w-4.5 h-4.5 animate-pulse" /> : <Mic className="w-4.5 h-4.5" />}
                    </button>
                  )}

                  <button
                    onClick={() => hangupCall(callState === 'connected' ? 'completed' : 'missed')}
                    className="w-14 h-14 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-full flex items-center justify-center shadow-2xl cursor-pointer transition transform hover:scale-105"
                    title="Hang Up"
                  >
                    <Phone className="w-6 h-6 rotate-[135deg]" />
                  </button>

                  {callState === 'connected' && callType === 'video' && (
                    <button
                      onClick={() => setIsVideoPaused(!isVideoPaused)}
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition cursor-pointer active:scale-95 ${
                        isVideoPaused ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                      title={isVideoPaused ? 'Turn camera on' : 'Turn camera off'}
                    >
                      {isVideoPaused ? <VideoOff className="w-4.5 h-4.5 animate-pulse" /> : <Video className="w-4.5 h-4.5" />}
                    </button>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
