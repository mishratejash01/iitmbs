/**
 * Runs before first paint: applies a saved light/dark choice so there is no
 * flash. "System" (no saved choice) is handled purely by CSS media queries.
 */
const script = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t}}catch(e){}})()`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
