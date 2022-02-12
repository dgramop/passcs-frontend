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
						<div className="modal__title">
								{props.title}
						</div>
						<div className="modal__text">
								{props.children}
						</div>
						<div className="modal__buttons">
								{props.buttons.secondaries.map((buttonProps) => (
										<Button secondary={true} {...buttonProps}>{buttonProps.text}</Button>
								))}
								
								<Button {...props.buttons.primary} extraClasses={(props.buttons.primary.extraClasses || "") + " modal__buttons__primary"} >{props.buttons.primary.text}</Button>
						</div>
				</div>
		</>
		)
}
