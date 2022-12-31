import {Event, EventNote, EventSharp, History} from "@mui/icons-material";
import {useEffect, useState} from "react";
import "./TutorPanel.scss";
import {Link, Outlet, useNavigate, useOutletContext} from "react-router-dom"

// TODO: DUPLICATION! consolidate Sidebar with DashNav from StudentDashboard.
// Work on more direct features to actually making the critical worflows possible
// 1) entering your own availability 
// 2) removing availability
// 3) rescheduling meetings
// 4) canceling meetings

function SidebarButton(props) {
	const navigate = useNavigate();
	return (
		<div onClick={() => navigate(props.name)} className="sidebar__button">
			<div className={["sidebar__button__indicator", (props.name === props.selected ? "sidebar__button__indicator--active" : "")].join(" ")}></div>
			<div className="sidebar__button__icon">{props.icon}</div>
			<div className="sidebar__button__text">{props.text}</div>
		</div>
	)
}

export function TutorPanelSidebar(props) {
	let [tutor, setTutor] = useState(null);
	useEffect(() => {
		let loadTutor = async () => {
			let tutorresp = await fetch("/api/tutors/myself");
			let tutorjson = await tutorresp.json();
			console.log(tutorjson);
			setTutor(tutorjson.data);
		}

		loadTutor()
	}, [])

	return (
		<div className="sidebar">
			<div className="sidebar__profilecard">
				{tutor && <img className="sidebar__profilecard__photo" src={`/${tutor.id}.jpg`} alt="Your profile" />}
				<div className="sidebar__profilecard__info">
					<div className="sidebar__profilecard__name">
						{tutor && tutor.name.split(" ")[0]}
					</div>
					<div className="sidebar__profilecard__role">
						{tutor && tutor.role === 'supervisor' ? "Supervisor" : "Tutor"}
					</div>
				</div>
			</div>
			<div className="sidebar__buttons">
				<SidebarButton name="bookings" selected={props.selected} icon={<Event className="fixicon"/>} text="Bookings"/>
				<SidebarButton name="schedule" selected={props.selected} icon={<EventNote className="fixicon"/>} text="Schedule"/>
				<SidebarButton name="history" selected={props.selected} icon={<History className="fixicon"/>} text="Work History"/>
			</div>
		</div>
	)
}

export function Bookings(props) {
	const [selected, setSelected] = useOutletContext();
	useEffect(() => {
		setSelected("bookings")
	}, [setSelected]);

	return (<>
		</>)
}

export function Schedule(props) {
	const [selected, setSelected] = useOutletContext();
	useEffect(() => {
		setSelected("schedule")
	}, [setSelected]);

	return (<>
		</>)
}

export function WorkHistory(props) {
	const [selected, setSelected] = useOutletContext();
	useEffect(() => {
		setSelected("history")
	}, [setSelected]);

	return (<>
		</>)
}

export default function TutorPanel(props) {
	let [selected, setSelected] = useState("bookings");
	return (
		<>
			<TutorPanelSidebar selected={selected} />
			<Outlet context={[selected, setSelected]} />
		</>
	)
}
