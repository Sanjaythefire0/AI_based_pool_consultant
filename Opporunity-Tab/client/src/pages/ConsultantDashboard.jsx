import axios from 'axios';
import { useEffect, useState } from 'react';

export default function ConsultantDashboard() {
  const [jobs, setJobs] = useState([]);
  const [resumeDetails, setResumeDetails] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [qualificationOnlyJobs, setQualificationOnlyJobs] = useState([]); // NEW STATE

  const email = localStorage.getItem('user-email');

  useEffect(() => {
    axios.get('https://server-opportunity.onrender.com/jobs')
      .then(res => setJobs(res.data))
      .catch(() => alert('Failed to fetch jobs'));

    axios.get(`https://server-opportunity.onrender.comresume/${email}`)
      .then(res => setResumeDetails(res.data))
      .catch(() => setResumeDetails(null));
  }, [email]);

  useEffect(() => {
    if (resumeDetails && jobs.length > 0) {
      const resumeSkills = (resumeDetails.skills || []).map(s => s.trim().toLowerCase());
      const academicRaw = (resumeDetails.academic || []).join(' ');

      const extractMarks = (type) => {
        if (!academicRaw) return null;

        const patternMap = {
          '10th': /10(?:th)?:?\s*([\d.]+)/i,
          '12th': /12(?:th)?:?\s*([\d.]+)/i,
          'cgpa': /(?:cgpa|b\.tech)[^\d]*([\d]+(?:\.\d+)?)/i,
        };

        const pattern = patternMap[type];
        if (!pattern) return null;

        const match = academicRaw.match(pattern);
        if (!match) return null;

        return parseFloat(match[1]);
      };

      const marks10th = extractMarks('10th');
      const marks12th = extractMarks('12th');
      const cgpa = extractMarks('cgpa');

      console.log('Extracted Marks:', { marks10th, marks12th, cgpa });
      // Match both skills and qualifications
      const filtered = jobs.filter(job => {
        const jobSkills = (job.skillsRequired || '').split(',').map(s => s.trim().toLowerCase());
        const hasSkillMatch = jobSkills.some(skill => resumeSkills.includes(skill));

        const qualifies =
          marks10th !== null && marks10th >= job.marks10th &&
          marks12th !== null && marks12th >= job.marks12th &&
          cgpa !== null && cgpa >= job.collegeCgpa;

        return hasSkillMatch && qualifies;
      });

      setRecommendedJobs(filtered);

      // NEW: Match only based on qualification
      const qualificationMatches = jobs.filter(job =>
        marks10th !== null && marks10th >= job.marks10th &&
        marks12th !== null && marks12th >= job.marks12th &&
        cgpa !== null && cgpa >= job.collegeCgpa
      );

      setQualificationOnlyJobs(qualificationMatches);
    } else {
      setRecommendedJobs([]);
      setQualificationOnlyJobs([]);
    }
  }, [resumeDetails, jobs]);

  const handleUpload = async () => {
    const email = localStorage.getItem('user-email');
    if (!email) return alert('Please log in first!');
    if (!resumeFile) return alert('Choose a resume first');

    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('email', email);

    try {
      const res = await axios.post('https://server-opportunity.onrender.com/upload-resume', formData);
      setResumeDetails(res.data);
    } catch {
      alert('Resume upload failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-blue-700 mb-4">Upload Resume</h2>
      <input
        type="file"
        accept=".pdf"
        onChange={e => setResumeFile(e.target.files[0])}
      />
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 mt-2 rounded"
      >
        Upload
      </button>

      {resumeDetails && (
        <div className="bg-white p-6 my-6 rounded-2xl shadow-md border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Extracted Resume Details</h3>
          <div className="space-y-2 text-gray-700 text-base">
            <div><span className="font-semibold">Name:</span> {resumeDetails.name}</div>
            <div><span className="font-semibold">Skills:</span> {resumeDetails.skills.join(', ')}</div>
            <div><span className="font-semibold">Summary:</span> {resumeDetails.summary}</div>
            <div>
              <span className="font-semibold">Academics:</span>
              <ul className="list-disc list-inside mt-1 ml-4">
                {resumeDetails.academic.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      <br></br>
      <br></br>
      <br></br>
      <h2 className="text-3xl font-bold mb-4 text-green-700 text-center">Recommended Jobs (Based On All Aspects)</h2>
      {recommendedJobs.length > 0 ? (
        <>
          {recommendedJobs.map(job => (
            <div key={job._id} className="border border-green-300 p-4 rounded mb-4 shadow hover:shadow-lg transition">
              <h3 className="text-2xl font-semibold mb-2">{job.jobTitle}</h3>
              <p className="mb-2"><strong>Company:</strong> {job.companyName}</p>
              <p className="mb-2"><strong>Description:</strong> {job.jobDescription}</p>
              <p className="mb-2"><strong>Skills Required:</strong> {job.skillsRequired}</p>
              <p className="mb-2">
                <strong>Requirements:</strong> 10th: {job.marks10th}%, 12th: {job.marks12th}%, CGPA: {job.collegeCgpa}
              </p>
              <p className="text-sm text-gray-500">Posted on: {new Date(job.postedAt).toLocaleDateString()}</p>
            </div>
          ))}
        </>
      ) : (
        <p className="text-center text-gray-600 my-6">No recommended jobs found based on your resume.</p>
      )}
      <br></br>
      <br></br>
      <h2 className="text-4xl font-bold mb-6 text-blue-700 text-center">All Jobs</h2>
      {jobs.length === 0 ? (
        <p className="text-center text-gray-600">No jobs posted yet.</p>
      ) : (
        jobs.map(job => (
          <div key={job._id} className="border p-4 rounded mb-4 shadow hover:shadow-lg transition">
            <h3 className="text-2xl font-semibold mb-2">{job.jobTitle}</h3>
            <p className="mb-2"><strong>Company:</strong> {job.companyName}</p>
            <p className="mb-2"><strong>Description:</strong> {job.jobDescription}</p>
            <p className="mb-2"><strong>Skills Required:</strong> {job.skillsRequired}</p>
            <p className="mb-2">
              <strong>Requirements:</strong> 10th: {job.marks10th}%, 12th: {job.marks12th}%, CGPA: {job.collegeCgpa}
            </p>
            <p className="text-sm text-gray-500">Posted on: {new Date(job.postedAt).toLocaleDateString()}</p>
          </div>
        ))
      )}

      {/* NEW SECTION BELOW ALL JOBS */}
      <h2 className="text-3xl font-bold mt-10 mb-4 text-purple-700 text-center">Recommended Jobs (Based on Qualifications Only)</h2>
      {qualificationOnlyJobs.length > 0 ? (
        qualificationOnlyJobs.map(job => (
          <div key={job._id} className="border border-purple-300 p-4 rounded mb-4 shadow hover:shadow-lg transition">
            <h3 className="text-2xl font-semibold mb-2">{job.jobTitle}</h3>
            <p className="mb-2"><strong>Company:</strong> {job.companyName}</p>
            <p className="mb-2"><strong>Description:</strong> {job.jobDescription}</p>
            <p className="mb-2"><strong>Skills Required:</strong> {job.skillsRequired}</p>
            <p className="mb-2">
              <strong>Requirements:</strong> 10th: {job.marks10th}%, 12th: {job.marks12th}%, CGPA: {job.collegeCgpa}
            </p>
            <p className="text-sm text-gray-500">Posted on: {new Date(job.postedAt).toLocaleDateString()}</p>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500">No jobs matched based on qualification alone.</p>
      )}
    </div>
  );
}
