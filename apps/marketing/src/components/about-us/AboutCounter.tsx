import Count from "@/common/count";

const counter_data = [
  { end: 20, suffix: "K+", label: "Successful Implementations" },
  { end: 95, suffix: "%", label: "Client Satisfaction Rate" },
  { end: 40, suffix: "+", label: "Awards and Recognitions" },
  { end: 73, suffix: "%", label: "Growth and Expansion" },
];

type AboutCounterProps = {
  content?: typeof counter_data;
};

export default function AboutCounter({ content }: AboutCounterProps) {
  const counters = content ?? counter_data;
  return (
    <div className="section">
      <div className="container">
        <div className="row">
          <div className="azzle-counter-column">
            {counters.map((item, i) => (
              <div key={i} className="azzle-counter-item azzle-counter-item2">
                <h2 className="azzle-counter-data azzle-counter-data2" aria-label="2K+">
                  <Count number={item.end} text={item.suffix} />
                </h2>
                <p>{item.label}</p>
              </div>
            ))} 
          </div>
        </div>
      </div>
    </div>
  )
}
