import { createFileRoute, Link } from "@tanstack/react-router";
import { EventsCard } from '@/components/events-card';
import { ProductShowcase } from '@/components/product-showcase';
import { HeroSlideshow } from '@/components/hero-slideshow';
import { productsOptions } from '@/lib/products.query';
import { WhatsAppContact } from '@/components/whatsapp-contact';
import { Button } from '@/components/ui/button';
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDown, ArrowRight } from "lucide-react";
import aboutImage from "@/assets/about-conference.jpg";
import aboutDiscussionImage from "@/assets/about-discussion.jpg";
import swedenImage from "@/assets/Sweden.jpg";
import ugandaImage from "@/assets/Uganda.jpg";
import clientImageOne from "@/assets/IMG-20261028-WA0002.jpg";
import clientImageTwo from "@/assets/IMG-20261028-WA0003.jpg";
import clientImageThree from "@/assets/client-portrait.jpg";
import clientImageFour from "@/assets/IMG-20261029-WA0006.jpg";
import footerImage from "@/assets/footer-network.jpg";
import logoImage from "@/assets/ngabo-logo.jpg";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsOptions),
  head: () => ({
    meta: [
      { title: "Apostle Ngabo Alex | NGABO (MMA) Network & Ministries" },
      { name: "description", content: "Visit the official website of Apostle Ngabo Alex and NGABO (MMA) Network & Ministries for ministry, leadership coaching, teaching and conferences in Uganda and Sweden." },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:title", content: "Apostle Ngabo Alex | NGABO (MMA)" },
      { property: "og:description", content: "Official website of Apostle Ngabo Alex and NGABO (MMA) Network & Ministries. Ministry, leadership coaching, teaching and conferences in Uganda and Sweden." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ngabomma.org/" },
      { property: "og:site_name", content: "NGABO (MMA) Network & Ministries" },
      
      { name: "twitter:title", content: "Apostle Ngabo Alex | NGABO (MMA) Network & Ministries" },
      { name: "twitter:description", content: "Official website of Apostle Ngabo Alex and NGABO (MMA) Network & Ministries in Uganda and Sweden." },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://ngabomma.org/" }],
  }),
  component: Index,
});

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-visible")),
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function Typewriter({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    const word = words[i % words.length] ?? "";
    let t: ReturnType<typeof setTimeout>;
    if (!del && text === word) t = setTimeout(() => setDel(true), 1600);
    else if (del && text === "") { setDel(false); setI((n) => n + 1); return; }
    else t = setTimeout(() => setText(del ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1)), del ? 50 : 100);
    return () => clearTimeout(t);
  }, [text, del, i, words]);
  return <span>{text}<span className="ml-1 inline-block w-[3px] animate-pulse bg-primary align-middle" style={{ height: "0.9em" }} /></span>;
}

