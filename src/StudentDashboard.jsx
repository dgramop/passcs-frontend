// supercedes CustomerDashboard
import {Event, History} from "@mui/icons-material"
import {useState} from "react"
import "./StudentDashboard.scss"

export function DashNav({ id, page, ...props }) {

	//sidebar on desktop, tray on mobile
	return (
		<div className="dash__nav">
			<div className="dash__nav__header">
				<div className="dash__nav__header__name">
					Stud Ent
				</div>
				<div className="dash__nav__header__details">
					<div className="dash__nav__header__details__item">
						ID{id}
					</div>
					<div className="dash__nav__header__details__item">
						0 credits
					</div>
				</div>
			</div>
			 <div className="dash__nav__buttons">
			{page === "upcoming" &&	<div className="dash__nav__button">
					<div className="dash__nav__button__indicator">
					</div>
					<div className="dash__nav__button__icon__container">
						<Event />
					</div>
					<div className="dash__nav__button__title">
						Upcoming
					</div>
				</div>}

				{page === "history" && <div className="dash__nav__button">
					<div className="dash__nav__button__indicator">
					</div>
					<div className="dash__nav__button__icon__container">
						<History />
					</div>
					<div className="dash__nav__button__title">
						Booking History
					</div>
				</div> }
			</div>
		</div>
	)
}

export default function StudentDashboard({ children, ...props}) {
	return (
		<div className="dash">
			<DashNav />
			<div className="dash__content">
				{props.children}
			</div>
		</div>
	)
}

// a  person element
function Person({name, phone, email, imgsrc, imgletter, ...props}) {
	return (
		<div className="person">
			{name}
			{phone}
			{email}
			<img src={imgsrc} alt={`${name} headshot`}/>
		</div>
	)
}

export function Meeting({ ...props }) {
	return (
		<div className="meeting">
			<div className="meeting__header">
				<div className="meeting__header__datetime">
					<span className="meeting__header__date">
						Tuesday March 13th
					</span>
					<span className="meeting__header__time">
						12:00pm - 1pm
					</span>
				</div>
			</div>
			<div className="meeting__body">
				<div className="meeting__body__section">
					<div className="meeting__body__section__title">
						Your tutor
					</div>
					<div className="meeting__body__section__people">
						<Person imgsrc="" name="Dhruv" phone="5715243033" email="dhruv@passcs.io" />
					</div>
				</div>
			</div>
		</div>
	)
}

export function PreviousSessions({...props}) {
	const [meetings, setMeetings] = useState(null)

	return (
	<>
		<div className="dash__content__title">
		</div>
		<div className="dash__content__meetings">
		</div>
	</>
	)
}
