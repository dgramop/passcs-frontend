import {useState} from "react";

/**
 * An option for a Selector
 * @param {Boolean} props.selected If this button is selected
 * @param {Boolean} props.disabled If the button should be disabled
 * @param {String} props.subtext Optional subtext to display above button
 * @param {ReactChildren} props.children The text on the face of the button
 */
function SelectorOption(props) {
		return (
				<div className={"choose"} role="button" onClick={(e) => {
						if(!props.disabled && props.onSelect) props.onSelect(props.value,e);
				}}>
						<div className="choose__subtext">{props.subtext}</div>
						<div className={"choose__button "+(props.disabled ? "choose__button--disabled " : "")+(props.selected ? "choose__button--selected ": "")}>
								{props.children}
						</div>
				</div>
		)
}

/**
 * A Selector element for picking one of many choice (can later support select multiple)
 * @param {String} props.title The title of this selector
 * @param {String} props.icon The material icon for the title of this selector, spelled out (i.e. "class")
 * @param {String} props.initialValue The initial value to assign
 * @param {Array} props.options List of options with props passed to SelectorOption
 */
function Selector(props) {
		let [value, setValue] = useState(props.initialValue);

		console.log("value is "+value);

		return (
				<div className={"selector"}>
						<h3 className={"selector__title"}><span className="material-icons">{props.icon}</span> {props.title}</h3>
						<div className={"selector__options"}>
								{props.options.map((options) => (<SelectorOption onSelect={(value) => {setValue(value)}} selected={value===options.value} value={options.value} key={options.value}>
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
						<Selector title="Test" icon="face" options={[{value: "test", text:"test"},{value: "test2", text:"test2"}]}>
						</Selector>
				</div>
		)
}
