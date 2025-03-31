import React, { useState, useEffect, useRef } from "react";
import API from "./api";
import "../styles/blob.css";
import { useNavigate } from "react-router-dom";


const greetings = [
    'Hello, how can I help?',
    'Hi there, what can I do?',
    'Welcome! How can I assist?',
    'Greetings, how may I help?',
    'Good day, any assistance needed?',
    'Hello! Ready to help!',
    'Hey! How can I help you?',
    'What is your query?',
    'Welcome back, how can I help?',
    'Hello, ready for your request.',
  ];

function DisplayGreetings() {
    const [greeting] = useState(() => {
  
      const randomIndex = Math.floor(Math.random() * greetings.length);
      return greetings[randomIndex];
    });
  
  
    return <p className="text-lg text-white mt-10">{greeting}</p>;
  }

const Chatbot = ({ showChat, setShowChat }) => {
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);
    const messagesRef = useRef([]); // Store messages without triggering re-renders

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const addMessage = (msg) => {
        messagesRef.current = [...messagesRef.current, msg]; // Update messagesRef
        setMessages([...messagesRef.current]); // Update state minimally
    };

    const ai_send = (text) => addMessage({ sender: "ai", text });
    const user_send = (text) => addMessage({ sender: "user", text });

    function handle_ai_navigation(route, opt1, opt2,nav) {
        ai_send(<div className="p-2">
            <p className="text-lg font-semibold">Navigating to {route}</p>
            <div className="mt-1 flex gap-2">
              <button className="px-3 py-1 rounded-full border border-white bg-black text-white opacity-30 hover:opacity-100 transition" onClick={() => navigate(`/${nav}`)}>
                {opt1}
              </button>
              <button className="px-3 py-1 rounded-full border border-white bg-black text-white opacity-30 hover:opacity-100 transition" onClick={() => {ai_send('Navigation canceled'); ai_send('Can i help you with somthing else')}}>
                {opt2}
              </button>
            </div>
          </div>);
    }

    //function to handle intent from backend
    function handle_intent(intent) {
        const randomIndex = Math.floor(Math.random() * greetings.length);
        switch (intent) {
            case 'greeting':
                ai_send(greetings[randomIndex]);
                break;
            case 'login':
                handle_ai_navigation('Login', 'Permit', 'Forbid', 'login');
                break;
            case 'logout':
                handle_ai_navigation('Logout', 'Permit', 'Forbid', 'logout');
                break;
            case 'signup':
                handle_ai_navigation('Signup', 'Permit', 'Forbid', 'login');
                break;
            case 'profile':
                ai_send('Redirecting to Profile page');
                break;
            case 'medsim':
                ai_send('Redirecting to Medical simulator');
                break;
        }
    }

    // function to send message to backend for intent
    const sendMessage = async () => {
        if (!message.trim()) return; // Prevent sending empty messages

        try {
            user_send(message);
            const response = await API.post("/intent", { message });
            handle_intent(response.data.intent);
        } catch (error) {
            console.error("Error sending message:", error);
        }
        setMessage("");
    };

    useEffect(() => {
        window.ai_send = ai_send;
        window.user_send = user_send;
    }, []);

    if (!showChat) return null;

    return (
        <div className="fixed bottom-12 right-2 w-[450px] h-[500px] max-h-screen bg-black bg-opacity-40 text-white p-4 rounded-xl shadow-lg flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center py-2">
                <div className="flex items-center space-x-2">
                    <img src="/images/ai_logo.png" alt=" " className="w-6 h-6" />
                    <h2 className="text-lg font-semibold">AI Assist</h2>
                </div>
                <button onClick={() => setShowChat(false)} className="text-xl text-white">✖</button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-auto p-2 flex flex-col" 
            style={{ maxHeight: "calc(100% - 80px)", paddingBottom: "60px" }} 
            >
            {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="blob1 mb-10" />
                        <div className="m-10" />
                        <div className="m-10" />
                        <DisplayGreetings/>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div 
                            key={index} 
                            className={`max-w-[75%] px-2 py-1 my-1 rounded-lg break-words whitespace-pre-wrap text-sm ${
                                msg.sender === "ai" 
                                    ? "bg-black self-start ml-2 mr-auto text-left bg-opacity-30"
                                    : "bg-white self-end mr-2 ml-auto text-right text-black"
                            }`}
                        > 
                            {msg.text}
                        </div>
                    ))
                )}
                {/* Footer */}
                <div className="absolute bottom-0 left-0 w-full p-2">
                <div className="flex items-center justify-center space-x-2 w-full p-2">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1 p-1 h-8 border border-white bg-transparent text-white placeholder-white outline-none rounded-lg"
                    />
                    <button className="p-1 h-8" onClick={sendMessage}>
                        <img src="/images/send.png" alt="Send" className="w-6 h-6" />
                    </button>
                </div>
                </div>

                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export default Chatbot;
