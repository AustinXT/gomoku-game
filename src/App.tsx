import Board from "@/components/Board/Board";
import GameControls from "@/components/Game/GameControls";
import GameStatus from "@/components/Game/GameStatus";
import Toast from "@/components/ui/Toast";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="container mx-auto py-8">
        {/* 标题 */}
        <header className="text-center">
          <h1 className="text-4xl font-bold text-gray-800">五子棋</h1>
          <p className="text-gray-600 mt-2">双人对弈 · 五子连珠</p>
        </header>

        {/* 主内容区 */}
        <div className="flex gap-8 items-center justify-center">
          {/* 左侧：棋盘 */}
          <div className="flex-shrink-0">
            <Board />
          </div>

          {/* 右侧：信息面板 */}
          <div className="flex flex-col gap-4 w-64">
            <GameStatus />
            <GameControls />
          </div>
        </div>
      </div>
      <Toast />
    </div>
  );
}

export default App;
