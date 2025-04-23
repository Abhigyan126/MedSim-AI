import React, { useState, useEffect } from "react";
import useAuthCheck from "../components/auth_check";
import { useNavigate } from "react-router-dom";
import API from "../components/api";
import "../../styles/blob.css";
import Chatbot from "../components/chatbot";
import Sidebar from "../components/sidebar";
import BarGraph from "../components/bargraph";

const Profile = () => {
    const [showChat, setShowChat] = useState(false);
    const [showNavbar, setShowNavbar] = useState(false);
    const [reports, setReports] = useState([]);
    const [userData, setUserData] = useState({ 
        username: "", 
        email: "",
        lastActive: new Date().toISOString() 
    });
    const [reportStats, setReportStats] = useState({
        totalReports: 0,
        lastUpdated: null,
        averageDataPoints: 0
    });
    const [expandedReports, setExpandedReports] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const reportsPerPage = 4;

    const navigate = useNavigate();
    const isAuthenticated = useAuthCheck();

    useEffect(() => {
        if (isAuthenticated === false) {
            navigate("/login");
        } else if (isAuthenticated) {
            fetchUserData();
            fetchAllReports();
        }
    }, [isAuthenticated, navigate]);

    const toggleReport = (reportId) => {
        setExpandedReports(prev => ({
            ...prev,
            [reportId]: !prev[reportId]
        }));
    };

    const fetchUserData = async () => {
        try {
            const response = await API.get("/getusername");
            setUserData({ 
                username: response.data.username, 
                email: response.data.email,
                lastActive: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    const fetchAllReports = async () => {
        try {
            const response = await API.post("/get_reports", { action: "all" });
            const sortedReports = response.data.sort((a, b) => 
                new Date(b.timestamp?.$date) - new Date(a.timestamp?.$date)
            );
            setReports(sortedReports);
            calculateReportStats(sortedReports);
            
            const initialExpandedState = {};
            sortedReports.forEach(report => {
                initialExpandedState[report._id?.$oid || `report-${report.timestamp}`] = false;
            });
            setExpandedReports(initialExpandedState);
        } catch (error) {
            console.error("Error fetching all reports:", error);
        }
    };

    const calculateReportStats = (reports) => {
        if (reports.length === 0) {
            setReportStats({
                totalReports: 0,
                lastUpdated: null,
                averageDataPoints: 0
            });
            return;
        }

        const totalDataPoints = reports.reduce((sum, report) => {
            return sum + Object.keys(report).filter(key => !['_id', 'timestamp'].includes(key)).length;
        }, 0);

        setReportStats({
            totalReports: reports.length,
            lastUpdated: reports[0].timestamp,
            averageDataPoints: Math.round(totalDataPoints / reports.length)
        });
    };

    const formatDateTime = (timestampObj) => {
        if (!timestampObj || !timestampObj.$date) return (
            <div className="text-right">
                <div>No date available</div>
            </div>
        );
        
        try {
            const date = new Date(timestampObj.$date);
            const formattedDate = date.toISOString().split('T')[0];
            const hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = hours % 12 || 12;
            
            return (
                <div className="text-right">
                    <div>{formattedDate}</div>
                    <div className="text-xs text-gray-500">
                        {formattedHours}:{minutes} {ampm}
                    </div>
                </div>
            );
        } catch (error) {
            console.error("Error formatting date:", error);
            return (
                <div className="text-right">
                    <div>Invalid date</div>
                </div>
            );
        }
    };

    const formatDate = (timestampObj) => {
        if (!timestampObj || !timestampObj.$date) return "No date available";
        try {
            return timestampObj.$date.split('T')[0];
        } catch (error) {
            console.error("Error formatting date:", error);
            return "Invalid date";
        }
    };

    const formatLastActive = (isoString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(isoString).toLocaleDateString(undefined, options);
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

    const renderBarChart = (report) => {
        const metricsData = {
            'Symptoms Relevance': parseInt(report['Symptoms Relevance'] || 0),
            'Clinical Reasoning': parseInt(report['Clinical Reasoning'] || 0),
            'RED flag': parseInt(report['RED flag identification'] || 0),
            'Prescription': parseInt(report['Prescription understanding'] || 0),
            'Communication': parseInt(report['Communication style'] || 0),
            'Presentation': parseInt(report['Presentation Quality'] || 0),
            'Diagnosis': parseInt(report['Correctly Diagnosed'] || 0)
        };
    
        // Validate all values are finite numbers
        Object.keys(metricsData).forEach(key => {
            if (!Number.isFinite(metricsData[key])) {
                metricsData[key] = 0;
            }
        });
    
        const customColors = [
            '#3b82f6', // blue-500
            '#10b981', // emerald-500
            '#ef4444', // red-500
            '#8b5cf6', // violet-500
            '#eab308', // yellow-500
            '#ec4899', // pink-500
            '#6366f1'  // indigo-500
        ];
    
        return (
            <div className="mt-4 h-64 w-full">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Performance Metrics</h4>
                <BarGraph 
                    data={metricsData} 
                    bgColor="#f3f4f6"
                    axisColor="#6b7280"
                    gridColor="#e5e7eb"
                    textColor="#374151"
                    colors={customColors}
                />
            </div>
        );
    };

    const indexOfLastReport = currentPage * reportsPerPage;
    const indexOfFirstReport = indexOfLastReport - reportsPerPage;
    const currentReports = reports.slice(indexOfFirstReport, indexOfLastReport);
    const totalPages = Math.ceil(reports.length / reportsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (isAuthenticated === null) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-gray-200 p-4 pb-32">
            {/* Sidebar with z-40 */}
            {showNavbar && (
                <div className="fixed inset-0 z-40">
                    <Sidebar username={userData.username} name={userData.email} />
                </div>
            )}

            {/* Main content with z-30 */}
            <div className={`max-w-4xl mx-auto relative z-30 ${showNavbar ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* Overview Section */}
                <div className="bg-white rounded-lg shadow mb-6 p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Overview</h2>
                    <hr className="border-t-4 border-gray-900 mb-2 w-20 rounded-full" />
                                        
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Activity Card */}
                        <div className="bg-gray-300 p-5 rounded-lg">
                            <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium">Last active</p>
                                        <p className="text-sm text-gray-500">{formatLastActive(userData.lastActive)}</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="bg-green-100 p-2 rounded-full mr-3">
                                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium">Account status</p>
                                        <p className="text-sm text-gray-500">Active</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reports Summary Card */}
                        <div className="bg-gray-300 p-5 rounded-lg">
                            <h3 className="font-bold text-lg mb-4">Reports Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Reports</span>
                                    <span className="font-medium">{reportStats.totalReports}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Latest Report</span>
                                    <span className="font-medium">
                                        {reportStats.lastUpdated 
                                            ? formatDate(reportStats.lastUpdated)
                                            : "No reports yet"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Avg Data Points</span>
                                    <span className="font-medium">{reportStats.averageDataPoints}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-t-2 my-4 border-gray-400 rounded-full" />

                {/* Reports Section */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Reports</h2>
                    <hr className="border-t-4 border-gray-900 mb-4 w-20 rounded-full" />

                    {reports.length > 0 ? (
                        <div className="space-y-3">
                            {currentReports.map((report, index) => {
                                const globalIndex = indexOfFirstReport + index;
                                const reportId = report._id?.$oid || `report-${globalIndex + 1}`;
                                const isExpanded = expandedReports[reportId];
                                
                                return (
                                    <div key={reportId} className="bg-gray-300 rounded-lg overflow-hidden">
                                        <div 
                                            className="p-3 flex justify-between items-center cursor-pointer"
                                            onClick={() => toggleReport(reportId)}
                                        >
                                            <div>
                                                <h3 className="font-bold">Report {globalIndex + 1}</h3>
                                                <p className="text-sm text-gray-600">ID: {reportId}</p>
                                            </div>
                                            <div className="flex items-center">
                                                {formatDateTime(report.timestamp)}
                                                <svg 
                                                    className={`w-5 h-5 ml-2 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path 
                                                        strokeLinecap="round" 
                                                        strokeLinejoin="round" 
                                                        strokeWidth={2} 
                                                        d="M19 9l-7 7-7-7" 
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                        
                                        {isExpanded && (
                                            <div className="bg-gray-100 p-4 border-t border-gray-400">
                                                <div className="flex flex-col md:flex-row gap-4">
                                                    {/* Key Metrics - now takes full width on mobile, half on larger screens */}
                                                    <div className="w-full md:w-1/2">
                                                        <h4 className="text-sm font-medium text-gray-600 mb-2">Key Metrics</h4>
                                                        <div className="space-y-2">
                                                            {Object.entries(report)
                                                                .filter(([key]) => [
                                                                    'Symptoms Relevance',
                                                                    'Clinical Reasoning',
                                                                    'RED flag identification',
                                                                    'Prescription understanding',
                                                                    'Communication style',
                                                                    'Presentation Quality',
                                                                    'Correctly Diagnosed'
                                                                ].includes(key))
                                                                .map(([key, value]) => (
                                                                    <div key={key} className="flex items-center">
                                                                        <span className="text-sm font-medium text-gray-600 capitalize w-48">
                                                                            {key.replace(/_/g, ' ')}:
                                                                        </span>
                                                                        <span className={`inline-block w-3 h-3 rounded-full ${getColorForMetric(key)} mr-2`}></span>
                                                                        <span className="text-sm text-gray-800">
                                                                            {value}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Performance Metrics - now takes full width on mobile, half on larger screens */}
                                                    <div className="w-full md:w-1/2">
                                                        {renderBarChart(report)}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Pagination */}
                            {reports.length > reportsPerPage && (
                                <div className="flex justify-between items-center mt-4">
                                    <button
                                        onClick={() => paginate(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`px-4 py-2 rounded-md ${currentPage === 1 ? 'bg-gray-200 text-gray-700 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-800'}`}
                                    >
                                        Previous
                                    </button>
                                    
                                    <span className="text-gray-700">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    
                                    <button
                                        onClick={() => paginate(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`px-4 py-2 rounded-md ${currentPage === totalPages ? 'bg-gray-200 text-gray-700 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-800'}`}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-8 rounded-lg text-center">
                            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="mt-2 text-lg font-medium text-gray-900">No reports found</h3>
                            <p className="mt-1 text-gray-500">Your reports will appear here once generated.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Compact CTA positioned just above footer */}
            <div className="fixed bottom-11 left-0 right-0 bg-gray-700 text-white py-2 h-18 z-30">
                <div className="container mx-auto text-center">
                    <p className="text-gray-300 mb-1 text-sm">Check out our app</p>
                    <div className="flex justify-center space-x-2">
                        <button 
                            type="button" 
                            className="px-2 py-1 bg-white text-gray-900 border border-gray-900 hover:bg-blue-500 hover:text-white hover:border-white rounded-lg transition flex items-center text-sm"
                        >
                            <i className="fa-brands fa-apple mr-1"></i>
                            Install
                        </button>
                        <button 
                            type="button" 
                            className="px-2 py-1 border border-white hover:bg-green-500 hover:text-gray-900 hover:border-gray-900 rounded-lg transition flex items-center text-sm"
                        >
                            <i className="fa-brands fa-android mr-1"></i>
                            Install
                        </button>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-gray-900 text-white py-2 shadow-md flex justify-between items-center z-40">
                <div className="ml-4">
                    <button onClick={() => setShowNavbar(!showNavbar)}>
                        <div className="burger-icon">
                            <div className="bar1"></div>
                            <div className="bar2"></div>
                            <div className="bar3"></div>
                        </div>
                    </button>
                </div>
                <div className="mr-4">
                    <button
                        className="px-6 border-2 border-white"
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

export default Profile;