// supercedes CustomerDashboard
import {Check, Class, CreditCard, Edit, Event, EventRepeat, Face, Group, History, LocationOn, Pending, School} from "@mui/icons-material"
import {Card} from "@mui/material"
import {useEffect, useState} from "react"
import DateTimePicker from "react-datetime-picker"
import {Link, useNavigate} from "react-router-dom"
import {Button, Chip, get_date_info, Modal} from "./Components"
import "./StudentDashboard.scss"

function DashNavButton({active, icon, title, onClick, href, ...props}) {
	let indicatorclasses = ["dash__nav__button__indicator"]
	if(active) {
		indicatorclasses.push("dash__nav__button__indicator--active")
	}
	const navigate = useNavigate()
	return (
		<div className="dash__nav__button" onClick={() => {
			if(onClick) {
				onClick()
			}
			if(href) {
				navigate(href)
			}
		}}>
			<div className={indicatorclasses.join(" ")}>
			</div>
			<div className="dash__nav__button__icon__container">
				{icon}
			</div>
			<div className="dash__nav__button__title">
				{title}
			</div>
		</div>	
	)
}

export function DashNav({ id, page, customer, ...props }) {
	//sidebar on desktop, tray on mobile
	//TODO: make position fixed
	return (
		<div className="dash__nav">
			<div className="dash__nav__header">
				<div className="dash__nav__header__name">
					Hi {customer && customer.firstname}!
				</div>
				<div className="dash__nav__header__details">
					{customer?.credits > 0 && <div className="dash__nav__header__details__item">
						{customer.credits} credits
					</div>}
				</div>
			</div>
			 <div className="dash__nav__buttons">
				<DashNavButton href="/student/dashboard" active={page==="upcoming"} title="Upcoming" icon={<Event />} />
				<DashNavButton href="/student/dashboard/history" active={page==="history"} title="Booking History" icon={<History />} />
			</div>
		</div>
	)
}

export default function StudentDashboard({ page, ...props}) {
	//Tech Debt: to correct, switch to using Outlet
	const [customer, setCustomer] = useState(null)

	useEffect(() => {
		const load_customer = async () => {
			const customerresp = await fetch("/api/customers/myself");
			const customerdata = await customerresp.json();

			setCustomer(customerdata.data)
		}
		load_customer()
	},[])

	return (
		<div className="dash">
			<DashNav page={page} customer={customer}/>
			<div className="dash__content">
				{page === "upcoming" && <Sessions />}
				{page === "history" && <Sessions history />}
			</div>
		</div>
	)
}

// a  person element
function Person({name, phone, email, imgsrc, imgletter, empty, payment_status, ...props}) {
	let phone_friendly = empty ? "This slot is unbooked" : phone.toString();
	// in case of leading ones/country codes, i'm indexing from the end of the string
	if(!empty) {
		phone_friendly = phone_friendly.substring(0, phone_friendly.length - 7)+"-"+phone_friendly.substring(phone_friendly.length-7, phone_friendly.length - 4)+"-"+phone_friendly.substring(phone_friendly.length - 4)
	}

	return (
		<div className="person">
			{imgsrc && <img className="person__profile" src={imgsrc} alt={`${name} headshot`}/>}
			{!imgsrc && <div className="person__profile--text">{name && name.charAt(0)}{empty && <Pending/>}</div>}
			<div className="person__details">
				<div className="person__details__item person__details__item--name">
					{!empty && name}
					{!empty && <EventRepeat className={["fixicon person__details__subicon", (props.subicon ? "person__details__subicon--active" :"")].join(" ")}/>}
				</div>
				{payment_status && <div className="person__details__item person__details__item--payment">
					Payment {({"processing":"Processing", "succeeded":"Complete", "subscription_pending":"Scheduled", "requires_payment_method": "Failed", "canceled":"Canceled/Refunded"})[payment_status] || payment_status}
				</div>}
				<div className="person__details__item">{phone_friendly}</div>
				<div className="person__details__item">{!empty && email}</div>
			</div>
		</div>
	)
}

