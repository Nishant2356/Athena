"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Bell, HelpCircle, Menu, User } from "lucide-react";

interface DashboardShellProps {
    children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-[#FDF5E6] text-gray-900 overflow-hidden font-sans">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#FAECCB] border-b border-[#D9C8AA] z-40 flex items-center px-4 justify-between shadow-sm">
                <span className="font-bold text-lg text-[#B88B4A]">
                    Athena
                </span>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-gray-600 hover:text-gray-900"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out shadow-lg
                md:relative md:translate-x-0 md:shadow-none
                ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            `}>
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <main className="flex-1 w-full flex flex-col md:ml-0 pt-16 md:pt-0 overflow-hidden bg-[#FDF5E6]">
                {/* Top Desktop Header */}
                <header className="hidden md:flex h-16 items-center justify-between px-8 border-b border-[#D9C8AA] bg-[#FAECCB]">
                    <h2 className="text-xl font-bold text-gray-800 tracking-tight">Study Nook</h2>
                    <div className="flex items-center gap-4 text-gray-600">
                        <button className="p-2 hover:bg-white/40 rounded-full transition-colors">
                            <HelpCircle size={20} />
                        </button>
                        <button className="p-2 hover:bg-white/40 rounded-full transition-colors relative">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                        <button className="p-1 ml-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors">
                            <User size={24} />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto w-full h-full box-border relative">
                    <div className="absolute inset-x-2 inset-y-2 md:inset-x-6 md:inset-y-6">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
