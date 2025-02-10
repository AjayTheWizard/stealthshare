import React from 'react'
import ReactDOM from 'react-dom/client'
import "./assets/index.css";
import { BrowserRouter, Route, Routes } from 'react-router';
import Login from './pages/auth/Login';
import Loading from './pages/Loading';
import SignUp from './pages/auth/Signup';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Loading />} />
        <Route path='/auth/login' element={<Login />} />
        <Route path='/auth/signup' element={<SignUp />} />
        <Route path='/home' element={<Home/>} />
      </Routes>
    </BrowserRouter>
    <Toaster/>
  </React.StrictMode>
)
