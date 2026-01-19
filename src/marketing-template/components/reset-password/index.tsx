import Wrapper from "@/layouts/Wrapper";
import Link from "next/link";



export default function ResetPassword() {
  return (
    <Wrapper>

      <div className="azzle-extra-header">
        <div className="container">
          <div className="azzle-extra-logo">
            <Link href="/">
              <img src="assets/images/logo/logo-dark.svg" alt="logo" />
            </Link>
          </div>
        </div>
      </div>
      {/* <!-- End section --> */}

      <div className="azzle-account-section">
        <div className="container">
          <div className="azzle-account-header">
            <h1>Reset Password</h1>
          </div>
          <div className="azzle-account-box">
            <form action="#">
              <div className="azzle-contact-field mb24">
                <label>Email address</label>
                <input type="email" placeholder="example@gmail.com" />
              </div>
              <div className="azzle-contact-field mb24">
                <label>Enter Password</label>
                <input type="password" placeholder="password" />
              </div>
              <button id="azzle-main-submit-btn" className="w-100" type="button">Change password</button>
            </form>
            <div className="azzle-accout-footer mt24">
              <p>If you didn’t request a password recovery link, please ignore this.</p>
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  )
}
