import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutGrid, 
  TrendingUp, 
  ClipboardCheck, 
  Droplet, 
  Watch, 
  Sparkles, 
  LineChart, 
  ShieldCheck, 
  Share2, 
  Crown, 
  Search, 
  Bell, 
  Menu, 
  X, 
  LogOut, 
  User, 
  CheckCircle2,
  Camera,
  Activity,
  ChevronDown,
  Settings,
  Database,
  FlaskConical,
  Compass,
  Users
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { PREMIUM_SUBSCRIPTION_PATH } from "../hooks/usePremium";
import { WearablesModal } from "./WearablesModal";
import { isFeatureEnabled } from "../utils/featureFlags";

export function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Modal states triggered from sidebar
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const openPremiumSubscription = () => navigate(PREMIUM_SUBSCRIPTION_PATH);

  const currentPath = location.pathname;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const profile = user?.profile_type || "individu";

  const menuGroups = [];

  // Core & Specialized Dashboard views
  const coreItems = [{ name: "System initialization", path: "/", icon: LayoutGrid }];

  if (isFeatureEnabled(profile, "dashboard")) {
    coreItems.push({ name: "Your digital twin", path: "/dashboard", icon: TrendingUp });
  }
  if (isFeatureEnabled(profile, "doctor_dashboard")) {
    coreItems.push({ name: "Espace Médecin", path: "/dashboard", icon: Users });
  }
  if (isFeatureEnabled(profile, "lab_dashboard")) {
    coreItems.push({ name: "Espace Laboratoire", path: "/dashboard", icon: FlaskConical });
  }
  if (isFeatureEnabled(profile, "research_dashboard")) {
    coreItems.push({ name: "Espace Recherche", path: "/dashboard", icon: Database });
  }
  if (isFeatureEnabled(profile, "pharma_dashboard")) {
    coreItems.push({ name: "Espace Pharma", path: "/dashboard", icon: Compass });
  }

  menuGroups.push({
    title: "ESPACE PRINCIPAL",
    items: coreItems
  });

  // Individual Features (My Twin)
  const myTwinItems = [];
  if (isFeatureEnabled(profile, "onboarding")) {
    myTwinItems.push({ name: "Assessment", path: "/onboarding", icon: ClipboardCheck });
  }
  if (isFeatureEnabled(profile, "blood_test")) {
    myTwinItems.push({ name: "Blood test & Lab Map", path: "/blood-test", icon: Droplet });
  }
  if (isFeatureEnabled(profile, "wearables")) {
    myTwinItems.push({ name: "Connect wearables", path: "/wearables", icon: Watch });
  }

  if (myTwinItems.length > 0) {
    menuGroups.push({
      title: "SUIVI BIOLOGIQUE",
      items: myTwinItems
    });
  }

  // Health tokens / premium insights
  if (isFeatureEnabled(profile, "dashboard")) {
    menuGroups.push({
      title: "MY HEALTH TOKENS",
      items: [
        { name: "Daily positive actions", path: "#actions", icon: Sparkles, premium: true },
        { name: "Biomarker evolution", path: "#evolution", icon: LineChart, premium: true },
        { name: "Prevention trajectory", path: "#trajectory", icon: ShieldCheck, premium: true },
      ]
    });
  }

  // Configuration Panel (Demo tool)
  menuGroups.push({
    title: "CONFIGURATION",
    items: [
      { name: "Backoffice Admin", path: "/backoffice", icon: Settings }
    ]
  });

  const getBreadcrumb = () => {
    if (currentPath === "/") return "System initialization";
    if (currentPath === "/dashboard") {
      if (profile === "medecin") return "Espace Médecin";
      if (profile === "lab") return "Espace Laboratoire";
      if (profile === "recherche") return "Espace Recherche";
      if (profile === "pharma") return "Espace Pharma";
      return "Your digital twin";
    }
    if (currentPath === "/onboarding") return "Assessment";
    if (currentPath === "/blood-test") return "Blood test";
    if (currentPath === "/wearables") return "Connect wearables";
    if (currentPath === "/facescan") return "Face Scan";
    if (currentPath === "/pricing") return "Pricing";
    if (currentPath === "/backoffice") return "Backoffice Admin";
    return "Overview";
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-[#050914] text-[#94a3b8] border-r border-white/5 font-sans">
      {/* Brand Header */}
      <div className="flex h-16 items-center px-6 border-b border-white/5 gap-3 shrink-0">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          <img src="/Frame 2.svg" alt="Peren AI Logo" className="h-6 w-6" />
        </div>
        <span className="text-lg font-semibold tracking-[0.2em] text-white">PEREN AI</span>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-7 custom-scrollbar">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            <h3 className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">{group.title}</h3>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                
                const linkContent = (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon size={18} className={isActive ? "text-[#7da7ff]" : "text-gray-400 group-hover:text-white transition-colors"} />
                      <span className="text-sm font-semibold">{item.name}</span>
                    </div>
                    {item.premium && (
                      <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">PRO</span>
                    )}
                  </div>
                );

                const itemClass = `group block rounded-xl px-3 py-2.5 text-sm transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? "bg-[#0f1a36]/60 text-white font-medium border-l-2 border-[#7da7ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]" 
                    : "hover:bg-white/[0.02] hover:text-white"
                }`;

                if (item.action) {
                  return (
                    <li key={item.name}>
                      <button onClick={() => { item.action(); setIsMobileOpen(false); }} className={`w-full text-left ${itemClass}`}>
                        {linkContent}
                      </button>
                    </li>
                  );
                }

                if (item.premium && !user?.is_premium) {
                  return (
                    <li key={item.name}>
                      <button onClick={() => { openPremiumSubscription(); setIsMobileOpen(false); }} className={`w-full text-left ${itemClass}`}>
                        {linkContent}
                      </button>
                    </li>
                  );
                }

                return (
                  <li key={item.name}>
                    <Link 
                      to={item.path} 
                      onClick={() => setIsMobileOpen(false)}
                      className={itemClass}
                    >
                      {linkContent}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Sidebar Footer Cards */}
      <div className="p-4 border-t border-white/5 space-y-3 bg-[#03060f]/60 shrink-0">
        {/* Share Card */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-white/10 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <Share2 size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Share PEREN AI</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">100 credits per paid referral.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsInviteOpen(true)}
            className="w-full mt-3 rounded-xl bg-gradient-to-r from-[#7da7ff] to-[#4f79d9] py-2 text-center text-xs font-bold text-white shadow-lg shadow-blue-500/10 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
          >
            Invite now
          </button>
        </div>

        {/* Upgrade Card */}
        {!user?.is_premium && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.02] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-amber-500/30 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <Crown size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Upgrade to Premium</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Unlock more features.</p>
              </div>
            </div>
            <button 
              onClick={openPremiumSubscription}
              className="w-full mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 py-2 text-center text-xs font-bold text-amber-400 hover:bg-amber-500/10 active:scale-95 transition-all duration-200"
            >
              Upgrade
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#020617] text-[#e5e7eb] font-sans overflow-hidden">
      {/* Desktop Sidebar (Always Visible on lg) */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-300"
        />
      )}

      {/* Mobile Drawer (Slide In) */}
      <aside className={`fixed bottom-0 top-0 z-50 flex w-64 flex-col lg:hidden transition-transform duration-300 ease-out ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <SidebarContent />
      </aside>

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 bg-[#050914] px-4 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Hamburger for mobile */}
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-white/5 text-gray-300 hover:text-white transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
              <span className="hidden sm:inline">Workspace</span>
              <span className="hidden sm:inline text-gray-600">/</span>
              <span className="text-white font-semibold">{getBreadcrumb()}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative hidden md:block">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                <Search size={16} />
              </div>
              <input 
                type="text" 
                placeholder="Search" 
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`w-64 pl-10 pr-12 py-1.5 rounded-full text-sm bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all duration-300 ${
                  searchFocused ? "w-80 shadow-[0_0_15px_rgba(59,130,246,0.15)] bg-white/[0.08]" : ""
                }`}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                ⌘K
              </span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/10 bg-[#0a0f1d] p-4 shadow-2xl z-40 animate-in fade-in slide-in-from-top-3 duration-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Notifications</h4>
                    <div className="space-y-3">
                      <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-xs text-white font-medium">Digital twin synchronized</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Phase 1 validation is completed.</p>
                      </div>
                      <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-xs text-white font-medium">Wearable data pending</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Please reconnect Apple Health to update stats.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile */}
            <div className="relative">
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/5 transition-colors focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#7da7ff] to-[#4f79d9] flex items-center justify-center font-bold text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                  {user?.name ? user.name[0].toUpperCase() : <User size={16} />}
                </div>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-[#0a0f1d] p-2 shadow-2xl z-40 animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="px-3 py-2 border-b border-white/5">
                      <p className="text-xs font-bold text-white truncate">{user?.name || "User Name"}</p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{user?.email || "user@peren.ai"}</p>
                    </div>
                    <div className="p-1 space-y-1 mt-1">
                      <button 
                        onClick={() => { setProfileOpen(false); openPremiumSubscription(); }} 
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <Crown size={14} className="text-amber-400" />
                        <span>Manage Subscription</span>
                      </button>
                      <button 
                        onClick={handleLogout} 
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={14} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* Scrollable Child Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#02050d] custom-scrollbar">
          {children}
        </main>
      </div>

      {/* Share / Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#050914] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsInviteOpen(false)}
              className="absolute right-6 top-6 rounded-full bg-white/5 p-2 text-[#9ca3af] transition hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                <Share2 size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white">Invite Friends</h3>
              <p className="mt-3 text-[#9ca3af] text-sm">
                Get 100 credits for each friend who unlocks their digital twin. They'll also receive 10% off their first clinical screening.
              </p>
              <div className="mt-6 p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3">
                <span className="text-xs text-[#7da7ff] font-mono truncate select-all">https://peren.ai/invite/twin-ref-849a</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText("https://peren.ai/invite/twin-ref-849a");
                    alert("Invite link copied!");
                  }}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-all active:scale-95"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Global Inline Custom styles for progress animation */}
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
