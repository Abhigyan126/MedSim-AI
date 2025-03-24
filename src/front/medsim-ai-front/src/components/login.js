import "../styles/blob.css";

const Login = () => {
    return (
        <div className="flex h-screen">
        {/* Left Side (50%) */}
        <div className="w-1/2 flex justify-center items-center">
        <img src="/images/logo.png" alt="Logo" width="300" height="300" className="blob " />
        </div>

        {/* Right Side (50%) */}
        <div className="w-1/2">
            {/* Other content */}
        </div>
        </div>

    );
};

export default Login;

