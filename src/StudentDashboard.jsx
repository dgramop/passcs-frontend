// supercedes CustomerDashboard
import {Check, Class, CreditCard, Edit, Event, EventRepeat, Face, Group, History, LocationOn, Pending, School} from "@mui/icons-material"
import {Card} from "@mui/material"
import {useEffect, useState} from "react"
import DateTimePicker from "react-datetime-picker"
import {Link, Outlet, useNavigate, useOutletContext} from "react-router-dom"
import {Button, Chip, get_date_info, Modal, SidebarButton} from "./Components"
import PaymentFlow from "./PaymentFlow"
import "./StudentDashboard.scss"

export function DashNav({ id, page, customer, ...props }) {
	//sidebar on desktop, tray on mobile
	//TODO: make position fixed
	return (
		<div className="sidebar">
			<div className="sidebar__profilecard sidebar__profilecard--student">
				<div className="sidebar__profilecard__info">
					<div className="sidebar__profilecard__name sidebar__profilecard__name">
						Hi {customer && customer.firstname}!
					</div>
					<div className="sidebar__profilecard__role">
						{customer?.credits > 0 && <div className="dash__nav__header__details__item">
							{customer.credits} credits
						</div>}
					</div>
				</div>
			</div>
			<div className="sidebar__buttons">
				<SidebarButton name="upcoming" selected={page} text="Upcoming" icon={<Event className="fixicon"/>} />
				<SidebarButton name="history" selected={page} text="Booking History" icon={<History className="fixicon"/>} />
			</div>
		</div>
	)
}

export default function StudentDashboard({ ...props}) {
	const [customer, setCustomer] = useState(null)
	const [page, setPage] = useState("upcoming");
	const navigate = useNavigate()

	useEffect(() => {
		const load_customer = async () => {
			try {
				const customerresp = await fetch("/api/customers/myself");
				const customerdata = await customerresp.json();

				if(customerdata.error) {
					throw customerdata.error;
				}

				setCustomer(customerdata.data)
			} catch(e) {
				console.log(e)
				if(e.type === "Unauthorized" || e.type === "NoAuth") {
					navigate("/");
				}
			}
		}
		load_customer()
	},[])

	return (
		<div className="tutorpanel">
			<DashNav page={page} customer={customer}/>
			<div className="booking_container">
				<Outlet context={[page, setPage]}/>
			</div>
		</div>
	)
}

function StudentPayments({payments, ...props}) {
	console.log(payments)

	return (
		<Person 
			name={payments[0].customer.firstname+" "+payments[0].customer.lastname}
			phone={payments[0].customer.phone}
			email={payments[0].customer.email}
			addl_items={payments.sort((a, b) => {return a.inserted_at_epoch > b.inserted_at_epoch}).map((payment) => {
				let overtime = "Payment ";
				if(payment.is_incremental) {
					overtime = "Overtime payment ("+payment.minutes_paid+" mins extra) ";
				}
				return overtime+({"processing":"processing", "succeeded":"complete", "subscription_pending":"scheduled", "requires_payment_method": "failed", "canceled":"canceled/refunded"})[payment.payment_status] || payment.payment_status;
			})}
			subicon={payments[0].subscription} 
		/>
	);
}

