import React, { useState, useEffect } from "react";
 import Chatbot from "../components/chatbot";
 import Sidebar from "../components/sidebar";
 import "../../styles/blob.css";

 // issue #44 :About us page - start
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

// Static About Us Component
// File: AboutContent.js
const AboutContent = () => {
  return (
    <div className="w-full bg-gray-900 text-white py-12 px-4">
      {/* Header */}
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold mb-4 tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          About Us
        </h1>
        <div className="w-24 h-1 mx-auto bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
      </header>

      {/* Mission Section */}
      <section id="goal-section" className="max-w-3xl mx-auto mb-16 bg-gray-800 p-8 rounded-xl border border-gray-700">
        <h2 className="text-3xl font-semibold mb-4">Our Mission</h2>
        <p className="text-lg text-gray-300 leading-relaxed">
          We offer comprehensive training programs designed to help students learn how to identify various disease symptoms effectively. By utilizing virtual interactive patients, students can practice diagnosing medical conditions in a simulated environment, enabling them to gain hands-on experience. The platform allows learners to interact with virtual patients, assess their symptoms, and make informed decisions regarding the most suitable course of treatment. This method enhances their ability to prescribe the right medications and treatments based on individual patient profiles. Through this innovative approach, students not only build their clinical skills but also gain confidence in handling real-life medical scenarios.
        </p>
      </section>

      {/* Team Section */}
      <section id="team-section" className="max-w-6xl mx-auto mb-16">
        <h2 className="text-3xl font-semibold mb-8 text-center">Meet Our Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {developers.map((dev, idx) => (
            <div key={idx} className="bg-gray-800 p-6 rounded-xl shadow-lg text-center">
              <div className="w-20 h-20 mx-auto mb-4 p-3 bg-gray-700 rounded-full flex items-center justify-center">
                <img src={dev.githubLogo} alt={`${dev.name} GitHub Logo`} className="w-full h-full" />
              </div>
              <h3 className="text-xl font-semibold mb-1">{dev.name}</h3>
              <p className="text-gray-400 mb-4">{dev.role}</p>
              <a href={dev.githubLink} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 bg-gray-700 text-blue-400 rounded-lg hover:bg-gray-600 transition-colors">
                GitHub Profile
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Technologies Section */}
      <section id="tech-section" className="max-w-4xl mx-auto mb-16 bg-gray-800 p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-semibold mb-6 text-center">Technologies We Use</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 bg-gray-700 rounded-lg">
            <div className="text-4xl mb-2">🐍</div>
            <p className="font-medium">Flask</p>
          </div>
          <div className="p-4 bg-gray-700 rounded-lg">
            <div className="text-4xl mb-2">⚛️</div>
            <p className="font-medium">React</p>
          </div>
          <div className="p-4 bg-gray-700 rounded-lg">
            <div className="text-4xl mb-2">🔑</div>
            <p className="font-medium">JWT</p>
          </div>
          <div className="p-4 bg-gray-700 rounded-lg">
            <div className="text-4xl mb-2">🍃</div>
            <p className="font-medium">MongoDB</p>
          </div>
          <div className="p-4 bg-gray-700 rounded-lg">
            <div className="text-4xl mb-2">🔒</div>
            <p className="font-medium">Bcrypt</p>
          </div>
          <div className="p-4 bg-gray-700 rounded-lg">
            <div className="text-4xl mb-2">🤖</div>
            <p className="font-medium">Transformers</p>
          </div>
          <div className="p-4 bg-gray-700 rounded-lg">
            <div className="text-4xl mb-2">🔥</div>
            <p className="font-medium">PyTorch</p>
          </div>
          <div className="p-4 bg-gray-700 rounded-lg">
            <div className="text-4xl mb-2">📝</div>
            <p className="font-medium">Sentence-Transformers</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact-section" className="max-w-3xl mx-auto text-center bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-semibold mb-6">Get In Touch</h2>
        <p className="text-lg text-gray-300 mb-8">
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
      </section>
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
         <div>
             {showNavbar && <Sidebar username="" name="" />}

             <div>
                 {<AboutContent />}
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
