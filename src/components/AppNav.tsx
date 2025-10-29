export default function AppNav(){
  return (
    <div className="app-shell">
      <nav className="navbar navbar-expand bg-white">
        <div className="container-xxl">
          <a className="navbar-brand fw-semibold" href="/">
            MindTrack <span className="text-primary">Campus</span>
          </a>
          <div className="ms-auto d-flex gap-2">
            <a className="btn btn-outline-primary btn-sm btn-pill" href="/evaluate/dass21">DASS-21</a>
            <a className="btn btn-primary btn-sm btn-pill" href="/evaluate/pss10">PSS-10</a>
          </div>
        </div>
      </nav>
    </div>
  );
}
