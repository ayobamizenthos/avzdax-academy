"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Search, Trash2, RotateCcw, AlertTriangle, Eye, EyeOff } from "lucide-react";

const MASTER_PASSCODE = "Avzdax99#";

type Application = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  institution: string;
  course: string;
  linkedin: string;
  motivation: string;
  dob: string;
  challenge_response: string;
  created_at: string;
  is_deleted: boolean;
};

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"active" | "deleted">("active");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkConfirmMode, setBulkConfirmMode] = useState<"hardDelete" | null>(null);
  const [showPasscode, setShowPasscode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSelectMode, setIsSelectMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("admin_auth");
      if (auth === "true") {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === MASTER_PASSCODE) {
      setIsAuthenticated(true);
      localStorage.setItem("admin_auth", "true");
    } else {
      setError("Invalid password");
      setPasscode("");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("admin_auth");
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout();
      }, 600000);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthenticated]);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("is_deleted", viewMode === "deleted")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
    }
  }, [isAuthenticated, viewMode]);

  const handleSoftDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("applications").update({ is_deleted: true }).eq("id", id);
      if (error) throw error;
      setApplications(applications.filter(app => app.id !== id));
      setDeleteConfirmId(null);
      setAlertMessage("Application moved to trash.");
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (err: any) {
      setAlertMessage(`Error: ${err.message}`);
      setTimeout(() => setAlertMessage(null), 4000);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const { error } = await supabase.from("applications").update({ is_deleted: false }).eq("id", id);
      if (error) throw error;
      setApplications(applications.filter(app => app.id !== id));
      setAlertMessage("Application restored.");
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (err: any) {
      setAlertMessage(`Error: ${err.message}`);
      setTimeout(() => setAlertMessage(null), 4000);
    }
  };

  const handleHardDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("applications").delete().eq("id", id);
      if (error) throw error;
      setApplications(applications.filter(app => app.id !== id));
      setDeleteConfirmId(null);
      setAlertMessage("Application permanently deleted.");
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (err: any) {
      setAlertMessage(`Error: ${err.message}`);
      setTimeout(() => setAlertMessage(null), 4000);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filteredApplications = applications.filter(app => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.full_name.toLowerCase().includes(query) ||
      app.email.toLowerCase().includes(query) ||
      app.institution.toLowerCase().includes(query) ||
      app.phone.includes(query) ||
      (app.course && app.course.toLowerCase().includes(query)) ||
      app.motivation.toLowerCase().includes(query) ||
      app.challenge_response.toLowerCase().includes(query)
    );
  });

  const selectAll = () => {
    if (selectedIds.length === filteredApplications.length && filteredApplications.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredApplications.map(app => app.id));
    }
  };

  const handleBulkSoftDelete = async () => {
    try {
      const { error } = await supabase.from("applications").update({ is_deleted: true }).in("id", selectedIds);
      if (error) throw error;
      setApplications(applications.filter(app => !selectedIds.includes(app.id)));
      setSelectedIds([]);
      setAlertMessage(`${selectedIds.length} applications moved to trash.`);
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (err: any) {
      setAlertMessage(`Error: ${err.message}`);
      setTimeout(() => setAlertMessage(null), 4000);
    }
  };

  const handleBulkRestore = async () => {
    try {
      const { error } = await supabase.from("applications").update({ is_deleted: false }).in("id", selectedIds);
      if (error) throw error;
      setApplications(applications.filter(app => !selectedIds.includes(app.id)));
      setSelectedIds([]);
      setAlertMessage(`${selectedIds.length} applications restored.`);
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (err: any) {
      setAlertMessage(`Error: ${err.message}`);
      setTimeout(() => setAlertMessage(null), 4000);
    }
  };

  const handleBulkHardDelete = async () => {
    try {
      const { error } = await supabase.from("applications").delete().in("id", selectedIds);
      if (error) throw error;
      setApplications(applications.filter(app => !selectedIds.includes(app.id)));
      setSelectedIds([]);
      setBulkConfirmMode(null);
      setAlertMessage(`${selectedIds.length} applications permanently deleted.`);
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (err: any) {
      setAlertMessage(`Error: ${err.message}`);
      setTimeout(() => setAlertMessage(null), 4000);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#030303] text-avzdax-white selection:bg-white/20 px-6">
        <div className="absolute top-4 left-2 sm:top-8 sm:left-6 md:top-12 md:left-12 z-20 pointer-events-none">
          <a href="https://avzdax.com" className="pointer-events-auto cursor-pointer">
            <img src="/avzdax-logo.png" alt="AVZDAX Logo" className="w-36 sm:w-48 md:w-56 h-auto opacity-90" />
          </a>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[400px]"
        >
          <div className="flex flex-col items-center mb-8">
            <Lock className="w-8 h-8 text-[#F8F8F8] mb-4 opacity-90" strokeWidth={1.5} />
            <h1 className="text-xl sm:text-2xl font-serif tracking-widest uppercase font-light text-[#F8F8F8]">Admin Login</h1>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="relative group">
              <input
                type={showPasscode ? "text" : "password"}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="ENTER PASSWORD"
                className="w-full bg-white/[0.03] rounded-lg py-4 text-center tracking-[0.3em] sm:tracking-[0.5em] text-[#F8F8F8] font-mono text-xs sm:text-sm focus:outline-none focus:bg-white/[0.06] transition-all duration-500 placeholder:text-white/20"
                autoFocus
              />
              <button 
                type="button" 
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-white/30 hover:text-white/80 transition-colors"
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-500 text-xs font-mono tracking-widest text-center">
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
            
            <button
              type="submit"
              className="w-full py-3 sm:py-4 bg-[#F8F8F8] text-avzdax-black text-[10px] font-mono uppercase tracking-[0.5em] hover:bg-avzdax-silver hover:text-white transition-all duration-500 rounded-sm"
            >
              Login
            </button>
          </form>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F8F8] text-avzdax-black font-sans pb-32">
      <motion.header 
        initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-40 backdrop-blur-xl bg-[#F8F8F8]/80"
      >
        <div className="max-w-[1400px] mx-auto pl-2 pr-4 sm:px-6 md:px-12 py-4 sm:py-6 flex items-center justify-between gap-4 md:gap-6 flex-wrap md:flex-nowrap">
          <div className="flex items-center gap-6 order-1">
            <a href="https://avzdax.com" className="cursor-pointer">
              <img src="/avzdax-logo.png" alt="AVZDAX Logo" className="h-9 sm:h-12 md:h-14 w-auto" style={{ filter: "brightness(0)", opacity: 0.9 }} />
            </a>
          </div>

          <div className="w-full md:w-auto md:flex-1 md:max-w-md order-3 md:order-2">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 group-focus-within:text-black/60 transition-colors" />
              <input
                type="text"
                placeholder="Search candidates, emails, institutions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/[0.03] rounded-full py-2.5 pl-12 pr-4 text-xs sm:text-sm font-light focus:outline-none focus:bg-white shadow-[0_2px_10px_rgba(0,0,0,0.01)] focus:shadow-[0_2px_15px_rgba(0,0,0,0.03)] transition-all duration-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 bg-black/10 p-1 rounded-full order-4 md:order-3 ml-auto md:ml-0">
            <button
              onClick={() => { setViewMode("active"); setSelectedIds([]); setExpandedId(null); }}
              className={`px-4 sm:px-6 py-1.5 sm:py-2 text-[10px] sm:text-xs font-mono tracking-widest transition-all duration-300 rounded-full ${
                viewMode === "active" ? "bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] text-avzdax-black" : "text-black/40 hover:text-black/70"
              }`}
            >
              ACTIVE
            </button>
            <button
              onClick={() => { setViewMode("deleted"); setSelectedIds([]); setExpandedId(null); }}
              className={`px-4 sm:px-6 py-1.5 sm:py-2 text-[10px] sm:text-xs font-mono tracking-widest transition-all duration-300 rounded-full ${
                viewMode === "deleted" ? "bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] text-avzdax-black" : "text-black/40 hover:text-black/70"
              }`}
            >
              TRASH
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="text-[10px] font-mono tracking-widest uppercase text-black/60 hover:text-black transition-all duration-300 font-medium order-2 md:order-4 border-none bg-transparent outline-none p-0 cursor-pointer"
          >
            LOGOUT
          </button>
        </div>
      </motion.header>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
        {isLoading ? (
          <div className="flex justify-center items-center py-32">
            <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-black/30">
            <Search className="w-8 h-8 mb-4 opacity-50" strokeWidth={1} />
            <p className="font-mono text-xs tracking-widest uppercase">No records found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-start sm:items-center px-4 sm:px-6 py-4 sm:py-5 mb-6">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
                {isSelectMode ? (
                  <>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.length === filteredApplications.length && filteredApplications.length > 0}
                      onChange={selectAll}
                      className="w-4 h-4 border-transparent bg-black/10 rounded-sm text-avzdax-black focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs font-mono tracking-widest text-black font-medium uppercase">Select All</span>
                    <button 
                      onClick={() => { setIsSelectMode(false); setSelectedIds([]); }}
                      className="px-4 py-1.5 text-[10px] font-mono tracking-widest uppercase text-black/50 bg-black/[0.04] rounded-full hover:bg-black/10 hover:text-black transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setIsSelectMode(true)}
                    className="px-5 py-2 text-xs font-mono tracking-widest uppercase text-black bg-black/10 rounded-full hover:bg-black/15 transition-all duration-300"
                  >
                    Select
                  </button>
                )}
              </div>
              <span className="text-xs font-mono tracking-widest text-black/70 font-medium uppercase shrink-0">
                {filteredApplications.length} {filteredApplications.length === 1 ? 'Application' : 'Applications'}
              </span>
            </div>

            <div className="space-y-4">
              {filteredApplications.map((app, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.5 }}
                  key={app.id} 
                  className="flex flex-col bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-[2px] transition-all duration-300 overflow-hidden"
                >
                  <div 
                    onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                    className="flex flex-wrap items-center justify-between p-4 sm:p-6 cursor-pointer gap-6"
                  >
                    <div className="flex items-center gap-4 sm:gap-6 min-w-0 sm:min-w-[300px] flex-1">
                      {isSelectMode ? (
                        <div onClick={(e) => e.stopPropagation()} className="pt-1">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.includes(app.id)}
                            onChange={() => toggleSelection(app.id)}
                            className="w-4 h-4 border-transparent bg-black/10 rounded-sm text-avzdax-black focus:ring-0 cursor-pointer"
                          />
                        </div>
                      ) : (
                        <span className="text-sm font-mono text-black/20 w-6 text-center">{index + 1}</span>
                      )}
                      <div>
                        <h3 className="font-medium text-lg tracking-tight">{app.full_name}</h3>
                        <p className="text-sm text-black/50 mt-1">{app.email}</p>
                      </div>
                    </div>

                    <div className="hidden md:block flex-1 min-w-[200px]">
                      <p className="text-sm text-black/70">{app.institution}</p>
                      <p className="text-xs text-black/40 mt-1">{app.course || "N/A"}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono text-black">
                        {format(new Date(app.created_at), "MMM dd, yyyy")}
                      </p>
                      <p className="text-[10px] font-mono text-black/70 mt-1">
                        {format(new Date(app.created_at), "HH:mm:ss")}
                      </p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === app.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="bg-black/[0.01]"
                      >
                        <div className="p-4 sm:p-8 space-y-6 sm:space-y-12">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-12">
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-[10px] font-mono tracking-widest text-black/40 mb-2 uppercase">Phone Number</h4>
                                <p className="text-sm">{app.phone}</p>
                              </div>
                              <div>
                                <h4 className="text-[10px] font-mono tracking-widest text-black/40 mb-2 uppercase">Date of Birth</h4>
                                <p className="text-sm">{app.dob}</p>
                              </div>
                              <div>
                                <h4 className="text-[10px] font-mono tracking-widest text-black/40 mb-2 uppercase">LinkedIn Profile</h4>
                                {app.linkedin ? (
                                  <a 
                                    href={app.linkedin.startsWith('http') ? app.linkedin : `https://${app.linkedin}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors underline underline-offset-4"
                                  >
                                    {app.linkedin}
                                  </a>
                                ) : (
                                  <p className="text-sm text-black/30">Not provided</p>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-[10px] font-mono tracking-widest text-black/40 mb-3 uppercase">Why join the Academy?</h4>
                              <p className="text-sm leading-relaxed text-black/80 whitespace-pre-wrap">{app.motivation}</p>
                            </div>
                          </div>

                          <div className="pt-8">
                            <h4 className="text-[10px] font-mono tracking-widest text-black/40 mb-4 uppercase">Challenge Strategy (500 Words)</h4>
                            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-inner">
                              <p className="text-base leading-relaxed text-black/90 font-light whitespace-pre-wrap selection:bg-black selection:text-white">
                                {app.challenge_response}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap justify-end pt-4 gap-2 sm:gap-4">
                            {viewMode === "active" ? (
                              deleteConfirmId === app.id ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-red-500 font-mono mr-2">Confirm Trash?</span>
                                  <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-xs font-mono bg-black/5 hover:bg-black/10 rounded-sm">Cancel</button>
                                  <button onClick={() => handleSoftDelete(app.id)} className="px-4 py-2 text-xs font-mono bg-red-500 text-white hover:bg-red-600 rounded-sm">Yes, Trash</button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => setDeleteConfirmId(app.id)}
                                  className="flex items-center gap-2 px-4 py-2 text-xs font-mono text-red-500 hover:bg-red-50 rounded-sm transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" /> Move to Trash
                                </button>
                              )
                            ) : (
                              <>
                                <button 
                                  onClick={() => handleRestore(app.id)}
                                  className="flex items-center gap-2 px-4 py-2 text-xs font-mono text-blue-600 hover:bg-blue-50 rounded-sm transition-colors"
                                >
                                  <RotateCcw className="w-3 h-3" /> Restore
                                </button>
                                {deleteConfirmId === app.id ? (
                                  <div className="flex items-center gap-2 pl-4 ml-2">
                                    <span className="text-xs text-red-500 font-mono mr-2">Permanent Delete?</span>
                                    <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-xs font-mono bg-black/5 hover:bg-black/10 rounded-sm">Cancel</button>
                                    <button onClick={() => handleHardDelete(app.id)} className="px-4 py-2 text-xs font-mono bg-red-600 text-white hover:bg-red-700 rounded-sm">Yes, Delete Forever</button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => setDeleteConfirmId(app.id)}
                                    className="flex items-center gap-2 px-4 py-2 text-xs font-mono text-red-600 hover:bg-red-50 rounded-sm transition-colors pl-6 ml-2"
                                  >
                                    <AlertTriangle className="w-3 h-3" /> Delete Forever
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-wrap md:flex-nowrap items-center justify-center gap-4 md:gap-6 px-6 md:px-8 py-3 md:py-4 backdrop-blur-xl bg-black/90 text-white rounded-2xl md:rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.3)] w-[90%] sm:w-auto max-w-max"
          >
            <span className="text-xs font-mono tracking-widest text-white/50 pr-4 md:pr-6">
              {selectedIds.length} SELECTED
            </span>
            
            {viewMode === "active" ? (
              <button 
                onClick={handleBulkSoftDelete}
                className="flex items-center gap-2 text-xs font-mono text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest"
              >
                <Trash2 className="w-4 h-4" /> Move to Trash
              </button>
            ) : (
              <div className="flex items-center gap-6">
                <button 
                  onClick={handleBulkRestore}
                  className="flex items-center gap-2 text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest"
                >
                  <RotateCcw className="w-4 h-4" /> Restore All
                </button>
                <div className="w-[1px] h-4 bg-white/10"></div>
                {bulkConfirmMode === "hardDelete" ? (
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-red-500 font-mono">Confirm?</span>
                    <button onClick={() => setBulkConfirmMode(null)} className="text-xs text-white/50 hover:text-white uppercase tracking-widest">Cancel</button>
                    <button onClick={handleBulkHardDelete} className="text-xs text-red-500 hover:text-red-400 font-bold uppercase tracking-widest">Delete Forever</button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setBulkConfirmMode("hardDelete")}
                    className="flex items-center gap-2 text-xs font-mono text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest"
                  >
                    <AlertTriangle className="w-4 h-4" /> Delete Forever
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 z-[100] bg-black text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4"
          >
            <p className="text-sm font-mono tracking-widest">{alertMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
