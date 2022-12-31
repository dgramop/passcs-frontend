import {Add, Event, EventNote, EventSharp, History, PlusOne} from "@mui/icons-material";
import {useEffect, useState} from "react";
import "./TutorPanel.scss";
import {Link, Outlet, useNavigate, useOutletContext} from "react-router-dom"
import {Meeting} from "./StudentDashboard";
import {Modal} from "./Components";

import DateTimePicker from "react-datetime-picker";

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
				<SidebarButton name="schedule" selected={props.selected} icon={<Event className="fixicon"/>} text="Schedule"/>
				<SidebarButton name="availability" selected={props.selected} icon={<EventNote className="fixicon"/>} text="Availability"/>
				<SidebarButton name="history" selected={props.selected} icon={<History className="fixicon"/>} text="Work History"/>
			</div>
		</div>
	)
}

export function Schedule(props) {
	const [selected, setSelected] = useOutletContext();
	const [meetings, setMeetings] = useState(null);

	const tutor_id = props.tutor_id || "myself";

	useEffect(() => {
		setSelected("schedule")
	}, [setSelected]);

	useEffect(() => {
		let load_meetings = async () => {
			let meetingsresp = await fetch(`/api/tutors/${tutor_id}/meetings`);
			let meetingsdata = await meetingsresp.json();
			setMeetings(meetingsdata.data.filter((meeting) => {return meeting.payments.length > 0 && meeting.meeting.occurrence_epoch > Date.now()/1000} ))
		}

		load_meetings();
	}, [tutor_id]);
	console.log(meetings);

	// fetch all future meetings that have a connected payment

	return (
		<div className="booking_container">
			<div className="booking_container__title">
				Upcoming Booked Sessions
			</div>
			<div className="booking_container__bookings">
				{meetings && meetings.map((meeting) => <Meeting key={meeting.meeting.id} meeting={meeting.meeting} payments={meeting.payments} />)}
				{meetings && meetings.length === 0 && <span>You have no booked sessions. Please make sure you have availability listed in the Availability tab</span>}
			</div>
		</div>)
}

export function CreateSlotPopup(props) {
	const [startDate, setStartDate] = useState(new Date());
	let submit = async () => {
		// TODO
		// also reload the page data

		console.log("test");
		let form_data = new FormData();
		form_data.append("duration_mins", 60);
		form_data.append("anchor_epoch", Date.parse(startDate)/1000);
		form_data.append("tutor", "myself");
		let slotresp = await fetch("/api/slots", {method:"POST", body:form_data});
		let slotdata = await slotresp.json();
		console.log(slotdata);
		props.reload()
		props.close()
	}
	return (
		<Modal close={props.close} buttons={{primary:{text:"Create Availability", onClick:submit}, secondaries:[{text:"Cancel", onClick:props.close}]}} title="Add availability">
			When would you like to start weekly meetings?<br/>
			<DateTimePicker minDate={new Date()} value={startDate} onChange={(date) => setStartDate(date)}/><br/>
			Each session will be one hour, and will repeat weekly until the last reading day of the semester

		</Modal>
		)
}

export function Availability(props) {
	const [selected, setSelected] = useOutletContext();
	const [meetings, setMeetings] = useState(null);
	const [createSlots, setCreateSlots] = useState(false);

	const tutor_id = props.tutor_id || "myself";

	useEffect(() => {
		setSelected("availability")
	}, [setSelected]);

	let load_meetings = async () => {
		let meetingsresp = await fetch(`/api/tutors/${tutor_id}/meetings`);
		let meetingsdata = await meetingsresp.json();
		setMeetings(meetingsdata.data)
	}

	useEffect(() => {
		load_meetings();
	}, [tutor_id]);
	console.log(meetings);

	// fetch all future meetings that have a connected payment

	return ( <>
		{createSlots && <CreateSlotPopup reload={load_meetings} close={() => setCreateSlots(false)}/>}
		<div className="booking_container">
			<div className="booking_container__title">
				Manage Availability <div className="booking_container__title__addbutton" onClick={()=>{setCreateSlots(true)}} ><Add /></div>
			</div>
			<div className="booking_container__bookings">
				{meetings && meetings.filter((meeting) => {return meeting.meeting.occurrence_epoch > Date.now()/1000} ).map((meeting) => <Meeting key={meeting.meeting.id} meeting={meeting.meeting} payments={meeting.payments} />)}
				{meetings && meetings.length === 0 && <span>Use the + button above to add availability</span>} 
			</div>
		</div>
		</>)
}

export function WorkHistory(props) {
	const [selected, setSelected] = useOutletContext();
	const [meetings, setMeetings] = useState(null);

	const tutor_id = props.tutor_id || "myself";

	useEffect(() => {
		setSelected("history")
	}, [setSelected]);

	useEffect(() => {
		let load_meetings = async () => {
			let meetingsresp = await fetch(`/api/tutors/${tutor_id}/meetings`);
			let meetingsdata = await meetingsresp.json();
			setMeetings(meetingsdata.data.filter((meeting) => {return meeting.meeting.occurrence_epoch < Date.now()/1000 && meeting.payments > 0} ))
		}

		load_meetings();
	}, [tutor_id]);
	console.log(meetings);

	// fetch all future meetings that have a connected payment

	return (
		<div className="booking_container">
			<div className="booking_container__title">
				Previous Sessions
			</div>
			<div className="booking_container__bookings">
				{meetings && meetings.map((meeting) => <Meeting key={meeting.meeting.id} meeting={meeting.meeting} payments={meeting.payments} />)}
				{meetings && meetings.length === 0 && "You have no work history, please check back after working some sessions"}
			</div>
		</div>)
}


export default function TutorPanel(props) {
	let [selected, setSelected] = useState("bookings");
	return (
		<div className="tutorpanel">
			<TutorPanelSidebar selected={selected} />
			<Outlet context={[selected, setSelected]} />
		</div>
	)
}
