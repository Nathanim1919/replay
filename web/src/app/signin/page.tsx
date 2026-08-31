"use client";

import { useAuth } from "@/context/AuthContext";
import React, {useState} from "react";
import { toast } from "sonner";
import BgImage from "../../../public/signupbg.jpeg";
import Image from "next/image";
import Link from "next/link";

const SigninPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const {login} = useAuth();

  const handleSumit = async (e: React.FormEvent) => {
    e.preventDefault();
    // login(email, password);
    // Inside your Login Page component
    toast.promise(login(email, password), {
      loading: 'Logging you in...',
      success: 'Welcome back!',
      error: (err) => err.message || 'Login failed',
    });
  }



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
            <h1 className="text-4xl font-bold">
              Yo!, Welcome Back to Replay!
            </h1>
            <p>
              Let&apos;s get you back into your account and continue sharing your terminal sessions with ease.
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
            <h1 className="font-bold text-3xl">Sign In</h1>
            <p className="text-gray-500">
              Please fill in the details to sign in to your account.
            </p>
          </div>
          <form
            onSubmit={(e) => handleSumit(e)}
            className="flex flex-col gap-2"
          >
           
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
                Sign In
              </button>
              <p className="self-start text-xs text-gray-400 mt-2">
                Don't have an account?{" "}
                <Link
                  href={
                    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("redirect")
                      ? `/signup?redirect=${encodeURIComponent(new URLSearchParams(window.location.search).get("redirect")!)}`
                      : "/signup"
                  }
                  className="text-green-400 font-bold hover:underline"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SigninPage;
