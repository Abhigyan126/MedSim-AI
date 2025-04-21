import React, { useState } from "react";
import Chatbot from "../components/chatbot";
import Sidebar from "../components/sidebar";
import "../../styles/blob.css";

// issue #44 :About us page - start
const renderPageContent = () => {
    return <p className="text-lg">This is About Us</p>;
};
// About us page -end

const AboutUs = () => {
    const [showChat, setShowChat] = useState(false);
    const [showNavbar, setShowNavbar] = useState(false);

    const handleNavbarClick = () => {
        setShowNavbar((prev) => !prev);
    };

    return (
        <div className="relative p-4">
            <h1 className="text-3xl font-bold mb-4">About Us</h1>

            {showNavbar && <Sidebar username="Guest" name="guest@example.com" />}

            <div className="p-6 bg-white rounded shadow">
                {renderPageContent()}
            </div>

            {/* Bottom Bar */}
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

            <Chatbot showChat={showChat} setShowChat={setShowChat} />
        </div>
    );
};

export default AboutUs;
