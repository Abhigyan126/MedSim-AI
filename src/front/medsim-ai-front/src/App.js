import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from './modules/routes/login';
import Homepage from './modules/routes/home';
import Logout from './modules/routes/logout';
import Profile from './modules/routes/profile';
import Simulator from './modules/routes/symptom';
import '@fortawesome/fontawesome-free/css/all.min.css';
import About from './modules/routes/about';
<<<<<<< HEAD
=======
import DiseaseCraft from './modules/routes/diseaseCraft';
import SymptomTree from './modules/routes/symptomtree';
>>>>>>> 4210440d5ddf95543f5b0819c36a3462642b7b5e

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
        <Route path='/symptomtree' element={<SymptomTree />} />
        <Route path='/diseaseCraft' element={<DiseaseCraft />} />
        <Route path='/symptom-simulator' element={<Simulator />} />
        </Routes>
    </Router>
  );
}

export default App;
