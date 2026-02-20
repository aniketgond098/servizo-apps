import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft, Search, Edit3 } from 'lucide-react';
import { AuthService } from '../services/auth';
import { DB } from '../services/db';
import { Message } from '../types';

export default function Messages() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<{ userId: string; userName: string; lastMessage: Message; unread: number; specialistId?: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }

    let allUsers: any[] = [];
    let allSpecialists: any[] = [];

    // Pre-fetch user/specialist lookup tables once, then keep messages live
    const init = async () => {
      [allUsers, allSpecialists] = await Promise.all([DB.getUsers(), DB.getSpecialists()]);
      startListener();
    };

    let unsub: (() => void) | null = null;

    const startListener = () => {
      unsub = DB.onUserMessages(currentUser.id, (userMessages) => {
        const userMap = new Map(allUsers.map((u: any) => [u.id, u]));
        const specialistByUserId = new Map(allSpecialists.map((s: any) => [s.userId, s]));

        const convMap = new Map<string, Message[]>();
        userMessages.forEach(msg => {
          const otherId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
          if (!convMap.has(otherId)) convMap.set(otherId, []);
          convMap.get(otherId)!.push(msg);
        });

        const convList = Array.from(convMap.entries()).map(([userId, msgs]) => {
          const sortedMsgs = msgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          const unread = msgs.filter(m => m.receiverId === currentUser.id && !m.read).length;
          const user = userMap.get(userId);
          let displayName = 'User';
          let specialistId: string | undefined;
          if (user) {
            if (user.role === 'worker') {
              const specialist = (specialistByUserId.get(user.id) as any) || allSpecialists.find((s: any) => s.id === user.id);
              displayName = specialist ? `${user.name} (${specialist.category})` : `${user.name} (Service Provider)`;
              specialistId = specialist?.id;
            } else { displayName = user.name; }
          }
          return { userId, userName: displayName, lastMessage: sortedMsgs[0], unread, specialistId };
        });

        setConversations(convList.sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()));
      });
    };

    init();
    return () => { if (unsub) unsub(); };
  }, []);

  if (!currentUser) return null;

  const filteredConversations = conversations.filter(c =>
    c.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' }).toUpperCase();
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase();
  };

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back button */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#000000] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Messages Container */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm" style={{ minHeight: 'calc(100vh - 220px)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <h1 className="text-xl font-bold text-[#000000]">Messages</h1>
            <button className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
              <Edit3 className="w-4 h-4 text-[#4169E1]" />
            </button>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#000000] placeholder-gray-400 focus:outline-none focus:border-[#4169E1] focus:ring-1 focus:ring-[#4169E1]/20 transition-all"
              />
            </div>
          </div>

          {/* Conversation List */}
          {filteredConversations.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {filteredConversations.map(conv => (
                <Link key={conv.userId} to={`/chat/${conv.userId}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#000000] to-[#2a4a7f] flex items-center justify-center text-white font-semibold text-sm">
                      {conv.userName.charAt(0).toUpperCase()}
                    </div>
                    {conv.unread > 0 && (
                      <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#4169E1] rounded-full border-2 border-white" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-sm truncate ${conv.unread > 0 ? 'font-bold text-[#000000]' : 'font-medium text-[#000000]'}`}>
                        {conv.userName}
                      </h3>
                      <span className={`text-xs ml-3 flex-shrink-0 ${conv.unread > 0 ? 'text-[#4169E1] font-semibold' : 'text-gray-400'}`}>
                        {formatTime(conv.lastMessage.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <p className={`text-sm truncate flex-1 ${conv.unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                          {conv.lastMessage.senderId === currentUser.id && (
                            <span className="text-gray-400">You: </span>
                          )}
                          {conv.lastMessage.messageType === 'image' ? '📷 Photo' : conv.lastMessage.messageType === 'document' ? `📎 ${conv.lastMessage.attachment?.name || 'Document'}` : conv.lastMessage.content}
                        </p>
                      {conv.unread > 0 && (
                        <div className="w-5 h-5 bg-[#4169E1] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-white">{conv.unread}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-[#000000] font-semibold mb-1">No messages yet</p>
              <p className="text-sm text-gray-400 mb-5">Start a conversation with a service provider</p>
              <Link to="/listing" className="px-5 py-2.5 bg-[#000000] text-white rounded-xl text-sm font-semibold hover:bg-[#1a1a1a] transition-colors">
                Browse Specialists
              </Link>
            </div>
          )}

          {/* Footer - User info */}
          {currentUser && (
            <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#4169E1] flex items-center justify-center text-white text-xs font-bold">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#000000]">{currentUser.name}</p>
                  <p className="text-xs text-gray-400">Active now</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
