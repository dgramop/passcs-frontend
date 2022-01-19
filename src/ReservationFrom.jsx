import {useState} from "react";

/**
 * An option for a Selector
 * @param {Boolean} props.selected If this button is selected
 * @param {Boolean} props.disabled If the button should be disabled
 * @param {String} props.subtext Optional subtext to display above button
 * @param {String} props.modifier Message associated with this choice (like a consequence)
 * @param {ReactChildren} props.children The text on the face of the button
 */
function SelectorOption(props) {
		return (
				<div className={"choose"} role="button" onClick={(e) => {
						if(!props.disabled && props.onSelect) props.onSelect(props.value,e);
				}}>
						<div className="choose__subtext">{props.subtext}</div>
						<div className={"choose__button "+(props.disabled ? "choose__button--disabled " : "")+(props.selected ? "choose__button--selected ": "")}>
								<div className="choose__button__left">{props.children}</div> <div className="choose__button__right">{props.modifier}</div>
						</div>
				</div>
		)
}

/**
 * A Selector element for picking one of many choice (can later support select multiple)
 * @param {String} props.title The title of this selector
 * @param {String} props.icon The material icon for the title of this selector, spelled out (i.e. "class")
 * @param {String} props.initialValue The initial value to assign
 * @param {Boolean} props.longer For full length layout
 * @param {Array} props.options List of options with props passed to SelectorOption
 */
function Selector(props) {
		let [value, setValue] = useState(props.initialValue);

		console.log("value is "+value);

		return (
				<div className={"selector"}>
						<h3 className={"selector__title"}><span className="material-icons">{props.icon}</span> {props.title}</h3>
						<div className={"selector__options "+(props.longer ? "selector__options--longer" : "")}>
								{props.options.map((options) => (<SelectorOption onSelect={(value) => {setValue(value)}} {...options} selected={value===options.value} key={options.value}>
										{options.text} 
								</SelectorOption>))}
						</div>
				</div>
		)
}

export default function ReservationForm() {
		return (
				<div className="reservation_form">
						<div className="reservation_form__heading">
								<h2> Find a seat </h2>
								<small> You won't be charged yet </small>
						</div>
						<Selector title="University" icon="school" options={[{text: "George Mason", value: "GMU"}]} initialValue={"GMU"}> </Selector>
						<Selector longer={true} title="Class" icon="class" options={[{value: "CS262", text:(<>CS262<br/>Intro to Low Level Programming</>)},{value: "CS262", text:(<>CS262<br/>Intro to Low Level Programming</>)}]}/>
						<Selector title="Meeting Size" icon="people" options={[{text: "One-on-One $35", value: 1, subtext:"up to $60 from competitors"}, {text: "Class of 2 $30", value: 2, subtext:"up to $40 from competitors"}]} initialValue={1}/>
						<Selector title="Meeting Location" icon="place" options={[{value: "in-person", text:"On-Campus"},{value: "online", text:"Online"}]} initialValue="in-person"/>
						<Selector title="Meeting Frequency" icon="autorenew" options={[{value: "weekly", text:"Weekly"},{value: "onetime", text:"One Time"}]} initialValue="weekly"/>
						<hr />
						<div className="reservation_form__submission">
								<div className="reservation_form__submission__primaryButton" role="button">Select Tutor + Time <span className="material-icons">east</span></div>
								<small className="reservation_form__submission__subtext"> You won't be charged yet </small>
						</div>
				</div>
		)
}
