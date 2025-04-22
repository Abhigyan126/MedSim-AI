import React, { useState, useEffect } from "react";
import useAuthCheck from "../components/auth_check";
import { useNavigate } from "react-router-dom";
import API from "../components/api";
import "../../styles/blob.css";
import Chatbot from "../components/chatbot";
import Sidebar from "../components/sidebar";

const Homepage = () => {
    const [showChat, setShowChat] = useState(false);
    const [showNavbar, setShowNavbar] = useState(false);
    const navigate = useNavigate();
    const isAuthenticated = useAuthCheck();
    const [username, setUsername] = useState({username: null, email: null});
    const [profileCompletion, setProfileCompletion] = useState(0);

    useEffect(() => {
        if (isAuthenticated === false) {
            navigate("/login");
        } else if (isAuthenticated) {
            fetchUsername();
            fetchProfileCompletion();
        }
    }, [isAuthenticated, navigate]);

    const fetchUsername = async () => {
        try {
            const response = await API.get("/getusername");
            setUsername({username: response.data.username, email: response.data.email});
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

    const handleCompleteProfile = () => {
        navigate("/profile");
    };

    if (isAuthenticated === null) {
        return <h1>Loading...</h1>;
    }

    const handleNavbarClick = () => {
        setShowNavbar((prevShowNavbar) => !prevShowNavbar);
    };

    return (
        <div className="relative min-h-screen bg-gray-200 pb-16 overflow-x-hidden">
            {/* Main content area with small margins */}
            <div className="px-4 py-4 pb-32 mt-4">
                {/* Welcome Card */}
                <div className="bg-gray-900 rounded-xl shadow-md overflow-hidden p-6 mx-0 w-full">
                    <div className="flex flex-row items-center">
                        {/* Text content*/}
                        <div className="flex-1 min-w-0 pl-4 md:pl-8 lg:pl-12 xl:pl-16">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
                                Welcome back, {username.username}!
                            </h1>
                            <hr className="border-t-4 border-white mt-3 w-20 rounded-full" />
                            <div className="text-white text-xs sm:text-sm md:text-base mt-4">
                                <p>Your personalized healthcare journey starts here. Complete your profile to unlock all features.</p>
                            </div>
                        </div>
                        {/* Logo */}
                        <div className="flex-shrink-0 pr-4 md:pr-8 lg:pr-12 xl:pr-16">
                            <img 
                                src="/images/logo.png" 
                                alt="Medical icon"
                                className="h-20 sm:h-28 md:h-32 lg:h-36 xl:h-40 w-auto transition-all duration-300"
                            />
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
                            <img 
                                src="/images/logo.png" 
                                alt="MedSim-AI Logo" 
                                width="60" 
                                height="60" 
                                className="object-contain"
                            />
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

            {/* Compact CTA positioned just above footer */}
            <div className="fixed bottom-24 left-0 right-0 bg-gray-700 text-white py-2 h-18 z-30">
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

            <div className="fixed bottom-0 left-0 w-full bg-gray-900 text-white py-2 shadow-md flex justify-between items-center z-50">
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

            <Chatbot showChat={showChat} setShowChat={setShowChat}/>
        </div>
    );
};

export default Homepage;