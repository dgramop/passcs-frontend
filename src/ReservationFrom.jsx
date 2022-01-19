import {useState} from "react";
import './ReservationForm.scss';

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
								<div className="choose__button__left">{props.children}</div> <div className={"choose__button__modifier " + ({null: "", "error":"choose__button__modifier--error", "success":"choose__button__modifier--success"}[props.modifier?.type])}>{props.modifier?.text}</div>
						</div>
				</div>
		)
}

/**
 * A Selector element for picking one of many choice (can later support select multiple)
 * @param {String} props.title The title of this selector
 * @param {String} props.icon The material icon for the title of this selector, spelled out (i.e. "class")
 * @param {String} props.name Convenience value passed to setValue as its first argument
 * @param {String} props.value The value to assign
 * @param {Boolean} props.longer For full length layout
 * @param {Array} props.options List of options with props passed to SelectorOption
 */
function Selector(props) {
		let value = props.value;
		let setValue = props.setValue;

		console.log("value is "+value);

		return (
				<div className={"selector"}>
						<h3 className={"selector__title"}><span className="material-icons selector__title__icon">{props.icon}</span> {props.title}</h3>
						<div className={"selector__options "+(props.longer ? "selector__options--longer" : "")}>
								{props.options.map((options) => (<SelectorOption onSelect={(value) => {setValue(props.name, value)}} {...options} selected={value===options.value} key={options.value}>
										{options.text} 
								</SelectorOption>))}
						</div>
				</div>
		)
}

function PrefsScreen(props) {
		let [prefs, setPrefs] = useState({university:"GMU", capacity: 1, class_style: "in-person", payment_frequency: "weekly"})
		let [set, setSet] = useState(false);

		let setPrefValue = (name, value) => {
				setPrefs({...prefs, [name]: value});
		}
		console.log(prefs);

		if(!set)
		return (
				<div className="reservation_form">
						<div className="reservation_form__heading">
								<h2 className="reservation_form__heading__title"> Find a seat </h2>
								<small className="reservation_form__heading__subtext"> You won't be charged yet </small>
						</div>
						<Selector value={prefs.university} setValue={setPrefValue} name="university" title="University" icon="school" options={[{text: "George Mason", value: "GMU"}]} > </Selector>
						<Selector value={prefs.course} setValue={setPrefValue} name="course" longer={true} title="Class" icon="class" options={[{value: "CS262", text:(<>CS262<br/>Intro to Low Level Programming</>)},{value: "CS310", text:(<>CS310<br/>Data Structures</>)}]}/>
						<Selector value={prefs.capacity} setValue={setPrefValue} name="capacity" title="Meeting Size" icon="people" options={[{text: "One-on-One "+(prefs.payment_frequency === "weekly" ? "$35" : "$40"), value: 1}, {text: "Class of 2 "+(prefs.payment_frequency === "weekly" ? "$30" : "$35"), value: 2}]} />
						<Selector value={prefs.class_style} setValue={setPrefValue} name="class_style" title="Meeting Location" icon="place" options={[{value: "in-person", text:"On-Campus"},{value: "online", text:"Online"}]} />
						<Selector value={prefs.payment_frequency} setValue={setPrefValue} name="payment_frequency" longer={true} title="Meeting Frequency" icon="autorenew" options={[{value: "weekly", text:"Weekly", modifier: {type:"success", text:"-$5"}},{value: "onetime", text:"One Time", modifier: {type:"error", text:"+$5"}}]} />
						<hr />
						<div className="reservation_form__submission">
								<div className="button reservation_form__submission__primaryButton" role="button" onClick={() => setSet(true)}>Select Tutor + Time <span className="material-icons">east</span></div>
								<small className="reservation_form__submission__subtext"> You won't be charged yet </small>
						</div>
				</div>
		)
		else return (
				<>
						tutor selection page
				</>
		)
}

export default function ReservationForm() {
		return (
				<PrefsScreen/>
		);
}
