// supercedes CustomerDashboard
import {Event, Face, History} from "@mui/icons-material"
import {useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
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
					<div className="dash__nav__header__details__item">
						ID {customer && customer.id}
					</div>
					{customer?.credits && <div className="dash__nav__header__details__item">
						{customer.credits}  credits
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
	return (
		<div className="person">
			{name}
			{phone}
			{email}
			<img src={imgsrc} alt={`${name} headshot`}/>
		</div>
	)
}

export function Meeting({ payment, ...props }) {
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

			setPayments(paymentsdata.data)
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
