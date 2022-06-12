import React, {useState, useEffect, forwardRef, useLayoutEffect, useRef} from "react";
import './ReservationForm.scss';
import {get_logged_in_customer, Button, DAYS_OF_THE_WEEK, timezone_time_from_slot, sendLoginLink} from "./Components";
import {useNavigate} from "react-router-dom";

import {CardElement, useElements, useStripe, Elements} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(process.env["NODE_ENV"] === "development" ? 'pk_test_51JdnMmABGmiERRLGxLTG2jrTUkEzP1ySRI5ofnnm3QLKTqqClvCzoxBBiBa9rlYlsepjmeyMmo4ISTpUrMqkaYbu00QlZCW7H9' : 'pk_live_51JdnMmABGmiERRLGpQnemsRk0xpo06XnoPtwI3doKvNd1SQBMkOWTqNQmUsLCTsHDk1yawB83A2cuqUIBGU2NA5o00QOHX6xXi');
// live public key 


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
						<div className={"choose__button "+(props.disabled ? "choose__button--disabled " : "")+(props.selected ? "choose__button--selected ": "")}>
								<div className="choose__button__left">{props.children}</div> <div className={"choose__button__modifier " + ({null: "", "error":"choose__button__modifier--error", "success":"choose__button__modifier--success"}[props.modifier?.type])}>{props.disabled ? "" : props.modifier?.text}</div>
						</div>
					{props.subtext && <div className="choose__subtext">{props.subtext}</div>}
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


const PrefsScreen = React.forwardRef((props, ref) => {
		let [prefs, setPrefs] = useState({university:"GMU", capacity: 1, class_style: "in-person", payment_frequency: "weekly"})
		let [set, setSet] = useState(false);
		let [courses, setCourses] = useState([]);
		let [slots, setSlots] = useState([]);
		let [error, setError] = useState(null);
		let [enabledOptions, setEnabledOptions] = useState({capacity:new Set(), payment_frequency:new Set(), class_style: new Set()});

		let setPrefValue = (name, value) => {
				setPrefs({...prefs, [name]: value});
		}

		useEffect(() => {
				let action = async () => {
						let courses = (await (await fetch("/api/courses")).json()).data
						setCourses(courses);
				};
				action();
		},[])

		useEffect(() => {
				let action = async () => {
						setError(null);
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

						let slots = (await (await fetch(`/api/slots?class=${prefs.course}&${optionalQuery}`)).json()).data
					 	if(slots.length == 0) {
							setError("Sorry, no availability for selected class. Try again later");
						}
						setSlots(slots);
				};
				try {
					action();
				} catch (e) {
					setError("Couldn't communicate with server. Check back later!");
				}

		},[prefs.course]) //intentionally short here, because we have a client-side resolver for similar information that actually gives us a summary

		useEffect(() => {
				setEnabledOptions(summarize(prefs, slots));
		}, [prefs, slots])

		let submit_disabled = prefs.university == null || prefs.course == null || prefs.capacity == null || prefs.class_style == null || prefs.payment_frequency == null;

		let prices_by_class_size = { 
			1: {
				discounted: (prefs.payment_frequency === "onetime" ? 35 : 34),
				original: 50 
			},
			2: {
				discounted: (prefs.payment_frequency === "onetime" ? 30 : 29),
				original: 35
			}
		};

		if(!set)
		return (
				<div ref={ref} className="reservation_form">
						<div className="reservation_form__heading">
								<h2 id="reservation" className="reservation_form__heading__title"> Find a seat </h2>
								<small className="reservation_form__heading__subtext"> You won't be charged yet </small>
						</div>
						<Selector value={prefs.university} setValue={setPrefValue} name="university" title="University" icon="school" options={[{text: "George Mason", value: "GMU"}]} > </Selector>
						<Selector value={prefs.course} setValue={setPrefValue} name="course" longer={true} title="Class" icon="class" options={courses.length > 0 ? courses.map((course) => {
								return {value: course.id, text: course.course_number+" - "+course.course_name };
						}) : [{value:"-1", text:"No classes available to book", disabled:true}]}/>

						{error && <div className="reservation_form__error">{error}</div>}
						{prefs.course == null && <div className="reservation_form__instructions"><span className="material-icons">info</span> <span>Please select a class to continue</span></div>}

						<Selector value={prefs.capacity} setValue={setPrefValue} name="capacity" title="Class Size" icon="people" options={[
							{text: <>One-on-One <s className="reservation_form__originalprice">${prices_by_class_size[1].original}</s> ${prices_by_class_size[1].discounted}</>, value: 1, disabled: !enabledOptions.capacity.has(1), subtext: "Focused attention"}, {
							text: <>One-on-Two <s className="reservation_form__originalprice">${prices_by_class_size[2].original}</s> ${prices_by_class_size[2].discounted}</>, value: 2, disabled: !enabledOptions.capacity.has(2), subtext: "Price per student"}]} />

						<Selector value={prefs.class_style} setValue={setPrefValue} name="class_style" title="Session Location" icon="place" options={[
								{value: "in-person", text:"On-Campus", disabled: !enabledOptions.class_style.has("in-person")},
								{value: "online", text:"Online", disabled: !enabledOptions.class_style.has("online") }]} />
						
						<Selector value={prefs.payment_frequency} setValue={setPrefValue} name="payment_frequency" longer={true} title="Session Frequency" icon="autorenew" options={[
								{value: "weekly", text:"Weekly", modifier: {type:"success", text:prefs.payment_frequency === "onetime" ? ("save $1/meeting") : ""}, disabled: !enabledOptions.payment_frequency.has("weekly")},
										{value: "onetime", text:"One Time", modifier: {type:"error", text:"add $1"}, disabled: !enabledOptions.payment_frequency.has("onetime")}]} />
						<hr className="reservation_form__submission__divider" />
						<div className="reservation_form__submission">
								<Button extraClasses="reservation_form__submission__primaryButton" disabled={submit_disabled} onClick={() => { if(!submit_disabled) { setSet(true)}}} >
										Select Tutor + Time <span className="material-icons">east</span>
								</Button>
								<small className="reservation_form__submission__subtext"> You won't be charged yet </small>
						</div>
				</div>
		)
		else return (
				<SlotSelectionScreen slots={slots} ref={ref} price={prices_by_class_size[prefs.capacity].discounted} prefs={prefs} back={() => { setSet(false); props.scrollFn() }} scrollFn={props.scrollFn}/>
				
		)
})



