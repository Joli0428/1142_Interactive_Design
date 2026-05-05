"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import * as Tone from "tone";
import Link from "next/link";

export default function Stage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [activeAnimal, setActiveAnimal] = useState<string>("otter");
  const [isSinging, setIsSinging] = useState(false);
  const [isMediaPipeLoaded, setIsMediaPipeLoaded] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);

  const currentAnimalRef = useRef<string>("otter");
  const isSingingRef = useRef<boolean>(false);
  const synthsRef = useRef<any>({});
  const currentlyPlayingRef = useRef<string | null>(null);

  const smoothCursorRef = useRef({ x: 0, y: 0, isTracking: false });

  // 🌟 解鎖聲音並建立合成器
  const handleStart = async () => {
    await Tone.start(); 
    synthsRef.current = {
      frog: new Tone.Synth({ oscillator: { type: "square" }, envelope: { attack: 0.1, release: 0.2 } }).toDestination(),
      otter: new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.1, release: 0.2 } }).toDestination(),
      bird: new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.1, release: 0.2 } }).toDestination(),
    };
    setIsAudioReady(true);
  };

  useEffect(() => {
    if (!isMediaPipeLoaded || !isAudioReady) return;

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement?.getContext("2d");

    if (!videoElement || !canvasElement || !canvasCtx) return;

    // @ts-ignore
    const hands = new window.Hands({
      // 讀取本機的 MediaPipe 模型檔案，確保展場無網路也能秒開
      locateFile: (file: string) => `/mediapipe/${file}`
    });

    hands.setOptions({
      maxNumHands: 1, 
      modelComplexity: 0, // 最輕量模型，確保反應極致靈敏
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults((results: any) => {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // --- 游標平滑化 (LERP) ---
        const targetX = landmarks[8].x * canvasElement.width;
        const targetY = landmarks[8].y * canvasElement.height;

        if (!smoothCursorRef.current.isTracking) {
          smoothCursorRef.current.x = targetX;
          smoothCursorRef.current.y = targetY;
          smoothCursorRef.current.isTracking = true;
        } else {
          smoothCursorRef.current.x += (targetX - smoothCursorRef.current.x) * 0.2;
          smoothCursorRef.current.y += (targetY - smoothCursorRef.current.y) * 0.2;
        }

        const smoothedX = smoothCursorRef.current.x;
        const smoothedY = smoothCursorRef.current.y;

        // --- 唱歌狀態判斷 (食指與大拇指距離) ---
        const dx = landmarks[8].x - landmarks[4].x;
        const dy = landmarks[8].y - landmarks[4].y;
        const isHandOpen = Math.sqrt(dx * dx + dy * dy) > 0.12; 

        // --- 繪製發光游標 ---
        canvasCtx.shadowBlur = 25;
        canvasCtx.shadowColor = isHandOpen ? '#4ade80' : '#f87171';
        canvasCtx.beginPath();
        canvasCtx.arc(smoothedX, smoothedY, 12, 0, 2 * Math.PI);
        canvasCtx.fillStyle = isHandOpen ? '#4ade80' : '#f87171';
        canvasCtx.fill();
        canvasCtx.lineWidth = 4;
        canvasCtx.strokeStyle = '#ffffff';
        canvasCtx.stroke();
        canvasCtx.shadowBlur = 0;

        // --- 區域選擇判斷 (X軸) ---
        const cursorRatioX = smoothedX / canvasElement.width;
        let newAnimal = 'otter';
        if (cursorRatioX > 0.66) newAnimal = 'frog'; 
        else if (cursorRatioX > 0.33) newAnimal = 'otter';
        else newAnimal = 'bird'; 

        if (currentAnimalRef.current !== newAnimal) {
          currentAnimalRef.current = newAnimal;
          setActiveAnimal(newAnimal); 
        }

        if (isSingingRef.current !== isHandOpen) {
          isSingingRef.current = isHandOpen;
          setIsSinging(isHandOpen);
        }

        // --- 音高判斷與 Tone.js 發聲 (Y軸) ---
        const cursorRatioY = smoothedY / canvasElement.height;
        const targetFrequency = 200 + (1 - cursorRatioY) * 800;

        if (isHandOpen) {
          const currentSynth = synthsRef.current[newAnimal];
          if (currentlyPlayingRef.current !== newAnimal) {
            if (currentlyPlayingRef.current) synthsRef.current[currentlyPlayingRef.current].triggerRelease();
            currentSynth.triggerAttack(targetFrequency);
            currentlyPlayingRef.current = newAnimal;
          } else {
            currentSynth.frequency.rampTo(targetFrequency, 0.05);
          }
        } else {
          if (currentlyPlayingRef.current) {
            synthsRef.current[currentlyPlayingRef.current].triggerRelease();
            currentlyPlayingRef.current = null;
          }
        }
      } else {
        // 如果手離開畫面：重置狀態與靜音
        smoothCursorRef.current.isTracking = false;
        if (isSingingRef.current !== false) {
          isSingingRef.current = false;
          setIsSinging(false);
        }
        if (currentlyPlayingRef.current) {
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
  }, [isMediaPipeLoaded, isAudioReady]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-zinc-950 font-sans select-none text-white">
      {/* 載入本機端 MediaPipe 核心腳本 */}
      <Script src="/mediapipe/hands.js" crossOrigin="anonymous" onLoad={() => setIsMediaPipeLoaded(true)} />

      {/* 🌟 尚未解鎖聲音時的等待畫面 */}
      {!isAudioReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-900">
           <h2 className="text-3xl font-bold mb-8 tracking-widest text-white">準備好踏上指揮台了嗎？</h2>
           
           <button 
            onClick={handleStart}
            disabled={!isMediaPipeLoaded}
            className={`px-10 py-5 bg-white text-zinc-900 text-2xl font-black rounded-full transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)] 
              ${!isMediaPipeLoaded ? 'opacity-70 cursor-wait animate-pulse' : 'hover:scale-105 cursor-pointer'}`}
          >
            {!isMediaPipeLoaded ? (
              <span className="flex items-center gap-3">
                <svg className="animate-spin h-6 w-6 text-zinc-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                正在召喚樂團精靈...
              </span>
            ) : (
              '拿好指揮棒 (解鎖聲音)'
            )}
          </button>
          
          <Link href="/" className="mt-8 text-zinc-400 underline hover:text-white transition-colors">
            返回首頁教學
          </Link>
        </div>
      )}

      {/* 🌟 舞台正式畫面 */}
      {isAudioReady && (
        <div className="animate-in fade-in duration-1000">
          
          {/* 返回按鈕 */}
          <Link href="/" className="absolute top-8 left-8 z-50 px-4 py-2 bg-zinc-800/50 rounded-full text-zinc-300 hover:text-white border border-zinc-700 backdrop-blur-md transition-all">
            ← 離開舞台
          </Link>
          
          {/* 狀態指示燈 */}
          <div className="absolute top-8 left-0 w-full flex justify-center items-center z-50 pointer-events-none gap-6">
            <span className={`px-6 py-2 rounded-full font-bold tracking-widest transition-all duration-300 shadow-xl backdrop-blur-md border ${isSinging ? 'bg-green-500/20 text-green-400 border-green-500 scale-110' : 'bg-black/40 text-zinc-400 border-zinc-600'}`}>
              {isSinging ? '🎵 唱歌中 (張開)' : '休息中 (握拳)'}
            </span>
          </div>

          {/* 隱形攝影機與游標畫布 */}
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-0 scale-x-[-1]" />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-30 pointer-events-none scale-x-[-1] object-cover" />

          {/* 🌟 真正的動物圖片區塊 */}
          <div className="absolute inset-0 flex z-20 pointer-events-none items-end pb-8 px-4">
            
            {/* 青蛙區 (左) */}
            <div className="flex-1 flex justify-center items-end h-3/4 transition-all duration-500">
              <img 
                src={(activeAnimal === 'frog' && isSinging) ? "/images/frog-open.png" : "/images/frog-close.png"}
                alt="青蛙"
                className={`w-full max-w-[400px] object-contain transition-all duration-150 ease-out
                  ${activeAnimal === 'frog' && isSinging ? 'scale-[1.15] -translate-y-8 drop-shadow-[0_0_50px_rgba(74,222,128,0.5)]' : 'scale-100'}
                  ${activeAnimal === 'frog' ? 'opacity-100 brightness-110' : 'opacity-40 brightness-75 grayscale-[30%]'}`}
              />
            </div>

            {/* 海獺區 (中) */}
            <div className="flex-1 flex justify-center items-end h-3/4 transition-all duration-500">
              <img 
                src={(activeAnimal === 'otter' && isSinging) ? "/images/otter-open.png" : "/images/otter-close.png"}
                alt="海獺"
                className={`w-full max-w-[400px] object-contain transition-all duration-150 ease-out
                  ${activeAnimal === 'otter' && isSinging ? 'scale-[1.15] -translate-y-8 drop-shadow-[0_0_50px_rgba(249,115,22,0.5)]' : 'scale-100'}
                  ${activeAnimal === 'otter' ? 'opacity-100 brightness-110' : 'opacity-40 brightness-75 grayscale-[30%]'}`}
              />
            </div>

            {/* 小鳥區 (右) */}
            <div className="flex-1 flex justify-center items-end h-3/4 transition-all duration-500">
              <img 
                src={(activeAnimal === 'bird' && isSinging) ? "/images/bird-open.png" : "/images/bird-close.png"}
                alt="小鳥"
                className={`w-full max-w-[400px] object-contain transition-all duration-150 ease-out
                  ${activeAnimal === 'bird' && isSinging ? 'scale-[1.15] -translate-y-8 drop-shadow-[0_0_50px_rgba(59,130,246,0.5)]' : 'scale-100'}
                  ${activeAnimal === 'bird' ? 'opacity-100 brightness-110' : 'opacity-40 brightness-75 grayscale-[30%]'}`}
              />
            </div>

          </div>
        </div>
      )}
    </main>
  );
}