export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export type User = {
  id: string;
  name: string;
  email: string;
  college: string;
  course: string;
  year: string;
  bio: string;
  profileImage?: string;
  skillsToTeach: string[];
  skillsToLearn: string[];
  rating: number;
  availability: string;
};

export type Skill = {
  id: string;
  name: string;
  category: string;
  level: SkillLevel;
  description: string;
  experience: string;
  ownerId: string;
  mode: 'teach' | 'learn';
};

export type Match = {
  id: string;
  userId: string;
  matchedUserId: string;
  matchPercentage: number;
  commonTeachingSkills: string[];
  commonLearningSkills: string[];
};

export type Request = {
  id: string;
  senderId: string;
  receiverId: string;
  status: RequestStatus;
  message: string;
  createdAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type Session = {
  id: string;
  userId: string;
  partnerId: string;
  skill: string;
  date: string;
  time: string;
  duration: string;
  type: 'Video call' | 'In person';
  status: 'upcoming' | 'completed' | 'cancelled';
  meetingUrl?: string;
};

export type Feedback = {
  id: string;
  sessionId: string;
  rating: number;
  comment: string;
  tags: string[];
};

export type Notification = {
  id: string;
  type: 'request' | 'message' | 'session' | 'feedback' | 'system';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

export type Note = {
  id: string;
  title: string;
  subject: string;
  description: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData?: string;
  uploadedAt: string;
  ownerId: string;
};

export type AppData = {
  users: User[];
  skills: Skill[];
  requests: Request[];
  messages: Message[];
  sessions: Session[];
  feedback: Feedback[];
  notifications: Notification[];
  notes: Note[];
};

export let CURRENT_USER_ID = '';
export const setCurrentUserId = (id: string) => { CURRENT_USER_ID = id; };
export const DEMO_PASSWORD = '123456';
export const STORAGE_KEY = 'skillswap-demo-state-v1';
export const AUTH_KEY = 'skillswap-demo-auth-v1';

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export const seedData = (): AppData => ({
  users: [
    {
      id: 'priya',
      name: 'Priya Sharma',
      email: 'priya@skillswap.com',
      college: 'Northeastern University',
      course: 'Computer Science',
      year: '3rd year',
      bio: 'Frontend tinkerer, chai enthusiast, and the person to ask when your CSS refuses to cooperate.',
      skillsToTeach: ['React', 'Figma', 'UI Design'],
      skillsToLearn: ['Public Speaking', 'Photography'],
      rating: 4.9,
      availability: 'Weekday evenings',
    },
    {
      id: 'rahul',
      name: 'Rahul Kumar',
      email: 'rahul@skillswap.com',
      college: 'Boston University',
      course: 'Data Science',
      year: '4th year',
      bio: 'I turn messy datasets into stories people can actually use. Happy to talk Python, SQL, or campus life.',
      skillsToTeach: ['Python', 'Data Analysis', 'SQL'],
      skillsToLearn: ['React', 'Guitar'],
      rating: 4.8,
      availability: 'Tuesday and Thursday afternoons',
    },
    {
      id: 'ananya',
      name: 'Ananya R',
      email: 'ananya@skillswap.com',
      college: 'Tufts University',
      course: 'Communications',
      year: '2nd year',
      bio: 'Storyteller studying how ideas travel. I can help with presentations, writing, and finding your voice.',
      skillsToTeach: ['Public Speaking', 'Creative Writing', 'Presentation'],
      skillsToLearn: ['Python', 'Illustration'],
      rating: 4.7,
      availability: 'Flexible on weekends',
    },
    {
      id: 'arjun',
      name: 'Arjun S',
      email: 'arjun@skillswap.com',
      college: 'MIT',
      course: 'Mechanical Engineering',
      year: '3rd year',
      bio: 'CAD modeler and patient explainer. Outside class, I am usually building something that probably did not need building.',
      skillsToTeach: ['3D Modeling', 'CAD', 'Math'],
      skillsToLearn: ['UI Design', 'Public Speaking'],
      rating: 4.6,
      availability: 'Monday evenings',
    },
    {
      id: 'meera',
      name: 'Meera K',
      email: 'meera@skillswap.com',
      college: 'Boston College',
      course: 'Marketing',
      year: '4th year',
      bio: 'Brand strategist with a soft spot for tiny details. Let us make your next portfolio or pitch memorable.',
      skillsToTeach: ['Brand Strategy', 'Content Strategy', 'Canva'],
      skillsToLearn: ['Data Analysis', 'Video Editing'],
      rating: 4.9,
      availability: 'Wednesday mornings',
    },
    {
      id: CURRENT_USER_ID,
      name: 'Alex Morgan',
      email: 'student@skillswap.com',
      college: 'Boston University',
      course: 'Media & Technology',
      year: '3rd year',
      bio: 'Learning in public. I trade product thinking, editing, and a good playlist for new perspectives.',
      skillsToTeach: ['Video Editing', 'Product Thinking', 'English Conversation'],
      skillsToLearn: ['React', 'Data Analysis', 'Public Speaking'],
      rating: 4.8,
      availability: 'Most weekday evenings',
    },
  ],
  skills: [
    { id: 's1', name: 'React', category: 'Technology', level: 'Advanced', description: 'Component architecture, hooks, and building interfaces that feel fast.', experience: '3 years', ownerId: 'priya', mode: 'teach' },
    { id: 's2', name: 'Figma', category: 'Design', level: 'Advanced', description: 'From loose sketch to clean handoff with practical design systems.', experience: '4 years', ownerId: 'priya', mode: 'teach' },
    { id: 's3', name: 'Python', category: 'Technology', level: 'Advanced', description: 'Data wrangling, notebooks, and a calmer approach to debugging.', experience: '4 years', ownerId: 'rahul', mode: 'teach' },
    { id: 's4', name: 'Data Analysis', category: 'Technology', level: 'Advanced', description: 'Ask better questions of your data and turn patterns into decisions.', experience: '3 years', ownerId: 'rahul', mode: 'teach' },
    { id: 's5', name: 'Public Speaking', category: 'Communication', level: 'Advanced', description: 'A practical confidence toolkit for class, interviews, and demos.', experience: '4 years', ownerId: 'ananya', mode: 'teach' },
    { id: 's6', name: 'Creative Writing', category: 'Creative', level: 'Intermediate', description: 'Find the sharpest version of the story you are trying to tell.', experience: '5 years', ownerId: 'ananya', mode: 'teach' },
    { id: 's7', name: '3D Modeling', category: 'Design', level: 'Advanced', description: 'Build useful models in Fusion and explain the why behind each choice.', experience: '3 years', ownerId: 'arjun', mode: 'teach' },
    { id: 's8', name: 'Brand Strategy', category: 'Business', level: 'Advanced', description: 'Positioning, voice, and the simple story people remember.', experience: '4 years', ownerId: 'meera', mode: 'teach' },
    { id: 's9', name: 'Video Editing', category: 'Creative', level: 'Advanced', description: 'Rhythm, narrative, and a clean edit in Premiere or DaVinci.', experience: '3 years', ownerId: CURRENT_USER_ID, mode: 'teach' },
    { id: 's10', name: 'Product Thinking', category: 'Business', level: 'Intermediate', description: 'Frame the real problem before reaching for a solution.', experience: '2 years', ownerId: CURRENT_USER_ID, mode: 'teach' },
    { id: 's11', name: 'English Conversation', category: 'Communication', level: 'Advanced', description: 'Low-pressure practice for everyday conversations and interviews.', experience: 'Native speaker', ownerId: CURRENT_USER_ID, mode: 'teach' },
    { id: 's12', name: 'React', category: 'Technology', level: 'Beginner', description: 'Looking for a friendly starting point and project guidance.', experience: 'Just starting', ownerId: CURRENT_USER_ID, mode: 'learn' },
    { id: 's13', name: 'Data Analysis', category: 'Technology', level: 'Beginner', description: 'Want to move from spreadsheets to useful analysis.', experience: 'Some coursework', ownerId: CURRENT_USER_ID, mode: 'learn' },
    { id: 's14', name: 'Public Speaking', category: 'Communication', level: 'Intermediate', description: 'I want to feel more natural presenting my work.', experience: 'Some experience', ownerId: CURRENT_USER_ID, mode: 'learn' },
    { id: 's15', name: 'Photography', category: 'Creative', level: 'Intermediate', description: 'Learn to see and frame campus life with more intention.', experience: 'Casual practice', ownerId: 'priya', mode: 'learn' },
    { id: 's16', name: 'Guitar', category: 'Creative', level: 'Beginner', description: 'Looking for patient beginner lessons.', experience: 'Beginner', ownerId: 'rahul', mode: 'learn' },
  ],
  requests: [
    { id: 'r1', senderId: 'priya', receiverId: CURRENT_USER_ID, status: 'pending', message: 'I can help you get unstuck in React. In return, I would love some video editing pointers.', createdAt: '2025-02-18T10:30:00Z' },
    { id: 'r2', senderId: CURRENT_USER_ID, receiverId: 'rahul', status: 'accepted', message: 'Would you be open to a data analysis swap next week?', createdAt: '2025-02-16T14:00:00Z' },
    { id: 'r3', senderId: 'ananya', receiverId: CURRENT_USER_ID, status: 'completed', message: 'Your presentation outline is already strong. Let us sharpen the opening.', createdAt: '2025-02-10T09:00:00Z' },
  ],
  messages: [
    { id: 'm1', conversationId: 'priya-alex', senderId: 'priya', body: 'Hey Alex, I saw you are learning React. Want to trade notes this week?', createdAt: '2025-02-18T15:20:00Z' },
    { id: 'm2', conversationId: 'priya-alex', senderId: CURRENT_USER_ID, body: 'Absolutely. I can show you my latest edit workflow too.', createdAt: '2025-02-18T15:26:00Z' },
    { id: 'm3', conversationId: 'rahul-alex', senderId: 'rahul', body: 'I have a small CSV that could be fun to explore together.', createdAt: '2025-02-17T11:10:00Z' },
  ],
  sessions: [
    { id: 'sess1', userId: CURRENT_USER_ID, partnerId: 'priya', skill: 'React', date: daysFromNow(2), time: '18:30', duration: '45 min', type: 'Video call', status: 'upcoming' },
    { id: 'sess2', userId: CURRENT_USER_ID, partnerId: 'rahul', skill: 'Data Analysis', date: daysFromNow(6), time: '16:00', duration: '60 min', type: 'Video call', status: 'upcoming' },
    { id: 'sess3', userId: CURRENT_USER_ID, partnerId: 'ananya', skill: 'Presentation', date: daysFromNow(-4), time: '12:00', duration: '30 min', type: 'In person', status: 'completed' },
  ],
  feedback: [
    { id: 'f1', sessionId: 'sess3', rating: 5, comment: 'Ananya made the practice feel easy and specific.', tags: ['Patient', 'Practical'] },
  ],
  notifications: [
    { id: 'n1', type: 'request', title: 'New exchange request', body: 'Priya Sharma wants to swap React for video editing.', createdAt: '2025-02-18T10:30:00Z', read: false },
    { id: 'n2', type: 'session', title: 'Session coming up', body: 'Your React session with Priya is in two days.', createdAt: '2025-02-17T08:00:00Z', read: false },
    { id: 'n3', type: 'message', title: 'New message from Rahul', body: 'I have a small CSV that could be fun to explore together.', createdAt: '2025-02-17T11:10:00Z', read: true },
  ],
  notes: [
    { id: 'note-1', title: 'React hooks cheat sheet', subject: 'React', description: 'A quick reference for the hooks I use most often in small projects.', fileName: 'react-hooks-cheat-sheet.pdf', fileType: 'application/pdf', fileSize: 342000, uploadedAt: '2025-02-17T09:15:00Z', ownerId: CURRENT_USER_ID },
    { id: 'note-2', title: 'Storytelling for presentations', subject: 'Presentation', description: 'Notes from a campus workshop on making project demos easier to follow.', fileName: 'presentation-storytelling.docx', fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileSize: 186000, uploadedAt: '2025-02-12T16:40:00Z', ownerId: CURRENT_USER_ID },
  ],
});

export const loadData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AppData>;
      return { ...seedData(), ...parsed, notes: parsed.notes ?? seedData().notes };
    }
  } catch {
    // Corrupt demo data falls back to a fresh local workspace.
  }
  return seedData();
};

