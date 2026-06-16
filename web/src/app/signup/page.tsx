"use client";

import { useAuth } from "@/context/AuthContext";
import React, { useState } from "react";
import BgImage from "../../../public/signupbg.jpeg";
import { toast } from "sonner";
import Image from "next/image";

const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signup } = useAuth();

  const handleSumit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.promise(signup(name, email, password), {
      loading: "Creating your account...",
      success: "Account created successfully!",
      error: (err) => err.message || "Failed to create account",
    });
  };
  return (
    <div className="grid grid-cols-[.75fr_1fr] overflow-hidden h-screen w-screen bg-[#1d1c1c]">
      <div className="overflow-hidden relative">
        <Image
          src={BgImage}
          alt="Background"
          priority
          placeholder="blur"
          fill
          // className="object-co/ver"
        />
        <div className="absolute grid place-items-end h-full w-full bg-linear-to-b from-transparent  via-black/40 to-black">
          <div className="flex flex-col justify-center gap-2 p-6 h-[40%]">
            <h1 className="text-4xl font-bold">Welcome to Replay!</h1>
            <p>
              Replay is a powerful tool that allows you to record and share your
              terminal sessions with ease.
            </p>
            <div className="absolute bottom-0 left-0 w-full p-4 text-center text-white/50 text-sm">
              &copy; {new Date().getFullYear()} Replay. All rights reserved.
            </div>
          </div>
        </div>
      </div>
      <div className="grid place-items-center overflow-hidden">
        <div>
          <div className="flex flex-col justify-center items-center py-6">
            <h1 className="font-bold text-3xl">Create an Account</h1>
            <p className="text-gray-500">
              Please fill in the details to create your account.
            </p>
          </div>
          <form
            onSubmit={(e) => handleSumit(e)}
            className="flex flex-col gap-2"
          >
            <div className="flex flex-col">
              <label className="font-bold" htmlFor="name">
                Name
              </label>
              <input
                onChange={(e) => setName(e.target.value)}
                className="p-2 text-white bg-[#333] rounded-md border border-gray-600
          "
                type="text"
                id="name"
                placeholder="Name"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-bold" htmlFor="email">
                Email
              </label>
              <input
                onChange={(e) => setEmail(e.target.value)}
                className="p-2 text-white bg-[#333] rounded-md border border-gray-600
          "
                type="email"
                id="email"
                placeholder="Email"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-bold" htmlFor="password">
                Password
              </label>
              <input
                onChange={(e) => setPassword(e.target.value)}
                className="p-2 text-white bg-[#333] rounded-md border border-gray-600
          "
                type="password"
                id="password"
                placeholder="Password"
              />
            </div>
            <div className="flex flex-col items-end py-2">
              <button
                className="py-1 px-3 bg-green-400 cursor-pointer text-white font-bold transition-opacity hover:opacity-80 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                type="submit"
              >
                Sign Up
              </button>
              <p className="self-start">
                Already have an account? <a href="/signin">Log In</a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
