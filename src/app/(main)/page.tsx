'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  Upload,
  Save
} from 'lucide-react';
import { SKILL_COLORS, SKILL_OPTIONS, SET_OPTIONS } from '@/lib/types';
import type { Activity } from '@/lib/types';

const getEnlargedImageUrl = (url: string) => {
  if (!url) return url;
  return url
    .replace(/w=200/g, 'w=500')
    .replace(/h=200/g, 'h=500')
    .replace(/=w200-h200/g, '=s500')
    .replace(/=w200/g, '=w500')
    .replace(/=s200/g, '=s500');
};


interface UploadedFile {
  name: string;
  size: string;
  fileObj: File;
}

interface UploadedImage {
  name: string;
  preview: string;
  fileObj: File;
}

export default function DashboardPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [setFilter, setSetFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  const [previewActivity, setPreviewActivity] = useState<Activity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Activity | null>(null);

  // Edit Modal State
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [editName, setEditName] = useState('');
  const [editSelectedSets, setEditSelectedSets] = useState<string[]>([]);
  const [editDescription, setEditDescription] = useState('');
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [editDriveUrl, setEditDriveUrl] = useState('');
  const [editNote, setEditNote] = useState('');
  
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<UploadedImage[]>([]);

  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [deletedFileUrls, setDeletedFileUrls] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<UploadedFile[]>([]);
  
  const [savingEdit, setSavingEdit] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
      if (!scriptUrl) {
        console.error('Missing Google Script URL');
        setLoading(false);
        return;
      }
      const res = await fetch(`${scriptUrl}?action=getAll`);
      const result = await res.json();
      if (result.status === 'success') {
        const mappedData: Activity[] = result.data.map((item: any, idx: number) => ({
          id: `act-${idx}`,
          rowIndex: item.rowIndex,
          code: item.code,
          name: item.name,
          setNames: item.setNames || [],
          description: item.description,
          skills: item.skills,
          images: item.images,
          files: item.files,
          driveUrl: item.driveUrl,
          note: item.note,
          dateAdded: item.dateAdded,
          folderId: item.folderId,
        }));
        // Sort descending by rowIndex (newest first usually)
        mappedData.sort((a, b) => b.rowIndex - a.rowIndex);
        setActivities(mappedData);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const uniqueSets = useMemo(
    () => [...new Set(activities.flatMap((a) => a.setNames).filter(Boolean))],
    [activities]
  );

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      const matchSearch =
        !searchQuery ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.setNames.join(' ').toLowerCase().includes(searchQuery.toLowerCase());
      const matchSkill = !skillFilter || a.skills.includes(skillFilter);
      const matchSet = !setFilter || a.setNames.includes(setFilter);
      return matchSearch && matchSkill && matchSet;
    });
  }, [activities, searchQuery, skillFilter, setFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrintPdf = async () => {
    if (!previewActivity) return;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('activity-details-content');
      
      const opt = {
        margin:       0.5,
        filename:     `${previewActivity.code}-${previewActivity.name}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Failed to generate PDF', error);
      alert('ไม่สามารถสร้างไฟล์ PDF ได้');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
      if (!scriptUrl) return;

      const payload = {
        action: 'delete',
        rowIndex: deleteConfirm.rowIndex
      };

      const res = await fetch(scriptUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });

      const result = await res.json();
      if (result.status === 'success') {
        alert('ลบข้อมูลและโฟลเดอร์สำเร็จ!');
        setDeleteConfirm(null);
        fetchActivities(); // Refresh list
      } else {
        alert('เกิดข้อผิดพลาดในการลบ: ' + result.message);
      }
    } catch (err) {
      console.error(err);
      alert('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    } finally {
      setDeleting(false);
    }
  };

  // --- Edit Handlers ---
  const openEditModal = (activity: Activity) => {
    setEditActivity(activity);
    setEditName(activity.name);
    setEditSelectedSets([...activity.setNames]);
    setEditDescription(activity.description);
    setEditSkills([...activity.skills]);
    setEditDriveUrl(activity.driveUrl);
    setEditNote(activity.note);
    setExistingImages([...activity.images]);
    setDeletedImageUrls([]);
    setNewImages([]);
    setExistingFiles([...activity.files]);
    setDeletedFileUrls([]);
    setNewFiles([]);
  };

  const closeEditModal = () => {
    if (savingEdit) return;
    setEditActivity(null);
  };

  const toggleEditSkill = (skill: string) => {
    setEditSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const toggleEditSet = (setName: string) => {
    setEditSelectedSets((prev) =>
      prev.includes(setName)
        ? prev.filter((s) => s !== setName)
        : [...prev, setName]
    );
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    const addedImages: UploadedImage[] = [];
    Array.from(fileList).forEach((file) => {
      if (existingImages.length + newImages.length + addedImages.length >= 3) return;
      addedImages.push({ name: file.name, preview: URL.createObjectURL(file), fileObj: file });
    });
    setNewImages((prev) => [...prev, ...addedImages].slice(0, 3 - existingImages.length));
    e.target.value = '';
  };

  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    const addedFiles: UploadedFile[] = [];
    Array.from(fileList).forEach((file) => {
      if (existingFiles.length + newFiles.length + addedFiles.length >= 3) return;
      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
          : `${(file.size / 1024).toFixed(0)} KB`;
      addedFiles.push({ name: file.name, size: sizeStr, fileObj: file });
    });
    setNewFiles((prev) => [...prev, ...addedFiles].slice(0, 3 - existingFiles.length));
    e.target.value = '';
  };

  const removeExistingImage = (url: string) => {
    setExistingImages(prev => prev.filter(u => u !== url));
    setDeletedImageUrls(prev => [...prev, url]);
  };

  const removeExistingFile = (url: string) => {
    setExistingFiles(prev => prev.filter(u => u !== url));
    setDeletedFileUrls(prev => [...prev, url]);
  };

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSaveEdit = async () => {
    if (!editActivity) return;
    setSavingEdit(true);
    
    try {
      const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
      if (!scriptUrl) {
        alert('กรุณาใส่ NEXT_PUBLIC_GOOGLE_SCRIPT_URL ในไฟล์ .env.local ก่อนทำการบันทึกข้อมูลครับ');
        setSavingEdit(false);
        return;
      }

      // Prepare images
      const base64NewImages = await Promise.all(
        newImages.map(async (img) => ({
          name: img.name,
          mimeType: img.fileObj.type,
          base64: await toBase64(img.fileObj)
        }))
      );

      // Prepare files
      const base64NewFiles = await Promise.all(
        newFiles.map(async (f) => ({
          name: f.name,
          mimeType: f.fileObj.type,
          base64: await toBase64(f.fileObj)
        }))
      );

      const payload = {
        action: 'update',
        rowIndex: editActivity.rowIndex,
        folderId: editActivity.folderId,
        code: editActivity.code,
        name: editName,
        setNames: editSelectedSets,
        description: editDescription,
        skills: editSkills,
        existingImages: existingImages,
        deletedImageUrls: deletedImageUrls,
        newImages: base64NewImages,
        existingFiles: existingFiles,
        deletedFileUrls: deletedFileUrls,
        newFiles: base64NewFiles,
        driveUrl: editDriveUrl,
        note: editNote
      };

      const res = await fetch(scriptUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });

      const data = await res.json();
      
      if (data.status === 'success') {
        alert('แก้ไขข้อมูลเรียบร้อย!');
        setEditActivity(null);
        fetchActivities();
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.message);
      }
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Activities</h1>
          <p className="text-text-muted text-sm mt-1">
            จัดการกิจกรรมฝึกทักษะทั้งหมด ({filtered.length} รายการ)
          </p>
        </div>
        <Link
          href="/add"
          className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-md text-sm font-medium transition-colors shadow-sm"
        >
          + เพิ่มกิจกรรมใหม่
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center bg-background border border-border rounded-md px-3 py-2 flex-1 min-w-[240px] focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
            <Search size={16} className="text-text-muted mr-2 shrink-0" />
            <input
              type="text"
              placeholder="ค้นหาชื่อกิจกรรม, รหัส, ชุดกิจกรรม..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none outline-none text-sm w-full text-text-main placeholder-text-muted"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-text-muted hover:text-text-main">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-text-muted" />
            <select
              value={skillFilter}
              onChange={(e) => {
                setSkillFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-background border border-border rounded-md px-3 py-2 text-sm text-text-main outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="">ทุกทักษะ</option>
              {SKILL_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <select
            value={setFilter}
            onChange={(e) => {
              setSetFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm text-text-main outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="">ทุกชุดกิจกรรม</option>
            {uniqueSets.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {(searchQuery || skillFilter || setFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSkillFilter('');
                setSetFilter('');
                setCurrentPage(1);
              }}
              className="text-primary hover:text-primary-hover text-sm font-medium"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden relative min-h-[200px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="flex flex-col items-center gap-2 text-primary">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-sm font-medium">กำลังโหลดข้อมูล...</span>
            </div>
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-left px-4 py-3 font-semibold text-text-muted w-24">รหัส</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted w-16">ภาพ</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted">ชื่อกิจกรรม</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted">ชุดกิจกรรม</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted">กลุ่มทักษะ</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted w-28">วันที่เพิ่ม</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted w-20">ไฟล์</th>
                <th className="text-center px-4 py-3 font-semibold text-text-muted w-36">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {!loading && paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-text-muted">
                    ไม่พบข้อมูลกิจกรรม
                  </td>
                </tr>
              ) : (
                paginated.map((activity) => (
                  <tr
                    key={activity.id}
                    className="border-b border-border hover:bg-orange-50/40 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 text-text-muted px-2 py-0.5 rounded">
                        {activity.code}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {activity.images[0] ? (
                        <a 
                          href={getEnlargedImageUrl(activity.images[0])} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block w-12 h-12 rounded border border-border overflow-hidden bg-white hover:opacity-80 transition-opacity" 
                          title="คลิกดูภาพขนาดเต็ม"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <img src={getEnlargedImageUrl(activity.images[0])} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </a>
                      ) : (
                        <div className="w-12 h-12 rounded border border-border bg-gray-50 flex items-center justify-center">
                          <ImageIcon size={16} className="text-gray-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-text-main">{activity.name}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {activity.setNames.length > 0 ? activity.setNames.join(', ') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {activity.skills.map((skill) => (
                          <span
                            key={skill}
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${SKILL_COLORS[skill] || 'bg-gray-100 text-gray-600'}`}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">{activity.dateAdded}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-text-muted">
                        <FileText size={14} />
                        <span className="text-xs">{activity.files.length}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setPreviewActivity(activity)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-200 rounded cursor-pointer transition-colors"
                          title="ดูรายละเอียด"
                        >
                          <Eye size={14} />
                          <span className="hidden sm:inline">ดู</span>
                        </button>
                        <button
                          onClick={() => openEditModal(activity)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-200 rounded cursor-pointer transition-colors"
                          title="แก้ไข"
                        >
                          <Pencil size={14} />
                          <span className="hidden sm:inline">แก้ไข</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(activity)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 border border-red-200 rounded cursor-pointer transition-colors"
                          title="ลบ"
                        >
                          <Trash2 size={14} />
                          <span className="hidden sm:inline">ลบ</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-border bg-gray-50/50 gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">แสดง</span>
              <select
                className="text-xs border border-border rounded px-2 py-1 bg-white focus:outline-none focus:border-primary"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>
              <span className="text-xs text-text-muted">รายการต่อหน้า</span>
            </div>
            {filtered.length > 0 && (
              <span className="text-xs text-text-muted">
                | {(currentPage - 1) * itemsPerPage + 1}–
                {Math.min(currentPage * itemsPerPage, filtered.length)} จาก{' '}
                {filtered.length} รายการ
              </span>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-1.5 rounded border border-border bg-surface text-text-muted hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                    currentPage === i + 1
                      ? 'bg-primary text-white'
                      : 'text-text-muted hover:text-primary hover:bg-orange-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1.5 rounded border border-border bg-surface text-text-muted hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Panel (Modal) */}
      {previewActivity && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-end" onClick={() => setPreviewActivity(null)}>
          <div
            className="w-[480px] h-full bg-surface border-l border-border shadow-2xl overflow-y-auto animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-bold text-lg text-text-main">รายละเอียดกิจกรรม</h2>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handlePrintPdf} 
                  className="flex items-center gap-1.5 text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1.5 rounded-md font-medium transition-colors"
                >
                  <Download size={16} /> โหลด PDF
                </button>
                <button onClick={() => setPreviewActivity(null)} className="text-text-muted hover:text-text-main">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div id="activity-details-content" className="p-6 space-y-5 bg-white">
              <div>
                <span className="font-mono text-xs bg-orange-100 text-primary px-2 py-0.5 rounded">
                  {previewActivity.code}
                </span>
                <h3 className="text-xl font-bold text-text-main mt-2">{previewActivity.name}</h3>
                {previewActivity.setNames.length > 0 && (
                  <p className="text-sm text-text-muted mt-1">{previewActivity.setNames.join(', ')}</p>
                )}
              </div>

              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  รายละเอียด
                </h4>
                <p className="text-sm text-text-main leading-relaxed whitespace-pre-wrap">
                  {previewActivity.description.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                    part.match(/^https?:\/\//) ? (
                      <a
                        key={i}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {part}
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  กลุ่มทักษะ
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {previewActivity.skills.map((skill) => (
                    <span
                      key={skill}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${SKILL_COLORS[skill] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {previewActivity.images.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    ภาพตัวอย่าง
                  </h4>
                  <div className="flex flex-col gap-4">
                    {previewActivity.images.map((img, i) => (
                      <a
                        key={i}
                        href={getEnlargedImageUrl(img)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-white border border-border rounded overflow-hidden hover:shadow-md transition-all relative group"
                        title="คลิกเพื่อดูภาพแยกต่างหาก"
                      >
                        <img src={getEnlargedImageUrl(img)} alt={`Preview ${i}`} className="w-auto h-auto max-w-full mx-auto" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <span className="bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm shadow-sm">ดูภาพเต็ม</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {previewActivity.files.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    ไฟล์แบบฝึก
                  </h4>
                  <div className="space-y-2">
                    {previewActivity.files.map((fileUrl, i) => (
                      <a
                        key={i}
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between bg-background border border-border rounded-md px-3 py-2 hover:border-primary transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-primary" />
                          <p className="text-sm font-medium text-text-main">ไฟล์เอกสารที่ {i + 1}</p>
                        </div>
                        <div className="text-text-muted group-hover:text-primary transition-colors">
                          <Download size={16} />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {previewActivity.driveUrl && (
                <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    ลิงก์ภายนอก
                  </h4>
                  <a
                    href={previewActivity.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink size={14} />
                    {previewActivity.driveUrl}
                  </a>
                </div>
              )}

              {previewActivity.note && (
                <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Note
                  </h4>
                  <p className="text-sm text-text-main bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
                    {previewActivity.note}
                  </p>
                </div>
              )}

              <div className="text-xs text-text-muted">
                เพิ่มเมื่อ: {previewActivity.dateAdded}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Panel (Modal) */}
      {editActivity && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-end" onClick={closeEditModal}>
          <div
            className="w-[600px] h-full bg-surface border-l border-border shadow-2xl overflow-y-auto animate-slide-in flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between z-10 shrink-0">
              <h2 className="font-bold text-lg text-text-main">แก้ไขข้อมูล: {editActivity.code}</h2>
              <button onClick={closeEditModal} disabled={savingEdit} className="text-text-muted hover:text-text-main disabled:opacity-50">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">
                  ชื่อกิจกรรม <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-text-main outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-3">
                  ชื่อชุดกิจกรรม <span className="font-normal text-xs">(เลือกได้หลายข้อ)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SET_OPTIONS.map((opt) => {
                    const isChecked = editSelectedSets.includes(opt);
                    return (
                      <label
                        key={opt}
                        className={`flex items-start gap-2 p-2 rounded-md border cursor-pointer transition-all text-xs ${
                          isChecked
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                            : 'bg-background border-border text-text-muted hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEditSet(opt)}
                          className="mt-0.5 accent-blue-600 shrink-0 cursor-pointer"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">
                  รายละเอียดกิจกรรม
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-text-main outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-3">
                  กลุ่มทักษะฝึก (เลือกแล้ว {editSkills.length} ข้อ)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SKILL_OPTIONS.map((skill) => {
                    const isChecked = editSkills.includes(skill);
                    return (
                      <label
                        key={skill}
                        className={`flex items-start gap-2 p-2 rounded-md border cursor-pointer transition-all text-xs ${
                          isChecked
                            ? 'bg-orange-50 border-primary text-primary'
                            : 'bg-background border-border text-text-muted hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEditSkill(skill)}
                          className="mt-0.5 accent-primary shrink-0"
                        />
                        <span>{skill}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Image Editor */}
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  ภาพตัวอย่างกิจกรรม <span className="font-normal text-xs">(สูงสุด 3 ภาพ)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {existingImages.map((url, i) => {
                    const filename = url.split('/').pop()?.split('?')[0] || `ภาพเดิม ${i + 1}`;
                    return (
                    <div key={`exist-${i}`} className="flex flex-col border-2 border-dashed border-orange-200 rounded-xl p-3 bg-white gap-3 group">
                      <div className="relative h-32 w-full bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                        <img src={getEnlargedImageUrl(url)} alt="Existing" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <p className="text-xs text-text-muted text-center truncate px-2" title={filename}>
                        {filename}
                      </p>
                      <div className="flex items-center gap-2 mt-auto">
                        <button
                          onClick={() => imageInputRef.current?.click()}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-main py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center"
                        >
                          Change
                        </button>
                        <button
                          onClick={() => removeExistingImage(url)}
                          className="flex-1 flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-500 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        >
                          <Trash2 size={12} />
                          Remove
                        </button>
                      </div>
                    </div>
                  )})}
                  {newImages.map((img, i) => (
                    <div key={`new-${i}`} className="flex flex-col border-2 border-dashed border-green-300 rounded-xl p-3 bg-green-50/30 gap-3 group">
                      <div className="relative h-32 w-full bg-white rounded-lg overflow-hidden flex items-center justify-center">
                        <img src={img.preview} alt="New" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                        <div className="absolute top-0 left-0 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-br-lg">ใหม่</div>
                      </div>
                      <p className="text-xs text-green-700 text-center truncate px-2" title={img.name}>
                        {img.name}
                      </p>
                      <div className="flex items-center gap-2 mt-auto">
                        <button
                          onClick={() => imageInputRef.current?.click()}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-main py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center"
                        >
                          Change
                        </button>
                        <button
                          onClick={() => setNewImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="flex-1 flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-500 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        >
                          <Trash2 size={12} />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {(existingImages.length + newImages.length) < 3 && (
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="h-[12rem] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-text-muted hover:border-primary hover:text-primary hover:bg-orange-50/30 transition-all cursor-pointer"
                    >
                      <ImageIcon size={28} />
                      <span className="text-sm font-medium">+ เพิ่มรูป</span>
                    </button>
                  )}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleEditImageUpload}
                />
              </div>

              {/* File Editor */}
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  ไฟล์แบบฝึก <span className="font-normal text-xs">(สูงสุด 3 ไฟล์)</span>
                </label>
                <div className="space-y-2">
                  {existingFiles.map((url, i) => (
                    <div key={`exist-f-${i}`} className="flex items-center justify-between bg-background border border-border rounded-md px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-primary shrink-0" />
                        <span className="text-sm text-text-main truncate w-64">ไฟล์เดิมที่ {i + 1}</span>
                      </div>
                      <button onClick={() => removeExistingFile(url)} className="text-text-muted hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {newFiles.map((file, i) => (
                    <div key={`new-f-${i}`} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-green-600 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-green-800">{file.name}</p>
                          <p className="text-xs text-green-600">{file.size}</p>
                        </div>
                      </div>
                      <button onClick={() => setNewFiles((prev) => prev.filter((_, idx) => idx !== i))} className="text-green-600 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {(existingFiles.length + newFiles.length) < 3 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border rounded-md py-4 flex flex-col items-center gap-1 text-text-muted hover:border-primary hover:text-primary hover:bg-orange-50/30 transition-all"
                    >
                      <Upload size={20} />
                      <span className="text-xs">อัปโหลดไฟล์เพิ่ม</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleEditFileUpload}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">
                  URL ที่เก็บไฟล์ใน Google Drive
                </label>
                <input
                  type="url"
                  value={editDriveUrl}
                  onChange={(e) => setEditDriveUrl(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-text-main outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">
                  Note เพิ่มเติม
                </label>
                <textarea
                  rows={2}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-text-main outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-y"
                />
              </div>

            </div>
            
            <div className="border-t border-border p-4 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
              <button
                disabled={savingEdit}
                onClick={closeEditModal}
                className="px-4 py-2 border border-border rounded-md text-sm text-text-muted hover:text-text-main transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                disabled={savingEdit || !editName}
                onClick={handleSaveEdit}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                {savingEdit ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {savingEdit ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="bg-surface border border-border rounded-lg shadow-2xl p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-text-main">ยืนยันการลบ</h3>
            <p className="text-sm text-text-muted mt-2">
              ต้องการลบกิจกรรม <span className="font-semibold text-red-600">{deleteConfirm.code}</span> หรือไม่? การลบจะทำลายโฟลเดอร์ภาพและไฟล์ใน Drive ด้วย (สามารถกู้คืนได้จากถังขยะใน Drive)
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                disabled={deleting}
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-border rounded-md text-sm text-text-muted hover:text-text-main transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                disabled={deleting}
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 size={16} className="animate-spin" />}
                ลบกิจกรรม
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slideIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
