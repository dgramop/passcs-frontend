import {Add, AdminPanelSettings, Archive, ArchiveOutlined, ArchiveSharp, ArrowBack, Delete, DeleteSharp, Event, EventNote, EventSharp, History, PlusOne, Restore, RestoreFromTrashRounded, RestoreFromTrashSharp} from "@mui/icons-material";
import {useEffect, useState} from "react";
import "./TutorPanel.scss";
import {Link, Outlet, useNavigate, useOutletContext, useParams} from "react-router-dom"
import {Meeting} from "./StudentDashboard";
import {get_date_info, Modal, SidebarButton} from "./Components";

import DateTimePicker from "react-datetime-picker";
import Select from 'react-select';
import {Button} from "./Components";
import {DateTime} from "luxon";

// TODO: DUPLICATION! consolidate Sidebar with DashNav from StudentDashboard.
// Work on more direct features to actually making the critical worflows possible
// 1) entering your own availability 
// 2) removing availability
// 3) rescheduling meetings
// 4) canceling meetings

async function submitBackground(background, tutor_id) {
	let form_data = new FormData();
	form_data.append("background", background);
	let backgroundresp = await fetch(`/api/tutors/${tutor_id}/background`, {method:"POST", body:form_data});
	let backgrounddata = await backgroundresp.json();
}

export function TutorBackgroundPopup({tutor_id, initialbg, close}) {
	let [background, setBackground] = useState(initialbg);
	return (
		<Modal close={close} title="Update your background blurb" buttons={{secondaries: [{text:"Close", onClick:close}], primary:{text:"Submit", onClick: ()=>{ submitBackground(background, tutor_id); close()}}}} >
			<div><textarea style={{width:"100%", height:"8rem", fontSize:"inherit"}} value={background} onChange={(e) => setBackground(e.target.value)}/></div>
			Remember, background blurbs must be written in the third person! They are customer-facing, so check your spelling. They should be as brief as the other ones on our front page, where you can find examples.
		</Modal>
	)
}

export function TutorPanelSidebar(props) {
	let {tutor_id} = useParams();
	let [tutor, setTutor] = useState(null);
	let [backgroundPopup, setBackgroundPopup] = useState(false);
	const navigate = useNavigate();

	let loadTutor = async (tutor_id) => {
		try {
			let tutorresp = await fetch(`/api/tutors/${tutor_id}`);
			let tutorjson = await tutorresp.json();
			if(tutorjson?.data == null) {
				navigate("/")
			}
			setTutor(tutorjson.data);
		} catch(e) {
			navigate("/");
		}
	}

	useEffect(() => {
		loadTutor(tutor_id)
	}, [tutor_id])

	return (
		<div className="sidebar">
			{backgroundPopup && <TutorBackgroundPopup initialbg={tutor.background} tutor_id={tutor_id} close={async () => {await loadTutor(tutor_id); setBackgroundPopup(false)}}/>}
			<div className="sidebar__profilecard sidebar__profilecard--clickable" onClick={() => setBackgroundPopup(true)}>
				{tutor && <img className="sidebar__profilecard__photo" src={`/${tutor.id}.jpg`} alt="Your profile" />}
				<div className="sidebar__profilecard__info">
					<div className="sidebar__profilecard__name">
						{tutor && tutor.name.split(" ")[0]}
					</div>
					<div className="sidebar__profilecard__role">
						{tutor && tutor.role}
					</div>
				</div>
			</div>
			<div className="sidebar__buttons">
				<SidebarButton name="schedule" selected={props.selected} icon={<Event className="fixicon"/>} text="Schedule"/>
				<SidebarButton name="availability" selected={props.selected} icon={<EventNote className="fixicon"/>} text="Availability"/>
				<SidebarButton name="history" selected={props.selected} icon={<History className="fixicon"/>} text="Work History"/>
				{tutor && tutor.role === 'Supervisor' && tutor_id === "myself" && <SidebarButton name="supervisor" selected={props.selected} icon={<AdminPanelSettings className="fixicon"/>} text="Supervisor"/>}
				{tutor_id !== "myself" && <SidebarButton name="back" onClick={() => {navigate("/tutors/myself/dashboard/supervisor")}} icon={<ArrowBack className="fixicon"/>} text="Back"/>}
			</div>
		</div>
	)
}

