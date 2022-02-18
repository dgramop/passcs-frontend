import CustomerDashboard from './CustomerDashboard';
import './App.scss';
import Home from './Home';
import TutorsDashboard from './TutorsDashboard';
import FromToken from './FromToken';
import {Routes, Route} from "react-router-dom"

function App() {
  return (
		  <Routes>
				  <Route path="/">
						  <Route index element={<Home/>} />
						  <Route path="dashboard/*" element={<CustomerDashboard/>}/>
							<Route path="login" element={<FromToken/>}/>
							<Route path="tutors/*" element={<TutorsDashboard/>}/>
				  </Route>
		  </Routes>
  );
}

export default App;
