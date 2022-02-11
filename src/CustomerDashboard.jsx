import './CustomerDashboard.scss';

/**
 * @param {props.title} Class name for the slotcard
 */
function SlotCard(props) {
		let color_index = 0;
		let course_integer = props.course.match(/[0-9]+/g)
		if(course_integer && course_integer.length > 0 && parseInt(course_integer[0])) {
				color_index = parseInt(course_integer[0])%5;
		}

		return (
		<section className="slotcard">
				<div className={"slotcard__header "+(["slotcard__header--blue", "slotcard__header--red", "slotcard__header--green", "slotcard__header--orange", "slotcard__header--purple"])[color_index]}>
						{props.course}
				</div>
				<div className="slotcard__tutorinfo">
						<img className="slotcard__tutorinfo__photo" src={props.photo} alt={props.tutor.name+"'s photo"}/>
						<div className="slotcard__tutorinfo_attrs">
								<div className="slotcard__tutorinfo__attr slotcard__tutorinfo__attr--name">{props.tutor.name}</div>
								<div className="slotcard__tutorinfo__attr">{props.tutor.email}</div>
								<div className="slotcard__tutorinfo__attr">{props.tutor.phone}</div>
						</div>
				</div>
				<hr/>
				<div className="slotcard__scheduleinfo">
						<div className="slotcard__scheduleinfo_row"><span className="material-icons">room</span> On Campus</div>
						<div className="slotcard__scheduleinfo_row"><span className="material-icons">event_note</span> Mondays 1-2pm</div>
						<div className="slotcard__scheduleinfo_row"><span className="material-icons">event</span> Next: <span className="mild_emph">3/14/22</span></div>
						<div className="slotcard__scheduleinfo_row"><span className="material-icons">group</span> One-on-One</div>
				</div>
		</section>
		);
}

export default function CustomerDashboard(props) {
		return (
				<>
						<header className="header">
								<div className="header__content">
										<span className="material-icons header__icon">class</span>
										<h1 className="header__title"> Your Classes </h1>
								</div>
						</header>
						<main>
								<SlotCard course="CS262" tutor={{name:"Dhruv", email:"dhruv@passcs.io", phone: 571524303}} slot={{}} meetings={{}}/>
						</main>
				</>
		)
}
