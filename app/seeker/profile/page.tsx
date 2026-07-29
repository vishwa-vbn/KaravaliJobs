'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { RootState } from '@/lib/redux/store';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { SeekerProfile, EducationDetail, ExperienceDetail } from '@/lib/firebase/authService';
import { useUI } from '@/components/ui/UIContext';

type TabId = 'overview' | 'education' | 'experience' | 'skills' | 'contact';

const tabs: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'education', label: 'Education' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
];

export default function SeekerProfilePage() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { confirm, showAlert, toast } = useUI();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [headline, setHeadline] = useState('');
  const [phone, setPhone] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  const [educationDetails, setEducationDetails] = useState<EducationDetail[]>([]);
  const [experienceDetails, setExperienceDetails] = useState<ExperienceDetail[]>([]);

  // Education subform
  const [showEduForm, setShowEduForm] = useState(false);
  const [eduSchool, setEduSchool] = useState('');
  const [eduDegree, setEduDegree] = useState('');
  const [eduField, setEduField] = useState('');
  const [eduStart, setEduStart] = useState('');
  const [eduEnd, setEduEnd] = useState('');

  // Experience subform
  const [showExpForm, setShowExpForm] = useState(false);
  const [expCompany, setExpCompany] = useState('');
  const [expRole, setExpRole] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expStart, setExpStart] = useState('');
  const [expEnd, setExpEnd] = useState('');
  const [expCurrent, setExpCurrent] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    async function loadProfile() {
      try {
        const userDocRef = doc(db, 'users', user!.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data().seekerProfile as SeekerProfile || {};
          setHeadline(profileData.headline || '');
          setPhone(profileData.phone || '');
          setPortfolioUrl(profileData.portfolioUrl || '');
          setSkills(profileData.skills || []);
          setSkillsText((profileData.skills || []).join(', '));
          setEducationDetails(profileData.educationDetails || []);
          setExperienceDetails(profileData.experienceDetails || []);
        }
      } catch (err) {
        console.error('Failed to load seeker profile:', err);
        setError('Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user, router]);

  const handleAddEducation = () => {
    if (!eduSchool || !eduDegree || !eduField || !eduStart || !eduEnd) {
      showAlert('Incomplete Fields', 'Please fill all education fields before adding.');
      return;
    }
    setEducationDetails([...educationDetails, { school: eduSchool, degree: eduDegree, fieldOfStudy: eduField, startYear: eduStart, endYear: eduEnd }]);
    setEduSchool(''); setEduDegree(''); setEduField(''); setEduStart(''); setEduEnd('');
    setShowEduForm(false);
    toast('Education added successfully!', 'success');
  };

  const handleDeleteEducation = async (index: number) => {
    const ok = await confirm(
      'Remove Education',
      'Are you sure you want to remove this education entry?',
      { confirmLabel: 'Remove', type: 'danger' }
    );
    if (ok) {
      setEducationDetails(educationDetails.filter((_, i) => i !== index));
      toast('Education entry removed.', 'info');
    }
  };

  const handleAddExperience = () => {
    if (!expCompany || !expRole || !expStart || (!expCurrent && !expEnd)) {
      showAlert('Incomplete Fields', 'Please fill all required experience fields before adding.');
      return;
    }
    setExperienceDetails([...experienceDetails, {
      company: expCompany, role: expRole, description: expDesc,
      startYear: expStart, endYear: expCurrent ? 'Present' : expEnd, current: expCurrent,
    }]);
    setExpCompany(''); setExpRole(''); setExpDesc(''); setExpStart(''); setExpEnd(''); setExpCurrent(false);
    setShowExpForm(false);
    toast('Work experience added successfully!', 'success');
  };

  const handleDeleteExperience = async (index: number) => {
    const ok = await confirm(
      'Remove Experience',
      'Are you sure you want to remove this work experience entry?',
      { confirmLabel: 'Remove', type: 'danger' }
    );
    if (ok) {
      setExperienceDetails(experienceDetails.filter((_, i) => i !== index));
      toast('Experience entry removed.', 'info');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError('');
    setSuccess('');

    const parsedSkills = skillsText.split(',').map((s) => s.trim()).filter((s) => s.length > 0);

    const updatedProfile: SeekerProfile = {
      headline, skills: parsedSkills, educationDetails, experienceDetails,
      phone, portfolioUrl,
      experience: experienceDetails.map(exp => `${exp.role} at ${exp.company}`).join(', ') || 'None',
      education: educationDetails.map(edu => `${edu.degree} from ${edu.school}`).join(', ') || 'None',
    };

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { seekerProfile: updatedProfile });
      setSuccess('Profile saved successfully.');
      setSkills(parsedSkills);
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-sm text-neutral-400">Loading profile...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-grow">
        {/* Profile header */}
        <div className="border-b border-slate-200" style={{ background: 'linear-gradient(135deg, #f8faff 0%, #faf5ff 50%, #f0fdfa 100%)' }}>
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center gap-4">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Profile'}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-200 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
                  {user?.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-900">{user?.displayName}</h1>
                <p className="text-sm text-slate-500">{user?.email}</p>
                {headline && (
                  <p className="text-sm text-slate-600 mt-1 font-medium">{headline}</p>
                )}
                <span className="badge-role-seeker mt-1.5 inline-block">Job Seeker</span>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex gap-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-700 bg-white/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Alerts */}
          {error && (
            <div className="alert-error mb-6 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="alert-success mb-6 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          )}

          <form onSubmit={handleSaveProfile}>
            {/* === OVERVIEW TAB === */}
            {activeTab === 'overview' && (
              <div className="max-w-2xl space-y-6">
                <div>
                  <h2 className="text-subheading mb-4">Professional Headline</h2>
                  <div className="space-y-1.5">
                    <label className="text-label text-neutral-500">Headline</label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. B.Com Graduate seeking Accounting roles in Mangalore"
                      className="field-input"
                    />
                    <p className="text-xs text-neutral-400">This appears on your profile and helps employers understand your goals.</p>
                  </div>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-0 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 border-r border-slate-200 text-center" style={{ background: '#eef2ff' }}>
                    <p className="text-2xl font-bold" style={{ color: '#4338ca' }}>{educationDetails.length}</p>
                    <p className="text-label mt-0.5" style={{ color: '#6366f1' }}>Education</p>
                  </div>
                  <div className="p-4 border-r border-slate-200 text-center" style={{ background: '#f0fdfa' }}>
                    <p className="text-2xl font-bold" style={{ color: '#0f766e' }}>{experienceDetails.length}</p>
                    <p className="text-label mt-0.5" style={{ color: '#14b8a6' }}>Experience</p>
                  </div>
                  <div className="p-4 text-center" style={{ background: '#faf5ff' }}>
                    <p className="text-2xl font-bold" style={{ color: '#7c3aed' }}>{skills.length}</p>
                    <p className="text-label mt-0.5" style={{ color: '#8b5cf6' }}>Skills</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* === EDUCATION TAB === */}
            {activeTab === 'education' && (
              <div className="max-w-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-subheading">Education</h2>
                  <button
                    type="button"
                    onClick={() => setShowEduForm(!showEduForm)}
                    className={showEduForm ? 'btn-secondary text-sm' : 'btn-primary text-sm'}
                  >
                    {showEduForm ? 'Cancel' : '+ Add Education'}
                  </button>
                </div>

                {showEduForm && (
                  <div className="border border-neutral-200 rounded-lg p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-black">New Education Entry</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-label text-neutral-500">School / College *</label>
                        <input type="text" value={eduSchool} onChange={(e) => setEduSchool(e.target.value)} placeholder="e.g. SDM College, Ujire" className="field-input" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-label text-neutral-500">Degree *</label>
                        <input type="text" value={eduDegree} onChange={(e) => setEduDegree(e.target.value)} placeholder="e.g. B.Com, M.Sc, B.Tech" className="field-input" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-label text-neutral-500">Field of Study *</label>
                      <input type="text" value={eduField} onChange={(e) => setEduField(e.target.value)} placeholder="e.g. Accounting, Computer Science" className="field-input" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-label text-neutral-500">Start Year *</label>
                        <input type="number" value={eduStart} onChange={(e) => setEduStart(e.target.value)} placeholder="2020" className="field-input" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-label text-neutral-500">End Year *</label>
                        <input type="number" value={eduEnd} onChange={(e) => setEduEnd(e.target.value)} placeholder="2023" className="field-input" />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={handleAddEducation} className="btn-primary text-sm">Save Entry</button>
                      <button type="button" onClick={() => setShowEduForm(false)} className="btn-secondary text-sm">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Education list */}
                {educationDetails.length > 0 ? (
                  <div className="divide-y divide-neutral-100">
                    {educationDetails.map((edu, index) => (
                      <div key={index} className="py-4 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-black">{edu.degree} — {edu.fieldOfStudy}</p>
                          <p className="text-sm text-neutral-500 mt-0.5">{edu.school}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">{edu.startYear} – {edu.endYear}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteEducation(index)}
                          className="text-xs text-neutral-400 hover:text-red-600 transition-colors cursor-pointer flex-shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center border border-dashed border-neutral-200 rounded-lg">
                    <p className="text-sm text-neutral-400">No education history added yet.</p>
                    <p className="text-xs text-neutral-400 mt-1">Click "Add Education" to get started.</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            )}

            {/* === EXPERIENCE TAB === */}
            {activeTab === 'experience' && (
              <div className="max-w-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-subheading">Work Experience</h2>
                  <button
                    type="button"
                    onClick={() => setShowExpForm(!showExpForm)}
                    className={showExpForm ? 'btn-secondary text-sm' : 'btn-primary text-sm'}
                  >
                    {showExpForm ? 'Cancel' : '+ Add Experience'}
                  </button>
                </div>

                {showExpForm && (
                  <div className="border border-neutral-200 rounded-lg p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-black">New Work Experience</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-label text-neutral-500">Company *</label>
                        <input type="text" value={expCompany} onChange={(e) => setExpCompany(e.target.value)} placeholder="e.g. Mangalore Logistics" className="field-input" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-label text-neutral-500">Role / Title *</label>
                        <input type="text" value={expRole} onChange={(e) => setExpRole(e.target.value)} placeholder="e.g. Accounts Executive" className="field-input" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-label text-neutral-500">Start Year *</label>
                        <input type="number" value={expStart} onChange={(e) => setExpStart(e.target.value)} placeholder="2022" className="field-input" />
                      </div>
                      {!expCurrent && (
                        <div className="space-y-1.5">
                          <label className="text-label text-neutral-500">End Year *</label>
                          <input type="number" value={expEnd} onChange={(e) => setExpEnd(e.target.value)} placeholder="2024" className="field-input" />
                        </div>
                      )}
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={expCurrent}
                        onChange={(e) => setExpCurrent(e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-300"
                      />
                      <span className="text-sm text-neutral-700">I currently work here</span>
                    </label>
                    <div className="space-y-1.5">
                      <label className="text-label text-neutral-500">Description</label>
                      <textarea
                        rows={3}
                        value={expDesc}
                        onChange={(e) => setExpDesc(e.target.value)}
                        placeholder="Describe your responsibilities and key achievements..."
                        className="field-input resize-none"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={handleAddExperience} className="btn-primary text-sm">Save Entry</button>
                      <button type="button" onClick={() => setShowExpForm(false)} className="btn-secondary text-sm">Cancel</button>
                    </div>
                  </div>
                )}

                {experienceDetails.length > 0 ? (
                  <div className="divide-y divide-neutral-100">
                    {experienceDetails.map((exp, index) => (
                      <div key={index} className="py-4 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-black">{exp.role}</p>
                          <p className="text-sm text-neutral-500 mt-0.5">{exp.company}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">{exp.startYear} – {exp.endYear}</p>
                          {exp.description && (
                            <p className="text-xs text-neutral-500 mt-2 leading-relaxed max-w-md">{exp.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteExperience(index)}
                          className="text-xs text-neutral-400 hover:text-red-600 transition-colors cursor-pointer flex-shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center border border-dashed border-neutral-200 rounded-lg">
                    <p className="text-sm text-neutral-400">No work experience added yet.</p>
                    <p className="text-xs text-neutral-400 mt-1">Click "Add Experience" to get started.</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            )}

            {/* === SKILLS TAB === */}
            {activeTab === 'skills' && (
              <div className="max-w-2xl space-y-6">
                <h2 className="text-subheading">Skills & Keywords</h2>

                <div className="space-y-1.5">
                  <label className="text-label text-neutral-500">Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                    placeholder="e.g. Tally Prime, Excel, Customer Relations, GST Filing"
                    className="field-input"
                  />
                  <p className="text-xs text-neutral-400">Add as many skills as relevant. Separate each with a comma.</p>
                </div>

                {skills.length > 0 && (
                  <div>
                    <p className="text-label text-slate-500 mb-2">Preview</p>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((skill, i) => (
                        <span key={i} className="tag tag-cat-it">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? 'Saving...' : 'Save Skills'}
                  </button>
                </div>
              </div>
            )}

            {/* === CONTACT TAB === */}
            {activeTab === 'contact' && (
              <div className="max-w-2xl space-y-6">
                <h2 className="text-subheading">Contact Information</h2>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-label text-neutral-500">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className="field-input"
                    />
                    <p className="text-xs text-neutral-400">This will be visible to employers who view your profile.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-label text-neutral-500">Portfolio / LinkedIn URL</label>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/yourname"
                      className="field-input"
                    />
                  </div>
                </div>

                <div className="border-t border-neutral-100 pt-4">
                  <p className="text-label text-neutral-400 mb-2">Account Email</p>
                  <p className="text-sm text-neutral-600">{user?.email}</p>
                  <p className="text-xs text-neutral-400 mt-1">Your email is managed through Google Sign-In and cannot be changed here.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? 'Saving...' : 'Save Contact'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
