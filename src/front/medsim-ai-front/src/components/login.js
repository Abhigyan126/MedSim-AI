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
  const [email, setEmail] = useState("");
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [password, setPassword] = useState("");
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const validateEmail = (value) => {
    if (!touchedEmail) setTouchedEmail(true);
    setEmail(value);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(value)) {
      setEmailError("");
    } else {
      setEmailError("Email format is example@email.com");
    }
  };

  const validatePassword = (value) => {
    if (!touchedPassword) setTouchedPassword(true);
    setPassword(value);
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (passwordRegex.test(value)) {
      setPasswordError("");
    } else {
      setPasswordError("Minimum 8 characters long and correct format needed");
    }
  };

  return (
    <div className="w-1/2 flex justify-center items-center">
      <div className="flex flex-col items-center space-y-4 w-80">
        <h1 className="text-3xl font-bold">Login</h1>
        <div className="w-full">
          <input
            type="text"
            placeholder="Email"
            className="w-full h-12 px-4 border-2 border-black rounded-full text-xl focus:outline-none"
            value={email}
            onChange={(e) => validateEmail(e.target.value)}
          />
          {touchedEmail && emailError && (
            <p className="text-red-500 text-sm mt-1">{emailError}</p>
          )}
        </div>
        <div className="w-full">
          <input
            type="password"
            placeholder="Password"
            className="w-full h-12 px-4 border-2 border-black rounded-full text-xl focus:outline-none"
            value={password}
            onChange={(e) => validatePassword(e.target.value)}
          />
          {touchedPassword && passwordError && (
            <p className="text-red-500 text-sm mt-1">{passwordError}</p>
          )}
        </div>
        <button className="w-full h-12 border-2 border-black bg-white text-black text-2xl flex items-center justify-center rounded-full hover:bg-black hover:text-white">
          Submit
        </button>
      </div>
    </div>
  );
}

/* Creates a Signup form */

function SignupForm() {
  const [username, setUsername] = useState("");
  const [touchedUsername, setTouchedUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  const [email, setEmail] = useState("");
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [password, setPassword] = useState("");
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");
  const [touchedConfirmPassword, setTouchedConfirmPassword] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const validateUsername = (value) => {
    if (!touchedUsername) setTouchedUsername(true);
    setUsername(value);
    // Username must start with a letter, 5-15 characters, only lowercase, numbers and underscore allowed after first letter, no spaces or emoji.
    const usernameRegex = /^[a-z][a-z0-9_]{4,14}$/;
    if (usernameRegex.test(value)) {
      setUsernameError("");
    } else {
      setUsernameError("Username must be 5-15 chars, start with a letter, and contain only lowercase letters, numbers, and underscores (no spaces).");
    }
  };

  const validateEmail = (value) => {
    if (!touchedEmail) setTouchedEmail(true);
    setEmail(value);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(value)) {
      setEmailError("");
    } else {
      setEmailError("Email format is example@email.com");
    }
  };

  const validatePassword = (value) => {
    if (!touchedPassword) setTouchedPassword(true);
    setPassword(value);
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (passwordRegex.test(value)) {
      setPasswordError("");
    } else {
      setPasswordError("Minimum 8 characters long and correct format needed");
    }
    // Also validate confirm password if already entered
    if (touchedConfirmPassword) {
      if (confirmPassword !== value) {
        setConfirmPasswordError("Passwords do not match");
      } else {
        setConfirmPasswordError("");
      }
    }
  };

  const validateConfirmPassword = (value) => {
    if (!touchedConfirmPassword) setTouchedConfirmPassword(true);
    setConfirmPassword(value);
    if (value === password) {
      setConfirmPasswordError("");
    } else {
      setConfirmPasswordError("Passwords do not match");
    }
  };

  return (
    <div className="w-1/2 flex justify-center items-center">
      <div className="flex flex-col items-center space-y-4 w-80">
        <h1 className="text-3xl font-bold">Sign Up</h1>
        <div className="w-full">
          <input
            type="text"
            placeholder="Username"
            className="w-full h-12 px-4 border-2 border-black rounded-full text-xl focus:outline-none"
            value={username}
            onChange={(e) => validateUsername(e.target.value)}
          />
          {touchedUsername && usernameError && (
            <p className="text-red-500 text-sm mt-1">{usernameError}</p>
          )}
        </div>
        <div className="w-full">
          <input
            type="email"
            placeholder="Email"
            className="w-full h-12 px-4 border-2 border-black rounded-full text-xl focus:outline-none"
            value={email}
            onChange={(e) => validateEmail(e.target.value)}
          />
          {touchedEmail && emailError && (
            <p className="text-red-500 text-sm mt-1">{emailError}</p>
          )}
        </div>
        <div className="w-full">
          <input
            type="password"
            placeholder="Password"
            className="w-full h-12 px-4 border-2 border-black rounded-full text-xl focus:outline-none"
            value={password}
            onChange={(e) => validatePassword(e.target.value)}
          />
          {touchedPassword && passwordError && (
            <p className="text-red-500 text-sm mt-1">{passwordError}</p>
          )}
        </div>
        <div className="w-full">
          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full h-12 px-4 border-2 border-black rounded-full text-xl focus:outline-none"
            value={confirmPassword}
            onChange={(e) => validateConfirmPassword(e.target.value)}
          />
          {touchedConfirmPassword && confirmPasswordError && (
            <p className="text-red-500 text-sm mt-1">{confirmPasswordError}</p>
          )}
        </div>
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
