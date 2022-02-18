import './CustomerDashboard.scss';
import {DAYS_OF_THE_WEEK, timezone_time_from_slot, Button, Modal, get_next_meeting, Header} from './Components';
import {useState, useEffect} from "react";
import {Routes, Route, Link, useParams, Navigate} from "react-router-dom";

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

async function cancel_subscription(subscription_id) {
		try {
				let req = await fetch("/subscriptions/"+subscription_id+"/cancel", { method: "POST" });
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
		let next_meeting = get_next_meeting(props.meeting_info);

		let color_index = 0;
		let course_integer = next_meeting.course.course_number.match(/[0-9]+/g)
		if(course_integer && course_integer.length > 0 && parseInt(course_integer[0])) {
				color_index = parseInt(course_integer[0])%5;
		}

		let [skipConfirmOpen, setSkipConfirmOpen] = useState(false);


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
						<Link to={"billing/"+next_meeting.meeting.slot}><Button secondary> Manage Billing </Button></Link>
						{can_skip_next_meeting && <Button onClick={() => setSkipConfirmOpen(true)} > Skip Next Class </Button>}
				</div>
				{skipConfirmOpen && <SkipModal next_meeting_date={next_meeting_date} close={() => setSkipConfirmOpen(false)} next_meeting={next_meeting} update={props.update}/>}
		</section>
		);
}

function SkipModal(props) {
		let [skipLoading, setSkipLoading] = useState(false);
		return (<Modal title="Skip Next Meeting" close={() => props.close()} buttons={
						{
								primary: {
										text: "Skip Your "+(props.next_meeting_date.getMonth()+1)+"/"+props.next_meeting_date.getDate()+" Class",
										onClick: async () => { 
												setSkipLoading(true);
												await skip_payment(props.next_meeting.payment);
												await props.update();
												setSkipLoading(false);
												props.close();
										},
										disabled: skipLoading
								},
								secondaries: [{
										text: "Go Back",
										onClick: () => props.close()
								}]
						}
						}>
						Skipping your next meeting may reduce the total number of classes you take by the end of the semester, and could impact your eligibility for the passCS Guarentee. In order to qualify, you must take at least 12 classes (<a href="/terms" target="_blank">see other terms</a>)
				</Modal>)
}


export default function CustomerDashboard(props) {

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

		//TODO: get rid of styling hack?
		return (<>
				<style>
						body {"{ background-color:#F8FAFC };" }
				</style>

				<Routes>
						<Route index element={<>
										<Header title="Your Classes"/>
										<main className="customer_dashboard_main container">
												{slots && Object.keys(slots).map((slot_id) => (
														<SlotCard {...slots[slot_id]} update={get_slots} />
												))}
												{error && <span className="form__error">{error}</span>}
										</main>
						</>}/>
						<Route path="billing/:slot_id" element={<BillingInfo slots={slots} update={() => get_slots()}/>}/>
				</Routes></>
		)
}

function BillingInfo(props) {
		let [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
		let [cancelModalOpen, setCancelModalOpen] = useState(false)
		let params = useParams();
		if(!params || !params.slot_id || props.slots == null || props.slots[params.slot_id]==null) {
				return (
						<Navigate replace to="/dashboard" />
				);
		};
		let next_meeting = get_next_meeting(props.slots[params.slot_id].meeting_info)
		let subscription_string = "disabled"
		if(props.slots[params.slot_id].subscription) {
			subscription_string = props.slots[params.slot_id].subscription?.payment_status.replace("_", " ") || "";
			if(subscription_string==="trialing") subscription_string = "Active";
		} 		

		let can_skip_next_meeting = next_meeting.payment.payment_status === "subscription_pending" 

		let cancelbuttonconfig = {
				primary: {
						text: "Go Back",
						onClick: () => setCancelModalOpen(false)
				},
				secondaries: [
						{
								text: "End Upcoming Payments",
								onClick: async () => {
										await cancel_subscription(props.slots[params.slot_id].subscription.id);
										await props.update()
										setCancelModalOpen(false);
								},
								extraClasses: "button--secondary--red"
						},
						
				]
		}

		if(can_skip_next_meeting) {
				cancelbuttonconfig.secondaries.push({ 
						text: "Skip Next Meeting",
						onClick: () => {
								setCancelModalOpen(false);
								setSkipConfirmOpen(true);
						}
				})
		}

		return (
				<>
						{cancelModalOpen && <Modal title="Confirm Cancellation" close={()=>setCancelModalOpen(false)} buttons={cancelbuttonconfig}>
								Cancelling all of your scheduled meetings with passCS early may disqualify you from the passCS Guarentee (see <a href="terms">terms</a>).
						</Modal> }
						{skipConfirmOpen && <SkipModal next_meeting_date={new Date(next_meeting.meeting.occurrence_epoch * 1000)}  next_meeting={next_meeting} update={props.update} close={() => {setSkipConfirmOpen(false)}} />}
						<Header title="Billing Details" />
						<main className="container">
								<Link to="/dashboard"><div className="paymenthistory__back"><span className="material-icons">west</span> <span>My Classes</span></div></Link>
								<div className="paymenthistory">
										<div className="paymenthistory__title">
												Payment History
										</div>
										<table>
												<thead className="paymenthistory__tableheader">
														<td>Due</td>
														<td>Status</td>
														{/* TODO<td>Amount</td>*/}
												</thead>
												<tbody>
														{props.slots[params.slot_id].meeting_info.map((meeting_info) => {
																let due_date = new Date(meeting_info.meeting.occurrence_epoch*1000);
																return (
																<tr id={meeting_info.meeting.id}>
																		<td className="paymenthistory__duedate">
																				{due_date.getMonth()+1}/{due_date.getDate()}/{due_date.getFullYear()}
																		</td>
																		<td className={"paymenthistory__paymentstatus "+((({"succeeded":"paymenthistory__paymentstatus--succeeded","subscription_pending":"paymenthistory__paymentstatus--subscription_pending", "processing":"paymenthistory__paymentstatus--processing"})[meeting_info.payment.payment_status] || "paymenthistory__paymentstatus--error"))}>
																				{({"requires_confirmation":"Skipped","succeeded":"Succeeded","subscription_pending":"Scheduled", "processing":"Processing"})[meeting_info.payment.payment_status]}
																		</td>
																</tr>
																)
														})}
												</tbody>
										</table>
										<div className="paymenthistory__buttontray">
												<div className={
														"paymenthistory__paymentstatus "+((({"active":"paymenthistory__paymentstatus--succeeded",
														"trialing":"paymenthistory__paymentstatus--succeeded",
														"incomplete":"paymenthistory__paymentstatus--processing",
														"incomplete-expired":"paymenthistory__paymentstatus--processing",
														"unpaid":"paymenthistory__paymentstatus--error",
														"canceled":"paymenthistory__paymentstatus--error",
														"past_due":"paymenthistory__paymentstatus--error",
														"incomplete_expired":"paymenthistory__paymentstatus--error"
												})[props.slots[params.slot_id].subscription?.payment_status || "processing"]) || "paymenthistory__paymentstatus--error")}>
														Autopay {subscription_string}
												</div>

												<Button disabled={props.slots[params.slot_id].subscription == null || (props.slots[params.slot_id].subscription.payment_status!=="active" && props.slots[params.slot_id].subscription.payment_status!=="trialing" )} onClick={()=> setCancelModalOpen(true)}>
														End Payments
												</Button>
										</div>
								</div>
						</main>
				</>
		)
}


