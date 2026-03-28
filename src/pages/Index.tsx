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

type Tab = 'game' | 'shop' | 'tasks' | 'referral' | 'profile';

const AppContent: React.FC = () => {
  const [tab, setTab] = useState<Tab>('game');
  const { isAdmin } = useGame();

  const renderScreen = () => {
    switch (tab) {
      case 'game': return <GameScreen />;
      case 'shop': return <ShopScreen />;
      case 'tasks': return <TasksScreen />;
      case 'referral': return <ReferralScreen />;
      case 'profile': return isAdmin ? (
        <div>
          <ProfileScreen />
          <div className="px-4 mb-20">
            <AdminScreen />
          </div>
        </div>
      ) : <ProfileScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="pt-12 pb-20 max-w-lg mx-auto">
        {renderScreen()}
      </main>
      <BottomNav active={tab} onChange={setTab} />
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