function CancelModal({subscription, payment, isSubscription, isTutor, meeting, close, reload}) {
	const [error, setError] = useState(null)
	const [success, setSuccess] = useState(null)

	let cancel_payment = async () => {
		let cancelresp = await fetch(`/api/payments/${payment.id}/skip`, {method:"POST"});
		let canceldata = await cancelresp.json();

		if(canceldata.error) {
			setError(canceldata.error.type)
		} else {
			setSuccess("Meeting")
		}
		reload()
	 }

	let cancel_subscription = async () => {
		let cancelresp = await fetch(`/api/subscriptions/${subscription.id}/cancel`, {method:"POST"});
		let canceldata = await cancelresp.json();

		if(canceldata.error) {
			setError(canceldata.error.type)
		} else {
			setSuccess("Subscription")
		}
		reload()
	}

	let cancel_tutor_meeting = async () => {
		let cancelresp = await fetch(`/api/meetings/${meeting.id}/cancel`, {method:"POST"});
		let canceldata = await cancelresp.json();

		if(canceldata.error) {
			setError(canceldata.error.type)
		} else {
			setSuccess("Tutor Meeting")
		}
		reload()
	}

	let secondaries = [{text:"Skip Meeting", onClick:cancel_payment}]

	let guilttrip = <>Somebody else may register for this meeting if you cancel it. Additionally, if you take fewer tutoring sessions than required by our <Link to="/terms">terms</Link>, you may not qualify for the passCS Guarantee.</>

	if(isSubscription) {
		secondaries.push({text:"End Subscription", onClick: cancel_subscription})
		guilttrip = <>By unsubscribing, you may lose your current pricing and another student may book your seat. If you didn't meet the minimum number of sessions as specified in our <Link to="/terms">terms</Link>, you may be ineligible for the passCS Guarantee </>
	} 
	if(isTutor) {
		secondaries = [{text:"Cancel Meeting", onClick:cancel_tutor_meeting}]
		guilttrip = <>Do you really want to cancel this meeting? If there are any customers, they will be notified and refunded (pending payments will be canceled). Future customers that sign up for the slot will never be billed for this meeting.</>
	}

	if(!success) return (
		<Modal close={close} title="Are you sure?" buttons={{primary:{text:"Nevermind", onClick:close}, secondaries:secondaries}}>
			{guilttrip}
			{error && <div className="genericError">{error}</div>}
		</Modal>
	)
	else return (
		<Modal close={close} title={success+" canceled"} buttons={{primary:{text:"Close", onClick:close}, secondaries:[]}}>
		</Modal>
	)
}

export function MeetingNotesForm({meeting, reload, ...props}) {
	let [notes, setNotes] = useState(meeting.notes || "");

	let submit = async () => {
		let form_data = new FormData();
		form_data.append("notes", notes);
		let notesresp = await fetch(`/api/meetings/${meeting.id}/notes`, {method:"POST", body:form_data});
		let notesdata = await notesresp.json();
		reload()
	};

	return (<div className="meeting_notes">
		<label htmlFor="meeting_notes__input" className="meeting__body__section__title">One-Line Meeting Summary:</label>
		<div className="meeting_notes__oneline">
			<input value={notes} onChange={(e) => setNotes(e.target.value)} type="text" className={["meeting_notes__input", (meeting.notes === null || meeting.notes === "" ? "angry" : "")].join(" ")}></input>
			<Button onClick={submit}><Check/></Button>
		</div>
		{(meeting.notes === null || meeting.notes === "") && "Please enter a summary to get paid for this session. "}
		{(!(meeting.notes == null && notes === "") && meeting.notes !== notes) && "Remember to submit!"}
	</div>)
}

