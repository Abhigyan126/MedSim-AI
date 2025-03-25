import "../styles/blob.css";
import { useState } from "react";


/* Creates a vertical divider at the center of the page */
function VerticalDivider() {
  return (
    <div className="flex items-center justify-center h-256">
      <div className="blob h-3/4 w-1 bg-gray-500 self-center"></div>
    </div>
  );
}


/* Creates a login and a signup button*/
function LoginButton({ setActiveForm }) {
  return (
    <div className="flex flex-col items-center space-y-8">
      <button onClick={() => setActiveForm("login")} className="w-60 h-12 border-2 border-black bg-white text-black text-3xl flex items-center justify-center rounded-full hover:bg-black hover:text-white">
        Login
      </button>
      <button onClick={() => setActiveForm("signup")} className="w-60 h-12 border-2 border-black bg-white text-black text-3xl flex items-center justify-center rounded-full hover:bg-black hover:text-white">
        Sign Up
      </button>
    </div>
  );
}

/* Creates a Login form  */
function LoginForm() {
  return (
    <div className="w-1/2 flex justify-center items-center">
      <div className="flex flex-col items-center space-y-6 w-80">
        <h1 className="text-3xl font-bold">Login</h1>
        <input type="text" placeholder="Emain" className="w-full h-12 px-4 border-2 border-black rounded-full text-xl focus:outline-none"
        />
        <input type="password" placeholder="Password" className="w-full h-12 px-4 border-2 border-black rounded-full text-xl focus:outline-none"
        />
        <button className="w-full h-12 border-2 border-black bg-white text-black text-2xl flex items-center justify-center rounded-full hover:bg-black hover:text-white">
          Submit
        </button>
      </div>
    </div>
  );
}

/* Creates a Signup form */
function SignupForm() {
  return (
    <div className="w-1/2 flex justify-center items-center">
      <div className="flex flex-col items-center space-y-6 w-80">
        <h1 className="text-3xl font-bold">Sign Up</h1>
        <input type="text" placeholder="Username" className="w-full h-12 px-4 border-2 border-black rounded-full text-xl focus:outline-none"
        />
        <input type="email" placeholder="Email" className="w-full h-12 px-4 border-2 border-black rounded-full text-xl focus:outline-none"
        />
        <input type="password" placeholder="Password" className="w-full h-12 px-4 border-2 border-black rounded-full text-xl focus:outline-none"
        />
        <input type="password" placeholder="Confirm Password" className="w-full h-12 px-4 border-2 border-black rounded-full text-xl focus:outline-none"
        />
        <button className="w-full h-12 border-2 border-black bg-white text-black text-2xl flex items-center justify-center rounded-full hover:bg-black hover:text-white">
          Sign Up
        </button>
      </div>
    </div>
  );
}

/* Creates LOGO with blob */
function ShowLogo() {
  return(
  <div className="w-1/2 flex justify-center items-center">
    <img src="/images/logo.png" alt="Logo" width="350" height="350" className="blob" />
  </div>
  );
}

const Login = () => {
  const [activeForm, setActiveForm] = useState("logo"); // "login", "signup", or "logo"

  let contentLeft;
  if (activeForm === "login") {
    contentLeft = <LoginForm />;
  } else if (activeForm === "signup") {
    contentLeft = <SignupForm />;
  } else {
    contentLeft = <ShowLogo />;
  }

  return (
    <div className="flex h-screen">
      {/* Left Side (50%) */}
      {contentLeft}

      {/* Centre */}
      <VerticalDivider />

      {/* Right Side (50%) */}
      <div className="w-1/2 flex justify-center items-center">  
          <LoginButton setActiveForm={setActiveForm} />
      </div>
    </div>
  );
};

export default Login;
