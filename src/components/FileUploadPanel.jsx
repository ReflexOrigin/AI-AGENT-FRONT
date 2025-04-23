// FileUploadPanel component 
import { useState } from 'react';

const CATEGORIES = [
  'Invoices',
  'Reports',
  'Contracts',
  'Statements',
  'Receipts',
  'Tax Documents',
  'Other'
];

const FileUploadPanel = ({ onSubmit }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [success, setSuccess] = useState('');
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) return;
    
    try {
      const result = await onSubmit(selectedFile, category);
      
      setSuccess(`File "${selectedFile.name}" uploaded successfully!`);
      
      // Update the list of uploaded files
      if (result.document) {
        setUploadedFiles(prev => [...prev, {
          id: result.document.id,
          title: result.document.title || selectedFile.name,
          category: result.document.category || category,
          date: result.document.date || new Date().toISOString().split('T')[0]
        }]);
      }
      
      // Reset file input
      setSelectedFile(null);
      e.target.reset();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error uploading file:', err);
    }
  };
  
  return (
    <div className="w-full">
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p>{success}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">
            Select File
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.docx,.xlsx,.csv,.txt"
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Accepted formats: PDF, DOCX, XLSX, CSV, TXT
          </p>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">
            Document Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        
        <button
          type="submit"
          disabled={!selectedFile}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300"
        >
          Upload & Ingest
        </button>
      </form>
      
      {uploadedFiles.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-2">Uploaded Documents</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">Title</th>
                  <th className="py-2 px-4 border-b text-left">Category</th>
                  <th className="py-2 px-4 border-b text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {uploadedFiles.map((file, idx) => (
                  <tr key={file.id || idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-2 px-4 border-b">{file.title}</td>
                    <td className="py-2 px-4 border-b">{file.category}</td>
                    <td className="py-2 px-4 border-b">{file.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadPanel;