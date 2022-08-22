import ReservationForm from './ReservationForm';
import './Home.scss'
import './index.scss'
import {Button, Modal, get_token, LoginModal} from "./Components";
import shakir from "./Shakir.jpg";
import PaymentFlow from "./PaymentFlow.jsx";
import React, {useState, useRef, useEffect, createRef}  from "react";
import {Link} from "react-router-dom";


function Hero({...props}) {
	return (
		<div className="hero">
			<div className="hero__heading__container">
				<div className="hero__heading">
					<h1 className="hero__heading__title">pass<span className="green">CS</span></h1>
					<Button green>Login</Button>
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
				</div>
			</section>
		</div>
	)
}

function TutorCard({tutor, ...props}) {
	return (
		<div className="home_card">
		</div>
	)
}

export default function Home({...props}) {
	return (
		<>
			<Hero />
			<section className="home_section">
				<h2 className="home_section__title">Who we are</h2>
				<div className="home_section__cards">
					<TutorCard />
					<TutorCard />
					<TutorCard />
					<TutorCard />
				</div>
			</section>
			<section className="home_section">
				<h2 className="home_section__title">Pass or your money back</h2>
				<div className="home_section__card home_card">
					<div className="home_card__header">
						<div className="home_card__header__icon_container">

						</div>
					</div>
				</div>
			</section>
		</>
	)
}
