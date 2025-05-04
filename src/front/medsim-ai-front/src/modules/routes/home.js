import React, { useState, useEffect } from "react";
import useAuthCheck from "../components/auth_check";
import { useNavigate } from "react-router-dom";
import API from "../components/api";
import "../../styles/blob.css";
import Chatbot from "../components/chatbot";
import Sidebar from "../components/sidebar";
import BarGraph from "../components/bargraph";
import { HelpCircle, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const PerformanceMetricsCard = ({ averageMetrics }) => {
  const getColorForMetric = (key) => {
    const colors = {
      accuracy: "bg-blue-500",
      precision: "bg-green-500",
      recall: "bg-yellow-500",
      f1_score: "bg-purple-500",
    };
    return colors[key.toLowerCase()] || "bg-gray-500";
  };

  const getTextColorForMetric = (key) => {
    const colors = {
      accuracy: "text-blue-600",
      precision: "text-green-600",
      recall: "text-yellow-600",
      f1_score: "text-purple-600",
    };
    return colors[key.toLowerCase()] || "text-gray-800";
  };

  const filteredMetrics = Object.fromEntries(
    Object.entries(averageMetrics).filter(([key]) => key !== "Correctly Diagnosed")
  );

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden h-[28rem] w-full transition-all duration-300 ease-in-out transform flex">
      {/* Left: Bar Graph */}
      <div className="w-1/2 p-6 border-r border-gray-200 bg-gray-50 flex items-center justify-center">
        <BarGraph
          data={filteredMetrics}
          bgColor="#ffffff"
          axisColor="#4b5563"
          gridColor="#e5e7eb"
          textColor="#1f2937"
          colors={[
            "#3b82f6", "#10b981", "#ef4444",
            "#8b5cf6", "#eab308", "#ec4899", "#6366f1"
          ]}
        />
      </div>

      {/* Right: Metrics Display */}
      <div className="w-1/2 p-6 overflow-y-auto">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Average Performance Metrics</h3>
        <div className="space-y-4">
          {Object.entries(averageMetrics).map(([key, value]) => {
            if (key === "Correctly Diagnosed") {
              return (
                <div key={key} className="flex items-center justify-between text-sm font-medium text-gray-700">
                  <span className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full bg-gray-500 mr-2"></span>
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 py-2">
                    {value === 1 ? (
                      <span className="bg-green-600 py-1 px-2 text-white rounded-xl border border-green-800">
                        Mostly Correct
                      </span>
                    ) : (
                      <span className="bg-red-600 py-1 px-2 text-white rounded-xl border border-red-800">
                        Mostly Incorrect
                      </span>
                    )}
                  </span>
                </div>
              );
            }

            return (
              <div key={key} className="flex flex-col">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full ${getColorForMetric(key)} mr-2`}></span>
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-sm font-semibold ${getTextColorForMetric(key)}`}>
                    {value}/10
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${getColorForMetric(key)} h-2 rounded-full`}
                    style={{ width: `${value * 10}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


const MedinatorCard = () => {
  const navigate = useNavigate()
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div className="bg-black rounded-xl shadow-lg overflow-hidden p-0 h-96 w-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
      <div className="h-full flex flex-col items-center justify-between p-6 bg-gradient-to-br from-black via-gray-600/40 to-gray-900 transition-all duration-300 hover:from-black hover:to-gray-800">
        {/* Logo and Title */}
        <div className="text-center mb-3">
          <p className="font-bold text-2xl text-white font-serif tracking-wider">Medinator</p>
          {!isHovering ? (<p className="text-gray-400 italic text-sm">Answer questions. Find your condition.</p>):null}
        </div>

        {/* Interactive Diagnostic Icons */}
        <div className="w-full flex-1 relative flex justify-center items-center overflow-hidden">
          <div className="transform transition-all duration-500 hover:scale-105 group flex flex-col items-center">
            <div className="flex space-x-6 mb-4">
              <div className="flex flex-col items-center transition-all duration-300 transform group-hover:scale-105">
                <CheckCircle size={32} className="text-green-400" />
                <p className="text-green-400 mt-1 font-medium">Yes</p>
              </div>
              <div className="flex flex-col items-center transition-all duration-300 transform group-hover:scale-105">
                <XCircle size={32} className="text-red-400" />
                <p className="text-red-400 mt-1 font-medium">No</p>
              </div>
              <div className="flex flex-col items-center transition-all duration-300 transform group-hover:scale-105">
                <AlertCircle size={32} className="text-yellow-400" />
                <p className="text-yellow-400 mt-1 font-medium">Not Sure</p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gray-800 bg-opacity-50 p-2 rounded-lg border border-gray-500">
                <p className="text-white text-center">Do you experience headaches?</p>
              </div>

              {/* Animated diagnostic paths */}
              <div className="absolute -top-1 -left-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="w-6 h-6 rounded-full bg-white animate-pulse-bright"></div>
              </div>
              <div className="absolute top-20 -right-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="w-4 h-4 rounded-full bg-gray-300 animate-pulse-bright delay-300"></div>
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              <HelpCircle size={32} className="text-gray-300 animate-pulse-slow" />
            </div>
          </div>
        </div>

        {/* Marketing text that expands on hover */}
        <div
          className="mt-2 text-center overflow-hidden transition-all duration-500"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {!isHovering && (
            <p className="text-gray-300 text-sm">Simple yes/no questions lead to accurate diagnoses</p>
          )}
          {isHovering && (
            <p className="relative text-gray-200 text-sm">
              AI-powered question sequence analyzes your symptoms to identify potential medical conditions with precision.
            </p>
          )}
          {/* Call to action */}
          <button
            className="mt-3 bg-white hover:bg-gray-200 text-black font-bold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-md"
            onClick={() => {navigate("/symptomtree")}}
          >
            Start Diagnosis
          </button>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s infinite;
        }
        @keyframes pulse-bright {
          0% { opacity: 0.4; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.4; transform: scale(0.95); }
        }
        .animate-pulse-bright {
          animation: pulse-bright 2s infinite;
        }
        @keyframes pulse-slow {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite ease-in-out;
        }
        .group:hover .object-top {
          object-position: center;
        }
      `}</style>
    </div>
  );
};

const SymptomSimulatorCard = () => {
  const navigate = useNavigate()
  const [ishovering, setIsHovering] = useState(false);
  return (
    <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden p-0 h-96 w-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
      <div className="h-full flex flex-col items-center justify-between p-6 bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 transition-all duration-300 hover:from-gray-900 hover:to-blue-950">
        {/* Logo and Title */}
        <div className="text-center mb-2">
          <h2 className="font-bold text-3xl text-blue-300 font-serif tracking-wider">SymptomSimulator</h2>
          {!ishovering ? (<p className="text-blue-400 italic">Simuate any and all diseases</p>):null}
        </div>

        {/* Body SVG with Zoom Effect */}
        <div className="w-full flex-1 relative flex justify-center items-center overflow-hidden">
          <div className="transform transition-all duration-500 hover:scale-90 hover:translate-y-3 group">
            {/* The SVG image will be loaded from external file */}
            <img
              src="/images/body_diagram.svg"
              alt="Human body diagram"
              className="w-full max-h-48 object-contain object-top transition-all duration-500"
            />

            {/* Symptom indicators that appear on hover */}
            <div className="absolute left-1/3 top-1/4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="" />
              <div className="bg-white bg-opacity-20 text-white px-2 py-0.5 rounded-full text-xs mx-12">
                Headache
              </div>
            </div>

            <div className="absolute right-1/3 top-1/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="" />
              <div className="bg-white bg-opacity-20 text-white px-2 py-0.5 rounded-full text-xs mx-14">
                <p className="whitespace-nowrap">Chest Pain</p>
              </div>
            </div>

            <div className="absolute left-1/3 top-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="" />
              <div className="bg-white bg-opacity-20 text-white px-2 py-0.5 rounded-full text-xs mx-14">
                Nausea
              </div>
            </div>
          </div>
        </div>

        {/* Marketing text that expands on hover */}
        <div
              className="mt-2 text-center overflow-hidden transition-all duration-500"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {!ishovering && (
                <p className="text-blue-300 text-sm">Simulate symptoms on an interactive body model</p>
              )}
              {ishovering && (
                <p className="relative text-blue-200 text-sm ">
                  Leverage AI for symptom mapping, virtual patient encounters, and automated diagnostic report analysis.
                </p>
              )}

          {/* Call to action */}
          <button className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-md"
          onClick={() => {navigate("/symptom-simulator")}}
          >
            Start Simulation
          </button>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s infinite;
        }

        .group:hover .object-top {
          object-position: center;
        }
      `}</style>
    </div>
  );
};

const DiseaseCraftCard = () => {
  const navigate = useNavigate()
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden p-0 h-96 w-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
      <div className="h-full flex flex-col items-center justify-between p-6 bg-gradient-to-br from-amber-50 to-amber-100 transition-all duration-300 hover:from-amber-100 hover:to-amber-200">
        {/* Logo and Title */}
        <div className="text-center mb-2">
          <h2 className="font-bold text-3xl text-amber-800 font-serif tracking-wider">DiseaseCraft</h2>
          <p className="text-amber-600 italic">Brew your medical knowledge</p>
        </div>

        {/* SVG Graphic */}
        <div className="w-full flex-1 relative flex justify-center items-center">
          <svg
            viewBox="0 0 400 300"
            className="w-full h-full max-h-52"
            style={{ filter: "drop-shadow(0px 5px 8px rgba(0, 0, 0, 0.25))" }}
          >
            {/* Flames */}
            <defs>
              <radialGradient id="fireGradient" cx="50%" cy="80%" r="70%" fx="50%" fy="80%">
                <stop offset="0%" stopColor="#FFEDA0" />
                <stop offset="30%" stopColor="#FED976" />
                <stop offset="60%" stopColor="#FEB24C" />
                <stop offset="80%" stopColor="#FD8D3C" />
                <stop offset="95%" stopColor="#FC4E2A" />
                <stop offset="100%" stopColor="#E31A1C" />
              </radialGradient>
            </defs>
            <g className="flames" transform="translate(0 5)">
              {/* Flame Layer 1 (Back) */}
              <path fill="url(#fireGradient)" opacity="0.7">
                <animate attributeName="d" dur="1.8s" repeatCount="indefinite" values="
                  M 150 290 C 160 260, 180 265, 190 240 C 200 215, 210 220, 220 240 C 230 260, 250 265, 260 290 Z;
                  M 150 290 C 155 270, 175 270, 190 250 C 205 230, 215 235, 225 250 C 235 265, 255 270, 260 290 Z;
                  M 150 290 C 160 260, 180 265, 190 240 C 200 215, 210 220, 220 240 C 230 260, 250 265, 260 290 Z;
                "/>
                <animate attributeName="opacity" dur="1.8s" repeatCount="indefinite" values="0.7; 0.5; 0.7"/>
              </path>
               {/* Flame Layer 2 (Middle) */}
              <path fill="url(#fireGradient)" opacity="0.9">
                 <animate attributeName="d" dur="1.5s" repeatCount="indefinite" values="
                  M 170 290 C 175 255, 190 260, 200 230 C 210 200, 220 205, 230 230 C 240 255, 250 260, 255 290 Z;
                  M 170 290 C 180 265, 190 270, 200 240 C 210 210, 225 215, 235 240 C 245 265, 250 270, 255 290 Z;
                  M 170 290 C 175 255, 190 260, 200 230 C 210 200, 220 205, 230 230 C 240 255, 250 260, 255 290 Z;
                 "/>
                 <animate attributeName="opacity" dur="1.5s" repeatCount="indefinite" values="0.9; 0.7; 0.9"/>
              </path>
               {/* Flame Layer 3 (Front) */}
              <path fill="url(#fireGradient)" opacity="0.8">
                 <animate attributeName="d" dur="1.2s" repeatCount="indefinite" values="
                  M 190 290 C 195 265, 205 270, 210 250 C 215 230, 225 235, 230 250 C 235 265, 240 270, 245 290 Z;
                  M 190 290 C 193 270, 205 275, 210 255 C 215 235, 228 240, 233 255 C 238 270, 242 275, 245 290 Z;
                  M 190 290 C 195 265, 205 270, 210 250 C 215 230, 225 235, 230 250 C 235 265, 240 270, 245 290 Z;
                 "/>
                  <animate attributeName="opacity" dur="1.2s" repeatCount="indefinite" values="0.8; 0.6; 0.8"/>
              </path>
            </g>

            {/* Kadhai Body */}
            <defs>
              <linearGradient id="kadhaiMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d4af37" />
                <stop offset="30%" stopColor="#b8860b" />
                <stop offset="70%" stopColor="#cd853f" />
                <stop offset="100%" stopColor="#8b4513" />
              </linearGradient>
               <radialGradient id="kadhaiInner" cx="50%" cy="50%" r="60%">
                 <stop offset="0%" stopColor="#6B4F34" />
                 <stop offset="70%" stopColor="#4A3728" />
                 <stop offset="100%" stopColor="#3B2D1F" />
              </radialGradient>
               <radialGradient id="bubbleGradient" cx="40%" cy="40%" r="50%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                <stop offset="100%" stopColor="rgba(255,218,185,0.4)" />
              </radialGradient>
            </defs>

             {/* Kadhai Rim */}
            <ellipse cx="200" cy="100" rx="130" ry="35" fill="url(#kadhaiMetal)" stroke="#715a3a" strokeWidth="5" />

             {/* Kadhai Body */}
             <path d="M 70 100 C 70 100, 50 180, 100 230 Q 200 280, 300 230 C 350 180, 330 100, 330 100 Z"
                   fill="url(#kadhaiMetal)" stroke="#715a3a" strokeWidth="5" />

             {/* Inner Surface */}
            <ellipse cx="200" cy="100" rx="120" ry="30" fill="url(#kadhaiInner)" />
            <path d="M 80 100 C 80 100, 65 170, 105 215 Q 200 260, 295 215 C 335 170, 320 100, 320 100 Z"
                   fill="url(#kadhaiInner)" opacity="0.8" />

             {/* Handles */}
            <path d="M 68 100 C 20 90, 20 130, 75 125" stroke="#715a3a" strokeWidth="12" fill="none" strokeLinecap="round"/>
            <path d="M 332 100 C 380 90, 380 130, 325 125" stroke="#715a3a" strokeWidth="12" fill="none" strokeLinecap="round"/>

            {/* Highlights */}
            <ellipse cx="150" cy="90" rx="60" ry="12" fill="rgba(255, 255, 255, 0.25)" transform="rotate(-10 150 90)" />
            <ellipse cx="250" cy="115" rx="40" ry="8" fill="rgba(255, 255, 255, 0.15)" transform="rotate(5 250 115)"/>

            {/* Animated Bubbles */}
            <circle cx="180" cy="140" r="8" fill="url(#bubbleGradient)">
                <animate attributeName="cy" values="140;110;140" dur="3s" repeatCount="indefinite" />
                <animate attributeName="cx" values="180;190;180" dur="4s" repeatCount="indefinite" />
                <animate attributeName="r" values="8;11;8" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="220" cy="130" r="6" fill="url(#bubbleGradient)">
                <animate attributeName="cy" values="130;115;130" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="cx" values="220;210;220" dur="3.5s" repeatCount="indefinite" />
                <animate attributeName="r" values="6;9;6" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="150" cy="155" r="5" fill="url(#bubbleGradient)">
                <animate attributeName="cy" values="155;120;155" dur="3.8s" repeatCount="indefinite" />
                <animate attributeName="cx" values="150;165;150" dur="4.2s" repeatCount="indefinite" />
                <animate attributeName="r" values="5;7;5" dur="3.8s" repeatCount="indefinite" />
            </circle>
          </svg>


          {/* Floating symptom bubbles */}
          <div className="absolute right-1/3 top-1/3 bg-white bg-opacity-80 text-amber-900 px-2 py-0.5 rounded-full text-xs animate-float-slow">
            🌡️ Fever
          </div>
          <div className="absolute left-1/3 top-1/2 bg-white bg-opacity-80 text-amber-900 px-2 py-0.5 rounded-full text-xs animate-float-slower">
            🌡️ Cough
          </div>
          <div className="absolute right-1/4 bottom-1/4 bg-white bg-opacity-80 text-amber-900 px-2 py-0.5 rounded-full text-xs animate-float-medium">
            🌡️ Headache
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-2">
          <button className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-md"
          onClick={() => {navigate("/diseaseCraft")}}
          >
            Start Brewing
          </button>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes float-slow {
          0% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
          100% { transform: translateY(0) rotate(-2deg); }
        }
        @keyframes float-slower {
          0% { transform: translateY(0) rotate(2deg); }
          50% { transform: translateY(-15px) rotate(-3deg); }
          100% { transform: translateY(0) rotate(2deg); }
        }
        @keyframes float-medium {
          0% { transform: translateY(0) rotate(1deg); }
          50% { transform: translateY(-8px) rotate(-1deg); }
          100% { transform: translateY(0) rotate(1deg); }
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }
        .animate-float-slower {
          animation: float-slower 5s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 3.5s ease-in-out infinite;
        }
        .animate-bounce-slow {
          animation: bounce 2s infinite;
        }
        .animate-bounce-slower {
          animation: bounce 3s infinite;
        }
        .rotate-15 {
          transform: rotate(15deg);
        }
      `}</style>
    </div>
  );
};


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
    const [activeMetricView, setActiveMetricView] = useState('text'); // 'text' or 'graph'

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

    const getTextColorForMetric = (metricKey) => {
        const colors = {
            'Symptoms Relevance': 'text-blue-500',
            'Clinical Reasoning': 'text-green-500',
            'RED flag identification': 'text-red-500',
            'Prescription understanding': 'text-purple-500',
            'Communication style': 'text-yellow-500',
            'Presentation Quality': 'text-pink-500',
            'Correctly Diagnosed': 'text-indigo-500'
        };
        return colors[metricKey] || 'text-gray-400';
    };

    const handleCompleteProfile = () => {
        navigate("/profile");
    };

    const handleNavbarClick = () => {
        setShowNavbar((prevShowNavbar) => !prevShowNavbar);
    };

    const toggleMetricView = () => {
        setActiveMetricView(activeMetricView === 'text' ? 'graph' : 'text');
    };

    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-gray-200 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-gray-100 pb-2 overflow-x-hidden">
          {/* Main content area */}
                      <div className="px-4 py-4">
                          {/* Welcome Card */}
                          <div className="bg-gray-900 rounded-xl shadow-md overflow-hidden p-6 mx-0 w-full mb-10">
                              <div className="flex flex-row items-center">
                                  <div className="flex-1 min-w-0 pl-4 md:pl-8 lg:pl-12 xl:pl-16">
                                      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-10 whitespace-nowrap overflow-hidden text-ellipsis">
                                          Welcome back, {username.username}!
                                      </h1>
                                      <hr className="border-t-4 border-white mt-3 w-20 rounded-full" />
                                      <div className="text-white text-xs sm:text-sm md:text-base mt-4">
                                          <p>Your personalized healthcare journey starts here.</p>
                                      </div>
                                  </div>
                                  <div className="blob bg-white p-2 flex-shrink-0">
                                      <img src="/images/logo.png" alt="Medical icon" className="h-20 sm:h-22 md:h-28 lg:h-32 xl:h-36 w-auto transition-all duration-300" />
                                  </div>
                              </div>
                          </div>

                {/* Three-card layout with hover animation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
                    {/* Performance Averages Card (Left) */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden h-96 transition-all duration-300 ease-in-out transform md:hover:scale-102 md:hover:shadow-xl">
                        < MedinatorCard/>
                    </div>

                    {/* Middle Card */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden h-96 transition-all duration-300 ease-in-out transform md:hover:scale-102 md:hover:shadow-xl">
                        <div className="h-full">
                            <SymptomSimulatorCard />
                        </div>
                    </div>

                    {/* Right Card (Disease Craft) */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden h-96 transition-all duration-300 ease-in-out transform md:hover:scale-102 md:hover:shadow-xl">
                        <div className="h-full">
                            <DiseaseCraftCard />
                        </div>
                    </div>
                </div>
          {/* Bottom card */}
          <div className=" py-4 mb-10">
            <PerformanceMetricsCard averageMetrics={averageMetrics}/>
          </div>
            </div>

            {/* Sidebar */}
            {showNavbar && (
                <div className="fixed inset-0 z-40">
                    <Sidebar username={username.username} name={username.email} />
                </div>
            )}

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
