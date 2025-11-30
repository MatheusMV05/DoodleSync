import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Users, X, Send, UserPlus, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, setDoc, updateDoc, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    timestamp: any;
}

interface SocialSidebarProps {
    fileId: string;
    isOpen: boolean;
    onClose: () => void;
}

export const SocialSidebar: React.FC<SocialSidebarProps> = ({ fileId, isOpen, onClose }) => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'chat' | 'users' | 'friends'>('chat');
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Efeito para scrollar para a última mensagem
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen, activeTab]);

    // Listener de mensagens do Firestore
    useEffect(() => {
        if (!fileId) return;

        const messagesRef = collection(db, 'drawings', fileId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: Message[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Message));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [fileId]);

    // Presence Logic
    useEffect(() => {
        if (!fileId || !currentUser) return;

        const presenceRef = doc(db, 'drawings', fileId, 'presence', currentUser.uid);

        // 1. Set initial presence
        const setOnline = async () => {
            await setDoc(presenceRef, {
                uid: currentUser.uid,
                displayName: currentUser.displayName || 'User',
                photoURL: currentUser.photoURL || null,
                isOnline: true,
                lastActive: serverTimestamp()
            });
        };

        setOnline();

        // 2. Heartbeat (update lastActive every 30s)
        const interval = setInterval(() => {
            updateDoc(presenceRef, {
                lastActive: serverTimestamp()
            });
        }, 30000);

        // 3. Listen for other users
        const presenceCollection = collection(db, 'drawings', fileId, 'presence');
        const unsubscribe = onSnapshot(presenceCollection, (snapshot) => {
            const now = Date.now();
            const users = snapshot.docs.map(doc => {
                const data = doc.data();
                const lastActive = data.lastActive?.toMillis() || 0;
                const isOnline = (now - lastActive) < 60000;
                return { ...data, isOnline };
            });
            setOnlineUsers(users.filter((u: any) => u.uid !== currentUser.uid));
        });

        // 4. Cleanup on unmount
        return () => {
            clearInterval(interval);
            unsubscribe();
            updateDoc(presenceRef, {
                isOnline: false
            }).catch(err => console.error("Error setting offline:", err));
        };
    }, [fileId, currentUser]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        try {
            const messagesRef = collection(db, 'drawings', fileId, 'messages');
            await addDoc(messagesRef, {
                text: newMessage,
                senderId: currentUser.uid,
                senderName: currentUser.displayName || 'Usuário',
                timestamp: serverTimestamp()
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    // ... existing motion props
                    className="fixed right-0 top-14 bottom-0 w-80 bg-zinc-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-40 flex flex-col"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex bg-white/5 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                    }`}
                                title="Chat"
                            >
                                <MessageSquare size={16} />
                            </button>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                    }`}
                                title="Online Users"
                            >
                                <Users size={16} />
                                <span className="ml-2 text-xs">({onlineUsers.length})</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('friends')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'friends' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                    }`}
                                title="Friends"
                            >
                                <UserPlus size={16} />
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
                                {messages.length === 0 && (
                                    <div className="text-center text-gray-500 text-sm mt-10">
                                        Nenhuma mensagem ainda.<br />Seja o primeiro a dizer oi!
                                    </div>
                                )}
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
                        ) : activeTab === 'users' ? (
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
                        ) : (
                            <FriendsTab />
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

const FriendsTab: React.FC = () => {
    const { currentUser } = useAuth();
    const [friendEmail, setFriendEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [statusMsg, setStatusMsg] = useState('');
    const [requests, setRequests] = useState<any[]>([]);
    const [friends, setFriends] = useState<any[]>([]);

    useEffect(() => {
        if (!currentUser) return;

        // Listen for Friend Requests
        const qRequests = query(
            collection(db, 'friend_requests'),
            where('to', '==', currentUser.uid),
            where('status', '==', 'pending')
        );

        const unsubRequests = onSnapshot(qRequests, (snap) => {
            setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Listen for Friends
        const qFriends = collection(db, 'users', currentUser.uid, 'friends');
        const unsubFriends = onSnapshot(qFriends, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setFriends(list.filter((f: any) => f.uid !== currentUser.uid));
        });

        return () => {
            unsubRequests();
            unsubFriends();
        };
    }, [currentUser]);

    const handleAddFriend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!friendEmail.trim() || !currentUser) return;
        setStatus('loading');

        try {
            // 1. Find user by email
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', friendEmail.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setStatus('error');
                setStatusMsg('Usuário não encontrado.');
                return;
            }

            const targetUser = querySnapshot.docs[0].data();
            const targetUid = querySnapshot.docs[0].id;

            if (targetUid === currentUser.uid) {
                setStatus('error');
                setStatusMsg('Você não pode adicionar a si mesmo.');
                return;
            }

            // 2. Check if already friends or request sent (simplified)
            // ...

            // 3. Send Request
            await addDoc(collection(db, 'friend_requests'), {
                from: currentUser.uid,
                fromName: currentUser.displayName,
                fromEmail: currentUser.email,
                to: targetUid,
                status: 'pending',
                timestamp: serverTimestamp()
            });

            setStatus('success');
            setStatusMsg('Solicitação enviada!');
            setFriendEmail('');
        } catch (err) {
            console.error(err);
            setStatus('error');
            setStatusMsg('Erro ao enviar solicitação.');
        } finally {
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    const handleAccept = async (req: any) => {
        if (!currentUser) return;
        try {
            // 1. Add to my friends
            await setDoc(doc(db, 'users', currentUser.uid, 'friends', req.from), {
                uid: req.from,
                displayName: req.fromName,
                email: req.fromEmail,
                addedAt: serverTimestamp()
            });

            // 2. Add me to their friends
            await setDoc(doc(db, 'users', req.from, 'friends', currentUser.uid), {
                uid: currentUser.uid,
                displayName: currentUser.displayName,
                email: currentUser.email,
                addedAt: serverTimestamp()
            });

            // 3. Delete request
            await deleteDoc(doc(db, 'friend_requests', req.id));
        } catch (err) {
            console.error("Error accepting friend:", err);
        }
    };

    const handleReject = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'friend_requests', id));
        } catch (err) {
            console.error("Error rejecting:", err);
        }
    };

    return (
        <div className="space-y-6">
            {/* Add Friend */}
            <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Adicionar Amigo</h3>
                <form onSubmit={handleAddFriend} className="flex items-center gap-2">
                    <input
                        type="email"
                        value={friendEmail}
                        onChange={(e) => setFriendEmail(e.target.value)}
                        placeholder="Email do amigo"
                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                    />
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="p-2 bg-violet-600 rounded-lg text-white hover:bg-violet-700 disabled:opacity-50 flex-shrink-0"
                    >
                        <UserPlus size={18} />
                    </button>
                </form>
                {status !== 'idle' && (
                    <p className={`text-xs ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {statusMsg}
                    </p>
                )}
            </div>

            {/* Requests */}
            {requests.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Solicitações ({requests.length})</h3>
                    <div className="space-y-2">
                        {requests.map(req => (
                            <div key={req.id} className="bg-white/5 p-3 rounded-lg flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-white">{req.fromName}</p>
                                    <p className="text-xs text-gray-500">{req.fromEmail}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleAccept(req)} className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30">
                                        <Check size={14} />
                                    </button>
                                    <button onClick={() => handleReject(req.id)} className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30">
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Friends List */}
            <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Amigos ({friends.length})</h3>
                {friends.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Nenhum amigo ainda.</p>
                ) : (
                    <div className="space-y-2">
                        {friends.map(friend => (
                            <div key={friend.uid} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors group">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                                    {friend.displayName?.[0]}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-white">{friend.displayName}</h4>
                                    <p className="text-xs text-gray-500">{friend.email}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