function Slot(props) {
		let [showExtendedQualification, setShowExtendedQualification] = useState(false);

		let {weekday, start_hour} = timezone_time_from_slot(props.slot);
		let start_hour_str = start_hour%12 === 0 ? "12" : start_hour%12;
		let end_hour = (start_hour+props.slot.duration_mins/60);
		let end_hour_str = end_hour%12 === 0 ? "12" : end_hour%12;
		let timestring = `${DAYS_OF_THE_WEEK[weekday]}${props.meetings.length > 1 ? "s" : ""} ${start_hour_str}-${end_hour_str} ${end_hour >= 12 ? "pm" : "am"}`;
		let first_meeting_date = new Date(props.meetings[0].occurrence_epoch*1000);

		return (
				<div className="slot">
						<div className="slot__tutor_info">
								<img alt={"photo of "+props.offering.tutor.name} src={"/"+props.offering.tutor.id+".jpg"} className="slot__tutor_info__image"/>
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
								<div className="slot__slot_info__schedule"><div className="slot__slot_info__schedule__recur">{timestring}</div> <div className="slot__slot_info__schedule__begin">Starts {first_meeting_date.getMonth() +1}/{first_meeting_date.getDate()}</div></div>
								{props.onBook && <div className="button slot__slot_info__booking_button" onClick={() => {if(props.onBook) props.onBook({slot: props.slot, offering: props.offering, meetings: props.meetings})}}>Book<span className="material-icons">arrow_forward</span></div>}
								{!props.onBook && <div className="slot__slot_info__disconnect_button" onClick={() => {if(props.onUnBook) props.onUnBook({slot: props.slot, offering: props.offering, meetings: props.meetings})}}><span className="material-icons slot__slot_info__disconnect_button__icon">edit</span></div>}
						</div>
				</div>
		)
}

