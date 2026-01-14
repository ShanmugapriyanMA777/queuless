
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Business, QueueToken } from '../types';

const UserProfile: React.FC = () => {
  const [likedPlaces, setLikedPlaces] = useState<Business[]>([]);
  const [visitedPlaces, setVisitedPlaces] = useState<QueueToken[]>([]);
  const [myListings, setMyListings] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Fetch Liked Places
    const { data: likes } = await supabase
      .from('liked_places')
      .select('business_id, businesses(*, services(*))')
      .eq('user_id', user.id);
    
    if (likes) {
      setLikedPlaces(likes.map((l: any) => ({
        ...l.businesses,
        imageUrl: l.businesses.image_url,
        services: l.businesses.services || []
      })));
    }

    // 2. Fetch Completed Queues (Visited)
    const { data: history } = await supabase
      .from('tokens')
      .select('*, businesses(name)')
      .eq('user_id', user.id)
      .eq('status', 'COMPLETED');
    
    if (history) {
      setVisitedPlaces(history.map((h: any) => ({
        ...h,
        business_name: h.businesses?.name
      })));
    }

    // 3. Fetch My Listings
    const { data: listings } = await supabase
      .from('businesses')
      .select('*, services(*)')
      .eq('owner_id', user.id);
    
    if (listings) {
      setMyListings(listings.map((l: any) => ({
        ...l,
        imageUrl: l.image_url,
        services: l.services || []
      })));
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-16 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header */}
      <header className="space-y-4">
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">My Dashboard</h1>
        <p className="text-slate-500 font-bold text-xl">Manage your activity across QueueLess.</p>
      </header>

      {/* Liked Places Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center">
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Saved Places</h2>
        </div>
        
        {likedPlaces.length === 0 ? (
          <div className="bg-slate-50 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold">You haven't saved any places yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {likedPlaces.map(place => (
              <div key={place.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50">
                <img src={place.imageUrl} className="w-full h-40 object-cover" />
                <div className="p-6">
                  <h3 className="text-xl font-black text-slate-900">{place.name}</h3>
                  <p className="text-sm text-slate-500 font-bold">{place.location}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Visited Places (History) */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-500 rounded-2xl flex items-center justify-center">
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Visit History</h2>
        </div>
        
        {visitedPlaces.length === 0 ? (
          <div className="bg-slate-50 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold">No completed visits found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visitedPlaces.map(token => (
              <div key={token.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm">
                <div>
                   <h4 className="font-black text-slate-900">{token.business_name}</h4>
                   <p className="text-xs text-slate-500 font-bold">Token {token.tokenNumber} • {new Date(token.joinedAt).toLocaleDateString()}</p>
                </div>
                <div className="bg-emerald-100 text-emerald-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Completed
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* My Listings Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center">
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">My Listings</h2>
        </div>
        
        {myListings.length === 0 ? (
          <div className="bg-slate-50 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold">You haven't listed any properties yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {myListings.map(listing => (
              <div key={listing.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="p-6">
                  <h3 className="text-xl font-black text-slate-900">{listing.name}</h3>
                  <p className="text-sm text-slate-500 font-bold mb-4">{listing.category}</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Active Queue</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default UserProfile;
