import './CustomerDashboard.scss';
import {DAYS_OF_THE_WEEK, timezone_time_from_slot, Button, Modal} from './Components';
import { useState, useEffect } from "react";
import {Router, Routes, Route} from "react-router-dom";

async function skip_payment(payment) {
		try {
				let req = await fetch("/payments/"+payment.id+"/skip", { method: "POST" });
				let res = await req.json();
				if(res.error) throw res.error;
				else return res;
		} catch(e) {
				if(e.type) throw e;
				else throw {type: "Fetch Error"};
		}
		
}

/**
 * @param {props.title} Class name for the slotcard
 */
function SlotCard(props) {
		let next_meeting = props.meeting_info[0];
		for(let meeting of props.meeting_info) {
				if(meeting.meeting.occurrence_epoch < next_meeting.meeting.occurrence_epoch && next_meeting.meeting.payment_status !== "skipped") {
						next_meeting = meeting;
				}
		}

		let color_index = 0;
		let course_integer = next_meeting.course.course_number.match(/[0-9]+/g)
		if(course_integer && course_integer.length > 0 && parseInt(course_integer[0])) {
				color_index = parseInt(course_integer[0])%5;
		}

		let [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
		let [skipLoading, setSkipLoading] = useState(false);


		let {weekday, start_hour} = timezone_time_from_slot(props.slot);
		let start_hour_str = start_hour%12 === 0 ? "12" : start_hour%12;
		let end_hour = (start_hour+props.slot.duration_mins/60);
		let end_hour_str = end_hour%12 === 0 ? "12" : end_hour%12;
		let timestring = `${DAYS_OF_THE_WEEK[weekday]}${props.meeting_info.length > 1 ? "s" : ""} ${start_hour_str}-${end_hour_str} ${end_hour >= 12 ? "pm" : "am"}`;
		let next_meeting_date = new Date(next_meeting.meeting.occurrence_epoch*1000);

		//if the next meeting has not been paid for
		let can_skip_next_meeting = next_meeting.payment.payment_status === "subscription_pending" 
		
		return (
		<section className="slotcard">
				<div className={"slotcard__header "+(["slotcard__header--blue", "slotcard__header--red", "slotcard__header--green", "slotcard__header--orange", "slotcard__header--purple"])[color_index]}>
						{next_meeting.course.course_number}
				</div>
				<div className="slotcard__tutorinfo">
						<img className="slotcard__tutorinfo__photo" src={"/"+next_meeting.tutor.id+".jpg"} alt={next_meeting.tutor.name+"'s photo"}/>
						<div className="slotcard__tutorinfo__attrs">
								<div className="slotcard__tutorinfo__attr slotcard__tutorinfo__attr--name">{next_meeting.tutor.name}</div>
								<div className="slotcard__tutorinfo__attr">{next_meeting.tutor.email}</div>
								<div className="slotcard__tutorinfo__attr">{next_meeting.tutor.phone}</div>
						</div>
				</div>
				<hr/>
				<div className="slotcard__scheduleinfo">
						<div className="slotcard__scheduleinfo__row"><span className="material-icons">room</span> {({"in-person":"On Campus", "online":"Online"})[next_meeting.meeting.class_style]}</div>
						<div className="slotcard__scheduleinfo__row"><span className="material-icons">event_note</span> {timestring}</div>
						<div className="slotcard__scheduleinfo__row"><span className="material-icons">event</span> Next: <span className="mild_emph">{next_meeting_date.getMonth() +1}/{next_meeting_date.getDate()}</span></div>
						<div className="slotcard__scheduleinfo__row"><span className="material-icons">group</span> <span>{(["The tutor, all by themselves!!", "One-on-One", "One-on-Two"])[next_meeting.meeting.capacity] || "One-on-"+next_meeting.meeting.capacity}</span></div>
				</div>
				<div className="slotcard__buttontray">
						<Button secondary> Manage Billing </Button>
						{can_skip_next_meeting && <Button onClick={() => setSkipConfirmOpen(true)} > Skip Next Class </Button>}
				</div>
				{skipConfirmOpen && <Modal title="Skip Next Meeting" close={() => setSkipConfirmOpen(false)} buttons={
						{
								primary: {
										text: "Skip Your "+(next_meeting_date.getMonth()+1)+"/"+next_meeting_date.getDate()+" Class",
										onClick: async () => { setSkipLoading(true); await skip_payment(next_meeting.payment); await props.update(); setSkipConfirmOpen(false); setSkipLoading(false) /*TODO: just update this slot, needs backend endpoint*/ },
										disabled: skipLoading
								},
								secondaries: [{
										text: "Go Back",
										onClick: () => setSkipConfirmOpen(false)
								}]
						}
						}>
						Skipping your next meeting may reduce the total number of classes you take by the end of the semester, and could impact your eligibility for the passCS Guarentee. In order to qualify, you must take at least 12 classes (<a href="/terms" target="_blank">see other terms</a>)
				</Modal>}
		</section>
		);
}


export default function CustomerDashboard(props) {
		let [skipConfirmOpen, setSkipConfirmOpen] = useState(false);

		let [slots, setSlots] = useState({});
		let [triedSlots, setTriedSlots] = useState(false); // so we can tell the difference between loading and empty states
		let [error, setError] = useState(null);

		let get_slots = async () => {
						let slots = await fetch("/customers/0/slots");
						let resp = await slots.json();
						if(resp.error) {
								switch(resp.error.type) {
										case "Unauthorized": 
												//change loaction
												break;
										default:
												setError(resp.error.type);
												break;
								}
								setTriedSlots(true);
								return;
						}
						console.log(resp.data)
						setSlots(resp.data);
		}

		useEffect(() => {
				get_slots();
		},[])

		return (
				<Routes>
						<Route path="/" element={<>
										<header className="header">
												<div className="header__content">
														<img className="header__icon" src={"/flag192.png"} alt="passCS icon: a green pennant flag"/>
														<h1 className="header__title"> Your Classes </h1>
												</div>
										</header>
										<main className="customer_dashboard_main container">
												{slots && Object.keys(slots).map((slot_id) => (
														<SlotCard {...slots[slot_id]} update={get_slots} />
												))}
												{error && <span className="form__error">{error}</span>}
										</main>
						</>}/>
						<Route path="billing/:slot" element={<>payments</> }/>
				</Routes>
		)
}
