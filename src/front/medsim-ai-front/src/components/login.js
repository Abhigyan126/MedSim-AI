import "../styles/blob.css";


/* Creates a verticle divider at the center of the page */
function VerticalDivider() {
    return (
      <div className="flex items-center justify-center h-256">
        <div className="blob h-3/4 w-1 bg-gray-500 self-center"></div>
      </div>
    );
  }
  

const Login = () => {
    return (
        <div className="flex h-screen">
        {/* Left Side (50%) */}
        <div className="w-1/2 flex justify-center items-center">
        <img src="/images/logo.png" alt="Logo" width="350" height="350" className="blob " />
        </div>
        <VerticalDivider />
        {/* Right Side (50%) */}
        <div className="w-1/2">
            {/* Other content */}
        </div>
        </div>

    );
};

export default Login;