export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getInitialAuth = () => {
  try {
    return localStorage.getItem(AUTH_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setAuth = (value: boolean) => {
  localStorage.setItem(AUTH_KEY, String(value));
};

export const makeId = (_prefix: string) => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`));

export const formatRelative = (value: string) => {
  const delta = Date.now() - new Date(value).getTime();
  const hours = Math.floor(delta / 3_600_000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const getMatchPercentage = (me: User, partner: User) => {
  const normalize = (skill: string) => skill.trim().toLowerCase();

  const myTeach = me.skillsToTeach.map(normalize);
  const myLearn = me.skillsToLearn.map(normalize);
  const partnerTeach = partner.skillsToTeach.map(normalize);
  const partnerLearn = partner.skillsToLearn.map(normalize);

  const teach = me.skillsToTeach.filter((skill) =>
    partnerLearn.includes(normalize(skill))
  );

  const learn = me.skillsToLearn.filter((skill) =>
    partnerTeach.includes(normalize(skill))
  );

  const teachMatches = new Set(teach.map(normalize)).size;
  const learnMatches = new Set(learn.map(normalize)).size;

  const totalOpportunities = myTeach.length + myLearn.length;
  const matchedOpportunities = teachMatches + learnMatches;

  let score = totalOpportunities > 0
    ? Math.round((matchedOpportunities / totalOpportunities) * 100)
    : 0;

  if (matchedOpportunities > 0 && me.college === partner.college) {
    score = Math.min(100, score + 5);
  }

  return { score, teach, learn };
};