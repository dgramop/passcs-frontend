import {useState, useEffect} from "react";
import './ReservationForm.scss';

import {CardElement, useElements, useStripe, Elements} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe('pk_test_51JdnMmABGmiERRLGxLTG2jrTUkEzP1ySRI5ofnnm3QLKTqqClvCzoxBBiBa9rlYlsepjmeyMmo4ISTpUrMqkaYbu00QlZCW7H9');

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

		let prices_by_class_size = { 1: (prefs.payment_frequency === "onetime" ? 40 : 35), 2: (prefs.payment_frequency === "onetime" ? 35 : 30) };

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

						<Selector value={prefs.capacity} setValue={setPrefValue} name="capacity" title="Class Size" icon="people" options={[
								{text: "One-on-One $"+prices_by_class_size[1], value: 1, disabled: !enabledOptions.capacity.has(1), subtext: "Dedicated attention and focus"}, {
										text: "2 Student Class $"+prices_by_class_size[2], value: 2, disabled: !enabledOptions.capacity.has(2), subtext: "Automatically paired when available"}]} />

						<Selector value={prefs.class_style} setValue={setPrefValue} name="class_style" title="Session Location" icon="place" options={[
								{value: "in-person", text:"On-Campus", disabled: !enabledOptions.class_style.has("in-person")},
								{value: "online", text:"Online", disabled: !enabledOptions.class_style.has("online") }]} />
						
						<Selector value={prefs.payment_frequency} setValue={setPrefValue} name="payment_frequency" longer={true} title="Session Frequency" icon="autorenew" options={[
								{value: "weekly", text:"Weekly", modifier: {type:"success", text:prefs.payment_frequency === "onetime" ? ("save $5/meeting") : ""}, disabled: !enabledOptions.payment_frequency.has("weekly")},
										{value: "onetime", text:"One Time", modifier: {type:"error", text:"add $5"}, disabled: !enabledOptions.payment_frequency.has("onetime")}]} />
						<hr />
						<div className="reservation_form__submission">
								<Button extraClasses="reservation_form__submission__primaryButton" disabled={submit_disabled} onClick={() => { if(!submit_disabled) setSet(true)}} >
										Select Tutor + Time <span className="material-icons">east</span>
								</Button>
								<small className="reservation_form__submission__subtext"> You won't be charged yet </small>
						</div>
				</div>
		)
		else return (
				<SlotSelectionScreen price={prices_by_class_size[prefs.capacity]} prefs={prefs} back={() => { setSet(false) }}/>
		)
}

/**
 * Gives time info for the given time zone for a given slot
 */
function timezone_time_from_slot(slot) {
		console.log(slot.start_hour, slot.weekday);
		let start_hour = slot.start_hour - (new Date()).getTimezoneOffset()/60;
		let weekday = slot.weekday;
		console.log(start_hour, weekday);
		while(start_hour < 0) { //there exists a much faster non-iterative way to do this, go fuck yourself
				weekday--;
				start_hour+=24;
				if(weekday < 0) weekday += 7;
		}
		console.log(start_hour, weekday);
		return {start_hour, weekday};
}

