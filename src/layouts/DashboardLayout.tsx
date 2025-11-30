import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
    LayoutGrid,
    Clock,
    Star,
    Trash2,
    LogOut,
    Settings,
    Menu,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

export const DashboardLayout: React.FC = () => {
    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const menuItems = [
        { icon: LayoutGrid, label: "All Drawings", path: "/dashboard" },
        { icon: Clock, label: "Recent", path: "/dashboard/recent" },
        { icon: Star, label: "Favorites", path: "/dashboard/favorites" },
        { icon: Trash2, label: "Trash", path: "/dashboard/trash" },
    ];

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full p-4">
            <div className="flex items-center gap-3 px-2 mb-8 mt-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <span className="text-white font-bold text-lg">D</span>
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    DoodleSync
                </span>
            </div>

            <nav className="flex-1 space-y-1">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => {
                                navigate(item.path);
                                setIsMobileMenuOpen(false);
                            }}
                            className={clsx(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                                isActive
                                    ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <item.icon size={20} className={clsx(
                                "transition-colors",
                                isActive ? "text-violet-400" : "text-gray-500 group-hover:text-white"
                            )} />
                            <span className="font-medium">{item.label}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute left-0 w-1 h-6 bg-violet-500 rounded-r-full"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                />
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className="pt-4 mt-4 border-t border-white/5 space-y-1">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                    <Settings size={20} />
                    <span className="font-medium">Settings</span>
                </button>

                <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-xl bg-white/5 border border-white/5">
                    <img
                        src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.email}&background=random`}
                        alt="Profile"
                        className="w-8 h-8 rounded-lg border border-white/10"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {currentUser?.displayName || "User"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            {currentUser?.email}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 border-r border-white/5 bg-surface/30 backdrop-blur-xl fixed h-full z-20">
                <SidebarContent />
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full h-16 bg-surface/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                        <span className="text-white font-bold">D</span>
                    </div>
                    <span className="font-bold text-white">DoodleSync</span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-gray-400 hover:text-white"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-64 bg-surface border-r border-white/10 z-50 md:hidden"
                        >
                            <SidebarContent />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 min-h-screen pt-16 md:pt-0">
                <div className="p-6 md:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
