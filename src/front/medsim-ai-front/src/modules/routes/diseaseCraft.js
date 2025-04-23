import React, { useState, useEffect } from "react";
import useAuthCheck from "../components/auth_check";
import { useNavigate } from "react-router-dom";
import API from "../components/api";
import "../../styles/blob.css";
import Chatbot from "../components/chatbot";
import Sidebar from "../components/sidebar";
import MedicalEmbeddings from "../components/drawDiseaseCraft";

const DiseaseCraft = () => {
    const [showChat, setShowChat] = useState(false);
    const [showNavbar, setShowNavbar] = useState(false);
    const navigate = useNavigate();
    const isAuthenticated = useAuthCheck();
    const [username, setUsername] = useState({ username: null, email: null });

    useEffect(() => {
        if (isAuthenticated === false) {
            navigate("/login");
        } else if (isAuthenticated) {
            fetchUsername();
        }
    }, [isAuthenticated, navigate]);

    const fetchUsername = async () => {
        try {
            const response = await API.get("/getusername");
            setUsername({
                username: response.data.username,
                email: response.data.email,
            });
        } catch (error) {
            console.error(
                "Error fetching username:",
                error.response?.data?.message || error.message
            );
        }
    };

    if (isAuthenticated === null) {
        return <h1>Loading...</h1>;
    }

    const handleNavbarClick = () => {
        setShowNavbar((prevShowNavbar) => !prevShowNavbar);
    };

    return (
        <div className="relative">
            <MedicalEmbeddings />

            {showNavbar && (
                <Sidebar username={username.username} name={username.email} />
            )}

            {/* Fixed Chatbot Button */}
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

            {/* Chatbot Popup */}
            <Chatbot showChat={showChat} setShowChat={setShowChat} />
        </div>
    );
};

export default DiseaseCraft;
