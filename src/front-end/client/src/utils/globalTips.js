import { DOMrenderDivs } from './DocumentHandler';

export function renderGlobalTips(content) {
    const buffer = document.getElementById('__BUFFER__');
    const html   =
              <div className="global_tips">
                  {content}
                  <button onClick={(e) => {
                      e.currentTarget.parentElement.remove();
                  }}>dismiss
                  </button>
              </div>;
    DOMrenderDivs(html, buffer);
}