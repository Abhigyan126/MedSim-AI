import React, { useState, useEffect } from "react";
import useAuthCheck from "../components/auth_check";
import { useNavigate } from "react-router-dom";
import API from "../components/api";
import "../../styles/blob.css";
import Chatbot from "../components/chatbot";
import Sidebar from "../components/sidebar";
import SymptomVisualizer from "../components/drawsymptom";


const coordinatesData = [
    {
      "name": "Head",
      "label": {
        "relX": 0.33555555555555555,
        "relY": 0.05272727272727273,
        "x": 302,
        "y": 29
      },
      "target": {
        "relX": 0.47444444444444445,
        "relY": 0.05272727272727273,
        "x": 427,
        "y": 29
      }
    },
    {
      "name": "Respiratory",
      "label": {
        "relX": 0.28444444444444444,
        "relY": 0.23454545454545456,
        "x": 256,
        "y": 129
      },
      "target": {
        "relX": 0.48,
        "relY": 0.23454545454545456,
        "x": 432,
        "y": 129
      }
    },
    {
      "name": "Cardiovascular",
      "label": {
        "relX": 0.6466666666666666,
        "relY": 0.29454545454545455,
        "x": 582,
        "y": 162
      },
      "target": {
        "relX": 0.5055555555555555,
        "relY": 0.29454545454545455,
        "x": 455,
        "y": 162
      }
    },
    {
      "name": "Gastrointestinal",
      "label": {
        "relX": 0.27111111111111114,
        "relY": 0.43636363636363634,
        "x": 244,
        "y": 240
      },
      "target": {
        "relX": 0.4711111111111111,
        "relY": 0.43636363636363634,
        "x": 424,
        "y": 240
      }
    },
    {
      "name": "Neurological",
      "label": {
        "relX": 0.6477777777777778,
        "relY": 0.04,
        "x": 583,
        "y": 22
      },
      "target": {
        "relX": 0.5,
        "relY": 0.04,
        "x": 450,
        "y": 22
      }
    },
    {
      "name": "Urinary",
      "label": {
        "relX": 0.76,
        "relY": 0.3890909090909091,
        "x": 684,
        "y": 214
      },
      "target": {
        "relX": 0.5233333333333333,
        "relY": 0.39454545454545453,
        "x": 471,
        "y": 217
      }
    },
    {
      "name": "Hands",
      "label": {
        "relX": 0.72,
        "relY": 0.5609090909090909,
        "x": 648,
        "y": 309
      },
      "target": {
        "relX": 0.5933333333333334,
        "relY": 0.5618181818181818,
        "x": 534,
        "y": 309
      }
    },
    {
      "name": "Legs",
      "label": {
        "relX": 0.36333333333333334,
        "relY": 0.7163636363636363,
        "x": 327,
        "y": 394
      },
      "target": {
        "relX": 0.47,
        "relY": 0.7163636363636363,
        "x": 423,
        "y": 394
      }
    },
    {
      "name": "Reproductive System ",
      "label": {
        "relX": 0.13666666666666666,
        "relY": 0.5345454545454545,
        "x": 123,
        "y": 294
      },
      "target": {
        "relX": 0.4988888888888889,
        "relY": 0.5345454545454545,
        "x": 449,
        "y": 294
      }
    }
  ]

  const symptomsData = [
    {
      "name": "Headache",
      "description": "Throbbing pain, primarily in the temples",
      "severity": 3,
      "location": "Head"
    },
    {
      "name": "Cough",
      "description": "Forceful expulsion of air from the lungs",
      "severity": 2,
      "location": "Respiratory"
    },
    {
      "name": "Chest Pain",
      "description": "Discomfort or pain in the chest area",
      "severity": 4,
      "location": "Cardiovascular"
    },
    {
      "name": "Abdominal Pain",
      "description": "Pain or discomfort in the stomach area",
      "severity": 3,
      "location": "Gastrointestinal"
    },
    {
      "name": "Numbness",
      "description": "Loss of sensation in a part of the body",
      "severity": 2,
      "location": "Neurological"
    },
    {
      "name": "Painful Urination",
      "description": "Burning or discomfort during urination",
      "severity": 3,
      "location": "Urinary"
    },
    {
      "name": "Tingling",
      "description": "Pins and needles sensation",
      "severity": 1,
      "location": "Hands"
    },
    {
      "name": "Joint Pain",
      "description": "Pain in the joints",
      "severity": 3,
      "location": "Legs"
    },
    {
      "name": "Pelvic Pain",
      "description": "Pain in the lower abdomen or pelvic region",
      "severity": 3,
      "location": "Reproductive System"
    }
  ]
//Simulator code below 

const Simulator = () => {
    const [showChat, setShowChat] = useState(false);
    const [showNavbar, setShowNavbar] = useState(false);
    const navigate = useNavigate();
    const isAuthenticated = useAuthCheck();
    const [username, setUsername] = useState({username: null, email: null});

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
            setUsername({username: response.data.username, email: response.data.email});
        } catch (error) {
            console.error("Error fetching username:", error.response?.data?.message || error.message);
        }
    };

    if (isAuthenticated === null) {
        return <h1>Loading...</h1>; // Show loading state while checking auth
    }

    const handleNavbarClick = () => {
        setShowNavbar((prevShowNavbar) => !prevShowNavbar); // Toggle showNavbar
      };

    return (
        <div className="relative">
            {/* Website content */}
            <SymptomVisualizer coordinatesData={coordinatesData} symptomsData={symptomsData}/>
            

            {/* Bottom Bar */}
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

export default Simulator;
