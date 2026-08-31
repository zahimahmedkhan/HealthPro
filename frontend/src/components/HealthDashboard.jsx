import React from "react";
import {
  FileTextOutlined,
  HeartOutlined,
  RobotOutlined,
  LineChartOutlined,
} from "@ant-design/icons";

export const HealthDashboard = () => {
  const stats = [
    {
      title: "Health Records",
      value: "12",
      icon: FileTextOutlined,
      description: "Recent reports",
      color: "text-blue-600",
    },
    {
      title: "Vital Signs",
      value: "Normal",
      icon: HeartOutlined,
      description: "All within range",
      color: "text-green-600",
    },
    {
      title: "AI Insights",
      value: "3",
      icon: RobotOutlined,
      description: "New recommendations",
      color: "text-teal-600",
    },
    {
      title: "Activity",
      value: "Active",
      icon: LineChartOutlined,
      description: "Last updated today",
      color: "text-blue-600",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div 
            key={`stat-${stat.title}-${index}`} 
            className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl p-6 shadow-lg border border-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-500 hover:scale-105 group relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-blue-100 rounded-full opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                {stat.title}
              </h3>
              <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Icon className={`text-xl ${stat.color}`} />
              </div>
            </div>
            
            {/* Content */}
            <div className="mb-2">
              <div className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <p className="text-xs text-gray-500 font-medium mt-2">
                {stat.description}
              </p>
            </div>

            {/* Subtle hover effect */}
            <div className="absolute inset-0 border-2 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 -z-10"></div>
          </div>
        );
      })}
    </div>
  );
};