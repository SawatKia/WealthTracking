import "./App.css";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Profile from './Profile';

function App() {
  return (
    <div className="App">
      <Profile />
      <h1>this is your Home page</h1>
      <h2>
        the frontend can't open(with live server) /build/index.html after build,
        you need to fix this before. as the backend can serve this frontend
      </h2>
    </div>
  );
}

export default App;