function Slot(props) {
		let [showExtendedQualification, setShowExtendedQualification] = useState(false);

		let {weekday, start_hour} = timezone_time_from_slot(props.slot);
		let start_hour_str = start_hour%12 === 0 ? "12" : start_hour%12;
		let end_hour = (start_hour+props.slot.duration_mins/60);
		let end_hour_str = end_hour%12 === 0 ? "12" : end_hour%12;
		let timestring = `${DAYS_OF_THE_WEEK[weekday]}${props.meetings.length > 1 ? "s" : ""} ${start_hour_str}-${end_hour_str} ${end_hour >= 12 ? "pm" : "am"}`;

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
												{showExtendedQualification ? "less": "more"}
										</span>

										</div>
																				
								</div>

								{showExtendedQualification && <><div></div>
						<div className="slot__tutor_info__bio__extended_qualification">
								{props.offering.tutor.background}
						</div></>}

						</div>
						<div className="slot__slot_info">
								{/*TODO: replace ALL of this timing logic with the stuff from the old frontend. And if it's a subscription use plural*/}
								<div className="slot__slot_info__schedule">{timestring}</div>
								{props.onBook && <div className="button slot__slot_info__booking_button" onClick={() => {if(props.onBook) props.onBook({slot: props.slot, offering: props.offering, meetings: props.meetings})}}>Book<span className="material-icons">arrow_forward</span></div>}
								{!props.onBook && <div className="slot__slot_info__disconnect_button" onClick={() => {if(props.onUnBook) props.onUnBook({slot: props.slot, offering: props.offering, meetings: props.meetings})}}>change booking <span className="material-icons slot__slot_info__disconnect_button__icon">edit</span></div>}
						</div>
				</div>
		)
}

function Criteria(props) {
		return (<div className={"criteria "+(props.invisible ? "criteria--invisible" :"")}>
				<span role="button" className="material-icons criteria__button" onClick={props.edit}>edit</span>
				<div className="criteria__bubble">{(["Just the tutor in an empty room","One-on-One","2 Student Class"])[props.capacity]}</div>
				<div className="criteria__bubble">{props.class_style}</div>
				<div className="criteria__bubble">{props.class_number}</div>
				<div className="criteria__bubble">{props.price}{props.payment_frequency === "weekly" ? "/wk" : ""}</div>
		</div>)
}

