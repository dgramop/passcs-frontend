import ReservationForm from './ReservationForm';
import './Home.scss'
import './index.scss'
import {Button, Modal} from "./Components";
import shakir from "./Shakir.jpg";
import React, {useState, useRef, useEffect, createRef}  from "react";

/**
 * Makes a paper like card on the screen
 * @param {String} props.icon the google icon, as text
 * @param {String} props.title Card heading
 * @param {ReactChildren} props.children Body
 * @param {Boolean} props.dark If this card is dark themed
 */
function Testimonial(props) {
		return (
				<section className="card card--testimonial">
						<div className="card__icon__container"><img alt={props.title+"'s profile (head etc.)"} src={props.photo} /></div>
						<div className="card__title__block"><h2 className="card__title">{props.title}</h2><div className="card__tagline">passCS Customer</div></div>
						<div></div>
						<div className="card__body">{props.children}</div>
				</section>
		);
}

/**
 * Makes a paper like card on the screen
 * @param {String} props.icon the google icon, as text
 * @param {String} props.title Card heading
 * @param {ReactChildren} props.children Body
 * @param {Boolean} props.dark If this card is dark themed
 */
function Card(props) {
		return (
				<section className={"card "+(props.dark ? "card--dark" : "")}>
						<div className="card__icon__container"><span className="material-icons">{props.icon}</span></div>
						<h2 className="card__title">{props.title}</h2>
						<div></div>
						<div className="card__body">{props.children}</div>
				</section>
		);
}

async function sendLoginLink(email) {
		try {
				let r = await fetch("/login?user_type=customer&email="+email,{method: "POST"});
				r = await r.json()
				if(r.error) throw r.error
				return r;
		} catch(e) {
				if(!e.type) throw new Error({type: "Cannot contact server"})
				else throw e;
		}
}

export default function Home() {
		const reservationRef = useRef();
		const [showLogIn, setShowLogIn] = useState(false);
		const [email, setEmail] = useState("");
		const [waitingForLogIn, setWaitingForLogIn] = useState(false);
		const [loginError, setLoginError] = useState(null);
		const [showLoginSuccess, setShowLoginSuccess] = useState(false);

		return (<> 
				{showLogIn && <Modal title="Get a magic log-in link" icon="auto_fix_high" buttons={{primary: {text:"Send Link", onClick: async () => { setLoginError(null); setWaitingForLogIn(true); try { if((await sendLoginLink(email)).status == "success") {setShowLogIn(false); setShowLoginSuccess(true);}  } catch(e) { if(e.type) setLoginError(e.type); else console.log(e) }; setWaitingForLogIn(false); }, disabled:!(new RegExp("^[^@]+@[^@]+\.[^@]+$")).test(email) || waitingForLogIn}, secondaries: [{text:"Go Back", onClick:()=> setShowLogIn(false)}]}} close={()=>setShowLogIn(false)}>
						We’ll email you a link you can use to log-in with in with one click
						<div className="modal__text__form">
								<label htmlFor="login__email">Email Address</label><br/>
								<input id="login__email" size="10" type="email" placeholder="jdoe@gmail.com" onChange={(e) => setEmail(e.target.value)}/>
								{loginError && <div className="login__error">{loginError}</div>}
						</div>
				</Modal>}
				{showLoginSuccess && <Modal title="Check your inbox" icon="email" buttons={{primary:{text:"Close", onClick: ()=>setShowLoginSuccess(false)}}} close={()=>setShowLoginSuccess(false)}>
				</Modal>}
				<div className="home_hero__container">
						<div className="home_hero">
								<div className="home_hero__main">
										<div className="home_hero__logo">
												<span className="pass">pass</span>
												<span className="cs">CS</span>
										</div>
										<div className="home_hero__tagline">
												pass class, guarenteed*
										</div>
										<div className="home_hero__buttontray">
												<Button onClick={() => {reservationRef.current.scrollIntoView()}} extraClasses="home_hero__primary_button">View Options</Button>
												<Button extraClasses="home_hero__secondary_button" onClick={()=>setShowLogIn(true)}>Login</Button>
										</div>
								</div>
								<div className="home_hero__distraction">
										<ReportCard />
								</div>
						</div>
				</div>
				<div className="container cards">
						<Card title="Matches your learning style" icon="face">
								Our tutors take the time to understand your learning style, and adapt your sessions to meet your needs. When it comes to learning, there is no “one size fits all” approach. For extra focus, select our “one-on-one” option
						</Card>
						<Card title="Builds understanding" icon="psychology">
								You won't get confused. Explanations in clear english that tell you everything you need to know. Choose between in-person and online to fit your needs.
						</Card>
						<Card title="Pass or your money back" icon="check">
								Get that extra piece of mind. If you don’t pass after taking at least 12 hours of one-on-one passCS Tutoring, we’ll refund the money you paid us. <a href="/terms">See additional terms</a>
						</Card>
						<Testimonial photo={shakir} title="Shakir" tagline="passCS Customer">
								“passCS helped me understand core programming, actually it is better than two hours lecture in class. Thanks passCS”.
						</Testimonial>
						<ReservationForm ref={reservationRef} scrollFn={()=>reservationRef.current.scrollIntoView(true)}/>
				</div>
		</>)
}

function ClassGrade(props) {
		return (<div className="home_hero__distraction__reportcard__graderow">
				<div className="home_hero__distraction__reportcard__graderow__class">{props.course}</div>
				<div className="home_hero__distraction__reportcard__graderow__grade">{props.grade}</div>
				</div>)
}

function ReportCard() {
		return (<div className="home_hero__distraction__reportcard">
						<div className="home_hero__distraction__reportcard__title"> transcript </div>
						<ClassGrade course="CS112" grade="A+" />
						<ClassGrade course="CS262" grade="A" />
						<ClassGrade course="CS310" grade="A+" />
						<ClassGrade course="MATH113" grade="A-" />
						<ClassGrade course="MATH213" grade="A" />
						<ClassGrade course="CS112" grade="A+" />
				</div>
		)
}
