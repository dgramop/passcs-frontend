import './App.scss';
import Home from './Home';
import TutorPanel, {Schedule, Availability, Summaries, WorkHistory, TeamView, GradebookList} from './TutorPanel';
import StudentDashboard, {Sessions} from './StudentDashboard';
import FromToken from './FromToken';
import Terms from './Terms';
import {Routes, Route} from "react-router-dom"
import Gradebook from "./StudentGradebook.jsx"
import {Loader} from './Components';
import {Placement} from './Placement';

function App() {
  return (
		  <Routes>
				  <Route path="/">
						  <Route index element={<Home/>} />
							<Route path="student/dashboard/" element={<StudentDashboard />}>
								<Route index element={<Sessions /> }/>
								<Route path="upcoming" element={<Sessions /> }/>
								<Route path="grades/:gradebook_id" element={<Gradebook /> }/>
								<Route path="history" element={ <Sessions history/> }/>
							</Route>
							<Route path="login" element={<FromToken/>}/>
						{/*<Route path="tutors/*" element={<TutorsDashboard/>}/>*/}
							<Route path="tutors/:tutor_id/dashboard/" element={<TutorPanel />}>
								<Route index element={<Schedule/>} />
								<Route path="schedule" element={<Schedule/>} />
								<Route path="availability" element={<Availability/>} />
								<Route path="history" element={<WorkHistory/>} />
								<Route path="supervisor" element={<TeamView/>} />
								<Route path="all-summaries" element={<Summaries/>} />
								<Route path="gradebooks" element={<GradebookList /> }/>
								<Route path="all-gradebooks" element={<GradebookList showAll={true}/> }/>
								<Route path="gradebooks/:gradebook_id" element={<Gradebook tutorview /> }/>
							</Route>
							<Route path="terms" element={<Terms/>}/>
							<Route path="placement" element={<Placement/>}/>
				  </Route>
		  </Routes>
  );
}

export default App;
