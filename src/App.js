import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Home from './Home';
import Booking from './Booking';
import ViewDetails from './ViewDetails';
import Payment from './Payment';
import Confirmation from './Confirmation';
import AdminShowtime from './AdminShowtime';
import AdminMovie from './AdminMovie';
import AdminDashboard from './AdminDashboard';
import EditShowtime from './EditShowtime';
import EditMovie from './EditMovie';
import AdminHall from './AdminHall';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/details" element={<ViewDetails />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/showtime" element={<AdminShowtime />} />
          <Route path="/admin/movie" element={<AdminMovie />} />
          <Route path="/admin/hall" element={<AdminHall />} />
          <Route path="/admin/showtime/edit/:id" element={<EditShowtime />} />
          <Route path="/admin/movie/edit/:id" element={<EditMovie />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
