import { TrendingUp } from "lucide-react";

export function TrendingTopics() {
    const topics = [
        { name: "Quantum Mechanics", count: 120 },
        { name: "Data Structures", count: 98 },
        { name: "Organic Chemistry", count: 85 },
        { name: "Macroeconomics", count: 72 },
        { name: "Linear Algebra", count: 65 },
    ];

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="text-pink-500" />
                <h2 className="text-xl font-semibold text-white">Trending Now</h2>
            </div>

            <div className="space-y-4">
                {topics.map((topic, i) => (
                    <div key={topic.name} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-3">
                            <span className="text-gray-500 font-mono text-sm w-4">0{i + 1}</span>
                            <span className="text-gray-300 font-medium group-hover:text-blue-400 transition-colors">
                                {topic.name}
                            </span>
                        </div>
                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">
                            {topic.count} queries
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
