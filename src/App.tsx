import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, Trophy, Lightbulb, Play, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { EMOTIONS, Emotion, GameState } from './types';
import { analyzeEmotion } from './services/geminiService';
import { cn } from './lib/utils';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [currentEmotion, setCurrentEmotion] = useState<Emotion | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [isMatch, setIsMatch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [poseCountdown, setPoseCountdown] = useState<number | null>(null);
  const [showAdvice, setShowAdvice] = useState(false);
  
  const webcamRef = useRef<Webcam>(null);

  // Game Logic: Start a new round
  const startRound = () => {
    let nextEmotion;
    const availableEmotions = EMOTIONS.filter(e => e.maori !== currentEmotion?.maori);
    nextEmotion = availableEmotions[Math.floor(Math.random() * availableEmotions.length)];
    
    setCurrentEmotion(nextEmotion);
    setGameState('showingWord');
    setFeedback('');
    setIsMatch(false);
    setShowAdvice(false);
    setPoseCountdown(null);
    
    // Auto transition to acting after 3 seconds
    setTimeout(() => {
      setGameState('acting');
      startPoseCountdown();
    }, 3000);
  };

  const startPoseCountdown = () => {
    setPoseCountdown(5);
    setShowAdvice(false);
    setFeedback('');
  };

  // Analysis Countdown Logic
  useEffect(() => {
    if (poseCountdown === null || gameState !== 'acting' || isProcessing) return;
    
    if (poseCountdown > 0) {
      const timer = setTimeout(() => setPoseCountdown(poseCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setPoseCountdown(null);
      captureAndAnalyze();
    }
  }, [poseCountdown, gameState, isProcessing]);

  // Auto-next round after success
  useEffect(() => {
    if (gameState === 'result' && isMatch) {
      const timer = setTimeout(() => {
        startRound();
      }, 6000); // 6 seconds to celebrate before next round
      return () => clearTimeout(timer);
    }
  }, [gameState, isMatch]);

  const captureAndAnalyze = async () => {
    if (!webcamRef.current || isProcessing || !currentEmotion) return;
    
    const imageBase64 = webcamRef.current.getScreenshot();
    if (!imageBase64) return;

    setIsProcessing(true);

    const result = await analyzeEmotion(imageBase64, currentEmotion, false);
    
    setFeedback(result.message);
    setIsMatch(result.isMatch);
    setShowAdvice(true);
    setIsProcessing(false);

    if (result.isMatch) {
      setGameState('result');
    } else {
      // If no match, wait for user to read advice then restart countdown
      setTimeout(() => {
        setGameState(prev => {
          if (prev === 'acting') {
            startPoseCountdown();
          }
          return prev;
        });
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBEB] font-sans text-[#1F2937] p-4 md:p-6 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-[#fbbf24] p-2 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[#c2410c]">
            Te Reo Charades
          </h1>
        </div>
        <div className="bg-white px-4 py-2 rounded-full border-2 border-black font-bold text-xs md:text-sm flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Auto-Detect Mode active
        </div>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Main Area: Webcam and Target Word */}
        <div className="md:col-span-8 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {gameState === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border-4 border-black p-12 rounded-3xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center space-y-8"
              >
                <div className="w-32 h-32 bg-[#fbbf24] rounded-full mx-auto flex items-center justify-center border-4 border-black">
                  <Play className="w-16 h-16 fill-black ml-2" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-black">Kia Ora! Ready?</h2>
                  <p className="text-xl text-gray-600 max-w-lg mx-auto">
                    I'll show you a word, and then automatically check your acting! No clicking needed.
                  </p>
                </div>
                <button
                  onClick={startRound}
                  className="max-w-md mx-auto w-full bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-black py-6 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 text-2xl"
                >
                  START GAME <ArrowRight />
                </button>
              </motion.div>
            )}

            {(gameState === 'showingWord' || gameState === 'acting' || gameState === 'result') && (
              <motion.div
                key="active"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col gap-6"
              >
                {/* Target Word Card - Larger */}
                <div className={cn(
                  "bg-white border-4 border-black p-10 rounded-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden transition-all duration-500",
                  gameState === 'result' && isMatch && "bg-green-100 scale-105 border-green-600"
                )}>
                  <span className="text-lg font-black uppercase tracking-widest text-orange-600 block mb-2">Target Emotion</span>
                  <h2 className="text-7xl md:text-8xl font-black text-black mb-4">
                    {currentEmotion?.maori}
                  </h2>
                  
                  {gameState === 'result' && isMatch && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-block bg-green-600 text-white px-6 py-2 rounded-xl font-black text-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                       = {currentEmotion?.english}
                    </motion.div>
                  )}

                  {gameState === 'showingWord' && (
                    <div className="flex flex-col items-center gap-2">
                       <p className="text-2xl font-black text-gray-500 animate-pulse uppercase tracking-tighter">Preparing your stage...</p>
                       <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden border-2 border-black">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3 }}
                            className="h-full bg-black"
                          />
                       </div>
                    </div>
                  )}
                </div>

                {/* Webcam Section - Much Larger */}
                <div className="flex flex-col gap-6">
                  <div className="relative border-4 border-black rounded-3xl overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] aspect-video bg-black group">
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      className="w-full h-full object-cover grayscale-[0.1] hover:grayscale-0 transition-all duration-700"
                      videoConstraints={{ facingMode: "user" }}
                      mirrored={true}
                      disablePictureInPicture={true}
                      forceScreenshotSourceSize={true}
                      imageSmoothing={true}
                      onUserMedia={() => {}}
                      onUserMediaError={() => {}}
                      screenshotQuality={0.92}
                    />
                    
                    {/* Countdown Overlay */}
                    {poseCountdown !== null && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                        <motion.div
                          key={poseCountdown}
                          initial={{ scale: 2, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-white font-black text-9xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]"
                        >
                          {poseCountdown}
                        </motion.div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-16 text-white font-black text-2xl uppercase tracking-widest animate-pulse">
                          Get Ready!
                        </div>
                      </div>
                    )}

                    {/* Analysis Spinner Overlay - More subtle */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white pointer-events-none">
                        <Loader2 className="w-16 h-16 animate-spin text-[#fbbf24] mb-4" />
                        <span className="text-xl font-black uppercase tracking-widest">Identifying your emotion...</span>
                      </div>
                    )}
                  </div>

                  {/* Feedback/Advice Area - Below the Webcam */}
                  <AnimatePresence>
                    {showAdvice && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-white border-4 border-black p-6 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-start gap-4"
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                          isMatch ? "bg-green-400" : "bg-blue-400"
                        )}>
                          {isMatch ? <Trophy className="w-6 h-6" /> : <Lightbulb className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xl font-bold leading-tight">
                            {feedback}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Side Panel: Host & Instructions */}
        <div className="md:col-span-4 flex flex-col gap-6 sticky top-6">
          {/* Host Character Box */}
          <div className="bg-[#fbbf24] border-4 border-black p-8 rounded-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
            {/* Background Pattern */}
            <div className="absolute -right-4 -bottom-4 text-black/10 text-9xl font-black rotate-12 group-hover:rotate-6 transition-transform">
              ?
            </div>

            <div className="flex items-center gap-4 mb-6 relative z-10">
              <motion.div 
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 bg-white rounded-2xl border-4 border-black flex items-center justify-center text-4xl shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                🦉
              </motion.div>
              <div>
                <h3 className="font-black text-2xl leading-tight">Māia</h3>
                <p className="text-xs font-bold opacity-80 uppercase tracking-widest bg-black/10 px-2 py-0.5 rounded-md inline-block">Pro Mentor</p>
              </div>
            </div>

            <div className="bg-white border-4 border-black p-6 rounded-2xl relative min-h-[140px] flex items-center justify-center z-10">
              {/* Speech Bubble Arrow */}
              <div className="absolute -top-4 left-10 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[16px] border-b-black" />
              <div className="absolute -top-3 left-10 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[14px] border-b-white" />
              
              <div className="text-center w-full">
                {gameState === 'idle' && (
                  <p className="font-black text-lg italic leading-tight">"Ready to show off your acting skills? I'll be watching your every move!"</p>
                )}
                {gameState === 'showingWord' && (
                  <p className="font-black text-lg italic leading-tight text-orange-600">"Prepare your face! This one is a fun one to act out!"</p>
                )}
                {gameState === 'acting' && !feedback && (
                  <p className="font-black text-lg italic leading-tight">"Action! Go on, give it your best shot - I'm checking right now!"</p>
                )}
                {gameState === 'acting' && feedback && (
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
                    <p className="font-black text-lg italic leading-tight text-blue-600">"I'm giving you some tips on screen! Take a peek!"</p>
                  </motion.div>
                )}
                {gameState === 'result' && isMatch && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <p className="font-black text-2xl text-green-600">YES! TINO PAI!</p>
                    <p className="font-bold text-sm text-gray-500 italic">"You nailed it! Next word coming in a few seconds..."</p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="bg-white border-4 border-black p-6 rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h4 className="font-black border-b-2 border-black pb-2 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              TIPS FOR SUCCESS
            </h4>
            <ul className="space-y-3 font-bold text-sm">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-black text-white rounded-full flex items-center justify-center shrink-0 text-[10px]">1</span>
                <span>Stand where Máia can see your whole face clearly!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-black text-white rounded-full flex items-center justify-center shrink-0 text-[10px]">2</span>
                <span>Be as dramatic as possible with your expressions!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-black text-white rounded-full flex items-center justify-center shrink-0 text-[10px]">3</span>
                <span>If you're stuck, use the tips I give you in the white box!</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
      
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-[0.03] overflow-hidden">
        <div className="absolute top-10 right-10 rotate-12 text-9xl font-black">MĀORI</div>
        <div className="absolute bottom-20 left-10 -rotate-6 text-9xl font-black">CHARADES</div>
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 text-[15rem] font-black opacity-10">KI ORA</div>
      </div>
    </div>
  );
}