function EditScheduleModal({meeting, close, reload, ...props}) {
	let [occurrenceEpoch, setOccurrenceEpoch] = useState(new Date(meeting.occurrence_epoch*1000));
	let [duration, setDuration] = useState(meeting.duration_mins);

	let submit = async () => {
		// first update the occurrence

		// then update the duration
		let form_data = new FormData();
		form_data.append("duration_mins", duration);
		let durationresp = await fetch(`/api/meetings/${meeting.id}/duration_mins`, {method:"POST", body:form_data});
		let durationdata = await durationresp.json();

		reload()
		close()
	}

	return (
		<Modal close={close} title="Edit Meeting Time + Duration" buttons={{secondaries:[{text:"Close", onClick:close}], primary:{text:"Update", onClick: submit}}} >
			Start time:<br/>
			<DateTimePicker value={occurrenceEpoch} onChange={(date)=>{setOccurrenceEpoch(date)}}/><br/><br/>
			Duration:<br/>
			<input type="number" value={duration} onChange={(e)=>{setDuration(parseInt(e.target.value))}} disabled={Date.parse(occurrenceEpoch)/1000 >= Date.now()/1000}/> minutes<br/>
			{duration > 60 + 15 && <>The customer will be charged by rounding to the nearest 30 minutes. <br/></>}
			{occurrenceEpoch >= Date.now()/1000 && <>Meeting duration may only be changed after the meeting starts. <br/></>}
			{duration < meeting.duration_mins && <>Decreasing a meeting's duration will not result in any refund to the customer</>}
		</Modal>
	)
}

/**
 * Only define payment if this is being displayed to a student
 * Only define payments if this is being displayed to a tutor
 * @param props.display_notes Whether to display notes form
 */
export function Meeting({ payment, payments, meeting, display_notes, reload, ...props }) {
	let date = new Date(meeting.occurrence_epoch*1000);
	let end = new Date(meeting.occurrence_epoch*1000 + meeting.duration_mins*60*1000);
	let dateinfo = get_date_info(date)
	let endinfo = get_date_info(end)

	// modal to let tutors change the occurrence_epoch and duration of the meeting
	const [editScheduleModal, setEditScheduleModal] = useState(false);

	let [confirmCancel, setConfirmCancel] = useState(null);
	console.log(meeting);

	// TODO: get and calculate offset epoch from backend
	let show_footer = props.show_footer || meeting.occurrence_epoch*1000 > Date.now()
	return (
		<div title={meeting.id} className="meeting">
			{confirmCancel && <CancelModal reload={reload} close={()=>setConfirmCancel(null)} subscription={payment?.subscription} payment={payment} meeting={meeting} isTutor={confirmCancel==="tutor_meeting"} isSubscription={confirmCancel==="subscription"} />}
			{editScheduleModal && <EditScheduleModal reload={reload} close={()=>setEditScheduleModal(false)} meeting={meeting} />}
			<div className="meeting__header">
				<div className="meeting__header__datetime">
					<span className="meeting__header__date">
						{display_notes && (meeting.notes == "" || meeting.notes == null) && "• "}
						{`${dateinfo.weekday}, ${dateinfo.month} ${date.getDate()}`}
					</span>
					<span className="meeting__header__time">
						{dateinfo.hours}:{dateinfo.minutes}{dateinfo.am ? "am":"pm"} - {endinfo.hours}:{endinfo.minutes}{endinfo.am ? "am":"pm"}
					</span>
					{payments != null && <span className="meeting__header__edit">
						<Edit onClick={() => setEditScheduleModal(true)}/>
					</span>}
				</div>
				<div className="meeting__header__chips">
					{meeting?.offering?.course?.course_name && <Chip	white icon={<Class />}>
						{meeting?.offering?.course?.course_name}
					</Chip>}
						{meeting.course_style && <Chip	white icon={<LocationOn />}>
						{({"online":"Online", "in-person":"On Campus"})[meeting.course_style] || meeting.course_style}
					</Chip>}
					{meeting.capacity && <Chip	white icon={<Group />}>
						{(["Empty","One-on-One","Group-of-Two"])[meeting.capacity] || "Group of "+meeting.capacity}
					</Chip>}
					{/* if we're displaying a particular payment (i.e. to a customer, then display the details up here*/}
					{payment && <Chip	white icon={<CreditCard />}>
						{({"processing":"Processing", "succeeded":"Complete", "subscription_pending":"Scheduled", "requires_payment_method": "Failed", "canceled":"Canceled/Refunded"})[payment.payment_status] || payment.payment_status}
					</Chip>}
				</div>
			</div>
			<div className={["meeting__body", (show_footer ? "meeting__body--middle" : "")].join(" ")}>
				<div className="meeting__body__section">
					<div className="meeting__body__section__title">
						{payment && "Your tutor"}
						{!payment && "Your customers"}
					</div>
					<div className="meeting__body__section__people">
						{payment && <Person imgsrc={"/"+encodeURIComponent(meeting.offering.tutor.id)+".jpg"} name={meeting.offering.tutor.name} phone={meeting.offering.tutor.phone} email={meeting.offering.tutor.email} />}
						{payments && payments.map((pymt) => <Person name={pymt.customer.firstname} payment_status={pymt.payment_status} phone={pymt.customer.phone} email={pymt.customer.email} subicon={pymt.subscription} />)}
						{payments && payments.length === 0 && <Person empty />}
					</div>
				</div>
				{display_notes && <><hr/><MeetingNotesForm meeting={meeting} reload={reload}/></>}
			</div>
			{show_footer && <div className="meeting__footer">
				{payments != null && <Button onClick={() => setConfirmCancel("tutor_meeting")} secondary>Cancel Meeting</Button>}
				{payment?.subscription != null && <Button onClick={() => setConfirmCancel("subscription")} secondary>Cancel Subscription</Button>}
				{payment && <Button onClick={() => setConfirmCancel("meeting")}>Skip Meeting</Button>}
			</div>}
		</div>
	)
}

export function Sessions({history, ...props}) {
	const [payments, setPayments] = useState(null)
	const [error, setError] = useState(null)

	const navigate = useNavigate();
	
	let load_payments = async () => {
		let paymentsresp = await fetch("/api/customers/myself/payments"); 
		let paymentsdata = await paymentsresp.json()
		if(paymentsdata.status === "failure") {
			if(paymentsdata.error === "NotAuthorized") {
				navigate("/")
				return;
			}

			setError(paymentsdata.error)
			return;
		}

		if(history) {
			setPayments(paymentsdata.data.filter((pymt)=>{ return pymt.meeting.occurrence_epoch*1000 < Date.now()}))
		} else {
			setPayments(paymentsdata.data.filter((pymt)=>{ return pymt.meeting.occurrence_epoch*1000 > Date.now()}))
		}
	}

	useEffect(() => {
		load_payments();
	}, [navigate])

	return (
	<>
		<h2 className="dash__content__title">
			{history && "Previous Sessions"}
			{!history && "Upcoming Sessions"}
		</h2>
		<div className="dash__content__meetings">
			{payments && payments.map((payment) => <Meeting reload={load_payments} key={payment.id} payment={payment} meeting={payment.meeting} />)}
		</div>
	</>
	)
}
