import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { UpdatePrompt } from './components/UpdatePrompt';
import { Assets } from './pages/Assets';
import { CameraPage } from './pages/CameraPage';
import { Frames } from './pages/Frames';
import { Guide } from './pages/Guide';
import { Home } from './pages/Home';
import { SettingsPage } from './pages/SettingsPage';

// 編集画面だけが使う Konva は大きいので、編集画面を開いたときに読み込む
const FrameEditor = lazy(() =>
  import('./pages/FrameEditor').then((m) => ({ default: m.FrameEditor })),
);

// 配置先のパスに依存しないよう HashRouter を使う（GitHub Pages で 404 にならない）
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/camera" element={<CameraPage />} />
        <Route path="/frames" element={<Frames />} />
        <Route
          path="/frames/:id"
          element={
            <Suspense fallback={<div className="page-with-bar" />}>
              <FrameEditor />
            </Suspense>
          }
        />
        <Route path="/assets" element={<Assets />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <UpdatePrompt />
    </HashRouter>
  );
}
