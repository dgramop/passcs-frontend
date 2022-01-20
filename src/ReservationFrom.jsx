import {useState, useEffect} from "react";
import './ReservationForm.scss';

const DAYS_OF_THE_WEEK = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

/**
 * An option for a Selector
 * @param {Boolean} props.selected If this button is selected. Will also be called if the button is both disabled and selected, with an argument of null
 * @param {Boolean} props.disabled If the button should be disabled
 * @param {String} props.subtext Optional subtext to display above button
 * @param {String} props.modifier Message associated with this choice (like a consequence)
 * @param {ReactChildren} props.children The text on the face of the button
 */
function SelectorOption(props) {
		if(props.disabled && props.selected) props.onSelect(null);
		return (
				<div className={"choose"} role="button" onClick={() => {
						if(!props.disabled && props.onSelect) props.onSelect(props.value);
				}}>
						<div className="choose__subtext">{props.subtext}</div>
						<div className={"choose__button "+(props.disabled ? "choose__button--disabled " : "")+(props.selected ? "choose__button--selected ": "")}>
								<div className="choose__button__left">{props.children}</div> <div className={"choose__button__modifier " + ({null: "", "error":"choose__button__modifier--error", "success":"choose__button__modifier--success"}[props.modifier?.type])}>{props.disabled ? "" : props.modifier?.text}</div>
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

/** 
 * Checks prefs, but notable not the class
 */
function check_prefs(prefs, meeting) {
		return (prefs.capacity == null || meeting.capacity == null || prefs.capacity === meeting.capacity) 
				&& (prefs.class_style == null || meeting.class_style == null || prefs.class_style === meeting.class_style)
}

/**
 * For a given set of preferences and slots available, what preferences can be selected?
 */
function summarize(prefs, slots) {
		let capacity = new Set()
		let class_style = new Set();
		let payment_frequency = new Set();
		for (let slot of slots) {
				//if it succeeds for the first meeting, one-time frequency is ok
				//if it succeeds for all meetings, weekly frequency is ok

				let weekly_matches = true;
				let onetime_matches = check_prefs(prefs, slot.meetings[0])
				//if its weekly
				for(let meeting of slot.meetings) {
						if(!check_prefs(prefs, meeting)) {
								weekly_matches = false;
								break;
						}
				}

				// if there is no payment frequency specified or if it's onetime, we can add this to the list of available options
				if((prefs.payment_frequency === "weekly" && weekly_matches) || (onetime_matches))
				{
						if(slot.meetings[0].capacity!==null) {
								capacity.add(slot.meetings[0].capacity)
						} else {
								capacity.add(1); //this is where we add the set of all real numbers... or at least all number for any valid capacity
								capacity.add(2); 
						}
						if(slot.meetings[0].class_style!==null) {
								class_style.add(slot.meetings[0].class_style)
						} else {
								//add all valid class styles
								class_style.add("in-person");
								class_style.add("online");
						}

						if(weekly_matches) payment_frequency.add("weekly");
						if(onetime_matches) payment_frequency.add("onetime");  //redundant, but kept for code quality in case the assumption that weekly_matches implies onetime_matches breaks in the future
				}

		}
		return {capacity, class_style, payment_frequency}
}

function PrefsScreen(props) {
		let [prefs, setPrefs] = useState({university:"GMU", capacity: 1, class_style: "in-person", payment_frequency: "weekly"})
		let [set, setSet] = useState(false);
		let [classes, setClasses] = useState([]);
		let [slots, setSlots] = useState([]);
		let [enabledOptions, setEnabledOptions] = useState({capacity:new Set(), payment_frequency:new Set(), class_style: new Set()});

		let setPrefValue = (name, value) => {
				setPrefs({...prefs, [name]: value});
		}
		console.log(prefs);

		useEffect(() => {
				let action = async () => {
						let classes = (await (await fetch("/classes")).json()).data
						setClasses(classes);
				};
				action();
		},[])

		useEffect(() => {
				let action = async () => {
						// the assumption is that if it matches weekly it imples that it also matches onetime. That's why we can assume onetime even if it's payment_frequency isn't initialized yet
						let optionalQuery = "";
						if(prefs.payment_frequency !== null) {
								optionalQuery += "subscription="+(prefs.payment_frequency === "weekly");
						}
						
						if(prefs.class_style !== null) {
								optionalQuery += "&class_style="+prefs.class_style;
						}

						if(prefs.capacity !== null) {
								optionalQuery += "&capacity="+prefs.capacity;
						}

						let slots = (await (await fetch(`/slots?class=${prefs.course}&${optionalQuery}`)).json()).data
						setSlots(slots);
				};
				action();

		},[prefs.course]) //intentionally short here, because we have a client-side resolver for similar information that actually gives us a summary

		useEffect(() => {
				setEnabledOptions(summarize(prefs, slots));
		}, [prefs, slots])

		let submit_disabled = prefs.university == null || prefs.course == null || prefs.capacity == null || prefs.class_style == null || prefs.payment_frequency == null;

		if(!set)
		return (
				<div className="reservation_form">
						<div className="reservation_form__heading">
								<h2 className="reservation_form__heading__title"> Find a seat </h2>
								<small className="reservation_form__heading__subtext"> You won't be charged yet </small>
						</div>
						<Selector value={prefs.university} setValue={setPrefValue} name="university" title="University" icon="school" options={[{text: "George Mason", value: "GMU"}]} > </Selector>
						<Selector value={prefs.course} setValue={setPrefValue} name="course" longer={true} title="Class" icon="class" options={classes.map((course) => {
								return {value: course.id, text: course.course_number+" - "+course.course_name };
						})}/>

						<Selector value={prefs.capacity} setValue={setPrefValue} name="capacity" title="Meeting Size" icon="people" options={[
								{text: "One-on-One "+(prefs.payment_frequency === "onetime" ? "$40" : "$35"), value: 1, disabled: !enabledOptions.capacity.has(1)}, {
								text: "Class of 2 "+(prefs.payment_frequency === "onetime" ? "$35" : "$30"), value: 2, disabled: !enabledOptions.capacity.has(2)}]} />

						<Selector value={prefs.class_style} setValue={setPrefValue} name="class_style" title="Meeting Location" icon="place" options={[
								{value: "in-person", text:"On-Campus", disabled: !enabledOptions.class_style.has("in-person")},
								{value: "online", text:"Online", disabled: !enabledOptions.class_style.has("online") }]} />
						
						<Selector value={prefs.payment_frequency} setValue={setPrefValue} name="payment_frequency" longer={true} title="Meeting Frequency" icon="autorenew" options={[
								{value: "weekly", text:"Weekly", modifier: {type:"success", text:prefs.payment_frequency === "onetime" ? ("save $5/meeting") : ""}, disabled: !enabledOptions.payment_frequency.has("weekly")},
										{value: "onetime", text:"One Time", modifier: {type:"error", text:"add $5"}, disabled: !enabledOptions.payment_frequency.has("onetime")}]} />
						<hr />
						<div className="reservation_form__submission">
								<div className={"button reservation_form__submission__primaryButton "+(submit_disabled ? "button--disabled" : "")} role="button" onClick={() => { if(!submit_disabled) setSet(true)}}>Select Tutor + Time <span className="material-icons">east</span></div>
								<small className="reservation_form__submission__subtext"> You won't be charged yet </small>
						</div>
				</div>
		)
		else return (
				<SlotSelectionScreen prefs={prefs}/>
		)
}

function Slot(props) {
		let [showExtendedQualification, setShowExtendedQualification] = useState(false);

		return (
				<div className="slot">
						<div className="slot__tutor_info">
								<img alt={"photo of "+props.offering.tutor.name} src="https://pbs.twimg.com/profile_images/1192934662638837763/bbNss3q3_400x400.jpg" className="slot__tutor_info__image"/>
								<div className="slot__tutor_info__bio">
										<div className="slot__tutor_info__bio__name">
												{props.offering.tutor.name}
										</div>
										<div className="slot__tutor_info__bio__qualification">
												{props.offering.qualification} <span role="button" className="slot__tutor_info__bio__see_more" onClick={()=> {setShowExtendedQualification(!showExtendedQualification)}}>
												see {showExtendedQualification ? "less": "more"}
										</span>

										</div>
																				
								</div>
						</div>
						{showExtendedQualification && <div className="slot__tutor_info">
								<img alt={"used for alignment, normally not visible"} src="https://pbs.twimg.com/profile_images/1192934662638837763/bbNss3q3_400x400.jpg" className="slot__tutor_info__image slot__tutor_info__image--alignmentHack"/>
								<div className="slot__tutor_info__bio">
										<div className="slot__tutor_info__bio__extended_qualification">
												{props.offering.tutor.background}
										</div>
								</div>
						</div>}

						<div className="slot__slot_info">
								<div className="slot__slot_info__schedule">{DAYS_OF_THE_WEEK[props.slot.weekday]} {props.slot.start_hour} {props.slot.start_hour >= 12 ? "PM" : "AM"}</div>
								<div className="button slot__slot_info__booking_button">Book</div>
						</div>
				</div>
		)
}

function SlotSelectionScreen(props) {
		let prefs = props.prefs;
		let [slots, setSlots] = useState([[], [], [], [], [], [], []]);

		useEffect(() => {
				let action = async () => {
						// the assumption is that if it matches weekly it imples that it also matches onetime. That's why we can assume onetime even if it's payment_frequency isn't initialized yet
						let slots = (await (await fetch(`/slots?class=${prefs.course}&subscription=${prefs.payment_frequency==="weekly"}&class_style=${prefs.class_style}&capacity=${prefs.capacity}`)).json()).data
						let slots_by_day = [[], [], [], [], [], [], []];
						for(let slot of slots) { //TODO: time conversions
								slots_by_day[slot.slot.weekday].push(slot);
						}
						setSlots(slots_by_day);
				};
				action();
		}, [prefs])

		console.log(slots);

		return (
				<div className="reservation_form">
						<div className="reservation_form__heading">
								<h2 className="reservation_form__heading__title"> Select a slot </h2>
								<small className="reservation_form__heading__subtext"> Confirm your payment after this step </small>
								{ DAYS_OF_THE_WEEK.map((day_of_the_week, days_since_monday) => {
										if(slots[days_since_monday].length > 0)  {
												return (<>
												<h3> Every {day_of_the_week} </h3>
												<div className="slots">
														{slots[days_since_monday].map((slot) => (
																<Slot key={slot.slot.id} {...slot} />
														))}
												</div>
												</>);
										}
										else {
												return (<></>);
										}
								})
								}
						</div>
				</div>
		)
}

export default function ReservationForm() {
		return (
				<PrefsScreen/>
		);
}
