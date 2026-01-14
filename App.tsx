
import React, { useState, useEffect, useCallback } from 'react';
import { ViewType, Business, Service, QueueToken, User } from './types';
import CustomerDashboard from './components/CustomerDashboard';
import AdminDashboard from './components/AdminDashboard';
import AuthPage from './components/AuthPage';
import UserProfile from './components/UserProfile';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeToken, setActiveToken] = useState<QueueToken | null>(null);
  const [allTokens, setAllTokens] = useState<QueueToken[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [currentTab, setCurrentTab] = useState<'home' | 'profile'>('home');

  useEffect(() => {
    const initApp = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata.full_name || 'User',
          role: session.user.user_metadata.role || ViewType.CUSTOMER
        });
        await fetchTokens();
      }
      setIsLoading(false);
    };
    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata.full_name || 'User',
          role: session.user.user_metadata.role || ViewType.CUSTOMER
        });
        await fetchTokens();
      } else {
        setUser(null);
        setActiveToken(null);
        setAllTokens([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Real-time listener for in-app notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('token-alerts')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tokens' }, (payload) => {
        const updated = payload.new as any;
        if (updated.user_id === user.id && updated.status === 'SERVING') {
          setNotification(`🎉 It's your turn! Your token ${updated.token_number} is being served.`);
        }
        fetchTokens();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchTokens = async () => {
    // Fetch tokens joined with profiles for names
    const { data, error } = await supabase
      .from('tokens')
      .select(`
        *,
        profiles:user_id (full_name)
      `)
      .order('joined_at', { ascending: true });

    if (error) return;

    const formattedTokens: QueueToken[] = data.map((t: any) => ({
      id: t.id,
      businessId: t.business_id,
      serviceId: t.service_id,
      tokenNumber: t.token_number,
      position: t.position,
      status: t.status,
      joinedAt: new Date(t.joined_at),
      notes: t.notes,
      userId: t.user_id,
      customer_name: t.profiles?.full_name || 'Anonymous'
    }));

    setAllTokens(formattedTokens);
    
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    if (currentUserId) {
      const active = formattedTokens.find(t => t.userId === currentUserId && (t.status === 'WAITING' || t.status === 'SERVING'));
      setActiveToken(active || null);
    }
  };

  const handleJoinQueue = useCallback(async (business: Business, service: Service, notes?: string): Promise<QueueToken | void> => {
    if (!user) return;
    setIsJoining(true);

    try {
      const tokenNumber = `${service.name[0].toUpperCase()}-${Math.floor(Math.random() * 900) + 100}`;
      const position = allTokens.filter(t => t.businessId === business.id && t.status === 'WAITING').length + 1;

      const { data, error } = await supabase.from('tokens').insert({
        business_id: business.id,
        service_id: service.id,
        token_number: tokenNumber,
        position: position,
        status: 'WAITING',
        notes: notes,
        user_id: user.id
      }).select().single();

      if (error) throw error;
      
      const newToken: QueueToken = {
        id: data.id,
        businessId: data.business_id,
        serviceId: data.service_id,
        tokenNumber: data.token_number,
        position: data.position,
        status: data.status,
        joinedAt: new Date(data.joined_at),
        userId: data.user_id,
        customer_name: user.name
      };

      await fetchTokens();
      return newToken;
    } catch (err: any) {
      setNotification('Booking failed.');
    } finally {
      setIsJoining(false);
    }
  }, [allTokens, user]);

  const handleUpdateTokenStatus = async (tokenId: string, status: QueueToken['status']) => {
    const { error } = await supabase.from('tokens').update({ status }).eq('id', tokenId);
    if (!error) await fetchTokens();
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black">SYNCING...</div>;
  if (!user) return <AuthPage />;

  const isCustomer = user.role === ViewType.CUSTOMER;
  const themeColor = isCustomer ? 'orange' : 'indigo';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[250] w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-top-full duration-500">
          <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl flex items-center justify-between border-2 border-slate-700/50 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
              </div>
              <p className="text-sm font-black tracking-tight">{notification}</p>
            </div>
            <button onClick={() => setNotification(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      <nav className="bg-white px-6 md:px-12 py-5 sticky top-0 z-50 shadow-sm border-b border-slate-100 backdrop-blur-xl bg-white/90">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div onClick={() => setCurrentTab('home')} className={`w-12 h-12 bg-${themeColor}-500 rounded-2xl flex items-center justify-center text-white shadow-lg cursor-pointer transform hover:scale-105 transition-all`}>
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2 2H4v4z"/></svg>
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900 hidden sm:block">QueueLess</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setCurrentTab('home')} className={`text-sm font-black uppercase tracking-widest transition-all ${currentTab === 'home' ? `text-${themeColor}-500` : 'text-slate-400 hover:text-slate-900'}`}>Discover</button>
            <button onClick={() => setCurrentTab('profile')} className={`text-sm font-black uppercase tracking-widest transition-all ${currentTab === 'profile' ? `text-${themeColor}-500` : 'text-slate-400 hover:text-slate-900'}`}>Profile</button>
            <div className="h-6 w-px bg-slate-100 hidden sm:block"></div>
            <button onClick={() => supabase.auth.signOut()} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {currentTab === 'profile' ? (
          <UserProfile />
        ) : isCustomer ? (
          <CustomerDashboard onJoinQueue={handleJoinQueue} activeToken={activeToken} isJoining={isJoining} />
        ) : (
          <AdminDashboard tokens={allTokens} onUpdateTokenStatus={handleUpdateTokenStatus} />
        )}
      </main>
    </div>
  );
};

export default App;
