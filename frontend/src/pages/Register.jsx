import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import { signUp } from "../lib/auth"

export default function Register() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "worker",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const result = await signUp(formData.email, formData.password, formData.name, formData.role)
      
      // Show success message and redirect to login
      setSuccess("Account created successfully! Please login with your credentials.")
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login")
      }, 2000)
    } catch (err) {
      setError(err?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-green-500 via-green-400 to-yellow-300">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-xl shadow-xl p-6 sm:p-8">
        
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex justify-center mb-4">
            <img 
              src="/Farmtrak.png" 
              alt="FarmTrak Logo" 
              className="w-20 h-20 sm:w-24 sm:h-24"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-800">FarmTrak</h1>
          <p className="text-xs sm:text-sm text-green-700 mt-1">
            Create your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-lg bg-red-100 border border-red-200 px-4 py-2 text-sm text-red-800">
              {error}
            </div>
          ) : null}
          
          {success ? (
            <div className="rounded-lg bg-green-100 border border-green-200 px-4 py-2 text-sm text-green-800">
              {success}
            </div>
          ) : null}
          
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-green-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-green-500
                       bg-white text-gray-800"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-green-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-green-500
                       bg-white text-gray-800"
          />

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-green-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-green-500
                       bg-white text-gray-800"
          >
            <option value="worker">Worker</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-green-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-green-500
                       bg-white text-gray-800"
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-green-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-green-500
                       bg-white text-gray-800"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white py-2 rounded-lg
                       hover:bg-green-800 transition font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-sm text-center text-green-800 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold hover:underline">
            Login
          </Link>
        </p>

      </div>
    </div>
  )
}
