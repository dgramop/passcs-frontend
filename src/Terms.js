import {Link} from "react-router-dom";
import "./Terms.scss";

export default function Terms(props) {
	return (<>
		<div className="container">
			<Link to="/">Back to Home</Link>
			<section>
				<h2> The passCS Guarantee </h2>
				<p>
					In order for a student (herein "You") to qualify for the passCS Guarentee, the following must be true
					<ul>
						<li>You have never failed a course with passCS previously, and</li>
						<li>You failed the class (F or D final grade), and</li>
						<li>You completed the course (withdrawals, incomplete do not count), and</li>
						<li>You did not have receive a grade high enough to allow the course to fill any of your degree requirements, and</li>
						<li>You notify your tutor of all upcoming major assesments, assignments, exams at least 2 class sessions before they are due/occur (or immediately during your first session you have not already had 2 sessions yet), and</li>
						<li>You attended during the same semester you were enrolled, at least 12 classes of one-on-one tutoring in the class you failed for a minimum of 12 hours of total one-on-one passCS instruction for the class you failed. For passCS Guarantee computations only, one hour of one-on-two instruction shall be equivalent to 40 minutes of one-on-one instruction, and</li>
						<li>You made a concerted effort to pass, </li>
						<li>You made no effort to fail</li>
						<li>You didn’t violate your university’s honor code or receive any sanction (including but not limited to course failure) for cheating (includes “plea deals” with professors that don’t receive an official honor council hearing), and</li>
						<li>You attended all your exams and submit all assignments, for example, you may not avail of this guarantee if you overslept your final and failed</li>
						<li>At the time you contract our services, your grades must be high enough that a reasonable increase in performance would be sufficient to pass the class</li>
						<li>You must be currently enrolled in the class</li>
					</ul>

					If you fail, you must provide evidence of your course failure, itemized individual assignment grades, test scores, and feedback from your professor, and evidence that you qualify for the passCS Guarantee in writing to dhruv@passcs.io within 7 days of grades being posted, or two weeks following the end of finals, whichever comes first.<br/><br/>

					<b>Parameters</b>
					<ul>
						<li>You will not be refunded for no-show meetings or skipped meetings</li>
						<li>You will not be refunded for meetings that occurred before or after the semester you were enrolled in the class at your university</li>
						<li>You will not be refunded more than what you paid passCS Inc. that semester, for the specific class you failed</li>
						<li>You will not be refunded tuition you paid to your university or college</li>
						<li>You agree not to hold passCS liable for any damages caused by failing or otherwise not passing a class</li>
					</ul>

					Other than the limited warranty laid out above, our services are provided AS-IS, without warranties or guarentees, implied or otherwise expressed.<br/><br/>
					Additionally, passCS reserves the right to refuse service, at any time, for any reason (or no reason at all). 
				</p>
			</section>

			<section>
				<h2> Cancellation Policy </h2>
				<p>
					You must arrive on time for your meeting. If you arrive late, no time extension will be provided. If you arrive more than 15 minutes late, your meeting will be considered a no-show and will be canceled (you will still incur full liability)<br/><br/>

					As a courtesy, you may receive a 50% refund of the meeting no-showed, for your first two no-shows each semester. To claim this courtesy, you must email dhruv@passcs.io within 7 days of your first no-show.<br/><br/>

					As an additional courtesy, you may receive a full refund for the first meeting that you cancel fewer than 25 hours in advance, so long as you notify your tutor at least 2 hours in advance of the meeting. To claim this courtesy, you must email dhruv@passcs.io within 7 days.<br/><br/>

					The no-show and full-refund courtesies may automatically be applied, without your request; they will decrement the number of courtesies you have left. <br/><br/>
					If you paid as part of a bulk purchase, instead of recieving a refund you will recieve credit towards your account for one meeting.
				</p>
			</section>

			<section>
				<h2> Subscription Agreement </h2>
				<p>
					If you sign up for a weekly or recurring time slot, you authorize passCS to charge your card through our payment processor, Stripe, to pay for all meetings you attend with our tutors, including meetings not scheduled through our system. The rates provided during checkout assume 1 hour of instruction per week. If you meet more than this, additional meetings may be added to what you already pay
				</p>
			</section>
			<small> Last Updated Oct 15, 2022. Add clause that requires you notify your tutor well in advance of an upcoming assingment or exam</small><br/>
			<small> September 22, 2022. Only allow refund of classes that were taken within the same semester</small><br/>
			<small> March 31, 2022: Removed the midterm/semester midpoint requirement </small>
		</div><br/>
	</>)
}
