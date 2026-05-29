import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BookOpen, Sparkles, GraduationCap } from "lucide-react";
import AppBackground from "@/components/AppBackground";

const Index = () => {
  
  const navigate = useNavigate();
  // useNavigate hook to navigate to different routes
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 bg-[#f3f0e7] backdrop-blur-md shadow-md ">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold font-mono italic text-foreground">EducDZ</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#faf7f2] to-[#f1ede5]">
         <div className="w-full -mt-12 max-w-7xl container mx-auto px-4 py-12 md:py-20 grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
         {/* Left Content */}
          <div className="space-y-8 text-center lg:text-left">
           <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground mx-auto lg:mx-0">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Welcome to the Future of Learning</span>
           </div>

            <h1 className="text-4xl font-bold font-mono italic tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
              <span className="block">Welcome to</span>
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                EducDZ!
              </span>
            </h1>

            <p className="text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto lg:mx-0">
              Let’s learn and succeed together. This Platform is designed
               to aid in the growth of your academic goals at your own place.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                onClick={() => navigate("/login")}
className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[var(--shadow-emerald)] transition-all hover:scale-105"              >
                <BookOpen className="mr-2 h-5 w-5" />
                Login
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/register")}
                className="border-2 border-primary text-foreground hover:bg-secondary transition-all hover:scale-105"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Register Now
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-primary/20">
              <img
                src="src/assets/img.jpg"
                alt="Students learning together"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
