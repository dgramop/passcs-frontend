import {useEffect, useState} from "react";
import {Button, Modal, get_next_meeting, DAYS_OF_THE_WEEK, timezone_time_from_slot, Header} from "./Components";
import {Link} from "react-router-dom";

function TutorDashboardSlot(props) {
	let next_meeting = get_next_meeting(props.meeting_info);
	if(next_meeting == null) {
		console.log(props.meeting_info);
		return (
			<> </>
		);
	}

	let {weekday, start_hour} = timezone_time_from_slot(props.slot);
	let start_hour_str = start_hour%12 === 0 ? "12" : start_hour%12;
	let end_hour = (start_hour+props.slot.duration_mins/60);
	let end_hour_str = end_hour%12 === 0 ? "12" : end_hour%12;
	let timestring = `${DAYS_OF_THE_WEEK[weekday]}${props.meeting_info.length > 1 ? "s" : ""} ${start_hour_str}-${end_hour_str} ${end_hour >= 12 ? "pm" : "am"}`;
	let next_meeting_date = new Date(next_meeting.meeting.occurrence_epoch*1000);

	return (
	<section className="slotcard">
				<div className={"slotcard__header "+(["slotcard__header--blue", "slotcard__header--red", "slotcard__header--green", "slotcard__header--orange", "slotcard__header--purple"])[weekday%5]}>
					{timestring} <span className="mild_emph">Meets: {next_meeting_date.getMonth() +1}/{next_meeting_date.getDate()}</span>
				</div>
				<div className="slotcard__customerinfo">
					{next_meeting.meeting.reservations_taken === 0 && <> 
						No bookings for this slot; No work scheduled
					</>}
					{next_meeting.meeting.reservations_taken > 0 &&
					<>
						<small>Your customers</small>
						{next_meeting.payments.map((payment) => {
							return (<>
								<div className="slotcard__customerinfo__row">
									<span className="material-icons">face</span> <span className="mild_emph">{payment.customer.firstname} {payment.customer.lastname}</span>
								</div>
								<div className="slotcard__customerinfo__row">
									<span className="material-icons" style={{opacity:0}}>face</span> <span className="material-icons">payment</span> Payment {payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.substring(1)}
								</div>
								<div className="slotcard__customerinfo__row">
									<span className="material-icons" style={{opacity:0}}>face</span> <span className="material-icons">mail</span> {payment.customer.email}
								</div>
								<div className="slotcard__customerinfo__row">
									<span className="material-icons" style={{opacity:0}}>face</span> <span className="material-icons">phone</span> {payment.customer.phone}
								</div>
								</>)
						})}
					</> }
				</div>
				{next_meeting.meeting.reservations_taken > 0 && <hr/>}
				{next_meeting.meeting.reservations_taken > 0 && <div className="slotcard__scheduleinfo">
						<div className="slotcard__scheduleinfo__row"><span className="material-icons">class</span> <b>{next_meeting.course.course_number}</b> </div>
						<div className="slotcard__scheduleinfo__row"><span className="material-icons">room</span> {({"in-person":"On Campus", "online":"Online"})[next_meeting.meeting.course_style]}</div>
						<div className="slotcard__scheduleinfo__row"><span className="material-icons">group</span> <span>{(["The tutor, all by themselves!!", "One-on-One", "One-on-Two"])[next_meeting.meeting.capacity] || "One-on-"+next_meeting.meeting.capacity}</span></div>
				</div>}
				{/*<div className="slotcard__buttontray">
					<Link to={"billing/"+next_meeting.meeting.slot}><Button secondary> Future Meetings </Button></Link>
						{can_skip_next_meeting && <Button onClick={() => setSkipConfirmOpen(true)} > Skip Next Class </Button>}
				</div>*/}
		</section>
	)
}

export default function TutorsDashboard(props) {
	let [slots, setSlots] = useState({});
	let [error, setError] = useState(null);

	let refresh_dashboard = async () => {
		try {
			let resp = await fetch("/api/tutors/myself/slots");
			let json = await resp.json();
			if(json.error) {
				setError(({})[json.error.type] || json.error.type)
			}
			setSlots(json.data);
		} catch(e) {
			setError("Cannot communicate with server");
		}
	}

	useEffect(() => {
		refresh_dashboard();
	}, [])

	return (<>	
		<style>
				body {"{ background-color:#F8FAFC };" }
		</style>
		<Header title="Your Classes"/>
			<main className="customer_dashboard_main container">
				{Object.keys(slots).map((slot_id) => (<>
					<TutorDashboardSlot {...slots[slot_id]} />
					</>))}
			</main>
	</>)
}
