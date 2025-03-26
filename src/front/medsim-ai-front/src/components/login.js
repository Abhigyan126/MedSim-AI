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

  function OnSubmit() {
    const emptyFields = Object.keys(formData).filter((field) => !formData[field].trim());
    const errorMessages = Object.keys(errors).filter((field) => errors[field]);
  
    if (emptyFields.length > 0) {
      alert(`Please fill in: ${emptyFields.join(", ")}`);
    } else if (errorMessages.length > 0) {
      alert(`Invalid input in: ${errorMessages.join(", ")}`);
    } else {
      alert("Everything is OK");
    }
  }  

  return (
    <div className="w-1/2 flex justify-center items-center">
      <div className="flex flex-col items-center space-y-4 w-80">
        <h1 className="text-3xl font-bold">Login</h1>
        {["email", "password"].map((field) => (
          <div key={field} className="w-full">
            <input
              type={field === "password" ? "password" : "text"}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              className="w-full h-12 px-4 border-2 border-black rounded-full text-xl focus:outline-none"
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
            />
            {touched[field] && errors[field] && (
              <p className="text-red-500 text-sm mt-1 font-bold text-center">{errors[field]}</p>
            )}
          </div>
        ))}
        <button
  className="w-full h-12 border-2 border-black bg-white text-black text-2xl flex items-center justify-center rounded-full hover:bg-black hover:text-white"
  onClick={OnSubmit}>
  Submit
</button>

      </div>
    </div>
  );
}

/* Creates a Signup form */
function SignupForm() {
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

  const validationRules = {
    username: {
      regex: /^[a-z][a-z0-9_]{4,14}$/,
      message:
        "Username must be 5-15 chars, start with a letter, and contain only lowercase letters, numbers, and underscores.",
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

  function SubmitSignup() {
    const emptyFields = Object.keys(formData).filter((field) => !formData[field].trim());
    const errorMessages = Object.keys(errors).filter((field) => errors[field]);
  
    if (emptyFields.length > 0) {
      alert(`Please fill in: ${emptyFields.join(", ")}`);
    } else if (errorMessages.length > 0) {
      alert(`Invalid input in: ${errorMessages.join(", ")}`);
    } else {
      alert("Everything is OK");
    }
  }  
  
  return (
    <div className="w-1/2 flex justify-center items-center">
      <div className="flex flex-col items-center space-y-4 w-80">
        <h1 className="text-3xl font-bold">Sign Up</h1>
        {["username", "email", "password", "confirmPassword"].map((field) => (
          <div key={field} className="w-full">
            <input
              type={field.toLowerCase().includes("password") ? "password" : "text"}
              placeholder={field.toLowerCase().includes("confirmpassword") ? "Confirm Password" : field.charAt(0).toUpperCase() + field.slice(1)}
              className="w-full h-12 px-4 border-2 border-black rounded-full text-xl focus:outline-none"
              value={formData[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
            />
            {touched[field] && errors[field] && (
              <p className="text-red-500 text-sm mt-1 font-bold text-center">{errors[field]}</p>
            )}
          </div>
        ))}
        <button className="w-full h-12 border-2 border-black bg-white text-black text-2xl flex items-center justify-center rounded-full hover:bg-black hover:text-white" onClick={SubmitSignup}>
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
