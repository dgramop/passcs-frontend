import './App.scss';
import Home from './Home';
import TutorPanel, {Schedule, Availability, Summaries, WorkHistory, Supervisor} from './TutorPanel';
import StudentDashboard, {Sessions} from './StudentDashboard';
import FromToken from './FromToken';
import Terms from './Terms';
import {Routes, Route} from "react-router-dom"
import Gradebook from "./StudentGradebook.jsx"

function App() {
  return (
		  <Routes>
				  <Route path="/">
						  <Route index element={<Home/>} />
							<Route path="student/dashboard/" element={<StudentDashboard />}>
								<Route index element={<Sessions /> }/>
								<Route path="upcoming" element={<Sessions /> }/>
								<Route path="grades" element={<Gradebook /> }/>
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
								<Route path="all-summaries" element={<Summaries/>} />
							</Route>
							<Route path="terms" element={<Terms/>}/>
				  </Route>
		  </Routes>
  );
}

export default App;
