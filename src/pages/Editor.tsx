import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
// @ts-ignore
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, Share2, MessageSquare, Cloud } from "lucide-react";
import { SocialSidebar } from "../components/SocialSidebar";
import { Button } from "../components/ui/Button";

// Importação Oficial
import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";

export const Editor: React.FC = () => {
    const { fileId } = useParams<{ fileId: string }>();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [title, setTitle] = useState("Untitled");
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

    const [initialData, setInitialData] = useState<any>(null);
    const saveTimeoutRef = useRef<any>(null);

    useEffect(() => {
        if (!fileId || !currentUser) return;

        const loadDrawing = async () => {
            try {
                const docRef = doc(db, "drawings", fileId);
                const snap = await getDoc(docRef);

                if (snap.exists()) {
                    const data = snap.data();
                    setTitle(data.name || "Untitled");

                    if (data.content) {
                        const parsedContent = JSON.parse(data.content);
                        setInitialData({
                            elements: parsedContent.elements || [],
                            appState: {
                                ...parsedContent.appState,
                                collaborators: [],
                                scrollX: 0,
                                scrollY: 0,
                                zoom: { value: 1 },
                                viewBackgroundColor: parsedContent.appState?.viewBackgroundColor || "#121212"
                            },
                            scrollToContent: false
                        });
                    }
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

    const handleOnChange = (elements: any, appState: any) => {
        setSaveStatus('saving');

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            if (!fileId) return;

            try {
                const content = JSON.stringify({
                    elements,
                    appState: {
                        viewBackgroundColor: appState.viewBackgroundColor,
                        currentItemFontFamily: appState.currentItemFontFamily,
                        currentItemStrokeColor: appState.currentItemStrokeColor,
                        currentItemBackgroundColor: appState.currentItemBackgroundColor
                    }
                });

                await updateDoc(doc(db, "drawings", fileId), {
                    content,
                    lastUpdated: serverTimestamp()
                });
                setSaveStatus('saved');
            } catch (error) {
                console.error("Erro ao salvar:", error);
                setSaveStatus('unsaved');
            }
        }, 1000);
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 animate-pulse">Carregando sua arte...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
            {/* Header */}
            <header className="h-14 border-b border-white/5 bg-surface/50 backdrop-blur-md flex items-center px-4 justify-between shrink-0 z-50 relative">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={(e) => handleTitleChange(e.target.value)}
                            className="font-semibold text-white bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-sm w-48 truncate"
                        />
                        <div className="flex items-center gap-1.5">
                            {saveStatus === 'saving' ? (
                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" /> Saving...
                                </span>
                            ) : (
                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                    <Cloud size={10} /> Saved to Cloud
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={isSidebarOpen ? "bg-white/10 text-white" : "text-gray-400"}
                    >
                        <MessageSquare size={18} />
                    </Button>

                    <Button variant="primary" size="sm" icon={<Share2 size={16} />}>
                        Share
                    </Button>
                </div>
            </header>

            {/* SOLUÇÃO DO ERRO DE CANVAS:
               1. min-h-0: Impede que o flex item cresça além do pai.
               2. relative: Cria contexto para o absolute filho.
            */}
            <div className="flex-1 relative w-full min-h-0 bg-[#121212]">

                {/* 3. absolute inset-0: Força o wrapper do Excalidraw a ter
                      exatamente o tamanho do pai, sem recalcular pixels infinitamente.
                */}
                <div className="absolute inset-0">
                    <Excalidraw
                        theme="dark"
                        initialData={initialData}
                        onChange={handleOnChange}
                        UIOptions={{
                            canvasActions: {
                                saveToActiveFile: false,
                                loadScene: false,
                                export: { saveFileToDisk: true },
                                toggleTheme: true
                            }
                        }}
                    >
                        <MainMenu>
                            <MainMenu.DefaultItems.Export />
                            <MainMenu.DefaultItems.SaveAsImage />
                            <MainMenu.DefaultItems.ClearCanvas />
                            <MainMenu.Separator />
                            <MainMenu.DefaultItems.ChangeCanvasBackground />
                        </MainMenu>
                        <WelcomeScreen />
                    </Excalidraw>
                </div>

                <SocialSidebar
                    fileId={fileId || ''}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
            </div>
        </div>
    );
};