import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "../lib/supabase"

export default function UpdatePassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
 

  useEffect(() => {
  const checkSession = async () => {
    const { data } = await supabase.auth.getSession()

    if (!data.session) {
      setError("Invalid or expired password reset link")
      setTimeout(() => {
        navigate("/login")
      }, 3000)
    }
  }

  checkSession()
}, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    if (!password || password.trim() === "") {
      setError("Please enter a new password")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        throw error
      }

      setSuccess("Password updated successfully! Redirecting to login...")
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login")
      }, 2000)
    } catch (err) {
      setError(err?.message || "Failed to update password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4
                    bg-gradient-to-b from-[#0f6b3a] via-[#2fae63] to-[#a8e07b]">
      
      {/* Glass Card */}
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl 
                      bg-white/15 backdrop-blur-lg 
                      border border-white/30 
                      shadow-2xl">

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/Farmtrak.png" 
              alt="FarmTrak Logo" 
              className="w-20 h-20 sm:w-24 sm:h-24"
            />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Update Password
          </h1>
          <p className="text-green-100 text-sm sm:text-base">
            Enter your new password
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error ? (
            <div className="rounded-xl bg-red-500/20 border border-red-300/40 px-4 py-3 text-sm text-red-50">
              {error}
            </div>
          ) : null}
          
          {success ? (
            <div className="rounded-xl bg-green-500/20 border border-green-300/40 px-4 py-3 text-sm text-green-50">
              {success}
            </div>
          ) : null}
          
          {/* New Password */}
          <div>
            <label className="block text-sm text-green-100 mb-1">
              New Password <span className="text-red-300">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl
                         bg-white/80 text-gray-900
                         placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm text-green-100 mb-1">
              Confirm New Password <span className="text-red-300">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl
                         bg-white/80 text-gray-900
                         placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white
                       bg-green-600 hover:bg-green-500 transition cursor-pointer 
                       disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        {/* Back to Login */}
        <div className="text-center mt-6">
          <p className="text-green-100 text-sm sm:text-base">
            Remember your password?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-white font-semibold hover:underline"
            >
              Back to Login
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
