export interface Activity {
  id: string;
  rowIndex: number;
  code: string;
  name: string;
  setNames: string[];
  description: string;
  skills: string[];
  images: string[];
  files: string[];
  driveUrl: string;
  note: string;
  dateAdded: string;
  folderId: string;
}

export interface FileItem {
  name: string;
  size: string;
  url: string;
  type: string;
}

export const SET_OPTIONS = [
  'ชุดฝึกสายตา',
  'ชุดความจำ',
  'ชุดการฟัง',
  'ชุดกล้ามเนื้อมัดเล็ก ร่างกาย',
  'ชุดCrossing the midline (ไขว้กลางลำตัว)',
] as const;

export const SKILL_OPTIONS = [
  'ฟังอย่าง Focus',
  'Focus / Concentration',
  'ลานสายตา',
  'Visual Figure Ground',
  'Visual Discrimination',
  'Spatial Awareness',
  'Visual Working Memory',
  'Visual Sequential Memory',
  'Auditory Memory',
  'Inhibitory Control',
  'Cognitive',
  'Emotions',
  'Goal-Directed Persistence',
  'Hand-Eye Co-ordination',
  'Fine Motor กล้ามเนื้อนิ้วมือ',
  'Crossing the Midline',
] as const;

export const SKILL_COLORS: Record<string, string> = {
  'ฟังอย่าง Focus': 'bg-blue-100 text-blue-700',
  'Focus / Concentration': 'bg-sky-100 text-sky-700',
  'ลานสายตา': 'bg-teal-100 text-teal-700',
  'Visual Figure Ground': 'bg-emerald-100 text-emerald-700',
  'Visual Discrimination': 'bg-green-100 text-green-700',
  'Spatial Awareness': 'bg-lime-100 text-lime-700',
  'Visual Working Memory': 'bg-yellow-100 text-yellow-700',
  'Visual Sequential Memory': 'bg-amber-100 text-amber-700',
  'Auditory Memory': 'bg-orange-100 text-orange-700',
  'Inhibitory Control': 'bg-red-100 text-red-700',
  'Cognitive': 'bg-rose-100 text-rose-700',
  'Emotions': 'bg-pink-100 text-pink-700',
  'Goal-Directed Persistence': 'bg-fuchsia-100 text-fuchsia-700',
  'Hand-Eye Co-ordination': 'bg-cyan-100 text-cyan-700',
  'Fine Motor กล้ามเนื้อนิ้วมือ': 'bg-indigo-100 text-indigo-700',
  'Crossing the Midline': 'bg-stone-100 text-stone-700',
};
