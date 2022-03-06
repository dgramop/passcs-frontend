import {useState} from "react"
import {Link} from "react-router-dom"

async function sendLoginLink(email) {
		try {
				let r;
				if(email.indexOf("@passcs.io") !== -1)
				{
					// a bit of a hack, but easy to fix
					r = await fetch("/api/login?user_type=tutor&email="+email,{method: "POST"});
				} else {
					r = await fetch("/api/login?user_type=customer&email="+email,{method: "POST"});
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
		let customer_resp = await fetch("/api/customers/0");
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
 * Gives time info for the given time zone for a given slot
 */
export function timezone_time_from_slot(slot) {
	let date = new Date(slot.anchor_epoch*1000);
	
	return {start_hour: date.getHours(), weekday: (date.getDay() + 6)%7};
}

export const DAYS_OF_THE_WEEK = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
/**
 * props.extraClasses Additional classes
 * props.disabled Disabled
 * props.onClick On click function
 * props.children Button content
 */
export function Button(props) {
		return (
				<div role="button" className={"button "+(props.disabled ? "button--disabled " : "")+(props.secondary ? "button--secondary " : "")+(props.extraClasses != null ? props.extraClasses : "")} onClick={() => {
				if(!props.disabled && props.onClick) props.onClick()
				if(props.disabled && props.onDisabledClick) props.onDisabledClick()
				}}>
				{props.children}
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
								<div className="modal__buttons__secondary">{props.buttons.secondaries && props.buttons.secondaries.map((buttonProps) => (
										<Button secondary={true} {...buttonProps}>{buttonProps.text}</Button>
								))}
								</div>
								
								<Button {...props.buttons.primary} extraClasses={(props.buttons.primary.extraClasses || "") + " modal__buttons__primary"} >{props.buttons.primary.text}</Button>
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

	if(showLoginSuccess) {
		return(<Modal title="Check your inbox" icon="email" buttons={{primary:{text:"Close", onClick: ()=>{setShowLoginSuccess(false); props.close()}}}} close={()=>setShowLoginSuccess(false)}>
		</Modal>)
	} else {
			return (
			<Modal title="Get a magic log-in link" icon="auto_fix_high" buttons={{primary: {text:"Send Link", onClick: async () => { setLoginError(null); setWaitingForLogIn(true); try { if((await sendLoginLink(email)).status === "success") {setShowLoginSuccess(true);}  } catch(e) { if(e.type) setLoginError(e.type); else console.log(e) }; setWaitingForLogIn(false); }, disabled:!(new RegExp("^[^@]+@[^@]+\.[^@]+$")).test(email) || waitingForLogIn}, secondaries: [{text:"Go Back", onClick:()=> props.close()}]}} close={()=>props.close()}>
					We’ll email you a link you can use to log-in with in with one click
					<div className="modal__text__form">
							<label htmlFor="login__email">Email Address</label><br/>
							<input id="login__email" size="10" type="email" placeholder="jdoe@gmail.com" onChange={(e) => setEmail(e.target.value)}/>
							{loginError && <div className="login__error">{loginError && (({"UserNotFound": "We can't find your account"})[loginError] || loginError) }</div>}
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
