import "./PaymentFlow.scss"
import {ArrowBack, Group, LocationOn, School, Sell} from '@mui/icons-material';
import Select from 'react-select';
import {useEffect, useState} from "react";
import {Button, Chip, register_customer, register_payment, register_subscription, TextField, get_date_info, Fake} from "./Components";
import {CardElement, useElements, useStripe, Elements} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';
import {useNavigate} from "react-router-dom";

const stripePromise = loadStripe(process.env["NODE_ENV"] === "development" ? 'pk_test_51JdnMmABGmiERRLGxLTG2jrTUkEzP1ySRI5ofnnm3QLKTqqClvCzoxBBiBa9rlYlsepjmeyMmo4ISTpUrMqkaYbu00QlZCW7H9' : 'pk_live_51JdnMmABGmiERRLGpQnemsRk0xpo06XnoPtwI3doKvNd1SQBMkOWTqNQmUsLCTsHDk1yawB83A2cuqUIBGU2NA5o00QOHX6xXi');

export function RadioButton({children, name, value, onClick, selected, split, ...props}) {
	let computed_classes = ["rbtn"];
	if(selected) computed_classes.push("rbtn--selected")
	if(split) computed_classes.push("rbtn--split")

	return (
		<div className={computed_classes.join(" ")} onClick={()=>{onClick(name, value)}}>
			{children}
		</div>
	);
}

export function RadioSelect({options, onChange, value, ...props}) {
	return (
		<div className="rbtns">
			{options && options.map((option) => {
				return (<RadioButton selected={option.value===value} split={Array.isArray(option.label)} onClick={() => onChange(option.value)} value={option.value}>{!Array.isArray(option.label) && option.label}{Array.isArray(option.label) && option.label.map((label) => <span className="rbtn__elem">{label}</span>)}</RadioButton>)
			})}
		</div>
	)
}

function Assurance(props) {
		return (
		<div className="assurance">
				<span className="assurance__icon material-icons">{props.icon}</span>
				<span className="assurance__text">{props.children}</span>
		</div>
		)
}

