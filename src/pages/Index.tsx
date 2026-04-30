import React, { useState } from 'react';
import { GameProvider, useGame } from '@/contexts/GameContext';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import GameScreen from '@/components/screens/GameScreen';
import ShopScreen from '@/components/screens/ShopScreen';
import TasksScreen from '@/components/screens/TasksScreen';
import ReferralScreen from '@/components/screens/ReferralScreen';
import ProfileScreen from '@/components/screens/ProfileScreen';
import AdminScreen from '@/components/screens/AdminScreen';
import RatingScreen from '@/components/screens/RatingScreen';
import WheelScreen from '@/components/screens/WheelScreen';
import { Shield, ArrowLeft } from 'lucide-react';
import adminIcon from '@/assets/icon-admin.png';

type Tab = 'game' | 'shop' | 'tasks' | 'wheel' | 'referral' | 'rating' | 'profile';

const AppContent: React.FC = () => {
  const [tab, setTab] = useState<Tab>('game');
  const [showAdmin, setShowAdmin] = useState(false);
  const { isAdmin } = useGame();

  const renderScreen = () => {
    if (tab === 'profile' && isAdmin && showAdmin) {
      return (
        <div>
          <div className="px-4 pt-2">
            <button onClick={() => setShowAdmin(false)} className="flex items-center gap-2 text-primary font-bold mb-2">
              <ArrowLeft size={18} /> Profilga qaytish
            </button>
          </div>
          <AdminScreen />
        </div>
      );
    }

    switch (tab) {
      case 'game': return <GameScreen />;
      case 'shop': return <ShopScreen />;
      case 'tasks': return <TasksScreen />;
      case 'wheel': return <WheelScreen />;
      case 'referral': return <ReferralScreen />;
      case 'rating': return <RatingScreen />;
      case 'profile':
        return (
          <div>
            <ProfileScreen />
            {isAdmin && (
              <div className="px-4 mb-20">
                <button
                  onClick={() => setShowAdmin(true)}
                  className="btn-pink w-full flex items-center justify-center gap-3 text-base py-4"
                >
                  <img src={adminIcon} alt="" className="w-8 h-8" />
                  <Shield size={20} /> Admin panelga kirish
                </button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="pt-12 pb-20 max-w-lg mx-auto">
        {renderScreen()}
      </main>
      <BottomNav active={tab} onChange={(t) => { setShowAdmin(false); setTab(t); }} />
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
};

export default Index;
