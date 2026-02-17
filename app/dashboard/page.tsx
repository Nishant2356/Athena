import { TrendingTopics } from "@/components/TrendingTopics";
import { MessageSquare, FileText, Zap } from "lucide-react";

export default function DashboardPage() {
    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white">Welcome back, Scholar.</h1>
                <p className="text-gray-400">Your second brain is ready.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Documents</h3>
                            <p className="text-2xl font-bold text-blue-400">12</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-400">Uploaded this semester</p>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Chat Sessions</h3>
                            <p className="text-2xl font-bold text-purple-400">48</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-400">Last active: 2 mins ago</p>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Focus Score</h3>
                            <p className="text-2xl font-bold text-amber-400">85%</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-400">Top 10% of class</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[300px] flex items-center justify-center text-gray-500">
                        Activity Feed Graph Placeholder
                    </div>
                </div>
                <div>
                    <TrendingTopics />
                </div>
            </div>
        </div>
    );
}
