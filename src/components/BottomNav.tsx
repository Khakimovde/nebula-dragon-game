import React from 'react';
import { Gamepad2, ShoppingBag, ListChecks, Users, User } from 'lucide-react';

type Tab = 'game' | 'shop' | 'tasks' | 'referral' | 'profile';

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: 'game', icon: Gamepad2, label: "O'yin" },
  { id: 'shop', icon: ShoppingBag, label: 'Do\'kon' },
  { id: 'tasks', icon: ListChecks, label: 'Vazifa' },
  { id: 'referral', icon: Users, label: 'Referal' },
  { id: 'profile', icon: User, label: 'Profil' },
];

const BottomNav: React.FC<BottomNavProps> = ({ active, onChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-all duration-200 ${
              active === id ? 'tab-active scale-110' : 'text-muted-foreground'
            }`}
          >
            <Icon size={22} />
            <span className="text-[10px] font-bold">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