function SlotSelectionScreen(props) {
		let prefs = props.prefs;
		let [slots, setSlots] = useState([[], [], [], [], [], [], []]);
		let [classNumber, setClassNumber] = useState("");
		let [selectedSlot, setSelectedSlot] = useState(null);

		// later passed to Payment page
		let [clientSecret, setClientSecret] = useState("");
		let options = {
				clientSecret
		}

		useEffect(() => {
				let action = async () => {
						// the assumption is that if it matches weekly it imples that it also matches onetime. That's why we can assume onetime even if it's payment_frequency isn't initialized yet
						let slots = (await (await fetch(`/slots?class=${prefs.course}&subscription=${prefs.payment_frequency==="weekly"}&class_style=${prefs.class_style}&capacity=${prefs.capacity}`)).json()).data
						if(slots.length === 0) return;
						if(prefs.course !== slots[0].offering["class"].id) throw new Error("first meeting doesn't match selected class ID");
						setClassNumber(slots[0].offering["class"].course_number);
						
						let slots_by_day = [[], [], [], [], [], [], []];
						for(let slot of slots) { //TODO: time conversions

								slots_by_day[slot.slot.weekday].push(slot);
						}
						setSlots(slots_by_day);
				};
				action();
		}, [prefs])

		console.log(slots);

		// TODO Differentiate This Tuesday vs Next Tuesday with separate headings. Sort by first meeting occurence epoch
		// Text on headings should be Every Tuesday v s Every Tuesday, Starting Next Week
		if(!selectedSlot)
		return (
				<div className="reservation_form">
						<div className="reservation_form__heading">
								<h2 className="reservation_form__heading__title"> Select a slot </h2>
								<small className="reservation_form__heading__subtext"> Confirm your payment after this step </small>
								<Criteria class_size={prefs.class_size} payment_frequency={prefs.payment_frequency} capacity={prefs.capacity} class_number={classNumber} price={"$"+props.price} class_style={{"online": "Online","in-person":"On campus"}[prefs.class_style]} edit={props.back} />
								{ DAYS_OF_THE_WEEK.map((day_of_the_week, days_since_monday) => {
										if(slots[days_since_monday].length > 0)  {
												return (<>
												<h3> {prefs.payment_frequency!=="onetime" ? "Every" : ""} {day_of_the_week} </h3>
												<div className="slots">
														{slots[days_since_monday].map((slot) => (
																<Slot onBook={(slot) => {setSelectedSlot(slot)}} key={slot.slot.id} {...slot} />
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
		else return (
				<Elements stripe={stripePromise}>
						<Payment price={props.price} prefs={prefs} slot={selectedSlot} editPrefs={props.back} editSlot={() => setSelectedSlot(null)}/>
				</Elements>
		)
}

/**
 * props.icon {String} Text for the material icon to use
 * props.children {String} Text displayed next to the assurance
 */
function Assurance(props) {
		return (
		<div className="assurance">
				<span className="assurance__icon material-icons">{props.icon}</span>
				<span className="assurance__text">{props.children}</span>
		</div>
		)
}

function Payment(props) {
		let [disable, setDisabled] = useState(false);

		const stripe = useStripe();
		const elements = useElements();

		return (
		<div className="reservation_form">
				<div className="reservation_form__heading">
						<h2 className="reservation_form__heading__title">Confirm Booking</h2>
						<small className="reservation_form__heading__subtext">Your card will be charged</small>
				</div>
				<h3> Your Booking </h3>
				<Slot {...props.slot} onUnBook={()=>props.editSlot()} />
				<br/>
				<div className="payment_form">
						<h3 className="payment_form__title"> Payment </h3>
						<Criteria invisible class_size={props.prefs.class_size} payment_frequency={props.prefs.payment_frequency} capacity={props.prefs.capacity} class_number={props.slot.offering.class.course_number} price={"$"+props.price} class_style={{"online": "Online","in-person":"On campus"}[props.prefs.class_style]} edit={props.editPrefs} />
						<div className="payment_form__line">
								<div className="input_group">
										<label className="payment_form__label" for="firstname">
												First Name
										</label>
										<input size="10" className="payment_form__input payment_form__input--half" name="firstname" id="firstname" disabled={disable} placeholder="Richard"/>
								</div>

								<div className="input_group">
										<label className="payment_form__label" for="lastname">
												Last Name
										</label>
										<input size="10" className="payment_form__input payment_form__input--half" name="lastname" id="lastname" disabled={disable} placeholder="Stallman"/>
								</div>
						</div>
						<div className="input_group">
								<label for="email" className="payment_form__label" >
										Email Address
								</label>
								<input name="email" id="email" type="email" className="payment_form__input" disabled={disable} placeholder="rstallman@gmu.edu"/>
						</div>

						<div className="input_group">
								<label for="phone" className="payment_form__label" >
										Phone Number
								</label>
								<input name="phone" className="payment_form__input" disabled={disable} type="phone" placeholder="5555555555"/>
						</div>
						<div className="input_group">
								<label for="phone" className="payment_form__label" >
										Card
								</label>
								<CardElement className="payment_form__input" disabled={disable} />
						</div>
						<div className="assurances">
								<Assurance icon="lock">
										Your payment is secured by Stripe and SSL
								</Assurance>
								<Assurance icon="check">
										Eligible for the passCS Guarentee, subject to <a href="TODO">terms</a>
								</Assurance>
								<Assurance icon="logout">
										Easy cancellation
								</Assurance>
						</div>
						<div className="payment_form__submission_deck">
								<div className="payment_form__submission_deck__qualification">
										Your payments will automatically stop at the end of the semester. $30 now, then 24 hours before each session
								</div>
								<Button extraClasses="payment_form__submission_deck__submit">
										Pay
								</Button>
						</div>
				</div>
		</div>
		)
}

/**
 * props.extraClasses Additional classes
 * props.disabled Disabled
 * props.onClick On click function
 * props.children Button content
 */

function Button(props) {
		return (
		<div role="button" className={"button "+(props.disabled ? "button--disabled " : "")+props.extraClasses} onClick={() => {if(!props.disabled && props.onClick) props.onClick()}}>
				{props.children}
		</div>
		)
}

export default function ReservationForm() {
		return (
				<PrefsScreen/>
		);
}
