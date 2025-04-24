import React, { useState, useEffect } from "react";
import Chatbot from "../components/chatbot";
import Sidebar from "../components/sidebar";
import "../../styles/blob.css";

// Developer Data
const developers = [
  {
    name: 'Abhigyan',
    role: 'Full Stack Developer',
    githubLink: 'https://github.com/Abhigyan126',
    githubLogo: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
  },
  {
    name: 'Vishal Vishwakarma',
    role: 'Frontend Engineer',
    githubLink: 'https://github.com/Vishalromansv',
    githubLogo: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
  },
  {
    name: 'Sharmila Balakrishnan',
    role: 'Backend Developer',
    githubLink: 'https://github.com/Sharmila004',
    githubLogo: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
  },
  {
    name: 'Granthan Chatterjee',
    role: 'UI/UX Designer',
    githubLink: 'https://github.com/granthanchatterjee',
    githubLogo: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
  },
  {
    name: 'Arush Ojha',
    role: 'DevOps Engineer',
    githubLink: 'https://github.com/Arush-Ojha',
    githubLogo: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
  },
  {
    name: 'Yeshwanth D',
    role: 'QA Specialist',
    githubLink: 'https://github.com/YeshwanthD75',
    githubLogo: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
  }
];

const AboutUs = () => {
  const [showChat, setShowChat] = useState(false);
  const [showNavbar, setShowNavbar] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [visibleSection, setVisibleSection] = useState(null);

  useEffect(() => {
    setAnimate(true);
    
    // Set up intersection observer for scroll animations
    const observerOptions = {
      threshold: 0.3,
      rootMargin: "0px 0px -100px 0px"
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisibleSection(entry.target.id);
        }
      });
    }, observerOptions);
    
    // Observe sections
    const sections = document.querySelectorAll('.animate-on-scroll');
    sections.forEach(section => {
      observer.observe(section);
    });
    
    return () => {
      sections.forEach(section => {
        observer.unobserve(section);
      });
    };
  }, []);

  const handleNavbarClick = () => {
    setShowNavbar((prev) => !prev);
  };

  return (
    <div className="relative min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-blue-500 opacity-10 blur-xl"></div>
        <div className="absolute bottom-40 right-20 w-80 h-80 rounded-full bg-purple-500 opacity-10 blur-xl"></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 rounded-full bg-teal-500 opacity-10 blur-xl"></div>
      </div>

      {showNavbar && <Sidebar username="Guest" name="guest@example.com" />}

      {/* Content container */}
      <div className={`relative z-10 p-4 pb-16 transition-all duration-1000 transform ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">About Us</h1>
          <div className="w-24 h-1 mx-auto bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
        </header>

        {/* Goal Section */}
        <div id="goal-section" className={`animate-on-scroll mb-16 transition-all duration-1000 transform ${visibleSection === 'goal-section' ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="max-w-3xl mx-auto bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
            <h2 className="text-3xl font-semibold mb-6 text-left">Our Mission</h2>
            <p className="text-lg text-gray-300 text-left leading-relaxed">
            We offer comprehensive training programs designed to help students learn how to identify various disease symptoms effectively. By utilizing virtual interactive patients, students can practice diagnosing medical conditions in a simulated environment, enabling them to gain hands-on experience. The platform allows learners to interact with virtual patients, assess their symptoms, and make informed decisions regarding the most suitable course of treatment. This method enhances their ability to prescribe the right medications and treatments based on individual patient profiles. Through this innovative approach, students not only build their clinical skills but also gain confidence in handling real-life medical scenarios.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div id="team-section" className={`animate-on-scroll mb-16 transition-all duration-1000 transform ${visibleSection === 'team-section' ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h2 className="text-3xl font-semibold mb-8 text-center">Meet Our Team</h2>
          <div className="developers-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {developers.map((developer, index) => (
              <div 
                key={index} 
                className="developer-card relative overflow-hidden bg-gray-800 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="p-6 text-center relative z-10">
                  <div className="w-20 h-20 mx-auto mb-4 p-3 bg-gray-700 rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-gray-600">
                    <img
                      src={developer.githubLogo}
                      alt={`${developer.name} GitHub Logo`}
                      className="w-full h-full"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-1">{developer.name}</h3>
                  <p className="text-gray-400 mb-4">{developer.role}</p>
                  <a
                    href={developer.githubLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-gray-700 text-blue-400 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    GitHub Profile
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Section */}

        
{/* Technologies Section */}
<div id="tech-section" className="mb-16">
  <div className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-xl shadow-lg">
    <h2 className="text-3xl font-semibold mb-6 text-center">Technologies We Use</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
      <div className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
        <div className="text-4xl mb-2">🐍</div>
        <p className="font-medium">Flask</p>
      </div>
      <div className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
        <div className="text-4xl mb-2">⚛️</div>
        <p className="font-medium">React</p>
      </div>
      <div className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
        <div className="text-4xl mb-2">🔑</div>
        <p className="font-medium">JWT</p>
      </div>
      <div className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
        <div className="text-4xl mb-2">🍃</div>
        <p className="font-medium">MongoDB</p>
      </div>
      <div className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
        <div className="text-4xl mb-2">🔒</div>
        <p className="font-medium">Bcrypt</p>
      </div>
      <div className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
        <div className="text-4xl mb-2">🤖</div>
        <p className="font-medium">Transformers</p>
      </div>
      <div className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
        <div className="text-4xl mb-2">🔥</div>
        <p className="font-medium">PyTorch</p>
      </div>
      <div className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
        <div className="text-4xl mb-2">📝</div>
        <p className="font-medium">Sentence-Transformers</p>
      </div>
    </div>
  </div>
</div>

        {/* Contact Us Section */}
        <div id="contact-section" className={`animate-on-scroll mb-16 transition-all duration-1000 transform ${visibleSection === 'contact-section' ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-semibold mb-6">Get In Touch</h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Have any questions or looking to collaborate? We'd love to hear from you. Reach out through any of the channels below.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <a href="#" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <span>✉️</span> Email Us
              </a>
              <a href="#" className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                <span>🔗</span> LinkedIn
              </a>
              <a href="#" className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2">
                <span>📞</span> Call Us
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-gray-900 text-white py-2 shadow-md flex justify-between items-center border-t border-gray-800 z-50">
        <div className="ml-4">
          <button onClick={handleNavbarClick} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <div className="burger-icon">
              <div className="bar1 bg-white"></div>
              <div className="bar2 bg-white"></div>
              <div className="bar3 bg-white"></div>
            </div>
          </button>
        </div>
        <div className="mr-4">
          <button
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
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