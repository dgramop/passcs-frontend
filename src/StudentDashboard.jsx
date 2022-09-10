// supercedes CustomerDashboard
import {CreditCard, Event, Face, Group, History, LocationOn} from "@mui/icons-material"
import {Card} from "@mui/material"
import {useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import {Chip, get_date_info} from "./Components"
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
function Person({name, phone, email, imgsrc, imgletter, ...props}) {
	let phone_friendly = phone.toString();
	// in case of leading ones/country codes, i'm indexing from the end of the string
	phone_friendly = phone_friendly.substring(0, phone_friendly.length - 7)+"-"+phone_friendly.substring(phone_friendly.length-7, phone_friendly.length - 4)+"-"+phone_friendly.substring(phone_friendly.length - 4)
	return (
		<div className="person">
			<img className="person__profile" src={imgsrc} alt={`${name} headshot`}/>
			<div className="person__details">
				<div className="person__details__item person__details__item--name">{name}</div>
				<div className="person__details__item">{phone_friendly}</div>
				<div className="person__details__item">{email}</div>
			</div>
		</div>
	)
}

export function Meeting({ payment, ...props }) {
	let date = new Date(payment.meeting.occurrence_epoch*1000);
	let end = new Date(payment.meeting.occurrence_epoch*1000 + payment.meeting.slot.duration_mins*60*1000);
	let dateinfo = get_date_info(date)
	let endinfo = get_date_info(end)
	return (
		<div className="meeting">
			<div className="meeting__header">
				<div className="meeting__header__datetime">
					<span className="meeting__header__date">
						{`${dateinfo.weekday}, ${dateinfo.month} ${date.getDate()}`}
					</span>
					<span className="meeting__header__time">
						{dateinfo.hours}:{dateinfo.minutes}{dateinfo.am ? "am":"pm"} - {endinfo.hours}:{endinfo.minutes}{endinfo.am ? "am":"pm"}
					</span>
				</div>
				<div className="meeting__header__chips">
					<Chip	white icon={<LocationOn />}>
						{({"online":"Online", "in-person":"On Campus"})[payment.meeting.course_style] || payment.meeting.course_style}
					</Chip>
					<Chip	white icon={<Group />}>
						{(["Empty","One-on-One","Group-of-Two"])[payment.meeting.capacity] || "Group of "+payment.meeting.capacity}
					</Chip>
					<Chip	white icon={<CreditCard />}>
						{({"processing":"Processing", "succeeded":"Complete", "subscription_pending":"Scheduled", "requires_payment_method": "Failed", "canceled":"Canceled/Refunded"})[payment.payment_status] || payment.payment_status}
					</Chip>
				</div>
			</div>
			<div className="meeting__body">
				<div className="meeting__body__section">
					<div className="meeting__body__section__title">
						Your tutor
					</div>
					<div className="meeting__body__section__people">
						<Person imgsrc={"/"+encodeURIComponent(payment.meeting.offering.tutor.id)+".jpg"} name={payment.meeting.offering.tutor.name} phone={payment.meeting.offering.tutor.phone} email={payment.meeting.offering.tutor.email} />
					</div>
				</div>
			</div>
		</div>
	)
}

export function Sessions({history, ...props}) {
	const [payments, setPayments] = useState(null)
	const [error, setError] = useState(null)

	const navigate = useNavigate();

	useEffect(() => {
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
		load_payments();
	}, [navigate])

	return (
	<>
		<h2 className="dash__content__title">
			{history && "Previous Sessions"}
			{!history && "Upcoming Sessions"}
		</h2>
		<div className="dash__content__meetings">
			{payments && payments.map((payment) => <Meeting key={payment.id} payment={payment} />)}
		</div>
	</>
	)
}
