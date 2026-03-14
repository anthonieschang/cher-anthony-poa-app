import React, { useState, useEffect } from 'react';
import { LucideIcon, Brain, Heart, ShoppingBag, Trophy, MessageCircle, AlertCircle, ChevronRight, RefreshCcw } from 'lucide-react';
import { generateQuestion, GeneratedQuestion } from './api';

const App = () => {
  // Game State
  const [phase, setPhase] = useState(1);
  const [points, setPoints] = useState(100);
  const [happiness, setHappiness] = useState(100);
  const [currentQuestion, setCurrentQuestion] = useState<GeneratedQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [showShop, setShowShop] = useState(false);

  const phaseInfo = {
    1: { name: "The Fact Finder", icon: Brain, color: "bg-blue-500", desc: "Accounting vs Non-accounting info" },
    2: { name: "The Name Game", icon: MessageCircle, color: "bg-purple-500", desc: "Identify the correct account names" },
    3: { name: "The Master Mapper", icon: Trophy, color: "bg-orange-500", desc: "Map elements and nature" }
  };

  const loadQuestion = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      // difficulty 1 for Sec 1/2 students
      const q = await generateQuestion(phase, 1);
      setCurrentQuestion(q);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestion();
  }, [phase]);

  const handleAnswer = (option: string) => {
    if (!currentQuestion || feedback) return;

    const isCorrect = option === currentQuestion.correctAnswer;
    if (isCorrect) {
      setPoints(prev => prev + 20);
      setFeedback({ isCorrect: true, message: "Excellent! " + currentQuestion.cherExplanation });
    } else {
      setHappiness(prev => Math.max(0, prev - 15));
      setFeedback({ isCorrect: false, message: "Not quite. " + currentQuestion.cherExplanation });
    }
  };

  const buyItem = (cost: number, boost: number) => {
    if (points >= cost) {
      setPoints(prev => prev - cost);
      setHappiness(prev => Math.min(100, prev + boost));
      setShowShop(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header - Stats */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-500 w-5 h-5" />
            <span className="font-bold text-lg">{points} pts</span>
          </div>
          <div className="flex items-center gap-2 flex-1 justify-end max-w-[150px]">
            <Heart className="text-red-500 w-5 h-5" />
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-red-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${happiness}%` }}></div>
            </div>
          </div>
        </div>
        
        {/* Phase Selector */}
        <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
          {[1, 2, 3].map((p) => {
            const Icon = phaseInfo[p as keyof typeof phaseInfo].icon;
            return (
              <button
                key={p}
                onClick={() => setPhase(p)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                  phase === p ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">Phase {p}</span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 p-4 flex flex-col gap-4">
        {/* Cher Anthony Message */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 relative">
          <div className="flex gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-xl">
              A
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900 mb-1">Cher Anthony</p>
              <p className="text-sm text-blue-800 italic">
                {loading ? "Let me think of a good one for you..." : 
                 feedback ? (feedback.isCorrect ? "Correct! Well done." : "Don't worry, let's learn from this.") :
                 "Ready for a challenge? Look at the scenario below!"}
              </p>
            </div>
          </div>
        </div>

        {/* Question Area */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[300px] flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-center items-center justify-center">
              <RefreshCcw className="animate-spin text-blue-500 w-8 h-8" />
            </div>
          ) : currentQuestion && (
            <>
              <h2 className="text-lg font-medium text-gray-800 mb-6 leading-relaxed">
                {currentQuestion.scenario}
              </h2>
              <div className="flex flex-col gap-3 mt-auto">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(option)}
                    disabled={!!feedback}
                    className={`w-full p-4 rounded-xl text-left font-medium transition-all border-2 ${
                      feedback 
                        ? option === currentQuestion.correctAnswer
                          ? 'bg-green-50 border-green-500 text-green-700'
                          : option === feedback.message.split(' ')[0] // simplification for display
                            ? 'bg-red-50 border-red-500 text-red-700'
                            : 'bg-gray-50 border-gray-100 text-gray-400'
                        : 'bg-white border-gray-100 hover:border-blue-500 active:bg-blue-50 text-gray-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Feedback Section */}
        {feedback && (
          <div className={`p-4 rounded-xl border animate-in fade-in slide-in-from-bottom-2 ${
            feedback.isCorrect ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
          }`}>
            <p className="text-sm leading-relaxed text-gray-800">{feedback.message}</p>
            <button 
              onClick={loadQuestion}
              className="mt-3 w-full bg-white py-2 rounded-lg font-bold text-sm shadow-sm flex items-center justify-center gap-2"
            >
              Next Question <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-100 p-4 flex gap-4">
        <button 
          onClick={() => setShowShop(true)}
          className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <ShoppingBag size={20} /> Shop
        </button>
      </div>

      {/* Shop Overlay */}
      {showShop && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Cher Anthony's Canteen</h3>
              <button onClick={() => setShowShop(false)} className="text-gray-400 font-bold">Close</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => buyItem(30, 20)} className="p-4 border border-gray-100 rounded-2xl flex flex-col items-center gap-2">
                <span className="text-2xl">🥤</span>
                <span className="font-bold">Iced Milo</span>
                <span className="text-xs text-blue-600">30 pts (+20 Happy)</span>
              </button>
              <button onClick={() => buyItem(50, 40)} className="p-4 border border-gray-100 rounded-2xl flex flex-col items-center gap-2">
                <span className="text-2xl">🥟</span>
                <span className="font-bold">Curry Puff</span>
                <span className="text-xs text-blue-600">50 pts (+40 Happy)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
