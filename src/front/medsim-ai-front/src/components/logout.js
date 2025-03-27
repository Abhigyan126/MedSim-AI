import React, { useState, useEffect, useCallback } from "react";
import API from "./api";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [error, setError] = useState(null);
  const [isCounting, setIsCounting] = useState(true);

  // Logout function that removes token and redirects
  const handleLogout = useCallback(async () => {
    try {
      await API.post("/logout", { withCredentials: true });
      navigate("/login"); // Redirect to login
    } catch (error) {
      console.error("Logout error:", error);
      setError(error.response?.data?.message || "Failed to logout. Please try again.");
      setIsCounting(false); // Stop the countdown
    }
  }, [navigate]);

  // Auto-start logout countdown on component mount
  useEffect(() => {
    if (!isCounting) return;

    let timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer); // Cleanup timer on unmount
  }, [isCounting]);

  // Auto-logout when countdown reaches 0
  useEffect(() => {
    if (isCounting && countdown === 0) {
      handleLogout();
    }
  }, [countdown, isCounting, handleLogout]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      {error ? (
        // Show error message & retry button when logout fails
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition"
          >
            Retry Logout
          </button>
        </div>
      ) : (
        // Show countdown UI when logout is in progress
        <div className="flex flex-col items-center">
          <div className="relative w-40 h-40">
            <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle cx="50" cy="50" r="45" stroke="gray" strokeWidth="8" fill="none" />
              {/* Progress Circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="white"
                strokeWidth="8"
                fill="none"
                strokeDasharray="283"
                strokeDashoffset={(countdown / 5) * 283} // Progress effect
                strokeLinecap="round"
                transform="rotate(-90 50 50)" // Start from top
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold">
              {countdown}
            </span>
          </div>
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => navigate("/home")}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-500 transition"
            >
              Cancel Logout
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition"
            >
              Logout Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logout;
