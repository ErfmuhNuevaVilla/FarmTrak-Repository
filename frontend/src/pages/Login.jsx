import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { apiFetch } from "../lib/api"
import { setSession } from "../lib/auth"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })

      setSession({ token: data.token, user: data.user })
      navigate("/dashboard") // redirect to dashboard
    } catch (err) {
      setError(err?.message || "Login failed")
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

        {/* Logo / Title */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/Farmtrak.png" 
              alt="FarmTrak Logo" 
              className="w-24 h-24 sm:w-32 sm:h-32"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">FarmTrak</h1>
          <p className="text-green-100 mt-1 text-sm sm:text-base">Farm Management System</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error ? (
            <div className="rounded-xl bg-red-500/20 border border-red-300/40 px-4 py-3 text-sm text-red-50">
              {error}
            </div>
          ) : null}
          
          {/* Email */}
          <div>
            <label className="block text-sm text-green-100 mb-1">
              Email <span className="text-red-300">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl
                         bg-white/80 text-gray-900
                         placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-green-100 mb-1">
              Password <span className="text-red-300">*</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
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
                       bg-green-600 hover:bg-green-500 transition cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Enter FarmTrak"}
          </button>
        </form>
      </div>
    </div>
  )
}
