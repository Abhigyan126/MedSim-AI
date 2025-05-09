import { User, Home, Info, LogOut, LogIn } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "./api";

async function handleImage({setSvgData}) {
  try {
    const token = localStorage.getItem("session_token");
    if (token) {
      const response = await API.get(`/get_identicon?cb=${token}`);
      if (response.data?.svg) {
        setSvgData(response.data.svg);
      }
    } else {
      alert('Session token not found');
    }
} catch (error) {
    console.error("Error fetching Identicon:", error.response?.data?.message || error.message);
}
}

/* Navigatation Button Function */
const Sidebar = ({ username="?" , name="?" }) => {
    const [svgData, setSvgData] = useState(null);
    useEffect(() => {
      handleImage({setSvgData});
    },[]);
    const navigate = useNavigate();
    const navItems = [
        { label: "Profile", icon: <User size={22} />, action: () => navigate('/profile') },
        { label: "Home", icon: <Home size={22} />, action: () => navigate('/home') },
        { label: "Login", icon: <LogIn size={22} />, action: () => navigate('/login') },
        { label: "About Us", icon: <Info size={22} />, action: () => navigate('/about') },
        { label: "Symptom Simulator", icon: <img src='images/simulation_icon.png' title='Symptom Simulator' alt='simulation' className='w-6 h-6'/>, action: () => navigate('/symptom-simulator') },
      ];

    return (
      <div className="fixed left-0 top-0 w-[250px] h-[95%] bg-gray-900 backdrop-blur-md shadow-lg flex flex-col justify-between text-white z-40">
        {/* Top Section: User Info + Navigation Buttons */}
        <div className="flex flex-col gap-6 p-6">
           {/* Identicon Image (Centered) */}
           {svgData && (
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-white bg-white">
              <img src={svgData} alt="User Identicon" className="w-full h-full object-fill" />
              </div>
            </div>
          )}
          {/* User Info */}
          <div className="flex flex-col gap-1 border-b border-gray-600 pb-4">
            <h2 className="text-xl font-bold">{username}</h2>
            <p className="text-sm text-gray-400">{name}</p>
          </div>

          {/* Navigation Buttons */}
          <nav className="flex flex-col gap-3 mt-2">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors duration-200 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 text-lg"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom Section: Logout Button */}
        <div className="p-6">
          <button className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          onClick={() => navigate('/logout')}
          >
            <LogOut size={22} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    );
  };

export default Sidebar;
