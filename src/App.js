import CustomerDashboard from './CustomerDashboard';
import './App.scss';
import Home from './Home';
import TutorsDashboard from './TutorsDashboard';
import TutorPanel, {Schedule, Availability, WorkHistory, Supervisor} from './TutorPanel';
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
							<Route path="student/dashboard/" element={<StudentDashboard />}>
								<Route index element={<Sessions /> }/>
								<Route path="upcoming" element={<Sessions /> }/>
								<Route path="history" element={ <Sessions history/> }/>
							</Route>
							<Route path="login" element={<FromToken/>}/>
						{/*<Route path="tutors/*" element={<TutorsDashboard/>}/>*/}
							<Route path="tutors/:tutor_id/dashboard/" element={<TutorPanel />}>
								<Route index element={<Schedule/>} />
								<Route path="schedule" element={<Schedule/>} />
								<Route path="availability" element={<Availability/>} />
								<Route path="history" element={<WorkHistory/>} />
								<Route path="supervisor" element={<Supervisor/>} />
							</Route>
							<Route path="book/*" element={<ReservationFrom/>}/>
							<Route path="terms" element={<Terms/>}/>
				  </Route>
		  </Routes>
  );
}

export default App;
