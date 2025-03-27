import React, { useState, useEffect } from "react";
import useAuthCheck from "./auth_check";
import { useNavigate } from "react-router-dom";
import API from "./api";

const Home = () => {
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

    return (
        <div>
            <h1>Welcome, {username || "User"}!</h1>
        </div>
    );
};

export default Home;