function Pay({slot_etc, capacity, course_style, subscription, back, standalone, close, reload, ...props}) {
	//if the slot and meeting aren't defined, pull from the URL and render as a stand-alone page
	
	//TODO: add assurances 
	let [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)
	
	// Fields that determine how we bill the user
	let [clientSecret, setClientSecret] = useState(null)
	let [customer, setCustomer] = useState(null)
	
	// New customer related fields
	let [firstname, setFirstname] = useState("");
	let [lastname, setLastname] = useState("");
	let [phone, setPhone] = useState("");
	let [email, setEmail] = useState("");

	// other hooks
	const stripe = useStripe();
	const elements = useElements();
	const navigate = useNavigate()

	useEffect(() => {
		let load_customer = async () => {
			let customerresp = await fetch("/api/customers/myself");
			let customerdata = await customerresp.json()

			if(customerdata.status === "success") {
				setError(null);
				setCustomer(customerdata.data)
				setLastname(customerdata.lastname)
				setFirstname(customerdata.firstname)
				setEmail(customerdata.email)
				setPhone(customerdata.phone)
				console.log(customerdata.data)
			} else if(customerdata.error==="DBError") {
				setError("Cannot contact server, please text or dial 571-524-3033 to reserve your spot")
			} else {
				//assume the customer doesn't exist
				setCustomer(false)
			}
		}
		load_customer()
	}, [])

	let submit = async () => {
		setLoading(true)

		// customer registration, if necessary
		let customer_g = customer;
		if(customer === false) {
			// normalize the phone number by removing dashes, spaces, and parenthesis
			let phone_g = phone.replace(/[\(\)\-\s]+/g, '')

			if(firstname === "" || lastname==="" || phone==="" || email === "") {
				setError("Please fill in all fields")
				setLoading(false)
				return;
			}

			// validate the normalized phone number
			if(phone_g.length !== 10 || !(new RegExp("^[0-9]*$")).test(phone_g)) {
				setError("Invalid phone number")
				setLoading(false)
				return;
			}

			// validate the email
			if(!(new RegExp("^[^@]+@[^@]+\.[^@]+$")).test(email)) {
				setError("Invalid email address")
				setLoading(false)
				return;
			}

			// register the customer
			let customer = await register_customer(firstname, lastname, email, phone_g)

			if(customer.status === "failure" && customer.error.type === "AlreadyExists") {
				// TODO send the customer a log in text message and ask them to enter the code via a popup
				setError("You have an account with us already, please log in and retry")
				setLoading(false)
				return;
			}

			setCustomer(customer.data)
			customer_g = customer.data;
		} else if(customer === null) {
			// we couldn't load the customer due to a DB Error
			setError("Failed to load customer, please text or dial 571-524-3033 to reserve your spot")
			return;
		} 

		// create the payment/subscription in the backend, if necessary
		let clientSecret_g = clientSecret;
		if(!clientSecret) {
			if(subscription) {
				let sub = await register_subscription(slot_etc.slot.id, course_style, capacity, slot_etc.offering.id, slot_etc.meetings[0].id)
				if(sub.status==="failure") {
					setError(sub.error.type)
					setLoading(false)
					return;
				}
				clientSecret_g = sub.data.client_secret;
				setClientSecret(clientSecret_g)
			} else {
				let pymt = await register_payment(course_style, capacity, slot_etc.offering.id, slot_etc.meetings[0].id)
				if(pymt.status==="failure") {
					setError(pymt.error.type)
					setLoading(false)
					return;
				}
				clientSecret_g = pymt.data.client_secret;
				setClientSecret(clientSecret_g)
			}
		}

		console.log(clientSecret_g)

		// confirm the payment with our payment method if the customer doesn't already have one on file
		if(customer_g.payment_method === null) {
			let payload = await stripe.confirmCardPayment(clientSecret_g, { payment_method: { card: elements.getElement(CardElement), billing_details: { name: firstname+" "+lastname } } })
			if(payload.error) {
				setError(payload.error.message)
				setLoading(false)
				return;
			}
		}

		//wait until the payment is paid
		setTimeout(() => {
			console.log("bye")
			if(reload) reload() 
			else navigate("/student/dashboard")
		}, 500)


	}

	let font_size = window.getComputedStyle(document.getElementsByClassName("payment_form__input")[0], null).getPropertyValue('font-size');;
	return (<>
		<div className="payflow__heading">
				<div className="payflow__heading__back" onClick={close}><ArrowBack /></div>
				<h2 className="payflow__heading__title">
					Finalize Booking
				</h2>
		</div>
		<Appointment finalize class_style={course_style} frequency={subscription ? "weekly" : "onetime"} size={capacity} slot_etc={slot_etc}/>
		<section className="payflow__inputs">
			{!customer && 
			<>
				<div className="payflow__inputgroup">
					<h3 className="payflow__inputgroup__title">First name</h3>
					<TextField placeholder="George" autoComplete="given-name" value={firstname} onChange={setFirstname}/>
				</div>
				<div className="payflow__inputgroup">
					<h3 className="payflow__inputgroup__title">Last name</h3>
					<TextField placeholder="Mason" autoComplete="family-name" value={lastname} onChange={setLastname}/>
				</div>
				<div className="payflow__inputgroup">
					<h3 className="payflow__inputgroup__title">Phone number</h3>
					<TextField placeholder="571-524-3033" autoComplete="tel-national" type="phone" value={phone} onChange={setPhone}/>
				</div>
				<div className="payflow__inputgroup">
					<h3 className="payflow__inputgroup__title">Email</h3>
					<TextField placeholder="dhruv@passcs.io" autoComplete="email" type="email" value={email} onChange={setEmail}/>
				</div>
			</>}
			{!customer?.payment_method && 
				<div className="payflow__inputgroup">
					<h3 className="payflow__inputgroup__title">Payment</h3>
					<CardElement options={{style:{base:{fontSize:font_size}}, disabled: loading}} className="payment_form__input"/>
				</div>
			}
		</section>
		<div className="payflow__assurances">
			<Assurance icon="lock">
					Your payment is secured by Stripe and SSL
			</Assurance>
			<Assurance icon="check">
					Eligible for the passCS Guarantee, subject to <a href="TODO">terms</a>
			</Assurance>
			{subscription && <Assurance icon="logout">
					Easy cancellation
			</Assurance>}
			{customer?.payment_method && <Assurance icon="payment">
					We'll charge your card-on-file
			</Assurance>}
		</div>
		<section className="payflow__submit">
			{error && <span className="genericError">{error}</span>}
			<Button full disabled={loading} onClick={submit} extraClasses="payflow__submit__button">Pay</Button>
		</section>
	</>)
}



