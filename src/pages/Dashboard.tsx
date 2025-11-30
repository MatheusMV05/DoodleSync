import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// @ts-ignore
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { Plus, Search, MoreVertical, Clock, File, Star, Trash2, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/ui/Button";
import { clsx } from "clsx";

interface DashboardProps {
    view?: "recent" | "all" | "favorites" | "trash" | "folder";
}

export const Dashboard: React.FC<DashboardProps> = ({ view = "recent" }) => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [drawings, setDrawings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, "drawings"),
            where("ownerId", "==", currentUser.uid)
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
                isFavorite: false,
                isTrashed: false,
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

    const toggleFavorite = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
        e.stopPropagation();
        try {
            await updateDoc(doc(db, "drawings", id), {
                isFavorite: !currentStatus
            });
            setActiveMenu(null);
        } catch (error) {
            console.error("Error toggling favorite:", error);
        }
    };

    const toggleTrash = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
        e.stopPropagation();
        try {
            await updateDoc(doc(db, "drawings", id), {
                isTrashed: !currentStatus,
                deletedAt: !currentStatus ? serverTimestamp() : null
            });
            setActiveMenu(null);
        } catch (error) {
            console.error("Error toggling trash:", error);
        }
    };

    const deleteForever = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm("Are you sure? This cannot be undone.")) {
            try {
                await deleteDoc(doc(db, "drawings", id));
                setActiveMenu(null);
            } catch (error) {
                console.error("Error deleting drawing:", error);
            }
        }
    };

    const getFilteredDrawings = () => {
        let filtered = drawings;

        // 1. Filter by View
        switch (view) {
            case "trash":
                filtered = filtered.filter(d => d.isTrashed);
                break;
            case "favorites":
                filtered = filtered.filter(d => !d.isTrashed && d.isFavorite);
                break;
            case "recent":
                filtered = filtered.filter(d => !d.isTrashed);
                // Sort by lastUpdated desc
                filtered.sort((a, b) => {
                    const dateA = a.lastUpdated?.seconds || 0;
                    const dateB = b.lastUpdated?.seconds || 0;
                    return dateB - dateA;
                });
                break;
            case "all":
            default:
                filtered = filtered.filter(d => !d.isTrashed);
                break;
        }

        // 2. Filter by Search
        if (searchQuery) {
            filtered = filtered.filter(d =>
                d.name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    };

    const filteredDrawings = getFilteredDrawings();

    const getTitle = () => {
        switch (view) {
            case "trash": return "Trash";
            case "favorites": return "Favorites";
            case "recent": return "Recent Drawings";
            case "all": return "All Drawings";
            default: return "My Drawings";
        }
    };

    const getDescription = () => {
        switch (view) {
            case "trash": return "Items in trash will be deleted after 30 days";
            case "favorites": return "Your starred drawings";
            case "recent": return "Pick up where you left off";
            default: return "Manage and organize your creative work";
        }
    };

    const formatRelativeTime = (timestamp: any) => {
        if (!timestamp?.seconds) return 'Just now';
        const date = new Date(timestamp.seconds * 1000);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8" onClick={() => setActiveMenu(null)}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">{getTitle()}</h1>
                    <p className="text-gray-400">{getDescription()}</p>
                </div>
                {view !== "trash" && (
                    <Button onClick={createDrawing} icon={<Plus size={20} />}>
                        New Drawing
                    </Button>
                )}
            </div>

            {/* Search */}
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
                <AnimatePresence>
                    {filteredDrawings.map((drawing, index) => (
                        <motion.div
                            key={drawing.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => navigate(`/editor/${drawing.id}`)}
                            className="group relative aspect-[4/3] rounded-2xl bg-surface hover:bg-surface-hover border border-white/5 hover:border-violet-500/30 transition-all cursor-pointer overflow-hidden"
                        >
                            {/* Preview Placeholder */}
                            <div className="absolute inset-0 p-4 flex flex-col items-center justify-center bg-gradient-to-br from-white/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity">
                                <File size={48} className="text-gray-600 group-hover:text-violet-400 transition-colors mb-4" />
                            </div>

                            {/* Favorite Indicator */}
                            {drawing.isFavorite && (
                                <div className="absolute top-3 right-3 text-yellow-400">
                                    <Star size={16} fill="currentColor" />
                                </div>
                            )}

                            {/* Content Overlay */}
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-medium text-white truncate pr-2">{drawing.name}</h3>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                                            <Clock size={12} />
                                            <span>{formatRelativeTime(drawing.lastUpdated)}</span>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenu(activeMenu === drawing.id ? null : drawing.id);
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100 data-[active=true]:opacity-100"
                                            data-active={activeMenu === drawing.id}
                                        >
                                            <MoreVertical size={16} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {activeMenu === drawing.id && (
                                            <div className="absolute bottom-full right-0 mb-2 w-48 bg-surface border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                                                {view === "trash" ? (
                                                    <>
                                                        <button
                                                            onClick={(e) => toggleTrash(e, drawing.id, true)}
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                                                        >
                                                            <RotateCcw size={16} />
                                                            Restore
                                                        </button>
                                                        <button
                                                            onClick={(e) => deleteForever(e, drawing.id)}
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                            Delete Forever
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={(e) => toggleFavorite(e, drawing.id, drawing.isFavorite)}
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                                                        >
                                                            <Star size={16} className={drawing.isFavorite ? "fill-yellow-400 text-yellow-400" : ""} />
                                                            {drawing.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                                                        </button>
                                                        <button
                                                            onClick={(e) => toggleTrash(e, drawing.id, false)}
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                            Move to Trash
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Empty State */}
                {filteredDrawings.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-surface border border-white/5 flex items-center justify-center mb-4">
                            {view === "trash" ? <Trash2 size={32} className="text-gray-600" /> :
                                view === "favorites" ? <Star size={32} className="text-gray-600" /> :
                                    <File size={32} className="text-gray-600" />}
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1">
                            {view === "trash" ? "Trash is empty" :
                                view === "favorites" ? "No favorites yet" :
                                    "No drawings found"}
                        </h3>
                        <p className="text-gray-400 mb-6">
                            {view === "trash" ? "Items moved to trash will appear here" :
                                view === "favorites" ? "Star your best drawings to find them easily" :
                                    "Create your first drawing to get started"}
                        </p>
                        {view !== "trash" && view !== "favorites" && (
                            <Button variant="secondary" onClick={createDrawing}>
                                Create Drawing
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
