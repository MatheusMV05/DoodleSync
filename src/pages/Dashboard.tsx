import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Folder as FolderIcon, File as FileIcon } from "lucide-react";
// @ts-ignore
import { collection, addDoc, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

interface FileItem {
    id: string;
    name: string;
    type: "folder" | "file";
    updatedAt: any;
}

export const Dashboard: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [items, setItems] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchItems();
    }, [currentUser]);

    const fetchItems = async () => {
        if (!currentUser) return;

        try {
            // Fetch folders
            const foldersQuery = query(
                collection(db, "folders"),
                where("ownerId", "==", currentUser.uid),
                // orderBy("createdAt", "desc") // Requires index
            );

            // Fetch drawings
            const drawingsQuery = query(
                collection(db, "drawings"),
                where("ownerId", "==", currentUser.uid),
                // orderBy("lastUpdated", "desc") // Requires index
            );

            const [foldersSnap, drawingsSnap] = await Promise.all([
                getDocs(foldersQuery),
                getDocs(drawingsQuery)
            ]);

            const folders = foldersSnap.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                type: "folder" as const,
                updatedAt: doc.data().createdAt
            }));

            const drawings = drawingsSnap.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                type: "file" as const,
                updatedAt: doc.data().lastUpdated
            }));

            setItems([...folders, ...drawings]);
        } catch (error) {
            console.error("Error fetching items:", error);
        } finally {
            setLoading(false);
        }
    };

    const createDrawing = async () => {
        if (!currentUser) return;

        try {
            const docRef = await addDoc(collection(db, "drawings"), {
                name: "Untitled Drawing",
                ownerId: currentUser.uid,
                folderId: "root",
                content: JSON.stringify({
                    elements: [],
                    appState: {
                        viewBackgroundColor: "#ffffff",
                        currentItemFontFamily: 1
                    }
                }),
                accessControl: {
                    publicLinkAccess: "none",
                    users: {
                        [currentUser.uid]: "owner"
                    }
                },
                createdAt: Date.now(),
                lastUpdated: Date.now()
            });

            navigate(`/file/${docRef.id}`);
        } catch (error) {
            console.error("Error creating drawing:", error);
        }
    };

    const createFolder = async () => {
        const name = prompt("Folder Name:");
        if (!name || !currentUser) return;

        try {
            await addDoc(collection(db, "folders"), {
                name,
                ownerId: currentUser.uid,
                parentId: "root",
                createdAt: Date.now()
            });
            fetchItems();
        } catch (error) {
            console.error("Error creating folder:", error);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">My Files</h2>
                <div className="flex gap-3">
                    <button
                        onClick={createFolder}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Plus size={18} />
                        New Folder
                    </button>
                    <button
                        onClick={createDrawing}
                        className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        New Drawing
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.map((item) => (
                    <Link
                        key={item.id}
                        to={item.type === "folder" ? `/dashboard/folder/${item.id}` : `/file/${item.id}`}
                        className="group relative bg-white p-6 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-lg ${item.type === 'folder' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                {item.type === "folder" ? <FolderIcon size={24} /> : <FileIcon size={24} />}
                            </div>
                        </div>
                        <h3 className="font-medium text-gray-900 truncate mb-1">{item.name}</h3>
                        <p className="text-xs text-gray-500">
                            {new Date(item.updatedAt).toLocaleDateString()}
                        </p>
                    </Link>
                ))}
            </div>

            {items.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500">No files found. Create one to get started!</p>
                </div>
            )}
        </div>
    );
};
