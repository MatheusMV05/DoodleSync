import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { motion } from "framer-motion";
import { User, Settings as SettingsIcon, LogOut, Shield, Palette, Bell } from "lucide-react";
import { Button } from "../components/ui/Button";

export const Settings: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const sections = [
        {
            title: "Profile",
            icon: User,
            content: (
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        {currentUser?.photoURL ? (
                            <img
                                src={currentUser.photoURL}
                                alt={currentUser.displayName || "User"}
                                className="w-16 h-16 rounded-full border-2 border-violet-500"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-xl font-bold text-white">
                                {currentUser?.displayName?.[0] || "U"}
                            </div>
                        )}
                        <div>
                            <h3 className="text-lg font-medium text-white">{currentUser?.displayName}</h3>
                            <p className="text-gray-400">{currentUser?.email}</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Appearance",
            icon: Palette,
            content: (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <div>
                            <h4 className="text-white font-medium">Theme</h4>
                            <p className="text-sm text-gray-400">Customize your interface</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={toggleTheme}
                                className={`px-3 py-1 rounded-full text-sm transition-colors ${theme === 'dark'
                                        ? 'bg-violet-600 text-white'
                                        : 'bg-gray-200 text-gray-800'
                                    }`}
                            >
                                {theme === 'dark' ? 'Dark' : 'Light'}
                            </button>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Account",
            icon: Shield,
            content: (
                <div className="space-y-4">
                    <Button
                        variant="secondary"
                        onClick={() => logout()}
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        icon={<LogOut size={18} />}
                    >
                        Sign Out
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
                <p className="text-gray-400">Manage your account and preferences</p>
            </div>

            <div className="space-y-6">
                {sections.map((section, index) => (
                    <motion.div
                        key={section.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-panel p-6 rounded-2xl"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400">
                                <section.icon size={20} />
                            </div>
                            <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                        </div>
                        {section.content}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
