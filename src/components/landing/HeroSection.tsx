
'use client'

import { Home, Bed, Bath, Globe, Users, Shield, Zap } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';

const HeroSection = () => {
  const { user } = useAuth();
  return <div className="relative w-full h-screen min-h-[900px] flex flex-col">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <iframe src="https://player.cloudinary.com/embed/?cloud_name=djjokty1s&public_id=HEADER_VIDEO_-_Goal_Coach_Final_utc8xj&profile=cld-default&autoplay=true&loop=true&muted=true&controls=false" className="absolute inset-0 w-full h-full object-cover" style={{
        width: '100%',
        height: '100%',
        border: 'none',
        transform: 'scale(1.1)' // Slight scale to ensure no black bars
      }} allow="autoplay; fullscreen" allowFullScreen />
      </div>
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
      
      {/* Navigation Header */}
      <div className="relative z-10 w-full pt-4 md:pt-6 px-4 md:px-6">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
          {/* Logo */}
          <div className="flex items-center gap-3 order-1 md:order-1">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Globe className="w-2.5 h-2.5 md:w-3 md:h-3 text-black" />
            </div>
            <div className="text-white text-xs font-dm-mono font-medium uppercase tracking-wider-2 drop-shadow-lg">
              World's First Hybrid Coaching Platform
            </div>
          </div>

          {/* Auth Button */}
          <a 
            href={user ? "/dashboard" : "/auth"} 
            className="px-4 py-2 md:px-5 md:py-3 bg-white rounded-full shadow-xl backdrop-blur-sm text-black text-xs md:text-sm font-dm-mono font-medium uppercase tracking-wider-2 hover:bg-gray-100 hover:scale-105 hover:shadow-2xl transition-all duration-300 order-3"
          >
            {user ? "Go to Dashboard" : "Login / Sign Up"}
          </a>
        </div>
      </div>

      {/* Main Content - Left Aligned */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-start px-4 md:px-6 py-16 md:py-20">
        <div className="max-w-[1600px] mx-auto w-full">
          <div className="max-w-[800px]"> {/* Container to keep content left-aligned */}
            {/* Hero Title and Content */}
            <div className="flex flex-col gap-8 md:gap-10">
              {/* Main Title - Reduced by 20% */}
              <div>
                <h1 className="text-white font-inter text-3xl md:text-5xl lg:text-[70px] font-bold leading-tight md:leading-[1.1] lg:leading-[67px] tracking-tight drop-shadow-2xl">Achieve Your Goals With Coaching That Actually Works</h1>
                <p className="text-white/90 font-inter text-lg md:text-xl lg:text-2xl mt-6 md:mt-8 leading-relaxed max-w-[600px] drop-shadow-lg">
                  Weekly support from a real coach, enhanced with daily 10-minute voice check-ins with instant AI feedback.
                </p>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
                <div className="w-full sm:w-auto min-w-[160px] px-4 md:px-6 py-4 md:py-5 bg-white/10 backdrop-blur-md rounded-full border border-white/30 shadow-xl flex flex-col items-center gap-2.5 hover:scale-105 hover:bg-white/20 transition-all duration-300 group">
                  <Globe className="w-5 h-5 md:w-6 md:h-6 text-white/75 group-hover:text-white transition-colors duration-300" />
                  <div className="text-white text-sm font-inter font-medium text-center group-hover:scale-105 transition-transform duration-300">
                    Daily Clarity
                  </div>
                </div>
                
                <div className="w-full sm:w-auto min-w-[160px] px-4 md:px-6 py-4 md:py-5 bg-white/10 backdrop-blur-md rounded-full border border-white/30 shadow-xl flex flex-col items-center gap-2.5 hover:scale-105 hover:bg-white/20 transition-all duration-300 group">
                  <Shield className="w-5 h-5 md:w-6 md:h-6 text-white/75 group-hover:text-white transition-colors duration-300" />
                  <div className="text-white text-sm font-inter font-medium text-center group-hover:scale-105 transition-transform duration-300">
                    Human Coach
                  </div>
                </div>
                
                <div className="w-full sm:w-auto min-w-[160px] px-4 md:px-6 py-4 md:py-5 bg-white/10 backdrop-blur-md rounded-full border border-white/30 shadow-xl flex flex-col items-center gap-2.5 hover:scale-105 hover:bg-white/20 transition-all duration-300 group">
                  <Zap className="w-5 h-5 md:w-6 md:h-6 text-white/75 group-hover:text-white transition-colors duration-300" />
                  <div className="text-white text-sm font-inter font-medium text-center group-hover:scale-105 transition-transform duration-300">
                    8X Effectiveness
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default HeroSection;
