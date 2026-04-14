import React, { useState, useEffect, useCallback } from 'react';
import { Instagram, MapPin, Clock, Calendar, ExternalLink, Menu as MenuIcon, X, AlertTriangle } from 'lucide-react';

import barImage from './assets/Bar.webp';
import stayImage from './assets/Stay.webp';
import mapImage from './assets/map-1.webp';
import takoyakiSourceImage from './assets/takoyaki-source.webp';
import takoyakiSaltImage from './assets/takoyaki-salt.webp';

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
          referrerPolicy="no-referrer"
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

  return (
    <div className="min-h-screen font-sans bg-[#1a1a1a] text-[#f5f5f5]">
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

      <main>
        {currentView === 'home' && (
          <div key="home">
            <section className="relative h-[100vh] flex flex-col justify-center items-center px-5 text-center overflow-hidden">
              <div className="absolute inset-0 z-0">
                <SafeImage 
                  src="https://images.unsplash.com/photo-1471922694854-ff1b63b20054?auto=format&fit=crop&w=1920&q=80" 
                  alt="Sunset Sea" 
                  className="w-full h-full opacity-60 brightness-75"
                />
                <div className="absolute inset-0 bg-black/30"></div>
              </div>
              
              <div className="relative z-10 text-white w-full max-w-4xl px-10 flex justify-center">
                <div className="text-center border-t border-white/30 pt-12">
                  <h1 className="text-2xl md:text-3xl font-light tracking-[0.3em] mb-8 leading-[2] drop-shadow-sm">
                    延岡の夜にたこ焼きと<br />
                    一杯の安らぎを
                  </h1>
                  <p className="text-[10px] md:text-xs font-light tracking-[0.4em] uppercase opacity-60">
                    Crevo Takoyaki Bar & Stay
                  </p>
                </div>
              </div>
            </section>

              <section className="py-40 px-5 text-center bg-[#1a1a1a]">
                <div className="max-w-4xl mx-auto">
                  <span className="section-label !text-[#888]">Concept</span>
                  <p className="text-lg md:text-xl font-light leading-[2.5] tracking-wider text-[#ccc]">
                    延岡の夜を、もっと身近に。食べて、飲んで、眠る。<br className="hidden md:block" />
                    そんな飾らない日常を。Crevoは、たこ焼きの香りと共に、<br className="hidden md:block" />
                    地元の人も旅人も、誰もがふらりと立ち寄れる場所でありたいと考えています。
                  </p>
                </div>
              </section>

              <section className="py-40 px-5 max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 md:gap-24">
                    <div className="group cursor-pointer" onClick={() => showView('bar')}>
                      <SafeImage 
                        src={barImage} 
                        alt="Takoyaki Bar" 
                        className="aspect-[4/5] mb-8 rounded-sm overflow-hidden"
                        imgClassName="group-hover:scale-110 transition-transform duration-[2s] grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100"
                      />
                    <span className="section-label !text-left !text-[#888]">1F Floor</span>
                    <h2 className="text-3xl font-light tracking-widest mb-8 text-white">Takoyaki Bar</h2>
                    <button className="btn border-white text-white hover:bg-white hover:text-black">View Menu</button>
                  </div>
                  
                    <div className="group cursor-pointer" onClick={() => showView('stay')}>
                      <SafeImage 
                        src={stayImage} 
                        alt="Stay" 
                        className="aspect-[4/5] mb-8 rounded-sm overflow-hidden"
                        imgClassName="group-hover:scale-110 transition-transform duration-[2s] grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100"
                      />
                    <span className="section-label !text-left !text-[#888]">2F Floor</span>
                    <h2 className="text-3xl font-light tracking-widest mb-8 text-white">Stay</h2>
                    <button className="btn border-white text-white hover:bg-white hover:text-black">Coming Soon</button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {currentView === 'bar' && (
            <div
              key="bar"
              className="pt-32 md:pt-40 pb-20 px-5 max-w-5xl mx-auto bg-[#1a1a1a]"
            >
              <span className="section-label text-center !text-[#888]">1F Floor</span>
              <h1 className="text-3xl font-light tracking-[0.2em] mb-16 text-center text-white">Takoyaki Bar Menu</h1>
              
              <div className="space-y-32 text-[#ccc]">
                {/* Takoyaki Menu */}
                <section className="p-0 text-left">
                  <h2 className="text-lg font-medium text-[#c08457] tracking-[0.3em] uppercase border-b border-[#333] pb-5 mb-12">たこ焼きメニュー</h2>
                  <div className="grid md:grid-cols-2 gap-8 md:gap-15 mb-15">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 group">
                      <SafeImage 
                        src={takoyakiSourceImage} 
                        alt="ソースたこ焼き" 
                        className="w-[120px] h-[120px] shrink-0 rounded-sm shadow-sm overflow-hidden" 
                        imgClassName="group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="flex-1 w-full border-b border-[#333] pb-2 flex justify-between items-end text-lg">
                        <span className="text-white group-hover:text-[#c08457] transition-colors">ソース (5個)</span>
                        <span className="text-white">¥500</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 group">
                      <SafeImage 
                        src={takoyakiSaltImage} 
                        alt="岩塩たこ焼き" 
                        className="w-[120px] h-[120px] shrink-0 rounded-sm shadow-sm overflow-hidden" 
                        imgClassName="group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="flex-1 w-full border-b border-[#333] pb-2 flex justify-between items-end text-lg">
                        <span className="text-white group-hover:text-[#c08457] transition-colors">岩塩 (5個)</span>
                        <span className="text-white">¥500</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#222] p-10 md:p-15 rounded-sm">
                    <div className="flex justify-between items-start border-b border-[#333] pb-8 mb-10">
                      <div>
                        <span className="block text-xs text-[#c08457] mb-2 font-medium">店主おすすめ</span>
                        <h3 className="text-xl font-medium tracking-wider text-white">たこ焼き食べ比べセット</h3>
                        <span className="text-xs text-[#888]">(ソース5個・岩塩5個)</span>
                      </div>
                      <span className="text-2xl font-light text-white">¥1000</span>
                    </div>
                    <div>
                      <span className="block text-xs text-[#c08457] uppercase tracking-widest mb-6 font-medium">Toppings</span>
                      <div className="grid md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <span className="block text-sm text-[#c08457] border-l-4 border-[#c08457] pl-4 font-medium">+¥50</span>
                          <p className="text-sm text-[#aaa] leading-loose">ネギマヨ / 明太マヨ / チーズマヨ /<br />刻み海苔マヨ / すりゴママヨ</p>
                        </div>
                        <div className="space-y-4">
                          <span className="block text-sm text-[#c08457] border-l-4 border-[#c08457] pl-4 font-medium">+¥100</span>
                          <p className="text-sm text-[#aaa] font-light leading-loose">フライドオニオン / ガーリックチップ /<br />柚子コショウ / カレーパウダー</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Nomihoudai */}
                <section className="p-0 text-left">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[#333] pb-5 mb-12 gap-4">
                      <h2 className="text-lg font-medium text-[#c08457] tracking-[0.3em] uppercase">飲み放題メニュー</h2>
                      <div className="flex items-baseline gap-4">
                        <span className="text-sm text-[#888]">120分</span>
                        <span className="text-3xl sm:text-4xl font-bold text-[#c08457]">¥1,500</span>
                        <span className="text-sm text-[#888]">/ 1人</span>
                      </div>
                    </div>
                  <div className="bg-[#222] p-10 md:p-15 shadow-sm rounded-sm">
                    <div className="grid md:grid-cols-2 gap-20 mb-12">
                      <div className="space-y-10">
                        <div>
                          <h4 className="text-xs text-[#c08457] uppercase tracking-widest mb-5 font-medium">サワー</h4>
                          <p className="text-base leading-relaxed text-[#aaa]">タコハイ / ハイボール / レモンサワー / 翠ジンソーダ / 梅酒サワー</p>
                        </div>
                        <div>
                          <h4 className="text-xs text-[#c08457] uppercase tracking-widest mb-5 font-medium">焼酎</h4>
                          <p className="text-base leading-relaxed text-[#aaa]">霧島 (宮崎限定) / 木挽ブルー<br /><small className="text-xs">※水割り、ロック</small></p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs text-[#c08457] uppercase tracking-widest mb-5 font-medium">カクテル</h4>
                        <div className="grid grid-cols-2 gap-4 text-base text-[#aaa]">
                          <span>ソルティードック</span><span>ジン・トニック</span>
                          <span>カルアミルク</span><span>モスコミュール</span>
                          <span>カシスオレンジ</span><span>ピーチソーダ</span>
                          <span>カシスソーダ</span><span>ピーチウーロン</span>
                          <span>カシスウーロン</span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-[#333] pt-10">
                      <h4 className="text-xs text-[#c08457] uppercase tracking-widest mb-5 font-medium">ノンアルコール</h4>
                      <p className="text-base text-[#aaa]">緑茶 / ウーロン茶 / コーラ / ジンジャエール / オレンジ</p>
                    </div>
                  </div>
                </section>

                {/* Ippin */}
                <section className="p-0 text-left">
                  <h2 className="text-lg font-medium text-[#c08457] tracking-[0.3em] uppercase border-b border-[#333] pb-5 mb-12">単品フード</h2>
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
                      <div key={i} className="menu-item !border-[#333] !py-4 md:!py-6 text-white">
                        <span className="text-sm md:text-base">{item.name}</span>
                        <span className="text-sm md:text-base">{item.price}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Drinks */}
                <section className="p-0 text-left pb-20">
                  <h2 className="text-lg font-medium text-[#c08457] tracking-[0.3em] uppercase border-b border-[#333] pb-5 mb-12">単品ドリンク</h2>
                  <div className="grid md:grid-cols-2 gap-12 md:gap-32">
                    <div className="space-y-15">
                      <div className="space-y-8">
                        <h4 className="text-xs text-[#c08457] uppercase tracking-widest border-l-4 border-[#c08457] pl-4 mb-8 font-medium">Beer</h4>
                        <div className="space-y-4">
                          <div className="menu-item !border-none !py-0"><span>生ビール</span><span>¥600</span></div>
                          <div className="menu-item !border-none !py-0"><span>ハイネケン</span><span>¥700</span></div>
                          <div className="menu-item !border-none !py-0"><span>コロナ</span><span>¥700</span></div>
                          <div className="menu-item !border-none !py-0"><span>バドワイザー</span><span>¥700</span></div>
                          <div className="menu-item !border-none !py-0"><span>ノンアルビール</span><span>¥400</span></div>
                        </div>
                      </div>
                      <div className="space-y-8">
                        <h4 className="text-xs text-[#c08457] uppercase tracking-widest border-l-4 border-[#c08457] pl-4 mb-8 font-medium">Whiskey</h4>
                        <div className="space-y-4">
                          <div className="menu-item !border-none !py-0"><span>知多</span><span>¥800</span></div>
                          <div className="menu-item !border-none !py-0"><span>白州</span><span>¥1,200</span></div>
                          <div className="menu-item !border-none !py-0"><span>山崎</span><span>¥1,200</span></div>
                          <div className="menu-item !border-none !py-0"><span>竹鶴</span><span>¥1,400</span></div>
                          <div className="menu-item !border-none !py-0"><span>宮城峡</span><span>¥1,400</span></div>
                        </div>
                      </div>
                      <div className="space-y-8">
                        <h4 className="text-xs text-[#c08457] uppercase tracking-widest border-l-4 border-[#c08457] pl-4 mb-8 font-medium">Shochu</h4>
                        <div className="space-y-4">
                          <div className="menu-item !border-none !py-0"><span>霧島 (宮崎限定)</span><span>¥500</span></div>
                          <div className="menu-item !border-none !py-0"><span>木挽ブルー</span><span>¥500</span></div>
                          <div className="text-[10px] text-[#aaa] uppercase tracking-widest mt-6 mb-2 font-medium">Bottle Keep</div>
                          <div className="menu-item !border-none !py-0"><span>霧島 (宮崎限定)</span><span>¥3,000</span></div>
                          <div className="menu-item !border-none !py-0"><span>木挽ブルー</span><span>¥3,000</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-15">
                      <div className="space-y-8">
                        <h4 className="text-xs text-[#c08457] uppercase tracking-widest border-l-4 border-[#c08457] pl-4 mb-8 font-medium">Sour / Cocktail</h4>
                        <div className="space-y-4">
                          <div className="menu-item !border-none !py-0"><span>ハイボール</span><span>¥500</span></div>
                          <div className="menu-item !border-none !py-0"><span>メガハイボール</span><span>¥700</span></div>
                          <div className="menu-item !border-none !py-0"><span>タコハイ</span><span>¥500</span></div>
                          <div className="menu-item !border-none !py-0"><span>レモンサワー</span><span>¥500</span></div>
                          <div className="menu-item !border-none !py-0"><span>翠ジンソーダ</span><span>¥500</span></div>
                          <div className="menu-item !border-none !py-0"><span>梅酒サワー</span><span>¥500</span></div>
                          <div className="h-5"></div>
                          <div className="menu-item !border-none !py-0"><span>ソルティードック</span><span>¥550</span></div>
                          <div className="menu-item !border-none !py-0"><span>カルアミルク</span><span>¥550</span></div>
                          <div className="menu-item !border-none !py-0"><span>カシスオレンジ</span><span>¥550</span></div>
                          <div className="menu-item !border-none !py-0"><span>モスコーミュール</span><span>¥550</span></div>
                          <div className="menu-item !border-none !py-0"><span>ジン・トニック</span><span>¥550</span></div>
                          <div className="menu-item !border-none !py-0"><span>メガジン・トニック</span><span>¥700</span></div>
                          <div className="menu-item !border-none !py-0"><span>ピーチソーダ</span><span>¥500</span></div>
                          <div className="menu-item !border-none !py-0"><span>ピーチウーロン</span><span>¥500</span></div>
                        </div>
                      </div>
                      <div className="space-y-8">
                        <h4 className="text-xs text-[#c08457] uppercase tracking-widest border-l-4 border-[#c08457] pl-4 mb-8 font-medium">Soft Drink</h4>
                        <div className="space-y-4">
                          <div className="menu-item !border-none !py-0"><span>緑茶</span><span>¥400</span></div>
                          <div className="menu-item !border-none !py-0"><span>ウーロン茶</span><span>¥400</span></div>
                          <div className="menu-item !border-none !py-0"><span>コーラ</span><span>¥400</span></div>
                          <div className="menu-item !border-none !py-0"><span>ジンジャエール</span><span>¥400</span></div>
                          <div className="menu-item !border-none !py-0"><span>オレンジジュース</span><span>¥400</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-xs text-[#aaa] mt-15">※ ワンドリンク制となってます</p>
                </section>
              </div>

              <p className="text-center text-xs text-[#aaa] leading-loose mt-20">
                Open Hours: 19:00 - 23:00 (L.O. 22:30)<br />
                TAKOKYAKI BAR CREVO
              </p>
            </div>
          )}

          {currentView === 'stay' && (
            <div
              key="stay"
              className="pt-40 pb-20 px-5 max-w-3xl mx-auto text-center"
            >
              <span className="section-label">2F Floor</span>
              <h1 className="text-3xl font-light tracking-[0.2em] mb-12 text-white">Stay (Coming Soon)</h1>
              
              <div className="bg-[#222] p-12 md:p-20 rounded-sm border border-white/10 mb-12">
                <div className="w-16 h-1 w-16 bg-[#c08457] mx-auto mb-10"></div>
                <h2 className="text-xl md:text-2xl font-light text-white mb-8 tracking-widest">現在準備中です</h2>
                <p className="text-base md:text-lg font-light text-[#aaa] leading-[2] tracking-wider mb-10">
                  延岡の夜をゆっくりと過ごしていただけるよう、<br className="hidden md:block" />
                  2Fに民泊（ゲストハウス）を準備しております。<br />
                  <br />
                  オープン日が決まり次第、こちらのサイトや<br className="hidden md:block" />
                  Instagramにてお知らせいたします。
                </p>
                <div className="flex justify-center gap-6">
                  <a 
                    href="https://www.instagram.com/takoyakibar.crevo/" 
                    target="_blank" 
                    className="flex items-center gap-3 text-white hover:text-[#c08457] transition-colors text-sm tracking-widest"
                  >
                    <Instagram className="w-5 h-5" />
                    <span>Instagramで最新情報をチェック</span>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <SafeImage 
                  src={stayImage} 
                  alt="Stay Room" 
                  className="aspect-square rounded-sm opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700"
                />
                <SafeImage 
                  src="https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80" 
                  alt="Room 2" 
                  className="aspect-square rounded-sm opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700"
                />
              </div>
            </div>
          )}

          {currentView === 'access' && (
            <div
              key="access"
              className="pt-40 pb-20 px-5 max-w-6xl mx-auto"
            >
              <div className="text-center mb-24">
                <span className="section-label">Access & Info</span>
                <h1 className="text-3xl font-light tracking-[0.2em] text-white">店舗情報・アクセス</h1>
              </div>
              
              <div className="space-y-24">
                {/* Info Grid - Top */}
                <div className="grid md:grid-cols-3 gap-12 md:gap-20 border-b border-white/10 pb-16">
                  <div className="space-y-6">
                    <h3 className="text-[10px] tracking-[0.3em] text-[#c08457] uppercase font-medium border-l-2 border-[#c08457] pl-4">Address</h3>
                    <div className="pl-5">
                      <p className="text-lg font-light text-white mb-2">〒882-0043</p>
                      <p className="text-base font-light text-[#aaa] leading-relaxed">宮崎県延岡市祇園町2丁目1-7</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-[10px] tracking-[0.3em] text-[#c08457] uppercase font-medium border-l-2 border-[#c08457] pl-4">Hours & Days</h3>
                    <div className="pl-5">
                      <p className="text-lg font-light text-white mb-2">19:00 - 23:00 <span className="text-xs text-[#666] ml-2">(L.O. 22:30)</span></p>
                      <p className="text-base font-light text-[#aaa] leading-relaxed">月曜・水曜・金曜・土曜<br />祝日前の日曜</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-[10px] tracking-[0.3em] text-[#c08457] uppercase font-medium border-l-2 border-[#c08457] pl-4">Connect</h3>
                    <div className="pl-5">
                      <a 
                        href="https://www.instagram.com/takoyakibar.crevo/" 
                        target="_blank" 
                        className="group flex items-center gap-3 text-white hover:text-[#c08457] transition-colors"
                      >
                        <Instagram className="w-5 h-5" />
                        <span className="text-base font-light">@takoyakibar.crevo</span>
                      </a>
                      <p className="text-[10px] text-[#555] mt-4 leading-relaxed">最新の営業情報はInstagramをご確認ください。</p>
                    </div>
                  </div>
                </div>

                {/* Handmade Map - Second, Smaller, No Labels */}
                <div className="flex justify-center py-8">
                  <div className="group w-full max-w-3xl aspect-[16/9] rounded-sm border border-white/10 overflow-hidden">
                    <SafeImage 
                      src={mapImage} 
                      alt="Map" 
                      className="w-full h-full"
                      imgClassName="group-hover:scale-110 transition-transform duration-[3s]"
                    />
                  </div>
                </div>

                {/* Google Map - Bottom */}
                <div className="space-y-8 pt-12">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h3 className="text-[10px] tracking-[0.3em] text-[#888] uppercase font-medium">Google Map</h3>
                    <a 
                      href="https://maps.app.goo.gl/..." 
                      target="_blank" 
                      className="text-[10px] text-[#c08457] tracking-widest uppercase flex items-center gap-2 hover:opacity-50 transition-opacity"
                    >
                      Open in Google Maps <ExternalLink size={10} />
                    </a>
                  </div>
                  <div className="h-[400px] md:h-[500px] bg-[#222] rounded-sm overflow-hidden border border-white/10">
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

      <footer className="py-10 w-full text-center text-[10px] tracking-[0.2em] text-[#aaaaaa] uppercase">
        &copy; CREVO 2025
      </footer>
    </div>
  );
}
