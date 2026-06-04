export default function FeedbackPanel({ message }) {
  return (
    <section className="panel feedback-panel">
      <h2>Feedback</h2>

      <div className="feedback-text">
        {message || "Choose your line."}
      </div>
    </section>
  );
}