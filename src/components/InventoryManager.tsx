import React, { useState } from 'react';
import { Plus, Trash2, Refrigerator, Snowflake, Archive } from 'lucide-react';
import { Ingredient, IngredientCategory } from '../types';
import { cn } from '../lib/utils';

interface InventoryManagerProps {
  ingredients: Ingredient[];
  onAdd: (ingredient: Omit<Ingredient, 'id' | 'addedAt' | 'uid'>) => void;
  onRemove: (id: string) => void;
  t: any;
  lang: string;
}

export default function InventoryManager({ ingredients, onAdd, onRemove, t, lang }: InventoryManagerProps) {
  const [activeTab, setActiveTab] = useState<IngredientCategory>('冷藏');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');

  const filteredIngredients = ingredients.filter(i => i.category === activeTab);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    onAdd({
      name: newItemName,
      quantity: newItemQty || (lang === 'zh' ? '1份' : '1 unit'),
      category: activeTab,
    });
    setNewItemName('');
    setNewItemQty('');
  };

  const tabs: { type: IngredientCategory; icon: any; label: string }[] = [
    { type: '冷藏', icon: Refrigerator, label: t.chilled },
    { type: '冷冻', icon: Snowflake, label: t.frozen },
    { type: '储藏', icon: Archive, label: t.pantry },
  ];

  return (
    <div className="card h-full">
      <div className="card-title">
        <span>{t.inventory}</span>
        <Archive size={18} className="text-bento-accent" />
      </div>

      <div className="flex gap-1 mb-4 bg-bento-bg p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.type}
            onClick={() => setActiveTab(tab.type)}
            className={cn(
               "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all text-[10px] font-black uppercase tracking-tight cursor-pointer",
              activeTab === tab.type 
                ? "bg-white text-bento-border shadow-sm" 
                : "text-gray-400 hover:text-bento-border"
            )}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder={t.ingredientPlaceholder}
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="input-field flex-1"
        />
        <button type="submit" className="bg-bento-border text-white p-2 rounded-xl flex items-center justify-center cursor-pointer hover:bg-black transition-all">
          <Plus size={16} />
        </button>
      </form>

      <div className="space-y-2 flex-1 overflow-y-auto max-h-[120px] pr-1 custom-scrollbar">
        {filteredIngredients.length === 0 ? (
          <p className="text-center text-gray-400 py-4 text-[10px] uppercase font-bold tracking-widest">{t.emptySpace}</p>
        ) : (
          filteredIngredients.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0 group">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold">{item.name}</span>
                <span className="text-[10px] text-gray-400 font-medium">{item.quantity}</span>
              </div>
              <button 
                onClick={() => onRemove(item.id)}
                className="text-gray-300 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all cursor-pointer p-1"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
