import {useEffect, useState} from "react";
import {useOutletContext} from "react-router";
import ReactSelect from "react-select";
import {Button, get_duration_info} from "./Components";
import {DateTime, Duration} from "luxon";
import {Add, Delete} from "@mui/icons-material";

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
			{/*<div className="grades__summary__category__action">
				Show only {name} grades
				TODO: filters grades by this category 
			</div>*/}
		</div>
	)
}

function GradeSummary({...props}) {
	return (
		<div className="grades__summary">
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
				<Button secondary>Gradebook Settings</Button> {/* waive passCS guarantee, turn notification on/off, upload new syllabus, change grade criteria*/}
			</div>
		</div>
	)
}

function NewGradeForm({...props}) {
	//TODO: handle cases where it's a percent/all assignments are equally weighted (can do this in category)
	return (
		<div className="grades__newgrade">
			<div className="generic_form__inputs">
				<div className="generic_form__inputgroup">
					<label className="generic_form__label" for="assn-name">Assignment Name</label>
					<input id="assn-name" placeholder="Homework #2" type="text"/>
				</div>
				
				<div className="generic_form__inputgroup">
					<label className="generic_form__label" for="points-earned">Points Earned</label>
					<input id="points-earned" placeholder="9" type="number" />
				</div>

				<div className="generic_form__inputgroup">
					<label className="generic_form__label" for="points-total">Points Total</label>
					<input id="points-total" placeholder="10" type="number" />
				</div>

				<div className="generic_form__inputgroup">
					<label className="generic_form__label" for="due-date">Due Date</label>
					<input id="due-date" type="date"/>
				</div>


				<div className="generic_form__inputgroup">
					<label className="generic_form__label" for="points-total">Category</label>
					<ReactSelect />
				</div>
			</div>

			<Button thin>Add to Gradebook</Button>
		</div>
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
		<div className="grades__grades">
			<Grade name="Homework #1" category="Homeworks" score={100} due_date={0} entered_date={Date.now()/1000}/>
		</div>
	);
}

/**
 * Element the user sees that represents a category in the setup dialog
 * name - The name of the category
 * weight - How much the grade category is worth
 * drops - How many of the lowest assignments are dropped
 */
function CategorySetupCategory({name, weight, drops, deleteCategory, ...props}) {
	return (<>
		<div className="grades__setup__form__category">
			<div className="grades__setup__form__category__name">
				{name}
			</div>
			<div className="grades__setup__form__category__percent">
				<span>worth <b>{weight}%</b></span>
			</div>
			<div className="grades__setup__form__category__drops">
				{drops} lowest scores dropped 
			</div>
			<div className="grades__setup__form__category__buttoncontainer">
				<button onClick={deleteCategory} className="iconbutton">
					<Delete />
				</button>
			</div>
		</div>
		</>);
}

/**
 * Component that lets a user populate a homework category to be staged into the form
 */
