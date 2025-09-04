import { Users, Briefcase, TrendingUp, Heart, Target, Clock } from 'lucide-react';

const WhoIsThisForSection = () => {
  return (
    <div className="w-full py-[100px] lg:py-[200px] px-4 lg:px-6 bg-background flex justify-center items-start">
      <div className="flex-1 max-w-[1600px] flex flex-col justify-start items-center gap-12 lg:gap-20">
        {/* Header */}
        <div className="w-full flex flex-col justify-start items-center gap-4">
          <div className="w-full max-w-[800px] text-center text-foreground text-2xl lg:text-3xl xl:text-[48px] font-inter font-bold uppercase leading-tight lg:leading-tight xl:leading-[51.84px]">
            WHO IS THIS FOR?
          </div>
        </div>

        {/* Content Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Busy Professionals */}
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-white/65" />
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-muted-foreground text-xs font-dm-mono font-medium uppercase tracking-wider-2 leading-[16.32px]">
                Busy Professionals
              </div>
              <div className="text-foreground text-lg font-inter font-medium leading-[24.48px]">
                Need coaching that fits their schedule, not the other way around
              </div>
            </div>
          </div>

          {/* Entrepreneurs */}
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white/65" />
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-muted-foreground text-xs font-dm-mono font-medium uppercase tracking-wider-2 leading-[16.32px]">
                Entrepreneurs
              </div>
              <div className="text-foreground text-lg font-inter font-medium leading-[24.48px]">
                Want rapid personal growth to match their business ambitions
              </div>
            </div>
          </div>

          {/* High Achievers */}
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
              <Target className="w-8 h-8 text-white/65" />
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-muted-foreground text-xs font-dm-mono font-medium uppercase tracking-wider-2 leading-[16.32px]">
                High Achievers
              </div>
              <div className="text-foreground text-lg font-inter font-medium leading-[24.48px]">
                Tired of self-help books and want accountability that actually works
              </div>
            </div>
          </div>

          {/* Working Parents */}
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-white/65" />
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-muted-foreground text-xs font-dm-mono font-medium uppercase tracking-wider-2 leading-[16.32px]">
                Working Parents
              </div>
              <div className="text-foreground text-lg font-inter font-medium leading-[24.48px]">
                Need support that understands their unique time constraints
              </div>
            </div>
          </div>

          {/* Career Changers */}
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-white/65" />
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-muted-foreground text-xs font-dm-mono font-medium uppercase tracking-wider-2 leading-[16.32px]">
                Career Changers
              </div>
              <div className="text-foreground text-lg font-inter font-medium leading-[24.48px]">
                Ready to navigate major life transitions with expert guidance
              </div>
            </div>
          </div>

          {/* Time-Conscious */}
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-white/65" />
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-muted-foreground text-xs font-dm-mono font-medium uppercase tracking-wider-2 leading-[16.32px]">
                Time-Conscious
              </div>
              <div className="text-foreground text-lg font-inter font-medium leading-[24.48px]">
                Want maximum impact from minimal time investment
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhoIsThisForSection;