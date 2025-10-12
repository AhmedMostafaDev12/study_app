import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Home from './pages/Home';
import Library from './pages/Library';
import Study from './pages/Study';
import Quiz from './pages/Quiz';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/study" element={<Study />} />
          <Route path="/quiz" element={<Quiz />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
