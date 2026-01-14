
import React, { useState, useEffect } from 'react';
import { Business, Service, QueueToken } from '../types';
import { getWaitTimePrediction } from '../services/geminiService';
import { supabase } from '../lib/supabase';

interface Props {
  onJoinQueue: (business: Business, service: Service, notes?: string) => Promise<QueueToken | void>;
  activeToken: QueueToken | null;
  isJoining?: boolean;
}

const CustomerDashboard: React.FC<Props> = ({ onJoinQueue, activeToken, isJoining = false }) => {
  const [activeView, setActiveView] = useState<'explore' | 'support' | 'cancelled'>('explore');
  const [searchTerm, setSearchTerm] = useState('');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [bookingService, setBookingService] = useState<Service | null>(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [prediction, setPrediction] = useState<{ explanation: string; optimizedTip: string } | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [newListBusiness, setNewListBusiness] = useState({ name: '', category: 'Healthcare', location: '' });

  // Success Confirmation State
  const [lastBookedToken, setLastBookedToken] = useState<QueueToken | null>(null);
  const [showSuccessSummary, setShowSuccessSummary] = useState(false);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    setLoadingBusinesses(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data: busData } = await supabase
      .from('businesses')
      .select('*, services(*)');
    
    let likedIds: string[] = [];
    if (user) {
      const { data: likes } = await supabase
        .from('liked_places')
        .select('business_id')
        .eq('user_id', user.id);
      likedIds = likes?.map(l => l.business_id) || [];
    }

    if (busData) {
      setBusinesses(busData.map((b: any) => ({
        ...b,
        imageUrl: b.image_url,
        isLiked: likedIds.includes(b.id),
        services: b.services || []
      })));
    }
    setLoadingBusinesses(false);
  };

  const handleCancelToken = async () => {
    if (!activeToken) return;
    const { error } = await supabase
      .from('tokens')
      .update({ status: 'CANCELLED' })
      .eq('id', activeToken.id);

    if (!error) {
      setActiveView('cancelled');
    }
  };

  const handleConfirmBooking = async () => {
    if (selectedBusiness && bookingService) {
      const token = await onJoinQueue(selectedBusiness, bookingService, bookingNotes);
      if (token) {
        setLastBookedToken(token);
        setShowSuccessSummary(true);
        setBookingService(null);
      }
    }
  };

  const handleLike = async (e: React.MouseEvent, business: Business) => {
    e.stopPropagation();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (business.isLiked) {
      await supabase.from('liked_places').delete().match({ user_id: user.id, business_id: business.id });
    } else {
      await supabase.from('liked_places').insert({ user_id: user.id, business_id: business.id });
    }
    fetchBusinesses();
  };

  const handleListBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: business, error } = await supabase
      .from('businesses')
      .insert({ ...newListBusiness, owner_id: user.id })
      .select().single();

    if (business && !error) {
      await supabase.from('services').insert({
        business_id: business.id,
        name: 'General Service',
        description: 'Standard walk-in or appointment'
      });
      setShowListModal(false);
      fetchBusinesses();
    }
  };

  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startBooking = async (service: Service) => {
    setBookingService(service);
    setLoadingPrediction(true);
    const mockQueueLength = Math.floor(Math.random() * 12) + 1;
    const res = await getWaitTimePrediction(service.name, mockQueueLength, service.averageServiceTime);
    setPrediction(res);
    setLoadingPrediction(false);
  };

  if (activeView === 'cancelled') {
    return (
      <div className="max-w-4xl mx-auto p-6 md:py-20 animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white rounded-[4rem] p-12 text-center shadow-2xl border border-slate-100 space-y-12">
          <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
          </div>
          <div className="space-y-4">
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Plans change!</h2>
            <p className="text-slate-500 text-xl font-medium max-w-md mx-auto">Your booking has been cancelled. Where would you like to go instead?</p>
          </div>
          
          <div className="pt-10 border-t border-slate-100">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10">Recommended Alternatives</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {businesses.filter(b => b.isLiked).slice(0, 2).concat(businesses.slice(0, 2)).slice(0, 2).map(b => (
                <div 
                  key={b.id} 
                  onClick={() => { setSelectedBusiness(b); setActiveView('explore'); }}
                  className="group flex items-center gap-6 p-8 bg-slate-50 rounded-[3rem] hover:bg-white hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-orange-100 text-left"
                >
                   <img src={b.imageUrl} className="w-20 h-20 rounded-[1.5rem] object-cover shadow-lg" />
                   <div>
                      <h4 className="font-black text-slate-900 text-xl">{b.name}</h4>
                      <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{b.category}</p>
                   </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setActiveView('explore')}
              className="mt-16 px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black tracking-widest text-xs uppercase hover:bg-orange-500 transition-all shadow-xl"
            >
              BACK TO EXPLORE
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active View (While token is live)
  if (activeToken && !showSuccessSummary) {
    const business = businesses.find(b => b.id === activeToken.businessId);
    const service = business?.services.find(s => s.id === activeToken.serviceId);

    return (
      <div className="max-w-2xl mx-auto p-6 md:py-16 space-y-8 animate-in fade-in zoom-in-95 duration-700">
        <div className={`rounded-[3rem] p-10 shadow-2xl text-center relative overflow-hidden transition-all duration-1000 ${
          activeToken.status === 'WAITING' ? 'bg-orange-500 shadow-orange-200' : 
          activeToken.status === 'SERVING' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-slate-900'
        } text-white`}>
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
          </div>
          
          <div className="relative z-10">
            <div className="mb-6">
              <span className="px-5 py-2 bg-white/20 backdrop-blur-lg rounded-full text-xs font-black uppercase tracking-[0.2em]">
                {activeToken.status === 'WAITING' ? 'Remote Queue Active' : 
                 activeToken.status === 'SERVING' ? 'Your Turn Now!' : 'Session Ended'}
              </span>
            </div>
            <h2 className="text-xl font-bold mb-2 opacity-80 uppercase tracking-widest">Token ID</h2>
            <div className="text-9xl font-black mb-6 tracking-tighter drop-shadow-2xl">{activeToken.tokenNumber}</div>
            
            <div className="bg-white/10 rounded-[2.5rem] p-8 border border-white/10 backdrop-blur-md mb-8">
              <h3 className="text-3xl font-black tracking-tight">{business?.name || 'Loading...'}</h3>
              <p className="text-lg font-bold opacity-70 mt-1">{service?.name}</p>
            </div>
            
            {activeToken.status === 'WAITING' && (
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl text-orange-600 shadow-xl">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Queue Position</p>
                  <p className="text-4xl font-black">#{activeToken.position}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl text-orange-600 shadow-xl">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Est. Wait</p>
                  <p className="text-4xl font-black">~{activeToken.position * (service?.averageServiceTime || 10)}m</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={handleCancelToken}
          className="w-full py-7 rounded-3xl text-slate-400 font-black tracking-[0.3em] hover:text-red-500 hover:bg-red-50 transition-all uppercase text-xs"
        >
          Cancel Booking
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:py-12 animate-in fade-in duration-700">
      {/* SUCCESS SUMMARY MODAL */}
      {showSuccessSummary && lastBookedToken && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-[4rem] p-12 max-w-lg w-full shadow-2xl space-y-10 animate-in zoom-in-95 duration-500 text-center">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>
              </div>
              <div>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Booking Success!</h3>
                <p className="text-slate-500 font-bold">You're officially in the queue.</p>
              </div>
              
              <div className="bg-slate-50 rounded-[3rem] p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                   <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Business</span>
                   <span className="font-black text-slate-900">{businesses.find(b => b.id === lastBookedToken.businessId)?.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                   <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Token ID</span>
                   <span className="text-2xl font-black text-orange-500">{lastBookedToken.tokenNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Wait Time</span>
                   <span className="font-black text-slate-900">~{lastBookedToken.position * 15} mins</span>
                </div>
              </div>

              <button 
                onClick={() => setShowSuccessSummary(false)}
                className="w-full bg-slate-900 text-white py-7 rounded-[2.5rem] font-black text-xl shadow-xl hover:bg-orange-500 transition-all"
              >
                GO TO DASHBOARD
              </button>
           </div>
        </div>
      )}

      {/* Main View Logic */}
      <div className="mb-10 flex flex-wrap gap-4 pb-4 scrollbar-hide">
        <button 
          onClick={() => setActiveView('explore')}
          className={`px-8 py-3 rounded-2xl text-sm font-black transition-all ${activeView === 'explore' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white border-2 border-slate-100 text-slate-400 hover:text-slate-900'}`}
        >
          EXPLORE SERVICES
        </button>
        <button 
          onClick={() => setActiveView('support')}
          className={`px-8 py-3 rounded-2xl text-sm font-black transition-all ${activeView === 'support' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white border-2 border-slate-100 text-slate-400 hover:text-slate-900'}`}
        >
          HELP & SUPPORT
        </button>
        <button 
          onClick={() => setShowListModal(true)}
          className="px-8 py-3 rounded-2xl text-sm font-black bg-slate-900 text-white hover:bg-emerald-600 transition-all ml-auto"
        >
          + LIST PROPERTY
        </button>
      </div>

      {activeView === 'explore' ? (
        <>
          {!selectedBusiness ? (
            <>
              <header className="mb-12">
                <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">Explore Services</h1>
                <p className="text-slate-500 text-xl font-medium">Remote Bookings for Hospitals, Hotels & More.</p>
              </header>

              <div className="relative mb-12 group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <svg className="w-7 h-7 text-slate-400 group-focus-within:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Search health, hotels, banks..." 
                  className="w-full pl-16 pr-6 py-7 rounded-[2.5rem] border-none ring-2 ring-slate-100 focus:ring-4 focus:ring-orange-500/10 bg-white shadow-xl shadow-slate-200/40 transition-all text-xl font-semibold placeholder:text-slate-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {loadingBusinesses ? (
                <div className="py-20 text-center">
                  <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {filteredBusinesses.map(business => (
                    <div 
                      key={business.id}
                      onClick={() => setSelectedBusiness(business)}
                      className="group bg-white rounded-[3rem] overflow-hidden border border-slate-100 hover:shadow-2xl hover:-translate-y-3 transition-all cursor-pointer relative"
                    >
                      <div className="relative h-64 overflow-hidden">
                        <img src={business.imageUrl} alt={business.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                        <button 
                          onClick={(e) => handleLike(e, business)}
                          className={`absolute top-6 right-6 w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${business.isLiked ? 'bg-rose-500 text-white shadow-lg' : 'bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-rose-500'}`}
                        >
                          <svg className="w-6 h-6" fill={business.isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                        </button>
                        <div className="absolute top-6 left-6">
                          <span className="px-4 py-2 bg-white text-slate-900 text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg">{business.category}</span>
                        </div>
                        <div className="absolute bottom-6 left-6">
                          <p className="text-white font-black text-2xl tracking-tight">{business.name}</p>
                          <p className="text-white/80 text-xs font-bold mt-1 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                            {business.location}
                          </p>
                        </div>
                      </div>
                      <div className="p-8">
                        <span className="text-sm font-black text-emerald-500 tracking-tight flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                           Queue Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-20">
              <button 
                onClick={() => setSelectedBusiness(null)} 
                className="flex items-center gap-3 text-slate-400 hover:text-orange-500 font-black transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-50 flex items-center justify-center group-hover:border-orange-100 group-hover:bg-orange-50 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                </div>
                GO BACK
              </button>
              
              <div className="bg-white rounded-[4rem] overflow-hidden shadow-2xl border border-slate-100">
                <div className="relative h-[30rem]">
                  <img src={selectedBusiness.imageUrl} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent"></div>
                  <div className="absolute bottom-12 left-12 right-12">
                    <span className="px-5 py-2 bg-orange-500 text-white text-[10px] font-black rounded-full uppercase tracking-[0.2em] mb-4 inline-block shadow-xl shadow-orange-500/20">PARTNER BUSINESS</span>
                    <h2 className="text-6xl font-black text-slate-900 tracking-tighter mb-4">{selectedBusiness.name}</h2>
                    <p className="text-slate-500 text-xl font-medium flex items-center gap-2">
                      <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                      {selectedBusiness.location}
                    </p>
                  </div>
                </div>

                <div className="px-12 pb-16 pt-6">
                  <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-4">
                    Services Available
                    <span className="h-1 flex-grow bg-slate-50 rounded-full"></span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {selectedBusiness.services.map(service => (
                      <div 
                        key={service.id}
                        className="group relative border-2 border-slate-50 rounded-[2.5rem] p-8 hover:border-orange-500 hover:bg-orange-50/20 transition-all cursor-pointer shadow-sm hover:shadow-xl"
                        onClick={() => startBooking(service)}
                      >
                        <h4 className="text-2xl font-black text-slate-900 mb-2">{service.name}</h4>
                        <p className="text-slate-500 font-medium leading-relaxed">{service.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="max-w-3xl mx-auto space-y-12 animate-in slide-in-from-right-10 duration-700">
           <header>
             <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">How can we help?</h2>
             <p className="text-slate-500 text-xl font-medium">Submit your inquiry and our team will get back to you shortly.</p>
           </header>
        </div>
      )}

      {/* Booking Drawer Modal */}
      {bookingService && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
           <div className="bg-white max-w-xl w-full rounded-[4rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-20 duration-500">
            <div className="p-12 space-y-10">
              <div className="flex justify-between items-center">
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Confirm Entry</h3>
                <button onClick={() => setBookingService(null)} className="w-14 h-14 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl flex items-center justify-center transition-all">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              {loadingPrediction ? (
                <div className="py-12 text-center space-y-4">
                   <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                   <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">AI Analyzing Queue...</p>
                </div>
              ) : prediction ? (
                <div className="space-y-8">
                  <div className="bg-orange-500 text-white rounded-[2.5rem] p-8">
                    <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-4">AI Prediction</p>
                    <p className="text-xl font-bold leading-tight">{prediction.explanation}</p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Notes for staff (Optional)</label>
                    <textarea 
                      rows={3}
                      className="w-full px-8 py-6 rounded-[2.5rem] border-none ring-2 ring-slate-100 focus:ring-4 focus:ring-orange-500/20 bg-slate-50 transition-all text-lg font-semibold"
                      placeholder="e.g. Regular health checkup"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={handleConfirmBooking}
                    disabled={isJoining}
                    className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black text-2xl shadow-2xl hover:bg-orange-500 transition-all transform active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50"
                  >
                    {isJoining ? 'RESERVING...' : 'RESERVE NOW'}
                  </button>
                </div>
              ) : null}
            </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
