import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from './components/login';
import Homepage from './components/home';
import Logout from './components/logout';
import Profile from './components/profile';
import Simulator from './components/symptom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Homepage />} />
        <Route path='/home' element={<Homepage />} />
        <Route path='/login' element={<Login />} />
        <Route path='/logout' element={<Logout />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/symptom-simulator' element={<Simulator />} />
        </Routes>
    </Router>
  );
}

export default App;
