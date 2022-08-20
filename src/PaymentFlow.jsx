import "./PaymentFlow.scss"
import {ArrowBack} from '@mui/icons-material';
import Select from 'react-select';
import {useEffect, useState} from "react";
import {Button} from "./Components";

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

export default function PaymentFlow({embed, className, ...props}) {

	// data loaded from the backend
	const [courseOptions, setCourseOptions] = useState([])
	const [selectedCourse, setSelectedCourse] = useState(null);

	useEffect(() => {
		let get_classes = async () => {
			let coursesresp = await fetch("/api/courses/")
			let coursesdata = await coursesresp.json()

			let compsci = []
			let math = []
			let other = []
			for(let course of coursesdata.data) {
				let subj = course.course_number.match(/[A-Za-z]+/g)[0]
				let num = course.course_number.match(/[1-9]+/g)[0]

				if(subj.toLowerCase() === "cs") {
					compsci.push({label: `${course.course_name} (${course.course_number})`, value: course.id, num:num})
				} else if(subj.toLowerCase() === "math") {
					math.push({label: `${course.course_name} (${course.course_number})`, value: course.id, num:num})
				} else {
					other.push({label: `${course.course_name} (${course.course_number})`, value: course.id, num:num})
				}
			}

			const course_options = [{label:"Computer Science",options:compsci}, {label:"Math",options:math}, {label:"Other",options:other}];
			setCourseOptions(course_options)
		}

		get_classes()
	}, [])

	//TODO: load slots by class


	// form control
	const [size, setSize] = useState(null);
	const [frequency, setFrequency] = useState(null);
	const [modality, setModality] = useState(null);

	// CSS class computation
	let flow_classes = ["payflow"]
	if(embed) flow_classes.append("payflow--embed")
	if(className) flow_classes = flow_classes.concat(className.split(" "))


	return (
		<div className={flow_classes.join(" ")}>
			<div className="payflow__heading">
				<div className="payflow__heading__back">
					<ArrowBack />
				</div>
				<h2 className="payflow__heading__title">
					Meet a passCS Tutor
				</h2>
			</div>

			<section className="payflow__inputs">
				<section className="payflow__inputgroup">
					<h3 className="payflow__inputgroup__title">What course can we help you with?</h3>
					<Select placeholder="Select or type..." className="payflow__inputgroup__select" options={courseOptions} />
				</section>

				<section className="payflow__inputgroup">
					<h3 className="payflow__inputgroup__title">Do you prefer a one-on-one meeting?</h3>
					<RadioSelect onChange={setSize} value={size} options={[{label:["One-on-one", "$34"], value:1}, {label:["Group-of-Two", "$29"], value:2}]}/>
				</section>

				<section className="payflow__inputgroup">
					<h3 className="payflow__inputgroup__title">How often would you like to meet?</h3>
					<RadioSelect onChange={setFrequency} value={frequency} options={[{label:["Weekly"], value:1}, {label:["One Time", "+$1"], value:2}]}/>
				</section>
				
				<section className="payflow__inputgroup">
					<h3 className="payflow__inputgroup__title">Where would you like to meet?</h3>
					<RadioSelect onChange={setModality} value={modality} options={[{label:"On-Campus", value:1}, {label:"Online", value:2}]}/>
				</section>

				<section className="payflow__submit">
					<div className="payflow__submit__assurances">You won’t be charged yet · All prices are per student for one hour sessions</div>
					<Button full className="payflow__submit__button">Select Tutor, Time and Location</Button>
				</section>

			</section>
		</div>
	)
}
