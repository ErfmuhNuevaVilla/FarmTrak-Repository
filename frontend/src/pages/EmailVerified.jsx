import { Link } from "react-router-dom"
import { useNavigate } from "react-router-dom"

export default function EmailVerified() {
  const navigate = useNavigate()

  const handleGoToLogin = () => {
    navigate("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4
                    bg-gradient-to-b from-[#0f6b3a] via-[#2fae63] to-[#a8e07b]">
      
      {/* Glass Card */}
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl 
                      bg-white/15 backdrop-blur-lg 
                      border border-white/30 
                      shadow-2xl">

        {/* Success Icon */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-500 rounded-full flex items-center justify-center">
              <svg 
                className="w-12 h-12 sm:w-16 sm:h-16 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img 
              src="/Farmtrak.png" 
              alt="FarmTrak Logo" 
              className="w-16 h-16 sm:w-20 sm:h-20"
            />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Email Verified!
          </h1>
          <p className="text-green-100 text-sm sm:text-base">
            Your email has been successfully verified
          </p>
        </div>

        {/* Success Message */}
        <div className="bg-green-500/20 border border-green-300/40 rounded-xl p-4 mb-6">
          <div className="text-center">
            <p className="text-white text-sm sm:text-base">
              Thank you for confirming your email address. Your account is now active and ready to use.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleGoToLogin}
          className="w-full py-3 rounded-xl font-semibold text-white
                     bg-green-600 hover:bg-green-500 transition cursor-pointer
                     shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          Go to Login
        </button>

        {/* Additional Info */}
        <div className="text-center mt-6">
          <p className="text-green-100 text-xs sm:text-sm">
            You can now login with your credentials
          </p>
        </div>
      </div>
    </div>
  )
}
