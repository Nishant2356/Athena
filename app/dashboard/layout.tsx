import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 overflow-y-auto bg-gradient-to-br from-gray-900 to-black">
                {children}
            </main>
        </div>
    );
}
