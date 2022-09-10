import {useEffect, useState} from "react"
import {useSearchParams, useNavigate} from "react-router-dom"
import {LoginModal, Modal} from "./Components";

export default function FromToken(props) {
	let [params, setParams] = useSearchParams()
	let [loginError, setLoginError] = useState(null);
	let [showMail, setShowMail] = useState(false);
		
	let login = async (token) => {
		try {
			let resp = await fetch(`/api/login?token=${encodeURIComponent(token)}`)
			let json = await resp.json()
			if(json.error) {
				switch(json.error.type) {
					case "BadToken":
						setLoginError("Your token has expired")
						break;
					case "OldToken":
						setLoginError("Your token has expired")
						break;
					default:
						setLoginError(json.error.type)
						break;
				}
			} else {
				setLoginError(null)
				if(json.data.token.user_type === "customer")
				{
					navigate("/student/dashboard")
				} else if(json.data.token.user_type === "tutor") {
					navigate("/tutor/dashboard")
				} else {
					setLoginError("Unknown user type")
				}
			}
		} catch(e) {
			setLoginError("Unable to communicate with server")
		}
	};

	useEffect(() => {
		login(params.get("token"));
	})

	let navigate = useNavigate();

	if(showMail) {
		return (<LoginModal close={() => {navigate("/")}} />) 
	} else {
		return (<Modal close={() => setShowMail(true)} title={loginError ? <span className="genericError">{loginError}</span> : "Logging You In"} buttons={
		{
			primary: {
				text: "Resend Link",
				onClick: () => setShowMail(true),
				extraClasses: !loginError ? "nodisplay" : ""
			}
		}
		}>
			{!loginError && <>Please wait</>} {loginError && <>You may need a new magic link</>}
	</Modal>)
	}
}
