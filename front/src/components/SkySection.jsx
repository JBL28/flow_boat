import StarField from "./StarField.jsx";
import Moon from "./Moon.jsx";

/**
 * Night-sky section containing the message input UI and decorative atmosphere.
 *
 * Decorative layers (StarField, Moon) are rendered behind the content at
 * z-index 0/1. The section itself sits at z-index 7 so the stars remain
 * visible above the mountain image that bleeds upward from the river section.
 *
 * @param {{
 *   worryText: string,
 *   setWorryText: (text: string) => void,
 *   canSend: boolean,
 *   onSend: () => void,
 * }} props
 */
function SkySection({ worryText, setWorryText, canSend, onSend }) {
  const handleKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;

    event.preventDefault();
    if (canSend) onSend();
  };

  return (
    <section className="sky-section" aria-label="걱정을 적는 밤하늘 영역">
      <StarField />
      <Moon />
      <div className="sky-content">
        <p className="eyebrow">지금, 당신의 생각을</p>
        <h1>흘려보내다</h1>
        <p className="lead">
          당신의 생각을 작은 종이배에 적어보세요.
        </p>

        <div className="input-panel">
          <label className="sr-only" htmlFor="worry">
            흘려보내고 싶은 걱정
          </label>
          <textarea
            id="worry"
            value={worryText}
            onChange={(event) => setWorryText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="지금 흘려보내고 싶은 생각을 적어주세요."
            rows={5}
          />
          <button className="send-button" type="button" disabled={!canSend} onClick={onSend}>
            흘려보내기
          </button>
        </div>
      </div>
    </section>
  );
}

export default SkySection;
