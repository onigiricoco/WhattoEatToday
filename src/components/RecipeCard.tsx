import React from 'react';
import { Clock, ChefHat, ExternalLink, ShoppingBag, ListChecks } from 'lucide-react';
import { Recipe } from '../types';
import { motion } from 'motion/react';

interface RecipeCardProps {
  recipe: Recipe;
  t: any;
}

export default function RecipeCard({ recipe, t }: RecipeCardProps) {
  const imageSeed = (recipe as any).imageSeed || recipe.title;
  const displayImageUrl = recipe.imageUrl || `https://loremflickr.com/400/400/${encodeURIComponent(imageSeed)}`;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card h-full bg-[#FFFCEB] flex flex-col"
    >
      <div className="card-title">
        <span>{t.recToday}</span>
        <ChefHat size={18} className="text-bento-accent" />
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
        <div className="md:w-1/3 flex flex-col gap-4">
          <div className="aspect-square bg-white border-2 border-bento-border rounded-2xl overflow-hidden relative group">
             <img 
               src={displayImageUrl} 
               alt={recipe.title} 
               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
               referrerPolicy="no-referrer"
             />
             <div className="absolute bottom-2 left-2 flex gap-1">
                <span className="bg-white border border-bento-border px-1.5 py-0.5 rounded text-[8px] font-black uppercase">{recipe.cookingTime}M</span>
                <span className="bg-white border border-bento-border px-1.5 py-0.5 rounded text-[8px] font-black uppercase">{recipe.cuisine}</span>
             </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-gray-400">{t.ingredients}</p>
            <div className="flex flex-wrap gap-1">
              {recipe.ingredients.slice(0, 4).map((ing, idx) => (
                <span key={idx} className="bg-white border border-bento-border/10 px-1.5 py-0.5 rounded text-[9px] font-bold">{ing}</span>
              ))}
              {recipe.ingredients.length > 4 && <span className="text-[9px] font-black text-gray-400">+{recipe.ingredients.length - 4}</span>}
            </div>
          </div>

          {recipe.prePreparation && recipe.prePreparation.length > 0 && (
            <div className="mt-2 bg-amber-100/50 p-2 rounded-xl border border-amber-200/50">
              <p className="text-[10px] font-black uppercase text-amber-800 mb-1">💡 {t.prep}</p>
              <ul className="space-y-1">
                {recipe.prePreparation.map((step, idx) => (
                  <li key={idx} className="text-[9px] font-bold text-amber-700 leading-tight">• {step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="md:w-2/3 flex flex-col">
          <h2 className="text-2xl font-black mb-2 tracking-tighter leading-none">{recipe.title}</h2>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pt-2">
            <div>
               <p className="text-[10px] font-black uppercase text-gray-400 mb-2">{t.instructions}</p>
               <ol className="space-y-2">
                {recipe.instructions.map((step, idx) => (
                  <li key={idx} className="flex gap-2 text-[11px] leading-relaxed">
                    <span className="font-black text-bento-accent">{idx + 1}.</span>
                    <p className="font-medium">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-bento-border/10 flex justify-between items-center text-[10px] font-black uppercase text-gray-400 italic">
            <span>{t.source}: {recipe.source}</span>
            <div className="flex items-center gap-1">
               <div className="w-2 h-2 rounded-full bg-green-500" />
               {t.recToday}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
