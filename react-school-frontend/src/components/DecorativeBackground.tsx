import {
  BookOpen,
  GraduationCap,
  Sparkles,
  Star,
  Pencil,
  Lightbulb,
  Trophy,
  Rocket,
  Calculator,
  Atom,
  PenTool,
  Award,
} from "lucide-react";

const DecorativeBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
    {/* Strong gradient washes */}
    <div className="absolute top-[-20%] left-[-15%] w-[700px] h-[700px] bg-primary/30 rounded-full blur-[100px] animate-pulse" />
    <div className="absolute bottom-[-20%] right-[-15%] w-[800px] h-[800px] bg-accent/25 rounded-full blur-[100px] animate-pulse [animation-delay:1.5s]" />
    <div className="absolute top-[30%] right-[-5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[80px] animate-pulse [animation-delay:3s]" />
    <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-accent/20 rounded-full blur-[80px] animate-pulse [animation-delay:2s]" />

    {/* Floating rings */}
    <div className="absolute top-[8%] right-[12%] w-24 h-24 rounded-full border-[3px] border-primary/20 animate-spin [animation-duration:20s]" />
    <div className="absolute bottom-[20%] left-[8%] w-16 h-16 rounded-full border-2 border-accent/25 animate-spin [animation-duration:15s]" />
    <div className="absolute top-[55%] right-[25%] w-20 h-20 rounded-full border-2 border-primary/15 animate-spin [animation-duration:25s]" />

    {/* Educational floating icons - what makes it fun for students */}
    <BookOpen className="absolute top-[10%] left-[8%] w-12 h-12 text-primary/30 animate-bounce [animation-duration:4s]" />
    <GraduationCap className="absolute top-[15%] right-[8%] w-14 h-14 text-accent/35 animate-bounce [animation-duration:5s] [animation-delay:0.7s]" />
    <Sparkles className="absolute top-[40%] left-[12%] w-10 h-10 text-accent/40 animate-pulse [animation-duration:2.5s]" />
    <Star className="absolute top-[25%] left-[50%] w-8 h-8 text-primary/35 animate-spin [animation-duration:8s]" />
    <Pencil className="absolute bottom-[30%] right-[15%] w-11 h-11 text-primary/30 animate-bounce [animation-duration:4.5s] [animation-delay:1.2s]" />
    <Lightbulb className="absolute top-[60%] left-[7%] w-12 h-12 text-accent/35 animate-pulse [animation-duration:3s] [animation-delay:0.5s]" />
    <Trophy className="absolute bottom-[15%] left-[40%] w-11 h-11 text-accent/30 animate-bounce [animation-duration:5s] [animation-delay:1.8s]" />
    <Rocket className="absolute top-[50%] right-[10%] w-12 h-12 text-primary/30 animate-bounce [animation-duration:4s] [animation-delay:0.3s]" />
    <Calculator className="absolute bottom-[40%] left-[20%] w-10 h-10 text-primary/30 animate-pulse [animation-duration:3.5s]" />
    <Atom className="absolute top-[35%] right-[30%] w-12 h-12 text-accent/30 animate-spin [animation-duration:12s]" />
    <PenTool className="absolute bottom-[10%] right-[35%] w-9 h-9 text-primary/30 animate-bounce [animation-duration:4.2s] [animation-delay:2s]" />
    <Award className="absolute top-[75%] right-[5%] w-11 h-11 text-accent/35 animate-pulse [animation-duration:3.2s] [animation-delay:1s]" />
    <Star className="absolute top-[5%] left-[40%] w-6 h-6 text-accent/45 animate-spin [animation-duration:6s]" />
    <Sparkles className="absolute bottom-[55%] right-[45%] w-7 h-7 text-primary/40 animate-pulse [animation-duration:2s] [animation-delay:1.5s]" />

    {/* Soft solid bubbles for depth */}
    <div className="absolute top-[6%] left-[28%] w-14 h-14 bg-primary/15 rounded-full animate-bounce [animation-duration:3s]" />
    <div className="absolute bottom-[25%] right-[22%] w-12 h-12 bg-accent/20 rounded-full animate-bounce [animation-duration:3.5s] [animation-delay:1s]" />
    <div className="absolute top-[45%] left-[35%] w-8 h-8 bg-primary/20 rounded-full animate-bounce [animation-duration:5s] [animation-delay:2s]" />

    {/* Dot grid pattern */}
    <div
      className="absolute inset-0 opacity-[0.05]"
      style={{
        backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    />
  </div>
);

export default DecorativeBackground;
