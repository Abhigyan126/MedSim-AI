import React, { useState, useEffect } from "react";
import useAuthCheck from "./auth_check";
import { useNavigate } from "react-router-dom";
import API from "./api";
import "../styles/blob.css";
import Chatbot from "./chatbot";

function Nav() {
    return({
        
    });
}

const Home = () => {
    const [showChat, setShowChat] = useState(false);
    const [showNavbar, setShowNavbar] = useState(false);
    const navigate = useNavigate();
    const isAuthenticated = useAuthCheck();
    const [username, setUsername] = useState("");

    useEffect(() => {
        if (isAuthenticated === false) {
            navigate("/login");
        } else if (isAuthenticated) {
            fetchUsername();
        }
    }, [isAuthenticated, navigate]); // Runs when auth status changes

    const fetchUsername = async () => {
        try {
            const response = await API.get("/getusername");
            setUsername(response.data.username);
        } catch (error) {
            console.error("Error fetching username:", error.response?.data?.message || error.message);
        }
    };

    if (isAuthenticated === null) {
        return <h1>Loading...</h1>; // Show loading state while checking auth
    }

    const handleNavbarClick = () => {
        setShowNavbar((prevShowNavbar) => !prevShowNavbar); // Toggle showNavbar
      };

    return (
        <div className="relative">
            <h1>Welcome, {username}!</h1>
            {showNavbar && <Nav />} {/* Conditionally render the <p> tag */}

            {/* Fixed Chatbot Button */}
            <div className="fixed bottom-0 left-0 w-full bg-gray-900 text-white py-2 shadow-md flex justify-between items-center">
            <div className="ml-4"> {/* Added left margin */}
                <button onClick={handleNavbarClick}>
                <div className="burger-icon">
                <div className="bar1"></div>
                <div className="bar2"></div>
                <div className="bar3"></div>
                </div>

                </button>
            </div>
            <div className="mr-4"> {/* Added right margin */}
                <button
                className="px-6 border-2 border-white"
                onClick={() => setShowChat(!showChat)}
                >
                Chat Bot
                </button>
            </div>
            </div>

            {/* Chatbot Popup */}
            <Chatbot showChat={showChat} setShowChat={setShowChat}/>

        </div>
    );
};

export default Home;
