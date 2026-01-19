import ModalVideo from "../../../modal/modalVideo";


export default function VideoHomeOne() {
  return (
    <section className="azzle-video-section">
      <div className="row">
        <div className="col-xl-6">
          <div className="azzle-video-thumb">
            <img src="assets/images/home1/thumb3.png" alt="Thumb" />
            <ModalVideo>
              <a className="azzle-popup-video video-init" href="https://www.youtube.com/watch?v=zE_WFiHnSlY">
                <img src="assets/images/home1/play-btn.png" alt="" />
                <div className="waves wave-1"></div>
                <div className="waves wave-2"></div>
                <div className="waves wave-3"></div>
              </a>

            </ModalVideo>
          </div>
        </div>
        <div className="col-xl-6 d-flex align-items-center">
          <div className="azzle-video-wrap" data-aos="fade-up" data-aos-delay="500">
            <div className="azzle-video-content">
              <h2>AI-powered that streamline tasks</h2>
              <p>As your business grows or your AI SaaS needs change, you can easily adjust your subscription level to match those needs. This flexibility ensures that AI remains an asset.</p>
              <div className="divider2"></div>
              <div className="azzle-counter-wrap">
                <div className="azzle-counter-item">
                  <h2 className="azzle-counter-data" aria-label="92%">92%</h2>
                  <p>Customer service inquiries</p>
                </div>
                <div className="azzle-counter-item">
                  <h2 className="azzle-counter-data" aria-label="75%">75%</h2>
                  <p>Using financial institutions</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
