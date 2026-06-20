import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, addDoc } from 'firebase/firestore';

import { 
  Users, Award, Sliders, CheckSquare, MessageSquare, 
  Activity, Sparkles, Plus, Search, ChevronRight, User, 
  AlertCircle, Clock, ShieldAlert, X, Database, Send,
  Briefcase, Compass, LogIn, Target, Rocket, Brain, BarChart2, Zap
} from 'lucide-react';

const defaultAppId = 'schoolhub-production-core';
let app, auth, db, appId;
let isFirebaseConfigured = false;

try {
  appId = typeof __app_id !== 'undefined' ? __app_id : defaultAppId;
  
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    const firebaseConfig = JSON.parse(__firebase_config);
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseConfigured = true;
  }
} catch (e) {
  console.error("Firebase Init Failed:", e);
}

const TEST_QUESTIONS = [
  {
    id: 1, question: "새로운 동아리 활동을 기획할 때, 당신이 가장 먼저 하는 일은?",
    options: [
      { text: "아무도 시도하지 않은 독특하고 창의적인 아이디어를 떠올린다.", type: "아이디어 뱅크" },
      { text: "목표 달성을 위한 세부 일정표와 체크리스트부터 작성한다.", type: "치밀한 계획가" },
      { text: "당장 실행할 수 있는 것부터 찾아서 즉시 행동으로 옮긴다.", type: "열정적 실천가" },
      { text: "역할을 분담하고 최종 결과물이 어떻게 보여질지 밑그림을 그린다.", type: "아웃풋 전문가" }
    ]
  },
  {
    id: 2, question: "팀 프로젝트 중 문제가 발생해 일정이 지연될 위기입니다. 당신의 대처는?",
    options: [
      { text: "문제 상황을 우회할 수 있는 새로운 대안이나 방향을 제시한다.", type: "아이디어 뱅크" },
      { text: "스케줄을 즉각 재조정하여 다른 파트에 피해가 없도록 조율한다.", type: "치밀한 계획가" },
      { text: "내가 대신 빠르게 처리하거나 팀원들과 함께 밤을 새워서라도 끝낸다.", type: "열정적 실천가" },
      { text: "최종 발표 형식이나 내용을 수정하여 유연하고 매끄럽게 넘어간다.", type: "아웃풋 전문가" }
    ]
  },
  {
    id: 3, question: "동아리 활동을 하면서 가장 보람을 느끼는 순간은 언제인가요?",
    options: [
      { text: "내 머릿속에서 나온 획기적인 기획이 팀의 핵심 주제가 되었을 때", type: "아이디어 뱅크" },
      { text: "초기에 세운 계획대로 한 치의 오차 없이 모든 일정이 완벽히 끝났을 때", type: "치밀한 계획가" },
      { text: "직접 결과물을 만들고 눈앞에서 작동하거나 완성된 모습을 볼 때", type: "열정적 실천가" },
      { text: "선생님과 친구들 앞에서 우리 팀의 성과를 멋지게 발표해 박수를 받을 때", type: "아웃풋 전문가" }
    ]
  },
  {
    id: 4, question: "팀원들 사이에 의견 충돌이 발생했습니다. 당신은 어떻게 해결하나요?",
    options: [
      { text: "유쾌한 분위기를 만들며 양쪽 모두가 만족할 '제3의 대안'을 던진다.", type: "아이디어 뱅크" },
      { text: "서로의 주장에 대한 장단점을 논리적이고 객관적으로 분석해준다.", type: "치밀한 계획가" },
      { text: "감정 소비를 멈추고 당장 해야 할 과업으로 시선을 돌리게 설득한다.", type: "열정적 실천가" },
      { text: "양측의 입장을 경청하고 다독이며 최종 목표를 상기시켜 화합을 돕는다.", type: "아웃풋 전문가" }
    ]
  },
  {
    id: 5, question: "만약 당신이 동아리장이라면, 어떤 팀원을 가장 먼저 뽑고 싶나요?",
    options: [
      { text: "엉뚱하더라도 기발한 아이디어가 넘치고 영감을 주는 친구", type: "아이디어 뱅크" },
      { text: "시간 약속을 철저히 지키고 꼼꼼하게 문서 정리를 잘하는 친구", type: "치밀한 계획가" },
      { text: "뛰어난 기술력(코딩, 디자인 등)과 추진력을 갖춘 실무형 친구", type: "열정적 실천가" },
      { text: "말솜씨가 좋고 발표 자료를 감각적이고 설득력 있게 만드는 친구", type: "아웃풋 전문가" }
    ]
  }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [myProfile, setMyProfile] = useState(null);
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [messages, setMessages] = useState([]);

  const [currentTab, setCurrentTab] = useState('home'); 
  const [selectedProjectId, setSelectedProjectId] = useState(null); 
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('info'); 
  const [roleMode, setRoleMode] = useState('student'); 

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProj, setNewProj] = useState({ title: '', category: 'IT/SW', desc: '', skills: [], styles: [] });
  const [chatInput, setChatInput] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const [activeApplyModalProjId, setActiveApplyModalProjId] = useState(null);
  const [applyMessage, setApplyMessage] = useState('');

  const [onboardData, setOnboardData] = useState({ step: 1, name: '', grade: '1학년', class: '1반', skills: [] });
  const [testData, setTestData] = useState({ step: 1, answers: {} });

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);
  
  const chatBottomRef = useRef(null);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getCollectionPath = (colName) => `artifacts/${appId}/public/data/${colName}`;

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsInitializing(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setUserId(u.uid);
      } else {
        setUser(null);
        setUserId(null);
      }
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !user || !db) {
      if(user) setIsInitializing(false);
      return;
    }

    const unsubProfile = onSnapshot(doc(db, getCollectionPath('profiles'), user.uid), snap => {
      if (snap.exists()) {
        setMyProfile(snap.data());
      } else {
        setMyProfile(null);
      }
      setIsInitializing(false);
    }, err => console.error("Profile sync error:", err));

    const unsubProfiles = onSnapshot(collection(db, getCollectionPath('profiles')), snap => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.error(err));

    const unsubProjects = onSnapshot(collection(db, getCollectionPath('projects')), snap => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.error(err));

    const unsubMessages = onSnapshot(collection(db, getCollectionPath('messages')), snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      setMessages(list);
    }, err => console.error(err));

    return () => { unsubProfile(); unsubProfiles(); unsubProjects(); unsubMessages(); };
  }, [user]);

  useEffect(() => {
    if (chatBottomRef.current) chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedProjectId, activeWorkspaceTab]);

  const handleCompleteOnboarding = async (finalStyle) => {
    if (!isFirebaseConfigured || !db) return triggerToast("클라우드 연결 오류로 프로필을 저장할 수 없습니다.");
    
    const profileData = {
      uid: userId,
      name: onboardData.name,
      grade: onboardData.grade,
      class: onboardData.class,
      skills: onboardData.skills,
      style: finalStyle,
      desc: `${onboardData.grade} ${onboardData.class} 학생`,
      updatedAt: Date.now()
    };

    try {
      await setDoc(doc(db, getCollectionPath('profiles'), userId), profileData);
      triggerToast("가입 완료! 학교 인재 풀에 등록되었습니다.");
    } catch (e) {
      console.error("Save Profile Error:", e);
      triggerToast("저장 중 오류가 발생했습니다.");
    }
  };

  const handleAnswerSelect = (questionId, selectedType) => {
    const newAnswers = { ...testData.answers, [questionId]: selectedType };
    
    if (testData.step < 5) {
      setTestData({ step: testData.step + 1, answers: newAnswers });
    } else {
      const counts = {};
      Object.values(newAnswers).forEach(type => {
        counts[type] = (counts[type] || 0) + 1;
      });
      let finalStyle = '아이디어 뱅크';
      let maxCount = 0;
      Object.entries(counts).forEach(([type, count]) => {
        if (count > maxCount) {
          maxCount = count;
          finalStyle = type;
        }
      });
      
      handleCompleteOnboarding(finalStyle);
    }
  };

  const handleCreateProject = async () => {
    if (!newProj.title.trim() || !newProj.desc.trim()) return triggerToast("명칭과 세부 계획을 모두 작성해주세요.");
    if (!isFirebaseConfigured || !db) return triggerToast("클라우드 연결 오류");

    const projId = `proj-${Date.now()}`;
    const projectData = {
      id: projId,
      title: newProj.title,
      leaderId: userId,
      leaderName: `${myProfile?.name} (${myProfile?.grade})`,
      category: newProj.category,
      desc: newProj.desc,
      reqSkills: newProj.skills.length ? newProj.skills : ['열정'],
      reqStyles: newProj.styles.length ? newProj.styles : ['무관'],
      status: '승인 대기중',
      approved: false,
      members: [userId],
      memberNames: [myProfile?.name],
      applicants: [],
      tasks: []
    };

    try {
      await setDoc(doc(db, getCollectionPath('projects'), projId), projectData);
      setShowCreateModal(false);
      setNewProj({ title: '', category: 'IT/SW', desc: '', skills: [], styles: [] });
      triggerToast("새로운 동아리 개설이 신청되었습니다. (교사 승인 대기)");
    } catch (e) {
      console.error(e);
      triggerToast("개설 중 오류가 발생했습니다.");
    }
  };

  const handleOpenApplyModal = (projId) => {
    setActiveApplyModalProjId(projId);
    setApplyMessage('');
  };

  const handleApplyToProject = async () => {
    if (!applyMessage.trim()) return triggerToast("지원 동기와 포부를 작성해주세요.");
    const proj = projects.find(p => p.id === activeApplyModalProjId);
    if (!proj) return;
    
    if ((proj.members || []).includes(userId) || (proj.applicants || []).some(a => a.uid === userId)) {
      setActiveApplyModalProjId(null);
      return triggerToast("이미 참여 중이거나 지원 결과를 기다리는 중입니다.");
    }

    const updatedProj = {
      ...proj,
      applicants: [...(proj.applicants || []), {
        uid: userId,
        name: myProfile?.name || "학생",
        style: myProfile?.style || "미정",
        message: applyMessage,
        status: 'pending'
      }]
    };

    try {
      await setDoc(doc(db, getCollectionPath('projects'), proj.id), updatedProj);
      setActiveApplyModalProjId(null);
      setApplyMessage('');
      triggerToast("동아리장에게 지원서가 전달되었습니다!");
    } catch (e) {
      console.error(e);
      triggerToast("지원 중 오류가 발생했습니다.");
    }
  };

  const handleDecisionApplicant = async (projId, applicantUid, isAccepted) => {
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;

    let newMembers = [...(proj.members || [])];
    let newMemberNames = [...(proj.memberNames || [])];

    if (isAccepted && !newMembers.includes(applicantUid)) {
      newMembers.push(applicantUid);
      const applicantProfile = students.find(s => s.uid === applicantUid);
      newMemberNames.push(applicantProfile?.name || "신규 부원");
    }

    const updatedProj = {
      ...proj,
      members: newMembers,
      memberNames: newMemberNames,
      applicants: (proj.applicants || []).filter(a => a.uid !== applicantUid)
    };

    try {
      await setDoc(doc(db, getCollectionPath('projects'), proj.id), updatedProj);
      triggerToast(isAccepted ? "새로운 동아리 부원을 환영해주세요!" : "지원서를 정중히 거절했습니다.");
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    const proj = projects.find(p => p.id === selectedProjectId);
    if (!proj) return;

    const updatedProj = {
      ...proj,
      tasks: [...(proj.tasks || []), { id: `task-${Date.now()}`, title: newTaskTitle, completed: false, assignee: myProfile?.name || "부원" }]
    };

    try {
      await setDoc(doc(db, getCollectionPath('projects'), proj.id), updatedProj);
      setNewTaskTitle('');
    } catch (e) { console.error(e); }
  };

  const handleToggleTask = async (taskId) => {
    const proj = projects.find(p => p.id === selectedProjectId);
    if (!proj) return;

    const updatedProj = {
      ...proj,
      tasks: (proj.tasks || []).map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
    };

    try {
      await setDoc(doc(db, getCollectionPath('projects'), proj.id), updatedProj);
    } catch (e) { console.error(e); }
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedProjectId) return;
    
    const msgData = {
      projectId: selectedProjectId,
      senderId: userId,
      senderName: myProfile?.name,
      text: chatInput,
      timestamp: Date.now()
    };

    try {
      await addDoc(collection(db, getCollectionPath('messages')), msgData);
      setChatInput('');
    } catch (e) { console.error(e); }
  };

  const handleToggleProjectApproval = async (projId, currentStatus) => {
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;
    
    const updatedProj = {
      ...proj,
      approved: !currentStatus,
      status: !currentStatus ? '모집중' : '승인 대기중'
    };

    try {
      await setDoc(doc(db, getCollectionPath('projects'), proj.id), updatedProj);
      triggerToast(!currentStatus ? "동아리가 승인되었습니다." : "동아리 활동 승인이 취소되었습니다.");
    } catch (e) { console.error(e); }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center font-mono">
        <Database className="w-16 h-16 text-[#0F172A] animate-bounce mb-4" />
        <h1 className="text-2xl font-black uppercase text-[#0F172A]">Cloud Syncing...</h1>
        <p className="text-slate-500 font-bold mt-2">서버와 연결 중입니다.</p>
      </div>
    );
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 flex justify-center items-center font-mono">
        <div className="bg-white border-4 border-[#0F172A] p-8 max-w-lg w-full shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] text-center">
          <ShieldAlert className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-black uppercase text-red-600 mb-2">DB 연결 실패</h2>
          <p className="font-bold text-slate-700 mb-6">데이터 공유 및 저장을 위해 Firebase 설정이 필수적입니다. 시스템 관리자에게 문의하세요.</p>
        </div>
      </div>
    );
  }

  if (user && !myProfile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-mono text-[#0F172A] flex flex-col justify-center items-center p-6 border-t-8 border-[#0F172A]">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-black uppercase tracking-tighter flex justify-center items-center gap-3">
              <Database className="w-10 h-10 text-[#38BDF8]" /> SCHOOLHUB
            </h1>
            <p className="font-bold text-slate-500 mt-2">교내 자율 동아리 플랫폼에 오신 것을 환영합니다.</p>
          </div>

          <div className="bg-white border-4 border-[#0F172A] p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] transition-all">
            {onboardData.step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="border-b-4 border-[#0F172A] pb-4">
                  <span className="bg-[#0F172A] text-white px-3 py-1 font-black text-sm uppercase">STEP 1</span>
                  <h2 className="text-2xl font-black mt-3">기본 정보 입력</h2>
                  <p className="text-sm font-bold text-slate-500 mt-1">학적 증명을 위해 정확한 정보를 입력해주세요.</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase mb-1">이름 (실명)</label>
                    <input type="text" placeholder="예: 홍길동" value={onboardData.name} onChange={e => setOnboardData({...onboardData, name: e.target.value})} className="w-full border-4 border-[#0F172A] p-4 font-bold focus:outline-none focus:bg-slate-50 transition-colors text-lg" />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-black uppercase mb-1">학년</label>
                      <select value={onboardData.grade} onChange={e => setOnboardData({...onboardData, grade: e.target.value})} className="w-full border-4 border-[#0F172A] p-4 font-bold focus:outline-none bg-white cursor-pointer">
                        <option>1학년</option><option>2학년</option><option>3학년</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-black uppercase mb-1">반</label>
                      <select value={onboardData.class} onChange={e => setOnboardData({...onboardData, class: e.target.value})} className="w-full border-4 border-[#0F172A] p-4 font-bold focus:outline-none bg-white cursor-pointer">
                        {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={`${n}반`}>{n}반</option>)}
                      </select>
                    </div>
                  </div>
                  <button onClick={() => setOnboardData({...onboardData, step: 2})} disabled={!onboardData.name.trim()} className="w-full bg-[#38BDF8] border-4 border-[#0F172A] text-[#0F172A] p-4 font-black uppercase text-lg mt-4 hover:bg-[#0EA5E9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                    다음으로 넘어가기 <ChevronRight className="inline w-6 h-6" />
                  </button>
                </div>
              </div>
            )}

            {onboardData.step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="border-b-4 border-[#0F172A] pb-4">
                  <span className="bg-[#0F172A] text-white px-3 py-1 font-black text-sm uppercase">STEP 2</span>
                  <h2 className="text-2xl font-black mt-3">관심 분야 및 강점 선택</h2>
                  <p className="text-sm font-bold text-slate-500 mt-1">동아리에서 활약할 수 있는 관심 분야와 본인의 능력을 선택해주세요. (다중 선택 가능)</p>
                </div>

                <div className="flex flex-wrap gap-3 py-4">
                  {['코딩/개발', 'UI/UX 디자인', '기획/아이디어', '자료 조사/분석', 'PPT 제작', '발표/스피치', '영상 편집', '리더십', '문서 작성', '외국어', '예술/창작', '자원봉사'].map(sk => {
                    const isSelected = onboardData.skills.includes(sk);
                    return (
                      <button 
                        key={sk} 
                        onClick={() => setOnboardData({ ...onboardData, skills: isSelected ? onboardData.skills.filter(s => s !== sk) : [...onboardData.skills, sk] })}
                        className={`px-4 py-3 border-4 font-black text-sm transition-all hover:-translate-y-1 ${isSelected ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-[4px_4px_0px_0px_rgba(56,189,248,1)]' : 'bg-white border-[#CBD5E1] text-slate-600 shadow-[2px_2px_0px_0px_rgba(203,213,225,1)] hover:border-[#0F172A]'}`}
                      >
                        {sk}
                      </button>
                    )
                  })}
                </div>

                <div className="flex gap-4 mt-8">
                  <button onClick={() => setOnboardData({...onboardData, step: 1})} className="w-1/3 border-4 border-[#0F172A] bg-white font-black p-4 uppercase hover:bg-slate-100 transition-colors shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">이전</button>
                  <button onClick={() => setOnboardData({...onboardData, step: 3})} className="w-2/3 bg-[#38BDF8] border-4 border-[#0F172A] text-[#0F172A] p-4 font-black uppercase hover:bg-[#0EA5E9] transition-colors shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                    성향 검사 시작하기 <ChevronRight className="inline w-6 h-6" />
                  </button>
                </div>
              </div>
            )}

            {onboardData.step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                <div className="flex justify-between items-center border-b-4 border-[#0F172A] pb-4">
                  <span className="bg-[#38BDF8] text-[#0F172A] border-2 border-[#0F172A] px-3 py-1 font-black text-sm uppercase">협업 성향 분석</span>
                  <span className="font-black text-slate-400 text-lg">{testData.step} / 5</span>
                </div>
                
                <div className="py-4">
                  <h3 className="text-xl font-black mb-8 leading-relaxed">
                    Q{testData.step}. {TEST_QUESTIONS[testData.step - 1].question}
                  </h3>
                  <div className="space-y-4">
                    {TEST_QUESTIONS[testData.step - 1].options.map((opt, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleAnswerSelect(TEST_QUESTIONS[testData.step - 1].id, opt.type)}
                        className="w-full text-left p-5 bg-white border-4 border-[#CBD5E1] hover:border-[#0F172A] hover:bg-[#F8FAFC] transition-all font-bold text-slate-700 hover:text-[#0F172A] hover:-translate-y-1 shadow-[2px_2px_0px_0px_rgba(203,213,225,1)] hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]"
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const renderHome = () => {
    const filtered = projects.filter(p => 
      (categoryFilter === 'ALL' || p.category === categoryFilter) && 
      (p.title.includes(searchQuery) || p.desc.includes(searchQuery)) &&
      (p.approved || p.leaderId === userId)
    );
    return (
      <div className="space-y-8 animate-in fade-in">
        <div className="bg-[#0F172A] text-white border-4 border-[#0F172A] p-8 shadow-[8px_8px_0px_0px_rgba(56,189,248,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <Compass className="absolute -right-10 -top-10 w-48 h-48 text-white/5" />
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-20 h-20 bg-[#38BDF8] border-4 border-white flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <span className="text-3xl font-black text-[#0F172A]">{myProfile.name[0]}</span>
            </div>
            <div>
              <p className="text-[#38BDF8] font-black text-sm uppercase tracking-widest mb-1">환영합니다</p>
              <h2 className="text-3xl font-black">{myProfile.name} <span className="text-lg font-bold text-slate-400 ml-2">{myProfile.grade} {myProfile.class}</span></h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white text-[#0F172A] text-xs font-black uppercase border-2 border-white">{myProfile.style}</span>
                {myProfile.skills?.slice(0,2).map(sk => <span key={sk} className="px-3 py-1 bg-transparent border-2 border-[#334155] text-slate-300 text-xs font-bold">{sk}</span>)}
              </div>
            </div>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="w-full md:w-auto bg-[#38BDF8] text-[#0F172A] border-4 border-white px-8 py-4 font-black text-lg flex items-center justify-center gap-3 hover:bg-white transition-colors shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] relative z-10">
            <Plus className="w-6 h-6"/> 새 동아리 개설
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 bg-white border-4 border-[#0F172A] p-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
            <input type="text" placeholder="어떤 동아리를 찾고 있나요?" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-[#F8FAFC] border-2 border-[#CBD5E1] font-bold focus:outline-none focus:border-[#0F172A] text-lg transition-colors" />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full sm:w-48 bg-[#F8FAFC] border-2 border-[#CBD5E1] p-3 font-black uppercase focus:outline-none focus:border-[#0F172A] cursor-pointer text-center">
            <option value="ALL">모든 분야</option><option value="IT/SW">IT / SW</option><option value="예체능">예체능</option><option value="학술/연구">학술 / 연구</option><option value="봉사/기획">봉사 / 기획</option>
          </select>
        </div>

        <div>
          <h3 className="font-black text-2xl uppercase mb-6 flex items-center gap-3"><Briefcase className="w-8 h-8 text-[#38BDF8]" /> 모집 중인 동아리</h3>
          {filtered.length === 0 ? (
            <div className="bg-white border-4 border-dashed border-[#CBD5E1] p-12 text-center">
              <p className="text-xl font-bold text-slate-400">조건에 맞는 동아리가 없습니다.<br/>직접 첫 동아리를 개설해 리더가 되어보세요!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map(proj => {
                const isMember = (proj.members || []).includes(userId);
                const hasApplied = (proj.applicants || []).some(a => a.uid === userId);
                
                return (
                  <div key={proj.id} className="bg-white border-4 border-[#0F172A] flex flex-col shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(56,189,248,1)] transition-all duration-300">
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-black bg-[#0F172A] text-white px-3 py-1 uppercase tracking-wider">{proj.category}</span>
                        {!proj.approved ? (
                          <span className="text-xs font-black bg-slate-500 text-white px-3 py-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> 교사 승인 대기중</span>
                        ) : isMember ? (
                          <span className="text-xs font-black bg-[#16A34A] text-white px-3 py-1 flex items-center gap-1"><CheckSquare className="w-3 h-3"/> 참여 중</span>
                        ) : hasApplied ? (
                          <span className="text-xs font-black bg-orange-500 text-white px-3 py-1 flex items-center gap-1"><Clock className="w-3 h-3"/> 심사 중</span>
                        ) : (
                          <span className="text-xs font-black bg-[#38BDF8] text-[#0F172A] border-2 border-[#0F172A] px-3 py-1">모집 중</span>
                        )}
                      </div>
                      <h3 className="font-black text-2xl mb-3 leading-tight line-clamp-2">{proj.title}</h3>
                      <p className="text-sm font-bold text-slate-500 line-clamp-3 mb-6 flex-1">{proj.desc}</p>
                      
                      <div className="space-y-3 border-t-4 border-[#F1F5F9] pt-4 mt-auto">
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <User className="w-4 h-4 text-slate-400" /> 개설자: {proj.leaderName}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <Users className="w-4 h-4 text-slate-400" /> 현재 부원: {(proj.members||[]).length}명
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t-4 border-[#0F172A] bg-[#F8FAFC]">
                      {isMember ? (
                        <button onClick={() => { setSelectedProjectId(proj.id); setActiveWorkspaceTab('chat'); }} className="w-full bg-[#0F172A] text-white p-4 font-black uppercase tracking-widest hover:bg-[#334155] transition-colors flex justify-center items-center gap-2">
                          워크스페이스 입장 <ChevronRight className="w-5 h-5"/>
                        </button>
                      ) : hasApplied ? (
                        <button disabled className="w-full bg-slate-200 text-slate-500 p-4 font-black uppercase tracking-widest cursor-not-allowed border-none">
                          결과 대기 중
                        </button>
                      ) : (
                        <div className="flex">
                          <button onClick={() => { setSelectedProjectId(proj.id); setActiveWorkspaceTab('info'); }} className="flex-1 bg-white text-[#0F172A] p-4 font-black uppercase border-r-4 border-[#0F172A] hover:bg-slate-100 transition-colors">
                            상세 보기
                          </button>
                          <button onClick={() => handleOpenApplyModal(proj.id)} className="flex-1 bg-[#38BDF8] text-[#0F172A] p-4 font-black uppercase hover:bg-[#0EA5E9] transition-colors flex justify-center items-center gap-2">
                            지원하기 <LogIn className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWorkspace = () => {
    const proj = projects.find(p => p.id === selectedProjectId);
    if (!proj) return null;
    const isLeader = proj.leaderId === userId;
    const isMember = (proj.members || []).includes(userId);

    return (
      <div className="h-[calc(100vh-140px)] flex flex-col bg-white border-4 border-[#0F172A] shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] animate-in slide-in-from-right-4">
        <div className="border-b-4 border-[#0F172A] bg-[#0F172A] text-white p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedProjectId(null)} className="p-2 bg-white/10 hover:bg-white/20 transition-colors border-2 border-transparent hover:border-white">
              <ChevronRight className="rotate-180 w-6 h-6 text-white"/>
            </button>
            <div>
              <span className="text-[10px] font-black bg-[#38BDF8] text-[#0F172A] px-2 py-0.5 uppercase tracking-widest mb-1 inline-block">{proj.category}</span>
              <h2 className="font-black text-2xl tracking-tight">{proj.title}</h2>
            </div>
          </div>
          <div className="flex gap-2 bg-white/5 p-1">
            {['info', 'chat', 'tasks', 'team'].map(tab => (
               (!isMember && tab !== 'info') ? null :
               <button 
                 key={tab} 
                 onClick={() => setActiveWorkspaceTab(tab)} 
                 className={`px-5 py-2 font-black text-sm uppercase transition-colors ${activeWorkspaceTab === tab ? 'bg-[#38BDF8] text-[#0F172A] shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
               >
                 {tab === 'info' ? '모집 정보' : tab === 'chat' ? '팀 채팅' : tab === 'tasks' ? '할 일' : '부원 관리'}
               </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] relative">
          
          {activeWorkspaceTab === 'info' && (
            <div className="p-8 max-w-4xl mx-auto space-y-10">
              <section className="bg-white border-4 border-[#0F172A] p-8 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <h3 className="font-black text-xl mb-4 border-b-4 border-[#F1F5F9] pb-2 flex items-center gap-2">
                  <Database className="w-6 h-6 text-[#38BDF8]" /> 동아리 소개 및 활동 목표
                </h3>
                <p className="font-bold text-slate-700 leading-relaxed whitespace-pre-wrap text-lg">{proj.desc}</p>
              </section>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="bg-white border-4 border-[#0F172A] p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <h4 className="font-black text-lg mb-4 flex items-center gap-2"><Award className="w-5 h-5"/> 우대하는 핵심 역량</h4>
                  <div className="flex flex-wrap gap-2">
                    {(proj.reqSkills||[]).map(s=><span key={s} className="font-black text-sm border-2 border-[#CBD5E1] bg-[#F1F5F9] text-slate-700 px-3 py-1.5">{s}</span>)}
                  </div>
                </section>
                <section className="bg-white border-4 border-[#0F172A] p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <h4 className="font-black text-lg mb-4 flex items-center gap-2"><Sliders className="w-5 h-5"/> 팀에 잘 맞는 성향</h4>
                  <div className="flex flex-wrap gap-2">
                    {(proj.reqStyles||[]).map(s=><span key={s} className="font-black text-sm bg-[#0F172A] text-white border-2 border-[#0F172A] px-3 py-1.5">{s}</span>)}
                  </div>
                </section>
              </div>

              {!isMember && (
                <div className="bg-[#E0F2FE] border-4 border-[#0369A1] p-8 text-center mt-12 shadow-[8px_8px_0px_0px_rgba(3,105,161,1)]">
                  <h3 className="font-black text-2xl text-[#0369A1] mb-2">이 동아리의 비전에 공감하시나요?</h3>
                  <p className="font-bold text-[#075985] mb-6">현재 열정적인 신규 부원을 모집하고 있습니다. 당신의 강점을 어필해보세요.</p>
                  <button onClick={() => handleOpenApplyModal(proj.id)} className="bg-[#0369A1] text-white border-4 border-[#0369A1] px-10 py-4 font-black uppercase text-xl hover:bg-white hover:text-[#0369A1] transition-colors">
                    동아리 지원서 작성하기
                  </button>
                </div>
              )}
            </div>
          )}
          
          {activeWorkspaceTab === 'chat' && isMember && (
             <div className="flex flex-col h-full absolute inset-0">
               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 {messages.filter(m => m.projectId === proj.id).map(msg => {
                   const isMine = msg.senderId === userId;
                   return (
                     <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                       <span className="text-[10px] font-black text-slate-500 mb-1">{msg.senderName}</span>
                       <div className={`px-5 py-3 font-bold text-sm max-w-[75%] border-2 ${isMine ? 'bg-[#38BDF8] border-[#0F172A] text-[#0F172A] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]' : 'bg-white border-[#CBD5E1] text-slate-700 shadow-[4px_4px_0px_0px_rgba(203,213,225,1)]'}`}>
                         {msg.text}
                       </div>
                     </div>
                   );
                 })}
                 <div ref={chatBottomRef}/>
               </div>
               <div className="p-4 bg-white border-t-4 border-[#0F172A]">
                 <div className="flex gap-3 max-w-4xl mx-auto">
                   <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyPress={e=>e.key==='Enter'&&handleSendMessage()} className="flex-1 border-4 border-[#0F172A] p-4 font-bold bg-[#F8FAFC] focus:outline-none focus:bg-white text-lg" placeholder="동아리 부원들과 메시지를 나누세요..." />
                   <button onClick={handleSendMessage} className="bg-[#0F172A] text-[#38BDF8] border-4 border-[#0F172A] px-8 font-black hover:bg-[#334155] transition-colors shadow-[4px_4px_0px_0px_rgba(56,189,248,1)]">
                     <Send className="w-6 h-6"/>
                   </button>
                 </div>
               </div>
             </div>
          )}

          {activeWorkspaceTab === 'tasks' && isMember && (
            <div className="p-8 max-w-3xl mx-auto h-full flex flex-col">
               <div className="flex gap-3 mb-8 bg-white p-4 border-4 border-[#0F172A] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                 <input type="text" value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} onKeyPress={e=>e.key==='Enter'&&handleCreateTask()} className="flex-1 border-2 border-[#CBD5E1] p-3 font-bold focus:outline-none focus:border-[#0F172A]" placeholder="새로운 과제나 일정을 등록하세요 (예: 1차 아이디어 회의록 작성)"/>
                 <button onClick={handleCreateTask} className="bg-[#0F172A] text-white font-black px-8 uppercase hover:bg-[#334155] transition-colors">등록</button>
               </div>
               
               <div className="space-y-4 flex-1 overflow-y-auto">
                 {!(proj.tasks||[]).length ? (
                   <div className="text-center py-12 border-4 border-dashed border-[#CBD5E1] bg-white">
                     <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                     <p className="font-bold text-slate-500">등록된 과제가 없습니다.</p>
                   </div>
                 ) : (
                   (proj.tasks||[]).map(t => (
                     <div key={t.id} className={`flex justify-between items-center border-4 p-4 transition-all hover:-translate-y-1 ${t.completed ? 'bg-[#F1F5F9] border-[#CBD5E1] shadow-[2px_2px_0px_0px_rgba(203,213,225,1)] opacity-70' : 'bg-white border-[#0F172A] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]'}`}>
                       <div className="flex gap-4 items-center">
                         <button onClick={()=>handleToggleTask(t.id)} className="focus:outline-none">
                           {t.completed ? <div className="w-7 h-7 bg-[#16A34A] flex items-center justify-center border-2 border-[#16A34A]"><CheckSquare className="text-white w-5 h-5"/></div> : <div className="w-7 h-7 border-4 border-[#0F172A] hover:bg-slate-100"></div>}
                         </button>
                         <span className={`font-black text-lg ${t.completed ? 'line-through text-slate-500' : 'text-[#0F172A]'}`}>{t.title}</span>
                       </div>
                       <span className="text-xs border-2 border-[#CBD5E1] bg-slate-50 px-3 py-1.5 font-black text-slate-600">{t.assignee}</span>
                     </div>
                   ))
                 )}
               </div>
            </div>
          )}

          {activeWorkspaceTab === 'team' && isMember && (
            <div className="p-8 max-w-4xl mx-auto space-y-12">
              <section>
                <h3 className="font-black text-2xl mb-6 border-l-8 border-[#38BDF8] pl-4">함께하는 동아리 부원</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(proj.memberNames||[]).map((name, i) => (
                    <div key={i} className="bg-white border-4 border-[#0F172A] p-5 font-black flex items-center gap-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                      <div className="w-12 h-12 bg-[#F1F5F9] border-2 border-[#0F172A] flex justify-center items-center text-xl">{name[0]}</div>
                      <div>
                        <div className="text-lg">{name}</div>
                        {proj.members[i] === proj.leaderId ? (
                          <span className="text-[10px] bg-[#38BDF8] border border-[#0F172A] px-2 py-0.5 uppercase tracking-wider">동아리장</span>
                        ) : (
                          <span className="text-[10px] bg-slate-200 border border-[#CBD5E1] text-slate-600 px-2 py-0.5 uppercase tracking-wider">일반 부원</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {isLeader && (
                <section>
                  <h3 className="font-black text-2xl mb-6 border-l-8 border-orange-500 pl-4 text-orange-600">신규 지원자 심사 대기열 <span className="bg-orange-500 text-white text-sm px-2 py-1 align-middle ml-2">{(proj.applicants||[]).length}건</span></h3>
                  
                  {!(proj.applicants||[]).length ? (
                     <div className="bg-white border-4 border-dashed border-[#CBD5E1] p-8 text-center font-bold text-slate-400">대기 중인 지원서가 없습니다.</div>
                  ) : (
                    <div className="space-y-6">
                      {(proj.applicants||[]).map(app => (
                        <div key={app.uid} className="bg-white border-4 border-[#0F172A] p-6 shadow-[6px_6px_0px_0px_rgba(249,115,22,1)]">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="font-black text-2xl">{app.name}</div>
                              <span className="text-xs bg-[#0F172A] text-white px-2 py-1 mt-1 inline-block font-bold">성향: {app.style}</span>
                            </div>
                          </div>
                          <div className="bg-slate-50 border-2 border-[#CBD5E1] p-4 mb-6 relative">
                            <span className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black text-slate-400 uppercase">지원 메시지</span>
                            <p className="font-bold text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{app.message}</p>
                          </div>
                          <div className="flex gap-4">
                            <button onClick={()=>handleDecisionApplicant(proj.id, app.uid, true)} className="flex-1 bg-[#16A34A] text-white border-4 border-[#16A34A] font-black text-lg py-3 hover:bg-white hover:text-[#16A34A] transition-colors">합격 및 수락</button>
                            <button onClick={()=>handleDecisionApplicant(proj.id, app.uid, false)} className="flex-1 bg-white border-4 border-[#0F172A] text-[#0F172A] font-black text-lg py-3 hover:bg-slate-100 transition-colors">불합격 처리</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {isLeader && (
                <section className="pt-8 border-t-4 border-dashed border-[#CBD5E1]">
                  <h3 className="font-black text-2xl mb-6 border-l-8 border-indigo-500 pl-4 text-indigo-600 flex items-center gap-2">
                    <Sparkles className="w-6 h-6" /> 시스템 추천: AI 맞춤형 인재
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {students
                      .filter(s => !(proj.members||[]).includes(s.uid) && !(proj.applicants||[]).some(a=>a.uid===s.uid))
                      .map(s => {
                        let score = 50; 
                        if ((proj.reqStyles||[]).includes(s.style)) score += 20; 
                        const matchingSkills = (s.skills||[]).filter(skill => (proj.reqSkills||[]).includes(skill));
                        score += (matchingSkills.length * 15); 
                        return { ...s, matchScore: Math.min(score, 99) }; 
                      })
                      .sort((a,b) => b.matchScore - a.matchScore)
                      .slice(0,3) 
                      .map((s, i) => (
                        <div key={i} className="bg-white border-4 border-[#0F172A] p-5 relative shadow-[4px_4px_0px_0px_rgba(99,102,241,1)]">
                          <div className="absolute -top-4 -right-4 bg-indigo-500 text-white font-black w-12 h-12 flex items-center justify-center rounded-full border-4 border-[#0F172A] shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                            {s.matchScore}%
                          </div>
                          <h4 className="font-black text-lg mb-1">{s.name}</h4>
                          <span className="text-[10px] bg-[#0F172A] text-white px-2 py-0.5 font-bold uppercase mb-2 inline-block">{s.style}</span>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(s.skills||[]).slice(0,3).map(sk=><span key={sk} className="text-[9px] font-bold border-2 border-[#CBD5E1] bg-slate-50 px-1.5 py-0.5 text-slate-600">{sk}</span>)}
                          </div>
                        </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTeacherDashboard = () => {
    return (
      <div className="space-y-8 animate-in fade-in">
         <div className="bg-orange-500 text-white p-8 border-4 border-[#0F172A] shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
           <div>
             <h2 className="text-3xl font-black uppercase mb-2 flex items-center gap-3"><ShieldAlert className="w-8 h-8"/> 교사용 관리 대시보드</h2>
             <p className="font-bold text-orange-100">학생들이 개설한 동아리 및 프로젝트를 모니터링하고 활동을 승인합니다.</p>
           </div>
           <div className="bg-[#0F172A] p-4 text-center border-2 border-white">
             <div className="text-xs font-black uppercase text-orange-300">총 개설 신청</div>
             <div className="text-3xl font-black">{projects.length}건</div>
           </div>
         </div>
         
         <div className="grid grid-cols-1 gap-6">
          {projects.map(proj => (
            <div key={proj.id} className={`bg-white border-4 border-[#0F172A] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] ${!proj.approved ? 'bg-orange-50 border-orange-500' : ''}`}>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-black bg-[#0F172A] text-white px-3 py-1 uppercase">{proj.category}</span>
                  <span className={`text-xs font-black px-3 py-1 border-2 ${proj.approved ? 'bg-[#16A34A] text-white border-[#16A34A]' : 'bg-orange-500 text-white border-orange-500'}`}>
                    {proj.approved ? '활동 승인됨' : '승인 대기중'}
                  </span>
                </div>
                <h3 className="font-black text-2xl mb-2">{proj.title}</h3>
                <p className="text-sm font-bold text-slate-600 mb-2">{proj.desc}</p>
                <div className="text-xs font-bold text-slate-500 flex gap-4 mt-4 bg-white p-2 border-2 border-[#CBD5E1] inline-flex">
                  <span><User className="w-3 h-3 inline"/> 대표 학생: {proj.leaderName}</span>
                  <span><Users className="w-3 h-3 inline"/> 참여 부원: {(proj.members||[]).length}명</span>
                </div>
              </div>
              
              <div className="w-full md:w-auto">
                <button 
                  onClick={() => handleToggleProjectApproval(proj.id, proj.approved)} 
                  className={`w-full md:w-48 py-4 font-black uppercase border-4 border-[#0F172A] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-transform hover:-translate-y-1 ${proj.approved ? 'bg-white text-[#0F172A] hover:bg-slate-100' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                >
                  {proj.approved ? '활동 중지 (승인 취소)' : '동아리 활동 승인'}
                </button>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
             <div className="bg-white border-4 border-dashed border-[#CBD5E1] p-12 text-center text-slate-400 font-bold text-lg">
               현재 개설된 동아리가 없습니다.
             </div>
          )}
        </div>
      </div>
    );
  };

  const renderPortfolio = () => {
    const myProjects = projects.filter(p => (p.members || []).includes(userId));
    return (
      <div className="space-y-8 animate-in fade-in">
         <div className="bg-[#16A34A] text-white p-8 border-4 border-[#0F172A] shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
           <h2 className="text-3xl font-black uppercase mb-2 flex items-center gap-3"><Award className="w-8 h-8"/> 내 활동 포트폴리오</h2>
           <p className="font-bold text-green-100">그동안 학교에서 참여한 활동 내역과 강점을 한 곳에서 관리합니다.</p>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="md:col-span-1 space-y-6">
             <div className="bg-white border-4 border-[#0F172A] p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
               <div className="w-24 h-24 bg-[#38BDF8] border-4 border-[#0F172A] mx-auto mb-4 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                 <span className="text-5xl font-black text-[#0F172A]">{myProfile.name[0]}</span>
               </div>
               <h3 className="text-center font-black text-2xl mb-1">{myProfile.name}</h3>
               <p className="text-center font-bold text-slate-500 mb-6">{myProfile.grade} {myProfile.class}</p>
               
               <div className="space-y-5 pt-5 border-t-4 border-dashed border-[#CBD5E1]">
                 <div>
                   <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 mb-2"><Activity className="w-3 h-3"/>나의 협업 성향</span>
                   <div className="font-black bg-[#0F172A] text-white px-3 py-2 inline-block border-2 border-[#0F172A]">{myProfile.style}</div>
                 </div>
                 <div>
                   <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 mb-2"><Sparkles className="w-3 h-3"/>관심 분야 및 강점</span>
                   <div className="flex flex-wrap gap-2">
                     {(myProfile.skills||[]).map(sk=><span key={sk} className="font-bold border-2 border-[#CBD5E1] bg-slate-50 px-2 py-1 text-xs text-slate-700">{sk}</span>)}
                   </div>
                 </div>
               </div>
             </div>
           </div>
           
           <div className="md:col-span-2 space-y-6">
             <h3 className="font-black text-2xl flex items-center gap-2 border-b-4 border-[#0F172A] pb-4"><Briefcase className="w-6 h-6 text-[#16A34A]" /> 참여 프로젝트 기록 ({myProjects.length}건)</h3>
             {myProjects.length === 0 ? (
               <div className="bg-white border-4 border-dashed border-[#CBD5E1] p-12 text-center text-slate-400 font-bold">
                 아직 참여한 활동이 없습니다.<br/>대시보드에서 나와 맞는 동아리를 찾아 지원해보세요!
               </div>
             ) : (
               <div className="space-y-4">
                 {myProjects.map(proj => (
                   <div key={proj.id} className="bg-white border-4 border-[#0F172A] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-1 transition-transform">
                     <div className="flex-1">
                       <div className="text-xs font-black bg-[#16A34A] text-white px-2 py-1 inline-block mb-2 uppercase">{proj.category}</div>
                       <h4 className="font-black text-xl mb-2">{proj.title}</h4>
                       <div className="text-sm font-bold text-slate-500 flex flex-wrap items-center gap-4">
                         <span className="flex items-center gap-1"><User className="w-4 h-4"/> 개설자: {proj.leaderName}</span>
                         <span className="flex items-center gap-1"><Users className="w-4 h-4"/> 참여 부원: {(proj.members||[]).length}명</span>
                       </div>
                     </div>
                     <div className="bg-[#F1F5F9] border-2 border-[#CBD5E1] px-6 py-3 text-center min-w-[100px]">
                       <div className="text-[10px] font-black uppercase text-slate-500 mb-1">담당 역할</div>
                       <div className="font-black text-lg text-[#0F172A]">{proj.leaderId === userId ? '동아리장' : '일반 부원'}</div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
         </div>
      </div>
    );
  };

  const renderDiagnosis = () => {
    // Determine competency levels based on the student's collaboration style
    let creativity = 70, planning = 70, execution = 70, presentation = 70;
    let partnerStyle = "열정적 실천가";
    let growthTip = "세부적인 계획성 보완을 위해 트렐로나 노션 캘린더 같은 일정 도구를 사용해보세요.";

    if (myProfile.style === '아이디어 뱅크') {
      creativity = 95; planning = 55; execution = 65; presentation = 80;
      partnerStyle = "열정적 실천가";
      growthTip = "상상한 기획을 현실로 실현시키기 위해, 일정 준수율을 관리할 구체적 체크리스트를 작성해보는 것이 좋습니다.";
    } else if (myProfile.style === '치밀한 계획가') {
      creativity = 60; planning = 98; execution = 75; presentation = 65;
      partnerStyle = "아이디어 뱅크";
      growthTip = "체계적 분석력은 최고입니다! 다만, 예측 불가능한 돌발상황에서 유연한 대안을 포용하는 훈련이 필요합니다.";
    } else if (myProfile.style === '열정적 실천가') {
      creativity = 70; planning = 60; execution = 95; presentation = 70;
      partnerStyle = "치밀한 계획가";
      growthTip = "행동력은 팀 최고의 무기입니다. 실행 전 단계에서 목표 대비 현실성을 분석하는 리스크 점검 습관을 들여보세요.";
    } else if (myProfile.style === '아웃풋 전문가') {
      creativity = 80; planning = 70; execution = 70; presentation = 95;
      partnerStyle = "열정적 실천가";
      growthTip = "뛰어난 프레젠테이션과 자료 소화력을 가졌습니다. 과정에서 발생하는 중간 산출물들을 꼼꼼하게 아카이빙해보세요.";
    }

    // Interactive mock-analysis against existing clubs
    const matchedClubs = projects
      .filter(p => p.approved)
      .map(p => {
        let score = 55;
        if ((p.reqStyles || []).includes(myProfile.style)) score += 25;
        const intersection = (myProfile.skills || []).filter(sk => (p.reqSkills || []).includes(sk));
        score += (intersection.length * 10);
        return { ...p, matchScore: Math.min(score, 99) };
      })
      .sort((a,b) => b.matchScore - a.matchScore)
      .slice(0, 2);

    return (
      <div className="space-y-8 animate-in fade-in">
        <div className="bg-[#3B82F6] text-white p-8 border-4 border-[#0F172A] shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
          <h2 className="text-3xl font-black uppercase mb-2 flex items-center gap-3">
            <Brain className="w-8 h-8 text-white" /> AI 역량 매칭 진단
          </h2>
          <p className="font-bold text-blue-100">나의 협업 유형 분석과 추천 시너지를 실시간 알고리즘으로 도출한 정밀 리포트입니다.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Panel: Circular Progress SVG / Stat Analysis */}
          <div className="bg-white border-4 border-[#0F172A] p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] lg:col-span-1">
            <h3 className="font-black text-xl mb-6 flex items-center gap-2 border-b-4 border-slate-100 pb-2">
              <Zap className="w-5 h-5 text-yellow-500" /> 종합 협업 오각형
            </h3>
            <div className="flex flex-col items-center py-4">
              <div className="relative w-40 h-40 flex items-center justify-center bg-slate-50 border-4 border-dashed border-[#0F172A] rounded-full mb-6">
                <BarChart2 className="w-16 h-16 text-[#3B82F6] opacity-30 absolute" />
                <span className="text-xl font-black text-[#0F172A] z-10">{myProfile.style}</span>
              </div>
              
              <div className="w-full space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-black uppercase mb-1">
                    <span>창의성 (Creativity)</span>
                    <span>{creativity}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-4 border-2 border-[#0F172A]">
                    <div className="bg-yellow-400 h-full border-r-2 border-[#0F172A]" style={{ width: `${creativity}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-black uppercase mb-1">
                    <span>계획력 (Planning)</span>
                    <span>{planning}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-4 border-2 border-[#0F172A]">
                    <div className="bg-[#3B82F6] h-full border-r-2 border-[#0F172A]" style={{ width: `${planning}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-black uppercase mb-1">
                    <span>실행력 (Execution)</span>
                    <span>{execution}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-4 border-2 border-[#0F172A]">
                    <div className="bg-green-500 h-full border-r-2 border-[#0F172A]" style={{ width: `${execution}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-black uppercase mb-1">
                    <span>전달력 (Delivery)</span>
                    <span>{presentation}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-4 border-2 border-[#0F172A]">
                    <div className="bg-red-500 h-full border-r-2 border-[#0F172A]" style={{ width: `${presentation}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Matching Partner and Diagnostic feedback */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border-4 border-[#0F172A] p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
              <h3 className="font-black text-xl mb-4 border-b-4 border-slate-100 pb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" /> 환상의 시너지 파트너
              </h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="bg-indigo-50 p-4 border-4 border-indigo-500 text-center rounded-lg max-w-[150px] w-full">
                  <span className="block text-xs font-bold text-indigo-500 uppercase mb-1">추천 궁합</span>
                  <span className="text-lg font-black text-indigo-900">{partnerStyle}</span>
                </div>
                <p className="font-bold text-slate-700 leading-relaxed text-sm sm:text-base">
                  본인의 <span className="text-[#3B82F6] font-black">{myProfile.style}</span>적 성향과 가장 완벽한 대조 및 보완을 이루는 성향은 <span className="text-indigo-600 font-black">{partnerStyle}</span>입니다. 기획안이나 제품 빌딩 과정에서 이 성향의 부원과 한 조를 이룰 때, 시행착오를 최대 40% 이상 단축시킬 수 있습니다.
                </p>
              </div>
            </div>

            <div className="bg-white border-4 border-[#0F172A] p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
              <h3 className="font-black text-xl mb-4 border-b-4 border-slate-100 pb-2 flex items-center gap-2">
                <Target className="w-5 h-5 text-red-500" /> AI 역량 강화 솔루션
              </h3>
              <p className="font-bold text-slate-700 leading-relaxed text-sm sm:text-base mb-4">
                {growthTip}
              </p>
              <div className="bg-yellow-50 border-2 border-yellow-400 p-4 font-bold text-yellow-800 text-sm">
                💡 **팁:** '인재 디렉토리'에서 나에게 부족한 성향인 <b>[{partnerStyle}]</b>을(를) 검색하여 미리 대화하고, 다음 프로젝트 팀빌딩을 계획해보세요!
              </div>
            </div>

            <div className="bg-white border-4 border-[#0F172A] p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
              <h3 className="font-black text-xl mb-4 border-b-4 border-slate-100 pb-2 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-green-500" /> 실시간 맞춤 추천 자율 동아리
              </h3>
              {matchedClubs.length === 0 ? (
                <p className="text-slate-400 font-bold py-4">현재 분석 가능한 동아리가 개설되지 않았습니다.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {matchedClubs.map(c => (
                    <div key={c.id} className="border-4 border-[#0F172A] p-4 bg-slate-50 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 font-bold uppercase">{c.category}</span>
                          <span className="text-xs font-black text-red-500">매칭률 {c.matchScore}%</span>
                        </div>
                        <h4 className="font-black text-lg mb-1 truncate">{c.title}</h4>
                        <p className="text-xs font-bold text-slate-500 line-clamp-2 mb-4">{c.desc}</p>
                      </div>
                      <button onClick={() => { setSelectedProjectId(c.id); setActiveWorkspaceTab('info'); setCurrentTab('home'); }} className="w-full bg-[#0F172A] text-white p-2 text-xs font-black uppercase hover:bg-slate-800 transition-colors">
                        공고 보러가기
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-mono text-[#0F172A] flex flex-col border-t-8 border-[#0F172A]">
      
      <header className="bg-white border-b-4 border-[#0F172A] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div onClick={() => { setCurrentTab('home'); setSelectedProjectId(null); }} className="flex items-center gap-3 cursor-pointer group">
            <div className="bg-[#0F172A] p-2 group-hover:-translate-y-1 transition-transform shadow-[2px_2px_0px_0px_rgba(56,189,248,1)]"><Database className="w-6 h-6 text-[#38BDF8]"/></div>
            <span className="font-black text-2xl tracking-tighter uppercase">SCHOOLHUB</span>
          </div>
          
          <nav className="hidden lg:flex gap-8">
            {roleMode === 'teacher' ? (
              <button onClick={() => { setCurrentTab('teacher_dashboard'); setSelectedProjectId(null); }} className={`font-black uppercase text-sm tracking-wider ${currentTab==='teacher_dashboard'?'text-orange-500 border-b-4 border-orange-500 pt-1':'text-slate-400 hover:text-[#0F172A]'}`}>교사 대시보드</button>
            ) : (
              <>
                <button onClick={() => { setCurrentTab('home'); setSelectedProjectId(null); }} className={`font-black uppercase text-sm tracking-wider ${currentTab==='home'&&!selectedProjectId?'text-[#38BDF8] border-b-4 border-[#38BDF8] pt-1':'text-slate-400 hover:text-[#0F172A]'}`}>대시보드</button>
                <button onClick={() => setCurrentTab('directory')} className={`font-black uppercase text-sm tracking-wider ${currentTab==='directory'?'text-[#38BDF8] border-b-4 border-[#38BDF8] pt-1':'text-slate-400 hover:text-[#0F172A]'}`}>인재 디렉토리</button>
                <button onClick={() => setCurrentTab('diagnosis')} className={`font-black uppercase text-sm tracking-wider flex items-center gap-1.5 ${currentTab==='diagnosis'?'text-[#38BDF8] border-b-4 border-[#38BDF8] pt-1':'text-slate-400 hover:text-[#0F172A]'}`}><Brain className="w-4 h-4"/> AI 역량 진단</button>
                <button onClick={() => setCurrentTab('portfolio')} className={`font-black uppercase text-sm tracking-wider ${currentTab==='portfolio'?'text-[#38BDF8] border-b-4 border-[#38BDF8] pt-1':'text-slate-400 hover:text-[#0F172A]'}`}>내 포트폴리오</button>
              </>
            )}
          </nav>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setRoleMode(roleMode === 'student' ? 'teacher' : 'student'); setCurrentTab(roleMode === 'student' ? 'teacher_dashboard' : 'home'); setSelectedProjectId(null); }}
              className={`hidden sm:flex text-[10px] font-black border-2 border-[#0F172A] px-3 py-1.5 uppercase shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-colors ${roleMode === 'teacher' ? 'bg-orange-500 text-white border-orange-600' : 'bg-white text-[#0F172A] hover:bg-slate-100'}`}
            >
              {roleMode === 'student' ? '교사 모드로 전환' : '학생 모드로 전환'}
            </button>
            <div className="hidden sm:block text-right">
              <div className="font-black text-sm">{myProfile.name}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">{roleMode === 'teacher' ? '관리자 (교사)' : myProfile.style}</div>
            </div>
            <div className={`w-10 h-10 border-2 border-[#0F172A] flex items-center justify-center font-black text-lg ${roleMode === 'teacher' ? 'bg-orange-100 text-orange-600' : 'bg-[#F1F5F9] text-[#0F172A]'}`}>
              {myProfile.name[0]}
            </div>
          </div>
        </div>
      </header>

      {}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-8">
        {roleMode === 'student' && currentTab === 'home' && !selectedProjectId && renderHome()}
        {roleMode === 'student' && currentTab === 'home' && selectedProjectId && renderWorkspace()}
        {roleMode === 'student' && currentTab === 'portfolio' && renderPortfolio()}
        {roleMode === 'student' && currentTab === 'diagnosis' && renderDiagnosis()}
        {roleMode === 'teacher' && currentTab === 'teacher_dashboard' && renderTeacherDashboard()}
        
        {roleMode === 'student' && currentTab === 'directory' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="bg-[#0F172A] text-white p-8 border-4 border-[#0F172A] shadow-[8px_8px_0px_0px_rgba(56,189,248,1)]">
               <h2 className="text-3xl font-black uppercase mb-2">교내 인재 디렉토리</h2>
               <p className="font-bold text-slate-300">나와 잘 맞는 동료를 찾아보고 새로운 프로젝트를 함께 구상해보세요.</p>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {students.map(s => (
                <div key={s.uid} className="bg-white border-4 border-[#0F172A] p-5 flex flex-col items-center text-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-1 transition-transform">
                  <div className="w-14 h-14 bg-[#38BDF8] border-2 border-[#0F172A] rounded-full flex justify-center items-center font-black text-xl mb-3 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                    {s.name[0]}
                  </div>
                  <h3 className="font-black text-lg mb-1">{s.name}</h3>
                  <span className="text-xs font-bold text-slate-500 mb-3">{s.grade} {s.class}</span>
                  <span className="px-3 py-1 bg-[#0F172A] text-white text-[10px] font-black uppercase mb-3 w-full truncate border-2 border-[#0F172A]">{s.style}</span>
                  
                  <div className="flex flex-wrap justify-center gap-1.5 mt-auto">
                    {(s.skills||[]).slice(0,3).map(sk=><span key={sk} className="text-[9px] font-bold border-2 border-[#CBD5E1] px-1.5 py-0.5 bg-slate-50 text-slate-600">{sk}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in backdrop-blur-sm">
          <div className="bg-white border-4 border-[#0F172A] w-full max-w-2xl shadow-[12px_12px_0px_0px_rgba(56,189,248,1)] max-h-[90vh] flex flex-col">
            <div className="bg-[#38BDF8] text-[#0F172A] border-b-4 border-[#0F172A] p-5 flex justify-between items-center">
              <h2 className="font-black text-xl uppercase tracking-widest flex items-center gap-2"><Plus className="w-6 h-6"/> 신규 동아리 개설</h2>
              <button onClick={()=>setShowCreateModal(false)} className="hover:bg-white p-1 border-2 border-transparent hover:border-[#0F172A] transition-colors"><X/></button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto bg-[#F8FAFC]">
              <div>
                <label className="block text-xs font-black uppercase mb-2">동아리/프로젝트 명칭</label>
                <input type="text" placeholder="예: 교내 밴드부 결성, 해커톤 출품팀" value={newProj.title} onChange={e=>setNewProj({...newProj, title:e.target.value})} className="w-full border-4 border-[#0F172A] p-4 font-black text-lg focus:outline-none focus:bg-white" />
              </div>
              
              <div>
                 <label className="block text-xs font-black uppercase mb-2">활동 카테고리</label>
                 <select value={newProj.category} onChange={e=>setNewProj({...newProj, category:e.target.value})} className="w-full border-4 border-[#0F172A] p-4 font-black focus:outline-none bg-white cursor-pointer text-lg">
                   <option value="IT/SW">IT / 웹·앱 개발</option>
                   <option value="예체능">예체능 / 밴드 / 스포츠</option>
                   <option value="학술/연구">학술 / 연구 / 탐구</option>
                   <option value="봉사/기획">자원봉사 / 행사 기획</option>
                 </select>
              </div>
              
              <div>
                <label className="block text-xs font-black uppercase mb-2">상세 활동 목표 및 소개</label>
                <textarea placeholder="어떤 활동을 할 것인지, 어떤 부원을 찾는지 구체적으로 매력적으로 적어주세요." value={newProj.desc} onChange={e=>setNewProj({...newProj, desc:e.target.value})} className="w-full border-4 border-[#0F172A] p-4 font-bold h-32 focus:outline-none focus:bg-white leading-relaxed" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-[10px] font-black uppercase mb-2 text-slate-500">필요 핵심 역량 (다중 선택)</label>
                   <div className="flex flex-wrap gap-2">
                     {['코딩/개발', 'UI/UX 디자인', '기획/아이디어', '발표/스피치', '영상 편집', '문서 작성', '예술/창작'].map(sk => {
                       const isSel = newProj.skills.includes(sk);
                       return <button key={sk} onClick={() => setNewProj({...newProj, skills: isSel ? newProj.skills.filter(s=>s!==sk) : [...newProj.skills, sk]})} className={`px-3 py-1.5 border-2 text-xs font-black transition-colors ${isSel ? 'bg-[#0F172A] text-white border-[#0F172A]' : 'bg-white border-[#CBD5E1] text-slate-500'}`}>{sk}</button>
                     })}
                   </div>
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase mb-2 text-slate-500">선호 팀원 성향 (다중 선택)</label>
                   <div className="flex flex-wrap gap-2">
                     {['아이디어 뱅크', '치밀한 계획가', '열정적 실천가', '아웃풋 전문가'].map(st => {
                       const isSel = newProj.styles.includes(st);
                       return <button key={st} onClick={() => setNewProj({...newProj, styles: isSel ? newProj.styles.filter(s=>s!==st) : [...newProj.styles, st]})} className={`px-3 py-1.5 border-2 text-xs font-black transition-colors ${isSel ? 'bg-[#38BDF8] text-[#0F172A] border-[#0F172A]' : 'bg-white border-[#CBD5E1] text-slate-500'}`}>{st}</button>
                     })}
                   </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t-4 border-[#0F172A] bg-white flex gap-4">
              <button onClick={()=>setShowCreateModal(false)} className="flex-1 bg-white border-4 border-[#0F172A] py-4 font-black uppercase text-lg hover:bg-slate-100">취소</button>
              <button onClick={handleCreateProject} className="flex-1 bg-[#0F172A] text-white border-4 border-[#0F172A] py-4 font-black uppercase text-lg hover:bg-[#334155] shadow-[4px_4px_0px_0px_rgba(56,189,248,1)]">개설 완료하기</button>
            </div>
          </div>
        </div>
      )}

      {activeApplyModalProjId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in backdrop-blur-sm">
          <div className="bg-white border-4 border-[#0F172A] w-full max-w-md shadow-[12px_12px_0px_0px_rgba(56,189,248,1)]">
            <div className="bg-[#0F172A] text-white border-b-4 border-[#0F172A] p-5 flex justify-between items-center">
              <h2 className="font-black text-lg uppercase tracking-widest flex items-center gap-2"><LogIn className="w-5 h-5"/> 동아리 지원서 작성</h2>
              <button onClick={()=>setActiveApplyModalProjId(null)} className="hover:text-[#38BDF8] transition-colors"><X/></button>
            </div>
            <div className="p-8 space-y-6">
              <p className="font-bold text-slate-600 text-sm leading-relaxed">
                해당 동아리장에게 귀하의 프로필과 아래의 지원 메시지가 함께 전달됩니다. 어떤 강점을 발휘할 수 있는지 어필해보세요.
              </p>
              <textarea placeholder="동기 및 역량 어필 (예: 밴드부 베이스 파트 지원합니다. 2년 경력 있습니다!)" value={applyMessage} onChange={e=>setApplyMessage(e.target.value)} className="w-full border-4 border-[#0F172A] p-4 font-bold h-40 focus:outline-none focus:bg-[#F8FAFC]" />
            </div>
            <div className="p-6 border-t-4 border-[#0F172A] bg-[#F8FAFC] flex gap-3">
              <button onClick={()=>setActiveApplyModalProjId(null)} className="flex-1 bg-white border-4 border-[#0F172A] py-3 font-black uppercase hover:bg-slate-100">취소</button>
              <button onClick={handleApplyToProject} className="flex-1 bg-[#38BDF8] text-[#0F172A] border-4 border-[#0F172A] py-3 font-black uppercase hover:bg-[#0EA5E9] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">지원서 전송</button>
            </div>
          </div>
        </div>
      )}

      {}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 bg-[#0F172A] text-white px-8 py-5 font-black text-lg border-4 border-white flex gap-3 animate-in slide-in-from-bottom-8 z-[60] shadow-[8px_8px_0px_0px_rgba(56,189,248,1)]">
          <AlertCircle className="w-6 h-6 text-[#38BDF8]" /> {toastMessage}
        </div>
      )}
    </div>
  );
}