export function Schedule(props) {
	const [selected, setSelected] = useOutletContext();
	const [meetings, setMeetings] = useState(null);

	let {tutor_id} = useParams();

	useEffect(() => {
		setSelected("schedule")
	}, [setSelected]);

	let load_meetings = async () => {
		let meetingsresp = await fetch(`/api/tutors/${tutor_id}/meetings`);
		let meetingsdata = await meetingsresp.json();
		setMeetings(meetingsdata.data.filter((meeting) => {return meeting.payments.length > 0 && meeting.meeting.occurrence_epoch > Date.now()/1000} ))
	}
	useEffect(() => {
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
				{meetings && meetings.map((meeting) => <Meeting staff reload={load_meetings} key={meeting.meeting.id} meeting={meeting.meeting} payments={meeting.payments} />)}
				{meetings && meetings.length === 0 && <span>You have no booked sessions. Please make sure you have availability listed in the Availability tab</span>}
			</div>
		</div>)
}

export function CreateSlotPopup(props) {
	const [startDate, setStartDate] = useState(new Date());
	const [onetime, setOnetime] = useState(false);
	const [error, setError] = useState(null);

	let {tutor_id} = useParams();
	let submit = async () => {
		// TODO
		// also reload the page data

		setError(null);
		let curError = null;
		let form_data = new FormData();
		if(onetime) {
			form_data.append("occurrence_epoch", Date.parse(startDate)/1000);
			form_data.append("tutor", tutor_id);
			let meetingresp = await fetch("/api/meetings", {method:"POST", body:form_data});
			let meetingdata = await meetingresp.json();

			if(meetingdata.error) {
				curError = meetingdata.error.type;
				if(meetingdata.error.type === "Overlap") {
					let overlap_date = new Date(meetingdata.error?.meeting?.occurrence_epoch*1000 || 0);
					let overlap_date_info = get_date_info(overlap_date);
					curError = "This meeting overlaps with your meeting on "+overlap_date_info.weekday+" "+overlap_date_info.month+" "+overlap_date.getDate()+" at "+overlap_date_info.hours+":"+overlap_date_info.minutes+" "+(overlap_date_info.am ? "AM" : "PM");
				}
			}
			console.log(meetingdata);
		} else {
			form_data.append("duration_mins", 60);
			form_data.append("anchor_epoch", Date.parse(startDate)/1000);
			form_data.append("tutor", tutor_id);
			try {
				let slotresp = await fetch("/api/slots", {method:"POST", body:form_data});
				let slotdata = await slotresp.json();

				if(slotdata.error) {
					curError = ({"EarlyAnchor":"Please pick a time in the future (consider next week at the same time)"})[slotdata.error.type] || slotdata.error.type;
					if(slotdata.error.type === "Overlap") {
						let overlap_date = new Date(slotdata.error?.meeting?.occurrence_epoch*1000 || 0);
						let overlap_date_info = get_date_info(overlap_date);
						curError = "This slot overlaps with your meeting on "+overlap_date_info.weekday+" "+overlap_date_info.month+" "+overlap_date.getDate()+" at "+overlap_date_info.hours+":"+overlap_date_info.minutes+" "+(overlap_date_info.am ? "AM" : "PM");
					}
				}
			} catch(e) {
				alert(e);
			}
		}
		setError(curError);
		if(curError === null) {
			props.reload()
			props.close()
		}
	}
	return (
		<Modal close={props.close} buttons={{primary:{text:`Create ${onetime ? "One-off": "Weekly"} Availability`, onClick:submit}, secondaries:[{text:"Cancel", onClick:props.close}]}} title="Add availability">
			When would you like to start weekly meetings?<br/>
			<DateTimePicker minDate={new Date()} value={startDate} onChange={(date) => setStartDate(date)}/><br/>
			<b>Each session will be one hour, and will repeat weekly until the last reading day of the semester, unless you check the box below</b><br/>
			<input type="checkbox" value="onetime" onChange={(e) => {setOnetime(e.target.checked)}}/> Is this a one-time meeeting?
			{error && <div className="genericError">{error}</div>}
		</Modal>
		)
}

export function Availability(props) {
	const [selected, setSelected] = useOutletContext();
	const [meetings, setMeetings] = useState(null);
	const [createSlots, setCreateSlots] = useState(false);

	let {tutor_id} = useParams();

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
				{meetings && meetings.filter((meeting) => {return meeting.meeting.occurrence_epoch > Date.now()/1000} ).map((meeting) => <Meeting staff reload={load_meetings} key={meeting.meeting.id} meeting={meeting.meeting} payments={meeting.payments} />)}
				{meetings && meetings.length === 0 && <span>Use the + button above to add availability</span>} 
			</div>
		</div>
		</>)
}

