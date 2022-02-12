import './CustomerDashboard.scss';
import { Button, Modal} from './Components';
import { useState } from "react";

/**
 * @param {props.title} Class name for the slotcard
 */
function SlotCard(props) {
		let color_index = 0;
		let course_integer = props.course.match(/[0-9]+/g)
		if(course_integer && course_integer.length > 0 && parseInt(course_integer[0])) {
				color_index = parseInt(course_integer[0])%5;
		}

		let [skipConfirmOpen, setSkipConfirmOpen] = useState(false);

		let next_class = "3/11/22";
		let next_class_meeting_id = 0; //used by skip

		return (
		<section className="slotcard">
				<div className={"slotcard__header "+(["slotcard__header--blue", "slotcard__header--red", "slotcard__header--green", "slotcard__header--orange", "slotcard__header--purple"])[color_index]}>
						{props.course}
				</div>
				<div className="slotcard__tutorinfo">
						<img className="slotcard__tutorinfo__photo" src={"/"+props.tutor.id+".jpg"} alt={props.tutor.name+"'s photo"}/>
						<div className="slotcard__tutorinfo__attrs">
								<div className="slotcard__tutorinfo__attr slotcard__tutorinfo__attr--name">{props.tutor.name}</div>
								<div className="slotcard__tutorinfo__attr">{props.tutor.email}</div>
								<div className="slotcard__tutorinfo__attr">{props.tutor.phone}</div>
						</div>
				</div>
				<hr/>
				<div className="slotcard__scheduleinfo">
						<div className="slotcard__scheduleinfo__row"><span className="material-icons">room</span> On Campus</div>
						<div className="slotcard__scheduleinfo__row"><span className="material-icons">event_note</span> Mondays 1-2pm</div>
						<div className="slotcard__scheduleinfo__row"><span className="material-icons">event</span> Next: <span className="mild_emph">{next_class}</span></div>
						<div className="slotcard__scheduleinfo__row"><span className="material-icons">group</span> <span>One-on-One</span></div>
				</div>
				<div className="slotcard__buttontray">
						<Button secondary> Manage Billing </Button>
						{/* TODO if payment has already been made for the upcoming class, disable the button */}
						<Button onClick={() => setSkipConfirmOpen(true)} > Skip Next Class </Button>
				</div>
				{skipConfirmOpen && <Modal title="Skip Next Meeting" close={() => setSkipConfirmOpen(false)} buttons={
						{
								primary: {
										text: "Skip Your "+next_class+" Class",
										onClick: () => alert("not implemented")
								},
								secondaries: [
								{
										text: "Go Back",
										onClick: () => setSkipConfirmOpen(false)
								}
								]
						}
						}>
						Skipping your next meeting may reduce the total number of classes you take by the end of the semester, and could impact your eligibility for the passCS Guarentee. In order to qualify, you must take at least 12 classes (<a href="/terms" target="_blank">see other terms</a>)
				</Modal>}
		</section>
		);
}


export default function CustomerDashboard(props) {
		let [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
		return (
				<>
						<header className="header">
								<div className="header__content">
										<img className="header__icon" src={"/flag192.png"} alt="passCS icon: a green pennant flag"/>
										<h1 className="header__title"> Your Classes </h1>
								</div>
						</header>
						<main className="customer_dashboard_main container">
								<SlotCard course="CS262" tutor={{id:1, name:"Dhruv", email:"dhruv@passcs.io", phone: 571524303}} slot={{}} meetings={{}} />
								<SlotCard course="CS310" tutor={{id:3, name:"Akshay", email:"dhruv@passcs.io", phone: 571524303}} slot={{}} meetings={{}} />
						</main>
				</>
		)
}
