import React, { useState, useEffect } from "react";
import useAuthCheck from "../components/auth_check";
import { useNavigate } from "react-router-dom";
import API from "../components/api";
import "../../styles/blob.css";
import Chatbot from "../components/chatbot";
import Sidebar from "../components/sidebar";
import BarGraph from "../components/bargraph";

const Homepage = () => {
    const [showChat, setShowChat] = useState(false);
    const [showNavbar, setShowNavbar] = useState(false);
    const navigate = useNavigate();
    const isAuthenticated = useAuthCheck();
    const [username, setUsername] = useState({ username: null, email: null });
    const [profileCompletion, setProfileCompletion] = useState(0);
    const [averageMetrics, setAverageMetrics] = useState({
        'Symptoms Relevance': 0,
        'Clinical Reasoning': 0,
        'RED flag identification': 0,
        'Prescription understanding': 0,
        'Communication style': 0,
        'Presentation Quality': 0,
        'Correctly Diagnosed': 0
    });
    const [loadingMetrics, setLoadingMetrics] = useState(true);

    useEffect(() => {
        if (isAuthenticated === false) {
            navigate("/login");
        } else if (isAuthenticated) {
            fetchUsername();
            fetchProfileCompletion();
            fetchAllReports();
        }
    }, [isAuthenticated, navigate]);

    const fetchUsername = async () => {
        try {
            const response = await API.get("/getusername");
            setUsername({ username: response.data.username, email: response.data.email });
        } catch (error) {
            console.error("Error fetching username:", error.response?.data?.message || error.message);
        }
    };

    const fetchProfileCompletion = async () => {
        try {
            const randomCompletion = Math.floor(Math.random() * 51) + 40;
            setProfileCompletion(randomCompletion);
        } catch (error) {
            console.error("Error fetching profile completion:", error);
            setProfileCompletion(0);
        }
    };

    const fetchAllReports = async () => {
        try {
            const response = await API.post("/get_reports", { action: "all" });
            calculateAverages(response.data);
        } catch (error) {
            console.error("Error fetching all reports:", error);
            setLoadingMetrics(false);
        }
    };

    const calculateAverages = (reports) => {
        if (!reports || reports.length === 0) {
            setLoadingMetrics(false);
            return;
        }
        
        const sums = {
            'Symptoms Relevance': 0,
            'Clinical Reasoning': 0,
            'RED flag identification': 0,
            'Prescription understanding': 0,
            'Communication style': 0,
            'Presentation Quality': 0,
            'Correctly Diagnosed': 0
        };
        
        let count = 0;
        reports.forEach(report => {
            Object.keys(sums).forEach(metric => {
                if (report[metric] !== undefined && !isNaN(parseInt(report[metric]))) {
                    sums[metric] += parseInt(report[metric]);
                    count++;
                }
            });
        });
        
        const averages = {};
        Object.keys(sums).forEach(metric => {
            averages[metric] = count > 0 ? Math.round(sums[metric] / (count / Object.keys(sums).length)) : 0;
            // Ensure the value is a finite number
            averages[metric] = isFinite(averages[metric]) ? averages[metric] : 0;
        });
        
        setAverageMetrics(averages);
        setLoadingMetrics(false);
    };

    const getColorForMetric = (metricKey) => {
        const colors = {
            'Symptoms Relevance': 'bg-blue-500',
            'Clinical Reasoning': 'bg-green-500',
            'RED flag identification': 'bg-red-500',
            'Prescription understanding': 'bg-purple-500',
            'Communication style': 'bg-yellow-500',
            'Presentation Quality': 'bg-pink-500',
            'Correctly Diagnosed': 'bg-indigo-500'
        };
        return colors[metricKey] || 'bg-gray-400';
    };

    const handleCompleteProfile = () => {
        navigate("/profile");
    };

    const handleNavbarClick = () => {
        setShowNavbar((prevShowNavbar) => !prevShowNavbar);
    };

    if (isAuthenticated === null) {
        return <h1>Loading...</h1>;
    }

    return (
        <div className="relative min-h-screen bg-gray-200 pb-16 overflow-x-hidden">
            {/* Main content area */}
            <div className="px-4 py-4">
                {/* Welcome Card */}
                <div className="bg-gray-900 rounded-xl shadow-md overflow-hidden p-6 mx-0 w-full mb-6">
                    <div className="flex flex-row items-center">
                        <div className="flex-1 min-w-0 pl-4 md:pl-8 lg:pl-12 xl:pl-16">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
                                Welcome back, {username.username}!
                            </h1>
                            <hr className="border-t-4 border-white mt-3 w-20 rounded-full" />
                            <div className="text-white text-xs sm:text-sm md:text-base mt-4">
                                <p>Your personalized healthcare journey starts here. Complete your profile to unlock all features.</p>
                            </div>
                        </div>
                        <div className="flex-shrink-0 pr-4 md:pr-8 lg:pr-12 xl:pr-16">
                            <img src="/images/logo.png" alt="Medical icon" className="h-20 sm:h-28 md:h-32 lg:h-36 xl:h-40 w-auto transition-all duration-300" />
                        </div>
                    </div>
                </div>

                {/* Two side-by-side cards */}
                <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-6 mb-24">
                    {/* Performance Averages Card */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 h-96">
                        {loadingMetrics ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Your Performance Averages</h3>
                                <hr className="border-t-2 border-gray-300 mb-4" />
                                
                                <div className="flex flex-col md:flex-row flex-1 gap-4">
                                    {/* Key Metrics */}
                                    <div className="w-full md:w-1/2">
                                        <h4 className="text-sm font-medium text-gray-600 mb-2">Key Metrics</h4>
                                        <div className="space-y-2">
                                            {Object.entries(averageMetrics).map(([key, value]) => (
                                                <div key={key} className="flex items-center">
                                                    <span className="text-xs font-medium text-gray-900 capitalize w-40">
                                                        {key.replace(/_/g, ' ')}:
                                                    </span>
                                                    <span className={`inline-block w-3 h-3 rounded-full ${getColorForMetric(key)} mr-2`}></span>
                                                    <span className="text-sm text-gray-800">
                                                        {value}/10
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Performance Graph */}
                                    <div className="w-full md:w-1/2">
                                        <div className="mt-1 h-64 w-full">
                                            <h4 className="text-sm font-medium text-gray-600 mb1">Performance Overview</h4>
                                            <BarGraph 
                                                data={averageMetrics} 
                                                bgColor="#f3f4f6"
                                                axisColor="#6b7280"
                                                gridColor="#e5e7eb"
                                                textColor="#374151"
                                                colors={[
                                                    '#3b82f6', // blue-500
                                                    '#10b981', // emerald-500
                                                    '#ef4444', // red-500
                                                    '#8b5cf6', // violet-500
                                                    '#eab308', // yellow-500
                                                    '#ec4899', // pink-500
                                                    '#6366f1'  // indigo-500
                                                ]}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Empty Card 2 */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 h-96">
                        <div className="h-full flex items-center justify-center">
                            <p className="text-gray-400">Empty Card Space</p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Sidebar */}
            {showNavbar && (
                <div className="fixed inset-0 z-40">
                    <Sidebar username={username.username} name={username.email} />
                </div>
            )}

            {/* Footer */}
            <footer className="fixed bottom-10 left-0 w-full bg-white py-4 h-16 border-t border-gray-200 z-20">
                <div className="container mx-auto h-full flex justify-center items-center px-4">
                    <div className="flex items-center">
                        <div className="mr-1">
                            <img src="/images/logo.png" alt="MedSim-AI Logo" width="60" height="60" className="object-contain" />
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="text-gray-700 text-xs mb-1">
                                © Copyright 2025 MedSim-AI25
                            </div>
                            <div className="flex space-x-3">
                                <i className="fa-brands fa-twitter text-gray-600 hover:text-blue-400"></i>
                                <i className="fa-brands fa-facebook-f text-gray-600 hover:text-blue-600"></i>
                                <i className="fa-brands fa-instagram text-gray-600 hover:text-pink-500"></i>
                                <i className="fa-solid fa-envelope text-gray-600 hover:text-red-500"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Compact CTA */}
            <div className="fixed bottom-24 left-0 right-0 bg-gray-700 text-white py-2 h-18 z-30">
                <div className="container mx-auto text-center">
                    <p className="text-gray-300 mb-1 text-sm">Check out our app</p>
                    <div className="flex justify-center space-x-2">
                        <button type="button" className="px-2 py-1 bg-white text-gray-900 border border-gray-900 hover:bg-blue-500 hover:text-white hover:border-white rounded-lg transition flex items-center text-sm">
                            <i className="fa-brands fa-apple mr-1"></i>
                            Install
                        </button>
                        <button type="button" className="px-2 py-1 border border-white hover:bg-green-500 hover:text-gray-900 hover:border-gray-900 rounded-lg transition flex items-center text-sm">
                            <i className="fa-brands fa-android mr-1"></i>
                            Install
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Nav with Burger and Chatbot Button */}
            <div className="fixed bottom-0 left-0 w-full bg-gray-900 text-white py-2 shadow-md flex justify-between items-center z-40">
                <div className="ml-4">
                    <button onClick={handleNavbarClick}>
                        <div className="burger-icon">
                            <div className="bar1"></div>
                            <div className="bar2"></div>
                            <div className="bar3"></div>
                        </div>
                    </button>
                </div>
                <div className="mr-4">
                    <button
                        className="px-6 border-2 border-white hover:bg-gray-700 transition-colors"
                        onClick={() => setShowChat(!showChat)}
                    >
                        Chat Bot
                    </button>
                </div>
            </div>

            {/* Chatbot */}
            <div className="fixed inset-0 flex items-end justify-end p-4 z-50 pointer-events-none">
                {showChat && (
                    <div className="pointer-events-auto">
                        <Chatbot showChat={showChat} setShowChat={setShowChat} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Homepage;