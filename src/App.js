import CustomerDashboard from './CustomerDashboard';
import './App.scss';
import Home from './Home';
import {Routes, Route} from "react-router-dom"

function App() {
  return (
		  <Routes>
				  <Route path="/">
						  <Route index element={<Home/>} />
						  <Route path="dashboard/*" element={<CustomerDashboard/>}/>
				  </Route>
		  </Routes>
  );
}

export default App;
