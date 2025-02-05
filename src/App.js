import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import './style/style.css'
import { AuthPage } from "./pages/AuthPage";
import { SetUserInfoPage } from "./pages/SetUserInfoPage";
import { MainLobby } from "./pages/MainLobby";
import { Match } from "./pages/Match";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/user-info" element={<SetUserInfoPage />} />
        <Route path="/main-lobby" element={<MainLobby />} />
        <Route path="/match/:matchId" element={<Match />} />
      </Routes>
    </Router>
  );
}

export default App;
