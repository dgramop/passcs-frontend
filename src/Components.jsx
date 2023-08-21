import {useEffect, useState} from "react"
import {Link, useNavigate} from "react-router-dom"
import LoaderWhite from "./LoaderWhite.svg";
import LoaderBlack from "./LoaderBlack.svg";
import {DateTime} from "luxon";

export function SidebarButton({onClick, selected, name, icon, text, ...props}) {
	const navigate = useNavigate();
	return (
		<div onClick={() => {if(onClick) { onClick() } else { navigate(name)}}} className="sidebar__button">
			<div className={["sidebar__button__indicator", (name === selected ? "sidebar__button__indicator--active" : "")].join(" ")}></div>
			<div className="sidebar__button__icon">{icon}</div>
			<div className="sidebar__button__text">{text}</div>
		</div>
	)
}

export async function sendLoginLink(email) {
		try {
				let r;
				if(email.indexOf("@passcs.io") !== -1)
				{
					// a bit of a hack, but easy to fix
					r = await fetch("/api/login?user_type=tutor&email="+email.toLowerCase(),{method: "POST"});
				} else {
					r = await fetch("/api/login?user_type=customer&email="+email.toLowerCase(),{method: "POST"});
				}

				r = await r.json()
				if(r.error) throw r.error
				return r;
		} catch(e) {
				if(!e.type) throw new Error({type: "Cannot contact server"})
				else throw e;
		}
}

export async function get_logged_in_customer() {
		let customer_resp = await fetch("/api/customers/myself");
		customer_resp = await customer_resp.json()
		if(customer_resp.error) {
				throw customer_resp;
		}
		else return customer_resp?.data;
}

export async function get_token() {
		let token_resp = await fetch("/api/checkauth");
		token_resp = await token_resp.json()
		if(token_resp.error) {
				throw token_resp;
		}
		else return token_resp?.data;
}

/**
 * Deprecated, use get_date_info instead: Gives time info for the given time zone for a given slot
 */
export function timezone_time_from_slot(slot) {
	let date = new Date(slot.anchor_epoch*1000);
	
	return {start_hour: date.getHours(), weekday: (date.getDay() + 6)%7};
}

export function get_date_info(date) {
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
		"minutes":minutes,
		"month":(["January","February","March","April","May","June","July","August","September","October","November","December"])[date.getMonth()]
	}
}

/**
 * Returns approximately how long ago the date supplied was, in the most-significant units
 * Rounds Down (chops)
 * @param date - JS Date Object
 */
export function get_duration_info(date) {
	let start_date = DateTime.fromJSDate(date);
	let end_date = DateTime.fromMillis(Date.now())

	let units =["years", "months", "weeks", "days", "hours", "minutes", "seconds"]; 

	let diff = end_date.diff(start_date, units)

	for(let unit of units) {
		if(diff[unit] !== 0) {
			return `${Math.abs(Math.floor(diff[unit]))} ${unit.substring(0, Math.floor(diff[unit]) !== 1 ? unit.length : unit.length-1)} ${Math.floor(diff[unit]) > 0 ? "ago" : "from now"}`
		}
	}

	return "now";
}

export const DAYS_OF_THE_WEEK = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

/**
*
* @param {*} light - If the color of the loader should be light 
* @param {*} text - If this is a textual loader (defaults to spinner)
* @returns 
*/
export function Loader({light, text, ...props}) {
	if(text) {
		return (
			<span className={"loader loader--text "+(light ? "loader--light" : "")}>{"".padStart(text,"0")}</span>
		)
	}
	else {
		return (
			<img className="loader--spinner" src={light ? LoaderWhite : LoaderBlack} alt="Load Icon"/>
		)
	}
}
/**
 * props.extraClasses Additional classes
 * disabled Disabled
 * loading Button represents loading situation
 * thin Reduce button height for compact buttons
 * props.onClick On click function
 * props.children Button content
 */
