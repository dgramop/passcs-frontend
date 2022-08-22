import "./PaymentFlow.scss"
import {ArrowBack, Group, LocationOn, School, Sell} from '@mui/icons-material';
import Select from 'react-select';
import {useEffect, useState} from "react";
import {Button, Chip} from "./Components";

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

function Pay({slot, meeting, standalone, ...props}) {
	//if the slot and meeting aren't defined, pull from the URL and render as a stand-alone page
	return (<>
	</>)
}

function get_date_info(date) {
	let hours = date.getHours();
	let minutes = date.getMinutes();
	if(minutes < 10) {
		minutes = "0"+minutes;
	} else {
		minutes = minutes+""
	}

	return {
		"weekday":(["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"])[date.getDay()],
		"hours": hours === 0 ? "12" : (hours > 12 ? hours - 12 : hours),
		"am": hours < 12,
		"minutes":minutes
	}
}

function Appointment({slot_etc, class_style, frequency, size,  ...props}) {

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

	let start_date = new Date(slot_etc.meetings[0].occurrence_epoch*1000)
	let end_date = new Date(slot_etc.meetings[0].occurrence_epoch*1000 + slot_etc.meetings[0].duration_mins*60*1000)

	let start = get_date_info(start_date)
	let end = get_date_info(end_date)

	return (
		<div className="payflow__appt">
			<div className="payflow__appt__header">
				<div className="payflow__appt__header__weekday">
					{start.weekday}
				</div>
				<div className="payflow__appt__header__time">
					{start.hours}:{start.minutes}{`${start.am ? "am" : "pm"}`} - {end.hours}:{end.minutes}{`${end.am ? "am" : "pm"}`}
				</div>
			</div>
			<div className="payflow__appt__chips">
					<Chip icon={<LocationOn className="fixicon"/>}>{({'in-person':"On Campus", 'online':"Online"})[class_style]}</Chip>
					{size && <Chip icon={<Group className="fixicon"/>}>{(["", "One-on-One", "Group-to-Two"])[size]}</Chip>}
					{price && <Chip icon={<Sell className="fixicon"/>}>{`$${price}${frequency==='weekly' ? "/wk" : ""}`}</Chip> }
			</div>
			<div className="payflow__appt__tutor">
				<div className="payflow__appt__tutor__profile">
					<img className="payflow__appt__tutor__profile__image" src={`/${encodeURIComponent(slot_etc.offering.tutor.id)}.jpg`} alt="Headshot for tutor" />
					<div className="payflow__appt__tutor__profile__desc">
						<div className="payflow__appt__tutor__profile__desc__name">{slot_etc.offering.tutor.name}</div>
						<div className="payflow__appt__tutor__profile__desc__qualifier">{slot_etc.offering.qualification}</div>
					</div>
				</div>
				<div className="payflow__appt__tutor__details">
					<div className="payflow__appt__tutor__details__desc">
						{more && slot_etc.offering.tutor.background}
						<div onClick={() => setMore(!more)} className="payflow__appt__tutor__details__desc__expand">see {more && "less"}{!more && "more"}</div>
					</div>
				</div>
			</div>
			<div className="payflow__appt__footer">
				<div className="payflow__appt__footer__date">{frequency === 'weekly' ? "Starts" : "Meet"} {start_date.getMonth()+"/"+start_date.getDate()}</div>
				<Button green>Book</Button>
			</div>
		</div>
	)
}

function AppointmentSelection({course_id, modality, size, frequency, close, ...props}) {
	const [error, setError] = useState(null);

	const [course, setCourse] = useState(null)
	const [slots, setSlots] = useState(null)

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
			let slotsresp = await fetch(`/api/slots?course=${course_id}&capacity=${size}&course_style=${modality}&subscription=${frequency==='weekly'}`);
			let slotsdata = await slotsresp.json()

			if(slotsdata.data.length === 0) setError("All tutors are busy for the given class configuration. Please try a different location/meeting size!")
			setSlots(slotsdata.data)
		}

		load_course()
		load_slots()

		//TODO: fetch courses with the appropriate query, or close with an error: out of stock

	},[modality,size,frequency, course_id])
	return (
		<>
			<section className="payflow__heading">
				<div className="payflow__heading__back" onClick={close}><ArrowBack /></div>
				<div className="payflow__heading__title payflow__heading__title--chips">
					<Chip icon={<School className="fixicon"/>}>{course?.course_number}</Chip>
				</div>
			</section>

			<section className="payflow__appts">
				{ slots && slots.map((slot) => <Appointment key={slot.slot.id} slot_etc={slot} class_style={modality} size={size} frequency={frequency}/>)}
			</section>
		</>)
}

export default function PaymentFlow({embed, className, ...props}) {

	const [done, setDone] = useState(false);

	// error
	const [classError, setClassError] = useState(null)
	const [error, setError] = useState(null)

	// data loaded from the backend
	const [courseOptions, setCourseOptions] = useState([])
	const [selectedCourse, setSelectedCourse] = useState(null);
	const [slots, setSlots] = useState([])
	const [prices, setPrices] = useState(null)

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
			let slotsresp = await fetch(`/api/slots/?course=${encodeURIComponent(selectedCourse.value)}`)
			let slotsdata = await slotsresp.json()
			if(slotsdata.data.length === 0) {
				setClassError(`All tutors for ${selectedCourse.label} are fully booked. Please check back tomorrow or dial/text 571-524-3033`)
			}
			setSlots(slotsdata.data)
		}
		if(selectedCourse) get_slots()
		load_prices()
	}, [selectedCourse])


	// form control
	const [size, setSize] = useState(null);
	const [frequency, setFrequency] = useState(null);
	const [modality, setModality] = useState(null);

	// CSS class computation
	let flow_classes = ["payflow"]
	if(embed) flow_classes.append("payflow--embed")
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
			<AppointmentSelection course_id={selectedCourse.value} size={size} modality={modality} frequency={frequency} close={() => setDone(false)} />
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
					<RadioSelect onChange={setFrequency} value={frequency} options={[{label:["Weekly", (frequency === "onetime" ? "-$1" : "")], value:"weekly"}, {label:["One Time", (frequency === "weekly" || frequency==null ? "+$1" : "")], value:"onetime"}]}/>
				</section>
				
				<section className="payflow__inputgroup">
					<h3 className="payflow__inputgroup__title">Where would you like to meet?</h3>
					<RadioSelect onChange={setModality} value={modality} options={[{label:"On-Campus", value:"in-person"}, {label:"Online", value:"online"}]}/>
				</section>
				{error && <span className="genericError">{error}</span>}
			</section>
			<section className="payflow__submit">
				<div className="payflow__submit__assurances">You won’t be charged yet · All prices are per student for one hour sessions</div>
				<Button full disabled={slots == null || slots.length === 0 || size === null || frequency === null || modality === null} onClick={() => {setDone(true)}} className="payflow__submit__button">Select Tutor, Time and Location</Button>
			</section>
		</div>
	)
}
