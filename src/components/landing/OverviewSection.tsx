
import { Home, Building2, Waves, Sun, Car, TreePine } from 'lucide-react';
const OverviewSection = () => {
  return <div className="w-full py-[200px] px-6 flex flex-col items-center bg-background">
      <div className="w-full max-w-[1600px] flex flex-col lg:flex-row items-center gap-6">
        {/* Left side - YouTube video */}
        <div className="flex-1 self-stretch rounded-[40px] flex flex-col justify-end items-start bg-muted min-h-[480px] relative overflow-hidden">
          <iframe 
            className="absolute inset-0 w-full h-full rounded-[40px]" 
            src="https://www.youtube.com/embed/HclD8svdh7Y?autoplay=1&mute=1&loop=1&playlist=HclD8svdh7Y&controls=1&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1" 
            title="Coaching Demo Video" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen 
          />
        </div>

        {/* Right side - Overview content */}
        <div className="flex-1 flex flex-col gap-12">
          {/* Header */}
          <div className="flex flex-col gap-6">
              <div className="max-w-[640px] text-foreground text-xl md:text-2xl font-inter font-medium leading-tight md:leading-[32px]">
                This isn't therapy.<br />
                It's not journaling.<br />
                It's not just another productivity app.
              </div>
              
              <div className="max-w-[640px] text-foreground text-3xl md:text-[48px] font-inter font-bold uppercase leading-tight md:leading-[51.84px]">
                THIS IS THE NEW VERSION OF COACHING
              </div>
          </div>

          {/* Features Grid */}
          <div className="bg-border flex flex-col gap-px">
            {/* First row */}
            <div className="flex gap-px">
              <div className="flex-1 px-6 py-12 bg-card flex flex-col items-center gap-2.5">
                <Home className="w-6 h-6 text-muted-foreground" />
                <div className="text-center text-card-foreground text-sm font-inter font-medium leading-[19.04px]">
                  Daily AI Check-ins
                </div>
              </div>
              <div className="flex-1 px-6 py-12 bg-card flex flex-col items-center gap-2.5">
                <Building2 className="w-6 h-6 text-muted-foreground" />
                <div className="text-center text-card-foreground text-sm font-inter font-medium leading-[19.04px]">
                  Weekly Human Coach
                </div>
              </div>
              <div className="flex-1 px-6 py-12 bg-card flex flex-col items-center gap-2.5">
                <Waves className="w-6 h-6 text-muted-foreground" />
                <div className="text-center text-card-foreground text-sm font-inter font-medium leading-[19.04px]">5X Effective</div>
              </div>
            </div>
            
            {/* Second row */}
            <div className="flex gap-px">
              <div className="flex-1 px-6 py-12 bg-card flex flex-col items-center gap-2.5">
                <Sun className="w-6 h-6 text-muted-foreground" />
                <div className="text-center text-card-foreground text-sm font-inter font-medium leading-[19.04px]">
                  Fast & Emotional
                </div>
              </div>
              <div className="flex-1 px-6 py-12 bg-card flex flex-col items-center gap-2.5">
                <Car className="w-6 h-6 text-muted-foreground" />
                <div className="text-center text-card-foreground text-sm font-inter font-medium leading-[19.04px]">
                  Built for Real Life
                </div>
              </div>
              <div className="flex-1 px-6 py-12 bg-card flex flex-col items-center gap-2.5">
                <Sun className="w-6 h-6 text-muted-foreground" />
                <div className="text-center text-card-foreground text-sm font-inter font-medium leading-[19.04px]">
                  Consistent Growth
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default OverviewSection;
