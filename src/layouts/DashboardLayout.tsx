import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Folder, Clock, Users, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import clsx from "clsx";

export const DashboardLayout: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
                        <span className="text-3xl">✎</span> DoodleSync
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <NavLink
                        to="/dashboard"
                        end
                        className={({ isActive }) =>
                            clsx(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                isActive
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "text-gray-700 hover:bg-gray-100"
                            )
                        }
                    >
                        <Folder size={20} />
                        My Files
                    </NavLink>

                    <NavLink
                        to="/dashboard/shared"
                        className={({ isActive }) =>
                            clsx(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                isActive
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "text-gray-700 hover:bg-gray-100"
                            )
                        }
                    >
                        <Users size={20} />
                        Shared with me
                    </NavLink>

                    <NavLink
                        to="/dashboard/recent"
                        className={({ isActive }) =>
                            clsx(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                isActive
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "text-gray-700 hover:bg-gray-100"
                            )
                        }
                    >
                        <Clock size={20} />
                        Recent
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <img
                            src={currentUser?.photoURL || "https://via.placeholder.com/40"}
                            alt="Profile"
                            className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {currentUser?.displayName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {currentUser?.email}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
