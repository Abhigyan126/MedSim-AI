import React, { useState } from "react";
import Chatbot from "../components/chatbot";
import Sidebar from "../components/sidebar";
import "../../styles/blob.css";

// Developer Data
const developers = [
  {
    name: 'Abhigyan',
    githubLink: 'https://github.com/Abhigyan126',
    githubLogo: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
  },
  {
    name: 'Vishal Vishwakarma',
    githubLink: 'https://github.com/Vishalromansv',
    githubLogo: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
  },
  {
    name: 'Sharmila Balakrishnan',
    githubLink: 'https://github.com/Sharmila004',
    githubLogo: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
  },
  {
    name: 'Granthan Chatterjee',
    githubLink: 'https://github.com/granthanchatterjee',
    githubLogo: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
  },
  {
    name: 'Arush Ojha',
    githubLink: 'https://github.com/Arush-Ojha',
    githubLogo: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
  },
  {
    name: 'Yeshwanth D',
    githubLink: 'https://github.com/YeshwanthD75',
    githubLogo: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
  }
];

// About us page content
const renderPageContent = () => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Meet Our Team</h2>
      <div className="developers-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8">
        {developers.map((developer, index) => (
          <div key={index} className="developer-card bg-white shadow-lg rounded-lg p-6 text-center">
            <img
              src={developer.githubLogo}
              alt={`${developer.name} GitHub Logo`}
              className="w-16 h-16 mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{developer.name}</h3>
            <a
              href={developer.githubLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700"
            >
              Visit GitHub Profile
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

const AboutUs = () => {
  const [showChat, setShowChat] = useState(false);
  const [showNavbar, setShowNavbar] = useState(false);

  const handleNavbarClick = () => {
    setShowNavbar((prev) => !prev);
  };

  return (
    <div className="relative p-4">
      <h1 className="text-3xl font-bold mb-4">About Us</h1>

      {showNavbar && <Sidebar username="Guest" name="guest@example.com" />}

      <div className="p-6 bg-white rounded shadow mb-12">
        {renderPageContent()}
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-gray-900 text-white py-2 shadow-md flex justify-between items-center">
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
            className="px-6 border-2 border-white"
            onClick={() => setShowChat(!showChat)}
          >
            Chat Bot
          </button>
        </div>
      </div>

      <Chatbot showChat={showChat} setShowChat={setShowChat} />
    </div>
  );
};

export default AboutUs;
