import Link from "next/link";

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-zinc-900 font-sans select-none text-white flex flex-col items-center justify-center">
      
      <h1 className="text-5xl font-black mb-12 tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-yellow-400 to-blue-400 drop-shadow-lg">
        動物合唱團指揮
      </h1>
      
      <div className="bg-zinc-800/80 p-10 rounded-3xl shadow-2xl backdrop-blur-md mb-12 border border-zinc-700 max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-6 text-center text-zinc-300">如何指揮你的樂團？</h2>
        <ul className="space-y-6 text-xl tracking-wide">
          <li className="flex items-center gap-4"><span className="text-3xl">🖐️</span> <b>張開手掌：</b> 動物開始唱歌</li>
          <li className="flex items-center gap-4"><span className="text-3xl">✊</span> <b>輕輕握拳：</b> 動物停止唱歌（靜音）</li>
          <li className="flex items-center gap-4"><span className="text-3xl">↕️</span> <b>上下移動：</b> 控制唱歌的音高（上高、下低）</li>
          <li className="flex items-center gap-4"><span className="text-3xl">↔️</span> <b>左右移動：</b> 切換不同的動物區塊</li>
        </ul>
      </div>

      <Link 
        href="/stage"
        className="px-10 py-5 bg-white text-zinc-900 text-2xl font-black rounded-full hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
      >
        前往舞台
      </Link>

    </main>
  );
}