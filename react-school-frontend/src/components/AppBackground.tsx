const AppBackground = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
    <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--secondary)/0.75)),radial-gradient(circle_at_top_left,hsl(var(--primary)/0.22),transparent_32%),radial-gradient(circle_at_82%_18%,hsl(var(--accent)/0.85),transparent_24%),radial-gradient(circle_at_bottom_right,hsl(var(--primary)/0.18),transparent_30%)]" />

    <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-pulse" />
    <div className="absolute right-[-10rem] top-[6%] h-[26rem] w-[26rem] rounded-full bg-accent/80 blur-3xl animate-pulse [animation-delay:900ms]" />
    <div className="absolute bottom-[-7rem] left-[10%] h-80 w-80 rounded-full bg-primary/16 blur-3xl animate-pulse [animation-delay:1500ms]" />
    <div className="absolute bottom-[-10rem] right-[4%] h-[30rem] w-[30rem] rounded-full bg-primary/12 blur-3xl animate-pulse [animation-delay:700ms]" />

    <div className="absolute left-[6%] top-[14%] h-28 w-28 rounded-full border border-primary/20 bg-white/45 shadow-[0_0_0_10px_hsl(var(--primary)/0.03)]" />
    <div className="absolute left-[15%] top-[36%] h-12 w-12 rounded-full bg-primary/30 shadow-[0_0_45px_hsl(var(--primary)/0.24)]" />
    <div className="absolute left-[23%] bottom-[16%] h-20 w-20 rounded-full border border-accent-foreground/10 bg-accent/70" />
    <div className="absolute left-[31%] top-[10%] h-5 w-5 rounded-full bg-primary/55" />
    <div className="absolute left-[38%] bottom-[28%] h-7 w-7 rounded-full bg-primary/28" />
    <div className="absolute left-[46%] top-[23%] h-16 w-16 rounded-full border border-primary/20 bg-primary/12" />
    <div className="absolute left-[54%] top-[60%] h-24 w-24 rounded-full bg-white/40 backdrop-blur-sm" />
    <div className="absolute left-[63%] bottom-[12%] h-6 w-6 rounded-full bg-accent-foreground/20" />
    <div className="absolute right-[28%] top-[10%] h-14 w-14 rounded-full border border-primary/25 bg-primary/14" />
    <div className="absolute right-[18%] top-[30%] h-8 w-8 rounded-full bg-primary/38" />
    <div className="absolute right-[11%] top-[46%] h-32 w-32 rounded-full border border-accent-foreground/10 bg-accent/50 backdrop-blur-sm" />
    <div className="absolute right-[20%] bottom-[24%] h-20 w-20 rounded-full bg-primary/16" />
    <div className="absolute right-[8%] bottom-[10%] h-10 w-10 rounded-full bg-primary/34" />

    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_center,hsl(var(--primary)/0.14)_1px,transparent_1px)] [background-size:32px_32px]" />
  </div>
);

export default AppBackground;