function Criteria(props) {
		return (<div className={"criteria "+(props.invisible ? "criteria--invisible" :"")}>
				<div className="criteria__heading">
					<span className="criteria__heading__title">Filters</span>
					<span role="button" onClick={props.edit} className="material-icons criteria__heading__button" >edit</span>
				</div>

			<div className="criteria__bubble__container">
				<div className="criteria__bubble">{(["Just the tutor in an empty room","One-on-One","One-on-Two"])[props.capacity]}</div>
				<div className="criteria__bubble">{props.class_style}</div>
				<div className="criteria__bubble">{props.class_number}</div>
				<div className="criteria__bubble">{props.price}{props.payment_frequency === "weekly" ? "/wk" : ""}</div>
			</div>
		</div>)
}

const SlotSelectionScreen = React.forwardRef((props, ref) => {
		let prefs = props.prefs;
		let [slots, setSlots] = useState([[], [], [], [], [], [], []]);
		let [classNumber, setClassNumber] = useState("");
		let [selectedSlot, setSelectedSlot] = useState(null);

		let slot_selected = selectedSlot==null;
		useLayoutEffect(() => {
				if(props.scrollFn) props.scrollFn();
		}, [ref, slots, slot_selected])

		useEffect(() => {
			let action = async () => {

						// if the previous step let us come here, we must have a complete query in props.slots
						let slots = props.slots.sort((sa,sb) => {
							return new Date(sa.slot.anchor_epoch*1000).getHours() - new Date(sb.slot.anchor_epoch*1000).getHours();
						})
						if(prefs.course !== slots[0].offering["class"].id) throw new Error("first meeting doesn't match selected class ID");
						setClassNumber(slots[0].offering["class"].course_number);
						
						let slots_by_day = [[], [], [], [], [], [], []];
						for(let slot of slots) { //TODO: time conversions
							let {weekday} = timezone_time_from_slot(slot.slot);

								slots_by_day[weekday].push(slot);
						}
						setSlots(slots_by_day);
				};
				action();
		}, [prefs, props.slots])


		// TODO Differentiate This Tuesday vs Next Tuesday with separate headings. Sort by first meeting occurence epoch
		// Text on headings should be Every Tuesday v s Every Tuesday, Starting Next Week
		if(!selectedSlot)
		return (
				<div ref={ref} className="reservation_form">
						<Button extraClasses="reservation_form__backbutton" onClick={props.back} secondary><span className="material-icons">arrow_back</span></Button>
						<div className="reservation_form__heading">
								<h2 className="reservation_form__heading__title" id="reservation"> Select a slot </h2>
								<small className="reservation_form__heading__subtext"> Confirm your payment after this step </small>
						</div>
						<div>
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
						<Payment ref={ref} price={props.price} prefs={prefs} slot={selectedSlot} editPrefs={props.back} editSlot={() => setSelectedSlot(null)} scrollFn={props.scrollFn}/>
				</Elements>
		)
})

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

async function register_customer(firstname, lastname, email, phone) {
		let form_data = new FormData();
		form_data.append('email',email);
		form_data.append('phone',phone);
		form_data.append('firstname',firstname);
		form_data.append('lastname',lastname);

		let fetch_res = await fetch("/api/customers", {method: "POST", body: form_data});
		let json_res = await fetch_res.json();
		console.log(json_res);
		return json_res;
}

/**
 * Registers for a given slot
 */
async function register_payment(slot, prefs, offering, first_meeting) {
		let form_data = new FormData();
		form_data.append('meeting',first_meeting.id);
		form_data.append('slot',slot.id);
		form_data.append('class_style',prefs.class_style);
		form_data.append('capacity',prefs.capacity);
		form_data.append('offering',offering.id);

		let fetch_res = await fetch("/api/payments", {method: "POST", body: form_data});
		let json_res = await fetch_res.json();
		console.log(json_res);
		return json_res;
}

async function register_subscription(slot, prefs, offering, first_meeting) {
		let form_data = new FormData();
		form_data.append('meeting',first_meeting.id);
		form_data.append('slot',slot.id);
		form_data.append('class_style',prefs.class_style);
		form_data.append('capacity',prefs.capacity);
		form_data.append('offering',offering.id);

		let fetch_res = await fetch("/api/subscriptions", {method: "POST", body: form_data});
		let json_res = await fetch_res.json();
		console.log(json_res);
		return json_res;
}