export function WorkHistory(props) {
	const [selected, setSelected] = useOutletContext();
	const [meetings, setMeetings] = useState(null);

	let {tutor_id} = useParams();

	useEffect(() => {
		setSelected("history")
	}, [setSelected]);

	let load_meetings = async () => {
		let meetingsresp = await fetch(`/api/tutors/${tutor_id}/meetings`);
		let meetingsdata = await meetingsresp.json();
		setMeetings(meetingsdata.data.filter((meeting) => {return meeting.meeting.occurrence_epoch < Date.now()/1000 && meeting.payments.length > 0} ).sort((a, b) => b.meeting.occurrence_epoch - a.meeting.occurrence_epoch ))
	}

	useEffect(() => {
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
				{meetings && meetings.map((meeting) => <Meeting staff show_footer key={meeting.meeting.id} meeting={meeting.meeting} payments={meeting.payments} display_notes reload={load_meetings}/>)}
				{meetings && meetings.length === 0 && "You have no work history, please check back after working some sessions"}
			</div>
		</div>)
}

// nobuttons is used to prevent attempts to unarchive offerings that belong to arcived tutors
function Offering({offering, nobuttons, reload, ...props}) {
	let classes = ["tutor__offering"];

	if(offering.archived) {
		classes.push("tutor__offering--archived");
	}

	let archive = async () => {
		let fetchresp = null;
		try {
			let fetchres = await fetch(`/api/offerings/${offering.id}/archive`, {method: "POST"});
			fetchresp = await fetchres.json();
		} catch(e) {
			console.log(e);
			//TODO
		}
		if(fetchresp.status === "success") {
			reload(fetchresp.data);
		} else if(fetchresp.status === "failure"){
			switch(fetchresp.error.type) {
					//TODO: error handling
				case "NotAuthorized":
					console.log(fetchresp);
					break;
				case "OfferingNotFound":
					console.log(fetchresp);

					reload()
					break;
				case "UpcomingMeetings":
					// launch a whole flow
					break;
				case "ArchivedTutorCannotHaveUnarchivedOfferings":
					// should be unreachable because the button isn't visible, but it's possible the user iteracted with a stale data in the UI
					break;
				case "DBError":

					break;
				default:
					console.log("Unhandled error")
					console.log(fetchresp);

					reload()
					break;
			}
		}
	}
	

	return (
		<div title={offering.course.course_name} className={classes.join(" ")}>
			<div className="tutor__offering__coursenumber">{offering.course.course_number}</div> 
			<div className="tutor__offering__qualification">({offering.qualification})</div> 
			{!nobuttons && <>
				{!offering.archived && <div className="tutor__offering__button tutor__offering__button--red" onClick={archive}><Delete className="fixicon" /></div>}
				{offering.archived && <div className="tutor__offering__button"><RestoreFromTrashRounded className="fixicon" onClick={archive}/></div>}
			</>}
		</div>
	)
}

function Offerings({offerings, nobuttons, reload, ...props}) {
	let archived_offerings = offerings.filter((offering) => offering.archived);
	let normal_offerings = offerings.filter((offering) => !offering.archived);

	return (<>
		{normal_offerings.length > 0 && <div className="tutor__section">
				<div className="tutor__section__title">Qualifications</div>
				<div className="tutor__section__items">{normal_offerings && normal_offerings.map((offering) => <Offering reload={reload} nobuttons={nobuttons} offering={offering} key={offering.id}/>)} </div>
		</div>}

		{archived_offerings.length > 0 && <div className="tutor__section">
				<div className="tutor__section__title">Archived Qualifications</div>
				<div className="tutor__section__items">{archived_offerings && archived_offerings.map((offering) => <Offering reload={reload} nobuttons={nobuttons} offering={offering} key={offering.id}/>)}</div>
		</div>}
	</>
	)
}

function Tutor({tutor, start_date, end_date, reload, ...props}) {
	const [meetings, setMeetings] = useState(null);
	const [offerings, setOfferings] = useState(null);
	const [courseOptions, setCourseOptions] = useState(null);
	const [selectedCourse, setSelectedCourse] = useState(null);
	const [qualification, setQualification] = useState("");
	const [background, setBackground] = useState(tutor.background);

	let load_offerings = async () => {
		let offeringsresp = await fetch(`/api/tutors/${tutor.id}/offerings`);
		let offeringsdata = await offeringsresp.json();
		setOfferings(offeringsdata.data);
	}

	// fetch tutor's meetings
	useEffect(() => {

		let get_classes = async () => {
			let coursesresp = await fetch("/api/courses/")
			let coursesdata = await coursesresp.json()

			let schools = {}
			let other = []
			for(let course of coursesdata.data) {
				let subj = course.course_number.match(/[A-Za-z]+/g)?.[0]
				let num = parseInt(course.course_number.match(/[0-9]+/g)?.[0])

				if(schools[course.school] == null) schools[course.school] = [];
				schools[course.school].push({label: `${course.course_number} (${course.course_name})`, value: course.id, num:num})
			}

			let course_options = [];
			for(let school in schools) {
				course_options.push({label:school,options:schools[school].sort((a,b) => a.num - b.num), school:school})
			}

			setCourseOptions(course_options)
		}

		let load_meetings = async () => {
			let meetingsresp = await fetch(`/api/tutors/${tutor.id}/meetings`);
			let meetingsdata = await meetingsresp.json();
			setMeetings(meetingsdata.data);
		}
		load_meetings()
		load_offerings()
		get_classes()
	}, [tutor.id])

	let customer_meetings = meetings != null ? meetings.filter((meeting) => {
			return meeting.meeting.occurrence_epoch > Date.parse(start_date)/1000 
				&& meeting.meeting.occurrence_epoch < Date.parse(end_date)/1000 
				&& meeting.payments.length > 0;
	}) : null;

	const navigate = useNavigate();

	let submitQualification = async () => {
		let form_data = new FormData();
		form_data.append("tutor", tutor.id);
		form_data.append("course", selectedCourse.value);
		form_data.append("qualification", qualification);
		let slotresp = await fetch("/api/offerings", {method:"POST", body:form_data});
		let slotdata = await slotresp.json();
		load_offerings()
	}



	let phone_friendly = tutor.phone.toString();

	phone_friendly = phone_friendly.substring(0, phone_friendly.length - 7)+"-"+phone_friendly.substring(phone_friendly.length-7, phone_friendly.length - 4)+"-"+phone_friendly.substring(phone_friendly.length - 4)

	return (
			<div className="tutor" >
				<div className="tutor__section tutor__section--top">
					<img className={"tutor__profile "+(tutor.role==='Archived' ? "tutor__profile--archived" : "")} alt={tutor.name} src={`/${tutor.id}.jpg`} />
					<div className="tutor__details">
						<div className={"tutor__details__name "+(tutor.role==='Archived' ? "tutor__details__name--archived" : "")}>{tutor.name} {tutor.role === 'Supervisor' && <AdminPanelSettings className="fixicon"/>}</div>
						<div className="tutor__details__meetings">{meetings && Math.round(customer_meetings.reduce((minutes, meeting) => {return minutes + meeting.meeting.duration_mins}, 0)*100/60)/100} scheduled hours</div>
						<div className="tutor__details__meetings">{meetings && Math.round(customer_meetings.filter((meeting) => {
							return meeting.meeting.notes !== "" && meeting.meeting.notes != null
						}).reduce((minutes, meeting) => {return minutes + meeting.meeting.duration_mins}, 0)*100/60)/100} confirmed hours</div>
					</div>
				</div>
				<div className="tutor__section">
					<div className="tutor__section__title">Contact</div>
					<div className="tutor__details__meetings">{phone_friendly}</div>
					<div className="tutor__details__meetings">{tutor.email}</div>
				</div>
				{offerings && <Offerings reload={load_offerings} nobuttons={tutor.role==="Archived"} offerings={offerings} />}
				<div className="tutor__section">
					<div className="tutor__section__title">Add/Modify qualification</div>
					Class
					<Select autoFocus value={selectedCourse} onChange={(val) => setSelectedCourse(val)} placeholder="Select or type..." className="payflow__inputgroup__select" options={courseOptions} />
					Qualification
					<input type="text" onChange={(e) => setQualification(e.target.value)} value={qualification}/>
					<Button secondary onClick={submitQualification}>Submit</Button>
				</div>
				<div className="tutor__section">
					<div className="tutor__section__title">Update background</div>
					<textarea style={{fontSize:"inherit"}} value={background} onChange={(e) => setBackground(e.target.value)}/>
					<Button secondary onClick={async () => { await submitBackground(background, tutor.id); reload() }}>Submit</Button>
				</div>

				<div className="tutor__section">
					<div className="tutor__section__title">Manage</div>
					<Button onClick={() => {navigate(`/tutors/${tutor.id}/dashboard/history`)}}>View Dashboard</Button>
				</div>
		</div>)
}

export function Supervisor(props) {
	const [selected, setSelected] = useOutletContext();
	const [tutors, setTutors] = useState(null);
	const [startDate, setStartDate] = useState(new Date(Date.now()-1000*60*60*24*7));
	const [endDate, setEndDate] = useState(new Date(Date.now()));
	const [createTutor, setCreateTutor] = useState(false);

	useEffect(() => {
		setSelected("supervisor")
	}, [setSelected]);

	let load_tutors = async () => {
		let tutorsresp = await fetch("/api/tutors");
		let tutorsdata = await tutorsresp.json();
		setTutors(tutorsdata.data);
	}

	useEffect(() => {
		
		load_tutors()
	}, [])

	return (
		<div className="booking_container">
			<div className="booking_container__title">
				Your Team {/*<div className="booking_container__title__addbutton" onClick={()=>{setCreateTutor(true)}} ><Add /></div>*/}
			</div>
			<div>
				<b>View summary by time period:</b><br/>
				<input type="date" value={DateTime.fromJSDate(startDate).toFormat("yyyy-MM-dd")} onChange={(e) => {
					let parsed_time = DateTime.fromISO(e.target.value);
					if(!parsed_time.invalid) {
						console.log(DateTime.fromJSDate(parsed_time.toJSDate()).toFormat("yyyy-MM-dd"))
						setStartDate(parsed_time.toJSDate())
					}
				}} /> - 
				<input type="date" value={DateTime.fromJSDate(endDate).toFormat("yyyy-MM-dd")} onChange={(e) => {
					let parsed_time = DateTime.fromISO(e.target.value);
					if(!parsed_time.invalid) {
						console.log(DateTime.fromJSDate(parsed_time.toJSDate()).toFormat("yyyy-MM-dd"))
						setEndDate(parsed_time.toJSDate())
					}
				}} />
			</div>
			<div className="booking_container__tutors">
				{tutors && tutors.sort((a, b)=> a.name - b.name).map((tutor) => <Tutor key={tutor.id} start_date={startDate} end_date={endDate} tutor={tutor} reload={load_tutors} />)}
			</div>
		</div>
	)

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
