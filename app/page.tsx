"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import * as Tone from "tone"; // 🌟 引入聲音引擎

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [activeAnimal, setActiveAnimal] = useState<string>("otter"); // 預設中間
  const [isSinging, setIsSinging] = useState(false); // 狀態改成 isSinging
  const [isMediaPipeLoaded, setIsMediaPipeLoaded] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false); // 記錄使用者是否已授權聲音

  // 使用 Ref 來儲存不會觸發畫面重新渲染的變數
  const currentAnimalRef = useRef<string>("otter");
  const isSingingRef = useRef<boolean>(false);
  
  // 🌟 儲存我們的三台虛擬合成器
  const synthsRef = useRef<any>({});
  // 記錄目前哪隻動物正在發聲，用來切換時可以把前一隻靜音
  const currentlyPlayingRef = useRef<string | null>(null);

  // 初始化聲音的按鈕事件
  const handleStartAudio = async () => {
    await Tone.start(); // 告訴瀏覽器：使用者允許發聲了！
    
    // 為三種動物設定不同的音色
    synthsRef.current = {
      // 青蛙：低沉的方波 (Square)
      frog: new Tone.Synth({ oscillator: { type: "square" }, envelope: { attack: 0.1, release: 0.2 } }).toDestination(),
      // 海獺：溫和的三角波 (Triangle)
      otter: new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.1, release: 0.2 } }).toDestination(),
      // 小鳥：清脆的正弦波 (Sine)
      bird: new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.1, release: 0.2 } }).toDestination(),
    };
    
    setIsAudioReady(true);
  };

  const drawHandPoints = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
    ctx.fillStyle = '#FF0000';
    for (let i = 0; i < landmarks.length; i++) {
      const landmark = landmarks[i];
      const x = landmark.x * ctx.canvas.width;
      const y = landmark.y * ctx.canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  useEffect(() => {
    if (!isMediaPipeLoaded) return;

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement?.getContext("2d");

    if (!videoElement || !canvasElement || !canvasCtx) return;

    // @ts-ignore
    const hands = new window.Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 1, // 🌟 1. 退回單手控制
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    hands.onResults((results: any) => {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0]; // 只取第一隻手
        drawHandPoints(canvasCtx, landmarks);

        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];
        
        // --- A. 樂團觸發選擇 (X軸) ---
        let newAnimal = 'otter';
        if (indexTip.x > 0.66) newAnimal = 'frog'; 
        else if (indexTip.x > 0.33) newAnimal = 'otter';
        else newAnimal = 'bird'; 

        if (currentAnimalRef.current !== newAnimal) {
          currentAnimalRef.current = newAnimal;
          setActiveAnimal(newAnimal); 
        }

        // --- B. 唱歌與靜音判斷 (張開 vs 握拳) ---
        // 🌟 2. 計算食指與大拇指的距離。握拳時距離會很小，張開時距離會變大。
        const dx = indexTip.x - thumbTip.x;
        const dy = indexTip.y - thumbTip.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 設定一個閾值，大於 0.12 判定為「張開」，小於則為「握拳/捏合」
        const isHandOpen = distance > 0.12; 

        if (isSingingRef.current !== isHandOpen) {
          isSingingRef.current = isHandOpen;
          setIsSinging(isHandOpen);
        }

        // --- C. 音高控制 (Y軸) ---
        // 🌟 3. Y 軸越小 (越上面) -> 音高越高。
        // MediaPipe 的 Y 是 0(頂部) 到 1(底部)。
        // 我們將 (1 - Y) 乘上頻率範圍。最低音設為 200Hz，最高音加 800Hz (即 1000Hz)
        const currentY = indexTip.y;
        const targetFrequency = 200 + (1 - currentY) * 800;

        // --- D. 控制 Tone.js 發聲 ---
        if (isAudioReady) {
          if (isHandOpen) {
            const currentSynth = synthsRef.current[newAnimal];
            
            // 如果換了動物，或者原本是靜音狀態，就要觸發新的攻擊音 (Attack)
            if (currentlyPlayingRef.current !== newAnimal) {
              // 先把前一隻動物的嘴巴閉上 (Release)
              if (currentlyPlayingRef.current) {
                synthsRef.current[currentlyPlayingRef.current].triggerRelease();
              }
              currentSynth.triggerAttack(targetFrequency);
              currentlyPlayingRef.current = newAnimal;
            } else {
              // 同一隻動物繼續唱，但要滑順地改變音高 (RampTo: 50毫秒內滑動到新音高)
              currentSynth.frequency.rampTo(targetFrequency, 0.05);
            }
          } else {
            // 握拳狀態：停止發聲
            if (currentlyPlayingRef.current) {
              synthsRef.current[currentlyPlayingRef.current].triggerRelease();
              currentlyPlayingRef.current = null;
            }
          }
        }

      } else {
        // 如果手離開畫面：靜音
        if (isSingingRef.current !== false) {
          isSingingRef.current = false;
          setIsSinging(false);
        }
        if (currentlyPlayingRef.current && isAudioReady) {
          synthsRef.current[currentlyPlayingRef.current].triggerRelease();
          currentlyPlayingRef.current = null;
        }
      }
      canvasCtx.restore();
    });

    let animationFrameId: number;
    const startCameraAndDetection = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1920 }, height: { ideal: 1080 } } });
        videoElement.srcObject = stream;
        videoElement.onloadeddata = () => {
          canvasElement.width = videoElement.videoWidth;
          canvasElement.height = videoElement.videoHeight;
          const detectFrame = async () => {
            if (videoElement.readyState >= 2) await hands.send({ image: videoElement });
            animationFrameId = requestAnimationFrame(detectFrame);
          };
          detectFrame();
        };
      } catch (err) {
        console.error("相機啟動失敗：", err);
      }
    };

    startCameraAndDetection();
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      hands.close();
    };
  }, [isMediaPipeLoaded, isAudioReady]); // 加入 isAudioReady 依賴

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black font-sans select-none">
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossOrigin="anonymous" onLoad={() => setIsMediaPipeLoaded(true)} />

      {/* 🌟 聲音解鎖遮罩：在使用者點擊前，蓋住畫面並要求點擊 */}
      {!isAudioReady && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <h2 className="text-white text-2xl font-bold mb-6 tracking-widest">請準備好你的指揮棒（手）</h2>
          <button 
            onClick={handleStartAudio}
            className="px-8 py-4 bg-white text-black text-xl font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.4)]"
          >
            點擊進入舞台
          </button>
        </div>
      )}

      <div className="absolute top-8 left-0 w-full flex justify-center items-center z-50 pointer-events-none gap-6">
        <h1 className="text-3xl font-bold tracking-widest text-white drop-shadow-md">動物合唱團指揮 🐸🦦🐦</h1>
        <span className={`px-6 py-2 rounded-full font-bold tracking-widest transition-all duration-300 shadow-xl backdrop-blur-md ${isSinging ? 'bg-green-500/90 text-white scale-110' : 'bg-black/40 text-zinc-300 border border-zinc-600'}`}>
          {isSinging ? '🎵 唱歌中 (張開)' : '休息中 (握拳)'}
        </span>
      </div>

      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-60 scale-x-[-1]" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none scale-x-[-1] object-cover" />

      <div className="absolute inset-0 flex z-20 pointer-events-none">
        <div className={`flex-1 flex justify-center items-end pb-24 transition-all duration-500 border-r border-white/10 ${activeAnimal === 'frog' && isSinging ? 'bg-green-500/30 shadow-[inset_0_-100px_100px_rgba(34,197,94,0.4)]' : ''}`}>
          <span className={`text-4xl font-black tracking-[0.2em] transition-opacity duration-300 ${activeAnimal === 'frog' ? 'text-green-300 opacity-100' : 'text-zinc-500 opacity-30'}`}>青蛙區</span>
        </div>
        <div className={`flex-1 flex justify-center items-end pb-24 transition-all duration-500 border-r border-white/10 ${activeAnimal === 'otter' && isSinging ? 'bg-orange-500/30 shadow-[inset_0_-100px_100px_rgba(249,115,22,0.4)]' : ''}`}>
          <span className={`text-4xl font-black tracking-[0.2em] transition-opacity duration-300 ${activeAnimal === 'otter' ? 'text-orange-300 opacity-100' : 'text-zinc-500 opacity-30'}`}>海獺區</span>
        </div>
        <div className={`flex-1 flex justify-center items-end pb-24 transition-all duration-500 ${activeAnimal === 'bird' && isSinging ? 'bg-blue-500/30 shadow-[inset_0_-100px_100px_rgba(59,130,246,0.4)]' : ''}`}>
          <span className={`text-4xl font-black tracking-[0.2em] transition-opacity duration-300 ${activeAnimal === 'bird' ? 'text-blue-300 opacity-100' : 'text-zinc-500 opacity-30'}`}>小鳥區</span>
        </div>
      </div>
    </main>
  );
}