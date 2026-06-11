'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { SKILL_OPTIONS, SET_OPTIONS } from '@/lib/types';

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

export default function AddActivityPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [driveUrl, setDriveUrl] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activityCode = `SB-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const toggleSet = (setName: string) => {
    setSelectedSets((prev) =>
      prev.includes(setName)
        ? prev.filter((s) => s !== setName)
        : [...prev, setName]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    const newImages: UploadedImage[] = [];
    Array.from(fileList).forEach((file) => {
      if (images.length + newImages.length >= 3) return;
      newImages.push({ name: file.name, preview: URL.createObjectURL(file), fileObj: file });
    });
    setImages((prev) => [...prev, ...newImages].slice(0, 3));
    e.target.value = '';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    const newFiles: UploadedFile[] = [];
    Array.from(fileList).forEach((file) => {
      if (files.length + newFiles.length >= 3) return;
      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
          : `${(file.size / 1024).toFixed(0)} KB`;
      newFiles.push({ name: file.name, size: sizeStr, fileObj: file });
    });
    setFiles((prev) => [...prev, ...newFiles].slice(0, 3));
    e.target.value = '';
  };

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
      
      if (!scriptUrl) {
        alert('กรุณาใส่ NEXT_PUBLIC_GOOGLE_SCRIPT_URL ในไฟล์ .env.local ก่อนทำการบันทึกข้อมูลครับ');
        setSaving(false);
        return;
      }

      // Prepare images
      const base64Images = await Promise.all(
        images.map(async (img) => ({
          name: img.name,
          mimeType: img.fileObj.type,
          base64: await toBase64(img.fileObj)
        }))
      );

      // Prepare files
      const base64Files = await Promise.all(
        files.map(async (f) => ({
          name: f.name,
          mimeType: f.fileObj.type,
          base64: await toBase64(f.fileObj)
        }))
      );

      const payload = {
        code: activityCode,
        name,
        setNames: selectedSets,
        description,
        skills: selectedSkills,
        images: base64Images,
        files: base64Files,
        driveUrl,
        note
      };

      const res = await fetch(scriptUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // GAS requires text/plain for raw POST body
        },
      });

      const data = await res.json();
      
      if (data.status === 'success') {
        alert('บันทึกข้อมูลเรียบร้อยและอัปโหลดไฟล์ไปยัง Google Drive สำเร็จ!');
        router.push('/');
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.message);
      }
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/')}
          className="p-2 text-text-muted hover:text-primary hover:bg-orange-50 rounded-md transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-main">เพิ่มกิจกรรมใหม่</h1>
          <p className="text-text-muted text-sm mt-0.5">
            กรอกข้อมูลกิจกรรมฝึกทักษะ SIXBRICK
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
        {/* Basic Info - Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">
              รหัสกิจกรรม
            </label>
            <input
              type="text"
              value={activityCode}
              readOnly
              className="w-full bg-gray-100 border border-border rounded-md px-3 py-2.5 text-sm text-text-muted font-mono cursor-not-allowed"
            />
            <p className="text-xs text-text-muted mt-1">สร้างอัตโนมัติ</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">
              ชื่อกิจกรรม <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น บลิค 4 สี"
              className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-text-main placeholder-text-muted outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-3">
            ชื่อชุดกิจกรรม <span className="font-normal text-xs">(เลือกได้หลายข้อ)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SET_OPTIONS.map((opt) => {
              const isChecked = selectedSets.includes(opt);
              return (
                <label
                  key={opt}
                  className={`flex items-start gap-2 p-2.5 rounded-md border cursor-pointer transition-all text-sm leading-tight ${
                    isChecked
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                      : 'bg-background border-border text-text-muted hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSet(opt)}
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="อธิบายรายละเอียดกิจกรรม (ถ้ามีลิงก์จะเปิดในหน้าใหม่ได้)"
            className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-text-main placeholder-text-muted outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-y"
          />
        </div>

        {/* Skills Checkbox */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-3">
            กลุ่มทักษะฝึก{' '}
            <span className="font-normal text-xs">
              (เลือกได้หลายข้อ • เลือกแล้ว {selectedSkills.length} ข้อ)
            </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SKILL_OPTIONS.map((skill, idx) => {
              const isChecked = selectedSkills.includes(skill);
              return (
                <label
                  key={skill}
                  className={`flex items-start gap-2 p-2.5 rounded-md border cursor-pointer transition-all text-xs leading-tight ${
                    isChecked
                      ? 'bg-orange-50 border-primary text-primary'
                      : 'bg-background border-border text-text-muted hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSkill(skill)}
                    className="mt-0.5 accent-primary shrink-0"
                  />
                  <span>
                    <span className="text-text-muted font-mono mr-1">{idx + 1}.</span>
                    {skill}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">
            ภาพตัวอย่างกิจกรรม{' '}
            <span className="font-normal text-xs">(สูงสุด 3 ภาพ)</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((img, i) => (
              <div key={i} className="flex flex-col border-2 border-dashed border-orange-200 rounded-xl p-3 bg-white gap-3 group">
                <div className="relative h-32 w-full bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={img.preview}
                    alt={img.name}
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="text-xs text-text-muted text-center truncate px-2" title={img.name}>
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
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="flex-1 flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-500 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {images.length < 3 && (
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
            onChange={handleImageUpload}
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">
            ไฟล์แบบฝึก{' '}
            <span className="font-normal text-xs">(สูงสุด 3 ไฟล์ รองรับทุกนามสกุล)</span>
          </label>
          <div className="space-y-2">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-background border border-border rounded-md px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-main">{file.name}</p>
                    <p className="text-xs text-text-muted">{file.size}</p>
                  </div>
                </div>
                <button
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-text-muted hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {files.length < 3 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-md py-4 flex flex-col items-center gap-1 text-text-muted hover:border-primary hover:text-primary hover:bg-orange-50/30 transition-all"
              >
                <Upload size={20} />
                <span className="text-xs">คลิกเพื่ออัปโหลดไฟล์</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Google Drive URL */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">
            URL ที่เก็บไฟล์ใน Google Drive
          </label>
          <input
            type="url"
            value={driveUrl}
            onChange={(e) => setDriveUrl(e.target.value)}
            placeholder="https://drive.google.com/..."
            className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-text-main placeholder-text-muted outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">
            Note เพิ่มเติม
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="หมายเหตุเพิ่มเติม..."
            className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-text-main placeholder-text-muted outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-y"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2.5 border border-border rounded-md text-sm text-text-muted hover:text-text-main hover:border-gray-400 transition-colors"
        >
          ยกเลิก
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !name}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-md text-sm font-medium transition-colors shadow-sm"
        >
          <Save size={16} />
          {saving ? 'กำลังบันทึก...' : 'บันทึกกิจกรรม'}
        </button>
      </div>
    </div>
  );
}