function Appointment({slot_etc, meeting, class_style, frequency, size, onBook, finalize, fake,  ...props}) {

	const [price, setPrice] = useState(null)
	const [more, setMore] = useState(false);

	useEffect(() => {
		const load_prices = async () => {
			let pricesresp = await fetch("/api/prices");
			let pricesdata = await pricesresp.json()

			if(frequency==='weekly') {
				// prices listed in cents to avoid fp issues hence the division
				setPrice(pricesdata.data.subscription[size]/100)
			} else {
				setPrice(pricesdata.data.onetime[size]/100)
			}
		}
		load_prices()
	}, [size, frequency])

	if(meeting && !slot_etc) {
		// create a synthetic slot_etc (this is a good candidate for something to be cleaned up)
		slot_etc = {
			slot: null, // even though it's synthetic, there is no slot
			meetings: [meeting],
			offering: meeting.offering
		}
	}

	let start_date = new Date(slot_etc.meetings[0].occurrence_epoch*1000)
	let end_date = new Date(slot_etc.meetings[0].occurrence_epoch*1000 + slot_etc.meetings[0].duration_mins*60*1000)

	let start = get_date_info(start_date)
	let end = get_date_info(end_date)

	return (
		<div className="payflow__appt">
			<div className="payflow__appt__header">
				<div className="payflow__appt__header__weekday">
					{fake && <Fake />}
					{!fake && start.weekday}
				</div>
				<div className="payflow__appt__header__time">
					{fake && <Fake />}
					{!fake && <>{start.hours}:{start.minutes}{`${start.am ? "am" : "pm"}`} - {end.hours}:{end.minutes}{`${end.am ? "am" : "pm"}`}</>}
				</div>
			</div>
			<div className="payflow__appt__chips">
				{!fake && <>
					<Chip icon={<LocationOn className="fixicon"/>}>{({'in-person':"On Campus", 'online':"Online"})[class_style]}</Chip>
					{size && <Chip icon={<Group className="fixicon"/>}>{(["", "One-on-One", "Group-to-Two"])[size]}</Chip>}
					{price && <Chip icon={<Sell className="fixicon"/>}>{`$${price}${frequency==='weekly' ? "/wk" : ""}`}</Chip> }
				</>}
				{fake && <>
					<Chip icon={<LocationOn className="fixicon"/>}>On Campus</Chip>
					<Chip icon={<Group className="fixicon"/>}>One-on-One</Chip>
					<Chip icon={<Sell className="fixicon"/>}>$45/hr</Chip>
				</>}
			</div>
			<div className="payflow__appt__tutor">
				<div className="payflow__appt__tutor__profile">
					<img className="payflow__appt__tutor__profile__image" src={`/${encodeURIComponent(slot_etc.offering.tutor.id)}.jpg`} alt="Headshot for tutor" />
					<div className="payflow__appt__tutor__profile__desc">
						<div className="payflow__appt__tutor__profile__desc__name">{slot_etc.offering.tutor.name}</div>
						<div className="payflow__appt__tutor__profile__desc__qualifier">{slot_etc.offering.qualification}</div>
					</div>
				</div>
				{!finalize && <div className="payflow__appt__tutor__details">
					<div className="payflow__appt__tutor__details__desc">
						{more && slot_etc.offering.tutor.background}
						<div onClick={() => setMore(!more)} className="payflow__appt__tutor__details__desc__expand">see {more && "less"}{!more && "more"}</div>
					</div>
				</div>}
			</div>
			<div className="payflow__appt__footer">
				<div className="payflow__appt__footer__date">{frequency === 'weekly' ? "Starts" : "Meet"} {(start_date.getMonth()+1)+"/"+start_date.getDate()}</div>
				{!finalize && <Button green onClick={() => { if(onBook) onBook(slot_etc) }}>Book</Button>}
			</div>
		</div>
	)
}

