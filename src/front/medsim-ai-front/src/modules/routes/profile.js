import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthCheck from '../components/auth_check';
import API from '../components/api';
import Chatbot from "../components/chatbot";
import Sidebar from "../components/sidebar";
import "../../styles/blob.css";

const EmojiPicker = ({ emojis, currentEmoji, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Select Profile Emoji</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {emojis.map((emoji, index) => (
            <button
              key={index}
              className={`text-2xl p-2 rounded-full hover:bg-gray-100 ${
                currentEmoji === emoji ? 'bg-blue-100' : ''
              }`}
              onClick={() => onSelect(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const CourseCard = ({ courses }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden h-full">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Current Semester Courses</h2>
        <div className="space-y-3">
          {courses.map((course, index) => (
            <div key={index} className="flex items-start border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-2 mr-3">
                <span className="text-blue-600 text-lg">{course.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-md font-semibold text-gray-800 truncate">{course.name}</h3>
                <p className="text-sm text-gray-500">{course.professor}</p>
                <div className="flex items-center mt-1">
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{course.credits} credits</span>
                </div>
              </div>
              <div className="flex-shrink-0 ml-2">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  course.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                  course.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                  'bg-blue-100 text-blue-800'
                }`}>
                  {course.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProfileCard = ({ user, onEmojiChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden h-full">
      <div className="p-6">
        <div className="flex items-center">
          <div className="relative">
            <div className="flex items-center justify-center rounded-full bg-blue-100 p-2 mr-4 w-16 h-16">
              <span className="text-3xl" role="img" aria-label="Profile emoji">
                {user.emoji}
              </span>
            </div>
            <button 
              onClick={onEmojiChange}
              className="absolute bottom-0 left-0 bg-white rounded-full p-0.5 shadow-sm border border-gray-200 hover:bg-gray-100 transform translate-x-1/4 translate-y-1/4"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-3 w-3 text-gray-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
                />
              </svg>
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
            <p className="text-gray-600">{user.role}</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-[140px]">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">College/University</h2>
              <p className="mt-1 text-gray-900 break-words">{user.medicalSchool}</p>
            </div>
            <div className="w-16">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Year</h2>
              <p className="mt-1 text-gray-900">{user.year}</p>
            </div>
            <div className="w-20">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Semester</h2>
              <p className="mt-1 text-gray-900">{user.semester}</p>
            </div>
          </div>

          <div className="mt-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Specialization</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {user.specializations.map((spec, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {spec}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Performance Metrics</h2>
            <div className="mt-2 grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600">{user.casesCompleted}</p>
                <p className="text-xs text-gray-500">Cases Completed</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">{user.accuracy}%</p>
                <p className="text-xs text-gray-500">Diagnostic Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-purple-600">{user.cgpa}</p>
                <p className="text-xs text-gray-500">CGPA</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const Profile = () => {
    const [showChat, setShowChat] = useState(false);
    const [showNavbar, setShowNavbar] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const navigate = useNavigate();
    const isAuthenticated = useAuthCheck();
    const [username, setUsername] = useState({username: null, email: null});
    const [user, setUser] = useState(null);
    const [courses, setCourses] = useState([]);

  const medicalEmojis = [
    '👨‍⚕️', '👩‍⚕️', '🧑‍⚕️', '🥼', '🩺', '💉', '🦠', 
    '🧠', '🦷', '🦴', '🧬', '🔬', '📋', '❤️',
    '🧑‍🎓', '👨‍🎓', '👩‍🎓', '🧪', '💊', '🏥', '🚑'
  ];

  const courseEmojis = [
    '🧠', '🫀', '🫁', '🦴', '🦷', '👁️', '👂',
    '🧪', '🔬', '💊', '🩺', '📚', '📝', '🏥'
  ];

  useEffect(() => {
    if (isAuthenticated === false) {
      navigate("/login");
    } else if (isAuthenticated) {
      fetchUserData();
      fetchCourses();
    }
  }, [isAuthenticated, navigate]);

  const fetchUserData = async () => {
    const response = await API.get("/getusername");
    setUsername({username: response.data.username, email: response.data.email});

    try {
      const [usernameRes, profileRes] = await Promise.all([
        API.get("/getusername"),
        API.get("/profile")
      ]);
      
        const name = String(username.username || "Medical Student");
        setUser({
        name: name,
        role: "Medical Student",
        medicalSchool: profileRes.data.medicalSchool || "Example Medical College",
        year: profileRes.data.year || "2",
        semester: profileRes.data.semester || "3",
        specializations: profileRes.data.specializations || ["General Medicine"],
        casesCompleted: profileRes.data.casesCompleted || 0,
        accuracy: profileRes.data.accuracy || 0,
        cgpa: profileRes.data.cgpa || "8.2",
        emoji: profileRes.data.emoji || medicalEmojis[name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % medicalEmojis.length]
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      const name = String(username.username || "Medical Student");
      console.log(username)
      setUser({
        name: name,
        role: "Medical Student",
        medicalSchool: "Example Medical College",
        year: "2",
        semester: "3",
        specializations: ["Cardiology", "Internal Medicine"],
        casesCompleted: 45,
        accuracy: 78,
        cgpa: "8.2",
        emoji: medicalEmojis[name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % medicalEmojis.length]
      });
    }
  };

  const fetchCourses = async () => {
    try {
      const mockCourses = [
        {
          name: "Clinical Anatomy",
          professor: "Dr. Smith",
          credits: 4,
          status: "In Progress",
          emoji: courseEmojis[0]
        },
        {
          name: "Physiology",
          professor: "Dr. Johnson",
          credits: 5,
          status: "In Progress",
          emoji: courseEmojis[1]
        },
        {
          name: "Biochemistry",
          professor: "Dr. Lee",
          credits: 3,
          status: "In Progress",
          emoji: courseEmojis[2]
        },
        {
          name: "Medical Ethics",
          professor: "Dr. Brown",
          credits: 2,
          status: "In Progress",
          emoji: courseEmojis[3]
        }
      ];
      setCourses(mockCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setUser(prev => ({
      ...prev,
      emoji: emoji
    }));
    setShowEmojiPicker(false);
    
    API.post("/updateemoji", { emoji: emoji })
      .catch(err => console.error("Failed to save emoji:", err));
  };

  const handleNavbarClick = () => {
    setShowNavbar((prevShowNavbar) => !prevShowNavbar); // Toggle showNavbar
  };

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-100 pb-16 overflow-x-hidden">

      <div className={`transition-all duration-300 ease-in-out ${
        showNavbar ? 'ml-64' : 'ml-0'
      }`}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8 w-full">
            <div className="w-full md:w-[60%]">
              {user ? (
                <ProfileCard 
                  user={user} 
                  onEmojiChange={() => setShowEmojiPicker(true)}
                />
              ) : (
                <p>Loading profile...</p>
              )}
            </div>
            <div className="w-full md:w-[40%]">
              {courses.length > 0 && <CourseCard courses={courses} />}
            </div>
          </div>
        </div>

        {showEmojiPicker && (
          <EmojiPicker
            emojis={medicalEmojis}
            currentEmoji={user?.emoji}
            onSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
      </div>

      {showNavbar && <Sidebar username={username.username} name={username.email} />} {/* Conditionally render the <p> tag */}

        {/* Fixed Chatbot Button */}
        <div className="fixed bottom-0 left-0 w-full bg-gray-900 text-white py-2 shadow-md flex justify-between items-center">
        <div className="ml-4"> {/* Added left margin */}
            <button onClick={handleNavbarClick}>
            <div className="burger-icon">
            <div className="bar1"></div>
            <div className="bar2"></div>
            <div className="bar3"></div>
            </div>

            </button>
        </div>
        <div className="mr-4"> {/* Added right margin */}
            <button
            className="px-6 border-2 border-white"
            onClick={() => setShowChat(!showChat)}
            >
            Chat Bot
            </button>
        </div>
        </div>

        {/* Chatbot Popup */}
        <Chatbot showChat={showChat} setShowChat={setShowChat}/>

      </div>
  );
};

export default Profile;