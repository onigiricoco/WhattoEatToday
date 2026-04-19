import React, { useState } from 'react';
import { Settings2, Clock, BarChart, UtensilsCrossed } from 'lucide-react';
import { UserPreferences } from '../types';
import { cn } from '../lib/utils';

interface PreferencesManagerProps {
  preferences: UserPreferences;
  onChange: (prefs: UserPreferences) => void;
  t: any;
}

export default function PreferencesManager({ preferences, onChange, t }: PreferencesManagerProps) {
  const [dishInput, setDishInput] = useState('');

  const addDish = () => {
    if (!dishInput.trim()) return;
    onChange({
      ...preferences,
      usualDishes: [...preferences.usualDishes, dishInput.trim()]
    });
    setDishInput('');
  };

  const removeDish = (dish: string) => {
    onChange({
      ...preferences,
      usualDishes: preferences.usualDishes.filter(d => d !== dish)
    });
  };

  return (
    <div className="card h-full">
      <div className="card-title">
        <span>{t.personalizedPrefs}</span>
        <Settings2 size={18} className="text-bento-accent" />
      </div>

      <div className="space-y-4">
        {/* Usual Dishes */}
        <div>
          <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 flex items-center gap-1.5">
            <UtensilsCrossed size={12} /> {t.tasteProfile}
          </label>
          <div className="flex gap-1.5 mb-2">
            <input
              type="text"
              placeholder={t.favoriteDishPlaceholder}
              value={dishInput}
              onChange={(e) => setDishInput(e.target.value)}
              className="input-field flex-1"
            />
            <button onClick={addDish} className="bg-bento-border text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer">{t.add}</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {preferences.usualDishes.map((dish, idx) => (
              <span key={idx} className="bg-gray-100 text-bento-border px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
                {dish}
                <button onClick={() => removeDish(dish)} className="hover:text-red-500 text-gray-400 cursor-pointer">×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Time */}
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 flex items-center gap-1.5">
              <Clock size={12} /> {t.time}
            </label>
            <div className="flex bg-bento-bg rounded-xl p-0.5">
              {(['quick', 'medium', 'elaborate'] as const).map((tValue) => (
                <button
                  key={tValue}
                  onClick={() => onChange({ ...preferences, cookingTimePreference: tValue })}
                  className={cn(
                    "flex-1 py-1 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer",
                    preferences.cookingTimePreference === tValue ? "bg-white shadow-sm text-bento-accent" : "text-gray-400"
                  )}
                >
                  {tValue === 'quick' ? t.quick : tValue === 'medium' ? t.avgTime : t.elaborate}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 flex items-center gap-1.5">
              <BarChart size={12} /> {t.difficulty}
            </label>
            <div className="flex bg-bento-bg rounded-xl p-0.5">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => onChange({ ...preferences, difficultyPreference: d })}
                  className={cn(
                    "flex-1 py-1 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer",
                    preferences.difficultyPreference === d ? "bg-white shadow-sm text-bento-accent" : "text-gray-400"
                  )}
                >
                  {d === 'easy' ? t.simple : d === 'medium' ? t.middle : t.difficult}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
