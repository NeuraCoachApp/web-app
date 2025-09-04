
const GallerySection = () => {
    return <div className="w-full py-[100px] lg:py-[200px] px-4 lg:px-6 bg-background flex justify-center items-start">
        <div className="flex-1 max-w-[1600px] flex flex-col justify-start items-center gap-12 lg:gap-20">
  
          {/* Gallery Grid */}
          <div className="w-full flex flex-col gap-4 lg:gap-6">
            {/* First Row */}
            <div className="w-full flex flex-col lg:flex-row gap-4 lg:gap-6">
              {/* Left column with two stacked images */}
              <div className="w-full lg:flex-1 lg:max-w-[330px] flex flex-col gap-4 lg:gap-6">
                
                
              </div>
              {/* Right large video */}
              
            </div>
  
            {/* Second Row - Full width with platform demo overlay */}
            <div className="w-full h-[500px] lg:h-[800px] p-4 lg:p-6 rounded-[20px] lg:rounded-[40px] flex flex-col justify-center items-center relative overflow-hidden">
              <video className="absolute inset-0 w-full h-full object-cover rounded-[20px] lg:rounded-[40px]" src="https://res.cloudinary.com/da7s1izqw/video/upload/v1751346494/Animate_this_image_202506291634_dcwn5_wgvkba.mp4" autoPlay loop muted playsInline />
              <div className="w-full max-w-[400px] lg:max-w-[480px] px-4 lg:px-6 py-6 lg:py-10 bg-glass-gradient backdrop-blur-[10px] rounded-2xl lg:rounded-3xl border border-white/20 shadow-[0px_24px_32px_rgba(0,0,0,0.05)] flex flex-col justify-start items-center gap-4 lg:gap-6 relative z-10">
                <div className="w-full flex flex-col justify-start items-center gap-3 lg:gap-4">
                  <div className="w-full text-center text-white/65 text-xs font-dm-mono font-medium uppercase tracking-wider-2 leading-[16.32px]">
                    Voice Coach Demo
                  </div>
                  <div className="w-full max-w-[400px] lg:max-w-[480px] text-center text-white text-2xl lg:text-3xl xl:text-[48px] font-inter font-bold uppercase leading-tight lg:leading-tight xl:leading-[51.84px]">TALK YOUR WAY TO CLARITY</div>
                </div>
                <button className="px-3 py-2 bg-white shadow-[0px_16px_24px_rgba(0,0,0,0.03)] rounded-full backdrop-blur-[7.5px] flex justify-center items-center gap-1.5 hover:scale-110 hover:bg-gray-50 hover:shadow-[0px_24px_32px_rgba(0,0,0,0.06)] transition-all duration-300">
                  <div className="text-center text-black text-xs font-dm-mono font-medium uppercase tracking-wider-2 leading-[16.32px]">
                    TRY IT TODAY
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>;
  };
  export default GallerySection;
  