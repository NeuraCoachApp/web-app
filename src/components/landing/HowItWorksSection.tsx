const HowItWorksSection = () => {
    return (
      <div className="w-full py-[100px] lg:py-[200px] px-4 lg:px-6 bg-background flex justify-center items-start">
        <div className="flex-1 max-w-[1600px] flex flex-col justify-start items-center gap-12 lg:gap-20">
          {/* Header */}
          <div className="w-full flex flex-col justify-start items-center gap-4">
            <div className="w-full max-w-[640px] text-center text-foreground text-2xl lg:text-3xl xl:text-[48px] font-inter font-bold uppercase leading-tight lg:leading-tight xl:leading-[51.84px]">
              HOW HYBRID COACHING WORKS
            </div>
          </div>
  
          {/* Steps */}
          <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="flex flex-col items-center text-center gap-6 hover:scale-105 transition-transform duration-300 group">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-muted/80 transition-colors duration-300">
                <span className="text-muted-foreground text-lg lg:text-xl font-dm-mono font-medium group-hover:scale-110 transition-transform duration-300">1</span>
              </div>
              <div className="flex items-center justify-center mb-4">
                <img src="/lovable-uploads/16484e55-fa59-4be6-bd48-3a618c74d6bb.png" alt="Speech bubble" className="w-12 h-12 lg:w-16 lg:h-16 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="text-foreground text-lg lg:text-xl font-inter font-medium leading-[24.48px] lg:leading-[27.20px] max-w-[280px] mx-auto">
                Every day, talk to your AI coach for 10 minutes
              </div>
            </div>
  
            <div className="flex flex-col items-center text-center gap-6 hover:scale-105 transition-transform duration-300 group">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-muted/80 transition-colors duration-300">
                <span className="text-muted-foreground text-lg lg:text-xl font-dm-mono font-medium group-hover:scale-110 transition-transform duration-300">2</span>
              </div>
              <div className="flex items-center justify-center mb-4">
                <img src="/lovable-uploads/70022d2d-e816-481c-8605-d84563d1413d.png" alt="Speech bubble" className="w-12 h-12 lg:w-16 lg:h-16 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="text-foreground text-lg lg:text-xl font-inter font-medium leading-[24.48px] lg:leading-[27.20px] max-w-[280px] mx-auto">
                AI listens, nudges, and keeps you on track - instantly
              </div>
            </div>
  
            <div className="flex flex-col items-center text-center gap-6 hover:scale-105 transition-transform duration-300 group">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-muted/80 transition-colors duration-300">
                <span className="text-muted-foreground text-lg lg:text-xl font-dm-mono font-medium group-hover:scale-110 transition-transform duration-300">3</span>
              </div>
              <div className="flex items-center justify-center mb-4">
                <img src="/lovable-uploads/9930af7c-71ba-4058-8bce-42c1f5255d87.png" alt="Coach person" className="w-12 h-12 lg:w-16 lg:h-16 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="text-foreground text-lg lg:text-xl font-inter font-medium leading-[24.48px] lg:leading-[27.20px] max-w-[280px] mx-auto">
                Every week, fill in any gaps with a real human coach
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default HowItWorksSection;