export function Button({loading, thin, disabled, ...props}) {
		return (
			<div role="button" className={"button "+(loading ? "button--loading " : "")+(thin ? "button--thin " : "")+(props.red ? "button--red " : "")+(props.green ? "button--green " : "")+(disabled ? "button--disabled " : "")+(props.secondary ? "button--secondary " : "")+(props.darktheme ? "button--secondary--darktheme " : "")+(props.secondary && props.red ? "button--secondary--red" : "")+(props.extraClasses != null ? props.extraClasses : "")} onClick={() => {
				if(!disabled && !loading && props.onClick) props.onClick()
				if((disabled || loading) && props.onDisabledClick) props.onDisabledClick()
				}}>
				{props.children}
				{loading && <Loader light={!props.secondary}/>}
		</div>
		)
}

export function Modal(props) {
		return (<>
				<div className="modal__container" onClick={() => props.close()}>
				</div>
				<div className="modal">
						<div className="modal__header">
								{props.icon && <span className="material-icons modal__header__icon">{props.icon}</span>}
								<span className="modal__header__title">{props.title}</span>
						</div>
						<div className="modal__text">
								{props.children}
						</div>
						<div className="modal__buttons">
								<div className="modal__buttons__secondary">{props.buttons?.secondaries && props.buttons.secondaries.map((buttonProps) => (
										<Button secondary={true} {...buttonProps}>{buttonProps.text}</Button>
								))}
								</div>
								
								{props?.buttons?.primary && <Button {...props.buttons.primary} extraClasses={(props.buttons.primary.extraClasses || "") + " modal__buttons__primary"} >{props.buttons.primary.text}</Button>}
						</div>
				</div>
		</>
		)
}


export function LoginModal(props) {
	const [email, setEmail] = useState("");
	const [waitingForLogIn, setWaitingForLogIn] = useState(false);
	const [loginError, setLoginError] = useState(null);
	const [showLoginSuccess, setShowLoginSuccess] = useState(false);

	let submit = async () => {
		setLoginError(null);
		setWaitingForLogIn(true);

		try {
			if((await sendLoginLink(email)).status === "success") {
				setShowLoginSuccess(true);
			}  
		} catch(e) {
			if(e.type) setLoginError(e.type);
			else console.log(e) 
		}

		setWaitingForLogIn(false);
	};

	let disabled = !(new RegExp("^[^@]+@[^@]+\.[^@]+$")).test(email) || waitingForLogIn; 

	if(showLoginSuccess) {
		return(<Modal title="Check your inbox" icon="email" buttons={{primary:{text:"Close", onClick: ()=>{setShowLoginSuccess(false); props.close()}}}} close={()=>setShowLoginSuccess(false)}>
		</Modal>)
	} else {
			return (
				<Modal title="Get a magic log-in link" icon="auto_fix_high" buttons={{primary: {text:"Send Link", loading:waitingForLogIn, onClick: submit, disabled}, secondaries: [{text:"Go Back", onClick:()=> props.close()}]}} close={()=>props.close()}>
					We’ll email you a link you can use to log-in with in with one click
					<div className="modal__text__form">
						<form onSubmit={(e) => {
							e.preventDefault()
							if(!disabled) submit()
							return false;
						}}>
							<label htmlFor="login__email">Email Address</label><br/>
							<input id="login__email" type="email" placeholder="jdoe@gmail.com" onChange={(e) => setEmail(e.target.value)}/>
							{loginError && <div className="login__error">{loginError && (({"UserNotFound": "We can't find your account"})[loginError] || loginError) }</div>}
						</form>
					</div>
			</Modal>)
	}
}

export function get_next_meeting(meeting_info) {
		let next_meeting = null;
		for(let meeting of meeting_info) {
			if((next_meeting == null || meeting.meeting.occurrence_epoch < next_meeting.meeting.occurrence_epoch) && meeting.meeting.occurrence_epoch*1000 > Date.now()) {
						next_meeting = meeting;
				}
		};

		return next_meeting;
}

export function Header(props) {
		return (
		<header className="header">
				<div className="header__content">
						<Link className="header__homelink" to="/"><img className="header__icon" src={"/flag192.png"} alt="passCS icon: a green pennant flag"/></Link>
						<h1 className="header__title"> {props.title} </h1>
				</div>
		</header>
		)
}

export function Chip({icon, white, children, ...props}) {
	let chip_classes = ["chip"];
	if(white) {
		chip_classes.push("chip--white")
	}
	return (
		<div className={chip_classes.join(" ")}>
			<div className="chip__icon">
				{icon}
			</div>
			<div className="chip__contents">
				{children}
			</div>
		</div>
	);
}