function CategorySetupNewCategoryForm({addCategory, ...props}) {
	const [name, setName] = useState("");
	const [weightage, setWeightage] = useState(null);
	const [drops, setDrops] = useState(0);
	const [error, setError] = useState(null);

	let submit = () => {
		let parsed_weightage = parseInt(weightage);
		setError(null)
		if(name == null || name.length===0) {
			setError("The category must have a name");
			return;
		}

		if(isNaN(weightage) || parsed_weightage < 0 || parsed_weightage > 100) {
			setError("The grade category's weightage must be between 0 and 100");
			return;
		}

		if(isNaN(drops) || drops < 0) {
			setError("You must have a non-negative number of dropped assignments. If your syllabus does not \"drop\" any lowest grades, enter 0");
			return;
		}

		addCategory(name, weightage, drops);
		setName("");
		setWeightage("");
		setDrops(0);
	}

	return (<>
			<div className="grades__setup__form__newcategory">
				<form onSubmit={(e) => {e.preventDefault(); submit()}} className="generic_form__inputs">
					<div className="generic_form__inputgroup">
						<label className="generic_form__label" for="category-name">Grade Category</label>
						<input value={name} onChange={(e) => setName(e.target.value)} id="category-name" placeholder="Midterm" type="text"/>
					</div>
					
					<div className="generic_form__inputgroup">
						<label className="generic_form__label" for="weightage">Weight</label>
						<div><input value={weightage} onChange={(e) => setWeightage(e.target.value)} className="generic_form__input--short" id="weightage" placeholder="25" type="number" /> <div className="grades__setup__form__newcategory__icon">%</div></div>
					</div>

					<div className="generic_form__inputgroup">
						<label className="generic_form__label" for="drops">Dropped Assignments</label>
						<input id="drops" value={drops} onChange={(e) => setDrops(e.target.value)} className="generic_form__input--short" type="number" placeholder="0"/>
					</div>
					<button type="submit" className="grades__setup__form__newcategory__submit--iconbutton iconbutton iconbutton--primary"><Add /></button>
					<Button extraClasses="grades__setup__form__newcategory__submit--button">Add Category</Button>
			</form>
				{error && 
				<>
					<br/>
					<div className="genericError">
						{error}
					</div>
				</>
				}
		</div>
		</>)
}

/**
 * Customer (or tutor in first session) sets up a gradebook (and its grade categories) using the syllabus
 */
export function CategorySetupView({...props}) {
	const [categories, setCategories] = useState([]);
	const [error, setError] = useState("Internal Server Error")

	let removeCategory = (remove_idx) => {
		setCategories(categories.filter((category, idx) => idx!==remove_idx));
	}

	return (<>
		<section>

			<h2 className="dash__content__title">
				Setup your gradebook
			</h2>
			<div className="grades__setup">
				<h3 className="grades__setup__title">Grading Criteria for CS112</h3>
				<p className="grades__setup__tagline">Enter the grade categories as they appear on your CS112 syllabus</p>
				<p className="grades__setup__hesitation">This form is designed to take fewer than 10 minutes of your time</p>
				<div className="grades__setup__form">
					<CategorySetupNewCategoryForm addCategory={(name, weight,drops) => setCategories([...categories, {name, weight, drops}])} />
					{categories.length === 0 && <div className="grades__setup__form__category grades__setup__form__category--empty">
						Use the form above to input the grading criteria from your syllabus
					</div>}
					{categories.length !== 0 && categories.map((category, idx) => <CategorySetupCategory name={category.name} weight={category.weight} drops={category.drops} deleteCategory={() => removeCategory(idx)}/>)}

				</div>
				<div className="grades__setup__footer">
					<div className="grades__setup__footer__error genericError">{error}</div>

					<Button secondary className="">Done</Button>
				</div>
			</div>

		</section>

		<section>
			<h2 className="grades__sectionheader">About the Gradebook</h2>
			<p>
				{/*
					Discuss the gradebook FAQs here 
					Helps you calculate your grade, since some professors don't have blackboard setup that way.
					Helps communicate progress in class to the tutor, and helps the tutor be more prepared to teach you the things you struggle with most in class
					Meant to improve your likelyhood of passing classes
					Define "dropped" assignment: if you don't know what it is put in zero

					About opting-out of the gradebook, and how they can opt out later too (though they cannot opt back in)
				*/}
			</p>
		</section>

		</>
	)
}

export function GradebookMainView({...props}) {
	const [categories, setCategories] = useState(null);

	return (<>
		<section>
			<h2 className="dash__content__title">
				CS112 Gradebook
			</h2>
			<GradeSummary />
		</section>
		<section>
			<h2 className="grades__sectionheader">Add Grade</h2>
			<NewGradeForm />
		</section>
		<section>
			<h2 className="grades__sectionheader">Recent Grades</h2>
			<Grades />
		</section>
		</>
	)
}

export default function Gradebook({...props}) {
	const [page, setPage] = useOutletContext();
	useEffect(() => {
		setPage("grades");
	}, [setPage])

	return (<CategorySetupView />
	)
}
