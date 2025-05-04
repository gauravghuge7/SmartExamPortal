import React, { useEffect, useState } from "react";
import UserInteractions from "./UserInteractions";
import UniversityDashboardLayout from "./../../dashboard/UniversityDashboardLayout";
import { useParams } from 'react-router-dom';
import axios from "axios";
import axiosInstance from './../../../services/axiosInstance';
import ExamOverview from "./ExamOverview";
import Ranking from './Ranking';
import DashboardContain from './DashboardContain';

const ExamDashboard = () => {
    const [activeTab, setActiveTab] = useState("Dashboard");
    const examId = useParams().examId;
    const [examData, setExamData] = useState(null);

    const renderContent = () => {
        switch (activeTab) {
            case "Dashboard":
                return <DashboardContain examId={examId} />;
            case "Ranking":
                return <Ranking examId={examId} />;
            case "Overview":
                return <ExamOverview examData={examData} />;
            case "Top Results":
                return <div>Top Results content goes here...</div>;
            default:
                return <UserInteractions />;
        }
    };

    const fetchExamDetails = async () => {
        try {
            
            console.log("examId :", examId);
            const response = await axiosInstance.get(`/university/exam/getExamDetails/${examId}`);

            console.log(response);

            setExamData(response.data.data.examDetails);
            
        } 
        catch (error) {
            console.log(error);    
        }
    };

    useEffect(() => {
        fetchExamDetails()
    },[])

    return (
        <UniversityDashboardLayout sidebarOpen={true} setSidebarOpen={true}>
            {/* Top Navbar */}
            <div className="w-full bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="flex flex-wrap items-center justify-start px-4 py-2 gap-2 sm:gap-4">
                        <p
                            className={`
                                px-4 py-2 rounded-md text-3xl font-medium transition-all duration-200 
                            `}
                                >
                            {examData?.examName}
                        </p>
                    {[ "Overview", "Dashboard", "Ranking", "Top Results"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                activeTab === tab
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Dynamic Content (no outer spacing) */}
            <div className="m-0 p-0">
                {renderContent()}
            </div>
        </UniversityDashboardLayout>
    );
};

export default ExamDashboard;
