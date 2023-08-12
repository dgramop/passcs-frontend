import {useEffect, useState} from "react";
import {useOutletContext} from "react-router";
import ReactSelect from "react-select";
import {Button, get_duration_info} from "./Components";
import {DateTime, Duration} from "luxon";

/**
 * Represents a grade category (line item in grading criteria in syllabus)
 * @param {weight} Integer 0>x>=100 representing the weightage of the particular category
 * @param {name} Grade category name (e.g. "homework")
 * @param {earned} Percent of this category the student has earned (for eaxmple, 50% if the average homework grade is 50% and this category is homeworks)
 */
function SummaryCategory({name, weight, earned, ...props}) {
	return (
		<div className="grades__summary__category"> 
			<div className="grades__summary__category__header">
				{/*contains name and weight */}
				{name} (worth {weight}%)
			</div>
			<div className="grades__summary__category__earned">
				{earned}%
			</div>
			<div className="grades__summary__category__action">
				Show only {name} grades
				{/*TODO: filters grades by this category */}
			</div>
		</div>
	)
}

function GradeSummary({...props}) {
	return (
		<section className="grades__summary">
			<div className="grades__summary__overall">
				98<small className="grades__summary__overall__icon">%</small>
			</div>
			<div className="grades__summary__categories">
				<SummaryCategory name="Homework" earned={20} weight={35} />
				<SummaryCategory name="Homework" earned={20} weight={35} />
				<SummaryCategory name="Homework" earned={20} weight={35} />
				<SummaryCategory name="Quizzes" earned={50} weight={35} />
				<SummaryCategory name="Quizzes" earned={50} weight={35} />
			</div>
			<div className="grades__summary__actions">
				<Button>Syllabus</Button>
				<Button secondary>Edit grading criteria</Button>
			</div>
		</section>
	)
}

function NewGradeForm({...props}) {
	//TODO: handle cases where it's a percent/all assignments are equally weighted (can do this in category)
	return (
		<section className="grades__newgrade">
			<div className="grades__newgrade__inputs">
				<div className="grades__newgrade__inputgroup">
					<label className="grades__newgrade__label" for="assn-name">Assignment Name</label>
					<input id="assn-name" placeholder="Homework #2" type="text"/>
				</div>
				
				<div className="grades__newgrade__inputgroup">
					<label className="grades__newgrade__label" for="points-earned">Points Earned</label>
					<input id="points-earned" type="text"/>
				</div>

				<div className="grades__newgrade__inputgroup">
					<label className="grades__newgrade__label" for="points-total">Points Total</label>
					<input id="points-total" type="text"/>
				</div>

				<div className="grades__newgrade__inputgroup">
					<label className="grades__newgrade__label" for="points-total">Category</label>
					<ReactSelect />
				</div>
			</div>

			<Button thin>Add to Gradebook</Button>
		</section>
	)
}

function Grade({name, category, score, points_earned, points_total, due_date, entered_date, ...props}) {
	let [friendlyDueDate, setFriendlyDueDate] = useState("forver");
	let [friendlyEnteredDate, setFriendlyEnteredDate] = useState("forever");

	useEffect(() => {
		setFriendlyDueDate(get_duration_info(new Date(due_date*1000)))
		setFriendlyEnteredDate(get_duration_info(new Date(entered_date*1000)))

		let timeUpdator = setInterval(() => {
			setFriendlyDueDate(get_duration_info(new Date(due_date*1000)))
			setFriendlyEnteredDate(get_duration_info(new Date(entered_date*1000)))
		}, 1000);
		
		return () => {
			clearInterval(timeUpdator);
		}

	},[due_date, entered_date])

	return (
		<div className="grades__grade">
			<div className="grades__grade__header">
				<span className="grades__grade__header__name">{name}</span> - {category}
			</div>
			<div className="grades__grade__grade">
				{score}% {points_earned && points_total && <span className="grades__grade__performance__detail">({points_earned}/{points_total})</span>}
			</div>
			<div className="grades__grade__dates">
				Due {friendlyDueDate} ago. <br/>Entered {friendlyEnteredDate} ago.
			</div>
		</div>
	);
}

function Grades({...props}) {
	return (
		<section className="grades__grades">
			<Grade name="Homework #1" category="Homeworks" score={100} due_date={0} entered_date={Date.now()/1000}/>
		</section>
	);
}

export default function GradeBook({...props}) {
	const [page, setPage] = useOutletContext();
	const [categories, setCategories] = useState(null);

	useEffect(() => {
		setPage("grades");
	}, [setPage])

	return (<>
		<h2 className="dash__content__title">
			CS112 Gradebook
		</h2>
		<GradeSummary />
		<h2>Add Grade</h2>
		<NewGradeForm />
		<h2>Recent Grades</h2>
		<Grades />
		</>
	)
}
