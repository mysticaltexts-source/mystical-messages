import { useState, useEffect } from "react";
import { supabase, callFunction } from "./lib/supabase.js";

/* ─── TEST MODE ─── */
// Set VITE_TEST_MODE to any non-empty value in Vercel env vars to skip Twilio charges.
// Delete the variable entirely once Twilio brand/10DLC approval is received.
const TEST_MODE = !!import.meta.env.VITE_TEST_MODE;

/* ─── STRIPE PRICE IDs ─── */
const STRIPE_PRICES = {
  trial:    "price_1Tf7SKJwbJqhqSCz6V76Rv14",
  basic:    "price_1Tf7SGJwbJqhqSCzTCqIq1fz",
  standard: "price_1Tf7SCJwbJqhqSCzQjMM0BGw",
  premium:  "price_1Tf7S4JwbJqhqSCzoHDYCBRo",
};

/* ─── PLAN RANK ─── */
const PLAN_RANK = { free: 0, trial: 1, basic: 2, standard: 3, premium: 4 };

/* ─── DESIGN TOKENS ─── */
const T = {
  midnight: "#0d1b2a", navy: "#132233", parchment: "#fdf8f0",
  cream: "#f5ede0", gold: "#c9933a", goldLight: "#e8b96a",
  goldPale: "rgba(201,147,58,0.12)", ink: "#1a1614", body: "#3d3530",
  muted: "#7a6e66", warmWhite: "#fefcf8", success: "#4a8c6e",
  danger: "#b85c4a",
};

/* ─── GOOGLE FONTS ─── */
const FontLink = () => (
  <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Lora:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
);