function AppointmentSelection({course_id, modality, size, frequency, close, autoscroll, reload, ...props}) {
	const [error, setError] = useState(null);

	const [course, setCourse] = useState(null)
	const [slots, setSlots] = useState(null)
	const [meetings, setMeetings] = useState(null)

	const [selection, setSelection] = useState(null)

	useEffect(()=>{
		const load_course = async () => {
			//load the course
			let courseresp = await fetch(`/api/courses`);
			let coursedata = await courseresp.json()

			let courses = coursedata.data.filter((course) => course.id === course_id)
			if(courses.length === 0) setError("Course not found")
			setCourse(courses[0])
			console.log(courses[0])
		}
		
		const load_slots = async () => {
			//load the course
			if(frequency === "weekly") {
				let slotsresp = await fetch(`/api/slots?course=${course_id}&capacity=${size}&course_style=${modality}&subscription=true`);
				let slotsdata = await slotsresp.json()

				if(slotsdata.data.length === 0) setError("All tutors are busy for the given class configuration. Please try a different location/meeting size!")
				setSlots(slotsdata.data)
				setMeetings(null);
			} else {
				let meetingsresp = await fetch(`/api/meetings?course=${course_id}&capacity=${size}&course_style=${modality}`);
				let meetingsdata = await meetingsresp.json()

				if(meetingsdata.data.length === 0) setError("All tutors are busy for the given class configuration. Please try a different location/meeting size!")
				setMeetings(meetingsdata.data)
				setSlots(null);

			}
			if(autoscroll) window.scrollTo(0, document.body.scrollHeight);
		}

		load_course()
		load_slots()

		//TODO: fetch courses with the appropriate query, or close with an error: out of stock

	},[modality,size,frequency, course_id])
	if(selection) 
		return (
				<Elements stripe={stripePromise}>
					<Pay reload={reload} close={() => setSelection(null)} capacity={size} course_style={modality} subscription={frequency==='weekly'} slot_etc={selection} back={() => setSelection(null)} />
				</Elements>
		)
	else
	return (
		<>
			<section className="payflow__heading">
				<div className="payflow__heading__back" onClick={close}><ArrowBack /></div>
				<div className="payflow__heading__title payflow__heading__title--chips">
					<Chip icon={<School className="fixicon"/>}>{course?.course_number}</Chip>
				</div>
			</section>

			<section className="payflow__appts">
				{ meetings && meetings.sort((a,b) => a.occurrence_epoch > b.occurrence_epoch).map((meeting) => <Appointment key={meeting.id} onBook={setSelection} meeting={meeting} class_style={modality} size={size} frequency={frequency}/>)}
				{ slots && slots.sort((a,b) => a.meetings[0].occurrence_epoch > b.meetings[0].occurrence_epoch).map((slot) => <Appointment key={slot.slot.id} onBook={setSelection} slot_etc={slot} class_style={modality} size={size} frequency={frequency}/>)}
			</section>
		</>)
}

