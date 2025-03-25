import "../styles/blob.css";

/* Creates a vertical divider at the center of the page */
function VerticalDivider() {
  return (
    <div className="flex items-center justify-center h-256">
      <div className="blob h-3/4 w-1 bg-gray-500 self-center"></div>
    </div>
  );
}

/*It creates login and signup buttons*/
function LoginButton() {
  return (
    <div className="flex flex-col items-center space-y-8">
      <button className="w-48 h-12 border-2 border-black bg-white text-black text-lg flex items-center justify-center rounded-full hover:bg-black hover:text-white">
        Login
      </button>
      <button className="w-48 h-12 border-2 border-black bg-white text-black text-lg flex items-center justify-center rounded-full hover:bg-black hover:text-white">
        Sign Up
      </button>
    </div>
  );
}

const Login = () => {
  return (
    <div className="flex h-screen">
      {/* Left Side (50%) */}
      <div className="w-1/2 flex justify-center items-center">
        <img src="/images/logo.png" alt="Logo" width="350" height="350" className="blob" />
      </div>

      <VerticalDivider />

      {/* Right Side (50%) */}
      <div className="w-1/2 flex justify-center items-center">  
        <LoginButton />
      </div>
    </div>
  );
};

export default Login;
