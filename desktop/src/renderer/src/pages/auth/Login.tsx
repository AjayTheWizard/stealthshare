import { auth } from "@renderer/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router";

const Login = () => {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!email){
      toast.error("Email field is empty!")
    }

    if(!password){
      toast.error("Password field is empty");
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch (e){
      toast.error("Something went wrong! Try again")
    }
    
  }

  return (
    <div className="flex w-full min-h-screen justify-center items-center">
      <form onSubmit={submit} className="w-[50ch] rounded-2xl px-8 bg-zinc-800 py-5">
        <h1 className="text-2xl mb-8 text-center">Login To Your Account</h1>
        <div className="mb-4 flex flex-col gap-2">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="px-3 py-2 w-full outline-0 border border-green-800"
            value={email}
            onChange={e => setEmail(e.target.value)}
            name="email"
          />
        </div>
        <div className="mb-4 flex flex-col gap-2">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="px-3 py-2 w-full outline-0 border border-green-800"
            name="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <button className="w-full mb-4 py-3 text-md bg-green-800 hover:bg-green-700 focus:bg-green-700">Login</button>
        <h3 className="flex italic items-center gap-1 text-center">
          Don't have an Account?
          <Link to="/auth/signup" className="text-green-700 text-md">Create One</Link>
        </h3>
      </form>
    </div>
  )
}

export default Login;