// autoscroll tells the appointment selector to automatically scroll to the bottom of the page when the slots are loaded (because its height is briefly very low while slots are loading)
export default function PaymentFlow({reload, embed, className, autoscroll, ...props}) {

	const [done, setDone] = useState(false);

	// error
	const [classError, setClassError] = useState(null)
	const [error, setError] = useState(null)

	// data loaded from the backend
	const [courseOptions, setCourseOptions] = useState([])
	const [selectedCourse, setSelectedCourse] = useState(null);
	const [slots, setSlots] = useState([])
	const [meetings, setMeetings] = useState([])
	const [prices, setPrices] = useState(null)

	// form control
	const [size, setSize] = useState(null);
	const [frequency, setFrequency] = useState(null);
	const [modality, setModality] = useState(null);

	useEffect(() => {
		let get_classes = async () => {
			let coursesresp = await fetch("/api/courses/")
			let coursesdata = await coursesresp.json()

			let compsci = []
			let math = []
			let other = []
			for(let course of coursesdata.data) {
				let subj = course.course_number.match(/[A-Za-z]+/g)[0]
				let num = parseInt(course.course_number.match(/[0-9]+/g)[0])

				if(subj.toLowerCase() === "cs") {
					compsci.push({label: `${course.course_number} (${course.course_name})`, value: course.id, num:num})
				} else if(subj.toLowerCase() === "math") {
					math.push({label: `${course.course_number} (${course.course_name})`, value: course.id, num:num})
				} else {
					other.push({label: `${course.course_number} (${course.course_name})`, value: course.id, num:num})
				}
			}

			const course_options = [{label:"Computer Science",options:compsci.sort((a,b) => a.num - b.num)}, {label:"Math",options:math.sort((a,b) => a.num - b.num)}, {label:"Other",options:other.sort((a,b) => a.num - b.num)}];
			setCourseOptions(course_options)
		}

		get_classes()
	}, [])


	useEffect(() => {
		const load_prices = async () => {
			let pricesresp = await fetch(`/api/prices`)
			let pricesdata = await pricesresp.json()
			setPrices(pricesdata.data)
		}

		const get_slots = async () => {
			setClassError(null)

			//since the user selects the frequency after selecting the class, we'll assume the most permissive frequency (one-off) until they pick weekly. That way if there's an error they'll immediately know what caused it

			if(frequency !== "weekly") {
				let meetingsresp = await fetch(`/api/meetings?course=${encodeURIComponent(selectedCourse.value)}`);
				let meetingsdata = await meetingsresp.json()

				if(meetingsdata.data.length === 0) {
					setClassError(`All tutors for ${selectedCourse.label} are fully booked. Please check back tomorrow or dial/text 571-524-3033`)
				}
				setMeetings(meetingsdata.data)
				//setSlots(null);
			} else {
				let slotsresp = await fetch(`/api/slots/?course=${encodeURIComponent(selectedCourse.value)}`)
				let slotsdata = await slotsresp.json()
				if(slotsdata.data.length === 0) {
					setClassError(`All tutors for ${selectedCourse.label} are fully booked for weekly subscriptions. Please check back tomorrow or dial/text 571-524-3033`)
				}
				setSlots(slotsdata.data)
				//setMeetings(null)
			}

		}
		if(selectedCourse) get_slots()
		load_prices()
	}, [selectedCourse, frequency])


	
	// CSS class computation
	let flow_classes = ["payflow"]
	if(embed) flow_classes.push("payflow--embed")
	if(className) flow_classes = flow_classes.concat(className.split(" "))


	//TODO: dynamically disable buttons
	/*
	let sizes_available = new Set();
	let frequencies_available = new Set(); //weekly, onetime
	let locations_available = new Set(); 

	if(selectedCourse != null) {
		for(let slot of slots) {
			// default to one time when computing availability
			

			// if just the next meeting matches, it's onetime
			// if all meetings match its weekjly compatible
		}
	} else {
		sizes_available.add(1)
		sizes_available.add(2)
		frequencies_available.add("weekly")
		frequencies_available.add("onetime")
		locations_available.add("in-person")
		locations_available.add("online")
	}
	*/

	if(done) return (
		<div className={flow_classes.join(" ")}>
			<AppointmentSelection reload={reload} autoscroll={autoscroll} course_id={selectedCourse.value} size={size} modality={modality} frequency={frequency} close={() => setDone(false)} />
		</div>
	)
	else return (
		<div className={flow_classes.join(" ")}>
			<div className="payflow__heading">
				<div className="payflow__heading__back payflow__heading__back--initial">
					<ArrowBack onClick={props.close}/>
				</div>
				<h2 className="payflow__heading__title">
					Meet a passCS Tutor
				</h2>
			</div>

			<section className="payflow__inputs">
				<section className="payflow__inputgroup">
					<h3 className="payflow__inputgroup__title">Select your school</h3>
					<RadioSelect onChange={()=>{}} value={1} options={[{label:"GMU", value:1}]}/>
				</section>
				<section className="payflow__inputgroup">
					<h3 className="payflow__inputgroup__title">What course can we help you with?</h3>
					<Select autoFocus value={selectedCourse} onChange={(val) => setSelectedCourse(val)} placeholder="Select or type..." className="payflow__inputgroup__select" options={courseOptions} />
				</section>
				{classError && <span className="genericError">{classError}</span>}

				<section className="payflow__inputgroup">
					<h3 className="payflow__inputgroup__title">How much focus do you need?</h3>
					<RadioSelect onChange={setSize} value={size} options={[{label:["One-on-one", prices == null ? "" : "$"+prices[(frequency==='weekly' || frequency==null) ? "subscription" : "onetime"][1]/100], value:1}, {label:["Group-of-Two", prices == null ? "" : "$"+prices[(frequency==='weekly' || frequency==null) ? "subscription" : "onetime"][2]/100], value:2}]}/>
				</section>

				<section className="payflow__inputgroup">
					<h3 className="payflow__inputgroup__title">How often would you like to meet?</h3>
					<RadioSelect onChange={setFrequency} value={frequency} options={[{label:["Weekly", (frequency === "onetime" && prices != null ? "-$"+(prices["onetime"][size || 1]/100 - prices["subscription"][size || 1]/100) : "")], value:"weekly"}, {label:["One Time", ((frequency === "weekly" || frequency==null) && prices != null ? "+$"+(prices["onetime"][size || 1]/100 - prices["subscription"][size || 1]/100) : "")], value:"onetime"}]}/>
				</section>
				
				<section className="payflow__inputgroup">
					<h3 className="payflow__inputgroup__title">Where would you like to meet?</h3>
					<RadioSelect onChange={setModality} value={modality} options={[{label:"On-Campus", value:"in-person"}, {label:"Online", value:"online"}]}/>
				</section>
				{error && <span className="genericError">{error}</span>}
			</section>
			<section className="payflow__submit">
				<div className="payflow__submit__assurances">You won’t be charged yet · All prices are per student for one hour sessions</div>
				<Button full disabled={(frequency === "weekly" && (slots == null || slots.length === 0)) || (frequency !=="weekly" && (meetings == null || meetings.length === 0)) || size === null || frequency === null || modality === null} onClick={() => {setDone(true)}} className="payflow__submit__button">Select Tutor, Time and Location</Button>
			</section>
		</div>
	)
}
