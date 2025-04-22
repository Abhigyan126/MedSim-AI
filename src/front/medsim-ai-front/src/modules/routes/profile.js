import React, { useState, useEffect } from "react";
import useAuthCheck from "../components/auth_check";
import { useNavigate } from "react-router-dom";
import API from "../components/api";
import "../../styles/blob.css";
import Chatbot from "../components/chatbot";
import Sidebar from "../components/sidebar";

const Profile = () => {
    const [showChat, setShowChat] = useState(false);
    const [showNavbar, setShowNavbar] = useState(false);
    const [showAllReports, setShowAllReports] = useState(false); // toggle view all reports
    const [reportData, setReportData] = useState([]);
    const [username, setUsername] = useState({ username: null, email: null });

    const navigate = useNavigate();
    const isAuthenticated = useAuthCheck();

    useEffect(() => {
        if (isAuthenticated === false) {
            navigate("/login");
        } else if (isAuthenticated) {
            fetchUsername();
            fetchReport("latest");
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

    const fetchReport = async (action) => {
        try {
            const response = await API.post("/get_reports", { action });
            const data = response.data;
            setReportData(action === "latest" ? [data] : data);
        } catch (error) {
            console.error("Error fetching report:", error.response?.data?.message || error.message);
        }
    };

    const handleNavbarClick = () => {
        setShowNavbar((prev) => !prev);
    };

    const toggleReportView = () => {
        const nextAction = showAllReports ? "latest" : "all";
        fetchReport(nextAction);
        setShowAllReports(!showAllReports);
    };

    if (isAuthenticated === null) {
        return <h1>Loading...</h1>;
    }

    return (
        <div className="relative p-4">
            <h1 className="text-2xl font-bold mb-4">Welcome, {username.username}!</h1>

            {showNavbar && <Sidebar username={username.username} name={username.email} />}

            {/* Report Toggle */}
            <div className="mb-4">
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    onClick={toggleReportView}
                >
                    {showAllReports ? "Show Latest Report" : "Show All Reports"}
                </button>
            </div>

            {/* Report Display */}
            <div className="space-y-4">
                {reportData.map((report, index) => (
                    <div key={index} className="p-4 border rounded shadow bg-white">
                        <h2 className="font-semibold">Report {index + 1}</h2>
                        <pre className="whitespace-pre-wrap text-sm">
                            {JSON.stringify(report, null, 2)}
                        </pre>
                    </div>
                ))}
            </div>

            {/* Fixed Bottom Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-gray-900 text-white py-2 shadow-md flex justify-between items-center">
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
                        className="px-6 border-2 border-white"
                        onClick={() => setShowChat(!showChat)}
                    >
                        Chat Bot
                    </button>
                </div>
            </div>

            {/* Chatbot */}
            <Chatbot showChat={showChat} setShowChat={setShowChat} />
        </div>
    );
};

export default Profile;