/* ─── GLOBAL STYLES ─── */
const G = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { overflow-x: hidden; }
  body { font-family: 'DM Sans', sans-serif; background: ${T.parchment}; color: ${T.body}; overflow-x: hidden; }
  input, textarea, select, button { font-family: 'DM Sans', sans-serif; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes twinkle { 0%,100%{opacity:0;transform:scale(0.7);} 50%{opacity:var(--b,0.8);transform:scale(1);} }
  @keyframes spin { to { transform: rotate(360deg); } }
  .fade-up   { animation: fadeUp 0.5s ease both; }
  .fade-up-1 { animation: fadeUp 0.5s 0.08s ease both; }
  .fade-up-2 { animation: fadeUp 0.5s 0.16s ease both; }
  .fade-up-3 { animation: fadeUp 0.5s 0.24s ease both; }
  ::-webkit-scrollbar { width:6px; }
  ::-webkit-scrollbar-thumb { background:rgba(201,147,58,0.2); border-radius:3px; }
  .badge-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
  .badge-carousel { display:none; }
  @media (max-width:640px) {
    .badge-grid { display:none; }
    .badge-carousel { display:flex; overflow-x:auto; scroll-snap-type:x mandatory; gap:14px; padding-bottom:12px; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
    .badge-carousel::-webkit-scrollbar { display:none; }
    .badge-item { scroll-snap-align:start; flex-shrink:0; width:80vw; }
    .hide-mobile { display:none !important; }
    .show-mobile { display:flex !important; }
  }
  .show-mobile { display:none; }
  .post-carousel { display:flex; overflow-x:auto; scroll-snap-type:x mandatory; gap:20px; padding-bottom:16px; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .post-carousel::-webkit-scrollbar { display:none; }
  .post-card { scroll-snap-align:start; flex-shrink:0; width:300px; }
  @media (min-width:900px) { .post-card { width:calc(33.33% - 14px); } }
`;

/* ══════════════════════════════════════
   SHARED UI COMPONENTS
══════════════════════════════════════ */

function Stars({ count = 80 }) {
  const stars = Array.from({ length: count }, (_, i) => ({
    id: i, left: Math.random()*100, top: Math.random()*100,
    size: Math.random()*2+0.5, dur: 2.5+Math.random()*4,
    delay: -Math.random()*6, bright: 0.3+Math.random()*0.7,
  }));
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
      {stars.map(s => (
        <div key={s.id} style={{
          position:"absolute", left:`${s.left}%`, top:`${s.top}%`,
          width:s.size, height:s.size, background:"#fff", borderRadius:"50%",
          animation:`twinkle ${s.dur}s ease-in-out infinite ${s.delay}s`, "--b":s.bright,
        }}/>
      ))}
    </div>
  );
}

function Spinner() {
  return <div style={{ width:18, height:18, border:`2px solid rgba(255,255,255,0.3)`, borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>;
}

function LoadingScreen() {
  return (
    <div style={{ minHeight:"100vh", background:T.midnight, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
      <Stars count={60}/>
      <div style={{ position:"relative", zIndex:2, textAlign:"center" }}>
        <div style={{ fontFamily:"'Playfair Display', serif", fontSize:24, color:T.warmWhite, marginBottom:20 }}>✦ Mystical Messages</div>
        <Spinner/>
      </div>
    </div>
  );
}

function MagicShareModal({ variant, onShare, onDismiss }) {
  const isMoment = variant === "moment";
  return (
    <div
      style={{ position:"fixed", inset:0, background:"rgba(13,27,42,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300, padding:24 }}
      onClick={onDismiss}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:T.warmWhite, borderRadius:24, padding:"40px 32px", maxWidth:400, width:"100%", textAlign:"center", animation:"fadeUp 0.35s ease", boxShadow:"0 24px 64px rgba(0,0,0,0.25)" }}
      >
        <div style={{ fontSize:48, marginBottom:14 }}>{isMoment ? "✨" : "🌟"}</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:T.ink, marginBottom:14, lineHeight:1.2 }}>
          {isMoment ? "Magic just happened." : "The magic doesn't stop here."}
        </h2>
        <p style={{ fontSize:15, color:T.body, lineHeight:1.8, fontFamily:"'Lora',serif", marginBottom:28 }}>
          {isMoment
            ? "Your child's eyes lit up. That moment is pure gold. Share it with parents who get it — join our community and see the wonder unfold."
            : "Families in our community are sharing their most magical moments — tooth losses at midnight, surprise visits from Santa, pure joy captured. See what other parents are celebrating."
          }
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <Btn onClick={onShare} style={{ width:"100%", justifyContent:"center" }}>
            ✦ {isMoment ? "Share This Moment" : "See the Magic"}
          </Btn>
          <button onClick={onDismiss} style={{ background:"none", border:"none", color:T.muted, fontSize:14, cursor:"pointer", padding:"6px 0", fontFamily:"'DM Sans',sans-serif" }}>
            {isMoment ? "Maybe later" : "Not now"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background:T.midnight, color:T.warmWhite, padding:"12px 24px", borderRadius:100,
      fontSize:14, fontWeight:500, border:`1px solid ${T.gold}`, zIndex:9999,
      boxShadow:"0 8px 32px rgba(0,0,0,0.3)", animation:"fadeUp 0.3s ease", whiteSpace:"nowrap",
    }}>✦ {message}</div>
  );
}

function Btn({ children, onClick, variant="primary", style={}, disabled=false, small=false, loading=false, className="" }) {
  const base = {
    display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8,
    border:"none", cursor: disabled||loading ? "not-allowed" : "pointer",
    borderRadius:8, fontFamily:"'DM Sans', sans-serif",
    fontSize: small ? 13 : 15, fontWeight:500,
    padding: small ? "9px 18px" : "13px 24px",
    transition:"all 0.18s ease", opacity: disabled||loading ? 0.6 : 1, whiteSpace:"nowrap",
  };
  const variants = {
    primary: { background:T.gold, color:T.midnight },
    ghost:   { background:"transparent", color:"rgba(255,255,255,0.7)", border:"1px solid rgba(255,255,255,0.2)" },
    outline: { background:"transparent", color:T.gold, border:`1.5px solid rgba(201,147,58,0.35)` },
    danger:  { background:"rgba(184,92,74,0.12)", color:T.danger, border:`1px solid rgba(184,92,74,0.25)` },
  };
  return (
    <button className={className} onClick={disabled||loading ? undefined : onClick} style={{ ...base, ...variants[variant], ...style }}>
      {loading ? <Spinner/> : children}
    </button>
  );
}

function Input({ label, type="text", value, onChange, placeholder, hint, error, icon }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {label && <label style={{ fontSize:13, fontWeight:500, color:T.body }}>{label}</label>}
      <div style={{ position:"relative" }}>
        {icon && <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15, opacity:0.5 }}>{icon}</span>}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{
            width:"100%", padding: icon ? "12px 14px 12px 38px" : "12px 14px",
            border:`1.5px solid ${error ? T.danger : "rgba(201,147,58,0.2)"}`,
            borderRadius:8, fontSize:14, background:T.warmWhite, color:T.ink, outline:"none",
          }}
          onFocus={e => e.target.style.borderColor = T.gold}
          onBlur={e => e.target.style.borderColor = error ? T.danger : "rgba(201,147,58,0.2)"}
        />
      </div>
      {hint && !error && <span style={{ fontSize:12, color:T.muted }}>{hint}</span>}
      {error && <span style={{ fontSize:12, color:T.danger }}>{error}</span>}
    </div>
  );
}

function Card({ children, style={} }) {
  return (
    <div style={{ background:T.warmWhite, border:`1px solid rgba(201,147,58,0.15)`, borderRadius:16, padding:24, ...style }}>
      {children}
    </div>
  );
}

function SectionLabel({ children, light=false }) {
  return <span style={{ fontSize:11, fontWeight:500, letterSpacing:"0.18em", textTransform:"uppercase", color: light ? T.goldLight : T.gold, display:"block", marginBottom:8 }}>{children}</span>;
}

function DisplayTitle({ children, light=false, style={} }) {
  return <h2 style={{ fontFamily:"'Playfair Display', serif", fontWeight:700, fontSize:"clamp(24px,4vw,36px)", lineHeight:1.15, color: light ? T.warmWhite : T.ink, ...style }}>{children}</h2>;
}

function PageNav({ onBack, title, menuItems = [] }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ position:"sticky", top:0, zIndex:50 }}>
      <nav style={{ background:T.midnight, padding:"14px 28px", display:"flex", alignItems:"center", gap:16, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        {onBack && (
          <button onClick={onBack} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.7)", borderRadius:8, padding:"8px 14px", cursor:"pointer", fontSize:13 }}>← Back</button>
        )}
        <div style={{ fontFamily:"'Playfair Display', serif", fontSize:18, fontWeight:700, color:T.warmWhite, flex:1 }}>
          ✦ <span style={{ color:T.goldLight }}>Mystical</span> {title || "Messages"}
        </div>
        {menuItems.length > 0 && (
          <button className="show-mobile" onClick={() => setMenuOpen(o => !o)} style={{ background:"none", border:"none", cursor:"pointer", padding:"6px 4px", display:"flex", flexDirection:"column", gap:5, alignItems:"center", justifyContent:"center" }}>
            <span style={{ display:"block", width:22, height:2, background:"rgba(255,255,255,0.8)", borderRadius:2 }}/>
            <span style={{ display:"block", width:22, height:2, background:"rgba(255,255,255,0.8)", borderRadius:2 }}/>
            <span style={{ display:"block", width:22, height:2, background:"rgba(255,255,255,0.8)", borderRadius:2 }}/>
          </button>
        )}
      </nav>
      {menuOpen && (
        <div style={{ position:"absolute", top:"100%", right:0, background:T.midnight, borderLeft:`1px solid rgba(255,255,255,0.08)`, borderBottom:`1px solid rgba(255,255,255,0.08)`, borderRadius:"0 0 0 12px", padding:"8px 0", minWidth:160, boxShadow:"0 8px 32px rgba(0,0,0,0.4)", zIndex:1 }}>
          {menuItems.map(item => (
            <button key={item.label} onClick={() => { setMenuOpen(false); item.action(); }} style={{ display:"block", width:"100%", background:"none", border:"none", padding:"13px 24px", textAlign:"left", color:"rgba(255,255,255,0.8)", fontFamily:"'DM Sans', sans-serif", fontSize:14, cursor:"pointer" }}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   FOOTER COMPONENT
══════════════════════════════════════ */
function Footer({ onGoToAbout, onGoToTerms }) {
  return (
    <>
      {/* Mobile: fixed bar at bottom of screen */}
      <style>{`
        @media (max-width: 768px) {
          .footer-fixed { display:flex !important; }
          .footer-inline { display:none !important; }
        }
        @media (min-width: 769px) {
          .footer-fixed { display:none !important; }
          .footer-inline { display:block !important; }
        }
      `}</style>

      {/* Mobile fixed footer */}
      <footer className="footer-fixed" style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:100,
        background:T.warmWhite, borderTop:`1px solid rgba(201,147,58,0.2)`,
        padding:"10px 24px", alignItems:"center", justifyContent:"center",
        gap:24, display:"none",
        boxShadow:"0 -4px 16px rgba(0,0,0,0.06)",
      }}>
        <span style={{ fontSize:12, color:T.muted }}>© 2026 Mystical Texts LLC</span>
        <button onClick={onGoToAbout} style={{ background:"none", border:"none", color:T.gold, fontSize:13, cursor:"pointer", textDecoration:"underline" }}>About</button>
        <button onClick={onGoToTerms} style={{ background:"none", border:"none", color:T.gold, fontSize:13, cursor:"pointer", textDecoration:"underline" }}>Terms</button>
      </footer>

      {/* Desktop inline footer */}
      <footer className="footer-inline" style={{
        borderTop:`1px solid rgba(201,147,58,0.15)`, marginTop:48,
        padding:"28px 24px", textAlign:"center", display:"none",
      }}>
        <p style={{ fontSize:13, color:T.muted, marginBottom:12 }}>© 2026 Mystical Texts LLC. All rights reserved.</p>
        <div style={{ display:"flex", justifyContent:"center", gap:24, flexWrap:"wrap" }}>
          <button onClick={onGoToAbout} style={{ background:"none", border:"none", color:T.gold, fontSize:13, cursor:"pointer", textDecoration:"underline" }}>About</button>
          <button onClick={onGoToTerms} style={{ background:"none", border:"none", color:T.gold, fontSize:13, cursor:"pointer", textDecoration:"underline" }}>Terms of Service</button>
          <a href="mailto:hello@mysticaltexts.com" style={{ color:T.gold, fontSize:13 }}>Contact</a>
        </div>
      </footer>
    </>
  );
}

/* ══════════════════════════════════════
   SCREEN: ABOUT
══════════════════════════════════════ */
const FB_POSTS = [
  {
    id: "wonder",
    image: "/post-wonder.png",
    caption: "Kids today fact-check Santa. They ask Alexa if the Tooth Fairy is real. Keeping the magic alive has never been harder — but we'd argue it's never been more important. Mystical Messages is built to use technology for magic, for once.",
    link: "https://www.facebook.com/share/p/16vvK9BoNG/?mibextid=wwXIfr",
  },
  {
    id: "schedule",
    image: "/post-schedule.png",
    caption: "You don't have to wait for a crisis moment. Schedule a Santa message for Christmas Eve at 8pm. Set up a Tooth Fairy note the moment that first wobbly tooth appears. The magic is always ready — even when you're not.",
    link: "https://www.facebook.com/share/p/1BqkiArUGc/?mibextid=wwXIfr",
  },
  {
    id: "toothfairy",
    image: "/post-toothfairy.png",
    caption: "My daughter lost her tooth on a Tuesday night. No cash. Not a single dollar bill in the house. All I kept thinking was: I wish the Tooth Fairy could just send her a message. That one moment planted a seed — and from it, Mystical Messages grew.",
    link: "https://www.facebook.com/share/p/1QtV28Hhxp/?mibextid=wwXIfr",
  },
];

function AboutScreen({ onBack, menuItems }) {
  return (
    <div style={{ minHeight:"100vh", background:T.parchment }}>
      <PageNav onBack={onBack} title="Messages" menuItems={menuItems}/>
      <div style={{ maxWidth:680, margin:"0 auto", padding:"48px 24px 80px" }}>
        <div className="fade-up" style={{ marginBottom:32 }}>
          <SectionLabel>Our story</SectionLabel>
          <DisplayTitle>About Mystical Messages</DisplayTitle>
        </div>

        <div className="fade-up-1" style={{ display:"flex", flexDirection:"column", gap:20, fontFamily:"'Lora', serif", lineHeight:1.8 }}>
          <p style={{ fontSize:16, color:T.body }}>
            Mystical Messages is a service operated by <strong>Mystical Texts LLC</strong>, a company dedicated to
            creating magical, memorable moments for families through the power of storytelling and imagination.
          </p>
          <p style={{ fontSize:15, color:T.body }}>
            Our platform lets parents arrange SMS messages from beloved characters — Santa Claus, the Tooth Fairy,
            the Easter Bunny, and more — delivered straight to their own phones to share with their children.
            Messages are always parent-controlled and never sent directly to kids, keeping the magic safe and
            firmly in your hands.
          </p>
          <p style={{ fontSize:15, color:T.body }}>
            Founded with a simple belief: childhood is short, and wonder is worth protecting. Mystical Messages
            helps you be the architect of your child's most magical memories.
          </p>

          <div style={{ background:T.warmWhite, border:`1px solid rgba(201,147,58,0.2)`, borderRadius:16, padding:"24px 28px", marginTop:8 }}>
            <div style={{ fontFamily:"'Playfair Display', serif", fontSize:18, fontWeight:700, color:T.ink, marginBottom:6 }}>Get in touch</div>
            <p style={{ fontSize:14, color:T.muted }}>
              Questions or feedback? Reach us at{" "}
              <a href="mailto:hello@mysticaltexts.com" style={{ color:T.gold }}>hello@mysticaltexts.com</a>
            </p>
            <p style={{ fontSize:13, color:T.muted, marginTop:8 }}>Mystical Texts LLC · mysticaltexts.com</p>
          </div>
        </div>

        {/* ── Facebook post carousel ── */}
        <div className="fade-up-2" style={{ marginTop:56 }}>
          <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", flexWrap:"wrap", gap:8, marginBottom:24 }}>
            <div>
              <SectionLabel>From our community</SectionLabel>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:T.ink }}>Magic in the making</h3>
            </div>
            <a
              href="https://www.facebook.com/share/1BZD8axBSD/?mibextid=wwXIfr"
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize:13, color:T.gold, textDecoration:"none", whiteSpace:"nowrap" }}
            >
              Follow us on Facebook →
            </a>
          </div>

          <div className="post-carousel">
            {FB_POSTS.map(post => (
              <div key={post.id} className="post-card">
                <div style={{ background:T.warmWhite, border:`1.5px solid rgba(201,147,58,0.18)`, borderRadius:16, overflow:"hidden", display:"flex", flexDirection:"column", height:"100%" }}>
                  <img
                    src={post.image}
                    alt=""
                    style={{ width:"100%", aspectRatio:"4/3", objectFit:"cover", display:"block" }}
                  />
                  <div style={{ padding:"20px 20px 16px", display:"flex", flexDirection:"column", flex:1, gap:14 }}>
                    <div style={{ fontSize:36, lineHeight:1, color:T.gold, fontFamily:"Georgia,serif", marginBottom:-8 }}>"</div>
                    <p style={{ fontFamily:"'Lora',serif", fontSize:13, color:T.body, lineHeight:1.8, flex:1 }}>
                      {post.caption}
                    </p>
                    <a
                      href={post.link}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:12, color:T.gold, textDecoration:"none", fontWeight:500, alignSelf:"flex-start" }}
                    >
                      See full post →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   SCREEN: TERMS OF SERVICE
══════════════════════════════════════ */
function TermsScreen({ onBack, menuItems }) {
  const section = (title, text) => (
    <div style={{ marginBottom:28 }}>
      <h3 style={{ fontFamily:"'Playfair Display', serif", fontSize:17, fontWeight:700, color:T.ink, marginBottom:10 }}>{title}</h3>
      <p style={{ fontSize:14, color:T.body, lineHeight:1.8, fontFamily:"'Lora', serif" }}>{text}</p>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:T.parchment }}>
      <PageNav onBack={onBack} title="Messages" menuItems={menuItems}/>
      <div style={{ maxWidth:680, margin:"0 auto", padding:"48px 24px 80px" }}>
        <div className="fade-up" style={{ marginBottom:8 }}>
          <SectionLabel>Legal</SectionLabel>
          <DisplayTitle>Terms of Service</DisplayTitle>
          <p style={{ fontSize:13, color:T.muted, marginTop:8 }}>Last updated: June 2026 · Mystical Texts LLC</p>
        </div>

        <div className="fade-up-1" style={{ marginTop:36 }}>
          <p style={{ fontSize:15, color:T.body, lineHeight:1.8, fontFamily:"'Lora', serif", marginBottom:32, padding:"18px 22px", background:T.warmWhite, borderRadius:14, border:`1px solid rgba(201,147,58,0.15)` }}>
            These Terms of Service govern your use of Mystical Messages, a service provided by{" "}
            <strong>Mystical Texts LLC</strong>. By creating an account or using our service, you agree to these terms.
          </p>

          {section("1. The Service", "Mystical Messages delivers SMS messages from fictional characters to phone numbers you provide. All messages are sent to parents or guardians — never directly to minors. You are responsible for ensuring the phone number you register is your own.")}
          {section("2. Your Account", "You must provide accurate information when creating an account. You are responsible for all activity under your account. Mystical Texts LLC reserves the right to suspend accounts that violate these terms.")}
          {section("3. SMS Messaging & Consent", "By subscribing, you consent to receive SMS messages from Mystical Texts LLC via our platform. Message and data rates may apply. You can opt out at any time by replying STOP to any message or canceling your account. This service is provided for personal, non-commercial use only.")}
          {section("4. Payments & Refunds", "Subscriptions are billed monthly or as stated at checkout. Mystical Texts LLC does not offer refunds for partial billing periods. You may cancel your subscription at any time and retain access through the end of your paid period.")}
          {section("5. Prohibited Use", "You may not use Mystical Messages to send messages to phone numbers you do not own or have permission to message. You may not use the service for commercial solicitation, harassment, or any unlawful purpose.")}
          {section("6. Limitation of Liability", "Mystical Texts LLC is not liable for message delivery failures caused by carrier filtering, network issues, or factors outside our control. The service is provided as-is.")}

          <div style={{ padding:"20px 22px", borderRadius:14, background:T.warmWhite, border:`1px solid rgba(201,147,58,0.15)` }}>
            <h3 style={{ fontFamily:"'Playfair Display', serif", fontSize:17, fontWeight:700, color:T.ink, marginBottom:8 }}>7. Contact</h3>
            <p style={{ fontSize:14, color:T.body, lineHeight:1.8, fontFamily:"'Lora', serif" }}>
              <strong>Mystical Texts LLC</strong><br/>
              <a href="mailto:hello@mysticaltexts.com" style={{ color:T.gold }}>hello@mysticaltexts.com</a><br/>
              mysticaltexts.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   SCREEN: AUTH
══════════════════════════════════════ */
function AuthScreen({ onGoToAbout, onGoToTerms }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email:"", password:"", name:"", confirmPassword:"" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = k => v => setForm(f => ({ ...f, [k]:v }));

  function validate() {
    const e = {};
    if (!form.email.includes("@")) e.email = "Enter a valid email";
    if (form.password.length < 6) e.password = "Password must be 6+ characters";
    if (mode === "signup") {
      if (!form.name.trim()) e.name = "Your name is required";
      if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setLoading(true);
    setServerError("");

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email, password: form.password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.name } },
        });
        if (error) throw error;
        setServerError("Check your email to confirm your account, then log in.");
        setMode("login");
      }
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:T.midnight, display:"flex", alignItems:"center", justifyContent:"center", padding:24, position:"relative", overflow:"hidden" }}>
      <Stars count={90}/>
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:`radial-gradient(ellipse 70% 50% at 20% 80%, rgba(91,130,100,0.1) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 20%, rgba(201,147,58,0.07) 0%, transparent 55%)` }}/>

      <div style={{ position:"relative", zIndex:2, width:"100%", maxWidth:420 }}>
        <div className="fade-up" style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>✦</div>
          <div style={{ fontFamily:"'Playfair Display', serif", fontSize:24, fontWeight:700, color:T.warmWhite }}>
            Mystical <span style={{ color:T.goldLight }}>Messages</span>
          </div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginTop:6 }}>
            {mode === "login" ? "Welcome back" : "Create your parent account"}
          </div>
        </div>

        <div className="fade-up-1" style={{ background:"rgba(255,255,255,0.04)", backdropFilter:"blur(16px)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:32 }}>
          <div style={{ display:"flex", background:"rgba(255,255,255,0.06)", borderRadius:10, padding:4, marginBottom:28 }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setErrors({}); setServerError(""); }} style={{
                flex:1, padding:"9px 0", border:"none", borderRadius:8, cursor:"pointer",
                fontSize:14, fontWeight:500, transition:"all 0.2s",
                background: mode===m ? T.gold : "transparent",
                color: mode===m ? T.midnight : "rgba(255,255,255,0.5)",
              }}>{m === "login" ? "Log In" : "Sign Up"}</button>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {mode === "signup" && (
              <div style={{ color:"rgba(255,255,255,0.9)" }}>
                <Input label="Your name" value={form.name} onChange={set("name")} placeholder="Jane Smith" icon="👤" error={errors.name}/>
              </div>
            )}
            <div style={{ color:"rgba(255,255,255,0.9)" }}>
              <Input label="Email address" type="email" value={form.email} onChange={set("email")} placeholder="you@email.com" icon="✉️" error={errors.email}/>
            </div>
            <div style={{ color:"rgba(255,255,255,0.9)" }}>
              <Input label="Password" type="password" value={form.password} onChange={set("password")} placeholder="••••••••" icon="🔒" error={errors.password} hint={mode==="signup" ? "Minimum 6 characters" : undefined}/>
            </div>
            {mode === "signup" && (
              <div style={{ color:"rgba(255,255,255,0.9)" }}>
                <Input label="Confirm password" type="password" value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="••••••••" icon="🔒" error={errors.confirmPassword}/>
              </div>
            )}
            {serverError && (
              <div style={{ fontSize:13, color: serverError.includes("Check your email") ? T.goldLight : T.danger, padding:"10px 14px", background:"rgba(255,255,255,0.05)", borderRadius:8, lineHeight:1.5 }}>
                {serverError}
              </div>
            )}
            <Btn onClick={submit} loading={loading} style={{ marginTop:4, width:"100%", justifyContent:"center" }}>
              {mode === "login" ? "✦ Log In" : "✦ Create Account"}
            </Btn>
          </div>

          {mode === "signup" && (
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", textAlign:"center", marginTop:18, lineHeight:1.7 }}>
              By signing up you confirm you are 18+ and agree to our{" "}
              <button onClick={onGoToTerms} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer", textDecoration:"underline", fontSize:12 }}>Terms of Service</button>.
              Adults-only platform — children never have accounts.
            </p>
          )}
        </div>

        <div className="fade-up-2" style={{ marginTop:20, display:"flex", justifyContent:"center", gap:20, flexWrap:"wrap" }}>
          {["📱 Messages to your phone only", "🔒 No child data stored", "🛡️ Adults 18+ only"].map(t => (
            <span key={t} style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>{t}</span>
          ))}
        </div>

        <div className="fade-up-3" style={{ marginTop:16, display:"flex", justifyContent:"center", gap:20 }}>
          <button onClick={onGoToAbout} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.25)", cursor:"pointer", fontSize:12, textDecoration:"underline" }}>About</button>
          <button onClick={onGoToTerms} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.25)", cursor:"pointer", fontSize:12, textDecoration:"underline" }}>Terms</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   SCREEN: SETUP
══════════════════════════════════════ */
function SetupScreen({ user, onComplete }) {
  const [phone, setPhone] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!phone.trim()) { setError("Phone number is required — it's where your messages arrive."); return; }
    setLoading(true);
    try {
      let formattedPhone = phone.replace(/\D/g, "");
      if (formattedPhone.length === 10) formattedPhone = "+1" + formattedPhone;
      else if (!formattedPhone.startsWith("+")) formattedPhone = "+" + formattedPhone;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ phone_number: formattedPhone })
        .eq("id", user.id);
      if (profileError) throw profileError;

      if (childName.trim()) {
        await supabase.from("children").insert({
          parent_id: user.id,
          name: childName.trim(),
          age: childAge ? parseInt(childAge) : null,
          belief_level: "full",
        });
      }

      onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:T.midnight, display:"flex", alignItems:"center", justifyContent:"center", padding:24, position:"relative", overflow:"hidden" }}>
      <Stars count={60}/>
      <div style={{ position:"relative", zIndex:2, width:"100%", maxWidth:460 }}>
        <div className="fade-up" style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✨</div>
          <DisplayTitle light style={{ marginBottom:10 }}>Almost ready!</DisplayTitle>
          <p style={{ fontSize:14, color:"rgba(255,255,255,0.5)", lineHeight:1.7 }}>
            One last step. We need your phone number — that's where all the magic arrives.
          </p>
        </div>

        <div className="fade-up-1" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:32 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <div style={{ color:"rgba(255,255,255,0.9)" }}>
              <Input label="Your mobile number" type="tel" value={phone} onChange={setPhone} placeholder="(555) 123-4567" icon="📱"
                hint="This is the only number messages will ever be sent to."/>
            </div>

            <div style={{ height:1, background:"rgba(255,255,255,0.08)" }}/>

            <div style={{ color:"rgba(255,255,255,0.9)" }}>
              <Input label="First child's name (optional — you can add more later)" value={childName} onChange={setChildName} placeholder="e.g. Lily" icon="✏️"/>
            </div>
            {childName.trim() && (
              <div style={{ color:"rgba(255,255,255,0.9)" }}>
                <Input label="Their age" type="number" value={childAge} onChange={setChildAge} placeholder="7"/>
              </div>
            )}

            {error && <div style={{ fontSize:13, color:T.danger, padding:"10px 14px", background:"rgba(184,92,74,0.1)", borderRadius:8 }}>{error}</div>}

            <Btn onClick={save} loading={loading} style={{ width:"100%", justifyContent:"center", marginTop:4 }}>
              ✦ Start the Magic
            </Btn>
          </div>
        </div>

        <p style={{ textAlign:"center", fontSize:12, color:"rgba(255,255,255,0.25)", marginTop:16, lineHeight:1.7 }}>
          Your number is only used to deliver messages from magical characters. We never share it.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   SCREEN: DASHBOARD
══════════════════════════════════════ */

// Prevents the community modal from re-appearing if DashboardScreen re-mounts within the same session
let _communityModalShownThisSession = false;

const OH_CRAP_DEFAULTS = [
  { id:"tooth_emergency", emoji:"🦷", label:"Lost Tooth!", sub:"Tooth Fairy is on her way", charSlug:"tooth_fairy" },
  { id:"santa_watching",  emoji:"🎅", label:"Santa's Watching", sub:"Instant naughty/nice check", charSlug:"santa" },
  { id:"bunny_alert",     emoji:"🐰", label:"Easter Bunny Alert", sub:"Bunny sends a heads-up", charSlug:"easter_bunny" },
  { id:"wishlist",        emoji:"📝", label:"Wish List Confirmed", sub:"Santa got the list!", charSlug:"santa" },
];

function DashboardScreen({ session, profile, onGoToBilling, onGoToHistory, onGoToSchedule, onGoToProfiles, onGoToAbout, onGoToTerms, onLogout }) {
  const [characters, setCharacters] = useState([]);
  const [children, setChildren]     = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [activeChar, setActiveChar] = useState(null);
  const [composing, setComposing]   = useState(false);
  const [msgText, setMsgText]       = useState("");
  const [selectedChild, setSelectedChild] = useState(null);
  const [toast, setToast]           = useState(null);
  const [sending, setSending]       = useState(false);
  const [ohCrapSending, setOhCrapSending] = useState(null);
  const [showMomentModal, setShowMomentModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const plan = profile?.plan || "free";
  const userName = profile?.full_name?.split(" ")[0] || "there";

  useEffect(() => {
    loadData();
    if (!_communityModalShownThisSession && localStorage.getItem("mm_pending_share") === "true") {
      _communityModalShownThisSession = true;
      localStorage.removeItem("mm_pending_share");
      setShowCommunityModal(true);
    }
  }, []);

  async function loadData() {
    const { data: chars } = await supabase.from("characters").select("*").is("parent_id", null).eq("is_active", true);
    setCharacters(chars || []);

    const { data: kids } = await supabase.from("children").select("*").eq("parent_id", session.user.id).order("created_at");
    setChildren(kids || []);
    if (kids?.length > 0) setSelectedChild(kids[0]);

    const { data: msgs } = await supabase.from("messages").select("*, characters(name,emoji)").eq("parent_id", session.user.id).eq("status","sent").order("sent_at", { ascending:false }).limit(5);
    setRecentMessages(msgs || []);
  }

  function handleShareMoment() {
    localStorage.removeItem("mm_pending_share");
    setShowMomentModal(false);
    setShowCommunityModal(false);
    window.open("https://www.facebook.com/share/g/198dX4RHmA/?mibextid=wwXIfr", "_blank", "noopener,noreferrer");
  }

  function handleDismissMoment() {
    setShowMomentModal(false);
    // Leave mm_pending_share set so Pop-up 2 shows on next session
  }

  function handleDismissCommunity() {
    setShowCommunityModal(false);
  }

  function canUse(char) {
    return (PLAN_RANK[plan] || 0) >= (PLAN_RANK[char.required_plan] || 0);
  }

  async function sendOhCrap(btn) {
    const char = characters.find(c => c.slug === btn.charSlug);
    if (!char) { setToast("Character not found. Please contact support."); return; }
    if (!canUse(char)) { onGoToBilling(); return; }
    if (!profile?.phone_number) { setToast("Please add your phone number in settings first."); return; }

    const childName = selectedChild?.name || "there";
    const body = getOhCrapTemplate(btn.id, childName);

    setOhCrapSending(btn.id);
    try {
      if (!TEST_MODE) {
        await callFunction("send-message", {
          character_id: char.id, body, child_id: selectedChild?.id || null, is_ohcrap: true,
        });
      }
      setToast(TEST_MODE ? `[TEST] ${btn.emoji} ${btn.label} — no SMS sent` : `${btn.emoji} ${btn.label} message sent to your phone!`);
      localStorage.setItem("mm_pending_share", "true");
      setShowMomentModal(true);
      loadData();
    } catch (err) {
      setToast(`Error: ${err.message}`);
    } finally {
      setOhCrapSending(null);
    }
  }

  async function sendMessage() {
    if (!msgText.trim() || !activeChar) return;
    setSending(true);
    try {
      if (!TEST_MODE) {
        await callFunction("send-message", {
          character_id: activeChar.id, body: msgText,
          child_id: selectedChild?.id || null, is_ohcrap: false,
        });
      }
      setToast(TEST_MODE ? `[TEST] ${activeChar.emoji} Message simulated — no SMS sent` : `${activeChar.emoji} Message sent to your phone!`);
      setMsgText(""); setComposing(false); setActiveChar(null);
      localStorage.setItem("mm_pending_share", "true");
      setShowMomentModal(true);
      loadData();
    } catch (err) {
      setToast(`Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:T.parchment }}>
      {/* Nav wrapper is the sticky anchor; dropdown uses position:absolute relative to it */}
      <div style={{ position:"sticky", top:0, zIndex:50 }}>
        <nav style={{ background:T.midnight, padding:"14px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontFamily:"'Playfair Display', serif", fontSize:18, fontWeight:700, color:T.warmWhite }}>
            ✦ <span style={{ color:T.goldLight }}>Mystical</span> Messages
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"nowrap" }}>
            <Btn variant="ghost" small onClick={onGoToProfiles} className="hide-mobile">👨‍👩‍👧 Profiles</Btn>
            <Btn variant="ghost" small onClick={onGoToSchedule} className="hide-mobile">📅 Schedule</Btn>
            <Btn variant="ghost" small onClick={onGoToHistory} className="hide-mobile">🕰 History</Btn>
            <Btn variant="outline" small onClick={onGoToBilling} style={{ color:T.goldLight, borderColor:"rgba(201,147,58,0.3)" }}>
              ⭐ {plan.charAt(0).toUpperCase()+plan.slice(1)} Plan
            </Btn>
            <Btn variant="ghost" small onClick={onLogout} className="hide-mobile">Log out</Btn>
            {/* Hamburger — mobile only */}
            <button className="show-mobile" onClick={() => setMenuOpen(o => !o)} style={{ background:"none", border:"none", cursor:"pointer", padding:"6px 4px", display:"flex", flexDirection:"column", gap:5, alignItems:"center", justifyContent:"center" }}>
              <span style={{ display:"block", width:22, height:2, background:"rgba(255,255,255,0.8)", borderRadius:2 }}/>
              <span style={{ display:"block", width:22, height:2, background:"rgba(255,255,255,0.8)", borderRadius:2 }}/>
              <span style={{ display:"block", width:22, height:2, background:"rgba(255,255,255,0.8)", borderRadius:2 }}/>
            </button>
          </div>
        </nav>
        {/* Mobile dropdown — absolute so it appears just below the nav bar */}
        {menuOpen && (
          <div style={{ position:"absolute", top:"100%", right:0, background:T.midnight, borderLeft:`1px solid rgba(255,255,255,0.08)`, borderBottom:`1px solid rgba(255,255,255,0.08)`, borderRadius:"0 0 0 12px", padding:"8px 0", minWidth:180, boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
            {[
              { label:"👨‍👩‍👧 Profiles",  action: onGoToProfiles },
              { label:"📅 Schedule",  action: onGoToSchedule },
              { label:"🕰 History",   action: onGoToHistory },
              { label:"✨ About",     action: onGoToAbout },
              { label:"📜 Terms",     action: onGoToTerms },
              { label:"Log out",     action: onLogout },
            ].map(item => (
              <button key={item.label} onClick={() => { setMenuOpen(false); item.action(); }} style={{ display:"block", width:"100%", background:"none", border:"none", padding:"13px 24px", textAlign:"left", color:"rgba(255,255,255,0.8)", fontFamily:"'DM Sans', sans-serif", fontSize:14, cursor:"pointer" }}>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`@media (max-width: 768px) { .dash-content { padding-bottom: 80px !important; } }`}</style>
      <div className="dash-content" style={{ flex:1, maxWidth:860, margin:"0 auto", width:"100%", padding:"32px 24px 20px" }}>

        <div className="fade-up" style={{ marginBottom:32 }}>
          <SectionLabel>Welcome back</SectionLabel>
          <DisplayTitle>Good evening, {userName} ✦</DisplayTitle>
          {children.length > 0 && (
            <p style={{ fontSize:14, color:T.muted, marginTop:6, fontFamily:"'Lora', serif", fontStyle:"italic" }}>
              {selectedChild?.name} is waiting for a little magic tonight.
            </p>
          )}
        </div>

        {children.length > 1 && (
          <div className="fade-up" style={{ marginBottom:24, display:"flex", gap:8, flexWrap:"wrap" }}>
            <span style={{ fontSize:13, color:T.muted, alignSelf:"center" }}>Sending for:</span>
            {children.map(child => (
              <button key={child.id} onClick={() => setSelectedChild(child)} style={{
                padding:"6px 14px", borderRadius:100, fontSize:13, cursor:"pointer",
                border:`1.5px solid ${selectedChild?.id===child.id ? T.gold : "rgba(201,147,58,0.2)"}`,
                background: selectedChild?.id===child.id ? T.goldPale : "transparent",
                color: selectedChild?.id===child.id ? T.gold : T.muted,
                fontWeight: selectedChild?.id===child.id ? 600 : 400,
              }}>{child.avatar || "🧒"} {child.name}</button>
            ))}
          </div>
        )}

        {!profile?.phone_number && (
          <div className="fade-up" style={{ marginBottom:24, padding:"14px 18px", background:"rgba(184,92,74,0.08)", border:`1px solid rgba(184,92,74,0.25)`, borderRadius:12, display:"flex", gap:12, alignItems:"center" }}>
            <span style={{ fontSize:20 }}>📱</span>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:T.danger }}>No phone number on file</div>
              <div style={{ fontSize:13, color:T.muted }}>Messages need a destination. Add your phone number in Account Settings to start sending.</div>
            </div>
          </div>
        )}

        <div className="fade-up-1" style={{ marginBottom:36 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div>
              <SectionLabel>Emergency Magic</SectionLabel>
              <h3 style={{ fontFamily:"'Playfair Display', serif", fontSize:18, fontWeight:700, color:T.ink }}>🚨 Oh-Crap!! Buttons</h3>
            </div>
            <span style={{ fontSize:12, color:T.muted, fontStyle:"italic" }}>One tap. Magic in seconds.</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
            {OH_CRAP_DEFAULTS.map(btn => {
              const isSending = ohCrapSending === btn.id;
              return (
                <button key={btn.id} onClick={() => sendOhCrap(btn)} disabled={!!ohCrapSending} style={{
                  background: isSending ? `rgba(201,147,58,0.1)` : T.warmWhite,
                  border:`1.5px solid ${isSending ? T.gold : "rgba(201,147,58,0.18)"}`,
                  borderRadius:14, padding:"18px 20px", cursor: ohCrapSending ? "not-allowed" : "pointer",
                  display:"flex", alignItems:"center", gap:14, textAlign:"left", transition:"all 0.2s",
                }}
                  onMouseEnter={e => { if(!ohCrapSending) { e.currentTarget.style.borderColor=T.gold; e.currentTarget.style.transform="translateY(-1px)"; }}}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=isSending?T.gold:"rgba(201,147,58,0.18)"; e.currentTarget.style.transform="translateY(0)"; }}
                >
                  <span style={{ fontSize:28, flexShrink:0 }}>{isSending ? "⏳" : btn.emoji}</span>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:T.ink, marginBottom:3 }}>{btn.label}</div>
                    <div style={{ fontSize:12, color:T.muted }}>{btn.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="fade-up-2" style={{ marginBottom:36 }}>
          <SectionLabel>Send a Message</SectionLabel>
          <h3 style={{ fontFamily:"'Playfair Display', serif", fontSize:18, fontWeight:700, color:T.ink, marginBottom:16 }}>Choose a character</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {characters.map(char => {
              const unlocked = canUse(char);
              const selected = activeChar?.id === char.id;
              return (
                <button key={char.id} onClick={() => {
                  if (!unlocked) { onGoToBilling(); return; }
                  setActiveChar(selected ? null : char);
                  setComposing(!selected);
                  setMsgText("");
                }} style={{
                  background: selected ? `rgba(201,147,58,0.08)` : unlocked ? T.warmWhite : T.cream,
                  border:`1.5px solid ${selected ? T.gold : "rgba(201,147,58,0.15)"}`,
                  borderRadius:14, padding:"20px 12px", cursor:"pointer",
                  textAlign:"center", transition:"all 0.2s", opacity: unlocked ? 1 : 0.6, position:"relative",
                }}>
                  {!unlocked && <div style={{ position:"absolute", top:8, right:8, background:T.gold, color:T.midnight, fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:100 }}>UPGRADE</div>}
                  <div style={{ fontSize:32, marginBottom:8 }}>{char.emoji}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.ink, marginBottom:4 }}>{char.name}</div>
                  {selected && <div style={{ marginTop:8, fontSize:11, color:T.gold, fontWeight:600 }}>Selected ✓</div>}
                </button>
              );
            })}
          </div>

          {composing && activeChar && (
            <div style={{ marginTop:16, background:T.warmWhite, border:`1.5px solid rgba(201,147,58,0.3)`, borderRadius:16, padding:24, animation:"fadeUp 0.3s ease" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <span style={{ fontSize:22 }}>{activeChar.emoji}</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:T.ink }}>Message from {activeChar.name}</div>
                  <div style={{ fontSize:12, color:T.muted }}>To: {selectedChild?.name ? `${selectedChild.name}'s` : "your"} parent phone (you)</div>
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, color:T.muted, marginBottom:8, fontWeight:500 }}>Quick templates:</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {getTemplates(activeChar.slug).map((t,i) => (
                    <button key={i} onClick={() => setMsgText(t.replace("{child}", selectedChild?.name || "there"))} style={{
                      fontSize:12, padding:"6px 12px", borderRadius:100, border:"1px solid rgba(201,147,58,0.25)",
                      background:T.parchment, color:T.body, cursor:"pointer",
                    }}>{t.replace("{child}", selectedChild?.name || "there").slice(0,40)}…</button>
                  ))}
                </div>
              </div>
              <textarea value={msgText} onChange={e => setMsgText(e.target.value)}
                placeholder={`Write your message as ${activeChar.name}…`} rows={4}
                style={{ width:"100%", padding:14, borderRadius:10, border:"1.5px solid rgba(201,147,58,0.2)", fontSize:14, color:T.ink, background:T.parchment, resize:"vertical", fontFamily:"'Lora',serif", lineHeight:1.65, outline:"none" }}
                onFocus={e => e.target.style.borderColor=T.gold}
                onBlur={e => e.target.style.borderColor="rgba(201,147,58,0.2)"}
              />
              <div style={{ display:"flex", gap:10, marginTop:12, alignItems:"center" }}>
                <Btn onClick={sendMessage} disabled={!msgText.trim()} loading={sending}>✦ Send to My Phone</Btn>
                <Btn variant="outline" small onClick={() => { setComposing(false); setActiveChar(null); }}>Cancel</Btn>
                <span style={{ fontSize:12, color:T.muted, marginLeft:"auto" }}>{msgText.length}/320</span>
              </div>
            </div>
          )}
        </div>

        <div className="fade-up-3">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div>
              <SectionLabel>History</SectionLabel>
              <h3 style={{ fontFamily:"'Playfair Display', serif", fontSize:18, fontWeight:700, color:T.ink }}>Recent messages</h3>
            </div>
            <span style={{ fontSize:13, color:T.gold, cursor:"pointer" }} onClick={onGoToHistory}>View all →</span>
          </div>
          {recentMessages.length === 0 ? (
            <div style={{ textAlign:"center", padding:"32px 24px", color:T.muted, background:T.warmWhite, borderRadius:16, border:"1px solid rgba(201,147,58,0.12)" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>✨</div>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:16, color:T.ink }}>No messages yet</div>
              <div style={{ fontSize:13, marginTop:4 }}>Your first magical moment will appear here.</div>
            </div>
          ) : recentMessages.map((msg,i) => (
            <div key={msg.id} style={{ background:T.warmWhite, border:"1px solid rgba(201,147,58,0.12)", borderRadius:12, padding:"16px 18px", display:"flex", alignItems:"center", gap:14, marginBottom:10 }}>
              <span style={{ fontSize:24, flexShrink:0 }}>{msg.characters?.emoji}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:3 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:T.ink }}>{msg.characters?.name}</span>
                </div>
                <div style={{ fontSize:13, color:T.muted, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{msg.body}</div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize:11, color:T.muted }}>{new Date(msg.sent_at).toLocaleDateString()}</div>
                <div style={{ fontSize:11, color:T.success, marginTop:3 }}>✓ Sent</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer onGoToAbout={onGoToAbout} onGoToTerms={onGoToTerms}/>

      {showMomentModal && (
        <MagicShareModal variant="moment" onShare={handleShareMoment} onDismiss={handleDismissMoment}/>
      )}
      {showCommunityModal && (
        <MagicShareModal variant="community" onShare={handleShareMoment} onDismiss={handleDismissCommunity}/>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)}/>}
    </div>
  );
}

/* ══════════════════════════════════════
   SCREEN: BILLING
══════════════════════════════════════ */
const PLANS = [
  { id:"trial",    tier:"Try It Once", price:"$0.99", period:"one-time", badge:null,
    features:["1 message, any character","Template or custom","No subscription"], cta:"Send one message" },
  { id:"basic",    tier:"Basic",       price:"$4.99", period:"/mo", badge:null,
    features:["Santa & Tooth Fairy","15 templates","Basic scheduling","1 child profile"], cta:"Choose Basic" },
  { id:"standard", tier:"Standard",    price:"$9.99", period:"/mo", badge:"Best Value",
    features:["All 3 core characters","30+ templates","Oh-Crap!! Buttons","Message history","Multiple children","Advanced scheduling"], cta:"Choose Standard" },
  { id:"premium",  tier:"Premium",     price:"$14.99", period:"/mo", badge:null,
    features:["Everything in Standard","Build your own custom character","Unlimited saved message scripts","Priority support"], cta:"Choose Premium" },
];

const BADGE_DATA = [
  { id:"trial",    image:"/badge-trial.png",    tier:"Try It Once", price:"$0.99",     description:"Not sure yet? No pressure at all. One magical message, zero commitment — just the perfect way to see your child's face light up.", scrollCta:"Let's give it a whirl ✨" },
  { id:"basic",    image:"/badge-basic.png",    tier:"Basic",       price:"$4.99/mo",  description:"Santa and the Tooth Fairy are standing by. Solid templates, simple scheduling — everything you need to nail the classics.", scrollCta:"This feels right for us →" },
  { id:"standard", image:"/badge-standard.png", tier:"Standard",    price:"$9.99/mo",  description:"Honestly? This is the one most families end up loving. All three characters, Oh-Crap!! buttons for those last-minute saves, and plenty of room to grow.", scrollCta:"Ooh yes, this is the one →" },
  { id:"premium",  image:"/badge-premium.png",  tier:"Premium",     price:"$14.99/mo", description:"You take magic seriously — and I respect it. Build your own characters, write your own scripts, and make every moment uniquely yours.", scrollCta:"Go big — we deserve it ✨" },
];

function BadgeFlipCard({ badge, isFlipped, onFlip, onScrollTo }) {
  return (
    <div onClick={onFlip} style={{ perspective:1000, cursor:"pointer", height:290, userSelect:"none" }}>
      <div style={{
        position:"relative", width:"100%", height:"100%",
        transformStyle:"preserve-3d",
        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        transition:"transform 0.55s cubic-bezier(0.4,0.2,0.2,1)",
      }}>
        {/* FRONT */}
        <div style={{
          position:"absolute", inset:0, backfaceVisibility:"hidden",
          background:T.warmWhite, border:`1.5px solid rgba(201,147,58,0.2)`,
          borderRadius:16, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", padding:"24px 16px", gap:6,
        }}>
          <img src={badge.image} alt={badge.tier} style={{ width:84, height:"auto", marginBottom:6 }}/>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:T.ink, textAlign:"center" }}>{badge.tier}</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:T.gold }}>{badge.price}</div>
          <div style={{ fontSize:10, color:T.muted, letterSpacing:"0.05em", marginTop:4 }}>tap to learn more</div>
        </div>
        {/* BACK */}
        <div style={{
          position:"absolute", inset:0, backfaceVisibility:"hidden",
          transform:"rotateY(180deg)",
          background:T.midnight, borderRadius:16,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          padding:"28px 20px", gap:16, textAlign:"center",
        }}>
          <div style={{ fontFamily:"'Lora',serif", fontSize:13, color:"rgba(255,255,255,0.78)", lineHeight:1.75 }}>
            {badge.description}
          </div>
          <button
            onClick={e => { e.stopPropagation(); onScrollTo(); }}
            style={{
              background:"transparent", border:`1.5px solid rgba(201,147,58,0.45)`,
              color:"#e8b96a", borderRadius:8, padding:"10px 14px",
              fontSize:12, fontWeight:500, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", width:"100%",
            }}
          >
            {badge.scrollCta}
          </button>
        </div>
      </div>
    </div>
  );
}

