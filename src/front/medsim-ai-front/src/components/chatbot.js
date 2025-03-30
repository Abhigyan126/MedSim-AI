import React, { useState, useEffect, useRef } from "react";
import "../styles/blob.css";

function DisplayGreetings() {
    const [greeting] = useState(() => {
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
  
      const randomIndex = Math.floor(Math.random() * greetings.length);
      return greetings[randomIndex];
    });
  
  
    return <p className="text-lg text-white mt-10">{greeting}</p>;
  }

const Chatbot = ({ showChat, setShowChat }) => {
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
            <div className="flex-1 overflow-auto p-2 flex flex-col" style={{ maxHeight: "calc(100vh - 80px)" }}>
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="blob1 mb-10" />
                        <div className="m-10" />
                        <div className="m-4" />
                        <DisplayGreetings/>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div 
                            key={index} 
                            className={`max-w-[75%] p-2 my-2 rounded-lg break-words whitespace-pre-wrap text-lg ${
                                msg.sender === "ai" 
                                    ? "bg-black self-start ml-2 mr-auto text-left bg-opacity-50"
                                    : "bg-white self-end mr-2 ml-auto text-right text-black bg-opacity-50"
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
                        className="flex-1 p-1 h-8 border border-white bg-transparent text-white placeholder-white outline-none rounded-lg"
                    />
                    <button className="p-1 h-8">
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
