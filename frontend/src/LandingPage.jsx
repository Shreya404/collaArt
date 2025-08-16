import React from "react";
import { useNavigate } from "react-router-dom";
import illustration from "./assets/doodle.png";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f9fafe] font-sans relative overflow-hidden">
      {/* Main Content */}
      <div className="flex flex-col items-center text-center mb-64 px-6 z-20">
        <h1 className="font-borel text-4xl sm:text-5xl text-gray-800">
          colla
          <span className="text-violet-500">Art</span>: Collaborate with Art&nbsp;!
        </h1>
        <p className="mt-4 text-gray-400 max-w-2xl font-poppins sm:text-md text-sm leading-relaxed">
          Whether you're a creative, an entrepreneur, or a team, our
          dynamic collaborative board fosters creativity, productivity,
          and collective success.
        </p>
        <button
          className="mt-8 font-poppins bg-gradient-to-br from-blue-200 to-violet-400 hover:scale-110 ease-in-out duration-300 text-gray-700 px-6 py-3 rounded-lg text-md font-medium shadow-md transition"
          onClick={() => navigate("/board")}
        >
          Start a new board
        </button>
      </div>

      {/* Bottom Illustration */}
      <div className="fixed bottom-8 scale-125 w-full flex justify-center z-10">
        <img
          src={illustration}
          alt="Illustration"
          className="w-3/4 max-w-3xl object-contain"
        />
      </div>
    </div>
  );
};

export default LandingPage;
