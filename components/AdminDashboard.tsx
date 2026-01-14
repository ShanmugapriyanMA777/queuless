
import React, { useState, useEffect } from 'react';
import { QueueToken, Business, Service, Inquiry } from '../types';
import { supabase } from '../lib/supabase';

interface AdminDashboardProps {
  tokens: QueueToken[];
  onUpdateTokenStatus: (tokenId: string, status: QueueToken['status']) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ tokens, onUpdateTokenStatus }) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'logs' | 'inbox'>('queue');
  const [business, setBusiness] = useState<Business | null>(null);
  const [isBusinessOpen, setIsBusinessOpen] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const fetchOwnerData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: busData } = await supabase
      .from('businesses')
      .select('*, services(*)')
      .eq('owner_id', user.id)
      .single();

    if (busData) {
      setBusiness({
        ...busData,
        imageUrl: busData.image_url,
        services: busData.services || []
      });
      fetchLogs(busData.id);
    }
    setLoading(false);
  };

  const fetchLogs = async (businessId: string) => {
    const { data } = await supabase
      .from('business_logs')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) setLogs(data);
  };

  useEffect(() => {
    if (activeTab === 'logs' && business) fetchLogs(business.id);
  }, [activeTab]);

  const waitingTokens = tokens.filter(t => t.businessId === business?.id && t.status === 'WAITING');
  const servingToken = tokens.find(t => t.businessId === business?.id && t.status === 'SERVING');

  const handleCallNext = () => {
    if (waitingTokens.length > 0) {
      const next = waitingTokens[0];
      if (servingToken) onUpdateTokenStatus(servingToken.id, 'COMPLETED');
      onUpdateTokenStatus(next.id, 'SERVING');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Accessing Portal...</p>
      </div>
    );
  }

  if (!business) return (
    <div className="max-w-2xl mx-auto p-12 text-center text-slate-400 font-bold space-y-4">
      <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
         <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
      </div>
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">No Listed Property Found</h2>
      <p>Use the Customer Portal to list your first Hospital or Hotel.</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-10 animate-in fade-in duration-500 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block ${isBusinessOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
            {isBusinessOpen ? 'QUEUE SYSTEM ONLINE' : 'SYSTEM PAUSED'}
          </span>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">{business.name}</h1>
          <p className="text-slate-500 font-bold text-lg">{business.location}</p>
        </div>
        <button 
          onClick={() => setIsBusinessOpen(!isBusinessOpen)}
          className={`px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all shadow-xl ${isBusinessOpen ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}
        >
          {isBusinessOpen ? 'SYSTEM ACTIVE' : 'RESUME SYSTEM'}
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button onClick={() => setActiveTab('queue')} className={`px-6 py-4 font-black text-sm transition-all border-b-4 ${activeTab === 'queue' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>LIVE QUEUE</button>
        <button onClick={() => setActiveTab('logs')} className={`px-6 py-4 font-black text-sm transition-all border-b-4 ${activeTab === 'logs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>AUDIT LOGS</button>
      </div>

      {activeTab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-50">
              <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Upcoming Appointments</h2>
              <div className="space-y-4">
                {waitingTokens.map((token, index) => (
                  <div key={token.id} className="flex items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] border-2 border-transparent hover:border-indigo-500 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center font-black text-2xl text-indigo-600 shadow-sm border border-slate-100">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-black text-2xl text-slate-900 tracking-tight">{token.customer_name}</h4>
                        <p className="text-indigo-600 font-bold uppercase text-xs tracking-widest">Token ID: {token.tokenNumber}</p>
                      </div>
                    </div>
                    <button onClick={() => onUpdateTokenStatus(token.id, 'SERVING')} className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg">CALL PATIENT/GUEST</button>
                  </div>
                ))}
                {waitingTokens.length === 0 && <div className="text-center py-20 text-slate-300 italic font-bold">The waiting room is currently empty.</div>}
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 text-white rounded-[3.5rem] p-10 shadow-2xl h-fit sticky top-32">
            <h2 className="text-2xl font-black mb-8">Currently Serving</h2>
            {servingToken ? (
              <div className="text-center space-y-6 animate-in zoom-in-95 duration-300">
                <p className="text-8xl font-black tracking-tighter drop-shadow-2xl">{servingToken.tokenNumber}</p>
                <div className="bg-white/10 rounded-[2.5rem] p-8 backdrop-blur-md border border-white/20">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Patient / Guest Name</p>
                  <p className="text-3xl font-black">{servingToken.customer_name}</p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">In Session</span>
                  </div>
                </div>
                <button onClick={() => onUpdateTokenStatus(servingToken.id, 'COMPLETED')} className="w-full py-7 bg-white text-indigo-600 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-emerald-50 transition-all">FINISH SESSION</button>
              </div>
            ) : (
              <div className="text-center py-20 opacity-40 font-black italic text-2xl border-4 border-dashed border-white/10 rounded-[2.5rem]">Station Idle</div>
            )}
            <button onClick={handleCallNext} disabled={waitingTokens.length === 0} className="w-full mt-10 py-7 bg-slate-900 text-white rounded-[2rem] font-black text-xl disabled:opacity-50 transition-all shadow-2xl">AUTO-CALL NEXT</button>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-50 animate-in slide-in-from-bottom-4 duration-500">
           <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Audit Trail & Logs</h2>
           <div className="space-y-4">
              {logs.length === 0 ? (
                <p className="text-center py-10 text-slate-300">No logs recorded yet.</p>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="flex items-center gap-6 p-6 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors rounded-2xl">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/></svg>
                    </div>
                    <div className="flex-grow">
                      <p className="font-bold text-slate-900 text-lg">{log.description}</p>
                      <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                    {log.metadata?.customer_name && (
                      <div className="px-4 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase">
                        {log.metadata.customer_name}
                      </div>
                    )}
                  </div>
                ))
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
