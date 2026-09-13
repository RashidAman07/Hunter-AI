import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import "./styles.css";

const API = "http://127.0.0.1:8000/api";

function App(){
  const [jobs,setJobs]=useState([]);
  const [q,setQ]=useState("");
  const [resumeResult,setResumeResult]=useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [location,setLocation]=useState("All");
  const [type,setType]=useState("All");
  const [selected,setSelected]=useState(null);
  const [saved,setSaved]=useState(()=>JSON.parse(localStorage.getItem("hunter_saved")||"[]"));
  const [applied,setApplied]=useState(()=>JSON.parse(localStorage.getItem("hunter_applied")||"[]"));
  const [loading,setLoading]=useState(true);
  const [view,setView]=useState("jobs");

  async function loadJobs(){
    setLoading(true);
    const params=new URLSearchParams();
    if(q) params.set("q",q);
    if(location!=="All") params.set("location",location);
    if(type!=="All") params.set("job_type",type);
    const res=await fetch(`${API}/jobs?${params}`);
    setJobs(await res.json());
    setLoading(false);
  }
  useEffect(()=>{loadJobs()},[q,location,type]);

  async function checkMatch(job){
  const resumeText = window.prompt(
    "Paste your resume text to check the match:"
  );

  if(!resumeText || !resumeText.trim()){
    return;
  }

  const res = await fetch(`${API}/jobs/${job.id}/match`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      resume_text: resumeText
    })
  });

  const data = await res.json();
  setMatchResult(data);
}

  function toggleSave(id){
    const next=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];
    setSaved(next); localStorage.setItem("hunter_saved",JSON.stringify(next));
  }

  async function apply(job){
    const candidate="Demo Candidate";
    if(applied.includes(job.id)) return;
    await fetch(`${API}/applications`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({job_id:job.id,candidate})});
    const next=[...applied,job.id]; setApplied(next); localStorage.setItem("hunter_applied",JSON.stringify(next));
    alert("Application submitted successfully!");
  }

  const savedJobs=useMemo(()=>jobs.filter(j=>saved.includes(j.id)),[jobs,saved]);

  return <div className="app">
    <header className="nav">
      <div className="brand" onClick={()=>setView("jobs")}>HUNTER<span>AI</span></div>
      <nav>
        <button className={view==="jobs"?"active":""} onClick={()=>setView("jobs")}>Find Jobs</button>
        <button className={view==="saved"?"active":""} onClick={()=>setView("saved")}>Saved ({saved.length})</button>
        <button className={view==="applications"?"active":""} onClick={()=>setView("applications")}>Applications</button>
        <button className={view==="resume"?"active":""} onClick={()=>setView("resume")}>Resume Analyzer</button>
      </nav>
      <button className="profile">RA</button>
    </header>

    {view==="jobs" && <main>
      <section className="hero">
        <div>
          <p className="eyebrow">SMARTER CAREER SEARCH</p>
          <h1>Find work that<br/><em>fits you.</em></h1>
          <p className="sub">Discover opportunities, track applications and build the skills employers are looking for.</p>
        </div>
        <div className="hero-card">
          <div className="spark">✦</div>
          <strong>Hunter Match</strong>
          <p>Turn your skills into better job matches.</p>
          <div className="meter"><i/></div>
          <small>AI-ready career intelligence</small>
        </div>
      </section>

      <section className="searchbox">
        <div className="input-wrap"><span>⌕</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Job title, skill or company"/></div>
        <select value={location} onChange={e=>setLocation(e.target.value)}><option>All</option><option>Kolkata</option><option>Bengaluru</option><option>Hyderabad</option><option>Remote</option></select>
        <select value={type} onChange={e=>setType(e.target.value)}><option>All</option><option>Full-time</option><option>Internship</option></select>
        <button className="search-btn" onClick={loadJobs}>Search</button>
      </section>

      <section className="content">
        <div className="section-head"><div><p className="eyebrow">OPPORTUNITIES</p><h2>Latest jobs</h2></div><span>{jobs.length} matches</span></div>
        {loading ? <div className="empty">Loading opportunities...</div> :
        <div className="grid">{jobs.map(job=><JobCard key={job.id} job={job} saved={saved.includes(job.id)} applied={applied.includes(job.id)} onSave={()=>toggleSave(job.id)} onOpen={()=>setSelected(job)} onApply={()=>apply(job)} onMatch={()=>checkMatch(job)}/>)}</div>}
      </section>
    </main>}

    {view==="saved" && <main className="page"><p className="eyebrow">YOUR SHORTLIST</p><h1>Saved jobs</h1><div className="grid">{savedJobs.length?savedJobs.map(job=><JobCard key={job.id} job={job} saved={true} applied={applied.includes(job.id)} onSave={()=>toggleSave(job.id)} onOpen={()=>setSelected(job)} onApply={()=>apply(job)}/>):<div className="empty">No saved jobs yet. Browse opportunities and bookmark the ones you like.</div>}</div></main>}

    {view==="applications" && <main className="page"><p className="eyebrow">APPLICATION TRACKER</p><h1>Your applications</h1><div className="stats"><div><b>{applied.length}</b><span>Applied</span></div><div><b>0</b><span>Shortlisted</span></div><div><b>0</b><span>Interviews</span></div></div><div className="empty">{applied.length?"Your applications are stored in the Hunter API.":"You haven't applied to a job yet."}</div></main>}
    {view==="resume" && <main className="page">
  <p className="eyebrow">CAREER INTELLIGENCE</p>
  <h1>AI Resume Analyzer</h1>
  <p className="sub">
    Analyze your resume, discover your strongest skills and find areas to improve.
  </p>

  <div className="resume-box">
    <textarea
      id="resumeText"
      placeholder="Paste your resume text here..."
      rows="12"
    ></textarea>

    <button
      className="primary"
      onClick={async ()=>{
        const resumeText = document.getElementById("resumeText").value;

        if(!resumeText.trim()){
          alert("Please paste your resume first.");
          return;
        }

        const res = await fetch(`${API}/resume/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            resume_text: resumeText
          })
        });

        const data = await res.json();
        setResumeResult(data);
      }}
    >
      Analyze Resume
    </button>
  </div>
  {resumeResult && (
  <div className="resume-results">
    <div className="result-card score-card">
      <span>Resume Score</span>
      <strong>{resumeResult.score}%</strong>
    </div>

    <div className="result-card">
      <h3>Skills Detected</h3>
      <div className="chips">
        {resumeResult.skills_detected.map(skill => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
    </div>

    <div className="result-card">
      <h3>Skills to Improve</h3>
      <div className="chips">
        {resumeResult.skills_to_improve.map(skill => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
    </div>

    <div className="result-card">
      <h3>Recommended Roles</h3>
      {resumeResult.recommended_roles.map(role => (
        <p key={role}>→ {role}</p>
      ))}
    </div>

    <p className="analyzer-note">
      {resumeResult.note}
    </p>
  </div>
)}
</main>}

{matchResult && (
  <div className="modal-backdrop" onClick={()=>setMatchResult(null)}>
    <div className="modal" onClick={e=>e.stopPropagation()}>
      <button
        className="close"
        onClick={()=>setMatchResult(null)}
      >
        ×
      </button>

      <p className="eyebrow">HUNTER MATCH</p>

      <h2>{matchResult.job_title}</h2>

      <div className="salary">
        {matchResult.match_score}% Match
      </div>

      <h3>Matched Skills</h3>
      <div className="chips">
        {matchResult.matched_skills.map(skill => (
          <span key={skill}>{skill}</span>
        ))}
      </div>

      <h3>Skills to Improve</h3>
      <div className="chips">
        {matchResult.missing_skills.length > 0
          ? matchResult.missing_skills.map(skill => (
              <span key={skill}>{skill}</span>
            ))
          : <span>None 🎉</span>
        }
      </div>

      <p className="analyzer-note">
        {matchResult.message}
      </p>
    </div>
  </div>
)}

    {selected && <div className="modal-backdrop" onClick={()=>setSelected(null)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}>×</button><p className="eyebrow">{selected.company}</p><h2>{selected.title}</h2><p className="muted">{selected.location} · {selected.job_type} · {selected.experience}</p><div className="salary">{selected.salary}</div><p>{selected.description}</p><h3>Skills</h3><div className="chips">{selected.skills.split(",").map(s=><span key={s}>{s.trim()}</span>)}</div><button className="primary" disabled={applied.includes(selected.id)} onClick={()=>apply(selected)}>{applied.includes(selected.id)?"Applied ✓":"Apply now"}</button></div></div>}
  </div>
}

function JobCard({job,saved,applied,onSave,onOpen,onApply,onMatch,}){
  return <article className="job-card">
    <div className="job-top"><div className="logo">{job.company.slice(0,1)}</div><button className={"bookmark "+(saved?"saved":"")} onClick={onSave}>{saved?"★":"☆"}</button></div>
    <p className="company">{job.company}</p><h3>{job.title}</h3>
    <p className="muted">{job.location} · {job.job_type}</p>
    <div className="salary">{job.salary}</div>
    <div className="chips">{job.skills.split(",").slice(0,3).map(s=><span key={s}>{s.trim()}</span>)}</div>
    <div className="card-actions">
  <button onClick={onOpen}>View details</button>
  <button onClick={onMatch}>Match</button>
  <button className="primary small" disabled={applied} onClick={onApply}>
    {applied ? "Applied" : "Apply"}
  </button>
</div>
  </article>
}

createRoot(document.getElementById("root")).render(<App/>);
