import "./PaymentFlow.scss"
import {ArrowBack} from '@mui/icons-material';
import Select from 'react-select';
import {useState} from "react";

export function RadioButton({children, name, value, onClick, selected, ...props}) {
	let computed_classes = ["rbtn"];
	if(selected) computed_classes.append("rbtn--selected")

	return (
		<div className={computed_classes.join(" ")} onClick={()=>{onClick(name, value)}}>
			{children}
		</div>
	);
}

export function RadioSelect({options, setOption, ...props}) {
	return (
		<div className="rbtns">
			{options && options.map((option) => <RadioButton onClick={() => setOption(option.value)} value={option.value}>{option.label}</RadioButton>)}
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
					<Select className="payflow__inputgroup__select" options={class_options} />
				</section>

				<section className="payflow__inputgroup">
					<h3 className="payflow__inputgroup__title">What class can we help you with?</h3>
					<RadioSelect options={[{label:"Test", value:"none"}, {label:"None", value:"none"}]}/>
				</section>
			</section>
		</div>
	)
}
