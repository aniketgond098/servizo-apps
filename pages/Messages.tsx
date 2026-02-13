import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { AuthService } from '../services/auth';
import { DB } from '../services/db';
import { Message } from '../types';

export default function Messages() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<{ userId: string; userName: string; lastMessage: Message; unread: number; specialistId?: string }[]>([]);
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    const loadMessages = async () => {
      const allMessages = await DB.getMessages();
      const userMessages = allMessages.filter(m => m.senderId === currentUser.id || m.receiverId === currentUser.id);
      
      const convMap = new Map<string, Message[]>();
      userMessages.forEach(msg => {
        const otherId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
        if (!convMap.has(otherId)) convMap.set(otherId, []);
        convMap.get(otherId)!.push(msg);
      });
      
      const convList = await Promise.all(
        Array.from(convMap.entries()).map(async ([userId, msgs]) => {
          const sortedMsgs = msgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          const unread = msgs.filter(m => m.receiverId === currentUser.id && !m.read).length;
          const user = await DB.getUserById(userId);
          
          let displayName = 'User';
          let specialistId: string | undefined;
          if (user) {
            if (user.role === 'worker') {
              const specialists = await DB.getSpecialists();
              const specialist = specialists.find(s => s.userId === user.id || s.id === user.id);
              if (specialist) {
                displayName = `${user.name} (${specialist.category})`;
                specialistId = specialist.id;
              } else {
                displayName = `${user.name} (Service Provider)`;
              }
            } else {
              displayName = user.name;
            }
          }
          
          return {
            userId,
            userName: displayName,
            lastMessage: sortedMsgs[0],
            unread,
            specialistId
          };
        })
      );
      
      const sortedConvList = convList.sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
      setConversations(sortedConvList);
    };
    loadMessages();
  }, []);

  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
      <button 
        onClick={() => navigate(-1)} 
        className="fixed top-20 left-4 sm:left-6 z-40 p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all group"
      >
        <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
      </button>

      <div className="pt-8 sm:pt-12">
        <div className="flex items-center gap-3 mb-8">
          <MessageCircle className="w-8 h-8 text-green-500" />
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">My <span className="text-green-500">Messages</span></h1>
        </div>

        {conversations.length > 0 ? (
          <div className="space-y-3">
            {conversations.map(conv => (
              <Link 
                key={conv.userId} 
                to={`/chat/${conv.userId}`}
                className="block bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl hover:border-green-500/40 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-lg font-bold flex-shrink-0">
                    {conv.userName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold truncate">{conv.userName}</h3>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{new Date(conv.lastMessage.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">{conv.lastMessage.content}</p>
                  </div>
                  {conv.unread > 0 && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {conv.unread}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No messages yet</p>
            <Link to="/listing" className="inline-block mt-4 px-6 py-3 bg-blue-600 rounded-full text-sm font-bold hover:bg-blue-500 transition-all">
              Browse Specialists
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
