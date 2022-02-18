
export async function get_logged_in_customer() {
		let customer_resp = await fetch("/customers/0");
		customer_resp = await customer_resp.json()
		if(customer_resp.error) {
				throw customer_resp;
		}
		else return customer_resp?.data;
}

/**
 * Gives time info for the given time zone for a given slot
 */
export function timezone_time_from_slot(slot) {
	let date = new Date(slot.anchor_epoch);
	
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
