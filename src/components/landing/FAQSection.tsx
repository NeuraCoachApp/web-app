
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const FAQSection = () => {
  const [openItem, setOpenItem] = useState(0);

  const toggleItem = (index: number) => {
    setOpenItem(openItem === index ? -1 : index);
  };

  const faqs = [
    {
      question: "Do I really talk to the app every day?",
      answer: "Yes! Just hit record and speak for 1 minute. The AI gives instant feedback - no typing, no friction."
    },
    {
      question: "What can I talk about?",
      answer: "Anything: your goals, stress, blockers, wins, focus - whatever's on your mind."
    },
    {
      question: "How does the AI help me?",
      answer: "It listens, reflects your patterns, and offers insight. It helps you stay clear, focused, and moving forward - every day."
    },
    {
      question: "What's the coach's role?",
      answer: "Your coach listens to your entries, tracks trends, and meets with you weekly to go deeper, strategize, and accelerate your growth."
    }
  ];

  return (
    <div className="w-full py-[100px] lg:py-[200px] px-4 lg:px-6 bg-background flex justify-center items-start">
      <div className="flex-1 max-w-[1600px] flex flex-col justify-start items-center gap-12 lg:gap-20">
        {/* Header */}
        <div className="w-full flex flex-col justify-start items-center gap-4">
          <div className="w-full max-w-[640px] text-center text-foreground text-2xl lg:text-3xl xl:text-[48px] font-inter font-bold uppercase leading-tight lg:leading-tight xl:leading-[51.84px]">
            FAQ
          </div>
        </div>

        {/* FAQ Items */}
        <div className="w-full max-w-[800px] flex flex-col">
          {faqs.map((faq, index) => (
            <div key={index} className="border-t border-border py-6 lg:py-8 flex flex-col gap-4 lg:gap-6">
              <div 
                className="flex justify-between items-start gap-4 lg:gap-6 cursor-pointer"
                onClick={() => toggleItem(index)}
              >
                <div className="flex-1 text-foreground text-base lg:text-lg font-inter font-medium leading-[21.76px] lg:leading-[24.48px]">
                  {faq.question}
                </div>
                <div className="p-2 bg-card rounded-full flex items-center justify-center border border-border">
                  <ChevronDown 
                    className={`w-3 h-3 text-card-foreground transition-transform ${
                      openItem === index ? 'rotate-180' : ''
                    }`} 
                  />
                </div>
              </div>
              {openItem === index && (
                <div className="pr-8 lg:pr-12">
                  <div className="text-muted-foreground text-sm lg:text-base font-sans leading-[19.04px] lg:leading-[21.76px]">
                    {faq.answer}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQSection;
