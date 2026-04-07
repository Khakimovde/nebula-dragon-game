import React from 'react';
import { Gamepad2, ShoppingBag, ListChecks, Users, User, Trophy, Target } from 'lucide-react';

type Tab = 'game' | 'shop' | 'tasks' | 'wheel' | 'referral' | 'rating' | 'profile';

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: 'game', icon: Gamepad2, label: "O'yin" },
  { id: 'shop', icon: ShoppingBag, label: 'Do\'kon' },
  { id: 'tasks', icon: ListChecks, label: 'Vazifa' },
  { id: 'wheel', icon: Target, label: 'Wheel' },
  { id: 'referral', icon: Users, label: 'Referal' },
  { id: 'rating', icon: Trophy, label: 'Reyting' },
  { id: 'profile', icon: User, label: 'Profil' },
];

const BottomNav: React.FC<BottomNavProps> = ({ active, onChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg">
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex flex-col items-center gap-0 px-1.5 py-1 transition-all duration-200 ${
              active === id ? 'tab-active scale-105' : 'text-muted-foreground'
            }`}
          >
            <Icon size={18} />
            <span className="text-[8px] font-bold leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
