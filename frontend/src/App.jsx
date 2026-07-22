import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { Routes, Route } from "react-router-dom";
import Landing from './pages/Landing'
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import LiveMap from "./pages/LiveMap";
import Dashboard from "./pages/Dashboard";

function App() {

  return (
  <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/map" element={<LiveMap />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  )
}

export default App
