import { User, Home, Info, LogOut, LogIn } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "./api";


//function to fetch and cahce image locally
// Utility function to hash an email (SHA-256)
async function hashEmail(email) {
  const encoder = new TextEncoder();
  const data = encoder.encode(email);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function handleImage(setSvgData, email) {
  if (!email) {
    console.error("Email is required for caching.");
    return;
  }

  // Hash the email for secure storage
  const hashedEmail = await hashEmail(email);
  const CACHE_KEY = `identicon_svg_${hashedEmail}`; // Secure hashed key
  const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

  try {
    // Step 1: Check user-specific cache
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const { svg, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < EXPIRY_TIME) {
        console.log("Using cached SVG for:", email);
        setSvgData(svg);
        return;
      } else {
        console.log("Cache expired for:", email);
        localStorage.removeItem(CACHE_KEY); // Remove expired cache
      }
    }

    // Step 2: Fetch from API
    const response = await API.get("/get_identicon");
    if (response.data?.svg) {
      setSvgData(response.data.svg);

      // Store user-specific SVG in localStorage with timestamp
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        svg: response.data.svg,
        timestamp: Date.now(),
      }));
    } else {
      console.warn("API response did not contain an SVG.");
    }
  } catch (error) {
    console.error("Error fetching Identicon:", error.response?.data?.message || error.message);
  }
}


/* Navigatation Button Function */
const Sidebar = ({ username="?" , name="?" }) => {
    const [svgData, setSvgData] = useState(null);
    useEffect(() => {
      handleImage(setSvgData, name);
    });
    const navigate = useNavigate();
    const navItems = [
        { label: "Profile", icon: <User size={22} />, action: () => navigate('/profile') },
        { label: "Home", icon: <Home size={22} />, action: () => navigate('/home') },
        { label: "Login", icon: <LogIn size={22} />, action: () => navigate('/login') },
        { label: "About Us", icon: <Info size={22} />, action: () => console.log("About clicked") },
        { label: "Symptom Simulator", icon: <img src='images/simulation_icon.png' title='Symptom Simulator' alt='simulation' className='w-6 h-6'/>, action: () => navigate('/symptom-simulator') },
      ];
  
    return (
      <div className="fixed left-0 top-0 w-[250px] h-[95%] bg-gray-900 backdrop-blur-md shadow-lg flex flex-col justify-between text-white">
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