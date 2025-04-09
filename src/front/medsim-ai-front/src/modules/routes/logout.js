import React, { useState, useEffect } from "react";
import API from "../components/api";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [error, setError] = useState(null);

  // Immediate logout on mount
  useEffect(() => {
    const logoutUser = async () => {
      try {
        await API.post("/logout", { withCredentials: true });
      } catch (error) {
        console.error("Logout error:", error);
        setError(error.response?.data?.message || "Failed to logout. Please try again.");
      }
    };
    logoutUser();
  }, []);

  // Countdown redirect
  useEffect(() => {
    if (countdown === 0) {
      navigate("/login");
      return;
    }
    const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white text-center">
      {error ? (
        <div>
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <button
            onClick={() => navigate("/home")}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-500 transition"
          >
            Go Back
          </button>
        </div>
      ) : (
        <div>
          <h1 className="text-3xl font-bold mb-4">Hate to see you leave...</h1>
          <p className="mb-2">You are being redirected to the login page.</p>
          <p className="text-xl font-semibold">Redirecting in {countdown} second{countdown !== 1 && "s"}...</p>
        </div>
      )}
    </div>
  );
};

export default Logout;
