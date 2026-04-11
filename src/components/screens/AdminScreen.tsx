import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Shield, Star, Ban, Check, X, Plus, Trash2, Users, BarChart3, Coins, ListTodo, Megaphone, Search } from 'lucide-react';
import { toast } from 'sonner';

type AdminTab = 'stats' | 'users' | 'withdraws' | 'tasks' | 'search';

const AdminScreen: React.FC = () => {
  const {
    allUsers, adminGiveStars, adminGiveCoins, adminRemoveStars, adminRemoveCoins,
    withdrawRequests, updateWithdrawRequest,
    adminTasks, addAdminTask, removeAdminTask,
    adStats,
  } = useGame();
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [giveUserId, setGiveUserId] = useState('');
  const [giveAmount, setGiveAmount] = useState('');
  const [giveType, setGiveType] = useState<'stars' | 'coins'>('stars');
  const [giveAction, setGiveAction] = useState<'add' | 'remove'>('add');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // New task form
  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [newTaskReward, setNewTaskReward] = useState('');
  const [newTaskRewardType, setNewTaskRewardType] = useState<'stars' | 'coins'>('stars');
  const [newTaskIcon, setNewTaskIcon] = useState('📢');
  const [newTaskChannelUrl, setNewTaskChannelUrl] = useState('');

  // Search
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleSearch = async () => {
    if (!searchId.trim()) { toast.error('Telegram ID kiriting!'); return; }
    setSearchLoading(true);
    setSearchError('');
    setSearchResult(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/game-api?action=search_user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` },
        body: JSON.stringify({ telegram_id: parseInt(searchId) }),
      });
      const data = await res.json();
      if (!res.ok) { setSearchError(data.error || 'Topilmadi'); return; }
      setSearchResult(data);
    } catch { setSearchError('Xatolik yuz berdi'); } finally { setSearchLoading(false); }
  };

  const handleGive = () => {
    const uid = parseInt(giveUserId);
    const amt = parseInt(giveAmount);
    if (!uid || !amt || amt <= 0) { toast.error("Ma'lumot to'liq emas!"); return; }
    if (giveAction === 'add') {
      if (giveType === 'stars') { adminGiveStars(uid, amt); toast.success(`${amt} ⭐ berildi!`); }
      else { adminGiveCoins(uid, amt); toast.success(`${amt} 🪙 berildi!`); }
    } else {
      if (giveType === 'stars') { adminRemoveStars(uid, amt); toast.success(`${amt} ⭐ ayirildi!`); }
      else { adminRemoveCoins(uid, amt); toast.success(`${amt} 🪙 ayirildi!`); }
    }
    setGiveUserId(''); setGiveAmount('');
  };

  const handleAddTask = () => {
    if (!newTaskLabel || !newTaskReward || !newTaskChannelUrl) { toast.error("Barcha maydonlarni to'ldiring!"); return; }
    addAdminTask({ label: newTaskLabel, reward: parseInt(newTaskReward), rewardType: newTaskRewardType, icon: newTaskIcon, channelUrl: newTaskChannelUrl });
    toast.success('Vazifa qo\'shildi!');
    setNewTaskLabel(''); setNewTaskReward(''); setNewTaskChannelUrl('');
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-blue-500/20 text-blue-400',
    paid: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
  };

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: 'stats', label: 'Statistika', icon: <BarChart3 size={14} /> },
    { key: 'search', label: 'Qidiruv', icon: <Search size={14} /> },
    { key: 'users', label: 'Balans', icon: <Coins size={14} /> },
    { key: 'withdraws', label: "So'rovlar", icon: <Users size={14} /> },
    { key: 'tasks', label: 'Vazifalar', icon: <ListTodo size={14} /> },
  ];

  const pendingCount = withdrawRequests.filter(r => r.status === 'pending').length;
  const approvedCount = withdrawRequests.filter(r => r.status === 'approved').length;
  const paidCount = withdrawRequests.filter(r => r.status === 'paid').length;
  const rejectedCount = withdrawRequests.filter(r => r.status === 'rejected').length;
  const totalStars = allUsers.reduce((s: number, u: any) => s + u.stars, 0);
  const totalCoins = allUsers.reduce((s: number, u: any) => s + u.coins, 0);

  return (
    <div className="px-4 pt-2 pb-4">
      <h2 className="font-display text-xl text-foreground mb-3 flex items-center gap-2">
        <Shield className="text-accent" size={24} /> Admin Panel
      </h2>

      <div className="flex gap-1 mb-4 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${activeTab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="game-card text-center">
              <p className="font-display text-xl text-primary">{allUsers.length}</p>
              <p className="text-[10px] text-muted-foreground">Foydalanuvchilar</p>
            </div>
            <div className="game-card text-center">
              <p className="font-display text-xl text-accent">{withdrawRequests.length}</p>
              <p className="text-[10px] text-muted-foreground">Jami so'rovlar</p>
            </div>
            <div className="game-card text-center">
              <p className="font-display text-lg text-star-gold">{totalStars.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Jami yulduzlar</p>
            </div>
            <div className="game-card text-center">
              <p className="font-display text-lg text-coin-orange">{totalCoins.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Jami coinlar</p>
            </div>
          </div>
          <div className="game-card">
            <h4 className="font-bold text-sm text-foreground mb-2">So'rovlar holati</h4>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div><p className="text-sm font-bold text-yellow-400">{pendingCount}</p><p className="text-[9px] text-muted-foreground">Kutilmoqda</p></div>
              <div><p className="text-sm font-bold text-blue-400">{approvedCount}</p><p className="text-[9px] text-muted-foreground">Tasdiqlangan</p></div>
              <div><p className="text-sm font-bold text-green-400">{paidCount}</p><p className="text-[9px] text-muted-foreground">To'langan</p></div>
              <div><p className="text-sm font-bold text-red-400">{rejectedCount}</p><p className="text-[9px] text-muted-foreground">Rad etilgan</p></div>
            </div>
          </div>
          <div className="game-card">
            <h4 className="font-bold text-sm text-foreground mb-2">📺 Reklama statistikasi</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <p className="font-display text-lg text-accent">{adStats.total_ads.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Jami ko'rilgan</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <p className="font-display text-lg text-primary">{adStats.today_ads.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Bugun ko'rilgan</p>
              </div>
            </div>
          </div>
          <div className="game-card">
            <h4 className="font-bold text-sm text-foreground mb-2">Vazifalar</h4>
            <p className="text-sm text-muted-foreground"><Megaphone size={14} className="inline mr-1" />{adminTasks.length} ta kanal/vazifa qo'shilgan</p>
          </div>
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="space-y-3">
          <div className="game-card">
            <h4 className="font-bold text-sm text-foreground mb-3 flex items-center gap-1">
              <Search size={14} className="text-accent" /> Foydalanuvchi qidirish
            </h4>
            <div className="flex gap-2 mb-3">
              <input type="number" value={searchId} onChange={e => setSearchId(e.target.value)}
                placeholder="Telegram ID kiriting"
                className="flex-1 bg-muted text-foreground rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              <button onClick={handleSearch} disabled={searchLoading}
                className="btn-gold px-4 py-2 text-sm font-bold rounded-xl">
                {searchLoading ? '...' : '🔍'}
              </button>
            </div>
            {searchError && <p className="text-sm text-destructive text-center">{searchError}</p>}
          </div>

          {searchResult && (
            <>
              {/* User Info */}
              <div className="game-card">
                <h4 className="font-bold text-sm text-foreground mb-2">👤 Foydalanuvchi ma'lumotlari</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">ID:</span><span className="text-foreground font-mono text-[10px]">{searchResult.user.id}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Telegram ID:</span><span className="text-foreground">{searchResult.user.telegram_id}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Username:</span><span className="text-foreground">@{searchResult.user.username || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Ism:</span><span className="text-foreground">{searchResult.user.first_name || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">⭐ Yulduzlar:</span><span className="text-star-gold font-bold">{searchResult.user.stars?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">🪙 Coinlar:</span><span className="text-coin-orange font-bold">{searchResult.user.coins?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">❤️ Jonlar:</span><span className="text-foreground">{searchResult.user.lives}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">🎨 Skin:</span><span className="text-foreground">{searchResult.user.current_skin}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">👥 Referallar:</span><span className="text-foreground font-bold">{searchResult.user.referrals} (haqiqiy: {searchResult.referral_count})</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">🔗 Referal kodi:</span><span className="text-foreground font-mono text-[10px]">{searchResult.user.referral_code}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">📅 Ro'yxatdan:</span><span className="text-foreground">{new Date(searchResult.user.created_at).toLocaleDateString('uz')}</span></div>
                </div>
              </div>

              {/* Referral List */}
              <div className="game-card">
                <h4 className="font-bold text-sm text-foreground mb-2">👥 Chaqirgan referallar ({searchResult.referral_count})</h4>
                {searchResult.referrals?.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">Referallar yo'q</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {searchResult.referrals?.map((ref: any, i: number) => (
                      <div key={ref.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-2 text-xs">
                        <div>
                          <span className="text-muted-foreground mr-1">{i + 1}.</span>
                          <span className="text-foreground font-bold">{ref.referred_user?.first_name || ref.referred_user?.username || '?'}</span>
                          {ref.referred_user?.telegram_id && (
                            <span className="text-muted-foreground ml-1">({ref.referred_user.telegram_id})</span>
                          )}
                        </div>
                        <span className="text-muted-foreground text-[10px]">{new Date(ref.created_at).toLocaleDateString('uz')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Daily Tasks */}
              {searchResult.daily_tasks?.length > 0 && (
                <div className="game-card">
                  <h4 className="font-bold text-sm text-foreground mb-2">📋 Kunlik vazifalar tarixi</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {searchResult.daily_tasks.map((t: any) => (
                      <div key={t.id} className="flex justify-between text-xs bg-muted/50 rounded p-1.5">
                        <span className="text-foreground">{t.date}</span>
                        <span className={t.reward_claimed ? 'text-green-400' : 'text-muted-foreground'}>
                          {t.reward_claimed ? '✅ Olgan' : '⏳'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Withdrawals */}
              {searchResult.withdrawals?.length > 0 && (
                <div className="game-card">
                  <h4 className="font-bold text-sm text-foreground mb-2">💳 Pul yechish tarixi</h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {searchResult.withdrawals.map((w: any) => (
                      <div key={w.id} className="flex justify-between items-center text-xs bg-muted/50 rounded-lg p-2">
                        <div>
                          <p className="text-foreground font-bold">{w.amount?.toLocaleString()} so'm</p>
                          <p className="text-[10px] text-muted-foreground">{w.card_type} · {w.card_number}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[w.status] || ''}`}>{w.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Users/Balance Tab */}
      {activeTab === 'users' && (
        <div className="game-card">
          <h4 className="font-bold text-sm text-foreground mb-3 flex items-center gap-1">
            <Coins size={14} className="text-coin-orange" /> Balans boshqaruvi
          </h4>
          <div className="flex gap-2 mb-2">
            <button onClick={() => setGiveAction('add')} className={`flex-1 text-xs py-1.5 rounded-lg font-bold ${giveAction === 'add' ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>+ Qo'shish</button>
            <button onClick={() => setGiveAction('remove')} className={`flex-1 text-xs py-1.5 rounded-lg font-bold ${giveAction === 'remove' ? 'bg-red-500/20 text-red-400' : 'bg-muted text-muted-foreground'}`}>− Ayirish</button>
          </div>
          <div className="flex gap-2 mb-2">
            <button onClick={() => setGiveType('stars')} className={`flex-1 text-xs py-1.5 rounded-lg font-bold ${giveType === 'stars' ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>⭐ Yulduz</button>
            <button onClick={() => setGiveType('coins')} className={`flex-1 text-xs py-1.5 rounded-lg font-bold ${giveType === 'coins' ? 'bg-coin-orange/20 text-coin-orange' : 'bg-muted text-muted-foreground'}`}>🪙 Coin</button>
          </div>
          <input type="number" value={giveUserId} onChange={e => setGiveUserId(e.target.value)} placeholder="Telegram ID"
            className="w-full bg-muted text-foreground rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:ring-2 focus:ring-primary" />
          <input type="number" value={giveAmount} onChange={e => setGiveAmount(e.target.value)} placeholder="Miqdor"
            className="w-full bg-muted text-foreground rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:ring-2 focus:ring-primary" />
          <button onClick={handleGive} className={`w-full text-sm py-2 rounded-xl font-bold ${giveAction === 'add' ? 'btn-gold' : 'bg-red-500/20 text-red-400'}`}>
            {giveAction === 'add' ? `${giveType === 'stars' ? '⭐' : '🪙'} Berish` : `${giveType === 'stars' ? '⭐' : '🪙'} Ayirish`}
          </button>
        </div>
      )}

      {/* Withdraw Requests Tab */}
      {activeTab === 'withdraws' && (
        <div className="game-card">
          <h4 className="font-bold text-sm text-foreground mb-3">Pul yechish so'rovlari</h4>
          {withdrawRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">So'rovlar yo'q</p>
          ) : (
            <div className="flex flex-col gap-3">
              {withdrawRequests.map(req => (
                <div key={req.id} className="bg-muted/50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-bold text-foreground">{req.amount.toLocaleString()} so'm</p>
                      <p className="text-[10px] text-muted-foreground">{req.card_type.toUpperCase()} · {req.card_number.replace(/(\d{4})/g, '$1 ').trim()}</p>
                      <p className="text-[10px] text-muted-foreground">ID: {req.user_id}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[req.status]}`}>{req.status}</span>
                  </div>
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => updateWithdrawRequest(req.id, 'approved')} className="flex-1 bg-blue-500/20 text-blue-400 text-xs py-1.5 rounded-lg font-bold flex items-center justify-center gap-1"><Check size={12} /> Tasdiqlash</button>
                      <button onClick={() => setRejectingId(req.id)} className="flex-1 bg-red-500/20 text-red-400 text-xs py-1.5 rounded-lg font-bold flex items-center justify-center gap-1"><X size={12} /> Rad etish</button>
                    </div>
                  )}
                  {req.status === 'approved' && (
                    <button onClick={() => updateWithdrawRequest(req.id, 'paid')} className="w-full bg-green-500/20 text-green-400 text-xs py-1.5 rounded-lg font-bold flex items-center justify-center gap-1"><Check size={12} /> To'landi</button>
                  )}
                  {req.status === 'rejected' && req.reason && <p className="text-xs text-destructive mt-1">Sabab: {req.reason}</p>}
                  {rejectingId === req.id && (
                    <div className="mt-2 flex gap-2">
                      <input type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Sabab..."
                        className="flex-1 bg-muted text-foreground rounded-lg px-2 py-1 text-xs outline-none" />
                      <button onClick={() => { updateWithdrawRequest(req.id, 'rejected', rejectReason); setRejectingId(null); setRejectReason(''); }}
                        className="bg-destructive text-destructive-foreground text-xs px-3 py-1 rounded-lg font-bold">Yuborish</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          <div className="game-card">
            <h4 className="font-bold text-sm text-foreground mb-3 flex items-center gap-1"><Plus size={14} className="text-accent" /> Yangi vazifa/kanal qo'shish</h4>
            <input type="text" value={newTaskLabel} onChange={e => setNewTaskLabel(e.target.value)} placeholder="Vazifa nomi"
              className="w-full bg-muted text-foreground rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:ring-2 focus:ring-primary" />
            <input type="text" value={newTaskChannelUrl} onChange={e => setNewTaskChannelUrl(e.target.value)} placeholder="Kanal URL"
              className="w-full bg-muted text-foreground rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:ring-2 focus:ring-primary" />
            <div className="flex gap-2 mb-2">
              <input type="number" value={newTaskReward} onChange={e => setNewTaskReward(e.target.value)} placeholder="Mukofot miqdori"
                className="flex-1 bg-muted text-foreground rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <select value={newTaskRewardType} onChange={e => setNewTaskRewardType(e.target.value as 'stars' | 'coins')}
                className="bg-muted text-foreground rounded-lg px-3 py-2 text-sm outline-none">
                <option value="stars">⭐ Yulduz</option>
                <option value="coins">🪙 Coin</option>
              </select>
            </div>
            <div className="flex gap-2 mb-3">
              {['📢', '📺', '🎮', '💰', '🎁', '🔔'].map(icon => (
                <button key={icon} onClick={() => setNewTaskIcon(icon)}
                  className={`text-lg p-1.5 rounded-lg ${newTaskIcon === icon ? 'bg-accent/20 ring-1 ring-accent' : 'bg-muted'}`}>{icon}</button>
              ))}
            </div>
            <button onClick={handleAddTask} className="btn-gold w-full text-sm"><Plus size={14} className="inline mr-1" /> Vazifa qo'shish</button>
          </div>
          <div className="game-card">
            <h4 className="font-bold text-sm text-foreground mb-3">Mavjud vazifalar</h4>
            {adminTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">Vazifalar yo'q</p>
            ) : (
              <div className="flex flex-col gap-2">
                {adminTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                    <span className="text-lg">{task.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{task.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{task.channelUrl}</p>
                      <p className="text-[10px] text-accent">+{task.reward} {task.rewardType === 'coins' ? '🪙' : '⭐'}</p>
                    </div>
                    <button onClick={() => { removeAdminTask(task.id); toast.success("Vazifa o'chirildi"); }} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminScreen;
