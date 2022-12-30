import {EventSharp} from "@mui/icons-material";
import {useEffect, useState} from "react";
import "./TutorPanel.scss";

// TODO: eliminate all of this, consolidate it with DashNav from StudentDashboard.
// Work on more direct features to actually making the critical worflows possible
// 1) entering your own availability 
// 2) removing availability
// 3) rescheduling meetings
// 4) canceling meetings

function SidebarButton(props) {
	return (
		<div className="sidebar__button">
			<div className="sidebar__button__indicator"></div>
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
				<SidebarButton icon={<EventSharp className="fixicon"/>} text="Bookings"/>
				<SidebarButton icon={<EventSharp className="fixicon"/>} text="Bookings"/>
			</div>
		</div>
	)
}

export default function TutorPanel(props) {
	return (
		<>
			<TutorPanelSidebar />
		</>
	)
}
