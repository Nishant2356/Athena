"use client";

import { Home, Library, MessageSquare, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Knowledge Vault", href: "/dashboard/vault", icon: Library },
    { label: "AI Tutor", href: "/dashboard/chat", icon: MessageSquare },
];

interface SidebarProps {
    onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="w-full h-full border-r border-[#D9C8AA] bg-[#FAECCB] flex flex-col p-4 text-gray-800">
            <div className="mb-2 w-full flex justify-start relative">
                <div className="w-50 h-50 relative -ml-1 -mt-4">
                    <Image
                        src="/assets/logo_transparent.png"
                        alt="Athena Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
            </div>

            <nav className="flex-1 space-y-2 px-1">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 border",
                                isActive
                                    ? "bg-[#EEDBA5] shadow-sm border-[#D9C8AA] text-gray-900 font-bold"
                                    : "border-transparent text-gray-600 hover:bg-[#F0DEB4] hover:text-gray-900 font-medium"
                            )}
                        >
                            <item.icon size={20} className={isActive ? "text-gray-800" : "text-gray-500"} />
                            <span className="text-sm">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-[#D9C8AA] pt-4 mt-auto">
                <button className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:text-red-500 hover:bg-white/40 rounded-xl transition-colors font-medium">
                    <LogOut size={20} />
                    <span className="text-sm">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
