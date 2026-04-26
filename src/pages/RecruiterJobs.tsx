import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { 
  Briefcase, Plus, Search, Loader2, MapPin, 
  Calendar, Users, BarChart3, Edit, Trash2, 
  ChevronRight, AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Job {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  experience_required: string;
  location: string;
  created_at: string;
  applicant_count?: number;
}

export default function RecruiterJobs() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  // Form State
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    required_skills: '',
    experience_required: '',
    work_type: 'Remote',
    specific_location: '',
    salary: ''
  });
  const [showDraftSaved, setShowDraftSaved] = useState(false);

  // Load Draft
  useEffect(() => {
    const saved = localStorage.getItem('job_creation_draft');
    if (saved) {
      try {
        setNewJob(JSON.parse(saved));
      } catch (e) { console.error("Job draft load error", e); }
    }
  }, []);

  // Save Draft
  useEffect(() => {
    // Only save if some content exists
    if (newJob.title || newJob.description) {
      localStorage.setItem('job_creation_draft', JSON.stringify(newJob));
      setShowDraftSaved(true);
      const timer = setTimeout(() => setShowDraftSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [newJob]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const apiUrl = import.meta.env.VITE_APP_URL || '';
        const [jobsRes, appsRes] = await Promise.all([
          fetch(`${apiUrl}/api/jobs`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiUrl}/api/applications`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          const appsData = await appsRes.json();
          
          const jobsWithCounts = jobsData.map((job: any) => ({
            ...job,
            applicant_count: appsData.filter((a: any) => a.job_id === job.id).length
          }));
          
          setJobs(jobsWithCounts);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, [token]);

  const handleSubmitJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiUrl = import.meta.env.VITE_APP_URL || '';
      const url = isEditing ? `${apiUrl}/api/jobs/${editingJobId}` : `${apiUrl}/api/jobs`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newJob,
          location: newJob.work_type === 'Remote' ? 'Remote' : `${newJob.work_type} (${newJob.specific_location})`,
          required_skills: newJob.required_skills.split(',').map(s => s.trim())
        })
      });

      if (res.ok) {
        setShowCreateModal(false);
        setIsEditing(false);
        setEditingJobId(null);
        setNewJob({ title: '', description: '', required_skills: '', experience_required: '', work_type: 'Remote', specific_location: '', salary: '' });
        localStorage.removeItem('job_creation_draft'); // Clear draft on success
        // Refresh
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditClick = (job: Job) => {
    let work_type = 'Remote';
    let specific_location = '';
    
    const loc = job.location || 'Remote';
    if (loc.includes(' (')) {
      const parts = loc.split(' (');
      work_type = parts[0];
      specific_location = parts[1].replace(')', '');
    } else {
      work_type = loc;
    }

    setNewJob({
      title: job.title,
      description: job.description,
      required_skills: job.required_skills.join(', '),
      experience_required: job.experience_required,
      work_type: work_type as any,
      specific_location: specific_location,
      salary: (job as any).salary || ''
    });
    setEditingJobId(job.id);
    setIsEditing(true);
    setShowCreateModal(true);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      const apiUrl = import.meta.env.VITE_APP_URL || '';
      const res = await fetch(`${apiUrl}/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded uppercase tracking-widest">
              Job Management
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none transition-colors uppercase">
            Active Jobs
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">Create and manage your organization's open positions.</p>
        </div>
        <button 
          onClick={() => {
            setIsEditing(false);
            setEditingJobId(null);
            setNewJob({ title: '', description: '', required_skills: '', experience_required: '', work_type: 'Remote', specific_location: '', salary: '' });
            setShowCreateModal(true);
          }}
          className="px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all uppercase tracking-widest text-xs flex items-center gap-2 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(49,46,129,0.5)] active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          <Plus className="w-5 h-5" /> Create New Job
        </button>
      </header>

      <div className="mb-8">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search your jobs..." 
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 font-bold uppercase tracking-widest">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-indigo-600" />
          <p>Loading Jobs...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-[32px] p-16 text-center shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] transition-colors">
          <Briefcase className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-6" />
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase">No jobs found</h3>
          <p className="text-slate-500 font-medium">Click "Create New Job" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <div key={job.id} className="group bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-[32px] p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(15,23,42,0.5)] transition-all hover:translate-x-1 hover:-translate-y-1 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-black rounded uppercase tracking-widest">Active</span>
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2 relative z-10">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(job);
                    }}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    title="Edit Job"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteJob(job.id);
                    }}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    title="Delete Job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight group-hover:text-indigo-600 transition-colors">{job.title}</h3>
               <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mb-6">
                 <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location || 'Remote'}</span>
                 <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {job.applicant_count} Applicants</span>
              </div>

              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium line-clamp-2 mb-8 flex-1">
                {job.description}
              </p>

              <div className="flex items-center justify-between pt-6 border-t-2 border-slate-50 dark:border-slate-800/50 mt-auto">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-300">
                    +{Math.max(0, (job.applicant_count || 0) - 3)}
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/recruiter-candidates?job_id=${job.id}`)}
                  className="flex items-center gap-2 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors uppercase tracking-widest"
                >
                  View Pipeline <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border-4 border-slate-900 dark:border-slate-800 rounded-[40px] p-8 w-full max-w-2xl shadow-[16px_16px_0px_0px_rgba(15,23,42,1)] animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase mb-2 tracking-tight">
              {isEditing ? 'Edit Position' : 'Create New Position'}
            </h3>
            <p className="text-slate-500 font-medium mb-1">
              {isEditing ? 'Update the details of this role.' : 'Define the role and target skills to find the perfect match.'}
            </p>
            <div className={cn(
              "mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-opacity duration-500",
              showDraftSaved ? "text-emerald-500 opacity-100" : "text-transparent opacity-0"
            )}>
              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
              Draft Saved
            </div>
            
            <form onSubmit={handleSubmitJob} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Job Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500"
                    value={newJob.title}
                    onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Experience Required</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. 5+ years"
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500"
                    value={newJob.experience_required}
                    onChange={(e) => setNewJob({...newJob, experience_required: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Annual Salary (RS.)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 15,00,000"
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500"
                    value={newJob.salary}
                    onChange={(e) => setNewJob({...newJob, salary: e.target.value})}
                  />
                  <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">* This is only visible to you, not candidates.</p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Work Type</label>
                <div className="flex gap-4">
                  {['Remote', 'Hybrid', 'On-site'].map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setNewJob({...newJob, work_type: loc as any})}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border-2",
                        newJob.work_type === loc 
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-[4px_4px_0px_0px_rgba(49,46,129,1)]" 
                          : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-indigo-200"
                      )}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {newJob.work_type !== 'Remote' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Specific Location (City)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Mumbai, Maharashtra"
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500"
                    value={newJob.specific_location}
                    onChange={(e) => setNewJob({...newJob, specific_location: e.target.value})}
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Job Description</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Describe the role, responsibilities, and team..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500"
                  value={newJob.description}
                  onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Required Skills (Comma separated)</label>
                <input 
                  type="text" 
                  required
                  placeholder="React, TypeScript, Tailwind CSS..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-4 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500"
                  value={newJob.required_skills}
                  onChange={(e) => setNewJob({...newJob, required_skills: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black text-slate-500 dark:text-slate-400 uppercase text-xs tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-[4px_4px_0px_0px_rgba(49,46,129,1)] transition-all flex items-center justify-center gap-2"
                >
                  {isEditing ? 'Save Changes' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
