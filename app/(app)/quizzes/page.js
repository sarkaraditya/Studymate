'use client';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { api } from '@/lib/ask';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizzesPage() {
  const [view, setView] = useState('list'); // 'list' | 'create' | 'taking' | 'summary'
  const [quizzes, setQuizzes] = useState(null);
  const [docs, setDocs] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  // Creation form state
  const [sourceType, setSourceType] = useState('doc'); // 'doc' | 'upload' | 'note' | 'text'
  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [customText, setCustomText] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');

  // Active quiz state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [qIndex]: chosenIndex }

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Load existing quizzes, documents, and notes
  useEffect(() => {
    api('/api/quizzes')
      .then((r) => setQuizzes(r.quizzes || []))
      .catch(() => setQuizzes([]));

    api('/api/documents')
      .then((r) => {
        setDocs(r.documents || []);
        if (r.documents?.length) setSelectedDocId(r.documents[0].id);
      })
      .catch(() => {});

    api('/api/notes')
      .then((r) => {
        setNotes(r.notes || []);
        if (r.notes?.length) setSelectedNoteId(r.notes[0].id);
      })
      .catch(() => {});
  }, []);

  // Generate quiz using AI
  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    flash('Analyzing your study notes with AI…');

    try {
      let res;
      if (sourceType === 'upload') {
        if (!uploadFile) throw new Error('Please select a PDF or notes file to upload.');
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('numQuestions', String(numQuestions));
        formData.append('difficulty', difficulty);

        const r = await fetch('/api/quizzes/generate', {
          method: 'POST',
          body: formData,
        });
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d.error || 'Failed to generate quiz');
        }
        res = await r.json();
      } else {
        const payload = {
          numQuestions,
          difficulty,
        };
        if (sourceType === 'doc') {
          if (!selectedDocId) throw new Error('Please select an uploaded document.');
          payload.documentId = selectedDocId;
        } else if (sourceType === 'note') {
          if (!selectedNoteId) throw new Error('Please select a saved note.');
          payload.noteId = selectedNoteId;
        } else if (sourceType === 'text') {
          if (!customText.trim()) throw new Error('Please paste your study notes.');
          payload.text = customText.trim();
          payload.title = customTitle.trim() || 'Custom Quiz';
        }

        res = await api('/api/quizzes/generate', {
          method: 'POST',
          body: payload,
        });
      }

      setQuizzes((prev) => [res.quiz, ...(prev || [])]);
      startQuiz(res.quiz);
      flash('Quiz generated successfully! Good luck.');
    } catch (err) {
      flash(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Start taking a quiz
  function startQuiz(quiz) {
    let parsedQuestions = quiz.questions;
    if (typeof parsedQuestions === 'string') {
      try {
        parsedQuestions = JSON.parse(parsedQuestions);
      } catch {
        parsedQuestions = [];
      }
    }
    setActiveQuiz({ ...quiz, questions: parsedQuestions });
    setQIndex(0);
    setUserAnswers({});
    setView('taking');
  }

  // Resume or start from quiz list
  async function loadAndStartQuiz(id) {
    setLoading(true);
    try {
      const res = await api(`/api/quizzes/${id}`);
      startQuiz(res.quiz);
    } catch (err) {
      flash(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Delete a quiz
  async function deleteQuiz(id, title) {
    if (!confirm(`Delete quiz "${title}"?`)) return;
    try {
      await api(`/api/quizzes/${id}`, { method: 'DELETE' });
      setQuizzes((prev) => (prev || []).filter((q) => q.id !== id));
      flash('Quiz deleted');
    } catch (err) {
      flash(err.message);
    }
  }

  // Answer selection
  function handleSelectOption(optIdx) {
    if (userAnswers[qIndex] !== undefined) return; // already answered
    const nextAnswers = { ...userAnswers, [qIndex]: optIdx };
    setUserAnswers(nextAnswers);
  }

  // Finish quiz and calculate score
  async function finishQuiz() {
    const questions = activeQuiz.questions || [];
    let calculatedScore = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) {
        calculatedScore += 1;
      }
    });

    try {
      await api(`/api/quizzes/${activeQuiz.id}`, {
        method: 'PATCH',
        body: { score: calculatedScore },
      });
      setQuizzes((prev) =>
        (prev || []).map((q) =>
          q.id === activeQuiz.id
            ? { ...q, score: Math.max(q.score ?? 0, calculatedScore) }
            : q
        )
      );
    } catch {}

    setView('summary');
  }

  const currentQ = activeQuiz?.questions?.[qIndex];
  const hasAnsweredCurrent = userAnswers[qIndex] !== undefined;
  const isCorrect = userAnswers[qIndex] === currentQ?.correctIndex;
  const totalQuestions = activeQuiz?.questions?.length || 0;

  // Calculate score for summary
  const totalCorrect =
    activeQuiz?.questions?.reduce(
      (acc, q, idx) => (userAnswers[idx] === q.correctIndex ? acc + 1 : acc),
      0
    ) || 0;
  const percentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <>
      <div className="mhead">
        <div>
          <h1>Practice Quizzes</h1>
          <p>Generate interactive multiple-choice tests from your uploaded notes and test your knowledge.</p>
        </div>
        {view === 'list' && (
          <button className="btn pri" onClick={() => setView('create')}>
            <Icon n="plus" size={16} /> Create Quiz
          </button>
        )}
        {(view === 'taking' || view === 'summary' || view === 'create') && (
          <button className="btn out" onClick={() => setView('list')}>
            ← All Quizzes
          </button>
        )}
      </div>

      {/* VIEW: CREATE QUIZ */}
      {view === 'create' && (
        <div className="quiz-container">
          <div className="card q-card">
            <h2 style={{ margin: 0, fontSize: 20 }}>Generate Quiz from Study Notes</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
              Choose your study source. The AI will analyze key concepts, definitions, and formulas to craft high-yield practice questions.
            </p>

            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Source Tabs */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  Study Material Source:
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={'pill' + (sourceType === 'doc' ? ' on' : '')}
                    onClick={() => setSourceType('doc')}
                  >
                    <Icon n="doc" size={14} /> My Documents ({docs.length})
                  </button>
                  <button
                    type="button"
                    className={'pill' + (sourceType === 'upload' ? ' on' : '')}
                    onClick={() => setSourceType('upload')}
                  >
                    <Icon n="clip" size={14} /> Upload New PDF
                  </button>
                  <button
                    type="button"
                    className={'pill' + (sourceType === 'note' ? ' on' : '')}
                    onClick={() => setSourceType('note')}
                  >
                    <Icon n="notes" size={14} /> Saved Notes ({notes.length})
                  </button>
                  <button
                    type="button"
                    className={'pill' + (sourceType === 'text' ? ' on' : '')}
                    onClick={() => setSourceType('text')}
                  >
                    ✏️ Paste Text
                  </button>
                </div>
              </div>

              {/* Source Inputs */}
              {sourceType === 'doc' && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    Select Uploaded Document:
                  </label>
                  {docs.length === 0 ? (
                    <div className="empty" style={{ padding: 14, fontSize: 13 }}>
                      No documents found. Switch to &quot;Upload New PDF&quot; or upload files in My Documents.
                    </div>
                  ) : (
                    <select
                      className="sel"
                      style={{ width: '100%', padding: '10px 14px' }}
                      value={selectedDocId}
                      onChange={(e) => setSelectedDocId(e.target.value)}
                    >
                      {docs.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.pages})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {sourceType === 'upload' && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    Choose PDF or Notes file:
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px dashed var(--line)',
                      borderRadius: 10,
                      background: 'var(--bg)',
                    }}
                  />
                  {uploadFile && (
                    <small style={{ color: 'var(--brand)', display: 'block', marginTop: 6, fontWeight: 600 }}>
                      Selected: {uploadFile.name}
                    </small>
                  )}
                </div>
              )}

              {sourceType === 'note' && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    Select Saved Note:
                  </label>
                  {notes.length === 0 ? (
                    <div className="empty" style={{ padding: 14, fontSize: 13 }}>
                      No notes created yet. Create a note in the Notes section or paste text below.
                    </div>
                  ) : (
                    <select
                      className="sel"
                      style={{ width: '100%', padding: '10px 14px' }}
                      value={selectedNoteId}
                      onChange={(e) => setSelectedNoteId(e.target.value)}
                    >
                      {notes.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {sourceType === 'text' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    type="text"
                    className="ttl"
                    placeholder="Quiz Title (e.g. Operating Systems Paging)"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    style={{ fontSize: 16 }}
                  />
                  <textarea
                    placeholder="Paste your lecture notes, summaries, or key concepts here…"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: 140,
                      padding: 12,
                      borderRadius: 10,
                      border: '1px solid var(--line)',
                      background: 'var(--bg)',
                      font: 'inherit',
                    }}
                  />
                </div>
              )}

              {/* Options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    Number of Questions:
                  </label>
                  <select
                    className="sel"
                    style={{ width: '100%' }}
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                  >
                    <option value={3}>3 Questions (Quick Test)</option>
                    <option value={5}>5 Questions (Standard)</option>
                    <option value={10}>10 Questions (Comprehensive)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    Difficulty Level:
                  </label>
                  <select
                    className="sel"
                    style={{ width: '100%' }}
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="Easy">Easy (Definitions & Basics)</option>
                    <option value="Medium">Medium (Application & Concepts)</option>
                    <option value="Hard">Hard (Deep Thinking & Edge Cases)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  type="submit"
                  className="btn pri"
                  disabled={loading}
                  style={{ flex: 1, justifyContent: 'center', padding: '12px 18px', fontSize: 15 }}
                >
                  <Icon n="spark" size={18} />
                  {loading ? 'Analyzing Notes & Generating Questions…' : 'Generate Quiz with AI'}
                </button>
                <button type="button" className="btn" onClick={() => setView('list')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW: TAKING ACTIVE QUIZ */}
      {view === 'taking' && currentQ && (
        <div className="quiz-container">
          <div className="card q-card">
            {/* Top header with progress */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
                {activeQuiz.title}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>
                Question {qIndex + 1} of {totalQuestions}
              </span>
            </div>

            <div className="q-progress-bg">
              <div
                className="q-progress-fill"
                style={{ width: `${((qIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>

            {/* Question title */}
            <h2 style={{ margin: '4px 0 10px', fontSize: 18, lineHeight: 1.5, fontWeight: 700 }}>
              {currentQ.question}
            </h2>

            {/* Options */}
            <div className="q-opts">
              {currentQ.options.map((opt, oIdx) => {
                let optClass = 'q-opt';
                if (hasAnsweredCurrent) {
                  if (oIdx === currentQ.correctIndex) {
                    optClass += ' correct';
                  } else if (userAnswers[qIndex] === oIdx) {
                    optClass += ' wrong';
                  }
                }

                return (
                  <button
                    key={oIdx}
                    className={optClass}
                    onClick={() => handleSelectOption(oIdx)}
                    disabled={hasAnsweredCurrent}
                  >
                    <span className="q-opt-letter">{LETTERS[oIdx]}</span>
                    <span style={{ flex: 1 }}>{opt}</span>
                    {hasAnsweredCurrent && oIdx === currentQ.correctIndex && (
                      <span style={{ color: '#10b981', display: 'grid', placeItems: 'center' }}>
                        <Icon n="check" size={18} />
                      </span>
                    )}
                    {hasAnsweredCurrent && userAnswers[qIndex] === oIdx && oIdx !== currentQ.correctIndex && (
                      <span style={{ color: '#ef4444', display: 'grid', placeItems: 'center' }}>
                        <Icon n="x" size={18} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation reveals upon answer */}
            {hasAnsweredCurrent && (
              <div className="q-explain">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 4 }}>
                  <span>{isCorrect ? '✅ Correct!' : '❌ Not quite right'}</span>
                </div>
                <p style={{ margin: 0 }}>{currentQ.explanation}</p>
              </div>
            )}

            {/* Navigation buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              {hasAnsweredCurrent ? (
                qIndex + 1 < totalQuestions ? (
                  <button
                    className="btn pri"
                    onClick={() => setQIndex(qIndex + 1)}
                    style={{ padding: '10px 20px' }}
                  >
                    Next Question <Icon n="arrow" size={16} />
                  </button>
                ) : (
                  <button
                    className="btn pri"
                    onClick={finishQuiz}
                    style={{ padding: '10px 20px', background: '#10b981', borderColor: '#10b981' }}
                  >
                    View Quiz Results 🎉
                  </button>
                )
              ) : (
                <small style={{ color: 'var(--muted)' }}>Select an option to view explanation and proceed</small>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: QUIZ RESULTS / SUMMARY */}
      {view === 'summary' && activeQuiz && (
        <div className="quiz-container">
          <div className="card q-card" style={{ textAlign: 'center' }}>
            <div className="q-score-circle">{percentage}%</div>
            <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800 }}>
              {percentage >= 80 ? '🎉 Excellent Work!' : percentage >= 60 ? '👍 Good Job!' : '📚 Keep Reviewing!'}
            </h2>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: 15 }}>
              You answered <b>{totalCorrect}</b> out of <b>{totalQuestions}</b> questions correctly on{' '}
              <i>{activeQuiz.title}</i>.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 14 }}>
              <button className="btn pri" onClick={() => startQuiz(activeQuiz)}>
                Retake Quiz
              </button>
              <button className="btn out" onClick={() => setView('create')}>
                Create Another Quiz
              </button>
              <button className="btn" onClick={() => setView('list')}>
                All Quizzes
              </button>
            </div>
          </div>

          {/* Full review accordion */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 18, margin: '0 0 14px' }}>Review Questions & Explanations:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeQuiz.questions?.map((q, idx) => {
                const isUserCorrect = userAnswers[idx] === q.correctIndex;
                return (
                  <div key={idx} className="card" style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span
                        style={{
                          background: isUserCorrect ? '#ecfdf5' : '#fef2f2',
                          color: isUserCorrect ? '#065f46' : '#991b1b',
                          borderRadius: '50%',
                          width: 24,
                          height: 24,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <b style={{ display: 'block', fontSize: 15, marginBottom: 8 }}>{q.question}</b>
                        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
                          <span>Your answer: </span>
                          <span style={{ fontWeight: 600, color: isUserCorrect ? '#10b981' : '#ef4444' }}>
                            {q.options[userAnswers[idx]] || 'None'}
                          </span>
                          {!isUserCorrect && (
                            <span style={{ marginLeft: 12, color: '#10b981' }}>
                              Correct: <b>{q.options[q.correctIndex]}</b>
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            background: 'var(--bg)',
                            padding: '8px 12px',
                            borderRadius: 8,
                            lineHeight: 1.4,
                          }}
                        >
                          💡 <b>Explanation:</b> {q.explanation}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: QUIZZES LIBRARY LIST */}
      {view === 'list' && (
        <>
          {/* Header Card matching Screen 5 in mockup */}
          <div className="quiz-hero-card">
            <div className="quiz-hero-icon">
              <Icon n="check" size={24} />
            </div>
            <div className="quiz-hero-body">
              <h2>Practice Quiz</h2>
              <p>Test your knowledge with AI-generated quizzes.</p>
            </div>
          </div>

          {/* Quiz Preview Card matching Screen 5 */}
          <div className="card quiz-preview-card">
            <div className="quiz-preview-stats">
              <div className="quiz-preview-stat-left">
                <b>{quizzes?.[0]?.total || 10}</b>
                <span>Questions</span>
              </div>
              <div className="quiz-preview-stat-right">
                <Icon n="clock" size={16} />
                <span>~ 10 min</span>
              </div>
            </div>

            <button
              className="btn pri"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '13px 18px',
                fontSize: 15,
                fontWeight: 700,
                borderRadius: 12,
              }}
              onClick={() => {
                if (quizzes && quizzes.length > 0) {
                  loadAndStartQuiz(quizzes[0].id);
                } else {
                  setView('create');
                }
              }}
            >
              Start Quiz <Icon n="arrow" size={16} />
            </button>
          </div>

          {/* Quiz Features Section matching Screen 5 */}
          <div className="quiz-features-section">
            <div className="quiz-features-title">Quiz Features:</div>
            <div className="quiz-features-list">
              <div className="quiz-feature-item">
                <Icon n="check" size={16} />
                <span>Adaptive difficulty</span>
              </div>
              <div className="quiz-feature-item">
                <Icon n="check" size={16} />
                <span>Instant feedback</span>
              </div>
              <div className="quiz-feature-item">
                <Icon n="check" size={16} />
                <span>Detailed explanations</span>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--line)', margin: '24px 0 20px' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 17, margin: 0, fontWeight: 700 }}>Your Practice Tests</h3>
            <button className="btn out" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => setView('create')}>
              <Icon n="plus" size={14} /> New Quiz
            </button>
          </div>
          {quizzes === null ? (
            <div className="card empty">Loading your quizzes…</div>
          ) : quizzes.length === 0 ? (
            <div className="card empty" style={{ padding: '40px 20px' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--tint)', color: 'var(--brand)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
                <Icon n="quiz" size={24} />
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>No Quizzes Generated Yet</h2>
              <p style={{ margin: '0 0 18px', color: 'var(--muted)', maxWidth: 440 }}>
                Upload your study notes or select a PDF to generate customized practice tests with instant answers and explanations.
              </p>
              <button className="btn pri" onClick={() => setView('create')}>
                <Icon n="plus" size={16} /> Generate Your First Quiz
              </button>
            </div>
          ) : (
            <div className="quiz-grid">
              {quizzes.map((q) => (
                <div key={q.id} className="card quiz-item">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: 'var(--tint)',
                        color: 'var(--brand)',
                        fontWeight: 700,
                      }}
                    >
                      {q.total} Questions
                    </span>
                    {q.score !== null && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: q.score / q.total >= 0.8 ? '#10b981' : 'var(--brand)',
                        }}
                      >
                        Best: {Math.round((q.score / q.total) * 100)}% ({q.score}/{q.total})
                      </span>
                    )}
                  </div>

                  <b style={{ fontSize: 16, lineHeight: 1.4, margin: '4px 0' }}>{q.title}</b>

                  <small style={{ color: 'var(--muted)', fontSize: 12 }}>
                    Created on {new Date(q.createdAt).toLocaleDateString()}
                  </small>

                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 10 }}>
                    <button
                      className="btn pri"
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => loadAndStartQuiz(q.id)}
                    >
                      <Icon n="play" size={14} /> {q.score !== null ? 'Retake' : 'Start Quiz'}
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => deleteQuiz(q.id, q.title)}
                      aria-label="Delete quiz"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
