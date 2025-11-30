import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// @ts-ignore
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { Plus, Search, MoreVertical, Clock, File } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";

export const Dashboard: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [drawings, setDrawings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, "drawings"),
            where("ownerId", "==", currentUser.uid),
            // orderBy("lastUpdated", "desc") // Requires index
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDrawings(docs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const createDrawing = async () => {
        if (!currentUser) return;

        try {
            const docRef = await addDoc(collection(db, "drawings"), {
                name: "Untitled Drawing",
                ownerId: currentUser.uid,
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp(),
                content: JSON.stringify({
                    elements: [],
                    appState: {
                        viewBackgroundColor: "#ffffff",
                        currentItemFontFamily: 1
                    },
                    files: {}
                }),
                folderId: "root",
                accessControl: {
                    publicLinkAccess: "none",
                    users: {
                        [currentUser.uid]: "owner"
                    }
                }
            });
            navigate(`/editor/${docRef.id}`);
        } catch (error) {
            console.error("Error creating drawing:", error);
        }
    };

    const filteredDrawings = drawings.filter(d =>
        d.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">My Drawings</h1>
                    <p className="text-gray-400">Manage and organize your creative work</p>
                </div>
                <Button onClick={createDrawing} icon={<Plus size={20} />}>
                    New Drawing
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="glass-panel p-2 rounded-xl flex items-center gap-2 max-w-md">
                <Search className="text-gray-500 ml-2" size={20} />
                <input
                    type="text"
                    placeholder="Search drawings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 w-full"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDrawings.map((drawing, index) => (
                    <motion.div
                        key={drawing.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => navigate(`/editor/${drawing.id}`)}
                        className="group relative aspect-[4/3] rounded-2xl bg-surface hover:bg-surface-hover border border-white/5 hover:border-violet-500/30 transition-all cursor-pointer overflow-hidden"
                    >
                        {/* Preview Placeholder */}
                        <div className="absolute inset-0 p-4 flex flex-col items-center justify-center bg-gradient-to-br from-white/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity">
                            <File size={48} className="text-gray-600 group-hover:text-violet-400 transition-colors mb-4" />
                        </div>

                        {/* Content Overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h3 className="font-medium text-white truncate pr-2">{drawing.name}</h3>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                                        <Clock size={12} />
                                        <span>
                                            {drawing.lastUpdated?.seconds
                                                ? new Date(drawing.lastUpdated.seconds * 1000).toLocaleDateString()
                                                : 'Just now'}
                                        </span>
                                    </div>
                                </div>
                                <button className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                                    <MoreVertical size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Empty State */}
                {filteredDrawings.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-surface border border-white/5 flex items-center justify-center mb-4">
                            <File size={32} className="text-gray-600" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1">No drawings found</h3>
                        <p className="text-gray-400 mb-6">Create your first drawing to get started</p>
                        <Button variant="secondary" onClick={createDrawing}>
                            Create Drawing
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
