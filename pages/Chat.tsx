import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, ExternalLink } from 'lucide-react';
import { DB } from '../services/db';
import { AuthService } from '../services/auth';
import { Message } from '../types';

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatUser, setChatUser] = useState<any>(null);
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    const loadData = async () => {
      if (userId) {
        loadMessages();
        DB.markMessagesAsRead(currentUser.id, userId);
        const user = await DB.getUserById(userId);
        
        if (user) {
          if (user.role === 'worker') {
            const specialists = await DB.getSpecialists();
            const specialist = specialists.find(s => s.userId === user.id || s.id === user.id);
            if (specialist) {
              setChatUser({ ...user, displayName: `${user.name} (${specialist.category})` });
              setSpecialistId(specialist.id);
            } else {
              setChatUser({ ...user, displayName: `${user.name} (Service Provider)` });
            }
          } else {
            setChatUser({ ...user, displayName: user.name });
          }
        } else {
          setChatUser({ id: userId, name: 'User', displayName: 'User', role: 'user' as const });
        }
      }
    };
    loadData();
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    const user = AuthService.getCurrentUser();
    if (user && userId) {
      const msgs = await DB.getConversation(user.id, userId);
      setMessages(msgs);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !userId) return;

    setLoading(true);
    await DB.sendMessage({
      senderId: currentUser.id,
      receiverId: userId,
      content: newMessage
    });
    setNewMessage('');
    await loadMessages();
    setLoading(false);
  };

  if (!currentUser) {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center">Please login to send messages</div>;
  }

  if (!chatUser) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
      <button 
        onClick={() => navigate(-1)} 
        className="fixed top-20 left-4 sm:left-6 z-40 p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all group"
      >
        <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
      </button>

      <div className="pt-8 sm:pt-12">
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col h-[calc(100vh-200px)]">
          {/* Header */}
          <div className="p-6 border-b border-zinc-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold">
              {chatUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              {specialistId ? (
                <Link 
                  to={`/profile/${specialistId}`}
                  className="font-bold text-lg hover:text-blue-500 transition-colors flex items-center gap-2 group"
                >
                  {chatUser?.displayName || chatUser?.name || 'User'}
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ) : (
                <h2 className="font-bold text-lg">{chatUser?.displayName || chatUser?.name || 'User'}</h2>
              )}
              <p className="text-xs text-gray-500 uppercase tracking-widest">{chatUser?.role || 'user'}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length > 0 ? messages.map(msg => {
              const isOwn = msg.senderId === currentUser.id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-4 rounded-2xl ${isOwn ? 'bg-blue-600' : 'bg-zinc-800'}`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className="text-[10px] text-gray-400 mt-2">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center text-gray-500 py-12">
                <p className="text-sm">No messages yet. Start the conversation!</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-6 border-t border-zinc-800">
            <div className="flex gap-3">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !newMessage.trim()}
                className="px-6 py-3 bg-blue-600 rounded-2xl font-bold text-sm hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
