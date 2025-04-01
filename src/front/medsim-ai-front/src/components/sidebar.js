import { User, Home, Info, LogOut, LogIn } from 'lucide-react';
import { useNavigate } from "react-router-dom";


/* Navigatation Button Function */
const Sidebar = ({ username="?" , name="?" }) => {
    const navigate = useNavigate();
    const navItems = [
        { label: "Profile", icon: <User size={22} />, action: () => console.log("Profile clicked") },
        { label: "Home", icon: <Home size={22} />, action: () => navigate('/home') },
        { label: "Login", icon: <LogIn size={22} />, action: () => navigate('/login') },
        { label: "About Us", icon: <Info size={20} />, action: () => console.log("About clicked") },
      ];
  
    return (
      <div className="fixed left-0 top-0 w-[15%] h-[95%] bg-gray-900 backdrop-blur-md shadow-lg flex flex-col justify-between text-white">
        {/* Top Section: User Info + Navigation Buttons */}
        <div className="flex flex-col gap-6 p-6">
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
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 text-lg"
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