function ShrinkTitle({ authDestination, dashboardHref }: { authDestination: 'loading' | 'signed-out' | 'admin' | 'member' | 'pending'; dashboardHref: string }) {
  const [p, setP] = useState(0);
  const compact = p > 0.05;
  useEffect(() => {
    let raf = 0;
    const update = () => { raf = 0; setP(Math.min(window.scrollY / 300, 1)); };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);
  return (
    <>
      {/* spacers keep the layout where the big title sits */}
      <div aria-hidden className="text-[40px] font-black leading-none md:text-9xl"><span className="invisible">NGABO</span></div>
      <div aria-hidden className="mt-2 min-h-[1.2em] text-xs font-extrabold uppercase md:text-5xl"><span className="invisible">(MMA) NET WORK</span></div>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div className="absolute inset-x-0 top-0 h-24 bg-background/90 shadow-sm backdrop-blur" style={{ opacity: p }} />
        <div
          className="relative grid grid-cols-[76px_minmax(0,1fr)_76px] items-center gap-x-1 px-4 md:grid-cols-[96px_minmax(0,1fr)_96px] md:px-6"
          style={{ top: 64 - p * 48, '--header-progress': p } as CSSProperties}
        >
          <div className="relative flex h-12 items-center md:h-14">
            <a href="#top" aria-label="NGABO (MMA) home" className={`pointer-events-auto absolute left-0 transition-opacity duration-200 motion-reduce:transition-none ${compact ? 'pointer-events-none opacity-0' : 'opacity-100'}`} tabIndex={compact ? -1 : 0} aria-hidden={compact}>
              <img src={logoImage} alt="NGABO (MMA) logo" className="h-12 w-12 rounded-full object-cover shadow-md transition-transform hover:scale-105 md:h-14 md:w-14" />
            </a>
            {authDestination === "loading" ? <Button size="sm" variant="outline" disabled className={`pointer-events-auto absolute left-0 h-9 px-2 transition-all duration-200 motion-reduce:transition-none md:px-3 ${compact ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'}`} tabIndex={-1} aria-hidden={!compact}>Checking…</Button> : authDestination === "signed-out" ? <Button asChild size="sm" variant="outline" className={`pointer-events-auto absolute left-0 h-9 px-2 transition-all duration-200 motion-reduce:transition-none md:px-3 ${compact ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'}`} tabIndex={compact ? 0 : -1} aria-hidden={!compact}><a href="/auth?mode=signup">Register</a></Button> : <Button asChild size="sm" variant="outline" className={`pointer-events-auto absolute left-0 h-9 px-2 transition-all duration-200 motion-reduce:transition-none md:px-3 ${compact ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'}`} tabIndex={compact ? 0 : -1} aria-hidden={!compact}><Link to={dashboardHref}>Dashboard</Link></Button>}
          </div>
          <h1 className="text-[length:calc(40px*(1-var(--header-progress)*0.2))] font-black leading-none text-primary md:text-[length:calc(128px*(1-var(--header-progress)*0.62))]">NGABO</h1>
          {authDestination === "loading" ? <Button size="sm" disabled className="pointer-events-auto h-9 justify-self-end">Checking session…</Button> : authDestination === "signed-out" ? <Button asChild size="sm" className="pointer-events-auto h-9 justify-self-end"><Link to="/auth">Login</Link></Button> : authDestination === "admin" ? <Button asChild size="sm" className="pointer-events-auto h-9 justify-self-end"><Link to="/admin-learning">Members &amp; learning</Link></Button> : <Button asChild size="sm" className="pointer-events-auto h-9 justify-self-end"><Link to={dashboardHref}>{authDestination === "member" ? "Dashboard" : "Status"}</Link></Button>}
          <p className="col-start-2 mt-2 min-h-[1.2em] whitespace-nowrap text-[length:calc(12px*(1-var(--header-progress)*0.2))] font-extrabold uppercase md:text-[length:calc(48px*(1-var(--header-progress)*0.62))]"><Typewriter words={["(MMA) Net Work", "Ministries"]} /></p>
        </div>
      </div>
    </>
  );
}

function Photo({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img src={src} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
    </div>
  );
}

function Section({ id, children, className = "" }: { id?: string; children: ReactNode; className?: string }) {
  return <section id={id} className={`px-6 py-24 md:px-20 md:py-32 ${className}`}>{children}</section>;
}

const clients = ["Students", "Teachers", "Organizations", "Ministers", "Businesses", "Churches"];
const services = [
  { t: "Counseling", d: "Giving personal guidance that helps one's mindset and inner consciousness (awareness) to advance via the art of taking knowledge.", extra: "Enabling and empowering one's capacity to utilize technology as a capital resource for life development, improvement, prosperity, success etc." },
  { t: "Ministering & Teaching", d: "Imparting knowledge that edifies and transforms the negative habitual traits, so that one's attitude, capability to do exchange and replicated ID, may reflect his / her positive goal settings, (Knowledge of MI) etc.", subtitle: "Seasons & Times", extra: "Allowing our clients to tap and connect into the energy (HF777, God's calendar) which unveils their monthly frequencies that prospers their investments and secures their legacy." },
  { t: "Business Coaching", d: "Equipping, building and growing the cultural skills of exchange, accountability, responsibility and marketing." },
  { t: "Investing in the AI Era", d: "Teaching communities how to invest right during these times of social media, AI and take knowledge generation or era." },
  { t: "Networking & Shareholding", d: "Bringing together and uniting the collective and cooperative energies, investments and resources of our community, society etc." },
];

function Index() {
  useReveal();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authDestination, setAuthDestination] = useState<"loading" | "signed-out" | "admin" | "member" | "pending">("loading");
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => { if (active && !error) setAuthUser(data.session?.user ?? null); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { if (active) setAuthUser(session?.user ?? null); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    let active = true;
    async function resolveDestination() {
      if (!authUser) { setAuthDestination("signed-out"); return; }
      const role = await supabase.rpc("has_role", { _user_id: authUser.id, _role: "admin" });
      if (!active) return;
      if (!role.error && role.data) { setAuthDestination("admin"); return; }
      const { data: profile, error } = await supabase.from("member_profiles").select("approval_status,email_verified_at").eq("user_id", authUser.id).maybeSingle();
      if (!active) return;
      setAuthDestination(!error && authUser.email_confirmed_at && profile?.email_verified_at && profile.approval_status === "approved" ? "member" : "pending");
    }
    void resolveDestination();
    return () => { active = false; };
  }, [authUser]);
  const dashboardHref = authDestination === "admin" ? "/admin" : authDestination === "member" ? "/dashboard" : "/pending-approval";

  // Keep the public page hidden until Supabase has resolved the session and the
  // correct signed-in destination has been determined. No session-check text is shown.
  if (authDestination === "loading") return null;

  return (
    <main className="overflow-hidden bg-background font-sans text-foreground">
      <WhatsAppContact />

      {/* Hero */}
      <header id="top" className="flex min-h-screen flex-col items-center px-6 pb-16 pt-16 text-center md:px-20">
        <ShrinkTitle authDestination={authDestination} dashboardHref={dashboardHref} />
        <EventsCard />
        <HeroSlideshow />
        <p className="animate-rise mt-10 max-w-xl leading-relaxed" style={{ animationDelay: ".5s" }}>
          <strong>Apostle. Coach. Teacher.</strong> Empowering ministers and encouraging societies to embrace social media in the advancing times of AI technology.
        </p>
        <a href="#contact" className="animate-rise mt-8 inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 font-bold text-primary-foreground transition-transform hover:scale-105" style={{ animationDelay: ".6s" }}>
          Book Apostle Ngabo <ArrowRight className="h-4 w-4" />
        </a>
        <a href="#about" aria-label="Scroll down" className="mt-10 animate-bob"><ArrowDown className="h-10 w-10" strokeWidth={1} /></a>
      </header>
      <ProductShowcase />

      {/* About */}
      <Section id="about" className="grid items-center gap-16 md:grid-cols-2">
        <Photo src={aboutImage} alt="Apostle Ngabo Alex at conferences and community gatherings" className="reveal aspect-[4/5] rounded-3xl" />
        <div className="reveal">
          <p className="font-bold uppercase tracking-widest text-primary">About</p>
          <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">NGABO (MMA) Network & Ministries</h2>
          <p className="mt-6 text-lg leading-relaxed">
            We specialize in empowering ministers and encouraging societies, so that they may embrace their Right usage of social media, during these advancing times of AI, and Era of take knowledge or (technology) that we are confronting.
          </p>
          <Photo src={aboutDiscussionImage} alt="Apostle Ngabo in discussion with community members" className="mt-6 aspect-video rounded-3xl" />
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Since 2011, Apostle Ngabo Alex has been innovating training and coaching leadership skills, so that a person's knowledge may allow their character to develop, improve, invest right and prosper in these days of internet, social media, knowledge and AI evolution.
          </p>
          <div className="mt-10 flex gap-12">
            <div><p className="text-5xl font-black text-primary">2011</p><p className="text-sm font-bold">Serving since</p></div>
            <div><p className="text-5xl font-black text-primary">2</p><p className="text-sm font-bold">Countries</p></div>
          </div>
        </div>
      </Section>

      {/* Services */}
      <Section className="bg-primary text-primary-foreground">
        <h2 className="reveal max-w-3xl text-4xl font-black leading-tight md:text-6xl">Our Services</h2>
        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl bg-primary-foreground/20 md:grid-cols-2">
          {services.map((s, i) => (
            <div key={s.t} className="reveal bg-primary p-10 transition-colors hover:bg-primary-foreground/10" style={{ transitionDelay: `${i * 0.1}s` }}>
              <p className="text-sm font-bold opacity-70">0{i + 1}</p>
              <h3 className="mt-3 text-2xl font-extrabold">{s.t}</h3>
              <p className="mt-3 opacity-90">{s.d}</p>
              {s.subtitle && <h4 className="mt-6 text-xl font-extrabold">{s.subtitle}</h4>}
              {s.extra && <p className="mt-3 opacity-90">{s.extra}</p>}
            </div>
          ))}
        </div>
      </Section>

      {/* Conferences */}
      <Section id="conferences">
        <div className="reveal max-w-3xl">
          <p className="font-bold uppercase tracking-widest text-primary">Conferences</p>
          <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">Transforming schools into their visualized dreams</h2>
          <p className="mt-6 text-lg">Holding conferences that transform schools in Sweden and Uganda.</p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {[{ name: "Sweden", image: swedenImage }, { name: "Uganda", image: ugandaImage }].map(({ name: c, image }) => (
            <div key={c} className="reveal group relative overflow-hidden rounded-3xl">
              <Photo src={image} alt={`Apostle Ngabo teaching in ${c}`} className="aspect-[4/3] transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute bottom-6 left-6 rounded-full bg-primary px-5 py-2 font-bold text-primary-foreground">{c}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Clients */}
      <Section id="clients" className="bg-muted">
        <div className="reveal max-w-3xl">
          <p className="font-bold uppercase tracking-widest text-primary">Our Clients</p>
          <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">Edified, skilled & certified</h2>
          <p className="mt-6 text-lg">Our clients are edified, learning skills, acquiring knowledge and getting certificated.</p>
        </div>
        <div className="mt-12 flex flex-wrap gap-4">
          {clients.map((c, i) => (
            <span key={c} className="reveal rounded-full border-2 border-foreground px-6 py-3 text-lg font-bold transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground" style={{ transitionDelay: `${i * 0.08}s` }}>
              {c}
            </span>
          ))}
        </div>
        <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { image: clientImageOne, alt: "Apostle Ngabo with a group around a laptop" },
            { image: clientImageTwo, alt: "Apostle Ngabo interviewing community members" },
            { image: clientImageThree, alt: "Portrait of Apostle Ngabo Alex" },
            { image: clientImageFour, alt: "Apostle Ngabo in a group discussion" },
          ].map(({ image, alt }) => <Photo key={image} src={image} alt={alt} className="reveal aspect-square rounded-2xl" />)}
        </div>
      </Section>

      {/* Contact */}
      <Section id="contact" className="text-center">
        <h2 className="reveal text-5xl font-black leading-[0.95] text-primary md:text-8xl">Let's advance<br />together</h2>
        <p className="reveal mx-auto mt-8 max-w-xl text-lg">Book Apostle Ngabo Alex for counseling, ministering, teaching, coaching or your next conference.</p>
        <a href="mailto:apostlengabo@gmail.com" className="reveal mt-10 inline-flex items-center gap-3 rounded-full bg-primary px-10 py-5 text-lg font-bold text-primary-foreground transition-transform hover:scale-105">
          Get in touch <ArrowRight className="h-5 w-5" />
        </a>
      </Section>

      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        <img src={logoImage} alt="NGABO (MMA) logo" className="mx-auto mb-6 h-20 w-20 rounded-full object-cover shadow-md" />
        <Photo src={footerImage} alt="NGABO (MMA) Network: Soul, Body, Mindset and Spirit, with steps toward success" className="mx-auto mb-8 aspect-[768/849] w-full max-w-sm rounded-lg" />
        <p>© 2011 to {new Date().getFullYear()} NGABO (MMA) Network & Ministries</p>
      </footer>
    </main>
  );
}
