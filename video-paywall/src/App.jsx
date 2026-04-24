import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import VideoPage from './pages/VideoPage';
import WiFiPage from './pages/WiFiPage';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/video/:videoId" element={<VideoPage />} />
        <Route path="/wifi" element={<WiFiPage />} />
      </Routes>
    </BrowserRouter>
  );
}