const Payment = React.forwardRef((props, ref) => {
		// if the submit button is disabled or not
		let [disable, setDisabled] = useState(false);

		// if the user is logged in or not
		let [loggedIn, setLoggedIn] = useState(false);

		// react router setup so we can later navigate the user to their dashboard
		let navigate = useNavigate();

		//for some browsers, autocomplete doesn't trigger onChange. We had a customer run into this issue and abandon a checkout because the payment button was disabled

		// checks if a customer has a valid token
		useEffect(() => {
				get_logged_in_customer().then(() => setLoggedIn(true)).catch(()=> setLoggedIn(false))
		}, []);

		// if we just mounted and rendered the component, scroll to the top, if a scroll top function was provided
		useLayoutEffect(() => {
				if(props.scrollFn) props.scrollFn();
		}, [props, loggedIn])

		// form tracking state
		let [form, setForm] = useState({
				// angry tells us to highlight the input
				firstname: {value: "", invalid:true, angry: false},
				lastname: {value: "", invalid: true, angry: false},
				email: {value: "", invalid: true, angry: false},
				phone: {value: "", invalid: true, angry: false}
		});

		// track form errors
		let [error, setError] = useState(null);

		// update parts of the forms state, with validation
		function updateForm(name, value) {
				if(name==='phone' && (!((new RegExp("^[0-9\-]*$")).test(value)) || value.length>12)){
						return;
				} else if (name ==='phone' && value.length >=10) {
						setForm({...form, phone: {...form[name], invalid:false, value}})
				} else if (name === 'phone' && value.length < 10) {
						setForm({...form, phone: {...form[name], invalid:true, value}})
				}
				else if(name==='email' && (new RegExp("^[^@]+@[^@]+\.[^@]+$")).test(value)) {
						console.log("valid email");
						setForm({...form, email: {...form[name], invalid:false, value}})
				}
				else if((name==='firstname' || name==='lastname') && value.length > 0) {
					
						console.log("name is valid, setting invalid to be false");
						setForm({...form, [name]: {...form[name], invalid:false, value}})
				}
				else {
					console.log("setting invalid field"+name);
					setForm({...form, [name]: {...form[name], value}})
				}
		}

		// makes an invalid input glow red
		function setAngry(e) {
				setForm({...form, [e.target.name]: {...form[e.target.name], angry:true}})
		}

		// stripe setup
		const stripe = useStripe();
		const elements = useElements();

		// see index.html, this cleverly sets the styles of the iframed-out stripe input
		let font_size = window.getComputedStyle(document.getElementsByClassName("payment_form__input")[0], null).getPropertyValue('font-size');;

		// stores the stripe payment intent for the client secret
		let [clientSecret, setClientSecret] = useState(null);

		// This code submits the form
		async function submit() {
				setDisabled(true);
				setError(""); //clear out the error so it won't be visible after succes
				let customer = null;

				try  {
						customer = await get_logged_in_customer() 
				} catch (e) {
						if(loggedIn) { //they managed to log out!
								setLoggedIn(false);
								setError("Your session has expired. Please login again");
								return;
						}
						customer = null;
				}

				if(!customer) {
						//customer isn't logged in, so we'll try to register the customer
						try {
								let resp = await register_customer(form.firstname.value, form.lastname.value, form.email.value, form.phone.value.replace(new RegExp("[^0-9\.]","g"),""));
								if(resp.error) {
										switch(resp.error.type) {
												case "ValidationError": 
														setError("Please update your "+(({"firstname":"First Name", "lastname": "Last Name"})[resp.error.field] || resp.error.field));
														setForm({...form, [resp.error.field]: {...form[resp.error.field], angry:true, invalid: true}})
														break;
												case "DBError": 
														setError("System Error. Please contact dhruv@passcs.io or try again later.");
														break;
												case "StripeError":
														setError("Payment Gateway Error. Please contact dhruv@passcs.io or try again later.");
														break;
												case "CookieAuthError":
														setError("Failed to log you in. Please try contact dhruv@passcs.io, or try again with a new email address");
														break;
												case "AlreadyExists":
														try {
															await sendLoginLink(form.email.value);
															setError("You must log in to complete this transaction. We emailed you a quick login link to your email, you may return to this tab after logging in");
														} catch(e) {
															console.log("failed to automatically send login link");
															setError("You must log in to complete this transaction.");
														}
														break;
												default:
														setError(resp.error.type)
														break;
										}
										setDisabled(false)
										setLoggedIn(false)
										return;
								} else {
										setDisabled(false)
										setLoggedIn(true)
										customer = resp?.data.customer;
								}
						} catch(e) {
								console.log(e);
								setError("Unknown Error");
								setDisabled(false)
								return;
						}
				} 

				let client_secret = clientSecret;
				if(client_secret==null) {
						if(props.prefs.payment_frequency === 'weekly') {
								try {
										let resp = (await register_subscription(props.slot.slot, props.prefs, props.slot.offering, props.slot.meetings[0]));
										if (resp.error) {
												switch(resp.error.type) {
														case "NotCustomer":
																setError("You aren't a customer, and therefore cannot complete this transaction");
																break;
														case "DBError":
																setError("System Error. Please contact dhruv@passcs.io or try again later.");
																break;
														case "MeetingAndSlotDontMatch": 
																setError("Invalid first meeting for chosen slot")
																break;
														case "PrefFailedToMatch": 
																setError("Somebody beat you to this booking! Failed to match "+resp.error.pref)
																break;
														case "MeetingFull":
																setError("Somebody beat you to this booking! There is no more space")
																break;
														case "AlreadyExists":
																setError("You have already subscribed to this slot")
																break;
														case "CustomerNotFound":
																setError("This customer has been deleted or does not exist");
																break;
														case "MeetingNotFound": 
																setError("This meeting has been deleted");
																break;
														case "StripeError":
																setError("Payment Gateway Error: Could not complete transaction");
																break;
														default:
																setError(resp.error)
																break;
												}
												setDisabled(false);
												return;
										} else {
												client_secret = resp.data.client_secret;
												setClientSecret(client_secret);
										}
								} catch (e) {
										console.log(e);
										setError("Unknown Error");
										setDisabled(false)
								}
						} else {
								try {
										let resp = (await register_payment(props.slot.slot, props.prefs, props.slot.offering, props.slot.meetings[0]));
										if(resp.error) {
												switch(resp.error.type) {
														case "NotCustomer":
																setError("You aren't a customer, and therefore cannot complete this transaction");
																break;
														case "DBError":
																setError("System Error. Please contact dhruv@passcs.io or try again later.");
																break;
														case "MeetingAndSlotDontMatch": 
																setError("Invalid meeting for chosen slot")
																break;
														case "PrefFailedToMatch": 
																setError("Somebody beat you to this booking! Failed to match "+resp.error.pref)
																break;
														case "MeetingFull":
																setError("Somebody beat you to this booking! There is no more space")
																break;
														case "AlreadyExists":
																setError("You have already joined this meeting")
																break;
														case "CustomerNotFound":
																setError("This customer has been deleted or does not exist");
																break;
														case "MeetingNotFound": 
																setError("This meeting has been deleted");
																break;
														case "StripeError":
																setError("Payment Gateway Error: Could not complete transaction");
																break;
														default:
																setError(resp.error.type)
																break;
												}
												setDisabled(false)
												return;
										} else {
												client_secret = resp.data.client_secret;
												setClientSecret(client_secret);
										}
								} catch(e) {
										console.log(e);
										setError("Unknown Error");
										setDisabled(false)
										return;				
								}
						}
				}

				const payload = await stripe.confirmCardPayment(client_secret, {
						payment_method: {
								card: elements.getElement(CardElement),
								billing_details: {
										name: props.prefs.firstname+" "+props.prefs.lastname
								}
						}
				})						

				console.log(payload);

				if(payload.error) {
						setError(payload.error.message);
						setDisabled(false);
						return;
				} else {
					navigate("/dashboard");
				}

				setDisabled(false);
		}

		let submitDisabled = disable || (!loggedIn && (form.firstname.invalid || form.lastname.invalid || form.email.invalid || form.phone.invalid))

		return (
		<div className="reservation_form" ref={ref}>
				<Button extraClasses="reservation_form__backbutton" onClick={props.editSlot} secondary><span className="material-icons">arrow_back</span></Button>
				<div className="reservation_form__heading">
						<h2 className="reservation_form__heading__title">Confirm Booking</h2>
						<small className="reservation_form__heading__subtext">Your card will be charged</small>
				</div>
				<Criteria class_size={props.prefs.class_size} payment_frequency={props.prefs.payment_frequency} capacity={props.prefs.capacity} class_number={props.slot.offering.class.course_number} price={"$"+props.price} class_style={{"online": "Online","in-person":"On campus"}[props.prefs.class_style]} edit={props.editPrefs} />
				<Slot {...props.slot} onUnBook={()=>props.editSlot()} />
				<form className="payment_form" onSubmit={(e) => {
					e.preventDefault();
					if(!submitDisabled) submit()
					return false;
				}}>
						<h3 className="payment_form__title"> Book Meeting </h3>
						{!loggedIn && <><div className="payment_form__line">
								<div className="input_group">
										<label className="payment_form__label" for="firstname">
												First Name
										</label>
										<input onBlur={setAngry} value={form.firstname.value} onChange={(e) => {updateForm("firstname", e.target.value)}} size="10" className={"payment_form__input payment_form__input--half "+(form.firstname.angry && form.firstname.invalid ? "angry " :"")} name="firstname" id="firstname" disabled={disable} placeholder="Richard"/>
								</div>

								<div className="input_group">
										<label className="payment_form__label" for="lastname">
												Last Name
										</label>
										<input onBlur={setAngry} value={form.lastname.value} onChange={(e) => {updateForm("lastname", e.target.value)}} size="10" className={"payment_form__input payment_form__input--half "+(form.lastname.angry && form.lastname.invalid ? "angry " :"")} name="lastname" id="lastname" disabled={disable} placeholder="Stallman"/>
								</div>
						</div>
						<div className="input_group">
								<label for="email" className="payment_form__label" >
										Email Address
								</label>
								<input onBlur={setAngry} value={form.email.value} onChange={(e) => {updateForm("email", e.target.value)}} name="email" id="email" type="email" className={"payment_form__input "+(form.email.angry && form.email.invalid ? "angry " :"")} disabled={disable} placeholder="rstallman@gmu.edu"/>
						</div>

						<div className="input_group">
								<label for="phone" className="payment_form__label" >
										Phone Number
								</label>
								<input onBlur={setAngry} value={form.phone.value} onChange={(e) => {updateForm("phone", e.target.value)}} name="phone" className={"payment_form__input "+(form.phone.angry && form.phone.invalid ? "payment_form__input--angry " :"")} disabled={disable} type="phone" placeholder="5555555555"/>
						</div></>}
						<div className="input_group">
								<label for="phone" className="payment_form__label" >
										Card
								</label>
								<CardElement options={{style:{base:{fontSize:font_size}}, disabled: disable}} className="payment_form__input"/>
						</div>
						<div className="assurances">
								<Assurance icon="lock">
										Your payment is secured by Stripe and SSL
								</Assurance>
								<Assurance icon="check">
										Eligible for the passCS Guarantee, subject to <a href="TODO">terms</a>
								</Assurance>
								{props.prefs.payment_frequency === 'weekly' && <Assurance icon="logout">
										Easy cancellation
								</Assurance>}
						</div>
						<div className="payment_form__submission_deck">
								<div className="payment_form__submission_deck__qualification">
										{error && <><div className="payment_form__error">{error}</div><br/></>}
										{props.prefs.payment_frequency === "weekly" && <>Your payments will automatically stop at the end of the semester. ${props.price} now, then 24 hours before each session</>}
								</div>
								<Button disabled={submitDisabled} onClick={submit} extraClasses="payment_form__submission_deck__submit">
										Pay
								</Button>
						</div>
				</form>
		</div>
		)
})



const ReservationForm = React.forwardRef((props, ref) => ( <PrefsScreen {...props} ref={ref}/> ))
export default ReservationForm;
