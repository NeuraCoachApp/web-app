const PricingSection = () => {
    const plans = [
      {
        name: "Starter",
        price: "$20",
        period: "",
        description: "Perfect for trying daily AI coaching",
        features: [
          "10-minute daily voice coaching",
          "Instant AI feedback",
          "Mood tracking",
          "Progress insights"
        ],
        highlighted: false
      },
      {
        name: "Coaching Plan",
        price: "$280",
        period: "/month",
        description: "Full hybrid coaching experience",
        features: [
          "Everything in Starter",
          "30 minute weekly human coaching",
          "Progress reviews",
          "Personalized guidance",
          "Pattern recognition",
          "Strategic planning"
        ],
        highlighted: true
      }
    ];
  
    return (
      <div className="w-full py-[100px] lg:py-[200px] px-4 lg:px-6 bg-background flex justify-center items-start">
        <div className="flex-1 max-w-[1600px] flex flex-col justify-start items-center gap-12 lg:gap-20">
          {/* Header */}
          <div className="w-full flex flex-col justify-start items-center gap-4">
            <div className="w-full max-w-[480px] text-center text-foreground text-2xl lg:text-3xl xl:text-[48px] font-inter font-bold uppercase leading-tight lg:leading-tight xl:leading-[51.84px]">
              Pricing
            </div>
          </div>
  
          {/* Pricing Cards */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-[800px] mx-auto">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`p-6 lg:p-8 rounded-[20px] lg:rounded-[24px] flex flex-col gap-6 relative hover:scale-105 hover:-translate-y-2 transition-all duration-300 group ${
                  plan.highlighted 
                    ? 'bg-primary text-primary-foreground shadow-[0px_32px_48px_rgba(255,255,255,0.12)] hover:shadow-[0px_48px_64px_rgba(255,255,255,0.2)]' 
                    : 'bg-card border border-border shadow-[0px_16px_24px_rgba(255,255,255,0.03)] hover:shadow-[0px_24px_32px_rgba(255,255,255,0.06)]'
                }`}
              >
                
                <div className="flex flex-col gap-3">
                  <div className={`text-xs font-dm-mono font-medium uppercase tracking-wider-2 leading-[16.32px] ${
                    plan.highlighted ? 'text-primary-foreground/65' : 'text-muted-foreground'
                  }`}>
                    {plan.name}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <div className={`text-3xl lg:text-[48px] font-inter font-bold leading-tight ${
                      plan.highlighted ? 'text-primary-foreground' : 'text-card-foreground'
                    }`}>
                      {plan.price}
                    </div>
                    {plan.period && (
                      <div className={`text-sm font-dm-mono font-medium ${
                        plan.highlighted ? 'text-primary-foreground/65' : 'text-muted-foreground'
                      }`}>
                        {plan.period}
                      </div>
                    )}
                  </div>
                  <div className={`text-sm font-sans leading-[19.04px] ${
                    plan.highlighted ? 'text-primary-foreground/75' : 'text-muted-foreground'
                  }`}>
                    {plan.description}
                  </div>
                </div>
  
                <div className="flex flex-col gap-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        plan.highlighted ? 'bg-primary-foreground' : 'bg-card-foreground'
                      }`}></div>
                      <div className={`text-sm font-sans leading-[19.04px] ${
                        plan.highlighted ? 'text-primary-foreground/75' : 'text-muted-foreground'
                      }`}>
                        {feature}
                      </div>
                    </div>
                  ))}
                </div>
  
                <button 
                  onClick={() => window.location.href = plan.price === '$20' ? '/checkout/starter' : '/checkout/coaching'}
                  className={`px-6 py-3 rounded-full flex justify-center items-center gap-1.5 mt-2 hover:scale-105 transition-all duration-300 ${
                  plan.highlighted 
                    ? 'bg-background text-foreground shadow-[0px_16px_24px_rgba(255,255,255,0.1)] hover:shadow-[0px_24px_32px_rgba(255,255,255,0.2)]' 
                    : 'bg-primary text-primary-foreground shadow-[0px_16px_24px_rgba(255,255,255,0.1)] hover:shadow-[0px_24px_32px_rgba(255,255,255,0.2)]'
                }`}>
                  <div className="text-xs font-dm-mono font-medium uppercase tracking-wider-2 leading-[16.32px]">
                    {plan.price === '$20' ? 'Try Daily AI Coaching' : 'Book My First Coaching Session'}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  export default PricingSection;