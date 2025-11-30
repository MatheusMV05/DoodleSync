import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Users, X, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
// import { doc, onSnapshot, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
// import { db } from '../firebase';

interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    timestamp: number;
}

interface SocialSidebarProps {
    fileId: string;
    isOpen: boolean;
    onClose: () => void;
}

export const SocialSidebar: React.FC<SocialSidebarProps> = ({ fileId, isOpen, onClose }) => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'chat' | 'users'>('chat');
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]); // Mocked for now
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Efeito para scrollar para a última mensagem
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Listener de mensagens do Firestore (Exemplo Simplificado)
    useEffect(() => {
        if (!fileId) return;
        // Na prática, você criaria uma subcoleção 'messages' dentro do documento do desenho
        // const unsub = onSnapshot(collection(db, 'drawings', fileId, 'messages')...

        // Mock de mensagens para visualização UI
        setMessages([
            { id: '1', text: 'Oi gente, vamos começar o brainstorm?', senderId: 'other', senderName: 'Alice', timestamp: Date.now() },
            { id: '2', text: 'Claro! Vou desenhar o wireframe.', senderId: currentUser?.uid || '', senderName: 'Eu', timestamp: Date.now() }
        ]);

        // Mock de usuários online
        setOnlineUsers([
            { uid: '1', displayName: 'Alice Silva', isOnline: true },
            { uid: '2', displayName: 'Bob Santos', isOnline: false },
        ]);

    }, [fileId, currentUser]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        const msg: Message = {
            id: Date.now().toString(),
            text: newMessage,
            senderId: currentUser.uid,
            senderName: currentUser.displayName || 'User',
            timestamp: Date.now()
        };

        // UI Optimistic update
        setMessages(prev => [...prev, msg]);
        setNewMessage('');

        // Aqui você salvaria no Firebase
        // await addDoc(collection(db, 'drawings', fileId, 'messages'), msg);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed right-0 top-14 bottom-0 w-80 bg-zinc-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-40 flex flex-col"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex bg-white/5 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <MessageSquare size={16} className="inline mr-2" />
                                Chat
                            </button>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <Users size={16} className="inline mr-2" />
                                ({onlineUsers.length})
                            </button>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {activeTab === 'chat' ? (
                            <div className="space-y-4">
                                {messages.map((msg) => {
                                    const isMe = msg.senderId === currentUser?.uid;
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${isMe
                                                    ? 'bg-violet-600 text-white rounded-br-none'
                                                    : 'bg-white/10 text-gray-200 rounded-bl-none'
                                                }`}>
                                                {msg.text}
                                            </div>
                                            <span className="text-[10px] text-gray-500 mt-1 px-1">
                                                {isMe ? 'Você' : msg.senderName}
                                            </span>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {onlineUsers.map(user => (
                                    <div key={user.uid} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                                                {user.displayName[0]}
                                            </div>
                                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-900 ${user.isOnline ? 'bg-green-500' : 'bg-gray-500'
                                                }`} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-white">{user.displayName}</h4>
                                            <p className="text-xs text-gray-400">
                                                {user.isOnline ? 'Online na Sala' : 'Offline'}
                                            </p>
                                        </div>
                                        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100">
                                            Invite
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Chat Input */}
                    {activeTab === 'chat' && (
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-white/5">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Digite uma mensagem..."
                                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="absolute right-2 top-2 p-1.5 bg-violet-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-violet-700 transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
