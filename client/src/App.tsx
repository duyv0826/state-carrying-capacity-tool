import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { QuestionPage } from './pages/QuestionPage';
import { PreviewPage } from './pages/PreviewPage';
import { StrataPage } from './pages/StrataPage';
import { ResultPage } from './pages/ResultPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/q/:id" element={<QuestionPage />} />
        <Route path="/preview" element={<PreviewPage />} />
        <Route path="/s/:id" element={<StrataPage />} />
        <Route path="/result/:token" element={<ResultPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
