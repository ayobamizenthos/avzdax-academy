"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { playBassHum, playClickSound, playHoverSound, playTypingSound } from "@/lib/audio";
import { supabase } from "@/lib/supabase";
import { Calendar, AlertTriangle, Check, ChevronDown } from "lucide-react";

export default function AdmissionsPortal() {
  const [step, setStep] = useState(0);
  const [challengeText, setChallengeText] = useState("");
  const [timeLeft, setTimeLeft] = useState(1800);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    institution: "",
    course: "",
    linkedin: "",
    motivation: ""
  });
  
  const [dob, setDob] = useState("");
  const [isObscured, setIsObscured] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [timerState, setTimerState] = useState<"hidden" | "reveal" | "docked">("hidden");

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const addedLength = newText.length - challengeText.length;
    const prevWordsCount = challengeText.trim().split(/\s+/).filter((w) => w.length > 0).length;
    const newWordsCount = newText.trim().split(/\s+/).filter((w) => w.length > 0).length;

    if (addedLength > 25 || (newWordsCount - prevWordsCount > 2)) {
      setAlertMessage("SECURITY VIOLATION: Pasting content is strictly prohibited.");
      return;
    }

    const words = newText.trim().split(/\s+/).filter((w) => w.length > 0);
    
    if (words.length <= 500) {
      setChallengeText(newText);
    } else {
      const truncated = words.slice(0, 500).join(" ") + (newText.endsWith(" ") ? " " : "");
      setChallengeText(truncated);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
      playTypingSound();
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    playClickSound();

    try {
      const { error } = await supabase.from("applications").insert([{
        ...formData,
        dob,
        challenge_response: challengeText
      }]);

      if (error) throw error;
      setStep(3);
    } catch (err: any) {
      console.error(err);
      setAlertMessage(`Database Error: ${err.message || "Connection failed."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleKeyObscure = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || (e.metaKey && e.shiftKey) || (e.ctrlKey && e.shiftKey && e.key === "S") || e.key === "Snapshot") {
        navigator.clipboard.writeText("");
        setIsObscured(true);
        setAlertMessage("SECURITY VIOLATION: Screenshots and screen recording are strictly prohibited.");
        setTimeout(() => setIsObscured(false), 3000);
      }
    };

    window.addEventListener("keydown", handleKeyObscure);
    window.addEventListener("keyup", handleKeyObscure);

    return () => {
      window.removeEventListener("keydown", handleKeyObscure);
      window.removeEventListener("keyup", handleKeyObscure);
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash;
      let targetStep = 0;
      if (hash === "#challenge") targetStep = 1;
      else if (hash === "#info") targetStep = 2;
      else if (hash === "#success") targetStep = 3;
      else if (hash === "#declined") targetStep = -1;

      setStep(targetStep);
    };

    window.addEventListener("popstate", handlePopState);
    handlePopState();

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const hashValues: Record<number, string> = {
      0: "",
      1: "#challenge",
      2: "#info",
      3: "#success",
      [-1]: "#declined",
    };
    const expectedHash = hashValues[step] || "";
    if (window.location.hash !== expectedHash) {
      window.history.pushState(null, "", expectedHash || window.location.pathname);
    }
  }, [step]);

  useEffect(() => {
    if (step === 0) {
      playBassHum();
    }
  }, [step]);

  useEffect(() => {
    if (step === 1) {
      if (timeLeft <= 0) {
        setStep(2);
        setAlertMessage("Time has expired. Your current strategy draft has been locked and saved. Please complete your profile details to submit.");
        return;
      }
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  useEffect(() => {
    if (step === 1) {
      setTimerState("hidden");
      const revealTimeout = setTimeout(() => {
        setTimerState("reveal");
      }, 2000);
      const dockTimeout = setTimeout(() => {
        setTimerState("docked");
      }, 3500);
      return () => {
        clearTimeout(revealTimeout);
        clearTimeout(dockTimeout);
      };
    } else {
      setTimerState("hidden");
    }
  }, [step]);

  return (
    <main className="relative min-h-screen w-full overflow-hidden font-sans bg-[#030303] text-avzdax-white">
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      ></div>

      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(30,30,30,0.4)_0%,rgba(0,0,0,0)_60%)]"></div>

      <AnimatePresence>
        
        {step === 0 && (
          <motion.div
            key="screen-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } }}
            className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10"
          >
            <div className="max-w-[800px] w-full flex flex-col items-center text-center space-y-10 sm:space-y-20">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6 sm:space-y-10 flex flex-col items-center"
              >
                <a href="https://avzdax.com" className="cursor-pointer z-20">
                  <motion.img layoutId="avzdax-logo" transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }} src="/avzdax-logo.png" alt="AVZDAX Logo" className="h-8 sm:h-10 md:h-14 w-auto object-contain opacity-40 mb-2" />
                </a>
                <h2 className="text-3xl sm:text-5xl md:text-7xl font-serif tracking-tight font-light text-[#F8F8F8]">
                  Welcome to the Academy.
                </h2>
              </motion.div>
 
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1.5 }}
                className="space-y-3 sm:space-y-4 text-avzdax-silver text-sm sm:text-lg md:text-2xl font-light tracking-wide"
              >
                <p>The Academy is highly selective.</p>
                <p>Before proceeding, you must complete the AVZDAX Challenge.</p>
                <p className="text-[#F8F8F8] font-medium mt-4 sm:mt-8 tracking-[0.4em] uppercase text-[10px] sm:text-xs">Show us how you think.</p>
              </motion.div>
 
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.5, duration: 2 }}
                className="flex flex-col sm:flex-row gap-4 sm:gap-8 pt-8 sm:pt-16 w-full sm:w-auto"
              >
                <button
                  onPointerDown={() => playClickSound()}
                  onClick={() => setStep(1)}
                  className="group relative px-8 py-3.5 sm:px-14 sm:py-5 bg-emerald-600 text-white text-[10px] font-mono uppercase tracking-[0.5em] rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:bg-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500"
                >
                  Proceed
                </button>
                <button
                  onPointerDown={() => playClickSound()}
                  onClick={() => setStep(-1)}
                  className="group relative px-8 py-3.5 sm:px-14 sm:py-5 bg-red-900/60 text-red-100 text-[10px] font-mono uppercase tracking-[0.5em] rounded-lg hover:bg-red-600 hover:text-white hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500"
                >
                  Decline
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
 
        {step === -1 && (
          <motion.div
            key="screen-declined"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-[#030303] text-avzdax-white px-6 z-10"
          >
            <div className="absolute top-4 left-2 sm:top-8 sm:left-6 md:top-12 md:left-12 z-20 pointer-events-none">
              <a href="https://avzdax.com" className="pointer-events-auto cursor-pointer">
                <motion.img layoutId="avzdax-logo" transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }} src="/avzdax-logo.png" alt="AVZDAX Logo" className="w-36 sm:w-48 md:w-56 h-auto opacity-40" />
              </a>
            </div>
 
            <p className="text-avzdax-silver font-mono tracking-[0.5em] uppercase text-[10px]">
              This path is not for everyone.
            </p>
          </motion.div>
        )}
 
        {step === 1 && (
          <motion.div
            key="screen-2"
            initial={{ opacity: 0, scale: 0.99, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)", transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } }}
            className="absolute inset-0 bg-transparent text-avzdax-white px-6 md:px-12 py-6 md:py-12 overflow-hidden flex flex-col z-10"
          >
            <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(20,25,35,0.8)_0%,rgba(3,3,3,1)_80%)]"></div>

            <div className="absolute top-4 left-2 sm:top-8 sm:left-6 md:top-12 md:left-12 z-20 pointer-events-none">
              <a href="https://avzdax.com" className="pointer-events-auto cursor-pointer">
                <motion.img layoutId="avzdax-logo" transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }} src="/avzdax-logo.png" alt="AVZDAX Logo" className="w-36 sm:w-48 md:w-56 h-auto opacity-40" />
              </a>
            </div>

            <div className="max-w-[800px] mx-auto w-full flex flex-col h-full z-10 relative pt-16 sm:pt-24 lg:pt-0 pb-4">
              <header className="flex justify-between items-center mb-3 sm:mb-6 shrink-0 relative">
                <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.5em] text-white/50">Assessment</span>
                
                <AnimatePresence>
                  {timerState !== "hidden" && (
                    <motion.div
                      layoutId="timer-container"
                      className={timerState === "reveal" 
                        ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030303]/90 backdrop-blur-2xl pointer-events-none"
                        : "flex items-center"
                      }
                    >
                      <motion.span
                        layoutId="timer-text"
                        className={timerState === "reveal"
                          ? "text-7xl sm:text-8xl md:text-9xl font-mono font-extralight text-[#F8F8F8] tracking-[0.2em] drop-shadow-[0_0_50px_rgba(255,255,255,0.8)]"
                          : `text-[13px] sm:text-lg md:text-xl font-mono tracking-[0.2em] font-light ${timeLeft < 300 ? 'text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-[#F8F8F8] drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]'}`
                        }
                      >
                        {formatTime(timeLeft)}
                      </motion.span>
                      {timerState === "reveal" && (
                        <motion.p 
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 0.8, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: 0.4, duration: 0.8 }}
                          className="text-[10px] font-mono tracking-[0.6em] text-red-500 uppercase mt-8 pl-[0.6em]"
                        >
                          Time Limit Active
                        </motion.p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </header>

              <AnimatePresence>
                {isObscured && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 backdrop-blur-xl bg-black/85 z-50 flex items-center justify-center flex-col space-y-4 sm:space-y-6 rounded-2xl"
                  >
                    <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 animate-pulse" strokeWidth={1} />
                    <p className="text-red-500 font-mono tracking-[0.5em] uppercase text-[9px] sm:text-[10px] font-bold">Security Protocol Active</p>
                    <p className="text-avzdax-white/50 font-mono tracking-widest text-[10px] sm:text-xs uppercase">Focus Lost or Screenshot Attempt Detected.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div 
                className="space-y-2 sm:space-y-6 text-xs sm:text-base md:text-lg font-light leading-relaxed mb-3 sm:mb-6 shrink-0 tracking-wide text-white select-none pointer-events-none transition-all duration-75" 
                style={{ filter: isObscured ? 'blur(20px)' : 'none' }}
                onCopy={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
              >
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }}>
                  A predictive AI system indicates there is an 85% probability of a major security incident at a crowded public venue within the next 12 hours. 
                </motion.p>
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 1 }}>
                  The intelligence cannot be independently verified. Evacuating the venue could cause panic, economic losses, and reputational damage. Doing nothing could result in loss of life.
                </motion.p>
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, duration: 1 }} className="font-serif text-base sm:text-xl md:text-2xl font-light text-[#F8F8F8] mt-3 sm:mt-8 tracking-tight">
                  You have 30 minutes to advise leadership. What do you do and why?
                </motion.p>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2, duration: 1 }}
                className="relative flex-1 flex flex-col group min-h-[85px] sm:min-h-[160px] mt-0 rounded-xl overflow-hidden backdrop-blur-md bg-white/[0.02] shadow-[0_8px_40px_rgba(0,0,0,0.4)] focus-within:bg-white/[0.05] transition-all duration-700"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity duration-1000"></div>

                <textarea
                  value={challengeText}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  onPaste={(e) => {
                    e.preventDefault();
                    setAlertMessage("SECURITY VIOLATION: Pasting content is strictly prohibited.");
                  }}
                  placeholder="Draft your strategy..."
                  className="w-full h-full bg-transparent p-4 sm:p-6 md:p-8 resize-none outline-none text-[#F8F8F8] placeholder:text-avzdax-white/20 text-sm sm:text-base md:text-lg font-light leading-relaxed relative z-10"
                />
                
                <div className="absolute bottom-0 right-0 py-2 px-4 sm:py-4 sm:px-6 text-[9px] sm:text-[10px] font-mono tracking-[0.4em] text-avzdax-white/30 pointer-events-none z-10">
                  {getWordCount(challengeText)} / 500 WORDS
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5, duration: 1 }} className="mt-3 sm:mt-8 flex justify-end shrink-0">
                <button
                  onClick={() => {
                    playClickSound();
                    setStep(2);
                  }}
                  disabled={getWordCount(challengeText) === 0}
                  className="px-6 py-2.5 sm:px-12 sm:py-5 bg-[#F8F8F8] text-avzdax-black text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] sm:tracking-[0.5em] hover:bg-avzdax-silver hover:text-white disabled:opacity-20 disabled:hover:bg-[#F8F8F8] disabled:hover:text-avzdax-black transition-all duration-500 rounded-sm"
                >
                  Submit Strategy
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="screen-3"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
            className="absolute inset-0 bg-white text-black px-6 md:px-12 py-6 md:py-12 overflow-y-auto z-50"
          >
            <div className="absolute top-4 left-2 sm:top-8 sm:left-6 md:top-12 md:left-12 z-[60] pointer-events-none">
              <a href="https://avzdax.com" className="pointer-events-auto cursor-pointer">
                <img src="/avzdax-logo.png" alt="AVZDAX Logo" className="w-36 sm:w-48 md:w-56 h-auto" style={{ filter: "brightness(0)", opacity: 0.9 }} />
              </a>
            </div>

            <div className="max-w-[700px] mx-auto w-full flex flex-col min-h-full relative z-10 pt-16 sm:pt-24 lg:pt-0 pb-12">
              <header className="mb-6 sm:mb-16 pt-4 sm:pt-8">
                <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }} className="text-2xl sm:text-4xl md:text-5xl font-serif font-light tracking-tight text-black whitespace-nowrap sm:whitespace-normal">
                  Candidate Information
                </motion.h2>
              </header>

              <form onSubmit={handleFinalSubmit} className="space-y-6 sm:space-y-12">
                {[
                  { label: "Full Name", key: "full_name", type: "text", required: true },
                  { label: "Email Address", key: "email", type: "email", required: true },
                  { label: "Phone Number", key: "phone", type: "tel", required: true },
                ].map((field, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index, duration: 0.8 }}
                    key={field.key} className="flex flex-col gap-2 relative group"
                  >
                    <label className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-black font-medium pl-2 flex justify-between w-full mb-1">
                      <span>{field.label}</span>
                      {!field.required && <span className="opacity-40">(Optional)</span>}
                    </label>
                    <input
                      type={field.type || "text"}
                      required={field.required}
                      value={(formData as any)[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      onKeyDown={handleKeyDown}
                      onFocus={playHoverSound}
                      className="w-full bg-[#FAFAFA] rounded-xl px-4 py-3 sm:px-5 sm:py-4 text-sm sm:text-lg font-light text-black focus:outline-none focus:ring-4 focus:ring-black/5 transition-all duration-500 shadow-sm"
                    />
                  </motion.div>
                ))}

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }} className="flex flex-col gap-2 relative group mt-6">
                  <label className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-black font-medium pl-2 mb-1">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      onFocus={playHoverSound}
                      className="w-full bg-[#FAFAFA] rounded-xl px-4 py-3 sm:px-5 sm:py-4 text-sm sm:text-lg font-light text-black focus:outline-none focus:ring-4 focus:ring-black/5 transition-all duration-500 shadow-sm [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30 pointer-events-none transition-opacity duration-500" strokeWidth={1.5} />
                  </div>
                </motion.div>

                {[
                  { label: "Institution / Organization", key: "institution", type: "text", required: true },
                ].map((field, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + (0.1 * index), duration: 0.8 }}
                    key={field.key} className="flex flex-col gap-2 relative group mt-6"
                  >
                    <label className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-black font-medium pl-2 flex justify-between w-full mb-1">
                      <span>{field.label}</span>
                      {!field.required && <span className="opacity-40">(Optional)</span>}
                    </label>
                    <input
                      type={field.type || "text"}
                      required={field.required}
                      value={(formData as any)[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      onKeyDown={handleKeyDown}
                      onFocus={playHoverSound}
                      className="w-full bg-[#FAFAFA] rounded-xl px-4 py-3 sm:px-5 sm:py-4 text-sm sm:text-lg font-light text-black focus:outline-none focus:ring-4 focus:ring-black/5 transition-all duration-500 shadow-sm"
                    />
                  </motion.div>
                ))}

                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }}
                  className="flex flex-col gap-2 relative group mt-6"
                >
                  <label className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-black font-medium pl-2 flex justify-between w-full mb-1">
                    <span>Program</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      onFocus={playHoverSound}
                      className="w-full bg-[#FAFAFA] rounded-xl px-4 py-3 sm:px-5 sm:py-4 text-sm sm:text-lg font-light text-black focus:outline-none focus:ring-4 focus:ring-black/5 transition-all duration-500 shadow-sm appearance-none cursor-pointer pr-10"
                    >
                      <option value="">Select Program</option>
                      <option value="Computer Vision">Computer Vision</option>
                      <option value="Backend Development">Backend Development</option>
                      <option value="Cybersecurity">Cybersecurity</option>
                      <option value="Data and Intelligence Engineering">Data and Intelligence Engineering</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30 pointer-events-none transition-opacity duration-500" strokeWidth={1.5} />
                  </div>
                </motion.div>

                {[
                  { label: "LinkedIn Profile URL", key: "linkedin", type: "text", required: false },
                ].map((field, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.8 }}
                    key={field.key} className="flex flex-col gap-2 relative group mt-6"
                  >
                    <label className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-black font-medium pl-2 flex justify-between w-full mb-1">
                      <span>{field.label}</span>
                      {!field.required && <span className="opacity-40">(Optional)</span>}
                    </label>
                    <input
                      type={field.type || "text"}
                      required={field.required}
                      value={(formData as any)[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      onKeyDown={handleKeyDown}
                      onFocus={playHoverSound}
                      className="w-full bg-[#FAFAFA] rounded-xl px-4 py-3 sm:px-5 sm:py-4 text-sm sm:text-lg font-light text-black focus:outline-none focus:ring-4 focus:ring-black/5 transition-all duration-500 shadow-sm"
                    />
                  </motion.div>
                ))}

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }} className="flex flex-col gap-2 pt-6">
                  <label className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-black font-medium pl-2 mb-1">
                    Why do you want to join the Academy?
                  </label>
                  <textarea
                    required
                    value={formData.motivation}
                    onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                    onKeyDown={handleKeyDown}
                    onFocus={playHoverSound}
                    onPaste={(e) => {
                      e.preventDefault();
                      setAlertMessage("SECURITY VIOLATION: Pasting content is strictly prohibited.");
                    }}
                    className="w-full min-h-[120px] sm:min-h-[160px] bg-[#FAFAFA] rounded-xl px-4 py-3 sm:px-5 sm:py-5 text-sm sm:text-lg font-light leading-relaxed text-black focus:outline-none focus:ring-4 focus:ring-black/5 transition-all duration-700 resize-none shadow-sm"
                  />
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 1 }} className="pt-8 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 sm:px-12 sm:py-5 bg-black text-white text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] sm:tracking-[0.5em] hover:bg-black/80 rounded-sm disabled:opacity-30 transition-all duration-700 shadow-xl"
                  >
                    {isSubmitting ? "Processing..." : "Submit Application"}
                  </button>
                </motion.div>
              </form>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="screen-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-transparent text-avzdax-white px-6 text-center z-10"
          >
            <div className="absolute top-4 left-2 sm:top-8 sm:left-6 md:top-12 md:left-12 z-20 pointer-events-none">
              <a href="https://avzdax.com" className="pointer-events-auto cursor-pointer">
                <motion.img layoutId="avzdax-logo" transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }} src="/avzdax-logo.png" alt="AVZDAX Logo" className="w-36 sm:w-48 md:w-56 h-auto opacity-40" />
              </a>
            </div>

            <div className="max-w-[600px] flex flex-col items-center space-y-16">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1, ease: "easeOut" }}
                className="relative flex items-center justify-center"
              >
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-28 text-white/90 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  <motion.path 
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 1.5, ease: "easeInOut" }}
                    d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" 
                    stroke="currentColor" strokeWidth="1.5" strokeLinejoin="bevel" 
                  />
                  <motion.path 
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1, duration: 1, ease: "easeInOut" }}
                    d="M30 50 L45 65 L70 35" 
                    stroke="currentColor" strokeWidth="2" strokeLinejoin="bevel" 
                  />
                </svg>
              </motion.div>

              <div className="space-y-6">
                <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 1 }} className="text-3xl md:text-4xl font-serif font-light tracking-widest text-[#F8F8F8]">
                  Submission Received.
                </motion.h2>
                
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1.5 }} className="space-y-4 text-avzdax-silver font-light text-lg leading-relaxed">
                  <p>Your application is currently under review by the Academy Selection Board.</p>
                  <p>If you meet our standard, you will receive an invitation to the next phase.</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl px-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-[#0A0A0A] p-12 max-w-[440px] w-full text-center shadow-[0_20px_60px_rgba(0,0,0,0.8)] rounded-2xl flex flex-col items-center gap-8"
            >
              <AlertTriangle className="w-12 h-12 text-red-500" strokeWidth={1.5} />
              
              <p className="text-[#F8F8F8] font-light leading-relaxed text-lg">
                {alertMessage}
              </p>
              
              <button
                onClick={() => setAlertMessage(null)}
                className="px-10 py-4 mt-4 bg-[#F8F8F8] text-avzdax-black text-[10px] font-mono uppercase tracking-[0.4em] hover:bg-avzdax-silver hover:text-white transition-all duration-500 rounded-sm"
              >
                Acknowledge
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