export function TextField({onChange, value, className, disabled, placeholder, type, autoComplete, ...props}) {
		return (
			<input autoComplete={autoComplete || "off"} type={type || "text"} value={value} onChange={(e) => {if(onChange) onChange(e.target.value)}} className={className} disabled={disabled} placeholder={placeholder || ""}/>
		)
}

export async function register_customer(firstname, lastname, email, phone) {
		let form_data = new FormData();
		form_data.append('email',email.toLowerCase());
		form_data.append('phone',phone);
		form_data.append('firstname',firstname);
		form_data.append('lastname',lastname);

		let fetch_res = await fetch("/api/customers", {method: "POST", body: form_data});
		let json_res = await fetch_res.json();
		console.log(json_res);
		return json_res;
}

export async function register_payment(course_style, capacity, offering, first_meeting) {
		let form_data = new FormData();
		form_data.append('meeting',first_meeting);
		form_data.append('course_style',course_style);
		form_data.append('capacity',capacity);
		form_data.append('offering',offering);

		let fetch_res = await fetch("/api/payments", {method: "POST", body: form_data});
		let json_res = await fetch_res.json();
		console.log(json_res);
		return json_res;
}

export async function register_subscription(slot, course_style, capacity, offering, first_meeting) {
		let form_data = new FormData();
		form_data.append('meeting',first_meeting);
		form_data.append('slot',slot);
		form_data.append('course_style',course_style);
		form_data.append('capacity',capacity);
		form_data.append('offering',offering);

		let fetch_res = await fetch("/api/subscriptions", {method: "POST", body: form_data});
		let json_res = await fetch_res.json();
		return json_res;
}

export function Fake({width = 5, ...props}) {
	let chars = [];

	for(let i = 0; i<width; i++) {
		chars.push("O");
	}

	return (
		<div className="fake">
			{chars.join()}
		</div>
	)
}

export function Verification({email, close}) {
	let [tokenDetails, setTokenDetails] = useState(null);
	let [error, setError] = useState(null);
	let [code, setCode] = useState("");

	let login = async () => {
		setError(null);
		try {
			let validationresp = await fetch(`/api/verification?code_id=${tokenDetails.code_id}&code=${code}`);
			let validationdata = await validationresp.json();
			if(validationdata.error) {
				throw validationdata;
			}
			console.log("logged in with", validationdata.data);
			close()
		} catch(e) {
			console.log("got error", e);
			if(e.error?.type) {
				console.log(e.error.type);
				setError(e.error.type);
			} else {
				setError("Cannot contact sever");
			}
		}
	}

	let send_text = async (email) => {
		console.log("sending text");
		setError(null);

		let form_data = new FormData();
		form_data.append("email", email);
		try {
			let validationresp = await fetch("/api/verification",{body: form_data, method: "POST"});
			let validationdata = await validationresp.json();
			if(validationdata.error) {
				throw validationdata;
			}
			setTokenDetails(validationdata.data);
		} catch(e) {
			console.log("got error", e);
			if(e.error?.type) {
				console.log(e.error.type);
				setError(e.error.type);
			} else {
				setError("FAIL");
			}
		}
	}

	useEffect(() => {
		send_text(email)
	}, [email])

	if(tokenDetails) {
		return (<Modal title="We texted you a login code" buttons={{secondaries:[{text:"Close", onClick:close}], primary:{onClick:login, text:"Login"}}}>
			We automatically sent you a login code to your phone number ending in <b>{tokenDetails.last_four_phone}</b>, since you already have an account with us.<br/><br/>
			<div className="payflow__inputgroup">
				<h3 className="payflow__inputgroup__title">Your 7-digit code</h3>
				<TextField placeholder="8289407" autoComplete="family-name" value={code} onChange={setCode}/>
			</div>
			{error && (({})[error] || error)}
			</Modal>
		)
	} else {
		return (<Modal title={error ? ({"TooSoon":"Please log-in to continue"})[error] || error : "Texting you a login code..."} buttons={{secondaries:[], primary:{text:"Close", onClick: close}}}>
			{!error && "Please wait"} {error && ({"TooSoon":"We couldn't text you a verification code since we just sent you one, so you'll have to log-in via email and retry."})[error] || error}
			</Modal>
		)
	}
}
