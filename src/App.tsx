import React, { useState, useEffect, useCallback } from 'react';
import { Instagram, MapPin, Clock, Calendar, ExternalLink, Menu as MenuIcon, X, AlertTriangle, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// Error Boundary Fallback
const ErrorFallback = ({ error }: { error: Error }) => (
  <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-10 text-center z-[9999]">
    <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
    <h1 className="text-2xl font-bold text-white mb-4">Application Error</h1>
    <p className="text-gray-400 mb-8 max-w-md">{error.message}</p>
    <button 
      onClick={() => window.location.reload()} 
      className="px-6 py-3 bg-white text-black rounded-sm font-medium"
    >
      Reload Page
    </button>
  </div>
);

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

import { IMAGES } from './assets';
import { BookingCalendar } from './components/BookingCalendar';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

console.log("App.tsx module loading...");

type View = 'home' | 'bar' | 'stay' | 'access';

// Image component with loading state and safety
const SafeImage = ({ src, alt, className, imgClassName }: { src: string; alt: string; className?: string; imgClassName?: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      console.warn(`SafeImage: src is missing for ${alt}`);
      setHasError(true);
    } else {
      setHasError(false);
      setIsLoaded(false);
    }
  }, [src, alt]);

  return (
    <div className={`relative overflow-hidden bg-[#222] ${className}`}>
      {!hasError && src ? (
        <img
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            console.error(`Failed to load image: ${src}`, e);
            setHasError(true);
            setIsLoaded(true);
          }}
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] text-[#555] uppercase tracking-widest px-4 text-center gap-2">
          <span className="opacity-50">Image Error</span>
          <span className="text-[8px] opacity-30 break-all max-w-full">{alt}</span>
        </div>
      )}
      {!isLoaded && !hasError && src && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/10 border-t-white/30 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const ADMIN_EMAIL = "takoyakicrevo@gmail.com";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAdmin(user?.email === ADMIN_EMAIL && user?.emailVerified === true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const toggleBooking = async (date: Date) => {
    if (!isAdmin) return;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const docRef = doc(db, 'bookings', dateStr);
    
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const currentStatus = docSnap.data().status;
        await setDoc(docRef, {
          date: dateStr,
          status: currentStatus === 'available' ? 'booked' : 'available',
          updatedAt: new Date().toISOString()
        });
      } else {
        // Default was booked (X), so first toggle makes it available (O)
        await setDoc(docRef, {
          date: dateStr,
          status: 'available',
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `bookings/${dateStr}`);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showView = (view: View) => {
    setCurrentView(view);
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    console.log("App initialized with view:", currentView);
  }, []);

  const galleryImages = [
    IMAGES.STAY,
    IMAGES.STAY_ROOM_2,
    "https://picsum.photos/seed/stay3/800/600",
    "https://picsum.photos/seed/stay4/800/600",
    "https://picsum.photos/seed/stay5/800/600",
    "https://picsum.photos/seed/stay6/800/600",
    "https://picsum.photos/seed/stay7/800/600",
    "https://picsum.photos/seed/stay8/800/600",
  ];

  return (
    <div className="min-h-screen font-sans bg-[var(--bg-main)] text-[var(--text-primary)]">
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10 cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage}
              alt="Gallery Large"
              className="max-w-full max-h-full object-contain rounded-sm shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <button 
              className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-8 h-8" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <header 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 flex justify-between items-center px-8 md:px-20 py-10 md:py-15 ${
          isScrolled 
            ? 'py-8 md:py-8' 
            : 'bg-transparent'
        }`}
        style={isScrolled ? {
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)'
        } : {}}
      >
        <button 
          onClick={() => showView('home')} 
          className="text-sm font-medium tracking-[0.2em] uppercase text-white hover:opacity-50 transition-opacity"
        >
          Crevo
        </button>

        {/* Desktop Nav - Aligned to Right */}
        <nav className="hidden md:block ml-auto">
          <ul className="flex gap-10">
            {(['home', 'bar', 'stay', 'access'] as const).map((view) => (
              <li key={view}>
                <button
                  onClick={() => showView(view)}
                  className={`text-[12px] font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-50 text-white ${
                    currentView === view ? 'opacity-100' : 'opacity-60'
                  }`}
                >
                  {view === 'access' ? 'Access & Info' : view}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-white ml-auto"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X /> : <MenuIcon />}
        </button>
      </header>

      {/* Mobile Nav Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-white z-40 flex flex-col items-center justify-center gap-8 md:hidden">
          {(['home', 'bar', 'stay', 'access'] as const).map((view) => (
            <button
              key={view}
              onClick={() => showView(view)}
              className="text-lg font-medium tracking-[0.3em] uppercase text-[#333]"
            >
              {view === 'access' ? 'Access & Info' : view}
            </button>
          ))}
        </div>
      )}

      <main className="pb-20">
        {currentView === 'home' && (
          <div key="home">
            <section className="relative min-h-[70vh] flex flex-col justify-center items-center px-5 pt-32 pb-20 text-center overflow-hidden">
              <div className="absolute inset-0 z-0">
                <SafeImage 
                  src={IMAGES.HERO_SUNSET} 
                  alt="Sunset Sea" 
                  className="w-full h-full opacity-50 brightness-75"
                />
                <div className="absolute inset-0 bg-black/40"></div>
              </div>
              
              <div className="relative z-10 text-white w-full max-w-4xl px-10 flex justify-center">
                <div className="text-center border-t border-white/30 pt-12">
                  <h1 className="text-2xl md:text-3xl font-light tracking-[0.3em] mb-8 leading-[2.2] drop-shadow-sm">
                    延岡の夜に<br />
                    たこ焼きと<br />
                    一杯の安らぎを
                  </h1>
                  <p className="text-[10px] md:text-xs font-light tracking-[0.4em] uppercase opacity-60">
                    Crevo Takoyaki Bar & Stay
                  </p>
                </div>
              </div>
            </section>

              <section className="py-24 px-5 text-center bg-[var(--bg-surface)]">
                <div className="max-w-4xl mx-auto">
                  <span className="section-label">Concept</span>
                  <p className="text-base md:text-xl font-light leading-[2.5] tracking-wider text-[var(--text-secondary)] max-w-2xl mx-auto">
                    延岡の夜を、もっと身近に。<br />
                    食べて、飲んで、眠る。<br />
                    そんな飾らない日常を。<br /><br />
                    Crevoは、たこ焼きの香りと共に、<br />
                    地元の人も旅人も、<br />
                    誰もがふらりと立ち寄れる場所でありたいと<br />
                    考えています。
                  </p>
                </div>
              </section>

              {/* Instagram Feed Section */}
              <section className="py-12 px-5 bg-[var(--bg-main)]">
                <div className="max-w-2xl mx-auto">
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-sm overflow-hidden flex flex-col md:flex-row items-stretch">
                    {/* Instagram Embed - Left Side (Smaller) */}
                    <div className="w-full md:w-[240px] bg-white/5 flex flex-col items-center justify-center p-3 border-b md:border-b-0 md:border-r border-[var(--border-color)]">
                      <iframe
                        src="https://www.instagram.com/takoyakibar.crevo/embed"
                        className="w-full h-[320px] border-none overflow-hidden"
                        scrolling="no"
                        frameBorder="0"
                      ></iframe>
                    </div>
                    
                    {/* Text & Button - Right Side (More compact) */}
                    <div className="flex-1 p-6 md:p-8 text-center md:text-left flex flex-col justify-center items-center md:items-start">
                      <span className="section-label !mb-4">Latest News</span>
                      <p className="text-xs text-white tracking-widest mb-3">最新情報はInstagramにて発信中</p>
                      <p className="text-[10px] text-[var(--text-muted)] leading-relaxed mb-6 max-w-[200px]">
                        限定メニューや営業時間の変更など、<br className="hidden md:block" />
                        リアルタイムでお届けしています。
                      </p>
                      <a 
                        href="https://www.instagram.com/takoyakibar.crevo/" 
                        target="_blank"
                        className="inline-block text-[9px] text-white tracking-[0.3em] uppercase border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition-all"
                      >
                        Follow Us
                      </a>
                    </div>
                  </div>
                </div>
              </section>

              <section className="py-24 px-5 max-w-5xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 md:gap-16">
                    <div className="group cursor-pointer" onClick={() => showView('bar')}>
                      <SafeImage 
                        src={IMAGES.BAR} 
                        alt="Takoyaki Bar" 
                        className="aspect-[3/2] mb-8 rounded-sm overflow-hidden"
                        imgClassName="group-hover:scale-110 transition-transform duration-[2s] grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100"
                      />
                    <span className="section-label !text-left">1F Floor</span>
                    <h2 className="text-2xl font-light tracking-widest mb-6 text-[var(--text-primary)]">Takoyaki Bar</h2>
                    <button className="btn">View Menu</button>
                  </div>
                  
                    <div className="group cursor-pointer" onClick={() => showView('stay')}>
                      <SafeImage 
                        src={IMAGES.STAY} 
                        alt="Stay" 
                        className="aspect-[3/2] mb-8 rounded-sm overflow-hidden"
                        imgClassName="group-hover:scale-110 transition-transform duration-[2s] grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100"
                      />
                    <span className="section-label !text-left">2F Floor</span>
                    <h2 className="text-2xl font-light tracking-widest mb-6 text-[var(--text-primary)]">Stay</h2>
                    <button className="btn">View Details</button>
                  </div>
                </div>
              </section>

              {/* Contact Section */}
              <section id="contact" className="py-24 px-5 bg-[var(--bg-surface)] border-t border-[var(--border-color)]">
                <div className="max-w-4xl mx-auto text-center">
                  <span className="section-label">Contact</span>
                  <h2 className="text-2xl font-light tracking-widest text-white mb-12">お問い合わせ</h2>
                  
                  <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                    {/* Instagram DM Option */}
                    <div className="bg-[var(--bg-main)] p-10 border border-[var(--border-color)] rounded-sm flex flex-col items-center group hover:border-white/30 transition-all">
                      <div className="w-12 h-12 mb-6 flex items-center justify-center rounded-full bg-white/5 group-hover:bg-white/10 transition-all">
                        <Instagram size={24} className="text-[#c08457]" />
                      </div>
                      <h3 className="text-white text-sm tracking-widest mb-4">Instagram DM</h3>
                      <p className="text-[10px] text-[var(--text-muted)] leading-relaxed mb-8">
                        お急ぎの方や、カジュアルなご質問は<br />
                        InstagramのDMにて承っております。
                      </p>
                      <a 
                        href="https://www.instagram.com/takoyakibar.crevo/" 
                        target="_blank"
                        className="text-[9px] text-white tracking-[0.3em] uppercase border border-white/20 px-8 py-3 hover:bg-white hover:text-black transition-all"
                      >
                        Send Message
                      </a>
                    </div>

                    {/* Form Option */}
                    <div className="bg-[var(--bg-main)] p-10 border border-[var(--border-color)] rounded-sm flex flex-col items-center group hover:border-white/30 transition-all">
                      <div className="w-12 h-12 mb-6 flex items-center justify-center rounded-full bg-white/5 group-hover:bg-white/10 transition-all">
                        <Mail size={24} className="text-[#c08457]" />
                      </div>
                      <h3 className="text-white text-sm tracking-widest mb-4">Inquiry Form</h3>
                      <p className="text-[10px] text-[var(--text-muted)] leading-relaxed mb-8">
                        宿泊の団体予約や貸切のご相談など、<br />
                        詳細な内容はこちらのフォームから。
                      </p>
                      <a 
                        href="https://docs.google.com/forms/d/e/1FAIpQLSd70W0gTYKgtd_19JjZ6cHAiOj9IWMXqHB4qK9mEoBQwJjlNA/viewform?usp=sf_link" 
                        target="_blank"
                        className="text-[9px] text-white tracking-[0.3em] uppercase border border-white/20 px-8 py-3 hover:bg-white hover:text-black transition-all"
                      >
                        Open Form
                      </a>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {currentView === 'bar' && (
            <div
              key="bar"
              className="pt-32 md:pt-40 pb-20 px-5 max-w-5xl mx-auto bg-[var(--bg-main)]"
            >
              <span className="section-label text-center">1F Floor</span>
              <h1 className="text-3xl font-light tracking-[0.2em] mb-16 text-center text-white">Takoyaki Bar Menu</h1>
              
              <div className="space-y-32 text-[var(--text-secondary)]">
                {/* Takoyaki Menu */}
                <section className="p-0 text-left">
                  <h2 className="text-lg font-medium text-[var(--text-primary)] tracking-[0.3em] uppercase border-b border-[var(--border-color)] pb-5 mb-12">たこ焼きメニュー</h2>
                  <div className="grid md:grid-cols-2 gap-8 md:gap-15 mb-15">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 group">
                      <SafeImage 
                        src={IMAGES.TAKOYAKI_SOURCE} 
                        alt="ソースたこ焼き" 
                        className="w-[120px] h-[120px] shrink-0 rounded-sm shadow-sm overflow-hidden" 
                        imgClassName="group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="flex-1 w-full border-b border-[var(--border-color)] pb-2 flex justify-between items-end text-lg">
                        <span className="text-white group-hover:text-[#c08457] transition-colors">ソース (5個)</span>
                        <span className="text-white">¥500</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 group">
                      <SafeImage 
                        src={IMAGES.TAKOYAKI_SALT} 
                        alt="岩塩たこ焼き" 
                        className="w-[120px] h-[120px] shrink-0 rounded-sm shadow-sm overflow-hidden" 
                        imgClassName="group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="flex-1 w-full border-b border-[var(--border-color)] pb-2 flex justify-between items-end text-lg">
                        <span className="text-white group-hover:text-[#c08457] transition-colors">岩塩 (5個)</span>
                        <span className="text-white">¥500</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-surface)] p-10 md:p-15 rounded-sm border border-[var(--border-color)]">
                    <div className="flex justify-between items-start border-b border-[var(--border-color)] pb-8 mb-10">
                      <div>
                        <span className="block text-xs text-[#c08457] mb-2 font-medium">店主おすすめ</span>
                        <h3 className="text-xl font-medium tracking-wider text-white">たこ焼き食べ比べセット</h3>
                        <span className="text-xs text-[var(--text-muted)]">(ソース5個・岩塩5個)</span>
                      </div>
                      <span className="text-2xl font-light text-white">¥1000</span>
                    </div>
                    <div>
                      <span className="block text-xs text-white uppercase tracking-widest mb-6 font-medium">Toppings</span>
                      <div className="grid md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <span className="block text-sm text-white border-l-4 border-[#c08457] pl-4 font-medium">+¥50</span>
                          <p className="text-sm text-white leading-loose">ネギマヨ / 明太マヨ / チーズマヨ /<br />刻み海苔マヨ / すりゴママヨ</p>
                        </div>
                        <div className="space-y-4">
                          <span className="block text-sm text-white border-l-4 border-[#c08457] pl-4 font-medium">+¥100</span>
                          <p className="text-sm text-white font-light leading-loose">フライドオニオン / ガーリックチップ /<br />柚子コショウ / カレーパウダー</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Nomihoudai */}
                <section className="p-0 text-left">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[var(--border-color)] pb-5 mb-12 gap-4">
                      <h2 className="text-lg font-medium text-[var(--text-primary)] tracking-[0.3em] uppercase">飲み放題メニュー</h2>
                      <div className="flex items-baseline gap-4">
                        <span className="text-sm text-[var(--text-muted)]">120分</span>
                        <span className="text-3xl sm:text-4xl font-bold text-white">¥1,500</span>
                        <span className="text-sm text-[var(--text-muted)]">/ 1人</span>
                      </div>
                    </div>
                  <div className="bg-[var(--bg-surface)] p-10 md:p-15 shadow-sm rounded-sm border border-[var(--border-color)]">
                    <div className="grid md:grid-cols-2 gap-20 mb-12">
                      <div className="space-y-10">
                        <div>
                          <h4 className="text-xs text-white uppercase tracking-widest mb-5 font-medium">サワー</h4>
                          <p className="text-base leading-relaxed text-white">タコハイ / ハイボール / レモンサワー / 翠ジンソーダ / 梅酒サワー</p>
                        </div>
                        <div>
                          <h4 className="text-xs text-white uppercase tracking-widest mb-5 font-medium">焼酎</h4>
                          <p className="text-base leading-relaxed text-white">霧島 (宮崎限定) / 木挽ブルー<br /><small className="text-xs">※水割り、ロック</small></p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs text-white uppercase tracking-widest mb-5 font-medium">カクテル</h4>
                        <div className="grid grid-cols-2 gap-4 text-base text-white">
                          <span>ソルティードック</span><span>ジン・トニック</span>
                          <span>カルアミルク</span><span>モスコミュール</span>
                          <span>カシスオレンジ</span><span>ピーチソーダ</span>
                          <span>カシスソーダ</span><span>ピーチウーロン</span>
                          <span>カシスウーロン</span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-[var(--border-color)] pt-10">
                      <h4 className="text-xs text-white uppercase tracking-widest mb-5 font-medium">ノンアルコール</h4>
                      <p className="text-base text-white">緑茶 / ウーロン茶 / コーラ / ジンジャエール / オレンジ</p>
                    </div>
                  </div>
                </section>

                {/* Ippin */}
                <section className="p-0 text-left">
                  <h2 className="text-lg font-medium text-[var(--text-primary)] tracking-[0.3em] uppercase border-b border-[var(--border-color)] pb-5 mb-12">単品フード</h2>
                  <div className="grid md:grid-cols-2 gap-x-12 md:gap-x-20">
                    {[
                      { name: '魔法の塩味枝豆', price: '¥300' },
                      { name: 'ザクッ！串カツ (6本)', price: '¥500' },
                      { name: '唐揚げ⤴', price: '¥500' },
                      { name: '肉厚アジフライ (2枚)', price: '¥500' },
                      { name: '粒弾！子持ちししゃも', price: '¥500' },
                      { name: '止まらないポテトフライ', price: '¥500' },
                      { name: '手が汚れる手羽餃子', price: '¥500' },
                      { name: '〆のチャーハン', price: '¥500' },
                      { name: '牛すじ塊コロッケ', price: '¥500' },
                      { name: '羽が生えた餃子', price: '¥500' },
                      { name: 'クルトンかけたシーザーサラダ', price: '¥500' },
                      { name: 'タコとブロッコリーのアヒージョ (パン付き)', price: '¥1,000' },
                      { name: 'みんな大好きスナック盛り', price: '¥500' },
                      { name: '疲れた体にチョコ盛り', price: '¥500' },
                    ].map((item, i) => (
                      <div key={i} className="menu-item !border-[var(--border-color)] !py-4 md:!py-6 text-white">
                        <span className="text-sm md:text-base">{item.name}</span>
                        <span className="text-sm md:text-base text-white">{item.price}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Drinks */}
                <section className="p-0 text-left pb-20">
                  <h2 className="text-lg font-medium text-[var(--text-primary)] tracking-[0.3em] uppercase border-b border-[var(--border-color)] pb-5 mb-12">単品ドリンク</h2>
                  <div className="grid md:grid-cols-2 gap-12 md:gap-32">
                    <div className="space-y-15">
                      <div className="space-y-8">
                        <h4 className="text-xs text-white uppercase tracking-widest border-l-4 border-[#c08457] pl-4 mb-8 font-medium">Beer</h4>
                        <div className="space-y-4">
                          <div className="menu-item !border-none !py-0 text-white"><span>生ビール</span><span className="text-white">¥600</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>ハイネケン</span><span className="text-white">¥700</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>コロナ</span><span className="text-white">¥700</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>バドワイザー</span><span className="text-white">¥700</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>ノンアルビール</span><span className="text-white">¥400</span></div>
                        </div>
                      </div>
                      <div className="space-y-8">
                        <h4 className="text-xs text-white uppercase tracking-widest border-l-4 border-[#c08457] pl-4 mb-8 font-medium">Whiskey</h4>
                        <div className="space-y-4">
                          <div className="menu-item !border-none !py-0 text-white"><span>知多</span><span className="text-white">¥800</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>白州</span><span className="text-white">¥1,200</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>山崎</span><span className="text-white">¥1,200</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>竹鶴</span><span className="text-white">¥1,400</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>宮城峡</span><span className="text-white">¥1,400</span></div>
                        </div>
                      </div>
                      <div className="space-y-8">
                        <h4 className="text-xs text-white uppercase tracking-widest border-l-4 border-[#c08457] pl-4 mb-8 font-medium">Shochu</h4>
                        <div className="space-y-4">
                          <div className="menu-item !border-none !py-0 text-white"><span>霧島 (宮崎限定)</span><span className="text-white">¥500</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>木挽ブルー</span><span className="text-white">¥500</span></div>
                          <div className="text-[10px] text-white uppercase tracking-widest mt-6 mb-2 font-medium">Bottle Keep</div>
                          <div className="menu-item !border-none !py-0 text-white"><span>霧島 (宮崎限定)</span><span className="text-white">¥3,000</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>木挽ブルー</span><span className="text-white">¥3,000</span></div>
                        </div>
                      </div>
                      <div className="space-y-8">
                        <h4 className="text-xs text-white uppercase tracking-widest border-l-4 border-[#c08457] pl-4 mb-8 font-medium">Champagne</h4>
                        <div className="space-y-4">
                          <div className="menu-item !border-none !py-0 text-white"><span>ポンパドール</span><span className="text-white">¥3,000</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>タコシャン</span><span className="text-white">¥6,000</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>モエ</span><span className="text-white">¥15,000</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-15">
                      <div className="space-y-8">
                        <h4 className="text-xs text-white uppercase tracking-widest border-l-4 border-[#c08457] pl-4 mb-8 font-medium">Sour / Cocktail</h4>
                        <div className="space-y-4">
                          <div className="menu-item !border-none !py-0 text-white"><span>ハイボール</span><span className="text-white">¥500</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>メガハイボール</span><span className="text-white">¥700</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>タコハイ</span><span className="text-white">¥500</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>レモンサワー</span><span className="text-white">¥500</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>翠ジンソーダ</span><span className="text-white">¥500</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>梅酒サワー</span><span className="text-white">¥500</span></div>
                          <div className="h-5"></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>ソルティードック</span><span className="text-white">¥550</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>カルアミルク</span><span className="text-white">¥550</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>カシスオレンジ</span><span className="text-white">¥550</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>モスコーミュール</span><span className="text-white">¥550</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>ジン・トニック</span><span className="text-white">¥550</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>メガジン・トニック</span><span className="text-white">¥700</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>ピーチソーダ</span><span className="text-white">¥500</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>ピーチウーロン</span><span className="text-white">¥500</span></div>
                        </div>
                      </div>
                      <div className="space-y-8">
                        <h4 className="text-xs text-white uppercase tracking-widest border-l-4 border-[#c08457] pl-4 mb-8 font-medium">Soft Drink</h4>
                        <div className="space-y-4">
                          <div className="menu-item !border-none !py-0 text-white"><span>緑茶</span><span className="text-white">¥400</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>ウーロン茶</span><span className="text-white">¥400</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>コーラ</span><span className="text-white">¥400</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>ジンジャエール</span><span className="text-white">¥400</span></div>
                          <div className="menu-item !border-none !py-0 text-white"><span>オレンジジュース</span><span className="text-white">¥400</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-xs text-[var(--text-muted)] mt-15">※ ワンドリンク制となってます</p>
                </section>
              </div>

              <p className="text-center text-xs text-[var(--text-muted)] leading-loose mt-20">
                Open Hours: 19:00 - 23:00 (L.O. 22:30)<br />
                TAKOKYAKI BAR CREVO
              </p>
            </div>
          )}

          {currentView === 'stay' && (
            <div
              key="stay"
              className="relative pt-40 pb-20 px-5 max-w-5xl mx-auto bg-[var(--bg-main)]"
            >
              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-start pt-60 px-10 text-center">
                <div className="bg-[#c08457] text-white px-10 py-4 mb-8 tracking-[0.5em] font-bold text-xl md:text-2xl shadow-2xl">
                  COMING SOON
                </div>
                <h2 className="text-white text-lg md:text-xl font-light tracking-widest mb-6 leading-relaxed">
                  宿泊予約は現在準備中です
                </h2>
                <p className="text-white/80 text-sm font-light tracking-widest leading-loose max-w-md">
                  認可申請中のため、オープン日は未定となっております。<br />
                  最新情報はInstagramにて随時お知らせいたします。
                </p>
              </div>

              <div className="text-center mb-16">
                <span className="section-label">2F Floor</span>
                <h1 className="text-3xl font-light tracking-[0.2em] text-white">Stay & Reservation</h1>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-16 items-start">
                {/* Left Side: Info */}
                <div className="space-y-12 text-center md:text-left">
                  <div className="bg-[var(--bg-surface)] p-10 md:p-12 rounded-sm border border-[var(--border-color)] text-center md:text-left">
                    <div className="w-12 h-0.5 bg-[#c08457] mb-8 mx-auto md:mx-0"></div>
                    <p className="text-base font-light text-white leading-[2.2] tracking-wider mb-12 max-w-md mx-auto md:mx-0">
                      1FのBarで楽しんだ後は、<br className="hidden md:block" />
                      そのまま2Fのプライベート空間へ。<br className="hidden md:block" />
                      延岡の夜を、ゆっくりとお過ごしください。
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
                      <ul className="space-y-4 text-sm text-[var(--text-muted)] tracking-widest text-left">
                        <li className="flex items-center gap-3">
                          <div className="w-1 h-1 bg-[#c08457] rounded-full"></div>
                          <span>定員：最大5名様</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <div className="w-1 h-1 bg-[#c08457] rounded-full"></div>
                          <span>チェックイン：16:00〜</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <div className="w-1 h-1 bg-[#c08457] rounded-full"></div>
                          <span>チェックアウト：〜11:00</span>
                        </li>
                      </ul>

                      <div 
                        className="relative group cursor-zoom-in"
                        onClick={() => setSelectedImage("https://picsum.photos/seed/notes/800/1131")}
                      >
                        <div className="absolute -inset-2 bg-[#c08457]/10 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative bg-white/5 border border-white/10 p-4 rounded-sm flex items-center gap-4 transition-transform group-hover:-translate-y-1">
                          <div className="w-10 h-12 bg-white/10 rounded-sm flex items-center justify-center border border-white/20">
                            <span className="text-[10px] text-white font-bold">PDF</span>
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] text-white tracking-widest uppercase mb-1">Notice</p>
                            <p className="text-xs text-[var(--text-muted)] tracking-wider">施設利用の注意事項</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pricing Table */}
                    <div className="mb-12">
                      <h3 className="text-xs text-white uppercase tracking-widest mb-6 font-medium border-l-4 border-[#c08457] pl-4 text-left">Stay Plan / Price</h3>
                      <div className="space-y-2">
                        {[
                          { label: '1名様利用', price: '¥-,---' },
                          { label: '2名様利用', price: '¥-,---' },
                          { label: '3名様利用', price: '¥-,---' },
                          { label: '4名様利用', price: '¥-,---' },
                          { label: '5名様利用 (最大)', price: '¥-,---' },
                        ].map((plan, i) => (
                          <div key={i} className="flex justify-between items-center py-3 border-b border-[var(--border-color)] text-sm tracking-wider">
                            <span className="text-white">{plan.label}</span>
                            <span className="text-white font-medium">{plan.price}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] mt-4 tracking-widest">※ 料金は季節や曜日により変動する場合がございます</p>
                    </div>

                    {/* Amenities & Facilities */}
                    <div className="mb-12">
                      <h3 className="text-xs text-white uppercase tracking-widest mb-8 font-medium border-l-4 border-[#c08457] pl-4 text-left">Amenities & Facilities</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                        <div className="space-y-6">
                          <h4 className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-medium">Appliances</h4>
                          <ul className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-white tracking-wider">
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-[#c08457]/50 rounded-full"></div>
                              <span>テレビ</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-[#c08457]/50 rounded-full"></div>
                              <span>洗濯機</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-[#c08457]/50 rounded-full"></div>
                              <span>電子レンジ</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-[#c08457]/50 rounded-full"></div>
                              <span>エアコン</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-[#c08457]/50 rounded-full"></div>
                              <span>ケトル</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-[#c08457]/50 rounded-full"></div>
                              <span>一口ガスコンロ</span>
                            </li>
                          </ul>
                        </div>
                        <div className="space-y-6">
                          <h4 className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-medium">Amenities</h4>
                          <ul className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-white tracking-wider">
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-[#c08457]/50 rounded-full"></div>
                              <span>シャンプー</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-[#c08457]/50 rounded-full"></div>
                              <span>コンディショナー</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-[#c08457]/50 rounded-full"></div>
                              <span>ボディソープ</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-[#c08457]/50 rounded-full"></div>
                              <span>ドライヤー</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-[#c08457]/50 rounded-full"></div>
                              <span>タオル</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-[#c08457]/50 rounded-full"></div>
                              <span>洗濯洗剤</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="mb-12 p-6 bg-white/5 border border-white/10 rounded-sm">
                      <p className="text-xs text-white leading-relaxed text-center">
                        空室状況は、下記のカレンダーにて<br />
                        ご確認いただけます。
                      </p>
                    </div>

                    <div className="pt-8 border-t border-[var(--border-color)]">
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">
                        ※ 現在、予約システムは表示のみとなっております。<br />
                        実際の予約・お問い合わせはInstagramのDMよりお願いいたします。
                      </p>
                      <a 
                        href="https://www.instagram.com/takoyakibar.crevo/" 
                        target="_blank" 
                        className="inline-flex items-center gap-3 text-[var(--text-primary)] hover:text-[#c08457] transition-colors text-xs tracking-[0.2em] uppercase border border-[var(--border-color)] px-6 py-3 rounded-sm"
                      >
                        <Instagram className="w-4 h-4" />
                        <span>DMで問い合わせる</span>
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {galleryImages.map((src, i) => (
                      <div 
                        key={i} 
                        className="relative aspect-square cursor-zoom-in group overflow-hidden rounded-sm bg-[var(--bg-surface)] border border-[var(--border-color)]"
                        onClick={() => setSelectedImage(src)}
                      >
                        <SafeImage 
                          src={src} 
                          alt={`Gallery ${i + 1}`} 
                          className="w-full h-full opacity-80 grayscale group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-8 h-8 border border-white/30 rounded-full flex items-center justify-center">
                            <div className="w-1 h-1 bg-white rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] text-center tracking-[0.2em] uppercase">Click to enlarge images</p>
                </div>

                {/* Right Side: Calendar */}
                <div className="space-y-8 lg:pt-20">
                  <div className="text-center lg:text-left">
                    <h3 className="text-sm font-medium text-white tracking-[0.3em] uppercase mb-4">Availability</h3>
                    <p className="text-xs text-[var(--text-muted)] tracking-widest">オープン準備中のため、現在は全日満室表示となっております</p>
                  </div>
                  
                  <BookingCalendar 
                    onDateSelect={isAdmin ? toggleBooking : undefined}
                    isAdmin={isAdmin}
                  />

                  <div className="bg-[var(--bg-surface)] p-6 rounded-sm border border-[var(--border-color)]">
                    <div className="flex items-center gap-4 text-[var(--text-muted)]">
                      <Calendar className="w-5 h-5 text-[#c08457]" />
                      <span className="text-xs tracking-widest">カレンダーから希望日を選択して空き状況を確認してください。</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'access' && (
            <div
              key="access"
              className="pt-40 pb-20 px-5 max-w-6xl mx-auto bg-[var(--bg-main)]"
            >
              <div className="text-center mb-24">
                <span className="section-label">Access & Info</span>
                <h1 className="text-3xl font-light tracking-[0.2em] text-white">店舗情報・アクセス</h1>
              </div>
              
              <div className="space-y-24">
                {/* Info Grid - Top */}
                <div className="grid md:grid-cols-3 gap-12 md:gap-20 border-b border-[var(--border-color)] pb-16">
                  <div className="space-y-6">
                    <h3 className="text-[10px] tracking-[0.3em] text-white uppercase font-medium border-l-2 border-[#c08457] pl-4">Address</h3>
                    <div className="pl-5">
                      <p className="text-lg font-light text-[var(--text-primary)] mb-2">〒882-0043</p>
                      <p className="text-base font-light text-[var(--text-secondary)] leading-relaxed">宮崎県延岡市祇園町2丁目1-7</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-[10px] tracking-[0.3em] text-white uppercase font-medium border-l-2 border-[#c08457] pl-4">Hours & Days</h3>
                    <div className="pl-5">
                      <p className="text-lg font-light text-[var(--text-primary)] mb-2">19:00 - 23:00 <span className="text-xs text-[var(--text-muted)] ml-2">(L.O. 22:30)</span></p>
                      <p className="text-base font-light text-[var(--text-secondary)] leading-relaxed">月曜・水曜・金曜・土曜<br />祝日前の日曜</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-[10px] tracking-[0.3em] text-white uppercase font-medium border-l-2 border-[#c08457] pl-4">Connect</h3>
                    <div className="pl-5">
                      <a 
                        href="https://www.instagram.com/takoyakibar.crevo/" 
                        target="_blank" 
                        className="group flex items-center gap-3 text-[var(--text-primary)] hover:text-[#c08457] transition-colors"
                      >
                        <Instagram className="w-5 h-5" />
                        <span className="text-base font-light">@takoyakibar.crevo</span>
                      </a>
                      <p className="text-[10px] text-[var(--text-muted)] mt-4 leading-relaxed">最新の営業情報はInstagramをご確認ください。</p>
                    </div>
                  </div>
                </div>

                {/* Handmade Map - Second, Smaller, No Labels */}
                <div className="flex justify-center py-8">
                  <div className="group w-full max-w-3xl aspect-[16/9] rounded-sm border border-[var(--border-color)] overflow-hidden">
                    <SafeImage 
                      src={IMAGES.MAP} 
                      alt="Map" 
                      className="w-full h-full"
                      imgClassName="group-hover:scale-110 transition-transform duration-[3s]"
                    />
                  </div>
                </div>

                {/* Google Map - Bottom */}
                <div className="space-y-8 pt-12">
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                    <h3 className="text-[10px] tracking-[0.3em] text-white uppercase font-medium">Google Map</h3>
                    <a 
                      href="https://maps.app.goo.gl/..." 
                      target="_blank" 
                      className="text-[10px] text-[#c08457] tracking-widest uppercase flex items-center gap-2 hover:opacity-50 transition-opacity"
                    >
                      Open in Google Maps <ExternalLink size={10} />
                    </a>
                  </div>
                  <div className="h-[400px] md:h-[500px] bg-[var(--bg-surface)] rounded-sm overflow-hidden border border-[var(--border-color)]">
                    <iframe 
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3372.483561494634!2d131.664444!3d32.583333!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3546961444444445%3A0x4444444444444444!2z44CSODgyLTAwNDMg5a6u5bSO55yM5bu25bKh5biC56WH5ZyS55S677yS5LiB55uu77yR77yN77yX!5e0!3m2!1sja!2sjp!4v1712460000000!5m2!1sja!2sjp" 
                      width="100%" 
                      height="100%" 
                      style={{ border: 0 }} 
                      allowFullScreen 
                      loading="lazy" 
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-20 w-full text-center text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase flex flex-col items-center gap-6 border-t border-[var(--border-color)] bg-[var(--bg-surface)]">
        <div className="opacity-50">&copy; CREVO 2025</div>
        <div className="flex items-center gap-4">
          {isAdmin ? (
            <button onClick={handleLogout} className="px-4 py-2 border border-[var(--border-color)] rounded-sm hover:bg-[var(--bg-dark)] transition-colors text-[var(--text-primary)]">
              Logout (Admin Mode)
            </button>
          ) : (
            <button onClick={handleLogin} className="opacity-20 hover:opacity-100 transition-opacity p-2 text-[var(--text-primary)]">
              Admin Login
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
