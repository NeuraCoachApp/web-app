import { Circle } from 'lucide-react';
const Footer = () => {
  return <div className="w-full px-6 py-20 bg-background flex flex-col justify-start items-center">
      <div className="w-full max-w-[1600px] flex flex-col justify-start items-center gap-14">
        {/* Contact Us Section */}
        <div className="flex flex-col justify-center items-center gap-4">
          <div className="text-foreground text-xs font-dm-mono font-medium uppercase tracking-wider-2 leading-[16.32px] text-center sm:text-left">
            Contact Us
          </div>
          <div className="text-foreground text-xl sm:text-2xl font-inter font-bold leading-[28.80px] sm:leading-[38.40px]">hello@neura.coach</div>
        </div>

        {/* Copyright and Legal */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-3">
          <div className="text-muted-foreground text-xs font-dm-mono font-medium uppercase leading-[16.32px] tracking-wider-2">
            © 2025, Hybrid Coach Platform
          </div>
          <div className="w-[3px] h-[3px] bg-muted-foreground rounded-full hidden sm:block"></div>
          <div className="py-0.5 flex justify-center items-center">
            <div className="text-muted-foreground text-xs font-dm-mono font-medium uppercase leading-[16.32px] tracking-wider-2">
              Licenses
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Footer;