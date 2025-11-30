import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
// @ts-ignore
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, Share2 } from "lucide-react";

export const Editor: React.FC = () => {
    const { fileId } = useParams<{ fileId: string }>();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [title, setTitle] = useState("Untitled");
    const [loading, setLoading] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (!fileId || !currentUser) return;

        const loadDrawing = async () => {
            try {
                const docRef = doc(db, "drawings", fileId);
                const snap = await getDoc(docRef);

                if (snap.exists()) {
                    const data = snap.data();
                    setTitle(data.name || "Untitled");
                }
            } catch (error) {
                console.error("Error loading:", error);
            } finally {
                setLoading(false);
            }
        };

        loadDrawing();
    }, [fileId, currentUser]);

    const handleTitleChange = async (newTitle: string) => {
        setTitle(newTitle);
        if (fileId) {
            try {
                await updateDoc(doc(db, "drawings", fileId), {
                    name: newTitle,
                    lastUpdated: serverTimestamp()
                });
            } catch (error) {
                console.error("Error updating title:", error);
            }
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50">
                <div className="animate-pulse text-indigo-600 font-medium">Loading...</div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex flex-col">
            {/* Header */}
            <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 justify-between shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={(e) => handleTitleChange(e.target.value)}
                        className="font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                    />
                </div>

                <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                    <Share2 size={16} />
                    Share
                </button>
            </header>

            {/* Excalidraw Iframe */}
            <div style={{ height: "calc(100vh - 3.5rem)", width: "100%" }}>
                <iframe
                    ref={iframeRef}
                    src="https://excalidraw.com/?sidebar=0"
                    style={{ width: "100%", height: "100%", border: "none" }}
                    title="Excalidraw"
                />
            </div>
        </div>
    );
};
