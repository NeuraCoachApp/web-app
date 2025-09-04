
'use client'

import { ChevronDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

const AboutSection = () => {
  const [openItem, setOpenItem] = useState(0);
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);

  const toggleItem = (index: number) => {
    setOpenItem(openItem === index ? -1 : index);
  };

  // Autoplay functionality
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [api]);

  // Track current slide
  useEffect(() => {
    if (!api) return;

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const accordionItems = [
    {
      title: "Life moves daily - not weekly",
      content: "Waiting seven days to talk things through just doesn't cut it. You forget what felt urgent, breakthroughs get lost between sessions, and you stall instead of building momentum."
    },
    {
      title: "That's why we combine real weekly coaching with daily AI check-ins",
      content: "You get coaching support when it counts - every day. It's like having a coach in your pocket - without the burnout or the wait."
    },
    {
      title: "Why Voice + AI + Human Coaching?",
      content: "Talking is fast. Emotional. Honest. AI gives structure. Your coach brings depth. You get results with quick daily check-ins, AI insights, pattern recognition, and human strategic guidance."
    }
  ];

  const carouselImages = [
    "/lovable-uploads/fda342b0-ea16-4847-b25c-6c30a36be98f.png",
    "/lovable-uploads/e2fdc972-e233-4f2f-b176-c5ea08759c4a.png", 
    "/lovable-uploads/c3b2646d-9a26-4cdc-bb10-092ec1f91abd.png"
  ];

  return (
    <div className="w-full bg-background flex justify-center items-center">
      <div className="w-full max-w-[1640px] flex flex-col lg:flex-row">
        <div className="flex-1 pt-12 lg:pt-20 pb-2 px-4 lg:px-7 flex flex-col gap-8 lg:gap-16">
          <div className="flex flex-col gap-3">
            <div className="w-full lg:w-[402px] text-foreground text-3xl lg:text-[48px] font-inter font-bold uppercase leading-[36px] lg:leading-[51.84px]">
              Why Weekly Coaching Alone Doesn't Work
            </div>
          </div>
          
          <div className="flex flex-col overflow-hidden">
            {accordionItems.map((item, index) => (
              <div key={index} className="border-t border-border py-4 lg:py-5 flex flex-col gap-3 lg:gap-4">
                <div 
                  className="flex justify-between items-end gap-4 lg:gap-6 cursor-pointer"
                  onClick={() => toggleItem(index)}
                >
                  <div className="flex-1 text-foreground text-sm font-inter font-medium leading-[19.04px]">
                    {item.title}
                  </div>
                  <div className="p-1.5 bg-card rounded-full flex items-center justify-center">
                    <ChevronDown 
                      className={`w-2.5 h-2.5 text-card-foreground transition-transform ${
                        openItem === index ? 'rotate-180' : ''
                      }`} 
                    />
                  </div>
                </div>
                {openItem === index && (
                  <div className="pr-6 lg:pr-10">
                    <div className="flex-1 max-w-[560px] text-muted-foreground text-sm font-sans leading-[19.04px]">
                      {item.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex-1 p-4 lg:p-8 flex items-center justify-center">
          <Carousel
            setApi={setApi}
            className="w-full max-w-xl lg:max-w-2xl scale-150"
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent>
              {carouselImages.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="flex aspect-square items-center justify-center p-2">
                    <img 
                      src={image} 
                      alt={`Coaching comparison ${index + 1}`}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        </div>
      </div>
    </div>
  );
};

export default AboutSection;
