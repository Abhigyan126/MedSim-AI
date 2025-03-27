import API from "./api";

// A test function to test the authentication
const Dashboard = () => {
    API.get("/auth-check", { withCredentials: true })
      .then((response) => {
        console.log("Full response:", response);
        alert("Authenticated ✅");
      })
      .catch((error) => {
        console.error("Authentication Error:", error.response);
        alert(`Not Authenticated ❌: ${error.response?.data?.message || error.message}`);
      });
  
    return null;
  };

export default Dashboard;
