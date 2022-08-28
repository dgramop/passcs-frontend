import CustomerDashboard from './CustomerDashboard';
import './App.scss';
import Home from './Home';
import TutorsDashboard from './TutorsDashboard';
import StudentDashboard, {Sessions} from './StudentDashboard';
import ReservationFrom from './ReservationForm';
import FromToken from './FromToken';
import Terms from './Terms';
import {Routes, Route} from "react-router-dom"

function App() {
  return (
		  <Routes>
				  <Route path="/">
						  <Route index element={<Home/>} />
						  <Route path="legacy-dashboard/*" element={<CustomerDashboard/>}/>
						  <Route path="/student/dashboard" element={<StudentDashboard page="upcoming"/> }/>
						  <Route path="/student/dashboard/history" element={ <StudentDashboard page="history"/> }/>
							<Route path="login" element={<FromToken/>}/>
							<Route path="tutors/*" element={<TutorsDashboard/>}/>
							<Route path="book/*" element={<ReservationFrom/>}/>
							<Route path="terms" element={<Terms/>}/>
				  </Route>
		  </Routes>
  );
}

export default App;
