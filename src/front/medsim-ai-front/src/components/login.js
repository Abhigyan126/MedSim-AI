import "../styles/blob.css";
import { useState } from "react";
import API from "./api";
import { useNavigate } from "react-router-dom";

/* Eye Icon Component for Password Toggle */
const EyeIcon = ({ showPassword, toggleShowPassword }) => {
  return (
    <button
      type="button"
      onClick={toggleShowPassword}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 focus:outline-none"
    >
      {showPassword ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      )}
    </button>
  );
};

/* Vertical Divider Component */
function VerticalDivider() {
  return (
    <div className="flex items-center justify-center h-256">
      <div className="blob h-3/4 w-1 bg-gray-500 self-center"></div>
    </div>
  );
}

/* Login/Signup Button Component */
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

/* Login Form Component */
function LoginForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  const [showPassword, setShowPassword] = useState(false);

  const validationRules = {
    email: {
      regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Email format is example@email.com",
    },
    password: {
      regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      message: "Minimum 8 characters long with uppercase, lowercase, number & special character.",
    },
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));

    if (validationRules[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: validationRules[field].regex.test(value) ? "" : validationRules[field].message,
      }));
    }
  };

  async function OnSubmitLogin() {
    const emptyFields = Object.keys(formData).filter((field) => !formData[field].trim());
    const errorMessages = Object.keys(errors).filter((field) => errors[field]);
  
    if (emptyFields.length > 0) {
      alert(`Please fill in: ${emptyFields.join(", ")}`);
    } else if (errorMessages.length > 0) {
      alert(`Invalid input in: ${errorMessages.join(", ")}`);
    } else {
      try {
        const response = await API.post("/login", JSON.stringify(formData));
        if (response.status === 200) {
          navigate('/home');
        } else {
          alert("Login failed! Please check your credentials.", response);
        }
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    }
  }  

  return (
    <div className="w-1/2 flex justify-center items-center">
      <div className="flex flex-col items-center space-y-4 w-80">
        <h1 className="text-3xl font-bold">Login</h1>
        <div className="w-full">
          <input
            type="text"
            placeholder="Email"
            className="w-full h-12 px-4 border-2 border-black rounded-full text-xl focus:outline-none"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
          />
          {touched.email && errors.email && (
            <p className="text-red-500 text-sm mt-1 font-bold text-center">{errors.email}</p>
          )}
        </div>
        <div className="w-full relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full h-12 px-4 border-2 border-black rounded-full text-xl focus:outline-none"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
          />
          <EyeIcon 
            showPassword={showPassword} 
            toggleShowPassword={() => setShowPassword(!showPassword)} 
          />
          {touched.password && errors.password && (
            <p className="text-red-500 text-sm mt-1 font-bold text-center">{errors.password}</p>
          )}
        </div>
        <button
          className="w-full h-12 border-2 border-black bg-white text-black text-2xl flex items-center justify-center rounded-full hover:bg-black hover:text-white"
          onClick={OnSubmitLogin}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

/* Signup Form Component */
function SignupForm({ setActiveForm }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validationRules = {
    username: {
      regex: /^[a-z][a-z0-9_]{4,14}$/,
      message: "Username must be 5-15 chars, start with a letter, and contain only lowercase letters, numbers, and underscores.",
    },
    email: {
      regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Invalid email format. Use example@email.com",
    },
    password: {
      regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character.",
    },
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));

    if (validationRules[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: validationRules[field].regex.test(value) ? "" : validationRules[field].message,
      }));
    }

    if (field === "confirmPassword") {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: value === formData.password ? "" : "Passwords do not match",
      }));
    }
  };

  async function OnSubmitSignup() {
    const emptyFields = Object.keys(formData).filter((field) => !formData[field].trim());
    const errorMessages = Object.keys(errors).filter((field) => errors[field]);
  
    if (emptyFields.length > 0) {
      alert(`Please fill in: ${emptyFields.join(", ")}`);
    } else if (errorMessages.length > 0) {
      alert(`Invalid input in: ${errorMessages.join(", ")}`);
    } else {
      try {
        const { confirmPassword, ...dataToSend } = formData;
        const response = await API.post("/signup", JSON.stringify(dataToSend));
        alert(`Signup successful: ${response.data.message}`);
        setActiveForm("login");
      } catch (error) {
        alert(`Signup failed: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  return (
    <div className="w-1/2 flex justify-center items-center">
      <div className="flex flex-col items-center space-y-4 w-80">
        <h1 className="text-3xl font-bold">Sign Up</h1>
        <div className="w-full">
          <input
            type="text"
            placeholder="Username"
            className="w-full h-12 px-4 border-2 border-black rounded-full text-xl focus:outline-none"
            value={formData.username}
            onChange={(e) => handleInputChange("username", e.target.value)}
          />
          {touched.username && errors.username && (
            <p className="text-red-500 text-sm mt-1 font-bold text-center">{errors.username}</p>
          )}
        </div>
        <div className="w-full">
          <input
            type="text"
            placeholder="Email"
            className="w-full h-12 px-4 border-2 border-black rounded-full text-xl focus:outline-none"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
          />
          {touched.email && errors.email && (
            <p className="text-red-500 text-sm mt-1 font-bold text-center">{errors.email}</p>
          )}
        </div>
        <div className="w-full relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full h-12 px-4 border-2 border-black rounded-full text-xl focus:outline-none"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
          />
          <EyeIcon 
            showPassword={showPassword} 
            toggleShowPassword={() => setShowPassword(!showPassword)} 
          />
          {touched.password && errors.password && (
            <p className="text-red-500 text-sm mt-1 font-bold text-center">{errors.password}</p>
          )}
        </div>
        <div className="w-full relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            className="w-full h-12 px-4 border-2 border-black rounded-full text-xl focus:outline-none"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
          />
          <EyeIcon 
            showPassword={showConfirmPassword} 
            toggleShowPassword={() => setShowConfirmPassword(!showConfirmPassword)} 
          />
          {touched.confirmPassword && errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1 font-bold text-center">{errors.confirmPassword}</p>
          )}
        </div>
        <button 
          onClick={OnSubmitSignup} 
          className="w-full h-12 border-2 border-black bg-white text-black text-2xl flex items-center justify-center rounded-full hover:bg-black hover:text-white"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}

/* Logo Component */
function ShowLogo() {
  return(
    <div className="w-1/2 flex justify-center items-center">
      <img src="/images/logo.png" alt="Logo" width="350" height="350" className="blob" />
    </div>
  );
}

/* Main Login Component */
const Login = () => {
  const [activeForm, setActiveForm] = useState("logo");

  let contentLeft;
  if (activeForm === "login") {
    contentLeft = <LoginForm />;
  } else if (activeForm === "signup") {
    contentLeft = <SignupForm setActiveForm={setActiveForm}/>;
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