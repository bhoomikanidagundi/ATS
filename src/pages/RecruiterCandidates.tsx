import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { 
  Users, Search, Loader2, Clock, CheckCircle, XCircle, 
  Mail, Calendar, Filter, ArrowUpRight, FileText,
  MapPin, Briefcase
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Application {
  id: string;
  job_id: string;
  job_title: string;
  user_id: string;
  candidate_name: string;
  candidate_email: string;
  status: 'applied' | 'shortlisted' | 'interview' | 'rejected';
  match_score: number;
  applied_at: string;
  current_location?: string;
  notice_period?: string;
  total_experience?: string;
  current_salary?: string;
  parsed_skills?: string[];
  parsed_education?: any[];
  parsed_experience?: any[];
}

export default function RecruiterCandidates() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const initialJobId = searchParams.get('job_id') || '';
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const apiUrl = import.meta.env.VITE_APP_URL || '';
        const res = await fetch(`${apiUrl}/api/applications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setApplications(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCandidates();
  }, [token]);

  const filteredCandidates = applications.filter(app => {
    const matchesJobId = selectedJobId === '' || app.job_id === selectedJobId;
    const matchesSearch = app.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         app.job_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || app.status === filterStatus;
    return matchesJobId && matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded uppercase tracking-widest">
            Talent Pool
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none transition-colors uppercase">
          Candidates
        </h1>
        <p className="text-slate-500 font-medium mt-2 text-lg">Browse and manage all applicants across your active job postings.</p>
        
        {selectedJobId && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Filtering for: {applications.find(a => a.job_id === selectedJobId)?.job_title || selectedJobId}
            </span>
            <button 
              onClick={() => setSelectedJobId('')}
              className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black uppercase hover:bg-indigo-100 transition-colors"
            >
              Clear Filter
            </button>
          </div>
        )}
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search candidates or jobs..." 
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <select 
            className="px-6 py-4 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-2xl font-black text-sm text-slate-900 dark:text-white focus:outline-none transition-all uppercase tracking-widest"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="applied">New</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview">Interview</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 font-bold uppercase tracking-widest">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-indigo-600" />
          <p>Loading Candidates...</p>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-[32px] p-16 text-center shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] transition-colors">
          <Users className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-6" />
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase">No candidates found</h3>
          <p className="text-slate-500 font-medium">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredCandidates.map((app) => (
            <div key={app.id} className="group bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-[32px] p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(15,23,42,0.5)] transition-all hover:translate-x-1 hover:-translate-y-1">
              <div className="flex flex-col gap-8">
                {/* Header Info */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/30 rounded-[20px] flex items-center justify-center border-2 border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-black text-2xl shadow-sm">
                      {app.candidate_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{app.candidate_name}</h4>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Mail className="w-3 h-3" /> {app.candidate_email}
                        </p>
                        <span className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full hidden sm:block"></span>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Calendar className="w-3 h-3" /> Applied {new Date(app.applied_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-300 text-[10px] font-black rounded uppercase tracking-widest">
                          {app.job_title}
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border shadow-sm",
                          app.status === 'applied' ? 'text-blue-600 bg-blue-50 border-blue-100' :
                          app.status === 'shortlisted' ? 'text-indigo-600 bg-indigo-50 border-indigo-100' :
                          app.status === 'interview' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                          'text-rose-600 bg-rose-50 border-rose-100'
                        )}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-950 px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
                    <div className="text-center pr-6 border-r-2 border-slate-100 dark:border-slate-800">
                      <p className={cn(
                        "text-3xl font-black leading-none mb-1",
                        app.match_score >= 80 ? 'text-emerald-500' : app.match_score >= 60 ? 'text-amber-500' : 'text-rose-500'
                      )}>{app.match_score}%</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Match</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-3 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all border-2 border-slate-200 dark:border-slate-800 shadow-sm">
                        <FileText className="w-5 h-5" />
                      </button>
                      <button className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-[4px_4px_0px_0px_rgba(49,46,129,1)]">
                        <ArrowUpRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Key Candidate Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Location</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-indigo-500" /> {app.current_location || 'Not found'}
                      </p>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Experience</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Briefcase className="w-3 h-3 text-indigo-500" /> {app.total_experience || 'Not found'}
                      </p>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Notice Period</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-3 h-3 text-indigo-500" /> {app.notice_period || 'Not found'}
                      </p>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Salary</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {app.current_salary || 'Not found'}
                      </p>
                   </div>
                </div>

                {/* Skills & Education */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t-2 border-slate-50 dark:border-slate-800/50">
                  <div>
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Filter className="w-3 h-3" /> Key Skills
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(app.parsed_skills) ? app.parsed_skills.slice(0, 8).map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400">
                          {skill}
                        </span>
                      )) : <p className="text-xs text-slate-400">No skills parsed</p>}
                      {Array.isArray(app.parsed_skills) && app.parsed_skills.length > 8 && (
                        <span className="text-[10px] font-bold text-slate-400 flex items-center">+{app.parsed_skills.length - 8} more</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FileText className="w-3 h-3" /> Education
                    </h5>
                    <div className="space-y-3">
                      {Array.isArray(app.parsed_education) ? app.parsed_education.slice(0, 2).map((edu, i) => (
                        <div key={i} className="flex flex-col">
                          <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">{edu.degree}</p>
                          <p className="text-[10px] font-bold text-slate-400">{edu.institution} • {edu.year}</p>
                        </div>
                      )) : <p className="text-xs text-slate-400">No education parsed</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
