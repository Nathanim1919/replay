"use client";

import { useAuth } from "@/context/AuthContext";
import React, {useState} from "react";

const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const {signup} = useAuth();

  const handleSumit = async (e: React.FormEvent) => {
    e.preventDefault();
    signup(name, email, password);
  }
  return (
    <div className="grid place-items-center h-screen w-screen overflow-hidden bg-amber-100">
    <div className="border p-4 grid gap-4 min-w-75 max-w-sm w-full  shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex flex-col justify-center items-center">
        <h1 className="font-bold text-3xl">Create an Account</h1>
        <p className="text-gray-500">Please fill in the details to create your account.</p>
      </div>
      <form 
      onSubmit={(e)=>handleSumit(e)}
      className="flex flex-col gap-2">
          <div className="flex flex-col">
          <label className="font-bold" htmlFor="name">Name</label>
          <input
                    onChange={(e)=>setName(e.target.value)}

           className="p-2 bg-gray-100 text-black rounded-md border border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
          " type="text" id="name" placeholder="Name" />
        </div>
        <div className="flex flex-col">
          <label className="font-bold" htmlFor="email">Email</label>
          <input
                    onChange={(e)=>setEmail(e.target.value)}

           className="p-2 bg-gray-100 text-black rounded-md border border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
          " type="email" id="email" placeholder="Email" />
        </div>
        <div className="flex flex-col">
          <label className="font-bold" htmlFor="password">Password</label>
          <input
            onChange={(e)=>setPassword(e.target.value)}
           className="p-2 bg-gray-100 text-black rounded-md border border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
          " type="password" id="password" placeholder="Password" />
        </div>
        <div>
        <button
        className="py-1 px-3 bg-green-400 cursor-pointer self-end text-white font-bold transition-opacity hover:opacity-80 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
         type="submit">Sign Up</button>
        </div>
      </form>
      <div>
        <p>Already have an account? <a href="/login">Log In</a></p>
      </div>
    </div>

    </div>
  );
};

export default SignupPage;