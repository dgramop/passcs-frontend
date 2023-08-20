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
function CategorySetupNewCategoryForm({addCategory, gradebook_id, ...props}) {
	const [loading, setLoading] = useState(false);
	const [name, setName] = useState("");
	const [weightage, setWeightage] = useState("");
	const [drops, setDrops] = useState(0);
	const [error, setError] = useState(null);

	let submit = async () => {
		setLoading(true);
		let parsed_weightage = parseInt(weightage);
		setError(null)
		if(name == null || name.length===0) {
			setLoading(false);
			setError("The category must have a name");
			return;
		}

		if(isNaN(weightage) || parsed_weightage < 0 || parsed_weightage > 100) {
			setLoading(false);
			setError("The grade category's weightage must be between 0 and 100");
			return;
		}

		if(isNaN(drops) || drops < 0) {
			setLoading(false);
			setError("You must have a non-negative number of dropped assignments. If your syllabus does not \"drop\" any lowest grades, enter 0");
			return;
		}

		let form_data = new FormData();
		form_data.append("weight_percent", weightage);
		form_data.append("drops", drops);
		form_data.append("name", name);

		try {
			let categoriesresp = await fetch(`/api/gradebooks/${gradebook_id}/categories`, {method:"POST", body: form_data});
			let categoriesdata = await categoriesresp.json();
			console.log(categoriesdata);
			addCategory(categoriesdata.data.category_name, categoriesdata.data.weight_percent, categoriesdata.data.drops, categoriesdata.data.id);

			setLoading(false)
			setName("");
			setWeightage("");
			setDrops(0);

		} catch(e) {
			setLoading(false);
			setError(e.type)
		}

	}

	return (<>
			<div className="grades__setup__form__newcategory">
				<form onSubmit={(e) => {e.preventDefault(); submit()}} className="generic_form__inputs">
					<div className="generic_form__inputgroup">
						<label className="generic_form__label" htmlFor="category-name">Grade Category</label>
						<input value={name} onChange={(e) => setName(e.target.value)} id="category-name" placeholder="Midterm" type="text"/>
					</div>
					
					<div className="generic_form__inputgroup">
						<label className="generic_form__label" htmlFor="weightage">Weight</label>
						<div><input value={weightage} onChange={(e) => setWeightage(e.target.value)} className="generic_form__input--short" id="weightage" placeholder="25" type="number" /> <div className="grades__setup__form__newcategory__icon">%</div></div>
					</div>

					<div className="generic_form__inputgroup">
						<label className="generic_form__label" htmlFor="drops">Dropped Assignments</label>
						<input id="drops" value={drops} onChange={(e) => setDrops(e.target.value)} className="generic_form__input--short" type="number" placeholder="0"/>
					</div>
					<button type="submit" className="grades__setup__form__newcategory__submit--iconbutton iconbutton iconbutton--primary"><Add /></button>
					<Button loading={loading} onClick={submit} extraClasses="grades__setup__form__newcategory__submit--button">Add Category</Button>
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

function has_bad_category_sum(categories) {
		const weight_sum = Object.keys(categories).reduce((sum,category_id) => {return sum + parseInt(categories[category_id].weight)}, 0)
		console.log(weight_sum);
		return weight_sum < 98 || weight_sum > 101
}

// TODO: Make this more flexible so it can be used to edit already-submitted categories. Right now, once done is hit (and data hits the server), removing a category doesn't actually do anything (remember, it only removes staged categories).
/**
 * Customer (or tutor in first session) sets up a gradebook (and its grade categories) using the syllabus
 * gradebook_id - id of the gradebook we're adding categories to
 * onComplete - function to call when category setup is complete
 */
export function CategorySetupView({gradebook_id, onComplete, categories, setCategories, ...props}) { 
	//TODO: some way to reasonably find the gradebook id if it doesn't already exist. Maybe a create-if-not-exists endpoint that returns the gradebook
	let [error, setError] = useState(null)

	let removeCategory = async (category_id) => {
		//TODO: if we let people edit categories after they've been created, we need to handle the case where a category cannot be deleted because it has attached grades
		try {
			let delcatresp = await fetch(`/api/gradebooks/${gradebook_id}/categories/${category_id}`, {method:"DELETE"});
			let delcatdata = await delcatresp.json();

			if(delcatdata.status !== "success") {
				throw delcatdata;
			}
			delete categories[delcatdata.data.id];
			setCategories({...categories});
		} catch(e) {
			setError(e.type);
			console.log(e);
		}
	}

	let submit = async () => {
		setError(null);

		// validation
		if(categories.length === 0) {
			setError("Use the form to input at least one category");
			return;
		}

		// check thta the weightage is at least 98%. We can stuff the extra 1-2% somewhere else. We only accept integer percents, and if the class has 33 + 33 + 33, there will be an extra 1%
		if(has_bad_category_sum(categories)) {
			setError("The weights of each category must add up to 100%. Are you sure you entered all the categories from your syllabus?");
			return;
		}

		onComplete();
	}

	return (<>
		<section>

			<h2 className="dash__content__title">
				Setup your gradebook
			</h2>
			<div className="grades__setup">
				<h3 className="grades__setup__title">Grading Criteria for CS112</h3>
				<p className="grades__setup__tagline">Enter the grade categories as they appear on your CS112 syllabus</p>
				<p className="grades__setup__hesitation">This activity is designed to take fewer than 10 minutes of your time</p>
				<div className="grades__setup__form">
					<CategorySetupNewCategoryForm gradebook_id={gradebook_id} addCategory={(name, weight,drops, id) => setCategories({...categories, [id]: {name, weight, drops}})} />
					{Object.keys(categories).length === 0 && <div className="grades__setup__form__category grades__setup__form__category--empty">
						Use the form above to input the grading criteria from your syllabus
					</div>}
					{Object.keys(categories).length !== 0 && Object.keys(categories).map((category_id) => <CategorySetupCategory key={category_id} name={categories[category_id].name} weight={categories[category_id].weight} drops={categories[category_id].drops} deleteCategory={() => removeCategory(category_id)}/>)}

				</div>
				<div className="grades__setup__footer">
					<div className="grades__setup__footer__error genericError">{error}</div>

					<Button secondary onClick={submit} className="">Done</Button>
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
	const [categories, setCategories] = useState({});
	const [showGradebook, setShowGradebook] = useState(true);

	let gradebook_id='97A239B1-5A09-4E6D-B394-9C0B5DE07B1E'

	useEffect(() => {
		setPage("grades");
	}, [setPage])
	
	// Load existing categories
	useEffect(() => {
		let load = async () => {
			let categoriesresp = await fetch(`/api/gradebooks/${gradebook_id}/categories`);
			let categoriesdata = await categoriesresp.json();

			const existing_cats = categoriesdata.data.reduce((map, db_category) => {map[db_category.id] = {name: db_category.category_name, weight:db_category.weight_percent, drops: db_category.drops}; return map }, {});
			setCategories(existing_cats)
			setShowGradebook(!has_bad_category_sum(existing_cats))
		}
		load()
	}, [gradebook_id])


	if(!showGradebook) {
		return (<CategorySetupView gradebook_id={gradebook_id} categories={categories} setCategories={setCategories} onComplete={() => setShowGradebook(true)}  />)
	} else {
		return <GradebookMainView />
	}
}
