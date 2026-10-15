import { useEffect, useState } from 'react';
import { BookOpen, BrainCircuit, ChartNoAxesCombined, GraduationCap, LayoutDashboard, MessageCircle, Sparkles, Target, CheckCircle2, Clock3, ArrowRight, Send, Menu, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const API = `${API_BASE}/api`;
type Dashboard = { student:{name:string}; average_accuracy:number; quizzes_taken:number; questions_answered:number; lessons_completed:number; topic_performance:any[]; recommendations:any[]; recent_attempts:any[]; weakest_topic:string|null };
type QuizQuestion = { id:number; prompt:string; options:Record<string,string>; topic:string; subject:string; difficulty:string };
type Result = { score:number; total:number; accuracy:number; topic_stats:any[]; review:any[] };
export default function App() {
  const [page,setPage] = useState('Dashboard');
  const [dashboard,setDashboard] = useState<Dashboard|null>(null);
  const [dashboardLoading,setDashboardLoading] = useState(true);
  const [lessons,setLessons] = useState<any[]>([]);
  const [quiz,setQuiz] = useState<QuizQuestion[]>([]);
  const [answers,setAnswers] = useState<Record<number,string>>({});
  const [result,setResult] = useState<Result|null>(null);
  const [subject,setSubject] = useState('All subjects');
  const [tutorInput,setTutorInput] = useState('');
  const [tutorMessages,setTutorMessages] = useState<any[]>([{role:'assistant',text:'Hi! I’m your LearnMate demo tutor. Ask me about Python, loops, functions, SQL, algebra, or study planning.'}]);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  async function load() {
    setDashboardLoading(true);
    let dashboardLoaded = false;
    try {
      const response = await fetch(`${API}/dashboard`, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error(`Dashboard API returned ${response.status}`);
      const data = await response.json();
      setDashboard(data);
      dashboardLoaded = true;
    } catch (e) {
      setError('Dashboard data could not load. Confirm the backend is running, then open http://127.0.0.1:8000/api/health to check it.');
    } finally {
      setDashboardLoading(false);
    }
    try {
      const response = await fetch(`${API}/lessons`, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error(`Lessons API returned ${response.status}`);
      setLessons(await response.json());
      if (dashboardLoaded) setError('');
    } catch {
      setError('Lessons could not load. Check that the FastAPI backend is running at http://127.0.0.1:8000.');
    }
  }
  useEffect(()=>{load()},[]);
  async function startQuiz() {
    setLoading(true); setResult(null); setAnswers({});
    try { const url = subject==='All subjects' ? `${API}/quiz?limit=12` : `${API}/quiz?subject=${encodeURIComponent(subject)}&limit=12`;
      const r=await fetch(url); if(!r.ok) throw new Error(); setQuiz(await r.json()); setPage('Take a quiz'); }
    catch { setError('Could not load quiz questions. Check the backend.'); }
    finally { setLoading(false); }
  }
  async function submitQuiz() {
    if(!quiz.length) return;
    if(quiz.some(q=>!answers[q.id])) { setError('Please answer every question before submitting.'); return; }
    setLoading(true); setError('');
    try { const r=await fetch(`${API}/quiz/submit`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answers:Object.fromEntries(Object.entries(answers).map(([k,v])=>[Number(k),v]))})});
      if(!r.ok) throw new Error(); setResult(await r.json()); await load();
    } catch { setError('Could not submit quiz. Check the backend.'); } finally {setLoading(false);}
  }
  async function askTutor() {
    const q=tutorInput.trim(); if(!q) return;
    setTutorMessages(m=>[...m,{role:'user',text:q}]); setTutorInput('');
    try { const r=await fetch(`${API}/tutor`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q,language:'English'})}); const data=await r.json(); setTutorMessages(m=>[...m,{role:'assistant',text:data.answer,mode:data.mode}]); }
    catch { setTutorMessages(m=>[...m,{role:'assistant',text:'Tutor is unavailable. Please check that the backend is running.'}]); }
  }
  async function completeLesson(id:number) { await fetch(`${API}/lessons/${id}/complete`,{method:'POST'}); await load(); }
  const nav=[['Dashboard',LayoutDashboard],['Lessons',BookOpen],['Take a quiz',Target],['AI Tutor',MessageCircle],['My progress',ChartNoAxesCombined]] as const;
  const topicData=dashboard?.topic_performance??[];
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><BrainCircuit size={22}/></div><div><b>LearnMate<span> AI</span></b><small>PERSONAL LEARNING</small></div></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{nav.map(([name,Icon])=><button key={name} className={`nav-item ${page===name?'active':''}`} onClick={()=>{setPage(name);setResult(null)}}><Icon size={18}/><span>{name}</span>{name==='AI Tutor'&&<span className="nav-dot"/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="goal-card"><div className="goal-icon"><Sparkles size={17}/></div><b>Small steps, big growth.</b><p>Your next breakthrough starts with one lesson.</p><button onClick={()=>setPage('Lessons')}>Explore lessons <ArrowRight size={14}/></button></div><div className="profile"><div className="avatar">DS</div><div><b>Demo Student</b><small>Learning account</small></div><span className="online-dot"/></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="mobile-brand"><BrainCircuit/> LearnMate AI</div><div className="breadcrumb">Workspace <span>/</span> <b>{page}</b></div><div className="top-right"><span className="status-pill"><span/> Learning mode</span><div className="avatar small">DS</div></div></header>
      <div className="content">
        {error&&<div className="alert"><span>{error}</span><button onClick={()=>{setError('');load()}}><RefreshCw size={15}/> Retry</button></div>}
        {page==='Dashboard'&&<>{dashboardLoading ? <section className="panel dashboard-loading"><div className="loading-spinner"/><h2>Loading your learning dashboard…</h2><p className="muted">Fetching your saved progress and recommendations.</p><button className="secondary" onClick={load}><RefreshCw size={14}/> Try again</button></section> : <><div className="welcome-row"><div><div className="eyebrow">YOUR LEARNING SPACE</div><h1>Keep your momentum going<span>.</span></h1><p className="muted">Every concept you master brings you closer to your goals.</p></div><button className="primary" onClick={startQuiz}><Target size={17}/> Start a quiz <ArrowRight size={16}/></button></div>
          <div className="hero-card"><div className="hero-copy"><div className="hero-tag"><Sparkles size={14}/> YOUR PERSONAL LEARNING SPACE</div><h2>Learn at your pace.<br/><em>Grow with every answer.</em></h2><p>Your learning path adapts to what you know and what you’re ready to discover next.</p><button className="hero-button" onClick={()=>setPage('Lessons')}>Continue learning <ArrowRight size={16}/></button></div><div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="art-center"><GraduationCap size={50}/></div><div className="float-chip chip-one"><CheckCircle2 size={16}/> Progress saved</div><div className="float-chip chip-two"><BrainCircuit size={17}/> AI-powered</div><div className="sparkle s1">✦</div><div className="sparkle s2">✧</div></div></div>
          <div className="section-heading"><div><h2>Your learning at a glance</h2><p className="muted">A snapshot of your progress so far.</p></div><button className="text-button" onClick={()=>setPage('My progress')}>View analytics <ArrowRight size={15}/></button></div>
          <div className="stats-grid"><Stat icon={<ChartNoAxesCombined/>} label="Average accuracy" value={`${dashboard?.average_accuracy??0}%`} sub="Across all quiz attempts" tone="purple"/><Stat icon={<Target/>} label="Quizzes completed" value={dashboard?.quizzes_taken??0} sub={`${dashboard?.questions_answered??0} questions answered`} tone="blue"/><Stat icon={<BookOpen/>} label="Lessons completed" value={dashboard?.lessons_completed??0} sub="Keep building your streak" tone="orange"/><Stat icon={<BrainCircuit/>} label="Topics to explore" value={topicData.filter(t=>t.accuracy===null).length} sub="Personalized recommendations" tone="green"/></div>
          <div className="two-col"><section className="panel"><div className="panel-head"><div><h3>Recommended for you</h3><p>Based on your learning activity</p></div><span className="tiny-pill">ADAPTIVE</span></div><div className="recommend-list">{(dashboard?.recommendations??[]).slice(0,4).map((r,i)=><div className="recommend" key={r.topic}><div className={`rec-number n${i}`}>{String(i+1).padStart(2,'0')}</div><div className="rec-body"><b>{r.topic}</b><p>{r.reason}</p></div><span className={`priority ${r.priority.toLowerCase()}`}>{r.priority}</span></div>)}</div><button className="panel-link" onClick={()=>setPage('Lessons')}>Explore learning library <ArrowRight size={15}/></button></section>
          <section className="panel"><div className="panel-head"><div><h3>Topic mastery</h3><p>Your accuracy by learning topic</p></div><span className="legend-dot"/> <small className="muted">Accuracy</small></div><div className="chart-wrap">{topicData.length?<ResponsiveContainer width="100%" height={245}><BarChart data={topicData} margin={{top:8,right:2,left:-25,bottom:30}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf4"/><XAxis dataKey="topic" tick={{fontSize:10,fill:'#788398'}} angle={-18} textAnchor="end" interval={0}/><YAxis domain={[0,100]} tick={{fontSize:11,fill:'#788398'}}/><Tooltip/><Bar dataKey="accuracy" name="Accuracy %" fill="#7667ed" radius={[5,5,0,0]} maxBarSize={34}/></BarChart></ResponsiveContainer>:<div className="empty-chart"><ChartNoAxesCombined size={30}/><b>Your chart will grow with you</b><p>Take a quiz to see your topic accuracy here.</p><button className="secondary" onClick={startQuiz}>Take first quiz</button></div>}</div></section></div>
          <div className="bottom-note"><div className="note-icon"><Sparkles size={19}/></div><div><b>Learning tip</b><p>Reviewing mistakes is one of the most useful ways to improve. After each quiz, revisit the explanation for every question you missed.</p></div></div>
        </>}</>}
        {page==='Lessons'&&<><PageTitle eyebrow="YOUR KNOWLEDGE LIBRARY" title="Explore and learn" subtitle="Short lessons designed to help you build understanding one topic at a time."/><div className="filter-row"><span>{lessons.length} lessons available</span><span className="muted"><Clock3 size={14}/> Most lessons take 10 minutes</span></div><div className="lesson-grid">{lessons.map((l,i)=><article className="lesson-card" key={l.id}><div className={`lesson-banner tone-${i%4}`}><div className="lesson-symbol">{l.subject==='Python'?'Py':l.subject==='Mathematics'?'∑':'SQL'}</div><span>{l.subject}</span></div><div className="lesson-info"><div className="lesson-meta"><span>{l.topic}</span><span><Clock3 size={13}/>{l.estimated_minutes} min</span></div><h3>{l.title}</h3><p>{l.content}</p><button className="secondary full" onClick={()=>completeLesson(l.id)}><CheckCircle2 size={15}/> Mark as completed</button></div></article>)}</div></>}
        {page==='Take a quiz'&&<><PageTitle eyebrow="CHECK YOUR UNDERSTANDING" title="Put your knowledge to the test" subtitle="Answer thoughtfully. Your results help personalize what you learn next."/><div className="quiz-controls"><label>Subject <select value={subject} onChange={e=>setSubject(e.target.value)}><option>All subjects</option><option>Python</option><option>Mathematics</option><option>Computer Science</option></select></label><button className="primary" onClick={startQuiz} disabled={loading}><RefreshCw size={15}/> New quiz</button></div>{result?<section className="panel result-panel"><div className="result-circle"><strong>{result.accuracy}%</strong><span>accuracy</span></div><h2>{result.score===result.total?'Excellent work!':result.accuracy>=70?'Good progress!':'Keep practicing!'}</h2><p className="muted">You answered {result.score} out of {result.total} questions correctly.</p><div className="result-topics">{result.topic_stats.map(t=><div key={t.topic}><span>{t.topic}</span><b>{t.accuracy}%</b><div className="progress-track"><i style={{width:`${t.accuracy}%`}}/></div></div>)}</div><h3 className="review-title">Answer review</h3>{result.review.map((r,i)=><div className="review-item" key={r.id}><b>{i+1}. {r.prompt}</b><span className={r.is_correct?'correct':'incorrect'}>{r.is_correct?'Correct':`Correct answer: ${r.correct_option}`}</span><p>{r.explanation}</p></div>)}<button className="primary" onClick={()=>{setResult(null);startQuiz()}}>Practice again <ArrowRight size={15}/></button></section>:quiz.length?<div className="quiz-list">{quiz.map((q,i)=><section className="panel question-card" key={q.id}><div className="question-meta"><span>QUESTION {i+1} OF {quiz.length}</span><span>{q.topic}</span></div><h3>{q.prompt}</h3><div className="options">{Object.entries(q.options).map(([letter,text])=><label className={`option ${answers[q.id]===letter?'selected':''}`} key={letter}><input type="radio" name={`q${q.id}`} checked={answers[q.id]===letter} onChange={()=>setAnswers(a=>({...a,[q.id]:letter}))}/><span className="option-letter">{letter}</span><span>{text}</span></label>)}</div></section>)}<div className="submit-row"><span className="muted">{Object.keys(answers).length} of {quiz.length} answered</span><button className="primary" disabled={loading} onClick={submitQuiz}>{loading?'Submitting…':'Submit answers'} <ArrowRight size={16}/></button></div></div>:<div className="panel quiz-start"><div className="big-icon"><Target size={30}/></div><h2>Ready to find your next learning step?</h2><p className="muted">Choose a subject, start a quiz, and get topic-level feedback with explanations.</p><button className="primary" onClick={startQuiz} disabled={loading}>{loading?'Loading…':'Start assessment'} <ArrowRight size={16}/></button></div>}</>}
        {page==='AI Tutor'&&<><PageTitle eyebrow="YOUR STUDY COMPANION" title="Ask, explore, understand" subtitle="A friendly demo tutor to help you work through concepts and examples."/><div className="tutor-layout"><div className="tutor-main panel"><div className="tutor-head"><div className="tutor-avatar"><BrainCircuit size={22}/></div><div><b>LearnMate Tutor</b><small><span className="online-dot"/> Demo mode · curated responses</small></div><span className="tiny-pill">AI TUTOR</span></div><div className="chat-messages">{tutorMessages.map((m,i)=><div className={`message ${m.role}`} key={i}><div className="message-avatar">{m.role==='assistant'?<BrainCircuit size={16}/>:<span>DS</span>}</div><div className="message-content"><p>{m.text}</p>{m.mode&&<small>Curated demo response</small>}</div></div>)}</div><div className="suggested-prompts"><span>TRY ASKING</span>{['Explain Python loops','Help me solve an equation','Create a study plan'].map(p=><button key={p} onClick={()=>setTutorInput(p)}>{p}</button>)}</div><form className="chat-form" onSubmit={e=>{e.preventDefault();askTutor()}}><input value={tutorInput} onChange={e=>setTutorInput(e.target.value)} placeholder="Ask a question about your lesson…"/><button className="primary icon-button" type="submit" aria-label="Send"><Send size={17}/></button></form></div><aside className="tutor-aside panel"><div className="aside-icon"><Sparkles/></div><h3>Learn by understanding</h3><p>Good learning is more than memorizing an answer. Ask for examples, break a problem into steps, or revisit the fundamentals.</p><div className="tutor-rule"/><b>Helpful prompts</b><ul><li>Explain this in simple words</li><li>Give me a real-world example</li><li>Quiz me on this topic</li><li>Give me a hint, not the answer</li></ul><div className="demo-disclaimer">This version uses curated demo responses. Connect an LLM provider for open-ended tutoring.</div></aside></div></>}
        {page==='My progress'&&<><PageTitle eyebrow="YOUR LEARNING JOURNEY" title="Progress that tells a story" subtitle="Use your results to celebrate strengths and choose what to practice next."/><div className="stats-grid"><Stat icon={<ChartNoAxesCombined/>} label="Overall accuracy" value={`${dashboard?.average_accuracy??0}%`} sub="All saved attempts" tone="purple"/><Stat icon={<Target/>} label="Quizzes taken" value={dashboard?.quizzes_taken??0} sub="Assessments completed" tone="blue"/><Stat icon={<BookOpen/>} label="Questions answered" value={dashboard?.questions_answered??0} sub="Practice adds up" tone="orange"/><Stat icon={<CheckCircle2/>} label="Lessons completed" value={dashboard?.lessons_completed??0} sub="Learning milestones" tone="green"/></div><div className="two-col progress-columns"><section className="panel"><div className="panel-head"><div><h3>Topic performance</h3><p>Accuracy based on your saved quiz answers</p></div></div>{topicData.map(t=><div className="topic-row" key={t.topic}><div className="topic-row-head"><span>{t.topic}</span><b>{t.accuracy===null?'Not assessed':`${t.accuracy}%`}</b></div><div className="progress-track"><i style={{width:`${t.accuracy??0}%`}}/></div><small>{t.accuracy===null?'Take a quiz to establish a baseline':`${t.correct} correct out of ${t.attempted} attempts`}</small></div>)}</section><section className="panel"><div className="panel-head"><div><h3>Recent quiz attempts</h3><p>Your latest saved assessments</p></div></div>{dashboard?.recent_attempts.length?dashboard.recent_attempts.map(a=><div className="attempt-row" key={a.id}><div className="attempt-icon"><Target size={17}/></div><div><b>{a.subject||'Mixed subjects'}</b><small>{a.date?new Date(a.date).toLocaleString():'Saved attempt'}</small></div><strong>{a.score}/{a.total}</strong></div>):<div className="empty-state"><Target size={28}/><b>No attempts yet</b><p>Take a quiz to start tracking your progress.</p><button className="secondary" onClick={()=>setPage('Take a quiz')}>Start a quiz</button></div>}</section></div></>}
      </div>
      <footer><span>© 2026 LearnMate AI</span><span>Built for learning · SDG 4 Quality Education</span><button onClick={load}><RefreshCw size={13}/> Refresh data</button></footer>
    </main>
  </div>
}
function Stat({icon,label,value,sub,tone}:{icon:any;label:string;value:any;sub:string;tone:string}){return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-sub">{sub}</div></div>}
function PageTitle({eyebrow,title,subtitle}:{eyebrow:string;title:string;subtitle:string}){return <div className="page-title"><div className="eyebrow">{eyebrow}</div><h1>{title}<span>.</span></h1><p className="muted">{subtitle}</p></div>}
