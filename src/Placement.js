import {ArrowForward, FastForward, Group, Payments, School, SupportAgent, Verified, VerifiedUser} from '@mui/icons-material'
import './Placement.scss'
import {Section, SellCard} from './Home.jsx'
import {Button, get_duration_info} from './Components'
import {Assurance} from './PaymentFlow'
import {useEffect, useState} from 'react'
import {DateTime} from 'luxon'
import {Link} from 'react-router-dom'

function Header({...props}) {
	return (<div className="sell_header__container">
		<div className="home_section sell_header">
			<div className="sell_header__logo">
				<Link style={{color:"white"}} to="/"><i>pass<span className="green">Math</span></i></Link>
			</div>
			<div className="sell_header__billboard">
				<div className="sell_header__billboard__title">
					Math Placement Test Prep
				</div>
				<div className="sell_header__billboard__number">
					55 <ArrowForward className="fixicon" /> 75
				</div>
				<div className="sell_header__billboard__subtext">
					Improve by 20 points or your money back*
				</div>
			</div>
			*subject to terms
		</div>
	</div>)
}
function HeavyDay({day}) {
		return(<SellCard title={`Day ${day}`}> 
				<ul>
					<li><b>10am:</b> <br/>Mini-lecture</li>
					<li><b>10:30am:</b> <br/>Small groups</li>
					<li><b>12pm:</b> <br/>Lunch (provided) and debrief</li>
					<li><b>12:30pm:</b> <br/>Practice and one-on-one meetings</li>
					<li><b>2pm</b><br/>Exit quiz</li>
				</ul>
			</SellCard>)

}

function LightDay({day}) {
			
			return (<SellCard title={`Day ${day}`}> <ul>
					<li><b>10am:</b> <ul><li>Exit quiz review, corrections, and retakes</li></ul></li>
					<li><b>11am:</b> <ul><li>ALEKS modules study groups w/ tutors</li><li>One-on-one meetings</li></ul></li>
					<li><b>12pm:</b> <br/>One-on-one meetings</li>
				</ul>
			</SellCard>)
}

function Timer({date,...props}) {
	let [time, setTime] = useState({
		days:0,
		hours:0,
		minutes:0,
		seconds:0,
	})

	useEffect(() => {
		let timer = setInterval(()=>{
			let diff = date.diffNow(["days", "hours", "minutes", "seconds"]);
			setTime({
				days: diff.days,
				hours: diff.hours,
				minutes: diff.minutes,
				seconds: Math.floor(diff.seconds)
			})
		},[100])
		return timer;
	},[date]);

	return (<span className={`pressure_cooker ${time.days < 2 ? "pressure_cooker--urgent": ""} ${time.days < 0 ? "pressure_cooker--now": ""}`}>
		{time.days.toString().padStart(2,'0')}d:{time.hours.toString().padStart(2,'0')}h:{time.minutes.toString().padStart(2,'0')}m:{time.seconds.toString().padStart(2,'0')}s
	</span>)
}

export function Placement({props}) {
	let discount_end = DateTime.fromObject({year:2023, month:12, day:14});
	let discount_over = discount_end.diffNow("seconds").seconds < 1

	return (<div className="home_section_container">
		<Header/>
		<Section title="Our Program">
			<SellCard title="Improve or your money back" icon={<Verified/>} >
				<p>We are preapred to meet your goals. To help you <a href="https://science.gmu.edu/academics/departments-units/mathematical-sciences/mathematical-sciences-testing-center#scores-needed-for-courses-as-of-oct-26-2022" rel="noreferrer" target="_blank">place into the next highest class</a>, we guarantee a 20 point improvement if your score was below 55 points, and a 10 point improvement otherwise. </p>
			</SellCard>
			<SellCard title="Proven Tutors" icon={<VerifiedUser/>} >
				<p>passMath has over 2 years of experience succesfully helping students at the brink of failure succeed in their classes. We are prepared to give you the coaching and practice you need to succeed</p>
			</SellCard>
			<SellCard title="In-Person Meetings" icon={<Group/>} >
				<p>Our bootcamp will be conducted primarily in-person to give students the focus and environemnt necessary to learn fast. Many students find online learning more difficult than in-person coaching</p>
			</SellCard>
		</Section>
		<Section title="There's a lot to gain">
			<SellCard title="Graduate sooner" icon={<School/>} >
				<p>Knocking out Math requirements earlier can give you the flexibility to start your job sooner, experiment with other courses, and save you thousands in tuition.</p>
			</SellCard>
			<SellCard title="Save tuition dollars" icon={<Payments/>} >
				<p>Lower-level coures sometimes only count as elective credit, leaving you with more Math courses to take. Students that pass the exam don't have to take these courses and save that much in tuition.</p>
			</SellCard>
			<SellCard title="Start major-specific classes" icon={<FastForward/>} >
				<p>Many major-specific courses at GMU are "locked" behind Math pre-requisites, especially in engineering disciplines. By placing into a higher Math course, you may be able to take these classes sooner.</p>
			</SellCard>
		</Section>
		<Section title="7 days of quality instruction">
			<HeavyDay day={1}/>
			<LightDay day={2}/>
			<HeavyDay day={3}/>
			<LightDay day={4}/>
			<HeavyDay day={5}/>
			<SellCard title="Day 6"> Async day/day-off to complete ALEKS modules and practice at home. One-on-One tutoring for students who need it</SellCard>
			<SellCard title="Day 7: Graduation"> 
				<ul>
					<li><b>10AM:</b> Review game</li>
					<li><b>11:15AM:</b> Exit Quiz Awards</li>
					<li><b>11:30AM:</b> Prizes & sendoff</li>
				</ul>
			</SellCard>
		</Section>
		<Section title="Book a spot" singular>
				<div className="pay_table__container">
					<div>
						{!discount_over && <div className="pay_table__pressure">
							Discount ends in <Timer date={discount_end} />
						</div>}
						{discount_over && <div className="pay_table__pressure">
							10 seats left
						</div>}
						<table className="pay_table">
							<tbody>
								<tr><td className="pay_table__number">$600</td><td>Enrollment Fee</td></tr>
								{!discount_over && <tr><td className="pay_table__number">-$150</td><td>Early-bird discount<br/></td></tr>}
								<tr><td><hr/></td></tr>
								<tr><td className="pay_table__number">{discount_over ? "$600":"$450"}</td><td>Total</td></tr>
							</tbody>
						</table>
					</div>
					<div className="pay_table__action">
						<div className="payflow__assurances">
							<Assurance icon="check">
								{/*TODO: terms for bootcamp*/}
									Improve or money back, subject to <a href="/terms">terms</a>
							</Assurance>
							<Assurance icon="lock">
									Your payment is secured by Stripe and SSL
							</Assurance>
							<Assurance icon="undo">
									Cancel in the next week with a 10% penalty
							</Assurance>
						</div>

						<div className="support"><SupportAgent /> Support: (571) 572-9406 (Call/Text)</div>
						<a href="https://buy.stripe.com/7sI4km2sV9yse7C006"><Button>Book your spot</Button></a>
					</div>
				</div>
		</Section>
	</div>)
}
