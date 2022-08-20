import "./PaymentFlow.scss"

export default function PaymentFlow({embed, ...props}) {
	let flow_classes = ["payflow"]
	if(embed) flow_classes.append("payflow--embed")

	return (
		<div className={flow_classes.join(" ")}>
			<div className="payflow__heading">
				<div className="payflow__back">
				</div>
			</div>
		</div>
	)
}
