import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from './modules/routes/login';
import Homepage from './modules/routes/home';
import Logout from './modules/routes/logout';
import Profile from './modules/routes/profile';
import Simulator from './modules/routes/symptom';
import '@fortawesome/fontawesome-free/css/all.min.css';
import About from './modules/routes/about';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Homepage />} />
        <Route path='/home' element={<Homepage />} />
        <Route path='/login' element={<Login />} />
        <Route path='/logout' element={<Logout />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/about' element={<About />} />
        <Route path='/symptom-simulator' element={<Simulator />} />
        </Routes>
    </Router>
  );
}

export default App;