function BillingScreen({ profile, session, onBack, onSelectPlan, menuItems }) {
  const [toast, setToast]               = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [loadingPlan, setLoadingPlan]   = useState(null);
  const [flippedCard, setFlippedCard]   = useState(null);

  const currentPlan = profile?.plan || "free";

  function scrollToPlan(planId) {
    document.getElementById(`plan-card-${planId}`)?.scrollIntoView({ behavior:"smooth", block:"center" });
  }

  async function checkout(planId) {
    onSelectPlan(planId);
    return; // prelaunch intercept — remove this block when payments go live
    setLoadingPlan(planId);
    try {
      const { url } = await callFunction("create-checkout-session", {
        price_id: STRIPE_PRICES[planId],
        plan_name: planId,
      });
      if (url) window.location.href = url;
      else setToast("Could not start checkout. Please try again.");
    } catch (err) {
      setToast(`Error: ${err.message}`);
    } finally {
      setLoadingPlan(null);
    }
  }

  async function cancelSubscription() {
    setToast("To cancel, please email support@mysticaltexts.com and we'll process it within 24 hours.");
    setCancelConfirm(false);
  }


  return (
    <div style={{ minHeight:"100vh", background:T.parchment }}>
      <PageNav onBack={onBack} title="Messages" menuItems={menuItems}/>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"40px 24px 80px" }}>
        <div className="fade-up" style={{ marginBottom:40 }}>
          <SectionLabel>Account & Billing</SectionLabel>
          <DisplayTitle>Your subscription</DisplayTitle>

          {currentPlan === "free" && (
            <div style={{ marginTop:20, background:"rgba(201,147,58,0.07)", border:`1.5px solid rgba(201,147,58,0.25)`, borderRadius:16, padding:"18px 22px", display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ fontSize:28, flexShrink:0 }}>✨</div>
              <p style={{ fontFamily:"'Lora',serif", fontSize:14, color:T.body, lineHeight:1.7, margin:0 }}>
                To send your first message, choose any plan below — even one message is pure magic. The badges up ahead will help you find your fit.
              </p>
            </div>
          )}

          {currentPlan !== "free" && (
            <div style={{ marginTop:20, background:T.warmWhite, border:`1.5px solid ${T.gold}`, borderRadius:16, padding:"20px 22px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:"50%", background:T.goldPale, border:`1.5px solid rgba(201,147,58,0.3)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🌠</div>
                <div>
                  <div style={{ fontSize:16, fontWeight:700, color:T.ink, fontFamily:"'Playfair Display', serif" }}>{currentPlan.charAt(0).toUpperCase()+currentPlan.slice(1)} Plan</div>
                  <div style={{ fontSize:13, color:T.muted }}>Managed via Stripe · Cancel anytime</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <span style={{ background:"rgba(74,140,110,0.1)", color:T.success, border:"1px solid rgba(74,140,110,0.25)", fontSize:12, fontWeight:600, padding:"5px 14px", borderRadius:100, whiteSpace:"nowrap" }}>✓ Active</span>
                <button onClick={() => setCancelConfirm(true)} style={{ background:"none", border:"none", color:T.muted, fontSize:13, cursor:"pointer", textDecoration:"underline", whiteSpace:"nowrap" }}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Badge Flip Cards ── */}
        <div className="fade-up-1" style={{ marginBottom:48 }}>
          <div style={{ marginBottom:20 }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:T.ink, marginBottom:6 }}>Which level of magic fits your family?</h3>
            <p style={{ fontSize:13, color:T.muted }}>Tap a badge to see what each plan is all about.</p>
          </div>
          <div className="badge-grid">
            {BADGE_DATA.map(badge => (
              <BadgeFlipCard
                key={badge.id}
                badge={badge}
                isFlipped={flippedCard === badge.id}
                onFlip={() => setFlippedCard(prev => prev === badge.id ? null : badge.id)}
                onScrollTo={() => { setFlippedCard(null); scrollToPlan(badge.id); }}
              />
            ))}
          </div>
          <div className="badge-carousel">
            {BADGE_DATA.map(badge => (
              <div key={badge.id} className="badge-item">
                <BadgeFlipCard
                  badge={badge}
                  isFlipped={flippedCard === badge.id}
                  onFlip={() => setFlippedCard(prev => prev === badge.id ? null : badge.id)}
                  onScrollTo={() => { setFlippedCard(null); scrollToPlan(badge.id); }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="fade-up-2" style={{ marginBottom:48 }}>
          <h3 style={{ fontFamily:"'Playfair Display', serif", fontSize:20, fontWeight:700, color:T.ink, marginBottom:20 }}>All plans</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:14 }}>
            {PLANS.map(plan => {
              const isCurrent = currentPlan === plan.id;
              return (
                <div key={plan.id} id={`plan-card-${plan.id}`} style={{
                  background: isCurrent ? T.midnight : T.warmWhite,
                  border:`1.5px solid ${isCurrent ? T.gold : "rgba(201,147,58,0.15)"}`,
                  borderRadius:16, padding:"28px 20px", position:"relative",
                  boxShadow: isCurrent ? "0 12px 40px rgba(0,0,0,0.15)" : "none",
                }}>
                  {plan.badge && <div style={{ position:"absolute", top:-11, left:"50%", transform:"translateX(-50%)", background:T.gold, color:T.midnight, fontSize:10, fontWeight:700, padding:"3px 12px", borderRadius:100, whiteSpace:"nowrap" }}>{plan.badge}</div>}
                  <div style={{ fontSize:11, fontWeight:500, letterSpacing:"0.15em", textTransform:"uppercase", color: isCurrent ? T.goldLight : T.gold, marginBottom:6 }}>{plan.tier}</div>
                  <div style={{ fontFamily:"'Playfair Display', serif", fontSize:32, fontWeight:700, color: isCurrent ? T.warmWhite : T.ink, lineHeight:1 }}>{plan.price}</div>
                  <div style={{ fontSize:13, color: isCurrent ? "rgba(255,255,255,0.4)" : T.muted, marginBottom:18 }}>{plan.period}</div>
                  <div style={{ height:1, background: isCurrent ? "rgba(255,255,255,0.1)" : "rgba(201,147,58,0.15)", marginBottom:16 }}/>
                  <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
                    {plan.features.map((f,i) => (
                      <li key={i} style={{ display:"flex", gap:8, fontSize:12, color: isCurrent ? "rgba(255,255,255,0.65)" : T.body, lineHeight:1.4 }}>
                        <span style={{ color:T.gold, flexShrink:0, fontSize:10, marginTop:2 }}>✦</span>{f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => !isCurrent && checkout(plan.id)} disabled={isCurrent || loadingPlan === plan.id} style={{
                    width:"100%", padding:"11px 0", borderRadius:8, fontSize:13, fontWeight:500,
                    cursor: isCurrent ? "default" : "pointer", transition:"all 0.2s",
                    background: isCurrent ? "rgba(201,147,58,0.15)" : "transparent",
                    border: isCurrent ? "none" : "1.5px solid rgba(201,147,58,0.3)",
                    color: isCurrent ? T.goldLight : T.gold,
                    fontFamily:"'DM Sans', sans-serif",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  }}>
                    {loadingPlan === plan.id ? <Spinner/> : isCurrent ? "Current Plan" : plan.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Invite code ── */}
        <div className="fade-up-3" style={{ marginBottom:40 }}>
          <div style={{ background:T.warmWhite, border:`1.5px solid rgba(201,147,58,0.2)`, borderRadius:16, padding:"24px 26px" }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:T.ink, marginBottom:4 }}>Have an invite code?</div>
            <p style={{ fontSize:13, color:T.muted, marginBottom:16, fontFamily:"'Lora',serif" }}>Enter it below to unlock your preview access — no payment needed.</p>
            <button
              onClick={() => onSelectPlan("banner")}
              style={{ padding:"11px 20px", borderRadius:8, background:T.gold, color:T.midnight, border:"none", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all 0.2s" }}
            >
              Redeem code ✦
            </button>
          </div>
        </div>

        <div style={{ textAlign:"center", display:"flex", justifyContent:"center", gap:24, flexWrap:"wrap" }}>
          {["🔒 Stripe Secure","❌ Cancel anytime","📱 Messages to your phone only"].map(t => (
            <span key={t} style={{ fontSize:12, color:T.muted }}>{t}</span>
          ))}
        </div>
      </div>

      {cancelConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(13,27,42,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:24 }} onClick={() => setCancelConfirm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background:T.warmWhite, borderRadius:20, padding:32, maxWidth:400, width:"100%", textAlign:"center", animation:"fadeUp 0.3s ease" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>😔</div>
            <h3 style={{ fontFamily:"'Playfair Display', serif", fontSize:22, marginBottom:10, color:T.ink }}>Cancel your plan?</h3>
            <p style={{ fontSize:14, color:T.muted, lineHeight:1.7, marginBottom:24 }}>Email support@mysticaltexts.com and we will process your cancellation within 24 hours.</p>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <Btn variant="danger" onClick={cancelSubscription}>Yes, cancel</Btn>
              <Btn onClick={() => setCancelConfirm(false)}>Keep the magic</Btn>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)}/>}
    </div>
  );
}

/* ══════════════════════════════════════
   SCREEN: CHILD PROFILES
══════════════════════════════════════ */
const AVATARS = ["🧒","👦","👧","🧑","🌟","🦋","🐻","🦊","🐼","🦁","🐸","🌈"];
const BELIEF_LEVELS = [
  { id:"full",      label:"Full believer",       desc:"100% believes — keep it magical!", color:T.success },
  { id:"wavering",  label:"Starting to wonder",  desc:"Some doubts — tread carefully",    color:T.gold },
  { id:"knows",     label:"In on the secret",    desc:"They know — but play along",       color:T.muted },
];

function ChildProfileScreen({ session, onBack, menuItems }) {
  const [children, setChildren] = useState([]);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState({ name:"", age:"", avatar:"🧒", belief_level:"full", notes:"" });
  const [toast, setToast]       = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving]     = useState(false);

  const set = k => v => setForm(f => ({ ...f, [k]:v }));

  useEffect(() => { loadChildren(); }, []);

  async function loadChildren() {
    const { data } = await supabase.from("children").select("*").eq("parent_id", session.user.id).order("created_at");
    setChildren(data || []);
  }

  function openNew() { setForm({ name:"", age:"", avatar:"🧒", belief_level:"full", notes:"" }); setEditing("new"); }
  function openEdit(child) { setForm({ ...child }); setEditing(child.id); }

  async function saveChild() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing === "new") {
        await supabase.from("children").insert({ ...form, parent_id: session.user.id, age: form.age ? parseInt(form.age) : null });
        setToast(`${form.avatar} ${form.name} added!`);
      } else {
        await supabase.from("children").update({ ...form, age: form.age ? parseInt(form.age) : null }).eq("id", editing);
        setToast(`${form.avatar} ${form.name} updated!`);
      }
      setEditing(null);
      loadChildren();
    } catch (err) {
      setToast(`Error: ${err.message}`);
    } finally { setSaving(false); }
  }

  async function deleteChild(id) {
    await supabase.from("children").delete().eq("id", id);
    setDeleteConfirm(null);
    setToast("Child profile removed.");
    loadChildren();
  }

  return (
    <div style={{ minHeight:"100vh", background:T.parchment }}>
      <PageNav onBack={onBack} title="Messages" menuItems={menuItems}/>
      <div style={{ maxWidth:720, margin:"0 auto", padding:"40px 24px 80px" }}>
        <div className="fade-up" style={{ marginBottom:32 }}>
          <SectionLabel>Family Setup</SectionLabel>
          <DisplayTitle>Child Profiles</DisplayTitle>
          <p style={{ fontSize:14, color:T.muted, marginTop:8, fontFamily:"'Lora',serif", fontStyle:"italic" }}>
            Add each child to personalise messages with their name and belief level.
          </p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
          {children.map(child => {
            const belief = BELIEF_LEVELS.find(b => b.id === child.belief_level);
            return (
              <div key={child.id} style={{ background:T.warmWhite, border:"1.5px solid rgba(201,147,58,0.15)", borderRadius:16, padding:"20px 22px", display:"flex", alignItems:"center", gap:16, transition:"border-color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor="rgba(201,147,58,0.3)"}
                onMouseLeave={e => e.currentTarget.style.borderColor="rgba(201,147,58,0.15)"}
              >
                <div style={{ width:56, height:56, borderRadius:"50%", background:T.cream, border:"1.5px solid rgba(201,147,58,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>{child.avatar}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4, flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:T.ink }}>{child.name}</span>
                    {child.age && <span style={{ fontSize:12, color:T.muted }}>Age {child.age}</span>}
                    <span style={{ fontSize:11, fontWeight:600, padding:"2px 10px", borderRadius:100, background:`${belief?.color}18`, color:belief?.color, border:`1px solid ${belief?.color}40` }}>{belief?.label}</span>
                  </div>
                  {child.notes && <div style={{ fontSize:13, color:T.muted, fontStyle:"italic", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>"{child.notes}"</div>}
                </div>
                <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                  <Btn variant="outline" small onClick={() => openEdit(child)}>Edit</Btn>
                  <Btn variant="danger" small onClick={() => setDeleteConfirm(child.id)}>✕</Btn>
                </div>
              </div>
            );
          })}
        </div>

        {editing === null && (
          <button onClick={openNew} style={{ width:"100%", padding:18, borderRadius:16, border:"2px dashed rgba(201,147,58,0.3)", background:"transparent", color:T.gold, fontSize:14, fontWeight:500, cursor:"pointer", transition:"all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=T.gold; e.currentTarget.style.background=T.goldPale; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(201,147,58,0.3)"; e.currentTarget.style.background="transparent"; }}
          >+ Add a child</button>
        )}

        {editing !== null && (
          <div style={{ background:T.warmWhite, border:`1.5px solid ${T.gold}`, borderRadius:20, padding:28, animation:"fadeUp 0.3s ease", marginTop:8 }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:T.ink, marginBottom:22 }}>
              {editing === "new" ? "Add a child" : `Edit ${form.name}`}
            </h3>
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div>
                <label style={{ fontSize:13, fontWeight:500, color:T.body, display:"block", marginBottom:10 }}>Choose an avatar</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {AVATARS.map(a => (
                    <button key={a} onClick={() => set("avatar")(a)} style={{ width:44, height:44, borderRadius:"50%", fontSize:22, border:`2px solid ${form.avatar===a ? T.gold : "rgba(201,147,58,0.2)"}`, background: form.avatar===a ? T.goldPale : T.cream, cursor:"pointer" }}>{a}</button>
                  ))}
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 100px", gap:14 }}>
                <Input label="Child's first name" value={form.name} onChange={set("name")} placeholder="e.g. Lily" icon="✏️"/>
                <Input label="Age" type="number" value={form.age} onChange={set("age")} placeholder="7"/>
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:500, color:T.body, display:"block", marginBottom:10 }}>Belief level</label>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {BELIEF_LEVELS.map(b => (
                    <button key={b.id} onClick={() => set("belief_level")(b.id)} style={{ padding:"13px 16px", borderRadius:10, cursor:"pointer", textAlign:"left", border:`1.5px solid ${form.belief_level===b.id ? b.color : "rgba(201,147,58,0.15)"}`, background: form.belief_level===b.id ? `${b.color}12` : T.parchment, display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${b.color}`, background: form.belief_level===b.id ? b.color : "transparent", flexShrink:0 }}/>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:T.ink }}>{b.label}</div>
                        <div style={{ fontSize:12, color:T.muted }}>{b.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:500, color:T.body, display:"block", marginBottom:6 }}>Notes for yourself <span style={{ fontWeight:400, color:T.muted }}>(optional)</span></label>
                <textarea value={form.notes} onChange={e => set("notes")(e.target.value)} placeholder="e.g. Loves dinosaurs, asks about the Tooth Fairy a lot…" rows={3}
                  style={{ width:"100%", padding:12, borderRadius:10, border:"1.5px solid rgba(201,147,58,0.2)", fontSize:13, color:T.ink, background:T.parchment, resize:"vertical", fontFamily:"'Lora',serif", lineHeight:1.65, outline:"none" }}/>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <Btn onClick={saveChild} disabled={!form.name.trim()} loading={saving}>✦ {editing==="new" ? "Add child" : "Save changes"}</Btn>
                <Btn variant="outline" onClick={() => setEditing(null)}>Cancel</Btn>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop:28, padding:"14px 18px", borderRadius:12, background:"rgba(201,147,58,0.06)", border:"1px solid rgba(201,147,58,0.15)", display:"flex", gap:12, alignItems:"flex-start" }}>
          <span style={{ fontSize:16, flexShrink:0 }}>📱</span>
          <p style={{ fontSize:13, color:T.muted, lineHeight:1.65 }}>
            <strong style={{ color:T.body }}>Reminder:</strong> All messages are delivered to your phone — never directly to your child. Child profiles are only used for personalising message text.
          </p>
        </div>
      </div>

      {deleteConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(13,27,42,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:24 }} onClick={() => setDeleteConfirm(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background:T.warmWhite, borderRadius:20, padding:32, maxWidth:360, width:"100%", textAlign:"center", animation:"fadeUp 0.3s ease" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🗑️</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:T.ink, marginBottom:10 }}>Remove this profile?</h3>
            <p style={{ fontSize:14, color:T.muted, lineHeight:1.7, marginBottom:22 }}>This only removes the profile. Your message history is not affected.</p>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <Btn variant="danger" onClick={() => deleteChild(deleteConfirm)}>Yes, remove</Btn>
              <Btn onClick={() => setDeleteConfirm(null)}>Keep it</Btn>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)}/>}
    </div>
  );
}

/* ══════════════════════════════════════
   SCREEN: MESSAGE HISTORY
══════════════════════════════════════ */
function HistoryScreen({ session, onBack, menuItems }) {
  const [messages, setMessages] = useState([]);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState(null);

  const FILTERS = [
    { id:"all", label:"All", emoji:"✦" },
    { id:"santa", label:"Santa", emoji:"🎅" },
    { id:"tooth_fairy", label:"Tooth Fairy", emoji:"🧚" },
    { id:"easter_bunny", label:"Easter Bunny", emoji:"🐰" },
  ];

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    setLoading(true);
    const { data } = await supabase.from("messages").select("*, characters(name,emoji,slug)").eq("parent_id", session.user.id).eq("status","sent").order("sent_at", { ascending:false });
    setMessages(data || []);
    setLoading(false);
  }

  const filtered = messages.filter(m => {
    const matchChar   = filter === "all" || m.characters?.slug === filter;
    const matchSearch = search === "" || m.body.toLowerCase().includes(search.toLowerCase());
    return matchChar && matchSearch;
  });

  return (
    <div style={{ minHeight:"100vh", background:T.parchment }}>
      <PageNav onBack={onBack} title="Messages" menuItems={menuItems}/>
      <div style={{ maxWidth:720, margin:"0 auto", padding:"40px 24px 80px" }}>
        <div className="fade-up" style={{ marginBottom:28 }}>
          <SectionLabel>Memories</SectionLabel>
          <DisplayTitle>Message History</DisplayTitle>
        </div>

        <div className="fade-up-1" style={{ display:"flex", gap:0, background:T.warmWhite, border:"1px solid rgba(201,147,58,0.15)", borderRadius:14, overflow:"hidden", marginBottom:24 }}>
          {[{ label:"Total sent", value:messages.length },{ label:"Characters", value: new Set(messages.map(m=>m.characters?.slug)).size },].map((s,i) => (
            <div key={i} style={{ flex:1, padding:"16px 20px", textAlign:"center", borderRight: i<1 ? "1px solid rgba(201,147,58,0.12)" : "none" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:T.gold }}>{s.value}</div>
              <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="fade-up-2" style={{ marginBottom:20 }}>
          <div style={{ position:"relative", marginBottom:12 }}>
            <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15, opacity:0.4 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages…"
              style={{ width:"100%", padding:"11px 14px 11px 38px", border:"1.5px solid rgba(201,147,58,0.2)", borderRadius:10, fontSize:14, background:T.warmWhite, color:T.ink, outline:"none" }}/>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding:"7px 14px", borderRadius:100, fontSize:13, cursor:"pointer", border:`1.5px solid ${filter===f.id ? T.gold : "rgba(201,147,58,0.2)"}`, background: filter===f.id ? T.goldPale : "transparent", color: filter===f.id ? T.gold : T.muted, fontWeight: filter===f.id ? 600 : 400 }}>{f.emoji} {f.label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:48 }}><Spinner/></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"48px 24px", color:T.muted }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🔮</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:T.ink }}>No messages found</div>
          </div>
        ) : filtered.map((msg,i) => {
          const isOpen = expanded === msg.id;
          return (
            <div key={msg.id} style={{ background:T.warmWhite, border:`1.5px solid ${isOpen ? T.gold : "rgba(201,147,58,0.15)"}`, borderRadius:14, overflow:"hidden", marginBottom:10, animation:`fadeUp 0.4s ${i*0.04}s ease both` }}>
              <button onClick={() => setExpanded(isOpen ? null : msg.id)} style={{ width:"100%", background:"none", border:"none", cursor:"pointer", padding:"16px 18px", display:"flex", alignItems:"center", gap:14, textAlign:"left" }}>
                <span style={{ fontSize:26, flexShrink:0 }}>{msg.characters?.emoji}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:T.ink, marginBottom:3 }}>{msg.characters?.name}</div>
                  <div style={{ fontSize:13, color:T.muted, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{msg.body}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:12, color:T.muted }}>{new Date(msg.sent_at).toLocaleDateString()}</div>
                  <div style={{ fontSize:11, color:T.success, marginTop:3 }}>✓ Sent</div>
                </div>
                <span style={{ color:T.gold, fontSize:12, flexShrink:0, marginLeft:8, transform: isOpen ? "rotate(180deg)" : "none", transition:"transform 0.2s" }}>▼</span>
              </button>
              {isOpen && (
                <div style={{ padding:"0 18px 18px", borderTop:"1px solid rgba(201,147,58,0.1)", animation:"fadeUp 0.25s ease" }}>
                  <div style={{ margin:"16px auto", maxWidth:340, background:T.midnight, borderRadius:20, padding:16 }}>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", textAlign:"center", marginBottom:12, fontFamily:"-apple-system,sans-serif" }}>{new Date(msg.sent_at).toLocaleString()}</div>
                    <div style={{ background:"#e5e5ea", borderRadius:"18px 18px 18px 4px", padding:"10px 14px", fontSize:13, color:"#1c1c1e", lineHeight:1.55, fontFamily:"-apple-system,sans-serif", maxWidth:"88%" }}>{msg.body}</div>
                  </div>
                  <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
                    <Btn small variant="outline" onClick={() => { navigator.clipboard?.writeText(msg.body); setToast("Copied to clipboard!"); }}>📋 Copy</Btn>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {toast && <Toast message={toast} onDone={() => setToast(null)}/>}
    </div>
  );
}

/* ══════════════════════════════════════
   SCREEN: SCHEDULE
══════════════════════════════════════ */
function ScheduleScreen({ session, profile, onSelectPlan, onBack, menuItems }) {
  const [step, setStep]           = useState(1);
  const [characters, setCharacters] = useState([]);
  const [children, setChildren]   = useState([]);
  const [selectedChar, setSelectedChar] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [msgText, setMsgText]     = useState("");
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("08:00");
  const [upcoming, setUpcoming]   = useState([]);
  const [toast, setToast]         = useState(null);
  const [saving, setSaving]       = useState(false);
  const [deleteId, setDeleteId]   = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: chars } = await supabase.from("characters").select("*").is("parent_id",null).eq("is_active",true);
    setCharacters(chars || []);
    const { data: kids } = await supabase.from("children").select("*").eq("parent_id",session.user.id);
    setChildren(kids || []);
    if (kids?.length > 0) setSelectedChild(kids[0]);
    const { data: sched } = await supabase.from("messages").select("*, characters(name,emoji)").eq("parent_id",session.user.id).eq("status","scheduled").order("scheduled_for");
    setUpcoming(sched || []);
  }

  async function scheduleMessage() {
    if (!msgText.trim() || !schedDate || !selectedChar) return;
    if (PLAN_RANK[profile?.plan || "free"] < PLAN_RANK["basic"]) {
      onSelectPlan("banner");
      return;
    }
    setSaving(true);
    try {
      const scheduledFor = new Date(`${schedDate}T${schedTime}`).toISOString();
      await supabase.from("messages").insert({
        parent_id: session.user.id,
        child_id: selectedChild?.id || null,
        character_id: selectedChar.id,
        body: msgText,
        status: "scheduled",
        scheduled_for: scheduledFor,
      });
      setToast(`📅 Scheduled for ${new Date(scheduledFor).toLocaleDateString()} at ${schedTime}!`);
      setStep(1); setSelectedChar(null); setMsgText(""); setSchedDate("");
      loadData();
    } catch (err) {
      setToast(`Error: ${err.message}`);
    } finally { setSaving(false); }
  }

  async function cancelScheduled(id) {
    await supabase.from("messages").delete().eq("id",id);
    setDeleteId(null);
    setToast("Scheduled message cancelled.");
    loadData();
  }

  const STEPS = ["Character","Message","Schedule"];

  return (
    <div style={{ minHeight:"100vh", background:T.parchment }}>
      <PageNav onBack={onBack} title="Messages" menuItems={menuItems}/>
      <div style={{ maxWidth:680, margin:"0 auto", padding:"40px 24px 80px" }}>
        <div className="fade-up" style={{ marginBottom:32 }}>
          <SectionLabel>Plan ahead</SectionLabel>
          <DisplayTitle>Schedule a Message</DisplayTitle>
        </div>

        <div className="fade-up-1" style={{ display:"flex", alignItems:"center", marginBottom:32 }}>
          {STEPS.map((s,i) => {
            const num=i+1, done=step>num, active=step===num;
            return (
              <div key={s} style={{ display:"flex", alignItems:"center", flex: i<2 ? 1 : "none" }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background: done?T.success:active?T.gold:T.cream, border:`2px solid ${done?T.success:active?T.gold:"rgba(201,147,58,0.2)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color: done||active?"#fff":T.muted }}>{done?"✓":num}</div>
                  <span style={{ fontSize:11, color:active?T.gold:T.muted, fontWeight:active?600:400 }}>{s}</span>
                </div>
                {i<2 && <div style={{ flex:1, height:2, background: done?T.success:"rgba(201,147,58,0.15)", margin:"0 8px", marginBottom:20 }}/>}
              </div>
            );
          })}
        </div>

        {step===1 && (
          <div style={{ animation:"fadeUp 0.35s ease" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:T.ink, marginBottom:16 }}>Who is sending this message?</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {characters.map(char => (
                <button key={char.id} onClick={() => { setSelectedChar(char); setStep(2); }} style={{ padding:"22px 18px", borderRadius:16, textAlign:"center", cursor:"pointer", border:"1.5px solid rgba(201,147,58,0.15)", background:T.warmWhite, transition:"all 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor=T.gold}
                  onMouseLeave={e => e.currentTarget.style.borderColor="rgba(201,147,58,0.15)"}
                >
                  <div style={{ fontSize:36, marginBottom:10 }}>{char.emoji}</div>
                  <div style={{ fontSize:14, fontWeight:600, color:T.ink }}>{char.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step===2 && selectedChar && (
          <div style={{ animation:"fadeUp 0.35s ease" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
              <span style={{ fontSize:28 }}>{selectedChar.emoji}</span>
              <div>
                <div style={{ fontSize:15, fontWeight:600, color:T.ink }}>Message from {selectedChar.name}</div>
                <div style={{ fontSize:13, color:T.muted }}>To: your phone</div>
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, color:T.muted, fontWeight:500, marginBottom:8 }}>Quick templates:</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {getTemplates(selectedChar.slug).map((t,i) => (
                  <button key={i} onClick={() => setMsgText(t.replace("{child}", selectedChild?.name||"there"))} style={{ fontSize:12, padding:"6px 12px", borderRadius:100, border:"1px solid rgba(201,147,58,0.25)", background:T.parchment, color:T.body, cursor:"pointer" }}>{t.replace("{child}",selectedChild?.name||"there").slice(0,38)}…</button>
                ))}
              </div>
            </div>
            <textarea value={msgText} onChange={e => setMsgText(e.target.value)} placeholder={`Write your message as ${selectedChar.name}…`} rows={5}
              style={{ width:"100%", padding:14, borderRadius:12, border:"1.5px solid rgba(201,147,58,0.2)", fontSize:14, color:T.ink, background:T.warmWhite, resize:"vertical", fontFamily:"'Lora',serif", lineHeight:1.65, outline:"none" }}/>
            <div style={{ fontSize:12, color:T.muted, textAlign:"right", marginTop:5 }}>{msgText.length}/320</div>
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <Btn onClick={() => setStep(3)} disabled={!msgText.trim()}>Next: Set delivery time →</Btn>
              <Btn variant="outline" onClick={() => setStep(1)}>← Back</Btn>
            </div>
          </div>
        )}

        {step===3 && (
          <div style={{ animation:"fadeUp 0.35s ease" }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:T.ink, marginBottom:20 }}>When should it arrive on your phone?</h3>
            <Card style={{ marginBottom:16 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div>
                  <label style={{ fontSize:13, fontWeight:500, color:T.body, display:"block", marginBottom:6 }}>Date</label>
                  <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} min={new Date().toISOString().split("T")[0]}
                    style={{ width:"100%", padding:"11px 13px", borderRadius:8, fontSize:14, border:"1.5px solid rgba(201,147,58,0.2)", background:T.parchment, color:T.ink, outline:"none" }}/>
                </div>
                <div>
                  <label style={{ fontSize:13, fontWeight:500, color:T.body, display:"block", marginBottom:6 }}>Time</label>
                  <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                    style={{ width:"100%", padding:"11px 13px", borderRadius:8, fontSize:14, border:"1.5px solid rgba(201,147,58,0.2)", background:T.parchment, color:T.ink, outline:"none" }}/>
                </div>
              </div>
              <div style={{ marginTop:16 }}>
                <div style={{ fontSize:12, color:T.muted, fontWeight:500, marginBottom:8 }}>Quick occasions:</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {[{ label:"🎄 Christmas Eve", date:"2026-12-24", time:"20:00" },{ label:"🎁 Dec 1st", date:"2026-12-01", time:"06:00" },{ label:"🥚 Easter", date:"2027-04-04", time:"07:30" },{ label:"🌙 Tonight", date:new Date().toISOString().split("T")[0], time:"20:00" },].map(s => (
                    <button key={s.label} onClick={() => { setSchedDate(s.date); setSchedTime(s.time); }} style={{ fontSize:12, padding:"6px 13px", borderRadius:100, border:"1px solid rgba(201,147,58,0.25)", background:T.parchment, color:T.body, cursor:"pointer" }}>{s.label}</button>
                  ))}
                </div>
              </div>
            </Card>
            {schedDate && (
              <div style={{ padding:"14px 18px", borderRadius:12, marginBottom:16, background:"rgba(201,147,58,0.06)", border:"1px solid rgba(201,147,58,0.2)", display:"flex", gap:10, alignItems:"center", animation:"fadeUp 0.2s ease" }}>
                <span style={{ fontSize:18 }}>{selectedChar?.emoji}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.ink }}>{selectedChar?.name} → Your phone</div>
                  <div style={{ fontSize:12, color:T.muted }}>Scheduled for {new Date(schedDate).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})} at {schedTime}</div>
                </div>
              </div>
            )}
            <div style={{ display:"flex", gap:10 }}>
              <Btn onClick={scheduleMessage} disabled={!schedDate} loading={saving}>✦ Schedule Message</Btn>
              <Btn variant="outline" onClick={() => setStep(2)}>← Back</Btn>
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div style={{ marginTop:48 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div><SectionLabel>On Deck</SectionLabel><h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:T.ink }}>Scheduled messages</h3></div>
              <span style={{ fontSize:12, color:T.muted }}>{upcoming.length} queued</span>
            </div>
            {upcoming.map((msg,i) => (
              <div key={msg.id} style={{ background:T.warmWhite, border:"1.5px solid rgba(201,147,58,0.15)", borderRadius:14, padding:"16px 18px", display:"flex", alignItems:"center", gap:14, marginBottom:10, animation:`fadeUp 0.4s ${i*0.07}s ease both` }}>
                <span style={{ fontSize:24, flexShrink:0 }}>{msg.characters?.emoji}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:T.ink, marginBottom:3 }}>{msg.characters?.name}</div>
                  <div style={{ fontSize:13, color:T.muted, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{msg.body}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:12, color:T.gold, fontWeight:500 }}>📅 {new Date(msg.scheduled_for).toLocaleDateString()}</div>
                  <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{new Date(msg.scheduled_for).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</div>
                </div>
                <button onClick={() => setDeleteId(msg.id)} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, fontSize:16, padding:4, flexShrink:0 }}
                  onMouseEnter={e => e.currentTarget.style.color=T.danger}
                  onMouseLeave={e => e.currentTarget.style.color=T.muted}
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteId && (
        <div style={{ position:"fixed", inset:0, background:"rgba(13,27,42,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:24 }} onClick={() => setDeleteId(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background:T.warmWhite, borderRadius:20, padding:32, maxWidth:360, width:"100%", textAlign:"center", animation:"fadeUp 0.3s ease" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>📅</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:T.ink, marginBottom:10 }}>Cancel this message?</h3>
            <p style={{ fontSize:14, color:T.muted, lineHeight:1.7, marginBottom:22 }}>This scheduled message will be permanently removed.</p>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <Btn variant="danger" onClick={() => cancelScheduled(deleteId)}>Yes, cancel it</Btn>
              <Btn onClick={() => setDeleteId(null)}>Keep it</Btn>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)}/>}
    </div>
  );
}

/* ══════════════════════════════════════
   TEMPLATES
══════════════════════════════════════ */
function getTemplates(slug) {
  const t = {
    santa:        ["Ho ho ho, {child}! 🎅 Your name is glowing on the nice list this year. See you Christmas Eve! 🎄","A little elf told me you have been extra helpful lately, {child}. That goes straight to the top of my list! ⭐","I received your letter, {child}! The elves are already working on it. Keep being wonderful! 🎁"],
    tooth_fairy:  ["Hello {child}! 🧚‍♀️ Word reached me that a very brave child lost a tooth tonight. I am on my way — expect some sparkle by morning! 💫","Oh my, {child} — what a beautiful tooth! I will add it to my collection. A little something will be waiting for you. ✨","{child}, I heard about your tooth! It was one of the finest I have collected all week. Sleep tight! 🌙"],
    easter_bunny: ["Hippity hoppity, {child}! 🐰 I am already planning something special for Easter. Keep your eyes peeled! 🥚","Psst, {child} — I hid something extra special in a spot only you would think to look. Happy hunting! 🌸","{child}, the meadow grapevine tells me you have been very kind lately. That means extra treats this year! 🌷"],
    mms_network:  ["A message of magic is on its way to you, {child}. Believe in the wonder around you. ✨","Hello {child}! I have been watching, and I am so proud of the person you are becoming. 🌟"],
  };
  return t[slug] || t.mms_network;
}

function getOhCrapTemplate(btnId, childName) {
  const t = {
    tooth_emergency: `Hello ${childName}! 🧚‍♀️ Word just reached me that a very brave little one lost a tooth tonight — and what a beauty it is! My flight path is completely full this evening, but a tooth this special absolutely cannot be missed. Tuck it safely under your pillow tomorrow night and I promise to visit before morning. Sweet dreams! 💫`,
    santa_watching:  `Ho ho ho, ${childName}! 🎅 A little elf just sent me a message about what is happening at your house right now. Remember — I see everything, and the nice list is still open. Sweet dreams! ⭐`,
    bunny_alert:     `Hippity hoppity, ${childName}! 🐰 I heard you were looking for me. I am hopping as fast as I can — big things are coming your way very soon! 🥚🌸`,
    wishlist:        `Ho ho ho, ${childName}! 🎅 Great news from the North Pole — your wish list arrived safely in my mailroom just a little while ago! Mrs. Claus has already logged it in the Big Book and I have had a chance to look it over myself. The elves are taking notes as we speak. Keep being wonderful and we will take care of the rest! ⭐🎄`,
  };
  return t[btnId] || `A little magic is coming your way, ${childName}! ✨`;
}

/* ══════════════════════════════════════
   ROOT APP
══════════════════════════════════════ */
export default function App() {
  const [session, setSession]   = useState(null);
  const [profile, setProfile]   = useState(null);
  const [screen, setScreen]     = useState("auth");
  const [loading, setLoading]   = useState(true);
  const [prevScreen, setPrevScreen] = useState("dashboard");
  const [prelaunch, setPrelaunch]           = useState(null);
  const [notifyEmail, setNotifyEmail]       = useState("");
  const [textOptIn, setTextOptIn]           = useState(false);
  const [notifyPhone, setNotifyPhone]       = useState("");
  const [notifyLoading, setNotifyLoading]   = useState(false);
  const [notifyDone, setNotifyDone]         = useState(false);
  const [codeInput, setCodeInput]           = useState("");
  const [codeLoading, setCodeLoading]       = useState(false);
  const [codeError, setCodeError]           = useState(null);
  const [prelaunchToast, setPrelaunchToast] = useState(null);

  function goTo(s) {
    setPrevScreen(screen);
    setScreen(s);
  }

  useEffect(() => { window.scrollTo(0, 0); }, [screen]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setScreen("auth");
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(data);
    if (!data?.phone_number) {
      setScreen("setup");
    } else {
      setScreen("dashboard");
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const navMenuItems = session ? [
    { label:"👨‍👩‍👧 Profiles",  action: () => goTo("profiles") },
    { label:"📅 Schedule",  action: () => goTo("schedule") },
    { label:"🕰 History",   action: () => goTo("history") },
    { label:"⭐ Plan",      action: () => goTo("billing") },
    { label:"✨ About",     action: () => goTo("about") },
    { label:"📜 Terms",     action: () => goTo("terms") },
    { label:"Log out",     action: handleLogout },
  ] : [];

  useEffect(() => {
    if (prelaunch) {
      setNotifyEmail(profile?.email || session?.user?.email || "");
      setNotifyPhone(profile?.phone_number || "");
      setNotifyDone(false);
      setCodeInput("");
      setCodeError(null);
      setTextOptIn(false);
    }
  }, [!!prelaunch]);

  async function saveNotify() {
    setNotifyLoading(true);
    try {
      await supabase.from("profiles").update({
        notify_when_live: true,
        ...(textOptIn && notifyPhone ? { notify_phone: notifyPhone } : {}),
      }).eq("id", session.user.id);
    } catch (_) {}
    setNotifyLoading(false);
    setNotifyDone(true);
  }

  async function redeemCode() {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setCodeLoading(true);
    setCodeError(null);
    try {
      const { data: result, error } = await supabase.rpc("redeem_invite_code", {
        p_code: code,
        p_user_id: session.user.id,
      });
      if (error) throw error;
      if (result === "invalid")   { setCodeError("That code doesn't look right — double-check and try again."); return; }
      if (result === "exhausted") { setCodeError("That code has already been fully redeemed. Reach out if you think this is a mistake."); return; }
      if (result === "expired")   { setCodeError("That code has expired. Reach out if you need a fresh one."); return; }
      const firstName = (profile?.full_name || session?.user?.email || "").split(" ")[0];
      callFunction("send-welcome-email", {
        first_name: firstName,
        email: session.user.email,
      }).catch(() => {});
      setPrelaunchToast(`✨ Welcome to ${result.charAt(0).toUpperCase() + result.slice(1)}! Refreshing…`);
      setTimeout(() => window.location.reload(), 1600);
    } catch (err) {
      setCodeError("Something went wrong — try again in a moment.");
    } finally {
      setCodeLoading(false);
    }
  }

  const selectedPlanLabel = prelaunch && prelaunch !== "banner"
    ? PLANS.find(p => p.id === prelaunch)?.tier
    : "your plan";
  const isFromBanner = prelaunch === "banner";

  if (loading) return (
    <>
      <FontLink/>
      <style>{G}</style>
      <LoadingScreen/>
    </>
  );

  return (
    <>
      <FontLink/>
      <style>{G}</style>

      {/* ── Global invite code banner (free users only) ── */}
      {session && profile && (profile.plan === "free" || !profile.plan) && screen !== "auth" && screen !== "setup" && (
        <div
          onClick={() => setPrelaunch("banner")}
          style={{ position:"fixed", top:0, left:0, right:0, zIndex:200, background:T.navy, borderBottom:`1px solid rgba(201,147,58,0.3)`, color:"rgba(255,255,255,0.75)", fontSize:13, fontFamily:"'DM Sans',sans-serif", textAlign:"center", padding:"9px 16px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, lineHeight:1.4 }}
        >
          Have an invite code or early access offer? Redeem it{" "}
          <span style={{ color:"#e8b96a", fontWeight:700, textDecoration:"underline", letterSpacing:"0.02em" }}>HERE</span>
        </div>
      )}

      {/* ── Global prelaunch modal ── */}
      {prelaunch && (
        <div style={{ position:"fixed", inset:0, background:"rgba(13,27,42,0.82)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300, padding:24 }} onClick={() => { if (!notifyDone) setPrelaunch(null); }}>
          <div onClick={e => e.stopPropagation()} style={{ background:T.midnight, border:`1.5px solid rgba(201,147,58,0.3)`, borderRadius:24, padding:"40px 32px", maxWidth:420, width:"100%", animation:"fadeUp 0.35s ease", boxShadow:"0 24px 64px rgba(0,0,0,0.4)" }}>
            {notifyDone ? (
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:52, marginBottom:16 }}>✨</div>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:T.warmWhite, marginBottom:14, lineHeight:1.3 }}>You're on the list.</h2>
                <p style={{ fontFamily:"'Lora',serif", fontSize:14, color:"rgba(255,255,255,0.7)", lineHeight:1.8, marginBottom:28 }}>
                  We'll reach out the moment we open the doors. Good things coming — we promise it'll be worth the wait.
                </p>
                <button onClick={() => { setPrelaunch(null); setNotifyDone(false); }} style={{ background:"transparent", border:`1.5px solid rgba(201,147,58,0.4)`, color:"#e8b96a", borderRadius:8, padding:"10px 24px", fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                  Keep browsing →
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontSize:44, textAlign:"center", marginBottom:18 }}>🔮</div>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:T.warmWhite, marginBottom:12, lineHeight:1.3, textAlign:"center" }}>
                  Almost time — but not quite yet.
                </h2>
                <p style={{ fontFamily:"'Lora',serif", fontSize:14, color:"rgba(255,255,255,0.72)", lineHeight:1.8, marginBottom:24, textAlign:"center" }}>
                  {isFromBanner
                    ? "We're in prelaunch and not yet taking payments. Drop your email and we'll tell you the moment the doors open — or enter your invite code below to get in right now."
                    : `We're in prelaunch and not yet taking payments, but you clearly have great taste in plans. Let us give you a heads up the moment we open the doors — ${selectedPlanLabel} will be waiting for you.`}
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <div>
                    <label style={{ fontSize:11, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,255,255,0.45)", display:"block", marginBottom:6 }}>Your email</label>
                    <input
                      type="email"
                      value={notifyEmail}
                      onChange={e => setNotifyEmail(e.target.value)}
                      style={{ width:"100%", padding:"11px 14px", borderRadius:8, border:`1.5px solid rgba(201,147,58,0.3)`, background:"rgba(255,255,255,0.06)", color:T.warmWhite, fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:"none" }}
                    />
                  </div>
                  <button
                    onClick={() => setTextOptIn(v => !v)}
                    style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:10, padding:"4px 0", textAlign:"left" }}
                  >
                    <div style={{ width:20, height:20, borderRadius:4, border:`1.5px solid rgba(201,147,58,0.5)`, background: textOptIn ? T.gold : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.2s" }}>
                      {textOptIn && <span style={{ fontSize:11, color:T.midnight, fontWeight:700 }}>✓</span>}
                    </div>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"rgba(255,255,255,0.65)" }}>Also text me when you're live</span>
                  </button>
                  {textOptIn && (
                    <input
                      type="tel"
                      value={notifyPhone}
                      onChange={e => setNotifyPhone(e.target.value)}
                      placeholder="Your phone number"
                      style={{ width:"100%", padding:"11px 14px", borderRadius:8, border:`1.5px solid rgba(201,147,58,0.3)`, background:"rgba(255,255,255,0.06)", color:T.warmWhite, fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:"none" }}
                    />
                  )}
                  <button
                    onClick={saveNotify}
                    disabled={!notifyEmail || notifyLoading}
                    style={{ marginTop:4, width:"100%", padding:"13px 0", borderRadius:8, background: notifyEmail ? T.gold : "rgba(201,147,58,0.2)", color: notifyEmail ? T.midnight : "rgba(201,147,58,0.4)", fontSize:14, fontWeight:600, border:"none", cursor: notifyEmail ? "pointer" : "default", fontFamily:"'DM Sans',sans-serif", transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
                  >
                    {notifyLoading ? <Spinner/> : "Notify me when you're live ✨"}
                  </button>
                  <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:16, display:"flex", flexDirection:"column", gap:8 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.75)", fontFamily:"'DM Sans',sans-serif", marginBottom:2 }}>🎟️ Have an invite code?</p>
                    <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", fontFamily:"'Lora',serif", lineHeight:1.6, marginBottom:4 }}>That's your key to early access. Enter it below to unlock your free trial right now — no waiting.</p>
                    <div style={{ display:"flex", gap:8 }}>
                      <input
                        type="text"
                        value={codeInput}
                        onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeError(null); }}
                        onKeyDown={e => e.key === "Enter" && redeemCode()}
                        placeholder="ENTER CODE"
                        style={{ flex:1, padding:"10px 12px", borderRadius:8, border:`1.5px solid rgba(201,147,58,0.25)`, background:"rgba(255,255,255,0.06)", color:T.warmWhite, fontSize:13, fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.08em", outline:"none" }}
                      />
                      <button
                        onClick={redeemCode}
                        disabled={!codeInput.trim() || codeLoading}
                        style={{ padding:"10px 14px", borderRadius:8, background: codeInput.trim() ? T.gold : "rgba(201,147,58,0.15)", color: codeInput.trim() ? T.midnight : "rgba(201,147,58,0.4)", border:"none", fontSize:12, fontWeight:600, cursor: codeInput.trim() ? "pointer" : "default", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}
                      >
                        {codeLoading ? <Spinner/> : "Redeem"}
                      </button>
                    </div>
                    {codeError && <p style={{ fontSize:12, color:"#e8795a", fontFamily:"'Lora',serif", lineHeight:1.5 }}>{codeError}</p>}
                  </div>
                  <button onClick={() => setPrelaunch(null)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.35)", fontSize:13, cursor:"pointer", padding:"4px 0", fontFamily:"'DM Sans',sans-serif" }}>
                    I'll keep an eye out myself
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {prelaunchToast && <Toast message={prelaunchToast} onDone={() => setPrelaunchToast(null)}/>}

      <div style={{ paddingTop: (session && profile && (profile.plan === "free" || !profile.plan) && screen !== "auth" && screen !== "setup") ? 38 : 0 }}>

      {screen === "auth" && (
        <AuthScreen
          onGoToAbout={() => goTo("about")}
          onGoToTerms={() => goTo("terms")}
        />
      )}

      {screen === "about" && (
        <AboutScreen onBack={() => setScreen(prevScreen)} menuItems={navMenuItems}/>
      )}

      {screen === "terms" && (
        <TermsScreen onBack={() => setScreen(prevScreen)} menuItems={navMenuItems}/>
      )}

      {screen === "setup" && session && (
        <SetupScreen
          user={session.user}
          onComplete={() => loadProfile(session.user.id)}
        />
      )}

      {screen === "dashboard" && session && (
        <DashboardScreen
          session={session}
          profile={profile}
          onGoToBilling={()   => goTo("billing")}
          onGoToHistory={()   => goTo("history")}
          onGoToSchedule={()  => goTo("schedule")}
          onGoToProfiles={()  => goTo("profiles")}
          onGoToAbout={()     => goTo("about")}
          onGoToTerms={()     => goTo("terms")}
          onLogout={handleLogout}
        />
      )}

      {screen === "billing" && (
        <BillingScreen profile={profile} session={session} onBack={() => setScreen("dashboard")} onSelectPlan={setPrelaunch} menuItems={navMenuItems}/>
      )}

      {screen === "profiles" && session && (
        <ChildProfileScreen session={session} onBack={() => setScreen("dashboard")} menuItems={navMenuItems}/>
      )}

      {screen === "history" && session && (
        <HistoryScreen session={session} onBack={() => setScreen("dashboard")} menuItems={navMenuItems}/>
      )}

      {screen === "schedule" && session && (
        <ScheduleScreen session={session} profile={profile} onSelectPlan={setPrelaunch} onBack={() => setScreen("dashboard")} menuItems={navMenuItems}/>
      )}

      </div>
    </>
  );
}
