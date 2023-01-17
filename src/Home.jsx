import './Home.scss'
import './index.scss'
import {Button, Modal, get_token, LoginModal} from "./Components";
import shakir from "./Shakir.jpg";
import PaymentFlow from "./PaymentFlow.jsx";
import React, {useState, useRef, useEffect, createRef}  from "react";
import {Link, useNavigate} from "react-router-dom";
import {Check, Phone, Support, SupportAgent, Verified} from '@mui/icons-material';


function Hero({...props}) {
	const [loginModal, setLoginModal] = useState(false)
	const [userType, setUserType] = useState(null)

	useEffect(() => {
		get_token().then((token) => {
			setUserType(token.user_type)
		})
	}, [])

	const navigate = useNavigate()

	return (
		<div className="hero">
			{loginModal && <div style={{color: "black"}}><LoginModal close={() => setLoginModal(false)}/></div>}
			<div className="hero__heading__container">
				<div className="hero__heading">
					<h1 className="hero__heading__title">pass<span className="green">CS</span></h1>
					{userType == null && <Button onClick={()=>{setLoginModal(true)}} green>Login</Button>}
					{userType === "tutor" && <Button onClick={()=> {navigate("/tutors/myself/dashboard")}} green>Tutor Dashboard</Button>}
					{userType === "customer" && <Button onClick={()=> {navigate("/student/dashboard")}} green>Your Classes</Button>}
				</div>
			</div>
			<section className="hero__content">
				<section className="hero__content__quote">
					<h2 className="hero__content__quote__title">
						Tutoring that <span className="green"><i>works.</i></span>
					</h2>
					<div className="hero__content__quote__text">
						“passCS helped me understand core programming, actually it is better than two hours lecture in class. Thanks passCS”
						<div className="hero__content__quote__credit">
							<img className="hero__content__quote__credit__image" src={shakir} alt="Headshot of Shakir, the student who took the testimonial" />
							<div className="hero__content__quote__credit__details">
								<div className="hero__content__quote__credit__details__name">
									Shakir
								</div>
								<div className="hero__content__quote__credit__details__desc">
									GMU Student
								</div>
							</div>
						</div>
					</div>
				</section>
				<div className="hero__payflow_container">
					<PaymentFlow className="hero__payflow"/>
					<div className="hero__payflow__support"><SupportAgent /> Support: 571-524-3033 (Call/Text)</div>
				</div>
			</section>
		</div>
	)
}

function TutorCard({tutor, ...props}) {
	return (
		<div className="minicard tutorcard">
			<div className="tutorcard__header">
				<img className="tutorcard__header__image" src={"/"+tutor.id+".jpg"} alt={tutor.name}/>
				<div className="tutorcard__header__details">
					<div className="tutorcard__header__details__name">
						{tutor.name.split(" ")[0]}
					</div>
					<div className="tutorcard__header__details__position">
						passCS Tutor
					</div>
				</div>
			</div>
			<div className="tutorcard__body">
				{tutor.background}
			</div>
		</div>
	)
}

function QuoteCard({children, name, position, ...props}) {
	return (
		<div className="minicard quotecard">
			<div className="quotecard__body">
				“{children}”
			</div>
			<div className="quotecard__details">
				<span className="quotecard__details__name">{name}</span>
				<span className="quotecard__details__position">{position}</span>
			</div>
		</div>
	)
}

export default function Home({...props}) {
	const [tutors, setTutors] = useState(null)

	useEffect(() => {
		let load_tutors = async () => {
			let tutorsresp = await fetch("/api/tutors");
			let tutorsdata = await tutorsresp.json();

			setTutors(tutorsdata.data)
		}

		load_tutors()
	}, [])

	return (
		<>
			<Hero />
			<div className="home_section_container">
				
				<section className="home_section">
					<h2 className="home_section__title">Tutoring that <i>works</i></h2>
					<div className="home_section__cards">
						<QuoteCard name="D.N." position="CS310 Student">
							My fundamentals were strengthened and I was able to use my stronger fundamentals to build my skills.
						</QuoteCard>
						<QuoteCard name="S.A." position="CS262 Student">
							I spent all weekend trying to learn recursion from YouTube videos. You took just one hour!
						</QuoteCard>
						<QuoteCard name="A.M." position="CS112 Student">
							I had recently used the PassCS service myself and it was a great experience
						</QuoteCard>
					</div>
				</section>
				
				<section className="home_section">
					<h2 className="home_section__title">Pass or your money back</h2>
					<div className="home_section__card home_card">
						<div className="home_card__header">
							<div className="home_card__header__icon_container">
								<Verified className="home_card__header__icon" />
							</div>
							<div className="home_card__header__title">
								The passCS Guarantee
							</div>
						</div>
						<div className="home_card__body">
							<p>Get that extra peace of mind. If you don’t pass after taking at least 12 hours of one-on-one passCS Tutoring, we’ll refund the money you paid us. <Link to="/terms">See additional terms</Link></p>
							<p>We hire the best tutors available - people that can relate to both our students and to the topic they’re tutoring. It shows: we had zero claims last semester (for approx. 30 students).</p>
						</div>
					</div>
				</section>
				<section className="home_section">
					<h2 className="home_section__title">Who we are</h2>
					<div className="home_section__cards">
						{tutors && tutors.map((tutor) => (<TutorCard tutor={tutor}/>)) }
					</div>
				</section>
				<section className="home_section home_section--payflow">
					<h2 className="home_section__title">Book your tutor</h2>
					<div className="home_section__card ">
						<PaymentFlow autoscroll className="hero__payflow hero__payflow--nohero"/>
					</div>
				</section>

				</div>
		</>
	)
}
