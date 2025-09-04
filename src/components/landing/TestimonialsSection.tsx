const TestimonialsSection = () => {
    const testimonials = [
      {
        name: "Sarah Chen",
        role: "Startup Founder",
        content: "I was drowning in decisions and needed someone to talk through my scattered thoughts daily. The 10-minute check-ins keep me grounded without eating up my entire day like traditional coaching did.",
        avatar: "/lovable-uploads/1f6c21cf-c33c-4204-8a22-e54c815de415.png"
      },
      {
        name: "Marcus Rodriguez",
        role: "Marketing Director",
        content: "I have ADHD and writing in journals never stuck. But talking for 10 minutes? That I can do. The AI catches patterns I miss and my weekly coach helps me stay strategic.",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
      },
      {
        name: "Jennifer Walsh",
        role: "Learning Spanish",
        content: "After struggling with language learning apps, I needed daily accountability to practice speaking. The 10-minute voice check-ins feel natural and my coach helps me track real progress.",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
      },
      {
        name: "David Park",
        role: "Freelance Designer",
        content: "I'm a chronic procrastinator who avoided accountability for years. These daily check-ins don't feel judgmental - just a simple 'how's it going?' that keeps me moving forward.",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
      },
      {
        name: "Lisa Thompson",
        role: "Fitness Goal",
        content: "Between work and family, I kept skipping workouts. Ten minutes in my car talking through my fitness goals helps me stay committed without another app to manage.",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
      },
      {
        name: "Alex Johnson",
        role: "Remote Developer",
        content: "Working from home, I lost the natural check-ins you get in an office. The daily voice sessions give me that connection without another video meeting on my calendar.",
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
      },
      {
        name: "Rachel Kim",
        role: "Learning Guitar",
        content: "I've tried learning guitar for years but always quit after a few weeks. Daily 10-minute check-ins about my practice keep me motivated, and my weekly coach helps me set realistic goals.",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
      },
      {
        name: "James Wilson",
        role: "Creative Writer",
        content: "Writer's block used to paralyze me for weeks. Now I talk through my creative blocks daily - it's like having a creative thinking partner who doesn't disrupt my flow.",
        avatar: "/lovable-uploads/7e657aba-cd59-4665-8a61-94b8d4f89470.png"
      },
      {
        name: "Maya Patel",
        role: "Product Manager",
        content: "I'm a perfectionist who was burning out from over-analyzing everything. The daily reality checks help me course-correct before I spiral into overwhelm mode.",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
      }
    ];
  
    return (
      <div className="w-full py-[100px] lg:py-[200px] px-4 lg:px-6 bg-background flex justify-center items-start">
        <div className="flex-1 max-w-[1600px] flex flex-col justify-start items-center gap-12 lg:gap-20">
          {/* Header */}
          <div className="w-full flex flex-col justify-start items-center gap-4">
            <div className="w-full max-w-[640px] text-center text-foreground text-2xl lg:text-3xl xl:text-[48px] font-inter font-bold uppercase leading-tight lg:leading-tight xl:leading-[51.84px]">
              BUILT FOR AMBITIOUS PEOPLE WITH REAL GOALS
            </div>
          </div>
  
          {/* Testimonials Grid */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="p-6 lg:p-8 bg-card rounded-[20px] lg:rounded-[24px] shadow-[0px_16px_24px_rgba(255,255,255,0.03)] flex flex-col gap-6 hover:scale-105 hover:-translate-y-2 hover:shadow-[0px_24px_32px_rgba(255,255,255,0.06)] transition-all duration-300 group">
                <div className="text-muted-foreground text-sm font-sans leading-[19.04px] italic">
                  "{testimonial.content}"
                </div>
                <div className="flex items-center gap-4">
                  <img 
                    src={testimonial.avatar} 
                    alt={`${testimonial.name} avatar`}
                    className="w-12 h-12 rounded-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="flex flex-col">
                    <div className="text-card-foreground text-sm font-inter font-medium leading-[19.04px]">
                      {testimonial.name}
                    </div>
                    <div className="text-muted-foreground text-xs font-dm-mono font-medium uppercase tracking-wider-2 leading-[16.32px]">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  export default TestimonialsSection;
  