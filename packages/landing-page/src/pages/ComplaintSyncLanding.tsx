import { useState } from "react";
import { 
  Zap, 
  ClipboardList, 
  Shield, 
  BarChart3, 
  Users, 
  UserCog, 
  Settings2,
  Bot,
  Bell,
  Lock,
  GitBranch,
  ChevronDown,
  ArrowRight,
  Mail,
  Phone,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import EscalationHierarchy from "@/components/EscalationHierarchy";

const ComplaintSyncLanding = () => {
  const [email, setEmail] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  const benefits = [
    {
      icon: Zap,
      title: "Fast Filing & Tracking",
      points: [
        "Submit complaints in under 2 minutes",
        "Real-time status updates",
        "Full history at your fingertips"
      ]
    },
    {
      icon: ClipboardList,
      title: "Efficient Response Tools",
      points: [
        "Pre-built response templates",
        "AI-powered suggestions",
        "Educators can respond directly to complaints, with options tailored to student satisfaction levels"
      ]
    },
    {
      icon: Shield,
      title: "Secure & Controlled",
      points: [
        "Role-based access control",
        "Encrypted data transmission",
        "Audit trails for compliance"
      ]
    },
    {
      icon: BarChart3,
      title: "Powerful Analytics",
      points: [
        "Dashboard insights",
        "Trend identification",
        "Export reports instantly"
      ]
    }
  ];

  // Get URLs from environment or use defaults
  const CAMPUS_VOICE_URL = import.meta.env.VITE_CAMPUS_VOICE_URL || "http://localhost:8082";
  const CAMPUS_RESOLVE_URL = import.meta.env.VITE_CAMPUS_RESOLVE_URL || "http://localhost:8083";
  const CAMPUS_ADMIN_URL = import.meta.env.VITE_CAMPUS_ADMIN_URL || "http://localhost:8084";

  const portals = [
    {
      name: "CampusVoice",
      subtitle: "For Students & Staff",
      description: "File and track complaints through TUT's intuitive system.",
      icon: Users,
      href: CAMPUS_VOICE_URL
    },
    {
      name: "CampusResolve",
      subtitle: "For Respondents",
      description: "Respond efficiently with smart tools and templates.",
      icon: UserCog,
      href: CAMPUS_RESOLVE_URL
    },
    {
      name: "CampusAdmin",
      subtitle: "For Administrators",
      description: "Manage and monitor everything from one dashboard.",
      icon: Settings2,
      href: CAMPUS_ADMIN_URL
    }
  ];

  const features = [
    {
      id: "realtime",
      icon: Bell,
      title: "Real-Time Updates",
      content: "Instant notifications and live tracking keep students, staff, and administrators informed on complaint status at Tshwane University of Technology (TUT)."
    },
    {
      id: "escalation",
      icon: GitBranch,
      title: "Hierarchical Escalation",
      content: "Automatic routing based on complaint severity and type. Multi-tier approval workflows ensure proper oversight. Clear accountability chains from filing to resolution."
    },
    {
      id: "ai",
      icon: Bot,
      title: "AI-Powered Responses",
      content: "Smart suggestions based on complaint type, automatic categorization and routing, and natural language processing for quick initial handling. The AI continuously improves from past resolved cases and draws on TUT-specific policies, guidelines, and documentation to provide accurate, context-relevant recommendations."
    },
    {
      id: "security",
      icon: Lock,
      title: "Secure Data Sharing",
      content: "End-to-end encryption protects sensitive information. Granular permission controls ensure only authorized users access necessary data. Full compliance with South Africa's Protection of Personal Information Act (POPIA), promoting lawful processing, accountability, and safeguards for personal information in educational settings."
    }
  ];

  const navLinks = [
    { label: "Benefits", id: "benefits" },
    { label: "Portals", id: "portals" },
    { label: "Escalation", id: "escalation" },
    { label: "Features", id: "features" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => scrollToSection("hero")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">TUT Resolve</span>
          </button>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>
          
          <div className="flex items-center gap-4">
            <Button 
              className="btn-glow hidden sm:inline-flex"
              onClick={() => scrollToSection("portals")}
            >
              Get Started
            </Button>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-foreground border-b border-foreground/20 animate-fade-in">
            <div className="container mx-auto px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="block w-full text-left px-4 py-3 rounded-lg text-background/70 hover:text-background hover:bg-background/10 transition-all duration-200 font-medium"
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-3 border-t border-background/10 mt-2">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  onClick={() => scrollToSection("portals")}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="hero" className="pt-32 pb-20 px-4 hero-gradient min-h-[90vh] flex items-center">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            {/* Animated Logo */}
            <div className="animate-scale-in mb-8">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                <Zap className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
            
            {/* Tagline */}
            <h1 className="text-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-6 animate-fade-in-up">
              Submit Complaints Easily,
              <br />
              <span className="text-primary">Get Resolutions Faster</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 animate-fade-in-up opacity-0 delay-200" style={{ animationFillMode: 'forwards' }}>
              TUT's Central Platform for Communication and Issue Resolution
            </p>
            
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up opacity-0 delay-300" style={{ animationFillMode: 'forwards' }}>
              A structured escalation system for academic, non-academic, and technical complaints at Tshwane University of Technology (TUT). Issues are routed through clear levels for quicker and more accountable resolutions.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up opacity-0 delay-400" style={{ animationFillMode: 'forwards' }}>
              <Button 
                size="lg" 
                className="btn-glow text-base px-8"
                onClick={() => scrollToSection("portals")}
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-base px-8"
                onClick={() => scrollToSection("benefits")}
              >
                Learn More
                <ChevronDown className="ml-2 w-5 h-5" />
              </Button>
            </div>
            
            {/* Decorative Nodes */}
            <div className="mt-16 relative h-24 animate-fade-in opacity-0 delay-500" style={{ animationFillMode: 'forwards' }}>
              <svg className="w-full h-full" viewBox="0 0 400 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Connection lines */}
                <path d="M100 40 L200 40" stroke="hsl(var(--secondary))" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M200 40 L300 40" stroke="hsl(var(--secondary))" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M200 40 L200 70" stroke="hsl(var(--secondary))" strokeWidth="2" strokeDasharray="4 4" />
                {/* Nodes */}
                <circle cx="100" cy="40" r="12" fill="hsl(var(--primary))" />
                <circle cx="200" cy="40" r="16" fill="hsl(var(--primary))" />
                <circle cx="300" cy="40" r="12" fill="hsl(var(--primary))" />
                <circle cx="200" cy="70" r="8" fill="hsl(var(--secondary))" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 bg-card">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <p className="text-label mb-3">Why Choose TUT Resolve</p>
            <h2 className="text-headline text-3xl md:text-4xl text-foreground">
              Everything You Need for Complaint Management
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div 
                key={benefit.title}
                className="bg-background rounded-xl p-6 card-hover"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="icon-circle mb-5">
                  <benefit.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-headline text-lg text-foreground mb-4">
                  {benefit.title}
                </h3>
                <ul className="space-y-2">
                  {benefit.points.map((point) => (
                    <li key={point} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Escalation Hierarchy Section */}
      <EscalationHierarchy />

      {/* Portal Selection Section */}
      <section id="portals" className="py-20 px-4 bg-card">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <p className="text-label mb-3">Get Started</p>
            <h2 className="text-headline text-3xl md:text-4xl text-foreground mb-4">
              Choose Your Portal
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Select the portal that matches your role at TUT to access personalized tools.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {portals.map((portal) => (
              <a 
                key={portal.name}
                href={portal.href}
                className="portal-card bg-background rounded-xl p-8 text-center block hover:shadow-lg transition-shadow"
              >
                <div className="portal-border rounded-xl" />
                
                <div className="icon-circle-lg mx-auto mb-6">
                  <portal.icon className="w-9 h-9 text-primary" />
                </div>
                
                <h3 className="text-headline text-xl text-foreground mb-1">
                  {portal.name}
                </h3>
                <p className="text-sm text-primary font-medium mb-4">
                  {portal.subtitle}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  {portal.description}
                </p>
                
                <Button className="w-full btn-glow group">
                  Enter Portal
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Features Spotlight */}
      <section id="features" className="py-20 px-4 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <p className="text-label mb-3">Features</p>
            <h2 className="text-headline text-3xl md:text-4xl text-foreground">
              Built for Modern Universities
            </h2>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {features.map((feature) => (
                <AccordionItem 
                  key={feature.id} 
                  value={feature.id}
                  className="bg-card rounded-xl px-6 border-none shadow-sm"
                >
                  <AccordionTrigger className="hover:no-underline py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-headline text-base text-left">
                        {feature.title}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 pl-14">
                    {feature.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-primary">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "500+", label: "Complaints Resolved" },
              { value: "95%", label: "Satisfaction Rate" },
              { value: "7", label: "Escalation Levels" },
              { value: "24/7", label: "Support Available" }
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-black text-primary-foreground mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-primary-foreground/80">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-card">
        <div className="container mx-auto text-center">
          <h2 className="text-headline text-3xl md:text-4xl text-foreground mb-4">
            Resolve Issues Faster — Starting Today
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Join TUT's integrated complaint management system. Get started in minutes.
          </p>
          <Button 
            size="lg" 
            className="btn-glow text-base px-10"
            onClick={() => scrollToSection("portals")}
          >
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <button 
                onClick={() => scrollToSection("hero")}
                className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">TUT Resolve</span>
              </button>
              <p className="text-sm text-background/60">
                Streamlining complaint management at Tshwane University of Technology.
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-background/60">
                <li>
                  <button onClick={() => scrollToSection("hero")} className="hover:text-background transition-colors">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("benefits")} className="hover:text-background transition-colors">
                    Benefits
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("portals")} className="hover:text-background transition-colors">
                    Portals
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("features")} className="hover:text-background transition-colors">
                    Features
                  </button>
                </li>
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-background/60">
                <li><a href="/privacy" className="hover:text-background transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-background transition-colors">Terms of Service</a></li>
                <li><a href="/accessibility" className="hover:text-background transition-colors">Accessibility</a></li>
                <li><a href="/cookies" className="hover:text-background transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
            
            {/* Newsletter */}
            <div>
              <h4 className="font-bold mb-4">Stay Updated</h4>
              <p className="text-sm text-background/60 mb-4">
                Subscribe for updates and tips.
              </p>
              <div className="flex gap-2">
                <Input 
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/10 border-background/20 text-background placeholder:text-background/40"
                />
                <Button size="sm" className="px-4">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-background/60">
              © 2025 TUT Resolve. Tshwane University of Technology. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="mailto:support@tut.ac.za" className="text-background/60 hover:text-background transition-colors">
                <Mail className="w-5 h-5" />
              </a>
              <a href="tel:+27123829999" className="text-background/60 hover:text-background transition-colors">
                <Phone className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ComplaintSyncLanding;