// a  person element
function Person({name, phone, email, imgsrc, empty, addl_items, ...props}) {
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
				{addl_items && addl_items.map((item) => <div className="person__details__item person__details__item--payment">
					{item}
				</div>)}
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
	 }

	let cancel_subscription = async () => {
		let cancelresp = await fetch(`/api/subscriptions/${subscription.id}/cancel`, {method:"POST"});
		let canceldata = await cancelresp.json();

		if(canceldata.error) {
			setError(canceldata.error.type)
		} else {
			setSuccess("Subscription")
		}
	}

	let cancel_tutor_meeting = async () => {
		let cancelresp = await fetch(`/api/meetings/${meeting.id}/cancel`, {method:"POST"});
		let canceldata = await cancelresp.json();

		if(canceldata.error) {
			setError(canceldata.error.type)
		} else {
			setSuccess("Tutor Meeting")
		}
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
		<Modal close={()=>{reload(); close()}} title={success+" canceled"} buttons={{primary:{text:"Close", onClick:()=>{reload(); close()}}, secondaries:[]}}>
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
	let [error, setError] = useState(null)

	let submit = async () => {
		setError(null);
		let curError = null;

		if(Math.floor(Date.parse(occurrenceEpoch)/1000) !== meeting.occurrence_epoch) {
			// first update the occurrence (TODO: if the timestamp is different)
			let occurrence_form = new FormData();
			occurrence_form.append("occurrence_epoch", Date.parse(occurrenceEpoch)/1000);
			let occurrenceresp = await fetch(`/api/meetings/${meeting.id}/occurrence_epoch`, {method:"POST", body:occurrence_form});
			let occurrencedata = await occurrenceresp.json();
			if(occurrencedata.error?.type) {
				curError = occurrencedata.error?.type
			}
		}


		if(meeting.duration_mins !== duration) {
			// then update the duration
			let form_data = new FormData();
			form_data.append("duration_mins", duration);
			let durationresp = await fetch(`/api/meetings/${meeting.id}/duration_mins`, {method:"POST", body:form_data});
			let durationdata = await durationresp.json();
			if(durationdata.error?.type) {
				curError = durationdata.error?.type
			}
		}

		setError(curError)
		if(curError == null) {
			reload()
			close()
		}
	}

	return (
		<Modal close={close} title="Edit Meeting Time + Duration" buttons={{secondaries:[{text:"Close", onClick:close}], primary:{text:"Update", onClick: submit}}} >
			Start time:<br/>
			<DateTimePicker value={occurrenceEpoch} onChange={(date)=>{setOccurrenceEpoch(date)}}/><br/><br/>
			{occurrenceEpoch > new Date() && (duration !== 60 || meeting.duration_mins !== 60) && <>Modified duration meetings cannot be rescheduled into the future<br/></>}
			Duration:<br/>
			<input type="number" value={duration} onChange={(e)=>{setDuration(parseInt(e.target.value))}} disabled={Date.parse(occurrenceEpoch)/1000 >= Date.now()/1000}/> minutes<br/>
			{duration > 60 + 15 && <>The customer will be charged by rounding to the nearest 30 minutes. <br/></>}
			{occurrenceEpoch >= Date.now()/1000 && <>Meeting duration may only be changed after the meeting starts. <br/></>}
			{duration < meeting.duration_mins && <>Decreasing a meeting's duration will not result in any refund to the customer</>}
		</Modal>
	)
}

/**
 * @param props.display_notes Whether to display notes form
 */
export function Meeting({ staff, payments, meeting, display_notes, reload, ...props }) {
	let date = new Date(meeting.occurrence_epoch*1000);
	let end = new Date(meeting.occurrence_epoch*1000 + meeting.duration_mins*60*1000);
	let dateinfo = get_date_info(date)
	let endinfo = get_date_info(end)

	let original_payment = payments.reduce((found, payment) => {
		if(!payment.is_incremental) {
			return payment;
		}
		else {
			return found;
		}
	},null)

	// modal to let tutors change the occurrence_epoch and duration of the meeting
	const [editScheduleModal, setEditScheduleModal] = useState(false);

	let [confirmCancel, setConfirmCancel] = useState(null);
	console.log(meeting);

	// TODO: get and calculate offset epoch from backend
	let show_footer = props.show_footer || meeting.occurrence_epoch*1000 > Date.now()
	return (
		<div title={meeting.id} className="meeting">
			{confirmCancel && <CancelModal reload={reload} close={()=>setConfirmCancel(null)} subscription={original_payment?.subscription} payment={original_payment} meeting={meeting} isTutor={confirmCancel==="tutor_meeting"} isSubscription={confirmCancel==="subscription"} />}
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
					{staff && <span className="meeting__header__edit">
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
					{!staff && original_payment && <Chip	white icon={<CreditCard />}>
						{({"processing":"Processing", "succeeded":"Complete", "subscription_pending":"Scheduled", "requires_payment_method": "Failed", "canceled":"Canceled/Refunded"})[original_payment.payment_status] || original_payment.payment_status}
					</Chip>}
				</div>
			</div>
			<div className={["meeting__body", (show_footer ? "meeting__body--middle" : "")].join(" ")}>
				<div className="meeting__body__section">
					<div className="meeting__body__section__title">
						{!staff && "Your tutor"}
						{staff && "Your customers"}
					</div>
					<div className="meeting__body__section__people">
						{!staff && original_payment && <Person imgsrc={"/"+encodeURIComponent(meeting.offering.tutor.id)+".jpg"} name={meeting.offering.tutor.name} phone={meeting.offering.tutor.phone} email={meeting.offering.tutor.email} />}
						{staff && payments && Object.values(payments.reduce((map, payment) => {
							if(map[payment.customer.id]) {
								map[payment.customer.id].push(payment);
							} else {
								map[payment.customer.id] = [payment];
							}
							return map;
						},{})).map((pymts) => <StudentPayments payments={pymts}/>)}
						{staff && payments && payments.length === 0 && <Person empty />}
					</div>
				</div>
				{display_notes && <><hr/><MeetingNotesForm meeting={meeting} reload={reload}/></>}
			</div>
			{show_footer && <div className="meeting__footer">
				{staff && payments != null && <Button onClick={() => setConfirmCancel("tutor_meeting")} secondary>Cancel Meeting</Button>}
				{!staff && original_payment?.subscription != null && <Button onClick={() => setConfirmCancel("subscription")} secondary>Cancel Subscription</Button>}
				{!staff && original_payment && <Button onClick={() => setConfirmCancel("meeting")}>Skip Meeting</Button>}
			</div>}
			{!show_footer && !staff && payments.length > 1 && <div className="meeting__footer meeting__footer--overtime">
				You were billed for {(payments.reduce((minutes, payment)=>{return minutes + payment.minutes_paid}, 0) - original_payment.minutes_paid)/60} hours of extra meeting time{payments.length <= 2 ? <>.</> : <> in {payments.length -1} separate transactions.</>}
			</div>}

		</div>
	)
}

export function Sessions({history, ...props}) {
	const [payments, setPayments] = useState(null)
	const [error, setError] = useState(null)
	const [empty, setEmpty] = useState(true);

	const [page, setPage] = useOutletContext();

	useEffect(() => {
		setPage(history ? "history" : "upcoming");
	}, [setPage, history])

	const navigate = useNavigate();
	
	let load_payments = async () => {
		let paymentsresp = await fetch("/api/customers/myself/payments"); 
		let paymentsdata = await paymentsresp.json()
		if(paymentsdata.status === "failure") {
			if(paymentsdata.error?.type === "NotAuthorized") {
				navigate("/")
				return;
			}

			setError(paymentsdata.error?.type)
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
			{history && !(payments && payments.length === 0) && "Previous Sessions"}
			{!history && !(payments && payments.length === 0) && "Upcoming Sessions"}
			{payments && payments.length === 0 && <>&nbsp;&nbsp;Book a session to get started</>}
		</h2>
		<div className="dash__content__meetings">
			{payments && Object.values(payments.reduce((map, payment)=>{

				// group payments by meetings
				if(map[payment.meeting.id]) {
					map[payment.meeting.id].push(payment);
				} else {
					map[payment.meeting.id] = [payment]
				}

				return map;
			},{})).map((payments) => <Meeting reload={load_payments} key={payments[0].meeting.id} payments={payments} meeting={payments[0].meeting} />)}
			{!history && payments && payments.length === 0 && <PaymentFlow reload={load_payments} className={"studentdash_payflow"} embed />}
			{history && payments && payments.length === 0 && <>You have no previous sessions<Link to="/"><Button primary>Book sessions</Button></Link></>}
		</div>
	</>
	)
}
