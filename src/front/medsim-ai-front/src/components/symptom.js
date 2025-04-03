import React, { useState, useEffect } from "react";
import useAuthCheck from "./auth_check";
import { useNavigate } from "react-router-dom";
import API from "./api";
import "../styles/blob.css";
import Chatbot from "./chatbot";
import Sidebar from "./sidebar";



const partsData = [
    { name: "Head", condition: "Normal", x: 13, y: 10, lineStartX: 135, lineStartY: 13 },
    { name: "Heart", condition: "Critical", x: 90, y: 100, lineStartX: 110, lineStartY: 130 },
    { name: "Liver", condition: "Warning", x: 120, y: 150, lineStartX: 140, lineStartY: 180 }
];

const getColor = (condition) => {
    switch (condition) {
        case "Normal": return "bg-green-500";
        case "Warning": return "bg-yellow-500";
        case "Critical": return "bg-red-500";
        default: return "bg-gray-500";
    }
};

function Setupdiagram() {
    return (
        <div className="relative w-[300px] h-[400px]">
            {/* Background SVG */}
            <img src="images/body_diagram.svg" alt="Diagram" className="w-full h-full" />

            {/* SVG for Lines */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {partsData.map((part, index) => (
                    <line key={index}
                          x1={part.lineStartX} y1={part.lineStartY} 
                          x2={part.x + 10} y2={part.y + 10}
                          stroke="black" strokeWidth="2" />
                ))}
            </svg>

            {/* Dynamic Labels */}
            {partsData.map((part, index) => (
                <div key={index} 
                     className={`absolute ${getColor(part.condition)} text-white text-xs font-bold px-2 py-1 rounded`}
                     style={{ top: part.y, left: part.x }}>
                    {part.name}
                </div>
            ))}
        </div>
    );
}

//Simulator code below 

const Simulator = () => {
    const [showChat, setShowChat] = useState(false);
    const [showNavbar, setShowNavbar] = useState(false);
    const navigate = useNavigate();
    const isAuthenticated = useAuthCheck();
    const [username, setUsername] = useState({username: null, email: null});

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
            setUsername({username: response.data.username, email: response.data.email});
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
            {/* Website content */}
            <Setupdiagram />
            <h1>This is your symptom Simulator</h1>
            

            {/* Bottom Bar */}
            {showNavbar && <Sidebar username={username.username} name={username.email} />} {/* Conditionally render the <p> tag */}

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

export default Simulator;
