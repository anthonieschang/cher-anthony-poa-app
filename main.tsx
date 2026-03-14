/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, ShoppingBag, Trophy, ArrowRight, CheckCircle2, XCircle, Star, ChevronLeft, Loader2, HelpCircle } from 'lucide-react';
import { Chibi } from './components/Chibi';
import { UserProgress, SHOP_ITEMS, ShopItem, ShopCategory } from './types';
import { generateQuestion, GeneratedQuestion } from './services/questionService';

// --- Constants & Data ---

const INITIAL_PROGRESS: UserProgress = {
  points: 0,
  unlockedAccessories: [],
  equippedAccessories: [],
  currentPhase: 0, // 0: Character Select, 1: Home, 2: Phase 1, 3: Phase 2, 4: Phase 3, 5: Shop
  completedQuestions: [],
  character: 'male',
  happinessLevel: 100,
  questionsAnswered: 0,
  pointMultiplier: 0, // 0 means no extra points, +2 means +2 points
  equippedTitle: '',
};

// --- Helper Functions ---

const formatSGD = (amount: number) => {
  return `SGD${amount.toLocaleString('en-SG')}`;
};

// --- Main Component ---

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('poa_progress');
    return saved ? { ...INITIAL_PROGRESS, ...JSON.parse(saved) } : INITIAL_PROGRESS;
  });

  const [currentScreen, setCurrentScreen] = useState<number>(progress.currentPhase === 0 ? 0 : 1);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<GeneratedQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    const hasSeen = localStorage.getItem('poa_has_seen_tutorial');
    return !hasSeen;
  });

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('poa_has_seen_tutorial', 'true');
  };

  useEffect(() => {
    localStorage.setItem('poa_progress', JSON.stringify(progress));
  }, [progress]);

  const addPoints = (amount: number) => {
    setProgress(prev => ({ ...prev, points: prev.points + amount }));
  };

  const handleQuestionAnswered = () => {
    setProgress(prev => {
      const newQuestionsAnswered = (prev.questionsAnswered || 0) + 1;
      let newHappiness = prev.happinessLevel ?? 100;
      if (newQuestionsAnswered % 5 === 0) {
        newHappiness = Math.max(0, newHappiness - 5);
      }
      return { ...prev, questionsAnswered: newQuestionsAnswered, happinessLevel: newHappiness };
    });
  };

  const handleCorrect = (points: number, message: string) => {
    setFeedback({ isCorrect: true, message });
    const bonus = progress.pointMultiplier || 0;
    addPoints(points + bonus);
    handleQuestionAnswered();
  };

  const handleWrong = (message: string) => {
    setFeedback({ isCorrect: false, message });
    handleQuestionAnswered();
  };

  const loadNewQuestion = useCallback(async (phase: number) => {
    setIsLoading(true);
    setFeedback(null);
    setSelectedAccounts([]);
    setShowHint(false);
    try {
      // Phase 1 maps to Chapter 1, Phase 2 to Chapter 2, Phase 3 to Chapter 3
      const chapter = phase - 1; 
      const difficulty = Math.min(3, Math.floor(progress.points / 200) + 1);
      const question = await generateQuestion(chapter, difficulty);
      setCurrentQuestion(question);
    } catch (error) {
      console.error("Error loading question:", error);
    } finally {
      setIsLoading(false);
    }
  }, [progress.points]);

  useEffect(() => {
    if (currentScreen >= 2 && currentScreen <= 4 && isQuizActive && !currentQuestion && !isLoading) {
      loadNewQuestion(currentScreen);
    }
  }, [currentScreen, currentQuestion, isLoading, loadNewQuestion, isQuizActive]);

  const nextQuestion = () => {
    setCurrentQuestion(null);
    loadNewQuestion(currentScreen);
  };

  // --- Shared Components ---

  const GlobalHeader = ({ title, showBack = false, onBack, rightAction }: { title: string, showBack?: boolean, onBack?: () => void, rightAction?: React.ReactNode }) => (
    <header className="p-4 flex justify-between items-center bg-white shadow-sm shrink-0 z-10">
      <div className="flex items-center gap-3">
        {showBack && onBack ? (
          <button onClick={onBack} className="p-2 hover:bg-amber-50 rounded-full">
            <ChevronLeft size={24} className="text-amber-900" />
          </button>
        ) : (
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <Trophy size={20} className="text-amber-600" />
          </div>
        )}
        <div className="flex flex-col">
          <h2 className="font-bold text-amber-900 text-lg">
            {progress.equippedTitle ? <span className="text-amber-500 text-xs block uppercase tracking-wider">{progress.equippedTitle}</span> : null}
            {title}
          </h2>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            <Star size={14} className="text-amber-500 fill-amber-500" />
            <span className="font-bold text-amber-900 text-sm">{progress.points} pts</span>
          </div>
          <div className="flex items-center gap-1.5 w-full justify-end px-1">
            <span className="text-[10px] font-bold text-emerald-600">Happy</span>
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${progress.happinessLevel > 50 ? 'bg-emerald-500' : progress.happinessLevel > 20 ? 'bg-amber-500' : 'bg-red-500'}`} 
                style={{ width: `${progress.happinessLevel}%` }}
              />
            </div>
          </div>
        </div>
        {rightAction}
      </div>
    </header>
  );

  // --- Screens ---

  const CharacterSelect = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-amber-50">
      <h1 className="text-3xl font-bold text-amber-900 mb-8 text-center">Welcome to POA Master!</h1>
      <p className="text-amber-800 mb-8 text-center">Choose your student character to begin the learning journey.</p>
      <div className="flex gap-8">
        <button 
          onClick={() => { setProgress(p => ({ ...p, character: 'male', currentPhase: 1 })); setCurrentScreen(1); }}
          className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-lg hover:scale-105 transition-transform border-4 border-transparent hover:border-amber-400"
        >
          <Chibi type="male" expression="happy" className="w-32 h-32" />
          <span className="mt-4 font-bold text-amber-900">Boy Student</span>
        </button>
        <button 
          onClick={() => { setProgress(p => ({ ...p, character: 'female', currentPhase: 1 })); setCurrentScreen(1); }}
          className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-lg hover:scale-105 transition-transform border-4 border-transparent hover:border-amber-400"
        >
          <Chibi type="female" expression="happy" className="w-32 h-32" />
          <span className="mt-4 font-bold text-amber-900">Girl Student</span>
        </button>
      </div>
    </div>
  );

  const HomeScreen = () => (
    <div className="flex flex-col h-full bg-amber-50">
      <GlobalHeader 
        title="POA Quest" 
        rightAction={
          <div className="flex gap-2">
            <button onClick={() => setShowTutorial(true)} className="p-2 bg-amber-100 rounded-full text-amber-700 hover:bg-amber-200 transition-colors">
              <HelpCircle size={20} />
            </button>
            <button onClick={() => setCurrentScreen(5)} className="p-2 bg-amber-100 rounded-full text-amber-700 hover:bg-amber-200 transition-colors">
              <ShoppingBag size={20} />
            </button>
          </div>
        } 
      />

      <main className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold text-amber-900 mb-6">Learning Journey</h1>
        
        <div className="space-y-4">
          {[
            { id: 2, title: "The Fact Finder", desc: "Real deal or just noise? Spot the true business transactions!", icon: "🔍" },
            { id: 3, title: "The Name Game", desc: "Cash, Inventory, or Payables? Unmask the secret names of money!", icon: "📊" },
            { id: 4, title: "The Master Mapper", desc: "A = L + E? Put every account in its rightful home!", icon: "📑" },
          ].map((phase) => (
            <button
              key={phase.id}
              onClick={() => { setCurrentScreen(phase.id); setCurrentQuestion(null); setIsQuizActive(false); }}
              className="w-full p-5 bg-white rounded-2xl shadow-md flex items-center gap-4 border-2 border-transparent hover:border-amber-300 transition-all text-left"
            >
              <div className="text-3xl bg-amber-50 w-14 h-14 flex items-center justify-center rounded-xl">
                {phase.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900">{phase.title}</h3>
                <p className="text-sm text-amber-600">{phase.desc}</p>
              </div>
              <ArrowRight size={20} className="text-amber-300" />
            </button>
          ))}
        </div>
      </main>
    </div>
  );

  const LoadingState = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-amber-50">
      <div className="w-48 h-48 mb-8 animate-bounce">
        <Chibi type={progress.character} expression="neutral" accessories={progress.equippedAccessories} />
      </div>
      <Loader2 size={48} className="text-amber-500 animate-spin mb-4" />
      <p className="text-amber-800 font-bold text-xl">Consulting with Cher Anthony...</p>
      <p className="text-amber-600 text-sm mt-2">Preparing your POA challenge</p>
    </div>
  );

  const LevelLanding = ({ title, desc, icon, briefingContent, onStart }: { title: string, desc: string, icon: string, briefingContent?: React.ReactNode, onStart: () => void }) => (
    <div className="flex flex-col h-full bg-amber-50 overflow-y-auto">
      <GlobalHeader 
        title={title} 
        showBack={true} 
        onBack={() => { setCurrentScreen(1); setIsQuizActive(false); }} 
      />
      
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-4 bg-white w-20 h-20 flex items-center justify-center rounded-3xl shadow-sm shrink-0">
          {icon}
        </div>
        <h1 className="text-3xl font-black text-amber-900 mb-2">{title}</h1>
        <p className="text-amber-700 text-base mb-6 leading-relaxed">
          {desc}
        </p>

        {briefingContent && (
          <div className="bg-white p-6 rounded-3xl shadow-md border-b-4 border-amber-200 w-full max-w-sm mb-8 text-left">
            <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
              <span className="bg-amber-100 p-1 rounded-lg">📝</span> Briefing Note
            </h3>
            <div className="text-amber-800 text-sm space-y-3">
              {briefingContent}
            </div>
          </div>
        )}
        
        <div className="w-full max-w-xs space-y-4">
          <button 
            onClick={onStart}
            className="w-full py-4 bg-amber-900 text-white rounded-2xl font-bold text-xl shadow-xl hover:bg-black transition-all transform hover:scale-105"
          >
            Start Now
          </button>
          <p className="text-amber-500 text-sm font-medium">Earn up to 50 points!</p>
        </div>
      </div>
    </div>
  );

  const PhaseContainer = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="flex flex-col h-full bg-amber-50">
      <GlobalHeader 
        title={title} 
        showBack={true} 
        onBack={() => { setCurrentScreen(1); setCurrentQuestion(null); setIsQuizActive(false); }} 
      />
      {isLoading ? <LoadingState /> : children}
    </div>
  );

  const Phase1 = () => {
    if (!isQuizActive) {
      return (
        <LevelLanding 
          title="The Fact Finder" 
          desc="Real deal or just noise? Spot the true business transactions!" 
          icon="🔍"
          briefingContent={
            <>
              <p><strong>Accounting Info:</strong> Business transactions that involve money (e.g. buying stock, paying rent).</p>
              <p><strong>Non-Accounting Info:</strong> Events that don't involve money yet (e.g. hiring a staff, thinking of a new product).</p>
              <p><strong>Source Documents:</strong> These are the "evidence" of transactions! <strong>Receipts</strong> are for cash paid, and <strong>Invoices</strong> are for credit sales/purchases.</p>
            </>
          }
          onStart={() => setIsQuizActive(true)}
        />
      );
    }

    return (
      <PhaseContainer title="The Fact Finder">
        {currentQuestion ? (
          <div className="flex-1 p-6 flex flex-col items-center overflow-y-auto">
            <div className="bg-white p-6 rounded-3xl shadow-lg w-full mb-8 border-t-8 border-amber-400">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Scenario</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Reward: 10 Points</span>
              </div>
              <p className="text-lg text-amber-900 text-center font-medium mb-4">
                {currentQuestion.scenario.replace(/^"|"$/g, '').trim()}
              </p>
              {!feedback && !showHint && (
                <div className="flex justify-end">
                  <button onClick={() => setShowHint(true)} className="text-amber-500 text-xs font-bold bg-amber-50 px-3 py-1 rounded-full hover:bg-amber-100 transition-colors">
                    💡 Hint
                  </button>
                </div>
              )}
              {!feedback && showHint && (
                <div className="bg-amber-50 p-3 rounded-xl mt-2 text-xs text-amber-800 border border-amber-100 text-left">
                  {currentQuestion.hint.includes("Cher Anthony") ? (
                    currentQuestion.hint
                  ) : (
                    <><strong>Cher Anthony's Hint:</strong> {currentQuestion.hint}</>
                  )}
                </div>
              )}
            </div>

            {!feedback ? (
              <div className="grid grid-cols-1 gap-4 w-full">
                {currentQuestion.options.map(opt => (
                  <button 
                    key={opt}
                    onClick={() => opt === currentQuestion.correctAnswer ? handleCorrect(10, currentQuestion.cherExplanation) : handleWrong(currentQuestion.cherExplanation)}
                    className="p-5 bg-white border-2 border-amber-200 rounded-2xl font-bold text-amber-900 hover:bg-amber-100 hover:border-amber-400 transition-all shadow-sm text-left"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className={`p-6 rounded-3xl w-full shadow-xl border-t-4 ${feedback.isCorrect ? 'bg-green-50 border-green-500 text-green-900' : 'bg-red-50 border-red-500 text-red-900'}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  {feedback.isCorrect ? (
                    <div className="bg-green-500 text-white p-2 rounded-full"><CheckCircle2 size={24} /></div>
                  ) : (
                    <div className="bg-red-500 text-white p-2 rounded-full"><XCircle size={24} /></div>
                  )}
                  <h4 className="font-black text-xl">{feedback.isCorrect ? 'Excellent!' : 'Not quite!'}</h4>
                </div>
                
                <div className="bg-white/50 p-4 rounded-xl mb-6 text-left border border-black/5">
                  <p className="text-sm font-bold uppercase text-amber-600 mb-1">Cher Anthony's Explanation</p>
                  <p className="leading-relaxed">{feedback.message}</p>
                </div>

                <button 
                  onClick={nextQuestion}
                  className="w-full py-4 bg-amber-900 text-white rounded-2xl font-bold shadow-lg hover:bg-black transition-colors flex items-center justify-center gap-2"
                >
                  Next Challenge <ArrowRight size={20} />
                </button>
              </motion.div>
            )}
          </div>
        ) : null}
      </PhaseContainer>
    );
  };

  const Phase2 = () => {
    if (!isQuizActive) {
      return (
        <LevelLanding 
          title="The Name Game" 
          desc="Cash, Inventory, or Payables? Unmask the secret names of money!" 
          icon="📊"
          onStart={() => setIsQuizActive(true)}
        />
      );
    }
    
    const toggleAccount = (acc: string) => {
      setSelectedAccounts(prev => 
        prev.includes(acc) ? prev.filter(a => a !== acc) : [...prev, acc]
      );
    };

    const checkAnswer = () => {
      const correctAnswers = currentQuestion!.correctAnswer.split(',').map(s => s.trim());
      const isCorrect = correctAnswers.length === selectedAccounts.length && 
                        correctAnswers.every(a => selectedAccounts.includes(a));
      
      if (isCorrect) {
        handleCorrect(20, currentQuestion!.cherExplanation);
      } else {
        handleWrong(currentQuestion!.cherExplanation);
      }
    };

    return (
      <PhaseContainer title="The Name Game">
        {currentQuestion ? (
          <div className="flex-1 p-6 flex flex-col items-center overflow-y-auto">
            <div className="bg-white p-5 rounded-3xl shadow-lg w-full mb-6 border-t-8 border-amber-400">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider">Transaction</h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Reward: 20 Points</span>
              </div>
              <p className="text-lg text-amber-900 font-medium mb-4">{currentQuestion.scenario.replace(/^"|"$/g, '').trim()}</p>
              <div className="flex justify-between items-end">
                <p className="text-sm text-amber-600 italic">Select all involved accounts.</p>
                {!feedback && !showHint && (
                  <button onClick={() => setShowHint(true)} className="text-amber-500 text-xs font-bold bg-amber-50 px-3 py-1 rounded-full hover:bg-amber-100 transition-colors">
                    💡 Hint
                  </button>
                )}
              </div>
              {!feedback && showHint && (
                <div className="bg-amber-50 p-3 rounded-xl mt-3 text-xs text-amber-800 border border-amber-100 text-left">
                  {currentQuestion.hint.includes("Cher Anthony") ? (
                    currentQuestion.hint
                  ) : (
                    <><strong>Cher Anthony's Hint:</strong> {currentQuestion.hint}</>
                  )}
                </div>
              )}
            </div>

            {!feedback ? (
              <div className="w-full space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  {currentQuestion.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => toggleAccount(opt)}
                      className={`p-5 rounded-2xl border-2 font-bold transition-all flex justify-between items-center shadow-sm ${
                        selectedAccounts.includes(opt) 
                          ? 'bg-amber-100 border-amber-500 text-amber-900' 
                          : 'bg-white border-amber-100 text-amber-700 hover:border-amber-300'
                      }`}
                    >
                      {opt}
                      {selectedAccounts.includes(opt) && <CheckCircle2 size={20} />}
                    </button>
                  ))}
                </div>
                <button 
                  disabled={selectedAccounts.length === 0}
                  onClick={checkAnswer}
                  className="w-full py-4 bg-amber-900 text-white rounded-2xl font-bold mt-4 disabled:opacity-50 shadow-lg hover:bg-black transition-colors"
                >
                  Check Answer
                </button>
              </div>
            ) : (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className={`p-6 rounded-3xl w-full shadow-xl border-t-4 ${feedback.isCorrect ? 'bg-green-50 border-green-500 text-green-900' : 'bg-red-50 border-red-500 text-red-900'}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  {feedback.isCorrect ? (
                    <div className="bg-green-500 text-white p-2 rounded-full"><CheckCircle2 size={24} /></div>
                  ) : (
                    <div className="bg-red-500 text-white p-2 rounded-full"><XCircle size={24} /></div>
                  )}
                  <h4 className="font-black text-xl">{feedback.isCorrect ? 'Excellent!' : 'Not quite!'}</h4>
                </div>
                
                <div className="bg-white/50 p-4 rounded-xl mb-6 text-left border border-black/5">
                  <p className="text-sm font-bold uppercase text-amber-600 mb-1">Cher Anthony's Explanation</p>
                  <p className="leading-relaxed">{feedback.message}</p>
                </div>

                <button 
                  onClick={nextQuestion}
                  className="w-full py-4 bg-amber-900 text-white rounded-2xl font-bold shadow-lg hover:bg-black transition-colors flex items-center justify-center gap-2"
                >
                  Next Challenge <ArrowRight size={20} />
                </button>
              </motion.div>
            )}
          </div>
        ) : null}
      </PhaseContainer>
    );
  };

  const Phase3 = () => {
    if (!isQuizActive) {
      return (
        <LevelLanding 
          title="The Master Mapper" 
          desc="A = L + E? Put every account in its rightful home!" 
          icon="📑"
          briefingContent={
            <>
              <p><strong>The Big 5 Elements:</strong> Assets, Liabilities, Equity, Income, and Expenses.</p>
              <p><strong>Nature:</strong> Assets/Expenses are Debit (Dr); Liabilities/Equity/Income are Credit (Cr).</p>
              <p><strong>Statements:</strong> Elements belong to either the Statement of Financial Position (Position) or Statement of Financial Performance (Performance).</p>
            </>
          }
          onStart={() => setIsQuizActive(true)}
        />
      );
    }

    return (
      <PhaseContainer title="The Master Mapper">
        {currentQuestion ? (
          <div className="flex-1 p-6 flex flex-col items-center overflow-y-auto">
            <div className="bg-white p-5 rounded-3xl shadow-lg w-full mb-6 border-t-8 border-amber-400 text-center">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-amber-500 uppercase">Scenario</h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Reward: 30 Points</span>
              </div>
              <p className="text-xl font-bold text-amber-900 mb-4">{currentQuestion.scenario.replace(/^"|"$/g, '').trim()}</p>
              {!feedback && !showHint && (
                <div className="flex justify-end">
                  <button onClick={() => setShowHint(true)} className="text-amber-500 text-xs font-bold bg-amber-50 px-3 py-1 rounded-full hover:bg-amber-100 transition-colors">
                    💡 Hint
                  </button>
                </div>
              )}
              {!feedback && showHint && (
                <div className="bg-amber-50 p-3 rounded-xl mt-2 text-xs text-amber-800 border border-amber-100 text-left">
                  {currentQuestion.hint.includes("Cher Anthony") ? (
                    currentQuestion.hint
                  ) : (
                    <><strong>Cher Anthony's Hint:</strong> {currentQuestion.hint}</>
                  )}
                </div>
              )}
            </div>

            {!feedback ? (
              <div className="w-full space-y-3">
                {currentQuestion.options.map(opt => (
                  <button 
                    key={opt}
                    onClick={() => opt === currentQuestion.correctAnswer ? handleCorrect(30, currentQuestion.cherExplanation) : handleWrong(currentQuestion.cherExplanation)}
                    className="p-5 bg-white border-2 border-amber-100 rounded-2xl font-bold text-amber-900 w-full hover:bg-amber-100 hover:border-amber-400 transition-all shadow-sm text-left"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className={`p-6 rounded-3xl w-full shadow-xl border-t-4 ${feedback.isCorrect ? 'bg-green-50 border-green-500 text-green-900' : 'bg-red-50 border-red-500 text-red-900'}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  {feedback.isCorrect ? (
                    <div className="bg-green-500 text-white p-2 rounded-full"><CheckCircle2 size={24} /></div>
                  ) : (
                    <div className="bg-red-500 text-white p-2 rounded-full"><XCircle size={24} /></div>
                  )}
                  <h4 className="font-black text-xl">{feedback.isCorrect ? 'Excellent!' : 'Not quite!'}</h4>
                </div>
                
                <div className="bg-white/50 p-4 rounded-xl mb-6 text-left border border-black/5">
                  <p className="text-sm font-bold uppercase text-amber-600 mb-1">Cher Anthony's Explanation</p>
                  <p className="leading-relaxed">{feedback.message}</p>
                </div>

                <button 
                  onClick={nextQuestion}
                  className="w-full py-4 bg-amber-900 text-white rounded-2xl font-bold shadow-lg hover:bg-black transition-colors flex items-center justify-center gap-2"
                >
                  Next Challenge <ArrowRight size={20} />
                </button>
              </motion.div>
            )}
          </div>
        ) : null}
      </PhaseContainer>
    );
  };

  const ShopScreen = () => {
    const [activeTab, setActiveTab] = useState<ShopCategory>('Food');

    const buyItem = (item: ShopItem) => {
      if (progress.points >= item.price) {
        setProgress(prev => {
          let newProgress = { ...prev, points: prev.points - item.price };
          
          if (item.category === 'Food') {
            newProgress.happinessLevel = Math.min(100, (newProgress.happinessLevel || 100) + (item.effectValue || 0));
          } else if (item.category === 'Books') {
            if (!newProgress.unlockedAccessories.includes(item.id)) {
              newProgress.unlockedAccessories = [...newProgress.unlockedAccessories, item.id];
              newProgress.pointMultiplier = (newProgress.pointMultiplier || 0) + (item.effectValue || 0);
            }
          } else if (item.category === 'Apparel') {
            if (!newProgress.unlockedAccessories.includes(item.id)) {
              newProgress.unlockedAccessories = [...newProgress.unlockedAccessories, item.id];
            }
          }
          return newProgress;
        });
      }
    };

    const toggleEquip = (item: ShopItem) => {
      if (item.category === 'Apparel') {
        setProgress(prev => ({
          ...prev,
          equippedTitle: prev.equippedTitle === item.name ? '' : item.name,
          equippedAccessories: prev.equippedAccessories.includes(item.id)
            ? prev.equippedAccessories.filter(a => a !== item.id)
            : [...prev.equippedAccessories.filter(a => !SHOP_ITEMS.find(i => i.id === a && i.category === 'Apparel')), item.id]
        }));
      }
    };

    return (
      <div className="flex flex-col h-full bg-amber-50">
        <GlobalHeader 
          title="Student Shop" 
          showBack={true} 
          onBack={() => setCurrentScreen(1)} 
        />

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 bg-white rounded-full shadow-inner flex items-center justify-center p-2 border-4 border-amber-100">
              <Chibi 
                type={progress.character} 
                expression={progress.happinessLevel > 50 ? "happy" : progress.happinessLevel > 20 ? "neutral" : "sad"} 
                accessories={progress.equippedAccessories} 
                className="w-full h-full"
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 flex items-start gap-4 border border-amber-100">
            <div className="text-4xl">🏪</div>
            <div>
              <h3 className="font-bold text-amber-900 text-sm">Cher Anthony says:</h3>
              <p className="text-amber-700 text-xs leading-relaxed">"Welcome to the shop! Keep your happiness up with food, or invest in books for permanent point bonuses!"</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {(['Food', 'Books', 'Apparel'] as ShopCategory[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-amber-900 text-white' : 'bg-white text-amber-700 border border-amber-200'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {SHOP_ITEMS.filter(item => item.category === activeTab).map(item => {
              const isUnlocked = progress.unlockedAccessories.includes(item.id);
              const isEquipped = progress.equippedTitle === item.name || progress.equippedAccessories.includes(item.id);

              return (
                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-md flex flex-col items-center border-2 border-transparent text-center">
                  <div className="text-4xl mb-2">{item.icon}</div>
                  <h4 className="font-bold text-amber-900 text-sm mb-1">{item.name}</h4>
                  <p className="text-xs text-amber-600 font-medium mb-1">{item.effectDesc}</p>
                  <p className="text-xs text-amber-500 mb-3 font-bold bg-amber-50 px-2 py-1 rounded-full">{item.price} pts</p>
                  
                  {item.category === 'Food' ? (
                    <button 
                      onClick={() => buyItem(item)}
                      disabled={progress.points < item.price || progress.happinessLevel >= 100}
                      className="w-full py-2 bg-amber-500 text-white rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-amber-600 transition-colors"
                    >
                      {progress.happinessLevel >= 100 ? 'Full!' : 'Buy'}
                    </button>
                  ) : isUnlocked ? (
                    item.category === 'Apparel' ? (
                      <button 
                        onClick={() => toggleEquip(item)}
                        className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${isEquipped ? 'bg-amber-100 text-amber-700' : 'bg-amber-900 text-white'}`}
                      >
                        {isEquipped ? 'Unequip' : 'Equip'}
                      </button>
                    ) : (
                      <button disabled className="w-full py-2 bg-gray-100 text-gray-400 rounded-lg text-xs font-bold">
                        Owned
                      </button>
                    )
                  ) : (
                    <button 
                      onClick={() => buyItem(item)}
                      disabled={progress.points < item.price}
                      className="w-full py-2 bg-amber-500 text-white rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-amber-600 transition-colors"
                    >
                      Buy
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-white shadow-2xl overflow-hidden font-sans relative">
      <AnimatePresence mode="wait">
        {currentScreen === 0 && <motion.div key="char" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full"><CharacterSelect /></motion.div>}
        {currentScreen === 1 && <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full"><HomeScreen /></motion.div>}
        {currentScreen === 2 && <motion.div key="p1" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} className="h-full"><Phase1 /></motion.div>}
        {currentScreen === 3 && <motion.div key="p2" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} className="h-full"><Phase2 /></motion.div>}
        {currentScreen === 4 && <motion.div key="p3" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} className="h-full"><Phase3 /></motion.div>}
        {currentScreen === 5 && <motion.div key="shop" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="h-full"><ShopScreen /></motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full shadow-2xl relative max-h-[90%] flex flex-col"
            >
              <button
                onClick={closeTutorial}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
              
              <div className="flex justify-center mb-4 shrink-0">
                <div className="w-32 h-32 bg-amber-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-amber-200">
                  <Chibi type={progress.character || 'male'} expression="happy" accessories={progress.equippedAccessories} />
                </div>
              </div>
              
              <div className="overflow-y-auto pr-2 space-y-4 text-gray-700 flex-1">
                <p className="font-medium text-lg text-center text-amber-900">
                  Hello! I am Cher Anthony. Welcome to your POA Adventure! Your goal is to master Accounting by clearing all three phases.
                </p>
                
                <div className="bg-amber-50 p-4 rounded-2xl">
                  <h3 className="font-bold text-amber-900 mb-3 text-lg">Rules of the Game:</h3>
                  <ul className="space-y-4 text-sm">
                    <li className="flex gap-3">
                      <Star className="text-amber-500 shrink-0 mt-0.5" size={20} />
                      <span><strong>Earn Points:</strong> Answer questions correctly to grow your business.</span>
                    </li>
                    <li className="flex gap-3">
                      <ShoppingBag className="text-amber-500 shrink-0 mt-0.5" size={20} />
                      <span><strong>Stay Happy:</strong> Your Happiness Bar drops as you work. Visit the Shop to buy food and drinks to keep your spirits high!</span>
                    </li>
                    <li className="flex gap-3">
                      <Trophy className="text-amber-500 shrink-0 mt-0.5" size={20} />
                      <span><strong>Level Up:</strong> Unlock the Master Mapper title by proving you know your Assets from your Liabilities.</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <button
                onClick={closeTutorial}
                className="mt-6 w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-colors shrink-0"
              >
                Let's Go!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
