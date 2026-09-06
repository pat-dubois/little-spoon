import notices from './software-notices.txt?raw'

export function SoftwareNotices() {
  return <details className="software-notices">
    <summary>Software licences</summary>
    <p>Little Spoon is open source. <a href="https://github.com/pat-dubois/little-spoon/tree/feat/verified-clinical-rebuild" target="_blank" rel="noreferrer">View the source and verification reports</a>.</p>
    <pre tabIndex={0} aria-label="Software licence text">{notices}</pre>
  </details>
}
