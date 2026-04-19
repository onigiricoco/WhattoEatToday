import React, { useState, useEffect } from 'react';
import { ChefHat, Sparkles, RefreshCcw, History as HistoryIcon, User, LogIn, LogOut, Plus } from 'lucide-react';
import InventoryManager from './components/InventoryManager';
import PreferencesManager from './components/PreferencesManager';
import RecipeCard from './components/RecipeCard';
import { Ingredient, UserPreferences, Recipe, HistoryEntry } from './types';
import { generateRecipeRecommendation, getRandomCuisines, getInventoryReminders } from './services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { translations, Language } from './i18n';
import { cn } from './lib/utils';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  serverTimestamp,
  increment,
  getDoc
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    usualDishes: [],
    cookingTimePreference: 'medium',
    difficultyPreference: 'medium',
    favoriteCuisines: [],
    uid: ''
  });
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [randomCuisines, setRandomCuisines] = useState<string[]>([]);
  const [exploreCuisineInput, setExploreCuisineInput] = useState('');
  const [reminders, setReminders] = useState<string[]>([]);
  const [dailyCallCount, setDailyCallCount] = useState(0);
  const [todayRequirement, setTodayRequirement] = useState('');
  const [showReminders, setShowReminders] = useState(false);
  const [lang, setLang] = useState<Language>('zh');

  const t = translations[lang];

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Sync Inventory
  useEffect(() => {
    if (!user) {
      setIngredients([]);
      return;
    }
    const q = query(collection(db, 'inventory'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ingredient));
      setIngredients(items);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'inventory'));
    return () => unsubscribe();
  }, [user]);

  // Sync Preferences
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'preferences', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setPreferences(docSnap.data() as UserPreferences);
      } else {
        // Init preferences if not exist
        const initialPrefs: UserPreferences = {
          usualDishes: [],
          cookingTimePreference: 'medium',
          difficultyPreference: 'medium',
          favoriteCuisines: [],
          uid: user.uid
        };
        setDoc(doc(db, 'preferences', user.uid), initialPrefs).catch(e => handleFirestoreError(e, OperationType.WRITE, 'preferences'));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'preferences'));
    return () => unsub();
  }, [user]);

  // Sync History
  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }
    const q = query(collection(db, 'history'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as HistoryEntry))
        .sort((a, b) => b.timestamp - a.timestamp);
      setHistory(items);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'history'));
    return () => unsubscribe();
  }, [user]);

  // Sync Daily Stats
  useEffect(() => {
    if (!user) return;
    const dateId = new Date().toISOString().split('T')[0];
    const statsRef = doc(db, 'stats', dateId);
    
    return onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        setDailyCallCount(docSnap.data().callCount || 0);
      } else {
        setDailyCallCount(0);
      }
    });
  }, [user]);

  useEffect(() => {
    setRandomCuisines(getRandomCuisines(3, lang));
  }, [lang]);

  // Update reminders whenever ingredients change
  useEffect(() => {
    if (user && ingredients.length > 0) {
      getInventoryReminders(ingredients, lang).then(res => {
        setReminders(res);
        if (res.length > 0) {
          setShowReminders(true);
        }
      });
    } else if (ingredients.length === 0) {
      setReminders([]);
    }
  }, [ingredients, user, lang]);

  const addIngredient = async (item: Omit<Ingredient, 'id' | 'addedAt' | 'uid'>) => {
    if (!user) return;
    try {
      const newItem = {
        ...item,
        id: Math.random().toString(36).substr(2, 9),
        addedAt: Date.now(),
        uid: user.uid
      };
      await addDoc(collection(db, 'inventory'), newItem);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'inventory');
    }
  };

  const removeIngredient = async (id: string) => {
    if (!user) return;
    try {
      // Need to find the doc id. In our sync we use firestore doc.id as the id.
      await deleteDoc(doc(db, 'inventory', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'inventory');
    }
  };

  const updatePreferences = async (newPrefs: UserPreferences) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'preferences', user.uid), { ...newPrefs, uid: user.uid });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'preferences');
    }
  };

  const handleRecommendation = async (cuisine: string) => {
    if (!user) return;
    
    if (dailyCallCount >= 50) {
      alert(t.quotaAlert);
      return;
    }

    setLoading(true);
    try {
      const recipe = await generateRecipeRecommendation(ingredients, preferences, cuisine, todayRequirement, lang);
      setCurrentRecipe(recipe);
      
      const dateId = new Date().toISOString().split('T')[0];
      const statsRef = doc(db, 'stats', dateId);

      // Increment global counter
      try {
        const statsDoc = await getDoc(statsRef);
        if (statsDoc.exists()) {
          await setDoc(statsRef, { callCount: increment(1) }, { merge: true });
        } else {
          await setDoc(statsRef, { callCount: 1 });
        }
      } catch (e) {
        console.error("Failed to update stats:", e);
      }

      const historyEntry: HistoryEntry = {
        id: Math.random().toString(36).substr(2, 9),
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        timestamp: Date.now(),
        selectedCuisine: cuisine,
        uid: user.uid
      };
      try {
        await addDoc(collection(db, 'history'), historyEntry);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'history');
      }
      
      // Update preferences based on selection
      if (!preferences.favoriteCuisines.includes(cuisine)) {
        await updatePreferences({
          ...preferences,
          favoriteCuisines: [cuisine, ...preferences.favoriteCuisines.slice(0, 2)],
          uid: user.uid
        });
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('{')) {
        // This is a Firestore error we already handled
        throw error;
      }
      console.error("Failed to generate recipe:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <RefreshCcw size={40} className="text-warm-accent" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6">
        <div className="flex items-center gap-3">
           <div className="bg-bento-border text-white p-2 rounded-xl">
              <ChefHat size={28} />
           </div>
           <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">
             今天<span className="text-bento-accent">{lang === 'zh' ? '吃什么' : 'Eat?'}</span>
           </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-bento-bg p-1 rounded-xl border border-bento-border/5">
            <button 
              onClick={() => setLang('zh')} 
              className={cn(
                "px-3 py-1 text-[10px] font-black rounded-lg uppercase transition-all cursor-pointer",
                lang === 'zh' ? "bg-white text-bento-accent shadow-sm" : "text-gray-400 hover:text-bento-border"
              )}
            >ZH</button>
            <button 
              onClick={() => setLang('en')} 
              className={cn(
                "px-3 py-1 text-[10px] font-black rounded-lg uppercase transition-all cursor-pointer",
                lang === 'en' ? "bg-white text-bento-accent shadow-sm" : "text-gray-400 hover:text-bento-border"
              )}
            >EN</button>
          </div>

          <div className="hidden lg:block bg-bento-border text-white px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest">
             🎲 {t.randomCuisines}：{randomCuisines.join(' & ')}
          </div>
          {user ? (
            <button onClick={logout} className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest cursor-pointer">
              <LogOut size={14} /> {t.logout}
            </button>
          ) : (
            <button onClick={loginWithGoogle} className="btn-primary flex items-center gap-2 cursor-pointer shadow-[4px_4px_0px_#FF5A00]">
              <LogIn size={16} /> {t.login}
            </button>
          )}
        </div>
      </header>

      {!user ? (
        <div className="card text-center py-20 bg-bento-accent/5 border-dashed border-4 border-bento-accent/10">
          <Sparkles size={64} className="text-bento-accent mx-auto mb-6 opacity-40" />
          <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase">{t.startKitchen}</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-8 font-bold text-sm uppercase tracking-widest leading-relaxed">{t.startSubtitle}</p>
          <button onClick={loginWithGoogle} className="btn-primary text-xl px-12 py-5 flex items-center gap-3 mx-auto cursor-pointer shadow-[8px_8px_0px_#FF5A00]">
            <LogIn size={28} /> {t.loginWithGoogle}
          </button>
        </div>
      ) : (
        <main className="grid-bento min-h-0 md:min-h-[600px] mb-20 text-bento-border">
          {/* Inventory - Col 1, Row 1-2 Span */}
          <div className="md:col-span-1 md:row-span-2">
            <InventoryManager 
              ingredients={ingredients} 
              onAdd={addIngredient} 
              onRemove={removeIngredient} 
              t={t}
              lang={lang}
            />
          </div>

          {/* Today's Requirement - Col 2, Row 1 */}
          <div className="md:col-span-1 md:row-span-1">
            <div className="card h-full bg-[#F0F7FF]">
               <div className="card-title">
                  <span>{t.todayRequirement}</span>
                  <div className="bg-blue-500 w-2 h-2 rounded-full animate-ping" />
               </div>
               <div className="flex flex-col gap-2">
                  <p className="text-[9px] font-black uppercase text-blue-400">{t.instructionPrompt}</p>
                  <textarea 
                    value={todayRequirement}
                    onChange={(e) => setTodayRequirement(e.target.value)}
                    placeholder={t.instructionPlaceholder}
                    className="flex-1 bg-white border-2 border-bento-border rounded-xl p-2 text-xs font-bold outline-none focus:ring-2 ring-blue-500/20 resize-none h-16"
                  />
                  <div className="flex justify-between items-center text-[8px] font-black text-blue-300 uppercase">
                     <span>{t.aiAdvice}</span>
                     <span className="tabular-nums">{todayRequirement.length}/50</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="md:col-span-1 md:row-span-1">
            <div className="card h-full bg-[#FFEBEB]">
               <div className="card-title">
                <span>{t.reminders}</span>
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div className="space-y-2 overflow-y-auto pr-1 flex-1 custom-scrollbar max-h-[120px]">
                {reminders.length === 0 ? (
                  <p className="text-[10px] uppercase font-black text-gray-400 py-8 text-center">{lang === 'zh' ? '状态良好' : 'Everything looks good'}</p>
                ) : (
                  reminders.map((r, i) => (
                    <div key={i} className="bg-white border-2 border-bento-border p-2 rounded-xl text-[10px] font-bold text-red-600 flex gap-2 items-center">
                       <div className="w-1 h-3 bg-red-600 rounded-full" />
                       {r}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-1 md:row-span-1">
             <div className="card h-full">
               <div className="card-title">
                  <span>{t.tasteProfile}</span>
                  <HistoryIcon size={18} className="text-bento-accent" />
               </div>
               <div className="flex flex-wrap gap-1.5 mb-2">
                  {preferences.favoriteCuisines.map((c, i) => (
                    <span key={i} className="bg-bento-bg text-bento-border px-2 py-0.5 rounded-md text-[9px] font-black uppercase">{c}</span>
                  ))}
               </div>
               <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center tabular-nums">
                  <span className="text-[9px] font-black text-gray-400 uppercase">{t.historyTitle}</span>
                  <span className="text-xs font-black">{preferences.favoriteCuisines[0] || '...'}</span>
               </div>
             </div>
          </div>

          {/* Centerpiece (Columns 2-3, Rows 1-2) */}
          <div className="md:col-span-2 md:row-span-2 order-first md:order-none">
            {loading ? (
              <div className="card h-full flex flex-col items-center justify-center py-20 gap-4">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                  <RefreshCcw size={48} className="text-bento-accent" />
                </motion.div>
                <p className="text-bento-border font-black uppercase tracking-tighter text-xl">{t.generating}</p>
              </div>
            ) : currentRecipe ? (
              <RecipeCard recipe={currentRecipe} t={t} />
            ) : (
              <div className="card h-full justify-center items-center text-center p-12 bg-gray-50 border-dashed border-4 border-gray-200">
                 <ChefHat size={64} className="text-gray-300 mb-6" />
                 <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-400">{lang === 'zh' ? '准备好探索了吗?' : 'Ready to Explore?'}</h3>
                 <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">{lang === 'zh' ? '请从右侧或下方选择一个菜系开始' : 'Select a cuisine below to start'}</p>
              </div>
            )}
          </div>

          {/* Column 4 - Top */}
          <div className="md:col-span-1 md:row-span-1">
             <div className="card h-full bg-[#E8F5E9]">
                <div className="card-title">
                   <span>补货清单</span>
                   <Sparkles size={18} className="text-green-600" />
                </div>
                <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                   {currentRecipe?.recommendedShoppingList.length ? (
                      currentRecipe.recommendedShoppingList.map((item, i) => (
                        <div key={i} className="bg-white border-2 border-bento-border p-2 rounded-xl">
                           <p className="text-xs font-black uppercase">{item}</p>
                           <p className="text-[8px] font-bold text-gray-400 uppercase">{lang === 'zh' ? `为您补全${currentRecipe?.title}` : `For your ${currentRecipe?.title}`}</p>
                        </div>
                      ))
                   ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                       <RefreshCcw size={24} className="mb-2" />
                       <p className="text-[10px] font-black uppercase">{lang === 'zh' ? '暂无补货需求' : 'No items needed'}</p>
                    </div>
                   )}
                </div>
             </div>
          </div>

          {/* Row 3 - Columns 1-4 Re-organized */}
          <div className="md:col-span-1 md:row-span-1">
            <PreferencesManager 
              preferences={preferences} 
              onChange={updatePreferences} 
              t={t}
            />
          </div>

          {/* Today's Explore - Col 1, Row 3 */}
          <div className="md:col-span-1 md:row-span-1">
             <div className="card h-full">
                <div className="card-title">
                   <span>{t.exploreCuisine}</span>
                   <RefreshCcw 
                     size={16} 
                     className="text-bento-accent cursor-pointer hover:rotate-180 transition-transform duration-500" 
                     onClick={() => setRandomCuisines(getRandomCuisines(3))}
                   />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                   <div className="relative mb-2">
                     <input 
                       type="text" 
                       value={exploreCuisineInput}
                       onChange={(e) => setExploreCuisineInput(e.target.value)}
                       placeholder={t.explorePlaceholder}
                       className="w-full bg-bento-bg border-2 border-bento-border rounded-xl p-1.5 px-3 text-[11px] font-bold outline-none focus:ring-2 ring-bento-accent/20"
                       onKeyDown={(e) => {
                         if (e.key === 'Enter' && exploreCuisineInput.trim()) {
                           handleRecommendation(exploreCuisineInput);
                         }
                       }}
                     />
                     {exploreCuisineInput.trim() && (
                       <button 
                         onClick={() => handleRecommendation(exploreCuisineInput)}
                         disabled={loading || dailyCallCount >= 50}
                         className="absolute right-1 top-1/2 -translate-y-1/2 bg-bento-accent text-white p-1 rounded-lg hover:opacity-80 disabled:opacity-50"
                       >
                         <Plus size={14} />
                       </button>
                     )}
                   </div>
                   
                   <p className="text-[8px] font-black uppercase text-gray-400 px-1 mb-1">{t.randomRec} {dailyCallCount >= 50 && `(${t.quotaFull})`}</p>
                   
                   {randomCuisines.map((c) => (
                     <button
                        key={c}
                        onClick={() => handleRecommendation(c)}
                        disabled={loading || dailyCallCount >= 50}
                        className="bg-bento-bg hover:bg-bento-accent border-2 border-bento-border p-1.5 rounded-xl transition-all group cursor-pointer disabled:opacity-50 text-left"
                     >
                        <span className="block text-sm font-black uppercase tracking-tighter leading-tight group-hover:text-white">{c}</span>
                     </button>
                   ))}
                </div>
             </div>
          </div>

          <div className="md:col-span-1 md:row-span-1">
             <div className={`card h-full ${dailyCallCount >= 50 ? 'bg-gray-400 grayscale' : 'bg-bento-accent'} transition-all text-white`}>
                <div className="card-title text-white">
                   <span>{t.generate}</span>
                   <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <Plus size={14} className={dailyCallCount >= 50 ? 'text-gray-400' : 'text-bento-accent'} />
                   </div>
                </div>
                <div className="mt-auto">
                   <div className="text-[32px] font-black tracking-widest leading-none">
                     {dailyCallCount >= 50 ? t.quotaFull : 'AI'}
                   </div>
                   <div className="text-[10px] font-black text-white/60 uppercase tracking-widest mt-1">
                     {dailyCallCount >= 50 ? t.quotaMessage : t.aiDriven}
                   </div>
                   <div className="mt-2 text-[8px] font-black text-white/40 uppercase flex justify-between">
                     <span>{t.quotaProgress}</span>
                     <span>{dailyCallCount}/50</span>
                   </div>
                </div>
                <button 
                  onClick={() => handleRecommendation(randomCuisines[0] || (lang === 'zh' ? '家常菜' : 'Casual Dishes'))}
                  disabled={loading || dailyCallCount >= 50}
                  className="mt-4 bg-white text-bento-accent py-3 rounded-xl font-black uppercase text-xs shadow-[4px_4px_0px_#1A1A1A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#1A1A1A] transition-all cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed"
                >
                   {loading ? t.generating : (dailyCallCount >= 50 ? t.tomorrow : t.generateBtn)}
                </button>
             </div>
          </div>
        </main>
      )}

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl p-4 bg-white border-2 border-bento-border shadow-[8px_8px_0px_#1A1A1A] rounded-2xl flex justify-between items-center z-40 transition-all">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-bento-border text-white rounded-xl flex items-center justify-center">
              <User size={20} />
           </div>
           <div>
              <p className="text-xs font-black uppercase leading-tight">{user ? user.displayName : (lang === 'zh' ? '游客模式' : 'Guest Mode')}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{user ? (lang === 'zh' ? '数据已同步至 CLOUD' : 'SYNCED TO CLOUD') : (lang === 'zh' ? '建议登录启用永久同步' : 'LOGIN FOR PERMANENT SYNC')}</p>
           </div>
        </div>
        {user && (
          <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest hidden sm:block font-mono">
            AUTHENTICATED_VIA_SECURE_CHANNEL
          </div>
        )}
      </div>
    </div>
  );
}

