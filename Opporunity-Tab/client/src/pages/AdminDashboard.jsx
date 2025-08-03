import axios from 'axios';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [form, setForm] = useState({
    jobTitle: '',
    jobDescription: '',
    companyName: '',
    skillsRequired: '',
    marks10th: '',
    marks12th: '',
    collegeCgpa: '',
  });

  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const userEmail = localStorage.getItem('user-email');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('https://server-opportunity.onrender.com/resumes');
      setUsers(res.data);
    } catch (error) {
      alert('Failed to fetch users');
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await axios.get('https://server-opportunity.onrender.com/jobs');
      const postedByThisAdmin = res.data.filter((job) => job.postedBy === userEmail);
      setJobs(postedByThisAdmin);
    } catch (error) {
      alert('Failed to fetch jobs');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchJobs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const postedBy = localStorage.getItem('user-email');

    try {
      await axios.post('https://server-opportunity.onrender.com/jobs', { ...form, postedBy });
      alert('Job posted successfully!');
      setForm({
        jobTitle: '',
        jobDescription: '',
        companyName: '',
        skillsRequired: '',
        marks10th: '',
        marks12th: '',
        collegeCgpa: '',
      });
      fetchJobs();
    } catch (error) {
      alert('Failed to post job');
    }
  };

  const getRecommendedUsers = (job) => {
    return users.filter((user) => {
      const [tenth = 0, twelfth = 0, cgpa = 0] = user.academic
        ?.map((line) => {
          const match = line.match(/([\d.]+)/g);
          return match ? parseFloat(match[match.length - 1]) : 0;
        }) || [];

      return (
        tenth >= job.marks10th &&
        twelfth >= job.marks12th &&
        cgpa >= job.collegeCgpa
      );
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-4xl font-bold mb-6 text-green-700 text-center">
        Admin Dashboard - Post a Job
      </h2>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
        <input
          name="jobTitle"
          value={form.jobTitle}
          onChange={handleChange}
          placeholder="Job Title"
          required
          className="w-full p-3 border rounded"
        />
        <textarea
          name="jobDescription"
          value={form.jobDescription}
          onChange={handleChange}
          placeholder="Job Description"
          required
          className="w-full p-3 border rounded"
          rows={4}
        />
        <input
          name="companyName"
          value={form.companyName}
          onChange={handleChange}
          placeholder="Company Name"
          required
          className="w-full p-3 border rounded"
        />
        <input
          name="skillsRequired"
          value={form.skillsRequired}
          onChange={handleChange}
          placeholder="Skills Required (comma separated)"
          required
          className="w-full p-3 border rounded"
        />
        <input
          name="marks10th"
          value={form.marks10th}
          onChange={handleChange}
          placeholder="10th Marks %"
          type="number"
          min="0"
          max="100"
          required
          className="w-full p-3 border rounded"
        />
        <input
          name="marks12th"
          value={form.marks12th}
          onChange={handleChange}
          placeholder="12th Marks %"
          type="number"
          min="0"
          max="100"
          required
          className="w-full p-3 border rounded"
        />
        <input
          name="collegeCgpa"
          value={form.collegeCgpa}
          onChange={handleChange}
          placeholder="College CGPA"
          type="number"
          step="0.01"
          min="0"
          max="10"
          required
          className="w-full p-3 border rounded"
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700 transition"
        >
          Post Job
        </button>
      </form>

      {/* All Users Section */}
      <h2 className="text-3xl font-bold mt-10 mb-6 text-blue-700 text-center">All Users</h2>
      {users.length === 0 ? (
        <p className="text-center text-gray-600">No users found.</p>
      ) : (
        <div className="space-y-6">
          {users.map((user, idx) => (
            <div key={idx} className="border p-4 rounded shadow bg-white">
              <p><strong>Name:</strong> {user.name || 'N/A'}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Skills:</strong> {user.skills?.join(', ') || 'N/A'}</p>
              <p><strong>Academics:</strong></p>
              <ul className="list-disc list-inside ml-4">
                {(user.academic && user.academic.length > 0) 
                  ? user.academic.map((item, i) => <li key={i}>{item}</li>)
                  : <li>N/A</li>
                }
              </ul>
            </div>
          ))}
        </div>
      )}
     
      {/* --- Recommended Users --- */}
      <h2 className="text-3xl font-bold mt-10 mb-6 text-purple-700 text-center">
        Recommended Users Based on Your Posted Jobs
      </h2>
      {jobs.length === 0 ? (
        <p className="text-center text-gray-600">No jobs posted by you yet.</p>
      ) : (
        <div className="space-y-10">
          {jobs.map((job, jIdx) => {
            const matchedUsers = getRecommendedUsers(job);
            return (
              <div key={jIdx} className="bg-gray-50 p-4 rounded shadow">
                <h3 className="text-xl font-semibold mb-2 text-green-800">
                  {job.jobTitle} @ {job.companyName}
                </h3>
                {matchedUsers.length === 0 ? (
                  <p className="text-gray-500">No matching candidates found.</p>
                ) : (
                  matchedUsers.map((user, uIdx) => (
                    <div key={uIdx} className="border p-3 my-2 rounded bg-white">
                      <p><strong>Name:</strong> {user.name || 'N/A'}</p>
                      <p><strong>Email:</strong> {user.email}</p>
                      <p><strong>Skills:</strong> {user.skills?.join(', ') || 'N/A'}</p>
                      <p><strong>Academics:</strong></p>
                      <ul className="list-disc list-inside ml-4">
                        {(user.academic && user.academic.length > 0)
                          ? user.academic.map((item, i) => <li key={i}>{item}</li>)
                          : <li>N/A</li>
                        }
                      </ul>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}