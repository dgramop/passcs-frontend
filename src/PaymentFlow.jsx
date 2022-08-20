import "./PaymentFlow.scss"
import {ArrowBack} from '@mui/icons-material';
import Select from 'react-select';
import {useState} from "react";
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

export function RadioSelect({options, setOption, ...props}) {
	return (
		<div className="rbtns">
			{options && options.map((option) => {
				return (<RadioButton split={Array.isArray(option.label)} onClick={() => setOption(option.value)} value={option.value}>{!Array.isArray(option.label) && option.label}{Array.isArray(option.label) && option.label.map((label) => <span className="rbtn__elem">{label}</span>)}</RadioButton>)
			})}
		</div>
	)
}

export default function PaymentFlow({embed, className, ...props}) {

	const classOptions = useState(null)

	// CSS class computation
	let flow_classes = ["payflow"]
	if(embed) flow_classes.append("payflow--embed")
	if(className) flow_classes = flow_classes.concat(className.split(" "))

	const class_options = [{label:"Computer Science",options:[]}, {label:"Math",options:[]}, {label:"Other",options:[]}];

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
					<h3 className="payflow__inputgroup__title">What class can we help you with?</h3>
					<Select placeholder="Select or type..." className="payflow__inputgroup__select" options={class_options} />
				</section>

				<section className="payflow__inputgroup">
					<h3 className="payflow__inputgroup__title">Do you prefer a one-on-one meeting?</h3>
					<RadioSelect options={[{label:["One-on-one", "$34"], value:1}, {label:["Group-of-Two", "$29"], value:2}]}/>
				</section>

				<section className="payflow__inputgroup">
					<h3 className="payflow__inputgroup__title">How often would you like to meet?</h3>
					<RadioSelect options={[{label:["Weekly"], value:1}, {label:["One Time", "+$1"], value:2}]}/>
				</section>
				
				<section className="payflow__inputgroup">
					<h3 className="payflow__inputgroup__title">Where would you like to meet?</h3>
					<RadioSelect options={[{label:"On-Campus", value:1}, {label:"Online", value:2}]}/>
				</section>

				<section className="payflow__submit">

					<div className="payflow__submit__assurances">You won’t be charged yet · All prices are per student for one hour sessions</div>
					<Button full className="payflow__submit__button">Select Tutor, Time and Location</Button>
				</section>

			</section>
		</div>
	)
}
